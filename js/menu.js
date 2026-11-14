/** Meal plan (今日餐單) and recipes (菜譜): pure data helpers, no DOM. */
import { compressImageFile } from "./share.js?v=11";

export const DEFAULT_SLOT_KEYS = ["breakfast", "lunch", "dinner", "snack"];
export const MAX_SLOTS = 12;
export const MAX_DISHES_PER_SLOT = 12;
export const SHARE_MENU_PAST_DAYS = 1;
export const SHARE_MENU_FUTURE_DAYS = 45;
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

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
    name: "",
    photo: "",
    servings: "",
    ingredients: [],
    steps: [],
    notes: "",
    tags: [],
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

export function normalizeRecipes(raw) {
  const seen = new Set();
  const out = [];
  for (const r of Array.isArray(raw) ? raw : []) {
    if (!r || typeof r !== "object" || !r.id || seen.has(String(r.id))) continue;
    const name = String(r.name || "").trim().slice(0, 80);
    if (!name) continue;
    seen.add(String(r.id));
    out.push({
      id: String(r.id),
      name,
      photo: /^data:image\//.test(String(r.photo || "")) ? String(r.photo) : "",
      servings: String(r.servings || "").trim().slice(0, 20),
      ingredients: cleanLines(r.ingredients),
      steps: cleanLines(r.steps, 40, 400),
      notes: String(r.notes || "").slice(0, 800),
      tags: Array.isArray(r.tags) ? splitTags(r.tags.join(",")) : splitTags(r.tags),
      createdAt: String(r.createdAt || ""),
      updatedAt: String(r.updatedAt || r.createdAt || ""),
    });
  }
  return out;
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

export function dishLabel(dish, recipes) {
  if (dish.text) return dish.text;
  const r = (recipes || []).find((x) => x.id === dish.recipeId);
  return r ? r.name : "";
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
    let photo = "";
    if (withPhotos && r.photo) {
      try {
        const blob = await (await fetch(r.photo)).blob();
        const small = await compressImageFile(blob, { maxSize: 360, quality: 0.5 });
        photo = small.length < r.photo.length ? small : r.photo;
      } catch {
        photo = "";
      }
    }
    out.push({ id: r.id, name: r.name, photo, servings: r.servings, ingredients: r.ingredients, steps: r.steps, notes: r.notes, tags: r.tags });
  }
  return out;
}
