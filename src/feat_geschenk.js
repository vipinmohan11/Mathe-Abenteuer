/* =====================================================================
   ÜBERRASCHUNGSGESCHENKE: Wer beim Lernen Meilensteine schafft (Aufgaben, Stufen, Gruppen, Volltreffer, Serie),
   bekommt im Shop ein Geschenk, das er aufmachen darf. Inhalt: ein Sticker oder ein Zubehör für den Avatar,
   das es nur als Geschenk gibt (src: milestone „Überraschungsgeschenk aus dem Shop“). Nichts wird abgezogen.
   Zustand: S.gifts = { got: { meilenstein-id: Zeit }, open: [ungeöffnete Meilenstein-ids], log: [{ m, item, ts }] }
   Ist alles gesammelt, gibt es stattdessen 30 Münzen.
   ===================================================================== */
const GIFT_WHY2 = 'Überraschungsgeschenk aus dem Shop';
const GIFT_MS = [
  ...[40, 100, 200, 350, 550, 800, 1100, 1500].map(n => ({ id: 'gq' + n, t: `Löse ${n} Aufgaben`, v: s => s.stats.q || 0, n })),
  ...[4, 12, 25, 45, 70].map(n => ({ id: 'gb' + n, t: `Beende ${n} Stufen`, v: s => s.stats.blocks || 0, n })),
  ...[2, 4, 6, 9].map(n => ({ id: 'gd' + n, t: `Beende ${n} Gruppen`, v: s => s.stats.decks || 0, n })),
  ...[2, 6, 12].map(n => ({ id: 'gp' + n, t: `${n} Stufen mit 10 von 10`, v: s => s.stats.perfect || 0, n })),
  ...[3, 7, 14].map(n => ({ id: 'gs' + n, t: `${n} Tage in Folge üben`, v: s => (s.streak && s.streak.best) || 0, n }))
];
const giftS = () => { const g = S.gifts || (S.gifts = {}); if (!g.got) g.got = {}; if (!Array.isArray(g.open)) g.open = []; if (!Array.isArray(g.log)) g.log = []; return g; };
function giftCheck() {
  const g = giftS(); let n = 0;
  GIFT_MS.forEach(m => { if (!g.got[m.id] && m.v(S) >= m.n) { g.got[m.id] = Date.now(); g.open.push(m.id); n++; } });
  if (n) { save(); if (!(typeof UI !== 'undefined' && UI && UI.wQuiet)) toast('🎁', n === 1 ? 'Eine Überraschung wartet im Shop!' : n + ' Überraschungen warten im Shop!'); }
}
const giftPool = () => Object.values(CATALOG).filter(i => i.src && i.src.t === 'milestone' && i.src.why === GIFT_WHY2 && !hasItem(i.id));
const giftNext = () => { const g = giftS(); return GIFT_MS.filter(m => !g.got[m.id]).map(m => ({ m, left: m.n - m.v(S) })).sort((a, b) => a.left / a.m.n - b.left / b.m.n)[0] || null; };
function giftCard() {
  const g = giftS(), n = g.open.length;
  if (n) return `<div class="gift-card on"><span class="gift-ic" aria-hidden="true">🎁</span><div><b>${n === 1 ? 'Eine Überraschung wartet!' : n + ' Überraschungen warten!'}</b><span class="small mute">Sticker und Avatar-Zubehör, nur als Geschenk.</span></div><button class="btn" data-act="giftOpen">Aufmachen</button></div>`;
  const nx = giftNext(); if (!nx) return '';
  const pct = Math.max(4, Math.min(100, Math.round((1 - nx.left / nx.m.n) * 100)));
  return `<div class="gift-card"><span class="gift-ic" aria-hidden="true">🎁</span><div><b>Nächste Überraschung</b><span class="small mute">${esc(nx.m.t)} – noch ${nx.left}</span><div class="bar"><i style="width:${pct}%"></i></div></div></div>`;
}
/* ---------- Türsteher: Vor dem Aufmachen eine Rechenfrage mit 4 Antworten aus einem begonnenen Heft oder dem Fehler-Heft ---------- */
function giftMC(q) {
  if (!q) return null;
  if (q.choices) {
    if (q.choices.length < 4 || typeof q.correct !== 'number') return null;
    const o = q.choices.map((t, i) => ({ t, ok: i === q.correct })); return { title: q.title || '', body: q.prompt || '', opts: shuffle(o) };
  }
  if (q.fields && q.fields.length === 1 && q.html) {
    const f = q.fields[0], a = String(f.a);
    if (f.money || f.dec || !/^\d{1,6}$/.test(a)) return null;
    const n = +a, cand = shuffle([n + 1, n - 1, n + 10, n - 10, n + 2, n - 2, n + 100, n - 100, n * 2, Math.floor(n / 2), +a.split('').reverse().join('')]), set = [];
    cand.forEach(v => { if (v >= 0 && v !== n && !set.includes(v) && set.length < 3) set.push(v); });
    for (let k = 3; set.length < 3 && k < 40; k++) if (n + k !== n && !set.includes(n + k)) set.push(n + k);
    const fmt = v => String(v), o = shuffle([{ t: fmt(n), ok: true }, ...set.map(v => ({ t: fmt(v), ok: false }))]);
    return { title: q.title || '', body: q.html.replace(/\[\[0\]\]/g, '<span class="gq-blank">?</span>'), opts: o };
  }
  return null;
}
function giftQ() {
  const keys = Object.keys(S.decks || {}).filter(k => S.decks[k] && S.decks[k].i > 0 && findTopic(k));
  const miss = (S.mistakes || []).filter(m => m && m.q && findTopic(m.tid));
  const all = allTopics().map(x => x.key);
  for (let i = 0; i < 80; i++) {
    let q;
    if (miss.length && (!keys.length || Math.random() < .5)) q = pick(miss).q;
    else q = makeQ(keys.length ? pick(keys) : pick(all), ri(2, 4));
    const mc = giftMC(q); if (mc) return mc;
  }
  const a = ri(3, 9), b = ri(3, 9);
  return giftMC({ title: 'Rechne aus', html: `${a} × ${b} = [[0]]`, fields: [{ a: String(a * b) }] });
}
function giftAsk(note) {
  const g = UI.gq = UI.gq || giftQ();
  modal('Erst knobeln, dann aufmachen', `${note ? `<span class="gq-note">${note}</span>` : ''}<span class="gq-t">${g.title}</span><span class="gq-q">${g.body}</span><span class="gq-opts">${g.opts.map((o, i) => `<button class="btn sec gq-o" data-act="giftPick" data-arg="${i}">${o.t}</button>`).join('')}</span>`, null, '', '', 'Später');
}
Object.assign(ACT, {
  giftOpen: () => { if (!giftS().open.length) return; UI.gq = null; giftAsk(''); },
  giftPick: i => {
    const g = UI.gq; if (!g || !g.opts[+i]) return;
    if (g.opts[+i].ok) { UI.gq = null; closeModal(); ACT.giftGo(); }
    else { UI.gq = null; sfx('no'); giftAsk('Nicht ganz. Hier ist eine neue Frage – dein Geschenk wartet.'); }
  },
  giftBubble: () => { UI.shopGrp = 'fino'; go('shop'); },
  giftGo: () => {
    const g = giftS(); if (!g.open.length) return;
    const mid = g.open.shift(), pool = giftPool(), it = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    let body, title = 'Überraschung!';
    if (it) { unlock(it.id, true); g.log.push({ m: mid, item: it.id, ts: Date.now() }); body = `<div class="gift-reveal"><div class="gift-th">${(KIND[it.kind] || { thumb: x => x.e }).thumb(it)}</div><p><b>${esc(it.name)}</b><br><span class="small mute">${it.kind === 'bsticker' ? 'Ein neuer Sticker für dein Heft.' : 'Neues Zubehör für deinen Avatar.'}</span></p></div>`; }
    else { S.coins += 30; S.life = (S.life || 0) + 30; g.log.push({ m: mid, item: 'coins30', ts: Date.now() }); body = '<p>Du hast schon alle Geschenke! Dafür gibt es <b>30 🪙</b>.</p>'; }
    save(); sfx('magic'); try { if (!rwCalm()) confetti(50); } catch (e) { }
    modal(title, body, g.open.length ? 'Nächstes aufmachen' : null, 'giftOpen', '', g.open.length ? 'Später' : 'Toll!');
    if (view === 'shop') render();
  }
});
/* kleine Blase auf der Startseite, solange eine Überraschung ungeöffnet ist: Tippen führt in den Shop */
function giftBubble() {
  let b = document.getElementById('giftBubble');
  const n = giftS().open.length, show = n > 0 && typeof view !== 'undefined' && view === 'home';
  if (!show) { if (b) b.hidden = true; return; }
  if (!b) { b = document.createElement('button'); b.id = 'giftBubble'; b.className = 'gift-bubble'; b.type = 'button'; b.dataset.act = 'giftBubble'; document.body.appendChild(b); }
  b.hidden = false; b.setAttribute('aria-label', n === 1 ? 'Eine Überraschung wartet im Shop' : n + ' Überraschungen warten im Shop');
  b.innerHTML = `<span aria-hidden="true">🎁</span><i>${n}</i>`;
}
