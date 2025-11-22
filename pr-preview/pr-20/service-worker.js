const CACHE_NAME = 'write-only-text-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './package.json',
  './style.css',
  './utils.js',
  './plugins/pluginSystem.js',
  './plugins/corePlugins_components.js',
  './plugins/corePlugins.js',
  './components.js',
  './app.js',
  './site.webmanifest',
  'https://cdnjs.cloudflare.com/ajax/libs/luxon/3.2.1/luxon.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache only known paths
        caches.open(CACHE_NAME).then((cache) => {
          if (urlsToCache.includes(new URL(event.request.url).pathname)) {
            cache.put(event.request, networkResponse);
          }
        });
        // Always return network response when available
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request, { ignoreSearch: true });
      }),
  );
});
