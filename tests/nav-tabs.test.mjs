import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const mem = new Map();
globalThis.localStorage = {
  getItem: (key) => (mem.has(key) ? mem.get(key) : null),
  setItem: (key, value) => mem.set(key, String(value)),
  removeItem: (key) => mem.delete(key),
  clear: () => mem.clear(),
  key: (index) => [...mem.keys()][index] ?? null,
  get length() {
    return mem.size;
  },
};

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const storage = await import("../js/storage.js?v=21");
const i18n = await import("../js/i18n.js?v=21");

const {
  NAV_TAB_MAX,
  UI_NAV,
  DEFAULT_NAV_TABS,
  UI_PREFS_KEY,
  STORAGE_KEY,
  normalizeNavTabs,
  addNavTab,
  removeNavTab,
  loadUiPrefs,
  saveUiPrefs,
  setNavTabs,
  getNavTabs,
  emptyUiPrefs,
} = storage;
const { t, setLang } = i18n;

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  }
}

assert(NAV_TAB_MAX === 5, `middle-slot max is 5, got ${NAV_TAB_MAX}`);
assert(!UI_NAV.employer.some((item) => item.id === "more" || item.id === "home"), "More and Home are not selectable employer entries");
assert(!UI_NAV.helper.some((item) => item.id === "h-more" || item.id === "h"), "More and Mine are not selectable helper entries");

const employerIds = UI_NAV.employer.map((item) => item.id);
const helperIds = UI_NAV.helper.map((item) => item.id);
assert(employerIds.length > NAV_TAB_MAX, "employer catalog must allow a blocked sixth add");
assert(helperIds.length > NAV_TAB_MAX, "helper catalog must allow a blocked sixth add");

let prefs = emptyUiPrefs();
for (const id of employerIds.slice(0, NAV_TAB_MAX)) prefs = addNavTab(prefs, "employer", id);
assert(
  JSON.stringify(getNavTabs(prefs, "employer")) === JSON.stringify(employerIds.slice(0, NAV_TAB_MAX)),
  `selecting five keeps ${employerIds.slice(0, NAV_TAB_MAX).join(",")}, got ${getNavTabs(prefs, "employer").join(",")}`
);
const blocked = addNavTab(prefs, "employer", employerIds[NAV_TAB_MAX]);
assert(blocked === prefs, "a sixth add returns the same prefs");
assert(getNavTabs(blocked, "employer").length === NAV_TAB_MAX, "sixth add does not grow the list");
assert(!getNavTabs(blocked, "employer").includes(employerIds[NAV_TAB_MAX]), "sixth id is not stored");

const dropped = employerIds[NAV_TAB_MAX - 1];
prefs = removeNavTab(prefs, "employer", dropped);
assert(getNavTabs(prefs, "employer").length === NAV_TAB_MAX - 1, "unselect leaves four");
assert(!getNavTabs(prefs, "employer").includes(dropped), "unselected id is gone");
prefs = addNavTab(prefs, "employer", dropped);
assert(getNavTabs(prefs, "employer").length === NAV_TAB_MAX, "reselect returns to five");
assert(getNavTabs(prefs, "employer").at(-1) === dropped, "reselected id is last");

const persisted = loadUiPrefs();
assert(
  JSON.stringify(persisted.employer.tabs) === JSON.stringify(getNavTabs(prefs, "employer")),
  "employer selection persists"
);
assert(
  JSON.stringify(persisted.helper.tabs) === JSON.stringify(DEFAULT_NAV_TABS.helper),
  "helper defaults stay put while employer changes"
);

prefs = addNavTab(prefs, "helper", "h-shop");
prefs = addNavTab(prefs, "helper", "h-menu");
assert(getNavTabs(prefs, "employer").length === NAV_TAB_MAX, "helper edits do not change the employer list");
assert(getNavTabs(prefs, "helper").includes("h-shop") && getNavTabs(prefs, "helper").includes("h-menu"), "helper list is separate");
assert(!getNavTabs(prefs, "helper").includes("shop"), "employer ids are not copied onto the helper");
const helperBlocked = addNavTab(
  addNavTab(addNavTab(prefs, "helper", "h-pay"), "helper", "h-leave"),
  "helper",
  "h-rules"
);
assert(getNavTabs(helperBlocked, "helper").length === NAV_TAB_MAX, "helper also stops at five");
assert(JSON.stringify(loadUiPrefs().employer.tabs) === JSON.stringify(getNavTabs(prefs, "employer")), "reloaded employer list is unchanged");
assert(JSON.stringify(loadUiPrefs().helper.tabs) === JSON.stringify(getNavTabs(helperBlocked, "helper")), "reloaded helper list is its own");

mem.clear();
const keptEmployer = ["shop", "menu", "pay"];
const keptHelper = ["h-pay", "h-shop"];
saveUiPrefs({ employer: { tabs: keptEmployer }, helper: { tabs: keptHelper } });
assert(JSON.stringify(loadUiPrefs().employer.tabs) === JSON.stringify(keptEmployer), "three saved employer tabs are preserved");
assert(JSON.stringify(loadUiPrefs().helper.tabs) === JSON.stringify(keptHelper), "two saved helper tabs are preserved");
assert(JSON.stringify(normalizeNavTabs("employer", [])) === "[]", "an explicit empty selection stays empty");
assert(
  JSON.stringify(normalizeNavTabs("employer", ["pay", "shop", "menu", "share", "leave", "tasks", "rules", "nope", "pay"])) ===
    JSON.stringify(["pay", "shop", "menu", "share", "leave"]),
  "overflow keeps the first five valid ids in order"
);
assert(JSON.stringify(normalizeNavTabs("employer", ["h-leave", "leave", "h-pay"])) === JSON.stringify(["leave"]), "other-role ids are dropped");
assert(JSON.stringify(normalizeNavTabs("helper", undefined)) === JSON.stringify(DEFAULT_NAV_TABS.helper), "missing helper tabs use the default");

const business = JSON.stringify({ helpers: [{ id: "helper-1", name: "Maria" }], recipes: [{ id: "r1" }] });
mem.set(STORAGE_KEY, business);
setNavTabs(loadUiPrefs(), "employer", keptEmployer);
assert(mem.get(STORAGE_KEY) === business, "household business data is not rewritten");
assert(mem.has(UI_PREFS_KEY), "only the UI prefs key is written");

setLang("zh-Hant");
const zhMax = t("prefs.nav.max", { left: 1, n: NAV_TAB_MAX });
const zhFull = t("prefs.nav.full", { n: NAV_TAB_MAX });
const zhCount = t("prefs.nav.count", { count: 5, n: NAV_TAB_MAX });
const zhLede = t("prefs.lede", { n: NAV_TAB_MAX });
assert(zhMax.includes("5") && zhMax.includes("更多") && zhMax.includes("首頁"), `zh max: ${zhMax}`);
assert(zhFull.includes("5") && zhFull.includes("更多"), `zh full: ${zhFull}`);
assert(zhCount.includes("5/5") && zhCount.includes("更多") && zhCount.includes("首頁"), `zh count: ${zhCount}`);
assert(zhLede.includes("最多 5") && zhLede.includes("更多") && zhLede.includes("首頁"), `zh lede: ${zhLede}`);

setLang("en");
const enMax = t("prefs.nav.max", { left: 1, n: NAV_TAB_MAX });
const enFull = t("prefs.nav.full", { n: NAV_TAB_MAX });
const enCount = t("prefs.nav.count", { count: 5, n: NAV_TAB_MAX });
const enLede = t("prefs.lede", { n: NAV_TAB_MAX });
assert(enMax.includes("5") && enMax.includes("More") && enMax.includes("Home"), `en max: ${enMax}`);
assert(enFull.includes("5") && enFull.includes("More") && enFull.includes("Home"), `en full: ${enFull}`);
assert(enCount.includes("5 of 5") && enCount.includes("More") && enCount.includes("Home"), `en count: ${enCount}`);
assert(enLede.includes("up to 5") && enLede.includes("More") && enLede.includes("Home"), `en lede: ${enLede}`);

const index = readFileSync(join(root, "index.html"), "utf8");
const sw = readFileSync(join(root, "sw.js"), "utf8");
const app = readFileSync(join(root, "js/app.js"), "utf8");
const menu = readFileSync(join(root, "js/menu.js"), "utf8");
assert(index.includes("./css/app.css?v=21") && index.includes("./js/app.js?v=21"), "index.html assets are v21");
assert(sw.includes('const CACHE = "fdh-household-pages-v21"'), "service worker cache is v21");
assert(!index.includes("?v=20") && !sw.includes("pages-v20") && !app.includes("?v=20"), "v20 cache busters are gone");
assert(menu.includes('const RECIPE_PHOTO_CACHE = "19"'), "recipe photo cache stays on 19");

if (failed) {
  console.error(`${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("nav-tabs tests passed");
