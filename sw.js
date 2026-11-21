const CACHE_NAME = "recipe-app-v6";
const CACHE_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_FILES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith("recipe-app-") && key !== CACHE_NAME) /* 同じ住所のほかのアプリのキャッシュは消さない */.map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

// ネット優先: まず最新を取りに行き、失敗した時だけキャッシュ(オフライン用)を使う
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 保存するのは「自分のサイトのGETで、成功した返事」だけ(取り込みで使う他サイトの返事やエラーは残さない)
        const own = new URL(event.request.url).origin === self.location.origin;
        if (own && event.request.method === "GET" && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
