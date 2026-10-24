// Offline cache: app shell first, then everything fetched (boards, images, Noga's voice) on demand.
const V = 'noga-20261024074213';
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'config.js', 'vendor/react.production.min.js', 'vendor/react-dom.production.min.js', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.headers.get('range')) return; // let the browser stream audio ranges directly
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    const res = await fetch(e.request);
    if (res.ok && res.status === 200) c.put(e.request, res.clone());
    return res;
  }));
});
