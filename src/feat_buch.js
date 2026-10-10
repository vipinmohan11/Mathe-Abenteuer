/* =====================================================================
   MEIN BUCH: pro Heft eine Seite – Titel, Fortschritt, verdiente Stempel (STAMP_DEFS in rewards.js)
   und 4 Sticker-Plätze. Sticker gibt es nur im Shop / als Meilenstein. Gestalten nur in der Kreativzeit (UI.ro === false).
   S.buch = { st: { '<heftId>': [stickerId|null ×4] } }
   ===================================================================== */
const BK_SPACES = 4;
regKind('bsticker', { group: 'buch', label: 'Sticker', ic: 'sticker' });
const BS_DATA = [
  ['stern', 'Stern', '⭐', 0], ['regen', 'Regenbogen', '🌈', 0], ['lach', 'Lachen', '😀', 0],
  ['cool', 'Coole Brille', '😎', 15], ['party', 'Party', '🥳', 20], ['augen', 'Sternenaugen', '🤩', 25], ['nerd', 'Schlaumeier', '🤓', 20],
  ['fuchs', 'Fuchs', '🦊', 15], ['panda', 'Panda', '🐼', 20], ['katze', 'Katze', '🐱', 15], ['hase', 'Hase', '🐰', 15], ['eule', 'Eule', '🦉', 25],
  ['pinguin', 'Pinguin', '🐧', 20], ['einhorn', 'Einhorn', '🦄', 40], ['schildkr', 'Schildkröte', '🐢', 20], ['krake', 'Krake', '🐙', 30],
  ['delfin', 'Delfin', '🐬', 30], ['falter', 'Schmetterling', '🦋', 25], ['trex', 'T-Rex', '🦖', 45], ['drache', 'Drache', '🐉', 55],
  ['sonnenbl', 'Sonnenblume', '🌻', 15], ['klee', 'Glücksklee', '🍀', 20], ['pizza', 'Pizza', '🍕', 20], ['eis', 'Eis', '🍦', 25], ['kuchen', 'Cupcake', '🧁', 30],
  ['ball', 'Fußball', '⚽', 20], ['rakete', 'Rakete', '🚀', 40], ['zug', 'Zug', '🚂', 30], ['burg', 'Burg', '🏰', 50], ['gitarre', 'Gitarre', '🎸', 35],
  ['farben', 'Farbpalette', '🎨', 35], ['fernrohr', 'Fernrohr', '🔭', 45], ['diamant', 'Diamant', '💎', 60],
  ['medaille', 'Medaille', '🏅', 'Beende eine Gruppe'], ['pokal', 'Pokal', '🏆', 'Sammle 3 Stempel'], ['gehirn', 'Gehirn', '🧠', 'Sammle 6 Stempel'], ['krone', 'Krone', '👑', 'Sammle 12 Stempel'],
  ['loewe', 'Löwe', '🦁', 'G'], ['elefant', 'Elefant', '🐘', 'G'], ['hai', 'Hai', '🦈', 'G'], ['papagei', 'Papagei', '🦜', 'G'], ['frosch', 'Frosch', '🐸', 'G'], ['ufo', 'Ufo', '🛸', 'G'],
  ['roboter', 'Roboter', '🤖', 'G'], ['zauberer', 'Zauberer', '🧙', 'G'], ['vulkan', 'Vulkan', '🌋', 'G'], ['wal', 'Wal', '🐋', 'G'], ['ballon', 'Ballon', '🎈', 'G'], ['teddy', 'Teddy', '🧸', 'G'],
  ['karussell', 'Karussell', '🎠', 'G'], ['kristall', 'Kristallkugel', '🔮', 'G'], ['planet', 'Planet', '🪐', 'G'], ['krabbe', 'Krabbe', '🦀', 'G']
];
regItems(BS_DATA.map(([id, name, e, q]) => ({ id: 'bs.' + id, kind: 'bsticker', name, e, src: q === 0 ? { t: 'free' } : q === 'G' ? { t: 'milestone', why: 'Überraschungsgeschenk aus dem Shop' } : typeof q === 'number' ? { t: 'shop', cur: 'c', price: q } : { t: 'milestone', why: q } })));

const fmtDate = ts => new Date(ts).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
const bkPage = m => { const B = S.buch || (S.buch = { st: {} }); if (!B.st) B.st = {}; let a = B.st[m.id]; if (!Array.isArray(a)) a = B.st[m.id] = []; while (a.length < BK_SPACES) a.push(null); return a; };
const bkMod = () => MODULES.find(m => m.id === UI.bMod) || MODULES[0];
const bkStickers = () => Object.values(CATALOG).filter(i => i.kind === 'bsticker');
const bkFilled = () => MODULES.reduce((n, m) => n + bkPage(m).filter(id => id && CATALOG[id] && hasItem(id)).length, 0);

/* Kapitel- und Heft-Auswahl (skaliert auf viele Hefte) + Liste der Übungen im Heft */
function bkPicker(cur) {
  const chapter = chapterOf(cur), chapters = [...new Set(MODULES.map(chapterOf))];
  const label = c => c === 'Extra' ? 'Extra-Training' : 'Kapitel ' + esc(c);
  return `<div class="rh-book-picker"><label>Kapitel<select id="rh-chapter" aria-label="Kapitel">${chapters.map(c => `<option value="${esc(c)}" ${chapter === c ? 'selected' : ''}>${label(c)}</option>`).join('')}</select></label><label>Modul / Heft<select id="rh-module" aria-label="Modul oder Heft">${MODULES.filter(m => chapterOf(m) === chapter).map(m => `<option value="${esc(m.id)}" ${cur === m ? 'selected' : ''}>${m.extra ? '' : esc(m.id) + ' · '}${esc(m.title)} · ${modProgress(m).pct}%</option>`).join('')}</select></label></div>
  <details class="rh-sessions"><summary>Übungen in ${esc(cur.title)} · ${modProgress(cur).done} / ${cur.topics.length} geschafft</summary><div>${cur.topics.map((t, i) => {
    const key = tk(cur.id, t.id), d = S.decks[key];
    return `<button data-act="rhSession" data-arg="${esc(key)}"><span>${i + 1}.</span><strong>${esc(t.t)}</strong><span>${d ? d.i : 0} / ${DECK_N}</span>${ico('back', 17)}</button>`;
  }).join('')}</div></details>`;
}
AFTER.buch = () => {
  const c = $('#rh-chapter'), m = $('#rh-module');
  if (c) c.addEventListener('change', () => { const first = MODULES.find(x => chapterOf(x) === c.value); if (first) ACT.bMod(first.id); });
  if (m) m.addEventListener('change', () => ACT.bMod(m.value));
};
VIEWS.buch = () => {
  const mods = MODULES, cur = bkMod(), i = mods.indexOf(cur), p = modProgress(cur), st = stampsOf(cur), got = st.filter(s => s.got).length, fer = st.find(s => s.id === 'fer'), pg = bkPage(cur), ro = UI.ro;
  if (ro) UI.bSlot = null;
  const slot = UI.bSlot;
  const nav = (d, ic) => `<button class="btn sec bk-nav" data-act="bMod" data-arg="${mods[(i + d + mods.length) % mods.length].id}" aria-label="${d < 0 ? 'Vorherige' : 'Nächste'} Seite" ${mods.length < 2 ? 'disabled' : ''}>${ic}</button>`;
  const spaces = pg.map((id, k) => {
    const it = id && CATALOG[id] && hasItem(id) ? CATALOG[id] : null;
    return `<button class="bk-slot ${it ? 'full' : ''} ${slot === k ? 'sel' : ''}" ${ro ? 'disabled' : `data-act="bSlot" data-arg="${k}"`} aria-label="Sticker-Platz ${k + 1}${it ? ': ' + esc(it.name) : ''}">${it ? `<span>${it.e}</span>` : ro ? '' : '<i>+</i>'}</button>`;
  }).join('');
  const tray = slot == null ? '' : `<div class="bk-tray"><div class="row" style="justify-content:space-between;margin-bottom:8px"><b>Sticker aussuchen</b>${pg[slot] ? `<button class="btn ghost sm" data-act="bPick" data-arg="">Entfernen</button>` : ''}</div>
    <div class="itiles">${bkStickers().sort((a, b) => hasItem(b.id) - hasItem(a.id) || (a.src.price || 0) - (b.src.price || 0)).map(it => itemTile(it, { act: 'bPick', sel: pg[slot] === it.id })).join('')}</div></div>`;
  return topBar(ico('book', 26) + ' Mein Buch') + `
  <div class="bk-head"><span class="small mute">${stampCount()} Stempel · ${bkFilled()} Sticker eingeklebt</span></div>
  ${bkPicker(cur)}
  <div class="bk-page t-${TINTS[i % 6]}">
    <div class="bk-top">${nav(-1, ico('back', 22))}<div class="bk-t"><div class="small mute">Seite ${i + 1} von ${mods.length}</div><h2>${cur.icon} ${esc(cur.title)}</h2></div>${nav(1, `<span style="display:inline-block;transform:scaleX(-1);line-height:0">${ico('back', 22)}</span>`)}</div>
    <div class="bk-prog"><div class="ring" style="--p:${p.pct}"><span>${p.pct}%</span></div><div><b>${p.done} von ${p.total} Übungen geschafft</b><div class="small mute">${got} von ${st.length} Stempeln</div></div></div>
    <div class="bk-stamps">${st.map(s => `<div class="bk-st ${s.got ? 'got' : ''}" title="${esc(s.d)}">${s.got ? `<span class="sc">${s.ic}</span>` : `<span class="sc rh-stamp-preview">${s.ic}<i class="rh-lock" aria-label="Gesperrt">${ico('lock', 13)}</i></span>`}<b>${esc(s.n)}</b><small>${s.got ? fmtDate(S.stamps[s.key]) : esc(s.d)}</small></div>`).join('')}</div>
    <div class="bk-spaces">${spaces}</div>
    ${tray}
    ${fer && fer.got ? `<div style="text-align:center;margin-top:14px"><button class="btn" data-act="urkunde" data-arg="${cur.id}">${ico('certificate', 22)} Urkunde ansehen</button></div>` : ''}
  </div>`;
};
VIEWS.urkunde = () => {
  const m = bkMod(), p = modProgress(m), st = stampsOf(m).filter(s => s.got), when = S.stamps[m.id + '.fer'] || Date.now();
  return `<div class="top noprint"><button class="btn sec back" data-act="buch" aria-label="Zurück">${ico('back', 22)}</button><h2>${ico('certificate', 26)} Urkunde</h2><button class="btn" data-act="print">${ico('print', 20)} Drucken</button></div>
  <div class="urk"><div class="urk-in">
    <div class="urk-top">Urkunde</div>
    <div class="urk-av">${avatarHTML(eqAvatar(), 120, 'cheer')}</div>
    <p class="urk-s">Diese Urkunde bekommt</p>
    <h1 class="urk-n">${esc(S.name || 'Mathe-Profi')}</h1>
    <p class="urk-s">für das Meistern des Hefts</p>
    <h2 class="urk-h">${m.icon} ${esc(m.title)}</h2>
    <p class="urk-s">${p.done} von ${p.total} Übungen komplett gelöst · ${p.pct} % der Punkte</p>
    <div class="urk-st">${st.map(s => `<span title="${esc(s.n)}">${s.ic}</span>`).join('')}</div>
    <div class="urk-ft"><span>${fmtDate(when)}</span><span>${esc(FN())} &amp; Denkzauber</span></div>
  </div></div>`;
};
registerFeature({
  id: 'buch', title: 'Mein Buch', icon: 'sticker', tint: 'mint', group: 'earn', order: 15, creative: 'view', view: 'buch',
  sub: () => `${stampCount()} Stempel`,
  leave: () => { UI.bSlot = null; },
  check: () => {
    const done = MODULES.reduce((n, m) => n + modProgress(m).done, 0), sc = stampCount();
    [['bs.medaille', done >= 1], ['bs.pokal', sc >= 3], ['bs.gehirn', sc >= 6], ['bs.krone', sc >= 12]].forEach(([id, ok]) => { if (ok) unlock(id); });
  },
  acts: {
    bMod: id => { UI.bMod = id; UI.bSlot = null; render(); },
    bSlot: k => { if (UI.ro) return; UI.bSlot = UI.bSlot === +k ? null : +k; render(); },
    bPick: id => {
      if (UI.ro || UI.bSlot == null) return;
      const pg = bkPage(bkMod());
      if (id && !hasItem(id)) return;
      pg[UI.bSlot] = id || null; UI.bSlot = null; save(); render();
    },
    urkunde: id => { UI.bMod = id; go('urkunde'); }, buch: () => go('buch'),
    rhSession: key => { if (findTopic(key)) go('topic', { mod: key.split('.')[0], key }); }
  },
  goals: () => []
});
