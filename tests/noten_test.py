"""Notenheft (Musik-Notizbuch): Weg Startseite → Ideenwerkstatt, Eingabe (Notenbild + Buchstaben), Ändern,
Mehrfachauswahl, Kopieren/Einfügen, Rückgängig/Wiederholen, zwei Tonlagen, Farbmodus, mehrere Lieder,
Löschen nur nach Rückfrage, Speichern nach Neuladen, Web-Audio-Wiedergabe (mit Attrappe), Tablet-Layout,
Hausaufgaben-Sperre, kein Netz.
Aufruf: python3 noten_test.py /abs/pfad/Mathe-Abenteuer_Klasse4.html"""
import sys, re, json, pathlib
from playwright.sync_api import sync_playwright
html = sys.argv[1]; fails = []
def ok(c, m):
    print(('OK   ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
FAKE_AUDIO = """
window.__osc=[];window.__gain=0;
class FakeAC{constructor(){this.currentTime=0;this.state='running';this.destination={}}
 resume(){return Promise.resolve()}
 createOscillator(){const o={type:'',frequency:{setValueAtTime(f){o.f=f},value:0},connect(){},start(){window.__osc.push({f:o.f,type:o.type})},stop(){}};return o}
 createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){},value:1},connect(){}}}}
window.AudioContext=FakeAC;window.webkitAudioContext=FakeAC;
"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 800}); errs = []; reqs = []
    pg.add_init_script(FAKE_AUDIO)
    pg.add_init_script('window.__rwOff=1')   # Belohnungs-Fenster nur im eigenen Test
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('request', lambda r: reqs.append(r.url) if not r.url.startswith(('file:', 'data:', 'blob:')) else None)
    pg.goto('file://' + html); pg.wait_for_timeout(300)
    E = pg.evaluate
    V = lambda: E("()=>view")
    N = lambda: E("()=>noSong().notes.length")
    names = lambda: E("()=>noSong().notes.map(n=>n.rest?'-':n.name).join('')")
    sel = lambda: E("()=>JSON.stringify(NO.sel)")
    E("()=>{S.name='Mira';S.cfg.pageMin=0;S.cfg.shopMin=0;S.daily.n=25;save();go('home')}"); pg.wait_for_timeout(150)
    before = E("()=>JSON.stringify({c:S.coins,l:S.life,s:S.stars,sl:S.starsLife,ca:S.cards,tr:S.trophies,ow:S.owned,decks:S.decks})")

    # ---- Startseite: Ideenwerkstatt (früher Kreativhefte) → Notenheft
    ok(pg.locator('.dz-home4 .dz-tile').count() == 4, 'Startseite: 4 Kacheln')
    ok(pg.locator('.dz-home4 .dz-tile[data-act=noten]').count() == 0, 'Keine eigene Notenheft-Kachel auf der Startseite')
    ok('Wohin heute?' in pg.inner_text('.dz-sec'), 'Abschnitt „Wohin heute?“ vorhanden')
    wt = pg.locator('.dz-home4 .dz-tile[data-act=kreativhefte]')
    ok(wt.count() == 1 and 'Ideenwerkstatt' in wt.inner_text(), 'Kachel „Ideenwerkstatt“ auf der Startseite')
    wt.click(); pg.wait_for_timeout(200)
    ok(V() == 'kreativhefte', 'Kachel öffnet die Ideenwerkstatt')
    notentile = pg.locator('.dz-tile[data-act=noten]')
    ok(notentile.count() == 1 and 'Notenheft' in notentile.inner_text(), 'Kachel „Notenheft“ in der Ideenwerkstatt')
    ok(pg.locator('.dz-tile[data-act=musik]').count() == 1 and pg.locator('.dz-tile[data-act=story]').count() == 1 and pg.locator('.dz-tile[data-act=notiz]').count() == 0, 'Ideenwerkstatt: Meine Musik, Geschichte und Notenheft (Notizbuch ist jetzt eine Blase)')
    notentile.click(); pg.wait_for_timeout(250)
    ok(V() == 'noten', 'Kachel öffnet das Notenheft')

    txt = re.sub(r'data-act="[^"]*"', '', pg.locator('#app').inner_html())
    for w in ['Meine Lieder', 'Speichern', 'Note hinzufügen', 'Tempo', 'C–H-Farbcode', 'Kurz', 'Normal', 'Lang', 'Pause',
              'Langsam', 'Mittel', 'Schnell', 'Höher', 'Tiefer', 'Kopieren', 'Einfügen', 'Löschen', 'Noten', 'Abspielen']:
        ok(w in txt, 'Deutsch: „%s“' % w)
    for w in ['Undo', 'Redo', 'My songs', 'Add a note', 'Play speed', 'Saved locally', 'Higher', 'Lower', 'Stopp', 'Stop', 'Duplicate']:
        ok(w not in txt, 'Kein Englisch/kein Stopp-Knopf: „%s“' % w)
    ok('Who can see' not in txt and 'Wer kann das sehen' not in txt, 'Kein „Wer kann das sehen?“-Abschnitt')
    ok(E("()=>NO.view")=='staff' and E("()=>NO.entry")=='symbols', 'Standard: Notenbild-Ansicht + Notenbild-Tasten')
    ok(pg.locator('.no-key').count() == 7, '7 Notenbild-Tasten')
    ok(N() == 7 and names() == 'CDEFGEC', 'Startlied hat 7 Noten')
    ok(E("()=>!document.querySelector('#noSide [data-act=noColor]')") and E("()=>!!document.querySelector('.no-ribbon [data-act=noColor]')"), 'Farbcode-Schalter steht im Tempo-Ribbon, nicht mehr in der Seitenleiste')
    ok(E("()=>!!document.querySelector('#noSide .no-add')"), '„Note hinzufügen“ steht in der rechten Seitenleiste')
    ok(E("()=>{const m=document.querySelector('.no-main');const sc=m.querySelector('#noScoreBox'),tb=m.querySelector('.no-toolbar'),ed=tb&&tb.querySelector('.no-edit-bar'),rb=tb&&tb.querySelector('.no-ribbon');return !!(sc&&tb&&ed&&rb&&(sc.compareDocumentPosition(tb)&4)&&(ed.compareDocumentPosition(rb)&4))}"),
       'Eine einzige Werkzeugleiste unter dem Notenbild: links „Note ändern“, rechts Tempo + Farbcode')
    ok(E("()=>{const tb=document.querySelector('.no-toolbar'),r=tb.getBoundingClientRect(),e=tb.querySelector('.no-edit-bar').getBoundingClientRect(),g=tb.querySelector('.no-ribbon').getBoundingClientRect();return e.top<r.top+r.height&&Math.abs((e.top+e.height/2)-(g.top+g.height/2))<30&&e.left<g.left}"), 'Werkzeugleiste: eine Zeile, Änderungs-Symbole links, Tempo/Farbcode rechts')
    ok(E("()=>{const s=document.querySelector('#noScoreBox').getBoundingClientRect(),a=document.querySelector('#noSide .no-add').getBoundingClientRect(),m=document.querySelector('.no-main').getBoundingClientRect();return Math.abs(s.top-a.top)<2&&Math.abs(a.bottom-m.bottom)<2&&a.right<=innerWidth-8}"), '„Note hinzufügen“ beginnt auf Höhe des Notenbilds, endet bündig mit der Werkzeugleiste, bleibt im Bild')
    ok(E("()=>!!document.querySelector('.no-head .no-h')") and E("()=>!document.querySelector('#noTitle')"), 'Gespeicherter Titel: kompakte Überschrift statt großem Eingabefeld')
    ok(E("()=>!!document.querySelector('#noScoreBox .no-playbar')"), 'Abspielen/Anhalten ist in das Notenbild eingebaut')
    ok(E("()=>!document.querySelector('[data-act=noStop]')"), 'Kein eigener Stopp-Knopf mehr')
    ok(E("()=>{const b=document.querySelector('.no-playbar [data-act=toggleSound]');return !!b&&b.textContent.trim()===''&&!!b.getAttribute('aria-label')}"),
       'Klavier/Stumm-Knopf ist reines Symbol mit Beschriftung für Screenreader')
    ok(E("()=>[...document.querySelectorAll('.no-edit-bar button')].every(b=>b.textContent.trim()==='')"), '„Note ändern“ ist eine reine Symbolleiste')
    ok(pg.locator('[data-act=noEntry][data-arg=symbols]').inner_text().strip() == 'Noten' and pg.locator('[data-act=noEntry][data-arg=letters]').inner_text().strip() == 'C–H',
       'Eingabe-Umschalter heißt „Noten“ / „C–H“')

    # ---- Tonhöhen auf den Linien (Violinschlüssel): E = unterste Linie, G = zweite Linie, C = Hilfslinie
    ys = E("()=>{const t=38;return NO_NAMES.map(n=>noY(n,0,t)-t)}")
    ok(ys == [70, 63, 56, 49, 42, 35, 28], 'Linienposition C70 D63 E56 F49 G42 A35 H28 (E auf unterster Linie 56, G auf 2. Linie 42)')

    # ---- Eingabe mit einem Tipp (Notenbild)
    n0 = N(); pg.locator('.no-key').nth(2).click(); pg.wait_for_timeout(60)
    ok(N() == n0 + 1 and names().endswith('E'), 'Notenbild-Taste fügt E ein (ein Tipp)')
    ok(E("()=>__osc.length")>=1 and abs(E("()=>__osc[__osc.length-1].f")-329.63)<0.01, 'Vorhören: E = 329,63 Hz')
    # Eingabe-Modus Buchstaben + Länge bleibt erhalten
    pg.click('[data-act=noDur][data-arg=long]'); pg.click('[data-act=noEntry][data-arg=letters]'); pg.wait_for_timeout(60)
    ok(E("()=>NO.dur")=='long' and pg.locator('.no-lkey').count() == 7, 'Buchstaben-Eingabe, Länge „Lang“ bleibt')
    pg.locator('.no-lkey').nth(6).click(); pg.wait_for_timeout(60)
    ok(names().endswith('EH') and E("()=>noSong().notes.at(-1).duration")=='long', 'Buchstabe H eingefügt (lang)')
    pg.click('[data-act=noRest]'); ok(E("()=>noSong().notes.at(-1).rest")==True and E("()=>noSong().notes.at(-1).duration")=='long', 'Pause (mit gewählter Länge)')
    ok(abs(E("()=>__osc.at(-1).f")-493.88)<0.01, 'H = 493,88 Hz (Pause erzeugt keinen Ton)')
    pg.click('[data-act=noEntry][data-arg=symbols]'); ok(E("()=>NO.dur")=='long' and E("()=>noSong().notes.length")==n0+3, 'Wechsel der Eingabeart behält Länge und Notenzahl')

    # ---- Zweite Tonlage (tief/hoch)
    ok(E("()=>!!document.querySelector('[data-act=noOct][data-arg=high]')") and E("()=>!!document.querySelector('[data-act=noOct][data-arg=low]')"), 'Umschalter für die Tonlage (tief/hoch) vorhanden')
    ok(E("()=>NO.oct")==0, 'Voreingestellt: tiefe Tonlage')
    pg.click('[data-act=noOct][data-arg=high]'); pg.wait_for_timeout(60)
    ok(E("()=>NO.oct")==1, 'Tonlage „Hoch“ eingeschaltet')
    cntOct = N(); pg.locator('.no-key').nth(0).click(); pg.wait_for_timeout(60)
    idxNew = E("()=>NO.cur") - 1
    ok(N() == cntOct + 1 and E("()=>noSong().notes[%d].oct" % idxNew) == 1, 'In hoher Tonlage eingefügte Note bekommt oct=1')
    ok(abs(E("()=>noFreq(noSong().notes[%d])" % idxNew) - 523.26) < 0.05, 'Hohe Tonlage klingt eine Oktave höher (hohes C = 523,26 Hz)')
    pg.locator('.no-n').nth(idxNew).click(); pg.wait_for_timeout(60)
    pg.click('[data-act=noLower]'); pg.wait_for_timeout(60)
    ok(E("()=>noSong().notes[%d].oct" % idxNew) == 0 and E("()=>noSong().notes[%d].name" % idxNew) == 'H', 'Tiefer über die Tonlagen-Grenze: hohes C → tiefes H')
    pg.click('[data-act=noOct][data-arg=low]'); ok(E("()=>NO.oct")==0, 'Tonlage zurück auf „Tief“')

    # ---- Auswählen und Ändern
    pg.locator('.no-n').nth(0).click(); pg.wait_for_timeout(60)
    ok(sel() == '[0]' and E("()=>NO.cur")==1, 'Note antippen: gewählt, Einfügemarke dahinter')
    pg.click('[data-act=noHigher]'); ok(names().startswith('DDEFGEC'), 'Höher: C → D')
    pg.click('[data-act=noLower]'); pg.click('[data-act=noLower]'); ok(names().startswith('CDEFGEC'), 'Tiefer bleibt bei C (Grenze)')
    pg.click('[data-act=noLonger]'); ok(E("()=>noSong().notes[0].duration")=='long', 'Länger: normal → lang')
    pg.click('[data-act=noLonger]'); ok(E("()=>noSong().notes[0].duration")=='long', 'Länger: Grenze lang')
    pg.click('[data-act=noShorter]'); pg.click('[data-act=noShorter]'); ok(E("()=>noSong().notes[0].duration")=='short', 'Kürzer bis kurz')

    # ---- Kopieren & Einfügen (ersetzt das frühere „Duplizieren“)
    ok(E("()=>document.querySelector('[data-act=noPaste]').disabled")==True, 'Einfügen ist gesperrt, solange nichts kopiert ist')
    cnt = N(); pg.click('[data-act=noCopy]'); pg.wait_for_timeout(60)
    ok(E("()=>NO.clip.length")==1, 'Kopieren merkt die gewählte Note vor')
    ok(E("()=>document.querySelector('[data-act=noPaste]').disabled")==False, 'Einfügen ist jetzt frei')
    pg.click('[data-act=noPaste]'); pg.wait_for_timeout(60)
    ok(N() == cnt + 1, 'Einfügen fügt die kopierte Note ein')
    ok(names()[0] == names()[1], 'Eingefügte Note ist direkt dahinter eine Kopie')
    pg.click('[data-act=noDel]'); ok(N() == cnt and sel() == '[]', 'Löschen: Auswahl ist danach leer')
    # Pause: kein Höher/Tiefer
    pg.locator('.no-n').nth(E("()=>noSong().notes.findIndex(n=>n.rest)")).click()
    ok(E("()=>document.querySelector('[data-act=noHigher]').disabled")==True, 'Pause: Höher/Tiefer gesperrt')

    # ---- Mehrfachauswahl (kein Tastatur-Modifikator auf dem Tablet nötig)
    E("()=>{noAdd('C');noAdd('D');noAdd('E');NO.sel=[];noPaintAll()}"); pg.wait_for_timeout(60)
    pg.click('[data-act=noMulti]'); ok(E("()=>NO.multi")==True, 'Mehrfachauswahl eingeschaltet')
    nn = E("()=>noSong().notes.length")
    pg.locator('.no-n').nth(nn - 3).click(); pg.locator('.no-n').nth(nn - 1).click(); pg.wait_for_timeout(60)
    ok(E("()=>NO.sel.length")==2, 'Zwei Noten in der Mehrfachauswahl gewählt')
    pg.click('[data-act=noLonger]')
    ok(E("()=>noSong().notes[%d].duration" % (nn-3))=='long' and E("()=>noSong().notes[%d].duration" % (nn-1))=='long', 'Ändern wirkt auf alle gewählten Noten zugleich')
    pg.click('[data-act=noMulti]'); ok(E("()=>NO.multi")==False and E("()=>NO.sel.length")<=1, 'Mehrfachauswahl ausschalten lässt höchstens eine Note gewählt')

    # ---- Rückgängig / Wiederholen
    a = names(); pg.click('[data-act=noUndo]'); b2 = names(); pg.click('[data-act=noRedo]')
    ok(a != b2 and names() == a, 'Rückgängig und Wiederholen')
    ok(E("()=>{noRedo();return NO.fut.length}")==0, 'Wiederholen ohne Schritt: nichts')
    E("()=>noUndo()"); E("()=>noAdd('A')"); ok(E("()=>NO.fut.length")==0, 'Neue Änderung leert Wiederholen')

    # ---- Farbmodus und Ansicht (Melodie bleibt gleich)
    nlet = E("()=>document.querySelectorAll('#noScore text').length"); ok(nlet >= 5, 'Farbmodus an: Buchstaben im Notenbild (%d)' % nlet)
    pg.click('[data-act=noColor]'); ok(E("()=>document.querySelectorAll('#noScore text').length")==0 and E("()=>noSong().colorMode")==False, 'Farbmodus aus: keine Buchstaben/Farben')
    pg.click('[data-act=noColor]')
    m = names(); pg.click('[data-act=noView][data-arg=letters]'); pg.wait_for_timeout(60)
    ok(pg.locator('.no-lk').count() == N() and names() == m, 'Buchstaben-Ansicht: gleiche Melodie')
    ok(E("()=>[...document.querySelectorAll('.no-lk')].some(e=>e.style.color)"), 'Buchstaben-Ansicht: Farben')
    pg.click('[data-act=noView][data-arg=staff]')

    # ---- Wiedergabe (Web Audio), Anhalten/Fortsetzen ohne eigenen Stopp-Knopf
    E("()=>{noStopAll();__osc.length=0}")
    s = E("()=>{const s=noSong();return {n:s.notes.filter(x=>!x.rest).length,all:s.notes.length}}")
    E("()=>{NO.sel=[];noSong().tempo='fast'}"); pg.click('[data-act=noPlay]'); pg.wait_for_timeout(100)
    ok(E("()=>NO.playing")==True and E("()=>NO.idx")==0, 'Abspielen startet, erste Note markiert')
    total = E("()=>noSong().notes.reduce((a,n)=>a+noMs(n),0)")
    pg.wait_for_timeout(int(total) + 400)
    ok(E("()=>NO.playing")==False and E("()=>__osc.length")==s['n'], 'Ganze Melodie: %d Töne, Pausen still' % s['n'])
    ok(E("()=>__osc.every(o=>o.type==='triangle')"), 'Klang: Web Audio Oszillator')
    ok(E("()=>{return noMs({duration:'long'})>noMs({duration:'normal'})&&noMs({duration:'normal'})>noMs({duration:'short'})}"), 'Länge wirkt auf die Dauer')
    ok(E("()=>{const s=noSong();s.tempo='slow';const a=noMs({duration:'normal'});s.tempo='fast';const b=noMs({duration:'normal'});return a>b}"), 'Tempo wirkt (langsam > schnell)')
    E("()=>{noSong().tempo='slow'}")
    E("()=>__osc.length=0"); pg.click('[data-act=noPlay]'); pg.wait_for_timeout(120)
    pg.click('[data-act=noPlay]'); r = E("()=>NO.res"); pg.wait_for_timeout(50)
    ok(E("()=>NO.playing")==False and r is not None, 'Anhalten (gleicher Knopf) merkt die Stelle')
    pg.click('[data-act=noPlay]'); pg.wait_for_timeout(50)
    ok(E("()=>NO.playing")==True and E("()=>NO.res")==None, 'Erneutes Antippen spielt an der gemerkten Stelle weiter')
    E("()=>noStopAll()")
    k = E("()=>__osc.length"); pg.wait_for_timeout(800); ok(E("()=>__osc.length")==k, 'Nach dem Anhalten kommt kein Ton mehr')
    E("()=>{S.cfg.sound=false;NO.hint=false;save();render()}"); E("()=>__osc.length=0")
    pg.click('[data-act=noPlay]'); pg.wait_for_timeout(200)
    ok(E("()=>__osc.length")==0 and 'Ton ist aus' in pg.inner_text('.toasts'), 'Ton aus: still, mit Hinweis als Einblendung')
    E("()=>{noStopAll();S.cfg.sound=true;save();render()}")

    # ---- Speichern & Neuladen (Offline)
    pg.click('[data-act=noTitleEdit]'); ok(E("()=>!!document.querySelector('#noTitle')") and E("()=>!!document.querySelector('[data-act=noTitleOk]')"), 'Stift-Symbol öffnet das Titelfeld')
    E("()=>{const t=document.querySelector('#noTitle');t.value='Mein Testlied';t.dispatchEvent(new Event('input',{bubbles:true}));const d=document.querySelector('#noDesc');d.value='Für Oma';d.dispatchEvent(new Event('input',{bubbles:true}))}")
    pg.click('[data-act=noTitleOk]'); pg.wait_for_timeout(100)
    ok(E("()=>!document.querySelector('#noTitle')") and 'Mein Testlied' in pg.inner_text('.no-head .no-h') and 'Für Oma' in pg.inner_text('.no-head'), 'Nach „Fertig“: Titel als Überschrift, Beschreibung klein darunter')
    pg.click('[data-act=noFav]'); pg.wait_for_timeout(700)
    ok('Gespeichert' in pg.inner_text('#noStat'), 'Status „Gespeichert“')
    sig = E("()=>JSON.stringify(noSong().notes.map(n=>n.name+n.duration+n.rest+n.oct))")
    pg.reload(); pg.wait_for_timeout(400)
    ok(E("()=>S.noten.songs.some(s=>s.title==='Mein Testlied'&&s.description==='Für Oma'&&s.favorite)"), 'Nach Neuladen: Titel, Beschreibung, Favorit da')
    E("()=>{S.daily.n=25;save();go('home');go('noten')}"); pg.wait_for_timeout(200)
    ok(E("()=>JSON.stringify(noSong().notes.map(n=>n.name+n.duration+n.rest+n.oct))")==sig, 'Nach Neuladen: Noten unverändert (auch die Tonlage)')
    ok(E("()=>NO.view")=='staff', 'Ansicht gemerkt')

    # ---- Mehrere Lieder, Löschen nur nach Rückfrage
    pg.click('[data-act=noLib]'); pg.wait_for_timeout(100)
    ok(pg.locator('.no-song').count() == 1 and pg.locator('.no-new').count() == 1, 'Meine Lieder: 1 Lied + „Neues Lied“')
    pg.click('.no-new'); pg.wait_for_timeout(150)
    ok(E("()=>noData().songs.length")==2 and N() == 0 and E("()=>noSong().title")=='Neues Lied' and pg.locator('.no-lib').count()==0, 'Neues Lied angelegt und geöffnet')
    ok(E("()=>!!document.querySelector('#noTitle')"), 'Neues Lied: Titelfeld ist gleich offen')
    pg.keyboard.press('Enter'); ok(E("()=>!document.querySelector('#noTitle')"), 'Enter bestätigt den Titel')
    ok('Tippe unten auf eine Note' in pg.text_content('#noScore'), 'Leeres Lied: Hinweis im Notenbild')
    pg.locator('.no-key').nth(0).click(); pg.locator('.no-key').nth(4).click(); ok(N() == 2, 'Neues Lied: Noten einfügen')
    pg.click('[data-act=noLib]'); pg.wait_for_timeout(100)
    pg.locator('.no-song-d').nth(0).click(); pg.wait_for_timeout(100)
    ok(pg.locator('#modal').count() == 1 and 'Lied löschen?' in pg.inner_text('#modal'), 'Löschen fragt nach')
    pg.click('#modal [data-act=closeModal]'); ok(E("()=>noData().songs.length")==2, 'Abbrechen: Lied bleibt')
    pg.locator('.no-song-o').nth(1).click(); pg.wait_for_timeout(150)
    ok(E("()=>noSong().title")=='Mein Testlied' and N() >= 7, 'Anderes Lied öffnen')
    pg.click('[data-act=noLib]'); pg.locator('.no-song-d').nth(1).click(); pg.click('#modal [data-act=noDelYes]'); pg.wait_for_timeout(150)
    ok(E("()=>noData().songs.length")==1, 'Löschen nach „Ja“')
    pg.click('[data-act=noLib]') if pg.locator('.no-lib').count() == 0 else None
    pg.locator('.no-song-d').nth(0).click(); pg.click('#modal [data-act=noDelYes]'); pg.wait_for_timeout(150)
    ok(E("()=>noData().songs.length")==1 and E("()=>noSong().notes.length")==0, 'Letztes Lied gelöscht → neues leeres Lied (nie leer)')
    pg.keyboard.press('Escape'); ok(pg.locator('.no-lib').count() == 0, 'Escape schließt „Meine Lieder“')

    # ---- Tastatur: Note per Enter wählen
    E("()=>{noAdd('F');noAdd('G')}"); pg.locator('.no-n').nth(0).focus(); pg.keyboard.press('Enter'); ok(sel() == '[0]', 'Tastatur: Enter wählt Note')
    ok(E("()=>[...document.querySelectorAll('#app button')].filter(b=>!b.textContent.trim()&&!b.getAttribute('aria-label')).length")==0, 'Alle Knöpfe haben einen Namen')

    # ---- Kinder-Stand unberührt, Hausaufgaben-Sperre statt der alten Seitenzeit, kein Netz
    after = E("()=>JSON.stringify({c:S.coins,l:S.life,s:S.stars,sl:S.starsLife,ca:S.cards,tr:S.trophies,ow:S.owned,decks:S.decks})")
    ok(after == before, 'Münzen, Sterne, Karten, Pokale, Hefte unverändert')
    ok(E("()=>rgArea('noten')")==None and E("()=>pgArea('noten')")==None, 'Das Notenheft gehört zur Ideenwerkstatt: kein Zeitbereich, nie gesperrt')
    E("()=>{rgResetAll();S.daily.got=false;S.daily.n=0;S.daily.sec=0;save();go('home');go('noten')}"); pg.wait_for_timeout(200)
    ok(E("()=>!hwDone()") and E("()=>!document.querySelector('.pglock')") and E("()=>view")=='noten', 'Ohne Hausaufgaben: Notenheft ist trotzdem offen')
    E("()=>{const d=rgData();d.rg.a.noten=999;d.rg.tot=9999;NO.playing=false}"); pg.wait_for_timeout(1300)
    ok(E("()=>!document.querySelector('.pglock')") and E("()=>!document.querySelector('#pgT')"), 'Auch bei aufgebrauchter Nutzungszeit: offen, keine Zeitanzeige')
    ok(E("()=>S.noten.songs.length")>=1, 'Lieder vorhanden')
    E("()=>{rgResetAll();save()}")
    ok(not reqs, 'Keine Netzwerkanfragen: %s' % reqs[:3])
    src = pathlib.Path(html).parent.parent.joinpath('src/feat_noten.js').read_text() + pathlib.Path(html).parent.parent.joinpath('src/feat_noten.css').read_text()
    ok(not re.search(r'https?://|@import|<script src|fetch\(|XMLHttpRequest|cdn', src), 'Quelltext: keine externen Adressen, Bibliotheken oder Abrufe')

    # ---- Layout: kein seitliches Scrollen, alle Tasten erreichbar (Lenovo-Tablet quer/hoch, Handy)
    for name, (w, h) in {'quer 1280x800': (1280, 800), 'quer 1024x600': (1024, 600), 'hoch 800x1280': (800, 1280), 'Handy 360x740': (360, 740)}.items():
        pg.set_viewport_size({'width': w, 'height': h})
        E("()=>{S.daily.n=25;save();noInit();go('home');go('noten')}"); E("()=>{for(let i=0;i<14;i++)noAdd(NO_NAMES[i%7])}"); pg.wait_for_timeout(500)   # Einblende-Animation (0,4 s) abwarten, sonst misst man kleiner
        sw = E("()=>document.documentElement.scrollWidth"); ok(sw <= w + 1, '%s: kein seitliches Scrollen (%d)' % (name, sw))
        # .no-sm (Tempo-Leiste) ist bewusst kleiner, aber noch touch-sicher (40 px); .seg-Umschalter (Noten/C-H, Tief/Hoch)
        # nutzen die App-weit gleiche, bewusst kompakte Leiste (36 px, wie überall sonst in der App).
        small = E("()=>[...document.querySelectorAll('.no-page button')].filter(e=>e.offsetParent&&!e.closest('.no-sm,.no-seg')&&(e.getBoundingClientRect().height<44||e.getBoundingClientRect().width<44)).length")
        ok(small == 0, '%s: Tasten mindestens 44 px (außer bewusst kompakten Umschaltern)' % name)
        tiny = E("()=>[...document.querySelectorAll('.no-page .no-sm')].filter(e=>e.offsetParent&&(e.getBoundingClientRect().height<40||e.getBoundingClientRect().width<40)).length")
        ok(tiny == 0, '%s: die kompakte Tempo-Leiste bleibt mindestens 40 px' % name)
        segtiny = E("()=>[...document.querySelectorAll('.no-page .no-seg button')].filter(e=>e.offsetParent&&(e.getBoundingClientRect().height<36||e.getBoundingClientRect().width<36)).length")
        ok(segtiny == 0, '%s: die Noten/C-H- und Tief/Hoch-Umschalter bleiben mindestens 36 px (wie überall in der App)' % name)
        r = E("()=>{const k=document.querySelector('.no-key');const q=k.getBoundingClientRect();return [Math.round(q.width),Math.round(q.height)]}"); ok(r[0] >= 44 and r[1] >= 44, '%s: Notentaste %s' % (name, r))
        bad = E("()=>[...document.querySelectorAll('.no-page .btn,.no-page button,.no-page .dz-panel')].filter(e=>{const q=e.getBoundingClientRect();return q.right>innerWidth+1||q.left<-1}).length"); ok(bad == 0, '%s: nichts ragt über den Rand' % name)
    pg.set_viewport_size({'width': 1280, 'height': 800}); E("()=>{S.daily.n=25;save();go('home');go('noten')}")
    # Themes: Nachtmodus lesbar (Notenlinien/Tinte aus Tokens)
    E("()=>{S.eq.theme='nacht';render()}"); pg.wait_for_timeout(150)
    ink = E("()=>getComputedStyle(document.querySelector('.no-clef')).stroke"); bg = E("()=>getComputedStyle(document.body).backgroundColor")
    ok(ink != bg, 'Nacht-Thema: Notenschlüssel hebt sich ab (%s auf %s)' % (ink, bg))
    E("()=>{S.eq.theme='sonne';render()}")
    ok(not errs, 'Keine Konsolenfehler: %s' % errs[:3])
    b.close()
print('\n%d Fehler' % len(fails)); sys.exit(1 if fails else 0)
