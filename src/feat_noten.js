/* =====================================================================
   NOTENHEFT · kleine Melodien mit einer Stimme aufschreiben, anhören und speichern
   (Teil von „Kreativhefte“, erreichbar über Meine Welt)
   - Notenzeilen (Violinschlüssel) ODER Buchstaben C D E F G A H, zwei Tonlagen (tief/hoch)
   - kurz · normal · lang · Pause, Ändern (höher/tiefer/länger/kürzer), Mehrfachauswahl, Kopieren/Einfügen, Rückgängig/Wiederholen
   - Abspielen mit Web Audio (kein Download, keine Dateien), Tempo langsam/mittel/schnell, Farbcode C–H
   - mehrere Lieder („Meine Lieder“), Favorit, Beschreibung, Löschen nur nach Rückfrage
   Zustand: S.noten = { songs:[{ id, title, description, favorite, tempo, colorMode, createdAt, updatedAt, notes:[{ id, name, duration, rest, oct }] }], act: Id, pref:{ view, entry, dur, oct } }
   `oct` (0 oder 1) ist neu: fehlt er bei alten Liedern, gilt 0 – Ton und Bild bleiben wie vorher (sichere Migration).
   Speicherung: im normalen App-Speicher (S) – offline, im Admin-Modus getrennt.
   Alles hier heißt no… / NO_… (ein gemeinsames Skript).
   ===================================================================== */
const NO_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'H'];
const NO_PITCH = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, H: 6 };
const NO_COL = { C: '#E45B5B', D: '#E58A42', E: '#D7AD35', F: '#55A46A', G: '#4B91C8', A: '#706FC5', H: '#A166B5' };
const NO_FREQ = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392, A: 440, H: 493.88 };
const NO_LEN = [{ id: 'short', label: 'Kurz', beats: .5, prev: .22 }, { id: 'normal', label: 'Normal', beats: 1, prev: .4 }, { id: 'long', label: 'Lang', beats: 2, prev: .7 }];
const NO_TEMPO = { slow: { ms: 700, bpm: 80, label: 'Langsam', em: '🐢' }, medium: { ms: 480, bpm: 110, label: 'Mittel', em: '🚶' }, fast: { ms: 330, bpm: 140, label: 'Schnell', em: '🐇' } };
const NO_MAX_NOTES = 200, NO_MAX_SONGS = 60;
const NO_STARTER = [['C', 'normal'], ['D', 'normal'], ['E', 'short'], ['F', 'short'], ['G', 'long'], ['E', 'normal'], ['C', 'long']];

DZ_LABEL.noten = 'Notenheft';
DZ_ART.noten = '<rect x="6" y="9" width="52" height="34" rx="6" fill="#f4efe4" stroke="#52676c" stroke-width="2"/><path d="M12 19h40M12 25h40M12 31h40M12 37h40" stroke="#8a9a9b" stroke-width="1.4" stroke-linecap="round"/><ellipse cx="22" cy="34" rx="4.6" ry="3.3" fill="#52676c" transform="rotate(-15 22 34)"/><path d="M26.4 33V16" stroke="#52676c" stroke-width="2" stroke-linecap="round"/><ellipse cx="36" cy="28" rx="4.6" ry="3.3" fill="#7f9a9f" transform="rotate(-15 36 28)"/><path d="M40.4 27V12" stroke="#7f9a9f" stroke-width="2" stroke-linecap="round"/><ellipse cx="48" cy="22" rx="4.6" ry="3.3" fill="#9db8a4" transform="rotate(-15 48 22)"/><path d="M52.4 21V10" stroke="#9db8a4" stroke-width="2" stroke-linecap="round"/><path d="M40.4 12 52.4 10" stroke="#52676c" stroke-width="2.2" stroke-linecap="round"/>';

/* ---------- Zustand ---------- */
/* NO.sel ist jetzt immer eine Liste (auch leer oder mit einem Eintrag) – so geht Mehrfachauswahl. */
const NO = { id: null, hist: [], fut: [], sel: [], clip: [], multi: false, oct: 0, cur: 0, view: null, entry: null, dur: null, playing: false, idx: null, res: null, timer: null, saveT: null, lib: false, hint: false, te: false };
const noClone = x => JSON.parse(JSON.stringify(x));
const noId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const noLen = id => NO_LEN.find(d => d.id === id) || NO_LEN[1];
const noAbs = n => NO_PITCH[n.name] + 7 * (n.oct || 0);
const noFreq = n => NO_FREQ[n.name] * (n.oct ? 2 : 1);
function noNormSong(s) {
  if (!s || typeof s !== 'object') return null;
  s.id = String(s.id || noId()); s.title = String(s.title || 'Mein Lied').slice(0, 40); s.description = String(s.description || '').slice(0, 280);
  s.favorite = !!s.favorite; s.tempo = NO_TEMPO[s.tempo] ? s.tempo : 'medium'; s.colorMode = s.colorMode !== false;
  s.createdAt = +s.createdAt || Date.now(); s.updatedAt = +s.updatedAt || s.createdAt;
  s.notes = (Array.isArray(s.notes) ? s.notes : []).filter(n => n && NO_PITCH[n.name] != null).slice(0, NO_MAX_NOTES)
    .map(n => ({ id: String(n.id || noId()), name: n.name, duration: NO_LEN.some(d => d.id === n.duration) ? n.duration : 'normal', rest: !!n.rest, oct: n.oct === 1 ? 1 : 0 }));
  return s;
}
function noStarter() {
  return { id: noId(), title: 'Regentag-Lied', description: 'Eine kleine Melodie nach dem Klavierüben.', favorite: false, tempo: 'medium', colorMode: true, createdAt: Date.now(), updatedAt: Date.now(),
    notes: NO_STARTER.map(([name, duration]) => ({ id: noId(), name, duration, rest: false, oct: 0 })) };
}
function noNewSong() { return { id: noId(), title: 'Neues Lied', description: '', favorite: false, tempo: 'medium', colorMode: true, createdAt: Date.now(), updatedAt: Date.now(), notes: [] }; }
function noData() {
  if (!S.noten || typeof S.noten !== 'object') S.noten = { songs: [], act: null, pref: {} };
  const d = S.noten; if (!Array.isArray(d.songs)) d.songs = []; if (!d.pref || typeof d.pref !== 'object') d.pref = {};
  if (!d._ok) { d.songs = d.songs.map(noNormSong).filter(Boolean); Object.defineProperty(d, '_ok', { value: 1, enumerable: false, configurable: true }); }
  if (!d.songs.length) d.songs.push(noStarter());
  return d;
}
function noSong() {
  const d = noData();
  return d.songs.find(s => s.id === NO.id) || d.songs.find(s => s.id === d.act) || d.songs[0];
}
function noInit() {                                    // beim Öffnen der Seite
  const d = noData(), s = noSong(), p = d.pref;
  NO.id = s.id; d.act = s.id;
  NO.view = p.view === 'letters' ? 'letters' : 'staff'; NO.entry = p.entry === 'letters' ? 'letters' : 'symbols'; NO.dur = NO_LEN.some(x => x.id === p.dur) ? p.dur : 'normal';
  NO.oct = p.oct === 1 ? 1 : 0; NO.hist = [noClone(s.notes)]; NO.fut = []; NO.sel = []; NO.clip = []; NO.multi = false; NO.cur = s.notes.length; NO.lib = false; NO.res = null; NO.idx = null; NO.playing = false; NO.hint = false; NO.te = false;
}
const noSub = () => { const n = noData().songs.length; return n === 1 ? '1 Lied' : n + ' Lieder'; };

/* ---------- Speichern ---------- */
function noStat(t) { const e = $('#noStat'); if (e) e.textContent = t; }
function noSaveNow() {
  clearTimeout(NO.saveT); NO.saveT = null;
  const s = noSong(); if (!s) return;
  const ti = $('#noTitle'), de = $('#noDesc');
  if (view === 'noten' && ti) { s.title = (ti.value.trim() || 'Mein Lied').slice(0, 40); }
  if (view === 'noten' && de) s.description = de.value.slice(0, 280);
  s.updatedAt = Date.now(); const p = noData().pref; p.view = NO.view; p.entry = NO.entry; p.dur = NO.dur; p.oct = NO.oct;
  save(); noStat('✓ Gespeichert');
}
function noDirty() { noStat('Speichert …'); clearTimeout(NO.saveT); NO.saveT = setTimeout(noSaveNow, 400); }

/* ---------- Ton (Web Audio, gemeinsamer Kontext aus rewards.js; respektiert den Ton-Schalter der App) ---------- */
function noTone(n, sec) {
  if (!n || n.rest) return;
  const ac = AC(); if (!ac) { if (S.cfg.sound === false && !NO.hint) { NO.hint = true; toast('🔇', 'Der Ton ist aus. Schalte ihn mit dem Lautsprecher-Knopf ein.'); } return; }
  try {
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(noFreq(n), t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.22, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(.12, sec));
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + Math.max(.12, sec) + .03);
  } catch (e) { console.error(e); }
}
const noMs = n => NO_TEMPO[noSong().tempo].ms * noLen(n.duration).beats;
function noHalt() { clearTimeout(NO.timer); NO.timer = null; NO.playing = false; NO.idx = null; }
function noStopAll() { NO.res = null; noHalt(); if (view === 'noten') noPaintScore(); }
function noPlayFrom(i) {
  const s = noSong(), n = s.notes[i];
  if (!n) { noStopAll(); return; }
  NO.idx = i; noTone(n, noMs(n) / 1000 * .95); noPaintScore();
  NO.timer = setTimeout(() => { if (i + 1 >= s.notes.length) noStopAll(); else noPlayFrom(i + 1); }, noMs(n));
}
function noPlayToggle() {
  const s = noSong(); if (!s.notes.length) { toast('🎵', 'Füge zuerst ein paar Noten hinzu.'); return; }
  if (NO.playing) { NO.res = NO.idx; noHalt(); noPaintScore(); return; }
  AC(); NO.playing = true; const i = NO.res != null ? NO.res : (NO.sel.length ? NO.sel[0] : 0); NO.res = null; noPlayFrom(Math.min(i, s.notes.length - 1));
}
function noLeave() { noStopAll(); if (NO.saveT || $('#noTitle')) { try { noSaveNow(); } catch (e) { } } NO.lib = false; }

/* ---------- Ändern (alles rückgängig machbar, wirkt auf die ganze Auswahl) ---------- */
function noSet(next, sel, cur) {
  const s = noSong(); NO.hist.push(noClone(next)); if (NO.hist.length > 100) NO.hist.shift(); NO.fut = [];
  s.notes = next; NO.sel = Array.isArray(sel) ? sel.slice() : (sel == null ? [] : [sel]); NO.cur = cur; NO.res = null; noSaveNow(); noPaintAll();
}
function noInsert(n) {
  const s = noSong(); if (s.notes.length >= NO_MAX_NOTES) { toast('🎼', 'Das Lied ist voll. Mach ein neues Lied auf.'); return; }
  const next = [...s.notes.slice(0, NO.cur), n, ...s.notes.slice(NO.cur)];
  noSet(next, [NO.cur], NO.cur + 1);
}
const noAdd = name => { if (!NO_PITCH.hasOwnProperty(name)) return; const n = { id: noId(), name, duration: NO.dur, rest: false, oct: NO.oct || 0 }; noTone(n, noLen(n.duration).prev); noInsert(n); };
const noRest = () => noInsert({ id: noId(), name: 'C', duration: NO.dur, rest: true, oct: 0 });
function noSelect(i) {
  const s = noSong(), n = s.notes[i]; if (!n) return;
  if (NO.multi) { const k = NO.sel.indexOf(i); if (k >= 0) NO.sel.splice(k, 1); else { NO.sel.push(i); NO.sel.sort((a, b) => a - b); } }
  else NO.sel = [i];
  NO.cur = i + 1; noTone(n, noLen(n.duration).prev); noPaintAll();
}
function noUndo() { if (NO.hist.length < 2) return; NO.fut.unshift(NO.hist.pop()); const s = noSong(); s.notes = noClone(NO.hist[NO.hist.length - 1]); NO.sel = []; NO.cur = Math.min(NO.cur, s.notes.length); NO.res = null; noSaveNow(); noPaintAll(); }
function noRedo() { if (!NO.fut.length) return; const x = NO.fut.shift(); NO.hist.push(noClone(x)); const s = noSong(); s.notes = noClone(x); NO.sel = []; NO.cur = Math.min(NO.cur, s.notes.length); NO.res = null; noSaveNow(); noPaintAll(); }
function noPitch(dir) {
  const s = noSong(); if (!NO.sel.length) return;
  const next = noClone(s.notes); let changed = false, last = null;
  NO.sel.forEach(i => {
    const n = next[i]; if (!n || n.rest) return;
    const abs = Math.max(0, Math.min(13, NO_PITCH[n.name] + 7 * (n.oct || 0) + dir)), oct = Math.floor(abs / 7), name = NO_NAMES[abs % 7];
    if (oct === (n.oct || 0) && name === n.name) return;
    n.oct = oct; n.name = name; changed = true; last = n;
  });
  if (!changed) { toast('🎼', dir > 0 ? 'Höher geht es hier nicht.' : 'Tiefer geht es hier nicht.'); return; }
  if (last) noTone(last, noLen(last.duration).prev); noSet(next, NO.sel, NO.cur);
}
function noLength(dir) {
  const s = noSong(); if (!NO.sel.length) return;
  const next = noClone(s.notes); let changed = false;
  NO.sel.forEach(i => {
    const n = next[i]; if (!n) return;
    const li = NO_LEN.findIndex(x => x.id === n.duration), j = Math.max(0, Math.min(2, li + dir));
    if (j === li) return; n.duration = NO_LEN[j].id; changed = true;
  });
  if (!changed) { toast('🎼', dir > 0 ? 'Länger geht es nicht.' : 'Kürzer geht es nicht.'); return; }
  noSet(next, NO.sel, NO.cur);
}
function noCopy() {
  if (!NO.sel.length) return;
  const s = noSong(); NO.clip = NO.sel.map(i => s.notes[i]).filter(Boolean).map(noClone);
  toast('⧉', NO.clip.length === 1 ? 'Note kopiert' : NO.clip.length + ' Noten kopiert'); noPaintAll();
}
function noPaste() {
  if (!NO.clip.length) { toast('📋', 'Erst eine Note mit „Kopieren“ wählen.'); return; }
  const s = noSong(); if (s.notes.length + NO.clip.length > NO_MAX_NOTES) { toast('🎼', 'Das Lied ist voll. Mach ein neues Lied auf.'); return; }
  const copies = NO.clip.map(n => Object.assign(noClone(n), { id: noId() }));
  const next = [...s.notes.slice(0, NO.cur), ...copies, ...s.notes.slice(NO.cur)];
  noSet(next, copies.map((_, k) => NO.cur + k), NO.cur + copies.length);
  toast('📋', copies.length === 1 ? 'Note eingefügt' : copies.length + ' Noten eingefügt');
}
function noRemove() {
  if (!NO.sel.length) return;
  const s = noSong(), rm = new Set(NO.sel), first = Math.min(...NO.sel);
  const next = s.notes.filter((_, k) => !rm.has(k));
  noSet(next, [], Math.min(first, next.length));
}

/* ---------- Zeichnen: Bausteine ---------- */
/* Violinschlüssel und Pause als Linien (keine Spezialschrift nötig – funktioniert auf jedem Tablet offline) */
const NO_CLEF = 'M-1 66C0 52 3 32 4 16C5 3 12-8 6-14C1-18-6-8-4 6C-3 20 6 30 14 36C22 44 14 56 4 54C-6 52-8 40 0 36C6 33 12 38 10 44M-1 64C-2 72-10 75-10 69';
const NO_REST = 'M-3-12 5-4-2 4C-7 8-5 12 3 18 -4 16-8 21-3 26';
function noGlyph(kind, sz) {
  const st = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  const body = kind === 'rest' ? `<path d="M9 3l6 6-5 5c-3 3-2 5 3 8-4-1-6 1-3 4" ${st}/>`
    : `<ellipse cx="9" cy="18" rx="5" ry="3.7" transform="rotate(-18 9 18)" fill="${kind === 'long' ? 'none' : 'currentColor'}" stroke="currentColor" stroke-width="2"/><path d="M13.7 16.6V3.5" ${st}/>${kind === 'short' ? `<path d="M13.7 3.5q6 2 4 8" ${st}/>` : ''}`;
  return `<svg viewBox="0 0 24 24" width="${sz || 24}" height="${sz || 24}" aria-hidden="true" focusable="false">${body}</svg>`;
}
const noColor = (n, colored) => colored && !n.rest ? NO_COL[n.name] : 'var(--dz-ink)';
/* Tonhöhe auf der Linie: zwei Tonlagen (oct 0/1), je 7px pro Schritt; Hilfslinien werden allgemein berechnet (noLedgers) */
const noY = (name, oct, top) => top + 70 - 7 * (NO_PITCH[name] + 7 * (oct || 0));
function noLedgers(x, y, top) {
  let h = '', top1 = top, bot1 = top + 56;
  if (y < top1 - .1) for (let ly = top1 - 14; ly >= y - .1; ly -= 14) h += `<line class="no-ln no-ledger" x1="${x - 16}" y1="${ly}" x2="${x + 16}" y2="${ly}"/>`;
  else if (y > bot1 + .1) for (let ly = bot1 + 14; ly <= y + .1; ly += 14) h += `<line class="no-ln no-ledger" x1="${x - 16}" y1="${ly}" x2="${x + 16}" y2="${ly}"/>`;
  return h;
}
function noPerLine() {
  const w = document.documentElement.clientWidth || 800, cw = Math.min(980, w) - 28 - (w >= 900 ? 276 : 0) - 8;
  return Math.max(5, Math.min(12, Math.floor((cw / .8 - 170) / 62.5)));
}
function noScoreSvg() {
  const s = noSong(), notes = s.notes, perLine = noPerLine(), gap = 62.5, W = Math.round(115 + perLine * gap + 55), lineH = 145;
  const lines = Math.max(1, Math.ceil((notes.length + 1) / perLine)), H = lines * lineH + 25;
  const selSet = new Set(NO.sel), playAt = NO.playing ? NO.idx : NO.res;
  let h = '';
  for (let l = 0; l < lines; l++) {
    const top = 38 + l * lineH;
    for (let k = 0; k < 5; k++) h += `<line class="no-ln" x1="50" y1="${top + k * 14}" x2="${W - 40}" y2="${top + k * 14}"/>`;
    h += `<path class="no-clef" transform="translate(76 ${top})" d="${NO_CLEF}"/><line class="no-bar" x1="108" y1="${top}" x2="108" y2="${top + 56}"/>`;
  }
  notes.forEach((n, i) => {
    const l = Math.floor(i / perLine), pos = i % perLine, x = 118 + pos * gap + gap / 2, top = 38 + l * lineH;
    const sel = selSet.has(i), playing = playAt === i, col = noColor(n, s.colorMode), d = noLen(n.duration);
    const y = n.rest ? top + 28 : noY(n.name, n.oct, top), down = !n.rest && noAbs(n) >= 6;
    const lab = `${i + 1}. ${n.rest ? 'Pause' : 'Note ' + n.name + (n.oct ? ' hoch' : '')}, ${d.label}${sel ? ', gewählt' : ''}`;
    h += `<g class="no-n${sel ? ' sel' : ''}${playing ? ' playing' : ''}" data-act="noSel" data-arg="${i}" role="button" tabindex="0" aria-label="${lab}">`;
    h += `<rect class="no-hit" x="${x - 28}" y="${top - 22}" width="56" height="${lineH - 8}" rx="14"/>`;
    if (sel) h += `<rect class="no-selbox" x="${x - 24}" y="${top - 16}" width="48" height="${lineH - 40}" rx="13"/>`;
    if (playing) h += `<circle class="no-playdot" cx="${x}" cy="${top - 15}" r="4.5"/>`;
    if (n.rest) {
      h += `<path transform="translate(${x} ${y})" d="${NO_REST}" fill="none" stroke="var(--dz-ink)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (d.id === 'short') h += `<path transform="translate(${x} ${y})" d="M-9 12 -2 16" stroke="var(--dz-ink)" stroke-width="3" stroke-linecap="round"/>`;
      if (d.id === 'long') h += `<rect x="${x - 10}" y="${top + 28 - 5}" width="20" height="5" fill="var(--dz-ink)" rx="1"/>`;
    } else {
      h += noLedgers(x, y, top);
      h += `<ellipse cx="${x}" cy="${y}" rx="10" ry="7" transform="rotate(-15 ${x} ${y})" style="fill:${d.id === 'long' ? 'var(--dz-surface)' : col};stroke:${col}" stroke-width="3"/>`;
      if (d.id !== 'long') {
        const sx = down ? x - 8.5 : x + 8.5, e = down ? y + 39 : y - 39;
        h += `<line x1="${sx}" y1="${y + (down ? 1 : -1)}" x2="${sx}" y2="${e}" style="stroke:${col}" stroke-width="3" stroke-linecap="round"/>`;
        if (d.id === 'short') h += `<path d="M ${sx} ${e} Q ${sx + 22} ${down ? e - 6 : e + 6}, ${sx + 12} ${down ? e - 25 : e + 25}" fill="none" style="stroke:${col}" stroke-width="3"/>`;
      } else {
        const sx = down ? x - 9 : x + 9, e = down ? y + 39 : y - 39;
        h += `<line x1="${sx}" y1="${y + (down ? 1 : -1)}" x2="${sx}" y2="${e}" style="stroke:${col}" stroke-width="3" stroke-linecap="round"/>`;
      }
      if (s.colorMode) h += `<text x="${x}" y="${down ? y - 14 : y + 25}" text-anchor="middle" font-size="13" font-weight="800" style="fill:${col}">${n.name}${n.oct ? '²' : ''}</text>`;
    }
    h += '</g>';
  });
  const cl = Math.floor(NO.cur / perLine), cp = NO.cur % perLine, cx = 118 + cp * gap + gap / 2 - gap / 2 + 4, ct = 38 + cl * lineH;
  h += `<line class="no-cur" x1="${cx}" y1="${ct - 6}" x2="${cx}" y2="${ct + 66}"/><path class="no-curflag" d="M${cx} ${ct - 6}l15 5.5-15 5.5z"/>`;
  if (!notes.length) h += `<text class="no-empty" x="${W / 2}" y="${38 + 90}" text-anchor="middle" font-size="19">Tippe unten auf eine Note, dann geht es los</text>`;
  return `<svg id="noScore" viewBox="0 0 ${W} ${H}" role="group" aria-label="Notenzeile, ${notes.length} Noten">${h}</svg>`;
}
function noLettersHtml() {
  const s = noSong(), selSet = new Set(NO.sel), playAt = NO.playing ? NO.idx : NO.res;
  let h = '';
  s.notes.forEach((n, i) => {
    if (NO.cur === i) h += '<span class="no-lcur" aria-hidden="true"></span>';
    const col = noColor(n, s.colorMode), d = noLen(n.duration), sel = selSet.has(i), playing = playAt === i;
    h += `<button class="no-lk${sel ? ' sel' : ''}${playing ? ' playing' : ''}" style="color:${col}" data-act="noSel" data-arg="${i}" aria-label="${i + 1}. ${n.rest ? 'Pause' : 'Note ' + n.name + (n.oct ? ' hoch' : '')}, ${d.label}${sel ? ', gewählt' : ''}">${n.rest ? '—' : n.name + (n.oct ? '²' : '')}<small>${n.rest ? 'Pause' : d.label}</small></button>`;
  });
  if (NO.cur === s.notes.length) h += '<span class="no-lcur" aria-hidden="true"></span>';
  if (!s.notes.length) h = '<p class="no-empty-t">Tippe unten auf einen Buchstaben, dann geht es los.</p>';
  return h;
}
function noMini(name, oct) {
  const abs = NO_PITCH[name] + 7 * (oct || 0), y = 78 - abs * 5, d = noLen(NO.dur), ink = 'var(--dz-ink)', down = abs >= 6;
  const sx = down ? 34 : 50, e = down ? y + 26 : y - 26;
  return `<svg viewBox="0 0 84 88" aria-hidden="true" focusable="false">${[0, 1, 2, 3, 4].map(i => `<line x1="7" y1="${28 + i * 9} " x2="77" y2="${28 + i * 9}" style="stroke:var(--dz-mute)"/>`).join('')}${abs === 0 ? `<line x1="28" y1="${y}" x2="56" y2="${y}" style="stroke:var(--dz-mute)"/>` : ''}${abs >= 13 ? `<line x1="28" y1="${y}" x2="56" y2="${y}" style="stroke:var(--dz-mute)"/>` : ''}<ellipse cx="42" cy="${y}" rx="8.5" ry="5.8" transform="rotate(-15 42 ${y})" style="fill:${d.id === 'long' ? 'var(--dz-surface)' : ink};stroke:${ink}" stroke-width="2.5"/><line x1="${sx}" y1="${y - (down ? -1 : 1)}" x2="${sx}" y2="${e}" style="stroke:${ink}" stroke-width="2.5" stroke-linecap="round"/>${d.id === 'short' ? `<path d="M${sx} ${e}q17 ${down ? -5 : 5} 9 ${down ? -14 : 14}" fill="none" style="stroke:${ink}" stroke-width="2.5"/>` : ''}</svg>`;
}

/* ---------- Zeichnen: Abschnitte ---------- */
function noBarHtml() {
  return `<div class="no-top"><span id="noStat" class="no-stat" role="status" aria-live="polite">✓ Gespeichert</span>
    <div class="no-top-b"><button class="btn sec" data-act="noUndo" aria-label="Letzte Änderung zurücknehmen" ${NO.hist.length < 2 ? 'disabled' : ''}>↶ <span class="no-hide">Zurück</span></button><button class="btn sec" data-act="noRedo" aria-label="Zurückgenommene Änderung wiederholen" ${NO.fut.length ? '' : 'disabled'}>↷ <span class="no-hide">Wieder</span></button><button class="btn sec" data-act="noLib">${ico('music', 18)} Meine Lieder</button><button class="btn" data-act="noSave">Speichern</button></div></div>`;
}
function noHeadHtml() {                                  // kompakte Überschrift; Bearbeiten nur über das Stift-Symbol
  const s = noSong(), v = NO.view;
  const seg = `<div class="seg no-seg" role="group" aria-label="Ansicht"><button data-act="noView" data-arg="staff" class="${v === 'staff' ? 'active' : ''}" aria-pressed="${v === 'staff'}">${noGlyph('normal', 18)} Noten</button><button data-act="noView" data-arg="letters" class="${v === 'letters' ? 'active' : ''}" aria-pressed="${v === 'letters'}">C–H</button></div>`;
  if (NO.te) return `<section class="no-head no-head-edit"><div class="no-head-row"><input id="noTitle" class="no-title" maxlength="40" value="${esc(s.title)}" aria-label="Name des Liedes" autocomplete="off"><button class="btn" data-act="noTitleOk" aria-label="Titel fertig">${ico('check', 18)} Fertig</button><span class="no-grow"></span>${seg}</div>
    <div class="no-drow"><span aria-hidden="true">✎</span><textarea id="noDesc" class="no-desc" rows="2" maxlength="280" aria-label="Beschreibung, Erinnerung oder Text zum Lied (freiwillig)" placeholder="Beschreibung oder Text (freiwillig)">${esc(s.description)}</textarea></div></section>`;
  return `<section class="no-head"><div class="no-head-row"><h2 class="no-h" id="noHead">${esc(s.title)}</h2><button class="no-ibtn no-ibtn-s" data-act="noTitleEdit" aria-label="Titel und Beschreibung bearbeiten" title="Bearbeiten">${ico('pen', 18)}</button><button class="no-ibtn no-ibtn-s no-fav${s.favorite ? ' on' : ''}" data-act="noFav" aria-pressed="${s.favorite}" aria-label="${s.favorite ? 'Lieblingslied: ja' : 'Als Lieblingslied merken'}" title="Lieblingslied">${s.favorite ? '★' : '☆'}</button><span class="no-grow"></span>${seg}</div>${s.description ? `<p class="no-sub">${esc(s.description)}</p>` : ''}</section>`;
}
function noPlayBarHtml() {
  const snd = S.cfg.sound !== false, s = noSong();
  return `<div class="no-playbar"><button class="no-ibtn no-ibtn-play" data-act="noPlay" aria-label="${NO.playing ? 'Anhalten' : 'Lied abspielen'}" title="${NO.playing ? 'Anhalten' : 'Abspielen'}">${ico(NO.playing ? 'pause' : 'play', 22)}</button>
    <button class="no-ibtn" data-act="toggleSound" aria-pressed="${snd}" aria-label="${snd ? 'Klavier-Ton ausschalten' : 'Klavier-Ton einschalten'}" title="${snd ? 'Klavier' : 'Stumm'}">${ico(snd ? 'speaker' : 'mute', 20)}</button>
    <span class="no-chip" id="noTempo" aria-hidden="true">♩ ${NO_TEMPO[s.tempo].bpm}</span></div>`;
}
function noScoreHtml() {
  const bar = noPlayBarHtml();
  return NO.view === 'staff' ? `<div id="noScoreBox" class="no-score">${bar}${noScoreSvg()}</div>`
    : `<section id="noScoreBox" class="dz-panel no-lview">${bar}<h3>Buchstaben-Ansicht</h3><div class="no-lrow">${noLettersHtml()}</div></section>`;
}
function noEditHtml() {
  const s = noSong(), has = NO.sel.length > 0, allRest = has && NO.sel.every(i => s.notes[i] && s.notes[i].rest);
  return `<div class="no-edit-bar" role="toolbar" aria-label="Note ändern">
    <button class="no-ibtn" data-act="noHigher" ${(!has || allRest) ? 'disabled' : ''} aria-label="Höher" title="Höher">${ico('up', 20)}</button>
    <button class="no-ibtn" data-act="noLower" ${(!has || allRest) ? 'disabled' : ''} aria-label="Tiefer" title="Tiefer">${ico('down', 20)}</button>
    <button class="no-ibtn" data-act="noLonger" ${!has ? 'disabled' : ''} aria-label="Länger" title="Länger">${noGlyph('long', 18)}</button>
    <button class="no-ibtn" data-act="noShorter" ${!has ? 'disabled' : ''} aria-label="Kürzer" title="Kürzer">${noGlyph('short', 18)}</button>
    <button class="no-ibtn" data-act="noMulti" aria-pressed="${NO.multi}" aria-label="${NO.multi ? 'Mehrfachauswahl beenden' : 'Mehrere Noten auswählen'}" title="Mehrere wählen">${ico('grid', 18)}</button>
    <button class="no-ibtn" data-act="noCopy" ${!has ? 'disabled' : ''} aria-label="Auswahl kopieren" title="Kopieren">${ico('copy', 20)}</button>
    <button class="no-ibtn no-paste" data-act="noPaste" ${!NO.clip.length ? 'disabled' : ''} aria-label="Kopierte Noten einfügen" title="Einfügen">${ico('paste', 20)}</button>
    <button class="no-ibtn no-danger" data-act="noDel" ${!has ? 'disabled' : ''} aria-label="Auswahl löschen" title="Löschen">${ico('trash', 20)}</button></div>`;
}
function noRibbonHtml() {
  const s = noSong();
  return `<div class="no-ribbon"><div class="no-temposeg" role="group" aria-label="Tempo">${Object.keys(NO_TEMPO).map(k => `<button class="no-sm${s.tempo === k ? ' active' : ''}" data-act="noTempo" data-arg="${k}" aria-pressed="${s.tempo === k}" aria-label="Tempo: ${NO_TEMPO[k].label}" title="${NO_TEMPO[k].label}">${NO_TEMPO[k].em}</button>`).join('')}</div>
    <button class="no-ibtn no-colorbtn${s.colorMode ? ' active' : ''}" data-act="noColor" role="switch" aria-checked="${s.colorMode}" aria-label="${s.colorMode ? 'C–H-Farbcode ausschalten' : 'C–H-Farbcode einschalten'}" title="C–H-Farbcode">${ico('palette', 20)}</button></div>`;
}
function noOctHtml() {
  return `<div class="seg no-seg no-octseg" role="group" aria-label="Tonlage für neue Noten"><button data-act="noOct" data-arg="low" class="${NO.oct ? '' : 'active'}" aria-pressed="${!NO.oct}" title="Tiefe Töne">${ico('down', 16)} Tief</button><button data-act="noOct" data-arg="high" class="${NO.oct ? 'active' : ''}" aria-pressed="${!!NO.oct}" title="Hohe Töne">${ico('up', 16)} Hoch</button></div>`;
}
function noAddHtml() {
  const lk = NO.entry === 'letters';
  return `<section class="dz-panel no-add"><h2>Note hinzufügen</h2>
    <div class="seg no-seg" role="group" aria-label="Eingabe"><button data-act="noEntry" data-arg="symbols" class="${lk ? '' : 'active'}" aria-pressed="${!lk}">Noten</button><button data-act="noEntry" data-arg="letters" class="${lk ? 'active' : ''}" aria-pressed="${lk}">C–H</button></div>
    ${noOctHtml()}
    <div class="no-durs" role="group" aria-label="Länge der neuen Note">${NO_LEN.map(d => `<button class="no-dur${NO.dur === d.id ? ' active' : ''}" data-act="noDur" data-arg="${d.id}" aria-pressed="${NO.dur === d.id}" aria-label="Länge: ${d.label}" title="${d.label}">${noGlyph(d.id, 20)}</button>`).join('')}<button class="no-dur" data-act="noRest" aria-label="Pause einfügen, ${noLen(NO.dur).label}" title="Pause">${noGlyph('rest', 20)}</button></div>
    ${lk ? `<div class="no-keys no-lkeys no-keys-sm">${NO_NAMES.map(n => `<button class="no-lkey" style="color:${NO_COL[n]}" data-act="noAdd" data-arg="${n}" aria-label="Note ${n}${NO.oct ? ' hoch' : ''} hinzufügen, ${noLen(NO.dur).label}">${n}${NO.oct ? '²' : ''}</button>`).join('')}</div>`
      : `<div class="no-keys no-keys-sm">${NO_NAMES.map(n => `<button class="no-key" data-act="noAdd" data-arg="${n}" aria-label="Note ${n}${NO.oct ? ' hoch' : ''} hinzufügen, ${noLen(NO.dur).label}">${noMini(n, NO.oct)}</button>`).join('')}</div>`}</section>`;
}
function noLibHtml() {
  if (!NO.lib) return '';
  const L = noData().songs;
  return `<div class="no-lib" id="noLibBox" role="dialog" aria-modal="true" aria-label="Meine Lieder"><div class="no-lib-c"><div class="no-lib-h"><h2>Meine Lieder</h2><button class="btn sec" data-act="noLibClose" aria-label="Meine Lieder schließen">✕</button></div>
    <div class="no-lib-g">${L.map(s => `<div class="no-song${s.id === NO.id ? ' cur' : ''}"><button class="no-song-o" data-act="noOpen" data-arg="${esc(s.id)}" aria-label="Lied öffnen: ${esc(s.title)}"><span class="no-song-i">♫ ${s.favorite ? '★' : ''}</span><b>${esc(s.title)}</b><small>${s.notes.length} ${s.notes.length === 1 ? 'Note' : 'Noten'} · ${new Date(s.updatedAt).toLocaleDateString('de-DE')}</small></button><button class="no-song-d" data-act="noAskDel" data-arg="${esc(s.id)}" aria-label="Lied löschen: ${esc(s.title)}">${ico('trash', 18)}</button></div>`).join('')}
    ${L.length < NO_MAX_SONGS ? '<button class="no-new" data-act="noNew"><span>＋</span>Neues Lied</button>' : ''}</div></div></div>`;
}
const noToolbarHtml = () => `<div class="no-toolbar">${noEditHtml()}${noRibbonHtml()}</div>`;      // links: Noten ändern · rechts: Tempo + C–H-Farbcode
const noMain = () => `${noBarHtml()}${noHeadHtml()}<div class="no-grid"><div class="no-main">${noScoreHtml()}${noToolbarHtml()}</div><aside class="no-side" id="noSide">${noAddHtml()}</aside></div>`;
VIEWS.noten = () => { if (NO.id == null || !noData().songs.some(s => s.id === NO.id)) noInit(); return topBar('Notenheft', 'kreativhefte') + `<div class="no-page" id="noPage">${noMain()}</div><div id="noLibSlot">${noLibHtml()}</div>`; };

/* Teil-Zeichnen: so bleiben Tasten und Bildlauf ruhig, auch beim Abspielen */
function noPaintAll() {
  if (view !== 'noten') return;
  const keep = { t: $('#noTitle') && $('#noTitle').value, d: $('#noDesc') && $('#noDesc').value };
  const p = $('#noPage'); if (!p) return render();
  p.innerHTML = noMain();
  const ti = $('#noTitle'), de = $('#noDesc'); if (ti && keep.t != null && NO.saveT) ti.value = keep.t; if (de && keep.d != null && NO.saveT) de.value = keep.d;
  const sl = $('#noLibSlot'); if (sl) sl.innerHTML = noLibHtml();
}
function noPaintScore() {
  if (view !== 'noten') return;
  const b = $('#noScoreBox'); if (!b) return;
  const tmp = document.createElement('div'); tmp.innerHTML = noScoreHtml(); b.replaceWith(tmp.firstElementChild);
}

/* ---------- Aktionen ---------- */
function noOpenSong(id) {
  noLeave(); const d = noData(), s = d.songs.find(x => x.id === id); if (!s) return;
  NO.id = s.id; d.act = s.id; NO.hist = [noClone(s.notes)]; NO.fut = []; NO.sel = []; NO.lib = false; NO.res = null; NO.idx = null; NO.playing = false; NO.cur = s.notes.length; NO.te = false;
  save(); noPaintAll();
}
registerFeature({
  id: 'noten', title: 'Notenheft', icon: 'music', tint: 'sky', group: 'world', order: 8, view: 'noten', sub: noSub, leave: noLeave,
  acts: {
    noten: () => { NO.id = null; go('noten'); },
    noSel: a => noSelect(+a), noAdd: a => noAdd(a), noRest, noUndo, noRedo,
    noHigher: () => noPitch(1), noLower: () => noPitch(-1), noLonger: () => noLength(1), noShorter: () => noLength(-1),
    noCopy, noPaste, noDel: noRemove,
    noMulti: () => { NO.multi = !NO.multi; if (!NO.multi && NO.sel.length > 1) NO.sel = [NO.sel[NO.sel.length - 1]]; noPaintAll(); },
    noOct: a => { NO.oct = a === 'high' ? 1 : 0; noSaveNow(); noPaintAll(); },
    noPlay: noPlayToggle,
    noView: a => { NO.view = a === 'letters' ? 'letters' : 'staff'; noSaveNow(); noPaintAll(); },
    noEntry: a => { NO.entry = a === 'letters' ? 'letters' : 'symbols'; noSaveNow(); noPaintAll(); },
    noDur: a => { if (NO_LEN.some(d => d.id === a)) { NO.dur = a; noSaveNow(); noPaintAll(); } },
    noTempo: a => { if (!NO_TEMPO[a]) return; noSong().tempo = a; noSaveNow(); noPaintAll(); },
    noColor: () => { const s = noSong(); s.colorMode = !s.colorMode; noSaveNow(); noPaintAll(); },
    noTitleEdit: () => { NO.te = true; noPaintAll(); const t = $('#noTitle'); if (t) { t.focus(); t.select(); } },
    noTitleOk: () => { const t = $('#noTitle'); if (t && !t.value.trim()) t.value = 'Mein Lied'; noSaveNow(); NO.te = false; noPaintAll(); },
    noFav: () => { const s = noSong(); s.favorite = !s.favorite; noSaveNow(); noPaintAll(); },
    noSave: () => { noSaveNow(); toast('✅', 'Lied gespeichert'); },
    noLib: () => { noSaveNow(); NO.lib = true; noPaintAll(); const b = $('.no-song.cur .no-song-o') || $('.no-lib .btn'); if (b) b.focus(); },
    noLibClose: () => { NO.lib = false; const sl = $('#noLibSlot'); if (sl) sl.innerHTML = ''; },
    noOpen: a => noOpenSong(a),
    noNew: () => {
      const d = noData(); if (d.songs.length >= NO_MAX_SONGS) return toast('🎼', 'Das Heft ist voll. Lösche erst ein Lied.');
      noSaveNow(); const s = noNewSong(); d.songs.unshift(s); noOpenSong(s.id); NO.te = true; noPaintAll(); const t = $('#noTitle'); if (t) { t.focus(); t.select(); }
    },
    noAskDel: a => { const s = noData().songs.find(x => x.id === a); if (!s) return; modal('Lied löschen?', `„${esc(s.title)}“ mit ${s.notes.length} ${s.notes.length === 1 ? 'Note' : 'Noten'}<br><br>Ein gelöschtes Lied ist weg.`, 'Ja, löschen', 'noDelYes', s.id, 'Nein, behalten'); },
    noDelYes: a => {
      closeModal(); const d = noData(), i = d.songs.findIndex(x => x.id === a); if (i < 0) return;
      const wasCur = a === NO.id; d.songs.splice(i, 1); if (!d.songs.length) d.songs.push(noNewSong());
      if (wasCur) { NO.id = null; noStopAll(); const s = d.songs[0]; NO.id = s.id; d.act = s.id; NO.hist = [noClone(s.notes)]; NO.fut = []; NO.sel = []; NO.cur = s.notes.length; NO.te = false; }
      save(); noPaintAll(); toast('🗑️', 'Lied gelöscht');
    }
  }
});

/* ---------- Eingaben, Tastatur, Lebenszyklus ---------- */
document.addEventListener('input', e => {
  if (view !== 'noten') return;
  if (e.target.id === 'noTitle') { const s = noSong(); s.title = e.target.value.slice(0, 40); noDirty(); }
  else if (e.target.id === 'noDesc') { const s = noSong(); s.description = e.target.value.slice(0, 280); noDirty(); }
});
document.addEventListener('change', e => { if (view === 'noten' && e.target.id === 'noTitle' && !e.target.value.trim()) { e.target.value = 'Mein Lied'; noSong().title = 'Mein Lied'; noSaveNow(); } });
document.addEventListener('keydown', e => {
  if (view !== 'noten') return;
  if (e.key === 'Escape' && NO.lib && !$('#modal')) { ACT.noLibClose(); return; }
  if (e.key === 'Enter' && e.target && e.target.id === 'noTitle') { e.preventDefault(); ACT.noTitleOk(); return; }
  const t = e.target;
  if ((e.key === 'Enter' || e.key === ' ') && t && t.classList && t.classList.contains('no-n')) { e.preventDefault(); ACT.noSel(t.dataset.arg); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && view === 'noten') { noStopAll(); try { noSaveNow(); } catch (e) { } } });
window.addEventListener('pagehide', () => { if (view === 'noten') { noHalt(); try { noSaveNow(); } catch (e) { } } });
let noLastPL = noPerLine();
window.addEventListener('resize', () => { if (view === 'noten' && noPerLine() !== noLastPL) { noLastPL = noPerLine(); noPaintScore(); } });
