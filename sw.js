/* Cancha — service worker: la app funciona sin conexión.
   Cada versión usa su propia caché: al publicar cambios, sube VERSION para que todos reciban
   la app completa de una sola vez (sin mezclar archivos viejos y nuevos). */
const VERSION = 'v16';
const CACHE = 'cancha-' + VERSION;
// Videos y portadas de los ejercicios de entrenador: caché aparte que no se borra al actualizar la app.
const MEDIA = 'cancha-media-3';
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
      .then((keys) => Promise.all(keys.filter((k) => k.indexOf('cancha-') === 0 && k !== CACHE && k !== MEDIA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// La app sale de la caché de su versión; lo demás va a la red y se guarda por si no hay conexión.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf('/app/videos/') >= 0) { event.respondWith(mediaResponse(req, url)); return; }
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

// Safari pide los videos por partes (Range). Se guarda el archivo completo y se responde la parte pedida.
async function mediaResponse(req, url) {
  const cache = await caches.open(MEDIA);
  const key = url.origin + url.pathname;
  let res = await cache.match(key);
  if (!res) {
    try {
      const net = await fetch(key);
      if (!net.ok || net.status !== 200) return net;
      await cache.put(key, net.clone());
      res = net;
    } catch (e) {
      return Response.error();
    }
  }
  const range = req.headers.get('range');
  if (!range) return res;
  const blob = await res.blob();
  const size = blob.size;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  let start = m && m[1] ? Number(m[1]) : 0;
  let end = m && m[2] ? Number(m[2]) : size - 1;
  if (m && !m[1] && m[2]) { start = Math.max(0, size - Number(m[2])); end = size - 1; }
  end = Math.min(end, size - 1);
  if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'video/mp4', 'Content-Range': 'bytes ' + start + '-' + end + '/' + size, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' },
  });
}
