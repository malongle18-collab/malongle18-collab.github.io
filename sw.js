const CACHE = "fdh-household-pages-v13";
const ASSETS = [
  "./",
  "./index.html",
  "./css/app.css",
  "./css/app.css?v=13",
  "./js/app.js",
  "./js/app.js?v=13",
  "./js/data.js",
  "./js/data.js?v=13",
  "./js/dates.js",
  "./js/dates.js?v=13",
  "./js/rules.js",
  "./js/rules.js?v=13",
  "./js/storage.js",
  "./js/storage.js?v=13",
  "./js/reminders.js",
  "./js/reminders.js?v=13",
  "./js/i18n.js",
  "./js/i18n.js?v=13",
  "./js/i18n-zh.js",
  "./js/i18n-zh.js?v=13",
  "./js/i18n-en.js",
  "./js/i18n-en.js?v=13",
  "./js/icons.js",
  "./js/icons.js?v=13",
  "./js/share.js",
  "./js/share.js?v=13",
  "./js/docs.js",
  "./js/menu.js",
  "./js/docs.js?v=13",
  "./js/menu.js?v=13",
  "./js/recipes-lib.js",
  "./js/recipes-lib.js?v=13",
  "./manifest.webmanifest",
  "./icons/favicon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const dest = req.destination;
  const networkFirst =
    dest === "document" ||
    dest === "style" ||
    dest === "script" ||
    dest === "manifest" ||
    url.pathname.endsWith(".webmanifest") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname === "/" ||
    url.pathname.endsWith("/index.html");
  if (networkFirst) {
    event.respondWith(
      fetch(req, { cache: "no-cache" })
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: dest === "document" }))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
      }
      return res;
    }))
  );
});
