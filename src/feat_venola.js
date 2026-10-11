/* =====================================================================
   VENOLA HOLMES (in Meine Welt): Detektiv-Rätsel in zwei Spielen + Wochenfall.
   · Geheimschrift: eine Botschaft entschlüsseln (Verschiebe-Code, A=1-Zahlen, Spiegel-Alphabet). Stufe 1 mit vollem Schlüssel,
     Stufe 2 mit einem Beispiel, Stufe 3 ohne Schlüssel (das erste Wort ist verraten). Gleiche Zeichen = gleicher Buchstabe.
   · Kriminalfall: 4 / 5 / 6 Verdächtige, Hinweise lesen, Verdächtige ausschließen, den Täter festnehmen. Genau eine Lösung.
   · Wochenfall: einmal pro Woche (neu am Montag): erst die Botschaft entschlüsseln, dann den Täter finden.
   Stufen schalten sich nach und nach frei (ein Sieg öffnet die nächste), Auswahl startet jeden Tag bei Stufe 1.
   Gelöste Fälle zählen für Pokale, Überraschungsgeschenke und die Sticker-Serie „Spürnasen“ (feat_album.js). Nichts wird abgezogen.
   Gespeichert: ein begonnener Fall (S.puz.vnCur), der Wochenfall (S.puz.vnWk); Verlauf nur gelöster Fälle (feat_puzzle.js).
   ===================================================================== */
const VN_MSG = {
  1: ['HALLO FREUND', 'DER SCHATZ', 'KOMM SOFORT', 'WIR SIND DA', 'GUTE NACHT', 'GEHEIME SPUR', 'ZUM BAHNHOF', 'ES REGNET', 'TRIFF MICH', 'ALLES KLAR', 'SEI LEISE', 'IM KELLER', 'DER ZUG KOMMT', 'ROT UND BLAU'],
  2: ['TREFFPUNKT IST DER BRUNNEN', 'DER SCHLUESSEL LIEGT UNTER DER MATTE', 'WIR TREFFEN UNS UM DREI', 'DIE LUPE IST IM SCHRANK', 'DER DIEB WAR IM GARTEN', 'ROM IST DIE HAUPTSTADT', 'PARIS LIEGT AN DER SEINE', 'DREI MAL VIER IST ZWOELF', 'ZEHN MAL ZEHN IST HUNDERT', 'FUENF PLUS FUENF IST ZEHN', 'DER MOND KREIST UM DIE ERDE', 'DER ZUG FAEHRT UM ACHT'],
  3: ['DER GEHEIME EINGANG LIEGT HINTER DEM BUECHERREGAL', 'TREFFE MICH BEI SONNENUNTERGANG AM ALTEN TURM', 'DIE LOESUNG STEHT AUF DER RUECKSEITE DER KARTE', 'KEIN MENSCH WEISS WO DER SCHATZ VERSTECKT IST', 'DER BLAUWAL IST DAS GROESSTE TIER DER WELT', 'DER KUCKUCK RUFT NUR IM FRUEHLING', 'ALLE WEGE FUEHREN ZUM ZIEL', 'IM DUNKELN LEUCHTET DIE LATERNE AM HAFEN']
};
const VN_WEEK_MSG = ['DER TAETER VERSTECKT SICH IM ZOO', 'DIE SPUR FUEHRT ZUR ALTEN MUEHLE', 'ER WARTET AM BAHNHOF AUF DICH', 'DAS VERSTECK IST HINTER DER KIRCHE', 'SUCHE IM LEEREN LEUCHTTURM', 'DER TAETER SITZT IM KINO'];
const VN_COIN = [3, 5, 8], VN_NAMES = ['Anna', 'Ben', 'Clara', 'David', 'Emil', 'Fiona', 'Gustav', 'Hanna', 'Ida', 'Jonas'];
const VN_HATADJ = ['roten', 'blauen', 'grünen'], VN_SCARFADJ = ['gelben', 'lila'];
const VN_SKIN = ['#f2c7a4', '#e0a67e', '#c68a5e', '#8d5a3c', '#f7d9c0'], VN_HAIR = ['#3b2a20', '#7a4e2e', '#c9a227', '#2b2b2b', '#b5523b'], VN_HATC = ['#e53935', '#1e88e5', '#43a047'], VN_SCARFC = ['#fdd835', '#8e24aa'];
const vnS = () => { const p = pzS(); ['vnCodeLvl', 'vnCaseLvl'].forEach(k => { if (!(p[k] >= 1)) p[k] = 1; }); return p; };
const vnLbl = (kind, lv) => kind === 'week' ? 'Wochenfall' : (kind === 'code' ? 'Geheimschrift' : 'Kriminalfall') + ' · Stufe ' + lv;
const vnSub = () => { const p = vnS(); return p.venWins ? `${p.venWins} Fälle gelöst` : 'Codes und Fälle'; };
const vnPick = (a, rnd) => a[Math.floor(rnd() * a.length)];

/* ---------- Geheimschrift ---------- */
const vnEnc = (type, k, ch) => { const a = ch.charCodeAt(0) - 65; return type === 'shift' ? String.fromCharCode(65 + (a + k) % 26) : type === 'mirror' ? String.fromCharCode(65 + 25 - a) : String(a + 1); };
function vnCodeNew(lv, rnd, msg) {
  msg = msg || vnPick(VN_MSG[lv], rnd);
  const type = lv === 1 ? (rnd() < .5 ? 'shift' : 'num') : (rnd() < .6 ? 'shift' : 'mirror');
  const k = type === 'shift' ? (lv === 1 ? 1 + Math.floor(rnd() * 3) : lv === 2 ? 4 + Math.floor(rnd() * 4) : 3 + Math.floor(rnd() * 9)) : 0;
  const words = msg.split(' ').map(w => ({ p: w, s: w.split('').map(c => vnEnc(type, k, c)) })), truth = {}, guess = {}, locked = {};
  words.forEach(w => w.p.split('').forEach((c, i) => { truth[w.s[i]] = c; }));
  if (lv === 3) words[0].s.forEach(sym => { guess[sym] = truth[sym]; locked[sym] = 1; });      // Stufe 3: das erste Wort ist verraten
  return { lv, type, k, msg, words, truth, guess, locked, sel: '' };
}
const vnSyms = c => [...new Set(c.words.flatMap(w => w.s))];
const vnCodeDone = c => vnSyms(c).every(s => c.guess[s] === c.truth[s]);
function vnCodeView(c, chk) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const key = c.lv === 1 ? `<details class="vn-key" open><summary>Schlüssel</summary><div class="vn-tbl">${letters.map(l => `<span><b>${l}</b><i>${vnEnc(c.type, c.k, l)}</i></span>`).join('')}</div><p class="small mute">${c.type === 'num' ? 'Jede Zahl steht für einen Buchstaben.' : 'Oben der echte Buchstabe, unten die Geheimschrift.'}</p></details>`
    : c.lv === 2 ? `<p class="vn-ex">Beispiel: <b>${c.type === 'shift' ? 'A wird zu ' + vnEnc('shift', c.k, 'A') : 'A wird zu Z'}</b></p>` : `<p class="vn-ex">Tipp: ${c.type === 'shift' ? 'Alle Buchstaben sind gleich weit verschoben.' : 'Das Alphabet ist umgedreht.'} Das erste Wort ist schon verraten.</p>`;
  const ws = c.words.map(w => `<div class="vn-w">${w.s.map(sym => { const g = c.guess[sym] || '', bad = chk && g && g !== c.truth[sym]; return `<button class="vn-l${c.sel === sym ? ' sel' : ''}${c.locked[sym] ? ' lk' : ''}${bad ? ' bad' : ''}" data-act="vnSel" data-arg="${sym}" aria-label="Zeichen ${sym}${g ? ', Buchstabe ' + g : ''}"><small>${sym}</small><b>${g}</b></button>`; }).join('')}</div>`).join('');
  return `${key}<div class="vn-msg" aria-label="Geheime Botschaft">${ws}</div><div class="vn-pad">${letters.map(l => `<button class="vn-k" data-act="vnLet" data-arg="${l}">${l}</button>`).join('')}<button class="vn-k er" data-act="vnLet" data-arg="" aria-label="Löschen">✕</button></div>`;
}

/* ---------- Kriminalfall ---------- */
const vnFace = s => `<svg viewBox="0 0 60 74" class="vn-face" aria-hidden="true"><ellipse cx="30" cy="64" rx="19" ry="12" fill="#9aa5b1"/>${s.bag ? '<path d="M42 50L51 61" stroke="#6d4c41" stroke-width="2"/><rect x="45" y="59" width="12" height="10" rx="2" fill="#8d6e63"/>' : ''}${s.sc ? `<rect x="16" y="46" width="28" height="8" rx="4" fill="${VN_SCARFC[s.sc - 1]}"/>` : ''}<circle cx="30" cy="30" r="15" fill="${VN_SKIN[s.sk]}"/><path d="M15 29Q15 12 30 12Q45 12 45 29Q38 21 30 21Q22 21 15 29Z" fill="${VN_HAIR[s.hr]}"/><circle cx="24.5" cy="31" r="2" fill="#2a2038"/><circle cx="35.5" cy="31" r="2" fill="#2a2038"/><path d="M26 38Q30 41 34 38" fill="none" stroke="#2a2038" stroke-width="1.6" stroke-linecap="round"/>${s.gl ? '<circle cx="24.5" cy="31" r="5.4" fill="#ffffff33" stroke="#2a2038" stroke-width="1.5"/><circle cx="35.5" cy="31" r="5.4" fill="#ffffff33" stroke="#2a2038" stroke-width="1.5"/><path d="M29.9 31h.2" stroke="#2a2038" stroke-width="1.5"/>' : ''}${s.hat ? `<rect x="11" y="16" width="38" height="4.5" rx="2.2" fill="${VN_HATC[s.hat - 1]}"/><path d="M16 17Q17 3 30 3Q43 3 44 17Z" fill="${VN_HATC[s.hat - 1]}"/>` : ''}</svg>`;
function vnClues(sus, cu, lv, rnd) {
  const pos = [], neg = [], c = sus[cu];
  pos.push(c.hat ? { t: `Der Täter trägt einen ${VN_HATADJ[c.hat - 1]} Hut.`, f: s => s.hat === c.hat } : { t: 'Der Täter trägt keinen Hut.', f: s => !s.hat });
  pos.push(c.gl ? { t: 'Der Täter trägt eine Brille.', f: s => !!s.gl } : { t: 'Der Täter trägt keine Brille.', f: s => !s.gl });
  pos.push(c.sc ? { t: `Der Täter hat einen ${VN_SCARFADJ[c.sc - 1]} Schal.`, f: s => s.sc === c.sc } : { t: 'Der Täter hat keinen Schal.', f: s => !s.sc });
  pos.push(c.bag ? { t: 'Der Täter hat eine Tasche.', f: s => !!s.bag } : { t: 'Der Täter hat keine Tasche.', f: s => !s.bag });
  VN_HATADJ.forEach((a, i) => { if (c.hat !== i + 1) neg.push({ t: `Der Täter trägt keinen ${a} Hut.`, f: s => s.hat !== i + 1 }); });
  VN_SCARFADJ.forEach((a, i) => { if (c.sc !== i + 1) neg.push({ t: `Der Täter hat keinen ${a} Schal.`, f: s => s.sc !== i + 1 }); });
  if (c.hat) neg.push({ t: 'Der Täter trägt einen Hut.', f: s => !!s.hat });
  if (c.sc) neg.push({ t: 'Der Täter hat einen Schal.', f: s => !!s.sc });
  const pool = lv === 1 ? pzShuf(pos, rnd) : lv === 2 ? pzShuf(pos.concat(neg), rnd) : pzShuf(neg, rnd).concat(pzShuf(pos, rnd));
  let rem = sus.slice(); const out = [];
  for (const cl of pool) { const nr = rem.filter(cl.f); if (nr.length < rem.length) { out.push(cl.t); rem = nr; if (rem.length === 1) break; } }
  return rem.length === 1 ? out : null;
}
function vnCaseNew(lv, rnd) {
  const n = [4, 5, 6][lv - 1], lim = [[2, 3], [3, 4], [4, 5]][lv - 1]; let best = null;
  for (let t = 0; t < 400; t++) {
    const combos = []; for (let h = 0; h < 4; h++) for (let g = 0; g < 2; g++) for (let s = 0; s < 3; s++) for (let b = 0; b < 2; b++) combos.push({ hat: h, gl: g, sc: s, bag: b });
    const names = pzShuf(VN_NAMES, rnd), sus = pzShuf(combos, rnd).slice(0, n).map((c, i) => Object.assign(c, { name: names[i], sk: Math.floor(rnd() * 5), hr: Math.floor(rnd() * 5) }));
    const cu = Math.floor(rnd() * n), clues = vnClues(sus, cu, lv, rnd);
    if (!clues) continue;
    const res = { lv, sus, cu, clues: pzShuf(clues, rnd), out: {} };
    if (clues.length >= lim[0] && clues.length <= lim[1]) return res;
    if (!best) best = res;
  }
  return best;
}
function vnCaseView(k, o) {
  const left = k.sus.map((s, i) => i).filter(i => !k.out[i]);
  return `<section class="card vn-clues"><h3>Hinweise</h3><ol>${k.clues.map(t => `<li>${esc(t)}</li>`).join('')}</ol><p class="small mute">Tippe einen Verdächtigen an, um ihn auszuschließen. Tippe nochmal, um ihn zurückzuholen.</p></section>
  <div class="vn-sus n${k.sus.length}">${k.sus.map((s, i) => `<button class="vn-s${k.out[i] ? ' x' : ''}" data-act="vnCross" data-arg="${i}" aria-pressed="${!!k.out[i]}" aria-label="${esc(s.name)}${k.out[i] ? ', ausgeschlossen' : ''}">${vnFace(s)}<b>${esc(s.name)}</b>${k.out[i] ? '<span class="vn-xx">✕</span>' : ''}</button>`).join('')}</div>
  ${left.length === 1 ? `<div class="center" style="margin-top:12px"><button class="btn big" data-act="vnArrest">🚔 ${esc(k.sus[left[0]].name)} festnehmen</button></div>` : `<p class="small mute center">Noch ${left.length} Verdächtige</p>`}${k.wrong ? `<p class="pz-msg">Das war nicht der Täter. Lies die Hinweise noch einmal genau.</p>` : ''}`;
}

/* ---------- Spielstand ---------- */
function vnNew(kind, lv, tm, wk) {
  if (kind === 'week') { const rnd = pzRng(pzSeed('ven' + wk)), msg = vnPick(VN_WEEK_MSG, rnd); return { st: 'play', kind, lv: 3, wk, tm, el: 0, t0: 0, up: false, hints: 0, stage: 1, code: vnCodeNew(2, rnd, msg), cas: vnCaseNew(3, rnd), chk: false }; }
  const rnd = Math.random;
  return kind === 'code' ? { st: 'play', kind, lv, tm, el: 0, t0: 0, up: false, hints: 0, code: vnCodeNew(lv, rnd), chk: false } : { st: 'play', kind, lv, tm, el: 0, t0: 0, up: false, hints: 0, cas: vnCaseNew(lv, rnd), chk: false };
}
function vnPersist(m) {
  if (!m) return; const p = vnS();
  const d = m.st === 'play' ? JSON.parse(JSON.stringify(m, (k, v) => (k[0] === '_' || k === 'save' || k === 't0') ? undefined : v)) : null;
  if (d) d.el = Math.round(PzT.el(m));
  if (m.kind === 'week') { p.vnWk = p.vnWk || { wk: m.wk }; p.vnWk.cur = d; } else p.vnCur = d;
  save();
}
const vnRestore = d => Object.assign({ st: 'play', t0: 0, chk: false }, JSON.parse(JSON.stringify(d)));
function vnStop() { const m = UI.vn; if (m) { PzT.stop(m); if (m.st === 'play') vnPersist(m); } }
function vnBegin(m) { UI.vn = m; m.save = () => vnPersist(m); PzT.start(m, 'venola', () => { sfx('tap'); if (view === 'venola') render(); }); vnPersist(m); render(); }
function vnWin(m) {
  PzT.stop(m); m.st = 'win'; const p = vnS(), secs = PzT.el(m), wk = m.kind === 'week';
  m.fresh = '';
  if (m.kind === 'code' && m.lv === p.vnCodeLvl && m.lv < 3) { p.vnCodeLvl++; m.fresh = 'Geheimschrift · Stufe ' + p.vnCodeLvl; }
  if (m.kind === 'case' && m.lv === p.vnCaseLvl && m.lv < 3) { p.vnCaseLvl++; m.fresh = 'Kriminalfall · Stufe ' + p.vnCaseLvl; }
  m.coins = pzCoins(VN_COIN[wk ? 2 : m.lv - 1], 'Fall gelöst') + (wk ? (() => { giveCoins(10, 'Wochenfall gelöst'); return 10; })() : 0);
  if (wk && p.vnWk) { p.vnWk.done = true; p.vnWk.cur = null; }
  m.entry = pzFinish('ven', vnLbl(m.kind, m.lv), secs, m.hints, { weekly: wk, inc: m.kind === 'code' ? ['venCode'] : m.kind === 'case' ? ['venCase'] : [] });
  vnPersist(m); sfx('ok'); try { if (!rwCalm()) confetti(70); } catch (x) { }
}
const vnWeekState = () => { const p = vnS(), wk = pzWeek(); if (!p.vnWk || p.vnWk.wk !== wk) p.vnWk = { wk, done: false, cur: null }; return p.vnWk; };

/* ---------- Ansichten ---------- */
const vnTitle = () => `<h1 class="vn-title" aria-label="Venola Holmes">${'VENOLA HOLMES'.split('').map(c => c === ' ' ? '<i class="vn-sp"></i>' : `<span>${c}</span>`).join('')}</h1>`;
function vnSetup() {
  const p = vnS(), u = UI.vnSet || (UI.vnSet = { game: 'code', lv: 1, tm: 0 }), wkS = vnWeekState(), top = u.game === 'code' ? p.vnCodeLvl : p.vnCaseLvl;
  if (u.lv > top) u.lv = top;
  const lvs = [1, 2, 3].map(l => `<button class="sd-lv${u.lv === l ? ' on' : ''}${l <= top ? '' : ' lock'}" data-act="vnLvl" data-arg="${l}" ${l <= top ? '' : 'disabled'} aria-pressed="${u.lv === l}">${l <= top ? '' : ico('lock', 13) + ' '}Stufe ${l}</button>`).join('');
  const cont = p.vnCur ? `<section class="card sd-cont"><b>Begonnen: ${vnLbl(p.vnCur.kind, p.vnCur.lv)}</b><span class="small mute">${fmtT(p.vnCur.el || 0)} Min gespielt</span><button class="btn" data-act="vnCont" data-arg="cur">Weiterermitteln</button></section>` : '';
  const wk = wkS.done ? '<span class="small mute">Gelöst ✔ – der nächste Wochenfall kommt am Montag.</span>' : `<button class="btn" data-act="vnCont" data-arg="week">${wkS.cur ? 'Weiterermitteln' : 'Wochenfall starten'}</button>`;
  return topBar('Venola Holmes', 'rewards') + `<div class="vn-hero">${vnTitle()}<p class="small mute">Entschlüssle Botschaften und finde den Täter.</p></div>${cont}
    <section class="card sd-week"><h3>Wochenfall</h3><p class="small mute">Erst die Botschaft entschlüsseln, dann den Täter finden. Neu am Montag. Bonus: +10 🪙.</p>${wk}</section>
    <section class="card sd-setup"><h3>Neuer Fall</h3><div class="vn-games"><button class="vn-g${u.game === 'code' ? ' on' : ''}" data-act="vnGame" data-arg="code">🗝️<b>Geheimschrift</b><small>Stufe ${p.vnCodeLvl} von 3 offen</small></button><button class="vn-g${u.game === 'case' ? ' on' : ''}" data-act="vnGame" data-arg="case">🔍<b>Kriminalfall</b><small>Stufe ${p.vnCaseLvl} von 3 offen</small></button></div>
    <h3>Stufe</h3><div class="sd-lvrow vn-lvrow">${lvs}</div><h3>Zeit</h3>${pzTimeChips('vnTime', u.tm)}<p class="small mute">Wenn die Zeit um ist, kannst du ohne Zeit weiterspielen.</p>
    <div class="center" style="margin-top:12px"><button class="btn big" data-act="vnStart">Los geht’s</button></div><div class="center" style="margin-top:10px"><button class="btn sec" data-act="vnHist">Meine gelösten Fälle</button></div></section>`;
}
function vnPlay(m) {
  const wk = m.kind === 'week', st = wk ? m.stage : (m.kind === 'code' ? 1 : 2), head = wk ? `Wochenfall · ${st === 1 ? 'Schritt 1: die Botschaft' : 'Schritt 2: der Täter'}` : vnLbl(m.kind, m.lv);
  const tools = st === 1
    ? `<div class="pz-tools"><button class="btn sec pz-tool" data-act="vnCheck">✔ Prüfen</button>${pzHintBtn('vnHint', 'ven')}</div>`
    : `<div class="pz-tools">${pzHintBtn('vnHint', 'ven')}</div>`;
  const note = wk && st === 2 ? `<p class="vn-note">📜 Die Botschaft sagt: <b>${esc(m.code.msg)}</b></p>` : '';
  return topBar('Venola Holmes', 'rewards') + `${pzClock(m)}<p class="sd-info small mute">${esc(head)}${m.hints ? ' · Hinweise: ' + m.hints : ''}</p>${note}${st === 1 ? vnCodeView(m.code, m.chk) + (m.chk && !vnSyms(m.code).some(s => m.code.guess[s] && m.code.guess[s] !== m.code.truth[s]) ? '<p class="pz-msg ok">Bis hier stimmt alles. 👍</p>' : '') : vnCaseView(m.cas)}${tools}<div class="center" style="margin-top:12px"><button class="btn sec" data-act="vnMenu">Speichern und Menü</button></div>`;
}
function vnWinView(m) {
  const e = m.entry || { pk: [], fg: [] };
  const sol = m.kind === 'code' ? `<p class="vn-note">📜 <b>${esc(m.code.msg)}</b></p>` : m.kind === 'case' ? `<p class="vn-note">🔍 Der Täter war <b>${esc(m.cas.sus[m.cas.cu].name)}</b>.</p>` : `<p class="vn-note">📜 <b>${esc(m.code.msg)}</b><br>🔍 Der Täter war <b>${esc(m.cas.sus[m.cas.cu].name)}</b>.</p>`;
  return topBar('Venola Holmes', 'rewards') + `<section class="card result pz-res"><h2>Fall gelöst! 🕵️</h2><p>${esc(vnLbl(m.kind, m.lv))} in <b>${fmtT(e.secs || 0)}</b> Min${m.hints ? ` mit ${m.hints} ${m.hints === 1 ? 'Hinweis' : 'Hinweisen'}` : ' ganz ohne Hinweis'}.</p>${sol}${m.coins ? `<p>+${m.coins} 🪙</p>` : ''}${m.fresh ? `<p>Neue Stufe frei: <b>${esc(m.fresh)}</b></p>` : ''}${pzResultExtras(e)}
    <div class="row wrap" style="justify-content:center"><button class="btn big" data-act="vnAgain">Noch ein Fall</button><button class="btn sec" data-act="vnMenu">Menü</button></div></section>`;
}
VIEWS.venola = () => {
  if (UI.vnHistOn) return topBar('Venola Holmes', 'rewards') + `<div class="center" style="margin:6px 0"><button class="btn sec" data-act="vnHist">‹ Zurück</button></div>` + pzHistory('ven', 'Gelöste Fälle');
  const m = UI.vn; if (!m) return vnSetup();
  return m.st === 'win' ? vnWinView(m) : vnPlay(m);
};
DZ_ART.venola = '<rect x="6" y="6" width="38" height="40" rx="7" fill="#f4efe4" stroke="#52676c" stroke-width="2"/><path d="M13 16h24M13 23h18M13 30h22" stroke="#bed1c6" stroke-width="2.4" stroke-linecap="round"/><circle cx="38" cy="29" r="12" fill="#e7edeb" fill-opacity=".85" stroke="#52676c" stroke-width="3"/><path d="M47 38l10 10" stroke="#9c6668" stroke-width="5" stroke-linecap="round"/><text x="38" y="34" font-size="14" font-weight="800" text-anchor="middle" fill="#52676c" font-family="sans-serif">?</text>';

function vnAfterCode(m) {
  const c = m.code; m.chk = false;
  if (vnCodeDone(c)) {
    if (m.kind === 'week') { m.stage = 2; sfx('magic'); vnPersist(m); render(); return; }
    vnWin(m);
  } else if (vnSyms(c).every(s => c.guess[s])) sfx('no');
  vnPersist(m); render();
}
registerFeature({
  id: 'venola', title: 'Venola Holmes', icon: 'sparkle', tint: 'sky', group: 'spiel', order: 82, view: 'venola',
  leave: () => { vnStop(); UI.vn = null; UI.vnHistOn = false; },
  check: () => { vnS(); },
  acts: {
    venola: () => { vnStop(); UI.vn = null; UI.vnSet = null; UI.vnHistOn = false; go('venola'); },
    vnGame: g => { UI.vnSet.game = g; UI.vnSet.lv = 1; render(); },
    vnLvl: l => { const p = vnS(); if (+l <= (UI.vnSet.game === 'code' ? p.vnCodeLvl : p.vnCaseLvl)) UI.vnSet.lv = +l; render(); },
    vnTime: t => { UI.vnSet.tm = +t; render(); },
    vnStart: () => { const u = UI.vnSet; sfx('tap'); vnBegin(vnNew(u.game, u.lv, u.tm)); },
    vnCont: w => {
      const p = vnS(); let m;
      if (w === 'week') { const ws = vnWeekState(); m = ws.cur ? vnRestore(ws.cur) : vnNew('week', 3, (UI.vnSet && UI.vnSet.tm) || 0, ws.wk); } else if (p.vnCur) m = vnRestore(p.vnCur);
      if (m) vnBegin(m);
    },
    vnHist: () => { UI.vnHistOn = !UI.vnHistOn; render(); },
    vnMenu: () => { vnStop(); UI.vn = null; render(); },
    vnAgain: () => { UI.vn = null; render(); },
    vnSel: s => { const m = UI.vn; if (!m || m.st !== 'play' || !m.code) return; m.code.sel = m.code.sel === s ? '' : s; render(); },
    vnLet: l => {
      const m = UI.vn; if (!m || m.st !== 'play' || !m.code || !m.code.sel || m.code.locked[m.code.sel]) return;
      const c = m.code; sfx('tap');
      if (l) c.guess[c.sel] = l; else delete c.guess[c.sel];
      const syms = vnSyms(c), i = syms.indexOf(c.sel), nx = l ? syms.slice(i + 1).concat(syms.slice(0, i)).find(s => !c.guess[s] && !c.locked[s]) : null;
      if (nx) c.sel = nx;
      vnAfterCode(m);
    },
    vnCheck: () => { const m = UI.vn; if (!m || !m.code) return; m.chk = true; const bad = vnSyms(m.code).some(s => m.code.guess[s] && m.code.guess[s] !== m.code.truth[s]); sfx(bad ? 'no' : 'ok'); render(); },
    vnCross: i => { const m = UI.vn, k = m && (m.cas); if (!k || m.st !== 'play') return; i = +i; if (k.out[i]) delete k.out[i]; else k.out[i] = 1; k.wrong = false; sfx('tap'); vnPersist(m); render(); },
    vnArrest: () => {
      const m = UI.vn, k = m && m.cas; if (!k || m.st !== 'play') return;
      const left = k.sus.map((s, i) => i).filter(i => !k.out[i]);
      if (left.length !== 1) return;
      if (left[0] === k.cu) vnWin(m); else { k.wrong = true; sfx('no'); }
      vnPersist(m); render();
    },
    vnHint: () => {
      const m = UI.vn; if (!m || m.st !== 'play') return;
      const stage1 = m.kind === 'code' || (m.kind === 'week' && m.stage === 1);
      if (stage1) {
        const c = m.code, open = vnSyms(c).filter(s => c.guess[s] !== c.truth[s] && !c.locked[s]); if (!open.length || !pzHintUse('ven')) { render(); return; }
        const cnt = s => c.words.reduce((a, w) => a + w.s.filter(x => x === s).length, 0); open.sort((a, b) => cnt(b) - cnt(a));
        c.guess[open[0]] = c.truth[open[0]]; c.locked[open[0]] = 1; c.sel = ''; m.hints++; sfx('magic'); vnAfterCode(m); return;
      }
      const k = m.cas, cand = k.sus.map((s, i) => i).filter(i => i !== k.cu && !k.out[i]); if (!cand.length || !pzHintUse('ven')) { render(); return; }
      k.out[cand[Math.floor(Math.random() * cand.length)]] = 1; k.wrong = false; m.hints++; sfx('magic'); vnPersist(m); render();
    }
  }
});
