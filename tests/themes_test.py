import sys, json
from playwright.sync_api import sync_playwright
URL='file://'+sys.argv[1]
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1280,'height':800})
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(URL); pg.wait_for_function("()=>window.__app")
    themes=pg.evaluate("()=>Object.values(__app.CATALOG).filter(i=>i.kind==='theme').map(i=>i.id).concat(Object.keys(__app.CATALOG).length?[]:[])")
    th=pg.evaluate("()=>__app.SHOP.theme.items.map(i=>i.id)")
    views=['home','hefte','rewards','look','shop','trophies','schatz','buch','insel','wesen','story','avatar','musik','parent','profile','testSetup','extra','fakten','geo','welt','geoCards','geoPass']
    bad=0
    for t in th:
        pg.evaluate("(t)=>{__app.S.cfg.creativeMode='always';__app.S.owned.theme.includes(t)||__app.S.owned.theme.push(t);__app.S.eq.theme=t}",t)
        for v in views:
            pg.evaluate("(v)=>{__app.UI.pinUntil=Date.now()+60000;__app.go(v)}",v)
            n=pg.evaluate("()=>document.getElementById('app').innerHTML.length")
            if n<200: bad+=1; print('EMPTY',t,v)
    print('themes',len(th),'views',len(views),'empty',bad,'errors',errs)
    b.close()
sys.exit(1 if bad or errs else 0)
