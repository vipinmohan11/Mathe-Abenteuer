"""Notenheft (Musik-Notizbuch): Startseite, Eingabe (Notenbild + Buchstaben), Ändern, Rückgängig/Wiederholen, Farbmodus,
mehrere Lieder, Löschen nur nach Rückfrage, Speichern nach Neuladen, Web-Audio-Wiedergabe (mit Attrappe), Tablet-Layout, Seitenzeit, kein Netz.
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
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('request', lambda r: reqs.append(r.url) if not r.url.startswith(('file:', 'data:', 'blob:')) else None)
    pg.goto('file://' + html); pg.wait_for_timeout(300)
    E = pg.evaluate
    V = lambda: E("()=>view")
    N = lambda: E("()=>noSong().notes.length")
    names = lambda: E("()=>noSong().notes.map(n=>n.rest?'-':n.name).join('')")
    E("()=>{S.name='Mira';S.cfg.pageMin=0;S.cfg.shopMin=0;save();go('home')}"); pg.wait_for_timeout(150)
    before = E("()=>JSON.stringify({c:S.coins,l:S.life,s:S.stars,sl:S.starsLife,ca:S.cards,tr:S.trophies,ow:S.owned,decks:S.decks})")

    # ---- Startseite: Kachel unter „Wohin heute?“
    ok(pg.locator('.dz-home4 .dz-tile').count() == 5, 'Startseite: 5 Kacheln')
    tile = pg.locator('.dz-home4 .dz-tile[data-act=noten]')
    ok(tile.count() == 1 and 'Notenheft' in tile.inner_text(), 'Kachel „Notenheft“ in „Wohin heute?“')
    ok('Wohin heute?' in pg.inner_text('.dz-sec'), 'Abschnitt „Wohin heute?“ vorhanden')
    tile.click(); pg.wait_for_timeout(250)
    ok(V() == 'noten', 'Kachel öffnet das Notenheft')
    txt = pg.inner_text('#app')
    for w in ['Meine Lieder', 'Speichern', 'Abspielen', 'Stopp', 'Note hinzufügen', 'Tempo', 'C–H-Farbcode', 'Kurz', 'Normal', 'Lang', 'Pause', 'Langsam', 'Mittel', 'Schnell']:
        ok(w in txt, 'Deutsch: „%s“' % w)
    for w in ['Undo', 'Redo', 'My songs', 'Add a note', 'Play speed', 'Saved locally', 'Higher', 'Lower']:
        ok(w not in txt, 'Kein Englisch: „%s“' % w)
    ok('Who can see' not in txt and 'Wer kann das sehen' not in txt, 'Kein „Wer kann das sehen?“-Abschnitt')
    ok(E("()=>NO.view")=='staff' and E("()=>NO.entry")=='symbols', 'Standard: Notenbild-Ansicht + Notenbild-Tasten')
    ok(pg.locator('.no-key').count() == 7, '7 Notenbild-Tasten')
    ok(N() == 7 and names() == 'CDEFGEC', 'Startlied hat 7 Noten')
    ok(not E("()=>/farbcode|circle/i.test(document.querySelector('.no-side').innerHTML.replace(/C–H-Farbcode/,''))"), 'Keine Farbkreis-Legende')

    # ---- Tonhöhen auf den Linien (Violinschlüssel): E = unterste Linie, G = zweite Linie, C = Hilfslinie
    ys = E("()=>{const t=38;return NO_NAMES.map(n=>noY(n,t)-t)}")
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

    # ---- Auswählen und Ändern
    pg.locator('.no-n').nth(0).click(); pg.wait_for_timeout(60)
    ok(E("()=>NO.sel")==0 and E("()=>NO.cur")==1, 'Note antippen: gewählt, Einfügemarke dahinter')
    ok('Gewählt: C' in pg.inner_text('#noSide'), 'Seitenleiste zeigt „Gewählt: C“')
    pg.click('[data-act=noHigher]'); ok(names().startswith('DDEFGEC'), 'Höher: C → D')
    pg.click('[data-act=noLower]'); pg.click('[data-act=noLower]'); ok(names().startswith('CDEFGEC'), 'Tiefer bleibt bei C (Grenze)')
    pg.click('[data-act=noLonger]'); ok(E("()=>noSong().notes[0].duration")=='long', 'Länger: normal → lang')
    pg.click('[data-act=noLonger]'); ok(E("()=>noSong().notes[0].duration")=='long', 'Länger: Grenze lang')
    pg.click('[data-act=noShorter]'); pg.click('[data-act=noShorter]'); ok(E("()=>noSong().notes[0].duration")=='short', 'Kürzer bis kurz')
    cnt = N(); pg.click('[data-act=noDup]'); ok(N() == cnt + 1 and names().startswith('CCD'), 'Kopieren fügt direkt dahinter ein')
    pg.click('[data-act=noDel]'); ok(N() == cnt and E("()=>NO.sel")==None and E("()=>NO.cur")==1, 'Löschen: Marke an alter Stelle')
    # Pause: kein Höher/Tiefer
    pg.locator('.no-n').nth(E("()=>noSong().notes.findIndex(n=>n.rest)")).click()
    ok(E("()=>document.querySelector('[data-act=noHigher]').disabled")==True, 'Pause: Höher/Tiefer gesperrt')

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

    # ---- Wiedergabe (Web Audio)
    E("()=>{noStopAll();__osc.length=0}")
    s = E("()=>{const s=noSong();return {n:s.notes.filter(x=>!x.rest).length,all:s.notes.length}}")
    E("()=>{NO.sel=null;noSong().tempo='fast'}"); pg.click('[data-act=noPlay]'); pg.wait_for_timeout(100)
    ok(E("()=>NO.playing")==True and E("()=>NO.idx")==0, 'Abspielen startet, erste Note markiert')
    total = E("()=>noSong().notes.reduce((a,n)=>a+noMs(n),0)")
    pg.wait_for_timeout(int(total) + 400)
    ok(E("()=>NO.playing")==False and E("()=>__osc.length")==s['n'], 'Ganze Melodie: %d Töne, Pausen still' % s['n'])
    ok(E("()=>__osc.every(o=>o.type==='triangle')"), 'Klang: Web Audio Oszillator')
    ok(E("()=>{const f=noSong();const a={...f};return noMs({duration:'long'})>noMs({duration:'normal'})&&noMs({duration:'normal'})>noMs({duration:'short'})}"), 'Länge wirkt auf die Dauer')
    ok(E("()=>{const s=noSong();s.tempo='slow';const a=noMs({duration:'normal'});s.tempo='fast';const b=noMs({duration:'normal'});return a>b}"), 'Tempo wirkt (langsam > schnell)')
    E("()=>{noSong().tempo='slow'}")
    E("()=>__osc.length=0"); pg.click('[data-act=noPlay]'); pg.wait_for_timeout(120)
    pg.click('[data-act=noPlay]'); r = E("()=>NO.res"); pg.wait_for_timeout(50)
    ok(E("()=>NO.playing")==False and r is not None, 'Anhalten merkt die Stelle')
    pg.click('[data-act=noStop]'); ok(E("()=>NO.res")==None and E("()=>NO.timer")==None, 'Stopp setzt zurück und bricht ab')
    k = E("()=>__osc.length"); pg.wait_for_timeout(800); ok(E("()=>__osc.length")==k, 'Nach Stopp kommt kein Ton mehr')
    E("()=>{S.cfg.sound=false;save();render()}"); E("()=>__osc.length=0"); pg.click('[data-act=noPlay]'); pg.wait_for_timeout(150); pg.click('[data-act=noStop]')
    ok(E("()=>__osc.length")==0 and 'Ton ist aus' in pg.inner_text('.no-trans'), 'Ton aus: still, mit Hinweis')
    E("()=>{S.cfg.sound=true;save();render()}")

    # ---- Speichern & Neuladen (Offline)
    E("()=>{const t=document.querySelector('#noTitle');t.value='Mein Testlied';t.dispatchEvent(new Event('input',{bubbles:true}));const d=document.querySelector('#noDesc');d.value='Für Oma';d.dispatchEvent(new Event('input',{bubbles:true}))}")
    pg.click('[data-act=noFav]'); pg.wait_for_timeout(700)
    ok('Gespeichert' in pg.inner_text('#noStat'), 'Status „Gespeichert“')
    sig = E("()=>JSON.stringify(noSong().notes.map(n=>n.name+n.duration+n.rest))")
    pg.reload(); pg.wait_for_timeout(400)
    ok(E("()=>S.noten.songs.some(s=>s.title==='Mein Testlied'&&s.description==='Für Oma'&&s.favorite)"), 'Nach Neuladen: Titel, Beschreibung, Favorit da')
    E("()=>go('noten')"); pg.wait_for_timeout(200)
    ok(E("()=>JSON.stringify(noSong().notes.map(n=>n.name+n.duration+n.rest))")==sig, 'Nach Neuladen: Noten unverändert')
    ok(E("()=>NO.view")=='staff', 'Ansicht gemerkt')

    # ---- Mehrere Lieder, Löschen nur nach Rückfrage
    pg.click('[data-act=noLib]'); pg.wait_for_timeout(100)
    ok(pg.locator('.no-song').count() == 1 and pg.locator('.no-new').count() == 1, 'Meine Lieder: 1 Lied + „Neues Lied“')
    pg.click('.no-new'); pg.wait_for_timeout(150)
    ok(E("()=>noData().songs.length")==2 and N() == 0 and E("()=>noSong().title")=='Neues Lied' and pg.locator('.no-lib').count()==0, 'Neues Lied angelegt und geöffnet')
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
    E("()=>{noAdd('F');noAdd('G')}"); pg.locator('.no-n').nth(0).focus(); pg.keyboard.press('Enter'); ok(E("()=>NO.sel")==0, 'Tastatur: Enter wählt Note')
    ok(E("()=>[...document.querySelectorAll('#app button')].filter(b=>!b.textContent.trim()&&!b.getAttribute('aria-label')).length")==0, 'Alle Knöpfe haben einen Namen')

    # ---- Kinder-Stand unberührt, Seitenzeit, kein Netz
    after = E("()=>JSON.stringify({c:S.coins,l:S.life,s:S.stars,sl:S.starsLife,ca:S.cards,tr:S.trophies,ow:S.owned,decks:S.decks})")
    ok(after == before, 'Münzen, Sterne, Karten, Pokale, Hefte unverändert')
    ok(E("()=>pgArea('noten')")=='noten' and E("()=>pgAreas().includes('noten')"), 'Seitenzeit gilt für das Notenheft (wie für alle Seiten außer Hefte/Europa)')
    E("()=>{S.cfg.pageMin=3;S.cfg.pageNeed=5;S.daily.got=false;S.daily.n=0;S.daily.pg={};save();go('home');go('noten')}"); pg.wait_for_timeout(200)
    ok(E("()=>!!document.querySelector('#pgT')"), 'Zeit-Anzeige im Notenheft')
    E("()=>{pgRec('noten').sec=179;NO.playing=false}"); pg.wait_for_timeout(1500)
    ok(E("()=>!!document.querySelector('.pglock')") and 'Notenheft' in pg.inner_text('.pglock'), 'Nach Ablauf: Pause-Bildschirm „Notenheft“; Lieder bleiben')
    ok(E("()=>S.noten.songs.length")>=1, 'Lieder nach Sperre noch da')
    E("()=>{S.cfg.pageMin=0;save()}")
    ok(not reqs, 'Keine Netzwerkanfragen: %s' % reqs[:3])
    src = pathlib.Path(html).parent.parent.joinpath('src/feat_noten.js').read_text() + pathlib.Path(html).parent.parent.joinpath('src/feat_noten.css').read_text()
    ok(not re.search(r'https?://|@import|<script src|fetch\(|XMLHttpRequest|cdn', src), 'Quelltext: keine externen Adressen, Bibliotheken oder Abrufe')

    # ---- Layout: kein seitliches Scrollen, alle Tasten erreichbar (Lenovo-Tablet quer/hoch, Handy)
    for name, (w, h) in {'quer 1280x800': (1280, 800), 'quer 1024x600': (1024, 600), 'hoch 800x1280': (800, 1280), 'Handy 360x740': (360, 740)}.items():
        pg.set_viewport_size({'width': w, 'height': h}); E("()=>{noInit();go('home');go('noten')}"); E("()=>{for(let i=0;i<14;i++)noAdd(NO_NAMES[i%7])}"); pg.wait_for_timeout(200)
        sw = E("()=>document.documentElement.scrollWidth"); ok(sw <= w + 1, '%s: kein seitliches Scrollen (%d)' % (name, sw))
        small = E("()=>[...document.querySelectorAll('.no-key,.no-lkey,.no-dur,.no-sm,.no-top .btn,.no-edit .btn,.no-song-o,.no-song-d')].filter(e=>e.offsetParent&&(e.getBoundingClientRect().height<44||e.getBoundingClientRect().width<44)).length")
        ok(small == 0, '%s: Tasten mindestens 44 px' % name)
        r = E("()=>{const k=document.querySelector('.no-key');const q=k.getBoundingClientRect();return [Math.round(q.width),Math.round(q.height)]}"); ok(r[0] >= 44 and r[1] >= 44, '%s: Notentaste %s' % (name, r))
        bad = E("()=>[...document.querySelectorAll('.no-page .btn,.no-page button,.no-page .dz-panel')].filter(e=>{const q=e.getBoundingClientRect();return q.right>innerWidth+1||q.left<-1}).length"); ok(bad == 0, '%s: nichts ragt über den Rand' % name)
    pg.set_viewport_size({'width': 1280, 'height': 800}); E("()=>{go('noten')}")
    # Themes: Nachtmodus lesbar (Notenlinien/Tinte aus Tokens)
    E("()=>{S.eq.theme='nacht';render()}"); pg.wait_for_timeout(150)
    ink = E("()=>getComputedStyle(document.querySelector('.no-clef')).stroke"); bg = E("()=>getComputedStyle(document.body).backgroundColor")
    ok(ink != bg, 'Nacht-Thema: Notenschlüssel hebt sich ab (%s auf %s)' % (ink, bg))
    E("()=>{S.eq.theme='sonne';render()}")
    ok(not errs, 'Keine Konsolenfehler: %s' % errs[:3])
    b.close()
print('\n%d Fehler' % len(fails)); sys.exit(1 if fails else 0)
