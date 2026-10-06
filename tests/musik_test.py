"""Musik-Werkstatt: Katalog, Sperre, Muster, Autosave, Beats, Scheduler, Verlassen (Playwright/Chromium).
Aufruf:  python3 build.py --out /tmp/musik_build && python3 tests/musik_test.py [/tmp/musik_build/Mathe-Abenteuer_Klasse4.html]"""
import sys, json, os
from playwright.sync_api import sync_playwright
URL = 'file://' + (sys.argv[1] if len(sys.argv) > 1 else '/tmp/musik_build/Mathe-Abenteuer_Klasse4.html')
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(URL); E = pg.evaluate
    A = 'window.__app.'
    # ---- Katalog
    r = E("""()=>{const a=window.__app,C=a.CATALOG;const all=Object.values(C).filter(i=>/^m[sckx]\\./.test(i.id));const sh=all.filter(i=>i.src.t==='shop');
      const cnt=k=>all.filter(i=>i.kind===k).length;
      return {n:all.length,ms:cnt('msound'),mc:cnt('mscale'),mk:cnt('mkit'),mx:cnt('mfx'),free:all.filter(i=>i.src.t==='free').map(i=>i.id),mile:all.filter(i=>i.src.t==='milestone').length,
        min:Math.min(...sh.map(i=>i.src.price)),max:Math.max(...sh.map(i=>i.src.price)),grp:all.every(i=>a.KIND[i.kind].group==='musik'),
        drums:all.filter(i=>i.role==='d').length,bass:all.filter(i=>i.role==='b').length,mel:all.filter(i=>i.role==='m').length,
        syn:all.filter(i=>i.kind==='msound').every(i=>MU_SYN[i.syn]),uniq:new Set(all.map(i=>i.id)).size===all.length,feat:a.FEATS?a.FEATS.musik.creative:null}}""")
    print(r)
    ok(20 <= r['n'] <= 26, 'Katalog 20-26 Dinge (%d)' % r['n'])
    ok(r['drums'] == 6 and r['bass'] == 4 and r['mel'] == 2, 'Klänge: 6 Schlag, 4 Bass, 2 Melodie')
    ok(r['free'] == ['ms.kick', 'mc.dpent', 'mk.normal'], 'Nur das Allernötigste gratis: ' + str(r['free']))
    ok(15 <= r['min'] <= 30 and r['max'] <= 250, 'Preise %d-%d' % (r['min'], r['max']))
    ok(r['grp'] and r['syn'] and r['uniq'], 'Gruppe musik, Synth-Rezepte, eindeutige IDs')
    # ---- Sperre ohne Kreativzeit
    E("()=>{S.cfg.creativeMode='after';S.daily.cr={left:0,used:0,grants:0};render();ACT.musik()}"); pg.wait_for_timeout(200)
    ok(pg.locator('.lockscr').count() == 1 and pg.locator('.mu-pad').count() == 0, 'Ohne Kreativzeit: Sperrbildschirm, keine Werkstatt')
    E("()=>{S.cfg.creativeMode='always';S.daily.n=25;render()}"); pg.wait_for_timeout(200)
    # ---- Start: ein Klang, 8 Schritte
    ok(pg.locator('.mu-lane[data-lane]').count() == 1 and pg.locator('.mu-pad').count() == 8, 'Start: 1 Spur, 8 Pads')
    ok(E("()=>S.songs.length")==0 and not E("()=>muHasNotes()"), 'Kein fertiger Beat vorhanden')
    ok(pg.locator('.mu-pad').first.bounding_box()['height'] >= 44 and pg.locator('.mu-pad').first.bounding_box()['width'] >= 44, 'Pads >= 44 px')
    ok(pg.locator('.itile.lk').count() >= 15, 'Gesperrtes sichtbar grau in Meine Klänge (%d)' % pg.locator('.itile.lk').count())
    ok(pg.locator('.itile.lk .tag.pr').count() >= 15, 'Gesperrte zeigen Preis')
    ok(not pg.locator('.mu-seg').count() and pg.locator('#muSwing').count() == 0, 'Keine Extras ohne Kauf (Schritte/Takte/Swing)')
    # gesperrte Kachel -> Shop
    pg.locator('.itile.lk[data-act="shopAt"]').first.click(); pg.wait_for_timeout(200); ok(E("()=>view")=='shop', 'Antippen eines gesperrten Klangs führt zum Shop')
    E("()=>ACT.musik()"); pg.wait_for_timeout(200)
    # ---- Pads
    pad = pg.locator('.mu-pad[data-r="d0"][data-s="1"]'); pad.click(); pg.wait_for_timeout(50)
    ok(E("()=>MU.rows.d0.steps[1]")==1 and 'on' in pad.get_attribute('class'), 'Tippen schaltet EIN')
    pad.click(); ok(E("()=>MU.rows.d0.steps[1]")==0, 'zweites Tippen schaltet AUS')
    bb = pg.locator('.mu-pad[data-s="0"]').bounding_box(); bb2 = pg.locator('.mu-pad[data-s="7"]').bounding_box()
    pg.mouse.move(bb['x']+10, bb['y']+10); pg.mouse.down(); pg.mouse.move(bb2['x']+10, bb2['y']+10, steps=14); pg.mouse.up(); pg.wait_for_timeout(50)
    ok(E("()=>MU.rows.d0.steps.slice(0,8).join('')")=='11111111', 'Wischen malt Pads')
    # ---- Autosave
    pg.wait_for_timeout(800)
    ok(E("()=>S.mus&&S.mus.rows&&S.mus.rows[0].steps")=='11111111', 'Autosave in S.mus: ' + str(E("()=>S.mus&&S.mus.rows&&S.mus.rows[0].steps")))
    pg.reload(); pg.wait_for_timeout(500); E("()=>{S.cfg.creativeMode='always';ACT.musik()}"); pg.wait_for_timeout(300)
    ok(pg.locator('.mu-pad.on').count() == 8, 'Muster überlebt Neuladen')
    # ---- Spielen / Stoppen / Verlassen
    E("()=>{S.cfg.sound=true}"); pg.locator('#muPlay').click(); pg.wait_for_timeout(500)
    st = E("()=>({p:ENG.playing,t:!!ENG.timer,ph:document.querySelectorAll('.mu-pad.ph').length})"); ok(st['p'] and st['t'] and st['ph'] > 0, 'Play startet, Abspielkopf sichtbar')
    E("()=>{const s=document.querySelector('#muBpm');s.value=140;s.dispatchEvent(new Event('input',{bubbles:true}))}"); ok(E("()=>MU.bpm")==140, 'Tempo live')
    pg.locator('#muPlay').click(); ok(not E("()=>ENG.playing") and E("()=>ENG.timer")==0, 'Stopp räumt auf')
    pg.locator('#muPlay').click(); pg.wait_for_timeout(200); E("()=>go('home')"); pg.wait_for_timeout(250)
    ok(not E("()=>ENG.playing") and E("()=>ENG.timer")==0 and E("()=>ENG.raf")==0 and E("()=>ENG.sess")is None, 'leave(): Timer, rAF, Sitzung weg')
    pg.wait_for_timeout(600); ok(E("()=>ENG.watch")==0 and E("()=>ENG.prev")is None, 'Wächter/Vorschau entsorgt')
    # Kreativzeit endet -> Wiedergabe stoppt
    E("()=>{ACT.musik()}"); pg.wait_for_timeout(200); pg.locator('#muPlay').click(); pg.wait_for_timeout(200); E("()=>{leaveHook('musik')}"); ok(not E("()=>ENG.playing"), 'leaveHook stoppt Wiedergabe')
    # ---- Verdienen: Käufe schalten Dinge frei
    E("()=>{S.coins=2000;ACT.musik()}"); pg.wait_for_timeout(200)
    for i in ['ms.snare', 'ms.hat', 'mx.s16', 'mx.bar2', 'mx.swing', 'mx.d2', 'mc.mpent', 'mc.dur', 'ms.bsub', 'ms.bell', 'mk.retro']:
        E("(i)=>{S.cfg.shopMin=0;buyItem(i)}", i)
    E("()=>render()"); pg.wait_for_timeout(200)
    ok(pg.locator('.mu-lane[data-lane]').count() == 4, 'Spuren erscheinen (Schlag, Schlag 2, Bass, Melodie)')
    ok(pg.locator('.mu-seg').count() == 2 and pg.locator('#muSwing').count() == 1, 'Schritte/Takte/Swing erscheinen')
    E("()=>ACT.muSteps('16')"); ok(E("()=>muN()")==16 and pg.locator('.mu-pad[data-r=\"d0\"]').count()==16, '16 Schritte')
    E("()=>ACT.muBars('2')"); pg.wait_for_timeout(100); ok(E("()=>muN()")==32 and pg.locator('.mu-pages button').count()==2, '2 Takte: Seiten-Umschalter')
    E("()=>{ACT.muBars('1');ACT.muSteps('8')}")
    E("()=>ACT.muSound('ms.snare')"); ok(E("()=>MU.rows.d0.inst")=='ms.snare', 'Klang der gewählten Spur zuweisen')
    E("()=>ACT.muSound('ms.bsub')"); ok(E("()=>MU.rows.b.inst")=='ms.bsub', 'Bass-Klang landet in Bass-Spur')
    E("()=>ACT.muScale('mc.dur')"); ok(pg.locator('.mu-lane[data-lane=\"m\"] .mu-row').count()==7, 'Ganze Leiter: 7 Tonreihen')
    E("()=>ACT.muScale('mc.dpent')"); ok(pg.locator('.mu-lane[data-lane=\"m\"] .mu-row').count()==5, 'Pentatonik: 5 Tonreihen')
    E("()=>ACT.muKit('mk.retro')"); ok(E("()=>MU.kit")=='mk.retro', 'Klang-Set wählen')
    pg.locator('.mu-pad[data-r="m"][data-s="2"][data-p="3"]').click(); pg.locator('.mu-pad[data-r="m"][data-s="2"][data-p="1"]').click()
    ok(E("()=>MU.rows.m.steps[2]")==1 and pg.locator('.mu-pad.on[data-r="m"][data-s="2"]').count()==1, 'Melodie einstimmig, Note ersetzt alte')
    # ---- Klang: jedes Instrument und Set rendern
    r = E("""async()=>{const out=[];for(const it of Object.values(window.__app.CATALOG).filter(i=>i.kind==='msound')){const oc=new OfflineAudioContext(1,22050,22050);const g=oc.createGain();g.connect(oc.destination);voice(it,it.role==='b'?40:64,.01,1,oc,g);const b=await oc.startRendering();let pk=0,nan=false;for(const v of b.getChannelData(0)){if(!isFinite(v))nan=true;pk=Math.max(pk,Math.abs(v))}out.push([it.id,+pk.toFixed(3),nan])}return out}""")
    weak = [x for x in r if x[1] < .02 or x[1] > 1.6 or x[2]]; ok(not weak, 'alle Klänge hörbar, ohne NaN/Übersteuern ' + str(weak))
    r = E("""async()=>{const out=[];for(const k of Object.values(window.__app.CATALOG).filter(i=>i.kind==='mkit')){const oc=new OfflineAudioContext(2,22050,22050);const s=muSession(oc,k.id,oc.destination);voice('ms.snare',0,.01,1,oc,s.bus);const b=await oc.startRendering();let pk=0;for(const v of b.getChannelData(0))pk=Math.max(pk,Math.abs(v));out.push([k.id,+pk.toFixed(3)])}return out}""")
    ok(all(x[1] > .005 for x in r), 'alle Klang-Sets erzeugen Ton ' + str(r))
    # ---- Scheduler
    r = E("""()=>{let now=0,bpm=120,sw=0,dv=4,ev=[];const s=muMakeSched({now:()=>now,look:.12,bpm:()=>bpm,div:()=>dv,swing:()=>sw,steps:()=>16,step:(i,t)=>ev.push([i,t])});
      s.start(.06);for(let k=0;k<400;k++){now=k*.025;s.tick()}
      const sd=.125;const exact=ev.every(([i,t],k)=>Math.abs(t-(.06+k*sd))<1e-9),wrap=ev.every(([i],k)=>i===k%16);
      ev=[];dv=2;s.start(0);now=0;for(let k=0;k<100;k++){now=k*.025;s.tick()};const g8=ev[1][1]-ev[0][1];
      ev=[];dv=4;sw=100;s.start(.06);now=0;for(let k=0;k<100;k++){now=k*.025;s.tick()}
      const odd=ev.every(([i,t],n)=>i%2===0||Math.abs(t-(.06+n*sd+.5*sd))<1e-9);
      return {exact,wrap,g8,odd}}""")
    ok(r['exact'] and r['wrap'], 'Scheduler: exakte Zeiten'); ok(abs(r['g8']-.25) < 1e-9, '8 Schritte = Achtel (Abstand .25 s bei 120)'); ok(r['odd'], 'Swing verschiebt ungerade Schritte')
    # ---- Meine Beats
    E("()=>{S.songs=[];S.trophies={};muSaveSong('');}"); ok(E("()=>S.songs.length")==1 and E("()=>S.songs[0].name")=='Mein Beat 1', 'Speichern mit Standardname')
    pg.locator('.mu-save').click(); pg.wait_for_timeout(150); ok(pg.locator('#muNameIn').count()==1, 'Speichern-Dialog')
    pg.fill('#muNameIn', 'Test <b>'); pg.press('#muNameIn', 'Enter'); pg.wait_for_timeout(200)
    ok(E("()=>S.songs.length")==1 and E("()=>S.songs[0].name")=='Test <b>', 'Enter überschreibt denselben Beat')
    pg.locator('.mu-save').click(); pg.locator('[data-act="muSaveCopy"]').click(); pg.wait_for_timeout(100); ok(E("()=>S.songs.length")==2, 'Als neuen Beat')
    s = E("()=>S.songs[0]"); ok(set(s) >= {'id','name','bpm','swing','sp','bars','kit','scale','rows','ts'} and len(json.dumps(s)) < 900, 'Song-Format kompakt (%d B)' % len(json.dumps(s)))
    E("()=>ACT.muSongs()"); pg.wait_for_timeout(200); ok(pg.locator('.mu-song').count()==2, 'Liste Meine Beats')
    id0 = E("()=>S.songs[0].id")
    E("(id)=>ACT.muPlaySong(id)", id0); pg.wait_for_timeout(400); ok(E("()=>ENG.playing&&ENG.songId")==id0, 'Beat abspielen')
    E("()=>MU.dirty=false"); E("(id)=>ACT.muLoad(id)", id0); pg.wait_for_timeout(200); ok(E("()=>view")=='musik' and E("()=>MU.editId")==id0 and not E("()=>ENG.playing"), 'Laden öffnet Werkstatt, stoppt Wiedergabe')
    E("()=>ACT.muSongs()"); E("(id)=>ACT.muDel(id)", id0); ok(pg.locator('#modal').count()==1, 'Löschen fragt nach'); E("(id)=>ACT.muDelYes(id)", id0); ok(E("()=>S.songs.length")==1, 'Löschen')
    # Meilenstein
    E("()=>{S.unl={};S.stamps={a:1,b:1};muCheck()}"); ok(E("()=>hasItem('ms.wood')"), 'Meilenstein: 2 Stempel schenken Holzblock')
    json.loads(E("()=>JSON.stringify(S)")); ok(True, 'S bleibt JSON-serialisierbar')
    ok(os.path.getsize(os.path.join(os.path.dirname(__file__), '..', 'src', 'feat_musik.js')) < 40*1024, 'feat_musik.js klein')
    ok(not errs, 'keine Konsolenfehler ' + str(errs))
    b.close()
print('\nFEHLER:' if fails else '\nALLE TESTS BESTANDEN', fails or '')
sys.exit(1 if fails else 0)
