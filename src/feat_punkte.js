/* =====================================================================
   BLINKIS PUNKTKARTEN (in Meine Welt, von den Eltern einschaltbar; Standard: ausgeblendet)
   Binärzahlen mit Punktkarten, frei nach „Count the Dots“ (CS Unplugged, University of Canterbury, CC BY-SA),
   dem Gedankenlese-Trick (cs4fn, Queen Mary University of London), Stellenwert-Vergleich (Exploring Binary),
   Bestell-Spiel (Cornell) und Buchstaben-Armband (Code.org). Fragen statt Erklären: Garlikov (Eltern-Karte).
   Eine Idee pro Entdeckung. Die Karten sind das einzige Werkzeug: antippen = umdrehen (offen / zu).
   Die Entdeckung ist die Belohnung. Klein daneben: Sterne für perfekte Züge (Wenigste Züge, Erklär es Lumi, Rätsel) –
   sie schalten Armband-Muster und Anhänger frei; einige Muster/Anhänger gibt es auch im Shop (Gruppe „Blinki“, nur wenn eingeschaltet).
   Karten: nach jedem Umdrehen eine kurze Pause (PK.pause = 0,5 s), damit das Kind schaut statt wild zu tippen.
   Trainingslager (feat_punkte_lager.js): S.punkte.tr, S.punkte.les (Entdeckungsreise offen/zu; ohne Wert: offen, bis alles entdeckt ist).
   Gespeichert: S.punkte = { done{n:ts}, snd (Kartentöne, Standard AN; „Töne aus“ der App gilt immer), trick{guess,show}, lumi, stars,
     arm[], armD (Muster), armC (Farbe bei Einfarbig), armCh (Anhänger), word[], tag{days{ymd:Anzahl}, total}, friends[{n,c,d,ch,ts}] }
   Freundes-Armbänder (ab Entdeckung 10): Name selbst schreiben, Buchstaben mit den Karten bauen, Sammlung, „Wem gehört das Armband?“, Perlen-Plan.
   Buchstaben: A = 1 … Z = 26, Ä = 27, Ö = 28, Ü = 29, ß = 30 (fünf Karten schaffen bis 31).
   Blinkis Rätsel (UI.pkLv = 'tag'): beliebig viele kurze Rätsel ab Entdeckung 4; gezählt werden nur Erfolge, Meilensteine feiern.
   Aufbau: Übersicht (VIEWS.punkte, normales Zeichnen) · Entdeckung (VIEWS.pkLevel: Rahmen, Inhalt wird in AFTER aufgebaut,
   damit Karten wirklich umklappen) · Druckbogen (VIEWS.pkDruck)
   ===================================================================== */
const PK_LV = [
  { id: 1, t: 'Eine Karte', s: 'Offen oder zu', c: 'Eine Karte hat zwei Zustände: <b>offen</b> oder <b>zu</b>.' },
  { id: 2, t: 'Zwei Karten', s: 'Welche Zahlen gehen?', c: 'Zwei Karten schaffen <b>0, 1, 2 und 3</b> – jede Zahl genau einmal.' },
  { id: 3, t: 'Die neue Karte', s: 'Wie viele Punkte hat sie?', c: 'Jede neue Karte hat <b>doppelt so viele</b> Punkte: 1, 2, 4.' },
  { id: 4, t: 'Der Geheimcode', s: 'Offen = 1, zu = 0', c: 'Offen = <b>1</b>, zu = <b>0</b>. 101 heißt 4 + 1 = 5.' },
  { id: 14, t: 'Wenigste Züge', s: 'Codes vergleichen', c: 'Vergleich die Codes: Wo sie <b>verschieden</b> sind, drehst du um – jede Karte <b>einmal</b>.' },
  { id: 5, t: 'Der Zaubertrick', s: 'Blinki liest Gedanken', c: 'Die <b>erste Zahl</b> jeder Zauberkarte ist ihre Punktkarte.' },
  { id: 6, t: 'Schule und Blinki', s: 'Zahlen bauen wie in der Schule', c: 'Schule: pro Stelle <b>0 bis 9</b>. Blinki: pro Stelle nur <b>0 oder 1</b>.' },
  { id: 7, t: 'Mehr Karten', s: 'Die 8 und die 16', c: 'Fünf Karten schaffen alle Zahlen von <b>0 bis 31</b>.' },
  { id: 8, t: 'Lumis Paketpost', s: 'Jede Ware hat einen Code', c: 'Mit <b>1</b> und <b>0</b> kann man alles bestellen: <b>101</b> = 5 = 🍌.' },
  { id: 9, t: 'Erklär es Lumi', s: 'Jetzt erklärst du', c: 'Die offenen Karten <b>zusammenzählen</b> – dann stimmt die Zahl.' },
  { id: 10, t: 'Dein Licht-Armband', s: 'Buchstaben als Code', c: 'Jeder Buchstabe ist eine Zahl: <b>A = 1</b> … Z = 26.' },
  { id: 11, t: 'Der große Zaubertrick', s: 'Vier Karten, Zahlen bis 15', c: 'Vier Zauberkarten erraten jede Zahl von <b>1 bis 15</b>.' },
  { id: 12, t: 'Die 32 und die 64', s: 'Wie groß geht es?', c: 'Die größte Zahl ist immer <b>eins weniger</b> als die nächste Karte – mit sieben Karten <b>127</b>.' },
  { id: 13, t: 'Der echte Computer-Code', s: 'Bonus: A = 65 und ein Name', c: 'Im Computer ist <b>A = 64 + 1 = 65</b> – jeder Buchstabe ist eine Zahl.' }
];
const PK_MAX = PK_LV.length;
const PK_NOTE = { 1: 1318.5, 2: 987.8, 4: 659.3, 8: 493.9, 16: 329.6, 32: 261.6, 64: 196 };
const PK_SNACK = [null, ['🍎', 'Apfel'], ['🥨', 'Brezel'], ['🍪', 'Keks'], ['🧃', 'Saft'], ['🍌', 'Banane'], ['🥕', 'Möhre'], ['🧁', 'Muffin']];
const PK_TRICK = [{ v: 4, nums: [4, 5, 6, 7] }, { v: 2, nums: [2, 3, 6, 7] }, { v: 1, nums: [1, 3, 5, 7] }];
const PK_TRICK4 = [8, 4, 2, 1].map(v => ({ v, nums: Array.from({ length: 15 }, (_, k) => k + 1).filter(n => n & v) }));
const PK_ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß';
const PK_BEAD = [{ v: 1, n: 'Gelb' }, { v: 2, n: 'Blau' }, { v: 4, n: 'Grün' }, { v: 8, n: 'Violett' }, { v: 16, n: 'Orange' }];
const PK_SPECIAL = { tag: 'Blinkis Rätsel', freund: 'Neues Freundes-Armband', wem: 'Wem gehört das Armband?' };

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
  // früher: 1 = drei Rätsel an diesem Tag gelöst – nichts geht verloren
  if (!(p.tag.total >= 0)) p.tag.total = Object.values(p.tag.days).reduce((a, b) => a + (+b || 0), 0) * 3;
  if (!(p.stars >= 0)) p.stars = 0;
  if (typeof p.armD !== 'string') p.armD = 'bunt';
  if (typeof p.armCh !== 'string') p.armCh = '';
  if (!(p.armC > 0)) p.armC = 2;
  return p;
}
const pkDoneN = () => PK_LV.filter(L => pkS().done[L.id]).length;
const pkIdx = id => PK_LV.findIndex(L => L.id === id);
/* Freie Wahl (Eltern-Schalter) oder Admin-Modus: alle Entdeckungen, Rätsel, Freunde und Trainings-Level sind offen – ohne etwas als geschafft zu zählen */
const pkFree = () => (typeof ADMIN !== 'undefined' && ADMIN) || !!pkS().free;
const pkOpen = n => { const i = pkIdx(n), d = pkS().done; return pkFree() || i === 0 || !!d[n] || (i > 0 && !!d[PK_LV[i - 1].id]); };
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
const PK = { fx: [], pause: 500, bid: 0 };
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
    deck.className = 'pk-cards n' + vals.length + (cfg.terms ? ' pk-sumrow' : ''); deck.innerHTML = ''; A.slots = []; A.coolUntil = 0;
    counter.classList.toggle('many', vals.length > 4);
    A.cards.forEach((c, i) => {
      const s = pkEl('div', 'pk-slot' + (c.fresh ? ' arrive' : ''));
      s.setAttribute('style', pkCol(c.v)); s.dataset.v = c.v;
      s.innerHTML = `<span class="pk-lamp"${A.lamps ? '' : ' hidden'} aria-hidden="true"></span><button class="pk-card" type="button"><span class="pk-flip"><span class="pk-face pk-front"><span class="pk-dots" data-v="${c.v}">${'<i></i>'.repeat(c.v)}</span></span><span class="pk-face pk-back"></span></span></button>${cfg.terms ? `<span class="pk-sval">${(cfg.names && cfg.names[c.v]) || c.v}</span>` : ''}<span class="pk-bit"${A.code ? '' : ' hidden'} aria-hidden="true"></span>${cfg.terms ? '<span class="pk-term"></span>' : ''}`;
      s.querySelector('.pk-card').addEventListener('click', () => A.tap(i));
      deck.append(s); A.slots.push(s);
    });
    A.refresh(false);
  };
  /* Nach jedem Umdrehen eine kurze Pause: Die Karte zeigt sich, die anderen warten (PK.pause, im Test 0) */
  A.tap = i => {
    if (A.lock || Date.now() < (A.coolUntil || 0)) return;
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
    const ms = PK.pause > 0 ? Math.max(PK.pause, wait * 1000) : 0;
    if (ms) {
      A.coolUntil = Date.now() + ms; deck.classList.add('cool'); slot.classList.add('just');
      setTimeout(() => { if (Date.now() >= A.coolUntil) { deck.classList.remove('cool'); slot.classList.remove('just'); } }, ms + 20);
    }
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
  if (UI.pkRes && !sp) { pkResult(root, L); return; }
  const who = PK_RUN[n].who || 'blinki';
  const scene = pkScene(root, who), body = pkEl('div', 'pk-body'), foot = pkEl('div', 'pk-foot');
  root.append(body, foot);
  const api = {
    scene, body, foot, n,
    setFoot: btns => pkFootSet(foot, btns),
    finish: () => tag ? go('punkte') : sp ? go('pkFreunde', { pkFr: -1, pkDel: false }) : pkFinish(n)
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
  else if (n === 'train') { if (!UI.pkTr || !pktOpen(UI.pkTr.m, UI.pkTr.l)) return; }
  else { n = +n; if (!PK_RUN[n] || !pkOpen(n)) return; }
  if (view === 'pkLevel') { UI.pkLv = n; UI.pkRes = false; render(); window.scrollTo(0, 0); }
  else go('pkLevel', { pkLv: n, pkRes: false });
}
function pkResult(root, L) {
  const nxt = PK_LV[pkIdx(L.id) + 1], p = pkS();
  const w = pkEl('section', 'pk-result');
  w.innerHTML = `<div class="pk-result-fig">${pkBotSvg('blinki', 'happy')}</div><span class="pk-eyebrow">Deine Entdeckung · ${esc(L.t)}</span><p class="pk-learn">${L.c}</p>
    ${L.id === 10 && p.arm.length ? `<div class="pk-keep">${pkBand(p.arm, pkMyLook())}</div>` : ''}${L.id === 13 && p.word.length ? `<div class="pk-keep">${pkWordHtml(p.word)}</div>` : ''}
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
      // Schule und Blinki: erst eine Zahl mit Hundertern, Zehnern und Einern bauen, dann mit Blinkis Vierer, Zweier, Einer – dann vergleichen
      const { scene, body } = api, cnt = [0, 0, 0], PV = [100, 10, 1], PN = ['Hunderter', 'Zehner', 'Einer'], d9 = () => 1 + Math.floor(Math.random() * 8);
      const tS = d9() * 100 + d9() * 10 + d9(), tB = [3, 5, 6, 7][Math.floor(Math.random() * 4)];
      let phase = 'school';
      const school = pkEl('section', 'pk-cmp school on'), blk = pkEl('section', 'pk-cmp blinki'), cmp = pkEl('section', 'pk-cmpres');
      school.innerHTML = `<div class="pk-cmphead"><h3 class="pk-cmph">1 · In der Schule</h3><span class="pk-goal">Bau die <b>${tS}</b></span></div><div class="pk-scards pk-sumrow"></div>`;
      blk.innerHTML = `<div class="pk-cmphead"><h3 class="pk-cmph">2 · Bei Blinki</h3><span class="pk-goal">Bau die <b>${tB}</b></span></div><div class="pk-bwrap"></div>`;
      cmp.hidden = true;
      body.append(school, blk, cmp);
      scene.say(`Du kennst Hunderter, Zehner und Einer aus der Schule. Bau die <span class="pk-big">${tS}</span>: Tippe eine Karte für eins mehr, auf <b>–</b> für eins weniger.`);
      const row = school.querySelector('.pk-scards');
      const pic = (p, n) => {
        if (!n) return '<span class="pk-dien empty" aria-hidden="true"></span>';
        const one = p === 100 ? '<i class="pl"></i>' : p === 10 ? '<i class="rod"></i>' : '<i class="cube"></i>';
        return `<span class="pk-dien p${p}" aria-hidden="true">${one.repeat(n)}</span>`;
      };
      const plus = '<div class="pk-sep" aria-hidden="true"><span class="pk-plus">+</span></div>';
      const eq = v => `<div class="pk-seq"><span class="pk-plus">=</span><b class="pk-tot">${v}</b></div>`;
      const sTot = () => cnt[0] * 100 + cnt[1] * 10 + cnt[2];
      function drawSchool() {
        row.innerHTML = PV.map((p, i) => `<div class="pk-scol"><button type="button" class="pk-scard" data-i="${i}" aria-label="${PN[i]}: ${cnt[i]}. Antippen für eins mehr">${pic(p, cnt[i])}<span class="pk-times">${cnt[i]}×</span></button><span class="pk-sval">${PN[i]}</span><div class="pk-pm"><button type="button" class="pk-minus" data-i="${i}" aria-label="Einen ${PN[i]} weniger" ${cnt[i] && phase === 'school' ? '' : 'disabled'}>−</button><span class="pk-digit">${cnt[i]}</span></div><span class="pk-term">${cnt[i]} × ${p}</span></div>`).join(plus) + eq(sTot());
        row.querySelectorAll('.pk-scard').forEach(b => b.addEventListener('click', () => change(+b.dataset.i, 1)));
        row.querySelectorAll('.pk-minus').forEach(b => b.addEventListener('click', () => change(+b.dataset.i, -1)));
      }
      function change(i, d) {
        if (phase !== 'school') return;
        if (d > 0 && cnt[i] >= 9) { pkNope(); scene.shake(); scene.say(`Mehr als 9 ${PN[i]} gehen nicht auf eine Stelle. Bei 10 tauscht man sie gegen die nächste Karte.`); return; }
        cnt[i] = Math.max(0, cnt[i] + d); pkTick();
        if (sTot() === tS) {
          phase = 'blinki'; drawSchool(); school.classList.remove('on'); blk.classList.add('on'); A.lock = false;
          scene.mood('happy'); scene.hop();
          scene.say(`Richtig: ${cnt[0]} Hunderter, ${cnt[1]} Zehner, ${cnt[2]} Einer. Jetzt bei Blinki: Bau die <span class="pk-big">${tB}</span>. Blinkis Karten sind Vierer, Zweier und Einer.`);
          pkLater(300, () => blk.scrollIntoView({ behavior: 'smooth', block: 'center' }));
        } else drawSchool();
      }
      const A = pkStage(blk.querySelector('.pk-bwrap'), {
        code: true, noCounter: true, terms: true, names: { 4: 'Vierer', 2: 'Zweier', 1: 'Einer' },
        onChange(t, o) {
          const b = blk.querySelector('.pk-tot'); if (b) b.textContent = t;
          if (o.byTap && phase === 'blinki' && t === tB) { phase = 'cmp'; A.lock = true; pkLater(o.wait * 1000, compare); }
        }
      });
      A.build([4, 2, 1], [0, 0, 0], []);
      A.slots.forEach((s, i) => { if (i) s.insertAdjacentHTML('beforebegin', plus); });
      A.el.deck.insertAdjacentHTML('beforeend', eq(0));
      A.lock = true;
      drawSchool();
      function compare() {
        const bits = A.cards.map(c => c.up ? 1 : 0);
        cmp.hidden = false; school.classList.add('on');
        cmp.innerHTML = `<div class="pk-cmprow"><span class="pk-cmpk">Schule</span><span class="pk-cmpx">${cnt[0]} Hunderter + ${cnt[1]} Zehner + ${cnt[2]} Einer = <b>${tS}</b></span><span class="pk-dg">${cnt.map(d => `<i>${d}</i>`).join('')}<small>Ziffern 0 bis 9</small></span></div>
          <div class="pk-cmprow"><span class="pk-cmpk">Blinki</span><span class="pk-cmpx">${bits[0]} Vierer + ${bits[1]} Zweier + ${bits[2]} Einer = <b>${tB}</b></span><span class="pk-dg">${bits.map(d => `<i class="${d ? 'on' : ''}">${d}</i>`).join('')}<small>nur 0 oder 1</small></span></div>`;
        scene.mood('happy'); scene.hop(); A.song(0);
        scene.say('Gleich: Jede Stelle hat einen Wert, und man zählt alles zusammen. Anders: In der Schule darf eine Stelle 0 bis 9 sein – bei Blinki nur 0 oder 1.');
        pkLater(200, () => cmp.scrollIntoView({ behavior: 'smooth', block: 'center' }));
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
      // Lumis Paketpost: Lumi nennt eine Ware, das Kind sucht den Code in der Liste und stellt ihn mit den Karten ein (keine Lampen zum Abmalen)
      const { scene, body } = api, V = [4, 2, 1], code = n => V.map(v => n & v ? 1 : 0).join('');
      const wants = [1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - .5).slice(0, 4);
      let r = 0;
      const order = pkEl('div', 'pk-order'), menu = pkEl('div', 'pk-menu'), prog = pkEl('div', 'pk-prog');
      body.append(order);
      const A = pkStage(body, { code: true, noCounter: true, onChange() { } });
      body.append(menu, prog);
      function round() {
        const w = wants[r], numMode = r >= 2;
        order.classList.remove('sent');
        order.innerHTML = `<span class="pk-label">Lumi bestellt</span><span class="pk-box" aria-hidden="true"><span class="pk-emo-big">${PK_SNACK[w][0]}</span></span><b>${PK_SNACK[w][1]}</b>`;
        menu.innerHTML = PK_SNACK.slice(1).map((s, i) => `<div class="pk-snack" data-n="${i + 1}"><span class="pk-emo" aria-hidden="true">${s[0]}</span><span>${s[1]}</span><b class="pk-sc">${numMode ? i + 1 : code(i + 1)}</b></div>`).join('');
        A.build(V, [0, 0, 0], []); A.lock = false;
        prog.innerHTML = wants.map((x, k) => `<i class="${k < r ? 'ok' : k === r ? 'cur' : ''}"></i>`).join('');
        scene.mood('idle');
        scene.say(r === 0 ? 'Willkommen bei meiner Paketpost! Jede Ware hat einen Code aus 0 und 1. Such die Ware in der Liste und stell ihren Code mit deinen Karten ein.'
          : r === 2 ? 'Jetzt steht in der Liste nur noch die Zahl. Welcher Code gehört dazu?' : numMode ? 'Noch ein Paket – wieder nur mit der Zahl.' : 'Danke! Noch ein Paket, bitte.');
        api.setFoot([{ label: 'Abschicken', on: send }]);
      }
      function send() {
        const t = A.total(), w = wants[r];
        if (t === w) {
          order.classList.add('sent'); A.lock = true; api.setFoot([]);
          scene.mood('happy'); scene.hop(); A.song(.1);
          scene.say(`${PK_SNACK[w][0]} ${PK_SNACK[w][1]} ist unterwegs – Code <b>${code(w)}</b>. Genau richtig!`);
          r++;
          pkLater(1800, () => { if (r >= wants.length) { pkS().lumi++; save(); api.finish(); } else round(); });
          return;
        }
        scene.shake(); scene.mood('confused'); pkNope();
        scene.say(t ? `Du hast <b>${code(t)}</b> geschickt – das ist ${PK_SNACK[t][0]} ${PK_SNACK[t][1]}. Ich wollte ${PK_SNACK[w][0]} ${PK_SNACK[w][1]}.` : `<b>000</b> ist ein leeres Paket! Ich wollte ${PK_SNACK[w][0]} ${PK_SNACK[w][1]}.`);
      }
      round();
    }
  },
  9: {
    who: 'lumi',
    run(api) {
      // Erklär es Lumi: erst einfach lösen; war es nicht perfekt, darf man es mit den wenigsten Zügen nochmal versuchen (3 Sterne)
      const { scene, body } = api;
      const RS = [{ v: [4, 2, 1], want: 6, up: [1, 1, 1] }, { v: [4, 2, 1], want: 5, up: [1, 1, 0] }, { v: [4, 2, 1], want: 3, up: [1, 0, 1] }, { v: [8, 4, 2, 1], want: 10, up: [0, 1, 1, 1] }];
      let i = 0, retry = false, best = 0, done = false;
      const min = () => { const r = RS[i]; return r.v.filter((v, k) => !!r.up[k] !== !!(r.want & v)).length; };
      const A = pkStage(body, {
        code: true, label: 'Lumis Karten',
        onChange(t, o) {
          const r = RS[i]; if (!r || done) return;
          if (retry) mv.textContent = `Züge: ${A.taps} · Blinki: ${min()}`;
          if (t === r.want) { done = true; solved(o); }
          else if (o.byTap) { scene.mood('confused'); scene.say(`Jetzt steht da ${t}. Ich will die ${r.want}.`); }
        }
      });
      const mv = pkEl('span', 'pk-moves'); A.el.counter.after(mv);
      function load(again) {
        const r = RS[i]; done = false; retry = !!again; if (!again) best = 0;
        A.build(r.v, r.up, []); A.taps = 0;
        mv.hidden = !retry; mv.textContent = `Züge: 0 · Blinki: ${min()}`;
        scene.mood('confused');
        scene.say(retry ? `Zeig es mir nochmal – diesmal mit nur <b>${min()}</b>-mal Umdrehen.` : `Ich will die <span class="pk-big">${r.want}</span> zeigen. Warum steht da ${A.total()}?`);
        api.setFoot([]);
      }
      function solved(o) {
        const moves = A.taps, m = min(), rt = pkRate(moves, m), gain = Math.max(0, rt - best), parts = A.cards.filter(c => c.up).map(c => c.v);
        best = Math.max(best, rt); if (gain) pkGiveStars(gain);
        pkLater(o.wait * 1000, () => {
          scene.mood('happy'); scene.hop(); A.song(0);
          const last = i === RS.length - 1, nextB = { label: last ? 'Fertig' : 'Nächste', on: next };
          if (rt === 3) { pkCelebrate(scene); scene.say(`Ach so! ${parts.join(' + ')} = ${RS[i].want}. Perfekt – ${m === 1 ? 'nur ein Zug' : m + ' Züge'}! ${pkStarsHtml(3)}`); api.setFoot([nextB]); }
          else { scene.say(`Ach so! ${parts.join(' + ')} = ${RS[i].want}. Du hast ${moves} Züge gebraucht – es geht mit ${m}. ${pkStarsHtml(rt)} Willst du es mit perfekten Zügen versuchen?`); api.setFoot([{ label: 'Nochmal perfekt', on: () => load(true) }, Object.assign({ sec: true }, nextB)]); }
        });
      }
      function next() { i++; if (i >= RS.length) { api.finish(); return; } load(false); }
      load(false);
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
        arm.innerHTML = letters.length ? pkBand(letters, pkMyLook()) : '<p class="pk-armempty">Dein Armband ist noch leer.</p>';
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
      const { scene, body } = api, R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
      // nach der 100 noch drei Profi-Zahlen: je eine zwischen 33–63, 64–95 und 96–126
      const G = [R(33, 63), R(64, 95), R(96, 126)];
      let step = 'max31', gi = 0;
      scene.say('Mach die <b>größte</b> Zahl, die diese fünf Karten schaffen.');
      const tg = pkEl('div', 'pk-target'); tg.hidden = true;
      const goal = (lbl, n) => { tg.hidden = false; tg.innerHTML = `<span class="pk-label">${lbl}</span><b>${n}</b>${gi || step === 'goals' ? `<div class="pk-prog">${G.map((x, k) => `<i class="${k < gi ? 'ok' : k === gi ? 'cur' : ''}"></i>`).join('')}</div>` : ''}`; };
      const A = pkStage(body, {
        code: true,
        onChange(t, o) {
          if (!o.byTap) return;
          const all = A.cards.every(c => c.up), w = o.wait * 1000, parts = () => A.cards.filter(c => c.up).map(c => c.v).join(' + ');
          const grow = (v, said) => {
            step = 'wait';
            pkLater(w, () => {
              scene.mood('happy'); scene.hop(); scene.say(said);
              pkLater(1700, () => { A.build([v, ...A.cards.map(c => c.v)], [0, ...A.cards.map(c => c.up)], [v]); step = 'rev' + v; scene.mood('curious'); scene.say('Eine neue Karte! Wie viele Punkte hat sie?'); });
            });
          };
          const to100 = said => { step = 'b100'; pkLater(w, () => { scene.mood('happy'); scene.hop(); scene.say(said); goal('Profi-Zahl', 100); }); };
          if (step === 'max31' && all) grow(32, '31! Mehr geht mit fünf Karten nicht. Für die 32 braucht es …');
          else if (step === 'rev32' && A.cards[0].up) {
            if (all) grow(64, '32 Punkte – doppelt so viel wie die 16! Jetzt sind alle offen: 63. Wieder eins weniger als die nächste Karte …');
            else { step = 'max63'; pkLater(w, () => scene.say('32 Punkte – doppelt so viel wie die 16! Und jetzt wieder die größte Zahl?')); }
          }
          else if (step === 'max63' && all) grow(64, '63! Wieder eins weniger als die nächste Karte. Die heißt …');
          else if (step === 'rev64' && A.cards[0].up) {
            if (all) to100('64 Punkte! Alle offen: 127 – die größte Zahl mit sieben Karten. Jetzt für Profis: Bau die <span class="pk-big">100</span>.');
            else { step = 'max127'; pkLater(w, () => scene.say('64 Punkte! Schaffst du die größte Zahl mit sieben Karten?')); }
          }
          else if (step === 'max127' && all) to100('127! Jetzt eine Zahl für Profis: Bau die <span class="pk-big">100</span>.');
          else if (step === 'b100' && t === 100) {
            step = 'goals'; gi = 0; const pp = parts();
            pkLater(w, () => { scene.mood('happy'); scene.hop(); A.song(0); scene.say(`${pp} = 100. Stark! Noch drei Profi-Zahlen. Bau die <span class="pk-big">${G[0]}</span>.`); goal('Profi-Zahl 1 von 3', G[0]); });
          }
          else if (step === 'goals' && t === G[gi]) {
            gi++; const pp = parts();
            if (gi >= G.length) {
              step = 'done';
              pkLater(w, () => { goal('Geschafft', t); pkCelebrate(scene); A.song(0); scene.say(`${pp} = ${t}. Mit sieben Karten baust du jede Zahl bis 127!`); api.setFoot([{ label: 'Fertig', on: api.finish }]); });
            } else pkLater(w, () => { scene.mood('happy'); scene.hop(); scene.say(`${pp} = ${t}. Jetzt die <span class="pk-big">${G[gi]}</span>.`); goal(`Profi-Zahl ${gi + 1} von 3`, G[gi]); });
          }
        }
      });
      A.el.deck.before(tg);
      A.build([16, 8, 4, 2, 1], [0, 0, 0, 0, 0], []);
    }
  },
  13: {
    run(api) {
      const { scene, body } = api, p = pkS();
      let phase = 'a', name = '', i = 0, note = '';
      // nur Großbuchstaben (65–90): ein kleines p würde Kinder verwirren
      const ltr = n => n >= 65 && n <= 90 ? String.fromCharCode(n) : '';
      const conv = v => [...String(v).toUpperCase()].map(c => ({ 'Ä': 'AE', 'Ö': 'OE', 'Ü': 'UE', 'ẞ': 'SS' })[c] || c).join('').replace(/[^A-Z]/g, '').slice(0, 8);
      scene.say('Dein Armband sagt A = 1. Ein Computer sagt A = 65: Er schaltet die <b>64-Karte</b> an – und dann die 1. Bau das A!');
      const pick = pkEl('section', 'pk-npick'), fname = pkEl('div', 'pk-fname');
      pick.hidden = true; fname.hidden = true;
      body.append(pick, fname);
      const A = pkStage(body, { code: true, label: 'Zahl', onChange(t, o) { paint(t, o.byTap); if (o.byTap) react(t, o); } });
      const show = pkEl('div', 'pk-ascii', '<span class="pk-label">Buchstabe</span><b>–</b>');
      A.el.deck.before(show);
      const chart = pkEl('div', 'pk-abc', [...PK_ABC.slice(0, 26)].map((ch, k) => `<span class="pk-ch" data-n="${65 + k}"><b>${ch}</b><small>${65 + k}</small></span>`).join(''));
      const out = pkEl('div', 'pk-armwrap');
      body.append(chart, out);
      function react(t, o) {
        if (phase === 'a' && t === 65) {
          phase = 'pick'; A.lock = true;
          pkLater(o.wait * 1000, () => { scene.mood('happy'); scene.hop(); A.song(0); scene.say('Das A! 64 + 1 = 65. Welchen Namen soll der Computer speichern?'); picker(''); });
        }
      }
      /* Name wählen: selbst schreiben, einen Freund nehmen oder würfeln (Mädchen- und Jungennamen gemischt) */
      function picker(k, rn) {
        body.classList.add('picking'); pick.hidden = false;
        const F = p.friends.map(f => f.n).filter(n => conv(n).length > 1);
        const opt = (id, ic, t) => `<button type="button" class="pk-nopt${k === id ? ' on' : ''}" data-k="${id}" aria-pressed="${k === id}"><span aria-hidden="true">${ic}</span><b>${t}</b></button>`;
        let sub = '';
        if (k === 'me') sub = '<label class="pk-label" for="pkMe">Dein Name</label><input id="pkMe" class="pk-name" maxlength="12" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="done"><small class="pk-hint pk-conv"></small>';
        if (k === 'fr') sub = `<div class="pk-nchips">${F.map(n => `<button type="button" class="pk-nchip" data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div>`;
        if (k === 'rnd') sub = `<div class="pk-nrnd"><b>${esc(rn)}</b><button type="button" class="pk-tool pk-reroll" aria-label="Anderer Name" title="Anderer Name">${ico('dice', 20)}</button></div>`;
        pick.innerHTML = `<div class="pk-nopts">${opt('me', '✏️', 'Mein Name')}${F.length ? opt('fr', '👫', 'Ein Freund') : ''}${opt('rnd', '🎲', 'Zufallsname')}</div>${sub ? `<div class="pk-nsub">${sub}</div>` : ''}`;
        pick.querySelectorAll('.pk-nopt').forEach(b => b.addEventListener('click', () => { const id = b.dataset.k; picker(id, id === 'rnd' ? rndName(rn) : ''); }));
        api.setFoot([]);
        if (k === 'me') {
          const inp = pick.querySelector('input'), cv = pick.querySelector('.pk-conv');
          const upd = () => { const v = conv(inp.value); cv.textContent = v && v !== inp.value.toUpperCase().replace(/[^A-ZÄÖÜß]/g, '') ? `Im Computer: ${v}` : ''; api.setFoot([{ label: 'Weiter', disabled: v.length < 2, on: () => choose(inp.value) }]); };
          inp.addEventListener('input', upd);
          inp.addEventListener('keydown', e => { if (e.key === 'Enter' && conv(inp.value).length > 1) choose(inp.value); });
          upd(); setTimeout(() => { try { inp.focus(); } catch (e) { } }, 60);
        }
        if (k === 'fr') pick.querySelectorAll('.pk-nchip').forEach(b => b.addEventListener('click', () => choose(b.dataset.n)));
        if (k === 'rnd') { pick.querySelector('.pk-reroll').addEventListener('click', () => picker('rnd', rndName(rn))); api.setFoot([{ label: `${rn} nehmen`, on: () => choose(rn) }]); }
      }
      function rndName(not) { const L = PK_NAMES.filter(n => n !== not); return L[Math.floor(Math.random() * L.length)]; }
      function choose(raw) {
        name = conv(raw); if (name.length < 2) return;
        note = /[ÄÖÜäöüß]/.test(raw) ? ' Im Computer-Code gibt es kein Ä, Ö, Ü oder ß – man schreibt AE, OE, UE und SS.' : '';
        phase = 'build'; i = 0;
        body.classList.remove('picking'); pick.hidden = true; fname.hidden = false;
        A.lock = false; A.cards.forEach((c, k) => A.set(k, c.v === 64)); A.refresh(false);
        scene.mood('idle'); scene.say(`Bau <b>${esc(name)}</b> Buchstabe für Buchstabe. Die 64 bleibt an. Such das <b>${name[0]}</b> in der Tafel.${note}`);
      }
      function paintName() { fname.innerHTML = [...name].map((ch, k) => `<span class="${k < i ? 'ok' : k === i ? 'cur' : ''}">${esc(ch)}</span>`).join(''); }
      function paint(t, byTap) {
        const l = ltr(t);
        show.querySelector('b').textContent = l || '–';
        chart.querySelectorAll('.pk-ch').forEach(e => e.classList.toggle('now', +e.dataset.n === t));
        if (phase === 'a') { api.setFoot([]); return; }
        if (phase !== 'build') return;
        paintName();
        out.innerHTML = i ? pkWordHtml([...name.slice(0, i)]) : '';
        api.setFoot([{ label: l ? `${l} speichern` : 'Speichern', disabled: !l, on: add }]);
        if (byTap && t > 90) scene.say(`Die ${t} ist kein Großbuchstabe. Die Tafel geht von 65 bis 90.`);
      }
      function add() {
        const t = A.total(), l = ltr(t), need = name[i]; if (!l || phase !== 'build') return;
        if (l !== need) { scene.shake(); scene.mood('confused'); pkNope(); scene.say(`Das ist ein <b>${l}</b> – du brauchst ein <b>${need}</b>. Schau in die Tafel.`); return; }
        i++; A.song(0, scene); scene.mood('happy'); A.lock = true;
        if (i >= name.length) {
          phase = 'end'; paintName(); out.innerHTML = pkWordHtml([...name]); api.setFoot([]);
          pkLater(1100, () => { pkCelebrate(scene); scene.say(`<b>${esc(name)}</b> ist gespeichert: ${name.length} Buchstaben, jeder eine Zahl aus 0 und 1.`); api.setFoot([{ label: 'Fertig', on: fin }]); });
          return;
        }
        scene.say(`${l} = ${t}. Jetzt das <b>${name[i]}</b>.`);
        pkLater(1200, () => { A.cards.forEach((c, k) => A.set(k, c.v === 64)); A.lock = false; A.refresh(false); });
        paint(t);
      }
      function fin() { p.word = [...name]; save(); api.finish(); }
      A.build([64, 32, 16, 8, 4, 2, 1], [0, 0, 0, 0, 0, 0, 0], []);
    }
  },
  14: {
    run(api) {
      // Wenigste Züge (direkt nach dem Geheimcode): drei Karten, Ziel mit Code – wo die Codes verschieden sind, wird umgedreht
      const { scene, body } = api, V = [4, 2, 1], MINS = [2, 2, 3], bits = n => V.map(v => n & v ? 1 : 0), pop = n => V.filter(v => n & v).length;
      let s = 0, t = 0, min = 0, n = 0, done = false, best = 0;
      const tg = pkEl('div', 'pk-target pk-ztarget'), mv = pkEl('span', 'pk-moves');
      const A = pkStage(body, { code: true, onChange(tt, o) { if (!o.byTap || done) return; mv.textContent = `Züge: ${A.taps} · Blinki: ${min}`; if (tt === t) end(o); } });
      const row = pkEl('div', 'pk-zrow'); row.append(A.el.counter, tg); A.el.deck.before(row); A.el.deck.after(mv);
      function load(again) {
        if (!again) { do { s = Math.floor(Math.random() * 8); t = 1 + Math.floor(Math.random() * 7); } while (pop(s ^ t) !== MINS[n]); min = MINS[n]; best = 0; n++; }
        done = false; A.build(V, bits(s), []); A.taps = 0;
        A.slots.forEach(x => x.classList.remove('mark'));
        tg.innerHTML = `<span class="pk-label">Ziel</span><b>${t}</b><span class="pk-tcode" aria-label="Code ${bits(t).join('')}">${bits(t).map((b, k) => `<i class="${b ? 'on' : ''}" style="${pkCol(V[k])}">${b}</i>`).join('')}</span>`;
        mv.textContent = `Züge: 0 · Blinki: ${min}`;
        scene.mood('idle');
        scene.say(again ? `Nochmal von <b>${s}</b> zur <b>${t}</b> – diesmal mit nur <b>${min}</b> Zügen. Vergleich die Codes!`
          : n === 1 ? `Bau die <span class="pk-big">${t}</span> mit möglichst wenig Umdrehen. Vergleich deinen Code mit dem Ziel-Code. Blinki schafft es mit <b>${min}</b> Zügen.`
            : `Von <b>${s}</b> zur <span class="pk-big">${t}</span>. Blinki braucht <b>${min}</b> Züge. Und du?`);
        api.setFoot([]);
      }
      function end(o) {
        done = true; const moves = A.taps, rt = pkRate(moves, min), gain = Math.max(0, rt - best), last = n >= MINS.length;
        best = Math.max(best, rt); if (gain) pkGiveStars(gain);
        pkLater(o.wait * 1000, () => {
          const nextB = { label: last ? 'Fertig' : 'Nächstes Rätsel', on: last ? api.finish : () => load(false) };
          if (rt === 3) { pkCelebrate(scene); A.song(0); scene.say(`Perfekt! ${min} Züge – kein einziger zu viel. ${pkStarsHtml(3)}`); api.setFoot([nextB]); }
          else {
            scene.mood('curious'); A.slots.forEach((x, i) => x.classList.toggle('mark', !!((s ^ t) & A.cards[i].v)));
            scene.say(`Geschafft in ${moves} Zügen. ${pkStarsHtml(rt)} Es geht mit ${min}: Nur die markierten Karten sind im Code anders. Versuchst du es perfekt?`);
            api.setFoot([{ label: 'Nochmal perfekt', on: () => load(true) }, Object.assign({ sec: true }, nextB)]);
          }
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
          w.innerHTML = `<div class="pk-swatches">${PK_BEAD.map(b => `<button type="button" class="pk-sw${b.v === col ? ' on' : ''}" data-v="${b.v}" style="${pkCol(b.v)}" aria-pressed="${b.v === col}"><i></i><small>${b.n}</small></button>`).join('')}</div><div class="pk-armwrap">${pkBand([...name], { d: 'eins', col })}</div><small class="pk-hint">Muster und Anhänger kannst du danach aussuchen.</small>`;
          w.querySelectorAll('.pk-sw').forEach(b => b.addEventListener('click', () => { col = +b.dataset.v; pkBi(col); paint(); }));
        };
        paint();
        api.setFoot([{ label: 'Speichern', on: () => { p.friends.push({ n: name, c: col, d: 'eins', ch: '', ts: Date.now() }); save(); go('pkFreunde', { pkFr: p.friends.length - 1, pkDel: false }); } }]);
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
        arm.innerHTML = pkBand([...f.n], { d: f.d || 'eins', col: f.c, ch: f.ch, anon: true });
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
        const g = arm.querySelector('g.pk-bg'); if (g) g.classList.add('hint');
        scene.say(`Das ist nicht ${esc(b.dataset.n)}. Lies den ersten Buchstaben: ${[16, 8, 4, 2, 1].filter(v => n1 & v).join(' + ')} = ${n1}.`);
      }
      load();
    }
  },
  tag: {
    run(api) {
      // Blinkis Rätsel: so viele, wie das Kind mag. Gezählt wird nur, was gelingt – Fehler zählen nie.
      const { scene, body } = api, p = pkS(), d = p.done, vals = d[7] ? [16, 8, 4, 2, 1] : [4, 2, 1], max = vals.reduce((a, b) => a + b, 0);
      const kinds = ['bau', 'code', 'kette'].concat(d[10] ? ['abc'] : [], d[14] ? ['zuege'] : []);
      const R = n => Math.floor(Math.random() * n), bitsOf = n => vals.map(v => n & v ? 1 : 0), pc = n => vals.filter(v => n & v).length;
      let T = null, last = '', sub = 0, solved = false, counted = false, best = 0;
      const bar = pkEl('div', 'pk-tagbar'), target = pkEl('div', 'pk-target');
      body.append(bar, target);
      const A = pkStage(body, { code: true, onChange(t, o) { if (o.byTap) check(t, o); } });
      const chart = pkEl('div', 'pk-abc', [...PK_ABC].map((ch, k) => `<span class="pk-ch" data-n="${k + 1}"><b>${ch}</b><small>${k + 1}</small></span>`).join(''));
      body.append(chart);
      const stop = () => go('punkte');
      function head() {
        const tot = p.tag.total;
        bar.innerHTML = `<span class="pk-chip">Heute <b>${p.tag.days[ymd()] || 0}</b></span><span class="pk-chip">Gesamt <b>${tot}</b></span><span class="pk-chip mile">${ico('target', 14)} Ziel <b>${pkNextMile(tot)}</b></span>`;
      }
      function make() {
        let k = kinds[R(kinds.length)];
        if (k === last && kinds.length > 1) k = kinds[(kinds.indexOf(k) + 1 + R(kinds.length - 1)) % kinds.length];
        last = k;
        if (k === 'kette') { const s = R(max - 1); return { k, ns: [s, s + 1, s + 2] }; }
        if (k === 'abc') return { k, n: 1 + R(PK_ABC.length) };
        if (k === 'zuege') { let a, b, m; do { a = R(max + 1); b = 1 + R(max); m = pc(a ^ b); } while (a === b || m < 2 || m > Math.min(4, vals.length)); return { k, s: a, n: b, min: m }; }
        return { k, n: 1 + R(max) };
      }
      function load(again) {
        if (!again) { T = make(); counted = false; best = 0; }
        sub = 0; solved = false;
        chart.hidden = T.k !== 'abc';
        A.code = T.k !== 'code';
        A.build(vals, T.k === 'kette' ? bitsOf(T.ns[0]) : T.k === 'zuege' ? bitsOf(T.s) : vals.map(() => 0), []); A.taps = 0;
        A.slots.forEach(x => x.classList.remove('mark'));
        head(); scene.mood('idle');
        api.setFoot([{ label: 'Aufhören', sec: true, on: stop }]);
        if (T.k === 'bau') { scene.say('Bau diese Zahl mit deinen Karten.'); target.innerHTML = `<span class="pk-label">Bau die Zahl</span><b>${T.n}</b>`; }
        if (T.k === 'code') { scene.say('Ein Geheimcode! 1 heißt offen, 0 heißt zu. Stell ihn mit den Karten – welche Zahl ist es?'); target.innerHTML = `<span class="pk-label">Geheimcode</span><span class="pk-dcode">${bitsOf(T.n).map(b => `<i>${b}</i>`).join('')}</span>`; }
        if (T.k === 'kette') { scene.say(`Hier liegt die ${T.ns[0]}. Zähl weiter: Bau die nächste Zahl und dann die übernächste.`); chain(); }
        if (T.k === 'abc') { scene.say('Bau die Zahl für diesen Buchstaben.'); target.innerHTML = `<span class="pk-label">Buchstabe</span><b>${PK_ABC[T.n - 1]}</b>`; }
        if (T.k === 'zuege') { scene.say(again ? `Nochmal – diesmal mit nur ${T.min} Zügen.` : `Von ${T.s} zur ${T.n} – mit möglichst wenigen Zügen. Blinki braucht ${T.min}.`); target.innerHTML = `<span class="pk-label">Wenigste Züge</span><b>${T.n}</b><small class="pk-zsub">Züge: 0 · Blinki: ${T.min}</small>`; }
      }
      function chain() { target.innerHTML = `<span class="pk-label">Weiterzählen</span><div class="pk-chain">${T.ns.map((n, k) => `<span class="${k <= sub ? 'ok' : k === sub + 1 ? 'cur' : ''}">${n}</span>`).join('<i aria-hidden="true">→</i>')}</div>`; }
      function check(t, o) {
        if (solved) return;
        if (T.k === 'zuege') { const z = target.querySelector('.pk-zsub'); if (z) z.textContent = `Züge: ${A.taps} · Blinki: ${T.min}`; }
        if (T.k === 'kette') {
          if (t === T.ns[sub + 1]) { sub++; chain(); if (sub === 2) ok('Gut weitergezählt! Schau, welche Karten sich dabei umgedreht haben.', o); else pkLater(o.wait * 1000, () => { scene.mood('happy'); scene.say(`Die ${t}! Und jetzt die ${T.ns[2]}.`); }); }
          return;
        }
        if (t !== T.n) return;
        const parts = A.cards.filter(c => c.up).map(c => c.v).join(' + ');
        if (T.k === 'bau') ok(`${parts} = ${t}. Richtig gebaut!`, o);
        if (T.k === 'code') ok(`${bitsOf(t).join('')} ist die ${t}!${parts.includes('+') ? ` (${parts})` : ''}`, o);
        if (T.k === 'abc') ok(`${PK_ABC[t - 1]} = ${t}. Genau!`, o);
        if (T.k === 'zuege') {
          const rt = pkRate(A.taps, T.min), gain = Math.max(0, rt - best); best = Math.max(best, rt); if (gain) pkGiveStars(gain);
          if (rt === 3) ok(`Perfekt – ${T.min} Züge, genau wie Blinki! ${pkStarsHtml(3)}`, o);
          else { A.slots.forEach((x, i) => x.classList.toggle('mark', !!((T.s ^ T.n) & A.cards[i].v))); ok(`Geschafft in ${A.taps} Zügen. ${pkStarsHtml(rt)} Blinki schafft es in ${T.min} – die markierten Karten.`, o, [{ label: 'Nochmal perfekt', sec: true, on: () => load(true) }]); }
        }
      }
      function ok(txt, o, extra) {
        solved = true; let mile = 0;
        if (!counted) {
          counted = true; const k = ymd();
          p.tag.days[k] = (p.tag.days[k] || 0) + 1; p.tag.total++;
          const ks = Object.keys(p.tag.days).sort(); while (ks.length > 120) delete p.tag.days[ks.shift()];
          if (pkIsMile(p.tag.total)) mile = p.tag.total;
          save(); if (mile) pkGiveStars(2);
        }
        pkLater(o.wait * 1000, () => {
          head(); scene.mood('happy'); scene.hop(); A.song(.1);
          if (mile) { pkCelebrate(scene, true); scene.say(`${txt}<br><b>${mile} Rätsel gelöst!</b> Dafür gibt es 2 Leuchtsterne. ${pkStarsHtml(2, 2)}`); }
          else scene.say(txt);
          api.setFoot([...(extra || []), { label: 'Nächstes Rätsel', on: () => load(false) }, { label: 'Aufhören', sec: true, on: stop }]);
        });
      }
      load(false);
    }
  }
};

/* ---------- Blinkis Rätsel: so viele, wie das Kind mag; gezählt werden nur Erfolge. Meilensteine bringen ein kleines Fest. ---------- */
const pkTagOpen = () => pkFree() || !!pkS().done[4];
const PK_MILE = [5, 10, 25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000];
const pkIsMile = n => PK_MILE.includes(n) || (n > 1000 && n % 500 === 0);
const pkNextMile = n => PK_MILE.find(m => m > n) || (Math.floor(n / 500) + 1) * 500;
function pkWeekHtml(mini) {
  const days = pkS().tag.days, wd = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], out = [];
  for (let k = 6; k >= 0; k--) { const dt = new Date(); dt.setDate(dt.getDate() - k); const y = ymd(dt), n = +days[y] || 0; out.push(`<span class="${n ? 'ok' : ''}${k ? '' : ' today'}"><i>${n && !mini ? ico('check', 14) : ''}</i>${mini ? '' : wd[dt.getDay()]}</span>`); }
  return `<div class="pk-week${mini ? ' mini' : ''}" aria-label="Rätsel an den letzten sieben Tagen">${out.join('')}</div>`;
}
/* Zufallsnamen für den Computer-Code: Mädchen und Jungen gemischt, nur A–Z */
const PK_NAMES = ['LENA', 'PAUL', 'MIA', 'BEN', 'EMMA', 'NOAH', 'HANNA', 'FINN', 'LEA', 'JONAS', 'SOFIA', 'ELIAS', 'LINA', 'LUKAS', 'MILA', 'LEON', 'KLARA', 'MAX', 'IDA', 'TOM', 'EMIL', 'NELE', 'OSKAR', 'LOTTA'];

/* ---------- Sterne: 3 = perfekt (wenigste Züge), 2 = knapp daneben, 1 = geschafft. Pro Rätsel zählt der beste Versuch. ---------- */
const pkRate = (moves, min) => moves <= min ? 3 : moves <= min + 2 ? 2 : 1;
function pkGiveStars(n) { const p = pkS(); p.stars += n; save(); pkStarUnlocks(); }
const pkStarsHtml = (n, of) => { of = of || 3; return `<span class="pk-stars" role="img" aria-label="${n} von ${of} Leuchtsternen">${'<i class="on">✦</i>'.repeat(n)}${'<i>✦</i>'.repeat(Math.max(0, of - n))}</span>`; };
function pkStarUnlocks() {
  if (typeof CATALOG === 'undefined') return;
  const st = pkS().stars; let any = false;
  PK_DES.map(x => ['pkd.' + x.id, x.stars]).concat(PK_CHARMS.map(x => ['pkc.' + x.id, x.stars])).forEach(([id, n]) => { if (n && st >= n && !S.unl[id]) { unlock(id); any = true; } });
  if (any) save();
}
/* Kleines Fest: Perlen in den Kartenfarben fliegen auf, vier helle Töne */
function pkCelebrate(scene, big) {
  if (!scene || !scene.el) return;
  scene.mood('happy'); scene.hop();
  const b = pkEl('div', 'pk-burst' + (big ? ' big' : '')), cols = [1, 2, 4, 8, 16], n = big ? 22 : 12;
  b.setAttribute('aria-hidden', 'true');
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + Math.random() * .4, r = (big ? 90 : 58) + Math.random() * 40, i = pkEl('i', k % 3 ? '' : 'st');
    i.style.cssText = `--x:${Math.round(Math.cos(a) * r)}px;--y:${Math.round(Math.sin(a) * r - 18)}px;--c:${PK_HEX[cols[k % 5]]};animation-delay:${Math.round(Math.random() * 120)}ms`;
    b.append(i);
  }
  scene.el.append(b); pkLater(1600, () => b.remove());
  [523, 659, 784, 1047].forEach((f, k) => pkTone(f, k * .09, .16, 'triangle', .07));
  if (big) { pkTone(1319, .42, .3, 'triangle', .07); pkTone(1568, .56, .4, 'triangle', .06); }
}

/* ---------- Armband-Muster und Anhänger: frei, mit Sternen verdient oder im Shop (Münzen) ---------- */
const PK_HEX = { 1: '#f5b40f', 2: '#1764d5', 4: '#1f8443', 8: '#7b5cd6', 16: '#F28C28', 32: '#94582a', 64: '#14817a' };
const PK_HEXN = { 1: 'Gelb', 2: 'Blau', 4: 'Grün', 8: 'Violett', 16: 'Orange' };
const PK_RAIN = [['#e53935', 'Rot'], ['#fb8c00', 'Orange'], ['#fdd835', 'Gelb'], ['#43a047', 'Grün'], ['#1e88e5', 'Blau'], ['#8e24aa', 'Lila']];
const PK_SEA = { 16: ['#0b3d91', 'Dunkelblau'], 8: ['#1565c0', 'Blau'], 4: ['#1e88e5', 'Hellblau'], 2: ['#26a69a', 'Türkis'], 1: ['#4dd0e1', 'Eisblau'] };
const PK_DES = [
  { id: 'bunt', n: 'Bunt', on: v => [PK_HEX[v], PK_HEXN[v]], off: ['#ffffff', 'Weiß'], cord: '#5d566b', sw: ['#F28C28', '#7b5cd6', '#1f8443', '#1764d5', '#f5b40f'] },
  { id: 'eins', n: 'Einfarbig', on: (v, li, c) => [PK_HEX[c] || PK_HEX[2], PK_HEXN[c] || 'Blau'], off: ['#ffffff', 'Weiß'], cord: '#5d566b', sw: ['#1764d5', '#ffffff', '#1764d5'] },
  { id: 'regenbogen', n: 'Regenbogen', stars: 5, on: (v, li) => PK_RAIN[li % 6], off: ['#ffffff', 'Weiß'], cord: '#5d566b', sw: PK_RAIN.map(r => r[0]) },
  { id: 'glitzer', n: 'Glitzer', stars: 15, on: () => ['G', 'Glitzer-Gold'], g: ['#fff7c2', '#e0a800'], off: ['#f1edfa', 'Perlweiß'], cord: '#a996dc', spark: true, sw: ['#e0a800', '#f1edfa', '#e0a800'] },
  { id: 'ozean', n: 'Ozean', stars: 30, on: v => PK_SEA[v] || PK_SEA[4], off: ['#f3e3c3', 'Sand'], cord: '#0e7c86', sw: ['#0b3d91', '#1e88e5', '#4dd0e1'] },
  { id: 'holz', n: 'Holz', price: 40, on: () => ['G', 'Holz dunkel'], g: ['#d39a62', '#7a4a22'], off: ['#f1dfc0', 'Holz hell'], cord: '#6b4b2a', sq: true, sw: ['#7a4a22', '#f1dfc0', '#7a4a22'] },
  { id: 'nacht', n: 'Leuchtnacht', price: 60, on: () => ['#7ef9ff', 'Leuchtperle'], off: ['#3a3666', 'Nachtblau'], cord: '#9b95d6', sep: '#d8d4ff', bg: '#17153a', glow: true, ink: '#eeeaff', sw: ['#17153a', '#7ef9ff', '#17153a'] },
  { id: 'gold', n: 'Gold', price: 90, on: () => ['G', 'Gold'], g: ['#fff1a8', '#c99a06'], off: ['#fbf8f0', 'Perlweiß'], cord: '#c9a227', spark: true, sw: ['#c99a06', '#fbf8f0', '#c99a06'] }
];
const PK_CHARMS = [
  { id: 'stern', n: 'Stern', e: '⭐' }, { id: 'blinki', n: 'Blinki', e: '🤖', stars: 10 }, { id: 'klee', n: 'Kleeblatt', e: '🍀', stars: 20 },
  { id: 'mond', n: 'Mond', e: '🌙', price: 25 }, { id: 'ball', n: 'Ball', e: '⚽', price: 25 }, { id: 'note', n: 'Note', e: '🎵', price: 25 }, { id: 'rakete', n: 'Rakete', e: '🚀', price: 40 }
];
const pkDes = id => PK_DES.find(x => x.id === id) || PK_DES[0];
const pkSrc = x => x.stars ? { t: 'milestone', why: `${x.stars} Leuchtsterne bei Blinkis Punktkarten` } : x.price ? { t: 'shop', cur: 'c', price: x.price } : { t: 'free' };
SHOP_GROUPS.blinki = { label: 'Blinki', ic: 'grid' };
regKind('pkband', { group: 'blinki', label: 'Armband-Muster', ic: 'sparkle', flag: 'punkte', thumb: it => `<div class="pk-thumb">${pkBand(['K'], { d: it.d, col: 2, anon: true })}</div>` });
regKind('pkcharm', { group: 'blinki', label: 'Anhänger', ic: 'star', flag: 'punkte', thumb: it => `<div class="ithumb">${it.e}</div>` });
regItems(PK_DES.map(x => ({ id: 'pkd.' + x.id, kind: 'pkband', name: x.n, d: x.id, stars: x.stars || 0, src: pkSrc(x) })));
regItems(PK_CHARMS.map(x => ({ id: 'pkc.' + x.id, kind: 'pkcharm', name: x.n, e: x.e, stars: x.stars || 0, src: pkSrc(x) })));

/* Armband als Bild: Perlen auf einer hängenden Schnur, Verschluss, Anhänger. Lange Namen werden zweimal gewickelt.
   o = { d: Muster, col: Farbe (Einfarbig), ch: Anhänger, anon: ohne Buchstaben, mini: klein } – pro Buchstabe <g class="pk-bg"> mit .b(.on) */
function pkBand(letters, o) {
  o = o || {}; letters = letters.length ? letters : ['A'];
  const D = pkDes(o.d), id = 'pkb' + (++PK.bid), R = 6.3, ST = 15, GAP = 12, PAD = 16, Y0 = 14, ink = D.ink || '#3a3346';
  const L = letters.length, rows = L > 6 ? 2 : 1, per = Math.ceil(L / rows), charm = pkCharmSvg(o.ch);
  const fill = (b) => { const f = b.on ? D.on(b.v, b.li, o.col)[0] : D.off[0]; return f === 'G' ? `url(#${id}g)` : f; };
  let W = 0; const parts = [];
  for (let r = 0; r < rows; r++) {
    const chunk = letters.slice(r * per, (r + 1) * per); if (!chunk.length) continue;
    const beads = [], seps = [], groups = [];
    let x = PAD + R;
    chunk.forEach((ch, k) => {
      const li = r * per + k;
      if (k) { seps.push(x - ST + GAP); x += 2 * GAP - ST; }
      const n = PK_ABC.indexOf(ch) + 1, gb = [];
      [16, 8, 4, 2, 1].forEach(v => { gb.push({ x, v, on: !!(n & v), li }); x += ST; });
      groups.push({ ch, gb }); beads.push(...gb);
    });
    parts.push({ groups, seps, w: x - ST + R + PAD + (charm ? 16 : 0), n: chunk.length });
  }
  W = Math.max(...parts.map(q => q.w));
  const rowH = Y0 + 4 + Math.min(22, 4 + per * 2.4) + R + (o.anon ? 8 : 22);
  let svg = '', y0 = 0;
  parts.forEach((q, r) => {
    const w = q.w, sag = Math.min(22, 4 + q.n * 2.4), half = w / 2 - 3, yy = xx => y0 + Y0 + sag * (1 - Math.pow((xx - w / 2) / half, 2));
    svg += `<g transform="translate(${((W - w) / 2).toFixed(1)} 0)">`;
    svg += `<path d="M3 ${y0 + Y0}Q${w / 2} ${y0 + Y0 + 2 * sag} ${w - 3} ${y0 + Y0}" fill="none" stroke="${D.cord}" stroke-width="2.2" stroke-linecap="round"/>`;
    svg += `<circle cx="3.5" cy="${y0 + Y0}" r="3.4" fill="none" stroke="${D.cord}" stroke-width="2"/><circle cx="${w - 3.5}" cy="${y0 + Y0}" r="3.4" fill="none" stroke="${D.cord}" stroke-width="2"/>`;
    q.seps.forEach(sx => { svg += `<circle cx="${sx}" cy="${yy(sx).toFixed(1)}" r="3.3" fill="${D.sep || '#2b2233'}"/>`; });
    q.groups.forEach(g => {
      const ys = g.gb.map(b => yy(b.x)), top = Math.min(...ys), bot = Math.max(...ys), x0 = g.gb[0].x, x1 = g.gb[4].x;
      let gs = `<rect class="hl" x="${x0 - R - 4}" y="${(top - R - 4).toFixed(1)}" width="${x1 - x0 + 2 * R + 8}" height="${(bot - top + 2 * R + 8).toFixed(1)}" rx="10"/>`;
      g.gb.forEach((b, k) => {
        const cy = ys[k].toFixed(1), f = fill(b), st = b.on ? 'rgba(0,0,0,.2)' : (D.bg ? '#5a558a' : '#cdc6b8');
        if (b.on && D.glow) gs += `<circle cx="${b.x}" cy="${cy}" r="${R + 2.6}" fill="${f}" opacity=".75" filter="url(#${id}f)"/>`;
        gs += D.sq ? `<rect class="b${b.on ? ' on' : ''}" data-v="${b.v}" x="${b.x - R}" y="${(ys[k] - R).toFixed(1)}" width="${2 * R}" height="${2 * R}" rx="3.4" fill="${f}" stroke="${st}" stroke-width="1.2"/>`
          : `<circle class="b${b.on ? ' on' : ''}" data-v="${b.v}" cx="${b.x}" cy="${cy}" r="${R}" fill="${f}" stroke="${st}" stroke-width="1.2"/>`;
        if (b.on && !D.glow) gs += `<circle cx="${b.x - 2.1}" cy="${(ys[k] - 2.3).toFixed(1)}" r="1.7" fill="#fff" opacity=".55"/>`;
        if (b.on && D.spark && (b.li + k) % 3 === 0) gs += `<path d="M0-3.4L.8-.8 3.4 0 .8.8 0 3.4-.8.8-3.4 0-.8-.8Z" transform="translate(${b.x + R - 1} ${(ys[k] - R + 1).toFixed(1)})" fill="#fff"/>`;
      });
      svg += `<g class="pk-bg" data-l="${esc(g.ch)}">${gs}</g>`;
      if (!o.anon) svg += `<text class="lt" x="${(x0 + x1) / 2}" y="${(bot + R + 15).toFixed(1)}" text-anchor="middle" font-size="12.5" font-weight="800" fill="${ink}" font-family="ui-rounded,system-ui,sans-serif">${esc(g.ch)}</text>`;
    });
    if (charm && r === parts.length - 1) svg += `<path d="M${w - 3.5} ${y0 + Y0 + 3.4}v8" stroke="${D.cord}" stroke-width="1.6"/><g transform="translate(${w - 3.5} ${y0 + Y0 + 23})">${charm}</g>`;
    svg += '</g>'; y0 += rowH;
  });
  const H = Math.max(y0, charm ? Y0 + 36 : 0) + 2;
  const defs = (D.g ? `<radialGradient id="${id}g" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${D.g[0]}"/><stop offset="1" stop-color="${D.g[1]}"/></radialGradient>` : '')
    + (D.glow ? `<filter id="${id}f" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="2.4"/></filter>` : '');
  const name = letters.join('');
  return `<svg class="pk-band${o.mini ? ' mini' : ''}${D.bg ? ' dark' : ''}" viewBox="0 0 ${W} ${H}" width="${Math.round(W * (o.mini ? 1 : 1.5))}" height="${Math.round(H * (o.mini ? 1 : 1.5))}" role="img" aria-label="${o.anon ? 'Armband ohne Namen' : 'Armband: ' + esc(name)}">${defs ? `<defs>${defs}</defs>` : ''}${D.bg ? `<rect width="${W}" height="${H}" rx="12" fill="${D.bg}"/>` : ''}${svg}</svg>`;
}
/* Anhänger: Emoji oder eine Album-Figur (eigene Sticker) */
function pkCharmSvg(ch) {
  if (!ch) return '';
  if (ch.startsWith('fg.')) { const it = typeof CATALOG !== 'undefined' && CATALOG[ch]; return it && it.svg && hasItem(ch) ? `<svg x="-13" y="-13" width="26" height="26" viewBox="-55 -55 110 110">${it.svg}</svg>` : ''; }
  const c = PK_CHARMS.find(x => x.id === ch); return c ? `<text y="6" text-anchor="middle" font-size="17">${c.e}</text>` : '';
}
const pkMyLook = () => { const p = pkS(); return { d: p.armD, col: p.armC, ch: p.armCh }; };
function pkLookOf(tg) { const p = pkS(); if (tg === 'me') return pkMyLook(); const f = p.friends[+tg]; return f ? { d: f.d || 'eins', col: f.c, ch: f.ch || '' } : pkMyLook(); }
function pkSetLook(tg, o) {
  const p = pkS(), f = tg === 'me' ? null : p.friends[+tg]; if (tg !== 'me' && !f) return;
  if (tg === 'me') { if (o.d) p.armD = o.d; if ('ch' in o) p.armCh = o.ch; if (o.col) p.armC = o.col; }
  else { if (o.d) f.d = o.d; if ('ch' in o) f.ch = o.ch; if (o.col) f.c = o.col; }
  save(); pkBi(2); render();
}
/* Auswahl: Muster (mit Farbe bei „Einfarbig“) und Anhänger. Gesperrte zeigen ★ oder 🪙 – Antippen führt in den Shop. */
function pkLookHtml(tg) {
  const lk = pkLookOf(tg), st = pkS().stars;
  const why = x => x.stars ? `✦ ${x.stars}` : `🪙 ${(CATALOG[(x.e ? 'pkc.' : 'pkd.') + x.id] || { src: {} }).src.price || x.price}`;
  const des = PK_DES.map(x => { const has = hasItem('pkd.' + x.id), on = lk.d === x.id; return `<button type="button" class="pk-lk${on ? ' on' : ''}${has ? '' : ' locked'}" data-act="pkLook" data-arg="${tg}|${x.id}" aria-pressed="${on}" aria-label="Muster ${x.n}${has ? '' : ', noch gesperrt'}"><span class="pk-lksw" aria-hidden="true">${x.sw.map(c => `<i style="background:${c}"></i>`).join('')}</span><small>${has ? x.n : why(x)}</small></button>`; }).join('');
  const cols = lk.d === 'eins' ? `<div class="pk-lrow pk-lcols">${PK_BEAD.map(b => `<button type="button" class="pk-sw${b.v === lk.col ? ' on' : ''}" data-act="pkCol" data-arg="${tg}|${b.v}" style="${pkCol(b.v)}" aria-pressed="${b.v === lk.col}" aria-label="Farbe ${b.n}"><i></i></button>`).join('')}</div>` : '';
  const figs = Object.values(CATALOG).filter(it => it.kind === 'figur' && it.svg && hasItem(it.id));
  const chb = (arg, inner, label, on, has) => `<button type="button" class="pk-lk pk-lkc${on ? ' on' : ''}${has ? '' : ' locked'}" data-act="pkCharm" data-arg="${tg}|${arg}" aria-pressed="${on}" aria-label="Anhänger ${esc(label)}${has ? '' : ', noch gesperrt'}">${inner}</button>`;
  const ch = chb('', '<span class="pk-lke" aria-hidden="true">✕</span><small>Ohne</small>', 'ohne', !lk.ch, true)
    + PK_CHARMS.map(x => { const has = hasItem('pkc.' + x.id); return chb(x.id, `<span class="pk-lke" aria-hidden="true">${x.e}</span><small>${has ? x.n : why(x)}</small>`, x.n, lk.ch === x.id, has); }).join('')
    + figs.map(it => chb(it.id, `<span class="pk-lke" aria-hidden="true"><svg viewBox="-55 -55 110 110" width="24" height="24">${it.svg}</svg></span><small>${esc(it.name)}</small>`, it.name, lk.ch === it.id, true)).join('');
  return `<div class="pk-look"><span class="pk-eyebrow">Muster</span><div class="pk-lrow">${des}</div>${cols}<span class="pk-eyebrow">Anhänger</span><div class="pk-lrow">${ch}</div><small class="pk-hint">✦ ${st} Leuchtsterne – die gibt es für perfekte Züge.${figs.length ? '' : ' Figuren aus deinem Album werden auch Anhänger.'}</small></div>`;
}
function pkWordHtml(word) {
  return `<div class="pk-word" role="img" aria-label="Computer-Wort: ${esc(word.join(''))}">${word.map(l => { const n = l.charCodeAt(0); return `<span class="pk-wl"><b>${esc(l)}</b><span class="pk-wbits">${[64, 32, 16, 8, 4, 2, 1].map(v => `<i class="${n & v ? 'on' : ''}" style="${pkCol(v)}">${n & v ? 1 : 0}</i>`).join('')}</span><small>${n}</small></span>`; }).join('')}</div>`;
}
const pkFrOpen = () => pkFree() || !!pkS().done[10];
/* Perlen-Plan: zählt die Perlen pro Farbe des gewählten Musters */
function pkBeadPlan(f) {
  const D = pkDes(f.d || 'eins'), L = [...f.n], cnt = {}, sep = L.length - 1;
  const add = (fl, nm) => { (cnt[nm] = cnt[nm] || { n: 0, sw: fl === 'G' ? `radial-gradient(circle at 35% 30%,${D.g[0]},${D.g[1]})` : fl }).n++; };
  L.forEach((ch, li) => { const n = PK_ABC.indexOf(ch) + 1; [16, 8, 4, 2, 1].forEach(v => n & v ? add(...D.on(v, li, f.c)) : add(...D.off)); });
  return `<div class="pk-plan"><span class="pk-eyebrow">Perlen-Plan zum Nachbauen</span><p>Pro Buchstabe fünf Perlen von links nach rechts: farbig = an, <b>${D.off[1]}</b> = aus. Zwischen die Buchstaben kommt eine dunkle Trennperle.</p>
    <ul class="pk-need">${Object.keys(cnt).map(nm => `<li><i style="background:${cnt[nm].sw}"></i><b>${cnt[nm].n}</b> × ${esc(nm)}</li>`).join('')}${sep ? `<li><i class="d"></i><b>${sep}</b> × Dunkel</li>` : ''}</ul></div>`;
}
const pkStk = (f, k, on) => `<button class="pk-stk${on ? ' on' : ''}" data-act="pkFr" data-arg="${k}" aria-pressed="${!!on}" aria-label="Armband von ${esc(f.n)}"><b>${esc(f.n)}</b>${pkBand([...f.n], Object.assign(pkLookOf(k), { anon: true, mini: true }))}</button>`;
function pkFreundeView() {
  const p = pkS(), F = p.friends, sel = F[UI.pkFr];
  const det = sel ? `<section class="pk-frdet"><div class="pk-frhead"><h3>Für ${esc(sel.n)}</h3><button class="pk-close" data-act="pkFr" data-arg="-1" aria-label="Schließen">${ico('undo', 18)}</button></div>
    <div class="pk-armwrap">${pkBand([...sel.n], pkLookOf(UI.pkFr))}</div>${pkLookHtml(String(UI.pkFr))}${pkBeadPlan(sel)}
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
  <section class="pk-print"><div class="pk-sgrid">${F.map((f, k) => `<div class="pk-psticker">${pkBand([...f.n], pkLookOf(k))}</div>`).join('')}</div>
  <div class="pk-decoder">${[...PK_ABC].map((ch, k) => `<span><b>${ch}</b>${k + 1}</span>`).join('')}</div></section>`;
}

/* ---------- Übersicht ---------- */
/* Die eine Karte oben: der nächste Schritt (Entdeckung oder Übung) – statt eines großen Titelbilds */
function pkHeroArt() {
  const card = (v, up) => `<span class="pk-hcard${up ? '' : ' down'}" style="${pkCol(v)}"><span class="pk-dots" data-v="${v}">${up ? '<i></i>'.repeat(v) : ''}</span></span>`;
  return `<div class="pk-hart"><div class="pk-hfig">${pkBotSvg('blinki', pkDoneN() ? 'happy' : 'idle')}</div><div class="pk-hcards">${card(4, 1)}${card(2, 0)}${card(1, 1)}</div><div class="pk-hcode" aria-hidden="true">${pkPill(4, 1)}${pkPill(2, '0').replace('pk-pill', 'pk-pill off')}${pkPill(1, 1)}<span>= 5</span></div></div>`;
}
/* Ein ruhiges Band mit kleinen Symbolen (wie Segmente): Fortschritt · Sterne · Armband · Wort · Freunde · Ton */
function pkRibbon() {
  const p = pkS(), n = pkDoneN(), on = p.snd, sh = UI.pkShow, D = pkDes(p.armD);
  const beadIc = (pat, colOf) => `<svg viewBox="0 0 34 14" width="38" height="16" aria-hidden="true"><path d="M1 5Q17 15 33 5" stroke="currentColor" stroke-width="1.4" fill="none" opacity=".45"/>${pat.map((b, k) => { const x = 4 + k * 6.5, y = 5 + 5 * (1 - Math.pow((x - 17) / 16, 2)); return `<circle cx="${x}" cy="${y.toFixed(1)}" r="2.8" fill="${b ? colOf(k) : '#fff'}" stroke="${b ? 'none' : '#c9c2b6'}"/>`; }).join('')}</svg>`;
  const myCol = k => { const f = D.on([16, 8, 4, 2, 1][k], 0, p.armC)[0]; return f === 'G' ? D.g[1] : f; };
  const ring = `<svg viewBox="0 0 36 36" width="22" height="22" aria-hidden="true"><circle cx="18" cy="18" r="14" fill="none" stroke="var(--dz-line)" stroke-width="5"/><circle cx="18" cy="18" r="14" fill="none" stroke="var(--dz-accent)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(n / PK_MAX * 87.96).toFixed(1)} 88" transform="rotate(-90 18 18)"/></svg>`;
  const seg = (k, ic, val, lbl, aria) => `<button type="button" class="pk-seg${sh === k ? ' on' : ''}" data-act="pkShow" data-arg="${k}" aria-expanded="${sh === k}" aria-label="${aria}"><span class="pk-segtop">${ic}${val != null ? `<b>${val}</b>` : ''}</span><small>${lbl}</small></button>`;
  const segs = [`<div class="pk-seg pk-segring" role="img" aria-label="${n} von ${PK_MAX} entdeckt"><span class="pk-segtop">${ring}<b>${n}/${PK_MAX}</b></span><small>entdeckt</small></div>`,
    seg('stars', '<span class="pk-segst" aria-hidden="true">✦</span>', p.stars, 'Leuchtsterne', `${p.stars} Leuchtsterne`)].concat(typeof pktSegs === 'function' ? pktSegs(seg) : []);
  if (p.arm.length) segs.push(seg('arm', beadIc([0, 1, 1, 0, 1], myCol), null, 'Armband', 'Dein Armband'));
  if (p.word.length) segs.push(seg('word', `<span class="pk-icg" aria-hidden="true">${esc(p.word[0])}<i>${p.word[0].charCodeAt(0)}</i></span>`, null, 'Wort', 'Dein Computer-Wort'));
  if (pkFrOpen()) segs.push(`<button type="button" class="pk-seg" data-act="pkFreunde" aria-label="Freundes-Armbänder${p.friends.length ? ': ' + p.friends.length : ''}"><span class="pk-segtop">${beadIc([1, 0, 1, 1, 0], () => PK_HEX[4])}${p.friends.length ? `<b>${p.friends.length}</b>` : ''}</span><small>Freunde</small></button>`);
  segs.push(`<button type="button" class="pk-seg pk-segsnd${on ? '' : ' off'}" data-act="pkSnd" aria-pressed="${on}" aria-label="${on ? 'Kartentöne ausschalten' : 'Kartentöne einschalten'}"><span class="pk-segtop">${ico(on ? 'speaker' : 'speakerOff', 22)}</span><small>${on ? 'Ton an' : 'Ton aus'}</small></button>`);
  return `<div class="pk-ribwrap"><div class="pk-ribbon" role="toolbar" aria-label="Dein Stand">${segs.join('')}</div>${pkPopHtml()}</div>`;
}
function pkPopHtml() {
  const p = pkS(), k = UI.pkShow; let h = '';
  if (k === 'stars') {
    const list = PK_DES.filter(x => x.stars).map(x => [x.stars, `<span class="pk-lksw" aria-hidden="true">${x.sw.map(c => `<i style="background:${c}"></i>`).join('')}</span>`, x.n]).concat(PK_CHARMS.filter(x => x.stars).map(x => [x.stars, `<span class="pk-lke" aria-hidden="true">${x.e}</span>`, x.n])).sort((a, b) => a[0] - b[0]);
    h = `<span class="pk-eyebrow">✦ ${p.stars} Leuchtsterne</span><p class="pk-popp">Leuchtsterne gibt es für <b>perfekte Züge</b> und für Rätsel-Ziele. Damit schaltest du Armband-Sachen frei.</p><div class="pk-unl">${list.map(x => `<span class="${p.stars >= x[0] ? 'ok' : ''}">${x[1]}<b>${x[2]}</b><small>${p.stars >= x[0] ? ico('check', 14) : '✦ ' + x[0]}</small></span>`).join('')}</div>`;
  }
  if (k === 'arm' && p.arm.length) h = `<span class="pk-eyebrow">Dein Licht-Armband</span><div class="pk-armwrap">${pkBand(p.arm, pkMyLook())}</div>${pkLookHtml('me')}`;
  if (k === 'word' && p.word.length) h = `<span class="pk-eyebrow">Dein Computer-Wort</span>${pkWordHtml(p.word)}`;
  if (!h && typeof pktPop === 'function') h = pktPop(k);
  const an = UI.pkPopAnim; UI.pkPopAnim = false;
  return h ? `<div class="pk-popv${an ? ' anim' : ''}" role="dialog" aria-label="Details"><button type="button" class="pk-popx" data-act="pkShow" data-arg="${k}" aria-label="Schließen">✕</button>${h}</div>` : '';
}
function pkRaetselW() {
  if (!pkTagOpen()) return '';
  const p = pkS(), td = +p.tag.days[ymd()] || 0, tot = p.tag.total;
  return `<button type="button" class="pk-rw" data-act="pkLv" data-arg="tag" aria-label="Blinkis Rätsel: heute ${td}, insgesamt ${tot}"><span class="pk-rwic" aria-hidden="true">🧩</span><span class="pk-rwt"><b>Blinkis Rätsel</b><small>Heute ${td} · Gesamt ${tot} · Ziel ${pkNextMile(tot)}</small></span>${pkWeekHtml(true)}<span class="pk-lvr go">Los</span></button>`;
}
function pkHub() {
  const p = pkS(), nx = pkNextLv(), all = pkDoneN() === PK_MAX, open = p.les === undefined ? !all : !!p.les;
  const list = PK_LV.map((L, k) => {
    const d = p.done[L.id], op = pkOpen(L.id);
    return `<button class="pk-lv${d ? ' done' : op ? ' cur' : ' lock'}" data-act="pkLv" data-arg="${L.id}" ${op ? '' : 'disabled'} aria-label="Entdeckung ${k + 1}: ${esc(L.t)}${d ? ', geschafft' : op ? '' : ', noch zu'}">
      <span class="pk-lvn">${d ? ico('check', 18) : op ? k + 1 : ico('lock', 16)}</span><span class="pk-lvt"><b>${esc(L.t)}</b><small>${esc(L.s)}</small></span>${d ? '<span class="pk-lvr">Nochmal</span>' : op ? '<span class="pk-lvr go">Los</span>' : ''}</button>`;
  }).join('');
  const rec = all && typeof pktRecommend === 'function' && pktOn() ? pktRecommend() : null;
  const heroBtn = rec ? `<button class="btn big" data-act="pkTr" data-arg="${rec.m}|${rec.l}">Weiter üben</button>` : `<button class="btn big" data-act="pkLv" data-arg="${nx}">${all ? 'Noch einmal entdecken' : pkDoneN() ? 'Weiter entdecken' : 'Los geht’s'}</button>`;
  return topBar('Blinkis Punktkarten', 'rewards') + `<section class="pk-hub">
    <div class="pk-hero"><div class="pk-hero-copy"><span class="pk-eyebrow">Punkte · Karten · Geheimcodes</span><h1>Zählen wie ein Computer</h1><p>Dreh Karten um, finde Zahlen und entdecke den Code aus 0 und 1.</p>
      ${heroBtn}</div>${pkHeroArt()}</div>
    ${pkRibbon()}
    ${pkRaetselW()}
    ${typeof pktHub === 'function' ? pktHub() : ''}
    <button type="button" class="pk-acc${open ? ' open' : ''}" data-act="pkLes" aria-expanded="${open}" aria-controls="pkLes"><span class="pk-acct">Deine Entdeckungsreise</span><span class="pk-accn">${all ? ico('check', 14) + ' ' : ''}${pkDoneN()}/${PK_MAX}</span><svg class="pk-accv" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
    <div class="pk-lvs" id="pkLes"${open ? '' : ' hidden'}>${list}</div>
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
  const rows = PK_LV.map((L, k) => `<button type="button" class="tag pk-ptag${p.done[L.id] ? ' on' : ''}" data-act="pkLv" data-arg="${L.id}" ${pkOpen(L.id) ? '' : 'disabled'} title="${esc(L.t)}" aria-label="${esc(L.t)} ${P('starten', 'start')}">${k + 1}${p.done[L.id] ? ' ✓' : ''}</button>`).join(' ');
  const free = typeof ptSw === 'function' ? ptSw(!!p.free, 'pkFreeT', null, P('Freie Wahl', 'Free choice')) : `<button class="btn sm sec" data-act="pkFreeT">${p.free ? 'AN' : 'AUS'}</button>`;
  const trs = typeof PKT_MODES !== 'undefined' && pktOn() ? PKT_MODES.map(M => `<span class="pk-ptr"><i aria-hidden="true">${M.ic}</i>${[1, 2, 3].map(l => `<button type="button" class="tag pk-ptag" data-act="pkTr" data-arg="${M.id}|${l}" ${pktOpen(M.id, l) ? '' : 'disabled'} aria-label="${esc(M.n)} Level ${l} ${P('starten', 'start')}">${l}</button>`).join('')}</span>`).join('') : '';
  return `<div class="card noprint pk-parent"><h3>${P('Blinkis Punktkarten: Stand', 'Blinki’s dot cards: progress')}</h3>
    <p class="small mute" style="margin:0 0 6px">${P('Binärzahlen mit Punktkarten (CS Unplugged „Count the Dots“), Gedankenlese-Trick (cs4fn), Stellenwert-Vergleich, Bestell-Codes, Buchstaben-Armband, Karten bis 64 und ASCII (A = 65). Rätsel, so viele das Kind mag – gezählt werden nur Erfolge. Leuchtsterne für perfekte Züge schalten Armband-Muster und Anhänger frei; einige gibt es auch im Shop.', 'Binary numbers with dot cards (CS Unplugged “Count the Dots”), a mind-reading trick (cs4fn), place-value comparison, order codes, a letter bracelet, cards up to 64 and ASCII (A = 65). As many puzzles as your child likes – only successes are counted. Stars for perfect moves unlock bracelet patterns and charms; some are also in the shop.')}</p>
    <div class="cfg"><div><b>${P('Freie Wahl: alles offen', 'Free choice: everything open')}</b><br><span class="small mute">${P('Jede Entdeckung, Rätsel, Freunde und alle Trainings-Level sind sofort spielbar – z. B. gleich mit Entdeckung 13 anfangen. Nichts wird als geschafft gezählt; Fortschritt bleibt erhalten.', 'Every discovery, puzzles, friends and all practice levels are playable right away – e.g. start with discovery 13. Nothing is counted as done; progress is kept.')}${ADMIN ? ' ' + P('(Im Admin-Modus immer an.)', '(Always on in admin mode.)') : ''}</span></div><div class="row">${free}</div></div>
    <div class="cfg"><div><b>${P('Entdeckungen', 'Discoveries')}</b><br><span class="small mute">${pkDoneN()} ${P('von', 'of')} ${PK_MAX} · ${P('Nummer antippen = direkt starten', 'tap a number to start it')}</span></div><div class="row wrap" style="gap:4px">${rows}</div></div>
    ${trs ? `<div class="cfg"><div><b>${P('Trainingslager direkt starten', 'Start practice directly')}</b><br><span class="small mute">${P('Übung und Level antippen', 'tap exercise and level')}</span></div><div class="row wrap pk-ptrs">${trs}</div></div>` : ''}
    <div class="cfg"><div><b>${P('Zaubertrick', 'Magic trick')}</b><br><span class="small mute">${p.trick.guess}× ${P('erraten', 'guessed')} · ${p.trick.show}× ${P('selbst vorgeführt', 'performed by your child')}</span></div></div>
    <div class="cfg"><div><b>${P('Blinkis Rätsel', 'Blinki’s puzzles')}</b><br><span class="small mute">${p.tag.total} ${P('gelöst', 'solved')} · ${P('heute', 'today')} ${+p.tag.days[ymd()] || 0}</span></div>${pkWeekHtml()}</div>
    <div class="cfg"><div><b>${P('Leuchtsterne', 'Light stars')}</b><br><span class="small mute">✦ ${p.stars} · ${P('für perfekte Züge (getrennt von den ⭐ der App)', 'for perfect moves (separate from the app’s ⭐)')}</span></div></div>
    ${p.arm.length ? `<div class="cfg"><div><b>${P('Armband', 'Bracelet')}</b><br><span class="small mute">${esc(p.arm.join(''))}</span></div></div>` : ''}
    ${p.friends.length ? `<div class="cfg"><div><b>${P('Freundes-Armbänder', 'Friends’ bracelets')}</b><br><span class="small mute">${p.friends.length}: ${esc(p.friends.map(f => f.n).join(', '))}</span></div></div>` : ''}
    ${p.word.length ? `<div class="cfg"><div><b>${P('Computer-Wort (ASCII)', 'Computer word (ASCII)')}</b><br><span class="small mute">${esc(p.word.join(''))}</span></div></div>` : ''}
    ${typeof pktParent === 'function' ? pktParent() : ''}
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
  check: () => { pkS(); pkStarUnlocks(); },
  acts: {
    punkte: () => go('punkte'),
    pkLv: n => pkStart(n),
    pkDruck: () => go('pkDruck'),
    pkFreeT: () => { const p = pkS(); p.free = !p.free; save(); render(); },
    pkShow: k => { UI.pkShow = UI.pkShow === k ? null : k; UI.pkPopAnim = !!UI.pkShow; render(); },
    pkFreunde: () => { if (pkFrOpen()) go('pkFreunde', { pkFr: -1, pkDel: false }); },
    pkFr: k => { k = +k; UI.pkFr = UI.pkFr === k ? -1 : k; UI.pkDel = false; render(); },
    pkFrDel: a => { const p = pkS(); if (a === 'ask') UI.pkDel = true; else if (a === 'no') UI.pkDel = false; else if (a === 'yes' && p.friends[UI.pkFr]) { p.friends.splice(UI.pkFr, 1); save(); UI.pkFr = -1; UI.pkDel = false; } render(); },
    pkFrDruck: () => go('pkFrDruck'),
    pkSnd: () => { const p = pkS(); p.snd = !p.snd; save(); if (p.snd) pkBi(1); render(); },
    pkLook: a => {
      const [tg, d] = String(a).split('|'), id = 'pkd.' + d, it = CATALOG[id]; if (!it) return;
      if (!hasItem(id)) { if (it.src.t === 'shop') shopAt(id); else toast('✦', `Noch ${Math.max(1, it.stars - pkS().stars)} Leuchtsterne bis <b>${esc(it.name)}</b>`); return; }
      pkSetLook(tg, { d });
    },
    pkCharm: a => {
      const [tg, c] = String(a).split('|');
      if (c && c.startsWith('fg.')) { if (!hasItem(c)) return; }
      else if (c) { const id = 'pkc.' + c, it = CATALOG[id]; if (!it) return; if (!hasItem(id)) { if (it.src.t === 'shop') shopAt(id); else toast('✦', `Noch ${Math.max(1, it.stars - pkS().stars)} Leuchtsterne bis <b>${esc(it.name)}</b>`); return; } }
      pkSetLook(tg, { ch: c || '' });
    },
    pkCol: a => { const [tg, v] = String(a).split('|'); if (PK_HEX[+v]) pkSetLook(tg, { col: +v }); }
  }
});
AFTER.pkLevel = () => pkMount();
