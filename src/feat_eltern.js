/* =====================================================================
   ELTERN-BEREICH (PIN-geschützt) – zweisprachig: Deutsch / English (nur dieser Bereich; die App für das Kind bleibt Deutsch)
   S.cfg.plang = 'de' | 'en'. Texte: PT('deutsch', 'english').
   Inhalt: Nutzer (Kind/Admin) · Namen · Zusatzfunktionen (Schalter) · Zeiten & Limits (jede Zeit einzeln zurücksetzbar) · Termine · Ton · PIN · Überblick · Sicherung
   ===================================================================== */
const PT = (de, en) => (S.cfg && S.cfg.plang === 'en') ? en : de;
const PT_SEASON = { Herbstferien: 'Autumn break', Weihnachtsferien: 'Christmas break', Osterferien: 'Easter break', Sommerferien: 'Summer break' };
const PT_FLAG = { wesen: ['Meine Wesen', 'Eier ausbrüten und Wesen sammeln', 'My Creatures', 'Hatch eggs and collect creatures'], buch: ['Mein Buch', 'Sticker sammeln und einkleben', 'My Book', 'Collect stickers and stick them in'], insel: ['Meine Insel', 'Eine eigene Insel gestalten', 'My Island', 'Design your own island'] };
const ptDate = iso => { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || ''); return m ? (S.cfg.plang === 'en' ? `${m[3]}/${m[2]}/${m[1]}` : `${m[3]}.${m[2]}.${m[1]}`) : ''; };
const ptSw = (on, act, arg, label) => `<button class="sw ${on ? 'on' : ''}" role="switch" aria-checked="${on}" aria-label="${esc(label)}" data-act="${act}"${arg == null ? '' : ` data-arg="${esc(arg)}"`}><span class="sw-k"></span><span class="sw-t">${on ? PT('AN', 'ON') : PT('AUS', 'OFF')}</span></button>`;
const ptSel = (id, opts, val) => `<select id="${id}" class="txt noprint">${opts.map(o => `<option value="${o[0]}" ${String(o[0]) === String(val) ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`;
const ptRow = (title, sub, ctl) => `<div class="cfg"><div><b>${title}</b>${sub ? `<br><span class="small mute">${sub}</span>` : ''}</div><div class="row">${ctl}</div></div>`;
const ptReset = (what, label) => `<button class="btn sm sec" data-act="rstTime" data-arg="${what}">${label || PT('Zurücksetzen', 'Reset')}</button>`;
const ptMin = n => PT(`${n} Min`, `${n} min`);

VIEWS.parent = () => {
  const L = levelInfo(), rows = [], weak = [], de = S.cfg.plang !== 'en';
  MODULES.forEach(m => {
    rows.push(`<tr><th colspan="5">${m.icon} ${m.title} <span class="mute small">(${PT('Arbeitsheft', 'Workbook')} ${m.id} · ${m.wb})</span></th></tr>`);
    m.topics.forEach(t => {
      const key = tk(m.id, t.id), r = S.topics[key], d = S.decks[key], p = r && r.q ? Math.round(r.c / r.q * 100) : null;
      if (r && r.q >= 10 && p < 60) weak.push(`${t.icon} ${t.t} – ${t.wb} (${p} %)`);
      rows.push(`<tr><td>${t.icon} ${t.t} <span class="mute small">(${t.wb})</span></td><td>${d ? d.i : 0}/${DECK_N}</td><td>${deckPts(d)}/${d ? deckMax(d) : NEW_DECK_MAX}</td><td><span class="pct ${pctCls(p)}">${p === null ? '–' : p + ' %'}</span></td><td>${MEDALS[medalOf(key)] || '–'}</td></tr>`);
    });
  });
  const days = Object.keys(S.log).sort().slice(-7).reverse(), tests = S.tests.slice(-6).reverse();
  touchDay();
  const today = S.daily.d === ymd() ? S.daily.n : 0, cr = S.daily.cr;
  const bonusDone = !!cr.bonus, needBonus = Math.min(10, S.cfg.goal || 20);
  const lang = `<div class="seg noprint" role="group" aria-label="Language / Sprache"><button class="${de ? 'on' : ''}" data-act="plang" data-arg="de" aria-pressed="${de}">DE</button><button class="${de ? '' : 'on'}" data-act="plang" data-arg="en" aria-pressed="${!de}">EN</button></div>`;
  const user = `<div class="seg" role="group" aria-label="${PT('Nutzer', 'User')}"><button class="${ADMIN ? '' : 'on'}" ${ADMIN ? 'data-act="adminOff"' : ''} aria-pressed="${!ADMIN}">${PT('Kind', 'Child')}</button><button class="${ADMIN ? 'on' : ''}" ${ADMIN ? '' : 'data-act="adminAsk"'} aria-pressed="${ADMIN}">Admin</button></div>`;
  const sub = t => `<h4 class="ptsec">${t}</h4>`;
  return topBar(ico('gear', 26) + ' ' + PT('Eltern', 'Parents'), 'home', `${lang}<button class="btn sm noprint" data-act="print">🖨️ ${PT('Drucken', 'Print')}</button>`) + `
  <div class="card noprint"><h3>${PT('Einstellungen', 'Settings')}</h3>
    ${ptRow(PT('Nutzer', 'User'), ADMIN
      ? PT('Du bist im <b>Admin-Modus</b>: alles freigeschaltet, immer 9999 🪙 und ⭐, keine Zeitgrenzen. Der Stand deines Kindes ist unberührt.', 'You are in <b>Admin mode</b>: everything unlocked, always 9999 🪙 and ⭐, no time limits. Your child’s progress is untouched.')
      : PT('„Kind“ ist der normale Stand. „Admin“ ist ein eigener Testspeicher mit allem freigeschaltet – der Stand deines Kindes bleibt unberührt.', '“Child” is the normal profile. “Admin” is a separate test profile with everything unlocked – your child’s progress stays untouched.'), user)}
    ${sub(PT('Namen', 'Names'))}
    ${ptRow(PT('Name des Kindes (= Name des Avatars)', 'Child’s name (= avatar’s name)'), PT('Wird überall angezeigt: Start, Profil, Avatar, Urkunde. Ein eigener Avatar-Name ist nicht nötig.', 'Shown everywhere: start, profile, avatar, certificate. No separate avatar name is needed.'), `<input class="txt" id="nameIn" maxlength="20" value="${esc(S.name)}" placeholder="Name"><button class="btn sm" data-act="saveName">${PT('Speichern', 'Save')}</button>`)}
    ${sub(PT('Zusatzfunktionen in „Meine Welt“', 'Extra features in “My World”'))}
    <p class="small mute" style="margin:0 0 6px">${PT('Ausgeschaltete Bereiche sind für das Kind unsichtbar. Was darin schon gesammelt wurde, bleibt immer erhalten.', 'Switched-off areas are hidden from your child. Anything already collected there is always kept.')}</p>
    ${DZ_FLAGS.map(f => { const t = PT_FLAG[f.id], on = flagOn(f.id); return `<div class="cfg"><div><b>${PT(t[0], t[2])}</b> <span class="flagstate ${on ? 'on' : ''}">${on ? PT('sichtbar', 'visible') : PT('ausgeblendet', 'hidden')}</span><br><span class="small mute">${PT(t[1], t[3])}</span></div>${ptSw(on, 'dzFlag', f.id, PT(t[0], t[2]))}</div>`; }).join('')}
    ${sub(PT('Lernziel', 'Learning goal'))}
    ${ptRow(PT('Tagesziel', 'Daily goal'), PT('So viele Aufgaben pro Tag für Serie, Karte und Kreativzeit. Heute: ', 'Tasks per day for the streak, a card and creative time. Today: ') + `${today}`, ptSel('cfgGoal', [10, 15, 20, 25, 30, 40, 50].map(n => [n, PT(n + ' Aufgaben', n + ' tasks')]), S.cfg.goal))}
    ${sub(PT('Hausaufgaben-Sperre', 'Homework gate'))}
    <p class="small mute" style="margin:0 0 6px">${PT('Jeder Tag beginnt mit <b>4 Minuten freier Zeit</b> für Profil und Meine Welt (mit sichtbarer Uhr). Danach sind sie zu, bis 20 Minuten Hausaufgaben gemacht oder 25 Aufgaben gelöst wurden. Dann gilt: höchstens 5 Minuten je Bereich, höchstens 10 Minuten insgesamt – pro Tag. Meine Hefte, Europa Entdecker und die Ideenwerkstatt sind immer offen. Morgen beginnt alles von selbst neu.', 'Every day starts with <b>4 minutes of free time</b> for Profile and My World (with a visible timer). After that they stay locked until your child has done 20 minutes of homework or solved 25 tasks. Then: at most 5 minutes per area, at most 10 minutes in total – per day. Workbooks, Europe Explorer and the Idea Workshop are always open. Everything restarts by itself tomorrow.')}</p>
    ${(() => { const hw = hwInfo(); return ptRow(PT('Heutiger Stand', "Today's status"), PT(`${hw.n} von ${hw.need} Aufgaben · ${fmtT(hw.sec)} von ${fmtT(hw.needSec)} Übungszeit.`, `${hw.n} of ${hw.need} tasks · ${fmtT(hw.sec)} of ${fmtT(hw.needSec)} practice time.`), hw.done
      ? `<span class="tag on" style="margin-right:8px">${PT('Heute offen', 'Open today')}</span><button class="btn sm sec" data-act="hwReset">${PT('Wieder sperren', 'Lock again')}</button>`
      : `<button class="btn sm sec" data-act="hwUnlock">${PT('Heute schon freigeben', 'Unlock for today')}</button>`); })()}
    ${ptRow(PT('Freie Zeit (vor der Hausaufgabe)', 'Free time (before homework)'), PT(`Genutzt: ${fmtT(Math.min(FREE_SEC, freeUsed()))} von ${fmtT(FREE_SEC)}.`, `Used: ${fmtT(Math.min(FREE_SEC, freeUsed()))} of ${fmtT(FREE_SEC)}.`), `<button class="btn sm sec" data-act="freeResetAct">${PT('Zurücksetzen', 'Reset')}</button>`)}
    <div class="cfg" style="display:block"><b>${PT('Zeit insgesamt heute', 'Total time today')}</b><br><span class="small mute">${PT(`Genutzt: ${fmtT(rgTotalUsed())} von ${fmtT(rgTotalCap())} (nach der Hausaufgabe).`, `Used: ${fmtT(rgTotalUsed())} of ${fmtT(rgTotalCap())} (after homework).`)}</span>
      <div class="row" style="margin-top:8px"><button class="btn sm sec" data-act="rgResetAllAct">${PT('Zurücksetzen', 'Reset')}</button><button class="btn sm sec" data-act="rgExtendAllAct">+5 ${PT('Min', 'min')}</button></div></div>
    ${sub(PT('Bereiche: öffnen, sperren, Zeit', 'Areas: open, lock, time'))}
    <p class="small mute" style="margin:0 0 6px">${PT('Für jeden Bereich und Unterbereich: <b>Auto</b> = normale Regeln · <b>Offen</b> = immer offen, ohne Hausaufgabe und ohne Zeitgrenze · <b>Zu</b> = gesperrt, bis du es änderst. Ein Unterbereich mit eigener Einstellung gewinnt. „Zurücksetzen“ gibt heute neue Zeit, „+5 Min“ verlängert nur heute.', 'For every area and sub-area: <b>Auto</b> = normal rules · <b>Open</b> = always open, no homework needed and no time limit · <b>Locked</b> = locked until you change it. A sub-area with its own setting wins. “Reset” gives fresh time today, “+5 min” extends only for today.')}</p>
    <div class="ptareas">${SEC_TREE().map(ptAreaBlock).join('')}</div>
    ${sub(PT('Tageslimit (Üben)', 'Daily limit (practice)'))}
    ${ptRow(PT('Tageslimit (Üben)', 'Daily limit (practice)'), PT(`Nach dieser Übungszeit gibt es eine Pause. Heute: ${usedMin()} Min · ${today} Aufgaben${S.daily.unlocked ? ' · heute ohne Limit' : ''}.`, `A break after this much practice. Today: ${usedMin()} min · ${today} tasks${S.daily.unlocked ? ' · no limit today' : ''}.`), ptSel('cfgLimit', [[0, PT('Kein Limit', 'No limit')], [15, ptMin(15)], [20, ptMin(20)], [30, ptMin(30)], [45, ptMin(45)], [60, ptMin(60)], [90, ptMin(90)]], S.cfg.limitMin) + ptReset('limit'))}
    ${ptRow(PT('Shop-Zeit pro Tag', 'Shop time per day'), PT(`So lange darf das Kind pro Tag im Shop stöbern und einkaufen. Heute: ${Math.floor((S.daily.shopSec || 0) / 60)} Min.`, `How long your child may browse and buy in the shop per day. Today: ${Math.floor((S.daily.shopSec || 0) / 60)} min.`), ptSel('cfgShop', [[0, PT('Unbegrenzt', 'Unlimited')], [3, ptMin(3)], [5, ptMin(5)], [10, ptMin(10)]], S.cfg.shopMin == null ? 5 : S.cfg.shopMin) + ptReset('shop'))}
    ${sub(PT('Kreativzeit (Avatar, Buch, Musik, Insel, Wesen)', 'Creative time (avatar, book, music, island, creatures)'))}
    ${ptRow(PT('Kreativzeit', 'Creative time'), PT('Kreativzeit gibt es immer erst <b>nach dem Üben</b>: Tagesziel oder eine fertige Stufe öffnet ein Zeitfenster. „Gesperrt“ = nur ansehen, auch nach dem Üben.', 'Creative time always comes <b>after practice</b>: the daily goal or a finished Stufe opens a time window. “Locked” = view only, even after practice.'), ptSel('cfgCrMode', [['after', PT('Nach dem Üben', 'After practice')], ['locked', PT('Gesperrt', 'Locked')]], creativeMode()))}
    ${ptRow(PT('Dauer und Anzahl', 'Length and count'), PT('Wie lange ein Zeitfenster dauert und wie oft es sich pro Tag öffnet.', 'How long a window lasts and how often it opens per day.'), ptSel('cfgCrMin', [3, 5, 10, 15, 20].map(n => [n, ptMin(n)]), S.cfg.creativeMin || 5) + ptSel('cfgCrMax', [1, 2, 3].map(n => [n, PT(n + '× pro Tag', n + '× per day')]), S.cfg.creativeMax || 2))}
    ${ptRow(PT('Heute', 'Today'), PT(`Verdient: ${cr.grants}× · genutzt ${Math.round((cr.used || 0) / 60)} Min · übrig ${fmtT(cr.left || 0)}.`, `Earned: ${cr.grants}× · used ${Math.round((cr.used || 0) / 60)} min · left ${fmtT(cr.left || 0)}.`), ptReset('cr', PT('Kreativzeit zurücksetzen', 'Reset creative time')))}
    ${ptRow(PT('Bonus-Kreativzeit', 'Bonus creative time'), bonusDone ? PT('Der Bonus für heute ist schon vergeben (höchstens 1× pro Tag).', 'Today’s bonus has already been given (once per day at most).') : (today >= needBonus ? PT(`Einmal pro Tag möglich, weil schon ${today} Aufgaben geübt wurden. Gibt ${S.cfg.creativeMin || 5} Minuten.`, `Possible once a day because ${today} tasks were practised. Gives ${S.cfg.creativeMin || 5} minutes.`) : PT(`Erst möglich, wenn heute mindestens ${needBonus} Aufgaben geübt wurden (jetzt ${today}).`, `Only possible once at least ${needBonus} tasks were practised today (now ${today}).`)), `<button class="btn sm sec" data-act="crGrant" ${bonusDone || today < needBonus ? 'disabled' : ''}>${PT('Bonus geben', 'Give bonus')}</button>`)}
    ${ptRow(PT('Alle Zeiten von heute', 'All of today’s times'), PT('Setzt Tageslimit, Seitenzeiten (und Sperren), Shop-Zeit und Kreativzeit für heute auf Anfang.', 'Sets daily limit, page times (and locks), shop time and creative time back to the start of today.'), ptReset('all', PT('Alles zurücksetzen', 'Reset all')))}
    ${sub(PT('Weiteres', 'More'))}
    <div class="cfg" style="display:block"><b>${PT('Kapitel-Termine', 'Chapter deadlines')}</b><br><span class="small mute">${PT('Bis wann soll das Kapitel fertig sein? Vorgeschlagen ist der letzte Schultag vor den Ferien in Niedersachsen. Du kannst jedes Datum ändern.', 'When should the chapter be finished? The suggestion is the last school day before the school holidays in Lower Saxony (Niedersachsen). You can change any date.')}</span>
      <div class="row wrap" style="margin-top:8px">${CHAPTERS.map(c => { const fe = ferienFor(c); return `<label class="small">${c.id} (${PT(c.season, PT_SEASON[c.season])})<br><input type="date" class="txt" id="due_${c.id}" value="${dueOf(c)}">${fe ? `<br><span class="mute">${PT('Ferien', 'Holidays')}: ${ptDate(fe.start)} – ${ptDate(fe.end)}</span>` : ''}</label>`; }).join('')}<button class="btn sm sec" data-act="dueReset">${PT('Auf Ferien-Vorschlag', 'Use holiday suggestion')}</button></div></div>
    ${ptRow(PT('Töne &amp; Musik', 'Sounds &amp; music'), PT('Schaltet alle Töne der App aus (auch die Musik-Werkstatt). Das Kind kann das auch selbst auf der Startseite.', 'Turns off all sounds in the app (also the music workshop). Your child can also do this on the start screen.'), ptSw(S.cfg.sound !== false, 'toggleSound', null, PT('Töne', 'Sounds')))}
    ${ptRow(PT('Notenheft: Ton-Knopf', 'Music book: sound button'), PT('An = kurzer Klavierton beim Antippen und Abspielen, mit Lautsprecher-Knopf. Aus = das Notenheft bleibt still und der Knopf ist ausgeblendet.', 'On = a short piano tone when tapping and playing notes, with a speaker button. Off = the music book stays silent and the button is hidden.'), ptSw(S.cfg.noTone !== false, 'noToneSw', null, PT('Notenheft Ton', 'Music book sound')))}
    ${ptRow(PT('Notenheft: Abspielen-Knopf', 'Music book: play button'), PT('An = Lieder abspielen (mit Tempo). Aus = Lieder können geschrieben, aber nicht abgespielt werden.', 'On = play songs (with tempo). Off = songs can be written but not played.'), ptSw(S.cfg.noPlay !== false, 'noPlaySw', null, PT('Notenheft Abspielen', 'Music book play')))}
    ${ptRow('PIN', PT('Schützt diesen Bereich, das Zurücksetzen von Gruppen und das Verlängern des Tageslimits.', 'Protects this area, resetting groups and extending the daily limit.'), `<button class="btn sm sec" data-act="pinChange">${PT('PIN ändern', 'Change PIN')}</button>`)}
  </div>
  <div class="card" style="margin-top:12px"><h3>${PT('Überblick', 'Overview')}</h3><p>${PT('Stufe', 'Level')} ${L.n} (${L.title}) · ${S.stats.q} ${PT('Aufgaben', 'tasks')} · ${S.stats.q ? Math.round(S.stats.c / S.stats.q * 100) : 0} % ${PT('gleich richtig', 'right first time')} · ${PT('Serie', 'streak')} ${streakNow()} ${PT('Tag(e)', 'day(s)')} · ${S.mistakes.length} ${PT('im Fehler-Heft', 'in the mistakes book')} · ${Object.keys(S.cards).length} ${PT('Karten', 'cards')} · ${stampCount()} ${PT('Stempel', 'stamps')} · ${(S.songs || []).length} ${PT('Beats', 'beats')} · ${PT('Kreativzeit heute', 'Creative time today')}: ${Math.round((cr.used || 0) / 60)} min · ${PT('Shop heute', 'Shop today')}: ${Math.floor((S.daily.shopSec || 0) / 60)} min</p>
  ${weak.length ? `<p><b>${PT('Das sollte noch geübt werden:', 'Still needs practice:')}</b> ${weak.join(', ')}</p>` : `<p class="mute small">${PT('Schwache Themen werden angezeigt, sobald genug Aufgaben gelöst wurden.', 'Weak topics appear once enough tasks have been solved.')}</p>`}</div>
  <div class="card" style="margin-top:12px"><h3>${PT('Gruppen', 'Groups')}</h3><div style="overflow-x:auto"><table class="tbl"><tr><th>${PT('Gruppe', 'Group')}</th><th>${PT('Fortschritt', 'Progress')}</th><th>${PT('Punkte', 'Points')}</th><th>${PT('1. Versuch', '1st try')}</th><th>${PT('Medaille', 'Medal')}</th></tr>${rows.join('')}</table></div></div>
  <div class="grid" style="margin-top:12px"><div class="card"><h3>${PT('Letzte Tage', 'Recent days')}</h3>${days.length ? `<table class="tbl">${days.map(d => `<tr><td>${d}</td><td>${S.log[d].n} ${PT('Aufgaben', 'tasks')}</td><td>${S.log[d].c} ${PT('gleich richtig', 'right first time')}</td></tr>`).join('')}</table>` : `<p class="mute">${PT('Noch nichts.', 'Nothing yet.')}</p>`}</div>
  <div class="card"><h3>${PT('Mini-Tests', 'Mini tests')}</h3>${tests.length ? `<table class="tbl">${tests.map(t => `<tr><td>${new Date(t.ts).toLocaleDateString(de ? 'de-DE' : 'en-GB')}</td><td>${t.score} / ${t.total}</td><td>${fmtT(t.secs)} min</td></tr>`).join('')}</table>` : `<p class="mute">${PT('Noch kein Test.', 'No test yet.')}</p>`}</div></div>
  <div class="card noprint" style="margin-top:12px"><h3>${PT('Daten &amp; Sicherung', 'Data &amp; backup')}</h3>
    <p class="small">${PT('Der Fortschritt wird <b>nie von der App gelöscht</b>. Er geht nur verloren, wenn die Browserdaten (Cookies / Websitedaten) gelöscht werden. Er liegt doppelt im Browser. Zusätzlich kann man hier eine Sicherungsdatei speichern (z. B. in die Cloud) und später wieder laden. Die Datei immer im selben Browser öffnen und nicht im privaten Modus.', 'The app <b>never deletes progress</b>. It is only lost if the browser data (cookies / site data) is cleared. It is stored twice in the browser. You can also save a backup file here (e.g. to the cloud) and load it later. Always open the file in the same browser, not in private mode.')}</p>
    <p class="small mute">${PT('Letzte Sicherung', 'Last backup')}: ${S.lastBackup ? new Date(S.lastBackup).toLocaleDateString(de ? 'de-DE' : 'en-GB') : PT('noch nie', 'never')}</p>
    <div class="row wrap"><button class="btn sm" data-act="export">💾 ${PT('Sichern', 'Back up')}</button><label class="btn sm sec" style="cursor:pointer">📂 ${PT('Laden', 'Load')}<input type="file" id="impFile" accept=".json,application/json" class="hide"></label></div>
    <textarea class="txt hide" id="expTxt" readonly style="margin-top:10px"></textarea>
    ${persistOK ? '' : `<p class="small" style="color:var(--bad)">${PT('In diesem Browser kann gerade nichts dauerhaft gespeichert werden (privater Modus?).', 'Nothing can be saved permanently in this browser right now (private mode?).')}</p>`}</div>`;
};


/* ---- Bereiche & Freigaben (je Haupt- und Unterbereich: Auto/Offen/Zu, Zeit zurücksetzen, +5 Min) ---- */
const ptPermSeg = (id, label) => { const v = permGet(id) || 'auto';
  return `<div class="seg ptperm" role="group" aria-label="${esc(label)}">${[['auto', 'Auto', 'Auto'], ['open', 'Offen', 'Open'], ['lock', 'Zu', 'Locked']].map(o => `<button class="${v === o[0] ? 'on' : ''}" data-act="permSetAct" data-arg="${id}|${o[0]}" aria-pressed="${v === o[0]}">${PT(o[1], o[2])}</button>`).join('')}</div>`; };
function ptAreaState(id, free, parentId) {
  const own = permGet(id), eff = own || (parentId ? permGet(parentId) : '');
  if (eff === 'lock') return PT('Zu', 'Locked') + (own ? '' : PT(' (wie Hauptbereich)', ' (from main area)'));
  if (eff === 'open') return PT('Immer offen, ohne Zeitgrenze', 'Always open, no time limit') + (own ? '' : PT(' (wie Hauptbereich)', ' (from main area)'));
  if (free) return PT('Immer offen (normale Regel)', 'Always open (normal rule)');
  return '';
}
function ptAreaBlock(m) {
  const timed = !m.free, used = timed ? m.subs.reduce((a, x) => a + rgAreaUsed(x[0]), 0) : 0;
  const st = ptAreaState(m.id, m.free) || PT(`Heute genutzt: ${fmtT(used)} (alle Unterbereiche)`, `Used today: ${fmtT(used)} (all sub-areas)`);
  const tbtn = (act, arg) => timed ? `<button class="btn sm sec" data-act="${act}Reset" data-arg="${arg}">${PT('Zurücksetzen', 'Reset')}</button><button class="btn sm sec" data-act="${act}Ext" data-arg="${arg}">+5 ${PT('Min', 'min')}</button>` : '';
  const subRow = x => { const used2 = rgAreaUsed(x[0]), cap = rgAreaCap(x[0]), st2 = ptAreaState(x[0], m.free, m.id) || PT(`${fmtT(used2)} von ${fmtT(cap)} heute`, `${fmtT(used2)} of ${fmtT(cap)} today`);
    return `<div class="ptarea sub"><div class="ptarea-t"><b>${esc(PT(x[1], x[2]))}</b><span class="small mute">${st2}</span></div><div class="ptarea-c">${ptPermSeg(x[0], PT(x[1], x[2]))}${tbtn('ptSub', x[0])}</div></div>`; };
  return `<div class="ptblock" data-sec="${m.id}"><div class="ptarea main"><div class="ptarea-t"><b>${esc(PT(m.de, m.en))}</b><span class="small mute">${st}</span></div><div class="ptarea-c">${ptPermSeg(m.id, PT(m.de, m.en))}${tbtn('ptMain', m.id)}</div></div>
    <details class="ptsubs" ${UI.ptOpen && UI.ptOpen[m.id] ? 'open' : ''} data-sec="${m.id}"><summary>${PT('Unterbereiche', 'Sub-areas')} (${m.subs.length})</summary>${m.subs.map(subRow).join('')}</details></div>`;
}
document.addEventListener('toggle', e => { const d = e.target; if (d && d.classList && d.classList.contains('ptsubs')) { UI.ptOpen = UI.ptOpen || {}; UI.ptOpen[d.dataset.sec] = d.open; } }, true);

/* ---- Aktionen ---- */
function resetTime(what) {
  touchDay(); const d = S.daily;
  if (what === 'limit' || what === 'all') { d.sec = 0; d.unlocked = false; }
  if (what === 'shop' || what === 'all') d.shopSec = 0;
  if (what === 'cr' || what === 'all') d.cr = { left: 0, grants: 0, used: 0, lvl: false, goal: false };
  if (what === 'pg' || what === 'all') d.pg = {};
  if (what === 'all') { d.lock = { all: false, pages: {} }; d.free = 0; d.freeMsg = false; d.rg = { tot: 0, a: {} }; }
  save();
}
Object.assign(ACT, {
  plang: l => { S.cfg.plang = l === 'en' ? 'en' : 'de'; save(); render(); },
  rstTime: w => { resetTime(w); toast('↩️', PT('Zeit zurückgesetzt', 'Time reset')); render(); },
  hwUnlock: () => { hwForceDone(true); toast('🔓', PT('Heute freigegeben', 'Unlocked for today')); render(); },
  hwReset: () => { hwForceDone(false); toast('🔒', PT('Wieder gesperrt', 'Locked again')); render(); },
  freeResetAct: () => { freeReset(); toast('↩️', PT('Freie Zeit zurückgesetzt', 'Free time reset')); render(); },
  permSetAct: a => { const [id, v] = String(a).split('|'); permSet(id, v); toast(v === 'lock' ? '🔒' : v === 'open' ? '🔓' : '↩️', v === 'lock' ? PT('Gesperrt', 'Locked') : v === 'open' ? PT('Geöffnet', 'Opened') : PT('Automatisch', 'Automatic')); render(); },
  ptMainReset: id => { const m = SEC_TREE().find(x => x.id === id); if (m) m.subs.forEach(x => rgResetArea(x[0])); toast('↩️', PT('Zeit zurückgesetzt', 'Time reset')); render(); },
  ptMainExt: () => { rgExtendAll(5 * 60); toast('➕', PT('5 Minuten dazu (gesamt)', '5 minutes added (total)')); render(); },
  ptSubReset: a => { rgResetArea(a); toast('↩️', PT('Zeit zurückgesetzt', 'Time reset')); render(); },
  ptSubExt: a => { rgExtendArea(a, 5 * 60); toast('➕', PT('5 Minuten dazu', '5 minutes added')); render(); },
  rgResetAllAct: () => { rgResetAll(); toast('↩️', PT('Zeit zurückgesetzt', 'Time reset')); render(); },
  rgExtendAllAct: () => { rgExtendAll(5 * 60); toast('➕', PT('5 Minuten dazu', '5 minutes added')); render(); },
  rgResetAreaAct: a => { rgResetArea(a); toast('↩️', PT('Zeit zurückgesetzt', 'Time reset')); render(); },
  rgExtendAreaAct: a => { rgExtendArea(a, 5 * 60); toast('➕', PT('5 Minuten dazu', '5 minutes added')); render(); },
  dueReset: () => { S.cfg.due = {}; save(); toast('✅', PT('Termine: Ferien-Vorschlag', 'Deadlines: holiday suggestion')); render(); },
  crGrant: () => {
    touchDay(); const c = S.daily.cr, need = Math.min(10, S.cfg.goal || 20);
    if (c.bonus) return toast('⚠️', PT('Der Bonus für heute ist schon vergeben.', 'Today’s bonus has already been given.'));
    if ((S.daily.n || 0) < need) return toast('⚠️', PT(`Erst nach ${need} geübten Aufgaben.`, `Only after ${need} practised tasks.`));
    c.bonus = true; c.left += Math.max(1, S.cfg.creativeMin || 5) * 60; save(); toast('🎨', PT('Bonus-Kreativzeit vergeben', 'Bonus creative time given')); render();
  },
  noToneSw: () => { S.cfg.noTone = !(S.cfg.noTone !== false); save(); render(); },
  noPlaySw: () => { S.cfg.noPlay = !(S.cfg.noPlay !== false); save(); render(); },
  dzFlag: id => { S.flags = S.flags || {}; S.flags[id] = !flagOn(id); save(); render(); },
  toggleSound: () => { S.cfg.sound = S.cfg.sound === false; save(); render(); }
});
