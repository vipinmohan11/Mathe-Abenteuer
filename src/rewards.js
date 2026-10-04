/* =====================================================================
   REWARDS: gemeinsamer Belohnungs-Kern für alle Module
   ---------------------------------------------------------------------
   PLUGIN-API für Funktionen (feat_*.js, laufen NACH app.js, VOR boot.js)
     registerFeature({ id, title, icon:'<ICO-Name>', tint:'lav|mint|peach|sky|butter',
                       group:'world'|'make'|'earn', order:Zahl, sub:()=>'Untertitel', badge:()=>Zahl|'' ,
                       view:'<VIEWS-Name>', views:{name:fn}, acts:{name:fn}, goals:()=>[{ic,label,pct,hint}], boot:()=>{} })
   KATALOG (freischaltbare Dinge, Zustand S.unl = { id: Zeitstempel })
     regKind('avhair', { group:'avatar', label:'Haare', ic:'avatar', thumb: it => html })
     regItems([{ id:'hair.bob', kind:'avhair', name:'Bob', src:{ t:'free' } , ...eigene Felder }])
     src.t:  free | shop {cur:'c'|'s'|'f', price} | chest | lvl {n} | star {n} | stamp {n} | deck {n}
     hasItem(id), unlock(id), itemsOf(kind), srcLabel(it)
   TRUHEN: giveChest() (store.js) → openChest(); Erweiterungen: regChestExtra({ w:()=>Gewicht, give:()=>({ic,title,sub}) })
   Ton: sfx('tap'|'ok'|'pop'|'magic'|'hatch'|'chest'), AC() (gemeinsamer AudioContext, respektiert S.cfg.sound)
   ===================================================================== */

/* ---------- Feature-Registry ---------- */
const FEATS = {};
function registerFeature(f) {
  FEATS[f.id] = Object.assign({ order: 50, group: 'world', tint: 'lav' }, f);
  if (f.views) Object.assign(VIEWS, f.views);
  if (f.after && f.view) AFTER[f.view] = f.after;
  if (f.acts) Object.assign(ACT, f.acts);
  if (f.view && !ACT[f.id]) ACT[f.id] = () => go(f.view);
}
const featList = g => Object.values(FEATS).filter(f => f.group === g).sort((a, b) => a.order - b.order);

/* ---------- Katalog ---------- */
const CATALOG = {}, KIND = {};
const SHOP_GROUPS = { fino: { label: 'Fino', ic: 'fox' }, avatar: { label: 'Avatar', ic: 'avatar' }, musik: { label: 'Musik', ic: 'music' } };
function regKind(id, o) { KIND[id] = Object.assign({ label: id, group: 'fino', ic: 'sparkle', thumb: it => it.svg ? `<svg viewBox="-55 -55 110 110">${it.svg}</svg>` : `<div class="ithumb">${it.e || '❓'}</div>` }, o); }
/* REGELN: Münzen sind die einzige Währung; ausgegeben wird nur im Shop. src.t: free (nur das Allernötigste) | shop {price in Münzen} | milestone {why} (wird vom Lernfortschritt geschenkt, nie gekauft). */
const TIER_PRICE = 60;
function normSrc(it) {
  const s0 = it.src || { t: 'free' }; let s = s0;
  if (s.t === 'shop') { const k = s.cur || 'c'; s = { t: 'shop', cur: 'c', price: Math.max(5, Math.round((s.price || 10) * (k === 'f' ? 3 : k === 's' ? 12 : 1) / 5) * 5) }; }
  else if (['chest', 'lvl', 'star', 'stamp', 'deck'].includes(s.t)) s = { t: 'shop', cur: 'c', price: it.price || TIER_PRICE };
  it.src = s;
}
function regItems(list) { list.forEach(it => { it.src = it.src || { t: 'free' }; normSrc(it); CATALOG[it.id] = it; }); }
const itemsOf = kind => Object.values(CATALOG).filter(i => i.kind === kind);
function hasItem(id) {
  const it = CATALOG[id];
  if (S.unl[id]) return true;
  if (!it) return false;
  if (it.src.t === 'free') return true;
  if (it.legacy && S.owned[it.legacy] && S.owned[it.legacy].includes(it.legacyId || id)) return true;
  return false;
}
function unlock(id, quiet) {
  if (hasItem(id) && S.unl[id]) return false;
  S.unl[id] = Date.now();
  const it = CATALOG[id];
  if (it && !quiet) toast('🎁', `Neu freigeschaltet: <b>${esc(it.name)}</b>`);
  return true;
}
function srcLabel(it) {
  const s = it.src;
  if (s.t === 'shop') return `🪙 ${s.price}`;
  if (s.t === 'milestone') return `🎯 ${s.why || 'Wird beim Lernen verdient'}`;
  return '';
}
function checkUnlocks() {
  let any = false;
  if (typeof checkStamps === 'function') checkStamps();
  Object.values(FEATS).forEach(f => { if (f.check) { try { f.check(); } catch (e) { console.error(e); } } });
  if (any) save();
}
function buyItem(id) {
  const it = CATALOG[id]; if (!it || it.src.t !== 'shop' || hasItem(id)) return false;
  if (S.coins < it.src.price || shopLeft() <= 0) return false;
  S.coins -= it.src.price; unlock(id, true); S.stats.bought++;
  if (S.goal === id) S.goal = null;
  checkTrophies(); save(); return true;
}
/* Gemeinsame Kachel für einen Katalog-Gegenstand. Gesperrte Dinge bleiben sichtbar (grau), zeigen aber, was sie kosten und wie weit man ist.
   o.act = Aktion beim Antippen eines eigenen Dings · o.inShop = Kachel steht im Shop (Antippen = kaufen) · sonst führt Antippen zum Ding im Shop. */
/* Gesperrte Dinge bleiben farbig erkennbar – mit Schloss und echter Bedingung/Preis */
const LOCK = `<span class="rh-lock" aria-label="Gesperrt">${ico('lock', 13)}</span>`;
function itemTile(it, o) {
  o = o || {};
  const has = hasItem(it.id), K = KIND[it.kind] || KIND.fino || {}, sh = it.src.t === 'shop';
  const th = (K.thumb || (x => `<div class="ithumb">${x.e || ''}</div>`))(it);
  const left = sh ? Math.max(0, it.src.price - S.coins) : 0;
  const st = has ? (o.sel ? '<span class="tag on">aktiv</span>' : '') : sh ? `<span class="tag pr">🪙 ${it.src.price}</span>${left ? `<span class="tag need">noch ${left}</span>` : '<span class="tag ready">bereit</span>'}` : `<span class="tag">${ico('lock', 12)} ${esc(srcLabel(it))}</span>`;
  const act = has ? (o.act ? `data-act="${o.act}" data-arg="${esc(o.arg == null ? it.id : o.arg)}"` : '') : sh ? `data-act="${o.inShop ? 'buyItemAsk' : 'shopAt'}" data-arg="${it.id}"` : '';
  return `<button class="itile ${has ? '' : 'lk'} ${o.sel ? 'sel' : ''} ${S.goal === it.id ? 'goal' : ''}" ${act} title="${esc(it.name)}">${has ? '' : LOCK}<span class="ith">${th}</span><span class="itn">${esc(it.name)}</span>${st}</button>`;
}
/* Shop öffnen und zu einem Ding springen */
function shopAt(id) {
  const it = CATALOG[id]; if (!it) return go('shop');
  const k = KIND[it.kind] || {};
  go('shop', { shopGrp: k.group || 'fino', shopKind: it.kind, shopHi: id });
}

/* Kurzschreibweise für Quellen: 0 gratis · c25 Münzen · s5 Sterne · h5 Flammen · T Truhe · L3 Stufe · S50 Sterne gesamt · P2 Stempel · D2 Gruppen */
const SRC = c => c === '0' ? { t: 'free' } : c === 'T' ? { t: 'chest' } : { t: { c: 'shop', s: 'shop', h: 'shop', L: 'lvl', S: 'star', P: 'stamp', D: 'deck' }[c[0]], ...(c[0] === 'c' ? { cur: 'c', price: +c.slice(1) } : c[0] === 's' ? { cur: 's', price: +c.slice(1) } : c[0] === 'h' ? { cur: 'f', price: +c.slice(1) } : { n: +c.slice(1) }) };

/* ---------- Truhen ---------- */
const CHEST_EXTRA = [];
const regChestExtra = x => CHEST_EXTRA.push(x);
function chestRoll() {                                                       // Eine Truhe = eine verdiente Karte. Dinge gibt es nur im Shop.
  const cards = CARDS.filter(c => !S.cards[c.id]);
  if (cards.length) { const c = rnd(cards); S.cards[c.id] = Date.now(); return { k: 'card', id: c.id }; }
  const n = 15 + Math.floor(Math.random() * 11); giveCoins(n, 'Alle Karten gesammelt');
  return { k: 'x', ic: '🪙', title: n + ' Münzen', sub: 'Du hast schon alle Karten gefunden!' };
}
function openChest() {
  if (!S.chests) return;
  S.chests--; UI.reveal = chestRoll(); UI.ans = {};
  sfx('chest'); checkTrophies(); save(); render(); confetti(70);
}

/* ---------- Stempelpass (pro Heft eine Seite) ---------- */
const STAMP_DEFS = [
  { id: 'ent', ic: '🧭', n: 'Entdecker', d: 'In allen Gruppen angefangen', t: (m, p) => p.tried >= p.total },
  { id: 'p25', ic: '🌱', n: 'Viertel', d: '25 % der Punkte', t: (m, p) => p.pct >= 25 },
  { id: 'p50', ic: '🌿', n: 'Halbzeit', d: '50 % der Punkte', t: (m, p) => p.pct >= 50 },
  { id: 'p75', ic: '🌳', n: 'Fast da', d: '75 % der Punkte', t: (m, p) => p.pct >= 75 },
  { id: 'fer', ic: '🏁', n: 'Heft geschafft', d: 'Alle Gruppen komplett gelöst', t: (m, p) => p.done >= p.total },
  { id: 'gld', ic: '🥇', n: 'Gold überall', d: 'In jeder Gruppe mindestens Gold', t: m => m.topics.every(t => medalOf(tk(m.id, t.id)) >= 3) },
  { id: 'dia', ic: '💎', n: 'Diamant überall', d: 'In jeder Gruppe Diamant', t: m => m.topics.every(t => medalOf(tk(m.id, t.id)) >= 4) },
  { id: 'tst', ic: '⏱️', n: 'Test-Profi', d: 'Mini-Test nur mit diesem Heft: mindestens 13 von 15', t: m => S.tests.some(x => x.scope === m.id && x.score >= 13) }
];
function stampsOf(mod) {
  const m = typeof mod === 'string' ? MODULES.find(x => x.id === mod) : mod, p = modProgress(m);
  return STAMP_DEFS.map(d => ({ id: d.id, ic: d.ic, n: d.n, d: d.d, key: m.id + '.' + d.id, got: !!S.stamps[m.id + '.' + d.id], ok: !!S.stamps[m.id + '.' + d.id] || d.t(m, p) }));
}
function checkStamps() {
  MODULES.forEach(m => stampsOf(m).forEach(s => {
    if (!S.stamps[s.key] && s.ok) { S.stamps[s.key] = Date.now(); toast('🔖', `Neuer Stempel: <b>${s.n}</b> (${esc(m.title)})`); }
  }));
}
const stampCount = () => Object.keys(S.stamps || {}).length;

/* ---------- nächstes Ziel (Startbildschirm) ---------- */
function nextGoals() {
  const g = [], L = levelInfo(), n = S.daily.d === ymd() ? S.daily.n : 0;
  if (n < S.cfg.goal) g.push({ ic: 'target', label: `Tagesziel: noch ${S.cfg.goal - n} Aufgaben`, pct: Math.round(n / S.cfg.goal * 100) });
  g.push({ ic: 'coin', label: `Noch ${L.need} 🪙 bis Stufe ${L.n + 1}`, pct: L.pct });
  const shopIt = Object.values(CATALOG).filter(i => i.src.t === 'shop' && !hasItem(i.id) && i.src.cur === 'c').sort((a, b) => a.src.price - b.src.price)[0];
  if (shopIt) { const have = Math.min(S.coins, shopIt.src.price); g.push({ ic: 'bag', label: S.coins >= shopIt.src.price ? `Du kannst dir „${shopIt.name}“ kaufen!` : `Noch ${shopIt.src.price - S.coins} 🪙 bis „${shopIt.name}“`, pct: Math.round(have / shopIt.src.price * 100) }); }
  let best = null;
  MODULES.forEach(m => { const p = modProgress(m); stampsOf(m).forEach(s => { if (!s.ok && /^p\d+$/.test(s.id)) { const th = +s.id.slice(1); const c = { ic: 'stamp', label: `${m.title}: noch ${Math.max(1, Math.ceil(th / 100 * p.max - p.pts))} Punkte bis „${s.n}“`, pct: Math.round(p.pct / th * 100) }; if (!best || c.pct > best.pct) best = c; } }); });
  if (best) g.push(best);
  Object.values(FEATS).forEach(f => { if (f.goals) { try { f.goals().forEach(x => g.push(x)); } catch (e) { } } });
  return g.filter(x => x.pct < 100).sort((a, b) => b.pct - a.pct).slice(0, 3);
}

/* ---------- Ton ---------- */
let _ac = null;
function AC() {
  if (S.cfg.sound === false) return null;
  if (!_ac) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { _ac = new C(); } catch (e) { return null; } }
  if (_ac.state === 'suspended') { try { _ac.resume(); } catch (e) { } }
  return _ac;
}
function tone(f, t0, d, type, vol) {
  const ac = AC(); if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine'; o.frequency.value = f;
  const t = ac.currentTime + (t0 || 0); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + 0.05);
}
function sfx(k) {
  if (S.cfg.sound === false) return;
  try {
    const seq = { tap: [[660, 0, .08]], ok: [[523, 0, .12], [784, .09, .18]], pop: [[880, 0, .07], [1175, .05, .08]], magic: [[523, 0, .12], [659, .08, .12], [784, .16, .12], [1047, .24, .3]], hatch: [[392, 0, .12], [523, .1, .12], [659, .2, .12], [784, .3, .12], [1047, .4, .4]], chest: [[330, 0, .1], [415, .08, .1], [523, .16, .1], [659, .24, .1], [880, .34, .35]] }[k] || [];
    seq.forEach(([f, t, d]) => tone(f, t, d, 'triangle', .1));
  } catch (e) { }
}
