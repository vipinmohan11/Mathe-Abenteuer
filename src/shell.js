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
const FN = () => (S.finoName || 'Fino');                         // Fino darf umbenannt werden (Shop → Avatar → Fino-Namen)

/* Preise im alten Fino-Shop auf Münzen umstellen (Flamme = 3 Münzen, Stern = 12 Münzen); Besitz bleibt unverändert */
(function normShop() {
  Object.values(SHOP).forEach(cat => cat.items.forEach(it => {
    if (it.cur === 'f') { it.price = Math.round(it.price * 3 / 5) * 5; it.cur = 'c'; }
    else if (it.cur === 's') { it.price = Math.round(it.price * 12 / 5) * 5; it.cur = 'c'; }
  }));
})();
Object.assign(SHOP_GROUPS, { buch: { label: 'Stickerbuch', ic: 'sticker' } });

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

/* ---------- Navigation: Start · Meine Hefte · Meine Welt · Mein Profil ---------- */
const NAVV = ['home', 'hefte', 'rewards', 'profile'];
const avArt = (size, mood) => avatarHTML(eqAvatar(), size, mood || 'happy');            // das ausgewählte Bild (eigener Avatar oder Fino)
const profileName = () => useMe() ? (S.avName || S.name || 'Mein Rechenheld') : FN();
const navBar = v => `<nav class="nav adventure-nav rh-nav" aria-label="Hauptmenü">
    ${[['home', 'Start', 'home'], ['hefte', 'Meine Hefte', 'book'], ['rewards', 'Meine Welt', 'island']].map(([id, name, icon]) => `<button data-act="${id}" class="${v === id ? 'on' : ''}" ${v === id ? 'aria-current="page"' : ''}>${ico(icon, 23)}<span>${name}</span></button>`).join('')}
    <button data-act="profile" class="rh-nav-profile ${v === 'profile' ? 'on' : ''}" aria-label="Mein Profil, ${esc(profileName())}, Level ${levelInfo().n}, ${S.starsLife} Sterne" ${v === 'profile' ? 'aria-current="page"' : ''}>${avArt(40)}<span>Mein Profil<small>Level ${levelInfo().n} · ⭐ ${S.starsLife}</small></span></button>
  </nav>`;

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
  return banner + f() + (NAVV.includes(v) ? navBar(v) : '');
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

/* ---------- Bausteine der großen Seiten ---------- */
const arrow = size => `<span class="ad-arrow" aria-hidden="true" style="font-size:${size}px">→</span>`;
const btnA = (label, act, cls, arg) => `<button class="${cls || 'fc-primary'}" data-act="${act}"${arg == null ? '' : ` data-arg="${esc(arg)}"`}>${label}</button>`;
const fcHeader = () => `<header class="fc-header"><button class="fc-logo" data-act="home" aria-label="Rechenhelden Start"><span class="fc-logo-symbol" aria-hidden="true">÷</span><span>Rechenhelden</span></button>${statChips()}</header>`;
const fcRoot = body => `<section class="fc-root">${fcHeader()}<div class="fc-main">${body}</div></section>`;
const CHEST = '<span class="fc-tinychest" aria-hidden="true"></span>', BOOK = '<span class="fc-tinybook" aria-hidden="true">÷</span>';

/* Noch mal üben + Mini-Test: gut sichtbar, mit ehrlicher Belohnungs-Angabe */
const practiceTools = () => {
  const L = testLeft(), any = L.c || L.s || L.ch, nm = S.mistakes.length;
  return `<section class="rh-training" aria-label="Extra üben">
    <button class="rh-train" data-act="mistakes"><span class="rh-tool-icon">${ico('notebook', 28)}</span><span><strong>Noch mal üben</strong><small>${nm ? `${nm} ${nm === 1 ? 'Aufgabe' : 'Aufgaben'} in deinem Fehler-Heft` : 'Dein Fehler-Heft ist leer'}</small><span class="rh-prize">${ico('check', 16)} Gleich richtig? Eine Aufgabe weniger!<small>Hier gibt es keine Münzen.</small></span></span><span aria-hidden="true">→</span></button>
    <button class="rh-train" data-act="testSetup"><span class="rh-tool-icon">${ico('stopwatch', 28)}</span><span><strong>Mini-Test</strong><small>${TEST_N} Aufgaben · ${TEST_SECS / 60} Minuten</small><span class="rh-prize">${any ? `Heute noch bis zu ${L.c} Münzen + ${L.s} ${L.s === 1 ? 'Stern' : 'Sterne'}` : 'Heute schon alles verdient'}<small>${any ? (L.ch ? 'Ab 12 richtigen: eine Karte. Dein bestes Ergebnis zählt.' : 'Dein bestes Ergebnis zählt.') : 'Du kannst weiter für dich üben.'}</small></span></span><span aria-hidden="true">→</span></button>
  </section>`;
};

/* ---------- Startseite: „Was soll ich jetzt üben?“ ---------- */
VIEWS.home = () => {
  const n = S.daily.d === ymd() ? S.daily.n : 0, goal = S.cfg.goal, nu = nextUp();
  const progress = Math.min(n, goal), pct = Math.min(100, n / goal * 100), done = n >= goal;
  const recent = (S.earned || []).filter(e => Date.now() - e.ts < 3 * 864e5).slice(0, 3);
  const g = goalItem(), greetingLine = S.name ? `Hey ${esc(S.name)}!` : 'Hey, schön, dass du da bist!';
  const heroTitle = !nu ? 'Alles geschafft!' : nu.kind === 'rev' ? 'Frisch im Kopf<br>bleibt’s besser!' : nu.i ? 'Dein Abenteuer<br>geht weiter!' : 'Dein nächstes<br>Abenteuer wartet!';
  const label = !nu ? 'Deine Hefte sind fertig.' : `${nu.mod.title} · ${nu.topic.t}`;
  const heroAction = !nu ? ['Fehler-Heft', 'mistakes'] : nu.kind === 'rev' ? ['Wiederholen', 'goNext'] : nu.i ? ['Weiter geht’s', 'goNext'] : ['Los geht’s', 'goNext'];
  const reward = S.chests
    ? `<button class="fc-shortcut treasure" data-act="schatz">${CHEST}<span><strong>${S.chests === 1 ? 'Eine Karte für dich!' : `${S.chests} Karten für dich!`}</strong><small>Beim Üben verdient.</small></span>${arrow(18)}</button>`
    : `<button class="fc-shortcut treasure" data-act="rewards">${CHEST}<span><strong>Meine Welt</strong><small>${g ? `Dein Ziel: ${esc(g.name)}` : 'Hier wächst, was du dir verdienst.'}</small></span>${arrow(18)}</button>`;
  return fcRoot(`<div class="fc-hello"><div><h1>${greetingLine}</h1><p>${useMe() ? 'Dein nächster Rechenerfolg wartet!' : esc(FN()) + ' ist bereit. Du auch?'}</p></div></div>
    <section class="fc-hero"><div><div class="fc-eyebrow">${nu ? `DEIN HEFT ${esc(nu.mod.id)}` : 'GUT DRANGEBLIEBEN'}</div><h2>${heroTitle}</h2>${btnA(heroAction[0] + ' ' + arrow(22), heroAction[1])}<div class="fc-hero-note">${esc(label)}</div></div>
      <div class="fc-fino-scene"><span class="fc-float" aria-hidden="true">÷</span><span class="fc-float b" aria-hidden="true">+</span><div class="fc-bubble">${done ? 'Tagesziel geschafft!' : 'Wir schaffen das!'}</div><div class="ad-hero-fino">${avArt(210, done ? 'cheer' : 'happy')}</div></div></section>
    <div class="fc-day"><span class="fc-day-label">${ico(done ? 'check' : 'sun', 21)}${done ? 'Tagesziel geschafft' : 'Heute geschafft'}</span><div class="fc-progress" role="progressbar" aria-label="Tagesziel" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="${goal}"><i style="width:${pct}%"></i></div><strong>${progress} / ${goal}</strong></div>
    ${practiceTools()}
    <div class="fc-bottom-row"><button class="fc-shortcut" data-act="hefte">${BOOK}<span><strong>Meine Hefte</strong><small>Was übst du als Nächstes?</small></span>${arrow(18)}</button>${reward}</div>
    ${recent.length ? `<details class="ad-earned"><summary>${ico('star', 18)} Neu verdient <span>${recent.length}</span></summary><ul>${recent.map(e => `<li>${esc(e.ic || '✓')} ${esc(e.text)}</li>`).join('')}</ul></details>` : ''}
    ${g ? `<button class="ad-goal" data-act="shop">${ico('target', 20)}<span>Dein Sparziel: <b>${esc(g.name)}</b></span><b>${Math.max(0, g.src.price - S.coins) ? `Noch ${Math.max(0, g.src.price - S.coins)} Münzen` : 'Ziel erreicht!'}</b></button>` : ''}
    <div class="ad-parent">${btnA(ico('gear', 16) + ' Für Eltern', 'parent', 'ad-text')}</div>
    ${persistOK ? '' : '<p class="ad-save-warning" role="alert">Gerade kann nichts gespeichert werden. Bitte lass einen Erwachsenen eine Sicherung exportieren.</p>'}`);
};

/* ---------- Meine Hefte: Kapitel A–D (je 5 Hefte, fest), Extra-Training, kommende Hefte gesperrt sichtbar ---------- */
function dueInfo(c) {
  const ds = S.cfg.due && S.cfg.due[c.id]; if (!ds) return { txt: 'bis zu den ' + c.season, days: null };
  const days = Math.ceil((new Date(ds + 'T23:59:59') - Date.now()) / 864e5);
  return { txt: 'bis zu den ' + c.season + ' (' + new Date(ds + 'T12:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'long' }) + ')', days };
}
const chapterOf = m => isExtra(m) ? 'Extra' : m.id[0];
const shelfBook = m => {
  const p = modProgress(m);
  return `<button class="book rh-book" data-act="mod" data-arg="${esc(m.id)}"><span class="rh-book-art" aria-hidden="true">${m.icon}</span><div><span class="bid">${m.extra ? 'Extra' : 'Heft ' + esc(m.id)}</span><h3>${esc(m.title)}</h3><span class="bn">${p.done} / ${p.total} Übungen geschafft</span><div class="bar"><i style="width:${p.pct}%"></i></div></div><span class="rh-percent">${p.pct}%</span></button>`;
};
const chapterSection = c => {
  const mods = chapMods(c.id).sort((a, b) => modNum(a) - modNum(b)), due = dueInfo(c);
  const missing = [1, 2, 3, 4, 5].filter(n => !mods.some(m => modNum(m) === n)).map(n => c.id + n);
  const when = esc(due.txt) + (due.days !== null ? ' · ' + (due.days < 0 ? 'Termin vorbei' : 'noch ' + due.days + ' Tage') : '');
  const soon = missing.length ? `<div class="rh-soon">${ico('lock', 16)}<span>${mods.length ? 'Bald dabei' : 'Kommt bald'}: ${missing.map(id => `<b>${id}</b>`).join(' ')}</span></div>` : '';
  return `<section class="chap rh-chapter${mods.length ? '' : ' rh-later'}"><div class="chead"><h2>Kapitel ${esc(c.id)}</h2><span class="small mute">${mods.length} von 5 Heften · ${when}</span></div>${mods.length ? `<div class="rh-shelf">${mods.map(shelfBook).join('')}</div>` : ''}${soon}</section>`;
};
VIEWS.hefte = () => {
  const active = CHAPTERS.filter(c => chapMods(c.id).length), later = CHAPTERS.filter(c => !chapMods(c.id).length), ex = MODULES.filter(isExtra);
  return `<div class="top"><h2>Meine Hefte</h2>${statChips()}</div>${practiceTools()}`
    + active.map(chapterSection).join('')
    + (ex.length ? `<section class="chap rh-chapter"><div class="chead"><h2>Extra-Training</h2><span class="small mute">freiwillig · zählt wie jede Übung</span></div><div class="rh-shelf">${ex.map(shelfBook).join('')}</div></section>` : '')
    + later.map(chapterSection).join('');
};

/* ---------- Meine Welt ---------- */
function tileArt(id) {
  if (id === 'avatar') return `<div class="fc-place-art ad-avatar">${avArt(140)}</div>`;
  if (id === 'insel') {
    const got = insNum(insSpots());
    return `<div class="fc-place-art island" aria-hidden="true"><span class="fc-island"></span>${got > 0 ? '<span class="fc-tree"></span>' : '<span class="ad-land-lock">' + ico('lock', 25) + '</span>'}${got > 1 ? '<span class="fc-tree second"></span>' : ''}${got > 8 ? '<span class="fc-house"></span>' : ''}</div>`;
  }
  if (id === 'buch') return `<div class="fc-place-art buch" aria-hidden="true"><div class="fc-album">${ico('star', 43)}</div></div>`;
  if (id === 'musik') {
    const owned = itemsOf('msound').filter(it => hasItem(it.id)).length;
    return `<div class="fc-place-art music" aria-hidden="true"><div class="fc-beatbox">${Array.from({ length: 8 }, (_, i) => `<i${i < Math.max(1, Math.min(owned, 8)) ? ' class="earned"' : ''}></i>`).join('')}</div></div>`;
  }
  if (id === 'story') return '<div class="fc-place-art story" aria-hidden="true"><div class="fc-storybook"><span>✦</span><span>☾</span></div></div>';
  if (id === 'wesen') { const got = wesHatched(); return `<div class="fc-place-art creatures">${got.length ? wesIcon(got[got.length - 1], 82) : wesEgg(WESEN[0].col, 69)}</div>`; }
  return `<div class="fc-place-art treasure">${CHEST}</div>`;
}
VIEWS.rewards = () => {
  const names = { avatar: 'Das bin ich!', insel: 'Meine Insel', buch: 'Mein Buch', musik: 'Meine Musik', wesen: 'Meine Wesen', story: `${FN()}s Geschichte` };
  const tiles = ['avatar', 'insel', 'buch', 'musik', 'wesen', 'story'].filter(id => FEATS[id]).map(id => {
    const f = FEATS[id], closed = f.creative && !creativeOK();
    const tag = closed ? (f.creative === 'closed' ? `${ico('lock', 13)} Noch zu` : `${ico('eye', 13)} Ansehen`) : '';
    let sub = f.sub ? f.sub() : '';
    if (id === 'avatar') sub = closed ? 'Gestalten nach dem Üben' : 'Dein Look';
    if (id === 'musik' && closed) sub = 'Nach dem Üben';
    return `<button class="fc-place" data-act="${id}">${tag ? `<span class="fc-place-tag">${tag}</span>` : ''}${tileArt(id)}<div class="fc-place-name"><strong>${esc(names[id])}</strong><small>${esc(sub)}</small></div></button>`;
  }).join('');
  return fcRoot(`<div class="fc-world-head"><div><h1>Meine Welt</h1><p>Von dir verdient. Für dich gemacht.</p></div>${btnA(ico('bag', 20) + ' Shop', 'shop', 'fc-shop')}</div>
    <div class="fc-places">${tiles}</div>
    <button class="fc-world-foot" data-act="schatz">${ico('chest', 25)}<span>${S.chests ? `${S.chests === 1 ? 'Eine neue Karte wartet' : `${S.chests} neue Karten warten`} auf dich!` : 'Meine Schatzkarten'}</span>${arrow(20)}</button>
    <div class="ad-world-tools">${btnA(ico('trophy', 21) + ` Meine Pokale · ${Object.keys(S.trophies).length}`, 'trophies', 'ad-tool')}${btnA(ico('fox', 21) + ` ${esc(FN())} umbenennen`, 'finoname', 'ad-tool')}${btnA(ico('palette', 21) + ' Farben & Töne', 'look', 'ad-tool')}</div>
    <p class="ad-creative-note">${creativeOK() ? (creativeMode() === 'always' ? 'Deine Kreativbereiche sind offen.' : `Deine Kreativzeit: ${fmtT(creativeLeft())}`) : esc(creativeInfo())}</p>`);
};

/* ---------- Mein Profil: Bild, Level, Verdientes, Namen ----------
   S.name   = mein Name (Begrüßung + Urkunde)
   S.avName = Spitzname meines eigenen Avatars (nur Profil). Leer = S.name. */
const nameEditor = () => `<div class="rh-name"><label for="nameIn">Mein Name</label><div class="row"><input class="txt" id="nameIn" maxlength="20" value="${esc(S.name)}" placeholder="So heiße ich" autocomplete="off"><button class="btn" data-act="rhSaveName">Speichern</button></div><small>Für die Begrüßung und deine Urkunde.</small></div>`;
const avNameEditor = () => `<div class="rh-name"><label for="avNameIn">Name für meinen Avatar</label><div class="row"><input class="txt" id="avNameIn" maxlength="20" value="${esc(S.avName || '')}" placeholder="${esc(S.name || 'Spitzname')}" autocomplete="off"><button class="btn" data-act="saveAvName">Speichern</button></div><small>Steht in deinem Profil. Leer lassen = dein Name.</small></div>`;
VIEWS.profile = () => {
  const level = levelInfo();
  return topBar('Mein Profil') + `<section class="rh-profile"><div class="rh-identity">${avArt(155)}<div><h1>${esc(profileName())}</h1><p>Level ${level.n} · ${esc(level.title)}</p><div class="bar"><i style="width:${level.pct}%"></i></div><small>Noch ${level.need} verdiente Münzen bis Level ${level.n + 1}</small></div></div>
    <div class="rh-earned-stats"><button class="btn sec" data-act="shop">🪙 <b>${S.coins}</b><span>Münzen</span></button><div>⭐ <b>${S.starsLife}</b><span>Sterne gesammelt</span></div><button class="btn sec" data-act="trophies">🏆 <b>${Object.keys(S.trophies).length}</b><span>Pokale</span></button><button class="btn sec" data-act="schatz">🃏 <b>${Object.keys(S.cards).length}</b><span>Karten gesammelt</span></button></div>
    ${nameEditor()}${S.av && S.av.look ? avNameEditor() : ''}<div class="rh-profile-links"><button class="btn sec" data-act="avatar">${ico('avatar', 22)} Mein Bild wählen</button><button class="btn sec" data-act="finoname">${esc(FN())} umbenennen</button><button class="btn sec" data-act="look">${ico('palette', 22)} Farben & Töne</button></div></section>`;
};
Object.assign(ACT, {
  profile: () => go('profile'),
  rhSaveName: () => { ACT.saveName(); render(); },
  saveAvName: () => { const el = $('#avNameIn'); S.avName = ((el && el.value) || '').trim().slice(0, 20); save(); toast('✅', 'Gespeichert'); render(); }
});

/* ---------- Fino-Name: 6 Namen zum Verdienen + eigener Name ---------- */
regKind('finoname', { group: 'avatar', label: 'Fino-Namen', ic: 'fox' });
regItems([
  { id: 'fn.funki', kind: 'finoname', name: 'Funki', e: '🦊', src: { t: 'shop', cur: 'c', price: 40 } },
  { id: 'fn.pixel', kind: 'finoname', name: 'Pixel', e: '🦊', src: { t: 'shop', cur: 'c', price: 50 } },
  { id: 'fn.blitz', kind: 'finoname', name: 'Blitz', e: '🦊', src: { t: 'shop', cur: 'c', price: 60 } },
  { id: 'fn.nuss', kind: 'finoname', name: 'Nuss', e: '🦊', src: { t: 'shop', cur: 'c', price: 70 } },
  { id: 'fn.sunny', kind: 'finoname', name: 'Sunny', e: '🦊', src: { t: 'shop', cur: 'c', price: 80 } },
  { id: 'fn.rocky', kind: 'finoname', name: 'Rocky', e: '🦊', src: { t: 'shop', cur: 'c', price: 90 } },
  { id: 'fn.own', kind: 'finoname', name: 'Eigener Name', e: '✏️', src: { t: 'shop', cur: 'c', price: 150 } }
]);
VIEWS.finoname = () => {
  const names = itemsOf('finoname').filter(i => i.id !== 'fn.own'), own = hasItem('fn.own');
  const cur = FN();
  return `${topBar(ico('fox', 26) + ' Fino-Name', 'rewards')}
  <div class="card"><div class="row wrap" style="align-items:center"><div style="width:120px">${avatarHTML(finoLook(), 120, 'happy')}</div><div style="flex:1;min-width:200px"><h3 style="margin:0">Fino heißt gerade: <b>${esc(cur)}</b></h3><p class="mute small">Neue Namen bekommst du im Shop (Avatar → Fino-Namen).</p></div></div></div>
  <div class="itiles" style="margin-top:12px"><button class="itile ${cur === 'Fino' ? 'sel' : ''}" data-act="setFinoName" data-arg="Fino"><span class="ith"><div class="ithumb nm">Fino</div></span><span class="itn">Fino</span>${cur === 'Fino' ? '<span class="tag on">aktiv</span>' : ''}</button>
  ${names.map(i => itemTile(i, { act: 'setFinoName', arg: i.name, sel: cur === i.name })).join('')}</div>
  <div class="card" style="margin-top:12px"><h3>Eigener Name</h3>${own ? `<div class="row"><input class="txt" id="finoIn" maxlength="12" placeholder="Name für Fino" value="${esc(cur)}"><button class="btn" data-act="saveFinoName">Speichern</button></div>` : `<p class="mute small">Mit dem „Eigenen Namen“ aus dem Shop kannst du Fino selbst benennen.</p>${itemTile(CATALOG['fn.own'], {})}`}</div>`;
};
Object.assign(ACT, {
  finoname: () => go('finoname'),
  setFinoName: n => { S.finoName = n === 'Fino' ? '' : n; save(); toast('🦊', `${FN()} heißt jetzt so`); render(); },
  saveFinoName: () => { const v = ($('#finoIn').value || '').trim().slice(0, 12); if (v) { S.finoName = v; save(); toast('🦊', `${v} heißt jetzt so`); render(); } }
});

/* ---------- Darstellung: Farben (Themes) und Lesbarkeit ---------- */
VIEWS.look = () => {
  const th = SHOP.theme.items;
  return `${topBar(ico('gear', 26) + ' Darstellung', 'rewards')}
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
