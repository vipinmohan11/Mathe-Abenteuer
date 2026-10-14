const APP_BUILD = '__BUILD__';
/* =====================================================================
   ELTERN-BEREICH (PIN-geschützt) – zweisprachig: Deutsch / English (nur dieser Bereich; die App für das Kind bleibt Deutsch)
   S.cfg.plang = 'de' | 'en'. Texte: PT('deutsch', 'english').
   Inhalt: Nutzer (Kind/Admin) · Namen · Zusatzfunktionen (Schalter) · Zeit & Zugriff · Lernen · Funktionen · Statistik · Termine · Ton · PIN · Überblick · Sicherung
   ===================================================================== */
const PT = (de, en) => (S.cfg && S.cfg.plang === 'en') ? en : de;
const PT_SEASON = { Herbstferien: 'Autumn break', Weihnachtsferien: 'Christmas break', Osterferien: 'Easter break', Sommerferien: 'Summer break' };
const PT_FLAG = { wesen: ['Meine Wesen', 'Eier ausbrüten und Wesen sammeln', 'My Creatures', 'Hatch eggs and collect creatures'], buch: ['Mein Buch', 'Sticker sammeln und einkleben', 'My Book', 'Collect stickers and stick them in'], insel: ['Meine Insel', 'Eine eigene Insel gestalten', 'My Island', 'Design your own island'], sudoku: ['Sudoku', 'Zahlenrätsel mit Wochenrätsel', 'Sudoku', 'Number puzzles with a weekly puzzle'], venola: ['Venola Holmes', 'Geheimschriften und Kriminalfälle', 'Venola Holmes', 'Secret codes and detective cases'], licht: ['Blinkis Lichterturm', 'Mit Lampen sprechen: spielerisch verstehen, wie Computer mit 0 und 1 zählen (Binärzahlen)', 'Blinki’s Light Tower', 'Talking with lamps: a playful way to understand how computers count with 0 and 1 (binary)'] };
const ptDate = iso => { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || ''); return m ? (S.cfg.plang === 'en' ? `${m[3]}/${m[2]}/${m[1]}` : `${m[3]}.${m[2]}.${m[1]}`) : ''; };
const ptSw = (on, act, arg, label) => `<button class="sw ${on ? 'on' : ''}" role="switch" aria-checked="${on}" aria-label="${esc(label)}" data-act="${act}"${arg == null ? '' : ` data-arg="${esc(arg)}"`}><span class="sw-k"></span><span class="sw-t">${on ? PT('AN', 'ON') : PT('AUS', 'OFF')}</span></button>`;
const ptSel = (id, opts, val) => `<select id="${id}" class="txt noprint" aria-label="${esc(ptSelectLabel(id))}">${opts.map(o => `<option value="${o[0]}" ${String(o[0]) === String(val) ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`;
const ptRow = (title, sub, ctl) => `<div class="cfg"><div><b>${title}</b>${sub ? `<br><span class="small mute">${sub}</span>` : ''}</div><div class="row">${ctl}</div></div>`;

const ptMin = n => PT(`${n} Min`, `${n} min`);
const ptSelectLabel = id => ({ cfgGoal: PT('Tagesziel', 'Daily goal'), cfgLimit: PT('Tageslimit für Üben', 'Daily practice limit'), cfgShop: PT('Shop-Zeit pro Tag', 'Daily shop time'), cfgCrMode: PT('Kreativzeit', 'Creative time'), cfgCrMin: PT('Minuten je Zeitfenster', 'Minutes per session'), cfgCrMax: PT('Zeitfenster pro Tag', 'Sessions per day'), ptTimeTarget: PT('Zusatzzeit für', 'Extra time for'), ptTimeMinutes: PT('Zusätzliche Minuten', 'Additional minutes') })[id] || id;
const PT_TABS = [['time', 'Zeit & Zugriff', 'Time & access'], ['learning', 'Lernen', 'Learning'], ['features', 'Funktionen', 'Features'], ['stats', 'Statistik', 'Statistics']];
const ptCard = (title, content, sub = '') => `<section class="card pt-card"><h3>${title}</h3>${sub ? `<p class="pt-description">${sub}</p>` : ''}${content}</section>`;
function ptGlobal() {
  const de = S.cfg.plang !== 'en';
  const language = `<div class="seg" role="group" aria-label="Language / Sprache">${[['de','DE'],['en','EN']].map(([id,label]) => `<button class="${S.cfg.plang===id?'on':''}" data-act="plang" data-arg="${id}" aria-pressed="${S.cfg.plang===id}">${label}</button>`).join('')}</div>`;
  const user = `<div class="seg" role="group" aria-label="${PT('Nutzer','User')}"><button class="${ADMIN?'':'on'}" ${ADMIN?'data-act="adminOff"':''} aria-pressed="${!ADMIN}">${PT('Kind','Child')}</button><button class="${ADMIN?'on':''}" ${ADMIN?'':'data-act="adminAsk"'} aria-pressed="${ADMIN}">Admin</button></div>`;
  return `<div class="pt-global noprint"><div class="pt-global-bar"><div class="pt-global-group"><span class="pt-global-label">${PT('Nutzer','User')}</span>${user}${language}</div><div class="pt-global-actions"><button class="btn sm sec" data-act="ptUpdate">${ico('download',16)} Update</button><button class="btn sm" data-act="export">${ico('save',16)} ${PT('Backup speichern','Save backup')}</button></div></div>
  <details class="pt-global-more" ${UI.ptGlobalOpen?'open':''}><summary>${PT('Profil, PIN & Daten','Profile, PIN & data')}<span>${esc(S.name || PT('Kein Name','No name'))} · Version ${APP_BUILD}</span></summary>
  ${ptRow(PT('Name des Kindes','Child’s name'), PT('Gilt auch für den Avatar.','Also used for the avatar.'), `<input class="txt" id="nameIn" aria-label="${PT('Name des Kindes','Child’s name')}" maxlength="20" value="${esc(S.name)}"><button class="btn sm" data-act="saveName">${PT('Speichern','Save')}</button>`)}
  ${ptRow('PIN', PT('Schützt die Eltern-Einstellungen.','Protects parent settings.'), `<button class="btn sm sec" data-act="pinChange">${PT('PIN ändern','Change PIN')}</button>`)}
  ${ptRow(PT('Backup wiederherstellen','Restore backup'), PT('Lädt eine gespeicherte Sicherungsdatei.','Loads a saved backup file.'), `<label class="btn sm sec">${PT('Datei auswählen','Choose file')}<input type="file" id="impFile" accept=".json,application/json" class="hide"></label>`)}
  <p class="small mute">${PT('Letztes Backup','Last backup')}: ${S.lastBackup?new Date(S.lastBackup).toLocaleDateString(de?'de-DE':'en-GB'):PT('noch keines','none yet')}. ${PT('Der Lernstand wird automatisch auf diesem Gerät gespeichert.','Progress is saved automatically on this device.')}</p>
  <p class="small mute">${ADMIN?PT('Admin nutzt eigene Testdaten. Der Stand des Kindes bleibt erhalten.','Admin uses separate test data. Your child’s progress is preserved.'):PT('Admin öffnet einen eigenen Testspeicher.','Admin opens a separate test profile.')}</p>${persistOK?'':`<p class="text-destructive">${PT('Dauerhaftes Speichern ist in diesem Browser gerade nicht möglich.','Persistent storage is currently unavailable in this browser.')}</p>`}</details><textarea class="txt hide" id="expTxt" readonly aria-label="Backup JSON"></textarea></div>`;
}
function ptRepresentative(id) { return ({ minitest:'testSetup', KOPF:'kopf', geoCards:'geoCards' })[id] || id; }
function ptRemaining(id) {
  if (id==='practice') { const t=parentTimeData(); if(t.practiceLocked) return 0; return !S.cfg.limitMin || S.daily.unlocked ? Infinity : Math.max(0,S.cfg.limitMin*60+(t.practice||0)-S.daily.sec); }
  const v=ptRepresentative(id), pm=permOf(v);
  if(pm==='lock'||parentTimeLocked(v)) return 0;
  if(ADMIN||pm==='open') return Infinity;
  const a=pgArea(v), base=a?pgState(a):{open:true,left:Infinity};
  const F=featOf(v); if(F&&F.creative&&creativeMode()==='locked') return 0;
  return parentNormalLeft(v,base)+parentBonusLeft(v);
}
const ptTimeText = sec => sec===Infinity ? PT('Ohne Zeitlimit','No time limit') : `${fmtT(Math.max(0,sec))} ${PT('übrig','left')}`;
function ptCanAdd(id) {
  if(ADMIN) return false;
  if(!['shared','practice'].includes(id) && !SEC_TREE().some(m=>m.subs.some(x=>x[0]===id))) return false;
  if(id==='shared') return !parentTimeData().sharedLocked;
  if(id==='practice') return !parentTimeData().practiceLocked && ptRemaining(id)!==Infinity;
  const v=ptRepresentative(id), F=featOf(v);
  return permOf(v)!=='lock' && !parentTimeLocked(v) && !(F&&F.creative&&creativeMode()==='locked') && ptRemaining(id)!==Infinity;
}
function ptTimeActions(id, showGive = true) {
  const t=parentTimeData(), paused=id==='shared'?t.sharedLocked:id==='practice'?t.practiceLocked:t.locks[id];
  const bonus=id==='shared'?(t.shared||0):id==='practice'?(t.practice||0):(t.areas[id]||0);
  return `<div class="pt-time-actions">${showGive ? `<button class="btn sm" data-act="ptGiveTime" data-arg="${id}|5" ${ptCanAdd(id)?'':'disabled'}>+5 ${PT('Min heute','min today')}</button>` : ''}<button class="btn sm sec" data-act="ptPauseTime" data-arg="${id}|${paused?'off':'on'}">${paused?PT('Heute wieder öffnen','Resume today'):PT('Heute sperren','Pause today')}</button>${bonus>0?`<button class="btn sm ghost" data-act="ptRevokeTime" data-arg="${id}">${PT('Zusatzzeit streichen','Remove extra time')} (${fmtT(bonus)})</button>`:''}</div>`;
}
const ptPermSeg = (id, label) => { const v=permGet(id)||'auto';return `<div class="seg ptperm" role="group" aria-label="${esc(label)}">${[['auto','Regeln','Rules'],['open','Unbegrenzt','Unlimited'],['lock','Gesperrt','Locked']].map(o=>`<button class="${v===o[0]?'on':''}" data-act="permSetAct" data-arg="${id}|${o[0]}" aria-pressed="${v===o[0]}">${PT(o[1],o[2])}</button>`).join('')}</div>`; };
function ptAreaState(id, free, parentId) {
  const own=permGet(id), effective=own||(parentId?permGet(parentId):'');
  if(effective==='lock') return PT('Gesperrt bis zur Änderung','Locked until changed');
  if(effective==='open') return PT('Unbegrenzt bis zur Änderung','Unlimited until changed');
  return free?PT('Normalerweise ohne Hausaufgaben-Sperre','Normally no homework gate'):PT('Normale Tagesregeln','Normal daily rules');
}
function ptAreaBlock(m) {
  const rows=m.subs.map(x=>{const v=ptRepresentative(x[0]), F=featOf(v), timed=!m.free||!!(F&&F.creative), t=parentTimeData();return `<div class="ptarea sub"><div class="ptarea-t"><b>${esc(PT(x[1],x[2]))}</b><span class="small mute">${ptTimeText(ptRemaining(x[0]))}${t.locks[x[0]]?PT(' · heute pausiert',' · paused today'):''}${t.areas[x[0]]?` · ${fmtT(t.areas[x[0]])} ${PT('Zusatzzeit','extra time')}`:''}</span></div><div class="ptarea-c">${ptPermSeg(x[0],PT(x[1],x[2]))}</div>${timed?ptTimeActions(x[0]):''}</div>`;}).join('');
  return `<div class="ptblock" data-sec="${m.id}"><div class="ptarea main"><div class="ptarea-t"><b>${esc(PT(m.de,m.en))}</b><span class="small mute">${ptAreaState(m.id,m.free)}</span></div><div class="ptarea-c">${ptPermSeg(m.id,PT(m.de,m.en))}</div></div><details class="ptsubs" ${UI.ptOpen&&UI.ptOpen[m.id]?'open':''} data-sec="${m.id}"><summary>${PT('Unterbereiche & heutige Zeit','Sub-areas & today’s time')} (${m.subs.length})</summary>${rows}</details></div>`;
}
function ptTimePage() {
  const hw=hwInfo(), t=parentTimeData(), targets=[['shared',PT('Profil & Meine Welt gemeinsam','Profile & My World together')],['practice',PT('Üben','Practice')]].concat(SEC_TREE().flatMap(m=>m.subs.filter(x=>!m.free||!!((featOf(ptRepresentative(x[0]))||{}).creative)).map(x=>[x[0],PT(x[1],x[2])])));
  return ptCard(PT('Mehr Zeit für heute','More time for today'), `<div class="pt-grant-form"><label>${PT('Für','For')}${ptSel('ptTimeTarget',targets,UI.ptTimeTarget||'shared')}</label><label>${PT('Zusätzlich','Additional')}${ptSel('ptTimeMinutes',[1,5,10,15,30].map(n=>[n,ptMin(n)]),UI.ptTimeMinutes||5)}</label><button class="btn" data-act="ptGiveSelected">${PT('Zeit geben','Give time')}</button></div><p class="pt-note">${PT('Zusatzzeit zählt ab jetzt zusätzlich. Verbrauch und Lernstatistik werden nicht zurückgesetzt. Sie endet automatisch um Mitternacht. Gesperrte Bereiche bleiben gesperrt.','Extra time is added to the remaining allowance. Usage and learning statistics are kept. It expires at midnight. Locked areas stay locked.')}</p><div class="pt-balance"><span>${PT('Gemeinsame Zusatzzeit noch verfügbar','Shared extra time remaining')}</span><strong>${fmtT(t.shared||0)}</strong>${t.sharedLocked?`<span class="tag">${PT('Heute pausiert','Paused today')}</span>`:''}</div>${ptTimeActions('shared', false)}`)
  +ptCard(PT('Bereiche öffnen oder sperren','Open or lock areas'), `<p class="pt-note">${PT('Regeln = normale Einstellungen. Unbegrenzt = ohne Zeitlimit. Gesperrt = bis du es änderst. Eine eigene Einstellung im Unterbereich hat Vorrang. „Heute sperren“ endet um Mitternacht.','Rules = normal settings. Unlimited = no time limit. Locked = until you change it. A sub-area’s own setting takes priority. “Pause today” ends at midnight.')}</p><div class="ptareas">${SEC_TREE().map(ptAreaBlock).join('')}</div>`)
  +ptCard(PT('Üben & normale Zeitregeln','Practice & normal time rules'), `${ptRow(PT('Tageslimit (Üben)','Daily limit (practice)'), `${PT('Heute','Today')}: ${ptTimeText(ptRemaining('practice'))} · ${PT('Genutzt','Used')}: ${fmtT(S.daily.sec||0)}`,ptSel('cfgLimit',[[0,PT('Kein Limit','No limit')],[15,ptMin(15)],[20,ptMin(20)],[30,ptMin(30)],[45,ptMin(45)],[60,ptMin(60)],[90,ptMin(90)]],S.cfg.limitMin))}${ptTimeActions('practice')}
  <details class="pt-rule-details"><summary>${PT('Weitere normale Zeitregeln','More normal time rules')}</summary><p class="pt-note">${PT('Profil & Meine Welt: zuerst 4 freie Minuten. Nach 25 Aufgaben oder 20 Minuten Üben: 5 Minuten je Bereich, 10 Minuten gemeinsam. Zusatzzeit ist ein eigener Vorrat, der auch bei aufgebrauchten normalen Minuten genutzt werden kann.','Profile & My World: first 4 free minutes. After 25 tasks or 20 practice minutes: 5 minutes per area, 10 minutes together. Extra time is a separate allowance usable even when normal minutes are exhausted.')}</p>
  ${ptRow(PT('Hausaufgaben heute','Homework today'),`${hw.n}/${hw.need} ${PT('Aufgaben','tasks')} · ${fmtT(hw.sec)}/${fmtT(hw.needSec)}`,hw.done?`<span class="tag on">${PT('Erledigt','Completed')}</span>`:`<button class="btn sm sec" data-act="hwUnlock">${PT('Für heute anerkennen','Approve for today')}</button>`)}
  ${ptRow(PT('Shop-Zeit pro Tag','Daily shop time'),PT('Zusätzlich zu den Regeln für Meine Welt.','In addition to the My World rules.'),ptSel('cfgShop',[[0,PT('Unbegrenzt','Unlimited')],[3,ptMin(3)],[5,ptMin(5)],[10,ptMin(10)]],S.cfg.shopMin==null?5:S.cfg.shopMin))}
  ${ptRow(PT('Kreativzeit','Creative time'),PT('Zusatzzeit kann ein geöffnetes Kreativangebot verlängern.','Extra time can extend an enabled creative activity.'),ptSel('cfgCrMode',[['after',PT('Nach dem Üben','After practice')],['locked',PT('Gesperrt','Locked')]],creativeMode()))}
  ${ptRow(PT('Zeitfenster','Sessions'),PT('Minuten je Zeitfenster und Anzahl pro Tag.','Minutes per session and sessions per day.'),ptSel('cfgCrMin',[3,5,10,15,20].map(n=>[n,ptMin(n)]),S.cfg.creativeMin||5)+ptSel('cfgCrMax',[1,2,3].map(n=>[n,PT(n+'× pro Tag',n+'× per day')]),S.cfg.creativeMax||2))}</details>`);
}
function ptLearningPage() {
  return ptCard(PT('Lernziel','Learning goal'),ptRow(PT('Tagesziel','Daily goal'),PT('Aufgaben pro Tag. Heute erledigt: ','Tasks per day. Completed today: ')+S.daily.n,ptSel('cfgGoal',[10,15,20,25,30,40,50].map(n=>[n,PT(n+' Aufgaben',n+' tasks')]),S.cfg.goal)))
  +ptCard(PT('Kapitel-Termine','Chapter deadlines'),`<div class="pt-deadlines">${CHAPTERS.map(c=>{const fe=ferienFor(c);return `<label><b>${PT(c.season,PT_SEASON[c.season])} · ${c.id}</b><input type="date" class="txt" id="due_${c.id}" value="${dueOf(c)}">${fe?`<small>${PT('Ferien','Holidays')}: ${ptDate(fe.start)} – ${ptDate(fe.end)}</small>`:''}</label>`;}).join('')}</div><button class="btn sm sec" data-act="dueReset">${PT('Ferien-Vorschläge verwenden','Use holiday suggestions')}</button>`,PT('Jeder Termin kann angepasst werden.','Every deadline can be adjusted.'));
}
function ptFeaturesPage() {
  return ptCard(PT('Sichtbare Zusatzfunktionen','Visible extra features'),DZ_FLAGS.map(f=>{const text=PT_FLAG[f.id],on=flagOn(f.id);return ptRow(PT(text[0],text[2]),PT(text[1],text[3]),ptSw(on,'dzFlag',f.id,PT(text[0],text[2])));}).join(''),PT('Ausblenden bewahrt alle Fortschritte. Fortschritte findest du unter Statistik.','Hiding keeps all progress. View progress in Statistics.'))
  +ptCard(PT('Töne & Notenheft','Sounds & music book'),ptRow(PT('Alle App-Töne','All app sounds'),'',ptSw(S.cfg.sound!==false,'toggleSound',null,PT('Töne','Sounds')))+ptRow(PT('Notenheft: Ton-Knopf','Music book: sound button'),'',ptSw(S.cfg.noTone!==false,'noToneSw',null,PT('Notenheft Ton','Music book sound')))+ptRow(PT('Notenheft: Abspielen','Music book: playback'),'',ptSw(S.cfg.noPlay!==false,'noPlaySw',null,PT('Notenheft Abspielen','Music book playback'))));
}
function ptStatisticsPage() {
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
  return `<div class="pt-stat-tools"><button class="btn sm sec" data-act="print">${PT('Statistik drucken','Print statistics')}</button></div>` + `  <div class="card" style="margin-top:12px"><h3>${PT('Überblick', 'Overview')}</h3><p>${PT('Stufe', 'Level')} ${L.n} (${L.title}) · ${S.stats.q} ${PT('Aufgaben', 'tasks')} · ${S.stats.q ? Math.round(S.stats.c / S.stats.q * 100) : 0} % ${PT('gleich richtig', 'right first time')} · ${PT('Serie', 'streak')} ${streakNow()} ${PT('Tag(e)', 'day(s)')} · ${S.mistakes.length} ${PT('im Fehler-Heft', 'in the mistakes book')} · ${Object.keys(S.cards).length} ${PT('Karten', 'cards')} · ${stampCount()} ${PT('Stempel', 'stamps')} · ${(S.songs || []).length} ${PT('Beats', 'beats')} · ${PT('Kreativzeit heute', 'Creative time today')}: ${Math.round((cr.used || 0) / 60)} min · ${PT('Shop heute', 'Shop today')}: ${Math.floor((S.daily.shopSec || 0) / 60)} min</p>
  ${weak.length ? `<p><b>${PT('Das sollte noch geübt werden:', 'Still needs practice:')}</b> ${weak.join(', ')}</p>` : `<p class="mute small">${PT('Schwache Themen werden angezeigt, sobald genug Aufgaben gelöst wurden.', 'Weak topics appear once enough tasks have been solved.')}</p>`}</div>
  <div class="card" style="margin-top:12px"><h3>${PT('Gruppen', 'Groups')}</h3><div style="overflow-x:auto"><table class="tbl"><tr><th>${PT('Gruppe', 'Group')}</th><th>${PT('Fortschritt', 'Progress')}</th><th>${PT('Punkte', 'Points')}</th><th>${PT('1. Versuch', '1st try')}</th><th>${PT('Medaille', 'Medal')}</th></tr>${rows.join('')}</table></div></div>
  <div class="grid" style="margin-top:12px"><div class="card"><h3>${PT('Letzte Tage', 'Recent days')}</h3>${days.length ? `<table class="tbl">${days.map(d => `<tr><td>${d}</td><td>${S.log[d].n} ${PT('Aufgaben', 'tasks')}</td><td>${S.log[d].c} ${PT('gleich richtig', 'right first time')}</td></tr>`).join('')}</table>` : `<p class="mute">${PT('Noch nichts.', 'Nothing yet.')}</p>`}</div>
  <div class="card"><h3>${PT('Mini-Tests', 'Mini tests')}</h3>${tests.length ? `<table class="tbl">${tests.map(t => `<tr><td>${new Date(t.ts).toLocaleDateString(de ? 'de-DE' : 'en-GB')}</td><td>${t.score} / ${t.total}</td><td>${fmtT(t.secs)} min</td></tr>`).join('')}</table>` : `<p class="mute">${PT('Noch kein Test.', 'No test yet.')}</p>`}</div></div>
` + `<div class="pt-feature-stats">${typeof vnParentCard==='function'?vnParentCard():''}${typeof ltParentCard==='function'?ltParentCard():''}</div>`;
}
VIEWS.parent = () => {
  touchDay(); const active=PT_TABS.some(t=>t[0]===UI.parentTab)?UI.parentTab:'time';
  const content={time:ptTimePage,learning:ptLearningPage,features:ptFeaturesPage,stats:ptStatisticsPage}[active]();
  return topBar(PT('Eltern','Parents'),'home',`<button class="btn sec pt-notes" data-act="nzOpen" aria-label="${PT('Notizbuch öffnen','Open notebook')}">${ico('notebook',20)}</button>`)+ptGlobal()+`<div class="pt-workspace"><div class="pt-tabs noprint" role="tablist" aria-label="${PT('Eltern-Themen','Parent topics')}">${PT_TABS.map(([id,de,en])=>`<button id="pt-tab-${id}" role="tab" aria-selected="${id===active}" aria-controls="pt-panel" tabindex="${id===active?'0':'-1'}" class="${id===active?'selected':''}" data-act="ptTab" data-arg="${id}">${PT(de,en)}</button>`).join('')}</div><div id="pt-panel" role="tabpanel" aria-labelledby="pt-tab-${active}" class="pt-panel">${UI.ptNotice?`<div class="pt-notice" role="status">${esc(UI.ptNotice)}</div>`:''}${content}</div></div>`;
};
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.classList){if(d.classList.contains('ptsubs')){UI.ptOpen=UI.ptOpen||{};UI.ptOpen[d.dataset.sec]=d.open;}if(d.classList.contains('pt-global-more'))UI.ptGlobalOpen=d.open;}},true);
document.addEventListener('keydown',e=>{const tab=e.target.closest('[role="tab"][data-act="ptTab"]');if(!tab)return;const i=PT_TABS.findIndex(t=>t[0]===tab.dataset.arg);let n=i;if(e.key==='ArrowRight')n=(i+1)%PT_TABS.length;else if(e.key==='ArrowLeft')n=(i+PT_TABS.length-1)%PT_TABS.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=PT_TABS.length-1;else return;e.preventDefault();ACT.ptTab(PT_TABS[n][0]);});

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
  ptUpdate: async () => {
    if (navigator.onLine === false) { toast('📡', PT('Kein Internet – Update geht nur online.', 'No internet – updating needs a connection.')); return; }
    toast('🔄', PT('Suche die neueste Version …', 'Getting the newest version …')); try { save(); if (navigator.serviceWorker) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(r => r.unregister())); } if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); } } catch (e) { }
    location.reload();
  },
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

/* Explicit parent actions: never erase usage or learning counters. */
function ptGiveTime(id, minutes) {
  if(![1,5,10,15,30].includes(minutes)||!ptCanAdd(id)){UI.ptNotice=PT('Öffne den Bereich zuerst. Unbegrenzte Bereiche brauchen keine Zusatzzeit.','Open the area first. Unlimited areas do not need extra time.');render();return;}
  const t=parentTimeData(),sec=minutes*60;
  if(id==='shared')t.shared=(t.shared||0)+sec;
  else if(id==='practice')t.practice=(t.practice||0)+sec;
  else t.areas[id]=(t.areas[id]||0)+sec;
  const name=id==='shared'?PT('Profil & Meine Welt','Profile & My World'):id==='practice'?PT('Üben','Practice'):secName(id); UI.ptNotice=PT(`${name}: ${minutes} zusätzliche Minuten für heute gegeben. Bisheriger Verbrauch bleibt erhalten.`,`${name}: ${minutes} extra minutes granted for today. Existing usage is kept.`);save();render();
}
Object.assign(ACT,{
  ptTab:id=>{if(!PT_TABS.some(t=>t[0]===id))return;UI.parentTab=id;UI.ptNotice='';render();document.getElementById('pt-tab-'+id)?.focus({preventScroll:true});},
  ptGiveSelected:()=>{const id=$('#ptTimeTarget').value,n=+$('#ptTimeMinutes').value;UI.ptTimeTarget=id;UI.ptTimeMinutes=n;ptGiveTime(id,n);},
  ptGiveTime:arg=>{const[id,n]=String(arg).split('|');ptGiveTime(id,+n);},
  ptRevokeTime:id=>{const t=parentTimeData();if(id==='shared')t.shared=0;else if(id==='practice')t.practice=0;else delete t.areas[id];UI.ptNotice=PT('Nur die übrige Zusatzzeit wurde gestrichen. Normale Zeit und Verbrauch bleiben erhalten.','Only the remaining extra time was removed. Normal time and usage are kept.');save();render();},
  ptPauseTime:arg=>{const[id,state]=String(arg).split('|'),t=parentTimeData(),on=state==='on';if(id==='shared')t.sharedLocked=on;else if(id==='practice')t.practiceLocked=on;else if(on)t.locks[id]=true;else delete t.locks[id];UI.ptNotice=on?PT('Für den Rest des Tages gesperrt. Morgen gelten wieder die normalen Regeln.','Paused for the rest of today. Normal rules return tomorrow.'):PT('Heutige Pause aufgehoben. Verbleibende Zeit ist wieder verfügbar.','Today’s pause removed. Remaining time is available again.');save();render();}
});

document.addEventListener('change',e=>{const id=e.target.id;if(view!=='parent')return;if(id==='ptTimeTarget')UI.ptTimeTarget=e.target.value;if(id==='ptTimeMinutes')UI.ptTimeMinutes=+e.target.value;if(/^(cfgGoal|cfgLimit|cfgShop|cfgCrMode|cfgCrMin|cfgCrMax)$/.test(id))render();});
