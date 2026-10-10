/* =====================================================================
   DENKZAUBER DESIGN-SYSTEM · Bausteine (läuft nach app.js, vor shell.js und den feat_*.js)
   ---------------------------------------------------------------------
   Navigation   NAV.stack (Verlauf), dzBack(fallback), Android-Zurück
   Bausteine    dzTile · dzGrid · dzSlot · dzAcc · dzHero · dzSec · dzChip · dzHead · dzTree · dzIc · dzArt · dzPassport
   Namen        dzPoss(name) · Fino-Name wird überall automatisch ersetzt (auch „Finos“ → „Blitz’ “ / „Mias“)
   Schalter     flagOn(id) · DZ_FLAGS (Wesen, Buch, Insel: ausgeblendet, Eltern können sie einschalten)
   ===================================================================== */

/* ---------- Schalter für ausgeblendete Funktionen (Daten bleiben unangetastet) ---------- */
const DZ_FLAGS = [
  { id: 'wesen', label: 'Meine Wesen', sub: 'Eier ausbrüten und Wesen sammeln' },
  { id: 'buch', label: 'Mein Buch', sub: 'Sticker sammeln und einkleben' },
  { id: 'insel', label: 'Meine Insel', sub: 'Eine eigene Insel gestalten' }
];
const flagOn = id => !!(S.flags && S.flags[id]);

/* ---------- Namen: Besitz-Form und Fino-Ersetzung ---------- */
const dzPoss = n => /[sßxzSßXZ]$/.test(n) ? n + '’' : n + 's';
const DZ_FN_SKIP = 'script,style,input,textarea,[data-keepfino]';
function dzFinoText(t) {
  const n = (typeof FN === 'function') ? FN() : 'Fino';
  if (!n || n === 'Fino' || /Fino/.test(n)) return t;
  return t.replace(/\bFinos\b/g, dzPoss(n)).replace(/\bFino\b/g, n);
}
function dzFinoNode(root) {
  if (!root || (typeof FN === 'function' && FN() === 'Fino')) return;
  if (root.nodeType === 3) { const p = root.parentElement; if (p && !p.closest(DZ_FN_SKIP) && /Fino/.test(root.nodeValue)) root.nodeValue = dzFinoText(root.nodeValue); return; }
  if (root.nodeType !== 1 || root.matches(DZ_FN_SKIP)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const list = []; let x;
  while ((x = w.nextNode())) if (/Fino/.test(x.nodeValue)) list.push(x);
  list.forEach(t => { if (!t.parentElement.closest(DZ_FN_SKIP)) t.nodeValue = dzFinoText(t.nodeValue); });
  root.querySelectorAll('[aria-label*="Fino"],[title*="Fino"],[alt*="Fino"]').forEach(e => {
    if (e.closest('[data-keepfino]')) return;
    ['aria-label', 'title', 'alt'].forEach(a => { const v = e.getAttribute(a); if (v && /Fino/.test(v)) e.setAttribute(a, dzFinoText(v)); });
  });
}
if (typeof MutationObserver !== 'undefined') {
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(dzFinoNode))).observe(document.documentElement, { childList: true, subtree: true });
}

/* ---------- Navigation: Verlauf statt fester Rücksprünge ---------- */
const NAV = { stack: [], isBack: false, sentinel: false };
const DZ_TRANSIENT = new Set(['play', 'test', 'result', 'testResult', 'geoPlay', 'geoResult', 'limit', 'storyread']);
const DZ_PARENT = { storyread: 'story' };                   // Seiten, die nicht im Verlauf stehen: Zurück geht hierhin
const DZ_LABEL = { home: 'Start', hefte: 'Meine Hefte', kopf: 'Kopfrechnen', extra: 'Extra Spaß', rewards: 'Meine Welt', geo: 'Europa Entdecker', profile: 'Profil', shop: 'Shop', trophies: 'Pokale', schatz: 'Lustige Karten', look: 'Farben & Töne', avatar: 'Das bin ich', musik: 'Musik', story: 'Geschichte', welt: 'Weltreise', weltPass: 'Mein Reisepass', weltReise: 'Reise', geoCards: 'Länderkarten', geoPass: 'Stempel', parent: 'Eltern', module: 'Heft', topic: 'Übung', mistakes: 'Fehler-Heft', testSetup: 'Mini-Test', buch: 'Mein Buch', insel: 'Meine Insel', wesen: 'Meine Wesen', notiz: 'Notizbuch', kreativhefte: 'Ideenwerkstatt', noten: 'Notenheft' };
const DZ_KEEP_UI = k => !['say', 'pending', 'pinUntil', 'pinCreative', 'ro', 'wNew', 'wFlight'].includes(k);
const dzSnap = () => { const o = {}; Object.keys(UI).forEach(k => { const v = UI[k]; if (DZ_KEEP_UI(k) && (v === null || ['string', 'number', 'boolean'].includes(typeof v))) o[k] = v; }); return o; };
function dzNavPush(from, to) {
  if (NAV.isBack) return;
  if (to === 'home') { NAV.stack.length = 0; return; }
  const i = NAV.stack.map(e => e.v).lastIndexOf(to);
  if (i >= 0) { NAV.stack.length = i; return; }                 // zurück zu einer Seite, die schon im Verlauf ist
  if (DZ_TRANSIENT.has(from) || from === to) return;
  NAV.stack.push({ v: from, ui: dzSnap() });
  if (NAV.stack.length > 40) NAV.stack.shift();
  dzSentinel();
}
function dzBack(fb) {
  if (DZ_PARENT[view] && VIEWS[DZ_PARENT[view]]) { go(DZ_PARENT[view]); return; }
  let e;
  while ((e = NAV.stack.pop()) && (!VIEWS[e.v] || e.v === view)) { e = null; }
  if (e) { NAV.isBack = true; try { go(e.v, e.ui); } finally { NAV.isBack = false; } return; }
  if (fb && fb !== 'home' && VIEWS[fb]) { go(fb); return; }
  if (fb && fb !== 'home' && typeof ACT[fb] === 'function' && fb !== 'back') { ACT[fb](); return; }
  go('home');
}
function dzBackLabel(fb) {
  const e = NAV.stack[NAV.stack.length - 1];
  const v = e ? e.v : (fb && DZ_LABEL[fb] ? fb : 'home');
  return DZ_LABEL[v] || 'Zurück';
}
/* Android-Zurück: ein Eintrag im Browser-Verlauf wird immer nachgefüllt, solange man nicht auf der Startseite ist */
function dzSentinel() { if (NAV.sentinel) return; try { history.pushState({ dz: 1 }, ''); NAV.sentinel = true; } catch (e) { } }
window.addEventListener('popstate', () => {
  NAV.sentinel = false;
  if (typeof GQ !== 'undefined' && GQ && !GQ.done && view === 'geoPlay') return;      // die Europa-Runde fragt selbst nach
  if (typeof closeModal === 'function' && document.getElementById('modal')) { closeModal(); dzSentinel(); return; }
  if (view !== 'home') { dzBack('home'); if (view !== 'home') dzSentinel(); }
});
Object.assign(ACT, { back: fb => dzBack(fb) });

/* Seitenwechsel: kurzes, weiches Einblenden (nur wenn die Ansicht wechselt) */
function dzAfterRender(changed) {
  const a = document.getElementById('app'); if (!a) return;
  if (changed) { a.classList.remove('dz-enter'); void a.offsetWidth; a.classList.add('dz-enter'); setTimeout(() => a.classList.remove('dz-enter'), 400); }
  if (typeof nzBubble === 'function') { try { nzBubble(); } catch (e) { console.error(e); } }
  if (typeof giftBubble === 'function') { try { giftBubble(); } catch (e) { console.error(e); } }
  if (typeof lockTilesPass === 'function') { try { lockTilesPass(); } catch (e) { console.error(e); } }   // „Noch zu“ auf jeder gesperrten Kachel
}

/* ---------- Linien-Symbole (32×32, Stil der Weltreise) ---------- */
const DZ_IC = {
  coin: '<circle cx="16" cy="16" r="11"/><path d="M20 11c-5-3-9 0-9 5s4 8 9 5M8 15h10M8 19h10"/>',
  star: '<path d="m16 4 3.6 7.4 8.1 1.1-5.9 5.7 1.4 8.1L16 22.4l-7.2 3.9 1.4-8.1-5.9-5.7 8.1-1.1Z"/>',
  cards: '<rect x="6" y="9" width="15" height="19" rx="3"/><path d="M11 5h13a2 2 0 0 1 2 2v16M11 16l3 3 4-5"/>',
  trophy: '<path d="M10 5h12v7a6 6 0 0 1-12 0ZM10 8H5c0 4 2 6 5 6M22 8h5c0 4-2 6-5 6M16 18v5M11 27h10M13 23h6"/>',
  home: '<path d="m5 15 11-9 11 9v12H5Z"/><path d="M13 27v-7h6v7"/>',
  back: '<path d="M19 6 9 16l10 10"/>',
  chev: '<path d="m8 12 8 8 8-8"/>',
  lock: '<rect x="7" y="14" width="18" height="13" rx="3"/><path d="M11 14v-3a5 5 0 0 1 10 0v3"/>',
  check: '<path d="m7 17 6 6 12-14"/>',
  plus: '<path d="M16 7v18M7 16h18"/>',
  avatar: '<circle cx="16" cy="11" r="5"/><path d="M6 27c0-6 4-9 10-9s10 3 10 9"/>',
  palette: '<path d="M7 25c12 3 20-4 18-12-2-8-15-9-18-2-2 5 5 5 4 9-1 3-6 1-6 3 0 1 1 2 2 2Z"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="10" r="1"/><circle cx="22" cy="15" r="1"/>',
  fox: '<path d="M5 6l6 4h10l6-4v10c0 6-5 11-11 11S5 22 5 16Z"/><circle cx="12" cy="16" r="1.2"/><circle cx="20" cy="16" r="1.2"/><path d="M14 21h4"/>',
  gear: '<circle cx="16" cy="16" r="4"/><path d="M16 4v4M16 24v4M4 16h4M24 16h4M7.5 7.5l2.8 2.8M21.7 21.7l2.8 2.8M7.5 24.5l2.8-2.8M21.7 10.3l2.8-2.8"/>',
  target: '<circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="6"/><circle cx="16" cy="16" r="1.5"/>',
  sun: '<circle cx="16" cy="16" r="5"/><path d="M16 4v4M16 24v4M4 16h4M24 16h4M8 8l3 3M21 21l3 3M8 24l3-3M21 11l3-3"/>',
  bulb: '<path d="M11 21c-3-2-4-5-4-8a9 9 0 0 1 18 0c0 3-1 6-4 8v3H11ZM12 28h8M13 24v4"/>'
};
const dzIc = (n, size) => `<svg class="dz-ic" viewBox="0 0 32 32" width="${size || 20}" height="${size || 20}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${DZ_IC[n] || ''}</svg>`;

/* ---------- Kachel-Illustrationen (64×52, ruhige Demo-Farben) ---------- */
const DZ_ART = {
  hefte: '<rect x="9" y="30" width="40" height="11" rx="3" fill="#b7cbcc"/><rect x="13" y="19" width="38" height="11" rx="3" fill="#e9d9da"/><rect x="8" y="8" width="38" height="12" rx="3" fill="#bed1c6"/><path d="M14 8v12M17 14h14" stroke="#52676c" stroke-width="2" stroke-linecap="round"/><path d="M40 20v7l3-2 3 2v-7" fill="#9c6668"/>',
  europa: '<circle cx="32" cy="26" r="19" fill="#b7cbcc"/><path d="M22 14c5 2 6 6 11 5 3 5-2 9-6 8-2 5-7 5-9 1 1-4-3-8 4-14ZM39 27c4-2 7 0 8 4-3 5-7 4-8 0Z" fill="#bed1c6"/><circle cx="32" cy="26" r="19" fill="none" stroke="#52676c" stroke-width="2"/><path d="M13 26h38M32 7c-8 8-8 30 0 38M32 7c8 8 8 30 0 38" fill="none" stroke="#52676c" stroke-width="1.4" opacity=".55"/><path d="M47 6v13" stroke="#9c6668" stroke-width="3" stroke-linecap="round"/><path d="M47 6h9l-2 4 2 4h-9Z" fill="#9c6668"/>',
  extra: '<rect x="12" y="10" width="32" height="32" rx="9" fill="#e9d9da" transform="rotate(-6 28 26)"/><path d="M22 20l12 12M34 20 22 32" stroke="#8e5962" stroke-width="4" stroke-linecap="round"/><path d="M50 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2ZM12 40l1.5 3.5L17 45l-3.5 1.5L12 50l-1.5-3.5L7 45l3.5-1.5Z" fill="#d5ad72"/><circle cx="53" cy="36" r="2.5" fill="#bed1c6"/>',
  welt: '<circle cx="46" cy="13" r="7" fill="#f0dfbd"/><path d="M4 42q14-16 28-3t28 0v12H4Z" fill="#bed1c6"/><path d="M30 41V26" stroke="#a88c75" stroke-width="4" stroke-linecap="round"/><circle cx="30" cy="20" r="11" fill="#9db8a4"/><circle cx="24" cy="24" r="6" fill="#8aa58e"/><path d="M44 42v-8l5-4 5 4v8Z" fill="#f4efe4" stroke="#7d8b86" stroke-width="2" stroke-linejoin="round"/>',
  fakten: '<path d="M22 34c-6-4-8-9-7-14 2-8 12-12 19-7 6 4 7 12 1 17-3 2-3 4-3 6H25c0-2 0-3-3-2Z" fill="#f1e4b6" stroke="#52676c" stroke-width="2" stroke-linejoin="round"/><path d="M25 43h12M27 47h8" stroke="#52676c" stroke-width="2.2" stroke-linecap="round"/><path d="M32 9V4M14 14l-4-3M50 14l4-3M8 26H3M56 26h5" stroke="#d5ad72" stroke-width="2.4" stroke-linecap="round"/><path d="M28 24l3 3 5-6" fill="none" stroke="#8e5962" stroke-width="2.2" stroke-linecap="round"/>',
  musik: '<path d="M22 38V13l26-6v25" fill="none" stroke="#52676c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 20l26-6" stroke="#52676c" stroke-width="3"/><ellipse cx="16" cy="39" rx="7" ry="5.5" fill="#9c6668"/><ellipse cx="42" cy="33" rx="7" ry="5.5" fill="#bed1c6" stroke="#52676c" stroke-width="2"/>',
  shop: '<path d="M12 18h40l3 28a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3Z" fill="#e9d9da"/><path d="M22 22v-6a10 10 0 0 1 20 0v6" fill="none" stroke="#52676c" stroke-width="3" stroke-linecap="round"/><path d="m32 28 2.5 5 5.5.8-4 3.8 1 5.4-5-2.7-5 2.7 1-5.4-4-3.8 5.5-.8Z" fill="#d5ad72"/>',
  story: '<path d="M6 12q13-6 26 2v32q-13-8-26-2Z" fill="#f4efe4" stroke="#52676c" stroke-width="2" stroke-linejoin="round"/><path d="M58 12q-13-6-26 2v32q13-8 26-2Z" fill="#e7edeb" stroke="#52676c" stroke-width="2" stroke-linejoin="round"/><path d="M12 20q7-2 14 1M12 27q7-2 14 1M38 21q7-3 14-1M38 28q7-3 14-1" stroke="#9aa9a6" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M49 4l1.8 4 4 1.8-4 1.8L49 16l-1.8-4.4-4-1.8 4-1.8Z" fill="#d5ad72"/>',
  passport: '<g transform="rotate(-6 32 27)"><rect x="14" y="5" width="36" height="46" rx="5" fill="#8e5962"/><rect x="14" y="5" width="6" height="46" rx="3" fill="#74444d"/><circle cx="34" cy="23" r="9" fill="none" stroke="#e8cf92" stroke-width="2"/><path d="M25 23h18M34 14c-4 5-4 13 0 18M34 14c4 5 4 13 0 18" fill="none" stroke="#e8cf92" stroke-width="1.4"/><path d="m36.5 20.5-2 5-5 2 2-5Z" fill="#e8cf92"/><rect x="24" y="37" width="20" height="2.6" rx="1.3" fill="#e8cf92"/><rect x="27" y="42" width="14" height="2" rx="1" fill="#e8cf92" opacity=".7"/></g>',
  play: '<circle cx="32" cy="26" r="19" fill="#bed1c6"/><path d="M26 16v20l17-10Z" fill="#52676c" stroke="#52676c" stroke-width="3" stroke-linejoin="round"/>',
  retry: '<rect x="14" y="7" width="30" height="38" rx="5" fill="#e9d9da"/><path d="M14 15h-3M14 25h-3M14 35h-3" stroke="#9c6668" stroke-width="2.4" stroke-linecap="round"/><path d="M42 33a11 11 0 1 1-3-12" fill="none" stroke="#52676c" stroke-width="3" stroke-linecap="round"/><path d="m40 14 .5 8-8-.7" fill="none" stroke="#52676c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  test: '<circle cx="32" cy="29" r="16" fill="#e7edeb" stroke="#52676c" stroke-width="2.4"/><path d="M32 29V19M32 29l7 4M27 8h10M32 8v5M47 13l3-3" fill="none" stroke="#52676c" stroke-width="2.8" stroke-linecap="round"/><circle cx="32" cy="29" r="2" fill="#9c6668"/>',
  mal: '<rect x="7" y="5" width="42" height="42" rx="10" fill="#f4efe4" stroke="#52676c" stroke-width="2"/><circle cx="16" cy="16" r="3.1" fill="#9c6668"/><circle cx="24.5" cy="16" r="3.1" fill="#9c6668"/><circle cx="33" cy="16" r="3.1" fill="#9c6668"/><circle cx="41.5" cy="16" r="3.1" fill="#9c6668"/><circle cx="16" cy="26" r="3.1" fill="#9c6668"/><circle cx="24.5" cy="26" r="3.1" fill="#9c6668"/><circle cx="33" cy="26" r="3.1" fill="#9c6668"/><circle cx="41.5" cy="26" r="3.1" fill="#9c6668"/><circle cx="16" cy="36" r="3.1" fill="#9c6668"/><circle cx="24.5" cy="36" r="3.1" fill="#9c6668"/><circle cx="33" cy="36" r="3.1" fill="#9c6668"/><circle cx="41.5" cy="36" r="3.1" fill="#9c6668"/><circle cx="50" cy="39" r="10" fill="#e9d9da" stroke="#8e5962" stroke-width="2"/><path d="M45.5 34.5l9 9M54.5 34.5l-9 9" stroke="#8e5962" stroke-width="3" stroke-linecap="round"/><path d="M54 6l1.6 3.8 3.8 1.6-3.8 1.6L54 16.8l-1.6-3.8-3.8-1.6 3.8-1.6Z" fill="#d5ad72"/>',
  kopf: '<path d="M18 46V38c-6-3-9-8-9-15C9 12 18 4 29 4s19 7 19 17c0 4-2 7-4 9v7c0 5-3 9-8 9Z" fill="#e7edeb" stroke="#52676c" stroke-width="2.2" stroke-linejoin="round"/><path d="M22 20h10M27 15v10M35 31h9" stroke="#8e5962" stroke-width="3" stroke-linecap="round"/><path d="M52 6l-5 9h6l-5 9" fill="none" stroke="#d5ad72" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 32c2 2 4 2 6 1" fill="none" stroke="#52676c" stroke-width="2" stroke-linecap="round"/>',
  schrift: '<rect x="9" y="4" width="40" height="44" rx="6" fill="#f4efe4" stroke="#52676c" stroke-width="2"/><path d="M15 12h28" stroke="#bed1c6" stroke-width="2.4" stroke-linecap="round"/><text x="41" y="25" text-anchor="end" font-family="ui-rounded,system-ui,sans-serif" font-size="11" font-weight="800" fill="#52676c">127</text><text x="41" y="36" text-anchor="end" font-family="ui-rounded,system-ui,sans-serif" font-size="11" font-weight="800" fill="#52676c">+ 58</text><path d="M16 39h26" stroke="#8e5962" stroke-width="2.4" stroke-linecap="round"/><g transform="rotate(32 50 34)"><rect x="46.5" y="16" width="7" height="26" rx="1.8" fill="#d5ad72" stroke="#52676c" stroke-width="1.8"/><path d="M46.5 42h7l-3.5 7Z" fill="#f1e4b6" stroke="#52676c" stroke-width="1.8" stroke-linejoin="round"/><rect x="46.5" y="16" width="7" height="5" fill="#e9d9da" stroke="#52676c" stroke-width="1.8"/></g>',
  quiz: '<path d="M10 12a8 8 0 0 1 8-8h28a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H30l-10 9v-9h-2a8 8 0 0 1-8-8Z" fill="#e7edeb" stroke="#52676c" stroke-width="2.2" stroke-linejoin="round"/><path d="M26 17q0-6 6-6t6 5c0 5-6 5-6 10M32 33v1.5" fill="none" stroke="#8e5962" stroke-width="3.4" stroke-linecap="round"/>',
  flaggen: '<path d="M16 6v42" stroke="#52676c" stroke-width="3.4" stroke-linecap="round"/><path d="M16 8h32l-6 9 6 9H16Z" fill="#e9d9da" stroke="#52676c" stroke-width="2" stroke-linejoin="round"/><path d="M16 14h28" stroke="#9c6668" stroke-width="3"/><path d="M16 20h26" stroke="#bed1c6" stroke-width="3"/>',
  groesser: '<path d="M32 8v36M20 44h24M14 16h36" stroke="#52676c" stroke-width="3" stroke-linecap="round"/><path d="M14 16l-7 14h14ZM50 16l-7 14h14Z" fill="#e9d9da" stroke="#52676c" stroke-width="2" stroke-linejoin="round"/><path d="M7 30q7 7 14 0M43 30q7 7 14 0" fill="#bed1c6" stroke="#52676c" stroke-width="2"/>',
  route: '<path d="M12 40c10-2 8-14 18-14s8-12 20-14" fill="none" stroke="#52676c" stroke-width="2.6" stroke-dasharray="1 6" stroke-linecap="round"/><circle cx="12" cy="40" r="5" fill="#bed1c6" stroke="#52676c" stroke-width="2"/><path d="M50 4a8 8 0 0 1 8 8c0 6-8 14-8 14s-8-8-8-14a8 8 0 0 1 8-8Z" fill="#9c6668"/><circle cx="50" cy="12" r="3" fill="#f4efe4"/>',
  memory: '<rect x="8" y="14" width="24" height="32" rx="5" fill="#e9d9da" transform="rotate(-8 20 30)"/><rect x="30" y="10" width="24" height="32" rx="5" fill="#f4efe4" stroke="#52676c" stroke-width="2" transform="rotate(7 42 26)"/><path d="m42 19 2 4 4.4.6-3.2 3 .8 4.4-4-2.2-4 2.2.8-4.4-3.2-3 4.4-.6Z" fill="#d5ad72" transform="rotate(7 42 26)"/><text x="18" y="36" font-family="ui-rounded,system-ui,sans-serif" font-size="14" font-weight="800" fill="#8e5962" transform="rotate(-8 20 30)">?</text>',
  laender: '<rect x="12" y="6" width="38" height="42" rx="6" fill="#e7edeb"/><rect x="16" y="10" width="38" height="42" rx="6" fill="#f4efe4" stroke="#52676c" stroke-width="2"/><rect x="22" y="16" width="16" height="11" rx="2" fill="#e9d9da" stroke="#52676c" stroke-width="1.6"/><path d="M22 20h16" stroke="#9c6668" stroke-width="2.4"/><path d="M22 34h26M22 40h18" stroke="#9aa9a6" stroke-width="2.4" stroke-linecap="round"/>',
  stempel: '<circle cx="32" cy="26" r="18" fill="none" stroke="#8e5962" stroke-width="2.6" stroke-dasharray="4 3"/><circle cx="32" cy="26" r="12" fill="#f3e6e7" stroke="#8e5962" stroke-width="2"/><path d="m32 17 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8Z" fill="#8e5962"/>',
  tag: '<rect x="8" y="10" width="40" height="36" rx="8" fill="#f4efe4" stroke="#52676c" stroke-width="2"/><path d="M8 20h40" stroke="#52676c" stroke-width="2"/><path d="M18 6v8M38 6v8" stroke="#52676c" stroke-width="3" stroke-linecap="round"/><circle cx="28" cy="33" r="7" fill="#d5ad72"/><path d="M28 24v-3M28 45v3M19 33h-3M40 33h3" stroke="#d5ad72" stroke-width="2.2" stroke-linecap="round"/>',
  avatar: '<circle cx="32" cy="19" r="10" fill="#e9d9da"/><path d="M12 48c0-11 8-16 20-16s20 5 20 16Z" fill="#bed1c6"/>',
  pokal: '<path d="M20 8h24v14a12 12 0 0 1-24 0Z" fill="#f1e4b6" stroke="#52676c" stroke-width="2.2" stroke-linejoin="round"/><path d="M20 12h-8c0 8 4 12 10 12M44 12h8c0 8-4 12-10 12M32 34v8M22 48h20M25 42h14" fill="none" stroke="#52676c" stroke-width="2.4" stroke-linecap="round"/>',
  farben: '<path d="M10 38c18 5 36-6 34-20C41 4 18 3 11 14c-4 8 8 8 6 14-1 5-9 2-9 6 0 3 1 4 2 4Z" fill="#f4efe4" stroke="#52676c" stroke-width="2.2" stroke-linejoin="round"/><circle cx="20" cy="17" r="3" fill="#9c6668"/><circle cx="30" cy="13" r="3" fill="#bed1c6"/><circle cx="38" cy="22" r="3" fill="#d5ad72"/><circle cx="26" cy="27" r="3" fill="#b7cbcc"/>',
  fino: '<path d="M10 8l10 8h24l10-8v24c0 11-10 18-22 18S10 43 10 32Z" fill="#e9c9a8"/><path d="M10 8l10 8-8 6ZM54 8 44 16l8 6Z" fill="#9c6668"/><path d="M20 34q12 14 24 0" fill="#f4efe4"/><circle cx="24" cy="30" r="2.4" fill="#52676c"/><circle cx="40" cy="30" r="2.4" fill="#52676c"/><ellipse cx="32" cy="38" rx="3" ry="2" fill="#52676c"/>'
};
DZ_ART.teilen = '<rect x="5" y="5" width="54" height="42" rx="9" fill="#f4efe4" stroke="#52676c" stroke-width="2"/><rect x="11" y="11" width="9" height="30" rx="2.5" fill="#bed1c6" stroke="#52676c" stroke-width="1.8"/><path d="M11 14h9M11 17h9M11 20h9M11 23h9M11 26h9M11 29h9M11 32h9M11 35h9M11 38h9" stroke="#52676c" stroke-width="1" opacity=".5"/><rect x="23" y="11" width="9" height="30" rx="2.5" fill="#bed1c6" stroke="#52676c" stroke-width="1.8"/><path d="M23 14h9M23 17h9M23 20h9M23 23h9M23 26h9M23 29h9M23 32h9M23 35h9M23 38h9" stroke="#52676c" stroke-width="1" opacity=".5"/><rect x="35" y="11" width="9" height="30" rx="2.5" fill="#bed1c6" stroke="#52676c" stroke-width="1.8"/><path d="M35 14h9M35 17h9M35 20h9M35 23h9M35 26h9M35 29h9M35 32h9M35 35h9M35 38h9" stroke="#52676c" stroke-width="1" opacity=".5"/><circle cx="51" cy="38" r="11" fill="#e9d9da" stroke="#8e5962" stroke-width="2"/><circle cx="51" cy="38" r="1.9" fill="#8e5962"/><path d="M45.5 38h11" stroke="#8e5962" stroke-width="2.8" stroke-linecap="round"/><circle cx="51" cy="32" r="1.9" fill="#8e5962"/><circle cx="51" cy="44" r="1.9" fill="#8e5962"/>';
DZ_ART.geld = '<g transform="rotate(-9 26 22)"><rect x="5" y="9" width="40" height="23" rx="4.5" fill="#bed1c6" stroke="#52676c" stroke-width="2"/><circle cx="25" cy="20.5" r="6.8" fill="#f4efe4" stroke="#52676c" stroke-width="1.7"/><text x="25" y="24.2" font-family="ui-rounded,system-ui,sans-serif" font-weight="800" text-anchor="middle" font-size="10" fill="#52676c">€</text><circle cx="11" cy="14.5" r="1.7" fill="#52676c"/><circle cx="39" cy="26.5" r="1.7" fill="#52676c"/></g><ellipse cx="46" cy="44" rx="11" ry="4.6" fill="#c3984f" stroke="#52676c" stroke-width="1.8"/><path d="M35 44v-5c0 2.5 5 4.6 11 4.6S57 41.500 57 39v5" fill="#c3984f"/><ellipse cx="46" cy="39" rx="11" ry="4.6" fill="#d5ad72" stroke="#52676c" stroke-width="1.8"/><ellipse cx="46" cy="33" rx="11" ry="4.6" fill="#e6c987" stroke="#52676c" stroke-width="1.8"/><text x="46" y="35.600" font-family="ui-rounded,system-ui,sans-serif" font-weight="800" text-anchor="middle" font-size="7" fill="#52676c">€</text>';
const dzArt = (n, cls) => `<svg viewBox="0 0 64 52" class="${cls || ''}" aria-hidden="true" focusable="false">${DZ_ART[n] || ''}</svg>`;
const dzPassport = () => dzArt('passport');

/* ---------- Samen → Baum (0 % = Samen, 100 % = voller Baum) ---------- */
function dzTreeStage(pct) { return pct >= 100 ? 5 : pct >= 75 ? 4 : pct >= 50 ? 3 : pct >= 25 ? 2 : pct > 0 ? 1 : 0; }
function dzTree(pct) {
  const st = dzTreeStage(pct);
  const ground = '<ellipse cx="60" cy="104" rx="46" ry="9" fill="#d9d4cf" opacity=".75"/><path d="M20 104q40-16 80 0" fill="#bed1c6"/>';
  const L = (x, y, r, rot) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .55}" transform="rotate(${rot} ${x} ${y})" fill="var(--dz-green)"/>`;
  let g = '';
  if (st === 0) g = '<ellipse cx="60" cy="98" rx="7" ry="4.6" transform="rotate(-14 60 98)" fill="var(--dz-trunk)"/><path d="M57 96q3-2 6 0" stroke="#f4efe4" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
  else if (st === 1) g = `<path d="M60 102V86" stroke="var(--dz-green)" stroke-width="3.4" stroke-linecap="round"/>${L(53, 84, 8, -25)}${L(67, 82, 8, 25)}`;
  else if (st === 2) g = `<path d="M60 102V70" stroke="var(--dz-green)" stroke-width="4" stroke-linecap="round"/>${L(50, 82, 10, -28)}${L(70, 78, 10, 28)}${L(52, 68, 9, -30)}${L(68, 64, 9, 30)}`;
  else if (st === 3) g = '<path d="M60 102V62" stroke="var(--dz-trunk)" stroke-width="6" stroke-linecap="round"/><circle cx="60" cy="52" r="20" fill="var(--dz-green)"/><circle cx="48" cy="60" r="12" fill="var(--dz-green)" opacity=".85"/><circle cx="73" cy="58" r="11" fill="var(--dz-green)" opacity=".85"/>';
  else if (st === 4) g = '<path d="M60 102V58M60 80l-12-12M60 74l11-10" stroke="var(--dz-trunk)" stroke-width="8" stroke-linecap="round"/><circle cx="60" cy="44" r="25" fill="var(--dz-green)"/><circle cx="42" cy="56" r="16" fill="var(--dz-green)" opacity=".85"/><circle cx="79" cy="55" r="15" fill="var(--dz-green)" opacity=".85"/>';
  else g = '<path d="M60 102V58M60 80l-14-13M60 74l13-11" stroke="var(--dz-trunk)" stroke-width="9" stroke-linecap="round"/><circle cx="60" cy="42" r="27" fill="var(--dz-green)"/><circle cx="40" cy="55" r="17" fill="var(--dz-green)" opacity=".85"/><circle cx="81" cy="54" r="16" fill="var(--dz-green)" opacity=".85"/><circle cx="52" cy="38" r="4.2" fill="#c98a82"/><circle cx="70" cy="46" r="4.2" fill="#c98a82"/><circle cx="44" cy="58" r="4.2" fill="#d5ad72"/><circle cx="78" cy="30" r="4.2" fill="#d5ad72"/><circle cx="62" cy="62" r="4.2" fill="#c98a82"/><path d="m100 22 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#d5ad72"/>';
  return `<svg viewBox="0 0 120 120" role="img" aria-label="${['Ein Samen', 'Ein kleiner Spross', 'Ein Setzling', 'Ein junger Baum', 'Ein Baum', 'Ein voller Baum'][st]}">${ground}<g class="grow" data-st="${st}">${g}</g></svg>`;
}

/* ---------- Bausteine als HTML ---------- */
const dzChip = (ic, val, label, act, o) => `<button class="dz-chip${o && o.pulse ? ' dz-pulse' : ''}" data-act="${act}" aria-label="${esc(label)}: ${val}" title="${esc(label)}">${dzIc(ic, 19)}<b>${val}</b></button>`;
/* Markenzeichen „Denkzauber“: kleiner Zauberstab mit Stern auf einem Farbquadrat (Akzentfarbe des Themes) */
const dzBrandMark = (s) => `<svg class="dz-brand-mark" viewBox="0 0 40 40" width="${s || 34}" height="${s || 34}" aria-hidden="true"><rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="var(--dz-accent)"/><path d="M9 31 24 16" stroke="#fbf6ea" stroke-width="4" stroke-linecap="round"/><path d="M9 31 24 16" stroke="var(--dz-accent)" stroke-width="1.4" stroke-dasharray="1.2 5" stroke-linecap="round" opacity=".55"/><polygon points="29.0,5.0 30.9,9.5 35.7,9.8 32.0,13.0 33.1,17.7 29.0,15.2 24.9,17.7 26.0,13.0 22.3,9.8 27.1,9.5" fill="#f1d36b" stroke="#c99a2e" stroke-width="1" stroke-linejoin="round"/><circle cx="12" cy="12" r="1.8" fill="#fbf6ea" opacity=".9"/><circle cx="33" cy="29" r="1.500" fill="#fbf6ea" opacity=".8"/></svg>`;
const dzBrand = (cls) => `<div class="dz-brand ${cls || ''}" aria-label="Denkzauber">${dzBrandMark(cls === 'sm' ? 24 : 34)}<span class="dz-brand-t">Denkzauber</span></div>`;
/* Home-Knopf: kleines Haus mit Akzent-Dach, goldener Tür und Funken */
const dzHomeArt = (s) => `<svg class="dz-home-art" viewBox="0 0 40 36" width="${s || 28}" height="${(s || 28) * .9}" aria-hidden="true"><path d="M8 17.500 20 7.500 32 17.500V30a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3Z" fill="#fbf6ea" stroke="var(--dz-ink)" stroke-width="1.800" stroke-linejoin="round"/><path d="M3.500 18.500 20 4.500l16.500 14" fill="none" stroke="var(--dz-accent)" stroke-width="4.200" stroke-linecap="round" stroke-linejoin="round"/><rect x="26.500" y="6" width="4.500" height="8" rx="1.200" fill="var(--dz-accent)"/><rect x="16.500" y="21" width="7" height="12" rx="3.500" fill="#e9c35a" stroke="var(--dz-ink)" stroke-width="1.500"/><circle cx="21.800" cy="27.500" r=".9" fill="var(--dz-ink)"/><path d="M8.500 2.500v4M6.500 4.500h4" stroke="#e0a823" stroke-width="1.600" stroke-linecap="round"/></svg>`;
/* Profil links, daneben Münzen · Sterne · Karten · Pokale */
function dzHead() {
  const L = levelInfo();
  return `<header class="dz-head"><button class="dz-me" data-act="profile" aria-label="Mein Profil: ${esc(profileName())}, Level ${L.n}, noch ${L.need} Münzen bis zum nächsten Level"><span class="dz-ring" style="--p:${L.pct}"><span class="dz-ring-in">${avArt(80)}</span><span class="dz-lvb">Level ${L.n}</span></span><strong>${esc(profileName())}</strong></button>
    ${dzBrand('hd')}<div class="dz-wallet">${dzChip('coin', S.coins, 'Münzen (zum Shop)', 'shop')}${dzChip('star', S.starsLife, 'Sterne (zum Profil)', 'profile')}${dzChip('cards', Object.keys(S.cards).length, S.chests ? 'Karten – neue Karte wartet' : 'Karten', 'schatz', { pulse: S.chests > 0 })}${dzChip('trophy', Object.keys(S.trophies).length, 'Pokale', 'trophies')}</div></header>`;
}
/* Quadratische Kachel. o: {art|html, title, sub, act, arg, cls, bar, state, tag, pulse, pct, locked, label} */
function dzTile(o) {
  const lab = o.label || (o.title + (o.sub ? ', ' + o.sub : ''));
  const art = o.html != null ? o.html : (o.art ? dzArt(o.art) : '');
  /* .dz-tile ist nur der Container (cqw-Maße gelten für Kinder); das Layout steckt in .dz-in */
  const inner = `${o.state ? `<span class="dz-state">${o.state}</span>` : ''}${o.tag ? `<span class="dz-tag">${o.tag}</span>` : ''}${o.pct != null ? `<span class="dz-pct">${o.pct}%</span>` : ''}<span class="dz-in"><span class="dz-art">${art}</span><strong>${esc(o.title)}</strong>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</span>${o.bar != null ? `<span class="dz-bar"><i style="width:${Math.max(0, Math.min(100, o.bar))}%"></i></span>` : ''}`;
  const cls = `dz-tile ${o.cls || ''}${o.bar != null ? ' has-bar' : ''}${o.pulse ? ' pulse' : ''}${o.locked ? ' locked' : ''}`;
  if (o.locked && !o.act) return `<div class="${cls}" role="img" aria-label="${esc(lab)}">${inner}</div>`;
  return `<button class="${cls}" data-act="${o.act}"${o.arg == null ? '' : ` data-arg="${esc(o.arg)}"`} aria-label="${esc(lab)}">${inner}</button>`;
}
const dzSlot = (flag) => (flag && flagOn(flag)) ? '' : '<span class="dz-slot" aria-hidden="true"></span>';       // reservierter, unsichtbarer Platz
const dzGrid = (n, tiles, cls) => `<div class="dz-grid ${cls || ''}" style="--n:${n}">${tiles}</div>`;
const dzSec = (title, sub, extra) => `<div class="dz-sec"><div><h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div>${extra || ''}</div>`;
const dzHero = (small, title, text, art, cls) => `<section class="dz-hero ${cls || ''}"><div class="dz-hero-copy">${small ? `<small>${esc(small)}</small>` : ''}<h1>${title}</h1>${text ? `<p>${text}</p>` : ''}</div>${art ? `<div class="dz-hero-art">${art}</div>` : ''}</section>`;
/* Seite mit Kopfzeile (Zurück · Titel · Münzen/Sterne), wie die inneren Seiten – für Hub-Seiten */
const dzPage = (title, back, body, extra) => `${topBar(title, back, extra)}${body}`;
/* Akkordeon: es ist immer nur ein Eintrag offen. items: [{id, badge, title, sub, body}] */
function dzAcc(items, openId, key) {
  return `<div class="dz-acc" data-key="${key}">${items.map(it => `<section class="dz-acc-item${it.id === openId ? ' open' : ''}" data-id="${esc(it.id)}">
    <button class="dz-acc-head" data-act="dzAcc" data-arg="${key}|${esc(it.id)}" aria-expanded="${it.id === openId}"><span class="dz-acc-badge">${esc(it.badge)}</span><span class="dz-acc-text"><strong>${esc(it.title)}</strong><small>${it.sub}</small></span>
    <svg class="dz-acc-chev" viewBox="0 0 32 32" aria-hidden="true"><path d="m8 12 8 8 8-8"/></svg></button>
    <div class="dz-acc-body"><div class="dz-acc-inner"><div class="dz-acc-pad">${it.body}</div></div></div></section>`).join('')}</div>`;
}
Object.assign(ACT, {
  dzAcc: a => {                                                  // Auf- und Zuklappen ohne neu zu zeichnen, damit die Bewegung weich bleibt
    const [key, id] = String(a).split('|'), root = document.querySelector(`.dz-acc[data-key="${key}"]`); if (!root) return;
    const cur = UI['acc_' + key], next = cur === id ? '' : id; UI['acc_' + key] = next;
    root.querySelectorAll('.dz-acc-item').forEach(el => { const on = el.dataset.id === next; el.classList.toggle('open', on); const b = el.querySelector('.dz-acc-head'); if (b) b.setAttribute('aria-expanded', on); });
  }
});
