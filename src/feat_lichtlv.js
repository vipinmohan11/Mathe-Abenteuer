/* =====================================================================
   BLINKIS LICHTERTURM · Stufen 1–8 (Schritte und Ablauf). Grundlagen, Turm, Werkstatt: feat_licht.js
   Eine Stufe = Liste von Schritten {k:'typ', ...}. Jeder Typ in LT_STEP hat init(sp, m) → st, view(sp, st, m) → {say, who, body, ant, bowl, next}
   und act(sp, st, verb, arg, m). Klicks: data-act="ltDo" data-arg="verb:arg". Fehler gibt es nicht – nur Hinweise, was wirklich herauskam.
   st.done = Schritt fertig („Weiter“), st.solved = zählt als gelöste Aufgabe (+1 Lichtpunkt beim ersten Mal). „Tipp“ zählt als Hilfe.
   ===================================================================== */
const LT_SN = { apfel: ['🍎', 'Apfel', 'der Apfel', 'ein Apfel'], keks: ['🍪', 'Keks', 'der Keks', 'ein Keks'], eis: ['🍦', 'Eis', 'das Eis', 'ein Eis'], banane: ['🍌', 'Banane', 'die Banane', 'eine Banane'] };
const LT_V4 = [8, 4, 2, 1];
const ltShuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ltRange = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; };
const ltCap = s => s.charAt(0).toUpperCase() + s.slice(1);
const ltOnOff = c => c === '1' ? 'AN' : 'AUS';

/* ---------- Ablauf ---------- */
function ltStart(lv) {
  const steps = LT_BUILD[lv](!!ltS().done[lv]);
  UI.ltV = null;
  UI.lt = { lv, steps, si: 0, st: {}, pts: 0, hints: 0, mood: 'idle', fx: null, stars: 0, guess: 0, codes: [], ord: [0, 1, 2, 3] };
  ltEnter(UI.lt);
  if (view !== 'licht') go('licht'); else { render(); try { window.scrollTo(0, 0); } catch (e) { } }
}
function ltEnter(m) { const sp = m.steps[m.si], T = LT_STEP[sp.k]; m.st = T.init ? T.init(sp, m) : {}; m.mood = sp.mood || 'idle'; }
function ltNext(m) {
  if (m.st.solved) m.pts++;
  m.si++;
  if (m.si >= m.steps.length) ltFinish(m); else ltEnter(m);
  try { window.scrollTo(0, 0); } catch (e) { }
}
function ltDo(a) {
  const m = UI.lt; if (!m || m.res) return;
  const sp = m.steps[m.si], st = m.st, T = LT_STEP[sp.k], s = String(a == null ? '' : a), c = s.indexOf(':'), v = c < 0 ? s : s.slice(0, c), x = c < 0 ? '' : s.slice(c + 1);
  if (v === 'next') { if (st.done) ltNext(m); render(); return; }
  if (v === 'tip') { if (sp.tip && !st.done) { m.hints++; st.msg = sp.tip; st.who = 'blinki'; m.mood = 'curious'; } render(); return; }
  st.just = null; st.pulse = null; st.wig = null; st.drop = null; st.last = null;
  const r = T.act ? T.act(sp, st, v, x, m) : null;
  if (r === 'next') ltNext(m);
  render();
}
function ltTog(st, i) {
  i = +i; if (!(i >= 0 && i < st.bits.length)) return;
  st.bits[i] = st.bits[i] ? 0 : 1; st.just = i; ltPlay(st.bits[i] ? 'on' : 'off', st.bits.length - 1 - i);
}
function ltSay(st, m, who, msg, mood, snd) { st.who = who; st.msg = msg; m.mood = mood || 'idle'; if (snd) ltPlay(snd); }

function ltLevelView(m) {
  const sp = m.steps[m.si], st = m.st, o = LT_STEP[sp.k].view(sp, st, m) || {}, L = LT_LV[m.lv - 1];
  const who = st.msg ? (st.who || o.who || 'blinki') : (o.who || 'blinki'), text = st.msg || o.say || '';
  const lumi = m.lv >= 4;
  const dots = m.steps.map((s, i) => `<i class="${i < m.si ? 'd' : i === m.si ? 'c' : ''}"></i>`).join('');
  return topBar('Blinkis Lichterturm', 'licht') + `<div class="lt-head"><div class="lt-ht"><small>Stufe ${m.lv}</small><b>${esc(L.t)}</b></div><div class="lt-steps" role="progressbar" aria-label="Schritt ${m.si + 1} von ${m.steps.length}" aria-valuenow="${m.si + 1}" aria-valuemin="1" aria-valuemax="${m.steps.length}">${dots}</div>${ltSndBtn()}</div>
  <section class="lt-stage"><div class="lt-scene${lumi ? ' two' : ''}">${ltBot(who === 'blinki' ? m.mood : 'idle', !!o.ant)}<div class="lt-bub ${who === 'lumi' ? 'from-r' : 'from-l'}" aria-live="polite">${text}</div>${lumi ? `<div class="lt-lumiw">${ltLumi(who === 'lumi' ? m.mood : 'idle')}${o.bowl != null ? `<div id="ltBowl" class="lt-bowl"><b>${o.bowl}</b><small>${o.bowl === 1 ? 'Stern' : 'Sterne'}</small></div>` : ''}</div>` : ''}</div>
  <div class="lt-body">${o.body || ''}</div>${st.done ? `<div class="lt-act"><button class="lt-btn" data-act="ltDo" data-arg="next">${esc(o.next || 'Weiter')}</button></div>` : ''}</section>
  <div class="lt-foot"><span class="lt-pts" title="Gelöst in dieser Stufe">✨ ${m.pts}</span>${sp.tip && !st.done ? '<button class="lt-tipb" data-act="ltDo" data-arg="tip">💡 Tipp</button>' : ''}</div>`;
}

/* ---------- kleine Bausteine ---------- */
const ltB = (arg, label, cls, dis) => `<button class="lt-btn${cls ? ' ' + cls : ''}" data-act="ltDo" data-arg="${arg}"${dis ? ' disabled' : ''}>${label}</button>`;
const ltLab = t => `<div class="lt-lab">${t}</div>`;
const ltOpts = (opts, miss) => `<div class="lt-opts">${opts.map(o => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return ltB('pick:' + v, l, 'sec', miss && miss.includes(String(v))); }).join('')}</div>`;
const ltCard = (p, extra, cls) => `<span class="lt-cbc ${cls || ''}">${ltMini(p)}${extra || ''}</span>`;
function ltLine(max, cnt, sum) {
  return `<div class="lt-line" role="list">${ltRange(1, max).map(n => { const c = cnt[n] || 0, k = c > 1 ? 'dup' : c === 1 ? 'ok' : n > sum ? 'far' : 'gap'; return `<span class="lt-n ${k}" role="listitem" aria-label="${n}: ${{ ok: 'geht', dup: 'geht doppelt', gap: 'Lücke', far: 'zu groß' }[k]}">${n}${c > 1 ? '<i>2×</i>' : ''}</span>`; }).join('')}</div>`;
}
function ltFac(sp, v) {
  const vals = sp.vals.map(x => x == null ? v : x), cnt = {}, k = vals.length;
  for (let mask = 1; mask < (1 << k); mask++) { let s = 0; for (let i = 0; i < k; i++) if (mask & (1 << i)) s += vals[i]; cnt[s] = (cnt[s] || 0) + 1; }
  const sum = vals.reduce((a, b) => a + b, 0), top = Math.max(sum, sp.need || 0);
  let gap = 0, dup = 0, reach = 0;
  for (let n = 1; n <= top; n++) { if (!cnt[n] && !gap) gap = n; if (cnt[n] > 1 && !dup) dup = n; }
  while (cnt[reach + 1]) reach++;
  return { vals, cnt, sum, gap, dup, reach, ok: !gap && !dup };
}
const ltSnackBtns = (st, can, assigned) => `<div class="lt-snacks">${Object.keys(LT_SN).map(k => { const a = assigned && assigned.find(c => c.s === k); return `<button class="lt-snack${a ? ' has' : ''}" data-act="ltDo" data-arg="pick:${k}" ${can(k) ? '' : 'disabled'} aria-label="${LT_SN[k][1]}"><span>${LT_SN[k][0]}</span><small>${LT_SN[k][1]}</small></button>`; }).join('')}</div>`;
const ltBook = (codes, st) => codes.length ? `<div class="lt-cbook"><small>Codebuch</small><div class="lt-cbrow wrap">${codes.map(c => ltCard(c.p, ' ' + LT_SN[c.s][0], (st.wig === c.p ? 'wig' : '') + (st.glow === c.p ? ' glow' : ''))).join('')}</div></div>` : '';

/* ---------- Schritt-Typen ---------- */
const LT_STEP = {
  talk: {
    init: sp => { if (sp.code) ltAddCode(sp.code); return { done: true, bits: sp.bits ? sp.bits.slice() : null }; },
    view: (sp, st) => ({ say: sp.say, who: sp.who, next: sp.btn, ant: !!(st.bits && st.bits.some(Boolean)), body: (st.bits ? ltRow(st.bits, { vals: sp.vals, mode: sp.mode, showVal: sp.showVal, just: st.just }) : '') + (sp.html || '') })
  },
  /* Stufe 1 */
  meaning: {
    init: () => ({ bits: [1], just: 0 }),
    view: (sp, st) => ({ ant: true, next: 'Lass uns etwas abmachen', say: 'Hallo, ich bin <b>Blinki</b>! Sprechen kann ich nicht. Ich kann nur meine Lampe an- und ausmachen. Pass auf, ich sage dir jetzt etwas … Was meine ich wohl?', body: ltLab('Blinkis Lampe') + ltRow(st.bits, { just: st.just }) + (st.done ? '' : ltOpts([['ja', 'Ja'], ['nein', 'Nein']])) }),
    act: (sp, st, v, x, m) => {
      if (v !== 'pick' || st.done) return; st.done = true;
      if (x === 'ja') ltSay(st, m, 'blinki', 'Gut geraten! Aber woher solltest du das wissen? AN hätte genauso gut <b>Nein</b> heißen können.', 'curious', 'hm');
      else ltSay(st, m, 'blinki', 'Oh! Ich meinte <b>Ja</b>. Aber woher solltest du das wissen? Wir haben nie abgemacht, was AN bedeutet.', 'confused', 'hm');
    }
  },
  deal: {
    view: () => ({ ant: true, say: 'Lass uns abmachen: Wenn meine Lampe <b>AN</b> ist, heißt das <b>Ja</b>. Ist sie <b>AUS</b>, heißt das <b>Nein</b>. Einverstanden?', body: `<div class="lt-deal"><div class="lt-dc">${ltRow([1], { cls: 'tiny' })}<b>= Ja</b></div><div class="lt-dc">${ltRow([0], { cls: 'tiny' })}<b>= Nein</b></div></div><div class="lt-act">${ltB('deal', 'Abgemacht! 🤝')}</div>` }),
    act: (sp, st, v) => { if (v === 'deal') { ltAddCode('jn'); ltPlay('ok'); toast('📖', 'Neu im Codebuch: eure Abmachung'); return 'next'; } }
  },
  ask: {
    init: () => ({ bits: [0], taps: 0 }),
    view: (sp, st) => ({ ant: !!st.bits[0], say: `${sp.q}<br><small>Antworte mit deiner Lampe: AN heißt Ja, AUS heißt Nein. Dann tippe auf „Senden“.</small>`, body: ltLab('Deine Lampe') + ltRow(st.bits, { act: st.done ? null : 'lamp', just: st.just }) + (st.done ? '' : `<div class="lt-act">${ltB('send', 'Senden')}</div>`) }),
    act: (sp, st, v, x, m) => {
      if (st.done) return;
      if (v === 'lamp') { ltTog(st, x); st.taps++; if (st.taps === 8) ltSay(st, m, 'blinki', 'Hihi, das kitzelt! Meine Antenne blinkt mit.', 'happy'); else if (st.taps > 8) st.msg = ''; }
      if (v === 'send') { st.done = st.solved = true; ltSay(st, m, 'blinki', st.bits[0] ? sp.yes : sp.no, 'happy', 'ok'); }
    }
  },
  readyn: {
    init: sp => ({ bits: [sp.on], just: 0 }),
    view: (sp, st) => ({ ant: !!sp.on, say: `Jetzt fragst du mich: „${sp.q}“ Ich antworte mit meiner Lampe. Was sage ich?`, body: ltLab('Blinkis Lampe') + ltRow(st.bits, { just: st.just, pulse: st.pulse }) + (st.done ? '' : ltOpts([['ja', 'Ja'], ['nein', 'Nein']])) }),
    act: (sp, st, v, x, m) => {
      if (v !== 'pick' || st.done) return;
      if ((x === 'ja') === !!sp.on) { st.done = st.solved = true; ltSay(st, m, 'blinki', sp.after, 'happy', 'ok'); }
      else { st.pulse = [0]; ltSay(st, m, 'blinki', 'Hm? Wir haben doch abgemacht: <b>AN</b> heißt Ja und <b>AUS</b> heißt Nein. Schau noch mal auf meine Lampe!', 'confused', 'hm'); }
    }
  },
  /* Stufe 2 */
  snack: {
    init: () => ({ n: 1, bits: [0], codes: [], pend: null }),
    view: (sp, st) => {
      const full1 = st.n === 1 && st.codes.length >= 2;
      const ctl = st.done ? '' : st.pend ? '' : full1 ? `<div class="lt-act">${ltB('more', 'Noch eine Lampe!')}</div>` : `<div class="lt-act">${ltB('keep', 'Zeichen merken')}</div>`;
      return {
        ant: st.bits.some(Boolean), say: 'Ich habe Hunger! Ich möchte dir mit meiner Lampe sagen, welchen Snack ich will. Gib jedem Snack ein eigenes Zeichen: Stell die Lampe ein, tippe auf „Zeichen merken“ und dann auf einen Snack.',
        body: ltLab(st.n === 1 ? 'Meine Lampe' : 'Meine Lampen') + ltRow(st.bits, { act: st.done || st.pend ? null : 'lamp', just: st.just, drop: st.drop }) + ctl + ltSnackBtns(st, k => !!st.pend && !st.codes.some(c => c.s === k), st.codes) + ltBook(st.codes, st)
      };
    },
    act: (sp, st, v, x, m) => {
      if (st.done) return;
      if (v === 'lamp' && !st.pend) ltTog(st, x);
      else if (v === 'keep' && !st.pend) {
        const p = st.bits.join(''), ex = st.codes.find(c => c.p === p);
        if (ex) { st.wig = p; ltSay(st, m, 'blinki', `Dieses Zeichen hat schon ${LT_SN[ex.s][2]}. Zwei Snacks mit dem gleichen Zeichen kann ich nicht auseinanderhalten!`, 'confused', 'hm'); }
        else { st.pend = p; ltSay(st, m, 'blinki', 'Welcher Snack bekommt dieses Zeichen?', 'curious'); }
      } else if (v === 'pick' && st.pend && LT_SN[x] && !st.codes.some(c => c.s === x)) {
        st.codes.push({ p: st.pend, s: x }); st.pend = null; ltPlay('pop');
        if (st.codes.length === 4) {
          st.done = st.solved = true; m.codes = st.codes.map(c => ({ p: c.p, s: c.s })); m.ord = ltShuf([0, 1, 2, 3]);
          ltS().snack = m.codes.map(c => ({ p: c.p, s: c.s })); ltAddCode('snack');
          ltSay(st, m, 'blinki', 'Perfekt! Jetzt hat jeder Snack sein eigenes Zeichen. Es steht alles im Codebuch.', 'happy', 'ok');
        } else if (st.n === 1 && st.codes.length === 2) {
          const left = Object.keys(LT_SN).filter(k => !st.codes.some(c => c.s === k)).map(k => LT_SN[k][1]).join(' und ');
          ltSay(st, m, 'blinki', `Oh nein! Mit einer Lampe gibt es nur zwei Zeichen: AN und AUS. Für ${left} ist kein Zeichen mehr übrig!`, 'confused', 'hm');
        } else ltSay(st, m, 'blinki', st.codes.length === 3 ? 'Super! Noch ein Snack.' : 'Prima! Und der nächste Snack?', 'happy');
      } else if (v === 'more' && st.n === 1) {
        st.n = 2; st.bits = [0].concat(st.bits); st.codes.forEach(c => { c.p = '0' + c.p; }); st.drop = 0; ltPlay('pop');
        ltSay(st, m, 'blinki', 'Die neue Lampe kommt links dazu. Deine alten Zeichen bekommen die neue Lampe AUS. Und mit der neuen Lampe AN gibt es neue Zeichen!', 'happy');
      }
    }
  },
  order: {
    init: (sp, m) => { const c = m.codes[m.ord[sp.i % m.codes.length]] || { p: '01', s: 'apfel' }; return { c, bits: c.p.split('').map(Number), just: c.p.indexOf('1') }; },
    view: (sp, st) => ({ ant: true, say: 'Rate mal, was ich jetzt möchte!', body: ltLab('Blinkis Lampen') + ltRow(st.bits, { just: st.just, pulse: st.pulse }) + (st.done ? '' : ltSnackBtns(st, () => true)) + ltBook(ltS().snack.length ? ltS().snack : [], st) }),
    act: (sp, st, v, x, m) => {
      if (v !== 'pick' || st.done || !LT_SN[x]) return;
      if (x === st.c.s) { st.done = st.solved = true; st.glow = null; ltSay(st, m, 'blinki', `Mmh, ${LT_SN[x][3]}! Lecker. Danke!`, 'happy', 'ok'); }
      else { st.glow = st.c.p; ltSay(st, m, 'blinki', `Hm? ${ltCap(LT_SN[x][2])} hat doch ein anderes Zeichen. Schau ins Codebuch!`, 'confused', 'hm'); }
    }
  },
  /* Stufe 3 */
  guessn: {
    view: () => ({ say: 'Jetzt habe ich <b>drei</b> Lampen! Wie viele verschiedene Zeichen kann ich damit machen? Schätz mal – ganz ohne Rechnen.', body: ltRow([0, 0, 0]) + ltOpts(ltRange(3, 12)) }),
    act: (sp, st, v, x, m) => { if (v === 'pick') { m.guess = +x; ltPlay('pop'); return 'next'; } }
  },
  hunt: {
    init: () => ({ bits: [0, 0, 0], found: [] }),
    view: (sp, st) => ({
      ant: st.bits.some(Boolean), say: 'Bau ein Zeichen und tippe auf „Fangen“. Wie viele verschiedene findest du? Wenn du glaubst, du hast alle, tippe auf „Fertig?“.',
      body: ltRow(st.bits, { act: st.done ? null : 'lamp', just: st.just }) + (st.done ? '' : `<div class="lt-act">${ltB('catch', 'Fangen')}${ltB('fertig', 'Fertig?', 'sec')}</div>`) +
        `<div class="lt-cnt">Gefunden: <b>${st.found.length}</b></div><div class="lt-gal">${st.found.map(p => ltCard(p, '', st.wig === p ? 'wig' : st.last === p ? 'new' : '')).join('')}</div>`
    }),
    act: (sp, st, v, x, m) => {
      if (st.done) return;
      if (v === 'lamp') ltTog(st, x);
      else if (v === 'catch') {
        const p = st.bits.join('');
        if (st.found.includes(p)) { st.wig = p; ltSay(st, m, 'blinki', 'Den haben wir schon! Probier ein anderes Zeichen.', 'curious', 'hm'); return; }
        st.found.push(p); st.last = p; ltPlay('pop');
        if (st.found.length === 8) { st.done = st.solved = true; const g = m.guess; ltSay(st, m, 'blinki', `Alle gefunden! Du hast ${g || '?'} geschätzt – es sind <b>8</b>. ${g === 8 ? 'Genau richtig!' : 'Hättest du das gedacht?'}`, 'happy', 'ok'); }
        else ltSay(st, m, 'blinki', st.found.length === 1 ? 'Gefangen! Und noch eins?' : `Schon ${st.found.length}! Weiter so.`, 'happy');
      } else if (v === 'fertig') {
        const q = ltRange(0, 7).map(n => ltBits(n, 3).join('')).find(p => !st.found.includes(p));
        ltSay(st, m, 'blinki', `Ich glaube, da fehlen noch welche. Eins fängt links mit ${ltOnOff(q[0])}, ${ltOnOff(q[1])} an.`, 'curious');
      }
    }
  },
  copy: {
    init: () => ({ ph: 0 }),
    view: (sp, st) => {
      const two = ['00', '01', '10', '11'], mk = (lead, p) => `<span class="lt-minis"><i class="lt-mini nw sk-${ltS().eq.lamp}${lead === '1' ? ' on' : ''}"></i>${p.split('').map(c => `<i class="lt-mini sk-${ltS().eq.lamp}${c === '1' ? ' on' : ''}"></i>`).join('')}</span>`;
      if (!st.ph) return { say: 'Weißt du noch? Mit zwei Lampen gab es <b>4</b> Zeichen. Was passiert, wenn die dritte Lampe dazukommt?', body: `<div class="lt-copy"><div class="lt-grp">${two.map(p => ltMini(p)).join('')}</div></div><div class="lt-act">${ltB('add', 'Dritte Lampe dazu')}</div>` };
      return { ant: true, say: 'Jedes alte Zeichen gibt es jetzt <b>zweimal</b>: einmal mit der neuen Lampe AUS und einmal mit AN. Aus 4 werden 8!', body: `<div class="lt-copy two"><div class="lt-grp"><small>Neue Lampe AUS</small>${two.map(p => mk('0', p)).join('')}</div><div class="lt-grp b"><small>Neue Lampe AN</small>${two.map(p => mk('1', p)).join('')}</div></div><p class="lt-eq">4 + 4 = 8</p>` };
    },
    act: (sp, st, v, x, m) => { if (v === 'add' && !st.ph) { st.ph = 1; st.done = true; ltAddCode('dbl'); m.mood = 'happy'; ltPlay('ok'); } }
  },
  predict: {
    init: () => ({ miss: [] }),
    view: (sp, st) => ({
      who: sp.who, say: sp.q, ant: true,
      body: (sp.show || '') + ((st.done || (st.miss.length && sp.afterWrong)) && sp.after ? sp.after : '') + (st.done ? '' : ltOpts(sp.opts, st.miss))
    }),
    act: (sp, st, v, x, m) => {
      if (v !== 'pick' || st.done) return;
      if (String(sp.ans) === x) { st.done = st.solved = true; if (sp.code) ltAddCode(sp.code); ltSay(st, m, sp.who || 'blinki', sp.ok, 'happy', 'ok'); }
      else { st.miss.push(x); ltSay(st, m, 'blinki', typeof sp.no === 'function' ? sp.no(+x) : sp.no, 'curious', 'hm'); }
    }
  },
  /* Stufe 4 und 5 */
  factory: {
    init: sp => ({ v: sp.start }),
    view: (sp, st) => {
      const f = ltFac(sp, st.v), fi = sp.vals.indexOf(null);
      const stepper = i => i === fi && !st.done ? `<div class="lt-stepper"><button data-act="ltDo" data-arg="minus" ${st.v <= sp.min ? 'disabled' : ''} aria-label="Ein Punkt weniger">−</button><button data-act="ltDo" data-arg="plus" ${st.v >= sp.max ? 'disabled' : ''} aria-label="Ein Punkt mehr">+</button></div>` : '';
      const parts = [];
      if (f.dup) parts.push(`Die ${f.dup} kann ich auf zwei Arten schicken. Verschwendet!`);
      if (f.gap) parts.push(`Die ${f.gap} kann ich gar nicht schicken – eine Lücke!`);
      if (!f.gap && !f.dup && sp.need && f.sum < sp.need) parts.push(`Die ${f.sum + 1} kann ich nicht schicken.`);
      const stat = st.done ? `Jede Zahl von 1 bis ${f.sum} genau einmal!` : (parts.join(' ') + (sp.line > 3 ? ` Ohne Lücke komme ich bis ${f.reach}.` : ''));
      return {
        ant: true, say: sp.intro,
        body: ltRow(f.vals.map(() => 1), { vals: f.vals, mode: 'dots', showVal: true, under: stepper, cls: 'mine fac' }) + `<div class="lt-lab">Welche Zahlen kann ich schicken?</div>` + ltLine(sp.line, f.cnt, f.sum) + `<p class="lt-stat${st.done ? ' ok' : ''}">${stat}</p>`
      };
    },
    act: (sp, st, v, x, m) => {
      if (st.done || (v !== 'plus' && v !== 'minus')) return;
      st.v = Math.max(sp.min, Math.min(sp.max, st.v + (v === 'plus' ? 1 : -1)));
      const f = ltFac(sp, st.v), fi = sp.vals.indexOf(null);
      st.just = fi; ltPlay('pop');
      if (f.ok && (!sp.need || f.sum >= sp.need)) { st.done = st.solved = true; ltSay(st, m, 'blinki', sp.ok, 'happy', 'ok'); }
      else { st.msg = ''; m.mood = 'curious'; }
    }
  },
  send: {
    init: sp => ({ bits: sp.vals.map(() => 0), miss: 0, got: null }),
    view: (sp, st, m) => {
      const sum = ltSum(st.bits, sp.vals);
      return {
        who: sp.intro ? 'blinki' : 'lumi', ant: st.bits.some(Boolean), bowl: st.got == null ? 0 : st.got,
        say: sp.intro || `Schick mir <b>${sp.t}</b> ${sp.t === 1 ? 'Stern' : 'Sterne'}!`,
        body: (sp.sky ? `<div class="lt-sky" aria-label="Lumis Himmel: ${m.stars} von ${sp.sky} Sternen">${'<i class="on">★</i>'.repeat(m.stars)}${'<i>★</i>'.repeat(Math.max(0, sp.sky - m.stars))}</div>` : '') +
          ltRow(st.bits, { vals: sp.vals, mode: 'dots', showVal: sp.vals.length > 1, act: st.done ? null : 'lamp', just: st.just, pulse: st.pulse }) +
          `<div class="lt-live">Leuchtpunkte an: <b>${sum}</b></div>` + (st.done ? '' : `<div class="lt-act">${ltB('send', 'Senden')}</div>`)
      };
    },
    act: (sp, st, v, x, m) => {
      if (st.done) return;
      if (v === 'lamp') { ltTog(st, x); if (st.miss) st.msg = ''; }
      else if (v === 'send') {
        const sum = ltSum(st.bits, sp.vals), d = sum - sp.t;
        if (!d) { st.done = st.solved = true; st.got = sum; m.fx = { fly: true }; m.stars++; ltSay(st, m, 'lumi', sp.okMsg || `Danke! ${sum === 1 ? 'Ein Stern' : sum + ' Sterne'} für meinen Himmel.`, 'happy', 'ok'); return; }
        st.miss++;
        const pi = d > 0 ? st.bits.findIndex((b, i) => b && sp.vals[i] === d) : st.bits.findIndex((b, i) => !b && sp.vals[i] === -d);
        st.pulse = pi >= 0 ? [pi] : null;
        ltSay(st, m, 'lumi', (sum === 0 ? 'Bei mir ist nichts angekommen. Mach Lampen an!' : `Ich habe ${sum}. Ich wollte ${sp.t} – das sind ${Math.abs(d)} zu ${d > 0 ? 'viel' : 'wenig'}.`) + (st.miss >= 2 && sp.tipAuto ? `<br><small>${sp.tipAuto}</small>` : ''), 'curious', 'hm');
      }
    }
  },
  /* Stufe 7 */
  readnum: {
    init: sp => ({ bits: ltBits(sp.t, 4) }),
    view: (sp, st) => ({
      who: 'lumi', say: sp.dots ? 'Ich schicke dir eine Zahl. Wie viele Sterne sind es?' : 'Jetzt ohne Punkte! Die kleinen Zahlen sagen, was jede Lampe wert ist. Welche Zahl schicke ich?',
      body: ltLab('Lumis Lampen') + ltRow(st.bits, { vals: LT_V4, cls: 'lumi', mode: sp.dots ? 'dots' : 'plain', showVal: true, act: st.done ? null : 'whis', pulse: st.pulse }) +
        (st.done ? '' : `<div class="lt-pad">${ltRange(1, 15).map(n => `<button class="lt-num" data-act="ltDo" data-arg="pick:${n}">${n}</button>`).join('')}</div>`)
    }),
    act: (sp, st, v, x, m) => {
      if (st.done) return;
      if (v === 'whis') { const i = +x; if (i >= 0 && i < 4) ltSay(st, m, 'lumi', `Psst … diese Lampe ist <b>${LT_V4[i]}</b> wert. Gerade ist sie ${st.bits[i] ? 'AN' : 'AUS'}.`, 'curious', null); }
      if (v === 'pick') {
        if (+x === sp.t) { st.done = st.solved = true; ltSay(st, m, 'lumi', `Richtig! ${ltExpr(st.bits, LT_V4)} = <b>${sp.t}</b>.`, 'happy', 'ok'); }
        else {
          let run = 0; const steps = []; st.bits.forEach((b, i) => { if (b) { run += LT_V4[i]; steps.push(run); } });
          st.pulse = st.bits.map((b, i) => b ? i : -1).filter(i => i >= 0);
          ltSay(st, m, 'blinki', `Hm, nicht ganz. Lass uns zusammen zählen – nur die Lampen, die leuchten: ${steps.join(' … ')}.`, 'curious', 'hm');
        }
      }
    }
  },
  /* Stufe 8 */
  morph: {
    init: () => ({ mor: [false, false, false, false] }),
    view: (sp, st) => ({
      ant: true, say: 'Ich schreibe Lumi einen Brief. Aber Lampen malen dauert ewig! Meine Idee: Für eine Lampe, die AN ist, schreibe ich einen Strich: <b>1</b>. Für eine Lampe, die AUS ist, einen Kreis: <b>0</b>. Tippe auf jede Lampe!',
      body: ltRow(sp.bits, { vals: LT_V4, mode: 'dots', showVal: true, morph: st.mor, act: st.done ? null : 'm', just: st.just }) + `<div class="lt-digits">${sp.bits.map((b, i) => `<span class="${st.mor[i] ? 'on' : ''}">${st.mor[i] ? b : '·'}</span>`).join('')}</div>`
    }),
    act: (sp, st, v, x, m) => {
      const i = +x; if (v !== 'm' || st.done || !(i >= 0 && i < 4) || st.mor[i]) return;
      st.mor[i] = true; st.just = i; ltPlay('pop');
      if (st.mor.every(Boolean)) { st.done = st.solved = true; ltSay(st, m, 'blinki', `Aus Lampen werden Ziffern! <b>${sp.bits.join('')}</b> heißt: ${ltExpr(sp.bits, LT_V4)} = ${ltSum(sp.bits, LT_V4)}.`, 'happy', 'ok'); }
    }
  },
  todig: {
    init: () => ({ d: [null, null, null, null], bad: [] }),
    view: (sp, st) => ({
      ant: true, say: 'Schreib dieses Zeichen in Ziffern! Tippe auf die Felder: AN wird <b>1</b>, AUS wird <b>0</b>.',
      body: ltRow(sp.bits, { vals: LT_V4, mode: 'dots', showVal: true, pulse: st.pulse }) +
        `<div class="lt-slots">${st.d.map((d, i) => `<button class="lt-slot${st.bad.includes(i) ? ' bad' : ''}${d != null ? ' set' : ''}" data-act="ltDo" data-arg="slot:${i}" ${st.done ? 'disabled' : ''} aria-label="Ziffer ${i + 1}: ${d == null ? 'leer' : d}">${d == null ? '?' : d}</button>`).join('')}</div>` +
        (st.done ? '' : `<div class="lt-act">${ltB('chk', 'Prüfen')}</div>`)
    }),
    act: (sp, st, v, x, m) => {
      if (st.done) return;
      if (v === 'slot') { const i = +x; if (i >= 0 && i < 4) { st.d[i] = st.d[i] == null ? 1 : (st.d[i] ? 0 : 1); st.bad = st.bad.filter(j => j !== i); ltPlay('pop'); } }
      if (v === 'chk') {
        if (st.d.includes(null)) { ltSay(st, m, 'blinki', 'Fülle erst alle vier Felder aus.', 'curious'); return; }
        st.bad = st.d.map((d, i) => d !== sp.bits[i] ? i : -1).filter(i => i >= 0);
        if (st.bad.length) { st.pulse = st.bad.slice(); ltSay(st, m, 'blinki', 'Fast! Schau auf die Lampe über dem roten Feld: Ist sie AN oder AUS?', 'confused', 'hm'); }
        else { st.done = st.solved = true; ltSay(st, m, 'blinki', `Genau! <b>${sp.bits.join('')}</b> – das sind ${ltExpr(sp.bits, LT_V4)} = ${ltSum(sp.bits, LT_V4)}.`, 'happy', 'ok'); }
      }
    }
  },
  tolamp: {
    init: () => ({ bits: [0, 0, 0, 0] }),
    view: (sp, st) => ({
      who: 'lumi', ant: st.bits.some(Boolean), say: `Ich schreibe dir: <b>${sp.bits.join('')}</b>. Stell deine Lampen so ein!`,
      body: `<div class="lt-bigd">${sp.bits.join('')}</div>` + ltRow(st.bits, { vals: LT_V4, mode: 'dots', showVal: true, act: st.done ? null : 'lamp', just: st.just, pulse: st.pulse, under: i => `<span class="lt-udig">${sp.bits[i]}</span>` }) +
        (st.done ? '' : `<div class="lt-act">${ltB('chk', 'Prüfen')}</div>`)
    }),
    act: (sp, st, v, x, m) => {
      if (st.done) return;
      if (v === 'lamp') ltTog(st, x);
      if (v === 'chk') {
        const bad = st.bits.map((b, i) => b !== sp.bits[i] ? i : -1).filter(i => i >= 0);
        if (bad.length) { st.pulse = bad; ltSay(st, m, 'blinki', 'Fast! Die blinkende Lampe passt noch nicht zu der Ziffer darunter.', 'confused', 'hm'); }
        else { st.done = st.solved = true; ltSay(st, m, 'lumi', `Richtig! <b>${sp.bits.join('')}</b> = ${ltExpr(sp.bits, LT_V4)} = ${ltSum(sp.bits, LT_V4)}.`, 'happy', 'ok'); }
      }
    }
  },
  trap: {
    init: () => ({ bits: [0, 0, 0] }),
    view: (sp, st) => ({
      ant: true, say: 'Lumi hat mir geschrieben: <b>101</b>. Ist das … Hunderteins?! Was meint Lumi?',
      body: `<div class="lt-bigd">101</div>` + ltRow(st.bits, { vals: [4, 2, 1], mode: 'dots', showVal: true, just: st.just, under: i => st.done ? `<span class="lt-udig">${'101'[i]}</span>` : '' }) + (st.done ? '' : ltOpts([['hundert', 'Hunderteins'], ['fuenf', 'Fünf'], ['eins', 'Eins']]))
    }),
    act: (sp, st, v, x, m) => {
      if (v !== 'pick' || st.done) return;
      st.bits = [1, 0, 1]; st.just = 0; st.done = st.solved = true;
      if (x === 'fuenf') ltSay(st, m, 'blinki', 'Genau! <b>1 0 1</b> heißt: Lampe 4 AN, Lampe 2 AUS, Lampe 1 AN. 4 + 1 = 5.', 'happy', 'ok');
      else if (x === 'hundert') ltSay(st, m, 'lumi', 'Haha, nein! In Lampensprache ist <b>101</b> eine 5: Lampe 4 AN, Lampe 2 AUS, Lampe 1 AN. 4 + 1 = 5.', 'laugh', 'ok');
      else ltSay(st, m, 'blinki', 'Fast! Da sind aber zwei Einsen: Lampe 4 AN und Lampe 1 AN. 4 + 1 = 5.', 'curious', 'ok');
    }
  }
};

/* ---------- Stufen ---------- */
const LT_ASKQ = [
  { q: 'Soll ich das Fenster aufmachen?', yes: 'Ahh, frische Nachtluft! Meine Antenne wackelt im Wind.', no: 'Gut, dann bleibt es hier oben schön warm.' },
  { q: 'Magst du Sterne?', yes: 'Ich auch! Von hier oben sehe ich ganz viele.', no: 'Schade! Vielleicht zeige ich dir bald die schönsten.' },
  { q: 'Soll ich dir bald meinen Freund Lumi vorstellen? Er wohnt im Turm gegenüber.', yes: 'Juhu! Lumi freut sich schon.', no: 'Okay, vielleicht später. Lumi ist sehr nett!' }
];
/* gemischte Zahlen 1–15: drei kleine (1–8), drei große (9–15) */
const ltMix = () => { const s = ltShuf(ltRange(1, 8)), b = ltShuf(ltRange(9, 15)); return [s[0], s[1], b[0], s[2], b[1], b[2]]; };
const ltValueQ = n => {
  const bits = ltBits(n, 4), d = bits.join(''), wrong = ltShuf([+d.replace(/^0+/, '') || 0, n + 1 <= 15 ? n + 1 : n - 1, ltSum(bits.slice().reverse(), LT_V4)].filter((x, i, a) => x !== n && a.indexOf(x) === i)).slice(0, 3);
  return {
    k: 'predict', q: `Welche Zahl ist <b>${d}</b> in Lampensprache?`, opts: ltShuf([n].concat(wrong)), ans: n, afterWrong: true,
    show: `<div class="lt-bigd">${d}</div>`, after: ltRow(bits, { vals: LT_V4, mode: 'dots', showVal: true, under: i => `<span class="lt-udig">${d[i]}</span>` }),
    ok: `Richtig: ${ltExpr(bits, LT_V4)} = ${n}.`,
    no: x => String(x) === d.replace(/^0+/, '') ? 'So würde man das in unseren normalen Zahlen lesen. In Lampensprache ist jede Stelle eine Lampe – schau sie dir an!' : 'Schau dir die Lampen an: Welche leuchten, und was sind sie wert?'
  };
};
const LT_BUILD = {
  1: () => [{ k: 'meaning' }, { k: 'deal' }].concat(LT_ASKQ.map(q => Object.assign({ k: 'ask' }, q)), [
    { k: 'readyn', q: 'Hast du Hunger?', on: 1, after: 'Genau, Ja! Ich hätte gern einen Snack.' },
    { k: 'readyn', q: 'Bist du müde?', on: 0, after: 'Genau, Nein! Ich bin hellwach.' }]),
  2: () => [{ k: 'snack' }, { k: 'order', i: 0 }, { k: 'order', i: 1 }, { k: 'order', i: 2 }],
  3: () => [{ k: 'guessn' }, { k: 'hunt', tip: 'Tipp: Geh der Reihe nach vor. Lass die linke Lampe AUS und probier alles mit den anderen zwei. Dann dasselbe mit der linken Lampe AN.' }, { k: 'copy' },
    { k: 'predict', q: 'Und mit <b>vier</b> Lampen? Wie viele Zeichen gibt es dann?', opts: [8, 10, 12, 16, 20], ans: 16, ok: '16! Die 8 Zeichen gibt es einmal mit der neuen Lampe AUS und einmal mit AN.', no: 'Denk an die neue Lampe: Jedes der 8 alten Zeichen gibt es einmal mit ihr AUS und einmal mit ihr AN.' },
    { k: 'predict', q: 'Und mit <b>fünf</b> Lampen?', opts: [20, 24, 30, 32, 40], ans: 32, ok: '32! Jede neue Lampe verdoppelt: 2, 4, 8, 16, 32.', no: 'Fast! Nimm die 16 Zeichen von vier Lampen – einmal mit der neuen Lampe AUS, einmal mit AN.' }],
  4: () => [
    { k: 'send', vals: [1], t: 1, intro: 'Das ist <b>Lumi</b>, mein Freund im Turm gegenüber! Lumi sammelt Sterne. Meine Lampe hat jetzt einen <b>Leuchtpunkt</b>. Wenn sie leuchtet, fliegt der Punkt zu Lumi. Mach sie an und tippe auf „Senden“!', okMsg: 'Danke! Ein Stern für meinen Himmel.' },
    { k: 'factory', vals: [null, 1], start: 1, min: 1, max: 5, line: 3, need: 3, intro: 'Lumi möchte 1, 2 oder 3 Sterne bekommen können. Die rechte Lampe hat 1 Punkt. Wie viele Punkte braucht die linke Lampe, damit jede Zahl genau einmal klappt? Stell es mit − und + ein.', ok: 'Keine Lücke! Mit 2 und 1 kann ich 1, 2 und 3 schicken – jede Zahl genau einmal.', tip: 'Tipp: Die 1 schafft die rechte Lampe schon allein. Welche Zahl ist die nächste, die noch fehlt?' },
    { k: 'send', vals: [2, 1], t: 3 }, { k: 'send', vals: [2, 1], t: 2 }],
  5: () => [
    { k: 'factory', vals: [null, 2, 1], start: 3, min: 1, max: 9, line: 10, intro: 'Lumi hat noch mehr Sterne! Eine dritte Lampe kommt links dazu. Wie viele Punkte bekommt sie, damit wir möglichst weit ohne Lücke kommen – und jede Zahl nur einmal?', ok: '1 bis 7 – jede Zahl genau einmal. Perfekt!', tip: 'Tipp: Mit 2 und 1 komme ich schon bis 3. Welche Zahl fehlt als Nächstes?' },
    { k: 'talk', code: 'wert', bits: [1, 1, 1], vals: [4, 2, 1], mode: 'dots', showVal: true, say: 'Schau mal: 4 + 2 + 1 = 7. Für die 8 braucht es eine neue Lampe. Die neue Lampe ist immer <b>eins mehr</b> als alle anderen zusammen. Und siehst du das Muster? 1, 2, 4 – jede Lampe ist <b>doppelt</b> so viel wert wie die rechts daneben. Wie bei den Zeichen in Stufe 3!', html: '<p class="lt-eq">4 + 2 + 1 = 7 → die nächste Lampe: 8</p>' },
    { k: 'predict', q: 'Wie viele Punkte bekommt Lampe Nummer 4?', opts: [5, 6, 7, 8, 9, 10], ans: 8, ok: 'Genau, 8! Jetzt geht es ohne Lücke von 1 bis 15.', after: ltLine(15, Object.fromEntries(ltRange(1, 15).map(n => [n, 1])), 15), no: x => x < 8 ? `Mit ${x} könnte ich die ${x} zweimal schicken: mit der neuen Lampe und mit den alten. Verschwendet!` : `Mit ${x} fehlt die 8 – da wäre eine Lücke.` },
    { k: 'predict', q: 'Und Lampe Nummer 5?', opts: [9, 12, 15, 16, 20], ans: 16, ok: '16! Immer doppelt so viel: 1, 2, 4, 8, 16.', no: x => x < 16 ? `Mit ${x} gäbe es eine Zahl doppelt. Die vier Lampen zusammen sind schon 15 …` : `Mit ${x} fehlt die 16. Die vier Lampen zusammen sind 15 – welche Zahl kommt danach?` }],
  6: rep => (rep ? ltMix() : [5, 6, 3, 9, 12, 15]).map(t => ({ k: 'send', vals: LT_V4, t, sky: 6, tip: 'Tipp: Fang mit der größten Lampe an, die noch passt. Dann schau, was noch fehlt.', tipAuto: 'Fang mit der größten Lampe an, die noch passt.' })),
  7: rep => (rep ? ltMix() : [6, 9, 3, 12, 7, 13]).map((t, i) => ({ k: 'readnum', t, dots: i < 3 })),
  8: rep => {
    const r = rep ? ltShuf(ltRange(1, 15)) : [10, 12, 7, 9, 6, 11, 12, 7];
    const tip = 'Tipp: Eine leuchtende Lampe wird zur 1, eine dunkle zur 0. Geh von links nach rechts.';
    return [{ k: 'morph', bits: [0, 1, 0, 1] }]
      .concat(r.slice(0, 3).map(n => ({ k: 'todig', bits: ltBits(n, 4), tip })), r.slice(3, 6).map(n => ({ k: 'tolamp', bits: ltBits(n, 4), tip: 'Tipp: Unter jeder Lampe steht ihre Ziffer. Bei 1 muss die Lampe AN sein, bei 0 AUS.' })), [
        { k: 'trap' },
        { k: 'talk', code: 'bit', say: 'Jetzt kennst du ein Geheimnis von Computern! Jede Lampe heißt <b>Bit</b>. Eine Zahl aus Bits heißt <b>Binärzahl</b>. „Binär“ heißt: zwei Möglichkeiten – 0 oder 1. In deinem Tablet stecken Milliarden winziger Schalter, die genau so AN und AUS sind.', html: '<div class="lt-terms"><span><b>1</b> = AN</span><span><b>0</b> = AUS</span><span><b>Bit</b> = eine Lampe</span><span><b>Binärzahl</b> = Zahl aus Bits</span></div>' }],
        r.slice(6, 8).map(ltValueQ));
  }
};
