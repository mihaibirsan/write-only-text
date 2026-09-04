const CACHE_NAME = 'write-only-text-cache-v2';
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
  // React/ReactDOM/Babel are required just to render the app at all, so
  // without these cached, going offline leaves a blank page.
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
];

// Absolute URLs that this service worker's cache logic should treat as
// cacheable, resolved against the worker's own location so that relative
// entries above (e.g. './index.html') match real request URLs.
const cacheableUrls = new Set(
  urlsToCache.map((url) => new URL(url, self.location).href),
);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache only known paths
        if (cacheableUrls.has(event.request.url)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        // Always return network response when available
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request, { ignoreSearch: true });
      }),
  );
});
