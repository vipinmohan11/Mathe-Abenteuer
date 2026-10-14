/* =====================================================================
   VENOLA HOLMES · Kriminalfall: fünf Arten von Logik-Rätseln, jedes aus einem Startwert (Seed) erzeugt.
   Gleicher Seed = gleiches Rätsel (so lassen sich gelöste Fälle im Verlauf wieder ansehen).
   Jedes Rätsel hat genau EINE Lösung (per Programm geprüft) und bringt seinen Lösungsweg („Wie komme ich darauf?“) selbst mit.
     lie  – Wer lügt?          Aussagen über Aussagen, eine feste Regel (genau eine/zwei Wahrheiten)
     grid – Alibi-Gitter       Personen × Räume, Hinweise → wer war im Tatort-Raum
     time – Zeitleiste         Ereignisse mit Zeitabständen, Alibis → wer hat keine lückenlose Unschuld
     wit  – Widerspruch        Zeugen sahen den Dieb an Orten – wessen Aussage passt nicht (Gehzeiten)
     ein  – Einstein-Rätsel    Häuser in einer Reihe, mehrere Eigenschaften, Hinweise → eine gesuchte Eigenschaft
   Rückgabe von vnGen*(lv, r): { t, title, body (HTML), q (Frage), kind: 'choice', opts: [..], ans: Index, ex: [Zeilen] }
   ===================================================================== */
const VN_PEOPLE = ['Anna', 'Ben', 'Clara', 'David', 'Emil', 'Fiona', 'Gustav', 'Hanna', 'Ida', 'Jonas', 'Kira', 'Leon', 'Mara', 'Nico'];
const VN_LOOT = ['Der Rubin', 'Das Gemälde', 'Die Goldmünze', 'Der Silberlöffel', 'Die Schatzkarte', 'Das Fernglas', 'Der Diamant', 'Die Kristallkugel', 'Die Geburtstagstorte', 'Der Tresorschlüssel'];
const VN_ROOMS = [['Bibliothek', 'in der'], ['Küche', 'in der'], ['Garten', 'im'], ['Keller', 'im'], ['Dachboden', 'auf dem'], ['Werkstatt', 'in der'], ['Salon', 'im'], ['Garage', 'in der'], ['Gewächshaus', 'im'], ['Musikzimmer', 'im'], ['Waschküche', 'in der'], ['Speisekammer', 'in der']];
const vnRi = (r, n) => Math.floor(r() * n);
const vnT = m => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const vnList = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' und ' + a[a.length - 1];
const vnPop = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
const vnCap = s => s.charAt(0).toUpperCase() + s.slice(1);
const vnRoomT = rm => rm[1] + ' ' + rm[0];
/* Beweis-Frage: nach der richtigen Antwort muss das Kind zeigen, dass es den Fall wirklich gelöst hat (Raten reicht nicht).
   Eigener Zufall aus den Rätseldaten, damit das Rätsel selbst gleich bleibt. Rückgabe { q, opts, ans } */
const vnPfR = (...k) => pzRng(pzSeed('pf' + k.join('|')));
const vnPfMix = (right, wrong, r) => { const o = pzShuf([right].concat(wrong), r); return { opts: o, ans: o.indexOf(right) }; };
function vnDur(d) {
  if (d === 1) return 'eine Minute'; if (d === 15) return 'eine Viertelstunde'; if (d === 30) return 'eine halbe Stunde'; if (d === 45) return 'eine Dreiviertelstunde'; if (d === 60) return 'eine Stunde';
  if (d > 60) { const h = Math.floor(d / 60), m = d % 60; return (h === 1 ? 'eine Stunde' : h + ' Stunden') + (m ? ' und ' + (m === 1 ? 'eine Minute' : m + ' Minuten') : ''); }
  return d + ' Minuten';
}

/* ===================== 1) Wer lügt? ===================== */
function vnLieEval(s, c, m) {
  switch (s.k) {
    case 'is': return c === s.j; case 'not': return c !== s.j;
    case 'lies': return !((m >> s.j) & 1); case 'truth': return !!((m >> s.j) & 1);
    default: return c === s.a || c === s.b;
  }
}
function vnLieSols(S, n, R) {      // alle (Täter, Wahrheitsmaske), die zu den Sätzen passen; R = nötige Zahl der Wahrheiten (null = egal)
  const out = [];
  for (let c = 0; c < n; c++) for (let m = 0; m < (1 << n); m++) {
    let ok = true; for (let i = 0; i < n; i++) if (vnLieEval(S[i], c, m) !== !!((m >> i) & 1)) { ok = false; break; }
    if (ok && (R === null || vnPop(m) === R)) out.push([c, m]);
  }
  return out;
}
function vnLieStmt(i, n, r) {
  const x = r(), oth = () => { let j; do j = vnRi(r, n); while (j === i); return j; };
  if (x < .28) return { k: 'is', j: oth() };
  if (x < .5) return { k: 'not', j: r() < .4 ? i : oth() };
  if (x < .74) return { k: 'lies', j: oth() };
  if (x < .86) return { k: 'truth', j: oth() };
  const a = vnRi(r, n); let b; do b = vnRi(r, n); while (b === a); return { k: 'either', a, b };
}
function vnGenLie(lv, r) {
  const n = [5, 5, 6, 6, 7][lv - 1], rule = lv < 3 ? (r() < .5 ? 'one' : 'oneLie') : lv < 5 ? ['one', 'oneLie', 'two'][vnRi(r, 3)] : 'three', R = rule === 'one' ? 1 : rule === 'oneLie' ? n - 1 : rule === 'two' ? 2 : 3;
  const N = pzShuf(VN_PEOPLE, r).slice(0, n), minRef = [1, 2, 2, 3, 3][lv - 1], loot = VN_LOOT[vnRi(r, VN_LOOT.length)];
  const txt = (s, i) => { switch (s.k) { case 'is': return `${N[s.j]} war es.`; case 'not': return s.j === i ? 'Ich war es nicht.' : `${N[s.j]} war es nicht.`; case 'lies': return `${N[s.j]} lügt.`; case 'truth': return `${N[s.j]} sagt die Wahrheit.`; default: return `Es war ${N[s.a]} oder ${N[s.b]}.`; } };
  for (let tries = 0; tries < 6000; tries++) {
    const S = []; for (let i = 0; i < n; i++) S.push(vnLieStmt(i, n, r));
    if (S.filter(s => s.k === 'lies' || s.k === 'truth').length < minRef) continue;
    const sols = vnLieSols(S, n, R); if (sols.length !== 1) continue;
    const ans = sols[0][0], all = vnLieSols(S, n, null);
    const ruleT = rule === 'one' ? 'Genau eine Person sagt die Wahrheit, alle anderen lügen.' : rule === 'oneLie' ? 'Genau eine Person lügt, alle anderen sagen die Wahrheit.' : rule === 'two' ? 'Genau zwei Personen sagen die Wahrheit, alle anderen lügen.' : 'Genau drei Personen sagen die Wahrheit, alle anderen lügen.';
    const ex = [`Regel: ${ruleT}`, 'Probiere der Reihe nach jede Person als Täter durch und zähle, wer dann die Wahrheit sagen würde. Aussagen wie „X lügt“ musst du dabei mit den Aussagen von X zusammen prüfen.'];
    for (let c = 0; c < n; c++) {
      const L = all.filter(x => x[0] === c);
      if (!L.length) ex.push(`Wäre ${N[c]} der Täter: Die Aussagen widersprechen sich selbst (zum Beispiel sagt jemand „X lügt“, obwohl X dann stimmt). Das geht nicht.`);
      else L.slice(0, 2).forEach(x => { const tr = N.filter((_, i) => (x[1] >> i) & 1), k = tr.length; ex.push(`Wäre ${N[c]} der Täter: Es sprächen ${k === 0 ? 'niemand' : vnList(tr)} die Wahrheit – das ${k === 1 ? 'ist 1 Person' : 'sind ' + k + ' Personen'}, erlaubt ${R === 1 ? 'ist 1' : 'sind ' + R}. ${k === R ? 'Das passt!' : 'Das passt nicht.'}`); });
    }
    ex.push(`Nur bei ${N[ans]} passt alles. ${N[ans]} ist der Täter.`);
    const mk = sols[0][1], tr = N.filter((_, i) => (mk >> i) & 1), lr = N.filter((_, i) => !((mk >> i) & 1)), rp = vnPfR('lie', N.join(), ans, mk);
    let pf;
    if (R === 1) pf = Object.assign({ q: 'Beweise es: Wer sagt dann die Wahrheit?' }, vnPfMix(tr[0], N.filter(x => x !== tr[0]), rp));
    else if (R === n - 1) pf = Object.assign({ q: 'Beweise es: Wer lügt dann?' }, vnPfMix(lr[0], N.filter(x => x !== lr[0]), rp));
    else { const key = vnList(tr), wr = new Set(); for (let k = 0; k < 80 && wr.size < 3; k++) { const t = vnList(pzShuf(N, rp).slice(0, R).sort((a, b) => N.indexOf(a) - N.indexOf(b))); if (t !== key) wr.add(t); } pf = Object.assign({ q: `Beweise es: Welche ${R} Personen sagen dann die Wahrheit?` }, vnPfMix(key, [...wr], rp)); }
    ex.push(`Beweis: Wenn ${N[ans]} der Täter ist, ${tr.length === 1 ? 'sagt nur ' + tr[0] : 'sagen ' + vnList(tr)} die Wahrheit${lr.length ? ' und ' + (lr.length === 1 ? lr[0] + ' lügt' : vnList(lr) + ' lügen') : ''}.`);
    return { pf, t: 'lie', title: 'Wer lügt?', body: `<p>${esc(loot)} wurde gestohlen. Der Täter ist unter diesen ${n} Verdächtigen. Jeder sagt einen Satz.</p><ul class="vn-st">${S.map((s, i) => `<li><b>${esc(N[i])}:</b> „${esc(txt(s, i))}“</li>`).join('')}</ul><p class="vn-rule">${esc(ruleT)}</p>`, q: 'Wer ist der Täter?', kind: 'choice', opts: N, ans, ex };
  }
  return null;
}

/* ===================== 2) Alibi-Gitter ===================== */
const vnGridText = (c, N, RM) => c.k === 'in' ? `${N[c.p]} war ${vnRoomT(RM[c.r])}.` : c.k === 'notin' ? `${N[c.p]} war nicht ${vnRoomT(RM[c.r])}.` : c.k === 'either' ? `${N[c.p]} war entweder ${vnRoomT(RM[c.r[0]])} oder ${vnRoomT(RM[c.r[1]])}.` : `Weder ${N[c.ps[0]]} noch ${N[c.ps[1]]} war ${vnRoomT(RM[c.r])}.`;
function vnGridProp(n, clues, N, RM) {
  const M = Array.from({ length: n }, () => Array(n).fill(true)), log = [], rc = p => M[p].filter(Boolean).length;
  clues.forEach((c, idx) => {
    const tag = `Hinweis ${idx + 1}: `;
    if (c.k === 'in') { for (let x = 0; x < n; x++) if (x !== c.r) M[c.p][x] = false; for (let q = 0; q < n; q++) if (q !== c.p) M[q][c.r] = false; log.push(tag + `${N[c.p]} ist sicher ${vnRoomT(RM[c.r])}. Dort kann also sonst niemand gewesen sein.`); }
    else if (c.k === 'notin') { M[c.p][c.r] = false; log.push(tag + `${N[c.p]} scheidet für ${RM[c.r][0]} aus.`); }
    else if (c.k === 'either') { for (let x = 0; x < n; x++) if (!c.r.includes(x)) M[c.p][x] = false; log.push(tag + `${N[c.p]} kommt nur für ${RM[c.r[0]][0]} und ${RM[c.r[1]][0]} infrage.`); }
    else { c.ps.forEach(p => { M[p][c.r] = false; }); log.push(tag + `${N[c.ps[0]]} und ${N[c.ps[1]]} scheiden für ${RM[c.r][0]} aus.`); }
  });
  let ch = true;
  while (ch) {
    ch = false;
    for (let p = 0; p < n; p++) if (rc(p) === 1) { const r = M[p].indexOf(true); for (let q = 0; q < n; q++) if (q !== p && M[q][r]) { M[q][r] = false; ch = true; log.push(`${N[p]} bleibt nur ${RM[r][0]} übrig – also kann ${N[q]} dort nicht sein.`); } }
    for (let r = 0; r < n; r++) { const ps = []; for (let p = 0; p < n; p++) if (M[p][r]) ps.push(p); if (ps.length === 1 && rc(ps[0]) > 1) { const p = ps[0]; for (let x = 0; x < n; x++) if (x !== r) M[p][x] = false; ch = true; log.push(`${RM[r][0]}: Nur ${N[p]} kann noch dort gewesen sein – also war ${N[p]} dort.`); } }
  }
  const solved = M.every((row, p) => rc(p) === 1) && [...Array(n).keys()].every(r => M.filter(row => row[r]).length === 1);
  return { solved, log, M };
}
function vnGenGrid(lv, r) {
  const n = [4, 5, 5, 6, 6][lv - 1], hs = [1, 1, 2, 3, 3][lv - 1], N = pzShuf(VN_PEOPLE, r).slice(0, n), RM = pzShuf(VN_ROOMS, r).slice(0, n), perm = pzShuf([...Array(n).keys()], r), hour = 13 + vnRi(r, 7), loot = VN_LOOT[vnRi(r, VN_LOOT.length)];
  const tgt = vnRi(r, n), ansP = perm.indexOf(tgt);
  for (let tries = 0; tries < 400; tries++) {
    const pool = [];
    for (let p = 0; p < n; p++) for (let rm = 0; rm < n; rm++) {
      if (perm[p] !== rm) { pool.push({ k: 'notin', p, r: rm }); pool.push({ k: 'either', p, r: [perm[p], rm].sort(() => r() - .5) }); }
    }
    for (let rm = 0; rm < n; rm++) { const no = [...Array(n).keys()].filter(p => perm[p] !== rm); for (let k = 0; k < 3; k++) { const a = pzShuf(no, r); pool.push({ k: 'none', r: rm, ps: [a[0], a[1]] }); } }
    const sh = pzShuf(pool, r);
    let acc = [], ok = false;
    for (const c of sh) { acc.push(c); if (vnGridProp(n, acc, N, RM).solved) { ok = true; break; } }
    if (!ok) continue;
    for (const c of pzShuf(acc.slice(), r)) { const t = acc.filter(x => x !== c); if (vnGridProp(n, t, N, RM).solved) acc = t; }
    acc = pzShuf(acc, r);
    const pr = vnGridProp(n, acc, N, RM); if (pr.log.filter(x => x.includes(': Nur ')).length < (tries < 250 ? hs : 0)) continue;
    const ex = ['Lege dir ein Gitter an: oben die Räume, links die Personen. Streiche jeden Hinweis ab, dann füllt sich der Rest von selbst.'].concat(pr.log.slice(0, 16));
    if (pr.log.length > 16) ex.push('… und so weiter, bis jede Person genau einen Raum hat.');
    ex.push(`Ergebnis: ${N.map((x, p) => `${x} → ${RM[perm[p]][0]}`).join(', ')}. ${vnRoomT(RM[tgt])} war ${N[ansP]}.`);
    const rp = vnPfR('grid', N.join(), perm.join()), direct = new Set(acc.filter(c => c.k === 'in').map(c => c.p)), cand = [...Array(n).keys()].filter(q => q !== ansP && !direct.has(q)), pp = (cand.length ? cand : [...Array(n).keys()].filter(q => q !== ansP))[vnRi(rp, cand.length || n - 1)];
    const pf = Object.assign({ q: `Beweise es: In welchem Raum war ${N[pp]}?` }, vnPfMix(RM[perm[pp]][0], RM.filter((x, i) => i !== perm[pp]).map(x => x[0]), rp));
    return { pf, t: 'grid', title: 'Alibi-Gitter', body: `<p>Um ${hour} Uhr verschwand ${esc(loot.replace(/^(Der|Die|Das)/, m => m.toLowerCase()))} ${esc(vnRoomT(RM[tgt]))}. Zu dieser Zeit waren ${n} Verdächtige in ${n} verschiedenen Räumen – jeder in einem eigenen: ${esc(vnList(RM.map(x => x[0])))}.</p><ul class="vn-st">${acc.map(c => `<li>${esc(vnGridText(c, N, RM))}</li>`).join('')}</ul>`, q: `Wer war um ${hour} Uhr ${vnRoomT(RM[tgt])}?`, kind: 'choice', opts: N, ans: ansP, ex, dbg: { n, perm, clues: acc } };
  }
  return null;
}

/* ===================== 3) Zeitleiste ===================== */
const VN_EVT = [{ n: 'Hundegebell', g: 'n' }, { n: 'Glockenschlag der Turmuhr', g: 'm' }, { n: 'Anruf bei der Polizei', g: 'm' }, { n: 'Sirenengeheul', g: 'n' }, { n: 'Regenschauer', g: 'm' }, { n: 'Alarm', g: 'm' }, { n: 'Lieferwagen vor dem Haus', g: 'm' }];
const vnNom = e => ({ m: 'Der ', f: 'Die ', n: 'Das ' }[e.g]) + e.n, vnDat = e => ({ m: 'dem ', f: 'der ', n: 'dem ' }[e.g]) + e.n;
function vnGenTime(lv, r) {
  const m = [4, 5, 6, 7, 8][lv - 1], n = [4, 4, 5, 5, 6][lv - 1];
  const evs = [{ n: 'Stromausfall', g: 'm' }, { n: 'Einbruch', g: 'm' }, { n: 'Flucht des Täters', g: 'f' }].concat(pzShuf(VN_EVT, r).slice(0, m - 3));
  const T0 = 18 * 60 + vnRi(r, 330), tt = [T0]; tt[1] = T0 + 4 + vnRi(r, 32); tt[2] = tt[1] + 12 + vnRi(r, 34);
  for (let i = 3; i < m; i++) { let t; do t = T0 - 15 + vnRi(r, tt[2] - T0 + 50); while (tt.includes(t)); tt[i] = t; }
  const order = [0].concat(pzShuf([...Array(m - 1).keys()].map(x => x + 1), r)), clues = [], steps = [];
  order.slice(1).forEach((e, k) => {
    const ref = order[vnRi(r, k + 1)], d = Math.abs(tt[e] - tt[ref]), after = tt[e] > tt[ref];
    clues.push(`${vnNom(evs[e])} kam ${vnDur(d)} ${after ? 'nach' : 'vor'} ${vnDat(evs[ref])}.`);
    steps.push(`${evs[e].n}: ${evs[ref].n} (${vnT(tt[ref])}) ${after ? '+' : '−'} ${d} Min → ${vnT(tt[e])} Uhr`);
  });
  const E = tt[1], X = tt[2], gap = [[8, 14], [6, 10], [4, 7], [3, 5], [2, 4]][lv - 1], N = pzShuf(VN_PEOPLE, r).slice(0, n), cu = vnRi(r, n);
  const places = pzShuf(['im Kino', 'beim Training', 'im Restaurant', 'in der Bibliothek', 'beim Friseur', 'im Schwimmbad', 'beim Zahnarzt', 'im Café'], r), al = [];
  for (let i = 0; i < n; i++) {
    let a, b;
    if (i === cu) { const g = gap[0] + vnRi(r, gap[1] - gap[0] + 1); if (r() < .5) { a = E + g; b = X + vnRi(r, 20); } else { a = E - vnRi(r, 20); b = X - g; } }
    else { a = E - (lv >= 3 && r() < .3 ? 0 : vnRi(r, 22)); b = X + (lv >= 3 && r() < .3 ? 0 : vnRi(r, 22)); }
    al.push([a, b]);
  }
  const ex = [`Zuerst die Uhrzeiten rechnen:`, `Stromausfall: ${vnT(T0)} Uhr (gegeben).`].concat(steps);
  ex.push(`Der Einbrecher war im Haus von ${vnT(E)} bis ${vnT(X)} Uhr.`);
  al.forEach((x, i) => ex.push(`${N[i]}: ${vnT(x[0])}–${vnT(x[1])} Uhr ${places[i]}. ${x[0] <= E && x[1] >= X ? 'Deckt die ganze Zeit ab ✔' : `Deckt ${x[0] > E ? 'den Anfang (' + vnT(E) + '–' + vnT(x[0]) + ')' : 'das Ende (' + vnT(x[1]) + '–' + vnT(X) + ')'} nicht ab ✘`}`));
  ex.push(`Nur ${N[cu]} hat kein lückenloses Alibi.`);
  const rp = vnPfR('time', N.join(), tt.join()), pf = Object.assign({ q: 'Beweise es: Um wie viel Uhr kam der Einbrecher ins Haus?' }, vnPfMix(vnT(E) + ' Uhr', pzShuf(tt.filter(t => t !== E), rp).slice(0, 3).map(t => vnT(t) + ' Uhr'), rp));
  const body = `<p>Im Museum wurde eingebrochen. Ein Einbrecher war vom Einbruch bis zu seiner Flucht im Haus. Das weißt du über den Abend:</p><ul class="vn-st"><li>${vnNom(evs[0])} war um ${vnT(T0)} Uhr.</li>${clues.map(c => `<li>${esc(c)}</li>`).join('')}</ul><p>Das sagen die Verdächtigen (alle Angaben sind von Zeugen bestätigt):</p><ul class="vn-st">${al.map((x, i) => `<li><b>${esc(N[i])}:</b> „Ich war von ${vnT(x[0])} bis ${vnT(x[1])} Uhr ${places[i]}.“</li>`).join('')}</ul>`;
  return { t: 'time', title: 'Zeitleiste', body, q: 'Wer hat für die ganze Zeit, in der der Einbrecher im Haus war, kein lückenloses Alibi?', kind: 'choice', opts: N, ans: cu, ex, pf };
}

/* ===================== 4) Widerspruch (Zeugen) ===================== */
const VN_SPOTS = [['Tor', 'am'], ['Brunnen', 'am'], ['Markt', 'auf dem'], ['Brücke', 'auf der'], ['Park', 'im'], ['Bahnhof', 'am'], ['Kirche', 'an der'], ['Hafen', 'am'], ['Schule', 'an der']];
function vnGenWit(lv, r) {
  const Lp = [6, 6, 7, 8, 8][lv - 1], W = [4, 4, 5, 5, 6][lv - 1], per = [2, 2, 2, 2, 2][lv - 1];
  for (let tries = 0; tries < 1500; tries++) {
    const sp = pzShuf(VN_SPOTS, r).slice(0, Lp), seg = [], d = [0];
    for (let i = 1; i < Lp; i++) { seg.push(3 + vnRi(r, 7)); d.push(d[i - 1] + seg[i - 1]); }
    const t0 = (9 + vnRi(r, 12)) * 60 + vnRi(r, 55), T = [t0]; for (let i = 1; i < Lp; i++) T.push(T[i - 1] + seg[i - 1] + vnRi(r, 4));
    const N = pzShuf(VN_PEOPLE, r).slice(0, W), fw = vnRi(r, W), S = [];
    let cyc = []; for (let w = 0; w < W; w++) { if (cyc.length < per) cyc = cyc.concat(pzShuf([...Array(Lp).keys()], r)); const idx = cyc.splice(0, per).sort((a, b) => a - b); S.push(idx.map(k => ({ p: k, t: T[k] }))); }
    const fi = vnRi(r, per), j = vnRi(r, Lp), fp = vnRi(r, Lp); S[fw][fi] = { p: fp, t: T[j] + vnRi(r, 31) - 15, bad: true };
    const conf = (a, b) => Math.abs(a.t - b.t) < Math.abs(d[a.p] - d[b.p]), flat = (skip) => S.flatMap((s, w) => w === skip ? [] : s.map(x => Object.assign({ w }, x)));
    const okW = []; for (let w = 0; w < W; w++) { const f = flat(w); let bad = false; for (let i = 0; i < f.length && !bad; i++) for (let k = i + 1; k < f.length; k++) if (conf(f[i], f[k])) { bad = true; break; } if (!bad) okW.push(w); }
    if (okW.length !== 1 || okW[0] !== fw) continue;
    const f0 = flat(-1), bs = S[fw][fi], cf = f0.filter(x => x.w !== fw && conf(bs, x)), ws = new Set(cf.map(x => x.w)); if (ws.size < 2) continue;
    const spot = k => `${sp[k][1]} ${sp[k][0]}`, stm = x => `um ${vnT(x.t)} Uhr ${spot(x.p)}`;
    const ex = ['Der Dieb kann nicht schneller sein als die Gehzeit zwischen zwei Orten. Prüfe jedes Paar von Aussagen: Reicht die Zeit dazwischen?'];
    cf.slice(0, 3).forEach(x => ex.push(`${N[fw]} (${stm(bs)}) und ${N[x.w]} (${stm(x)}): ${sp[bs.p][0]} ↔ ${sp[x.p][0]} braucht mindestens ${Math.abs(d[bs.p] - d[x.p])} Min, es liegen aber nur ${Math.abs(bs.t - x.t)} Min dazwischen. Das geht nicht.`));
    ex.push(`Streicht man ${N[fw]}, passen alle übrigen Aussagen zusammen. Streicht man jemand anderen, bleibt der Widerspruch bestehen. Also irrt sich ${N[fw]}.`);
    const rp = vnPfR('wit', N.join(), T.join()), all = S.flatMap((s, w) => s.map(x => `${N[w]}: ${stm(x)}`)), right = `${N[fw]}: ${stm(bs)}`;
    const pf = Object.assign({ q: `Beweise es: Welche Angabe stimmt nicht?` }, vnPfMix(right, all.filter(x => x !== right), rp));
    ex.push(`Beweis: Falsch ist die Angabe „${right}“.`);
    const way = sp.map((s, i) => i ? `${sp[i - 1][0]} → ${s[0]}: ${seg[i - 1]} Min` : '').filter(Boolean);
    return { t: 'wit', title: 'Widerspruch', body: `<p>Ein Dieb ist durch die Stadt gelaufen. Er geht zu Fuß und ist nie schneller als die Gehzeit zwischen zwei Orten. Die Orte liegen an einer Straße:</p><p class="vn-way">${esc(way.join('  ·  '))}</p><p>Das sagen die Zeugen. Genau ein Zeuge irrt sich bei einer Angabe:</p><ul class="vn-st">${S.map((s, w) => `<li><b>${esc(N[w])}:</b> „Ich sah den Dieb ${s.map(x => esc(stm(x))).join(' und ')}.“</li>`).join('')}</ul>`, q: 'Welcher Zeuge irrt sich?', kind: 'choice', opts: N, ans: fw, ex, pf };
  }
  return null;
}

/* ===================== 5) Einstein-Rätsel ===================== */
const VN_ECATS = [
  { id: 'col', lab: 'Hausfarbe', art: 'Welche', vals: ['rot', 'blau', 'grün', 'gelb', 'weiß'], np: v => `die Person im ${v}en Haus`, dat: v => `der Person im ${v}en Haus`, sh: v => `das ${v}e Haus`, show: v => vnCap(v) },
  { id: 'pet', lab: 'Haustier', art: 'Welches', vals: ['Hund', 'Katze', 'Fisch', 'Vogel', 'Hase'], g: ['dem', 'der', 'dem', 'dem', 'dem'], np: (v, i, c) => `die Person mit ${c.g[i]} ${v}`, dat: (v, i, c) => `der Person mit ${c.g[i]} ${v}`, sh: (v, i, c) => `${c.g[i] === 'der' ? 'die' : 'der'} ${v}`, show: v => v },
  { id: 'drink', lab: 'Getränk', art: 'Welches', vals: ['Tee', 'Milch', 'Saft', 'Kakao', 'Wasser'], np: v => `die Person, die ${v} trinkt`, dat: v => `der Person, die ${v} trinkt`, sh: v => v, show: v => v },
  { id: 'hob', lab: 'Hobby', art: 'Welches', vals: ['Malen', 'Lesen', 'Singen', 'Segeln', 'Schach'], vb: ['malt', 'liest', 'singt', 'segelt', 'Schach spielt'], np: (v, i, c) => `die Person, die ${c.vb[i]}`, dat: (v, i, c) => `der Person, die ${c.vb[i]}`, sh: v => v, show: v => v },
  { id: 'food', lab: 'Lieblingsessen', art: 'Welches', vals: ['Pizza', 'Nudeln', 'Suppe', 'Pfannkuchen', 'Reis'], np: v => `die Person, die gern ${v} isst`, dat: v => `der Person, die gern ${v} isst`, sh: v => v, show: v => v }
];
function vnEinProp(n, nv, catOf, clues, nameOf) {
  const dom = Array.from({ length: nv }, () => new Set([...Array(n).keys()])), log = [];
  const rel = (c, pa, pb) => c.k === 'same' ? pa === pb : c.k === 'notsame' ? pa !== pb : c.k === 'left' ? pa < pb : c.k === 'dleft' ? pa + 1 === pb : Math.abs(pa - pb) === 1;
  const show = v => [...dom[v]].map(x => x + 1).join(' oder ');
  let ch = true;
  while (ch) {
    ch = false;
    clues.forEach((c, idx) => {
      const prune = (v, keep, why) => { let ca = false; [...dom[v]].forEach(p => { if (!keep(p)) { dom[v].delete(p); ca = true; } }); if (ca) { ch = true; log.push(`Hinweis ${idx + 1}: ${nameOf(v)} → Haus ${show(v)}${dom[v].size === 1 ? ' ✔' : ''}`); } };
      if (c.k === 'pos') prune(c.a, p => p === c.x);
      else { prune(c.a, p => [...dom[c.b]].some(q => rel(c, p, q))); prune(c.b, p => [...dom[c.a]].some(q => rel(c, q, p))); }
    });
    for (let ci = 0; ci < 5; ci++) {
      const vs = []; for (let v = 0; v < nv; v++) if (catOf[v] === ci) vs.push(v); if (!vs.length) continue;
      vs.forEach(v => { if (dom[v].size === 1) { const p = [...dom[v]][0]; vs.forEach(u => { if (u !== v && dom[u].has(p)) { dom[u].delete(p); ch = true; log.push(`${nameOf(v)} wohnt in Haus ${p + 1} – also ${nameOf(u)} nicht → Haus ${show(u)}${dom[u].size === 1 ? ' ✔' : ''}`); } }); } });
      for (let p = 0; p < n; p++) { const w = vs.filter(v => dom[v].has(p)); if (w.length === 1 && dom[w[0]].size > 1) { dom[w[0]] = new Set([p]); ch = true; log.push(`Haus ${p + 1} kann nur noch zu ${nameOf(w[0])} gehören → ${nameOf(w[0])} wohnt in Haus ${p + 1} ✔`); } }
    }
  }
  return { solved: dom.every(d => d.size === 1), dom, log };
}
function vnGenEin(lv, r) {
  const n = [4, 4, 5, 5, 5][lv - 1], nc = [3, 4, 3, 4, 5][lv - 1];
  for (let tries = 0; tries < 300; tries++) {
    const cats = pzShuf([0, 1, 2, 3, 4], r).slice(0, nc), cs = cats.map(i => VN_ECATS[i]), vals = cs.map(c => pzShuf([...Array(5).keys()], r).slice(0, n));   // vals[ci] = Indizes in c.vals
    const nv = nc * n, catOf = [], pos = []; for (let ci = 0; ci < nc; ci++) { const pm = pzShuf([...Array(n).keys()], r); for (let k = 0; k < n; k++) { catOf.push(ci); pos.push(pm[k]); } }
    const vc = v => cs[catOf[v]], vi = v => vals[catOf[v]][v % n], vname = v => { const c = vc(v), i = vi(v); return c.sh(c.vals[i], i, c); };
    const np = (v, dat) => { const c = vc(v), i = vi(v); return (dat ? c.dat : c.np)(c.vals[i], i, c); };
    const pool = [];
    for (let a = 0; a < nv; a++) {
      if (lv <= 2 && r() < .5) pool.push({ k: 'pos', a, x: pos[a] });
      for (let b = 0; b < nv; b++) { if (catOf[a] === catOf[b] || a === b) continue; const pa = pos[a], pb = pos[b];
        if (a < b && pa === pb) pool.push({ k: 'same', a, b }); if (a < b && pa !== pb && r() < .25) pool.push({ k: 'notsame', a, b });
        if (pa < pb) { pool.push({ k: 'left', a, b }); if (pa + 1 === pb) pool.push({ k: 'dleft', a, b }); }
        if (a < b && Math.abs(pa - pb) === 1) pool.push({ k: 'neigh', a, b }); }
    }
    const sh = pzShuf(pool, r); let acc = [], ok = false;
    for (const c of sh) { acc.push(c); if (vnEinProp(n, nv, catOf, acc, vname).solved) { ok = true; break; } if (acc.length > 40) break; }
    if (!ok) continue;
    for (const c of pzShuf(acc.slice(), r)) { const t = acc.filter(x => x !== c); if (vnEinProp(n, nv, catOf, t, vname).solved) acc = t; }
    acc = pzShuf(acc, r);
    // Frage: Eigenschaft einer anderen Kategorie der Person mit …
    const sc = vnRi(r, nc); let tc = vnRi(r, nc - 1); if (tc >= sc) tc++; const sv = sc * n + vnRi(r, n), tv = [...Array(n).keys()].map(k => tc * n + k).find(v => pos[v] === pos[sv]);
    if (acc.some(c => (c.k === 'same') && ((c.a === sv && c.b === tv) || (c.a === tv && c.b === sv)))) continue;
    const pr = vnEinProp(n, nv, catOf, acc, vname), tcat = cs[tc];
    const txt = c => { const A = vnCap(np(c.a)), B = c.k === 'pos' ? '' : np(c.b), BD = c.k === 'pos' ? '' : np(c.b, true); switch (c.k) { case 'same': return `${A} ist auch ${B}.`; case 'notsame': return `${A} ist nicht ${B}.`; case 'left': return `${A} wohnt weiter links als ${B}.`; case 'dleft': return `${A} wohnt direkt links neben ${BD}.`; case 'neigh': return `${A} wohnt direkt neben ${BD}.`; default: return `${A} wohnt im ${['ersten', 'zweiten', 'dritten', 'vierten', 'fünften'][c.x]} Haus von links.`; } };
    const ex = ['Zeichne dir ' + n + ' Kästchen für die Häuser (von links nach rechts). Notiere bei jeder Eigenschaft, in welchen Häusern sie noch stehen kann, und streiche mit jedem Hinweis Möglichkeiten weg.'].concat(pr.log.slice(0, 18));
    if (pr.log.length > 18) ex.push('… so geht es weiter, bis überall nur noch ein Haus übrig bleibt.');
    ex.push(`${vnCap(np(sv))} wohnt in Haus ${pos[sv] + 1} – und dort wohnt ${tcat.show(tcat.vals[vi(tv)])} (${tcat.lab}).`);
    const rp = vnPfR('ein', pos.join(), sv, tv), pf = Object.assign({ q: `Beweise es: In welchem Haus wohnt ${np(sv)}?` }, vnPfMix('Haus ' + (pos[sv] + 1), [...Array(n).keys()].filter(k => k !== pos[sv]).map(k => 'Haus ' + (k + 1)), rp));
    return { pf, t: 'ein', title: 'Einstein-Rätsel', body: `<p>${n} Häuser stehen in einer Reihe (Haus 1 ist ganz links). In jedem wohnt eine Person. Von jeder Person kennst du: ${vnList(cs.map(c => c.lab))}. Alles ist verschieden.</p><ul class="vn-st">${acc.map(c => `<li>${esc(txt(c))}</li>`).join('')}</ul>`, q: `${tcat.art} ${tcat.lab} hat ${np(sv)}?`, kind: 'choice', opts: vals[tc].map(i => tcat.show(tcat.vals[i])), ans: vals[tc].indexOf(vi(tv)), ex, dbg: { n, nv, catOf, clues: acc, pos } };
  }
  return null;
}
const VN_LOGIC = { lie: vnGenLie, grid: vnGenGrid, time: vnGenTime, wit: vnGenWit, ein: vnGenEin };
