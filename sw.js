// offline cache (version 156b84b4) – Lernstand liegt im Browser (localStorage/IndexedDB), nicht hier
const C = 'denkzauber-156b84b4';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => (k.startsWith('mathe-') || k.startsWith('rechenhelden-') || k.startsWith('denkzauber-')) && k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (e.request.mode === 'navigate' || /\/(index\.html)?$/.test(u.pathname)) {      // Startseite: erst Netz (immer neueste Version), ohne Netz der Zwischenspeicher
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put('./index.html', cp)); return res; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp)); return res; }).catch(() => caches.match('./index.html'))));
});
