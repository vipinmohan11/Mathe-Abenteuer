/* =====================================================================
   WESEN: acht Eier schlüpfen nacheinander, wenn die gesammelten Sterne (S.starsLife) ihre Marke erreichen,
   und wachsen mit weiteren Sternen (3 Stufen). Alles ergibt sich aus den Sternen – keine Pflege, keine Strafe,
   keine Zeitgeber. S.wes.hn = Anzahl der schon gemeldeten Schlüpf-Momente (alte Formen von S.wes werden ignoriert).
   ===================================================================== */
const WESEN = [                                   // [Emoji, Name, Sterne bis zum Schlüpfen, Eifarbe]
  ['🐼', 'Panda', 3, '#E3E3EC'], ['🐸', 'Frosch', 10, '#CFE8C8'], ['🦉', 'Eule', 20, '#E8DCC8'], ['🐢', 'Schildkröte', 32, '#C9E6DA'],
  ['🐙', 'Krake', 46, '#D9D2F2'], ['🐧', 'Pinguin', 62, '#CFE1F2'], ['🐇', 'Hase', 80, '#F0E2D2'], ['🐲', 'Drache', 100, '#CDEBD3']
].map(([e, name, at, col]) => ({ e, name, at, col }));
const wesStage = w => { const d = S.starsLife - w.at; return d >= 25 ? 3 : d >= 10 ? 2 : 1; };
const wesHatched = () => WESEN.filter(w => S.starsLife >= w.at);
const wesEgg = (col, size) => `<svg class="egg" viewBox="0 0 100 120" width="${size}" height="${size * 1.2}"><path d="M50 8C74 8 90 48 90 74a40 40 0 0 1-80 0C10 48 26 8 50 8Z" fill="${col}" stroke="#9AA0B0" stroke-width="2.5" stroke-dasharray="6 5"/><circle cx="38" cy="62" r="5" fill="#9AA0B0" opacity=".4"/><circle cx="62" cy="80" r="5" fill="#9AA0B0" opacity=".4"/><circle cx="46" cy="96" r="4" fill="#9AA0B0" opacity=".4"/></svg>`;
const wesIcon = (w, size) => `<span class="wes-i st${wesStage(w)}" style="font-size:${size || 56}px">${w.e}</span>`;
VIEWS.wesen = () => {
  const got = wesHatched(), nx = WESEN.find(w => S.starsLife < w.at), sel = WESEN[UI.wesSel];
  const next = nx ? `Nächstes Ei: noch ${nx.at - S.starsLife} ⭐ bis es schlüpft` : 'Alle Eier sind geschlüpft!';
  const detail = sel && S.starsLife >= sel.at ? `<div class="card wes-detail"><div class="wd-art">${wesIcon(sel, 110)}</div><div class="sp"><h2>${esc(sel.name)}</h2><p class="mute small" style="margin:4px 0 0">Wachstum ${wesStage(sel)} von 3${wesStage(sel) < 3 ? ` · wächst weiter bei ${sel.at + (wesStage(sel) === 1 ? 10 : 25)} ⭐` : ' · ausgewachsen'}</p></div></div>` : '';
  return topBar(ico('egg', 26) + ' Wesen') + `
  <div class="card insnx"><b>${next}</b><span class="small mute">${got.length} von ${WESEN.length} Wesen · du hast ${S.starsLife} ⭐ gesammelt</span></div>
  ${detail}
  <div class="wgrid">${WESEN.map((w, i) => S.starsLife >= w.at
    ? `<button class="wtile ${UI.wesSel === i ? 'on' : ''}" data-act="wesSel" data-arg="${i}">${wesIcon(w, 56)}<b>${esc(w.name)}</b></button>`
    : `<div class="wtile lk rh-wes"><span class="rh-lock" aria-label="Gesperrt">${ico('lock', 13)}</span><div class="rh-wes-preview"><span>${w.e}</span>${wesEgg(w.col, 30)}</div><b>${esc(w.name)}</b><small>Schlüpft bei ${w.at} ⭐</small></div>`).join('')}</div>`;
};
registerFeature({
  id: 'wesen', title: 'Wesen', icon: 'egg', tint: 'peach', group: 'world', order: 40, view: 'wesen',
  sub: () => `${wesHatched().length} von ${WESEN.length} Wesen`,
  check: () => {                                   // ein leiser Hinweis pro neu geschlüpftem Wesen
    const n = wesHatched().length;
    if (typeof S.wes.hn !== 'number') { S.wes.hn = n; return; }
    if (n > S.wes.hn) { S.wes.hn = n; toast('🐣', `Ein Ei ist geschlüpft: <b>${esc(WESEN[n - 1].name)}</b>`); save(); }
  },
  acts: { wesSel: i => { UI.wesSel = UI.wesSel === +i ? null : +i; sfx('tap'); render(); } }
});
