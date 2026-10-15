"""Blinkis Punktkarten (Entdeckungen 1–14, Tagesrätsel, Freundes-Armbänder) und Venola-Symbole: Schalter (Standard aus), alle Entdeckungen über die Oberfläche durchspielen,
Zaubertrick, Lumi, Armband, Druckbogen, Eltern-Karte, keine Münzen.
Aufruf: python3 punkte_test.py /abs/pfad/Mathe-Abenteuer_Klasse4.html [screenshot-ordner]"""
import sys, re
from playwright.sync_api import sync_playwright
html = sys.argv[1]; shots = sys.argv[2] if len(sys.argv) > 2 else None; fails = []
def ok(c, m):
    print(('OK   ' if c else 'FAIL ') + m)
    if not c: fails.append(m)

def cards(pg):
    return pg.evaluate("()=>[...document.querySelectorAll('#pkRoot .pk-slot')].map(s=>({v:+s.dataset.v,up:!s.querySelector('.pk-card').classList.contains('down')}))")
def set_to(pg, n):
    for i, c in enumerate(cards(pg)):
        want = bool(n & c['v'])
        if c['up'] != want:
            pg.locator('#pkRoot .pk-card').nth(i).click(); pg.wait_for_timeout(40)
def total(pg):
    return sum(c['v'] for c in cards(pg) if c['up'])
def foot(pg, label, timeout=6000):
    pg.locator('#pkRoot .pk-foot .btn', has_text=label).first.click(timeout=timeout)
def shot(pg, name):
    if shots: pg.screenshot(path=f'{shots}/pk_{name}.png')
def next_lv(pg):
    foot(pg, 'Nächste Entdeckung'); pg.wait_for_timeout(250)

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 834, 'height': 1112}, device_scale_factor=1)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + html); pg.wait_for_timeout(300)
    E = pg.evaluate
    E("()=>{S.name='Mia';S.coins=40;save()}")
    coins0 = E("()=>S.coins")
    ok(E("()=>DZ_FLAGS.some(f=>f.id==='punkte')") and not E("()=>flagOn('punkte')"), 'Schalter vorhanden, Standard: ausgeblendet')
    E("()=>go('rewards')"); pg.wait_for_timeout(80)
    ok(not pg.query_selector('[data-act=punkte]'), 'Meine Welt: ohne Schalter keine Kachel')
    E("()=>{S.pin={h:hashStr('1234'),r:'x'};UI.pinUntil=Date.now()+1e9;S.cfg.plang='de';go('parent')}"); pg.wait_for_timeout(100)
    if pg.query_selector('.sw[data-arg=punkte]'): pg.click('.sw[data-arg=punkte]')
    else: E("()=>ACT.dzFlag('punkte')")
    ok(E("()=>flagOn('punkte')"), 'Eltern schalten die Punktkarten ein')
    E("()=>go('rewards')"); pg.wait_for_timeout(80)
    ok(bool(pg.query_selector('[data-act=punkte]')), 'Meine Welt: Kachel erscheint')
    pg.click('[data-act=punkte]'); pg.wait_for_timeout(150)
    ok(E("()=>view")=='punkte' and pg.locator('.pk-lv').count()==14, 'Übersicht mit 14 Entdeckungen')
    ok(pg.locator('.pk-lv.lock').count()==13, 'Nur die erste Entdeckung ist offen')
    ok(not pg.query_selector('.pk-tag'), 'Tagesrätsel erst nach Entdeckung 4')
    shot(pg, 'hub')
    pg.click('.pk-hero .btn'); pg.wait_for_timeout(250)
    ok(E("()=>view")=='pkLevel' and E("()=>UI.pkLv")==1, 'Los geht’s startet Entdeckung 1')

    # 1 – eine Karte
    pg.wait_for_timeout(1200)                     # Vormacher läuft
    pg.locator('#pkRoot .pk-card').first.click(); pg.wait_for_timeout(450)
    ok(total(pg)==0, '1: Antippen dreht die Karte um (0 Punkte)')
    pg.locator('#pkRoot .pk-card').first.click(); pg.wait_for_timeout(500)
    shot(pg, 'l1')
    foot(pg, 'Fertig'); pg.wait_for_timeout(300)
    ok(bool(pg.query_selector('.pk-result')) and E("()=>!!S.punkte.done[1]"), '1: Ergebnis mit Entdeckung, gespeichert')
    ok(pg.locator('.pk-result .pk-foot .btn').count()==0 and len(pg.inner_text('.pk-learn')) < 70, 'Entdeckung: ein kurzer Satz, Knöpfe erst nach einer Pause')
    pg.wait_for_timeout(2300)
    ok(pg.locator('.pk-result .pk-foot .btn').count()==3, 'Entdeckung: danach erscheinen die Knöpfe')
    shot(pg, 'result')
    next_lv(pg)

    # 2 und 3 – alle Zahlen finden, die Zahl dahinter geht nicht
    for lv, n in ((2, 4), (3, 8)):
        pg.locator('#pkRoot .pk-stamp.beyond').click(); pg.wait_for_timeout(200)
        ok('nicht' in pg.inner_text('#pkRoot .pk-bubble'), f'{lv}: Die Zahl {n} ist nicht möglich (Blinki sagt es)')
        for k in range(n): set_to(pg, k); pg.wait_for_timeout(120)
        pg.wait_for_timeout(1900)
        ok(pg.locator('#pkRoot .pk-stamp.found').count()==n, f'{lv}: alle {n} Zahlen gefunden')
        ok(bool(pg.query_selector('#pkRoot .pk-stamp.beyond.call')), f'{lv}: die {n} ruft nach einer neuen Karte')
        shot(pg, f'l{lv}')
        foot(pg, 'Fertig'); pg.wait_for_timeout(300); next_lv(pg)

    # 4 – der Code
    ok(pg.inner_text('#pkRoot .pk-code').replace('\n','')=='101', '4: Code 101 bei 4 und 1 offen')
    for i in (1, 0, 2): pg.locator('#pkRoot .pk-card').nth(i).click(); pg.wait_for_timeout(250)
    ok(pg.inner_text('#pkRoot .pk-code').replace('\n','')=='010' and pg.inner_text('#pkRoot .pk-num')=='2', '4: Code und Zahl folgen den Karten (010 = 2)')
    pg.click('#pkRoot .pk-counter'); pg.wait_for_timeout(300)
    shot(pg, 'l4')
    foot(pg, 'Fertig'); pg.wait_for_timeout(300); next_lv(pg)

    # 5 – Zaubertrick
    nc = pg.locator('#pkRoot .pk-ncard')
    nc.nth(0).click(); nc.nth(2).click(); shot(pg, 'l5a')
    foot(pg, 'Fertig'); pg.wait_for_timeout(1400)
    ok('5' in pg.inner_text('#pkRoot .pk-bubble'), '5: Blinki errät die 5 (Karten 4 und 1)')
    foot(pg, 'Stimmt nicht'); pg.wait_for_timeout(200)
    ok('Schau genau' in pg.inner_text('#pkRoot .pk-bubble'), '5: „Stimmt nicht“ lässt das Kind selbst prüfen')
    foot(pg, 'Fertig'); pg.wait_for_timeout(1400); foot(pg, 'Stimmt!'); pg.wait_for_timeout(150)
    foot(pg, 'Nochmal'); nc.nth(1).click(); foot(pg, 'Fertig'); pg.wait_for_timeout(1400)
    ok('2' in pg.inner_text('#pkRoot .pk-bubble'), '5: zweite Runde (2)')
    foot(pg, 'Stimmt!'); pg.wait_for_timeout(150); foot(pg, 'Wie geht das?'); pg.wait_for_timeout(200)
    ok(pg.inner_text('#pkRoot .pk-equation').replace('\n','').replace(' ','')=='2=2', '5: Erklärung zeigt die getippte Karte (2 = 2)')
    pg.locator('#pkRoot .pk-xrow').nth(0).click(); pg.wait_for_timeout(100)
    ok(pg.inner_text('#pkRoot .pk-equation').replace('\n','').replace(' ','')=='4+2=6' and pg.inner_text('#pkRoot .pk-xcode').replace('\n','')=='110', '5: Antippen ändert Summe und Code (4 + 2 = 6, 110)')
    shot(pg, 'l5b')
    foot(pg, 'Trick vorführen'); pg.wait_for_timeout(150); nc.nth(0).click(); foot(pg, 'Fertig'); pg.wait_for_timeout(150)
    foot(pg, 'Auflösen'); pg.wait_for_timeout(200)
    ok('4' in pg.inner_text('#pkRoot .pk-bubble') and E("()=>S.punkte.trick.show")==1 and E("()=>S.punkte.trick.guess")==2, '5: Vorführen und Zähler (2× erraten, 1× vorgeführt)')
    pg.locator('#pkRoot .pk-foot .btn', has_text='Fertig').last.click(); pg.wait_for_timeout(300); next_lv(pg)

    # 6 – Schule und Blinki
    for i in (0, 0, 1, 2, 2, 2, 2, 2): pg.locator('#pkRoot .pk-scard').nth(i).click(); pg.wait_for_timeout(40)
    ok(pg.inner_text('#pkRoot .school .pk-tot')=='215', '6: Schulkarten 2×100, 1×10, 5×1 = 215')
    terms = E("()=>[...document.querySelectorAll('#pkRoot .school .pk-term')].map(e=>e.textContent)")
    ok(terms==['2 × 100','1 × 10','5 × 1'] and pg.locator('#pkRoot .school .pk-plus').count()==3, '6: Rechnung 2 × 100 + 1 × 10 + 5 × 1 = 215 mit Plus und Gleich')
    ok(not pg.query_selector('#pkRoot .pk-x') and pg.locator('#pkRoot .pk-rel').count()==4, '6: kein „×10“ zwischen den Karten, Wert-Pfeile oben')
    for i in (1, 0, 2): pg.locator('#pkRoot .pk-card').nth(i).click(); pg.wait_for_timeout(200)
    bterms = E("()=>[...document.querySelectorAll('#pkRoot .blinki .pk-term')].map(e=>e.textContent)")
    ok(pg.inner_text('#pkRoot .blinki .pk-tot')=='2' and bterms==['0 × 4','1 × 2','0 × 1'], '6: Blinki: 0 × 4 + 1 × 2 + 0 × 1 = 2')
    shot(pg, 'l6')
    foot(pg, 'Fertig'); pg.wait_for_timeout(300); next_lv(pg)

    # 7 – mehr Karten: erst 0–15, dann kommt die 16
    for k in range(16): set_to(pg, k); pg.wait_for_timeout(60)
    pg.wait_for_timeout(1500 + 3600)
    ok(len(cards(pg))==5 and cards(pg)[0]['v']==16, '7: die 16-Karte kommt, wenn alle Zahlen bis 15 gefunden sind')
    for k in (16, 21, 26, 31, 19): set_to(pg, k); pg.wait_for_timeout(1500 if k == 16 else 80)
    pg.wait_for_timeout(600)
    shot(pg, 'l7')
    foot(pg, 'Fertig'); pg.wait_for_timeout(300); next_lv(pg)

    # Wenigste Züge (steht direkt nach „Mehr Karten“)
    ok(E("()=>UI.pkLv")==14 and 'Blinki schafft es mit' in pg.inner_text('#pkRoot .pk-bubble'), 'Wenigste Züge kommt direkt nach Mehr Karten')
    for r in range(3):
        t = int(pg.inner_text('#pkRoot .pk-target b')); s0 = total(pg); mn = int(re.search(r'Blinki: (\d+)', pg.inner_text('#pkRoot .pk-moves')).group(1))
        ok(bin(s0 ^ t).count('1') == mn == r + 2, f'Züge {r + 1}: von {s0} zur {t}, Blinki braucht {mn}')
        if r == 1:
            for _ in range(2): pg.locator('#pkRoot .pk-card').nth(4).click(); pg.wait_for_timeout(60)
            set_to(pg, t); pg.wait_for_timeout(700)
            ok('Es geht in' in pg.inner_text('#pkRoot .pk-bubble') and pg.locator('#pkRoot .pk-slot.mark').count() == mn, 'Züge: zu viele Züge – die nötigen Karten werden markiert')
            shot(pg, 'l14')
            foot(pg, 'Nochmal'); pg.wait_for_timeout(250); set_to(pg, t); pg.wait_for_timeout(700)
        else:
            set_to(pg, t); pg.wait_for_timeout(700)
        ok('Perfekt' in pg.inner_text('#pkRoot .pk-bubble'), f'Züge {r + 1}: perfekt gelöst')
        foot(pg, 'Fertig' if r == 2 else 'Nächstes Rätsel'); pg.wait_for_timeout(300)
    next_lv(pg)

    # 8 – Lumi bestellt (einmal falsch: Lampen werden verglichen)
    def lumi_want():
        return E("()=>[...document.querySelectorAll('#pkRoot .pk-mlamps .pk-lamp')].reduce((s,l,i)=>s+(l.classList.contains('on')?[4,2,1][i]:0),0)")
    w = lumi_want(); set_to(pg, 7 if w != 7 else 1); foot(pg, 'Schicken'); pg.wait_for_timeout(200)
    ok(pg.locator('#pkRoot .pk-lamp.diff').count() >= 1 and 'Vergleich' in pg.inner_text('#pkRoot .pk-bubble'), '8: falscher Snack zeigt, welche Lampen anders sind')
    shot(pg, 'l8')
    for r in range(4):
        w = lumi_want(); set_to(pg, w); pg.wait_for_timeout(100); foot(pg, 'Schicken'); pg.wait_for_timeout(1900)
    ok(bool(pg.query_selector('.pk-result')) and E("()=>!!S.punkte.done[8]"), '8: vier Bestellungen geliefert')
    next_lv(pg)

    # 9 – Erklär es Lumi
    for r in range(4):
        m = re.search(r'die (\d+)', pg.inner_text('#pkRoot .pk-bubble')); want = int(m.group(1)) if m else -1
        set_to(pg, want); pg.wait_for_timeout(500)
        ok('Ach so' in pg.inner_text('#pkRoot .pk-bubble'), f'9: Lumi versteht die {want}')
        if r == 3: shot(pg, 'l9')
        foot(pg, 'Fertig' if r == 3 else 'Nächste'); pg.wait_for_timeout(250)
    next_lv(pg)

    # 10 – Armband
    set_to(pg, 28); pg.wait_for_timeout(150)
    ok(pg.inner_text('#pkRoot .pk-foot .btn >> nth=0')=='Ö auffädeln', '10: 28 ist das Ö')
    set_to(pg, 31); pg.wait_for_timeout(150)
    ok(pg.locator('#pkRoot .pk-foot .btn').first.is_disabled(), '10: 31 hat keinen Buchstaben (Auffädeln gesperrt)')
    set_to(pg, 13); pg.wait_for_timeout(150); foot(pg, 'M auffädeln'); pg.wait_for_timeout(1700)
    ok(total(pg)==0, '10: nach dem Auffädeln sind die Karten wieder zu')
    set_to(pg, 9); pg.wait_for_timeout(150); foot(pg, 'I auffädeln'); pg.wait_for_timeout(300)
    shot(pg, 'l10')
    pg.locator('#pkRoot .pk-foot .btn', has_text='Fertig').click(); pg.wait_for_timeout(300)
    ok(E("()=>S.punkte.arm.join('')")=='MI' and bool(pg.query_selector('.pk-result .pk-arm')), '10: Armband „MI“ gespeichert und gezeigt')
    next_lv(pg)

    # 11 – großer Zaubertrick (4 Karten, 1–15)
    nc = pg.locator('#pkRoot .pk-ncard')
    ok(nc.count()==4 and E("()=>[...document.querySelectorAll('#pkRoot .pk-ncard')].every(b=>b.querySelectorAll('.pk-nums b').length===8)"), '11: vier Zauberkarten mit je 8 Zahlen')
    for k in (0, 1, 3): nc.nth(k).click()
    foot(pg, 'Fertig'); pg.wait_for_timeout(1400)
    ok('13' in pg.inner_text('#pkRoot .pk-bubble'), '11: Blinki errät die 13 (8 + 4 + 1)')
    shot(pg, 'l11')
    foot(pg, 'Stimmt!'); pg.wait_for_timeout(150); foot(pg, 'Nochmal'); nc.nth(2).click(); foot(pg, 'Fertig'); pg.wait_for_timeout(1400)
    foot(pg, 'Stimmt!'); pg.wait_for_timeout(150); foot(pg, 'Wie geht das?'); pg.wait_for_timeout(200)
    ok(pg.locator('#pkRoot .pk-xrow').count()==4, '11: Erklärung mit vier Karten')
    pg.locator('#pkRoot .pk-foot .btn', has_text='Fertig').last.click(); pg.wait_for_timeout(300); next_lv(pg)

    # 12 – die 32 und die 64
    set_to(pg, 31); pg.wait_for_timeout(2500)
    ok(len(cards(pg))==6 and cards(pg)[0]['v']==32 and not cards(pg)[0]['up'], '12: nach der 31 kommt die 32-Karte (verdeckt)')
    pg.locator('#pkRoot .pk-card').first.click(); pg.wait_for_timeout(3700)
    ok(len(cards(pg))==7 and cards(pg)[0]['v']==64, '12: alle offen ist 63, dann kommt die 64-Karte')
    pg.locator('#pkRoot .pk-card').first.click(); pg.wait_for_timeout(1700)
    ok('127' in pg.inner_text('#pkRoot .pk-bubble') and '100' in pg.inner_text('#pkRoot .pk-bubble'), '12: 127 geschafft, jetzt die 100')
    set_to(pg, 100); pg.wait_for_timeout(700)
    ok('64 + 32 + 4 = 100' in pg.inner_text('#pkRoot .pk-bubble'), '12: 64 + 32 + 4 = 100')
    shot(pg, 'l12')
    foot(pg, 'Fertig'); pg.wait_for_timeout(300); next_lv(pg)

    # 13 – der echte Computer-Code (ASCII)
    ok(len(cards(pg))==7 and pg.locator('#pkRoot .pk-foot .btn').count()==0, '13: sieben Karten, erst das A bauen')
    set_to(pg, 65); pg.wait_for_timeout(600)
    ok('64 + 1 = 65' in pg.inner_text('#pkRoot .pk-bubble') and pg.inner_text('#pkRoot .pk-ascii b')=='A', '13: A = 64 + 1 = 65')
    foot(pg, 'A speichern'); pg.wait_for_timeout(1700)
    set_to(pg, 97); pg.wait_for_timeout(300)
    ok('kleines a' in pg.inner_text('#pkRoot .pk-bubble'), '13: 97 ist ein kleines a (zusätzlich die 32)')
    set_to(pg, 73); pg.wait_for_timeout(300); foot(pg, 'I speichern'); pg.wait_for_timeout(300)
    shot(pg, 'l13')
    pg.locator('#pkRoot .pk-foot .btn', has_text='Fertig').click(); pg.wait_for_timeout(300)
    ok(E("()=>S.punkte.word.join('')")=='AI' and bool(pg.query_selector('.pk-result .pk-word')), '13: Computer-Wort „AI“ gespeichert und gezeigt')
    shot(pg, 'result13')
    ok(E("()=>Object.keys(S.punkte.done).length")==14, 'Alle 14 Entdeckungen geschafft')
    ok(E("()=>S.coins")==coins0, 'Keine Münzen verändert')
    foot(pg, 'Zur Übersicht'); pg.wait_for_timeout(200)
    ok(E("()=>view")=='punkte' and pg.locator('.pk-lv.done').count()==14, 'Übersicht: alles geschafft')
    ok(pg.locator('.pk-mine .pk-ic').count()==3 and not pg.query_selector('.pk-keepcard'), 'Armband, Computer-Wort und Freunde als kleine Symbole, keine breiten Flächen')
    pg.click('.pk-ic[data-arg=arm]'); pg.wait_for_timeout(100)
    ok(bool(pg.query_selector('.pk-pop .pk-arm')), 'Symbol Armband öffnet das Armband')
    shot(pg, 'hub_icons')
    pg.click('.pk-ic[data-arg=arm]'); pg.wait_for_timeout(100)

    # Tagesrätsel
    ok(bool(pg.query_selector('.pk-tag')) and 'Drei kurze Rätsel' in pg.inner_text('.pk-tag'), 'Tagesrätsel auf der Übersicht')
    plan = E("()=>pkTagPlan(ymd())")
    ok(len(plan['tasks'])==3 and plan['vals']==[16,8,4,2,1] and E("()=>JSON.stringify(pkTagPlan(ymd()))==JSON.stringify(pkTagPlan(ymd()))"), 'Tagesrätsel: 3 Aufgaben, gleich für den ganzen Tag')
    kinds = set()
    for d in range(40): kinds |= {t['k'] for t in E(f"()=>pkTagPlan('2026-11-{d%28+1:02d}-{d}').tasks")}
    ok(kinds=={'bau','lampen','kette','abc','zuege'}, 'Tagesrätsel: alle Rätselarten kommen vor (auch Wenigste Züge)')
    pg.click('.pk-tag [data-act=pkLv]'); pg.wait_for_timeout(250)
    for k, t in enumerate(plan['tasks']):
        if t['k'] == 'kette':
            set_to(pg, t['ns'][1]); pg.wait_for_timeout(450); set_to(pg, t['ns'][2])
        else: set_to(pg, t['n'])
        pg.wait_for_timeout(600)
        if k == 0: shot(pg, 'tag')
        foot(pg, 'Fertig' if k == 2 else 'Nächstes Rätsel'); pg.wait_for_timeout(250)
    ok(E("()=>!!S.punkte.tag.days[ymd()]") and pg.locator('.pk-result .pk-week span.ok').count()==1, 'Tagesrätsel gelöst, Wochenleiste zeigt heute')
    shot(pg, 'tag_done')
    foot(pg, 'Zur Übersicht'); pg.wait_for_timeout(200)
    ok('Heute geschafft' in pg.inner_text('.pk-tag'), 'Übersicht: Tagesrätsel heute geschafft')

    # Freundes-Armbänder: Name selbst schreiben, Buchstaben mit den Karten bauen (Ä, Ö, Ü, ß sind 27–30)
    ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß'
    pg.click('.pk-ic[data-act=pkFreunde]'); pg.wait_for_timeout(200)
    ok(E("()=>view")=='pkFreunde' and pg.locator('[data-act=pkLv][data-arg=wem]').is_disabled(), 'Freunde: Seite offen, Ratespiel erst ab 3 Armbändern')
    def make(name, typed, wrong=None, col=None):
        pg.click('[data-act=pkLv][data-arg=freund]'); pg.wait_for_timeout(250)
        pg.fill('#pkName', typed); pg.wait_for_timeout(80)
        ok(pg.input_value('#pkName') == name, f'Freunde: „{typed}“ wird zu {name}')
        foot(pg, 'Weiter'); pg.wait_for_timeout(200)
        for k, ch in enumerate(name):
            if wrong and k == 0:
                set_to(pg, wrong); pg.wait_for_timeout(80); pg.locator('#pkRoot .pk-foot .btn').first.click(); pg.wait_for_timeout(150)
                ok(f'du brauchst ein {ch}' in pg.inner_text('#pkRoot .pk-bubble'), f'Freunde: falscher Buchstabe – „du brauchst ein {ch}“')
            set_to(pg, ABC.index(ch) + 1); pg.wait_for_timeout(80)
            ok(pg.inner_text('#pkRoot .pk-foot .btn >> nth=0') == f'{ch} auffädeln', f'Freunde: {ch} = {ABC.index(ch) + 1}')
            pg.locator('#pkRoot .pk-foot .btn').first.click(); pg.wait_for_timeout(1400)
        pg.wait_for_timeout(300)
        if col: pg.click(f'#pkRoot .pk-sw[data-v="{col}"]'); pg.wait_for_timeout(80)
        if name == 'JÖRG': shot(pg, 'fr_colour')
        foot(pg, 'Speichern'); pg.wait_for_timeout(250)
    make('MIA', 'mia', wrong=11, col=4)
    ok(E("()=>view")=='pkFreunde' and E("()=>S.punkte.friends[0].n")=='MIA', 'Freunde: Armband für MIA gespeichert')
    need = ' '.join(pg.inner_text('.pk-need').split())
    ok('6 × Grün' in need and '9 × Weiß' in need and '2 × Dunkel' in need, 'Perlen-Plan: 6 grüne, 9 weiße, 2 dunkle Perlen für MIA')
    shot(pg, 'fr_plan')
    make('JÖRG', 'Jörg')
    make('BEN', 'Ben')
    pg.click('[data-act=pkLv][data-arg=freund]'); pg.wait_for_timeout(200); pg.fill('#pkName', 'mia'); pg.wait_for_timeout(80)
    ok(pg.locator('#pkRoot .pk-foot .btn').first.is_disabled() and 'schon ein Armband' in pg.inner_text('#pkRoot .pk-bubble'), 'Freunde: gleicher Name geht nicht zweimal')
    pg.click('#app .top .back'); pg.wait_for_timeout(200)
    ok(E("()=>view")=='pkFreunde' and pg.locator('.pk-stk').count()==3, 'Zurück führt zu den Freundes-Armbändern, 3 Sticker')
    shot(pg, 'fr_list')
    pg.click('[data-act=pkLv][data-arg=wem]'); pg.wait_for_timeout(250)
    DEC = "()=>[...document.querySelectorAll('#pkRoot .pk-arm .pk-bead')].map(b=>{const n=[...b.querySelectorAll('.pk-beads i')].reduce((s,i,k)=>s+(i.classList.contains('on')?[16,8,4,2,1][k]:0),0);return 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß'[n-1]}).join('')"
    ok('Armband ohne Namen' == pg.get_attribute('#pkRoot .pk-arm', 'aria-label') and not pg.query_selector('#pkRoot .pk-bead b'), 'Ratespiel: Armband ohne Namen')
    for r in range(3):
        nm = E(DEC)
        if r == 0:
            pg.locator('#pkRoot .pk-opt:not([data-n="%s"])' % nm).first.click(); pg.wait_for_timeout(150)
            ok('Das ist nicht' in pg.inner_text('#pkRoot .pk-bubble'), 'Ratespiel: falscher Name gibt einen Hinweis zum ersten Buchstaben')
            shot(pg, 'fr_wem')
        pg.click('#pkRoot .pk-opt[data-n="%s"]' % nm); pg.wait_for_timeout(150)
        ok(nm in pg.inner_text('#pkRoot .pk-bubble'), f'Ratespiel: {nm} erkannt')
        foot(pg, 'Fertig' if r == 2 else 'Nächstes Armband'); pg.wait_for_timeout(250)
    ok(E("()=>view")=='pkFreunde', 'Ratespiel fertig: zurück zu den Freunden')
    pg.click('.pk-link[data-act=pkFrDruck]'); pg.wait_for_timeout(150)
    ok(E("()=>view")=='pkFrDruck' and pg.locator('.pk-psticker').count()==3 and pg.locator('.pk-decoder span').count()==30, 'Sticker-Bogen: 3 Sticker und Entschlüssel-Tafel auf einer Seite')
    shot(pg, 'fr_print')
    pg.click('#app .top .back'); pg.wait_for_timeout(150)
    pg.click('.pk-stk >> nth=2'); pg.click('[data-act=pkFrDel][data-arg=ask]'); pg.click('[data-act=pkFrDel][data-arg=yes]'); pg.wait_for_timeout(100)
    ok(pg.locator('.pk-stk').count()==2 and E("()=>S.punkte.friends.map(f=>f.n).join()")=='MIA,JÖRG', 'Freunde: Armband löschen (mit Nachfrage)')
    E("()=>go('punkte')"); pg.wait_for_timeout(150)
    ok('Freunde 2' in pg.inner_text('.pk-mine'), 'Übersicht: Freunde-Symbol zeigt die Anzahl')

    # Venola Holmes: Rang, Koffer, Akten und Regeln als kleine Symbole
    E("()=>{S.flags.venola=true;vnS().vnRulesV=1;ACT.venola()}"); pg.wait_for_timeout(200)
    ok(pg.locator('.vn-icons .vn-ic').count()==4 and not pg.query_selector('.vn-rankc'), 'Venola: Rang, Koffer, Akten, Regeln als kleine Symbole')
    pg.click('.vn-ic[data-act=vnPop]'); pg.wait_for_timeout(100)
    ok(bool(pg.query_selector('.vn-pop .bar')), 'Venola: Rang-Symbol öffnet den Fortschritt')
    shot(pg, 'venola')
    E("()=>{S.flags.venola=false;go('punkte')}"); pg.wait_for_timeout(150)
    shot(pg, 'hub_done')
    pg.click('#app .top .back'); pg.wait_for_timeout(150)
    ok(E("()=>view")=='rewards', 'Zurück führt nach Meine Welt')

    # Zurück aus einer Entdeckung führt zur Übersicht; Neu-Zeichnen baut die Entdeckung wieder auf
    E("()=>go('punkte')"); E("()=>ACT.pkLv(3)"); pg.wait_for_timeout(200)
    E("()=>render()"); pg.wait_for_timeout(150)
    ok(pg.locator('#pkRoot .pk-card').count()==3, 'Neu-Zeichnen: Entdeckung wird wieder aufgebaut')
    pg.click('#app .top .back'); pg.wait_for_timeout(150)
    ok(E("()=>view")=='punkte', 'Zurück aus einer Entdeckung: Übersicht')

    # Ton-Schalter, Druckbogen, Eltern-Karte, Nacht-Thema
    s0 = E("()=>S.punkte.snd"); pg.click('[data-act=pkSnd]'); ok(E("()=>S.punkte.snd") != s0, 'Ton-Schalter in der Übersicht')
    pg.click('.pk-link[data-act=pkDruck]'); pg.wait_for_timeout(150)
    ok(E("()=>view")=='pkDruck' and pg.locator('.pk-pcard').count()==13, 'Druckbogen: 5 Punktkarten, Hinweis, 3 + 4 Zauberkarten')
    shot(pg, 'druck')
    E("()=>{S.pin={h:hashStr('1234'),r:'x'};UI.pinUntil=Date.now()+1e9;go('parent')}"); pg.wait_for_timeout(150)
    pg.click('.pt-tabs [data-arg=stats]'); pg.wait_for_timeout(150)
    shot(pg, 'eltern')
    ok(bool(pg.query_selector('.pk-parent')) and 'Warum gibt es keine Karte mit 3 Punkten' in pg.inner_text('.pk-parent'), 'Eltern: Stand und offene Fragen')
    E("()=>{S.eq.theme='nacht';go('punkte')}"); pg.wait_for_timeout(150); shot(pg, 'hub_nacht')
    E("()=>ACT.pkLv(5)"); pg.wait_for_timeout(200); shot(pg, 'l5_nacht')

    # Telefonbreite: nichts läuft seitlich aus dem Bild
    pg.set_viewport_size({'width': 390, 'height': 844}); E("()=>{S.eq.theme='sonne';ACT.pkLv(7)}"); pg.wait_for_timeout(300)
    ok(E("()=>document.documentElement.scrollWidth<=window.innerWidth+1"), 'Telefon: keine waagrechte Scrollleiste (Entdeckung 7, 4 Karten)')
    shot(pg, 'phone_l7')
    E("()=>ACT.pkLv(10)"); pg.wait_for_timeout(300)
    ok(E("()=>document.documentElement.scrollWidth<=window.innerWidth+1"), 'Telefon: keine waagrechte Scrollleiste (Armband, 5 Karten)')
    shot(pg, 'phone_l10')
    E("()=>ACT.pkLv(6)"); pg.wait_for_timeout(300)
    ok(E("()=>document.documentElement.scrollWidth<=window.innerWidth+1"), 'Telefon: keine waagrechte Scrollleiste (Schule und Blinki)')
    shot(pg, 'phone_l6')
    E("()=>ACT.pkLv(13)"); pg.wait_for_timeout(300)
    ok(E("()=>document.documentElement.scrollWidth<=window.innerWidth+1"), 'Telefon: keine waagrechte Scrollleiste (7 Karten)')
    shot(pg, 'phone_l13')
    E("()=>ACT.pkLv(14)"); pg.wait_for_timeout(300)
    ok(E("()=>document.documentElement.scrollWidth<=window.innerWidth+1"), 'Telefon: keine waagrechte Scrollleiste (Wenigste Züge)')
    shot(pg, 'phone_l14')
    E("()=>go('pkFreunde',{pkFr:0})"); pg.wait_for_timeout(300)
    ok(E("()=>document.documentElement.scrollWidth<=window.innerWidth+1"), 'Telefon: keine waagrechte Scrollleiste (Freundes-Armbänder)')
    shot(pg, 'phone_fr')
    E("()=>go('punkte')"); pg.wait_for_timeout(200); shot(pg, 'phone_hub')

    # Schalter aus: Daten bleiben
    E("()=>ACT.dzFlag('punkte')")
    ok(not E("()=>flagOn('punkte')") and E("()=>Object.keys(S.punkte.done).length")==14, 'Ausblenden behält alle Entdeckungen')
    ok(not errs, 'Keine JavaScript-Fehler' + ('' if not errs else ': ' + '; '.join(errs[:3])))
    b.close()
print('\n' + ('ALLE TESTS OK' if not fails else f'{len(fails)} FEHLER'))
sys.exit(1 if fails else 0)
