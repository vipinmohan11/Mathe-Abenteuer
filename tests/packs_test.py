"""Länder-Pakete, Reise-Ticket, Wunsch-Ticket, Auswahlmenü, Name statt Fino, Lustige Fakten (schrittweise), Home-Knopf, Marke.
Aufruf: python3 packs_test.py /abs/pfad/Mathe-Abenteuer_Klasse4.html"""
import sys, re
from playwright.sync_api import sync_playwright
html = sys.argv[1]; fails = []
def ok(c, m):
    print(('OK   ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 900}); errs = []
    pg.add_init_script('window.__rwOff=1')   # Belohnungs-Fenster nur im eigenen Test
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + html); pg.wait_for_timeout(300)
    E = pg.evaluate
    # ---- Pakete
    ok(E("()=>WORDER.length") == 23 and E("()=>wList().length") == 23, '23 Länder (3 + 20 neue)')
    bad = E("""()=>{const out=[];const pink=h=>{const m=/^#([0-9a-f]{6})$/i.exec(h);if(!m)return false;const n=parseInt(m[1],16),r=n>>16,g=(n>>8)&255,b=n&255,mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(mx-mn<40)return false;let h2;if(mx===r)h2=((g-b)/(mx-mn)+6)%6*60;else if(mx===g)h2=((b-r)/(mx-mn)+2)*60;else h2=((r-g)/(mx-mn)+4)*60;return h2>=300&&h2<=345&&(mx-mn)/mx>.18&&mx>170};
      WORDER.forEach(id=>{const p=WP[id];const e=(m)=>out.push(id+': '+m);
        if(!p)return e('fehlt');
        if(!p.name||!p.cont||typeof p.cost!=='number'||!p.speech||!p.guide||!p.guide.svg||!p.hero||!p.welcome||!p.story)e('Felder');
        if(!W_CONT.includes(p.cont))e('Kontinent '+p.cont);
        for(const st of ['arrival','places','life','language','food']){const d=p.st[st];if(!d||!d.title||!d.lead||!d.guide)e('Station '+st)}
        if(p.st.arrival.items.length!==6||p.st.life.items.length!==6)e('items');
        if(p.st.places.cards.length!==4||p.st.food.cards.length!==4)e('cards');
        if(p.st.language.words.length!==10)e('words');
        p.st.language.words.forEach(w=>{if(w.length<4||!w[0]||!w[2]||!w[3])e('Wort '+w[0])});
        [...p.st.places.cards,...p.st.food.cards].forEach(c=>{if(!W_ART[c[0]])e('Art '+c[0])});
        [...p.st.arrival.items,...p.st.life.items].forEach(i=>{if(!W_INFO[i[0]])e('Icon '+i[0])});
        if(p.quiz.length!==4)e('Quiz');p.quiz.forEach(q=>{if(!q.q||!q.ok||q.bad.length!==2||q.bad.includes(q.ok)||q.bad[0]===q.bad[1])e('Frage '+q.q)});
        for(const st of ['arrival','places','life','language','food','quiz']){const s=p.souv[st];if(!s||!s.n||!W_SV[s.k])e('Souvenir '+st)}
        if(!FLAGS[id]||!wFlag(id).includes('<rect')&&!wFlag(id).includes('<path'))e('Flagge');
        if(!WP_ISO[id]||!WP_AP[id])e('Codes');
        const all=JSON.stringify(p)+(FLAGS[id]?'':'');(all.match(/#[0-9a-fA-F]{6}/g)||[]).forEach(h=>{if(pink(h))out.push(id+': rosa '+h)});
        const art=[...p.st.places.cards,...p.st.food.cards].map(c=>W_ART[c[0]]||'').join('');(art.match(/#[0-9a-fA-F]{6}/g)||[]).forEach(h=>{if(pink(h))out.push(id+': Art rosa '+h)});
      });return out}""")
    ok(not bad, 'Alle Pakete vollständig, keine rosa Farben %s' % bad[:6])
    names = E("()=>WORDER.map(id=>WP[id].name)")
    ok(len(set(names)) == 23, 'Namen eindeutig')
    cnt = {}
    for n in E("()=>WORDER.map(id=>WP[id].cont)"): cnt[n] = cnt.get(n, 0) + 1
    ok(len(cnt) >= 6, 'Kontinente: %s' % cnt)
    # alle Stationen jedes Landes rendern
    r = E("""()=>{const out=[];WORDER.forEach(id=>{wS().open[id]=ymd();['arrival','places','life','language','food','quiz'].forEach(st=>{try{UI.wId=id;UI.wSt=st;UI.wQz=null;go('weltReise');const t=document.getElementById('app').innerText;if(t.length<80||/undefined|NaN|\\[object/.test(t))out.push(id+':'+st)}catch(e){out.push(id+':'+st+':'+e.message)}})});return out}""")
    ok(not r, 'Alle 23 × 6 Stationen rendern %s' % r[:5])
    # ---- Auswahlmenü
    E("()=>{S.starsLife=60;S.stars=60;S.daily.n=25;wS().open={};wS().spent=0;go('home');go('rewards');go('welt')}"); pg.wait_for_timeout(150)
    ok(pg.locator('#wDest').count() == 1 and pg.locator('#wDest option').count() == 23, 'Auswahlmenü mit 23 Zielen')
    ok(pg.locator('#wDest optgroup').count() == 2, 'Menü: „Meine Reisen“ und „Noch gesperrt“')
    pg.select_option('#wDest', 'fra'); pg.click('[data-act=wGoDest]'); pg.wait_for_timeout(200)
    ok(pg.locator('#modal').count() == 1 and 'Frankreich' in pg.inner_text('#modal'), 'Gesperrtes Land im Menü → Frage zum Öffnen')
    E("()=>closeModal()")
    pg.select_option('#wDest', 'deu'); pg.click('[data-act=wGoDest]'); pg.wait_for_timeout(2300)
    ok(E("()=>view") == 'weltReise' and E("()=>UI.wId") == 'deu', 'Offenes Land im Menü → Reise startet')
    # ---- Reise-Ticket
    E("()=>{S.coins=1000;S.stats.bought=0;S.daily.shopSec=0;S.cfg.shopMin=0;wS().open={};wS().tix=[];save();UI.shopGrp='reisen';go('home');go('shop')}"); pg.wait_for_timeout(150)
    ok(pg.locator('.w-ticket').count() == 2, 'Shop → Reisen: zwei Tickets')
    c0 = E("()=>S.coins"); sp0 = E("()=>wS().spent"); st0 = E("()=>S.starsLife")
    E("()=>{S.daily.wpk='schon';wS().picks=0}")                                   # die freie Wahl von heute ist schon genutzt
    pg.click('[data-act=wTixNext]'); pg.wait_for_timeout(150); pg.click('#modal [data-act=wTixNextYes]'); pg.wait_for_timeout(300)
    ok(E("()=>wS().picks") == 1 and E("()=>S.coins") == c0 - 250 and E("()=>view") == 'welt', 'Reise-Ticket: eine freie Wahl, 250 Münzen bezahlt, weiter zur Abflughalle')
    ok(E("()=>wS().spent") == sp0 and E("()=>S.starsLife") == st0, 'Reise-Ticket kostet keine Sterne')
    E("()=>ACT.wLock('kor')"); ok('frei wählen' in pg.inner_text('#modal'), 'Ticket: beliebiges Land (Südkorea) wählbar – keine feste Reihenfolge')
    E("()=>ACT.wPickYes('kor')"); pg.wait_for_timeout(150); E("()=>UI.wFlightEnd&&UI.wFlightEnd()"); pg.wait_for_timeout(150)
    ok(E("()=>WA.isOpen('kor')") and E("()=>wS().picks") == 0 and not E("()=>WA.isOpen('fra')"), 'Südkorea offen, Ticket verbraucht, sonst nichts geöffnet')
    E("()=>{S.coins=100;UI.shopGrp='reisen';go('shop')}"); pg.wait_for_timeout(100)
    pg.click('[data-act=wTixNext]'); pg.wait_for_timeout(100)
    ok('fehlen' in pg.inner_text('#modal') and E("()=>S.coins") == 100 and E("()=>wS().picks") == 0, 'Zu wenig Münzen: nichts passiert')
    E("()=>closeModal()")
    # ---- Wunsch-Ticket: vorhandenes Land
    E("()=>{S.coins=1000;UI.shopGrp='reisen';go('shop')}"); pg.wait_for_timeout(100)
    pg.select_option('#wxSel', 'fra'); pg.click('[data-act=wTixWish]'); pg.wait_for_timeout(120)
    ok('Frankreich' in pg.inner_text('#modal'), 'Wunsch-Ticket Frankreich: Rückfrage')
    pg.click('#modal [data-act=wTixWishYes]'); pg.wait_for_timeout(2300)
    ok(E("()=>WA.isOpen('fra')") and E("()=>S.coins") == 500, 'Wunsch-Ticket (vorhandenes Land): sofort offen, 500 Münzen')
    # ---- Wunsch-Ticket: schon geöffnetes Land kostet nichts
    E("()=>{UI.wxSel='';UI.wxTxt='Frankreich';UI.shopGrp='reisen';go('shop')}"); pg.wait_for_timeout(100)
    pg.click('[data-act=wTixWish]'); pg.wait_for_timeout(100)
    ok('schon' in pg.inner_text('#modal').lower() and E("()=>S.coins") == 500, 'Schon geöffnetes Land: kein Kauf')
    E("()=>closeModal()")
    # ---- Wunsch-Ticket: Land, das es noch nicht gibt
    E("()=>{UI.wxSel='';UI.wxTxt='Norwegen';UI.shopGrp='reisen';go('shop')}"); pg.wait_for_timeout(100)
    pg.click('[data-act=wTixWish]'); pg.wait_for_timeout(100)
    ok('Norwegen' in pg.inner_text('#modal') and 'noch nicht' in pg.inner_text('#modal'), 'Unbekanntes Land: Hinweis „kommt später“')
    pg.click('#modal [data-act=wTixWishYes]'); pg.wait_for_timeout(250)
    ok(E("()=>S.coins") == 0 and E("()=>WA.pending().length") == 1 and 'Norwegen' in pg.inner_text('#app'), 'Wunsch gemerkt (500 Münzen), sichtbar im Shop')
    # Update simulieren: Land erscheint → öffnet sich von selbst
    E("()=>{WP.nor={id:'nor',name:'Norwegen',cont:'Europa',cost:6,sub:'x',speech:'nb-NO',guide:WP.fra.guide,hero:'',welcome:'',story:'',st:WP.fra.st,quiz:WP.fra.quiz,souv:WP.fra.souv};WORDER.push('nor');checkUnlocks()}")
    ok(E("()=>WA.isOpen('nor')") and E("()=>WA.pending().length") == 0, 'Später verfügbares Wunschland öffnet sich automatisch')
    # Eltern sehen die Wünsche
    E("()=>go('weltEltern')"); pg.wait_for_timeout(100)
    ok('Norwegen' in pg.inner_text('#app'), 'Eltern-Seite listet Wünsche')
    # Zuordnung
    ok(E("()=>[WA.match('Süd-Korea')==='kor',WA.match('südkorea')==='kor',WA.match('USA')==='usa',WA.match('holland')==='nld',WA.match('Vereinigtes Königreich')==='gbr',WA.match('Atlantis')===null].every(Boolean)"), 'Namenszuordnung (Umlaute, Bindestriche, Alias)')
    # ---- Name statt Fino
    E("()=>{S.name='';S.finoName='';save();go('home')}"); pg.wait_for_timeout(100)
    ok('Fino' in pg.inner_text('#app'), 'Ohne Namen bleibt „Fino“ sichtbar')
    E("()=>{go('profile')}"); pg.wait_for_timeout(100)
    pg.fill('#nameIn', 'Alex'); pg.evaluate("()=>ACT.rhSaveName()"); pg.wait_for_timeout(200)
    ok(E("()=>FN()") == 'Alex' and 'Alex' in pg.inner_text('#app') and 'Fino' not in pg.inner_text('#app'), 'Profil: Name gespeichert → überall statt Fino')
    for v in ['home', 'rewards', 'welt', 'story', 'shop', 'hefte', 'avatar', 'geo']:
        E("(v)=>{go('home');go(v)}", v); pg.wait_for_timeout(120)
        t = pg.inner_text('#app')
        ok('Fino' not in t, 'Kein „Fino“ mehr auf: ' + v)
    E("()=>{go('home');go('kreativhefte')}"); pg.wait_for_timeout(100)
    ok('Alex’ Geschichte' in pg.inner_text('#app') or 'Alexʼ Geschichte' in pg.inner_text('#app'), 'Besitzform: „Alex’ Geschichte“')
    E("()=>{S.name='Mira';save();go('home')}"); pg.wait_for_timeout(100)
    ok('Fino' not in pg.inner_text('#app') and 'Mira' in pg.inner_text('#app'), 'Name ändern wirkt sofort')
    E("()=>{S.name='';save()}")
    # ---- Lustige Fakten
    ok(E("()=>FACTS.length") >= 85, 'Mehr Fakten (%d)' % E("()=>FACTS.length"))
    E("()=>{S.facts={i:0,seen:{}};save()}")
    ok(E("()=>factsOpen()") == 29, 'Start: die bisherigen 29 sind frei')
    E("()=>{S.facts.start=ymd();go('home');go('rewards')}")
    E("()=>{const d=new Date();d.setDate(d.getDate()-15);S.facts.start=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}")
    ok(E("()=>factsOpen()") == 29 + 7 * 2, 'Nach 15 Tagen: zwei Päckchen mehr (%d)' % E("()=>factsOpen()"))
    E("()=>{S.facts={i:0,seen:{},start:ymd()};for(let i=0;i<29;i++)S.facts.seen[i]=1;save();go('home');go('rewards')}")
    E("()=>ACT.fakten()"); pg.wait_for_timeout(100)
    ok(E("()=>factsOpen()") == 36 and 'Neue Fakten sind da' in pg.inner_text('#app'), 'Alles gelesen → früher ein neues Päckchen (+7)')
    ok(not re.search(r'\bFakt \d+ von \d+\b|\b\d+ von \d+ Fakten|\b\d+ Fakten\b', pg.inner_text('#app')), 'Keine Fakten-Anzahl sichtbar')
    E("()=>{for(let i=0;i<36;i++)S.facts.seen[i]=1;go('rewards')}"); pg.wait_for_timeout(100)
    E("()=>ACT.fakten()"); pg.wait_for_timeout(100)
    ok(E("()=>factsOpen()") == 36, 'Am selben Tag nur ein früheres Päckchen')
    E("()=>ACT.schatz()"); pg.wait_for_timeout(100)
    ok(not re.search(r'Fakten\s*\d', pg.inner_text('.sk-seg')), 'Filter „Fakten“ ohne Zahl')
    # ---- Home-Knopf und Marke
    E("()=>{go('home')}"); pg.wait_for_timeout(100)
    ok(pg.locator('.dz-brand').count() >= 1 and 'Denkzauber' in pg.inner_text('#app'), 'Start zeigt „Denkzauber“')
    E("()=>{go('home');go('rewards');go('shop')}"); pg.wait_for_timeout(100)
    ok(pg.locator('.top .dz-home .dz-home-art').count() == 1 and pg.locator('.dz-home').inner_text().strip() == 'Start', 'Home-Knopf mit Haus-Bild und „Start“')
    pg.click('.top .dz-home'); pg.wait_for_timeout(120)
    ok(E("()=>view") == 'home', 'Home-Knopf führt zum Start')
    for vw in (390, 800, 1280):
        pg.set_viewport_size({'width': vw, 'height': 800})
        for v in ['home', 'welt', 'shop', 'schatz', 'kopf', 'kreativhefte']:
            E("(v)=>{go('home');go('rewards');go(v)}", v); pg.wait_for_timeout(100)
            ok(E("()=>document.documentElement.scrollWidth<=innerWidth+1"), 'Kein Seitwärts-Scrollen %s @%d' % (v, vw))
    ok(not errs, 'Keine Konsolenfehler %s' % errs[:3])
print('\nFAILS:', fails)
sys.exit(1 if fails else 0)
