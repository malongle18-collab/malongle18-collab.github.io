import { getLang, t } from "./i18n.js?v=23";
import { DATA_VERSION, DEMO_HELPER } from "./data.js?v=23";
import { cleanIdNumber, normalizeDocs } from "./docs.js?v=23";
import { defaultContractEnd } from "./rules.js?v=23";
import { todayISO } from "./dates.js?v=23";
import { emptyMenu, normalizeDiet, normalizeMenu, normalizeRecipes } from "./menu.js?v=23";

export const STORAGE_KEY = "fdh-employer-v1";

function uid(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function blankHelper(overrides = {}) {
  return {
    id: uid("helper"),
    name: "",
    nationality: "philippines",
    startDate: "",
    contractStart: "",
    contractEnd: "",
    wage: 5220,
    foodProvided: true,
    foodAllowance: 1236,
    restDay: 0,
    phone: "",
    notes: "",
    dob: "",
    visaExpiry: "",
    passportExpiry: "",
    passportNo: "",
    hkidNo: "",
    docs: { passport: [], hkid: [] },
    winterChoice: "christmas",
    grantGeneralHolidays: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function demoHelper() {
  return blankHelper({
    ...DEMO_HELPER,
    id: uid("helper"),
    notes: getLang() === "en" ? DEMO_HELPER.notesEn : DEMO_HELPER.notes,
  });
}

export function emptyState() {
  return {
    version: DATA_VERSION,
    currentHelperId: null,
    helpers: [],
    leaveLogs: [],
    shStatuses: {},
    payments: [],
    reminderState: {},
    guideChecks: {},
    arrangedRestDays: {},
    workTasks: [],
    workRules: [],
    shopLists: [],
    shopItems: [],
    customReminders: [],
    priceCatalog: [],
    menu: emptyMenu(),
    recipes: [],
    helperAccess: {},
    settings: {
      notifications: false,
    },
  };
}

function migrate(raw) {
  const state = { ...emptyState(), ...(raw || {}) };
  state.version = DATA_VERSION;
  state.helpers = (Array.isArray(state.helpers) ? state.helpers : [])
    .filter((h) => h && typeof h === "object" && h.id)
    .map((h) => ({
      ...h,
      passportNo: cleanIdNumber(h.passportNo),
      hkidNo: cleanIdNumber(h.hkidNo),
      docs: normalizeDocs(h.docs),
    }));
  state.leaveLogs = Array.isArray(state.leaveLogs) ? state.leaveLogs : [];
  state.payments = (Array.isArray(state.payments) ? state.payments : [])
    .filter((p) => p && typeof p === "object" && p.id)
    .map((p) => ({ ...p, method: String(p.method || ""), consent: normalizeConsent(p.consent) }));
  state.shStatuses = state.shStatuses && typeof state.shStatuses === "object" ? state.shStatuses : {};
  state.reminderState =
    state.reminderState && typeof state.reminderState === "object" ? state.reminderState : {};
  state.guideChecks =
    state.guideChecks && typeof state.guideChecks === "object" ? state.guideChecks : {};
  state.settings = { notifications: false, employerName: "", ...(state.settings || {}) };
  state.settings.diet = normalizeDiet(state.settings.diet);
  state.settings.recentBuyDays = [0, 3, 7, 14, 30].includes(Number(state.settings.recentBuyDays)) ? Number(state.settings.recentBuyDays) : 7;
  state.arrangedRestDays =
    state.arrangedRestDays && typeof state.arrangedRestDays === "object" ? state.arrangedRestDays : {};
  state.workTasks = Array.isArray(state.workTasks) ? state.workTasks : [];
  state.workRules = Array.isArray(state.workRules) ? state.workRules : [];
  state.shopLists = (Array.isArray(state.shopLists) ? state.shopLists : [])
    .filter((l) => l && typeof l === "object" && l.id)
    .map((l) => {
      if (l.date === "" || l.date === null) return { ...l, date: "" };
      return { ...l, date: listDate(l) || todayISO() };
    });
  state.shopItems = (Array.isArray(state.shopItems) ? state.shopItems : []).map(normalizeShopItem);
  state.priceCatalog = normalizeCatalog(state.priceCatalog);
  state.recipes = normalizeRecipes(state.recipes);
  state.menu = normalizeMenu(state.menu);
  state.customReminders = (Array.isArray(state.customReminders) ? state.customReminders : [])
    .filter((r) => r && typeof r === "object" && r.id && String(r.title || "").trim())
    .map((r) => ({
      id: String(r.id),
      helperId: String(r.helperId || ""),
      title: String(r.title).trim().slice(0, 80),
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(r.date || "")) ? r.date : todayISO(),
      repeat: ["monthly", "yearly"].includes(r.repeat) ? r.repeat : "none",
      anchorDay: Number(r.anchorDay) || Number(String(r.date || "").slice(8, 10)) || 1,
      note: String(r.note || "").slice(0, 400),
      doneAt: String(r.doneAt || ""),
      createdAt: String(r.createdAt || ""),
    }));
  state.helperAccess =
    state.helperAccess && typeof state.helperAccess === "object" ? state.helperAccess : {};
  if (state.currentHelperId && !state.helpers.some((h) => h.id === state.currentHelperId)) {
    state.currentHelperId = state.helpers[0]?.id || null;
  }
  if (!state.currentHelperId && state.helpers[0]) state.currentHelperId = state.helpers[0].id;
  return state;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return migrate(JSON.parse(raw));
  } catch (err) {
    console.warn("Could not read local data", err);
    return emptyState();
  }
}

export function saveState(state) {
  const payload = JSON.stringify(state);
  localStorage.setItem(STORAGE_KEY, payload);
  return state;
}

export function exportBackup(state) {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          app: "外傭僱傭助手",
          exportedAt: new Date().toISOString(),
          data: state,
        },
        null,
        2
      ),
    ],
    { type: "application/json" }
  );
  const stamp = new Date().toISOString().slice(0, 10);
  return { blob, filename: `${t("backup.filename")}-${stamp}.json` };
}

export function importBackup(text) {
  const parsed = JSON.parse(text);
  const data = parsed.data || parsed.state || parsed;
  if (!data || typeof data !== "object") throw new Error(t("err.fileFormat"));
  if (!Array.isArray(data.helpers)) throw new Error(t("err.noHelpers"));
  return migrate(data);
}

export function currentHelper(state) {
  return state.helpers.find((h) => h.id === state.currentHelperId) || null;
}

export function shKey(helperId, date) {
  return `${helperId}:${date}`;
}

export function normalizeHelperForm(form) {
  const start = form.startDate || form.contractStart;
  const contractStart = form.contractStart || form.startDate;
  const contractEnd = form.contractEnd || defaultContractEnd(contractStart);
  return blankHelper({
    ...form,
    name: String(form.name || "").trim(),
    startDate: start,
    contractStart,
    contractEnd,
    wage: Number(form.wage) || 0,
    foodAllowance: Number(form.foodAllowance) || 0,
    foodProvided: Boolean(form.foodProvided),
    restDay:
      form.restDay === "arranged"
        ? "arranged"
        : form.restDay === "" || form.restDay == null
          ? 0
          : Number(form.restDay),
    phone: String(form.phone || "").trim(),
    notes: String(form.notes || "").trim(),
  });
}

export function newLeaveLog(partial) {
  return {
    id: uid("leave"),
    helperId: "",
    type: "annual",
    startDate: "",
    endDate: "",
    days: 1,
    note: "",
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

export function newPayment(partial) {
  return {
    id: uid("pay"),
    helperId: "",
    month: "",
    wage: 0,
    food: 0,
    adjustments: 0,
    note: "",
    paidOn: "",
    method: "",
    consent: null,
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

export function normalizeConsent(c) {
  if (!c || typeof c !== "object" || c.status !== "confirmed") return null;
  const sig = typeof c.signature === "string" && c.signature.startsWith("data:image/") ? c.signature : "";
  const by = ["helper-code", "helper-device", "in-person"].includes(c.by) ? c.by : "in-person";
  return { status: "confirmed", at: String(c.at || ""), by, signature: sig };
}


export function arrangedRestList(state, helperId) {
  const list = state.arrangedRestDays?.[helperId];
  return Array.isArray(list) ? [...list].sort() : [];
}

export function toggleArrangedRestDay(state, helperId, iso) {
  const cur = new Set(arrangedRestList(state, helperId));
  if (cur.has(iso)) cur.delete(iso);
  else cur.add(iso);
  state.arrangedRestDays = { ...(state.arrangedRestDays || {}), [helperId]: [...cur].sort() };
  return arrangedRestList(state, helperId);
}

export function newWorkTask(partial = {}) {
  return {
    id: uid("task"),
    helperId: "",
    title: "",
    detail: "",
    schedule: "daily",
    weekdays: [],
    timeFrom: "",
    timeTo: "",
    onceDate: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

export function newWorkRule(partial = {}) {
  return {
    id: uid("rule"),
    helperId: "",
    title: "",
    body: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}


export function normalizeItemName(name) {
  return String(name || "").trim().replace(/\s+/g, " ");
}

/** Name key for price history: trim, collapse spaces, full/half-width (NFKC), case-insensitive. */
export function catalogKey(name) {
  let n = String(name || "");
  try {
    n = n.normalize("NFKC");
  } catch {
    /* old engines */
  }
  return n.trim().replace(/\s+/g, " ").toLowerCase();
}

export function localDateOf(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Shopping date of a list. An explicit empty date stays empty; legacy lists without a date field fall back to completed/created day. */
export function listDate(list) {
  if (!list) return "";
  if (list.date === "" || list.date === null) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(list.date || ""))) return list.date;
  return localDateOf(list.completedAt) || localDateOf(list.createdAt) || "";
}

/** Latest-dated entry of a price history row. */
function refreshLast(row) {
  const hist = (row.history || []).filter((e) => Number.isFinite(Number(e.price)));
  hist.sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  row.history = hist.slice(-30);
  const last = row.history[row.history.length - 1];
  if (last) {
    row.lastPrice = Number(last.price);
    row.lastPaidOn = last.date || "";
  }
  return row;
}

/** Normalise stored price catalog: new keys, merged duplicates, valid entries. */
export function normalizeCatalog(list) {
  const map = new Map();
  for (const c of Array.isArray(list) ? list : []) {
    if (!c || typeof c !== "object") continue;
    const key = catalogKey(c.name || c.key);
    if (!key) continue;
    const hist = Array.isArray(c.history) ? c.history.slice() : [];
    if (!hist.length && Number.isFinite(Number(c.lastPrice))) hist.push({ price: Number(c.lastPrice), date: c.lastPaidOn || "", place: "" });
    const row = map.get(key) || { key, name: normalizeItemName(c.name || c.key), lastPrice: 0, lastPaidOn: "", history: [] };
    row.history.push(...hist.map((e) => ({ price: Number(e.price), date: String(e.date || ""), place: String(e.place || ""), listId: String(e.listId || ""), itemId: String(e.itemId || "") })));
    map.set(key, row);
  }
  return Array.from(map.values()).map(refreshLast);
}

export function findCatalog(state, name) {
  const k = catalogKey(name);
  if (!k) return null;
  return (state.priceCatalog || []).find((c) => c.key === k) || null;
}

export function recordCatalogPrice(state, name, price, whenISO, place = "", meta = {}) {
  const k = catalogKey(name);
  const amount = Number(price);
  if (!k || !Number.isFinite(amount)) return null;
  const entry = { price: amount, date: whenISO || "", place: place || "", listId: meta.listId || "", itemId: meta.itemId || "" };
  const list = Array.isArray(state.priceCatalog) ? state.priceCatalog : [];
  let row = list.find((c) => c.key === k);
  if (!row) {
    row = { key: k, name: normalizeItemName(name), lastPrice: amount, lastPaidOn: whenISO || "", history: [] };
    list.push(row);
  }
  row.name = normalizeItemName(name);
  // one entry per item: editing an item's price replaces its earlier entry
  row.history = (row.history || []).filter((e) => !(entry.itemId && e.itemId === entry.itemId));
  row.history.push(entry);
  refreshLast(row);
  state.priceCatalog = list;
  return row;
}

export function removeCatalogEntry(state, itemId) {
  if (!itemId) return;
  state.priceCatalog = (state.priceCatalog || [])
    .map((c) => ({ ...c, history: (c.history || []).filter((e) => e.itemId !== itemId) }))
    .filter((c) => c.history.length);
  state.priceCatalog = normalizeCatalog(state.priceCatalog);
}

export function newCustomReminder(partial = {}) {
  return {
    id: uid("rem"),
    helperId: "",
    title: "",
    date: todayISO(),
    repeat: "none",
    anchorDay: 0,
    note: "",
    doneAt: "",
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

export function newShopList(partial = {}) {
  return {
    id: uid("shop"),
    helperId: "",
    title: "",
    place: "market",
    status: "open",
    note: "",
    date: todayISO(),
    createdAt: new Date().toISOString(),
    completedAt: "",
    ...partial,
  };
}

export function newShopItem(partial = {}) {
  return {
    id: uid("item"),
    listId: "",
    helperId: "",
    name: "",
    note: "",
    photo: "",
    qty: "",
    suggestedPrice: null,
    paidPrice: "",
    bought: false,
    kind: "",
    recipeId: "",
    parentId: "",
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

export function normalizeShopItem(it) {
  if (!it || typeof it !== "object") return it;
  const kind = it.kind === "recipe" || it.kind === "ing" ? it.kind : "";
  return {
    ...it,
    kind,
    recipeId: String(it.recipeId || ""),
    parentId: String(it.parentId || ""),
  };
}

export function isRecipeParent(item) {
  return Boolean(item && item.kind === "recipe");
}

export function isShopLeaf(item) {
  return !isRecipeParent(item);
}



export const UI_PREFS_KEY = "fdh-ui-prefs-v1";

export const UI_NAV = {
  employer: [
    { id: "leave", labelKey: "tab.leave", icon: "leaf" },
    { id: "tasks", labelKey: "tab.tasks", icon: "checklist" },
    { id: "rules", labelKey: "tab.rules", icon: "rule" },
    { id: "shop", labelKey: "shop.title", icon: "basket" },
    { id: "menu", labelKey: "menu.title", icon: "utensils" },
    { id: "pay", labelKey: "pay.title", icon: "coin" },
    { id: "share", labelKey: "share.title", icon: "share" },
    { id: "remind", labelKey: "home.reminders", icon: "bell" },
    { id: "recipes", labelKey: "recipe.title", icon: "book" },
    { id: "helper-edit", labelKey: "more.helperData", icon: "person" },
    { id: "guide", labelKey: "more.guide", icon: "info" },
    { id: "backup", labelKey: "backup.title", icon: "download" },
  ],
  helper: [
    { id: "h-leave", labelKey: "tab.leave", icon: "leaf" },
    { id: "h-tasks", labelKey: "tab.tasks", icon: "checklist" },
    { id: "h-rules", labelKey: "tab.rules", icon: "rule" },
    { id: "h-shop", labelKey: "shop.title", icon: "basket" },
    { id: "h-menu", labelKey: "menu.title", icon: "utensils" },
    { id: "h-pay", labelKey: "pay.title", icon: "coin" },
    { id: "h-remind", labelKey: "home.reminders", icon: "bell" },
    { id: "h-recipes", labelKey: "recipe.title", icon: "book" },
    { id: "h-rights", labelKey: "hmore.rights", icon: "stamp" },
  ],
};

export const DEFAULT_NAV_TABS = {
  employer: ["leave", "tasks", "rules"],
  helper: ["h-leave", "h-tasks", "h-rules"],
};

/** Custom middle slots only. Home and More stay fixed at each end and are not counted. */
export const NAV_TAB_MAX = 5;

function uiRoleBucket(role) {
  return role === "helper" ? "helper" : "employer";
}

function allowedNavIds(role) {
  return UI_NAV[uiRoleBucket(role)].map((item) => item.id);
}

export function normalizeNavTabs(role, raw) {
  const allowed = new Set(allowedNavIds(role));
  const defaults = DEFAULT_NAV_TABS[uiRoleBucket(role)].slice();
  if (!Array.isArray(raw)) return defaults;
  const out = [];
  const seen = new Set();
  for (const id of raw) {
    if (!allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= NAV_TAB_MAX) break;
  }
  return out;
}

export function emptyUiPrefs() {
  return {
    employer: { tabs: DEFAULT_NAV_TABS.employer.slice() },
    helper: { tabs: DEFAULT_NAV_TABS.helper.slice() },
  };
}

export function normalizeUiPrefs(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = emptyUiPrefs();
  for (const role of ["employer", "helper"]) {
    const r = src[role] && typeof src[role] === "object" ? src[role] : {};
    out[role] = { tabs: normalizeNavTabs(role, r.tabs) };
  }
  return out;
}

export function loadUiPrefs() {
  try {
    const raw = localStorage.getItem(UI_PREFS_KEY);
    if (!raw) return emptyUiPrefs();
    return normalizeUiPrefs(JSON.parse(raw));
  } catch (err) {
    console.warn("Could not read UI prefs", err);
    return emptyUiPrefs();
  }
}

export function saveUiPrefs(prefs) {
  const next = normalizeUiPrefs(prefs);
  localStorage.setItem(UI_PREFS_KEY, JSON.stringify(next));
  return next;
}

export function getNavTabs(prefs, role) {
  return normalizeNavTabs(role, prefs?.[uiRoleBucket(role)]?.tabs);
}

export function setNavTabs(prefs, role, tabs) {
  const bucket = uiRoleBucket(role);
  const next = {
    ...prefs,
    [bucket]: { ...prefs?.[bucket], tabs: normalizeNavTabs(role, tabs) },
  };
  return saveUiPrefs(next);
}

export function addNavTab(prefs, role, id) {
  const cur = getNavTabs(prefs, role);
  if (cur.includes(id) || cur.length >= NAV_TAB_MAX) return prefs;
  return setNavTabs(prefs, role, [...cur, id]);
}

export function removeNavTab(prefs, role, id) {
  return setNavTabs(prefs, role, getNavTabs(prefs, role).filter((x) => x !== id));
}

export function moveNavTab(prefs, role, id, dir) {
  const cur = getNavTabs(prefs, role);
  const i = cur.indexOf(id);
  const j = i + Number(dir);
  if (i < 0 || j < 0 || j >= cur.length) return prefs;
  const next = cur.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return setNavTabs(prefs, role, next);
}

export { uid };

export const SHOP_COLLAPSE_KEY = "fdh-shop-collapse-v1";

function shopCollapseId(listId, parentId) {
  return `${listId}::${parentId}`;
}

export function loadShopCollapse() {
  try {
    const raw = localStorage.getItem(SHOP_COLLAPSE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch (err) {
    console.warn("Could not read shop collapse prefs", err);
    return {};
  }
}

export function isShopGroupCollapsed(listId, parentId) {
  if (!listId || !parentId) return false;
  return !!loadShopCollapse()[shopCollapseId(listId, parentId)];
}

export function setShopGroupCollapsed(listId, parentId, collapsed) {
  if (!listId || !parentId) return;
  const map = loadShopCollapse();
  const key = shopCollapseId(listId, parentId);
  if (collapsed) map[key] = true;
  else delete map[key];
  localStorage.setItem(SHOP_COLLAPSE_KEY, JSON.stringify(map));
}

