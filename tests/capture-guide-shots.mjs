/**
 * Capture 390px screenshots of the real UI for images/guide/.
 * Sample names only. Re-run when the screens these figures show have changed.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdirSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "images/guide");
const chromeBin = process.env.CHROME_BIN || "google-chrome";
const port = 9344;

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

const employer = {
  version: 2,
  currentHelperId: "helper-1",
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
    restDay: "arranged",
    phone: "91234567",
    notes: "示範備註，不會放進查看資料。",
    visaExpiry: "2027-06-30",
    passportExpiry: "2030-01-15",
    passportNo: "P0000000",
    hkidNo: "",
    docs: { passport: [], hkid: [] },
    winterChoice: "christmas",
    grantGeneralHolidays: false,
  }],
  leaveLogs: [],
  shStatuses: {},
  payments: [
    {
      id: "pay-oct",
      helperId: "helper-1",
      month: "2026-10",
      wage: 5220,
      food: 0,
      adjustments: 0,
      note: "示範：銀行轉賬",
      paidOn: "2026-10-31",
      method: "bank",
      consent: { status: "confirmed", at: "2026-10-31T10:00:00.000Z", by: "in-person", signature: "" },
      createdAt: "2026-10-31T10:00:00.000Z",
    },
    {
      id: "pay-nov",
      helperId: "helper-1",
      month: "2026-11",
      wage: 5220,
      food: 0,
      adjustments: 0,
      note: "",
      paidOn: "2026-11-07",
      method: "bank",
      consent: null,
      createdAt: "2026-11-07T10:00:00.000Z",
    },
  ],
  reminderState: {},
  guideChecks: {},
  arrangedRestDays: { "helper-1": ["2026-11-01", "2026-11-08", "2026-11-15", "2026-11-22", "2026-11-29"] },
  workTasks: [
    { id: "task-1", helperId: "helper-1", title: "打掃客廳", detail: "拖地及抹枱", schedule: "daily", weekdays: [], timeFrom: "09:00", timeTo: "10:00", onceDate: "" },
    { id: "task-2", helperId: "helper-1", title: "接小朋友放學", detail: "", schedule: "weekly", weekdays: [1, 2, 3, 4, 5], timeFrom: "15:30", timeTo: "", onceDate: "" },
  ],
  workRules: [
    { id: "rule-1", helperId: "helper-1", title: "鞋子放門口櫃", body: "入屋先換拖鞋，外鞋放在鞋櫃下層。" },
    { id: "rule-2", helperId: "helper-1", title: "垃圾分類", body: "廚餘和回收分開，晚上 8 時前放好。" },
  ],
  shopLists: [
    { id: "list-old", helperId: "helper-1", title: "街市", place: "market", status: "done", note: "", date: "2026-11-14", createdAt: "2026-11-14T01:00:00.000Z", completedAt: "2026-11-14T08:00:00.000Z" },
    { id: "list-now", helperId: "helper-1", title: "街市", place: "market", status: "open", note: "示範清單", date: "2026-11-21", createdAt: "2026-11-21T01:00:00.000Z", completedAt: "" },
  ],
  shopItems: [
    { id: "old-choy", listId: "list-old", helperId: "helper-1", name: "菜心", note: "", photo: "", qty: "1斤", suggestedPrice: null, paidPrice: 12.5, bought: true, kind: "", recipeId: "", parentId: "" },
    { id: "item-r", listId: "list-now", helperId: "helper-1", name: "蕃茄炒蛋", note: "", photo: "", qty: "", suggestedPrice: null, paidPrice: "", bought: false, kind: "recipe", recipeId: "lib-001", parentId: "" },
    { id: "item-e", listId: "list-now", helperId: "helper-1", name: "雞蛋", note: "", photo: "", qty: "4隻", suggestedPrice: null, paidPrice: "", bought: false, kind: "ing", recipeId: "lib-001", parentId: "item-r" },
    { id: "item-t", listId: "list-now", helperId: "helper-1", name: "蕃茄", note: "", photo: "", qty: "3個", suggestedPrice: null, paidPrice: "", bought: true, kind: "ing", recipeId: "lib-001", parentId: "item-r" },
    { id: "item-c", listId: "list-now", helperId: "helper-1", name: "菜心", note: "", photo: "", qty: "1斤", suggestedPrice: null, paidPrice: "", bought: false, kind: "", recipeId: "", parentId: "" },
  ],
  customReminders: [
    { id: "rem-1", helperId: "helper-1", title: "買米", date: "2026-11-25", repeat: "monthly", anchorDay: 25, note: "兩袋", doneAt: "", createdAt: "2026-11-01T00:00:00.000Z" },
    { id: "rem-2", helperId: "", title: "繳交管理費", date: "2026-11-28", repeat: "monthly", anchorDay: 28, note: "", doneAt: "", createdAt: "2026-11-01T00:00:00.000Z" },
  ],
  priceCatalog: [{
    key: "菜心",
    name: "菜心",
    lastPrice: 12.5,
    lastPaidOn: "2026-11-14",
    history: [{ price: 12.5, date: "2026-11-14", place: "market" }],
  }],
  menu: {
    slots: [
      { id: "slot-breakfast", key: "breakfast", name: "" },
      { id: "slot-lunch", key: "lunch", name: "" },
      { id: "slot-dinner", key: "dinner", name: "" },
      { id: "slot-snack", key: "snack", name: "" },
    ],
    days: {
      "2026-11-21": {
        "slot-breakfast": [{ id: "d1", text: "白粥", recipeId: "", note: "少鹽" }],
        "slot-lunch": [{ id: "d2", text: "蕃茄炒蛋", recipeId: "lib-001", note: "" }],
        "slot-dinner": [{ id: "d3", text: "蒸魚", recipeId: "", note: "給婆婆" }],
      },
    },
  },
  recipes: [],
  helperAccess: {
    "helper-1": {
      shareId: "share-sample",
      packed: "",
      withDocs: false,
      generatedAt: "2026-11-20T02:00:00.000Z",
      revoked: false,
      helperName: "Maria Santos",
      pin: "123456",
      sharedSig: "",
      sentAt: "2026-11-20T02:00:00.000Z",
    },
  },
  settings: { notifications: false, recentBuyDays: 7, diet: {} },
};

const session = {
  pin: "123456",
  updatedAt: "2026-11-20T02:00:00.000Z",
  payload: {
    v: 1,
    shareId: "share-sample",
    generatedAt: "2026-11-20T02:00:00.000Z",
    helper: {
      id: "helper-1",
      name: "Maria Santos",
      nationality: "philippines",
      startDate: "2026-02-01",
      contractStart: "2026-02-01",
      contractEnd: "2028-01-31",
      wage: 5220,
      foodProvided: true,
      foodAllowance: 1236,
      restDay: "arranged",
      phone: "91234567",
      winterChoice: "christmas",
      grantGeneralHolidays: false,
    },
    arrangedRestDays: ["2026-11-01", "2026-11-08", "2026-11-15", "2026-11-22", "2026-11-29"],
    leaveLogs: [],
    shStatuses: {},
    payments: employer.payments.map(({ helperId, ...rest }) => rest),
    workTasks: employer.workTasks.map(({ helperId, ...rest }) => rest),
    workRules: employer.workRules.map(({ helperId, ...rest }) => rest),
    shopLists: employer.shopLists.map(({ helperId, ...rest }) => rest),
    shopItems: employer.shopItems.map(({ helperId, ...rest }) => rest),
    customReminders: [{ id: "rem-1", title: "買米", date: "2026-11-25", repeat: "monthly", note: "兩袋" }],
    menu: employer.menu,
    recipes: [],
    prefs: { recentBuyDays: 7, diet: {} },
    priceCatalog: employer.priceCatalog,
  },
};

const SEED = `
localStorage.setItem("fdh-lang-v1", "zh-Hant");
localStorage.setItem("fdh-usage-tip-v1", "1");
localStorage.setItem("fdh-employer-v1", ${JSON.stringify(JSON.stringify(employer))});
localStorage.setItem("fdh-helper-session-v1", ${JSON.stringify(JSON.stringify(session))});
if (!localStorage.getItem("fdh-shot-role-ready")) {
  localStorage.setItem("fdh-active-role-v1", "employer");
  localStorage.setItem("fdh-shot-role-ready", "1");
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

async function shot(send, file) {
  await new Promise((r) => setTimeout(r, 180));
  const result = await send("Page.captureScreenshot", {
    format: "jpeg",
    quality: 58,
    clip: { x: 0, y: 0, width: 390, height: 700, scale: 1 },
  });
  const buf = Buffer.from(result.data, "base64");
  writeFileSync(join(outDir, file), buf);
  console.log(file, buf.length);
}

async function show(send, hash, ready, scroll) {
  await evalJson(send, `location.hash = ${JSON.stringify(hash)}`);
  await waitFor(send, ready);
  await evalJson(send, `new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
  if (scroll) {
    const pos = await evalJson(send, `(() => {
      const el = document.querySelector(${JSON.stringify(scroll)});
      const main = document.querySelector(".main");
      if (!el || !main) return "missing";
      const top = el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop;
      main.scrollTop = Math.max(0, top - 12);
      return main.scrollTop;
    })()`);
    if (pos === "missing") throw new Error(`could not scroll to ${scroll} on ${hash}`);
    await new Promise((r) => setTimeout(r, 220));
  } else {
    await evalJson(send, `(() => { const main = document.querySelector(".main"); if (main) main.scrollTop = 0; })()`);
  }
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const server = await startServer();
  const origin = `http://127.0.0.1:${server.address().port}/index.html`;
  const profile = mkdtempSync(join(tmpdir(), "guide-shots-"));
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
    await send("Page.navigate", { url: `${origin}#/home` });
    await waitFor(send, `document.querySelector(".welcome, h1") ? true : null`);

    const employerShots = [
      ["#/home", `document.querySelector(".welcome") ? true : null`, "", "employer-home.jpg"],
      ["#/more", `document.querySelector("[data-go='guide-help']") ? true : null`, "[data-action='choose-role'][data-role='helper']", "employer-more.jpg"],
      ["#/more", `document.querySelector(".prefs-card") ? true : null`, ".prefs-card", "employer-nav.jpg"],
      ["#/leave", `document.querySelector(".day") ? true : null`, ".day", "employer-leave.jpg"],
      ["#/tasks", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("工作安排") ? true : null`, "", "employer-tasks.jpg"],
      ["#/rules", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("工作守則") ? true : null`, "", "employer-rules.jpg"],
      ["#/shop", `document.querySelector(".shop-card") ? true : null`, "", "employer-shop.jpg"],
      ["#/menu", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("餐單") ? true : null`, "", "employer-menu.jpg"],
      ["#/recipes", `document.querySelector(".recipe-thumb img") && document.querySelector(".recipe-thumb img").complete && document.querySelector(".recipe-thumb img").naturalWidth > 0 ? true : null`, "", "employer-recipes.jpg"],
      ["#/pay", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("薪金") ? true : null`, "", "employer-pay.jpg"],
      ["#/helper-edit", `document.querySelector(".doc-section") ? true : null`, ".doc-section", "employer-contract.jpg"],
      ["#/share", `document.querySelector("[data-role='send-update']") ? true : null`, "[data-role='send-update']", "employer-share.jpg"],
      ["#/remind", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("事項提醒") ? true : null`, "", "employer-remind.jpg"],
      ["#/backup", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("備份") ? true : null`, "", "employer-backup.jpg"],
    ];
    for (const [hash, ready, scroll, file] of employerShots) {
      await show(send, hash, ready, scroll);
      await shot(send, file);
    }

    await evalJson(send, `localStorage.setItem("fdh-active-role-v1", "helper"); location.hash = "#/h"; location.reload()`);
    await waitFor(send, `document.querySelector("h1") && document.querySelector("h1").textContent.includes("Maria") ? true : null`);

    const helperShots = [
      ["#/h", `document.querySelector(".welcome") ? true : null`, "", "helper-home.jpg"],
      ["#/h-more", `document.querySelector("[data-go='h-guide-help']") ? true : null`, ".lang-card", "helper-more.jpg"],
      ["#/h-more", `document.querySelector(".prefs-card") ? true : null`, ".prefs-card", "helper-nav.jpg"],
      ["#/h-leave", `document.querySelector(".day") ? true : null`, ".day", "helper-leave.jpg"],
      ["#/h-tasks", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("工作安排") ? true : null`, "", "helper-tasks.jpg"],
      ["#/h-rules", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("工作守則") ? true : null`, "", "helper-rules.jpg"],
      ["#/h-shop", `document.querySelector(".shop-card") ? true : null`, "", "helper-shop.jpg"],
      ["#/h-menu", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("餐單") ? true : null`, "", "helper-menu.jpg"],
      ["#/h-recipes", `document.querySelector(".recipe-thumb img") && document.querySelector(".recipe-thumb img").naturalWidth > 0 ? true : null`, "", "helper-recipes.jpg"],
      ["#/h-pay", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("薪金") ? true : null`, "", "helper-pay.jpg"],
      ["#/h-enter", `document.querySelector("#helper-unlock") ? true : null`, "", "helper-enter.jpg"],
      ["#/h-remind", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("事項提醒") ? true : null`, "", "helper-remind.jpg"],
      ["#/h-rights", `document.querySelector("h1") && document.querySelector("h1").textContent.includes("權利") ? true : null`, "", "helper-rights.jpg"],
      ["#/h-more", `document.querySelector("[data-action='helper-lock']") ? true : null`, "[data-action='helper-lock']", "helper-lock.jpg"],
    ];
    for (const [hash, ready, scroll, file] of helperShots) {
      await show(send, hash, ready, scroll);
      await shot(send, file);
    }
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
