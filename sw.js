const VERSION = 'anatomy-v5';
const APP_CACHE = `${VERSION}-app`;
const MODEL_CACHE = `${VERSION}-models`;
const APP_SHELL = [
  './', './index.html', './styles.css', './app.js', './anatomy-data.js',
  './manifest.webmanifest', './icon.svg', './maskable-icon.svg', './ATTRIBUTION.md'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(APP_CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => ![APP_CACHE, MODEL_CACHE].includes(key)).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isModel = url.pathname.endsWith('.stl');
  if (isModel) {
    event.respondWith(caches.open(MODEL_CACHE).then(async cache => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
      return response;
    }));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response.ok) caches.open(APP_CACHE).then(cache => cache.put(request, response.clone()));
        return response;
      }).catch(() => cached);
      return cached || network;
    }));
  }
});
