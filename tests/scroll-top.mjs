/**
 * 390px: tap the top header to scroll the current page back to the top.
 * A real header button still navigates. Deleting an item does not jump to the top.
 * Desktop: the content header scrolls .main, not the sidebar, window, or an open sheet.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const artifactDir = process.env.ARTIFACT_DIR || "/opt/cursor/artifacts";
const port = 9366;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
};

const lists = Array.from({ length: 8 }, (_, i) => ({
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

const SEED = `
if (!localStorage.getItem("fdh-employer-v1")) {
  localStorage.setItem("fdh-lang-v1", "zh-Hant");
  localStorage.setItem("fdh-active-role-v1", "employer");
  localStorage.setItem("fdh-ui-prefs-v1", JSON.stringify({
    employer: { tabs: ["shop", "leave", "tasks"] },
    helper: { tabs: ["h-leave", "h-tasks", "h-shop"] }
  }));
  localStorage.setItem("fdh-employer-v1", JSON.stringify({
    version: 2,
    helpers: [{
      id: "helper-1",
      name: "Maria Santos",
      nationality: "philippines",
      startDate: "2026-02-01",
      contractStart: "2026-02-01",
      contractEnd: "2028-01-31",
      wage: 5220,
      foodProvided: true,
      restDay: 0
    }],
    currentHelperId: "helper-1",
    shopLists: ${JSON.stringify(lists)},
    shopItems: ${JSON.stringify(items)},
    settings: { notifications: false }
  }));
  localStorage.setItem("fdh-helper-session-v1", JSON.stringify({
    pin: "123456",
    payload: {
      helper: { id: "helper-1", name: "Maria Santos", startDate: "2026-02-01", contractStart: "2026-02-01", contractEnd: "2028-01-31", wage: 5220, foodProvided: true, restDay: 0 },
      shareId: "scroll-check",
      shopLists: ${JSON.stringify(lists)},
      shopItems: ${JSON.stringify(items)}
    }
  }));
}
`;

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
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const waitOpen = new Promise((resolve, reject) => {
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
  return {
    ws,
    async send(method, params = {}) {
      await waitOpen;
      const msgId = ++id;
      return new Promise((resolve, reject) => {
        pending.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    },
  };
}

async function evalJson(send, expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text + " " + JSON.stringify(result.exceptionDetails.exception || {}));
  }
  return result.result?.value;
}

async function waitFor(send, expression, timeout = 8000) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeout) {
    last = await evalJson(send, expression);
    if (last) return last;
    await new Promise((r) => setTimeout(r, 40));
  }
  throw new Error(`timeout waiting for ${expression}\nlast=${JSON.stringify(last)}`);
}

async function tap(send, x, y) {
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y: y0, id: 1 }] });
  await new Promise((r) => setTimeout(r, 40));
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

async function clickAt(send, x, y) {
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: x0, y: y0 });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: x0, y: y0, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: x0, y: y0, button: "left", clickCount: 1 });
}

function pointExpr(kind) {
  return `(() => {
    const header = document.querySelector(".content-col > .app-header");
    if (!header) return null;
    const hr = header.getBoundingClientRect();
    let x;
    let y;
    if (${JSON.stringify(kind)} === "bell") {
      const b = header.querySelector("button");
      const r = b.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    } else if (${JSON.stringify(kind)} === "edge") {
      x = hr.left + 18;
      y = hr.top + 3;
    } else {
      const nodes = [...header.querySelectorAll(".brand-text, .crumb")];
      const title = nodes.find((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 8 && r.height > 8;
      });
      if (!title) return null;
      const r = title.getBoundingClientRect();
      x = r.left + Math.min(28, r.width / 2);
      y = r.top + r.height / 2;
    }
    const el = document.elementFromPoint(x, y);
    const control = el?.closest?.("button, input, textarea, select, label, a, [data-go], [data-action]");
    return {
      x, y,
      inHeader: !!(el && header.contains(el)),
      control: control && header.contains(control) ? (control.getAttribute("data-go") || control.tagName) : "",
      hit: el ? (el.className && el.className.baseVal) || String(el.className || el.tagName) : ""
    };
  })()`;
}

const metricsExpr = `(() => {
  const main = document.querySelector(".content-col > .main");
  const side = document.querySelector(".sidebar");
  const sheet = document.querySelector(".sheet");
  return {
    main: main ? main.scrollTop : null,
    mark: main ? main.dataset.scrollMark || "" : "",
    side: side ? side.scrollTop : null,
    sheet: sheet ? sheet.scrollTop : null,
    win: window.scrollY || document.documentElement.scrollTop || 0,
    hash: location.hash,
    guide: !!document.querySelector("[data-usage-guide]"),
    h1: document.querySelector("h1")?.textContent || "",
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    mainOverflow: !!(main && main.scrollWidth > main.clientWidth + 1),
    vw: window.innerWidth,
    fab: !!document.querySelector("[data-back-top], .back-top")
  };
})()`;

async function readMetrics(send) {
  return evalJson(send, metricsExpr);
}

async function scrollMain(send, top) {
  const value = await evalJson(send, `(() => {
    const main = document.querySelector(".content-col > .main");
    if (!main) return null;
    main.dataset.scrollMark = "stay";
    main.scrollTop = ${top};
    return main.scrollTop;
  })()`);
  if (!(value > 80)) throw new Error(`page did not scroll, scrollTop=${value}`);
  return value;
}

async function waitMainTop(send) {
  const start = Date.now();
  let last;
  while (Date.now() - start < 2500) {
    last = await readMetrics(send);
    if (last && last.main <= 1) return last;
    await new Promise((r) => setTimeout(r, 40));
  }
  throw new Error("content did not return to the top: " + JSON.stringify(last));
}

async function shot(send, name) {
  mkdirSync(artifactDir, { recursive: true });
  const data = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(artifactDir, name), Buffer.from(data.data, "base64"));
}

async function phone(send) {
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
}

async function main() {
  const server = await startServer();
  const origin = `http://127.0.0.1:${port}/index.html`;
  const profile = mkdtempSync(join(tmpdir(), "scroll-top-"));
  const chrome = spawn("google-chrome", [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run",
    "--remote-allow-origins=*", "--remote-debugging-port=9367", `--user-data-dir=${profile}`, "about:blank",
  ], { stdio: "ignore" });
  try {
    let version;
    for (let i = 0; i < 40 && !version; i++) {
      try { version = await fetch("http://127.0.0.1:9367/json/version").then((r) => r.json()); }
      catch { await new Promise((r) => setTimeout(r, 100)); }
    }
    if (!version) throw new Error("Chrome did not start");
    const page = (await fetch("http://127.0.0.1:9367/json/list").then((r) => r.json())).find((t) => t.type === "page");
    const { send, ws } = connect(page.webSocketDebuggerUrl);
    await send("Page.enable");
    await send("Runtime.enable");
    await phone(send);
    await send("Page.addScriptToEvaluateOnNewDocument", { source: SEED });
    await send("Page.navigate", { url: `${origin}#/guide-help` });
    await waitFor(send, `document.querySelector("[data-usage-guide] h1") ? true : null`);

    const laidOut = await readMetrics(send);
    if (laidOut.vw !== 390) throw new Error("viewport is " + laidOut.vw);
    if (laidOut.overflow || laidOut.mainOverflow) throw new Error("guide overflows horizontally: " + JSON.stringify(laidOut));
    if (laidOut.fab) throw new Error("unexpected back-to-top button");

    const before = await scrollMain(send, 900);
    const scrolled = await readMetrics(send);
    if (scrolled.h1 && scrolled.main < 80) throw new Error("guide title still counts as scrolled: " + JSON.stringify(scrolled));
    await shot(send, "tap-top-scrolled-390.png");

    const title = await evalJson(send, pointExpr("title"));
    if (!title?.inHeader || title.control) throw new Error("title tap would hit a control: " + JSON.stringify(title));
    await tap(send, title.x, title.y);
    const topped = await waitMainTop(send);
    if (topped.hash !== "#/guide-help") throw new Error("title tap changed route: " + topped.hash);
    if (topped.mark !== "stay") throw new Error("title tap re-rendered the page: " + JSON.stringify(topped));
    if (topped.win !== 0) throw new Error("title tap scrolled the window");
    if (!topped.guide || !topped.h1.includes("使用教學")) throw new Error("guide title missing after scroll: " + topped.h1);
    await shot(send, "tap-top-390.png");

    await scrollMain(send, 700);
    const edge = await evalJson(send, pointExpr("edge"));
    if (!edge?.inHeader || edge.control) throw new Error("top-edge tap would hit a control: " + JSON.stringify(edge));
    await tap(send, edge.x, edge.y);
    const edged = await waitMainTop(send);
    if (edged.hash !== "#/guide-help" || edged.mark !== "stay") throw new Error("top edge did not only scroll: " + JSON.stringify(edged));

    const bell = await evalJson(send, pointExpr("bell"));
    if (!bell?.inHeader || !bell.control) throw new Error("header button missing: " + JSON.stringify(bell));
    await tap(send, bell.x, bell.y);
    await waitFor(send, `location.hash === "#/remind" ? true : null`);
    const reminded = await readMetrics(send);
    if (reminded.guide) throw new Error("header button only scrolled, route stayed on the guide");
    if (reminded.hash !== "#/remind") throw new Error("header button route: " + reminded.hash);

    await evalJson(send, `location.hash = "#/shop"`);
    await waitFor(send, `document.querySelector(".tick-item [data-action='item-del']") ? true : null`);
    const shopBefore = await scrollMain(send, 500);
    await evalJson(send, `(() => {
      const row = document.querySelector(".tick-item[data-swipe-row]");
      row.classList.add("is-open");
      row.querySelector(".swipe-del-btn").click();
      return true;
    })()`);
    await waitFor(send, `!JSON.parse(localStorage.getItem("fdh-employer-v1")).shopItems.some((i) => i.id === "item-1") ? true : null`);
    const shopAfter = await readMetrics(send);
    const stored = await evalJson(send, `JSON.parse(localStorage.getItem("fdh-employer-v1")).shopItems.map((i) => i.id)`);
    if (stored.includes("item-1") || !stored.includes("item-2")) throw new Error("item delete result: " + stored.join(","));
    if (shopAfter.hash !== "#/shop") throw new Error("item delete changed route: " + shopAfter.hash);
    if (shopAfter.main < 40) throw new Error(`item delete jumped to the top (was ${shopBefore}, now ${shopAfter.main})`);
    if (JSON.parse(await evalJson(send, `localStorage.getItem("fdh-employer-v1")`)).helpers[0].name !== "Maria Santos") {
      throw new Error("item delete rewrote the helper record");
    }

    await scrollMain(send, 400);
    const shopTab = await evalJson(send, `(() => {
      const btn = document.querySelector(".tabbar [data-go='shop'][aria-current='page']");
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    if (!shopTab) throw new Error("selected shop tab is missing");
    await tap(send, shopTab.x, shopTab.y);
    const retab = await waitMainTop(send);
    if (retab.hash !== "#/shop" || retab.mark !== "stay") throw new Error("selected tab did not only scroll: " + JSON.stringify(retab));

    const leave = await evalJson(send, `(() => {
      const btn = document.querySelector(".tabbar [data-go='leave']");
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    await tap(send, leave.x, leave.y);
    await waitFor(send, `location.hash === "#/leave" ? true : null`);

    await evalJson(send, `localStorage.setItem("fdh-active-role-v1", "helper"); location.hash = "#/h-guide-help"; location.reload()`);
    await waitFor(send, `document.querySelector("[data-usage-guide][data-usage-role='helper'] h1") ? true : null`);
    await phone(send);
    await scrollMain(send, 800);
    const helperTitle = await evalJson(send, pointExpr("title"));
    if (!helperTitle?.inHeader || helperTitle.control) throw new Error("helper title tap would hit a control: " + JSON.stringify(helperTitle));
    await tap(send, helperTitle.x, helperTitle.y);
    const helperTop = await waitMainTop(send);
    if (!helperTop.hash.startsWith("#/h-guide-help")) throw new Error("helper title tap changed route: " + helperTop.hash);
    if (helperTop.mark !== "stay") throw new Error("helper title tap re-rendered: " + JSON.stringify(helperTop));
    if (helperTop.vw !== 390 || helperTop.overflow || helperTop.mainOverflow) throw new Error("helper guide overflow: " + JSON.stringify(helperTop));

    await evalJson(send, `localStorage.setItem("fdh-active-role-v1", "employer"); location.hash = "#/guide-help"; location.reload()`);
    await waitFor(send, `document.querySelector(".app-header") ? true : null`);
    await send("Emulation.setDeviceMetricsOverride", { width: 1100, height: 800, deviceScaleFactor: 1, mobile: false });
    await send("Emulation.setTouchEmulationEnabled", { enabled: false });
    await waitFor(send, `document.querySelector(".shell.has-nav .crumb") && window.innerWidth === 1100 ? true : null`);
    await waitFor(send, `document.querySelector("[data-usage-guide] h1") ? true : null`);
    const desktopScrolled = await evalJson(send, `(() => {
      const side = document.querySelector(".sidebar");
      side.style.maxHeight = "100dvh";
      side.style.overflowY = "auto";
      const filler = document.createElement("div");
      filler.style.cssText = "height:1800px;flex:0 0 auto";
      side.appendChild(filler);
      side.scrollTop = 160;
      const main = document.querySelector(".content-col > .main");
      main.dataset.scrollMark = "stay";
      main.scrollTop = 640;
      return { main: main.scrollTop, side: side.scrollTop, sideH: side.scrollHeight, sideC: side.clientHeight, win: window.scrollY || 0 };
    })()`);
    if (desktopScrolled.main < 80 || desktopScrolled.side < 40) throw new Error("desktop scrollers: " + JSON.stringify(desktopScrolled));
    const crumb = await evalJson(send, pointExpr("title"));
    if (!crumb?.inHeader || crumb.control) throw new Error("desktop title is not tappable chrome: " + JSON.stringify(crumb));
    await clickAt(send, crumb.x, crumb.y);
    const desktopTop = await waitMainTop(send);
    if (desktopTop.mark !== "stay" || !desktopTop.hash.startsWith("#/guide-help")) throw new Error("desktop header changed the page: " + JSON.stringify(desktopTop));
    if (desktopTop.side < 40) throw new Error("desktop header scrolled the sidebar: " + desktopTop.side);
    if (desktopTop.win !== 0) throw new Error("desktop header scrolled the window");

    await evalJson(send, `location.hash = "#/shop"`);
    await waitFor(send, `document.querySelector("[data-action='shop-new']") ? true : null`);
    await scrollMain(send, 240);
    await evalJson(send, `document.querySelector("[data-action='shop-new']").click()`);
    await waitFor(send, `document.querySelector(".sheet") ? true : null`);
    const sheetBefore = await evalJson(send, `(() => {
      const sheet = document.querySelector(".sheet");
      sheet.style.maxHeight = "220px";
      const pad = document.createElement("div");
      pad.style.height = "900px";
      sheet.appendChild(pad);
      sheet.scrollTop = 150;
      const main = document.querySelector(".content-col > .main");
      return { sheet: sheet.scrollTop, main: main.scrollTop };
    })()`);
    if (sheetBefore.sheet < 40 || sheetBefore.main < 40) throw new Error("sheet setup: " + JSON.stringify(sheetBefore));
    // The sheet backdrop covers the header, so this checks the handler's container choice directly.
    await evalJson(send, `document.querySelector(".content-col > .app-header").click()`);
    const sheetAfter = await waitMainTop(send);
    if (sheetAfter.sheet < 40) throw new Error("header scrolled the open sheet: " + JSON.stringify(sheetAfter));
    if (sheetAfter.hash !== "#/shop") throw new Error("sheet header tap changed route: " + sheetAfter.hash);

    console.log(JSON.stringify({
      ok: true,
      scrolled: before,
      screenshot: "tap-top-390.png",
      helper: helperTop.hash,
      desktopSide: desktopTop.side,
      itemScroll: shopAfter.main,
    }));
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
