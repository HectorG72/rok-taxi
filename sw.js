// Offline cache for the Cart Taxi app. Same-origin files are served from the
// cache first and refreshed in the background; Google Fonts are cached when seen.
var CACHE = "rok-taxi-v4";
var PRECACHE = ["./", "./index.html", "./icon.png", "./drivers.vcf"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(PRECACHE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  var sameOrigin = url.origin === location.origin;
  var font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !font) return;

  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(e.request, { ignoreSearch: sameOrigin }).then(function (cached) {
      var fresh = fetch(e.request).then(function (res) {
        if (res && (res.ok || res.type === "opaque")) c.put(e.request, res.clone());
        return res;
      }).catch(function () { return cached; });
      return cached || fresh;
    });
  }));
});
