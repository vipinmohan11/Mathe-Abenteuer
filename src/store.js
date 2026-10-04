/* =====================================================================
   STORE: state, permanent storage, decks, rewards, trophies
   ---------------------------------------------------------------------
   Daten gehen NIE durch die App verloren. Es gibt absichtlich keine
   „Alles löschen“-Funktion. Verloren gehen sie nur, wenn der Browser
   seine Website-Daten (Cookies/Websitedaten) löscht.
   Schutz dagegen:  1) localStorage  2) IndexedDB (zweite Kopie)
   3) automatische Schnappschüsse  4) persistent-storage-Anfrage
   5) Sicherungsdatei (Eltern-Bereich)
   ===================================================================== */

/* ---------- tiny helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ymd = (d = new Date()) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return ymd(d); };
const daysBetween = (a, b) => Math.round((new Date(a + 'T12:00:00') - new Date(b + 'T12:00:00')) / 864e5);
const rnd = a => a[Math.floor(Math.random() * a.length)];
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);

const TEST_N = 15, TEST_SECS = 720;
const DECK_N = 30, BLOCK = 10, BLOCKS = 3, PTS_BLOCK = 20, PTS_MAX = 60, STARS_MAX = 9;
const WALLET = { c: 'coins', s: 'stars', f: 'flames' };

/* ---------- state ---------- */
const KEY = 'mathe_abenteuer_v1';                 // bleibt gleich, damit alter Fortschritt erhalten bleibt
const BKUP = ['mathe_abenteuer_bak1', 'mathe_abenteuer_bak2'];
let memStore = null, persistOK = true, lastSaveErr = '';
const DEF = () => ({
  v: 2, name: '', saved: 0,
  coins: 0, life: 0, stars: 0, starsLife: 0, flames: 0, flamesLife: 0, chests: 0,
  owned: { theme: ['sonne'], skin: ['fuchs'], hat: [], extra: [], bg: [], frame: [] },
  eq: { theme: 'sonne', skin: 'fuchs', hat: null, extra: null, bg: null, frame: null },
  topics: {}, decks: {}, mistakes: [], trophies: {}, cards: {},
  streak: { n: 0, last: '', best: 0 }, tests: [],
  stats: { q: 0, c: 0, fixed: 0, bought: 0, goalDays: 0, blocks: 0, perfect: 0, decks: 0, rounds: 0 },
  daily: { d: '', n: 0, sec: 0, got: false, unlocked: false, testRewarded: false },
  cfg: { goal: 20, limitMin: 0 }, pin: null, log: {}, lastLevel: 1, lastActive: '', lastBackup: 0
});
function mergeState(raw) {
  const d = DEF();
  if (!raw || typeof raw !== 'object') return d;
  for (const k of Object.keys(raw)) {                // unbekannte Felder bleiben erhalten
    const v = raw[k]; if (v === undefined || v === null) continue;
    if (isObj(d[k]) && isObj(v)) d[k] = Object.assign(d[k], v); else d[k] = v;
  }
  for (const s of Object.keys(d.owned)) if (!Array.isArray(d.owned[s])) d.owned[s] = [];
  if (!d.owned.theme.includes('sonne')) d.owned.theme.push('sonne');
  if (!d.owned.skin.includes('fuchs')) d.owned.skin.push('fuchs');
  if (!isObj(d.decks)) d.decks = {};
  if ((raw.v || 1) < 2) {                            // Übernahme von Version 1
    d.starsLife = Math.max(d.starsLife, raw.stars || 0);
    for (const k of Object.keys(d.topics)) {
      const t = d.topics[k]; if (t.medal === undefined) t.medal = !t.rounds ? 0 : t.best3 >= 10 ? 4 : t.best3 >= 7 ? 3 : (t.maxLvl >= 2 ? 2 : 1);
    }
  }
  d.v = 2;
  return d;
}
function load() {
  let best = null;
  try {
    for (const k of [KEY, ...BKUP]) {
      const r = localStorage.getItem(k); if (!r) continue;
      try { const o = JSON.parse(r); if (o && (!best || (o.saved || 0) > (best.saved || 0))) best = o; if (k === KEY && o) break; } catch (e) { }
    }
  } catch (e) { persistOK = false; }
  if (!best && memStore) best = memStore;
  return mergeState(best);
}
let idbTimer = null, bakTimer = 0;
function idbOpen() {
  return new Promise((res, rej) => {
    try { const r = indexedDB.open('mathe_abenteuer', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); }
  });
}
function idbPut(j) { idbOpen().then(db => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(j, 'state'); tx.oncomplete = () => db.close(); }).catch(() => { }); }
function idbGet() {
  return idbOpen().then(db => new Promise(res => { const q = db.transaction('kv').objectStore('kv').get('state'); q.onsuccess = () => { res(q.result); db.close(); }; q.onerror = () => res(null); })).catch(() => null);
}
function save() {
  S.saved = Date.now();
  const j = JSON.stringify(S);
  try { localStorage.setItem(KEY, j); persistOK = true; }
  catch (e) { persistOK = false; lastSaveErr = String(e && e.name || e); memStore = JSON.parse(j); }
  clearTimeout(idbTimer); idbTimer = setTimeout(() => idbPut(j), 700);
  if (persistOK && Date.now() - bakTimer > 30 * 60 * 1000) {          // rollende Schnappschüsse (alle 30 Min.)
    bakTimer = Date.now();
    try { const old = localStorage.getItem(BKUP[0]); if (old) localStorage.setItem(BKUP[1], old); localStorage.setItem(BKUP[0], j); } catch (e) { }
  }
}
let S = load();

/* ---------- levels / medals / topics ---------- */
const cumNeed = n => 15 * n * (n - 1) / 2;
const LV_TITLES = ['Rechen-Starter', 'Zahlen-Entdecker', 'Mathe-Maus', 'Rechen-Profi', 'Zehner-Held', 'Euro-Experte', 'Mathe-Meister', 'Rechen-Champion', 'Mathe-Legende'];
function levelInfo() {
  let n = 1; while (cumNeed(n + 1) <= S.life) n++;
  const a = cumNeed(n), b = cumNeed(n + 1);
  return { n, title: LV_TITLES[Math.min(n - 1, LV_TITLES.length - 1)], badge: n >= 10 ? '💎' : n >= 7 ? '🥇' : n >= 4 ? '🥈' : '🥉', pct: Math.round((S.life - a) / (b - a) * 100), need: b - S.life };
}
const MEDALS = ['', '🥉', '🥈', '🥇', '💎'];
const MEDAL_NAMES = ['noch keine', 'Bronze', 'Silber', 'Gold', 'Diamant'];
const tk = (m, t) => m + '.' + t;
function topicRec(key) {
  const t = S.topics[key] || (S.topics[key] = {});
  if (t.q === undefined) t.q = 0; if (t.c === undefined) t.c = 0; if (t.medal === undefined) t.medal = 0;
  if (!Array.isArray(t.cb)) t.cb = [0, 0, 0]; if (!Array.isArray(t.sb)) t.sb = [0, 0, 0];
  if (!isObj(t.fl)) t.fl = {}; if (t.resets === undefined) t.resets = 0;
  return t;
}
const medalOf = key => (S.topics[key] && S.topics[key].medal) || 0;
function findTopic(key) {
  const [m, t] = key.split('.'); const mod = MODULES.find(x => x.id === m); if (!mod) return null;
  const topic = mod.topics.find(x => x.id === t); return topic ? { mod, topic } : null;
}
function allTopics() { const a = []; MODULES.forEach(m => m.topics.forEach(t => a.push({ m, t, key: tk(m.id, t.id) }))); return a; }

/* ---------- decks: feste Aufgabenreihen pro Gruppe ---------- */
const mKey = (tid, q) => tid + '|' + (q.html || q.prompt || '') + '|' + q.title;
function makeQ(tid, lvl, seen) {
  const f = findTopic(tid); let q, g = 0;
  do { q = f.topic.gen(lvl); g++; } while (seen && seen.has(mKey(tid, q)) && g < 80);
  if (seen) seen.add(mKey(tid, q));
  return q;
}
function newDeck(key) {
  const qs = [], seen = new Set();
  for (let L = 1; L <= BLOCKS; L++) for (let i = 0; i < BLOCK; i++) qs.push(makeQ(key, L, seen));
  return { qs, res: Array(DECK_N).fill(null), ans: Array(DECK_N).fill(null), i: 0, ts: Date.now() };
}
function getDeck(key) {
  let d = S.decks[key];
  if (!d || !Array.isArray(d.qs) || d.qs.length !== DECK_N) { d = S.decks[key] = newDeck(key); save(); }
  return d;
}
const ptsOf = r => r === 'first' ? 2 : r === 'second' ? 1 : 0;
const deckPts = d => d ? d.res.reduce((a, r) => a + ptsOf(r), 0) : 0;
const blockRange = b => [b * BLOCK, b * BLOCK + BLOCK];
const blockPts = (d, b) => d ? d.res.slice(...blockRange(b)).reduce((a, r) => a + ptsOf(r), 0) : 0;
const blockDone = (d, b) => !!d && d.res.slice(...blockRange(b)).every(r => r !== null);
const blockStarsOf = p => p >= 18 ? 3 : p >= 14 ? 2 : p >= 10 ? 1 : 0;
const deckWrong = (d, b) => {                          // Indizes der nicht auf Anhieb richtigen Aufgaben
  const out = []; if (!d) return out;
  const [a, z] = b == null ? [0, DECK_N] : blockRange(b);
  for (let i = a; i < z; i++) if (d.res[i] === 'second' || d.res[i] === 'fail') out.push(i);
  return out;
};
function resetDeck(key) { S.decks[key] = newDeck(key); topicRec(key).resets++; save(); }

/* ---------- rewards ---------- */
function touchDay() {
  const t = ymd();
  if (S.daily.d !== t) S.daily = { d: t, n: 0, sec: 0, got: false, unlocked: false, testRewarded: false };
}
const streakNow = () => (S.streak.last === ymd() || S.streak.last === yesterday()) ? S.streak.n : 0;
function giveCoins(n) {
  if (!n) return;
  S.coins += n; S.life += n;
  const L = levelInfo();
  if (L.n > S.lastLevel) { S.lastLevel = L.n; toast(L.badge, `Neue Stufe: ${L.n} – ${L.title}!`); confetti(90); }
}
function giveStars(n) { if (n > 0) { S.stars += n; S.starsLife += n; } }
function giveFlames(n) { if (n > 0) { S.flames += n; S.flamesLife += n; } }
function giveChest() {
  if (S.chests + Object.keys(S.cards).length >= CARDS.length) return false;
  S.chests++; toast('📦', 'Neue Schatztruhe! Öffne sie im Sammelalbum.'); return true;
}
function addLog(correct) {
  const t = ymd(); const e = S.log[t] || (S.log[t] = { n: 0, c: 0 });
  e.n++; if (correct) e.c++;
  const keys = Object.keys(S.log).sort(); while (keys.length > 120) delete S.log[keys.shift()];
}
function dailyCheck() {
  touchDay(); S.daily.n++;
  if (S.daily.n >= 40) S.stats.marathon = 1;
  if (S.daily.n >= S.cfg.goal && !S.daily.got) {
    S.daily.got = true; S.stats.goalDays++;
    S.streak.n = S.streak.last === yesterday() ? S.streak.n + 1 : 1; S.streak.last = ymd(); S.streak.best = Math.max(S.streak.best || 0, S.streak.n);
    const n = S.streak.n; let fl = 1; if (n === 3) fl += 1; else if (n === 7) fl += 3; else if (n === 14) fl += 5; else if (n % 30 === 0) fl += 10;
    giveFlames(fl); giveChest();
    toast('🎯', `Tagesziel geschafft! +${fl} 🔥${n > 1 ? ' · Serie: ' + n + ' Tage' : ''}`); confetti(70);
  }
}
function addMistake(tid, q, ans) {
  const k = mKey(tid, q), e = S.mistakes.find(m => mKey(m.tid, m.q) === k);
  if (e) { if (ans) e.ans = ans; return; }
  S.mistakes.unshift({ tid, q, ans: ans || null, ts: Date.now() }); if (S.mistakes.length > 150) S.mistakes.length = 150;
}
function removeMistake(tid, q) {
  const k = mKey(tid, q); const i = S.mistakes.findIndex(m => mKey(m.tid, m.q) === k);
  if (i >= 0) { S.mistakes.splice(i, 1); S.stats.fixed++; }
}
function noteAnswer(tid, firstTry) {
  const t = topicRec(tid); t.q++; if (firstTry) t.c++;
  S.stats.q++; if (firstTry) S.stats.c++; addLog(firstTry);
  const now = new Date(), h = now.getHours() + now.getMinutes() / 60, today = ymd();
  if (h >= 19.5) S.stats.night = 1; if (h < 8) S.stats.early = 1; if (now.getDay() === 0 || now.getDay() === 6) S.stats.weekend = 1;
  if (S.lastActive && S.lastActive !== today && daysBetween(today, S.lastActive) >= 3) S.stats.comeback = 1;
  S.lastActive = today;
}

/* credit points of one answered deck question (max. 20 per block, 60 per group – fest!) */
function creditDeckAnswer(key, d, i) {
  const t = topicRec(key), b = Math.floor(i / BLOCK), now = blockPts(d, b);
  const delta = Math.max(0, now - (t.cb[b] || 0));
  if (delta > 0) { t.cb[b] = now; giveCoins(delta); }
  return delta;
}
function completeBlock(key, d, b) {
  const t = topicRec(key), pts = blockPts(d, b), stars = blockStarsOf(pts);
  const dStars = Math.max(0, stars - (t.sb[b] || 0)); if (dStars) { t.sb[b] = stars; giveStars(dStars); }
  let chest = false;
  if (!t.fl['d' + b]) { t.fl['d' + b] = 1; S.stats.blocks++; }
  if (pts === PTS_BLOCK && !t.fl['p' + b]) { t.fl['p' + b] = 1; S.stats.perfect++; }
  if (stars >= 2 && !t.fl['c' + b]) { t.fl['c' + b] = 1; chest = giveChest(); }
  t.medal = Math.max(t.medal, b + 1);
  let deckDone = false;
  if (d.i >= DECK_N && d.res.every(r => r !== null)) {
    deckDone = true;
    if (!t.fl.deck) { t.fl.deck = 1; S.stats.decks++; if (giveChest()) chest = true; }
    if (deckPts(d) >= 54) t.medal = 4;
  }
  return { b, pts, stars, dStars, chest, deckDone, firsts: d.res.slice(...blockRange(b)).filter(r => r === 'first').length, medal: t.medal };
}

/* ---------- trophies ---------- */
const sumTopic = f => allTopics().reduce((a, x) => a + f(x), 0);
function trophyList() {
  const st = () => S.stats;
  const L = [
    { id: 'blk1', i: '🌱', n: 'Erste Stufe geschafft', d: 'Eine Stufe (10 Aufgaben) beendet', t: s => s.stats.blocks >= 1 },
    { id: 'blk10', i: '🐝', n: 'Fleißbiene', d: '10 Stufen beendet', t: s => s.stats.blocks >= 10 },
    { id: 'blk30', i: '🏃', n: 'Stufen-Sammler', d: '30 Stufen beendet', t: s => s.stats.blocks >= 30 },
    { id: 'deck1', i: '🧩', n: 'Gruppe gemeistert', d: 'Alle 30 Aufgaben einer Gruppe gelöst', t: s => s.stats.decks >= 1 },
    { id: 'deck5', i: '🗺️', n: 'Fünf Gruppen gemeistert', d: '5 Gruppen komplett gelöst', t: s => s.stats.decks >= 5 },
    { id: 'perf1', i: '🎯', n: 'Volltreffer', d: 'Eine Stufe mit 10 von 10 gleich richtig', t: s => s.stats.perfect >= 1 },
    { id: 'perf5', i: '🏹', n: 'Scharfschütze', d: '5 Stufen mit 10 von 10', t: s => s.stats.perfect >= 5 },
    { id: 'perf15', i: '🦅', n: 'Adlerauge', d: '15 Stufen mit 10 von 10', t: s => s.stats.perfect >= 15 },
    { id: 'q100', i: '💯', n: '100 Aufgaben', d: '100 Aufgaben gelöst', t: s => s.stats.q >= 100 },
    { id: 'q500', i: '🚀', n: '500 Aufgaben', d: '500 Aufgaben gelöst', t: s => s.stats.q >= 500 },
    { id: 'q1000', i: '🌋', n: '1000 Aufgaben', d: '1000 Aufgaben gelöst', t: s => s.stats.q >= 1000 },
    { id: 'st3', i: '🔥', n: 'Drei Tage am Ball', d: 'Tagesziel an 3 Tagen in Folge', t: s => (s.streak.best || 0) >= 3 },
    { id: 'st7', i: '🌟', n: 'Wochen-Held', d: 'Tagesziel an 7 Tagen in Folge', t: s => (s.streak.best || 0) >= 7 },
    { id: 'st14', i: '☄️', n: 'Zwei-Wochen-Profi', d: 'Tagesziel an 14 Tagen in Folge', t: s => (s.streak.best || 0) >= 14 },
    { id: 'st30', i: '🏔️', n: 'Monats-Legende', d: 'Tagesziel an 30 Tagen in Folge', t: s => (s.streak.best || 0) >= 30 },
    { id: 'goal5', i: '🗓️', n: 'Tagesziel-Profi', d: 'Tagesziel an 5 verschiedenen Tagen', t: s => s.stats.goalDays >= 5 },
    { id: 'c150', i: '🪙', n: 'Münzsammler', d: '150 Münzen verdient', t: s => s.life >= 150 },
    { id: 'c400', i: '💰', n: 'Goldschatz', d: '400 Münzen verdient', t: s => s.life >= 400 },
    { id: 'c800', i: '🏦', n: 'Münzkönig', d: '800 Münzen verdient', t: s => s.life >= 800 },
    { id: 's30', i: '⭐', n: 'Sternenfänger', d: '30 Sterne verdient', t: s => s.starsLife >= 30 },
    { id: 's100', i: '🌠', n: 'Sternenregen', d: '100 Sterne verdient', t: s => s.starsLife >= 100 },
    { id: 'f10', i: '🔥', n: 'Flammenmeister', d: '10 Flammen verdient', t: s => s.flamesLife >= 10 },
    { id: 'test1', i: '⏱️', n: 'Mini-Test geschafft', d: 'Einen Mini-Test abgegeben', t: s => s.tests.length >= 1 },
    { id: 'test5', i: '📝', n: 'Test-Routine', d: '5 Mini-Tests abgegeben', t: s => s.tests.length >= 5 },
    { id: 'test13', i: '🎓', n: 'Test-Profi', d: 'Mini-Test mit mindestens 13 von 15', t: s => s.tests.some(x => x.score >= 13) },
    { id: 'test15', i: '🏆', n: 'Perfekter Test', d: 'Mini-Test mit 15 von 15', t: s => s.tests.some(x => x.score >= x.total) },
    { id: 'gold', i: '🥇', n: 'Goldmedaille', d: 'Gold in einer Gruppe', t: () => allTopics().some(x => medalOf(x.key) >= 3) },
    { id: 'dia', i: '💎', n: 'Diamant', d: 'Diamant in einer Gruppe (mindestens 54 von 60 Punkten)', t: () => allTopics().some(x => medalOf(x.key) >= 4) },
    { id: 'shop1', i: '🛍️', n: 'Erster Einkauf', d: 'Etwas im Shop gekauft', t: s => s.stats.bought >= 1 },
    { id: 'shop6', i: '🎁', n: 'Großeinkauf', d: '6 Dinge im Shop gekauft', t: s => s.stats.bought >= 6 },
    { id: 'shop12', i: '👑', n: 'Shop-König', d: '12 Dinge im Shop gekauft', t: s => s.stats.bought >= 12 },
    { id: 'card10', i: '📚', n: 'Kleiner Sammler', d: '10 Karten im Sammelalbum', t: s => Object.keys(s.cards).length >= 10 },
    { id: 'card30', i: '📖', n: 'Großer Sammler', d: '30 Karten im Sammelalbum', t: s => Object.keys(s.cards).length >= 30 },
    { id: 'cardall', i: '🏛️', n: 'Albumkönig', d: 'Das ganze Sammelalbum voll', t: s => Object.keys(s.cards).length >= CARDS.length },
    { id: 'fix10', i: '🔍', n: 'Fehler-Detektiv', d: '10 Aufgaben aus dem Fehler-Heft gelöst', t: s => s.stats.fixed >= 10 },
    { id: 'fix30', i: '🕵️', n: 'Meisterdetektiv', d: '30 Aufgaben aus dem Fehler-Heft gelöst', t: s => s.stats.fixed >= 30 },
    { id: 'owl', s: 1, i: '🦉', n: 'Nachteule', d: 'Am späten Abend geübt (nach 19:30 Uhr)', t: s => !!s.stats.night },
    { id: 'early', s: 1, i: '🐓', n: 'Frühaufsteher', d: 'Vor 8 Uhr morgens geübt', t: s => !!s.stats.early },
    { id: 'wknd', s: 1, i: '🏖️', n: 'Wochenend-Held', d: 'Am Samstag oder Sonntag geübt', t: s => !!s.stats.weekend },
    { id: 'comeb', s: 1, i: '🦸', n: 'Comeback', d: 'Nach mindestens 3 Tagen Pause wieder geübt', t: s => !!s.stats.comeback },
    { id: 'mara', s: 1, i: '🏅', n: 'Marathon', d: '40 Aufgaben an einem Tag', t: s => !!s.stats.marathon },
    { id: 'blitz', s: 1, i: '⚡', n: 'Blitzschnell', d: 'Mini-Test mit mindestens 13 richtigen und mehr als 6 Minuten übrig', t: s => !!s.stats.blitz }
  ];
  MODULES.forEach(m => {
    L.push({ id: m.id + '_e', i: m.icon, n: `${m.id}-Entdecker`, d: `In allen Gruppen von ${m.id} angefangen`, t: () => m.topics.every(t => (S.decks[tk(m.id, t.id)] || { i: 0 }).i > 0) });
    L.push({ id: m.id + '_m', i: '🏰', n: `${m.id}-Meister`, d: `Alle Gruppen von ${m.id} mit Gold`, t: () => m.topics.every(t => medalOf(tk(m.id, t.id)) >= 3) });
    L.push({ id: m.id + '_d', i: '💠', n: `${m.id}-Diamant`, d: `Alle Gruppen von ${m.id} mit Diamant`, t: () => m.topics.every(t => medalOf(tk(m.id, t.id)) >= 4) });
  });
  return L;
}
function checkTrophies() {
  let any = false;
  trophyList().forEach(t => { if (!S.trophies[t.id] && t.t(S)) { S.trophies[t.id] = Date.now(); any = true; toast(t.i, `Neuer Pokal: ${t.n}`); } });
  if (any) confetti(60);
}

/* ---------- answer checking ---------- */
const normIn = s => String(s || '').trim().replace(/\s+/g, '').replace(/\./g, ',');
function fieldOK(f, v) {
  v = normIn(v); if (v === '') return false;
  if (f.digit || f.strict) return v === f.a;
  if (f.money) {
    const p = x => { const m = /^(\d+)(?:,(\d{1,2}))?$/.exec(x); return m ? (+m[1]) * 100 + (m[2] ? +(m[2] + '0').slice(0, 2) : 0) : null; };
    const a = p(v), b = p(f.a); return a !== null && a === b;
  }
  return /^\d+$/.test(v) && +v === +f.a;
}
function newCtx(q) {
  const n = q.fields ? q.fields.length : 0;
  return { q, vals: Array(n).fill(''), locked: Array(n).fill(false), marks: Array(n).fill(null), focus: 0, sel: null, badCh: [], tries: 0, hinted: false, state: 'ask', res: null, firstAns: null };
}
const isCorrect = c => c.q.fields ? c.q.fields.every((f, i) => fieldOK(f, c.vals[i])) : c.sel === c.q.correct;

/* ---------- PIN ---------- */
function hashStr(s) { let h = 5381; const t = 'fino|' + s; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) >>> 0; return h.toString(36); }
const pinOk = p => !!S.pin && hashStr(p) === S.pin.h;
const recOk = p => !!S.pin && hashStr(p) === S.pin.r;

/* ---------- Tageslimit ---------- */
const limitHit = () => S.cfg.limitMin > 0 && S.daily.d === ymd() && S.daily.sec >= S.cfg.limitMin * 60 && !S.daily.unlocked;
