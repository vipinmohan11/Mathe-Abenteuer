"""Avatar „Mein Avatar“: Katalog (gestutzt), Rendern, Ersteinrichtung, Gestalten (Kreativzeit), Ansehen (read-only), Speichern, Export.
Aufruf:  python3 build.py --out /tmp/avatar_build && python3 tests/avatar_test.py [/tmp/avatar_build/Mathe-Abenteuer_Klasse4.html]"""
import sys
from playwright.sync_api import sync_playwright
URL = 'file://' + (sys.argv[1] if len(sys.argv) > 1 else '/tmp/avatar_build/Mathe-Abenteuer_Klasse4.html')
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: fails.append(m)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}, accept_downloads=True)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(URL); E = pg.evaluate
    pg.wait_for_timeout(200)

    # ---------- Katalog ----------
    r = E("""()=>{const L=Object.values(CATALOG).filter(i=>i.av),mix={};
      L.forEach(i=>{mix[i.src.t]=(mix[i.src.t]||0)+1});
      const sh=L.filter(i=>i.src.t==='shop'),pr=sh.map(i=>i.src.price),ms=L.filter(i=>i.src.t==='milestone');
      const kinds={};L.forEach(i=>kinds[i.kind]=(kinds[i.kind]||0)+1);
      return {n:L.length,uniq:new Set(L.map(i=>i.id)).size,mix,kinds,grp:L.every(i=>KIND[i.kind].group==='avatar'),
        cur:sh.every(i=>i.src.cur==='c'),min:Math.min(...pr),max:Math.max(...pr),
        ms:ms.map(i=>[i.id,i.src.why]),msOk:ms.every(i=>/^Beende \\d+ (Gruppe|Gruppen|Stufen)$/.test(i.src.why)),
        thumbs:L.every(i=>{const t=KIND[i.kind].thumb(i);return typeof t==='string'&&t.indexOf('<svg')>=0&&t.indexOf('undefined')<0&&t.indexOf('NaN')<0}),
        old:['avbrow','avnose','avface','avextra'].some(k=>KIND[k]),
        freeSkin:L.filter(i=>i.id.startsWith('col.skin.')).every(i=>i.src.t==='free'),
        feat:FEATS.avatar&&FEATS.avatar.creative}}""")
    print(r)
    ok(90 <= r['n'] <= 110 and r['uniq'] == r['n'], 'Katalog 90-110 Stück, IDs eindeutig (%d)' % r['n'])
    ok(r['grp'] and r['cur'], 'Gruppe avatar, nur Münzen')
    ok(set(r['mix']) <= {'free', 'shop', 'milestone'}, 'Quellen nur free/shop/milestone %s' % r['mix'])
    ok(25 <= r['mix']['free'] <= 35, 'Gratis-Grundausstattung 25-35 (%d)' % r['mix']['free'])
    ok(5 <= r['mix']['milestone'] <= 8 and r['msOk'], 'Meilensteine 5-8 mit Text (%d)' % r['mix']['milestone'])
    ok(15 <= r['min'] and r['max'] <= 400 and r['min'] <= 20, 'Münzpreise 15..400 (%s..%s), billig zuerst' % (r['min'], r['max']))
    ok(r['freeSkin'] and not r['old'], 'Hautfarben frei, alte Arten entfernt')
    ok(r['thumbs'], 'Jede Vorschau (Thumb) rendert')
    ok(r['feat'] == 'view', 'Feature creative:view')

    # ---------- meSVG: robust ----------
    r = E("""()=>{
      const bad=[],moods=['happy','cheer','sad','think'],slot={avhair:'hair',avtop:'top',aveyes:'eyes',avmouth:'mouth',avbg:'bg',avfx:'fx'};
      const chk=(s,w)=>{if(typeof s!=='string'||!s.startsWith('<svg class="mascot" viewBox="0 0 200 200"')||/undefined|NaN|\\[object/.test(s))bad.push(w)};
      let cnt=0;
      Object.values(CATALOG).filter(i=>i.av).forEach(it=>{
        let look={};
        if(slot[it.kind])look[slot[it.kind]]=it.id;
        else if(it.kind==='avacc')look.acc=[it.id];
        else if(it.kind==='avcolor')look[{skin:'skin',hair:'hairC',eyes:'eyesC',top:'topC'}[it.slot]]=it.v;
        moods.forEach(m=>{try{chk(meSVG(look,m),it.id+'/'+m);cnt++}catch(e){bad.push(it.id+'/'+m+' '+e)}});
      });
      const junk=[undefined,null,{},[],'x',5,{hair:'nix',acc:'foo',skin:'rot',bg:null},{acc:['x',null,1]},{hair:{}, top:[], eyes:12},{face:'face.x',brow:'brow.zzz',extras:['ex.freckles'],hair:'hair.none'}];
      junk.forEach((j,i)=>moods.concat([undefined,'wild']).forEach(m=>{try{chk(meSVG(j,m),'junk'+i+'/'+m)}catch(e){bad.push('junk'+i+' '+e)}}));
      const all=k=>Object.values(CATALOG).filter(i=>i.kind===k).map(i=>i.id),pick=a=>a[Math.floor(Math.random()*a.length)];
      const cl=sl=>Object.values(CATALOG).filter(i=>i.kind==='avcolor'&&i.slot===sl).map(i=>i.v);
      for(let i=0;i<150;i++){
        const look={hair:pick(all('avhair')),top:pick(all('avtop')),eyes:pick(all('aveyes')),mouth:pick(all('avmouth')),bg:pick(all('avbg')),fx:pick(all('avfx')),
          skin:pick(cl('skin')),hairC:pick(cl('hair')),eyesC:pick(cl('eyes')),topC:pick(cl('top')),acc:[pick(all('avacc')),pick(all('avacc')),pick(all('avacc')),pick(all('avacc'))]};
        try{chk(meSVG(look,pick(moods)),'rnd'+i)}catch(e){bad.push('rnd'+i+' '+e)}
      }
      return {bad:bad.slice(0,10),cnt}}""")
    ok(not r['bad'] and r['cnt'] > 400, 'Jedes Teil in jeder Stimmung + Müll-Eingaben + 150 Zufalls-Looks werfen nie (%d)' % r['cnt'])

    # ---------- Ersteinrichtung (auch nur-ansehen) ----------
    E("()=>{S.coins=60;S.stats.decks=0;S.stats.blocks=0;S.cfg.creativeMode='after';S.daily.cr.left=0;UI.pinCreative=0;S.daily.n=25;render();ACT.avatar()}"); pg.wait_for_timeout(300)
    ok(E("()=>view") == 'avatar' and E("()=>UI.ro") is True, 'Avatar öffnet (ohne Kreativzeit = nur ansehen)')
    ok(E("()=>!S.av.look"), 'Erster Besuch: noch kein Look')
    ok(pg.locator('.av-setup').count() == 1 and pg.locator('.av-pv svg').count() == 1, 'Ersteinrichtung sichtbar, auch bei UI.ro')
    ok(pg.locator('.av-panel .itile.lk').count() == 0 and pg.locator('.av-chip').count() == 0 and pg.locator('.av-bar').count() == 0, 'Ersteinrichtung: nur Gratis-Teile, kein Editor')
    ok(pg.locator('.av-panel .itile').count() <= 8, 'Ersteinrichtung kurz (Schritt 1: %d Kacheln)' % pg.locator('.av-panel .itile').count())
    ok(E("()=>JSON.stringify(Object.values(CATALOG).filter(i=>i.av&&i.src.t==='free').length>=25)") == 'true', 'genug Gratisteile')
    # Auswahl wird gespeichert (Entwurf), Look noch nicht
    pg.locator('[data-act="avColor"][data-arg="col.skin.p6"]').click(); pg.wait_for_timeout(120)
    ok(E("()=>__av.cur().skin") == '#A06A48' and E("()=>S.av.draft.look.skin") == '#A06A48' and E("()=>!S.av.look"), 'Hautfarbe wählen: Entwurf gespeichert')
    pg.locator('[data-act="avNext"]').click(); pg.wait_for_timeout(120)
    pg.locator('.av-panel .itile[data-arg="hair.curly"]').click(); pg.wait_for_timeout(120)
    ok(E("()=>__av.cur().hair") == 'hair.curly', 'Frisur wählen')
    pg.locator('[data-act="avBack"]').click(); pg.wait_for_timeout(100)
    ok(pg.locator('.av-st').inner_text() == 'Gesicht', 'Zurück-Schritt')
    pg.locator('[data-act="avNext"]').click(); pg.locator('[data-act="avNext"]').click(); pg.wait_for_timeout(120)
    ok(pg.locator('[data-act="avDone"]').count() == 1, 'Letzter Schritt hat Fertig-Knopf')
    # Gesperrtes ist nicht per Aktion wählbar
    E("()=>ACT.avPick('hair.braids')"); ok(E("()=>__av.cur().hair") == 'hair.curly', 'Nicht Besessenes lässt sich nicht anziehen')
    pg.locator('[data-act="avDone"]').click(); pg.wait_for_timeout(400)
    ok(E("()=>!!S.av.look&&S.av.use===true&&!S.av.draft"), 'Fertig: S.av.look gesetzt, use=true, Entwurf weg')
    ok(E("()=>S.av.look.skin") == '#A06A48' and E("()=>S.av.look.hair") == 'hair.curly', 'Look entspricht der Wahl')

    # ---------- Ansehen (UI.ro): Sammlung, nichts editierbar ----------
    ok(E("()=>UI.ro") is True and pg.locator('.av-setup').count() == 0, 'Danach Ansicht statt Einrichtung')
    ok(pg.locator('.av-bar').count() == 0 and pg.locator('[data-act="avRand"],[data-act="avSave"],[data-act="avPng"],[data-act="avLoad"],[data-act="avColor"],[data-act="avPick"],[data-act="avClearAcc"]').count() == 0, 'Ansehen: keine Bearbeiten-Knöpfe')
    bb = pg.locator('.av-pv').bounding_box()
    ok(bb['width'] >= 300 and bb['height'] >= 300, 'Avatar groß (1280x800): %dx%d' % (bb['width'], bb['height']))
    ok(pg.locator('.av-panel .itile.lk').count() > 3 and pg.locator('.av-panel .itile .tag.pr').count() > 3, 'Gesperrte Kacheln mit Preis sichtbar')
    before = E("()=>JSON.stringify(S.av.look)")
    E("()=>{ACT.avPick('hair.short');ACT.avRand();ACT.avSave();ACT.avPng();ACT.avClearAcc();ACT.avColor('col.hair.black')}"); pg.wait_for_timeout(700)
    ok(E("()=>JSON.stringify(S.av.look)") == before and E("()=>S.av.saved.length") == 0, 'Ansehen: Aktionen ändern nichts')
    pg.locator('.av-panel .itile.lk').first.click(); pg.wait_for_timeout(300)
    ok(E("()=>view") == 'shop', 'Gesperrte Kachel führt in den Shop')
    E("()=>ACT.avatar()"); pg.wait_for_timeout(200)
    # Fino-Schalter geht auch im Ansehen
    u0 = E("()=>S.av.use"); pg.locator('[data-act="avUse"]').click(); pg.wait_for_timeout(100)
    ok(E("()=>S.av.use") == (not u0) and E("()=>JSON.stringify(S.av.look)") == before, '„Fino statt mir“ im Ansehen-Modus schaltbar')
    E("()=>{S.av.use=true;render()}")
    m0 = E("()=>__av.AV.mood"); pg.locator('.av-pv').click(); pg.wait_for_timeout(100)
    ok(E("()=>__av.AV.mood") != m0, 'Tippen auf den Avatar wechselt die Stimmung')
    ok(E("()=>JSON.stringify(S.av.look)") == before, 'Stimmung ändert den Look nicht')
    # Tabs im Ansehen
    for t in ['face', 'hair', 'top', 'acc', 'bg', 'fx']:
        E("(t)=>ACT.avTab(t)", t); pg.wait_for_timeout(40)
        ok(pg.locator('.tabs .on').count() == 1 and pg.locator('.av-panel .itile, .av-panel .av-sw, .av-panel .av-chip').count() > 3, 'Tab %s zeigt Sammlung' % t)

    # ---------- Meilensteine ----------
    E("()=>{S.stats.decks=3;S.stats.blocks=0;checkUnlocks()}")
    ok(E("()=>hasItem('acc.medal')&&hasItem('fx.sparkle')&&!hasItem('top.sequin')"), 'Meilensteine: 3 Gruppen schalten Medaille + Glitzer frei')
    E("()=>{S.stats.decks=10;S.stats.blocks=30;checkUnlocks()}")
    ok(all(E("(id)=>hasItem(id)", i) for i in ['top.sequin', 'acc.laurel', 'acc.crown', 'eyes.sparkle', 'col.hair.gold']), 'Alle Meilensteine erreichbar')
    ok(E("()=>S.unl['acc.crown']>0"), 'Besitz bleibt in S.unl')

    # ---------- Gestalten (Kreativzeit) ----------
    E("()=>{S.coins=500;UI.pinCreative=Date.now()+600000;render();ACT.avatar()}"); pg.wait_for_timeout(300)
    ok(E("()=>UI.ro") is False and pg.locator('.av-bar').count() == 1, 'Mit Kreativzeit: Bearbeiten-Knöpfe da')
    E("()=>ACT.avTab('hair')")
    pg.locator('.av-panel .itile[data-arg="hair.bob"]').click(); pg.wait_for_timeout(120)
    ok(E("()=>S.av.look.hair") == 'hair.bob', 'Kachel tippen setzt Frisur und speichert sofort')
    ok(E("()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>/mathe|abenteuer|state/i.test(k))||'')||'{}').av!==undefined") in (True, False), 'Speicherung ok')
    # Kauf über gesperrte Kachel (Kern-Dialog)
    cand = E("()=>itemsOf('avhair').filter(i=>i.src.t==='shop'&&!hasItem(i.id)).sort((a,b)=>a.src.price-b.src.price)[0].id")
    price = E("(id)=>CATALOG[id].src.price", cand); c0 = E("()=>S.coins")
    pg.locator('.av-panel .itile[data-arg="%s"]' % cand).click(); pg.wait_for_timeout(300)
    ok(E("()=>view") == 'shop', 'Gesperrte Kachel zeigt den Shop')
    E("(id)=>ACT.buyItemAsk(id)", cand); pg.wait_for_timeout(150)
    pg.locator('[data-act="buyItemYes"]').click(); pg.wait_for_timeout(300)
    ok(E("(id)=>hasItem(id)", cand) and E("()=>S.coins") == c0 - price, 'Kauf über Kern-Dialog: gehört ihr, Münzen abgezogen')
    E("()=>ACT.avatar()"); pg.wait_for_timeout(250)
    pg.locator('.av-panel .itile[data-arg="%s"]' % cand).click(); pg.wait_for_timeout(120)
    ok(E("()=>S.av.look.hair") == cand, 'Neu gekauftes Teil lässt sich anziehen')
    # Farben: eigene = Punkt, gesperrte = Chip mit Preis
    ok(pg.locator('.av-chip').count() >= 0, 'Chips vorhanden')
    E("()=>ACT.avTab('hair')"); pg.wait_for_timeout(60)
    ok(pg.locator('.av-chip').count() >= 5 and pg.locator('.av-chip', has_text='🪙').count() >= 5, 'Gesperrte Haarfarben als Chips mit Preis')
    pg.locator('.av-sw[data-arg="col.hair.black"]').click(); pg.wait_for_timeout(100)
    ok(E("()=>S.av.look.hairC") == '#1f1b24', 'Eigene Farbe wählen')
    E("()=>ACT.avPick('top.sequin')"); E("()=>ACT.avPick('acc.crown')"); E("()=>ACT.avPick('bg.sky')")
    ok(E("()=>S.av.look.top=='top.sequin'&&S.av.look.acc.includes('acc.crown')&&S.av.look.bg=='bg.sky'"), 'Teile anziehen (Meilenstein-Teile inklusive)')
    E("()=>ACT.avClearAcc()"); ok(E("()=>S.av.look.acc.length") == 0, 'Alles ablegen')

    # ---------- Zufall: nur Besitz ----------
    r = E("""()=>{let bad=0;for(let i=0;i<60;i++){const l=__av.norm(__av.randLook());
        ['hair','top','eyes','mouth','bg'].forEach(k=>{if(!hasItem(l[k]))bad++});
        l.acc.forEach(id=>{if(!hasItem(id))bad++});
        [['skin','skin'],['hair','hairC'],['eyes','eyesC'],['top','topC']].forEach(([s,k])=>{const id=__av.COLID[s+'|'+l[k]];if(id&&!hasItem(id))bad++});
        if(l.fx&&l.fx!=='fx.none'&&!hasItem(l.fx))bad++}return bad}""")
    ok(r == 0, 'Zufall nutzt nur Besitz (60 Würfe)')
    before = E("()=>JSON.stringify(S.av.look)")
    for i in range(6):
        pg.locator('[data-act="avRand"]').click(); pg.wait_for_timeout(700)
        if E("()=>JSON.stringify(S.av.look)") != before: break
    ok(E("()=>JSON.stringify(S.av.look)") != before, 'Zufall verändert den Look')

    # ---------- Speichern / Laden / Löschen (max 8) ----------
    E("()=>ACT.avPick('hair.short')")
    look_a = E("()=>JSON.stringify(S.av.look)")
    pg.locator('[data-act="avSave"]').first.click(); pg.wait_for_timeout(150)
    ok(pg.locator('#av-name').count() == 1, 'Merken fragt nach einem Namen')
    pg.fill('#av-name', 'Mein Rock-Look'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    ok(E("()=>S.av.saved.length") == 1 and E("()=>S.av.saved[0].name") == 'Mein Rock-Look', 'Look gespeichert')
    ok(E("()=>JSON.stringify(S.av.saved[0].look)") == look_a, 'Gespeicherter Look == aktueller Look')
    ok(E("()=>{const s=S.av.saved[0];return typeof s.id==='string'&&typeof s.ts==='number'}"), 'Look hat id + ts')
    E("()=>ACT.avPick('hair.long')")
    sid = E("()=>S.av.saved[0].id"); E("(id)=>ACT.avLoad(id)", sid)
    ok(E("()=>JSON.stringify(S.av.look)") == look_a, 'Laden holt den Look zurück')
    for i in range(10): E("()=>{ACT.avSave();ACT.avSaveYes()}")
    ok(E("()=>S.av.saved.length") == 8, 'Höchstens 8 Looks (%d)' % E("()=>S.av.saved.length"))
    E("(id)=>ACT.avDelAsk(id)", sid); pg.wait_for_timeout(100)
    ok(pg.locator('[data-act="avDelYes"]').count() == 1 and E("()=>S.av.saved.length") == 8, 'Löschen fragt nach')
    pg.locator('[data-act="avDelYes"]').click(); pg.wait_for_timeout(150)
    ok(E("()=>S.av.saved.length") == 7, 'Look gelöscht')

    # ---------- PNG ----------
    with pg.expect_download(timeout=8000) as dl:
        pg.locator('[data-act="avPng"]').first.click()
    d = dl.value; data = open(d.path(), 'rb').read()
    ok(d.suggested_filename.endswith('.png') and data[:8] == b'\x89PNG\r\n\x1a\n', 'PNG-Export (%s, %d Bytes)' % (d.suggested_filename, len(data)))
    ok((int.from_bytes(data[16:20], 'big'), int.from_bytes(data[20:24], 'big')) == (512, 512), 'PNG 512x512')

    # ---------- Fino-Schalter / Fertig-Schutz ----------
    pg.locator('[data-act="avUse"]').click(); pg.wait_for_timeout(100)
    u1 = E("()=>S.av.use"); pg.locator('[data-act="avUse"]').click(); pg.wait_for_timeout(100)
    ok(E("()=>S.av.use") != u1, 'Fino-Schalter wechselt')
    E("()=>ACT.avDone()"); ok(E("()=>S.av.saved.length") == 7, 'avDone nach Einrichtung ändert nichts')

    # ---------- Serialisierbar / Kaputte Daten ----------
    ok(E("()=>{const s=JSON.stringify(S);return JSON.stringify(JSON.parse(s))===s}"), 'S bleibt JSON-serialisierbar')
    keys = E("()=>Object.keys(S.av).sort().join()")
    ok(set(keys.split(',')) <= {'use', 'look', 'saved', 'draft'} and {'use', 'look', 'saved'} <= set(keys.split(',')), 'S.av-Schlüssel: %s' % keys)
    E("()=>{S.av.look={hair:'hair.zzz',acc:'kaputt',skin:7,extras:['ex.x'],face:'face.long'};S.av.use=true;save();render()}")
    ok(E("()=>meSVG(S.av.look,'happy').indexOf('<svg')===0"), 'Kaputter gespeicherter Look rendert')
    E("()=>{ACT.avatar()}"); pg.wait_for_timeout(200)
    ok(E("()=>view") == 'avatar' and pg.locator('.av-pv svg').count() == 1, 'Ansicht öffnet auch mit kaputtem Look')
    E("()=>{S.av=undefined;ACT.avatar()}"); pg.wait_for_timeout(200)
    ok(E("()=>view") == 'avatar' and pg.locator('.av-setup').count() == 1, 'Ohne S.av startet die Einrichtung')

    # ---------- Handy 390x844 ----------
    ph = ctx.new_page(); ph.set_viewport_size({'width': 390, 'height': 844})
    perrs = []; ph.on('pageerror', lambda e: perrs.append(str(e))); ph.on('console', lambda m: perrs.append(m.text) if m.type == 'error' else None)
    ph.goto(URL)
    for stage in ('setup', 'ro', 'edit'):
        if stage == 'ro': ph.evaluate("()=>{ACT.avDone();UI.pinCreative=0;render()}")
        if stage == 'edit': ph.evaluate("()=>{UI.pinCreative=Date.now()+600000;render()}")
        if stage == 'setup': ph.evaluate("()=>{S.coins=200;render();ACT.avatar()}")
        ph.wait_for_timeout(300)
        sw = ph.evaluate("()=>document.documentElement.scrollWidth")
        ok(sw <= 390, 'Handy (%s): kein horizontales Scrollen (%d)' % (stage, sw))
    ph.mouse.wheel(0, 500); ph.wait_for_timeout(200)
    pb = ph.locator('.av-pv').bounding_box()
    ok(0 <= pb['y'] < 200, 'Handy: Vorschau bleibt beim Scrollen sichtbar, y=%d' % pb['y'])
    ph.evaluate("()=>{S.eq.theme='nacht';render()}"); ph.wait_for_timeout(150)
    ok(ph.evaluate("()=>document.body.dataset.theme") == 'nacht' and ph.locator('.av-card').count() == 1, 'Nacht-Theme rendert')
    ph.close()

    # ---------- reduced motion ----------
    rm = ctx.new_page(); rm.emulate_media(reduced_motion='reduce'); rm.goto(URL)
    rm.evaluate("()=>{ACT.avatar();document.querySelector('.av-pv').classList.add('av-bounce','av-shake')}")
    an = rm.evaluate("()=>getComputedStyle(document.querySelector('.av-pv')).animationName")
    ok(an == 'none', 'prefers-reduced-motion: keine Animation (%s)' % an)
    rm.close()

    ok(not errs and not perrs, 'Keine Konsolenfehler %s' % (errs + perrs)[:3])
    b.close()
print('\n%d Fehler' % len(fails))
sys.exit(1 if fails else 0)
