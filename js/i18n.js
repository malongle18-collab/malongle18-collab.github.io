/* Lightweight i18n for the FDW household helper. Languages: zh-Hant (default) and en.
   Saved choice (localStorage "fdh-lang-v1") wins over device language. */
import { zhHant } from "./i18n-zh.js?v=23";
import { en } from "./i18n-en.js?v=23";

export const LANG_KEY = "fdh-lang-v1";
export const LANGS = [
  { id: "zh-Hant", label: "繁體中文", htmlLang: "zh-Hant-HK" },
  { id: "en", label: "English", htmlLang: "en" },
];
const DICTS = { "zh-Hant": zhHant, en };
const FALLBACK = "zh-Hant";

let current = "";

export function isSupportedLang(id) {
  return id === "zh-Hant" || id === "en";
}

/** Map one BCP-47 tag to an app language, or "" if it says nothing useful. */
function mapTag(tag) {
  const s = String(tag || "").toLowerCase();
  if (!s) return "";
  if (s === "yue" || s.startsWith("yue-") || s.startsWith("zh")) return "zh-Hant"; // Hans variants also use zh-Hant here
  if (s === "en" || s.startsWith("en-")) return "en";
  return "other";
}

/** Device language: navigator.languages, then navigator.language. */
export function detectLang() {
  try {
    const nav = typeof navigator !== "undefined" ? navigator : null;
    const list = [];
    if (nav && Array.isArray(nav.languages)) list.push(...nav.languages);
    else if (nav && nav.languages && typeof nav.languages.length === "number") list.push(...Array.from(nav.languages));
    if (nav && nav.language) list.push(nav.language);
    const tags = list.filter(Boolean);
    if (!tags.length) return FALLBACK;
    for (const tag of tags) {
      const m = mapTag(tag);
      if (m === "zh-Hant" || m === "en") return m;
    }
    return "en";
  } catch {
    return FALLBACK;
  }
}

export function savedLang() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return isSupportedLang(v) ? v : "";
  } catch {
    return "";
  }
}

export function getLang() {
  if (!current) current = savedLang() || detectLang();
  return current;
}

export function langMeta(id = getLang()) {
  return LANGS.find((l) => l.id === id) || LANGS[0];
}

/** Update <html lang>, <title> and a few meta tags. Safe to call repeatedly. */
export function applyDocumentLang() {
  if (typeof document === "undefined") return;
  const lang = getLang();
  document.documentElement.lang = langMeta(lang).htmlLang;
  document.title = t("app.title");
  const setMeta = (name, value) => {
    const el = document.querySelector(`meta[name="${name}"]`);
    if (el) el.setAttribute("content", value);
  };
  setMeta("description", t("meta.description"));
  setMeta("application-name", t("app.name"));
  setMeta("apple-mobile-web-app-title", t("app.short"));
}

/** Persist and switch language. Does not touch any other stored data. */
export function setLang(id) {
  const next = isSupportedLang(id) ? id : FALLBACK;
  current = next;
  try {
    localStorage.setItem(LANG_KEY, next);
  } catch {
    /* storage unavailable: the choice lasts for this session only */
  }
  applyDocumentLang();
  return next;
}

function lookup(lang, key) {
  const d = DICTS[lang];
  return d && Object.prototype.hasOwnProperty.call(d, key) ? d[key] : undefined;
}

/** t("key", { name: "x" }) with {name} interpolation. Falls back to zh-Hant, then to the key. */
export function t(key, vars) {
  let s = lookup(getLang(), key);
  if (s === undefined) s = lookup(FALLBACK, key);
  if (s === undefined) return key;
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, name) => (vars[name] === undefined || vars[name] === null ? "" : String(vars[name])));
}

/** Translate into a specific language (e.g. a bilingual message), regardless of the UI language. */
export function tIn(lang, key, vars) {
  let s = lookup(lang, key);
  if (s === undefined) s = lookup(FALLBACK, key);
  if (s === undefined) return key;
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, name) => (vars[name] === undefined || vars[name] === null ? "" : String(vars[name])));
}

/** Plural-aware lookup: key.one / key.other (English); Chinese always uses key.other when present. */
export function tp(key, n, vars) {
  const form = getLang() === "en" && Number(n) === 1 ? "one" : "other";
  const k = lookup(getLang(), `${key}.${form}`) !== undefined || lookup(FALLBACK, `${key}.${form}`) !== undefined ? `${key}.${form}` : key;
  return t(k, { n, ...(vars || {}) });
}

/** Pick the zh or en field of a data object ({zh, en}, {nameZh, nameEn}, ...). */
export function pick(obj, zhKey = "zh", enKey = "en") {
  if (!obj) return "";
  if (getLang() === "en") return obj[enKey] || obj[zhKey] || "";
  return obj[zhKey] || "";
}

export function hasKey(key) {
  return lookup("zh-Hant", key) !== undefined && lookup("en", key) !== undefined;
}
