#!/usr/bin/env python3
"""Builds (1) ONE self-contained HTML file (dist/) and (2) the installable PWA (index.html, manifest, sw.js in the repo root,
so GitHub Pages can serve it directly). Icons are generated once by tools/make_icons.py."""
import sys, pathlib, json
root = pathlib.Path(__file__).parent
dist = root / 'dist'
css = (root/'src/style.css').read_text()
js = '\n'.join((root/'src'/f).read_text() for f in ['gen.js', 'mascot.js', 'cards.js', 'store.js', 'app.js'])
js = js.replace('</script>', '<\\/script>')
fav = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%A6%8A%3C/text%3E%3C/svg%3E"
PWA_HEAD = '''<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-192.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
'''
PWA_JS = '''
if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) { window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); }); }
'''
def page(pwa):
    return f'''<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta name="theme-color" content="#FFB703">
<title>Mathe-Abenteuer · Klasse 4</title>
<link rel="icon" href="{fav}">
{PWA_HEAD if pwa else ''}<style>
{css}
</style>
</head>
<body>
<div id="app"></div>
<noscript>Bitte JavaScript aktivieren.</noscript>
<script>
{js}{PWA_JS if pwa else ''}
</script>
</body>
</html>
'''
dist.mkdir(exist_ok=True)
(dist/'Mathe-Abenteuer_Klasse4.html').write_text(page(False))
pwa = root  # GitHub Pages serves the repo root
(pwa/'index.html').write_text(page(True))
(pwa/'manifest.webmanifest').write_text(json.dumps({
  "name": "Mathe-Abenteuer Klasse 4", "short_name": "Mathe", "lang": "de",
  "start_url": "./index.html", "scope": "./", "display": "standalone", "orientation": "any",
  "background_color": "#FFF3D6", "theme_color": "#FFB703",
  "icons": [
    {"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
    {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
    {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}, indent=1))
ver = str(abs(hash(page(True))) % 10**8)
import hashlib; ver = hashlib.md5(page(True).encode()).hexdigest()[:8]
(pwa/'sw.js').write_text(f'''// offline cache (version {ver}) – Lernstand liegt im Browser (localStorage/IndexedDB), nicht hier
const C = 'mathe-{ver}';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
self.addEventListener('install', e => {{ e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); }});
self.addEventListener('activate', e => {{ e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('mathe-') && k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); }});
self.addEventListener('fetch', e => {{
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, {{ ignoreSearch: true }}).then(r => r || fetch(e.request).then(res => {{ const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp)); return res; }}).catch(() => caches.match('./index.html'))));
}});
''')
print('built', (dist/'Mathe-Abenteuer_Klasse4.html').stat().st_size//1024, 'KB standalone + PWA in repo root')
