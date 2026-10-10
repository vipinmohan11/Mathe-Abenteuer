/* =====================================================================
   KAPITEL B (Weihnachtsferien) – 6 Hefte nach dem Arbeitsheft „B-Heft Mathe Klasse 4“ (Seiten 5–46)
     B1 Bis zur Million             (S. 5–14)   Bündeln, Zahlen bauen, Stellentafel, Zahlwörter, Vergleichen, Ziffernkarten, Plättchen
     B2 Vorgänger und Nachfolger    (S. 15–24)  Zahlenstrahl, Nachbarzahlen, Nachbarzehner … -hunderttausender, Mitte, Schritte, Stufenzahlen
     B3 Zerlegen, vergleichen, runden (S. 25–32) Tausender + Einer, Teilen, Zahlenhäuser, Bundesländer, Runden, mit gerundeten Zahlen rechnen
     B4 Gewichte vergleichen        (S. 33–37)  schwerer/leichter, Waagen, Messgrenzen, Einkauf überschlagen, kg oder t
     B5 Gewichte umwandeln          (S. 38–41)  Beispiele, g ↔ kg, ordnen, gleiche Angaben, Stellentafel, kg ↔ t, vergleichen, LKW
     B6 Mit Gewichten rechnen       (S. 42–45)  Einkaufskorb, ergänzen, Gesamtgewicht/Leergewicht/Nutzlast, Personen, Säcke, Papier, Fett
   Aufgaben zum Malen, Ausschneiden, Wiegen zu Hause oder Partnerdiktat sind als App-Aufgaben umgesetzt (z. B. „Welche Waage passt?“).
   Fehler im Arbeitsheft (z. B. S. 29 „17 845 000 ≈ … = 4 Mio.“, S. 42 „= 250 t“) sind hier richtig.
   Läuft nach gen.js (nutzt ri, pick, shuffle, F, FS, eqLine) und hängt die Hefte vor dem Extra-Training in MODULES ein.
   Neu: Feld-Option dec:true (Kommazahl, z. B. 4,25 kg = 4,250 kg; geprüft in fieldOK, store.js).
   ===================================================================== */

/* ---------- Bausteine ---------- */
const nf = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');          // 245 789 (schmales Leerzeichen, wie im Heft)
const FD = (a, o) => F(String(a).replace('.', ','), Object.assign({ dec: true }, o || {}));   // Kommazahl-Antwort
const decS = (x, d) => { let s = x.toFixed(d === undefined ? 3 : d); if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, ''); return s.replace('.', ','); };   // 4.25 → "4,25"
const sym = c => '<=>'[c];
const cmpIdx = (a, b) => a < b ? 0 : a === b ? 1 : 2;
/* Auswahl-Aufgabe: richtige Antwort + Ablenker, gemischt; doppelte Texte werden entfernt */
function QC(title, prompt, right, wrong, hint, explain, keep) {
  const opts = keep ? [right, ...wrong] : shuffle([right, ...wrong.filter((w, i, a) => w !== right && a.indexOf(w) === i)]);
  return { title, prompt: `<div class="bq">${prompt}</div>`, choices: opts, correct: opts.indexOf(right), hint, explain };      // .bq: Kapitel-B-Layout für die Antwortknöpfe
}
const QCMP = (title, lt, lv, rt, rv, hint) => {
  const c = cmpIdx(lv, rv);
  return { title, prompt: `<div class="cmp"><span>${lt}</span><span class="qm">?</span><span>${rt}</span></div>`, choices: ['&lt;', '=', '&gt;'], correct: c, hint, explain: `${lt.replace(/<[^>]+>/g, '')} = ${nf(lv)} und ${rt.replace(/<[^>]+>/g, '')} = ${nf(rv)}, also ${nf(lv)} ${sym(c)} ${nf(rv)}.` };
};
const PL = ['M', 'HT', 'ZT', 'T', 'H', 'Z', 'E'];
const PLN = { M: 'Millionen', HT: 'Hunderttausender', ZT: 'Zehntausender', T: 'Tausender', H: 'Hunderter', Z: 'Zehner', E: 'Einer' };
const PLV = { M: 1e6, HT: 1e5, ZT: 1e4, T: 1e3, H: 100, Z: 10, E: 1 };
const digitsOf = n => { const s = String(n).padStart(7, '0'); const o = {}; PL.forEach((p, i) => o[p] = +s[i]); return o; };
const dotsH = k => k ? `<span class="stt-dots">${'●'.repeat(k)}</span>` : '';
/* Stellentafel: cells = { M: html, HT: html, ... } */
function sttHtml(cells, cols) {
  cols = cols || PL;
  return `<table class="stt"><tr>${cols.map(c => `<th class="stt-${c}">${c}</th>`).join('')}</tr><tr>${cols.map(c => `<td class="stt-${c}">${cells[c] == null ? '' : cells[c]}</td>`).join('')}</tr></table>`;
}
/* Zahlwort (bis 9 999 999), korrekt geschrieben: eins, einundzwanzig, einhunderteins, eine Million */
const NW1 = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
const NW10 = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];
const nw99 = n => n < 20 ? NW1[n] : (n % 10 ? NW1[n % 10] + 'und' : '') + NW10[Math.floor(n / 10)];
const nw999 = n => (Math.floor(n / 100) ? NW1[Math.floor(n / 100)] + 'hundert' : '') + nw99(n % 100);
function numWord(n) {
  if (n === 0) return 'null';
  const m = Math.floor(n / 1e6), t = Math.floor(n / 1000) % 1000, r = n % 1000;
  let s = '';
  if (m) s += (m === 1 ? 'eine Million' : nw999(m) + ' Millionen') + (t || r ? ' ' : '');
  if (t) s += nw999(t).replace(/hundert(?=.)/, 'hundert<wbr>') + '<b>tausend</b><wbr>';            // <wbr>: lange Wörter dürfen dort umbrechen
  if (r) s += nw999(r).replace(/hundert(?=.)/, 'hundert<wbr>') + (r % 100 === 1 ? 's' : '');
  return s;
}
/* Zahlenstrahl als SVG: von a bis b, n Abschnitte, Pfeil bei Index k (Beschriftung nur an den Enden und optional in der Mitte) */
function strahlSvg(a, b, n, marks, labels) {
  const W = 600, x0 = 30, x1 = 570, X = i => x0 + (x1 - x0) * i / n;
  let h = `<line x1="${x0}" y1="60" x2="${x1}" y2="60" class="zs-l"/>`;
  for (let i = 0; i <= n; i++) { const big = i === 0 || i === n || (n % 2 === 0 && i === n / 2); h += `<line x1="${X(i)}" y1="${big ? 46 : 52}" x2="${X(i)}" y2="${big ? 74 : 68}" class="zs-t${big ? ' big' : ''}"/>`; }
  (labels || [[0, a], [n, b]]).forEach(([i, v]) => { h += `<text x="${X(i)}" y="98" text-anchor="middle" class="zs-n">${nf(v)}</text>`; });
  marks.forEach(([i, txt]) => { h += `<path d="M${X(i)} 40 l-7 -12 h14 Z" class="zs-a"/>${txt ? `<text x="${X(i)}" y="20" text-anchor="middle" class="zs-q">${txt}</text>` : ''}`; });
  return `<svg class="zs" viewBox="0 0 ${W} 108" role="img" aria-label="Zahlenstrahl von ${nf(a)} bis ${nf(b)}">${h}</svg>`;
}

/* =====================================================================
   B1  BIS ZUR MILLION
   ===================================================================== */
const BUND = [['E', 'Z'], ['Z', 'H'], ['H', 'T'], ['T', 'ZT'], ['ZT', 'HT'], ['HT', 'M']];
function g_b_buendeln(L) {
  if (L <= 2) {
    const [lo, hi] = pick(L === 1 ? BUND.slice(0, 3) : BUND);
    return Math.random() < .5
      ? { title: 'Bündeln: Wie viele sind es?', html: eqLine(`10 ${lo} = [[0]] ${hi}`), fields: [F(1)], hint: `Zehn ${PLN[lo]} werden zu einem ${PLN[hi].replace(/n$/, '')}.`, explain: `10 ${lo} = 1 ${hi} (${nf(10 * PLV[lo])} = ${nf(PLV[hi])})` }
      : { title: 'Entbündeln: Wie viele sind es?', html: eqLine(`1 ${hi} = [[0]] ${lo}`), fields: [F(10)], hint: `Ein ${PLN[hi].replace(/n$/, '')} hat zehn ${PLN[lo]}.`, explain: `1 ${hi} = 10 ${lo}` };
  }
  if (L === 3 || L === 4) {                                   // 14 Hunderter = 1 T + 4 H = 1 400  (S. 7)
    const [lo, hi] = pick(L === 3 ? [['H', 'T'], ['Z', 'H']] : [['T', 'ZT'], ['ZT', 'HT'], ['H', 'T']]);
    const k = ri(11, 39), v = k * PLV[lo];
    return { title: 'Bündle und schreibe die Zahl.', html: eqLine(`${k} ${lo} = [[0]] ${hi} + [[1]] ${lo}`) + eqLine(`${k} ${lo} = [[2]]`),
      fields: [F(Math.floor(k / 10)), F(k % 10), F(v)], hint: `Immer 10 ${PLN[lo]} sind 1 ${PLN[hi].replace(/n$/, '')}. ${k} ${lo} sind ${Math.floor(k / 10)} ${hi} und ${k % 10} ${lo}.`,
      explain: `${k} ${lo} = ${Math.floor(k / 10)} ${hi} + ${k % 10} ${lo} = ${nf(v)}` };
  }
  const [big, small] = pick([['M', 'T'], ['M', 'H'], ['HT', 'H'], ['M', 'ZT'], ['HT', 'T'], ['ZT', 'Z']]), r = PLV[big] / PLV[small];
  return { title: 'Wie viele passen hinein?', html: eqLine(`1 ${big} = [[0]] ${small}`), fields: [F(r)], hint: `Gehe Stelle für Stelle: jedes Mal sind es zehnmal so viele.`, explain: `1 ${big} = ${nf(PLV[big])} = ${nf(r)} · ${nf(PLV[small])}, also ${nf(r)} ${small}` };
}
function g_b_bauen(L) {
  if (L >= 5) {                                               // Achte auf die Zerlegungen: 17 E + 3 T + 7 H + 2 ZT  (S. 12)
    const parts = shuffle([['E', ri(10, 19)], ['T', ri(1, 9)], ['H', ri(1, 24)], ['ZT', ri(1, 9)], ...(Math.random() < .5 ? [['Z', ri(10, 35)]] : [])]);
    const v = parts.reduce((s, [p, k]) => s + k * PLV[p], 0);
    return { title: 'Wie heißt die Zahl? Achte auf die Zerlegungen.', html: eqLine(parts.map(([p, k]) => `${k} ${p}`).join(' + ') + ' = [[0]]'), fields: [F(v)],
      hint: 'Rechne jeden Teil in eine Zahl um (z. B. 17 E = 17, 13 Z = 130) und addiere alles.', explain: parts.map(([p, k]) => nf(k * PLV[p])).join(' + ') + ' = ' + nf(v) };
  }
  const places = L === 1 ? ['T', 'H'] : L === 2 ? ['T', 'H', 'Z', 'E'] : L === 3 ? ['ZT', 'T', 'H', 'Z', 'E'] : ['HT', 'ZT', 'T', 'H', 'Z', 'E'];
  let parts = places.map(p => [p, ri(p === places[0] ? 1 : 0, 9)]).filter(([, k], i) => k || i === 0);
  if (L >= 3) parts = shuffle(parts);
  const v = parts.reduce((s, [p, k]) => s + k * PLV[p], 0);
  return { title: 'Wie heißt die Zahl?', html: eqLine(parts.map(([p, k]) => `${k} ${p}`).join(' + ') + ' = [[0]]'), fields: [F(v)],
    hint: 'Schreibe jede Stelle in die Stellentafel. Leere Stellen bekommen eine 0.', explain: parts.map(([p, k]) => nf(k * PLV[p])).join(' + ') + ' = ' + nf(v) };
}
function g_b_tafel(L) {
  const lo = [0, 1000, 10000, 100000, 100000, 1000000][L], hi = [0, 9999, 99999, 999999, 999999, 9999999][L];
  let n; do { n = ri(lo, hi); } while (L === 4 && !/0/.test(String(n).slice(1)));
  const d = digitsOf(n), cols = PL.slice(7 - Math.max(4, String(n).length));
  if (L >= 3 && Math.random() < .35) {                          // Welche Ziffer steht an der …-Stelle?
    const p = pick(cols.filter(c => c !== cols[0] || true));
    return { title: 'Welche Ziffer steht an dieser Stelle?', html: eqLine(nf(n)) + eqLine(`${PLN[p]} (${p}): [[0]]`), fields: [F(d[p], { digit: true })],
      hint: 'Lies von rechts: E, Z, H, T, ZT, HT, M.', explain: `In ${nf(n)} steht an der ${p}-Stelle die ${d[p]}.` };
  }
  const cells = {}; cols.forEach(c => cells[c] = dotsH(d[c]));
  return { title: 'Schreibe die Zahl mit Ziffern.', html: sttHtml(cells, cols) + eqLine('Zahl: [[0]]'), fields: [F(n)],
    hint: 'Zähle die Plättchen in jeder Spalte. Eine leere Spalte ist eine 0.', explain: cols.map(c => `${d[c]} ${c}`).join(', ') + ' → ' + nf(n) };
}
function g_b_zerleg(L) {
  const len = L <= 2 ? 5 : L <= 4 ? 6 : 7, n = ri(Math.pow(10, len - 1), Math.pow(10, len) - 1);
  const parts = String(n).split('').map((c, i) => +c * Math.pow(10, len - 1 - i)).filter(Boolean);
  if (L === 3 || (L === 4 && Math.random() < .5)) return { title: 'Zerlege die Zahl in Stellenwerte (vom größten zum kleinsten).', html: eqLine(`${nf(n)} = ` + parts.map((_, i) => `[[${i}]]`).join(' + ')), fields: parts.map(x => F(x)),
    hint: 'Schreibe für jede Ziffer (außer 0) ihren Wert: z. B. 4 an der ZT-Stelle = 40 000.', explain: `${nf(n)} = ${parts.map(nf).join(' + ')}` };
  const shown = L >= 2 ? shuffle(parts) : parts;
  return { title: 'Rechne und schreibe die Zahl.', html: eqLine(shown.map(nf).join(' + ') + ' = [[0]]'), fields: [F(n)],
    hint: 'Ordne nach der Größe und trage jeden Teil in die Stellentafel ein.', explain: `${shown.map(nf).join(' + ')} = ${nf(n)}` };
}
function g_b_woerter(L) {
  let n;
  if (L <= 2) n = ri(L === 1 ? 1000 : 10000, L === 1 ? 9999 : 99999);
  else if (L === 3) n = ri(100000, 999999);
  else if (L === 4) { do { n = ri(100000, 999999); } while (!/0/.test(String(n).slice(1))); }
  else n = Math.random() < .5 ? ri(1, 9) * 1e6 + ri(0, 999) * 1000 : ri(1000000, 9999999);
  if (L >= 3 && Math.random() < .35) {                          // Wort wählen
    const s = String(n), wrong = [];
    const swap = () => { const a = s.split(''); let i, j, g = 0; do { i = ri(0, a.length - 1); j = ri(0, a.length - 1); g++; } while ((a[i] === a[j] || (i === 0 && a[j] === '0') || (j === 0 && a[i] === '0')) && g < 40); [a[i], a[j]] = [a[j], a[i]]; return +a.join(''); };
    let g = 0; while (wrong.length < 2 && g++ < 50) { const w = swap(); if (w !== n && !wrong.includes(w) && String(w).length === s.length) wrong.push(w); }
    while (wrong.length < 2) wrong.push(n + (wrong.length + 1) * 1000);
    return QC('Welches Zahlwort passt?', `<div class="eq big nwq">${nf(n)}</div>`, numWord(n), wrong.map(numWord), 'Lies die Zahl in Dreiergruppen: erst die Tausender, dann der Rest.', `${nf(n)} = ${numWord(n).replace(/<[^>]+>/g, '')}`);
  }
  return { title: 'Lies und schreibe die Zahl mit Ziffern.', html: `<div class="story nw">${numWord(n)}</div>` + eqLine('[[0]]'), fields: [F(n)],
    hint: 'Alles vor „tausend“ sind die Tausender. Fehlt eine Stelle, schreibe eine 0.', explain: `${numWord(n).replace(/<[^>]+>/g, '')} = ${nf(n)}` };
}
function g_b_vergl(L) {
  const T = '< oder >? Vergleiche.';
  if (L <= 2) {
    const len = L === 1 ? 5 : 6, a = ri(Math.pow(10, len - 1), Math.pow(10, len) - 1);
    let b; if (Math.random() < .5) { const s = String(a).split(''); const i = ri(1, len - 1); s[i] = String((+s[i] + ri(1, 9)) % 10); b = +s.join(''); } else b = ri(Math.pow(10, len - 2), Math.pow(10, len) - 1);
    if (b === a) b = a + 1;
    return QCMP(T, nf(a), a, nf(b), b, 'Vergleiche zuerst die Anzahl der Stellen, dann von links Stelle für Stelle.');
  }
  const R = pick([100000, 200000, 500000, 1000000, 10000, 100000, 900000]);
  const k = pick([1, 2, 10, 100, 1000, 2000, 5000, 10000, 100000]), op = L === 3 ? '+' : pick(['+', '−']);
  const off = pick([-1, 0, 1, -k, k, 0]);
  const a = op === '+' ? R - k + off : R + k + off;
  if (a <= 0) return g_b_vergl(2);
  const lv = op === '+' ? a + k : a - k;
  return QCMP(T, `${nf(a)} ${op} ${nf(k)}`, lv, nf(R), R, 'Rechne zuerst die linke Seite aus. Achte auf Überträge.');
}
function g_b_karten(L) {
  const n = L <= 2 ? 5 : 6, withZero = L >= 4;
  let ds; do { ds = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(x => withZero || x)).slice(0, n); } while (withZero && !ds.includes(0) && Math.random() < .7);
  const desc = ds.slice().sort((a, b) => b - a), asc = ds.slice().sort((a, b) => a - b);
  if (asc[0] === 0) { const i = asc.findIndex(x => x); asc.splice(0, 0, asc.splice(i, 1)[0]); }
  const max = +desc.join(''), min = +asc.join(''), wantMax = L === 5 ? Math.random() < .3 : Math.random() < .5;
  const cards = ds.map(x => `<span class="card-d">${x}</span>`).join('');
  if (L === 5 && !wantMax && Math.random() < .5) return { title: `Lege mit den Karten die größte und die kleinste ${n}-stellige Zahl.`, html: `<div class="cards-row">${cards}</div>` + eqLine('größte: [[0]]') + eqLine('kleinste: [[1]]') + eqLine(`Unterschied: [[2]]`), fields: [F(max), F(min), F(max - min)],
    hint: 'Größte: große Ziffern nach vorne. Kleinste: kleine Ziffern nach vorne, aber nie die 0 an den Anfang.', explain: `${nf(max)} − ${nf(min)} = ${nf(max - min)}` };
  return { title: `Lege mit den Ziffernkarten die ${wantMax ? 'größte' : 'kleinste'} ${n}-stellige Zahl.`, html: `<div class="cards-row">${cards}</div>` + eqLine('[[0]]'), fields: [F(wantMax ? max : min)],
    hint: wantMax ? 'Die größte Ziffer kommt ganz nach vorne, dann die nächstgrößte …' : 'Die kleinste Ziffer kommt nach vorne – aber eine Zahl darf nicht mit 0 anfangen.', explain: `${wantMax ? 'größte' : 'kleinste'} Zahl: ${nf(wantMax ? max : min)}` };
}
function g_b_plaett(L) {
  let n, d; do { n = ri(100000, 999999); d = digitsOf(n); } while (!PL.slice(1).some(p => d[p]));
  const avail = PL.slice(1).filter(p => d[p] > 0);
  if (L <= 3) {                                                 // ein Plättchen wegnehmen
    const p = pick(avail), v = n - PLV[p];
    return { title: 'Ein Plättchen wird weggenommen. Welche Zahl entsteht?', html: sttHtml(Object.fromEntries(PL.slice(1).map(c => [c, dotsH(d[c])])), PL.slice(1)) + `<div class="story">Anna nimmt ein Plättchen aus der Spalte <b>${p}</b> weg.</div>` + eqLine('Neue Zahl: [[0]]'),
      fields: [F(v)], hint: `Ein Plättchen bei ${p} weniger heißt: ${nf(PLV[p])} weniger.`, explain: `${nf(n)} − ${nf(PLV[p])} = ${nf(v)}` };
  }
  let from, to, g = 0; do { from = pick(avail); to = pick(PL.slice(1)); g++; } while ((from === to || d[to] >= 9) && g < 50);
  const v = n - PLV[from] + PLV[to];
  return { title: 'Ein Plättchen wird verschoben. Welche Zahl entsteht?', html: eqLine(nf(n)) + `<div class="story">Neele verschiebt ein Plättchen von <b>${from}</b> nach <b>${to}</b>.</div>` + eqLine('Neue Zahl: [[0]]'),
    fields: [F(v)], hint: `Bei ${from} wird es eins weniger, bei ${to} eins mehr.`, explain: `${nf(n)} − ${nf(PLV[from])} + ${nf(PLV[to])} = ${nf(v)}` };
}

/* =====================================================================
   B2  VORGÄNGER UND NACHFOLGER
   ===================================================================== */
function g_b_strahl(L) {
  const cfg = [null, [0, 1000, 10], [0, 10000, 10], [ri(1, 8) * 10000, null, 10], [ri(1, 8) * 100000, null, 20], [ri(10, 98) * 10000, null, 20]][L];
  const span = L === 3 ? 10000 : L === 4 ? 100000 : L === 5 ? 20000 : cfg[1] - cfg[0], a = cfg[0], b = a + span, n = cfg[2], step = span / n;
  const k = ri(1, n - 1), v = a + k * step;
  const lab = n === 20 ? [[0, a], [10, a + span / 2], [20, b]] : [[0, a], [n, b]];
  return { title: 'Welche Zahl zeigt der Pfeil?', html: strahlSvg(a, b, n, [[k, '?']], lab) + eqLine('[[0]]'), fields: [F(v)],
    hint: `Von Strich zu Strich sind es ${nf(step)}. Zähle vom Anfang (${nf(a)}) aus.`, explain: `${nf(a)} + ${k} · ${nf(step)} = ${nf(v)}` };
}
function g_b_nachbar(L) {
  if (L === 5 && Math.random() < .6) {
    const n = pick([ri(1, 99) * 10000, ri(1, 9) * 100000, ri(100, 999) * 1000, ri(100000, 999999)]);
    return { title: 'Kilometerzähler', html: `<div class="story">Der Kilometerzähler eines Autos springt gerade auf <b>${nf(n)}</b>.</div>` + eqLine('direkt davor: [[0]]') + eqLine('direkt danach: [[1]]'),
      fields: [F(n - 1), F(n + 1)], hint: 'Davor = 1 weniger (Vorgänger). Danach = 1 mehr (Nachfolger).', explain: `${nf(n - 1)} | ${nf(n)} | ${nf(n + 1)}` };
  }
  let n = L === 1 ? ri(100, 999) : L === 2 ? ri(1000, 99999) : ri(100000, 999999);
  if (L >= 4) n = pick([ri(10, 99) * 10000, ri(100, 999) * 1000, ri(1000, 9999) * 100, ri(10000, 99999) * 10]);   // glatte Zahlen: Vorgänger mit vielen 9ern
  return { title: 'Finde Vorgänger (V) und Nachfolger (N).', html: `<div class="vzn"><span>V</span><span>Zahl</span><span>N</span><b>[[0]]</b><b>${nf(n)}</b><b>[[1]]</b></div>`,
    fields: [F(n - 1), F(n + 1)], hint: 'Vorgänger = Zahl − 1, Nachfolger = Zahl + 1.', explain: `${nf(n)} − 1 = ${nf(n - 1)} und ${nf(n)} + 1 = ${nf(n + 1)}` };
}
function nbTask(n, u, sV, sN, title) {
  const v = Math.floor(n / u) * u, w = v + u;
  return { title, html: `<div class="vzn"><span>${sV}</span><span>Zahl</span><span>${sN}</span><b>[[0]]</b><b>${nf(n)}</b><b>[[1]]</b></div>`, fields: [F(v), F(w)],
    hint: `Gehe zurück zur nächsten ${nf(u)}er-Zahl und vorwärts zur nächsten ${nf(u)}er-Zahl.`, explain: `${nf(v)} < ${nf(n)} < ${nf(w)}` };
}
function g_b_nzehn(L) {
  const u = L <= 2 ? 10 : L === 3 ? 100 : pick([10, 100]);
  let n; do { n = L === 1 ? ri(100, 9999) : ri(10000, 999999); } while (n % u === 0);
  return u === 10 ? nbTask(n, 10, 'VZ', 'NZ', 'Finde die Nachbarzehner.') : nbTask(n, 100, 'VH', 'NH', 'Finde die Nachbarhunderter.');
}
function g_b_ntaus(L) {
  const u = L <= 2 ? 1000 : L === 3 ? 10000 : L === 4 ? 100000 : pick([1000, 10000, 100000]);
  let n; do { n = ri(u + 1, 999999); } while (n % u === 0);
  const s = { 1000: ['VT', 'NT', 'Nachbartausender'], 10000: ['VZT', 'NZT', 'Nachbarzehntausender'], 100000: ['VHT', 'NHT', 'Nachbarhunderttausender'] }[u];
  return nbTask(n, u, s[0], s[1], `Finde die ${s[2]}.`);
}
function g_b_mitte(L) {
  const u = [0, 10000, 1000, 10000, 10000, 10000][L], a = ri(1, L <= 2 ? 9 : 60) * u * (L === 2 ? 10 : 1);
  let b; do { b = a + ri(1, L <= 2 ? 4 : 20) * 2 * u; } while (b > 990000);
  const m = (a + b) / 2;
  return { title: 'Welche Zahl liegt genau in der Mitte?', html: strahlSvg(a, b, 2, [[1, '?']], [[0, a], [2, b]]) + eqLine('Mitte: [[0]]'), fields: [F(m)],
    hint: `Rechne den Abstand: ${nf(b)} − ${nf(a)} = ${nf(b - a)}. Die Hälfte davon kommt zu ${nf(a)} dazu.`, explain: `${nf(a)} + ${nf((b - a) / 2)} = ${nf(m)}` };
}
function g_b_schritte(L) {
  const st = [0, 1000, 10000, pick([10, 100]), pick([1, 10, 100, 1000]), 100000][L], back = L >= 3 && (L === 5 || Math.random() < .6);
  let a; do { a = ri(back ? 300000 : 100000, back ? 1200000 : 900000); } while (back && a - 4 * st < 0);
  const seq = [0, 1, 2, 3, 4].map(i => a + (back ? -i : i) * st);
  return { title: `Zähle ${back ? 'rückwärts' : 'vorwärts'} in ${nf(st)}er-Schritten.`, html: eqLine(`${nf(seq[0])}, ${nf(seq[1])}, [[0]], [[1]], [[2]]`), fields: seq.slice(2).map(F),
    hint: `Jede Zahl ist um ${nf(st)} ${back ? 'kleiner' : 'größer'} als die davor.`, explain: seq.map(nf).join(', ') };
}
function g_b_stufen(L) {
  const down = L >= 4, steps = L <= 2 ? [1, 10, 100, 1000] : [1, 10, 100, 1000, 10000, 100000];
  let a; if (down) { do { a = ri(111111, 999999); } while (L === 5 ? !/0/.test(String(a)) : /0/.test(String(a))); } else a = ri(L <= 2 ? 1 : 1, L <= 2 ? 8888 : 99999);
  const ops = down ? steps.slice().reverse() : steps;
  let v = a; const vals = ops.map(s => (v = down ? v - s : v + s));
  return { title: `${down ? 'Subtrahiere' : 'Addiere'} die Stufenzahlen.`, html: `<div class="chainv">${eqLine(nf(a))}${ops.map((s, i) => eqLine(`${down ? '−' : '+'} ${nf(s)} → [[${i}]]`)).join('')}</div>`, fields: vals.map(F),
    hint: down ? 'Bei jeder Stufe wird nur eine Stelle um 1 kleiner. Steht dort eine 0, musst du entbündeln.' : 'Bei jeder Stufe wird eine Stelle um 1 größer. Wird eine Stelle 10, gibt es einen Übertrag.', explain: [a, ...vals].map(nf).join(' → ') };
}

/* =====================================================================
   B3  ZERLEGEN, VERGLEICHEN, RUNDEN
   ===================================================================== */
function g_b_tue(L) {
  let n; const r = [null, [1000, 9999], [10000, 99999], [10000, 99999], [100000, 999999], [100000, 999999]][L];
  do { n = ri(r[0], r[1]); } while ((L === 3 || L === 5) && !/0/.test(String(n % 1000).padStart(3, '0')));
  const t = Math.floor(n / 1000), e = n % 1000;
  if (L === 5 && Math.random() < .4) return { title: 'Wie heißt die Zahl?', html: eqLine(`${t} T + ${e} E = [[0]]`), fields: [F(n)], hint: `${t} T = ${nf(t * 1000)}. Dann kommen noch ${e} Einer dazu.`, explain: `${nf(t * 1000)} + ${e} = ${nf(n)}` };
  return { title: 'Zerlege in Tausender und Einer.', html: eqLine(`${nf(n)} = [[0]] T + [[1]] E`) + eqLine(`${nf(n)} = [[2]] + [[3]]`), fields: [F(t), F(e), F(t * 1000), F(e)],
    hint: 'Alles links von den letzten drei Ziffern sind die Tausender. Die letzten drei Ziffern sind die Einer.', explain: `${nf(n)} = ${t} T + ${e} E = ${nf(t * 1000)} + ${e}` };
}
function g_b_teilen(L) {
  const base = L <= 2 ? pick([1000, 10000]) : L === 3 ? pick([1000, 10000, 100000, 1000000]) : pick([100000, 1000000]), nm = { 1000: 'den Tausender', 10000: 'den Zehntausender', 100000: 'den Hunderttausender', 1000000: 'die Million' }[base];
  if (Math.random() < .3) {
    const qs = [['Hunderter', 'ein Tausender', 10], ['Zehner', 'ein Hunderter', 10], ['Zehner', 'ein Tausender', 100], ['Einer', 'ein Tausender', 1000], ['Tausender', 'ein Zehntausender', 10], ['Hunderter', 'ein Zehntausender', 100],
      ['Hunderttausender', 'die Million', 10], ['Zehntausender', 'ein Hunderttausender', 10], ['Zehntausender', 'die Million', 100], ['Tausender', 'die Million', 1000], ['Tausender', 'ein Hunderttausender', 100], ['Hunderter', 'die Million', 10000]];
    const [w, o, k] = pick(L <= 2 ? qs.slice(0, 6) : qs);
    return { title: /Million|Hunderttausender/.test(o) ? 'Überlege am Millionenbuch.' : 'Überlege am Tausenderbuch.', html: `<div class="story">Wie viele ${w} hat ${o}?</div>` + eqLine('[[0]]'), fields: [F(k)], hint: 'Immer 10 kleine ergeben 1 großen.', explain: `${cap(o.replace('ein ', '1 '))}: ${nf(k)} ${w}` };
  }
  const k = pick([2, 4, 5, 8, 10, 20, 25, 50, 100, ...(L >= 4 ? [40, 125, 200, 250, 500, 1000] : [])]), v = base / k;
  if (!Number.isInteger(v)) return g_b_teilen(L);
  return { title: `Teile ${nm} in ${k} gleich große Teile.`, html: eqLine(`${nf(base)} : ${k} = [[0]]`), fields: [F(v)], hint: `Denke an die Malaufgabe: ${k} · ? = ${nf(base)}.`, explain: `${k} · ${nf(v)} = ${nf(base)}` };
}
function g_b_haus(L) {
  const exps = L <= 2 ? [10, 100] : L === 3 ? [100, 1000] : L === 4 ? [1000, 10000] : [10000, 100000];
  let R, fs, g = 0;
  do {
    R = pick([2, 4, 6, 8, 10, 12, 16, 20, 24, 40]) * pick(exps);
    fs = shuffle([2, 4, 5, 8, 10, 100, 1000].filter(f => R % f === 0 && R / f >= 1)).slice(0, L <= 2 ? 3 : L <= 4 ? 4 : 5).sort((a, b) => a - b);
    g++;
  } while (fs.length < 3 && g < 50);
  return { title: 'Zahlenhaus: Ergänze die Malaufgaben.', html: `<div class="zhaus"><div class="zh-roof">${nf(R)}</div>${fs.map((f, i) => `<div class="zh-row">${f} · [[${i}]]</div>`).join('')}</div>`, fields: fs.map(f => F(R / f)),
    hint: `Frage dich: ${fs[0]} mal wie viel ist ${nf(R)}?`, explain: fs.map(f => `${f} · ${nf(R / f)} = ${nf(R)}`).join(' · ') };
}
/* Einwohner der Bundesländer (Stand 2011, auf Tausender gerundet – Arbeitsheft S. 28) */
const BL = [['Nordrhein-Westfalen', 17845000], ['Bayern', 12539000], ['Baden-Württemberg', 10754000], ['Niedersachsen', 7918000], ['Hessen', 6067000], ['Sachsen', 4149000], ['Rheinland-Pfalz', 4004000], ['Berlin', 3490000],
  ['Schleswig-Holstein', 2834000], ['Brandenburg', 2503000], ['Sachsen-Anhalt', 2335000], ['Thüringen', 2235000], ['Hamburg', 1772000], ['Mecklenburg-Vorpommern', 1642000], ['Saarland', 1018000], ['Bremen', 661000]];
const roundTo = (n, u) => Math.floor((n + u / 2) / u) * u;
function g_b_laender(L) {
  if (L <= 2 || (L === 4 && Math.random() < .5)) {
    const k = L <= 2 ? 2 : 4, ls = shuffle(BL).slice(0, k), most = L === 4 && Math.random() < .5 ? 'wenigsten' : 'meisten';
    const best = ls.slice().sort((a, b) => most === 'meisten' ? b[1] - a[1] : a[1] - b[1])[0];
    return QC(`Welches Bundesland hat die ${most} Einwohner?`, `<ul class="bl">${ls.map(l => `<li><b>${l[0]}</b> ${nf(l[1])}</li>`).join('')}</ul>`, best[0], ls.filter(l => l !== best).map(l => l[0]),
      'Vergleiche die Millionen zuerst, dann die Hunderttausender.', `${best[0]}: ${nf(best[1])} Einwohner`);
  }
  if (L === 3 || L === 4) { const l = pick(BL), r = roundTo(l[1], 1e6) / 1e6;
    return { title: 'Runde die Einwohnerzahl auf Millionen.', html: `<div class="story"><b>${l[0]}</b>: ${nf(l[1])} Einwohner</div>` + eqLine(`${nf(l[1])} ≈ [[0]] Mio.`), fields: [F(r)],
      hint: 'Schau auf die Hunderttausenderziffer: 0–4 abrunden, 5–9 aufrunden.', explain: `${nf(l[1])} ≈ ${nf(r * 1e6)} = ${r} Mio.` }; }
  const [a, b] = shuffle(BL).slice(0, 2), ra = roundTo(a[1], 1e6) / 1e6, rb = roundTo(b[1], 1e6) / 1e6;
  return { title: 'Runde beide auf Millionen und rechne zusammen.', html: `<div class="story">${a[0]}: ${nf(a[1])}<br>${b[0]}: ${nf(b[1])}</div>` + eqLine('[[0]] Mio. + [[1]] Mio. = [[2]] Mio.'), fields: [F(ra), F(rb), F(ra + rb)],
    hint: 'Erst jede Zahl auf Millionen runden, dann addieren.', explain: `${ra} Mio. + ${rb} Mio. = ${ra + rb} Mio.` };
}
function g_b_rundM(L) {
  let n; const hiM = L <= 2 ? 9 : 25;
  do { n = ri(1, hiM) * 1e6 + ri(0, 999) * 1000; if (L >= 3 && Math.random() < .4) n = Math.floor(n / 1e6) * 1e6 + pick([499000, 500000, 450000, 550000, 999000]); } while (L <= 2 && Math.abs(n % 1e6 - 500000) < 100000);
  const r = roundTo(n, 1e6);
  return { title: 'Runde auf Millionen.', html: eqLine(`${nf(n)} ≈ [[0]] Mio.`), fields: [F(r / 1e6)],
    hint: 'Hunderttausenderziffer 0, 1, 2, 3, 4: abrunden. 5, 6, 7, 8, 9: aufrunden.', explain: `${nf(n)} ≈ ${nf(r)} = ${r / 1e6} Mio.` };
}
/* Mitglieder der Sportverbände (Stand 2011, Arbeitsheft S. 30) */
const SPORT = { dfb: ['Fußball', [1395083, 530835, 3764880, 1058990]], dlv: ['Leichtathletik', { j14: 131642, m14: 149380, j18: 38109, m18: 43310, j99: 263300, m99: 246909 }], dtb: ['Turnen', { j14: 55967, m14: 83324, j18: 9580, m18: 16793, j99: 93949, m99: 187223 }] };
const SP_G = { j14: 'Jungen bis 14 Jahre', m14: 'Mädchen bis 14 Jahre', j18: 'Jungen 15–18 Jahre', m18: 'Mädchen 15–18 Jahre', j99: 'Männer über 18', m99: 'Frauen über 18' };
const sportNums = () => [...SPORT.dfb[1], ...Object.values(SPORT.dlv[1]), ...Object.values(SPORT.dtb[1])];
function g_b_rundT(L) {
  let n;
  if (L <= 2 && Math.random() < .6) n = pick(sportNums());
  else do { n = ri(L <= 2 ? 1000 : 10000, L >= 4 ? 9999999 : 999999); if (L >= 4 && Math.random() < .4) n = Math.floor(n / 1000) * 1000 + pick([499, 500, 999, 501]); } while (L <= 2 && n < 1000);
  const r = roundTo(n, 1000);
  return { title: 'Runde auf glatte Tausender.', html: eqLine(`${nf(n)} ≈ [[0]]`), fields: [F(r)], hint: 'Schau auf die Hunderterziffer: 0–4 abrunden, 5–9 aufrunden.', explain: `Hunderterziffer ${Math.floor(n / 100) % 10} → ${nf(r)}` };
}
const SP_ALL = [['Fußball, Junioren bis 14', 1395083], ['Fußball, Junioren 15–18', 530835], ['Fußball, Senioren über 18', 3764880], ['Fußball, Frauen und Mädchen', 1058990],
  ...Object.entries(SP_G).map(([k, g]) => ['Leichtathletik, ' + g, SPORT.dlv[1][k]]), ...Object.entries(SP_G).map(([k, g]) => ['Turnen, ' + g, SPORT.dtb[1][k]])];
function g_b_mitrund(L) {
  let a, b, la, lb, op, q;
  if (L <= 4) {
    const pool = L <= 2 ? SP_ALL.filter(x => x[1] < 1000000) : SP_ALL;
    [[la, a], [lb, b]] = shuffle(pool).slice(0, 2);
    op = L <= 2 ? '+' : pick(['+', '−']);
    if (op === '−' && roundTo(a, 1000) < roundTo(b, 1000)) [[la, a], [lb, b]] = [[lb, b], [la, a]];
    if (op === '−' && roundTo(a, 1000) === roundTo(b, 1000)) op = '+';
    q = op === '+' ? 'Wie viele Mitglieder sind das zusammen?' : 'Wie viele Mitglieder sind es in der ersten Gruppe mehr?';
  } else { a = ri(100000, 999999); b = ri(10000, a - 1000); op = pick(['+', '−']); q = 'Runde beide Zahlen auf Tausender und rechne.'; la = 'Zahl 1'; lb = 'Zahl 2'; }
  const ra = roundTo(a, 1000), rb = roundTo(b, 1000), res = op === '+' ? ra + rb : ra - rb;
  return { title: 'Rechne mit gerundeten Zahlen.', html: `<div class="story">${q}<br>${la}: ${nf(a)}<br>${lb}: ${nf(b)}</div>` + eqLine(`[[0]] ${op} [[1]] = [[2]]`), fields: [F(ra), F(rb), F(res)],
    hint: 'Runde zuerst beide Zahlen auf Tausender. Dann rechne wie mit kleinen Zahlen: 132 + 56.', explain: `${nf(a)} ≈ ${nf(ra)}, ${nf(b)} ≈ ${nf(rb)} → ${nf(ra)} ${op} ${nf(rb)} = ${nf(res)}` };
}

/* =====================================================================
   B4  GEWICHTE VERGLEICHEN UND WIEGEN
   ===================================================================== */
/* typische Gewichte (Gramm) für Vergleiche */
const OBJ = [['der Bleistift', 5], ['die Büroklammer', 1], ['der Radiergummi', 20], ['das Lineal', 30], ['die Schere', 60], ['der Joghurtbecher', 150], ['der Apfel', 200], ['das dicke Buch', 800], ['die Tüte Milch', 1000],
  ['die Wassermelone', 5000], ['der Schulranzen', 4000], ['das Fahrrad', 12000], ['der Hund', 20000], ['das Kind', 35000], ['der Feuerlöscher', 9000], ['das Ei', 60], ['das Handy', 180], ['der Fußball', 430]];
const art = s => s.replace(/^(der|die|das|ein|eine|einen) /, '');
const cap = s => s[0].toUpperCase() + s.slice(1);
const gTxt = g => g >= 1000 ? decS(g / 1000) + ' kg' : g + ' g';
function g_b_schwerer(L) {
  if (L >= 5) {                                                 // Einkaufstüte: was gehört nach unten? (S. 33)
    const items = shuffle([['die Wassermelone', 5000], ['die Kartoffeln', 2500], ['die Milch', 1000], ['die Eier', 400], ['der Joghurtbecher', 150], ['das Brot', 750], ['die Chips', 175], ['die Saftflasche', 1500]]).slice(0, 4);
    const best = items.slice().sort((a, b) => b[1] - a[1])[0];
    return QC('Was packst du ganz nach unten in die Einkaufstüte?', `<div class="story">Im Einkaufskorb: ${items.map(i => art(i[0])).join(', ')}.<br>Schweres kommt nach unten, sonst geht Leichtes kaputt – wie der Joghurtbecher.</div>`, cap(best[0]), items.filter(i => i !== best).map(i => cap(i[0])),
      'Was ist am schwersten?', `${cap(best[0])} ist am schwersten (etwa ${gTxt(best[1])}).`);
  }
  let a, b, g = 0; do { [a, b] = shuffle(OBJ).slice(0, 2); g++; } while ((L <= 2 ? Math.max(a[1], b[1]) / Math.min(a[1], b[1]) < 4 : Math.max(a[1], b[1]) / Math.min(a[1], b[1]) < 1.5) && g < 100);
  if (L >= 3) {
    const heavier = Math.random() < .5, truth = heavier ? a[1] > b[1] : a[1] < b[1];
    return QC('Stimmt die Aussage?', `<div class="story">${cap(a[0])} ist ${heavier ? 'schwerer' : 'leichter'} als ${b[0]}.</div>`, truth ? 'richtig' : 'falsch', [truth ? 'falsch' : 'richtig'], 'Stell dir vor, du hältst beides in den Händen.',
      `${cap(art(a[0]))}: etwa ${gTxt(a[1])}, ${art(b[0])}: etwa ${gTxt(b[1])}.`, true);
  }
  const w = a[1] > b[1] ? a : b, o = w === a ? b : a;
  return QC('Was ist schwerer?', `<div class="story">${cap(art(a[0]))} oder ${art(b[0])}?</div>`, cap(w[0]), [cap(o[0])], 'Stell dir vor, du hältst beides in den Händen.', `${cap(w[0])} (etwa ${gTxt(w[1])}) ist schwerer als ${o[0]} (etwa ${gTxt(o[1])}).`);
}
const WAAGEN = [['Briefwaage', 'einen Brief'], ['Küchenwaage', 'Mehl für einen Kuchen'], ['Personenwaage', 'dich selbst'], ['Verkaufswaage', 'Bananen im Supermarkt'], ['Briefwaage', 'eine Postkarte'], ['Küchenwaage', 'Butter zum Backen'], ['Personenwaage', 'deinen Papa'],
  ['Küchenwaage', 'Zucker für Plätzchen'], ['Verkaufswaage', 'Äpfel an der Obsttheke'], ['Personenwaage', 'deine Oma'], ['Briefwaage', 'einen dicken Umschlag'], ['Küchenwaage', 'Nudeln für das Mittagessen'], ['Verkaufswaage', 'Käse an der Käsetheke'], ['Personenwaage', 'deinen Bruder'], ['Küchenwaage', 'Haferflocken fürs Müsli'], ['Verkaufswaage', 'Tomaten auf dem Markt']];
function g_b_waage(L) {
  if (L >= 3 && Math.random() < .6) {                            // Messgrenzen (S. 35)
    const sc = pick([['Küchenwaage', 5000], ['Briefwaage', 500], ['Personenwaage', 150000], ['Küchenwaage', 3000]]);
    const it = pick([['eine Tüte Kartoffeln', 2500], ['ein Paket Mehl', 1000], ['einen Brief', 20], ['ein Buch', 800], ['ein Kind', 35000], ['eine Wassermelone', 5000], ['einen Sack Erde', 20000], ['ein Fahrrad', 12000], ['einen Schulranzen', 4000]]);
    const ok = it[1] <= sc[1];
    return QC(`Die ${sc[0]} wiegt höchstens ${gTxt(sc[1])}. Kann man damit ${it[0]} (${gTxt(it[1])}) wiegen?`, '', ok ? 'ja' : 'nein', [ok ? 'nein' : 'ja'], 'Ist das Gewicht kleiner als die Messgrenze?', `${gTxt(it[1])} ${ok ? '≤' : '>'} ${gTxt(sc[1])}`, true);
  }
  const [w, what] = pick(WAAGEN);
  return QC('Welche Waage nimmst du?', `<div class="story">Du willst ${what} wiegen.</div>`, w, shuffle(['Briefwaage', 'Küchenwaage', 'Personenwaage', 'Verkaufswaage', 'Balkenwaage'].filter(x => x !== w)).slice(0, 2), 'Leichte Dinge: kleine, genaue Waage. Schwere Dinge: große Waage.', `${cap(what)}: ${w}`);
}
const EINK = [['Orangen', 2500], ['Zucker', 1000], ['Käse', 200], ['Mehl', 1000], ['Spaghetti', 500], ['Tomaten', 250], ['Bananen', 350], ['Nuss-Creme', 440], ['Saft', 330], ['Brot', 750], ['Kekse', 600], ['Müsli', 300], ['Joghurt', 125], ['Butter', 250], ['Paprika', 500]];
const gw = g => g >= 1000 ? decS(g / 1000) + ' kg' : g + ' g';
function g_b_einkauf(L) {
  const k = L <= 2 ? 3 : L === 3 ? 4 : 6, its = shuffle(EINK).slice(0, k), s = its.reduce((a, i) => a + i[1], 0), list = `<ul class="bl">${its.map(i => `<li><b>${i[0]}</b> ${gw(i[1])}</li>`).join('')}</ul>`;
  if (L === 5) return QC('Welche Tüte nimmst du: für 5 kg oder für 7 kg?', list, s <= 5000 ? '5-kg-Tüte' : '7-kg-Tüte', [s <= 5000 ? '7-kg-Tüte' : '5-kg-Tüte'], 'Rechne ungefähr zusammen. 1 kg = 1 000 g.', `Zusammen ${nf(s)} g = ${gw(s)} – ${s <= 5000 ? 'passt in die 5-kg-Tüte' : 'zu schwer für die 5-kg-Tüte'}.`, true);
  if (L === 4) {
    const c = roundTo(s, 1000), opts = [c - 2000, c - 1000, c, c + 1000, c + 2000].filter(x => x > 0);
    return QC('Wie viel wiegt der Einkauf ungefähr?', list, `etwa ${gw(c)}`, shuffle(opts.filter(x => x !== c)).slice(0, 3).map(x => `etwa ${gw(x)}`), 'Runde jedes Gewicht auf 500 g oder 1 kg und rechne zusammen.', `Genau: ${nf(s)} g ≈ ${gw(c)}`);
  }
  if (L === 3) return { title: 'Wie schwer ist der Einkauf?', html: list + eqLine('[[0]] kg [[1]] g'), fields: [F(Math.floor(s / 1000)), F(s % 1000)], hint: 'Rechne alles in Gramm zusammen. 1 000 g = 1 kg.', explain: `${its.map(i => i[1]).join(' + ')} = ${nf(s)} g = ${Math.floor(s / 1000)} kg ${s % 1000} g` };
  return { title: 'Wie schwer ist der Einkauf zusammen?', html: list + eqLine('[[0]] g'), fields: [F(s)], hint: 'Schreibe alles in Gramm: 1 kg = 1 000 g. Dann addieren.', explain: `${its.map(i => i[1]).join(' + ')} = ${nf(s)} g` };
}
const KGT = [['einen Lastwagen', 't'], ['einen Schrank', 'kg'], ['ein Schiff', 't'], ['ein Fahrrad', 'kg'], ['einen Bagger', 't'], ['einen Stuhl', 'kg'], ['einen Elefanten', 't'], ['ein Kind', 'kg'], ['einen Zug', 't'], ['einen Hund', 'kg'], ['ein Flugzeug', 't'], ['einen Sack Kartoffeln', 'kg'],
  ['einen Wal', 't'], ['einen Tisch', 'kg'], ['einen Kran', 't'], ['einen Koffer', 'kg'], ['einen Bus', 't'], ['einen Fernseher', 'kg'], ['eine Lokomotive', 't'], ['einen Schulranzen', 'kg'], ['einen Traktor', 't'], ['eine Katze', 'kg'], ['ein Containerschiff', 't'], ['einen Kasten Wasser', 'kg']];
const TONNE_ST = [['Kind', 'Kinder', [25, 40, 50]], ['Schulranzen', 'Schulranzen', [4, 5, 8]], ['Sack Mehl', 'Säcke', [10, 20, 25, 50]], ['Hund', 'Hunde', [10, 20, 25]], ['Kiste Äpfel', 'Kisten', [8, 10, 20]], ['Kasten Wasser', 'Kästen', [10, 20, 25]], ['Paket', 'Pakete', [2, 4, 5, 8]]];
function g_b_tonne(L) {
  if (L <= 2) { const [o, u] = pick(KGT); return QC('Kilogramm oder Tonne?', `<div class="story">In welcher Einheit wiegt man ${o}?</div>`, u === 't' ? 'Tonne (t)' : 'Kilogramm (kg)', [u === 't' ? 'Kilogramm (kg)' : 'Tonne (t)'], 'Sehr schwere Dinge wie Lastwagen und Schiffe wiegt man in Tonnen.', `${cap(art(o))}: ${u === 't' ? 'Tonnen' : 'Kilogramm'}`, true); }
  if (L === 3) { const k = pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 50]), back = Math.random() < .5;
    return back ? { title: 'Rechne um: 1 t = 1 000 kg', html: eqLine(`${nf(k * 1000)} kg = [[0]] t`), fields: [F(k)], hint: '1 000 kg sind 1 Tonne.', explain: `${nf(k * 1000)} kg = ${k} t` }
      : { title: 'Rechne um: 1 t = 1 000 kg', html: eqLine(`${k} t = [[0]] kg`), fields: [F(k * 1000)], hint: '1 Tonne hat 1 000 Kilogramm.', explain: `${k} t = ${nf(k * 1000)} kg` }; }
  if (L === 4) { const [one, pl, ws] = pick(TONNE_ST), w = pick(ws), t = pick([1, 1, 2, 3]);
    const fem = /^(Kiste|Katze)/.test(one);
    return { title: `Wie viele sind zusammen ${t} Tonne${t > 1 ? 'n' : ''}?`, html: `<div class="story">${fem ? 'Eine' : 'Ein'} ${one} wiegt ${w} kg. Wie viele ${pl} wiegen zusammen ${t} t?</div>` + eqLine(`[[0]] ${pl}`), fields: [F(t * 1000 / w)], hint: `${t} t = ${nf(t * 1000)} kg. Wie oft passen ${w} kg hinein?`, explain: `${nf(t * 1000)} kg : ${w} kg = ${t * 1000 / w}` }; }
  const n = ri(18, 30), w = ri(30, 45), tot = n * w, R = tot > 1000 ? 'mehr als das Auto' : tot === 1000 ? 'genau so viel' : 'weniger als das Auto';
  return QC(`In einer Klasse sind ${n} Kinder, jedes wiegt etwa ${w} kg. Wiegt die Klasse so viel wie ein Auto (1 000 kg)?`, `<div class="story">${n} · ${w} kg = ?</div>`, R, ['mehr als das Auto', 'genau so viel', 'weniger als das Auto'].filter(x => x !== R), `Rechne ${n} · ${w}.`, `${n} · ${w} kg = ${nf(tot)} kg`);
}

/* =====================================================================
   B5  GEWICHTE UMWANDELN
   ===================================================================== */
const BSP_OPTS = ['1 g', '20 g', '100 g', '250 g', '500 g', '1 kg', '5 kg', '10 kg'];
const BSP = [['eine Büroklammer', '1 g'], ['ein Reißnagel', '1 g'], ['eine Stecknadel', '1 g'], ['ein Klebestift', '20 g'], ['ein Radiergummi', '20 g'], ['ein Teelöffel', '20 g'], ['ein Brief', '20 g'],
  ['eine Tafel Schokolade', '100 g'], ['eine Mandarine', '100 g'], ['eine Packung Taschentücher', '100 g'], ['ein Päckchen Butter', '250 g'], ['ein Päckchen Kaffee', '250 g'], ['ein Schulbuch', '500 g'], ['eine Packung Nudeln', '500 g'], ['ein Glas Honig', '500 g'],
  ['eine Packung Zucker', '1 kg'], ['eine Packung Mehl', '1 kg'], ['eine Flasche Wasser (1 Liter)', '1 kg'], ['ein Sack Kartoffeln', '5 kg'], ['eine Wassermelone', '5 kg'], ['eine Katze', '5 kg'], ['ein Kinderfahrrad', '10 kg'], ['ein voller Eimer Wasser', '10 kg'], ['ein Autoreifen', '10 kg']];
const TIERE = [['ein Koalabär', '15 kg'], ['ein Krokodil', '500 kg'], ['ein Clownfisch', '25 g'], ['ein Tiger', '300 kg'], ['eine Pythonschlange', '50 kg']];
function g_b_beisp(L) {
  if (L === 5 && Math.random() < .2) { const [a, b] = pick([['Sand', 'Federn'], ['Steine', 'Watte'], ['Eisen', 'Heu']]);
    return QC(`Tim sagt: „1 kg ${a} ist schwerer als 1 kg ${b}.“ Was stimmt?`, `<div class="story">1 kg ${a} oder 1 kg ${b}?</div>`, 'Beide sind gleich schwer.', [`${cap(a)} ist schwerer.`.replace('Steine ist', 'Steine sind'), `${cap(b)} ist schwerer.`.replace('Federn ist', 'Federn sind')], 'Lies genau: Wie viel wiegt jedes?', `1 kg ist 1 kg – egal ob ${a} oder ${b}. ${cap(b)} braucht nur viel mehr Platz.`); }
  if (L >= 3 && Math.random() < .3) { const [t, w] = pick(TIERE); return QC('Wie schwer ist das Tier ungefähr?', `<div class="story">${cap(t)}</div>`, w, shuffle(TIERE.map(x => x[1]).filter(x => x !== w)).slice(0, 3), 'Denk an die Größe des Tieres.', `${cap(art(t))}: etwa ${w}`); }
  const [o, w] = pick(BSP), i = BSP_OPTS.indexOf(w);
  const wrong = shuffle(BSP_OPTS.filter((x, j) => Math.abs(j - i) >= (L <= 2 ? 2 : 1))).slice(0, 3);
  return QC('Wie schwer ist das ungefähr?', `<div class="story">${cap(o)}</div>`, w, wrong, 'Vergleiche mit Dingen, die du kennst: 1 Paket Zucker = 1 kg, 1 Tafel Schokolade = 100 g.', `${cap(art(o))}: etwa ${w}`);
}
function g_b_gkg(L) {
  let kg = L === 1 ? ri(1, 9) : ri(0, L <= 3 ? 9 : 20), g = L === 1 ? 0 : L === 5 ? pick([ri(1, 9), ri(10, 99), ri(100, 999)]) : ri(1, 999);
  if (L === 2 && Math.random() < .5) g = ri(1, 9) * 100 + ri(0, 9) * 10;
  if (kg === 0 && g === 0) kg = 1;
  const form = L <= 2 ? 0 : L === 3 ? pick([0, 1]) : pick([0, 1, 2]);
  if (form !== 2 && kg === 0) kg = ri(1, 9);                                // „286 g = 286 g“ wäre keine Aufgabe
  const tot = kg * 1000 + g, dec = decS(tot / 1000), mixed = `${kg ? kg + ' kg ' : ''}${g ? g + ' g' : ''}`.trim();
  if (form === 0) return { title: 'Schreibe in drei Schreibweisen (1 kg = 1 000 g).', html: eqLine(`${mixed} = [[0]] g`) + eqLine(`${mixed} = [[1]] kg`), fields: [F(tot), FD(dec)], hint: `1 kg = 1 000 g. ${kg} kg = ${nf(kg * 1000)} g. Die Gramm stehen nach dem Komma immer dreistellig: ${kg},${String(g).padStart(3, '0')} kg.`, explain: `${mixed} = ${nf(tot)} g = ${dec} kg` };
  if (form === 1) return { title: 'Schreibe in drei Schreibweisen (1 kg = 1 000 g).', html: eqLine(`${nf(tot)} g = [[0]] kg [[1]] g`) + eqLine(`${nf(tot)} g = [[2]] kg`), fields: [F(kg), F(g), FD(dec)], hint: 'Die letzten drei Ziffern sind die Gramm, davor stehen die Kilogramm.', explain: `${nf(tot)} g = ${kg} kg ${g} g = ${dec} kg` };
  return { title: 'Schreibe in drei Schreibweisen (1 kg = 1 000 g).', html: eqLine(`${dec} kg = [[0]] g`) + eqLine(`${dec} kg = [[1]] kg [[2]] g`), fields: [F(tot), F(kg), F(g)], hint: 'Nach dem Komma stehen die Gramm: erste Stelle = 100 g, zweite = 10 g, dritte = 1 g. 8,7 kg = 8 kg 700 g.', explain: `${dec} kg = ${nf(tot)} g = ${kg} kg ${g} g` };
}
/* Gewichtsangabe in verschiedenen Schreibweisen (Gramm-Wert, Text) */
const wtTxt = (g, how) => {
  const kg = Math.floor(g / 1000), r = g % 1000;
  if (how === 'g') return nf(g) + ' g';
  if (how === 'dec') return decS(g / 1000) + ' kg';
  if (how === 'frac') { const f = { 250: '¼', 500: '½', 750: '¾' }[r]; if (f) return (kg ? kg + ' ' : '') + f + ' kg'; }
  return kg ? `${kg} kg${r ? ' ' + r + ' g' : ''}` : `${r} g`;
};
function g_b_ordnen(L) {
  const rnd = () => L <= 2 ? pick([ri(1, 9), ri(1, 9) * 10, ri(1, 9) * 100, ri(1, 9) * 1000, ri(10, 19) * 100]) : pick([ri(1, 99), ri(1, 9) * 250, ri(1, 60) * 1000, ri(1, 9) * 1000 + ri(1, 999), ri(1, 9) * 1000 + pick([250, 500, 750])]);
  let ws; do { ws = Array.from({ length: 4 }, rnd); } while (new Set(ws).size < 4);
  const light = Math.random() < .6, best = light ? Math.min(...ws) : Math.max(...ws);
  const T = ws.map(g => [g, wtTxt(g, pick(L <= 2 ? ['g', 'mix'] : ['g', 'mix', 'dec', 'frac']))]);
  return QC(`Was ist am ${light ? 'leichtesten' : 'schwersten'}?`, `<div class="story">${T.map(x => x[1]).join(' · ')}</div>`, T.find(x => x[0] === best)[1], T.filter(x => x[0] !== best).map(x => x[1]), 'Rechne alles in Gramm um, dann vergleichen.', T.map(x => `${x[1]} = ${nf(x[0])} g`).join(' · '));
}
function g_b_gleich(L) {
  const g = L <= 2 ? ri(1, 9) * 1000 + pick([0, 250, 500, 750]) : pick([ri(1, 9) * 1000 + ri(1, 999), ri(1, 9) * 1000 + pick([5, 50, 500]), ri(1, 99), ri(1, 9) * 1000 + pick([250, 500, 750])]);
  const forms = ['g', 'mix', 'dec', 'frac'].map(h => wtTxt(g, h)), shown = forms[0], others = forms.slice(1).filter((x, i, a) => x !== shown && a.indexOf(x) === i), right = pick(others);
  const near = [g * 10, Math.round(g / 10), g + 50, g + 500, g - 5, g + 1000, g + 5].filter(x => x > 0 && x !== g);
  const wrong = shuffle(near).map(x => wtTxt(x, pick(['dec', 'mix']))).filter((w, i, a) => w !== right && a.indexOf(w) === i).slice(0, 3);
  return QC('Was ist genauso schwer?', `<div class="eq big">${shown}</div>`, right, wrong, '1 kg = 1 000 g. Nach dem Komma stehen bei kg die Gramm (drei Stellen).', `${shown} = ${forms.filter((x, i, a) => a.indexOf(x) === i).join(' = ')}`);
}
const ST_IT = [['Mehl', 1000], ['Butter', 250], ['Kartoffeln', 2000], ['Käse', 150], ['Brot', 750], ['Schokolade', 100], ['Gummibärchen', 200], ['Nudeln', 500], ['Zucker', 1000], ['Salz', 500]];
function g_b_tabelle(L) {
  const k = L <= 2 ? 2 : L <= 4 ? 3 : 4, its = shuffle(ST_IT).slice(0, k), s = its.reduce((a, i) => a + i[1], 0);
  const d = String(s).padStart(4, '0').split('').map(Number);
  return { title: 'Wie schwer ist der Einkauf? Trage in die Stellentafel ein.', html: `<ul class="bl">${its.map(i => `<li><b>${i[0]}</b> ${gw(i[1])}</li>`).join('')}</ul>`
      + `<table class="stt"><tr><th>1 kg</th><th>100 g</th><th>10 g</th><th>1 g</th></tr><tr><td>[[0]]</td><td>[[1]]</td><td>[[2]]</td><td>[[3]]</td></tr></table>` + eqLine('= [[4]] kg'),
    fields: [F(d[0], { digit: true, next: 1 }), F(d[1], { digit: true, next: 2 }), F(d[2], { digit: true, next: 3 }), F(d[3], { digit: true, next: 4 }), FD(decS(s / 1000))], hint: 'Rechne alles in Gramm zusammen. Die Tausenderziffer sind die kg.', explain: `${its.map(i => i[1] + ' g').join(' + ')} = ${nf(s)} g = ${decS(s / 1000)} kg` };
}
function g_b_kgt(L) {
  let t = ri(L === 1 ? 1 : 0, 9), kg = L === 1 ? 0 : L === 5 ? pick([ri(1, 9), ri(10, 99), ri(100, 999)]) : ri(1, 999);
  if (t === 0 && kg === 0) t = 1;
  const form = L <= 2 ? 0 : pick([0, 1, 2]);
  if (form !== 2 && t === 0) t = ri(1, 9);
  const tot = t * 1000 + kg, dec = decS(tot / 1000), mixed = `${t ? t + ' t ' : ''}${kg ? kg + ' kg' : ''}`.trim();
  if (form === 0) return { title: 'Schreibe in drei Schreibweisen (1 t = 1 000 kg).', html: eqLine(`${mixed} = [[0]] kg`) + eqLine(`${mixed} = [[1]] t`), fields: [F(tot), FD(dec)], hint: '1 t = 1 000 kg. Nach dem Komma stehen die kg dreistellig.', explain: `${mixed} = ${nf(tot)} kg = ${dec} t` };
  if (form === 1) return { title: 'Schreibe in drei Schreibweisen (1 t = 1 000 kg).', html: eqLine(`${nf(tot)} kg = [[0]] t [[1]] kg`) + eqLine(`${nf(tot)} kg = [[2]] t`), fields: [F(t), F(kg), FD(dec)], hint: 'Die letzten drei Ziffern sind die kg, davor stehen die Tonnen.', explain: `${nf(tot)} kg = ${t} t ${kg} kg = ${dec} t` };
  return { title: 'Schreibe in drei Schreibweisen (1 t = 1 000 kg).', html: eqLine(`${dec} t = [[0]] kg`) + eqLine(`${dec} t = [[1]] t [[2]] kg`), fields: [F(tot), F(t), F(kg)], hint: '5,8 t = 5 t 800 kg. Erste Stelle nach dem Komma = 100 kg.', explain: `${dec} t = ${nf(tot)} kg = ${t} t ${kg} kg` };
}
const ttxt = (kg, how) => how === 'kg' ? nf(kg) + ' kg' : how === 'frac' && { 250: '¼', 500: '½', 750: '¾' }[kg] ? { 250: '¼', 500: '½', 750: '¾' }[kg] + ' t' : decS(kg / 1000) + ' t';
function g_b_tvergl(L) {
  const a = pick(L <= 2 ? [4000, 3200, 5000, 2000, 500, 1500] : [7640, 888, 9062, 16800, 1750, 500, 3200, 4500, 250, 750]);
  const b = pick([a, a + pick([1, 10, 100, 500, 1000]), Math.max(1, a - pick([1, 10, 100, 500])), a * 10, Math.round(a / 10), a + 800]);
  const ha = pick(['t', 'frac']), hb = 'kg';
  const [lt, lv, rt, rv] = Math.random() < .5 ? [ttxt(a, ha), a, ttxt(b, hb), b] : [ttxt(b, hb), b, ttxt(a, ha), a];
  return QCMP('Vergleiche. Setze &lt;, &gt; oder = ein.', lt, lv, rt, rv, 'Rechne die Tonnen in kg um: 1 t = 1 000 kg, ½ t = 500 kg.');
}
function g_b_lkw(L) {
  const k = 3, loads = Array.from({ length: k }, () => ri(L <= 2 ? 1 : 3, L <= 2 ? 30 : 49) * 100), shownT = L >= 3 ? ri(0, k - 1) : -1;
  const s = loads.reduce((a, b) => a + b, 0), txt = (w, i) => i === shownT ? decS(w / 1000) + ' t' : nf(w) + ' kg';
  return { title: 'Wie viele Tonnen hat der LKW geladen? Schreibe als Kommazahl.', html: `<div class="lkw">${loads.map((w, i) => `<span>${txt(w, i)}</span>`).join('')}</div>` + eqLine('[[0]] t'), fields: [FD(decS(s / 1000))],
    hint: 'Rechne alles in kg zusammen, dann in Tonnen: 1 000 kg = 1 t.', explain: `${loads.map(nf).join(' kg + ')} kg = ${nf(s)} kg = ${decS(s / 1000)} t` };
}

/* =====================================================================
   B6  MIT GEWICHTEN RECHNEN
   ===================================================================== */
const KORB = [['Brot', 750], ['Vanillezucker', 8], ['Butter', 250], ['Nudeln', 500], ['Mehl', 1000], ['Kartoffeln', 2000], ['Gummibärchen', 200], ['Schokolade', 100]];
function g_b_korb(L) {
  const k = L <= 2 ? 2 : L <= 4 ? 3 : 4; let its, s;
  do { its = shuffle(KORB).slice(0, k); s = its.reduce((a, i) => a + i[1], 0); } while (s < 200);
  const list = `<ul class="bl">${its.map(i => `<li><b>${i[0]}</b> ${gw(i[1])}</li>`).join('')}</ul>`;
  return s >= 1000 ? { title: 'Wie schwer ist der Einkauf?', html: list + eqLine('[[0]] kg [[1]] g'), fields: [F(Math.floor(s / 1000)), F(s % 1000)], hint: 'Rechne alles in Gramm zusammen. 1 000 g = 1 kg.', explain: `${its.map(i => i[1] + ' g').join(' + ')} = ${nf(s)} g = ${Math.floor(s / 1000)} kg ${s % 1000} g` }
    : { title: 'Wie schwer ist der Einkauf?', html: list + eqLine('[[0]] g'), fields: [F(s)], hint: 'Addiere die Gramm.', explain: `${its.map(i => i[1] + ' g').join(' + ')} = ${s} g` };
}
function g_b_ergaenz(L) {
  const T = pick(L <= 2 ? [['1 kg', 1000, 'g'], ['½ kg', 500, 'g']] : L === 3 ? [['¼ kg', 250, 'g'], ['½ kg', 500, 'g'], ['1 kg', 1000, 'g']] : [['2 t', 2000, 'kg'], ['½ t', 500, 'kg'], ['¼ t', 250, 'kg'], ['1 kg', 1000, 'g']]);
  const a = ri(Math.floor(T[1] / 10), T[1] - 1), alt = Math.random() < .4 ? nf(T[1]) + ' ' + T[2] : T[0];
  return { title: `Ergänze bis ${T[0]}.`, html: eqLine(`${nf(a)} ${T[2]} + [[0]] ${T[2]} = ${alt}`), fields: [F(T[1] - a)], hint: `${T[0]} = ${nf(T[1])} ${T[2]}. Rechne ${nf(T[1])} − ${nf(a)}.`, explain: `${nf(a)} + ${nf(T[1] - a)} = ${nf(T[1])}` };
}
const FZ = [['PKW', 1230, 785], ['kleiner Linienbus', 17200, 10536], ['Straßenbahn', 49440, 34750], ['Kleinlaster', 7500, 3534], ['Sportflugzeug', 2945, 2763]];
function g_b_fahrzeug(L) {
  let [n, ges, leer] = pick(FZ); if (L >= 4 && Math.random() < .5) { ges = ri(20, 99) * 100 + ri(0, 99); leer = ri(Math.floor(ges / 3), ges - 100); n = pick(['Lieferwagen', 'Wohnmobil', 'Traktor', 'Kleinbus']); }
  const nutz = ges - leer, ask = L <= 2 ? 'nutz' : pick(['nutz', 'leer', 'ges']);
  const row = (lab, v, key) => `<tr><td>${lab}</td><td>${ask === key ? '[[0]]' : nf(v)} kg</td></tr>`;
  const ans = ask === 'nutz' ? nutz : ask === 'leer' ? leer : ges;
  return { title: 'Berechne die fehlende Gewichtsangabe.', html: `<table class="fz"><tr><th colspan="2">${n}</th></tr>${row('Zulässiges Gesamtgewicht', ges, 'ges')}${row('Leergewicht', leer, 'leer')}${row('Nutzlast', nutz, 'nutz')}</table>`, fields: [F(ans)],
    hint: 'Gesamtgewicht = Leergewicht + Nutzlast. Nutzlast = Gesamtgewicht − Leergewicht.', explain: `${nf(leer)} kg + ${nf(nutz)} kg = ${nf(ges)} kg` };
}
const VM = [['Linienbus', 9100, '9 100 kg'], ['Nahverkehrszug', 67000, '67 t'], ['Seilbahn', 6400, '6 400 kg'], ['Schwebebahn', 13300, '13 t 300 kg']];
const VM2 = [['Aufzug', 1000, '1 000 kg'], ['Kleinbus', 1200, '1 200 kg'], ['Ruderboot', 400, '400 kg'], ['Gondel', 800, '800 kg'], ['Fähre', 45000, '45 t'], ['Straßenbahn', 14700, '14 t 700 kg'], ['Ausflugsschiff', 25600, '25 t 600 kg'], ['Reisebus', 7800, '7 800 kg'], ['Sessellift', 2400, '2 400 kg'], ['Hubschrauber', 1500, '1 500 kg'], ['Riesenrad', 9600, '9 t 600 kg'], ['Zahnradbahn', 11200, '11 t 200 kg'],
  ['Floß', 500, '500 kg'], ['Kutsche', 600, '600 kg'], ['Heißluftballon', 700, '700 kg'], ['Doppeldeckerbus', 6800, '6 800 kg'], ['Rettungsboot', 1800, '1 800 kg'], ['Tretboot', 300, '300 kg'], ['U-Bahn', 32000, '32 t'], ['Wohnmobil', 900, '900 kg'], ['Kleinflugzeug', 1100, '1 100 kg'], ['Segelboot', 2100, '2 100 kg']];
function g_b_personen(L) {
  if (L >= 4 && Math.random() < .5) { const best = VM.slice().sort((a, b) => b[1] - a[1])[0]; const asc = Math.random() < .5;
    const pickV = asc ? VM.slice().sort((a, b) => a[1] - b[1])[0] : best;
    return QC(`Welches Verkehrsmittel darf am ${asc ? 'wenigsten' : 'meisten'} laden?`, `<ul class="bl">${VM.map(v => `<li><b>${v[0]}</b> Nutzlast ${v[2]}</li>`).join('')}</ul>`, pickV[0], VM.filter(v => v !== pickV).map(v => v[0]), 'Rechne alles in kg um: 1 t = 1 000 kg.', VM.map(v => `${v[0]} ${nf(v[1])} kg`).join(' · ')); }
  let [n, kg, txt] = L <= 2 ? pick(VM.concat(VM2).filter(v => !/ t/.test(v[2]))) : pick(VM.concat(VM2));
  if (L >= 3 && Math.random() < .4) { kg = ri(L === 3 ? 3 : 10, L === 3 ? 99 : 300) * 100; txt = kg >= 10000 && kg % 1000 ? `${Math.floor(kg / 1000)} t ${kg % 1000} kg` : kg >= 10000 ? `${kg / 1000} t` : `${nf(kg)} kg`; }
  const per = L === 5 ? pick([100, 80, 75]) : 100;
  return { title: 'Wie viele Personen dürfen mitfahren?', html: `<div class="story">${n}: Nutzlast <b>${txt}</b>.<br>Für jede Person mit Gepäck rechnet man ${per} kg.</div>` + eqLine('[[0]] Personen'), fields: [F(Math.floor(kg / per))],
    hint: `Rechne die Nutzlast in kg um und teile durch ${per}.`, explain: `${nf(kg)} kg : ${per} kg = ${Math.floor(kg / per)}${kg % per ? ' (Rest ' + kg % per + ' kg)' : ''}` };
}
function g_b_saecke(L) {
  const sack = pick(L <= 2 ? [50, 100, 25] : [50, 25, 40, 20, 10]), t = L <= 2 ? ri(1, 5) : ri(2, 20), kg = t * 1000;
  if (kg % sack) return g_b_saecke(L);
  const n = kg / sack, [where, what, pron] = pick([['Auf einer Baustelle', 'Zement', 'Der Zement ist'], ['Auf einer Baustelle', 'Sand', 'Der Sand ist'], ['Auf einer Baustelle', 'Kies', 'Der Kies ist'], ['In einer Großbäckerei', 'Mehl', 'Das Mehl ist'], ['Auf einem Markt', 'Kartoffeln', 'Die Kartoffeln sind']]);
  return { title: 'Wie viele Säcke müssen transportiert werden?', html: `<div class="story">${where} werden <b>${t} t ${what}</b> gebraucht. ${pron} in Säcken zu je <b>${sack} kg</b> abgepackt.</div>` + eqLine('[[0]] Säcke'), fields: [F(n)],
    hint: `${t} t = ${nf(kg)} kg. Wie oft passt ${sack} kg hinein?`, explain: `${nf(kg)} kg : ${sack} kg = ${nf(n)}` };
}
function g_b_papier(L) {
  const day = Math.random() < .25 ? 640 : ri(40, 75) * 10, days = L <= 3 ? pick([2, 3, 4, 5, 6, 7]) : pick([7, 14]), ppl = L >= 4 ? ri(2, 6) : 1, g = day * days * ppl;
  return { title: 'Wie viel Papier ist das?', html: `<div class="story">Jeder in Deutschland verbraucht pro Tag etwa <b>${day} g</b> Papier.<br>Wie viel ist das ${ppl > 1 ? `für eine Familie mit ${ppl} Personen ` : ''}in ${days === 7 ? 'einer Woche' : days === 14 ? 'zwei Wochen' : days + ' Tagen'}?</div>` + eqLine('[[0]] g') + eqLine('= [[1]] kg'),
    fields: [F(g), FD(decS(g / 1000))], hint: `Rechne ${day} g · ${days}${ppl > 1 ? ' · ' + ppl : ''}. 1 000 g = 1 kg.`, explain: `${day} g · ${days}${ppl > 1 ? ' · ' + ppl : ''} = ${nf(g)} g = ${decS(g / 1000)} kg` };
}
const FETT = [['Bratwurst', 82], ['Hähnchen', 15], ['Kotelett', 76], ['Mayonnaise', 132], ['Möhren', 1], ['Pommes frites', 108], ['Reis', 0], ['Schokolade', 75], ['Chips', 88], ['Walnüsse', 160], ['Apfel', 2], ['Vollfettkäse', 75], ['Magerquark', 5], ['Vanille-Eis', 30]];
function fettChart(list) {
  const W = 560, rowH = 30, H = list.length * rowH + 16, x0 = 150, sc = (W - x0 - 50) / 170;
  return `<svg class="fett" viewBox="0 0 ${W} ${H}" role="img" aria-label="Balkendiagramm: Fett in 250 g">${list.map(([n, v], i) => `<text x="${x0 - 8}" y="${i * rowH + 26}" text-anchor="end" class="ft-n">${n}</text><rect x="${x0}" y="${i * rowH + 10}" width="${Math.max(1.5, v * sc)}" height="20" rx="4" class="ft-b"/><text x="${x0 + Math.max(1.5, v * sc) + 6}" y="${i * rowH + 26}" class="ft-v">${v} g</text>`).join('')}</svg>`;
}
function g_b_fett(L) {
  const list = shuffle(FETT).slice(0, L <= 2 ? 4 : 5);
  if (L <= 2 || (L === 4 && Math.random() < .4)) {
    const most = Math.random() < .6, vals = list.map(x => x[1]), best = most ? Math.max(...vals) : Math.min(...vals);
    if (vals.filter(v => v === best).length > 1) return g_b_fett(L);
    const b = list.find(x => x[1] === best);
    return QC(`Welches Lebensmittel hat am ${most ? 'meisten' : 'wenigsten'} Fett? (je 250 g)`, fettChart(list), b[0], list.filter(x => x !== b).map(x => x[0]), 'Schau, welcher Balken am längsten (oder am kürzesten) ist.', `${b[0]}: ${b[1]} g Fett`);
  }
  if (L === 3) { let it; do { it = pick(list); } while (it[1] % 10 === 5); const k = roundTo(it[1], 10) / 10;
    return { title: 'Ein Kästchen im Diagramm bedeutet 10 g Fett.', html: fettChart(list) + `<div class="story">Wie viele Kästchen malst du ungefähr für <b>${it[0]}</b>?</div>` + eqLine('[[0]] Kästchen'), fields: [F(k)], hint: `${it[1]} g auf Zehner runden, dann durch 10 teilen.`, explain: `${it[1]} g ≈ ${k * 10} g = ${k} Kästchen` }; }
  let p, q; do { [p, q] = shuffle(list).slice(0, 2).sort((x, y) => y[1] - x[1]); } while (p[1] === q[1]);
  return { title: 'Lies im Diagramm ab und rechne.', html: fettChart(list) + `<div class="story">Wie viel Gramm Fett hat <b>${p[0]}</b> mehr als <b>${q[0]}</b>?</div>` + eqLine('[[0]] g'), fields: [F(p[1] - q[1])], hint: 'Lies beide Werte ab und ziehe den kleineren vom größeren ab.', explain: `${p[1]} g − ${q[1]} g = ${p[1] - q[1]} g` };
}

/* =====================================================================
   REGISTRIEREN: Kapitel B vor dem Extra-Training
   ===================================================================== */
const B_MODULES = [
  { id: 'B1', title: 'Bis zur Million', sub: 'Große Zahlen lesen und schreiben', wb: 'Bis zur Million (S. 5–14)', icon: '🔢', topics: [
    { id: 'buendeln', t: 'Bündeln', wb: 'E, Z, H, T, ZT, HT, M (S. 6–7)', d: 'Zehn Kleine sind ein Großer', icon: '📦', gen: g_b_buendeln },
    { id: 'bauen', t: 'Zahlen bauen', wb: 'Wie heißen die Zahlen? (S. 8, 12)', d: 'Tausender, Hunderter, Zehner, Einer zusammensetzen', icon: '🧱', gen: g_b_bauen },
    { id: 'tafel', t: 'Stellentafel', wb: 'Zahlen an der Stellentafel (S. 10)', d: 'Plättchen zählen und die Zahl schreiben', icon: '📋', gen: g_b_tafel },
    { id: 'zerleg', t: 'Plus-Zerlegung', wb: 'Schreibe die Zahlen in die Stellentafel (S. 10)', d: 'Stellenwerte zusammenrechnen und zerlegen', icon: '➕', gen: g_b_zerleg },
    { id: 'woerter', t: 'Zahlwörter', wb: 'Lies und schreibe die Zahlen mit Ziffern (S. 11)', d: 'Vom Wort zur Zahl', icon: '🔤', gen: g_b_woerter },
    { id: 'vergl', t: 'Größer oder kleiner?', wb: '< oder >? (S. 12)', d: 'Große Zahlen vergleichen', icon: '↔️', gen: g_b_vergl },
    { id: 'karten', t: 'Ziffernkarten', wb: 'Sechsstellige Zahlen mit Ziffernkarten (S. 13)', d: 'Die größte und die kleinste Zahl legen', icon: '🃏', gen: g_b_karten },
    { id: 'plaett', t: 'Plättchen-Rätsel', wb: 'Sechsstellige Zahlen mit Plättchen (S. 14)', d: 'Ein Plättchen weg oder verschoben', icon: '🔴', gen: g_b_plaett }
  ] },
  { id: 'B2', title: 'Vorgänger und Nachfolger', sub: 'Zahlenstrahl und Nachbarzahlen', wb: 'Vorgänger und Nachfolger (S. 15–24)', icon: '📏', topics: [
    { id: 'strahl', t: 'Zahlenstrahl', wb: 'Zahlenstrahl (S. 15)', d: 'Welche Zahl zeigt der Pfeil?', icon: '📏', gen: g_b_strahl },
    { id: 'nachbar', t: 'Nachbarzahlen', wb: 'Nachbarzahlen (S. 16)', d: 'Eins davor, eins danach', icon: '🏘️', gen: g_b_nachbar },
    { id: 'nzehn', t: 'Nachbarzehner', wb: 'Nachbarzehner, Nachbarhunderter (S. 17–18)', d: 'Nachbarzehner und Nachbarhunderter: zurück und vorwärts zur glatten Zahl', icon: '🔟', gen: g_b_nzehn },
    { id: 'ntaus', t: 'Nachbartausender & mehr', wb: 'Nachbartausender bis -hunderttausender (S. 18–20)', d: 'Große Nachbarn finden', icon: '🧮', gen: g_b_ntaus },
    { id: 'mitte', t: 'Die Mitte', wb: 'Zahlen am Rechenstrich: Mitte (S. 22)', d: 'Welche Zahl liegt genau dazwischen?', icon: '🎯', gen: g_b_mitte },
    { id: 'schritte', t: 'In Schritten zählen', wb: 'In Schritten zählen (S. 23)', d: 'Vorwärts und rückwärts hüpfen', icon: '🐸', gen: g_b_schritte },
    { id: 'stufen', t: 'Stufenzahlen', wb: 'Stufenzahlen (S. 24)', d: '+1, +10, +100 … Stufe für Stufe', icon: '🪜', gen: g_b_stufen }
  ] },
  { id: 'B3', title: 'Zerlegen und runden', sub: 'Zerlegen, vergleichen, runden', wb: 'Zahlen zerlegen, vergleichen, runden (S. 25–32)', icon: '🎯', topics: [
    { id: 'tue', t: 'Tausender und Einer', wb: 'Zahlen in Tausender und Einer zerlegen (S. 25–26)', d: '38 064 = 38 T + 64 E', icon: '✂️', gen: g_b_tue },
    { id: 'teilen', t: 'Große Zahlen teilen', wb: 'Zahlen zerlegen und vergleichen (S. 27)', d: 'In gleich große Teile teilen', icon: '🍕', gen: g_b_teilen },
    { id: 'haus', t: 'Zahlenhäuser', wb: 'Zahlenhäuser (S. 27)', d: 'Malaufgaben mit großen Zahlen', icon: '🏠', gen: g_b_haus },
    { id: 'laender', t: 'Bundesländer', wb: 'Einwohnerzahlen der Bundesländer (S. 28–29)', d: 'Wo wohnen die meisten Menschen?', icon: '🗺️', gen: g_b_laender },
    { id: 'rundM', t: 'Auf Millionen runden', wb: 'Auf Millionen runden (S. 29)', d: 'Abrunden oder aufrunden?', icon: '🏙️', gen: g_b_rundM },
    { id: 'rundT', t: 'Auf Tausender runden', wb: 'Auf Tausender runden (S. 30)', d: 'Auf glatte Tausender runden', icon: '🎯', gen: g_b_rundT },
    { id: 'mitrund', t: 'Mit gerundeten Zahlen', wb: 'Mit gerundeten Zahlen rechnen (S. 31–32)', d: 'Sportvereine: erst runden, dann rechnen', icon: '⚽', gen: g_b_mitrund }
  ] },
  { id: 'B4', title: 'Gewichte vergleichen', sub: 'Schwerer, leichter, Waagen', wb: 'Gewichte vergleichen und wiegen (S. 33–37)', icon: '⚖️', topics: [
    { id: 'schwerer', t: 'Schwerer oder leichter?', wb: 'Gewichte von Gegenständen vergleichen (S. 33)', d: 'Was wiegt mehr?', icon: '⚖️', gen: g_b_schwerer },
    { id: 'waage', t: 'Welche Waage?', wb: 'Unterschiedliche Waagen, Messgrenzen (S. 34–35)', d: 'Die richtige Waage für jede Sache', icon: '🏷️', gen: g_b_waage },
    { id: 'einkauf', t: 'Einkauf wiegen', wb: 'Gramm und Kilogramm – Einkaufen (S. 36)', d: 'Wie schwer ist die Einkaufstüte?', icon: '🛒', gen: g_b_einkauf },
    { id: 'tonne', t: 'Kilogramm und Tonne', wb: 'Kilogramm und Tonne (S. 37)', d: 'Richtig schwere Sachen', icon: '🐘', gen: g_b_tonne }
  ] },
  { id: 'B5', title: 'Gewichte umwandeln', sub: 'g, kg und t', wb: 'Gewichte umwandeln (S. 38–41)', icon: '🔄', topics: [
    { id: 'beisp', t: 'Wie schwer ungefähr?', wb: 'Beispiele für Gewichte (S. 38)', d: 'Schätzen mit Gewichten, die du kennst', icon: '🍎', gen: g_b_beisp },
    { id: 'gkg', t: 'g und kg', wb: 'Umwandeln: g und kg (S. 39)', d: 'Drei Schreibweisen für ein Gewicht', icon: '🔄', gen: g_b_gkg },
    { id: 'ordnen', t: 'Gewichte ordnen', wb: 'Ordne nach dem Gewicht (S. 39)', d: 'Am leichtesten, am schwersten', icon: '↕️', gen: g_b_ordnen },
    { id: 'gleich', t: 'Gleich schwer', wb: 'Gleiche Gewichtsangaben (S. 39)', d: 'Finde dieselbe Angabe in anderer Schreibweise', icon: '🟰', gen: g_b_gleich },
    { id: 'tabelle', t: 'Gewichte-Stellentafel', wb: 'g und kg (S. 40)', d: 'kg, 100 g, 10 g, 1 g', icon: '📋', gen: g_b_tabelle },
    { id: 'kgt', t: 'kg und t', wb: 'Umwandeln: kg und t (S. 41)', d: 'Tonnen in drei Schreibweisen', icon: '🚛', gen: g_b_kgt },
    { id: 'tvergl', t: 'Tonnen vergleichen', wb: 'Vergleiche: <, > oder = (S. 41)', d: 't oder kg – was ist mehr?', icon: '🆚', gen: g_b_tvergl },
    { id: 'lkw', t: 'LKW beladen', wb: 'Wie viele Tonnen haben die LKWs geladen? (S. 41)', d: 'Ladung als Kommazahl', icon: '🚚', gen: g_b_lkw }
  ] },
  { id: 'B6', title: 'Mit Gewichten rechnen', sub: 'Sachaufgaben mit Gewichten', wb: 'Mit Gewichten rechnen, Sachaufgaben (S. 42–45)', icon: '🧺', topics: [
    { id: 'korb', t: 'Einkaufskorb', wb: 'Wie schwer ist der Einkauf? (S. 42)', d: 'Alles zusammen wiegen', icon: '🧺', gen: g_b_korb },
    { id: 'ergaenz', t: 'Ergänzen', wb: 'Ergänze (S. 42)', d: 'Bis 1 kg, ½ kg, ¼ kg, 2 t …', icon: '➕', gen: g_b_ergaenz },
    { id: 'fahrzeug', t: 'Gesamtgewicht & Nutzlast', wb: 'Fehlende Gewichtsangaben (S. 43)', d: 'Leergewicht + Nutzlast = Gesamtgewicht', icon: '🚌', gen: g_b_fahrzeug },
    { id: 'personen', t: 'Wie viele Personen?', wb: 'Verkehrsmittel und Nutzlast (S. 43)', d: 'Jede Person mit Gepäck: 100 kg', icon: '👥', gen: g_b_personen },
    { id: 'saecke', t: 'Säcke zählen', wb: 'Sachaufgabe Zement (S. 44)', d: 'Wie viele Säcke sind eine Ladung?', icon: '🧱', gen: g_b_saecke },
    { id: 'papier', t: 'Papier pro Woche', wb: 'Sachaufgabe Papier (S. 44)', d: 'Vom Tag zur Woche', icon: '📄', gen: g_b_papier },
    { id: 'fett', t: 'Fett im Essen', wb: 'Balkendiagramm Fettgehalt (S. 45)', d: 'Diagramm lesen und rechnen', icon: '📊', gen: g_b_fett }
  ] }
];
MODULES.splice(MODULES.findIndex(m => m.extra), 0, ...B_MODULES);
