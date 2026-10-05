#!/usr/bin/env python3
"""Denkzauber (früher Rechenhelden, davor Mathe-Abenteuer). Builds (1) ONE self-contained HTML file (dist/) and (2) the installable PWA (index.html, manifest, sw.js in the repo root,
so GitHub Pages can serve it directly).
The file name dist/Mathe-Abenteuer_Klasse4.html and the localStorage key mathe_abenteuer_v1 stay unchanged on purpose:
the child's saved progress is bound to the browser origin/path. Do not rename them or the GitHub repo. Icons are generated once by tools/make_icons.py."""
import sys, pathlib, json
root = pathlib.Path(__file__).parent
dist = root / 'dist'
src = root/'src'
outdir = None
if '--out' in sys.argv: outdir = pathlib.Path(sys.argv[sys.argv.index('--out')+1])   # nur die Einzel-HTML in ein anderes Verzeichnis bauen (zum Testen)
import base64
# Schriften (Baloo 2 800, Nunito 600/800 – OFL, auf Latein + Deutsch reduziert) offline einbetten
FONTS = [('Adventure Baloo', 800, 'baloo-800'), ('Adventure Nunito', 600, 'nunito-600'), ('Adventure Nunito', 800, 'nunito-800')]
fontcss = '\n'.join(f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{base64.b64encode((src/'fonts'/(n+'.woff2')).read_bytes()).decode()}) format('woff2')}}" for fam, w, n in FONTS)
OFL = '<!-- Embedded fonts: Baloo 2 + Nunito (subset)\n' + (src/'fonts'/'OFL.txt').read_text().replace('--', '- -') + '-->'
# Reihenfolge: Basis → Features → ui.css (innere Seiten) → dz.css (Denkzauber-Design-System, gewinnt)
css = '\n'.join([(src/'style.css').read_text()] + [f.read_text() for f in sorted(src.glob('feat_*.css'))] + [fontcss, (src/'ui.css').read_text(), (src/'dz.css').read_text()])
ORDER = ['gen.js', 'mascot.js', 'cards.js', 'story_data.js', 'geo_data.js', 'world_data.js'] + sorted(f.name for f in src.glob('world_pack_*.js')) + ['store.js', 'icons.js', 'rewards.js', 'editor.js', 'app.js', 'dz.js', 'shell.js'] + sorted(f.name for f in src.glob('feat_*.js')) + ['boot.js']
js = '\n'.join((src/f).read_text() for f in ORDER if (src/f).exists())
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
<meta name="theme-color" content="#1764d5">
<title>Denkzauber · Klasse 4</title>
<link rel="icon" href="{fav}">
{PWA_HEAD if pwa else ''}<style>
{css}
</style>
{OFL}
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
if outdir:
    outdir.mkdir(parents=True, exist_ok=True); (outdir/'Mathe-Abenteuer_Klasse4.html').write_text(page(False)); print('built to', outdir); sys.exit(0)
dist.mkdir(exist_ok=True)
(dist/'Mathe-Abenteuer_Klasse4.html').write_text(page(False))
pwa = root  # GitHub Pages serves the repo root
(pwa/'index.html').write_text(page(True))
(pwa/'manifest.webmanifest').write_text(json.dumps({
  "name": "Denkzauber Klasse 4", "short_name": "Denkzauber", "lang": "de",
  "start_url": "./index.html", "scope": "./", "display": "standalone", "orientation": "any",
  "background_color": "#eaf7ff", "theme_color": "#1764d5",
  "icons": [
    {"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
    {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
    {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}, indent=1))
ver = str(abs(hash(page(True))) % 10**8)
import hashlib; ver = hashlib.md5(page(True).encode()).hexdigest()[:8]
(pwa/'sw.js').write_text(f'''// offline cache (version {ver}) – Lernstand liegt im Browser (localStorage/IndexedDB), nicht hier
const C = 'denkzauber-{ver}';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
self.addEventListener('install', e => {{ e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); }});
self.addEventListener('activate', e => {{ e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => (k.startsWith('mathe-') || k.startsWith('rechenhelden-') || k.startsWith('denkzauber-')) && k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); }});
self.addEventListener('fetch', e => {{
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, {{ ignoreSearch: true }}).then(r => r || fetch(e.request).then(res => {{ const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp)); return res; }}).catch(() => caches.match('./index.html'))));
}});
''')
print('built', (dist/'Mathe-Abenteuer_Klasse4.html').stat().st_size//1024, 'KB standalone + PWA in repo root')
