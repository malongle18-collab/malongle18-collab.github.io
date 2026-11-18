import {
  ANNUAL_LEAVE_BY_YEAR,
  APP_NAME,
  CURRENT_MAW,
  GUIDE_SECTIONS,
  HELPER_GUIDE_SECTIONS,
  MAW_HISTORY,
  NATIONALITIES,
  OFFICIAL_LINKS,
  WEEKDAYS,
  REST_DAY_ARRANGED,
  REST_DAY_OPTIONS,
  TASK_SCHEDULES,
  LEAVE_TYPES,
  SH_STATUSES,
  SHOP_PLACES,
} from "./data.js?v=23";
import {
  addDays,
  daysBetween,
  daysInMonth,
  formatMoney,
  formatDate,
  formatMonthShort,
  formatMonthYear,
  displayISO,
  monthKey,
  parseISO,
  toISO,
  todayISO,
  weekday,
} from "./dates.js?v=23";
import { escapeHtml, icon } from "./icons.js?v=23";
import {
  buildCustomReminders,
  buildReminders,
  customDueCount,
  isReminderVisible,
  mergeReminders,
  nextCustomDate,
  reminderBadgeCount,
  snoozeUntil,
} from "./reminders.js?v=23";
import {
  allObservedDatesForYear,
  annualLeaveDaysForYear,
  annualLeaveVestDate,
  contractStatus,
  currentLeaveYear,
  defaultContractEnd,
  extraGeneralHolidays,
  holidayPayEligible,
  inEmployment,
  isArrangedRestPolicy,
  isRestDayOn,
  officialYears,
  paidStatutoryStart,
  proRataMonthly,
  restDayGaps,
  simpleDailyRate,
  statutoryHolidaysForYear,
  suggestedAlternativeDateFor,
  upcomingRestDaysFor,
  vestedAnnualLeaveAsOf,
  taskAppliesOn,
} from "./rules.js?v=23";
import {
  arrangedRestList,
  currentHelper,
  demoHelper,
  emptyState,
  exportBackup,
  catalogKey,
  findCatalog,
  listDate,
  newCustomReminder,
  normalizeCatalog,
  removeCatalogEntry,
  importBackup,
  loadState,
  normalizeHelperForm,
  newLeaveLog,
  newPayment,
  newShopItem,
  newShopList,
  isRecipeParent,
  isShopLeaf,
  newWorkRule,
  newWorkTask,
  recordCatalogPrice,
  saveState,
  shKey,
  toggleArrangedRestDay,
  normalizeConsent,
  uid,
  UI_NAV,
  NAV_TAB_MAX,
  loadUiPrefs,
  getNavTabs,
  addNavTab,
  removeNavTab,
  moveNavTab,
  isShopGroupCollapsed,
  setShopGroupCollapsed,
} from "./storage.js?v=23";
import {
  ACK_KEY,
  buildPayReturnCode,
  buildSharePayload,
  compressImageFile,
  decryptShare,
  encryptShare,
  isAcked,
  isTaskDone,
  loadInbox,
  loadRole,
  loadSession,
  parsePayReturnCode,
  parseShareHash,
  payConsentMap,
  randomPin,
  receiptPayload,
  removeInbox,
  saveRole,
  saveSession,
  setAcked,
  setPayConsent,
  setTaskDone,
  shareUrl,
  upsertInbox,
} from "./share.js?v=23";
import {
  DOC_TYPES,
  MAX_DOC_FILES,
  MAX_SHARE_DOC_CHARS,
  cleanIdNumber,
  dataUrlToBlobUrl,
  docsChars,
  docsForShare,
  emptyDocs,
  hasIdInfo,
  maskHkid,
  maskPassport,
  normalizeDocs,
  readDocFile,
} from "./docs.js?v=23";
import {
  CATEGORIES,
  DIET_KEYS,
  DIFFICULTIES,
  MAX_DISHES_PER_SLOT,
  MAX_SLOTS,
  SHARE_MENU_FUTURE_DAYS,
  SHARE_MENU_PAST_DAYS,
  aggregateIngredients,
  allRecipes,
  isLibraryRecipeId,
  libraryOverrideId,
  ownUserRecipes,
  copyDay,
  dayCount,
  dayDishes,
  dietConflicts,
  dishKey,
  dishLabel,
  eatenDaysAgo,
  findUrl,
  ingName,
  ingQty,
  isHalalFriendly,
  menuForShare,
  menuShareText,
  newDish,
  newRecipe,
  nextRecipeNo,
  normalizeDiet,
  normalizeRecipes,
  normalizeSourceUrl,
  parseIngredient,
  parseRecipeText,
  pruneDay,
  recipeEatenDaysAgo,
  recipeName,
  recipeNameOther,
  recipeNoLabel,
  recipeShareText,
  recipePhotosOf,
  recipePhotoSrc,
  recipePhotoCreditInfo,
  isLibraryPhotoPath,
  MAX_RECIPE_PHOTOS,
  isRecipePhoto,
  recipesForShare,
  shiftISO,
  slotLabel,
  splitTags,
  stepText,
  tipsText,
  urlHost,
  weekDates,
  webSearchUrls,
} from "./menu.js?v=23";
import { LANGS, applyDocumentLang, getLang, pick, setLang, t as tr, tIn, tp } from "./i18n.js?v=23";
import { initSwipe } from "./swipe-delete.js?v=23";

const YEARS = officialYears();
const EMPLOYER_TABS = [
  { id: "home", labelKey: "tab.home", icon: "home" },
  { id: "leave", labelKey: "tab.leave", icon: "leaf" },
  { id: "tasks", labelKey: "tab.tasks", icon: "checklist" },
  { id: "rules", labelKey: "tab.rules", icon: "rule" },
  { id: "more", labelKey: "tab.more", icon: "more" },
];
const HELPER_TABS = [
  { id: "h", labelKey: "tab.mine", icon: "home" },
  { id: "h-leave", labelKey: "tab.leave", icon: "leaf" },
  { id: "h-tasks", labelKey: "tab.tasks", icon: "checklist" },
  { id: "h-rules", labelKey: "tab.rules", icon: "rule" },
  { id: "h-more", labelKey: "tab.more", icon: "more" },
];

let state = loadState();
let role = loadRole();
let helperSession = loadSession();
let uiPrefs = loadUiPrefs();
const ui = {
  tab: "home",
  leavePane: "rest",
  year: Math.min(Math.max(new Date().getFullYear(), YEARS[0]), YEARS[YEARS.length - 1]),
  month: new Date().getMonth(),
  editingId: null,
  toast: "",
  toastTimer: 0,
  sheet: null,
  shopListId: null,
  pendingShare: "",
  shareReveal: null,
  pinError: "",
  calMode: "rest",
  docDraft: null,
  docView: null,
  reveal: {},
  shareDocs: false,
  payslipId: null,
  shopView: "list",
  shopCal: { year: new Date().getFullYear(), month: new Date().getMonth() },
  shopDay: "",
  sigData: "",
  returnMsg: "",
  menuDate: todayISO(),
  recipeId: null,
  recipeQuery: "",
  recipeCat: "all",
  recipeSrc: "all",
  recipeDiet: [],
  recipeLang: "auto",
  dietOpen: false,
  menuView: "day",
  cookStep: 0,
  cookTicks: {},
  recipePhoto: "",
  recipePhotos: [],
  recipePhotoReplace: null,
  recipeDraft: null,
  slotArm: "",
  recipeRestoreArm: "",
};

function today() {
  return todayISO();
}

function save() {
  saveRev += 1;
  try {
    saveState(state);
    return true;
  } catch (err) {
    console.warn("Could not save", err);
    toast(tr("toast.storageFull"));
    return false;
  }
}

function helper() {
  return currentHelper(state);
}

function arrangedFor(h) {
  return h ? arrangedRestList(state, h.id) : [];
}

function arrangedMap() {
  const map = {};
  for (const h of state.helpers) map[h.id] = arrangedRestList(state, h.id);
  return map;
}

function toast(msg) {
  ui.toast = msg;
  render();
  clearTimeout(ui.toastTimer);
  ui.toastTimer = setTimeout(() => {
    ui.toast = "";
    render();
  }, 2800);
}

function isStandalone() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function setRole(next) {
  role = next;
  saveRole(next);
}

function setTab(tab) {
  ui.tab = tab;
  ui.sheet = null;
  ui.reveal = {};
  ui.docView = null;
  ui.payslipId = null;
  ui.returnMsg = "";
  if (!String(tab).startsWith("shop")) ui.shopListId = String(tab).includes("shop-detail") ? ui.shopListId : ui.shopListId;
  ui.slotArm = "";
  if ((tab === "shop-detail" || tab === "h-shop-detail") && ui.shopListId) {
    location.hash = `#/${tab}/${ui.shopListId}`;
  } else if ((tab === "recipe" || tab === "h-recipe" || tab === "cook" || tab === "h-cook") && ui.recipeId) {
    location.hash = `#/${tab}/${ui.recipeId}`;
  } else {
    location.hash = `#/${tab}`;
  }
  document.querySelector(".main")?.scrollTo(0, 0);
  render();
}

const EMPLOYER_ROUTES = new Set([
  "home",
  "leave",
  "pay",
  "remind",
  "tasks",
  "rules",
  "shop",
  "shop-detail",
  "menu",
  "recipes",
  "recipe",
  "cook",
  "share",
  "more",
  "guide",
  "backup",
  "onboard",
  "helper-new",
  "helper-edit",
]);
const HELPER_ROUTES = new Set([
  "h",
  "h-leave",
  "h-tasks",
  "h-rules",
  "h-shop",
  "h-shop-detail",
  "h-menu",
  "h-recipes",
  "h-recipe",
  "h-cook",
  "h-pay",
  "h-remind",
  "h-rights",
  "h-more",
  "h-enter",
]);

let autoTried = "";

function parseHash() {
  const raw = (location.hash || "").replace(/^#\/?/, "");
  const incoming = parseShareHash(location.hash);
  if (incoming) {
    ui.pendingShare = incoming;
    role = "helper";
    ui.tab = "h-enter";
    // Same phone, already unlocked: try the saved PIN so a newer link just updates the data.
    if (helperSession?.pin && incoming !== autoTried) {
      autoTried = incoming;
      autoUpdateFromLink(incoming);
    }
    return;
  }
  const [tab, extra] = raw.split("/");
  if (!tab) {
    if (!role) ui.tab = "role";
    else if (role === "helper") ui.tab = helperSession ? "h" : "h-enter";
    else ui.tab = state.helpers.length ? "home" : "onboard";
    return;
  }
  if (tab === "role") {
    ui.tab = "role";
    return;
  }
  if (HELPER_ROUTES.has(tab)) {
    ui.tab = tab;
    if (tab === "h-shop-detail" && extra) ui.shopListId = extra;
    if ((tab === "h-recipe" || tab === "h-cook") && extra) ui.recipeId = extra;
    return;
  }
  if (EMPLOYER_ROUTES.has(tab)) {
    ui.tab = tab;
    if (tab === "shop-detail" && extra) ui.shopListId = extra;
    if ((tab === "recipe" || tab === "cook") && extra) ui.recipeId = extra;
    return;
  }
  ui.tab = role === "helper" ? "h" : "home";
}

function nationalityLabel(id) {
  return pick(NATIONALITIES.find((n) => n.id === id)) || "—";
}

function weekdayLabel(id) {
  if (isArrangedRestPolicy(id)) return tr("rest.arranged");
  return pick(WEEKDAYS.find((w) => w.id === Number(id))) || "—";
}

function placeLabel(id) {
  return pick(SHOP_PLACES.find((p) => p.id === id)) || tr("shop.placeDefault");
}

function holidayName(d) {
  return pick(d, "nameZh", "nameEn");
}

function holidayNote(d) {
  return pick(d, "noteZh", "noteEn");
}

function langSwitch() {
  const cur = getLang();
  return `
    <div class="lang-switch" role="group" aria-label="${tr("lang.label")}">
      ${LANGS.map(
        (l) =>
          `<button type="button" class="lang-btn" data-action="set-lang" data-lang="${l.id}" lang="${l.htmlLang}" aria-pressed="${l.id === cur}">${l.label}</button>`
      ).join("")}
    </div>
  `;
}

function badgeCount() {
  return reminderBadgeCount(state.helpers, state.reminderState, today(), arrangedMap()) + customDueCount(state.customReminders, state.reminderState, today());
}

function leaveLogsFor(h, type) {
  return state.leaveLogs.filter((l) => l.helperId === h.id && (!type || l.type === type));
}

function leaveDays(logs) {
  return logs.reduce((s, l) => s + (Number(l.days) || 0), 0);
}

function annualBalance(h, on = today()) {
  const vested = vestedAnnualLeaveAsOf(h.startDate || h.contractStart, on);
  const taken = leaveDays(leaveLogsFor(h, "annual").filter((l) => l.startDate && l.startDate <= on));
  return { ...vested, taken, remaining: Math.max(0, vested.total - taken) };
}

function holidayList(h, year) {
  const winter = h?.winterChoice || "christmas";
  const include = Boolean(h?.grantGeneralHolidays);
  return allObservedDatesForYear(year, winter, include).filter((d) => !h || inEmployment(h, d.date));
}

function shStatus(h, date) {
  return state.shStatuses[shKey(h.id, date)] || { status: "pending", lieuDate: "", note: "" };
}

function setShStatus(h, date, patch) {
  const key = shKey(h.id, date);
  state.shStatuses[key] = { ...shStatus(h, date), ...patch };
  save();
  render();
}

function urgencyWord(u) {
  return tr(`urgency.${["expired", "critical", "soon", "watch", "info"].includes(u) ? u : "info"}`);
}

function tasksFor(h) {
  return state.workTasks.filter((t) => t.helperId === h.id);
}

function rulesFor(h) {
  return state.workRules.filter((r) => r.helperId === h.id);
}

function listsFor(h) {
  return state.shopLists.filter((l) => l.helperId === h.id);
}

function itemsForList(listId) {
  return state.shopItems.filter((i) => i.listId === listId);
}

function shopLeaves(items) {
  return items.filter(isShopLeaf);
}

function shopForest(items) {
  const kids = new Map();
  for (const it of items) {
    if (!it.parentId) continue;
    if (!kids.has(it.parentId)) kids.set(it.parentId, []);
    kids.get(it.parentId).push(it);
  }
  const byId = new Map(items.map((i) => [i.id, i]));
  const used = new Set();
  const byTime = (a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")) || String(a.id).localeCompare(String(b.id));
  const tops = items.filter((i) => isRecipeParent(i) || !i.parentId).slice().sort(byTime);
  const nodes = [];
  for (const t of tops) {
    if (isRecipeParent(t)) {
      const children = (kids.get(t.id) || []).slice().sort(byTime);
      children.forEach((c) => used.add(c.id));
      used.add(t.id);
      nodes.push({ type: "recipe", parent: t, children });
    } else {
      used.add(t.id);
      nodes.push({ type: "item", item: t });
    }
  }
  for (const it of items) {
    if (used.has(it.id) || isRecipeParent(it)) continue;
    const parent = it.parentId ? byId.get(it.parentId) : null;
    if (parent && isRecipeParent(parent)) continue;
    nodes.push({ type: "item", item: it });
  }
  return nodes;
}

function leafProgress(items) {
  const leaves = shopLeaves(items);
  return { done: leaves.filter((i) => i.bought).length, total: leaves.length };
}

function parentTickState(children) {
  if (!children.length) return { checked: false, indeterminate: false, done: 0, total: 0 };
  const done = children.filter((c) => c.bought).length;
  return { checked: done === children.length, indeterminate: done > 0 && done < children.length, done, total: children.length };
}

function scheduleLabel(task) {
  const base = pick(TASK_SCHEDULES.find((s) => s.id === task.schedule)) || "";
  if (task.schedule === "weekly") {
    const days = (task.weekdays || [])
      .map((d) => pick(WEEKDAYS.find((w) => w.id === Number(d)), "shortZh", "shortEn"))
      .filter(Boolean);
    return days.length ? tr("task.weeklyOn", { days: days.join(tr("list.sep")) }) : base;
  }
  if (task.schedule === "once" && task.onceDate) return `${base}${tr("colon")}${formatDate(task.onceDate, { short: true })}`;
  return base;
}

function timeLabel(task) {
  if (task.timeFrom && task.timeTo) return `${task.timeFrom}–${task.timeTo}`;
  if (task.timeFrom) return task.timeFrom;
  return "";
}

/* ---------- layout ---------- */

function pageTitleKey() {
  const map = {
    home: "tab.home", leave: "tab.leave", tasks: "tab.tasks", rules: "tab.rules", more: "tab.more",
    pay: "pay.title", remind: "home.reminders", shop: "shop.title", "shop-detail": "shop.title",
    share: "share.title", guide: "more.guide", backup: "backup.title", "helper-new": "helper.add", "helper-edit": "form.editTitle",
    h: "tab.mine", "h-leave": "tab.leave", "h-tasks": "tab.tasks", "h-rules": "tab.rules", "h-more": "tab.more",
    menu: "menu.title", recipes: "recipe.title", recipe: "recipe.title", cook: "cook.title", "h-cook": "cook.title",
    "h-menu": "menu.title", "h-recipes": "recipe.title", "h-recipe": "recipe.title",
    "h-shop": "shop.title", "h-shop-detail": "shop.title", "h-pay": "pay.title", "h-remind": "home.reminders", "h-rights": "hmore.rights",
  };
  return map[ui.tab] || "tab.home";
}

function initialOf(name) {
  const str = String(name || "").trim();
  return str ? Array.from(str)[0].toUpperCase() : "·";
}

function header(titleSub) {
  const h = role === "helper" ? helperSession?.payload?.helper : helper();
  const count = role === "employer" ? badgeCount() : helperReminderList().filter((r) => isReminderVisible(r, {}, today()) && (r.type !== "custom" || r.date <= today())).length;
  const sub = titleSub || (h ? escapeHtml(h.name || "") : role === "helper" ? tr("header.helperView") : tr("header.employerView"));
  const home = role === "helper" ? "h" : "home";
  const remind = role === "helper" ? "h-remind" : "remind";
  const avatar = role === "helper" ? tr("brand.mark") : initialOf(h?.name);
  return `
    <header class="app-header">
      <a class="brand" href="#/${home}">
        <div class="brand-mark" aria-hidden="true">${tr("brand.mark")}</div>
        <div class="brand-text">
          <strong>${tr("app.name")}</strong>
          <span>${sub}</span>
        </div>
      </a>
      <div class="crumb" aria-hidden="true">${tr("nav.workspace")} <i>/</i> <strong>${tr(pageTitleKey())}</strong></div>
      <div class="header-actions">
        <span class="top-date">${formatDate(today(), { medium: true })}</span>
        <button class="icon-btn" type="button" data-go="${remind}" aria-label="${tr("aria.reminders")}${count ? tr("aria.remindersPending", { n: count }) : ""}">
          <span class="icon-wrap">${icon("bell")}${count ? `<span class="badge">${count > 9 ? "9+" : count}</span>` : ""}</span>
        </button>
        <span class="avatar" aria-hidden="true">${escapeHtml(avatar)}</span>
      </div>
    </header>
  `;
}

const NAV_HIDDEN = ["role", "onboard", "helper-new", "h-enter"];

function navCatalog() {
  return UI_NAV[role === "helper" ? "helper" : "employer"];
}

function navMeta(id) {
  const mid = navCatalog().find((item) => item.id === id);
  if (mid) return mid;
  if (id === "home") return { id, labelKey: "tab.home", icon: "home" };
  if (id === "h") return { id, labelKey: "tab.mine", icon: "home" };
  if (id === "more" || id === "h-more") return { id, labelKey: "tab.more", icon: "more" };
  return null;
}

function barNavItems() {
  const home = role === "helper" ? "h" : "home";
  const more = role === "helper" ? "h-more" : "more";
  return [home, ...getNavTabs(uiPrefs, role), more].map(navMeta).filter(Boolean);
}

function navHighlightCandidates(tab) {
  if (role === "helper") {
    if (tab === "h-shop-detail") return ["h-shop"];
    if (tab === "h-recipe" || tab === "h-cook" || tab === "h-recipes") return ["h-recipes", "h-menu"];
    if (tab === "h-menu") return ["h-menu"];
    if (tab === "h-remind") return ["h-remind"];
    if (tab === "h-rights") return ["h-rights"];
    return [tab];
  }
  if (tab === "shop-detail") return ["shop"];
  if (tab === "recipe" || tab === "cook" || tab === "recipes") return ["recipes", "menu"];
  if (tab === "menu") return ["menu"];
  if (tab === "remind") return ["remind"];
  if (tab === "guide") return ["guide"];
  if (tab === "backup") return ["backup"];
  if (tab === "helper-edit" || tab === "helper-new") return ["helper-edit"];
  return [tab];
}

function navCurrentId(tab) {
  const ids = new Set(barNavItems().map((item) => item.id));
  const fallback = role === "helper" ? "h-more" : "more";
  return navHighlightCandidates(tab).find((id) => ids.has(id)) || fallback;
}

function viewDisplayPrefs() {
  const selected = getNavTabs(uiPrefs, role);
  const catalog = navCatalog();
  const available = catalog.filter((item) => !selected.includes(item.id));
  const full = selected.length >= NAV_TAB_MAX;
  const row = (item, kind, index) => {
    const name = tr(item.labelKey);
    const tools =
      kind === "selected"
        ? `<div class="nav-pick-tools">
            <button class="icon-btn" type="button" data-action="nav-tab-up" data-id="${item.id}" ${index === 0 ? "disabled" : ""} aria-label="${tr("prefs.nav.up", { name })}">${icon("chevron", { size: 16 })}</button>
            <button class="icon-btn" type="button" data-action="nav-tab-down" data-id="${item.id}" ${index === selected.length - 1 ? "disabled" : ""} aria-label="${tr("prefs.nav.down", { name })}">${icon("chevron", { size: 16 })}</button>
            <button class="icon-btn" type="button" data-action="nav-tab-remove" data-id="${item.id}" aria-label="${tr("prefs.nav.remove", { name })}">${icon("close", { size: 16 })}</button>
          </div>`
        : `<button class="btn secondary small" type="button" data-action="nav-tab-add" data-id="${item.id}" ${full ? "disabled" : ""}>${tr("prefs.nav.addBtn")}</button>`;
    return `<div class="nav-pick-row ${kind === "available" ? "is-avail" : ""}">
      <span class="nav-pick-ic" aria-hidden="true">${icon(item.icon, { size: 18 })}</span>
      <span class="grow">${name}</span>
      ${tools}
    </div>`;
  };
  return `
    <div class="card prefs-card">
      <div class="title">${tr("prefs.title")}</div>
      <p class="tiny muted" style="margin:0.3rem 0 0.2rem">${tr("prefs.lede", { n: NAV_TAB_MAX })}</p>
      <h2 class="prefs-h">${tr("prefs.nav.selected")}</h2>
      <p class="tiny muted prefs-count" style="margin:0.15rem 0 0">${tr("prefs.nav.count", { count: selected.length, n: NAV_TAB_MAX })}</p>
      <div class="nav-pick-list">
        ${
          selected.length
            ? selected.map((id, i) => row(navMeta(id), "selected", i)).join("")
            : `<p class="tiny muted" style="margin:0">${tr("prefs.nav.empty")}</p>`
        }
      </div>
      <h2 class="prefs-h">${tr("prefs.nav.available")}</h2>
      <p class="tiny muted" style="margin:0 0 0.35rem">${full ? tr("prefs.nav.full", { n: NAV_TAB_MAX }) : tr("prefs.nav.max", { n: NAV_TAB_MAX, left: NAV_TAB_MAX - selected.length })}</p>
      <div class="nav-pick-list">
        ${available.length ? available.map((item) => row(item, "available")).join("") : `<p class="tiny muted" style="margin:0">${tr("prefs.nav.noneLeft")}</p>`}
      </div>
    </div>`;
}

function sidebar() {
  if (NAV_HIDDEN.includes(ui.tab)) return "";
  const items = barNavItems();
  const cur = navCurrentId(ui.tab);
  const home = role === "helper" ? "h" : "home";
  return `
    <aside class="sidebar" aria-label="${tr("aria.mainTabs")}">
      <a class="brand side-brand" href="#/${home}">
        <div class="brand-mark" aria-hidden="true">${tr("brand.mark")}</div>
        <div class="brand-text"><strong>${tr("app.name")}</strong><span>${tr(role === "helper" ? "header.helperView" : "header.employerView")}</span></div>
      </a>
      <div class="nav-label">${tr("nav.workspace")}</div>
      <nav class="side-nav">
        ${items
          .map(
            (t) =>
              `<button type="button" class="side-link" data-go="${t.id}" aria-current="${cur === t.id ? "page" : "false"}">${icon(t.icon, { size: 19 })}<span>${tr(t.labelKey)}</span></button>`
          )
          .join("")}
      </nav>
      <div class="side-bottom">
        ${langSwitch()}
        <p><strong>${tr("sidebar.privacy.title")}</strong>${tr("sidebar.privacy.body")}</p>
      </div>
    </aside>
  `;
}

function tabbar() {
  const hidden = ["role", "onboard", "helper-new", "h-enter"];
  if (hidden.includes(ui.tab)) return "";
  const tabs = barNavItems();
  const count = role === "employer" ? badgeCount() : 0;
  const cur = navCurrentId(ui.tab);
  const dense = tabs.length > 5;
  const iconSize = dense ? 18 : 22;
  return `
    <nav class="tabbar${dense ? " is-dense" : ""}" aria-label="${tr("aria.mainTabs")}" style="--tab-cols:${Math.max(tabs.length, 2)}">
      ${tabs
        .map((t) => {
          const current = cur === t.id || ui.tab === t.id;
          const badge = (t.id === "more" || t.id === "h-more") && count ? `<span class="badge">${count > 9 ? "9+" : count}</span>` : "";
          return `<button class="tab-btn" type="button" data-go="${t.id}" aria-current="${current ? "page" : "false"}">
            <span class="icon-wrap">${icon(t.icon, { size: iconSize })}${badge}</span>
            <span class="tab-label">${tr(t.labelKey)}</span>
          </button>`;
        })
        .join("")}
    </nav>
  `;
}

function helperSwitcher() {
  if (!state.helpers.length) return "";
  return `
    <div class="helper-switcher" role="tablist" aria-label="${tr("aria.pickHelper")}">
      ${state.helpers
        .map(
          (h) => `
        <button class="helper-pill" type="button" data-switch="${escapeHtml(h.id)}" aria-current="${h.id === state.currentHelperId}">
          ${escapeHtml(h.name || tr("common.unnamed"))}
        </button>`
        )
        .join("")}
      <button class="helper-pill" type="button" data-go="helper-new" aria-label="${tr("helper.add")}">${icon("plus", { size: 18 })}</button>
    </div>
  `;
}

function emptyHelperPrompt(title) {
  return `
    <div class="empty">
      ${icon("person", { size: 36 })}
      <p class="screen-title" style="font-size:1.5rem">${title}</p>
      <p class="lede">${tr("empty.helper.lede")}</p>
      <div class="btn-row">
        <button class="btn" type="button" data-go="helper-new">${tr("helper.add")}</button>
        <button class="btn secondary" type="button" data-action="load-demo">${tr("demo.load")}</button>
      </div>
    </div>
  `;
}

function disclaimer() {
  return `
    <p class="disclaimer">
      ${tr("disclaimer.pre")}
      <a href="${OFFICIAL_LINKS.fdhPortal}" target="_blank" rel="noopener">${tr("disclaimer.link")}</a>
      ${tr("disclaimer.post")}
    </p>
  `;
}

function installTip() {
  if (isStandalone() || location.protocol === "file:") {
    return location.protocol === "file:"
      ? `<div class="note-box">${tr("install.file")}</div>`
      : "";
  }
  return `<div class="note-box">${tr("install.web")}</div>`;
}

/* ---------- role / onboard ---------- */

function viewRole() {
  return `
    <div class="role-screen">
      ${langSwitch()}
      <h1 class="screen-title">${tr("app.name")}</h1>
      <p class="lede">${tr("role.lede")}</p>
      <div class="role-choice">
        <button class="role-card employer" type="button" data-action="choose-role" data-role="employer">
          <span class="who">${tr("role.employer")}</span>
          <p>${tr("role.employer.desc")}</p>
        </button>
        <button class="role-card" type="button" data-action="choose-role" data-role="helper">
          <span class="who">${tr("role.helper")}</span>
          <p>${tr("role.helper.desc")}</p>
        </button>
      </div>
      ${installTip()}
      ${disclaimer()}
    </div>
  `;
}

function viewOnboard() {
  return `
    <div class="onboard">
      <h1 class="screen-title">${tr("home.empty.title")}</h1>
      <p class="lede">${tr("onboard.lede")}</p>
      <div class="note-box">
        ${tr("onboard.note")}
      </div>
      <div class="btn-row">
        <button class="btn" type="button" data-go="helper-new">${tr("onboard.start")}</button>
        <button class="btn secondary" type="button" data-action="load-demo">${tr("demo.load")}</button>
      </div>
      <button class="linkish" type="button" data-action="choose-role" data-role="">${tr("onboard.backToRole")}</button>
      ${disclaimer()}
    </div>
  `;
}

function entryCards(h, prefix) {
  const taskN = (h ? (prefix === "h-" ? (helperSession.payload.workTasks || []) : tasksFor(h)) : []).length;
  const ruleN = (h ? (prefix === "h-" ? (helperSession.payload.workRules || []) : rulesFor(h)) : []).length;
  const openLists = h
    ? (prefix === "h-" ? (helperSession.payload.shopLists || []) : listsFor(h)).filter((l) => l.status !== "done").length
    : 0;
  const shopN = openLists;
  return `
    <div class="entry-grid">
      <button class="entry" type="button" data-go="${prefix}tasks">
        <span class="mark">${icon("checklist")}</span>
        <span class="txt"><strong>${tr("tab.tasks")}</strong><span>${taskN ? tp("entry.tasks.n", taskN) : tr("entry.tasks.none")}</span></span>
      </button>
      <button class="entry rules" type="button" data-go="${prefix}rules">
        <span class="mark">${icon("rule")}</span>
        <span class="txt"><strong>${tr("tab.rules")}</strong><span>${ruleN ? tp("entry.rules.n", ruleN) : tr("entry.rules.none")}</span></span>
      </button>
      <button class="entry shop" type="button" data-go="${prefix}shop">
        <span class="mark">${icon("basket")}</span>
        <span class="txt"><strong>${tr("shop.title")}</strong><span>${shopN ? tp("entry.shop.n", shopN) : tr("entry.shop.hint")}</span></span>
      </button>
    </div>
  `;
}

/* ---------- employer home ---------- */

function greetingKey() {
  const hr = new Date().getHours();
  return hr < 12 ? "greet.morning" : hr < 18 ? "greet.afternoon" : "greet.evening";
}

function statCard({ label, ic, value, unit = "", foot = "", footClass = "", go = "", pane = "" }) {
  const inner = `
    <div class="stat-head"><span>${label}</span><span class="stat-icon">${icon(ic, { size: 16 })}</span></div>
    <div class="stat-value">${value}${unit ? `<small>${unit}</small>` : ""}</div>
    <div class="stat-foot ${footClass}">${foot}</div>`;
  if (pane) return `<button class="stat is-link" type="button" data-action="open-leave" data-leave-pane="${pane}">${inner}</button>`;
  if (go) return `<button class="stat is-link" type="button" data-go="${go}">${inner}</button>`;
  return `<div class="stat">${inner}</div>`;
}

function holidayTiles(list) {
  if (!list.length) return `<p class="muted" style="margin:0">${tr("leave.hol.none")}</p>`;
  return `<div class="holiday-tiles">${list
    .map(
      (d) => `<div class="h-tile">
        <time>${formatDate(d.date, { short: true })}</time>
        <em>${d.kind === "general" ? tr("hol.tag.general") : tr("leave.pane.holidays")}</em>
        <span>${escapeHtml(holidayName(d))}</span>
      </div>`
    )
    .join("")}</div>`;
}

function timelineHtml(reminders, goKey) {
  if (!reminders.length) return `<p class="muted" style="margin:0">${tr("home.noReminders")}</p>`;
  return `<div class="timeline">${reminders
    .map(
      (r) => `<button class="event" type="button" data-go="${goKey}">
        <span class="event-date">${formatDate(r.date, { short: true })}</span>
        <span class="dotcol"><i class="dot ${["expired", "critical", "soon", "watch"].includes(r.urgency) ? "warn" : ""}"></i></span>
        <span class="event-txt"><strong>${escapeHtml(r.title)}${r.type === "custom" ? ` <span class="tag brass">${tr("remind.custom")}</span>` : ""}</strong><span>${escapeHtml(r.body || "")}</span></span>
      </button>`
    )
    .join("")}</div>`;
}

function detailRow(k, v) {
  return `<div class="detail-row"><span>${k}</span><strong>${v}</strong></div>`;
}


/* ---------- keep typed form values across re-renders (toast, language, uploads) ---------- */
const KEEP_FORMS = ["helper-form", "pay-form", "consent-form", "recipe-form", "dish-form", "shop-list-form", "gen-form", "list-recipes-form", "web-recipe-form"];

function captureForms() {
  const out = {};
  for (const id of KEEP_FORMS) {
    const form = document.getElementById(id);
    if (!form) continue;
    const vals = {};
    for (const el of Array.from(form.elements)) {
      if (!el.name || el.type === "hidden" || el.type === "file" || el.type === "submit" || el.type === "button") continue;
      vals[el.name] = el.type === "checkbox" ? el.checked : el.value;
    }
    out[id] = { mode: form.getAttribute("data-mode") || "", helperId: form.elements.helperId?.value || "", vals };
  }
  return out;
}

function restoreForms(keep) {
  for (const id of Object.keys(keep || {})) {
    const form = document.getElementById(id);
    const k = keep[id];
    if (!form || (form.getAttribute("data-mode") || "") !== k.mode || (form.elements.helperId?.value || "") !== k.helperId) continue;
    for (const [name, v] of Object.entries(k.vals)) {
      const el = form.elements[name];
      if (!el || el instanceof RadioNodeList) continue;
      if (el.type === "checkbox") el.checked = Boolean(v);
      else el.value = v;
    }
  }
}

/* ---------- passport / HKID: masked numbers, thumbnails, viewer ---------- */

function ensureDocDraft(mode, editing) {
  const key = `${mode}:${editing?.id || "new"}`;
  if (ui.docDraft?.key !== key) {
    const docs = normalizeDocs(editing?.docs);
    ui.docDraft = { key, passport: docs.passport, hkid: docs.hkid };
  }
  return ui.docDraft;
}

function docList(src, type) {
  if (src === "draft") return ui.docDraft?.[type] || [];
  if (src === "session") return sessionHelper()?.docs?.[type] || [];
  return helper()?.docs?.[type] || [];
}

function docThumbs(src, type, { removable = false } = {}) {
  const files = docList(src, type);
  return files
    .map((d, i) => {
      const body =
        d.type === "application/pdf"
          ? `<span class="pdf-badge">${icon("doc", { size: 22 })}<b>PDF</b><i>${escapeHtml(d.name)}</i></span>`
          : `<img src="${d.data}" alt="${escapeHtml(tr(`doc.kind.${type}`))}">`;
      return `<div class="doc-thumb">
        <button type="button" class="doc-thumb-btn" data-action="doc-view" data-src="${src}" data-doc="${type}" data-idx="${i}" aria-label="${tr("doc.view")}">${body}</button>
        <span class="doc-cap">${tr("doc.view")}</span>
        ${removable ? `<button type="button" class="doc-del" data-action="doc-del" data-doc="${type}" data-idx="${i}" aria-label="${tr("doc.delete")}">${icon("close", { size: 14 })}</button>` : ""}
      </div>`;
    })
    .join("");
}

function docEditBlock(type, numberName, numberValue, form) {
  const files = ui.docDraft?.[type] || [];
  const isPassport = type === "passport";
  return `
    <div class="doc-block" data-doc-type="${type}">
      <label class="field"><span>${tr(isPassport ? "form.passportNo" : "form.hkidNo")}</span>
        <input name="${numberName}" value="${escapeHtml(numberValue || "")}" maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${isPassport ? "" : "A123456(7)"}">
      </label>
      <div class="doc-files">
        ${docThumbs("draft", type, { removable: true })}
        ${
          files.length < MAX_DOC_FILES
            ? `<button type="button" class="doc-add" data-action="doc-pick" data-doc="${type}">${icon("upload", { size: 20 })}<span>${tr("doc.upload")}</span></button>
               <input type="file" accept="image/*,application/pdf" multiple hidden data-doc-input="${type}">`
            : ""
        }
      </div>
      <p class="hint" style="margin:0.3rem 0 0">${tr(isPassport ? "doc.hint.passport" : "doc.hint.hkid", { n: MAX_DOC_FILES })}</p>
    </div>`;
}

function maskedRow(label, field, value, src) {
  if (!value) return detailRow(label, `<span class="muted">${tr("doc.notAdded")}</span>`);
  const on = Boolean(ui.reveal[`${src}:${field}`]);
  const shown = on ? value : field === "hkidNo" ? maskHkid(value) : maskPassport(value);
  return detailRow(
    label,
    `<span class="mask-val"><span class="mono">${escapeHtml(shown)}</span><button type="button" class="eye-btn ${on ? "is-on" : ""}" data-action="toggle-reveal" data-src="${src}" data-field="${field}" aria-pressed="${on}" aria-label="${tr(on ? "doc.hide" : "doc.reveal")}">${icon(on ? "eyeOff" : "eye", { size: 18 })}</button></span>`
  );
}

function idDocsPanel(h, src) {
  if (src === "session" && !hasIdInfo(h)) return "";
  const empty = !hasIdInfo(h);
  return `
    <section class="panel id-panel">
      <div class="panel-title">
        <div><h2>${tr("doc.panel.title")}</h2>${src === "session" ? `<span class="sub">${tr("doc.panel.shared")}</span>` : ""}</div>
        ${src === "stored" ? `<button class="btn secondary small" type="button" data-go="helper-edit">${tr(empty ? "doc.panel.add" : "doc.panel.edit")}</button>` : ""}
      </div>
      ${maskedRow(tr("form.passportNo"), "passportNo", h.passportNo, src)}
      ${(h.docs?.passport || []).length ? `<div class="doc-files">${docThumbs(src, "passport")}</div>` : ""}
      ${maskedRow(tr("form.hkidNo"), "hkidNo", h.hkidNo, src)}
      ${(h.docs?.hkid || []).length ? `<div class="doc-files">${docThumbs(src, "hkid")}</div>` : ""}
      <p class="tiny muted" style="margin:0.8rem 0 0">${tr("doc.privacy")}</p>
    </section>`;
}

function docViewerHtml() {
  const v = ui.docView;
  if (!v) return "";
  const d = docList(v.src, v.type)[v.idx];
  if (!d) return "";
  const title = tr(`doc.kind.${v.type}`);
  const body =
    d.type === "application/pdf"
      ? `<div class="viewer-pdf">${icon("doc", { size: 40 })}<p>${escapeHtml(d.name)}</p><a class="btn" href="${v.url || "#"}" target="_blank" rel="noopener" download="${escapeHtml(d.name || "document.pdf")}">${tr("doc.openPdf")}</a></div>`
      : `<img src="${d.data}" alt="${escapeHtml(title)}">`;
  return `<div class="viewer" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
    <div class="viewer-bar"><strong>${escapeHtml(title)}</strong><button type="button" class="btn secondary small" data-action="doc-close">${tr("common.close")}</button></div>
    <div class="viewer-body">${body}</div>
  </div>`;
}

function viewHome() {
  const h = helper();
  if (!h) return emptyHelperPrompt(tr("home.empty.title"));
  const t = today();
  const cs = contractStatus(h, t);
  const start = h.contractStart || h.startDate;
  const paidFrom = paidStatutoryStart(h.startDate || h.contractStart);
  const vest = annualLeaveVestDate(h.startDate || h.contractStart);
  const soonLimit = toISO(addDays(t, 30));
  const reminders = mergeReminders(
    buildReminders(h, t, { arrangedRestDays: arrangedFor(h) }),
    buildCustomReminders(state.customReminders, state.helpers, t, { helperId: h.id }).filter((r) => r.date <= soonLimit)
  ).filter((r) => isReminderVisible(r, state.reminderState, t));
  const year = ui.year;
  const yearList = holidayList(h, year);
  const shCount = holidayList(h, year).filter((d) => d.kind === "statutory").length;
  const nextHoliday = holidayList(h, year).find((d) => d.date >= t);
  const pay = monthPaySnapshot(h, t);
  const al = annualBalance(h, t);
  const pillClass =
    cs.key === "ok" ? "" : cs.key === "watch" || cs.key === "soon" ? "warn" : cs.key === "expired" || cs.key === "critical" ? "danger" : "warn";
  const restValue = isArrangedRestPolicy(h.restDay) ? tr("rest.arranged") : tr("rest.valueWeekly", { day: weekdayLabel(h.restDay) });
  const contractValue =
    cs.daysLeft == null ? "—" : cs.daysLeft < 0 ? tr("home.stat.ended") : String(cs.daysLeft);
  const contractUnit = cs.daysLeft != null && cs.daysLeft >= 0 ? tr("unit.d") : "";
  const contractFoot =
    cs.daysLeft == null ? tr("rail.needDates") : h.contractEnd ? tr("home.stat.contractTo", { date: formatDate(h.contractEnd) }) : "";

  const helperPanel = true
    ? `<div class="panel">
        <div class="panel-title"><h2>${tr("home.panel.helper")}</h2><button class="btn secondary small" type="button" data-go="helper-edit">${tr("home.panel.view")}</button></div>
        <div class="profile">
          <div class="profile-img" aria-hidden="true">${escapeHtml(initialOf(h.name))}</div>
          <div class="profile-info">
            <strong>${escapeHtml(h.name)}</strong>
            <div>${nationalityLabel(h.nationality)}${start ? `　·　${tr("home.panel.since", { date: formatDate(start) })}` : ""}</div>
          </div>
          <span class="status-pill ${pillClass}">${cs.label}</span>
        </div>
        ${detailRow(tr("home.row.contract"), `${start ? formatDate(start) : "—"} — ${h.contractEnd ? formatDate(h.contractEnd) : "—"}`)}
        ${detailRow(tr("form.wage"), formatMoney(h.wage))}
        ${detailRow(tr("home.row.food"), h.foodProvided ? tr("home.row.foodFree") : tr("home.row.foodAllow", { amount: formatMoney(h.foodAllowance) }))}
        ${detailRow(tr("leave.pane.rest"), restValue)}
        ${detailRow(tr("home.paidStart"), paidFrom ? formatDate(paidFrom) : "—")}
        ${h.visaExpiry ? detailRow(tr("home.row.visa"), formatDate(h.visaExpiry)) : ""}
        ${h.passportExpiry ? detailRow(tr("home.row.passport"), formatDate(h.passportExpiry)) : ""}
      </div>`
    : "";
  const remindPanel = true
    ? `<div class="panel">
        <div class="panel-title"><h2>${tr("home.reminders")}</h2><button class="linkish" type="button" data-go="remind">${tr("common.all")}</button></div>
        ${timelineHtml(reminders.slice(0, 4), "remind")}
      </div>`
    : "";

  return `
    ${helperSwitcher()}
    ${installTip()}
    ${
      true
        ? `<section class="welcome">
      <div>
        <div class="eyebrow">${tr(greetingKey())} · ${tr("home.eyebrow")}</div>
        <h1 class="screen-title">${escapeHtml(h.name)}</h1>
        <p class="lede">${nationalityLabel(h.nationality)}　${restValue}　${tr("home.monthlyWage")} ${formatMoney(h.wage)}</p>
      </div>
      <button class="btn" type="button" data-go="helper-edit">${icon("plus", { size: 16 })}${tr("common.editData")}</button>
    </section>`
        : ""
    }
    ${true ? sendUpdateCard("home") : ""}

    ${
      true
        ? `<section class="stat-grid">
      ${statCard({ label: tr("home.stat.contract"), ic: "clock", value: contractValue, unit: contractUnit, foot: contractFoot })}
      ${statCard({
        label: tr("home.stat.annual"),
        ic: "leaf",
        value: t < vest ? "—" : String(al.remaining),
        unit: t < vest ? "" : tr("unit.d"),
        foot: t < vest ? tr("home.annual.from", { date: formatDate(vest, { short: true }) }) : tr("home.stat.annualFoot", { total: al.total, taken: al.taken }),
        pane: "calc",
      })}
      ${statCard({ label: tr("home.stat.pay"), ic: "coin", value: formatMoney(pay.total), foot: tr("home.stat.wage", { wage: formatMoney(h.wage) }), go: "pay" })}
      ${statCard({
        label: tr("home.stat.sh", { year }),
        ic: "calendar",
        value: String(shCount),
        unit: tr("unit.d"),
        foot: nextHoliday ? tr("home.stat.next", { name: escapeHtml(holidayName(nextHoliday)), date: formatDate(nextHoliday.date, { short: true }) }) : tr("home.stat.noNext"),
        footClass: nextHoliday ? "green" : "",
        pane: "holidays",
      })}
    </section>`
        : ""
    }

    ${helperPanel || remindPanel ? `<section class="${helperPanel && remindPanel ? "grid2" : ""}">${helperPanel}${remindPanel}</section>` : ""}

    ${true ? menuHomeCard() : ""}

    ${true ? idDocsPanel(h, "stored") : ""}

    ${
      true
        ? `<section class="panel">
      <div class="panel-title">
        <div><h2>${tr("home.holidays.title", { year })}</h2><span class="sub">${tr("home.holidays.sub")}</span></div>
        <div class="year-bar">
          ${YEARS.map((y) => `<button class="chip small ${year === y ? "is-on" : ""}" type="button" data-year="${y}" aria-pressed="${year === y}">${y}</button>`).join("")}
          <button class="btn secondary small" type="button" data-action="open-leave" data-leave-pane="holidays">${tr("home.holidays.full")}</button>
        </div>
      </div>
      ${holidayTiles(yearList)}
    </section>`
        : ""
    }

    ${
      true
        ? `<section class="section">
      <div class="section-head"><h2>${tr("home.tellHelper")}</h2></div>
      ${entryCards(h, "")}
    </section>`
        : ""
    }

    ${
      true
        ? `<div class="btn-row">
      <button class="btn" type="button" data-go="share">${tr("share.generate")}</button>
      <button class="btn secondary" type="button" data-go="helper-edit">${tr("common.editData")}</button>
    </div>`
        : ""
    }
    ${disclaimer()}
  `;
}

function holidayRow(h, d, compact = false, arranged = null) {
  const dates = arranged || arrangedFor(h);
  const paid = d.kind === "statutory" && holidayPayEligible(h, d.date);
  const st = d.kind === "statutory" ? shStatus(h, d.date) : null;
  const restHit = isRestDayOn(h, d.date, dates);
  const alt = restHit
    ? suggestedAlternativeDateFor(
        d.date,
        h,
        statutoryHolidaysForYear(parseISO(d.date).getFullYear(), h.winterChoice),
        dates
      )
    : null;
  const statusLabel = pick(SH_STATUSES.find((s) => s.id === st?.status));
  const dt = parseISO(d.date);
  return `
    <div class="holiday-item" ${compact ? "" : `data-holiday="${d.date}" data-kind="${d.kind}"`}>
      <div class="date-block">
        <div class="m">${formatMonthShort(dt.getMonth())}</div>
        <div class="d">${dt.getDate()}</div>
      </div>
      <div>
        <div class="title" style="font-weight:650">${escapeHtml(holidayName(d))}</div>
        <div class="sub muted tiny">${formatDate(d.date, { shortWeek: true })}${restHit ? tr("hol.onRestDay") : ""}</div>
        ${restHit && alt ? `<div class="tiny">${tr("hol.altSuggest", { date: formatDate(alt, { shortWeek: true }) })}</div>` : ""}
        <div class="chip-row" style="margin-top:0.35rem">
          <span class="tag ${d.kind === "general" ? "extra" : paid ? "paid" : "unpaid"}">
            ${d.kind === "general" ? tr("hol.tag.general") : paid ? tr("hol.tag.paid") : tr("hol.tag.unpaid")}
          </span>
          ${st && st.status !== "pending" ? `<span class="tag">${statusLabel}</span>` : ""}
          ${st?.lieuDate ? `<span class="tag brass">${tr("hol.lieu", { date: formatDate(st.lieuDate, { short: true }) })}</span>` : ""}
        </div>
      </div>
      ${
        d.kind === "statutory" && !compact && role === "employer"
          ? `<button class="btn secondary" type="button" style="min-height:2.4rem;padding:0.3rem 0.7rem" data-action="sh-edit" data-date="${d.date}">${tr("hol.arrange")}</button>`
          : `<span class="muted tiny">${st && compact ? statusLabel : ""}</span>`
      }
    </div>
  `;
}

function viewLeave() {
  const h = helper();
  if (!h) return emptyHelperPrompt(tr("leave.empty.title"));
  const t = today();
  const pane = ui.leavePane;
  if (isArrangedRestPolicy(h.restDay) && !["rest", "holidays", "calc"].includes(pane)) ui.leavePane = "rest";
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">${tr("tab.leave")}</h1>
    <div class="chip-row" style="margin-bottom:0.9rem">
      <button class="chip ${pane === "rest" ? "is-on" : ""}" type="button" data-pane="rest" aria-pressed="${pane === "rest"}">${tr("leave.pane.rest")}</button>
      <button class="chip ${pane === "holidays" ? "is-on" : ""}" type="button" data-pane="holidays" aria-pressed="${pane === "holidays"}">${tr("leave.pane.holidays")}</button>
      <button class="chip ${pane === "calc" ? "is-on" : ""}" type="button" data-pane="calc" aria-pressed="${pane === "calc"}">${tr("leave.pane.calc")}</button>
    </div>
    ${pane === "rest" ? leaveRest(h, t) : pane === "calc" ? leaveCalc(h, t) : leaveHolidays(h, t)}
  `;
}

function monthGrid(year, month, marks, interactive, action = "cal-day") {
  const first = new Date(year, month, 1);
  const start = first.getDay();
  const dim = daysInMonth(year, month);
  const cells = [];
  for (let i = 0; i < start; i++) cells.push(`<div class="day out"></div>`);
  const t = today();
  for (let d = 1; d <= dim; d++) {
    const iso = toISO(new Date(year, month, d));
    const mark = marks[iso] || {};
    const cls = [
      "day",
      iso === t ? "is-today" : "",
      mark.sh ? "is-sh" : "",
      mark.gh ? "is-gh" : "",
      mark.rest ? "is-rest" : "",
      mark.annual ? "is-annual" : "",
      mark.shopOpen || mark.shopDone ? "has-shop" : "",
      action === "shop-day" && ui.shopDay === iso ? "is-selected" : "",
    ]
      .filter(Boolean)
      .join(" ");
    const shopN = (mark.shopOpen || 0) + (mark.shopDone || 0);
    const shopHtml = shopN
      ? `<span class="shop-marks">${mark.shopOpen ? '<i class="sd open"></i>' : ""}${mark.shopDone ? '<i class="sd done"></i>' : ""}</span>${shopN > 1 ? `<b class="scount">${shopN}</b>` : ""}`
      : "";
    const label = `${iso}${shopN ? tr("shop.cal.aria", { n: shopN }) : ""}${mark.rest ? tr("cal.aria.rest") : ""}${mark.sh ? tr("cal.aria.sh") : ""}${mark.annual ? tr("cal.aria.annual") : ""}`;
    if (interactive) {
      cells.push(
        `<button class="${cls}" type="button" data-action="${action}" data-date="${iso}" aria-label="${label}">${d}${shopHtml}</button>`
      );
    } else {
      cells.push(`<div class="${cls}" aria-label="${label}">${d}${shopHtml}</div>`);
    }
  }
  const dow = WEEKDAYS.map((w) => `<div class="dow">${pick(w, "shortZh", "shortEn")}</div>`).join("");
  return `<div class="cal${interactive ? " is-interactive" : ""}" role="grid">${dow}${cells.join("")}</div>`;
}

function calendarMarks(h, year, month) {
  const winter = h.winterChoice || "christmas";
  const arranged = arrangedFor(h);
  const marks = {};
  statutoryHolidaysForYear(year, winter).forEach((d) => {
    marks[d.date] = { ...(marks[d.date] || {}), sh: true };
  });
  if (h.grantGeneralHolidays) {
    extraGeneralHolidays(year, winter).forEach((d) => {
      marks[d.date] = { ...(marks[d.date] || {}), gh: true };
    });
  }
  const dim = daysInMonth(year, month);
  for (let d = 1; d <= dim; d++) {
    const iso = toISO(new Date(year, month, d));
    if (isRestDayOn(h, iso, arranged)) marks[iso] = { ...(marks[iso] || {}), rest: true };
  }
  leaveLogsFor(h, "annual").forEach((log) => {
    if (!log.startDate) return;
    const end = log.endDate || log.startDate;
    let c = parseISO(log.startDate);
    const last = parseISO(end);
    while (c && last && c <= last) {
      const iso = toISO(c);
      marks[iso] = { ...(marks[iso] || {}), annual: true };
      c = addDays(c, 1);
    }
  });
  return marks;
}

function monthNav() {
  return `
    <div class="month-nav">
      <button class="icon-btn" type="button" data-action="month-prev" aria-label="${tr("month.prev")}">${icon("back")}</button>
      <strong>${formatMonthYear(ui.year, ui.month)}</strong>
      <button class="icon-btn" type="button" data-action="month-next" aria-label="${tr("month.next")}">${icon("chevron")}</button>
    </div>
  `;
}

function leaveRest(h, t) {
  const arranged = arrangedFor(h);
  const gaps = isArrangedRestPolicy(h.restDay) ? restDayGaps(h, arranged, t, toISO(addDays(t, 55))) : [];
  const upcoming = upcomingRestDaysFor(h, arranged, t, 6);
  const marks = calendarMarks(h, ui.year, ui.month);
  return `
    <div class="note-box">
      ${tr("leave.rest.note")}
    </div>
    <div class="card" style="margin-top:0.85rem">
      <p style="margin:0 0 0.6rem"><strong>${tr("leave.rest.policy")}</strong></p>
      <div class="chip-row">
        ${REST_DAY_OPTIONS.map(
          (opt) => `
          <button class="chip ${String(h.restDay) === String(opt.id) ? "is-on" : ""}" type="button"
            data-action="set-rest-policy" data-value="${opt.id}" aria-pressed="${String(h.restDay) === String(opt.id)}">${pick(opt)}</button>`
        ).join("")}
      </div>
    </div>
    ${
      isArrangedRestPolicy(h.restDay)
        ? `<div class="card" style="margin:0.8rem 0">
            <label class="field" style="margin:0">
              <span>${tr("leave.rest.add")}<span class="hint">${tr("leave.rest.add.hint")}</span></span>
              <input type="date" data-action="add-rest-date" aria-label="${tr("leave.rest.add")}">
            </label>
          </div>`
        : `<p class="tiny muted" style="margin:0.8rem 0 0.4rem">${tr("leave.rest.fixed", { day: weekdayLabel(h.restDay) })}</p>`
    }
    <div class="card">
      ${monthNav()}
      ${monthGrid(ui.year, ui.month, marks, isArrangedRestPolicy(h.restDay))}
      <div class="cal-legend">
        <span><i class="seal"></i>${tr("cal.legend.rest")}</span>
        <span><i></i>${tr("cal.legend.sh")}</span>
        <span><i class="brass"></i>${tr("cal.legend.annual")}</span>
        <span><i class="today"></i>${tr("cal.legend.today")}</span>
      </div>
    </div>
    ${
      gaps.length
        ? `<div class="note-box warn" style="margin-top:0.8rem">${tr("leave.rest.gaps", {
            list: gaps
              .slice(0, 3)
              .map((g) => tr("range.to", { a: formatDate(g.start, { short: true }), b: formatDate(g.end, { short: true }) }))
              .join(tr("list.sep")),
          })}</div>`
        : ""
    }
    <section class="section">
      <div class="section-head"><h2>${tr("leave.rest.upcoming")}</h2></div>
      <div class="card">
        ${
          upcoming.length
            ? upcoming
                .map(
                  (iso) => `
          <div class="row">
            <div class="grow">
              <div class="title">${formatDate(iso, { weekday: true })}</div>
            </div>
            ${
              isArrangedRestPolicy(h.restDay)
                ? `<button class="btn secondary" type="button" style="min-height:2.4rem;padding:0.3rem 0.7rem" data-action="cal-day" data-date="${iso}">${tr("common.cancel")}</button>`
                : ""
            }
          </div>`
                )
                .join("")
            : `<p class="muted" style="margin:0">${isArrangedRestPolicy(h.restDay) ? tr("leave.rest.noneArranged") : "—"}</p>`
        }
      </div>
    </section>
  `;
}

function leaveHolidays(h, t) {
  const year = ui.year;
  const winter = h.winterChoice || "christmas";
  const list = holidayList(h, year);
  const marks = calendarMarks(h, year, ui.month);
  const shAll = statutoryHolidaysForYear(year, winter).filter((d) => inEmployment(h, d.date));
  const paid = shAll.filter((d) => holidayPayEligible(h, d.date));
  const taken = paid.filter((d) => ["taken", "worked-lieu"].includes(shStatus(h, d.date).status));
  const pendingPaid = paid.filter((d) => shStatus(h, d.date).status === "pending");
  return `
    <div class="note-box">
      ${tr("leave.hol.note")}
      <div style="margin-top:0.45rem">
        <a href="${OFFICIAL_LINKS.shList}" target="_blank" rel="noopener">${tr("leave.hol.linkList")}</a>
        ${tr("link.sep")}
        <a href="${OFFICIAL_LINKS.employmentOrdinanceSH}" target="_blank" rel="noopener">${tr("leave.hol.linkEo")}</a>
      </div>
    </div>
    <div class="chip-row" style="margin:1rem 0 0.8rem">
      ${YEARS.map(
        (y) => `<button class="chip ${year === y ? "is-on" : ""}" type="button" data-year="${y}" aria-pressed="${year === y}">${y}</button>`
      ).join("")}
    </div>
    ${year >= 2028 ? `<p class="tiny muted">${tr("leave.hol.future")}</p>` : ""}
    <div class="card">
      ${monthNav()}
      ${monthGrid(year, ui.month, marks, false)}
      <div class="cal-legend">
        <span><i class="seal"></i>${tr("cal.legend.rest")}</span>
        <span><i></i>${tr("cal.legend.sh")}</span>
        <span><i class="today"></i>${tr("cal.legend.today")}</span>
      </div>
    </div>
    <div class="fact-list">
      <div class="fact"><div class="k">${tr("leave.hol.inContract")}</div><div class="v">${tp("unit.days", shAll.length)}</div></div>
      <div class="fact"><div class="k">${tr("leave.hol.pending")}</div><div class="v">${tp("unit.days", pendingPaid.length)}</div></div>
    </div>
    <p class="tiny muted">${tr("leave.hol.summary", { taken: taken.length, paid: paid.length })}</p>
    <div class="card" style="margin-top:0.75rem">
      <label class="switch-field">
        <span>
          <strong>${tr("leave.hol.showGeneral")}</strong>
          <span class="hint">${tr("leave.hol.showGeneral.hint")}</span>
        </span>
        <span class="switch">
          <input type="checkbox" data-action="toggle-gh" ${h.grantGeneralHolidays ? "checked" : ""}>
          <span></span>
        </span>
      </label>
      <label class="field" style="margin:0.4rem 0 0">
        <span>${tr("leave.hol.winterLabel")}</span>
        <select data-action="winter-choice">
          <option value="christmas" ${h.winterChoice !== "winter" ? "selected" : ""}>${tr("hol.christmas")}</option>
          <option value="winter" ${h.winterChoice === "winter" ? "selected" : ""}>${tr("hol.winter")}</option>
        </select>
      </label>
    </div>
    <div class="card" style="margin-top:0.75rem">
      ${list.length ? list.map((d) => holidayRow(h, d, false)).join("") : `<p class="muted" style="margin:0">${tr("leave.hol.none")}</p>`}
    </div>
  `;
}

function leaveCalc(h, t) {
  const start = h.startDate || h.contractStart;
  const vest = annualLeaveVestDate(start);
  const al = annualBalance(h, t);
  const yearInfo = start ? currentLeaveYear(start, t) : null;
  const logs = leaveLogsFor(h);
  const marks = calendarMarks(h, ui.year, ui.month);
  return `
    <div class="note-box">
      ${tr("leave.calc.note")}
    </div>
    <div class="fact-list">
      <div class="fact">
        <div class="k">${tr("leave.calc.vest")}</div>
        <div class="v">${vest ? formatDate(vest) : "—"}</div>
      </div>
      <div class="fact">
        <div class="k">${tr("leave.calc.balanceLabel")}</div>
        <div class="v">${tr("leave.calc.triple", { a: al.total, b: al.taken, c: al.remaining })}</div>
        <div class="tiny muted">${yearInfo ? tr("leave.calc.year", { index: yearInfo.index, days: annualLeaveDaysForYear(yearInfo.index) || 0 }) : ""}</div>
      </div>
    </div>
    <p class="tiny muted" style="margin:0.8rem 0 0.4rem">${tr("leave.calc.calHint")}</p>
    <div class="card">
      ${monthNav()}
      ${monthGrid(ui.year, ui.month, marks, true)}
      <div class="cal-legend">
        <span><i class="seal"></i>${tr("cal.legend.rest")}</span>
        <span><i class="brass"></i>${tr("cal.legend.annual")}</span>
        <span><i></i>${tr("cal.legend.sh")}</span>
      </div>
    </div>
    <div class="btn-row">
      <button class="btn" type="button" data-action="leave-new">${tr("leave.calc.new")}</button>
    </div>
    <section class="section">
      <div class="section-head"><h2>${tr("leave.calc.logged")}</h2></div>
      <div class="card">
        ${
          logs.length
            ? logs
                .slice()
                .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""))
                .map((l) => {
                  const typ = pick(LEAVE_TYPES.find((x) => x.id === l.type)) || l.type;
                  return swipeRow(`<div class="row">
                    <div class="grow">
                      <div class="title">${escapeHtml(typ)}${tr("log.sep")}${tp("unit.days", l.days)}</div>
                      <div class="sub">${formatDate(l.startDate, { short: true })}${l.endDate && l.endDate !== l.startDate ? tr("range.sep") + formatDate(l.endDate, { short: true }) : ""}${l.note ? tr("log.sep") + escapeHtml(l.note) : ""}</div>
                    </div>
                    <button class="icon-btn swipe-inline-del" type="button" data-action="leave-del" data-id="${l.id}" aria-label="${tr("common.delete")}">${icon("close", { size: 18 })}</button>
                  </div>`, "leave-del", l.id, { hover: false });
                })
                .join("")
            : `<p class="muted" style="margin:0">${tr("leave.calc.none")}</p>`
        }
      </div>
    </section>
  `;
}

function monthPaySnapshot(h, iso) {
  const d = parseISO(iso);
  if (!d) return { total: 0, label: "—" };
  const year = d.getFullYear();
  const month = d.getMonth();
  const start = h.startDate || h.contractStart;
  const end = h.contractEnd;
  const first = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const last = toISO(new Date(year, month + 1, 0));
  const fromISO = start && start > first ? start : first;
  const monthEndISO = end && end < last ? end : last;
  if (end && last < (start || first)) return { total: 0, label: tr("pay.notInContract") };
  if (start && first > (end || last)) return { total: 0, label: tr("pay.notInContract") };
  const fromDay = parseISO(fromISO).getDate();
  const toDay = parseISO(monthEndISO).getDate();
  const wage = proRataMonthly(h.wage, year, month, fromDay, toDay);
  const food = h.foodProvided ? { pay: 0, days: wage.days, dim: wage.dim } : proRataMonthly(h.foodAllowance, year, month, fromDay, toDay);
  const full = fromDay === 1 && toDay === wage.dim;
  const total = wage.pay + food.pay;
  const foodBit = h.foodProvided ? tr("pay.foodProvided") : tr("pay.foodAllowance", { amount: formatMoney(food.pay) });
  const label = full
    ? tr("pay.label.full", { wage: formatMoney(wage.pay), food: foodBit })
    : tr("pay.label.partial", { days: wage.days, dim: wage.dim, wage: formatMoney(wage.pay), food: foodBit });
  return { total, label, wage, food, full };
}


/* ---------- pay records: consent, signature, payslip ---------- */

const PAY_METHODS = ["cash", "bank", "cheque", "other"];

function payTotal(p) {
  return Number(p.wage || 0) + Number(p.food || 0) + Number(p.adjustments || 0);
}

function fmtDateTime(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return `${formatDate(day)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function methodLabel(m) {
  return PAY_METHODS.includes(m) ? tr(`pay.method.${m}`) : "";
}

/** Consent for a payment as seen by the current role (helper: local confirmations override). */
function consentOf(p, shareId) {
  if (p.consent?.status === "confirmed") return p.consent;
  if (shareId) {
    const at = payConsentMap(shareId)[p.id];
    if (at) return { status: "confirmed", at, by: "helper-device", signature: "" };
  }
  return null;
}

function consentBadge(c) {
  if (!c) return `<span class="consent-badge pending">${tr("consent.pending")}</span>`;
  const how = c.by === "in-person" ? tr("consent.by.inPerson") : tr("consent.by.helper");
  return `<span class="consent-badge ok">${icon("check", { size: 14 })}${tr("consent.confirmed")}</span><span class="consent-when">${escapeHtml(fmtDateTime(c.at))}${tr("log.sep")}${how}</span>`;
}

function payRecordRows() {
  const h = helper();
  const pays = state.payments.filter((p) => p.helperId === h.id).slice().reverse();
  if (!pays.length) return `<p class="muted" style="margin:0">${tr("pay.none")}</p>`;
  return pays
    .map((p) => {
      const c = consentOf(p, "");
      return swipeRow(`<div class="row pay-row">
        <div class="grow">
          <div class="title">${escapeHtml(p.month || "—")}${tr("log.sep")}${formatMoney(payTotal(p))}</div>
          <div class="sub">${p.paidOn ? formatDate(p.paidOn, { short: true }) : tr("pay.noPaidOn")}${methodLabel(p.method) ? tr("log.sep") + methodLabel(p.method) : ""}${p.note ? tr("log.sep") + escapeHtml(p.note) : ""}</div>
          <div class="consent-line">${consentBadge(c)}</div>
          <div class="pay-actions">
            ${
              c
                ? `<button class="btn secondary small" type="button" data-action="consent-clear" data-id="${p.id}">${tr("consent.clear")}</button>`
                : `<button class="btn small" type="button" data-action="consent-open" data-id="${p.id}">${tr("consent.open")}</button>`
            }
            <button class="btn secondary small" type="button" data-action="payslip-open" data-id="${p.id}">${icon("download", { size: 15 })} ${tr("payslip.export")}</button>
          </div>
        </div>
        <button class="icon-btn swipe-inline-del" type="button" data-action="pay-del" data-id="${p.id}" aria-label="${tr("common.delete")}">${icon("close", { size: 18 })}</button>
      </div>`, "pay-del", p.id, { hover: false });
    })
    .join("");
}

function consentSheetBody(sheet) {
  const h = helper();
  const p = state.payments.find((x) => x.id === sheet.payId);
  if (!p || !h) return "";
  return `
    <h2>${tr("consent.sheet.title")}</h2>
    <p class="lede" style="margin-bottom:0.7rem">${tr("consent.sheet.lede", { name: escapeHtml(h.name) })}</p>
    <div class="consent-summary">
      ${detailRow(tr("payslip.helper"), escapeHtml(h.name))}
      ${detailRow(tr("payslip.period"), escapeHtml(p.month || "—"))}
      ${detailRow(tr("sheet.pay.wage"), formatMoney(p.wage))}
      ${Number(p.food) ? detailRow(tr("sheet.pay.food"), formatMoney(p.food)) : ""}
      ${Number(p.adjustments) ? detailRow(tr("sheet.pay.adjust") + (p.note ? `（${escapeHtml(p.note)}）` : ""), formatMoney(p.adjustments)) : ""}
      ${detailRow(tr("payslip.total"), `<b>${formatMoney(payTotal(p))}</b>`)}
      ${p.paidOn ? detailRow(tr("sheet.pay.paidOn"), formatDate(p.paidOn)) : ""}
    </div>
    <form id="consent-form" data-pay="${escapeHtml(p.id)}">
      <label class="switch-field">
        <span><strong>${tr("consent.agree")}</strong></span>
        <span class="switch"><input type="checkbox" name="agree"><span></span></span>
      </label>
      <div class="sig-wrap">
        <div class="sig-head"><span>${tr("consent.sign")}</span><button class="linkish" type="button" data-action="sig-clear">${tr("consent.sig.clear")}</button></div>
        <canvas id="sig-pad" class="sig-pad" aria-label="${tr("consent.sign")}"></canvas>
        <p class="tiny muted" style="margin:0.3rem 0 0">${tr("consent.sign.hint")}</p>
      </div>
      <p class="consent-err" id="consent-err" role="alert" hidden></p>
      <div class="btn-row"><button class="btn" type="submit">${tr("consent.save")}</button></div>
    </form>`;
}

function setupSignaturePad() {
  const cv = document.getElementById("sig-pad");
  if (!cv) return;
  const rect = cv.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.max(10, Math.round(rect.width * dpr));
  cv.height = Math.max(10, Math.round(rect.height * dpr));
  const ctx = cv.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#202b27";
  if (ui.sigData) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
    img.src = ui.sigData;
  }
  let drawing = false;
  const pt = (e) => {
    const r = cv.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  cv.addEventListener("pointerdown", (e) => {
    drawing = true;
    cv.setPointerCapture?.(e.pointerId);
    const [x, y] = pt(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
    e.preventDefault();
  });
  cv.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const [x, y] = pt(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  });
  const end = () => {
    if (!drawing) return;
    drawing = false;
    ui.sigData = cv.toDataURL("image/png");
  };
  cv.addEventListener("pointerup", end);
  cv.addEventListener("pointercancel", end);
}

/** Small white-background PNG of the signature (keeps storage and print light). */
function compressSignature() {
  const cv = document.getElementById("sig-pad");
  if (!cv) return "";
  const w = 480;
  const h = Math.max(1, Math.round((cv.height / cv.width) * w));
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(cv, 0, 0, w, h);
  return out.toDataURL("image/png");
}

function viewPayExtras() {
  const h = helper();
  const access = h ? state.helperAccess[h.id] : null;
  return `
    <section class="panel" style="margin-top:0.9rem">
      <div class="panel-title"><h2>${tr("pay.employerName")}</h2></div>
      <label class="field" style="margin:0"><span class="hint">${tr("pay.employerName.hint")}</span>
        <input data-action="employer-name" maxlength="80" autocomplete="name" value="${escapeHtml(state.settings.employerName || "")}">
      </label>
    </section>
    <section class="panel">
      <div class="panel-title"><h2>${tr("consent.import.title")}</h2></div>
      <p class="tiny muted" style="margin:0 0 0.5rem">${tr("consent.import.hint")}${access && !access.revoked ? "" : tr("consent.import.needShare")}</p>
      <textarea id="return-code" rows="3" placeholder="${tr("consent.import.ph")}"></textarea>
      <div class="btn-row"><button class="btn secondary" type="button" data-action="import-return">${tr("consent.import.btn")}</button></div>
      ${ui.returnMsg ? `<p class="note-box" style="margin:0.6rem 0 0">${escapeHtml(ui.returnMsg)}</p>` : ""}
    </section>`;
}

function payslipHtml() {
  if (!ui.payslipId || role === "helper") return "";
  const h = helper();
  const p = state.payments.find((x) => x.id === ui.payslipId);
  if (!h || !p) return "";
  const c = consentOf(p, "");
  const blank = `<span class="blank-line"></span>`;
  const rows = [
    [tr("sheet.pay.wage"), formatMoney(p.wage)],
    [tr("sheet.pay.food"), Number(p.food) ? formatMoney(p.food) : h.foodProvided ? tr("payslip.foodInKind") : formatMoney(0)],
  ];
  if (Number(p.adjustments)) rows.push([tr("payslip.adjust") + (p.note ? `（${escapeHtml(p.note)}）` : ""), formatMoney(p.adjustments)]);
  return `<div class="payslip-layer" role="dialog" aria-modal="true" aria-label="${tr("payslip.title")}">
    <div class="payslip-bar">
      <button type="button" class="btn secondary small" data-action="payslip-close">${tr("common.close")}</button>
      <button type="button" class="btn small" data-action="payslip-print">${icon("download", { size: 15 })} ${tr("payslip.print")}</button>
    </div>
    <p class="payslip-hint">${tr("payslip.hint")}</p>
    <article class="payslip">
      <header class="ps-head">
        <div><div class="ps-app">${tr("app.name")}</div><h1>${tr("payslip.title")}</h1></div>
        <div class="ps-period">${escapeHtml(p.month || "—")}</div>
      </header>
      <table class="ps-meta">
        <tr><th>${tr("payslip.employer")}</th><td>${state.settings.employerName ? escapeHtml(state.settings.employerName) : blank}</td></tr>
        <tr><th>${tr("payslip.helper")}</th><td>${escapeHtml(h.name)}</td></tr>
        ${h.passportNo ? `<tr><th>${tr("form.passportNo")}</th><td>${escapeHtml(maskPassport(h.passportNo))}</td></tr>` : ""}
        ${h.hkidNo ? `<tr><th>${tr("form.hkidNo")}</th><td>${escapeHtml(maskHkid(h.hkidNo))}</td></tr>` : ""}
        <tr><th>${tr("payslip.period")}</th><td>${escapeHtml(p.month || "—")}</td></tr>
        <tr><th>${tr("sheet.pay.paidOn")}</th><td>${p.paidOn ? formatDate(p.paidOn) : blank}</td></tr>
        <tr><th>${tr("payslip.method")}</th><td>${methodLabel(p.method) || blank}</td></tr>
      </table>
      <table class="ps-items">
        <thead><tr><th>${tr("payslip.item")}</th><th class="num">${tr("payslip.amount")}</th></tr></thead>
        <tbody>
          ${rows.map(([k, v]) => `<tr><td>${k}</td><td class="num">${v}</td></tr>`).join("")}
        </tbody>
        <tfoot><tr><td>${tr("payslip.total")}</td><td class="num">${formatMoney(payTotal(p))}</td></tr></tfoot>
      </table>
      <section class="ps-consent">
        <h2>${tr("payslip.consent")}</h2>
        ${
          c
            ? `<p class="ps-ok">${tr("consent.confirmed")}</p><p>${escapeHtml(fmtDateTime(c.at))}${tr("log.sep")}${c.by === "in-person" ? tr("consent.by.inPerson") : tr("consent.by.helper")}</p>`
            : `<p class="ps-pending">${tr("consent.pending")}</p>`
        }
      </section>
      <div class="ps-sign">
        <div><div class="sign-box"></div><div class="sign-label">${tr("payslip.signEmployer")}</div></div>
        <div><div class="sign-box">${c?.signature ? `<img src="${c.signature}" alt="${tr("payslip.signHelper")}">` : ""}</div><div class="sign-label">${tr("payslip.signHelper")}</div></div>
      </div>
      <p class="ps-foot">${tr("payslip.foot")}</p>
    </article>
  </div>`;
}

function viewPay() {
  const h = helper();
  if (!h) return emptyHelperPrompt(tr("leave.empty.title"));
  const t = today();
  const d = parseISO(t);
  const snap = monthPaySnapshot(h, t);
  const daily = simpleDailyRate(h.wage);
  const pays = state.payments.filter((p) => p.helperId === h.id).slice().reverse();
  const yearPays = pays.filter((p) => (p.month || "").startsWith(String(d.getFullYear())));
  const yearTotal = yearPays.reduce((s, p) => s + Number(p.wage || 0) + Number(p.food || 0) + Number(p.adjustments || 0), 0);
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">${tr("pay.title")}</h1>
    <p class="lede">${tr("pay.lede", { wage: formatMoney(h.wage), food: h.foodProvided ? tr("pay.lede.free") : tr("pay.lede.allowance", { amount: formatMoney(h.foodAllowance) }), maw: formatMoney(CURRENT_MAW.wage), foodMin: formatMoney(CURRENT_MAW.food) })}</p>
    <div class="card">
      <div class="pay-total">${formatMoney(snap.total)}</div>
      <p class="tiny muted" style="margin:0.4rem 0 0">${snap.label}</p>
    </div>
    <div class="note-box" style="margin-top:0.8rem">
      ${tr("pay.note", { daily: formatMoney(daily) })}
    </div>
    <div class="fact-list">
      <div class="fact"><div class="k">${tr("pay.yearTotal")}</div><div class="v">${formatMoney(yearTotal)}</div></div>
    </div>
    <div class="btn-row">
      <button class="btn" type="button" data-action="pay-new">${tr("pay.new")}</button>
    </div>
    <section class="section">
      <div class="section-head"><h2>${tr("pay.history")}</h2></div>
      <div class="card">
        ${payRecordRows()}
      </div>
    </section>
    ${viewPayExtras()}
    <p class="tiny muted">${tr("pay.mawHistory", { list: MAW_HISTORY.map((m) => tr("pay.mawFrom", { date: displayISO(m.effectiveFrom), wage: formatMoney(m.wage) })).join(tr("semi")) })}</p>
    ${disclaimer()}
  `;
}

function viewRemind() {
  const h = helper();
  if (!h) return emptyHelperPrompt(tr("leave.empty.title"));
  const t = today();
  const all = mergeReminders(
    state.helpers.flatMap((x) => buildReminders(x, t, { arrangedRestDays: arrangedFor(x) })),
    buildCustomReminders(state.customReminders, state.helpers, t)
  );
  const visible = all.filter((r) => isReminderVisible(r, state.reminderState, t));
  const hidden = all.filter((r) => !isReminderVisible(r, state.reminderState, t));
  const doneCustom = state.customReminders.filter((r) => r.doneAt);
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">${tr("home.reminders")}</h1>
    <p class="lede">${tr("remind.lede")}</p>
    <div class="btn-row" style="margin-bottom:0.8rem">
      <button class="btn" type="button" data-action="reminder-new">${icon("plus", { size: 18 })} ${tr("remind.new")}</button>
    </div>
    <div class="card">
      <label class="switch-field">
        <span>
          <strong>${tr("remind.notify")}</strong>
          <span class="hint">${tr("remind.notify.hint")}</span>
        </span>
        <span class="switch">
          <input type="checkbox" data-action="toggle-notify" ${state.settings.notifications ? "checked" : ""}>
          <span></span>
        </span>
      </label>
    </div>
    <section class="section">
      <div class="card">
        ${
          visible.length
            ? visible
                .map(
                  (r) => {
                    const row = `<div class="row">
            <div class="grow">
              <div class="title">${escapeHtml(r.title)}${r.type === "custom" ? ` <span class="tag brass">${tr("remind.custom")}</span>` : ""}</div>
              <div class="sub">${formatDate(r.date)}${r.type === "custom" && r.repeat !== "none" ? tr("log.sep") + tr(`remind.repeat.${r.repeat}`) : ""}${state.helpers.length > 1 && r.helperName ? tr("log.sep") + escapeHtml(r.helperName) : ""}</div>
              ${r.body ? `<p class="tiny muted" style="margin:0.35rem 0 0">${escapeHtml(r.body)}</p>` : ""}
              <div class="btn-row" style="margin-top:0.45rem">
                <button class="btn secondary" type="button" data-action="remind-snooze" data-id="${r.id}" style="min-height:2.4rem">${tr("remind.snooze")}</button>
                <button class="btn ghost" type="button" data-action="remind-done" data-id="${r.id}" style="min-height:2.4rem">${tr("remind.done")}</button>
                ${r.type === "custom" ? `<button class="btn ghost" type="button" data-action="reminder-edit" data-id="${r.customId}" style="min-height:2.4rem">${tr("common.edit")}</button>` : ""}
              </div>
            </div>
            <span class="status-pill ${r.urgency}">${urgencyWord(r.urgency)}</span>
          </div>`;
                    return r.type === "custom" && r.customId ? swipeRow(row, "reminder-del", r.customId) : row;
                  }
                )
                .join("")
            : `<p class="muted" style="margin:0">${tr("home.noReminders")}</p>`
        }
      </div>
    </section>
    ${
      hidden.length
        ? `<p class="tiny muted">${tr("remind.hidden", { n: hidden.length })}</p>`
        : ""
    }
    ${
      doneCustom.length
        ? `<section class="section">
            <div class="section-head"><h2>${tr("remind.doneList")}</h2></div>
            <div class="card">${doneCustom
              .map(
                (r) => swipeRow(`<div class="row"><div class="grow"><div class="title">${escapeHtml(r.title)}</div><div class="sub">${tr("remind.doneOn", { date: fmtDateTime(r.doneAt) })}</div></div>
                  <button class="btn ghost small" type="button" data-action="reminder-restore" data-id="${r.id}">${tr("remind.restore")}</button>
                  <button class="icon-btn swipe-inline-del" type="button" data-action="reminder-del" data-id="${r.id}" aria-label="${tr("common.delete")}">${icon("close", { size: 18 })}</button></div>`, "reminder-del", r.id, { hover: false })
              )
              .join("")}</div>
          </section>`
        : ""
    }
  `;
}

function viewTasks() {
  const h = helper();
  if (!h) return emptyHelperPrompt(tr("leave.empty.title"));
  const list = tasksFor(h);
  const t = today();
  const todayTasks = list.filter((task) => taskAppliesOn(task, t));
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">${tr("tab.tasks")}</h1>
    <p class="lede">${tr("tasks.lede")}</p>
    ${
      todayTasks.length
        ? `<div class="note-box">${tr("tasks.today", { list: todayTasks.map((x) => escapeHtml(x.title)).join(tr("list.sep")) })}</div>`
        : ""
    }
    <div class="btn-row">
      <button class="btn" type="button" data-action="task-new">${tr("tasks.new")}</button>
    </div>
    <div class="card" style="margin-top:0.9rem">
      ${
        list.length
          ? list
              .map((task) => {
                const time = timeLabel(task);
                return swipeRow(`<div class="row">
                  <div class="grow">
                    <div class="title">${escapeHtml(task.title)}</div>
                    <div class="sub">${escapeHtml(scheduleLabel(task))}${time ? tr("log.sep") + escapeHtml(time) : ""}</div>
                    ${task.detail ? `<p class="tiny muted" style="margin:0.3rem 0 0">${escapeHtml(task.detail)}</p>` : ""}
                  </div>
                  <button class="btn secondary" type="button" data-action="task-edit" data-id="${task.id}" style="min-height:2.4rem;padding:0.3rem 0.7rem">${tr("common.edit")}</button>
                </div>`, "task-del", task.id);
              })
              .join("")
          : `<div class="empty" style="padding:0.4rem 0"><p class="muted" style="margin:0">${tr("tasks.none")}</p></div>`
      }
    </div>
  `;
}

function viewRules() {
  const h = helper();
  if (!h) return emptyHelperPrompt(tr("leave.empty.title"));
  const list = rulesFor(h);
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">${tr("tab.rules")}</h1>
    <p class="lede">${tr("rules.lede")}</p>
    <div class="btn-row">
      <button class="btn" type="button" data-action="rule-new">${tr("rules.new")}</button>
    </div>
    <div style="margin-top:0.6rem">
      ${
        list.length
          ? list
              .map(
                (rule) => swipeRow(`
        <article class="card rule-card">
          <div class="section-head">
            <h2>${escapeHtml(rule.title)}</h2>
            <button class="linkish" type="button" data-action="rule-edit" data-id="${rule.id}">${tr("common.edit")}</button>
          </div>
          <p style="margin:0;white-space:pre-wrap">${escapeHtml(rule.body)}</p>
        </article>`, "rule-del", rule.id, { className: "rule-swipe" })
              )
              .join("")
          : `<div class="card"><p class="muted" style="margin:0">${tr("rules.none")}</p></div>`
      }
    </div>
  `;
}


/* ---------- shopping lists: dates, calendar, price history ---------- */

function listDateLabel(list) {
  const d = listDate(list);
  return d ? formatDate(d, { short: true }) : "";
}

function isISODate(v) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));
}

function parseShopDateInput(v) {
  return isISODate(v) ? String(v) : "";
}

function setShopCalFromDate(iso) {
  if (!isISODate(iso)) return;
  ui.shopCal = { year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) - 1 };
}

function compareShopLists(a, b) {
  const da = listDate(a);
  const db = listDate(b);
  if (!da && !db) return (b.createdAt || "").localeCompare(a.createdAt || "");
  if (!da) return -1;
  if (!db) return 1;
  return db.localeCompare(da) || (b.createdAt || "").localeCompare(a.createdAt || "");
}

function shopNamePlace(list) {
  const name = list.title || "";
  const place = placeLabel(list.place);
  if (name && place) return `${escapeHtml(name)}${tr("log.sep")}${place}`;
  return name ? escapeHtml(name) : place;
}

function shopHeadLines(list, { titleClass = "shop-line-date" } = {}) {
  const date = listDate(list);
  if (date) {
    return `<span class="${titleClass}">${escapeHtml(formatDate(date, { short: true }))}</span><span class="shop-line-meta">${shopNamePlace(list)}</span>`;
  }
  const name = escapeHtml(list.title || placeLabel(list.place));
  const place = list.title ? placeLabel(list.place) : "";
  return `<span class="${titleClass}">${name || escapeHtml(tr("shop.date.none"))}</span>${place ? `<span class="shop-line-meta">${place}</span>` : ""}`;
}

function shopDateFieldHtml({ name = "date", value = "", action = "", listId = "" } = {}) {
  const iso = parseShopDateInput(value);
  const listAttr = listId ? ` data-list="${escapeHtml(listId)}"` : "";
  return `<div class="field shop-date-field">
    <span>${tr("shop.date")}</span>
    <div class="shop-date-row">
      <input type="date"${name ? ` name="${name}"` : ""} ${action ? `data-action="${action}"` : ""} ${listId ? `data-list="${escapeHtml(listId)}"` : ""} value="${escapeHtml(iso)}" aria-label="${tr("shop.date")}">
      ${iso ? `<button class="btn secondary shop-date-clear" type="button" data-action="clear-shop-date"${listAttr}>${tr("shop.date.clear")}</button>` : ""}
    </div>
  </div>`;
}

function currentRecipePhotos() {
  if (Array.isArray(ui.recipePhotos) && ui.recipePhotos.length) return ui.recipePhotos.filter(isRecipePhoto).slice(0, MAX_RECIPE_PHOTOS);
  return ui.recipePhoto && isRecipePhoto(ui.recipePhoto) ? [ui.recipePhoto] : [];
}

function setRecipePhotos(list) {
  const photos = (list || []).filter(isRecipePhoto).slice(0, MAX_RECIPE_PHOTOS);
  ui.recipePhotos = photos;
  ui.recipePhoto = photos[0] || "";
}

function recipePhotoFieldHtml() {
  const photos = currentRecipePhotos();
  const chips = photos
    .map(
      (src, i) => `<div class="recipe-photo-chip">
        <button class="photo-btn" type="button" data-action="replace-recipe-photo" data-i="${i}" aria-label="${tr("recipe.photo.replace")}">
          <img src="${recipePhotoSrc(src)}" alt="">
        </button>
        <button class="photo-del" type="button" data-action="recipe-photo-remove" data-i="${i}" aria-label="${tr("recipe.photo.remove")}">×</button>
      </div>`
    )
    .join("");
  const add = photos.length < MAX_RECIPE_PHOTOS
    ? `<button class="photo-btn is-add" type="button" data-action="pick-recipe-photo" aria-label="${tr(photos.length ? "recipe.photo.addMore" : "recipe.photo.add")}">${icon("camera", { size: 22 })}</button>`
    : "";
  return `<div class="field">
    <span>${tr("recipe.f.photo")}</span>
    <div class="photo-row recipe-photos">${chips}${add}</div>
    <p class="tiny muted recipe-photos-hint">${tr("recipe.photo.max", { n: MAX_RECIPE_PHOTOS })}</p>
    <input type="file" accept="image/*" multiple data-role="recipe-photo-input" hidden>
  </div>`;
}

function recipePhotoCreditHtml(r) {
  const c = recipePhotoCreditInfo(r);
  if (!c) return "";
  if (c.illustrative) return `<p class="recipe-photo-credit">${escapeHtml(tr("recipe.photo.credit.illustrative"))}</p>`;
  const name = c.author || c.source || "";
  const bits = [name];
  if (c.source) bits.push(c.source);
  if (c.license) bits.push(c.license);
  const credit = bits.filter(Boolean).join(getLang() === "en" ? ", " : "，");
  if (!credit) return "";
  return `<p class="recipe-photo-credit">${escapeHtml(tr("recipe.photo.credit", { credit }))}</p>`;
}

function recipeGalleryHtml(r, className = "recipe-hero") {
  const photos = recipePhotosOf(r);
  if (!photos.length) return "";
  const rest = photos.slice(1);
  return `<div class="recipe-gallery">
    <img class="${className}" src="${recipePhotoSrc(photos[0])}" alt="${escapeHtml(recipeName(r))}">
    ${recipePhotoCreditHtml(r)}
    ${rest.length ? `<div class="recipe-gallery-rest">${rest.map((src) => `<img src="${recipePhotoSrc(src)}" alt="">`).join("")}</div>` : ""}
  </div>`;
}

function syncClearDateButton(input) {
  const btn = input?.closest(".shop-date-field, .shop-date-row, label, .field")?.querySelector("[data-action=clear-shop-date]")
    || input?.parentElement?.querySelector("[data-action=clear-shop-date]");
  if (btn) btn.hidden = !parseShopDateInput(input.value);
}

function applyClearedShopDateInput(input) {
  if (!input) return;
  input.value = "";
  syncClearDateButton(input);
  if (input.getAttribute("data-action") === "gen-shop-date") {
    const form = input.closest("#gen-form");
    const title = form?.elements?.title;
    if (title && isMenuShopAutoTitle(title.value)) title.value = menuShopAutoTitle("");
  }
}

function shopMarks(lists) {
  const marks = {};
  for (const l of lists) {
    const d = listDate(l);
    if (!d) continue;
    const m = (marks[d] = marks[d] || { shopOpen: 0, shopDone: 0 });
    if (l.status === "done") m.shopDone += 1;
    else m.shopOpen += 1;
  }
  return marks;
}

function shopCtx() {
  if (role === "helper") {
    const p = sessionPayload();
    return { items: p?.shopItems || [], lists: p?.shopLists || [] };
  }
  return { items: state.shopItems, lists: state.shopLists };
}

/** Same-name item marked bought in an earlier list within the "recent" window (or null). */
function recentBuyFor(item, ctx) {
  const windowDays = prefsData().recentBuyDays;
  if (!windowDays || !item || item.bought || isRecipeParent(item)) return null;
  const key = catalogKey(item.name);
  if (!key) return null;
  const mine = ctx.lists.find((l) => l.id === item.listId);
  const ref = (mine && listDate(mine)) || today();
  let best = null;
  for (const it of ctx.items) {
    if (!it.bought || it.id === item.id || catalogKey(it.name) !== key) continue;
    if (item.listId && it.listId === item.listId) continue;
    const l = ctx.lists.find((x) => x.id === it.listId);
    const d = l ? listDate(l) : "";
    if (!d || d > ref) continue;
    const days = daysBetween(d, ref);
    if (days < 0 || days > windowDays) continue;
    if (!best || d > best.date) best = { date: d, days, price: it.paidPrice !== "" && it.paidPrice != null ? Number(it.paidPrice) : null };
  }
  return best;
}

function recentText(r) {
  const hasPrice = r.price != null && Number.isFinite(r.price);
  const vars = { n: r.days, price: hasPrice ? formatMoney(r.price) : "" };
  if (r.days === 0) return tr(hasPrice ? "shop.recent.todayPrice" : "shop.recent.today", vars);
  return tp(hasPrice ? "shop.recent.daysPrice" : "shop.recent.days", r.days, vars);
}

function recentBadge(item, ctx) {
  const r = recentBuyFor(item, ctx);
  return r ? `<span class="recent-badge" data-recent>${escapeHtml(recentText(r))}</span>` : "";
}

function shopSettingsCard(ro) {
  const days = prefsData().recentBuyDays;
  if (ro) return `<p class="tiny muted" style="margin:0.6rem 0 0">${days ? tr("shop.recentSetting.on", { n: days }) : tr("shop.recentSetting.off")}</p>`;
  return `<div class="card recent-setting">
    <label class="field" style="margin:0"><span><strong>${tr("shop.recentSetting.title")}</strong><span class="hint">${tr("shop.recentSetting.hint")}</span></span>
      <select data-action="recent-days">${RECENT_CHOICES.map((n) => `<option value="${n}" ${n === days ? "selected" : ""}>${n ? tr("shop.recentSetting.opt", { n }) : tr("shop.recentSetting.optOff")}</option>`).join("")}</select>
    </label>
  </div>`;
}

const CARD_MAX_ITEMS = 8;

function leafTickAction() {
  return role === "helper" ? "h-item-bought" : "item-tick";
}

function parentTickAction() {
  return role === "helper" ? "h-item-tick-group" : "item-tick-group";
}


function swipeDataAttrs(data = {}) {
  return Object.entries(data)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => ` data-${k}="${escapeHtml(String(v))}"`)
    .join("");
}

function swipeParts(action, id, opts = {}) {
  const extra = swipeDataAttrs(opts.data);
  const idA = escapeHtml(id);
  const act = escapeHtml(action);
  const confirm = opts.confirmKey
    ? ` data-swipe-confirm="${escapeHtml(opts.confirmKey)}" data-swipe-confirm-name="${escapeHtml(opts.confirmName || "")}"`
    : "";
  const hover = opts.hover === false
    ? ""
    : `<button type="button" class="swipe-hover-del" data-action="${act}" data-id="${idA}"${extra}>${tr("common.delete")}</button>`;
  const del = `<button type="button" class="swipe-del-btn" data-action="${act}" data-id="${idA}"${extra} tabindex="-1">${tr("common.delete")}</button>`;
  return { extra, confirm, hover, del };
}

function swipeRow(inner, action, id, opts = {}) {
  const p = swipeParts(action, id, opts);
  const cls = opts.className ? ` ${opts.className}` : "";
  const tag = opts.tag || "div";
  const attrs = opts.attrs || "";
  return `<${tag} class="swipe-row${cls}" data-swipe-row${p.confirm}${attrs}><div class="swipe-front">${inner}${p.hover}</div>${p.del}</${tag}>`;
}

function shopGroupToggleHtml(parent, collapsed, inner) {
  const name = parent.name || "";
  const label = tr(collapsed ? "shop.recipe.expand" : "shop.recipe.collapse", { name });
  return `<button type="button" class="group-toggle" data-action="shop-group-toggle" data-id="${escapeHtml(parent.id)}" data-list="${escapeHtml(parent.listId || "")}" data-name="${escapeHtml(name)}" aria-expanded="${collapsed ? "false" : "true"}" aria-label="${escapeHtml(label)}">${inner}<span class="group-chevron" aria-hidden="true">${icon("chevron", { size: 16 })}</span></button>`;
}

function applyShopGroupCollapsed(group, collapsed) {
  if (!group) return;
  group.classList.toggle("is-collapsed", collapsed);
  const sub = group.querySelector(".tick-sub, .shop-children");
  if (sub) sub.hidden = collapsed;
  const btn = group.querySelector('[data-action="shop-group-toggle"]');
  if (btn) {
    btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    const name = btn.getAttribute("data-name") || "";
    btn.setAttribute("aria-label", tr(collapsed ? "shop.recipe.expand" : "shop.recipe.collapse", { name }));
  }
}

function tickLeafHtml(it, ctx) {
  const inner = `<label class="tick-label"><input type="checkbox" data-tick="leaf" data-action="${leafTickAction()}" data-id="${escapeHtml(it.id)}" ${it.bought ? "checked" : ""}>
          <span class="tick-text"><span class="tick-name">${escapeHtml(it.name)}${it.qty ? `<small>${escapeHtml(it.qty)}</small>` : ""}</span>${it.alt ? `<small class="alt">${escapeHtml(it.alt)}</small>` : ""}</span></label>
        ${recentBadge(it, ctx)}`;
  return swipeRow(inner, "item-del", it.id, { tag: "li", className: `tick-item ${it.bought ? "is-bought" : ""}`, attrs: " data-item-row" });
}

function tickGroupHtml(parent, children, ctx, hiddenChildDone = 0, hiddenChildTotal = 0) {
  const visDone = children.filter((c) => c.bought).length;
  const done = visDone + hiddenChildDone;
  const total = children.length + hiddenChildTotal;
  const checked = total > 0 && done === total;
  const collapsed = isShopGroupCollapsed(parent.listId, parent.id);
  const inner = `<span class="tick-text"><span class="tick-name">${escapeHtml(parent.name)}<small data-group-prog>${tr("shop.recipe.progress", { done, total })}</small></span>${parent.note ? `<small class="alt">${escapeHtml(parent.note)}</small>` : ""}</span>`;
  const parentRow = `<div class="tick-item is-parent">
          <label class="tick-check"><input type="checkbox" data-tick="parent" data-action="${parentTickAction()}" data-id="${escapeHtml(parent.id)}" ${checked ? "checked" : ""} aria-label="${escapeHtml(tr("shop.recipe.tickAll", { name: parent.name || "" }))}"></label>
          ${shopGroupToggleHtml(parent, collapsed, inner)}
        </div>`;
  return `<li class="tick-group ${checked ? "is-bought" : ""} ${collapsed ? "is-collapsed" : ""}" data-recipe-group="${escapeHtml(parent.id)}" data-list="${escapeHtml(parent.listId || "")}" data-hidden-child-done="${hiddenChildDone}" data-hidden-child-total="${hiddenChildTotal}">
        ${swipeRow(parentRow, "item-del", parent.id, { confirmKey: "shop.recipe.deleteConfirm", confirmName: parent.name || "" })}
        <ul class="tick-sub"${collapsed ? " hidden" : ""}>${children.map((c) => tickLeafHtml(c, ctx)).join("")}</ul>
      </li>`;
}

function shopCard(list, items, detailTab, ctx) {
  const { done: bought, total } = leafProgress(items);
  const forest = shopForest(items);
  const chunks = [];
  const renderedIds = new Set();
  let used = 0;
  for (const node of forest) {
    if (used >= CARD_MAX_ITEMS) break;
    if (node.type === "recipe") {
      const room = CARD_MAX_ITEMS - used;
      const kids = node.children.slice(0, room);
      const hiddenKids = node.children.slice(room);
      kids.forEach((c) => renderedIds.add(c.id));
      chunks.push(tickGroupHtml(node.parent, kids, ctx, hiddenKids.filter((c) => c.bought).length, hiddenKids.length));
      used += kids.length;
    } else {
      renderedIds.add(node.item.id);
      chunks.push(tickLeafHtml(node.item, ctx));
      used += 1;
    }
  }
  const hiddenDone = shopLeaves(items).filter((i) => !renderedIds.has(i.id) && i.bought).length;
  const hiddenTotal = shopLeaves(items).filter((i) => !renderedIds.has(i.id)).length;
  const pct = total ? Math.round((bought / total) * 100) : 0;
  const article = `<article class="card shop-card" data-shop-card data-total="${total}" data-hidden-done="${hiddenDone}">
    <button class="shop-card-head" type="button" data-go="${detailTab}" data-list="${list.id}">
      <span class="grow">${shopHeadLines(list)}</span>
      <span class="status-pill ${list.status === "done" ? "" : "watch"}">${list.status === "done" ? tr("shop.status.done") : tr("shop.status.open")}</span>
      ${icon("chevron", { size: 16 })}
    </button>
    ${
      items.length
        ? `<div class="shop-prog-row"><span class="shop-prog" data-prog>${tr("shop.card.progress", { done: bought, total })}</span><i class="prog-bar"><b data-prog-bar style="width:${pct}%"></b></i></div>
    <ul class="tick-list">${chunks.join("")}</ul>
    ${hiddenTotal ? `<button class="linkish tick-more" type="button" data-go="${detailTab}" data-list="${list.id}">${tr("shop.card.more", { n: hiddenTotal })}</button>` : ""}`
        : `<p class="tiny muted" style="margin:0.5rem 0 0">${tr("shop.noItems")}</p>`
    }
  </article>`;
  /* Items stay their own swipe rows. The list card itself is only deletable by the 僱主. */
  if (role === "helper") return article;
  return swipeRow(article, "shop-del", list.id, { className: "shop-card-swipe" });
}

function shopBrowser(lists, itemsOf, detailTab, emptyKey) {
  const byDate = compareShopLists;
  const sorted = lists.slice().sort(byDate);
  const seg = `<div class="seg" role="group" aria-label="${tr("shop.title")}">
    <button type="button" class="seg-btn ${ui.shopView === "list" ? "is-on" : ""}" data-action="shop-view" data-view="list" aria-pressed="${ui.shopView === "list"}">${tr("shop.view.list")}</button>
    <button type="button" class="seg-btn ${ui.shopView === "cal" ? "is-on" : ""}" data-action="shop-view" data-view="cal" aria-pressed="${ui.shopView === "cal"}">${tr("shop.view.cal")}</button>
  </div>`;
  if (ui.shopView !== "cal") {
    return `${seg}<div class="shop-cards" style="margin-top:0.9rem">${
      sorted.length ? sorted.map((l) => shopCard(l, itemsOf(l.id), detailTab, shopCtx())).join("") : `<div class="card"><p class="muted" style="margin:0">${tr(emptyKey)}</p></div>`
    }</div>`;
  }
  const { year, month } = ui.shopCal;
  const day = ui.shopDay;
  const dayLists = day ? sorted.filter((l) => listDate(l) === day) : [];
  return `${seg}
    <div class="card" style="margin-top:0.9rem">
      <div class="month-nav">
        <button class="icon-btn" type="button" data-action="shop-month" data-d="-1" aria-label="${tr("month.prev")}">${icon("back")}</button>
        <strong>${formatMonthYear(year, month)}</strong>
        <button class="icon-btn" type="button" data-action="shop-month" data-d="1" aria-label="${tr("month.next")}">${icon("chevron")}</button>
      </div>
      ${monthGrid(year, month, shopMarks(lists), true, "shop-day")}
      <div class="cal-legend">
        <span><i class="sd open"></i>${tr("shop.cal.open")}</span>
        <span><i class="sd done"></i>${tr("shop.cal.done")}</span>
        <span><i class="today"></i>${tr("cal.legend.today")}</span>
      </div>
    </div>
    ${
      day
        ? `<section class="section" data-shop-day-panel>
            <div class="section-head"><h2>${tr("shop.day.title", { date: formatDate(day, { weekday: true }) })}</h2></div>
            <div class="shop-cards">${
              dayLists.length
                ? dayLists.map((l) => shopCard(l, itemsOf(l.id), detailTab, shopCtx())).join("")
                : `<div class="card"><p class="muted" style="margin:0">${tr("shop.day.none")}</p></div>`
            }</div>
            ${role !== "helper" ? `<div class="btn-row"><button class="btn secondary" type="button" data-action="shop-new" data-date="${day}">${tr("shop.day.new")}</button></div>` : ""}
          </section>`
        : `<p class="tiny muted" style="margin-top:0.6rem">${tr("shop.cal.hint")}</p>`
    }`;
}

function priceHistoryHtml(row, source) {
  const hist = (row?.history?.length ? row.history : row ? [{ price: row.lastPrice, date: row.lastPaidOn, place: "" }] : [])
    .slice()
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  if (!hist.length) return `<p class="muted" style="margin:0">${tr("shop.hist.none")}</p>`;
  return `<ul class="hist-list">${hist
    .map((e) => {
      const lst = source !== "session" && e.listId ? state.shopLists.find((l) => l.id === e.listId) : null;
      const where = [e.place ? placeLabel(e.place) : "", lst?.title || ""].filter(Boolean).join(tr("log.sep"));
      return `<li><span>${e.date ? formatDate(e.date, { short: true }) : "—"}</span><b>${formatMoney(e.price)}</b><em>${escapeHtml(where)}</em></li>`;
    })
    .join("")}</ul>`;
}

function lastPriceText(cat) {
  return tr("shop.lastPrice", { price: formatMoney(cat.lastPrice), date: cat.lastPaidOn ? tr("shop.lastPrice.date", { date: formatDate(cat.lastPaidOn, { short: true }) }) : "" });
}

/** Inline hint inside the item form: last price + tap to see history. */
function itemHintBlock(cat) {
  if (!cat) return `<p class="price-hint">${tr("sheet.item.suggestEmpty")}</p>`;
  return `<button type="button" class="price-hint price-hint-btn" data-action="price-hist-toggle">${lastPriceText(cat)} <span class="hist-link">${tr("shop.hist.link")}</span></button>
    <div class="price-hist" hidden>${priceHistoryHtml(cat, "stored")}</div>`;
}

/** In the add-item sheet: warn if this name was bought recently in an earlier list. */
function itemRecentHint(name, itemId, listId) {
  const r = recentBuyFor({ id: itemId || "", name, listId, bought: false }, shopCtx());
  return r ? `<p class="recent-badge block" data-recent>${escapeHtml(recentText(r))}</p>` : "";
}

function catalogNameOptions() {
  const names = new Map();
  for (const c of state.priceCatalog || []) names.set(catalogKey(c.name), c.name);
  for (const it of state.shopItems || []) if (it.name && !isRecipeParent(it) && !names.has(catalogKey(it.name))) names.set(catalogKey(it.name), it.name);
  return Array.from(names.values())
    .map((n) => `<option value="${escapeHtml(n)}">`)
    .join("");
}

function shopDetailLeafHtml(item, opts) {
  const { hint = "", extra = "", tickAction, tickKind = "leaf" } = opts;
  const inner = `<div class="shop-item ${item.bought ? "is-bought" : ""} ${item.parentId ? "is-child" : ""}" data-item-row>
                  <div class="thumb">${item.photo ? `<img src="${item.photo}" alt="">` : icon("image", { size: 22 })}</div>
                  <div>
                    <label class="tick-label tick-inline"><input type="checkbox" data-tick="${tickKind}" data-action="${tickAction}" data-id="${item.id}" ${item.bought ? "checked" : ""}>
                    <span class="title" style="font-weight:650">${escapeHtml(item.name)}${item.qty ? tr("log.sep") + escapeHtml(item.qty) : ""}</span></label>
                    ${item.alt ? `<div class="tiny muted">${escapeHtml(item.alt)}</div>` : ""}
                    ${item.note ? `<div class="tiny muted">${escapeHtml(item.note)}</div>` : ""}
                    ${recentBadge(item, shopCtx())}
                    ${hint ? `<div class="price-hint">${hint}</div>` : ""}
                    <div class="chip-row" style="margin-top:0.4rem">
                      ${item.bought ? `<span class="tag ok">${tr("shop.bought")}</span>` : `<span class="tag">${tr("shop.notBought")}</span>`}
                      ${item.paidPrice !== "" && item.paidPrice != null ? `<span class="tag brass">${tr("shop.thisTime", { price: formatMoney(item.paidPrice) })}</span>` : ""}
                    </div>
                    ${extra}
                  </div>
                </div>`;
  return swipeRow(inner, "item-del", item.id);
}

function shopDetailGroupHtml(parent, children, leafHtml) {
  const st = parentTickState(children);
  const collapsed = isShopGroupCollapsed(parent.listId, parent.id);
  const inner = `<span class="thumb" aria-hidden="true">${icon("utensils", { size: 22 })}</span>
          <span class="shop-parent-copy"><span class="title" style="font-weight:650">${escapeHtml(parent.name)}</span>
          <span class="tiny muted">${parent.note ? escapeHtml(parent.note) + tr("log.sep") : ""}<span data-group-prog>${tr("shop.recipe.progress", { done: st.done, total: st.total })}</span></span></span>`;
  const parentRow = `<div class="shop-item is-parent">
        <label class="tick-check"><input type="checkbox" data-tick="parent" data-action="${parentTickAction()}" data-id="${escapeHtml(parent.id)}" ${st.checked ? "checked" : ""} aria-label="${escapeHtml(tr("shop.recipe.tickAll", { name: parent.name || "" }))}"></label>
        <div class="shop-parent-main">
          ${shopGroupToggleHtml(parent, collapsed, inner)}
        </div>
      </div>`;
  return `<section class="shop-group ${st.checked ? "is-bought" : ""} ${collapsed ? "is-collapsed" : ""}" data-recipe-group="${escapeHtml(parent.id)}" data-list="${escapeHtml(parent.listId || "")}">
      ${swipeRow(parentRow, "item-del", parent.id, { confirmKey: "shop.recipe.deleteConfirm", confirmName: parent.name || "" })}
      <div class="shop-children"${collapsed ? " hidden" : ""}>${children.map(leafHtml).join("")}</div>
    </section>`;
}

function shopDetailForestHtml(items, leafOptsFor) {
  const forest = shopForest(items);
  if (!forest.length) return `<div class="card"><p class="muted" style="margin:0">${tr("shop.items.none")}</p></div>`;
  return forest
    .map((node) => {
      if (node.type === "recipe") return shopDetailGroupHtml(node.parent, node.children, (item) => shopDetailLeafHtml(item, leafOptsFor(item)));
      /* keep leftover meal group headings for ungrouped legacy items */
      return shopDetailLeafHtml(node.item, leafOptsFor(node.item));
    })
    .join("");
}

function viewShop() {
  const h = helper();
  if (!h) return emptyHelperPrompt(tr("leave.empty.title"));
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">${tr("shop.title")}</h1>
    <p class="lede">${tr("shop.lede")}</p>
    <div class="btn-row">
      <button class="btn" type="button" data-action="shop-new">${tr("shop.new")}</button>
    </div>
    <div style="margin-top:0.9rem">${shopBrowser(listsFor(h), itemsForList, "shop-detail", "shop.none")}</div>
    ${shopSettingsCard(false)}
  `;
}

function viewShopDetail() {
  const h = helper();
  if (!h) return emptyHelperPrompt(tr("leave.empty.title"));
  const list = state.shopLists.find((l) => l.id === ui.shopListId && l.helperId === h.id);
  if (!list) {
    return `<button class="linkish back-row" type="button" data-go="shop">${tr("shop.back")}</button>
      <div class="error-state"><h1 class="screen-title">${tr("shop.notFound")}</h1><p class="lede">${tr("shop.notFound.hint")}</p></div>`;
  }
  const items = itemsForList(list.id);
  return `
    <button class="linkish back-row" type="button" data-go="shop">${tr("shop.back")}</button>
    <header class="shop-detail-head">${shopHeadLines(list, { titleClass: "screen-title shop-line-date" })}</header>
    ${list.note ? `<p class="tiny muted" style="margin:0 0 0.5rem">${escapeHtml(list.note)}</p>` : ""}
    <p class="lede">${tr("shop.detail.lede")}</p>
    ${shopDateFieldHtml({ value: listDate(list), action: "list-date", listId: list.id, name: "" })}
    <div class="btn-row">
      <button class="btn" type="button" data-action="item-new" data-list="${list.id}">${tr("shop.addItem")}</button>
      <button class="btn secondary" type="button" data-action="list-recipes-open" data-list="${list.id}">${icon("book", { size: 16 })}${tr("shop.pick.open")}</button>
      ${
        list.status !== "done"
          ? `<button class="btn secondary" type="button" data-action="shop-complete" data-list="${list.id}">${tr("shop.complete")}</button>`
          : `<button class="btn secondary" type="button" data-action="shop-reopen" data-list="${list.id}">${tr("shop.reopen")}</button>`
      }
    </div>
    <div style="margin-top:0.5rem">
      ${shopDetailForestHtml(items, (item) => {
        const cat = findCatalog(state, item.name);
        const hint = cat
          ? `<button type="button" class="price-hint-btn" data-action="price-history" data-key="${escapeHtml(cat.key)}">${lastPriceText(cat)} <span class="hist-link">${tr("shop.hist.link")}</span></button>`
          : "";
        const extra = `<div class="btn-row" style="margin-top:0.35rem">
                      <button class="btn secondary" type="button" data-action="item-edit" data-id="${item.id}" style="min-height:2.4rem;padding:0.3rem 0.7rem">${tr("shop.editItem")}</button>
                    </div>`;
        return { hint, extra, tickAction: "item-tick" };
      })}
    </div>
    <div class="btn-row">
      <button class="btn danger" type="button" data-action="shop-del" data-list="${list.id}">${tr("shop.delete")}</button>
    </div>
  `;
}

/** Build the shared payload for a helper. Pure read of state; the same call feeds the change signature. */
function sharePayloadFor(h, { recipes, menuShare, docs = null, withDocs = false }) {
  return buildSharePayload({
    includeDocs: withDocs,
    docs,
    helper: h,
    arrangedRestDays: arrangedFor(h),
    leaveLogs: state.leaveLogs,
    shStatuses: state.shStatuses,
    payments: state.payments,
    workTasks: state.workTasks,
    workRules: state.workRules,
    shopLists: state.shopLists,
    shopItems: state.shopItems,
    priceCatalog: state.priceCatalog,
    customReminders: state.customReminders,
    menu: menuShare,
    recipes,
    prefs: { diet: normalizeDiet(state.settings.diet), recentBuyDays: prefsData().recentBuyDays },
  });
}

function shareMenuWindow() {
  return menuForShare(state.menu, shiftISO(today(), -SHARE_MENU_PAST_DAYS), shiftISO(today(), SHARE_MENU_FUTURE_DAYS));
}

function hashString(str) {
  let h1 = 0x811c9dc5;
  let h2 = 5381;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = (Math.imul(h2, 33) + c) | 0;
  }
  return (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16) + ":" + str.length;
}

let sigMemo = { rev: -1, key: "", sig: "" };
let saveRev = 0;

/** Synchronous fingerprint of what the helper would receive (no timestamps, photos reduced to a flag). */
function shareSig(h) {
  const key = `${h.id}|${today()}`;
  if (sigMemo.rev === saveRev && sigMemo.key === key) return sigMemo.sig;
  const recipes = (state.recipes || []).map((r) => ({ ...r, photo: recipePhotosOf(r).length ? "1" : "", photos: recipePhotosOf(r).length ? ["1"] : [] }));
  const p = sharePayloadFor(h, { recipes, menuShare: shareMenuWindow() });
  delete p.generatedAt;
  delete p.shareId;
  const sig = hashString(JSON.stringify(p));
  sigMemo = { rev: saveRev, key, sig };
  return sig;
}

/** Encrypt a fresh snapshot. Drops recipe photos when the link would get too long for a chat message. */
async function buildShare({ h, pin, shareId, withDocs, maxLen = 0 }) {
  const shareDocs = withDocs ? await docsForShare(h.docs) : null;
  if (withDocs && docsChars(shareDocs) > MAX_SHARE_DOC_CHARS) {
    toast(tr("share.docs.tooBig"));
    return null;
  }
  const menuShare = shareMenuWindow();
  let recipesShare = await recipesForShare(state.recipes);
  let photosDropped = false;
  const makePayload = (recipes) => {
    const p = sharePayloadFor(h, { recipes, menuShare, docs: shareDocs, withDocs });
    p.shareId = shareId;
    return p;
  };
  try {
    let payload = makePayload(recipesShare);
    let packed = await encryptShare(payload, pin);
    const limit = maxLen || (withDocs ? docsChars(shareDocs) * 1.4 : 0) + 400000;
    if (packed.length > limit && recipesShare.some((r) => r.photo || (r.photos || []).length)) {
      photosDropped = true;
      recipesShare = recipesShare.map((r) => {
        const keep = (r.photos || []).filter(isLibraryPhotoPath);
        return { ...r, photo: keep[0] || "", photos: keep };
      });
      payload = makePayload(recipesShare);
      packed = await encryptShare(payload, pin);
    }
    return { packed, payload, photosDropped };
  } catch (err) {
    console.warn(err);
    toast(tr("toast.shareFailed"));
    return null;
  }
}

function recordShare(h, built, { pin, shareId, withDocs }) {
  const { packed, payload } = built;
  state.helperAccess[h.id] = {
    shareId,
    packed: withDocs || packed.length > 120000 ? "" : packed,
    withDocs,
    generatedAt: payload.generatedAt,
    revoked: false,
    helperName: h.name,
    pin,
    sharedSig: shareSig(h),
    sentAt: payload.generatedAt,
  };
  save();
  upsertInbox({
    shareId,
    helperId: h.id,
    packed,
    generatedAt: payload.generatedAt,
    label: h.name,
  });
}

async function generateShare() {
  const h = helper();
  if (!h) return toast(tr("toast.addHelperFirst"));
  const pin = randomPin();
  const shareId = uid("share");
  const withDocs = Boolean(ui.shareDocs && hasIdInfo(h));
  const built = await buildShare({ h, pin, shareId, withDocs });
  if (!built) return;
  recordShare(h, built, { pin, shareId, withDocs });
  ui.shareReveal = { pin, packed: built.packed, url: shareUrl(built.packed), helperName: h.name, shareId, withDocs };
  ui.updateSent = null;
  ui.shareDocs = false;
  ui.tab = "share";
  location.hash = "#/share";
  render();
  if (built.photosDropped) toast(tr("toast.sharePhotosDropped"));
}

/** WhatsApp number for wa.me: digits only; a bare 8-digit number is treated as Hong Kong. Otherwise none. */
function waPhone(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const digits = s.replace(/\D/g, "");
  if (/^(\+|00)/.test(s)) return digits.replace(/^00/, "");
  if (/^[2-9]\d{7}$/.test(digits)) return `852${digits}`;
  if (/^852[2-9]\d{7}$/.test(digits)) return digits;
  return "";
}

function updateMessage(url) {
  return `${tIn("zh-Hant", "update.msg", { app: tIn("zh-Hant", "app.name") })}\n\n${tIn("en", "update.msg", { app: tIn("en", "app.name") })}\n\n${url}`;
}

/** One tap: re-encrypt the latest data with the saved PIN and hand a fresh link to WhatsApp (or the share sheet). */
async function sendUpdate(mode) {
  const h = helper();
  if (!h) return toast(tr("toast.addHelperFirst"));
  const a = state.helperAccess[h.id];
  if (!a || a.revoked || !a.pin) {
    toast(tr("update.needFirst"));
    ui.tab = "share";
    location.hash = "#/share";
    render();
    return;
  }
  const built = await buildShare({ h, pin: a.pin, shareId: a.shareId, withDocs: false, maxLen: 45000 });
  if (!built) return;
  if (built.packed.length > 60000) {
    toast(tr("update.tooBig"));
    ui.tab = "share";
    location.hash = "#/share";
    render();
    return;
  }
  recordShare(h, built, { pin: a.pin, shareId: a.shareId, withDocs: false });
  const url = shareUrl(built.packed);
  const msg = updateMessage(url);
  const phone = waPhone(h.phone);
  const wa = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  ui.updateSent = { helperId: h.id, at: built.payload.generatedAt, wa, msg, phone: Boolean(phone) };
  render();
  if (mode === "native" && navigator.share) {
    try {
      await navigator.share({ title: tr("app.name"), text: msg.replace(url, "").trim(), url });
    } catch {
      /* cancelled */
    }
    return;
  }
  const win = window.open(wa, "_blank", "noopener,noreferrer");
  if (!win) toast(tr("update.popupBlocked"));
  else if (built.photosDropped) toast(tr("toast.sharePhotosDropped"));
}

/** Employer card: badge when data changed since the last snapshot sent to this helper. */
function sendUpdateCard(where) {
  const h = helper();
  if (!h) return "";
  const a = state.helperAccess[h.id];
  const has = Boolean(a && !a.revoked);
  const ready = has && a.pin;
  const changed = has && (!a.sharedSig || a.sharedSig !== shareSig(h));
  const sent = ui.updateSent && ui.updateSent.helperId === h.id ? ui.updateSent : null;
  const lastSent = has && a.sentAt ? fmtDateTime(a.sentAt) : "";
  const badge = !has ? "" : changed ? `<span class="su-badge changed" data-role="update-badge">${tr("update.badge.changed")}</span>` : `<span class="su-badge ok" data-role="update-badge">${tr("update.badge.ok")}</span>`;
  const btn = ready
    ? `<button class="btn" type="button" data-action="send-update">${icon("share", { size: 16 })}${tr("update.send")}</button>${navigator.share && where === "share" ? `<button class="btn secondary" type="button" data-action="send-update-native">${tr("update.sendNative")}</button>` : ""}`
    : has
      ? `<button class="btn" type="button" data-action="share-generate">${tr("update.renew")}</button>`
      : `<a class="btn" href="#/share">${tr("update.create")}</a>`;
  return `<section class="card send-update ${changed ? "is-changed" : ""}" data-role="send-update">
    <div class="su-head"><strong>${tr("update.title")}</strong>${badge}</div>
    <p class="tiny muted" style="margin:0.25rem 0 0.6rem">${!has ? tr("update.none") : changed ? tr("update.hint.changed") : tr("update.hint.ok")}${lastSent ? ` ${tr("update.lastSent", { when: lastSent })}` : ""}</p>
    <div class="btn-row" style="margin:0">${btn}</div>
    ${
      sent
        ? `<div class="su-sent"><p class="tiny" style="margin:0 0 0.4rem">✓ ${tr("update.sent", { when: fmtDateTime(sent.at) })}${sent.phone ? "" : ` ${tr("update.noPhone")}`}</p>
        <div class="btn-row" style="margin:0"><a class="btn secondary small" href="${escapeHtml(sent.wa)}" target="_blank" rel="noopener noreferrer">${tr("update.openWa")}</a><button class="btn secondary small" type="button" data-action="update-copy">${tr("update.copyMsg")}</button></div></div>`
        : ""
    }
  </section>`;
}

function viewShare() {
  const h = helper();
  if (!h) return emptyHelperPrompt(tr("leave.empty.title"));
  const access = state.helperAccess[h.id];
  const reveal = ui.shareReveal;
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">${tr("share.title")}</h1>
    <p class="lede">${tr("share.lede")}</p>
    <div class="card" style="margin-bottom:0.8rem">
      <label class="switch-field">
        <span><strong>${tr("share.docs.label")}</strong><span class="hint">${hasIdInfo(h) ? tr("share.docs.hint") : tr("share.docs.none")}</span></span>
        <span class="switch"><input type="checkbox" data-action="toggle-share-docs" ${ui.shareDocs && hasIdInfo(h) ? "checked" : ""} ${hasIdInfo(h) ? "" : "disabled"}><span></span></span>
      </label>
    </div>
    <p class="tiny muted" style="margin:0 0 0.8rem">${tr("share.menuNote")}</p>
    ${sendUpdateCard("share")}
    ${access && !access.revoked && access.pin && !reveal ? `<p class="tiny muted" style="margin:0 0 0.8rem">${tr("share.pinSaved", { pin: escapeHtml(access.pin) })}</p>` : ""}
    ${
      reveal
        ? `<div class="card">
            <p style="margin:0 0 0.3rem">${tr("share.reveal", { name: escapeHtml(reveal.helperName) })}</p>
            <div class="share-pin" aria-label="${tr("share.pinLabel")}">${escapeHtml(reveal.pin)}</div>
            <div class="btn-row">
              <button class="btn" type="button" data-action="copy-pin">${tr("share.copyPin")}</button>
              ${
                location.protocol === "http:" || location.protocol === "https:"
                  ? `<button class="btn secondary" type="button" data-action="copy-link">${tr("share.copyLink")}</button>
                     <button class="btn secondary" type="button" data-action="share-native">${tr("share.native")}</button>`
                  : `<button class="btn secondary" type="button" data-action="copy-packed">${tr("share.copyPacked")}</button>`
              }
            </div>
            ${reveal.withDocs ? `<p class="note-box" style="margin:0.8rem 0 0">${tr("share.docs.included")}</p>` : ""}
            <p class="tiny muted" style="margin:0.8rem 0 0.3rem">${tr("share.fileHint")}</p>
            <div class="share-box"><textarea id="share-packed" readonly rows="6">${escapeHtml(reveal.packed)}</textarea></div>
          </div>`
        : access && !access.revoked
          ? `<div class="card">
              <p style="margin:0">${tr("share.exists", { when: access.generatedAt ? tr("when.on", { date: formatDate(access.generatedAt.slice(0, 10)) }) : tr("when.earlier") })}</p>
              <div class="btn-row">
                <button class="btn" type="button" data-action="share-generate">${tr("share.regenerate")}</button>
                <button class="btn danger" type="button" data-action="share-revoke">${tr("share.revoke")}</button>
              </div>
            </div>`
          : `<div class="card">
              <p style="margin:0">${tr("share.none")}</p>
              <div class="btn-row"><button class="btn" type="button" data-action="share-generate">${tr("share.generate")}</button></div>
            </div>`
    }
    <div class="note-box" style="margin-top:0.9rem">
      ${tr("share.revokeNote")}
    </div>
  `;
}

function viewMore() {
  const h = helper();
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">${tr("tab.more")}</h1>
    <div class="card">
      <button class="row" type="button" data-go="leave"><div class="grow"><div class="title">${tr("tab.leave")}</div><div class="sub">${tr("more.leave.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="pay"><div class="grow"><div class="title">${tr("more.pay")}</div><div class="sub">${tr("more.pay.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="remind"><div class="grow"><div class="title">${tr("home.reminders")}</div><div class="sub">${tr("more.remind.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="tasks"><div class="grow"><div class="title">${tr("tab.tasks")}</div><div class="sub">${tr("more.tasks.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="rules"><div class="grow"><div class="title">${tr("tab.rules")}</div><div class="sub">${tr("more.rules.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="shop"><div class="grow"><div class="title">${tr("shop.title")}</div><div class="sub">${tr("more.shop.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="menu"><div class="grow"><div class="title">${tr("menu.title")}</div><div class="sub">${tr("more.menu.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="recipes"><div class="grow"><div class="title">${tr("recipe.title")}</div><div class="sub">${tr("more.recipes.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="share"><div class="grow"><div class="title">${tr("share.generate")}</div><div class="sub">${tr("more.share.sub")}</div></div>${icon("chevron")}</button>
      ${
        h
          ? `<button class="row" type="button" data-go="helper-edit"><div class="grow"><div class="title">${tr("more.helperData")}</div><div class="sub">${escapeHtml(h.name)}</div></div>${icon("chevron")}</button>`
          : `<button class="row" type="button" data-go="helper-new"><div class="grow"><div class="title">${tr("helper.add")}</div><div class="sub">${tr("more.helperNew.sub")}</div></div>${icon("chevron")}</button>`
      }
      <button class="row" type="button" data-go="guide"><div class="grow"><div class="title">${tr("more.guide")}</div><div class="sub">${tr("more.guide.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="backup"><div class="grow"><div class="title">${tr("backup.title")}</div><div class="sub">${tr("more.backup.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-action="choose-role" data-role="helper"><div class="grow"><div class="title">${tr("more.switchHelper")}</div><div class="sub">${tr("more.switchHelper.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-action="choose-role" data-role=""><div class="grow"><div class="title">${tr("onboard.backToRole")}</div></div>${icon("chevron")}</button>
    </div>
    <div class="card lang-card">
      <div class="title">${tr("lang.label")}</div>
      ${langSwitch()}
    </div>
    ${viewDisplayPrefs()}
    ${disclaimer()}
  `;
}

function viewGuide() {
  return `
    <button class="linkish back-row" type="button" data-go="more">${tr("common.backMore")}</button>
    <h1 class="screen-title">${tr("more.guide")}</h1>
    <p class="lede">${tr("guide.lede")}</p>
    ${GUIDE_SECTIONS.map((s) => {
      const checked = state.guideChecks[s.id] !== false;
      return `<article class="guide-block">
        <label class="switch-field" style="border:0;padding:0 0 0.5rem">
          <span><strong>${escapeHtml(pick(s, "titleZh", "titleEn"))}</strong></span>
          <span class="switch">
            <input type="checkbox" data-action="guide-check" data-id="${s.id}" ${checked ? "checked" : ""}>
            <span></span>
          </span>
        </label>
        <p style="margin:0 0 0.4rem">${escapeHtml(pick(s, "bodyZh", "bodyEn"))}</p>
        <p class="tiny">${(s.links || [])
          .map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${escapeHtml(pick(l))}</a>`)
          .join(tr("link.sep"))}</p>
      </article>`;
    }).join("")}
    ${disclaimer()}
  `;
}

function viewBackup() {
  return `
    <button class="linkish back-row" type="button" data-go="more">${tr("common.backMore")}</button>
    <h1 class="screen-title">${tr("backup.title")}</h1>
    <p class="lede">${tr("backup.lede")}</p>
    <div class="btn-row">
      <button class="btn" type="button" data-action="do-export">${tr("backup.export")}</button>
      <label class="btn secondary" style="cursor:pointer">${tr("backup.restore")}
        <input type="file" accept="application/json,.json" data-action="do-import" hidden>
      </label>
    </div>
    <div class="btn-row">
      <button class="btn secondary" type="button" data-action="load-demo">${tr("demo.load")}</button>
    </div>
    ${disclaimer()}
  `;
}

function viewHelperForm(mode) {
  const editing = mode === "edit" ? helper() : null;
  ensureDocDraft(mode, editing);
  const form = editing || {
    name: "",
    nationality: "philippines",
    startDate: "",
    contractStart: "",
    contractEnd: "",
    wage: CURRENT_MAW.wage,
    foodProvided: true,
    foodAllowance: CURRENT_MAW.food,
    restDay: 0,
    phone: "",
    notes: "",
    visaExpiry: "",
    passportExpiry: "",
    winterChoice: "christmas",
  };
  return `
    <button class="linkish back-row" type="button" data-go="${editing ? "home" : "onboard"}">${tr("common.back")}</button>
    <h1 class="screen-title">${editing ? tr("form.editTitle") : tr("helper.add")}</h1>
    <form id="helper-form" data-mode="${mode}">
      <input type="hidden" name="helperId" value="${escapeHtml(form.id || "")}">
      <label class="field"><span>${tr("form.name")}</span>
        <input name="name" required autocomplete="name" value="${escapeHtml(form.name || "")}" maxlength="80">
      </label>
      <label class="field"><span>${tr("form.nationality")}</span>
        <select name="nationality">
          ${NATIONALITIES.map((n) => `<option value="${n.id}" ${form.nationality === n.id ? "selected" : ""}>${pick(n)}</option>`).join("")}
        </select>
      </label>
      <label class="field"><span>${tr("form.startDate")}</span>
        <input type="date" name="startDate" required value="${escapeHtml(form.startDate || "")}">
      </label>
      <label class="field"><span>${tr("form.contractStart")}<span class="hint">${tr("form.contractStart.hint")}</span></span>
        <input type="date" name="contractStart" value="${escapeHtml(form.contractStart || "")}">
      </label>
      <label class="field"><span>${tr("form.contractEnd")}<span class="hint">${tr("form.contractEnd.hint")}</span></span>
        <input type="date" name="contractEnd" value="${escapeHtml(form.contractEnd || "")}">
      </label>
      <label class="field"><span>${tr("form.wage")}</span>
        <input type="number" name="wage" inputmode="decimal" min="0" step="1" value="${escapeHtml(form.wage ?? CURRENT_MAW.wage)}">
      </label>
      <label class="switch-field">
        <span><strong>${tr("form.foodProvided")}</strong><span class="hint">${tr("form.foodProvided.hint")}</span></span>
        <span class="switch"><input type="checkbox" name="foodProvided" ${form.foodProvided ? "checked" : ""}><span></span></span>
      </label>
      <label class="field"><span>${tr("form.foodAllowance")}</span>
        <input type="number" name="foodAllowance" inputmode="decimal" min="0" step="1" value="${escapeHtml(form.foodAllowance ?? CURRENT_MAW.food)}">
      </label>
      <fieldset class="field">
        <legend class="lbl">${tr("leave.pane.rest")}</legend>
        <p class="hint" style="margin:0 0 0.4rem">${tr("form.restDay.hint")}</p>
        <select name="restDay">
          ${REST_DAY_OPTIONS.map(
            (o) => `<option value="${o.id}" ${String(form.restDay) === String(o.id) ? "selected" : ""}>${pick(o)}</option>`
          ).join("")}
        </select>
      </fieldset>
      <label class="field"><span>${tr("form.phone")}</span>
        <input type="tel" name="phone" autocomplete="tel" inputmode="tel" value="${escapeHtml(form.phone || "")}">
      </label>
      <label class="field"><span>${tr("form.visa")}</span>
        <input type="date" name="visaExpiry" value="${escapeHtml(form.visaExpiry || "")}">
      </label>
      <label class="field"><span>${tr("form.passport")}</span>
        <input type="date" name="passportExpiry" value="${escapeHtml(form.passportExpiry || "")}">
      </label>
      <section class="doc-section">
        <h2>${tr("doc.section.title")}</h2>
        ${docEditBlock("passport", "passportNo", form.passportNo, form)}
        ${docEditBlock("hkid", "hkidNo", form.hkidNo, form)}
        <p class="note-box" style="margin:0.6rem 0 0">${tr("doc.privacy")}</p>
      </section>
      <label class="field"><span>${tr("form.notes")}<span class="hint">${tr("form.notes.hint")}</span></span>
        <textarea name="notes" maxlength="2000">${escapeHtml(form.notes || "")}</textarea>
      </label>
      <div class="btn-row">
        <button class="btn" type="submit">${tr("common.save")}</button>
        ${editing ? `<button class="btn danger" type="button" data-action="helper-delete">${tr("form.delete")}</button>` : ""}
      </div>
    </form>
    ${disclaimer()}
  `;
}

/* ---------- helper surfaces ---------- */

function sessionPayload() {
  return helperSession?.payload || null;
}

function sessionHelper() {
  return sessionPayload()?.helper || null;
}

function helperReminderList() {
  const p = sessionPayload();
  if (!p?.helper) return [];
  const h = { ...p.helper };
  return mergeReminders(
    buildReminders(h, today(), { arrangedRestDays: p.arrangedRestDays || [], forHelper: true }),
    buildCustomReminders(p.customReminders || [], [h], today())
  );
}

function sameDeviceWriteback() {
  const p = sessionPayload();
  if (!p?.helper?.id || !p.shareId) return false;
  const access = state.helperAccess[p.helper.id];
  return Boolean(access && access.shareId === p.shareId && !access.revoked);
}

function viewHelperEnter() {
  const inbox = loadInbox().filter((x) => {
    const acc = state.helperAccess[x.helperId];
    return !acc || !acc.revoked || acc.shareId !== x.shareId;
  });
  return `
    <h1 class="screen-title">${tr("enter.title")}</h1>
    <p class="lede">${tr("enter.lede")}</p>
    ${
      ui.pinError
        ? `<div class="note-box danger">${escapeHtml(tr(ui.pinError))}</div>`
        : ""
    }
    <form id="helper-unlock">
      <label class="field"><span>${tr("enter.pin")}</span>
        <input class="pin-boxes" name="pin" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" required placeholder="••••••">
      </label>
      <label class="field"><span>${tr("enter.packed")}</span>
        <textarea name="packed" rows="5" placeholder="${tr("enter.packed.ph")}">${escapeHtml(ui.pendingShare || "")}</textarea>
      </label>
      <div class="btn-row">
        <button class="btn" type="submit">${tr("enter.open")}</button>
      </div>
    </form>
    ${
      inbox.length
        ? `<section class="section">
            <div class="section-head"><h2>${tr("enter.inbox")}</h2></div>
            <div class="card">
              ${inbox
                .map(
                  (x) => `<p class="tiny muted" style="margin:0 0 0.35rem">${tr("enter.inboxItem", { label: escapeHtml(x.label || tr("common.helper")), when: x.generatedAt ? tr("when.on", { date: formatDate(String(x.generatedAt).slice(0, 10)) }) : tr("when.earlier") })}</p>`
                )
                .join("")}
            </div>
          </section>`
        : ""
    }
    <button class="linkish" type="button" data-action="choose-role" data-role="">${tr("onboard.backToRole")}</button>
    ${disclaimer()}
  `;
}

function viewHelperHome() {
  const p = sessionPayload();
  const h = sessionHelper();
  if (!p || !h) return viewHelperEnter();
  const t = today();
  const cs = contractStatus(h, t);
  const start = h.contractStart || h.startDate;
  const paidFrom = paidStatutoryStart(h.startDate || h.contractStart);
  const vest = annualLeaveVestDate(h.startDate || h.contractStart);
  const al = helperAnnualBalance(h, p, t);
  const pillClass =
    cs.key === "ok" ? "" : cs.key === "watch" || cs.key === "soon" ? "warn" : cs.key === "expired" || cs.key === "critical" ? "danger" : "warn";
  const restValue = isArrangedRestPolicy(h.restDay) ? tr("rest.arranged") : tr("rest.valueWeekly", { day: weekdayLabel(h.restDay) });
  const reminders = helperReminderList().slice(0, 3);
  const acked = isAcked(p.shareId);
  const contractValue = cs.daysLeft == null ? "—" : cs.daysLeft < 0 ? tr("home.stat.ended") : String(cs.daysLeft);
  const contractUnit = cs.daysLeft != null && cs.daysLeft >= 0 ? tr("unit.d") : "";
  return `
    ${
      true
        ? `<section class="welcome">
      <div>
        <div class="eyebrow">${tr(greetingKey())} · ${tr("header.helperView")}</div>
        <h1 class="screen-title">${escapeHtml(h.name)}</h1>
        <p class="lede">${tr("hhome.lede", { gen: "" })}</p>
        ${p.generatedAt ? `<p class="last-updated" data-role="last-updated">${helperSession?.updatedAt && Date.now() - Date.parse(helperSession.updatedAt) < 864e5 ? `<span class="su-badge ok">✓ ${tr("update.helper.badge")}</span> ` : ""}${tr("update.helper.last", { when: escapeHtml(fmtDateTime(p.generatedAt)) })}</p>` : ""}
      </div>
      <span class="status-pill ${pillClass}">${cs.label}</span>
    </section>`
        : ""
    }
    ${
      true
        ? `<section class="stat-grid">
      ${statCard({
        label: tr("home.stat.contract"),
        ic: "clock",
        value: contractValue,
        unit: contractUnit,
        foot: cs.daysLeft == null ? tr("rail.needDates.helper") : h.contractEnd ? tr("home.stat.contractTo", { date: formatDate(h.contractEnd) }) : "",
      })}
      ${statCard({
        label: tr("home.stat.annual"),
        ic: "leaf",
        value: t < vest ? "—" : String(al.remaining),
        unit: t < vest ? "" : tr("unit.d"),
        foot: t < vest ? tr("home.annual.from", { date: formatDate(vest, { short: true }) }) : tr("home.stat.annualFoot", { total: al.total, taken: al.taken }),
        go: "h-leave",
      })}
      ${statCard({ label: tr("leave.pane.rest"), ic: "stamp", value: restValue, foot: "", go: "h-leave" })}
      ${statCard({ label: tr("home.paidStart"), ic: "calendar", value: paidFrom ? formatDate(paidFrom, { short: true }) : "—", foot: "" })}
    </section>`
        : ""
    }
    ${
      true
        ? `<section class="section">
      <div class="section-head"><h2>${tr("hhome.fromEmployer")}</h2></div>
      ${entryCards(h, "h-")}
    </section>`
        : ""
    }
    ${
      true
        ? `<section class="panel" style="margin-top:1rem">
      <div class="panel-title"><h2>${tr("home.reminders")}</h2><button class="linkish" type="button" data-go="h-remind">${tr("common.all")}</button></div>
      ${timelineHtml(reminders, "h-remind")}
    </section>`
        : ""
    }
    ${true ? menuHomeCard() : ""}
    ${true ? idDocsPanel(h, "session") : ""}
    ${
      true
        ? `<div class="card" style="margin-top:1rem">
      <label class="switch-field">
        <span>
          <strong>${tr("hhome.ack")}</strong>
          <span class="hint">${tr("hhome.ack.hint")}</span>
        </span>
        <span class="switch">
          <input type="checkbox" data-action="helper-ack" ${acked ? "checked" : ""}>
          <span></span>
        </span>
      </label>
    </div>`
        : ""
    }
    ${disclaimer()}
  `;
}

function helperAnnualBalance(h, p, on) {
  const vested = vestedAnnualLeaveAsOf(h.startDate || h.contractStart, on);
  const logs = (p.leaveLogs || []).filter((l) => l.type === "annual" && l.startDate && l.startDate <= on);
  const taken = logs.reduce((s, l) => s + (Number(l.days) || 0), 0);
  return { ...vested, taken, remaining: Math.max(0, vested.total - taken) };
}

function helperShStatus(p, date) {
  return (p.shStatuses || {})[date] || { status: "pending", lieuDate: "", note: "" };
}

function viewHelperLeave() {
  const p = sessionPayload();
  const h = sessionHelper();
  if (!p || !h) return viewHelperEnter();
  const t = today();
  const arranged = p.arrangedRestDays || [];
  const upcoming = upcomingRestDaysFor(h, arranged, t, 8);
  const year = ui.year;
  const list = allObservedDatesForYear(year, h.winterChoice || "christmas", Boolean(h.grantGeneralHolidays)).filter((d) =>
    inEmployment(h, d.date)
  );
  const marks = {};
  const winter = h.winterChoice || "christmas";
  statutoryHolidaysForYear(year, winter).forEach((d) => {
    marks[d.date] = { ...(marks[d.date] || {}), sh: true };
  });
  if (h.grantGeneralHolidays) {
    extraGeneralHolidays(year, winter).forEach((d) => {
      marks[d.date] = { ...(marks[d.date] || {}), gh: true };
    });
  }
  const dim = daysInMonth(year, ui.month);
  for (let d = 1; d <= dim; d++) {
    const iso = toISO(new Date(year, ui.month, d));
    if (isRestDayOn(h, iso, arranged)) marks[iso] = { ...(marks[iso] || {}), rest: true };
  }
  (p.leaveLogs || [])
    .filter((l) => l.type === "annual")
    .forEach((log) => {
      if (!log.startDate) return;
      const end = log.endDate || log.startDate;
      let c = parseISO(log.startDate);
      const last = parseISO(end);
      while (c && last && c <= last) {
        const iso = toISO(c);
        marks[iso] = { ...(marks[iso] || {}), annual: true };
        c = addDays(c, 1);
      }
    });
  const al = helperAnnualBalance(h, p, t);
  return `
    <h1 class="screen-title">${tr("hleave.title")}</h1>
    <p class="lede">${isArrangedRestPolicy(h.restDay) ? tr("hleave.rest.arranged") : tr("hleave.rest.fixed", { day: weekdayLabel(h.restDay) })} ${tr("hleave.lede.tail")}</p>
    <div class="chip-row" style="margin-bottom:0.8rem">
      ${YEARS.map((y) => `<button class="chip ${year === y ? "is-on" : ""}" type="button" data-year="${y}">${y}</button>`).join("")}
    </div>
    <div class="card">
      ${monthNav()}
      ${monthGrid(year, ui.month, marks, false)}
      <div class="cal-legend">
        <span><i class="seal"></i>${tr("cal.legend.rest")}</span>
        <span><i></i>${tr("cal.legend.sh")}</span>
        <span><i class="brass"></i>${tr("cal.legend.annual")}</span>
        <span><i class="today"></i>${tr("cal.legend.today")}</span>
      </div>
    </div>
    <section class="section">
      <div class="section-head"><h2>${tr("leave.rest.upcoming")}</h2></div>
      <div class="card">
        ${upcoming.length ? upcoming.map((iso) => `<div class="row"><div class="grow"><div class="title">${formatDate(iso, { weekday: true })}</div></div></div>`).join("") : `<p class="muted" style="margin:0">${tr("hleave.noUpcoming")}</p>`}
      </div>
    </section>
    <section class="section">
      <div class="section-head"><h2>${tr("leave.pane.holidays")}</h2></div>
      <div class="card">
        ${
          list.length
            ? list
                .map((d) => {
                  const st = d.kind === "statutory" ? helperShStatus(p, d.date) : null;
                  const fakeH = h;
                  // reuse row in read-only by temporarily mapping shStatuses is hard; inline compact
                  const paid = d.kind === "statutory" && holidayPayEligible(h, d.date);
                  const restHit = isRestDayOn(h, d.date, arranged);
                  const statusLabel = pick(SH_STATUSES.find((s) => s.id === st?.status));
                  const dt = parseISO(d.date);
                  return `<div class="holiday-item">
                    <div class="date-block"><div class="m">${formatMonthShort(dt.getMonth())}</div><div class="d">${dt.getDate()}</div></div>
                    <div>
                      <div class="title" style="font-weight:650">${escapeHtml(holidayName(d))}</div>
                      <div class="tiny muted">${formatDate(d.date, { shortWeek: true })}${restHit ? tr("hol.onRestDay") : ""}</div>
                      <div class="chip-row" style="margin-top:0.35rem">
                        <span class="tag ${d.kind === "general" ? "extra" : paid ? "paid" : "unpaid"}">${d.kind === "general" ? tr("hol.tag.general") : paid ? tr("hol.tag.paid") : tr("hol.tag.unpaid")}</span>
                        ${st && st.status !== "pending" ? `<span class="tag">${statusLabel}</span>` : st ? `<span class="tag">${tr("hol.status.pending")}</span>` : ""}
                        ${st?.lieuDate ? `<span class="tag brass">${tr("hol.lieu", { date: formatDate(st.lieuDate, { short: true }) })}</span>` : ""}
                      </div>
                    </div>
                  </div>`;
                })
                .join("")
            : `<p class="muted" style="margin:0">${tr("leave.hol.none")}</p>`
        }
      </div>
    </section>
    <section class="section">
      <div class="section-head"><h2>${tr("hleave.annual")}</h2></div>
      <div class="card">
        <p style="margin:0">${tr("hleave.annual.text", { a: al.total, b: al.taken, c: al.remaining })}</p>
      </div>
    </section>
    ${disclaimer()}
  `;
}

function viewHelperTasks() {
  const p = sessionPayload();
  const h = sessionHelper();
  if (!p || !h) return viewHelperEnter();
  const list = p.workTasks || [];
  const t = today();
  const shareId = p.shareId;
  return `
    <h1 class="screen-title">${tr("tab.tasks")}</h1>
    <p class="lede">${tr("htasks.lede")}</p>
    <div class="card">
      ${
        list.length
          ? list
              .map((task) => {
                const applies = taskAppliesOn(task, t);
                const done = isTaskDone(shareId, task.id, t);
                const time = timeLabel(task);
                return `<div class="row">
                  <div class="grow">
                    <div class="title">${escapeHtml(task.title)}</div>
                    <div class="sub">${escapeHtml(scheduleLabel(task))}${time ? tr("log.sep") + escapeHtml(time) : ""}${applies ? tr("log.sep") + tr("htasks.appliesToday") : ""}</div>
                    ${task.detail ? `<p class="tiny muted" style="margin:0.3rem 0 0">${escapeHtml(task.detail)}</p>` : ""}
                    ${
                      applies
                        ? `<label class="switch-field" style="padding-bottom:0">
                            <span><strong>${tr("htasks.doneToday")}</strong><span class="hint">${tr("htasks.doneToday.hint")}</span></span>
                            <span class="switch"><input type="checkbox" data-action="task-done" data-id="${task.id}" ${done ? "checked" : ""}><span></span></span>
                          </label>`
                        : ""
                    }
                  </div>
                </div>`;
              })
              .join("")
          : `<p class="muted" style="margin:0">${tr("htasks.none")}</p>`
      }
    </div>
  `;
}

function viewHelperRules() {
  const p = sessionPayload();
  if (!p) return viewHelperEnter();
  const list = p.workRules || [];
  return `
    <h1 class="screen-title">${tr("tab.rules")}</h1>
    <p class="lede">${tr("hrules.lede")}</p>
    ${
      list.length
        ? list
            .map(
              (rule) => `<article class="card" style="margin-top:0.65rem">
                <h2>${escapeHtml(rule.title)}</h2>
                <p style="margin:0.45rem 0 0;white-space:pre-wrap">${escapeHtml(rule.body)}</p>
              </article>`
            )
            .join("")
        : `<div class="card"><p class="muted" style="margin:0">${tr("hrules.none")}</p></div>`
    }
  `;
}

function viewHelperShop() {
  const p = sessionPayload();
  if (!p) return viewHelperEnter();
  return `
    <h1 class="screen-title">${tr("shop.title")}</h1>
    <p class="lede">${tr("hshop.lede")}</p>
    ${shopBrowser(p.shopLists || [], (id) => (p.shopItems || []).filter((i) => i.listId === id), "h-shop-detail", "hshop.none")}
    ${shopSettingsCard(true)}
  `;
}

function viewHelperShopDetail() {
  const p = sessionPayload();
  if (!p) return viewHelperEnter();
  const list = (p.shopLists || []).find((l) => l.id === ui.shopListId);
  if (!list) {
    return `<button class="linkish back-row" type="button" data-go="h-shop">${tr("shop.back")}</button>
      <div class="error-state"><h1 class="screen-title">${tr("shop.notFound")}</h1></div>`;
  }
  const items = (p.shopItems || []).filter((i) => i.listId === list.id);
  const catOf = (name) => (p.priceCatalog || []).find((c) => c.key === catalogKey(name));
  return `
    <button class="linkish back-row" type="button" data-go="h-shop">${tr("shop.back")}</button>
    <header class="shop-detail-head">${shopHeadLines(list, { titleClass: "screen-title shop-line-date" })}</header>
    ${list.note ? `<p class="tiny muted" style="margin:0 0 0.5rem">${escapeHtml(list.note)}</p>` : ""}
    ${items.length
      ? shopDetailForestHtml(items, (item) => {
          const cat = catOf(item.name);
          const hint = cat
            ? `<button type="button" class="price-hint-btn" data-action="price-history" data-key="${escapeHtml(cat.key)}">${tr("hshop.lastPrice", { price: formatMoney(cat.lastPrice) })} <span class="hist-link">${tr("shop.hist.link")}</span></button>`
            : tr("hshop.afterBuy");
          const extra = `<label class="field" style="margin:0.4rem 0 0">
              <span>${tr("hshop.priceLabel")}</span>
              <input type="number" inputmode="decimal" min="0" step="0.1" data-action="h-item-price" data-id="${item.id}" value="${item.paidPrice ?? ""}" placeholder="${cat ? cat.lastPrice : ""}">
            </label>`;
          return { hint, extra, tickAction: "h-item-bought" };
        })
      : `<div class="card"><p class="muted" style="margin:0">${tr("hshop.items.none")}</p></div>`}
    ${sameDeviceWriteback() ? `<p class="tiny muted">${tr("hshop.writeback.same")}</p>` : `<p class="tiny muted">${tr("hshop.writeback.other")}</p>`}
  `;
}

function helperPayRecords(p) {
  const pays = (p.payments || []).slice().sort((a, b) => String(b.month || "").localeCompare(String(a.month || "")));
  const map = payConsentMap(p.shareId);
  const mine = Object.keys(map);
  return `
    <section class="section">
      <div class="section-head"><h2>${tr("pay.history")}</h2></div>
      <div class="card">
        ${
          pays.length
            ? pays
                .map((x) => {
                  const c = consentOf(x, p.shareId);
                  return `<div class="row pay-row"><div class="grow">
                    <div class="title">${escapeHtml(x.month || "—")}${tr("log.sep")}${formatMoney(payTotal(x))}</div>
                    <div class="sub">${x.paidOn ? formatDate(x.paidOn, { short: true }) : tr("pay.noPaidOn")}${methodLabel(x.method) ? tr("log.sep") + methodLabel(x.method) : ""}</div>
                    <div class="consent-line">${consentBadge(c)}</div>
                    ${c ? "" : `<div class="pay-actions"><button class="btn small" type="button" data-action="h-pay-confirm" data-id="${x.id}">${tr("hpay.confirm")}</button></div>`}
                  </div></div>`;
                })
                .join("")
            : `<p class="muted" style="margin:0">${tr("hpay.none")}</p>`
        }
      </div>
      ${
        mine.length
          ? `<div class="card" style="margin-top:0.8rem">
              <strong>${tr("hpay.code.title")}</strong>
              <p class="tiny muted" style="margin:0.3rem 0 0.5rem">${sameDeviceWriteback() ? tr("hpay.code.same") : tr("hpay.code.hint")}</p>
              <textarea id="return-code-out" rows="3" readonly>${escapeHtml(buildPayReturnCode(p.shareId, map))}</textarea>
              <div class="btn-row"><button class="btn secondary" type="button" data-action="copy-return">${tr("hpay.code.copy")}</button></div>
            </div>`
          : ""
      }
    </section>`;
}

function viewHelperPay() {
  const p = sessionPayload();
  const h = sessionHelper();
  if (!p || !h) return viewHelperEnter();
  const snap = monthPaySnapshot(h, today());
  return `
    <button class="linkish back-row" type="button" data-go="h-more">${tr("common.backMore")}</button>
    <h1 class="screen-title">${tr("pay.title")}</h1>
    <p class="lede">${tr("hpay.lede", { wage: formatMoney(h.wage), food: h.foodProvided ? tr("pay.lede.free") : tr("pay.lede.allowance", { amount: formatMoney(h.foodAllowance) }) })}</p>
    <div class="card">
      <div class="pay-total">${formatMoney(snap.total)}</div>
      <p class="tiny muted" style="margin:0.4rem 0 0">${snap.label}</p>
    </div>
    <div class="note-box" style="margin-top:0.8rem">${tr("hpay.note", { maw: formatMoney(CURRENT_MAW.wage), foodMin: formatMoney(CURRENT_MAW.food) })}</div>
    ${helperPayRecords(p)}
    ${disclaimer()}
  `;
}

function viewHelperRemind() {
  const list = helperReminderList();
  return `
    <button class="linkish back-row" type="button" data-go="h-more">${tr("common.backMore")}</button>
    <h1 class="screen-title">${tr("home.reminders")}</h1>
    <div class="card">
      ${
        list.length
          ? list
              .map(
                (r) => `<div class="row">
                  <div class="grow">
                    <div class="title">${escapeHtml(r.title)}${r.type === "custom" ? ` <span class="tag brass">${tr("remind.custom")}</span>` : ""}</div>
                    <div class="sub">${formatDate(r.date)}${r.type === "custom" && r.repeat !== "none" ? tr("log.sep") + tr(`remind.repeat.${r.repeat}`) : ""}</div>
                    ${r.body ? `<p class="tiny muted" style="margin:0.35rem 0 0">${escapeHtml(r.body)}</p>` : ""}
                  </div>
                  <span class="status-pill ${r.urgency}">${urgencyWord(r.urgency)}</span>
                </div>`
              )
              .join("")
          : `<p class="muted" style="margin:0">${tr("hhome.noReminders")}</p>`
      }
    </div>
  `;
}

function viewHelperRights() {
  return `
    <button class="linkish back-row" type="button" data-go="h-more">${tr("common.backMore")}</button>
    <h1 class="screen-title">${tr("hmore.rights")}</h1>
    <p class="lede">${tr("hrights.lede")}</p>
    ${HELPER_GUIDE_SECTIONS.map(
      (s) => `<article class="guide-block">
        <h3>${escapeHtml(pick(s, "titleZh", "titleEn"))}</h3>
        <p style="margin:0 0 0.4rem">${escapeHtml(pick(s, "bodyZh", "bodyEn"))}</p>
        <p class="tiny">${(s.links || [])
          .map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${escapeHtml(pick(l))}</a>`)
          .join(tr("link.sep"))}</p>
      </article>`
    ).join("")}
    ${disclaimer()}
  `;
}

function viewHelperMore() {
  const h = sessionHelper();
  return `
    <h1 class="screen-title">${tr("tab.more")}</h1>
    <div class="card">
      <button class="row" type="button" data-go="h-leave"><div class="grow"><div class="title">${tr("tab.leave")}</div><div class="sub">${tr("more.leave.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-pay"><div class="grow"><div class="title">${tr("pay.title")}</div><div class="sub">${tr("hmore.pay.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-remind"><div class="grow"><div class="title">${tr("home.reminders")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-tasks"><div class="grow"><div class="title">${tr("tab.tasks")}</div><div class="sub">${tr("more.tasks.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-rules"><div class="grow"><div class="title">${tr("tab.rules")}</div><div class="sub">${tr("more.rules.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-shop"><div class="grow"><div class="title">${tr("shop.title")}</div><div class="sub">${tr("hmore.shop.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-menu"><div class="grow"><div class="title">${tr("menu.title")}</div><div class="sub">${tr("more.menu.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-recipes"><div class="grow"><div class="title">${tr("recipe.title")}</div><div class="sub">${tr("more.recipes.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-rights"><div class="grow"><div class="title">${tr("hmore.rights")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-action="helper-lock"><div class="grow"><div class="title">${tr("hmore.lock")}</div><div class="sub">${tr("hmore.lock.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-action="choose-role" data-role="employer"><div class="grow"><div class="title">${tr("hmore.switchEmployer")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-action="choose-role" data-role=""><div class="grow"><div class="title">${tr("onboard.backToRole")}</div></div>${icon("chevron")}</button>
    </div>
    <div class="card lang-card">
      <div class="title">${tr("lang.label")}</div>
      ${langSwitch()}
    </div>
    ${viewDisplayPrefs()}
    ${disclaimer()}
  `;
}

/* ---------- meal plan (餐單) + recipes (菜譜) ---------- */

const _recipeCache = new WeakMap();
function sessionRecipes() {
  const p = sessionPayload();
  if (!p) return [];
  let r = _recipeCache.get(p);
  if (!r) {
    r = normalizeRecipes(p.recipes);
    _recipeCache.set(p, r);
  }
  return r;
}

function menuData() {
  if (role === "helper") {
    const p = sessionPayload();
    return { menu: p?.menu || null, recipes: allRecipes(sessionRecipes()), ro: true };
  }
  return { menu: state.menu, recipes: allRecipes(state.recipes), ro: false };
}

const RECENT_CHOICES = [0, 3, 7, 14, 30];
function prefsData() {
  const raw = role === "helper" ? sessionPayload()?.prefs || {} : { diet: state.settings.diet, recentBuyDays: state.settings.recentBuyDays };
  const days = Number(raw.recentBuyDays);
  return { diet: normalizeDiet(raw.diet), recentBuyDays: RECENT_CHOICES.includes(days) ? days : 7 };
}

function menuGo(name) {
  return role === "helper" ? `h-${name}` : name;
}

/* recipe display language: auto (follow app language), zh, en, or both */
function recipeMode() {
  const v = ui.recipeLang;
  if (v === "zh" || v === "en" || v === "both") return v;
  return getLang() === "en" ? "en" : "zh";
}
function biHtml(zh, en) {
  const mode = recipeMode();
  const z = escapeHtml(zh || "");
  const e = escapeHtml(en || "");
  if (mode === "both" && zh && en && zh !== en) return `<span class="bi-main">${z}</span><span class="bi-alt">${e}</span>`;
  if (mode === "en") return e || z;
  return z || e;
}
function recipeNameHtml(r) {
  const mode = recipeMode();
  if (mode === "both") return biHtml(r.nameZh || r.nameEn, r.nameEn);
  return escapeHtml(recipeName(r, mode));
}
function ingLine(i) {
  const mode = recipeMode();
  if (mode === "both") {
    const q = [i.qty, i.qtyEn && i.qtyEn !== i.qty ? i.qtyEn : ""].filter(Boolean).join(" / ");
    return `<span class="ing-name">${biHtml(i.zh || i.en, i.en)}</span><span class="ing-qty">${escapeHtml(q)}</span>`;
  }
  return `<span class="ing-name">${escapeHtml(ingName(i, mode))}</span><span class="ing-qty">${escapeHtml(ingQty(i, mode))}</span>`;
}
function stepHtml(s) {
  const mode = recipeMode();
  if (mode === "both") return biHtml(s.zh || s.en, s.en);
  return escapeHtml(stepText(s, mode));
}
function recipeLangSeg() {
  const cur = recipeMode();
  const opts = [["zh", "recipe.lang.zh"], ["en", "recipe.lang.en"], ["both", "recipe.lang.both"]];
  return `<div class="seg" role="group" aria-label="${tr("recipe.lang.label")}">${opts
    .map(([v, k]) => `<button type="button" class="seg-btn ${cur === v ? "is-on" : ""}" data-action="recipe-lang" data-v="${v}" aria-pressed="${cur === v}">${tr(k)}</button>`)
    .join("")}</div>`;
}

function dietBadges(r) {
  const out = [];
  for (const k of ["pork", "beef", "alcohol", "fermented"]) if ((r.diet || []).includes(k)) out.push(`<em class="dtag d-${k}">${tr(`diet.${k}`)}</em>`);
  if ((r.diet || []).includes("light")) out.push(`<em class="dtag d-light">${tr("diet.light")}</em>`);
  if (isHalalFriendly(r)) out.push(`<em class="dtag d-halal">${tr("diet.halal")}</em>`);
  return out.join("");
}
function conflictBadge(r) {
  const c = dietConflicts(r, prefsData().diet);
  if (!c.length) return "";
  return `<span class="warn-badge">${icon("alert", { size: 13 })}${tr("diet.conflict")}：${c.map((k) => tr(`diet.c.${k}`)).join("、")}</span>`;
}
function recentTag(n) {
  if (!n) return "";
  return `<span class="recent-tag">${icon("clock", { size: 12 })}${n === 1 ? tr("menu.recent.1") : tr("menu.recent.n", { n })}</span>`;
}
function recipeMeta(r) {
  const parts = [];
  if (r.prepMins) parts.push(tr("recipe.mins", { n: r.prepMins }));
  parts.push(tr(`recipe.diff.${r.difficulty}`));
  if (r.servings) parts.push(tr("recipe.servingsShort", { v: r.servings }));
  return parts.join(tr("log.sep"));
}

function dishLine(d, date, recipes, ro, menu) {
  const r = recipes.find((x) => x.id === d.recipeId);
  const label = dishLabel(d, recipes);
  const link = r
    ? `<button class="recipe-chip" type="button" data-go="${menuGo("recipe")}" data-recipe="${escapeHtml(r.id)}">${icon("book", { size: 13 })}${recipeNoLabel(r)} ${tr("recipe.link")}</button>`
    : "";
  const marks = `${recentTag(eatenDaysAgo(menu, dishKey(d), date))}${r ? conflictBadge(r) : ""}`;
  const inner = `<div class="dish">
    <div class="dish-main">
      <span class="dish-name">${escapeHtml(label)}</span>${link}
      ${marks ? `<div class="dish-marks">${marks}</div>` : ""}
      ${d.note ? `<div class="dish-note">${escapeHtml(d.note)}</div>` : ""}
    </div>
    ${ro ? "" : `<button class="btn secondary small" type="button" data-action="dish-edit" data-id="${escapeHtml(d.id)}" data-date="${date}">${tr("common.edit")}</button>`}
  </div>`;
  return ro ? inner : swipeRow(inner, "dish-del", d.id, { data: { date } });
}

function menuTabs(active) {
  return `<div class="seg" role="group" aria-label="${tr("menu.title")}">
    <button type="button" class="seg-btn ${active === "menu" ? "is-on" : ""}" data-go="${menuGo("menu")}" aria-pressed="${active === "menu"}">${tr("menu.tab.menu")}</button>
    <button type="button" class="seg-btn ${active === "recipes" ? "is-on" : ""}" data-go="${menuGo("recipes")}" aria-pressed="${active === "recipes"}">${tr("menu.tab.recipes")}</button>
  </div>`;
}

function weekStrip(menu) {
  const sel = ui.menuDate;
  const t = today();
  const days = weekDates(sel);
  return `<div class="week-strip" role="group" aria-label="${tr("menu.week.aria")}">
    <button class="icon-btn" type="button" data-action="menu-week" data-d="-7" aria-label="${tr("menu.week.prev")}">${icon("back")}</button>
    ${days
      .map((iso) => {
        const n = dayCount(menu, iso);
        const w = WEEKDAYS[weekday(iso)];
        return `<button class="wday ${iso === sel ? "is-selected" : ""} ${iso === t ? "is-today" : ""}" type="button" data-action="menu-day" data-date="${iso}" aria-pressed="${iso === sel}" aria-label="${tr("menu.day.aria", { date: formatDate(iso, { shortWeek: true }), n })}">
          <span class="wd">${pick(w, "shortZh", "shortEn")}</span><b>${Number(iso.slice(8, 10))}</b><i class="wdot ${n ? "on" : ""}"></i>
        </button>`;
      })
      .join("")}
    <button class="icon-btn" type="button" data-action="menu-week" data-d="7" aria-label="${tr("menu.week.next")}">${icon("chevron")}</button>
  </div>`;
}

function menuViewSeg() {
  const v = ui.menuView === "week" ? "week" : "day";
  return `<div class="seg" role="group" aria-label="${tr("menu.view.label")}">
    <button type="button" class="seg-btn ${v === "day" ? "is-on" : ""}" data-action="menu-view" data-v="day" aria-pressed="${v === "day"}">${tr("menu.view.day")}</button>
    <button type="button" class="seg-btn ${v === "week" ? "is-on" : ""}" data-action="menu-view" data-v="week" aria-pressed="${v === "week"}">${tr("menu.view.week")}</button>
  </div>`;
}

const SLOT_NAMES = { breakfast: ["早餐", "Breakfast"], lunch: ["午餐", "Lunch"], dinner: ["晚餐", "Dinner"], snack: ["宵夜", "Late snack"] };
function slotLabelIn(slot, lang) {
  if (slot.name) return slot.name;
  const n = SLOT_NAMES[slot.key];
  if (n) return lang === "en" ? n[1] : n[0];
  return lang === "en" ? "Meal" : "餐";
}

function dayShareText(menu, recipes, date, lang) {
  const slots = dayDishes(menu, date).map(({ slot, dishes }) => ({
    label: slotLabelIn(slot, lang),
    dishes: dishes.map((d) => {
      const r = recipes.find((x) => x.id === d.recipeId);
      return { name: dishLabel(d, recipes, lang), no: r ? r.no : 0, note: d.note };
    }),
  }));
  return menuShareText(lang === "en" ? formatDateIn(date, "en") : formatDateIn(date, "zh"), slots, lang);
}
function formatDateIn(iso, lang) {
  const prev = getLang();
  if (prev === lang) return formatDate(iso, { shortWeek: true });
  const [y, m, d] = iso.split("-").map(Number);
  const w = new Date(y, m - 1, d).getDay();
  if (lang === "en") return `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][w]}, ${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]}`;
  return `${m}月${d}日（${["日", "一", "二", "三", "四", "五", "六"][w]}）`;
}

function shareButtons(kind, id) {
  return `<div class="share-row">
    <span class="tiny muted">${tr("share.wa.label")}</span>
    <button class="btn secondary small" type="button" data-action="share-wa" data-kind="${kind}" data-id="${escapeHtml(id)}" data-l="zh">${tr("share.wa.zh")}</button>
    <button class="btn secondary small" type="button" data-action="share-wa" data-kind="${kind}" data-id="${escapeHtml(id)}" data-l="en">${tr("share.wa.en")}</button>
    <button class="btn secondary small" type="button" data-action="share-copy" data-kind="${kind}" data-id="${escapeHtml(id)}" data-l="${getLang() === "en" ? "en" : "zh"}">${tr("share.copy")}</button>
  </div>`;
}

function shareTextFor(kind, id, lang) {
  const { menu, recipes } = menuData();
  if (kind === "recipe") {
    const r = recipes.find((x) => x.id === id);
    return r ? recipeShareText(r, lang) : "";
  }
  return menu ? dayShareText(menu, recipes, id, lang) : "";
}

function weekBoard(menu, recipes, ro) {
  const t = today();
  const slots = menu.slots || [];
  return `<div class="week-board">${weekDates(ui.menuDate)
    .map((iso) => {
      const rows = slots
        .map((slot) => {
          const dishes = (menu.days?.[iso] || {})[slot.id] || [];
          if (!dishes.length) return "";
          return `<div class="wk-slot"><span class="wk-slot-name">${escapeHtml(slotLabel(slot, tr))}</span><span class="wk-dishes">${dishes
            .map((d) => {
              const r = recipes.find((x) => x.id === d.recipeId);
              const rec = eatenDaysAgo(menu, dishKey(d), iso);
              const warn = r && dietConflicts(r, prefsData().diet).length;
              return `<span class="wk-dish ${rec ? "is-repeat" : ""} ${warn ? "is-warn" : ""}" title="${rec ? escapeHtml(rec === 1 ? tr("menu.recent.1") : tr("menu.recent.n", { n: rec })) : ""}">${escapeHtml(dishLabel(d, recipes))}${rec ? icon("clock", { size: 11 }) : ""}${warn ? icon("alert", { size: 11 }) : ""}</span>`;
            })
            .join("")}</span></div>`;
        })
        .join("");
      return `<article class="card wk-day ${iso === t ? "is-today" : ""}">
        <button class="wk-head" type="button" data-action="menu-day-open" data-date="${iso}">
          <strong>${formatDate(iso, { shortWeek: true })}</strong>${iso === t ? `<span class="tag brass">${tr("menu.today")}</span>` : ""}
        </button>
        ${rows || `<p class="muted tiny" style="margin:0.3rem 0 0">${tr("menu.empty")}</p>`}
      </article>`;
    })
    .join("")}</div>
    <p class="tiny muted" style="margin-top:0.6rem">${icon("clock", { size: 12 })} ${tr("menu.legend.recent")}　${icon("alert", { size: 12 })} ${tr("menu.legend.warn")}</p>`;
}

function viewMenu() {
  const { menu, recipes, ro } = menuData();
  const head = `
    <h1 class="screen-title">${tr("menu.title")}</h1>
    <p class="lede">${tr(ro ? "menu.helper.lede" : "menu.lede")}</p>
    ${menuTabs("menu")}`;
  if (!menu) return `${head}<div class="card" style="margin-top:0.9rem"><p class="muted" style="margin:0">${tr("menu.helper.none")}</p></div>`;
  const sel = ui.menuDate;
  const slots = menu.slots || [];
  const t = today();
  const weekMode = ui.menuView === "week";
  return `
    ${head}
    <div class="card" style="margin-top:0.9rem">
      <div class="menu-toolbar">${menuViewSeg()}</div>
      ${weekStrip(menu)}
      <div class="menu-jump">
        <label class="field" style="margin:0"><span class="tiny muted">${tr("menu.pickDate")}</span>
          <input type="date" value="${escapeHtml(sel)}" data-action="menu-date" aria-label="${tr("menu.pickDate")}">
        </label>
        <button class="btn secondary small" type="button" data-action="menu-today" ${sel === t ? "disabled" : ""}>${tr("menu.today")}</button>
      </div>
    </div>
    ${
      weekMode
        ? `<section class="section">${weekBoard(menu, recipes, ro)}</section>`
        : `<section class="section">
      <div class="section-head"><h2>${formatDate(sel, { weekday: true })}${sel === t ? ` <span class="tag brass">${tr("menu.today")}</span>` : ""}</h2></div>
      ${slots
        .map((slot) => {
          const dishes = (menu.days?.[sel] || {})[slot.id] || [];
          return `<div class="card meal-slot">
            <div class="meal-head">
              <strong>${escapeHtml(slotLabel(slot, tr))}</strong>
              ${ro ? "" : `<button class="btn secondary small" type="button" data-action="dish-new" data-slot="${escapeHtml(slot.id)}" data-date="${sel}">${icon("plus", { size: 14 })}${tr("menu.addDish")}</button>`}
            </div>
            ${dishes.length ? dishes.map((d) => dishLine(d, sel, recipes, ro, menu)).join("") : `<p class="muted tiny" style="margin:0.3rem 0 0">${tr("menu.empty")}</p>`}
          </div>`;
        })
        .join("")}
      ${dayCount(menu, sel) ? `<div class="card">${shareButtons("day", sel)}</div>` : ""}
    </section>`
    }
    ${
      ro
        ? ""
        : `<div class="btn-row">
        <button class="btn" type="button" data-action="gen-open">${icon("basket", { size: 16 })}${tr("menu.gen.open")}</button>
        <button class="btn secondary" type="button" data-action="copy-open">${tr("menu.copy")}</button>
        <button class="btn secondary" type="button" data-action="slots-open">${tr("menu.slots.manage")}</button>
      </div>`
    }
    ${disclaimer()}`;
}

function menuShopAutoTitle(iso) {
  if (isISODate(iso)) return tr("menu.gen.defaultTitle", { date: formatDate(iso, { short: true }) });
  return tr("menu.gen.defaultTitleNone");
}

function isMenuShopAutoTitle(value) {
  if (typeof value !== "string") return false;
  if (value === tr("menu.gen.defaultTitleNone")) return true;
  const prefix = tr("menu.gen.defaultTitle", { date: "" });
  if (!prefix || !value.startsWith(prefix)) return false;
  const rest = value.slice(prefix.length).trim();
  return /^\d{1,2}月\d{1,2}日$/.test(rest) || /^\d{1,2} [A-Za-z]{3}$/.test(rest);
}

function menuHomeCard() {
  const { menu, recipes, ro } = menuData();
  const t = today();
  const rows = menu ? dayDishes(menu, t) : [];
  const body = !menu
    ? `<p class="muted" style="margin:0">${tr("menu.helper.none")}</p>`
    : rows.length
      ? rows
          .map(
            ({ slot, dishes }) => `<div class="menu-row">
              <span class="menu-slot">${escapeHtml(slotLabel(slot, tr))}</span>
              <span class="menu-dishes">${dishes
                .map((d) => `${escapeHtml(dishLabel(d, recipes))}${d.note ? `<small>（${escapeHtml(d.note)}）</small>` : ""}`)
                .join("<i class=\"sep\">·</i>")}</span>
            </div>`
          )
          .join("")
      : `<p class="muted" style="margin:0 0 ${ro ? "0" : "0.6rem"}">${tr("menu.home.none")}</p>${ro ? "" : `<button class="btn small" type="button" data-action="menu-open" data-tab="menu">${tr("menu.home.plan")}</button>`}`;
  return `<section class="panel menu-card">
    <div class="panel-title"><h2>${tr("menu.home.title")}</h2><button class="linkish" type="button" data-action="menu-open" data-tab="${menuGo("menu")}">${tr("menu.home.open")}</button></div>
    ${body}
  </section>`;
}

/* ----- recipe browser ----- */

function recipeCards(list, ro) {
  if (!list.length) return `<p class="muted" style="margin:0">${tr(ui.recipeQuery || ui.recipeCat !== "all" || ui.recipeDiet.length ? "recipe.search.none" : "recipe.none")}</p>`;
  const { menu } = menuData();
  const t = today();
  return `<div class="recipe-grid">${list
    .map((r) => {
      const card = `<button class="recipe-card" type="button" data-go="${ro ? "h-recipe" : "recipe"}" data-recipe="${escapeHtml(r.id)}">
        <span class="recipe-thumb">${recipePhotosOf(r)[0] ? `<img src="${recipePhotoSrc(recipePhotosOf(r)[0])}" alt="" loading="lazy">` : icon("utensils", { size: 26 })}<b class="recipe-no">#${r.no}</b>${r.builtin ? "" : `<i class="mine-dot" title="${tr("recipe.src.mine")}"></i>`}</span>
        <span class="recipe-meta"><strong>${recipeNameHtml(r)}</strong>
          <span class="recipe-sub">${escapeHtml(recipeMeta(r))}</span>
          <span class="recipe-tags">${dietBadges(r)}${r.overrideOf ? `<em class="dtag d-edited">${tr("recipe.edited")}</em>` : ""}${r.sourceUrl ? `<em class="dtag d-web">${tr("recipe.web.badge")}</em>` : ""}</span>
          ${conflictBadge(r)}${menu ? recentTag(recipeEatenDaysAgo(menu, r.id, t)) : ""}
        </span>
      </button>`;
      return !ro && !r.builtin ? swipeRow(card, "recipe-del", r.id, { className: "recipe-swipe" }) : card;
    })
    .join("")}</div>`;
}

function webSearchBlock(count, ro) {
  const q = String(ui.recipeQuery || "").trim();
  if (!q || /^#?\d+$/.test(q) || count > 3) return "";
  const u = webSearchUrls(q, getLang() === "en" ? "en" : "zh");
  return `<div class="web-search">
    <p class="tiny muted" style="margin:0 0 0.5rem">${tr(count ? "recipe.web.few" : "recipe.web.none")}</p>
    <div class="btn-row" style="margin:0">
      <a class="btn secondary small" href="${escapeHtml(u.google)}" target="_blank" rel="noopener noreferrer">${tr("recipe.web.google")}</a>
      <a class="btn secondary small" href="${escapeHtml(u.youtube)}" target="_blank" rel="noopener noreferrer">${tr("recipe.web.youtube")}</a>
      ${ro ? "" : `<button class="btn small" type="button" data-action="web-open-sheet" data-q="${escapeHtml(q)}">${icon("plus", { size: 14 })}${tr("recipe.web.add")}</button>`}
    </div>
    ${ro ? "" : `<p class="tiny muted" style="margin:0.5rem 0 0">${tr("recipe.web.afterHint")}</p>`}
  </div>`;
}

function recipeListInner(ro) {
  const list = filteredRecipes(menuData().recipes);
  return `<div id="recipe-count" class="tiny muted" style="margin-bottom:0.5rem">${tr("recipe.count", { n: list.length })}</div>${recipeCards(list, ro)}${webSearchBlock(list.length, ro)}`;
}

function recipeMatches(r, q) {
  if (/^#?\d+$/.test(q)) return r.no === Number(q.replace("#", ""));
  const hay = [r.nameZh, r.nameEn, ...r.tags, ...r.ingredients.flatMap((i) => [i.zh, i.en]), tr(`recipe.cat.${r.category}`)].join(" ").toLowerCase();
  return hay.includes(q);
}

function filteredRecipes(recipes) {
  const q = String(ui.recipeQuery || "").trim().toLowerCase();
  const diet = prefsData().diet;
  const f = new Set(ui.recipeDiet);
  const list = recipes
    .filter((r) => {
      if (ui.recipeCat !== "all" && r.category !== ui.recipeCat) return false;
      if (ui.recipeSrc === "lib" && !r.builtin) return false;
      if (ui.recipeSrc === "mine" && r.builtin) return false;
      if (f.has("fits") && dietConflicts(r, diet).length) return false;
      if (f.has("halal") && !isHalalFriendly(r)) return false;
      if (f.has("light") && !(r.diet || []).includes("light")) return false;
      if (f.has("nopork") && (r.diet || []).includes("pork")) return false;
      if (f.has("nobeef") && (r.diet || []).includes("beef")) return false;
      return !q || recipeMatches(r, q);
    })
    .slice();
  return list.sort((a, b) => a.no - b.no);
}

function chip(action, v, label, on) {
  return `<button class="chip small ${on ? "is-on" : ""}" type="button" data-action="${action}" data-v="${v}" aria-pressed="${on}">${label}</button>`;
}

function dietSummaryText(diet) {
  const keys = [["noPork", "diet.pref.noPork"], ["noBeef", "diet.pref.noBeef"], ["noAlcohol", "diet.pref.noAlcohol"], ["noFermented", "diet.pref.noFermented"], ["halalOnly", "diet.pref.halalOnly"], ["lightOnly", "diet.pref.lightOnly"]];
  const on = keys.filter(([k]) => diet[k]).map(([, key]) => tr(key));
  return on.length ? on.join("、") : tr("diet.pref.none");
}

function dietPrefsCard(ro) {
  const diet = prefsData().diet;
  if (ro) {
    return `<div class="card diet-card"><strong>${tr("diet.pref.title")}</strong><p class="tiny muted" style="margin:0.25rem 0 0">${escapeHtml(dietSummaryText(diet))}</p></div>`;
  }
  const rows = [["noPork", "diet.pref.noPork"], ["noBeef", "diet.pref.noBeef"], ["noAlcohol", "diet.pref.noAlcohol"], ["noFermented", "diet.pref.noFermented"], ["halalOnly", "diet.pref.halalOnly"], ["lightOnly", "diet.pref.lightOnly"]];
  return `<details class="card diet-card" ${ui.dietOpen ? "open" : ""}>
    <summary><strong>${tr("diet.pref.title")}</strong><span class="tiny muted"> ${escapeHtml(dietSummaryText(diet))}</span></summary>
    <p class="tiny muted" style="margin:0.5rem 0">${tr("diet.pref.hint")}</p>
    <div class="diet-grid">${rows
      .map(([k, key]) => `<label class="check-row"><input type="checkbox" data-action="diet-toggle" data-key="${k}" ${diet[k] ? "checked" : ""}><span>${tr(key)}</span></label>`)
      .join("")}</div>
    <p class="tiny muted" style="margin:0.5rem 0 0">${tr("diet.halal.note")}</p>
  </details>`;
}

function viewRecipes() {
  const { recipes, ro } = menuData();
  const cats = ["all", ...CATEGORIES];
  const srcs = [["all", "recipe.src.all"], ["lib", "recipe.src.lib"], ["mine", "recipe.src.mine"]];
  const dfs = [["fits", "recipe.f.fits"], ["halal", "diet.halal"], ["light", "diet.light"], ["nopork", "recipe.f.nopork"], ["nobeef", "recipe.f.nobeef"]];
  return `
    <h1 class="screen-title">${tr("recipe.title")}</h1>
    <p class="lede">${tr(ro ? "recipe.helper.lede" : "recipe.lede")}</p>
    ${menuTabs("recipes")}
    ${ro ? "" : `<div class="btn-row"><button class="btn" type="button" data-action="recipe-new">${icon("plus", { size: 16 })}${tr("recipe.new")}</button><button class="btn secondary" type="button" data-action="web-open-sheet" data-q="">${tr("recipe.web.add")}</button></div>`}
    <input class="search" type="search" data-recipe-search placeholder="${tr("recipe.search.ph")}" value="${escapeHtml(ui.recipeQuery || "")}" aria-label="${tr("recipe.search.ph")}" style="margin-top:0.9rem">
    <div class="chip-row filter-row">${cats.map((c) => chip("recipe-cat", c, c === "all" ? tr("recipe.cat.all") : tr(`recipe.cat.${c}`), ui.recipeCat === c)).join("")}</div>
    <div class="chip-row filter-row">${srcs.map(([v, k]) => chip("recipe-src", v, tr(k), ui.recipeSrc === v)).join("")}</div>
    <div class="chip-row filter-row">${dfs.map(([v, k]) => chip("recipe-diet-f", v, tr(k), ui.recipeDiet.includes(v))).join("")}</div>
    ${dietPrefsCard(ro)}
    <div id="recipe-list" class="card" style="margin-top:0.9rem">${recipeListInner(ro)}</div>
    ${disclaimer()}`;
}

function viewRecipe() {
  const { menu, recipes, ro } = menuData();
  const r = recipes.find((x) => x.id === ui.recipeId);
  const back = `<button class="linkish" type="button" data-go="${menuGo("recipes")}">${icon("back", { size: 15 })} ${tr("recipe.back")}</button>`;
  if (!r) return `${back}<div class="card" style="margin-top:0.9rem"><p class="muted" style="margin:0">${tr("recipe.missing")}</p></div>`;
  const tip = r.tips ? (recipeMode() === "both" ? biHtml(r.tips.zh, r.tips.en) : escapeHtml(tipsText(r, recipeMode()))) : "";
  const eaten = menu ? recipeEatenDaysAgo(menu, r.id, today()) : 0;
  return `
    ${back}
    <article class="recipe-detail ${ro ? "is-helper" : ""}">
      ${recipeGalleryHtml(r)}
      <p class="recipe-id">${tr("recipe.id")} <b>#${r.no}</b>${r.builtin ? ` <span class="tag">${tr("recipe.src.lib")}</span>` : ""}${r.overrideOf ? ` <span class="tag edited">${tr("recipe.edited")}</span>` : ""}</p>
      <h1 class="screen-title" style="margin-top:0.3rem">${recipeNameHtml(r)}</h1>
      <p class="lede" style="margin:0 0 0.4rem">${escapeHtml(recipeMeta(r))}${tr("log.sep")}${tr(`recipe.cat.${r.category}`)}</p>
      <p class="recipe-tags" style="margin:0 0 0.6rem">${dietBadges(r)}${r.tags.map((x) => `<em>${escapeHtml(x)}</em>`).join("")}</p>
      ${conflictBadge(r) ? `<p style="margin:0 0 0.6rem">${conflictBadge(r)}</p>` : ""}
      ${eaten ? `<p style="margin:0 0 0.6rem">${recentTag(eaten)}</p>` : ""}
      <div class="btn-row">
        <button class="btn" type="button" data-action="cook-open" data-id="${escapeHtml(r.id)}">${icon("utensils", { size: 16 })}${tr("cook.open")}</button>
        ${
          ro
            ? ""
            : `<button class="btn" type="button" data-action="recipe-edit" data-id="${escapeHtml(r.id)}">${tr("common.edit")}</button>
              <button class="btn secondary" type="button" data-action="recipe-menu" data-id="${escapeHtml(r.id)}">${tr("recipe.addMenu")}</button>
              <button class="btn secondary" type="button" data-action="recipe-shop-open" data-id="${escapeHtml(r.id)}">${icon("basket", { size: 16 })}${tr("recipe.addShop")}</button>
              ${r.builtin ? `<button class="btn secondary" type="button" data-action="recipe-copy" data-id="${escapeHtml(r.id)}">${tr("recipe.copy")}</button>` : ""}`
        }
      </div>
      ${r.sourceUrl ? `<p class="source-line"><a class="btn secondary small" href="${escapeHtml(r.sourceUrl)}" target="_blank" rel="noopener noreferrer">${icon("share", { size: 14 })}${tr("recipe.web.original")}</a> <span class="tiny muted">${escapeHtml(urlHost(r.sourceUrl))}</span></p>` : ""}
      <div class="card" style="margin-top:0.9rem">${shareButtons("recipe", r.id)}${recipeLangSeg()}</div>
      <div class="card" style="margin-top:0.9rem">
        <h2 class="mini-title">${tr("recipe.ingredients")}</h2>
        ${r.ingredients.length ? `<ul class="ing-list">${r.ingredients.map((x) => `<li>${ingLine(x)}</li>`).join("")}</ul>` : `<p class="muted" style="margin:0">—</p>`}
      </div>
      <div class="card" style="margin-top:0.9rem">
        <h2 class="mini-title">${tr("recipe.steps")}</h2>
        ${r.steps.length ? `<ol class="step-list">${r.steps.map((x) => `<li>${stepHtml(x)}</li>`).join("")}</ol>` : `<p class="muted" style="margin:0">—</p>`}
      </div>
      ${tip ? `<div class="card" style="margin-top:0.9rem"><h2 class="mini-title">${tr("recipe.tips")}</h2><p style="margin:0;white-space:pre-wrap">${tip}</p></div>` : ""}
    </article>
    ${disclaimer()}`;
}

/* ----- cook mode (large font, one step at a time) ----- */

function viewCook() {
  const { recipes } = menuData();
  const r = recipes.find((x) => x.id === ui.recipeId);
  const back = `<button class="linkish" type="button" data-go="${menuGo("recipe")}" data-recipe="${escapeHtml(ui.recipeId || "")}">${icon("back", { size: 15 })} ${tr("cook.exit")}</button>`;
  if (!r) return `${back}<div class="card" style="margin-top:0.9rem"><p class="muted" style="margin:0">${tr("recipe.missing")}</p></div>`;
  const total = r.steps.length;
  const step = Math.max(0, Math.min(total, Number(ui.cookStep) || 0));
  const ticks = ui.cookTicks[r.id] || [];
  const pct = total ? Math.round((step / total) * 100) : 100;
  let body;
  if (step === 0) {
    body = `<h2 class="cook-h">${tr("cook.ingredients")}</h2>
      <ul class="cook-ing">${r.ingredients
        .map((i, n) => `<li><label class="cook-check"><input type="checkbox" data-action="cook-tick" data-rid="${escapeHtml(r.id)}" data-i="${n}" ${ticks.includes(n) ? "checked" : ""}><span>${ingLine(i)}</span></label></li>`)
        .join("")}</ul>`;
  } else {
    const tip = step === total ? (recipeMode() === "both" ? biHtml(r.tips?.zh, r.tips?.en) : escapeHtml(tipsText(r, recipeMode()))) : "";
    body = `<div class="cook-stepno">${tr("cook.step", { n: step, total })}</div>
      <p class="cook-text">${stepHtml(r.steps[step - 1])}</p>
      ${tip ? `<div class="cook-tip"><b>${tr("recipe.tips")}</b> ${tip}</div>` : ""}`;
  }
  return `
    ${back}
    <article class="cook">
      <p class="recipe-id">${tr("recipe.id")} <b>#${r.no}</b></p>
      <h1 class="cook-title">${recipeNameHtml(r)}</h1>
      ${recipePhotosOf(r)[0] ? `<img class="cook-hero" src="${recipePhotoSrc(recipePhotosOf(r)[0])}" alt="${escapeHtml(recipeName(r))}">${recipePhotoCreditHtml(r)}` : ""}
      ${recipeLangSeg()}
      <div class="cook-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${step}"><b style="width:${pct}%"></b></div>
      <div class="card cook-body">${body}</div>
      <div class="cook-nav">
        <button class="btn secondary cook-btn" type="button" data-action="cook-prev" ${step === 0 ? "disabled" : ""}>${tr("cook.prev")}</button>
        ${step >= total ? `<button class="btn cook-btn" type="button" data-action="cook-done" data-id="${escapeHtml(r.id)}">${tr("cook.done")}</button>` : `<button class="btn cook-btn" type="button" data-action="cook-next">${tr(step === 0 ? "cook.start" : "cook.next")}</button>`}
      </div>
    </article>`;
}

function dishNameOptions() {
  const seen = new Set();
  for (const day of Object.values(state.menu.days || {})) {
    for (const list of Object.values(day)) for (const d of list) if (d.text) seen.add(d.text);
  }
  return Array.from(seen)
    .slice(-60)
    .map((n) => `<option value="${escapeHtml(n)}"></option>`)
    .join("");
}

function recipeOptions(selectedId) {
  const mine = ownUserRecipes(state.recipes);
  const lib = allRecipes(state.recipes).filter((r) => r.builtin);
  const opt = (r) => `<option value="${escapeHtml(r.id)}" ${r.id === selectedId ? "selected" : ""}>#${r.no} ${escapeHtml(recipeName(r))}</option>`;
  return `${mine.length ? `<optgroup label="${tr("recipe.src.mine")}">${mine.map(opt).join("")}</optgroup>` : ""}<optgroup label="${tr("recipe.src.lib")}">${lib.map(opt).join("")}</optgroup>`;
}

function dishHintHtml(recipeId, date) {
  const r = allRecipes(state.recipes).find((x) => x.id === recipeId);
  if (!r) return "";
  const n = eatenDaysAgo(state.menu, `r:${r.id}`, date);
  return `${conflictBadge(r)}${recentTag(n)}`;
}

/* ----- ingredients -> shopping list ----- */

function recipeEntries(recipe, group = "") {
  const dish = { key: recipe.id, no: recipe.no, name: recipeName(recipe) };
  return recipe.ingredients.map((ing) => ({ ing, dish, group }));
}

function itemFromAgg(row, listId, helperId) {
  const L = getLang() === "en" ? "en" : "zh";
  const name = (L === "en" ? row.en || row.zh : row.zh || row.en) || "";
  const alt = L === "en" ? (row.en ? row.zh : "") : row.en || "";
  const qty = L === "en" ? row.qtyEn || row.qty : row.qty || row.qtyEn;
  const dishes = row.dishes.map((d) => `#${d.no} ${d.name}`).join("、");
  const cat = findCatalog(state, name);
  return newShopItem({
    listId,
    helperId,
    name,
    alt: alt && alt !== name ? alt : "",
    qty,
    note: dishes ? tr("shop.forDishes", { dishes }) : "",
    group: row.group || "",
    suggestedPrice: cat ? cat.lastPrice : null,
  });
}

function ingDisplay(ing) {
  const L = getLang() === "en" ? "en" : "zh";
  const name = (L === "en" ? ing.en || ing.zh : ing.zh || ing.en) || "";
  const alt = L === "en" ? (ing.en ? ing.zh : "") : ing.en || "";
  const qty = L === "en" ? ing.qtyEn || ing.qty : ing.qty || ing.qtyEn;
  return { name, alt: alt && alt !== name ? alt : "", qty: qty || "" };
}

function ensureRecipeParent(list, recipe) {
  const existing = state.shopItems.find((i) => i.listId === list.id && i.kind === "recipe" && i.recipeId === recipe.id);
  if (existing) return existing;
  const h = state.helpers.find((x) => x.id === list.helperId) || helper();
  const parent = newShopItem({
    listId: list.id,
    helperId: h?.id || list.helperId || "",
    name: recipeName(recipe),
    kind: "recipe",
    recipeId: recipe.id,
    parentId: "",
    note: recipe.no ? recipeNoLabel(recipe) : "",
  });
  state.shopItems.push(parent);
  return parent;
}

/** Add a recipe as a parent row with its ingredients nested underneath. */
function addRecipeIngredientsToList(list, recipe, ingredients) {
  const parent = ensureRecipeParent(list, recipe);
  const have = new Set(state.shopItems.filter((i) => i.parentId === parent.id).map((i) => catalogKey(i.name)));
  let added = 0;
  let skipped = 0;
  const fresh = [];
  for (const ing of ingredients || []) {
    const { name, alt, qty } = ingDisplay(ing);
    if (!name) continue;
    const k = catalogKey(name);
    if (have.has(k)) {
      skipped += 1;
      continue;
    }
    have.add(k);
    const cat = findCatalog(state, name);
    const it = newShopItem({
      listId: list.id,
      helperId: parent.helperId,
      name,
      alt,
      qty,
      kind: "ing",
      recipeId: recipe.id,
      parentId: parent.id,
      suggestedPrice: cat ? cat.lastPrice : null,
    });
    state.shopItems.push(it);
    fresh.push(it);
    added += 1;
  }
  if (!state.shopItems.some((i) => i.parentId === parent.id)) {
    state.shopItems = state.shopItems.filter((i) => i.id !== parent.id);
  }
  const recent = fresh.filter((it) => recentBuyFor(it, shopCtx())).length;
  return { added, skipped, recent };
}

function addRecipeMapToList(list, recipeMap) {
  let added = 0;
  let skipped = 0;
  let recent = 0;
  for (const { recipe, ingredients } of recipeMap) {
    const res = addRecipeIngredientsToList(list, recipe, ingredients);
    added += res.added;
    skipped += res.skipped;
    recent += res.recent;
  }
  return { added, skipped, recent };
}

/** Add merged ingredients of the given recipes to a list. Returns { added, skipped, recent }. */
function addAggToList(list, rows) {
  const h = state.helpers.find((x) => x.id === list.helperId) || helper();
  const have = new Set(state.shopItems.filter((i) => i.listId === list.id).map((i) => `${i.group || ""}|${catalogKey(i.name)}`));
  let added = 0;
  let skipped = 0;
  const fresh = [];
  for (const row of rows) {
    const it = itemFromAgg(row, list.id, h.id);
    if (!it.name) continue;
    const k = `${it.group || ""}|${catalogKey(it.name)}`;
    if (have.has(k)) {
      skipped += 1;
      continue;
    }
    have.add(k);
    state.shopItems.push(it);
    fresh.push(it);
    added += 1;
  }
  const ctx = { items: state.shopItems, lists: state.shopLists };
  const recent = fresh.filter((it) => recentBuyFor(it, ctx)).length;
  return { added, skipped, recent };
}

function addRecipesToList(list, ids) {
  const recs = allRecipes(state.recipes);
  const recipeMap = [];
  for (const id of ids) {
    const r = recs.find((x) => x.id === id);
    if (r) recipeMap.push({ recipe: r, ingredients: r.ingredients });
  }
  return addRecipeMapToList(list, recipeMap);
}

function addResultToast(res, list) {
  let msg = res.skipped ? tr("recipe.shop.addedSkip", { n: res.added, s: res.skipped, list: list.title }) : tr("recipe.shop.added", { n: res.added, list: list.title });
  if (res.recent) msg += tr("shop.recent.toast", { n: res.recent });
  toast(msg);
}

function recipePickerHtml() {
  const recs = allRecipes(state.recipes).slice().sort((a, b) => (a.builtin === b.builtin ? a.no - b.no : a.builtin ? 1 : -1));
  return `<div class="field recipe-picker">
    <span>${tr("shop.pick.title")}<span class="hint">${tr("shop.pick.hint")}</span></span>
    <input class="search" type="search" data-pick-search placeholder="${tr("shop.pick.search")}" aria-label="${tr("shop.pick.search")}">
    <div class="pick-list">${recs
      .map(
        (r) => `<label class="pick-row" data-pick-text="${escapeHtml([r.no, r.nameZh, r.nameEn].join(" ").toLowerCase())}">
          <input type="checkbox" name="rpick" value="${escapeHtml(r.id)}">
          <span><b>#${r.no}</b> ${escapeHtml(recipeName(r))}${recipeNameOther(r) ? `<small>${escapeHtml(recipeNameOther(r))}</small>` : ""}${r.builtin ? (r.overrideOf ? `<em class="mine-tag edited-tag">${tr("recipe.edited")}</em>` : "") : `<em class="mine-tag">${tr("recipe.src.mine")}</em>`}</span>
        </label>`
      )
      .join("")}</div>
    <p class="tiny muted pick-count" data-pick-count>${tr("shop.pick.count", { n: 0 })}</p>
  </div>`;
}

/* ----- sheets ----- */

function menuSheetBody(sheet) {
  if (sheet.type === "dish") {
    const slots = state.menu.slots;
    if (!slots.length) return `<h2>${tr("menu.dish.add")}</h2><p class="muted">${tr("menu.dish.noSlots")}</p><div class="btn-row"><button class="btn" type="button" data-action="slots-open">${tr("menu.slots.manage")}</button></div>`;
    let dish = null;
    let slotId = sheet.slotId || slots[0].id;
    if (sheet.id) {
      for (const [sid, list] of Object.entries(state.menu.days[sheet.date] || {})) {
        const f = list.find((d) => d.id === sheet.id);
        if (f) {
          dish = f;
          slotId = sid;
        }
      }
    }
    const d = dish || newDish({ recipeId: sheet.recipeId || "" });
    const text = dish ? d.text : d.recipeId ? dishLabel(d, allRecipes(state.recipes)) : "";
    return `
      <h2>${sheet.id ? tr("menu.dish.edit") : tr("menu.dish.add")}${tr("log.sep")}${formatDate(sheet.date, { shortWeek: true })}</h2>
      <form id="dish-form" data-date="${escapeHtml(sheet.date)}" data-id="${escapeHtml(sheet.id || "")}">
        <label class="field"><span>${tr("menu.dish.slot")}</span>
          <select name="slot">${slots.map((s) => `<option value="${escapeHtml(s.id)}" ${s.id === slotId ? "selected" : ""}>${escapeHtml(slotLabel(s, tr))}</option>`).join("")}</select>
        </label>
        <label class="field"><span>${tr("menu.dish.text")}</span>
          <input name="text" maxlength="80" list="dish-names" value="${escapeHtml(text)}" placeholder="${tr("menu.dish.text.ph")}">
          <datalist id="dish-names">${dishNameOptions()}</datalist>
        </label>
        <label class="field"><span>${tr("menu.dish.recipe")}</span>
          <select name="recipeId">
            <option value="">${tr("menu.dish.recipe.none")}</option>
            ${recipeOptions(d.recipeId)}
          </select>
        </label>
        <div class="dish-hint" data-dish-hint>${dishHintHtml(d.recipeId, sheet.date)}</div>
        <label class="field"><span>${tr("common.note")}</span><input name="note" maxlength="120" value="${escapeHtml(d.note || "")}" placeholder="${tr("menu.dish.note.ph")}"></label>
        <div class="btn-row">
          <button class="btn" type="submit">${tr("common.save")}</button>
          ${sheet.id ? `<button class="btn danger" type="button" data-action="dish-del" data-id="${escapeHtml(sheet.id)}" data-date="${escapeHtml(sheet.date)}">${tr("common.delete")}</button>` : ""}
        </div>
      </form>`;
  }
  if (sheet.type === "copy-day") {
    const from = ui.menuDate;
    return `
      <h2>${tr("menu.copy.title")}</h2>
      <p class="lede" style="margin-bottom:0.8rem">${tr("menu.copy.from", { date: formatDate(from, { weekday: true }) })}</p>
      <form id="copy-form" data-from="${escapeHtml(from)}">
        <label class="field"><span>${tr("menu.copy.to")}</span><input type="date" name="to" required value="${escapeHtml(shiftISO(from, 1))}"></label>
        <p class="tiny muted">${tr("menu.copy.hint")}</p>
        <div class="btn-row"><button class="btn" type="submit">${tr("menu.copy.go")}</button></div>
      </form>`;
  }
  if (sheet.type === "slots") {
    const slots = state.menu.slots;
    return `
      <h2>${tr("menu.slots.title")}</h2>
      <p class="tiny muted" style="margin-bottom:0.8rem">${tr("menu.slots.hint")}</p>
      <div class="slot-list">
        ${slots
          .map(
            (s, i) => `<div class="slot-row">
              <input class="slot-name" data-slot="${escapeHtml(s.id)}" maxlength="20" value="${escapeHtml(s.name)}" placeholder="${escapeHtml(slotLabel({ ...s, name: "" }, tr))}" aria-label="${tr("menu.slots.name")}">
              <button class="icon-btn rot-up" type="button" data-action="slot-up" data-id="${escapeHtml(s.id)}" ${i === 0 ? "disabled" : ""} aria-label="${tr("menu.slots.up")}">${icon("back")}</button>
              <button class="icon-btn rot-down" type="button" data-action="slot-down" data-id="${escapeHtml(s.id)}" ${i === slots.length - 1 ? "disabled" : ""} aria-label="${tr("menu.slots.down")}">${icon("back")}</button>
              <button class="btn ${ui.slotArm === s.id ? "danger" : "secondary"} small" type="button" data-action="slot-del" data-id="${escapeHtml(s.id)}">${tr(ui.slotArm === s.id ? "menu.slots.del.confirm" : "menu.slots.del")}</button>
            </div>`
          )
          .join("")}
      </div>
      <form id="slot-add-form" class="slot-add">
        <input name="name" maxlength="20" placeholder="${tr("menu.slots.new.ph")}" aria-label="${tr("menu.slots.add")}" ${slots.length >= MAX_SLOTS ? "disabled" : ""}>
        <button class="btn secondary" type="submit" ${slots.length >= MAX_SLOTS ? "disabled" : ""}>${icon("plus", { size: 15 })}${tr("menu.slots.add")}</button>
      </form>
      <div class="btn-row"><button class="btn" type="button" data-action="slots-done">${tr("menu.slots.done")}</button></div>`;
  }
  if (sheet.type === "recipe") {
    const r = sheet.id ? allRecipes(state.recipes).find((x) => x.id === sheet.id) : sheet.draft && ui.recipeDraft ? ui.recipeDraft : newRecipe();
    if (!r) return "";
    const ingZh = r.ingredients.map((i) => `${i.zh} ${i.qty}`.trim()).join("\n");
    const ingEn = r.ingredients.map((i) => `${i.en} ${i.qtyEn}`.trim()).join("\n");
    return `
      <h2>${sheet.id ? tr("recipe.edit") : tr("recipe.new")}${r.no ? ` <small class="muted">#${r.no}</small>` : ""}</h2>
      <form id="recipe-form" data-id="${escapeHtml(r.id)}">
        <label class="field"><span>${tr("recipe.f.nameZh")}</span><input name="nameZh" maxlength="80" value="${escapeHtml(r.nameZh)}" placeholder="${tr("recipe.f.name.ph")}"></label>
        <label class="field"><span>${tr("recipe.f.nameEn")}</span><input name="nameEn" maxlength="80" value="${escapeHtml(r.nameEn)}" placeholder="${tr("recipe.f.nameEn.ph")}"></label>
        <p class="tiny muted" style="margin:-0.3rem 0 0.7rem">${tr("recipe.f.langHint")}</p>
        <div class="field-row">
          <label class="field"><span>${tr("recipe.f.category")}</span>
            <select name="category">${CATEGORIES.map((c) => `<option value="${c}" ${r.category === c ? "selected" : ""}>${tr(`recipe.cat.${c}`)}</option>`).join("")}</select>
          </label>
          <label class="field"><span>${tr("recipe.f.difficulty")}</span>
            <select name="difficulty">${DIFFICULTIES.map((c) => `<option value="${c}" ${r.difficulty === c ? "selected" : ""}>${tr(`recipe.diff.${c}`)}</option>`).join("")}</select>
          </label>
        </div>
        <div class="field-row">
          <label class="field"><span>${tr("recipe.f.prep")}</span><input name="prepMins" type="number" inputmode="numeric" min="0" max="1440" value="${r.prepMins || ""}" placeholder="20"></label>
          <label class="field"><span>${tr("recipe.f.servings")}</span><input name="servings" maxlength="20" value="${escapeHtml(r.servings)}" placeholder="${tr("recipe.f.servings.ph")}"></label>
        </div>
        ${recipePhotoFieldHtml()}
        <label class="field"><span>${tr("recipe.f.ingZh")}</span><textarea name="ingZh" rows="6" placeholder="${tr("recipe.f.ingZh.ph")}">${escapeHtml(ingZh)}</textarea></label>
        <label class="field"><span>${tr("recipe.f.ingEn")}</span><textarea name="ingEn" rows="6" placeholder="${tr("recipe.f.ingEn.ph")}">${escapeHtml(ingEn)}</textarea></label>
        <label class="field"><span>${tr("recipe.f.stepsZh")}</span><textarea name="stepsZh" rows="6" placeholder="${tr("recipe.f.steps.ph")}">${escapeHtml(r.steps.map((s) => s.zh).join("\n"))}</textarea></label>
        <label class="field"><span>${tr("recipe.f.stepsEn")}</span><textarea name="stepsEn" rows="6" placeholder="${tr("recipe.f.stepsEn.ph")}">${escapeHtml(r.steps.map((s) => s.en).join("\n"))}</textarea></label>
        <label class="field"><span>${tr("recipe.f.tipsZh")}</span><textarea name="tipsZh" rows="2" maxlength="800">${escapeHtml(r.tips.zh)}</textarea></label>
        <label class="field"><span>${tr("recipe.f.tipsEn")}</span><textarea name="tipsEn" rows="2" maxlength="800">${escapeHtml(r.tips.en)}</textarea></label>
        <fieldset class="field">
          <legend class="lbl">${tr("recipe.f.diet")}</legend>
          <div class="diet-grid">${DIET_KEYS.map((k) => `<label class="check-row"><input type="checkbox" name="diet" value="${k}" ${(r.diet || []).includes(k) ? "checked" : ""}><span>${tr(`diet.${k}`)}</span></label>`).join("")}</div>
          <p class="tiny muted" style="margin:0.4rem 0 0">${tr("diet.halal.note")}</p>
        </fieldset>
        <label class="field"><span>${tr("recipe.f.tags")}</span><input name="tags" maxlength="120" value="${escapeHtml(r.tags.join(", "))}" placeholder="${tr("recipe.f.tags.ph")}"></label>
        <label class="field"><span>${tr("recipe.f.source")}</span><input name="sourceUrl" type="text" inputmode="url" autocapitalize="none" autocomplete="off" spellcheck="false" maxlength="600" value="${escapeHtml(r.sourceUrl || "")}" placeholder="https://"></label>
        <div class="btn-row">
          <button class="btn" type="submit">${tr("common.save")}</button>
          ${
            sheet.id && r.builtin
              ? r.overrideOf
                ? `<button class="btn ${ui.recipeRestoreArm === r.id ? "danger" : "secondary"}" type="button" data-action="recipe-restore" data-id="${escapeHtml(r.id)}">${tr(ui.recipeRestoreArm === r.id ? "recipe.restore.confirm" : "recipe.restore")}</button>`
                : ""
              : sheet.id
                ? `<button class="btn danger" type="button" data-action="recipe-del" data-id="${escapeHtml(r.id)}">${tr("common.delete")}</button>`
                : ""
          }
        </div>
      </form>`;
  }
  if (sheet.type === "web-recipe") {
    const d = sheet.prefill || {};
    return `
      <h2>${tr("recipe.web.sheetTitle")}</h2>
      <p class="tiny muted" style="margin-bottom:0.8rem">${tr("recipe.web.hint")}</p>
      <form id="web-recipe-form">
        <label class="field"><span>${tr("recipe.web.url")}</span><input name="sourceUrl" type="text" inputmode="url" autocapitalize="none" autocomplete="off" spellcheck="false" required maxlength="600" value="${escapeHtml(d.url || "")}" placeholder="https://"></label>
        <label class="field"><span>${tr("recipe.web.name")}</span><input name="name" maxlength="80" value="${escapeHtml(d.name || "")}" placeholder="${tr("recipe.f.name.ph")}"></label>
        ${recipePhotoFieldHtml()}
        <label class="field"><span>${tr("recipe.web.paste")}</span><textarea name="paste" rows="8" maxlength="12000" placeholder="${tr("recipe.web.paste.ph")}">${escapeHtml(d.text || "")}</textarea></label>
        <div class="btn-row">
          <button class="btn" type="submit">${tr("recipe.web.parse")}</button>
          <button class="btn secondary" type="button" data-action="web-open-link">${tr("recipe.web.openLink")}</button>
        </div>
      </form>`;
  }
  if (sheet.type === "recipe-shop") {
    const r = allRecipes(state.recipes).find((x) => x.id === sheet.id);
    const h = helper();
    if (!r || !h) return `<h2>${tr("recipe.shop.title")}</h2><p class="muted">${tr("toast.addHelperFirst")}</p>`;
    const open = listsFor(h)
      .filter((l) => l.status !== "done")
      .sort(compareShopLists);
    const preferred = open.find((l) => listDate(l) === today()) || null;
    const nm = recipeName(r);
    return `
      <h2>${tr("recipe.shop.title")}${tr("log.sep")}${escapeHtml(nm)}</h2>
      ${
        r.ingredients.length
          ? `<form id="recipe-shop-form" data-id="${escapeHtml(r.id)}">
        <label class="field"><span>${tr("recipe.shop.pick")}</span>
          <select name="list">
            <option value="new" ${preferred ? "" : "selected"}>${tr("recipe.shop.new", { name: escapeHtml(nm) })}</option>
            ${open.map((l) => `<option value="${escapeHtml(l.id)}" ${preferred && preferred.id === l.id ? "selected" : ""}>${escapeHtml(l.title)}${listDate(l) ? tr("log.sep") + formatDate(listDate(l), { short: true }) : ""}</option>`).join("")}
          </select>
        </label>
        <div class="field"><span>${tr("recipe.shop.items")}</span>
          <div class="ing-pick">${r.ingredients
            .map((x, i) => `<label class="check-row"><input type="checkbox" name="ing" value="${i}" checked><span>${escapeHtml(ingName(x))}${ingQty(x) ? tr("log.sep") + escapeHtml(ingQty(x)) : ""}</span></label>`)
            .join("")}</div>
        </div>
        <div class="btn-row"><button class="btn" type="submit">${tr("recipe.shop.go")}</button></div>
      </form>`
          : `<p class="muted">${tr("recipe.shop.none")}</p>`
      }`;
  }
  if (sheet.type === "gen-shop") {
    const { menu } = menuData();
    const days = weekDates(ui.menuDate);
    const t = today();
    const withDishes = days.filter((d) => dayCount(menu, d));
    const defaults = withDishes.filter((d) => d >= t).length ? withDishes.filter((d) => d >= t) : withDishes;
    const h = helper();
    if (!h) return `<h2>${tr("menu.gen.title")}</h2><p class="muted">${tr("toast.addHelperFirst")}</p>`;
    return `
      <h2>${tr("menu.gen.title")}</h2>
      <p class="tiny muted" style="margin-bottom:0.8rem">${tr("menu.gen.hint")}</p>
      <form id="gen-form">
        <div class="field"><span>${tr("menu.gen.days")}</span>
          <div class="ing-pick">${days
            .map((d) => {
              const rn = menu.slots.reduce((n, s) => n + ((menu.days[d] || {})[s.id] || []).filter((x) => x.recipeId).length, 0);
              return `<label class="check-row"><input type="checkbox" name="gday" value="${d}" ${defaults.includes(d) ? "checked" : ""} ${dayCount(menu, d) ? "" : "disabled"}><span>${formatDate(d, { shortWeek: true })}${tr("log.sep")}${tr("menu.gen.dishCount", { n: dayCount(menu, d), r: rn })}</span></label>`;
            })
            .join("")}</div>
        </div>
        <label class="field"><span>${tr("sheet.list.name")}</span><input name="title" required maxlength="80" data-autofill="menu-shop-title" value="${escapeHtml(menuShopAutoTitle(t))}"></label>
        ${shopDateFieldHtml({ name: "date", value: t, action: "gen-shop-date" })}
        <label class="switch-field">
          <span><strong>${tr("menu.gen.group")}</strong><span class="hint">${tr("menu.gen.group.hint")}</span></span>
          <span class="switch"><input type="checkbox" name="group" checked><span></span></span>
        </label>
        <div class="btn-row"><button class="btn" type="submit">${tr("menu.gen.go")}</button></div>
      </form>`;
  }
  if (sheet.type === "list-recipes") {
    const list = state.shopLists.find((l) => l.id === sheet.listId);
    if (!list) return "";
    return `
      <h2>${tr("shop.pick.sheetTitle")}${tr("log.sep")}${escapeHtml(list.title || "")}</h2>
      <form id="list-recipes-form" data-list="${escapeHtml(list.id)}">
        ${recipePickerHtml()}
        <div class="btn-row"><button class="btn" type="submit">${tr("shop.pick.add")}</button></div>
      </form>`;
  }
  return "";
}

function applySlotNames() {
  document.querySelectorAll(".slot-name").forEach((inp) => {
    const slot = state.menu.slots.find((x) => x.id === inp.getAttribute("data-slot"));
    if (slot) slot.name = inp.value.trim().slice(0, 20);
  });
}

/* ---------- sheets ---------- */

function sheetHtml() {
  const sheet = ui.sheet;
  if (!sheet) return "";
  let body = "";
  if (sheet.type === "sh") {
    const h = helper();
    const st = shStatus(h, sheet.date);
    body = `
      <h2>${tr("sheet.sh.title")}</h2>
      <p class="lede" style="margin-bottom:0.8rem">${formatDate(sheet.date, { weekday: true })}</p>
      <form id="sh-form" data-date="${sheet.date}">
        <label class="field"><span>${tr("sheet.status")}</span>
          <select name="status">
            ${SH_STATUSES.map((s) => `<option value="${s.id}" ${st.status === s.id ? "selected" : ""}>${pick(s)}</option>`).join("")}
          </select>
        </label>
        <label class="field"><span>${tr("sheet.lieuDate")}</span>
          <input type="date" name="lieuDate" value="${escapeHtml(st.lieuDate || "")}">
        </label>
        <label class="field"><span>${tr("common.note")}</span>
          <textarea name="note">${escapeHtml(st.note || "")}</textarea>
        </label>
        <div class="btn-row"><button class="btn" type="submit">${tr("common.save")}</button></div>
      </form>
    `;
  } else if (sheet.type === "leave") {
    body = `
      <h2>${tr("sheet.leave.title")}</h2>
      <form id="leave-form">
        <label class="field"><span>${tr("sheet.type")}</span>
          <select name="type">
            ${LEAVE_TYPES.map((x) => `<option value="${x.id}">${pick(x)}</option>`).join("")}
          </select>
        </label>
        <label class="field"><span>${tr("sheet.startDate")}</span><input type="date" name="startDate" required></label>
        <label class="field"><span>${tr("sheet.endDate")}</span><input type="date" name="endDate"></label>
        <label class="field"><span>${tr("common.note")}</span><textarea name="note"></textarea></label>
        <div class="btn-row"><button class="btn" type="submit">${tr("common.save")}</button></div>
      </form>
    `;
  } else if (sheet.type === "pay") {
    const h = helper();
    const t = today();
    const month = t.slice(0, 7);
    body = `
      <h2>${tr("sheet.pay.title")}</h2>
      <form id="pay-form">
        <label class="field"><span>${tr("sheet.pay.month")}</span><input type="month" name="month" required value="${month}"></label>
        <label class="field"><span>${tr("sheet.pay.wage")}</span><input type="number" name="wage" inputmode="decimal" step="1" value="${h?.wage ?? 0}"></label>
        <label class="field"><span>${tr("sheet.pay.food")}</span><input type="number" name="food" inputmode="decimal" step="1" value="${h?.foodProvided ? 0 : h?.foodAllowance ?? 0}"></label>
        <label class="field"><span>${tr("sheet.pay.adjust")}</span><input type="number" name="adjustments" inputmode="decimal" step="1" value="0"></label>
        <label class="field"><span>${tr("sheet.pay.paidOn")}</span><input type="date" name="paidOn" value="${t}"></label>
        <label class="field"><span>${tr("payslip.method")}</span>
          <select name="method"><option value="">—</option>${PAY_METHODS.map((m) => `<option value="${m}">${tr(`pay.method.${m}`)}</option>`).join("")}</select>
        </label>
        <label class="field"><span>${tr("common.note")}</span><textarea name="note"></textarea></label>
        <div class="btn-row"><button class="btn" type="submit">${tr("common.save")}</button></div>
      </form>
    `;
  } else if (sheet.type === "reminder") {
    const rem = sheet.id ? state.customReminders.find((r) => r.id === sheet.id) : newCustomReminder({ helperId: helper()?.id || "" });
    body = `
      <h2>${sheet.id ? tr("remind.edit") : tr("remind.new")}</h2>
      <form id="reminder-form" data-id="${escapeHtml(rem.id)}" data-edit="${sheet.id ? "1" : ""}">
        <label class="field"><span>${tr("remind.f.title")}</span><input name="title" required maxlength="80" value="${escapeHtml(rem.title)}" placeholder="${tr("remind.f.title.ph")}"></label>
        <label class="field"><span>${tr("remind.f.date")}</span><input type="date" name="date" required value="${escapeHtml(rem.date)}"></label>
        <label class="field"><span>${tr("remind.f.repeat")}</span>
          <select name="repeat">
            ${["none", "monthly", "yearly"].map((v) => `<option value="${v}" ${rem.repeat === v ? "selected" : ""}>${tr(`remind.repeat.${v}`)}</option>`).join("")}
          </select>
        </label>
        <label class="field"><span>${tr("remind.f.helper")}</span>
          <select name="rhelper">
            <option value="" ${rem.helperId ? "" : "selected"}>${tr("remind.f.helper.none")}</option>
            ${state.helpers.map((x) => `<option value="${escapeHtml(x.id)}" ${rem.helperId === x.id ? "selected" : ""}>${escapeHtml(x.name)}</option>`).join("")}
          </select>
          <span class="hint">${tr("remind.f.helper.hint")}</span>
        </label>
        <label class="field"><span>${tr("common.note")}</span><textarea name="note" maxlength="400">${escapeHtml(rem.note || "")}</textarea></label>
        <div class="btn-row">
          <button class="btn" type="submit">${tr("common.save")}</button>
          ${sheet.id ? `<button class="btn danger" type="button" data-action="reminder-del" data-id="${rem.id}">${tr("common.delete")}</button>` : ""}
        </div>
      </form>
    `;
  } else if (sheet.type === "price-history") {
    const rows = role === "helper" ? sessionPayload()?.priceCatalog || [] : state.priceCatalog || [];
    const row = rows.find((c) => c.key === sheet.key);
    body = `<h2>${tr("shop.hist.title")}${row ? tr("log.sep") + escapeHtml(row.name) : ""}</h2>${priceHistoryHtml(row, role === "helper" ? "session" : "stored")}
      <div class="btn-row"><button class="btn secondary" type="button" data-action="sheet-close">${tr("common.close")}</button></div>`;
  } else if (["dish", "copy-day", "slots", "recipe", "recipe-shop", "gen-shop", "list-recipes", "web-recipe"].includes(sheet.type)) {
    body = menuSheetBody(sheet);
  } else if (sheet.type === "consent") {
    body = consentSheetBody(sheet);
  } else if (sheet.type === "task") {
    const task = sheet.id ? state.workTasks.find((t) => t.id === sheet.id) : newWorkTask({ helperId: helper()?.id, schedule: "daily" });
    const weekly = (task.weekdays || []).map(Number);
    body = `
      <h2>${sheet.id ? tr("sheet.task.edit") : tr("tasks.new")}</h2>
      <form id="task-form" data-id="${escapeHtml(task.id)}">
        <label class="field"><span>${tr("sheet.task.name")}</span><input name="title" required maxlength="80" value="${escapeHtml(task.title || "")}" placeholder="${tr("sheet.task.name.ph")}"></label>
        <label class="field"><span>${tr("sheet.task.detail")}</span><textarea name="detail" maxlength="1000" placeholder="${tr("sheet.task.detail.ph")}">${escapeHtml(task.detail || "")}</textarea></label>
        <label class="field"><span>${tr("sheet.task.when")}</span>
          <select name="schedule">
            ${TASK_SCHEDULES.map((s) => `<option value="${s.id}" ${task.schedule === s.id ? "selected" : ""}>${pick(s)}</option>`).join("")}
          </select>
        </label>
        <fieldset class="field" data-weekly-only ${task.schedule === "weekly" ? "" : "hidden"}>
          <legend class="lbl">${tr("sheet.task.weekdays")}</legend>
          <div class="weekday-picks">
            ${WEEKDAYS.map((w) => `<label><input type="checkbox" name="weekdays" value="${w.id}" ${weekly.includes(w.id) ? "checked" : ""}><span>${pick(w, "shortZh", "shortEn")}</span></label>`).join("")}
          </div>
        </fieldset>
        <label class="field" data-once-only ${task.schedule === "once" ? "" : "hidden"}>
          <span>${tr("sheet.task.onceDate")}</span><input type="date" name="onceDate" value="${escapeHtml(task.onceDate || "")}">
        </label>
        <label class="field"><span>${tr("sheet.task.time")}</span>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">
            <input type="time" name="timeFrom" value="${escapeHtml(task.timeFrom || "")}">
            <input type="time" name="timeTo" value="${escapeHtml(task.timeTo || "")}">
          </div>
        </label>
        <div class="btn-row">
          <button class="btn" type="submit">${tr("common.save")}</button>
          ${sheet.id ? `<button class="btn danger" type="button" data-action="task-del" data-id="${task.id}">${tr("common.delete")}</button>` : ""}
        </div>
      </form>
    `;
  } else if (sheet.type === "rule") {
    const rule = sheet.id ? state.workRules.find((r) => r.id === sheet.id) : newWorkRule({ helperId: helper()?.id });
    body = `
      <h2>${sheet.id ? tr("sheet.rule.edit") : tr("rules.new")}</h2>
      <form id="rule-form" data-id="${escapeHtml(rule.id)}">
        <label class="field"><span>${tr("sheet.rule.title")}</span><input name="title" required maxlength="80" value="${escapeHtml(rule.title || "")}" placeholder="${tr("sheet.rule.title.ph")}"></label>
        <label class="field"><span>${tr("sheet.rule.body")}</span><textarea name="body" required maxlength="2000" placeholder="${tr("sheet.rule.body.ph")}">${escapeHtml(rule.body || "")}</textarea></label>
        <div class="btn-row">
          <button class="btn" type="submit">${tr("common.save")}</button>
          ${sheet.id ? `<button class="btn danger" type="button" data-action="rule-del" data-id="${rule.id}">${tr("common.delete")}</button>` : ""}
        </div>
      </form>
    `;
  } else if (sheet.type === "shop-list") {
    body = `
      <h2>${tr("sheet.list.title")}</h2>
      <form id="shop-list-form">
        <label class="field"><span>${tr("sheet.list.name")}</span><input name="title" required maxlength="80" placeholder="${tr("sheet.list.name.ph")}"></label>
        ${shopDateFieldHtml({ name: "date", value: sheet.date || today() })}
        <label class="field"><span>${tr("sheet.list.place")}</span>
          <select name="place">
            ${SHOP_PLACES.map((p) => `<option value="${p.id}">${pick(p)}</option>`).join("")}
          </select>
        </label>
        <label class="field"><span>${tr("common.note")}</span><textarea name="note" maxlength="500"></textarea></label>
        ${recipePickerHtml()}
        <div class="btn-row"><button class="btn" type="submit">${tr("sheet.list.create")}</button></div>
      </form>
    `;
  } else if (sheet.type === "shop-item") {
    const item = sheet.id ? state.shopItems.find((i) => i.id === sheet.id) : newShopItem({ listId: sheet.listId, helperId: helper()?.id });
    const cat = findCatalog(state, item.name);
    const suggest = item.name && cat ? cat.lastPrice : "";
    body = `
      <h2>${sheet.id ? tr("sheet.item.edit") : tr("shop.addItem")}</h2>
      <form id="shop-item-form" data-id="${escapeHtml(item.id)}" data-list="${escapeHtml(item.listId)}">
        <label class="field"><span>${tr("sheet.item.name")}</span>
          <input name="name" required maxlength="80" list="catalog-names" value="${escapeHtml(item.name || "")}" placeholder="${tr("sheet.item.name.ph")}">
          <datalist id="catalog-names">${catalogNameOptions()}</datalist>
        </label>
        <div data-suggest-wrap>${itemHintBlock(cat)}</div>
        <div data-recent-wrap>${itemRecentHint(item.name, item.id, item.listId)}</div>
        <label class="field"><span>${tr("sheet.item.qty")}</span><input name="qty" maxlength="40" value="${escapeHtml(item.qty || "")}" placeholder="${tr("sheet.item.qty.ph")}"></label>
        <label class="field"><span>${tr("common.note")}</span><textarea name="note" maxlength="400">${escapeHtml(item.note || "")}</textarea></label>
        <div class="field">
          <span>${tr("sheet.item.photo")}</span>
          <input type="hidden" name="photo" value="${escapeHtml(item.photo || "")}">
          <button class="photo-btn" type="button" data-action="pick-photo" aria-label="${tr("sheet.item.addPhoto")}">
            ${item.photo ? `<img src="${item.photo}" alt="">` : icon("camera", { size: 22 })}
          </button>
          <input type="file" accept="image/*" data-role="photo-input" hidden>
        </div>
        <label class="switch-field">
          <span>${tr("hshop.got")}</span>
          <span class="switch"><input type="checkbox" name="bought" ${item.bought ? "checked" : ""}><span></span></span>
        </label>
        <label class="field"><span>${tr("hshop.priceLabel")}<span class="hint">${tr("sheet.item.price.hint")}</span></span>
          <input type="number" name="paidPrice" inputmode="decimal" min="0" step="0.1" value="${item.paidPrice ?? ""}" placeholder="${suggest}">
        </label>
        <div class="btn-row">
          <button class="btn" type="submit">${tr("common.save")}</button>
          ${sheet.id ? `<button class="btn danger" type="button" data-action="item-del" data-id="${item.id}">${tr("common.delete")}</button>` : ""}
        </div>
      </form>
    `;
  }
  return `<button class="sheet-back" type="button" data-action="sheet-close" aria-label="${tr("common.close")}"></button>
    <div class="sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle" aria-hidden="true"></div>
      ${body}
    </div>`;
}

function mainContent() {
  if (ui.tab === "role") return viewRole();
  if (role === "helper") {
    const needSession = !["h-enter", "role"].includes(ui.tab);
    if (needSession && !sessionHelper()) return viewHelperEnter();
    switch (ui.tab) {
      case "h-enter":
        return viewHelperEnter();
      case "h":
        return viewHelperHome();
      case "h-leave":
        return viewHelperLeave();
      case "h-tasks":
        return viewHelperTasks();
      case "h-rules":
        return viewHelperRules();
      case "h-shop":
        return viewHelperShop();
      case "h-shop-detail":
        return viewHelperShopDetail();
      case "h-menu":
        return viewMenu();
      case "h-recipes":
        return viewRecipes();
      case "h-recipe":
        return viewRecipe();
      case "h-cook":
        return viewCook();
      case "h-pay":
        return viewHelperPay();
      case "h-remind":
        return viewHelperRemind();
      case "h-rights":
        return viewHelperRights();
      case "h-more":
        return viewHelperMore();
      default:
        return viewHelperHome();
    }
  }
  switch (ui.tab) {
    case "onboard":
      return viewOnboard();
    case "home":
      return viewHome();
    case "leave":
      return viewLeave();
    case "pay":
      return viewPay();
    case "remind":
      return viewRemind();
    case "tasks":
      return viewTasks();
    case "rules":
      return viewRules();
    case "shop":
      return viewShop();
    case "shop-detail":
      return viewShopDetail();
    case "menu":
      return viewMenu();
    case "recipes":
      return viewRecipes();
    case "recipe":
      return viewRecipe();
    case "cook":
      return viewCook();
    case "share":
      return viewShare();
    case "more":
      return viewMore();
    case "guide":
      return viewGuide();
    case "backup":
      return viewBackup();
    case "helper-new":
      return viewHelperForm("new");
    case "helper-edit":
      return viewHelperForm("edit");
    default:
      return viewHome();
  }
}

/** Remove service workers and Cache Storage, then reload. Never touches localStorage (app data, role, language). */
async function forceUpdateToLatest() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch (err) {
    console.warn(err);
  }
  try {
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (err) {
    console.warn(err);
  }
  location.reload();
}

function bootError(err) {
  const app = document.getElementById("app");
  if (!app) return;
  const msg = err && err.message ? String(err.message) : tr("boot.unknown");
  app.innerHTML = `
    <main class="main">
      ${langSwitch()}
      <h1 class="screen-title">${tr("boot.title")}</h1>
      <p class="lede">${tr("boot.body")}</p>
      <p class="note-box warn">${escapeHtml(msg)}</p>
      <div class="btn-row">
        <button class="btn" type="button" data-boot="reload">${tr("boot.reload")}</button>
        <button class="btn secondary" type="button" data-boot="update">${tr("boot.update")}</button>
      </div>
      <p class="tiny muted">${tr("boot.updateNote")}</p>
    </main>
  `;
  app.querySelector('[data-boot="reload"]')?.addEventListener("click", () => location.reload());
  app.querySelector('[data-boot="update"]')?.addEventListener("click", (ev) => {
    ev.currentTarget.disabled = true;
    forceUpdateToLatest();
  });
  app.querySelectorAll('[data-action="set-lang"]').forEach((b) =>
    b.addEventListener("click", () => {
      setLang(b.getAttribute("data-lang"));
      bootError(err);
    })
  );
}

function sheetScrollKey() {
  const s = ui.sheet;
  if (!s) return "";
  return `${s.type || ""}:${s.id || ""}:${s.listId || ""}:${s.date || ""}`;
}

function captureScroll() {
  const main = document.querySelector(".main");
  const sidebar = document.querySelector(".sidebar");
  const sheet = document.querySelector(".sheet");
  return {
    main: main ? main.scrollTop : 0,
    sidebar: sidebar ? sidebar.scrollTop : 0,
    sheet: sheet ? sheet.scrollTop : 0,
    sheetKey: sheetScrollKey(),
    winX: window.scrollX || 0,
    winY: window.scrollY || document.documentElement.scrollTop || 0,
  };
}

let scrollRestoreToken = 0;
function restoreScroll(pos) {
  if (!pos) return;
  const token = ++scrollRestoreToken;
  const apply = () => {
    if (token !== scrollRestoreToken) return;
    const main = document.querySelector(".main");
    if (main) main.scrollTop = pos.main;
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) sidebar.scrollTop = pos.sidebar;
    const sheet = document.querySelector(".sheet");
    if (sheet && pos.sheetKey && pos.sheetKey === sheetScrollKey()) sheet.scrollTop = pos.sheet;
    if (pos.winY || pos.winX) window.scrollTo(pos.winX, pos.winY);
  };
  apply();
  requestAnimationFrame(apply);
}

function render() {
  const app = document.getElementById("app");
  if (!app) return;
  const keep = captureForms();
  const scroll = captureScroll();
  if (!["helper-new", "helper-edit"].includes(ui.tab)) ui.docDraft = null;
  try {
    const sub =
      role === "helper" ? (sessionHelper()?.name ? escapeHtml(sessionHelper().name) + tr("log.sep") + tr("header.helperView") : tr("header.helperView")) : tr("header.employerView");
    const hasNav = !NAV_HIDDEN.includes(ui.tab);
    app.innerHTML = `
      <div class="shell ${hasNav ? "has-nav" : "no-nav"}">
        ${sidebar()}
        <div class="content-col">
          ${ui.tab === "role" ? "" : header(sub)}
          <main class="main"><div class="main-inner">${mainContent()}</div></main>
          ${tabbar()}
        </div>
      </div>
      ${sheetHtml()}
      ${docViewerHtml()}
      ${payslipHtml()}
      ${ui.toast ? `<div class="toast" role="status">${escapeHtml(ui.toast)}</div>` : ""}
    `;
    restoreForms(keep);
    restoreScroll(scroll);
    bindAfterRender();
    setupSignaturePad();
  } catch (err) {
    console.error(err);
    bootError(err);
  }
}

function bindHelperContractDates() {
  const form = document.getElementById("helper-form");
  if (!form) return;
  const start = form.elements.startDate;
  const contractStart = form.elements.contractStart;
  const contractEnd = form.elements.contractEnd;
  if (!start || !contractStart || !contractEnd) return;
  if (contractEnd.value) contractEnd.dataset.manual = "1";

  const fill = () => {
    if (start.value && !contractStart.value) contractStart.value = start.value;
    const basis = contractStart.value || start.value;
    if (!basis) return;
    if (contractEnd.dataset.manual === "1") return;
    const end = defaultContractEnd(basis);
    if (end) {
      contractEnd.value = end;
      contractEnd.dataset.autofilled = "1";
    }
  };

  start.addEventListener("change", fill);
  contractStart.addEventListener("change", fill);
  contractEnd.addEventListener("input", () => {
    contractEnd.dataset.manual = contractEnd.value ? "1" : "";
    contractEnd.dataset.autofilled = "";
  });
  fill();
}

function bindAfterRender() {
  bindHelperContractDates();
  syncAllRecipeGroups();
  const form = document.getElementById("task-form");
  const schedule = form?.elements?.schedule;
  if (schedule) {
    schedule.addEventListener("change", () => {
      form.querySelector("[data-weekly-only]")?.toggleAttribute("hidden", schedule.value !== "weekly");
      form.querySelector("[data-once-only]")?.toggleAttribute("hidden", schedule.value !== "once");
    });
  }
  const rs = document.querySelector("[data-recipe-search]");
  if (rs) {
    rs.addEventListener("input", () => {
      ui.recipeQuery = rs.value;
      const box = document.getElementById("recipe-list");
      if (box) box.innerHTML = recipeListInner(role === "helper");
    });
  }
  const ps = document.querySelector("[data-pick-search]");
  if (ps) {
    ps.addEventListener("input", () => {
      const q = ps.value.trim().toLowerCase().replace(/^#/, "");
      document.querySelectorAll(".pick-row").forEach((row) => {
        row.hidden = Boolean(q) && !String(row.getAttribute("data-pick-text") || "").includes(q);
      });
    });
  }
  const nameInput = document.querySelector("#shop-item-form [name=name]");
  if (nameInput) {
    const price = document.querySelector("#shop-item-form [name=paidPrice]");
    const wrap = document.querySelector("[data-suggest-wrap]");
    const itemId = document.getElementById("shop-item-form")?.getAttribute("data-id") || "";
    const existing = state.shopItems.find((i) => i.id === itemId);
    const recentWrap = document.querySelector("[data-recent-wrap]");
    const listIdForHint = document.getElementById("shop-item-form")?.getAttribute("data-list") || "";
    const update = () => {
      const cat = findCatalog(state, nameInput.value);
      if (wrap) wrap.innerHTML = itemHintBlock(cat);
      if (recentWrap) recentWrap.innerHTML = itemRecentHint(nameInput.value, itemId, listIdForHint);
      if (!price) return;
      if (cat && (price.value === "" || price.dataset.autofilled === "1")) {
        price.value = String(cat.lastPrice);
        price.dataset.autofilled = "1";
        price.dataset.suggest = String(cat.lastPrice);
      } else if (!cat && price.dataset.autofilled === "1") {
        price.value = "";
        price.dataset.autofilled = "";
        price.dataset.suggest = "";
      }
    };
    nameInput.addEventListener("input", update);
    price?.addEventListener("input", () => {
      price.dataset.autofilled = "";
    });
    if (!existing || (existing.paidPrice === "" || existing.paidPrice == null)) update();
  }
}

function loadDemo() {
  const h = demoHelper();
  state.helpers.push(h);
  state.currentHelperId = h.id;
  save();
  toast(tr("toast.demoLoaded"));
  setTab("home");
}

function collectHelperForm(form) {
  const fd = new FormData(form);
  const restRaw = String(fd.get("restDay") || "0");
  return normalizeHelperForm({
    id: String(fd.get("helperId") || fd.get("id") || "") || uid("helper"),
    name: String(fd.get("name") || ""),
    nationality: String(fd.get("nationality") || "other"),
    startDate: String(fd.get("startDate") || ""),
    contractStart: String(fd.get("contractStart") || ""),
    contractEnd: String(fd.get("contractEnd") || ""),
    wage: Number(fd.get("wage") || 0),
    foodProvided: form.elements.foodProvided?.checked,
    foodAllowance: Number(fd.get("foodAllowance") || 0),
    restDay: restRaw,
    phone: String(fd.get("phone") || ""),
    notes: String(fd.get("notes") || ""),
    visaExpiry: String(fd.get("visaExpiry") || ""),
    passportExpiry: String(fd.get("passportExpiry") || ""),
    passportNo: cleanIdNumber(fd.get("passportNo")),
    hkidNo: cleanIdNumber(fd.get("hkidNo")),
    docs: normalizeDocs(ui.docDraft),
    winterChoice: helper()?.winterChoice || "christmas",
    grantGeneralHolidays: helper()?.grantGeneralHolidays || false,
  });
}

function syncRecipeGroupDom(group) {
  if (!group) return;
  const parent = group.querySelector('input[data-tick="parent"]');
  const leaves = [...group.querySelectorAll('input[data-tick="leaf"]')];
  const hiddenDone = Number(group.dataset.hiddenChildDone) || 0;
  const hiddenTotal = Number(group.dataset.hiddenChildTotal) || 0;
  const visDone = leaves.filter((i) => i.checked).length;
  const done = visDone + hiddenDone;
  const total = leaves.length + hiddenTotal;
  if (parent) {
    parent.checked = total > 0 && done === total;
    parent.indeterminate = done > 0 && done < total;
  }
  group.classList.toggle("is-bought", total > 0 && done === total);
  const slot = group.querySelector("[data-group-prog]");
  if (slot) slot.textContent = tr("shop.recipe.progress", { done, total });
}

function syncAllRecipeGroups() {
  document.querySelectorAll("[data-recipe-group]").forEach(syncRecipeGroupDom);
}

/** After ticking an item: update row state and the card's 3/8 progress without a full re-render. */
function refreshShopDom(el) {
  const group = el.closest("[data-recipe-group]");
  if (el.getAttribute("data-tick") === "parent" && group) {
    const on = el.checked;
    el.indeterminate = false;
    for (const leaf of group.querySelectorAll('input[data-tick="leaf"]')) {
      leaf.checked = on;
      leaf.closest("[data-item-row]")?.classList.toggle("is-bought", on);
    }
  } else {
    el.closest("[data-item-row]")?.classList.toggle("is-bought", el.checked);
  }
  if (group) syncRecipeGroupDom(group);
  const card = el.closest("[data-shop-card]");
  if (!card) return;
  const total = Number(card.dataset.total) || 0;
  const done = (Number(card.dataset.hiddenDone) || 0) + card.querySelectorAll('input[data-tick="leaf"]:checked').length;
  const prog = card.querySelector("[data-prog]");
  if (prog) prog.textContent = tr("shop.card.progress", { done, total });
  const bar = card.querySelector("[data-prog-bar]");
  if (bar) bar.style.width = `${total ? Math.round((done / total) * 100) : 0}%`;
}

function persistSessionPayload() {
  if (helperSession) saveSession(helperSession);
}

function writeShopBackToEmployer() {
  if (!sameDeviceWriteback()) return;
  const p = sessionPayload();
  const items = p.shopItems || [];
  for (const it of items) {
    const idx = state.shopItems.findIndex((s) => s.id === it.id);
    if (idx >= 0) {
      state.shopItems[idx] = { ...state.shopItems[idx], bought: it.bought, paidPrice: it.paidPrice };
      if (it.paidPrice !== "" && it.paidPrice != null && Number(it.paidPrice) >= 0) {
        {
          const lst = state.shopLists.find((l) => l.id === state.shopItems[idx].listId);
          recordCatalogPrice(state, it.name, it.paidPrice, (lst && listDate(lst)) || today(), lst?.place || "", { listId: lst?.id || "", itemId: it.id });
        }
      }
    }
  }
  for (const list of p.shopLists || []) {
    const idx = state.shopLists.findIndex((s) => s.id === list.id);
    if (idx >= 0) state.shopLists[idx] = { ...state.shopLists[idx], status: list.status };
  }
  save();
}


function removeShopItemsFrom(items, id) {
  const list = items || [];
  const target = list.find((i) => i.id === id);
  const drop = new Set([id]);
  if (target && isRecipeParent(target)) {
    for (const i of list) if (i.parentId === id) drop.add(i.id);
  }
  let next = list.filter((i) => !drop.has(i.id));
  const parentId = target?.parentId;
  if (parentId && !next.some((i) => i.parentId === parentId)) {
    next = next.filter((i) => i.id !== parentId);
  }
  return { next, target, drop };
}

function confirmShopItemDelete(target) {
  if (!target || !isRecipeParent(target)) return true;
  return window.confirm(tr("shop.recipe.deleteConfirm", { name: target.name || "" }));
}

async function onClick(ev) {
  const go = ev.target.closest("[data-go]");
  if (go) {
    ev.preventDefault();
    if (go.dataset.list) ui.shopListId = go.dataset.list;
    if (go.dataset.recipe) ui.recipeId = go.dataset.recipe;
    setTab(go.getAttribute("data-go"));
    return;
  }
  const sw = ev.target.closest("[data-switch]");
  if (sw) {
    state.currentHelperId = sw.getAttribute("data-switch");
    save();
    render();
    return;
  }
  const pane = ev.target.closest("[data-pane]");
  if (pane) {
    ui.leavePane = pane.getAttribute("data-pane");
    render();
    return;
  }
  const yearBtn = ev.target.closest("[data-year]");
  if (yearBtn) {
    ui.year = Number(yearBtn.getAttribute("data-year"));
    render();
    return;
  }
  const act = ev.target.closest("[data-action]");
  if (!act) return;
  const action = act.getAttribute("data-action");
  const id = act.getAttribute("data-id");
  const swipeRowEl = act.closest("[data-swipe-row]");
  const confirmKey = swipeRowEl?.getAttribute("data-swipe-confirm");
  if (confirmKey && act.matches(".swipe-del-btn, .swipe-hover-del") && action !== "item-del") {
    const name = swipeRowEl.getAttribute("data-swipe-confirm-name") || "";
    if (!window.confirm(tr(confirmKey, { name }))) return;
  }
  if (action === "choose-role") {
    const next = act.getAttribute("data-role");
    if (!next) {
      setRole(null);
      ui.tab = "role";
      location.hash = "#/role";
      render();
      return;
    }
    setRole(next);
    if (next === "helper") {
      ui.tab = sessionHelper() ? "h" : "h-enter";
      location.hash = `#/${ui.tab}`;
    } else {
      ui.tab = state.helpers.length ? "home" : "onboard";
      location.hash = `#/${ui.tab}`;
    }
    render();
    return;
  }
  if (action === "load-demo") return loadDemo();
  if (action === "open-leave") {
    ui.leavePane = act.getAttribute("data-leave-pane") || "rest";
    setTab("leave");
    return;
  }
  if (action === "set-lang") {
    setLang(act.getAttribute("data-lang"));
    render();
    return;
  }
  if (action === "month-prev") {
    const d = new Date(ui.year, ui.month - 1, 1);
    ui.year = d.getFullYear();
    ui.month = d.getMonth();
    if (ui.year < YEARS[0]) ui.year = YEARS[0];
    render();
    return;
  }
  if (action === "month-next") {
    const d = new Date(ui.year, ui.month + 1, 1);
    ui.year = d.getFullYear();
    ui.month = d.getMonth();
    if (ui.year > YEARS[YEARS.length - 1] && ui.month > 0 && d.getFullYear() > YEARS[YEARS.length - 1]) {
      /* allow navigating months even around official year edges */
    }
    render();
    return;
  }
  if (action === "set-rest-policy") {
    const h = helper();
    if (!h) return;
    const value = act.getAttribute("data-value");
    h.restDay = value === REST_DAY_ARRANGED ? REST_DAY_ARRANGED : Number(value);
    save();
    toast(isArrangedRestPolicy(h.restDay) ? tr("toast.restArranged") : tr("toast.restFixed", { day: weekdayLabel(h.restDay) }));
    render();
    return;
  }
  if (action === "cal-day") {
    const iso = act.getAttribute("data-date");
    const h = helper();
    if (!h || !iso) return;
    if (ui.leavePane === "calc") {
      const existing = leaveLogsFor(h, "annual").find((l) => l.startDate === iso && (l.endDate || l.startDate) === iso);
      if (existing) {
        state.leaveLogs = state.leaveLogs.filter((l) => l.id !== existing.id);
        toast(tr("toast.annualCancelled"));
      } else {
        state.leaveLogs.push(newLeaveLog({ helperId: h.id, type: "annual", startDate: iso, endDate: iso, days: 1 }));
        toast(tr("toast.annualBooked"));
      }
      save();
      render();
      return;
    }
    if (isArrangedRestPolicy(h.restDay)) {
      const nowOn = toggleArrangedRestDay(state, h.id, iso);
      save();
      toast(nowOn.includes(iso) ? tr("toast.restAdded") : tr("toast.restRemoved"));
      render();
    }
    return;
  }
  if (action === "sh-edit") {
    ui.sheet = { type: "sh", date: act.getAttribute("data-date") };
    render();
    return;
  }
  if (action === "leave-new") {
    ui.sheet = { type: "leave" };
    render();
    return;
  }
  if (action === "leave-del") {
    state.leaveLogs = state.leaveLogs.filter((l) => l.id !== id);
    save();
    render();
    return;
  }
  if (action === "pay-new") {
    ui.sheet = { type: "pay" };
    render();
    return;
  }
  if (action === "consent-open") {
    ui.sigData = "";
    ui.sheet = { type: "consent", payId: id };
    render();
    return;
  }
  if (action === "sig-clear") {
    ui.sigData = "";
    const cv = document.getElementById("sig-pad");
    cv?.getContext("2d")?.clearRect(0, 0, cv.width, cv.height);
    return;
  }
  if (action === "consent-clear") {
    if (!window.confirm(tr("consent.clear.confirm"))) return;
    const p = state.payments.find((x) => x.id === id);
    if (p) {
      p.consent = null;
      save();
    }
    render();
    return;
  }
  if (action === "payslip-open") {
    ui.payslipId = id;
    render();
    return;
  }
  if (action === "payslip-close") {
    ui.payslipId = null;
    render();
    return;
  }
  if (action === "payslip-print") {
    window.print();
    return;
  }
  if (action === "import-return") {
    const text = document.getElementById("return-code")?.value || "";
    try {
      const obj = parsePayReturnCode(text);
      const owner = state.helpers.find((x) => state.helperAccess[x.id]?.shareId === obj.shareId);
      if (!owner) throw new Error(tr("consent.import.noMatch"));
      let n = 0;
      for (const it of obj.items) {
        const p = state.payments.find((x) => x.id === it.id && x.helperId === owner.id);
        if (!p) continue;
        if (!p.consent) n += 1;
        p.consent = p.consent || normalizeConsent({ status: "confirmed", at: it.at || new Date().toISOString(), by: "helper-code", signature: "" });
      }
      if (!save()) return;
      ui.returnMsg = tp("consent.import.ok", n, { name: owner.name });
    } catch (err) {
      ui.returnMsg = err?.message || tr("err.returnFormat");
    }
    render();
    return;
  }
  if (action === "h-pay-confirm") {
    const p = sessionPayload();
    if (!p?.shareId) return;
    if (!window.confirm(tr("hpay.confirm.ask"))) return;
    const at = new Date().toISOString();
    if (!setPayConsent(p.shareId, id, at)) return toast(tr("toast.storageFull"));
    if (sameDeviceWriteback()) {
      const rec = state.payments.find((x) => x.id === id);
      if (rec && !rec.consent) {
        rec.consent = { status: "confirmed", at, by: "helper-device", signature: "" };
        save();
      }
    }
    toast(tr("hpay.confirm.done"));
    return;
  }
  if (action === "copy-return") {
    const code = document.getElementById("return-code-out")?.value || "";
    try {
      await navigator.clipboard.writeText(code);
      toast(tr("hpay.code.copied"));
    } catch {
      document.getElementById("return-code-out")?.select();
      toast(tr("toast.longPress"));
    }
    return;
  }
  if (action === "pay-del") {
    state.payments = state.payments.filter((p) => p.id !== id);
    save();
    render();
    return;
  }
  if (action === "remind-snooze") {
    state.reminderState[id] = { ...(state.reminderState[id] || {}), snoozeUntil: snoozeUntil(today(), 7) };
    save();
    toast(tr("toast.snoozed"));
    render();
    return;
  }
  if (action === "remind-done" && String(id).startsWith("custom:")) {
    const rem = state.customReminders.find((r) => r.id === String(id).slice(7));
    if (rem) {
      if (rem.repeat === "none") rem.doneAt = new Date().toISOString();
      else rem.date = nextCustomDate(rem, today());
      delete state.reminderState[id];
      save();
      toast(tr(rem.repeat === "none" ? "remind.marked" : "remind.rolled", { date: formatDate(rem.date, { short: true }) }));
    }
    render();
    return;
  }
  if (action === "reminder-new") {
    ui.sheet = { type: "reminder" };
    render();
    return;
  }
  if (action === "reminder-edit") {
    ui.sheet = { type: "reminder", id };
    render();
    return;
  }
  if (action === "reminder-del") {
    state.customReminders = state.customReminders.filter((r) => r.id !== id);
    delete state.reminderState[`custom:${id}`];
    save();
    ui.sheet = null;
    render();
    return;
  }
  if (action === "reminder-restore") {
    const rem = state.customReminders.find((r) => r.id === id);
    if (rem) {
      rem.doneAt = "";
      save();
    }
    render();
    return;
  }
  if (action === "remind-done") {
    state.reminderState[id] = { ...(state.reminderState[id] || {}), done: true };
    save();
    render();
    return;
  }
  if (action === "menu-view") {
    ui.menuView = act.getAttribute("data-v") === "week" ? "week" : "day";
    render();
    return;
  }
  if (action === "menu-day-open") {
    ui.menuDate = act.getAttribute("data-date");
    ui.menuView = "day";
    render();
    return;
  }
  if (action === "recipe-lang") {
    ui.recipeLang = act.getAttribute("data-v");
    render();
    return;
  }
  if (action === "recipe-cat") {
    ui.recipeCat = act.getAttribute("data-v");
    render();
    return;
  }
  if (action === "recipe-src") {
    ui.recipeSrc = act.getAttribute("data-v");
    render();
    return;
  }
  if (action === "recipe-diet-f") {
    const v = act.getAttribute("data-v");
    ui.recipeDiet = ui.recipeDiet.includes(v) ? ui.recipeDiet.filter((x) => x !== v) : [...ui.recipeDiet, v];
    render();
    return;
  }
  if (action === "cook-open") {
    ui.recipeId = id;
    ui.cookStep = 0;
    try {
      navigator.wakeLock?.request?.("screen")?.catch(() => {});
    } catch {
      /* optional */
    }
    setTab(menuGo("cook"));
    return;
  }
  if (action === "cook-prev" || action === "cook-next") {
    ui.cookStep = Math.max(0, (Number(ui.cookStep) || 0) + (action === "cook-next" ? 1 : -1));
    render();
    window.scrollTo?.(0, 0);
    document.querySelector(".main")?.scrollTo?.(0, 0);
    return;
  }
  if (action === "cook-done") {
    ui.cookStep = 0;
    ui.recipeId = id;
    setTab(menuGo("recipe"));
    return;
  }
  if (action === "share-wa" || action === "share-copy") {
    const text = shareTextFor(act.getAttribute("data-kind"), id, act.getAttribute("data-l") === "en" ? "en" : "zh");
    if (!text) return;
    if (action === "share-wa") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
      return;
    }
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast(tr("share.copied"));
    } catch {
      toast(tr("share.copyFailed"));
    }
    return;
  }
  if (role !== "helper" && action === "web-open-sheet") {
    setRecipePhotos([]);
    ui.recipePhotoReplace = null;
    ui.sheet = { type: "web-recipe", prefill: { name: act.getAttribute("data-q") || "" } };
    render();
    return;
  }
  if (role !== "helper" && action === "web-open-link") {
    const raw = document.querySelector("#web-recipe-form [name=sourceUrl]")?.value || "";
    const url = normalizeSourceUrl(raw);
    if (!url) return toast(tr("recipe.web.badUrl"));
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  if (role !== "helper" && action === "gen-open") {
    ui.sheet = { type: "gen-shop" };
    render();
    return;
  }
  if (role !== "helper" && action === "list-recipes-open") {
    ui.sheet = { type: "list-recipes", listId: act.getAttribute("data-list") };
    render();
    return;
  }
  if (role !== "helper" && action === "recipe-copy") {
    const src = allRecipes(state.recipes).find((x) => x.id === id);
    if (!src) return;
    const copy = newRecipe({
      nameZh: src.nameZh,
      nameEn: src.nameEn,
      name: src.nameZh || src.nameEn,
      no: nextRecipeNo(state.recipes),
      category: src.category,
      prepMins: src.prepMins,
      difficulty: src.difficulty,
      servings: src.servings,
      ingredients: src.ingredients.map((i) => ({ ...i })),
      steps: src.steps.map((x) => ({ ...x })),
      tips: { ...src.tips },
      notes: src.tips.zh,
      diet: (src.diet || []).slice(),
      tags: (src.tags || []).slice(),
      copyOf: src.builtin ? src.id : src.copyOf || "",
      sourceUrl: src.sourceUrl || "",
    });
    state.recipes.push(copy);
    if (!save()) {
      state.recipes.pop();
      return;
    }
    ui.recipeId = copy.id;
    toast(tr("recipe.copied", { no: copy.no }));
    setTab("recipe");
    return;
  }
  if (action === "menu-open") {
    ui.menuDate = today();
    setTab(act.getAttribute("data-tab") || menuGo("menu"));
    return;
  }
  if (action === "menu-day") {
    ui.menuDate = act.getAttribute("data-date");
    render();
    return;
  }
  if (action === "menu-today") {
    ui.menuDate = today();
    render();
    return;
  }
  if (action === "menu-week") {
    ui.menuDate = shiftISO(ui.menuDate, Number(act.getAttribute("data-d")) || 0);
    render();
    return;
  }
  if (role !== "helper" && action === "dish-new") {
    ui.sheet = { type: "dish", date: act.getAttribute("data-date"), slotId: act.getAttribute("data-slot") };
    render();
    return;
  }
  if (role !== "helper" && action === "dish-edit") {
    ui.sheet = { type: "dish", date: act.getAttribute("data-date"), id };
    render();
    return;
  }
  if (role !== "helper" && action === "dish-del") {
    const date = act.getAttribute("data-date");
    const day = state.menu.days[date] || {};
    for (const k of Object.keys(day)) day[k] = day[k].filter((d) => d.id !== id);
    pruneDay(state.menu, date);
    save();
    ui.sheet = null;
    toast(tr("menu.dish.deleted"));
    render();
    return;
  }
  if (role !== "helper" && action === "copy-open") {
    ui.sheet = { type: "copy-day" };
    render();
    return;
  }
  if (role !== "helper" && action === "slots-open") {
    ui.slotArm = "";
    ui.sheet = { type: "slots" };
    render();
    return;
  }
  if (role !== "helper" && action === "slots-done") {
    applySlotNames();
    save();
    ui.slotArm = "";
    ui.sheet = null;
    render();
    return;
  }
  if (role !== "helper" && (action === "slot-up" || action === "slot-down")) {
    applySlotNames();
    const i = state.menu.slots.findIndex((s) => s.id === id);
    const j = action === "slot-up" ? i - 1 : i + 1;
    if (i >= 0 && j >= 0 && j < state.menu.slots.length) {
      const [s] = state.menu.slots.splice(i, 1);
      state.menu.slots.splice(j, 0, s);
    }
    ui.slotArm = "";
    save();
    render();
    return;
  }
  if (role !== "helper" && action === "slot-del") {
    applySlotNames();
    if (ui.slotArm !== id) {
      ui.slotArm = id;
      render();
      return;
    }
    state.menu.slots = state.menu.slots.filter((s) => s.id !== id);
    for (const date of Object.keys(state.menu.days)) {
      delete state.menu.days[date][id];
      pruneDay(state.menu, date);
    }
    ui.slotArm = "";
    save();
    render();
    return;
  }
  if (role !== "helper" && action === "recipe-new") {
    setRecipePhotos([]);
    ui.recipePhotoReplace = null;
    ui.sheet = { type: "recipe" };
    render();
    return;
  }
  if (role !== "helper" && action === "recipe-edit") {
    const r = allRecipes(state.recipes).find((x) => x.id === id);
    if (!r) return;
    setRecipePhotos(recipePhotosOf(r));
    ui.recipePhotoReplace = null;
    ui.recipeRestoreArm = "";
    ui.sheet = { type: "recipe", id };
    render();
    return;
  }
  if (role !== "helper" && action === "recipe-del") {
    if (isLibraryRecipeId(id)) return;
    state.recipes = state.recipes.filter((r) => r.id !== id);
    save();
    ui.sheet = null;
    ui.recipeId = null;
    toast(tr("recipe.deleted"));
    setTab("recipes");
    return;
  }
  if (role !== "helper" && action === "recipe-restore") {
    if (!isLibraryRecipeId(id) || !state.recipes.some((r) => libraryOverrideId(r) === id)) return;
    if (ui.recipeRestoreArm !== id) {
      ui.recipeRestoreArm = id;
      render();
      return;
    }
    state.recipes = state.recipes.filter((r) => libraryOverrideId(r) !== id);
    if (!save()) return;
    ui.recipeRestoreArm = "";
    ui.sheet = null;
    setRecipePhotos([]);
    ui.recipePhotoReplace = null;
    toast(tr("recipe.restored"));
    return;
  }
  if (action === "pick-recipe-photo") {
    ui.recipePhotoReplace = null;
    document.querySelector("[data-role=recipe-photo-input]")?.click();
    return;
  }
  if (action === "replace-recipe-photo") {
    ui.recipePhotoReplace = Number(act.getAttribute("data-i"));
    document.querySelector("[data-role=recipe-photo-input]")?.click();
    return;
  }
  if (action === "recipe-photo-clear") {
    setRecipePhotos([]);
    ui.recipePhotoReplace = null;
    render();
    return;
  }
  if (action === "recipe-photo-remove") {
    const i = Number(act.getAttribute("data-i"));
    const photos = currentRecipePhotos().filter((_, idx) => idx !== i);
    setRecipePhotos(photos);
    ui.recipePhotoReplace = null;
    render();
    return;
  }
  if (action === "clear-shop-date") {
    const listId = act.getAttribute("data-list");
    if (listId) {
      const list = state.shopLists.find((l) => l.id === listId);
      if (list) {
        list.date = "";
        save();
        render();
      }
      return;
    }
    const input = act.closest(".shop-date-field, .field")?.querySelector("input[type=date]") || act.parentElement?.querySelector("input[type=date]");
    applyClearedShopDateInput(input);
    return;
  }
  if (role !== "helper" && action === "recipe-menu") {
    ui.sheet = { type: "dish", date: ui.menuDate, slotId: state.menu.slots[0]?.id || "", recipeId: id };
    render();
    return;
  }
  if (role !== "helper" && action === "recipe-shop-open") {
    ui.sheet = { type: "recipe-shop", id };
    render();
    return;
  }
  if (action === "task-new") {
    ui.sheet = { type: "task" };
    render();
    return;
  }
  if (action === "task-edit") {
    ui.sheet = { type: "task", id };
    render();
    return;
  }
  if (action === "task-del") {
    state.workTasks = state.workTasks.filter((t) => t.id !== id);
    save();
    ui.sheet = null;
    toast(tr("toast.taskDeleted"));
    render();
    return;
  }
  if (action === "rule-new") {
    ui.sheet = { type: "rule" };
    render();
    return;
  }
  if (action === "rule-edit") {
    ui.sheet = { type: "rule", id };
    render();
    return;
  }
  if (action === "rule-del") {
    state.workRules = state.workRules.filter((r) => r.id !== id);
    save();
    ui.sheet = null;
    toast(tr("toast.ruleDeleted"));
    render();
    return;
  }
  if (action === "nav-tab-add") {
    uiPrefs = addNavTab(uiPrefs, role, id);
    render();
    return;
  }
  if (action === "nav-tab-remove") {
    uiPrefs = removeNavTab(uiPrefs, role, id);
    render();
    return;
  }
  if (action === "nav-tab-up") {
    uiPrefs = moveNavTab(uiPrefs, role, id, -1);
    render();
    return;
  }
  if (action === "nav-tab-down") {
    uiPrefs = moveNavTab(uiPrefs, role, id, 1);
    render();
    return;
  }
  if (action === "shop-group-toggle") {
    const group = act.closest("[data-recipe-group]");
    const listId = act.getAttribute("data-list") || group?.getAttribute("data-list") || "";
    const parentId = act.getAttribute("data-id") || group?.getAttribute("data-recipe-group") || "";
    const next = !group?.classList.contains("is-collapsed");
    setShopGroupCollapsed(listId, parentId, next);
    applyShopGroupCollapsed(group, next);
    return;
  }
  if (action === "shop-view") {
    ui.shopView = act.getAttribute("data-view") === "cal" ? "cal" : "list";
    ui.shopDay = "";
    render();
    return;
  }
  if (action === "shop-month") {
    const d = new Date(ui.shopCal.year, ui.shopCal.month + Number(act.getAttribute("data-d")), 1);
    ui.shopCal = { year: d.getFullYear(), month: d.getMonth() };
    ui.shopDay = "";
    render();
    return;
  }
  if (action === "shop-day") {
    const date = act.getAttribute("data-date");
    const lists = role === "helper" ? sessionPayload()?.shopLists || [] : listsFor(helper());
    const hit = lists.filter((l) => listDate(l) === date);
    if (hit.length === 1) {
      ui.shopListId = hit[0].id;
      ui.shopDay = date;
      setTab(role === "helper" ? "h-shop-detail" : "shop-detail");
      return;
    }
    ui.shopDay = date;
    render();
    return;
  }
  if (action === "price-history") {
    ui.sheet = { type: "price-history", key: act.getAttribute("data-key") };
    render();
    return;
  }
  if (action === "price-hist-toggle") {
    act.closest("[data-suggest-wrap]")?.querySelector(".price-hist")?.toggleAttribute("hidden");
    return;
  }
  if (action === "shop-new") {
    ui.sheet = { type: "shop-list", date: act.getAttribute("data-date") || "" };
    render();
    return;
  }
  if (action === "item-new") {
    ui.sheet = { type: "shop-item", listId: act.getAttribute("data-list") };
    render();
    return;
  }
  if (action === "item-edit") {
    ui.sheet = { type: "shop-item", id };
    render();
    return;
  }
  if (action === "item-del") {
    if (role === "helper") {
      const p = sessionPayload();
      if (!p) return;
      const { next, target, drop } = removeShopItemsFrom(p.shopItems || [], id);
      if (!target) return;
      if (!confirmShopItemDelete(target)) return;
      p.shopItems = next;
      persistSessionPayload();
      if (sameDeviceWriteback()) {
        state.shopItems = state.shopItems.filter((i) => !drop.has(i.id));
        const parentId = target.parentId;
        if (parentId && !state.shopItems.some((i) => i.parentId === parentId)) {
          state.shopItems = state.shopItems.filter((i) => i.id !== parentId);
        }
        removeCatalogEntry(state, id);
        save();
      }
      ui.sheet = null;
      render();
      return;
    }
    const { next, target } = removeShopItemsFrom(state.shopItems, id);
    if (!target) return;
    if (!confirmShopItemDelete(target)) return;
    state.shopItems = next;
    removeCatalogEntry(state, id);
    save();
    ui.sheet = null;
    render();
    return;
  }
  if (action === "shop-del") {
    if (role === "helper") return;
    const listId = act.getAttribute("data-list") || id;
    if (!listId) return;
    state.shopLists = state.shopLists.filter((l) => l.id !== listId);
    state.shopItems = state.shopItems.filter((i) => i.listId !== listId);
    save();
    if (ui.shopListId === listId) ui.shopListId = null;
    ui.sheet = null;
    if (ui.tab === "shop-detail") {
      ui.tab = "shop";
      history.replaceState(null, "", "#/shop");
    }
    toast(tr("toast.listDeleted"));
    return;
  }
  if (action === "shop-complete") {
    const listId = act.getAttribute("data-list");
    const list = state.shopLists.find((l) => l.id === listId);
    if (list) {
      list.status = "done";
      list.completedAt = new Date().toISOString();
      itemsForList(listId).forEach((item) => {
        if (item.paidPrice !== "" && item.paidPrice != null) {
          recordCatalogPrice(state, item.name, item.paidPrice, listDate(list) || today(), list.place, { listId: list.id, itemId: item.id });
        }
      });
      save();
      toast(tr("toast.listDone"));
      render();
    }
    return;
  }
  if (action === "shop-reopen") {
    const list = state.shopLists.find((l) => l.id === act.getAttribute("data-list"));
    if (list) {
      list.status = "open";
      list.completedAt = "";
      save();
      render();
    }
    return;
  }
  if (action === "doc-pick") {
    act.closest(".doc-block")?.querySelector("[data-doc-input]")?.click();
    return;
  }
  if (action === "doc-del") {
    const list = ui.docDraft?.[act.getAttribute("data-doc")];
    if (list) list.splice(Number(act.getAttribute("data-idx")), 1);
    render();
    return;
  }
  if (action === "doc-view") {
    const v = { src: act.getAttribute("data-src"), type: act.getAttribute("data-doc"), idx: Number(act.getAttribute("data-idx")), url: "" };
    const d = docList(v.src, v.type)[v.idx];
    if (!d) return;
    if (d.type === "application/pdf") {
      try {
        v.url = dataUrlToBlobUrl(d.data);
      } catch {
        v.url = d.data;
      }
    }
    ui.docView = v;
    render();
    return;
  }
  if (action === "doc-close") {
    if (ui.docView?.url?.startsWith("blob:")) URL.revokeObjectURL(ui.docView.url);
    ui.docView = null;
    render();
    return;
  }
  if (action === "toggle-reveal") {
    const key = `${act.getAttribute("data-src")}:${act.getAttribute("data-field")}`;
    ui.reveal[key] = !ui.reveal[key];
    render();
    return;
  }
  if (action === "pick-photo") {
    document.querySelector("[data-role=photo-input]")?.click();
    return;
  }
  if (action === "share-generate") {
    act.disabled = true;
    await generateShare();
    return;
  }
  if (action === "send-update" || action === "send-update-native") {
    if (act.disabled) return;
    act.disabled = true;
    try {
      await sendUpdate(action === "send-update-native" ? "native" : "wa");
    } finally {
      act.disabled = false;
    }
    return;
  }
  if (action === "update-copy" && ui.updateSent) {
    try {
      await navigator.clipboard.writeText(ui.updateSent.msg);
      toast(tr("toast.shareCopied"));
    } catch {
      toast(tr("toast.longPress"));
    }
    return;
  }
  if (action === "share-revoke") {
    const h = helper();
    if (!h) return;
    if (state.helperAccess[h.id]) state.helperAccess[h.id].revoked = true;
    removeInbox(h.id);
    if (helperSession?.payload?.helper?.id === h.id) {
      helperSession = null;
      saveSession(null);
    }
    ui.shareReveal = null;
    save();
    toast(tr("toast.revoked"));
    render();
    return;
  }
  if (action === "copy-pin" && ui.shareReveal) {
    try {
      await navigator.clipboard.writeText(ui.shareReveal.pin);
      toast(tr("toast.pinCopied"));
    } catch {
      toast(tr("toast.pinManual"));
    }
    return;
  }
  if (action === "copy-link" && ui.shareReveal) {
    try {
      await navigator.clipboard.writeText(ui.shareReveal.url);
      toast(tr("toast.linkCopied"));
    } catch {
      toast(tr("toast.linkManual"));
    }
    return;
  }
  if (action === "copy-packed" && ui.shareReveal) {
    try {
      await navigator.clipboard.writeText(ui.shareReveal.packed);
      toast(tr("toast.packedCopied"));
    } catch {
      document.getElementById("share-packed")?.select();
      toast(tr("toast.longPress"));
    }
    return;
  }
  if (action === "share-native" && ui.shareReveal) {
    const text = tr("share.text", { app: tr("app.name"), pin: ui.shareReveal.pin });
    try {
      if (navigator.share) {
        await navigator.share({ title: tr("app.name"), text, url: ui.shareReveal.url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${ui.shareReveal.url}`);
        toast(tr("toast.shareCopied"));
      }
    } catch {
      /* user cancelled */
    }
    return;
  }
  if (action === "sheet-close") {
    ui.sheet = null;
    render();
    return;
  }
  if (action === "do-export") return doExport();
  if (action === "helper-delete") {
    const h = helper();
    if (!h) return;
    state.helpers = state.helpers.filter((x) => x.id !== h.id);
    state.leaveLogs = state.leaveLogs.filter((l) => l.helperId !== h.id);
    state.payments = state.payments.filter((p) => p.helperId !== h.id);
    state.workTasks = state.workTasks.filter((t) => t.helperId !== h.id);
    state.workRules = state.workRules.filter((r) => r.helperId !== h.id);
    state.shopLists = state.shopLists.filter((l) => l.helperId !== h.id);
    state.shopItems = state.shopItems.filter((i) => i.helperId !== h.id);
    delete state.helperAccess[h.id];
    delete state.arrangedRestDays[h.id];
    state.currentHelperId = state.helpers[0]?.id || null;
    save();
    toast(tr("toast.helperDeleted"));
    setTab(state.helpers.length ? "home" : "onboard");
    return;
  }
  if (action === "helper-ack") {
    const p = sessionPayload();
    if (p?.shareId) setAcked(p.shareId, act.checked);
    return;
  }
  if (action === "helper-lock") {
    helperSession = null;
    saveSession(null);
    ui.tab = "h-enter";
    location.hash = "#/h-enter";
    toast(tr("toast.locked"));
    render();
    return;
  }
  if (action === "task-done") {
    const p = sessionPayload();
    if (p?.shareId) setTaskDone(p.shareId, id, today(), act.checked);
    return;
  }
}

async function onChange(ev) {
  const el = ev.target;
  const action = el.getAttribute("data-action");
  if (action === "gen-shop-date") {
    const form = el.closest("#gen-form");
    const title = form?.elements?.title;
    const iso = parseShopDateInput(el.value);
    syncClearDateButton(el);
    if (title && isMenuShopAutoTitle(title.value)) title.value = menuShopAutoTitle(iso);
    return;
  }

  if (action === "list-date") {
    const list = state.shopLists.find((l) => l.id === el.getAttribute("data-list"));
    const iso = parseShopDateInput(el.value);
    if (!list) return;
    list.date = iso;
    if (iso) {
      for (const c of state.priceCatalog) for (const e of c.history || []) if (e.listId === list.id) e.date = iso;
      state.priceCatalog = normalizeCatalog(state.priceCatalog);
      setShopCalFromDate(iso);
    }
    save();
    render();
    return;
  }
  if (action === "menu-date") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(el.value)) {
      ui.menuDate = el.value;
      render();
    }
    return;
  }
  if (el.classList?.contains("slot-name") && role !== "helper") {
    applySlotNames();
    save();
    return;
  }
  if (el.getAttribute("data-role") === "recipe-photo-input" && el.files?.[0]) {
    try {
      const files = [...el.files].filter(Boolean);
      const photos = currentRecipePhotos();
      const replaceAt = Number.isInteger(ui.recipePhotoReplace) ? ui.recipePhotoReplace : null;
      for (let i = 0; i < files.length; i++) {
        const dataUrl = await compressImageFile(files[i], { maxSize: 1280, quality: 0.7 });
        if (i === 0 && replaceAt != null && replaceAt >= 0 && replaceAt < photos.length) photos[replaceAt] = dataUrl;
        else if (photos.length < MAX_RECIPE_PHOTOS) photos.push(dataUrl);
      }
      setRecipePhotos(photos);
      ui.recipePhotoReplace = null;
      render();
    } catch (err) {
      toast(err.message || tr("toast.photoFailed"));
    }
    return;
  }
  if (el.name === "recipeId" && el.closest("#dish-form")) {
    const textEl = document.querySelector("#dish-form [name=text]");
    const r = allRecipes(state.recipes).find((x) => x.id === el.value);
    if (textEl && r && !textEl.value.trim()) textEl.value = recipeName(r);
    const hint = document.querySelector("[data-dish-hint]");
    if (hint) hint.innerHTML = dishHintHtml(el.value, document.getElementById("dish-form")?.getAttribute("data-date") || today());
    return;
  }
  if (action === "employer-name") {
    state.settings.employerName = el.value.trim().slice(0, 80);
    save();
    return;
  }
  if (el.hasAttribute("data-doc-input")) {
    const type = el.getAttribute("data-doc-input");
    const files = Array.from(el.files || []);
    el.value = "";
    if (!ui.docDraft || !DOC_TYPES.includes(type)) return;
    let failed = "";
    for (const f of files) {
      if (ui.docDraft[type].length >= MAX_DOC_FILES) {
        failed = tr("doc.max", { n: MAX_DOC_FILES });
        break;
      }
      try {
        ui.docDraft[type].push(await readDocFile(f));
      } catch (err) {
        failed = err?.message || tr("doc.readFail");
      }
    }
    if (failed) toast(failed);
    else render();
    return;
  }
  if (action === "toggle-share-docs") {
    ui.shareDocs = el.checked;
    render();
    return;
  }
  if (action === "toggle-gh") {
    const h = helper();
    if (!h) return;
    h.grantGeneralHolidays = el.checked;
    save();
    render();
    return;
  }
  if (action === "winter-choice") {
    const h = helper();
    if (!h) return;
    h.winterChoice = el.value;
    save();
    render();
    return;
  }
  if (action === "add-rest-date") {
    const h = helper();
    const iso = String(el.value || "");
    if (!h || !iso) return;
    const already = arrangedRestList(state, h.id).includes(iso);
    if (!already) toggleArrangedRestDay(state, h.id, iso);
    const d = parseISO(iso);
    if (d) {
      ui.year = d.getFullYear();
      ui.month = d.getMonth();
    }
    save();
    toast(already ? tr("toast.alreadyRest") : tr("toast.restAdded"));
    render();
    return;
  }
  if (action === "toggle-notify") {
    await toggleNotify(el.checked);
    return;
  }
  if (action === "guide-check") {
    state.guideChecks[el.getAttribute("data-id")] = el.checked;
    save();
    return;
  }
  if (action === "do-import" && el.files?.[0]) {
    const text = await el.files[0].text();
    try {
      state = importBackup(text);
      save();
      toast(tr("toast.restored"));
      setTab("home");
    } catch (err) {
      toast(err.message || tr("toast.restoreFailed"));
    }
    return;
  }
  if (el.getAttribute("data-role") === "photo-input" && el.files?.[0]) {
    try {
      const dataUrl = await compressImageFile(el.files[0]);
      const hidden = document.querySelector("#shop-item-form [name=photo]");
      if (hidden) hidden.value = dataUrl;
      const btn = document.querySelector("[data-action=pick-photo]");
      if (btn) btn.innerHTML = `<img src="${dataUrl}" alt="">`;
    } catch (err) {
      toast(err.message || tr("toast.photoFailed"));
    }
    return;
  }
  if (action === "h-item-tick-group") {
    const p = sessionPayload();
    if (!p) return;
    const parent = (p.shopItems || []).find((i) => i.id === el.getAttribute("data-id"));
    if (!parent) return;
    const on = el.checked;
    parent.bought = on;
    for (const it of p.shopItems) if (it.parentId === parent.id) it.bought = on;
    persistSessionPayload();
    writeShopBackToEmployer();
    refreshShopDom(el);
    return;
  }
  if (action === "h-item-bought" || action === "h-item-price") {
    const p = sessionPayload();
    if (!p) return;
    const item = (p.shopItems || []).find((i) => i.id === el.getAttribute("data-id"));
    if (!item) return;
    if (action === "h-item-bought") {
      item.bought = el.checked;
      if (item.parentId) {
        const kids = (p.shopItems || []).filter((i) => i.parentId === item.parentId);
        const parent = (p.shopItems || []).find((i) => i.id === item.parentId);
        if (parent) parent.bought = kids.length > 0 && kids.every((k) => k.bought);
      }
      refreshShopDom(el);
    }
    if (action === "h-item-price") item.paidPrice = el.value === "" ? "" : Number(el.value);
    persistSessionPayload();
    writeShopBackToEmployer();
    return;
  }
  if (action === "item-tick-group" && role !== "helper") {
    const parent = state.shopItems.find((i) => i.id === el.getAttribute("data-id"));
    if (!parent) return;
    const on = el.checked;
    parent.bought = on;
    for (const it of state.shopItems) if (it.parentId === parent.id) it.bought = on;
    save();
    refreshShopDom(el);
    return;
  }
  if (action === "item-tick" && role !== "helper") {
    const item = state.shopItems.find((i) => i.id === el.getAttribute("data-id"));
    if (!item) return;
    item.bought = el.checked;
    if (item.parentId) {
      const kids = state.shopItems.filter((i) => i.parentId === item.parentId);
      const parent = state.shopItems.find((i) => i.id === item.parentId);
      if (parent) parent.bought = kids.length > 0 && kids.every((k) => k.bought);
    }
    save();
    refreshShopDom(el);
    return;
  }
  if (action === "recent-days" && role !== "helper") {
    state.settings.recentBuyDays = RECENT_CHOICES.includes(Number(el.value)) ? Number(el.value) : 7;
    save();
    render();
    return;
  }
  if (action === "diet-toggle" && role !== "helper") {
    const key = el.getAttribute("data-key");
    state.settings.diet = { ...normalizeDiet(state.settings.diet), [key]: el.checked };
    state.settings.diet = normalizeDiet(state.settings.diet);
    save();
    ui.dietOpen = true;
    render();
    return;
  }
  if (action === "cook-tick") {
    const rid = el.getAttribute("data-rid");
    const n = Number(el.getAttribute("data-i"));
    const cur = new Set(ui.cookTicks[rid] || []);
    if (el.checked) cur.add(n);
    else cur.delete(n);
    ui.cookTicks[rid] = Array.from(cur);
    return;
  }
  if (el.name === "rpick") {
    const n = document.querySelectorAll("input[name=rpick]:checked").length;
    const c = document.querySelector("[data-pick-count]");
    if (c) c.textContent = tr("shop.pick.count", { n });
    return;
  }
}

function onSubmit(ev) {
  const form = ev.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (form.getAttribute("id") === "helper-form") {
    ev.preventDefault();
    const data = collectHelperForm(form);
    if (!data.name) return toast(tr("toast.needName"));
    if (!data.startDate) return toast(tr("toast.needStart"));
    const prevHelpers = state.helpers.slice();
    const prevCurrent = state.currentHelperId;
    const idx = state.helpers.findIndex((x) => x.id === data.id);
    if (idx >= 0) state.helpers[idx] = { ...state.helpers[idx], ...data };
    else state.helpers.push(data);
    state.currentHelperId = data.id;
    if (!save()) {
      state.helpers = prevHelpers;
      state.currentHelperId = prevCurrent;
      return;
    }
    ui.docDraft = null;
    if (isArrangedRestPolicy(data.restDay)) {
      ui.leavePane = "rest";
      setTab("home");
      toast(tr("toast.savedArranged"));
    } else {
      setTab("home");
      toast(tr("toast.saved"));
    }
  }
  if (form.getAttribute("id") === "leave-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    const start = String(fd.get("startDate") || "");
    const end = String(fd.get("endDate") || start);
    if (!start) return toast(tr("toast.pickDate"));
    const days = Math.max(1, daysBetween(start, end) + 1);
    state.leaveLogs.push(
      newLeaveLog({
        helperId: helper().id,
        type: String(fd.get("type") || "annual"),
        startDate: start,
        endDate: end,
        days,
        note: String(fd.get("note") || ""),
      })
    );
    save();
    ui.sheet = null;
    toast(tp("toast.leaveLogged", days));
    render();
  }
  if (form.getAttribute("id") === "pay-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    state.payments.push(
      newPayment({
        helperId: helper().id,
        month: String(fd.get("month") || ""),
        wage: Number(fd.get("wage") || 0),
        food: Number(fd.get("food") || 0),
        adjustments: Number(fd.get("adjustments") || 0),
        paidOn: String(fd.get("paidOn") || ""),
        method: String(fd.get("method") || ""),
        note: String(fd.get("note") || ""),
      })
    );
    save();
    ui.sheet = null;
    toast(tr("toast.payLogged"));
    render();
  }
  if (form.getAttribute("id") === "reminder-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    const title = String(fd.get("title") || "").trim();
    const date = String(fd.get("date") || "");
    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return toast(tr("remind.err"));
    const id = form.getAttribute("data-id");
    const fields = {
      title,
      date,
      repeat: ["monthly", "yearly"].includes(String(fd.get("repeat"))) ? String(fd.get("repeat")) : "none",
      anchorDay: Number(date.slice(8, 10)),
      helperId: String(fd.get("rhelper") || ""),
      note: String(fd.get("note") || "").trim(),
    };
    const idx = state.customReminders.findIndex((r) => r.id === id);
    if (idx >= 0) {
      state.customReminders[idx] = { ...state.customReminders[idx], ...fields };
      delete state.reminderState[`custom:${id}`];
    } else {
      state.customReminders.push(newCustomReminder({ id, ...fields }));
    }
    if (!save()) return;
    ui.sheet = null;
    toast(tr("remind.saved"));
    render();
    return;
  }
  if (form.getAttribute("id") === "dish-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    const date = form.getAttribute("data-date");
    const editId = form.getAttribute("data-id");
    const slotId = String(fd.get("slot") || "");
    const recipeId = allRecipes(state.recipes).some((r) => r.id === String(fd.get("recipeId"))) ? String(fd.get("recipeId")) : "";
    const text = String(fd.get("text") || "").trim().slice(0, 80);
    if (!text && !recipeId) return toast(tr("menu.dish.err"));
    if (!state.menu.slots.some((s) => s.id === slotId)) return;
    const rec = newDish({ text, recipeId, note: String(fd.get("note") || "").trim().slice(0, 120) });
    const day = (state.menu.days[date] = state.menu.days[date] || {});
    let placed = false;
    if (editId) {
      for (const k of Object.keys(day)) {
        const i = day[k].findIndex((d) => d.id === editId);
        if (i < 0) continue;
        rec.id = editId;
        if (k === slotId) {
          day[k][i] = rec;
          placed = true;
        } else {
          day[k].splice(i, 1);
        }
      }
    }
    if (!placed) {
      day[slotId] = [...(day[slotId] || []), rec].slice(-MAX_DISHES_PER_SLOT);
    }
    pruneDay(state.menu, date);
    ui.menuDate = date;
    if (!save()) return;
    ui.sheet = null;
    toast(tr("menu.dish.saved"));
    return;
  }
  if (form.getAttribute("id") === "copy-form") {
    ev.preventDefault();
    const from = form.getAttribute("data-from");
    const to = String(new FormData(form).get("to") || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(to) || to === from) return toast(tr("menu.copy.same"));
    const n = copyDay(state.menu, from, to);
    if (!n) return toast(tr("menu.copy.nothing"));
    ui.menuDate = to;
    if (!save()) return;
    ui.sheet = null;
    toast(tr("menu.copy.done", { n, date: formatDate(to, { short: true }) }));
    return;
  }
  if (form.getAttribute("id") === "slot-add-form") {
    ev.preventDefault();
    applySlotNames();
    const name = String(new FormData(form).get("name") || "").trim().slice(0, 20);
    if (!name) return toast(tr("menu.slots.needName"));
    if (state.menu.slots.length >= MAX_SLOTS) return toast(tr("menu.slots.max"));
    state.menu.slots.push({ id: uid("slot"), key: "", name });
    ui.slotArm = "";
    save();
    render();
    return;
  }
  if (form.getAttribute("id") === "web-recipe-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    const url = normalizeSourceUrl(fd.get("sourceUrl"));
    if (!url) return toast(tr("recipe.web.badUrl"));
    const paste = String(fd.get("paste") || "");
    const parsed = parseRecipeText(paste);
    const name = String(fd.get("name") || "").trim() || parsed.name;
    const isEn = !/[\u3400-\u9fff]/.test(name);
    ui.recipeDraft = newRecipe({
      nameZh: isEn ? "" : name,
      nameEn: isEn ? name : "",
      name,
      ingredients: parsed.ingredients,
      steps: parsed.steps,
      tips: parsed.tips,
      sourceUrl: url,
      photos: currentRecipePhotos(),
      photo: currentRecipePhotos()[0] || "",
    });
    ui.sheet = { type: "recipe", draft: true };
    render();
    toast(parsed.ingredients.length || parsed.steps.length ? tr("recipe.web.parsed", { i: parsed.ingredients.length, s: parsed.steps.length }) : tr("recipe.web.nothing"));
    return;
  }
  if (form.getAttribute("id") === "recipe-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    const nameZh = String(fd.get("nameZh") || "").trim().slice(0, 80);
    const nameEn = String(fd.get("nameEn") || "").trim().slice(0, 80);
    if (!nameZh && !nameEn) return toast(tr("recipe.err"));
    const id = form.getAttribute("data-id");
    const rows = (v, max) => String(v || "").split(/\r?\n/).map((x) => x.trim().slice(0, max)).slice(0, 80);
    const zl = rows(fd.get("ingZh"), 160);
    const el = rows(fd.get("ingEn"), 160);
    const ingredients = [];
    for (let i = 0; i < Math.max(zl.length, el.length); i++) {
      const z = zl[i] ? parseIngredient(zl[i]) : { name: "", qty: "" };
      const e = el[i] ? parseIngredient(el[i]) : { name: "", qty: "" };
      if (!z.name && !e.name) continue;
      ingredients.push({ zh: z.name, en: e.name, qty: z.qty || (z.name ? "" : ""), qtyEn: e.qty });
    }
    const sz = rows(fd.get("stepsZh"), 400);
    const se = rows(fd.get("stepsEn"), 400);
    const steps = [];
    for (let i = 0; i < Math.max(sz.length, se.length); i++) {
      if (sz[i] || se[i]) steps.push({ zh: sz[i] || "", en: se[i] || "" });
    }
    const tips = { zh: String(fd.get("tipsZh") || "").trim().slice(0, 800), en: String(fd.get("tipsEn") || "").trim().slice(0, 800) };
    const fields = {
      nameZh,
      nameEn,
      name: nameZh || nameEn,
      category: String(fd.get("category") || "other"),
      difficulty: String(fd.get("difficulty") || "easy"),
      prepMins: Number(fd.get("prepMins")) || 0,
      photo: currentRecipePhotos()[0] || "",
      photos: currentRecipePhotos(),
      servings: String(fd.get("servings") || "").trim().slice(0, 20),
      ingredients,
      steps,
      tips,
      notes: tips.zh,
      diet: fd.getAll("diet").map(String),
      tags: splitTags(fd.get("tags")),
      sourceUrl: normalizeSourceUrl(fd.get("sourceUrl")),
      updatedAt: new Date().toISOString(),
    };
    const prev = state.recipes.slice();
    const lib = isLibraryRecipeId(id);
    const extra = lib ? { id, overrideOf: id, copyOf: "" } : {};
    const idx = state.recipes.findIndex((r) => r.id === id || (lib && r.overrideOf === id));
    if (idx >= 0) state.recipes[idx] = { ...state.recipes[idx], ...fields, ...extra };
    else state.recipes.push(newRecipe({ id, no: lib ? 0 : nextRecipeNo(state.recipes), ...fields, ...extra }));
    state.recipes = normalizeRecipes(state.recipes);
    if (!save()) {
      state.recipes = prev;
      return;
    }
    ui.sheet = null;
    setRecipePhotos([]);
    ui.recipePhotoReplace = null;
    ui.recipeDraft = null;
    ui.recipeId = id;
    if (ui.tab !== "recipe") setTab("recipe");
    toast(tr("recipe.saved"));
    return;
  }
  if (form.getAttribute("id") === "recipe-shop-form") {
    ev.preventDefault();
    const h = helper();
    const r = allRecipes(state.recipes).find((x) => x.id === form.getAttribute("data-id"));
    if (!h || !r) return;
    const fd = new FormData(form);
    const picks = fd.getAll("ing").map(Number).filter((i) => r.ingredients[i]);
    if (!picks.length) return toast(tr("recipe.shop.pickSome"));
    let list = state.shopLists.find((l) => l.id === String(fd.get("list")));
    if (!list) {
      list = newShopList({ helperId: h.id, title: recipeName(r), place: "market", date: today() });
      state.shopLists.push(list);
    }
    const res = addRecipeIngredientsToList(list, r, picks.map((i) => r.ingredients[i]));
    if (!save()) return;
    ui.sheet = null;
    ui.shopListId = list.id;
    setShopCalFromDate(listDate(list));
    setTab("shop-detail");
    addResultToast(res, list);
    return;
  }
  if (form.getAttribute("id") === "gen-form") {
    ev.preventDefault();
    const h = helper();
    if (!h) return;
    const fd = new FormData(form);
    const days = fd.getAll("gday").map(String);
    if (!days.length) return toast(tr("menu.gen.pickDay"));
    const grouped = Boolean(form.elements.group?.checked);
    const recs = allRecipes(state.recipes);
    const entries = [];
    let noRecipe = 0;
    for (const date of days.sort()) {
      for (const slot of state.menu.slots) {
        for (const d of (state.menu.days[date] || {})[slot.id] || []) {
          const r = recs.find((x) => x.id === d.recipeId);
          if (!r) {
            noRecipe += 1;
            continue;
          }
          entries.push(...recipeEntries(r, grouped ? slotLabel(slot, tr) : ""));
        }
      }
    }
    if (!entries.length) return toast(tr("menu.gen.none"));
    const dateVal = parseShopDateInput(fd.get("date"));
    const list = newShopList({ helperId: h.id, title: String(fd.get("title") || "").trim() || menuShopAutoTitle(dateVal), place: "market", date: dateVal });
    state.shopLists.push(list);
    const byId = new Map();
    for (const e of entries) {
      const id = e.dish?.key;
      const r = recs.find((x) => x.id === id);
      if (!r) continue;
      if (!byId.has(id)) byId.set(id, { recipe: r, ingredients: [] });
      byId.get(id).ingredients.push(e.ing);
    }
    const res = addRecipeMapToList(list, byId.values());
    if (!save()) return;
    ui.sheet = null;
    ui.shopListId = list.id;
    ui.shopView = "list";
    setShopCalFromDate(dateVal);
    setTab("shop-detail");
    addResultToast(res, list);
    if (noRecipe) setTimeout(() => toast(tr("menu.gen.skipped", { n: noRecipe })), 3000);
    return;
  }
  if (form.getAttribute("id") === "list-recipes-form") {
    ev.preventDefault();
    const list = state.shopLists.find((l) => l.id === form.getAttribute("data-list"));
    const ids = new FormData(form).getAll("rpick").map(String);
    if (!list) return;
    if (!ids.length) return toast(tr("shop.pick.none"));
    const res = addRecipesToList(list, ids);
    if (!save()) return;
    ui.sheet = null;
    ui.shopListId = list.id;
    render();
    addResultToast(res, list);
    return;
  }
  if (form.getAttribute("id") === "consent-form") {
    ev.preventDefault();
    const err = document.getElementById("consent-err");
    const fail = (key) => {
      if (err) {
        err.textContent = tr(key);
        err.hidden = false;
      }
    };
    if (!form.elements.agree?.checked) return fail("consent.err.agree");
    if (!ui.sigData) return fail("consent.err.sign");
    const p = state.payments.find((x) => x.id === form.getAttribute("data-pay"));
    if (!p) return;
    const prev = p.consent;
    p.consent = { status: "confirmed", at: new Date().toISOString(), by: "in-person", signature: compressSignature() };
    if (!save()) {
      p.consent = prev;
      return;
    }
    ui.sheet = null;
    ui.sigData = "";
    toast(tr("consent.saved"));
    render();
    return;
  }
  if (form.getAttribute("id") === "sh-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    setShStatus(helper(), form.getAttribute("data-date"), {
      status: String(fd.get("status") || "pending"),
      lieuDate: String(fd.get("lieuDate") || ""),
      note: String(fd.get("note") || ""),
    });
    ui.sheet = null;
    toast(tr("toast.shSaved"));
    render();
  }
  if (form.getAttribute("id") === "task-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    const weekdays = [...form.querySelectorAll("[name=weekdays]:checked")].map((x) => Number(x.value));
    const rec = newWorkTask({
      id: form.getAttribute("data-id") || uid("task"),
      helperId: helper().id,
      title: String(fd.get("title") || "").trim(),
      detail: String(fd.get("detail") || "").trim(),
      schedule: String(fd.get("schedule") || "daily"),
      weekdays,
      onceDate: String(fd.get("onceDate") || ""),
      timeFrom: String(fd.get("timeFrom") || ""),
      timeTo: String(fd.get("timeTo") || ""),
      updatedAt: new Date().toISOString(),
    });
    if (!rec.title) return toast(tr("toast.needTaskName"));
    const idx = state.workTasks.findIndex((t) => t.id === rec.id);
    if (idx >= 0) state.workTasks[idx] = { ...state.workTasks[idx], ...rec };
    else state.workTasks.push(rec);
    save();
    ui.sheet = null;
    toast(tr("toast.taskSaved"));
    render();
  }
  if (form.getAttribute("id") === "rule-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    const rec = newWorkRule({
      id: form.getAttribute("data-id") || uid("rule"),
      helperId: helper().id,
      title: String(fd.get("title") || "").trim(),
      body: String(fd.get("body") || "").trim(),
      updatedAt: new Date().toISOString(),
    });
    if (!rec.title || !rec.body) return toast(tr("toast.needRuleFields"));
    const idx = state.workRules.findIndex((r) => r.id === rec.id);
    if (idx >= 0) state.workRules[idx] = { ...state.workRules[idx], ...rec };
    else state.workRules.push(rec);
    save();
    ui.sheet = null;
    toast(tr("toast.ruleSaved"));
    render();
  }
  if (form.getAttribute("id") === "shop-list-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    const rec = newShopList({
      helperId: helper().id,
      title: String(fd.get("title") || "").trim(),
      place: String(fd.get("place") || "market"),
      note: String(fd.get("note") || "").trim(),
      date: parseShopDateInput(fd.get("date")),
    });
    state.shopLists.push(rec);
    const picks = fd.getAll("rpick").map(String);
    const res = picks.length ? addRecipesToList(rec, picks) : null;
    setShopCalFromDate(rec.date);
    save();
    ui.sheet = null;
    ui.shopListId = rec.id;
    setTab("shop-detail");
    if (res) addResultToast(res, rec);
    else toast(tr("toast.listCreated"));
  }
  if (form.getAttribute("id") === "shop-item-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    const listId = form.getAttribute("data-list");
    const rec = newShopItem({
      id: form.getAttribute("data-id") || uid("item"),
      listId,
      helperId: helper().id,
      name: String(fd.get("name") || "").trim(),
      note: String(fd.get("note") || "").trim(),
      qty: String(fd.get("qty") || "").trim(),
      photo: String(fd.get("photo") || ""),
      bought: form.elements.bought?.checked,
      paidPrice: String(fd.get("paidPrice") || "") === "" ? "" : Number(fd.get("paidPrice")),
      suggestedPrice: null,
    });
    const priceEl = form.elements.paidPrice;
    if (priceEl?.dataset.autofilled === "1" && !rec.bought && rec.paidPrice !== "") {
      // pre-filled from last price but not bought yet: keep as a suggestion only
      rec.suggestedPrice = rec.paidPrice;
      rec.paidPrice = "";
    }
    if (!rec.name) return toast(tr("toast.needItemName"));
    const idx = state.shopItems.findIndex((i) => i.id === rec.id);
    if (idx >= 0) state.shopItems[idx] = { ...state.shopItems[idx], ...rec };
    else state.shopItems.push(rec);
    if (rec.paidPrice !== "" && rec.paidPrice != null) {
      const list = state.shopLists.find((l) => l.id === listId);
      recordCatalogPrice(state, rec.name, rec.paidPrice, (list && listDate(list)) || today(), list?.place || "", { listId, itemId: rec.id });
    } else {
      removeCatalogEntry(state, rec.id);
    }
    save();
    ui.sheet = null;
    toast(tr("toast.itemAdded"));
    render();
  }
  if (form.getAttribute("id") === "helper-unlock") {
    ev.preventDefault();
    unlockHelper(form);
  }
}

/** Keep what the helper did on this phone (purchase ticks) when a newer snapshot arrives. */
function mergeHelperLocal(old, nw) {
  const out = { ...nw };
  const oldById = new Map((old.shopItems || []).map((i) => [i.id, i]));
  out.shopItems = (nw.shopItems || []).map((i) => {
    const o = oldById.get(i.id);
    if (!o) return i;
    const next = { ...i };
    if (o.bought && !i.bought) next.bought = true;
    if ((next.paidPrice === "" || next.paidPrice == null) && o.paidPrice !== "" && o.paidPrice != null) next.paidPrice = o.paidPrice;
    return next;
  });
  if (old.helper && nw.helper) {
    const keep = {};
    if (!nw.helper.docs && old.helper.docs) keep.docs = old.helper.docs;
    if (!nw.helper.passportNo && old.helper.passportNo) keep.passportNo = old.helper.passportNo;
    if (!nw.helper.hkidNo && old.helper.hkidNo) keep.hkidNo = old.helper.hkidNo;
    out.helper = { ...nw.helper, ...keep };
  }
  return out;
}

/** Decide whether a decrypted snapshot replaces the stored one. Older snapshots never overwrite newer data. */
function finishOpen(payload, pin) {
  const cur = helperSession?.payload;
  const sameHelper = cur?.helper?.id && cur.helper.id === payload.helper.id;
  const newer = String(payload.generatedAt || "") > String(cur?.generatedAt || "");
  const sameStamp = String(payload.generatedAt || "") === String(cur?.generatedAt || "");
  let result = "new";
  if (sameHelper) {
    if (!newer) {
      result = sameStamp ? "same" : "older";
      if (pin && helperSession && helperSession.pin !== pin && sameStamp) {
        helperSession = { ...helperSession, pin };
        saveSession(helperSession);
      }
    } else {
      helperSession = { payload: mergeHelperLocal(cur, payload), unlockedAt: new Date().toISOString(), pin, updatedAt: new Date().toISOString() };
      saveSession(helperSession);
      result = "updated";
    }
  } else {
    helperSession = { payload, unlockedAt: new Date().toISOString(), pin };
    saveSession(helperSession);
  }
  setRole("helper");
  ui.pendingShare = "";
  ui.pinError = "";
  if (location.hash.startsWith("#/v/")) history.replaceState(null, "", "#/h");
  ui.tab = "h";
  location.hash = "#/h";
  const name = helperSession.payload.helper.name || tr("toast.yourData");
  if (result === "updated") toast(tr("update.helper.done", { when: fmtDateTime(helperSession.payload.generatedAt) }));
  else if (result === "same") toast(tr("update.helper.same"));
  else if (result === "older") toast(tr("update.helper.older", { when: fmtDateTime(cur.generatedAt) }));
  else toast(tr("toast.opened", { name }));
  render();
  return result;
}

async function autoUpdateFromLink(packed) {
  try {
    const payload = await decryptShare(packed, helperSession.pin);
    if (!payload?.helper) return;
    finishOpen(payload, helperSession.pin);
  } catch {
    /* different PIN: the PIN form stays open */
  }
}

async function unlockHelper(form) {
  const fd = new FormData(form);
  const pin = String(fd.get("pin") || "").trim();
  let packed = String(fd.get("packed") || "").trim() || ui.pendingShare;
  ui.pinError = "";
  if (!/^\d{6}$/.test(pin)) {
    ui.pinError = "pin.err.format";
    render();
    return;
  }
  const tries = [];
  if (packed) tries.push(packed);
  for (const item of loadInbox()) {
    if (item.packed && !tries.includes(item.packed)) tries.push(item.packed);
  }
  if (!tries.length) {
    ui.pinError = "pin.err.none";
    render();
    return;
  }
  let newest = null;
  for (const pack of tries) {
    try {
      const payload = await decryptShare(pack, pin);
      if (!payload?.helper) continue;
      if (!newest || String(payload.generatedAt || "") > String(newest.generatedAt || "")) newest = payload;
    } catch {
      /* try next */
    }
  }
  if (newest) {
    finishOpen(newest, pin);
    return;
  }
  ui.pinError = "pin.err.wrong";
  render();
}

function doExport() {
  const { blob, filename } = exportBackup(state);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(tr("toast.exported"));
}

async function toggleNotify(on) {
  if (!("Notification" in window)) {
    toast(tr("toast.noNotify"));
    state.settings.notifications = false;
    save();
    render();
    return;
  }
  if (!on) {
    state.settings.notifications = false;
    save();
    render();
    return;
  }
  const perm = await Notification.requestPermission();
  state.settings.notifications = perm === "granted";
  save();
  if (perm === "granted") {
    try {
      new Notification(tr("app.name"), { body: tr("notify.enabledBody"), lang: getLang() === "en" ? "en" : "zh-HK" });
    } catch {
      /* ignore */
    }
    toast(tr("toast.notifyOn"));
  } else {
    toast(tr("toast.notifyDenied"));
  }
  render();
}

function maybeNotify() {
  if (!state.settings.notifications || !("Notification" in window) || Notification.permission !== "granted") return;
  const t = today();
  const key = `fdh-notified-${t}`;
  if (sessionStorage.getItem(key)) return;
  const items = mergeReminders(
    state.helpers.flatMap((h) => buildReminders(h, t, { arrangedRestDays: arrangedFor(h) })),
    buildCustomReminders(state.customReminders, state.helpers, t).filter((r) => r.date <= t)
  ).filter((r) => isReminderVisible(r, state.reminderState, t) && ["expired", "critical", "soon"].includes(r.urgency));
  if (!items.length) return;
  sessionStorage.setItem(key, "1");
  try {
    new Notification(tr("app.name"), { body: items[0].title, lang: getLang() === "en" ? "en" : "zh-HK" });
  } catch {
    /* ignore */
  }
}

function registerSW() {
  try {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol === "file:") return;
    const opts = { updateViaCache: "none" };
    Promise.resolve(navigator.serviceWorker.register("./sw.js", opts)).catch(() => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  } catch {
    /* ignore */
  }
}

let titleBeforePrint = "";
window.addEventListener("beforeprint", () => {
  if (!ui.payslipId) return;
  titleBeforePrint = document.title;
  const h = helper();
  const p = state.payments.find((x) => x.id === ui.payslipId);
  document.title = `${tr("payslip.title")}-${h?.name || ""}-${p?.month || ""}`;
});
window.addEventListener("afterprint", () => {
  if (titleBeforePrint) document.title = titleBeforePrint;
  titleBeforePrint = "";
});
window.addEventListener("hashchange", () => {
  parseHash();
  render();
});
document.addEventListener("click", onClick);
document.addEventListener("change", onChange);
document.addEventListener("submit", onSubmit);
initSwipe();

/** PWA share target: ?title=&text=&url= from the OS share sheet opens the "add from web" sheet. */
function consumeShareTarget() {
  const q = new URLSearchParams(location.search);
  if (!(q.has("url") || q.has("text") || q.has("title"))) return;
  const title = q.get("title") || "";
  const text = q.get("text") || "";
  const url = normalizeSourceUrl(q.get("url") || findUrl(text) || findUrl(title));
  history.replaceState(null, "", `${location.pathname}#/recipes`);
  if (role !== "employer" || !state.helpers.length) return;
  const body = text.replace(/https?:\/\/\S+/gi, "").trim();
  ui.pendingWeb = { name: title.replace(/https?:\/\/\S+/gi, "").trim().slice(0, 80), url, text: body };
}

try {
  consumeShareTarget();
  parseHash();
  if (ui.pendingWeb) {
    ui.tab = "recipes";
    ui.sheet = { type: "web-recipe", prefill: ui.pendingWeb };
    ui.pendingWeb = null;
  }
  applyDocumentLang();
  if (!role && ui.tab !== "h-enter") ui.tab = "role";
  if (role === "employer" && !state.helpers.length && !["helper-new", "onboard", "role"].includes(ui.tab)) ui.tab = "onboard";
  if (role === "helper" && !sessionHelper() && ui.tab !== "role") ui.tab = "h-enter";
  render();
} catch (err) {
  console.error(err);
  bootError(err);
}
try {
  registerSW();
} catch {
  /* ignore */
}
try {
  maybeNotify();
} catch (err) {
  console.warn(err);
}
