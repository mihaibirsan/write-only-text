const CACHE_NAME = 'write-only-text-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/package.json',
  '/style.css',
  '/script.js',
  '/site.webmanifest',
  'https://cdnjs.cloudflare.com/ajax/libs/luxon/3.2.1/luxon.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Cache only known paths
        caches.open(CACHE_NAME).then(cache => {
          if (urlsToCache.includes(new URL(event.request.url).pathname)) {
            cache.put(event.request, networkResponse.clone());
          }
        });
        // Always return network response when available
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request, { ignoreSearch: true });
      })
  );
});