/**
 * 390px check: five middle tabs, a blocked sixth, reload, role split, no bar overflow.
 * Uses system Chrome. Skips cleanly when Chrome is not installed.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const chromeBin = process.env.CHROME_BIN || "google-chrome";
const artifactDir = process.env.ARTIFACT_DIR || "/opt/cursor/artifacts";

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
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
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
  async function send(method, params = {}) {
    await waitOpen;
    const msgId = ++id;
    return new Promise((resolve, reject) => {
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }
  return { send, ws };
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
    restDay: 0
  }],
  currentHelperId: "helper-1",
  settings: { notifications: false }
}));
localStorage.setItem("fdh-helper-session-v1", JSON.stringify({
  pin: "123456",
  payload: { helper: { id: "helper-1", name: "Maria Santos" }, shareId: "layout-check" }
}));
`;

function layoutExpression() {
  return `(() => {
    const bar = document.querySelector(".tabbar");
    if (!bar) return null;
    const buttons = [...bar.querySelectorAll(".tab-btn")];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const barBox = bar.getBoundingClientRect();
    const selected = [...document.querySelectorAll("[data-action='nav-tab-remove']")].map((b) => b.getAttribute("data-id"));
    const adds = [...document.querySelectorAll("[data-action='nav-tab-add']")].map((b) => ({ id: b.getAttribute("data-id"), disabled: b.disabled }));
    const count = document.querySelector(".prefs-count")?.textContent || "";
    const help = document.querySelector(".prefs-card p.tiny")?.textContent || "";
    const outside = buttons.filter((b) => {
      const r = b.getBoundingClientRect();
      return r.left < -1 || r.right > vw + 1 || r.width < 8;
    }).map((b) => b.innerText.replace(/\\s+/g, " "));
    return {
      href: location.hash,
      cols: buttons.length,
      labels: buttons.map((b) => b.innerText.replace(/\\s+/g, " ").trim()),
      dense: bar.classList.contains("is-dense"),
      selected,
      adds,
      count,
      help,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      barScroll: bar.scrollWidth,
      barClient: bar.clientWidth,
      barHeight: Math.round(barBox.height),
      barRight: Math.round(barBox.right),
      vw, vh,
      outside,
      bodyOverflow: document.documentElement.scrollWidth > vw + 1
    };
  })()`;
}

async function showMore(send, hash) {
  await evalJson(send, `location.hash = ${JSON.stringify(hash)}`);
  await waitFor(send, `document.querySelector(".prefs-card") ? true : null`);
}

async function pin(send, id) {
  const result = await evalJson(send, `(() => {
    const id = ${JSON.stringify(id)};
    const selected = () => [...document.querySelectorAll("[data-action='nav-tab-remove']")].map((b) => b.getAttribute("data-id"));
    if (selected().includes(id)) return "already";
    if (selected().length >= 5) {
      const remove = document.querySelector("[data-action='nav-tab-remove']");
      if (!remove) return "cannot-remove";
      remove.click();
    }
    const add = document.querySelector("[data-action='nav-tab-add'][data-id='" + id + "']");
    if (!add) return "missing:" + selected().join(",");
    add.disabled = false;
    add.click();
    return selected().includes(id) ? "pinned" : "not-pinned:" + selected().join(",");
  })()`);
  if (result !== "already" && result !== "pinned") throw new Error(`pin ${id}: ${result}`);
}

async function openPinned(send, id, readyExpr) {
  const clicked = await evalJson(send, `(() => {
    const btn = document.querySelector(".tabbar [data-go='${id}']");
    if (!btn) return "no-tab";
    btn.click();
    return "ok";
  })()`);
  if (clicked !== "ok") throw new Error(`${id} tab: ${clicked}`);
  await waitFor(send, readyExpr);
  const current = await evalJson(send, `document.querySelector(".tabbar [aria-current='page']")?.getAttribute("data-go") || ""`);
  if (current !== id) throw new Error(`${id} highlight is ${current}`);
  const fit = await evalJson(send, layoutExpression());
  if (!fit) throw new Error(`${id} has no tab bar`);
  assertFit(fit, id);
  return fit;
}

async function main() {
  const server = await startServer();
  const port = server.address().port;
  const origin = `http://127.0.0.1:${port}/index.html`;
  const profile = mkdtempSync(join(tmpdir(), "nav-chrome-"));
  const chrome = spawn(chromeBin, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--remote-allow-origins=*",
    "--remote-debugging-port=9333",
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: "ignore" });

  try {
    let version;
    for (let i = 0; i < 40; i++) {
      try {
        version = await fetch("http://127.0.0.1:9333/json/version").then((r) => r.json());
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    if (!version) throw new Error("Chrome DevTools did not start");
    const targets = await fetch("http://127.0.0.1:9333/json/list").then((r) => r.json());
    const page = targets.find((t) => t.type === "page");
    const { send, ws } = connect(page.webSocketDebuggerUrl);
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send("Page.addScriptToEvaluateOnNewDocument", { source: SEED });
    await send("Page.navigate", { url: `${origin}#/more` });
    await waitFor(send, `document.querySelector(".prefs-card") ? true : null`);
    const earlyAdds = await evalJson(send, `[...document.querySelectorAll("[data-action='nav-tab-add']")].map((b) => b.getAttribute("data-id"))`);
    for (const id of ["remind", "recipes", "helper-edit", "guide", "backup"]) {
      if (!earlyAdds.includes(id)) throw new Error("employer available list missing " + id + ": " + earlyAdds.join(","));
    }
    for (const id of ["h-remind", "h-recipes", "h-rights", "home", "more"]) {
      if (earlyAdds.includes(id)) throw new Error("employer available list should not offer " + id);
    }
    mkdirSync(artifactDir, { recursive: true });
    await evalJson(send, `document.querySelector("[data-action='nav-tab-add'][data-id='remind']")?.closest(".nav-pick-row")?.scrollIntoView({ block: "center" })`);
    await new Promise((r) => setTimeout(r, 80));
    const availableShot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(artifactDir, "nav-available-zh-390.png"), Buffer.from(availableShot.data, "base64"));

    const addTwo = await evalJson(send, `(() => {
      for (const id of ["shop", "menu"]) {
        const btn = document.querySelector("[data-action='nav-tab-add'][data-id='" + id + "']");
        if (!btn || btn.disabled) return "missing " + id;
        btn.click();
      }
      return "ok";
    })()`);
    if (addTwo !== "ok") throw new Error(addTwo);
    await waitFor(send, `document.querySelectorAll("[data-action='nav-tab-remove']").length === 5 ? true : null`);

    const forced = await evalJson(send, `(() => {
      const btn = document.querySelector("[data-action='nav-tab-add'][data-id='pay']");
      if (!btn) return "no pay button";
      const wasDisabled = btn.disabled;
      btn.disabled = false;
      btn.click();
      return wasDisabled ? "was-disabled" : "was-enabled";
    })()`);
    if (forced !== "was-disabled") throw new Error("sixth add button was not disabled: " + forced);
    await new Promise((r) => setTimeout(r, 150));
    let state = await evalJson(send, layoutExpression());
    if (state.selected.length !== 5) throw new Error("sixth click changed the selection: " + JSON.stringify(state.selected));
    if (state.selected.includes("pay")) throw new Error("pay was stored");
    if (!state.adds.every((a) => a.disabled)) throw new Error("an add button stayed enabled at five: " + JSON.stringify(state.adds));
    if (!state.count.includes("5/5") || !state.count.includes("更多")) throw new Error("zh counter: " + state.count);
    if (state.cols !== 7) throw new Error("tab bar should be Home + 5 + More, got " + state.cols + " " + state.labels.join("|"));
    if (state.labels[0] !== "首頁" || state.labels.at(-1) !== "更多") throw new Error("fixed ends missing: " + state.labels.join("|"));
    assertFit(state, "zh");

    await evalJson(send, `document.querySelector("[data-action='nav-tab-remove'][data-id='menu']").click()`);
    await waitFor(send, `document.querySelectorAll("[data-action='nav-tab-remove']").length === 4 ? true : null`);
    const readd = await evalJson(send, `(() => {
      const btn = document.querySelector("[data-action='nav-tab-add'][data-id='menu']");
      if (!btn || btn.disabled) return "menu not available";
      btn.click();
      return "ok";
    })()`);
    if (readd !== "ok") throw new Error(readd);
    await waitFor(send, `document.querySelector("[data-action='nav-tab-remove'][data-id='menu']") ? true : null`);

    await send("Page.reload", { ignoreCache: true });
    await waitFor(send, `document.querySelectorAll("[data-action='nav-tab-remove']").length === 5 ? true : null`);
    state = await evalJson(send, layoutExpression());
    if (state.selected.length !== 5 || !state.selected.includes("menu")) throw new Error("reload lost the selection: " + JSON.stringify(state.selected));
    assertFit(state, "zh reload");

    await evalJson(send, `document.querySelector(".prefs-card").scrollIntoView({ block: "start" })`);
    await new Promise((r) => setTimeout(r, 120));
    const zhShot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(artifactDir, "nav-five-zh-390.png"), Buffer.from(zhShot.data, "base64"));

    await evalJson(send, `document.querySelector("[data-action='set-lang'][data-lang='en']").click()`);
    await waitFor(send, `document.querySelector(".prefs-count") && document.querySelector(".prefs-count").textContent.includes("5 of 5") ? true : null`);
    state = await evalJson(send, layoutExpression());
    if (!state.count.includes("5 of 5") || !state.count.includes("More")) throw new Error("en counter: " + state.count);
    if (state.labels[0] !== "Home" || state.labels.at(-1) !== "More") throw new Error("en ends: " + state.labels.join("|"));
    if (state.cols !== 7) throw new Error("en tab count " + state.cols);
    assertFit(state, "en");
    const enLabels = state.labels.slice();
    await evalJson(send, `document.querySelector(".tabbar").scrollIntoView()`);
    const enShot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(artifactDir, "nav-five-en-390.png"), Buffer.from(enShot.data, "base64"));

    const employerSaved = await evalJson(send, `localStorage.getItem("fdh-ui-prefs-v1")`);
    await evalJson(send, `document.querySelector("[data-action='choose-role'][data-role='helper']").click()`);
    await waitFor(send, `location.hash === "#/h" || location.hash === "#/h-enter" ? true : null`);
    await evalJson(send, `location.hash = "#/h-more"`);
    await waitFor(send, `document.querySelector(".prefs-count") && document.querySelector("[data-go='h-more']") ? true : null`);
    state = await evalJson(send, layoutExpression());
    const helperSelected = state.selected;
    if (helperSelected.length !== 3) throw new Error("helper should keep its own 3 defaults, got " + JSON.stringify(helperSelected));
    if (helperSelected.some((id) => !id.startsWith("h-"))) throw new Error("helper list mixed with employer ids: " + JSON.stringify(helperSelected));
    if (state.labels.at(-1) !== "More") throw new Error("helper More missing: " + state.labels.join("|"));
    const still = await evalJson(send, `localStorage.getItem("fdh-ui-prefs-v1")`);
    const parsed = JSON.parse(still);
    if (JSON.stringify(parsed.employer.tabs) !== JSON.stringify(JSON.parse(employerSaved).employer.tabs)) {
      throw new Error("switching role rewrote employer tabs");
    }
    if (parsed.employer.tabs.length !== 5) throw new Error("employer tabs were not kept at five");
    const business = await evalJson(send, `localStorage.getItem("fdh-employer-v1")`);
    if (!business.includes("Maria Santos")) throw new Error("helper record was cleared");
    assertFit(state, "helper");
    for (const id of ["h-remind", "h-recipes", "h-rights"]) {
      if (!state.adds.some((a) => a.id === id)) throw new Error("helper available list missing " + id);
    }

    const helperVisits = [
      ["h-remind", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("Reminders") ? true : null`],
      ["h-recipes", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("Recipes") ? true : null`],
      ["h-rights", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("Your rights and key points") ? true : null`],
    ];
    for (const [id, ready] of helperVisits) {
      await showMore(send, "#/h-more");
      await pin(send, id);
      await openPinned(send, id, ready);
    }
    await showMore(send, "#/h-more");
    const helperSixth = await evalJson(send, `(() => {
      const btn = document.querySelector("[data-action='nav-tab-add']:not([disabled])");
      const blocked = document.querySelector("[data-action='nav-tab-add'][disabled]");
      return { open: btn ? btn.getAttribute("data-id") : "", blocked: !!blocked, n: document.querySelectorAll("[data-action='nav-tab-remove']").length };
    })()`);
    if (helperSixth.n !== 5 || !helperSixth.blocked || helperSixth.open) {
      throw new Error("helper sixth was not blocked: " + JSON.stringify(helperSixth));
    }
    await showMore(send, "#/h-more");
    await evalJson(send, `document.querySelector(".tabbar [data-go='h-recipes']").click()`);
    await waitFor(send, `document.querySelector(".recipe-card") ? true : null`);
    await evalJson(send, `document.querySelector(".recipe-card").click()`);
    await waitFor(send, `document.querySelector("[data-action='cook-open']") ? true : null`);
    const helperRecipeTab = await evalJson(send, `document.querySelector(".tabbar [aria-current='page']")?.getAttribute("data-go") || ""`);
    if (helperRecipeTab !== "h-recipes") throw new Error("helper recipe detail highlighted " + helperRecipeTab);
    await evalJson(send, `document.querySelector("[data-action='cook-open']").click()`);
    await waitFor(send, `document.querySelector(".cook") ? true : null`);
    const helperCookTab = await evalJson(send, `document.querySelector(".tabbar [aria-current='page']")?.getAttribute("data-go") || ""`);
    if (helperCookTab !== "h-recipes") throw new Error("helper cook mode highlighted " + helperCookTab);

    await showMore(send, "#/h-more");
    await evalJson(send, `document.querySelector("[data-action='choose-role'][data-role='employer']").click()`);
    await waitFor(send, `location.hash === "#/home" ? true : null`);
    const employerVisits = [
      ["remind", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("Reminders") ? true : null`],
      ["recipes", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("Recipes") ? true : null`],
      ["helper-edit", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("Edit helper details") ? true : null`],
      ["guide", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("Hiring a helper: key points") ? true : null`],
      ["backup", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("Backup and restore") ? true : null`],
    ];
    for (const [id, ready] of employerVisits) {
      await showMore(send, "#/more");
      await pin(send, id);
      await openPinned(send, id, ready);
    }
    await showMore(send, "#/more");
    await evalJson(send, `document.querySelector(".tabbar [data-go='helper-edit']").click()`);
    await waitFor(send, `document.querySelector("input[name='name']") ? true : null`);
    const editedName = await evalJson(send, `document.querySelector("input[name='name']").value`);
    if (editedName !== "Maria Santos") throw new Error("helper form name changed: " + editedName);
    await showMore(send, "#/more");
    await evalJson(send, `document.querySelector(".tabbar [data-go='recipes']").click()`);
    await waitFor(send, `document.querySelector(".recipe-card") ? true : null`);
    await evalJson(send, `document.querySelector(".recipe-card").click()`);
    await waitFor(send, `document.querySelector(".recipe-detail") ? true : null`);
    const recipeTab = await evalJson(send, `document.querySelector(".tabbar [aria-current='page']")?.getAttribute("data-go") || ""`);
    if (recipeTab !== "recipes") throw new Error("recipe detail highlighted " + recipeTab);
    await evalJson(send, `document.querySelector("[data-action='cook-open']").click()`);
    await waitFor(send, `document.querySelector(".cook") ? true : null`);
    const cookTab = await evalJson(send, `document.querySelector(".tabbar [aria-current='page']")?.getAttribute("data-go") || ""`);
    if (cookTab !== "recipes") throw new Error("cook mode highlighted " + cookTab);
    await showMore(send, "#/more");
    const employerSixth = await evalJson(send, `(() => {
      const open = [...document.querySelectorAll("[data-action='nav-tab-add']:not([disabled])")].map((b) => b.getAttribute("data-id"));
      const btn = document.querySelector("[data-action='nav-tab-add'][data-id='leave']");
      if (btn) { btn.disabled = false; btn.click(); }
      const selected = [...document.querySelectorAll("[data-action='nav-tab-remove']")].map((b) => b.getAttribute("data-id"));
      return { open, selected };
    })()`);
    if (employerSixth.open.length) throw new Error("a sixth employer add stayed enabled: " + JSON.stringify(employerSixth.open));
    if (employerSixth.selected.includes("leave") || employerSixth.selected.length !== 5) {
      throw new Error("sixth employer add changed the bar: " + JSON.stringify(employerSixth.selected));
    }
    state = await evalJson(send, layoutExpression());
    assertFit(state, "long labels");
    const longShot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(artifactDir, "nav-long-labels-en-390.png"), Buffer.from(longShot.data, "base64"));
    const beforeReload = state.selected.slice();
    await send("Page.reload", { ignoreCache: true });
    await waitFor(send, `document.querySelectorAll("[data-action='nav-tab-remove']").length === 5 ? true : null`);
    state = await evalJson(send, layoutExpression());
    if (JSON.stringify(state.selected) !== JSON.stringify(beforeReload)) {
      throw new Error("reload lost restored tabs: " + JSON.stringify(state.selected));
    }
    const businessAfter = await evalJson(send, `localStorage.getItem("fdh-employer-v1")`);
    if (!businessAfter.includes("Maria Santos")) throw new Error("reload cleared the helper record");
    assertFit(state, "long labels reload");

    console.log(JSON.stringify({
      zhFit: "ok",
      enLabels,
      helperSelected,
      helperLabels: state.labels,
      restoredTabs: state.selected,
      screenshots: ["nav-available-zh-390.png", "nav-five-zh-390.png", "nav-five-en-390.png", "nav-long-labels-en-390.png"],
    }, null, 2));
    ws.close();
  } finally {
    chrome.kill("SIGKILL");
    server.close();
    await new Promise((r) => setTimeout(r, 200));
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    } catch {
      /* profile cleanup is not part of the check */
    }
  }
}

function assertFit(state, label) {
  if (state.vw !== 390) throw new Error(`${label} viewport is ${state.vw}, expected 390`);
  if (state.bodyOverflow) throw new Error(`${label} document overflows: scroll ${state.scrollWidth} > ${state.clientWidth}`);
  if (state.barScroll > state.barClient + 1) throw new Error(`${label} tab bar overflows ${state.barScroll} > ${state.barClient}`);
  if (state.outside.length) throw new Error(`${label} tabs outside the viewport: ${state.outside.join(", ")}`);
  if (state.barRight > state.vw + 1) throw new Error(`${label} tab bar extends to ${state.barRight}`);
  if (state.barHeight > state.vh * 0.12) throw new Error(`${label} tab bar is ${state.barHeight}px, over 12% of ${state.vh}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
