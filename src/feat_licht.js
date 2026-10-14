/* =====================================================================
   BLINKIS LICHTERTURM (in Meine Welt, von den Eltern einschaltbar)
   Binärzahlen ohne Mathe-Gefühl: Blinki kann nur mit Lampen sprechen (AN / AUS), das Kind ist sein Übersetzer.
   Eine Idee pro Stufe: zwei Zustände → mehr Lampen, mehr Zeichen (Verdoppeln) → Lampen bekommen Punkte 1, 2, 4, 8 → Zahlen schicken
   und bewegen → AN = 1, AUS = 0 → Lichtbilder. Acht direkte Experimente ohne Antwortauswahl.
   Belohnung NUR hier: Lichtpunkte → Werkstatt (Turm-Deko, Lampen-Looks, Lampen-Klänge, Blinki-Outfits, Sternbilder). Keine Münzen, Sticker, Pokale.
   Töne der Lampen sind standardmäßig AUS (eigener Schalter; die App-weite Ton-Einstellung gilt zusätzlich).
   Gespeichert: S.licht = { lv (höchste offene Stufe), done{n:{ts,hints}}, lp, lpLife, own{'cat.id':ts}, eq{lamp,snd,out}, snd, code[], snack[], rep{d,n} }
   Stufen und Schritte: feat_lichtlv.js
   ===================================================================== */
const ltTop = (title, back) => topBar(title, back, `<button class="btn sec lt-notes" data-act="nzOpen" aria-label="Notizbuch öffnen">${ico('notebook', 20)}</button>`);
const LT_MAX = 8;
const LT_LV = [
  { t: 'Die Lichtbrücke', s: 'Ein Schalter verändert die Welt', c: 'AN und AUS sind zwei klare Zustände. Beide können etwas mitteilen.', nx: '' },
  { t: 'Die Lichtpost', s: 'Zwei Schalter, vier Ziele', c: 'Zwei Schalter ergeben vier verschiedene Muster. Auch AUS–AUS gehört dazu.', nx: '' },
  { t: 'Der Mustersammler', s: 'Jede neue Lampe verdoppelt', c: 'Mit einer neuen Lampe gibt es jedes alte Muster zweimal: einmal mit ihr AUS und einmal AN.', nx: '' },
  { t: 'Deine Vorratsmaschine', s: 'Mengen ohne Lücken bauen', c: 'Mit den Vorräten 2 und 1 kannst du jede Menge von 0 bis 3 genau einmal bauen.', nx: '' },
  { t: 'Immer weiterbauen', s: '1, 2, 4, 8, 16 entdecken', c: 'Der neue Vorrat beginnt bei der ersten fehlenden Menge. Darum verdoppeln sich die Werte: 1, 2, 4, 8, 16.', nx: '' },
  { t: 'Lumis Sternenschachtel', s: 'Eine Menge mit Licht schicken', c: 'Die leuchtenden Vorräte werden zusammengezählt. 4 und 1 ergeben 5.', nx: '' },
  { t: 'Lumis Lichtbahn', s: 'Ein Muster wird Bewegung', c: 'Die Positionen haben unterschiedliche Werte. Das Spiel liest dein Muster als Strecke.', nx: '' },
  { t: 'Zeichen und Lichtbilder', s: 'Aus Schaltern werden Bits', c: 'AN schreiben wir als 1, AUS als 0. Ein solcher Platz heißt Bit. Computer verwenden zwei unterscheidbare Signalzustände. Ein Programm bestimmt, ob ein Muster eine Zahl oder ein Bild beschreibt.', nx: '' }
];
const LT_SHOP = [
  { cat: 'deco', n: 'Turm-Deko', s: 'Schmückt deinen Turm.', items: [{ id: 'laterne', n: 'Laterne', p: 10 }, { id: 'wimpel', n: 'Wimpel', p: 12 }, { id: 'blumen', n: 'Blumenkasten', p: 15 }, { id: 'kette', n: 'Lichterkette zu Lumi', p: 20 }, { id: 'teleskop', n: 'Teleskop', p: 25 }, { id: 'garten', n: 'Dachgarten', p: 30 }] },
  { cat: 'lamp', n: 'Lampen-Looks', s: 'So leuchten alle Lampen im Turm.', eq: true, items: [{ id: 'std', n: 'Bernstein', p: 0 }, { id: 'ff', n: 'Glühwürmchen', p: 20 }, { id: 'kerze', n: 'Kerzenlicht', p: 20 }, { id: 'kri', n: 'Kristall', p: 25 }, { id: 'mond', n: 'Mondlicht', p: 30 }] },
  { cat: 'snd', n: 'Lampen-Klänge', s: 'So klingen die Lampen, wenn der Ton an ist.', eq: true, items: [{ id: 'std', n: 'Sanft', p: 0 }, { id: 'glocke', n: 'Glöckchen', p: 15 }, { id: 'marimba', n: 'Marimba', p: 15 }, { id: 'harfe', n: 'Harfe', p: 20 }] },
  { cat: 'out', n: 'Blinki-Outfits', s: 'Was Blinki trägt.', eq: true, items: [{ id: 'none', n: 'Ohne', p: 0 }, { id: 'fliege', n: 'Fliege', p: 12 }, { id: 'schal', n: 'Schal', p: 15 }, { id: 'muetze', n: 'Mütze', p: 20 }, { id: 'regen', n: 'Regenbogen-Antenne', p: 25 }] },
  { cat: 'sky', n: 'Sternbilder', s: 'Leuchten über dem Turm.', items: [{ id: 'krone', n: 'Blinkis Krone', p: 20 }, { id: 'drache', n: 'Lumis Drache', p: 20 }, { id: 'loewe', n: 'Kleiner Löwe', p: 25 }, { id: 'komet', n: 'Komet', p: 30 }] }
];
const LT_EQDEF = { lamp: 'std', snd: 'std', out: 'none' };

function ltS() {
  const p = (S.licht && typeof S.licht === 'object' && !Array.isArray(S.licht)) ? S.licht : (S.licht = {});
  if (!(p.lv >= 1)) p.lv = 1; if (p.lv > LT_MAX) p.lv = LT_MAX;
  ['done', 'own', 'eq'].forEach(k => { if (!p[k] || typeof p[k] !== 'object' || Array.isArray(p[k])) p[k] = {}; });
  Object.keys(LT_EQDEF).forEach(k => { if (!p.eq[k]) p.eq[k] = LT_EQDEF[k]; });
  if (!(p.lp >= 0)) p.lp = 0; if (!(p.lpLife >= 0)) p.lpLife = 0;
  if (typeof p.snd !== 'boolean') p.snd = false;
  if (!Array.isArray(p.code)) p.code = [];
  if (!Array.isArray(p.snack)) p.snack = [];
  if (!p.rep || typeof p.rep !== 'object') p.rep = { d: '', n: 0 };
  return p;
}
const ltDoneN = () => Object.keys(ltS().done).filter(k => +k >= 1 && +k <= LT_MAX).length;
const ltSub = () => { const n = ltDoneN(); return n ? `${n} von ${LT_MAX} Stufen` : 'Sprechen mit Licht'; };
const ltOwn = (cat, id) => { const it = (LT_SHOP.find(c => c.cat === cat) || { items: [] }).items.find(x => x.id === id); return !!it && (it.p === 0 || !!ltS().own[cat + '.' + id]); };
function ltAddCode(k) { const p = ltS(); if (!p.code.includes(k)) { p.code.push(k); save(); } }

/* ---------- Töne (nur wenn der Lichterturm-Ton AN ist; die App-Einstellung „Töne aus“ gilt immer) ---------- */
const LT_NOTE = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093, 2637];
function ltTone(f, t0, d, set, vol) {
  const s = set || ltS().eq.snd || 'std', v = vol || .09;
  if (s === 'glocke') { tone(f * 2, t0, d * 1.6, 'sine', v * .9); tone(f * 4, t0, d * .7, 'sine', v * .25); }
  else if (s === 'marimba') { tone(f, t0, Math.min(d, .16), 'triangle', v * 1.3); tone(f * 4, t0, .05, 'sine', v * .3); }
  else if (s === 'harfe') { tone(f, t0, d * 2.2, 'triangle', v * .8); tone(f * 1.5, t0 + .04, d * 1.6, 'sine', v * .3); }
  else tone(f, t0, d, 'sine', v);
}
function ltPlay(k, i, force) {
  if (!force && !ltS().snd) return;
  try {
    const n = x => LT_NOTE[Math.max(0, Math.min(LT_NOTE.length - 1, x))];
    if (k === 'on') ltTone(n(i || 0), 0, .22);
    else if (k === 'off') ltTone(n(i || 0) / 2, 0, .12, null, .05);
    else if (k === 'ok') [0, 2, 4].forEach((x, j) => ltTone(n(x), j * .09, .3));
    else if (k === 'big') [0, 1, 2, 3].forEach((x, j) => ltTone(n(x), j * .1, .4));
    else if (k === 'pop') ltTone(n(3), 0, .1);
    else if (k === 'plink') ltTone(n(5), 0, .08, null, .06);
    else if (k === 'hm') { tone(330, 0, .14, 'sine', .07); tone(294, .12, .2, 'sine', .07); }
  } catch (e) { }
}

/* ---------- Figuren (Blinki und Lumi) ---------- */
let ltSvgId = 0;
function ltBotG(mood, out, ant, variant) {
  const id = 'lt-shell-' + (++ltSvgId), lumi = variant === 'lumi';
  const eye = lumi ? '#e9d5fb' : '#b7f2d7', shell = lumi ? '#e8def1' : '#e5eddb';
  const shade = lumi ? '#b9a4d0' : '#a7c6b3', accent = lumi ? '#ceacef' : '#ffd76a';
  const lit = ant ? accent : '#718c83', happy = mood === 'happy' || mood === 'laugh';
  const eyes = happy
    ? `<path d="M34 56q5-7 10 0M56 56q5-7 10 0" fill="none" stroke="${eye}" stroke-width="3.5" stroke-linecap="round"/>`
    : `<rect x="34" y="${mood === 'curious' ? 47 : 49}" width="9" height="${mood === 'curious' ? 15 : 12}" rx="4.5" fill="${eye}"/><rect x="57" y="49" width="9" height="${mood === 'confused' ? 8 : 12}" rx="4.5" fill="${eye}"/>`;
  const outfit = out === 'schal' ? '<path d="M22 76q28 9 56 0v9q-28 8-56 0z" fill="#e9926e"/><path d="M63 84v15h9V82" fill="#e9926e"/>'
    : out === 'fliege' ? '<path d="M38 77l12 6-12 6zM62 77l-12 6 12 6z" fill="#d77381"/><circle cx="50" cy="83" r="3" fill="#b65468"/>'
    : out === 'muetze' ? '<path d="M19 34q2-25 31-25t31 25" fill="#7198b2"/><rect x="17" y="28" width="66" height="9" rx="4.5" fill="#4a708b"/>' : '';
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${shell}"/><stop offset="1" stop-color="${shade}"/></linearGradient>${out === 'regen' ? `<linearGradient id="${id}-rainbow"><stop stop-color="#f6a79c"/><stop offset=".35" stop-color="#f2ce85"/><stop offset=".7" stop-color="#a8d9b6"/><stop offset="1" stop-color="#b6bcec"/></linearGradient>` : ''}</defs>
    <ellipse cx="50" cy="108" rx="29" ry="3" fill="#071e22" opacity=".15"/>
    <path d="M37 27v-7q0-12 13-12t13 12v7" fill="none" stroke="${shade}" stroke-width="4"/>
    <path d="M50 20V9" stroke="${shell}" stroke-width="3"/>
    ${ant ? `<circle cx="50" cy="8" r="9" fill="${accent}" opacity=".15"/>` : ''}<circle cx="50" cy="8" r="4.5" fill="${out === 'regen' ? 'url(#' + id + '-rainbow)' : lit}"/>
    <path d="${happy ? 'M19 70Q5 64 8 52M81 70q14-6 11-18' : 'M19 71Q8 72 10 84M81 71q11 1 9 13'}" fill="none" stroke="${shade}" stroke-width="7" stroke-linecap="round"/>
    <rect x="30" y="96" width="14" height="9" rx="4.5" fill="${shade}"/><rect x="56" y="96" width="14" height="9" rx="4.5" fill="${shade}"/>
    <rect x="17" y="26" width="66" height="72" rx="23" fill="url(#${id})" stroke="${shell}" stroke-width="1.5"/>
    <path d="M26 40q3-7 12-7h24" fill="none" stroke="white" stroke-opacity=".65" stroke-width="2" stroke-linecap="round"/>
    <rect x="25" y="40" width="50" height="30" rx="13" fill="#173637"/>
    <path d="M32 44h36" stroke="#355958" stroke-width="2" stroke-linecap="round"/>
    ${eyes}<rect x="37" y="78" width="26" height="11" rx="5.5" fill="#173637" fill-opacity=".13"/>
    <circle cx="44" cy="83.5" r="2" fill="${lit}"/><path d="M51 83.5h5" stroke="#496e62" stroke-width="2" stroke-linecap="round"/>
    ${outfit}`;
}
const ltBot = (mood, ant, cls) => `<svg class="lt-bot ${cls || ''} m-${mood || 'idle'}" viewBox="0 0 100 112" role="img" aria-label="Blinki">${ltBotG(mood, ltS().eq.out, ant)}</svg>`;
function ltLumiG(mood) { return ltBotG(mood, '', true, 'lumi'); }
const ltLumi = (mood, cls) => `<svg class="lt-bot lt-lumi ${cls || ''} m-${mood || 'idle'}" viewBox="0 0 100 112" role="img" aria-label="Lumi">${ltLumiG(mood)}</svg>`;

/* ---------- Lampen ---------- */
/* bits: [0|1] von links nach rechts (größter Wert links). o: {vals, mode:'plain'|'dots'|'digit', act, cls, just, pulse:[i], showVal, morph:[bool], under:i=>html, drop, dim} */
function ltRow(bits, o) {
  o = o || {};
  const n = bits.length, vals = o.vals || bits.map((b, i) => 2 ** (n - 1 - i)), sk = ltS().eq.lamp || 'std';
  return `<div class="lt-row ${o.cls || 'mine'}" data-count="${n}" style="--lt-count:${n}">${bits.map((b, i) => {
    const v = vals[i], dig = (o.morph && o.morph[i]) || o.mode === 'digit', mode = dig ? 'digit' : (o.mode || 'plain');
    let inner = '';
    if (mode === 'dots' && v > 0) inner = `<span class="lt-dots${v > 8 ? ' sm' : ''}">${'<i class="lt-dot"></i>'.repeat(v)}</span>`;
    else if (mode === 'digit') inner = `<span class="lt-dig">${b ? 1 : 0}</span>`;
    const cls = ['lt-lamp', 'sk-' + sk, b ? 'on' : '', o.just === i ? (b ? 'just' : 'cool') : '', o.pulse && o.pulse.includes(i) ? 'pulse' : '', dig ? 'dg' : '', o.drop === i ? 'drop' : '', o.act ? 'tap' : ''].filter(Boolean).join(' ');
    const lab = `Lampe${(mode === 'dots' || o.showVal) && v ? ' ' + v : ''}: ${b ? 'AN' : 'AUS'}`;
    const el = o.act ? `<button class="${cls}" data-act="ltDo" data-arg="${o.act}:${i}" aria-pressed="${!!b}" aria-label="${lab}">` : `<div class="${cls}" role="img" aria-label="${lab}">`;
    return `<div class="lt-lw">${el}<span class="lt-glass" aria-hidden="true">${inner || '<span class="lt-light-core"></span>'}</span><span class="lt-switch-track" aria-hidden="true"><span></span></span><span class="lt-switch-state" aria-hidden="true">${b ? 'AN' : 'AUS'}</span>${o.act ? '</button>' : '</div>'}${o.showVal && v ? `<span class="lt-val">${v}</span>` : ''}${o.under ? o.under(i) : ''}</div>`;
  }).join('')}</div>`;
}
const ltMini = (p, cls) => `<span class="lt-minis ${cls || ''}">${String(p).split('').map(c => `<i class="lt-mini sk-${ltS().eq.lamp || 'std'}${c === '1' ? ' on' : ''}"></i>`).join('')}</span>`;
const ltSum = (bits, vals) => bits.reduce((a, b, i) => a + (b ? vals[i] : 0), 0);
const ltBits = (n, len) => { const o = []; for (let i = len - 1; i >= 0; i--) o.push((n >> i) & 1); return o; };
const ltExpr = (bits, vals) => { const xs = bits.map((b, i) => b ? vals[i] : 0).filter(Boolean); return xs.length ? xs.join(' + ') : '0'; };

/* ---------- Turm-Szene (Startseite des Lichterturms) ---------- */
const LT_STARS = [[18, 16], [44, 9], [70, 22], [96, 12], [150, 18], [178, 8], [205, 26], [246, 12], [262, 34], [296, 18], [344, 70], [22, 62], [58, 74], [186, 60], [250, 92], [338, 120], [14, 128], [80, 120], [196, 128], [230, 150]];
const LT_SKY = {
  krone: { pts: [[190, 38], [190, 28], [200, 18], [210, 28], [220, 16], [230, 28], [230, 38]], close: true, vb: '184 10 52 34' },
  drache: { pts: [[20, 34], [32, 26], [44, 32], [52, 46], [66, 50], [78, 42]], vb: '14 20 70 36' },
  loewe: { pts: [[200, 72], [214, 64], [230, 68], [240, 82], [222, 88], [206, 84]], close: true, vb: '194 58 52 36' },
  komet: { pts: [[64, 100]], vb: '14 92 56 34', extra: '<path d="M64 100L22 118M64 100L26 124M64 100L30 112" stroke="#cfd8ff" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/><circle cx="64" cy="100" r="4.5" fill="#fff"/><circle cx="64" cy="100" r="9" fill="#cfd8ff" opacity=".3"/>' }
};
function ltSkySvg(id) {
  const c = LT_SKY[id]; if (!c) return '';
  const d = c.pts.length > 1 ? `<path d="M${c.pts.map(q => q.join(' ')).join(' L')}${c.close ? ' Z' : ''}" fill="none" stroke="#9fb0ff" stroke-opacity=".45" stroke-width="1.2"/>` : '';
  return d + (c.extra || '') + c.pts.map(q => `<circle cx="${q[0]}" cy="${q[1]}" r="2.3" fill="#fff"/>`).join('');
}
function ltChainPts() { const o = []; for (let k = 1; k < 10; k++) { const t = k / 10, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; o.push([a * 165 + b * 218 + c * 272, a * 80 + b * 120 + c * 108]); } return o; }
const LT_DECO = {
  laterne: { vb: '74 136 30 34', svg: '<circle cx="87" cy="153" r="13" fill="#ffd76a" opacity=".22"/><path d="M95 142h-8v4" stroke="#8a93b8" stroke-width="2" fill="none"/><path d="M83 146h8l2 3H81z" fill="#6b5a3a"/><rect x="82" y="149" width="10" height="13" rx="2" fill="#ffd76a" stroke="#6b5a3a" stroke-width="1.5"/>' },
  wimpel: { vb: '160 36 30 30', svg: '<line x1="166" y1="40" x2="166" y2="63" stroke="#c9d4e6" stroke-width="2"/><path d="M166 41l20 5-20 5z" fill="#ff7a8a"/>' },
  blumen: { vb: '116 176 28 16', svg: '<rect x="121" y="185" width="18" height="5" rx="1.5" fill="#8a5a3a"/><circle cx="125" cy="183" r="2.4" fill="#ff8fb1"/><circle cx="130" cy="182" r="2.4" fill="#ffd76a"/><circle cx="135" cy="183" r="2.4" fill="#9fe3ff"/>' },
  kette: { vb: '160 74 118 50', svg: () => `<path d="M165 80Q218 120 272 108" stroke="#56618f" stroke-width="1.2" fill="none"/>${ltChainPts().map((q, i) => `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="2.6" fill="${['#ffd76a', '#ff8fb1', '#9fe3ff'][i % 3]}"/>`).join('')}` },
  teleskop: { vb: '146 40 24 26', svg: '<path d="M153 63l5-9 5 9" stroke="#c9d4e6" stroke-width="1.6" fill="none"/><rect x="150" y="47" width="17" height="5.5" rx="2" fill="#c9a35a" transform="rotate(-28 158 50)"/>' },
  garten: { vb: '88 44 22 22', svg: '<rect x="91" y="56" width="13" height="7" rx="1.5" fill="#8a5a3a"/><ellipse cx="94" cy="52" rx="3" ry="5" fill="#7fd18a" transform="rotate(-20 94 52)"/><ellipse cx="101" cy="51" rx="3" ry="5.5" fill="#5fbf75" transform="rotate(18 101 51)"/><circle cx="97.5" cy="48" r="2.2" fill="#ff8fb1"/>' }
};
const ltDecoSvg = id => { const d = LT_DECO[id]; return d ? (typeof d.svg === 'function' ? d.svg() : d.svg) : ''; };
function ltTower() {
  const p = ltS(), done = p.done, gold = !!done[LT_MAX], lumiOn = p.lv >= 4 || !!done[3];
  const floors = [...Array(LT_MAX).keys()].map(i => {
    const lv = i + 1, y = 205 - (i + 1) * 17, isD = !!done[lv], cur = !isD && lv === p.lv;
    return `<rect x="95" y="${y}" width="70" height="17" fill="${i % 2 ? '#3b5e4d' : '#365747'}"/>${isD ? `<rect x="118" y="${y + 3}" width="24" height="11" rx="5" fill="#ffd76a" opacity=".35"/>` : ''}<rect x="122" y="${y + 4}" width="16" height="9" rx="4" fill="${isD ? '#ffd76a' : cur ? '#8ba78a' : '#203e32'}" ${cur ? 'stroke="#ffd76a" stroke-width="1.4" stroke-dasharray="3 2"' : ''}/>`;
  }).join('');
  const top = 205 - LT_MAX * 17;
  const own = k => !!p.own[k];
  return `<svg class="lt-scn" viewBox="0 0 360 230" role="img" aria-label="Dein Lichterturm: ${ltDoneN()} von ${LT_MAX} Stockwerken leuchten">
    <defs><linearGradient id="ltSkyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#102f30"/><stop offset="1" stop-color="#23493f"/></linearGradient></defs>
    <rect width="360" height="230" fill="url(#ltSkyG)"/>
    ${LT_STARS.map((s, i) => `<circle class="lt-tw" style="animation-delay:${(i % 7) * .45}s" cx="${s[0]}" cy="${s[1]}" r="${i % 3 ? 1.1 : 1.6}" fill="#dfe6ff"/>`).join('')}
    <circle cx="318" cy="40" r="14" fill="#f4f1d0"/><circle cx="312" cy="36" r="3" fill="#e3dfb9"/><circle cx="322" cy="46" r="2" fill="#e3dfb9"/>
    ${LT_SHOP[4].items.filter(it => own('sky.' + it.id)).map(it => ltSkySvg(it.id)).join('')}
    ${own('deco.kette') ? ltDecoSvg('kette') : ''}
    <path d="M0 212Q90 196 180 206T360 204V230H0z" fill="#112d26"/>
    <rect x="270" y="95" width="40" height="112" fill="#365747"/><path d="M266 95h48l-24-20z" fill="#69836a"/><rect x="282" y="112" width="16" height="10" rx="4" fill="${lumiOn ? '#ffb3e1' : '#203e32'}"/>
    ${lumiOn ? `<g transform="translate(278 50) scale(.26)">${ltLumiG('idle')}</g>` : ''}
    ${floors}
    <rect x="90" y="${top - 6}" width="80" height="8" rx="2" fill="${gold ? '#f2c94c' : '#69836a'}"/>${gold ? `<rect x="90" y="${top - 6}" width="80" height="8" rx="2" fill="#ffe9a6" opacity=".4"/>` : ''}
    <g transform="translate(115 ${top - 44}) scale(.34)">${ltBotG(ltDoneN() ? 'happy' : 'idle', p.eq.out, true)}</g>
    ${['laterne', 'wimpel', 'blumen', 'teleskop', 'garten'].filter(id => own('deco.' + id)).map(ltDecoSvg).join('')}
  </svg>`;
}

/* ---------- Ansichten: Turm (Hub), Werkstatt, Codebuch ---------- */
const ltSndBtn = () => { const on = ltS().snd; return `<button class="lt-snd${on ? ' on' : ''}" data-act="ltSnd" aria-pressed="${on}" aria-label="${on ? 'Lampen-Töne ausschalten' : 'Lampen-Töne einschalten'}">${ico(on ? 'speaker' : 'speakerOff', 18)}<span>${on ? 'Ton an' : 'Ton aus'}</span></button>`; };
function ltHub() {
  const p = ltS();
  const list = LT_LV.slice(0, LT_MAX).map((L, i) => {
    const n = i + 1, d = p.done[n], open = n <= p.lv;
    return `<button class="lt-lvc${d ? ' done' : open ? ' cur' : ' lock'}" data-act="ltLv" data-arg="${n}" ${open ? '' : 'disabled'} aria-label="Stufe ${n}: ${esc(L.t)}${d ? ', geschafft' : open ? '' : ', noch zu'}">
      <span class="lt-lvn">${d ? '✓' : open ? n : ico('lock', 15)}</span><span class="lt-lvt"><b>${esc(L.t)}</b><small>${esc(L.s)}</small></span>${d ? '<span class="lt-lvr">Nochmal</span>' : open ? '<span class="lt-lvr go">Los!</span>' : ''}</button>`;
  }).join('');
  const next = Math.min(p.lv, LT_MAX), finished = ltDoneN() === LT_MAX;
  return ltTop('Blinkis Lichterturm', 'rewards') + `<section class="lt-hub">
    <div class="lt-hero"><div class="lt-hero-copy"><span class="lt-eyebrow">DEINE LICHTWERKSTATT</span><h1>Kleine Lichter.<br>Große Ideen.</h1><p>Schalte, tüftle und schick ein Zeichen.<br>Blinki wartet schon auf dich.</p>
    <button class="lt-btn" data-act="ltLv" data-arg="${next}">${finished ? 'Noch einmal entdecken' : ltDoneN() ? 'Weiterentdecken' : 'Lass uns anfangen'} <span aria-hidden="true">↗</span></button></div>
    <div class="lt-hero-art">${ltTower()}<div class="lt-hero-bot">${ltBot('idle', true)}<span>Hallo, ich bin Blinki.</span></div></div></div>
    <div class="lt-hubbar"><span class="lt-lp"><span class="lt-spark" aria-hidden="true">✦</span> <b>${p.lp}</b> Lichtpunkte</span>${ltSndBtn()}</div></section>
    <div class="lt-hubbtn"><button class="lt-link" data-act="ltShop">${ico('sparkle', 20)}<span>Meine Werkstatt<small>Dein Turm, dein Stil</small></span><span aria-hidden="true">↗</span></button><button class="lt-link" data-act="ltBook">${ico('book', 20)}<span>Mein Codebuch<small>Was du entdeckt hast</small></span><span aria-hidden="true">↗</span></button></div>
    <div class="lt-section-title"><h3 class="lt-h">Deine Entdeckungsreise</h3><span>${ltDoneN()} / ${LT_MAX} entdeckt</span></div><div class="lt-lvs">${list}</div>
    <p class="lt-soon small mute">Ein Licht nach dem anderen. In deinem Tempo.</p>`;
}
function ltItemArt(cat, id) {
  if (cat === 'lamp') return `<span class="lt-lamp on sk-${id} lt-prev" aria-hidden="true"><span class="lt-glass"></span></span>`;
  if (cat === 'snd') return '<span class="lt-note" aria-hidden="true">♪</span>';
  if (cat === 'out') return `<svg viewBox="0 0 100 112" class="lt-prevsvg" aria-hidden="true">${ltBotG('happy', id, true)}</svg>`;
  if (cat === 'deco') return `<svg viewBox="${LT_DECO[id].vb}" class="lt-prevsvg dark" aria-hidden="true"><rect x="0" y="0" width="400" height="300" fill="#203e32"/>${id === 'kette' ? '' : '<rect x="95" y="40" width="70" height="170" fill="#3b5e4d"/>'}${ltDecoSvg(id)}</svg>`;
  if (cat === 'sky') return `<svg viewBox="${LT_SKY[id].vb}" class="lt-prevsvg dark" aria-hidden="true"><rect x="0" y="0" width="400" height="300" fill="#1b2340"/>${ltSkySvg(id)}</svg>`;
  return '';
}
function ltShopView() {
  const p = ltS();
  return ltTop('Werkstatt', 'licht') + `<section class="lt-wbar"><span class="lt-lp">✨ <b>${p.lp}</b> Lichtpunkte</span><small class="mute">Lichtpunkte verdienst du nur im Lichterturm – und gibst sie nur hier aus.</small></section>
  ${LT_SHOP.map(c => `<section class="card lt-cat"><h3>${esc(c.n)}</h3><p class="small mute">${esc(c.s)}</p><div class="lt-items">${c.items.map(it => {
    const has = ltOwn(c.cat, it.id), on = c.eq && p.eq[c.cat] === it.id, can = p.lp >= it.p;
    const btn = !has ? `<button class="btn sm" data-act="ltBuy" data-arg="${c.cat}.${it.id}" ${can ? '' : 'disabled'}>✨ ${it.p}</button>`
      : c.eq ? (on ? '<span class="tag on">aktiv</span>' : `<button class="btn sm sec" data-act="ltEq" data-arg="${c.cat}.${it.id}">Benutzen</button>`) : '<span class="tag on">im Turm</span>';
    return `<div class="lt-it${has ? ' has' : ''}${on ? ' sel' : ''}"><div class="lt-ita">${ltItemArt(c.cat, it.id)}</div><b>${esc(it.n)}</b>${c.cat === 'snd' ? `<button class="btn sm sec lt-hear" data-act="ltHear" data-arg="${it.id}">Anhören</button>` : ''}${btn}</div>`;
  }).join('')}</div></section>`).join('')}
  ${S.cfg.sound === false ? '<p class="small mute center">Hinweis: Die Töne der ganzen App sind ausgeschaltet (Farben & Töne).</p>' : ''}`;
}
const LT_CODE = {
  jn: ['Die Lichtbrücke', () => `<div class="lt-cbrow">${ltMini('1')} Brücke da · ${ltMini('0')} Brücke eingefahren</div><p>Beide Zustände sind eine Nachricht. Diese Bedeutung gehört zu unserer Brückenmaschine.</p>`],
  snack: ['Unsere Snack-Zeichen', () => `<div class="lt-cbrow wrap">${ltS().snack.map(c => `<span class="lt-cbc">${ltMini(c.p)} ${LT_SN[c.s] ? LT_SN[c.s][0] : ''}</span>`).join('')}</div>`],
  dbl: ['Jede Lampe verdoppelt', () => '<p>1 Lampe: 2 Zeichen · 2 Lampen: 4 · 3 Lampen: 8 · 4 Lampen: 16 · 5 Lampen: 32</p>'],
  wert: ['Was die Lampen wert sind', () => `<p>Von rechts nach links: <b>1, 2, 4, 8, 16 …</b> Jede Lampe ist doppelt so viel wert wie die rechts daneben.</p>${ltRow([1, 0, 1], { vals: [4, 2, 1], mode: 'dots', cls: 'tiny', showVal: true })}<p>Lampe 4 und Lampe 1 leuchten: 4 + 1 = <b>5</b></p>`],
  bit: ['Bits und Binärzahlen', () => '<p><b>AN = 1</b> und <b>AUS = 0</b>. Eine binäre Stelle heißt <b>Bit</b>. Eine Zahl aus Bits heißt <b>Binärzahl</b> (binär = zwei Möglichkeiten). <b>101</b> heißt 4 + 1 = 5.</p>']
};
function ltBookView() {
  const p = ltS(), ks = Object.keys(LT_CODE).filter(k => p.code.includes(k));
  return ltTop('Codebuch', 'licht') + `<section class="lt-book">${ks.length ? ks.map(k => `<article class="card lt-cb"><h3>${esc(LT_CODE[k][0])}</h3>${LT_CODE[k][1]()}</article>`).join('') : '<p class="card">Noch leer. Spiel die erste Stufe – dann steht hier eure erste Abmachung.</p>'}</section>`;
}

/* ---------- Eltern-Karte ---------- */
function ltParentCard() {
  const p = ltS(), P = typeof PT === 'function' ? PT : (de => de);
  const rows = LT_LV.slice(0, LT_MAX).map((L, i) => { const d = p.done[i + 1]; return `<span class="tag${d ? ' on' : ''}" title="${esc(L.t)}">${i + 1}${d ? ' ✓' + (d.hints ? ' · ' + d.hints + ' ' + P('Tipp', 'hint') + (d.hints > 1 ? P('s', 's') : '') : '') : ''}</span>`; }).join(' ');
  return `<div class="card noprint"><h3>${P('Blinkis Lichterturm: Stand', 'Blinki’s light tower: progress')}</h3>
    <p class="small mute" style="margin:0 0 6px">${P('Spielerischer Einstieg in Binärzahlen (Stufen 1–8). Lichtpunkte gibt es nur hier; sie kaufen nur Schmuck für den Turm. Münzen, Sticker und Pokale bleiben unberührt. Die Lampen-Töne sind von Anfang an aus.', 'A playful start into binary numbers (levels 1–8). Light points exist only here and only buy decorations for the tower. Coins, stickers and trophies are not affected. Lamp sounds start switched off.')}</p>
    <div class="cfg"><div><b>${P('Stufen', 'Levels')}</b><br><span class="small mute">${ltDoneN()} ${P('von', 'of')} ${LT_MAX} ${P('geschafft', 'done')}</span></div><div class="row wrap" style="gap:4px">${rows}</div></div>
    <div class="cfg"><div><b>${P('Lichtpunkte', 'Light points')}</b><br><span class="small mute">${p.lp} ${P('jetzt', 'now')} · ${p.lpLife} ${P('insgesamt verdient', 'earned in total')}</span></div></div></div>`;
}

/* ---------- Belohnung am Ende einer Stufe ---------- */
function ltFinish(m) {
  const p = ltS(), lv = m.lv, first = !p.done[lv];
  let earned = 0, rep = false, capped = false, fresh = false, gold = false;
  if (first) {
    earned = m.pts + 8; // Neugier und Hilfe gehören zum Lernen; Tipps kosten keine Belohnung.
    p.done[lv] = { ts: Date.now(), hints: m.hints };
    if (lv === p.lv && lv < LT_MAX) { p.lv++; fresh = true; }
    if (lv === LT_MAX) gold = true;
  } else {
    if (p.rep.d !== ymd()) p.rep = { d: ymd(), n: 0 };
    if (p.rep.n < 5) { earned = 2; p.rep.n++; rep = true; } else capped = true;
  }
  p.lp += earned; p.lpLife += earned;
  m.res = { earned, first, rep, capped, fresh, gold };
  save(); ltPlay('big');
  // Der beleuchtete Turm und die kurze Klangfolge feiern die Entdeckung ohne Konfetti.
}
function ltResult(m) {
  const r = m.res, L = LT_LV[m.lv - 1], nxt = m.lv < LT_MAX && m.lv + 1 <= ltS().lv;
  const why = r.first ? `${m.pts} fürs Entdecken · 8 fürs abgeschlossene Stockwerk` : r.rep ? '2 fürs Wiederholen' : 'Heute gibt es fürs Wiederholen keine Lichtpunkte mehr. Schlauer wirst du trotzdem!';
  return ltTop('Blinkis Lichterturm', 'licht') + `<section class="lt-stage lt-res"><div class="lt-result-bot">${ltBot('happy', true)}</div><span class="lt-eyebrow">DEINE ENTDECKUNG</span><h2>${esc(L.t)}</h2><div class="lt-learn"><p>${esc(L.c)}</p></div>
    ${r.earned ? `<p class="lt-earn">✦ +${r.earned} Lichtpunkte</p>` : ''}<p class="small lt-why">${esc(why)}</p>${r.gold ? '<p class="lt-gold">Alle acht Stockwerke leuchten jetzt.</p>' : ''}
    <div class="lt-act">${nxt ? `<button class="lt-btn" data-act="ltLv" data-arg="${m.lv + 1}">Nächste Entdeckung →</button>` : ''}<button class="lt-btn sec" data-act="ltLv" data-arg="${m.lv}">Weiter ausprobieren</button><button class="lt-btn sec" data-act="ltHub">Zum Turm</button></div></section>`;
}

/* Regeln laufen synchron mit dem Spielzustand, nie abhängig von Animationen. */
function ltAfter() {}

/* ---------- Registrierung ---------- */
DZ_ART.licht = '<rect x="22" y="14" width="20" height="34" rx="3" fill="#2c3a63"/><path d="M19 15h26L32 4z" fill="#3f4f86"/><circle cx="32" cy="22" r="7" fill="#ffd76a" opacity=".25"/><circle cx="32" cy="32" r="7" fill="#ffd76a" opacity=".25"/><circle cx="32" cy="22" r="4" fill="#ffd76a"/><circle cx="32" cy="32" r="4" fill="#ffd76a"/><circle cx="32" cy="42" r="4" fill="#4a5480"/><path d="M9 9l1.5 3 3 .5-2.2 2 .5 3-2.8-1.5-2.8 1.5.5-3-2.2-2 3-.5z" fill="#ffd76a"/><circle cx="54" cy="12" r="1.6" fill="#7f8fd0"/><circle cx="50" cy="23" r="1.2" fill="#7f8fd0"/>';
DZ_LABEL.licht = 'Lichterturm';
VIEWS.licht = () => {
  ltS();
  if (UI.lt) return UI.lt.res ? ltResult(UI.lt) : ltLevelView(UI.lt);
  if (UI.ltV === 'shop') return ltShopView();
  if (UI.ltV === 'book') return ltBookView();
  return ltHub();
};
registerFeature({
  id: 'licht', title: 'Blinkis Lichterturm', icon: 'sparkle', tint: 'sky', group: 'spiel', order: 83, view: 'licht', after: ltAfter,
  leave: () => { UI.lt = null; UI.ltV = null; },
  check: () => { ltS(); },
  acts: {
    licht: () => { UI.lt = null; UI.ltV = null; go('licht'); },
    ltHub: () => { UI.lt = null; UI.ltV = null; if (view !== 'licht') go('licht'); else render(); },
    ltShop: () => { UI.lt = null; UI.ltV = 'shop'; render(); },
    ltBook: () => { UI.lt = null; UI.ltV = 'book'; render(); },
    ltLv: n => { n = +n; if (n >= 1 && n <= ltS().lv) ltStart(n); },
    ltDo: a => ltDo(a),
    ltSnd: () => { const p = ltS(); p.snd = !p.snd; save(); if (p.snd) ltPlay('ok'); render(); },
    ltHear: id => { try { [0, 1, 2, 3].forEach((x, j) => ltTone(LT_NOTE[x], j * .12, .3, id)); } catch (e) { } },
    ltBuy: k => {
      const p = ltS(), [cat, id] = String(k).split('.'), c = LT_SHOP.find(x => x.cat === cat), it = c && c.items.find(x => x.id === id);
      if (!it || ltOwn(cat, id) || p.lp < it.p) return;
      p.lp -= it.p; p.own[cat + '.' + id] = Date.now(); if (c.eq) p.eq[cat] = id;
      save(); ltPlay('ok', 0, true); toast('✨', `${it.n} gehört jetzt dir!`); render();
    },
    ltEq: k => { const p = ltS(), [cat, id] = String(k).split('.'); if (ltOwn(cat, id)) { p.eq[cat] = id; save(); render(); } }
  }
});

/* Lichtwerkstatt: direktes Ausprobieren statt Dialog und Antwortauswahl.
   Jede Szene zeigt Ziel, Werkzeug und sichtbare Wirkung. Bestehende Stufen-IDs bleiben erhalten. */
const LT_SN = { apfel: ['🍎', 'Apfel'], keks: ['🍪', 'Keks'], eis: ['🍦', 'Eis'], banane: ['🍌', 'Banane'] };
const LT_V4 = [8, 4, 2, 1];
const ltRange = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
const ltControl = (arg, label, cls = '', disabled = false) => `<button class="lt-btn ${cls}" data-act="ltDo" data-arg="${arg}"${disabled ? ' disabled' : ''}>${label}</button>`;
const ltTokens = (n, cls = '') => `<span class="lt-token-group ${cls}" aria-label="${n} Leuchtpunkte">${Array.from({ length: n }, () => '<i></i>').join('')}</span>`;
const LT_BUILD = {
  1: () => [{ k: 'bridge', title: 'Mach den Weg frei.', goal: 'Schalte die Brücke ein. Schalte sie wieder aus.', hint: 'Tippe auf den großen Schalter. Die Brücke folgt deinem Licht.' }],
  2: () => [{ k: 'post', title: 'Vier Zeichen. Vier Pakete.', goal: 'Schicke an jedes Fenster ein Paket.', hint: 'Jeder Schalter lässt sich einzeln ändern. Auch beide AUS ist ein Zeichen.' }],
  3: () => [{ k: 'patterns', title: 'Sammle Lichtmuster.', goal: 'Fülle die acht Plätze mit verschiedenen Mustern.', hint: 'Lass links AUS und probiere die anderen beiden. Dann links AN.' }],
  4: () => [{ k: 'factory', vals: [1], title: 'Baue einen lückenlosen Vorrat.', goal: 'Stell den linken Vorrat ein: Jede Menge von 0 bis 3 soll genau einmal gehen.', hint: 'Mit zwei Einser-Vorräten gibt es die 1 zweimal. Die 3 fehlt.' }],
  5: () => [
    { k: 'factory', vals: [2, 1], title: 'Ein neuer Platz für mehr.', goal: 'Die alten Plätze schaffen 0 bis 3. Ergänze den nächsten Vorrat.', hint: 'Der erste fehlende Vorrat ist 4. Stell den neuen Platz auf 4.' },
    { k: 'factory', vals: [4, 2, 1], title: 'Und noch ein Platz.', goal: 'Bisher geht es bis 7. Mach die 8 möglich, ohne eine Lücke.', hint: 'Der neue Platz bekommt 8 Punkte: zweimal so viele wie der Vierer.' },
    { k: 'factory', vals: [8, 4, 2, 1], title: 'Du kannst weiterbauen.', goal: 'Bisher geht es bis 15. Ergänze den nächsten Vorrat.', hint: 'Der neue Platz bekommt 16 Punkte. Immer doppelt so viel.' }
  ],
  6: () => [{ k: 'delivery', title: 'Fülle Lumis Sternenschachtel.', goal: 'Fülle die fünf Plätze und schicke die Schachtel ab.', hint: 'Nimm den Vorrat mit 4 Punkten. Ein Platz bleibt noch frei.' }],
  7: () => [{ k: 'travel', title: 'Licht wird Bewegung.', goal: 'Lass Lumi zu zwei verschiedenen Stationen fahren.', hint: 'Die leuchtenden Vorräte bestimmen die Strecke. Tippe dann auf Losfahren.' }],
  8: () => [
    { k: 'notation', title: 'Schreib dein Licht auf.', goal: 'Mach die Zeichen sichtbar. Verändere dann einen Schalter.', hint: 'Tippe auf Zeichen sichtbar machen. AN bekommt eine 1, AUS eine 0.' },
    { k: 'picture', title: 'Male mit AN und AUS.', goal: 'Gestalte ein Lichtbild und schicke es zu Lumi.', hint: 'Tippe auf die Bildfelder. Jedes Feld kann hell oder dunkel sein.' }
  ]
};
function ltEnter(m) {
  const sp = m.steps[m.si];
  m.st = { bits: sp.k === 'factory' ? [0, ...sp.vals.map(() => 1)] : sp.k === 'bridge' ? [0] : sp.k === 'post' ? [0, 0] : sp.k === 'notation' ? [1, 0, 1] : sp.k === 'delivery' ? [0, 0, 0, 0] : [0, 0, 0], seen: [], just: null, done: false, solved: false, hint: false, v: sp.vals ? sp.vals[0] : 0, at: 0, received: null, digits: false, pixels: Array(16).fill(0), edits: 0, extended: false };
}
function ltStart(lv) {
  if (!LT_BUILD[lv]) return;
  UI.ltV = null;
  UI.lt = { lv, steps: LT_BUILD[lv](), si: 0, pts: 0, hints: 0, mood: 'idle', fx: null };
  ltEnter(UI.lt);
  if (view !== 'licht') go('licht'); else render();
  window.scrollTo(0, 0);
}
function ltTog(st, i) {
  i = +i; if (!Number.isInteger(i) || i < 0 || i >= st.bits.length) return;
  st.bits[i] = st.bits[i] ? 0 : 1; st.just = i;
  ltPlay(st.bits[i] ? 'on' : 'off', st.bits.length - 1 - i);
}
function ltFactory(sp, st) {
  const vals = [st.v, ...sp.vals], counts = {};
  for (let n = 0; n < 2 ** vals.length; n++) { const sum = ltSum(ltBits(n, vals.length), vals); counts[sum] = (counts[sum] || 0) + 1; }
  const target = sp.vals.reduce((a, b) => a + b, 0) + 1;
  return { vals, counts, target, ok: st.v === target, max: target * 2 - 1 };
}
function ltMark(st, key) { if (!st.seen.includes(key)) st.seen.push(key); }
function ltDo(arg) {
  const m = UI.lt; if (!m || m.res) return;
  const sp = m.steps[m.si], st = m.st, [act, raw] = String(arg).split(':'), n = +raw;
  const focusArg = document.activeElement && document.activeElement.dataset.arg;
  st.just = null;
  if (act === 'next') {
    if (!st.done) return;
    m.pts += sp.k === 'patterns' ? 8 : sp.k === 'post' ? 4 : 2;
    m.si++;
    if (m.si === m.steps.length) {
      const code = { 1: 'jn', 2: 'snack', 3: 'dbl', 4: 'wert', 5: 'wert', 8: 'bit' }[m.lv];
      if (code) ltAddCode(code);
      ltFinish(m);
    } else ltEnter(m);
    render(); window.scrollTo(0, 0); return;
  }
  if (act === 'tip') { if (!st.hint) m.hints++; st.hint = !st.hint; }
  if (act === 'lamp') {
    ltTog(st, n);
    if (sp.k === 'bridge') { ltMark(st, st.bits[0]); st.done = st.seen.length === 2; }
    if (sp.k === 'notation' && st.digits) st.done = true;
  }
  if (act === 'send' && sp.k === 'post') {
    st.received = parseInt(st.bits.join(''), 2); ltMark(st, st.received); st.done = st.seen.length === 4; ltPlay('pop');
    ltS().snack = ['apfel', 'keks', 'eis', 'banane'].map((s, i) => ({ p: ltBits(i, 2).join(''), s })); save();
  }
  if (act === 'catch' && sp.k === 'patterns') { ltMark(st, st.bits.join('')); st.done = st.seen.length === 8; ltPlay('pop'); }
  if (act === 'extend' && sp.k === 'patterns' && st.done) st.extended = !st.extended;
  if (sp.k === 'factory' && ['plus', 'minus'].includes(act)) {
    const f = ltFactory(sp, st); st.v = Math.max(1, Math.min(f.target + 1, st.v + (act === 'plus' ? 1 : -1))); st.done = ltFactory(sp, st).ok; ltPlay('pop');
  }
  if (act === 'send' && sp.k === 'delivery') { st.received = ltSum(st.bits, LT_V4); st.done = st.received === 5; ltPlay(st.done ? 'ok' : 'pop'); }
  if (act === 'drive' && sp.k === 'travel') { st.at = ltSum(st.bits, [4, 2, 1]); ltMark(st, st.at); st.done = st.seen.length >= 2; ltPlay('pop'); }
  if (act === 'digits' && sp.k === 'notation') st.digits = !st.digits;
  if (act === 'pixel' && sp.k === 'picture' && Number.isInteger(n) && n >= 0 && n < 16) { st.pixels[n] = 1 - st.pixels[n]; st.edits++; ltPlay(st.pixels[n] ? 'on' : 'off'); }
  if (act === 'send' && sp.k === 'picture') { st.received = st.pixels.slice(); st.done = st.edits > 0; ltPlay('ok'); }
  st.solved = st.done;
  render();
  // Whole-app rendering replaces controls; preserve keyboard focus on the same tool.
  if (focusArg && act !== 'next') [...document.querySelectorAll('[data-act="ltDo"]')].find(el => el.dataset.arg === focusArg)?.focus({ preventScroll: true });
}
function ltBridge(on) {
  return `<div class="lt-world lt-bridge ${on ? 'is-open' : ''}"><svg viewBox="0 0 420 160" role="img" aria-label="${on ? 'Die Brücke verbindet beide Ufer' : 'Die Brücke ist eingefahren'}">
  <path d="M0 122Q105 99 210 122T420 122V160H0" fill="#285965"/><path d="M162 148q38-10 79 0M182 138h37" fill="none" stroke="#75b5b5" stroke-width="2"/>
  <path d="M0 86h155v74H0M265 86h155v74H265" fill="#8daea0"/><path d="M0 86h155M265 86h155" stroke="#d3e4cb" stroke-width="9"/>
  <g class="lt-bridge-deck" style="transform:translateX(${on ? 0 : -112}px)"><path d="M155 86h110" stroke="#f0c977" stroke-width="8"/><path d="M164 66v20m20-20v20m20-20v20m20-20v20m20-20v20m12-20v20M164 68h92" fill="none" stroke="#f0c977" stroke-width="3"/></g>
  <g transform="translate(54 17) scale(.62)">${ltBotG(on ? 'happy' : 'idle', ltS().eq.out, on)}</g>
  <path d="M328 48v35M328 49l23 8-23 8" fill="#e6a581" stroke="#e6a581" stroke-width="3"/>
  <circle cx="289" cy="77" r="5" fill="${on ? '#ffd76a' : '#4a7065'}"/></svg><span class="lt-world-label">${on ? 'AN → Weg frei' : 'AUS → Brücke eingefahren'}</span></div>`;
}
function ltLabView(sp, st) {
  const row = (vals, extra = {}) => ltRow(st.bits, { act: 'lamp', just: st.just, ...(vals ? { vals, mode: 'dots', showVal: true } : {}), ...extra });
  if (sp.k === 'bridge') return { body: ltBridge(st.bits[0]) + '<div class="lt-flow-label">Dein Schalter steuert die Brücke ↓</div>' + row(), status: st.done ? 'Du hast beide Zustände ausprobiert.' : st.bits[0] ? 'Die Brücke ist da. Schalte sie wieder aus.' : 'Tippe auf den Schalter. Beobachte die Brücke.' };
  if (sp.k === 'post') {
    const dest = parseInt(st.bits.join(''), 2), keys = Object.keys(LT_SN);
    return { body: `<div class="lt-destinations">${keys.map((k, i) => `<div class="lt-destination ${dest === i ? 'selected' : ''} ${st.seen.includes(i) ? 'visited' : ''}"><span class="lt-parcel">${LT_SN[k][0]}</span><b>${LT_SN[k][1]}</b>${ltMini(ltBits(i, 2).join(''))}<small>${st.seen.includes(i) ? 'angekommen ✓' : dest === i ? 'hierhin senden' : 'wartet'}</small></div>`).join('')}</div><div class="lt-flow-label">Dein Licht wählt das Fenster ↓</div>${row()}${ltControl('send', 'Paket schicken →')}`, status: st.received == null ? 'Verändere einen Schalter. Das ausgewählte Fenster wandert mit.' : `${LT_SN[keys[st.received]][1]} angekommen. ${st.seen.length} von 4 Fenstern besucht.` };
  }
  if (sp.k === 'patterns') return { body: `<div class="lt-pattern-board">${ltRange(0, 7).map(i => { const p = ltBits(i, 3).join(''), found = st.seen.includes(p); return `<div class="lt-pattern-slot ${found ? 'found' : ''}">${found ? ltMini(p) : '<span aria-hidden="true">· · ·</span>'}<span class="sr-only">${found ? p + ' gesammelt' : 'Noch ein freier Platz'}</span></div>`; }).join('')}</div><div class="lt-flow-label">Verändere die Lampen. Merke dir dein Muster.</div>${row()}${ltControl('catch', 'Muster aufbewahren +')}${st.done ? ltControl('extend', st.extended ? 'Wieder drei Lampen' : 'Eine Lampe dazu', 'sec') : ''}${st.extended ? `<div class="lt-double"><div><small>Neue Lampe AUS</small>${st.seen.map(p => ltMini('0' + p)).join('')}</div><div><small>Neue Lampe AN</small>${st.seen.map(p => ltMini('1' + p)).join('')}</div></div>` : ''}`, status: st.extended ? 'Jedes Muster gibt es zweimal. Aus 8 werden 16.' : `${st.seen.length} von 8 verschiedenen Mustern gesammelt. Auch alle AUS zählt.` };
  if (sp.k === 'factory') {
    const f = ltFactory(sp, st), sum = ltSum(st.bits, f.vals), firstGap = ltRange(0, f.max).find(n => !f.counts[n]), dup = ltRange(0, f.max).find(n => f.counts[n] > 1);
    return { body: `<div class="lt-factory-top"><span>Neuer Vorrat links</span><div class="lt-stepper">${ltControl('minus', '−', '', st.v <= 1)}<strong aria-live="polite">${st.v}</strong>${ltControl('plus', '+', '', st.v >= f.target + 1)}</div><small>+ und − verändern nur diesen Vorrat.</small></div>${row(f.vals)}<div class="lt-live">Gerade ausgewählt: <b>${sum}</b> Punkte</div><div class="lt-coverage"><span>Diese Mengen kannst du bauen</span><div class="lt-line">${ltRange(0, f.max).map(n => `<span class="lt-n ${f.counts[n] === 1 ? 'ok' : f.counts[n] > 1 ? 'dup' : 'gap'}" aria-label="${n}: ${f.counts[n] === 1 ? 'einmal' : f.counts[n] > 1 ? 'doppelt' : 'fehlt'}">${n}${f.counts[n] > 1 ? '<i>2×</i>' : ''}</span>`).join('')}</div><small>Voll = möglich · gestrichelt = fehlt · 2× = doppelt</small></div>`, status: f.ok ? `Alles passt: 0 bis ${f.max}, ohne Lücke und ohne doppelte Menge.` : `${dup != null ? `Die ${dup} gibt es doppelt. ` : ''}${firstGap != null ? `Die ${firstGap} fehlt noch. ` : ''}Verändere den linken Vorrat.` };
  }
  if (sp.k === 'delivery') {
    const sum = ltSum(st.bits, LT_V4), sent = st.received;
    return { body: `<div class="lt-delivery-box"><span>Deine Schachtel · 5 Plätze</span><div class="lt-tray">${ltRange(0, 4).map(i => `<i class="${i < sum ? 'filled' : ''}">${i < sum ? '✦' : ''}</i>`).join('')}</div>${sum > 5 ? `<div class="lt-surplus">${ltTokens(sum - 5)}<small>${sum - 5} übrig</small></div>` : ''}</div><div class="lt-flow-label">Leuchtende Vorräte kommen in die Schachtel ↓</div>${row(LT_V4)}<div class="lt-live">${sum === 5 ? 'Alle fünf Plätze sind gefüllt.' : sum < 5 ? `Noch ${5 - sum} freie Plätze.` : `${sum - 5} Punkte passen noch nicht hinein.`}</div>${ltControl('send', 'Zu Lumi schicken →')}${sent != null ? `<div class="lt-receiver">${ltLumi('idle')}<span>Bei Lumi angekommen</span><div id="ltBowl" class="lt-bowl"><b>${sent}</b><small>Sterne</small></div></div>` : ''}`, status: sent == null ? 'Tippe die Vorräte an. Du siehst sofort, was in die Schachtel kommt.' : sent === 5 ? 'Die Schachtel ist vollständig angekommen.' : `${sent} Sterne angekommen. ${sent < 5 ? 'Es fehlen ' + (5 - sent) : (sent - 5) + ' sind übrig'}. Du kannst neu packen.` };
  }
  if (sp.k === 'travel') {
    const sum = ltSum(st.bits, [4, 2, 1]);
    return { body: `<div class="lt-travel"><div class="lt-track">${ltRange(0, 7).map(i => `<div class="lt-station ${st.at === i ? 'here' : ''} ${sum === i ? 'target' : ''}">${st.at === i ? ltLumi('idle') : '<span class="lt-track-space"></span>'}<b>${i}</b></div>`).join('')}</div><span>Ziel: Station ${sum}</span></div><div class="lt-flow-label">Dein Licht bestimmt die Strecke ↓</div>${row([4, 2, 1])}${ltControl('drive', 'Losfahren →')}`, status: st.seen.length ? `Lumi steht bei ${st.at}. ${st.seen.length} verschiedene Stationen besucht.` : 'Jeder leuchtende Vorrat zählt zur Strecke dazu.' };
  }
  if (sp.k === 'notation') {
    const sum = ltSum(st.bits, [4, 2, 1]);
    return { body: `<div class="lt-number-result">${ltTokens(sum)}<span>${sum} Leuchtpunkte</span></div>${row([4, 2, 1], st.digits ? { mode: 'digit' } : {})}${ltControl('digits', st.digits ? 'Wieder Leuchtpunkte zeigen' : 'Zeichen sichtbar machen', 'sec')}${st.digits ? '<p class="lt-discovery">AN wird <b>1</b>. AUS wird <b>0</b>.<br>Ein solcher Platz heißt <b>Bit</b>.</p>' : ''}`, status: st.digits ? `${st.bits.join('')} beschreibt dieselbe Menge: ${ltExpr(st.bits, [4, 2, 1])} = ${sum}.` : 'Dein Lichtmuster bleibt gleich. Gleich bekommt es kurze Zeichen.' };
  }
  if (sp.k === 'picture') return { body: `<div class="lt-picture-work"><div><span>Dein Lichtbild</span><div class="lt-pixel-grid">${st.pixels.map((b, i) => `<button class="lt-pixel ${b ? 'lit' : ''}" data-act="ltDo" data-arg="pixel:${i}" aria-pressed="${!!b}" aria-label="Bildfeld ${i + 1}: ${b ? 'AN' : 'AUS'}"></button>`).join('')}</div></div><div><span>Bei Lumi</span><div class="lt-pixel-grid received" role="img" aria-label="${st.received ? 'Dein gesendetes Lichtbild' : 'Noch kein Bild empfangen'}">${(st.received || Array(16).fill(0)).map(b => `<i class="lt-pixel ${b ? 'lit' : ''}"></i>`).join('')}</div></div></div>${ltControl('send', 'Bild schicken →')}<p class="lt-discovery">Hier bedeutet jedes Zeichen: ein Bildfeld an oder aus.<br>Ein Bildfeld heißt <b>Pixel</b>.</p>`, status: st.received ? 'Dein Bild ist angekommen. Du kannst es verändern und erneut senden.' : 'Tippe auf die Bildfelder. Auch dunkle Felder gehören zum Bild.' };
  return { body: '', status: '' };
}
function ltLevelView(m) {
  const sp = m.steps[m.si], st = m.st, o = ltLabView(sp, st);
  return ltTop('Blinkis Lichterturm', 'licht') + `<div class="lt-head"><span class="lt-eyebrow">ENTDECKUNG ${m.lv} VON ${LT_MAX}${m.steps.length > 1 ? ' · ' + (m.si + 1) + '/' + m.steps.length : ''}</span>${ltSndBtn()}</div>
  <section class="lt-stage"><div class="lt-task-head"><div><h1>${sp.title}</h1><p>${sp.goal}</p></div>${ltBot(st.done ? 'happy' : 'idle', st.bits.some(Boolean))}</div><div class="lt-body">${o.body}</div><p class="lt-status ${st.done ? 'complete' : ''}" role="status">${st.done ? '<span aria-hidden="true">✓ </span>' : ''}${o.status}</p>${st.done ? `<div class="lt-act">${ltControl('next', m.si + 1 < m.steps.length ? 'Weiterbauen →' : 'Entdeckung mitnehmen →')}</div>` : ''}</section>
  <div class="lt-foot"><span>In deinem Tempo.</span><button class="lt-tipb" data-act="ltDo" data-arg="tip" aria-expanded="${st.hint}">Ein kleiner Hinweis</button></div>${st.hint ? `<p class="lt-hint" role="status">${sp.hint}</p>` : ''}`;
}
