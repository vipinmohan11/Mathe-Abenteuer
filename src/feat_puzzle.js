/* =====================================================================
   RÄTSEL-GRUNDLAGEN für Sudoku (feat_sudoku.js) und Venola Holmes (feat_venola.js), beide in Meine Welt.
   Gemeinsam: Wochenschlüssel (neues Rätsel jeden Montag), Zufall mit Startwert, Stoppuhr + optionale Zeit (5/10/15 Min),
   3 freie Hinweise pro Tag und Spiel (Zahl nur bei noch 2 oder 1 sichtbar), Verlauf NUR gelöster Rätsel (nie gekürzt), Pokale, Geschenk-Meilensteine.
   Zustand: S.puz = { hist: [{ g, ts, lbl, secs, hints, wk, pk, fg }], hint: { day, sud, ven }, coin: { day, n },
                      sudWins, sudClean, sudWk, sud9, venWins, venClean, venWk, venCode, venCase, … }
   Nichts wird je abgezogen; „Zeit ist um“ lässt einfach ohne Zeit weiterspielen.
   ===================================================================== */
const PZ_HINTS = 3, PZ_TIMES = [0, 5, 10, 15], PZ_COIN_DAY = 3;
const pzS = () => {
  const p = S.puz || (S.puz = {});
  if (!Array.isArray(p.hist)) p.hist = [];
  if (!p.hint || typeof p.hint !== 'object') p.hint = {};
  ['sudWins', 'sudClean', 'sudWk', 'sud9', 'venWins', 'venClean', 'venWk', 'venCode', 'venCase', 'venL5'].forEach(k => { if (!(p[k] >= 0)) p[k] = 0; });
  return p;
};
/* Montag der laufenden Woche als Datum (Schlüssel für das Wochenrätsel) */
const pzWeek = (d = new Date()) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return ymd(x); };
const pzSeed = str => { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return h >>> 0; };
const pzRng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pzShuf = (a, rnd) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor((rnd || Math.random)() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pzMD = ts => { const d = new Date(+ts); return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear(); };

/* ---------- Hinweise: 3 pro Tag und Spiel ---------- */
const pzHintLeft = g => { const h = pzS().hint; if (h.day !== ymd()) { Object.keys(h).forEach(k => delete h[k]); h.day = ymd(); } return PZ_HINTS - (h[g] || 0); };
const pzHintUse = g => { if (pzHintLeft(g) <= 0) return false; pzS().hint[g] = (pzS().hint[g] || 0) + 1; save(); return true; };
const pzHintBtn = (act, g, extra) => { const l = pzHintLeft(g); return `<button class="btn sec pz-tool" data-act="${act}" ${l <= 0 ? 'disabled' : ''}>${ico('sparkle', 18)} ${l <= 0 ? 'Hinweise für heute weg' : l <= 2 ? `Hinweis (noch ${l})` : 'Hinweis'}</button>`; };

/* ---------- Uhr: Stoppuhr, optional rückwärts (Zeit nach Wahl). Kein Verlust bei Zeitablauf. ---------- */
const PzT = {
  el: m => Math.floor((m.el || 0) + (m.t0 ? (Date.now() - m.t0) / 1000 : 0)),
  start(m, vw, onUp) {
    PzT.stop(m); m.t0 = Date.now();
    m._i = setInterval(() => {
      if (view !== vw || m.st !== 'play') { PzT.stop(m); return; }
      PzT.paint(m);
      if (m.tm && !m.up && PzT.el(m) >= m.tm * 60) { m.up = true; if (onUp) onUp(); }
      if (PzT.el(m) % 10 === 0 && m.save) m.save();
    }, 1000);
  },
  stop(m) { if (!m) return; if (m._i) { clearInterval(m._i); m._i = null; } if (m.t0) { m.el = (m.el || 0) + (Date.now() - m.t0) / 1000; m.t0 = 0; } },
  paint(m) { const e = document.getElementById('pzT'); if (!e) return; const s = PzT.el(m); e.textContent = m.tm && !m.up ? fmtT(Math.max(0, m.tm * 60 - s)) : fmtT(s); const b = document.getElementById('pzBar'); if (b && m.tm && !m.up) b.style.width = Math.max(0, 100 - s / (m.tm * 6)) + '%'; }
};
const pzClock = m => `<div class="pz-clock"><b id="pzT">${m.tm && !m.up ? fmtT(Math.max(0, m.tm * 60 - PzT.el(m))) : fmtT(PzT.el(m))}</b>${m.tm && !m.up ? `<span class="pz-bar"><i id="pzBar" style="width:${Math.max(0, 100 - PzT.el(m) / (m.tm * 6))}%"></i></span>` : `<small>${m.tm ? 'ohne Zeit weiter' : 'Zeit läuft mit'}</small>`}</div>${m.up ? '<p class="pz-up">⏰ Die Zeit ist um. Spiel einfach weiter – du verlierst nichts.</p>' : ''}`;
const pzTimeChips = (act, cur) => `<div class="pz-chips">${PZ_TIMES.map(t => `<button class="pz-chip${cur === t ? ' on' : ''}" data-act="${act}" data-arg="${t}" aria-pressed="${cur === t}">${t ? t + ' Min' : 'Aus'}</button>`).join('')}</div>`;

/* ---------- Münzen: nur für die ersten 3 Siege pro Tag (kein Dauerverdienen) ---------- */
function pzCoins(n, why) {
  const p = pzS(); if (!p.coin || p.coin.day !== ymd()) p.coin = { day: ymd(), n: 0 };
  if (p.coin.n >= PZ_COIN_DAY || !n) return 0;
  p.coin.n++; giveCoins(n, why); return n;
}
/* ---------- Ein gelöstes Rätsel verbuchen: Zähler, Pokale, Sticker-Figuren, Verlauf. Gibt den Verlaufseintrag zurück. ---------- */
function pzFinish(g, lbl, secs, hints, o) {
  o = o || {};
  const p = pzS(), before = Object.keys(S.trophies || {}), fgB = Object.keys(S.unl || {}).filter(k => k.startsWith('fg.'));
  p[g + 'Wins']++; if (!hints) p[g + 'Clean']++; if (o.weekly) p[g + 'Wk']++;
  (o.inc || []).forEach(k => { p[k] = (p[k] || 0) + 1; });
  const e = { g, ts: Date.now(), lbl, secs: Math.round(secs), hints: hints || 0, wk: !!o.weekly, pk: [], fg: [] };
  p.hist.push(e);                                                  // der Verlauf wird nie gekürzt
  save(); checkTrophies();
  e.pk = Object.keys(S.trophies).filter(k => !before.includes(k));
  e.fg = Object.keys(S.unl || {}).filter(k => k.startsWith('fg.') && !fgB.includes(k));
  save(); return e;
}
const pzTrophyName = id => { const t = trophyList().find(x => x.id === id); return t ? t.n : ''; };
const pzTrophyIcon = id => { const t = trophyList().find(x => x.id === id); return t ? t.i : '🏆'; };
/* Verlauf: nur gelöste Rätsel (keine Zahl der Versuche) */
function pzHistory(g, title) {
  const L = pzS().hist.filter(e => e.g === g).slice().reverse();
  const rows = L.map(e => `<div class="pz-h"><span class="pz-hd">${pzMD(e.ts)}</span><b>${esc(e.lbl)}${e.wk ? ' · Woche' : ''}</b><span>${fmtT(e.secs)} min</span><span class="small mute">${e.hints ? e.hints + (e.hints === 1 ? ' Hinweis' : ' Hinweise') : 'ohne Hinweis'}</span><span class="pz-hp">${e.pk.map(id => `<i title="${esc(pzTrophyName(id))}">${pzTrophyIcon(id)}</i>`).join('') || '<small class="mute">–</small>'}</span></div>`).join('');
  return `<section class="card"><h3>${title}</h3><p class="small mute">${L.length} gelöst${L.length ? ' · schnellste Zeit ' + fmtT(Math.min(...L.map(e => e.secs))) + ' min' : ''}</p>${rows || '<p class="mute">Noch nichts gelöst. Das erste Rätsel kommt bald hier hin.</p>'}</section>`;
}
const pzResultExtras = e => `${e.pk.length ? `<p>${e.pk.map(id => `${pzTrophyIcon(id)} <b>${esc(pzTrophyName(id))}</b>`).join(' · ')}</p>` : ''}${e.fg.length ? `<p>Neuer Sticker: ${e.fg.map(id => CATALOG[id] ? `<span class="pz-fg"><svg viewBox="-55 -55 110 110">${CATALOG[id].svg}</svg></span><b>${esc(CATALOG[id].name)}</b>` : '').join(' ')}</p>` : ''}`;

/* ---------- Pokale ---------- */
function puzzleTrophies() {
  const T = (id, i, n, d, f, k) => ({ id, i, n, d, t: s => ((f(s.puz || {})) || 0) >= k });
  return [
    T('zs1', '🔢', 'Erstes Sudoku', '1 Sudoku gelöst', p => p.sudWins, 1),
    T('zs5', '🧮', 'Zahlen-Knobler', '5 Sudokus gelöst', p => p.sudWins, 5),
    T('zs25', '🧠', 'Sudoku-Profi', '25 Sudokus gelöst', p => p.sudWins, 25),
    T('zs9', '🏔️', 'Neuner-Gipfel', 'Ein 9 × 9-Sudoku gelöst', p => p.sud9, 1),
    T('zsc10', '🌟', 'Ganz allein', '10 Sudokus ohne Hinweis gelöst', p => p.sudClean, 10),
    T('zsw4', '📅', 'Wochenrätsel-Held', '4 Wochenrätsel gelöst', p => p.sudWk, 4),
    T('zv1', '🔍', 'Erster Fall', 'Einen Fall bei Venola Holmes gelöst', p => p.venWins, 1),
    T('zvc5', '🗝️', 'Aktenknacker', '5 Geheimakten gelöst', p => p.venCode, 5),
    T('zvs5', '👣', 'Spürnase', '5 Kriminalfälle gelöst', p => p.venCase, 5),
    T('zvw1', '🕵️', 'Meisterdetektiv', 'Einen Wochenfall gelöst', p => p.venWk, 1),
    T('zv25', '🏅', 'Detektiv-Profi', '25 Fälle gelöst', p => p.venWins, 25),
    T('zvc10', '🎩', 'Detektiv ohne Hilfe', '10 Fälle ohne Hinweis gelöst', p => p.venClean, 10),
    T('zvl5', '🧗', 'Ganz oben', 'Eine Akte auf Stufe 5 gelöst', p => p.venL5, 1),
    T('zvk', '🧳', 'Voller Koffer', 'Alle 12 Beweisstücke im Detektivkoffer', p => Object.keys(p.vnKof || {}).length, 12)
  ];
}
/* ---------- Überraschungsgeschenke: gelöste Rätsel zählen mit (feat_geschenk.js) ---------- */
if (typeof GIFT_MS !== 'undefined') {
  GIFT_MS.push(...[3, 8, 15, 30, 50].map(n => ({ id: 'gz' + n, t: `Löse ${n} Sudokus`, v: s => (s.puz && s.puz.sudWins) || 0, n })),
    ...[3, 8, 15, 30, 50].map(n => ({ id: 'gv' + n, t: `Löse ${n} Fälle bei Venola Holmes`, v: s => (s.puz && s.puz.venWins) || 0, n })));
}
