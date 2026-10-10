/* =====================================================================
   HAUSAUFGABEN-SPERRE + NUTZUNGSZEIT: jeder Tag beginnt gesperrt. Frei ist nur der Hausaufgaben-Bereich
   (Meine Hefte mit Üben/Test/Extra Spaß, dazu Start und die Eltern-Seite). Alles andere – Profil, Meine Welt
   und alle ihre Unterseiten – ist gesperrt, bis das Kind entweder
   20 Minuten Hausaufgaben gemacht ODER 25 Aufgaben gelöst hat (je nachdem, was zuerst kommt).
   Danach gilt für jeden einzelnen Bereich höchstens 5 Minuten, und für alle gesperrten Bereiche zusammen
   höchstens 10 Minuten pro Tag. Gezählt wird nur, wenn die App sichtbar ist, das Kind wirklich etwas tut
   (Antippen in den letzten 2 Minuten) und die Seite kein Hausaufgaben-Bereich ist.
   FREIE ZEIT: Vor der Hausaufgabe gibt es jeden Tag 4 Minuten freie Zeit für alle sonst gesperrten Bereiche (eine sichtbare Uhr läuft).
   Ist sie um, erscheint der Hinweis „Als Nächstes: 25 Aufgaben oder 20 Minuten üben“. S.daily.free = genutzte Sekunden, S.daily.freeMsg = Hinweis gezeigt.
   ELTERN-FREIGABEN: S.cfg.perm = { bereichs-id: 'open'|'lock' } (fehlt = automatisch). Gilt für Hauptbereiche (m_…) und Unterbereiche (SEC_TREE).
   'lock' sperrt immer (auch freie Bereiche), 'open' öffnet ohne Hausaufgabe und ohne Zeitgrenze. Ein Unterbereich mit eigener Einstellung gewinnt.
   Alles beruht auf dem Gerätedatum (ymd()); ein neuer Tag beginnt automatisch um 00:00 (touchDay(), store.js).
   Die Sammel-Seite „Meine Welt“ zählt selbst nicht mit (nur ihre Unterseiten). Europa Entdecker und die Ideenwerkstatt (Musik, Geschichte, Notenheft) sind nie gesperrt und zählen nicht.
   Zustand: S.daily.rg = { tot: Sekunden gesamt heute, a: { bereich: Sekunden } }
            S.daily.rgExt = { tot, a:{} }  – heutige Verlängerung durch die Eltern (zusätzlich zu den Grenzen)
            S.hw = { log: { 'JJJJ-MM-TT': true|false }, notified: 'JJJJ-MM-TT' }  – für den „2 Tage ohne Hausaufgaben“-Hinweis
   ===================================================================== */
const HW_FREE = /^(home|hefte|extra|module|topic|play|block|review|mistakes|testSetup|test|testResult|result|newRound|parent|weltEltern|limit|kopf|kreativhefte|notiz|noten|musik|musikSongs|story|storyread|geo[A-Za-z]*)$/;   // immer offen: Hefte, Europa Entdecker, Ideenwerkstatt (Musik, Geschichte, Notenheft)
const HW_HUB = /^(rewards)$/;
const HW_N = 25, HW_SEC = 20 * 60, RG_AREA_CAP = 5 * 60, RG_TOTAL_CAP = 10 * 60, FREE_SEC = 4 * 60;

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
const rgName = a => (a === 'profile' ? 'Mein Profil' : a === 'geo' ? 'Europa Entdecker' : a === 'geoCards' ? 'Länderkarten' : a === 'geoPass' ? 'Stempel' : a === 'geoMemory' ? 'Gedächtnis' : a === 'geoFacts' ? 'Fakten' : ((FEATS[a] || {}).title || secName(a) || a));
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
  if (!hwDone()) {
    const fl = freeLeft();
    if (fl > 0) return { open: true, left: fl, free: true, hub: a === '__hub' };
    return Object.assign({ open: false, hw: true, freeUsed: true }, hwInfo());
  }
  if (a === '__hub' || !a) return { open: true, left: Infinity };
  const totLeft = Math.max(0, rgTotalCap() - rgTotalUsed()), areaLeft = Math.max(0, rgAreaCap(a) - rgAreaUsed(a));
  return (totLeft > 0 && areaLeft > 0) ? { open: true, left: Math.min(totLeft, areaLeft) } : { open: false, totLeft, areaLeft };
}
function pageLock(v, st) {
  const a = rgArea(v), nm = pgName(a);
  if (st.perm) {
    const sc = secOf(v) || {}, pn = secName(sc.s) || secName(sc.m) || nm;
    return `${topBar(esc(pn), 'home')}
    <div class="lockscr pglock"><div class="lockic">${ico('lock', 44)}</div>${lockBadge()}<h2>„${esc(pn)}“ ist gerade zu</h2>
    <p>Deine Eltern haben diesen Bereich im Eltern-Bereich geschlossen. Frag sie, wenn du ihn öffnen möchtest.</p><p class="small mute">Alles ist gespeichert.</p>
    <div class="row wrap" style="justify-content:center"><button class="btn big" data-act="home">Start</button></div></div>`;
  }
  if (st.hw) {
    const nLeft = Math.max(0, st.need - st.n), secLeft = Math.max(0, st.needSec - st.sec);
    return `${topBar('Erst Hausaufgaben', 'home')}
    <div class="lockscr pglock"><div class="lockic">${ico('lock', 44)}</div>${lockBadge()}<h2>Erst Hausaufgaben, dann der Rest</h2>
    ${st.freeUsed ? '<p><b>Deine 4 freien Minuten sind für heute vorbei.</b></p>' : ''}<p>Löse noch <b>${nLeft}</b> ${nLeft === 1 ? 'Aufgabe' : 'Aufgaben'} oder übe noch <b>${fmtT(secLeft)}</b> in „Meine Hefte“. Dann sind Profil und Meine Welt für heute offen. Europa Entdecker und die Ideenwerkstatt sind immer offen.</p>
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
function lockTag(v) { if (ADMIN) return ''; try { return viewState(v).open ? '' : lockBadge(); } catch (e) { return ''; } }
const pgBar = (a, st) => st.free ? `<div class="crbar on pgbar freebar"><span>⏱ Freie Zeit heute</span><b id="pgT">${fmtT(st.left)}</b></div>`
  : (!a || a === '__hub' || st.left === Infinity) ? '' : `<div class="crbar on pgbar"><span>⏱ Zeit in „${esc(pgName(a))}“</span><b id="pgT">${fmtT(st.left)}</b></div>`;

/* ---------- Freie Zeit (vor der Hausaufgabe, 4 Minuten pro Tag) ---------- */
const freeUsed = () => { touchDay(); return S.daily.free || 0; };
const freeLeft = () => Math.max(0, FREE_SEC - freeUsed());
function freeOver() {
  touchDay(); if (S.daily.freeMsg) return; S.daily.freeMsg = true; save();
  modal('Die freie Zeit ist um', 'Deine 4 freien Minuten für heute sind vorbei. <b>Als Nächstes:</b> Löse 25 Aufgaben <b>oder</b> übe 20 Minuten in „Meine Hefte“. Dann sind Profil und Meine Welt wieder offen.', 'Jetzt üben', 'goNext', '', 'Später');
}
/* Hinweis auf der Startseite: wie viel freie Zeit es heute noch gibt */
function freeNoteHtml() {
  if (ADMIN || hwDone()) return '';
  const fl = freeLeft();
  return fl > 0 ? `<div class="dz-note freenote">⏱ <span>Freie Zeit heute: <b id="freeT">${fmtT(fl)}</b> für Profil und Meine Welt. Danach: 25 Aufgaben oder 20 Minuten üben.</span></div>`
    : `<div class="dz-note freenote">${ico('lock', 16)} <span>Die freie Zeit ist um. Nächste Freigabe: 25 Aufgaben oder 20 Minuten üben (heute ${hwInfo().n} von 25).</span></div>`;
}

/* ---------- Bereiche für die Eltern-Freigaben (Haupt- und Unterbereiche) ---------- */
const SEC_TREE = () => [
  { id: 'm_hefte', de: 'Meine Hefte', en: 'My workbooks', free: true, subs: [['mistakes', 'Fehler-Heft', 'Mistakes book'], ['minitest', 'Mini-Test', 'Mini test'], ['KOPF', 'Kopfrechnen', 'Mental arithmetic']] },
  { id: 'm_geo', de: 'Europa Entdecker', en: 'Europe Explorer', free: true, subs: [['geoPlay', 'Spiele (Quiz, Flaggen …)', 'Games (quiz, flags …)'], ['geoMemory', 'Memory', 'Memory'], ['geoCards', 'Länderkarten', 'Country cards'], ['geoFacts', 'Wusstest du?', 'Did you know?'], ['geoPass', 'Stempelpass', 'Stamp passport']] },
  { id: 'm_kreativ', de: 'Ideenwerkstatt', en: 'Idea workshop', free: true, subs: [['musik', 'Meine Musik', 'My music'], ['story', 'Geschichte', 'Story'], ['noten', 'Notenheft', 'Music book']] },
  { id: 'm_welt', de: 'Meine Welt', en: 'My World', subs: [['shop', 'Shop', 'Shop'], ['welt', 'Meine Weltreise', 'My world trip']]
      .concat(DZ_FLAGS.filter(f => flagOn(f.id)).map(f => [f.id, f.label, ({ wesen: 'My creatures', buch: 'My book', insel: 'My island' })[f.id] || f.label])) },
  { id: 'm_profil', de: 'Mein Profil', en: 'My profile', subs: [['profile', 'Profilseite & Farben', 'Profile page & colours'], ['avatar', 'Das bin ich (Avatar)', 'Avatar'], ['trophies', 'Pokale', 'Trophies'], ['schatz', 'Lustige Karten', 'Fun cards']] }
];
function secName(id) {
  if (!id) return '';
  for (const m of SEC_TREE()) { if (m.id === id) return m.de; const x = m.subs.find(s => s[0] === id); if (x) return x[1]; }
  return '';
}
const EXTRA_IDS = ['EMAL', 'KOPF', 'SCHR'];
/* Welcher Haupt-/Unterbereich zeigt die Ansicht v? null = gehört zu keinem (Start, Eltern) */
function secOf(v) {
  v = v || '';
  if (v === 'hefte') return { m: 'm_hefte' };
  if (v === 'mistakes' || v === 'result') return { m: 'm_hefte', s: 'mistakes' };
  if (v === 'testSetup' || v === 'test' || v === 'testResult') return { m: 'm_hefte', s: 'minitest' };
  if (['module', 'topic', 'play', 'block', 'review', 'newRound', 'extra'].includes(v)) {
    if (v === 'play' && typeof R !== 'undefined' && R && R.kind === 'mistakes') return { m: 'm_hefte', s: 'mistakes' };
    const mid = (v === 'play' && typeof R !== 'undefined' && R && R.mod) ? R.mod : UI.mod;
    return EXTRA_IDS.includes(mid) ? { m: 'm_hefte', s: 'KOPF' } : { m: 'm_hefte' };
  }
  if (v === 'kopf') return { m: 'm_hefte', s: 'KOPF' };
  if (v === 'geo') return { m: 'm_geo' };
  if (/^geo/.test(v)) return { m: 'm_geo', s: ({ geoResult: 'geoPlay', geoCard: 'geoCards' })[v] || v };
  if (v === 'kreativhefte') return { m: 'm_kreativ' };
  if (v === 'noten') return { m: 'm_kreativ', s: v };
  if (v === 'musik' || v === 'musikSongs') return { m: 'm_kreativ', s: 'musik' };
  if (v === 'story' || v === 'storyread') return { m: 'm_kreativ', s: 'story' };
  if (v === 'rewards') return { m: 'm_welt' };
  if (v === 'profile' || v === 'look') return { m: 'm_profil', s: 'profile' };
  if (['avatar', 'trophies', 'schatz'].includes(v)) return { m: 'm_profil', s: v };
  if (/^(home|parent|weltEltern|limit)$/.test(v)) return null;
  const F = featOf(v), a = v === 'urkunde' ? 'buch' : (F ? F.id : null);
  return a ? { m: 'm_welt', s: a } : null;
}
const permGet = id => ((S.cfg && S.cfg.perm) || {})[id] || '';
function permOfSec(sc) { if (!sc) return ''; const own = sc.s === 'KOPF' ? (permGet('KOPF') || permGet('EMAL') || permGet('SCHR')) : (sc.s && permGet(sc.s)); return own || permGet(sc.m) || ''; }     // Kopfrechnen: frühere Einstellungen für Einmaleins/Schriftlich gelten weiter
const permOf = v => permOfSec(secOf(v));
function permSet(id, val) { if (!S.cfg.perm || typeof S.cfg.perm !== 'object') S.cfg.perm = {}; if (val === 'open' || val === 'lock') S.cfg.perm[id] = val; else delete S.cfg.perm[id]; save(); }
/* Gesamtzustand einer Ansicht: Eltern-Freigabe → Hausaufgabe/freie Zeit → Zeitgrenzen */
function viewState(v) {
  const pm = ADMIN ? '' : permOf(v);
  if (pm === 'lock') return { open: false, perm: true };
  if (ADMIN || pm === 'open') return { open: true, left: Infinity };
  const a = pgArea(v); if (!a) return { open: true, left: Infinity };
  return pgState(a);
}
/* „Noch zu“ für Kacheln, auch tief in Ordnern: die Kachel weiß über data-act, wohin sie führt */
const ACT_VIEW = { geoGo: 'geoPlay', gCard: 'geoCard', goNext: null, toggleSound: null, parent: null, home: null };
function tileLocked(act, arg) {
  if (ADMIN || !act) return false;
  if (act === 'mod') { const pm = permOfSec(EXTRA_IDS.includes(arg) ? { m: 'm_hefte', s: 'KOPF' } : { m: 'm_hefte' }); return pm === 'lock'; }
  const v = act in ACT_VIEW ? ACT_VIEW[act] : (VIEWS[act] ? act : null);
  if (!v) return false;
  try { return !viewState(v).open; } catch (e) { return false; }
}
function lockTilesPass() {
  document.querySelectorAll('#app .dz-tile[data-act]:not(.locked)').forEach(t => {
    if (!tileLocked(t.dataset.act, t.dataset.arg)) return;
    t.classList.add('locked');
    if (!t.querySelector('.dz-lockb')) { const tag = t.querySelector('.dz-tag'); if (tag) tag.insertAdjacentHTML('beforeend', lockBadge()); else t.insertAdjacentHTML('afterbegin', `<span class="dz-tag">${lockBadge()}</span>`); }
  });
}

/* ---------- Uhr: zählt nur in einem echten Bereich, nach der Hausaufgabe, bei sichtbarer App und frischem Antippen ---------- */
setInterval(() => {
  if (document.hidden || ADMIN) return;
  try {
    const a = rgArea(view); if (!a) return;
    const st = viewState(view); if (!st.open || st.left === Infinity) return;
    if (Date.now() - lastInput > 120000) return;
    if (st.free) {                                                          // freie Zeit vor der Hausaufgabe
      S.daily.free = (S.daily.free || 0) + 1; const fl = freeLeft();
      const el = $('#pgT'); if (el) el.textContent = fmtT(fl);
      if (fl === 30) toast('⏳', 'Noch 30 Sekunden freie Zeit. Alles wird automatisch gespeichert.');
      if (fl <= 0) { save(); leaveHook(view); render(); freeOver(); }
      else if (S.daily.free % 15 === 0) save();
      return;
    }
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
function freeReset() { touchDay(); S.daily.free = 0; S.daily.freeMsg = false; save(); }
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
