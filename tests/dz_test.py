"""Denkzauber-Designsystem: Navigation, Profil, Fino-Umbenennung, Schalter, Fakten, Akkordeon, Baum, Überlauf, Stand unverändert.
Aufruf: python3 dz_test.py /abs/pfad/Mathe-Abenteuer_Klasse4.html"""
import sys
from playwright.sync_api import sync_playwright
html = sys.argv[1]; fails = []
def ok(c, m):
    print(('OK   ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
    pg.add_init_script('window.__rwOff=1')   # Belohnungs-Fenster nur im eigenen Test
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + html); pg.wait_for_timeout(300)
    pg.evaluate("""()=>{S.coins=321;S.life=321;S.starsLife=37;S.stars=37;S.chests=1;S.cards={a1:1,a2:1};S.trophies={blk1:1};S.daily.n=25;save();checkTrophies();}""")
    snap = lambda: pg.evaluate("()=>JSON.stringify({c:S.coins,l:S.life,s:S.stars,sl:S.starsLife,ch:S.chests,cards:S.cards,tr:S.trophies})")
    before = snap()
    V = lambda: pg.evaluate("()=>view")
    click = lambda sel: (pg.locator(sel).first.click(), pg.wait_for_timeout(120))
    pg.evaluate("()=>go('home')"); pg.wait_for_timeout(100)
    # Start
    ok(pg.locator('.nav, .navbar, nav.bottom, #nav').count() == 0 and pg.locator('[data-act=goHome].tab').count() == 0, 'keine untere Navigationsleiste')
    ok(pg.locator('.dz-home4 .dz-tile').count() == 4, 'Startseite: 4 Kacheln (Hefte, Europa, Ideenwerkstatt, Welt) – „Extra Spaß“ ist in Meine Hefte aufgegangen')
    t = pg.inner_text('#app')
    ok('Europa Entdecker' in t and 'Extra Spaß' not in t and 'Meine Hefte' in t and 'Meine Welt' in t and 'Ideenwerkstatt' in t, 'Kachel-Namen')
    ok('Heute geschafft' not in t and 'Extra Training' not in t and 'Europa Expedition' not in t, 'alte Namen weg')
    ok(pg.locator('.dz-head .dz-me').count() == 1 and pg.locator('.dz-head .dz-chip').count() >= 3, 'Profil oben links + Chips')
    # Baum-Stufen
    stages = []
    for pct in (0, 10, 30, 60, 90, 100):
        stages.append(pg.evaluate("p=>dzTree(p)", pct))
    ok(len(set(stages)) == 6, 'Samen-bis-Baum: 6 verschiedene Stufen')
    # Navigation: Hefte -> Heft -> zurück
    click('.dz-tile[data-act=goHefte], .dz-tile[data-act=hefte]') if pg.locator('.dz-tile[data-act=goHefte], .dz-tile[data-act=hefte]').count() else pg.evaluate("()=>go('hefte')")
    pg.wait_for_timeout(100); ok(V() == 'hefte', 'Hefte öffnet von der Startseite')
    ok(pg.locator('.dz-hefte6 .dz-tile').count() == 4, 'Hefte: 4 Kacheln oben (Los geht\'s, Fehler-Heft, Mini-Test, Kopfrechnen)')
    # Akkordeon: nur ein Kapitel offen
    n = pg.locator('.dz-acc').count()
    if n >= 2:
        pg.evaluate("()=>ACT.dzAcc('B','hefte')") if False else None
    heads = pg.locator('.dz-acc-head')
    if heads.count() >= 2:
        heads.nth(0).click(); heads.nth(1).click(); pg.wait_for_timeout(100)
        ok(pg.locator('.dz-acc-item.open').count() == 1, 'Kapitel: nur eines offen')
    else:
        ok(False, 'Akkordeon-Köpfe gefunden')
    # A1-A5 in einer Reihe, auch 360px
    for w in (1280, 360):
        pg.set_viewport_size({'width': w, 'height': 800}); pg.wait_for_timeout(100)
        ys = pg.evaluate("()=>[...document.querySelectorAll('.dz-acc-item.open .dz-tile')].slice(0,5).map(e=>Math.round(e.getBoundingClientRect().top))")
        n6 = pg.evaluate("()=>document.querySelectorAll('.dz-acc-item.open .dz-tile').length") == 6
        ok(len(ys) == 5 and (len(set(ys)) == 1 or (n6 and w == 360 and len(set(ys[:3])) == 1)), f'Hefte-Kacheln einer Reihe bei {w}px (Kapitel mit 6 Heften: 3 pro Reihe auf dem Handy) {ys}')
    pg.set_viewport_size({'width': 1280, 'height': 800})
    # Heft öffnen und zurück
    pg.locator('.dz-acc-head').nth(0).click(); pg.wait_for_timeout(100)
    tile = pg.locator('.dz-acc-item.open .dz-tile:not(.locked)').first
    tile.click(); pg.wait_for_timeout(150)
    v1 = V(); ok(v1 != 'hefte', 'Heft-Seite öffnet (' + v1 + ')')
    click('.top .back[data-act=back]'); ok(V() == 'hefte', 'Zurück → Hefte')
    click('.top .back[data-act=back]'); ok(V() == 'home', 'Zurück → Start')
    # Meine Welt -> Shop -> zurück
    pg.evaluate("()=>go('rewards')"); pg.wait_for_timeout(100)
    ok(pg.locator('.dz-tile').count() == 2, 'Meine Welt: 2 Kacheln (Shop, Weltreise; Musik/Geschichte wohnen in der Ideenwerkstatt, Fakten bei den Lustigen Karten)')
    ok('Weltreise' in pg.inner_text('#app') and 'Lustige Fakten' not in pg.inner_text('#app') and 'Musik' not in pg.inner_text('#app') and 'Geschichte' not in pg.inner_text('#app'), 'Meine Weltreise ja; Lustige Fakten, Musik, Geschichte nicht mehr hier')
    click('.dz-tile[data-act=shop], .dz-tile[data-act=go][data-arg=shop]')
    ok(V() == 'shop', 'Shop öffnet'); click('.top .back[data-act=back]'); ok(V() == 'rewards', 'Zurück → Meine Welt')
    # Lustige Karten (Fakten + Karten in einem Format)
    pg.evaluate("()=>ACT.schatz()"); pg.wait_for_timeout(100)
    ok(V() == 'schatz' and 'Lustige Karten' in pg.inner_text('#app') and pg.locator('.tgrid .tcard.ty-fakt').count() >= 24, 'Lustige Karten: Fakten stehen als Karten im Kartenformat')
    ok(pg.evaluate("()=>FACTS.length>=29&&factsOpen()>=29"), 'Fakten: mindestens 29 frei')
    # Profil -> Farben -> zurück
    pg.evaluate("()=>go('home')"); click('.dz-head .dz-me'); ok(V() == 'profile', 'Profil über Profilfeld')
    pt = pg.inner_text('#app'); ok('Meine Pokale' in pt and 'Das bin ich' in pt and 'Farben' in pt and 'umbenennen' not in pt, 'Profil: Kacheln (kein Umbenennen mehr)')
    pg.evaluate("()=>go('look')"); pg.wait_for_timeout(100); click('.top .back[data-act=back]'); ok(V() == 'profile', 'Farben & Töne → zurück zum Profil')
    # Android-Zurück
    pg.evaluate("()=>go('home')"); pg.evaluate("()=>go('hefte')"); pg.wait_for_timeout(100)
    pg.go_back(); pg.wait_for_timeout(200); ok(V() == 'home', 'Android-Zurück: Hefte → Start')
    # Ein früher gespeicherter Fino-Name bleibt erhalten und wirkt
    pg.evaluate("()=>{S.finoName='Mia';save();go('home')}"); pg.wait_for_timeout(200)
    pg.evaluate("()=>go('kreativhefte')"); pg.wait_for_timeout(200)
    txt = pg.inner_text('#app'); ok('Mias Geschichte' in txt and 'Finos' not in txt, 'Umbenennen: „Mias Geschichte“')
    pg.evaluate("()=>{S.finoName='Max';save();render()}"); pg.wait_for_timeout(200)
    ok('Max’ Geschichte' in pg.inner_text('#app') or 'Maxʼ Geschichte' in pg.inner_text('#app'), 'Umbenennen: Max’ Geschichte')
    pg.evaluate("()=>{S.finoName='';save();render()}"); pg.wait_for_timeout(200)
    ok('Finos Geschichte' in pg.inner_text('#app'), 'zurück auf Fino: „Finos Geschichte“')
    # Begrüßung nach Uhrzeit
    g = pg.evaluate("()=>[[6,'Guten Morgen'],[12,'Guten Tag'],[15,'Schönen Nachmittag'],[19,'Guten Abend'],[23,'Hallo Nachteule'],[3,'Hallo Nachteule']].map(([h,w])=>greetWord(h)===w)")
    ok(all(g), 'Begrüßung: Wort passend zur Uhrzeit')
    pg.evaluate("()=>{S.name='Mira';save();go('home')}"); pg.wait_for_timeout(120)
    ok(pg.evaluate("()=>homeGreeting(9)") == 'Guten Morgen, Mira!' and 'Mira!' in pg.inner_text('#app') and 'schön, dass du da bist' not in pg.inner_text('#app'), 'Begrüßung mit Namen auf Start')
    # Shop: keine Fino-Insel, mehr Extras, jedes Extra zeichnet auf jedem Fell
    sh = pg.evaluate("()=>({insel:!!SHOP.insel,extras:SHOP.extra.items.length,bad:Object.keys(SKINS).flatMap(k=>SHOP.extra.items.map(i=>mascotSVG({skin:k,extra:i.id,mood:'happy'})).filter(s=>/undefined|NaN/.test(s)||s.indexOf('<svg')<0).map(()=>k)),rn:!!VIEWS.finoname,tab:Object.keys(SHOP)})")
    ok(not sh['insel'] and not sh['rn'] and sh['extras'] >= 9 and not sh['bad'], 'Shop: keine Fino-Insel/-Namen, %d Extras, alle zeichnen (%s)' % (sh['extras'], sh['bad']))
    ok('Fehler-Heft' in (pg.evaluate("()=>{go('hefte');return document.getElementById('app').innerText}")), 'Hefte: „Fehler-Heft“ statt „Noch mal üben“')
    pg.evaluate("()=>{S.name='';save();go('rewards')}"); pg.wait_for_timeout(120)
    # Schalter
    pg.evaluate("()=>{S.flags={wesen:1,buch:1,insel:1};save();render()}"); pg.wait_for_timeout(100)
    ok(pg.locator('.dz-tile').count() == 5, 'Schalter an: Wesen/Buch/Insel erscheinen')
    pg.evaluate("()=>{S.flags={};save();render()}"); pg.wait_for_timeout(100)
    ok(pg.locator('.dz-tile').count() == 2, 'Schalter aus: wieder 2 Kacheln')
    # früher „Extra Spaß“: alte Links landen in Meine Hefte, dort 6 Kacheln in einer Reihe
    pg.evaluate("()=>go('extra')"); pg.wait_for_timeout(100)
    ok(pg.locator('.dz-hefte6 .dz-tile').count() == 4 and pg.locator('.dz-tile[data-act=kopf]').count() == 1, 'Alter „Extra Spaß“-Link zeigt Meine Hefte (4 Kacheln oben)')
    tops = pg.evaluate("()=>[...document.querySelectorAll('.dz-hefte6 .dz-tile')].map(e=>Math.round(e.getBoundingClientRect().top))")
    ok(len(set(tops)) == 1, 'Meine Hefte: alle 4 Kacheln in einer Reihe (%s)' % tops)
    # Stand unverändert
    ok(snap() == before, 'Münzen, Sterne, Karten, Pokale unverändert durch Navigation')
    # Profil: Name nach dem Speichern fest
    pg.evaluate("()=>{S.name='';save();go('profile')}"); pg.wait_for_timeout(100)
    ok(pg.locator('#nameIn').count() == 1, 'Profil: ohne Namen gibt es das Eingabefeld')
    pg.fill('#nameIn', 'Mira'); pg.evaluate("()=>ACT.rhSaveName()"); pg.wait_for_timeout(120)
    ok(pg.locator('#nameIn').count() == 0 and pg.evaluate("()=>S.name") == 'Mira', 'Profil: Name gespeichert, kein Eingabefeld mehr')
    pg.evaluate("()=>go('parent')") if False else None
    # Rahmen auf allen Karten
    nob = []
    for v in ['home', 'hefte', 'extra', 'kopf', 'kreativhefte', 'rewards', 'profile', 'schatz', 'geo', 'welt', 'weltPass', 'shop', 'trophies']:
        pg.evaluate("v=>go(v)", v); pg.wait_for_timeout(60)
        r = pg.evaluate("""()=>[...document.querySelectorAll('.dz-tile,.dz-hero,.dz-panel,.dz-acc-item,.dz-stat,.card,.w-card,.rp,.topic,.dz-chip')].filter(e=>e.offsetParent&&parseFloat(getComputedStyle(e).borderTopWidth)<1).map(e=>e.className)""")
        if r: nob.append((v, r[:3]))
    ok(not nob, f'jede Karte hat einen feinen Rahmen {nob[:3]}')
    # Reisepass
    pg.evaluate("()=>{const w=wS();const t=ymd();w.open.jpn=t;w.stamps={deu:'2026-09-14',jpn:t};w.pass={name:'',photo:'avatar',birth:'2016-05-12',bplace:'Stuttgart',res:'Stuttgart'};save();go('weltPass')}"); pg.wait_for_timeout(1900)
    pt = pg.inner_text('#app')
    ok('Mein Reisepass' in pt and 'Entdeckerpass' not in pt, 'Entdeckerpass heißt jetzt Mein Reisepass')
    ok(pg.locator('.w-sec:has-text("Souvenirs"), .w-sec:has-text("Pokale"), .w-sec:has-text("Reisetagebuch")').count() == 0 and pg.locator('.w-badge, .w-shelf, .w-log').count() == 0, 'Abschnitte Souvenirs, Pokale, Reisetagebuch entfernt')
    ok(pg.locator('.rp-st').count() == 2, 'Einreisestempel je Land')
    ok('14 SEP 2026' in pg.inner_html('.rp-visa') or pg.evaluate("()=>document.querySelector('.rp-visa').textContent.includes('14')") and 'SEP' in pg.inner_html('.rp-visa'), 'Stempel tragen ein Datum')
    ok(all(x in pt for x in ['Geburtsdatum', 'Geburtsort', 'Wohnort', 'Staatsangehörigkeit', 'Pass-Nr.', 'Gültig bis', 'Ausgestellt am', 'Bereiste Länder', 'Einreisestempel']), 'Passdaten und Reisedaten als Passfelder')
    ok(pg.locator('.rp-mrz span').count() == 2 and all(len(x) == 44 for x in pg.eval_on_selector_all('.rp-mrz span', 'e=>e.map(x=>x.textContent)')), 'maschinenlesbare Zeilen (2 × 44 Zeichen)')
    ok(pg.evaluate("()=>wS().pass.no&&wS().pass.issued") and pg.evaluate("()=>wS().pass.no")==pg.evaluate("()=>{go('home');go('weltPass');return wS().pass.no}"), 'Pass-Nummer bleibt fest')
    # Überlauf
    bad = []
    views = ['home', 'hefte', 'extra', 'kopf', 'kreativhefte', 'rewards', 'profile', 'schatz', 'geo', 'welt', 'weltPass', 'weltEltern', 'look', 'shop', 'trophies']
    for w in (360, 820, 1280):
        pg.set_viewport_size({'width': w, 'height': 800})
        for th in ('sonne', 'nacht', 'wald', 'meer'):
            for v in views:
                r = pg.evaluate("([v,th])=>{S.theme=th;document.body.dataset.theme=th;go(v);return document.documentElement.scrollWidth-document.documentElement.clientWidth}", [v, th])
                pg.wait_for_timeout(30)
                if r > 1: bad.append((w, th, v, r))
    ok(not bad, f'kein waagerechter Überlauf {bad[:5]}')
    ok(not errs, f'keine Konsolenfehler {errs[:3]}')
    b.close()
print('\nFAILS:', fails); sys.exit(1 if fails else 0)
