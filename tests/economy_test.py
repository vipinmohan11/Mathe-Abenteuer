"""Regeln: Kreativzeit-Sperre/Timer, Shop-Zeit, Wiederholung nach 7 Tagen, Hefte A–D, Jetzt-üben (Playwright)."""
import sys
from playwright.sync_api import sync_playwright
URL = 'file://' + sys.argv[1]
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(URL); pg.wait_for_timeout(300); E = pg.evaluate
    # --- Kreativzeit gesperrt, solange nicht geübt
    ok(E("()=>!creativeOK()"), 'ohne Üben keine Kreativzeit')
    E("()=>go('musik')"); ok(pg.locator('.lockscr').count() == 1, 'Musik: Sperrbildschirm vor der Kreativzeit')
    E("()=>go('avatar')"); ok(E("()=>UI.ro") is True, 'Avatar: nur ansehen vor der Kreativzeit')
    # --- Vergabe: eine Stufe, dann Tagesziel, dann nichts mehr (max. 2 pro Tag)
    ok(E("()=>grantCreative('lvl')") is True and E("()=>creativeLeft()") == 300, 'fertige Stufe: 5 Minuten')
    ok(E("()=>grantCreative('lvl')") is False, 'dieselbe Art nur einmal pro Tag')
    ok(E("()=>grantCreative('goal')") is True and E("()=>creativeLeft()") == 600, 'Tagesziel: weitere 5 Minuten')
    E("()=>{S.daily.cr.goal=false;S.daily.cr.lvl=false}"); ok(E("()=>grantCreative('lvl')") is False, 'höchstens 2 Kreativzeiten pro Tag')
    E("()=>{S.cfg.creativeMode='locked';S.daily.cr={left:0,grants:0,used:0,lvl:false,goal:false}}")
    ok(E("()=>grantCreative('lvl')") is False and E("()=>!creativeOK()"), 'Klassenmodus: nichts öffnet sich')
    E("()=>{S.cfg.creativeMode='always'}"); ok(E("()=>creativeOK()"), 'immer offen')
    # --- Timer läuft nur im Kreativ-Bereich, Ende: Hinweis + automatisch gespeichert
    E("()=>{S.cfg.creativeMode='after';S.daily.cr={left:3,grants:1,used:0,lvl:true,goal:false};go('musik')}"); pg.wait_for_timeout(1200)
    ok(E("()=>S.daily.cr.left") <= 2, 'Timer zählt im Kreativ-Bereich')
    pg.wait_for_timeout(3500)
    ok(pg.locator('#modal').count() == 1 and 'Kreativzeit vorbei' in pg.locator('#modal').inner_text(), 'Ende-Hinweis erscheint')
    ok(E("()=>view") == 'rewards' and E("()=>S.daily.cr.left") == 0, 'danach Belohnungen, Zeit leer')
    E("()=>{S.daily.cr.left=50;go('home')}"); pg.wait_for_timeout(1300); ok(E("()=>S.daily.cr.left") == 50, 'Zeit läuft nicht außerhalb des Kreativ-Bereichs')
    # --- Shop-Zeit
    E("()=>{closeModal();S.coins=500;S.cfg.shopMin=5;S.daily.shopSec=298;go('shop')}"); pg.wait_for_timeout(3200)
    ok(E("()=>shopLeft()") == 0, 'Shop-Zeit endet nach 5 Minuten')
    ok('Shop-Zeit für heute ist vorbei' in pg.locator('#app').inner_text(), 'Hinweis im Shop')
    ok(E("()=>{const it=Object.values(CATALOG).find(i=>i.src.t==='shop'&&!hasItem(i.id));return buyItem(it.id)}") is False, 'kein Kauf nach Ablauf')
    E("()=>{S.daily.shopSec=0}"); ok(E("()=>{const it=Object.values(CATALOG).find(i=>i.src.t==='shop'&&i.src.price<=500&&!hasItem(i.id));return buyItem(it.id)}") is True, 'Kauf innerhalb der Shop-Zeit')
    E("()=>{S.cfg.shopMin=0;S.daily.shopSec=9999}"); ok(E("()=>shopLeft()") == float('inf') or E("()=>shopLeft()") is None or E("()=>shopLeft()>1e9"), 'Shop-Zeit unbegrenzt möglich')
    # --- Wiederholung: erst nach 7 Tagen, höchstens 15 Münzen
    E("()=>{S.decks={};S.topics={};S.coins=0;S.cfg.creativeMode='always'}")
    key = 'A4.divtens'
    E("(k)=>{getDeck(k);const t=topicRec(k);t.hist=[{ts:Date.now()-864e5,done:Date.now()-3*864e5,pts:50,max:75}];t.cb=[0,0,0]}", key)
    paid3 = E("(k)=>{const d=S.decks[k];for(let i=0;i<10;i++){d.res[i]='first';d.i=i+1;}return creditDeckAnswer(k,d,9)}", key)
    ok(paid3 == 0, 'Wiederholung nach 3 Tagen zahlt nichts (%s)' % paid3)
    E("(k)=>{const t=topicRec(k);t.hist=[{ts:Date.now()-864e5,done:Date.now()-10*864e5,pts:50,max:75}];t.cb=[0,0,0];t.revPaid=0}", key)
    paid10 = E("(k)=>{const d=S.decks[k];return creditDeckAnswer(k,d,9)}", key)
    ok(0 < paid10 <= 15, 'Wiederholung nach 10 Tagen zahlt, höchstens 15 (%s)' % paid10)
    E("(k)=>{const d=S.decks[k];for(let i=10;i<30;i++){d.res[i]='first';d.i=i+1;}creditDeckAnswer(k,d,19);creditDeckAnswer(k,d,29)}", key)
    ok(E("(k)=>topicRec(k).revPaid", key) <= 15, 'pro Wiederholungsrunde höchstens 15 Münzen (%s)' % E("(k)=>topicRec(k).revPaid", key))
    # --- Hefte A–D und Jetzt üben
    E("()=>{S.decks={};S.topics={};S.lastKey='';S.cfg.due={A:'2099-10-20'}}")
    E("()=>go('hefte')"); t = pg.locator('#app').inner_text()
    ok(all(x in t for x in ['Kapitel A', 'Kapitel B', 'Kapitel C', 'Kapitel D', 'A1', 'A5', 'D5', 'Herbstferien', 'Weihnachtsferien', 'Osterferien', 'Sommerferien']), 'Hefte: Kapitel A–D mit je 5 Plätzen und Ferien')
    ok('20. Oktober' in t, 'Hefte: Termin des Kapitels sichtbar')
    nu = E("()=>{const n=nextUp();return n&&n.key}"); ok(nu is not None and nu.startswith('A4.'), 'Jetzt üben: erstes offenes Thema in Kapitel A (%s)' % nu)
    E("()=>go('home')"); ok(pg.locator('.fc-hero [data-act=goNext]').count() == 1, 'Startseite: ein klarer Üben-Knopf (goNext)')
    E("()=>startNext()"); ok(E("()=>view") == 'play', 'Anfangen startet die Aufgaben')
    # --- Tagesziel: Münzen statt Flammen, Karte, Kreativzeit
    E("()=>{go('home');S.decks={};S.cfg.goal=2;S.coins=0;S.chests=0;S.daily={d:ymd(),n:0,sec:0,got:false,unlocked:false,testRewarded:false,shopSec:0,cr:{left:0,grants:0,used:0,lvl:false,goal:false}};S.cfg.creativeMode='after';dailyCheck();dailyCheck()}")
    ok(E("()=>S.coins") >= 3 and E("()=>S.flames") == 0 and E("()=>S.chests") == 1 and E("()=>creativeLeft()") == 300, 'Tagesziel: Münzen, 1 Karte, Kreativzeit (coins=%s)' % E("()=>S.coins"))
    # --- Fino-Name
    E("()=>{S.coins=999;buyItem('fn.pixel');ACT.setFinoName('Pixel')}"); ok(E("()=>FN()") == 'Pixel', 'Fino umbenannt (nur gekaufte Namen im Shop)')
    # --- Mini-Test: pro Tag zählt das beste Ergebnis, ein besserer Test zahlt nur die Differenz
    E("()=>{S.coins=0;S.life=0;S.starsLife=0;S.chests=0;S.daily={d:ymd(),n:0,sec:0,got:false,unlocked:false,testRewarded:false,shopSec:0,cr:{left:0,grants:0,used:0,lvl:false,goal:false}}}")
    r0 = E("()=>payTest(4)"); ok(r0['c'] == 0 and E("()=>S.daily.testRewarded") is False and E("()=>testLeft().c") == 10, 'schwacher erster Test verbraucht nichts')
    r1 = E("()=>payTest(8)"); ok(r1['c'] == 3 and r1['s'] == 1 and not r1['ch'], '8 richtig: 3 Münzen + 1 Stern')
    r2 = E("()=>payTest(8)"); ok(r2['c'] == 0 and r2['s'] == 0, 'gleiches Ergebnis zahlt nicht nochmal')
    r3 = E("()=>payTest(12)"); ok(r3['c'] == 3 and r3['s'] == 1 and r3['ch'], '12 richtig: nur Differenz (+3, +1) und die Karte')
    r4 = E("()=>payTest(15)"); ok(r4['c'] == 4 and r4['s'] == 1 and not r4['ch'], '15 richtig: Rest bis 10 Münzen / 3 Sterne, keine zweite Karte')
    ok(E("()=>[S.coins,S.starsLife,S.chests,S.daily.testRewarded]") == [10, 3, 1, True], 'Tages-Maximum unverändert: 10 Münzen, 3 Sterne, 1 Karte')
    ok(E("()=>payTest(15).c") == 0, 'danach nichts mehr am selben Tag')
    E("()=>{S.daily={d:ymd(),n:0,sec:0,got:false,unlocked:false,testRewarded:true,shopSec:0,cr:{left:0,grants:0,used:0,lvl:false,goal:false}};S.coins=0}")
    ok(E("()=>payTest(15).c") == 0 and E("()=>S.coins") == 0, 'alter Stand (heute schon belohnt) zahlt nicht doppelt')
    E("()=>go('testSetup')"); ok('Heute schon alles verdient' in pg.locator('#app').inner_text(), 'Mini-Test zeigt ehrlich: heute schon alles verdient')
    # --- Avatar-Spitzname getrennt vom Urkunden-Namen
    E("()=>{S.name='Mia';S.av.look=S.av.look||{};S.av.use=true;S.avName='Kapitänin Komma';go('profile')}")
    t = pg.locator('#app').inner_text()
    ok('Kapitänin Komma' in t and E("()=>S.name") == 'Mia', 'Profil zeigt Avatar-Spitzname, Name bleibt für Urkunde')
    E("()=>{UI.bMod='A4';go('urkunde')}"); ok('Mia' in pg.locator('#app').inner_text() and 'Kapitänin' not in pg.locator('#app').inner_text(), 'Urkunde nutzt den echten Namen')
    # --- Extra-Training: Einmaleins & Co. sichtbar, nicht von „Jetzt üben“ vorgeschlagen
    E("()=>{S.decks={};S.topics={};S.lastKey='';go('hefte')}"); t = pg.locator('#app').inner_text()
    ok('Extra-Training' in t and 'Einmaleins' in t and 'Kopfrechnen' in t and 'Schriftlich rechnen' in t, 'Hefte: Extra-Training mit Einmaleins, Kopfrechnen, Schriftlich')
    ok(E("()=>MODULES.filter(isExtra).map(m=>m.id).join()") == 'EMAL,KOPF,SCHR', 'Extras sind extra:true')
    ok(not E("()=>isExtra(nextUp().mod)"), 'Jetzt üben schlägt kein Extra vor')
    ok(pg.locator('.rh-soon').count() >= 3 and 'Kommt bald' in t, 'kommende Hefte gesperrt sichtbar')
    E("()=>{UI.mod='EMAL';go('module')}"); ok(pg.locator('.topic').count() == 4, 'Einmaleins: 4 Übungen')
    E("()=>{UI.mod='EMAL';ACT.topic('mal');ACT.practice()}"); ok(E("()=>view") == 'play', 'Einmaleins lässt sich üben')
    # --- Kein Zoomen (Tablet)
    ok('user-scalable=no' in E("()=>document.querySelector('meta[name=viewport]').content"), 'kein Pinch-Zoom')
    print('Fehler:', errs); ok(not errs, 'keine Konsolenfehler')
    b.close()
print('\n%d FAILS' % len(fails) if fails else '\nALL ECONOMY CHECKS PASSED')
sys.exit(1 if fails else 0)
