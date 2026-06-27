const STORAGE_KEY = "carvaluation.records.v1";
const API_URL = "https://script.google.com/macros/s/AKfycbx83aRvR1MpZwqlTKKHyfej-aSJOrIPUI4aRlvX7Qy81Owz-9VxjYjCL3pRKzewkQu6/exec";
const CUSTOM_SOURCE = "自行輸入";
const FIXED_SOURCES = ["來店", "網站", "自買"];

const fieldNames = [
  "sourceType",
  "sourceCustom",
  "receivedDate",
  "year",
  "model",
  "km",
  "color",
  "condition",
  "version",
  "authority",
  "quote",
  "purchasePrice",
  "actualDealPrice",
  "salePrice",
  "remarks",
  "repairItems",
  "seller",
  "bonus",
];

const sheetHeaders = [
  "id",
  "source",
  "receivedDate",
  "boughtDate",
  "year",
  "model",
  "km",
  "color",
  "condition",
  "version",
  "authority",
  "quote",
  "purchasePrice",
  "actualDealPrice",
  "salePrice",
  "remarks",
  "repairItems",
  "seller",
  "bonus",
  "isPurchased",
  "createdAt",
  "updatedAt",
];

const fields = Object.fromEntries(fieldNames.map((name) => [name, document.querySelector(`#${name}`)]));
fields.recordId = document.querySelector("#recordId");

const form = document.querySelector("#valuationForm");
const submitButton = document.querySelector("#submitButton");
const resetButton = document.querySelector("#resetButton");
const searchInput = document.querySelector("#searchInput");
const sourceCustomWrap = document.querySelector("#sourceCustomWrap");
const receivedDateWrap = document.querySelector("#receivedDateWrap");
const ongoingBody = document.querySelector("#ongoingBody");
const purchasedBody = document.querySelector("#purchasedBody");
const ongoingEmpty = document.querySelector("#ongoingEmpty");
const purchasedEmpty = document.querySelector("#purchasedEmpty");
const ongoingCount = document.querySelector("#ongoingCount");
const purchasedCount = document.querySelector("#purchasedCount");
const buyDialog = document.querySelector("#buyDialog");
const buyForm = document.querySelector("#buyForm");
const buyRecordId = document.querySelector("#buyRecordId");
const buyDate = document.querySelector("#buyDate");
const buyActualDealPrice = document.querySelector("#buyActualDealPrice");
const cancelBuyButton = document.querySelector("#cancelBuyButton");
const purchasedDateFrom = document.querySelector("#purchasedDateFrom");
const purchasedDateTo = document.querySelector("#purchasedDateTo");
const clearPurchasedDateFilter = document.querySelector("#clearPurchasedDateFilter");
const printPurchasedButton = document.querySelector("#printPurchasedButton");

let records = loadLocalRecords();

function loadLocalRecords() {
  try {
    const savedRecords = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
    return savedRecords.map(normalizeRecord);
  } catch {
    return [];
  }
}

function normalizeBoolean(value) {
  return value === true || String(value).toLowerCase() === "true" || value === "是";
}

function cleanSheetText(value) {
  if (value === "" || value === null || value === undefined) return "";
  return String(value).replace(/^'/, "");
}

function normalizeRecord(record) {
  const rawSource = cleanSheetText(record.source || "");
  const normalizedSource = rawSource === "估價網站" ? "網站" : rawSource;
  const sourceType = record.sourceType || (FIXED_SOURCES.includes(normalizedSource) ? normalizedSource : normalizedSource ? CUSTOM_SOURCE : "");
  const sourceCustom = cleanSheetText(record.sourceCustom || (sourceType === CUSTOM_SOURCE ? normalizedSource : ""));

  return {
    id: cleanSheetText(record.id) || createId(),
    sourceType,
    sourceCustom,
    receivedDate: normalizeDateText(cleanSheetText(record.receivedDate || record.date || "")),
    boughtDate: normalizeDateText(cleanSheetText(record.boughtDate || "")),
    year: cleanSheetText(record.year),
    model: cleanSheetText(record.model),
    km: normalizeKm(cleanSheetText(record.km || record.mileage || "")),
    color: cleanSheetText(record.color),
    condition: cleanSheetText(record.condition),
    version: cleanSheetText(record.version),
    authority: cleanSheetText(record.authority),
    quote: cleanSheetText(record.quote),
    purchasePrice: cleanSheetText(record.purchasePrice),
    actualDealPrice: cleanSheetText(record.actualDealPrice),
    salePrice: cleanSheetText(record.salePrice),
    remarks: cleanSheetText(record.remarks || record.notes || ""),
    repairItems: cleanSheetText(record.repairItems),
    seller: cleanSheetText(record.seller || record.location || [record.sellerName, record.sellerPhone].filter(Boolean).join(" ")),
    bonus: cleanSheetText(record.bonus),
    isPurchased: normalizeBoolean(record.isPurchased),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || new Date().toISOString(),
  };
}

function saveLocalRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function normalizeKm(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number > 1000 ? String(Math.round((number / 10000) * 10) / 10) : String(number);
}

function normalizeDateText(value) {
  if (!value) return "";
  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (!match) return text;
  return `${Number(match[2])}/${Number(match[3])}`;
}

function toDateInputValue(value) {
  if (!value) return "";
  const text = String(value).trim();
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;

  const shortDate = text.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!shortDate) return "";

  const year = new Date().getFullYear();
  const month = shortDate[1].padStart(2, "0");
  const day = shortDate[2].padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(value) {
  if (!value) return "";
  const text = String(value).trim();
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!isoDate) return text;
  return `${Number(isoDate[2])}/${Number(isoDate[3])}`;
}

function formatFullDateForDisplay(value) {
  if (!value) return "";
  const text = String(value).trim();
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!isoDate) return text;
  return `${isoDate[1]}/${isoDate[2]}/${isoDate[3]}`;
}

function dateValueToNumber(value) {
  const inputValue = toDateInputValue(value);
  if (!inputValue) return null;
  return Number(inputValue.replaceAll("-", ""));
}

function getSourceLabel(record) {
  return record.sourceType === CUSTOM_SOURCE ? record.sourceCustom : record.sourceType;
}

function asSheetText(value) {
  if (value === "" || value === null || value === undefined) return "";
  return String(value);
}

function toSheetRecord(record) {
  const normalized = normalizeRecord(record);
  const sheetRecord = {
    ...normalized,
    source: getSourceLabel(normalized),
    isPurchased: normalized.isPurchased ? "TRUE" : "FALSE",
  };

  return Object.fromEntries(
    sheetHeaders.map((header) => {
      const value = sheetRecord[header] ?? "";
      if (header === "id" || header === "isPurchased") return [header, value];
      return [header, asSheetText(value)];
    }),
  );
}

async function apiGetRecords() {
  const response = await fetch(API_URL, { method: "GET" });
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "讀取 Google Sheet 失敗");
  return (data.records || []).map(normalizeRecord);
}

async function apiPost(action, payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "寫入 Google Sheet 失敗");
  return data;
}

async function syncFromCloud() {
  try {
    const cloudRecords = await apiGetRecords();
    records = cloudRecords;
    saveLocalRecords();
    render();
  } catch (error) {
    console.warn(error);
    alert("讀取 Google Sheet 失敗，目前先顯示本機暫存資料。");
  }
}

async function persistCreate(record) {
  try {
    const result = await apiPost("create", { record: toSheetRecord(record) });
    return normalizeRecord(result.record || record);
  } catch (error) {
    console.warn(error);
    alert("寫入 Google Sheet 失敗，資料已先暫存在這台瀏覽器。");
    return record;
  }
}

async function persistUpdate(record) {
  try {
    const result = await apiPost("update", { record: toSheetRecord(record) });
    return normalizeRecord(result.record || record);
  } catch (error) {
    console.warn(error);
    alert("更新 Google Sheet 失敗，修改已先暫存在這台瀏覽器。");
    return record;
  }
}

async function persistDelete(id) {
  try {
    await apiPost("delete", { id });
  } catch (error) {
    console.warn(error);
    alert("刪除 Google Sheet 資料失敗，這台瀏覽器會先移除顯示。");
  }
}

function updateSourceCustomVisibility() {
  const shouldShow = fields.sourceType.value === CUSTOM_SOURCE;
  sourceCustomWrap.classList.toggle("is-hidden", !shouldShow);
  fields.sourceCustom.disabled = !shouldShow;
  if (!shouldShow) fields.sourceCustom.value = "";
}

function getFormData() {
  const data = {
    id: fields.recordId.value || createId(),
    updatedAt: new Date().toISOString(),
  };

  for (const name of fieldNames) {
    data[name] = fields[name].value.trim();
  }

  if (data.sourceType !== CUSTOM_SOURCE) {
    data.sourceCustom = "";
  }

  data.km = normalizeKm(data.km);
  return data;
}

function setFormData(record) {
  fields.recordId.value = record.id;
  for (const name of fieldNames) {
    if (name === "km") {
      fields[name].value = normalizeKm(record[name]);
    } else if (name === "receivedDate") {
      fields[name].value = toDateInputValue(record[name]);
    } else {
      fields[name].value = record[name] || "";
    }
  }
  updateSourceCustomVisibility();
  submitButton.textContent = "儲存修改";
  fields.sourceType.focus();
}

function resetForm() {
  form.reset();
  fields.recordId.value = "";
  submitButton.textContent = "新增資料";
  updateSourceCustomVisibility();
}

function getFilteredRecords() {
  const keyword = searchInput.value.trim().toLowerCase();
  if (!keyword) return records;

  return records.filter((record) =>
    [
      getSourceLabel(record),
      ...fieldNames.map((name) => record[name]),
      record.boughtDate,
      record.isPurchased ? "已買入" : "估價進行中",
    ]
      .join(" ")
      .toLowerCase()
      .includes(keyword),
  );
}

function sortRecords(items) {
  return [...items].sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));
}

function filterPurchasedByDate(items) {
  const from = dateValueToNumber(purchasedDateFrom.value);
  const to = dateValueToNumber(purchasedDateTo.value);
  if (!from && !to) return items;

  return items.filter((record) => {
    const boughtDate = dateValueToNumber(record.boughtDate);
    if (!boughtDate) return false;
    if (from && boughtDate < from) return false;
    if (to && boughtDate > to) return false;
    return true;
  });
}

function createCell(value, className = "") {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  cell.textContent = value || "";
  return cell;
}

function appendCommonCells(row, record) {
  row.append(
    createCell(record.year),
    createCell(record.model),
    createCell(record.km, "number-cell"),
    createCell(record.color),
    createCell(record.condition),
    createCell(record.version),
    createCell(record.authority),
    createCell(record.quote),
    createCell(record.purchasePrice),
    createCell(record.actualDealPrice),
    createCell(record.salePrice),
    createCell(record.remarks, "note-cell"),
    createCell(record.repairItems, "wide-cell"),
    createCell(record.seller),
    createCell(record.bonus),
  );
}

function createRecordRow(record) {
  const row = document.createElement("tr");
  row.className = record.isPurchased ? "is-purchased" : "";
  row.append(createCell(getSourceLabel(record)));
  row.append(createCell(formatFullDateForDisplay(record.receivedDate)));

  if (record.isPurchased) {
    row.append(createCell(formatDateForDisplay(record.boughtDate)));
  }

  appendCommonCells(row, record);

  const actionCell = document.createElement("td");
  actionCell.innerHTML = `
    <div class="row-actions">
      <button class="secondary" type="button" data-action="edit" data-id="${record.id}">編輯</button>
      <button class="purchase" type="button" data-action="toggle-purchased" data-id="${record.id}">
        ${record.isPurchased ? "取消買入" : "已買入"}
      </button>
      <button class="danger" type="button" data-action="delete" data-id="${record.id}">刪除</button>
    </div>
  `;
  row.append(actionCell);
  return row;
}

function renderRows(body, items) {
  body.innerHTML = "";
  for (const record of sortRecords(items)) {
    body.append(createRecordRow(record));
  }
}

function render() {
  const filteredRecords = getFilteredRecords();
  const ongoingRecords = filteredRecords.filter((record) => !record.isPurchased);
  const allPurchasedRecords = filteredRecords.filter((record) => record.isPurchased);
  const purchasedRecords = filterPurchasedByDate(allPurchasedRecords);

  renderRows(ongoingBody, ongoingRecords);
  renderRows(purchasedBody, purchasedRecords);

  ongoingCount.textContent = `${ongoingRecords.length} 筆`;
  purchasedCount.textContent =
    purchasedRecords.length === allPurchasedRecords.length
      ? `${purchasedRecords.length} 筆`
      : `${purchasedRecords.length} / ${allPurchasedRecords.length} 筆`;
  ongoingEmpty.classList.toggle("is-visible", ongoingRecords.length === 0);
  purchasedEmpty.classList.toggle("is-visible", purchasedRecords.length === 0);
}

function openBuyDialog(record) {
  buyRecordId.value = record.id;
  buyDate.value = toDateInputValue(record.boughtDate);
  buyActualDealPrice.value = record.actualDealPrice || "";
  buyDialog.showModal();
  buyDate.focus();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;

  const data = getFormData();
  const existingIndex = records.findIndex((record) => record.id === data.id);

  if (existingIndex >= 0) {
    const updatedRecord = normalizeRecord({ ...records[existingIndex], ...data });
    records[existingIndex] = await persistUpdate(updatedRecord);
  } else {
    const createdRecord = normalizeRecord({ ...data, isPurchased: false, createdAt: new Date().toISOString() });
    records.push(await persistCreate(createdRecord));
  }

  saveLocalRecords();
  resetForm();
  render();
  submitButton.disabled = false;
});

buyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const recordIndex = records.findIndex((item) => item.id === buyRecordId.value);
  if (recordIndex < 0) return;

  const updatedRecord = normalizeRecord({
    ...records[recordIndex],
    boughtDate: buyDate.value.trim(),
    actualDealPrice: buyActualDealPrice.value.trim(),
    isPurchased: true,
    updatedAt: new Date().toISOString(),
  });

  records[recordIndex] = await persistUpdate(updatedRecord);
  saveLocalRecords();
  render();
  buyDialog.close();
  buyForm.reset();
});

cancelBuyButton.addEventListener("click", () => {
  buyDialog.close();
  buyForm.reset();
});

fields.sourceType.addEventListener("change", updateSourceCustomVisibility);
resetButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", render);
purchasedDateFrom.addEventListener("input", render);
purchasedDateTo.addEventListener("input", render);
clearPurchasedDateFilter.addEventListener("click", () => {
  purchasedDateFrom.value = "";
  purchasedDateTo.value = "";
  render();
});
printPurchasedButton.addEventListener("click", () => {
  window.print();
});

receivedDateWrap?.addEventListener("click", (event) => {
  if (event.target === fields.receivedDate) return;
  if (typeof fields.receivedDate.showPicker === "function") {
    fields.receivedDate.showPicker();
  } else {
    fields.receivedDate.focus();
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const recordIndex = records.findIndex((item) => item.id === button.dataset.id);
  const record = records[recordIndex];
  if (!record) return;

  if (button.dataset.action === "edit") {
    setFormData(record);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (button.dataset.action === "toggle-purchased") {
    if (record.isPurchased) {
      const updatedRecord = normalizeRecord({ ...record, isPurchased: false, updatedAt: new Date().toISOString() });
      records[recordIndex] = await persistUpdate(updatedRecord);
      saveLocalRecords();
      render();
    } else {
      openBuyDialog(record);
    }
  }

  if (button.dataset.action === "delete") {
    const confirmed = confirm(`確定要刪除 ${record.model || "這筆"} 的估價資料嗎？`);
    if (!confirmed) return;
    await persistDelete(record.id);
    records = records.filter((item) => item.id !== record.id);
    saveLocalRecords();
    render();
    if (fields.recordId.value === record.id) resetForm();
  }
});

resetForm();
render();
syncFromCloud();