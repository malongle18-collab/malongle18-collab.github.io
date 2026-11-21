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
const guide = await import("../js/usage-guide.js?v=25");
const i18n = await import("../js/i18n.js?v=25");
const storage = await import("../js/storage.js?v=25");

const { usageSectionsFor, usageKeys, usageImageFiles, dismissUsageTip, usageTipSeen, USAGE_TIP_KEY } = guide;
const { t, setLang } = i18n;
const { UI_NAV, DEFAULT_NAV_TABS, NAV_TAB_MAX, normalizeNavTabs } = storage;

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  }
}

const employer = usageSectionsFor("employer");
const helper = usageSectionsFor("helper");
const employerIds = employer.map((s) => s.id);
const helperIds = helper.map((s) => s.id);

for (const id of ["welcome", "role", "nav", "leave", "tasks", "rules", "shop", "menu", "recipes", "pay", "contract", "share", "remind", "backup"]) {
  assert(employerIds.includes(id), `employer guide missing ${id}`);
}
for (const id of ["contract", "share", "backup"]) {
  assert(!helperIds.includes(id), `helper guide must not teach ${id}`);
}
for (const id of ["welcome", "role", "nav", "leave", "tasks", "rules", "shop", "menu", "recipes", "pay", "receive", "remind", "rights", "lock"]) {
  assert(helperIds.includes(id), `helper guide missing ${id}`);
}
for (const id of ["receive", "rights", "lock"]) {
  assert(!employerIds.includes(id), `employer guide must not teach helper-only ${id}`);
}

assert(employer.every((s) => s.image.startsWith("images/guide/employer-")), "employer figures use employer screenshots");
assert(helper.every((s) => s.image.startsWith("images/guide/helper-")), "helper figures use helper screenshots");
assert(employer.find((s) => s.id === "shop").steps.includes("usage.shop.e4"), "employer shop steps include list swipe");
assert(!helper.find((s) => s.id === "shop").steps.includes("usage.shop.e4"), "helper shop steps are not the employer list");

const banned = ["工人", "僮", "外僑", "僑主", "外僱", "Indonesian", "Filipino", "Tagalog", "Bahasa"];
const helperBanned = [
  "傳更新給外傭",
  "外傭資料與合約",
  "匯出 JSON",
  "由網頁新增菜譜",
  "登記發薪記錄",
  "複製到我的菜譜",
  "Send update to helper",
  "Helper details and contract",
  "Add recipe from web",
  "Log a payment",
  "Copy to my recipes",
  "Export JSON",
];

function textOf(sections, lang) {
  setLang(lang);
  return sections
    .flatMap((s) => [t(s.titleKey), t(s.altKey), ...s.steps.map((k) => t(k))])
    .join("\n");
}

for (const lang of ["zh-Hant", "en"]) {
  setLang(lang);
  for (const key of usageKeys()) {
    const value = t(key);
    assert(value && value !== key, `${lang} missing ${key}`);
    for (const word of banned) assert(!value.includes(word), `${lang} ${key} contains ${word}`);
  }
  const helperText = textOf(helper, lang);
  for (const phrase of helperBanned) {
    assert(!helperText.includes(phrase), `${lang} helper guide offers “${phrase}”`);
  }
}

setLang("zh-Hant");
const employerZh = textOf(employer, "zh-Hant");
assert(employerZh.includes("傳更新給外傭"), "employer guide explains sending an update");
assert(employerZh.includes("工作安排") && employerZh.includes("工作守則"), "employer guide keeps tasks and rules");
assert(employerZh.includes("更新至最新版本"), "employer guide names the in-app update button");
assert(!employerZh.includes("清除網站資料") && !employerZh.includes("clear site data"), "guide does not tell anyone to clear site data");

setLang("en");
const helperEn = textOf(helper, "en");
assert(helperEn.includes("not a live sync") || helperEn.includes("not live cloud sync"), "helper guide says this is not live sync");
assert(helperEn.includes("Only the employer can delete a whole list"), "helper guide withholds whole-list delete");

assert(UI_NAV.employer.some((item) => item.id === "guide-help" && item.labelKey === "usage.title"), "catalog label is the user guide");
assert(UI_NAV.helper.some((item) => item.id === "h-guide-help"), "helper catalog includes the user guide");
assert(!DEFAULT_NAV_TABS.employer.includes("guide-help") && !DEFAULT_NAV_TABS.helper.includes("h-guide-help"), "guide is not a default tab");
assert(NAV_TAB_MAX === 5, "middle tab cap stays five");
assert(normalizeNavTabs("employer", ["guide-help", "leave", "tasks", "rules", "shop", "menu"]).length === 5, "sixth custom tab is still dropped");

const sw = readFileSync(join(root, "sw.js"), "utf8");
for (const file of usageImageFiles()) {
  assert(sw.includes(`./${file}`), `service worker missing ${file}`);
}
assert(sw.includes('const CACHE = "fdh-household-pages-v25"'), "cache version is v25");

mem.clear();
assert(!usageTipSeen(), "tip starts unseen");
dismissUsageTip();
assert(usageTipSeen() && mem.get(USAGE_TIP_KEY) === "1", "dismiss writes only the tip flag");
assert(!mem.has("fdh-employer-v1"), "dismissing the tip does not touch household records");

if (failed) {
  console.error(`${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("usage-guide tests passed");
