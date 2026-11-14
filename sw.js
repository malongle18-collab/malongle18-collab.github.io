const CACHE = "fdh-household-pages-v7";
const ASSETS = [
  "./",
  "./index.html",
  "./css/app.css",
  "./css/app.css?v=7",
  "./js/app.js",
  "./js/app.js?v=7",
  "./js/data.js",
  "./js/data.js?v=7",
  "./js/dates.js",
  "./js/dates.js?v=7",
  "./js/rules.js",
  "./js/rules.js?v=7",
  "./js/storage.js",
  "./js/storage.js?v=7",
  "./js/reminders.js",
  "./js/reminders.js?v=7",
  "./js/icons.js",
  "./js/icons.js?v=7",
  "./js/share.js",
  "./js/share.js?v=7",
  "./manifest.webmanifest",
  "./icons/favicon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
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
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
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
