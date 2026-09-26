importScripts('./asset-manifest.js');

const CACHE_PREFIX = 'jianstudy-quest-';
const CACHE_NAME = `${CACHE_PREFIX}${self.JIANSTUDY_ASSET_MANIFEST.version}`;
const ASSETS = self.JIANSTUDY_ASSET_MANIFEST.assets;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(new Request(event.request, { cache: 'no-cache' }))
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
