"""Migrationstest: Daten aus der alten Version (v2, Commit 5f9c70d) müssen in der neuen Version komplett erhalten bleiben.
Gestartete und fertige Gruppen werden NICHT neu gebaut; Münzen/Sterne/Pokale/Shop bleiben unverändert."""
import subprocess, threading, http.server, socketserver, os, json, sys, pathlib, functools, shutil
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
W = pathlib.Path('/tmp/mig'); shutil.rmtree(W, ignore_errors=True); W.mkdir()
(W/'old.html').write_bytes(subprocess.check_output(['git', 'show', '5f9c70d:dist/Mathe-Abenteuer_Klasse4.html'], cwd=ROOT))
shutil.copy(ROOT/'dist'/'Mathe-Abenteuer_Klasse4.html', W/'new.html')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def __init__(self, *a, **k): super().__init__(*a, directory=str(W), **k)
srv = socketserver.TCPServer(('127.0.0.1', 0), Q); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
fails = 0
def ok(c, m):
    global fails
    if not c: fails += 1
    print(('  ok   ' if c else '  FAIL ') + m)
SOLVE = """(mode)=>{const A=__app;const c=A.R.ctx,q=c.q;
 const right=()=>{if(q.fields){q.fields.forEach((f,i)=>{if(c.locked[i])return;c.focus=i;c.vals[i]='';for(const ch of String(f.a))A.press(/\\d/.test(ch)?ch:',')});A.check()}else A.pickChoice(q.correct)};
 const wrong=()=>{if(q.fields){q.fields.forEach((f,i)=>{if(c.locked[i])return;c.focus=i;c.vals[i]='';A.press('9');A.press('9');A.press('9')});A.check()}else A.pickChoice((q.correct+1)%q.choices.length)};
 if(mode==='first')right();else if(mode==='second'){wrong();right()}else{wrong();wrong()}}"""
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(); pg = ctx.new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    base = f'http://127.0.0.1:{port}/'
    # ---------- 1) alte Version: Zustand erzeugen ----------
    pg.goto(base + 'old.html')
    pg.evaluate("()=>{const A=__app;A.S.coins=0;A.S.life=0;}")
    def play(key, n):
        pg.evaluate("(k)=>{__app.startDeck(k)}", key)
        for i in range(n):
            pg.evaluate(SOLVE, ['first', 'second', 'fail', 'first', 'first'][i % 5])
            pg.evaluate("()=>{const A=__app;A.next()}")
            if pg.evaluate("()=>__app.view") == 'block':
                pg.evaluate("()=>{__app.ACT.blockNext&&__app.ACT.blockNext()}")
    play('A4.umkehr', 30)                                    # komplett fertig
    pg.evaluate("()=>{__app.go('home')}")
    play('A4.kleine', 13); pg.evaluate("()=>{__app.ACT.quit();__app.ACT.quitYes()}")   # mitten drin
    pg.evaluate("(k)=>{__app.startDeck(k)}", 'A4.divtens'); pg.evaluate(SOLVE, 'first')  # 1 Antwort, noch nicht „Weiter“
    pg.evaluate("()=>{__app.S.decks['A4.divtens'].i=0;__app.save();__app.go('home')}")   # Sonderfall: Antwort gespeichert, Zeiger noch 0
    pg.evaluate("()=>{const A=__app;A.getDeck('A5.schreib')}")                         # angelegt, aber unberührt
    pg.evaluate("()=>{const A=__app;A.S.coins+=500;A.S.stars+=40;A.S.flames+=12;A.S.owned.bg.push('wolken');A.S.stats.bought++;A.S.cards.f01=1;A.S.cards.f02=1;A.save()}")
    old = pg.evaluate("()=>JSON.parse(JSON.stringify(__app.S))")
    (W/'old_save.json').write_text(json.dumps(old))              # auch für compare_save.py (Export-Weg)
    print('old state: decks', {k: (v['i'], sum(1 for r in v['res'] if r)) for k, v in old['decks'].items()}, 'coins', old['coins'], 'stars', old['stars'])
    ok(old['decks']['A4.umkehr']['i'] == 30 and 'pts' not in old['decks']['A4.umkehr'], 'old fixture: finished legacy group')
    ok(old['decks']['A4.kleine']['i'] == 13, 'old fixture: started group at 13')
    ok(old['decks']['A4.divtens']['res'][0] is not None and old['decks']['A4.divtens']['i'] == 0, 'old fixture: 1 answer given, pointer still 0')
    # ---------- 2) neue Version mit denselben Daten ----------
    pg.goto(base + 'new.html')
    new = pg.evaluate("()=>JSON.parse(JSON.stringify(__app.S))")
    for k in ['A4.umkehr', 'A4.kleine', 'A4.divtens']:
        ok(json.dumps(new['decks'][k], sort_keys=True) == json.dumps(old['decks'][k], sort_keys=True), f'deck {k} identical (questions, answers, results, pointer)')
    ok('A5.schreib' not in new['decks'] or new['decks']['A5.schreib'].get('pts'), 'untouched legacy group may be rebuilt (nothing lost)')
    for f in ['coins', 'life', 'stars', 'starsLife', 'flames', 'flamesLife', 'chests', 'stats', 'trophies', 'cards', 'streak', 'tests', 'mistakes', 'cfg', 'eq', 'daily', 'log']:
        if f == 'coins':
            ok(new['coins'] == old['coins'] + 3 * old['flames'], f"coins = old coins + 3 x old flames ({old['coins']} + 3x{old['flames']} -> {new['coins']})")
        elif f == 'flames':
            ok(new['flames'] == 0 and new['flamesLife'] == old['flamesLife'], 'flames converted to coins once, lifetime count kept')
        elif f == 'daily':
            ok(all(new['daily'].get(k) == v for k, v in old['daily'].items()), 'daily: all old values unchanged (new keys added)')
        elif f == 'cfg':
            ok(all(new['cfg'].get(k) == v for k, v in old['cfg'].items()), 'cfg: all old settings unchanged (new keys may be added)')
        else:
            ok(json.dumps(new[f], sort_keys=True) == json.dumps(old[f], sort_keys=True), f'{f} unchanged')
    for f in ['unl', 'stamps', 'av', 'ins', 'buch', 'wes', 'story', 'songs', 'mus']:
        ok(f in new, f'new field {f} present after migration')
    ok(isinstance(new['cfg'].get('sound'), (bool, int)) or 'sound' in new['cfg'], 'cfg.sound default exists')
    ok(all(set(old['owned'][s]) <= set(new['owned'][s]) for s in old['owned']), 'all owned items still owned')
    ok(json.dumps(new['topics'], sort_keys=True) == json.dumps(old['topics'], sort_keys=True), 'topics (medals, best-credit, stars) unchanged')
    # Anzeige: fertige Gruppe zeigt alten Maßstab (60)
    mx = pg.evaluate("()=>[__app.deckMax(__app.S.decks['A4.umkehr']),__app.deckPts(__app.S.decks['A4.umkehr']),__app.deckMax(__app.S.decks['A4.kleine'])]")
    ok(mx[0] == 60 and mx[2] == 60, f'legacy groups keep 60-point scale {mx}')
    pg.evaluate("()=>{__app.go('topic',{key:'A4.umkehr'})}")
    txt = pg.evaluate("()=>document.getElementById('app').textContent")
    ok('Alle 30 Aufgaben geschafft' in txt and f'/{mx[0]}' in txt, 'finished group shown as finished with old maximum')
    # ---------- 3) angefangene alte Gruppe weiterspielen: altes Punktesystem, nichts wird neu gebaut ----------
    c0 = new['coins']; qs0 = json.dumps(old['decks']['A4.kleine']['qs'])
    pg.evaluate("(k)=>{__app.startDeck(k)}", 'A4.kleine')
    ok(pg.evaluate("()=>__app.R.idx") == 13, 'resumes at question 14')
    for i in range(13, 30):
        pg.evaluate(SOLVE, 'first'); pg.evaluate("()=>{__app.next()}")
        if pg.evaluate("()=>__app.view") == 'block': pg.evaluate("()=>{__app.ACT.blockNext&&__app.ACT.blockNext()}")
    fin = pg.evaluate("()=>JSON.parse(JSON.stringify(__app.S))")
    d = fin['decks']['A4.kleine']
    ok(json.dumps(d['qs']) == qs0, 'same 30 questions until the end (legacy deck never rebuilt)')
    ok('pts' not in d and d['i'] == 30, 'finished in legacy mode')
    gain = fin['coins'] - c0
    cap = 60 - sum(old['topics']['A4.kleine']['cb'])
    ok(0 < gain <= cap, f'coins gained {gain} <= legacy cap {cap}')
    ok(sum(fin['topics']['A4.kleine']['cb']) <= 60, 'per-group cap 60 holds for legacy group')
    ok(fin['topics']['A4.kleine']['medal'] >= 3, f"medal {fin['topics']['A4.kleine']['medal']}")
    # ---------- 4) Neu laden: weiterhin identisch ----------
    pg.reload(); again = pg.evaluate("()=>JSON.parse(JSON.stringify(__app.S))")
    ok(json.dumps(again['decks']['A4.kleine'], sort_keys=True) == json.dumps(fin['decks']['A4.kleine'], sort_keys=True) and again['coins'] == fin['coins'], 'reload keeps everything')
    # ---------- 5) Neue Runde nur auf Wunsch ----------
    ok(pg.evaluate("()=>__app.S.decks['A4.umkehr'].i") == 30, 'finished group still finished (no automatic new round)')
    ok(pg.evaluate("()=>{__app.newRound('A4.umkehr');return __app.S.decks['A4.umkehr'].pts.length}") == 30, 'explicit new round gives a new-scheme deck')
    ok(pg.evaluate("()=>__app.S.coins") == fin['coins'] and pg.evaluate("()=>__app.S.stars") == fin['stars'], 'wallet unchanged by new round')
    print('JS errors:', errs); ok(not errs, 'no JS errors')
    b.close()
print('ALL MIGRATION CHECKS PASSED' if not fails else f'{fails} FAILS')
sys.exit(1 if fails else 0)
