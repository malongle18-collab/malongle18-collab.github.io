const CACHE = "fdh-household-pages-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./css/app.css",
  "./css/app.css?v=5",
  "./js/app.js",
  "./js/app.js?v=5",
  "./js/data.js",
  "./js/dates.js",
  "./js/rules.js",
  "./js/storage.js",
  "./js/reminders.js",
  "./js/icons.js",
  "./js/share.js",
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
