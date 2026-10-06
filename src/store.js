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
const DECK_N = 30, BLOCK = 10, BLOCKS = 3, STARS_MAX = 9;
/* Jede Aufgabe ist 1–4 Punkte wert (Schwierigkeit). Generator-Level 2..5 -> 1..4 Punkte.
   Pro Stufe: 5 leichtere + 5 schwerere Aufgaben, abwechselnd. Summe pro Gruppe fest: 15 + 25 + 35 = 75. */
const BLOCK_LEVELS = [[2, 3], [3, 4], [4, 5]];
const ptsForLevel = L => L - 1;
const NEW_BLOCK_MAX = BLOCK_LEVELS.map(([lo, hi]) => 5 * ptsForLevel(lo) + 5 * ptsForLevel(hi));   // [15, 25, 35]
const NEW_DECK_MAX = NEW_BLOCK_MAX.reduce((a, b) => a + b, 0);                                     // 75
const TIER = { 1: '🟢', 2: '🔵', 3: '🔥', 4: '👑' };            // Das Kind sieht nur das Symbol – nie Wörter wie „leicht“ oder „schwer“
const WALLET = { c: 'coins', s: 'stars', f: 'flames' };

/* ---------- state ---------- */
/* Admin-Modus (nur für Eltern zum Testen): eigener Speicher mit Endung „_admin“. Der Speicher des Kindes wird dabei nie gelesen oder geschrieben. */
const MODE_KEY = 'mathe_abenteuer_mode';
const ADMIN = (() => { try { return localStorage.getItem(MODE_KEY) === 'admin'; } catch (e) { return false; } })();
const SFX = ADMIN ? '_admin' : '';
const KEY = 'mathe_abenteuer_v1' + SFX;           // Kind-Speicher bleibt gleich, damit alter Fortschritt erhalten bleibt
const BKUP = ['mathe_abenteuer_bak1' + SFX, 'mathe_abenteuer_bak2' + SFX];
let memStore = null, persistOK = true, lastSaveErr = '';
const DEF = () => ({
  v: 2, name: '', avName: '', saved: 0,
  coins: 0, life: 0, stars: 0, starsLife: 0, flames: 0, flamesLife: 0, chests: 0,
  owned: { theme: ['sonne'], skin: ['fuchs'], hat: [], extra: [], bg: [], frame: [], insel: [] },
  eq: { theme: 'sonne', skin: 'fuchs', hat: null, extra: null, bg: null, frame: null },
  topics: {}, decks: {}, mistakes: [], trophies: {}, cards: {},
  unl: {}, stamps: {}, av: { use: false, look: null, saved: [] }, ins: { items: [], env: { t: 'day', s: 'sommer' }, seeded: false },
  buch: { st: {} }, wes: { eggs: [], list: [], warm: 0, given: 0 }, story: { read: {}, done: {}, choices: {} }, songs: [], mus: {},
  streak: { n: 0, last: '', best: 0 }, tests: [],
  stats: { q: 0, c: 0, fixed: 0, bought: 0, goalDays: 0, blocks: 0, perfect: 0, decks: 0, rounds: 0 },
  daily: { d: '', n: 0, sec: 0, got: false, unlocked: false, testRewarded: false, shopSec: 0, cr: { left: 0, grants: 0, used: 0, lvl: false, goal: false } },
  goal: null, earned: [], notes: [], noten: { songs: [], act: null, pref: {} }, mig3: 1,
  geo: { sessions: 0, seen: {}, ok: {}, miss: {}, k: {}, cards: {}, ms: {}, kd: {}, perf: 0, tpf: 0, kpf: 0, best: 0 },
  world: { spent: 0, open: {}, seen: {}, stamps: {}, souv: {}, quiz: {}, log: [], pass: {}, off: {}, wishes: [], tix: [] },
  flags: {},                                   // ausgeblendete Funktionen (wesen, buch, insel): Eltern können sie einschalten – nur Anzeige, Daten bleiben
  facts: { i: 0, seen: {} },                   // Lustige Fakten: Stelle im Stapel, schon gelesene
  cfg: { goal: 20, limitMin: 0, sound: true, creativeMode: 'after', creativeMin: 5, creativeMax: 2, shopMin: 5, due: {}, pageMin: 3, pageWin: 2, pageNeed: 10, plang: 'de' }, pin: null, log: {}, lastLevel: 1, lastActive: '', lastBackup: 0
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
  /* Angefangene oder fertige Gruppen werden NIE angefasst (auch nicht alte ohne „pts“). Nur ganz unberührte alte Gruppen
     (keine einzige Antwort) bekommen die neuen, kniffligeren Aufgaben – dabei geht nichts verloren. */
  for (const k of Object.keys(d.decks)) {
    const dk = d.decks[k];
    const untouched = dk && Array.isArray(dk.qs) && Array.isArray(dk.res) && !(dk.i > 0) && dk.res.every(r => r === null || r === undefined) && !(dk.ans || []).some(a => a);
    if (untouched && !dk.pts) delete d.decks[k];
  }
  if ((raw.v || 1) < 2) {                            // Übernahme von Version 1
    d.starsLife = Math.max(d.starsLife, raw.stars || 0);
    for (const k of Object.keys(d.topics)) {
      const t = d.topics[k]; if (t.medal === undefined) t.medal = !t.rounds ? 0 : t.best3 >= 10 ? 4 : t.best3 >= 7 ? 3 : (t.maxLvl >= 2 ? 2 : 1);
    }
  }
  /* Version 3: Flammen sind keine Währung mehr (1 Flamme = 3 Münzen). Einmalig umgerechnet, nichts geht verloren. */
  if (!raw.mig3) { if (d.flames > 0) { d.coins += d.flames * 3; } d.flames = 0; d.mig3 = 1; }
  if (!isObj(d.daily.cr)) d.daily.cr = { left: 0, grants: 0, used: 0, lvl: false, goal: false };
  if (!Array.isArray(d.earned)) d.earned = [];
  if (d.cfg.creativeMode === 'always') d.cfg.creativeMode = 'after';
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
    try { const r = indexedDB.open('mathe_abenteuer' + SFX, 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); }
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
  const qs = [], lv = [], seen = new Set();
  BLOCK_LEVELS.forEach(([lo, hi]) => {
    const A = [], B = [];
    for (let i = 0; i < BLOCK / 2; i++) { A.push(makeQ(key, lo, seen)); B.push(makeQ(key, hi, seen)); }
    for (let i = 0; i < BLOCK / 2; i++) { qs.push(A[i], B[i]); lv.push(lo, hi); }          // leicht, schwer, leicht, schwer …
  });
  return { v: 2, qs, lv, pts: lv.map(ptsForLevel), res: Array(DECK_N).fill(null), ans: Array(DECK_N).fill(null), i: 0, ts: Date.now() };
}
function newScheme(key) {                              // einmalig beim Wechsel auf das neue Punktesystem: Bestwerte neu starten
  const t = topicRec(key);
  if (t.scheme !== 2) { t.scheme = 2; t.cb = [0, 0, 0]; t.sb = [0, 0, 0]; }
}
function getDeck(key) {
  let d = S.decks[key];
  if (!d || !Array.isArray(d.qs) || d.qs.length !== DECK_N) { newScheme(key); d = S.decks[key] = newDeck(key); save(); }
  return d;
}
/* Punkte: 1. Versuch = voll, 2. Versuch/Tipp = halb (abgerundet), Lösung gezeigt = 0. Alte Gruppen (ohne pts) zählen 2 je Aufgabe. */
const qPts = (d, i) => (d && d.pts && d.pts[i] != null) ? d.pts[i] : 2;
const ptsOf = (r, p) => r === 'first' ? p : r === 'second' ? Math.floor(p / 2) : 0;
const deckPts = d => d ? d.res.reduce((a, r, i) => a + ptsOf(r, qPts(d, i)), 0) : 0;
const blockRange = b => [b * BLOCK, b * BLOCK + BLOCK];
const blockPts = (d, b) => d ? d.res.slice(...blockRange(b)).reduce((a, r, k) => a + ptsOf(r, qPts(d, b * BLOCK + k)), 0) : 0;
const blockMax = (d, b) => { if (!d) return NEW_BLOCK_MAX[b]; let m = 0; for (let k = 0; k < BLOCK; k++) m += qPts(d, b * BLOCK + k); return m; };
const deckMax = d => [0, 1, 2].reduce((a, b) => a + blockMax(d, b), 0);
const blockDone = (d, b) => !!d && d.res.slice(...blockRange(b)).every(r => r !== null);
const starNeed = (max, n) => Math.ceil(max * (n === 3 ? .9 : n === 2 ? .7 : .5));              // 90 % / 70 % / 50 %
const blockStarsOf = (p, max) => p >= starNeed(max, 3) ? 3 : p >= starNeed(max, 2) ? 2 : p >= starNeed(max, 1) ? 1 : 0;
const deckWrong = (d, b) => {                          // Indizes der nicht auf Anhieb richtigen Aufgaben
  const out = []; if (!d) return out;
  const [a, z] = b == null ? [0, DECK_N] : blockRange(b);
  for (let i = a; i < z; i++) if (d.res[i] === 'second' || d.res[i] === 'fail') out.push(i);
  return out;
};
function resetDeck(key) { newScheme(key); S.decks[key] = newDeck(key); topicRec(key).resets++; save(); }
/* Neue Runde: nur möglich, wenn alle 30 Aufgaben einer Gruppe geschafft sind (sonst könnte man die schweren Aufgaben
   immer wieder umgehen). Medaille, Pokale, Sterne und Münzen im Geldbeutel bleiben. Neue Aufgaben = neue Belohnungen. */
const deckFinished = d => !!d && d.i >= DECK_N && d.res.every(r => r !== null);
function newRound(key) {
  const d = S.decks[key]; if (!deckFinished(d)) return false;
  const t = topicRec(key);
  (t.hist = Array.isArray(t.hist) ? t.hist : []).push({ ts: Date.now(), done: t.doneTs || 0, pts: deckPts(d), max: deckMax(d) }); if (t.hist.length > 40) t.hist.shift();
  t.doneTs = 0; t.round = (t.round || 1) + 1; t.scheme = 2; t.cb = [0, 0, 0]; t.sb = [0, 0, 0]; t.revPaid = 0;
  ['c0', 'c1', 'c2'].forEach(f => delete t.fl[f]);     // Truhen für gute Stufen gibt es in jeder Runde neu
  S.decks[key] = newDeck(key); save(); return true;
}
const bestRound = key => { const t = S.topics[key], d = S.decks[key]; let m = 0; ((t && t.hist) || []).forEach(h => { m = Math.max(m, h.pts); }); if (deckFinished(d)) m = Math.max(m, deckPts(d)); return m; };

/* ---------- rewards ---------- */
function touchDay() {
  const t = ymd();
  if (S.daily.d !== t) S.daily = { d: t, n: 0, sec: 0, got: false, unlocked: false, testRewarded: false, shopSec: 0, pg: {}, cr: { left: 0, grants: 0, used: 0, lvl: false, goal: false } };
  if (!S.daily.cr) S.daily.cr = { left: 0, grants: 0, used: 0, lvl: false, goal: false };
  if (!S.daily.pg || typeof S.daily.pg !== 'object') S.daily.pg = {};
}
const streakNow = () => (S.streak.last === ymd() || S.streak.last === yesterday()) ? S.streak.n : 0;
/* Protokoll „Neu verdient“: jede Belohnung nennt ihren Grund */
function noteEarn(ic, text) { S.earned.unshift({ ic, text, ts: Date.now() }); if (S.earned.length > 12) S.earned.length = 12; }
function giveCoins(n, why) {
  if (!n) return;
  if (why) noteEarn('🪙', `+${n} Münzen · ${why}`);
  S.coins += n; S.life += n;
  const L = levelInfo();
  if (L.n > S.lastLevel) { S.lastLevel = L.n; toast(L.badge, `Neue Stufe: ${L.n} – ${L.title}!`); confetti(90); }
}
function giveStars(n) { if (n > 0) { S.stars += n; S.starsLife += n; } }
function giveFlames(n, why) { if (n > 0) { S.flamesLife += n; giveCoins(n * 3, why); } }        // Flammen sind nur noch eine Anzeige (Serie); der Gegenwert kommt als Münzen
function giveChest() {
  S.chests++; noteEarn('🃏', 'Eine neue Karte wartet in der Schatzkammer'); return true;
}
/* ---------- Mini-Test: pro Tag zählt das BESTE Ergebnis ----------
   Ein späterer, besserer Test zahlt nur die Differenz zur schon bezahlten Stufe (wie die Block-Gutschriften).
   Max. pro Tag unverändert: 10 Münzen + 3 Sterne + 1 Karte. Ein schwacher erster Test verbraucht nichts mehr.
   S.daily.tp = { c, s, ch } = heute schon bezahlt. Alter Stand (nur testRewarded) zählt als „alles bezahlt“. */
const TEST_TIERS = [[13, 10, 3, true], [12, 6, 2, true], [10, 6, 2, false], [7, 3, 1, false]];
const TEST_MAX = { c: 10, s: 3, ch: true };
function testTier(score) { const t = TEST_TIERS.find(x => score >= x[0]); return t ? { c: t[1], s: t[2], ch: t[3] } : { c: 0, s: 0, ch: false }; }
function testPaid() { touchDay(); const d = S.daily; if (!d.tp) d.tp = d.testRewarded ? Object.assign({}, TEST_MAX) : { c: 0, s: 0, ch: false }; return d.tp; }
function testLeft() { const p = testPaid(); return { c: TEST_MAX.c - p.c, s: TEST_MAX.s - p.s, ch: !p.ch }; }
function payTest(score) {
  const p = testPaid(), t = testTier(score), r = { c: Math.max(0, t.c - p.c), s: Math.max(0, t.s - p.s), ch: t.ch && !p.ch };
  p.c += r.c; p.s += r.s; p.ch = p.ch || r.ch;
  giveCoins(r.c, 'Mini-Test'); giveStars(r.s); r.chest = r.ch ? giveChest() : false;
  S.daily.testRewarded = p.c >= TEST_MAX.c && p.s >= TEST_MAX.s && p.ch;
  return r;
}
/* ---------- Kreativzeit: nach dem Üben öffnet sich ein kurzes Zeitfenster ---------- */
/* Kreativzeit gibt es nur nach dem Üben („after“) oder gar nicht („locked“). Ein früher gespeichertes „immer offen“ wird beim Laden zu „nach dem Üben“ (mergeState); die Eltern-Seite bietet es nicht mehr an. Nur der Admin-Modus ist immer offen. */
function creativeMode() { return ADMIN ? 'always' : ((S.cfg && S.cfg.creativeMode) || 'after'); }
function grantCreative(kind) {
  touchDay(); const c = S.daily.cr, m = creativeMode();
  if (m !== 'after' || c[kind]) return false;
  if (c.grants >= (S.cfg.creativeMax || 2)) return false;
  c[kind] = true; c.grants++; c.left += Math.max(1, S.cfg.creativeMin || 5) * 60;
  noteEarn('🎨', `Kreativzeit: ${S.cfg.creativeMin || 5} Minuten`);
  toast('🎨', `Geschafft! ${S.cfg.creativeMin || 5} Minuten Kreativzeit warten auf dich.`); return true;
}
const creativeLeft = () => { touchDay(); return S.daily.cr.left; };
const creativeOK = () => { const m = creativeMode(); return m === 'always' || (m === 'after' && creativeLeft() > 0) || (UI.pinCreative && Date.now() < UI.pinCreative); };
const shopLeft = () => { if (ADMIN) return Infinity; touchDay(); const lim = (S.cfg.shopMin || 0) * 60; return lim ? Math.max(0, lim - (S.daily.shopSec || 0)) : Infinity; };
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
    giveFlames(fl, 'Tagesziel geschafft'); giveChest(); grantCreative('goal');
    toast('🎯', `Tagesziel geschafft!${n > 1 ? ' Serie: ' + n + ' Tage' : ''}`); confetti(70);
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

/* credit points of one answered deck question (pro Runde nie mehr als der Block-Höchstwert) */
const REV_DAYS = 7, REV_CAP = 15;                                        // Wiederholung einer fertigen Gruppe: frühestens nach 7 Tagen, höchstens 15 Münzen pro Runde
function repeatState(t) {
  const h = Array.isArray(t.hist) ? t.hist : []; if (!h.length) return null;                 // erste Runde: normal
  const last = h[h.length - 1], days = (Date.now() - (last.done !== undefined ? last.done : last.ts)) / 864e5;
  return { ok: days >= REV_DAYS, paid: t.revPaid || 0 };
}
function creditDeckAnswer(key, d, i) {
  const t = topicRec(key), b = Math.floor(i / BLOCK), now = blockPts(d, b), rs = repeatState(t);
  let delta = Math.max(0, now - (t.cb[b] || 0));
  if (rs) { delta = rs.ok ? Math.min(delta, Math.max(0, REV_CAP - rs.paid)) : 0; if (delta > 0) t.revPaid = rs.paid + delta; t.cb[b] = now; }
  else if (delta > 0) t.cb[b] = now;
  if (delta > 0) giveCoins(delta, rs ? 'Wiederholt nach ein paar Tagen' : 'Gelöste Aufgaben');
  return delta;
}
function completeBlock(key, d, b) {
  const t = topicRec(key), pts = blockPts(d, b), stars = blockStarsOf(pts, blockMax(d, b));
  const rs0 = repeatState(t), dStars0 = Math.max(0, stars - (t.sb[b] || 0)), dStars = rs0 && !rs0.ok ? 0 : dStars0; if (dStars0) { t.sb[b] = stars; giveStars(dStars); }
  if (!rs0 || rs0.ok) grantCreative('lvl');
  let chest = false;
  if (!t.fl['d' + b]) { t.fl['d' + b] = 1; S.stats.blocks++; }
  if (pts === blockMax(d, b) && !t.fl['p' + b]) { t.fl['p' + b] = 1; S.stats.perfect++; }
  if (stars >= 2 && !t.fl['c' + b] && (!rs0 || rs0.ok)) { t.fl['c' + b] = 1; chest = giveChest(); }
  t.medal = Math.max(t.medal, b + 1);
  let deckDone = false;
  if (d.i >= DECK_N && d.res.every(r => r !== null)) {
    deckDone = true;
    t.doneTs = Date.now();
    if (!t.fl.deck) { t.fl.deck = 1; S.stats.decks++; if (giveChest()) chest = true; }
    if (deckPts(d) >= Math.ceil(deckMax(d) * .9)) t.medal = 4;
  }
  return { b, pts, max: blockMax(d, b), stars, dStars, chest, deckDone, firsts: d.res.slice(...blockRange(b)).filter(r => r === 'first').length, medal: t.medal };
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
    { id: 'dia', i: '💎', n: 'Diamant', d: 'Diamant in einer Gruppe (mindestens 90 % der Punkte)', t: () => allTopics().some(x => medalOf(x.key) >= 4) },
    { id: 'shop1', i: '🛍️', n: 'Erster Einkauf', d: 'Etwas im Shop gekauft', t: s => s.stats.bought >= 1 },
    { id: 'shop6', i: '🎁', n: 'Großeinkauf', d: '6 Dinge im Shop gekauft', t: s => s.stats.bought >= 6 },
    { id: 'shop12', i: '👑', n: 'Shop-König', d: '12 Dinge im Shop gekauft', t: s => s.stats.bought >= 12 },
    { id: 'card10', i: '📚', n: 'Kleiner Sammler', d: '10 Karten in der Schatzkammer', t: s => Object.keys(s.cards).length >= 10 },
    { id: 'card30', i: '📖', n: 'Großer Sammler', d: '30 Karten in der Schatzkammer', t: s => Object.keys(s.cards).length >= 30 },
    { id: 'cardall', i: '🏛️', n: 'Schatzkönig', d: '100 Karten in der Schatzkammer', t: s => Object.keys(s.cards).length >= 100 },
    { id: 'card250', i: '🗝️', n: 'Schatzmeister', d: '250 Karten in der Schatzkammer', t: s => Object.keys(s.cards).length >= 250 },
    { id: 'stp1', i: '🔖', n: 'Erster Stempel', d: 'Den ersten Stempel im Buch bekommen', t: s => Object.keys(s.stamps || {}).length >= 1 },
    { id: 'stp10', i: '📔', n: 'Stempel-Sammler', d: '10 Stempel im Buch', t: s => Object.keys(s.stamps || {}).length >= 10 },
    { id: 'wes1', i: '🥚', n: 'Erstes Wesen', d: 'Ein Ei ausgebrütet', t: s => s.starsLife >= 3 },
    { id: 'wes5', i: '🐲', n: 'Wesen-Freundin', d: '5 Wesen ausgebrütet', t: s => s.starsLife >= 46 },
    { id: 'ins10', i: '🏝️', n: 'Inselbaumeister', d: '10 Gruppen geschafft – deine Insel wächst', t: s => s.stats.decks >= 10 },
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
    L.push({ id: m.id + '_e', i: m.icon, n: `${m.title}: Entdecker`, d: `In allen Gruppen von „${m.title}“ angefangen`, t: () => m.topics.every(t => (S.decks[tk(m.id, t.id)] || { i: 0 }).i > 0) });
    L.push({ id: m.id + '_m', i: '🏰', n: `${m.title}: Meister`, d: `Alle Gruppen von „${m.title}“ mit Gold`, t: () => m.topics.every(t => medalOf(tk(m.id, t.id)) >= 3) });
    L.push({ id: m.id + '_d', i: '💠', n: `${m.title}: Diamant`, d: `Alle Gruppen von „${m.title}“ mit Diamant`, t: () => m.topics.every(t => medalOf(tk(m.id, t.id)) >= 4) });
  });
  if (typeof geoTrophies === 'function') geoTrophies().forEach(t => L.push(t));
  if (typeof worldTrophies === 'function') worldTrophies().forEach(t => L.push(t));
  return L;
}
function checkTrophies() {
  let any = false; const quiet = typeof UI !== 'undefined' && UI && UI.wQuiet;          // Weltreise: Pokale still vergeben
  trophyList().forEach(t => { if (!S.trophies[t.id] && t.t(S)) { S.trophies[t.id] = Date.now(); any = true; if (!quiet) toast(t.i, `Neuer Pokal: ${t.n}`); } });
  if (any && !quiet) confetti(60);
  if (typeof checkUnlocks === 'function') checkUnlocks();
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
const limitHit = () => !ADMIN && S.cfg.limitMin > 0 && S.daily.d === ymd() && S.daily.sec >= S.cfg.limitMin * 60 && !S.daily.unlocked;
