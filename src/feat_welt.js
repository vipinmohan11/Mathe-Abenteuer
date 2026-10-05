/* =====================================================================
   WELT: „Meine Weltreise“ – ruhige Belohnung in Meine Welt
   ---------------------------------------------------------------------
   Daten: world_data.js (WP = Länder, WSTAT = 6 Stationen). Zustand: S.world (Standardwerte in store.js DEF).
   Sterne: frei = gesammelte Sterne (S.starsLife) − für Länder ausgegebene (S.world.spent). S.stars / S.starsLife werden hier NIE geschrieben,
           Wesen, Pokale, Münzen und Karten bleiben unberührt. Weltreise zahlt weder Münzen noch Karten aus (nur Souvenirs, Stempel, Pokale).
   Ein geöffnetes Land bleibt für immer offen, alle Stationen frei wählbar. Stempel nach W_STAMP_AT von 6 Stationen.
   Die Oberfläche spricht nur mit dem Adapter WA (unten) – nie direkt mit S.
   Eltern (PIN): Name im Pass, Foto (Avatar/Fino), welche noch gesperrten Länder angeboten werden.
   ===================================================================== */
const W_NAME = 'Meine Weltreise', W_PASS = 'Mein Reisepass';
const wDay = () => ymd();
function wS() {
  const w = S.world || (S.world = {});
  ['open', 'seen', 'stamps', 'souv', 'quiz', 'pass', 'off'].forEach(k => { if (!w[k] || typeof w[k] !== 'object' || Array.isArray(w[k])) w[k] = {}; });
  if (!Array.isArray(w.log)) w.log = [];
  if (typeof w.spent !== 'number' || w.spent < 0) w.spent = 0;
  return w;
}

/* ---------- Adapter: die einzige Tür zum Zustand ---------- */
const WA = {
  freeStars: () => Math.max(0, (S.starsLife || 0) - wS().spent),
  isOpen: id => !!WP[id] && (WP[id].cost === 0 || !!wS().open[id]),
  shown: id => !!WP[id] && (WA.isOpen(id) || !wS().off[id]),                  // vom Elternteil ausgeblendete, noch gesperrte Länder
  canOpen: id => !!WP[id] && !WA.isOpen(id) && WA.freeStars() >= WP[id].cost,
  openCountry(id) {
    if (!WA.canOpen(id)) return false;
    const w = wS(); w.spent += WP[id].cost; w.open[id] = wDay(); save(); return true;
  },
  seen: id => wS().seen[id] || {},
  marks: id => WSTAT.filter(s => WA.seen(id)[s[0]]).length,
  pct: id => Math.round(100 * WA.marks(id) / WSTAT.length),
  stamped: id => !!wS().stamps[id],
  stampN: () => Object.keys(wS().stamps).length,
  souvs: id => wS().souv[id] || [],
  souvN: () => Object.values(wS().souv).reduce((a, l) => a + (Array.isArray(l) ? l.length : 0), 0),
  addSouv(id, st) { const w = wS(), l = w.souv[id] || (w.souv[id] = []); if (!l.includes(st)) { l.push(st); return true; } return false; },
  markSeen(id, st) {                                                       // true = neu besucht
    if (!WA.isOpen(id) || !WSTAT.some(x => x[0] === st)) return false;
    const w = wS(), sn = w.seen[id] || (w.seen[id] = {});
    if (sn[st]) return false;
    sn[st] = wDay();
    if (st !== 'quiz') WA.addSouv(id, st);
    w.log.unshift({ c: id, st, d: wDay() }); if (w.log.length > 40) w.log.length = 40;
    if (!w.stamps[id] && WA.marks(id) >= W_STAMP_AT) { w.stamps[id] = wDay(); UI.wStampNew = id; }
    save(); checkTrophies();
    return true;
  },
  saveQuiz(id, score) {
    const w = wS(), q = w.quiz[id] || (w.quiz[id] = { best: 0, tries: 0 });
    q.tries++; q.best = Math.max(q.best, score);
    if (score >= W_QUIZ_OK) { WA.addSouv(id, 'quiz'); WA.markSeen(id, 'quiz'); }
    save();
  },
  photo: size => (wS().pass.photo === 'fino') ? avatarHTML(finoLook(), size, 'happy') : avArt(size),
  childName: () => wS().pass.name || S.name || profileName(),
  exit: () => go('rewards')
};

/* ---------- Pokale (kein Geld dafür): Land · Kultur · Sprache · Orte · selten · geheim ---------- */
function worldTrophies() {
  const W = s => s.world || {}, seen = s => Object.values(W(s).seen || {}).filter(Boolean);
  const cnt = (s, st) => seen(s).filter(o => o[st]).length, culture = s => seen(s).filter(o => o.life && o.food).length;
  const stampIds = s => Object.keys(W(s).stamps || {}), conts = s => new Set(stampIds(s).map(id => (WP[id] || {}).cont).filter(Boolean)).size;
  const souvN = s => Object.values(W(s).souv || {}).reduce((a, l) => a + (Array.isArray(l) ? l.length : 0), 0);
  const masters = s => Object.keys(W(s).seen || {}).filter(id => WSTAT.every(x => W(s).seen[id][x[0]]) && ((W(s).souv || {})[id] || []).length >= WSTAT.length).length;
  const quiz4 = s => Object.values(W(s).quiz || {}).filter(q => q && q.best >= 4).length;
  const hid = (id, i, n, d, t) => ({ id, get i() { return S.trophies[id] ? i : '❓'; }, get n() { return S.trophies[id] ? n : 'Geheimer Pokal'; }, get d() { return S.trophies[id] ? d : 'Entdecke, wie du ihn bekommst.'; }, t });
  const fam = (p, i, n1, n2, n3, what, f, a, b, c) => [[1, n1, a], [2, n2, b], [3, n3, c]].map(([k, nm, num]) => ({ id: p + k, i, n: nm, d: what(num), t: s => f(s) >= num }));
  return [
    ...fam('wc', '🧭', 'Erster Stempel', 'Weltenbummler', 'Globetrotter', n => n === 1 ? '1 Stempel im Reisepass' : n + ' Stempel im Reisepass', s => stampIds(s).length, 1, 3, 10),
    { id: 'wc4', i: '🌍', n: 'Weltreisende', d: 'Alle 20 Stempel im Reisepass', t: s => stampIds(s).length >= 20 },
    ...fam('wk', '🎭', 'Kultur-Entdecker', 'Kultur-Kenner', 'Kultur-Profi', n => `Alltag und Essen in ${n} ${n === 1 ? 'Land' : 'Ländern'} besucht`, culture, 1, 5, 10),
    ...fam('ws', '💬', 'Sprachfuchs', 'Sprachtalent', 'Sprachkünstler', n => `Sprach-Station in ${n} ${n === 1 ? 'Land' : 'Ländern'} besucht`, s => cnt(s, 'language'), 1, 5, 10),
    ...fam('wl', '🏛️', 'Orte-Entdecker', 'Orte-Kenner', 'Orte-Profi', n => `Orte in ${n} ${n === 1 ? 'Land' : 'Ländern'} besucht`, s => cnt(s, 'places'), 1, 5, 10),
    ...fam('wm', '🎖️', 'Länder-Meister', 'Dreifach-Meister', 'Zehnfach-Meister', n => n === 1 ? 'Alle 6 Stationen und alle 6 Souvenirs in einem Land' : `Meister in ${n} Ländern`, masters, 1, 3, 10),
    hid('whello', '👋', 'Hallo in 5 Sprachen', 'Die Sprach-Station in 5 Ländern besucht', s => cnt(s, 'language') >= 5),
    hid('wsouv', '🧳', 'Souvenir-Fan', '12 Souvenirs gesammelt', s => souvN(s) >= 12),
    hid('wquiz', '🦊', 'Rätsel-Fuchs', 'In 3 Ländern alle 4 Rätselfragen richtig', s => quiz4(s) >= 3),
    hid('whome', '🏡', 'Zuhause entdeckt', 'Alle 6 Stationen in Deutschland besucht', s => WSTAT.every(x => ((W(s).seen || {}).deu || {})[x[0]])),
    hid('wround', '🌏', 'Rund um die Welt', 'Stempel auf 5 Kontinenten', s => conts(s) >= 5)
  ];
}

/* ---------- kleine Bausteine ---------- */
const wMarkSVG = on => on
  ? '<svg class="w-mk on" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="currentColor"/><path d="M8 2.8l2.7 5.2L8 13.2 5.3 8z" fill="#fff"/></svg>'
  : '<svg class="w-mk" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const wDots = id => `<span class="w-dots" aria-hidden="true">${WSTAT.map(s => wMarkSVG(!!WA.seen(id)[s[0]])).join('')}</span>`;
const wStarChip = () => `<span class="w-free" title="Freie Sterne für neue Länder"><b>${WA.freeStars()}</b> freie ⭐</span>`;
const wBar = (title, back, backLabel, extra) => topBar(esc(title), back, extra ? `<div class="w-bar-x">${extra}</div>` : '');
const wRoot = body => `<div class="w-root">${body}</div>`;
const wShortDate = d => { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(d || ''); return m ? `${m[3]}.${m[2]}.` : ''; };
const wCompass = '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="24" cy="24" r="19"/><path d="m29 19-3 8-8 3 3-8 8-3Z"/></svg>';

/* ---------- Abflughalle ---------- */
function wCard(p) {
  const open = WA.isOpen(p.id);
  if (open) return `<button class="w-card open" data-act="wBoard" data-arg="${p.id}" aria-label="${esc(p.name)}, Reise starten, ${WA.marks(p.id)} von ${WSTAT.length} Stationen besucht${WA.stamped(p.id) ? ', Stempel erhalten' : ''}">
    ${wFlag(p.id, 'w-cflag')}<b>${esc(p.name)}</b><small>${esc(p.sub)}</small>${wDots(p.id)}${WA.stamped(p.id) ? `<span class="w-cstamp">${ico('stamp', 14)} Stempel</span>` : ''}</button>`;
  const can = WA.canOpen(p.id);
  return `<button class="w-card locked ${can ? 'can' : ''}" data-act="wLock" data-arg="${p.id}" aria-label="${esc(p.name)}, gesperrt, kostet ${p.cost} Sterne${can ? ', du kannst es öffnen' : ''}">
    <span class="w-cflagwrap">${wFlag(p.id, 'w-cflag')}<i class="w-lockic">${ico('lock', 16)}</i></span><b>${esc(p.name)}</b><small>${esc(p.sub)}</small><span class="w-price">${p.cost} ⭐${can ? ' · bereit' : ''}</span></button>`;
}
VIEWS.welt = () => {
  const all = wList().filter(p => WA.shown(p.id)), open = all.filter(p => WA.isOpen(p.id)), locked = all.filter(p => !WA.isOpen(p.id));
  return wRoot(wBar(W_NAME, 'rewards', 'Meine Welt', `<button class="w-pill" data-act="wPassGo">${ico('stamp', 18)} ${W_PASS}</button>`)
    + `<section class="w-depart"><div><h2>Wohin möchtest du reisen?</h2><p>Ein Land kostet einmal ein paar freie ⭐. Danach bleibt es für immer offen.</p></div>
      <div class="w-bal"><b>${WA.freeStars()}</b><span>freie ⭐</span><small>${S.starsLife} gesammelt${wS().spent ? ` · ${wS().spent} ausgegeben` : ''}</small></div></section>
    <h3 class="w-sec">Meine Reisen</h3><div class="w-grid">${open.map(wCard).join('')}</div>
    ${locked.length ? `<h3 class="w-sec">Weitere Ziele</h3><div class="w-grid">${locked.map(wCard).join('')}</div>` : ''}
    <p class="w-foot">Sterne bekommst du beim Üben. Deine Sterne, Wesen und Pokale bleiben, wie sie sind.</p>`);
};

/* ---------- Reise: links Szene + Begleiter, rechts Route + Station ---------- */
const wSouvLine = (p, st) => {
  const s = p.souv[st]; if (!s || !WA.souvs(p.id).includes(st)) return '';
  return `<div class="w-souvline">${wSouvSVG(s, false)}<span>Souvenir: <b>${esc(s.n)}</b>${UI.wNew === p.id + ':' + st ? ' · neu im Pass' : ''}</span></div>`;
};
const wHead = (p, d, extra) => `<div class="w-head"><div><h2>${esc(d.title)}</h2><p>${esc(d.lead)}</p></div>${wFlag(p.id, 'w-hflag')}</div>
  <div class="w-note"><span class="w-note-pic">${p.guide.svg}</span><p><b>${esc(p.guide.name)}:</b> ${esc(d.guide)}</p></div>${extra || ''}`;
const wItems = items => `<div class="w-items">${items.map(i => `<div class="w-item">${wInfoIco(i[0])}<div><small>${esc(i[1])}</small><b>${esc(i[2])}</b></div></div>`).join('')}</div>`;
const wRich = rich => rich && rich.length ? `<div class="w-rich">${rich.map(r => `<div><b>${esc(r[0])}</b><p>${esc(r[1])}</p></div>`).join('')}</div>` : '';
const wCards = cards => `<div class="w-cards">${cards.map(c => `<article class="w-pc">${wArt(c[0])}<b>${esc(c[1])}</b><p>${esc(c[2])}</p></article>`).join('')}</div>`;
function wWords(p, d) {
  return `<div class="w-words">${d.words.map((w, i) => `<div class="w-word"><div class="w-word-t"><b lang="${p.speech.slice(0, 2)}">${esc(w[0])}</b>${w[1] ? `<span>${esc(w[1])}</span>` : ''}</div><div class="w-word-m"><span>${esc(w[2])}</span><small>Sprich: ${esc(w[3])}</small></div>
    <button class="w-spk" data-act="wSay" data-arg="${i}" aria-label="${esc(w[0])} anhören">${ico('speaker', 22)}</button></div>`).join('')}</div>`;
}
function wQuizBuild(p) { return { id: p.id, i: 0, done: false, score: 0, qs: shuffle(p.quiz).map(x => ({ q: x.q, ok: x.ok, opts: shuffle([x.ok].concat(x.bad)), pick: null })) }; }
function wQuiz(p) {
  const Q = UI.wQz && UI.wQz.id === p.id ? UI.wQz : null, best = (wS().quiz[p.id] || {}).best || 0, n = p.quiz.length;
  const head = `<div class="w-head"><div><h2>Rätsel: ${esc(p.name)}</h2><p>${n} Fragen. Du kannst es so oft versuchen, wie du möchtest. Ab ${W_QUIZ_OK} richtigen gibt es ein Souvenir.</p></div>${wFlag(p.id, 'w-hflag')}</div>`;
  if (!Q) return head + `<div class="w-quiz-intro"><p>${best ? `Dein bestes Ergebnis: <b>${best} von ${n}</b>.` : 'Bereit für dein erstes Rätsel?'}</p><button class="btn big" data-act="wQuizStart">${best ? 'Noch mal rätseln' : 'Rätsel starten'}</button></div>${wSouvLine(p, 'quiz')}`;
  if (Q.done) {
    const pass = Q.score >= W_QUIZ_OK;
    return head + `<div class="w-quiz-res"><h3>${Q.score} von ${n} richtig</h3><p>${Q.score === n ? 'Alles richtig. Das war ein Rätsel für Entdecker.' : pass ? 'Gut gemacht! Das letzte Souvenir ist da.' : 'Noch nicht ganz. Schau dir die Stationen an und probiere es gleich noch mal.'}</p>
      <div class="row wrap" style="justify-content:center"><button class="btn big" data-act="wQuizStart">Noch mal</button><button class="btn sec big" data-act="wStation" data-arg="arrival">Weiter erkunden</button></div></div>${wSouvLine(p, 'quiz')}`;
  }
  const q = Q.qs[Q.i], done = q.pick != null, last = Q.i === Q.qs.length - 1;
  return head + `<div class="w-q" aria-live="polite"><small>Frage ${Q.i + 1} von ${Q.qs.length}</small><h3>${esc(q.q)}</h3>
    <div class="w-qopts">${q.opts.map((o, k) => { const c = !done ? '' : o === q.ok ? 'ok' : (k === q.pick ? 'bad' : 'dim'); return `<button class="ch w-qo ${c}" data-act="wQuizPick" data-arg="${k}" ${done ? 'aria-disabled="true"' : ''}>${done && o === q.ok ? '✔ ' : done && k === q.pick ? '✕ ' : ''}${esc(o)}</button>`; }).join('')}</div>
    ${done ? `<p class="w-qfb">${q.opts[q.pick] === q.ok ? '✔ Richtig!' : `✕ Nicht ganz. Richtig ist: <b>${esc(q.ok)}</b>`}</p><button class="btn big" data-act="wQuizNext">${last ? 'Ergebnis ansehen' : 'Weiter'}</button>` : ''}</div>`;
}
function wStation(p, st) {
  const d = p.st[st];
  if (st === 'quiz') return wQuiz(p);
  let body = '';
  if (st === 'arrival') body = `<div class="w-story"><span class="w-note-pic big">${p.guide.svg}</span><p>${esc(p.story)}</p></div>` + wHead(p, d) + wItems(d.items) + wRich(d.rich);
  else if (st === 'life') body = wHead(p, d) + wItems(d.items);
  else if (st === 'language') body = wHead(p, d) + wWords(p, d);
  else body = wHead(p, d) + wCards(d.cards) + wRich(d.rich);
  return body + wSouvLine(p, st);
}
VIEWS.weltReise = () => {
  const p = WP[UI.wId];
  if (!p || !WA.isOpen(p.id)) return VIEWS.welt();
  const st = UI.wSt && WSTAT.some(x => x[0] === UI.wSt) ? UI.wSt : 'arrival', sn = WA.seen(p.id), left = Math.max(0, W_STAMP_AT - WA.marks(p.id));
  const route = WSTAT.map(([id, nm]) => `<button class="w-stop ${st === id ? 'active' : ''} ${sn[id] ? 'visited' : ''}" data-act="wStation" data-arg="${id}" ${st === id ? 'aria-current="step"' : ''} aria-label="${nm}${sn[id] ? ', besucht' : ', noch nicht besucht'}">${wStIco(id, 26)}<span>${nm}</span>${wMarkSVG(!!sn[id])}</button>`).join('');
  return wRoot(wBar(p.name, 'welt', 'Abflug', `<button class="w-pill" data-act="wPassGo">${ico('stamp', 18)} ${W_PASS}</button>`)
    + `<div class="w-journey" style="--sc:${p.scene};--g1:${p.g1};--g2:${p.g2}">
    <aside class="w-scene"><div class="w-scene-top">${WA.stamped(p.id) ? `<span class="w-entry">${ico('stamp', 14)} Stempel erhalten</span>` : `<span class="w-entry">Noch ${left} ${left === 1 ? 'Station' : 'Stationen'} bis zum Stempel</span>`}</div>
      <div class="w-scene-vis">${p.hero}</div>
      <div class="w-guide"><span class="w-guide-pic">${p.guide.svg}</span><div><small>${esc(p.guide.name)} begleitet dich</small><h2>${esc(p.name)}</h2><p>${esc(p.welcome)}</p></div></div></aside>
    <section class="w-work"><nav class="w-route" aria-label="Reisestationen">${route}</nav>
      <article class="w-panel" id="wPanel" tabindex="-1">${wStation(p, st)}</article></section></div>
    <div class="sr" aria-live="polite">${UI.wMsg ? esc(UI.wMsg) : ''}</div>`);
};

/* ---------- Mein Reisepass: Datenseite + Visa-Seite mit Einreisestempeln ---------- */
const WP_ISO = { deu: 'DEU', jpn: 'JPN', ind: 'IND' }, WP_AP = { deu: 'FRA', jpn: 'NRT', ind: 'DEL' };       // Flughafen- und Länder-Codes (sichere Angaben)
const WMON = ['JAN', 'FEB', 'MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEZ'];
const wParts = d => { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(d || ''); return m ? { y: m[1], mo: +m[2], m: WMON[+m[2] - 1] || '', d: m[3] } : null; };
const wLong = d => { const q = wParts(d); return q ? `${q.d} ${q.m} ${q.y}` : '—'; };
const wHash = str => { let h = 7; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const WP_INK = ['#25508f', '#2b6a4b', '#7d2b2b', '#4a3a84', '#1f6073', '#33393b'];                           // Stempelfarben: Blau, Grün, Ziegelrot, Violett, Petrol, Schwarz (nie Pink)
const wPlane = (x, y, s, rot) => `<path transform="translate(${x} ${y}) rotate(${rot || 0}) scale(${s})" d="M-10 0 10-3.2 10 3.2zM-3 0-8-8.5-5-8.5 3 0-5 8.5-8 8.5z" fill="currentColor" stroke="none"/>`;
function wImmStamp(id, dateStr, fresh) {
  const p = WP[id], q = wParts(dateStr) || { d: '', m: '', y: '' }, h = wHash(id), kind = h % 3, rot = ((h >> 3) % 25) - 12, dx = ((h >> 8) % 15) - 7, dy = ((h >> 12) % 11) - 5;
  const ink = WP_INK[(h >> 5) % WP_INK.length], nm = p.name.toUpperCase(), iso = WP_ISO[id] || id.toUpperCase(), ap = WP_AP[id] || iso;
  const fs = nm.length <= 7 ? 24 : nm.length <= 10 ? 20 : nm.length <= 13 ? 16 : 13;
  const T = 'font-family="Arial Narrow,Arial,Helvetica,sans-serif" font-weight="800" text-anchor="middle" fill="currentColor" stroke="none"';
  let svg;
  if (kind === 0) svg = `<svg viewBox="0 0 170 112" aria-hidden="true"><g fill="none" stroke="currentColor"><rect x="3" y="3" width="164" height="106" rx="9" stroke-width="3.2"/><rect x="9" y="9" width="152" height="94" rx="5" stroke-width="1.3"/><path d="M16 36h138M16 66h138" stroke-width="1.2"/></g>
    <text x="85" y="29" ${T} font-size="13" letter-spacing="3.5">EINREISE</text><text x="85" y="57" ${T} font-size="${fs}" letter-spacing="1">${esc(nm)}</text>
    <g fill="currentColor"><text x="30" y="82" ${T} font-size="11" letter-spacing="1.5">${ap}</text><text x="140" y="82" ${T} font-size="11" letter-spacing="1.5">${iso}</text></g>${wPlane(85, 79, .9, 0)}
    <text x="85" y="98" ${T} font-size="15" letter-spacing="2" font-family="Courier New,monospace">${q.d} ${q.m} ${q.y}</text></svg>`;
  else if (kind === 1) svg = `<svg viewBox="0 0 140 140" aria-hidden="true"><defs><path id="wt${id}" d="M20 70a50 50 0 0 1 100 0"/><path id="wb${id}" d="M16 70a54 54 0 0 0 108 0"/></defs>
    <g fill="none" stroke="currentColor"><circle cx="70" cy="70" r="66" stroke-width="3.4"/><circle cx="70" cy="70" r="60" stroke-width="1.2"/><circle cx="70" cy="70" r="38" stroke-width="1.6"/></g>
    <text ${T} font-size="11.5" letter-spacing="2.6"><textPath href="#wt${id}" startOffset="50%">EINREISE · ENTRY</textPath></text>
    <text ${T} font-size="${nm.length > 10 ? 9.5 : 11.5}" letter-spacing="2"><textPath href="#wb${id}" startOffset="50%">${esc(nm)}</textPath></text>
    <g fill="currentColor" stroke="none"><circle cx="19" cy="70" r="2"/><circle cx="121" cy="70" r="2"/></g>
    <text x="70" y="64" ${T} font-size="25" font-family="Courier New,monospace">${q.d}</text><path d="M44 71h52" stroke="currentColor" stroke-width="1.4"/>
    <text x="70" y="85" ${T} font-size="13" letter-spacing="2">${q.m}</text><text x="70" y="99" ${T} font-size="11.5" letter-spacing="1.5">${q.y}</text></svg>`;
  else svg = `<svg viewBox="0 0 170 104" aria-hidden="true"><g fill="none" stroke="currentColor"><ellipse cx="85" cy="52" rx="81" ry="48" stroke-width="3.2"/><ellipse cx="85" cy="52" rx="74" ry="41" stroke-width="1.2"/></g>
    <text x="85" y="29" ${T} font-size="11.5" letter-spacing="3">ANKUNFT · ARRIVAL</text><text x="85" y="55" ${T} font-size="${Math.min(fs, 19)}" letter-spacing="1">${esc(nm)}</text>${wPlane(85, 65, .8, -8)}
    <path d="M30 70h110" stroke="currentColor" stroke-width="1.1"/><text x="85" y="86" ${T} font-size="14" letter-spacing="1.6" font-family="Courier New,monospace">${q.d} ${q.m} ${q.y}</text></svg>`;
  return `<figure class="rp-st${fresh ? ' fresh' : ''}" style="--ink:${ink};--rot:${rot}deg;--dx:${dx}px;--dy:${dy}px" role="img" aria-label="Einreisestempel ${esc(p.name)}, ${q.d}. ${q.m} ${q.y}">${svg}</figure>`;
}
const wCleanMrz = t => String(t || '').toUpperCase().replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/ß/g, 'SS').replace(/[^A-Z0-9]/g, '<');
const wPad = t => (t + '<'.repeat(44)).slice(0, 44);
function wPassInit() {                                                      // Ausstellungsdatum und Pass-Nummer: einmal vergeben, dann fest
  const ps = wS().pass; let ch = false;
  if (!ps.issued) { ps.issued = wDay(); ch = true; }
  if (!ps.no) { const A = '0123456789CFGHJKLMNPRTVWXYZ'; let n = ''; for (let i = 0; i < 8; i++) n += A[Math.floor(Math.random() * A.length)]; ps.no = 'D' + n; ch = true; }
  if (!ps.seen || typeof ps.seen !== 'object') { ps.seen = {}; ch = true; }
  if (ch) save();
  return ps;
}
const wAddYears = (d, n) => { const q = wParts(d); return q ? `${+q.y + n}-${String(q.mo).padStart(2, '0')}-${q.d}` : ''; };
const wField = (de, en, val, cls) => `<div class="rp-f ${cls || ''}"><small>${de} <i>/ ${en}</i></small><b>${val}</b></div>`;
VIEWS.weltPass = () => {
  const ps = wPassInit(), w = wS(), open = wList().filter(p => WA.isOpen(p.id)), anim = !UI.wBookSeen; UI.wBookSeen = true;
  const nm = WA.childName(), L = (typeof levelInfo === 'function') ? levelInfo() : null;
  const stamps = Object.keys(w.stamps).filter(id => WP[id]).sort((a, b) => (w.stamps[a] > w.stamps[b] ? 1 : w.stamps[a] < w.stamps[b] ? -1 : 0));
  const freshIds = stamps.filter(id => !ps.seen[id] && w.stamps[id] === wDay());
  const last = stamps.length ? stamps[stamps.length - 1] : null;
  const expiry = wAddYears(ps.issued, 10), birth = ps.birth ? wLong(ps.birth) : '', exp = wLong(expiry);
  const mrz1 = wPad('P<DNZ' + wCleanMrz(nm) + '<<');
  const bd = (ps.birth || '').replace(/-/g, '').slice(2), ed = expiry.replace(/-/g, '').slice(2);
  const mrz2 = wPad(wCleanMrz(ps.no).padEnd(9, '<') + '0DNZ' + (bd || '<<<<<<') + '0X' + (ed || '<<<<<<') + '0');
  const data = [
    wField('Typ', 'Type', 'P', 'sm'), wField('Code', 'Code', 'DNZ', 'sm'), wField('Pass-Nr.', 'Passport No.', esc(ps.no), 'wide'),
    wField('Name', 'Name', esc(nm), 'full big'),
    wField('Staatsangehörigkeit', 'Nationality', 'Weltentdecker/in', 'full'),
    wField('Geburtsdatum', 'Date of birth', birth || '—'), wField('Geburtsort', 'Place of birth', ps.bplace ? esc(ps.bplace) : '—'),
    wField('Wohnort', 'Residence', ps.res ? esc(ps.res) : '—'), wField('Schulklasse', 'Grade', 'Klasse 4'),
    wField('Begleiter', 'Companion', esc(FN()) + ' (Fuchs)'), wField('Titel', 'Title', L ? `${esc(L.title)} · Level ${L.n}` : '—'),
    wField('Ausgestellt am', 'Date of issue', wLong(ps.issued)), wField('Gültig bis', 'Date of expiry', exp),
    wField('Behörde', 'Authority', 'Denkzauber-Passamt', 'full')
  ].join('');
  const trips = [
    wField('Bereiste Länder', 'Countries visited', open.length), wField('Einreisestempel', 'Entry stamps', stamps.length),
    wField('Mitgebrachte Souvenirs', 'Souvenirs', WA.souvN()),
    wField('Letzte Einreise', 'Last entry', last ? `${esc(WP[last].name)}<em>${wLong(w.stamps[last])}</em>` : '—')
  ].join('');
  const ink = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="rpInk" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.3 1.75" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="s"/><feTurbulence type="turbulence" baseFrequency=".035" numOctaves="1" seed="8" result="w"/><feDisplacementMap in="s" in2="w" scale="2.2"/></filter></svg>`;
  setTimeout(() => { freshIds.forEach(id => { ps.seen[id] = 1; }); if (freshIds.length) save(); }, 1800);
  return wRoot(wBar(W_PASS, 'welt', 'Abflug', `<button class="w-pill" data-act="wParent">${ico('lock', 16)} Eltern</button>`)
    + `${ink}<div class="rp ${anim ? 'anim' : ''}"><div class="rp-cover" aria-hidden="true"><div>${wCompass}<small>REISEPASS · PASSPORT</small><b>${esc(nm)}</b></div></div>
    <article class="rp-page rp-data" aria-label="Datenseite">
      <header class="rp-hd"><span>Reisepass <i>/ Passport</i></span><b>${wCompass}</b></header>
      <div class="rp-body"><div class="rp-pic"><span class="rp-photo">${WA.photo(104)}</span><span class="rp-sig" aria-label="Unterschrift"><small>Unterschrift <i>/ Signature</i></small><em>${esc(nm)}</em></span></div>
        <div class="rp-grid">${data}</div></div>
      <div class="rp-mrz" aria-hidden="true"><span>${esc(mrz1)}</span><span>${esc(mrz2)}</span></div></article>
    <article class="rp-page rp-visa" aria-label="Einreisestempel">
      <header class="rp-hd"><span>Einreise <i>/ Entry</i></span><b>${stamps.length}</b></header>
      <div class="rp-grid trips">${trips}</div>
      <div class="rp-stamps">${stamps.length ? stamps.map(id => wImmStamp(id, w.stamps[id], freshIds.includes(id))).join('') : `<p class="rp-none">Noch kein Einreisestempel. Besuche ${W_STAMP_AT} von ${WSTAT.length} Stationen in einem Land, dann stempelt die Grenzkontrolle deinen Pass.</p>`}</div></article></div>
    ${open.length ? `<h3 class="w-sec">Meine Länder</h3><ul class="w-prog">${open.map(p => `<li><button data-act="wBoard" data-arg="${p.id}">${wFlag(p.id, 'w-lflag')}<b>${esc(p.name)}</b>${wDots(p.id)}<small>${WA.pct(p.id)} %</small></button></li>`).join('')}</ul>` : ''}`);
};

/* ---------- Eltern (PIN) ---------- */
VIEWS.weltEltern = () => {
  const w = wS(), locked = wList().filter(p => !WA.isOpen(p.id));
  return wRoot(wBar('Eltern: Mein Reisepass', 'weltPass', W_PASS)
    + `<section class="w-par card"><h3>Persönliches im Pass</h3><p class="small mute">Alles ist freiwillig und bleibt nur auf diesem Gerät.</p>
      <label for="wpName">Name im Pass</label><input class="txt" id="wpName" maxlength="20" value="${esc(w.pass.name || '')}" placeholder="${esc(profileName())}" autocomplete="off">
      <label for="wpBirth">Geburtsdatum</label><input class="txt" id="wpBirth" type="date" value="${esc(w.pass.birth || '')}">
      <label for="wpBplace">Geburtsort</label><input class="txt" id="wpBplace" maxlength="24" value="${esc(w.pass.bplace || '')}" autocomplete="off">
      <label for="wpRes">Wohnort</label><input class="txt" id="wpRes" maxlength="24" value="${esc(w.pass.res || '')}" autocomplete="off">
      <fieldset class="w-radio"><legend>Foto im Pass</legend>
        <label><input type="radio" name="wpPhoto" value="avatar" ${w.pass.photo === 'fino' ? '' : 'checked'}> Mein Avatar (Standard)</label>
        <label><input type="radio" name="wpPhoto" value="fino" ${w.pass.photo === 'fino' ? 'checked' : ''}> ${esc(FN())}</label></fieldset>
      <h3>Länder, die angeboten werden</h3><p class="small mute">Schon geöffnete Länder bleiben immer offen.</p>
      ${locked.length ? locked.map(p => `<label class="w-toggle"><input type="checkbox" data-wpack="${p.id}" ${w.off[p.id] ? '' : 'checked'}> ${wFlag(p.id, 'w-lflag')} ${esc(p.name)} <small>${p.cost} ⭐</small></label>`).join('') : '<p class="small mute">Alle Länder sind schon geöffnet.</p>'}
      <div class="row wrap" style="margin-top:14px"><button class="btn big" data-act="wSaveEltern">Speichern</button></div></section>`);
};

/* ---------- Flug ---------- */
function wFlight(id, then) {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { then(); return; }
  const p = WP[id], d = document.createElement('div'); d.className = 'w-flight'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Abflug nach ' + p.name);
  d.innerHTML = `<div class="w-flight-in">${wFlag(id, 'w-fflag')}<small>Deine Reise beginnt</small><h2>Abflug nach ${esc(p.name)}</h2><p>Dein Reisepass ist bereit.</p>
    <div class="w-fline"><svg class="w-plane" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12 3 4l3 8-3 8z" fill="currentColor"/></svg></div><button class="btn sec sm" data-act="wFlightSkip">Weiter</button></div>`;
  document.body.appendChild(d);
  let done = false; const end = () => { if (done) return; done = true; d.remove(); UI.wFlightEnd = null; then(); };
  UI.wFlightEnd = end; setTimeout(end, 1900);
}
function wLand(id) {
  UI.wId = id; UI.wSt = 'arrival'; UI.wQz = null; UI.wNew = null;
  const fresh = WA.markSeen(id, 'arrival'); UI.wMsg = fresh ? 'Ankunft besucht' : '';
  if (fresh) UI.wNew = id + ':arrival';
  go('weltReise'); window.scrollTo && window.scrollTo(0, 0);
  wAfterMark(id);
}
function wAfterMark(id) {
  if (UI.wStampNew === id) { UI.wStampNew = null; sfx('pop'); toast('🧭', `Einreisestempel für ${WP[id].name}!`); }
}
function wSpeak(text, lang) {
  try { const sy = window.speechSynthesis; if (!sy || typeof SpeechSynthesisUtterance === 'undefined') return false; sy.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = .8; sy.speak(u); return true; } catch (e) { return false; }
}

/* ---------- Aktionen ---------- */
registerFeature({
  id: 'welt', title: W_NAME, icon: 'stamp', tint: 'sky', group: 'world', order: 70, view: 'welt',
  sub: () => { const n = wList().filter(p => WA.isOpen(p.id)).length; return wList().some(p => WA.shown(p.id) && WA.canOpen(p.id)) ? 'Du kannst ein Land öffnen' : `${n} ${n === 1 ? 'Land' : 'Länder'} offen`; },
  views: { weltReise: VIEWS.weltReise, weltPass: VIEWS.weltPass, weltEltern: VIEWS.weltEltern },
  leave: () => { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { } },
  acts: {
    welt: () => go('welt'),
    wBoard: id => { if (WA.isOpen(id)) wLand(id); },
    wLock: id => {
      const p = WP[id]; if (!p) return;
      if (WA.isOpen(id)) return wLand(id);
      const free = WA.freeStars();
      if (free >= p.cost) modal(`${esc(p.name)} öffnen?`, `Das kostet <b>einmal ${p.cost} ⭐</b> von deinen freien Sternen. Du hast ${free}, danach ${free - p.cost}.<br>Deine gesammelten Sterne, Wesen und Pokale bleiben. Das Land bleibt danach für immer offen.`, 'Öffnen', 'wOpenYes', id, 'Später');
      else modal(`${esc(p.name)} ist noch zu`, `Dir fehlen noch <b>${p.cost - free} ⭐</b> (${p.cost} ⭐ kostet das Land, du hast ${free}). Sterne bekommst du beim Üben.`, null, '', '', 'Okay');
    },
    wOpenYes: id => { closeModal(); if (!WA.openCountry(id)) return; checkTrophies(); wFlight(id, () => wLand(id)); },
    wFlightSkip: () => { if (UI.wFlightEnd) UI.wFlightEnd(); },
    wStation: st => {
      const p = WP[UI.wId]; if (!p || !WSTAT.some(x => x[0] === st)) return;
      UI.wSt = st; UI.wNew = null; UI.wMsg = '';
      if (st !== 'quiz') { const fresh = WA.markSeen(p.id, st); if (fresh) { UI.wNew = p.id + ':' + st; UI.wMsg = `${WSTAT.find(x => x[0] === st)[1]} besucht`; } }
      render(); wAfterMark(p.id);
    },
    wSay: i => { const p = WP[UI.wId], w = p && p.st.language.words[+i]; if (!w) return; if (!wSpeak(w[0], p.speech)) toast('🔇', 'Auf diesem Gerät gibt es keine Sprachausgabe. Lies die Aussprache mit.'); },
    wQuizStart: () => { UI.wQz = wQuizBuild(WP[UI.wId]); render(); },
    wQuizPick: k => { const Q = UI.wQz, q = Q && Q.qs[Q.i]; if (!q || q.pick != null) return; q.pick = +k; if (q.opts[q.pick] === q.ok) Q.score++; sfx(q.opts[q.pick] === q.ok ? 'tap' : 'pop'); render(); },
    wQuizNext: () => {
      const Q = UI.wQz; if (!Q) return;
      if (Q.i < Q.qs.length - 1) Q.i++;
      else { Q.done = true; const had = WA.souvs(Q.id).includes('quiz'); WA.saveQuiz(Q.id, Q.score); if (!had && Q.score >= W_QUIZ_OK) { UI.wNew = Q.id + ':quiz'; UI.wMsg = 'Rätsel geschafft'; } }
      render(); wAfterMark(Q.id);
    },
    wPassGo: () => { UI.wBookSeen = false; go('weltPass'); },
    wParent: () => requirePin('weltEltern'),
    weltEltern: () => go('weltEltern'),
    wSaveEltern: () => {
      const w = wS(), n = $('#wpName'), ph = document.querySelector('input[name=wpPhoto]:checked');
      w.pass.name = ((n && n.value) || '').trim().slice(0, 20);
      const gv = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
      w.pass.birth = /^\d{4}-\d\d-\d\d$/.test(gv('wpBirth')) ? gv('wpBirth') : ''; w.pass.bplace = gv('wpBplace').slice(0, 24); w.pass.res = gv('wpRes').slice(0, 24); w.pass.photo = ph && ph.value === 'fino' ? 'fino' : 'avatar';
      document.querySelectorAll('[data-wpack]').forEach(el => { if (el.checked) delete w.off[el.dataset.wpack]; else w.off[el.dataset.wpack] = 1; });
      save(); toast('✅', 'Gespeichert'); go('weltPass');
    }
  }
});
