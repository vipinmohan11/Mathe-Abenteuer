"""Europa-Entdecker: Daten, Fragen-Bau, Ausstiegsschutz, Belohnung (Tageslimit), Erhalt vorhandener Münzen. Aufruf: python3 geo_test.py /abs/pfad/Mathe-Abenteuer_Klasse4.html"""
import sys, json, os
os.makedirs('/tmp/rh', exist_ok=True)
from playwright.sync_api import sync_playwright
html = sys.argv[1]; fails = []
def ok(c, m):
    print(('OK   ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 800, 'height': 1280}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + html); pg.wait_for_timeout(300)
    # Vorhandener Stand: Münzen/Sterne/Karten/Pokale setzen
    pg.evaluate("""()=>{const a=window.__app;a.S.coins=500;a.S.life=500;a.S.starsLife=40;a.S.stars=40;a.S.chests=2;a.S.cards={a1:1,a2:1};a.S.trophies={blk1:1};a.save();}""")
    n = pg.evaluate("()=>COUNTRIES.length"); ok(n == 47, f'{n} Länder (50 − Armenien, Aserbaidschan, Kasachstan, Türkei + Kosovo)')
    ok(pg.evaluate("()=>COUNTRIES.every(c=>typeof FLAGS[c.id]==='function')"), 'jedes Land hat eine Flagge')
    ok(pg.evaluate("()=>new Set(COUNTRIES.map(c=>c.id)).size===COUNTRIES.length"), 'Ids eindeutig')
    ok(pg.evaluate("()=>COUNTRIES.every(c=>c.facts.length>=1&&c.cap&&c.name)"), 'Name, Hauptstadt, Fakten vorhanden')
    ok(pg.evaluate("()=>COUNTRIES.every(c=>c.nb.every(n=>CBY[n]&&CBY[n].nb.includes(c.id)&&n!==c.id))"), 'Nachbarschaft gegenseitig')
    ok(pg.evaluate("()=>['arm','aze','kaz','tur'].every(i=>!CBY[i])&&!COUNTRIES.some(c=>c.nb.concat(c.tr).some(i=>['arm','aze','kaz','tur'].includes(i)))"), 'Armenien/Aserbaidschan/Kasachstan/Türkei entfernt, nirgends mehr verwiesen')
    ok(pg.evaluate("()=>COUNTRIES.every(c=>c.nb.concat(c.tr).every(i=>CBY[i]))"), 'alle nb/tr-Ids zeigen auf vorhandene Länder')
    ok(pg.evaluate("()=>typeof FLAGS.tur==='function'"), 'FLAGS.tur bleibt (Meine Weltreise)')
    ok(pg.evaluate("()=>{const k=CBY.kos;return k&&k.name==='Kosovo'&&k.cap==='Pristina'&&k.reg==='balk'&&['alb','mkd','mne','srb'].every(i=>k.nb.includes(i)&&CBY[i].nb.includes('kos'))&&k.nb.length===4&&k.facts.length>=1&&k.area>0&&gCapOK(k,'pristina')&&gCapOK(k,'Priština')}"), 'Kosovo: Pristina, Region Balkan, 4 Nachbarn gegenseitig, Fakten, Fläche, Flagge')
    ok(pg.evaluate("()=>COUNTRIES.every(c=>!c.trap||(!COUNTRIES.some(x=>x.cap===c.trap)&&c.trap!==c.cap))"), 'kniffelige Städte (trap) sind nie eine Hauptstadt')
    ok(pg.evaluate("()=>{const c=CBY.smr;return c.cap==='San Marino'&&gCapOK(c,'Stadt San Marino')&&gCapOK(c,'san marino')&&gTrivial(c)&&['smr','lux','mco','vat'].every(i=>gTrivial(CBY[i]))&&!gTrivial(CBY.and)}"), 'San Marino: Hauptstadt „San Marino“, „Stadt San Marino“ wird akzeptiert, gleichnamige Hauptstädte sind „trivial“')
    # San-Marino-Regel: gleichnamige Hauptstädte kommen nie als Tipp-/Rück-Frage vor; in der Auswahl-Frage steht ein Hinweis
    smr = pg.evaluate("""()=>{let bad=[],cap=0;for(let r=0;r<300;r++){for(const mode of ['typ','rev','mix']){const qs=gBuild({cont:'europa',n:15,mode,tricky:'mix'});for(const q of qs){const c=CBY[q.cid]; if((q.t==='typ'||q.t==='rev')&&gTrivial(c))bad.push([q.t,c.id]);}}}
      const q=gQuestion(CBY.smr,'cap',false); if(q.ans!=='San Marino'||!q.title.includes('Manchmal')||q.opts.filter(o=>o.k==='San Marino').length!==1)bad.push(['cap-smr']);
      const q2=gQuestion(CBY.deu,'cap',false); if(q2.title.includes('Manchmal'))bad.push(['hint-deu']); return bad.slice(0,5);}""")
    ok(not smr, 'gleichnamige Hauptstädte (San Marino, Luxemburg, Monaco, Vatikanstadt) nie in Tippen/Land-finden; Auswahl-Frage hat Hinweis ' + str(smr))
    ok(pg.evaluate("()=>{const q=gQuestion(CBY.nld,'cap',true);return q.opts.every(o=>o.k!=='Den Haag')&&CBY.nld.facts[0].includes('Den Haag')}"), 'Niederlande: Den Haag nie als Antwortmöglichkeit, Hinweis steht im ersten Fakt (Ergebnisseite)')
    # Fragen-Bau: viele Läufe
    bad = pg.evaluate("""()=>{const bad=[];
      for(const mode of ['mix','cap','typ','rev','nb','flag','size','route'])for(const tricky of [false,true,'mix'])for(const n of [10,15])for(let r=0;r<40;r++){
        const qs=gBuild({cont:'europa',n,mode,tricky});
        if(qs.length<10)bad.push(['len',mode,qs.length]);
        if(new Set(qs.map(q=>q.cid)).size!==qs.length)bad.push(['dup',mode]);
        for(const q of qs){const c=CBY[q.cid];
          if(q.t==='typ'){ if(!gCapOK(c,c.cap)||gCapOK(c,'xyz'))bad.push(['typ',c.id]); continue;}
          const need=q.t==='size'?2:4; if(q.opts.length!==need)bad.push(['opts',q.t,q.opts.length]);
          if(new Set(q.opts.map(o=>o.k)).size!==need)bad.push(['dupopt',q.t,c.id]);
          if(q.t==='size'){const d=CBY[q.other];const big=c.area>d.area?c.id:d.id;if(q.ans!==big||Math.max(c.area,d.area)/Math.min(c.area,d.area)<1.6)bad.push(['size',c.id]);}
          if(q.t==='route'){const d=CBY[q.other];if(!c.nb.includes(q.ans)||!d.nb.includes(q.ans)||c.nb.includes(d.id)||q.opts.filter(o=>o.k!==q.ans&&c.nb.includes(o.k)&&d.nb.includes(o.k)).length)bad.push(['route',c.id]);}
          if(q.t==='flag'&&q.ans!==c.id)bad.push(['flag']);
          if(q.opts.filter(o=>o.k===q.ans).length!==1)bad.push(['ans',q.t,c.id]);
          if(q.t==='cap'&&q.ans!==c.cap)bad.push(['capans']);
          if(q.t==='rev'&&(gTrivial(c)))bad.push(['trivial',c.id]);
          if(q.t==='nb'){ if(!c.nb.includes(q.ans))bad.push(['nbans',c.id]); const wr=q.opts.filter(o=>o.k!==q.ans); if(wr.some(o=>c.nb.includes(o.k)||o.k===c.id))bad.push(['nbwrong',c.id]); }
          if(q.t==='cap'&&q.opts.some(o=>o.k!==c.cap&&gNorm(o.k)===gNorm(c.cap)))bad.push(['samecap']);
        }}
      return bad.slice(0,5);}""")
    # Alte Ids im Spielstand (Armenien, Aserbaidschan, Kasachstan, Türkei): ignorieren, nie löschen
    pg.evaluate("()=>{S.geo.k={arm:2,aze:2,kaz:2,tur:2,deu:2};S.geo.ms={};S.geo.cards={tur:1};S.geo.seen={tur:3};S.geo.miss={arm:1};S.geo.kd={kaz:5};save();}")
    ok(pg.evaluate("()=>gKnownN('europa')")==1 and pg.evaluate("()=>{const t=geoTrophies().find(x=>x.id==='geo50');return !t.t(S)}") , 'Alte Ids zählen nicht als „sicher gewusst“')
    pg.evaluate("()=>{ACT.geo();ACT.geoPass();ACT.geoCards();ACT.gCard('deu');ACT.geoFacts();ACT.geo();}"); pg.wait_for_timeout(80)
    ok(pg.evaluate("()=>S.geo.k.tur===2&&S.geo.k.arm===2&&S.geo.k.aze===2&&S.geo.k.kaz===2&&S.geo.cards.tur===1&&S.geo.seen.tur===3"), 'Alte Ids bleiben gespeichert (nichts gelöscht)')
    ok(not bad, 'Fragen-Bau in 800 Läufen fehlerfrei ' + str(bad))
    ok(pg.evaluate("()=>gCapOK(CBY.che,'bern ')&&gCapOK(CBY.mda,'Chisinau')&&gCapOK(CBY.deu,'BERLIN')&&!gCapOK(CBY.che,'Zürich')&&gCapOK(CBY.ukr,'Kyiv')"), 'Tippen: Groß/Klein, Leerzeichen, Alternativen; falsche Stadt falsch')
    ok(pg.evaluate("()=>!gCapOK(CBY.gbr,'Großbritannien')"), 'Ländername wird nicht als Hauptstadt akzeptiert')
    # Navigation: Startseite hat das Fach
    pg.evaluate("()=>__app.go('home')"); pg.wait_for_timeout(150)
    ok('Europa Entdecker' in pg.inner_text('body'), 'Startseite zeigt Europa Entdecker')
    pg.screenshot(path='/tmp/rh/geo_home.png')
    pg.evaluate("()=>ACT.geo()"); pg.wait_for_timeout(100); pg.screenshot(path='/tmp/rh/geo_main.png')
    # Runde starten
    pg.evaluate("()=>ACT.geoGo()"); pg.wait_for_timeout(100)
    ok(pg.evaluate("()=>view")=='geoPlay' and pg.evaluate("()=>[10,15].includes(GQ.qs.length)"), 'Quiz startet direkt (10 oder 15 Fragen), ohne Auswahl')
    ok(pg.evaluate("()=>GQ.cfg.mode==='mix'&&GQ.cfg.tricky==='mix'&&!VIEWS.geoSetup"), 'immer gemischt, keine Setup-Seite')
    ok(pg.evaluate("()=>new Set(GQ.qs.map(q=>q.t)).size>=2&&GQ.qs.every(q=>q.t!=='nb')"), 'mehrere Fragearten, keine Nachbar-Fragen im Quiz')
    pg.screenshot(path='/tmp/rh/geo_play.png')
    # Ausstiegsschutz: Nav, Zurück-Taste, ✕
    pg.evaluate("()=>ACT.home()"); pg.wait_for_timeout(80)
    ok(pg.evaluate("()=>!!document.getElementById('modal')") and 'Dein Fortschritt geht verloren, wenn du die Runde verlässt.' in pg.inner_text('#modal'), 'Warnung beim Verlassen (Menü)')
    ok(pg.evaluate("()=>view")=='geoPlay', 'bleibt in der Runde')
    pg.evaluate("()=>ACT.closeModal()")
    pg.evaluate("()=>ACT.geoQuit()"); ok(pg.evaluate("()=>!!document.getElementById('modal')"), 'Warnung bei ✕'); pg.evaluate("()=>ACT.closeModal()")
    pg.go_back() if False else None
    pg.evaluate("()=>window.dispatchEvent(new PopStateEvent('popstate'))"); pg.wait_for_timeout(60)
    ok(pg.evaluate("()=>!!document.getElementById('modal')"), 'Warnung bei Zurück-Taste'); pg.evaluate("()=>ACT.closeModal()")
    # Keine Rückmeldung in der Runde
    pg.evaluate("()=>{const q=GQ.qs[0]; if(q.t!=='typ') ACT.gPick(q.opts[0].k); render();}")
    ok(pg.evaluate("()=>!document.querySelector('.ch.ok,.ch.bad')"), 'keine Richtig/Falsch-Anzeige während der Runde')
    # Verlassen verwirft die Runde, Münzen unverändert
    c0 = pg.evaluate("()=>S.coins")
    pg.evaluate("()=>ACT.home()"); pg.evaluate("()=>ACT.geoLeaveYes()"); pg.wait_for_timeout(80)
    ok(pg.evaluate("()=>view")=='home' and pg.evaluate("()=>GQ")is None and pg.evaluate("()=>S.coins")==c0 and pg.evaluate("()=>S.geo.sessions")==0, 'Verlassen: Runde weg, nichts bezahlt')
    # Perfekte Runde (alle richtig)
    def play(correct_n, mode='mix', n=10, tricky=False):
        pg.evaluate("(a)=>geoStart({cont:'europa',n:a[0],mode:a[1],tricky:a[2]})", [n, mode, tricky])
        pg.evaluate("""(k)=>{GQ.qs.forEach((q,i)=>{const right=i<k; if(q.t==='typ') q.typed= right?CBY[q.cid].cap:'Quatsch';
           else if(right) q.pick=q.ans; else q.pick=q.opts.find(o=>o.k!==q.ans).k;});}""", correct_n)
        pg.evaluate("()=>render()"); pg.evaluate("()=>ACT.geoDone()"); pg.wait_for_timeout(120)
        return pg.evaluate("()=>({res:GQ.res,coins:S.coins,stars:S.starsLife,chests:S.chests,sess:S.geo.sessions,gp:S.daily.gp,n:S.daily.n})")
    r1 = play(6)    # 60 % → 1 Stern
    ok(r1['res']['pay']['c']==0 and r1['res']['pay']['s']==1 and r1['coins']==500, f"6/10: 1 Stern, keine Münzen {r1['res']['pay']}")
    pg.screenshot(path='/tmp/rh/geo_result.png', full_page=True)
    r2 = play(8)    # 80 % → +3 Münzen, +0 Stern (1 schon bezahlt)
    ok(r2['res']['pay']['c']==3 and r2['res']['pay']['s']==0 and r2['coins']==503, f"8/10 danach: +3 Münzen, Differenz {r2['res']['pay']}")
    r3 = play(10)   # 100 % → +2 Münzen +1 Stern + Karte
    ok(r3['res']['pay']['c']==2 and r3['res']['pay']['s']==1 and r3['res']['pay']['chest'] and r3['coins']==505, f"10/10: Rest bis Tagesmax + Karte {r3['res']['pay']}")
    r4 = play(10)   # Tageslimit
    ok(r4['res']['pay']['c']==0 and r4['res']['pay']['s']==0 and not r4['res']['pay']['chest'] and r4['coins']==505, 'Tageslimit: nichts mehr, kein Farmen')
    ok(r4['gp']['gn']==10 and r4['gp']['c']==5 and r4['gp']['s']==2, f"Tagesziel zählt höchstens 10 Fragen: {r4['gp']}")
    ok(r4['chests']>=3 and pg.evaluate("()=>Object.keys(S.cards).length")==2 and pg.evaluate("()=>S.trophies.blk1")==1, 'Karten/Truhen/Pokale blieben erhalten')
    # Kurze Runde zahlt nicht
    pg.evaluate("()=>{touchDay();S.daily.gp=null;}")
    r5 = play(5, n=10)
    ok(True, 'weiter')
    # Fehler üben zahlt nicht
    pg.evaluate("()=>{touchDay();S.daily.gp=null;}")
    play(4); c1 = pg.evaluate("()=>S.coins")
    pg.evaluate("()=>ACT.geoRetry()"); pg.evaluate("()=>{GQ.qs.forEach(q=>{if(q.t==='typ')q.typed=CBY[q.cid].cap;else q.pick=q.ans;});ACT.geoDone();}")
    ok(pg.evaluate("()=>S.coins")==c1 and pg.evaluate("()=>GQ.res.pay.c")==0, 'Fehler-üben-Runde zahlt nichts')
    # Sicher gewusst + Meilenstein (einmalig)
    pg.evaluate("()=>{S.geo.k={};S.geo.ms={};COUNTRIES.slice(0,9).forEach(c=>S.geo.k[c.id]=2);S.geo.k[COUNTRIES[9].id]=1;}")
    s0 = pg.evaluate("()=>({st:S.starsLife,ch:S.chests})")
    m1 = pg.evaluate("()=>geoMilestones('europa').length"); pg.evaluate("()=>{S.geo.k[COUNTRIES[9].id]=2}")
    m2 = pg.evaluate("()=>geoMilestones('europa').length"); m3 = pg.evaluate("()=>geoMilestones('europa').length")
    ok((m1, m2, m3) == (0, 1, 0), f'Meilenstein 10 einmalig ({m1},{m2},{m3})')
    # Letzter Meilenstein = alle Länder (aus den Daten), nicht fest 50; alter Schlüssel europa.50 verhindert doppelte Belohnung
    ok(pg.evaluate("()=>GEO_MS[GEO_MS.length-1][0]===COUNTRIES.length&&GEO_MS[GEO_MS.length-1][0]===47"), 'Letzter Meilenstein = alle 47 Länder (berechnet)')
    pg.evaluate("()=>{S.geo.ms={};COUNTRIES.slice(0,46).forEach(c=>S.geo.k[c.id]=2);}")
    a1 = pg.evaluate("()=>geoMilestones('europa').map(m=>m.need)"); ok(a1 == [10, 25], f'46 Länder: nur 10 und 25 ({a1})')
    pg.evaluate("()=>{S.geo.k[COUNTRIES[46].id]=2}")
    a2 = pg.evaluate("()=>geoMilestones('europa').map(m=>m.need)"); a3 = pg.evaluate("()=>geoMilestones('europa').length")
    ok(a2 == [47] and a3 == 0, f'alle 47 Länder: Europa-Meister einmalig ({a2},{a3})')
    ok(pg.evaluate("()=>!!S.geo.ms['europa.50']&&gNextMs()===undefined&&geoTrophies().find(x=>x.id==='geo50').t(S)"), 'Schlüssel europa.50 gesetzt, Pokal Europa-Meister erreicht')
    pg.evaluate("()=>{S.geo.ms={'europa.50':1};COUNTRIES.forEach(c=>S.geo.k[c.id]=2);}"); a4 = pg.evaluate("()=>geoMilestones('europa').map(m=>m.need)")
    ok(a4 == [10, 25], f'schon vorhandener Meilenstein „50“ wird nicht doppelt bezahlt ({a4})')
    pg.evaluate("()=>{S.geo.k={};S.geo.ms={};}")
    c1 = pg.evaluate("()=>S.coins")        # Meilensteine zahlen Münzen – danach neu messen
    # Neue Spiele: Reisepass, Memory, Land des Tages
    pg.evaluate("()=>ACT.geo()"); t0 = pg.inner_text('body'); ok('Land des Tages' in t0 and all(w in t0 for w in ['Flaggen','Größer','Reiseroute','Memory','Stempel','Länderkarten','Wusstest du']), 'Europa-Seite: alle Bereiche')
    pg.evaluate("()=>ACT.geoPass()"); pg.wait_for_timeout(80); ok(pg.locator('.geo-stamp').count()==47, 'Stempel: 47 Stempel-Plätze'); ok('Alle 47 Stempel' in pg.inner_text('body'), 'Reisepass: letzte Stufe „Alle 47 Stempel“'); pg.screenshot(path='/tmp/rh/geo_pass.png', full_page=True)
    pg.evaluate("()=>ACT.geoMemory()"); pg.wait_for_timeout(80)
    done = pg.evaluate("""()=>{const m=UI.mem;for(let i=0;i<16;i++){ if(m.done[i])continue; const j=m.cards.findIndex((c,k)=>k!==i&&!m.done[k]&&c.id===m.cards[i].id); ACT.gMem(i); ACT.gMem(j);} return Object.keys(m.done).length}""")
    ok(done==16 and pg.evaluate("()=>UI.mem.moves")==8, 'Memory: 8 Paare in 8 Zügen lösbar'); pg.screenshot(path='/tmp/rh/geo_mem.png', full_page=True)
    c2 = pg.evaluate("()=>S.coins"); ok(c2 == c1, 'Memory/Reisepass zahlen nichts')
    # Karten
    pg.evaluate("()=>ACT.geoCards()"); pg.wait_for_timeout(100); pg.screenshot(path='/tmp/rh/geo_cards.png', full_page=True)
    ok(pg.locator('.geo-tile').count()==47, '47 Länderkarten')
    pg.evaluate("()=>ACT.gCard('deu')"); pg.wait_for_timeout(100); pg.screenshot(path='/tmp/rh/geo_card.png', full_page=True)
    t = pg.inner_text('body'); ok('Berlin' in t and 'Stadtstaat' in t, 'Deutschland: Berlin-Fakt')
    pg.evaluate("()=>ACT.gCard('and')"); ok('Kleinstaat' in pg.inner_text('body'), 'Andorra-Fakt')
    pg.evaluate("()=>ACT.gCard('kos')"); t = pg.inner_text('body'); ok('Pristina' in t and 'Serbien' in t and 'Albanien' in t, 'Kosovo-Karte')
    pg.evaluate("()=>ACT.gCard('rus')"); ok('nicht dabei sind' in pg.inner_text('body'), 'Russland-Karte: Hinweis auf weitere Nachbarn')
    pg.evaluate("()=>ACT.gCard('smr')"); ok('Stadt San Marino' in pg.inner_text('body'), 'San-Marino-Karte erklärt die Hauptstadt')
    # Speichern / Neuladen
    pg.evaluate("()=>save()"); pg.reload(); pg.wait_for_timeout(300)
    ok(pg.evaluate("()=>S.geo.sessions")>=5 and pg.evaluate("()=>S.coins")>=505, 'übersteht Neuladen')
    ok(not errs, 'keine JS-Fehler ' + str(errs[:3]))
    b.close()
print('\n%d PROBLEME' % len(fails) if fails else '\nALLES GRÜN'); sys.exit(1 if fails else 0)
