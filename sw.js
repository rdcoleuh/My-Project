const VERSION = "minecraft-web-shell-20261023-ios-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./favicon.svg"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("minecraft-web-shell-") && key !== VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(req).then(response => {
    if (response.ok && (req.mode === "navigate" || SHELL.some(path => new URL(path, self.registration.scope).pathname === url.pathname))) {
      const copy = response.clone();
      caches.open(VERSION).then(cache => cache.put(req, copy)).catch(() => {});
    }
    return response;
  }).catch(() => caches.match(req)));
});
// Only the website shell can be used offline; third-party Minecraft runtimes are not cached.
