/* =====================================================================
   VENOLA HOLMES · Geheimakte: die sieben Wortspiele (Generatoren). Jedes Rätsel entsteht aus (Art, Stufe, Startwert) + gewählten Inhalten (ids).
   Damit kann ein Rätsel nach dem Neuladen und aus dem Verlauf IMMER genau gleich wieder aufgebaut werden.
   Rätsel-Objekt: { t, title, body, q, kind: 'choice' | 'multi' | 'pool' | 'fields' | 'cross', … , ex: [Zeilen „Wie komme ich darauf?“], sol: Lösung als HTML, ids, seen }
   Die Inhalte stehen in feat_vndata.js.
   ===================================================================== */
const vnNz = s => String(s || '').trim().toUpperCase().replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/ß/g, 'SS').replace(/[^A-Z]/g, '');
/* Auswahl mit Gedächtnis: P.avoid(id) = „schon gesehen oder gemeldet“, P.force = feste Auswahl (beim Wiederaufbau). Reicht der Vorrat nicht, wird neu gemischt (P.rep). */
function vnTake(P, cands, n, rnd) {
  if (P && P.force) return P.force.splice(0, n);
  let c = cands.filter(id => !(P && P.avoid && P.avoid(id)));
  if (c.length < n) { if (P) P.rep = true; c = cands.filter(id => !(P && P.bad && P.bad(id))); if (c.length < n) c = cands.slice(); }
  const out = pzShuf(c, rnd).slice(0, n);
  if (P) (P.used = P.used || []).push(...out);
  return out;
}
const vnNum = n => String(n).replace('-', '−');

/* ===================== Silbenrätsel ===================== */
function vnGenSil(lv, rnd, P) {
  const n = [2, 3, 4, 4, 5][lv - 1], deco = [0, 0, 0, 2, 3][lv - 1], maxS = [3, 4, 4, 6, 6][lv - 1], minS = [2, 2, 2, 3, 3][lv - 1];
  const cands = VN_SIL.map((x, i) => i).filter(i => VN_SIL[i].s.length <= maxS && VN_SIL[i].s.length >= minS);
  const ids = vnTake(P, cands, n, rnd), W = ids.map(i => VN_SIL[i]), rb = P.rb;
  let chips = W.flatMap(x => x.s);
  const extra = [];
  if (deco) { const others = VN_SIL.map((x, i) => i).filter(i => !ids.includes(i)); pzShuf(others, rb).slice(0, 12).forEach(i => { const s = pzShuf(VN_SIL[i].s, rb)[0]; if (extra.length < deco && !chips.includes(s) && !extra.includes(s)) extra.push(s); }); }
  chips = pzShuf(chips.concat(extra), rb);
  const groups = W.map((x, k) => ({ lab: x.q, n: x.s.length, ans: x.w, syl: x.s }));
  return {
    t: 'sil', title: 'Silbenrätsel', kind: 'pool', ids, groups, chips, join: true,
    body: `<p>Aus den Silben unten entstehen ${n} Wörter. Zu jedem Wort gibt es eine Frage. Jedes Kästchen ist eine Silbe.${deco ? ` <b>${extra.length} Silben sind überflüssig</b> und gehören zu keinem Wort.` : ''}</p>`,
    q: 'Tippe die Silben in der richtigen Reihenfolge in die Kästchen.',
    sol: W.map(x => `<b>${esc(x.s.join('-'))}</b>`).join(' · '),
    ex: ['Zähle zuerst die Kästchen: So viele Silben hat das gesuchte Wort. Das hilft beim Suchen.',
      'Beginne mit der Frage, bei der du das Wort sofort weißt, und streiche seine Silben weg. Dann bleiben weniger Silben für die schweren Fragen übrig.']
      .concat(W.map(x => `„${x.q}“ → ${x.w.charAt(0) + x.w.slice(1).toLowerCase()} (${x.s.map(s => s.toLowerCase()).join(' · ')}). Gesprochen: Klatsche das Wort, und du hörst ${x.s.length} Silben.`))
      .concat(extra.length ? [`Übrig bleiben ${extra.map(s => s.toLowerCase()).join(', ')} – sie sind nur zum Verwirren da.`] : [])
  };
}

/* ===================== Wortleiter ===================== */
let _lad = null;
function vnLadG() {
  if (_lad) return _lad;
  const W = VN_LAD, idx = {}, adj = W.map(() => []), bk = {};
  W.forEach((w, i) => { idx[w] = i; for (let k = 0; k < 4; k++) { const key = k + w.slice(0, k) + '_' + w.slice(k + 1); (bk[key] = bk[key] || []).push(i); } });
  Object.values(bk).forEach(b => b.forEach(i => b.forEach(j => { if (i !== j) adj[i].push(j); })));
  return _lad = { W, idx, adj };
}
function vnLadBfs(g, s) {
  const dist = new Array(g.W.length).fill(-1), par = new Array(g.W.length).fill(-1); dist[s] = 0; const q = [s];
  for (let h = 0; h < q.length; h++) { const u = q[h]; g.adj[u].forEach(v => { if (dist[v] < 0) { dist[v] = dist[u] + 1; par[v] = u; q.push(v); } }); }
  return { dist, par };
}
const vnLadAdj = (a, b) => { if (a.length !== 4 || b.length !== 4) return false; let d = 0; for (let i = 0; i < 4; i++) if (a[i] !== b[i]) d++; return d === 1; };
function vnGenLad(lv, rnd, P) {
  const g = vnLadG(), d = [3, 4, 5, 6, 7][lv - 1]; let s, e, path;
  if (P && P.force) { [s, e] = P.force.splice(0, 2); const b = vnLadBfs(g, g.idx[s]); path = []; for (let x = g.idx[e]; x >= 0; x = b.par[x]) path.unshift(g.W[x]); }
  else {
    const order = pzShuf(g.W.map((w, i) => i), rnd);
    for (const i of order) {
      const b = vnLadBfs(g, i), far = []; b.dist.forEach((x, j) => { if (x === d) far.push(j); });
      if (!far.length) continue;
      const j = far[Math.floor(rnd() * far.length)]; s = g.W[i]; e = g.W[j]; path = []; for (let x = j; x >= 0; x = b.par[x]) path.unshift(g.W[x]); break;
    }
    if (P) (P.used = P.used || []).push(s, e);
  }
  const mid = path.slice(1, -1), diff = (a, b) => { for (let i = 0; i < 4; i++) if (a[i] !== b[i]) return i + 1; return 0; };
  const chk = vals => {
    const v = vals.map(vnNz), ok = [], seen = new Set([s, e]); let msg = '', prev = s, chainOk = true;
    v.forEach((w, i) => {
      let good = false;
      if (!w) { chainOk = false; ok.push(null); prev = ''; return; }
      if (w.length !== 4) msg = msg || `„${vals[i].trim()}“ hat nicht 4 Buchstaben.`;
      else if (g.idx[w] === undefined) msg = msg || `„${w.charAt(0) + w.slice(1).toLowerCase()}“ kenne ich nicht in meiner Wörterliste.`;
      else if (seen.has(w)) msg = msg || `„${w.charAt(0) + w.slice(1).toLowerCase()}“ kommt schon vor.`;
      else if (prev && !vnLadAdj(prev, w)) msg = msg || `„${w.charAt(0) + w.slice(1).toLowerCase()}“ unterscheidet sich vom Wort davor nicht in genau einem Buchstaben.`;
      else good = true;
      if (good) seen.add(w); else chainOk = false;
      ok.push(good); prev = good ? w : '';
    });
    const last = v.length ? v[v.length - 1] : s, endOk = chainOk && v.every(Boolean) && vnLadAdj(last, e);
    if (chainOk && v.every(Boolean) && !endOk) msg = msg || 'Das letzte Wort passt nicht zum Zielwort.';
    return { ok, done: endOk, msg };
  };
  const nice = w => w.charAt(0) + w.slice(1).toLowerCase();
  return {
    t: 'lad', title: 'Wortleiter', kind: 'fields', ids: [s, e],
    body: `<p>Verwandle <b>${nice(s)}</b> in <b>${nice(e)}</b>. Bei jedem Schritt änderst du <b>genau einen Buchstaben</b> – und es muss wieder ein echtes Wort entstehen. Die Buchstaben bleiben dabei an ihrem Platz.</p><p class="vn-way vn-lad"><b>${s}</b> → ${mid.map(() => '▢').join(' → ')} → <b>${e}</b></p>`,
    q: `Schreibe die ${mid.length} Wörter dazwischen.`, items: mid.map((w, i) => ({ lab: `Schritt ${i + 1}`, ans: [w], len: 4 })), chk,
    sol: path.map(w => `<b>${w}</b>`).join(' → '),
    ex: [`Von ${s} nach ${e} sind es ${d} Schritte, also ${mid.length} Wörter dazwischen.`,
      'Vergleiche Anfang und Ende Buchstabe für Buchstabe: An welchen Stellen sind sie verschieden? Diese Stellen musst du irgendwann ändern.',
      'Ändere zuerst eine dieser Stellen so, dass ein echtes Wort entsteht. Wenn du nicht weiterkommst, probiere es von hinten: Welche Wörter sind einen Schritt vom Ziel entfernt?']
      .concat(path.slice(1).map((w, i) => `${path[i]} → ${w}: Der ${diff(path[i], w)}. Buchstabe ändert sich (${path[i][diff(path[i], w) - 1]} wird zu ${w[diff(path[i], w) - 1]}).`))
      .concat(['Es kann mehrere richtige Wege geben. Das hier ist ein Beispiel – jeder Weg, der die Regeln erfüllt, zählt.'])
  };
}

/* ===================== Wörterkette ===================== */
let _chn = null;
function vnChnG() {
  if (_chn) return _chn;
  const out = {}, lab = {}, inn = {}; VN_CHN.forEach(([a, l]) => { out[a] = out[a] || new Set(); l.forEach(([b, full]) => { out[a].add(b); inn[b] = inn[b] || new Set(); inn[b].add(a); lab[a + '>' + b] = full || (a + b.toLowerCase()); }); });
  const nodes = [...new Set(VN_CHN.flatMap(([a, l]) => [a].concat(l.map(x => x[0]))))];
  return _chn = { out, inn, lab, nodes, has: (a, b) => !!(out[a] && out[a].has(b)), cmp: (a, b) => lab[a + '>' + b] || '' };
}
function vnGenChn(lv, rnd, P) {
  const g = vnChnG(), gaps = [1, 2, 2, 3, 4][lv - 1], nd = [3, 3, 4, 5, 6][lv - 1]; let path;
  if (P && P.force) path = P.force.splice(0, 2 * gaps + 1);
  else {
    const starts = pzShuf(Object.keys(g.out), rnd), want = 2 * gaps;
    const dfs = (p, used) => { if (p.length === want + 1) return p; const nx = pzShuf([...(g.out[p[p.length - 1]] || [])], rnd); for (const n of nx) { if (used.has(n)) continue; used.add(n); p.push(n); const r = dfs(p, used); if (r) return r; p.pop(); used.delete(n); } return null; };
    for (const s of starts) { const r = dfs([s], new Set([s])); if (r) { path = r; break; } }
    if (P) (P.used = P.used || []).push(...path);
  }
  const given = path.filter((x, i) => i % 2 === 0), gapW = path.filter((x, i) => i % 2 === 1);
  /* Ablenker: passen höchstens zu einer Seite (ab Stufe 3) – und nie zu einer ganzen Lücke */
  const fitsGap = (c, k) => g.has(given[k], c) && g.has(c, given[k + 1]);
  const pool = g.nodes.filter(c => !path.includes(c) && !gapW.some((x, k) => fitsGap(c, k)) && !given.some((x, k) => k < gaps && fitsGap(c, k)));
  const half = pool.filter(c => given.some((x, k) => k < gaps && (g.has(given[k], c) || g.has(c, given[k + 1]))));
  const dis = pzShuf(lv >= 3 && half.length >= nd ? half : half.concat(pool), P.rb).filter((x, i, a) => a.indexOf(x) === i).slice(0, nd);
  const chips = pzShuf(gapW.concat(dis), P.rb);
  const groups = gapW.map((w, k) => ({ lab: `${given[k]} ▢ ${given[k + 1]}`, n: 1, ok: c => fitsGap(c, k), ans: w, pre: given[k], post: given[k + 1] }));
  return {
    t: 'chn', title: 'Wörterkette', kind: 'pool', ids: path, groups, chips, join: false,
    body: `<p>Zwischen zwei Wörtern fehlt ein Wort. Es muss <b>mit dem Wort davor</b> und <b>mit dem Wort danach</b> je ein neues Wort ergeben – zum Beispiel <i>Haus ▢ Schlüssel</i> mit <b>Tür</b>: Haus<b>tür</b> und <b>Tür</b>schlüssel.</p>
      <p class="vn-way vn-chn">${given.map((w, i) => `<b>${esc(w)}</b>${i < gaps ? ' ▢ ' : ''}`).join('')}</p>`,
    q: 'Welche Wörter fehlen? Tippe sie in die Lücken.',
    sol: gapW.map((w, k) => `${esc(given[k])} <b>${esc(w)}</b> ${esc(given[k + 1])}`).join(' · '),
    ex: ['Prüfe jedes Wort aus dem Vorrat an beiden Seiten einer Lücke: Das Wort davor muss vorne dran, das Wort danach hinten dran passen.',
      'Wörter, die nur auf einer Seite passen, sind Fallen. Das richtige Wort passt auf BEIDEN Seiten.']
      .concat(gapW.map((w, k) => `Lücke ${k + 1}: ${given[k]} + ${w} = ${g.cmp(given[k], w)} ✔ und ${w} + ${given[k + 1]} = ${g.cmp(w, given[k + 1])} ✔.`))
      .concat(dis.length ? ['Zu den anderen Wörtern fällt dir keine Zusammensetzung auf beiden Seiten ein – sie sind nur zum Verwirren da.'] : [])
  };
}

/* ===================== Analogien & Ausreißer ===================== */
const VN_RULES = [
  { n: 'verdoppelt', t: 1, f: x => x * 2, xs: [2, 3, 4, 5, 6, 7, 8, 9, 11, 12] },
  { n: 'verdreifacht', t: 1, f: x => x * 3, xs: [2, 3, 4, 5, 6, 7, 8, 9] },
  { n: 'halbiert', t: 1, f: x => x / 2, xs: [4, 6, 8, 10, 12, 14, 16, 18, 20] },
  { n: 'mal 4', t: 1, f: x => x * 4, xs: [2, 3, 4, 5, 6, 7] },
  { n: 'Quadratzahl (mal sich selbst)', t: 2, f: x => x * x, xs: [2, 3, 4, 5, 6, 7, 8, 9] },
  { n: 'mal 2, dann plus 1', t: 2, f: x => x * 2 + 1, xs: [2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { n: 'mal 3, dann minus 1', t: 3, f: x => x * 3 - 1, xs: [2, 3, 4, 5, 6, 7, 8, 9] },
  { n: 'Quadrat, dann plus 1', t: 3, f: x => x * x + 1, xs: [2, 3, 4, 5, 6, 7, 8] },
  { n: 'plus die Hälfte (mal 1,5)', t: 3, f: x => x * 3 / 2, xs: [2, 4, 6, 8, 10, 12] },
  { n: 'mal 5, dann minus 2', t: 3, f: x => x * 5 - 2, xs: [2, 3, 4, 5, 6, 7] }
];
const VN_NODDS = [
  { id: 'vf', t: 1, gen: r => { const k = 3 + Math.floor(r() * 5), base = 2 + Math.floor(r() * 4), mem = pzShuf([0, 1, 2, 3, 4, 5], r).slice(0, 4).map(i => k * (base + i)); let o; do o = k * (base + Math.floor(r() * 7)) + (1 + Math.floor(r() * (k - 1))); while (mem.includes(o)); return { mem, o, why: `Vier Zahlen kommen in der ${k}er-Reihe vor (${mem.slice().sort((a, b) => a - b).join(', ')}). ${o} nicht: ${o} geteilt durch ${k} geht nicht auf.` }; } },
  { id: 'qu', t: 2, gen: r => { const mem = pzShuf([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], r).slice(0, 4).map(x => x * x); let o; do o = 5 + Math.floor(r() * 140); while (Math.sqrt(o) % 1 === 0 || mem.includes(o)); return { mem, o, why: `${mem.slice().sort((a, b) => a - b).join(', ')} sind Quadratzahlen (z. B. ${Math.sqrt(mem[0])} · ${Math.sqrt(mem[0])} = ${mem[0]}). ${o} ist keine Quadratzahl.` }; } },
  { id: 'pr', t: 3, gen: r => { const P = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47], mem = pzShuf(P, r).slice(0, 4), C = [21, 27, 33, 39, 49, 51, 57, 63, 77, 91]; const o = C[Math.floor(r() * C.length)]; const f = [3, 7, 11, 13].find(x => o % x === 0); return { mem, o, why: `${mem.slice().sort((a, b) => a - b).join(', ')} sind Primzahlen (nur durch 1 und sich selbst teilbar). ${o} = ${f} · ${o / f}, also keine Primzahl.` }; } },
  { id: 'ge', t: 1, gen: r => { const ev = r() < .5, mem = pzShuf([...Array(40).keys()].map(x => x + 10).filter(x => (x % 2 === 0) === ev), r).slice(0, 4); let o; do o = 10 + Math.floor(r() * 40); while ((o % 2 === 0) === ev); return { mem, o, why: `Vier Zahlen sind ${ev ? 'gerade' : 'ungerade'}, ${o} ist ${ev ? 'ungerade' : 'gerade'}.` }; } },
  { id: 'zw', t: 2, gen: r => { const Z = [2, 4, 8, 16, 32, 64, 128, 256], mem = pzShuf(Z, r).slice(0, 4); let o; do o = 3 + Math.floor(r() * 250); while (Z.includes(o)); return { mem, o, why: `${mem.slice().sort((a, b) => a - b).join(', ')} gehören in die Zweier-Folge 2, 4, 8, 16 … (immer das Doppelte). ${o} kommt in dieser Folge nicht vor` }; } }
];
function vnQAna(rel, rb, ids, nopt) {
  const p = rel.p, A = p[ids[0]][0], B = p[ids[0]][1], C = p[ids[1]][0], D = p[ids[1]][1], rev = rb() < .4;
  let correct, cands, stem;
  if (!rev) { correct = D; cands = [...new Set(p.map(q => q[1]))].filter(x => x !== D && x !== B && !p.some(q => q[0] === C && q[1] === x)); stem = `<b>${esc(A)}</b> : <b>${esc(B)}</b> = <b>${esc(C)}</b> : <b>?</b>`; }
  else { correct = C; cands = [...new Set(p.map(q => q[0]))].filter(x => x !== C && x !== A && !p.some(q => q[0] === x && q[1] === D)); stem = `<b>?</b> : <b>${esc(D)}</b> = <b>${esc(A)}</b> : <b>${esc(B)}</b>`; }
  const opts = pzShuf(pzShuf(cands, rb).slice(0, nopt - 1).concat([correct]), rb);
  return { h: stem, opts, ans: opts.indexOf(correct), ex: `${rel.lab}: ${rel.how(A, B)}. Genauso gilt: ${rel.how(C, D)}. Gesucht ist also „${correct}“.` };
}
function vnQNum(lv, rnd, nopt) {
  const R = VN_RULES.filter(r => lv >= 5 ? r.t >= 2 : lv >= 4 ? r.t >= 1 : r.t <= 2), rule = R[Math.floor(rnd() * R.length)], xs = pzShuf(rule.xs, rnd), a = xs[0], c = xs[1], b = rule.f(a), d = rule.f(c);
  const cand = new Set(); [d + 1, d - 1, d + 2, d - 2, d * 2, c * 2, c + a, c + b, d + a, Math.round(d / 2), c * c, c + 1, d + 10, d - 10].forEach(x => { if (Number.isInteger(x) && x !== d && x > 0) cand.add(x); });
  const opts = pzShuf(pzShuf([...cand], rnd).slice(0, nopt - 1).concat([d]), rnd);
  return { h: `<b>${a}</b> : <b>${b}</b> = <b>${c}</b> : <b>?</b>`, opts: opts.map(String), ans: opts.indexOf(d), ex: `Zahlenregel: ${a} wird zu ${b} – das Ergebnis ist ${rule.n}. Probiere die Regel mit der zweiten Zahl: ${c} ${rule.n} ergibt ${d}.` };
}
function vnQOdd(lv, rnd, id) {
  let mem, o, why;
  if (id !== null && id !== undefined) { const x = VN_ODD[id]; mem = x[0]; o = x[1]; why = x[2]; }
  else { const R = VN_NODDS.filter(r => r.t <= (lv >= 5 ? 3 : lv >= 3 ? 2 : 1)); const r = R[Math.floor(rnd() * R.length)], q = r.gen(rnd); mem = q.mem.map(String); o = String(q.o); why = q.why; }
  const opts = pzShuf(mem.concat([o]), rnd);
  return { h: '<b>Welches gehört nicht dazu?</b>', opts, ans: opts.indexOf(o), ex: `Ausreißer: ${why.replace(/\.$/, '')}.` };
}
function vnGenAna(lv, rnd, P) {
  const nq = [3, 4, 5, 5, 6][lv - 1], nopt = lv >= 4 ? 5 : 4, tiers = [[1], [1, 2], [2, 3], [2, 3], [3]][lv - 1];
  const nNum = lv >= 3 ? (lv >= 5 ? 2 : 1) : 0, nOdd = lv >= 2 ? (lv >= 5 ? 2 : 1) : 0, nRel = nq - nNum - nOdd, rb = P.rb;
  /* Plan = Liste der Aufgaben: [Paar, Paar] (Beziehung), 'n' (Zahlenregel), 'o' (Zahlen-Ausreißer) oder 10000+Nr (Wort-Ausreißer) */
  let plan;
  if (P.force) plan = P.force.splice(0, nq);
  else {
    const rels = pzShuf(VN_REL.map((r, i) => i).filter(i => tiers.includes(VN_REL[i].tier)), rnd), plan0 = [];
    for (let k = 0; k < nRel; k++) {
      const ri = rels[k % rels.length], n = VN_REL[ri].p.length, cand = [...Array(n).keys()].map(j => ri * 100 + j);
      let two; for (let t = 0; t < 30; t++) { const fr = cand.filter(id => !(P.avoid && P.avoid(id))); if (fr.length < 2) P.rep = true; two = vnTake(null, fr.length >= 2 ? fr : cand.filter(id => !(P.bad && P.bad(id))), 2, rnd); const a = VN_REL[ri].p[two[0] % 100], b = VN_REL[ri].p[two[1] % 100]; if (a[0] !== b[0] && a[1] !== b[1]) break; }
      (P.used = P.used || []).push(...two); plan0.push(two);
    }
    for (let k = 0; k < nNum; k++) plan0.push('n');
    if (nOdd) plan0.push(vnTake(P, VN_ODD.map((x, i) => 10000 + i), 1, rnd)[0]);
    if (nOdd > 1) plan0.push('o');
    plan = pzShuf(plan0, rnd);
  }
  const qs = plan.map(x => {
    if (Array.isArray(x)) return vnQAna(VN_REL[Math.floor(x[0] / 100)], rb, x.map(v => v % 100), nopt);
    if (x === 'n') return vnQNum(lv, rb, nopt);
    return vnQOdd(lv, rb, x === 'o' ? null : x - 10000);
  });
  return {
    t: 'ana', title: 'Analogien', kind: 'multi', ids: plan,
    body: `<p>Bei jeder Aufgabe musst du die <b>Beziehung</b> zwischen zwei Wörtern (oder Zahlen) erkennen und auf ein zweites Paar übertragen. „<i>A : B = C : ?</i>“ liest man: A verhält sich zu B wie C zu …? Bei „Welches gehört nicht dazu?“ passen vier Dinge zusammen.</p>`,
    q: 'Wähle bei jeder Aufgabe die richtige Antwort.', qs,
    sol: qs.map(x => `<b>${esc(String(x.opts[x.ans]))}</b>`).join(' · '),
    ex: ['Sage dir die Beziehung des ersten Paares in einem Satz: „B ist ein … von A“. Dann prüfe, ob der Satz auch für das zweite Paar stimmt.'].concat(qs.map((x, k) => `Aufgabe ${k + 1}: ${x.ex}`))
  };
}

/* ===================== Versteckte Wörter ===================== */
function vnHidAt(s, w) {
  const pos = [], L = []; for (let i = 0; i < s.length; i++) if (/[A-Za-zÄÖÜäöü]/.test(s[i])) { pos.push(i); L.push(s[i].toUpperCase()); }
  const flat = L.join(''); let from = 0, at = -1;
  while ((from = flat.indexOf(w, from)) >= 0) { if (/[^A-Za-zÄÖÜäöü]/.test(s.slice(pos[from], pos[from + w.length - 1] + 1))) { at = from; break; } from++; }
  return { pos, at };
}
function vnHidMark(s, w) {
  const { pos, at } = vnHidAt(s, w); if (at < 0) return null;
  const a = pos[at], b = pos[at + w.length - 1], hit = new Set(pos.slice(at, at + w.length));
  let html = ''; for (let i = 0; i < s.length; i++) html += hit.has(i) ? `<mark>${esc(s[i])}</mark>` : esc(s[i]);
  const words = []; s.replace(/[A-Za-zÄÖÜäöüß]+/g, (m, off) => { if (off + m.length > a && off <= b) words.push(m); return m; });
  return { html, words };
}
function vnGenHid(lv, rnd, P) {
  const n = [3, 4, 4, 5, 6][lv - 1], ids = vnTake(P, VN_HID.map((x, i) => i), n, rnd), I = ids.map(i => VN_HID[i]), hint = lv <= 3;
  return {
    t: 'hid', title: 'Versteckte Wörter', kind: 'fields', ids,
    body: `<p>In jedem Satz versteckt sich ein Wort – es steckt <b>über Wortgrenzen hinweg</b>: ein Stück vom einen Wort, dann ein Stück vom nächsten. Lies die Buchstaben ohne Lücken hintereinander!${hint ? ' Hinter jedem Satz steht, <b>was</b> gesucht ist.' : ' Diesmal verrät dir nichts, was gesucht ist.'}</p>`,
    q: 'Welches Wort ist versteckt?', items: I.map(x => ({ lab: `<span class="vn-sent">${esc(x.s)}</span>${hint ? ` <small class="mute">(${esc(x.g)})</small>` : ''}`, ans: [x.w] })),
    sol: I.map(x => `<b>${esc(x.w.charAt(0) + x.w.slice(1).toLowerCase())}</b>`).join(' · '),
    ex: ['Streiche im Kopf alle Leerzeichen und Satzzeichen weg und lies die Buchstaben als langes Wort. Suche dann ein Wort, das mitten drin steckt.', 'Die Lücke zwischen zwei Wörtern ist die Stelle, an der sich das gesuchte Wort versteckt.']
      .concat(I.map(x => { const m = vnHidMark(x.s, x.w); return m ? `„${m.html}“ → ${x.w}: versteckt in ${m.words.map(w => '„' + esc(w) + '“').join(' + ')}.` : `„${esc(x.s)}“ → ${x.w}`; }))
  };
}

/* ===================== Mini-Kreuzworträtsel ===================== */
function vnKreLayout(words, rnd, size) {
  const G = new Map(), pl = [];
  const key = (r, c) => r + ',' + c, get = (r, c) => G.get(key(r, c));
  const can = (w, r, c, d) => {
    const dr = d === 'v' ? 1 : 0, dc = d === 'h' ? 1 : 0; let cross = 0;
    const b = get(r - dr, c - dc), a = get(r + dr * w.length, c + dc * w.length); if (b || a) return -1;
    for (let k = 0; k < w.length; k++) {
      const rr = r + dr * k, cc = c + dc * k, ex = get(rr, cc);
      if (ex) { if (ex.l !== w[k] || ex.d.includes(d)) return -1; cross++; }
      else if (get(rr + dc, cc + dr) || get(rr - dc, cc - dr)) return -1;
    }
    return cross;
  };
  const put = (id, w, r, c, d) => { const dr = d === 'v' ? 1 : 0, dc = d === 'h' ? 1 : 0; for (let k = 0; k < w.length; k++) { const e = get(r + dr * k, c + dc * k); if (e) e.d += d; else G.set(key(r + dr * k, c + dc * k), { l: w[k], d }); } pl.push([id, r, c, d]); };
  const bbox = (extra) => { let r0 = 1e9, r1 = -1e9, c0 = 1e9, c1 = -1e9; const add = (r, c) => { r0 = Math.min(r0, r); r1 = Math.max(r1, r); c0 = Math.min(c0, c); c1 = Math.max(c1, c); }; G.forEach((v, k) => { const [r, c] = k.split(',').map(Number); add(r, c); }); if (extra) { const dr = extra.d === 'v' ? 1 : 0, dc = extra.d === 'h' ? 1 : 0; for (let k = 0; k < extra.w.length; k++) add(extra.r + dr * k, extra.c + dc * k); } return [r1 - r0 + 1, c1 - c0 + 1]; };
  put(words[0].i, words[0].w, 0, 0, 'h');
  for (let n = 1; n < words.length; n++) {
    const w = words[n].w, opts = [];
    G.forEach((v, k) => {
      const [r, c] = k.split(',').map(Number);
      for (let j = 0; j < w.length; j++) if (w[j] === v.l) {
        if (!v.d.includes('v')) { const r0 = r - j; const x = can(w, r0, c, 'v'); if (x >= 1) opts.push([r0, c, 'v', x]); }
        if (!v.d.includes('h')) { const c0 = c - j; const x = can(w, r, c0, 'h'); if (x >= 1) opts.push([r, c0, 'h', x]); }
      }
    });
    const ok = opts.filter(o => { const [bh, bw] = bbox({ w, r: o[0], c: o[1], d: o[2] }); return bh <= size && bw <= size; });
    if (!ok.length) continue;
    const best = Math.max(...ok.map(o => o[3])), pick = pzShuf(ok.filter(o => o[3] >= Math.min(best, 2)), rnd)[0] || pzShuf(ok, rnd)[0];
    put(words[n].i, w, pick[0], pick[1], pick[2]);
  }
  return pl;
}
function vnGenKre(lv, rnd, P) {
  const nW = [4, 5, 6, 7, 8][lv - 1], tiers = [[1], [1, 2], [2], [2, 3], [2, 3]][lv - 1], maxL = [7, 8, 8, 9, 10][lv - 1], size = [8, 9, 10, 11, 12][lv - 1];
  let pl;
  if (P && P.force) pl = P.force.splice(0, P.force.length);
  else {
    const cands = VN_KRE.map((x, i) => i).filter(i => tiers.includes(VN_KRE[i].t) && VN_KRE[i].w.length <= maxL && VN_KRE[i].w.length >= 3);
    let best = null;
    for (let t = 0; t < 80; t++) {
      const fresh = cands.filter(id => !(P.avoid && P.avoid(id))), ids = pzShuf(fresh.length >= nW + 4 ? fresh : cands.filter(id => !(P.bad && P.bad(id))), rnd).slice(0, nW + 5);
      if (fresh.length < nW + 4) { P.rep = true; }
      const ws = ids.map(i => ({ i, w: VN_KRE[i].w })).sort((a, b) => b.w.length - a.w.length || rnd() - .5);
      const L = vnKreLayout(ws, rnd, size);
      if (!best || L.length > best.length) best = L;
      if (L.length >= nW) { best = L; break; }
    }
    pl = best.slice(0, Math.max(nW, 3));
    /* beim Kürzen nur Wörter behalten, die noch zusammenhängen – daher in Einlege-Reihenfolge kürzen (jedes neue Wort kreuzt ein älteres) */
    (P.used = P.used || []).push(...pl.map(x => x[0]));
  }
  let r0 = 1e9, c0 = 1e9, r1 = -1, c1 = -1; const words = pl.map(([i, r, c, d]) => { const w = VN_KRE[i].w; const e = [r + (d === 'v' ? w.length - 1 : 0), c + (d === 'h' ? w.length - 1 : 0)]; r0 = Math.min(r0, r); c0 = Math.min(c0, c); r1 = Math.max(r1, e[0]); c1 = Math.max(c1, e[1]); return { i, w, r, c, d, h: VN_KRE[i].h }; });
  words.forEach(x => { x.r -= r0; x.c -= c0; });
  const cells = {}; words.forEach(x => { for (let k = 0; k < x.w.length; k++) { const rr = x.r + (x.d === 'v' ? k : 0), cc = x.c + (x.d === 'h' ? k : 0); cells[rr + ',' + cc] = x.w[k]; } });
  /* Nummern: erst nach Zeile, dann nach Spalte */
  const starts = [...new Set(words.map(x => x.r + ',' + x.c))].sort((a, b) => { const [r1_, c1_] = a.split(',').map(Number), [r2, c2] = b.split(',').map(Number); return r1_ - r2 || c1_ - c2; });
  words.forEach(x => { x.no = starts.indexOf(x.r + ',' + x.c) + 1; });
  const H = r1 - r0 + 1, Wd = c1 - c0 + 1;
  return {
    t: 'kre', title: 'Mini-Kreuzworträtsel', kind: 'cross', ids: pl, cells, words, H, W: Wd,
    body: `<p>Löse die Hinweise und trage die Wörter ins Gitter ein. Wo sich zwei Wörter kreuzen, teilen sie sich einen Buchstaben – das hilft dir beim Raten. Ä, Ö und Ü haben eigene Tasten.</p>`,
    q: 'Tippe ein Kästchen an und schreibe mit der Tastatur darunter.',
    sol: words.slice().sort((a, b) => a.no - b.no).map(x => `${x.no} ${x.d === 'h' ? '→' : '↓'} <b>${esc(x.w.charAt(0) + x.w.slice(1).toLowerCase())}</b>`).join(' · '),
    ex: ['Beginne mit den Hinweisen, die du sicher weißt, und schreibe die Wörter ein. Die Buchstaben an den Kreuzungen helfen dir bei den schweren Wörtern.', 'Zähle die Kästchen: Das Wort muss genau so lang sein. Passt ein Wort nicht zu einem schon eingetragenen Kreuzungsbuchstaben, ist eines von beiden falsch.']
      .concat(words.slice().sort((a, b) => a.no - b.no).map(x => `${x.no} ${x.d === 'h' ? 'waagerecht' : 'senkrecht'} (${x.w.length} Buchstaben): „${x.h}“ → ${x.w.charAt(0) + x.w.slice(1).toLowerCase()}.`))
  };
}

/* ===================== Lückentext ===================== */
function vnGenLue(lv, rnd, P) {
  const tiers = [[1], [2], [2], [2, 3], [3]][lv - 1], cands = VN_LUE.map((x, i) => i).filter(i => tiers.includes(VN_LUE[i].lv)), id = vnTake(P, cands, 1, rnd)[0], st = VN_LUE[id];
  const chips = pzShuf(st.gaps.map(g => g.w).concat(st.de), P.rb), parts = st.text.split('\u0001');
  return {
    t: 'lue', title: 'Lückentext', kind: 'pool', ids: [id], inline: parts, chips, join: false,
    groups: st.gaps.map(g => ({ n: 1, ans: g.w, lab: '' })),
    body: `<p><b>${esc(st.ti)}</b> – in dieser Geschichte fehlen Wörter. Jedes Wort aus dem Vorrat passt in höchstens eine Lücke. ${st.de.length ? `<b>${st.de.length} Wörter bleiben übrig.</b>` : ''} Achte auf <b>der / die / das</b>, auf Einzahl und Mehrzahl und darauf, was sinnvoll ist.</p>`,
    q: 'Tippe ein Wort an und dann die Lücke, in die es gehört.',
    sol: st.gaps.map((g, k) => `${k + 1}. <b>${esc(g.w)}</b>`).join(' · '),
    ex: ['Lies den ganzen Satz um die Lücke. Frage dich: Ist das Wort männlich (der), weiblich (die), sächlich (das) oder Mehrzahl? Das verraten Wörter wie „ein / eine“, „dem / der“ und die Endungen davor.', 'Streiche Wörter, die du schon eingesetzt hast. Die übrigen Wörter im Vorrat sind Ablenker.']
      .concat(st.gaps.map((g, k) => `Lücke ${k + 1}: „${g.w}“ – ${g.why}.`))
  };
}

const VN_WORDS = { sil: vnGenSil, lad: vnGenLad, chn: vnGenChn, ana: vnGenAna, hid: vnGenHid, kre: vnGenKre, lue: vnGenLue };
const VN_TNAME = { lie: 'Wer lügt?', grid: 'Alibi-Gitter', time: 'Zeitleiste', wit: 'Widerspruch', ein: 'Einstein-Rätsel', sil: 'Silbenrätsel', lad: 'Wortleiter', chn: 'Wörterkette', ana: 'Analogien', hid: 'Versteckte Wörter', kre: 'Mini-Kreuzworträtsel', lue: 'Lückentext' };
/* Ein Rätsel aufbauen: desc = { t, lv, sd, ids? }.  ids vorhanden → genau dieses Rätsel (Wiederaufbau); P = Gedächtnis (nur beim ersten Erzeugen). */
function vnBuild(desc, P) {
  const rnd = pzRng(desc.sd);
  if (VN_LOGIC[desc.t]) return VN_LOGIC[desc.t](desc.lv, rnd);
  const Q = P || {}; if (desc.ids) { Q.force = JSON.parse(JSON.stringify(desc.ids)); }
  Q.rb = pzRng((desc.sd ^ 0x5bd1e995) >>> 0);
  return VN_WORDS[desc.t](desc.lv, rnd, Q);
}
