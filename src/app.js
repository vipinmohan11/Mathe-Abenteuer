/* =====================================================================
   APP: screens, practice engine, shop, album, PIN, events
   (state & rules live in store.js, questions in gen.js)
   ===================================================================== */

/* ---------- toasts / confetti / modal ---------- */
function toast(icon, text) {
  let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<span class="ic">${icon}</span><span>${text}</span>`;
  box.appendChild(t); while (box.children.length > 3) box.firstChild.remove(); setTimeout(() => { t.remove(); }, 3600);
}
function confetti(n = 80) {
  const c = document.createElement('div'); c.className = 'confetti'; const cols = ['#ff5d73', '#ffb703', '#7ed957', '#2d9cdb', '#8c7bff', '#ff8fd0'];
  for (let i = 0; i < n; i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + '%'; p.style.background = rnd(cols); p.style.animationDuration = (2 + Math.random() * 2.2) + 's'; p.style.animationDelay = (Math.random() * .6) + 's'; p.style.transform = `rotate(${Math.random() * 360}deg)`; c.appendChild(p); }
  document.body.appendChild(c); setTimeout(() => c.remove(), 5200);
}
function coinPop(txt) {
  const el = document.createElement('div'); el.className = 'coinpop'; el.textContent = txt;
  const r = ($('.qcard') || document.body).getBoundingClientRect();
  el.style.left = (r.left + r.width / 2 - 30) + 'px'; el.style.top = (r.top + 40) + 'px';
  document.body.appendChild(el); setTimeout(() => el.remove(), 1000);
}
function modal(title, text, yesLabel, yesAct, yesArg, noLabel, noAct) {
  closeModal();
  const m = document.createElement('div'); m.className = 'modal'; m.id = 'modal';
  m.innerHTML = `<div class="card"><h2>${title}</h2><p>${text}</p><div class="row wrap" style="justify-content:center;margin-top:14px">
    <button class="btn sec" data-act="${noAct || 'closeModal'}">${noLabel || 'Abbrechen'}</button>
    ${yesLabel ? `<button class="btn" data-act="${yesAct}" data-arg="${esc(yesArg == null ? '' : yesArg)}">${yesLabel}</button>` : ''}</div></div>`;
  document.body.appendChild(m);
}
function closeModal() { const m = $('#modal'); if (m) m.remove(); }

/* ---------- avatar ---------- */
const eqAvatar = () => ({ skin: S.eq.skin, hat: S.eq.hat, extra: S.eq.extra, bg: S.eq.bg, frame: S.eq.frame });
function avatarHTML(o, size, mood) {
  mood = mood || 'happy';
  return `<div class="avwrap${o.frame ? ' fr-' + o.frame : ''} m-${mood}" style="--s:${size}px"><div class="avatar">${mascotSVG({ skin: o.skin, hat: o.hat, extra: o.extra, bg: o.bg, mood })}</div></div>`;
}

/* ---------- Fino speech ---------- */
const SAY = {
  ok1: ['Super!', 'Genau richtig!', 'Toll gemacht!', 'Das sitzt!', 'Spitze!', 'Richtig! Du rechnest wie ein Profi.'],
  ok2: ['Geschafft! Beim zweiten Mal richtig.', 'Gut, dass du drangeblieben bist!', 'Stark! Dranbleiben lohnt sich.'],
  w1: ['Fast! Schau dir den Tipp an.', 'Hm, noch nicht ganz. Versuch es noch mal!', 'Kein Problem – mit dem Tipp schaffst du das.'],
  w2: ['Nicht schlimm! Schau dir die Lösung an. Die Aufgabe liegt jetzt im Fehler-Heft.', 'Fehler helfen beim Lernen. Wir üben das später noch mal.'],
  ask: ['Du schaffst das!', 'Lass dir Zeit.', 'Denk an die kleine Aufgabe.', 'Ich glaube an dich!', 'Rechne in Ruhe.'],
  r3: ['Wahnsinn! Das war fast perfekt!', 'Du bist ein Rechenstar!'],
  r2: ['Sehr gut gemacht!', 'Das war richtig stark!'],
  r1: ['Gut gemacht! Beim Fehler-Heft kannst du noch Punkte retten.', 'Weiter so!'],
  r0: ['Üben macht den Meister. Schau dir die Fehler an – dann klappt es beim nächsten Mal!', 'Das war eine harte Stufe. Ich bin trotzdem stolz auf dich!']
};

/* =====================================================================
   VIEW STATE
   ===================================================================== */
let view = 'home', R = null, T = null, lastView = '', PIN = null;
const UI = { mod: null, key: null, shopTab: 'theme', scope: 'all', say: '', ans: {}, reveal: null, review: null, reviewBack: 'topic', pinUntil: 0, pending: null };

function go(v, extra) { Object.assign(UI, extra || {}); view = v; render(); }
function render() {
  document.body.dataset.theme = S.eq.theme;
  const f = VIEWS[view] || VIEWS.home;
  $('#app').innerHTML = f();
  if (lastView !== view) { window.scrollTo(0, 0); lastView = view; }
}

/* =====================================================================
   VIEWS
   ===================================================================== */
const chip = (ic, v, t) => `<span class="chip" title="${t || ''}">${ic} <b>${v}</b></span>`;
const statChips = () => `<div class="stats">${chip('🪙', S.coins, 'Münzen')}${chip('⭐', S.stars, 'Sterne')}${chip('🔥', S.flames, 'Flammen')}</div>`;
const topBar = (title, back = 'home', extra = '') => `<div class="top"><button class="btn sec back" data-act="${back}" aria-label="Zurück">←</button><h2>${title}</h2>${extra}${statChips()}</div>`;
const greeting = () => { const h = new Date().getHours(); return h < 11 ? 'Guten Morgen' : h < 17 ? 'Hallo' : 'Guten Abend'; };
const pctCls = p => p === null ? 'n' : p >= 80 ? 'g' : p >= 55 ? 'y' : 'r';

function modProgress(m) {
  let pts = 0, tried = 0, done = 0;
  m.topics.forEach(t => { const d = S.decks[tk(m.id, t.id)]; if (d) { pts += deckPts(d); if (d.i > 0) tried++; if (d.i >= DECK_N) done++; } });
  return { pts, max: m.topics.length * PTS_MAX, pct: Math.round(pts / (m.topics.length * PTS_MAX) * 100), tried, done, total: m.topics.length };
}
const usedMin = () => Math.floor((S.daily.d === ymd() ? S.daily.sec : 0) / 60);

const VIEWS = {};

VIEWS.home = () => {
  const L = levelInfo(), n = S.daily.d === ymd() ? S.daily.n : 0, goal = S.cfg.goal, gp = Math.min(100, Math.round(n / goal * 100)), sn = streakNow();
  let say = UI.say;
  if (!say) {
    if (S.chests > 0) say = `Du hast ${S.chests} Schatztruhe${S.chests > 1 ? 'n' : ''}! Öffne sie im Sammelalbum.`;
    else if (S.mistakes.length >= 5) say = `Im Fehler-Heft liegen ${S.mistakes.length} Aufgaben zum Üben. Wollen wir sie zusammen knacken?`;
    else if (n >= goal) say = 'Tagesziel geschafft! Alles, was jetzt kommt, ist Bonus.';
    else if (sn >= 2) say = `Schon ${sn} Tage in Folge das Tagesziel geschafft – wow!`;
    else say = rnd(['Wähle ein Heft – ich rechne mit dir!', 'Heute schaffen wir bestimmt ein paar Sterne!', 'Los geht’s! Welche Aufgaben magst du heute?', 'Kleine Schritte, große Erfolge!']);
    UI.say = say;
  }
  const dueBackup = S.stats.q >= 50 && Date.now() - (S.lastBackup || 0) > 14 * 864e5;
  return `
  <div class="card hero">
    ${avatarHTML(eqAvatar(), 150, 'happy')}
    <div class="info">
      <div class="hello">${greeting()}${S.name ? ', ' + esc(S.name) : ''}!</div>
      <div style="margin:8px 0">${statChips()}${sn ? `<span class="chip" title="Tage in Folge">📅 <b>${sn}</b> Tage Serie</span>` : ''}</div>
      <div class="small mute" style="margin-bottom:4px">${L.badge} Stufe ${L.n} · ${L.title} <span style="float:right">noch ${L.need} 🪙</span></div>
      <div class="bar"><i style="width:${L.pct}%"></i></div>
      <div class="bubble">💬 ${esc(say)}</div>
    </div>
    <div class="center"><div class="ring" style="--p:${gp}"><span>${Math.min(n, goal)}/${goal}</span></div><div class="small mute">Tagesziel</div>${S.cfg.limitMin ? `<div class="small mute">⏳ ${usedMin()}/${S.cfg.limitMin} Min</div>` : ''}</div>
  </div>
  <div class="mods">${MODULES.map(m => { const p = modProgress(m); return `
    <button class="mod" data-act="mod" data-arg="${m.id}">
      <span class="ic">${m.icon}</span>
      <span style="flex:1"><h3>${m.id} · ${m.title}</h3><span class="mute small">${m.sub}</span>
      <div class="bar"><i style="width:${p.pct}%"></i></div><span class="small mute">${p.done} von ${p.total} Gruppen geschafft · ${p.pts}/${p.max} 🪙</span></span>
    </button>`; }).join('')}</div>
  <div class="tiles">
    <button class="tile" data-act="testSetup"><span class="ic">⏱️</span>Mini-Test<span class="sub">12 Minuten</span></button>
    <button class="tile" data-act="mistakes"><span class="ic">📒</span>Fehler-Heft<span class="sub">Aufgaben nochmal üben</span>${S.mistakes.length ? `<span class="badge">${S.mistakes.length}</span>` : ''}</button>
    <button class="tile" data-act="album"><span class="ic">📚</span>Sammelalbum<span class="sub">Fakten, Witze, Rätsel</span>${S.chests ? `<span class="badge">📦 ${S.chests}</span>` : ''}</button>
    <button class="tile" data-act="shop"><span class="ic">🛍️</span>Shop<span class="sub">Münzen, Sterne, Flammen</span></button>
    <button class="tile" data-act="trophies"><span class="ic">🏆</span>Pokale<span class="sub">${Object.keys(S.trophies).length} gesammelt</span></button>
    <button class="tile" data-act="parent"><span class="ic">👨‍👩‍👧</span>Eltern<span class="sub">mit PIN</span></button>
  </div>
  ${dueBackup ? '<p class="small mute center">💾 Tipp für Eltern: Im Eltern-Bereich gibt es „Sichern“ – so geht nie etwas verloren.</p>' : ''}
  ${persistOK ? '' : '<p class="small center" style="color:var(--bad)">Achtung: In diesem Browser kann gerade nichts gespeichert werden (privater Modus?). Der Fortschritt bleibt nur, solange die Seite offen ist.</p>'}`;
};

VIEWS.module = () => {
  const m = MODULES.find(x => x.id === UI.mod), p = modProgress(m);
  return `${topBar(`${m.icon} ${m.id} · ${m.title}`)}
  <p class="mute small" style="margin:0 4px 10px">Jede Gruppe hat <b>30 feste Aufgaben</b> in 3 Stufen. Du kannst jederzeit aufhören und später genau dort weitermachen. · Punkte in ${m.id}: <b>${p.pts}/${p.max}</b></p>
  <div class="grid">${m.topics.map(t => {
    const key = tk(m.id, t.id), d = S.decks[key], i = d ? d.i : 0, md = medalOf(key);
    return `<button class="topic" data-act="topic" data-arg="${t.id}">
      <span class="ic">${t.icon}</span><h3>${t.t}</h3><span class="small mute">${t.d}</span>
      <div class="bar" style="height:10px"><i style="width:${Math.round(i / DECK_N * 100)}%"></i></div>
      <span class="small mute">${i >= DECK_N ? '✔ alle geschafft' : i ? i + ' von ' + DECK_N + ' Aufgaben' : 'noch nicht angefangen'} · ${deckPts(d)}/${PTS_MAX} 🪙</span>
      ${md ? `<span class="medal" title="${MEDAL_NAMES[md]}">${MEDALS[md]}</span>` : ''}</button>`; }).join('')}</div>`;
};

/* ----- group screen ----- */
const resDot = r => `<i class="${r === 'first' ? 'ok' : r === 'second' ? 'half' : r === 'fail' ? 'bad' : ''}"></i>`;
VIEWS.topic = () => {
  const key = UI.key, f = findTopic(key), d = S.decks[key], i = d ? d.i : 0, t = topicRec(key), md = medalOf(key);
  const pts = deckPts(d), wrong = deckWrong(d).length, done = i >= DECK_N;
  const earned = t.cb.reduce((a, b) => a + b, 0), starsE = t.sb.reduce((a, b) => a + b, 0);
  const blocks = [0, 1, 2].map(b => {
    const bd = d && blockDone(d, b), bp = blockPts(d, b), st = bd ? blockStarsOf(bp) : 0, cnt = d ? d.res.slice(...blockRange(b)).filter(r => r !== null).length : 0;
    return `<div class="blk ${bd ? 'done' : ''}"><b>Stufe ${b + 1}</b><div class="stars sm">${[1, 2, 3].map(k => `<span class="${k <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
      <div class="dotsm">${(d ? d.res.slice(...blockRange(b)) : Array(BLOCK).fill(null)).map(resDot).join('')}</div>
      <span class="small mute">${cnt}/${BLOCK} · ${bp}/${PTS_BLOCK} Punkte</span></div>`;
  }).join('');
  return `${topBar(`${f.topic.icon} ${f.topic.t}`, 'backMod')}
  <div class="card">
    <p style="margin:0 0 8px"><b>${f.topic.d}</b></p>
    <div class="row wrap"><div style="flex:1;min-width:220px">
      <div class="bar"><i style="width:${Math.round(i / DECK_N * 100)}%"></i></div>
      <div class="small mute" style="margin-top:4px">${i} von ${DECK_N} Aufgaben · Punkte in dieser Gruppe: <b>${pts}/${PTS_MAX}</b> ${md ? '· Medaille: ' + MEDALS[md] + ' ' + MEDAL_NAMES[md] : ''}</div></div>
    </div>
    <div class="blocks">${blocks}</div>
    <div class="row wrap" style="margin-top:14px;justify-content:center">
      ${done ? '<div class="fb ok sp" style="text-align:center">🎉 Alle 30 Aufgaben geschafft!</div>' : `<button class="btn big" data-act="practice">${i ? '▶ Weiter üben (Aufgabe ' + (i + 1) + ')' : '▶ Los geht’s'}</button>`}
      ${wrong ? `<button class="btn sec big" data-act="reviewDeck">📝 Fehler ansehen (${wrong})</button>` : ''}
    </div>
    <p class="small mute" style="margin:12px 0 0">In dieser Gruppe gibt es höchstens <b>${PTS_MAX} 🪙</b> und <b>${STARS_MAX} ⭐</b>. ${earned || starsE ? `Bisher verdient: ${earned}/${PTS_MAX} 🪙 und ${starsE}/${STARS_MAX} ⭐.` : ''}</p>
  </div>
  <div class="center" style="margin-top:14px"><button class="btn ghost sm" data-act="resetTopic">🔄 Gruppe zurücksetzen (Eltern-PIN)</button></div>`;
};

/* ----- question rendering ----- */
function fieldHTML(c, i) {
  const f = c.q.fields[i], cls = ['fld'];
  if (f.digit) cls.push('dg');
  const foc = c.focus === i && c.state === 'ask' && !c.locked[i] && !c.review;
  if (foc) cls.push('foc'); if (c.marks[i]) cls.push(c.marks[i]);
  return `<span class="${cls.join(' ')}" data-act="foc" data-arg="${i}">${esc(c.vals[i])}${foc ? '<i class="cur"></i>' : ''}</span>`;
}
function qInner(c) {
  const q = c.q; let h = '<div class="qbody">';
  if (q.fields) h += q.html.replace(/\[\[(\d+)\]\]/g, (m, i) => fieldHTML(c, +i));
  else h += q.prompt + '<div class="choices">' + q.choices.map((t, i) => {
    let cl = 'ch'; if (c.badCh.includes(i)) cl += ' bad'; else if (c.sel === i && c.state === 'ask') cl += ' sel';
    if (c.state !== 'ask' && c.sel === i && !c.review) cl += ' ok';
    if (c.review) { if (i === q.correct) cl += ' ok'; else if (c.sel === i) cl += ' bad'; }
    return `<button class="ch ${cl}" data-act="pick" data-arg="${i}">${t}</button>`;
  }).join('') + '</div>';
  return h + '</div>';
}
const qBody = c => `<div class="qtitle">${c.q.title}</div>` + qInner(c);
function keypad(c) {
  const f = c.q.fields[c.focus], comma = f && /,/.test(f.a) && !f.digit;
  const k = (v, l, cls) => `<button class="key ${cls || ''}" data-act="key" data-arg="${v}"${(v === ',' && !comma) ? ' disabled' : ''}>${l || v}</button>`;
  return `<div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => k(n)).join('')}${k(',', ',', 'fn')}${k(0)}${k('back', '⌫', 'fn')}</div>`;
}

/* ----- review: eigene Antwort + richtige Lösung ----- */
function reviewCtx(q, vals, sel) {
  const n = q.fields ? q.fields.length : 0;
  return { q, vals, locked: [], marks: q.fields ? q.fields.map((f, i) => vals ? (fieldOK(f, vals[i]) ? 'ok' : (normIn(vals[i]) ? 'bad' : null)) : 'show') : [], focus: -1, badCh: [], sel: sel == null ? null : sel, state: 'review', review: true };
}
function reviewItem(q, ans, head, cls) {
  let h = `<div class="li ${cls || ''}"><span class="n">${head.n}</span><div style="flex:1;min-width:0"><div class="t">${head.t}${q.title}</div>`;
  if (q.fields) {
    if (ans && ans.vals) h += `<div class="rv"><div class="small mute">Deine Antwort</div><div class="mini">${qInner(reviewCtx(q, ans.vals))}</div></div>`;
    h += `<div class="rv"><div class="small mute">Richtig</div><div class="mini">${qInner(Object.assign(reviewCtx(q, q.fields.map(f => f.a)), { marks: q.fields.map(() => 'show') }))}</div></div>`;
  } else {
    h += `<div class="rv"><div class="small mute">${ans && ans.sel != null ? 'Rot = deine Antwort, grün = richtig' : 'Richtig ist grün'}</div><div class="mini">${qInner(reviewCtx(q, null, ans ? ans.sel : null))}</div></div>`;
  }
  return h + `<div class="e" style="margin-top:6px">So geht’s: ${q.explain}</div></div></div>`;
}
VIEWS.review = () => {
  const { key, b } = UI.review, d = S.decks[key], f = findTopic(key), idx = deckWrong(d, b);
  const title = b == null ? 'Alle Fehler dieser Gruppe' : `Fehler in Stufe ${b + 1}`;
  return `${topBar('📝 ' + title, UI.reviewBack)}
  <p class="mute small" style="margin:0 4px 10px">${f.topic.icon} ${f.topic.t} · Diese Aufgaben waren nicht gleich beim 1. Versuch richtig. Sie liegen auch im Fehler-Heft zum Üben.</p>
  ${idx.length ? `<div class="list">${idx.map(i => reviewItem(d.qs[i], d.ans[i], { n: i + 1, t: '' }, d.res[i] === 'fail' ? 'bad' : '')).join('')}</div>` : '<div class="card result"><h2>Keine Fehler! 🎉</h2></div>'}`;
};

/* ----- play ----- */
VIEWS.play = () => {
  const c = R.ctx, q = c.q, deck = R.kind === 'deck';
  let dots, label, pchip;
  if (deck) {
    const d = S.decks[R.key], b = Math.floor(R.idx / BLOCK), f = findTopic(R.key);
    dots = d.res.slice(...blockRange(b)).map((r, k) => `<i class="${b * BLOCK + k === R.idx ? 'cur' : r === 'first' ? 'ok' : r === 'second' ? 'half' : r === 'fail' ? 'bad' : ''}"></i>`).join('');
    label = `${f.topic.icon} ${f.topic.t} · Aufgabe ${R.idx + 1} von ${DECK_N} · Stufe ${b + 1}`; pchip = chip('🪙', `${deckPts(d)}/${PTS_MAX}`, 'Punkte in dieser Gruppe');
  } else {
    dots = R.items.map((x, k) => `<i class="${k === R.idx ? 'cur' : k < R.idx ? 'done' : ''}"></i>`).join('');
    label = `📒 Fehler-Heft · Aufgabe ${R.idx + 1} von ${R.n}`; pchip = chip('✔', R.first, 'gleich richtig');
  }
  let mood = 'happy', say = c.say || rnd(SAY.ask), fb = '';
  if (c.state === 'ask') {
    if (c.tries > 0) mood = 'think';
    if (c.showHint) fb = `<div class="fb hint">💡 ${q.hint}</div>`;
  } else if (c.state === 'right') {
    mood = c.res === 'first' ? 'cheer' : 'happy';
    const pt = c.res === 'first' ? 2 : 1;
    let pts = '';
    if (deck) pts = R.lastDelta ? ` <b>+${R.lastDelta} 🪙</b>` : ` <span class="small">(${pt} Punkt${pt > 1 ? 'e' : ''} – Münzen-Bestwert dieser Stufe schon erreicht)</span>`;
    else pts = c.res === 'first' ? ' Die Aufgabe verschwindet aus dem Fehler-Heft.' : ' Noch einmal gleich richtig – dann verschwindet sie.';
    fb = `<div class="fb ok">✔ Richtig!${pts}<span class="ex">${q.explain}</span></div>`;
  } else {
    mood = 'sad'; fb = `<div class="fb bad">So geht’s:<span class="ex">${q.explain}</span></div>`;
  }
  c.say = say;
  const last = deck ? false : R.idx === R.items.length - 1;
  const act = c.state === 'ask'
    ? (q.fields ? `<button class="btn big" data-act="check">Prüfen ✔</button>` : '')
    : `<button class="btn big" data-act="next">${R.blockPending ? 'Stufe fertig 🏁' : last ? 'Fertig 🏁' : 'Weiter →'}</button>`;
  const hintBtn = c.state === 'ask' && !c.showHint ? `<button class="btn sec sm" data-act="hint">💡 Tipp (−1 Punkt)</button>` : '';
  return `<div class="top"><button class="btn sec back" data-act="quit" aria-label="Pause">← Pause</button><div class="dots">${dots}</div>${pchip}</div>
  <div class="small mute" style="margin:-4px 0 8px 4px">${label}</div>
  <div class="play">
    <div class="card qcard">${qBody(c)}</div>
    <div class="side">
      <div class="coach">${avatarHTML(eqAvatar(), 92, mood)}<div class="bubble">${esc(say)}</div></div>
      ${fb}${c.state === 'ask' && q.fields ? keypad(c) : ''}${hintBtn}${act}
    </div>
  </div>`;
};

/* ----- engine ----- */
function startDeck(key) {
  if (limitHit()) return go('limit');
  const d = getDeck(key);
  if (d.i >= DECK_N) { toast('✔', 'Diese Gruppe ist komplett geschafft.'); return go('topic', { key }); }
  R = { kind: 'deck', key, mod: key.split('.')[0], idx: d.i, ctx: newCtx(d.qs[d.i]), coins: 0, bc: {}, lastDelta: 0, blockPending: false };
  go('play', { key });
}
function startMistakes() {
  if (limitHit()) return go('limit');
  const items = shuffle(S.mistakes).slice(0, 10).map(m => ({ tid: m.tid, q: m.q }));
  if (!items.length) return;
  R = { kind: 'mistakes', items, idx: 0, ctx: newCtx(items[0].q), first: 0, n: items.length, fixed: 0 };
  go('play');
}
function settle(res) {
  const c = R.ctx; c.res = res; const first = res === 'first'; R.lastDelta = 0;
  if (R.kind === 'deck') {
    const key = R.key, d = S.decks[key], i = R.idx, b = Math.floor(i / BLOCK);
    d.res[i] = res; d.ans[i] = first ? null : c.firstAns; d.i = Math.max(d.i, i + 1);
    noteAnswer(key, first);
    if (!first) addMistake(key, c.q, c.firstAns);
    R.lastDelta = creditDeckAnswer(key, d, i); R.coins += R.lastDelta; R.bc[b] = (R.bc[b] || 0) + R.lastDelta;
    if (R.lastDelta) coinPop('+' + R.lastDelta + ' 🪙');
    if (blockDone(d, b)) { R.blockInfo = completeBlock(key, d, b); R.blockInfo.coins = R.bc[b] || 0; R.blockPending = true; }
  } else {
    const tid = R.items[R.idx].tid; noteAnswer(tid, first);
    if (first) { R.first++; removeMistake(tid, c.q); R.fixed++; } else addMistake(tid, c.q, c.firstAns);
  }
  dailyCheck(); checkTrophies(); save();
}
function check() {
  if (view !== 'play') return;
  const c = R.ctx, q = c.q;
  if (c.state !== 'ask' || !q.fields) return;
  const empty = c.vals.findIndex((v, i) => !c.locked[i] && normIn(v) === '');
  if (empty >= 0) { c.focus = empty; render(); return; }
  const ok = q.fields.map((f, i) => fieldOK(f, c.vals[i]));
  c.tries++;
  if (c.tries === 1 && !ok.every(Boolean)) c.firstAns = { vals: c.vals.slice() };
  if (ok.every(Boolean)) { ok.forEach((_, i) => c.marks[i] = 'ok'); c.state = 'right'; const f1 = c.tries === 1 && !c.hinted; c.say = rnd(f1 ? SAY.ok1 : SAY.ok2); settle(f1 ? 'first' : 'second'); }
  else if (c.tries === 1) { ok.forEach((o, i) => { c.marks[i] = o ? 'ok' : 'bad'; c.locked[i] = o; }); c.showHint = true; c.say = rnd(SAY.w1); c.focus = ok.findIndex(o => !o); }
  else { q.fields.forEach((f, i) => { if (!ok[i]) c.vals[i] = f.a; c.marks[i] = 'show'; }); c.state = 'revealed'; c.say = rnd(SAY.w2); settle('fail'); }
  render();
}
function pickChoice(i) {
  if (view === 'test') { const c = T.qs[T.i].c; c.sel = i; render(); return; }
  if (view !== 'play') return;
  const c = R.ctx, q = c.q;
  if (c.state !== 'ask' || q.fields || c.badCh.includes(i)) return;
  c.tries++; c.sel = i;
  if (c.tries === 1 && i !== q.correct) c.firstAns = { sel: i };
  if (i === q.correct) { c.state = 'right'; const f1 = c.tries === 1 && !c.hinted; c.say = rnd(f1 ? SAY.ok1 : SAY.ok2); settle(f1 ? 'first' : 'second'); }
  else if (c.tries === 1) { c.badCh.push(i); c.showHint = true; c.say = rnd(SAY.w1); c.sel = null; }
  else { c.badCh.push(i); c.sel = q.correct; c.state = 'revealed'; c.say = rnd(SAY.w2); settle('fail'); }
  render();
}
function next() {
  if (view !== 'play') return;
  if (R.kind === 'deck') {
    if (R.blockPending) { R.blockPending = false; return go('block'); }
    if (limitHit()) return go('limit');
    const d = S.decks[R.key]; R.idx = d.i; R.ctx = newCtx(d.qs[R.idx]); render();
  } else if (R.idx < R.items.length - 1) { R.idx++; R.ctx = newCtx(R.items[R.idx].q); render(); }
  else { checkTrophies(); save(); go('result'); if (R.first >= R.n - 1) confetti(60); }
}

/* ----- Stufe fertig ----- */
VIEWS.block = () => {
  const bi = R.blockInfo, mood = bi.stars >= 2 ? 'cheer' : bi.stars === 1 ? 'happy' : 'sad', d = S.decks[R.key], wrong = deckWrong(d, bi.b).length, f = findTopic(R.key);
  const line = rnd(SAY['r' + bi.stars]);
  return `<div class="card result">
    <div class="small mute">${f.topic.icon} ${f.topic.t}</div>
    <h2>Stufe ${bi.b + 1} geschafft!</h2>
    <div class="stars">${[1, 2, 3].map(i => `<span class="${i <= bi.stars ? 'on' : ''}" style="animation-delay:${i * .25}s">⭐</span>`).join('')}</div>
    <div class="bigav">${avatarHTML(eqAvatar(), 170, mood)}</div>
    <h3>${bi.firsts} von ${BLOCK} gleich richtig · ${bi.pts} von ${PTS_BLOCK} Punkten</h3>
    <p style="font-weight:700">${esc(line)}</p>
    <div class="rewards">${bi.coins ? chip('🪙', '+' + bi.coins) : ''}${bi.dStars ? chip('⭐', '+' + bi.dStars) : ''}${bi.chest ? chip('📦', 'Schatztruhe!') : ''}${!bi.coins && !bi.dStars ? '<span class="small mute">Für diese Stufe gab es schon früher Belohnungen – mehr als der Bestwert wird nicht gezählt.</span>' : ''}</div>
    ${bi.stars < 2 && !bi.chest ? '<p class="small mute">Ab 2 ⭐ (14 Punkte) gibt es eine Schatztruhe.</p>' : ''}
    ${bi.deckDone ? `<div class="fb ok" style="margin:8px 0">🎉 Alle 30 Aufgaben dieser Gruppe sind geschafft! Medaille: ${MEDALS[bi.medal]} ${MEDAL_NAMES[bi.medal]}${bi.medal < 4 ? ' · Diamant gibt es ab 54 von 60 Punkten.' : ''}</div>` : ''}
    <div class="row wrap" style="justify-content:center;margin-top:10px">
      ${wrong ? `<button class="btn sec big" data-act="reviewBlock">📝 Fehler ansehen (${wrong})</button>` : ''}
      ${bi.deckDone ? '' : `<button class="btn big" data-act="blockNext">Weiter ▶</button>`}
      <button class="btn ${bi.deckDone ? '' : 'sec'} big" data-act="toGroup">Zur Gruppe</button>
    </div></div>`;
};

/* ----- Fehler-Heft ----- */
VIEWS.mistakes = () => {
  const list = S.mistakes;
  const intro = `<div class="card" style="margin-bottom:12px"><b>Was ist das Fehler-Heft?</b><p style="margin:6px 0 0">Hier sammeln sich alle Aufgaben, die <b>nicht gleich beim 1. Versuch</b> richtig waren – auch wenn du es danach geschafft hast. Du kannst sie hier üben. Löst du eine Aufgabe gleich beim 1. Versuch, verschwindet sie aus dem Heft. Es gibt dafür keine Münzen, aber du wirst Fehler-Detektiv!</p></div>`;
  if (!list.length) return topBar('📒 Fehler-Heft') + intro + `<div class="card result"><div style="margin:auto;width:170px">${avatarHTML(eqAvatar(), 170, 'cheer')}</div><h2>Noch nichts drin – super!</h2><p>Sobald eine Aufgabe nicht gleich klappt, landet sie hier.</p></div>`;
  return topBar('📒 Fehler-Heft') + intro + `<div class="card"><div class="row wrap"><div style="flex:1"><b>${list.length} Aufgabe${list.length === 1 ? '' : 'n'}</b> zum Üben.</div><button class="btn big" data-act="mistakeRound">Üben (${Math.min(10, list.length)})</button></div></div>
  <div class="list" style="margin-top:14px">${list.slice(0, 40).map(m => { const f = findTopic(m.tid); return reviewItem(m.q, m.ans, { n: f ? f.topic.icon : '?', t: '' }, ''); }).join('')}</div>`;
};
VIEWS.result = () => {
  const mood = R.first >= R.n - 1 ? 'cheer' : R.first >= R.n / 2 ? 'happy' : 'sad';
  return `<div class="card result"><h2>Fehler-Heft geübt</h2><div class="bigav">${avatarHTML(eqAvatar(), 170, mood)}</div>
    <h3>${R.first} von ${R.n} gleich richtig</h3>
    <p>${R.first ? `${R.first} Aufgabe${R.first > 1 ? 'n sind' : ' ist'} aus dem Heft verschwunden.` : 'Alle bleiben im Heft, bis sie beim 1. Versuch klappen.'} ${S.mistakes.length ? `Noch ${S.mistakes.length} im Heft.` : 'Das Heft ist leer – Wahnsinn!'}</p>
    <div class="row wrap" style="justify-content:center">${S.mistakes.length ? '<button class="btn big" data-act="mistakeRound">Weiter üben</button>' : ''}<button class="btn sec big" data-act="home">Fertig</button></div></div>`;
};

/* ----- Mini-Test ----- */
VIEWS.testSetup = () => {
  const opts = [['all', 'Alles gemischt']].concat(MODULES.map(m => [m.id, `${m.icon} ${m.id} ${m.title}`]));
  const best = S.tests.length ? Math.max(...S.tests.map(t => t.score)) : null, rew = !(S.daily.d === ymd() && S.daily.testRewarded);
  return topBar('⏱️ Mini-Test', 'home') + `<div class="card result"><div style="margin:auto;width:160px">${avatarHTML(eqAvatar(), 160, 'think')}</div>
  <h2>${TEST_N} Aufgaben · ${TEST_SECS / 60} Minuten</h2>
  <p>Wie in der Schule: keine Tipps und keine Rückmeldung, bis du fertig bist. Du kannst zwischen den Aufgaben springen. Die Aufgaben sind jedes Mal neu.</p>
  <p class="small mute">${rew ? 'Belohnung (1× pro Tag): ab 7 richtigen Münzen und Sterne, ab 12 eine Schatztruhe.' : 'Heute gab es schon die Test-Belohnung. Üben darfst du trotzdem!'}</p>
  <div class="row wrap" style="justify-content:center;margin:12px 0">${opts.map(o => `<button class="btn ${UI.scope === o[0] ? '' : 'sec'} sm" data-act="scope" data-arg="${o[0]}">${o[1]}</button>`).join('')}</div>
  ${best !== null ? `<p class="small mute">Bestes Ergebnis bisher: ${best} von ${TEST_N}</p>` : ''}
  <button class="btn big" data-act="testStart">Los geht’s! ▶</button></div>`;
};
function startTest() {
  if (limitHit()) return go('limit');
  const mods = UI.scope === 'all' ? MODULES : MODULES.filter(m => m.id === UI.scope);
  const tops = []; mods.forEach(m => m.topics.forEach(t => tops.push(tk(m.id, t.id))));
  const qs = [], seen = new Set(); let pool = [];
  for (let i = 0; i < TEST_N; i++) {
    if (!pool.length) pool = shuffle(tops);
    const key = pool.pop(), d = S.decks[key], lvl = d ? Math.min(3, Math.floor(Math.min(d.i, DECK_N - 1) / BLOCK) + 1) : 1;
    qs.push({ tid: key, lvl, q: makeQ(key, lvl, seen) });
  }
  qs.forEach(x => x.c = newCtx(x.q));
  T = { qs, i: 0, start: Date.now(), dur: TEST_SECS, timer: null, scope: UI.scope };
  T.timer = setInterval(testTick, 1000);
  go('test');
}
const remaining = () => Math.max(0, T.dur - Math.floor((Date.now() - T.start) / 1000));
const fmtT = s => Math.floor(s / 60) + ':' + pad2(s % 60);
function testTick() {
  if (!T || view !== 'test') return;
  const r = remaining(), el = $('#tmr');
  if (el) { el.textContent = fmtT(r); const b = $('#tbar'); if (b) b.style.width = (r / T.dur * 100) + '%'; const w = $('#twrap'); if (w) w.classList.toggle('low', r <= 120); }
  if (r <= 0) finishTest(true);
}
const answered = c => c.q.fields ? c.vals.some(v => normIn(v) !== '') : c.sel !== null;
VIEWS.test = () => {
  const c = T.qs[T.i].c, r = remaining(), last = T.i === T.qs.length - 1;
  return `<div class="top"><button class="btn sec back" data-act="quit" aria-label="Abbrechen">✕</button>
    <div class="timer ${r <= 120 ? 'low' : ''}" id="twrap">⏱️<div class="bar"><i id="tbar" style="width:${r / T.dur * 100}%"></i></div><b id="tmr">${fmtT(r)}</b></div>
    <button class="btn sm" data-act="testAsk">Abgeben</button></div>
  <div class="qnav" style="margin-bottom:12px">${T.qs.map((x, i) => `<button class="${i === T.i ? 'cur' : ''} ${answered(x.c) ? 'has' : ''}" data-act="goQ" data-arg="${i}">${i + 1}</button>`).join('')}</div>
  <div class="play"><div class="card qcard"><div class="small mute" style="margin-bottom:6px">Aufgabe ${T.i + 1} von ${T.qs.length}</div>${qBody(c)}</div>
  <div class="side">${c.q.fields ? keypad(c) : '<div class="fb hint">Tippe die richtige Antwort an. Du kannst sie noch ändern.</div>'}
  <div class="row"><button class="btn sec sp" data-act="prevQ" ${T.i === 0 ? 'disabled' : ''}>← Zurück</button>${last ? `<button class="btn sp" data-act="testAsk">Abgeben ✔</button>` : `<button class="btn sp" data-act="nextQ">Weiter →</button>`}</div></div></div>`;
};
function testAsk() {
  const open = T.qs.filter(x => !answered(x.c)).length;
  modal('Test abgeben?', open ? `Du hast noch <b>${open}</b> Aufgabe${open === 1 ? '' : 'n'} ohne Antwort.` : 'Alle Aufgaben sind beantwortet.', 'Ja, abgeben', 'testFinish', '', 'Weiter rechnen');
}
function finishTest(timeUp) {
  if (!T || T.done) return; T.done = true; clearInterval(T.timer); closeModal();
  let score = 0; const secs = Math.min(T.dur, Math.floor((Date.now() - T.start) / 1000)), left = T.dur - secs;
  T.qs.forEach(x => {
    const c = x.c, ok = isCorrect(c); x.ok = ok; if (ok) score++;
    noteAnswer(x.tid, ok); dailyCheck();
    x.ans = c.q.fields ? { vals: c.vals.slice() } : { sel: c.sel };
    if (!ok) addMistake(x.tid, x.q, x.ans);
  });
  touchDay();
  const rewarded = !S.daily.testRewarded, stars = score >= 13 ? 3 : score >= 10 ? 2 : score >= 7 ? 1 : 0, coins = score >= 13 ? 10 : score >= 10 ? 6 : score >= 7 ? 3 : 0;
  let chest = false;
  if (rewarded) { S.daily.testRewarded = true; giveCoins(coins); giveStars(stars); if (score >= 12) chest = giveChest(); }
  if (score >= 13 && left > 360) S.stats.blitz = 1;
  S.tests.push({ ts: Date.now(), score, total: T.qs.length, secs, scope: T.scope }); if (S.tests.length > 60) S.tests.shift();
  T.res = { score, stars, coins: rewarded ? coins : 0, stars2: rewarded ? stars : 0, secs, timeUp, rewarded, chest };
  checkTrophies(); save(); go('testResult');
  if (stars >= 2) confetti(stars === 3 ? 110 : 60);
}
VIEWS.testResult = () => {
  const r = T.res, mood = r.stars >= 2 ? 'cheer' : r.stars === 1 ? 'happy' : 'sad';
  return `<div class="card result"><div class="stars">${[1, 2, 3].map(i => `<span class="${i <= r.stars ? 'on' : ''}" style="animation-delay:${i * .25}s">⭐</span>`).join('')}</div>
  <div style="margin:6px auto;width:170px">${avatarHTML(eqAvatar(), 170, mood)}</div>
  <h2>${r.score} von ${T.qs.length} richtig</h2>
  <p style="font-weight:700">${r.timeUp ? 'Die Zeit ist um! ' : ''}${esc(rnd(SAY['r' + r.stars]))}</p>
  <div class="rewards">${r.coins ? chip('🪙', '+' + r.coins) : ''}${r.stars2 ? chip('⭐', '+' + r.stars2) : ''}${r.chest ? chip('📦', 'Schatztruhe!') : ''}${chip('⏱️', fmtT(r.secs))}</div>
  ${r.rewarded ? '' : '<p class="small mute">Die Test-Belohnung gibt es nur beim ersten Test eines Tages.</p>'}
  <div class="row wrap" style="justify-content:center"><button class="btn big" data-act="testSetup">Neuer Test</button><button class="btn sec big" data-act="home">Fertig</button></div></div>
  <h3 style="margin:18px 4px 8px">So war dein Test</h3>
  <div class="list">${T.qs.map((x, i) => x.ok
    ? `<div class="li ok"><span class="n">✔</span><div class="t">${i + 1}. ${x.q.title}</div></div>`
    : reviewItem(x.q, x.ans, { n: '✘', t: (i + 1) + '. ' }, 'bad')).join('')}</div>`;
};

/* ----- shop ----- */
function itemPreview(slot, it) {
  const e = S.eq;
  if (slot === 'theme') return `<div class="swatch">${it.c.map(c => `<i style="background:${c}"></i>`).join('')}</div>`;
  if (slot === 'skin') return avatarHTML({ skin: it.id, hat: e.hat, extra: e.extra }, 112);
  if (slot === 'hat') return avatarHTML({ skin: e.skin, hat: it.id }, 112);
  if (slot === 'extra') return avatarHTML({ skin: e.skin, extra: it.id }, 112);
  if (slot === 'bg') return avatarHTML({ skin: e.skin, hat: e.hat, extra: e.extra, bg: it.id }, 112);
  return avatarHTML({ skin: e.skin, hat: e.hat, extra: e.extra, frame: it.id }, 112);
}
VIEWS.shop = () => {
  const slot = UI.shopTab, cat = SHOP[slot], owned = S.owned[slot];
  const tabs = Object.keys(SHOP).map(k => `<button class="${k === slot ? 'on' : ''}" data-act="shopTab" data-arg="${k}">${SHOP[k].icon} ${SHOP[k].label}</button>`).join('');
  const none = cat.none ? `<div class="card item ${S.eq[slot] === null ? 'eq' : ''}"><div class="nonepv">✕</div><div class="nm">Ohne</div><button class="btn sm ${S.eq[slot] === null ? 'sec' : ''}" data-act="equip" data-arg="${slot}|">${S.eq[slot] === null ? 'Aktiv ✔' : 'Auswählen'}</button></div>` : '';
  const items = cat.items.map(it => {
    const has = owned.includes(it.id), on = S.eq[slot] === it.id, W = S[WALLET[it.cur]], can = W >= it.price, cu = CUR[it.cur];
    const btn = has ? `<button class="btn sm ${on ? 'sec' : ''}" data-act="equip" data-arg="${slot}|${it.id}">${on ? 'Aktiv ✔' : 'Benutzen'}</button>`
      : `<button class="btn sm" data-act="buy" data-arg="${slot}|${it.id}" ${can ? '' : 'disabled'}>${can ? 'Kaufen' : 'Noch ' + (it.price - W) + ' ' + cu.ic}</button>`;
    return `<div class="card item ${on ? 'eq' : ''}"><div class="pv">${itemPreview(slot, it)}</div><div class="nm">${it.name}</div>${has ? '<div class="small mute">Gehört dir ✔</div>' : `<div class="price">${cu.ic} ${it.price}</div>`}${btn}</div>`;
  }).join('');
  return topBar('🛍️ Shop') + `<div class="preview card">${avatarHTML(eqAvatar(), 150, 'cheer')}<div style="flex:1;min-width:220px"><h3>So sieht Fino gerade aus</h3>
    <p class="mute small" style="margin:6px 0 0"><b>🪙 Münzen</b>: für richtige Aufgaben (2 beim 1. Versuch).<br><b>⭐ Sterne</b>: für gut gelöste Stufen und Mini-Tests.<br><b>🔥 Flammen</b>: fürs Tagesziel – mehr bei langen Serien.</p></div></div>
  <div class="tabs">${tabs}</div><div class="items">${none}${items}</div>`;
};
function buy(slot, id) {
  const it = SHOP[slot].items.find(x => x.id === id), k = WALLET[it && it.cur];
  if (!it || S.owned[slot].includes(id) || S[k] < it.price) return;
  S[k] -= it.price; S.owned[slot].push(id); S.stats.bought++; S.eq[slot] = id;
  checkTrophies(); save(); closeModal(); render(); confetti(40); toast('🎉', `${it.name} gehört jetzt dir!`);
}
function equip(slot, id) { if (id && !S.owned[slot].includes(id)) return; S.eq[slot] = id || null; save(); render(); }

/* ----- Sammelalbum ----- */
VIEWS.album = () => {
  const found = Object.keys(S.cards).length, total = CARDS.length;
  const card = (c, hot) => {
    const ty = CARD_TYPES[c.t], shown = UI.ans[c.id];
    return `<div class="card cardx ${hot ? 'hot' : ''}"><div class="ct">${ty.ic} ${ty.n}</div><div class="cq">${c.q}</div>
      ${c.a ? (shown ? `<div class="ca">➜ ${c.a}</div>` : `<button class="btn sm sec" data-act="showAns" data-arg="${c.id}">Antwort zeigen</button>`) : ''}</div>`;
  };
  const hot = UI.reveal && S.cards[UI.reveal] ? CARDS.find(c => c.id === UI.reveal) : null;
  const sorted = CARDS.filter(c => S.cards[c.id]).sort((a, b) => S.cards[b.id] - S.cards[a.id]);
  const miss = total - found;
  return topBar('📚 Sammelalbum') + `<div class="card" style="margin-bottom:12px"><b>${found} von ${total} Karten gefunden</b><div class="bar" style="margin:6px 0"><i style="width:${Math.round(found / total * 100)}%"></i></div>
    ${S.chests ? `<div class="center"><button class="btn big" data-act="openChest">📦 Schatztruhe öffnen (${S.chests})</button></div>`
      : `<p class="small mute" style="margin:6px 0 0">Schatztruhen gibt es für echte Leistungen: eine Stufe mit mindestens 2 ⭐, eine ganze Gruppe, das Tagesziel und gute Mini-Tests. Darin sind lustige Fakten, Witze und Knobelfragen.</p>`}</div>
  ${hot ? `<h3 style="margin:6px 4px">🎉 Neu gefunden!</h3>${card(hot, true)}<div style="height:12px"></div>` : ''}
  <div class="grid">${sorted.filter(c => !hot || c.id !== hot.id).map(c => card(c)).join('')}${Array.from({ length: Math.min(miss - (hot ? 0 : 0), 6) }, () => '<div class="card cardx lock"><div class="ct">❓</div><div class="cq">Noch nicht gefunden</div></div>').join('')}</div>
  ${miss > 6 ? `<p class="small mute center">… und noch ${miss - 6} weitere Überraschungen.</p>` : ''}`;
};
function openChest() {
  const left = CARDS.filter(c => !S.cards[c.id]);
  if (!S.chests || !left.length) return;
  const c = rnd(left); S.chests--; S.cards[c.id] = Date.now(); UI.reveal = c.id; delete UI.ans[c.id];
  checkTrophies(); save(); render(); confetti(70);
}

/* ----- Pokale ----- */
VIEWS.trophies = () => {
  const L = trophyList(), got = L.filter(t => S.trophies[t.id]).length;
  const sorted = L.slice().sort((a, b) => (S.trophies[b.id] ? 1 : 0) - (S.trophies[a.id] ? 1 : 0));
  const mp = MODULES.map(m => `<div class="card tro"><span class="ic">${m.icon}</span><div style="flex:1"><b>${m.id} · ${m.title}</b><div class="d">${m.topics.map(t => medalOf(tk(m.id, t.id)) ? MEDALS[medalOf(tk(m.id, t.id))] : '▫️').join(' ')}</div></div></div>`).join('');
  return topBar('🏆 Pokale') + `<div class="card" style="margin-bottom:12px"><b>${got} von ${L.length} Pokalen</b><div class="bar" style="margin-top:6px"><i style="width:${Math.round(got / L.length * 100)}%"></i></div>
  <div class="small mute" style="margin-top:8px">Medaillen pro Gruppe: 🥉 Stufe 1 fertig · 🥈 Stufe 2 fertig · 🥇 alle 30 Aufgaben · 💎 alle 30 mit mindestens 54 von 60 Punkten. Pokale mit ❓ sind geheim – findest du sie?</div></div>
  <div class="grid" style="margin-bottom:14px">${mp}</div>
  <div class="grid">${sorted.map(t => { const has = S.trophies[t.id]; return (t.s && !has)
    ? `<div class="card tro lock"><span class="ic">❓</span><div><b>Geheimer Pokal</b><div class="d">Finde heraus, wie man ihn bekommt!</div></div></div>`
    : `<div class="card tro ${has ? '' : 'lock'}"><span class="ic">${t.i}</span><div><b>${t.n}</b><div class="d">${t.d}</div></div></div>`; }).join('')}</div>`;
};

/* ----- limit ----- */
VIEWS.limit = () => `<div class="card result"><div style="margin:auto;width:170px">${avatarHTML(eqAvatar(), 170, 'think')}</div>
  <h2>Für heute reicht’s!</h2><p>Du hast heute schon <b>${usedMin()} Minuten</b> geübt. Pausen sind wichtig – morgen geht es weiter. Dein Fortschritt ist gespeichert.</p>
  <div class="row wrap" style="justify-content:center"><button class="btn big" data-act="home">Zum Start</button><button class="btn sec big" data-act="limitUnlock">Eltern: heute weiter üben</button></div></div>`;

/* ----- Eltern ----- */
VIEWS.parent = () => {
  const L = levelInfo(), rows = [], weak = [];
  MODULES.forEach(m => {
    rows.push(`<tr><th colspan="5">${m.icon} ${m.id} · ${m.title}</th></tr>`);
    m.topics.forEach(t => {
      const key = tk(m.id, t.id), r = S.topics[key], d = S.decks[key], p = r && r.q ? Math.round(r.c / r.q * 100) : null;
      if (r && r.q >= 10 && p < 60) weak.push(`${t.icon} ${t.t} (${p} %)`);
      rows.push(`<tr><td>${t.icon} ${t.t}</td><td>${d ? d.i : 0}/${DECK_N}</td><td>${deckPts(d)}/${PTS_MAX}</td><td><span class="pct ${pctCls(p)}">${p === null ? '–' : p + ' %'}</span></td><td>${MEDALS[medalOf(key)] || '–'}</td></tr>`);
    });
  });
  const days = Object.keys(S.log).sort().slice(-7).reverse(), tests = S.tests.slice(-6).reverse();
  const sel = (id, opts, val) => `<select id="${id}" class="txt noprint">${opts.map(o => `<option value="${o[0]}" ${+o[0] === +val ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`;
  return topBar('👨‍👩‍👧 Eltern', 'home', '<button class="btn sm noprint" data-act="print">🖨️ Drucken</button>') + `
  <div class="card noprint"><h3>Einstellungen</h3>
    <div class="cfg"><div><b>Name des Kindes</b><br><span class="small mute">Wird auf dem Startbildschirm angezeigt.</span></div><div class="row"><input class="txt" id="nameIn" maxlength="20" value="${esc(S.name)}" placeholder="Name"><button class="btn sm" data-act="saveName">Speichern</button></div></div>
    <div class="cfg"><div><b>Tagesziel</b><br><span class="small mute">So viele Aufgaben pro Tag für 🔥 Flamme, Serie und Schatztruhe.</span></div>${sel('cfgGoal', [10, 15, 20, 25, 30, 40, 50].map(n => [n, n + ' Aufgaben']), S.cfg.goal)}</div>
    <div class="cfg"><div><b>Tageslimit</b><br><span class="small mute">Nach dieser Übungszeit pro Tag gibt es eine Pause. Heute: ${usedMin()} Min · ${S.daily.d === ymd() ? S.daily.n : 0} Aufgaben.</span></div>${sel('cfgLimit', [[0, 'Kein Limit'], [15, '15 Minuten'], [20, '20 Minuten'], [30, '30 Minuten'], [45, '45 Minuten'], [60, '60 Minuten'], [90, '90 Minuten']], S.cfg.limitMin)}</div>
    <div class="cfg"><div><b>Eltern-PIN</b><br><span class="small mute">Schützt diesen Bereich, das Zurücksetzen von Gruppen und das Verlängern des Tageslimits.</span></div><button class="btn sm sec" data-act="pinChange">PIN ändern</button></div>
  </div>
  <div class="card" style="margin-top:12px"><h3>Überblick</h3><p>Stufe ${L.n} (${L.title}) · ${S.stats.q} Aufgaben · ${S.stats.q ? Math.round(S.stats.c / S.stats.q * 100) : 0} % gleich richtig · Serie ${streakNow()} Tag(e) · ${S.mistakes.length} im Fehler-Heft · ${Object.keys(S.cards).length}/${CARDS.length} Karten</p>
  ${weak.length ? `<p><b>Das sollte noch geübt werden:</b> ${weak.join(', ')}</p>` : '<p class="mute small">Schwache Themen werden angezeigt, sobald genug Aufgaben gelöst wurden.</p>'}</div>
  <div class="card" style="margin-top:12px"><h3>Gruppen</h3><div style="overflow-x:auto"><table class="tbl"><tr><th>Gruppe</th><th>Fortschritt</th><th>Punkte</th><th>1. Versuch</th><th>Medaille</th></tr>${rows.join('')}</table></div></div>
  <div class="grid" style="margin-top:12px"><div class="card"><h3>Letzte Tage</h3>${days.length ? `<table class="tbl">${days.map(d => `<tr><td>${d}</td><td>${S.log[d].n} Aufgaben</td><td>${S.log[d].c} gleich richtig</td></tr>`).join('')}</table>` : '<p class="mute">Noch nichts.</p>'}</div>
  <div class="card"><h3>Mini-Tests</h3>${tests.length ? `<table class="tbl">${tests.map(t => `<tr><td>${new Date(t.ts).toLocaleDateString('de-DE')}</td><td>${t.score} / ${t.total}</td><td>${fmtT(t.secs)} min</td></tr>`).join('')}</table>` : '<p class="mute">Noch kein Test.</p>'}</div></div>
  <div class="card noprint" style="margin-top:12px"><h3>Daten &amp; Sicherung</h3>
    <p class="small">Der Fortschritt wird <b>nie von der App gelöscht</b>. Er geht nur verloren, wenn die Browserdaten (Cookies / Websitedaten) gelöscht werden. Er liegt doppelt im Browser. Zusätzlich kann man hier eine Sicherungsdatei speichern (z. B. in die Cloud) und später wieder laden. Die Datei immer im selben Browser öffnen und nicht im privaten Modus.</p>
    <p class="small mute">Letzte Sicherung: ${S.lastBackup ? new Date(S.lastBackup).toLocaleDateString('de-DE') : 'noch nie'}</p>
    <div class="row wrap"><button class="btn sm" data-act="export">💾 Sichern</button><label class="btn sm sec" style="cursor:pointer">📂 Laden<input type="file" id="impFile" accept=".json,application/json" class="hide"></label></div>
    <textarea class="txt hide" id="expTxt" readonly style="margin-top:10px"></textarea>
    ${persistOK ? '' : '<p class="small" style="color:var(--bad)">In diesem Browser kann gerade nichts dauerhaft gespeichert werden (privater Modus?).</p>'}</div>`;
};
function exportData() {
  const j = JSON.stringify(S, null, 1);
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([j], { type: 'application/json' })); a.download = 'mathe-abenteuer-' + ymd() + '.json'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { }
  S.lastBackup = Date.now(); save();
  const t = $('#expTxt'); if (t) { t.value = j; t.classList.remove('hide'); }
  toast('💾', 'Sicherung erstellt');
}
function importData(txt, force) {
  try {
    const o = JSON.parse(txt); if (!o || typeof o.coins !== 'number') throw 0;
    if (!force) { UI.pending = txt; modal('Sicherung laden?', `Der Stand in der Datei hat ${o.stats ? o.stats.q || 0 : 0} gelöste Aufgaben. Aktuell sind es ${S.stats.q}. Der jetzige Stand wird ersetzt.`, 'Ja, laden', 'importYes', '', 'Nein'); return; }
    S = mergeState(o); save(); toast('✅', 'Fortschritt geladen'); go('home', { say: '' });
  } catch (e) { toast('⚠️', 'Die Datei konnte nicht gelesen werden.'); }
}

/* ----- PIN ----- */
function requirePin(act, arg) {
  if (Date.now() < UI.pinUntil) { ACT[act](arg); return; }
  PIN = S.pin ? { act, arg, buf: '', mode: 'enter', msg: 'Eltern-PIN eingeben' }
    : { act, arg, buf: '', mode: 'create1', msg: 'Lege eine PIN für den Eltern-Bereich fest (4 Ziffern).' };
  pinDraw();
}
function pinDraw() {
  const P = PIN; closeModal();
  const m = document.createElement('div'); m.className = 'modal'; m.id = 'modal';
  let body;
  if (P.mode === 'recshow') body = `<h2>Notfall-Code</h2><p>Falls die PIN vergessen wird, hilft dieser Code. <b>Bitte jetzt aufschreiben!</b> Er wird nicht noch einmal angezeigt.</p><div class="reccode">${P.rec.replace(/(\d{4})(\d{4})/, '$1 $2')}</div><button class="btn big" data-act="pinDone">Ich habe ihn notiert</button>`;
  else {
    const max = P.mode === 'recover' ? 8 : 4;
    body = `<h2>🔒 Eltern</h2><p>${P.msg}</p><div class="pindots">${Array.from({ length: max }, (_, i) => `<i class="${i < P.buf.length ? 'on' : ''}"></i>`).join('')}</div>
    <div class="keypad pinpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="key" data-act="pinKey" data-arg="${n}">${n}</button>`).join('')}<span></span><button class="key" data-act="pinKey" data-arg="0">0</button><button class="key fn" data-act="pinKey" data-arg="back">⌫</button></div>
    <div class="row wrap" style="justify-content:center;margin-top:12px"><button class="btn ghost sm" data-act="pinCancel">Abbrechen</button>${P.mode === 'enter' ? '<button class="btn ghost sm" data-act="pinForgot">PIN vergessen?</button>' : ''}</div>`;
  }
  m.innerHTML = `<div class="card">${body}</div>`; document.body.appendChild(m);
}
function pinKey(k) {
  const P = PIN; if (!P || P.mode === 'recshow') return;
  const max = P.mode === 'recover' ? 8 : 4;
  if (k === 'back') P.buf = P.buf.slice(0, -1); else if (/^\d$/.test(k) && P.buf.length < max) P.buf += k;
  if (P.buf.length === max) {
    if (P.mode === 'enter') { if (pinOk(P.buf)) return pinSucceed(); P.buf = ''; P.msg = 'Falsche PIN – bitte noch einmal.'; }
    else if (P.mode === 'create1') { P.first = P.buf; P.buf = ''; P.mode = 'create2'; P.msg = 'Zur Sicherheit noch einmal eingeben.'; }
    else if (P.mode === 'create2') {
      if (P.buf === P.first) { const rec = String(Math.floor(Math.random() * 1e8)).padStart(8, '0'); S.pin = { h: hashStr(P.first), r: hashStr(rec) }; save(); P.mode = 'recshow'; P.rec = rec; }
      else { P.buf = ''; P.first = ''; P.mode = 'create1'; P.msg = 'Die PINs waren verschieden. Bitte neu festlegen.'; }
    } else if (P.mode === 'recover') {
      if (recOk(P.buf)) { P.buf = ''; P.mode = 'create1'; P.msg = 'Code stimmt. Lege eine neue PIN fest.'; } else { P.buf = ''; P.msg = 'Der Code stimmt nicht.'; }
    }
  }
  pinDraw();
}
function pinSucceed() { const { act, arg } = PIN; PIN = null; closeModal(); UI.pinUntil = Date.now() + 3 * 60000; ACT[act](arg); }

/* =====================================================================
   ACTIONS + EVENTS
   ===================================================================== */
function press(k) {
  let c;
  if (view === 'play') { c = R.ctx; if (c.state !== 'ask') { if (k === 'enter') next(); return; } }
  else if (view === 'test') c = T.qs[T.i].c;
  else return;
  const q = c.q; if (!q.fields) { if (k === 'enter' && view === 'test') ACT.nextQ(); return; }
  const fs = q.fields;
  if (k === 'enter') { if (view === 'play') check(); else ACT.nextQ(); return; }
  if (k === 'tab') { move(c, 1); render(); return; }
  if (k === 'shifttab') { move(c, -1); render(); return; }
  if (c.locked[c.focus]) { move(c, 1); if (c.locked[c.focus]) return; }
  const fo = fs[c.focus];
  if (k === 'back') {
    if (c.vals[c.focus] !== '') { c.vals[c.focus] = c.vals[c.focus].slice(0, -1); c.marks[c.focus] = null; }
    else { const j = fs.findIndex((x, i) => x.next === c.focus && !c.locked[i]); if (j >= 0) { c.focus = j; c.vals[j] = ''; c.marks[j] = null; } }
  } else if (k === ',') {
    if (/,/.test(fo.a) && !fo.digit && c.vals[c.focus] !== '' && !c.vals[c.focus].includes(',')) { c.vals[c.focus] += ','; c.marks[c.focus] = null; }
  } else if (/^\d$/.test(k)) {
    if (fo.digit) { c.vals[c.focus] = k; c.marks[c.focus] = null; if (fo.next != null) c.focus = fo.next; }
    else if (c.vals[c.focus].replace(',', '').length < 8) { c.vals[c.focus] += k; c.marks[c.focus] = null; }
  }
  render();
}
function move(c, d) {
  const n = c.q.fields.length; let i = c.focus;
  for (let t = 0; t < n; t++) { i = (i + d + n) % n; if (!c.locked[i]) break; }
  c.focus = i;
}
const curCtx = () => view === 'play' ? R.ctx : view === 'test' ? T.qs[T.i].c : null;

const ACT = {
  home: () => { if (T && T.timer) clearInterval(T.timer); go('home', { say: '' }); },
  mod: id => go('module', { mod: id }),
  backMod: () => go('module', { mod: UI.key ? UI.key.split('.')[0] : UI.mod }),
  topic: id => go('topic', { key: tk(UI.mod, id) }),
  toGroup: () => go('topic', { key: R.key }),
  practice: () => startDeck(UI.key),
  blockNext: () => {
    const d = S.decks[R.key]; if (d.i >= DECK_N) return go('topic', { key: R.key });
    if (limitHit()) return go('limit');
    R.idx = d.i; R.ctx = newCtx(d.qs[R.idx]); R.bc = {}; go('play');
  },
  reviewDeck: () => go('review', { review: { key: UI.key, b: null }, reviewBack: 'toTopic' }),
  reviewBlock: () => go('review', { review: { key: R.key, b: R.blockInfo.b }, reviewBack: 'toBlock' }),
  toTopic: () => go('topic', { key: UI.review ? UI.review.key : UI.key }),
  toBlock: () => go('block'),
  resetTopic: () => requirePin('resetTopicAsk', UI.key),
  resetTopicAsk: key => {
    const f = findTopic(key);
    modal('Gruppe zurücksetzen?', `<b>${f.topic.t}</b>: Alle 30 Aufgaben werden durch <b>neue Aufgaben</b> ersetzt. Fortschritt und Punkte dieser Gruppe gehen auf 0.<br><br>Münzen und Sterne im Geldbeutel bleiben. Pro Gruppe gibt es aber nie mehr als ${PTS_MAX} 🪙 und ${STARS_MAX} ⭐ – wer die Gruppe nochmal löst, bekommt nur Belohnungen über dem bisherigen Bestwert.`, 'Ja, zurücksetzen', 'resetTopicYes', key, 'Nein, behalten');
  },
  resetTopicYes: key => { closeModal(); resetDeck(key); toast('🔄', 'Gruppe zurückgesetzt – neue Aufgaben!'); go('topic', { key }); },
  mistakes: () => go('mistakes'), mistakeRound: startMistakes,
  key: k => press(k), check, next, pick: i => pickChoice(+i),
  hint: () => { const c = curCtx(); if (c && c.state === 'ask') { c.showHint = true; c.hinted = true; render(); } },
  foc: i => { const c = curCtx(); if (c && c.state === 'ask' && c.q.fields && !c.locked[+i]) { c.focus = +i; render(); } },
  quit: () => view === 'test'
    ? modal('Test abbrechen?', 'Dein Test wird nicht gewertet.', 'Ja, abbrechen', 'quitYes', '', 'Weiter rechnen')
    : modal('Pause machen?', 'Alles ist gespeichert. Du kannst jederzeit genau hier weitermachen.', 'Ja, Pause', 'quitYes', '', 'Weiter üben'),
  quitYes: () => { closeModal(); if (view === 'test') { if (T && T.timer) clearInterval(T.timer); go('home', { say: '' }); } else if (R && R.kind === 'deck') go('topic', { key: R.key }); else go('mistakes'); },
  testSetup: () => go('testSetup'), scope: s => { UI.scope = s; render(); }, testStart: startTest,
  testAsk, testFinish: () => finishTest(false),
  goQ: i => { T.i = +i; render(); }, nextQ: () => { if (T.i < T.qs.length - 1) { T.i++; render(); } }, prevQ: () => { if (T.i > 0) { T.i--; render(); } },
  shop: () => go('shop'), shopTab: s => { UI.shopTab = s; render(); },
  buy: a => {
    const [s, id] = a.split('|'), it = SHOP[s].items.find(x => x.id === id), cu = CUR[it.cur], W = S[WALLET[it.cur]];
    modal('Bist du ganz sicher?', `${itemPreview(s, it)}<br><b>${it.name}</b> kostet <b>${cu.ic} ${it.price}</b>. Danach hast du noch ${W - it.price} ${cu.ic}.<br><br><b>Ein Kauf kann nicht rückgängig gemacht werden.</b> Du bekommst das Geld nicht zurück.`, 'Ja, kaufen', 'buyYes', a, 'Nein, noch nicht');
  },
  buyYes: a => { const [s, id] = a.split('|'); buy(s, id); },
  equip: a => { const [s, id] = a.split('|'); equip(s, id); },
  album: () => go('album', { reveal: null }), openChest, showAns: id => { UI.ans[id] = 1; render(); },
  trophies: () => go('trophies'),
  parent: () => requirePin('parentGo'), parentGo: () => go('parent'), print: () => window.print(),
  saveName: () => { S.name = ($('#nameIn').value || '').trim().slice(0, 20); save(); toast('✅', 'Gespeichert'); },
  export: exportData, importYes: () => { closeModal(); importData(UI.pending, true); },
  limitUnlock: () => requirePin('limitUnlockYes'), limitUnlockYes: () => { touchDay(); S.daily.unlocked = true; save(); toast('✅', 'Heute ohne Limit'); go('home', { say: '' }); },
  pinKey, pinDone: () => pinSucceed(), pinCancel: () => { PIN = null; closeModal(); },
  pinForgot: () => { PIN.mode = 'recover'; PIN.buf = ''; PIN.msg = 'Gib den 8-stelligen Notfall-Code ein.'; pinDraw(); },
  pinChange: () => { PIN = { act: 'pinChanged', arg: '', buf: '', mode: 'create1', msg: 'Neue PIN festlegen (4 Ziffern).' }; pinDraw(); },
  pinChanged: () => { toast('✅', 'PIN geändert'); render(); },
  closeModal
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const a = ACT[el.dataset.act]; if (a) a(el.dataset.arg);
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'impFile' && t.files[0]) { const r = new FileReader(); r.onload = () => importData(r.result); r.readAsText(t.files[0]); t.value = ''; }
  else if (t.id === 'cfgGoal') { S.cfg.goal = +t.value; save(); toast('✅', 'Tagesziel: ' + t.value + ' Aufgaben'); }
  else if (t.id === 'cfgLimit') { S.cfg.limitMin = +t.value; save(); toast('✅', +t.value ? 'Tageslimit: ' + t.value + ' Minuten' : 'Kein Tageslimit'); }
});
document.addEventListener('keydown', e => {
  if (/INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''))) return;
  if (PIN) {
    if (/^\d$/.test(e.key)) pinKey(e.key); else if (e.key === 'Backspace') pinKey('back'); else if (e.key === 'Escape') ACT.pinCancel();
    return;
  }
  if ($('#modal')) { if (e.key === 'Escape') closeModal(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  let k = null;
  if (/^\d$/.test(e.key)) k = e.key; else if (e.key === ',' || e.key === '.') k = ','; else if (e.key === 'Backspace') k = 'back'; else if (e.key === 'Enter') k = 'enter';
  else if (e.key === 'Tab') k = e.shiftKey ? 'shifttab' : 'tab';
  if (k && (view === 'play' || view === 'test')) { e.preventDefault(); press(k); }
});

/* Übungszeit für das Tageslimit (zählt nur bei Aktivität, nie im Hintergrund) */
let lastInput = Date.now();
['click', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, () => { lastInput = Date.now(); }, true));
setInterval(() => {
  if (document.hidden || !['play', 'test', 'block', 'review'].includes(view) || Date.now() - lastInput > 90000) return;
  touchDay(); S.daily.sec += 5; if (S.daily.sec % 60 < 5) save();
}, 5000);
document.addEventListener('visibilitychange', () => { if (document.hidden) { try { save(); } catch (e) { } } });

/* ---------- boot ---------- */
window.__app = {
  get S() { return S; }, set S(v) { S = v; }, get R() { return R; }, get T() { return T; }, get view() { return view; }, get PIN() { return PIN; }, UI, MODULES, SHOP, CARDS, ACT,
  startDeck, startMistakes, startTest, press, check, pickChoice, next, fieldOK, newCtx, isCorrect, levelInfo, medalOf, trophyList, checkTrophies, finishTest, remaining,
  mergeState, render, go, giveCoins, buy, equip, topicRec, importData, tk, qBody, mascotSVG, getDeck, deckPts, deckWrong, blockPts, resetDeck, requirePin, pinKey, limitHit, openChest, save, load, dailyCheck, touchDay
};
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
touchDay(); render();
idbGet().then(j => {                                // zweite Kopie: falls der Hauptspeicher leer/älter ist
  try {
    const o = j ? JSON.parse(j) : null;
    if (o && (o.saved || 0) > (S.saved || 0) + 1000) { S = mergeState(o); touchDay(); toast('♻️', 'Fortschritt wiederhergestellt'); render(); }
  } catch (e) { }
  save();
});
