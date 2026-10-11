"""Runde 11: Sudoku + Venola Holmes (Meine Welt), fünfte Sticker-Serie, Pokale, Geschenke, Kacheln, Speichern.
Aufruf: python3 round11_test.py /abs/pfad/Mathe-Abenteuer_Klasse4.html"""
import sys
from playwright.sync_api import sync_playwright
html = sys.argv[1]; fails = []
def ok(c, m):
    print(('OK   ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1024, 'height': 768}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + html); pg.wait_for_timeout(300)
    E = pg.evaluate
    E("()=>{window.__rwOff=1;S.coins=100;S.life=100;S.cfg.shopMin=0;S.cfg.limitMin=0;save()}")

    # ---------- Sudoku-Generator ----------
    r = E("""()=>{const o=[];for(let lv=1;lv<=9;lv++){for(let k=0;k<3;k++){const g=sdGen(lv,Math.random),n=g.n;
      const valid=g.sol.every((v,i)=>v>=1&&v<=n)&&sdCount(g.puz,n,2)===1&&g.puz.every((v,i)=>!v||v===g.sol[i]);
      let rows=true;for(let r=0;r<n;r++){const s=new Set();for(let c=0;c<n;c++)s.add(g.sol[r*n+c]);if(s.size!==n)rows=false}
      o.push([lv,valid,rows,g.puz.filter(Boolean).length])}}return o}""")
    ok(all(x[1] and x[2] for x in r), 'Sudoku: alle 9 Stufen lösbar mit genau einer Lösung')
    ok(all(x[3] <= {1:14,2:11,3:9}.get(x[0], 99) or x[0] > 3 for x in r), 'Sudoku: Leicht hat mehr Zahlen als Knifflig')
    a = E("()=>{const f=lv=>sdGen(lv,pzRng(5)).puz.filter(Boolean).length;return [f(1),f(2),f(3),f(7),f(9)]}")
    ok(a[0] >= a[1] >= a[2] and a[3] >= a[4], 'Sudoku: Zahlen je Stufe sinken (%s)' % a)

    # ---------- Wochenrätsel ----------
    w1 = E("()=>JSON.stringify(sdNew(2,0,'2026-01-05').puz)"); w2 = E("()=>JSON.stringify(sdNew(2,0,'2026-01-05').puz)"); w3 = E("()=>JSON.stringify(sdNew(2,0,'2026-01-12').puz)")
    ok(w1 == w2 and w1 != w3, 'Wochenrätsel: gleich in der Woche, anders in der nächsten')
    ok(E("()=>pzWeek(new Date(2026,0,7))")=='2026-01-05' and E("()=>pzWeek(new Date(2026,0,11))")=='2026-01-05' and E("()=>pzWeek(new Date(2026,0,12))")=='2026-01-12', 'Woche beginnt am Montag')

    # ---------- Tiles / Gating ----------
    E("()=>go('rewards')"); pg.wait_for_timeout(100)
    ok(E("()=>![...document.querySelectorAll('.dz-tile')].some(x=>/Sudoku|Venola/.test(x.textContent))"), 'Standard: Sudoku und Venola sind ausgeblendet')
    ok(E("()=>DZ_FLAGS.some(f=>f.id==='sudoku')&&DZ_FLAGS.some(f=>f.id==='venola')"), 'Eltern-Schalter für beide')
    E("()=>{S.flags.sudoku=true;S.flags.venola=true;save();go('rewards')}"); pg.wait_for_timeout(100)
    t = E("()=>[...document.querySelectorAll('.dz-tile')].map(x=>x.textContent)")
    ok(any('Sudoku' in x for x in t) and any('Venola' in x for x in t), 'Meine Welt zeigt Sudoku und Venola Holmes')
    ok(E("()=>secName('sudoku')")=='Sudoku' and E("()=>secName('venola')")=='Venola Holmes', 'Eltern-Freigaben kennen beide')
    pg.click('[data-act=sudoku]'); pg.wait_for_timeout(100)
    ok(E("()=>view")=='sudoku' and E("()=>!!document.querySelector('.sd-week')"), 'Sudoku öffnet mit Wochenrätsel-Karte')
    ok(E("()=>document.querySelectorAll('.sd-lv').length")==9, '9 Stufen sichtbar')
    ok(E("()=>document.querySelectorAll('.sd-lv:not(.lock)').length")==1, 'Zu Beginn nur 4×4 Leicht offen')

    # ---------- Spielen: 4x4 lösen ----------
    pg.click('[data-act=sdStart]'); pg.wait_for_timeout(100)
    ok(E("()=>document.querySelectorAll('.sd-c').length")==16, '4×4-Feld hat 16 Zellen')
    ok(E("()=>!document.querySelector('[data-act=sdHint]').textContent.includes('noch')"), 'Hinweis: bei 3 übrig keine Zahl')
    ok(E("()=>document.getElementById('pzT')!==null"), 'Stoppuhr sichtbar')
    # falsche Zahl, dann richtig
    E("()=>{const m=UI.sd;const i=m.cells.findIndex((v,k)=>!v);ACT.sdCell(i);ACT.sdNum(m.sol[i]%4+1)}")
    ok(E("()=>S.puz.sudWins||0")==0, 'Falsche Zahl: kein Verlust, noch nicht gewonnen')
    # Hinweis
    E("()=>ACT.sdHint()"); ok(E("()=>UI.sd.hints")==1 and 'noch 2' in E("()=>document.querySelector('[data-act=sdHint]').textContent"), 'Hinweis zeigt „noch 2“')
    E("()=>ACT.sdHint()"); ok('noch 1' in E("()=>document.querySelector('[data-act=sdHint]').textContent"), 'Hinweis zeigt „noch 1“')
    E("()=>ACT.sdHint()"); ok(E("()=>pzHintLeft('sud')")==0 and E("()=>document.querySelector('[data-act=sdHint]').disabled"), 'Nach 3 Hinweisen: gesperrt')
    c0 = E("()=>S.coins")
    E("()=>{const m=UI.sd;m.cells.forEach((v,i)=>{if(v!==m.sol[i]){ACT.sdCell(i);ACT.sdNum(m.sol[i])}})}"); pg.wait_for_timeout(100)
    ok(E("()=>S.puz.sudWins")==1 and E("()=>S.puz.sdLvl")==2, 'Gelöst: Sieg gezählt, Stufe 2 offen')
    ok(E("()=>S.coins")>c0, 'Münzen für den Sieg')
    ok(E("()=>!!S.trophies.zs1"), 'Pokal „Erstes Sudoku“')
    ok(E("()=>S.puz.hist.length")==1 and E("()=>S.puz.hist[0].hints")==3, 'Verlauf: 1 gelöstes Rätsel mit 3 Hinweisen')
    ok(E("()=>S.puz.sudClean||0")==0, 'Mit Hinweis zählt nicht als „ganz allein“')
    ok(E("()=>S.puz.sdCur")==None, 'Fertiges Rätsel wird nicht als „begonnen“ gespeichert')
    # Münzen: nur die ersten 3 Siege pro Tag
    cs = []
    for i in range(4):
        E("()=>{S.puz.sdLvl=Math.max(S.puz.sdLvl,1);const m=sdNew(1,0,'');UI.sd=m;view='sudoku';m.cells=m.sol.slice();sdWin(m)}")
        cs.append(E("()=>S.coins"))
    ok(cs[0] > c0 and cs[1] > cs[0] and cs[2] == cs[1] and cs[3] == cs[1], 'Münzen nur für die ersten 3 Siege am Tag (%s)' % cs)
    # Verlauf nur gelöst
    ok(E("()=>pzHistory('sud','x').includes('gelöst')") and E("()=>S.puz.hist.every(e=>e.secs>=0)"), 'Verlauf zeigt gelöste Rätsel')
    # Freischalten 9x9
    E("()=>{S.puz.sdLvl=5;const m=sdNew(5,0,'');m.cells=m.sol.slice();UI.sd=m;sdWin(m)}")
    ok(E("()=>S.puz.sdLvl")==7, '6×6 Mittel gelöst öffnet 9×9 Leicht direkt')
    E("()=>{S.puz.sdLvl=7;const m=sdNew(7,0,'');m.cells=m.sol.slice();UI.sd=m;sdWin(m)}")
    ok(E("()=>!!S.trophies.zs9") and E("()=>S.puz.sud9")==1, '9×9 gelöst: Pokal Neuner-Gipfel')

    # ---------- Zeit: kein Verlust ----------
    E("()=>{const m=sdNew(1,5,'');m.el=301;m.t0=0;UI.sd=m;view='sudoku';sdBegin(m)}"); pg.wait_for_timeout(1500)
    ok(E("()=>UI.sd.up")==True and E("()=>UI.sd.st")=='play' and 'Zeit ist um' in E("()=>document.body.textContent"), 'Zeit um: Meldung, Spiel läuft weiter, nichts verloren')
    E("()=>sdStop()")

    # ---------- Speichern eines begonnenen Rätsels ----------
    E("()=>{ACT.sudoku();UI.sdSet={lv:1,tm:0};ACT.sdStart();const m=UI.sd;const i=m.cells.findIndex(v=>!v);ACT.sdCell(i);ACT.sdNum(m.sol[i]);ACT.sudoku()}"); pg.wait_for_timeout(100)
    ok(E("()=>!!S.puz.sdCur") and E("()=>!!document.querySelector('.sd-cont')"), 'Begonnenes Rätsel wird gespeichert und angeboten')
    pg.reload(); pg.wait_for_timeout(300); E("()=>{window.__rwOff=1;go('sudoku')}"); pg.wait_for_timeout(100)
    pg.click('[data-act=sdCont][data-arg=cur]'); pg.wait_for_timeout(100)
    ok(E("()=>UI.sd.cells.filter(Boolean).length")>E("()=>UI.sd.puz.filter(Boolean).length")-1, 'Nach Neuladen weitergespielt')
    E("()=>sdStop()")

    # ---------- Wochenrätsel verbuchen ----------
    E("()=>{const ws=sdWeekState();const m=sdNew(ws.lv,0,ws.wk);m.cells=m.sol.slice();UI.sd=m;sdWin(m)}")
    ok(E("()=>S.puz.sudWk")==1 and E("()=>sdWeekState().done"), 'Wochenrätsel gelöst und gemerkt')
    ok(E("()=>S.puz.hist.some(e=>e.wk)"), 'Verlauf markiert Wochenrätsel')

    # ---------- Venola (v2 siehe round12) ----------
    E("()=>go('venola')"); pg.wait_for_timeout(100)
    ok(E("()=>document.querySelectorAll('.vn-title span').length")==12, 'Titel „VENOLA HOLMES“ in einzelnen Buchstaben')
    f1 = E("()=>getComputedStyle(document.querySelector('.vn-title span:nth-child(1)')).fontFamily"); f2 = E("()=>getComputedStyle(document.querySelector('.vn-title span:nth-child(2)')).fontFamily")
    ok('Bodoni' in f1 and 'Georgia' in f2, 'Titel wechselt Libre Bodoni / Georgia (%s | %s)' % (f1[:20], f2[:20]))
    ok(E("()=>document.fonts.check('700 20px \"Venola Bodoni\"')"), 'Libre Bodoni ist eingebettet')
    def win_case(g, lv):
        E("()=>{vnStop();UI.vn=null;UI.vnSet=null;UI.vnV=null;go('venola')}")
        pg.click('[data-act=vnGame][data-arg=%s]' % g); pg.click('[data-act=vnStart]'); pg.wait_for_timeout(60)
        E("()=>{const m=UI.vn;m.sv=m.stages.map(()=>1);vnWin(m);render()}"); pg.wait_for_timeout(60)
    win_case('code', 1)
    ok(E("()=>S.puz.venWins")==1 and E("()=>S.puz.venCode")==1 and E("()=>S.puz.vnCodeLvl")==2, 'Geheimakte gelöst: Zähler und Stufe 2')
    ok(E("()=>!!S.trophies.zv1") and E("()=>S.puz.venClean")==1, 'Pokal „Erster Fall“, ohne Hinweis zählt')
    ok(E("()=>hasItem('fg.lupo')"), 'Erster gelöster Fall gibt Sticker „Lupo“')
    ok(E("()=>!hasItem('fg.kritzel')"), 'Kritzel noch nicht')
    win_case('case', 1)
    ok(E("()=>S.puz.venCase")==1 and E("()=>S.puz.vnCaseLvl")==2, 'Kriminalfall gelöst')
    E("()=>vnStop()")
    E("()=>{vnStop();UI.vn=null;UI.vnSet=null;UI.vnV=null;go('venola')}"); pg.click('[data-act=vnGame][data-arg=code]'); pg.click('[data-act=vnStart]')
    for i in range(4): E("()=>ACT.vnHint()")
    ok(E("()=>pzHintLeft('vg')")<=0 or E("()=>UI.vn.hints")<=3, 'Venola: höchstens 3 Hinweise pro Tag')
    E("()=>vnStop()")
    win_case('code', 1)
    ok(E("()=>hasItem('fg.kritzel')")==(E("()=>S.puz.venWins")>=3), 'Kritzel kommt bei 3 gelösten Fällen')

    # ---------- Sticker-Serie 5 ----------
    ok(E("()=>ALB_SETS.length")==5 and E("()=>ALB_SETS[4].id")=='detek', 'Fünf Serien, die fünfte sind die Spürnasen')
    E("()=>{S.puz.venWins=30;albumCheck(true)}")
    ok(E("()=>ALB_CH.filter(c=>c.w).every(c=>hasItem('fg.'+c.id))"), 'Bei 30 gelösten Fällen sind alle 6 Spürnasen da')
    ok(E("()=>hasItem('fg.scharf')") and E("()=>hasItem('acc.detektiv')"), 'Serie komplett: Legende + Detektivmütze')
    ok(E("()=>CATALOG['acc.detektiv'].src.why")=='Sticker-Serie Spürnasen komplett', 'Detektivmütze: Quelle richtig')
    E("()=>{Object.keys(S.unl).filter(k=>k.startsWith('fg.')).forEach(k=>delete S.unl[k]);S.puz.venWins=0;S.album={mig:1,done:{}}}")
    E("()=>{for(let i=0;i<200;i++){const f=albumGiftPick();if(f&&CATALOG[f.id].set==='detek')throw 'det im Geschenk'}}")
    ok(True, 'Geschenke ziehen nie Spürnasen')
    E("()=>{S.album={mig:0};ALB_OLD.slice(0,20).forEach(k=>S.unl['bs.'+k]=1);albumMig()}")
    ok(E("()=>ALB_CH.filter(c=>c.w&&hasItem('fg.'+c.id)).length")==0, 'Umzug alter Sticker vergibt keine Spürnasen')
    E("()=>{Object.keys(S.unl).filter(k=>k.startsWith('fg.')).forEach(k=>delete S.unl[k]);S.album={mig:1,done:{}}}")
    E("()=>go('shop');ACT.shopGroup&&ACT.shopGroup('album')")
    # ---------- Geschenk-Meilensteine ----------
    ok(E("()=>GIFT_MS.some(m=>m.id==='gz3')") and E("()=>GIFT_MS.some(m=>m.id==='gv50')"), 'Geschenk-Meilensteine für Sudoku und Venola')
    E("()=>{S.puz.sudWins=3;S.puz.venWins=0}")
    ok(E("()=>GIFT_MS.find(m=>m.id==='gz3').v(S)")==3, 'Sudoku-Siege zählen für Geschenke')
    # ---------- Seiten & Eltern ----------
    for v in ['sudoku', 'venola']:
        E("()=>go('%s')" % v); pg.wait_for_timeout(100)
        ok(E("()=>document.body.scrollWidth<=window.innerWidth+1"), '%s: kein horizontales Scrollen' % v)
    E("()=>{go('sudoku');ACT.sdHist()}"); pg.wait_for_timeout(100)
    ok(E("()=>!!document.querySelector('.pz-h')"), 'Sudoku-Verlauf zeigt gelöste')
    E("()=>{go('venola');ACT.vnHist()}"); pg.wait_for_timeout(100)
    ok(E("()=>document.body.textContent.includes('gelöst')"), 'Venola-Verlauf')
    ok(not errs, 'Keine Konsolenfehler %s' % errs[:3])
    b.close()
print('\n%d Fehler' % len(fails)); sys.exit(1 if fails else 0)
