/* =====================================================================
   BILDSCHIRM AUSFÜLLEN (Tablet): Die App ist höchstens ~1000 px breit. Auf breiten Tablets blieb links und rechts
   viel leerer Platz. Hier wird – nur auf Touch-Geräten mit breitem Bildschirm – die Seite gleichmäßig vergrößert
   (wie Zoom über den Viewport). Layout, Tippen und Ziehen bleiben dadurch unverändert. Handy und Laptop: keine Änderung.
   Eltern können es abschalten: S.cfg.fit === false.
   ===================================================================== */
const FIT_W = 1040, FIT_MAX = 1.5;
const FIT_BASE = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no';
function fitScreenW() {
  const a = screen.width || 0, b = screen.height || 0, t = (screen.orientation && screen.orientation.type) || '';
  if (t.indexOf('portrait') === 0) return Math.min(a, b);
  if (t.indexOf('landscape') === 0) return Math.max(a, b);
  return a;
}
function fitApply() {
  const m = document.querySelector('meta[name=viewport]'); if (!m) return;
  const touch = (navigator.maxTouchPoints || 0) > 0;
  const sw = fitScreenW(), on = !(S.cfg && S.cfg.fit === false);
  let c = FIT_BASE;
  if (on && touch && sw > FIT_W + 24) {
    const k = Math.min(FIT_MAX, sw / FIT_W), w = Math.round(sw / k), ks = k.toFixed(3);
    c = `width=${w},initial-scale=${ks},minimum-scale=${ks},maximum-scale=${ks},user-scalable=no`;
  }
  if (m.getAttribute('content') !== c) m.setAttribute('content', c);
}
let fitT = 0;
const fitLater = () => { clearTimeout(fitT); fitT = setTimeout(fitApply, 120); };
try {
  fitApply();
  if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', fitLater);
  window.addEventListener('orientationchange', fitLater);
  window.addEventListener('resize', fitLater);
} catch (e) { }
ACT.fitToggle = () => { S.cfg.fit = S.cfg.fit === false; save(); fitApply(); render(); };
