/* =====================================================================
   INSEL: ein Lern-Rückblick, kein Baukasten. Jede fertige Übungsgruppe (S.stats.decks) bringt den nächsten
   Gegenstand an seinen festen Platz; ein ganzes Heft bringt ein größeres Gebäude. Alles ergibt sich aus dem
   Fortschritt (nichts wird gespeichert, nichts geht verloren). Kommende Plätze sind grau umrandet.
   S.ins.n = zuletzt gezeigte Anzahl (nur für den kleinen Hinweis); alte Formen von S.ins werden ignoriert.
   ===================================================================== */
/* Gruppen-Gegenstände in fester Reihenfolge: [Emoji, Name, x, y, Größe] auf einer 1000×560-Zeichenfläche */
const INS_GROUP = [
  ['🌳', 'Baum', 190, 340, 68], ['🌷', 'Blumen', 330, 400, 42], ['🌿', 'Busch', 140, 392, 46], ['🍄', 'Pilz', 430, 452, 36],
  ['bridge', 'Brücke', 500, 380, 76], ['⛺', 'Zelt', 650, 300, 58], ['🛶', 'Kanu', 110, 486, 54], ['🌴', 'Palme', 770, 352, 68],
  ['🏡', 'Hütte', 380, 270, 72], ['⛲', 'Brunnen', 620, 440, 50], ['🌻', 'Sonnenblumen', 710, 424, 42], ['⛵', 'Segelboot', 870, 478, 56],
  ['🌈', 'Regenbogen', 520, 150, 112], ['🎡', 'Riesenrad', 850, 300, 88], ['🎈', 'Ballon', 690, 170, 52]
];
/* Heft-Gebäude: Heft-Id → [Emoji, Name, x, y, Größe] */
const INS_BOOK = { A4: ['🗼', 'Leuchtturm', 930, 392, 96], A5: ['🏰', 'Burg', 250, 235, 100] };
const INS_FLAG = ['🚩', 'Fahne', 520, 238, 54];
const insTotal = () => MODULES.reduce((a, m) => a + m.topics.length, 0);
const bookDone = m => m.topics.every(t => { const r = S.topics[tk(m.id, t.id)]; return !!(r && r.fl && r.fl.deck); });
/* alle Plätze mit Zustand; `left` = wie viele Gruppen noch fehlen */
function insSpots() {
  const dk = S.stats.decks || 0, a = [];
  INS_GROUP.forEach((g, i) => a.push({ e: g[0], n: g[1], x: g[2], y: g[3], s: g[4], got: dk >= i + 1, left: Math.max(0, i + 1 - dk), why: `Gruppe ${i + 1} beenden` }));
  MODULES.filter(m => INS_BOOK[m.id]).forEach(m => {
    const b = INS_BOOK[m.id], rest = m.topics.filter(t => !((S.topics[tk(m.id, t.id)] || {}).fl || {}).deck).length;
    a.push({ e: b[0], n: b[1], x: b[2], y: b[3], s: b[4], got: rest === 0, left: rest, why: `Alle Gruppen im Heft ${m.id} beenden`, big: true });
  });
  const tot = insTotal(); a.push({ e: INS_FLAG[0], n: INS_FLAG[1], x: INS_FLAG[2], y: INS_FLAG[3], s: INS_FLAG[4], got: dk >= tot, left: Math.max(0, tot - dk), why: 'Alle Gruppen beenden' });
  return a;
}
function insNext(sp) {
  const nx = sp.filter(s => !s.got).sort((a, b) => a.left - b.left)[0];
  return nx ? `Nächstes: ${nx.n} – beende noch ${nx.left} Gruppe${nx.left > 1 ? 'n' : ''}${nx.big ? ' im Heft' : ''}` : 'Alles geschafft – deine Insel ist fertig!';
}
const insNum = sp => sp.filter(s => s.got).length;
function insBlob(cx, cy, rx, ry, seed) {
  const pts = []; for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2, k = 1 + .04 * Math.sin(3 * a + seed) + .03 * Math.sin(5 * a + seed * 2); pts.push([(cx + Math.cos(a) * rx * k).toFixed(1), (cy + Math.sin(a) * ry * k).toFixed(1)]); }
  return 'M' + pts.map(p => p.join(' ')).join('L') + 'Z';
}
const insArt = (s, cls) => s.e === 'bridge'
  ? `<g class="${cls || ''}" transform="translate(${s.x} ${s.y})"><path d="M-62 0Q0 -58 62 0" fill="none" stroke="#B88A5A" stroke-width="15" stroke-linecap="round"/><path d="M-62 -8Q0 -66 62 -8" fill="none" stroke="#8C6440" stroke-width="4"/><path d="M-44 -24v22M0 -40v26M44 -24v22" stroke="#8C6440" stroke-width="4"/></g>`
  : `<text x="${s.x}" y="${s.y}" font-size="${s.s}" text-anchor="middle" class="${cls || ''}">${s.e}</text>`;
function insSVG(sp) {
  const sel = UI.insSel;
  let h = `<rect width="1000" height="560" fill="#EAF3F4"/><rect y="215" width="1000" height="345" fill="#CFE4EA"/>`;
  for (let i = 0; i < 4; i++) { const y = 250 + i * 80; h += `<path d="M0 ${y} Q 60 ${y - 8} 125 ${y} T 250 ${y} T 375 ${y} T 500 ${y} T 625 ${y} T 750 ${y} T 875 ${y} T 1000 ${y}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>`; }
  h += `<path d="${insBlob(500, 350, 420, 180, 1.3)}" fill="#F1E6C8"/><path d="${insBlob(500, 342, 396, 160, 1.3)}" fill="#C9DDB0"/><ellipse cx="500" cy="378" rx="120" ry="22" fill="#CFE4EA"/>`;
  sp.slice().sort((a, b) => a.y - b.y).forEach(s => {
    const i = sp.indexOf(s), on = sel === i, r = s.s * .62;
    h += `<g class="insp ${s.got ? 'got' : 'lk'} ${on ? 'on' : ''}" data-act="insTap" data-arg="${i}" role="button" aria-label="${esc(s.n)}">`
      + `<circle cx="${s.x}" cy="${s.y - s.s * .32}" r="${Math.max(r, 30)}" class="hit"/>`
      + (s.got ? insArt(s) : `<circle cx="${s.x}" cy="${s.y - s.s * .32}" r="${Math.min(Math.max(r, 26), 58)}" class="ph"/>${insArt(s, 'gh')}`)
      + `</g>`;
  });
  return `<svg viewBox="0 0 1000 560" class="insvg" role="img" aria-label="Deine Insel">${h}</svg>`;
}
VIEWS.insel = () => {
  const sp = insSpots(), sel = sp[UI.insSel], next = sp.filter(s => !s.got).sort((a, b) => a.left - b.left)[0];
  const what = sel || next;
  const art = what ? (what.e === 'bridge' ? ico('island', 36) : `<span aria-hidden="true">${what.e}</span>`) : ico('check', 36);
  const why = what ? what.got ? 'Schon verdient! Dieser Platz gehört zu deiner Insel.' : `Beende noch ${what.left} ${what.left === 1 ? 'Übung' : 'Übungen'}${what.big ? ' in ' + what.why.replace('Alle Gruppen im Heft ', 'Heft ').replace(' beenden', '') : ''}. Dann erscheint ${what.n === 'Brücke' ? 'die Brücke' : '„' + esc(what.n) + '“'} hier von selbst.` : 'Deine Insel ist vollständig!';
  return topBar(ico('island', 26) + ' Meine Insel') + `<div class="rh-island-intro"><h2>Du rechnest. Deine Insel wächst.</h2><p>Eine ganze Übung mit 30 Aufgaben geschafft? Ein neuer Platz erscheint. Ein ganzes Heft geschafft? Ein großes Gebäude kommt dazu.</p></div><div class="inswrap">${insSVG(sp)}</div><section class="rh-island-next">${art}<div><small>${what && what.got ? 'DEIN ERFOLG' : sel ? 'DIESER PLATZ' : 'ALS NÄCHSTES'}</small><h3>${what ? esc(what.n) : 'Alles geschafft'}</h3><p>${why}</p></div><button class="btn" data-act="goNext">Weiter üben →</button></section><p class="small mute">${insNum(sp)} von ${sp.length} Plätzen verdient. Tippe auf einen Platz, um mehr zu erfahren.</p>`;
};
registerFeature({
  id: 'insel', title: 'Insel', icon: 'island', tint: 'mint', group: 'world', order: 20, view: 'insel',
  sub: () => { const sp = insSpots(); return `${insNum(sp)} von ${sp.length} Plätzen`; },
  acts: { insTap: i => { UI.insSel = UI.insSel === +i ? null : +i; sfx('tap'); render(); } },
  check: () => {                                   // leiser Hinweis, wenn ein neuer Gegenstand dazukam
    const n = insNum(insSpots());
    if (typeof S.ins.n !== 'number') { S.ins.n = n; return; }
    if (n > S.ins.n) { const g = insSpots().filter(s => s.got).slice(S.ins.n); S.ins.n = n; if (g.length) toast(g[g.length - 1].e, `Neu auf deiner Insel: <b>${esc(g[g.length - 1].n)}</b>`); save(); }
  }
});
