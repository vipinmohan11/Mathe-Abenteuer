/* =====================================================================
   MEMORY (in Meine Welt): Paare finden mit Zeit nach Wahl, vier Stufen (4×4, 5×5, 6×6, 7×7) und wechselnden Themen
   (Länder, Mathe, Deutsch, Wissen aus „Lustige Karten“, oder Zufall). Keine Belohnung – nur Spaß; gespeichert wird
   die höchste freigeschaltete Stufe und der beste Zug-Rekord je Stufe: S.memory = { lvl, wins, best: { '1': Züge } }.
   Zeit: ganze Runde, startet beim ersten Aufdecken. Aus / 10 / 15 / 20 / 30 / 60 Sekunden; Vorgabe je nach Größe.
   Bei 5×5 und 7×7 liegt in der Mitte ein Joker-Stern (schon aufgedeckt).
   ===================================================================== */
const MM_SIZES = [{ n: 4, t: 15 }, { n: 5, t: 30 }, { n: 6, t: 60 }, { n: 7, t: 60 }];
const MM_TIMES = [0, 10, 15, 20, 30, 60];
const MM_THEMES = [['zufall', 'Zufall', '🎲'], ['laender', 'Länder', '🌍'], ['mathe', 'Mathe', '🔢'], ['deutsch', 'Deutsch', '✏️'], ['wissen', 'Wissen', '💡']];
const mmS = () => { const m = S.memory || (S.memory = {}); if (!(m.lvl >= 1)) m.lvl = 1; if (!(m.wins >= 0)) m.wins = 0; if (!m.best) m.best = {}; return m; };
const mmRnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const mmCnt = lvl => Math.floor(MM_SIZES[lvl - 1].n ** 2 / 2);
function mmSub() { const m = mmS(); return m.wins ? `Stufe ${m.lvl} von 4` : 'Paare finden'; }

/* ---------- Themen: jede Funktion liefert n Paare [{h, p}, {h, p}] (h = Anzeige, p = Klartext) ---------- */
const mmPlain = (a, b) => [{ h: esc(a), p: a }, { h: esc(b), p: b }];
function mmMathPairs(n) {
  const out = [], seenA = new Set(), seenQ = new Set();
  const put = (q, a) => { q = String(q); a = String(a); if (seenQ.has(q) || seenA.has(a) || q === a) return false; seenQ.add(q); seenA.add(a); out.push(mmPlain(q, a)); return true; };
  const UNITS = [['1 m', '100 cm'], ['1 kg', '1000 g'], ['1 h', '60 min'], ['1 km', '1000 m'], ['1 l', '1000 ml'], ['1 €', '100 ct'], ['½', '0,5'], ['¼', '0,25'], ['¾', '0,75'], ['1 min', '60 s']];
  shuffle(UNITS).slice(0, Math.max(2, Math.round(n / 5))).forEach(u => put(u[0], u[1]));
  let guard = 0;
  while (out.length < n && guard++ < 600) {
    const t = mmRnd(0, 5), a = mmRnd(2, 10), b = mmRnd(2, 10);
    if (t === 0) put(`${a} × ${b}`, a * b);
    else if (t === 1) put(`${a * b} : ${b}`, a);
    else if (t === 2) { const x = mmRnd(12, 98) * 10, y = mmRnd(11, 90) * 10; put(`${x} + ${y}`, x + y); }
    else if (t === 3) { const x = mmRnd(30, 99) * 10, y = mmRnd(11, 29) * 10; put(`${x} − ${y}`, x - y); }
    else if (t === 4) { const x = mmRnd(12, 49); put(`Doppeltes von ${x}`, x * 2); }
    else { const x = mmRnd(12, 49); put(`Hälfte von ${x * 2}`, x); }
  }
  return shuffle(out).slice(0, n);
}
const MM_DE = [
  ['groß', 'klein'], ['heiß', 'kalt'], ['hell', 'dunkel'], ['alt', 'jung'], ['laut', 'leise'], ['schnell', 'langsam'], ['dick', 'dünn'], ['nass', 'trocken'], ['leicht', 'schwer'], ['früh', 'spät'], ['hart', 'weich'], ['arm', 'reich'], ['stark', 'schwach'], ['oben', 'unten'], ['billig', 'teuer'],
  ['Kind', 'Kinder'], ['Haus', 'Häuser'], ['Baum', 'Bäume'], ['Buch', 'Bücher'], ['Maus', 'Mäuse'], ['Fuß', 'Füße'], ['Apfel', 'Äpfel'], ['Dach', 'Dächer'], ['Vogel', 'Vögel'], ['Stuhl', 'Stühle'], ['Hand', 'Hände'], ['Wald', 'Wälder'], ['Zahn', 'Zähne'], ['Blatt', 'Blätter'],
  ['laufen', 'lief'], ['gehen', 'ging'], ['sehen', 'sah'], ['essen', 'aß'], ['trinken', 'trank'], ['schreiben', 'schrieb'], ['fahren', 'fuhr'], ['geben', 'gab'], ['nehmen', 'nahm'], ['finden', 'fand'], ['singen', 'sang'], ['schlafen', 'schlief'],
  ['Tisch', 'Fisch'], ['Hose', 'Rose'], ['Katze', 'Tatze'], ['Sonne + Blume', 'Sonnenblume'], ['Hand + Schuh', 'Handschuh'], ['Wasser + Ball', 'Wasserball'], ['Apfel + Baum', 'Apfelbaum'], ['Regen + Bogen', 'Regenbogen'], ['Haus + Tür', 'Haustür'], ['Schule + Tasche', 'Schultasche']
];
const MM_WISSEN = [   // aus „Lustige Karten“ (feat_fakten.js)
  ['Oktopus', '3 Herzen'], ['Giraffe', '7 Halswirbel'], ['Spinne', '8 Beine'], ['Insekt', '6 Beine'], ['Blauwal', 'größtes Tier'], ['Gepard', 'schnellstes Landtier'], ['Elefant', 'größtes Landtier'], ['Biene', '5 Augen'],
  ['Pazifik', 'größter Ozean'], ['Mount Everest', 'höchster Berg'], ['Sahara', 'größte heiße Wüste'], ['Antarktis', 'kältester Kontinent'], ['Jupiter', 'größter Planet'], ['Merkur', 'kleinster Planet'], ['Sonnensystem', '8 Planeten'],
  ['Mars', 'roter Planet'], ['Gagarin', 'erster im Weltraum'], ['Armstrong', 'erster auf dem Mond'], ['Haut', 'größtes Organ'], ['Steigbügel', 'kleinster Knochen'], ['Oberschenkel', 'längster Knochen'], ['Zähne (Erwachsene)', '32'],
  ['Knochen (Erwachsene)', '206'], ['Dreieck', '180° Winkelsumme'], ['Würfel', '12 Kanten'], ['Schachbrett', '64 Felder'], ['Milliarde', '9 Nullen'], ['Russland', 'größtes Land'], ['Vatikan', 'kleinster Staat'], ['Baikalsee', 'tiefster See'],
  ['Kilimandscharo', 'höchster Berg Afrikas'], ['Ein Tag', '86 400 Sekunden'], ['Kaiserpinguin', 'Papa wärmt das Ei'], ['Seepferdchen', 'Papa trägt die Eier'], ['Schnabeltier', 'Säugetier, legt Eier'], ['Seestern', 'kein Gehirn'],
  ['Eisbär', 'schwarze Haut'], ['Schmetterling', 'schmeckt mit den Füßen'], ['Kolibri', 'fliegt rückwärts'], ['Venus', 'Tag länger als Jahr'], ['Saturn', 'Ringe aus Eis und Gestein'], ['Island', 'Eis und Vulkane']
];
function mmLaenderPairs(n) {
  return shuffle(gList('europa').filter(c => c.name !== c.cap)).slice(0, n).map(c => [{ h: flagSVG(c.id, 'mm-flag') + '<b>' + esc(c.name) + '</b>', p: c.name }, { h: esc(c.cap), p: c.cap }]);
}
function mmListPairs(list, n) {
  const used = new Set(), out = [];
  shuffle(list).forEach(([a, b]) => { if (out.length >= n || used.has(a) || used.has(b)) return; used.add(a); used.add(b); out.push(mmPlain(a, b)); });
  return out;
}
function mmBuild(theme, lvl) {
  const n = mmCnt(lvl), pick = theme === 'zufall' ? ['laender', 'mathe', 'deutsch', 'wissen'][mmRnd(0, 3)] : theme;
  const pairs = pick === 'laender' ? mmLaenderPairs(n) : pick === 'mathe' ? mmMathPairs(n) : pick === 'deutsch' ? mmListPairs(MM_DE, n) : mmListPairs(MM_WISSEN, n);
  return { theme: pick, pairs };
}
function mmNew(lvl, tm, theme) {
  const N = MM_SIZES[lvl - 1].n, b = mmBuild(theme, lvl), cards = [];
  b.pairs.forEach((pr, k) => { cards.push({ k, h: pr[0].h, p: pr[0].p, s: 0 }, { k, h: pr[1].h, p: pr[1].p, s: 1 }); });
  const sh = shuffle(cards);
  if (N % 2) sh.splice(Math.floor(N * N / 2), 0, { j: true, h: '⭐', p: 'Joker' });
  return { st: 'play', lvl, tm, theme: b.theme, cards: sh, open: [], done: {}, moves: 0, lock: false, started: false, end: 0, left: tm, pairs: b.pairs.length, found: 0, last: '' };
}
function mmStop() { if (UI.mmT) { clearInterval(UI.mmT); UI.mmT = null; } }
function mmTick() {
  const m = UI.mm;
  if (!m || m.st !== 'play' || view !== 'memory') { mmStop(); if (m && view !== 'memory') UI.mm = null; return; }
  m.left = Math.max(0, Math.ceil((m.end - Date.now()) / 1000));
  const el = document.getElementById('mmT'); if (el) el.textContent = fmtT(m.left);
  const bar = document.getElementById('mmBar'); if (bar) bar.style.width = Math.max(0, (m.end - Date.now()) / (m.tm * 10)) + '%';
  if (m.left <= 0) { mmStop(); m.st = 'lose'; m.lock = false; sfx('no'); render(); }
}
function mmWin() {
  const m = UI.mm, g = mmS(); mmStop(); m.st = 'win'; g.wins++;
  m.fresh = m.lvl === g.lvl && g.lvl < 4; if (m.fresh) g.lvl++;
  const k = String(m.lvl); m.record = !g.best[k] || m.moves < g.best[k]; if (m.record) g.best[k] = m.moves;
  save(); sfx('ok'); try { if (!rwCalm()) confetti(60); } catch (e) { }
}
function mmSetup() {
  const g = mmS(), u = UI.mmSet || (UI.mmSet = { lvl: g.lvl, theme: 'zufall', tm: null });
  if (u.lvl > g.lvl) u.lvl = g.lvl;
  const tm = u.tm == null ? MM_SIZES[u.lvl - 1].t : u.tm;
  const lv = MM_SIZES.map((z, i) => { const ok = i + 1 <= g.lvl, c = z.n * z.n;
    return `<button class="mm-lv${u.lvl === i + 1 ? ' on' : ''}${ok ? '' : ' lock'}" data-act="mmLvl" data-arg="${i + 1}" ${ok ? '' : 'disabled'} aria-pressed="${u.lvl === i + 1}"><b>${z.n} × ${z.n}</b><small>${ok ? c + ' Karten' : ico('lock', 14) + ' Noch zu'}</small></button>`; }).join('');
  const tms = MM_TIMES.map(t => `<button class="mm-chip${tm === t ? ' on' : ''}" data-act="mmTime" data-arg="${t}" aria-pressed="${tm === t}">${t ? t + ' s' : 'Aus'}</button>`).join('');
  const ths = MM_THEMES.map(t => `<button class="mm-chip${u.theme === t[0] ? ' on' : ''}" data-act="mmTheme" data-arg="${t[0]}" aria-pressed="${u.theme === t[0]}">${t[2]} ${t[1]}</button>`).join('');
  const best = g.best[String(u.lvl)];
  return topBar('Memory', 'rewards') + `<section class="card mm-setup"><h3>Stufe</h3><div class="mm-lvs">${lv}</div>
    <h3>Zeit</h3><div class="mm-chips">${tms}</div><p class="small mute">Die Zeit läuft für die ganze Runde und startet beim ersten Aufdecken.</p>
    <h3>Thema</h3><div class="mm-chips">${ths}</div>
    ${best ? `<p class="small mute">Dein Rekord in dieser Stufe: <b>${best}</b> Züge</p>` : ''}
    <div class="center" style="margin-top:12px"><button class="btn big" data-act="mmStart">Los geht’s</button></div></section>`;
}
VIEWS.memory = () => {
  const m = UI.mm;
  if (!m) return mmSetup();
  const N = MM_SIZES[m.lvl - 1].n, tn = (MM_THEMES.find(t => t[0] === m.theme) || [0, '', ''])[1];
  const head = topBar('Memory', 'rewards');
  const clock = m.tm ? `<div class="mm-clock"><b id="mmT">${fmtT(m.left)}</b><span class="mm-bar"><i id="mmBar" style="width:${Math.max(0, m.left / m.tm * 100)}%"></i></span></div>` : '<div class="mm-clock"><b>Ohne Zeit</b></div>';
  const info = `<div class="mm-info"><span>${(MM_THEMES.find(t => t[0] === m.theme) || [0, 0, ''])[2]} ${esc(tn)}</span><span>Paare <b>${m.found}</b> von ${m.pairs}</span><span>Züge <b>${m.moves}</b></span></div>`;
  const grid = `<div class="mm-grid n${N}" style="--n:${N}">${m.cards.map((c, i) => {
    if (c.j) return `<div class="mm-c joker up done" aria-label="Joker">⭐</div>`;
    const up = m.done[i] || m.open.includes(i) || m.st !== 'play' && m.done[i];
    return `<button class="mm-c${up ? ' up' : ''}${m.done[i] ? ' done' : ''}" data-act="mmFlip" data-arg="${i}" ${m.st !== 'play' ? 'disabled' : ''} aria-label="${up ? esc(c.p) : 'Karte ' + (i + 1)}">${up ? '<span class="mm-t">' + c.h + '</span>' : '?'}</button>`;
  }).join('')}</div>`;
  const last = m.last && m.st === 'play' ? `<p class="mm-last" aria-live="polite">✔ ${esc(m.last)}</p>` : '<p class="mm-last"></p>';
  let res = '';
  if (m.st === 'win') res = `<div class="card result mm-res"><h2>Geschafft in ${m.moves} Zügen!</h2><p>${m.record ? 'Neuer Rekord für diese Stufe! ' : ''}${m.fresh ? `Die nächste Stufe (${MM_SIZES[mmS().lvl - 1].n} × ${MM_SIZES[mmS().lvl - 1].n}) ist offen.` : ''}</p><div class="row wrap" style="justify-content:center"><button class="btn big" data-act="mmAgain">${m.fresh ? 'Nächste Stufe' : 'Nochmal'}</button><button class="btn sec" data-act="mmMenu">Auswahl</button></div></div>`;
  if (m.st === 'lose') res = `<div class="card result mm-res"><h2>Zeit ist um!</h2><p>Du hast ${m.found} von ${m.pairs} Paaren gefunden. Versuch es gleich nochmal – oder nimm mehr Zeit.</p><div class="row wrap" style="justify-content:center"><button class="btn big" data-act="mmAgain">Nochmal</button><button class="btn sec" data-act="mmMenu">Auswahl</button></div></div>`;
  return head + clock + info + last + grid + res + (m.st === 'play' ? `<div class="center" style="margin-top:12px"><button class="btn sec" data-act="mmMenu">Abbrechen</button></div>` : '');
};
registerFeature({
  id: 'memory', title: 'Memory', icon: 'sparkle', tint: 'sky', group: 'spiel', order: 80, view: 'memory',
  leave: () => { mmStop(); UI.mm = null; },
  acts: {
    memory: () => { mmStop(); UI.mm = null; go('memory'); },
    mmLvl: l => { const u = UI.mmSet; u.lvl = +l; if (!u.tmSet) u.tm = null; render(); },
    mmTime: t => { UI.mmSet.tm = +t; UI.mmSet.tmSet = true; render(); },
    mmTheme: t => { UI.mmSet.theme = t; render(); },
    mmStart: () => { const u = UI.mmSet, tm = u.tm == null ? MM_SIZES[u.lvl - 1].t : u.tm; mmStop(); UI.mm = mmNew(u.lvl, tm, u.theme); sfx('tap'); render(); },
    mmFlip: a => {
      const m = UI.mm, i = +a; if (!m || m.st !== 'play' || m.lock) return;
      const c = m.cards[i]; if (!c || c.j || m.done[i] || m.open.includes(i)) return;
      if (!m.started) { m.started = true; if (m.tm) { m.end = Date.now() + m.tm * 1000; UI.mmT = setInterval(mmTick, 250); } }
      sfx('tap'); m.open.push(i);
      if (m.open.length === 2) {
        m.moves++; const [x, y] = m.open;
        if (m.cards[x].k === m.cards[y].k) { m.done[x] = m.done[y] = 1; m.open = []; m.found++; m.last = m.cards[x].p + ' = ' + m.cards[y].p; sfx('ok'); if (m.found === m.pairs) mmWin(); }
        else { m.lock = true; render(); setTimeout(() => { m.open = []; m.lock = false; if (view === 'memory' && UI.mm === m && m.st === 'play') render(); }, 900); return; }
      }
      render();
    },
    mmAgain: () => { const m = UI.mm, g = mmS(), lvl = m.st === 'win' && m.fresh ? g.lvl : m.lvl; mmStop(); UI.mm = mmNew(lvl, m.tm && lvl !== m.lvl ? MM_SIZES[lvl - 1].t : m.tm, UI.mmSet ? UI.mmSet.theme : 'zufall'); render(); },
    mmMenu: () => { mmStop(); UI.mm = null; if (UI.mmSet) { UI.mmSet.lvl = Math.min(mmS().lvl, UI.mmSet.lvl); } render(); }
  }
});
