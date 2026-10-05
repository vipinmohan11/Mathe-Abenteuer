/* =====================================================================
   ADMIN-MODUS (nur für Eltern, zum Ausprobieren)
   - Eigener Speicher (Endung „_admin“ in localStorage, IndexedDB und Sicherungen). Der Stand des Kindes wird weder gelesen noch geschrieben.
   - Alles ist freigeschaltet, Münzen und Sterne sind immer wieder auf 9999, keine Zeitgrenzen, keine PIN.
   - Umschalten: Eltern-Bereich → „Nutzer“. Beim Umschalten lädt die App neu. Zurück zum Kind: Knopf im orangen Balken.
   ===================================================================== */
const ADMIN_MAX = 9999;
function adminSetMode(on) {
  try { localStorage.setItem(MODE_KEY, on ? 'admin' : 'child'); } catch (e) { toast('⚠️', 'Der Modus konnte nicht gewechselt werden.'); return; }
  try { save(); } catch (e) { }
  location.reload();
}
function adminTopUp() {
  if (!ADMIN) return false;
  let ch = false;
  ['coins', 'life', 'stars', 'starsLife', 'flamesLife'].forEach(k => { if ((S[k] || 0) < ADMIN_MAX) { S[k] = ADMIN_MAX; ch = true; } });
  if ((S.chests || 0) < 20) { S.chests = 20; ch = true; }
  try { const w = wS(); if (w.miles - w.milesSpent < ADMIN_MAX) { w.miles = w.milesSpent + ADMIN_MAX; ch = true; } } catch (e) { }
  return ch;
}
function adminFill() {
  if (!ADMIN) return;
  if (!S.name) S.name = 'Admin';
  adminTopUp();
  try { Object.keys(CATALOG).forEach(id => unlock(id, true)); } catch (e) { console.error(e); }
  try { Object.keys(S.owned).forEach(sl => { if (SHOP[sl]) SHOP[sl].items.forEach(it => { if (!S.owned[sl].includes(it.id)) S.owned[sl].push(it.id); }); }); } catch (e) { }
  try { DZ_FLAGS.forEach(f => { S.flags[f.id] = true; }); } catch (e) { }
  try { CARDS.forEach(c => { if (!S.cards[c.id]) S.cards[c.id] = Date.now(); }); } catch (e) { }
  try { const w = wS(); Object.keys(WP).forEach(id => { if (!w.open[id]) w.open[id] = wDay(); }); } catch (e) { }
  try { const f = fSt(); f.early = Math.max(f.early || 0, 50); } catch (e) { }
  S.cfg.shopMin = 0; S.cfg.limitMin = 0; S.cfg.pageMin = 0;
  save();
}
const adminBar = () => ADMIN
  ? `<div class="adminbar" role="status"><span>🔧 <b>Admin-Modus</b> · Testdaten – der Stand deines Kindes bleibt unberührt</span><button class="btn sm sec" data-act="adminOff">Zurück zum Kind</button></div>`
  : '';
Object.assign(ACT, {
  adminAsk: () => modal('Admin-Modus starten?', 'Du siehst die App mit <b>allem freigeschaltet</b> und immer 9999 🪙 und ⭐. Das ist ein <b>eigener Testspeicher</b>: Münzen, Sterne, Karten und Pokale deines Kindes werden weder gezeigt noch verändert. Die App lädt dabei neu.', 'Admin-Modus starten', 'adminOn', '', 'Abbrechen'),
  adminOn: () => { closeModal(); adminSetMode(true); },
  adminOff: () => adminSetMode(false)
});
setInterval(() => { try { if (ADMIN && adminTopUp()) { save(); if (!/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '') && !['play', 'test'].includes(view)) render(); } } catch (e) { } }, 1500);
