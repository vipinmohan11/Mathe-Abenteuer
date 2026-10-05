/* =====================================================================
   STORY-EPISODEN: eine fortlaufende Geschichte (Die Zahleninsel und die verschwundenen Töne).
   Neue Episoden werden durch fertige Gruppen (S.stats.decks >= ep.need) freigeschaltet. Lesen bringt nichts Rechnerisches (keine Münzen/Sterne/Karten).
   Daten: story_data.js (STORY_EPS). Zustand: S.story = { read:{ep:Szene}, done:{ep:ts}, choices:{} }
   ===================================================================== */
const SC_BG = {
  strand: { sky: ['#BFE3FF', '#F2FAFF'], ground: '#F6E3B1', sea: '#8FD0F7', props: [['☀️', 82, 8, 56], ['🌴', 12, 44, 70], ['🐚', 62, 80, 30], ['⛵', 70, 38, 36]] },
  wald: { sky: ['#CDEFD9', '#EAF8EE'], ground: '#7FCF95', props: [['🌲', 8, 30, 80], ['🌳', 86, 28, 80], ['🍄', 30, 78, 30], ['🦋', 56, 20, 30]] },
  hoehle: { sky: ['#2B2459', '#4B3F8F'], ground: '#4A4178', props: [['💎', 14, 52, 38], ['🕯️', 84, 48, 38], ['🦇', 50, 14, 32]] },
  berg: { sky: ['#CFE3FF', '#F1F7FF'], ground: '#D8E4D0', props: [['🏔️', 20, 36, 90], ['⛰️', 74, 40, 80], ['☁️', 48, 12, 50]] },
  stadt: { sky: ['#FFE0C2', '#E7E0FF'], ground: '#C9C4DD', props: [['🏙️', 22, 42, 90], ['🌇', 72, 40, 70], ['🚲', 52, 80, 32]] },
  meer: { sky: ['#C8E8FF', '#E6F6FF'], ground: '#5BB2EC', props: [['⛵', 20, 46, 60], ['🐋', 70, 62, 56], ['🌊', 46, 78, 40], ['🌤️', 80, 10, 50]] },
  himmel: { sky: ['#A9D4FF', '#F3FAFF'], ground: '#FFFFFF', props: [['☁️', 14, 40, 70], ['🎈', 80, 28, 56], ['☁️', 56, 70, 60], ['🐦', 36, 16, 30]] },
  labor: { sky: ['#EFE9FF', '#DDF6EA'], ground: '#D5CCF2', props: [['🔬', 14, 50, 50], ['⚗️', 82, 46, 46], ['💡', 50, 14, 36], ['🧪', 66, 76, 30]] },
  nacht: { sky: ['#17174A', '#3B2F86'], ground: '#2D2A66', props: [['🌙', 80, 14, 54], ['⭐', 20, 14, 28], ['✨', 52, 24, 28], ['🌟', 34, 50, 26]] },
  dorf: { sky: ['#D5ECFF', '#FFF7DD'], ground: '#9ADCA2', props: [['🏡', 14, 44, 70], ['🌻', 84, 56, 40], ['🐓', 58, 78, 32], ['🏠', 76, 38, 56]] },
  markt: { sky: ['#FFE9C9', '#FFF7E6'], ground: '#E2C9A0', props: [['🍎', 14, 60, 36], ['🧺', 80, 62, 40], ['🍋', 48, 76, 28], ['🎪', 60, 30, 70]] },
  buehne: { sky: ['#3A2F86', '#6C5CE7'], ground: '#2A2457', props: [['🎤', 14, 56, 44], ['🎹', 84, 54, 50], ['🎭', 50, 14, 40], ['✨', 30, 24, 28], ['✨', 70, 22, 28]] }
};
const scBG = id => { const b = SC_BG[id] || SC_BG.strand; return `<div class="sc-bg" style="background:${b.sky[0]}"><div class="sc-ground" style="background:${b.ground}"></div>${b.props.map(p => `<span class="sc-prop" style="left:${p[1]}%;top:${p[2]}%;font-size:${p[3]}px">${p[0]}</span>`).join('')}</div>`; };
const epUnlocked = ep => (S.stats.decks || 0) >= ep.need;
const epList = () => (typeof STORY_EPS !== 'undefined' ? STORY_EPS : []);
/* Heißt die Begleiterin jetzt wie das Kind, entfällt die Anrede „{name}“ (sonst würde sich Fino selbst ansprechen). */
const nameIn = t => esc(String(t).replace(/,? ?\{name\}/g, (S.name && FN() === S.name) ? '' : (m => (S.name ? m.replace('{name}', S.name) : m.replace('{name}', 'du')))).replace(/Fino/g, FN()));
const epLeft = ep => Math.max(0, ep.need - (S.stats.decks || 0));
const grp = n => n + ' Gruppe' + (n === 1 ? '' : 'n');
VIEWS.story = () => {
  const E = epList(), nx = E.find(ep => !epUnlocked(ep)), un = E.filter(epUnlocked).length;
  return topBar(ico('story', 26) + ' Story') + `
  <div class="card insnx"><b>Die Zahleninsel und die verschwundenen Töne</b><span class="small mute">${nx ? `Noch ${grp(epLeft(nx))} bis zur nächsten Episode.` : 'Alle Episoden sind freigeschaltet.'} ${un} von ${E.length} Episoden.</span></div>
  <div class="eplist">${E.map((ep, i) => { const u = epUnlocked(ep), dn = S.story.done[ep.id], rd = S.story.read[ep.id] || 0;
    return `<button class="epc ${u ? '' : 'lk'} ${dn ? 'dn' : ''}" ${u ? `data-act="storyOpen" data-arg="${ep.id}"` : ''}>${u ? `<span class="epn">${ep.icon}</span>` : `<span class="epn rh-story-preview">${ep.icon}<i class="rh-lock" aria-label="Gesperrt">${ico('lock', 13)}</i></span>`}<span class="epb"><b>${i + 1}. ${u ? nameIn(ep.title) : 'Noch ein Geheimnis'}</b><span class="small mute">${u ? nameIn(ep.summary) : `Noch ${grp(epLeft(ep))} beenden`}</span></span><span class="ept">${dn ? '✔ gelesen' : u ? (rd ? 'Weiterlesen' : 'Lesen') : ''}</span></button>`; }).join('')}</div>`;
};
const SC = () => UI.sc;
function scFinish() {                              // Lesen bringt keine Münzen, Sterne oder Gegenstände
  const ep = epList().find(e => e.id === SC().ep); if (!ep) return;
  if (!S.story.done[ep.id]) S.story.done[ep.id] = Date.now();
  S.story.read[ep.id] = ep.scenes.length; checkTrophies(); save();
  UI.sc.fin = true; render();
}
VIEWS.storyread = () => {
  const s = SC(), ep = epList().find(e => e.id === s.ep); if (!ep) return VIEWS.story();
  if (s.fin) {
    const idx = epList().indexOf(ep), nx = epList().find(e => !epUnlocked(e));
    return `<div class="top has-home"><button class="btn sec back" data-act="story" aria-label="Zurück zu den Episoden">${ico('back', 20)}<span>Geschichte</span></button><h2>${ep.icon} ${nameIn(ep.title)}</h2><button class="btn sec dz-home" data-act="home" aria-label="Zur Startseite" title="Zur Startseite">${dzIc('home', 22)}</button></div>
    <div class="card result"><h3>Episode ${idx + 1} gelesen</h3><p class="mute">${nx ? `Noch ${grp(epLeft(nx))} bis zur nächsten Episode.` : 'Das war die letzte Episode.'}</p>
    <div class="row wrap" style="justify-content:center"><button class="btn big" data-act="story">Alle Episoden</button></div></div>`;
  }
  const sc = ep.scenes[s.i], speakerNpc = sc.who === 'npc', last = s.i >= ep.scenes.length - 1;
  const fm = sc.who === 'fino' ? (sc.mood || 'happy') : 'happy', dm = sc.who === 'du' ? (sc.mood || 'happy') : 'happy';
  const duHTML = useMe() ? avatarHTML({ me: true }, 120, dm) : `<div class="avwrap" style="--s:120px"><div class="avatar">${typeof meSVG === 'function' ? meSVG({}, dm) : '🧒'}</div></div>`;
  const who = sc.who === 'fino' ? FN() : sc.who === 'du' ? ((S.name && S.name !== FN()) ? S.name : 'Du') : sc.who === 'npc' ? sc.name : '';
  let body = '';
  if (s.phase === 'say') body = `<p class="sc-t">${nameIn(sc.say)}</p>`;
  else if (s.phase === 'choice') body = `<p class="sc-t">${nameIn(sc.say)}</p><div class="sc-opts">${sc.choice.opts.map((o, k) => `<button class="btn sec" data-act="storyPick" data-arg="${k}">${nameIn(o)}</button>`).join('')}</div>`;
  else if (s.phase === 'then') body = `<p class="sc-t">${nameIn(sc.choice.then[s.pick])}</p>`;
  else if (s.phase === 'puzzle') body = `<p class="sc-t">${nameIn(sc.say)}</p><div class="sc-puz"><b>${nameIn(sc.puzzle.q)}</b><div class="sc-opts">${sc.puzzle.opts.map((o, k) => `<button class="btn sec ${s.bad.includes(k) ? 'bad' : ''}" data-act="storyAns" data-arg="${k}" ${s.bad.includes(k) ? 'disabled' : ''}>${nameIn(o)}</button>`).join('')}</div>${s.bad.length ? `<p class="small" style="color:var(--bad);font-weight:800">${nameIn(sc.puzzle.no)}</p>` : ''}${sc.puzzle.hint && s.bad.length ? `<p class="small mute">💡 ${nameIn(sc.puzzle.hint)}</p>` : ''}</div>`;
  else if (s.phase === 'ok') body = `<p class="sc-t">${nameIn(sc.say)}</p><p class="sc-t" style="color:var(--ok)">✔ ${nameIn(sc.puzzle.ok)}</p>`;
  const needBtn = !['choice', 'puzzle'].includes(s.phase);
  return `<div class="top has-home"><button class="btn sec back" data-act="story" aria-label="Pause: zurück zu den Episoden">${ico('back', 20)}<span>Pause</span></button><h2>${ep.icon} ${nameIn(ep.title)}</h2><button class="btn sec dz-home" data-act="home" aria-label="Zur Startseite" title="Zur Startseite">${dzIc('home', 22)}</button><span class="chip">${s.i + 1} / ${ep.scenes.length}</span></div>
  <div class="sc-stage">${scBG(sc.bg)}
    <div class="sc-cast">
      <div class="sc-c fino ${sc.who === 'fino' ? 'on' : ''}">${mascotSVG({ skin: S.eq.skin, hat: S.eq.hat, extra: S.eq.extra, mood: fm })}</div>
      ${speakerNpc ? `<div class="sc-c npc on"><span class="sc-npc">${sc.npc}</span></div>` : ''}
      <div class="sc-c du ${sc.who === 'du' ? 'on' : ''}">${duHTML}</div>
    </div></div>
  <div class="card sc-box">${who ? `<div class="sc-who">${esc(who)}</div>` : ''}${body}
    <div class="sc-nav"><div class="dots" style="max-width:240px">${ep.scenes.map((_, k) => `<i class="${k < s.i ? 'done' : k === s.i ? 'cur' : ''}"></i>`).join('')}</div>${needBtn ? `<button class="btn big" data-act="storyNext">${last && s.phase === 'say' ? 'Ende 🏁' : 'Weiter ▶'}</button>` : ''}</div></div>`;
};
function scEnter(i) {
  const ep = epList().find(e => e.id === SC().ep), sc = ep.scenes[i];
  UI.sc.i = i; UI.sc.bad = []; UI.sc.pick = null;
  UI.sc.phase = sc.choice ? 'choice' : sc.puzzle ? 'puzzle' : 'say';
  S.story.read[ep.id] = Math.max(S.story.read[ep.id] || 0, i); save(); render();
}
registerFeature({
  id: 'story', title: 'Story', icon: 'story', tint: 'lav', group: 'world', order: 50, view: 'story',
  sub: () => { const nx = epList().find(ep => !epUnlocked(ep)); return nx ? `Noch ${grp(epLeft(nx))} bis zur nächsten Episode` : `${epList().length} von ${epList().length} Episoden`; },
  badge: () => epList().some(ep => epUnlocked(ep) && !S.story.done[ep.id] && !(S.story.read[ep.id] > 0)) ? 'neu' : '',
  views: {},
  acts: {
    storyOpen: id => { const ep = epList().find(e => e.id === id); if (!ep || !epUnlocked(ep)) return; const i = S.story.done[id] ? 0 : Math.min(S.story.read[id] || 0, ep.scenes.length - 1); UI.sc = { ep: id }; view = 'storyread'; scEnter(i); },
    storyNext: () => {
      const s = SC(), ep = epList().find(e => e.id === s.ep), sc = ep.scenes[s.i]; sfx('tap');
      if (s.phase === 'ok' || s.phase === 'then' || s.phase === 'say') { if (s.i >= ep.scenes.length - 1) return scFinish(); scEnter(s.i + 1); }
    },
    storyPick: k => { const s = SC(); s.pick = +k; s.phase = 'then'; S.story.choices[s.ep + '_' + s.i] = +k; save(); sfx('pop'); render(); },
    storyAns: k => { const s = SC(), ep = epList().find(e => e.id === s.ep), sc = ep.scenes[s.i]; if (+k === sc.puzzle.c) { s.phase = 'ok'; sfx('ok'); } else { s.bad.push(+k); sfx('tap'); } render(); }
  }
});
