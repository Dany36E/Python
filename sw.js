/* Cancha — service worker: la app funciona sin conexión.
   Cada versión usa su propia caché: al publicar cambios, sube VERSION para que todos reciban
   la app completa de una sola vez (sin mezclar archivos viejos y nuevos). */
const VERSION = 'v5';
const CACHE = 'cancha-' + VERSION;
const SHELL = [
  './',
  './index.html',
  './app/styles.css',
  './app/app.js',
  './app/catalog.js',
  './app/vendor/jspdf.umd.min.js',
  './app/fonts/big-shoulders-display.woff2',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.indexOf('cancha-') === 0 && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// La app sale de la caché de su versión; lo demás va a la red y se guarda por si no hay conexión.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const key = req.mode === 'navigate' ? './index.html' : req;
      const cached = await cache.match(key, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.ok && res.type === 'basic') cache.put(key, res.clone());
        return res;
      } catch (e) {
        return Response.error();
      }
    })
  );
});
