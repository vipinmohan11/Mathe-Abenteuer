"""Blinkis Punktkarten (Entdeckungen 1–14, Blinkis Rätsel, Sterne, Armband-Muster, Freundes-Armbänder) und Venola-Band: Schalter (Standard aus), alle Entdeckungen über die Oberfläche durchspielen,
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
    E("()=>{PK.pause=0}")
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
    ok(not pg.query_selector('.pk-rw'), 'Rätsel erst nach Entdeckung 4')
    ok('blinki' in E("()=>shopGroups()"), 'Shop: Gruppe Blinki erscheint mit dem Schalter')
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

    # Wenigste Züge: direkt nach dem Geheimcode, drei Karten, Ziel mit Code, Sterne
    ok(E("()=>UI.pkLv")==14 and len(cards(pg))==3 and pg.locator('#pkRoot .pk-target .pk-tcode i').count()==3, 'Wenigste Züge kommt nach dem Geheimcode: 3 Karten, Ziel mit Code')
    for r in range(3):
        t = int(pg.inner_text('#pkRoot .pk-target b')); s0 = total(pg); mn = int(re.search(r'Blinki: (\d+)', pg.inner_text('#pkRoot .pk-moves')).group(1))
        tc = pg.inner_text('#pkRoot .pk-tcode').replace('\n','')
        ok(bin(s0 ^ t).count('1') == mn == [2, 2, 3][r] and tc == format(t, '03b'), f'Züge {r + 1}: von {s0} zur {t} (Code {tc}), Blinki braucht {mn}')
        if r == 1:
            for _ in range(2): pg.locator('#pkRoot .pk-card').nth(2).click(); pg.wait_for_timeout(60)
            set_to(pg, t); pg.wait_for_timeout(700)
            ok('Nochmal perfekt' in pg.inner_text('#pkRoot .pk-foot') and pg.locator('#pkRoot .pk-slot.mark').count() == mn and pg.locator('#pkRoot .pk-bubble .pk-stars i.on').count()==2, 'Züge: zu viele Züge – 2 Sterne, die nötigen Karten markiert, „Nochmal perfekt“')
            shot(pg, 'l14')
            foot(pg, 'Nochmal perfekt'); pg.wait_for_timeout(250); set_to(pg, t); pg.wait_for_timeout(700)
        else:
            set_to(pg, t); pg.wait_for_timeout(700)
        ok('Perfekt' in pg.inner_text('#pkRoot .pk-bubble') and pg.locator('#pkRoot .pk-bubble .pk-stars i.on').count()==3 and bool(pg.query_selector('#pkRoot .pk-burst')), f'Züge {r + 1}: perfekt – 3 Sterne und kleines Fest')
        foot(pg, 'Fertig' if r == 2 else 'Nächstes Rätsel'); pg.wait_for_timeout(300)
    ok(E("()=>S.punkte.stars")==9, 'Sterne: pro Rätsel zählt der beste Versuch (3 × 3 = 9)')
    next_lv(pg)


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

    # 6 – Schule und Blinki: erst eine Zahl mit Hundertern, Zehnern, Einern bauen (mit Minus), dann bei Blinki, dann vergleichen
    ok('10-mal' not in pg.inner_text('#pkRoot') and pg.locator('#pkRoot .pk-minus').count()==3, '6: kein „10-mal“, Minus-Knöpfe da')
    pg.locator('#pkRoot .pk-card').first.click(); pg.wait_for_timeout(100)
    ok(total(pg)==0, '6: Blinkis Karten warten, bis die Schulzahl gebaut ist')
    tS = int(pg.inner_text('#pkRoot .school .pk-goal b')); dg = [tS // 100, tS // 10 % 10, tS % 10]
    pg.locator('#pkRoot .pk-scard').nth(0).click(); pg.locator('#pkRoot .pk-scard').nth(0).click(); pg.wait_for_timeout(40)
    pg.locator('#pkRoot .pk-minus').nth(0).click(); pg.wait_for_timeout(40)
    ok(pg.inner_text('#pkRoot .school .pk-tot')=='100', '6: Minus nimmt eine Karte wieder weg (2 → 1 Hunderter)')
    for i in range(3):
        for _ in range(dg[i] - (1 if i == 0 else 0)): pg.locator('#pkRoot .pk-scard').nth(i).click(); pg.wait_for_timeout(30)
    pg.wait_for_timeout(200)
    terms = E("()=>[...document.querySelectorAll('#pkRoot .school .pk-term')].map(e=>e.textContent)")
    ok(pg.inner_text('#pkRoot .school .pk-tot')==str(tS) and terms==[f'{dg[0]} × 100', f'{dg[1]} × 10', f'{dg[2]} × 1'], f'6: {tS} = {dg[0]} × 100 + {dg[1]} × 10 + {dg[2]} × 1')
    names = E("()=>[...document.querySelectorAll('#pkRoot .blinki .pk-sval')].map(e=>e.textContent)")
    ok(names==['Vierer','Zweier','Einer'] and 'Vierer' in pg.inner_text('#pkRoot .pk-bubble'), '6: Blinkis Karten heißen Vierer, Zweier, Einer')
    tB = int(pg.inner_text('#pkRoot .blinki .pk-goal b')); set_to(pg, tB); pg.wait_for_timeout(700)
    cmp = pg.inner_text('#pkRoot .pk-cmpres')
    ok('Ziffern 0 bis 9' in cmp and 'nur 0 oder 1' in cmp and f'= {tB}' in ' '.join(cmp.split()), f'6: Vergleich – Schule 0 bis 9, Blinki nur 0 oder 1 ({tB})')
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

    # 8 – Lumis Paketpost: Ware → Code aus 1 und 0 (keine Lampen zum Abmalen)
    def want8():
        nm = pg.inner_text('#pkRoot .pk-order b')
        return E("(nm)=>+[...document.querySelectorAll('#pkRoot .pk-snack')].find(e=>e.querySelector('span:not(.pk-emo)').textContent===nm).dataset.n", nm)
    ok(not pg.query_selector('#pkRoot .pk-mlamps') and E("()=>[...document.querySelectorAll('#pkRoot .pk-sc')].every(e=>/^[01]{3}$/.test(e.textContent))"), '8: Liste mit Codes aus 1 und 0, keine Lampen')
    w = want8(); set_to(pg, 7 if w != 7 else 1); foot(pg, 'Abschicken'); pg.wait_for_timeout(200)
    ok('geschickt' in pg.inner_text('#pkRoot .pk-bubble'), '8: falsches Paket – Lumi sagt, was geschickt wurde')
    shot(pg, 'l8')
    for r in range(4):
        if r == 2: ok(E("()=>[...document.querySelectorAll('#pkRoot .pk-sc')].every(e=>/^[1-7]$/.test(e.textContent))"), '8: ab dem 3. Paket steht nur die Zahl in der Liste')
        w = want8(); set_to(pg, w); pg.wait_for_timeout(100); foot(pg, 'Abschicken'); pg.wait_for_timeout(1900)
    ok(bool(pg.query_selector('.pk-result')) and E("()=>!!S.punkte.done[8]"), '8: vier Pakete verschickt')
    next_lv(pg)

    # 9 – Erklär es Lumi: erst lösen; nicht perfekt → „Nochmal perfekt“ mit Zug-Zähler; perfekt = 3 Sterne
    st0 = E("()=>S.punkte.stars")
    for r in range(4):
        m = re.search(r'die (\d+)', pg.inner_text('#pkRoot .pk-bubble')); want = int(m.group(1)) if m else -1
        ok(not pg.is_visible('#pkRoot .pk-moves'), f'9: erster Versuch ohne Zug-Zähler ({want})')
        if r == 1:
            for _ in range(2): pg.locator('#pkRoot .pk-card').last.click(); pg.wait_for_timeout(60)
            set_to(pg, want); pg.wait_for_timeout(600)
            ok('Ach so' in pg.inner_text('#pkRoot .pk-bubble') and 'Nochmal perfekt' in pg.inner_text('#pkRoot .pk-foot'), '9: nicht perfekt – Frage nach einem perfekten Versuch')
            foot(pg, 'Nochmal perfekt'); pg.wait_for_timeout(200)
            ok(pg.is_visible('#pkRoot .pk-moves'), '9: beim perfekten Versuch zählt der Zug-Zähler mit')
        set_to(pg, want); pg.wait_for_timeout(600)
        ok('Perfekt' in pg.inner_text('#pkRoot .pk-bubble') and pg.locator('#pkRoot .pk-bubble .pk-stars i.on').count()==3, f'9: Lumi versteht die {want} – perfekt, 3 Sterne')
        if r == 1: shot(pg, 'l9')
        foot(pg, 'Fertig' if r == 3 else 'Nächste'); pg.wait_for_timeout(250)
    ok(E("()=>S.punkte.stars")==st0 + 12, '9: 4 × 3 Sterne')
    next_lv(pg)

    # 10 – Armband
    set_to(pg, 28); pg.wait_for_timeout(150)
    ok(pg.inner_text('#pkRoot .pk-foot .btn >> nth=0')=='Ö auffädeln', '10: 28 ist das Ö')
    set_to(pg, 31); pg.wait_for_timeout(150)
    ok(pg.locator('#pkRoot .pk-foot .btn').first.is_disabled(), '10: 31 hat keinen Buchstaben (Auffädeln gesperrt)')
    set_to(pg, 13); pg.wait_for_timeout(150); foot(pg, 'M auffädeln'); pg.wait_for_timeout(1700)
    ok(total(pg)==0, '10: nach dem Auffädeln sind die Karten wieder zu')
    set_to(pg, 9); pg.wait_for_timeout(150); foot(pg, 'I auffädeln'); pg.wait_for_timeout(300)
    ok(pg.locator('#pkRoot svg.pk-band g.pk-bg').count()==2 and pg.locator('#pkRoot svg.pk-band .b.on').count()==5, '10: Armband als Bild – 2 Buchstaben, 5 leuchtende Perlen (M = 8+4+1, I = 8+1)')
    shot(pg, 'l10')
    pg.locator('#pkRoot .pk-foot .btn', has_text='Fertig').click(); pg.wait_for_timeout(300)
    ok(E("()=>S.punkte.arm.join('')")=='MI' and bool(pg.query_selector('.pk-result svg.pk-band')), '10: Armband „MI“ gespeichert und gezeigt')
    next_lv(pg)

    # 11 – großer Zaubertrick (4 Karten, 1–15)
    nc = pg.locator('#pkRoot .pk-ncard')
    ok(nc.count()==4 and E("()=>[...document.querySelectorAll('#pkRoot .pk-ncard')].every(b=>b.querySelectorAll('.pk-nums b').length===8)"), '11: vier Zauberkarten mit je 8 Zahlen')
    for k in (0, 1, 3): nc.nth(k).click()
    foot(pg, 'Fertig'); pg.wait_for_timeout(1400)
    ok('13' in pg.inner_text('#pkRoot .pk-bubble'), '11: Blinki errät die 13 (8 + 4 + 1)')
    foot(pg, 'Stimmt!'); pg.wait_for_timeout(150); foot(pg, 'Nochmal'); nc.nth(2).click(); foot(pg, 'Fertig'); pg.wait_for_timeout(1400)
    foot(pg, 'Stimmt!'); pg.wait_for_timeout(150); foot(pg, 'Wie geht das?'); pg.wait_for_timeout(200)
    ok(pg.locator('#pkRoot .pk-xrow').count()==4, '11: Erklärung mit vier Karten')
    pg.locator('#pkRoot .pk-foot .btn', has_text='Fertig').last.click(); pg.wait_for_timeout(300); next_lv(pg)

    # 12 – die 32 und die 64, dann 100 und drei Profi-Zahlen
    set_to(pg, 31); pg.wait_for_timeout(2500)
    ok(len(cards(pg))==6 and cards(pg)[0]['v']==32 and not cards(pg)[0]['up'], '12: nach der 31 kommt die 32-Karte (verdeckt)')
    pg.locator('#pkRoot .pk-card').first.click(); pg.wait_for_timeout(3700)
    ok(len(cards(pg))==7 and cards(pg)[0]['v']==64, '12: alle offen ist 63, dann kommt die 64-Karte')
    pg.locator('#pkRoot .pk-card').first.click(); pg.wait_for_timeout(1700)
    ok('127' in pg.inner_text('#pkRoot .pk-bubble') and pg.inner_text('#pkRoot .pk-target b')=='100', '12: 127 geschafft, jetzt die 100')
    set_to(pg, 100); pg.wait_for_timeout(700)
    ok('64 + 32 + 4 = 100' in pg.inner_text('#pkRoot .pk-bubble'), '12: 64 + 32 + 4 = 100')
    goals = []
    for g in range(3):
        t = int(pg.inner_text('#pkRoot .pk-target b')); goals.append(t)
        if g == 1: shot(pg, 'l12')
        set_to(pg, t); pg.wait_for_timeout(700)
    ok(33 <= goals[0] <= 63 and 64 <= goals[1] <= 95 and 96 <= goals[2] <= 126 and 'bis 127' in pg.inner_text('#pkRoot .pk-bubble'), f'12: drei Profi-Zahlen {goals} gebaut')
    foot(pg, 'Fertig'); pg.wait_for_timeout(300); next_lv(pg)

    # 13 – der echte Computer-Code: nur Großbuchstaben, Name aussuchen
    ok(len(cards(pg))==7 and pg.locator('#pkRoot .pk-foot .btn').count()==0, '13: sieben Karten, erst das A bauen')
    set_to(pg, 65); pg.wait_for_timeout(700)
    ok('64 + 1 = 65' in pg.inner_text('#pkRoot .pk-bubble') and pg.is_visible('#pkRoot .pk-npick') and not pg.is_visible('#pkRoot .pk-cards'), '13: A = 64 + 1 = 65, dann Name aussuchen')
    pg.click('#pkRoot .pk-nopt[data-k=rnd]'); pg.wait_for_timeout(100)
    r1 = pg.inner_text('#pkRoot .pk-nrnd b'); pg.click('#pkRoot .pk-reroll'); pg.wait_for_timeout(100); r2 = pg.inner_text('#pkRoot .pk-nrnd b')
    ok(r1 != r2 and E("(a)=>PK_NAMES.includes(a[0])&&PK_NAMES.includes(a[1])", [r1, r2]), f'13: Zufallsnamen {r1}, {r2}')
    shot(pg, 'l13pick')
    pg.click('#pkRoot .pk-nopt[data-k=me]'); pg.fill('#pkMe', 'Jörg'); pg.wait_for_timeout(100)
    ok('JOERG' in pg.inner_text('#pkRoot .pk-conv'), '13: Ö wird im Computer-Code zu OE')
    foot(pg, 'Weiter'); pg.wait_for_timeout(200)
    ok(cards(pg)[0]['up'] and total(pg)==64, '13: die 64 bleibt an')
    set_to(pg, 112); pg.wait_for_timeout(150)
    ok(pg.inner_text('#pkRoot .pk-ascii b')=='–' and pg.locator('#pkRoot .pk-foot .btn').first.is_disabled(), '13: 112 ist hier kein Buchstabe (nur Großbuchstaben)')
    set_to(pg, 75); pg.wait_for_timeout(100); pg.locator('#pkRoot .pk-foot .btn').first.click(); pg.wait_for_timeout(150)
    ok('du brauchst ein J' in pg.inner_text('#pkRoot .pk-bubble'), '13: falscher Buchstabe – „du brauchst ein J“')
    for ch in 'JOERG':
        set_to(pg, ord(ch)); pg.wait_for_timeout(100)
        ok(pg.inner_text('#pkRoot .pk-foot .btn >> nth=0') == f'{ch} speichern', f'13: {ch} = {ord(ch)}')
        pg.locator('#pkRoot .pk-foot .btn').first.click(); pg.wait_for_timeout(1350)
    pg.wait_for_timeout(300); shot(pg, 'l13')
    pg.locator('#pkRoot .pk-foot .btn', has_text='Fertig').click(); pg.wait_for_timeout(300)
    ok(E("()=>S.punkte.word.join('')")=='JOERG' and bool(pg.query_selector('.pk-result .pk-word')), '13: Computer-Wort „JOERG“ gespeichert und gezeigt')
    ok(E("()=>Object.keys(S.punkte.done).length")==14, 'Alle 14 Entdeckungen geschafft')
    ok(E("()=>S.coins")==coins0, 'Keine Münzen verändert')
    foot(pg, 'Zur Übersicht'); pg.wait_for_timeout(200)
    ok(E("()=>view")=='punkte' and pg.locator('.pk-lv.done').count()==14, 'Übersicht: alles geschafft')

    # Übersicht: ein Band mit kleinen Segmenten, Popover darunter
    ok(pg.locator('.pk-ribbon .pk-seg').count()==8 and not pg.query_selector('.pk-mine') and not pg.query_selector('.pk-hubbar'), 'Übersicht: Fortschritt, Sterne, Armband, Wort, Freunde, Rang, Sammlung, Ton in einem Band')
    ok('14/14' in pg.inner_text('.pk-segring'), 'Band: Fortschritt 14/14')
    pg.click('.pk-seg[data-arg=stars]'); pg.wait_for_timeout(100)
    ok(bool(pg.query_selector('.pk-popv .pk-unl')), 'Band: Sterne öffnen die Freischalt-Liste')
    stars = E("()=>S.punkte.stars")
    ok(stars == 21 and E("()=>hasItem('pkd.regenbogen')&&hasItem('pkd.glitzer')&&hasItem('pkc.blinki')&&hasItem('pkc.klee')&&!hasItem('pkd.ozean')"), f'Sterne ({stars}) schalten Regenbogen, Glitzer, Blinki, Kleeblatt frei – Ozean noch nicht')
    pg.click('.pk-seg[data-arg=arm]'); pg.wait_for_timeout(100)
    ok(bool(pg.query_selector('.pk-popv svg.pk-band')) and pg.locator('.pk-popv .pk-lk[data-act=pkLook]').count()==11, 'Armband-Symbol: Armband und 11 Muster')
    pg.click('.pk-popv [data-act=pkLook][data-arg="me|glitzer"]'); pg.wait_for_timeout(100)
    pg.click('.pk-popv [data-act=pkCharm][data-arg="me|klee"]'); pg.wait_for_timeout(100)
    ok(E("()=>S.punkte.armD")=='glitzer' and E("()=>S.punkte.armCh")=='klee' and '🍀' in pg.inner_html('.pk-popv svg.pk-band'), 'Muster Glitzer und Anhänger Kleeblatt gewählt')
    shot(pg, 'hub_look')
    pg.click('.pk-popv [data-act=pkLook][data-arg="me|holz"]'); pg.wait_for_timeout(200)
    ok(E("()=>view")=='shop' and E("()=>UI.shopGrp")=='blinki' and pg.locator('.itile').count()==3, 'Gesperrtes Shop-Muster führt in den Shop (Gruppe Blinki)')
    shot(pg, 'shop_blinki')
    E("()=>{unlock('pkd.holz',true);save();go('punkte',{pkShow:'arm'})}"); pg.wait_for_timeout(150)
    pg.click('.pk-popv [data-act=pkLook][data-arg="me|holz"]'); pg.wait_for_timeout(100)
    ok(E("()=>S.punkte.armD")=='holz' and pg.locator('.pk-popv svg.pk-band rect.b').count()==10, 'Holz gekauft und gewählt (eckige Holzperlen)')
    E("()=>{S.coins=40;save()}"); coins0 = 40
    pg.click('.pk-popx'); pg.wait_for_timeout(100)

    # Blinkis Rätsel: beliebig viele, nur Erfolge zählen, Meilenstein bei 5
    ok(bool(pg.query_selector('.pk-rw')) and 'Gesamt 0' in pg.inner_text('.pk-rw'), 'Rätsel als kompakte Zeile auf der Übersicht')
    pg.click('.pk-rw'); pg.wait_for_timeout(250)
    st0 = E("()=>S.punkte.stars")
    def solve_tag():
        lbl = E("()=>document.querySelector('#pkRoot .pk-target .pk-label').textContent")
        if 'Weiterzählen' in lbl:
            ns = [int(x) for x in E("()=>[...document.querySelectorAll('#pkRoot .pk-chain span')].map(e=>e.textContent)")]
            set_to(pg, ns[1]); pg.wait_for_timeout(450); set_to(pg, ns[2])
        elif 'Geheimcode' in lbl:
            set_to(pg, int(pg.inner_text('#pkRoot .pk-dcode').replace('\n',''), 2))
        elif 'Buchstabe' in lbl:
            set_to(pg, 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß'.index(pg.inner_text('#pkRoot .pk-target b')) + 1)
        else: set_to(pg, int(pg.inner_text('#pkRoot .pk-target b')))
        pg.wait_for_timeout(650)
        return lbl
    seen = set()
    for k in range(6):
        seen.add(solve_tag())
        if k == 4:
            ok('5 Rätsel gelöst' in pg.inner_text('#pkRoot .pk-bubble') and E("()=>S.punkte.stars")>=st0 + 2, 'Meilenstein: 5 Rätsel – Fest und 2 Sterne')
            shot(pg, 'tag_mile')
        if k == 0: shot(pg, 'tag')
        foot(pg, 'Nächstes Rätsel'); pg.wait_for_timeout(250)
    ok(E("()=>S.punkte.tag.total")==6 and E("()=>S.punkte.tag.days[ymd()]")==6, 'Rätsel: 6 gelöst, heute 6 (nur Erfolge)')
    ok(E("()=>!document.querySelector('#pkRoot .pk-mlamps')"), 'Rätsel: keine Lampen mehr')
    foot(pg, 'Aufhören'); pg.wait_for_timeout(200)
    ok(E("()=>view")=='punkte' and 'Gesamt 6' in pg.inner_text('.pk-rw') and 'Ziel 10' in pg.inner_text('.pk-rw'), 'Aufhören: Übersicht zeigt Gesamt 6, nächstes Ziel 10')
    kinds = set()
    for _ in range(4): kinds |= set(E("()=>{const out=[];ACT.pkLv('tag');for(let i=0;i<30;i++){const l=document.querySelector('#pkRoot .pk-target .pk-label').textContent;out.push(l);[...document.querySelectorAll('#pkRoot .pk-foot .btn')].find(b=>b.textContent==='Aufhören');ACT.pkLv('tag')}return out}"))
    ok(kinds >= {'Bau die Zahl', 'Geheimcode', 'Weiterzählen', 'Buchstabe', 'Wenigste Züge'}, 'Rätsel: alle Arten kommen vor')
    E("()=>go('punkte')"); pg.wait_for_timeout(150)

    # Freundes-Armbänder: Name selbst schreiben, Buchstaben mit den Karten bauen (Ä, Ö, Ü, ß sind 27–30)
    ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß'
    pg.click('.pk-seg[data-act=pkFreunde]'); pg.wait_for_timeout(200)
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
    ok(E("()=>view")=='pkFreunde' and E("()=>S.punkte.friends[0].n")=='MIA' and E("()=>S.punkte.friends[0].d")=='eins', 'Freunde: Armband für MIA gespeichert (einfarbig)')
    need = ' '.join(pg.inner_text('.pk-need').split())
    ok('6 × Grün' in need and '9 × Weiß' in need and '2 × Dunkel' in need, 'Perlen-Plan: 6 grüne, 9 weiße, 2 dunkle Perlen für MIA')
    pg.click('.pk-frdet [data-act=pkLook][data-arg="0|bunt"]'); pg.wait_for_timeout(120)
    need = ' '.join(pg.inner_text('.pk-need').split())
    ok(E("()=>S.punkte.friends[0].d")=='bunt' and '3 × Gelb' in need and '2 × Violett' in need and '1 × Grün' in need, 'Perlen-Plan zählt pro Farbe des Musters (Bunt: 3 Gelb, 2 Violett, 1 Grün)')
    pg.click('.pk-frdet [data-act=pkCharm][data-arg="0|stern"]'); pg.wait_for_timeout(120)
    ok(E("()=>S.punkte.friends[0].ch")=='stern', 'Freund bekommt einen Anhänger')
    shot(pg, 'fr_plan')
    make('JÖRG', 'Jörg')
    make('BEN', 'Ben')
    pg.click('[data-act=pkLv][data-arg=freund]'); pg.wait_for_timeout(200); pg.fill('#pkName', 'mia'); pg.wait_for_timeout(80)
    ok(pg.locator('#pkRoot .pk-foot .btn').first.is_disabled() and 'schon ein Armband' in pg.inner_text('#pkRoot .pk-bubble'), 'Freunde: gleicher Name geht nicht zweimal')
    pg.click('#app .top .back'); pg.wait_for_timeout(200)
    ok(E("()=>view")=='pkFreunde' and pg.locator('.pk-stk').count()==3 and pg.locator('.pk-stk svg.pk-band').count()==3, 'Zurück führt zu den Freundes-Armbändern, 3 Sticker mit Armband-Bild')
    shot(pg, 'fr_list')
    pg.click('[data-act=pkLv][data-arg=wem]'); pg.wait_for_timeout(250)
    DEC = "()=>[...document.querySelectorAll('#pkRoot svg.pk-band g.pk-bg')].map(g=>{const n=[...g.querySelectorAll('.b')].reduce((s,e,k)=>s+(e.classList.contains('on')?[16,8,4,2,1][k]:0),0);return 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß'[n-1]}).join('')"
    ok('Armband ohne Namen' == pg.get_attribute('#pkRoot svg.pk-band', 'aria-label') and not pg.query_selector('#pkRoot svg.pk-band text.lt'), 'Ratespiel: Armband ohne Namen')
    for r in range(3):
        nm = E(DEC)
        if r == 0:
            pg.locator('#pkRoot .pk-opt:not([data-n="%s"])' % nm).first.click(); pg.wait_for_timeout(150)
            ok('Das ist nicht' in pg.inner_text('#pkRoot .pk-bubble') and bool(pg.query_selector('#pkRoot g.pk-bg.hint')), 'Ratespiel: falscher Name gibt einen Hinweis zum ersten Buchstaben')
            shot(pg, 'fr_wem')
        pg.click('#pkRoot .pk-opt[data-n="%s"]' % nm); pg.wait_for_timeout(150)
        ok(nm in pg.inner_text('#pkRoot .pk-bubble'), f'Ratespiel: {nm} erkannt')
        foot(pg, 'Fertig' if r == 2 else 'Nächstes Armband'); pg.wait_for_timeout(250)
    ok(E("()=>view")=='pkFreunde', 'Ratespiel fertig: zurück zu den Freunden')
    pg.click('.pk-link[data-act=pkFrDruck]'); pg.wait_for_timeout(150)
    ok(E("()=>view")=='pkFrDruck' and pg.locator('.pk-psticker svg.pk-band').count()==3 and pg.locator('.pk-decoder span').count()==30, 'Sticker-Bogen: 3 Sticker und Entschlüssel-Tafel auf einer Seite')
    shot(pg, 'fr_print')
    pg.click('#app .top .back'); pg.wait_for_timeout(150)
    pg.click('.pk-stk >> nth=2'); pg.click('[data-act=pkFrDel][data-arg=ask]'); pg.click('[data-act=pkFrDel][data-arg=yes]'); pg.wait_for_timeout(100)
    ok(pg.locator('.pk-stk').count()==2 and E("()=>S.punkte.friends.map(f=>f.n).join()")=='MIA,JÖRG', 'Freunde: Armband löschen (mit Nachfrage)')
    E("()=>go('punkte')"); pg.wait_for_timeout(150)
    ok('2' in pg.inner_text('.pk-seg[data-act=pkFreunde]'), 'Übersicht: Freunde-Segment zeigt die Anzahl')

    # Pause nach dem Umdrehen
    E("()=>{PK.pause=500;ACT.pkLv(3)}"); pg.wait_for_timeout(250)
    c0 = cards(pg)[2]['up']; pg.locator('#pkRoot .pk-card').nth(2).click(); pg.wait_for_timeout(60); pg.locator('#pkRoot .pk-card').nth(1).click(); pg.wait_for_timeout(60)
    ok(cards(pg)[2]['up'] != c0 and cards(pg)[1]['up'] == True and bool(pg.query_selector('#pkRoot .pk-cards.cool')), 'Pause: direkt nach dem Umdrehen wartet die nächste Karte')
    pg.wait_for_timeout(600); pg.locator('#pkRoot .pk-card').nth(1).click(); pg.wait_for_timeout(60)
    ok(cards(pg)[1]['up'] == False, 'Pause: nach 0,5 s geht es weiter')
    E("()=>{PK.pause=0;go('punkte')}"); pg.wait_for_timeout(150)

    # Venola Holmes: Rang, Koffer, Akten und Regeln als ein Band
    E("()=>{S.flags.venola=true;vnS().vnRulesV=1;ACT.venola()}"); pg.wait_for_timeout(200)
    ok(pg.locator('.vn-ribbon .vn-seg').count()==4 and not pg.query_selector('.vn-icons') and not pg.query_selector('.vn-pop') and 'Löse Akten' not in pg.inner_text('.vn-hero'), 'Venola: ein Band mit 4 Segmenten, ohne Untertitel und Popover')
    ok(pg.inner_text('.vn-segrank b')=='Lehrling' and bool(pg.query_selector('.vn-segrank .vn-mbar')), 'Venola: kurzer Rang-Name mit kleinem Balken')
    shot(pg, 'venola')
    pg.click('.vn-seg[data-act=vnRules]'); pg.wait_for_timeout(100)
    ok(E("()=>UI.vnV")=='rules', 'Venola: Regeln aus dem Band')
    E("()=>{UI.vnV=null;S.flags.venola=false;go('punkte')}"); pg.wait_for_timeout(150)
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
    s0 = E("()=>S.punkte.snd"); pg.click('[data-act=pkSnd]'); ok(E("()=>S.punkte.snd") != s0, 'Ton-Schalter im Band')
    pg.click('.pk-link[data-act=pkDruck]'); pg.wait_for_timeout(150)
    ok(E("()=>view")=='pkDruck' and pg.locator('.pk-pcard').count()==13, 'Druckbogen: 5 Punktkarten, Hinweis, 3 + 4 Zauberkarten')
    E("()=>{S.pin={h:hashStr('1234'),r:'x'};UI.pinUntil=Date.now()+1e9;go('parent')}"); pg.wait_for_timeout(150)
    pg.click('.pt-tabs [data-arg=stats]'); pg.wait_for_timeout(150)
    shot(pg, 'eltern')
    ok(bool(pg.query_selector('.pk-parent')) and 'Warum gibt es keine Karte mit 3 Punkten' in pg.inner_text('.pk-parent') and 'Leuchtsterne' in pg.inner_text('.pk-parent'), 'Eltern: Stand, Leuchtsterne und offene Fragen')
    E("()=>{S.eq.theme='nacht';go('punkte',{pkShow:'arm'})}"); pg.wait_for_timeout(150); shot(pg, 'hub_nacht')
    E("()=>ACT.pkLv(8)"); pg.wait_for_timeout(200); shot(pg, 'l8_nacht')


    # ---------- Trainingslager ----------
    E("()=>{S.daily.free=-99999;S.eq.theme='sonne';PK.pause=0;go('punkte')}"); pg.wait_for_timeout(150)   # die freie Zeit der App (4 Minuten) soll den Test nicht stoppen
    ok(pg.locator('.pk-acc').count()==1 and E("()=>document.getElementById('pkLes').hidden"), 'Entdeckungsreise: eingeklappt, wenn alles entdeckt ist')
    ok('14/14' in pg.inner_text('.pk-acc') and E("()=>S.punkte.les")==None, 'Entdeckungsreise: Kopf zeigt 14/14')
    pg.click('.pk-acc'); pg.wait_for_timeout(100)
    ok(not E("()=>document.getElementById('pkLes').hidden") and pg.locator('.pk-lv:visible').count()==14 and E("()=>S.punkte.les")==True, 'Entdeckungsreise: aufklappbar, 14 Entdeckungen, Zustand gemerkt')
    pg.click('.pk-acc'); pg.wait_for_timeout(100)
    ok(E("()=>document.getElementById('pkLes').hidden") and E("()=>S.punkte.les")==False, 'Entdeckungsreise: wieder zugeklappt')
    ok(pg.locator('.pkt-tile').count()==6 and pg.locator('.pkt-lb').count()==18 and pg.locator('.pkt-lb:not(.lock)').count()==6, 'Trainingslager: 6 Übungsarten mit je 3 Leveln, nur Level 1 offen')
    ok('Weiter üben' in pg.inner_text('.pk-hero'), 'Hero: „Weiter üben“, wenn alles entdeckt ist')
    shot(pg, 'lager_hub')
    def sol_of(m):
        if m == 'les':
            return total(pg)
        lab = pg.inner_text('#pkRoot .pk-target .pk-label').lower(); big = pg.inner_text('#pkRoot .pk-target b').strip()
        if m in ('bau', 'pix'): return int(big)
        if m == 'plus':
            import re as _re
            a, op, b = _re.split(r'\s*([+−])\s*', big); return int(a) + int(b) if op == '+' else int(a) - int(b)
        a = int(big)
        return a * 2 if 'doppelt' in lab else a // 2 if 'hälfte' in lab else a * 4 if 'viermal' in lab else a // 4
    def type_num(n):
        for ch in str(n): pg.locator('#pkRoot .pkt-key', has_text=ch).first.click()
        pg.locator('#pkRoot .pkt-key.ok').click(); pg.wait_for_timeout(60)
    def play_round(m, l, wrong_once=False):
        cnt = 6
        for i in range(cnt):
            sol = sol_of(m)
            if m == 'les':
                if wrong_once and i == 0: type_num(sol + 1 if sol < 31 else sol - 1); ok('Noch nicht' in pg.inner_text('#pkRoot .pk-bubble'), f'{m}{l}: falsche Antwort bekommt nur „Noch nicht ganz“')
                type_num(sol)
            else:
                if wrong_once and i == 0:
                    set_to(pg, sol ^ 1); foot(pg, 'Prüfen'); pg.wait_for_timeout(60)
                    ok('Noch nicht' in pg.inner_text('#pkRoot .pk-bubble') and pg.locator('#pkRoot .pkt-pips i.ok').count()==0, f'{m}{l}: falsche Antwort zählt nicht, Aufgabe bleibt')
                set_to(pg, sol); foot(pg, 'Prüfen'); pg.wait_for_timeout(60)
            ok(pg.locator('#pkRoot .pkt-pips i.ok').count()==i+1, f'{m}{l}: Aufgabe {i+1} gelöst, Punkt gefüllt') if i in (0, 5) else None
            try: foot(pg, 'Ergebnis' if i == cnt-1 else 'Weiter', timeout=2500)
            except Exception as ex:
                shot(pg, f'dbg_{m}{l}_{i}'); print('DBG', m, l, i, pg.inner_text('#pkRoot')[:300].replace('\n', ' | '), E("()=>JSON.stringify(UI.pkTr)")); raise
            pg.wait_for_timeout(60)
    def start(m, l): E("(a)=>ACT.pkTr(a)", f'{m}|{l}'); pg.wait_for_timeout(200)
    st0 = E("()=>S.punkte.stars")
    # Zahl bauen: Level 1 mit Zähler, ein Fehler = 2 Sterne
    start('bau', 1)
    ok(E("()=>view")=='pkLevel' and bool(pg.query_selector('#pkRoot .pk-counter')), 'bau 1: Level 1 zeigt die Zahl live (kleine Hilfe)')
    play_round('bau', 1, wrong_once=True); pg.wait_for_timeout(200)
    ok(bool(pg.query_selector('.pkt-end')) and pg.locator('.pkt-end .pk-stars i.on').count()==2, 'bau 1: Ergebnis mit 2 Sternen (ein Fehler)')
    ok(E("()=>S.punkte.tr.lv.bau1.best")==2 and E("()=>S.punkte.tr.total")==6 and E("()=>S.punkte.stars")>=st0+2, 'bau 1: Sterne, Aufgabenzähler (nur Erfolge) und Leuchtsterne gespeichert')
    ok('Erste Runde' in pg.inner_text('.pkt-end') and E("()=>!!S.punkte.tr.badge.erst"), 'Erstes Abzeichen „Erste Runde“')
    shot(pg, 'lager_end')
    ok(E("()=>pktOpen('bau',2)") and not E("()=>pktOpen('bau',3)"), 'bau: Level 2 geht auf, Level 3 noch nicht')
    # Level 2 und 3: nur die Antwort – keine Summe, keine Ziffern, kein Zähler
    pg.wait_for_timeout(1000); foot(pg, 'Level 2'); pg.wait_for_timeout(250)
    ok(E("()=>UI.pkTr.l")==2 and not pg.query_selector('#pkRoot .pk-counter') and not pg.query_selector('#pkRoot .pk-code') and pg.locator('#pkRoot .pk-slot').count()==7, 'bau 2: sieben Karten, kein Zähler, keine Code-Ziffern')
    set_to(pg, 85); ok(not pg.query_selector('#pkRoot .pk-counter') and pg.locator('#pkRoot .pk-bit:visible').count()==0 and '85' not in pg.inner_text('#pkRoot .pk-body').replace(pg.inner_text('#pkRoot .pk-target'),''), 'bau 2: beim Umdrehen erscheint keine Summe')
    shot(pg, 'lager_bau2')
    play_round('bau', 2); pg.wait_for_timeout(200)
    ok(pg.locator('.pkt-end .pk-stars i.on').count()>=2, 'bau 2: Runde ohne Zähler geschafft')
    pg.wait_for_timeout(1000); start('bau', 3)
    ok(pg.locator('#pkRoot .pk-slot').count()==8 and pg.query_selector('#pkRoot .pk-slot[data-v="128"]') is not None, 'bau 3: acht Karten mit der 128')
    pg.set_viewport_size({'width': 390, 'height': 844}); pg.wait_for_timeout(150)
    ok(E("()=>document.documentElement.scrollWidth<=window.innerWidth+1"), 'bau 3: Telefon, acht Karten passen')
    shot(pg, 'lager_bau3_phone')
    pg.set_viewport_size({'width': 834, 'height': 1112})
    play_round('bau', 3); pg.wait_for_timeout(200)
    ok(E("()=>!!S.punkte.tr.badge.byte"), 'Abzeichen „Byte-Held“ nach einer Runde mit 8 Karten')
    # Code lesen: Zahlenfeld, Level 1 mit Ziffern, Level 2 ohne
    pg.wait_for_timeout(1000); start('les', 1)
    ok(pg.locator('#pkRoot .pk-bit:visible').count()==5 and bool(pg.query_selector('#pkRoot .pkt-pad')) and not pg.query_selector('#pkRoot .pk-counter'), 'les 1: Karten mit Ziffern, Zahlenfeld, kein Zähler')
    shot(pg, 'lager_les1')
    play_round('les', 1, wrong_once=True); pg.wait_for_timeout(200)
    ok(E("()=>S.punkte.tr.lv.les1.best")>=2, 'les 1: Runde geschafft')
    pg.wait_for_timeout(1000); E("()=>ACT.pkTr('les|2')"); pg.wait_for_timeout(200)
    ok(pg.locator('#pkRoot .pk-bit:visible').count()==0 and pg.locator('#pkRoot .pk-slot').count()==7, 'les 2: nur die Karten, keine Ziffern')
    play_round('les', 2); pg.wait_for_timeout(200)
    # Rechnen, Doppelt und halb
    for m in ('plus', 'dbl'):
        pg.wait_for_timeout(1000); start(m, 1); play_round(m, 1); pg.wait_for_timeout(200)
        ok(E("(m)=>S.punkte.tr.lv[m+'1'].n", m)==1, f'{m} 1: Runde geschafft')
        pg.wait_for_timeout(1000); start(m, 2); play_round(m, 2); pg.wait_for_timeout(200)
    pg.wait_for_timeout(1000); start('dbl', 1); ok(bool(pg.query_selector('#pkRoot .pkt-code')), 'dbl 1: der gegebene Code als kleine Hilfe'); shot(pg, 'lager_dbl1')
    set_to(pg, sol_of('dbl')); foot(pg, 'Prüfen'); pg.wait_for_timeout(100)
    ok(bool(pg.query_selector('#pkRoot .pkt-shift')), 'dbl: nach dem Lösen zeigt das Schieben (Code vorher → nachher)')
    # Pixelbilder
    pg.wait_for_timeout(500); start('pix', 1)
    ok(bool(pg.query_selector('#pkRoot .pkt-view svg')) and pg.locator('#pkRoot .pkt-pips i').count()==5, 'pix 1: Bild versteckt, fünf Zeilen')
    for r in range(5):
        set_to(pg, sol_of('pix')); foot(pg, 'Prüfen'); pg.wait_for_timeout(120)
        if r < 4: shot(pg, f'lager_pix_r{r}') if r == 2 else None; foot(pg, 'Nächste Zeile'); pg.wait_for_timeout(80)
    pg.wait_for_timeout(1200)
    ok(bool(pg.query_selector('.pkt-end .pkt-trophy')) and E("()=>S.punkte.tr.pix.length")==1, 'pix 1: Bild fertig und in der Sammlung')
    ok('Neu in deiner Sammlung' in pg.inner_text('.pkt-end') and E("()=>!!S.punkte.tr.badge.bild"), 'pix 1: „Neu in deiner Sammlung“ und Abzeichen Pixelkünstler')
    shot(pg, 'lager_pix_end')
    ok(E("()=>PKT_PICS.every(x=>pktPicRows(x,PKT_VALS[x.s===5?1:x.s===7?2:3]).every(n=>n>=0&&n<(1<<x.s)))") and E("()=>PKT_PICS.every(x=>x.g.length===x.s&&x.g.every(r=>r.length===x.s))"), 'Pixelbilder: alle Raster sind quadratisch und passen zu den Karten')
    # Blitz (kurze Uhr im Test)
    E("()=>{PKT.blitz=4}"); pg.wait_for_timeout(1000); start('blitz', 1)
    foot(pg, 'Los!'); pg.wait_for_timeout(100)
    for k in range(2):
        set_to(pg, sol_of('bau')); pg.wait_for_timeout(500)
    ok(bool(pg.query_selector('#pkRoot .pkt-time')) and not pg.query_selector('#pkRoot .pk-counter'), 'Blitz: Uhr, kein Zähler')
    pg.wait_for_timeout(4200)
    ok(bool(pg.query_selector('.pkt-end')) and E("()=>S.punkte.tr.lv.blitz1.hi")==2 and E("()=>S.punkte.tr.lv.blitz1.n")==1, 'Blitz: Ende nach der Zeit, 2 Zahlen als Rekord gespeichert')
    E("()=>{PKT.blitz=60}")
    # Rang und Sammlung
    E("()=>{S.punkte.tr.total=19;save();go('punkte')}"); pg.wait_for_timeout(100)
    ok(E("()=>pktRankIdx(S.punkte.tr.total)")==0, 'Rang: bei 19 Aufgaben noch Bit-Neuling')
    start('bau', 1); st1 = E("()=>S.punkte.stars"); play_round('bau', 1); pg.wait_for_timeout(200)
    ok('Neuer Rang' in pg.inner_text('.pkt-end') and E("()=>pktRankIdx(S.punkte.tr.total)")>=1, 'Rang: Aufstieg wird gefeiert')
    E("()=>go('punkte')"); pg.wait_for_timeout(100)
    pg.click('.pk-seg[data-arg=rang]'); pg.wait_for_timeout(100)
    ok(pg.locator('.pk-popv .pkt-ranks span').count()==7, 'Rang: Ränge als kleine Symbole in der Leiste')
    pg.click('.pk-seg[data-arg=sam]'); pg.wait_for_timeout(100)
    ok(pg.locator('.pk-popv .pkt-bds span').count()==13 and pg.locator('.pk-popv .pkt-pics span').count()==12 and pg.locator('.pk-popv .pkt-bds span.ok').count()>=3, 'Sammlung: 13 Abzeichen und 12 Pixelbilder als kleine Symbole')
    shot(pg, 'lager_sammlung')
    pg.click('.pk-seg[data-arg=sam]')
    E("()=>{S.pin={h:hashStr('1234'),r:'x'};UI.pinUntil=Date.now()+1e9;S.cfg.plang='de';go('parent')}"); pg.wait_for_timeout(200)
    ok(bool(pg.query_selector('.pk-parent')) and 'Trainingslager' in pg.inner_text('.pk-parent') and 'Aufgaben gelöst' in pg.inner_text('.pk-parent'), 'Eltern: Trainingslager mit Rang, Aufgaben, Abzeichen')
    # neue Armband-Belohnungen
    E("()=>{S.punkte.stars=100;pkStarUnlocks()}")
    ok(E("()=>['pkd.feuer','pkd.wald','pkd.galaxie','pkc.blitz','pkc.diamant','pkc.pokal','pkc.krone'].every(hasItem)"), 'Leuchtsterne: neue Muster und Anhänger werden freigeschaltet')
    ok(E("()=>['feuer','wald','galaxie'].every(d=>pkBand(['L','U','M'],{d,ch:'krone'}).length>300 && !/undefined|NaN/.test(pkBand(['L','U','M'],{d})))"), 'Neue Muster zeichnen ein Armband ohne Fehler')
    ok('Eule' in str(E("()=>Object.values(CATALOG).filter(i=>i.kind==='pkcharm').map(i=>i.name)")) and E("()=>CATALOG['pkc.drache'].src.t")=='shop', 'Shop: Eule und Drache als Anhänger')
    E("(n)=>{S.punkte.stars=n;save();go('punkte')}", st1)

    # Telefonbreite: nichts läuft seitlich aus dem Bild
    pg.set_viewport_size({'width': 390, 'height': 844})
    for lv, nm in ((7, '4 Karten'), (10, 'Armband, 5 Karten'), (6, 'Schule und Blinki'), (8, 'Paketpost'), (13, '7 Karten'), (14, 'Wenigste Züge'), ('tag', 'Rätsel')):
        E("(n)=>{S.eq.theme='sonne';ACT.pkLv(n)}", lv); pg.wait_for_timeout(300)
        ok(E("()=>document.documentElement.scrollWidth<=window.innerWidth+1"), f'Telefon: keine waagrechte Scrollleiste ({nm})')
        shot(pg, f'phone_l{lv}')
    E("()=>go('pkFreunde',{pkFr:0})"); pg.wait_for_timeout(300)
    ok(E("()=>document.documentElement.scrollWidth<=window.innerWidth+1"), 'Telefon: keine waagrechte Scrollleiste (Freundes-Armbänder)')
    shot(pg, 'phone_fr')
    E("()=>go('punkte',{pkShow:'arm'})"); pg.wait_for_timeout(200)
    ok(E("()=>document.documentElement.scrollWidth<=window.innerWidth+1"), 'Telefon: keine waagrechte Scrollleiste (Übersicht mit Armband-Auswahl)')
    shot(pg, 'phone_hub')
    E("()=>{S.flags.venola=true;UI.pkShow=null;ACT.venola()}"); pg.wait_for_timeout(200); shot(pg, 'phone_venola')
    ok(E("()=>document.documentElement.scrollWidth<=window.innerWidth+1"), 'Telefon: Venola-Band passt')
    E("()=>{S.flags.venola=false;go('punkte')}")

    # Schalter aus: Daten bleiben, Shop-Gruppe verschwindet
    ok('blinki' in E("()=>shopGroups()"), 'Shop: Gruppe Blinki bei eingeschalteten Punktkarten')
    E("()=>ACT.dzFlag('punkte')")
    ok(not E("()=>flagOn('punkte')") and E("()=>Object.keys(S.punkte.done).length")==14, 'Ausblenden behält alle Entdeckungen')
    ok('blinki' not in E("()=>shopGroups()"), 'Shop: Gruppe Blinki ausgeblendet, wenn die Punktkarten aus sind')
    ok(not errs, 'Keine JavaScript-Fehler' + ('' if not errs else ': ' + '; '.join(errs[:3])))
    b.close()
print('\n' + ('ALLE TESTS OK' if not fails else f'{len(fails)} FEHLER'))
sys.exit(1 if fails else 0)
