/* =====================================================================
   GEO: Länder-Entdecker (Europa) – Quiz mit Auswertung am Ende + Länderkarten
   ---------------------------------------------------------------------
   Daten: geo_data.js (COUNTRIES, FLAGS). Weitere Kontinente = nur Daten, kein Umbau hier (alles läuft über cont).
   Fragearten (GQ.qs[].t):  cap = Land → Hauptstadt wählen · typ = Hauptstadt tippen · rev = Hauptstadt → Land wählen · nb = Nachbarland wählen
   Rückmeldung erst am Ende (wie der Mini-Test); bis zum Abgeben darf jede Antwort geändert werden.
   Belohnung (ein gemeinsamer Münz-Topf, aber mit Tageslimit): zählt pro Tag das BESTE Ergebnis, ein besseres zahlt nur die Differenz.
     ≥ 90 % → 5 Münzen + 2 Sterne · ≥ 70 % → 3 Münzen + 1 Stern · ≥ 50 % → 1 Stern · 100 % → einmal pro Tag eine Karte.
     Nur Runden mit mindestens 10 Fragen zahlen. Bis zu 10 beantwortete Fragen pro Tag zählen zum Tagesziel.
   Einmalige Meilensteine: 10 / 25 / alle Länder „sicher gewusst“ (= in 2 verschiedenen Runden richtig).
   Gespeichert in S.geo (Standardwerte in store.js DEF) – bestehende Münzen, Sterne, Karten und Pokale werden nie angefasst.
   ===================================================================== */
const GEO_NAME = 'Europa Entdecker', GEO_PASS = 'Meine Stempel';                       // Name des Fachs (eine Stelle ändern genügt)
const GEO_TIERS = [[.9, 5, 2], [.7, 3, 1], [.5, 0, 1]];    // [Anteil richtig, Münzen, Sterne]
const GEO_GOAL_CAP = 10, GEO_MIN_PAY = 10;
/* [Länder, Sterne, Münzen, Name, Speicher-Schlüssel] + jeweils 1 Karte. Der letzte Meilenstein heißt „alle Länder“ und wird aus den Daten berechnet.
   Speicher-Schlüssel '50' bleibt absichtlich so (früher gab es genau 50 Länder): wer ihn schon hat, bekommt ihn nicht ein zweites Mal. */
const GEO_MS = [[10, 1, 0, 'Länder-Kenner', '10'], [25, 2, 5, 'Länder-Profi', '25'], [COUNTRIES.filter(c => c.cont === 'europa').length, 3, 10, 'Europa-Meister', '50']];
const gMsKey = (cont, m) => (cont || 'europa') + '.' + m[4];
let GQ = null;                                             // laufende Runde (wird nie gespeichert)

function gS() {
  const g = S.geo || (S.geo = {});
  ['seen', 'ok', 'miss', 'k', 'cards', 'ms', 'kd'].forEach(k => { if (!g[k] || typeof g[k] !== 'object') g[k] = {}; });
  ['sessions', 'perf', 'tpf', 'kpf', 'best'].forEach(k => { if (typeof g[k] !== 'number') g[k] = 0; });
  return g;
}
const gList = cont => COUNTRIES.filter(c => c.cont === (cont || 'europa'));
const gKnown = id => (gS().k[id] || 0) >= 2;
const gKnownN = cont => gList(cont).filter(c => gKnown(c.id)).length;
const gNorm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/ae|oe|ue/g, m => m[0]).replace(/[^a-z0-9]/g, '');
const gCapOK = (c, typed) => { const t = gNorm(typed); return !!t && [c.cap].concat(c.calt || []).some(x => gNorm(x) === t); };
const gTrivial = c => gNorm(c.cap) === gNorm(c.name);     // Hauptstadt heißt wie das Land → in „tippen“ und „Land finden“ zu leicht

/* ---------- Fragen bauen ---------- */
function gWeight(id) { const g = gS(); return Math.max(.5, 1 + 1.5 * Math.min(g.miss[id] || 0, 3) - .5 * Math.min(g.k[id] || 0, 2)); }
function gPick(pool, n) {                                  // gewichtet ohne Wiederholung: früher Verpasstes kommt öfter dran
  const arr = pool.map(c => ({ c, w: gWeight(c.id) })), out = [];
  while (out.length < n && arr.length) {
    let r = Math.random() * arr.reduce((a, x) => a + x.w, 0), i = 0;
    for (; i < arr.length - 1; i++) { r -= arr[i].w; if (r <= 0) break; }
    out.push(arr[i].c); arr.splice(i, 1);
  }
  return out;
}
function gOptsCap(c, tricky) {
  const others = gList(c.cont).filter(x => x.id !== c.id && gNorm(x.cap) !== gNorm(c.cap)), seen = new Set([gNorm(c.cap)]), pick = [];
  const add = name => { if (name && !seen.has(gNorm(name)) && pick.length < 3) { seen.add(gNorm(name)); pick.push(name); } };
  if (tricky) { if (c.trap) add(c.trap); shuffle(c.tr.map(i => CBY[i]).filter(Boolean)).forEach(x => add(x.cap)); }
  shuffle(others.filter(x => x.reg === c.reg)).slice(0, tricky ? 2 : 1).forEach(x => add(x.cap));
  shuffle(others).forEach(x => add(x.cap));
  return shuffle([c.cap].concat(pick)).map(t => ({ k: t, label: esc(t) }));
}
function gOptsCountry(c, tricky, avoid) {                  // 1 richtiges + 3 falsche Länder (avoid = Länder, die NICHT als falsch erscheinen dürfen)
  const others = gList(c.cont).filter(x => x.id !== c.id && !(avoid || []).includes(x.id)), pick = [];
  if (tricky) shuffle(c.tr.map(i => CBY[i]).filter(x => x && !(avoid || []).includes(x.id))).forEach(x => { if (pick.length < 2 && !pick.includes(x)) pick.push(x); });
  shuffle(others.filter(x => x.reg === c.reg)).slice(0, tricky ? 3 : 1).forEach(x => { if (pick.length < 3 && !pick.includes(x)) pick.push(x); });
  shuffle(others).forEach(x => { if (pick.length < 3 && !pick.includes(x)) pick.push(x); });
  return pick;
}
function gQuestion(c, t, tricky) {
  const fl = flagSVG(c.id, 'geo-qflag');
  if (t === 'cap') return { t, cid: c.id, title: `${fl}<span>Was ist die Hauptstadt von <b>${esc(c.name)}</b>?</span>${gTrivial(c) ? '<span class="small mute">(Manchmal heißt die Hauptstadt wie das Land.)</span>' : ''}`, opts: gOptsCap(c, tricky), ans: c.cap, show: c.cap };
  if (t === 'flag') {
    const wrong = gOptsCountry(c, tricky, []), opts = shuffle([c].concat(wrong)).map(x => ({ k: x.id, label: '<span>' + esc(x.name) + '</span>' }));
    return { t, cid: c.id, title: `${flagSVG(c.id, 'geo-bigq')}<span>Zu welchem Land gehört diese Flagge?</span>`, opts, ans: c.id, show: c.name };
  }
  if (t === 'typ') return { t, cid: c.id, title: `${fl}<span>Schreib die Hauptstadt von <b>${esc(c.name)}</b> auf.</span>`, typed: '', ans: c.cap, show: c.cap };
  if (t === 'rev') {
    const wrong = gOptsCountry(c, tricky, []), opts = shuffle([c].concat(wrong)).map(x => ({ k: x.id, label: flagSVG(x.id, 'geo-oflag') + '<span>' + esc(x.name) + '</span>' }));
    return { t, cid: c.id, title: `<span class="geo-capq">${esc(c.cap)}</span><span>ist die Hauptstadt von …?</span>`, opts, ans: c.id, show: c.name };
  }
  const nbs = c.nb.map(i => CBY[i]).filter(Boolean), right = rnd(nbs), wrong = gOptsCountry(c, tricky, c.nb);
  const opts = shuffle([right].concat(wrong)).map(x => ({ k: x.id, label: flagSVG(x.id, 'geo-oflag') + '<span>' + esc(x.name) + '</span>' }));
  return { t: 'nb', cid: c.id, title: `${fl}<span>Welches Land hat eine gemeinsame Grenze mit <b>${esc(c.name)}</b>?</span>`, opts, ans: right.id, show: right.name, nbAll: nbs.map(x => x.name) };
}
const gTypes = { mix: ['cap', 'typ', 'rev', 'flag'], flag: ['flag'], size: ['size'], route: ['route'],      // Nachbarländer-Fragen sind vorerst nicht im Quiz (Code bleibt für später: mode 'nb')
   cap: ['cap'], typ: ['typ'], rev: ['rev'], nb: ['nb'] };
const gFit = (c, t) => (t === 'nb' ? c.nb.length > 0 : (t === 'typ' || t === 'rev') ? !gTrivial(c) : true);
const gSizePairs = c => gList(c.cont).filter(d => d.id !== c.id && d.area && c.area && Math.max(c.area, d.area) / Math.min(c.area, d.area) >= 1.6);
const gRoutes = c => gList(c.cont).filter(d => d.id !== c.id && !c.nb.includes(d.id) && c.nb.filter(x => d.nb.includes(x)).length === 1);   // genau ein gemeinsames Nachbarland → eindeutige Antwort
function gBuildPairs(cfg) {
  const size = cfg.mode === 'size', pool = gList(cfg.cont).filter(c => (size ? gSizePairs(c) : gRoutes(c)).length);
  return gPick(pool, Math.min(cfg.n, pool.length)).map(c => {
    if (size) {
      const d = rnd(gSizePairs(c)), win = c.area > d.area ? c : d;
      return { t: 'size', cid: c.id, other: d.id, title: '<span>Welches Land ist größer?</span><span class="small mute">(nach Fläche)</span>', opts: shuffle([c, d]).map(x => ({ k: x.id, label: flagSVG(x.id, 'geo-oflag') + '<span>' + esc(x.name) + '</span>' })), ans: win.id, show: win.name, tricky: false };
    }
    const d = rnd(gRoutes(c)), mid = CBY[c.nb.find(x => d.nb.includes(x))], avoid = [c.id, d.id].concat(c.nb, d.nb);
    const wrong = shuffle(gList(c.cont).filter(x => !avoid.includes(x.id))).slice(0, 3);
    return { t: 'route', cid: c.id, other: d.id, title: `<span class="geo-pair">${flagSVG(c.id, 'geo-oflag')}${flagSVG(d.id, 'geo-oflag')}</span><span>Welches Land grenzt an <b>${esc(c.name)}</b> und an <b>${esc(d.name)}</b>?</span>`, opts: shuffle([mid].concat(wrong)).map(x => ({ k: x.id, label: flagSVG(x.id, 'geo-oflag') + '<span>' + esc(x.name) + '</span>' })), ans: mid.id, show: mid.name, tricky: false };
  });
}
function gRebuildPair(q) { const o = gBuildPairs({ cont: 'europa', n: 1, mode: q.t }); return o[0] || q; }
function gBuild(cfg) {
  if (cfg.mode === 'size' || cfg.mode === 'route') return gBuildPairs(cfg);
  const pool = gList(cfg.cont), allowed = gTypes[cfg.mode] || gTypes.mix, qs = [];
  const eligible = pool.filter(c => allowed.some(t => gFit(c, t)));
  let typN = 0;
  gPick(eligible, Math.min(cfg.n, eligible.length)).forEach(c => {
    let ts = allowed.filter(t => gFit(c, t));
    if (cfg.mode === 'mix' && typN >= Math.ceil(cfg.n / 3)) ts = ts.filter(t => t !== 'typ');
    const t = rnd(ts.length ? ts : ['cap']); if (t === 'typ') typN++;
    const tr = cfg.tricky === 'mix' ? Math.random() < .4 : !!cfg.tricky, q = gQuestion(c, t, tr); q.tricky = tr;
    qs.push(q);
  });
  return qs;
}
const gGot = q => q.t === 'typ' ? q.typed : q.pick;
const gAnswered = q => q.t === 'typ' ? gNorm(q.typed) !== '' : q.pick != null;
const gRight = q => q.t === 'typ' ? gCapOK(CBY[q.cid], q.typed) : q.pick === q.ans;
const gShowGot = q => q.t === 'typ' ? esc(q.typed.trim()) : (() => { const o = (q.opts || []).find(x => x.k === q.pick); return o ? o.label : ''; })();

/* ---------- Start einer Runde ---------- */
/* Die App entscheidet (nicht das Kind): 10 oder 15 Fragen, immer gemischte Fragearten, immer gemischt normal/kniffelig */
const gAutoCfg = mode => ({ cont: 'europa', n: Math.random() < .5 ? 10 : 15, mode: ['flag', 'size', 'route'].includes(mode) ? mode : 'mix', tricky: 'mix' });
function geoStart(cfg, retryQs) {
  cfg = Object.assign({}, cfg || gAutoCfg());
  const qs = retryQs || gBuild(cfg);
  if (!qs.length) return;
  GQ = { cfg, qs, i: 0, start: Date.now(), done: false, noPay: !!retryQs, retry: !!retryQs };
  try { history.pushState({ geo: 1 }, ''); } catch (e) { }
  go('geoPlay');
}
/* Ausstiegsschutz: jede Navigation (Zurück, Menü, Android-Zurück) fragt nach, solange eine Runde läuft */
function geoGuard(v, extra) {
  if (!GQ || GQ.done || v === 'geoPlay') return false;
  geoAskLeave(() => go(v, extra));
  return true;
}
function geoAskLeave(fn) {
  if (!GQ || GQ.done) { fn && fn(); return; }
  GQ.leaveFn = fn;
  modal('Runde verlassen?', 'Dein Fortschritt geht verloren, wenn du die Runde verlässt.', 'Ja, verlassen', 'geoLeaveYes', '', 'Weiter üben');
}
window.addEventListener('popstate', () => {
  if (GQ && !GQ.done && view === 'geoPlay') { try { history.pushState({ geo: 1 }, ''); } catch (e) { } geoAskLeave(() => go('geo')); }
});
window.addEventListener('beforeunload', e => { if (GQ && !GQ.done) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- Abschluss, Belohnung ---------- */
function geoPaid() { touchDay(); const d = S.daily; if (!d.gp) d.gp = { c: 0, s: 0, ch: false, gn: 0 }; return d.gp; }
function geoTier(p) { const t = GEO_TIERS.find(x => p >= x[0]); return t ? { c: t[1], s: t[2] } : { c: 0, s: 0 }; }
function geoLeft() { const p = geoPaid(), m = geoTier(1); return { c: m.c - p.c, s: m.s - p.s, ch: !p.ch }; }
function payGeo(score, total) {
  const r = { c: 0, s: 0, chest: false, goal: 0 };
  if (total < GEO_MIN_PAY) return r;
  const p = geoPaid(), t = geoTier(score / total), perfect = score === total;
  r.c = Math.max(0, t.c - p.c); r.s = Math.max(0, t.s - p.s);
  p.c += r.c; p.s += r.s;
  giveCoins(r.c, GEO_NAME); giveStars(r.s);
  if (perfect && !p.ch) { p.ch = true; r.chest = giveChest(); }
  const g = Math.max(0, Math.min(GEO_GOAL_CAP - (p.gn || 0), total)); p.gn = (p.gn || 0) + g;
  for (let i = 0; i < g; i++) dailyCheck();
  r.goal = g; return r;
}
function geoMilestones(cont) {
  const g = gS(), n = gKnownN(cont), got = [];
  GEO_MS.forEach(m => {
    const [need, st, co, name] = m, key = gMsKey(cont, m);
    if (n >= need && !g.ms[key]) {
      g.ms[key] = Date.now(); giveStars(st); giveCoins(co, name); giveChest();
      got.push({ need, st, co, name });
    }
  });
  return got;
}
function geoFinish() {
  if (!GQ || GQ.done) return; GQ.done = true; closeModal();
  const g = gS(), total = GQ.qs.length; let score = 0;
  GQ.qs.forEach(q => {
    q.ok = gRight(q); if (q.ok) score++;
    const id = q.cid; if (q.t !== 'size' && q.t !== 'route') g.seen[id] = (g.seen[id] || 0) + 1;
    if (q.t === 'size' || q.t === 'route') return;           // Vergleichs- und Reise-Fragen zählen nicht für „sicher gewusst“
    if (q.ok) { g.ok[id] = (g.ok[id] || 0) + 1; g.k[id] = (g.k[id] || 0) + 1; if (g.k[id] === 2 && !g.kd[id]) g.kd[id] = Date.now(); } else g.miss[id] = (g.miss[id] || 0) + 1;
  });
  const cfg = GQ.cfg, pay = GQ.noPay ? { c: 0, s: 0, chest: false, goal: 0 } : payGeo(score, total);
  if (!GQ.retry) {
    g.sessions++; g.best = Math.max(g.best, Math.round(score / total * 100));
    if (total >= GEO_MIN_PAY) {
      if (score === total) g.perf++;
      const ty = GQ.qs.filter(q => q.t === 'typ'), tk2 = GQ.qs.filter(q => q.tricky);
      if (ty.length >= 3 && ty.every(q => q.ok)) g.tpf++;
      if (tk2.length >= 3 && tk2.every(q => q.ok)) g.kpf++;
    }
  }
  const ms = geoMilestones(cfg.cont);
  GQ.res = { score, total, pay, ms }; GQ.t = Math.floor((Date.now() - GQ.start) / 1000);
  checkTrophies(); save(); go('geoResult');
  if (score / total >= .7 || ms.length) confetti(score === total ? 110 : 60);
}
function geoTrophies() {
  const kn = s => Object.entries((s.geo && s.geo.k) || {}).filter(([id, v]) => v >= 2 && CBY[id] && CBY[id].cont === 'europa').length, G = s => s.geo || {};   // nur Länder, die es in den Daten gibt (alte Ids im Spielstand zählen nicht, bleiben aber gespeichert)
  return [
    { id: 'geo1', i: '🧭', n: 'Erste Europa-Reise', d: 'Ein Europa-Quiz abgegeben', t: s => (G(s).sessions || 0) >= 1 },
    { id: 'geo5', i: '🎒', n: 'Vielreisende', d: '5 Europa-Quizrunden', t: s => (G(s).sessions || 0) >= 5 },
    { id: 'geo10', i: '🗺️', n: 'Länder-Kenner', d: '10 Länder sicher gewusst', t: s => kn(s) >= 10 },
    { id: 'geo25', i: '🧳', n: 'Länder-Profi', d: '25 Länder sicher gewusst', t: s => kn(s) >= 25 },
    { id: 'geo50', i: '🌍', n: 'Europa-Meister', d: 'Alle Länder sicher gewusst', t: s => kn(s) >= gList('europa').length },
    { id: 'geoperf', i: '💯', n: 'Fehlerfreie Reise', d: 'Eine Runde mit 10 oder mehr Fragen komplett richtig', t: s => (G(s).perf || 0) >= 1 },
    { id: 'geotpf', i: '⌨️', n: 'Tipp-Profi', d: 'In einer Runde (10+ Fragen) alle Tipp-Fragen richtig, mindestens 3', t: s => (G(s).tpf || 0) >= 1 },
    { id: 'geokpf', i: '🧩', n: 'Kniffel-Profi', d: 'In einer Runde (10+ Fragen) alle kniffeligen Fragen richtig, mindestens 3', t: s => (G(s).kpf || 0) >= 1 }
  ];
}

/* ---------- Ansichten ---------- */
const gFlagRow = (ids, cls) => ids.map(id => flagSVG(id, cls || 'geo-mini')).join('');
const gPct = () => { const t = gList('europa').length; return t ? Math.round(gKnownN('europa') / t * 100) : 0; };
function gNextMs() { const n = gKnownN('europa'), g = gS(); return GEO_MS.find(m => !g.ms[gMsKey('europa', m)] && n < m[0]); }
function geoPrizeBox() {
  const L = geoLeft(), any = L.c || L.s || L.ch;
  return `<div class="geo-prize1">🎁 ${any ? `Heute noch: ${L.c} 🪙 + ${L.s} ⭐${L.ch ? ' + Karte (alles richtig)' : ''}` : 'Heute schon alles verdient ✓'}</div>`;
}
const gDay = () => { const d = new Date(), n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5), l = gList('europa'); return l[n % l.length]; };
VIEWS.geo = () => {
  const n = gKnownN('europa'), total = gList('europa').length, nx = gNextMs(), d = gDay();
  const T = (art, t, sub, act, arg, i) => dzTile({ cls: ['t1', 't2', 't3'][i % 3], art, title: t, sub, act, arg });
  const play = [['quiz', 'Quiz', '10 oder 15 Fragen', 'geoGo', 'mix'], ['flaggen', 'Flaggen', 'Welches Land?', 'geoGo', 'flag'], ['groesser', 'Größer?', 'Zwei Länder', 'geoGo', 'size'], ['route', 'Reiseroute', 'Wer liegt dazwischen?', 'geoGo', 'route'], ['memory', 'Memory', 'Paare finden', 'geoMemory']]
    .map((x, i) => T(x[0], x[1], x[2], x[3], x[4], i)).join('');
  const disc = [T('laender', 'Länderkarten', 'Flagge, Hauptstadt', 'geoCards', null, 0), T('fakten', 'Wusstest du?', 'Lustige Fakten', 'geoFacts', null, 1), T('stempel', GEO_PASS, 'Deine Länder', 'geoPass', null, 2),
    dzTile({ cls: 't1', html: flagSVG(d.id, 'geo-tflag'), title: 'Land des Tages', sub: d.name, act: 'gCard', arg: d.id })].join('');
  const prog = `<div class="dz-tree-t" style="flex:1"><strong>${n} von ${total} Ländern sicher gewusst</strong><small>${nx ? `Noch ${nx[0] - n} bis „${esc(nx[3])}“ – dafür gibt es eine Karte.` : 'Du kennst alle Länder – super!'}</small><div class="dz-tree-bar" style="width:100%"><i style="width:${gPct()}%"></i></div></div>`;
  return topBar(GEO_NAME, 'home') + `<section class="dz-hero sm">${prog}</section>
  ${dzSec('Spielen')}${dzGrid(5, play, 'dz-geo5')}
  ${dzSec('Entdecken')}${dzGrid(5, disc, 'dz-geo5')}
  ${geoPrizeBox()}
  <div class="geo-soon">${ico('lock', 16)}<span>Bald dabei: ${GEO.coming.map(esc).join(' · ')}</span></div>`;
};
VIEWS.geoFacts = () => {
  const f = UI.gf || (UI.gf = gFactDeck()), it = f.list[f.i % f.list.length], c = CBY[it.cid];
  return topBar('Wusstest du?', 'geo') + `<section class="card geo-card"><div class="geo-bigflag">${flagSVG(c.id, 'geo-big')}</div><h2>${esc(c.name)}</h2><p class="geo-fact">${esc(it.fact)}</p>
    <p class="small mute">Fakt ${f.i % f.list.length + 1} von ${f.list.length}</p>
    <div class="row wrap" style="justify-content:center"><button class="btn big" data-act="gFactNext">Nächster Fakt →</button><button class="btn sec big" data-act="gCard" data-arg="${c.id}">Zur Länderkarte</button></div></section>`;
};
const gFactDeck = () => ({ i: 0, list: shuffle(gList('europa').flatMap(c => c.facts.map(fact => ({ cid: c.id, fact })))) });
VIEWS.geoPlay = () => {
  const q = GQ.qs[GQ.i], last = GQ.i === GQ.qs.length - 1, n = GQ.qs.length;
  let body;
  if (q.t === 'typ') body = `<div class="geo-type"><input class="txt geo-in" id="geoIn" type="text" value="${esc(q.typed)}" placeholder="Hauptstadt …" autocomplete="off" autocapitalize="words" autocorrect="off" spellcheck="false" aria-label="Hauptstadt"></div><p class="small mute" style="text-align:center">Groß- und Kleinschreibung ist egal. Umlaute: ä oder ae – beides geht.</p>`;
  else body = `<div class="choices geo-choices">${q.opts.map(o => `<button class="ch ${q.pick === o.k ? 'sel' : ''}" data-act="gPick" data-arg="${esc(o.k)}">${o.label}</button>`).join('')}</div>`;
  return `<div class="top"><button class="btn sec back" data-act="geoQuit" aria-label="Runde verlassen">✕</button><h2>${GEO_NAME}</h2><button class="btn sm" data-act="geoAsk">Abgeben</button></div>
  <div class="qnav" style="margin-bottom:12px">${GQ.qs.map((x, i) => `<button class="${i === GQ.i ? 'cur' : ''} ${gAnswered(x) ? 'has' : ''}" data-act="gGoQ" data-arg="${i}">${i + 1}</button>`).join('')}</div>
  <div class="card qcard geo-q"><div class="small mute" style="margin-bottom:6px">Frage ${GQ.i + 1} von ${n}</div><div class="qtitle geo-title">${q.title}</div>${body}</div>
  <div class="row" style="margin-top:12px"><button class="btn sec sp" data-act="gPrev" ${GQ.i === 0 ? 'disabled' : ''}>← Zurück</button>${last ? '<button class="btn sp" data-act="geoAsk">Abgeben ✔</button>' : '<button class="btn sp" data-act="gNext">Weiter →</button>'}</div>
  <p class="small mute" style="text-align:center;margin-top:8px">Du kannst deine Antworten noch ändern.</p>`;
};
VIEWS.geoResult = () => {
  const r = GQ.res, p = r.pay, pct = r.score / r.total, mood = pct >= .9 ? 'cheer' : pct >= .6 ? 'happy' : 'sad';
  const stars = pct >= .9 ? 3 : pct >= .7 ? 2 : pct >= .5 ? 1 : 0, miss = GQ.qs.filter(q => !q.ok), good = GQ.qs.filter(q => q.ok);
  const say = pct === 1 ? 'Fehlerfrei! Du bist eine echte Entdeckerin.' : pct >= .7 ? 'Stark gemacht! Schau dir unten die Fehler an.' : 'Jede Runde macht dich sicherer. Schau dir die Fehler an – dann klappt es beim nächsten Mal!';
  const chips = (p.c ? chip('🪙', '+' + p.c) : '') + (p.s ? chip('⭐', '+' + p.s) : '') + (p.chest ? chip('📦', 'Karte!') : '') + r.ms.map(m => chip('🏅', m.name)).join('');
  const note = GQ.noPay ? 'Diese Übungsrunde zählt nicht für Belohnungen.' : r.total < GEO_MIN_PAY ? 'Ab 10 Fragen gibt es Belohnungen.' : (p.c || p.s || p.chest) ? '' : 'Heute war schon so viel oder mehr verdient. Dein bestes Ergebnis des Tages zählt.';
  return `<div class="card result"><div class="stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}" style="animation-delay:${i * .25}s">⭐</span>`).join('')}</div>
  <div style="margin:6px auto;width:160px">${avatarHTML(eqAvatar(), 160, mood)}</div>
  <h2>${r.score} von ${r.total} richtig</h2><p style="font-weight:700">${say}</p>
  ${chips ? `<div class="rewards">${chips}</div>` : ''}${note ? `<p class="small mute">${note}</p>` : ''}
  ${r.ms.length ? `<p class="small">${r.ms.map(m => `Meilenstein <b>${esc(m.name)}</b>: eine Karte${m.st ? ' + ' + m.st + ' ⭐' : ''}${m.co ? ' + ' + m.co + ' 🪙' : ''}`).join('<br>')}</p>` : ''}
  <div class="row wrap" style="justify-content:center"><button class="btn big" data-act="geoGo" data-arg="${GQ.cfg.mode}">Noch eine Runde</button>${miss.length ? '<button class="btn sec big" data-act="geoRetry">Fehler üben</button>' : ''}<button class="btn sec big" data-act="geoCards">Länderkarten</button><button class="btn sec big" data-act="geo">Fertig</button></div></div>
  ${miss.length ? `<h3 style="margin:18px 4px 8px">Hier hast du dich geirrt</h3><div class="list">${miss.map(q => { const c = CBY[q.cid];
    return `<div class="li bad"><span class="n">✘</span><div style="flex:1;min-width:0"><div class="t geo-title">${q.title}</div>
      <div class="rv"><div class="small mute">Deine Antwort</div><div class="geo-ans bad">${gAnswered(q) ? gShowGot(q) : '<i>keine Antwort</i>'}</div></div>
      <div class="rv"><div class="small mute">Richtig</div><div class="geo-ans ok">${q.t === 'nb' ? esc(q.show) + ' <span class="small mute">(Nachbarn: ' + esc(q.nbAll.join(', ')) + ')</span>' : esc(q.show)}</div></div>
      ${q.t === 'size' || q.t === 'route' ? '' : `<div class="e" style="margin-top:6px">${esc(c.name)} – ${esc(c.cap)}. ${esc(c.facts[0])}</div>`}</div></div>`; }).join('')}</div>` : ''}
  ${good.length ? `<details class="geo-good"><summary>✔ Richtig: ${good.length}</summary><div class="geo-goodlist">${good.map(q => `<span>${flagSVG(q.cid, 'geo-mini')} ${esc(CBY[q.cid].name)}</span>`).join('')}</div></details>` : ''}`;
};

/* ---------- Länderkarten ---------- */
const gCardFilter = () => UI.gFilter || 'all';
const gCardList = () => { const f = gCardFilter(), l = gList('europa'); return (f === 'all' ? l : l.filter(c => c.reg === f)).slice().sort((a, b) => a.name.localeCompare(b.name, 'de')); };
VIEWS.geoCards = () => {
  const list = gCardList(), hide = !!UI.gHide;
  const fl = [['all', 'Alle']].concat(Object.entries(GEO.regs));
  return topBar('Länderkarten', 'geo') + `
  <div class="card geo-cardhead"><b>${gKnownN('europa')} von ${gList('europa').length} sicher gewusst</b><div class="bar"><i style="width:${gPct()}%"></i></div>
    <div class="row wrap" style="margin-top:10px">${fl.map(([id, lb]) => `<button class="btn ${gCardFilter() === id ? '' : 'sec'} sm" data-act="gFilter" data-arg="${id}">${esc(lb)}</button>`).join('')}</div>
    <div class="row wrap" style="margin-top:8px"><button class="btn ${hide ? '' : 'sec'} sm" data-act="gHide">${hide ? '👀 Hauptstädte zeigen' : '🙈 Hauptstädte verdecken'}</button><span class="small mute">${hide ? 'Tippe ein Land an und rate zuerst!' : 'Tippe ein Land für mehr Infos an.'}</span></div></div>
  <div class="geo-grid">${list.map(c => `<button class="geo-tile ${gKnown(c.id) ? 'known' : ''}" data-act="gCard" data-arg="${c.id}">${flagSVG(c.id, 'geo-tflag')}<b>${esc(c.name)}</b><span>${hide ? '???' : esc(c.cap)}</span>${gKnown(c.id) ? '<i class="geo-ck" aria-label="Sicher gewusst">✓</i>' : ''}</button>`).join('')}</div>`;
};
VIEWS.geoCard = () => {
  const c = CBY[UI.geoSel] || gList('europa')[0], g = gS(), list = gCardList(), i = Math.max(0, list.findIndex(x => x.id === c.id));
  if (!g.cards[c.id]) { g.cards[c.id] = Date.now(); save(); }
  const hide = !!UI.gHide && !UI.gShow, k = Math.min(2, g.k[c.id] || 0);
  const nbs = c.nb.map(x => CBY[x]).filter(Boolean);
  return topBar(esc(c.name), 'geoCards') + `<section class="card geo-card">
    <div class="geo-bigflag">${flagSVG(c.id, 'geo-big')}</div>
    <h1>${esc(c.name)}</h1>
    <div class="geo-cap">${hide ? `<button class="btn" data-act="gShow">Hauptstadt aufdecken</button>` : `<span class="small mute">Hauptstadt</span><b>${esc(c.cap)}</b>`}</div>
    <div class="geo-known ${k >= 2 ? 'on' : ''}">${k >= 2 ? '✓ Sicher gewusst' : `Im Quiz richtig: ${k} von 2`}</div>
    <h3>Wusstest du?</h3><ul class="geo-facts">${c.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
    <h3>Nachbarländer</h3>${nbs.length ? `<div class="geo-nbs">${nbs.map(n => `<button class="geo-nb" data-act="gCard" data-arg="${n.id}">${flagSVG(n.id, 'geo-mini')}<span>${esc(n.name)}</span></button>`).join('')}</div>` : '<p class="small mute">Dieses Land hat keine Landgrenze.</p>'}${c.nbx ? '<p class="small mute">Dieses Land grenzt noch an weitere Länder, die in Europa Entdecker nicht dabei sind.</p>' : ''}
    <div class="row" style="margin-top:14px"><button class="btn sec sp" data-act="gStep" data-arg="-1" ${i === 0 ? 'disabled' : ''}>← Zurück</button><button class="btn sp" data-act="gStep" data-arg="1" ${i === list.length - 1 ? 'disabled' : ''}>Weiter →</button></div></section>`;
};

/* ---------- Reisepass: ein Stempel pro sicher gewusstem Land ---------- */
VIEWS.geoPass = () => {
  const g = gS(), l = gList('europa'), n = gKnownN('europa');
  const stamp = c => gKnown(c.id)
    ? `<button class="geo-stamp on" data-act="gCard" data-arg="${c.id}">${flagSVG(c.id, 'geo-sflag')}<b>${esc(c.name)}</b><small>${g.kd[c.id] ? new Date(g.kd[c.id]).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '✓'}</small></button>`
    : `<button class="geo-stamp" data-act="gCard" data-arg="${c.id}"><span class="geo-slock">${flagSVG(c.id, 'geo-sflag')}<i>${ico('lock', 14)}</i></span><b>${esc(c.name)}</b><small>${Math.min(2, g.k[c.id] || 0)} von 2</small></button>`;
  return topBar(GEO_PASS, 'geo') + `<section class="card geo-slim"><b>${n} von ${l.length} Stempeln</b><div class="bar"><i style="width:${gPct()}%"></i></div>
    <p class="small mute">Ein Stempel kommt, wenn du ein Land in 2 Runden richtig hattest.</p>
    <div class="geo-ms">${GEO_MS.map((m, i) => `<span class="${g.ms[gMsKey('europa', m)] ? 'on' : ''}">${g.ms[gMsKey('europa', m)] ? '✓' : ico('lock', 13)} ${i === GEO_MS.length - 1 ? 'Alle ' + m[0] : m[0]} Stempel: Karte${m[1] ? ' + ' + m[1] + ' ⭐' : ''}${m[2] ? ' + ' + m[2] + ' 🪙' : ''}</span>`).join('')}</div></section>
    <div class="geo-stamps">${l.slice().sort((a, b) => (gKnown(b.id) - gKnown(a.id)) || a.name.localeCompare(b.name, 'de')).map(stamp).join('')}</div>`;
};

/* ---------- Memory: Flagge + Land ↔ Hauptstadt, ohne Zeit, ohne Belohnung ---------- */
function gMemNew() {
  const ids = shuffle(gList('europa')).slice(0, 8);
  UI.mem = { cards: shuffle(ids.flatMap(c => [{ id: c.id, t: 'f' }, { id: c.id, t: 'c' }])), open: [], done: {}, moves: 0, lock: false };
}
VIEWS.geoMemory = () => {
  const m = UI.mem || (gMemNew(), UI.mem), all = Object.keys(m.done).length === m.cards.length;
  return topBar('Memory', 'geo') + `<p class="small mute" style="text-align:center">Finde zu jedem Land seine Hauptstadt. Züge: <b>${m.moves}</b></p>
  <div class="geo-mem">${m.cards.map((c, i) => {
    const up = m.done[i] || m.open.includes(i), cc = CBY[c.id];
    return `<button class="geo-mc ${up ? 'up' : ''} ${m.done[i] ? 'done' : ''}" data-act="gMem" data-arg="${i}" aria-label="Karte ${i + 1}">${up ? (c.t === 'f' ? flagSVG(c.id, 'geo-mflag') + '<b>' + esc(cc.name) + '</b>' : '<b>' + esc(cc.cap) + '</b>') : '<span>?</span>'}</button>`;
  }).join('')}</div>
  ${all ? `<div class="card result" style="margin-top:14px"><h2>Geschafft in ${m.moves} Zügen!</h2><div class="row wrap" style="justify-content:center"><button class="btn big" data-act="gMemNew">Noch mal</button><button class="btn sec big" data-act="geo">Fertig</button></div></div>` : ''}`;
};

/* ---------- Aktionen ---------- */
registerFeature({
  id: 'geo', title: GEO_NAME, icon: 'island', tint: 'sky', group: 'learn', order: 5, view: 'geo',
  views: {},
  acts: {
    geoCards: () => go('geoCards'), geoPass: () => go('geoPass'), geoMemory: () => { gMemNew(); go('geoMemory'); }, gMemNew: () => { gMemNew(); render(); },
    gMem: a => { const m = UI.mem, i = +a; if (!m || m.lock || m.done[i] || m.open.includes(i)) return; sfx('tap'); m.open.push(i);
      if (m.open.length === 2) { m.moves++; const [x, y] = m.open;
        if (m.cards[x].id === m.cards[y].id && m.cards[x].t !== m.cards[y].t) { m.done[x] = m.done[y] = 1; m.open = []; if (Object.keys(m.done).length === m.cards.length) { sfx('ok'); confetti(60); } }
        else { m.lock = true; render(); setTimeout(() => { m.open = []; m.lock = false; if (view === 'geoMemory') render(); }, 900); return; } }
      render(); }, geoFacts: () => { UI.gf = gFactDeck(); go('geoFacts'); }, gFactNext: () => { UI.gf.i++; render(); },
    geoGo: m => geoStart(gAutoCfg(m)), geoSetup: () => geoStart(gAutoCfg()),
    geoRetry: () => { const qs = GQ.qs.filter(q => !q.ok).map(q => (q.t === 'size' || q.t === 'route') ? gRebuildPair(q) : gQuestion(CBY[q.cid], q.t, q.tricky)); geoStart(GQ.cfg, qs); },
    gPick: k => { const q = GQ.qs[GQ.i]; q.pick = k; sfx('tap'); render(); },
    gGoQ: i => { geoSaveTyped(); GQ.i = +i; render(); }, gNext: () => { geoSaveTyped(); GQ.i = Math.min(GQ.qs.length - 1, GQ.i + 1); render(); },
    gPrev: () => { geoSaveTyped(); GQ.i = Math.max(0, GQ.i - 1); render(); },
    geoQuit: () => geoAskLeave(() => go('geo')),
    geoLeaveYes: () => { closeModal(); const fn = GQ && GQ.leaveFn; GQ = null; if (fn) fn(); },
    geoAsk: () => { geoSaveTyped(); const open = GQ.qs.filter(q => !gAnswered(q)).length; modal('Runde abgeben?', open ? `Du hast noch <b>${open}</b> Frage${open === 1 ? '' : 'n'} ohne Antwort.` : 'Alle Fragen sind beantwortet. Du kannst noch zurückblättern und Antworten ändern.', 'Ja, abgeben', 'geoDone', '', 'Weiter üben'); },
    geoDone: () => { geoSaveTyped(); geoFinish(); },
    gFilter: f => { UI.gFilter = f; render(); }, gHide: () => { UI.gHide = !UI.gHide; UI.gShow = false; render(); }, gShow: () => { UI.gShow = true; render(); },
    gCard: id => { UI.geoSel = id; UI.gShow = false; go('geoCard'); window.scrollTo && window.scrollTo(0, 0); },
    gStep: d => { const l = gCardList(), i = l.findIndex(x => x.id === UI.geoSel); const n = l[Math.max(0, Math.min(l.length - 1, i + +d))]; if (n) { UI.geoSel = n.id; UI.gShow = false; render(); } }
  }
});
function geoSaveTyped() { const el = document.getElementById('geoIn'); if (el && GQ && !GQ.done) GQ.qs[GQ.i].typed = el.value; }
document.addEventListener('input', e => { if (e.target && e.target.id === 'geoIn' && GQ && !GQ.done) GQ.qs[GQ.i].typed = e.target.value; });
document.addEventListener('keydown', e => {
  if (e.target && e.target.id === 'geoIn' && e.key === 'Enter' && GQ && !GQ.done) { e.preventDefault(); GQ.qs[GQ.i].typed = e.target.value; if (GQ.i < GQ.qs.length - 1) ACT.gNext(); else ACT.geoAsk(); }
});

/* Fach auf der Startseite */
regSubject({ id: 'geo', name: GEO_NAME, ic: '🌍', act: 'geo', sub: () => `${gKnownN('europa')} von ${gList('europa').length} Ländern sicher`,
  tile: () => ({ art: 'europa', title: GEO_NAME, sub: `${gKnownN('europa')} von ${gList('europa').length} Ländern`, act: 'geo' }) });
