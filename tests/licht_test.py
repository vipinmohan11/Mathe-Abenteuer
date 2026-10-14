"""Blinkis Lichterturm (Stufen 1–8): Schalter, Durchspielen aller Stufen über die Oberfläche, Lichtpunkte, Werkstatt, Codebuch, keine Münzen.
Aufruf: python3 licht_test.py /abs/pfad/Mathe-Abenteuer_Klasse4.html [screenshot-ordner]"""
import sys
from playwright.sync_api import sync_playwright
html = sys.argv[1]; shots = sys.argv[2] if len(sys.argv) > 2 else None; fails = []
def ok(c, m):
    print(('OK   ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
# Löst den aktuellen Schritt so, wie ein Kind es täte (klickt nur sichtbare Knöpfe)
SOLVE = """()=>{const m=UI.lt,sp=m.steps[m.si],st=m.st;
 const lampsTo=(want)=>{want.forEach((b,i)=>{if((st.bits[i]?1:0)!==b)ltDo('lamp:'+i)})};
 switch(sp.k){
  case 'meaning': return ['pick:nein'];
  case 'deal': return ['deal'];
  case 'ask': return ['lamp:0','send'];
  case 'readyn': return ['pick:'+(sp.on?'ja':'nein')];
  case 'snack': return ['keep','pick:apfel','lamp:0','keep','pick:keks','more','lamp:0','keep','pick:eis','lamp:1','keep','pick:banane'];
  case 'order': return ['pick:'+st.c.s];
  case 'guessn': return ['pick:6'];
  case 'hunt': {const o=[];for(let n=0;n<8;n++){const b=ltBits(n,3);o.push(['set',b]);o.push('catch')}return o}
  case 'copy': return ['add'];
  case 'predict': return ['pick:'+sp.ans];
  case 'factory': {const want=sp.vals.length===2?2:4;const o=[];let v=st.v;while(v<want){o.push('plus');v++}while(v>want){o.push('minus');v--}return o}
  case 'send': return [['set',ltBits(sp.t,sp.vals.length)],'send'];
  case 'readnum': return ['pick:'+sp.t];
  case 'morph': return ['m:0','m:1','m:2','m:3'];
  case 'todig': {const o=[];sp.bits.forEach((b,i)=>{o.push('slot:'+i);if(!b)o.push('slot:'+i)});o.push('chk');return o}
  case 'tolamp': return [['set',sp.bits],'chk'];
  case 'trap': return ['pick:hundert'];
  case 'talk': return [];
 }}"""
def solve_step(pg):
    E = pg.evaluate
    si0 = E("()=>UI.lt.si")
    acts = E(SOLVE)
    for a in acts:
        if isinstance(a, list):
            want = a[1]
            for i, b in enumerate(want):
                cur = E(f"()=>UI.lt.st.bits[{i}]?1:0")
                if cur != b: pg.click(f'.lt-row.mine [data-arg="lamp:{i}"]')
        else:
            sel = f'[data-act=ltDo][data-arg="{a}"]'
            if pg.query_selector(sel): pg.click(sel)
            else: E(f"()=>ltDo('{a}')")
    if E("()=>!UI.lt||!!UI.lt.res||UI.lt.si")!=si0: return 'adv'
    return E("()=>UI.lt&&!UI.lt.res?UI.lt.st.done:true")

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + html); pg.wait_for_timeout(300)
    E = pg.evaluate
    E("()=>{S.name='Mia';S.coins=40;S.cfg.calm=true;save()}")
    ok(E("()=>DZ_FLAGS.some(f=>f.id==='licht')") and not E("()=>flagOn('licht')"), 'Schalter vorhanden, Standard: ausgeblendet')
    E("()=>go('rewards')"); pg.wait_for_timeout(80)
    ok(not pg.query_selector('[data-act=licht]'), 'Meine Welt: ohne Schalter keine Kachel')
    E("()=>{S.pin={h:hashStr('1234'),r:'x'};UI.pinUntil=Date.now()+1e9;S.cfg.plang='de';go('parent')}"); pg.wait_for_timeout(100)
    if pg.query_selector('.sw[data-arg=licht]'): pg.click('.sw[data-arg=licht]')
    else: E("()=>ACT.dzFlag('licht')")
    ok(E("()=>flagOn('licht')"), 'Eltern-Schalter schaltet ein')
    E("()=>go('rewards')"); pg.wait_for_timeout(80)
    ok(bool(pg.query_selector('[data-act=licht]')), 'Meine Welt: Kachel sichtbar')
    pg.click('[data-act=licht]'); pg.wait_for_timeout(100)
    ok(E("()=>view")=='licht' and bool(pg.query_selector('.lt-scn')), 'Turm-Ansicht öffnet')
    ok(E("()=>ltS().snd")==False, 'Lampen-Töne standardmäßig aus')
    ok(E("()=>document.querySelectorAll('.lt-lvc').length")==8 and E("()=>document.querySelectorAll('.lt-lvc.lock').length")==7, 'Hub: 8 Stufen, 7 noch zu')
    if shots: pg.screenshot(path=f'{shots}/hub0.png', full_page=True)
    coins0 = E("()=>S.coins")
    for lv in range(1, 9):
        pg.click(f'[data-act=ltLv][data-arg="{lv}"]'); pg.wait_for_timeout(60)
        n = E("()=>UI.lt.steps.length"); stuck = False
        for si in range(n):
            if shots and lv in (2, 4, 5, 8) and si in (0, 1): pg.screenshot(path=f'{shots}/lv{lv}_s{si}_a.png', full_page=True)
            done = solve_step(pg)
            if not done: stuck = True; print('  stuck', lv, si, E("()=>UI.lt.steps[UI.lt.si].k"), E("()=>UI.lt.st.msg")); break
            if shots and lv in (3, 6, 8) and si == 1: pg.screenshot(path=f'{shots}/lv{lv}_s{si}_b.png', full_page=True)
            if done != 'adv' and E("()=>!!UI.lt&&!UI.lt.res"): pg.click('[data-act=ltDo][data-arg=next]')
        ok(not stuck and E("()=>!!(UI.lt&&UI.lt.res)"), f'Stufe {lv}: durchgespielt ({n} Schritte)')
        r = E("()=>UI.lt.res")
        ok(r['first'] and r['earned'] == E("()=>UI.lt.pts")+8, f'Stufe {lv}: +{r["earned"]} Lichtpunkte (Aufgaben + 5 + 3 ohne Tipp)')
        if shots and lv in (1, 8): pg.screenshot(path=f'{shots}/res{lv}.png', full_page=True)
        pg.click('[data-act=ltHub]'); pg.wait_for_timeout(40)
    ok(E("()=>Object.keys(ltS().done).length")==8 and E("()=>ltS().lv")==8, 'Alle 8 Stufen geschafft')
    ok(E("()=>S.coins")==coins0, 'Keine Münzen verdient oder ausgegeben')
    ok(E("()=>['jn','snack','dbl','wert','bit'].every(k=>ltS().code.includes(k))"), 'Codebuch: alle 5 Einträge')
    lp = E("()=>ltS().lp"); ok(lp >= 90, f'Lichtpunkte gesammelt: {lp}')
    # Wiederholen: +2, höchstens 5x am Tag
    for k in range(6):
        E("()=>ltStart(1)")
        for si in range(E("()=>UI.lt.steps.length")):
            if E("()=>!UI.lt||!!UI.lt.res"): break
            if solve_step(pg) != 'adv' and E("()=>!!UI.lt&&!UI.lt.res"): E("()=>ltDo('next')")
    ok(E("()=>ltS().lp")==lp+10 and E("()=>ltS().rep.n")==5, 'Wiederholen: +2, höchstens 5-mal am Tag')
    E("()=>{UI.lt=null;UI.ltV=null;render()}")
    if shots: pg.screenshot(path=f'{shots}/hub8.png', full_page=True)
    # Werkstatt
    pg.click('[data-act=ltShop]'); pg.wait_for_timeout(60)
    lp = E("()=>ltS().lp")
    for k in ['deco.laterne', 'lamp.ff', 'out.schal', 'sky.krone', 'deco.kette']:
        pg.click(f'[data-act=ltBuy][data-arg="{k}"]'); pg.wait_for_timeout(30)
    ok(E("()=>ltS().lp")==lp-10-20-15-20-20 and E("()=>ltS().eq.lamp")=='ff' and E("()=>ltS().eq.out")=='schal', 'Werkstatt: kaufen und ausrüsten')
    if shots: pg.screenshot(path=f'{shots}/shop.png', full_page=True)
    expensive = E("()=>{const p=ltS();p.lp=0;render();return document.querySelector('[data-act=ltBuy][data-arg=\"deco.garten\"]').disabled}")
    ok(expensive, 'Werkstatt: zu teuer = gesperrt')
    E("()=>{UI.ltV=null;render()}")
    ok('lt-scn' in pg.content() and E("()=>document.querySelector('.lt-scn').innerHTML.includes('#ffd76a')"), 'Turm zeigt Deko und Licht')
    if shots: pg.screenshot(path=f'{shots}/hub_deco.png', full_page=True)
    pg.click('[data-act=ltBook]'); pg.wait_for_timeout(40)
    ok(E("()=>document.querySelectorAll('.lt-cb').length")==5, 'Codebuch-Seite zeigt 5 Einträge')
    if shots: pg.screenshot(path=f'{shots}/book.png', full_page=True)
    # Fehler sind freundlich: falsches Senden in Stufe 6
    E("()=>{UI.ltV=null;ltStart(6)}"); pg.wait_for_timeout(40)
    E("()=>{const t=UI.lt.steps[0].t;UI.lt.st.bits=ltBits(t%15+1,4);ltDo('send')}")
    msg = E("()=>UI.lt.st.msg")
    ok('zu viel' in msg or 'zu wenig' in msg, 'Falsch gesendet: Lumi sagt, wie viel zu viel/zu wenig')
    ok('falsch' not in pg.inner_text('.lt-stage').lower(), 'Nirgends das Wort „falsch“')
    if shots: pg.screenshot(path=f'{shots}/lv6_miss.png', full_page=True)
    # Speichern/Laden behält alles
    E("()=>save()"); pg.reload(); pg.wait_for_timeout(300)
    ok(E("()=>Object.keys(S.licht.done).length")==8 and E("()=>S.licht.own['lamp.ff']>0"), 'Nach Neuladen: Stand und Werkstatt bleiben')
    # Eltern-Karte
    E("()=>{UI.pinUntil=Date.now()+1e9;go('parent')}"); pg.wait_for_timeout(80)
    ok('Lichterturm' in pg.inner_text('#app'), 'Eltern-Seite: Lichterturm-Karte')
    ok(not errs, 'Keine JS-Fehler: ' + '; '.join(errs[:3]))
    b.close()
print('\n' + ('ALLE OK' if not fails else f'{len(fails)} FEHLER'))
sys.exit(1 if fails else 0)
