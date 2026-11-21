/**
 * 390px check: usage guide for both roles, no horizontal overflow, figures render,
 * helper guide hides employer-only actions, and a pinned guide tab highlights.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdirSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const chromeBin = process.env.CHROME_BIN || "google-chrome";
const artifactDir = process.env.ARTIFACT_DIR || "/opt/cursor/artifacts";
const port = 9355;

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

const SEED = `
localStorage.setItem("fdh-lang-v1", "zh-Hant");
localStorage.setItem("fdh-active-role-v1", "employer");
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
    foodAllowance: 1236,
    restDay: "arranged"
  }],
  currentHelperId: "helper-1",
  settings: { notifications: false }
}));
localStorage.setItem("fdh-helper-session-v1", JSON.stringify({
  pin: "123456",
  payload: {
    helper: {
      id: "helper-1",
      name: "Maria Santos",
      startDate: "2026-02-01",
      contractStart: "2026-02-01",
      contractEnd: "2028-01-31",
      wage: 5220,
      foodProvided: true,
      restDay: "arranged"
    },
    shareId: "layout-guide",
    generatedAt: "2026-11-20T02:00:00.000Z"
  }
}));
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
      const body = readFileSync(file);
      res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("missing");
    }
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
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
    await new Promise((r) => setTimeout(r, 80));
  }
  throw new Error(`timeout waiting for ${expression}\nlast=${JSON.stringify(last)}`);
}

function layoutExpression() {
  return `(() => {
    const vw = window.innerWidth;
    const imgs = [...document.querySelectorAll(".guide-figure img")];
    const wide = imgs.filter((img) => {
      const r = img.getBoundingClientRect();
      return r.width > 0 && (r.right > vw + 1 || r.left < -1);
    }).map((img) => img.getAttribute("src"));
    const guide = document.querySelector("[data-usage-guide]");
    return {
      vw,
      href: location.hash,
      h1: document.querySelector("h1")?.textContent || "",
      headings: [...document.querySelectorAll(".usage-section h2")].map((h) => h.textContent),
      sections: [...document.querySelectorAll("[data-usage-section]")].map((s) => s.getAttribute("data-usage-section")),
      only: [...document.querySelectorAll("[data-usage-only]")].map((s) => s.getAttribute("data-usage-only")),
      role: guide?.getAttribute("data-usage-role") || "",
      text: guide?.textContent || "",
      imgs: imgs.length,
      loaded: imgs.filter((img) => img.complete && img.naturalWidth > 0).length,
      firstSrc: imgs[0]?.getAttribute("src") || "",
      firstAlt: imgs[0]?.getAttribute("alt") || "",
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      wide,
      current: document.querySelector(".tabbar [aria-current='page']")?.getAttribute("data-go") || "",
      selected: [...document.querySelectorAll("[data-action='nav-tab-remove']")].map((b) => b.getAttribute("data-id")),
      tip: !!document.querySelector("[data-usage-tip]"),
    };
  })()`;
}

async function openGuide(send, hash) {
  await evalJson(send, `location.hash = ${JSON.stringify(hash)}`);
  await waitFor(send, `document.querySelector("[data-usage-guide] h1") ? true : null`);
  await waitFor(send, `(() => { const img = document.querySelector(".guide-figure img"); return img && img.complete && img.naturalWidth > 0 ? true : null; })()`);
}

async function assertGuide(send, { role, headings, forbidden, required, imagePrefix }) {
  const state = await evalJson(send, layoutExpression());
  if (state.vw !== 390) throw new Error(`${role} viewport is ${state.vw}`);
  if (state.h1 !== "使用教學") throw new Error(`${role} title is ${state.h1}`);
  if (state.role !== role) throw new Error(`${role} guide role is ${state.role}`);
  if (state.scrollWidth > state.clientWidth + 1) throw new Error(`${role} overflows ${state.scrollWidth} > ${state.clientWidth}`);
  if (state.wide.length) throw new Error(`${role} images overflow: ${state.wide.join(",")}`);
  if (!state.imgs) throw new Error(`${role} guide has no images`);
  if (!state.loaded) throw new Error(`${role} guide image did not render`);
  if (!state.firstSrc.includes(imagePrefix)) throw new Error(`${role} first image is ${state.firstSrc}`);
  if (!state.firstAlt) throw new Error(`${role} first image has no alt`);
  for (const heading of headings) {
    if (!state.headings.includes(heading)) throw new Error(`${role} missing heading ${heading}: ${state.headings.join("|")}`);
  }
  for (const phrase of forbidden) {
    if (state.text.includes(phrase)) throw new Error(`${role} guide offers “${phrase}”`);
  }
  for (const phrase of required) {
    if (!state.text.includes(phrase)) throw new Error(`${role} guide missing “${phrase}”`);
  }
  const focus = await evalJson(send, `(() => {
    const buttons = [...document.querySelectorAll(".usage-guide button")];
    for (const b of buttons) {
      b.focus();
      if (document.activeElement !== b) return b.textContent.trim().slice(0, 40);
    }
    return "";
  })()`);
  if (focus) throw new Error(`${role} guide button not focusable: ${focus}`);
  return state;
}

async function shot(send, name) {
  const result = await send("Page.captureScreenshot", { format: "jpeg", quality: 60 });
  writeFileSync(join(artifactDir, name), Buffer.from(result.data, "base64"));
}

async function main() {
  mkdirSync(artifactDir, { recursive: true });
  const server = await startServer();
  const origin = `http://127.0.0.1:${server.address().port}/index.html`;
  const profile = mkdtempSync(join(tmpdir(), "guide-layout-"));
  const chrome = spawn(chromeBin, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--hide-scrollbars",
    `--remote-debugging-port=${port}`,
    "--remote-allow-origins=*",
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: "ignore" });

  try {
    let version;
    for (let i = 0; i < 40; i++) {
      try {
        version = await fetch(`http://127.0.0.1:${port}/json/version`).then((r) => r.json());
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    if (!version) throw new Error("Chrome DevTools did not start");
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
    const page = targets.find((t) => t.type === "page");
    const { send, ws } = connect(page.webSocketDebuggerUrl);
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
    await send("Page.addScriptToEvaluateOnNewDocument", { source: SEED });
    await send("Page.navigate", { url: `${origin}#/more` });
    await waitFor(send, `document.querySelector("[data-go='guide-help']") ? true : null`);

    const before = await evalJson(send, `localStorage.getItem("fdh-employer-v1")`);
    const tip = await evalJson(send, layoutExpression());
    if (!tip.tip) throw new Error("first visit to More should offer the guide tip");
    if (tip.selected.includes("guide-help")) throw new Error("guide is in the default employer tabs");
    if (JSON.stringify(tip.selected) !== JSON.stringify(["leave", "tasks", "rules"])) {
      throw new Error("default employer tabs changed: " + tip.selected.join(","));
    }
    const add = await evalJson(send, `(() => {
      const btn = document.querySelector("[data-action='nav-tab-add'][data-id='guide-help']");
      return btn ? (btn.disabled ? "disabled" : "ready") : "missing";
    })()`);
    if (add !== "ready") throw new Error("employer catalog add for guide-help: " + add);

    await evalJson(send, `document.querySelector("[data-action='usage-tip-dismiss']").click()`);
    await waitFor(send, `document.querySelector("[data-usage-tip]") ? null : true`);
    const after = await evalJson(send, `localStorage.getItem("fdh-employer-v1")`);
    if (after !== before) throw new Error("dismissing the tip changed household records");
    const flag = await evalJson(send, `localStorage.getItem("fdh-usage-tip-v1")`);
    if (flag !== "1") throw new Error("tip dismiss flag is " + flag);

    await openGuide(send, "#/guide-help");
    let state = await assertGuide(send, {
      role: "employer",
      headings: ["買餸清單", "工作安排", "工作守則", "外傭資料與合約", "外傭查看方式", "備份與還原"],
      forbidden: [],
      required: ["傳更新給外傭", "更新至最新版本", "不是家中雲端即時同步"],
      imagePrefix: "images/guide/employer-",
    });
    if (!state.only.includes("employer") || state.only.includes("helper")) {
      throw new Error("employer-only markers: " + state.only.join(","));
    }
    if (state.current !== "more") throw new Error("unpinned employer guide should highlight More, got " + state.current);
    await evalJson(send, `(() => { const main = document.querySelector(".main"); if (main) main.scrollTop = 0; })()`);
    await new Promise((r) => setTimeout(r, 150));
    await shot(send, "guide-employer-390.jpg");
    await evalJson(send, `document.getElementById("usage-shop")?.scrollIntoView({ block: "start" })`);
    await new Promise((r) => setTimeout(r, 200));
    await waitFor(send, `(() => { const img = document.querySelector("#usage-shop img"); return img && img.complete && img.naturalWidth > 0 ? true : null; })()`);
    const shopFit = await evalJson(send, layoutExpression());
    if (shopFit.scrollWidth > shopFit.clientWidth + 1 || shopFit.wide.length) {
      throw new Error("employer shop section overflows " + JSON.stringify({ scroll: shopFit.scrollWidth, wide: shopFit.wide }));
    }
    await shot(send, "guide-employer-shop-390.jpg");

    await evalJson(send, `location.hash = "#/more"`);
    await waitFor(send, `document.querySelector("[data-action='nav-tab-add'][data-id='guide-help']") ? true : null`);
    await evalJson(send, `document.querySelector("[data-action='nav-tab-add'][data-id='guide-help']").click()`);
    await waitFor(send, `document.querySelector(".tabbar [data-go='guide-help']") ? true : null`);
    await evalJson(send, `document.querySelector(".tabbar [data-go='guide-help']").click()`);
    await waitFor(send, `document.querySelector(".tabbar [aria-current='page']")?.getAttribute("data-go") === "guide-help" ? true : null`);
    await evalJson(send, `location.hash = "#/guide-help/shop"`);
    await waitFor(send, `document.querySelector(".tabbar [aria-current='page']")?.getAttribute("data-go") === "guide-help" ? true : null`);
    const nested = await evalJson(send, `document.getElementById("usage-shop") ? true : null`);
    if (!nested) throw new Error("nested guide section did not render");

    await evalJson(send, `location.hash = "#/more"`);
    await waitFor(send, `document.querySelector("[data-action='nav-tab-remove'][data-id='guide-help']") ? true : null`);
    await evalJson(send, `document.querySelector("[data-action='nav-tab-remove'][data-id='guide-help']").click()`);
    await openGuide(send, "#/guide-help");
    state = await evalJson(send, layoutExpression());
    if (state.current !== "more") throw new Error("after unpin, employer guide highlight is " + state.current);
    if (state.selected.includes("guide-help")) throw new Error("guide stayed pinned");

    await evalJson(send, `location.hash = "#/more"`);
    await waitFor(send, `document.querySelector("[data-action='choose-role'][data-role='helper']") ? true : null`);
    await evalJson(send, `document.querySelector("[data-action='choose-role'][data-role='helper']").click()`);
    await waitFor(send, `location.hash === "#/h" || location.hash === "#/h-enter" ? true : null`);
    await evalJson(send, `location.hash = "#/h-more"`);
    await waitFor(send, `document.querySelector("[data-go='h-guide-help']") ? true : null`);
    const helperBar = await evalJson(send, layoutExpression());
    if (helperBar.selected.includes("h-guide-help")) throw new Error("guide is in the default helper tabs");
    if (JSON.stringify(helperBar.selected) !== JSON.stringify(["h-leave", "h-tasks", "h-rules"])) {
      throw new Error("default helper tabs changed: " + helperBar.selected.join(","));
    }
    const helperAdd = await evalJson(send, `document.querySelector("[data-action='nav-tab-add'][data-id='h-guide-help']") && !document.querySelector("[data-action='nav-tab-add'][data-id='h-guide-help']").disabled ? true : null`);
    if (!helperAdd) throw new Error("helper catalog cannot add the user guide");

    await openGuide(send, "#/h-guide-help");
    state = await assertGuide(send, {
      role: "helper",
      headings: ["買餸清單", "工作安排", "工作守則", "接收更新", "你的權利與注意事項", "鎖定此查看"],
      forbidden: ["傳更新給外傭", "外傭資料與合約", "匯出 JSON", "由網頁新增菜譜", "登記發薪記錄", "複製到我的菜譜"],
      required: ["不是即時雲端同步", "這裡沒有刪除整份清單的操作", "更新至最新版本"],
      imagePrefix: "images/guide/helper-",
    });
    if (state.only.includes("employer")) throw new Error("helper guide includes an employer-only section");
    if (!state.only.includes("helper")) throw new Error("helper guide missing helper-only sections");
    if (state.current !== "h-more") throw new Error("unpinned helper guide should highlight More, got " + state.current);
    await evalJson(send, `(() => { const main = document.querySelector(".main"); if (main) main.scrollTop = 0; })()`);
    await new Promise((r) => setTimeout(r, 150));
    await shot(send, "guide-helper-390.jpg");
    await evalJson(send, `document.getElementById("usage-shop")?.scrollIntoView({ block: "start" })`);
    await new Promise((r) => setTimeout(r, 250));
    await waitFor(send, `(() => { const img = document.querySelector("#usage-shop img"); return img && img.complete && img.naturalWidth > 0 ? true : null; })()`);
    const helperShop = await evalJson(send, layoutExpression());
    if (helperShop.scrollWidth > helperShop.clientWidth + 1 || helperShop.wide.length) {
      throw new Error("helper shop section overflows " + JSON.stringify({ scroll: helperShop.scrollWidth, wide: helperShop.wide }));
    }
    await shot(send, "guide-helper-shop-390.jpg");

    await evalJson(send, `location.hash = "#/h-more"`);
    await waitFor(send, `document.querySelector("[data-action='nav-tab-add'][data-id='h-guide-help']") ? true : null`);
    await evalJson(send, `document.querySelector("[data-action='nav-tab-add'][data-id='h-guide-help']").click()`);
    await waitFor(send, `document.querySelector(".tabbar [data-go='h-guide-help']") ? true : null`);
    await evalJson(send, `document.querySelector(".tabbar [data-go='h-guide-help']").click()`);
    await waitFor(send, `document.querySelector(".tabbar [aria-current='page']")?.getAttribute("data-go") === "h-guide-help" ? true : null`);
    await evalJson(send, `location.hash = "#/h-more"`);
    await waitFor(send, `document.querySelector("[data-action='nav-tab-remove'][data-id='h-guide-help']") ? true : null`);
    const blocked = await evalJson(send, `(() => {
      const selected = [...document.querySelectorAll("[data-action='nav-tab-remove']")].map((b) => b.getAttribute("data-id"));
      return { n: selected.length, has: selected.includes("h-guide-help") };
    })()`);
    if (!blocked.has || blocked.n !== 4) throw new Error("helper pin did not stick: " + JSON.stringify(blocked));
    await evalJson(send, `document.querySelector("[data-action='nav-tab-remove'][data-id='h-guide-help']").click()`);
    await openGuide(send, "#/h-guide-help");
    state = await evalJson(send, layoutExpression());
    if (state.current !== "h-more") throw new Error("after unpin, helper guide highlight is " + state.current);

    const business = await evalJson(send, `localStorage.getItem("fdh-employer-v1")`);
    if (!business.includes("Maria Santos")) throw new Error("guide navigation cleared the helper record");
    console.log(JSON.stringify({
      employerSections: (await evalJson(send, `document.querySelectorAll("[data-usage-section]").length`)),
      highlight: state.current,
      shots: ["guide-employer-390.jpg", "guide-employer-shop-390.jpg", "guide-helper-390.jpg", "guide-helper-shop-390.jpg"],
    }));
    ws.close();
  } finally {
    chrome.kill("SIGKILL");
    server.close();
    await new Promise((r) => setTimeout(r, 200));
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    } catch {
      /* ignore */
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
