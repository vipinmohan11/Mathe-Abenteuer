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
Object.assign(ACT, {
  giftOpen: () => {
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
