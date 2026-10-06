/* =====================================================================
   HAUSAUFGABEN-SPERRE + NUTZUNGSZEIT: jeder Tag beginnt gesperrt. Frei ist nur der Hausaufgaben-Bereich
   (Meine Hefte mit Üben/Test/Extra Spaß, dazu Start und die Eltern-Seite). Alles andere – Profil, Meine Welt
   und alle ihre Unterseiten – ist gesperrt, bis das Kind entweder
   20 Minuten Hausaufgaben gemacht ODER 25 Aufgaben gelöst hat (je nachdem, was zuerst kommt).
   Danach gilt für jeden einzelnen Bereich höchstens 5 Minuten, und für alle gesperrten Bereiche zusammen
   höchstens 10 Minuten pro Tag. Gezählt wird nur, wenn die App sichtbar ist, das Kind wirklich etwas tut
   (Antippen in den letzten 2 Minuten) und die Seite kein Hausaufgaben-Bereich ist.
   Alles beruht auf dem Gerätedatum (ymd()); ein neuer Tag beginnt automatisch um 00:00 (touchDay(), store.js).
   Die Sammel-Seite „Meine Welt“ zählt selbst nicht mit (nur ihre Unterseiten). Europa Entdecker und die Ideenwerkstatt (Notizbuch, Notenheft) sind nie gesperrt und zählen nicht.
   Zustand: S.daily.rg = { tot: Sekunden gesamt heute, a: { bereich: Sekunden } }
            S.daily.rgExt = { tot, a:{} }  – heutige Verlängerung durch die Eltern (zusätzlich zu den Grenzen)
            S.hw = { log: { 'JJJJ-MM-TT': true|false }, notified: 'JJJJ-MM-TT' }  – für den „2 Tage ohne Hausaufgaben“-Hinweis
   ===================================================================== */
const HW_FREE = /^(home|hefte|extra|module|topic|play|block|review|mistakes|testSetup|test|testResult|result|newRound|parent|weltEltern|limit|kreativhefte|notiz|noten|geo[A-Za-z]*)$/;   // immer offen: Hefte, Europa Entdecker, Ideenwerkstatt (Notizbuch + Notenheft)
const HW_HUB = /^(rewards)$/;
const HW_N = 25, HW_SEC = 20 * 60, RG_AREA_CAP = 5 * 60, RG_TOTAL_CAP = 10 * 60;

/* ---------- Hausaufgaben-Status (aus den schon vorhandenen Zählern: Aufgaben heute, Übungszeit heute) ---------- */
function hwDone() { if (ADMIN) return true; touchDay(); return (S.daily.n || 0) >= HW_N || (S.daily.sec || 0) >= HW_SEC; }
function hwInfo() { touchDay(); return { n: S.daily.n || 0, need: HW_N, sec: S.daily.sec || 0, needSec: HW_SEC, done: hwDone() }; }

/* ---------- Bereich (Ordner/Unterordner) für eine Ansicht; null = kein Bereich (frei oder Sammel-Seite) ---------- */
function rgArea(v) {
  if (HW_FREE.test(v || '') || HW_HUB.test(v || '')) return null;
  if (v === 'profile' || v === 'look') return 'profile';
  const F = featOf(v);
  return F ? F.id : (v || null);
}
/* Für shell.js: true (ein Bereichs-Name oder „__hub“), solange die Ansicht erst nach der Hausaufgabe erreichbar ist */
function pgArea(v) { return HW_FREE.test(v || '') ? null : (rgArea(v) || '__hub'); }

/* ---------- Nutzungszeit je Bereich ---------- */
function rgData() {
  touchDay(); const d = S.daily;
  if (!d.rg || typeof d.rg !== 'object') d.rg = { tot: 0, a: {} };
  if (!d.rg.a) d.rg.a = {};
  if (!d.rgExt || typeof d.rgExt !== 'object') d.rgExt = { tot: 0, a: {} };
  if (!d.rgExt.a) d.rgExt.a = {};
  return d;
}
const rgAreaCap = a => RG_AREA_CAP + (rgData().rgExt.a[a] || 0);
const rgTotalCap = () => RG_TOTAL_CAP + (rgData().rgExt.tot || 0);
const rgAreaUsed = a => rgData().rg.a[a] || 0;
const rgTotalUsed = () => rgData().rg.tot || 0;
const rgName = a => a === 'profile' ? 'Mein Profil' : a === 'geo' ? 'Europa Entdecker' : a === 'geoCards' ? 'Länderkarten' : a === 'geoPass' ? 'Stempel' : a === 'geoMemory' ? 'Gedächtnis' : a === 'geoFacts' ? 'Fakten' : ((FEATS[a] || {}).title || a);
const pgName = a => rgName(a);
/* alle Bereiche mit eigener Zeitgrenze (für die Eltern-Liste): Meine-Welt-Funktionen, Profil, Europa Entdecker + Unterseiten */
const rgAreaList = () => Array.from(new Set([
  ...Object.values(FEATS).filter(f => f.view && rgArea(f.view) === f.id).map(f => f.id),
  'profile',
  ...Object.keys(rgData().rg.a)
]));

/* Zustand einer Ansicht: { open:true, left } oder { open:false, hw:true, ... } oder { open:false, totLeft, areaLeft } */
function pgState(a) {
  if (ADMIN) return { open: true, left: Infinity };
  if (!hwDone()) return Object.assign({ open: false, hw: true }, hwInfo());
  if (a === '__hub' || !a) return { open: true, left: Infinity };
  const totLeft = Math.max(0, rgTotalCap() - rgTotalUsed()), areaLeft = Math.max(0, rgAreaCap(a) - rgAreaUsed(a));
  return (totLeft > 0 && areaLeft > 0) ? { open: true, left: Math.min(totLeft, areaLeft) } : { open: false, totLeft, areaLeft };
}
function pageLock(v, st) {
  const a = rgArea(v), nm = pgName(a);
  if (st.hw) {
    const nLeft = Math.max(0, st.need - st.n), secLeft = Math.max(0, st.needSec - st.sec);
    return `${topBar('Erst Hausaufgaben', 'home')}
    <div class="lockscr pglock"><div class="lockic">${ico('lock', 44)}</div>${lockBadge()}<h2>Erst Hausaufgaben, dann der Rest</h2>
    <p>Löse noch <b>${nLeft}</b> ${nLeft === 1 ? 'Aufgabe' : 'Aufgaben'} oder übe noch <b>${fmtT(secLeft)}</b> in „Meine Hefte“. Dann sind Profil und Meine Welt für heute offen. Europa Entdecker und die Ideenwerkstatt sind immer offen.</p>
    <p class="small mute">Geschafft: ${st.n} von ${st.need} Aufgaben · ${fmtT(st.sec)} von ${fmtT(st.needSec)}.</p>
    <div class="row wrap" style="justify-content:center"><button class="btn big" data-act="goNext">Jetzt üben</button><button class="btn sec big" data-act="home">Start</button></div></div>`;
  }
  return `${topBar(esc(nm), 'rewards')}
  <div class="lockscr pglock"><div class="lockic">${ico('lock', 44)}</div>${lockBadge()}<h2>Für heute ist „${esc(nm)}“ zu</h2>
  <p>Hier ist die Zeit für heute aufgebraucht. Morgen ist „${esc(nm)}“ wieder offen.</p><p class="small mute">Alles ist gespeichert.</p>
  <div class="row wrap" style="justify-content:center"><button class="btn big" data-act="back" data-arg="rewards">Zurück</button><button class="btn sec big" data-act="home">Start</button></div></div>`;
}
/* „Noch zu“-Abzeichen für Kacheln, deren Seite gerade zu ist (Hausaufgaben noch offen oder Zeit für heute aufgebraucht) */
const lockBadge = () => `<span class="dz-lockb">${ico('lock', 13)} Noch zu</span>`;
function lockTag(v) { if (ADMIN) return ''; const a = pgArea(v); if (!a) return ''; try { return pgState(a).open ? '' : lockBadge(); } catch (e) { return ''; } }
const pgBar = (a, st) => (!a || a === '__hub' || st.left === Infinity) ? '' : `<div class="crbar on pgbar"><span>⏱ Zeit in „${esc(pgName(a))}“</span><b id="pgT">${fmtT(st.left)}</b></div>`;

/* ---------- Uhr: zählt nur in einem echten Bereich, nach der Hausaufgabe, bei sichtbarer App und frischem Antippen ---------- */
setInterval(() => {
  if (document.hidden || ADMIN || !hwDone()) return;
  try {
    const a = rgArea(view); if (!a) return;
    const st = pgState(a); if (!st.open || st.left === Infinity) return;
    if (Date.now() - lastInput > 120000) return;
    const d = rgData(); d.rg.a[a] = (d.rg.a[a] || 0) + 1; d.rg.tot = (d.rg.tot || 0) + 1;
    const left = Math.min(Math.max(0, rgTotalCap() - rgTotalUsed()), Math.max(0, rgAreaCap(a) - rgAreaUsed(a)));
    const el = $('#pgT'); if (el) el.textContent = fmtT(left);
    if (left === 30) toast('⏳', 'Noch 30 Sekunden hier. Alles wird automatisch gespeichert.');
    if (left <= 0) { save(); leaveHook(view); toast('⏳', 'Die Zeit hier ist für heute um. Alles ist gespeichert.'); render(); }
    else if (d.rg.tot % 15 === 0) save();
  } catch (e) { console.error(e); }
}, 1000);

/* ---------- Eltern: zurücksetzen und verlängern (heute), global oder je Bereich ---------- */
function rgResetAll() { const d = rgData(); d.rg = { tot: 0, a: {} }; save(); }
function rgResetArea(a) { const d = rgData(); d.rg.tot = Math.max(0, d.rg.tot - (d.rg.a[a] || 0)); delete d.rg.a[a]; save(); }
function rgExtendAll(sec) { const d = rgData(); d.rgExt.tot = (d.rgExt.tot || 0) + sec; save(); }
function rgExtendArea(a, sec) { const d = rgData(); d.rgExt.a[a] = (d.rgExt.a[a] || 0) + sec; save(); }
function hwForceDone(on) { touchDay(); if (on) S.daily.n = Math.max(S.daily.n || 0, HW_N); else { S.daily.n = 0; S.daily.sec = 0; } save(); }

/* ---------- Tageswechsel: Hausaufgaben-Ergebnis des alten Tages merken (für den „2 Tage“-Hinweis) ---------- */
function onDayRollover(oldDaily) {
  if (!S.hw || typeof S.hw !== 'object') S.hw = { log: {}, notified: '' };
  if (!S.hw.log || typeof S.hw.log !== 'object') S.hw.log = {};
  S.hw.log[oldDaily.d] = (oldDaily.n || 0) >= HW_N || (oldDaily.sec || 0) >= HW_SEC;
  const ds = Object.keys(S.hw.log).sort(); while (ds.length > 14) delete S.hw.log[ds.shift()];
}
function hwMissed2() {
  if (!S.hw || !S.hw.log) return false;
  const d2 = new Date(); d2.setDate(d2.getDate() - 2);
  return S.hw.log[yesterday()] === false && S.hw.log[ymd(d2)] === false;
}
const hwNoticeHtml = () => (hwMissed2() && S.hw.notified !== ymd())
  ? `<div class="hw-notice" role="alert"><span>${ico('lock', 20)} An den letzten zwei Tagen wurden die Hausaufgaben nicht geschafft.</span><button class="btn sm" data-act="hwNoticeOk">Verstanden</button></div>` : '';
Object.assign(ACT, { hwNoticeOk: () => { if (!S.hw) S.hw = { log: {}, notified: '' }; S.hw.notified = ymd(); save(); render(); } });
