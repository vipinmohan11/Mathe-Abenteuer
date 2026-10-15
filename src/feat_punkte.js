/* =====================================================================
   BLINKIS PUNKTKARTEN (in Meine Welt, von den Eltern einschaltbar; Standard: ausgeblendet)
   Binärzahlen mit Punktkarten, frei nach „Count the Dots“ (CS Unplugged, University of Canterbury, CC BY-SA),
   dem Gedankenlese-Trick (cs4fn, Queen Mary University of London), Stellenwert-Vergleich (Exploring Binary),
   Bestell-Spiel (Cornell) und Buchstaben-Armband (Code.org). Fragen statt Erklären: Garlikov (Eltern-Karte).
   Eine Idee pro Entdeckung. Die Karten sind das einzige Werkzeug: antippen = umdrehen (offen / zu).
   Keine Münzen, Sticker oder Pokale – die Entdeckung ist die Belohnung; das Armband bleibt als eigenes Werk.
   Gespeichert: S.punkte = { done{n:ts}, snd (Kartentöne, Standard AN; „Töne aus“ der App gilt immer), trick{guess,show}, lumi, arm[], word[], tag{days{ymd:1}}, friends[{n,c,ts}] }
   Freundes-Armbänder (ab Entdeckung 10): Name selbst schreiben, Buchstaben mit den Karten bauen, Sammlung, „Wem gehört das Armband?“, Perlen-Plan.
   Buchstaben: A = 1 … Z = 26, Ä = 27, Ö = 28, Ü = 29, ß = 30 (fünf Karten schaffen bis 31).
   Blinkis Tagesrätsel (UI.pkLv = 'tag'): jeden Tag drei kurze Rätsel aus dem Datum, ab Entdeckung 4; der Zähler bleibt sichtbar.
   Aufbau: Übersicht (VIEWS.punkte, normales Zeichnen) · Entdeckung (VIEWS.pkLevel: Rahmen, Inhalt wird in AFTER aufgebaut,
   damit Karten wirklich umklappen) · Druckbogen (VIEWS.pkDruck)
   ===================================================================== */
const PK_LV = [
  { id: 1, t: 'Eine Karte', s: 'Offen oder zu', c: 'Eine Karte hat zwei Zustände: <b>offen</b> oder <b>zu</b>.' },
  { id: 2, t: 'Zwei Karten', s: 'Welche Zahlen gehen?', c: 'Zwei Karten schaffen <b>0, 1, 2 und 3</b> – jede Zahl genau einmal.' },
  { id: 3, t: 'Die neue Karte', s: 'Wie viele Punkte hat sie?', c: 'Jede neue Karte hat <b>doppelt so viele</b> Punkte: 1, 2, 4.' },
  { id: 4, t: 'Der Geheimcode', s: 'Offen = 1, zu = 0', c: 'Offen = <b>1</b>, zu = <b>0</b>. 101 heißt 4 + 1 = 5.' },
  { id: 5, t: 'Der Zaubertrick', s: 'Blinki liest Gedanken', c: 'Die <b>erste Zahl</b> jeder Zauberkarte ist ihre Punktkarte.' },
  { id: 6, t: 'Schule und Blinki', s: 'Was ist gleich, was ist anders?', c: 'Schule: <b>10-mal</b> so viel. Blinki: <b>doppelt</b> so viel.' },
  { id: 7, t: 'Mehr Karten', s: 'Die 8 und die 16', c: 'Fünf Karten schaffen alle Zahlen von <b>0 bis 31</b>.' },
  { id: 14, t: 'Wenigste Züge', s: 'Kein Zug zu viel', c: 'Erst schauen, welche Karten <b>anders</b> sein müssen – dann reicht <b>jede einmal</b>.' },
  { id: 8, t: 'Lumi bestellt', s: 'Eine Nachricht aus Licht', c: 'Nur mit <b>an</b> und <b>aus</b> kann man Nachrichten schicken.' },
  { id: 9, t: 'Erklär es Lumi', s: 'Jetzt erklärst du', c: 'Die offenen Karten <b>zusammenzählen</b> – dann stimmt die Zahl.' },
  { id: 10, t: 'Dein Licht-Armband', s: 'Buchstaben als Code', c: 'Jeder Buchstabe ist eine Zahl: <b>A = 1</b> … Z = 26.' },
  { id: 11, t: 'Der große Zaubertrick', s: 'Vier Karten, Zahlen bis 15', c: 'Vier Zauberkarten erraten jede Zahl von <b>1 bis 15</b>.' },
  { id: 12, t: 'Die 32 und die 64', s: 'Wie groß geht es?', c: 'Die größte Zahl ist immer <b>eins weniger</b> als die nächste Karte.' },
  { id: 13, t: 'Der echte Computer-Code', s: 'Bonus: A = 65', c: 'Im Computer ist <b>A = 64 + 1 = 65</b>.' }
];
const PK_MAX = PK_LV.length;
const PK_NOTE = { 1: 1318.5, 2: 987.8, 4: 659.3, 8: 493.9, 16: 329.6, 32: 261.6, 64: 196 };
const PK_SNACK = [null, ['🍎', 'Apfel'], ['🥨', 'Brezel'], ['🍪', 'Keks'], ['🧃', 'Saft'], ['🍌', 'Banane'], ['🥕', 'Möhre'], ['🧁', 'Muffin']];
const PK_TRICK = [{ v: 4, nums: [4, 5, 6, 7] }, { v: 2, nums: [2, 3, 6, 7] }, { v: 1, nums: [1, 3, 5, 7] }];
const PK_TRICK4 = [8, 4, 2, 1].map(v => ({ v, nums: Array.from({ length: 15 }, (_, k) => k + 1).filter(n => n & v) }));
const PK_ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß';
const PK_BEAD = [{ v: 1, n: 'Gelb' }, { v: 2, n: 'Blau' }, { v: 4, n: 'Grün' }, { v: 8, n: 'Violett' }, { v: 16, n: 'Orange' }];
const PK_SPECIAL = { tag: 'Blinkis Tagesrätsel', freund: 'Neues Freundes-Armband', wem: 'Wem gehört das Armband?' };

function pkS() {
  const p = (S.punkte && typeof S.punkte === 'object' && !Array.isArray(S.punkte)) ? S.punkte : (S.punkte = {});
  if (!p.done || typeof p.done !== 'object' || Array.isArray(p.done)) p.done = {};
  if (typeof p.snd !== 'boolean') p.snd = true;
  if (!p.trick || typeof p.trick !== 'object' || Array.isArray(p.trick)) p.trick = {};
  if (!(p.trick.guess >= 0)) p.trick.guess = 0; if (!(p.trick.show >= 0)) p.trick.show = 0;
  if (!(p.lumi >= 0)) p.lumi = 0;
  if (!Array.isArray(p.arm)) p.arm = [];
  if (!Array.isArray(p.word)) p.word = [];
  if (!Array.isArray(p.friends)) p.friends = [];
  if (!p.tag || typeof p.tag !== 'object' || Array.isArray(p.tag)) p.tag = {};
  if (!p.tag.days || typeof p.tag.days !== 'object' || Array.isArray(p.tag.days)) p.tag.days = {};
  return p;
}
const pkDoneN = () => PK_LV.filter(L => pkS().done[L.id]).length;
const pkIdx = id => PK_LV.findIndex(L => L.id === id);
const pkOpen = n => { const i = pkIdx(n), d = pkS().done; return i === 0 || !!d[n] || (i > 0 && !!d[PK_LV[i - 1].id]); };
const pkNextLv = () => { const L = PK_LV.find(L => !pkS().done[L.id]); return L ? L.id : 1; };
const pkSub = () => { const n = pkDoneN(); return n ? `${n} von ${PK_MAX} entdeckt` : 'Zählen wie ein Computer'; };

/* ---------- Töne: nur zwei Stimmen. „bi“ = offene Karte (hell), „bup“ = zugedrehte Karte (tief).
   Jede Karte hat ihre Tonhöhe: größere Karte, tiefere Stimme. Eine Zahl „singt“ ihre Karten von links nach rechts –
   aber nur, wo es etwas bedeutet (Code, Zaubertrick, Lumi). ---------- */
const pkSnd = () => pkS().snd && !(S.cfg && S.cfg.sound === false);
function pkTone(f, t, d, type, vol) { if (!pkSnd()) return; try { tone(f, t, d, type, vol); } catch (e) { } }
const pkBi = (v, t = 0) => { pkTone(PK_NOTE[v], t, .09, 'square', .035); pkTone(PK_NOTE[v] * 2, t, .07, 'triangle', .03); };
const pkBup = (v, t = 0) => pkTone(Math.max(PK_NOTE[v] / 4, 60), t, .16, 'sine', .17);
const pkNope = () => { pkTone(300, 0, .13, 'sawtooth', .03); pkTone(240, .14, .18, 'sawtooth', .03); };
const pkAsk = () => { pkTone(523, 0, .14, 'triangle', .09); pkTone(784, .16, .3, 'triangle', .09); };
const pkTick = () => pkTone(660, 0, .05, 'triangle', .05);

/* ---------- Laufzeit (Zeitgeber werden beim Verlassen und Neuaufbau gestoppt) ---------- */
const PK = { fx: [] };
function pkLater(ms, fn) { PK.fx.push(setTimeout(() => { try { fn(); } catch (e) { console.error(e); } }, ms)); }
function pkClear() { PK.fx.forEach(clearTimeout); PK.fx = []; }
function pkEl(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function pkAnim(el, cls) { if (!el) return; el.classList.remove('pk-pop', 'pk-wiggle', 'pk-bump'); void el.offsetWidth; el.classList.add('pk-' + cls); }
const pkCol = v => `--c:var(--pk-c${v});--ci:var(--pk-i${v})`;
const pkPill = (v, txt) => `<i class="pk-pill" style="${pkCol(v)}">${txt == null ? v : txt}</i>`;
function pkSing(states, delay, onCard, fig) {
  const step = .24;
  states.forEach((s, i) => {
    (s.up ? pkBi : pkBup)(s.v, delay + i * step);
    if (onCard) { pkLater((delay + i * step) * 1000, () => onCard(i, true)); pkLater((delay + i * step + .2) * 1000, () => onCard(i, false)); }
  });
  if (fig) { pkLater(delay * 1000, () => fig.talk(true)); pkLater((delay + states.length * step) * 1000, () => fig.talk(false)); }
  return (delay + states.length * step) * 1000;
}

/* ---------- Figuren: Blinki und Lumi aus dem Lichterturm (gleiche Welt), sonst eine einfache Lampe ---------- */
function pkBotSvg(who, mood) {
  const lumi = who === 'lumi', out = (!lumi && S.licht && S.licht.eq && S.licht.eq.out) || 'none';
  if (typeof ltBotG === 'function') return `<svg viewBox="0 0 100 112" class="pk-bot" role="img" aria-label="${lumi ? 'Lumi' : 'Blinki'}">${ltBotG(mood || 'idle', lumi ? '' : out, true, lumi ? 'lumi' : '')}</svg>`;
  return `<svg viewBox="0 0 100 112" class="pk-bot" role="img" aria-label="${lumi ? 'Lumi' : 'Blinki'}"><rect x="17" y="26" width="66" height="72" rx="23" fill="${lumi ? '#e8def1' : '#e5eddb'}"/><rect x="25" y="40" width="50" height="30" rx="13" fill="#173637"/><circle cx="40" cy="55" r="5" fill="#b7f2d7"/><circle cx="60" cy="55" r="5" fill="#b7f2d7"/></svg>`;
}
function pkScene(root, who, tools) {
  const w = pkEl('div', 'pk-scene'), fig = pkEl('div', 'pk-fig'), bub = pkEl('p', 'pk-bubble' + (who === 'lumi' ? ' lumi' : ''));
  bub.setAttribute('aria-live', 'polite');
  const tw = pkEl('div', 'pk-tools');
  w.append(fig, bub, tw); root.append(w);
  let mood = 'idle';
  const F = {
    el: w, fig,
    say(h) { bub.innerHTML = h || ''; bub.hidden = !h; },
    mood(m) { mood = m; fig.innerHTML = pkBotSvg(who, m); },
    hop() { pkAnimFig('hop'); }, shake() { pkAnimFig('shake'); },
    talk(on) { fig.classList.toggle('talk', !!on); },
    tool(icon, label, fn) { const b = pkEl('button', 'pk-tool', ico(icon, 20)); b.type = 'button'; b.setAttribute('aria-label', label); b.title = label; b.addEventListener('click', fn); tw.append(b); return b; }
  };
  function pkAnimFig(c) { fig.classList.remove('hop', 'shake'); void fig.offsetWidth; fig.classList.add(c); }
  F.mood('idle');
  if (tools !== false) {
    const sb = F.tool(pkS().snd ? 'speaker' : 'speakerOff', '', () => { const p = pkS(); p.snd = !p.snd; save(); paint(); if (p.snd) pkBi(1); });
    const paint = () => { const on = pkS().snd; sb.innerHTML = ico(on ? 'speaker' : 'speakerOff', 20); sb.setAttribute('aria-label', on ? 'Kartentöne aus' : 'Kartentöne an'); sb.title = sb.getAttribute('aria-label'); sb.classList.toggle('off', !on); };
    paint();
  }
  return F;
}

/* ---------- Kartenbühne: Zähler, Punktkarten, Fundzettel ---------- */
function pkStage(root, cfg) {
  cfg = cfg || {};
  const A = { slots: [], cards: [], found: new Set(), taps: 0, nSt: 0, code: !!cfg.code, lamps: !!cfg.lamps, lock: false, demo: false };
  const counter = pkEl('div', 'pk-counter', `<span class="pk-label">${cfg.label || 'Leuchtpunkte'}</span><div class="pk-crow"><span class="pk-code" aria-hidden="true"></span><span class="pk-eq" aria-hidden="true">=</span><b class="pk-num" aria-live="polite">0</b></div><div class="pk-tray" aria-hidden="true"></div>`);
  const deck = pkEl('div', 'pk-cards'), stamps = pkEl('div', 'pk-stamps');
  if (!cfg.noCounter) root.append(counter);
  root.append(deck, stamps);
  A.el = { counter, deck, stamps };
  A.total = () => A.cards.reduce((s, c) => s + (c.up ? c.v : 0), 0);
  A.build = (vals, ups, fresh) => {
    fresh = fresh || [];
    A.cards = vals.map((v, i) => ({ v, up: !!ups[i], fresh: fresh.includes(v), seen: !!ups[i], invite: fresh.includes(v) }));
    deck.className = 'pk-cards n' + vals.length + (cfg.terms ? ' pk-sumrow' : ''); deck.innerHTML = ''; A.slots = [];
    counter.classList.toggle('many', vals.length > 4);
    A.cards.forEach((c, i) => {
      const s = pkEl('div', 'pk-slot' + (c.fresh ? ' arrive' : ''));
      s.setAttribute('style', pkCol(c.v)); s.dataset.v = c.v;
      s.innerHTML = `<span class="pk-lamp"${A.lamps ? '' : ' hidden'} aria-hidden="true"></span><button class="pk-card" type="button"><span class="pk-flip"><span class="pk-face pk-front"><span class="pk-dots" data-v="${c.v}">${'<i></i>'.repeat(c.v)}</span></span><span class="pk-face pk-back"></span></span></button>${cfg.terms ? `<span class="pk-sval">${c.v}</span>` : ''}<span class="pk-bit"${A.code ? '' : ' hidden'} aria-hidden="true"></span>${cfg.terms ? '<span class="pk-term"></span>' : ''}`;
      s.querySelector('.pk-card').addEventListener('click', () => A.tap(i));
      deck.append(s); A.slots.push(s);
    });
    A.refresh(false);
  };
  A.tap = i => {
    if (A.lock) return;
    if (A.demo) A.stopDemo();
    const c = A.cards[i]; if (!c) return;
    c.up = !c.up; c.invite = false; A.taps++;
    let wait = .35;
    const slot = A.slots[i], card = slot.querySelector('.pk-card');
    if (c.up && c.fresh && !c.seen && c.v > 1) {
      // erstes Aufdecken: die neue Karte zeigt sich als zwei Karten von davor
      c.seen = true; card.classList.remove('split'); void card.offsetWidth; card.classList.add('split');
      const sum = pkEl('span', 'pk-sum', `${c.v / 2} + ${c.v / 2}`); slot.append(sum);
      pkLater(2100, () => { sum.remove(); card.classList.remove('split'); });
      pkBi(c.v / 2, .15); pkBi(c.v / 2, .6); pkBi(c.v, 1.0); wait = 1.4;
    } else { c.seen = c.seen || c.up; (c.up ? pkBi : pkBup)(c.v); }
    A.refresh(true, wait);
  };
  A.set = (i, up) => { const c = A.cards[i]; if (!c || c.up === !!up) return; c.up = !!up; c.seen = c.seen || c.up; (c.up ? pkBi : pkBup)(c.v); };
  A.refresh = (byTap, wait) => {
    const t = A.total();
    A.cards.forEach((c, i) => {
      const s = A.slots[i]; if (!s) return;
      const card = s.querySelector('.pk-card');
      card.classList.toggle('down', !c.up); card.classList.toggle('invite', !!c.invite);
      card.setAttribute('aria-pressed', c.up);
      card.setAttribute('aria-label', `Karte mit ${c.v} ${c.v === 1 ? 'Punkt' : 'Punkten'}: ${c.up ? 'offen' : 'zugedreht'}`);
      const b = s.querySelector('.pk-bit'); b.textContent = c.up ? '1' : '0'; b.classList.toggle('on', c.up); b.hidden = !A.code;
      const l = s.querySelector('.pk-lamp'); l.classList.toggle('on', c.up); l.hidden = !A.lamps;
      const tm = s.querySelector('.pk-term'); if (tm) tm.textContent = `${c.up ? 1 : 0} × ${c.v}`;
    });
    const num = counter.querySelector('.pk-num');
    if (num.textContent !== String(t)) { num.textContent = t; pkAnim(num, 'bump'); }
    counter.querySelector('.pk-tray').innerHTML = A.cards.filter(c => c.up).map(c => `<span style="${pkCol(c.v)}">${'<i></i>'.repeat(c.v)}</span>`).join('');
    counter.classList.toggle('coded', A.code);
    counter.querySelector('.pk-code').innerHTML = A.code ? A.cards.map(c => `<i class="${c.up ? 'on' : ''}" style="${pkCol(c.v)}">${c.up ? 1 : 0}</i>`).join('') : '';
    if (A.demo) return;
    const isNew = !A.found.has(t); A.found.add(t);
    A.paint(t, byTap, isNew);
    if (cfg.onChange) cfg.onChange(t, { byTap: !!byTap, isNew, wait: wait == null ? .35 : wait });
  };
  A.setStamps = (n, beyond) => {
    A.nSt = n; stamps.innerHTML = ''; stamps.className = 'pk-stamps' + (n > 16 ? ' sm' : '');
    for (let k = 0; k < n; k++) {
      const s = pkEl('button', 'pk-stamp', `<b>${k}</b><span class="pk-mini"></span>`); s.type = 'button'; s.dataset.k = k;
      s.addEventListener('click', () => A.tapStamp(s, k)); stamps.append(s);
    }
    if (beyond) {
      // eine Zahl, die diese Karten nie schaffen: der Versuch ist die Entdeckung
      const s = pkEl('button', 'pk-stamp beyond', `<b>${n}</b><span class="pk-mini">?</span>`); s.type = 'button';
      s.setAttribute('aria-label', `${n}: mit diesen Karten nicht möglich`);
      s.addEventListener('click', () => { pkAnim(s, 'wiggle'); pkNope(); if (cfg.onBeyond) cfg.onBeyond(n); });
      stamps.append(s);
    }
    A.paint(A.total(), false, false);
  };
  A.paint = (t, byTap, isNew) => {
    stamps.querySelectorAll('.pk-stamp:not(.beyond)').forEach(s => {
      const k = +s.dataset.k, f = A.found.has(k);
      s.classList.toggle('found', f); s.classList.toggle('now', k === t);
      s.setAttribute('aria-label', `${k}: ${f ? 'gefunden' : 'noch nicht gefunden'}`);
      s.querySelector('.pk-mini').innerHTML = f && A.nSt <= 16 ? A.cards.map(c => `<i class="${k & c.v ? 'u' : ''}" style="${pkCol(c.v)}"></i>`).join('') : '';
      if (k === t && byTap) pkAnim(s, isNew ? 'pop' : 'wiggle');
    });
  };
  A.tapStamp = (s, k) => {
    pkAnim(s, 'wiggle');
    if (!A.found.has(k)) return;
    pkSing(A.cards.map(c => ({ v: c.v, up: !!(k & c.v) })), 0, (i, on) => { const m = s.querySelectorAll('.pk-mini i')[i]; if (m) m.classList.toggle('say', on); });
  };
  A.allFound = () => { for (let k = 0; k < A.nSt; k++) if (!A.found.has(k)) return false; return true; };
  A.celebrate = done => {
    const tiles = [...stamps.querySelectorAll('.pk-stamp:not(.beyond)')], gap = tiles.length > 16 ? 35 : 90;
    tiles.forEach((s, i) => pkLater(i * gap, () => pkAnim(s, 'pop')));
    pkLater(tiles.length * gap + 250, () => { const b = stamps.querySelector('.beyond'); if (b) { b.classList.add('call'); pkAsk(); } if (done) done(); });
  };
  A.song = (delay, fig) => pkSing(A.cards, delay || 0, (i, on) => {
    const s = A.slots[i]; if (s) s.classList.toggle('say', on);
    const d = counter.querySelectorAll('.pk-code i')[i]; if (d) d.classList.toggle('say', on);
  }, fig);
  /* Stummer Vormacher: eine Hand tippt die Karte zweimal an. Zählt nicht als eigenes Tippen. */
  A.playDemo = i => {
    A.stopDemo(); i = i || 0;
    const slot = A.slots[i]; if (!slot) return;
    const f = pkEl('span', 'pk-finger', ico('tap', 46)); slot.append(f);
    const c = A.cards[i]; A.demo = { f, c, orig: c.up, t: [] };
    const at = (ms, fn) => A.demo.t.push(setTimeout(fn, ms));
    const flip = () => { f.classList.remove('press'); c.up = !c.up; (c.up ? pkBi : pkBup)(c.v); A.refresh(false); };
    at(50, () => f.classList.add('show'));
    at(600, () => f.classList.add('press')); at(750, flip);
    at(1900, () => f.classList.add('press')); at(2050, flip);
    at(2700, () => f.classList.remove('show'));
    at(3000, () => A.stopDemo());
  };
  A.stopDemo = () => {
    const d = A.demo; if (!d) return;
    d.t.forEach(clearTimeout); d.f.remove(); A.demo = false;
    d.c.up = d.orig; A.refresh(false);
  };
  return A;
}

/* ---------- Rahmen einer Entdeckung ---------- */
function pkFootSet(foot, btns) {
  foot.innerHTML = '';
  (btns || []).forEach(b => {
    const e = pkEl('button', 'btn' + (b.sec ? ' sec' : '') + ' pk-go', esc(b.label)); e.type = 'button';
    if (b.disabled) e.disabled = true;
    e.addEventListener('click', () => { if (!e.disabled) b.on(); });
    foot.append(e);
  });
  return foot.children;
}
function pkMount() {
  const root = document.getElementById('pkRoot'); if (!root) return;
  pkClear(); root.innerHTML = '';
  const sp = !!PK_SPECIAL[UI.pkLv], tag = UI.pkLv === 'tag', n = sp ? UI.pkLv : +UI.pkLv, L = sp ? { id: n, t: PK_SPECIAL[n] } : PK_LV.find(x => x.id === n);
  if (!L || !PK_RUN[n]) { root.innerHTML = '<p class="card">Diese Entdeckung gibt es nicht.</p>'; return; }
  if (UI.pkRes) { if (tag) pkTagResult(root); else pkResult(root, L); return; }
  const who = PK_RUN[n].who || 'blinki';
  const scene = pkScene(root, who), body = pkEl('div', 'pk-body'), foot = pkEl('div', 'pk-foot');
  root.append(body, foot);
  const api = {
    scene, body, foot, n,
    setFoot: btns => pkFootSet(foot, btns),
    finish: () => tag ? pkTagDone() : sp ? go('pkFreunde', { pkFr: -1, pkDel: false }) : pkFinish(n)
  };
  PK_RUN[n].run(api);
}
function pkFinish(n) {
  const p = pkS();
  if (!p.done[n]) p.done[n] = Date.now();
  save();
  pkTone(523, 0, .14, 'triangle', .08); pkTone(659, .1, .14, 'triangle', .08); pkTone(784, .2, .3, 'triangle', .08);
  UI.pkRes = true; pkMount(); window.scrollTo(0, 0);
}
function pkStart(n) {
  if (n === 'tag') { if (!pkTagOpen()) return; }
  else if (n === 'freund') { if (!pkFrOpen() || pkS().friends.length >= 24) return; }
  else if (n === 'wem') { if (pkS().friends.length < 3) return; }
  else { n = +n; if (!PK_RUN[n] || !pkOpen(n)) return; }
  if (view === 'pkLevel') { UI.pkLv = n; UI.pkRes = false; render(); window.scrollTo(0, 0); }
  else go('pkLevel', { pkLv: n, pkRes: false });
}
function pkResult(root, L) {
  const nxt = PK_LV[pkIdx(L.id) + 1], p = pkS();
  const w = pkEl('section', 'pk-result');
  w.innerHTML = `<div class="pk-result-fig">${pkBotSvg('blinki', 'happy')}</div><span class="pk-eyebrow">Deine Entdeckung · ${esc(L.t)}</span><p class="pk-learn">${L.c}</p>
    ${L.id === 10 && p.arm.length ? `<div class="pk-keep">${pkArmHtml(p.arm)}</div>` : ''}${L.id === 13 && p.word.length ? `<div class="pk-keep">${pkWordHtml(p.word)}</div>` : ''}
    <p class="pk-done-n">${pkDoneN()} von ${PK_MAX} Entdeckungen</p>`;
  const foot = pkEl('div', 'pk-foot');
  w.append(foot); root.append(w);
  const btns = [];
  if (nxt) btns.push({ label: 'Nächste Entdeckung', on: () => pkStart(nxt.id) });
  btns.push({ label: 'Nochmal', sec: true, on: () => pkStart(L.id) });
  btns.push({ label: 'Zur Übersicht', sec: true, on: () => go('punkte') });
  // Die Knöpfe kommen erst nach einer kurzen Pause: Zeit, den einen Satz zu lesen.
  pkLater(2200, () => pkFootSet(foot, btns));
  pkLater(300, () => { const f = w.querySelector('.pk-result-fig'); if (f) pkAnim(f, 'pop'); });
}

/* ---------- Zaubertrick (cs4fn): 3 Karten für 1–7, 4 Karten für 1–15 ---------- */
function pkTrick(api, SET, MAX) {
  const { scene, body } = api, T = { mode: 'guess', phase: 'pick', picked: new Set(), last: null, rounds: 0, xp: null };
  const box = pkEl('div', 'pk-ncards'); body.append(box);
  const CHK = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';
  const sum = s => [...s].reduce((a, b) => a + b, 0);
  function draw() {
    box.innerHTML = '';
    SET.forEach(c => {
      const on = T.picked.has(c.v), b = pkEl('button', 'pk-ncard' + (on ? ' picked' : ''));
      b.type = 'button'; b.setAttribute('style', pkCol(c.v)); b.disabled = T.phase !== 'pick';
      b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', 'Zauberkarte mit ' + c.nums.join(', '));
      b.innerHTML = `<span class="pk-nums">${c.nums.map(n => `<b>${n}</b>`).join('')}</span><span class="pk-chk">${CHK}</span>`;
      b.addEventListener('click', () => {
        if (T.phase !== 'pick') return;
        const now = !T.picked.has(c.v); now ? T.picked.add(c.v) : T.picked.delete(c.v);
        (now ? pkBi : pkBup)(c.v); draw();
      });
      box.append(b);
    });
  }
  const singPicked = s => pkSing(SET.map(c => ({ v: c.v, up: s.has(c.v) })), 0, (i, on) => { const b = box.children[i]; if (b) b.classList.toggle(s.has(SET[i].v) ? 'sing' : 'sing-off', on); }, scene);
  function start(mode) {
    T.mode = mode; T.phase = 'pick'; T.picked = new Set(); pkClear();
    box.hidden = false; xp.hidden = true; draw(); scene.mood('idle');
    scene.say(mode === 'guess' ? `Denk dir eine Zahl von 1 bis ${MAX}. Tippe jede Karte, auf der sie steht.`
      : `Jetzt zauberst <b>du</b>! Lass jemanden eine Zahl von 1 bis ${MAX} denken und die Karten tippen.`);
    api.setFoot([{ label: 'Fertig', on: done }]);
  }
  function done() {
    const s = sum(T.picked); T.phase = 'shown'; T.last = new Set(T.picked); draw(); api.setFoot([]);
    if (T.mode === 'show') {
      scene.say('Und? Welche Zahl ist es? Sag sie laut!');
      api.setFoot([{
        label: 'Auflösen', on: () => {
          scene.mood('happy'); scene.say(`Es ist die <span class="pk-big">${s}</span>!`); singPicked(T.picked); scene.hop();
          pkS().trick.show++; save();
          api.setFoot([{ label: 'Nochmal vorführen', on: () => start('show') }, { label: 'Fertig', sec: true, on: api.finish }]);
        }
      }]);
      return;
    }
    scene.mood('curious'); scene.say('Hmm …'); scene.talk(true);
    pkLater(1100, () => {
      scene.talk(false);
      if (!s) { scene.say('Keine Karte? Dann hast du an die 0 gedacht!'); scene.shake(); api.setFoot([{ label: 'Nochmal', on: () => start('guess') }]); return; }
      scene.mood('happy'); scene.say(`Deine Zahl ist die <span class="pk-big">${s}</span>!`); singPicked(T.picked);
      api.setFoot([{ label: 'Stimmt!', on: right }, { label: 'Stimmt nicht', sec: true, on: wrong }]);
    });
  }
  function right() {
    T.rounds++; scene.hop(); pkS().trick.guess++; save();
    if (T.rounds >= 2) { scene.say('Willst du wissen, wie ich das mache?'); api.setFoot([{ label: 'Wie geht das?', on: explain }, { label: 'Nochmal', sec: true, on: () => start('guess') }]); }
    else { scene.say('Hihi! Noch eine Zahl?'); api.setFoot([{ label: 'Nochmal', on: () => start('guess') }]); }
  }
  // Falsch geraten heißt: eine Karte fehlt oder ist zu viel. Das Kind prüft selbst.
  function wrong() {
    scene.shake(); scene.mood('confused'); pkNope();
    scene.say('Schau genau: Steht deine Zahl auf jeder Karte, die du getippt hast? Und auf keiner anderen?');
    T.phase = 'pick'; draw();
    api.setFoot([{ label: 'Fertig', on: done }, { label: 'Neue Zahl', sec: true, on: () => start('guess') }]);
  }
  /* So geht’s: jede Zauberkarte neben ihrer Punktkarte; antippen ändert die Summe sofort */
  const xp = pkEl('div', 'pk-xp'); xp.hidden = true; body.append(xp);
  function explain() {
    pkClear(); box.hidden = true; xp.hidden = false;
    T.xp = new Set(T.last && T.last.size ? T.last : [SET[0].v, 1]);
    scene.mood('happy'); scene.say('Mein Geheimnis: Die erste Zahl jeder Karte ist eine Punktkarte. Ich zähle nur zusammen.');
    drawX();
    api.setFoot([{ label: 'Trick vorführen', on: () => start('show') }, { label: 'Fertig', sec: true, on: api.finish }]);
  }
  function drawX() {
    const P = T.xp;
    xp.innerHTML = `<div class="pk-xrows">${SET.map(c => `<button type="button" class="pk-xrow${P.has(c.v) ? ' picked' : ''}" style="${pkCol(c.v)}" data-v="${c.v}" aria-pressed="${P.has(c.v)}" aria-label="Zauberkarte ${c.nums.join(', ')}, gehört zur ${c.v}-Punkte-Karte"><span class="pk-nums">${c.nums.map(n => `<b>${n}</b>`).join('')}</span><span class="pk-mcard"><span class="pk-dots" data-v="${c.v}">${'<i></i>'.repeat(c.v)}</span></span></button>`).join('')}</div>
      <div class="pk-equation">${SET.filter(c => P.has(c.v)).map(c => pkPill(c.v)).join('<span class="pk-op">+</span>') || pkPill(0, '0')}${P.size ? `<span class="pk-op">=</span><b>${sum(P)}</b>` : ''}</div>
      <div class="pk-xcode" aria-label="Code ${SET.map(c => P.has(c.v) ? 1 : 0).join('')}">${SET.map(c => `<i class="${P.has(c.v) ? 'on' : ''}" style="${pkCol(c.v)}">${P.has(c.v) ? 1 : 0}</i>`).join('')}</div>`;
    xp.querySelectorAll('.pk-xrow').forEach(b => b.addEventListener('click', () => { const v = +b.dataset.v, now = !P.has(v); now ? P.add(v) : P.delete(v); (now ? pkBi : pkBup)(v); drawX(); }));
  }
  start('guess');
}

/* ---------- Die Entdeckungen ---------- */
const PK_RUN = {
  1: {
    run(api) {
      const { scene, body } = api;
      scene.say('Tippe auf die Karte.');
      const A = pkStage(body, {
        onChange(t, o) {
          if (!o.byTap || api.ok) return;
          if (A.found.has(0) && A.found.has(1) && A.taps >= 2) {
            api.ok = true; scene.mood('happy'); scene.hop();
            scene.say('Offen: 1 Punkt. Zu: 0 Punkte. Die Karte kann zwei Dinge sagen.');
            api.setFoot([{ label: 'Fertig', on: api.finish }]);
          }
        }
      });
      A.build([1], [1], []); A.cards[0].invite = true; A.refresh(false);
      scene.tool('tap', 'Zeig es mir', () => A.playDemo(0));
      if (!pkS().done[1]) pkLater(900, () => A.playDemo(0));
    }
  },
  2: {
    run(api) {
      const { scene, body } = api;
      scene.say('Eine neue Karte! Wie viele Punkte hat sie wohl?');
      const A = pkStage(body, {
        onChange(t, o) {
          if (!o.byTap) return;
          if (o.isNew) pkLater(o.wait * 1000, () => { scene.mood('happy'); scene.hop(); });
          if (!api.ok && A.allFound()) {
            api.ok = true;
            pkLater(o.wait * 1000, () => A.celebrate(() => {
              scene.mood('curious'); scene.say('Du hast 0, 1, 2 und 3 gefunden – jede genau einmal. Und die 4?');
              api.setFoot([{ label: 'Fertig', on: api.finish }]);
            }));
          } else if (o.isNew && !api.ok) scene.say(`Die ${t} ist neu!`);
        },
        onBeyond() { scene.shake(); scene.mood('confused'); scene.say('Die 4 schaffen diese Karten nicht. Dafür fehlt eine Karte!'); }
      });
      A.build([2, 1], [0, 1], [2]); A.setStamps(4, true);
      scene.tool('tap', 'Zeig es mir', () => A.playDemo(0));
    }
  },
  3: {
    run(api) {
      const { scene, body } = api;
      scene.say('Für die 4 kommt eine neue Karte. Wie viele Punkte hat sie?');
      let revealed = false;
      const A = pkStage(body, {
        onChange(t, o) {
          if (!o.byTap) return;
          if (!revealed && A.cards[0].up) { revealed = true; pkLater(400, () => scene.say('Die neue Karte hat 4 Punkte – zweimal die 2-Karte!')); }
          else if (o.isNew && !api.ok) pkLater(o.wait * 1000, () => { scene.mood('happy'); scene.hop(); });
          if (!api.ok && A.allFound()) {
            api.ok = true;
            pkLater(o.wait * 1000, () => A.celebrate(() => {
              scene.mood('curious'); scene.say('Alle Zahlen von 0 bis 7! Jede neue Karte hat doppelt so viele Punkte: 1, 2, 4 …');
              api.setFoot([{ label: 'Fertig', on: api.finish }]);
            }));
          }
        },
        onBeyond() { scene.shake(); scene.mood('confused'); scene.say('Die 8 geht noch nicht. Wie viele Punkte bräuchte die nächste Karte?'); }
      });
      A.build([4, 2, 1], [0, 1, 1], [4]); A.setStamps(8, true);
      scene.tool('tap', 'Zeig es mir', () => A.playDemo(0));
    }
  },
  4: {
    run(api) {
      const { scene, body } = api;
      scene.say('Blinki schreibt offen als <b>1</b> und zu als <b>0</b>. Tippe auf die Leuchtpunkte, dann sage ich den Code.');
      const A = pkStage(body, {
        code: true, lamps: true,
        onChange(t, o) {
          if (!o.byTap) return;
          pkLater(o.wait * 1000, () => scene.say(`${A.cards.map(c => c.up ? 1 : 0).join('')} heißt ${t}.`));
          if (!api.ok && A.taps >= 3) { api.ok = true; api.setFoot([{ label: 'Fertig', on: api.finish }]); }
        }
      });
      A.build([4, 2, 1], [1, 0, 1], []);
      const sing = () => A.song(0, scene);
      A.el.counter.classList.add('tap');
      A.el.counter.setAttribute('role', 'button'); A.el.counter.tabIndex = 0;
      A.el.counter.setAttribute('aria-label', 'Code anhören');
      A.el.counter.addEventListener('click', sing);
      A.el.counter.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sing(); } });
      pkLater(800, sing);
    }
  },
  5: { run(api) { pkTrick(api, PK_TRICK, 7); } },
  11: { run(api) { pkTrick(api, PK_TRICK4, 15); } },
  6: {
    run(api) {
      const { scene, body } = api, cnt = [0, 0, 0], PV = [100, 10, 1];
      scene.say('So rechnest du in der Schule – und so rechnet Blinki. Was ist gleich? Was ist anders?');
      let sTaps = 0;
      const school = pkEl('section', 'pk-cmp school');
      school.innerHTML = `<h3 class="pk-cmph">In der Schule</h3><div class="pk-scards pk-sumrow"></div><p class="pk-cmpc">Jede Karte ist zehnmal so viel wert wie die rechts daneben. Sie darf bis zu 9-mal liegen.</p>`;
      const blk = pkEl('section', 'pk-cmp blinki');
      blk.innerHTML = `<h3 class="pk-cmph">Bei Blinki</h3><div class="pk-bwrap"></div><p class="pk-cmpc">Jede Karte ist doppelt so viel wert wie die rechts daneben. Sie ist nur offen oder zu.</p>`;
      body.append(school, blk);
      const row = school.querySelector('.pk-scards');
      const pic = (p, n) => {
        if (!n) return '<span class="pk-dien empty" aria-hidden="true"></span>';
        const one = p === 100 ? '<i class="pl"></i>' : p === 10 ? '<i class="rod"></i>' : '<i class="cube"></i>';
        return `<span class="pk-dien p${p}" aria-hidden="true">${one.repeat(n)}</span>`;
      };
      // Zwischen den Karten: oben der Pfeil „so viel mehr wert“ (nach links), unten das Plus der Rechnung
      const sep = rel => `<div class="pk-sep" aria-hidden="true"><span class="pk-rel"><svg viewBox="0 0 40 18" width="34" height="16"><path d="M36 14C30 3 12 3 6 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M3 7l3 6 6-3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>${rel}</span><span class="pk-plus">+</span></div>`;
      const eq = v => `<div class="pk-seq"><span class="pk-plus">=</span><b class="pk-tot">${v}</b></div>`;
      function drawSchool() {
        row.innerHTML = PV.map((p, i) => `<div class="pk-scol"><button type="button" class="pk-scard" data-i="${i}" aria-label="${p}er-Karte, liegt ${cnt[i]}-mal">${pic(p, cnt[i])}<span class="pk-times">${cnt[i]}×</span></button><span class="pk-sval">${p}</span><span class="pk-digit">${cnt[i]}</span><span class="pk-term">${cnt[i]} × ${p}</span></div>`).join(sep('10-mal'))
          + eq(cnt[0] * 100 + cnt[1] * 10 + cnt[2]);
        row.querySelectorAll('.pk-scard').forEach(b => b.addEventListener('click', () => {
          const i = +b.dataset.i; cnt[i] = (cnt[i] + 1) % 10; sTaps++; pkTick(); drawSchool(); check();
          if (cnt[i] === 0) scene.say('Nach der 9 ist Schluss: Zehn Stück tauscht man gegen die nächste Karte.');
        }));
      }
      const A = pkStage(blk.querySelector('.pk-bwrap'), { code: true, noCounter: true, terms: true, onChange(t, o) { const b = blk.querySelector('.pk-tot'); if (b) b.textContent = t; if (o.byTap) check(); } });
      A.build([4, 2, 1], [1, 0, 1], []);
      A.slots.forEach((s, i) => { if (i) s.insertAdjacentHTML('beforebegin', sep('doppelt')); });
      A.el.deck.insertAdjacentHTML('beforeend', eq(A.total()));
      drawSchool();
      function check() {
        if (api.ok || sTaps < 4 || A.taps < 3) return;
        api.ok = true; scene.mood('happy'); scene.hop();
        scene.say('Gleich: Jede Karte hat ihren Platz und ihren Wert – man zählt alles zusammen. Anders: Schule 10-mal so viel und bis zu 9-mal, Blinki doppelt so viel und nur offen oder zu.');
        api.setFoot([{ label: 'Fertig', on: api.finish }]);
      }
    }
  },
  7: {
    run(api) {
      const { scene, body } = api;
      let phase = 'a';
      scene.say('Die 8-Karte ist da. Wie viele Punkte hat sie?');
      const A = pkStage(body, {
        onChange(t, o) {
          if (!o.byTap) return;
          if (phase === 'a' && A.allFound()) {
            phase = 'wait';
            pkLater(o.wait * 1000, () => A.celebrate(() => {
              scene.mood('curious'); scene.say('Alle Zahlen bis 15! Für die 16 kommt …');
              pkLater(1600, () => {
                phase = 'b'; const ups = A.cards.map(c => c.up);
                A.build([16, 8, 4, 2, 1], [0, ...ups], [16]); A.setStamps(32, true);
                scene.mood('idle'); scene.say('… die 16-Karte! Probier große Zahlen.');
              });
            }));
          } else if (phase === 'b' && !api.ok) {
            const big = [...A.found].filter(k => k >= 16).length;
            if (A.cards[0].seen && big >= 5) {
              api.ok = true;
              pkLater(o.wait * 1000, () => {
                scene.mood('happy'); scene.hop(); scene.say('Mit fünf Karten gehen alle Zahlen von 0 bis 31. Immer doppelt so viel: 1, 2, 4, 8, 16.');
                api.setFoot([{ label: 'Fertig', on: api.finish }]);
              });
            }
          }
        },
        onBeyond(n) { scene.shake(); scene.mood('confused'); scene.say(n === 16 ? 'Die 16 geht noch nicht. Finde erst alle anderen Zahlen!' : 'Für die 32 bräuchtest du eine Karte mit 32 Punkten.'); }
      });
      A.build([8, 4, 2, 1], [0, 1, 1, 1], [8]); A.setStamps(16, true);
      scene.tool('tap', 'Zeig es mir', () => A.playDemo(0));
    }
  },
  8: {
    who: 'lumi',
    run(api) {
      const { scene, body } = api, R = { i: 0, wants: [] };
      const pool = [1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - .5); R.wants = pool.slice(0, 4);
      const msg = pkEl('div', 'pk-msg', '<span class="pk-label">Lumis Lampen</span><div class="pk-mlamps"></div>');
      const menu = pkEl('div', 'pk-menu', PK_SNACK.slice(1).map((s, i) => `<div class="pk-snack" data-n="${i + 1}"><b>${i + 1}</b><span class="pk-emo" aria-hidden="true">${s[0]}</span><span>${s[1]}</span></div>`).join(''));
      const prog = pkEl('div', 'pk-prog');
      body.append(msg, menu);
      const A = pkStage(body, { lamps: true, noCounter: true, onChange(t) { menu.querySelectorAll('.pk-snack').forEach(e => e.classList.toggle('now', +e.dataset.n === t)); A.el.deck.querySelectorAll('.pk-lamp').forEach(l => l.classList.remove('diff')); } });
      body.append(prog);
      const bitsOf = n => [4, 2, 1].map(v => n & v ? 1 : 0);
      function round() {
        const want = R.wants[R.i];
        msg.querySelector('.pk-mlamps').innerHTML = bitsOf(want).map((b, k) => `<span class="pk-lamp${b ? ' on' : ''}" style="${pkCol([4, 2, 1][k])}" role="img" aria-label="Lampe ${b ? 'an' : 'aus'}"></span>`).join('');
        A.build([4, 2, 1], [0, 0, 0], []);
        menu.querySelectorAll('.pk-snack').forEach(e => e.classList.remove('sent'));
        prog.innerHTML = R.wants.map((w, k) => `<i class="${k < R.i ? 'ok' : k === R.i ? 'cur' : ''}"></i>`).join('');
        scene.mood('idle');
        scene.say(R.i ? 'Noch etwas, bitte! Schau auf meine Lampen.' : 'Ich habe Hunger! Ich kann nur mit Lampen sprechen. Stell deine Karten wie meine Lampen und schick mir den Snack.');
        api.setFoot([{ label: 'Schicken', on: send }]);
      }
      function send() {
        const t = A.total(), want = R.wants[R.i];
        if (t === want) {
          const tile = menu.querySelector(`.pk-snack[data-n="${t}"]`); if (tile) tile.classList.add('sent');
          scene.mood('happy'); scene.hop(); scene.say(`Mmh, ${PK_SNACK[t][1]}! Genau das wollte ich. Danke!`);
          A.lock = true; A.song(.1); api.setFoot([]);
          R.i++;
          pkLater(1700, () => { A.lock = false; if (R.i >= R.wants.length) { pkS().lumi++; save(); api.finish(); } else round(); });
          return;
        }
        scene.shake(); scene.mood('confused'); pkNope();
        const want3 = bitsOf(want);
        A.el.deck.querySelectorAll('.pk-lamp').forEach((l, k) => l.classList.toggle('diff', (A.cards[k].up ? 1 : 0) !== want3[k]));
        scene.say(t ? `${PK_SNACK[t][0]} ${PK_SNACK[t][1]}? Das wollte ich nicht. Vergleich deine Lampen mit meinen!` : 'Da ist ja nichts drin! Vergleich deine Lampen mit meinen.');
      }
      round();
    }
  },
  9: {
    who: 'lumi',
    run(api) {
      const { scene, body } = api;
      const RS = [{ v: [4, 2, 1], want: 6, up: [1, 1, 1] }, { v: [4, 2, 1], want: 5, up: [1, 1, 0] }, { v: [4, 2, 1], want: 3, up: [1, 0, 1] }, { v: [8, 4, 2, 1], want: 10, up: [0, 1, 1, 1] }];
      let i = 0, solved = false;
      const A = pkStage(body, {
        code: true, label: 'Lumis Karten',
        onChange(t, o) {
          const r = RS[i]; if (!r) return;
          if (t === r.want) {
            const parts = A.cards.filter(c => c.up).map(c => c.v);
            scene.mood('happy'); scene.hop();
            scene.say(`Ach so! ${parts.join(' + ')} = ${t}. Danke, jetzt verstehe ich es!`);
            if (!solved) { solved = true; pkLater(((o && o.wait) || .35) * 1000, () => A.song(0)); }
            api.setFoot([{ label: i === RS.length - 1 ? 'Fertig' : 'Nächste', on: next }]);
          } else {
            scene.mood('confused');
            scene.say(A.taps ? `Jetzt steht da ${t}. Ich will die ${r.want}.` : `Ich will die <span class="pk-big">${r.want}</span> zeigen. Warum steht da ${t}?`);
            api.setFoot([]);
          }
        }
      });
      function next() { i++; if (i >= RS.length) { api.finish(); return; } load(); }
      function load() { const r = RS[i]; solved = false; A.taps = 0; A.build(r.v, r.up, []); }
      load();
    }
  },
  10: {
    run(api) {
      const { scene, body } = api, letters = [];
      scene.say('Jeder Buchstabe hat eine Zahl – auch Ä, Ö, Ü und ß. Bau mit den Karten die Zahl für den ersten Buchstaben deines Namens und fädle ihn auf.');
      const chart = pkEl('div', 'pk-abc', [...PK_ABC].map((ch, k) => `<span class="pk-ch" data-n="${k + 1}"><b>${ch}</b><small>${k + 1}</small></span>`).join(''));
      const arm = pkEl('div', 'pk-armwrap');
      const A = pkStage(body, { code: true, label: 'Zahl', onChange(t) { paint(t); } });
      body.append(chart, arm);
      function paint(t) {
        chart.querySelectorAll('.pk-ch').forEach(e => e.classList.toggle('now', +e.dataset.n === t));
        arm.innerHTML = letters.length ? pkArmHtml(letters) : '<p class="pk-armempty">Dein Armband ist noch leer.</p>';
        const ok = t >= 1 && t <= PK_ABC.length;
        api.setFoot([
          { label: ok ? `${PK_ABC[t - 1]} auffädeln` : 'Auffädeln', disabled: !ok || letters.length >= 12, on: add },
          ...(letters.length ? [{ label: 'Letzten entfernen', sec: true, on: () => { letters.pop(); paint(A.total()); } }, { label: 'Fertig', sec: true, on: fin }] : [])
        ]);
        if (t > PK_ABC.length) scene.say(`Die ${t} hat keinen Buchstaben. Die Tafel hört bei ${PK_ABC.length} auf.`);
      }
      function add() {
        const t = A.total(); if (t < 1 || t > PK_ABC.length || letters.length >= 12) return;
        letters.push(PK_ABC[t - 1]); A.song(0, scene); scene.mood('happy');
        scene.say(letters.length === 1 ? 'Super! Jetzt der nächste Buchstabe.' : `${letters.join('')} – weiter so!`);
        A.lock = true;
        pkLater(1500, () => { A.cards.forEach((c, k) => A.set(k, false)); A.lock = false; A.refresh(false); });
        paint(t);
      }
      function fin() { const p = pkS(); p.arm = letters.slice(0, 12); save(); api.finish(); }
      A.build([16, 8, 4, 2, 1], [0, 0, 0, 0, 0], []);
    }
  },
  12: {
    run(api) {
      const { scene, body } = api;
      let step = 'max31';
      scene.say('Mach die <b>größte</b> Zahl, die diese fünf Karten schaffen.');
      const A = pkStage(body, {
        code: true,
        onChange(t, o) {
          if (!o.byTap) return;
          const all = A.cards.every(c => c.up), w = o.wait * 1000;
          const grow = (v, said) => {
            step = 'wait';
            pkLater(w, () => {
              scene.mood('happy'); scene.hop(); scene.say(said);
              pkLater(1700, () => { A.build([v, ...A.cards.map(c => c.v)], [0, ...A.cards.map(c => c.up)], [v]); step = 'rev' + v; scene.mood('curious'); scene.say('Eine neue Karte! Wie viele Punkte hat sie?'); });
            });
          };
          if (step === 'max31' && all) grow(32, '31! Mehr geht mit fünf Karten nicht. Für die 32 braucht es …');
          else if (step === 'rev32' && A.cards[0].up) {
            if (all) grow(64, '32 Punkte – doppelt so viel wie die 16! Jetzt sind alle offen: 63. Wieder eins weniger als die nächste Karte …');
            else { step = 'max63'; pkLater(w, () => scene.say('32 Punkte – doppelt so viel wie die 16! Und jetzt wieder die größte Zahl?')); }
          }
          else if (step === 'max63' && all) grow(64, '63! Wieder eins weniger als die nächste Karte. Die heißt …');
          else if (step === 'rev64' && A.cards[0].up) {
            if (all) { step = 'b100'; pkLater(w, () => { scene.mood('happy'); scene.hop(); scene.say('64 Punkte! Alle offen: 127 – die größte Zahl mit sieben Karten. Jetzt für Profis: Bau die <span class="pk-big">100</span>.'); }); }
            else { step = 'max127'; pkLater(w, () => scene.say('64 Punkte! Schaffst du die größte Zahl mit sieben Karten?')); }
          }
          else if (step === 'max127' && all) { step = 'b100'; pkLater(w, () => { scene.mood('happy'); scene.hop(); scene.say('127! Jetzt eine Zahl für Profis: Bau die <span class="pk-big">100</span>.'); }); }
          else if (step === 'b100' && t === 100) {
            step = 'done';
            pkLater(w, () => { scene.mood('happy'); scene.hop(); scene.say(`${A.cards.filter(c => c.up).map(c => c.v).join(' + ')} = 100. Stark!`); A.song(0); api.setFoot([{ label: 'Fertig', on: api.finish }]); });
          }
        }
      });
      A.build([16, 8, 4, 2, 1], [0, 0, 0, 0, 0], []);
    }
  },
  13: {
    run(api) {
      const { scene, body } = api, word = [];
      let phase = 'a', small = false;
      const ltr = n => (n >= 65 && n <= 90) || (n >= 97 && n <= 122) ? String.fromCharCode(n) : '';
      scene.say('Dein Armband sagt A = 1. Ein Computer sagt A = 65: Er schaltet die <b>64-Karte</b> an – und dann die 1. Bau das A!');
      const A = pkStage(body, { code: true, label: 'Zahl', onChange(t, o) { paint(t); if (o.byTap) react(t, o); } });
      const show = pkEl('div', 'pk-ascii', '<span class="pk-label">Buchstabe</span><b>–</b>');
      A.el.deck.before(show);
      const chart = pkEl('div', 'pk-abc', [...PK_ABC.slice(0, 26)].map((ch, k) => `<span class="pk-ch" data-n="${65 + k}"><b>${ch}</b><small>${65 + k}</small></span>`).join(''));
      const out = pkEl('div', 'pk-armwrap');
      body.append(chart, out);
      function react(t, o) {
        if (phase === 'a' && t === 65) {
          phase = 'free';
          pkLater(o.wait * 1000, () => { scene.mood('happy'); scene.hop(); A.song(0); scene.say('Das A! 64 + 1 = 65. Jetzt du: Bau die Buchstaben deines Namens und speichere sie.'); paint(A.total()); });
        } else if (t >= 97 && t <= 122 && !small) { small = true; scene.say(`Ein kleines ${ltr(t)}! Kleine Buchstaben haben zusätzlich die 32 an.`); }
      }
      function paint(t) {
        const l = ltr(t), big = t >= 97 ? t - 32 : t;
        show.querySelector('b').textContent = l || '–';
        chart.querySelectorAll('.pk-ch').forEach(e => e.classList.toggle('now', !!l && +e.dataset.n === big));
        out.innerHTML = word.length ? pkWordHtml(word) : '';
        if (phase === 'a') { api.setFoot([]); return; }
        api.setFoot([
          { label: l ? `${l} speichern` : 'Speichern', disabled: !l || word.length >= 10, on: add },
          ...(word.length ? [{ label: 'Letzten entfernen', sec: true, on: () => { word.pop(); paint(A.total()); } }, { label: 'Fertig', sec: true, disabled: word.length < 2, on: fin }] : [])
        ]);
      }
      function add() {
        const l = ltr(A.total()); if (!l || word.length >= 10) return;
        word.push(l); A.song(0, scene); scene.mood('happy');
        scene.say(word.length === 1 ? 'Gespeichert! Noch ein Buchstabe.' : `${word.join('')} – so speichert ein Computer dein Wort.`);
        A.lock = true;
        pkLater(1500, () => { A.cards.forEach((c, k) => A.set(k, false)); A.lock = false; A.refresh(false); });
        paint(A.total());
      }
      function fin() { const p = pkS(); p.word = word.slice(0, 10); save(); api.finish(); }
      A.build([64, 32, 16, 8, 4, 2, 1], [0, 0, 0, 0, 0, 0, 0], []);
    }
  },
  14: {
    run(api) {
      const { scene, body } = api, V = [16, 8, 4, 2, 1], bits = n => V.map(v => n & v ? 1 : 0), pop = n => V.filter(v => n & v).length;
      let s = 0, t = 0, min = 0, n = 0, done = false;
      const A = pkStage(body, { onChange(tt, o) { if (!o.byTap || done) return; mv.textContent = `Züge: ${A.taps} · Blinki: ${min}`; if (tt === t) end(o); } });
      const row = pkEl('div', 'pk-zrow'), tg = pkEl('div', 'pk-target', '<span class="pk-label">Ziel</span><b></b>'), mv = pkEl('span', 'pk-moves');
      row.append(A.el.counter, tg, mv); A.el.deck.before(row);
      // Rätsel 1: 2 Karten anders, Rätsel 2: 3, Rätsel 3: 4
      function load(again) {
        if (!again) { n++; do { s = 1 + Math.floor(Math.random() * 31); t = 1 + Math.floor(Math.random() * 31); } while (pop(s ^ t) !== n + 1); min = n + 1; }
        done = false; A.build(V, bits(s), []); A.taps = 0;
        A.slots.forEach(x => x.classList.remove('mark'));
        tg.querySelector('b').textContent = t; mv.textContent = `Züge: 0 · Blinki: ${min}`;
        scene.mood('idle'); scene.say(`Von <b>${s}</b> zur <span class="pk-big">${t}</span>. Blinki schafft es mit <b>${min}</b>-mal Umdrehen. Und du?`);
        api.setFoot([]);
      }
      function end(o) {
        done = true; const moves = A.taps, last = n >= 3;
        pkLater(o.wait * 1000, () => {
          if (moves === min) { scene.mood('happy'); scene.hop(); A.song(0); scene.say(`Perfekt! ${min} Züge – kein einziger zu viel.`); }
          else { scene.mood('curious'); scene.say(`Geschafft in ${moves} Zügen. Es geht in ${min}: Nur die markierten Karten müssen anders sein.`); A.slots.forEach((x, i) => x.classList.toggle('mark', !!((s ^ t) & A.cards[i].v))); }
          api.setFoot([...(moves === min ? [] : [{ label: 'Nochmal', sec: true, on: () => load(true) }]), { label: last ? 'Fertig' : 'Nächstes Rätsel', on: last ? api.finish : () => load(false) }]);
        });
      }
      load(false);
    }
  },
  freund: {
    run(api) {
      const { scene, body } = api, p = pkS();
      let name = '', i = 0, col = 2;
      const clean = v => [...v].map(c => c === 'ß' ? 'ß' : c.toUpperCase()).filter(c => PK_ABC.includes(c)).join('').slice(0, 10);
      /* 1. Name: das Kind schreibt ihn selbst */
      scene.say('Für wen ist das Armband? Schreib den Vornamen.');
      const box = pkEl('div', 'pk-namebox', '<label class="pk-label" for="pkName">Vorname</label><input id="pkName" class="pk-name" maxlength="12" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="done">');
      body.append(box);
      const inp = box.querySelector('input');
      const taken = v => p.friends.some(f => f.n === v);
      const nameFoot = () => {
        const v = clean(inp.value);
        if (v && taken(v)) scene.say(`Für ${esc(v)} gibt es schon ein Armband. Nimm einen anderen Namen.`);
        else scene.say(v.length > 1 ? `Schön! Jetzt baust du <b>${esc(v)}</b> Buchstabe für Buchstabe.` : 'Für wen ist das Armband? Schreib den Vornamen.');
        api.setFoot([{ label: 'Weiter', disabled: v.length < 2 || taken(v), on: build }]);
      };
      inp.addEventListener('input', () => { const v = clean(inp.value); if (inp.value !== v) inp.value = v; nameFoot(); });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { const v = clean(inp.value); if (v.length > 1 && !taken(v)) build(); } });
      nameFoot(); setTimeout(() => { try { inp.focus(); } catch (e) { } }, 60);
      /* 2. Buchstaben mit den Karten bauen */
      let A, chart, fname, prev;
      function build() {
        name = clean(inp.value); if (name.length < 2 || taken(name)) return;
        box.remove(); i = 0;
        fname = pkEl('div', 'pk-fname'); body.append(fname);
        A = pkStage(body, { code: true, label: 'Zahl', onChange(t) { paintB(t); } });
        prev = pkEl('div', 'pk-ascii', '<span class="pk-label">Buchstabe</span><b>–</b>'); A.el.deck.before(prev);
        chart = pkEl('div', 'pk-abc', [...PK_ABC].map((ch, k) => `<span class="pk-ch" data-n="${k + 1}"><b>${ch}</b><small>${k + 1}</small></span>`).join(''));
        body.append(chart);
        scene.mood('idle'); scene.say(`Such das <b>${name[0]}</b> in der Tafel und leg seine Zahl mit den Karten.`);
        A.build([16, 8, 4, 2, 1], [0, 0, 0, 0, 0], []);
      }
      function paintB(t) {
        const L = t >= 1 && t <= PK_ABC.length ? PK_ABC[t - 1] : '';
        fname.innerHTML = [...name].map((ch, k) => `<span class="${k < i ? 'ok' : k === i ? 'cur' : ''}">${esc(ch)}</span>`).join('');
        prev.querySelector('b').textContent = L || '–';
        chart.querySelectorAll('.pk-ch').forEach(e => e.classList.toggle('now', +e.dataset.n === t));
        if (i >= name.length) return;
        api.setFoot([{ label: L ? `${L} auffädeln` : 'Auffädeln', disabled: !L, on: thread }]);
        if (t > PK_ABC.length) scene.say(`Die ${t} hat keinen Buchstaben. Die Tafel hört bei ${PK_ABC.length} auf.`);
      }
      function thread() {
        const t = A.total(), L = PK_ABC[t - 1], need = name[i]; if (!L) return;
        if (L !== need) { scene.shake(); scene.mood('confused'); pkNope(); scene.say(`Das ist ein <b>${L}</b> – du brauchst ein <b>${need}</b>. Schau in die Tafel.`); return; }
        i++; A.song(0); scene.mood('happy');
        A.lock = true;
        if (i >= name.length) { paintB(t); pkLater(900, colours); return; }
        scene.say(`Ein <b>${L}</b>! Jetzt das <b>${name[i]}</b>.`);
        pkLater(1200, () => { A.cards.forEach((c, k) => A.set(k, false)); A.lock = false; A.refresh(false); });
        paintB(t);
      }
      /* 3. Farbe der AN-Perlen wählen und speichern */
      function colours() {
        body.innerHTML = ''; scene.hop();
        scene.say(`Das Armband für <b>${esc(name)}</b> ist fertig! Welche Farbe sollen die AN-Perlen haben?`);
        const w = pkEl('div', 'pk-colpick'); body.append(w);
        const paint = () => {
          w.innerHTML = `<div class="pk-swatches">${PK_BEAD.map(b => `<button type="button" class="pk-sw${b.v === col ? ' on' : ''}" data-v="${b.v}" style="${pkCol(b.v)}" aria-pressed="${b.v === col}"><i></i><small>${b.n}</small></button>`).join('')}</div>${pkArmHtml([...name], col)}`;
          w.querySelectorAll('.pk-sw').forEach(b => b.addEventListener('click', () => { col = +b.dataset.v; pkBi(col); paint(); }));
        };
        paint();
        api.setFoot([{ label: 'Speichern', on: () => { p.friends.push({ n: name, c: col, ts: Date.now() }); save(); go('pkFreunde', { pkFr: p.friends.length - 1, pkDel: false }); } }]);
      }
    }
  },
  wem: {
    run(api) {
      const { scene, body } = api, F = pkS().friends.slice(), order = F.map((f, k) => k).sort(() => Math.random() - .5).slice(0, 3);
      let r = 0, tries = 0;
      const arm = pkEl('div', 'pk-armwrap'), opts = pkEl('div', 'pk-opts'), prog = pkEl('div', 'pk-prog');
      const chart = pkEl('div', 'pk-abc', [...PK_ABC].map((ch, k) => `<span class="pk-ch"><b>${ch}</b><small>${k + 1}</small></span>`).join(''));
      body.append(prog, arm, opts, chart);
      function load() {
        const f = F[order[r]]; tries = 0;
        prog.innerHTML = order.map((x, k) => `<i class="${k < r ? 'ok' : k === r ? 'cur' : ''}"></i>`).join('');
        arm.innerHTML = pkArmHtml([...f.n], f.c, true);
        const names = [f.n, ...F.filter(x => x.n !== f.n).map(x => x.n).sort(() => Math.random() - .5).slice(0, 3)].sort(() => Math.random() - .5);
        opts.innerHTML = names.map(n => `<button type="button" class="btn sec pk-opt" data-n="${esc(n)}">${esc(n)}</button>`).join('');
        opts.querySelectorAll('.pk-opt').forEach(b => b.addEventListener('click', () => pick(b, f)));
        scene.mood('curious'); scene.say('Wem gehört dieses Armband? Lies die Perlen – jede Gruppe ist ein Buchstabe.');
        api.setFoot([]);
      }
      function pick(b, f) {
        if (b.dataset.n === f.n) {
          b.classList.add('pk-right'); opts.querySelectorAll('.pk-opt').forEach(x => x.disabled = true);
          scene.mood('happy'); scene.hop(); pkBi(1); pkBi(2, .12);
          scene.say(tries ? `Richtig – das ist das Armband von <b>${esc(f.n)}</b>!` : `Sofort erkannt: <b>${esc(f.n)}</b>!`);
          r++; api.setFoot([{ label: r >= order.length ? 'Fertig' : 'Nächstes Armband', on: () => r >= order.length ? api.finish() : load() }]);
          return;
        }
        tries++; b.disabled = true; scene.shake(); scene.mood('confused'); pkNope();
        const n1 = PK_ABC.indexOf(f.n[0]) + 1;
        arm.querySelector('.pk-bead') && arm.querySelector('.pk-bead').classList.add('hint');
        scene.say(`Das ist nicht ${esc(b.dataset.n)}. Lies den ersten Buchstaben: ${[16, 8, 4, 2, 1].filter(v => n1 & v).join(' + ')} = ${n1}.`);
      }
      load();
    }
  },
  tag: {
    run(api) {
      const { scene, body } = api, day = ymd(), plan = pkTagPlan(day);
      let i = 0, sub = 0, solved = false;
      const head = pkEl('div', 'pk-prog pk-tagprog');
      const target = pkEl('div', 'pk-target');
      const msg = pkEl('div', 'pk-msg', '<span class="pk-label">Lumis Lampen</span><div class="pk-mlamps"></div>');
      body.append(head, target, msg);
      const A = pkStage(body, { code: true, onChange(t, o) { if (o.byTap) check(t, o); } });
      const chart = pkEl('div', 'pk-abc', [...PK_ABC].map((ch, k) => `<span class="pk-ch" data-n="${k + 1}"><b>${ch}</b><small>${k + 1}</small></span>`).join(''));
      body.append(chart);
      const bitsOf = n => plan.vals.map(v => n & v ? 1 : 0);
      function load() {
        const T = plan.tasks[i]; sub = 0; solved = false;
        head.innerHTML = plan.tasks.map((x, k) => `<i class="${k < i ? 'ok' : k === i ? 'cur' : ''}"></i>`).join('');
        msg.hidden = T.k !== 'lampen'; chart.hidden = T.k !== 'abc'; target.hidden = T.k === 'lampen';
        A.lamps = T.k === 'lampen';
        A.build(plan.vals, T.k === 'kette' ? bitsOf(T.ns[0]) : T.k === 'zuege' ? bitsOf(T.s) : plan.vals.map(() => 0), []); A.taps = 0;
        scene.mood('idle'); api.setFoot([]);
        if (T.k === 'bau') { scene.say('Bau diese Zahl mit deinen Karten.'); target.innerHTML = `<span class="pk-label">Rätsel ${i + 1}</span><b>${T.n}</b>`; }
        if (T.k === 'lampen') {
          scene.say('Lumi schickt ein Lichtzeichen. Stell deine Karten genauso – welche Zahl meint sie?');
          msg.querySelector('.pk-mlamps').innerHTML = bitsOf(T.n).map((b, k) => `<span class="pk-lamp${b ? ' on' : ''}" style="${pkCol(plan.vals[k])}" role="img" aria-label="Lampe ${b ? 'an' : 'aus'}"></span>`).join('');
        }
        if (T.k === 'kette') { scene.say(`Hier liegt die ${T.ns[0]}. Zähl weiter: Bau die nächste Zahl und dann die übernächste.`); chain(); }
        if (T.k === 'zuege') { scene.say(`Von ${T.s} zur ${T.n} – mit möglichst wenigen Zügen. Blinki braucht ${T.min}.`); target.innerHTML = `<span class="pk-label">Rätsel ${i + 1} · Wenigste Züge</span><b>${T.n}</b><small class="pk-zsub">Blinki: ${T.min} Züge</small>`; }
        if (T.k === 'abc') { scene.say('Bau die Zahl für diesen Buchstaben.'); target.innerHTML = `<span class="pk-label">Rätsel ${i + 1} · Buchstabe</span><b>${PK_ABC[T.n - 1]}</b>`; }
      }
      function chain() { const T = plan.tasks[i]; target.innerHTML = `<span class="pk-label">Rätsel ${i + 1} · Weiterzählen</span><div class="pk-chain">${T.ns.map((n, k) => `<span class="${k <= sub ? 'ok' : k === sub + 1 ? 'cur' : ''}">${n}</span>`).join('<i aria-hidden="true">→</i>')}</div>`; }
      function check(t, o) {
        const T = plan.tasks[i]; if (solved) return;
        if (T.k === 'kette') {
          if (t === T.ns[sub + 1]) { sub++; chain(); if (sub === 2) ok('Gut weitergezählt! Schau, welche Karten sich dabei umgedreht haben.', o); else pkLater(o.wait * 1000, () => { scene.mood('happy'); scene.say(`Die ${t}! Und jetzt die ${T.ns[2]}.`); }); }
          return;
        }
        if (t !== T.n) return;
        const parts = A.cards.filter(c => c.up).map(c => c.v).join(' + ');
        if (T.k === 'bau') ok(`${parts} = ${t}. Richtig gebaut!`, o);
        if (T.k === 'lampen') ok(`Lumi meinte die ${t}!${parts.includes('+') ? ` (${parts})` : ''}`, o);
        if (T.k === 'abc') ok(`${PK_ABC[t - 1]} = ${t}. Genau!`, o);
        if (T.k === 'zuege') ok(A.taps === T.min ? `Perfekt – ${T.min} Züge, genau wie Blinki!` : `Geschafft in ${A.taps} Zügen. Blinki schafft es in ${T.min}.`, o);
      }
      function ok(txt, o) {
        solved = true;
        pkLater(o.wait * 1000, () => {
          scene.mood('happy'); scene.hop(); scene.say(txt); A.song(.1);
          api.setFoot([{ label: i < plan.tasks.length - 1 ? 'Nächstes Rätsel' : 'Fertig', on: () => { i++; if (i >= plan.tasks.length) api.finish(); else load(); } }]);
        });
      }
      load();
    }
  }
};

/* ---------- Blinkis Tagesrätsel: drei kurze Rätsel pro Tag, aus dem Datum gewürfelt ---------- */
const pkTagOpen = () => !!pkS().done[4];
function pkRand(seed) {
  let h = 2166136261; for (const ch of seed) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
}
function pkTagPlan(day) {
  const d = pkS().done, r = pkRand('pk' + day), vals = d[7] ? [16, 8, 4, 2, 1] : [4, 2, 1], max = vals.reduce((a, b) => a + b, 0);
  const kinds = ['bau', 'lampen', 'kette'].concat(d[10] ? ['abc'] : [], d[14] && d[7] ? ['zuege'] : []), pick = () => kinds[Math.floor(r() * kinds.length)];
  const tasks = []; let last = '';
  for (let k = 0; k < 3; k++) {
    let kind = pick(); if (kind === last) kind = pick(); if (kind === last) kind = kinds[(kinds.indexOf(kind) + 1) % kinds.length]; last = kind;
    if (kind === 'kette') { const s = Math.floor(r() * (max - 2)); tasks.push({ k: kind, ns: [s, s + 1, s + 2] }); }
    else if (kind === 'abc') tasks.push({ k: kind, n: 1 + Math.floor(r() * 26) });
    else if (kind === 'zuege') { let a, b; do { a = 1 + Math.floor(r() * max); b = 1 + Math.floor(r() * max); } while (a === b || vals.filter(v => (a ^ b) & v).length < 2 || vals.filter(v => (a ^ b) & v).length > 4); tasks.push({ k: kind, s: a, n: b, min: vals.filter(v => (a ^ b) & v).length }); }
    else tasks.push({ k: kind, n: 1 + Math.floor(r() * max) });
  }
  return { vals, tasks };
}
function pkWeekHtml() {
  const days = pkS().tag.days, wd = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], out = [];
  for (let k = 6; k >= 0; k--) { const dt = new Date(); dt.setDate(dt.getDate() - k); const y = ymd(dt); out.push(`<span class="${days[y] ? 'ok' : ''}${k ? '' : ' today'}"><i>${days[y] ? ico('check', 14) : ''}</i>${wd[dt.getDay()]}</span>`); }
  return `<div class="pk-week" aria-label="Tagesrätsel der letzten sieben Tage">${out.join('')}</div>`;
}
function pkTagDone() {
  const p = pkS(); p.tag.days[ymd()] = 1;
  const ks = Object.keys(p.tag.days).sort(); while (ks.length > 120) delete p.tag.days[ks.shift()];
  save();
  pkTone(523, 0, .14, 'triangle', .08); pkTone(659, .1, .14, 'triangle', .08); pkTone(784, .2, .3, 'triangle', .08);
  UI.pkRes = true; pkMount(); window.scrollTo(0, 0);
}
function pkTagResult(root) {
  const w = pkEl('section', 'pk-result');
  w.innerHTML = `<div class="pk-result-fig">${pkBotSvg('blinki', 'happy')}</div><span class="pk-eyebrow">Blinkis Tagesrätsel</span><p class="pk-learn">Geschafft! Morgen gibt es <b>neue Rätsel</b>.</p>${pkWeekHtml()}`;
  const foot = pkEl('div', 'pk-foot'); w.append(foot); root.append(w);
  pkLater(1200, () => pkFootSet(foot, [{ label: 'Zur Übersicht', on: () => go('punkte') }, { label: 'Nochmal', sec: true, on: () => pkStart('tag') }]));
}
function pkWordHtml(word) {
  return `<div class="pk-word" role="img" aria-label="Computer-Wort: ${esc(word.join(''))}">${word.map(l => { const n = l.charCodeAt(0); return `<span class="pk-wl"><b>${esc(l)}</b><span class="pk-wbits">${[64, 32, 16, 8, 4, 2, 1].map(v => `<i class="${n & v ? 'on' : ''}" style="${pkCol(v)}">${n & v ? 1 : 0}</i>`).join('')}</span><small>${n}</small></span>`; }).join('')}</div>`;
}
function pkArmHtml(letters, col, anon) {
  return `<div class="pk-arm" role="img" aria-label="${anon ? 'Armband ohne Namen' : 'Armband: ' + esc(letters.join(''))}">${letters.map(ch => { const n = PK_ABC.indexOf(ch) + 1; return `<span class="pk-bead"><span class="pk-beads">${[16, 8, 4, 2, 1].map(v => `<i class="${n & v ? 'on' : ''}" style="${pkCol(col || v)}"></i>`).join('')}</span>${anon ? '' : `<b>${esc(ch)}</b>`}</span>`; }).join('')}</div>`;
}
const pkFrOpen = () => !!pkS().done[10];
function pkBeadPlan(f) {
  const L = [...f.n], codes = L.map(ch => PK_ABC.indexOf(ch) + 1), on = codes.reduce((a, n) => a + [16, 8, 4, 2, 1].filter(v => n & v).length, 0), off = L.length * 5 - on, sep = L.length - 1;
  const b = PK_BEAD.find(x => x.v === f.c) || PK_BEAD[1];
  return `<div class="pk-plan"><span class="pk-eyebrow">Perlen-Plan zum Nachbauen</span><p>Pro Buchstabe fünf Perlen von links nach rechts: <b>${b.n}</b> = an, <b>Weiß</b> = aus. Zwischen die Buchstaben kommt eine dunkle Trennperle.</p>
    <ul class="pk-need"><li><i style="${pkCol(f.c)}" class="c"></i><b>${on}</b> × ${b.n}</li><li><i class="w"></i><b>${off}</b> × Weiß</li>${sep ? `<li><i class="d"></i><b>${sep}</b> × Dunkel</li>` : ''}</ul>${pkArmHtml(L, f.c)}</div>`;
}
const pkStk = (f, k, on) => `<button class="pk-stk${on ? ' on' : ''}" data-act="pkFr" data-arg="${k}" aria-pressed="${!!on}" aria-label="Armband von ${esc(f.n)}"><b>${esc(f.n)}</b><span class="pk-stkb">${[...f.n].map(ch => { const n = PK_ABC.indexOf(ch) + 1; return `<span>${[16, 8, 4, 2, 1].map(v => `<i class="${n & v ? 'on' : ''}" style="${pkCol(f.c)}"></i>`).join('')}</span>`; }).join('')}</span></button>`;
function pkFreundeView() {
  const p = pkS(), F = p.friends, sel = F[UI.pkFr];
  const det = sel ? `<section class="pk-frdet"><div class="pk-frhead"><h3>Für ${esc(sel.n)}</h3><button class="pk-close" data-act="pkFr" data-arg="-1" aria-label="Schließen">${ico('undo', 18)}</button></div>${pkBeadPlan(sel)}
    <div class="pk-frbtn">${UI.pkDel ? `<span>Armband von ${esc(sel.n)} wirklich löschen?</span><button class="btn sm" data-act="pkFrDel" data-arg="yes">Ja, löschen</button><button class="btn sm sec" data-act="pkFrDel" data-arg="no">Nein</button>` : `<button class="btn sm sec" data-act="pkFrDel" data-arg="ask">${ico('trash', 16)} Löschen</button>`}</div></section>` : '';
  return topBar('Freundes-Armbänder', 'punkte') + `<section class="pk-hub pk-fr">
    <div class="pk-frintro"><p>Bau Armbänder für deine Freunde – Buchstabe für Buchstabe mit deinen Karten.</p>
      <div class="pk-frbtn"><button class="btn" data-act="pkLv" data-arg="freund" ${F.length >= 24 ? 'disabled' : ''}>${ico('plus', 18)} Neues Armband</button><button class="btn sec" data-act="pkLv" data-arg="wem" ${F.length < 3 ? 'disabled' : ''}>Wem gehört das Armband?</button></div>
      ${F.length < 3 ? `<small class="pk-hint">Das Ratespiel geht ab 3 Armbändern${F.length ? ` – noch ${3 - F.length}` : ''}.</small>` : ''}</div>
    ${det}
    ${F.length ? `<div class="pk-stks">${F.map((f, k) => pkStk(f, k, k === UI.pkFr)).join('')}</div>` : '<p class="pk-foot-note">Noch keine Armbänder. Wem machst du das erste?</p>'}
    ${F.length ? `<p class="pk-foot-note"><button class="pk-link" data-act="pkFrDruck">${ico('print', 16)} Sticker-Bogen (1 Seite)</button></p>` : ''}</section>`;
}
function pkFrPrint() {
  const F = pkS().friends;
  return `<div class="top noprint"><button class="btn sec back" data-act="back" data-arg="pkFreunde" aria-label="Zurück">${ico('back', 20)}<span>Zurück</span></button><h2>Namens-Sticker</h2><button class="btn" data-act="print">${ico('print', 20)} Drucken</button></div>
  <p class="pk-pnote noprint">Alle Sticker passen auf eine Seite – am besten auf Sticker-Papier. Die kleine Tafel unten hilft deinen Freunden beim Entschlüsseln.</p>
  <section class="pk-print"><div class="pk-sgrid">${F.map(f => `<div class="pk-psticker">${pkArmHtml([...f.n], f.c)}</div>`).join('')}</div>
  <div class="pk-decoder">${[...PK_ABC].map((ch, k) => `<span><b>${ch}</b>${k + 1}</span>`).join('')}</div></section>`;
}

/* ---------- Übersicht ---------- */
function pkHeroArt() {
  const card = (v, up) => `<span class="pk-hcard${up ? '' : ' down'}" style="${pkCol(v)}"><span class="pk-dots" data-v="${v}">${up ? '<i></i>'.repeat(v) : ''}</span></span>`;
  return `<div class="pk-hart"><div class="pk-hfig">${pkBotSvg('blinki', pkDoneN() ? 'happy' : 'idle')}</div><div class="pk-hcards">${card(4, 1)}${card(2, 0)}${card(1, 1)}</div><div class="pk-hcode" aria-hidden="true">${pkPill(4, 1)}${pkPill(2, '0').replace('pk-pill', 'pk-pill off')}${pkPill(1, 1)}<span>= 5</span></div></div>`;
}
function pkMineIcons() {
  const p = pkS(), out = [];
  const beads = (pat, c) => `<svg viewBox="0 0 34 14" width="34" height="14" aria-hidden="true"><path d="M1 7h32" stroke="currentColor" stroke-width="1.5" opacity=".5"/>${pat.map((b, k) => `<circle cx="${4 + k * 6.5}" cy="7" r="2.8" style="fill:${b ? `var(--pk-c${c ? c : [16, 8, 4, 2, 1][k]})` : 'var(--dz-surface)'};stroke:${b ? 'none' : 'var(--dz-line)'}"/>`).join('')}</svg>`;
  if (p.arm.length) out.push(`<button class="pk-ic${UI.pkShow === 'arm' ? ' on' : ''}" data-act="pkShow" data-arg="arm" aria-expanded="${UI.pkShow === 'arm'}">${beads([0, 1, 1, 0, 1])}<small>Armband</small></button>`);
  if (p.word.length) out.push(`<button class="pk-ic${UI.pkShow === 'word' ? ' on' : ''}" data-act="pkShow" data-arg="word" aria-expanded="${UI.pkShow === 'word'}"><b class="pk-icg">${esc(p.word[0])}<i>${p.word[0].charCodeAt(0)}</i></b><small>Wort</small></button>`);
  if (pkFrOpen()) out.push(`<button class="pk-ic" data-act="pkFreunde">${beads([1, 0, 1, 1, 0], 4)}<small>Freunde${p.friends.length ? ' ' + p.friends.length : ''}</small></button>`);
  return out.length ? `<div class="pk-mine" aria-label="Meine Sachen">${out.join('')}</div>` : '';
}
function pkHub() {
  const p = pkS(), nx = pkNextLv(), all = pkDoneN() === PK_MAX;
  const list = PK_LV.map((L, k) => {
    const d = p.done[L.id], open = pkOpen(L.id);
    return `<button class="pk-lv${d ? ' done' : open ? ' cur' : ' lock'}" data-act="pkLv" data-arg="${L.id}" ${open ? '' : 'disabled'} aria-label="Entdeckung ${k + 1}: ${esc(L.t)}${d ? ', geschafft' : open ? '' : ', noch zu'}">
      <span class="pk-lvn">${d ? ico('check', 18) : open ? k + 1 : ico('lock', 16)}</span><span class="pk-lvt"><b>${esc(L.t)}</b><small>${esc(L.s)}</small></span>${d ? '<span class="pk-lvr">Nochmal</span>' : open ? '<span class="pk-lvr go">Los</span>' : ''}</button>`;
  }).join('');
  const on = p.snd;
  return topBar('Blinkis Punktkarten', 'rewards') + `<section class="pk-hub">
    <div class="pk-hero"><div class="pk-hero-copy"><span class="pk-eyebrow">Punkte · Karten · Geheimcodes</span><h1>Zählen wie ein Computer</h1><p>Dreh Karten um, finde Zahlen und entdecke den Code aus 0 und 1.</p>
      <button class="btn big" data-act="pkLv" data-arg="${nx}">${all ? 'Noch einmal entdecken' : pkDoneN() ? 'Weiter entdecken' : 'Los geht’s'}</button></div>${pkHeroArt()}</div>
    <div class="pk-hubbar"><span class="pk-prog-t"><b>${pkDoneN()}</b> von ${PK_MAX} entdeckt</span>${pkMineIcons()}<button class="pk-sndbtn${on ? ' on' : ''}" data-act="pkSnd" aria-pressed="${on}" aria-label="${on ? 'Kartentöne ausschalten' : 'Kartentöne einschalten'}">${ico(on ? 'speaker' : 'speakerOff', 18)}<span>${on ? 'Ton an' : 'Ton aus'}</span></button></div>
    ${UI.pkShow === 'arm' && p.arm.length ? `<div class="pk-pop"><span class="pk-eyebrow">Dein Licht-Armband</span>${pkArmHtml(p.arm)}</div>` : ''}${UI.pkShow === 'word' && p.word.length ? `<div class="pk-pop"><span class="pk-eyebrow">Dein Computer-Wort</span>${pkWordHtml(p.word)}</div>` : ''}
    ${pkTagOpen() ? (() => { const today = !!p.tag.days[ymd()]; return `<div class="pk-tag"><div class="pk-tag-copy"><span class="pk-eyebrow">Jeden Tag neu</span><h3>Blinkis Tagesrätsel</h3><p>${today ? 'Heute geschafft! Morgen gibt es neue Rätsel.' : 'Drei kurze Rätsel für heute.'}</p></div>${pkWeekHtml()}<button class="btn${today ? ' sec' : ''}" data-act="pkLv" data-arg="tag">${today ? 'Nochmal' : 'Los'}</button></div>`; })() : ''}
    <h3 class="pk-h">Deine Entdeckungsreise</h3><div class="pk-lvs">${list}</div>
    <p class="pk-foot-note">Eine Karte nach der anderen. In deinem Tempo.</p>
    <p class="pk-foot-note"><button class="pk-link" data-act="pkDruck">${ico('print', 16)} Karten zum Ausdrucken (für Eltern)</button></p></section>`;
}

/* ---------- Druckbogen (für Eltern): Punktkarten und Zauberkarten zum Ausschneiden ---------- */
function pkPrintView() {
  const dots = v => `<div class="pk-pcard"><span class="pk-dots" data-v="${v}">${'<i></i>'.repeat(v)}</span></div>`;
  const tc = c => `<div class="pk-pcard trick${c.nums.length > 4 ? ' big' : ''}"><div>${c.nums.map(n => `<b>${n}</b>`).join('')}</div></div>`;
  return `<div class="top noprint"><button class="btn sec back" data-act="back" data-arg="punkte" aria-label="Zurück">${ico('back', 20)}<span>Zurück</span></button><h2>Punktkarten zum Ausdrucken</h2><button class="btn" data-act="print">${ico('print', 20)} Drucken</button></div>
  <p class="pk-pnote noprint">Auf Karton drucken, ausschneiden, Rückseiten leer lassen. Am Tisch spielen Sie dasselbe wie in der App: Karten umdrehen, Punkte zählen, Zahlen bauen.</p>
  <section class="pk-print"><h3>Blinkis Punktkarten</h3><div class="pk-pgrid">${[16, 8, 4, 2, 1].map(dots).join('')}<div class="pk-pcard note"><span>Rückseiten bleiben leer.</span></div></div>
  <h3>Zauberkarten (Gedankenlesen 1–7)</h3><div class="pk-pgrid three">${PK_TRICK.map(tc).join('')}</div>
  <h3>Großer Zaubertrick (Gedankenlesen 1–15)</h3><div class="pk-pgrid four">${PK_TRICK4.map(tc).join('')}</div>
  <p class="pk-credit">Nach „Count the Dots“ von CS Unplugged (csunplugged.org, CC BY-SA 4.0) und dem Gedankenlese-Trick von cs4fn (Queen Mary University of London).</p></section>`;
}

/* ---------- Eltern-Karte (Statistik): Stand und offene Fragen statt Prüfung ---------- */
function pkParentCard() {
  const p = pkS(), P = typeof PT === 'function' ? PT : (de => de);
  const rows = PK_LV.map((L, k) => `<span class="tag${p.done[L.id] ? ' on' : ''}" title="${esc(L.t)}">${k + 1}${p.done[L.id] ? ' ✓' : ''}</span>`).join(' ');
  return `<div class="card noprint pk-parent"><h3>${P('Blinkis Punktkarten: Stand', 'Blinki’s dot cards: progress')}</h3>
    <p class="small mute" style="margin:0 0 6px">${P('Binärzahlen mit Punktkarten (CS Unplugged „Count the Dots“), Gedankenlese-Trick (cs4fn), Stellenwert-Vergleich, Nachrichten, Buchstaben-Armband, Karten bis 64 und ASCII (A = 65). Täglich drei kurze Rätsel. Keine Münzen, Sticker oder Pokale.', 'Binary numbers with dot cards (CS Unplugged “Count the Dots”), a mind-reading trick (cs4fn), place-value comparison, messages, a letter bracelet, cards up to 64 and ASCII (A = 65). Three short puzzles a day. No coins, stickers or trophies.')}</p>
    <div class="cfg"><div><b>${P('Entdeckungen', 'Discoveries')}</b><br><span class="small mute">${pkDoneN()} ${P('von', 'of')} ${PK_MAX}</span></div><div class="row wrap" style="gap:4px">${rows}</div></div>
    <div class="cfg"><div><b>${P('Zaubertrick', 'Magic trick')}</b><br><span class="small mute">${p.trick.guess}× ${P('erraten', 'guessed')} · ${p.trick.show}× ${P('selbst vorgeführt', 'performed by your child')}</span></div></div>
    <div class="cfg"><div><b>${P('Tagesrätsel', 'Daily puzzle')}</b><br><span class="small mute">${Object.keys(p.tag.days).length} ${P('Tage gelöst', 'days solved')}</span></div>${pkWeekHtml()}</div>
    ${p.arm.length ? `<div class="cfg"><div><b>${P('Armband', 'Bracelet')}</b><br><span class="small mute">${esc(p.arm.join(''))}</span></div></div>` : ''}
    ${p.friends.length ? `<div class="cfg"><div><b>${P('Freundes-Armbänder', 'Friends’ bracelets')}</b><br><span class="small mute">${p.friends.length}: ${esc(p.friends.map(f => f.n).join(', '))}</span></div></div>` : ''}
    ${p.word.length ? `<div class="cfg"><div><b>${P('Computer-Wort (ASCII)', 'Computer word (ASCII)')}</b><br><span class="small mute">${esc(p.word.join(''))}</span></div></div>` : ''}
    <div class="pk-q"><b>${P('Nach dem Spielen fragen (nicht prüfen):', 'Ask after playing (do not test):')}</b><ol>
      <li>${P('Warum gibt es keine Karte mit 3 Punkten?', 'Why is there no card with 3 dots?')}</li>
      <li>${P('Wie viele Karten brauchst du für die 10? Welche?', 'How many cards do you need for 10? Which ones?')}</li>
      <li>${P('Wie hat Blinki deine Zahl erraten? Kannst du es bei mir?', 'How did Blinki guess your number? Can you do it with me?')}</li></ol>
      <p class="small mute">${P('Nicht verbessern, sondern nachfragen: „Woher weißt du das?“ – „Zeig es mir mit den Karten.“', 'Don’t correct – ask: “How do you know?” – “Show me with the cards.”')}</p></div>
    <button class="btn sm sec" data-act="pkDruck">${ico('print', 16)} ${P('Karten zum Ausdrucken', 'Printable cards')}</button></div>`;
}

/* ---------- Registrierung ---------- */
DZ_ART.punkte = '<rect x="4" y="10" width="17" height="23" rx="4" fill="#fbfaf7" stroke="#1f8443" stroke-width="2"/><circle cx="9.5" cy="17" r="2.3" fill="#1f8443"/><circle cx="15.5" cy="17" r="2.3" fill="#1f8443"/><circle cx="9.5" cy="26" r="2.3" fill="#1f8443"/><circle cx="15.5" cy="26" r="2.3" fill="#1f8443"/><rect x="24" y="10" width="17" height="23" rx="4" fill="#d9dfe0" stroke="#7f9a9f" stroke-width="2"/><path d="M27 13l11 17M33 13l5 8M27 21l6 9" stroke="#fbfaf7" stroke-width="2"/><rect x="44" y="10" width="17" height="23" rx="4" fill="#fbfaf7" stroke="#e8a90c" stroke-width="2"/><circle cx="52.5" cy="21.5" r="3" fill="#FFC93C"/><rect x="8" y="38" width="9" height="10" rx="3" fill="#1f8443"/><text x="12.5" y="46" font-family="ui-rounded,system-ui,sans-serif" font-weight="800" font-size="8" text-anchor="middle" fill="#fff">1</text><rect x="28" y="38" width="9" height="10" rx="3" fill="none" stroke="#7f9a9f" stroke-width="1.5"/><text x="32.5" y="46" font-family="ui-rounded,system-ui,sans-serif" font-weight="800" font-size="8" text-anchor="middle" fill="#526a70">0</text><rect x="48" y="38" width="9" height="10" rx="3" fill="#FFC93C"/><text x="52.5" y="46" font-family="ui-rounded,system-ui,sans-serif" font-weight="800" font-size="8" text-anchor="middle" fill="#2b2233">1</text>';
Object.assign(DZ_LABEL, { punkte: 'Punktkarten', pkLevel: 'Entdeckung', pkDruck: 'Druckbogen', pkFreunde: 'Freundes-Armbänder', pkFrDruck: 'Sticker-Bogen' });
Object.defineProperty(DZ_PARENT, 'pkLevel', { get: () => (UI.pkLv === 'freund' || UI.pkLv === 'wem') ? 'pkFreunde' : 'punkte', enumerable: true, configurable: true });
VIEWS.punkte = () => { pkS(); return pkHub(); };
registerFeature({
  id: 'punkte', title: 'Blinkis Punktkarten', icon: 'grid', tint: 'butter', group: 'spiel', order: 84, view: 'punkte',
  views: {
    pkLevel: () => { pkS(); const L = PK_SPECIAL[UI.pkLv] ? { t: PK_SPECIAL[UI.pkLv] } : PK_LV.find(x => x.id === +UI.pkLv); return topBar(L ? esc(L.t) : 'Punktkarten', 'punkte') + '<div class="pk-root" id="pkRoot"></div>'; },
    pkDruck: () => pkPrintView(),
    pkFreunde: () => { pkS(); return pkFreundeView(); },
    pkFrDruck: () => pkFrPrint()
  },
  leave: () => { pkClear(); UI.pkShow = null; },
  check: () => { pkS(); },
  acts: {
    punkte: () => go('punkte'),
    pkLv: n => pkStart(n),
    pkDruck: () => go('pkDruck'),
    pkShow: k => { UI.pkShow = UI.pkShow === k ? null : k; render(); },
    pkFreunde: () => { if (pkFrOpen()) go('pkFreunde', { pkFr: -1, pkDel: false }); },
    pkFr: k => { k = +k; UI.pkFr = UI.pkFr === k ? -1 : k; UI.pkDel = false; render(); },
    pkFrDel: a => { const p = pkS(); if (a === 'ask') UI.pkDel = true; else if (a === 'no') UI.pkDel = false; else if (a === 'yes' && p.friends[UI.pkFr]) { p.friends.splice(UI.pkFr, 1); save(); UI.pkFr = -1; UI.pkDel = false; } render(); },
    pkFrDruck: () => go('pkFrDruck'),
    pkSnd: () => { const p = pkS(); p.snd = !p.snd; save(); if (p.snd) pkBi(1); render(); }
  }
});
AFTER.pkLevel = () => pkMount();
