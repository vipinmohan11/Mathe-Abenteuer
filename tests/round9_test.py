"""Runde 9: Musik + Geschichte in der Ideenwerkstatt, „Lustige Karten“ (Fakten + Karten), „Kopfrechnen“ (Einmaleins + Kopfrechnen + Schriftlich
in einer Liste, gespeicherte Fortschritte unverändert), schwebende Notizbuch-Blase auf jeder Seite mit Pop-up und deutlichem Zettel/Liste-Schalter.
Aufruf: python3 round9_test.py /abs/pfad/Mathe-Abenteuer_Klasse4.html"""
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
    E("()=>{window.__rwOff=1;S.name='Mira';S.coins=300;S.life=300;S.starsLife=40;S.stars=40;S.cards={[CARDS[0].id]:1};S.trophies={blk1:1};S.daily.n=25;S.cfg.shopMin=0;S.cfg.limitMin=0;S.cfg.creativeMode='always';save()}")
    kid0 = E("()=>JSON.stringify([S.coins,S.starsLife,S.cards,Object.keys(S.trophies)])")

    # ---------- 1: Musik + Geschichte in der Ideenwerkstatt ----------
    E("()=>go('kreativhefte')"); pg.wait_for_timeout(100)
    acts = E("()=>[...document.querySelectorAll('.dz-tile')].map(t=>t.dataset.act)")
    ok(acts == ['musik', 'story', 'noten'], 'Ideenwerkstatt: Meine Musik, Geschichte, Notenheft (%s)' % acts)
    E("()=>go('rewards')"); ok(E("()=>[...document.querySelectorAll('.dz-tile')].map(t=>t.dataset.act).join()") == 'shop,welt', 'Meine Welt ohne Musik, Geschichte, Fakten')
    E("()=>{go('kreativhefte')}"); pg.click('.dz-tile[data-act=musik]'); pg.wait_for_timeout(200)
    ok(E("()=>view") == 'musik', 'Meine Musik öffnet'); pg.click('.top .back[data-act=back]'); pg.wait_for_timeout(100)
    ok(E("()=>view") == 'kreativhefte', 'Zurück aus Meine Musik → Ideenwerkstatt')
    pg.click('.dz-tile[data-act=story]'); pg.wait_for_timeout(200); ok(E("()=>view") == 'story', 'Geschichte öffnet')
    pg.click('.top .back[data-act=back]'); pg.wait_for_timeout(100); ok(E("()=>view") == 'kreativhefte', 'Zurück aus Geschichte → Ideenwerkstatt')
    E("()=>{S.daily.n=0;S.daily.sec=0;S.daily.free=240;rgResetAll();save()}")
    ok(E("()=>viewState('musik').open && viewState('story').open"), 'Ideenwerkstatt-Bereiche brauchen keine Hausaufgabe (wie früher Notizbuch/Notenheft)')
    ok(E("()=>secOf('musik').m=='m_kreativ'&&secOf('story').m=='m_kreativ'&&secOf('storyread').m=='m_kreativ'"), 'Eltern-Bereich: Musik und Geschichte gehören zur Ideenwerkstatt')
    ok(E("()=>SEC_TREE().find(m=>m.id=='m_kreativ').subs.map(s=>s[0]).join()") == 'musik,story,noten' and E("()=>SEC_TREE().find(m=>m.id=='m_welt').subs.map(s=>s[0]).join()") == 'shop,welt', 'Eltern-Liste: Unterbereiche umgezogen')
    E("()=>{S.daily.n=25;permSet('story','lock');go('kreativhefte')}")
    ok('Noch zu' in pg.inner_text('.dz-tile[data-act=story]') and 'Noch zu' not in pg.inner_text('.dz-tile[data-act=musik]'), 'Eltern können Geschichte einzeln sperren')
    E("()=>permSet('story','')")

    # ---------- 2: Lustige Karten ----------
    c0 = E("()=>JSON.stringify([S.cards,S.chests,S.coins])")
    E("()=>ACT.schatz()"); pg.wait_for_timeout(100)
    ok('Lustige Karten' in pg.inner_text('.top') and 'Lustige Fakten' not in pg.inner_text('.top') and 'Schatzkammer' not in pg.inner_text('#app'), 'Titel „Lustige Karten“ (kein Schatzkammer, keine eigene Fakten-Seite)')
    n = pg.locator('.tgrid .tcard.ty-fakt').count()
    ok(n >= 24 and pg.locator('.tgrid .tcard .tpic').count() >= 24, 'Fakten im Karten-Format (Bildkopf + Text) in einem Raster (%d)' % n)
    ok(pg.locator('.sk-seg button').count() == 3, 'Filter Alle / Verdient / Fakten')
    pg.click('.sk-seg [data-arg=mine]'); pg.wait_for_timeout(80); ok(pg.locator('.tgrid .tcard').count() == 1, 'Filter „Verdient“: nur die eine verdiente Karte (%d fakt, %d gesamt, %s)' % (pg.locator('.tgrid .tcard.ty-fakt').count(), pg.locator('.tgrid .tcard').count(), E("()=>Object.keys(S.cards)")))
    pg.click('.sk-seg [data-arg=fakt]'); pg.wait_for_timeout(80); ok(pg.locator('.tgrid .tcard').count() >= 24 and pg.locator('.sk-seg .active, .sk-seg [aria-pressed=true]').count() == 1, 'Filter „Fakten“; gewählter Filter ist markiert')
    ok(E("()=>JSON.stringify([S.cards,S.chests,S.coins])") == c0, 'Fakten geben keine Belohnung (Karten, Truhen, Münzen unverändert)')
    E("()=>{ACT.schatz()}"); ok(E("()=>view") == 'schatz' and E("()=>!VIEWS.fakten"), 'Alte Fakten-Seite ist weg, Karten-Seite bleibt am alten Ort')
    E("()=>go('profile')"); ok(pg.locator('.dz-stat[data-act=schatz]').count() == 1 and 'Lustige Karten' in pg.inner_text('.dz-stat[data-act=schatz]'), 'Profil: Einstieg „Lustige Karten“ am alten Ort')
    E("()=>{S.chests=1;save();ACT.schatz()}"); pg.click('[data-act=openChest]'); pg.wait_for_timeout(100)
    ok(E("()=>Object.keys(S.cards).length") == 2 and pg.locator('.tcard.hot').count() >= 1, 'Truhe öffnen funktioniert weiter (verdiente Karte kommt dazu)')

    # ---------- 3: Kopfrechnen ----------
    E("()=>{S.decks['EMAL.mal']=newDeck?undefined:undefined}") if False else None
    before = E("()=>JSON.stringify(Object.keys(S.decks).sort())")
    E("()=>go('hefte')"); pg.wait_for_timeout(100)
    ok(E("()=>[...document.querySelectorAll('.dz-hefte6 .dz-tile strong')].map(e=>e.textContent).join('|')") == 'Los geht’s|Fehler-Heft|Mini-Test|Kopfrechnen', 'Meine Hefte: Kopfrechnen ersetzt die drei Kacheln')
    pg.click('.dz-tile[data-act=kopf]'); pg.wait_for_timeout(100)
    tp = E("()=>[...document.querySelectorAll('.topic')].map(t=>t.querySelector('h3').textContent)")
    ok(len(tp) == 9 and E("()=>view") == 'kopf' and pg.locator('.dz-tile, .dz-acc').count() == 0, 'Kopfrechnen: %d Übungen direkt, ohne Unterordner (%s)' % (len(tp), tp))
    ids = E("()=>MODULES.filter(isExtra).flatMap(m=>m.topics.map(t=>tk(m.id,t.id))).join()")
    ok(ids == 'EMAL.mal,EMAL.geteilt,EMAL.luecke,EMAL.reihe,KOPF.plus,KOPF.minus,KOPF.dopp,SCHR.add,SCHR.sub', 'Alle Schlüssel der Übungen unverändert (%s)' % ids)
    pg.click('.topic >> nth=5'); pg.wait_for_timeout(120)
    ok(E("()=>view") == 'topic' and E("()=>UI.key") == 'KOPF.minus', 'Übung aus der Mischliste öffnet das richtige Deck (KOPF.minus)')
    pg.click('.top .back[data-act=back]'); pg.wait_for_timeout(100); ok(E("()=>view") == 'kopf', 'Zurück aus der Übung → Kopfrechnen')
    E("()=>{UI.mod='SCHR';ACT.practice&&0}")
    E("()=>kopfTopic?0:0") if False else None
    E("()=>ACT.kopfTopic('SCHR.add')"); pg.wait_for_timeout(100)
    E("()=>ACT.practice()"); pg.wait_for_timeout(150)
    ok(E("()=>view") == 'play' and E("()=>R.key") == 'SCHR.add', 'Üben aus Schriftlich-Aufgaben startet (SCHR.add)')
    E("()=>go('hefte')")
    ok(E("()=>JSON.stringify(Object.keys(S.decks).sort())").count('SCHR.add') == 1, 'Fortschritt wird unter dem alten Schlüssel gespeichert')
    E("()=>{ACT.mod('SCHR')}"); pg.wait_for_timeout(100); ok(E("()=>view") == 'kopf', 'Alte Einsprünge (Heft SCHR) führen zu Kopfrechnen')
    E("()=>{S.cfg.perm={};permSet('SCHR','lock');go('hefte')}"); pg.wait_for_timeout(100)
    ok('Noch zu' in pg.inner_text('.dz-tile[data-act=kopf]'), 'Alte Eltern-Sperre für Schriftlich Rechnen gilt weiter für Kopfrechnen')
    E("()=>{S.cfg.perm={};save()}")
    ok(E("()=>MODULES.filter(isExtra).length") == 3 and E("()=>nextUp()&&!isExtra(nextUp().mod)"), 'Intern bleiben drei Hefte; „Los geht’s“ schlägt kein Extra vor')

    # ---------- 4: schwebende Notizbuch-Blase ----------
    E("()=>{S.notes=[];save()}")
    seen = []
    for v in ['home', 'hefte', 'kopf', 'kreativhefte', 'rewards', 'shop', 'profile', 'schatz', 'geo', 'welt', 'noten', 'musik', 'story']:
        E("(v)=>go(v)", v); pg.wait_for_timeout(120)
        vis = E("()=>{const b=document.getElementById('nzBubble');if(!b||b.hidden)return false;const r=b.getBoundingClientRect();return r.width>40&&r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}")
        if not vis: seen.append(v)
    ok(not seen, 'Blase ist auf jeder Seite sichtbar und im Bild (fehlt auf: %s)' % seen)
    ok(E("()=>!VIEWS.notiz") and pg.locator('.dz-tile[data-act=notiz]').count() == 0, 'Kein Notizbuch-Ordner mehr')
    E("()=>go('home')"); pg.click('#nzBubble'); pg.wait_for_timeout(120)
    ok(pg.locator('#nzOv .nz-modal').count() == 1 and E("()=>document.getElementById('nzBubble').hidden"), 'Antippen öffnet das Pop-up; Blase verschwindet dahinter')
    ok(E("()=>view") == 'home', 'Die Seite dahinter bleibt, wo sie war')
    # Zettel anlegen
    pg.click('#nzOv [data-act=noteNew]'); pg.wait_for_timeout(60)
    sel = E("()=>[...document.querySelectorAll('.nz-opt')].map(o=>[o.textContent.trim(),o.classList.contains('sel'),o.getAttribute('aria-checked')])")
    ok(len(sel) == 2 and sel[0][1] and not sel[1][1] and sel[0][2] == 'true' and sel[1][2] == 'false', 'Schalter: „Zettel“ ist gewählt (gefüllt, aria-checked), „Liste“ nicht (%s)' % sel)
    st = E("()=>{const a=getComputedStyle(document.querySelector('.nz-opt.sel')),b=getComputedStyle(document.querySelector('.nz-opt:not(.sel)'));return {a:a.backgroundColor,b:b.backgroundColor,as:a.borderStyle,bs:b.borderStyle,ck:!!document.querySelector('.nz-opt.sel svg')}}")
    ok(st['a'] != st['b'] and st['ck'], 'Gewählt = andere Füllfarbe, Häkchen; ungewählt = transparent (%s)' % st)
    pg.click('.nz-opt[data-arg=liste]'); pg.wait_for_timeout(60)
    ok(E("()=>document.querySelectorAll('.nz-opt.sel')[0].dataset.arg") == 'liste' and E("()=>document.querySelectorAll('.nz-opt.sel').length") == 1 and pg.locator('#noteTitleIn').count() == 1, 'Wechsel zu „Liste“: Auswahl wandert, Listen-Editor erscheint')
    pg.click('.nz-opt[data-arg=zettel]'); pg.click('[data-act=noteTagPick][data-arg=idea]'); pg.fill('#noteIn', 'Pop-up Zettel'); pg.click('[data-act=noteSave]'); pg.wait_for_timeout(100)
    ok(E("()=>S.notes.length") == 1 and E("()=>!!document.getElementById('nzOv')") and pg.locator('#nzOv .nz-note').count() == 1, 'Zettel gespeichert; Pop-up zeigt ihn an der Wand')
    pg.click('#nzOv [data-act=noteNew]'); pg.click('.nz-opt[data-arg=liste]'); pg.fill('#noteTitleIn', 'Einkauf'); pg.fill('#noteItemIn', 'Äpfel'); pg.click('[data-act=noteItemAdd]'); pg.wait_for_timeout(60)
    ok(E("()=>document.activeElement&&document.activeElement.id") == 'noteItemIn', 'Nach „Hinzufügen“ bleibt der Cursor im Feld')
    pg.fill('#noteItemIn', 'Brot'); pg.click('[data-act=noteItemAdd]'); pg.click('[data-act=noteSave]'); pg.wait_for_timeout(100)
    ok(E("()=>S.notes.length") == 2 and pg.locator('#nzOv .nz-note').count() == 2 and pg.locator('#nzOv .nz-liste').count() == 1, 'Pop-up zeigt Zettel UND Listen zusammen')
    lid = E("()=>S.notes.find(n=>n.type==='liste').id"); iid = E("(a)=>S.notes.find(n=>n.id===a).items[0].id", lid)
    pg.click('#nzOv [data-act=noteItemToggle][data-arg="%s:%s"]' % (lid, iid)); pg.wait_for_timeout(80)
    ok(E("(a)=>S.notes.find(n=>n.id===a).items[0].done", lid) and E("()=>!!document.getElementById('nzOv')"), 'Häkchen in der Liste direkt im Pop-up')
    pg.click('#nzOv .nz-note:not(.nz-liste)'); pg.wait_for_timeout(80); ok(pg.locator('#noteIn').count() == 1 and pg.input_value('#noteIn') == 'Pop-up Zettel', 'Zettel antippen → bearbeiten im Pop-up')
    pg.click('[data-act=noteCancel]'); pg.wait_for_timeout(60); ok(pg.locator('#nzOv .nz-wall').count() == 1, 'Abbrechen → zurück zur Wand')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(80)
    ok(pg.locator('#nzOv').count() == 0 and not E("()=>document.getElementById('nzBubble').hidden"), 'Esc schließt das Pop-up, Blase ist wieder da')
    pg.click('#nzBubble'); pg.click('#nzOv [data-act=nzClose]'); pg.wait_for_timeout(60); ok(pg.locator('#nzOv').count() == 0, 'Schließen-Knopf')
    # gespeichert, bleibt nach Neuladen
    pg.reload(); pg.wait_for_timeout(400)
    ok(E("()=>S.notes.length") == 2 and E("()=>!!document.getElementById('nzBubble')"), 'Notizen bleiben nach Neuladen, Blase ist wieder da')
    ok(E("()=>document.querySelector('#nzBubble .nz-bubble-n').textContent") == '2', 'Blase zeigt die Anzahl')
    # verschieben
    bb = pg.locator('#nzBubble').bounding_box(); pg.mouse.move(bb['x'] + 25, bb['y'] + 25); pg.mouse.down(); pg.mouse.move(bb['x'] + 205, bb['y'] - 150, steps=6); pg.mouse.up(); pg.wait_for_timeout(450)
    b2 = pg.locator('#nzBubble').bounding_box()
    ok(abs(b2['x'] - bb['x'] - 180) < 6 and abs(b2['y'] - bb['y'] + 175) < 6 and pg.locator('#nzOv').count() == 0, 'Blase lässt sich verschieben, ohne das Pop-up zu öffnen')
    pg.reload(); pg.wait_for_timeout(400); b3 = pg.locator('#nzBubble').bounding_box(); ok(abs(b3['x'] - b2['x']) < 3 and abs(b3['y'] - b2['y']) < 3, 'Position bleibt nach Neuladen')
    # Mini-Test: Blase weg
    E("()=>{window.__rwOff=1;UI.scope='all';startTest()}"); pg.wait_for_timeout(200)
    ok(E("()=>view") == 'test' and E("()=>document.getElementById('nzBubble').hidden"), 'Im Mini-Test ist die Blase ausgeblendet')
    E("()=>{T.timer&&clearInterval(T.timer);go('home')}"); pg.wait_for_timeout(150)
    ok(not E("()=>document.getElementById('nzBubble').hidden"), 'Danach wieder da')
    # Phone: Pop-up passt in den Bildschirm
    pg.set_viewport_size({'width': 360, 'height': 640}); E("()=>{go('hefte');ACT.notiz();ACT.noteNew()}"); pg.wait_for_timeout(120)
    r = E("()=>{const m=document.querySelector('.nz-modal').getBoundingClientRect();return [m.left>=0,m.right<=innerWidth,m.top>=0,m.bottom<=innerHeight,document.documentElement.scrollWidth<=innerWidth]}")
    ok(all(r), 'Handy (360×640): Pop-up mit Schalter passt in den Bildschirm %s' % r)
    E("()=>ACT.nzClose()")
    # Stand des Kindes
    kid1 = E("()=>JSON.stringify([S.coins,S.starsLife,Object.keys(S.trophies)])")
    ok(kid0.startswith('[300,40') and kid1.startswith('[300,40'), 'Münzen und Sterne unverändert')
    ok(errs == [], 'keine JS-Fehler %s' % errs[:5])
print('\nFAILS:', fails); sys.exit(1 if fails else 0)
