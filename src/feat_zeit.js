/* =====================================================================
   SEITENZEIT: jede Seite in „Meine Welt“ (Shop, Musik, Geschichte, Weltreise, Fakten, Pokale, Karten, Wesen, Buch, Insel, Avatar)
   hat ein kurzes Zeitfenster (Standard 3 Minuten). Danach ist die Seite zu, bis das Kind wirklich gearbeitet hat
   (Standard: 5 gelöste Aufgaben). Höchstens 2 Fenster pro Seite und Tag – es sei denn, das Tagesziel ist geschafft.
   Frei von dieser Regel: Meine Hefte, Extra Spaß (Übungen), Europa Entdecker mit allen Unterseiten, Start. Das Profil (mit Farben & Töne) zählt als eine Seite.
   Eltern können einzelne Seiten oder alle Seiten für den Rest des Tages ganz sperren (S.daily.lock = { all, pages:{seite:true} }) – das gilt auch dann, wenn das Tagesziel geschafft ist.
   Zustand: S.daily.pg[seite] = { sec: Sekunden im jetzigen Fenster, w: Nr. des Fensters, lockN: Aufgabenzahl beim Schließen | null }
   Der Tagesstand wird jeden Tag neu angelegt (touchDay). Nichts Gesammeltes wird je verändert.
   ===================================================================== */
const PG_FREE = /^(home|hefte|module|topic|play|block|review|mistakes|result|testSetup|test|testResult|limit|parent|rewards|extra|weltEltern|geo.*)$/;
function pgArea(v) {
  if (PG_FREE.test(v || '')) return null;
  if (v === 'profile' || v === 'look') return 'profile';
  const F = featOf(v);
  return F && F.id !== 'geo' ? F.id : null;
}
const pgMin = () => S.cfg.pageMin == null ? 3 : S.cfg.pageMin;
const pgOn = () => !ADMIN && pgMin() > 0;
function pgRec(a) { touchDay(); return S.daily.pg[a] || (S.daily.pg[a] = { sec: 0, w: 1, lockN: null }); }
const pgWin = () => Math.max(1, S.cfg.pageWin || 2), pgNeed = () => Math.max(1, S.cfg.pageNeed || 10);
/* Zustand einer Seite: { open:true, left:Sekunden|Infinity } oder { open:false, final, need, goalLeft } */
function pgLockRec() { touchDay(); const d = S.daily; if (!d.lock || typeof d.lock !== 'object') d.lock = { all: false, pages: {} }; if (!d.lock.pages) d.lock.pages = {}; return d.lock; }
const pgLocked = a => { const l = pgLockRec(); return !!(l.all || l.pages[a]); };
function pgState(a) {
  if (!a || ADMIN) return { open: true, left: Infinity };
  if (pgLocked(a)) return { open: false, parent: true };                     // von den Eltern für heute gesperrt
  if (!pgOn()) return { open: true, left: Infinity };
  touchDay();
  if (S.daily.got) return { open: true, left: Infinity };                    // Tagesziel geschafft: keine Seitenzeit mehr heute
  const r = pgRec(a);
  if (r.lockN != null) {
    const have = Math.max(0, (S.daily.n || 0) - r.lockN);
    if (r.w < pgWin() && have >= pgNeed()) { r.w++; r.sec = 0; r.lockN = null; save(); }
    else return { open: false, final: r.w >= pgWin(), need: Math.max(0, pgNeed() - have), goalLeft: Math.max(0, (S.cfg.goal || 20) - (S.daily.n || 0)) };
  }
  return { open: true, left: Math.max(0, pgMin() * 60 - r.sec) };
}
function pgReset(a) { touchDay(); if (a) delete S.daily.pg[a]; else S.daily.pg = {}; save(); }
const pgName = a => a === 'profile' ? 'Mein Profil' : ((FEATS[a] || {}).title || a);
/* alle Seiten, für die eine Seitenzeit gilt (für die Eltern-Liste) */
const pgAreas = () => Object.values(FEATS).filter(f => f.view && pgArea(f.view) === f.id).sort((a, b) => a.order - b.order).map(f => f.id).concat(['profile']);
function pageLock(v, st) {
  const a = pgArea(v), nm = pgName(a), home = a === 'profile';
  const msg = st.parent
    ? 'Deine Eltern haben diese Seite für heute geschlossen. Üben kannst du trotzdem – und morgen ist sie wieder offen!'
    : st.final
      ? `Für heute ist hier Schluss. Schaffe dein Tagesziel (noch ${st.goalLeft} Aufgaben) – dann ist die Seite wieder offen. Morgen geht es sowieso weiter!`
      : `Die Zeit hier ist um. Löse noch <b>${st.need}</b> ${st.need === 1 ? 'Aufgabe' : 'Aufgaben'} beim Üben – dann hast du hier noch einmal ${pgMin()} Minuten.`;
  return `${topBar(esc(nm), home ? 'home' : 'rewards')}
  <div class="lockscr pglock"><div class="lockic">${ico('lock', 44)}</div><h2>Kleine Pause von „${esc(nm)}“</h2>
  <p>${msg}</p><p class="small mute">Alles ist gespeichert.</p>
  <div class="row wrap" style="justify-content:center"><button class="btn big" data-act="goNext">Jetzt üben</button><button class="btn sec big" data-act="${home ? 'home' : 'rewards'}">${home ? 'Start' : 'Meine Welt'}</button></div></div>`;
}
const pgBar = (a, st) => (st.left === Infinity || !a) ? '' : `<div class="crbar on pgbar"><span>⏱ Zeit auf dieser Seite</span><b id="pgT">${fmtT(st.left)}</b></div>`;

/* Uhr: zählt nur, wenn man wirklich auf der Seite ist, die App sichtbar ist und das Kind noch etwas tut (Antippen in den letzten 2 Minuten) */
setInterval(() => {
  if (document.hidden) return;
  try {
    const a = pgArea(view); if (!a || !pgOn()) return;
    const st = pgState(a); if (!st.open || st.left === Infinity) return;
    if (Date.now() - lastInput > 120000) return;
    const r = pgRec(a); r.sec++;
    const left = Math.max(0, pgMin() * 60 - r.sec), el = $('#pgT'); if (el) el.textContent = fmtT(left);
    if (left === 30) toast('⏳', 'Noch 30 Sekunden auf dieser Seite. Alles wird automatisch gespeichert.');
    if (left <= 0) {
      r.lockN = S.daily.n || 0; save(); leaveHook(view);
      toast('⏳', 'Die Zeit hier ist um. Alles ist gespeichert.'); render();
    } else if (r.sec % 15 === 0) save();
  } catch (e) { console.error(e); }
}, 1000);
