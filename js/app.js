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
} from "./data.js?v=9";
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
} from "./dates.js?v=9";
import { escapeHtml, icon } from "./icons.js?v=9";
import {
  buildReminders,
  isReminderVisible,
  reminderBadgeCount,
  snoozeUntil,
} from "./reminders.js?v=9";
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
} from "./rules.js?v=9";
import {
  arrangedRestList,
  currentHelper,
  demoHelper,
  emptyState,
  exportBackup,
  findCatalog,
  importBackup,
  loadState,
  normalizeHelperForm,
  newLeaveLog,
  newPayment,
  newShopItem,
  newShopList,
  newWorkRule,
  newWorkTask,
  recordCatalogPrice,
  saveState,
  shKey,
  toggleArrangedRestDay,
  uid,
} from "./storage.js?v=9";
import {
  ACK_KEY,
  buildSharePayload,
  compressImageFile,
  decryptShare,
  encryptShare,
  isAcked,
  isTaskDone,
  loadInbox,
  loadRole,
  loadSession,
  parseShareHash,
  randomPin,
  receiptPayload,
  removeInbox,
  saveRole,
  saveSession,
  setAcked,
  setTaskDone,
  shareUrl,
  upsertInbox,
} from "./share.js?v=9";
import { LANGS, applyDocumentLang, getLang, pick, setLang, t as tr, tp } from "./i18n.js?v=9";

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
};

function today() {
  return todayISO();
}

function save() {
  saveState(state);
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
  if (!String(tab).startsWith("shop")) ui.shopListId = String(tab).includes("shop-detail") ? ui.shopListId : ui.shopListId;
  if ((tab === "shop-detail" || tab === "h-shop-detail") && ui.shopListId) {
    location.hash = `#/${tab}/${ui.shopListId}`;
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
  "h-pay",
  "h-remind",
  "h-rights",
  "h-more",
  "h-enter",
]);

function parseHash() {
  const raw = (location.hash || "").replace(/^#\/?/, "");
  const incoming = parseShareHash(location.hash);
  if (incoming) {
    ui.pendingShare = incoming;
    role = "helper";
    ui.tab = "h-enter";
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
    return;
  }
  if (EMPLOYER_ROUTES.has(tab)) {
    ui.tab = tab;
    if (tab === "shop-detail" && extra) ui.shopListId = extra;
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
  return reminderBadgeCount(state.helpers, state.reminderState, today(), arrangedMap());
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
  const count = role === "employer" ? badgeCount() : helperReminderList().filter((r) => isReminderVisible(r, {}, today())).length;
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

const NAV_HIDDEN = ["role", "onboard", "helper-new", "helper-edit", "h-enter"];

function sidebar() {
  if (NAV_HIDDEN.includes(ui.tab)) return "";
  const items =
    role === "helper"
      ? [
          ["h", "tab.mine", "home"],
          ["h-leave", "tab.leave", "leaf"],
          ["h-tasks", "tab.tasks", "checklist"],
          ["h-rules", "tab.rules", "rule"],
          ["h-shop", "shop.title", "basket"],
          ["h-pay", "pay.title", "coin"],
          ["h-remind", "home.reminders", "bell"],
          ["h-more", "tab.more", "more"],
        ]
      : [
          ["home", "tab.home", "home"],
          ["leave", "tab.leave", "leaf"],
          ["tasks", "tab.tasks", "checklist"],
          ["rules", "tab.rules", "rule"],
          ["shop", "shop.title", "basket"],
          ["pay", "pay.title", "coin"],
          ["remind", "home.reminders", "bell"],
          ["share", "share.title", "share"],
          ["guide", "more.guide", "doc"],
          ["backup", "backup.title", "download"],
        ];
  const cur = ui.tab === "shop-detail" ? "shop" : ui.tab === "h-shop-detail" ? "h-shop" : ui.tab === "more" ? "home" : ui.tab === "h-more" || ui.tab === "h-rights" ? "h-more" : ui.tab;
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
            ([id, key, ic]) =>
              `<button type="button" class="side-link" data-go="${id}" aria-current="${cur === id ? "page" : "false"}">${icon(ic, { size: 19 })}<span>${tr(key)}</span></button>`
          )
          .join("")}
        <button type="button" class="side-link" data-go="${role === "helper" ? "h-more" : "more"}" aria-current="${ui.tab === "more" || ui.tab === "h-more" ? "page" : "false"}">${icon("more", { size: 19 })}<span>${tr("tab.more")}</span></button>
      </nav>
      <div class="side-bottom">
        ${langSwitch()}
        <p><strong>${tr("sidebar.privacy.title")}</strong>${tr("sidebar.privacy.body")}</p>
      </div>
    </aside>
  `;
}

function tabbar() {
  const hidden = ["role", "onboard", "helper-new", "helper-edit", "h-enter"];
  if (hidden.includes(ui.tab)) return "";
  const tabs = role === "helper" ? HELPER_TABS : EMPLOYER_TABS;
  const count = role === "employer" ? badgeCount() : 0;
  const moreIds = role === "helper"
    ? ["h-more", "h-pay", "h-remind", "h-rights", "h-shop", "h-shop-detail"]
    : ["more", "guide", "backup", "pay", "remind", "share", "shop", "shop-detail"];
  return `
    <nav class="tabbar" aria-label="${tr("aria.mainTabs")}">
      ${tabs
        .map((t) => {
          const current =
            ui.tab === t.id ||
            (t.id === "more" && moreIds.includes(ui.tab) && role === "employer") ||
            (t.id === "h-more" && moreIds.includes(ui.tab) && role === "helper") ||
            (t.id === "leave" && ui.tab === "leave") ||
            (t.id === "h" && ui.tab === "h");
          const badge = t.id === "more" && count ? `<span class="badge">${count > 9 ? "9+" : count}</span>` : "";
          return `<button class="tab-btn" type="button" data-go="${t.id}" aria-current="${current ? "page" : "false"}">
            <span class="icon-wrap">${icon(t.icon, { size: 22 })}${badge}</span>
            ${tr(t.labelKey)}
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
        <span class="event-txt"><strong>${escapeHtml(r.title)}</strong><span>${escapeHtml(r.body || "")}</span></span>
      </button>`
    )
    .join("")}</div>`;
}

function detailRow(k, v) {
  return `<div class="detail-row"><span>${k}</span><strong>${v}</strong></div>`;
}

function viewHome() {
  const h = helper();
  if (!h) return emptyHelperPrompt(tr("home.empty.title"));
  const t = today();
  const cs = contractStatus(h, t);
  const start = h.contractStart || h.startDate;
  const paidFrom = paidStatutoryStart(h.startDate || h.contractStart);
  const vest = annualLeaveVestDate(h.startDate || h.contractStart);
  const reminders = buildReminders(h, t, { arrangedRestDays: arrangedFor(h) }).filter((r) =>
    isReminderVisible(r, state.reminderState, t)
  );
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

  return `
    ${helperSwitcher()}
    ${installTip()}
    <section class="welcome">
      <div>
        <div class="eyebrow">${tr(greetingKey())} · ${tr("home.eyebrow")}</div>
        <h1 class="screen-title">${escapeHtml(h.name)}</h1>
        <p class="lede">${nationalityLabel(h.nationality)}　${restValue}　${tr("home.monthlyWage")} ${formatMoney(h.wage)}</p>
      </div>
      <button class="btn" type="button" data-go="helper-edit">${icon("plus", { size: 16 })}${tr("common.editData")}</button>
    </section>

    <section class="stat-grid">
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
    </section>

    <section class="grid2">
      <div class="panel">
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
      </div>
      <div class="panel">
        <div class="panel-title"><h2>${tr("home.reminders")}</h2><button class="linkish" type="button" data-go="remind">${tr("common.all")}</button></div>
        ${timelineHtml(reminders.slice(0, 4), "remind")}
      </div>
    </section>

    <section class="panel">
      <div class="panel-title">
        <div><h2>${tr("home.holidays.title", { year })}</h2><span class="sub">${tr("home.holidays.sub")}</span></div>
        <div class="year-bar">
          ${YEARS.map((y) => `<button class="chip small ${year === y ? "is-on" : ""}" type="button" data-year="${y}" aria-pressed="${year === y}">${y}</button>`).join("")}
          <button class="btn secondary small" type="button" data-action="open-leave" data-leave-pane="holidays">${tr("home.holidays.full")}</button>
        </div>
      </div>
      ${holidayTiles(yearList)}
    </section>

    <section class="section">
      <div class="section-head"><h2>${tr("home.tellHelper")}</h2></div>
      ${entryCards(h, "")}
    </section>

    <div class="btn-row">
      <button class="btn" type="button" data-go="share">${tr("share.generate")}</button>
      <button class="btn secondary" type="button" data-go="helper-edit">${tr("common.editData")}</button>
    </div>
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

function monthGrid(year, month, marks, interactive) {
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
    ]
      .filter(Boolean)
      .join(" ");
    const label = `${iso}${mark.rest ? tr("cal.aria.rest") : ""}${mark.sh ? tr("cal.aria.sh") : ""}${mark.annual ? tr("cal.aria.annual") : ""}`;
    if (interactive) {
      cells.push(
        `<button class="${cls}" type="button" data-action="cal-day" data-date="${iso}" aria-label="${label}">${d}</button>`
      );
    } else {
      cells.push(`<div class="${cls}" aria-label="${label}">${d}</div>`);
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
                  return `<div class="row">
                    <div class="grow">
                      <div class="title">${escapeHtml(typ)}${tr("log.sep")}${tp("unit.days", l.days)}</div>
                      <div class="sub">${formatDate(l.startDate, { short: true })}${l.endDate && l.endDate !== l.startDate ? tr("range.sep") + formatDate(l.endDate, { short: true }) : ""}${l.note ? tr("log.sep") + escapeHtml(l.note) : ""}</div>
                    </div>
                    <button class="icon-btn" type="button" data-action="leave-del" data-id="${l.id}" aria-label="${tr("common.delete")}">${icon("close", { size: 18 })}</button>
                  </div>`;
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
        ${
          pays.length
            ? pays
                .map((p) => {
                  const sum = Number(p.wage || 0) + Number(p.food || 0) + Number(p.adjustments || 0);
                  return `<div class="row">
                    <div class="grow">
                      <div class="title">${escapeHtml(p.month || "—")}${tr("log.sep")}${formatMoney(sum)}</div>
                      <div class="sub">${p.paidOn ? formatDate(p.paidOn, { short: true }) : tr("pay.noPaidOn")}${p.note ? tr("log.sep") + escapeHtml(p.note) : ""}</div>
                    </div>
                    <button class="icon-btn" type="button" data-action="pay-del" data-id="${p.id}" aria-label="${tr("common.delete")}">${icon("close", { size: 18 })}</button>
                  </div>`;
                })
                .join("")
            : `<p class="muted" style="margin:0">${tr("pay.none")}</p>`
        }
      </div>
    </section>
    <p class="tiny muted">${tr("pay.mawHistory", { list: MAW_HISTORY.map((m) => tr("pay.mawFrom", { date: displayISO(m.effectiveFrom), wage: formatMoney(m.wage) })).join(tr("semi")) })}</p>
    ${disclaimer()}
  `;
}

function viewRemind() {
  const h = helper();
  if (!h) return emptyHelperPrompt(tr("leave.empty.title"));
  const t = today();
  const all = state.helpers.flatMap((x) => buildReminders(x, t, { arrangedRestDays: arrangedFor(x) }));
  const visible = all.filter((r) => isReminderVisible(r, state.reminderState, t));
  const hidden = all.filter((r) => !isReminderVisible(r, state.reminderState, t));
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">${tr("home.reminders")}</h1>
    <p class="lede">${tr("remind.lede")}</p>
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
                  (r) => `
          <div class="row">
            <div class="grow">
              <div class="title">${escapeHtml(r.title)}</div>
              <div class="sub">${formatDate(r.date)}${state.helpers.length > 1 ? tr("log.sep") + escapeHtml(r.helperName) : ""}</div>
              <p class="tiny muted" style="margin:0.35rem 0 0">${escapeHtml(r.body)}</p>
              <div class="btn-row" style="margin-top:0.45rem">
                <button class="btn secondary" type="button" data-action="remind-snooze" data-id="${r.id}" style="min-height:2.4rem">${tr("remind.snooze")}</button>
                <button class="btn ghost" type="button" data-action="remind-done" data-id="${r.id}" style="min-height:2.4rem">${tr("remind.done")}</button>
              </div>
            </div>
            <span class="status-pill ${r.urgency}">${urgencyWord(r.urgency)}</span>
          </div>`
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
                return `<div class="row">
                  <div class="grow">
                    <div class="title">${escapeHtml(task.title)}</div>
                    <div class="sub">${escapeHtml(scheduleLabel(task))}${time ? tr("log.sep") + escapeHtml(time) : ""}</div>
                    ${task.detail ? `<p class="tiny muted" style="margin:0.3rem 0 0">${escapeHtml(task.detail)}</p>` : ""}
                  </div>
                  <button class="btn secondary" type="button" data-action="task-edit" data-id="${task.id}" style="min-height:2.4rem;padding:0.3rem 0.7rem">${tr("common.edit")}</button>
                </div>`;
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
                (rule) => `
        <article class="card" style="margin-top:0.65rem">
          <div class="section-head">
            <h2>${escapeHtml(rule.title)}</h2>
            <button class="linkish" type="button" data-action="rule-edit" data-id="${rule.id}">${tr("common.edit")}</button>
          </div>
          <p style="margin:0;white-space:pre-wrap">${escapeHtml(rule.body)}</p>
        </article>`
              )
              .join("")
          : `<div class="card"><p class="muted" style="margin:0">${tr("rules.none")}</p></div>`
      }
    </div>
  `;
}

function viewShop() {
  const h = helper();
  if (!h) return emptyHelperPrompt(tr("leave.empty.title"));
  const lists = listsFor(h).slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">${tr("shop.title")}</h1>
    <p class="lede">${tr("shop.lede")}</p>
    <div class="btn-row">
      <button class="btn" type="button" data-action="shop-new">${tr("shop.new")}</button>
    </div>
    <div class="card" style="margin-top:0.9rem">
      ${
        lists.length
          ? lists
              .map((list) => {
                const items = itemsForList(list.id);
                const bought = items.filter((i) => i.bought).length;
                return `<button class="row" type="button" data-go="shop-detail" data-list="${list.id}">
                  <div class="grow">
                    <div class="title">${escapeHtml(list.title || placeLabel(list.place))}</div>
                    <div class="sub">${placeLabel(list.place)}${tr("log.sep")}${items.length ? tr("shop.progress", { done: bought, total: items.length }) : tr("shop.noItems")}</div>
                  </div>
                  <span class="status-pill ${list.status === "done" ? "" : "watch"}">${list.status === "done" ? tr("shop.status.done") : tr("shop.status.open")}</span>
                </button>`;
              })
              .join("")
          : `<p class="muted" style="margin:0">${tr("shop.none")}</p>`
      }
    </div>
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
    <h1 class="screen-title">${escapeHtml(list.title || placeLabel(list.place))}</h1>
    <p class="lede">${placeLabel(list.place)}${list.note ? tr("log.sep") + escapeHtml(list.note) : ""}${tr("shop.detail.lede")}</p>
    <div class="btn-row">
      <button class="btn" type="button" data-action="item-new" data-list="${list.id}">${tr("shop.addItem")}</button>
      ${
        list.status !== "done"
          ? `<button class="btn secondary" type="button" data-action="shop-complete" data-list="${list.id}">${tr("shop.complete")}</button>`
          : `<button class="btn secondary" type="button" data-action="shop-reopen" data-list="${list.id}">${tr("shop.reopen")}</button>`
      }
    </div>
    <div style="margin-top:0.5rem">
      ${
        items.length
          ? items
              .map((item) => {
                const cat = findCatalog(state, item.name);
                const hint = cat
                  ? tr("shop.lastPrice", { price: formatMoney(cat.lastPrice), date: cat.lastPaidOn ? tr("shop.lastPrice.date", { date: formatDate(cat.lastPaidOn, { short: true }) }) : "" })
                  : "";
                return `<div class="shop-item">
                  <div class="thumb">${item.photo ? `<img src="${item.photo}" alt="">` : icon("image", { size: 22 })}</div>
                  <div>
                    <div class="title" style="font-weight:650">${escapeHtml(item.name)}${item.qty ? tr("log.sep") + escapeHtml(item.qty) : ""}</div>
                    ${item.note ? `<div class="tiny muted">${escapeHtml(item.note)}</div>` : ""}
                    ${hint ? `<div class="price-hint">${hint}</div>` : ""}
                    <div class="chip-row" style="margin-top:0.4rem">
                      ${item.bought ? `<span class="tag ok">${tr("shop.bought")}</span>` : `<span class="tag">${tr("shop.notBought")}</span>`}
                      ${item.paidPrice !== "" && item.paidPrice != null ? `<span class="tag brass">${tr("shop.thisTime", { price: formatMoney(item.paidPrice) })}</span>` : ""}
                    </div>
                    <div class="btn-row" style="margin-top:0.35rem">
                      <button class="btn secondary" type="button" data-action="item-edit" data-id="${item.id}" style="min-height:2.4rem;padding:0.3rem 0.7rem">${tr("shop.editItem")}</button>
                    </div>
                  </div>
                </div>`;
              })
              .join("")
          : `<div class="card"><p class="muted" style="margin:0">${tr("shop.items.none")}</p></div>`
      }
    </div>
    <div class="btn-row">
      <button class="btn danger" type="button" data-action="shop-del" data-list="${list.id}">${tr("shop.delete")}</button>
    </div>
  `;
}

async function generateShare() {
  const h = helper();
  if (!h) return toast(tr("toast.addHelperFirst"));
  const pin = randomPin();
  const shareId = uid("share");
  const payload = buildSharePayload({
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
  });
  payload.shareId = shareId;
  let packed;
  try {
    packed = await encryptShare(payload, pin);
  } catch (err) {
    console.warn(err);
    return toast(tr("toast.shareFailed"));
  }
  state.helperAccess[h.id] = {
    shareId,
    packed,
    generatedAt: payload.generatedAt,
    revoked: false,
    helperName: h.name,
  };
  save();
  upsertInbox({
    shareId,
    helperId: h.id,
    packed,
    generatedAt: payload.generatedAt,
    label: h.name,
  });
  ui.shareReveal = { pin, packed, url: shareUrl(packed), helperName: h.name, shareId };
  ui.tab = "share";
  location.hash = "#/share";
  render();
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
      <button class="row" type="button" data-go="pay"><div class="grow"><div class="title">${tr("more.pay")}</div><div class="sub">${tr("more.pay.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="remind"><div class="grow"><div class="title">${tr("home.reminders")}</div><div class="sub">${tr("more.remind.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="tasks"><div class="grow"><div class="title">${tr("tab.tasks")}</div><div class="sub">${tr("more.tasks.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="rules"><div class="grow"><div class="title">${tr("tab.rules")}</div><div class="sub">${tr("more.rules.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="shop"><div class="grow"><div class="title">${tr("shop.title")}</div><div class="sub">${tr("more.shop.sub")}</div></div>${icon("chevron")}</button>
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
  return buildReminders(h, today(), { arrangedRestDays: p.arrangedRestDays || [], forHelper: true });
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
    <section class="welcome">
      <div>
        <div class="eyebrow">${tr(greetingKey())} · ${tr("header.helperView")}</div>
        <h1 class="screen-title">${escapeHtml(h.name)}</h1>
        <p class="lede">${tr("hhome.lede", { gen: p.generatedAt ? tr("hhome.generated", { date: formatDate(p.generatedAt.slice(0, 10)) }) : "" })}</p>
      </div>
      <span class="status-pill ${pillClass}">${cs.label}</span>
    </section>
    <section class="stat-grid">
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
    </section>
    <section class="section">
      <div class="section-head"><h2>${tr("hhome.fromEmployer")}</h2></div>
      ${entryCards(h, "h-")}
    </section>
    <section class="panel" style="margin-top:1rem">
      <div class="panel-title"><h2>${tr("home.reminders")}</h2><button class="linkish" type="button" data-go="h-remind">${tr("common.all")}</button></div>
      ${timelineHtml(reminders, "h-remind")}
    </section>
    <div class="card" style="margin-top:1rem">
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
    </div>
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
  const lists = (p.shopLists || []).slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return `
    <h1 class="screen-title">${tr("shop.title")}</h1>
    <p class="lede">${tr("hshop.lede")}</p>
    <div class="card">
      ${
        lists.length
          ? lists
              .map((list) => {
                const items = (p.shopItems || []).filter((i) => i.listId === list.id);
                const bought = items.filter((i) => i.bought).length;
                return `<button class="row" type="button" data-go="h-shop-detail" data-list="${list.id}">
                  <div class="grow">
                    <div class="title">${escapeHtml(list.title || placeLabel(list.place))}</div>
                    <div class="sub">${placeLabel(list.place)}${tr("log.sep")}${items.length ? tr("shop.progress", { done: bought, total: items.length }) : tr("hshop.noItems")}</div>
                  </div>
                  <span class="status-pill ${list.status === "done" ? "" : "watch"}">${list.status === "done" ? tr("shop.status.done") : tr("shop.status.open")}</span>
                </button>`;
              })
              .join("")
          : `<p class="muted" style="margin:0">${tr("hshop.none")}</p>`
      }
    </div>
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
  const catOf = (name) => (p.priceCatalog || []).find((c) => c.key === String(name || "").trim().toLowerCase());
  return `
    <button class="linkish back-row" type="button" data-go="h-shop">${tr("shop.back")}</button>
    <h1 class="screen-title">${escapeHtml(list.title || placeLabel(list.place))}</h1>
    <p class="lede">${placeLabel(list.place)}${list.note ? tr("log.sep") + escapeHtml(list.note) : ""}${tr("period")}</p>
    ${items
      .map((item) => {
        const cat = catOf(item.name);
        const hint = cat ? tr("hshop.lastPrice", { price: formatMoney(cat.lastPrice) }) : tr("hshop.afterBuy");
        return `<div class="shop-item">
          <div class="thumb">${item.photo ? `<img src="${item.photo}" alt="${escapeHtml(item.name)}">` : icon("image", { size: 22 })}</div>
          <div>
            <div class="title" style="font-weight:650">${escapeHtml(item.name)}${item.qty ? tr("log.sep") + escapeHtml(item.qty) : ""}</div>
            ${item.note ? `<div class="tiny muted">${escapeHtml(item.note)}</div>` : ""}
            <div class="price-hint">${hint}</div>
            <label class="switch-field">
              <span>${tr("hshop.got")}</span>
              <span class="switch"><input type="checkbox" data-action="h-item-bought" data-id="${item.id}" ${item.bought ? "checked" : ""}><span></span></span>
            </label>
            <label class="field" style="margin:0">
              <span>${tr("hshop.priceLabel")}</span>
              <input type="number" inputmode="decimal" min="0" step="0.1" data-action="h-item-price" data-id="${item.id}" value="${item.paidPrice ?? ""}" placeholder="${cat ? cat.lastPrice : ""}">
            </label>
          </div>
        </div>`;
      })
      .join("") || `<div class="card"><p class="muted" style="margin:0">${tr("hshop.items.none")}</p></div>`}
    ${sameDeviceWriteback() ? `<p class="tiny muted">${tr("hshop.writeback.same")}</p>` : `<p class="tiny muted">${tr("hshop.writeback.other")}</p>`}
  `;
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
                    <div class="title">${escapeHtml(r.title)}</div>
                    <div class="sub">${formatDate(r.date)}</div>
                    <p class="tiny muted" style="margin:0.35rem 0 0">${escapeHtml(r.body)}</p>
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
      <button class="row" type="button" data-go="h-pay"><div class="grow"><div class="title">${tr("pay.title")}</div><div class="sub">${tr("hmore.pay.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-remind"><div class="grow"><div class="title">${tr("home.reminders")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-tasks"><div class="grow"><div class="title">${tr("tab.tasks")}</div><div class="sub">${tr("more.tasks.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-rules"><div class="grow"><div class="title">${tr("tab.rules")}</div><div class="sub">${tr("more.rules.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-shop"><div class="grow"><div class="title">${tr("shop.title")}</div><div class="sub">${tr("hmore.shop.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-rights"><div class="grow"><div class="title">${tr("hmore.rights")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-action="helper-lock"><div class="grow"><div class="title">${tr("hmore.lock")}</div><div class="sub">${tr("hmore.lock.sub")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-action="choose-role" data-role="employer"><div class="grow"><div class="title">${tr("hmore.switchEmployer")}</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-action="choose-role" data-role=""><div class="grow"><div class="title">${tr("onboard.backToRole")}</div></div>${icon("chevron")}</button>
    </div>
    <div class="card lang-card">
      <div class="title">${tr("lang.label")}</div>
      ${langSwitch()}
    </div>
    ${disclaimer()}
  `;
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
        <label class="field"><span>${tr("common.note")}</span><textarea name="note"></textarea></label>
        <div class="btn-row"><button class="btn" type="submit">${tr("common.save")}</button></div>
      </form>
    `;
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
        <label class="field"><span>${tr("sheet.list.place")}</span>
          <select name="place">
            ${SHOP_PLACES.map((p) => `<option value="${p.id}">${pick(p)}</option>`).join("")}
          </select>
        </label>
        <label class="field"><span>${tr("common.note")}</span><textarea name="note" maxlength="500"></textarea></label>
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
          <datalist id="catalog-names">${(state.priceCatalog || []).map((c) => `<option value="${escapeHtml(c.name)}">`).join("")}</datalist>
        </label>
        <p class="price-hint" data-suggest>${cat ? tr("shop.lastPrice", { price: formatMoney(cat.lastPrice), date: cat.lastPaidOn ? tr("shop.lastPrice.date", { date: formatDate(cat.lastPaidOn, { short: true }) }) : "" }) : tr("sheet.item.suggestEmpty")}</p>
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

function render() {
  const app = document.getElementById("app");
  if (!app) return;
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
      ${ui.toast ? `<div class="toast" role="status">${escapeHtml(ui.toast)}</div>` : ""}
    `;
    bindAfterRender();
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
  const form = document.getElementById("task-form");
  const schedule = form?.elements?.schedule;
  if (schedule) {
    schedule.addEventListener("change", () => {
      form.querySelector("[data-weekly-only]")?.toggleAttribute("hidden", schedule.value !== "weekly");
      form.querySelector("[data-once-only]")?.toggleAttribute("hidden", schedule.value !== "once");
    });
  }
  const nameInput = document.querySelector("#shop-item-form [name=name]");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      const cat = findCatalog(state, nameInput.value);
      const hint = document.querySelector("[data-suggest]");
      const price = document.querySelector("#shop-item-form [name=paidPrice]");
      if (hint) {
        hint.textContent = cat
          ? tr("shop.lastPrice", { price: formatMoney(cat.lastPrice), date: cat.lastPaidOn ? tr("shop.lastPrice.date", { date: formatDate(cat.lastPaidOn, { short: true }) }) : "" })
          : tr("sheet.item.suggestEmpty");
      }
      if (price && cat && (price.value === "" || price.dataset.autofilled === "1")) {
        price.placeholder = String(cat.lastPrice);
        price.dataset.autofilled = "1";
      }
    });
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
    winterChoice: helper()?.winterChoice || "christmas",
    grantGeneralHolidays: helper()?.grantGeneralHolidays || false,
  });
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
        recordCatalogPrice(state, it.name, it.paidPrice, today(), "");
      }
    }
  }
  for (const list of p.shopLists || []) {
    const idx = state.shopLists.findIndex((s) => s.id === list.id);
    if (idx >= 0) state.shopLists[idx] = { ...state.shopLists[idx], status: list.status };
  }
  save();
}

async function onClick(ev) {
  const go = ev.target.closest("[data-go]");
  if (go) {
    ev.preventDefault();
    if (go.dataset.list) ui.shopListId = go.dataset.list;
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
  if (action === "remind-done") {
    state.reminderState[id] = { ...(state.reminderState[id] || {}), done: true };
    save();
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
  if (action === "shop-new") {
    ui.sheet = { type: "shop-list" };
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
    state.shopItems = state.shopItems.filter((i) => i.id !== id);
    save();
    ui.sheet = null;
    render();
    return;
  }
  if (action === "shop-del") {
    const listId = act.getAttribute("data-list");
    state.shopLists = state.shopLists.filter((l) => l.id !== listId);
    state.shopItems = state.shopItems.filter((i) => i.listId !== listId);
    save();
    ui.shopListId = null;
    toast(tr("toast.listDeleted"));
    setTab("shop");
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
          recordCatalogPrice(state, item.name, item.paidPrice, today(), list.place);
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
  if (action === "pick-photo") {
    document.querySelector("[data-role=photo-input]")?.click();
    return;
  }
  if (action === "share-generate") {
    act.disabled = true;
    await generateShare();
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
  if (action === "h-item-bought" || action === "h-item-price") {
    const p = sessionPayload();
    if (!p) return;
    const item = (p.shopItems || []).find((i) => i.id === el.getAttribute("data-id"));
    if (!item) return;
    if (action === "h-item-bought") item.bought = el.checked;
    if (action === "h-item-price") item.paidPrice = el.value === "" ? "" : Number(el.value);
    persistSessionPayload();
    writeShopBackToEmployer();
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
    const idx = state.helpers.findIndex((x) => x.id === data.id);
    if (idx >= 0) state.helpers[idx] = { ...state.helpers[idx], ...data };
    else state.helpers.push(data);
    state.currentHelperId = data.id;
    save();
    if (isArrangedRestPolicy(data.restDay)) {
      toast(tr("toast.savedArranged"));
      ui.leavePane = "rest";
      setTab("leave");
    } else {
      toast(tr("toast.saved"));
      setTab("home");
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
        note: String(fd.get("note") || ""),
      })
    );
    save();
    ui.sheet = null;
    toast(tr("toast.payLogged"));
    render();
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
    });
    state.shopLists.push(rec);
    save();
    ui.sheet = null;
    ui.shopListId = rec.id;
    toast(tr("toast.listCreated"));
    setTab("shop-detail");
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
    });
    if (!rec.name) return toast(tr("toast.needItemName"));
    const idx = state.shopItems.findIndex((i) => i.id === rec.id);
    if (idx >= 0) state.shopItems[idx] = { ...state.shopItems[idx], ...rec };
    else state.shopItems.push(rec);
    if (rec.paidPrice !== "" && rec.paidPrice != null) {
      const list = state.shopLists.find((l) => l.id === listId);
      recordCatalogPrice(state, rec.name, rec.paidPrice, today(), list?.place || "");
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
  for (const pack of tries) {
    try {
      const payload = await decryptShare(pack, pin);
      if (!payload?.helper) continue;
      helperSession = { payload, unlockedAt: new Date().toISOString() };
      saveSession(helperSession);
      setRole("helper");
      ui.pendingShare = "";
      ui.pinError = "";
      if (location.hash.startsWith("#/v/")) history.replaceState(null, "", "#/h");
      ui.tab = "h";
      location.hash = "#/h";
      toast(tr("toast.opened", { name: payload.helper.name || tr("toast.yourData") }));
      render();
      return;
    } catch {
      /* try next */
    }
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
  const items = state.helpers
    .flatMap((h) => buildReminders(h, t, { arrangedRestDays: arrangedFor(h) }))
    .filter((r) => isReminderVisible(r, state.reminderState, t) && ["expired", "critical", "soon"].includes(r.urgency));
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

window.addEventListener("hashchange", () => {
  parseHash();
  render();
});
document.addEventListener("click", onClick);
document.addEventListener("change", onChange);
document.addEventListener("submit", onSubmit);

try {
  parseHash();
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
