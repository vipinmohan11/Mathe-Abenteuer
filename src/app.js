/* =====================================================================
   APP: Startbildschirm, Üben, Test, Shop, PIN, Ereignisse (Funktionen wie Avatar/Insel/Heft … liegen in feat_*.js)
   (state & rules live in store.js, questions in gen.js)
   ===================================================================== */

/* ---------- toasts / confetti / modal ---------- */
function toast(icon, text) {
  let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<span class="ic">${icon}</span><span>${text}</span>`;
  box.appendChild(t); while (box.children.length > 3) box.firstChild.remove(); setTimeout(() => { t.remove(); }, 3600);
}
function confetti(n = 80) {
  if (S.cfg && S.cfg.calm) return;
  const c = document.createElement('div'); c.className = 'confetti'; const cols = ['#8C7BFF', '#FFB86B', '#5ED3A8', '#6AB0FF', '#FFD65A', '#FF8A6B'];
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
const finoLook = () => ({ skin: S.eq.skin, hat: S.eq.hat, extra: S.eq.extra, bg: S.eq.bg, frame: S.eq.frame });
const useMe = () => !!(S.av && S.av.use && S.av.look && typeof meSVG === 'function');
const eqAvatar = () => useMe() ? { me: true } : finoLook();          // das Bild, das sie überall sieht: ihr eigener Avatar oder Fino
function avatarHTML(o, size, mood) {
  mood = mood || 'happy';
  if (o.me && useMe()) return `<div class="avwrap m-${mood}" style="--s:${size}px"><div class="avatar">${meSVG(S.av.look, mood)}</div></div>`;
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

function go(v, extra) { if (typeof geoGuard === 'function' && geoGuard(v, extra)) return; if (view !== v) { if (typeof leaveHook === 'function') leaveHook(view); if (typeof dzNavPush === 'function') dzNavPush(view, v); } Object.assign(UI, extra || {}); view = v; render(); }
function render() {
  document.body.dataset.theme = S.eq.theme;
  const f = VIEWS[view] || VIEWS.home;
  $('#app').innerHTML = typeof shellRender === 'function' ? shellRender(view, f) : f();
  $('#app').classList.toggle('wide', !!WIDEV[view]);
  if (AFTER[view]) { try { AFTER[view](); } catch (e) { console.error(e); } }
  const changed = lastView !== view;
  if (changed) { window.scrollTo(0, 0); lastView = view; }
  if (typeof dzAfterRender === 'function') dzAfterRender(changed);
  if (view === 'test') testPersist();
}

/* =====================================================================
   VIEWS
   ===================================================================== */
const chip = (ic, v, t) => `<span class="chip" title="${t || ''}">${ic} <b>${v}</b></span>`;
const statChips = () => `<div class="stats"><button class="chip cb" data-act="shop" title="Münzen – im Shop ausgeben">🪙 <b>${S.coins}</b></button>${chip('⭐', S.starsLife, 'Sterne – dein Beleg, bleiben immer erhalten')}</div>`;
/* Kopfzeile innerer Seiten. „back“ ist nur der Notnagel; der Zurück-Knopf führt zur Seite, von der man wirklich kam (dz.js: NAV) */
const topBar = (title, back = 'home', extra = '') => {
  const lb = dzBackLabel(back), deep = NAV.stack.length >= 2;                  // ab 2 Schritten von Start: Haus-Symbol in der Mitte
  return `<div class="top${deep ? ' has-home' : ''}"><button class="btn sec back" data-act="back" data-arg="${esc(back)}" aria-label="Zurück zu: ${esc(lb)}">${ico('back', 20)}<span>${esc(lb)}</span></button><h2>${title}</h2>${deep ? `<button class="btn sec dz-home" data-act="home" aria-label="Zur Startseite" title="Zur Startseite">${dzHomeArt(26)}<span class="dz-home-l">Start</span></button>` : ''}${extra}${statChips()}</div>`;
};
const greeting = () => { const h = new Date().getHours(); return h < 11 ? 'Guten Morgen' : h < 17 ? 'Hallo' : 'Guten Abend'; };
const pctCls = p => p === null ? 'n' : p >= 80 ? 'g' : p >= 55 ? 'y' : 'r';

function modProgress(m) {
  let pts = 0, max = 0, tried = 0, done = 0;
  m.topics.forEach(t => { const d = S.decks[tk(m.id, t.id)]; max += d ? deckMax(d) : NEW_DECK_MAX; if (d) { pts += deckPts(d); if (d.i > 0) tried++; if (d.i >= DECK_N) done++; } });
  return { pts, max, pct: Math.round(pts / max * 100), tried, done, total: m.topics.length };
}
const usedMin = () => Math.floor((S.daily.d === ymd() ? S.daily.sec : 0) / 60);

const VIEWS = {}, AFTER = {}, WIDEV = {};                      // AFTER[view]: läuft nach jedem Zeichnen (z. B. Animationen)

const TINTS = ['lav', 'mint', 'peach', 'sky', 'butter', 'sage'];
/* Startseite, Hefte, Belohnungen, Darstellung: siehe shell.js */

const topicBtn = (m, t, index, act, arg) => {
  const key = tk(m.id, t.id), d = S.decks[key], i = d ? d.i : 0, md = medalOf(key);
  return `<button class="topic" data-act="${act}" data-arg="${esc(arg)}"><span class="rh-topic-icon" aria-hidden="true">${t.icon}</span><span class="small mute">Übung ${index + 1}</span><h3>${esc(t.t)}</h3><div class="bar"><i style="width:${Math.round(i / DECK_N * 100)}%"></i></div><span class="small mute">${i >= DECK_N ? 'Geschafft!' : `${i} / ${DECK_N} Aufgaben`}${md ? ` · ${MEDALS[md]}` : ''}</span></button>`;
};
VIEWS.module = () => {
  const m = MODULES.find(x => x.id === UI.mod);
  if (m && isExtra(m)) return VIEWS.kopf();                       // Einmaleins, Kopfrechnen und Schriftlich Rechnen sind EIN Bereich
  return topBar(esc(m.title), 'hefte') + `<p class="rh-section-note">Heft ${esc(m.id)} · Wähle deine nächste Übung.</p><div class="grid rh-topics">${m.topics.map((t, index) => topicBtn(m, t, index, 'topic', t.id)).join('')}</div>`;
};
/* Kopfrechnen: alle Übungen aus Einmaleins (EMAL), Kopfrechnen (KOPF) und Schriftlich Rechnen (SCHR) in einer Liste, ohne Unterordner.
   Die inneren Heft-Nummern bleiben, damit gespeicherte Fortschritte (Decks „EMAL.mal“ …) unverändert weiterzählen. */
VIEWS.kopf = () => {
  const all = MODULES.filter(isExtra).flatMap(m => m.topics.map(t => ({ m, t }))), done = all.filter(x => ((S.decks[tk(x.m.id, x.t.id)] || { i: 0 }).i >= DECK_N)).length;
  return topBar('Kopfrechnen', 'hefte') + `<p class="rh-section-note">Mal, geteilt, plus, minus und untereinander · ${done} von ${all.length} geschafft</p><div class="grid rh-topics">${all.map((x, index) => topicBtn(x.m, x.t, index, 'kopfTopic', tk(x.m.id, x.t.id))).join('')}</div>`;
};

/* ----- group screen ----- */
const BLOCK_SUB = ['Warm werden', 'Weiter geht’s', 'Großes Finale'];
const resDot = r => `<i class="${r === 'first' ? 'ok' : r === 'second' ? 'half' : r === 'fail' ? 'bad' : ''}"></i>`;
const LEGEND = '🟢 = 1 Punkt · 🔵 = 2 Punkte · 🔥 = 3 Punkte · 👑 = 4 Punkte';
VIEWS.topic = () => {
  const key = UI.key, f = findTopic(key), d = S.decks[key], i = d ? d.i : 0, t = topicRec(key), md = medalOf(key);
  const pts = deckPts(d), max = d ? deckMax(d) : NEW_DECK_MAX, wrong = deckWrong(d).length, done = i >= DECK_N;
  const earned = t.cb.reduce((a, b) => a + b, 0), starsE = t.sb.reduce((a, b) => a + b, 0);
  const blocks = [0, 1, 2].map(b => {
    const bd = d && blockDone(d, b), bp = blockPts(d, b), bm = blockMax(d, b), st = bd ? blockStarsOf(bp, bm) : 0, cnt = d ? d.res.slice(...blockRange(b)).filter(r => r !== null).length : 0;
    return `<div class="blk ${bd ? 'done' : ''}"><b>Stufe ${b + 1}</b><span class="blk-sub">${BLOCK_SUB[b]}</span><div class="stars sm">${[1, 2, 3].map(k => `<span class="${k <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
      <div class="dotsm">${(d ? d.res.slice(...blockRange(b)) : Array(BLOCK).fill(null)).map(resDot).join('')}</div>
      <span class="small mute">${cnt}/${BLOCK} · ${bp}/${bm} Punkte</span></div>`;
  }).join('');
  return `${topBar(`${f.topic.icon} ${f.topic.t}`, 'backMod')}
  <div class="card">
    <p style="margin:0 0 8px"><b>${f.topic.d}</b></p>
    <div class="row wrap"><div style="flex:1;min-width:220px">
      <div class="bar"><i style="width:${Math.round(i / DECK_N * 100)}%"></i></div>
      <div class="small mute" style="margin-top:4px">${i} von ${DECK_N} Aufgaben · Punkte in dieser Gruppe: <b>${pts}/${max}</b> ${md ? '· Medaille: ' + MEDALS[md] + ' ' + MEDAL_NAMES[md] : ''}</div></div>
    </div>
    <div class="blocks">${blocks}</div>
    <div class="row wrap" style="margin-top:14px;justify-content:center">
      ${done ? `<div class="fb ok sp" style="text-align:center">🎉 Alle 30 Aufgaben geschafft!${t.hist && t.hist.length ? ` Beste Runde: ${bestRound(key)}/${max}` : ''}</div><button class="btn big" data-act="newRound">🔁 Neue Runde</button>` : `<button class="btn big" data-act="practice">${i ? '▶ Weiter üben (Aufgabe ' + (i + 1) + ')' : '▶ Los geht’s'}</button>`}
      ${wrong ? `<button class="btn sec big" data-act="reviewDeck">📝 Fehler ansehen (${wrong})</button>` : ''}
    </div>
    <p class="small mute" style="margin:12px 0 0">In dieser Gruppe gibt es höchstens <b>${max} 🪙</b> und <b>${STARS_MAX} ⭐</b>.<br>${LEGEND} ${earned || starsE ? `Bisher verdient: ${earned}/${max} 🪙 und ${starsE}/${STARS_MAX} ⭐.` : ''}</p>
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
  const f = c.q.fields[c.focus], comma = f && (/,/.test(f.a) || f.dec) && !f.digit;
  const k = (v, l, cls) => `<button class="key ${cls || ''}" data-act="key" data-arg="${v}"${(v === ',' && !comma) ? ' disabled' : ''}>${l || v}</button>`;
  const multi = c.q.fields.length > 1;
  return `<div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => k(n)).join('')}${k(',', ',', 'fn')}${k(0)}${k('back', '⌫', 'fn')}${multi ? k('tab', '➜ Nächstes Feld', 'fn wide') : ''}</div>`;
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
  ${idx.length ? `<div class="list">${idx.map(i => reviewItem(d.qs[i], d.ans[i], { n: i + 1, t: `<span class="ptb t${qPts(d, i)}">${TIER[qPts(d, i)] || ''}</span> ` }, d.res[i] === 'fail' ? 'bad' : '')).join('')}</div>` : '<div class="card result"><h2>Keine Fehler! 🎉</h2></div>'}`;
};

/* ----- play ----- */
const ptBadge = p => { const k = Math.min(4, Math.max(1, p)); return `<div class="ptbadge t${k}" aria-label="${k} Punkt${k > 1 ? 'e' : ''}">${TIER[k]}</div>`; };
VIEWS.play = () => {
  const c = R.ctx, q = c.q, deck = R.kind === 'deck';
  let dots, label, pchip;
  if (deck) {
    const d = S.decks[R.key], b = Math.floor(R.idx / BLOCK), f = findTopic(R.key);
    dots = d.res.slice(...blockRange(b)).map((r, k) => `<i class="${b * BLOCK + k === R.idx ? 'cur' : r === 'first' ? 'ok' : r === 'second' ? 'half' : r === 'fail' ? 'bad' : ''}"></i>`).join('');
    label = `${f.topic.icon} ${f.topic.t} · Aufgabe ${R.idx + 1} von ${DECK_N} · Stufe ${b + 1}: ${BLOCK_SUB[b]}`; pchip = chip('🪙', `${deckPts(d)}/${deckMax(d)}`, 'Punkte in dieser Gruppe');
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
    const pt = deck ? ptsOf(c.res, qPts(S.decks[R.key], R.idx)) : 0;
    let pts = '';
    if (deck) pts = R.lastDelta ? ` <b>+${R.lastDelta} 🪙</b>` : pt ? ` <span class="small">(${pt} Punkt${pt > 1 ? 'e' : ''} – Münzen-Bestwert dieser Stufe schon erreicht)</span>` : ` <span class="small">(Beim 2. Versuch zählt eine 1-Punkt-Aufgabe nicht mehr.)</span>`;
    else pts = c.res === 'first' ? ' Die Aufgabe verschwindet aus dem Fehler-Heft.' : ' Noch einmal gleich richtig – dann verschwindet sie.';
    fb = `<div class="fb ok" role="status"><strong class="ad-feedback-title">${ico('check', 23)} ${c.res === 'first' ? 'Ja! Richtig gerechnet!' : 'Jetzt stimmt’s! Gut verbessert.'}</strong>${pts}<span class="ex">${q.explain}</span></div>`;
  } else {
    mood = 'sad'; fb = `<div class="fb bad" role="status"><strong class="ad-feedback-title">${XMARK} Noch nicht richtig. Schau mal:</strong><span class="ex">${q.explain}</span></div>`;
  }
  // Falsch beim 1. Versuch: deutlich (rot + Kreuz), aber ermutigend
  if (c.state === 'ask' && c.tries > 0) fb = `<div class="fb bad ad-retry" role="status"><strong class="ad-feedback-title">${XMARK} Noch nicht ganz.</strong><span>Probier’s noch mal. Wir schaffen das!</span></div>` + fb;
  const st = c.state === 'right' ? 'right' : c.state === 'revealed' ? 'revealed' : c.tries > 0 ? 'retry' : 'ask';
  c.say = say;
  const last = deck ? false : R.idx === R.items.length - 1;
  const act = c.state === 'ask'
    ? (q.fields ? `<button class="btn big" data-act="check">Prüfen ✔</button>` : '')
    : `<button class="btn big" data-act="next">${R.blockPending ? 'Stufe fertig 🏁' : last ? 'Fertig 🏁' : 'Weiter →'}</button>`;
  const hintBtn = c.state === 'ask' && !c.showHint ? `<button class="btn sec sm" data-act="hint">💡 Tipp (halbe Punkte)</button>` : '';
  const pbadge = deck ? ptBadge(qPts(S.decks[R.key], R.idx)) : '';
  return `<div class="top"><button class="btn sec back" data-act="quit" aria-label="Pause">← Pause</button><div class="dots">${dots}</div>${pchip}</div>
  <div class="small mute" style="margin:-4px 0 8px 4px">${label}</div>
  <div class="play ad-play ad-${st}">
    <div class="mainc"><div class="card qcard ad-question">${pbadge}${qBody(c)}</div>${fb}</div>
    <div class="side">
      <div class="coach">${avatarHTML(eqAvatar(), 92, c.state === 'right' ? 'cheer' : mood)}<div class="cbody"><div class="bubble">${esc(say)}</div>${hintBtn}</div></div>
      ${c.state === 'ask' && q.fields ? keypad(c) : ''}${act}
    </div>
  </div>`;
};

/* Richtige Antwort: nur der grüne Haken und ein leiser Ton – kein Sternenregen mehr. */
const XMARK = '<span class="ad-cross" aria-hidden="true" style="font-size:23px">✕</span>';
const celebrated = new WeakSet();
AFTER.play = () => {
  if (!R || !R.ctx || R.ctx.state !== 'right' || celebrated.has(R.ctx)) return;
  celebrated.add(R.ctx);
  sfx('ok');
};

/* ----- engine ----- */
function startDeck(key) {
  if (limitHit()) return go('limit');
  const d = getDeck(key);
  if (d.i >= DECK_N) { toast('✔', 'Diese Gruppe ist komplett geschafft.'); return go('topic', { key }); }
  S.lastKey = key;
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
    /* Münzen: giveCoins() lässt sie in den Beutel fliegen (feat_lohn.js) */
    if (blockDone(d, b)) { R.blockInfo = completeBlock(key, d, b); R.blockInfo.coins = R.bc[b] || 0; R.blockPending = true; }
  } else {
    const tid = R.items[R.idx].tid; noteAnswer(tid, first);
    if (first) { R.first++; removeMistake(tid, c.q); R.fixed++; } else addMistake(tid, c.q, c.firstAns);
  }
  R.lastMile = (res !== 'fail' && typeof WA !== 'undefined') ? WA.addMiles(1) : 0;
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
    <h3>${bi.firsts} von ${BLOCK} gleich richtig · ${bi.pts} von ${bi.max} Punkten</h3>
    <p style="font-weight:700">${esc(line)}</p>
    <div class="rewards">${bi.coins ? chip('🪙', '+' + bi.coins) : ''}${bi.dStars ? chip('⭐', '+' + bi.dStars) : ''}${bi.chest ? chip('📦', 'Schatztruhe!') : ''}${!bi.coins && !bi.dStars ? '<span class="small mute">Für diese Stufe gab es schon früher Belohnungen – mehr als der Bestwert wird nicht gezählt.</span>' : ''}</div>
    ${bi.stars < 2 && !bi.chest ? '<p class="small mute">Ab 2 ⭐ (${starNeed(bi.max, 2)} Punkte) gibt es eine Schatztruhe.</p>' : ''}
    ${bi.deckDone ? `<div class="fb ok" style="margin:8px 0">🎉 Alle 30 Aufgaben dieser Gruppe sind geschafft! Medaille: ${MEDALS[bi.medal]} ${MEDAL_NAMES[bi.medal]}${bi.medal < 4 ? ` · Diamant gibt es ab ${Math.ceil(deckMax(d) * .9)} von ${deckMax(d)} Punkten.` : ''}</div>` : ''}
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
  if (!list.length) return topBar(ico('notebook', 26) + ' Fehler-Heft') + intro + `<div class="card result"><div style="margin:auto;width:170px">${avatarHTML(eqAvatar(), 170, 'cheer')}</div><h2>Noch nichts drin – super!</h2><p>Sobald eine Aufgabe nicht gleich klappt, landet sie hier.</p></div>`;
  return topBar(ico('notebook', 26) + ' Fehler-Heft') + intro + `<div class="card"><div class="row wrap"><div style="flex:1"><b>${list.length} Aufgabe${list.length === 1 ? '' : 'n'}</b> zum Üben.</div><button class="btn big" data-act="mistakeRound">Üben (${Math.min(10, list.length)})</button></div></div>
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
/* Was der Mini-Test heute noch bringen kann (ehrlich, aus payTest-Regeln) */
function testPrizeNote(r) {
  const L = testLeft();
  if (r && !r.rewarded) return L.c || L.s || L.ch ? 'Diesmal gab es nichts Neues. Heute zählt dein bestes Ergebnis – schaffst du mehr, gibt es den Unterschied.' : 'Heute hast du schon alles verdient, was der Mini-Test bringt.';
  return L.c || L.s || L.ch ? `Heute noch möglich: ${L.c} Münzen, ${L.s} ${L.s === 1 ? 'Stern' : 'Sterne'}${L.ch ? ', eine Karte' : ''}.` : 'Für heute ist die Test-Belohnung komplett.';
}
VIEWS.testSetup = () => {
  const opts = [['all', 'Alle angefangenen Hefte']].concat(MODULES.map(m => [m.id, `${m.icon} ${m.title}`]));
  const best = S.tests.length ? Math.max(...S.tests.map(t => t.score)) : null, L = testLeft(), any = L.c || L.s || L.ch;
  const prizes = `<div class="geo-prize1">🎁 ${any ? `Heute noch: ${L.c} 🪙 + ${L.s} ⭐${L.ch ? ' + Karte (ab 12 richtig)' : ''}` : 'Heute schon alles verdient ✓'}</div>`;
  return topBar(ico('stopwatch', 26) + ' Mini-Test', 'home') + `<div class="card result"><div style="margin:auto;width:160px">${avatarHTML(eqAvatar(), 160, 'think')}</div>
  <h2>${TEST_N} Aufgaben · ${TEST_SECS / 60} Minuten</h2>
  <p>Wie in der Schule: keine Tipps und keine Rückmeldung, bis du fertig bist. Du kannst zwischen den Aufgaben springen. Die Aufgaben sind jedes Mal neu.</p>
  ${prizes}
  <div class="row wrap" style="justify-content:center;margin:12px 0">${opts.map(o => `<button class="btn ${UI.scope === o[0] ? '' : 'sec'} sm" data-act="scope" data-arg="${o[0]}">${o[1]}</button>`).join('')}</div>
  ${best !== null ? `<p class="small mute">Bestes Ergebnis bisher: ${best} von ${TEST_N}</p>` : ''}
  <button class="btn big" data-act="testStart">Los geht’s! ▶</button></div>`;
};
function startTest() {
  if (limitHit()) return go('limit');
  const work = MODULES.filter(m => !isExtra(m)), begun = work.filter(m => m.topics.some(t => (S.decks[tk(m.id, t.id)] || { i: 0 }).i > 0));
  const mods = UI.scope === 'all' ? (begun.length ? begun : work) : MODULES.filter(m => m.id === UI.scope);   // „Alle Hefte gemischt“ = Arbeitsheft-Stoff, den das Kind schon angefangen hat
  const tops = []; mods.forEach(m => m.topics.forEach(t => tops.push(tk(m.id, t.id))));
  const qs = [], seen = new Set(); let pool = [];
  for (let i = 0; i < TEST_N; i++) {
    if (!pool.length) pool = shuffle(tops);
    const key = pool.pop(), d = S.decks[key], lvl = d ? Math.min(5, 2 + Math.floor(d.i / BLOCK)) : 2;
    qs.push({ tid: key, lvl, q: makeQ(key, lvl, seen) });
  }
  qs.forEach(x => x.c = newCtx(x.q));
  T = { qs, i: 0, start: Date.now(), dur: TEST_SECS, timer: null, scope: UI.scope };
  T.timer = setInterval(testTick, 1000);
  go('test');
}
/* Mini-Test übersteht Neuladen / Pull-to-refresh: Aufgaben, Antworten, aktuelle Aufgabe und Startzeit liegen in einem eigenen Schlüssel.
   Die Uhr läuft weiter wie in der Schule (Startzeit bleibt). Nach Abgabe oder Abbruch wird der Schlüssel gelöscht. */
const TEST_KEY = KEY + '_test';
function testPersist() {
  if (!T || T.done) return;
  try { localStorage.setItem(TEST_KEY, JSON.stringify({ v: 1, i: T.i, start: T.start, dur: T.dur, scope: T.scope, qs: T.qs.map(x => ({ tid: x.tid, lvl: x.lvl, q: x.q, c: { vals: x.c.vals, sel: x.c.sel, focus: x.c.focus } })) })); } catch (e) { }
}
function testClear() { try { localStorage.setItem(TEST_KEY, ''); } catch (e) { } }            // leeren statt löschen (die App löscht nie Schlüssel)
function testRestore() {
  let o = null; try { o = JSON.parse(localStorage.getItem(TEST_KEY) || 'null'); } catch (e) { }
  if (!o || !Array.isArray(o.qs) || !o.qs.length || !+o.start || !+o.dur) return false;
  if (Date.now() - o.start > (o.dur + 600) * 1000) { testClear(); return false; }          // längst vorbei: nicht wiederherstellen
  try {
    T = { qs: o.qs.map(x => { const c = newCtx(x.q), a = x.c || {};
      if (Array.isArray(a.vals) && a.vals.length === c.vals.length) c.vals = a.vals.map(v => String(v == null ? '' : v));
      c.sel = a.sel == null ? null : +a.sel; c.focus = Math.max(0, Math.min((c.vals.length || 1) - 1, +a.focus || 0));
      return { tid: x.tid, lvl: x.lvl, q: x.q, c }; }), i: Math.max(0, Math.min(o.qs.length - 1, +o.i || 0)), start: +o.start, dur: +o.dur, timer: null, scope: o.scope || 'all' };
    T.timer = setInterval(testTick, 1000);
    return true;
  } catch (e) { console.error(e); T = null; testClear(); return false; }
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
  if (!T || T.done) return; T.done = true; clearInterval(T.timer); closeModal(); testClear();
  let score = 0; const secs = Math.min(T.dur, Math.floor((Date.now() - T.start) / 1000)), left = T.dur - secs;
  T.qs.forEach(x => {
    const c = x.c, ok = isCorrect(c); x.ok = ok; if (ok) score++;
    noteAnswer(x.tid, ok); if (ok && typeof WA !== 'undefined') WA.addMiles(1); dailyCheck();
    x.ans = c.q.fields ? { vals: c.vals.slice() } : { sel: c.sel };
    if (!ok) addMistake(x.tid, x.q, x.ans);
  });
  touchDay();
  const passId = (typeof WA !== 'undefined') ? WA.testPass(score, T.qs.length) : null;
  const stars = testTier(score).s, pay = payTest(score), rewarded = !!(pay.c || pay.s || pay.chest), chest = pay.chest;
  if (score >= 13 && left > 360) S.stats.blitz = 1;
  S.tests.push({ ts: Date.now(), score, total: T.qs.length, secs, scope: T.scope }); if (S.tests.length > 60) S.tests.shift();
  T.res = { pass: passId, score, stars, coins: pay.c, stars2: pay.s, secs, timeUp, rewarded, chest };
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
  ${r.pass ? `<div class="fb ok" style="margin:10px auto;max-width:520px">✈️ <b>Boarding-Pass!</b> Du darfst dir in Meine Weltreise ein Land aussuchen.</div>` : ''}
  <p class="small mute">${testPrizeNote(r)}</p>
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
const shopGroups = () => { const g = ['fino']; Object.values(KIND).forEach(k => { if (!g.includes(k.group)) g.push(k.group); }); if (typeof wShopTickets === 'function') g.push('reisen'); return g; };
const shopTimeHTML = () => { const L = shopLeft(); return L === Infinity ? '' : `<span class="mute small">Shop-Zeit heute: <b id="shopT">${fmtT(L)}</b> übrig</span>`; };
function goalItem() { return S.goal && CATALOG[S.goal] && !hasItem(S.goal) ? CATALOG[S.goal] : null; }
const goalCard = () => {
  const g = goalItem(); if (!g) return `<div class="goalcard mute small">Wähle dir ein Sparziel: Tippe auf etwas, das dir gefällt, und lege es als Ziel fest.</div>`;
  const p = Math.min(100, Math.round(S.coins / g.src.price * 100)), left = Math.max(0, g.src.price - S.coins);
  return `<div class="goalcard"><span class="gth">${(KIND[g.kind] || { thumb: x => x.e }).thumb(g)}</span><div style="flex:1;min-width:0"><b>Dein Sparziel: ${esc(g.name)}</b><div class="bar"><i style="width:${p}%"></i></div><span class="small mute">${left ? `noch ${left} 🪙 (${g.src.price} 🪙 insgesamt)` : 'Du hast genug Münzen!'}</span></div></div>`;
};
VIEWS.shop = () => {
  const grp = UI.shopGrp || 'fino', groups = shopGroups(), lock = shopLeft() <= 0;
  const gtabs = `<div class="tabs">${groups.map(g => `<button class="${g === grp ? 'on' : ''}" data-act="shopGrp" data-arg="${g}">${ico((SHOP_GROUPS[g] || {}).ic || 'sparkle', 18)} ${(SHOP_GROUPS[g] || { label: g }).label}</button>`).join('')}</div>`;
  const head = `${topBar(ico('bag', 26) + ' Shop')}<div class="shophead">${goalCard()}${typeof giftCard === 'function' ? giftCard() : ''}${shopTimeHTML()}${lock ? '<div class="fb sp" style="margin-top:8px">Die Shop-Zeit für heute ist vorbei. Ansehen geht weiter – eingekauft wird morgen wieder.</div>' : ''}</div>`;
  if (grp === 'reisen' && typeof wShopTickets === 'function') return head + gtabs + wShopTickets();
  if (grp !== 'fino') {
    const kinds = Object.keys(KIND).filter(k => KIND[k].group === grp);
    const kind = kinds.includes(UI.shopKind) ? UI.shopKind : kinds[0];
    const ktabs = kinds.length > 1 ? `<div class="tabs">${kinds.map(k => `<button class="${k === kind ? 'on' : ''}" data-act="shopKind" data-arg="${k}">${KIND[k].label}</button>`).join('')}</div>` : '';
    const all = itemsOf(kind).filter(it => it.src.t === 'shop'), mine = all.filter(it => hasItem(it.id)).length;
    const open = all.filter(it => !hasItem(it.id)).sort((a, b) => a.src.price - b.src.price);
    const show = UI.shopAll || UI.shopHi ? all.slice().sort((a, b) => ((b.id === UI.shopHi) - (a.id === UI.shopHi)) || (hasItem(a.id) - hasItem(b.id)) || (a.src.price - b.src.price)) : open.slice(0, 8);
    const more = !UI.shopAll && !UI.shopHi && open.length > 8 ? `<div class="center" style="margin-top:12px"><button class="btn sec" data-act="shopAll">Alles ansehen (${open.length - 8} weitere)</button></div>` : '';
    return head + gtabs + ktabs + `<p class="mute small" style="margin:6px 4px">${KIND[kind].label}: ${mine} von ${all.length} gesammelt. Dinge mit Schloss sind noch nicht deine – tippe darauf, dann siehst du, was sie kosten.</p><div class="itiles">${show.map(it => itemTile(it, { inShop: true })).join('')}</div>${more}`;
  }
  const slot = SHOP[UI.shopTab] ? UI.shopTab : 'theme', cat = SHOP[slot], owned = S.owned[slot];
  const tabs = Object.keys(SHOP).map(k => `<button class="${k === slot ? 'on' : ''}" data-act="shopTab" data-arg="${k}">${SHOP[k].icon} ${SHOP[k].label}</button>`).join('');
  const none = cat.none ? `<div class="card item ${S.eq[slot] === null ? 'eq' : ''}"><div class="nonepv">✕</div><div class="nm">Ohne</div><button class="btn sm ${S.eq[slot] === null ? 'sec' : ''}" data-act="equip" data-arg="${slot}|">${S.eq[slot] === null ? 'Aktiv ✔' : 'Auswählen'}</button></div>` : '';
  const items = cat.items.map(it => {
    const has = owned.includes(it.id), on = S.eq[slot] === it.id, can = S.coins >= it.price;
    const btn = has ? `<button class="btn sm ${on ? 'sec' : ''}" data-act="equip" data-arg="${slot}|${it.id}">${on ? 'Aktiv ✔' : 'Benutzen'}</button>`
      : `<button class="btn sm ${can && !lock ? '' : 'sec'}" data-act="buy" data-arg="${slot}|${it.id}">${can ? 'Kaufen' : 'Noch ' + (it.price - S.coins) + ' 🪙'}</button>`;
    return `<div class="card item ${on ? 'eq' : ''} ${has ? '' : 'lk'}">${has ? '' : LOCK}<div class="pv">${itemPreview(slot, it)}</div><div class="nm">${it.name}</div>${has ? '<div class="small mute">Gehört dir ✔</div>' : `<div class="price">🪙 ${it.price}</div>`}${btn}</div>`;
  }).join('');
  return head + `${gtabs}<div class="tabs">${tabs}</div><div class="items">${none}${items}</div>`;
};
function buy(slot, id) {
  const it = SHOP[slot].items.find(x => x.id === id);
  if (!it || S.owned[slot].includes(id) || S.coins < it.price || shopLeft() <= 0) return;
  S.coins -= it.price; S.owned[slot].push(id); S.stats.bought++; S.eq[slot] = id;
  checkTrophies(); save(); closeModal(); render(); sfx('magic'); toast('🎁', `${it.name} gehört jetzt dir!`);
}
function equip(slot, id) { if (id && !S.owned[slot].includes(id)) return; S.eq[slot] = id || null; save(); render(); }

/* ----- Pokale ----- */
VIEWS.trophies = () => {
  const L = trophyList(), got = L.filter(t => S.trophies[t.id]).length;
  const sorted = L.slice().sort((a, b) => (S.trophies[b.id] ? 1 : 0) - (S.trophies[a.id] ? 1 : 0) || (S.trophies[a.id] && S.trophies[b.id] ? (+S.trophies[b.id] || 0) - (+S.trophies[a.id] || 0) : 0) || ((a.s && !S.trophies[a.id]) ? 1 : 0) - ((b.s && !S.trophies[b.id]) ? 1 : 0));
  const mp = MODULES.map(m => { const md = m.topics.map(t => medalOf(tk(m.id, t.id)) ? MEDALS[medalOf(tk(m.id, t.id))] : '').join(''); return md ? `<span class="pk-med"><b>${esc(m.id)}</b>${md}</span>` : ''; }).join('');
  const ddmm = ts => { const d = new Date(+ts); return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0'); };
  const yrOf = ts => (+ts > 1e11 ? new Date(+ts).getFullYear() : 0);
  return topBar(ico('trophy', 26) + ' Pokale') + `<div class="card pk-head"><b>${got} von ${L.length} Pokalen</b><div class="bar" style="margin-top:6px"><i style="width:${Math.round(got / L.length * 100)}%"></i></div>
  ${mp ? `<div class="pk-meds" aria-label="Medaillen pro Gruppe">${mp}</div>` : ''}
  <div class="small mute" style="margin-top:8px">Medaillen: 🥉 Stufe 1 · 🥈 Stufe 2 · 🥇 alle 30 Aufgaben · 💎 mit mindestens 54 von 60 Punkten.</div></div>
  ${(() => {
    const tile = t => { const h = S.trophies[t.id], hid = t.s && !h; return `<div class="pk-b${h ? ' got' : ' lock'}">${h && yrOf(h) ? `<time class="pk-dt" datetime="${new Date(+h).toISOString().slice(0, 10)}">${ddmm(h)}</time>` : ''}<span class="pk-i">${hid ? '❓' : t.i}</span><b>${hid ? 'Geheimer Pokal' : esc(t.n)}</b><span class="pk-d">${hid ? 'Finde heraus, wie man ihn bekommt!' : esc(t.d)}</span>${h ? '' : '<small>Noch nicht geschafft</small>'}</div>`; };
    const earned = sorted.filter(t => S.trophies[t.id]), open = sorted.filter(t => !S.trophies[t.id]), yrs = [...new Set(earned.map(t => yrOf(S.trophies[t.id])))].sort((a, b) => b - a);
    const sec = (title, list) => `<h3 class="pk-yr">${title}</h3><div class="pk-grid">${list.map(tile).join('')}</div>`;
    return yrs.map(y => sec(y || 'Früher', earned.filter(t => yrOf(S.trophies[t.id]) === y))).join('') + (open.length ? sec('Noch offen', open) : '');
  })()}`;
};

/* ----- limit ----- */
VIEWS.limit = () => `<div class="card result"><div style="margin:auto;width:170px">${avatarHTML(eqAvatar(), 170, 'think')}</div>
  <h2>Für heute reicht’s!</h2><p>Du hast heute schon <b>${usedMin()} Minuten</b> geübt. Pausen sind wichtig – morgen geht es weiter. Dein Fortschritt ist gespeichert.</p>
  <div class="row wrap" style="justify-content:center"><button class="btn big" data-act="home">Zum Start</button><button class="btn sec big" data-act="limitUnlock">Eltern: heute weiter üben</button></div></div>`;

/* ----- Eltern: siehe feat_eltern.js ----- */
function exportData() {
  const j = JSON.stringify(S, null, 1);
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([j], { type: 'application/json' })); a.download = 'denkzauber-sicherung-' + ymd() + '.json'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { }
  S.lastBackup = Date.now(); save();
  const t = $('#expTxt'); if (t) { t.value = j; t.classList.remove('hide'); }
  toast('💾', 'Sicherung erstellt');
}
/* Sicherung laden – mit Vorher/Nachher-Vergleich, damit Eltern sehen: nichts ist verloren gegangen.
   Der bisherige Stand wird vor dem Ersetzen unter PREIMPORT_KEY aufgehoben (nur hinzufügen, nie löschen). */
const PREIMPORT_KEY = 'mathe_abenteuer_preimport';
function saveSummary(o) {
  o = o || {};
  const own = Object.values(o.owned || {}).reduce((n, a) => n + (Array.isArray(a) ? a.length : 0), 0) + Object.keys(o.unl || {}).length;
  return { coins: o.coins || 0, stars: o.starsLife || 0, q: (o.stats && o.stats.q) || 0, decks: Object.values(o.decks || {}).filter(d => d && d.i >= DECK_N).length,
    cards: Object.keys(o.cards || {}).length, chests: o.chests || 0, trophies: Object.keys(o.trophies || {}).length, items: own, songs: (o.songs || []).length };
}
const SUM_LABELS = [['coins', '🪙 Münzen'], ['stars', '⭐ Sterne gesammelt'], ['q', '✔ gelöste Aufgaben'], ['decks', '📗 fertige Übungen'], ['cards', '🃏 Karten'], ['chests', '📦 Karten zum Aufdecken'], ['trophies', '🏆 Pokale'], ['items', '🎁 Dinge im Besitz'], ['songs', '🎵 Beats']];
const sumTable = (cols, rows) => `<table class="tbl sumtbl"><tr><th></th>${cols.map(c => `<th>${c}</th>`).join('')}</tr>${SUM_LABELS.map(([k, l]) => `<tr><td>${l}</td>${rows.map(r => `<td>${r[k]}</td>`).join('')}</tr>`).join('')}</table>`;
function importData(txt, force) {
  let o;
  try { o = JSON.parse(txt); if (!o || typeof o.coins !== 'number') throw 0; } catch (e) { toast('⚠️', 'Die Datei konnte nicht gelesen werden.'); return; }
  const file = saveSummary(o);
  if (!force) {
    UI.pending = txt;
    modal('Sicherung laden?', `So sieht der Stand in der Datei aus – und so der Stand hier:${sumTable(['Datei', 'Jetzt hier'], [file, saveSummary(S)])}<p class="small mute">Der jetzige Stand wird ersetzt (er wird vorher zusätzlich aufgehoben).</p>`, 'Ja, laden', 'importYes', '', 'Nein');
    return;
  }
  try { localStorage.setItem(PREIMPORT_KEY, JSON.stringify(S)); } catch (e) { }
  S = mergeState(o); save();
  /* Prüfen: Münzen = Datei (+ einmalig 3 je alter Flamme), alles andere gleich (Besitz darf nur mehr werden) */
  const now = saveSummary(S), exp = Object.assign({}, file, { coins: file.coins + (o.mig3 ? 0 : (o.flames || 0) * 3) });
  const bad = SUM_LABELS.map(x => x[0]).filter(k => k === 'items' ? now[k] < exp[k] : now[k] !== exp[k]);
  go('home', { say: '' });
  modal(bad.length ? 'Bitte prüfen' : 'Geladen und geprüft ✓', `${bad.length ? 'Diese Werte weichen ab: ' + bad.map(k => SUM_LABELS.find(x => x[0] === k)[1]).join(', ') + '. Der vorherige Stand ist aufgehoben.' : 'Alles aus der Sicherung ist da.'}${sumTable(['Datei', 'Jetzt geladen'], [exp, now])}${o.flames && !o.mig3 ? `<p class="small mute">Alte Flammen wurden einmalig in Münzen umgerechnet (${o.flames} × 3).</p>` : ''}`, '', '', '', 'OK');
}

/* ----- PIN ----- */
function requirePin(act, arg, always) {
  if (ADMIN || (!always && Date.now() < UI.pinUntil)) { ACT[act](arg); return; }
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
    else {
      const j = fs.findIndex((x, i) => x.next === c.focus && !c.locked[i]);
      if (j >= 0) { c.focus = j; c.vals[j] = ''; c.marks[j] = null; }
      else { for (let t = 1; t < fs.length; t++) { const p = (c.focus - t + fs.length) % fs.length; if (!c.locked[p] && p < c.focus) { c.focus = p; break; } } }   // zurück zum vorigen Feld
    }
  } else if (k === ',') {
    if ((/,/.test(fo.a) || fo.dec) && !fo.digit && c.vals[c.focus] !== '' && !c.vals[c.focus].includes(',')) { c.vals[c.focus] += ','; c.marks[c.focus] = null; }
  } else if (/^\d$/.test(k)) {
    if (fo.digit) { c.vals[c.focus] = k; c.marks[c.focus] = null; if (fo.next != null) c.focus = fo.next; }
    else if (c.vals[c.focus].replace(',', '').length < 8) {
      c.vals[c.focus] += k; c.marks[c.focus] = null;
      if (fs.length > 1 && normIn(c.vals[c.focus]).length >= String(fo.a).length) autoNext(c);      // Zahl fertig getippt -> nächstes Feld
    }
  }
  render();
}
function autoNext(c) {                                // springt zum nächsten freien Feld (nach rechts/unten)
  const n = c.q.fields.length;
  for (let t = 1; t < n; t++) { const j = (c.focus + t) % n; if (!c.locked[j] && normIn(c.vals[j]) === '') { c.focus = j; return; } }
}
function move(c, d) {
  const n = c.q.fields.length; let i = c.focus;
  for (let t = 0; t < n; t++) { i = (i + d + n) % n; if (!c.locked[i]) break; }
  c.focus = i;
}
const curCtx = () => view === 'play' ? R.ctx : view === 'test' ? T.qs[T.i].c : null;

const ACT = {
  home: () => { if (T && T.timer) clearInterval(T.timer); go('home', { say: '' }); },
  mod: id => { const m = MODULES.find(x => x.id === id); return m && isExtra(m) ? go('kopf', { mod: id }) : go('module', { mod: id }); },
  kopf: () => go('kopf'),
  kopfTopic: key => { if (findTopic(key)) go('topic', { mod: key.split('.')[0], key }); },
  backMod: () => { const id = UI.key ? UI.key.split('.')[0] : UI.mod, m = MODULES.find(x => x.id === id); return m && isExtra(m) ? go('kopf') : go('module', { mod: id }); },
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
    modal('Gruppe zurücksetzen?', `<b>${f.topic.t}</b>: Alle 30 Aufgaben werden durch <b>neue Aufgaben</b> ersetzt. Fortschritt und Punkte dieser Gruppe gehen auf 0.<br><br>Münzen und Sterne im Geldbeutel bleiben. Pro Gruppe gibt es aber nie mehr als ${NEW_DECK_MAX} 🪙 und ${STARS_MAX} ⭐ – wer die Gruppe nochmal löst, bekommt nur Belohnungen über dem bisherigen Bestwert.`, 'Ja, zurücksetzen', 'resetTopicYes', key, 'Nein, behalten');
  },
  newRound: () => {
    const key = UI.key, f = findTopic(key);
    modal('Neue Runde starten?', `<b>${f.topic.t}</b>: Du bekommst <b>30 ganz neue Aufgaben</b> – und kannst wieder Münzen und Sterne sammeln.<br><br>Deine Münzen, Sterne, Medaille und Pokale bleiben. Nur die Ergebnisse der alten Runde werden ersetzt (dein Rekord wird gemerkt).`, 'Ja, neue Runde', 'newRoundYes', key, 'Nein, später');
  },
  newRoundYes: key => { closeModal(); if (newRound(key)) { toast('🔁', 'Neue Runde – neue Aufgaben!'); } go('topic', { key }); },
  resetTopicYes: key => { closeModal(); resetDeck(key); toast('🔄', 'Gruppe zurückgesetzt – neue Aufgaben!'); go('topic', { key }); },
  mistakes: () => go('mistakes'), mistakeRound: startMistakes,
  key: k => press(k), check, next, pick: i => pickChoice(+i),
  hint: () => { const c = curCtx(); if (c && c.state === 'ask') { c.showHint = true; c.hinted = true; render(); } },
  foc: i => { const c = curCtx(); if (c && c.state === 'ask' && c.q.fields && !c.locked[+i]) { c.focus = +i; render(); } },
  quit: () => view === 'test'
    ? modal('Test abbrechen?', 'Dein Test wird nicht gewertet.', 'Ja, abbrechen', 'quitYes', '', 'Weiter rechnen')
    : modal('Pause machen?', 'Alles ist gespeichert. Du kannst jederzeit genau hier weitermachen.', 'Ja, Pause', 'quitYes', '', 'Weiter üben'),
  quitYes: () => { closeModal(); if (view === 'test') { if (T && T.timer) clearInterval(T.timer); if (T) T.done = true; testClear(); go('home', { say: '' }); } else if (R && R.kind === 'deck') go('topic', { key: R.key }); else go('mistakes'); },
  testSetup: () => go('testSetup'), scope: s => { UI.scope = s; render(); }, testStart: startTest,
  testAsk, testFinish: () => finishTest(false),
  goQ: i => { T.i = +i; render(); }, nextQ: () => { if (T.i < T.qs.length - 1) { T.i++; render(); } }, prevQ: () => { if (T.i > 0) { T.i--; render(); } },
  shop: () => go('shop', { shopHi: null, shopAll: false }), shopTab: s => { UI.shopTab = s; render(); },
  buy: a => {
    const [sl, id] = a.split('|'), it = SHOP[sl].items.find(x => x.id === id);
    if (shopLeft() <= 0) return modal('Shop-Zeit vorbei', 'Für heute ist die Shop-Zeit aufgebraucht. Morgen kannst du wieder einkaufen.');
    if (S.coins < it.price) return modal('Noch nicht genug Münzen', `<b>${it.name}</b> kostet <b>🪙 ${it.price}</b>. Dir fehlen noch <b>${it.price - S.coins} 🪙</b>. Beim Üben verdienst du sie.`, '', 'closeModal');
    modal('Bist du ganz sicher?', `${itemPreview(sl, it)}<br><b>${it.name}</b> kostet <b>🪙 ${it.price}</b>. Danach hast du noch ${S.coins - it.price} 🪙.<br><br><b>Ein Kauf kann nicht rückgängig gemacht werden.</b> Du bekommst das Geld nicht zurück.`, 'Ja, kaufen', 'buyYes', a, 'Nein, noch nicht');
  },
  buyYes: a => { const [s, id] = a.split('|'); buy(s, id); },
  equip: a => { const [s, id] = a.split('|'); equip(s, id); },
  shopGrp: g => { UI.shopGrp = g; UI.shopKind = null; UI.shopAll = false; UI.shopHi = null; render(); }, shopKind: k => { UI.shopKind = k; UI.shopAll = false; UI.shopHi = null; render(); },
  buyItemAsk: id => { const it = CATALOG[id]; if (!it) return; const W = S.coins, P = it.src.price, th = (KIND[it.kind] || { thumb: x => x.e }).thumb(it);
    const pv = `<div class="ith" style="margin:0 auto 8px;width:96px;height:96px;display:flex;align-items:center;justify-content:center;font-size:3rem">${th}</div><b>${esc(it.name)}</b> kostet <b>🪙 ${P}</b>. `;
    if (shopLeft() <= 0) return modal('Shop-Zeit vorbei', 'Für heute ist die Shop-Zeit aufgebraucht. Morgen kannst du wieder einkaufen.');
    if (W < P) return modal('Noch nicht genug Münzen', `${pv}Dir fehlen noch <b>${P - W} 🪙</b>. Das schaffst du beim Üben!`, S.goal === id ? '' : 'Als Sparziel merken', 'setGoal', id, 'Zurück');
    modal('Bist du ganz sicher?', `${pv}Danach hast du noch ${W - P} 🪙.<br><br><b>Ein Kauf kann nicht rückgängig gemacht werden.</b> Du bekommst das Geld nicht zurück.`, 'Ja, kaufen', 'buyItemYes', id, 'Nein, noch nicht'); },
  setGoal: id => { S.goal = id; save(); closeModal(); render(); toast('🎯', 'Sparziel gesetzt'); },
  shopAt: id => shopAt(id), shopAll: () => { UI.shopAll = true; render(); },
  buyItemYes: id => { closeModal(); const it = CATALOG[id]; if (buyItem(id)) { render(); sfx('magic'); toast('🎁', `${esc(it.name)} gehört jetzt dir!`); } },
  trophies: () => go('trophies'),
  parent: () => requirePin('parentGo', undefined, true), parentGo: () => go('parent'), print: () => window.print(),
  dzFlag: id => { S.flags = S.flags || {}; S.flags[id] = !flagOn(id); save(); render(); },
  saveName: () => { S.name = ($('#nameIn').value || '').trim().slice(0, 20); save(); toast('✅', 'Gespeichert'); render(); },
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
  else if (t.id === 'cfgSound') { S.cfg.sound = t.value === '1'; save(); toast('✅', S.cfg.sound ? 'Töne an' : 'Töne aus'); }
  else if (t.id === 'cfgCrMode') { S.cfg.creativeMode = t.value; save(); toast('✅', 'Kreativzeit: ' + t.options[t.selectedIndex].text); }
  else if (t.id === 'cfgCrMin') { S.cfg.creativeMin = +t.value; save(); toast('✅', 'Kreativzeit: ' + t.value + ' Minuten'); }
  else if (t.id === 'cfgCrMax') { S.cfg.creativeMax = +t.value; save(); toast('✅', 'Gespeichert'); }
  else if (t.id === 'cfgShop') { S.cfg.shopMin = +t.value; save(); toast('✅', +t.value ? 'Shop-Zeit: ' + t.value + ' Minuten' : 'Shop-Zeit unbegrenzt'); }
  else if (/^due_[A-D]$/.test(t.id)) { S.cfg.due = S.cfg.due || {}; if (t.value) S.cfg.due[t.id.slice(4)] = t.value; else delete S.cfg.due[t.id.slice(4)]; save(); toast('✅', 'Termin gespeichert'); }
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

registerFeature({ id: 'shop', title: 'Shop', icon: 'bag', tint: 'butter', group: 'earn', order: 20, sub: () => 'Hier gibst du Münzen aus', view: 'shop' });
registerFeature({ id: 'trophies', title: 'Pokale', icon: 'trophy', tint: 'sage', group: 'earn', order: 30, sub: () => `${Object.keys(S.trophies).length} gesammelt`, view: 'trophies' });
