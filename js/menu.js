/** Meal plan (今日餐單) and recipes (菜譜): pure data helpers, no DOM. */
import { compressImageFile } from "./share.js?v=24";
import { getLang } from "./i18n.js?v=24";
import { LIB_RECIPES, RECIPE_PHOTO_CREDITS } from "./recipes-lib.js?v=24";

export const DEFAULT_SLOT_KEYS = ["breakfast", "lunch", "dinner", "snack"];
export const MAX_SLOTS = 12;
export const MAX_DISHES_PER_SLOT = 12;
export const SHARE_MENU_PAST_DAYS = 3;
export const SHARE_MENU_FUTURE_DAYS = 45;
export const REPEAT_WINDOW_DAYS = 3;
export const CATEGORIES = ["meat", "poultry", "fish", "veg", "egg", "soup", "staple", "other"];
export const DIFFICULTIES = ["easy", "medium", "hard"];
/** "contains" keys + "light". Halal-friendly is derived: no pork and no alcohol. */
export const DIET_KEYS = ["pork", "beef", "alcohol", "fermented", "light", "halal"];
export const CONTAINS_KEYS = ["pork", "beef", "alcohol", "fermented"];
export const DEFAULT_DIET = { noPork: false, noBeef: false, noAlcohol: false, noFermented: false, halalOnly: false, lightOnly: false };
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_RECIPE_PHOTOS = 6;

const LIB_BY_ID = new Map(LIB_RECIPES.map((r) => [r.id, r]));

/** True when this id belongs to a starter-library recipe. */
export function isLibraryRecipeId(id) {
  return LIB_BY_ID.has(String(id || ""));
}

/** Library id this user record overrides, or "" if it is a personal recipe. */
export function libraryOverrideId(r) {
  if (!r) return "";
  if (isLibraryRecipeId(r.overrideOf)) return String(r.overrideOf);
  if (isLibraryRecipeId(r.id)) return String(r.id);
  return "";
}

const LIB_PHOTO_PATH_RE = /^images\/recipes\/[A-Za-z0-9._-]+\.(jpe?g|png|webp)$/i;
const RECIPE_PHOTO_CACHE = "19";

/** Same-origin library file path only: images/recipes/<safe name>.jpg|jpeg|png|webp, no .. or protocol. */
export function isLibraryPhotoPath(v) {
  const raw = String(v || "").trim();
  if (!raw || raw.includes("..") || raw.includes("\\") || raw.includes("://") || raw.startsWith("/") || raw.includes(":")) return false;
  const path = raw.split("?")[0];
  return LIB_PHOTO_PATH_RE.test(path);
}

export function isRecipePhoto(v) {
  const s = String(v || "");
  return /^data:image\//.test(s) || isLibraryPhotoPath(s);
}

/** img src: data URLs unchanged; library paths get a cache-bust query. */
export function recipePhotoSrc(v) {
  const s = String(v || "");
  if (/^data:image\//.test(s)) return s;
  if (!isLibraryPhotoPath(s)) return "";
  const path = s.split("?")[0];
  return `${path}?v=${RECIPE_PHOTO_CACHE}`;
}

export function libraryPhotoPathOf(v) {
  const s = String(v || "").trim();
  return isLibraryPhotoPath(s) ? s.split("?")[0] : "";
}

/** Caption for the first photo if it is a credited library file. */
export function recipePhotoCreditInfo(r) {
  const path = libraryPhotoPathOf(recipePhotosOf(r)[0] || "");
  if (!path) return null;
  const c = RECIPE_PHOTO_CREDITS[path];
  return c || null;
}

/** Unique photos on a recipe (photos[] plus legacy photo): data URLs and same-origin library paths. */
export function recipePhotosOf(r) {
  const out = [];
  const seen = new Set();
  const add = (v) => {
    const s = String(v || "");
    if (!isRecipePhoto(s)) return;
    const key = libraryPhotoPathOf(s) || s;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(key);
  };
  if (Array.isArray(r?.photos)) r.photos.forEach(add);
  add(r?.photo);
  return out.slice(0, MAX_RECIPE_PHOTOS);
}

function nid(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}-${crypto.randomUUID().slice(0, 12)}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function defaultSlots() {
  return DEFAULT_SLOT_KEYS.map((key) => ({ id: `slot-${key}`, key, name: "" }));
}

export function emptyMenu() {
  return { slots: defaultSlots(), days: {} };
}

export function newDish(partial = {}) {
  return { id: nid("dish"), text: "", recipeId: "", note: "", ...partial };
}

export function newRecipe(partial = {}) {
  const now = new Date().toISOString();
  return {
    id: nid("recipe"),
    no: 0,
    nameZh: "",
    nameEn: "",
    name: "",
    category: "other",
    prepMins: 0,
    difficulty: "easy",
    servings: "",
    ingredients: [],
    steps: [],
    tips: { zh: "", en: "" },
    notes: "",
    diet: [],
    tags: [],
    photo: "",
    photos: [],
    copyOf: "",
    overrideOf: "",
    sourceUrl: "",
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function cleanLines(v, max = 60, len = 160) {
  const arr = Array.isArray(v) ? v : String(v || "").split(/\r?\n/);
  return arr
    .map((s) => String(s || "").trim().slice(0, len))
    .filter(Boolean)
    .slice(0, max);
}

export function splitLines(text, max, len) {
  return cleanLines(String(text || ""), max, len);
}

export function splitTags(text) {
  const out = [];
  const raw = String(text || "");
  const sep = /[,，、;；\n]/.test(raw) ? /[,，、;；\n]+/ : /[\s\u3000]+/;
  for (const s of raw.split(sep)) {
    const v = s.trim().slice(0, 20);
    if (v && !out.includes(v)) out.push(v);
  }
  return out.slice(0, 12);
}

function str(v, n) {
  return String(v == null ? "" : v).trim().slice(0, n);
}

/** Old recipes stored ingredients/steps as plain strings; new ones as objects. Accept both. */
function normIngredients(raw) {
  const out = [];
  for (const x of Array.isArray(raw) ? raw : []) {
    if (typeof x === "string") {
      const line = x.trim().slice(0, 160);
      if (!line) continue;
      const p = parseIngredient(line);
      out.push({ zh: p.name, en: "", qty: p.qty, qtyEn: "" });
    } else if (x && typeof x === "object") {
      const zh = str(x.zh, 80);
      const en = str(x.en, 80);
      if (!zh && !en) continue;
      out.push({ zh, en, qty: str(x.qty, 40), qtyEn: str(x.qtyEn, 40) });
    }
    if (out.length >= 80) break;
  }
  return out;
}

function normSteps(raw) {
  const out = [];
  for (const x of Array.isArray(raw) ? raw : []) {
    if (typeof x === "string") {
      const zh = x.trim().slice(0, 400);
      if (zh) out.push({ zh, en: "" });
    } else if (x && typeof x === "object") {
      const zh = str(x.zh, 400);
      const en = str(x.en, 400);
      if (zh || en) out.push({ zh, en });
    }
    if (out.length >= 60) break;
  }
  return out;
}

export function normalizeRecipes(raw) {
  const seen = new Set();
  const out = [];
  for (const r of Array.isArray(raw) ? raw : []) {
    if (!r || typeof r !== "object" || !r.id) continue;
    const libId = libraryOverrideId(r);
    const id = libId || String(r.id);
    if (!id || seen.has(id)) continue;
    const nameZh = str(r.nameZh != null ? r.nameZh : r.name, 80);
    const nameEn = str(r.nameEn, 80);
    if (!nameZh && !nameEn) continue;
    seen.add(id);
    const lib = libId ? LIB_BY_ID.get(libId) : null;
    const tips = r.tips && typeof r.tips === "object" ? { zh: String(r.tips.zh || "").slice(0, 800), en: String(r.tips.en || "").slice(0, 800) } : { zh: String(r.notes || "").slice(0, 800), en: "" };
    const diet = (Array.isArray(r.diet) ? r.diet : []).map(String).filter((k) => DIET_KEYS.includes(k));
    out.push({
      id,
      no: lib ? lib.no : Number.isInteger(Number(r.no)) && Number(r.no) >= 100 ? Number(r.no) : 0,
      nameZh,
      nameEn,
      name: nameZh || nameEn,
      category: CATEGORIES.includes(r.category) ? r.category : "other",
      prepMins: Math.max(0, Math.min(1440, Math.round(Number(r.prepMins) || 0))),
      difficulty: DIFFICULTIES.includes(r.difficulty) ? r.difficulty : "easy",
      photo: recipePhotosOf(r)[0] || "",
      photos: recipePhotosOf(r),
      servings: str(r.servings, 20),
      ingredients: normIngredients(r.ingredients),
      steps: normSteps(r.steps),
      tips,
      notes: tips.zh,
      diet: Array.from(new Set(diet)),
      tags: Array.isArray(r.tags) ? splitTags(r.tags.join(",")) : splitTags(r.tags),
      copyOf: lib ? "" : str(r.copyOf, 40),
      overrideOf: libId || "",
      sourceUrl: normalizeSourceUrl(r.sourceUrl),
      createdAt: String(r.createdAt || ""),
      updatedAt: String(r.updatedAt || r.createdAt || ""),
    });
  }
  // Recipe ID numbers: keep valid ones, give old recipes a stable number in list order (101, 102, ...)
  // Library overrides always keep the library number and are ignored here.
  const used = new Set(out.map((r) => r.no).filter(Boolean));
  let next = 101;
  const dup = new Set();
  for (const r of out) {
    if (r.overrideOf) continue;
    if (r.no && dup.has(r.no)) r.no = 0;
    if (r.no) dup.add(r.no);
  }
  for (const r of out) {
    if (r.no) continue;
    while (used.has(next)) next += 1;
    r.no = next;
    used.add(next);
  }
  return out;
}

export function nextRecipeNo(userRecipes) {
  const max = (userRecipes || []).reduce((m, r) => {
    if (libraryOverrideId(r)) return m;
    return Math.max(m, Number(r.no) || 0);
  }, 100);
  return max + 1;
}

/* ---------- names / language ---------- */

function langOf(lang) {
  return lang || getLang();
}

export function recipeName(r, lang) {
  if (!r) return "";
  return langOf(lang) === "en" ? r.nameEn || r.nameZh || r.name || "" : r.nameZh || r.nameEn || r.name || "";
}
export function recipeNameOther(r, lang) {
  if (!r) return "";
  return langOf(lang) === "en" ? (r.nameEn ? r.nameZh : "") : r.nameEn || "";
}
export function ingName(i, lang) {
  return langOf(lang) === "en" ? i.en || i.zh : i.zh || i.en;
}
export function ingQty(i, lang) {
  return langOf(lang) === "en" ? i.qtyEn || i.qty : i.qty || i.qtyEn;
}
export function stepText(s, lang) {
  return langOf(lang) === "en" ? s.en || s.zh : s.zh || s.en;
}
export function tipsText(r, lang) {
  const t = r.tips || { zh: "", en: "" };
  return langOf(lang) === "en" ? t.en || t.zh : t.zh || t.en;
}
export function recipeNoLabel(r) {
  return `#${r.no}`;
}

/** Apply a local override onto a library recipe. id / no / builtin stay from the library. */
export function mergeLibraryOverride(base, override) {
  const o = override || {};
  const hasPhotoField = Object.prototype.hasOwnProperty.call(o, "photos") || Object.prototype.hasOwnProperty.call(o, "photo");
  const photos = hasPhotoField ? recipePhotosOf(o) : recipePhotosOf(base);
  return {
    ...base,
    nameZh: override.nameZh,
    nameEn: override.nameEn,
    name: override.nameZh || override.nameEn || base.name,
    category: override.category,
    prepMins: override.prepMins,
    difficulty: override.difficulty,
    servings: override.servings,
    ingredients: override.ingredients,
    steps: override.steps,
    tips: override.tips && typeof override.tips === "object" ? override.tips : base.tips,
    notes: override.notes || (override.tips && override.tips.zh) || base.notes,
    diet: Array.isArray(override.diet) ? override.diet : base.diet,
    tags: Array.isArray(override.tags) ? override.tags : base.tags,
    photo: photos[0] || "",
    photos,
    sourceUrl: override.sourceUrl || "",
    updatedAt: override.updatedAt || base.updatedAt,
    createdAt: override.createdAt || base.createdAt,
    id: base.id,
    no: base.no,
    builtin: true,
    overrideOf: base.id,
    copyOf: "",
  };
}

/** Personal recipes only (library overrides are excluded). */
export function ownUserRecipes(userRecipes) {
  return (userRecipes || []).filter((r) => !libraryOverrideId(r));
}

/** Library first (overrides merged in place), then the household's own recipes. */
export function allRecipes(userRecipes) {
  const overrides = new Map();
  const own = [];
  for (const r of userRecipes || []) {
    const libId = libraryOverrideId(r);
    if (libId) overrides.set(libId, r);
    else own.push(r);
  }
  const lib = LIB_RECIPES.map((base) => {
    const o = overrides.get(base.id);
    return o ? mergeLibraryOverride(base, o) : base;
  });
  return [...lib, ...own];
}

/* ---------- diet ---------- */

export function normalizeDiet(raw) {
  const d = { ...DEFAULT_DIET };
  if (raw && typeof raw === "object") for (const k of Object.keys(d)) d[k] = Boolean(raw[k]);
  return d;
}

/** Built-in recipes: derived (no pork, no alcohol). Own recipes: only when the owner ticked "halal-friendly". */
export function isHalalFriendly(r) {
  const d = r.diet || [];
  if (d.includes("pork") || d.includes("alcohol")) return false;
  return r.builtin ? true : d.includes("halal");
}

/** Which household preferences does this recipe break? Returns keys like "pork", "beef", "halal", "light". */
export function dietConflicts(r, diet) {
  const d = normalizeDiet(diet);
  const has = new Set(r.diet || []);
  const out = [];
  if (d.noPork && has.has("pork")) out.push("pork");
  if (d.noBeef && has.has("beef")) out.push("beef");
  if (d.noAlcohol && has.has("alcohol")) out.push("alcohol");
  if (d.noFermented && has.has("fermented")) out.push("fermented");
  if (d.halalOnly && !isHalalFriendly(r)) out.push("halal");
  if (d.lightOnly && !has.has("light")) out.push("light");
  return out;
}

/* ---------- recently eaten ---------- */

export function dishKey(d, recipes) {
  if (d.recipeId) return `r:${d.recipeId}`;
  const t = String(d.text || "").trim().toLowerCase();
  return t ? `t:${t}` : "";
}

/** Days ago (1..window) that this dish key was planned before `date`, or 0 if not. Uses the nearest day. */
export function eatenDaysAgo(menu, key, date, windowDays = REPEAT_WINDOW_DAYS) {
  if (!key) return 0;
  for (let n = 1; n <= windowDays; n++) {
    const day = menu.days?.[shiftISO(date, -n)];
    if (!day) continue;
    for (const list of Object.values(day)) {
      if (list.some((d) => dishKey(d) === key)) return n;
    }
  }
  return 0;
}

/** Recipes planned within the last `windowDays` days up to and including yesterday (relative to `today`). */
export function recipeEatenDaysAgo(menu, recipeId, today, windowDays = REPEAT_WINDOW_DAYS) {
  return eatenDaysAgo(menu, `r:${recipeId}`, today, windowDays);
}

export function normalizeMenu(raw) {
  const m = raw && typeof raw === "object" ? raw : {};
  let slots;
  if (Array.isArray(m.slots)) {
    const seen = new Set();
    slots = [];
    for (const s of m.slots) {
      if (!s || typeof s !== "object" || !s.id || seen.has(String(s.id))) continue;
      seen.add(String(s.id));
      const key = DEFAULT_SLOT_KEYS.includes(s.key) ? s.key : "";
      slots.push({ id: String(s.id), key, name: String(s.name || "").trim().slice(0, 20) });
    }
    slots = slots.slice(0, MAX_SLOTS);
  } else {
    slots = defaultSlots();
  }
  const ids = new Set(slots.map((s) => s.id));
  const days = {};
  const src = m.days && typeof m.days === "object" ? m.days : {};
  for (const [date, bySlot] of Object.entries(src)) {
    if (!ISO_RE.test(date) || !bySlot || typeof bySlot !== "object") continue;
    const day = {};
    for (const [slotId, list] of Object.entries(bySlot)) {
      if (!ids.has(slotId) || !Array.isArray(list)) continue;
      const dishes = list
        .filter((d) => d && typeof d === "object")
        .map((d) => ({
          id: String(d.id || nid("dish")),
          text: String(d.text || "").trim().slice(0, 80),
          recipeId: String(d.recipeId || ""),
          note: String(d.note || "").trim().slice(0, 120),
        }))
        .filter((d) => d.text || d.recipeId)
        .slice(0, MAX_DISHES_PER_SLOT);
      if (dishes.length) day[slotId] = dishes;
    }
    if (Object.keys(day).length) days[date] = day;
  }
  return { slots, days };
}

/** Slot label: custom name, else the translated default for its key. */
export function slotLabel(slot, tr) {
  if (slot.name) return slot.name;
  return slot.key ? tr(`menu.slot.${slot.key}`) : tr("menu.slot.custom");
}

export function dishLabel(dish, recipes, lang) {
  const r = (recipes || []).find((x) => x.id === dish.recipeId);
  if (dish.text && !(r && [r.nameZh, r.nameEn, r.name].includes(dish.text))) return dish.text;
  return r ? recipeName(r, lang) : dish.text || "";
}

export function dayDishes(menu, date) {
  return (menu.slots || [])
    .map((slot) => ({ slot, dishes: (menu.days?.[date] || {})[slot.id] || [] }))
    .filter((x) => x.dishes.length);
}

export function dayCount(menu, date) {
  return Object.values(menu.days?.[date] || {}).reduce((n, l) => n + l.length, 0);
}

function isoParts(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function isoOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function shiftISO(iso, n) {
  const d = isoParts(iso);
  d.setDate(d.getDate() + n);
  return isoOf(d);
}
/** The 7 dates (Mon..Sun) of the week that contains `iso`. */
export function weekDates(iso) {
  const d = isoParts(iso);
  const mondayOffset = (d.getDay() + 6) % 7;
  const start = shiftISO(iso, -mondayOffset);
  return Array.from({ length: 7 }, (_, i) => shiftISO(start, i));
}

/** Copy every dish of `from` into `to` with fresh ids. Replaces the target day. Returns count. */
export function copyDay(menu, from, to) {
  const src = menu.days[from];
  if (!src || from === to) return 0;
  const next = {};
  let n = 0;
  for (const [slotId, list] of Object.entries(src)) {
    next[slotId] = list.map((d) => {
      n += 1;
      return { ...d, id: nid("dish") };
    });
  }
  menu.days[to] = next;
  return n;
}

export function pruneDay(menu, date) {
  const day = menu.days[date];
  if (!day) return;
  for (const k of Object.keys(day)) if (!day[k].length) delete day[k];
  if (!Object.keys(day).length) delete menu.days[date];
}

/** Split "雞蛋 2隻" / "olive oil 2 tbsp" into a shopping name and quantity. */
export function parseIngredient(line) {
  const s = String(line || "").trim();
  const m = s.match(/^(.*?)[\s\u3000]+([\d½¼¾][\d.\/½¼¾\-~]*\s*[^\s\d][^\s]*|[\d½¼¾][\d.\/½¼¾\-~]*)$/);
  if (m && m[1].trim()) return { name: m[1].trim(), qty: m[2].trim() };
  const m2 = s.match(/^(.*?[^\d\s\u3000])\s*([\d½¼¾][\d.\/]*\s*(?:g|kg|ml|l|克|公斤|斤|両|兩|個|隻|粒|條|包|盒|罐|瓶|片|塊|湯匙|茶匙|杯|只|棵|份)\s*)$/i);
  if (m2 && m2[1].trim()) return { name: m2[1].trim(), qty: m2[2].trim() };
  return { name: s, qty: "" };
}


/* ---------- quantities and shopping aggregation ---------- */

const FRAC = { 0.25: "1/4", 0.5: "1/2", 0.75: "3/4" };
function fmtNum(n) {
  const r = Math.round(n * 100) / 100;
  const whole = Math.floor(r);
  const f = Math.round((r - whole) * 100) / 100;
  if (FRAC[f]) return whole ? `${whole} ${FRAC[f]}` : FRAC[f];
  return String(r);
}

function parseQty(q) {
  const m = String(q || "").trim().match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*(.*)$/);
  if (!m) return null;
  let n = m[1].includes("/") ? Number(m[1].split("/")[0]) / Number(m[1].split("/")[1]) : Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return { n, unit: m[2].trim() };
}

/** "2隻" + "1隻" -> "3隻"; mixed units are joined with " + ". */
export function mergeQty(list) {
  const sums = new Map();
  const others = [];
  for (const q of list) {
    const s = String(q || "").trim();
    if (!s) continue;
    const p = parseQty(s);
    if (!p) {
      if (!others.includes(s)) others.push(s);
      continue;
    }
    const k = p.unit.toLowerCase();
    sums.set(k, { n: (sums.get(k)?.n || 0) + p.n, unit: p.unit });
  }
  const parts = Array.from(sums.values()).map((v) => `${fmtNum(v.n)}${v.unit && /^[a-z]/i.test(v.unit) ? " " : ""}${v.unit}`);
  return [...parts, ...others].join(" + ");
}

/** entries: [{ ing, dish, group }] -> merged rows { zh, en, qty, qtyEn, dishes[], group } */
export function aggregateIngredients(entries) {
  const map = new Map();
  for (const { ing, dish, group = "" } of entries) {
    const key = `${group}|${String(ing.zh || ing.en).trim().toLowerCase()}`;
    let row = map.get(key);
    if (!row) {
      row = { zh: ing.zh, en: ing.en, qtys: [], qtysEn: [], dishes: [], group };
      map.set(key, row);
    }
    if (!row.zh && ing.zh) row.zh = ing.zh;
    if (!row.en && ing.en) row.en = ing.en;
    if (ing.qty) row.qtys.push(ing.qty);
    if (ing.qtyEn || ing.qty) row.qtysEn.push(ing.qtyEn || ing.qty);
    if (dish && !row.dishes.some((d) => d.key === dish.key)) row.dishes.push(dish);
  }
  return Array.from(map.values()).map((r) => ({
    zh: r.zh,
    en: r.en,
    qty: mergeQty(r.qtys),
    qtyEn: mergeQty(r.qtysEn),
    dishes: r.dishes,
    group: r.group,
  }));
}

/* ---------- share text ---------- */

const DIFF_EN = { easy: "Easy", medium: "Medium", hard: "Hard" };
const DIFF_ZH = { easy: "容易", medium: "中等", hard: "較難" };

export function recipeShareText(r, lang) {
  const en = lang === "en";
  const L = [];
  L.push(`${recipeNoLabel(r)} ${recipeName(r, lang)}`);
  const meta = [];
  if (r.prepMins) meta.push(en ? `${r.prepMins} min` : `${r.prepMins} 分鐘`);
  meta.push(en ? DIFF_EN[r.difficulty] : DIFF_ZH[r.difficulty]);
  if (r.servings) meta.push(en ? `Serves ${r.servings}` : `${r.servings} 人份`);
  L.push(meta.filter(Boolean).join(" · "));
  L.push("");
  L.push(en ? "Ingredients:" : "材料：");
  for (const i of r.ingredients) L.push(`- ${ingName(i, lang)}${ingQty(i, lang) ? ` ${ingQty(i, lang)}` : ""}`);
  L.push("");
  L.push(en ? "Steps:" : "步驟：");
  r.steps.forEach((s, n) => L.push(`${n + 1}. ${stepText(s, lang)}`));
  const tip = tipsText(r, lang);
  if (tip) {
    L.push("");
    L.push(`${en ? "Tip" : "貼士"}: ${tip}`);
  }
  return L.join("\n");
}

/** slotsWithDishes: [{ label, dishes: [{ name, no, note }] }] */
export function menuShareText(dateLabel, slotsWithDishes, lang) {
  const en = lang === "en";
  const L = [en ? `Menu ${dateLabel}` : `餐單 ${dateLabel}`];
  for (const s of slotsWithDishes) {
    L.push("");
    L.push(`${s.label}:`);
    for (const d of s.dishes) L.push(`- ${d.no ? `#${d.no} ` : ""}${d.name}${d.note ? ` (${d.note})` : ""}`);
  }
  return L.join("\n");
}

/** Helper-share copy: menu window only. */
export function menuForShare(menu, fromISO, untilISO) {
  const days = {};
  for (const [date, v] of Object.entries(menu.days || {})) {
    if (date >= fromISO && date <= untilISO) days[date] = v;
  }
  return { slots: menu.slots || [], days };
}

/** Helper-share copy: small photos so the encrypted snapshot stays light. */
export async function recipesForShare(recipes, { withPhotos = true } = {}) {
  const out = [];
  for (const r of recipes || []) {
    const photos = [];
    if (withPhotos) {
      for (const src of recipePhotosOf(r)) {
        const libPath = libraryPhotoPathOf(src);
        if (libPath) {
          photos.push(libPath);
          continue;
        }
        try {
          const blob = await (await fetch(src)).blob();
          const small = await compressImageFile(blob, { maxSize: 360, quality: 0.5 });
          photos.push(small.length < src.length ? small : src);
        } catch {
          /* drop unreadable photos */
        }
      }
    }
    out.push({
      id: r.id, no: r.no, nameZh: r.nameZh, nameEn: r.nameEn, name: r.name, category: r.category, prepMins: r.prepMins, difficulty: r.difficulty,
      photo: photos[0] || "", photos, servings: r.servings, ingredients: r.ingredients, steps: r.steps, tips: r.tips, diet: r.diet, tags: r.tags, copyOf: r.copyOf, overrideOf: r.overrideOf || "", sourceUrl: r.sourceUrl || "",
    });
  }
  return out;
}

/* ---------- web recipes: link + pasted text ---------- */

/** Only http(s) links are kept. A bare domain gets https://. Returns "" if not usable. */
export function normalizeSourceUrl(raw) {
  let v = String(raw == null ? "" : raw).trim().slice(0, 600);
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return "";
    if (!/^[^\s/]+\.[^\s/]{2,}/.test(v)) return "";
    v = `https://${v}`;
  }
  try {
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.href.slice(0, 600);
  } catch {
    return "";
  }
}

export function urlHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** First http(s) link found in a block of text. */
export function findUrl(text) {
  const m = String(text || "").match(/https?:\/\/[^\s<>"'，。）)]+/i);
  return m ? m[0] : "";
}

export function webSearchUrls(query, lang) {
  const q = String(query || "").trim();
  const suffix = lang === "en" ? "recipe" : "食譜";
  const enc = `${encodeURIComponent(q)}+${encodeURIComponent(suffix)}`;
  return { google: `https://www.google.com/search?q=${enc}`, youtube: `https://www.youtube.com/results?search_query=${enc}` };
}

const HAS_CJK = /[\u3400-\u9fff\uf900-\ufaff]/;
const BULLET = /^[\s\u3000]*(?:[-–—•·●○▪■□▫◦✓✔☑►▶◆◇＊*]+|[（(]?[a-z][)）]\s)\s*/i;
const NUM_PREFIX = /^[\s\u3000]*(?:第\s*[0-9一二三四五六七八九十]+\s*[步點点]?\s*[:：.、．)）]?|[（(]?[0-9]{1,2}[)）]|[0-9]{1,2}\s*[.．、:：)）]|[①-⑳]|step\s*[0-9]+\s*[:.\-–)]?)\s*/i;
const IS_NUMBERED = /^[\s\u3000]*(?:第\s*[0-9一二三四五六七八九十]+\s*[步點点]|[（(]?[0-9]{1,2}[)）]|[0-9]{1,2}\s*[.．、:：)）]|[①-⑳]|step\s*[0-9]+)/i;
const H_ING = /^(?:[【\[#＃\s]*)(材料|食材|配料|用料|所需材料|準備材料|主料|ingredients?|what you(?:'| wi)?ll need|you(?:'| wi)?ll need)(?:[】\]\s]*)(?:[:：]\s*(.*))?$/i;
const H_STEP = /^(?:[【\[#＃\s]*)(做法|作法|步驟|步骤|方法|製作方法|制作方法|烹調方法|烹饪步骤|煮法|steps?|method|directions?|instructions?|preparation|how to make(?: it)?)(?:[】\]\s]*)(?:[:：]\s*(.*))?$/i;
const H_TIP = /^(?:[【\[#＃\s]*)(貼士|小貼士|貼心提示|提示|注意事項|tips?|notes?)(?:[】\]\s]*)(?:[:：]\s*(.*))?$/i;
const H_MISC = /^(?:[【\[#＃\s]*)(調味料|醃料|醬汁|腌料|seasonings?|marinade|sauce)(?:[】\]\s]*)(?:[:：]\s*(.*))?$/i;
const QTY_HINT = /[0-9½¼¾]\s*(?:g|kg|ml|l|cup|cups|tbsp|tsp|oz|lb|pcs?|克|公斤|斤|兩|両|毫升|升|個|隻|粒|條|包|盒|罐|瓶|片|塊|湯匙|茶匙|杯|只|棵|份|勺|匙|瓣|支)/i;

function ingFromLine(line) {
  const cjk = HAS_CJK.test(line);
  if (!cjk) {
    const m = line.match(/^((?:\d+(?:[./]\d+)?|[½¼¾])(?:\s+\d+\/\d+)?\s*(?:cups?|tbsp|tsp|tablespoons?|teaspoons?|g|kg|ml|l|oz|lb|pcs?|cloves?|slices?|pinch(?:es)?)?)\s+(.+)$/i);
    if (m && m[2].trim()) return { zh: "", en: m[2].trim(), qty: "", qtyEn: m[1].trim() };
  }
  const p = parseIngredient(line);
  return cjk ? { zh: p.name, en: "", qty: p.qty, qtyEn: "" } : { zh: "", en: p.name, qty: "", qtyEn: p.qty };
}

/** Heuristic split of pasted recipe text. Returns { name, ingredients[{zh,en,qty,qtyEn}], steps[{zh,en}], tips{zh,en} }. */
export function parseRecipeText(text) {
  const raw = String(text || "").replace(/\r/g, "").split("\n").map((l) => l.replace(/\u00a0/g, " ").trim());
  const lines = raw.filter((l) => l && !/^https?:\/\/\S+$/i.test(l));
  const hasHeadings = lines.some((l) => H_ING.test(l) || H_STEP.test(l));
  const ings = [];
  const steps = [];
  const tipLines = [];
  let name = "";
  let section = hasHeadings ? "pre" : "auto";
  const pushStep = (l) => {
    const t = l.replace(NUM_PREFIX, "").replace(BULLET, "").trim();
    if (!t) return;
    steps.push(HAS_CJK.test(t) ? { zh: t.slice(0, 400), en: "" } : { zh: "", en: t.slice(0, 400) });
  };
  const pushIngs = (l) => {
    const t = l.replace(BULLET, "").trim();
    if (!t) return;
    const parts = t.length <= 120 && /[、，,;；]/.test(t) && !/[。.!！?？]\s*$/.test(t) ? t.split(/[、，,;；]+/).map((x) => x.trim()).filter(Boolean) : [t];
    for (const x of parts) ings.push(ingFromLine(x.slice(0, 160)));
  };
  for (const line of lines) {
    let m;
    if ((m = line.match(H_ING))) {
      section = "ing";
      if (m[2]) pushIngs(m[2]);
      continue;
    }
    if ((m = line.match(H_STEP))) {
      section = "step";
      if (m[2]) pushStep(m[2]);
      continue;
    }
    if ((m = line.match(H_TIP))) {
      section = "tip";
      if (m[2]) tipLines.push(m[2]);
      continue;
    }
    if (H_MISC.test(line)) {
      section = "ing";
      continue;
    }
    if (section === "pre") {
      if (!name && line.length <= 40) name = line.replace(/^[#＃【\[\s]+|[】\]\s]+$/g, "");
      continue;
    }
    if (section === "ing") pushIngs(line);
    else if (section === "step") pushStep(line);
    else if (section === "tip") tipLines.push(line.replace(BULLET, ""));
    else {
      // no headings: numbered or long lines are steps; short/quantity lines are ingredients
      if (IS_NUMBERED.test(line)) pushStep(line);
      else if (line.length > 36 && /[。.!！]/.test(line)) pushStep(line);
      else if (QTY_HINT.test(line) || line.length <= 24) pushIngs(line);
      else pushStep(line);
    }
  }
  const zhTips = tipLines.filter((l) => HAS_CJK.test(l)).join("\n");
  const enTips = tipLines.filter((l) => !HAS_CJK.test(l)).join("\n");
  return { name, ingredients: ings.slice(0, 80), steps: steps.slice(0, 60), tips: { zh: zhTips.slice(0, 800), en: enTips.slice(0, 800) } };
}
