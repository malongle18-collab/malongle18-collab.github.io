/** Illustrated in-app usage guide. Copy lives in i18n; this file is structure only. */

export const USAGE_TIP_KEY = "fdh-usage-tip-v1";

/** Intrinsic size of images/guide/*.jpg (CSS pixels of the 390-wide capture, times device scale). */
export const USAGE_IMG = { w: 780, h: 1400 };

export const USAGE_STATIC_KEYS = [
  "usage.title",
  "usage.more.sub",
  "usage.lede.e",
  "usage.lede.h",
  "usage.toc",
  "usage.tip",
  "usage.tip.dismiss",
  "usage.open",
];

/**
 * roles: who sees the section.
 * steps: shared array, or { employer, helper } key lists.
 * image / alt: file name and i18n key per role.
 * link: optional in-app destination (legal pages), per role.
 */
export const USAGE_SECTIONS = [
  {
    id: "welcome",
    roles: ["employer", "helper"],
    titleKey: "usage.welcome.title",
    image: { employer: "employer-home.jpg", helper: "helper-home.jpg" },
    alt: { employer: "usage.alt.eHome", helper: "usage.alt.hHome" },
    steps: {
      employer: ["usage.welcome.e1", "usage.welcome.e2", "usage.welcome.e3", "usage.welcome.e4"],
      helper: ["usage.welcome.h1", "usage.welcome.h2", "usage.welcome.h3", "usage.welcome.h4"],
    },
    link: { employer: "guide", helper: "h-rights" },
  },
  {
    id: "role",
    roles: ["employer", "helper"],
    titleKey: "usage.role.title",
    image: { employer: "employer-more.jpg", helper: "helper-more.jpg" },
    alt: { employer: "usage.alt.eMore", helper: "usage.alt.hMore" },
    steps: {
      employer: ["usage.role.e1", "usage.role.e2", "usage.role.e3"],
      helper: ["usage.role.h1", "usage.role.h2", "usage.role.h3"],
    },
  },
  {
    id: "nav",
    roles: ["employer", "helper"],
    titleKey: "prefs.title",
    image: { employer: "employer-nav.jpg", helper: "helper-nav.jpg" },
    alt: { employer: "usage.alt.eNav", helper: "usage.alt.hNav" },
    steps: ["usage.nav.1", "usage.nav.2", "usage.nav.3", "usage.nav.4"],
  },
  {
    id: "leave",
    roles: ["employer", "helper"],
    titleKey: "tab.leave",
    image: { employer: "employer-leave.jpg", helper: "helper-leave.jpg" },
    alt: { employer: "usage.alt.eLeave", helper: "usage.alt.hLeave" },
    steps: {
      employer: ["usage.leave.e1", "usage.leave.e2", "usage.leave.e3"],
      helper: ["usage.leave.h1", "usage.leave.h2", "usage.leave.h3"],
    },
    link: { employer: "guide", helper: "h-rights" },
  },
  {
    id: "tasks",
    roles: ["employer", "helper"],
    titleKey: "tab.tasks",
    image: { employer: "employer-tasks.jpg", helper: "helper-tasks.jpg" },
    alt: { employer: "usage.alt.eTasks", helper: "usage.alt.hTasks" },
    steps: {
      employer: ["usage.tasks.e1", "usage.tasks.e2", "usage.tasks.e3"],
      helper: ["usage.tasks.h1", "usage.tasks.h2", "usage.tasks.h3"],
    },
  },
  {
    id: "rules",
    roles: ["employer", "helper"],
    titleKey: "tab.rules",
    image: { employer: "employer-rules.jpg", helper: "helper-rules.jpg" },
    alt: { employer: "usage.alt.eRules", helper: "usage.alt.hRules" },
    steps: {
      employer: ["usage.rules.e1", "usage.rules.e2", "usage.rules.e3"],
      helper: ["usage.rules.h1", "usage.rules.h2"],
    },
  },
  {
    id: "shop",
    roles: ["employer", "helper"],
    titleKey: "shop.title",
    image: { employer: "employer-shop.jpg", helper: "helper-shop.jpg" },
    alt: { employer: "usage.alt.eShop", helper: "usage.alt.hShop" },
    steps: {
      employer: ["usage.shop.e1", "usage.shop.e2", "usage.shop.e3", "usage.shop.e4"],
      helper: ["usage.shop.h1", "usage.shop.h2", "usage.shop.h3", "usage.shop.h4"],
    },
  },
  {
    id: "menu",
    roles: ["employer", "helper"],
    titleKey: "menu.title",
    image: { employer: "employer-menu.jpg", helper: "helper-menu.jpg" },
    alt: { employer: "usage.alt.eMenu", helper: "usage.alt.hMenu" },
    steps: {
      employer: ["usage.menu.e1", "usage.menu.e2", "usage.menu.e3"],
      helper: ["usage.menu.h1", "usage.menu.h2"],
    },
  },
  {
    id: "recipes",
    roles: ["employer", "helper"],
    titleKey: "recipe.title",
    image: { employer: "employer-recipes.jpg", helper: "helper-recipes.jpg" },
    alt: { employer: "usage.alt.eRecipes", helper: "usage.alt.hRecipes" },
    steps: {
      employer: ["usage.recipes.e1", "usage.recipes.e2", "usage.recipes.e3", "usage.recipes.e4"],
      helper: ["usage.recipes.h1", "usage.recipes.h2", "usage.recipes.h3"],
    },
  },
  {
    id: "pay",
    roles: ["employer", "helper"],
    titleKey: "pay.title",
    image: { employer: "employer-pay.jpg", helper: "helper-pay.jpg" },
    alt: { employer: "usage.alt.ePay", helper: "usage.alt.hPay" },
    steps: {
      employer: ["usage.pay.e1", "usage.pay.e2", "usage.pay.e3", "usage.pay.e4"],
      helper: ["usage.pay.h1", "usage.pay.h2", "usage.pay.h3"],
    },
    link: { employer: "guide", helper: "h-rights" },
  },
  {
    id: "contract",
    roles: ["employer"],
    titleKey: "more.helperData",
    image: { employer: "employer-contract.jpg" },
    alt: { employer: "usage.alt.eContract" },
    steps: ["usage.contract.1", "usage.contract.2", "usage.contract.3", "usage.contract.4"],
    link: { employer: "guide" },
  },
  {
    id: "share",
    roles: ["employer"],
    titleKey: "share.title",
    image: { employer: "employer-share.jpg" },
    alt: { employer: "usage.alt.eShare" },
    steps: ["usage.share.1", "usage.share.2", "usage.share.3", "usage.share.4"],
  },
  {
    id: "receive",
    roles: ["helper"],
    titleKey: "usage.receive.title",
    image: { helper: "helper-enter.jpg" },
    alt: { helper: "usage.alt.hEnter" },
    steps: ["usage.receive.1", "usage.receive.2", "usage.receive.3", "usage.receive.4"],
  },
  {
    id: "remind",
    roles: ["employer", "helper"],
    titleKey: "home.reminders",
    image: { employer: "employer-remind.jpg", helper: "helper-remind.jpg" },
    alt: { employer: "usage.alt.eRemind", helper: "usage.alt.hRemind" },
    steps: {
      employer: ["usage.remind.e1", "usage.remind.e2", "usage.remind.e3"],
      helper: ["usage.remind.h1", "usage.remind.h2"],
    },
  },
  {
    id: "backup",
    roles: ["employer"],
    titleKey: "backup.title",
    image: { employer: "employer-backup.jpg" },
    alt: { employer: "usage.alt.eBackup" },
    steps: ["usage.backup.1", "usage.backup.2", "usage.backup.3"],
  },
  {
    id: "rights",
    roles: ["helper"],
    titleKey: "hmore.rights",
    image: { helper: "helper-rights.jpg" },
    alt: { helper: "usage.alt.hRights" },
    steps: ["usage.rights.1", "usage.rights.2"],
    link: { helper: "h-rights" },
  },
  {
    id: "lock",
    roles: ["helper"],
    titleKey: "hmore.lock",
    image: { helper: "helper-lock.jpg" },
    alt: { helper: "usage.alt.hLock" },
    steps: ["usage.lock.1", "usage.lock.2"],
  },
];

export function usageSectionsFor(role) {
  const bucket = role === "helper" ? "helper" : "employer";
  return USAGE_SECTIONS.filter((s) => s.roles.includes(bucket)).map((s) => ({
    id: s.id,
    roles: s.roles.slice(),
    titleKey: s.titleKey,
    altKey: s.alt[bucket],
    image: `images/guide/${s.image[bucket]}`,
    steps: Array.isArray(s.steps) ? s.steps.slice() : s.steps[bucket].slice(),
    link: s.link?.[bucket] || "",
  }));
}

export function usageImageFiles() {
  const files = new Set();
  for (const s of USAGE_SECTIONS) {
    for (const name of Object.values(s.image)) files.add(`images/guide/${name}`);
  }
  return [...files];
}

export function usageKeys() {
  const keys = new Set(USAGE_STATIC_KEYS);
  for (const s of USAGE_SECTIONS) {
    keys.add(s.titleKey);
    for (const k of Object.values(s.alt)) keys.add(k);
    const lists = Array.isArray(s.steps) ? [s.steps] : Object.values(s.steps);
    for (const list of lists) for (const k of list) keys.add(k);
  }
  return [...keys];
}

export function usageTipSeen() {
  try {
    return localStorage.getItem(USAGE_TIP_KEY) === "1";
  } catch {
    return true;
  }
}

/** Records that the tip was dismissed. Does not read or write household records. */
export function dismissUsageTip() {
  try {
    localStorage.setItem(USAGE_TIP_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}
