"""Geräte abgleichen (feat_sync.js) + Bildschirm ausfüllen (feat_fit.js).
Aufruf: python3 sync_test.py ../dist/Mathe-Abenteuer_Klasse4.html"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright

URL = pathlib.Path(sys.argv[1]).resolve().as_uri()
FAILS = []
def ok(c, m):
    print(('ok   ' if c else 'FAIL ') + m)
    if not c: FAILS.append(m)

def new_page(br, **kw):
    ctx = br.new_context(accept_downloads=True, **kw)
    ctx.grant_permissions(['camera'])
    p = ctx.new_page(); errs = []
    p.on('pageerror', lambda e: errs.append(str(e)))
    p.goto(URL); p.wait_for_timeout(400)
    return p, errs

def seed(p, js):
    p.evaluate("""js => { const A = window.__app; const S = A.S; (new Function('S', js))(S); A.save(); A.render(); }""", js)

def st(p, expr):
    return p.evaluate("e => (new Function('S', 'return ' + e))(window.__app.S)", expr)

with sync_playwright() as pw:
    br = pw.chromium.launch(args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])

    # ---------- 1) Regeln des Zusammenführens ----------
    p, errs = new_page(br)
    r = p.evaluate("""() => {
      const M = window.__sync.syMerge, D = () => window.__app.mergeState({});
      const base = D(); base.coins = 100; base.stats.q = 50; base.daily = Object.assign(base.daily, { d: '2026-10-20', sec: 300, n: 5 });
      base.mistakes = [{ q: 'x1' }, { q: 'x2' }]; base.decks['A.t1'] = { i: 3, res: [1, 1, 0], qs: [] };
      const a = JSON.parse(JSON.stringify(base)), b = JSON.parse(JSON.stringify(base));
      a.coins = 130; a.owned.hat.push('h1'); a.daily.sec = 400; a.mistakes = [{ q: 'x2' }]; a.decks['A.t1'] = { i: 9, res: [1, 1, 0, 1, 1, 1, 1, 1, 1], qs: [] };
      b.coins = 150; b.stats.q = 70; b.daily.sec = 360; b.owned.hat.push('h2'); b.decks['A.t1'] = { i: 5, res: [1, 1, 0, 1, 1], qs: [] }; b.mistakes.push({ q: 'x3' });
      b.saved = a.saved + 10; b.name = 'Neu';
      const m3 = M(a, b, base), m2 = M(a, b, null);
      const c = JSON.parse(JSON.stringify(base)); c.daily = Object.assign(D().daily, { d: '2026-10-21', sec: 60 });
      const md = M(a, c, base);
      const e = JSON.parse(JSON.stringify(base)); e.coins = 40;    // ausgegeben
      const ms = M(a, e, base);
      return { c3: m3.coins, c2: m2.coins, q3: m3.stats.q, sec3: m3.daily.sec, hat: m3.owned.hat.slice().sort(), mis: m3.mistakes.map(x => x.q),
        deck: m3.decks['A.t1'].i, name: m3.name, hist: m3.syncHist.length, id: !!m3.syncId, dday: md.daily.d, dsec: md.daily.sec, spent: ms.coins };
    }""")
    ok(r['c3'] == 180, f"3-Wege: Münzen genau addiert (100 → 130 / 150 ⇒ 180): {r['c3']}")
    ok(r['c2'] == 150, f"ohne gemeinsamen Stand: höherer Wert: {r['c2']}")
    ok(r['q3'] == 70, f"nur einseitig geändert → übernommen: {r['q3']}")
    ok(r['sec3'] == 460, f"heutige Übungszeit von beiden Geräten zählt: {r['sec3']}")
    ok(r['hat'] == ['h1', 'h2'], f"Besitz vereint: {r['hat']}")
    ok(r['mis'] == ['x2', 'x3'], f"behobener Fehler bleibt weg, neuer kommt dazu: {r['mis']}")
    ok(r['deck'] == 9, f"Übung nicht gemischt, weiteste gilt: {r['deck']}")
    ok(r['name'] == 'Neu', 'Text: einseitige Änderung gilt')
    ok(r['id'] and r['hist'] >= 1, 'neuer Stand-Punkt gesetzt')
    ok(r['dday'] == '2026-10-21' and r['dsec'] == 60, 'anderer Tag: neuerer Tag gilt')
    ok(r['spent'] == 70, f"Ausgaben werden mitgezählt (130 + 40 − 100): {r['spent']}")

    # ---------- 2) Datei zusammenführen (beide Richtungen, ohne Doppeltzählen) ----------
    A, ea = new_page(br); B, eb = new_page(br)
    seed(A, "S.coins = 100; S.stats.q = 10;")
    def export(pg):
        with pg.expect_download() as d: pg.evaluate("window.__app.ACT.export()")
        return d.value.path()
    fA = export(A)
    B.evaluate("t => window.__app.importData(t, true)", pathlib.Path(fA).read_text()); B.wait_for_timeout(300)
    ok(st(B, 'S.coins') == 100, 'Tablet-Sicherung auf Handy geladen')
    seed(A, "S.coins += 30;"); seed(B, "S.coins += 50; S.owned.hat.push('hb');")
    fB = export(B); B.wait_for_timeout(300)
    A.evaluate("() => { const A = window.__app; A.UI.pinUntil = Date.now() + 60000; A.go('parent'); }")
    A.set_input_files('#mrgFile', fB); A.wait_for_selector('#modal [data-act=syFileYes]')
    ok('Gemeinsamer Stand' in A.inner_text('#modal'), 'Datei: gemeinsamer Stand erkannt')
    A.click('#modal [data-act=syFileYes]'); A.wait_for_timeout(400)
    ok(st(A, 'S.coins') == 180, f"Tablet nach Zusammenführen: {st(A, 'S.coins')} (erwartet 180)")
    ok('hb' in st(A, 'S.owned.hat'), 'Besitz vom Handy übernommen')
    fA2 = export(A); A.wait_for_timeout(300)
    B.evaluate("() => { const A = window.__app; A.UI.pinUntil = Date.now() + 60000; A.go('parent'); }")
    B.set_input_files('#mrgFile', fA2); B.wait_for_selector('#modal [data-act=syFileYes]'); B.click('#modal [data-act=syFileYes]'); B.wait_for_timeout(400)
    ok(st(B, 'S.coins') == 180, f"Handy danach: {st(B, 'S.coins')} (keine Doppelzählung, erwartet 180)")
    ok(B.evaluate("localStorage.getItem('mathe_abenteuer_preimport') !== null"), 'vorheriger Stand aufgehoben')

    # ---------- 3) Direkt (WebRTC) – Codes als Text eingefügt ----------
    seed(A, "S.coins += 7;"); seed(B, "S.coins += 11; S.stats.q += 4;")
    qa, qb = st(A, 'S.stats.q'), st(B, 'S.stats.q')
    for pg in (A, B): pg.evaluate("window.__app.ACT.syOpen()")
    A.click('#modal [data-act=syA]'); A.wait_for_selector('#syOut', state='attached', timeout=15000)
    ok(A.query_selector('#modal svg.sy-qr') is not None, 'QR-Code wird angezeigt')
    offer = A.eval_on_selector('#syOut', 'e => e.value')
    ok(offer.startswith('DZ1~o~') and len(offer) < 600, f'kurzer Start-Code ({len(offer)} Zeichen)')
    qr_ok = A.evaluate("""() => { const svg = document.querySelector('#modal svg.sy-qr'); const n = svg.viewBox.baseVal.width;
      const c = document.createElement('canvas'), k = 8; c.width = c.height = n * k; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, n * k, n * k); x.fillStyle = '#000';
      const d = svg.querySelector('path').getAttribute('d'); for (const m of d.matchAll(/M(\\d+) (\\d+)/g)) x.fillRect(+m[1] * k, +m[2] * k, k, k);
      const r = jsQR(x.getImageData(0, 0, n * k, n * k).data, n * k, n * k); return r ? r.data : null; }""")
    ok(qr_ok == offer, 'QR-Code lässt sich zurücklesen (jsQR)')
    B.click('#modal [data-act=syB]'); B.wait_for_selector('#syIn', state='attached')
    B.evaluate("v => { document.querySelector('#syIn').value = v; window.__app.ACT.syPaste('offer'); }", offer)
    B.wait_for_selector('#syOut', state='attached', timeout=15000)
    ans = B.eval_on_selector('#syOut', 'e => e.value'); ok(ans.startswith('DZ1~a~'), 'Antwort-Code erzeugt')
    A.click('#modal [data-act=syScanAns]'); A.wait_for_selector('#syIn', state='attached')
    A.evaluate("v => { document.querySelector('#syIn').value = v; window.__app.ACT.syPaste('answer'); }", ans)
    for pg, n in ((A, 'A'), (B, 'B')):
        try: pg.wait_for_function("window.__sync.SY.step === 'done'", timeout=20000); ok(True, f'Gerät {n}: Abgleich fertig')
        except Exception: ok(False, f'Gerät {n}: Abgleich fertig (step={pg.evaluate("window.__sync.SY.step")}, msg={pg.evaluate("window.__sync.SY.msg")})')
    ok(st(A, 'S.coins') == 198 and st(B, 'S.coins') == 198, f"beide gleich & genau: A={st(A, 'S.coins')} B={st(B, 'S.coins')} (erwartet 198)")
    ok(st(A, 'S.stats.q') == st(B, 'S.stats.q') == max(qa, qb), 'Aufgaben-Zähler gleich')
    ok(st(A, 'S.syncId') == st(B, 'S.syncId'), 'gleicher Stand-Punkt auf beiden Geräten')
    ok(A.evaluate("!window.__sync.SY.stream") and B.evaluate("!window.__sync.SY.stream"), 'Kamera danach aus')
    A.click('#modal [data-act=syCancel]'); B.click('#modal [data-act=syCancel]')
    ok(not ea and not eb and not errs, f'keine JS-Fehler {ea + eb + errs}')

    # ---------- 4) Bildschirm ausfüllen ----------
    def fit(**kw):
        pg, e = new_page(br, **kw); v = pg.evaluate("[document.documentElement.clientWidth, Math.round(visualViewport.scale * 100) / 100, document.querySelector('#app').getBoundingClientRect().width]"); pg.context.close(); return v
    w, k, aw = fit(viewport={'width': 1280, 'height': 800}, is_mobile=True, has_touch=True, device_scale_factor=2)
    ok(w == 1040 and abs(k - 1.23) < .02, f'Tablet quer: Seite 1040 px breit, ×{k}')
    w, k, aw = fit(viewport={'width': 1600, 'height': 1000}, is_mobile=True, has_touch=True, device_scale_factor=2)
    ok(k == 1.5 and abs(w - 1067) <= 1, f'großes Tablet: höchstens ×1.5 ({w} px, ×{k})')
    w, k, aw = fit(viewport={'width': 800, 'height': 1280}, is_mobile=True, has_touch=True, device_scale_factor=2)
    ok(w == 800 and k == 1, f'Tablet hoch: unverändert ({w}, ×{k})')
    w, k, aw = fit(viewport={'width': 412, 'height': 915}, is_mobile=True, has_touch=True, device_scale_factor=2.6)
    ok(w == 412 and k == 1, f'Handy: unverändert ({w}, ×{k})')
    w, k, aw = fit(viewport={'width': 1600, 'height': 900})
    ok(w == 1600 and k == 1, f'Laptop: unverändert ({w}, ×{k})')
    pg, e = new_page(br, viewport={'width': 1280, 'height': 800}, is_mobile=True, has_touch=True, device_scale_factor=2)
    pg.evaluate("() => { const A = window.__app; A.S.cfg.fit = true; A.ACT.fitToggle(); }"); pg.wait_for_timeout(300)
    ok(pg.evaluate("document.documentElement.clientWidth") == 1280, 'Eltern-Schalter aus: wieder normale Größe')
    br.close()

print('\n' + (f'{len(FAILS)} FAILS' if FAILS else 'ALL SYNC/FIT CHECKS PASSED'))
sys.exit(1 if FAILS else 0)
