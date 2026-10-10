// Kapitel B: rechnet jede Aufgabe unabhängig nach (eigene Parser, kein Code aus gen_b.js außer den Aufgaben selbst).
const fs = require('fs'), vm = require('vm');
const ctx = { Math, console, String, Number, Array, Object, JSON }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('../src/gen.js', 'utf8') + '\n' + fs.readFileSync('../src/gen_b.js', 'utf8') + ';this.MODULES=MODULES;this.BL=BL;this.FETT=FETT;this.SPORT=SPORT;', ctx);
const { MODULES, BL, FETT, SPORT } = ctx;
const app = fs.readFileSync('../src/store.js', 'utf8');
const fieldOK = new Function(/const normIn[\s\S]*?\n}\n/.exec(app)[0] + ';return fieldOK')();
const strip = h => String(h).replace(/<br>/g, '\n').replace(/<\/(div|li|tr)>/g, '\n').replace(/<\/t[hd]>/g, ' | ').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/ /g, ' ');
const N = s => +String(s).replace(/[\s ]/g, '').replace(',', '.');
const PLV = { M: 1e6, HT: 1e5, ZT: 1e4, T: 1e3, H: 100, Z: 10, E: 1 };
const FR = { '¼': .25, '½': .5, '¾': .75 };
/* Gewicht → Gramm (immer Gramm: g ×1, kg ×1 000, t ×1 000 000) */
const FU = { g: 1, kg: 1000, t: 1e6 };
function W(t) {
  t = strip(t).trim();
  let m;
  if ((m = /^([\d ]+) (kg|t) ([\d ]+) (g|kg)$/.exec(t))) return N(m[1]) * FU[m[2]] + N(m[3]) * FU[m[4]];
  if ((m = /^(?:(\d+) )?([¼½¾]) (kg|t)$/.exec(t))) return Math.round(((m[1] ? +m[1] : 0) + FR[m[2]]) * FU[m[3]]);
  if ((m = /^([\d ]+(?:,\d+)?) (g|kg|t)$/.exec(t))) return Math.round(N(m[1]) * FU[m[2]]);
  throw new Error('W? ' + t);
}
/* Zahlwort → Zahl (unabhängiger Parser) */
function wordsToNum(w) {
  w = strip(w).trim().toLowerCase();
  const U = { ein: 1, eins: 1, eine: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9 };
  const TEEN = { zehn: 10, elf: 11, zwölf: 12, dreizehn: 13, vierzehn: 14, fünfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19 };
  const TENS = { zwanzig: 20, dreißig: 30, vierzig: 40, fünfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90 };
  const u99 = s => { if (!s) return 0; if (TEEN[s] != null) return TEEN[s]; if (TENS[s] != null) return TENS[s]; if (U[s] != null) return U[s];
    const m = /^(.+)und(.+)$/.exec(s); if (m && U[m[1]] != null && TENS[m[2]] != null) return U[m[1]] + TENS[m[2]]; throw new Error('u99 ' + s); };
  const u999 = s => { const i = s.indexOf('hundert'); return i >= 0 ? U[s.slice(0, i)] * 100 + u99(s.slice(i + 7)) : u99(s); };
  let tot = 0, m;
  if ((m = /^(.+?) million(?:en)?(?: (.*))?$/.exec(w))) { tot += (m[1] === 'eine' ? 1 : u999(m[1])) * 1e6; w = m[2] || ''; }
  const i = w.indexOf('tausend'); if (i >= 0) { tot += (i ? u999(w.slice(0, i)) : 1) * 1000; w = w.slice(i + 7); }
  return tot + (w ? u999(w) : 0);
}
let errors = [], count = 0;
const err = (id, L, msg, q) => errors.push(`${id} L${L}: ${msg}\n   ${JSON.stringify(q).slice(0, 260)}`);
const roundTo = (n, u) => Math.floor((n + u / 2) / u) * u;
const B = MODULES.filter(m => /^B[1-6]$/.test(m.id));
if (B.map(m => m.id).join() !== 'B1,B2,B3,B4,B5,B6') errors.push('Kapitel B: Hefte ' + B.map(m => m.id));
if (MODULES.findIndex(m => m.id === 'B1') > MODULES.findIndex(m => m.extra)) errors.push('B vor Extra-Training einhängen');
for (const mod of B) for (const t of mod.topics) for (let L = 1; L <= 5; L++) for (let r = 0; r < 300; r++) {
  const q = t.gen(L), id = mod.id + '.' + t.id; count++;
  try {
    if (!q.title || !q.hint || !q.explain) { err(id, L, 'Text fehlt', q); continue; }
    if (/undefined|NaN|\[object|Infinity/.test(JSON.stringify(q))) { err(id, L, 'undefined/NaN', q); continue; }
    const A = q.fields ? q.fields.map(f => f.a) : null, H = q.fields ? strip(q.html) : strip(q.prompt || ''), lines = H.split('\n').map(x => x.trim()).filter(Boolean);
    const ans = i => N(A[i]);
    if (q.fields) {
      q.fields.forEach(f => { if (!fieldOK(f, f.a)) err(id, L, 'eigene Antwort abgelehnt ' + f.a, q); if (f.dec && (f.a.split(',')[1] || '').length < 3 && !fieldOK(f, f.a + (f.a.includes(',') ? '0' : ',0'))) err(id, L, 'Kommazahl mit 0 am Ende abgelehnt', q); });
    } else {
      if (!(q.correct >= 0 && q.correct < q.choices.length)) err(id, L, 'correct oob', q);
      if (new Set(q.choices).size !== q.choices.length || q.choices.length < 2) err(id, L, 'doppelte/zu wenige Auswahl', q);
    }
    const ch = q.choices ? strip(q.choices[q.correct]) : null;
    switch (id) {
      case 'B1.buendeln': {
        let m;
        if ((m = /^10 (\w+) = \[\[0\]\] (\w+)$/.exec(lines[0]))) { if (PLV[m[1]] * 10 !== PLV[m[2]] || ans(0) !== 1) err(id, L, 'bündeln', q); }
        else if ((m = /^1 (\w+) = \[\[0\]\] (\w+)$/.exec(lines[0]))) { if (PLV[m[1]] / PLV[m[2]] !== ans(0)) err(id, L, 'entbündeln', q); }
        else if ((m = /^(\d+) (\w+) = \[\[0\]\] (\w+) \+ \[\[1\]\] (\w+)$/.exec(lines[0]))) { const v = +m[1] * PLV[m[2]]; if (ans(0) * PLV[m[3]] + ans(1) * PLV[m[4]] !== v || ans(2) !== v || ans(1) > 9) err(id, L, 'bündeln 14 H', q); }
        else err(id, L, 'Form?', q); break; }
      case 'B1.bauen': { const m = /^(.*) = \[\[0\]\]$/.exec(lines[0]); const s = m[1].split(' + ').reduce((a, p) => { const x = /^(\d+) (\w+)$/.exec(p); return a + +x[1] * PLV[x[2]]; }, 0); if (s !== ans(0)) err(id, L, 'Summe ' + s, q); break; }
      case 'B1.tafel': {
        if (/Welche Ziffer/.test(q.title)) { const n = N(lines[0]), p = /\((\w+)\)/.exec(lines[1])[1]; if (Math.floor(n / PLV[p]) % 10 !== ans(0)) err(id, L, 'Ziffer', q); }
        else { const cols = [...q.html.matchAll(/<th class="stt-(\w+)">/g)].map(x => x[1]), cells = [...q.html.matchAll(/<td class="stt-\w+">(.*?)<\/td>/g)].map(x => (x[1].match(/●/g) || []).length);
          const v = cols.reduce((a, c, i) => a + cells[i] * PLV[c], 0); if (v !== ans(0)) err(id, L, 'Plättchen ' + v, q); }
        break; }
      case 'B1.zerleg': {
        let m;
        if ((m = /^([\d ]+) = (\[\[\d+\]\](?: \+ \[\[\d+\]\])*)$/.exec(lines[0]))) { const n = N(m[1]), parts = A.map(N); if (parts.reduce((a, b) => a + b, 0) !== n || parts.some((p, i) => !/^[1-9]0*$/.test(String(p)) || (i && p >= parts[i - 1]))) err(id, L, 'Zerlegung', q); }
        else { const mm = /^(.*) = \[\[0\]\]$/.exec(lines[0]); if (mm[1].split(' + ').reduce((a, p) => a + N(p), 0) !== ans(0)) err(id, L, 'Plus', q); }
        break; }
      case 'B1.woerter': { if (q.fields) { if (wordsToNum(q.html.match(/<div class="story nw">(.*?)<\/div>/)[1]) !== ans(0)) err(id, L, 'Zahlwort ' + strip(q.html), q); }
        else { const n = N(H); if (wordsToNum(ch) !== n) err(id, L, 'Wortwahl', q); q.choices.forEach((c, i) => { if (i !== q.correct && wordsToNum(c) === n) err(id, L, 'zweites richtiges Wort', q); }); } break; }
      case 'B1.vergl': case 'B5.tvergl': {
        const sp = [...q.prompt.matchAll(/<span>([^<]+)<\/span>/g)].map(x => strip(x[1])), m = [null, sp[0], sp[1]];
        const v = s => / (g|kg|t)$/.test(s.trim()) ? W(s) : s.split(/ ([+−]) /).reduce((acc, x, i, arr) => i === 0 ? N(x) : i % 2 ? acc : arr[i - 1] === '+' ? acc + N(x) : acc - N(x), 0);
        const a = v(m[1]), b = v(m[2]), c = a < b ? 0 : a === b ? 1 : 2; if (c !== q.correct) err(id, L, `Vergleich ${a} ${b}`, q); break; }
      case 'B1.karten': {
        const ds = [...q.html.matchAll(/class="card-d">(\d)</g)].map(x => +x[1]), n = ds.length;
        const perms = a => a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));
        const nums = perms(ds).filter(p => p[0] !== 0).map(p => +p.join('')), mx = Math.max(...nums), mn = Math.min(...nums);
        if (q.fields.length === 3) { if (ans(0) !== mx || ans(1) !== mn || ans(2) !== mx - mn) err(id, L, 'Karten 3', q); }
        else if (ans(0) !== (/größte/.test(q.title) ? mx : mn)) err(id, L, 'Karten', q);
        if (String(ans(0)).length !== n) err(id, L, 'Stellenzahl', q); break; }
      case 'B1.plaett': {
        if (/weggenommen/.test(q.title)) { const cols = [...q.html.matchAll(/<th class="stt-(\w+)">/g)].map(x => x[1]), cells = [...q.html.matchAll(/<td class="stt-\w+">(.*?)<\/td>/g)].map(x => (x[1].match(/●/g) || []).length);
          const n = cols.reduce((a, c, i) => a + cells[i] * PLV[c], 0), p = /Spalte (\w+) weg/.exec(H)[1]; if (n - PLV[p] !== ans(0) || cells[cols.indexOf(p)] < 1) err(id, L, 'weg', q); }
        else { const n = N(lines[0]), m = /von (\w+) nach (\w+)/.exec(H); const d = p => Math.floor(n / PLV[p]) % 10; if (n - PLV[m[1]] + PLV[m[2]] !== ans(0) || d(m[1]) < 1 || d(m[2]) > 8 || m[1] === m[2]) err(id, L, 'verschieben', q); }
        break; }
      case 'B2.strahl': case 'B2.mitte': {
        const labs = [...q.html.matchAll(/<text x="([\d.]+)" y="98"[^>]*>([^<]+)</g)].map(x => [+x[1], N(x[2])]), arrow = +/<path d="M([\d.]+) 40/.exec(q.html)[1];
        const [x0, a] = labs[0], [x1, b] = labs[labs.length - 1], v = a + (b - a) * (arrow - x0) / (x1 - x0);
        if (Math.abs(v - ans(0)) > 1e-6) err(id, L, `Pfeil ${v}`, q);
        const ticks = [...q.html.matchAll(/class="zs-t/g)].length - 1, step = (b - a) / ticks; if (Math.abs((ans(0) - a) / step - Math.round((ans(0) - a) / step)) > 1e-9) err(id, L, 'nicht auf Strich', q);
        break; }
      case 'B2.nachbar': { const n = /Kilometer/.test(q.title) ? N(/springt gerade auf ([\d ]+)\./.exec(H)[1]) : N(/\| *([\d ]+) *\|/.exec(H.replace(/\n/g, ' ')) ? 0 : 0) || N(q.html.match(/<b>([\d ]+)<\/b>/)[1]); if (ans(0) !== n - 1 || ans(1) !== n + 1) err(id, L, 'V/N', q); break; }
      case 'B2.nzehn': case 'B2.ntaus': {
        const n = N(q.html.match(/<b>([\d ]+)<\/b>/)[1]), lab = q.html.match(/<span>(\w+)<\/span>/)[1], u = { VZ: 10, VH: 100, VT: 1000, VZT: 10000, VHT: 100000 }[lab];
        if (ans(0) !== Math.floor(n / u) * u || ans(1) !== ans(0) + u || n % u === 0) err(id, L, 'Nachbar ' + lab, q); break; }
      case 'B2.schritte': { const m = /^([\d ]+), ([\d ]+), /.exec(lines[0]), a = N(m[1]), st = N(m[2]) - a; [0, 1, 2].forEach(i => { if (ans(i) !== a + (i + 2) * st) err(id, L, 'Schritt', q); }); if (Math.abs(st) !== N(/in ([\d ]+)er-Schritten/.exec(strip(q.title))[1])) err(id, L, 'Schrittweite', q); if (A.some(x => N(x) < 0)) err(id, L, 'negativ', q); break; }
      case 'B2.stufen': { let v = N(lines[0]); lines.slice(1).forEach((ln, i) => { const m = /^([+−]) ([\d ]+) → \[\[(\d+)\]\]$/.exec(ln); v = m[1] === '+' ? v + N(m[2]) : v - N(m[2]); if (v !== ans(+m[3]) || v < 0) err(id, L, 'Stufe', q); }); break; }
      case 'B3.tue': { let m; if ((m = /^(\d+) T \+ (\d+) E = \[\[0\]\]$/.exec(lines[0]))) { if (+m[1] * 1000 + +m[2] !== ans(0)) err(id, L, 'T+E', q); } else { const n = N(/^([\d ]+) =/.exec(lines[0])[1]); if (ans(0) * 1000 + ans(1) !== n || ans(1) > 999 || ans(2) !== ans(0) * 1000 || ans(3) !== ans(1)) err(id, L, 'zerlegen', q); } break; }
      case 'B3.teilen': { let m; if ((m = /^([\d ]+) : (\d+) = \[\[0\]\]$/.exec(lines[0]))) { if (N(m[1]) / +m[2] !== ans(0)) err(id, L, 'teilen', q); }
        else { const t = lines[0], V = { Einer: 1, Zehner: 10, Hunderter: 100, Tausender: 1000, Zehntausender: 1e4, Hunderttausender: 1e5, Million: 1e6 }; const mm = /^Wie viele (\w+) hat (?:ein|die) (\w+)\?$/.exec(t); const exp = mm ? V[mm[2]] / V[mm[1]] : -1; if (exp !== ans(0)) err(id, L, 'wie viele ' + t, q); } break; }
      case 'B3.haus': { const R = N(lines[0]); lines.slice(1).forEach(ln => { const m = /^(\d+) · \[\[(\d+)\]\]$/.exec(ln); if (+m[1] * ans(+m[2]) !== R) err(id, L, 'Haus', q); }); break; }
      case 'B3.laender': {
        if (!q.fields) { const most = /meisten/.test(q.title), shown = [...q.prompt.matchAll(/<b>([^<]+)<\/b> ([\d ]+)/g)].map(x => [x[1], N(x[2])]);
          shown.forEach(([n, v]) => { const d = BL.find(b => b[0] === n); if (!d || d[1] !== v) err(id, L, 'Daten ' + n, q); });
          const best = shown.slice().sort((a, b) => most ? b[1] - a[1] : a[1] - b[1])[0][0]; if (ch !== best) err(id, L, 'Land', q); }
        else if (q.fields.length === 1) { const n = N(/^([\d ]+) ≈/.exec(lines[1])[1]); if (roundTo(n, 1e6) / 1e6 !== ans(0)) err(id, L, 'Mio', q); }
        else { const [a, b] = [...H.matchAll(/: ([\d ]+)/g)].map(x => N(x[1])); if (ans(0) !== roundTo(a, 1e6) / 1e6 || ans(1) !== roundTo(b, 1e6) / 1e6 || ans(2) !== ans(0) + ans(1)) err(id, L, 'Summe Mio', q); }
        break; }
      case 'B3.rundM': { const n = N(/^([\d ]+) ≈/.exec(lines[0])[1]); if (roundTo(n, 1e6) / 1e6 !== ans(0)) err(id, L, 'Mio', q); break; }
      case 'B3.rundT': { const n = N(/^([\d ]+) ≈/.exec(lines[0])[1]); if (roundTo(n, 1000) !== ans(0)) err(id, L, 'T', q); break; }
      case 'B3.mitrund': { const [a, b] = [...H.matchAll(/: ([\d ]+)(?:\n|$)/g)].map(x => N(x[1])), op = /\]\] ([+−]) \[\[/.exec(lines[lines.length - 1])[1];
        if (ans(0) !== roundTo(a, 1000) || ans(1) !== roundTo(b, 1000) || ans(2) !== (op === '+' ? ans(0) + ans(1) : ans(0) - ans(1)) || ans(2) < 0) err(id, L, 'gerundet', q); break; }
      case 'B4.einkauf': case 'B5.tabelle': case 'B6.korb': {
        const items = [...(q.html || q.prompt).matchAll(/<li><b>[^<]+<\/b> ([^<]+)<\/li>/g)].map(x => W(x[1])), s = items.reduce((a, b) => a + b, 0);
        if (q.fields) {
          if (id === 'B5.tabelle') { const d = String(s).padStart(4, '0'); if (A.slice(0, 4).join('') !== d || W(A[4] + ' kg') !== s) err(id, L, 'Tabelle', q); }
          else if (q.fields.length === 2) { if (ans(0) * 1000 + ans(1) !== s || ans(1) > 999) err(id, L, 'kg g', q); }
          else if (ans(0) !== s) err(id, L, 'Summe g', q);
        } else if (/Tüte/.test(q.title)) { if (ch !== (s <= 5000 ? '5-kg-Tüte' : '7-kg-Tüte')) err(id, L, 'Tüte', q); }
        else { const c = W(ch.replace('etwa ', '')); if (c !== roundTo(s, 1000)) err(id, L, 'ungefähr', q); }
        break; }
      case 'B4.tonne': {
        let m;
        if (q.fields && (m = /^([\d ]+) kg = \[\[0\]\] t$/.exec(lines[0]))) { if (N(m[1]) !== ans(0) * 1000) err(id, L, 'kg→t', q); }
        else if (q.fields && (m = /^(\d+) t = \[\[0\]\] kg$/.exec(lines[0]))) { if (+m[1] * 1000 !== ans(0)) err(id, L, 't→kg', q); }
        else if (q.fields) { const w = +/wiegt (\d+) kg/.exec(H)[1], t = +/zusammen (\d+) t/.exec(H)[1]; if (ans(0) * w !== t * 1000) err(id, L, '1 t', q); }
        else if (/Klasse/.test(q.title)) { const m2 = /sind (\d+) Kinder, jedes wiegt etwa (\d+) kg/.exec(q.title), tot = m2[1] * m2[2]; if (ch !== (tot > 1000 ? 'mehr als das Auto' : tot === 1000 ? 'genau so viel' : 'weniger als das Auto')) err(id, L, 'Klasse', q); }
        else { const o = /wiegt man (.+)\?/.exec(H)[1].replace(/^(ein|eine|einen) /, ''); const T = ['Lastwagen', 'Schiff', 'Bagger', 'Elefanten', 'Zug', 'Flugzeug', 'Wal', 'Kran', 'Bus', 'Lokomotive', 'Traktor', 'Containerschiff'].includes(o); if ((ch === 'Tonne (t)') !== T) err(id, L, 'kg/t ' + o, q); }
        break; }
      case 'B4.waage': { if (/höchstens/.test(q.title)) { const m = /höchstens ([^.]+)\. Kann man damit .* \(([^)]+)\) wiegen/.exec(q.title); if ((W(m[2]) <= W(m[1])) !== (ch === 'ja')) err(id, L, 'Messgrenze', q); } break; }
      case 'B5.gkg': case 'B5.kgt': {
        const v = W(lines[0].split(' = ')[0]);
        lines.forEach(ln => { const rhs = ln.split(' = ')[1]; let m;
          if ((m = /^\[\[(\d+)\]\] (g|kg|t)$/.exec(rhs))) { if (W(A[+m[1]] + ' ' + m[2]) !== v) err(id, L, 'Umrechnung ' + ln, q); }
          else if ((m = /^\[\[(\d+)\]\] (kg|t) \[\[(\d+)\]\] (g|kg)$/.exec(rhs))) { if (ans(+m[1]) * FU[m[2]] + ans(+m[3]) * FU[m[4]] !== v || ans(+m[3]) * FU[m[4]] >= FU[m[2]]) err(id, L, 'gemischt ' + ln, q); }
          else err(id, L, 'Form? ' + ln, q); });
        break; }
      case 'B5.ordnen': { const ws = q.choices.map(c => W(c)), want = /leichtesten/.test(q.title) ? Math.min(...ws) : Math.max(...ws); if (ws[q.correct] !== want || ws.filter(x => x === want).length > 1) err(id, L, 'ordnen', q); break; }
      case 'B5.gleich': { const v = W(strip(q.prompt)); q.choices.forEach((c, i) => { if ((W(c) === v) !== (i === q.correct)) err(id, L, 'gleich ' + c, q); }); break; }
      case 'B5.lkw': { const s = [...q.html.matchAll(/<span>([^<]+)<\/span>/g)].reduce((a, x) => a + W(x[1]), 0); if (W(A[0] + ' t') !== s) err(id, L, 'LKW', q); break; }
      case 'B5.beisp': { if (/Tim sagt/.test(q.title) && ch !== 'Beide sind gleich schwer.') err(id, L, 'Sand', q); break; }
      case 'B6.ergaenz': { const m = /^([\d ]+) (g|kg) \+ \[\[0\]\] (g|kg) = (.+)$/.exec(lines[0]); if (N(m[1]) * FU[m[2]] + ans(0) * FU[m[3]] !== W(m[4])) err(id, L, 'ergänzen', q); break; }
      case 'B6.fahrzeug': { const v = [...q.html.matchAll(/<td>(\[\[0\]\]|[\d ]+) kg<\/td>/g)].map(x => x[1] === '[[0]]' ? ans(0) : N(x[1])); if (v[1] + v[2] !== v[0] || v[2] <= 0) err(id, L, 'Gesamt', q); break; }
      case 'B6.personen': { if (q.fields) { const m = /Nutzlast ([^.]+)\./.exec(H), per = +/rechnet man (\d+) kg/.exec(H)[1]; const gr = W(m[1].trim()); if (Math.floor(gr / (per * 1000)) !== ans(0)) err(id, L, 'Personen', q); }
        else { const vs = [...q.prompt.matchAll(/<b>([^<]+)<\/b> Nutzlast ([^<]+)</g)].map(x => [x[1], W(x[2])]), want = /meisten/.test(q.title) ? Math.max(...vs.map(v => v[1])) : Math.min(...vs.map(v => v[1])); if (vs.find(v => v[0] === ch)[1] !== want) err(id, L, 'Nutzlast', q); } break; }
      case 'B6.saecke': { const t = +/(\d+) t /.exec(H)[1], s = +/je (\d+) kg/.exec(H)[1]; if (ans(0) * s !== t * 1000) err(id, L, 'Säcke', q); break; }
      case 'B6.papier': { const d = +/etwa (\d+) g/.exec(H)[1], p = /mit (\d+) Personen/.exec(H), days = /einer Woche/.test(H) ? 7 : /zwei Wochen/.test(H) ? 14 : +/in (\d+) Tagen/.exec(H)[1], g = d * days * (p ? +p[1] : 1); if (ans(0) !== g || W(A[1] + ' kg') !== g) err(id, L, 'Papier', q); break; }
      case 'B6.fett': {
        const bars = [...(q.html || q.prompt).matchAll(/class="ft-n">([^<]+)<\/text>.*?class="ft-v">(\d+) g</g)].map(x => [x[1], +x[2]]);
        bars.forEach(([n, v]) => { const d = FETT.find(f => f[0] === n); if (!d || d[1] !== v) err(id, L, 'Fettdaten ' + n, q); });
        if (!q.fields) { const most = /meisten/.test(q.title), want = most ? Math.max(...bars.map(b => b[1])) : Math.min(...bars.map(b => b[1])); if (bars.find(b => b[0] === ch)[1] !== want) err(id, L, 'Fett wahl', q); }
        else if (/Kästchen/.test(H)) { const n = /für ([^?]+)\?/.exec(H)[1].trim(), v = bars.find(b => b[0] === n)[1]; if (roundTo(v, 10) / 10 !== ans(0) || v % 10 === 5) err(id, L, 'Kästchen', q); }
        else { const m = /hat ([^?]+?) mehr als ([^?]+)\?/.exec(H); const a = bars.find(b => b[0] === m[1].trim())[1], b = bars.find(b => b[0] === m[2].trim())[1]; if (a - b !== ans(0) || a - b <= 0) err(id, L, 'Fett mehr', q); }
        break; }
    }
  } catch (e) { err(id, L, 'Prüfung abgestürzt: ' + e.message, q); }
}
/* Zahlwörter: Stichproben, die man von Hand kennt */
const NW = ctx.numWord || vm.runInContext('numWord', ctx);
[[1, 'eins'], [21, 'einundzwanzig'], [101, 'einhunderteins'], [1000, 'eintausend'], [330434, 'dreihundertdreißigtausendvierhundertvierunddreißig'], [819012, 'achthundertneunzehntausendzwölf'], [505099, 'fünfhundertfünftausendneunundneunzig'], [13303, 'dreizehntausenddreihundertdrei'], [7958000, 'sieben Millionen neunhundertachtundfünfzigtausend'], [1000000, 'eine Million'], [201001, 'zweihunderteintausendeins'], [16717, 'sechzehntausendsiebenhundertsiebzehn']]
  .forEach(([n, w]) => { const got = strip(NW(n)); if (got !== w) errors.push(`numWord(${n}) = ${got}, erwartet ${w}`); });
/* Daten aus dem Arbeitsheft */
if (BL.length !== 16 || BL.find(b => b[0] === 'Nordrhein-Westfalen')[1] !== 17845000 || BL.find(b => b[0] === 'Bremen')[1] !== 661000) errors.push('Bundesländer-Daten');
if (SPORT.dlv[1].j14 !== 131642 || SPORT.dtb[1].m99 !== 187223) errors.push('Sport-Daten');
console.log('Kapitel-B-Aufgaben geprüft:', count);
if (errors.length) { const g = {}; errors.forEach(e => { const k = e.split('\n')[0].replace(/[\d.]+/g, '#'); if (!g[k]) g[k] = e; }); console.log(Object.values(g).slice(0, 40).join('\n')); console.log('FEHLER:', errors.length); process.exit(1); }
console.log('KAPITEL B: ALLE PRÜFUNGEN BESTANDEN');
