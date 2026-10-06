/* =====================================================================
   NOTENHEFT · kleine Melodien mit einer Stimme aufschreiben, anhören und speichern
   (aus „Denkzauber Music Notebook“ übernommen: eigene Seite auf der Startseite unter „Wohin heute?“)
   - Notenzeilen (Violinschlüssel) ODER Buchstaben C D E F G A H, Eingabe per Notenbild-Tasten oder Buchstaben
   - kurz · normal · lang · Pause, Ändern (höher/tiefer/länger/kürzer/kopieren/löschen), Rückgängig/Wiederholen
   - Abspielen mit Web Audio (kein Download, keine Dateien), Tempo langsam/mittel/schnell, Farbcode C–H
   - mehrere Lieder („Meine Lieder“), Favorit, Beschreibung, Löschen nur nach Rückfrage
   Zustand: S.noten = { songs:[{ id, title, description, favorite, tempo, colorMode, createdAt, updatedAt, notes:[{ id, name, duration, rest }] }], act: Id, pref:{ view, entry, dur } }
   Speicherung: im normalen App-Speicher (S) – offline, im Admin-Modus getrennt. Für die Seitenzeit gilt die Regel für alle Seiten außer Hefte/Europa.
   Alles hier heißt no… / NO_… (ein gemeinsames Skript).
   ===================================================================== */
const NO_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'H'];
const NO_PITCH = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, H: 6 };
const NO_COL = { C: '#E45B5B', D: '#E58A42', E: '#D7AD35', F: '#55A46A', G: '#4B91C8', A: '#706FC5', H: '#A166B5' };
const NO_FREQ = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392, A: 440, H: 493.88 };
const NO_LEN = [{ id: 'short', label: 'Kurz', beats: .5, prev: .22 }, { id: 'normal', label: 'Normal', beats: 1, prev: .4 }, { id: 'long', label: 'Lang', beats: 2, prev: .7 }];
const NO_TEMPO = { slow: { ms: 700, bpm: 80, label: 'Langsam' }, medium: { ms: 480, bpm: 110, label: 'Mittel' }, fast: { ms: 330, bpm: 140, label: 'Schnell' } };
const NO_MAX_NOTES = 200, NO_MAX_SONGS = 60;
const NO_STARTER = [['C', 'normal'], ['D', 'normal'], ['E', 'short'], ['F', 'short'], ['G', 'long'], ['E', 'normal'], ['C', 'long']];

DZ_LABEL.noten = 'Notenheft';
DZ_ART.noten = '<rect x="6" y="9" width="52" height="34" rx="6" fill="#f4efe4" stroke="#52676c" stroke-width="2"/><path d="M12 19h40M12 25h40M12 31h40M12 37h40" stroke="#8a9a9b" stroke-width="1.4" stroke-linecap="round"/><ellipse cx="22" cy="34" rx="4.6" ry="3.3" fill="#52676c" transform="rotate(-15 22 34)"/><path d="M26.4 33V16" stroke="#52676c" stroke-width="2" stroke-linecap="round"/><ellipse cx="36" cy="28" rx="4.6" ry="3.3" fill="#7f9a9f" transform="rotate(-15 36 28)"/><path d="M40.4 27V12" stroke="#7f9a9f" stroke-width="2" stroke-linecap="round"/><ellipse cx="48" cy="22" rx="4.6" ry="3.3" fill="#9db8a4" transform="rotate(-15 48 22)"/><path d="M52.4 21V10" stroke="#9db8a4" stroke-width="2" stroke-linecap="round"/><path d="M40.4 12 52.4 10" stroke="#52676c" stroke-width="2.2" stroke-linecap="round"/>';

/* ---------- Zustand ---------- */
const NO = { id: null, hist: [], fut: [], sel: null, cur: 0, view: null, entry: null, dur: null, playing: false, idx: null, res: null, timer: null, saveT: null, lib: false, hint: false };
const noClone = x => JSON.parse(JSON.stringify(x));
const noId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const noLen = id => NO_LEN.find(d => d.id === id) || NO_LEN[1];
function noNormSong(s) {
  if (!s || typeof s !== 'object') return null;
  s.id = String(s.id || noId()); s.title = String(s.title || 'Mein Lied').slice(0, 40); s.description = String(s.description || '').slice(0, 280);
  s.favorite = !!s.favorite; s.tempo = NO_TEMPO[s.tempo] ? s.tempo : 'medium'; s.colorMode = s.colorMode !== false;
  s.createdAt = +s.createdAt || Date.now(); s.updatedAt = +s.updatedAt || s.createdAt;
  s.notes = (Array.isArray(s.notes) ? s.notes : []).filter(n => n && NO_PITCH[n.name] != null).slice(0, NO_MAX_NOTES)
    .map(n => ({ id: String(n.id || noId()), name: n.name, duration: NO_LEN.some(d => d.id === n.duration) ? n.duration : 'normal', rest: !!n.rest }));
  return s;
}
function noStarter() {
  return { id: noId(), title: 'Regentag-Lied', description: 'Eine kleine Melodie nach dem Klavierüben.', favorite: false, tempo: 'medium', colorMode: true, createdAt: Date.now(), updatedAt: Date.now(),
    notes: NO_STARTER.map(([name, duration]) => ({ id: noId(), name, duration, rest: false })) };
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
  NO.hist = [noClone(s.notes)]; NO.fut = []; NO.sel = null; NO.cur = s.notes.length; NO.lib = false; NO.res = null; NO.idx = null; NO.playing = false; NO.hint = false;
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
  s.updatedAt = Date.now(); const p = noData().pref; p.view = NO.view; p.entry = NO.entry; p.dur = NO.dur;
  save(); noStat('✓ Gespeichert');
}
function noDirty() { noStat('Speichert …'); clearTimeout(NO.saveT); NO.saveT = setTimeout(noSaveNow, 400); }

/* ---------- Ton (Web Audio, gemeinsamer Kontext aus rewards.js; respektiert den Ton-Schalter der App) ---------- */
function noTone(n, sec) {
  if (!n || n.rest) return;
  const ac = AC(); if (!ac) { if (S.cfg.sound === false && !NO.hint) { NO.hint = true; toast('🔇', 'Der Ton ist aus. Schalte ihn auf der Startseite ein.'); } return; }
  try {
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(NO_FREQ[n.name], t);
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
  AC(); NO.playing = true; const i = NO.res != null ? NO.res : (NO.sel != null ? NO.sel : 0); NO.res = null; noPlayFrom(Math.min(i, s.notes.length - 1));
}
function noLeave() { noStopAll(); if (NO.saveT || $('#noTitle')) { try { noSaveNow(); } catch (e) { } } NO.lib = false; }

/* ---------- Ändern (alles rückgängig machbar) ---------- */
function noSet(next, sel, cur) {
  const s = noSong(); NO.hist.push(noClone(next)); if (NO.hist.length > 100) NO.hist.shift(); NO.fut = [];
  s.notes = next; NO.sel = sel; NO.cur = cur; NO.res = null; noSaveNow(); noPaintAll();
}
function noInsert(n) {
  const s = noSong(); if (s.notes.length >= NO_MAX_NOTES) { toast('🎼', 'Das Lied ist voll. Mach ein neues Lied auf.'); return; }
  const next = [...s.notes.slice(0, NO.cur), n, ...s.notes.slice(NO.cur)];
  noSet(next, NO.cur, NO.cur + 1);
}
const noAdd = name => { if (!NO_PITCH.hasOwnProperty(name)) return; const n = { id: noId(), name, duration: NO.dur, rest: false }; noTone(n, noLen(n.duration).prev); noInsert(n); };
const noRest = () => noInsert({ id: noId(), name: 'C', duration: NO.dur, rest: true });
function noSelect(i) { const s = noSong(), n = s.notes[i]; if (!n) return; NO.sel = i; NO.cur = i + 1; noTone(n, noLen(n.duration).prev); noPaintAll(); }
function noUndo() { if (NO.hist.length < 2) return; NO.fut.unshift(NO.hist.pop()); const s = noSong(); s.notes = noClone(NO.hist[NO.hist.length - 1]); NO.sel = null; NO.cur = Math.min(NO.cur, s.notes.length); NO.res = null; noSaveNow(); noPaintAll(); }
function noRedo() { if (!NO.fut.length) return; const x = NO.fut.shift(); NO.hist.push(noClone(x)); const s = noSong(); s.notes = noClone(x); NO.sel = null; NO.cur = Math.min(NO.cur, s.notes.length); NO.res = null; noSaveNow(); noPaintAll(); }
function noPitch(dir) {
  const s = noSong(); if (NO.sel == null || s.notes[NO.sel].rest) return;
  const next = noClone(s.notes), n = next[NO.sel], idx = Math.max(0, Math.min(6, NO_PITCH[n.name] + dir));
  if (NO_NAMES[idx] === n.name) { toast('🎼', dir > 0 ? 'Höher geht es hier nicht.' : 'Tiefer geht es hier nicht.'); return; }
  n.name = NO_NAMES[idx]; noTone(n, noLen(n.duration).prev); noSet(next, NO.sel, NO.cur);
}
function noLength(dir) {
  const s = noSong(); if (NO.sel == null) return;
  const next = noClone(s.notes), n = next[NO.sel], i = NO_LEN.findIndex(x => x.id === n.duration), j = Math.max(0, Math.min(2, i + dir));
  if (j === i) { toast('🎼', dir > 0 ? 'Länger geht es nicht.' : 'Kürzer geht es nicht.'); return; }
  n.duration = NO_LEN[j].id; noSet(next, NO.sel, NO.cur);
}
function noDup() {
  const s = noSong(); if (NO.sel == null) return;
  if (s.notes.length >= NO_MAX_NOTES) { toast('🎼', 'Das Lied ist voll. Mach ein neues Lied auf.'); return; }
  const c = Object.assign(noClone(s.notes[NO.sel]), { id: noId() }), next = [...s.notes.slice(0, NO.sel + 1), c, ...s.notes.slice(NO.sel + 1)];
  noTone(c, noLen(c.duration).prev); noSet(next, NO.sel + 1, NO.sel + 2);
}
function noRemove() { const s = noSong(); if (NO.sel == null) return; const i = NO.sel; noSet(s.notes.filter((_, k) => k !== i), null, i); }

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
/* Tonhöhe auf der Linie: E sitzt auf der untersten Linie, G auf der zweiten (Violinschlüssel), C hat einen kleinen Hilfsstrich */
const noY = (name, top) => top + 70 - NO_PITCH[name] * 7;
function noPerLine() {
  const w = document.documentElement.clientWidth || 800, cw = Math.min(980, w) - 28 - (w >= 900 ? 276 : 0) - 8;
  return Math.max(5, Math.min(12, Math.floor((cw / .8 - 170) / 62.5)));
}
function noScoreSvg() {
  const s = noSong(), notes = s.notes, perLine = noPerLine(), gap = 62.5, W = Math.round(115 + perLine * gap + 55), lineH = 145;
  const lines = Math.max(1, Math.ceil((notes.length + 1) / perLine)), H = lines * lineH + 25, hi = NO.playing ? NO.idx : (NO.res != null ? NO.res : NO.sel);
  let h = '';
  for (let l = 0; l < lines; l++) {
    const top = 38 + l * lineH;
    for (let k = 0; k < 5; k++) h += `<line class="no-ln" x1="50" y1="${top + k * 14}" x2="${W - 40}" y2="${top + k * 14}"/>`;
    h += `<path class="no-clef" transform="translate(76 ${top})" d="${NO_CLEF}"/><line class="no-bar" x1="108" y1="${top}" x2="108" y2="${top + 56}"/>`;
  }
  notes.forEach((n, i) => {
    const l = Math.floor(i / perLine), pos = i % perLine, x = 118 + pos * gap + gap / 2, top = 38 + l * lineH, sel = hi === i, col = noColor(n, s.colorMode), d = noLen(n.duration);
    const y = n.rest ? top + 28 : noY(n.name, top), down = !n.rest && NO_PITCH[n.name] >= 6;
    const lab = `${i + 1}. ${n.rest ? 'Pause' : 'Note ' + n.name}, ${d.label}${sel ? ', gewählt' : ''}`;
    h += `<g class="no-n${sel ? ' sel' : ''}" data-act="noSel" data-arg="${i}" role="button" tabindex="0" aria-label="${lab}">`;
    h += `<rect class="no-hit" x="${x - 28}" y="${top - 22}" width="56" height="${lineH - 8}" rx="14"/>`;
    if (sel) h += `<rect class="no-selbox" x="${x - 24}" y="${top - 16}" width="48" height="${lineH - 40}" rx="13"/>`;
    if (n.rest) {
      h += `<path transform="translate(${x} ${y})" d="${NO_REST}" fill="none" stroke="var(--dz-ink)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (d.id === 'short') h += `<path transform="translate(${x} ${y})" d="M-9 12 -2 16" stroke="var(--dz-ink)" stroke-width="3" stroke-linecap="round"/>`;
      if (d.id === 'long') h += `<rect x="${x - 10}" y="${top + 28 - 5}" width="20" height="5" fill="var(--dz-ink)" rx="1"/>`;
    } else {
      if (NO_PITCH[n.name] === 0) h += `<line class="no-ln" x1="${x - 16}" y1="${y}" x2="${x + 16}" y2="${y}"/>`;
      h += `<ellipse cx="${x}" cy="${y}" rx="10" ry="7" transform="rotate(-15 ${x} ${y})" style="fill:${d.id === 'long' ? 'var(--dz-surface)' : col};stroke:${col}" stroke-width="3"/>`;
      if (d.id !== 'long') {
        const sx = down ? x - 8.5 : x + 8.5, e = down ? y + 39 : y - 39;
        h += `<line x1="${sx}" y1="${y + (down ? 1 : -1)}" x2="${sx}" y2="${e}" style="stroke:${col}" stroke-width="3" stroke-linecap="round"/>`;
        if (d.id === 'short') h += `<path d="M ${sx} ${e} Q ${sx + 22} ${down ? e - 6 : e + 6}, ${sx + 12} ${down ? e - 25 : e + 25}" fill="none" style="stroke:${col}" stroke-width="3"/>`;
      } else {
        const sx = down ? x - 9 : x + 9, e = down ? y + 39 : y - 39;
        h += `<line x1="${sx}" y1="${y + (down ? 1 : -1)}" x2="${sx}" y2="${e}" style="stroke:${col}" stroke-width="3" stroke-linecap="round"/>`;
      }
      if (s.colorMode) h += `<text x="${x}" y="${down ? y - 14 : y + 25}" text-anchor="middle" font-size="13" font-weight="800" style="fill:${col}">${n.name}</text>`;
    }
    h += '</g>';
  });
  const cl = Math.floor(NO.cur / perLine), cp = NO.cur % perLine, cx = 118 + cp * gap + gap / 2, ct = 38 + cl * lineH;
  h += `<line class="no-cur" x1="${cx - gap / 2 + 4}" y1="${ct - 6}" x2="${cx - gap / 2 + 4}" y2="${ct + 66}"/><circle class="no-curd" cx="${cx - gap / 2 + 4}" cy="${ct - 11}" r="4"/>`;
  if (!notes.length) h += `<text class="no-empty" x="${W / 2}" y="${38 + 90}" text-anchor="middle" font-size="19">Tippe unten auf eine Note, dann geht es los</text>`;
  return `<svg id="noScore" viewBox="0 0 ${W} ${H}" role="group" aria-label="Notenzeile, ${notes.length} Noten">${h}</svg>`;
}
function noLettersHtml() {
  const s = noSong(), hi = NO.playing ? NO.idx : (NO.res != null ? NO.res : NO.sel);
  let h = '';
  s.notes.forEach((n, i) => {
    if (NO.cur === i) h += '<span class="no-lcur" aria-hidden="true"></span>';
    const col = noColor(n, s.colorMode), d = noLen(n.duration);
    h += `<button class="no-lk${hi === i ? ' sel' : ''}" style="color:${col}" data-act="noSel" data-arg="${i}" aria-label="${i + 1}. ${n.rest ? 'Pause' : 'Note ' + n.name}, ${d.label}${hi === i ? ', gewählt' : ''}">${n.rest ? '—' : n.name}<small>${n.rest ? 'Pause' : d.label}</small></button>`;
  });
  if (NO.cur === s.notes.length) h += '<span class="no-lcur" aria-hidden="true"></span>';
  if (!s.notes.length) h = '<p class="no-empty-t">Tippe unten auf einen Buchstaben, dann geht es los.</p>';
  return h;
}
function noMini(name) {
  const y = 75 - NO_PITCH[name] * 5, d = noLen(NO.dur), ink = 'var(--dz-ink)', down = NO_PITCH[name] >= 6;
  const sx = down ? 34 : 50, e = down ? y + 28 : y - 28;
  return `<svg viewBox="0 0 84 88" aria-hidden="true" focusable="false">${[0, 1, 2, 3, 4].map(i => `<line x1="7" y1="${25 + i * 10}" x2="77" y2="${25 + i * 10}" style="stroke:var(--dz-mute)"/>`).join('')}${name === 'C' ? `<line x1="28" y1="${y}" x2="56" y2="${y}" style="stroke:var(--dz-mute)"/>` : ''}<ellipse cx="42" cy="${y}" rx="8.5" ry="5.8" transform="rotate(-15 42 ${y})" style="fill:${d.id === 'long' ? 'var(--dz-surface)' : ink};stroke:${ink}" stroke-width="2.5"/><line x1="${sx}" y1="${y - (down ? -1 : 1)}" x2="${sx}" y2="${e}" style="stroke:${ink}" stroke-width="2.5" stroke-linecap="round"/>${d.id === 'short' ? `<path d="M${sx} ${e}q17 ${down ? -5 : 5} 9 ${down ? -14 : 14}" fill="none" style="stroke:${ink}" stroke-width="2.5"/>` : ''}</svg>`;
}

/* ---------- Zeichnen: Abschnitte ---------- */
function noBarHtml() {
  return `<div class="no-top"><span id="noStat" class="no-stat" role="status" aria-live="polite">✓ Gespeichert</span>
    <div class="no-top-b"><button class="btn sec" data-act="noUndo" aria-label="Letzte Änderung zurücknehmen" ${NO.hist.length < 2 ? 'disabled' : ''}>↶ <span class="no-hide">Zurück</span></button><button class="btn sec" data-act="noRedo" aria-label="Zurückgenommene Änderung wiederholen" ${NO.fut.length ? '' : 'disabled'}>↷ <span class="no-hide">Wieder</span></button><button class="btn sec" data-act="noLib">${ico('music', 18)} Meine Lieder</button><button class="btn" data-act="noSave">Speichern</button></div></div>`;
}
function noInfoHtml() {
  const s = noSong();
  return `<section class="dz-panel no-info"><div class="no-info-f"><div class="no-trow"><input id="noTitle" class="no-title" maxlength="40" value="${esc(s.title)}" aria-label="Name des Liedes" autocomplete="off"><button class="no-fav${s.favorite ? ' on' : ''}" data-act="noFav" aria-pressed="${s.favorite}" aria-label="${s.favorite ? 'Lieblingslied: ja' : 'Als Lieblingslied merken'}">${s.favorite ? '★' : '☆'}</button></div>
    <div class="no-drow"><span aria-hidden="true">✎</span><textarea id="noDesc" class="no-desc" rows="2" maxlength="280" aria-label="Beschreibung, Erinnerung oder Text zum Lied (freiwillig)" placeholder="Beschreibung oder Text (freiwillig)">${esc(s.description)}</textarea></div></div>
    <div class="seg no-seg" role="group" aria-label="Ansicht"><button data-act="noView" data-arg="staff" class="${NO.view === 'staff' ? 'active' : ''}" aria-pressed="${NO.view === 'staff'}">${noGlyph('normal', 18)} Noten</button><button data-act="noView" data-arg="letters" class="${NO.view === 'letters' ? 'active' : ''}" aria-pressed="${NO.view === 'letters'}">C D E F G A H</button></div></section>`;
}
function noScoreHtml() {
  return NO.view === 'staff' ? `<div id="noScoreBox" class="no-score">${noScoreSvg()}</div>` : `<section id="noScoreBox" class="dz-panel no-lview"><h3>Buchstaben-Ansicht</h3><div class="no-lrow">${noLettersHtml()}</div></section>`;
}
function noTransHtml() {
  const s = noSong(), snd = S.cfg.sound !== false;
  return `<section class="dz-panel no-trans"><div class="no-trow2"><button class="btn big" data-act="noPlay" aria-label="${NO.playing ? 'Abspielen anhalten' : 'Lied abspielen'}">${NO.playing ? 'Ⅱ Anhalten' : '▶ Abspielen'}</button><button class="btn sec big" data-act="noStop" aria-label="Stopp, zurück zum Anfang">■ Stopp</button></div>
    <div class="no-trow2"><span class="no-chip">${snd ? '🔊 Klavier' : `<button class="no-snd" data-act="toggleSound" aria-label="Ton einschalten">🔇 Ton ist aus – einschalten</button>`}</span><span class="no-chip" id="noTempo">♩ = ${NO_TEMPO[s.tempo].bpm}</span></div></section>`;
}
function noAddHtml() {
  const lk = NO.entry === 'letters';
  return `<section class="dz-panel no-add"><div class="no-add-h"><div><h2>Note hinzufügen</h2><p>Einmal tippen – schon steht sie im Lied.</p></div>
    <div class="seg no-seg" role="group" aria-label="Eingabe"><button data-act="noEntry" data-arg="symbols" class="${lk ? '' : 'active'}" aria-pressed="${!lk}">Notenbild</button><button data-act="noEntry" data-arg="letters" class="${lk ? 'active' : ''}" aria-pressed="${lk}">C D E F G A H</button></div></div>
    <div class="no-durs" role="group" aria-label="Länge der neuen Note">${NO_LEN.map(d => `<button class="no-dur${NO.dur === d.id ? ' active' : ''}" data-act="noDur" data-arg="${d.id}" aria-pressed="${NO.dur === d.id}">${noGlyph(d.id, 24)} ${d.label}</button>`).join('')}<button class="no-dur" data-act="noRest" aria-label="Pause einfügen, ${noLen(NO.dur).label}">${noGlyph('rest', 24)} Pause</button></div>
    ${lk ? `<div class="no-keys no-lkeys">${NO_NAMES.map(n => `<button class="no-lkey" style="color:${NO_COL[n]}" data-act="noAdd" data-arg="${n}" aria-label="Note ${n} hinzufügen, ${noLen(NO.dur).label}">${n}</button>`).join('')}</div>`
      : `<div class="no-keys">${NO_NAMES.map(n => `<button class="no-key" data-act="noAdd" data-arg="${n}" aria-label="Note hinzufügen, ${noLen(NO.dur).label}, Linienposition ${NO_PITCH[n] + 1} von 7">${noMini(n)}</button>`).join('')}</div>`}</section>`;
}
function noSideHtml() {
  const s = noSong(), n = NO.sel == null ? null : s.notes[NO.sel];
  return `<section class="dz-panel no-side-c"><h2>${n ? `Gewählt: ${n.rest ? 'Pause' : n.name}` : 'Note ändern'}</h2>
    ${n ? `<div class="no-edit"><button class="btn sec" data-act="noHigher" ${n.rest ? 'disabled' : ''}>＋ Höher</button><button class="btn sec" data-act="noLower" ${n.rest ? 'disabled' : ''}>− Tiefer</button><button class="btn sec" data-act="noLonger">Länger</button><button class="btn sec" data-act="noShorter">Kürzer</button><button class="btn sec" data-act="noDup">⧉ Kopieren</button><button class="btn sec no-danger" data-act="noDel">⌫ Löschen</button></div>` : '<p class="no-mute">Tippe eine Note im Lied an.</p>'}</section>
    <section class="dz-panel no-side-c"><h2>Tempo</h2><div class="no-speed" role="group" aria-label="Abspiel-Tempo">${Object.keys(NO_TEMPO).map(k => `<button class="no-sm${s.tempo === k ? ' active' : ''}" data-act="noTempo" data-arg="${k}" aria-pressed="${s.tempo === k}">${NO_TEMPO[k].label}</button>`).join('')}</div></section>
    <section class="dz-panel no-side-c"><h2>C–H-Farbcode</h2><button class="no-tg" data-act="noColor" role="switch" aria-checked="${s.colorMode}"><span><b>Buchstaben und Farben zeigen</b><small>Im Notenbild</small></span><span class="no-sw${s.colorMode ? ' on' : ''}" aria-hidden="true"><i></i></span></button></section>`;
}
function noLibHtml() {
  if (!NO.lib) return '';
  const L = noData().songs;
  return `<div class="no-lib" id="noLibBox" role="dialog" aria-modal="true" aria-label="Meine Lieder"><div class="no-lib-c"><div class="no-lib-h"><h2>Meine Lieder</h2><button class="btn sec" data-act="noLibClose" aria-label="Meine Lieder schließen">✕</button></div>
    <div class="no-lib-g">${L.map(s => `<div class="no-song${s.id === NO.id ? ' cur' : ''}"><button class="no-song-o" data-act="noOpen" data-arg="${esc(s.id)}" aria-label="Lied öffnen: ${esc(s.title)}"><span class="no-song-i">♫ ${s.favorite ? '★' : ''}</span><b>${esc(s.title)}</b><small>${s.notes.length} ${s.notes.length === 1 ? 'Note' : 'Noten'} · ${new Date(s.updatedAt).toLocaleDateString('de-DE')}</small></button><button class="no-song-d" data-act="noAskDel" data-arg="${esc(s.id)}" aria-label="Lied löschen: ${esc(s.title)}">${ico('trash', 18)}</button></div>`).join('')}
    ${L.length < NO_MAX_SONGS ? '<button class="no-new" data-act="noNew"><span>＋</span>Neues Lied</button>' : ''}</div></div></div>`;
}
const noBody = () => noBarHtml() + noInfoHtml() + noScoreHtml() + noTransHtml() + noAddHtml();
const noMain = () => `<div class="no-main">${noBarHtml()}${noInfoHtml()}${noScoreHtml()}${noTransHtml()}${noAddHtml()}</div><aside class="no-side" id="noSide">${noSideHtml()}</aside>`;
VIEWS.noten = () => { if (NO.id == null || !noData().songs.some(s => s.id === NO.id)) noInit(); return topBar('Notenheft', 'home') + `<div class="no-page" id="noPage">${noMain()}</div><div id="noLibSlot">${noLibHtml()}</div>`; };

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
  const t = $('.no-trans'); if (t) { const tmp2 = document.createElement('div'); tmp2.innerHTML = noTransHtml(); t.replaceWith(tmp2.firstElementChild); }
  const sd = $('#noSide'); if (sd && NO.playing === false) { /* Seitenleiste ändert sich beim Abspielen nicht */ }
}

/* ---------- Aktionen ---------- */
function noOpenSong(id) {
  noLeave(); const d = noData(), s = d.songs.find(x => x.id === id); if (!s) return;
  NO.id = s.id; d.act = s.id; NO.hist = [noClone(s.notes)]; NO.fut = []; NO.sel = null; NO.cur = s.notes.length; NO.lib = false; NO.res = null; NO.idx = null; NO.playing = false;
  save(); noPaintAll();
}
registerFeature({
  id: 'noten', title: 'Notenheft', icon: 'music', tint: 'sky', group: 'learn', order: 8, view: 'noten', sub: noSub, leave: noLeave,
  acts: {
    noten: () => { NO.id = null; go('noten'); },
    noSel: a => noSelect(+a), noAdd: a => noAdd(a), noRest, noUndo, noRedo,
    noHigher: () => noPitch(1), noLower: () => noPitch(-1), noLonger: () => noLength(1), noShorter: () => noLength(-1), noDup, noDel: noRemove,
    noPlay: noPlayToggle, noStop: noStopAll,
    noView: a => { NO.view = a === 'letters' ? 'letters' : 'staff'; noSaveNow(); noPaintAll(); },
    noEntry: a => { NO.entry = a === 'letters' ? 'letters' : 'symbols'; noSaveNow(); noPaintAll(); },
    noDur: a => { if (NO_LEN.some(d => d.id === a)) { NO.dur = a; noSaveNow(); noPaintAll(); } },
    noTempo: a => { if (!NO_TEMPO[a]) return; noSong().tempo = a; noSaveNow(); noPaintAll(); },
    noColor: () => { const s = noSong(); s.colorMode = !s.colorMode; noSaveNow(); noPaintAll(); },
    noFav: () => { const s = noSong(); s.favorite = !s.favorite; noSaveNow(); noPaintAll(); },
    noSave: () => { noSaveNow(); toast('✅', 'Lied gespeichert'); },
    noLib: () => { noSaveNow(); NO.lib = true; noPaintAll(); const b = $('.no-song.cur .no-song-o') || $('.no-lib .btn'); if (b) b.focus(); },
    noLibClose: () => { NO.lib = false; const sl = $('#noLibSlot'); if (sl) sl.innerHTML = ''; },
    noOpen: a => noOpenSong(a),
    noNew: () => {
      const d = noData(); if (d.songs.length >= NO_MAX_SONGS) return toast('🎼', 'Das Heft ist voll. Lösche erst ein Lied.');
      noSaveNow(); const s = noNewSong(); d.songs.unshift(s); noOpenSong(s.id);
    },
    noAskDel: a => { const s = noData().songs.find(x => x.id === a); if (!s) return; modal('Lied löschen?', `„${esc(s.title)}“ mit ${s.notes.length} ${s.notes.length === 1 ? 'Note' : 'Noten'}<br><br>Ein gelöschtes Lied ist weg.`, 'Ja, löschen', 'noDelYes', s.id, 'Nein, behalten'); },
    noDelYes: a => {
      closeModal(); const d = noData(), i = d.songs.findIndex(x => x.id === a); if (i < 0) return;
      const wasCur = a === NO.id; d.songs.splice(i, 1); if (!d.songs.length) d.songs.push(noNewSong());
      if (wasCur) { NO.id = null; noStopAll(); const s = d.songs[0]; NO.id = s.id; d.act = s.id; NO.hist = [noClone(s.notes)]; NO.fut = []; NO.sel = null; NO.cur = s.notes.length; }
      save(); noPaintAll(); toast('🗑️', 'Lied gelöscht');
    }
  }
});
/* Fach auf der Startseite (unter „Wohin heute?“) */
regSubject({ id: 'noten', name: 'Notenheft', ic: '🎼', act: 'noten', sub: noSub, tile: () => ({ art: 'noten', title: 'Notenheft', sub: noSub(), act: 'noten' }) });

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
  const t = e.target;
  if ((e.key === 'Enter' || e.key === ' ') && t && t.classList && t.classList.contains('no-n')) { e.preventDefault(); ACT.noSel(t.dataset.arg); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && view === 'noten') { noStopAll(); try { noSaveNow(); } catch (e) { } } });
window.addEventListener('pagehide', () => { if (view === 'noten') { noHalt(); try { noSaveNow(); } catch (e) { } } });
let noLastPL = noPerLine();
window.addEventListener('resize', () => { if (view === 'noten' && noPerLine() !== noLastPL) { noLastPL = noPerLine(); noPaintScore(); } });
