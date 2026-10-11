/* =====================================================================
   SUDOKU (in Meine Welt): 4 × 4, 6 × 6 und 9 × 9, je Leicht / Mittel / Knifflig (9 Stufen). Jedes Rätsel hat genau EINE Lösung.
   Stufen schalten sich wie bei Memory nach und nach frei (ein Sieg öffnet die nächste Stufe); wer 6 × 6 Mittel geschafft hat, darf
   9 × 9 direkt starten. Jeden Tag beginnt die Auswahl wieder bei der ersten Stufe, freigeschaltete Stufen bleiben.
   Wochenrätsel: ein festes Rätsel pro Woche (neu am Montag), Stufe = höchste freigeschaltete der Woche.
   Zeit: Stoppuhr, optional 5 / 10 / 15 Min (kein Verlust). 3 freie Hinweise pro Tag. Notizen, Zurück, Prüfen (nur auf Wunsch).
   Gespeichert: ein begonnenes Rätsel (S.puz.sdCur) und das Wochenrätsel (S.puz.sdWeek); Verlauf nur gelöster Rätsel (feat_puzzle.js).
   ===================================================================== */
const SD_LV = [{ n: 4, l: 'Leicht', g: 10 }, { n: 4, l: 'Mittel', g: 8 }, { n: 4, l: 'Knifflig', g: 6 }, { n: 6, l: 'Leicht', g: 22 }, { n: 6, l: 'Mittel', g: 18 }, { n: 6, l: 'Knifflig', g: 14 }, { n: 9, l: 'Leicht', g: 40 }, { n: 9, l: 'Mittel', g: 34 }, { n: 9, l: 'Knifflig', g: 28 }];
const SD_BOX = { 4: [2, 2], 6: [2, 3], 9: [3, 3] };
const SD_COIN = [3, 4, 5, 6, 8, 10, 12, 15, 20];
const sdLbl = lv => { const z = SD_LV[lv - 1]; return `${z.n} × ${z.n} ${z.l}`; };
const sdS = () => { const p = pzS(); if (!(p.sdLvl >= 1)) p.sdLvl = 1; return p; };
const sdDayLvl = () => { const p = sdS(); return p.sdSelDay === ymd() ? Math.min(p.sdSel || 1, p.sdLvl) : 1; };
const sdSub = () => { const p = sdS(); return p.sudWins ? `${p.sudWins} gelöst` : 'Zahlenrätsel'; };

/* ---------- Rätsel erzeugen: zählt Lösungen (MRV-Suche), entfernt Zahlen, solange die Lösung eindeutig bleibt ---------- */
const sdPop = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
function sdCount(g, n, limit, rnd, keep) {
  const [br, bc] = SD_BOX[n], full = (1 << n) - 1, row = Array(n).fill(0), col = Array(n).fill(0), box = Array(n).fill(0);
  const bx = i => Math.floor(Math.floor(i / n) / br) * (n / bc) + Math.floor((i % n) / bc), a = g.slice();
  for (let i = 0; i < n * n; i++) if (a[i]) { const b = 1 << (a[i] - 1), r = Math.floor(i / n), c = i % n, k = bx(i); if ((row[r] | col[c] | box[k]) & b) return keep ? { cnt: 0, sol: null } : 0; row[r] |= b; col[c] |= b; box[k] |= b; }
  let cnt = 0, sol = null;
  const rec = () => {
    let best = -1, bm = 0, bn = 99;
    for (let i = 0; i < n * n; i++) if (!a[i]) { const m = full & ~(row[Math.floor(i / n)] | col[i % n] | box[bx(i)]), k = sdPop(m); if (k < bn) { bn = k; best = i; bm = m; if (k <= 1) break; } }
    if (best < 0) { cnt++; if (!sol) sol = a.slice(); return cnt >= limit; }
    if (bn === 0) return false;
    const r = Math.floor(best / n), c = best % n, k = bx(best); let ds = []; for (let d = 0; d < n; d++) if (bm & (1 << d)) ds.push(d);
    if (rnd) ds = pzShuf(ds, rnd);
    for (const d of ds) { const b = 1 << d; a[best] = d + 1; row[r] |= b; col[c] |= b; box[k] |= b; const stop = rec(); a[best] = 0; row[r] &= ~b; col[c] &= ~b; box[k] &= ~b; if (stop) return true; }
    return false;
  };
  rec();
  return keep ? { cnt, sol } : cnt;
}
function sdGen(lv, rnd) {
  const z = SD_LV[lv - 1], n = z.n, sol = sdCount(Array(n * n).fill(0), n, 1, rnd, true).sol, puz = sol.slice();
  let givens = n * n;
  for (const i of pzShuf([...Array(n * n).keys()], rnd)) { if (givens <= z.g) break; const v = puz[i]; puz[i] = 0; if (sdCount(puz, n, 2) !== 1) puz[i] = v; else givens--; }
  return { n, lv, puz, sol };
}
function sdNew(lv, tm, weekly) {
  const rnd = weekly ? pzRng(pzSeed('sud' + weekly + lv)) : Math.random, g = sdGen(lv, rnd);
  return { st: 'play', n: g.n, lv, puz: g.puz, sol: g.sol, cells: g.puz.slice(), notes: {}, hinted: {}, sel: -1, el: 0, t0: 0, tm, up: false, hints: 0, weekly: weekly || '', notesOn: false, chk: false, undo: [], almost: false };
}
/* ---------- speichern / laden eines begonnenen Rätsels ---------- */
function sdPersist(m) {
  if (!m) return; const p = sdS(), d = { n: m.n, lv: m.lv, puz: m.puz, sol: m.sol, cells: m.cells, notes: m.notes, hinted: m.hinted, el: Math.round(PzT.el(m)), tm: m.tm, up: m.up, hints: m.hints, weekly: m.weekly };
  if (m.st !== 'play') { if (m.weekly) { if (p.sdWeek && p.sdWeek.wk === m.weekly) p.sdWeek.cur = null; } else p.sdCur = null; } else if (m.weekly) { p.sdWeek = p.sdWeek || { wk: m.weekly, lv: m.lv }; p.sdWeek.cur = d; } else p.sdCur = d;
  save();
}
const sdRestore = d => Object.assign({ st: 'play', t0: 0, sel: -1, notesOn: false, chk: false, undo: [], almost: false }, JSON.parse(JSON.stringify(d)));
function sdStop() { const m = UI.sd; if (m) { PzT.stop(m); if (m.st === 'play') sdPersist(m); } }
function sdBegin(m) { UI.sd = m; m.save = () => sdPersist(m); PzT.start(m, 'sudoku', () => { sfx('tap'); if (view === 'sudoku') render(); }); sdPersist(m); render(); }
const sdBX = (m, i) => { const [br, bc] = SD_BOX[m.n], r = Math.floor(i / m.n), c = i % m.n; return Math.floor(r / br) * (m.n / bc) + Math.floor(c / bc); };
const sdPeers = (m, i) => { const r = Math.floor(i / m.n), c = i % m.n, o = []; for (let j = 0; j < m.n * m.n; j++) if (j !== i && (Math.floor(j / m.n) === r || j % m.n === c || sdBX(m, j) === sdBX(m, i))) o.push(j); return o; };
const sdFixed = (m, i) => !!m.puz[i] || !!m.hinted[i];
function sdSnap(m) { m.undo.push({ cells: m.cells.slice(), notes: Object.assign({}, m.notes) }); if (m.undo.length > 60) m.undo.shift(); }
function sdAfterSet(m) {
  m.chk = false; m.almost = false;
  if (m.cells.every(v => v)) {
    if (m.cells.every((v, i) => v === m.sol[i])) sdWin(m); else { m.almost = true; sfx('no'); }
  }
  sdPersist(m); render();
}
function sdWin(m) {
  PzT.stop(m); m.st = 'win'; const p = sdS(), secs = PzT.el(m);
  m.fresh = false;
  if (m.lv === p.sdLvl && m.lv < 9) { p.sdLvl++; m.fresh = true; }
  if (m.lv >= 5 && p.sdLvl < 7) { p.sdLvl = 7; m.fresh = true; }
  m.coins = pzCoins(SD_COIN[m.lv - 1], 'Sudoku gelöst') + (m.weekly ? (() => { giveCoins(10, 'Wochenrätsel gelöst'); return 10; })() : 0);
  if (m.weekly && p.sdWeek && p.sdWeek.wk === m.weekly) { p.sdWeek.done = true; p.sdWeek.cur = null; }
  const e = pzFinish('sud', sdLbl(m.lv), secs, m.hints, { weekly: m.weekly, inc: m.n === 9 ? ['sud9'] : [] });
  m.entry = e; sdPersist(m); sfx('ok'); try { if (!rwCalm()) confetti(70); } catch (x) { }
}

/* ---------- Ansicht ---------- */
function sdWeekState() {
  const p = sdS(), wk = pzWeek(); if (!p.sdWeek || p.sdWeek.wk !== wk) p.sdWeek = { wk, lv: Math.max(1, p.sdLvl), done: false, cur: null };
  return p.sdWeek;
}
function sdSetup() {
  const p = sdS(), u = UI.sdSet || (UI.sdSet = { lv: sdDayLvl(), tm: 0 }), wkS = sdWeekState();
  if (u.lv > p.sdLvl) u.lv = p.sdLvl;
  const rows = [4, 6, 9].map(n => `<div class="sd-lvrow"><b>${n} × ${n}</b>${SD_LV.map((z, i) => z.n !== n ? '' : `<button class="sd-lv${u.lv === i + 1 ? ' on' : ''}${i + 1 <= p.sdLvl ? '' : ' lock'}" data-act="sdLvl" data-arg="${i + 1}" ${i + 1 <= p.sdLvl ? '' : 'disabled'} aria-pressed="${u.lv === i + 1}">${i + 1 <= p.sdLvl ? '' : ico('lock', 13) + ' '}${z.l}</button>`).join('')}</div>`).join('');
  const cont = p.sdCur ? `<section class="card sd-cont"><b>Begonnen: ${sdLbl(p.sdCur.lv)}</b><span class="small mute">${fmtT(p.sdCur.el || 0)} Min gespielt</span><button class="btn" data-act="sdCont" data-arg="cur">Weiterspielen</button></section>` : '';
  const wk = wkS.done ? `<span class="small mute">Geschafft ✔ – das nächste Rätsel kommt am Montag.</span>` : `<button class="btn" data-act="sdCont" data-arg="week">${wkS.cur ? 'Weiterspielen' : 'Wochenrätsel starten'}</button>`;
  return topBar('Sudoku', 'rewards') + `${cont}<section class="card sd-week"><h3>Wochenrätsel · ${sdLbl(wkS.lv)}</h3><p class="small mute">Ein Rätsel pro Woche, neu am Montag. Bonus: +10 🪙.</p>${wk}</section>
    <section class="card sd-setup"><h3>Neues Rätsel</h3><div class="sd-lvs">${rows}</div><h3>Zeit</h3>${pzTimeChips('sdTime', u.tm)}<p class="small mute">Die Zeit startet gleich. Wenn sie um ist, kannst du ohne Zeit weiterspielen.</p>
    <div class="center" style="margin-top:12px"><button class="btn big" data-act="sdStart">Los geht’s</button></div><div class="center" style="margin-top:10px"><button class="btn sec" data-act="sdHist">Meine gelösten Sudokus</button></div></section>`;
}
function sdBoard(m) {
  const n = m.n, [br, bc] = SD_BOX[n], selV = m.sel >= 0 ? m.cells[m.sel] : 0, peers = m.sel >= 0 ? new Set(sdPeers(m, m.sel)) : new Set();
  return `<div class="sd-grid n${n}" style="--n:${n}" role="grid">${m.cells.map((v, i) => {
    const r = Math.floor(i / n), c = i % n, fx = sdFixed(m, i), bad = m.chk && v && v !== m.sol[i];
    const cls = ['sd-c', fx ? 'fx' : '', v ? 'v' : '', i === m.sel ? 'sel' : peers.has(i) ? 'pr' : '', selV && v === selV && i !== m.sel ? 'sm' : '', bad ? 'bad' : '', (c + 1) % bc === 0 && c < n - 1 ? 'rb' : '', (r + 1) % br === 0 && r < n - 1 ? 'bb' : ''].filter(Boolean).join(' ');
    const nt = m.notes[i] || 0, nh = !v && nt ? `<span class="sd-nt">${[...Array(n).keys()].map(d => `<i>${nt & (1 << d) ? d + 1 : ''}</i>`).join('')}</span>` : '';
    return `<button class="${cls}" data-act="sdCell" data-arg="${i}" role="gridcell" aria-label="Feld ${r + 1}, ${c + 1}${v ? ': ' + v : ''}">${v || nh}</button>`;
  }).join('')}</div>`;
}
function sdPlay(m) {
  const n = m.n, left = Array(n + 1).fill(n); m.cells.forEach(v => { if (v) left[v]--; });
  const pad = [...Array(n).keys()].map(d => `<button class="sd-key" data-act="sdNum" data-arg="${d + 1}" ${left[d + 1] <= 0 ? 'disabled' : ''}>${d + 1}</button>`).join('');
  return topBar('Sudoku', 'rewards') + `${m.st === 'play' ? pzClock(m) : ''}<p class="sd-info small mute">${m.weekly ? 'Wochenrätsel · ' : ''}${sdLbl(m.lv)}${m.hints ? ' · Hinweise: ' + m.hints : ''}</p>${sdBoard(m)}
  ${m.almost ? '<p class="pz-msg">Alles ausgefüllt – aber irgendwo ist noch ein Fehler. Tippe auf „Prüfen“.</p>' : m.chk && !m.cells.some((v, i) => v && v !== m.sol[i]) ? '<p class="pz-msg ok">Bis hier ist alles richtig. 👍</p>' : ''}
  <div class="sd-pad" style="--n:${n}">${pad}<button class="sd-key er" data-act="sdErase" aria-label="Löschen">✕</button></div>
  <div class="pz-tools"><button class="btn sec pz-tool${m.notesOn ? ' on' : ''}" data-act="sdNotes" aria-pressed="${m.notesOn}">✏️ Notizen ${m.notesOn ? 'an' : 'aus'}</button><button class="btn sec pz-tool" data-act="sdUndo" ${m.undo.length ? '' : 'disabled'}>↩ Zurück</button><button class="btn sec pz-tool" data-act="sdCheck">✔ Prüfen</button>${pzHintBtn('sdHint', 'sud')}</div>
  <div class="center" style="margin-top:12px"><button class="btn sec" data-act="sdMenu">Speichern und Menü</button></div>`;
}
function sdWinView(m) {
  const e = m.entry || { pk: [], fg: [] };
  return topBar('Sudoku', 'rewards') + `<section class="card result pz-res"><h2>Geschafft! 🎉</h2><p>${m.weekly ? 'Wochenrätsel · ' : ''}${sdLbl(m.lv)} in <b>${fmtT(e.secs || 0)}</b> Min${m.hints ? ` mit ${m.hints} ${m.hints === 1 ? 'Hinweis' : 'Hinweisen'}` : ' ganz ohne Hinweis'}.</p>
    ${m.coins ? `<p>+${m.coins} 🪙</p>` : ''}${m.fresh ? `<p>Neue Stufe frei: <b>${sdLbl(sdS().sdLvl)}</b></p>` : ''}${pzResultExtras(e)}
    <div class="row wrap" style="justify-content:center"><button class="btn big" data-act="sdAgain">Noch eins</button><button class="btn sec" data-act="sdMenu">Menü</button></div></section>${sdBoard(Object.assign({}, m, { sel: -1, chk: false }))}`;
}
VIEWS.sudoku = () => {
  if (UI.sdHistOn) return topBar('Sudoku', 'rewards') + `<div class="center" style="margin:6px 0"><button class="btn sec" data-act="sdHist">‹ Zurück</button></div>` + pzHistory('sud', 'Gelöste Sudokus');
  const m = UI.sd; if (!m) return sdSetup();
  return m.st === 'win' ? sdWinView(m) : sdPlay(m);
};
DZ_ART.sudoku = '<rect x="9" y="3" width="46" height="46" rx="8" fill="#f4efe4" stroke="#52676c" stroke-width="2.2"/><path d="M24.5 4v44M39.5 4v44M10 18.5h44M10 33.5h44" stroke="#bed1c6" stroke-width="1.8"/><path d="M24.5 5v42M39.5 5v42M11 18.5h42M11 33.5h42" stroke="#52676c" stroke-width="0" /><text x="16.5" y="15" font-size="11" font-weight="800" text-anchor="middle" fill="#52676c" font-family="sans-serif">5</text><text x="32" y="30" font-size="11" font-weight="800" text-anchor="middle" fill="#9c6668" font-family="sans-serif">3</text><text x="47.5" y="45" font-size="11" font-weight="800" text-anchor="middle" fill="#52676c" font-family="sans-serif">8</text><text x="47.5" y="15" font-size="11" font-weight="800" text-anchor="middle" fill="#bed1c6" font-family="sans-serif">1</text><text x="16.5" y="45" font-size="11" font-weight="800" text-anchor="middle" fill="#bed1c6" font-family="sans-serif">2</text>';
registerFeature({
  id: 'sudoku', title: 'Sudoku', icon: 'sparkle', tint: 'sky', group: 'spiel', order: 81, view: 'sudoku',
  leave: () => { sdStop(); UI.sd = null; UI.sdHistOn = false; },
  check: () => { sdS(); },
  acts: {
    sudoku: () => { sdStop(); UI.sd = null; UI.sdSet = null; UI.sdHistOn = false; go('sudoku'); },
    sdLvl: l => { if (+l <= sdS().sdLvl) UI.sdSet.lv = +l; render(); },
    sdTime: t => { UI.sdSet.tm = +t; render(); },
    sdStart: () => { const u = UI.sdSet, p = sdS(); p.sdSel = u.lv; p.sdSelDay = ymd(); sfx('tap'); sdBegin(sdNew(u.lv, u.tm, '')); },
    sdCont: w => {
      const p = sdS(); let m;
      if (w === 'week') { const ws = sdWeekState(); m = ws.cur ? sdRestore(ws.cur) : sdNew(ws.lv, (UI.sdSet && UI.sdSet.tm) || 0, ws.wk); } else if (p.sdCur) m = sdRestore(p.sdCur);
      if (m) sdBegin(m);
    },
    sdHist: () => { UI.sdHistOn = !UI.sdHistOn; render(); },
    sdMenu: () => { sdStop(); UI.sd = null; render(); },
    sdAgain: () => { UI.sd = null; UI.sdSet = UI.sdSet || { lv: 1, tm: 0 }; const p = sdS(); UI.sdSet.lv = Math.min(p.sdLvl, UI.sdSet.lv || 1); render(); },
    sdCell: i => { const m = UI.sd; if (!m || m.st !== 'play') return; m.sel = m.sel === +i ? -1 : +i; render(); },
    sdNotes: () => { const m = UI.sd; if (m) { m.notesOn = !m.notesOn; render(); } },
    sdNum: d => {
      const m = UI.sd; if (!m || m.st !== 'play' || m.sel < 0 || sdFixed(m, m.sel)) return; d = +d; const i = m.sel;
      sdSnap(m); sfx('tap');
      if (m.notesOn) { if (m.cells[i]) { m.cells[i] = 0; } m.notes[i] = (m.notes[i] || 0) ^ (1 << (d - 1)); m.chk = false; sdPersist(m); render(); return; }
      m.cells[i] = m.cells[i] === d ? 0 : d; delete m.notes[i];
      if (m.cells[i]) sdPeers(m, i).forEach(j => { if (m.notes[j]) { m.notes[j] &= ~(1 << (d - 1)); if (!m.notes[j]) delete m.notes[j]; } });
      sdAfterSet(m);
    },
    sdErase: () => { const m = UI.sd; if (!m || m.st !== 'play' || m.sel < 0 || sdFixed(m, m.sel)) return; sdSnap(m); m.cells[m.sel] = 0; delete m.notes[m.sel]; m.chk = false; m.almost = false; sdPersist(m); render(); },
    sdUndo: () => { const m = UI.sd; if (!m || !m.undo.length) return; const s = m.undo.pop(); m.cells = s.cells; m.notes = s.notes; m.chk = false; m.almost = false; sdPersist(m); render(); },
    sdCheck: () => { const m = UI.sd; if (!m || m.st !== 'play') return; m.chk = true; m.almost = false; if (m.cells.some((v, i) => v && v !== m.sol[i])) sfx('no'); else sfx('ok'); render(); },
    sdHint: () => {
      const m = UI.sd; if (!m || m.st !== 'play') return;
      const bad = m.cells.map((v, i) => (v !== m.sol[i] && !m.puz[i] && !m.hinted[i]) ? i : -1).filter(i => i >= 0);
      if (!bad.length || !pzHintUse('sud')) { render(); return; }
      const t = m.sel >= 0 && bad.includes(m.sel) ? m.sel : bad[Math.floor(Math.random() * bad.length)];
      sdSnap(m); m.cells[t] = m.sol[t]; m.hinted[t] = 1; delete m.notes[t]; m.hints++; m.sel = t; sfx('magic');
      sdPeers(m, t).forEach(j => { if (m.notes[j]) { m.notes[j] &= ~(1 << (m.sol[t] - 1)); if (!m.notes[j]) delete m.notes[j]; } });
      sdAfterSet(m);
    }
  }
});
