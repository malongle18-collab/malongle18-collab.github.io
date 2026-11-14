/* Passport / HKID numbers and uploaded document files (images + PDF). */
import { compressImageFile } from "./share.js?v=17";
import { t } from "./i18n.js?v=17";

export const DOC_TYPES = ["passport", "hkid"];
export const MAX_DOC_FILES = 2;
export const MAX_PDF_CHARS = 1_500_000; // data-URL length cap for a PDF (~1.1 MB file)
export const MAX_SHARE_DOC_CHARS = 1_500_000; // total docs allowed inside one helper share

export function emptyDocs() {
  return { passport: [], hkid: [] };
}

function uidDoc() {
  return `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Clean user-typed ID numbers: trim, no spaces, upper case. */
export function cleanIdNumber(v) {
  return String(v || "")
    .replace(/[\s\u3000]+/g, "")
    .toUpperCase()
    .slice(0, 24);
}

/** Validate a stored/imported docs object. Never throws. */
export function normalizeDocs(raw) {
  const out = emptyDocs();
  if (!raw || typeof raw !== "object") return out;
  for (const k of DOC_TYPES) {
    const list = Array.isArray(raw[k]) ? raw[k] : [];
    out[k] = list
      .filter((d) => d && typeof d === "object" && typeof d.data === "string" && d.data.startsWith("data:"))
      .slice(0, MAX_DOC_FILES)
      .map((d) => ({
        id: String(d.id || uidDoc()),
        name: String(d.name || "").slice(0, 80),
        type: d.type === "application/pdf" ? "application/pdf" : "image/jpeg",
        data: d.data,
        addedAt: String(d.addedAt || ""),
      }));
  }
  return out;
}

export function hasDocs(h) {
  const d = h?.docs;
  return Boolean(d && DOC_TYPES.some((k) => d[k]?.length));
}

export function hasIdInfo(h) {
  return Boolean(h && (h.passportNo || h.hkidNo || hasDocs(h)));
}

/** HKID: keep first 3 characters and the check digit, e.g. E12****(3). */
export function maskHkid(v) {
  const s = cleanIdNumber(v);
  if (!s) return "";
  const check = s.match(/\(([0-9A])\)$/);
  const body = s.replace(/\([0-9A]\)$/, "");
  const head = body.slice(0, 3);
  const stars = "*".repeat(Math.max(3, Math.min(4, body.length - 3)));
  return `${head}${stars}${check ? `(${check[1]})` : ""}`;
}

/** Passport: only the last 4 characters visible. */
export function maskPassport(v) {
  const s = cleanIdNumber(v);
  if (!s) return "";
  if (s.length <= 4) return "*".repeat(s.length);
  return `${"*".repeat(Math.min(6, s.length - 4))}${s.slice(-4)}`;
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = () => reject(new Error(t("doc.readFail")));
    fr.readAsDataURL(file);
  });
}

/** Turn a picked file into a stored doc. Images are compressed; PDFs capped. */
export async function readDocFile(file) {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
  const isImg = /^image\//.test(file.type || "") || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name || "");
  if (isPdf) {
    if (file.size > MAX_PDF_CHARS * 0.76) throw new Error(t("doc.pdfTooBig"));
    const data = await readAsDataUrl(file);
    if (data.length > MAX_PDF_CHARS) throw new Error(t("doc.pdfTooBig"));
    const fixed = data.replace(/^data:[^;,]*/, "data:application/pdf");
    return { id: uidDoc(), name: String(file.name || "document.pdf").slice(0, 80), type: "application/pdf", data: fixed, addedAt: new Date().toISOString() };
  }
  if (!isImg) throw new Error(t("doc.badType"));
  const data = await compressImageFile(file, { maxSize: 1280, quality: 0.74 });
  return { id: uidDoc(), name: String(file.name || "photo.jpg").slice(0, 80), type: "image/jpeg", data, addedAt: new Date().toISOString() };
}

export function docsChars(docs) {
  let n = 0;
  for (const k of DOC_TYPES) for (const d of docs?.[k] || []) n += d.data.length;
  return n;
}

/** Smaller copy of the documents for the encrypted helper share (images only are re-compressed). */
export async function docsForShare(docs) {
  const out = emptyDocs();
  for (const k of DOC_TYPES) {
    for (const d of docs?.[k] || []) {
      if (d.type === "application/pdf") {
        out[k].push(d);
        continue;
      }
      try {
        const blob = await (await fetch(d.data)).blob();
        const data = await compressImageFile(blob, { maxSize: 960, quality: 0.62 });
        out[k].push({ ...d, data: data.length < d.data.length ? data : d.data });
      } catch {
        out[k].push(d);
      }
    }
  }
  return out;
}

export function dataUrlToBlobUrl(dataUrl) {
  const [head, b64] = String(dataUrl).split(",");
  const mime = (head.match(/data:([^;]+)/) || [])[1] || "application/octet-stream";
  const bin = atob(b64 || "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}
