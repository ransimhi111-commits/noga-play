// Offline cache: app shell first, then everything fetched (boards, images, Noga's voice) on demand.
const V = 'noga-20261031183126';
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'config.js', 'vendor/react.production.min.js', 'vendor/react-dom.production.min.js', 'manifest.webmanifest', 'fonts/fonts.css', 'fonts/rubik-hebrew-wght-normal.woff2', 'fonts/rubik-latin-wght-normal.woff2', 'fonts/fredoka-hebrew-wght-normal.woff2', 'fonts/fredoka-latin-wght-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.headers.get('range')) return; // let the browser stream audio ranges directly
  // the shell is network-first, so a new version shows on the first open (offline: the saved copy)
  const shell = e.request.mode === 'navigate' || /\/(index\.html|app\.js|app\.css|config\.js)?$/.test(u.pathname);
  if (shell) {
    e.respondWith(caches.open(V).then(async c => {
      try { const res = await fetch(e.request, { cache: 'no-cache' }); if (res.ok && res.status === 200) c.put(e.request, res.clone()); return res; }
      catch (err) { const hit = await c.match(e.request, { ignoreSearch: true }); if (hit) return hit; throw err; }
    }));
    return;
  }
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    const res = await fetch(e.request);
    if (res.ok && res.status === 200) c.put(e.request, res.clone());
    return res;
  }));
});
// "save for offline" from the parents' area: the page sends the file list, the worker fills this version's cache
self.addEventListener('message', e => {
  const d = e.data || {}; if (d.type !== 'precache' || !Array.isArray(d.files)) return;
  const src = e.source;
  e.waitUntil((async () => {
    const c = await caches.open(V); let done = 0, bytes = 0, failed = 0;
    for (const f of d.files) {
      try { if (!(await c.match(f.p, { ignoreSearch: true }))) { const r = await fetch(f.p, { cache: 'no-cache' }); if (r.ok && r.status === 200) await c.put(f.p, r); else failed++; } } catch (err) { failed++; }
      done++; bytes += f.s || 0;
      if (src && (done % 4 === 0 || done === d.files.length)) src.postMessage({ type: 'precache', done, total: d.files.length, bytes });
    }
    if (src) src.postMessage({ type: 'precache', finished: true, failed, bytes, total: d.files.length });
  })());
});
