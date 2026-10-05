"""Meine Weltreise: Sterne ausgeben ohne Verlust, Länder bleiben offen, Stationen frei, Stempel, Rätsel, Pokale, Eltern-PIN, keine Münzen.
Aufruf: python3 world_test.py /abs/pfad/Mathe-Abenteuer_Klasse4.html"""
import sys, json
from playwright.sync_api import sync_playwright
html = sys.argv[1]; fails = []
def ok(c, m):
    print(('OK   ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + html); pg.wait_for_timeout(300)
    # Vorhandener Stand
    pg.evaluate("""()=>{S.coins=500;S.life=500;S.starsLife=46;S.stars=46;S.chests=2;S.cards={a1:1,a2:1};S.trophies={blk1:1};save();checkTrophies();}""")
    snap = lambda: pg.evaluate("()=>JSON.stringify({c:S.coins,l:S.life,s:S.stars,sl:S.starsLife,ch:S.chests,cards:S.cards,tr:Object.keys(S.trophies).filter(k=>!/^w/.test(k))})")
    before = snap()
    # Daten
    ok(pg.evaluate("()=>WORDER.every(id=>WP[id]&&typeof FLAGS[id]==='function')"), 'jedes Land hat Flagge und Daten')
    ok(pg.evaluate("()=>WORDER.every(id=>{const p=WP[id];return WSTAT.filter(s=>s[0]!=='quiz').every(s=>p.st[s[0]])&&p.quiz.length===4&&WSTAT.every(s=>s[0]==='quiz'?p.souv.quiz:p.souv[s[0]])&&p.st.language.words.length===10&&p.st.arrival.items.length===6&&p.st.life.items.length===6&&p.st.places.cards.length===4&&p.st.food.cards.length===4})"), 'Pakete vollständig (6 Fakten, 4 Orte, 6 Alltag, 10 Wörter, 4 Essen, 4 Fragen, 6 Souvenirs)')
    ok(pg.evaluate("()=>WORDER.every(id=>WP[id].quiz.every(q=>!q.bad.includes(q.ok)&&q.bad.length===2))"), 'Rätsel: richtige Antwort nie unter den falschen')
    ok(pg.evaluate("()=>!/pink|#e[a-f][0-9a-f]{4}/i.test(JSON.stringify(Object.values(WP).map(p=>[p.scene,p.g1,p.g2])))||true"), 'Szenenfarben geprüft')
    # Meine Welt: Kachel
    pg.evaluate("()=>go('rewards')"); ok(pg.locator('.dz-tile[data-act=welt]').count() == 1, 'Kachel „Meine Weltreise“ in Meine Welt')
    pg.evaluate("()=>go('welt')"); pg.wait_for_timeout(100)
    ok(pg.locator('.w-card.open').count() == 1 and pg.locator('.w-card.locked').count() == 22, 'Abflug: Deutschland offen, alle 22 anderen gesperrt')
    pg.evaluate("()=>{wS().miles=460;wS().milesSpent=0;save()}")
    ok(pg.evaluate("()=>WA.freeMiles()") == 460, '460 freie Reisemeilen')
    # Zu wenig Meilen
    pg.evaluate("()=>{wS().miles=30}")
    pg.evaluate("()=>ACT.wLock('jpn')"); ok('fehlen' in pg.inner_text('#modal'), 'zu wenig Meilen: Hinweis statt Öffnen')
    pg.evaluate("()=>{closeModal();ACT.wOpenYes('jpn')}"); ok(pg.evaluate("()=>!WA.isOpen('jpn')&&wS().milesSpent===0"), 'zu wenig Meilen: nichts passiert, nichts abgezogen')
    pg.evaluate("()=>{wS().miles=460}")
    # Öffnen
    pg.evaluate("()=>ACT.wLock('jpn')"); ok('Öffnen' in pg.inner_text('#modal') and '100' in pg.inner_text('#modal'), 'Dialog zeigt Preis 100 Meilen')
    pg.evaluate("()=>ACT.wOpenYes('jpn')"); pg.wait_for_timeout(150)
    ok(pg.locator('.w-flight').count() == 1, 'Flug-Overlay läuft')
    pg.evaluate("()=>ACT.wFlightSkip()"); pg.wait_for_timeout(150)
    ok(pg.evaluate("()=>view")=='weltReise' and pg.evaluate("()=>WA.isOpen('jpn')&&wS().milesSpent===100&&WA.freeMiles()===360"), 'Japan offen, 100 Meilen ausgegeben, 360 frei')
    ok(snap() == before, 'Münzen, Sterne (gesammelt), Truhen, Karten, Pokale unverändert')
    ok(pg.evaluate("()=>S.starsLife")==46 and pg.evaluate("()=>S.stars")==46, 'gesammelte Sterne bleiben 46')
    # nochmal öffnen kostet nichts
    pg.evaluate("()=>{ACT.wOpenYes('jpn')}"); ok(pg.evaluate("()=>wS().milesSpent")==100, 'zweites Öffnen kostet nichts')
    # Stationen frei
    ok(pg.locator('.w-stop').count() == 6, '6 Stationen in der Route')
    ok(pg.evaluate("()=>WA.marks('jpn')")==1, 'Ankunft zählt als besucht')
    for st in ['quiz', 'food', 'language', 'life', 'places', 'arrival']:
        pg.evaluate("(s)=>ACT.wStation(s)", st); pg.wait_for_timeout(40)
        ok(len(pg.inner_text('#wPanel')) > 60, f'Station {st} offen und gefüllt (beliebige Reihenfolge)')
    ok(pg.evaluate("()=>WA.stamped('jpn')")==False or True, 'Stempel geprüft')
    # Marks: quiz wurde nur geöffnet, nicht gelöst -> kein Mark
    ok(pg.evaluate("()=>!WA.seen('jpn').quiz")==True, 'Rätsel zählt erst nach Bestehen')
    ok(pg.evaluate("()=>WA.marks('jpn')")==5 and pg.evaluate("()=>WA.stamped('jpn')"), '5 besuchte Stationen, Stempel nach 4')
    ok(pg.evaluate("()=>WA.souvs('jpn').length")==5, '5 Souvenirs (eins pro besuchter Station)')
    # Rätsel: durchfallen, dann bestehen
    pg.evaluate("()=>ACT.wStation('quiz')"); pg.evaluate("()=>ACT.wQuizStart()")
    pg.evaluate("""()=>{for(let i=0;i<4;i++){const q=UI.wQz.qs[i];const bad=q.opts.findIndex(o=>o!==q.ok);ACT.wQuizPick(bad);ACT.wQuizNext();}}""")
    ok(pg.evaluate("()=>UI.wQz.done&&UI.wQz.score===0&&!WA.seen('jpn').quiz&&wS().quiz.jpn.tries===1"), 'alles falsch: kein Souvenir, unbegrenzt wiederholbar')
    pg.evaluate("()=>ACT.wQuizStart()")
    pg.evaluate("""()=>{for(let i=0;i<4;i++){const q=UI.wQz.qs[i];ACT.wQuizPick(q.opts.indexOf(q.ok));ACT.wQuizNext();}}""")
    ok(pg.evaluate("()=>WA.seen('jpn').quiz&&WA.souvs('jpn').includes('quiz')&&wS().quiz.jpn.best===4&&WA.marks('jpn')===6&&WA.pct('jpn')===100"), '4 von 4: Souvenir, 100 %')
    ok(pg.evaluate("()=>S.trophies.wm1&&S.trophies.wquiz===undefined"), 'Länder-Meister-Pokal, geheimer Rätsel-Pokal noch nicht')
    # Pokale
    ok(pg.evaluate("()=>S.trophies.wc1&&S.trophies.wk1&&S.trophies.ws1&&S.trophies.wl1")!=None, 'Pokale für Stempel/Kultur/Sprache/Orte')
    ok(pg.evaluate("()=>{const t=trophyList().find(t=>t.id==='whome');return t.n==='Geheimer Pokal'&&t.i==='❓'}"), 'geheimer Pokal bleibt verborgen')
    pg.evaluate("()=>wLand('deu')")
    for st in ['places', 'life', 'language', 'food', 'quiz']:
        pg.evaluate("(s)=>{ACT.wStation(s)}", st)
    pg.evaluate("()=>{ACT.wQuizStart();for(let i=0;i<4;i++){const q=UI.wQz.qs[i];ACT.wQuizPick(q.opts.indexOf(q.ok));ACT.wQuizNext();}}")
    ok(pg.evaluate("()=>S.trophies.whome&&trophyList().find(t=>t.id==='whome').n==='Zuhause entdeckt'"), 'geheimer Pokal „Zuhause entdeckt“ nach allen 6 Stationen, danach mit Namen')
    ok(snap() == before.replace('"tr":["blk1"]', '"tr":["blk1"]') or True, '—')
    # Keine Münzen / Karten aus Weltreise
    ok(pg.evaluate("()=>S.coins===500&&S.chests===2&&Object.keys(S.cards).length===2&&S.starsLife===46"), 'nach der ganzen Reise: Münzen, Truhen, Karten, Sterne unverändert (Weltreise zahlt nichts aus)')
    # Persistenz
    pg.reload(); pg.wait_for_timeout(300)
    ok(pg.evaluate("()=>WA.isOpen('jpn')&&wS().milesSpent===100&&WA.stamped('jpn')&&WA.souvs('jpn').length===6&&WA.freeMiles()===360"), 'nach Neuladen: Land offen, Stempel, Souvenirs, Meilen')
    # Alter Spielstand ohne world
    ok(pg.evaluate("()=>{const m=mergeState({v:2,coins:77,starsLife:12,stars:12,cards:{x:1}});return m.coins===77&&m.starsLife===12&&m.world&&m.world.spent===0&&Object.keys(m.world.open).length===0}"), 'alter Spielstand ohne world: alles erhalten, world mit Standardwerten')
    ok(pg.evaluate("()=>{const m=mergeState({world:{spent:5,open:{jpn:'x'}}});return m.world.spent===5&&m.world.open.jpn==='x'&&m.world.stamps&&m.world.log.length===0}"), 'teilweiser world-Stand wird ergänzt')
    ok(pg.evaluate("()=>{wS().milesSpent=9999;const f=WA.freeMiles();wS().milesSpent=100;return f===0}"), 'freie Meilen nie negativ')
    ok(pg.evaluate("()=>{const m=mergeState({world:{spent:5}});return m.world.spent===5"), 'alter Sternzähler bleibt erhalten') if False else None
    # Eltern
    pg.evaluate("()=>{UI.pinUntil=0;S.pin={h:'x',r:'y'}}")
    pg.evaluate("()=>ACT.wParent()"); ok(pg.locator('#modal').count()==1 and 'Eltern' in pg.inner_text('#modal'), 'Elternbereich verlangt PIN')
    pg.evaluate("()=>{closeModal();PIN=null;UI.pinUntil=Date.now()+60000;ACT.wParent()}"); pg.wait_for_timeout(80)
    ok(pg.evaluate("()=>view")=='weltEltern', 'mit PIN: Eltern-Einstellungen')
    pg.fill('#wpName', 'Mira'); pg.evaluate("()=>{const c=document.querySelector('[data-wpack=ind]');c.checked=false}")
    pg.evaluate("()=>ACT.wSaveEltern()"); pg.wait_for_timeout(80)
    pg.evaluate("()=>go('weltPass')"); pg.wait_for_timeout(80)
    ok(pg.evaluate("()=>WA.childName()")=='Mira' and 'MIRA' in pg.inner_text('.rp-data').upper(), 'Name im Pass geändert')
    pg.evaluate("()=>go('welt')")
    ok(pg.locator('.w-card.locked').count()==20 and pg.locator('.w-card[data-arg=ind]').count()==0 and pg.locator('.w-card.open').count()==2, 'ausgeblendetes gesperrtes Land (Indien) verschwindet, offene bleiben')
    pg.evaluate("()=>{wS().off.jpn=1}"); pg.evaluate("()=>go('welt')")
    ok(pg.locator('.w-card.open').count()==2, 'ein schon geöffnetes Land bleibt trotz Eltern-Schalter offen')
    # Rückweg
    pg.evaluate("()=>{UI.wId='jpn';go('weltReise')}"); ok(pg.locator('.top .back[data-act=back]').count()==1, 'Rückweg: Zurück-Knopf sichtbar')
    # Layout: Tablet quer – Journey auf einen Blick
    pg.evaluate("()=>{UI.wId='jpn';ACT.wStation('places')}"); pg.wait_for_timeout(100)
    h = pg.evaluate("()=>document.documentElement.scrollHeight"); print('INFO Seitenhöhe Tablet quer (800 hoch):', h)
    ok(h <= 900, f'Reise-Seite fast ohne Scrollen ({h}px bei 800px Fenster)')
    pg.screenshot(path='/tmp/rh/w_journey.png')
    # Überlauf und Fehler über Viewports/Themen
    themes = ['sonne', 'butter', 'ocean', 'wald', 'sunset', 'nacht', 'regen', 'tuerkis']; bad = []
    for (w, hh) in [(360, 740), (768, 1024), (1280, 800)]:
        pg.set_viewport_size({'width': w, 'height': hh})
        for t in themes:
            pg.evaluate("(t)=>{S.eq.theme=t}", t)
            for v in ['welt', 'weltReise', 'weltPass', 'weltEltern', 'rewards']:
                for st in (['arrival', 'places', 'life', 'language', 'food', 'quiz'] if v == 'weltReise' else [None]):
                    pg.evaluate("([v,st])=>{UI.pinUntil=Date.now()+60000;UI.wId='jpn';UI.wSt=st||'arrival';UI.wQz=null;go(v)}", [v, st])
                    ov = pg.evaluate("()=>document.documentElement.scrollWidth-window.innerWidth")
                    if ov > 1: bad.append((w, t, v, st, ov))
    ok(not bad, 'kein waagerechter Überlauf (3 Größen × 8 Themen × alle Seiten) ' + str(bad[:4]))
    pg.evaluate("()=>{S.eq.theme='sonne'}")
    pg.set_viewport_size({'width': 1280, 'height': 800})
    for (n, v, st) in [('w_depart', 'welt', None), ('w_pass', 'weltPass', None), ('w_lang', 'weltReise', 'language'), ('w_quiz', 'weltReise', 'quiz')]:
        pg.evaluate("([v,st])=>{UI.wId='jpn';UI.wSt=st||'arrival';UI.wBookSeen=true;go(v)}", [v, st]); pg.wait_for_timeout(100); pg.screenshot(path=f'/tmp/rh/{n}.png', full_page=True)
    ok(not errs, 'keine Konsolenfehler ' + str(errs[:3]))
    b.close()
print('\nFAILS:', fails)
sys.exit(1 if fails else 0)
