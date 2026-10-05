/* =====================================================================
   SHELL: Startseite · Hefte · Belohnungen · Darstellung · Kreativzeit · Fino-Name
   Läuft nach app.js. Ablauf des Kindes: üben → sehen, was man gelernt hat → etwas Verdientes bekommen → kurz genießen.
   ---------------------------------------------------------------------
   Regeln, die alle Funktionen (feat_*.js) einhalten:
   - Münzen sind die einzige Währung und werden NUR im Shop ausgegeben. Alles andere wird verdient (Meilenstein) oder ist gratis (nur das Nötigste).
   - Ein Feature kann registerFeature({ ..., creative:'view'|'closed' }) setzen:
       'closed' = ohne Kreativzeit nur ein Schloss-Bildschirm   'view' = Ansehen geht immer, Gestalten nur in der Kreativzeit (UI.ro === true heißt: nur ansehen)
   - registerFeature({ leave: () => {} }) wird beim Verlassen der Ansicht aufgerufen (Musik anhalten usw.).
   ===================================================================== */

/* ---------- Kapitel A–D mit je 5 Heften (fest), dazu Extra-Training ---------- */
const CHAPTERS = [{ id: 'A', season: 'Herbstferien' }, { id: 'B', season: 'Weihnachtsferien' }, { id: 'C', season: 'Osterferien' }, { id: 'D', season: 'Sommerferien' }];
const chapIdx = m => Math.max(0, CHAPTERS.findIndex(c => c.id === (m.id || '')[0]));
const modNum = m => +String(m.id).slice(1) || 0;
const isExtra = m => !!m.extra || !/^[A-D][1-5]$/.test(m.id);
const chapMods = c => MODULES.filter(m => !isExtra(m) && m.id[0] === c);
/* FN() = der Name, der überall statt „Fino“ steht: der Name des Kindes (Profil), sonst ein früher gespeicherter Fino-Name, sonst „Fino“. */
const FN = () => ((S.name || '').trim() || S.finoName || 'Fino');

/* Preise im alten Fino-Shop auf Münzen umstellen (Flamme = 3 Münzen, Stern = 12 Münzen); Besitz bleibt unverändert */
(function normShop() {
  Object.values(SHOP).forEach(cat => cat.items.forEach(it => {
    if (it.cur === 'f') { it.price = Math.round(it.price * 3 / 5) * 5; it.cur = 'c'; }
    else if (it.cur === 's') { it.price = Math.round(it.price * 12 / 5) * 5; it.cur = 'c'; }
  }));
})();
Object.assign(SHOP_GROUPS, { buch: { label: 'Stickerbuch', ic: 'sticker' } });

/* ---------- Fächer neben Rechnen (Europa-Entdecker, später z. B. Deutsch): feat_*.js ruft regSubject({id,name,ic,act,sub}) auf ---------- */
const SUBJECTS = [];
function regSubject(s) { if (!SUBJECTS.some(x => x.id === s.id)) SUBJECTS.push(s); }   // {id,name,ic,act,sub,card:()=>html}
/* Hauptkacheln der Startseite: Rechnen ist eingebaut, weitere Fächer liefern card() */

/* ---------- Welche Funktion gehört zu welcher Ansicht ---------- */
const featOf = v => Object.values(FEATS).find(f => f.view === v || (f.views && f.views[v]));
function leaveHook(v) { const F = featOf(v); if (F && F.leave) { try { F.leave(); } catch (e) { console.error(e); } } }

/* ---------- Kreativzeit-Anzeige ---------- */
function creativeInfo() {
  const m = creativeMode();
  if (m === 'locked' && !(UI.pinCreative && Date.now() < UI.pinCreative)) return 'Die Kreativ-Bereiche sind gerade geschlossen.';
  const goal = S.cfg.goal, n = S.daily.d === ymd() ? S.daily.n : 0;
  const c = S.daily.cr;
  if (c.grants >= (S.cfg.creativeMax || 2)) return 'Für heute ist die Kreativzeit aufgebraucht. Morgen geht es weiter!';
  const parts = [];
  if (!c.goal) parts.push(`Schaffe dein Tagesziel (noch ${Math.max(0, goal - n)} Aufgaben)`);
  if (!c.lvl) parts.push('oder beende eine Stufe');
  return parts.join(' ') + ` – dann gibt es ${S.cfg.creativeMin || 5} Minuten Kreativzeit.`;
}
function lockScreen(F) {
  return `${topBar(ico(F.icon, 26) + ' ' + F.title, 'rewards')}
  <div class="lockscr"><div class="lockic">${ico('lock', 44)}</div><h2>${esc(F.title)} öffnet nach dem Üben</h2>
  <p>${esc(creativeInfo())}</p>
  <div class="row wrap" style="justify-content:center"><button class="btn big" data-act="goNext">Jetzt üben</button></div>
  ${typeof F.peek === 'function' ? F.peek() : ''}</div>`;
}
const crBanner = ok => ok
  ? `<div class="crbar on"><span>🎨 Kreativzeit</span><b id="crT">${creativeMode() === 'always' ? 'ohne Limit' : fmtT(creativeLeft())}</b></div>`
  : `<div class="crbar"><span>👀 Nur anschauen</span><small>${esc(creativeInfo())}</small></div>`;

/* ---------- Navigation: die Startseite ist der Hub. Kein unterer Tab-Balken mehr; „Zurück“ führt zur Seite, von der man kam (dz.js) ---------- */
const avArt = (size, mood) => avatarHTML(eqAvatar(), size, mood || 'happy');            // das ausgewählte Bild (eigener Avatar oder Fino)
/* Der Name des Kindes ist auch der Name des Avatars. S.avName (früher getrennt) wird nur noch als Notnagel gelesen, nie gelöscht. */
const profileName = () => ((S.name || '').trim()) || (useMe() ? (S.avName || 'Mein Zauberlehrling') : FN());

function shellRender(v, f) {
  const b = document.body;
  b.dataset.size = S.cfg.size === 'l' ? 'l' : 'm'; b.dataset.calm = S.cfg.calm ? '1' : '0'; b.dataset.screen = v;
  UI.ro = false;
  const F = featOf(v); let banner = '';
  if (F && F.creative) {
    const ok = creativeOK();
    if (!ok && F.creative === 'closed') return lockScreen(F);
    UI.ro = !ok; banner = (v === 'avatar' && !(S.av && S.av.look)) ? '' : crBanner(ok);
  }
  const pa = pgArea(v);
  if (pa) { const st = pgState(pa); if (!st.open) return adminBar() + pageLock(v, st); banner = pgBar(pa, st) + banner; }
  return adminBar() + banner + f();
}

/* ---------- Uhr: Shop-Zeit und Kreativzeit laufen nur, wenn man wirklich dort ist ---------- */
let tickN = 0;
setInterval(() => {
  if (document.hidden) return;
  tickN++;
  try {
    if (view === 'shop' && (S.cfg.shopMin || 0) > 0 && shopLeft() > 0) {
      touchDay(); S.daily.shopSec++;
      const el = $('#shopT'); if (el) el.textContent = fmtT(shopLeft());
      if (shopLeft() <= 0) { save(); render(); toast('🛍️', 'Die Shop-Zeit für heute ist vorbei.'); }
    }
    const F = featOf(view);
    if (F && F.creative && creativeMode() === 'after' && creativeLeft() > 0 && !(UI.pinCreative && Date.now() < UI.pinCreative)) {
      S.daily.cr.left--; S.daily.cr.used++;
      const el = $('#crT'); if (el) el.textContent = fmtT(S.daily.cr.left);
      if (S.daily.cr.left === 60) toast('⏳', 'Noch eine Minute Kreativzeit. Alles wird automatisch gespeichert.');
      if (S.daily.cr.left <= 0) {
        save(); leaveHook(view);
        modal('Kreativzeit vorbei', 'Alles ist gespeichert. Du findest es morgen genau so wieder. Jetzt üben wir weiter!', 'Weiter üben', 'goNext', '', 'Später');
        go('rewards');
      }
    }
    if (tickN % 15 === 0) save();
  } catch (e) { console.error(e); }
}, 1000);

/* ---------- Was jetzt üben? ---------- */
function nextUp() {
  const mods = MODULES.slice().sort((a, b) => (isExtra(a) - isExtra(b)) || chapIdx(a) - chapIdx(b) || modNum(a) - modNum(b));
  const info = (m, t, kind) => { const key = tk(m.id, t.id), d = S.decks[key], i = d ? d.i : 0; return { key, mod: m, topic: t, i, kind, pts: d ? deckPts(d) : 0 }; };
  const lk = S.lastKey, d0 = lk && S.decks[lk];
  if (d0 && d0.i > 0 && d0.i < DECK_N) { const f = findTopic(lk); if (f) return info(f.mod || MODULES.find(m => m.id === lk.split('.')[0]), f.topic, 'go'); }
  for (const m of mods.filter(x => !isExtra(x))) {
    const ts = m.topics.filter(t => { const d = S.decks[tk(m.id, t.id)]; return !d || d.i < DECK_N; });
    if (ts.length) { const t = ts.find(t => { const d = S.decks[tk(m.id, t.id)]; return d && d.i > 0; }) || ts[0]; return info(m, t, 'go'); }
  }
  let best = null;
  MODULES.forEach(m => m.topics.forEach(t => {
    const key = tk(m.id, t.id), rec = S.topics[key], d = S.decks[key]; if (!d || d.i < DECK_N) return;
    const ts = (rec && rec.doneTs) || 0, days = (Date.now() - ts) / 864e5;
    if (days >= REV_DAYS && (!best || ts < best.ts)) best = Object.assign(info(m, t, 'rev'), { ts });
  }));
  return best;
}
function startNext() {
  const nu = nextUp(); if (!nu) return go('mistakes');
  UI.mod = nu.mod.id; UI.key = nu.key;
  if (nu.kind === 'rev') { if (!newRound(nu.key)) return go('topic', { key: nu.key }); }
  startDeck(nu.key);
}

/* ---------- Fächer neben Rechnen: feat_*.js liefert tile() ---------- */
const subjTiles = () => SUBJECTS.filter(x => x.tile).map(x => x.tile());
const TILE_CLS = ['t1', 't2', 't3'];

/* Fehler-Heft + Mini-Test: ehrliche Angabe der heutigen Belohnung */
const heftePrizeNote = () => {
  const L = testLeft(), any = L.c || L.s || L.ch;
  return any ? `<div class="dz-note"><b>Mini-Test heute:</b> bis zu ${L.c} 🪙 + ${L.s} ⭐${L.ch ? ' und eine Karte bei voller Punktzahl' : ''}.</div>` : '';
};

/* Begrüßung nach lokaler Uhrzeit (Gerätezeit): Morgen 5–10, Tag 11–13, Nachmittag 14–17, Abend 18–21, sonst Nacht */
const greetWord = (h = new Date().getHours()) => h >= 5 && h < 11 ? 'Guten Morgen' : h < 14 && h >= 11 ? 'Guten Tag' : h >= 14 && h < 18 ? 'Schönen Nachmittag' : h >= 18 && h < 22 ? 'Guten Abend' : 'Hallo Nachteule';
const homeGreeting = (h) => { const nm = S.name || S.avName || '', w = greetWord(h); return nm ? `${w}, ${esc(nm)}!` : `${w}!`; };

/* ---------- Startseite: der Hub ---------- */
VIEWS.home = () => {
  const n = S.daily.d === ymd() ? S.daily.n : 0, goal = S.cfg.goal, nu = nextUp();
  const progress = Math.min(n, goal), pct = Math.min(100, Math.round(n / goal * 100)), done = n >= goal;
  const hello = homeGreeting();
  const sub = done ? 'Dein Tagesziel ist geschafft – super!' : (useMe() || S.name) ? 'Was entdeckst du heute?' : `${esc(FN())} ist bereit. Du auch?`;
  const tree = `<div class="dz-tree" aria-label="Dein Baum wächst mit jeder Aufgabe">${dzTree(pct)}<div class="dz-tree-t"><strong>${done ? 'Dein Baum ist groß!' : n ? 'Dein Baum wächst' : 'Pflanze deinen Samen'}</strong><small>Heute ${progress} von ${goal} Aufgaben</small><div class="dz-tree-bar" role="progressbar" aria-label="Tagesziel" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="${goal}"><i style="width:${pct}%"></i></div></div></div>`;
  const ex = MODULES.filter(isExtra);
  const tiles = [
    { art: 'hefte', title: 'Meine Hefte', sub: nu ? `Weiter: ${nu.mod.id}` : 'Alles geschafft', act: 'hefte' },
    ...subjTiles(),
    { art: 'extra', title: 'Extra Spaß', sub: `${ex.length} Spiele`, act: 'extra' },
    { art: 'welt', title: 'Meine Welt', sub: 'Shop, Musik & mehr', act: 'rewards' }
  ];
  return dzHead() + dzHero('', hello, sub, tree) + dzSec('Wohin heute?') +
    dzGrid(tiles.length, tiles.map((t, i) => dzTile(Object.assign({ cls: TILE_CLS[i % 3] }, t))).join(''), 'dz-home4') +
    `<div class="dz-foot"><button class="dz-linkbtn dz-snd" data-act="toggleSound" aria-pressed="${S.cfg.sound !== false}" aria-label="${S.cfg.sound !== false ? 'Ton ausschalten' : 'Ton einschalten'}">${ico(S.cfg.sound !== false ? 'speaker' : 'speakerOff', 18)} ${S.cfg.sound !== false ? 'Ton an' : 'Ton aus'}</button><button class="dz-linkbtn" data-act="parent">${ico('gear', 16)} Für Eltern</button></div>
    ${persistOK ? '' : '<p class="ad-save-warning" role="alert">Gerade kann nichts gespeichert werden. Bitte lass einen Erwachsenen eine Sicherung exportieren.</p>'}`;
};

/* ---------- Meine Hefte ---------- */
/* Schulferien Niedersachsen (Quelle: Kultusministerium Niedersachsen, Ferientermine). Je Kapitel: [erster Ferientag, letzter Ferientag].
   Vorschlag für den Termin = letzter Schultag davor (Mo–Fr). Eltern können jedes Datum ändern; nichts davon wird gespeichert, solange es nicht geändert wird. */
const FERIEN_NI = {
  A: [['2026-10-12', '2026-10-24'], ['2027-10-16', '2027-10-30']],
  B: [['2026-12-23', '2027-01-09'], ['2027-12-23', '2028-01-08']],
  C: [['2027-03-22', '2027-04-03'], ['2028-04-10', '2028-04-22']],
  D: [['2026-07-02', '2026-08-12'], ['2027-07-08', '2027-08-18']]
};
function lastSchoolDay(startIso) {
  const d = new Date(startIso + 'T12:00:00'); d.setDate(d.getDate() - 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function ferienFor(c, today) {
  const t = today || ymd(), e = (FERIEN_NI[c.id] || []).find(p => p[1] >= t);
  return e ? { start: e[0], end: e[1], due: lastSchoolDay(e[0]) } : null;
}
const dueOf = c => (S.cfg.due && S.cfg.due[c.id]) || (ferienFor(c) || {}).due || '';
const dueInfo = c => {
  const ds = dueOf(c); if (!ds) return { txt: 'bis zu den ' + c.season, days: null };
  const days = Math.ceil((new Date(ds + 'T23:59:59') - Date.now()) / 864e5);
  return { txt: 'bis zu den ' + c.season + ' (' + new Date(ds + 'T12:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'long' }) + ')', days };
};
const chapterOf = m => isExtra(m) ? 'Extra' : m.id[0];
const heftTile = (m, cls) => {
  const p = modProgress(m), art = { EMAL: 'mal', KOPF: 'kopf', SCHR: 'schrift', A4: 'teilen', A5: 'geld' }[m.id];
  return dzTile({ cls, html: art ? dzArt(art) : `<span class="dz-glyph">${esc(m.icon)}</span>`, title: m.extra ? m.title : m.id, sub: m.extra ? ({ EMAL: 'Mal & geteilt', KOPF: 'Plus & minus', SCHR: 'Untereinander' }[m.id] || '') : m.title, act: 'mod', arg: m.id, pct: p.pct, label: `${m.extra ? '' : 'Heft ' + m.id + ': '}${m.title}, ${p.pct} Prozent geschafft` });
};
function chapterBody(c) {
  const mods = chapMods(c.id).sort((a, b) => modNum(a) - modNum(b));
  const tiles = [1, 2, 3, 4, 5].map((k, i) => {
    const m = mods.find(x => modNum(x) === k);
    return m ? heftTile(m, TILE_CLS[i % 3]) : dzTile({ title: c.id + k, sub: 'bald', locked: true, html: dzIc('lock', 28), label: `Heft ${c.id}${k}, kommt bald` });
  }).join('');
  const missing = 5 - mods.length;
  return dzGrid(5, tiles, 'dz-hefte5') + (missing ? `<div class="dz-acc-note">${dzIc('lock', 16)}<span>${mods.length ? 'Bald dabei' : 'Kommt bald'}: ${5 - mods.length} ${5 - mods.length === 1 ? 'Heft' : 'Hefte'}</span></div>` : '');
}
VIEWS.hefte = () => {
  const nu = nextUp(), nm = S.mistakes.length;
  const openDefault = nu && !isExtra(nu.mod) ? nu.mod.id[0] : (CHAPTERS.find(c => chapMods(c.id).length) || CHAPTERS[0]).id;
  if (UI.acc_hefte === undefined) UI.acc_hefte = openDefault;
  const tiles = [
    { art: 'play', title: 'Los geht’s', sub: nu ? (nu.kind === 'rev' ? `Wiederholen: ${nu.mod.id}` : nu.i ? `Weiter bei ${nu.mod.id}` : `Start: ${nu.mod.id}`) : 'Alles geschafft', act: nu ? 'goNext' : 'mistakes', label: nu ? `Los geht’s: ${nu.mod.title}, ${nu.topic.t}` : 'Los geht’s: alle Hefte sind fertig' },
    { art: 'retry', title: 'Fehler-Heft', sub: nm ? `${nm} ${nm === 1 ? 'Aufgabe' : 'Aufgaben'}` : 'Alles richtig', act: 'mistakes' },
    { art: 'test', title: 'Mini-Test', sub: `${TEST_N} Aufgaben`, act: 'testSetup', label: `Mini-Test: ${TEST_N} Aufgaben in ${TEST_SECS / 60} Minuten` }
  ].map((t, i) => dzTile(Object.assign({ cls: TILE_CLS[i % 3] }, t))).join('') + dzSlot('slot_hefte');
  const items = CHAPTERS.map(c => {
    const mods = chapMods(c.id), due = dueInfo(c);
    const when = esc(due.txt) + (due.days !== null ? ' · ' + (due.days < 0 ? 'Termin vorbei' : 'noch ' + due.days + ' Tage') : '');
    return { id: c.id, badge: c.id, title: 'Kapitel ' + c.id, sub: `${mods.length} von 5 Heften · ${when}`, body: chapterBody(c) };
  });
  return topBar('Meine Hefte', 'home') + dzGrid(4, tiles, 'dz-hefte4') + heftePrizeNote() + dzSec('Kapitel', 'Tippe ein Kapitel an – es ist immer nur eins offen.') + dzAcc(items, UI.acc_hefte, 'hefte');
};

/* ---------- Extra Spaß: freiwillig, ohne Druck ---------- */
VIEWS.extra = () => {
  const ex = MODULES.filter(isExtra);
  const tiles = ex.map((m, i) => heftTile(m, TILE_CLS[i % 3])).join('') + dzSlot('slot_extra');
  return topBar('Extra Spaß', 'home') + dzHero('Freiwillig', 'Extra Spaß', 'Kleine Rechenspiele, wann immer du Lust hast. Es zählt jede Aufgabe, die du löst.', '', 'sm') + dzSec('Such dir was aus') + dzGrid(4, tiles, 'dz-extra4');
};

/* ---------- Meine Welt: fünf Kacheln, Wesen/Buch/Insel nur über Schalter ---------- */
function worldTile(id, i) {
  const f = FEATS[id], closed = f && f.creative && !creativeOK();
  const tag = closed ? (f.creative === 'closed' ? `${ico('lock', 13)} Noch zu` : `${ico('eye', 13)} Ansehen`) : '';
  const cls = TILE_CLS[i % 3];
  if (id === 'fakten') return dzTile({ cls, art: 'fakten', title: 'Lustige Fakten', sub: factsSub(), act: 'fakten' });
  if (id === 'notiz') return dzTile({ cls, art: 'notiz', title: 'Notizbuch', sub: noteSub(), act: 'notiz' });
  if (id === 'shop') return dzTile({ cls, art: 'shop', title: 'Shop', sub: `${S.coins} Münzen`, act: 'shop' });
  if (id === 'musik') return dzTile({ cls, art: 'musik', title: 'Meine Musik', sub: closed ? 'Nach dem Üben' : (f.sub ? f.sub() : ''), act: 'musik', tag });
  if (id === 'story') return dzTile({ cls, art: 'story', title: dzPoss(FN()) + ' Geschichte', sub: (typeof epList === 'function') ? `${epList().filter(epUnlocked).length} von ${epList().length} Episoden` : '', act: 'story' });
  if (id === 'welt') return dzTile({ cls, html: dzPassport(), title: 'Meine Weltreise', sub: (typeof wList === 'function') ? `${wList().filter(p => WA.isOpen(p.id)).length} Länder offen` : 'Entdeckerpass', act: 'welt' });
  const nm = { wesen: 'Meine Wesen', buch: 'Mein Buch', insel: 'Meine Insel' }[id];
  return dzTile({ cls, art: id === 'wesen' ? 'fino' : id === 'buch' ? 'hefte' : 'welt', title: nm, sub: f && f.sub ? f.sub() : '', act: id, tag });
}
VIEWS.rewards = () => {
  const ids = ['fakten', 'musik', 'shop', 'story', 'welt', 'notiz'].concat(DZ_FLAGS.map(x => x.id).filter(flagOn)).filter(id => id === 'shop' || FEATS[id]);
  return topBar('Meine Welt', 'home') + dzHero('', 'Meine Welt', 'Von dir verdient. Für dich gemacht.', '', 'sm') + dzSec('Entdecken & sammeln') +
    dzGrid(ids.length <= 6 ? ids.length : 4, ids.map(worldTile).join(''), 'dz-welt5') +
    `<p class="ad-creative-note">${creativeOK() ? (creativeMode() === 'always' ? 'Deine Kreativbereiche sind offen.' : `Deine Kreativzeit: ${fmtT(creativeLeft())}`) : esc(creativeInfo())}</p>`;
};

/* ---------- Mein Profil: Bild, Level, alles Verdiente, Namen ----------
   S.name   = mein Name (Begrüßung + Urkunde)
   Der Name gilt auch für den Avatar (kein eigener Avatar-Name mehr). */
const nameEditor = () => `<div class="dz-namefield"><label class="sr-only" for="nameIn">Mein Name</label><input class="txt" id="nameIn" maxlength="20" value="${esc(S.name)}" placeholder="So heiße ich" autocomplete="off"><button class="btn sm" data-act="rhSaveName">Speichern</button></div>`;
VIEWS.profile = () => {
  const L = levelInfo(), g = goalItem(), recent = (S.earned || []).filter(e => Date.now() - e.ts < 3 * 864e5).slice(0, 5);
  const nCards = Object.keys(S.cards).length, nTro = Object.keys(S.trophies).length;
  const stat = (ic, val, name, small, act) => `<button class="dz-stat" data-act="${act}">${dzIc(ic, 26)}<b>${val}</b><span>${name}</span><small>${small}</small></button>`;
  const tiles = [
    { html: avArt(120), title: 'Das bin ich', sub: 'Mein Bild', act: 'avatar' },
    { art: 'pokal', title: 'Meine Pokale', sub: `${nTro} gesammelt`, act: 'trophies' },
    { art: 'farben', title: 'Farben & Töne', act: 'look' }
  ].map((t, i) => dzTile(Object.assign({ cls: TILE_CLS[i % 3] }, t))).join('');
  return topBar('Mein Profil', 'home') + `<section class="dz-panel dz-id">${avArt(112)}<div><h1>${esc(profileName())}</h1><p>Level ${L.n} · ${esc(L.title)}</p><div class="bar" style="margin-top:8px"><i style="width:${L.pct}%"></i></div><small class="mute">Noch ${L.need} verdiente Münzen bis Level ${L.n + 1}</small>${S.name ? '' : `<label class="dz-lbl" for="nameIn">Mein Name</label>${nameEditor()}`}</div></section>
    <div class="dz-stats">
      ${stat('star', S.starsLife, 'Sterne', 'Für immer gesammelt', 'profile')}
      ${stat('coin', S.coins, 'Münzen', 'Im Shop ausgeben', 'shop')}
      ${stat('cards', `${nCards}<span style="display:inline;font-weight:700;font-size:.9rem"> / ${CARDS.length}</span>`, 'Karten', S.chests ? `${S.chests} ${S.chests === 1 ? 'neue wartet' : 'neue warten'}!` : 'Beim Üben verdient', 'schatz')}
      ${stat('trophy', nTro, 'Pokale', 'Alle ansehen', 'trophies')}
    </div>
    ${g ? `<button class="dz-goal" data-act="shop">${dzIc('target', 22)}<span>Dein Sparziel: <b>${esc(g.name)}</b></span><b>${Math.max(0, g.src.price - S.coins) ? `Noch ${Math.max(0, g.src.price - S.coins)} Münzen` : 'Ziel erreicht!'}</b></button>` : ''}
    ${dzSec('Mein Platz')}${dzGrid(3, tiles, 'dz-prof4')}
    ${recent.length ? `<details class="ad-earned"><summary>${ico('star', 18)} Neu verdient <span>${recent.length}</span></summary><ul>${recent.map(e => `<li>${esc(e.ic || '✓')} ${esc(e.text)}</li>`).join('')}</ul></details>` : ''}`;
};
Object.assign(ACT, {
  profile: () => go('profile'), extra: () => go('extra'),
  rhSaveName: () => { ACT.saveName(); if (S.name) toast('👋', `Hallo ${S.name}! Dein Name steht jetzt überall.`); render(); },
});

/* ---------- Darstellung: Farben (Themes) und Lesbarkeit ---------- */
VIEWS.look = () => {
  const th = SHOP.theme.items;
  return `${topBar(ico('gear', 26) + ' Farben & Töne', 'profile')}
  <div class="card"><h3>Farben</h3><p class="mute small">Die Farbe bestimmt den Akzent der ganzen App. Neue Farben gibt es im Shop.</p>
  <div class="itiles">${th.map(it => { const has = S.owned.theme.includes(it.id), on = S.eq.theme === it.id;
    return `<button class="itile ${has ? '' : 'lk'} ${on ? 'sel' : ''}" ${has ? `data-act="equip" data-arg="theme|${it.id}"` : `data-act="shopTheme"`}>${has ? '' : LOCK}<span class="ith"><div class="swatch">${it.c.map(c => `<i style="background:${c}"></i>`).join('')}</div></span><span class="itn">${it.name}</span>${has ? (on ? '<span class="tag on">aktiv</span>' : '') : `<span class="tag pr">🪙 ${it.price}</span>`}</button>`; }).join('')}</div></div>
  <div class="card" style="margin-top:12px"><h3>Lesbarkeit</h3>
    <div class="cfg"><div><b>Große Schrift</b></div><button class="btn sm ${S.cfg.size === 'l' ? '' : 'sec'}" data-act="toggleSize">${S.cfg.size === 'l' ? 'An' : 'Aus'}</button></div>
    <div class="cfg"><div><b>Ruhige Darstellung</b><br><span class="small mute">Keine Bewegung und kein Konfetti.</span></div><button class="btn sm ${S.cfg.calm ? '' : 'sec'}" data-act="toggleCalm">${S.cfg.calm ? 'An' : 'Aus'}</button></div>
    <div class="cfg"><div><b>Töne</b></div><button class="btn sm ${S.cfg.sound !== false ? '' : 'sec'}" data-act="toggleSound">${S.cfg.sound !== false ? 'An' : 'Aus'}</button></div>
  </div>`;
};
Object.assign(ACT, {
  hefte: () => go('hefte'), rewards: () => go('rewards'), look: () => go('look'), goNext: () => { closeModal(); startNext(); },
  shopTheme: () => go('shop', { shopGrp: 'fino', shopTab: 'theme', shopHi: null, shopAll: false }),
  toggleSize: () => { S.cfg.size = S.cfg.size === 'l' ? 'm' : 'l'; save(); render(); },
  toggleCalm: () => { S.cfg.calm = !S.cfg.calm; save(); render(); },
  toggleSound: () => { S.cfg.sound = S.cfg.sound === false; save(); render(); }
});
