/* =====================================================================
   SCHATZKAMMER: ein gemischter Haufen Karten (Fakten, Witze, Rätsel, Musik, Denkfragen …).
   Keine Sets, keine Kategorien, keine Seltenheit. Eine Truhe (S.chests) = genau eine verdiente Karte.
   ===================================================================== */
const cardTone = id => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return h % 6; };
function cardHTML(c, o) {
  o = o || {};
  const ty = CARD_TYPES[c.t] || CARD_TYPES.fakt, shown = UI.ans[c.id], tone = cardTone(c.id);
  const extra = c.a ? (c.t === 'fakt' || c.t === 'musik' ? 'Mehr dazu' : 'Antwort zeigen') : '';
  return `<div class="tcard tn${tone} ty-${c.t} ${o.hot ? 'hot' : ''}">
    <div class="tpic"><i class="d1"></i><i class="d2"></i><i class="d3"></i><span class="te">${c.e || ty.ic}</span><span class="tty">${ty.ic} ${ty.n}</span></div>
    <div class="tbody"><div class="tq">${c.q}</div>
    ${c.a ? (shown ? `<div class="ta">${c.a}</div>` : `<button class="btn sm sec" data-act="showAns" data-arg="${c.id}">${extra}</button>`) : ''}
    ${c.t === 'offen' ? '<div class="tnote">Hier gibt es keine falsche Antwort.</div>' : ''}</div></div>`;
}
function revealHTML() {
  const r = UI.reveal; if (!r) return '';
  if (r.k === 'card') { const c = CARDS.find(x => x.id === r.id); return c ? `<h3 class="rvh">${ico('sparkle', 22)} Neu gefunden!</h3><div class="rvcard">${cardHTML(c, { hot: true })}</div>` : ''; }
  return `<h3 class="rvh">${ico('sparkle', 22)} ${esc(r.title)}</h3><div class="rvcard"><div class="tcard tn1 ty-item hot"><div class="tpic big"><i class="d1"></i><i class="d2"></i><i class="d3"></i><span class="te">${r.ic}</span></div><div class="tbody"><div class="tq"><b>${esc(r.title)}</b></div><div class="tnote">${esc(r.sub || '')}</div></div></div></div>`;
}
function revealOne() {                            // genau eine Karte aufdecken, ohne Konfetti
  if (!S.chests) return;
  S.chests--; UI.reveal = chestRoll(); UI.ans = {};
  sfx('ok'); checkTrophies(); save(); render();
}
VIEWS.schatz = () => {
  const found = Object.keys(S.cards).length, n = UI.schatzN || 24;
  const sorted = CARDS.filter(c => S.cards[c.id]).sort((a, b) => S.cards[b.id] - S.cards[a.id]);
  const hotId = UI.reveal && UI.reveal.k === 'card' ? UI.reveal.id : null;
  const list = sorted.filter(c => c.id !== hotId).slice(0, n);
  return topBar(ico('chest', 26) + ' Schatzkammer', 'home', `<span class="small mute">${found} Karten</span>`) + `
  ${S.chests ? `<div class="card tkopen"><div class="sp"><b>Eine Karte wartet auf dich.</b><div class="small mute">Du hast sie dir verdient.</div></div><button class="btn big" data-act="openChest">Karte aufdecken</button></div>`
    : `<p class="small mute" style="margin:0 4px 12px">Für gute Blöcke und fertige Gruppen gibt es eine Karte.</p>`}
  ${revealHTML()}
  ${found ? `<div class="tgrid">${list.map(c => cardHTML(c)).join('')}</div>` : '<div class="card result"><h3>Noch leer</h3><p class="mute">Beende eine Gruppe oder einen Block mit mindestens 2 ⭐, dann liegt hier die erste Karte.</p></div>'}
  ${sorted.length - (hotId ? 1 : 0) > n ? `<div class="center" style="margin-top:14px"><button class="btn sec" data-act="schatzMore">Mehr Karten zeigen</button></div>` : ''}`;
};
registerFeature({
  id: 'schatz', title: 'Schatzkammer', icon: 'chest', tint: 'butter', group: 'earn', order: 10,
  sub: () => `${Object.keys(S.cards).length} Karten`, badge: () => S.chests ? `${S.chests} neu` : '', view: 'schatz',
  acts: { schatz: () => go('schatz', { reveal: null, schatzN: 24, ans: {} }), showAns: id => { UI.ans[id] = 1; render(); }, schatzMore: () => { UI.schatzN = (UI.schatzN || 24) + 24; render(); }, openChest: revealOne }
});
