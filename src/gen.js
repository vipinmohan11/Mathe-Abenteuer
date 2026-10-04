/* =====================================================================
   QUESTION GENERATORS + MODULE REGISTRY
   ---------------------------------------------------------------------
   A question is a plain object (JSON-safe, so it can be stored in the
   Fehler-Heft):
     { title, html, fields:[{a, digit?, strict?, money?, next?}], hint, explain }
        html uses [[0]], [[1]] ... as placeholders for answer fields
     { title, prompt, choices:[html...], correct:int, hint, explain }

   TO ADD A NEW BOOK MODULE (A1, A6 ...):
     1. write generator functions  g_xyz(level)  (level 1..3)
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
  const a = ri(2, 9), b = pick(L === 1 ? T10 : [...T10, 100]);
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
    do { q = ri(2, L === 1 ? 5 : 9); d = ri(1, 9) * 10; D = q * d; } while (D > 1000);
    return {
      title: 'Rechne erst die kleine Geteiltaufgabe, dann die große.',
      html: eqLine(`${D / 10} : ${d / 10} = [[0]]`) + eqLine(`${D} : ${d} = [[1]]`),
      fields: [F(q), F(q)],
      hint: `Streiche bei beiden Zahlen eine Null: ${D / 10} : ${d / 10}.`,
      explain: `${D / 10} : ${d / 10} = ${q}  →  ${D} : ${d} = ${q}`
    };
  }
  const d = ri(2, 9), q = ri(2, 9), small = q * d, D = small * 10;
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
  do { q = ri(1, L === 1 ? 5 : L === 2 ? 9 : 10); d = ri(1, L === 3 ? 10 : 9) * 10; D = q * d; } while (D > 1000);
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
  3: [[30, 60, 90], [40, 80, 160], [20, 50, 100], [15, 30, 60], [12, 60, 120]]
};
function g_geteilt(L) {
  const cols = pick(GT_SETS[L]), m = cols.reduce(lcm, 1);
  const mult = []; for (let x = m; x <= 1000; x += m) mult.push(x);
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
  const r = Math.random();
  const v = L === 1 ? (r < .45 ? 1 : r < .9 ? 2 : 3) : (r < .3 ? 1 : r < .55 ? 2 : 3);
  if (v === 1) {                       // gleiches Ergebnis
    let q, s;
    do { q = ri(2, 9); s = L === 1 ? 10 : pick([10, 20, 30]); } while (q * s * 4 > 1000);
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
    do { d = pick(L === 1 ? [10, 20, 30, 40, 50] : T10); s0 = L === 1 ? 1 : ri(1, 5); g++; } while (d * (s0 + 3) > 1000 && g < 50);
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
  do {
    d = pick(T10); st = L === 1 ? 1 : pick([1, 2]); dir = (L >= 2 && Math.random() < .5) ? -1 : 1; s = ri(1, 10);
    seq = [0, 1, 2, 3, 4].map(i => s + dir * st * i); g++;
  } while (!(seq.every(x => x >= 1 && x <= 10) && d * Math.max(...seq) <= 1000) && g < 500);
  if (!seq.every(x => x >= 1 && x <= 10)) { d = 30; st = 1; dir = 1; s = 1; seq = [1, 2, 3, 4, 5]; }
  const shown = [0, 1, 2].map(i => eqLine(`${d * seq[i]} : ${d} = ${seq[i]}`, 'done')).join('');
  return {
    title: 'Setze das Päckchen fort.',
    html: shown + eqLine(`${d * seq[3]} : ${d} = [[0]]`) + eqLine(`${d * seq[4]} : ${d} = [[1]]`),
    fields: [F(seq[3]), F(seq[4])],
    hint: `Schau, wie sich die Ergebnisse verändern: immer um ${st} ${dir > 0 ? 'größer' : 'kleiner'}.`,
    explain: `${d * seq[3]} : ${d} = ${seq[3]}  und  ${d * seq[4]} : ${d} = ${seq[4]}`
  };
}

function g_vergleich(L) {
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
    let v = L === 1 ? ri(1, 12) * 10 : ri(2, 30) * 10;
    const start = v, ops = [], vals = [v]; let ok = true;
    for (let i = 0; i < n && ok; i++) {
      const k = pick(['·', '+', '−', ':']); let x;
      if (k === '·') { x = ri(2, L === 1 ? 5 : 10); v *= x; }
      else if (k === ':') { const ds = [2, 3, 4, 5, 6, 8, 10].filter(d => v % d === 0 && v / d >= 1); if (!ds.length) { ok = false; break; } x = pick(ds); v /= x; }
      else if (k === '+') { x = ri(1, L === 1 ? 5 : 10) * 10; v += x; }
      else { x = ri(1, L === 1 ? 5 : 10) * 10; if (v - x < 10) { ok = false; break; } v -= x; }
      if (v > 1000) { ok = false; break; }
      ops.push({ k, x }); vals.push(v);
    }
    if (ok) return { start, ops, vals };
  }
  const fo = [{ k: ':', x: 10 }, { k: '·', x: 5 }, { k: '−', x: 20 }, { k: '+', x: 10 }, { k: '·', x: 2 }];
  return { start: 100, ops: fo.slice(0, n), vals: [100, 10, 50, 30, 40, 80].slice(0, n + 1) };
}

function g_kette(L) {
  const n = L === 1 ? 2 : L === 2 ? 3 : 5;
  const { start, ops, vals } = buildOps(n, L);
  let html = `<div class="chain"><span class="node s">${start}</span>`;
  const fields = [];
  ops.forEach((o, i) => {
    html += `<span class="arr">${o.k} ${o.x}</span>`;
    if (L === 3 && i === n - 1) html += `<span class="node z">Ziel ${vals[n]}</span>`;
    else { html += `<span class="node">[[${fields.length}]]</span>`; fields.push(F(vals[i + 1])); }
  });
  html += '</div>';
  return {
    title: L === 3 ? `Hüpfe im Päckchen! Rechne immer mit dem Ergebnis weiter. Das Ziel ist die ${vals[n]}.`
      : 'Rechne die Rechenkette. Nimm immer das Ergebnis weiter.',
    html, fields,
    hint: `Fang bei ${start} an: ${start} ${ops[0].k} ${ops[0].x} = ${vals[1]}. Dann rechne mit diesem Ergebnis weiter.`,
    explain: ops.map((o, i) => `${vals[i]} ${o.k} ${o.x} = ${vals[i + 1]}`).join('; ')
  };
}

function g_raetsel(L) {
  const n = L === 1 ? 2 : L === 2 ? 3 : 4;
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
  const dir = pick(L === 1 ? [0, 1, 2] : [0, 1, 2, 3, 4]);
  let e, c;
  if (L === 1) { e = ri(1, 20); c = pick([10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90]); }
  else if (L === 2) { e = ri(0, 30); c = Math.random() < .45 ? ri(1, 9) : ri(10, 99); }
  else { e = pick([0, 0, ri(1, 99), ri(1, 99)]); c = Math.random() < .6 ? ri(1, 9) : ri(10, 99); }
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
  if (Math.random() < .5) {
    let a, b, g = 0;
    do { a = ri(1500, 9000); b = ri(300, a - 200); g++; } while (!(a % 100 < b % 100) && g < 500);
    return colQ([a, b], '−');
  }
  return colQ(Array.from({ length: ri(3, 4) }, () => ri(300, 3000)), '+');
}

const round1 = c => Math.floor((c + 50) / 100);                       // whole euros, half up
const round10 = c => Math.floor((c / 100 + 5) / 10) * 10;             // tens of euros, half up
const ITEMS_U = ['Fahrradhelm', 'Ball', 'Rucksack', 'Trinkflasche', 'Buch', 'Federmäppchen', 'Spiel', 'Mütze', 'Schal', 'Puzzle'];

function g_ueber(L) {
  if (L >= 2 && Math.random() < (L === 2 ? .35 : .5)) {          // choice: which result fits?
    const a = ri(500, L === 2 ? 4500 : 9000), b = ri(300, L === 2 ? 3500 : 6000), sub = L === 3 && Math.random() < .5;
    const [x, y] = sub && a < b ? [b, a] : [a, b];
    const right = sub ? x - y : x + y;
    const offs = shuffle([1000, -1000, 2000, -2000]).filter(o => right + o > 0).slice(0, 3);
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
  const names = shuffle(ITEMS_U).slice(0, 3); let ps;
  if (L === 2) ps = names.map(() => ri(150, 4999));
  else { do { ps = names.map(() => ri(1500, 25000)); } while (ps.some(p => p % 100 === 0 && (p / 100) % 10 === 5)); }
  const rf = L === 2 ? round1 : round10, rr = ps.map(rf), tot = rr.reduce((a, b) => a + b, 0);
  return {
    title: L === 2 ? 'Überschlage die Kosten. Runde auf ganze Euro.' : 'Überschlage die Kosten. Runde auf volle 10 Euro.',
    html: names.map((n, i) => eqLine(`${n}: ${E(ps[i])} ≈ [[${i}]] €`)).join('') + eqLine('Insgesamt ungefähr: [[3]] €', 'sum'),
    fields: [...rr.map(x => F(x)), F(tot)],
    hint: L === 2 ? 'Cent ab 50 → aufrunden. Dann addiere die gerundeten Preise.'
      : 'Schau auf die Einer-Stelle: 5 oder mehr → aufrunden, sonst abrunden. Dann addiere.',
    explain: ps.map((p, i) => `${E(p)} ≈ ${rr[i]} €`).join('; ') + `; zusammen ≈ ${tot} €`
  };
}

const OFFERS = [
  { n: 'Brötchen', s: 32, k: 10, p: 295 }, { n: 'Donuts', s: 145, k: 5, p: 600 }, { n: 'Muffins', s: 170, k: 5, p: 750 },
  { n: 'Hefte', s: 60, k: 10, p: 549 }, { n: 'Bleistifte', s: 35, k: 5, p: 150 }, { n: 'Klebestifte', s: 145, k: 3, p: 399 },
  { n: 'Radiergummis', s: 90, k: 5, p: 399 }, { n: 'Äpfel', s: 50, k: 6, p: 250 }, { n: 'Stücke Käsekuchen', s: 240, k: 12, p: 2500 },
  { n: 'Stücke Erdbeertorte', s: 290, k: 12, p: 3000 }
];
function g_angebot(L) {
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

function g_sach(L) {
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
  if (L === 1) opts = shuffle(others.filter(i => Math.abs(i - idx) >= 2)).slice(0, 3);
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

function g_ticket(L) {
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
   MODULE REGISTRY
   ===================================================================== */
const MODULES = [
  {
    id: 'A4', title: 'Division', sub: 'Durch Zehnerzahlen teilen', icon: '➗', topics: [
      { id: 'umkehr', t: 'Umkehraufgaben', d: '3 · 40 = 120 → 120 : 40 = 3', icon: '🔁', gen: g_umkehr },
      { id: 'kleine', t: 'Kleine Geteiltaufgabe', d: '150 : 50 → 15 : 5', icon: '🧩', gen: g_kleine },
      { id: 'divtens', t: 'Durch Zehner teilen', d: 'Schnell rechnen: 240 : 80', icon: '⚡', gen: g_divtens },
      { id: 'geteilt', t: 'Geteilttabellen', d: 'Tabellen ausfüllen', icon: '📊', gen: g_geteilt },
      { id: 'paeck', t: 'Schöne Päckchen', d: 'Muster entdecken', icon: '🎁', gen: g_paeckchen },
      { id: 'vergl', t: 'Vergleichen', d: '< = >', icon: '⚖️', gen: g_vergleich },
      { id: 'kette', t: 'Rechenketten', d: 'Hüpfe im Päckchen', icon: '⛓️', gen: g_kette },
      { id: 'raetsel', t: 'Zahlenrätsel', d: 'Ich denke mir eine Zahl …', icon: '🤔', gen: g_raetsel }
    ]
  },
  {
    id: 'A5', title: 'Geld', sub: 'Rechnen mit Euro und Cent', icon: '💶', topics: [
      { id: 'schreib', t: 'Schreibweisen', d: '2 € 9 ct = 2,09 €', icon: '✍️', gen: g_schreib },
      { id: 'column', t: 'Schriftlich rechnen', d: 'Geld addieren und subtrahieren', icon: '🧮', gen: g_column },
      { id: 'ueber', t: 'Überschlagen', d: 'Runden und schätzen', icon: '🎯', gen: g_ueber },
      { id: 'angebot', t: 'Angebote', d: 'Einzeln oder im Paket?', icon: '🏷️', gen: g_angebot },
      { id: 'sach', t: 'Sachrechnen', d: 'Einkaufen, Rückgeld, Rätsel', icon: '🛒', gen: g_sach },
      { id: 'schaetz', t: 'Preise schätzen', d: 'Was kostet ungefähr …?', icon: '🔎', gen: g_schaetzen },
      { id: 'ticket', t: 'Tickets', d: 'Einzel- oder Familienticket', icon: '🎟️', gen: g_ticket }
    ]
  }
];
