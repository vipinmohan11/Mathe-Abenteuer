/* =====================================================================
   BLINKIS TRAININGSLAGER (Teil von Blinkis Punktkarten; Standard: ausgeblendet mit den Punktkarten)
   Mehr Übung nach den 14 Entdeckungen – ohne Rechenhilfe:
     Zahl bauen · Code lesen · Rechnen · Doppelt und halb · Pixelbilder · Blitz
   Jede Übungsart hat 3 Level (5 · 7 · 8 Karten). Level 1 hat noch eine kleine Hilfe (die Zahl zählt live),
   Level 2 und 3 nicht: keine Summe, keine 0/1-Ziffern, keine Anzeige der offenen Karten – nur „Prüfen“ und die Antwort.
   Fehler zählen nie als Aufgabe; gezählt wird nur, was gelingt. Belohnung klein und sichtbar:
   Sterne pro Runde (1–3), Leuchtsterne, Abzeichen, Ränge, gesammelte Pixelbilder – alles als kleine Symbole.
   Gespeichert: S.punkte.tr = { lv{ 'bau1'…: {best, n, hi} }, total, rounds, serie, streak, pix[ids], badge{id:ts}, days{ymd:1} }
   ===================================================================== */
PK_HEX[128] = '#b3412c'; PK_NOTE[128] = 98; PK_SPECIAL.train = 'Trainingslager';
const PKT_VALS = [null, [16, 8, 4, 2, 1], [64, 32, 16, 8, 4, 2, 1], [128, 64, 32, 16, 8, 4, 2, 1]];
const PKT_LVN = ['', 'Leicht', 'Mittel', 'Profi'];   // nur für Vorlesegeräte und Eltern, nicht sichtbar
const PKT_MODES = [
  { id: 'bau', n: 'Zahl bauen', s: 'Bauen', ic: '🧱', d: 'Bau die Zahl mit den Karten' },
  { id: 'les', n: 'Code lesen', s: 'Lesen', ic: '🔍', d: 'Welche Zahl zeigen die Karten?' },
  { id: 'plus', n: 'Rechnen', s: 'Rechnen', ic: '➕', d: 'Plus und minus – bau das Ergebnis' },
  { id: 'dbl', n: 'Doppelt und halb', s: 'Doppelt', ic: '↔️', d: 'Verdoppeln und halbieren' },
  { id: 'pix', n: 'Pixelbilder', s: 'Bilder', ic: '🖼️', d: 'Jede Zeile ist eine Zahl' },
  { id: 'blitz', n: 'Blitz', s: 'Blitz', ic: '⚡', d: '60 Sekunden – wie viele schaffst du?' }
];
const PKT = { blitz: 60 };
const PKT_BLITZ = { 1: [5, 8, 11], 2: [4, 6, 9], 3: [3, 5, 7] };
const PKT_RANKS = [
  { n: 'Bit-Neuling', e: '🥚', at: 0 }, { n: 'Bit-Lehrling', e: '🐣', at: 20 }, { n: 'Karten-Kenner', e: '🃏', at: 60 },
  { n: 'Code-Knacker', e: '🔑', at: 140 }, { n: 'Byte-Meister', e: '🧙', at: 280 }, { n: 'Binär-Profi', e: '🚀', at: 500 }, { n: 'Blinkis Chef', e: '👑', at: 900 }
];
/* Pixelbilder: Spalte = Karte (links die größte). Jede Zeile ist eine Zahl: # = Karte offen. */
const PKT_PICS = [
  { id: 'herz5', s: 5, n: 'Herz', c: '#d62828', g: ['.#.#.', '#####', '#####', '.###.', '..#..'] },
  { id: 'stern5', s: 5, n: 'Stern', c: '#e8a90c', g: ['..#..', '.###.', '#####', '.###.', '.#.#.'] },
  { id: 'haus5', s: 5, n: 'Haus', c: '#1764d5', g: ['..#..', '.###.', '#####', '##.##', '##.##'] },
  { id: 'baum5', s: 5, n: 'Baum', c: '#1f8443', g: ['..#..', '.###.', '#####', '..#..', '..#..'] },
  { id: 'smiley5', s: 5, n: 'Smiley', c: '#F28C28', g: ['.#.#.', '.#.#.', '.....', '#...#', '.###.'] },
  { id: 'rakete7', s: 7, n: 'Rakete', c: '#7b5cd6', g: ['...#...', '..###..', '..#.#..', '..###..', '.#####.', '#.###.#', '...#...'] },
  { id: 'krone7', s: 7, n: 'Krone', c: '#c99a06', g: ['#..#..#', '#..#..#', '##.#.##', '#######', '#######', '#.###.#', '#######'] },
  { id: 'pilz7', s: 7, n: 'Pilz', c: '#b3412c', g: ['..###..', '.#.#.#.', '#######', '#######', '..###..', '..###..', '..###..'] },
  { id: 'boot7', s: 7, n: 'Segelboot', c: '#14817a', g: ['...#...', '...##..', '...###.', '...#...', '#######', '.#####.', '..###..'] },
  { id: 'robo8', s: 8, n: 'Roboter', c: '#526a70', g: ['...##...', '.######.', '########', '##.##.##', '########', '.##..##.', '.######.', '.##..##.'] },
  { id: 'katze8', s: 8, n: 'Katze', c: '#94582a', g: ['#......#', '##....##', '########', '#.#..#.#', '########', '##.##.##', '.######.', '..####..'] },
  { id: 'burg8', s: 8, n: 'Burg', c: '#7a4a22', g: ['#.#..#.#', '########', '.######.', '.#.##.#.', '.######.', '.##..##.', '.##..##.', '########'] }
];
const PKT_BADGES = [
  { id: 'erst', n: 'Erste Runde', e: '🎒', d: 'Eine Runde im Trainingslager', f: T => T.rounds >= 1 },
  { id: 'alle', n: 'Allrounder', e: '🎓', d: 'Jede Übungsart gespielt', f: T => PKT_MODES.every(M => [1, 2, 3].some(l => (T.lv[M.id + l] || {}).n)) },
  { id: 'stern3', n: 'Dreifach-Stern', e: '🌟', d: 'Eine Runde mit 3 Sternen', f: T => Object.values(T.lv).some(x => x.best >= 3) },
  { id: 'serie', n: 'Serie 10', e: '🔥', d: '10 Aufgaben ohne Fehler hintereinander', f: T => T.serie >= 10 },
  { id: 'a100', n: 'Hundert!', e: '💯', d: '100 Aufgaben gelöst', f: T => T.total >= 100 },
  { id: 'a500', n: 'Zahlen-Ass', e: '🏅', d: '500 Aufgaben gelöst', f: T => T.total >= 500 },
  { id: 'blitz', n: 'Blitzmerker', e: '⚡', d: '10 Zahlen in einer Blitz-Runde', f: T => Object.keys(T.lv).some(k => k.startsWith('blitz') && (T.lv[k].hi || 0) >= 10) },
  { id: 'byte', n: 'Byte-Held', e: '💾', d: 'Eine Runde mit 8 Karten (bis 255)', f: T => PKT_MODES.some(M => (T.lv[M.id + 3] || {}).n) },
  { id: 'bild', n: 'Pixelkünstler', e: '🎨', d: 'Das erste Pixelbild', f: T => T.pix.length >= 1 },
  { id: 'galerie', n: 'Galerie', e: '🖼️', d: '6 Pixelbilder gesammelt', f: T => T.pix.length >= 6 },
  { id: 'komplett', n: 'Alle Bilder', e: '🏛️', d: 'Alle Pixelbilder gesammelt', f: T => T.pix.length >= PKT_PICS.length },
  { id: 'tage', n: 'Dranbleiber', e: '📅', d: 'An 3 Tagen trainiert', f: T => Object.keys(T.days).length >= 3 },
  { id: 'meister', n: 'Meister', e: '🏆', d: 'In 5 Levels 3 Sterne', f: T => Object.values(T.lv).filter(x => x.best >= 3).length >= 5 }
];

/* Neue Armband-Muster und Anhänger für die vielen neuen Leuchtsterne */
PK_DES.push(
  { id: 'feuer', n: 'Feuer', stars: 45, on: v => ({ 16: ['#b71c1c', 'Dunkelrot'], 8: ['#e53935', 'Rot'], 4: ['#fb8c00', 'Orange'], 2: ['#fdd835', 'Gelb'], 1: ['#fff59d', 'Hellgelb'] })[v], off: ['#3b2a26', 'Kohle'], cord: '#6d4c41', sw: ['#b71c1c', '#fb8c00', '#fff59d'] },
  { id: 'wald', n: 'Wald', stars: 60, on: v => ({ 16: ['#1b5e20', 'Tannengrün'], 8: ['#2e7d32', 'Grün'], 4: ['#66bb6a', 'Hellgrün'], 2: ['#a1887f', 'Rinde'], 1: ['#d7ccc8', 'Birke'] })[v], off: ['#f1f8e9', 'Moos hell'], cord: '#4e342e', sw: ['#1b5e20', '#66bb6a', '#a1887f'] },
  { id: 'galaxie', n: 'Galaxie', stars: 80, on: (v, li) => [['#7ef9ff', 'Cyan'], ['#ffd54f', 'Sonnengelb'], ['#b39ddb', 'Lila'], ['#80cbc4', 'Türkis'], ['#ffffff', 'Weiß']][(li + Math.log2(v)) % 5], off: ['#2a2552', 'Nachtviolett'], cord: '#9b95d6', sep: '#d8d4ff', bg: '#120f33', glow: true, ink: '#eeeaff', sw: ['#120f33', '#ffd54f', '#7ef9ff'] }
);
PK_CHARMS.push(
  { id: 'blitz', n: 'Blitz', e: '⚡', stars: 35 }, { id: 'diamant', n: 'Diamant', e: '💎', stars: 55 }, { id: 'pokal', n: 'Pokal', e: '🏆', stars: 75 }, { id: 'krone', n: 'Krone', e: '👑', stars: 100 },
  { id: 'eule', n: 'Eule', e: '🦉', price: 30 }, { id: 'drache', n: 'Drache', e: '🐉', price: 60 }
);
regItems(PK_DES.filter(x => ['feuer', 'wald', 'galaxie'].includes(x.id)).map(x => ({ id: 'pkd.' + x.id, kind: 'pkband', name: x.n, d: x.id, stars: x.stars || 0, src: pkSrc(x) })));
regItems(PK_CHARMS.filter(x => ['blitz', 'diamant', 'pokal', 'krone', 'eule', 'drache'].includes(x.id)).map(x => ({ id: 'pkc.' + x.id, kind: 'pkcharm', name: x.n, e: x.e, stars: x.stars || 0, src: pkSrc(x) })));

/* ---------- Stand ---------- */
function pktT() {
  const p = pkS(); let t = p.tr;
  if (!t || typeof t !== 'object' || Array.isArray(t)) t = p.tr = {};
  const obj = k => { if (!t[k] || typeof t[k] !== 'object' || Array.isArray(t[k])) t[k] = {}; };
  obj('lv'); obj('badge'); obj('days');
  if (!(t.total >= 0)) t.total = 0; if (!(t.rounds >= 0)) t.rounds = 0; if (!(t.serie >= 0)) t.serie = 0; if (!(t.streak >= 0)) t.streak = 0;
  if (!Array.isArray(t.pix)) t.pix = [];
  return t;
}
const pktOn = () => pkFree() || !!pkS().done[7];
function pktOpen(m, l) {
  if (!pktOn()) return false;
  const d = pkS().done, T = pktT();
  if (l === 1 || pkFree()) return true;
  if (l === 2) return !!d[12] && !!(T.lv[m + 1] && T.lv[m + 1].n);
  return !!(T.lv[m + 2] && T.lv[m + 2].n);
}
const pktRankIdx = n => { let r = 0; PKT_RANKS.forEach((x, k) => { if (n >= x.at) r = k; }); return r; };
const pktBest = (m, l) => (pktT().lv[m + l] || {}).best || 0;
/* Das Level einer Kachel: immer das höchste offene – nach einer Runde kommt das nächste Level von selbst dazu */
/* Aktuelles Level einer Übung: das höchste, das durch Spielen erreicht ist (auch bei freier Wahl – dort startet die Eltern-Karte jedes Level) */
const pktCur = m => { const T = pktT(), d = pkS().done; return (T.lv[m + 2] && T.lv[m + 2].n) ? 3 : (d[12] && T.lv[m + 1] && T.lv[m + 1].n) ? 2 : 1; };
function pktRecommend() {
  for (const M of PKT_MODES) { const l = pktCur(M.id); if (pktBest(M.id, l) < 3) return { m: M.id, l }; }
  return { m: PKT_MODES[0].id, l: pktCur(PKT_MODES[0].id) };
}
function pktCount() {
  const T = pktT(); T.total++; T.streak++; if (T.streak > T.serie) T.serie = T.streak; save();
}
function pktAwardBadges() {
  const T = pktT(), out = [];
  PKT_BADGES.forEach(b => { if (!T.badge[b.id] && b.f(T)) { T.badge[b.id] = Date.now(); out.push(b); } });
  if (out.length) { save(); pkGiveStars(out.length); }
  return out;
}
function pktRecord(key, stars, hi) {
  const T = pktT(), e = T.lv[key] || (T.lv[key] = { best: 0, n: 0 });
  T.rounds++; e.n++;
  const gain = Math.max(0, stars - e.best); e.best = Math.max(e.best, stars);
  let nb = false; if (hi != null && hi > (e.hi || 0)) { e.hi = hi; nb = true; }
  T.days[ymd()] = 1; const ks = Object.keys(T.days).sort(); while (ks.length > 90) delete T.days[ks.shift()];
  save(); if (gain) pkGiveStars(gain);
  return { gain, nb };
}

/* ---------- kleine Helfer ---------- */
const pktR = n => Math.floor(Math.random() * n), pktRR = (a, b) => a + pktR(b - a + 1);
const pktPc = n => { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; };
const pktBits = (n, vals) => vals.map(v => `<i class="${n & v ? 'on' : ''}" style="${pkCol(v)}">${n & v ? 1 : 0}</i>`).join('');
const pktStarsFor = mist => mist === 0 ? 3 : mist <= 2 ? 2 : 1;
function pktPicSvg(pic, rows, o) {
  o = o || {}; const s = pic.s, cell = [];
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const on = y < rows && pic.g[y][x] === '#', seen = y < rows;
    cell.push(`<rect x="${x + .06}" y="${y + .06}" width=".88" height=".88" rx=".14" fill="${on ? pic.c : seen ? 'transparent' : (o.ghost ? '#ebe6da' : 'transparent')}" stroke="${on ? 'none' : '#d4ccbb'}" stroke-width=".05"/>`);
  }
  return `<svg class="pkt-pic${o.big ? ' big' : ''}${o.mini ? ' mini' : ''}" viewBox="0 0 ${s} ${s}" role="img" aria-label="Pixelbild ${esc(pic.n)}">${cell.join('')}</svg>`;
}
const pktPicRows = (pic, vals) => pic.g.map(r => [...r].reduce((a, ch, i) => a + (ch === '#' ? vals[i] : 0), 0));
function pktPad(host, onOk) {
  let v = '';
  const disp = pkEl('div', 'pkt-disp', '<span>…</span>'), pad = pkEl('div', 'pkt-pad'), wrap = pkEl('div', 'pkt-padw');
  const show = () => { disp.innerHTML = `<span>${v || '…'}</span>`; disp.classList.toggle('empty', !v); };
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].forEach(k => {
    const b = pkEl('button', 'pkt-key' + (k === 'OK' ? ' ok' : k === '⌫' ? ' del' : ''), k === 'OK' ? ico('check', 22) : k); b.type = 'button';
    b.setAttribute('aria-label', k === 'OK' ? 'Antwort prüfen' : k === '⌫' ? 'Eine Ziffer löschen' : k);
    b.addEventListener('click', () => {
      if (k === '⌫') v = v.slice(0, -1);
      else if (k === 'OK') { if (v) { const n = +v; onOk(n); } return; }
      else if (v.length < 3) v += k;
      pkTick(); show();
    });
    pad.append(b);
  });
  wrap.append(disp, pad); host.append(wrap); show();
  return { clear() { v = ''; show(); }, el: wrap };
}

/* ---------- Ende einer Runde: Sterne, Belohnungen, wie weiter ---------- */
function pktEnd(api, o) {
  const { scene, body } = api, T = pktT(), m = o.m, l = o.l;
  const rec = pktRecord(m + l, o.stars, o.hi);
  const bd = pktAwardBadges(), r1 = pktRankIdx(T.total), up = r1 > o.rank0; if (up) pkGiveStars(2);
  const chips = [];
  if (rec.gain) chips.push(`<span class="pkt-chip">✦ +${rec.gain}</span>`);
  if (o.newPic) chips.push('<span class="pkt-chip up">🖼️ Neu in deiner Sammlung</span>');
  if (rec.nb && o.hi > 0) chips.push('<span class="pkt-chip up">🎉 Neuer Rekord</span>');
  if (up) chips.push(`<span class="pkt-chip up">${PKT_RANKS[r1].e} Neuer Rang: ${PKT_RANKS[r1].n} · ✦ +2</span>`);
  bd.forEach(b => chips.push(`<span class="pkt-chip bd"><i aria-hidden="true">${b.e}</i>${esc(b.n)} · ✦ +1</span>`));
  body.innerHTML = `<div class="pkt-end">${o.pic || ''}<div class="pkt-big">${pkStarsHtml(o.stars)}</div><p class="pkt-line">${o.line}</p>${chips.length ? `<div class="pkt-chips">${chips.join('')}</div>` : ''}</div>`;
  const big = o.stars === 3 || up || bd.length > 0 || !!o.newPic;
  scene.mood('happy'); scene.say(o.say); pkCelebrate(scene, big);
  if (big) pkTone(1319, .5, .3, 'triangle', .06);
  const btns = [];
  const nx = l < 3 && pktOpen(m, l + 1);
  if (nx && o.stars >= 2) btns.push({ label: `Level ${l + 1}`, on: () => pktGo(m, l + 1) });
  btns.push({ label: 'Nochmal', sec: nx && o.stars >= 2, on: () => pktGo(m, l) });
  if (nx && o.stars < 2) btns.push({ label: `Level ${l + 1}`, sec: true, on: () => pktGo(m, l + 1) });
  btns.push({ label: 'Zur Übersicht', sec: true, on: () => go('punkte') });
  pkLater(900, () => api.setFoot(btns));
  api.setFoot([]);
  window.scrollTo(0, 0);
}
function pktGo(m, l) { UI.pkTr = { m, l }; pkStart('train'); }

/* ---------- Eine Runde mit 6 Aufgaben: Bauen · Lesen · Rechnen · Doppelt/Halb ---------- */
function pktGen(m, l, vals, max, used, last) {
  const pickN = (lo, hi) => { let n, k = 0; do { n = pktRR(lo, hi); k++; } while ((used.has(n) || pktPc(n) < 2) && k < 60); used.add(n); return n; };
  if (m === 'bau') { const n = pickN(3, max); return { sol: n, label: 'Bau die Zahl', big: n }; }
  if (m === 'les') { const n = pickN(3, max); return { sol: n, ups: vals.map(v => n & v ? 1 : 0), label: 'Welche Zahl zeigen die Karten?', big: '?' }; }
  if (m === 'plus') {
    if (Math.random() < .6) { const sol = pickN(6, max), a = pktRR(2, sol - 2), b = sol - a; return { sol, label: 'Rechne und bau das Ergebnis', big: `${a} + ${b}`, txt: `${a} + ${b}` }; }
    const a = pickN(8, max), b = pktRR(2, a - 2); return { sol: a - b, label: 'Rechne und bau das Ergebnis', big: `${a} − ${b}`, txt: `${a} − ${b}` };
  }
  const kinds = l === 1 ? ['x2'] : l === 2 ? ['x2', 'h2'] : ['x2', 'h2', 'x4', 'd4'];
  let k = kinds[pktR(kinds.length)]; if (k === last && kinds.length > 1) k = kinds[(kinds.indexOf(k) + 1) % kinds.length];
  const h = Math.floor(max / 2), q = Math.floor(max / 4); let a, sol, label;
  if (k === 'x2') { a = pktRR(3, h); sol = 2 * a; label = 'Doppelt so viel wie'; }
  if (k === 'h2') { sol = pktRR(2, h); a = 2 * sol; label = 'Die Hälfte von'; }
  if (k === 'x4') { a = pktRR(2, q); sol = 4 * a; label = 'Viermal so viel wie'; }
  if (k === 'd4') { sol = pktRR(2, q); a = 4 * sol; label = 'Ein Viertel von'; }
  return { sol, a, kind: k, label, big: a };
}
function pktRound(api, m, l) {
  const { scene, body } = api, vals = PKT_VALS[l], max = vals.reduce((a, b) => a + b, 0), T = pktT(), N = 6, M = PKT_MODES.find(x => x.id === m);
  const reading = m === 'les', used = new Set(), rank0 = pktRankIdx(T.total);
  let i = 0, mist = 0, tm = 0, cur = null, solved = false, lastKind = '';
  const bar = pkEl('div', 'pk-tagbar'), target = pkEl('div', 'pk-target');
  body.append(bar, target);
  const A = pkStage(body, { noCounter: l > 1 || reading, code: reading && l === 1 });
  const pad = reading ? pktPad(body, n => check(n)) : null;
  const stop = () => go('punkte');
  const mark = () => A.slots.forEach((s, k) => s.classList.toggle('mark', !!(cur.sol & vals[k])));
  function head() {
    bar.innerHTML = `<span class="pk-chip">${M.ic} ${M.n} · Level ${l}</span><span class="pkt-pips" role="img" aria-label="Aufgabe ${Math.min(i + 1, N)} von ${N}">${Array.from({ length: N }, (_, k) => `<i class="${k < i || (k === i && solved) ? 'ok' : k === i ? 'cur' : ''}"></i>`).join('')}</span>`;
  }
  function next() {
    cur = pktGen(m, l, vals, max, used, lastKind); lastKind = cur.kind || ''; tm = 0; solved = false;
    A.lock = false; A.build(vals, cur.ups || vals.map(() => 0), []); A.taps = 0;
    if (reading) { A.lock = true; pad.clear(); }
    A.slots.forEach(s => s.classList.remove('mark'));
    head(); scene.mood('idle');
    const sup = (m === 'dbl' && l === 1) ? `<span class="pkt-code">${pktBits(cur.a, vals)}</span>` : '';
    target.innerHTML = `<span class="pk-label">${cur.label}</span><b${String(cur.big).length > 5 ? ' class="sm"' : ''}>${cur.big}</b>${sup}`;
    scene.say(i === 0 ? (reading ? 'Lies die Karten – und tippe die Zahl ein.' : (m === 'plus' || m === 'dbl') ? 'Rechne im Kopf – und bau das Ergebnis mit den Karten. Dann Prüfen.' : l === 1 ? 'Bau die Zahl. Wenn du fertig bist: Prüfen.' : 'Jetzt ohne Hilfe: Du siehst keine Summe. Bau die Zahl – dann Prüfen.') : 'Die nächste Aufgabe.');
    api.setFoot(reading ? [{ label: 'Aufhören', sec: true, on: stop }] : [{ label: 'Prüfen', on: () => check(A.total()) }, { label: 'Aufhören', sec: true, on: stop }]);
  }
  function wrong() {
    mist++; tm++; T.streak = 0; save(); pkNope(); scene.mood('confused'); scene.shake();
    if (reading) { pad.clear(); if (tm >= 2) { A.code = true; A.refresh(false); } }
    if (tm === 1) scene.say('Noch nicht ganz. Versuch es noch einmal.');
    else if (tm === 2) scene.say(reading ? 'Tipp: Jede offene Karte hat Punkte. Die Ziffern 1 und 0 zeige ich dir jetzt.' : 'Tipp: Fang bei der größten Karte an, die noch hineinpasst.');
    else if (!reading) { mark(); scene.say('Die markierten Karten gehören dazu.'); }
    else scene.say('Zähl die Karten zusammen, die offen (1) sind.');
  }
  function good() {
    solved = true; pktCount(); head(); A.lock = true;
    const parts = vals.filter(v => cur.sol & v).join(' + ');
    let say;
    if (m === 'bau') say = `${parts} = ${cur.sol}. Richtig gebaut!`;
    else if (m === 'les') say = `${parts} = ${cur.sol}. Genau!`;
    else if (m === 'plus') say = `${cur.txt} = ${cur.sol}. In Karten: ${vals.map(v => cur.sol & v ? 1 : 0).join('')}.`;
    else say = `${cur.a} → ${cur.sol}.<br><span class="pkt-shift">${pktBits(cur.a, vals)}<b>→</b>${pktBits(cur.sol, vals)}</span>`;
    scene.mood('happy'); scene.hop(); A.song(.05); pkTone(1047, .1, .12, 'triangle', .06);
    if (!reading) A.slots.forEach(s => s.classList.remove('mark'));
    scene.say(tm ? `Geschafft! ${say}` : say);
    const last = i === N - 1;
    api.setFoot([{ label: last ? 'Ergebnis' : 'Weiter', on: () => { if (last) fin(); else { i++; next(); } } }, { label: 'Aufhören', sec: true, on: stop }]);
  }
  function check(n) { if (solved) return; if (n === cur.sol) good(); else wrong(); }
  function fin() {
    const stars = pktStarsFor(mist);
    const ins = m === 'dbl' ? '<br>Merk dir: <b>Doppelt</b> = jede 1 rutscht eine Karte nach <b>links</b>. <b>Halb</b> = nach rechts.' : m === 'les' ? '' : '';
    pktEnd(api, { m, l, stars, rank0, line: mist === 0 ? 'Alle sechs ohne Fehler!' : mist <= 2 ? `Sechs geschafft – nur ${mist} ${mist === 1 ? 'Fehler' : 'Fehler'}.` : 'Alle sechs geschafft – dranbleiben lohnt sich!', say: stars === 3 ? `Perfekt!${ins}` : `Gut gemacht!${ins}` });
  }
  next();
}

/* ---------- Pixelbilder: jede Zeile ist eine Zahl ---------- */
function pktPix(api, l) {
  const { scene, body } = api, vals = PKT_VALS[l], T = pktT(), s = vals.length, rank0 = pktRankIdx(T.total);
  const pool = PKT_PICS.filter(x => x.s === s), fresh = pool.filter(x => !T.pix.includes(x.id)), pic = (fresh.length ? fresh : pool)[pktR((fresh.length ? fresh : pool).length)];
  const rows = pktPicRows(pic, vals);
  let r = 0, mist = 0, tm = 0, solved = false;
  const bar = pkEl('div', 'pk-tagbar'), view = pkEl('div', 'pkt-view'), target = pkEl('div', 'pk-target');
  body.append(bar, view, target);
  const A = pkStage(body, { noCounter: l > 1 });
  const stop = () => go('punkte');
  const draw = () => {
    bar.innerHTML = `<span class="pk-chip">🖼️ Pixelbilder · Level ${l}</span><span class="pkt-pips" role="img" aria-label="Zeile ${Math.min(r + 1, s)} von ${s}">${rows.map((_, k) => `<i class="${k < r ? 'ok' : k === r ? 'cur' : ''}"></i>`).join('')}</span>`;
    view.innerHTML = pktPicSvg(pic, r, { ghost: true });
  };
  function nextRow() {
    tm = 0; solved = false; A.lock = false; A.build(vals, vals.map(() => 0), []); A.taps = 0; A.slots.forEach(x => x.classList.remove('mark'));
    draw(); scene.mood('idle');
    target.innerHTML = `<span class="pk-label">Zeile ${r + 1} von ${s} · Bau die Zahl</span><b>${rows[r]}</b>`;
    scene.say(r === 0 ? 'Ein Bild versteckt sich! Jede Zeile ist eine Zahl. Bau sie – dann zeigt sich die Zeile.' : 'Die nächste Zeile.');
    api.setFoot([{ label: 'Prüfen', on: check }, { label: 'Aufhören', sec: true, on: stop }]);
  }
  function check() {
    if (solved) return;
    if (A.total() !== rows[r]) {
      mist++; tm++; T.streak = 0; save(); pkNope(); scene.mood('confused'); scene.shake();
      if (tm === 1) scene.say('Noch nicht ganz. Versuch es noch einmal.');
      else if (tm === 2) scene.say('Tipp: Fang bei der größten Karte an, die noch hineinpasst.');
      else { A.slots.forEach((x, k) => x.classList.toggle('mark', !!(rows[r] & vals[k]))); scene.say('Die markierten Karten gehören dazu.'); }
      return;
    }
    solved = true; pktCount(); r++; draw(); A.lock = true;
    const row = view.querySelector('svg'); if (row) pkAnim(row, 'pop');
    scene.mood('happy'); scene.hop(); pkTone(880 + r * 60, 0, .12, 'triangle', .06); pkTone(1175 + r * 60, .1, .14, 'triangle', .05);
    if (r < s) { scene.say(`Zeile ${r}: ${rows[r - 1]} – das Bild wächst!`); api.setFoot([{ label: 'Nächste Zeile', on: nextRow }, { label: 'Aufhören', sec: true, on: stop }]); return; }
    // fertig
    const stars = pktStarsFor(mist), isNew = !T.pix.includes(pic.id);
    if (isNew) { T.pix.push(pic.id); save(); pkGiveStars(1); }
    pkLater(700, () => pktEnd(api, {
      m: 'pix', l, stars, rank0, newPic: isNew, pic: `<div class="pkt-trophy">${pktPicSvg(pic, s, { big: true })}<b>${esc(pic.n)}</b></div>`,
      line: isNew ? `Ein ${esc(pic.n)} aus ${s} Zahlen! Das Bild liegt jetzt in deiner Sammlung.` : `Das ${esc(pic.n)} noch einmal – ${T.pix.length} von ${PKT_PICS.length} Bildern gesammelt.`,
      say: `Computer speichern Bilder genau so: Zeile für Zeile als Zahlen.`
    }));
  }
  nextRow();
}

/* ---------- Blitz: 60 Sekunden, so viele Zahlen wie möglich ---------- */
function pktBlitz(api, l) {
  const { scene, body } = api, vals = PKT_VALS[l], max = vals.reduce((a, b) => a + b, 0), T = pktT(), rank0 = pktRankIdx(T.total), hi0 = (T.lv['blitz' + l] || {}).hi || 0;
  let left = PKT.blitz, score = 0, running = false, ended = false, tg = 0, lastTg = 0;
  const bar = pkEl('div', 'pk-tagbar'), target = pkEl('div', 'pk-target');
  body.append(bar, target);
  const A = pkStage(body, { noCounter: true, onChange(t, o) { if (running && o.byTap && t === tg) hit(); } });
  const stop = () => go('punkte');
  const head = () => { bar.innerHTML = `<span class="pk-chip">⚡ Blitz · Level ${l}</span><span class="pk-chip pkt-time${left <= 10 && running ? ' low' : ''}">⏱ <b>${left}</b> s</span><span class="pk-chip">Geschafft <b>${score}</b></span><span class="pk-chip">Rekord <b>${Math.max(hi0, score)}</b></span>`; };
  function pick() { let n, k = 0; do { n = pktRR(3, max); k++; } while ((n === lastTg || pktPc(n) < 2) && k < 60); lastTg = n; return n; }
  function show() { tg = pick(); A.lock = false; A.build(vals, vals.map(() => 0), []); A.taps = 0; target.innerHTML = `<span class="pk-label">Bau die Zahl</span><b>${tg}</b>`; head(); }
  function hit() {
    score++; pktCount(); scene.mood('happy'); scene.hop(); pkTone(1047, 0, .1, 'triangle', .06); pkTone(1319, .08, .12, 'triangle', .05);
    A.lock = true; target.classList.add('hit'); pkLater(280, () => { target.classList.remove('hit'); if (running) show(); });
  }
  function tick() { if (!running) return; left--; head(); if (left <= 0) return end(); if (left <= 5) pkTone(660, 0, .06, 'square', .03); pkLater(1000, tick); }
  function begin() {
    running = true; left = PKT.blitz; score = 0; scene.say('Los! So viele Zahlen wie möglich.'); show();
    api.setFoot([{ label: 'Andere Zahl', sec: true, on: () => { if (running) show(); } }, { label: 'Aufhören', sec: true, on: stop }]);
    pkLater(1000, tick);
  }
  function end() {
    if (ended) return; ended = true; running = false; A.lock = true;
    const th = PKT_BLITZ[l], stars = score >= th[2] ? 3 : score >= th[1] ? 2 : score >= th[0] ? 1 : 0;
    T.streak = 0; save();
    pktEnd(api, { m: 'blitz', l, stars: Math.max(1, stars), hi: score, rank0, line: `<b>${score}</b> Zahlen in 60 Sekunden.${stars === 0 ? ' Beim nächsten Mal mehr!' : ''} Für Sterne: ${th[0]} · ${th[1]} · ${th[2]}.`, say: score > hi0 && score > 0 ? 'Neuer Rekord!' : 'Zeit ist um!' });
  }
  head(); target.innerHTML = `<span class="pk-label">Bereit?</span><b>${PKT.blitz}</b><small class="pk-zsub">Sekunden</small>`;
  scene.say(`60 Sekunden: Bau so viele Zahlen wie möglich. Zahl sofort fertig – dann kommt die nächste. Für 3 Sterne: ${PKT_BLITZ[l][2]}.`);
  A.lock = true; A.build(vals, vals.map(() => 0), []);
  api.setFoot([{ label: 'Los!', on: begin }, { label: 'Aufhören', sec: true, on: stop }]);
}

PK_RUN.train = {
  run(api) {
    const t = UI.pkTr || { m: 'bau', l: 1 }, m = t.m, l = t.l;
    api.body.classList.add('pk-train');
    if (m === 'pix') pktPix(api, l); else if (m === 'blitz') pktBlitz(api, l); else pktRound(api, m, l);
  }
};

/* ---------- Übersicht: Trainingslager, Rang, Sammlung ---------- */
function pktHub() {
  if (!pkFree() && !pkS().done[4]) return '';
  if (!pktOn()) return '<h3 class="pk-h">Trainingslager</h3><p class="pk-foot-note">Das Trainingslager öffnet nach „Mehr Karten“.</p>';
  const T = pktT(), rec = pktRecommend();
  const tiles = PKT_MODES.map(M => {
    const l = pktCur(M.id), b = pktBest(M.id, l), isRec = rec.m === M.id, e = T.lv[M.id + l] || {};
    return `<button type="button" class="pkt-t${b >= 3 ? ' gold' : ''}${isRec ? ' rec' : ''}" data-act="pkTr" data-arg="${M.id}|${l}" aria-label="${esc(M.n)}, Level ${l}, ${b ? b + ' von 3 Sternen' : 'noch nicht gespielt'}${M.id === 'blitz' && e.hi ? ', Rekord ' + e.hi : ''}"><span class="pkt-tl" aria-hidden="true">${l}</span><span class="pkt-ti" aria-hidden="true">${M.ic}</span><b>${M.s}</b><span class="pkt-ts" aria-hidden="true">${'<i class="on">✦</i>'.repeat(b)}${'<i>✦</i>'.repeat(3 - b)}</span></button>`;
  }).join('');
  return `<h3 class="pk-h">Trainingslager</h3><div class="pkt-row">${tiles}</div>`;
}
function pktSegs(seg) {
  if (!pktOn()) return [];
  const T = pktT(), r = PKT_RANKS[pktRankIdx(T.total)], nb = Object.keys(T.badge).length + T.pix.length;
  return [seg('rang', `<span class="pkt-seg-e" aria-hidden="true">${r.e}</span>`, null, r.n, `Rang: ${r.n}`), seg('sam', '<span class="pkt-seg-e" aria-hidden="true">🏅</span>', nb, 'Sammlung', `Sammlung: ${nb} Stück`)];
}
function pktPop(k) {
  const T = pktT();
  if (k === 'rang') {
    const ri = pktRankIdx(T.total), nx = PKT_RANKS[ri + 1];
    return `<span class="pk-eyebrow">${PKT_RANKS[ri].e} ${PKT_RANKS[ri].n}</span><p class="pk-popp"><b>${T.total}</b> Aufgaben gelöst – gezählt wird nur, was gelingt.${nx ? ` Noch <b>${nx.at - T.total}</b> bis <b>${nx.n}</b>.` : ' Höchster Rang!'}</p>
      <div class="pkt-ranks">${PKT_RANKS.map((x, i) => `<span class="${i <= ri ? 'ok' : ''}${i === ri ? ' now' : ''}"><i aria-hidden="true">${x.e}</i><b>${x.n}</b><small>${x.at ? 'ab ' + x.at : 'Start'}</small></span>`).join('')}</div>`;
  }
  if (k === 'sam') {
    return `<span class="pk-eyebrow">Abzeichen ${Object.keys(T.badge).length}/${PKT_BADGES.length}</span><div class="pkt-bds">${PKT_BADGES.map(b => { const on = !!T.badge[b.id]; return `<span class="${on ? 'ok' : ''}" title="${esc(b.d)}"><i aria-hidden="true">${on ? b.e : '🔒'}</i><b>${esc(b.n)}</b><small>${esc(b.d)}</small></span>`; }).join('')}</div>
      <span class="pk-eyebrow">Pixelbilder ${T.pix.length}/${PKT_PICS.length}</span><div class="pkt-pics">${PKT_PICS.map(x => { const on = T.pix.includes(x.id); return `<span class="${on ? 'ok' : ''}" title="${on ? esc(x.n) : 'Noch nicht entdeckt'}">${on ? pktPicSvg(x, x.s, { mini: true }) : `<svg class="pkt-pic mini" viewBox="0 0 ${x.s} ${x.s}" aria-hidden="true"><rect x=".2" y=".2" width="${x.s - .4}" height="${x.s - .4}" rx=".5" fill="none" stroke="var(--dz-line)" stroke-width=".18" stroke-dasharray=".5 .4"/></svg>`}<small>${on ? esc(x.n) : x.s + '×' + x.s}</small></span>`; }).join('')}</div>`;
  }
  return '';
}
function pktParent() {
  const T = pktT(), P = typeof PT === 'function' ? PT : (de => de), r = PKT_RANKS[pktRankIdx(T.total)];
  if (!pktOn()) return '';
  const lv = PKT_MODES.map(M => `${M.n}: ${[1, 2, 3].map(l => (T.lv[M.id + l] || {}).best || '–').join(' · ')}`).join('<br>');
  return `<div class="cfg"><div><b>${P('Trainingslager', 'Practice camp')}</b><br><span class="small mute">${r.e} ${r.n} · ${T.total} ${P('Aufgaben gelöst', 'tasks solved')} · ${Object.keys(T.badge).length}/${PKT_BADGES.length} ${P('Abzeichen', 'badges')} · ${T.pix.length}/${PKT_PICS.length} ${P('Pixelbilder', 'pixel pictures')}</span><br><span class="small mute">${P('Sterne je Level (1 · 2 · 3):', 'Stars per level (1 · 2 · 3):')}<br>${lv}</span></div></div>`;
}
Object.assign(ACT, {
  pkTr: a => { const [m, l] = String(a).split('|'); if (!PKT_MODES.some(x => x.id === m) || !(+l >= 1 && +l <= 3) || !pktOpen(m, +l)) return; pktGo(m, +l); },
  pkLes: () => { const p = pkS(), cur = p.les === undefined ? pkDoneN() !== PK_MAX : !!p.les; p.les = !cur; save(); render(); }
});
