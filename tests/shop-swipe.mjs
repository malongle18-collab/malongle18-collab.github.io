/** 390px: swipe a shopping list and an item to delete, without jumping to the top. */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const artifactDir = process.env.ARTIFACT_DIR || "/opt/cursor/artifacts";
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webmanifest": "application/manifest+json",
};

const lists = Array.from({ length: 6 }, (_, i) => ({
  id: `shop-${i + 1}`,
  helperId: "helper-1",
  title: `街市 ${i + 1}`,
  place: "market",
  status: "open",
  note: "",
  date: "2026-11-16",
  createdAt: "2026-11-16T00:00:00.000Z",
  completedAt: "",
}));
const items = [
  { id: "item-1", listId: "shop-1", helperId: "helper-1", name: "菜心", qty: "1", bought: false, paidPrice: "", kind: "", parentId: "" },
  { id: "item-2", listId: "shop-1", helperId: "helper-1", name: "豬肉", qty: "2", bought: false, paidPrice: "", kind: "", parentId: "" },
];

function startServer() {
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith("/")) rel += "index.html";
    const file = normalize(join(root, rel));
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end("no");
      return;
    }
    try {
      res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
      res.end(readFileSync(file));
    } catch {
      res.writeHead(404);
      res.end("missing");
    }
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let seq = 0;
  const pending = new Map();
  const opened = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  function send(method, params = {}) {
    const msgId = ++seq;
    return opened.then(() => new Promise((resolve, reject) => {
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    }));
  }
  return { send, ws };
}

const SEED = `(() => {
  if (localStorage.getItem("fdh-employer-v1")) return;
  const state = {
    version: 2,
    helpers: [{ id: "helper-1", name: "Maria Santos", nationality: "philippines", startDate: "2026-02-01", contractStart: "2026-02-01", contractEnd: "2028-01-31", wage: 5220, foodProvided: true, foodAllowance: 1236, restDay: 0 }],
    currentHelperId: "helper-1",
    shopLists: ${JSON.stringify(lists)},
    shopItems: ${JSON.stringify(items)},
    workTasks: [{ id: "task-1", helperId: "helper-1", title: "掃地", schedule: "daily", weekdays: [], timeFrom: "", timeTo: "", note: "" }],
    settings: { notifications: false }
  };
  localStorage.setItem("fdh-lang-v1", "zh-Hant");
  localStorage.setItem("fdh-active-role-v1", "employer");
  localStorage.setItem("fdh-employer-v1", JSON.stringify(state));
  localStorage.setItem("fdh-ui-prefs-v1", JSON.stringify({ employer: { tabs: ["leave", "tasks", "shop"] }, helper: { tabs: ["h-leave", "h-tasks", "h-shop"] } }));
  localStorage.setItem("fdh-helper-session-v1", JSON.stringify({
    pin: "123456",
    payload: {
      helper: { id: "helper-1", name: "Maria Santos" },
      shareId: "swipe-check",
      shopLists: ${JSON.stringify(lists)},
      shopItems: ${JSON.stringify(items)}
    }
  }));
})()`;

async function evalJson(send, expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails.exception || result.exceptionDetails));
  return result.result?.value;
}

async function waitFor(send, expression) {
  const start = Date.now();
  while (Date.now() - start < 8000) {
    if (await evalJson(send, expression)) return;
    await new Promise((r) => setTimeout(r, 80));
  }
  throw new Error("timeout " + expression);
}

async function swipe(send, x, y, dx) {
  const steps = 12;
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: Math.round(x), y: Math.round(y), id: 1 }] });
  for (let i = 1; i <= steps; i++) {
    await send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: Math.round(x + (dx * i) / steps), y: Math.round(y), id: 1 }],
    });
  }
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await new Promise((r) => setTimeout(r, 200));
}

async function box(send, expression) {
  const value = await evalJson(send, expression);
  if (!value) throw new Error("no box for " + expression);
  return value;
}

const stored = `JSON.parse(localStorage.getItem("fdh-employer-v1"))`;

async function main() {
  const server = await startServer();
  const port = server.address().port;
  const origin = `http://127.0.0.1:${port}/index.html`;
  const profile = mkdtempSync(join(tmpdir(), "shop-swipe-"));
  const chrome = spawn("google-chrome", [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run",
    "--remote-allow-origins=*", "--remote-debugging-port=9348", `--user-data-dir=${profile}`, "about:blank",
  ], { stdio: "ignore" });
  try {
    let version;
    for (let i = 0; i < 40 && !version; i++) {
      try { version = await fetch("http://127.0.0.1:9348/json/version").then((r) => r.json()); }
      catch { await new Promise((r) => setTimeout(r, 100)); }
    }
    if (!version) throw new Error("Chrome did not start");
    const page = (await fetch("http://127.0.0.1:9348/json/list").then((r) => r.json())).find((t) => t.type === "page");
    const { send, ws } = connect(page.webSocketDebuggerUrl);
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
    await send("Page.addScriptToEvaluateOnNewDocument", { source: SEED });
    await send("Page.navigate", { url: `${origin}#/shop` });
    await waitFor(send, `document.querySelector(".shop-card-head") ? true : null`);

    const wired = await evalJson(send, `(() => {
      const head = document.querySelector(".shop-card-head");
      const row = head.closest("[data-swipe-row]");
      const item = document.querySelector(".tick-item[data-swipe-row]");
      return {
        vw: window.innerWidth,
        listAction: row?.querySelector(":scope > .swipe-del-btn")?.getAttribute("data-action") || "",
        itemAction: item?.querySelector(":scope > .swipe-del-btn")?.getAttribute("data-action") || "",
        cards: document.querySelectorAll(".shop-card").length,
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1
      };
    })()`);
    if (wired.vw !== 390) throw new Error("viewport " + wired.vw);
    if (wired.listAction !== "shop-del") throw new Error("list card is not swipe-deletable: " + JSON.stringify(wired));
    if (wired.itemAction !== "item-del") throw new Error("item row is not swipe-deletable");
    if (wired.cards !== 6 || wired.overflow) throw new Error("shop overview layout: " + JSON.stringify(wired));

    await evalJson(send, `[...document.querySelectorAll(".shop-card-head")].at(-1).scrollIntoView({ block: "center" })`);
    await new Promise((r) => setTimeout(r, 60));
    const beforeScroll = await evalJson(send, `document.querySelector(".main").scrollTop`);
    if (beforeScroll < 40) throw new Error("page did not scroll: " + beforeScroll);
    const head = await box(send, `(() => {
      const el = [...document.querySelectorAll(".shop-card-head")].at(-1);
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + Math.min(18, r.height / 2), id: el.getAttribute("data-list") };
    })()`);
    await swipe(send, head.x, head.y, -70);
    const opened = await evalJson(send, `(() => {
      const row = [...document.querySelectorAll(".shop-card-swipe")].find((r) => r.querySelector("[data-list='${head.id}']"));
      const btn = row?.querySelector(":scope > .swipe-del-btn");
      const shown = btn ? getComputedStyle(btn).pointerEvents !== "none" && getComputedStyle(btn).opacity !== "0" : false;
      return { open: !!row?.classList.contains("is-open"), shown, hash: location.hash, lists: ${stored}.shopLists.length };
    })()`);
    if (!opened.open || !opened.shown) throw new Error("partial swipe did not reveal delete: " + JSON.stringify(opened));
    if (opened.hash !== "#/shop" || opened.lists !== 6) throw new Error("partial swipe changed the list: " + JSON.stringify(opened));
    mkdirSync(artifactDir, { recursive: true });
    const shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(artifactDir, "shop-swipe-390.png"), Buffer.from(shot.data, "base64"));

    await evalJson(send, `document.querySelector(".shop-card-swipe.is-open > .swipe-del-btn").click()`);
    await waitFor(send, `${stored}.shopLists.length === 5 ? true : null`);
    const afterList = await evalJson(send, `(() => {
      const data = ${stored};
      return { lists: data.shopLists.map((l) => l.id), items: data.shopItems.map((i) => i.id), scroll: document.querySelector(".main").scrollTop, name: data.helpers[0].name };
    })()`);
    if (afterList.lists.includes(head.id)) throw new Error("swiped list was not removed");
    if (!afterList.items.includes("item-1") || afterList.name !== "Maria Santos") throw new Error("list delete touched other records: " + JSON.stringify(afterList));
    if (afterList.scroll < 40) throw new Error("list delete jumped to the top: " + afterList.scroll);

    const itemBox = await box(send, `(() => {
      const el = document.querySelector(".tick-item[data-swipe-row]");
      el.scrollIntoView({ block: "center" });
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width * 0.7, y: r.y + r.height / 2 };
    })()`);
    await swipe(send, itemBox.x, itemBox.y, -220);
    await waitFor(send, `!${stored}.shopItems.some((i) => i.id === "item-1") ? true : null`);
    const afterItem = await evalJson(send, `(() => {
      const data = ${stored};
      return { items: data.shopItems.map((i) => i.id), lists: data.shopLists.length, scroll: document.querySelector(".main").scrollTop };
    })()`);
    if (afterItem.items.includes("item-1") || !afterItem.items.includes("item-2") || afterItem.lists !== 5) {
      throw new Error("item swipe result: " + JSON.stringify(afterItem));
    }
    if (afterItem.scroll < 40) throw new Error("item delete jumped to the top: " + afterItem.scroll);

    await evalJson(send, `location.hash = "#/shop-detail/shop-1"`);
    await waitFor(send, `document.querySelector(".shop-detail-head") && document.querySelector("[data-id='item-2']") ? true : null`);
    const detail = await box(send, `(() => {
      const el = document.querySelector("[data-id='item-2']").closest("[data-swipe-row]");
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width * 0.55, y: r.y + 28 };
    })()`);
    await swipe(send, detail.x, detail.y, -240);
    await waitFor(send, `!${stored}.shopItems.some((i) => i.id === "item-2") ? true : null`);
    if (await evalJson(send, `location.hash`) !== "#/shop-detail/shop-1") throw new Error("item delete left the detail page");

    await evalJson(send, `location.hash = "#/tasks"`);
    await waitFor(send, `document.querySelector("[data-action='task-del']") ? true : null`);
    const task = await box(send, `(() => {
      const el = document.querySelector("[data-swipe-row]");
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width * 0.7, y: r.y + r.height / 2 };
    })()`);
    await swipe(send, task.x, task.y, -240);
    await waitFor(send, `!${stored}.workTasks.some((t) => t.id === "task-1") ? true : null`);

    await send("Page.navigate", { url: `${origin}?reload=1#/shop` });
    await waitFor(send, `document.querySelector(".shop-card") ? true : null`);
    const persisted = await evalJson(send, `(() => {
      const data = ${stored};
      return { lists: data.shopLists.map((l) => l.id), items: data.shopItems.map((i) => i.id), tasks: data.workTasks.length, name: data.helpers[0].name };
    })()`);
    if (persisted.lists.includes(head.id) || persisted.lists.length !== 5) throw new Error("reload restored a deleted list: " + JSON.stringify(persisted));
    if (persisted.items.length !== 0 || persisted.tasks !== 0 || persisted.name !== "Maria Santos") {
      throw new Error("reload changed other records: " + JSON.stringify(persisted));
    }

    await evalJson(send, `localStorage.setItem("fdh-active-role-v1", "helper"); "ok"`);
    await send("Page.navigate", { url: `${origin}?as=helper#/h-shop` });
    try {
      await waitFor(send, `document.body.innerText.includes("僱主要你到街市") ? true : null`);
    } catch (err) {
      const snap = await evalJson(send, `location.hash + " | " + (document.body.innerText || "").replace(/\\s+/g, " ").slice(0, 180)`);
      throw new Error(err.message + " :: " + snap);
    }
    const helperCard = await evalJson(send, `(() => {
      const head = document.querySelector(".shop-card-head");
      return {
        listDelete: head.closest(".shop-card-swipe")?.querySelector(":scope > .swipe-del-btn")?.getAttribute("data-action") || "",
        itemDelete: document.querySelector(".tick-item[data-swipe-row] > .swipe-del-btn")?.getAttribute("data-action") || "",
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1
      };
    })()`);
    if (helperCard.listDelete) throw new Error("helper can swipe-delete a list: " + JSON.stringify(helperCard));
    if (helperCard.itemDelete !== "item-del") throw new Error("helper item swipe missing");
    if (helperCard.overflow) throw new Error("helper shop page overflows horizontally");
    const helperItem = await box(send, `(() => {
      const el = document.querySelector(".tick-item[data-swipe-row]");
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width * 0.7, y: r.y + r.height / 2 };
    })()`);
    await swipe(send, helperItem.x, helperItem.y, -240);
    await waitFor(send, `!(JSON.parse(localStorage.getItem("fdh-helper-session-v1")).payload.shopItems || []).some((i) => i.id === "item-1") ? true : null`);
    const employerStill = await evalJson(send, `(() => { const data = ${stored}; return { name: data.helpers[0].name, lists: data.shopLists.length, items: data.shopItems.length }; })()`);
    if (employerStill.name !== "Maria Santos" || employerStill.lists !== 5 || employerStill.items !== 0) {
      throw new Error("helper swipe rewrote employer data: " + JSON.stringify(employerStill));
    }
    const helperLists = await evalJson(send, `JSON.parse(localStorage.getItem("fdh-helper-session-v1")).payload.shopLists.length`);
    if (helperLists !== 6) throw new Error("helper item swipe removed a list");

    console.log(JSON.stringify({ ok: true, deletedList: head.id, screenshot: "shop-swipe-390.png" }));
    ws.close();
  } finally {
    chrome.kill("SIGKILL");
    server.close();
    await new Promise((r) => setTimeout(r, 150));
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 40 }); } catch { /* ignore */ }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
