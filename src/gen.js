/* =====================================================================
   QUESTION GENERATORS + MODULE REGISTRY
   ---------------------------------------------------------------------
   A question is a plain object (JSON-safe, so it can be stored in the
   Fehler-Heft):
     { title, html, fields:[{a, digit?, strict?, money?, next?}], hint, explain }
        html uses [[0]], [[1]] ... as placeholders for answer fields
     { title, prompt, choices:[html...], correct:int, hint, explain }

   TO ADD A NEW BOOK MODULE (ids A1–A5, B1–B5, C1–C5, D1–D5 – Kapitel A–D je 5 Hefte):
     Extra-Training (nicht im Arbeitsheft): beliebige ID ohne dieses Muster + extra:true (siehe EMAL/KOPF/SCHR).
     1. write generator functions  g_xyz(level)  (level 1..5)
        Levels used in practice decks: 2..5  ->  worth 1..4 points
        (2 = leicht, 3 = mittel, 4 = schwer, 5 = Boss). Level 1 is only a warm-up level.
     2. add an entry to MODULES at the bottom of this file
   Home screen, topic screens, trophies, parent view, Mini-Test and
   progress saving all pick the new module up automatically.
   ===================================================================== */

/* ---------- utils ---------- */
const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pad2 = n => String(n).padStart(2, '0');
const eur = c => Math.floor(c / 100) + ',' + pad2(c % 100);      // cents -> "12,05"
const E = c => eur(c) + ' €';
const F = (a, o) => Object.assign({ a: String(a) }, o || {});
const FM = c => F(eur(c), { money: true });                      // money, lenient format
const FS = a => F(a, { strict: true });                          // exact format required
const T10 = [10, 20, 30, 40, 50, 60, 70, 80, 90];
const gcd = (x, y) => y ? gcd(y, x % y) : x;
const lcm = (a, b) => a * b / gcd(a, b);
const eqLine = (txt, cls) => `<div class="eq${cls ? ' ' + cls : ''}">${txt}</div>`;

/* =====================================================================
   A4  DIVISION
   ===================================================================== */

function g_umkehr(L) {
  let a, b;
  if (L >= 4) { a = ri(L === 4 ? 11 : 12, L === 4 ? 25 : 45); b = pick(L === 4 ? T10 : [...T10, 100, 200]); }
  else { a = ri(2, 9); b = pick(L === 1 ? T10 : [...T10, 100]); }
  const p = a * b, swap = L >= 2 && Math.random() < .5;
  const first = swap ? `${b} · ${a}` : `${a} · ${b}`;
  let html = eqLine(`${first} = [[0]]`) + eqLine(`U: [[1]] : ${b} = ${a}`, 'u');
  const fields = [F(p), F(p)];
  if (L >= 2) { html += eqLine(`U: [[2]] : ${a} = ${b}`, 'u'); fields.push(F(p)); }
  return {
    title: 'Rechne aus. Schreibe die passende Umkehraufgabe.',
    html, fields,
    hint: `Denke an die kleine Aufgabe: ${a} · ${b / 10} = ${a * b / 10}. Das Ergebnis wird zehnmal so groß.`,
    explain: `${first} = ${p}  →  ${p} : ${b} = ${a}` + (L >= 2 ? `  und  ${p} : ${a} = ${b}` : '')
  };
}

function g_kleine(L) {
  const typeB = L >= 2 && Math.random() < (L === 2 ? .4 : .55);
  if (!typeB) {
    let q, d, D;
    do {
      q = L >= 4 ? ri(L === 4 ? 10 : 12, L === 4 ? 20 : 30) : ri(2, L === 1 ? 5 : 9);
      d = ri(L >= 4 ? 2 : 1, 9) * 10; D = q * d;
    } while (D > (L === 4 ? 2000 : L >= 5 ? 6000 : 1000));
    return {
      title: 'Rechne erst die kleine Geteiltaufgabe, dann die große.',
      html: eqLine(`${D / 10} : ${d / 10} = [[0]]`) + eqLine(`${D} : ${d} = [[1]]`),
      fields: [F(q), F(q)],
      hint: `Streiche bei beiden Zahlen eine Null: ${D / 10} : ${d / 10}.`,
      explain: `${D / 10} : ${d / 10} = ${q}  →  ${D} : ${d} = ${q}`
    };
  }
  const d = ri(2, 9), q = L >= 4 ? ri(12, L === 4 ? 30 : 60) : ri(2, 9), small = q * d, D = small * 10;
  return {
    title: 'Rechne erst die kleine Geteiltaufgabe, dann die große.',
    html: eqLine(`${small} : ${d} = [[0]]`) + eqLine(`${D} : ${d} = [[1]]`),
    fields: [F(q), F(q * 10)],
    hint: `Rechne zuerst ${small} : ${d}. Bei ${D} : ${d} wird das Ergebnis zehnmal so groß.`,
    explain: `${small} : ${d} = ${q}  →  ${D} : ${d} = ${q * 10}`
  };
}

function g_divtens(L) {
  let q, d, D;
  if (L >= 4) { q = ri(11, L === 4 ? 25 : 45); d = ri(2, L === 4 ? 9 : 19) * 10; D = q * d; }
  else do { q = ri(1, L === 1 ? 5 : L === 2 ? 9 : 10); d = ri(1, L === 3 ? 10 : 9) * 10; D = q * d; } while (D > 1000);
  return {
    title: 'Rechne aus.',
    html: eqLine(`${D} : ${d} = [[0]]`, 'big'),
    fields: [F(q)],
    hint: `Streiche bei beiden Zahlen eine Null: ${D / 10} : ${d / 10}. Oder frage: ${d} mal wie viel ist ${D}?`,
    explain: `${D} : ${d} = ${q}, denn ${q} · ${d} = ${D}`
  };
}

const GT_SETS = {
  1: [[1, 10, 100], [2, 20, 200], [5, 50, 500]],
  2: [[10, 50, 100], [20, 40, 80], [10, 100, 200], [25, 50, 100], [10, 50, 500]],
  3: [[30, 60, 90], [40, 80, 160], [20, 50, 100], [15, 30, 60], [12, 60, 120]],
  4: [[30, 60, 120], [40, 80, 160], [50, 100, 200], [25, 50, 100], [45, 90, 180]],
  5: [[25, 75, 150], [40, 120, 240], [45, 90, 270], [35, 70, 140], [60, 90, 180]]
};
function g_geteilt(L) {
  const cols = pick(GT_SETS[L]), m = cols.reduce(lcm, 1);
  const mult = []; for (let x = m; x <= (L >= 4 ? 3000 : 1000); x += m) mult.push(x);
  const rows = shuffle(mult).slice(0, 2).sort((a, b) => b - a);
  let k = 0; const fields = [], ex = [];
  let html = '<table class="gt"><tr><th>:</th>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>';
  rows.forEach(r => {
    html += `<tr><th>${r}</th>`;
    cols.forEach(c => { html += `<td>[[${k++}]]</td>`; fields.push(F(r / c)); ex.push(`${r} : ${c} = ${r / c}`); });
    html += '</tr>';
  });
  html += '</table>';
  return {
    title: 'Rechne die Geteilttabelle aus.',
    html, fields,
    hint: 'Teile die Zahl in der Zeile durch die Zahl oben in der Spalte. Die kleine Geteiltaufgabe hilft dir.',
    explain: ex.join('; ')
  };
}

function g_paeckchen(L) {
  const r = Math.random(), hard = L >= 4;
  const v = L === 1 ? (r < .45 ? 1 : r < .9 ? 2 : 3) : hard ? (r < .3 ? 1 : r < .6 ? 2 : 3) : (r < .3 ? 1 : r < .55 ? 2 : 3);
  if (v === 1) {                       // gleiches Ergebnis
    let q, s;
    do {
      q = hard ? ri(5, L === 4 ? 15 : 25) : ri(2, 9); s = L === 1 ? 10 : hard ? pick([20, 30, 40, 50]) : pick([10, 20, 30]);
    } while (q * s * 4 > (hard ? 4000 : 1000));
    const rows = [1, 2, 3, 4].map(k => [q * s * k, s * k]);
    return {
      title: 'Rechne das Päckchen. Was fällt dir auf?',
      html: rows.map((x, i) => eqLine(`${x[0]} : ${x[1]} = [[${i}]]`)).join(''),
      fields: rows.map(() => F(q)),
      hint: `Teile zuerst beide Zahlen durch ${s}: ${q * s} : ${s} = ${q}.`,
      explain: `Alle Ergebnisse sind ${q}. Beide Zahlen werden gleich oft größer, darum bleibt das Ergebnis gleich.`
    };
  }
  if (v === 2) {                       // gleicher Teiler, Ergebnis wächst
    let d, s0, g = 0;
    do {
      d = pick(L === 1 ? [10, 20, 30, 40, 50] : T10); s0 = L === 1 ? 1 : hard ? ri(L === 4 ? 4 : 8, L === 4 ? 12 : 20) : ri(1, 5); g++;
    } while (d * (s0 + 3) > (hard ? 3000 : 1000) && g < 50);
    const rows = [0, 1, 2, 3].map(i => [d * (s0 + i), s0 + i]);
    return {
      title: 'Rechne das Päckchen. Was fällt dir auf?',
      html: rows.map((x, i) => eqLine(`${x[0]} : ${d} = [[${i}]]`)).join(''),
      fields: rows.map(x => F(x[1])),
      hint: `Rechne mit der kleinen Geteiltaufgabe: ${rows[0][0] / 10} : ${d / 10}.`,
      explain: `Die erste Zahl wird immer um ${d} größer, darum wird das Ergebnis immer um 1 größer.`
    };
  }
  let d, s, st, dir, seq, g = 0;        // Päckchen fortsetzen
  const M = hard ? 30 : 10, nShow = L >= 5 ? 2 : 3;
  do {
    d = pick(T10); st = L === 1 ? 1 : hard ? pick(L === 4 ? [1, 2, 3] : [2, 3, 5]) : pick([1, 2]); dir = (L >= 2 && Math.random() < .5) ? -1 : 1; s = ri(1, M);
    seq = [0, 1, 2, 3, 4].map(i => s + dir * st * i); g++;
  } while (!(seq.every(x => x >= 1 && x <= M) && d * Math.max(...seq) <= (hard ? 3000 : 1000)) && g < 800);
  if (!seq.every(x => x >= 1 && x <= M)) { d = 30; st = 1; dir = 1; s = 1; seq = [1, 2, 3, 4, 5]; }
  const shown = Array.from({ length: nShow }, (_, i) => eqLine(`${d * seq[i]} : ${d} = ${seq[i]}`, 'done')).join('');
  const rest = [];
  for (let i = nShow; i < 5; i++) rest.push(i);
  return {
    title: 'Setze das Päckchen fort.',
    html: shown + rest.map((x, j) => eqLine(`${d * seq[x]} : ${d} = [[${j}]]`)).join(''),
    fields: rest.map(x => F(seq[x])),
    hint: `Schau, wie sich die Ergebnisse verändern: immer um ${st} ${dir > 0 ? 'größer' : 'kleiner'}.`,
    explain: rest.map(x => `${d * seq[x]} : ${d} = ${seq[x]}`).join('  und  ')
  };
}

/* schwere Vergleiche: auf beiden Seiten eine Rechnung (Punkt vor Strich) */
function sideExpr(L) {
  const big = L >= 5, kind = pick(['mm', 'dm', 'da', 'ma', 'ad']);
  const a = ri(2, big ? 12 : 9), b = pick(T10), q = ri(2, big ? 15 : 12), d = pick(T10), c = pick(T10), m = ri(2, big ? 9 : 6), k = ri(2, big ? 40 : 25);
  if (kind === 'mm') return c < a * b ? { t: `${a} · ${b} − ${c}`, v: a * b - c } : { t: `${a} · ${b} + ${c}`, v: a * b + c };
  if (kind === 'dm') return { t: `${q * d} : ${d} · ${m}`, v: q * m };
  if (kind === 'da') return { t: `${q * d} : ${d} + ${k}`, v: q + k };
  if (kind === 'ma') return { t: `${a} · ${b} + ${q * d} : ${d}`, v: a * b + q };
  return { t: `${q * d} : ${d} + ${a} · ${m}`, v: q + a * m };
}
function g_vergleich_hard(L) {
  let left, right, g = 0;
  do { left = sideExpr(L); right = sideExpr(L); g++; }
  while (!(Math.abs(left.v - right.v) <= (L === 4 ? 12 : 8) && left.t !== right.t && (g < 2000 || left.v !== right.v)) && g < 4000);
  if (Math.random() < .25 && left.v !== right.v) right = { t: String(left.v), v: left.v };   // manchmal ein glatter Wert zum Vergleichen
  const c = left.v < right.v ? 0 : left.v === right.v ? 1 : 2;
  return {
    title: 'Rechne beide Seiten aus (Punkt vor Strich!) und vergleiche.',
    prompt: `<div class="cmp"><span>${left.t}</span><span class="qm">?</span><span>${right.t}</span></div>`,
    choices: ['&lt;', '=', '&gt;'], correct: c,
    hint: 'Rechne jede Seite einzeln aus. Mal und geteilt kommen vor plus und minus.',
    explain: `${left.t} = ${left.v} und ${right.t} = ${right.v}, also ${left.v} ${'<=>'[c]} ${right.v}.`
  };
}
function g_vergleich(L) {
  if (L >= 4) return g_vergleich_hard(L);
  const mk = kind => {
    if (kind === 'm') { const a = ri(2, 9), b = pick(T10); return { t: Math.random() < .5 ? `${a} · ${b}` : `${b} · ${a}`, v: a * b }; }
    const q = ri(1, 9), d = pick(T10); return { t: `${q * d} : ${d}`, v: q };
  };
  let left, right;
  if (L < 3) {
    const kind = (L === 1 || Math.random() < .6) ? 'm' : 'd';
    left = mk(kind);
    const base = kind === 'm' ? [0, 0, 10, -10, 20, -20, 30, -30, 50, -50] : [0, 0, 1, -1, 2, -2];
    let tv, g = 0; do { tv = left.v + pick(base); g++; } while (tv <= 0 && g < 30);
    if (tv <= 0) tv = left.v;
    right = { t: String(tv), v: tv };
    if (Math.random() < .5) [left, right] = [right, left];
  } else {
    const kind = Math.random() < .65 ? 'm' : 'd'; let g = 0;
    do { left = mk(kind); right = mk(kind); g++; }
    while (!(Math.abs(left.v - right.v) <= (kind === 'm' ? 40 : 2) && left.t !== right.t) && g < 800);
  }
  const c = left.v < right.v ? 0 : left.v === right.v ? 1 : 2;
  return {
    title: 'Rechne im Kopf und vergleiche.',
    prompt: `<div class="cmp"><span>${left.t}</span><span class="qm">?</span><span>${right.t}</span></div>`,
    choices: ['&lt;', '=', '&gt;'], correct: c,
    hint: 'Rechne zuerst jede Seite aus. Denke an die kleine Mal- oder Geteiltaufgabe.',
    explain: `${left.t} = ${left.v} und ${right.t} = ${right.v}, also ${left.v} ${'<=>'[c]} ${right.v}.`
  };
}

function buildOps(n, L) {
  for (let t = 0; t < 600; t++) {
    const hard = L >= 4, cap = hard ? (L === 4 ? 2500 : 5000) : 1000;
    let v = L === 1 ? ri(1, 12) * 10 : hard ? ri(5, 60) * 10 : ri(2, 30) * 10;
    const start = v, ops = [], vals = [v]; let ok = true, prev = '';
    for (let i = 0; i < n && ok; i++) {
      const k = pick(['·', '+', '−', ':'].filter(o => o !== prev)); let x; prev = k;          // nie zweimal dieselbe Rechenart hintereinander
      if (k === '·') { x = ri(2, L === 1 ? 5 : hard ? 12 : 10); v *= x; }
      else if (k === ':') { const ds = [2, 3, 4, 5, 6, 8, 10, ...(hard ? [12, 15, 20] : [])].filter(d => v % d === 0 && v / d >= 1); if (!ds.length) { ok = false; break; } x = pick(ds); v /= x; }
      else if (k === '+') { x = ri(1, L === 1 ? 5 : hard ? 30 : 10) * 10; v += x; }
      else { x = ri(1, L === 1 ? 5 : hard ? 30 : 10) * 10; if (v - x < 10) { ok = false; break; } v -= x; }
      if (v > cap) { ok = false; break; }
      ops.push({ k, x }); vals.push(v);
    }
    if (ok) return { start, ops, vals };
  }
  const fo = [{ k: ':', x: 10 }, { k: '·', x: 5 }, { k: '−', x: 20 }, { k: '+', x: 10 }, { k: '·', x: 2 }];
  return { start: 100, ops: fo.slice(0, n), vals: [100, 10, 50, 30, 40, 80].slice(0, n + 1) };
}

function g_kette(L) {
  const n = L === 1 ? 2 : L === 2 ? 3 : L === 3 ? 5 : L === 4 ? 6 : 7;
  const { start, ops, vals } = buildOps(n, L);
  let html = `<div class="chain"><span class="node s">${start}</span>`;
  const fields = [];
  ops.forEach((o, i) => {
    html += `<span class="arr">${o.k} ${o.x}</span>`;
    if (L >= 3 && i === n - 1) html += `<span class="node z">Ziel ${vals[n]}</span>`;
    else { html += `<span class="node">[[${fields.length}]]</span>`; fields.push(F(vals[i + 1])); }
  });
  html += '</div>';
  return {
    title: L >= 3 ? `Hüpfe im Päckchen! Rechne immer mit dem Ergebnis weiter. Das Ziel ist die ${vals[n]}.`
      : 'Rechne die Rechenkette. Nimm immer das Ergebnis weiter.',
    html, fields,
    hint: `Fang bei ${start} an: ${start} ${ops[0].k} ${ops[0].x} = ${vals[1]}. Dann rechne mit diesem Ergebnis weiter.`,
    explain: ops.map((o, i) => `${vals[i]} ${o.k} ${o.x} = ${vals[i + 1]}`).join('; ')
  };
}

function g_raetsel(L) {
  const n = L === 1 ? 2 : L === 2 ? 3 : L === 3 ? 4 : L === 4 ? 5 : 6;
  const { start, ops, vals } = buildOps(n, L);
  const ph = o => o.k === '·' ? `multipliziere sie mit ${o.x}` : o.k === ':' ? `dividiere sie durch ${o.x}` : o.k === '+' ? `addiere ${o.x}` : `subtrahiere ${o.x}`;
  const ps = ops.map(ph);
  const txt = ps.slice(0, -1).join(', ') + ' und ' + ps[ps.length - 1];
  const inv = { '·': ':', ':': '·', '+': '−', '−': '+' };
  const back = [];
  for (let i = n - 1; i >= 0; i--) back.push(`${vals[i + 1]} ${inv[ops[i].k]} ${ops[i].x} = ${vals[i]}`);
  return {
    title: 'Zahlenrätsel: Wie heißt die gedachte Zahl?',
    html: `<div class="story">Ich denke mir eine Zahl, ${txt} und erhalte die Zahl <b>${vals[n]}</b>.</div>` + eqLine('Gedachte Zahl: [[0]]'),
    fields: [F(start)],
    hint: 'Rechne rückwärts mit Umkehraufgaben: aus + wird −, aus · wird : und umgekehrt. Fang bei der letzten Zahl an.',
    explain: 'Rückwärts rechnen: ' + back.join('; ')
  };
}

/* =====================================================================
   A5  GELD
   ===================================================================== */

function g_schreib(L) {
  const dir = pick(L === 1 ? [0, 1, 2] : L >= 4 ? [0, 1, 2, 3, 4, 5, 5] : [0, 1, 2, 3, 4]);
  let e, c;
  if (L === 1) { e = ri(1, 20); c = pick([10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90]); }
  else if (L === 2) { e = ri(0, 30); c = Math.random() < .45 ? ri(1, 9) : ri(10, 99); }
  else if (L === 3) { e = pick([0, 0, ri(1, 99), ri(1, 99)]); c = Math.random() < .6 ? ri(1, 9) : ri(10, 99); }
  else if (L === 4) { e = ri(20, 999); c = Math.random() < .5 ? ri(1, 9) : ri(10, 99); }
  else { e = ri(100, 9999); c = Math.random() < .5 ? ri(1, 9) : ri(10, 99); }
  if (dir === 5) {                      // Falle: 7,5 € sind 7 € 50 ct
    const z = ri(1, 9), e5 = L === 4 ? ri(1, 99) : ri(10, 999);
    return {
      title: 'Wandle den Geldbetrag um. Achtung: Cent haben zwei Stellen!',
      html: eqLine(`${e5},${z} € = [[0]] € [[1]] ct`), fields: [F(e5), F(z * 10)],
      hint: `Nach dem Komma stehen Zehntel-Euro: 0,${z} € = ${z * 10} ct. Cent haben immer zwei Stellen: ${e5},${z} € = ${e5},${z}0 €.`,
      explain: `${e5},${z} € = ${e5},${z}0 € = ${e5} € ${z * 10} ct`
    };
  }
  const t = e * 100 + c, komma = `${e},${pad2(c)}`;
  let html, fields;
  if (dir === 0) { html = eqLine(`${e} € ${c} ct = [[0]] €`); fields = [FS(komma)]; }
  else if (dir === 1) { html = eqLine(`${e} € ${c} ct = [[0]] ct`); fields = [F(t)]; }
  else if (dir === 2) { html = eqLine(`${komma} € = [[0]] € [[1]] ct`); fields = [F(e), F(c)]; }
  else if (dir === 3) { html = eqLine(`${t} ct = [[0]] €`); fields = [FS(komma)]; }
  else { html = eqLine(`${t} ct = [[0]] € [[1]] ct`); fields = [F(e), F(c)]; }
  const zero = (dir === 0 || dir === 3) && c < 10;
  return {
    title: 'Wandle den Geldbetrag um.',
    html, fields,
    hint: zero ? `Cent haben immer zwei Stellen nach dem Komma: ${c} ct = ${pad2(c)} → ${komma} €. Hier musst du eine 0 ergänzen!`
      : '1 € = 100 ct. Vor dem Komma stehen die Euro, nach dem Komma die Cent.',
    explain: `${e} € ${c} ct = ${komma} € = ${t} ct`
  };
}

function colQ(nums, op) {
  const res = op === '+' ? nums.reduce((a, b) => a + b, 0) : nums[0] - nums[1];
  const strs = nums.map(eur), rs = eur(res);
  const W = Math.max(rs.length, ...strs.map(s => s.length));
  const cellsOf = s => [...(' '.repeat(W - s.length) + s)].map(ch => `<span class="cell">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  let html = '<div class="col">';
  strs.forEach((s, i) => { html += `<div class="crow"><span class="sg">${i === 0 ? '' : op}</span>${cellsOf(s)}<span class="cu">€</span></div>`; });
  html += '<div class="cline"></div>';
  const rsPad = ' '.repeat(W - rs.length) + rs;
  const D = [...rs].filter(ch => ch !== ',').length;
  let seen = 0; const fields = [], cells = [];
  for (let p = W - 1; p >= 0; p--) {
    const ch = rsPad[p];
    if (ch === ' ') cells.unshift('<span class="cell">&nbsp;</span>');
    else if (ch === ',') cells.unshift('<span class="cell">,</span>');
    else { cells.unshift(`<span class="cell">[[${seen}]]</span>`); fields.push(F(ch, { digit: true, next: seen + 1 < D ? seen + 1 : null })); seen++; }
  }
  html += `<div class="crow"><span class="sg"></span>${cells.join('')}<span class="cu">€</span></div></div>`;
  return {
    title: 'Rechne schriftlich. Komma unter Komma!',
    html, fields,
    hint: op === '+' ? 'Rechne von rechts nach links: erst die Cent, dann die Euro. Denke an den Übertrag.'
      : 'Rechne von rechts nach links. Reicht die obere Ziffer nicht aus, borge dir einen Zehner von links (entbündeln).',
    explain: `${strs.join(` ${op} `)} = ${rs}`
  };
}

function g_column(L) {
  if (L === 1) {
    if (Math.random() < .75) return colQ([ri(20, 300) * 5, ri(20, 300) * 5], '+');
    const a = ri(200, 400) * 5, b = ri(20, 150) * 5; return colQ([a, b], '−');
  }
  if (L === 2) {
    if (Math.random() < .5) return colQ([ri(50, 800) * 5, ri(50, 800) * 5, ri(50, 800) * 5], '+');
    const a = ri(400, 1500), b = ri(50, Math.floor(a / 5) - 20) * 5; return colQ([a, b], '−');
  }
  if (L >= 4) {
    if (Math.random() < .5) {
      let a, b, g = 0;
      if (L === 4) do { a = ri(10000, 90000); b = ri(2000, a - 1000); g++; } while (!(a % 100 < b % 100) && g < 800);
      else { a = ri(100, 900) * 100; b = ri(3000, a - 500); }                       // viel Entbündeln: 500,00 − 123,45
      return colQ([a, b], '−');
    }
    return colQ(Array.from({ length: L === 4 ? ri(3, 4) : 4 }, () => L === 4 ? ri(2000, 25000) : ri(10000, 99999)), '+');
  }
  if (Math.random() < .5) {
    let a, b, g = 0;
    do { a = ri(1500, 9000); b = ri(300, a - 200); g++; } while (!(a % 100 < b % 100) && g < 500);
    return colQ([a, b], '−');
  }
  return colQ(Array.from({ length: ri(3, 4) }, () => ri(300, 3000)), '+');
}

const round1 = c => Math.floor((c + 50) / 100);                       // whole euros, half up
const round10 = c => Math.floor((c / 100 + 5) / 10) * 10;             // tens of euros, half up
const round100 = c => Math.floor((c / 100 + 50) / 100) * 100;         // hundreds of euros, half up
const ITEMS_BIG = ['Fernseher', 'Sofa', 'Waschmaschine', 'Laptop', 'Gartenhaus', 'Klavier', 'Urlaubsreise', 'Motorroller', 'Kühlschrank'];
const ITEMS_U = ['Fahrradhelm', 'Ball', 'Rucksack', 'Trinkflasche', 'Buch', 'Federmäppchen', 'Spiel', 'Mütze', 'Schal', 'Puzzle'];

function g_ueber(L) {
  if (L >= 2 && Math.random() < (L === 2 ? .35 : L === 3 ? .5 : .3)) {          // choice: which result fits?
    const a = ri(L >= 4 ? 8000 : 500, L === 2 ? 4500 : L === 3 ? 9000 : 60000), b = ri(L >= 4 ? 5000 : 300, L === 2 ? 3500 : L === 3 ? 6000 : 40000), sub = L >= 3 && Math.random() < .5;
    const [x, y] = sub && a < b ? [b, a] : [a, b];
    const right = sub ? x - y : x + y;
    const offs = shuffle(L === 4 ? [1000, -1000, 10000, -10000] : L >= 5 ? [100, -100, 1000, -1000] : [1000, -1000, 2000, -2000]).filter(o => right + o > 0).slice(0, 3);
    const opts = shuffle([right, ...offs.map(o => right + o)]);
    return {
      title: 'Überschlage. Welches Ergebnis passt?',
      prompt: eqLine(`${E(x)} ${sub ? '−' : '+'} ${E(y)} = ?`),
      choices: opts.map(E), correct: opts.indexOf(right),
      hint: `Runde jeden Preis auf ganze Euro: ${E(x)} ≈ ${round1(x)} €, ${E(y)} ≈ ${round1(y)} €.`,
      explain: `Überschlag: ${round1(x)} ${sub ? '−' : '+'} ${round1(y)} = ${sub ? round1(x) - round1(y) : round1(x) + round1(y)} €. Genau: ${E(right)}.`
    };
  }
  if (L === 1) {
    const ps = [ri(101, 2999), ri(101, 2999), ri(101, 2999)];
    return {
      title: 'Runde auf ganze Euro.',
      html: ps.map((p, i) => eqLine(`${E(p)} ≈ [[${i}]] €`)).join(''),
      fields: ps.map(p => F(round1(p))),
      hint: 'Schau auf die Cent: 50 oder mehr → aufrunden, weniger als 50 → abrunden.',
      explain: ps.map(p => `${E(p)} ≈ ${round1(p)} €`).join('; ')
    };
  }
  const names = shuffle(L >= 5 ? ITEMS_BIG : ITEMS_U).slice(0, L >= 4 ? 4 : 3); let ps;
  if (L === 2) ps = names.map(() => ri(150, 4999));
  else if (L === 3) { do { ps = names.map(() => ri(1500, 25000)); } while (ps.some(p => p % 100 === 0 && (p / 100) % 10 === 5)); }
  else if (L === 4) { do { ps = names.map(() => ri(2500, 99900)); } while (ps.some(p => p % 100 === 0 && (p / 100) % 10 === 5)); }
  else { do { ps = names.map(() => ri(10000, 600000)); } while (ps.some(p => p % 10000 === 5000)); }
  const rf = L === 2 ? round1 : L <= 4 ? round10 : round100, rr = ps.map(rf), tot = rr.reduce((a, b) => a + b, 0);
  return {
    title: L === 2 ? 'Überschlage die Kosten. Runde auf ganze Euro.' : L <= 4 ? 'Überschlage die Kosten. Runde auf volle 10 Euro.' : 'Überschlage die Kosten. Runde auf volle 100 Euro.',
    html: names.map((n, i) => eqLine(`${n}: ${E(ps[i])} ≈ [[${i}]] €`)).join('') + eqLine(`Insgesamt ungefähr: [[${names.length}]] €`, 'sum'),
    fields: [...rr.map(x => F(x)), F(tot)],
    hint: L === 2 ? 'Cent ab 50 → aufrunden. Dann addiere die gerundeten Preise.'
      : L <= 4 ? 'Schau auf die Einer-Stelle: 5 oder mehr → aufrunden, sonst abrunden. Dann addiere.'
        : 'Schau auf die Zehner-Stelle der Euro: 50 oder mehr → auf die nächste Hundert aufrunden, sonst abrunden. Dann addiere.',
    explain: ps.map((p, i) => `${E(p)} ≈ ${rr[i]} €`).join('; ') + `; zusammen ≈ ${tot} €`
  };
}

const OFFERS = [
  { n: 'Brötchen', s: 32, k: 10, p: 295 }, { n: 'Donuts', s: 145, k: 5, p: 600 }, { n: 'Muffins', s: 170, k: 5, p: 750 },
  { n: 'Hefte', s: 60, k: 10, p: 549 }, { n: 'Bleistifte', s: 35, k: 5, p: 150 }, { n: 'Klebestifte', s: 145, k: 3, p: 399 },
  { n: 'Radiergummis', s: 90, k: 5, p: 399 }, { n: 'Äpfel', s: 50, k: 6, p: 250 }, { n: 'Stücke Käsekuchen', s: 240, k: 12, p: 2500 },
  { n: 'Stücke Erdbeertorte', s: 290, k: 12, p: 3000 }
];
const OFFER_ITEMS = ['Stifte', 'Radiergummis', 'Brötchen', 'Äpfel', 'Sticker', 'Bonbons', 'Luftballons', 'Hefte'];
function g_angebot_hard(L) {                   // zwei Angebote für die gleiche Menge vergleichen
  const pairs = L === 4 ? [[3, 6], [4, 6], [5, 10], [2, 6], [3, 9], [4, 8]] : [[4, 6], [6, 9], [8, 12], [4, 10], [6, 10], [9, 12], [5, 8]];
  let k1, k2, n, s, p1, p2, A, B, g = 0;
  do {
    [k1, k2] = pick(pairs); if (Math.random() < .5) [k1, k2] = [k2, k1];
    n = lcm(k1, k2) * (L === 4 ? ri(1, 2) : ri(1, 2)); s = pick([30, 40, 45, 50, 60, 75, 80, 90, 120]);
    p1 = k1 * s - pick([10, 20, 30, 40, 50, 60, 80, 100]); p2 = k2 * s - pick([10, 20, 30, 40, 50, 60, 80, 100]);
    A = n / k1 * p1; B = n / k2 * p2; g++;
  } while ((A === B || n / k1 > 12 || n / k2 > 12 || n > 72 || p1 <= 0 || p2 <= 0) && g < 500);
  const it = pick(OFFER_ITEMS);
  return {
    title: `Du brauchst genau ${n} ${it}. Angebot A: ${k1} Stück für ${E(p1)}. Angebot B: ${k2} Stück für ${E(p2)}. Du kaufst nur ganze Packungen.`,
    html: eqLine(`${n / k1} Packungen A: ${n / k1} · ${E(p1)} = [[0]] €`) + eqLine(`${n / k2} Packungen B: ${n / k2} · ${E(p2)} = [[1]] €`) + eqLine('Das günstigere Angebot spart dir: [[2]] €', 'sum'),
    fields: [FM(A), FM(B), FM(Math.abs(A - B))],
    hint: `Rechne aus: ${n} : ${k1} = ${n / k1} Packungen A und ${n} : ${k2} = ${n / k2} Packungen B. Dann mal den Preis nehmen.`,
    explain: `${n / k1} · ${eur(p1)} = ${eur(A)} €; ${n / k2} · ${eur(p2)} = ${eur(B)} €; Unterschied ${eur(Math.abs(A - B))} € (${A < B ? 'A' : 'B'} ist günstiger)`
  };
}
function g_angebot(L) {
  if (L >= 4) return g_angebot_hard(L);
  const o = pick(OFFERS);
  if (L === 1 || (L === 2 && Math.random() < .5)) {
    const single = o.k * o.s, save = single - o.p;
    return {
      title: `Einzeln oder Angebot? Ein Stück kostet ${E(o.s)}.`,
      html: eqLine(`${o.k} ${o.n} einzeln: ${o.k} · ${E(o.s)} = [[0]] €`) + eqLine(`Angebot (${o.k} ${o.n}): ${E(o.p)}`, 'info') + eqLine('Du sparst: [[1]] €'),
      fields: [FM(single), FM(save)],
      hint: `Rechne ${o.k} · ${eur(o.s)} €. Dann: Einzelpreis minus Angebotspreis.`,
      explain: `${o.k} · ${eur(o.s)} € = ${eur(single)} €; ${eur(single)} € − ${eur(o.p)} € = ${eur(save)} € gespart`
    };
  }
  const extra = ri(1, o.k - 1), need = o.k + extra;
  const A = o.p + extra * o.s, B = need * o.s;
  return {
    title: `Du brauchst ${need} ${o.n}. Ein Stück kostet ${E(o.s)}, das Angebot (${o.k} Stück) ${E(o.p)}.`,
    html: eqLine(`Angebot + ${extra} einzeln: [[0]] €`) + eqLine(`Alles einzeln: [[1]] €`) + eqLine('So viel sparst du: [[2]] €'),
    fields: [FM(A), FM(B), FM(B - A)],
    hint: `Angebot: ${eur(o.p)} € + ${extra} · ${eur(o.s)} €. Alles einzeln: ${need} · ${eur(o.s)} €.`,
    explain: `${eur(o.p)} + ${extra} · ${eur(o.s)} = ${eur(A)} €; ${need} · ${eur(o.s)} = ${eur(B)} €; Ersparnis ${eur(B - A)} €`
  };
}

const BAK = [
  { s: 'Brötchen', pl: 'Brötchen', p: 32 }, { s: 'Brezel', pl: 'Brezeln', p: 85 }, { s: 'Donut', pl: 'Donuts', p: 145 },
  { s: 'Muffin', pl: 'Muffins', p: 170 }, { s: 'Stück Käsekuchen', pl: 'Stück Käsekuchen', p: 240 },
  { s: 'Stück Erdbeertorte', pl: 'Stück Erdbeertorte', p: 290 }, { s: 'Brot (500 g)', pl: 'Brote (500 g)', p: 220 }
];
const nm = (it, k) => k === 1 ? it.s : it.pl;
const shopList = (count, maxQ) => shuffle(BAK).slice(0, count).map(it => ({ it, k: ri(1, maxQ) }));

const THINGS = ['ein Skateboard', 'einen Tretroller', 'ein Fahrrad', 'ein Zelt', 'eine Spielekonsole', 'ein Mikroskop', 'ein Schlagzeug-Set', 'ein Hochbeet'];
function g_sach_hard(L, kind) {
  if (kind === 'm1') {                           // Klassenausflug: Kosten gerecht verteilen
    const adults = L >= 5 ? 2 : 0, k = pick(L >= 5 ? [18, 22, 23, 28] : [20, 24, 25, 30]), people = k + adults;
    const c = pick([3, 4, 5, 6, 8, 9]), per = ri(2, L >= 5 ? 8 : 6), B = people * per;
    const entry = k * c, total = entry + B;
    return {
      title: `Die Klasse 4b (${k} Kinder${adults ? ' und 2 Begleitpersonen' : ''}) fährt ins Museum. Der Eintritt kostet ${c} € pro Kind${adults ? ' (Begleitpersonen frei)' : ''}. Der Bus kostet ${B} € und wird gerecht auf ${adults ? 'alle ' + people + ' Personen' : 'alle Kinder'} verteilt.`,
      html: eqLine('Eintritt für alle Kinder: [[0]] €') + eqLine('Alle Kosten zusammen: [[1]] €') + eqLine(`Busanteil pro ${adults ? 'Person' : 'Kind'}: [[2]] €`) + eqLine('Ein Kind zahlt insgesamt: [[3]] €', 'sum'),
      fields: [F(entry), F(total), F(per), F(c + per)],
      hint: `Eintritt: ${k} · ${c} €. Busanteil: ${B} : ${people}. Ein Kind zahlt Eintritt plus Busanteil.`,
      explain: `${k} · ${c} = ${entry} €; ${entry} + ${B} = ${total} €; ${B} : ${people} = ${per} €; ${c} + ${per} = ${c + per} €`
    };
  }
  if (kind === 'm2') {                           // Sparen: wie viele Wochen?
    const a = pick([20, 30, 40, 50, 60, 75, 80]), w = pick(L >= 5 ? [6, 8, 9, 12, 15] : [4, 5, 6, 8, 10]), wk = ri(L >= 5 ? 8 : 5, L >= 5 ? 25 : 15), T = a + w * wk;
    return {
      title: `Du möchtest ${pick(THINGS)} für ${T} € kaufen. Du hast schon ${a} € gespart und legst jede Woche ${w} € dazu.`,
      html: eqLine('Es fehlen noch: [[0]] €') + eqLine('Das dauert [[1]] Wochen.', 'sum'),
      fields: [F(T - a), F(wk)],
      hint: `Erst: ${T} − ${a}. Dann: Wie oft passen ${w} € in diesen Betrag?`,
      explain: `${T} − ${a} = ${T - a} €; ${T - a} : ${w} = ${wk} Wochen`
    };
  }
  if (kind === 'm3') {                           // Unterschied mit Cent
    const d = ri(2, 15) * 10, T = ri(40, 120) * 10, small = (T - d) / 2;
    return {
      title: `Ein Heft und ein Buntstift-Set kosten zusammen ${E(T)}. Das Set ist ${E(d)} teurer als das Heft.`,
      html: eqLine('Heft: [[0]] €') + eqLine('Buntstift-Set: [[1]] €'),
      fields: [FM(small), FM(small + d)],
      hint: `${eur(T)} − ${eur(d)} = ${eur(T - d)}. Das ist doppelt so viel wie das Heft. Teile durch 2.`,
      explain: `${eur(T)} − ${eur(d)} = ${eur(T - d)}; ${eur(T - d)} : 2 = ${eur(small)} € (Heft); ${eur(small)} + ${eur(d)} = ${eur(small + d)} € (Set)`
    };
  }
  // 's2big': Einkauf mit drei Sorten und Rückgeld
  const list = shopList(3, 6), tot = list.reduce((a, x) => a + x.k * x.it.p, 0), pay = [1000, 2000, 5000, 10000].find(x => x > tot);
  const text = list.map(x => `${x.k} ${nm(x.it, x.k)}`).join(', ').replace(/, ([^,]*)$/, ' und $1');
  return {
    title: `Du kaufst ${text} und bezahlst mit ${pay / 100} €. Wie viel Rückgeld bekommst du?`,
    html: eqLine('Gesamtpreis: [[0]] €') + eqLine('Rückgeld: [[1]] €', 'sum'),
    fields: [FM(tot), FM(pay - tot)],
    hint: 'Rechne jede Sorte einzeln (Anzahl mal Preis), addiere alles und ziehe dann vom Schein ab.',
    explain: list.map(x => `${x.k} · ${eur(x.it.p)} €`).join(' + ') + ` = ${eur(tot)} €; ${eur(pay)} € − ${eur(tot)} € = ${eur(pay - tot)} €`
  };
}
function g_sach(L) {
  if (L >= 4) return g_sach_hard(L, pick(L === 4 ? ['m1', 'm2', 's2big', 'm1', 'm2'] : ['m1', 'm2', 'm3', 's2big', 'm2']));
  const kind = pick(L === 1 ? ['s1', 's3'] : L === 2 ? ['s1', 's2', 's3'] : ['s2', 's4', 's5', 's1b']);
  if (kind === 's1' || kind === 's1b') {
    const list = shopList(kind === 's1' ? 2 : 3, L === 1 ? 3 : 4);
    const text = list.map(x => `${x.k} ${nm(x.it, x.k)}`).join(', ').replace(/, ([^,]*)$/, ' und $1');
    const tot = list.reduce((a, x) => a + x.k * x.it.p, 0);
    return {
      title: `Du kaufst ${text} in der Bäckerei. Wie viel kostet das zusammen?`,
      html: list.map((x, i) => eqLine(`${x.k} · ${E(x.it.p)} = [[${i}]] €`)).join('') + eqLine(`Zusammen: [[${list.length}]] €`, 'sum'),
      fields: [...list.map(x => FM(x.k * x.it.p)), FM(tot)],
      hint: 'Rechne zuerst jede Sorte einzeln (Anzahl mal Preis). Dann addiere alles.',
      explain: list.map(x => `${x.k} · ${eur(x.it.p)} € = ${eur(x.k * x.it.p)} €`).join('; ') + `; zusammen ${eur(tot)} €`
    };
  }
  if (kind === 's2') {
    const list = shopList(2, L === 2 ? 3 : 5), tot = list.reduce((a, x) => a + x.k * x.it.p, 0);
    const pay = [500, 1000, 2000, 5000].find(x => x > tot);
    const text = list.map(x => `${x.k} ${nm(x.it, x.k)}`).join(' und ');
    return {
      title: `Du kaufst ${text} und bezahlst mit ${pay / 100} €. Wie viel Rückgeld bekommst du?`,
      html: eqLine('Gesamtpreis: [[0]] €') + eqLine('Rückgeld: [[1]] €', 'sum'),
      fields: [FM(tot), FM(pay - tot)],
      hint: `Berechne zuerst den Gesamtpreis. Dann: ${pay / 100},00 € minus Gesamtpreis.`,
      explain: list.map(x => `${x.k} · ${eur(x.it.p)} €`).join(' + ') + ` = ${eur(tot)} €; ${eur(pay)} € − ${eur(tot)} € = ${eur(pay - tot)} €`
    };
  }
  if (kind === 's3') {
    const x = ri(1, 2), y = ri(1, 3), pe = pick([400, 450, 500]), pk = pick([250, 300, 350]);
    const a = x * pe, b = y * pk, tot = a + b;
    let html = eqLine(`${x} · ${E(pe)} = [[0]] €`) + eqLine(`${y} · ${E(pk)} = [[1]] €`) + eqLine('Zusammen: [[2]] €', 'sum');
    const fields = [FM(a), FM(b), FM(tot)]; let extra = '';
    if (L >= 2) { html += eqLine('Rest von 50 €: [[3]] €'); fields.push(FM(5000 - tot)); extra = ' Sie nehmen 50 € mit. Wie viel Geld bleibt übrig?'; }
    return {
      title: `Auf dem Jahrmarkt: Eintritt Erwachsene ${E(pe)}, Kinder ${E(pk)}. Es kommen ${x} ${x === 1 ? 'Erwachsener' : 'Erwachsene'} und ${y} ${y === 1 ? 'Kind' : 'Kinder'}.${extra}`,
      html, fields,
      hint: 'Rechne erst die Erwachsenen, dann die Kinder. Dann addiere (und ziehe ab).',
      explain: `${x} · ${eur(pe)} = ${eur(a)} €; ${y} · ${eur(pk)} = ${eur(b)} €; zusammen ${eur(tot)} €` + (L >= 2 ? `; 50,00 € − ${eur(tot)} € = ${eur(5000 - tot)} €` : '')
    };
  }
  if (kind === 's4') {
    const T = pick([300, 400, 500, 600, 700]), d = pick([20, 30, 40, 50, 60]);
    const dd = d % 2 ? d + 1 : d, small = (T - dd) / 2, large = small + dd;
    return {
      title: `Ein Vater kauft ein kleines und ein großes Fahrrad. Das große ist ${dd} € teurer als das kleine. Zusammen kosten sie ${T} €.`,
      html: eqLine('Kleines Fahrrad: [[0]] €') + eqLine('Großes Fahrrad: [[1]] €'),
      fields: [F(small), F(large)],
      hint: `${T} − ${dd} = ${T - dd}. Das ist doppelt so viel wie das kleine Fahrrad. Teile durch 2.`,
      explain: `${T} − ${dd} = ${T - dd}; ${T - dd} : 2 = ${small} (klein); ${small} + ${dd} = ${large} (groß)`
    };
  }
  const T = pick([150, 240, 300, 360, 450, 540, 600]);
  return {
    title: `Eine Mutter und ihr Sohn fahren mit der Bahn. Kinder zahlen die Hälfte. Zusammen kostet die Fahrt ${T} €.`,
    html: eqLine('Kind zahlt: [[0]] €') + eqLine('Mutter zahlt: [[1]] €'),
    fields: [F(T / 3), F(T * 2 / 3)],
    hint: 'Die Mutter zahlt 2 Teile, das Kind 1 Teil. Zusammen sind das 3 Teile.',
    explain: `${T} : 3 = ${T / 3} € (Kind); 2 · ${T / 3} = ${T * 2 / 3} € (Mutter)`
  };
}

const RANGES = ['weniger als 10 ct', '10 ct – 1 €', '1 € – 5 €', '5 € – 10 €', '10 € – 50 €', '50 € – 100 €', '100 € – 500 €', '500 € – 1.000 €', '1.000 € – 10.000 €', '10.000 € – 100.000 €'];
const PRICEQ = [
  ['ein Bonbon', 0], ['ein Radiergummi', 1], ['ein weißes Brötchen', 1], ['ein Schulheft', 1], ['ein Kugelschreiber', 1],
  ['1 Liter Milch', 2], ['eine Kugel Eis', 2], ['ein Taschenbuch', 3], ['ein Fußball', 4], ['ein Fahrradhelm', 4],
  ['ein Paar Turnschuhe', 5], ['ein Kinderfahrrad', 6], ['ein einfaches Handy', 6], ['ein Laptop', 7],
  ['eine Familienreise in den Urlaub', 8], ['ein neues Auto', 9],
  ['ein Kaugummi', 0], ['ein Bleistift', 1], ['ein Apfel', 1], ['eine Banane', 1], ['ein Päckchen Taschentücher', 1],
  ['eine Tafel Schokolade', 2], ['1 Liter Benzin', 2], ['ein Eis am Stiel', 2], ['1 Kilo Kartoffeln', 2], ['ein Laib Brot', 2],
  ['ein Eisbecher in der Eisdiele', 3], ['ein Brettspiel', 4], ['ein Paar Gummistiefel', 4], ['ein Schulranzen', 6],
  ['ein Flugticket nach Spanien', 6], ['ein Fernseher', 7]
];
function g_schaetzen(L) {
  const [name, idx] = pick(PRICEQ);
  const others = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(i => i !== idx);
  const near = others.filter(i => Math.abs(i - idx) === 1);
  let opts;
  if (L >= 4) opts = shuffle(others).sort((x, y) => Math.abs(x - idx) - Math.abs(y - idx)).slice(0, L === 4 ? 3 : 4);   // die ähnlichsten Bereiche
  else if (L === 1) opts = shuffle(others.filter(i => Math.abs(i - idx) >= 2)).slice(0, 3);
  else opts = [...shuffle(near).slice(0, L === 2 ? 1 : 2), ...shuffle(others.filter(i => Math.abs(i - idx) >= 2)).slice(0, L === 2 ? 2 : 1)];
  const all = shuffle([idx, ...opts]);
  return {
    title: 'Preise schätzen: Was ist ungefähr so teuer?',
    prompt: eqLine(`Wie viel kostet ${name} ungefähr?`, 'q'),
    choices: all.map(i => RANGES[i]), correct: all.indexOf(idx),
    hint: 'Überlege: Hast du so etwas schon einmal gekauft? War es eher ein paar Cent, ein paar Euro oder mehr?',
    explain: `${name[0].toUpperCase() + name.slice(1)} kostet ungefähr ${RANGES[idx]}.`
  };
}

function g_ticket_hard(L) {
  const pa = pick([3600, 3800, 4200, 4500, 4800]), pk = Math.round(pa / 2 / 50) * 50;
  if (L === 4) {                                 // Familienticket, zwei Familien
    const a = ri(2, 3), k = ri(2, 4), singles = a * pa + k * pk, disc = pick([400, 500, 600, 750, 800, 1000, 1200, 1500].filter(x => x < singles)), fam = singles - disc;
    return {
      title: `Zwei gleiche Familien (je ${a} Erwachsene und ${k} Kinder) fahren zusammen ins Schwimmbad.`,
      html: eqLine(`Einzelticket Erwachsene: ${E(pa)} · Kinder: ${E(pk)}<br>Familienticket (pro Familie): ${E(fam)}`, 'info') +
        eqLine('Einzeltickets für eine Familie: [[0]] €') + eqLine('Eine Familie spart mit dem Familienticket: [[1]] €') + eqLine('Beide Familien sparen zusammen: [[2]] €', 'sum'),
      fields: [FM(singles), FM(disc), FM(2 * disc)],
      hint: `Rechne ${a} · ${eur(pa)} € + ${k} · ${eur(pk)} €. Dann Einzeltickets minus Familienticket. Zum Schluss mal 2.`,
      explain: `${a} · ${eur(pa)} + ${k} · ${eur(pk)} = ${eur(singles)} €; ${eur(singles)} − ${eur(fam)} = ${eur(disc)} €; 2 · ${eur(disc)} = ${eur(2 * disc)} €`
    };
  }
  let k, singles, fam, famPlus, G, best, g = 0;     // L5: drei Tarife
  do {
    k = ri(3, 5); singles = 2 * pa + k * pk; fam = 2 * pa + 2 * pk - pick([600, 800, 1000, 1200]);
    famPlus = fam + (k - 2) * pk; G = singles - pick([800, 1000, 1500, 2000, 2500, 3000]); best = Math.min(singles, famPlus, G); g++;
  } while ((new Set([singles, famPlus, G]).size < 3 || G <= 0) && g < 300);
  return {
    title: `2 Erwachsene und ${k} Kinder wollen ins Schwimmbad. Welcher Tarif ist am günstigsten?`,
    html: eqLine(`Einzelticket Erwachsene: ${E(pa)} · Kinder: ${E(pk)}<br>Familienticket (2 Erwachsene + 2 Kinder): ${E(fam)}<br>Gruppenticket (alle ${k + 2} Personen): ${E(G)}`, 'info') +
      eqLine('Alles einzeln: [[0]] €') + eqLine(`Familienticket + ${k - 2} ${k - 2 === 1 ? 'Kind' : 'Kinder'} einzeln: [[1]] €`) + eqLine('Der günstigste Tarif kostet: [[2]] €') + eqLine('Das spart gegenüber „alles einzeln“: [[3]] €', 'sum'),
    fields: [FM(singles), FM(famPlus), FM(best), FM(singles - best)],
    hint: `Alles einzeln: 2 · ${eur(pa)} € + ${k} · ${eur(pk)} €. Familienticket: ${eur(fam)} € plus ${k - 2} · ${eur(pk)} €. Vergleiche alle drei Preise.`,
    explain: `Einzeln ${eur(singles)} €; Familie + Kinder ${eur(famPlus)} €; Gruppe ${eur(G)} €. Am günstigsten: ${eur(best)} €, Ersparnis ${eur(singles - best)} €.`
  };
}
function g_ticket(L) {
  if (L >= 4) return g_ticket_hard(L);
  const a = ri(1, 2), k = L === 1 ? ri(1, 2) : ri(1, 3);
  const pa = pick([3600, 3800, 4200, 4500, 4800]), pk = Math.round(pa / 2 / 50) * 50;
  const singles = a * pa + k * pk;
  const disc = pick([300, 350, 400, 500, 600, 750, 800, 1000, 1200].filter(x => x < singles));
  const fam = singles - disc;
  return {
    title: `Familie mit ${a} ${a === 1 ? 'Erwachsenem' : 'Erwachsenen'} und ${k} ${k === 1 ? 'Kind' : 'Kindern'}: Einzeltickets oder Familienticket?`,
    html: eqLine(`Einzelticket Erwachsene: ${E(pa)} · Kinder: ${E(pk)}<br>Familienticket: ${E(fam)}`, 'info') +
      eqLine('Einzeltickets zusammen: [[0]] €') + eqLine('Unterschied: [[1]] €', 'sum'),
    fields: [FM(singles), FM(disc)],
    hint: `Rechne ${a} · ${eur(pa)} € + ${k} · ${eur(pk)} €. Dann: Einzeltickets minus Familienticket.`,
    explain: `${a} · ${eur(pa)} + ${k} · ${eur(pk)} = ${eur(singles)} €; ${eur(singles)} − ${eur(fam)} = ${eur(disc)} € Unterschied (Familienticket ist günstiger).`
  };
}

/* =====================================================================
   EXTRA-TRAINING (nicht aus dem Arbeitsheft) – Module mit extra:true
   Erscheinen unter „Extra-Training“, zählen wie alles andere nur durch echtes Rechnen.
   „Jetzt üben“ (nextUp) schlägt sie nicht vor – sie sind freiwillig.
   ===================================================================== */
/* Einmaleins 1–10: leichte Reihen zuerst, die schweren (6–9) in den höheren Stufen */
const EM_ROWS = L => L <= 2 ? [1, 2, 5, 10] : L === 3 ? [2, 3, 4, 5, 6, 10] : L === 4 ? [3, 4, 6, 7, 8, 9] : [6, 7, 8, 9];
function emPairs(L, n) {
  const out = [], seen = new Set(); let g = 0;
  while (out.length < n && g++ < 200) {
    const a = pick(EM_ROWS(L)), b = L >= 5 ? ri(3, 10) : ri(1, 10), p = Math.random() < .5 ? [a, b] : [b, a], k = p.join('x');
    if (!seen.has(k)) { seen.add(k); out.push(p); }
  }
  return out;
}
const emHint = (a, b) => b > 5 ? `Zerlege: ${a} · ${b} = ${a} · 5 + ${a} · ${b - 5}  (${a * 5} + ${a * (b - 5)})`
  : b > 2 ? `Zerlege: ${a} · ${b} = ${a} · 2 + ${a} · ${b - 2}  (${a * 2} + ${a * (b - 2)})` : `Denke an die Kernaufgabe ${a} · 10 = ${a * 10}.`;
function g_em_mal(L) {
  const ps = emPairs(L, L >= 4 ? 3 : 2);
  return {
    title: 'Rechne die Mal-Aufgaben.',
    html: ps.map((p, i) => eqLine(`${p[0]} · ${p[1]} = [[${i}]]`)).join(''), fields: ps.map(p => F(p[0] * p[1])),
    hint: emHint(ps[0][0], ps[0][1]),
    explain: ps.map(p => `${p[0]} · ${p[1]} = ${p[0] * p[1]}`).join(';  ')
  };
}
function g_em_geteilt(L) {
  const ps = emPairs(L, L >= 4 ? 3 : 2);
  return {
    title: 'Rechne die Geteilt-Aufgaben.',
    html: ps.map((p, i) => eqLine(`${p[0] * p[1]} : ${p[0]} = [[${i}]]`)).join(''), fields: ps.map(p => F(p[1])),
    hint: `Denke an die Mal-Aufgabe: ${ps[0][0]} · ? = ${ps[0][0] * ps[0][1]}`,
    explain: ps.map(p => `${p[0] * p[1]} : ${p[0]} = ${p[1]}, weil ${p[0]} · ${p[1]} = ${p[0] * p[1]}`).join(';  ')
  };
}
function g_em_luecke(L) {
  const ps = emPairs(L, L >= 4 ? 3 : 2);
  const rows = ps.map(([a, b], i) => L >= 3 && Math.random() < .4
    ? { h: `[[${i}]] : ${a} = ${b}`, f: F(a * b), x: `${a * b} : ${a} = ${b}` }
    : Math.random() < .5 ? { h: `${a} · [[${i}]] = ${a * b}`, f: F(b), x: `${a} · ${b} = ${a * b}` } : { h: `[[${i}]] · ${b} = ${a * b}`, f: F(a), x: `${a} · ${b} = ${a * b}` });
  return {
    title: 'Welche Zahl fehlt?',
    html: rows.map(r => eqLine(r.h)).join(''), fields: rows.map(r => r.f),
    hint: 'Frage dich: Welche Einmaleins-Aufgabe passt? Die Umkehraufgabe hilft.',
    explain: rows.map(r => r.x).join(';  ')
  };
}
function g_em_reihe(L) {
  const a = pick(EM_ROWS(Math.max(2, L)).filter(x => x > 1)), back = L >= 5 && Math.random() < .5, start = L <= 2 ? 1 : ri(1, L >= 4 ? 5 : 3);
  let seq = Array.from({ length: 6 }, (_, i) => a * (start + i)); if (back) seq = seq.reverse();
  const gaps = L <= 2 ? [4, 5] : L === 3 ? [3, 5] : shuffle([1, 2, 3, 4, 5]).slice(0, 3).sort((x, y) => x - y);
  let k = 0; const cells = seq.map((v, i) => gaps.includes(i) ? `<span class="node">[[${k++}]]</span>` : `<span class="node">${v}</span>`);
  return {
    title: back ? 'Die Reihe läuft rückwärts. Setze sie fort.' : `Setze die ${a}er-Reihe fort.`,
    html: `<div class="eq">${cells.join(', ')}</div>`, fields: gaps.map(i => F(seq[i])),
    hint: `Es geht immer ${a} ${back ? 'zurück' : 'weiter'}.`,
    explain: seq.join(', ')
  };
}
/* Kopfrechnen bis 1000 (und Verdoppeln/Halbieren) */
function kpNums(L, minus) {
  let a, b;
  if (L <= 2) { a = ri(1, 9) * 100 + ri(1, 9) * 10; b = ri(1, 9) * 10; }
  else if (L === 3) { a = ri(120, 880); b = ri(12, 99); }
  else if (L === 4) { a = ri(250, 750); b = ri(110, 249); }
  else { a = ri(1200, 8800); b = ri(150, 990); }
  if (!minus && L <= 4 && a + b > 1000) a = 1000 - b - ri(1, 50);
  return [a, b];
}
function g_kp_plus(L) {
  const ps = [kpNums(L, false), kpNums(L, false)];
  return {
    title: 'Rechne im Kopf.',
    html: ps.map(([a, b], i) => eqLine(`${a} + ${b} = [[${i}]]`)).join(''), fields: ps.map(([a, b]) => F(a + b)),
    hint: `Zerlege die zweite Zahl: erst die Hunderter/Zehner, dann die Einer. ${ps[0][0]} + ${ps[0][1] - ps[0][1] % 10} = ${ps[0][0] + ps[0][1] - ps[0][1] % 10}, dann + ${ps[0][1] % 10}.`,
    explain: ps.map(([a, b]) => `${a} + ${b} = ${a + b}`).join(';  ')
  };
}
function g_kp_minus(L) {
  const ps = [kpNums(L, true), kpNums(L, true)];
  return {
    title: 'Rechne im Kopf.',
    html: ps.map(([a, b], i) => eqLine(`${a} − ${b} = [[${i}]]`)).join(''), fields: ps.map(([a, b]) => F(a - b)),
    hint: `Zerlege die zweite Zahl: ${ps[0][0]} − ${ps[0][1] - ps[0][1] % 10} = ${ps[0][0] - ps[0][1] + ps[0][1] % 10}, dann − ${ps[0][1] % 10}.`,
    explain: ps.map(([a, b]) => `${a} − ${b} = ${a - b}`).join(';  ')
  };
}
function g_kp_dopp(L) {
  const d = L <= 2 ? ri(11, 49) : L === 3 ? ri(26, 99) : L === 4 ? ri(120, 499) : ri(260, 999);
  const h = (L <= 2 ? ri(6, 49) : L === 3 ? ri(26, 99) : L === 4 ? ri(110, 450) : ri(260, 2499)) * 2;
  return {
    title: 'Verdopple und halbiere.',
    html: eqLine(`Das Doppelte von ${d} = [[0]]`) + eqLine(`Die Hälfte von ${h} = [[1]]`),
    fields: [F(d * 2), F(h / 2)],
    hint: `Zerlege: ${d} = ${d - d % 10} + ${d % 10}. Verdopple beide Teile. Beim Halbieren genauso.`,
    explain: `${d} + ${d} = ${d * 2};  ${h} : 2 = ${h / 2}`
  };
}
/* Schriftlich rechnen mit ganzen Zahlen (Stellenwert-Raster wie bei Geld, ohne Komma) */
function colInt(nums, op) {
  const res = op === '+' ? nums.reduce((a, b) => a + b, 0) : nums[0] - nums[1];
  const strs = nums.map(String), rs = String(res), W = Math.max(rs.length, ...strs.map(x => x.length));
  const cellsOf = x => [...(' '.repeat(W - x.length) + x)].map(ch => `<span class="cell">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  let html = '<div class="col">';
  strs.forEach((x, i) => { html += `<div class="crow"><span class="sg">${i === 0 ? '' : op}</span>${cellsOf(x)}<span class="cu"></span></div>`; });
  html += '<div class="cline"></div>';
  const pad = ' '.repeat(W - rs.length) + rs, fields = [], cells = []; let seen = 0;
  for (let p = W - 1; p >= 0; p--) {
    if (pad[p] === ' ') cells.unshift('<span class="cell">&nbsp;</span>');
    else { cells.unshift(`<span class="cell">[[${seen}]]</span>`); fields.push(F(pad[p], { digit: true, next: seen + 1 < rs.length ? seen + 1 : null })); seen++; }
  }
  html += `<div class="crow"><span class="sg"></span>${cells.join('')}<span class="cu"></span></div></div>`;
  return {
    title: op === '+' ? 'Rechne schriftlich: addieren.' : 'Rechne schriftlich: subtrahieren.',
    html, fields,
    hint: op === '+' ? 'Von rechts nach links: Einer, Zehner, Hunderter … Denke an den Übertrag.' : 'Von rechts nach links. Reicht die obere Ziffer nicht, entbündle einen Zehner von links.',
    explain: `${strs.join(` ${op} `)} = ${rs}`
  };
}
function g_sr_add(L) {
  const n = L >= 4 ? 3 : 2, hi = L <= 2 ? 999 : L === 3 ? 4999 : L === 4 ? 9999 : 49999, lo = L <= 2 ? 100 : 1000;
  return colInt(Array.from({ length: n }, () => ri(lo, hi)), '+');
}
function g_sr_sub(L) {
  const hi = L <= 2 ? 999 : L === 3 ? 9999 : L === 4 ? 49999 : 99999, a = ri(Math.floor(hi / 3), hi);
  let b, g = 0; do { b = ri(Math.floor(a / 10), a - 1); g++; } while (L >= 3 && String(a).slice(-1) >= String(b).slice(-1) && g < 50);
  return colInt([a, b], '−');
}

/* =====================================================================
   MODULE REGISTRY
   ===================================================================== */
const MODULES = [
  {
    // Kind sieht kurze, wörtliche Namen (title/t) und ein Mathe-Symbol (icon). IDs NIE ändern – Spielstände hängen daran. "wb" = Name im Arbeitsheft, nur für Eltern (Eltern-Bereich, README).
    id: 'A4', title: 'Teilen mit Zehnern', sub: 'Knacke die Zahlen-Codes', wb: 'Division durch Zehnerzahlen', icon: '÷', topics: [
      { id: 'umkehr', t: 'Mal und geteilt', wb: 'Umkehraufgaben', d: 'Vorwärts und rückwärts: Wer knackt den Code?', icon: '× ÷', gen: g_umkehr },
      { id: 'kleine', t: 'Mit Nullen teilen', wb: 'Kleine Geteiltaufgabe', d: 'Streiche die Nullen und löse den Fall', icon: '÷ 10', gen: g_kleine },
      { id: 'divtens', t: 'Durch Zehner teilen', wb: 'Durch Zehner teilen', d: 'Wie oft passt das hinein? Schnell, schneller, Blitz!', icon: '÷ 20', gen: g_divtens },
      { id: 'geteilt', t: 'Rechentabellen', wb: 'Geteilttabellen', d: 'Fülle den Tresor Feld für Feld', icon: '▦', gen: g_geteilt },
      { id: 'paeck', t: 'Zahlenmuster', wb: 'Schöne Päckchen', d: 'Finde das Geheimnis in der Reihe', icon: '2 4 6', gen: g_paeckchen },
      { id: 'vergl', t: 'Zahlen vergleichen', wb: 'Vergleichen', d: 'Welche Seite gewinnt?', icon: '< = >', gen: g_vergleich },
      { id: 'kette', t: 'Rechenketten', wb: 'Rechenketten', d: 'Hüpfe von Station zu Station bis ins Ziel', icon: '→', gen: g_kette },
      { id: 'raetsel', t: 'Welche Zahl fehlt?', wb: 'Zahlenrätsel', d: 'Errate die Zahl, die ich mir denke', icon: '?', gen: g_raetsel }
    ]
  },
  {
    id: 'A5', title: 'Rechnen mit Geld', sub: 'Münzen, Preise, Rückgeld', wb: 'Geld', icon: '€', topics: [
      { id: 'schreib', t: 'Euro und Cent', wb: 'Schreibweisen', d: 'Cent, Euro, Komma: übersetze jeden Betrag', icon: '€ ct', gen: g_schreib },
      { id: 'column', t: 'Mit Geld rechnen', wb: 'Schriftlich rechnen', d: 'Rechne Stelle für Stelle wie an der Kasse', icon: '+ −', gen: g_column },
      { id: 'ueber', t: 'Beträge runden', wb: 'Überschlagen', d: 'Runden, schätzen, Treffer landen', icon: '≈ €', gen: g_ueber },
      { id: 'angebot', t: 'Was ist günstiger?', wb: 'Angebote', d: 'Einzeln oder im Paket? Finde das beste Angebot', icon: '€ ?', gen: g_angebot },
      { id: 'sach', t: 'Einkaufen & Rückgeld', wb: 'Sachrechnen', d: 'Einkaufen, Rückgeld, knifflige Fälle', icon: '🛒', gen: g_sach },
      { id: 'schaetz', t: 'Was kostet das?', wb: 'Preise schätzen', d: 'Was kostet das ungefähr?', icon: '€', gen: g_schaetzen },
      { id: 'ticket', t: 'Fahrkarten kaufen', wb: 'Tickets', d: 'Einzel-, Familien- oder Gruppenticket: was lohnt sich?', icon: '🎫', gen: g_ticket }
    ]
  },
  /* ---- Extra-Training (extra:true, IDs ohne Kapitel-Buchstabe-Nummer) ---- */
  {
    id: 'EMAL', extra: true, title: 'Einmaleins', sub: 'Mal und geteilt bis 10 · 10', wb: 'Extra: kleines Einmaleins', icon: '×', topics: [
      { id: 'mal', t: 'Mal-Aufgaben', wb: 'Einmaleins', d: 'Gemischte Mal-Aufgaben 1–10', icon: '×', gen: g_em_mal },
      { id: 'geteilt', t: 'Geteilt-Aufgaben', wb: 'Einmaleins geteilt', d: 'Die Umkehr der Mal-Aufgaben', icon: ':', gen: g_em_geteilt },
      { id: 'luecke', t: 'Welche Zahl fehlt?', wb: 'Lückenaufgaben', d: 'Finde die fehlende Zahl', icon: '□', gen: g_em_luecke },
      { id: 'reihe', t: 'Einmaleins-Reihen', wb: 'Reihen', d: 'Setze die Reihe fort', icon: '7 14', gen: g_em_reihe }
    ]
  },
  {
    id: 'KOPF', extra: true, title: 'Kopfrechnen', sub: 'Plus und minus bis 1000', wb: 'Extra: Kopfrechnen', icon: '±', topics: [
      { id: 'plus', t: 'Plus im Kopf', wb: 'Addieren', d: 'Zerlegen und dazurechnen', icon: '+', gen: g_kp_plus },
      { id: 'minus', t: 'Minus im Kopf', wb: 'Subtrahieren', d: 'Zerlegen und abziehen', icon: '−', gen: g_kp_minus },
      { id: 'dopp', t: 'Verdoppeln & Halbieren', wb: 'Verdoppeln/Halbieren', d: 'Das Doppelte und die Hälfte', icon: '· 2', gen: g_kp_dopp }
    ]
  },
  {
    id: 'SCHR', extra: true, title: 'Schriftlich rechnen', sub: 'Untereinander rechnen', wb: 'Extra: schriftliche Verfahren', icon: '+ −', topics: [
      { id: 'add', t: 'Schriftlich addieren', wb: 'Schriftliche Addition', d: 'Stelle unter Stelle', icon: '+', gen: g_sr_add },
      { id: 'sub', t: 'Schriftlich subtrahieren', wb: 'Schriftliche Subtraktion', d: 'Mit Entbündeln', icon: '−', gen: g_sr_sub }
    ]
  }
];
