"""Runde 12: Venola Holmes v2 (Kriminalfall, Geheimakte, Großer Fall, Beweismarken, Rang, Koffer, Verlauf, Aufgeben).
Aufruf: python3 round12_test.py /abs/pfad/Mathe-Abenteuer_Klasse4.html"""
import sys, json
from playwright.sync_api import sync_playwright
html = sys.argv[1]; fails = []
def ok(c, m):
    print(('OK   ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
SOLVE = """()=>{const m=UI.vn,p=vnPz(m),a=m.ans;
 if(p.kind==='choice'){a.sel=p.ans;render();return 'choice'}
 if(p.kind==='multi')return 'multi';
 if(p.kind==='pool'){const used=new Set();
   p.groups.forEach((g,gi)=>{for(let si=0;si<g.n;si++){const want=p.join?g.syl[si]:g.ans;
     let ci=p.chips.findIndex((c,i)=>!used.has(i)&&(g.ok&&!p.join?g.ok(c):c===want));
     if(ci<0)ci=p.chips.findIndex((c,i)=>!used.has(i)&&c===want);
     if(ci>=0){used.add(ci);a.fill[gi][si]=ci}}});vnAfterPool(m);return 'pool'}
 if(p.kind==='fields'){render();document.querySelectorAll('.vn-in').forEach(el=>{el.value=p.items[+el.dataset.i].ans[0];el.dispatchEvent(new Event('input',{bubbles:true}))});return 'fields'}
 if(p.kind==='cross'){Object.keys(p.cells).forEach(k=>vnCrossSet(m,k,p.cells[k]));return 'cross'}}"""
def solve_stage(pg):
    E = pg.evaluate; kind = E(SOLVE)
    if kind == 'choice':
        pg.click('[data-act=vnOk]')
        if E("()=>!!vnPz(UI.vn).pf"):
            pg.click('[data-act=vnPfOpt][data-arg="%d"]' % E("()=>vnPz(UI.vn).pf.ans")); pg.click('[data-act=vnPfOk]')
    elif kind == 'multi':
        for i, q in enumerate(E("()=>vnPz(UI.vn).qs.map(q=>q.ans)")): pg.click(f'[data-act=vnMq][data-arg="{i},{q}"]')
        pg.click('[data-act=vnMqChk]')
    elif kind == 'fields': pg.click('[data-act=vnFldChk]')
    return kind
def play(pg, game, lv, tm=0):
    E = pg.evaluate
    E("()=>{vnStop();UI.vn=null;UI.vnSet=null;UI.vnV=null;go('venola')}"); pg.wait_for_timeout(30)
    pg.click(f'[data-act=vnGame][data-arg={game}]'); pg.click(f'[data-act=vnLvl][data-arg="{lv}"]'); pg.click('[data-act=vnStart]'); pg.wait_for_timeout(60)
    kinds = []
    for si in range(E("()=>UI.vn.stages.length")):
        kinds.append(solve_stage(pg))
        if not E("()=>UI.vn.sv[UI.vn.si]"): return kinds, False
        pg.click('[data-act=vnNext]'); pg.wait_for_timeout(20)
    return kinds, E("()=>UI.vn.st") == 'win'
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1024, 'height': 768}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + html); pg.wait_for_timeout(300); E = pg.evaluate
    E("()=>{window.__rwOff=1;S.coins=100;S.cfg.shopMin=0;S.cfg.limitMin=0;save()}")

    # ---------- Generatoren ----------
    for t in ['sil', 'lad', 'chn', 'ana', 'hid', 'kre', 'lue']:
        r = E("""(t)=>{let bad=0,rep=0,ids=new Set();for(let lv=1;lv<=5;lv++)for(let i=0;i<6;i++){const d={t,lv,sd:500+i*131+lv};const q=vnBuild(d,{used:[]});
          if(!q||!q.ex||q.ex.length<2||!q.body||!q.sol)bad++;else{const q2=vnBuild({t,lv,sd:d.sd,ids:q.ids},{});if(JSON.stringify(q2.sol)!==JSON.stringify(q.sol)||q2.body!==q.body)rep++}}return {bad,rep}}""", t)
        ok(r['bad'] == 0 and r['rep'] == 0, f'Geheimakte {t}: Rätsel mit Erklärung, Wiedergabe identisch')
    for t in ['lie', 'grid', 'time', 'wit', 'ein']:
        r = E("""(t)=>{if(!VN_LOGIC[t])return {miss:1};let bad=0,rep=0;for(let lv=1;lv<=4;lv++)for(let i=0;i<6;i++){const sd=900+i*77+lv;const q=VN_LOGIC[t](lv,pzRng(sd));const q2=VN_LOGIC[t](lv,pzRng(sd));
          const okk=q&&q.ex&&q.ex.length>=2&&q.opts&&q.ans>=0&&q.ans<q.opts.length;if(!okk)bad++;if(JSON.stringify(q)!==JSON.stringify(q2))rep++}return {bad,rep}}""", t)
        ok(not r.get('miss') and r['bad'] == 0 and r['rep'] == 0, f'Kriminalfall {t}: gültig und deterministisch')
    r = E("""()=>{const o=VN_HID.filter((x,i)=>vnHidAt(x.s,x.w).at<0).length;return o}"""); ok(r == 0, 'Versteckte Wörter: alle über Wortgrenzen')
    r = E("()=>VN_KRE.every(x=>/^[A-ZÄÖÜ]+$/.test(x.w))&&VN_SIL.every(x=>x.s.join('')===x.w)"); ok(r, 'Daten: Kreuzwörter und Silben gültig')

    # ---------- Standard ausgeblendet ----------
    E("()=>go('rewards')"); pg.wait_for_timeout(80)
    ok(E("()=>!flagOn('venola')"), 'Venola standardmäßig ausgeblendet')
    E("()=>{S.flags.venola=true;save();go('venola')}"); pg.wait_for_timeout(100)

    # ---------- Hub / Stufen ----------
    ok(E("()=>document.querySelectorAll('.vn-lvrow button').length")==5, 'Hub: 5 Stufen')
    # ---------- Regeln müssen gelesen werden ----------
    pg.click('[data-act=vnStart]'); pg.wait_for_timeout(50)
    ok(E("()=>UI.vnV")=='rules' and E("()=>!UI.vn"), 'Erste Akte: zuerst die Detektiv-Regeln')
    ok(E("()=>document.querySelectorAll('.vn-rl').length")==5 and E("()=>document.querySelector('[data-act=vnRulesGo]').disabled"), 'Los erst, wenn jede Regel abgehakt ist')
    pg.mouse.click(5, 5); f0 = E("()=>S.daily.free||0"); pg.wait_for_timeout(2600)
    ok(E("()=>S.daily.free||0") == f0 and E("()=>!!document.querySelector('.vn-pause')"), 'Regeln lesen kostet keine Spielzeit (Uhr angehalten)')
    for i in range(4): pg.click('[data-act=vnRuleOk][data-arg="%d"]' % i)
    ok(E("()=>document.querySelector('[data-act=vnRulesGo]').disabled") and 'Noch 1 Regel' in pg.inner_text('[data-act=vnRulesGo]'), 'Noch eine Regel offen')
    pg.click('[data-act=vnRuleOk][data-arg="4"]'); pg.click('[data-act=vnRulesGo]'); pg.wait_for_timeout(50)
    ok(E("()=>UI.vn&&UI.vn.st")=='play' and E("()=>vnS().vnRulesV")==1, 'Nach dem Lesen startet die Akte, Regeln gemerkt')
    E("()=>{vnStop();vnS().vnCur=null;UI.vn=null;UI.vnSet=null;go('venola')}"); pg.wait_for_timeout(30)
    pg.click('[data-act=vnStart]'); ok(E("()=>UI.vn&&UI.vn.st")=='play', 'Danach kein Regel-Stopp mehr')
    E("()=>{vnStop();vnS().vnCur=null;UI.vn=null;UI.vnSet=null;go('venola')}"); pg.wait_for_timeout(30)
    pg.click('[data-act=vnRules]'); ok(E("()=>UI.vnV")=='rules' and E("()=>!document.querySelector('[data-act=vnRuleOk]')"), 'Regeln jederzeit im Hub nachlesbar')
    E("()=>{UI.vnV=null;go('venola')}")
    ok(E("()=>vnS().vnCaseLvl")==1 and E("()=>vnS().vnCodeLvl")==1, 'Start: nur Stufe 1 offen')
    # ---------- Stufen nacheinander freischalten (1→5) ----------
    for lv in range(1, 6):
        kinds, win = play(pg, 'case', lv)
        ok(win, f'Kriminalfall Stufe {lv} gelöst ({len(kinds)} Rätsel)')
        ok(E("()=>vnS().vnCaseLvl") == min(lv + 1, 5), f'Nach Stufe {lv}: offen bis {min(lv+1,5)}')
    for lv in range(1, 6):
        kinds, win = play(pg, 'code', lv)
        ok(win, f'Geheimakte Stufe {lv} gelöst ({len(kinds)} Rätsel: {",".join(sorted(set(kinds)))})')
    ok(E("()=>[vnS().venWins,vnS().venCase,vnS().venCode,vnS().venL5]") == [10, 5, 5, 2], 'Zähler: 10 Akten, 5+5, zweimal Stufe 5')
    ok(E("()=>vnS().vnMk")>0 and E("()=>!!S.trophies.zvl5"), 'Beweismarken verdient, Pokal „Ganz oben“')
    ok(E("()=>vnRank(10).name")=='Nachwuchs-Ermittler' and E("()=>vnRank(100).name")=='Meisterdetektiv', 'Ränge')
    # ---------- Verlauf unbegrenzt + Wiedergabe ----------
    ok(E("()=>pzS().hist.filter(e=>e.g==='ven').length")==10, 'Verlauf: alle 10 gespeichert')
    E("()=>{const h=pzS().hist;for(let i=0;i<450;i++)h.push({g:'sud',ts:1,lbl:'x',secs:1,hints:0,wk:false,pk:[],fg:[]});save()}")
    ok(E("()=>pzS().hist.length")>=460, 'Verlauf wird nicht gekürzt')
    E("()=>{vnStop();UI.vn=null;UI.vnV='hist';UI.vnRep=-1;go('venola');render()}"); pg.wait_for_timeout(60)
    ok(E("()=>document.querySelectorAll('.vn-hr').length")>=10, 'Verlaufsliste zeigt Akten')
    E("()=>{UI.vnRep=0;render()}"); pg.wait_for_timeout(60)
    ok(E("()=>!!document.querySelector('.vn-exp, .vn-card')"), 'Wiedergabe mit Lösung und Erklärung')

    # ---------- Aufgeben ----------
    E("()=>{vnStop();UI.vn=null;UI.vnSet=null;UI.vnV=null;vnS().vnCaseLvl=5;go('venola')}"); pg.wait_for_timeout(50)
    w0 = E("()=>[vnS().venWins,vnS().vnMk,S.coins,vnS().vnLater.length]")
    pg.click('[data-act=vnGame][data-arg=case]'); pg.click('[data-act=vnLvl][data-arg="2"]'); pg.click('[data-act=vnStart]'); pg.wait_for_timeout(50)
    pg.click('[data-act=vnGiveAsk]'); pg.click('[data-act=vnGiveYes]'); pg.wait_for_timeout(50)
    w1 = E("()=>[vnS().venWins,vnS().vnMk,S.coins,vnS().vnLater.length]")
    ok(w1[0] == w0[0] and w1[1] == w0[1] and w1[2] == w0[2], 'Aufgeben: keine Belohnung, kein Verlust')
    ok(w1[3] == w0[3] + 1, 'Aufgeben: Fall kommt später wieder')
    ok(E("()=>UI.vn.st")=='gave' and E("()=>/Lösung/.test(document.body.textContent)"), 'Aufgeben zeigt Lösungsweg')

    # ---------- Kein Wiederholen ----------
    r = E("""()=>{const p=vnS();p.vnSeen={};p.vnRep={};const seen={};let dup=0,rep=0;for(let i=0;i<40;i++){const m=vnNew('code',2,0);m.stages.forEach(s=>{if(!VN_SEENT.includes(s.t))return;const r0=(p.vnRep[s.t]||0);(s.u||[]).forEach(id=>{const k=s.t+':'+id+':'+r0;if(seen[k])dup++;seen[k]=1})})}return dup}""")
    ok(r == 0, 'Kein Rätsel wiederholt sich, solange der Vorrat reicht (%s Dubletten)' % r)

    # ---------- Frage melden ----------
    E("()=>{vnStop();UI.vn=null;UI.vnSet=null;go('venola')}")
    pg.click('[data-act=vnGame][data-arg=code]'); pg.click('[data-act=vnLvl][data-arg="1"]'); pg.click('[data-act=vnStart]'); pg.wait_for_timeout(50)
    n0 = E("()=>vnS().vnFlag.length"); pg.click('[data-act=vnFlagQ]'); ok(E("()=>vnS().vnFlag.length") == n0 + 1, 'Frage melden speichert')

    # ---------- Fortsetzen nach Neuladen ----------
    E("()=>{vnPersist(UI.vn)}")
    pg.reload(); pg.wait_for_timeout(300)
    E("()=>{window.__rwOff=1;go('venola')}"); pg.wait_for_timeout(100)
    ok(E("()=>!!document.querySelector('[data-act=vnCont]')"), 'Angefangene Akte lässt sich fortsetzen')
    pg.click('[data-act=vnCont]'); pg.wait_for_timeout(80)
    ok(E("()=>UI.vn&&UI.vn.st")=='play', 'Fortsetzen öffnet die Akte')

    # ---------- Großer Fall ----------
    E("()=>{vnStop();UI.vn=null;UI.vnSet=null;UI.vnV=null;go('venola')}"); pg.wait_for_timeout(50)
    c0 = E("()=>S.coins"); pg.click('[data-act=vnCont][data-arg=week]'); pg.wait_for_timeout(60)
    ok(E("()=>UI.vn.stages.length")==5, 'Großer Fall: 5 Rätsel')
    sd1 = E("()=>JSON.stringify(UI.vn.stages.map(s=>s.sd))")
    for si in range(5):
        solve_stage(pg); pg.click('[data-act=vnNext]'); pg.wait_for_timeout(20)
    ok(E("()=>UI.vn.st")=='win' and E("()=>S.coins")>=c0+10, 'Großer Fall gelöst: +10 Münzen')
    ok(E("()=>Object.keys(vnS().vnKof).length")>=1, 'Großer Fall bringt Beweisstück')
    E("()=>{vnStop();UI.vn=null;go('venola')}"); pg.wait_for_timeout(50)
    ok(E("()=>vnWeekState().done===true||!!vnS().vnWk"), 'Großer Fall nur einmal pro Woche')

    # ---------- Koffer ----------
    E("()=>{const p=vnS();p.vnMk=500;p.vnKof={};p.vnRow=[0,0,0];save();UI.vnV='koffer';go('venola')}"); pg.wait_for_timeout(60)
    ok(E("()=>document.querySelectorAll('.vn-ki').length")==12, 'Koffer: 12 Beweisstücke')
    ids = E("()=>VN_KOF.map(x=>x.id)")
    for i in ids[:4]: pg.click(f'[data-act=vnBuy][data-arg="{i}"]'); pg.wait_for_timeout(20)
    ok(E("()=>!!vnS().vnRow[0]"), 'Reihe 1 komplett → Avatar-Teil')
    ok(E("()=>{const a=Object.keys(S.unl||{}).concat(Object.keys(S.avUnl||{}));return JSON.stringify(S).includes('spion')}"), 'Avatar-Teil „Spion“ freigeschaltet')
    ok(E("()=>!JSON.stringify(SHOP).includes('meisterhut')"), 'Avatar-Teile nicht im Shop kaufbar')
    for i in ids[4:]: E("(i)=>vnBuy(i)", i)
    ok(E("()=>Object.keys(vnS().vnKof).length")==12, 'Voller Koffer')
    ok(E("()=>!!S.trophies.zvk"), 'Pokal „Voller Koffer“')

    # ---------- Eltern / Migration ----------
    ok(E("()=>typeof vnParentCard==='function'&&/Fragen|Rätsel/.test(vnParentCard())"), 'Eltern-Karte mit Vorräten')
    E("()=>{S.puz={hist:[],hint:{},venWins:3,venClean:1};save()}"); pg.reload(); pg.wait_for_timeout(300)
    E("()=>{S.flags.venola=true;go('venola')}"); pg.wait_for_timeout(80)
    ok(E("()=>vnS().venWins")==3 and E("()=>vnS().vnCaseLvl")>=1, 'Alter Spielstand bleibt erhalten')


    # ---------- Versuche, Beweis, Abzug ----------
    r = E("""()=>{let bad=0;for(const t of ['lie','grid','time','wit','ein'])for(let lv=1;lv<=5;lv++)for(let i=0;i<5;i++){const q=VN_LOGIC[t](lv,pzRng(3000+i*17+lv));const f=q&&q.pf;
      if(!f||!f.q||!f.opts||f.opts.length<2||!(f.ans>=0&&f.ans<f.opts.length)||new Set(f.opts).size!==f.opts.length)bad++;
      const q2=VN_LOGIC[t](lv,pzRng(3000+i*17+lv));if(JSON.stringify(q2.pf)!==JSON.stringify(f))bad++}return bad}""")
    ok(r == 0, 'Kriminalfall: jede Aufgabe hat eine eindeutige Beweis-Frage (%s Fehler)' % r)
    def start_case(lv, game='case'):
        E("()=>{vnStop();UI.vn=null;UI.vnSet=null;UI.vnV=null;vnS().vnCaseLvl=Math.max(vnS().vnCaseLvl,%d);vnS().vnCodeLvl=Math.max(vnS().vnCodeLvl,%d);vnS().vnRulesV=1;go('venola')}" % (lv, lv)); pg.wait_for_timeout(30)
        pg.click(f'[data-act=vnGame][data-arg={game}]'); pg.click(f'[data-act=vnLvl][data-arg="{lv}"]'); pg.click('[data-act=vnStart]'); pg.wait_for_timeout(50)
    E("()=>{const p=vnS();p.vnCaseLvl=3}")
    start_case(3)
    E("()=>{const m=UI.vn;m.stages=[{t:'grid',lv:3,sd:4242},{t:'time',lv:3,sd:4343}];m.sv=[0,0];m.miss=[0,0];m._pz={};m.si=0;m.ans=vnAnsNew(vnPz(m));render()}")
    wa = E("()=>{const p=vnPz(UI.vn);return [0,1,2,3].filter(i=>i!==p.ans).slice(0,2)}")
    pg.click('[data-act=vnOpt][data-arg="%d"]' % wa[0]); pg.click('[data-act=vnOk]')
    ok(E("()=>UI.vn.ans.tr")==1 and E("()=>UI.vn.wr")==1 and E("()=>!UI.vn.sv[0]"), '1. falscher Versuch: noch 1 Versuch')
    ok(E("()=>document.querySelector('[data-act=vnOpt][data-arg=\"%d\"]').disabled" % wa[0]), 'Falsche Antwort ist gesperrt')
    pg.click('[data-act=vnOpt][data-arg="%d"]' % wa[1]); pg.click('[data-act=vnOk]')
    ok(E("()=>UI.vn.sv[0]===1&&UI.vn.miss[0]===1"), '2. falscher Versuch: Rätsel nicht gelöst, Lösung wird gezeigt')
    ok(E("()=>!!document.querySelector('.vn-missc')") and E("()=>!!document.querySelector('[data-act=vnNext]')"), 'Akte geht weiter')
    pg.click('[data-act=vnNext]'); pg.wait_for_timeout(30)
    pg.click('[data-act=vnOpt][data-arg="%d"]' % E("()=>vnPz(UI.vn).ans")); pg.click('[data-act=vnOk]')
    ok(E("()=>UI.vn.ans.ph")=='proof' and E("()=>!UI.vn.sv[1]") and E("()=>!!document.querySelector('.vn-pf')"), 'Richtige Antwort → erst noch beweisen')
    pf = E("()=>vnPz(UI.vn).pf"); wrongpf = [i for i in range(len(pf['opts'])) if i != pf['ans']][0]
    pg.click('[data-act=vnPfOpt][data-arg="%d"]' % wrongpf); pg.click('[data-act=vnPfOk]')
    ok(E("()=>UI.vn.ans.pf.tr")==1 and E("()=>UI.vn.wr")==3, 'Falscher Beweis zählt als Fehler')
    pg.click('[data-act=vnPfOpt][data-arg="%d"]' % pf['ans']); pg.click('[data-act=vnPfOk]')
    ok(E("()=>UI.vn.sv[1]===1&&!UI.vn.miss[1]"), 'Richtiger Beweis löst das Rätsel')
    mk0 = E("()=>vnS().vnMk"); lv0 = E("()=>vnS().vnCaseLvl")
    pg.click('[data-act=vnNext]'); pg.wait_for_timeout(50)
    ok(E("()=>UI.vn.st")=='win' and E("()=>UI.vn.bm")==0 and E("()=>vnS().vnMk")==mk0, 'Marken: halbe Akte (2 von 5) minus 3 Fehler = 0, nie negativ')
    ok(E("()=>vnS().vnCaseLvl")==lv0, 'Nicht gelöstes Rätsel: keine neue Stufe')
    ok('abgeschlossen' in pg.inner_text('.pz-res'), 'Ergebnis heißt „Akte abgeschlossen“')
    # alles verpasst → wie Aufgeben
    w0 = E("()=>vnS().venWins"); start_case(1)
    E("()=>{const m=UI.vn;m.stages=[{t:'lie',lv:1,sd:77}];m.sv=[0];m.miss=[0];m._pz={};m.si=0;m.ans=vnAnsNew(vnPz(m));render()}")
    for i in [x for x in range(5) if x != E("()=>vnPz(UI.vn).ans")][:2]:
        pg.click('[data-act=vnOpt][data-arg="%d"]' % i); pg.click('[data-act=vnOk]')
    pg.click('[data-act=vnNext]'); pg.wait_for_timeout(50)
    ok(E("()=>UI.vn.st")=='gave' and E("()=>vnS().venWins")==w0, 'Kein Rätsel geschafft: keine Belohnung, zählt nicht')
    # Analogien: erst alles beantworten, dann einmal prüfen
    start_case(2, 'code')
    E("()=>{const m=UI.vn;m.stages=[{t:'ana',lv:2,sd:99}];m.sv=[0];m.miss=[0];m._pz={};m.si=0;m.ans=vnAnsNew(vnPz(m));render()}")
    qs = E("()=>vnPz(UI.vn).qs.map(q=>q.ans)")
    ok(E("()=>document.querySelector('[data-act=vnMqChk]').disabled"), 'Analogien: Prüfen erst wenn alles beantwortet')
    for i, a in enumerate(qs): pg.click(f'[data-act=vnMq][data-arg="{i},{(a + 1) % 3 if i == 0 else a}"]')
    ok(E("()=>UI.vn.ans.qa.every(x=>!x.ok)"), 'Analogien: kein Sofort-Feedback beim Antippen')
    pg.click('[data-act=vnMqChk]')
    ok(E("()=>UI.vn.ans.tr")==1 and E("()=>UI.vn.ans.qa.filter(x=>x.ok).length")==len(qs)-1, 'Prüfen: Ergebnis erst danach, falsche durchgestrichen')
    pg.click(f'[data-act=vnMq][data-arg="0,{qs[0]}"]'); pg.click('[data-act=vnMqChk]')
    ok(E("()=>UI.vn.sv[0]===1&&!UI.vn.miss[0]"), 'Analogien: zweite Prüfung richtig → gelöst')

    # ---------- Handy ----------
    pg.set_viewport_size({'width': 390, 'height': 800}); E("()=>{go('venola')}"); pg.wait_for_timeout(100)
    ok(E("()=>document.documentElement.scrollWidth<=window.innerWidth+1"), 'Handy: Hub ohne seitliches Scrollen')
    E("()=>{vnStop();UI.vn=null;UI.vnSet=null;go('venola')}")
    pg.click('[data-act=vnGame][data-arg=code]'); pg.click('[data-act=vnStart]'); pg.wait_for_timeout(80)
    ok(E("()=>document.documentElement.scrollWidth<=window.innerWidth+1"), 'Handy: Rätsel ohne seitliches Scrollen')
    ok(not errs, 'keine Konsolenfehler ' + str(errs[:3]))
    b.close()
print('\n%d Fehler' % len(fails)); sys.exit(1 if fails else 0)
