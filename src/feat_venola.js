/* =====================================================================
   VENOLA HOLMES (in Meine Welt) · Version 2
   Zwei Spiele + Wochenfall, jeweils aus „Akten“ mit mehreren Rätseln (Teilen):
   · Kriminalfall  – Logik: Wer lügt? · Alibi-Gitter · Zeitleiste · Widerspruch · Einstein-Rätsel   (feat_vnlogic.js)
   · Geheimakte    – Wörter: Silbenrätsel · Wortleiter · Wörterkette · Analogien · Versteckte Wörter · Mini-Kreuzworträtsel · Lückentext (feat_vnwords.js, Inhalte feat_vndata.js)
   · Großer Fall der Woche – 5 Logik-Rätsel, neu jeden Montag (+12 Beweismarken, +10 Münzen)
   Stufen 1–5; Stufe 4 öffnet sich nach einem Sieg auf Stufe 3, Stufe 5 nach Stufe 4 (nacheinander).
   Jedes Rätsel hat „Wie komme ich darauf?“ (Lösungsweg, erst nach dem Lösen). Vorher: „Aufgeben & Lösungsweg“ – zeigt die Lösung, beendet die Akte
   OHNE Belohnung und OHNE Verlust, das Rätsel kommt später wieder (S.puz.vnLater).
   Nichts wiederholt sich: gesehene Inhalte merkt sich S.puz.vnSeen; erst wenn alles gesehen ist, beginnt eine neue Runde.
   Eigene Belohnungen (nur hier einlösbar): Beweismarken → Detektivkoffer (12 Stücke, 3 Reihen → Avatar-Teile), Detektiv-Rang nach gelösten Akten.
   Gespeichert (alles in S.puz): vnCur (begonnene Akte), vnWk (Wochenfall), vnCodeLvl/vnCaseLvl (offene Stufen, max. 5), vnSeen, vnFlag (gemeldet), vnLater (aufgegeben),
   vnMk (Beweismarken), vnKof (Koffer), vnRow, vnQuick, vnLast; Verlauf aller gelösten Akten in S.puz.hist (mit rp = Rätsel zum Wiederaufbau).
   ===================================================================== */
const VN_TYPES_CASE = ['lie', 'grid', 'time', 'wit', 'ein'], VN_TYPES_WORD = ['sil', 'lad', 'chn', 'ana', 'hid', 'kre', 'lue'], VN_SEENT = ['sil', 'ana', 'hid', 'kre', 'lue'];
const VN_N = { case: [1, 2, 3, 3, 4], code: [2, 3, 3, 4, 4] };
const VN_BM = [2, 3, 5, 7, 10], VN_COIN = [3, 5, 8, 10, 12], VN_QUICK = [180, 300, 420, 540, 720];
const VN_RANKS = [[0, 'Detektiv-Lehrling', '🔍'], [5, 'Nachwuchs-Ermittler', '👣'], [15, 'Kommissar-Anwärter', '🕶️'], [30, 'Kommissarin', '⭐'], [60, 'Chefermittler', '🎩'], [100, 'Meisterdetektiv', '🏆']];
const VN_ROWS = [{ n: 'Grundausrüstung', acc: 'acc.spion', an: 'Spion-Brille' }, { n: 'Spurensicherung', acc: 'acc.dschal', an: 'Detektiv-Schal' }, { n: 'Meisterstücke', acc: 'acc.meisterhut', an: 'Meisterhut' }];
const VN_KOF = [
  { id: 'lupe', row: 0, cost: 5, n: 'Lupe', s: 'Sie zeigt jedes Haar am Tatort.', svg: '<circle cx="20" cy="20" r="12" fill="#e7edeb" fill-opacity=".8" stroke="#52676c" stroke-width="3.5"/><path d="M29 29l12 12" stroke="#9c6668" stroke-width="6" stroke-linecap="round"/>' },
  { id: 'notiz', row: 0, cost: 6, n: 'Notizbuch', s: 'Hier steht alles, was Venola weiß.', svg: '<rect x="9" y="6" width="30" height="37" rx="4" fill="#f4efe4" stroke="#52676c" stroke-width="2.5"/><path d="M15 15h18M15 22h18M15 29h12" stroke="#bed1c6" stroke-width="2.5" stroke-linecap="round"/><path d="M9 12H6M9 20H6M9 28H6M9 36H6" stroke="#52676c" stroke-width="2.5" stroke-linecap="round"/>' },
  { id: 'lampe', row: 0, cost: 8, n: 'Taschenlampe', s: 'Für dunkle Keller und geheime Gänge.', svg: '<rect x="6" y="20" width="22" height="9" rx="3" fill="#52676c"/><path d="M28 17h7l-2 15h-5z" fill="#8aa3a8"/><path d="M37 21l8-5M37 25h9M37 29l8 5" stroke="#f2c94c" stroke-width="2.6" stroke-linecap="round"/><rect x="10" y="22" width="6" height="5" rx="2" fill="#bed1c6"/>' },
  { id: 'pulver', row: 0, cost: 10, n: 'Fingerabdruck-Pulver', s: 'Macht unsichtbare Spuren sichtbar.', svg: '<rect x="13" y="16" width="22" height="26" rx="5" fill="#e7edeb" stroke="#52676c" stroke-width="2.5"/><rect x="16" y="9" width="16" height="7" rx="2" fill="#52676c"/><path d="M18 30a6 6 0 0112 0M20 30a4 4 0 018 0M22 30a2 2 0 014 0" fill="none" stroke="#9c6668" stroke-width="2"/>' },
  { id: 'fern', row: 1, cost: 12, n: 'Fernglas', s: 'Verdächtige beobachten – aus sicherer Entfernung.', svg: '<rect x="6" y="17" width="14" height="22" rx="5" fill="#52676c"/><rect x="28" y="17" width="14" height="22" rx="5" fill="#52676c"/><rect x="18" y="22" width="12" height="8" fill="#8aa3a8"/><rect x="9" y="10" width="8" height="9" rx="2" fill="#8aa3a8"/><rect x="31" y="10" width="8" height="9" rx="2" fill="#8aa3a8"/><circle cx="13" cy="39" r="3" fill="#cfe8f2"/><circle cx="35" cy="39" r="3" fill="#cfe8f2"/>' },
  { id: 'pinz', row: 1, cost: 14, n: 'Pinzette und Tütchen', s: 'Kein Beweis geht verloren.', svg: '<path d="M12 14h24v26a3 3 0 01-3 3H15a3 3 0 01-3-3z" fill="#f4efe4" stroke="#52676c" stroke-width="2.5"/><path d="M12 20h24" stroke="#9c6668" stroke-width="2.5"/><path d="M20 28l6 8M30 28l-6 8" stroke="#52676c" stroke-width="2.6" stroke-linecap="round"/><circle cx="24" cy="28" r="2.5" fill="#52676c"/>' },
  { id: 'kompass', row: 1, cost: 16, n: 'Kompass', s: 'Die Nadel zeigt zum Täter. Fast immer.', svg: '<circle cx="24" cy="24" r="17" fill="#f4efe4" stroke="#52676c" stroke-width="3"/><path d="M24 11l5 13H19z" fill="#c0392b"/><path d="M24 37l-5-13h10z" fill="#52676c"/><circle cx="24" cy="24" r="2.2" fill="#f4efe4"/>' },
  { id: 'tinte', row: 1, cost: 18, n: 'Geheimtinte', s: 'Schreibt Botschaften, die nur im Licht erscheinen.', svg: '<path d="M20 8h8v8l7 9v13a5 5 0 01-5 5H18a5 5 0 01-5-5V25l7-9z" fill="#e7edeb" stroke="#52676c" stroke-width="2.5"/><path d="M14 30h20v8a4 4 0 01-4 4H18a4 4 0 01-4-4z" fill="#6c5ce7" fill-opacity=".8"/><path d="M24 20c3 4 4 6 0 8-4-2-3-4 0-8z" fill="#6c5ce7"/>' },
  { id: 'funk', row: 2, cost: 22, n: 'Funkgerät', s: 'Verbindung zur ganzen Detektei.', svg: '<rect x="12" y="14" width="24" height="29" rx="5" fill="#52676c"/><path d="M30 14V5" stroke="#52676c" stroke-width="3.5" stroke-linecap="round"/><rect x="16" y="19" width="16" height="8" rx="2" fill="#bed1c6"/><circle cx="20" cy="35" r="2.4" fill="#f2c94c"/><circle cx="28" cy="35" r="2.4" fill="#c0392b"/>' },
  { id: 'abz', row: 2, cost: 26, n: 'Detektiv-Abzeichen', s: 'Wer es trägt, wird ernst genommen.', svg: '<path d="M24 4l5.4 11 12.1 1.7-8.8 8.5 2.1 12L24 31.5 13.2 37.2l2.1-12-8.8-8.5L18.6 15z" fill="#f2c94c" stroke="#c98a00" stroke-width="2.4" stroke-linejoin="round"/><circle cx="24" cy="22" r="4.4" fill="#fff" fill-opacity=".7"/>' },
  { id: 'mikro', row: 2, cost: 30, n: 'Mikroskop', s: 'Für Spuren, die kleiner sind als ein Krümel.', svg: '<path d="M20 8l8 3-8 18-8-3z" fill="#52676c"/><path d="M22 28q14 0 14 12" fill="none" stroke="#52676c" stroke-width="3.4" stroke-linecap="round"/><rect x="10" y="40" width="28" height="4" rx="2" fill="#52676c"/><rect x="14" y="30" width="14" height="3" rx="1.5" fill="#8aa3a8"/>' },
  { id: 'schl', row: 2, cost: 36, n: 'Meisterschlüssel', s: 'Öffnet jede Tür – und jedes Rätsel.', svg: '<circle cx="16" cy="17" r="9" fill="#f2c94c" stroke="#c98a00" stroke-width="3"/><circle cx="16" cy="17" r="3.2" fill="#f4efe4"/><path d="M23 24l18 18M35 36l5-4M31 32l5-4" stroke="#c98a00" stroke-width="4" stroke-linecap="round" fill="none"/>' }
];
const vnS = () => {
  const p = pzS();
  ['vnCodeLvl', 'vnCaseLvl'].forEach(k => { if (!(p[k] >= 1)) p[k] = 1; if (p[k] > 5) p[k] = 5; });
  if (!p.vnSeen || typeof p.vnSeen !== 'object') p.vnSeen = {};
  if (!Array.isArray(p.vnFlag)) p.vnFlag = [];
  if (!(p.vnMk >= 0)) p.vnMk = 0;
  if (!p.vnKof || typeof p.vnKof !== 'object') p.vnKof = {};
  if (!p.vnRow || typeof p.vnRow !== 'object') p.vnRow = {};
  if (!p.vnQuick || typeof p.vnQuick !== 'object') p.vnQuick = {};
  if (!p.vnLast || typeof p.vnLast !== 'object') p.vnLast = {};
  if (!Array.isArray(p.vnLater)) p.vnLater = [];
  if (!p.vnRep || typeof p.vnRep !== 'object') p.vnRep = {};
  if (p.vnCur && !p.vnCur.stages) p.vnCur = null;                  // begonnene Akten der alten Version (Version 1) gibt es nicht mehr
  if (p.vnWk && p.vnWk.cur && !p.vnWk.cur.stages) p.vnWk.cur = null;
  return p;
};
const vnRank = n => { let i = 0; VN_RANKS.forEach((r, k) => { if (n >= r[0]) i = k; }); const nx = VN_RANKS[i + 1]; return { i, name: VN_RANKS[i][1], ic: VN_RANKS[i][2], next: nx ? nx[1] : '', need: nx ? nx[0] - n : 0, pct: nx ? Math.round((n - VN_RANKS[i][0]) / (nx[0] - VN_RANKS[i][0]) * 100) : 100 }; };
const vnLbl = (kind, lv) => kind === 'week' ? 'Großer Fall der Woche' : (kind === 'code' ? 'Geheimakte' : 'Kriminalfall') + ' · Stufe ' + lv;
const vnSub = () => { const p = vnS(); return p.venWins ? vnRank(p.venWins).name : 'Akten und Rätsel'; };
const vnRankCard = () => { if (!flagOn('venola')) return ''; const p = vnS(), r = vnRank(p.venWins); return `<section class="card vn-rankc"><span class="vn-ri">${r.ic}</span><div><b>Detektiv-Rang: ${esc(r.name)}</b><br><small class="mute">${p.venWins} ${p.venWins === 1 ? 'Akte' : 'Akten'} gelöst${r.next ? ` · noch ${r.need} bis „${esc(r.next)}“` : ' · höchster Rang!'}</small><div class="bar" style="margin-top:6px"><i style="width:${r.pct}%"></i></div></div></section>`; };
const vnExHtml = l => esc(String(l)).replace(/&lt;(\/?)mark&gt;/g, '<$1mark>');

/* ---------- Vorrat: gesehen / gemeldet ---------- */
const vnFlagSet = t => new Set(vnS().vnFlag.filter(f => f.t === t).flatMap(f => f.ids || []));
function vnPools() {            // t → alle Inhalts-Nummern (für „noch neu“ und Eltern-Anzeige)
  return { sil: VN_SIL.map((x, i) => i), hid: VN_HID.map((x, i) => i), kre: VN_KRE.map((x, i) => i), lue: VN_LUE.map((x, i) => i), ana: VN_REL.flatMap((r, ri) => r.p.map((x, j) => ri * 100 + j)).concat(VN_ODD.map((x, i) => 10000 + i)) };
}
function vnPoolInfo() {
  const p = vnS(), P = vnPools(), nm = { sil: 'Silbenrätsel (Wörter)', hid: 'Versteckte Wörter (Sätze)', kre: 'Kreuzworträtsel (Wörter)', lue: 'Lückentexte (Geschichten)', ana: 'Analogien (Aufgaben-Bausteine)' };
  return Object.keys(P).map(t => { const sn = new Set(p.vnSeen[t] || []), fl = vnFlagSet(t); return { t, name: nm[t], total: P[t].length, left: P[t].filter(id => !sn.has(id) && !fl.has(id)).length, flagged: P[t].filter(id => fl.has(id)).length, rounds: p.vnRep[t] || 0 }; });
}
function vnParentCard() {
  const p = vnS(), I = vnPoolInfo();
  return `<div class="card noprint"><h3>Venola Holmes: Vorrat und gemeldete Fragen</h3>
    <p class="small mute" style="margin:0 0 6px">Jede Akte nimmt nur Inhalte, die noch neu sind. Sind alle gesehen, beginnt eine neue Runde. Wortleiter, Wörterkette und die fünf Logik-Rätsel entstehen jedes Mal neu und gehen nie aus.</p>
    ${I.map(x => `<div class="cfg"><div><b>${esc(x.name)}</b><br><span class="small mute">${x.left} von ${x.total} noch neu${x.flagged ? ` · ${x.flagged} gemeldet` : ''}${x.rounds ? ` · ${x.rounds}. Runde` : ''}</span></div></div>`).join('')}
    <div class="cfg"><div><b>Gemeldete Fragen</b><br><span class="small mute">${p.vnFlag.length ? p.vnFlag.map(f => esc(VN_TNAME[f.t] || f.t) + ' (' + new Date(f.ts).toLocaleDateString('de-DE') + ')').join(', ') : 'Keine. Kinder melden eine Frage mit „Frage melden“ im Rätsel; sie kommt dann nie wieder.'}</span></div>
      ${p.vnFlag.length ? '<button class="btn sm sec" data-act="vnUnflag">Alle freigeben</button>' : ''}</div>
    <div class="cfg"><div><b>Neue Runde starten</b><br><span class="small mute">Vergisst, was schon gesehen wurde. Gelöste Akten und der Verlauf bleiben.</span></div><button class="btn sm sec" data-act="vnSeenReset">Zurücksetzen</button></div></div>`;
}

/* ---------- Rätsel erzeugen ---------- */
function vnMakeStage(t, lv, forcedSd) {
  const p = vnS(), avoid = id => { const sn = p.vnSeen[t]; return !!(sn && sn.includes(id)) || vnFlagSet(t).has(id); }, bad = id => vnFlagSet(t).has(id);
  for (let k = 0; k < 40; k++) {
    const sd = forcedSd !== undefined ? forcedSd + k : Math.floor(Math.random() * 4294967295), P = { avoid, bad }, z = vnBuild({ t, lv, sd }, P);
    if (!z) continue;
    const d = { t, lv, sd }; if (z.ids) d.ids = z.ids; if (P.used && P.used.length) d.u = P.used;
    return { d, rep: !!P.rep };
  }
  return null;
}
function vnSeenMark(d, rep) {
  if (!VN_SEENT.includes(d.t) || !d.u) return;
  const p = vnS(); if (rep) { p.vnSeen[d.t] = []; p.vnRep[d.t] = (p.vnRep[d.t] || 0) + 1; }
  const sn = p.vnSeen[d.t] = p.vnSeen[d.t] || []; d.u.forEach(id => { if (!sn.includes(id)) sn.push(id); });
}
function vnNew(kind, lv, tm, wk) {
  const p = vnS(); let descs = [];
  if (kind === 'week') {
    const rnd = pzRng(pzSeed('ven2' + wk)), ty = pzShuf(VN_TYPES_CASE, rnd), lvs = pzShuf([3, 3, 4, 4, 5], rnd);
    descs = ty.map((t, i) => vnMakeStage(t, lvs[i], pzSeed('w' + wk + t)).d);
    lv = 5;
  } else {
    const grp = kind === 'code' ? 'w' : 'l', top = p[kind === 'code' ? 'vnCodeLvl' : 'vnCaseLvl'];
    const due = p.vnLater.find(e => e.g === grp && e.n <= 1 && e.lv <= top);
    p.vnLater.forEach(e => { if (e.g === grp) e.n--; });
    const ty = pzShuf(kind === 'code' ? VN_TYPES_WORD : VN_TYPES_CASE, Math.random).slice(0, VN_N[kind][lv - 1]);
    let di = -1; if (due) { p.vnLater.splice(p.vnLater.indexOf(due), 1); di = ty.indexOf(due.t); if (di < 0) di = ty.length - 1; }
    descs = ty.map((t, i) => { if (i === di) { const x = { t: due.t, lv: due.lv, sd: due.sd }; if (due.ids) x.ids = due.ids; return x; } const r = vnMakeStage(t, lv); vnSeenMark(r.d, r.rep); return r.d; });
  }
  return { st: 'play', kind, lv, tm, wk, el: 0, t0: 0, up: false, hints: 0, stages: descs, si: 0, sv: descs.map(() => 0), miss: descs.map(() => 0), wr: 0, ans: null, exp: false };
}
function vnPz(m) { m._pz = m._pz || {}; if (!m._pz[m.si]) m._pz[m.si] = vnBuild(m.stages[m.si], {}); return m._pz[m.si]; }
function vnAnsNew(p) {
  switch (p.kind) {
    case 'choice': return { sel: null, bad: [], tr: 0, ph: 'main', pf: null };
    case 'multi': return { qa: p.qs.map(() => ({ ok: false, bad: [], sel: null })), tr: 0, msg: '' };
    case 'pool': return { fill: p.groups.map(g => Array(g.n).fill(-1)), act: null, lk: {}, chk: false };
    case 'fields': return { v: p.items.map(() => ''), lk: p.items.map(() => false), chk: false };
    default: return { g: {}, lk: {}, sel: null, d: 'h', chk: false };
  }
}
function vnPersist(m) {
  if (!m) return; const p = vnS();
  const d = m.st === 'play' ? JSON.parse(JSON.stringify(m, (k, v) => (k[0] === '_' || k === 'save' || k === 't0') ? undefined : v)) : null;
  if (d) d.el = Math.round(PzT.el(m));
  if (m.kind === 'week') { p.vnWk = p.vnWk || { wk: m.wk }; p.vnWk.cur = d; } else p.vnCur = d;
  save();
}
const vnRestore = d => Object.assign({ st: 'play', t0: 0 }, JSON.parse(JSON.stringify(d)));
function vnStop() { const m = UI.vn; if (m) { PzT.stop(m); if (m.st === 'play') vnPersist(m); } }
function vnBegin(m) { if (!m.miss) m.miss = m.stages.map(() => 0); if (!(m.wr >= 0)) m.wr = 0; UI.vn = m; UI.vnAsk = false; m.save = () => vnPersist(m); PzT.start(m, 'venola', () => { sfx('tap'); if (view === 'venola') render(); }); if (!m.ans) m.ans = vnAnsNew(vnPz(m)); vnPersist(m); render(); }
const vnWeekState = () => { const p = vnS(), wk = pzWeek(); if (!p.vnWk || p.vnWk.wk !== wk) p.vnWk = { wk, done: false, cur: null }; return p.vnWk; };

/* ---------- Belohnungen ---------- */
function vnRewardsCheck(loud) {
  const p = vnS(); let any = false;
  VN_ROWS.forEach((r, ri) => { if (!p.vnRow[ri] && VN_KOF.filter(x => x.row === ri).every(x => p.vnKof[x.id])) { p.vnRow[ri] = Date.now(); any = true; unlock(r.acc, !loud); if (loud) toast('🧳', `Reihe ${ri + 1} komplett: <b>${esc(r.n)}</b>`); } });
  if (p.venWins >= 30 && !S.unl['acc.kommabz']) { unlock('acc.kommabz', !loud); any = true; }
  if (any) save();
}
function vnBuy(id) {
  const p = vnS(), it = VN_KOF.find(x => x.id === id); if (!it || p.vnKof[id] || p.vnMk < it.cost) return;
  p.vnMk -= it.cost; p.vnKof[id] = Date.now(); sfx('ok'); vnRewardsCheck(true); checkTrophies(); save(); render();
}
function vnWin(m) {
  PzT.stop(m); m.st = 'win'; const p = vnS(), secs = PzT.el(m), wk = m.kind === 'week', lv = m.lv, g = m.kind;
  const base = wk ? 12 : VN_BM[lv - 1], nS = m.stages.length, nMiss = (m.miss || []).filter(Boolean).length, wr = m.wr || 0, clean = !m.hints && !wr && !nMiss;
  m.bmBase = Math.round(base * (nS - nMiss) / nS); m.bmBonus = clean ? Math.max(1, Math.round(base / 2)) : 0; m.bmLost = Math.min(wr, m.bmBase);
  m.bm = m.bmBase - m.bmLost + m.bmBonus; m.nMiss = nMiss; p.vnMk += m.bm; p.vnMkT = (p.vnMkT || 0) + m.bm;
  const key = g === 'code' ? 'vnCodeLvl' : 'vnCaseLvl'; m.fresh = '';
  if (!wk && !nMiss && lv === p[key] && lv < 5) { p[key]++; m.fresh = (g === 'code' ? 'Geheimakte' : 'Kriminalfall') + ' · Stufe ' + p[key]; }
  if (!wk) { const q = clean && secs <= VN_QUICK[lv - 1]; p.vnQuick[g] = q ? (p.vnQuick[g] || 0) + 1 : 0; p.vnLast[g] = lv; }
  const rkB = vnRank(p.venWins).i;
  m.coins = pzCoins(VN_COIN[lv - 1], 'Akte gelöst') + (wk ? (() => { giveCoins(10, 'Großer Fall gelöst'); return 10; })() : 0);
  if (!wk && lv === 5) p.venL5 = (p.venL5 || 0) + 1;
  if (wk && p.vnWk) { p.vnWk.done = true; p.vnWk.cur = null; }
  m.find = null; if (wk) { const left = VN_KOF.filter(x => !p.vnKof[x.id]); if (left.length) { m.find = left[Math.floor(Math.random() * left.length)]; p.vnKof[m.find.id] = Date.now(); } }
  m.entry = pzFinish('ven', vnLbl(g, lv), secs, m.hints, { weekly: wk, inc: g === 'code' ? ['venCode'] : g === 'case' ? ['venCase'] : [] });
  if (!m.hints && !clean) p.venClean = Math.max(0, p.venClean - 1);                  // „ohne Hilfe“ zählt nur ganz fehlerfrei
  Object.assign(m.entry, { k: g, lv, bm: m.bm, wr, miss: nMiss, st: m.stages.map(s => s.t), rp: m.stages.map(s => ({ t: s.t, lv: s.lv, sd: s.sd, ids: s.ids })) });
  const rk = vnRank(p.venWins); m.rankUp = rk.i > rkB ? rk : null;
  vnRewardsCheck(true); vnPersist(m); save(); sfx('ok'); try { if (!rwCalm()) confetti(70); } catch (x) { }
}
/* Höchstens VN_TRIES Versuche pro Antwort (und pro Beweis). Danach zeigt Venola die Lösung, das Rätsel zählt als „nicht gelöst“
   (keine Beweismarken dafür), die Akte geht weiter. Jeder falsche Versuch kostet 1 Beweismarke – Münzen werden nie abgezogen. */
const VN_TRIES = 2;
function vnMiss(m) { m.sv[m.si] = 1; m.miss[m.si] = 1; m.exp = true; sfx('pop'); vnPersist(m); render(); }
function vnLose(m) {                                                                     // kein einziges Rätsel geschafft: wie Aufgeben (keine Belohnung, kein Verlust, Rätsel kommen wieder)
  PzT.stop(m); const p = vnS();
  if (m.kind !== 'week') m.stages.forEach(d => { const x = { g: m.kind === 'code' ? 'w' : 'l', t: d.t, lv: d.lv, sd: d.sd, n: 2 }; if (d.ids) x.ids = d.ids; p.vnLater.push(x); });
  else if (p.vnWk) p.vnWk.cur = null;
  m.st = 'gave'; m.lost = true; vnPersist(m); save(); render();
}
function vnSolveStage(m) {
  m.sv[m.si] = 1; m.exp = false; sfx('ok'); vnPersist(m); render();
}

/* ---------- Rätsel-Oberflächen ---------- */
const vnSol = p => p.sol || (p.opts ? `<b>${esc(String(p.opts[p.ans]))}</b>` : '');
function vnPoolEval(p, a) {
  return p.groups.map((g, gi) => {
    const f = a.fill[gi], full = f.every(x => x >= 0), txt = f.map(x => x >= 0 ? p.chips[x] : ''); let good = false;
    if (full) good = g.ok ? g.ok(txt[0]) : (p.join ? txt.join('') === g.ans : txt[0] === g.ans);
    return { full, good, txt };
  });
}
const vnFldEval = (p, a) => p.chk ? p.chk(a.v) : (() => { const ok = a.v.map((v, i) => v.trim() ? p.items[i].ans.map(vnNz).includes(vnNz(v)) : null); return { ok, done: ok.every(x => x === true), msg: '' }; })();
const vnTryInfo = (tr, done) => done ? '' : `<p class="vn-try">${tr ? '⚠️ Noch <b>1 Versuch</b>. Lies die Hinweise noch einmal genau.' : 'Du hast <b>2 Versuche</b>. Jeder falsche kostet eine Beweismarke.'}</p>`;
function vnUiOpts(opts, ans, st, act, done, sm) {
  return `<div class="vn-opts${sm ? ' sm' : ''}">${opts.map((o, i) => { const bad = st.bad.includes(i), on = st.sel === i, ok = done && i === ans; return `<button class="vn-opt${on && !done ? ' sel' : ''}${bad ? ' bad' : ''}${ok ? ' ok' : ''}" data-act="${act}" data-arg="${i}" ${bad || done ? 'disabled' : ''} aria-pressed="${on}">${esc(String(o))}${bad ? ' ✕' : ''}${ok ? ' ✔' : ''}</button>`; }).join('')}</div>`;
}
function vnUiChoice(p, a, solved) {
  const proof = a.ph === 'proof' || (solved && p.pf), mainDone = solved || a.ph === 'proof', pf = a.pf || { sel: null, bad: [], tr: 0 };
  let h = vnUiOpts(p.opts, p.ans, a, 'vnOpt', mainDone);
  if (!mainDone) return h + (a.msg ? `<p class="pz-msg">${esc(a.msg)}</p>` : '') + vnTryInfo(a.tr) + `<div class="center"><button class="btn big" data-act="vnOk" ${a.sel === null ? 'disabled' : ''}>Das ist meine Antwort</button></div>`;
  if (proof && p.pf) {
    h += `<section class="card vn-pf"><h3>🔎 ${solved ? 'Beweis' : 'Richtig! Jetzt beweise es'}</h3><p class="vn-q">${esc(p.pf.q.replace(/^Beweise es: /, ''))}</p>${vnUiOpts(p.pf.opts, p.pf.ans, pf, 'vnPfOpt', solved, p.pf.opts.length <= 6)}`;
    if (!solved) h += (pf.msg ? `<p class="pz-msg">${esc(pf.msg)}</p>` : '') + vnTryInfo(pf.tr) + `<div class="center"><button class="btn big" data-act="vnPfOk" ${pf.sel === null ? 'disabled' : ''}>Beweis abgeben</button></div>`;
    h += '</section>';
  }
  return h;
}
function vnUiMulti(p, a, solved) {
  const all = a.qa.every(st => st.ok || st.sel !== null);
  return p.qs.map((q, k) => { const st = a.qa[k]; return `<div class="vn-mq${st.ok ? ' ok' : ''}"><div class="vn-mh">${k + 1}. ${q.h}${st.ok ? ' ✔' : ''}</div>${vnUiOpts(q.opts, q.ans, st, 'vnMq', st.ok || solved, true).replace(/data-arg="(\d+)"/g, `data-arg="${k},$1"`)}</div>`; }).join('')
    + (solved ? '' : (a.msg ? `<p class="pz-msg">${esc(a.msg)}</p>` : '') + `<p class="vn-try">${a.tr ? '⚠️ Noch <b>1 Prüfung</b>. Die falschen Antworten sind durchgestrichen.' : 'Beantworte alle Aufgaben, dann prüfe einmal. Du hast <b>2 Prüfungen</b>.'}</p><div class="center"><button class="btn big" data-act="vnMqChk" ${all ? '' : 'disabled'}>Prüfen</button></div>`);
}
function vnUiPool(p, a, solved) {
  const ev = vnPoolEval(p, a), used = new Set(a.fill.flat().filter(x => x >= 0));
  const slot = (gi, si) => { const c = a.fill[gi][si], key = gi + '.' + si, g = ev[gi], cls = ['vn-slot', c >= 0 ? 'full' : '', a.act === key ? 'act' : '', a.lk[key] ? 'lk' : '', (a.chk || solved) && g.full ? (g.good ? 'good' : 'wrong') : ''].join(' '); return `<button class="${cls}" data-act="vnSlot" data-arg="${key}" ${solved ? 'disabled' : ''} aria-label="Lücke ${gi + 1}${c >= 0 ? ': ' + esc(p.chips[c]) : ''}">${c >= 0 ? esc(p.chips[c]) : ''}</button>`; };
  let body;
  if (p.inline) body = `<p class="vn-text">${p.inline.map((t, i) => esc(t) + (i < p.groups.length ? slot(i, 0) : '')).join('')}</p>`;
  else body = p.groups.map((g, gi) => `<div class="vn-grp"><div class="vn-gl">${p.t === 'chn' ? esc(g.pre) + ' ' : ''}</div><div class="vn-gs">${p.t === 'chn' ? slot(gi, 0) + `<span class="vn-gp">${esc(g.post)}</span>` : g.fill === undefined ? Array.from({ length: g.n }, (x, si) => slot(gi, si)).join('') : ''}</div>${p.t === 'sil' ? `<div class="vn-gq">${esc(g.lab)}</div>` : ''}</div>`).join('');
  return `${body}<div class="vn-chips" aria-label="Vorrat">${p.chips.map((c, i) => `<button class="vn-chip${used.has(i) ? ' used' : ''}${p.join ? ' syl' : ''}" data-act="vnChip" data-arg="${i}" ${used.has(i) || solved ? 'disabled' : ''}>${esc(c)}</button>`).join('')}</div>
    ${solved ? '' : '<div class="center"><button class="btn sec" data-act="vnPoolChk">Prüfen</button></div>'}`;
}
function vnUiFields(p, a, solved) {
  const ev = (a.chk || solved) ? vnFldEval(p, a) : { ok: [], msg: '' };
  return `<div class="vn-fl">${p.items.map((it, i) => `<label class="vn-fr${ev.ok[i] === true ? ' good' : ev.ok[i] === false ? ' wrong' : ''}"><span class="vn-fq">${it.lab}</span><input class="txt vn-in" data-i="${i}" value="${esc(a.v[i] || '')}" ${a.lk[i] || solved ? 'disabled' : ''} autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="24" aria-label="${p.t === 'lad' ? 'Wort für ' + esc(it.lab) : 'Antwort ' + (i + 1)}"></label>`).join('')}</div>
    ${a.chk && ev.msg && !solved ? `<p class="pz-msg">${esc(ev.msg)}</p>` : ''}${solved ? '' : '<div class="center"><button class="btn big" data-act="vnFldChk">Prüfen</button></div>'}`;
}
const VN_KEYS = 'QWERTZUIOPÜASDFGHJKLÖÄYXCVBNM'.split('');
function vnWordAt(p, key, d) { return p.words.find(w => w.d === d && (d === 'h' ? (key.split(',')[0] == w.r && +key.split(',')[1] >= w.c && +key.split(',')[1] < w.c + w.w.length) : (key.split(',')[1] == w.c && +key.split(',')[0] >= w.r && +key.split(',')[0] < w.r + w.w.length))); }
const vnWordCells = w => Array.from({ length: w.w.length }, (x, k) => (w.r + (w.d === 'v' ? k : 0)) + ',' + (w.c + (w.d === 'h' ? k : 0)));
function vnUiCross(p, a, solved) {
  const aw = a.sel ? (vnWordAt(p, a.sel, a.d) || vnWordAt(p, a.sel, a.d === 'h' ? 'v' : 'h')) : null, hl = new Set(aw ? vnWordCells(aw) : []), starts = {};
  p.words.forEach(w => { starts[w.r + ',' + w.c] = w.no; });
  let cells = '';
  for (let r = 0; r < p.H; r++) for (let c = 0; c < p.W; c++) {
    const k = r + ',' + c, L = p.cells[k];
    if (!L) { cells += '<i class="vn-c off"></i>'; continue; }
    const v = a.g[k] || '', cls = ['vn-c', a.sel === k ? 'sel' : '', hl.has(k) ? 'hl' : '', a.lk[k] ? 'lk' : '', (a.chk || solved) && v ? (v === L ? 'good' : 'wrong') : ''].join(' ');
    cells += `<button class="${cls}" data-act="vnCell" data-arg="${k}" ${solved ? 'disabled' : ''} aria-label="Kästchen Zeile ${r + 1}, Spalte ${c + 1}${v ? ', ' + v : ''}">${starts[k] ? `<sup>${starts[k]}</sup>` : ''}<b>${esc(v)}</b></button>`;
  }
  const list = d => p.words.filter(w => w.d === d).sort((x, y) => x.no - y.no).map(w => `<li><b>${w.no}</b> ${esc(w.h)} <small class="mute">(${w.w.length})</small></li>`).join('');
  return `<div class="vn-xw" style="--w:${p.W}">${cells}</div>
    ${aw && !solved ? `<p class="vn-ac"><b>${aw.no} ${aw.d === 'h' ? 'waagerecht →' : 'senkrecht ↓'}</b> ${esc(aw.h)} <small class="mute">(${aw.w.length} Buchstaben)</small></p>` : '<p class="vn-ac mute">Tippe ein Kästchen an.</p>'}
    ${solved ? '' : `<div class="vn-pad vn-kb">${VN_KEYS.map(l => `<button class="vn-k" data-act="vnKey" data-arg="${l}">${l}</button>`).join('')}<button class="vn-k er" data-act="vnKey" data-arg="" aria-label="Löschen">⌫</button></div><div class="center"><button class="btn sec" data-act="vnCrossChk">Prüfen</button></div>`}
    <div class="vn-clist"><div><h4>Waagerecht →</h4><ul>${list('h')}</ul></div><div><h4>Senkrecht ↓</h4><ul>${list('v')}</ul></div></div>`;
}
function vnUi(p, a, solved) {
  return p.kind === 'choice' ? vnUiChoice(p, a, solved) : p.kind === 'multi' ? vnUiMulti(p, a, solved) : p.kind === 'pool' ? vnUiPool(p, a, solved) : p.kind === 'fields' ? vnUiFields(p, a, solved) : vnUiCross(p, a, solved);
}
const vnExpCard = p => `<section class="card vn-exp"><h3>So kommst du darauf</h3><ol>${p.ex.map(l => `<li>${vnExHtml(l)}</li>`).join('')}</ol></section>`;

/* ---------- Ansichten ---------- */
const vnTitle = () => `<h1 class="vn-title" aria-label="Venola Holmes">${'VENOLA HOLMES'.split('').map(c => c === ' ' ? '<i class="vn-sp"></i>' : `<span>${c}</span>`).join('')}</h1>`;
const vnTop = (back) => topBar('Venola Holmes', back || 'rewards');
/* ---------- Detektiv-Regeln: vor der ersten Akte (und nach jeder Regeländerung) einmal lesen und jede Regel einzeln abhaken ---------- */
const VN_RULES_VER = 1;
const VN_RULE_TXT = [
  ['✌️', 'Zwei Versuche', 'Pro Antwort hast du 2 Versuche. Danach zeigt Venola die Lösung.'],
  ['🔎', 'Beweise es!', 'Im Kriminalfall kommt nach der richtigen Antwort noch eine Beweis-Frage.'],
  ['➖', 'Fehler kosten Marken', 'Jeder Fehler kostet 1 Beweismarke. Münzen verlierst du nie.'],
  ['✅', 'Erst alles, dann prüfen', 'Bei Analogien: erst alle Aufgaben beantworten, dann einmal prüfen.'],
  ['⭐', 'Fehlerfrei lohnt sich', 'Ohne Fehler gibt es Bonus. Neue Stufe nur, wenn jedes Rätsel gelöst ist.']
];
function vnRulesView() {
  const p = vnS(), gate = !!UI.vnRulesNext, ok = UI.vnRk || (UI.vnRk = {}), all = VN_RULE_TXT.every((r, i) => ok[i]);
  return vnTop() + `<div class="vn-hero"><h2 class="vn-title2">📜 Detektiv-Regeln</h2><p class="small mute">${gate ? 'Lies jede Regel und tippe auf „Verstanden“.' : 'So funktionieren die Akten.'}</p><p class="vn-pause">⏸ Die Uhr ist angehalten, solange du die Regeln liest.</p>
    ${typeof wSpeak === 'function' ? '<button class="btn sec" data-act="vnRulesRead">🔊 Vorlesen</button>' : ''}</div>
    ${VN_RULE_TXT.map((r, i) => `<section class="card vn-rl${ok[i] || !gate ? ' done' : ''}"><span class="vn-rl-i">${r[0]}</span><div><h3>${i + 1}. ${esc(r[1])}</h3><p>${esc(r[2])}</p>${gate ? (ok[i] ? '<p class="vn-rl-ok">✓ Verstanden</p>' : `<button class="btn sm" data-act="vnRuleOk" data-arg="${i}">Verstanden</button>`) : ''}</div></section>`).join('')}
    <div class="center" style="margin-top:12px">${gate ? `<button class="btn big" data-act="vnRulesGo" ${all ? '' : 'disabled'}>${all ? 'Alles klar – los geht’s!' : `Noch ${VN_RULE_TXT.filter((r, i) => !ok[i]).length} ${VN_RULE_TXT.filter((r, i) => !ok[i]).length === 1 ? 'Regel' : 'Regeln'} lesen`}</button>` : '<button class="btn big" data-act="vnMenu">Zurück</button>'}</div>`;
}
const vnRulesGate = (act, arg) => { const p = vnS(); if ((p.vnRulesV || 0) >= VN_RULES_VER) return false; UI.vnRulesNext = { act, arg }; UI.vnRk = {}; UI.vnV = 'rules'; sfx('tap'); render(); return true; };
function vnSetup() {
  const p = vnS(), u = UI.vnSet || (UI.vnSet = { game: 'case', lv: p.vnLast.case || 1, tm: 0 }), wkS = vnWeekState(), rk = vnRank(p.venWins), key = u.game === 'code' ? 'vnCodeLvl' : 'vnCaseLvl', top = p[key];
  if (u.lv > top) u.lv = top;
  const lvs = [1, 2, 3, 4, 5].map(l => `<button class="sd-lv${u.lv === l ? ' on' : ''}${l <= top ? '' : ' lock'}" data-act="vnLvl" data-arg="${l}" ${l <= top ? '' : 'disabled'} aria-pressed="${u.lv === l}" title="${VN_N[u.game][l - 1]} ${VN_N[u.game][l - 1] === 1 ? 'Rätsel' : 'Rätsel'}">${l <= top ? '' : ico('lock', 13) + ' '}Stufe ${l}<small>${VN_N[u.game][l - 1]} ${VN_N[u.game][l - 1] === 1 ? 'Rätsel' : 'Rätsel'}</small></button>`).join('');
  const cont = p.vnCur ? `<section class="card sd-cont"><b>Begonnen: ${vnLbl(p.vnCur.kind, p.vnCur.lv)}</b><span class="small mute">Rätsel ${p.vnCur.si + 1} von ${p.vnCur.stages.length} · ${fmtT(p.vnCur.el || 0)} Min</span><button class="btn" data-act="vnCont" data-arg="cur">Weiterermitteln</button></section>` : '';
  const wk = wkS.done ? '<span class="small mute">Gelöst ✔ – der nächste Große Fall kommt am Montag.</span>' : `<button class="btn" data-act="vnCont" data-arg="week">${wkS.cur ? 'Weiterermitteln' : 'Großen Fall starten'}</button>`;
  const quick = (p.vnQuick[u.game] || 0) >= 3 && u.lv < top ? `<p class="vn-sug">⚡ Drei schnelle Siege ohne Hinweis! Magst du <b>Stufe ${u.lv + 1}</b> probieren? <button class="btn sm" data-act="vnLvl" data-arg="${u.lv + 1}">Stufe ${u.lv + 1} wählen</button></p>` : '';
  const next = top < 5 ? `<p class="small mute">Löse eine Akte auf Stufe ${top}, dann öffnet sich Stufe ${top + 1}.</p>` : '';
  const rep = Object.keys(p.vnRep).filter(t => p.vnRep[t]).length ? '<p class="small mute">Du kennst schon alles von mindestens einer Rätselart – sie kommen jetzt in neuer Mischung wieder.</p>' : '';
  return vnTop() + `<div class="vn-hero">${vnTitle()}<p class="small mute">Löse Akten, sammle Beweismarken und werde Meisterdetektiv.</p></div>
    <section class="card vn-rankc"><span class="vn-ri">${rk.ic}</span><div><b>${esc(rk.name)}</b><br><small class="mute">${p.venWins} ${p.venWins === 1 ? 'Akte' : 'Akten'} gelöst${rk.next ? ` · noch ${rk.need} bis „${esc(rk.next)}“` : ' · höchster Rang!'}</small><div class="bar" style="margin-top:6px"><i style="width:${rk.pct}%"></i></div></div><button class="btn sec vn-kb2" data-act="vnKoffer">🧳 Koffer<small>${p.vnMk} 🔎</small></button></section>${cont}
    <section class="card sd-week"><h3>Der Große Fall der Woche</h3><p class="small mute">Fünf Logik-Rätsel in einer Akte, schwer. Neu am Montag. Bonus: +12 🔎, +10 🪙 und ein Beweisstück für den Koffer.</p>${wk}</section>
    <section class="card sd-setup"><h3>Neue Akte</h3><div class="vn-games"><button class="vn-g${u.game === 'case' ? ' on' : ''}" data-act="vnGame" data-arg="case">🔍<b>Kriminalfall</b><small>Logik · Stufe ${p.vnCaseLvl} von 5 offen</small></button><button class="vn-g${u.game === 'code' ? ' on' : ''}" data-act="vnGame" data-arg="code">🗝️<b>Geheimakte</b><small>Wörter · Stufe ${p.vnCodeLvl} von 5 offen</small></button></div>
    <p class="small mute" style="margin:8px 0 0">${u.game === 'case' ? 'Wer lügt? · Alibi-Gitter · Zeitleiste · Widerspruch · Einstein-Rätsel' : 'Silbenrätsel · Wortleiter · Wörterkette · Analogien · Versteckte Wörter · Kreuzworträtsel · Lückentext'}</p>
    <h3>Stufe</h3><div class="sd-lvrow vn-lvrow">${lvs}</div>${next}${quick}<h3>Zeit</h3>${pzTimeChips('vnTime', u.tm)}<p class="small mute">Wenn die Zeit um ist, kannst du ohne Zeit weiterspielen.</p>
    <div class="center" style="margin-top:12px"><button class="btn big" data-act="vnStart">Los geht’s</button></div><div class="center" style="margin-top:10px"><button class="btn sec" data-act="vnHist">Meine Akten (${p.hist.filter(e => e.g === 'ven').length})</button> <button class="btn sec" data-act="vnRules">📜 Regeln</button></div>${rep}</section>`;
}
function vnPlay(m) {
  const p = vnPz(m), a = m.ans || (m.ans = vnAnsNew(p)), solved = !!m.sv[m.si], last = m.si === m.stages.length - 1, kindK = m.kind === 'code' ? 'vg' : 'vc';
  const dots = `<div class="vn-dots" aria-label="Rätsel ${m.si + 1} von ${m.stages.length}">${m.stages.map((s, i) => `<i class="${m.miss && m.miss[i] ? 'miss' : m.sv[i] ? 'ok' : i === m.si ? 'on' : ''}"></i>`).join('')}</div>`;
  if (UI.vnAsk && !solved) return vnTop() + `${pzClock(m)}${dots}<section class="card vn-ask"><h3>Wirklich aufgeben?</h3><p>Du siehst die Lösung und den Lösungsweg. Diese Akte endet <b>ohne Belohnung</b> – aber auch <b>ohne Verlust</b>. Das Rätsel kommt später wieder.</p><div class="row wrap" style="justify-content:center"><button class="btn" data-act="vnGiveYes">Ja, Lösungsweg zeigen</button><button class="btn sec" data-act="vnGiveNo">Nein, weiter knobeln</button></div></section>`;
  const tools = solved ? '' : `<div class="pz-tools">${pzHintBtn('vnHint', kindK)}<button class="btn sec pz-tool" data-act="vnGiveAsk">Aufgeben &amp; Lösungsweg</button></div>`;
  const missed = !!(m.miss && m.miss[m.si]), after = solved ? `${missed ? `<section class="card vn-missc"><p><b>Leider nicht.</b> Für dieses Rätsel gibt es keine Beweismarken. So wäre es richtig: ${vnSol(p)}${p.pf ? ` · Beweis: <b>${esc(String(p.pf.opts[p.pf.ans]))}</b>` : ''}</p></section>` : '<p class="pz-msg ok">Gelöst! ✔</p>'}<div class="pz-tools"><button class="btn sec pz-tool" data-act="vnExp" aria-expanded="${!!m.exp}">${m.exp ? 'Lösungsweg zudecken' : 'Wie komme ich darauf?'}</button></div>${m.exp ? vnExpCard(p) : ''}<div class="center" style="margin-top:8px"><button class="btn big" data-act="vnNext">${last ? 'Akte abschließen' : 'Nächstes Rätsel'}</button></div>` : '';
  const flag = (solved || m.fl && m.fl[m.si]) ? (m.fl && m.fl[m.si] ? '<p class="small mute center">Gemeldet. Diese Frage kommt nicht wieder.</p>' : '') : '<div class="center"><button class="vn-link" data-act="vnFlagQ">Frage melden</button></div>';
  return vnTop() + `${pzClock(m)}${dots}<p class="sd-info small mute">${esc(vnLbl(m.kind, m.lv))} · Rätsel ${m.si + 1} von ${m.stages.length}${m.hints ? ' · Hinweise: ' + m.hints : ''}</p>
    <section class="card vn-card"><h3 class="vn-h">${esc(p.title)}</h3>${p.body}${p.q ? `<p class="vn-q">${esc(p.q)}</p>` : ''}</section>${vnUi(p, a, solved)}${tools}${after}${flag}
    <div class="center" style="margin-top:12px"><button class="btn sec" data-act="vnMenu">Speichern und Menü</button></div>`;
}
function vnWinView(m) {
  const e = m.entry || { pk: [], fg: [] }, p = vnS();
  return vnTop() + `<section class="card result pz-res"><h2>${m.nMiss ? 'Akte abgeschlossen 🕵️' : 'Akte gelöst! 🕵️'}</h2><p>${esc(vnLbl(m.kind, m.lv))} in <b>${fmtT(e.secs || 0)}</b> Min${m.hints ? ` mit ${m.hints} ${m.hints === 1 ? 'Hinweis' : 'Hinweisen'}` : ' ganz ohne Hinweis'}.</p>
    ${m.nMiss || m.bmLost ? `<p class="small">${m.nMiss ? `${m.nMiss} ${m.nMiss === 1 ? 'Rätsel' : 'Rätsel'} nicht gelöst (keine Marken dafür${m.kind === 'week' ? '' : ', keine neue Stufe'}). ` : ''}${m.bmLost ? `−${m.bmLost} 🔎 für falsche Versuche.` : ''}</p>` : (!m.hints ? '<p class="small">Fehlerfrei gelöst – Bonus! ⭐</p>' : '')}
    <p class="vn-gain">+${m.bm} 🔎 Beweismarken${m.coins ? ` · +${m.coins} 🪙` : ''}</p>${m.find ? `<p>Du findest ein Beweisstück für den Koffer: <b>${esc(m.find.n)}</b>!</p>` : ''}${m.rankUp ? `<p class="vn-rup">${m.rankUp.ic} Neuer Rang: <b>${esc(m.rankUp.name)}</b>!</p>` : ''}${m.fresh ? `<p>Neue Stufe frei: <b>${esc(m.fresh)}</b></p>` : ''}${pzResultExtras(e)}
    <p class="small mute">Du hast jetzt ${p.vnMk} 🔎. Im Detektivkoffer kannst du Beweisstücke kaufen.</p>
    <div class="row wrap" style="justify-content:center"><button class="btn big" data-act="vnAgain">Noch eine Akte</button><button class="btn sec" data-act="vnKoffer">🧳 Koffer</button><button class="btn sec" data-act="vnMenu">Menü</button></div></section>`;
}
function vnGaveView(m) {
  const p = vnPz(m);
  if (m.lost) return vnTop() + `<section class="card result pz-res"><h2>Das war knifflig 🧩</h2><p>Diesmal hat kein Rätsel geklappt. Die Akte endet ohne Belohnung und ohne Verlust – die Rätsel kommen später wieder. Schau dir im Verlauf oder beim nächsten Mal genau den Lösungsweg an.</p><div class="row wrap" style="justify-content:center"><button class="btn big" data-act="vnAgain">Neue Akte</button><button class="btn sec" data-act="vnMenu">Menü</button></div></section>`;
  return vnTop() + `<section class="card result pz-res"><h2>Das war knifflig 🧩</h2><p>Hier ist die Lösung. Die Akte endet ohne Belohnung und ohne Verlust – dieses Rätsel kommt später wieder, dann kannst du es lösen.</p></section>
    <section class="card vn-card"><h3 class="vn-h">${esc(p.title)}</h3>${p.body}<p class="vn-note">Lösung: ${vnSol(p)}</p></section>${vnExpCard(p)}
    <div class="row wrap" style="justify-content:center"><button class="btn big" data-act="vnAgain">Neue Akte</button><button class="btn sec" data-act="vnMenu">Menü</button></div>`;
}
function vnKofferView() {
  const p = vnS();
  return vnTop('venola') + `<div class="vn-hero"><h1 class="vn-title2">Detektivkoffer</h1><p class="small mute">Du hast <b>${p.vnMk} 🔎</b>. Beweismarken gibt es nur bei Venola Holmes – und ausgeben kannst du sie nur hier.</p></div>` +
    VN_ROWS.map((r, ri) => { const its = VN_KOF.filter(x => x.row === ri), have = its.filter(x => p.vnKof[x.id]).length;
      return `<section class="card vn-row"><h3>Reihe ${ri + 1}: ${esc(r.n)} <small class="mute">${have} von 4</small></h3><p class="small mute">${p.vnRow[ri] ? '✔ Reihe komplett' : 'Reihe komplett:'} Avatar-Teil „${esc(r.an)}“</p>
      <div class="vn-kof">${its.map(x => { const own = !!p.vnKof[x.id]; return `<div class="vn-ki${own ? ' own' : ''}"><svg viewBox="0 0 48 48" aria-hidden="true">${x.svg}</svg><b>${esc(x.n)}</b>${own ? `<small>${esc(x.s)}</small>` : `<button class="btn sm" data-act="vnBuy" data-arg="${x.id}" ${p.vnMk < x.cost ? 'disabled' : ''}>${x.cost} 🔎</button>`}</div>`; }).join('')}</div></section>`; }).join('') +
    `<p class="small mute center">Rang „Kommissarin“ (30 Akten) schenkt dir außerdem das Kommissar-Abzeichen für deinen Avatar.</p>`;
}
const VN_HK = [['all', 'Alle'], ['case', 'Kriminalfall'], ['code', 'Geheimakte'], ['week', 'Großer Fall']];
function vnHistView() {
  const p = vnS(), f = UI.vnHf || (UI.vnHf = { k: 'all', t: 'all', n: 40 }), all = p.hist.map((e, i) => [e, i]).filter(x => x[0].g === 'ven').reverse();
  const L = all.filter(([e]) => (f.k === 'all' || e.k === f.k) && (f.t === 'all' || (e.st || []).includes(f.t)));
  const row = ([e, i]) => { const inner = `<span class="pz-hd">${pzMD(e.ts)}</span><b>${esc(e.lbl)}</b><span>${fmtT(e.secs)} min</span><span class="small mute">${e.hints ? e.hints + (e.hints === 1 ? ' Hinweis' : ' Hinweise') : 'ohne Hinweis'}${e.bm ? ' · +' + e.bm + ' 🔎' : ''}</span>${e.st ? `<span class="vn-hts">${e.st.map(t => esc(VN_TNAME[t] || t)).join(' · ')}</span>` : ''}`; return e.rp ? `<button class="pz-h vn-hr" data-act="vnRep" data-arg="${i}">${inner}</button>` : `<div class="pz-h vn-hr">${inner}</div>`; };
  return vnTop('venola') + `<div class="vn-hero"><h1 class="vn-title2">Meine Akten</h1><p class="small mute">${all.length} gelöst${all.length ? ' · schnellste Zeit ' + fmtT(Math.min(...all.map(x => x[0].secs))) + ' min' : ''}. Tippe auf eine Akte, um die Rätsel mit Lösung und Lösungsweg noch einmal anzusehen.</p></div>
    <div class="pz-chips">${VN_HK.map(k => `<button class="pz-chip${f.k === k[0] ? ' on' : ''}" data-act="vnHf" data-arg="k:${k[0]}">${k[1]}</button>`).join('')}</div>
    <div class="pz-chips" style="margin-top:8px"><button class="pz-chip${f.t === 'all' ? ' on' : ''}" data-act="vnHf" data-arg="t:all">Alle Rätselarten</button>${Object.keys(VN_TNAME).map(t => `<button class="pz-chip${f.t === t ? ' on' : ''}" data-act="vnHf" data-arg="t:${t}">${esc(VN_TNAME[t])}</button>`).join('')}</div>
    <section class="card">${L.length ? L.slice(0, f.n).map(row).join('') : '<p class="mute">Hier ist noch nichts. Löse eine Akte, dann steht sie hier.</p>'}${L.length > f.n ? `<div class="center" style="margin-top:10px"><button class="btn sec" data-act="vnHf" data-arg="n:more">Mehr anzeigen (${L.length - f.n} weitere)</button></div>` : ''}</section>`;
}
function vnRepView() {
  const e = vnS().hist[UI.vnRep]; if (!e || !e.rp) return vnHistView();
  return vnTop('venola') + `<div class="center" style="margin:6px 0"><button class="btn sec" data-act="vnRep" data-arg="-1">‹ Zurück zu meinen Akten</button></div><section class="card"><h3>${esc(e.lbl)}</h3><p class="small mute">${pzMD(e.ts)} · ${fmtT(e.secs)} min</p></section>` +
    e.rp.map((d, k) => { let p = null; try { p = vnBuild(d, {}); } catch (x) { } if (!p) return ''; return `<section class="card vn-card"><h3 class="vn-h">${k + 1}. ${esc(p.title)}</h3>${p.body}<p class="vn-note">Lösung: ${vnSol(p)}</p><details class="vn-det"><summary>Wie komme ich darauf?</summary><ol>${p.ex.map(l => `<li>${vnExHtml(l)}</li>`).join('')}</ol></details></section>`; }).join('');
}
VIEWS.venola = () => {
  UI.noClock = UI.vnV === 'rules' ? 'venola' : null;                                // Regeln lesen kostet keine Spielzeit
  if (UI.vnV === 'rules') return vnRulesView();
  if (UI.vnV === 'koffer') return vnKofferView();
  if (UI.vnV === 'hist') return UI.vnRep >= 0 && UI.vnRep !== undefined && UI.vnRep !== null ? vnRepView() : vnHistView();
  const m = UI.vn; if (!m) return vnSetup();
  return m.st === 'win' ? vnWinView(m) : m.st === 'gave' ? vnGaveView(m) : vnPlay(m);
};
DZ_ART.venola = '<rect x="6" y="6" width="38" height="40" rx="7" fill="#f4efe4" stroke="#52676c" stroke-width="2"/><path d="M13 16h24M13 23h18M13 30h22" stroke="#bed1c6" stroke-width="2.4" stroke-linecap="round"/><circle cx="38" cy="29" r="12" fill="#e7edeb" fill-opacity=".85" stroke="#52676c" stroke-width="3"/><path d="M47 38l10 10" stroke="#9c6668" stroke-width="5" stroke-linecap="round"/><text x="38" y="34" font-size="14" font-weight="800" text-anchor="middle" fill="#52676c" font-family="sans-serif">?</text>';

/* ---------- Eingaben ---------- */
const vnCur = () => { const m = UI.vn; return m && m.st === 'play' && !(m.sv && m.sv[m.si]) ? m : null; };
function vnAfterPool(m) {
  const p = vnPz(m), a = m.ans, ev = vnPoolEval(p, a);
  if (ev.every(g => g.full)) { if (ev.every(g => g.good)) { vnSolveStage(m); return; } a.chk = true; m.wr++; sfx('no'); }
  vnPersist(m); render();
}
function vnPlace(m, ci) {
  const p = vnPz(m), a = m.ans, used = new Set(a.fill.flat().filter(x => x >= 0)); if (used.has(ci)) return;
  let key = a.act; if (!key || a.fill[key.split('.')[0]][key.split('.')[1]] >= 0) key = null;
  if (!key) for (let gi = 0; gi < a.fill.length && !key; gi++) for (let si = 0; si < a.fill[gi].length; si++) if (a.fill[gi][si] < 0) { key = gi + '.' + si; break; }
  if (!key) return;
  const [gi, si] = key.split('.').map(Number); a.fill[gi][si] = ci; a.chk = false; sfx('tap');
  a.act = null; for (let g2 = gi; g2 < a.fill.length && !a.act; g2++) for (let s2 = (g2 === gi ? si + 1 : 0); s2 < a.fill[g2].length; s2++) if (a.fill[g2][s2] < 0) { a.act = g2 + '.' + s2; break; }
  vnAfterPool(m);
}
function vnCrossSet(m, key, L) {
  const p = vnPz(m), a = m.ans; if (!key || a.lk[key]) return;
  if (L) a.g[key] = L; else delete a.g[key];
  a.chk = false;
  if (L) { const w = vnWordAt(p, key, a.d); if (w) { const cs = vnWordCells(w), i = cs.indexOf(key); if (i >= 0 && i < cs.length - 1) a.sel = cs[i + 1]; } }
  const full = Object.keys(p.cells).every(k => a.g[k]);
  if (full) { if (Object.keys(p.cells).every(k => a.g[k] === p.cells[k])) { vnSolveStage(m); return; } a.chk = true; m.wr++; sfx('no'); }
  vnPersist(m); render();
}
function vnGiveUp(m) {
  PzT.stop(m); const p = vnS(), d = m.stages[m.si];
  if (m.kind !== 'week') { const x = { g: m.kind === 'code' ? 'w' : 'l', t: d.t, lv: d.lv, sd: d.sd, n: 2 }; if (d.ids) x.ids = d.ids; p.vnLater.push(x); p.vnQuick[m.kind] = 0; }
  m.st = 'gave'; UI.vnAsk = false; vnPersist(m);
  if (m.kind === 'week' && p.vnWk) p.vnWk.cur = null;
  save(); sfx('tap'); render();
}
document.addEventListener('input', e => { const t = e.target; if (t && t.classList && t.classList.contains('vn-in')) { const m = UI.vn; if (m && m.ans && m.ans.v) { m.ans.v[+t.dataset.i] = t.value; m.ans.chk = false; } } });
document.addEventListener('keydown', e => { const t = e.target; if (e.key === 'Enter' && t && t.classList && t.classList.contains('vn-in')) { e.preventDefault(); const nx = t.closest('.vn-fl') && [...t.closest('.vn-fl').querySelectorAll('.vn-in:not(:disabled)')], i = nx ? nx.indexOf(t) : -1; if (nx && i >= 0 && i < nx.length - 1) nx[i + 1].focus(); else if (typeof ACT !== 'undefined' && ACT.vnFldChk) ACT.vnFldChk(); } });

registerFeature({
  id: 'venola', title: 'Venola Holmes', icon: 'sparkle', tint: 'sky', group: 'spiel', order: 82, view: 'venola',
  leave: () => { vnStop(); UI.vn = null; UI.vnV = null; UI.vnAsk = false; UI.vnRulesNext = null; UI.noClock = null; try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { } },
  check: () => { vnS(); vnRewardsCheck(false); },
  acts: {
    venola: () => { vnStop(); UI.vn = null; UI.vnSet = null; UI.vnV = null; UI.vnAsk = false; go('venola'); },
    vnGame: g => { const p = vnS(); UI.vnSet.game = g; UI.vnSet.lv = p.vnLast[g] || 1; render(); },
    vnLvl: l => { const p = vnS(); if (+l <= p[UI.vnSet.game === 'code' ? 'vnCodeLvl' : 'vnCaseLvl']) { UI.vnSet.lv = +l; p.vnQuick[UI.vnSet.game] = 0; } render(); },
    vnTime: t => { UI.vnSet.tm = +t; render(); },
    vnStart: () => { if (vnRulesGate('vnStart')) return; const u = UI.vnSet; sfx('tap'); vnBegin(vnNew(u.game, u.lv, u.tm)); },
    vnRules: () => { vnStop(); UI.vn = null; UI.vnRulesNext = null; UI.vnV = 'rules'; render(); },
    vnRuleOk: i => { (UI.vnRk || (UI.vnRk = {}))[+i] = 1; sfx('tap'); render(); },
    vnRulesRead: () => { if (typeof wSpeak === 'function') wSpeak('Detektiv-Regeln. ' + VN_RULE_TXT.map((r, i) => (i + 1) + '. ' + r[1] + '. ' + r[2]).join(' '), 'de-DE'); },
    vnRulesGo: () => {
      if (!VN_RULE_TXT.every((r, i) => UI.vnRk && UI.vnRk[i])) return;
      const p = vnS(), nx = UI.vnRulesNext; p.vnRulesV = VN_RULES_VER; save(); UI.vnRulesNext = null; UI.vnV = null;
      try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { }
      if (nx && ACT[nx.act]) ACT[nx.act](nx.arg); else render();
    },
    vnCont: w => {
      if (vnRulesGate('vnCont', w)) return;
      const p = vnS(); let m;
      if (w === 'week') { const ws = vnWeekState(); m = ws.cur ? vnRestore(ws.cur) : vnNew('week', 5, (UI.vnSet && UI.vnSet.tm) || 0, ws.wk); } else if (p.vnCur) m = vnRestore(p.vnCur);
      if (m) vnBegin(m);
    },
    vnHist: () => { UI.vnV = UI.vnV === 'hist' ? null : 'hist'; UI.vnRep = -1; render(); },
    vnHf: a => { const f = UI.vnHf || (UI.vnHf = { k: 'all', t: 'all', n: 40 }), [k, v] = a.split(':'); if (k === 'n') f.n += 40; else { f[k] = v; f.n = 40; } render(); },
    vnRep: i => { UI.vnRep = +i; render(); },
    vnKoffer: () => { vnStop(); UI.vn = null; UI.vnV = 'koffer'; render(); },
    vnBuy: id => vnBuy(id),
    vnMenu: () => { vnStop(); UI.vn = null; UI.vnV = null; UI.vnAsk = false; UI.vnRulesNext = null; render(); },
    vnAgain: () => { UI.vn = null; UI.vnV = null; render(); },
    vnOpt: i => { const m = vnCur(); if (!m) return; const a = m.ans; a.sel = +i; a.msg = ''; sfx('tap'); render(); },
    vnOk: () => {
      const m = vnCur(); if (!m) return; const a = m.ans, p = vnPz(m); if (a.sel === null || a.ph === 'proof') return;
      if (a.sel === p.ans) { if (p.pf) { a.ph = 'proof'; a.pf = a.pf || { sel: null, bad: [], tr: 0, msg: '' }; a.msg = ''; sfx('ok'); vnPersist(m); render(); } else vnSolveStage(m); return; }
      a.bad.push(a.sel); a.sel = null; a.tr = (a.tr || 0) + 1; m.wr++;
      if (a.tr >= VN_TRIES) { vnMiss(m); return; }
      a.msg = 'Das stimmt nicht – diese Antwort ist jetzt durchgestrichen.'; sfx('no'); vnPersist(m); render();
    },
    vnPfOpt: i => { const m = vnCur(); if (!m || m.ans.ph !== 'proof') return; m.ans.pf.sel = +i; m.ans.pf.msg = ''; sfx('tap'); render(); },
    vnPfOk: () => {
      const m = vnCur(); if (!m) return; const a = m.ans, p = vnPz(m), f = a.pf; if (!f || f.sel === null) return;
      if (f.sel === p.pf.ans) { vnSolveStage(m); return; }
      f.bad.push(f.sel); f.sel = null; f.tr++; m.wr++;
      if (f.tr >= VN_TRIES) { vnMiss(m); return; }
      f.msg = 'Dieser Beweis stimmt nicht. Prüfe die Hinweise noch einmal.'; sfx('no'); vnPersist(m); render();
    },
    vnMq: s => {
      const m = vnCur(); if (!m) return; const [k, i] = s.split(',').map(Number), st = m.ans.qa[k]; if (st.ok || st.bad.includes(i)) return;
      st.sel = st.sel === i ? null : i; m.ans.msg = ''; sfx('tap'); render();
    },
    vnMqChk: () => {
      const m = vnCur(); if (!m) return; const a = m.ans, p = vnPz(m); if (!a.qa.every(st => st.ok || st.sel !== null)) return;
      let wrong = 0; a.qa.forEach((st, k) => { if (st.ok) return; if (st.sel === p.qs[k].ans) st.ok = true; else { st.bad.push(st.sel); wrong++; } st.sel = null; });
      if (!wrong) { vnSolveStage(m); return; }
      a.tr++; m.wr += wrong;
      if (a.tr >= VN_TRIES) { vnMiss(m); return; }
      a.msg = `${p.qs.length - wrong} von ${p.qs.length} richtig. Die falschen sind durchgestrichen – such dir dort eine neue Antwort aus.`; sfx('no'); vnPersist(m); render();
    },
    vnChip: i => { const m = vnCur(); if (m) vnPlace(m, +i); },
    vnSlot: key => {
      const m = vnCur(); if (!m) return; const a = m.ans, [gi, si] = key.split('.').map(Number);
      if (a.lk[key]) return; if (a.fill[gi][si] >= 0) { a.fill[gi][si] = -1; a.chk = false; }
      a.act = key; sfx('tap'); vnPersist(m); render();
    },
    vnPoolChk: () => { const m = vnCur(); if (!m) return; m.ans.chk = true; const ev = vnPoolEval(vnPz(m), m.ans); sfx(ev.some(g => g.full && !g.good) ? 'no' : 'ok'); render(); },
    vnFldChk: () => {
      const m = vnCur(); if (!m) return; const a = m.ans, p = vnPz(m); a.chk = true;
      document.querySelectorAll('.vn-in').forEach(el => { a.v[+el.dataset.i] = el.value; });
      const ev = vnFldEval(p, a); if (ev.done) { vnSolveStage(m); return; }
      if (ev.ok.some(x => x === false)) m.wr++; sfx(ev.ok.some(x => x === false) ? 'no' : 'tap'); vnPersist(m); render();
    },
    vnCell: key => {
      const m = vnCur(); if (!m) return; const a = m.ans, p = vnPz(m), cov = p.words.filter(w => vnWordCells(w).includes(key)); if (!cov.length) return;
      if (a.sel === key && cov.length > 1) a.d = a.d === 'h' ? 'v' : 'h'; else { a.sel = key; if (!cov.some(w => w.d === a.d)) a.d = cov[0].d; }
      sfx('tap'); render();
    },
    vnKey: L => { const m = vnCur(); if (!m) return; const a = m.ans; if (!a.sel) { sfx('no'); return; } if (L) vnCrossSet(m, a.sel, L); else { if (!a.g[a.sel]) { const w = vnWordAt(vnPz(m), a.sel, a.d); if (w) { const cs = vnWordCells(w), i = cs.indexOf(a.sel); if (i > 0) a.sel = cs[i - 1]; } } vnCrossSet(m, a.sel, ''); } },
    vnCrossChk: () => { const m = vnCur(); if (!m) return; m.ans.chk = true; const p = vnPz(m); sfx(Object.keys(m.ans.g).some(k => m.ans.g[k] !== p.cells[k]) ? 'no' : 'ok'); render(); },
    vnExp: () => { const m = UI.vn; if (!m) return; m.exp = !m.exp; render(); },
    vnNext: () => {
      const m = UI.vn; if (!m || m.st !== 'play' || !m.sv[m.si]) return;
      if (m.si >= m.stages.length - 1) { if (m.miss && m.miss.every(Boolean)) { vnLose(m); return; } vnWin(m); render(); return; }
      m.si++; m.ans = vnAnsNew(vnPz(m)); m.exp = false; sfx('tap'); vnPersist(m); render();
    },
    vnGiveAsk: () => { UI.vnAsk = true; render(); },
    vnGiveNo: () => { UI.vnAsk = false; render(); },
    vnGiveYes: () => { const m = UI.vn; if (m && m.st === 'play') vnGiveUp(m); },
    vnFlagQ: () => {
      const m = UI.vn; if (!m || m.st !== 'play') return; const d = m.stages[m.si], p = vnS(); m.fl = m.fl || {}; if (m.fl[m.si]) return;
      m.fl[m.si] = 1; p.vnFlag.push({ t: d.t, sd: d.sd, ids: d.u || [], ts: Date.now() }); toast('🚩', 'Gemeldet. Diese Frage kommt nicht wieder.'); vnPersist(m); render();
    },
    vnUnflag: () => { vnS().vnFlag = []; save(); render(); },
    vnSeenReset: () => { const p = vnS(); p.vnSeen = {}; save(); render(); },
    vnHint: () => {
      const m = vnCur(); if (!m) return; const a = m.ans, p = vnPz(m), g = m.kind === 'code' ? 'vg' : 'vc';
      if (pzHintLeft(g) <= 0) { render(); return; }
      let done = false;
      if (p.kind === 'choice') { const pr = a.ph === 'proof', o = pr ? p.pf.opts : p.opts, an = pr ? p.pf.ans : p.ans, st = pr ? a.pf : a; const c = o.map((x, i) => i).filter(i => i !== an && !st.bad.includes(i)); if (c.length > 1) { st.bad.push(c[Math.floor(Math.random() * c.length)]); if (st.sel !== null && st.bad.includes(st.sel)) st.sel = null; done = true; } }
      else if (p.kind === 'multi') { for (let k = 0; k < p.qs.length && !done; k++) { const st = a.qa[k]; if (st.ok) continue; const c = p.qs[k].opts.map((o, i) => i).filter(i => i !== p.qs[k].ans && !st.bad.includes(i)); if (c.length > 1) { st.bad.push(c[Math.floor(Math.random() * c.length)]); done = true; } } }
      else if (p.kind === 'pool') {
        const used = () => new Set(a.fill.flat().filter(x => x >= 0));
        outer: for (let gi = 0; gi < p.groups.length; gi++) { const g0 = p.groups[gi]; for (let si = 0; si < g0.n; si++) {
          const cur = a.fill[gi][si], want = p.join ? g0.syl[si] : g0.ans, key = gi + '.' + si;
          if (a.lk[key] || (cur >= 0 && (g0.ok ? g0.ok(p.chips[cur]) : p.chips[cur] === want))) continue;
          a.fill.forEach((r, i) => r.forEach((c, j) => { if (c >= 0 && p.chips[c] === want && !a.lk[i + '.' + j]) a.fill[i][j] = -1; }));
          a.fill[gi][si] = -1; const ci = p.chips.findIndex((c, i) => c === want && !used().has(i)); if (ci < 0) continue;
          a.fill[gi][si] = ci; a.lk[key] = 1; done = true; break outer;
        } }
        if (done) { a.act = null; a.chk = false; }
      }
      else if (p.kind === 'fields') { document.querySelectorAll('.vn-in').forEach(el => { a.v[+el.dataset.i] = el.value; }); const ev = vnFldEval(p, a); const i = p.items.findIndex((it, k) => !a.lk[k] && ev.ok[k] !== true); if (i >= 0) { a.v[i] = p.items[i].ans[0]; a.lk[i] = true; a.chk = false; done = true; } }
      else if (p.kind === 'cross') { const bad = Object.keys(p.cells).filter(k => a.g[k] !== p.cells[k] && !a.lk[k]); if (bad.length) { const k = (a.sel && bad.includes(a.sel)) ? a.sel : bad[Math.floor(Math.random() * bad.length)]; a.g[k] = p.cells[k]; a.lk[k] = 1; a.chk = false; done = true; } }
      if (!done) { toast('💡', 'Hier gibt es keinen Hinweis mehr.'); return; }
      pzHintUse(g); m.hints++; sfx('magic');
      if (p.kind === 'pool') { vnAfterPool(m); return; }
      if (p.kind === 'cross' && Object.keys(p.cells).every(k => a.g[k] === p.cells[k])) { vnSolveStage(m); return; }
      if (p.kind === 'fields') { const ev = vnFldEval(p, a); if (ev.done) { vnSolveStage(m); return; } }
      vnPersist(m); render();
    }
  }
});
