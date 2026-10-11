"""Runde 10: Sammelalbum im Shop (4 Sets à 6 Figuren + Legende), alte Tier-Sticker -> gleich viele zufällige neue Figuren, Geschenke und Set-Belohnung.
Aufruf: python3 round10_test.py /abs/pfad/Mathe-Abenteuer_Klasse4.html"""
import sys
from playwright.sync_api import sync_playwright
html = sys.argv[1]; fails = []
def ok(c, m):
    print(('OK   ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + html); pg.wait_for_timeout(300)
    E = pg.evaluate
    E("()=>{window.__rwOff=1;S.coins=500;S.life=500;S.cfg.shopMin=0;S.cfg.limitMin=0;save()}")

    # ---------- Daten ----------
    ok(E("()=>ALB_SETS.length")==4 and E("()=>ALB_SETS.every(s=>s.ch.length===6)"), '4 Sets mit je 6 Figuren')
    ok(E("()=>ALB_SETS.every(s=>[...s.ch,s.legend].every(c=>CATALOG['fg.'+c.id] && CATALOG['fg.'+c.id].svg.length>200))"), 'alle 28 Figuren im Katalog mit Bild')
    ok(E("()=>Object.keys(CATALOG).filter(k=>k.startsWith('fg.')).length")==28, '28 Katalogeinträge (24 + 4 Legenden)')
    ok(E("()=>ALB_OLD.every(k=>!CATALOG['bs.'+k])"), 'alte Tier-Sticker sind aus dem Katalog')
    ok(E("()=>Object.values(CATALOG).filter(i=>i.kind==='figur'&&i.leg).every(i=>i.src.t==='milestone')"), 'Legenden sind nie kaufbar')
    ok(E("()=>new Set(Object.keys(CATALOG)).size===Object.keys(CATALOG).length"), 'keine doppelten Ids')

    # ---------- Umzug alter Sticker ----------
    E("()=>{ALB_OLD.slice(0,8).forEach(k=>S.unl['bs.'+k]=1);S.unl['bs.stern']=1;S.album=undefined;S.coins=500;albumMig()}")
    mine = E("()=>Object.keys(CATALOG).filter(k=>k.startsWith('fg.')&&!CATALOG[k].leg&&hasItem(k))")
    ok(len(mine) == 8, '8 alte Tier-Sticker -> 8 neue Figuren (%d)' % len(mine))
    ok(E("()=>ALB_OLD.every(k=>!S.unl['bs.'+k])") and E("()=>!!S.unl['bs.stern']"), 'alte Tier-Ids entfernt, Stern bleibt')
    sets = set(E("()=>ALB_CH.filter(c=>hasItem('fg.'+c.id)).map(c=>c.set)"))
    ok(len(sets) >= 2, 'zufällig über mehrere Sets verteilt (%s)' % sets)
    E("()=>albumMig()"); ok(E("()=>ALB_CH.filter(c=>hasItem('fg.'+c.id)).length")==8, 'Umzug läuft nur einmal')
    # mehr alte als neue Plätze: Rest als Münzen
    E("()=>{S.album=undefined;ALB_CH.forEach(c=>S.unl['fg.'+c.id]=1);S.unl['bs.fuchs']=1;S.unl['bs.panda']=1;S.coins=100;albumMig()}")
    ok(E("()=>S.coins")==130, 'Ohne freie Figuren: 15 Münzen je altem Sticker (%s)' % E("()=>S.coins"))
    E("()=>{Object.keys(S.unl).filter(k=>k.startsWith('fg.')).forEach(k=>delete S.unl[k]);S.album={mig:1};S.coins=500}")

    # ---------- Shop ----------
    E("()=>go('shop')"); pg.wait_for_timeout(100)
    tabs = E("()=>[...document.querySelectorAll('.tabs')[0].querySelectorAll('button')].map(x=>x.textContent.trim())")
    ok(any(t.endswith('Sticker') for t in tabs) and not any('Stickerbuch' in t or 'Sammelalbum' in t for t in tabs), 'Shop: Reiter „Sticker“, kein Stickerbuch mehr (%s)' % tabs)
    pg.click('.tabs button[data-arg=album]'); pg.wait_for_timeout(100)
    ok(E("()=>document.querySelectorAll('.alb-ser').length")==4 and E("()=>document.querySelectorAll('.alf').length")==32, 'Eine Seite: 4 Serien-Reihen mit je 8 Feldern (6 + Legende + Belohnung)')
    ok(E("()=>!document.querySelector('.alb-set, .alb-back')"), 'Kein Öffnen einzelner Sets nötig')
    ok(E("()=>[...document.querySelectorAll('.alf-i')].every(e=>e.getBoundingClientRect().width>=70)"), 'Figuren sind groß (mind. 70 px)')
    ok(not E("()=>buyItem('fg.schraubi')") and not E("()=>hasItem('fg.schraubi')"), 'Figuren sind nie kaufbar')
    ok(E("()=>Object.values(CATALOG).filter(i=>i.kind==='figur').every(i=>i.src.t==='milestone')"), 'Alle Figuren sind nur Belohnungen')

    # ---------- Geschenk ----------
    E("()=>{const g=giftS();g.open=['gq40','gq100','gq200','gq350','gq550','gq800'];S.gifts.got.gq40=1}")
    n0 = E("()=>ALB_CH.filter(c=>hasItem('fg.'+c.id)).length")
    E("()=>{for(let i=0;i<6;i++){ACT.giftGo();closeModal();}}")
    n1 = E("()=>ALB_CH.filter(c=>hasItem('fg.'+c.id)).length")
    ok(n1 > n0, 'Geschenke geben neue Figuren (%d -> %d)' % (n0, n1))

    # ---------- Set komplett ----------
    E("()=>{Object.keys(S.unl).filter(k=>k.startsWith('fg.')).forEach(k=>delete S.unl[k]);S.album={mig:1};S.coins=100;S.life=100;['broeckel','flitz','funkel','giesserich','klimpi'].forEach(k=>S.unl['fg.'+k]=1);albumCheck()}")
    ok(not E("()=>hasItem('fg.urpilz')"), '5 von 6: Legende noch nicht da')
    E("()=>{S.unl['fg.glimmer']=1;albumCheck()}")
    ok(E("()=>hasItem('fg.urpilz')") and E("()=>S.coins")==150, '6 von 6: Legende + 50 Münzen')
    ok(E("()=>hasItem('acc.pilzhut')") and not E("()=>hasItem('acc.tueftler')"), 'Set komplett: seltenes Avatar-Zubehör Pilzhut (nur das der Serie)')
    ok(E("()=>ALB_SETS.every(s=>CATALOG[s.reward] && CATALOG[s.reward].src.t==='milestone')"), 'Jede Serie hat ein Avatar-Zubehör als Belohnung')
    ok(E("()=>!!document.querySelector('#modal')") , 'Meldung „Set komplett“')
    E("()=>{closeModal();albumCheck()}"); ok(E("()=>S.coins")==150, 'Belohnung nur einmal')

    # ---------- Mein Buch ----------
    ok(E("()=>bkStickers().some(i=>i.kind==='figur')") and E("()=>!bkStickers().some(i=>i.e==='🦊')"), 'Mein Buch kennt die neuen Figuren, keine Tier-Sticker mehr')
    ok(not errs, 'keine Konsolenfehler %s' % errs[:3])
    b.close()
print('\nFAILS:', fails) if fails else print('\nAlles ok.')
sys.exit(1 if fails else 0)
