/* =====================================================================
   BELOHNUNGS-MOMENTE: was das Kind sieht, wenn es etwas verdient
   - Münze 🪙: Münzen fliegen in einen kleinen Beutel (oben rechts, beim Münz-Zähler). Kein Fenster, nichts zum Wegklicken.
   - Karte 🃏: eine kurze Einblendung unten („Neue Karte!“), ohne Konfetti. Verschwindet von selbst.
   - Pokal 🏆: Feier (Konfetti + Strahlen) und ein Fenster mit dem Pokal. Mehrere neue Pokale auf einmal = ein Fenster.
   Aufgerufen aus store.js: giveCoins() → rwCoin(n), giveChest() → rwCard(), checkTrophies() → rwTrophy(t).
   Fenster warten, bis nichts anderes offen ist (kein Mini-Test, kein anderes Fenster, kein Abflug in der Weltreise).
   „Ruhige Darstellung“ (S.cfg.calm) und „Bewegung reduzieren“ des Geräts: keine fliegenden Münzen, kein Konfetti – die Hinweise bleiben.
   ===================================================================== */
const RW = { coins: 0, acc: 0, cross: false, coinT: null, bagT: null, q: [], wait: null, noteT: null };
const RW_BAG = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M23 9h18l-3.5 9h-11Z" fill="#c9a86a" stroke="#6b5434" stroke-width="2.4" stroke-linejoin="round"/><path d="M26.5 18C14 24 9 35 9 43c0 9 9 14 23 14s23-5 23-14c0-8-5-19-17.5-25Z" fill="#d9b878" stroke="#6b5434" stroke-width="2.4" stroke-linejoin="round"/><path d="M24 18.5h16" stroke="#6b5434" stroke-width="3.2" stroke-linecap="round"/><circle cx="32" cy="40" r="8" fill="#f2cf5b" stroke="#a87b12" stroke-width="2.2"/><path d="M29 40h6" stroke="#a87b12" stroke-width="2" stroke-linecap="round"/></svg>';
const RW_COIN = '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#f2cf5b" stroke="#a87b12" stroke-width="2.4"/><circle cx="14" cy="14" r="7.5" fill="none" stroke="#c99a2e" stroke-width="1.6"/><path d="M11 14h6" stroke="#a87b12" stroke-width="2" stroke-linecap="round"/></svg>';
const RW_BIG_IDS = new Set(['blk1', 'deck1', 'deck5', 'perf5', 'perf15', 'q100', 'q500', 'q1000', 'st3', 'st7', 'st14', 'st30', 'c400', 'c800', 's100', 'test1', 'test13', 'test15', 'gold', 'dia', 'shop1', 'shop12', 'card30', 'cardall', 'card250', 'stp10', 'fix30', 'ins10', 'owl', 'early', 'wknd', 'comeb', 'mara', 'blitz']);
const RW_BIG = { has: id => RW_BIG_IDS.has(id) || /_[md]$/.test(String(id || '')) };   // Konfetti + Fenster: Meilensteine, geheime Pokale, Meister/Diamant je Heft; der Rest bekommt nur einen kleinen Hinweis
const rwCalm = () => !!(S.cfg && S.cfg.calm) || !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---------- Münzen: in den Beutel ---------- */
function rwCoin(n) {
  if (!(n > 0)) return; RW.coins += n; RW.acc += n;
  if (Math.floor((S.life || 0) / 10) > Math.floor(((S.life || 0) - n) / 10)) RW.cross = true;          // jede 10. Münze (insgesamt verdient) bekommt die Beutel-Animation
  clearTimeout(RW.coinT); RW.coinT = setTimeout(rwCoinFly, 90);
}
/* sonst nur ein leiser Puls am Münz-Zähler */
function rwCoinPulse() {
  const chip = Array.from(document.querySelectorAll('.top .chip.cb, .dz-wallet [data-act=shop]')).find(e => e.getBoundingClientRect().width > 0);
  if (!chip || rwCalm()) return; chip.classList.remove('rw-pulse'); void chip.offsetWidth; chip.classList.add('rw-pulse');
}
function rwCoinFly() {
  const batch = RW.coins; RW.coins = 0; if (!batch || document.hidden) return;
  if (!RW.cross) { rwCoinPulse(); return; }
  const n = RW.acc; RW.acc = 0; RW.cross = false;
  let bag = document.getElementById('rwBag');
  if (!bag) { bag = document.createElement('div'); bag.id = 'rwBag'; bag.className = 'rw-bag'; bag.setAttribute('role', 'status'); bag.innerHTML = `${RW_BAG}<b class="rw-bag-n"></b>`; document.body.appendChild(bag); }
  bag.querySelector('.rw-bag-n').textContent = '+' + n;
  bag.setAttribute('aria-label', `${n} ${n === 1 ? 'Münze' : 'Münzen'} in deinen Beutel`);
  const chip = Array.from(document.querySelectorAll('.top .chip.cb, .dz-wallet [data-act=shop]')).find(e => e.getBoundingClientRect().width > 0);
  if (chip) { const c = chip.getBoundingClientRect(); bag.style.left = Math.max(8, Math.min(innerWidth - 72, c.left + c.width / 2 - 32)) + 'px'; bag.style.top = (c.bottom + 6) + 'px'; bag.style.right = 'auto'; }
  else { const a = (document.getElementById('app') || document.body).getBoundingClientRect(); bag.style.left = Math.max(8, Math.min(innerWidth - 72, a.right - 72)) + 'px'; bag.style.right = 'auto'; bag.style.top = '70px'; }   // ohne Münz-Zähler: oben rechts im Inhalt
  bag.classList.remove('out'); bag.classList.add('in');
  const calm = rwCalm(), k = calm ? 0 : Math.min(6, Math.max(1, Math.ceil(n / 2)));
  const src = document.querySelector('.qcard') || document.querySelector('#app .card.result') || document.querySelector('#app .geo-card');
  const r = src ? src.getBoundingClientRect() : { left: innerWidth / 2 - 40, top: innerHeight / 2 - 40, width: 80, height: 80 };
  const b = bag.getBoundingClientRect();
  for (let i = 0; i < k; i++) {
    const c = document.createElement('div'); c.className = 'rw-coin'; c.innerHTML = RW_COIN;
    const x0 = r.left + r.width / 2 - 14 + (i - (k - 1) / 2) * 18, y0 = r.top + Math.min(r.height / 2, 90), x1 = b.left + b.width / 2 - 14, y1 = b.top + 18;
    c.style.left = x0 + 'px'; c.style.top = y0 + 'px'; document.body.appendChild(c);
    if (typeof c.animate !== 'function') { c.remove(); continue; }
    const a = c.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${(x1 - x0) * .45}px,${(y1 - y0) * .45 - 70}px) scale(1.15) rotate(180deg)`, opacity: 1, offset: .5 },
      { transform: `translate(${x1 - x0}px,${y1 - y0}px) scale(.45) rotate(360deg)`, opacity: .9 }
    ], { duration: 720, delay: i * 95, easing: 'cubic-bezier(.45,0,.6,1)', fill: 'forwards' });
    a.onfinish = () => { c.remove(); bag.classList.remove('gulp'); void bag.offsetWidth; bag.classList.add('gulp'); if (i === k - 1) sfx('pop'); };
  }
  clearTimeout(RW.bagT); RW.bagT = setTimeout(() => { bag.classList.remove('in'); bag.classList.add('out'); }, calm ? 1400 : 720 + k * 95 + 1100);
}

/* ---------- Karten und Pokale: Warteschlange ---------- */
function rwCard() { RW.q.push({ k: 'card' }); rwSoon(); }
function rwTrophy(t) { RW.q.push({ k: 'tro', t }); rwSoon(); }
function rwSoon() { clearTimeout(RW.wait); RW.wait = setTimeout(rwNext, 60); }        // alles aus einem Moment zusammen zeigen (mehrere Pokale = ein Fenster)
const rwReady = () => !document.hidden && !document.getElementById('modal') && !document.getElementById('rwPop') && !document.getElementById('nzOv') && !document.querySelector('.w-flight') && view !== 'test' && !UI.rwOff && !window.__rwOff;     // __rwOff: nur für automatische Tests
function rwNext() {
  clearTimeout(RW.wait);
  if (!RW.q.length) return;
  if (!rwReady()) { RW.wait = setTimeout(rwNext, 700); return; }
  const tro = RW.q.filter(x => x.k === 'tro'), cards = RW.q.filter(x => x.k === 'card').length;
  RW.q = [];
  const big = tro.filter(x => RW_BIG.has(x.t.id)), small = tro.filter(x => !RW_BIG.has(x.t.id));
  if (big.length) rwTrophyPop(big.map(x => x.t));                                  // große Feier nur für besondere Pokale
  if (small.length) rwNote({ ic: dzIc('trophy', 30), t: small.length === 1 ? `Neuer Pokal: ${small[0].t.n}` : `${small.length} neue Pokale!`, s: 'Du findest sie bei „Meine Pokale“.', go: 'trophies' });
  else if (cards) rwCardNote(cards);                                               // zwei Hinweise gleichzeitig wären zu viel: der Pokal-Hinweis gewinnt
  if (big.length && cards) setTimeout(() => rwCardNote(cards), 400);
}
/* Karte: nur eine Einblendung, kein Konfetti */
function rwCardNote(n) { rwNote({ ic: dzIc('cards', 30), t: n === 1 ? 'Neue Karte!' : n + ' neue Karten!', s: (n === 1 ? 'Sie wartet' : 'Sie warten') + ' bei den Lustigen Karten.', go: 'schatz' }); }
function rwNote(o) {
  let el = document.getElementById('rwNote');
  if (!el) { el = document.createElement('div'); el.id = 'rwNote'; el.className = 'rw-note'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
  el.dataset.go = o.go;
  el.innerHTML = `<span class="rw-note-ic">${o.ic}</span><span class="rw-note-t"><b>${esc(o.t)}</b><small>${esc(o.s)}</small></span><button class="btn sm sec" data-act="rwNoteGo">Ansehen</button><button class="rw-x" data-act="rwNoteClose" aria-label="Hinweis schließen">✕</button>`;
  el.classList.remove('out'); void el.offsetWidth; el.classList.add('in');
  clearTimeout(RW.noteT); RW.noteT = setTimeout(rwNoteClose, 5000);
}
function rwNoteClose() { const el = document.getElementById('rwNote'); if (el) { el.classList.remove('in'); el.classList.add('out'); setTimeout(() => { if (el.classList.contains('out')) el.remove(); }, 400); } }
/* Pokal: Feier + Fenster */
function rwTrophyPop(list) {
  const t = list[0], many = list.length > 1;
  const m = document.createElement('div'); m.id = 'rwPop'; m.className = 'rw-pop'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', many ? `${list.length} neue Pokale` : `Neuer Pokal: ${t.n}`);
  m.innerHTML = `<div class="rw-pop-c"><div class="rw-rays" aria-hidden="true"></div><div class="rw-tro" aria-hidden="true">${esc(t.i)}</div>
    <small>${many ? list.length + ' neue Pokale!' : 'Neuer Pokal!'}</small><h2>${esc(t.n)}</h2><p>${esc(t.d || '')}</p>
    ${many ? `<ul class="rw-more">${list.slice(1, 6).map(x => `<li><span>${esc(x.i)}</span>${esc(x.n)}</li>`).join('')}${list.length > 6 ? `<li>… und ${list.length - 6} weitere</li>` : ''}</ul>` : ''}
    <div class="row wrap" style="justify-content:center"><button class="btn sec" data-act="rwPopGo">Alle Pokale</button><button class="btn" data-act="rwPopClose">Weiter</button></div></div>`;
  document.body.appendChild(m);
  const b = m.querySelector('[data-act=rwPopClose]'); if (b) b.focus();
  confetti(110); sfx('magic');
}
function rwPopClose() { const m = document.getElementById('rwPop'); if (m) m.remove(); setTimeout(rwNext, 250); }
Object.assign(ACT, {
  rwPopClose,
  rwPopGo: () => { rwPopClose(); go('trophies'); },
  rwNoteClose,
  rwNoteGo: () => { const el = document.getElementById('rwNote'), g = (el && el.dataset.go) || 'schatz'; rwNoteClose(); go(g); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('rwPop')) rwPopClose(); });
