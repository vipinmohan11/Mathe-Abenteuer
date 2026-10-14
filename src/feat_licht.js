/* =====================================================================
   BLINKIS LICHTERTURM (in Meine Welt, von den Eltern einschaltbar)
   Binärzahlen ohne Mathe-Gefühl: Blinki kann nur mit Lampen sprechen (AN / AUS), das Kind ist sein Übersetzer.
   Eine Idee pro Stufe: zwei Zustände → mehr Lampen, mehr Zeichen (Verdoppeln) → Lampen bekommen Punkte 1, 2, 4, 8 → Zahlen schicken
   und lesen → AN = 1, AUS = 0 (Bit, Binärzahl). Stufen 1–8 hier, 9–15 folgen (Zählmaschine, Muster, Byte, Bilder, Buchstaben, Zaubertrick).
   Belohnung NUR hier: Lichtpunkte → Werkstatt (Turm-Deko, Lampen-Looks, Lampen-Klänge, Blinki-Outfits, Sternbilder). Keine Münzen, Sticker, Pokale.
   Töne der Lampen sind standardmäßig AUS (eigener Schalter; die App-weite Ton-Einstellung gilt zusätzlich).
   Gespeichert: S.licht = { lv (höchste offene Stufe), done{n:{ts,hints}}, lp, lpLife, own{'cat.id':ts}, eq{lamp,snd,out}, snd, code[], snack[], rep{d,n} }
   Stufen und Schritte: feat_lichtlv.js
   ===================================================================== */
const LT_MAX = 8;
const LT_LV = [
  { t: 'Ja oder Nein', s: 'Eine Lampe, zwei Antworten', c: 'Eine Lampe kann zwei Dinge sagen: AN oder AUS. Damit man sich versteht, muss man abmachen, was AN bedeutet.', nx: 'Ich habe Hunger … aber wie sage ich dir, welchen Snack ich möchte?' },
  { t: 'Vier Snacks', s: 'Eine Lampe ist zu wenig', c: 'Mit einer Lampe gibt es nur zwei Zeichen. Mit zwei Lampen gibt es schon vier. Mehr Lampen – mehr Botschaften!', nx: 'Und wenn ich DREI Lampen habe? Wie viele Zeichen gibt es dann?' },
  { t: 'Muster-Jagd', s: 'Wie viele Zeichen gibt es?', c: 'Jede neue Lampe verdoppelt die Zeichen: Jedes alte Zeichen gibt es einmal mit der neuen Lampe AUS und einmal mit AN. 2, 4, 8, 16, 32 …', nx: 'Lumi aus dem Turm gegenüber möchte Sterne zählen. Kannst du ihm Zahlen schicken?' },
  { t: 'Leuchtpunkte', s: 'Lampen bekommen Punkte', c: 'Lampen können verschieden viel wert sein. Neben der 1 braucht die nächste Lampe 2 Punkte – sonst gibt es Lücken oder doppelte Zahlen.', nx: 'Lumi hat noch mehr Sterne! Wir brauchen eine dritte Lampe.' },
  { t: 'Die dritte Lampe', s: '1, 2, 4 … und dann?', c: 'Jede neue Lampe ist eins mehr wert als alle anderen zusammen. Darum ist sie doppelt so viel wert wie die rechts daneben: 1, 2, 4, 8, 16 …', nx: 'Jetzt haben wir vier Lampen: 8, 4, 2 und 1. Lumi wünscht sich Sterne!' },
  { t: 'Sterne schicken', s: 'Zahlen mit Lampen bauen', c: 'Mit den Lampen 8, 4, 2 und 1 kann man jede Zahl von 1 bis 15 bauen. Jede Lampe ist einmal dabei oder gar nicht.', nx: 'Jetzt schickt Lumi DIR Zahlen. Kannst du sie lesen?' },
  { t: 'Lumis Antwort', s: 'Lampen-Zeichen lesen', c: 'Lesen geht genauso wie Schicken: Zähle die Punkte aller Lampen zusammen, die leuchten.', nx: 'Ich will Lumi einen Brief schreiben. Aber Lampen malen dauert ewig …' },
  { t: 'Strich und Kreis', s: 'AN = 1, AUS = 0', c: 'AN schreibt man 1, AUS schreibt man 0. Jede Lampe heißt Bit, eine Zahl aus Bits heißt Binärzahl. 101 bedeutet 4 + 1 = 5.', nx: 'Mit 1 und 0 kann man jede Zahl aufschreiben. Bald baue ich eine Zählmaschine – die nächsten Stufen kommen!' }
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
function ltBotG(mood, out, ant) {
  const st = mood || 'idle', eye = '#9fe3ff', lit = ant ? '#ffd76a' : '#4a5470';
  const bulb = out === 'regen' ? `<defs><linearGradient id="ltRb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a8a"/><stop offset=".35" stop-color="#ffd76a"/><stop offset=".65" stop-color="#7fd18a"/><stop offset="1" stop-color="#6fa8ff"/></linearGradient></defs><circle cx="50" cy="8" r="7" fill="url(#ltRb)"/>${ant ? '<circle cx="50" cy="8" r="12" fill="#ffd76a" opacity=".3"/>' : ''}` : `${ant ? '<circle cx="50" cy="8" r="12" fill="#ffd76a" opacity=".3"/>' : ''}<circle cx="50" cy="8" r="6" fill="${lit}"/>`;
  const eyes = st === 'happy' ? `<path d="M34 48q6-8 12 0M54 48q6-8 12 0" stroke="${eye}" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M41 55q9 8 18 0" stroke="${eye}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : st === 'curious' ? `<circle cx="40" cy="46" r="5.5" fill="${eye}"/><circle cx="60" cy="45" r="3.6" fill="${eye}"/><circle cx="50" cy="56" r="2.6" stroke="${eye}" stroke-width="2" fill="none"/>`
      : st === 'confused' ? `<circle cx="40" cy="47" r="4" fill="${eye}"/><circle cx="60" cy="47" r="4" fill="${eye}"/><path d="M34 38l10 3" stroke="${eye}" stroke-width="2.4" stroke-linecap="round"/><path d="M43 57q3.5-3 7 0t7 0" stroke="${eye}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
        : `<circle cx="40" cy="46" r="5" fill="${eye}"/><circle cx="60" cy="46" r="5" fill="${eye}"/><path d="M44 55q6 4 12 0" stroke="${eye}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  const arms = st === 'happy' ? '<path d="M31 80q-12-4-15-16M69 80q12-4 15-16" stroke="#cbd5e8" stroke-width="6" stroke-linecap="round" fill="none"/>' : '<path d="M31 82q-10 4-12 13M69 82q10 4 12 13" stroke="#cbd5e8" stroke-width="6" stroke-linecap="round" fill="none"/>';
  const hat = out === 'muetze' ? '<path d="M19 36q31-36 62 0z" fill="#5a7bd8"/><rect x="17" y="31" width="66" height="9" rx="4.5" fill="#3f5fbf"/><path d="M30 26l6-6M44 20l4-4M58 20l-1-6" stroke="#7d9bea" stroke-width="2" stroke-linecap="round"/>' : '';
  const neck = out === 'schal' ? '<path d="M27 71h46v8H27z" fill="#ff8a5c"/><path d="M59 78v15h8V78z" fill="#ff8a5c"/><path d="M35 71v8M43 71v8M51 71v8M63 84h-4" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>'
    : out === 'fliege' ? '<path d="M41 75l9 4.5-9 4.5zM59 75l-9 4.5 9 4.5z" fill="#e84f6a"/><circle cx="50" cy="79.5" r="2.4" fill="#b83a52"/>' : '';
  return `<line x1="50" y1="22" x2="50" y2="10" stroke="#9aa8c7" stroke-width="3"/>${bulb}${arms}<rect x="30" y="73" width="40" height="29" rx="12" fill="#cbd5e8"/><circle cx="50" cy="88" r="4" fill="${lit}"/>
    <rect x="16" y="20" width="68" height="54" rx="24" fill="#e3eaf6"/><rect x="25" y="30" width="50" height="34" rx="15" fill="#232c4a"/>${eyes}${st === 'happy' ? '<circle cx="28" cy="58" r="3" fill="#ffb3c7" opacity=".7"/><circle cx="72" cy="58" r="3" fill="#ffb3c7" opacity=".7"/>' : ''}${hat}${neck}
    <rect x="34" y="100" width="10" height="7" rx="3" fill="#9aa8c7"/><rect x="56" y="100" width="10" height="7" rx="3" fill="#9aa8c7"/>${st === 'confused' ? '<text x="88" y="24" font-size="18" font-weight="800" fill="#ffd76a" font-family="sans-serif">?</text>' : ''}`;
}
const ltBot = (mood, ant, cls) => `<svg class="lt-bot ${cls || ''} m-${mood || 'idle'}" viewBox="0 0 100 112" role="img" aria-label="Blinki">${ltBotG(mood, ltS().eq.out, ant)}</svg>`;
function ltLumiG(mood) {
  const eye = '#ffb3e1', st = mood || 'idle';
  const face = st === 'happy' ? `<path d="M36 48q6-7 12 0M52 48q6-7 12 0" stroke="${eye}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M42 55q8 7 16 0" stroke="${eye}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : st === 'laugh' ? `<path d="M36 46l6 3-6 3M64 46l-6 3 6 3" stroke="${eye}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M41 54h18q-1 8-9 8t-9-8z" fill="${eye}"/>`
      : st === 'curious' ? `<circle cx="42" cy="47" r="5" fill="${eye}"/><circle cx="58" cy="46" r="3.4" fill="${eye}"/><circle cx="50" cy="56" r="2.4" stroke="${eye}" stroke-width="2" fill="none"/>`
        : `<circle cx="42" cy="47" r="4.6" fill="${eye}"/><circle cx="58" cy="47" r="4.6" fill="${eye}"/><path d="M45 55q5 4 10 0" stroke="${eye}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  return `<path d="M38 20l-6-12M62 20l6-12" stroke="#b9a7e0" stroke-width="3" stroke-linecap="round"/><circle cx="31" cy="7" r="4" fill="#ffb3e1"/><circle cx="69" cy="7" r="4" fill="#ffb3e1"/>
    <rect x="34" y="72" width="32" height="28" rx="12" fill="#d9ccf2"/><circle cx="50" cy="46" r="31" fill="#ece3fb"/><ellipse cx="50" cy="48" rx="21" ry="16" fill="#2e2550"/>${face}
    <rect x="37" y="98" width="9" height="7" rx="3" fill="#b9a7e0"/><rect x="54" y="98" width="9" height="7" rx="3" fill="#b9a7e0"/>`;
}
const ltLumi = (mood, cls) => `<svg class="lt-bot lt-lumi ${cls || ''} m-${mood || 'idle'}" viewBox="0 0 100 112" role="img" aria-label="Lumi">${ltLumiG(mood)}</svg>`;

/* ---------- Lampen ---------- */
/* bits: [0|1] von links nach rechts (größter Wert links). o: {vals, mode:'plain'|'dots'|'digit', act, cls, just, pulse:[i], showVal, morph:[bool], under:i=>html, drop, dim} */
function ltRow(bits, o) {
  o = o || {};
  const n = bits.length, vals = o.vals || bits.map((b, i) => 2 ** (n - 1 - i)), sk = ltS().eq.lamp || 'std';
  return `<div class="lt-row ${o.cls || 'mine'}">${bits.map((b, i) => {
    const v = vals[i], dig = (o.morph && o.morph[i]) || o.mode === 'digit', mode = dig ? 'digit' : (o.mode || 'plain');
    let inner = '';
    if (mode === 'dots' && v > 0) inner = `<span class="lt-dots${v > 8 ? ' sm' : ''}">${'<i class="lt-dot"></i>'.repeat(v)}</span>`;
    else if (mode === 'digit') inner = `<span class="lt-dig">${b ? 1 : 0}</span>`;
    const cls = ['lt-lamp', 'sk-' + sk, b ? 'on' : '', o.just === i ? (b ? 'just' : 'cool') : '', o.pulse && o.pulse.includes(i) ? 'pulse' : '', dig ? 'dg' : '', o.drop === i ? 'drop' : '', o.act ? 'tap' : ''].filter(Boolean).join(' ');
    const lab = `Lampe${(mode === 'dots' || o.showVal) && v ? ' ' + v : ''}: ${b ? 'AN' : 'AUS'}`;
    const el = o.act ? `<button class="${cls}" data-act="ltDo" data-arg="${o.act}:${i}" aria-pressed="${!!b}" aria-label="${lab}">` : `<div class="${cls}" role="img" aria-label="${lab}">`;
    return `<div class="lt-lw">${el}<span class="lt-glass">${inner}</span>${o.act ? '</button>' : '</div>'}${o.showVal && v ? `<span class="lt-val">${v}</span>` : ''}${o.under ? o.under(i) : ''}</div>`;
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
    return `<rect x="95" y="${y}" width="70" height="17" fill="${i % 2 ? '#2f3b66' : '#2a3560'}"/>${isD ? `<rect x="118" y="${y + 3}" width="24" height="11" rx="5" fill="#ffd76a" opacity=".35"/>` : ''}<rect x="122" y="${y + 4}" width="16" height="9" rx="4" fill="${isD ? '#ffd76a' : cur ? '#55639c' : '#1f2747'}" ${cur ? 'stroke="#ffd76a" stroke-width="1.4" stroke-dasharray="3 2"' : ''}/>`;
  }).join('');
  const top = 205 - LT_MAX * 17;
  const own = k => !!p.own[k];
  return `<svg class="lt-scn" viewBox="0 0 360 230" role="img" aria-label="Dein Lichterturm: ${ltDoneN()} von ${LT_MAX} Stockwerken leuchten">
    <defs><linearGradient id="ltSkyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141a33"/><stop offset="1" stop-color="#2b3766"/></linearGradient></defs>
    <rect width="360" height="230" fill="url(#ltSkyG)"/>
    ${LT_STARS.map((s, i) => `<circle class="lt-tw" style="animation-delay:${(i % 7) * .45}s" cx="${s[0]}" cy="${s[1]}" r="${i % 3 ? 1.1 : 1.6}" fill="#dfe6ff"/>`).join('')}
    <circle cx="318" cy="40" r="14" fill="#f4f1d0"/><circle cx="312" cy="36" r="3" fill="#e3dfb9"/><circle cx="322" cy="46" r="2" fill="#e3dfb9"/>
    ${LT_SHOP[4].items.filter(it => own('sky.' + it.id)).map(it => ltSkySvg(it.id)).join('')}
    ${own('deco.kette') ? ltDecoSvg('kette') : ''}
    <path d="M0 212Q90 196 180 206T360 204V230H0z" fill="#10152b"/>
    <rect x="270" y="95" width="40" height="112" fill="#2a3560"/><path d="M266 95h48l-24-20z" fill="#3a4677"/><rect x="282" y="112" width="16" height="10" rx="4" fill="${lumiOn ? '#ffb3e1' : '#1f2747'}"/>
    ${lumiOn ? `<g transform="translate(278 50) scale(.26)">${ltLumiG('idle')}</g>` : ''}
    ${floors}
    <rect x="90" y="${top - 6}" width="80" height="8" rx="2" fill="${gold ? '#f2c94c' : '#3a4677'}"/>${gold ? `<rect x="90" y="${top - 6}" width="80" height="8" rx="2" fill="#ffe9a6" opacity=".4"/>` : ''}
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
  return topBar('Blinkis Lichterturm', 'rewards') + `<section class="lt-hub">${ltTower()}
    <div class="lt-hubbar"><span class="lt-lp" title="Lichtpunkte">✨ <b>${p.lp}</b> Lichtpunkte</span>${ltSndBtn()}</div>
    <div class="lt-hubbtn"><button class="lt-btn" data-act="ltShop">🛠️ Werkstatt</button><button class="lt-btn sec" data-act="ltBook">📖 Codebuch</button></div></section>
    <h3 class="lt-h">Stockwerke</h3><div class="lt-lvs">${list}</div>
    <p class="lt-soon small mute">Stufen 9 bis 15 (Zählmaschine, Muster, Bilder, Buchstaben und ein Zaubertrick) kommen bald.</p>`;
}
function ltItemArt(cat, id) {
  if (cat === 'lamp') return `<span class="lt-lamp on sk-${id} lt-prev" aria-hidden="true"><span class="lt-glass"></span></span>`;
  if (cat === 'snd') return '<span class="lt-note" aria-hidden="true">♪</span>';
  if (cat === 'out') return `<svg viewBox="0 0 100 112" class="lt-prevsvg" aria-hidden="true">${ltBotG('happy', id, true)}</svg>`;
  if (cat === 'deco') return `<svg viewBox="${LT_DECO[id].vb}" class="lt-prevsvg dark" aria-hidden="true"><rect x="0" y="0" width="400" height="300" fill="#1f2747"/>${id === 'kette' ? '' : '<rect x="95" y="40" width="70" height="170" fill="#2f3b66"/>'}${ltDecoSvg(id)}</svg>`;
  if (cat === 'sky') return `<svg viewBox="${LT_SKY[id].vb}" class="lt-prevsvg dark" aria-hidden="true"><rect x="0" y="0" width="400" height="300" fill="#1b2340"/>${ltSkySvg(id)}</svg>`;
  return '';
}
function ltShopView() {
  const p = ltS();
  return topBar('Werkstatt', 'licht') + `<section class="lt-wbar"><span class="lt-lp">✨ <b>${p.lp}</b> Lichtpunkte</span><small class="mute">Lichtpunkte verdienst du nur im Lichterturm – und gibst sie nur hier aus.</small></section>
  ${LT_SHOP.map(c => `<section class="card lt-cat"><h3>${esc(c.n)}</h3><p class="small mute">${esc(c.s)}</p><div class="lt-items">${c.items.map(it => {
    const has = ltOwn(c.cat, it.id), on = c.eq && p.eq[c.cat] === it.id, can = p.lp >= it.p;
    const btn = !has ? `<button class="btn sm" data-act="ltBuy" data-arg="${c.cat}.${it.id}" ${can ? '' : 'disabled'}>✨ ${it.p}</button>`
      : c.eq ? (on ? '<span class="tag on">aktiv</span>' : `<button class="btn sm sec" data-act="ltEq" data-arg="${c.cat}.${it.id}">Benutzen</button>`) : '<span class="tag on">im Turm</span>';
    return `<div class="lt-it${has ? ' has' : ''}${on ? ' sel' : ''}"><div class="lt-ita">${ltItemArt(c.cat, it.id)}</div><b>${esc(it.n)}</b>${c.cat === 'snd' ? `<button class="btn sm sec lt-hear" data-act="ltHear" data-arg="${it.id}">Anhören</button>` : ''}${btn}</div>`;
  }).join('')}</div></section>`).join('')}
  ${S.cfg.sound === false ? '<p class="small mute center">Hinweis: Die Töne der ganzen App sind ausgeschaltet (Farben & Töne).</p>' : ''}`;
}
const LT_CODE = {
  jn: ['Die Abmachung', () => `<div class="lt-cbrow">${ltMini('1')} heißt <b>Ja</b> · ${ltMini('0')} heißt <b>Nein</b></div>`],
  snack: ['Unsere Snack-Zeichen', () => `<div class="lt-cbrow wrap">${ltS().snack.map(c => `<span class="lt-cbc">${ltMini(c.p)} ${LT_SN[c.s] ? LT_SN[c.s][0] : ''}</span>`).join('')}</div>`],
  dbl: ['Jede Lampe verdoppelt', () => '<p>1 Lampe: 2 Zeichen · 2 Lampen: 4 · 3 Lampen: 8 · 4 Lampen: 16 · 5 Lampen: 32</p>'],
  wert: ['Was die Lampen wert sind', () => `<p>Von rechts nach links: <b>1, 2, 4, 8, 16 …</b> Jede Lampe ist doppelt so viel wert wie die rechts daneben.</p>${ltRow([1, 0, 1], { vals: [4, 2, 1], mode: 'dots', cls: 'tiny', showVal: true })}<p>Lampe 4 und Lampe 1 leuchten: 4 + 1 = <b>5</b></p>`],
  bit: ['Bits und Binärzahlen', () => '<p><b>AN = 1</b> und <b>AUS = 0</b>. Jede Lampe heißt <b>Bit</b>. Eine Zahl aus Bits heißt <b>Binärzahl</b> (binär = zwei Möglichkeiten). <b>101</b> heißt 4 + 1 = 5.</p>']
};
function ltBookView() {
  const p = ltS(), ks = Object.keys(LT_CODE).filter(k => p.code.includes(k));
  return topBar('Codebuch', 'licht') + `<section class="lt-book">${ks.length ? ks.map(k => `<article class="card lt-cb"><h3>${esc(LT_CODE[k][0])}</h3>${LT_CODE[k][1]()}</article>`).join('') : '<p class="card">Noch leer. Spiel die erste Stufe – dann steht hier eure erste Abmachung.</p>'}</section>`;
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
    earned = m.pts + 5 + (m.hints ? 0 : 3);
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
  try { if (!rwCalm()) confetti(first ? 60 : 25); } catch (e) { }
}
function ltResult(m) {
  const r = m.res, L = LT_LV[m.lv - 1], nxt = m.lv < LT_MAX && m.lv + 1 <= ltS().lv;
  const why = r.first ? `${m.pts} für gelöste Aufgaben · 5 für die Stufe${m.hints ? '' : ' · 3 ganz ohne Tipp'}` : r.rep ? '2 fürs Wiederholen' : 'Heute gibt es fürs Wiederholen keine Lichtpunkte mehr. Schlauer wirst du trotzdem!';
  return topBar('Blinkis Lichterturm', 'licht') + `<section class="lt-stage lt-res"><div class="lt-scene">${ltBot('happy', true)}<div class="lt-bub from-l">${esc(L.nx)}</div></div>
    <h2>Stufe ${m.lv} geschafft!</h2>
    ${r.earned ? `<p class="lt-earn">✨ +${r.earned} Lichtpunkte</p>` : ''}<p class="small lt-why">${esc(why)}</p>
    ${r.gold ? '<p class="lt-gold">🏆 Dein Turm bekommt ein goldenes Dach!</p>' : ''}
    <div class="lt-learn"><b>Das hast du entdeckt</b><p>${esc(L.c)}</p></div>
    <div class="lt-act">${nxt ? `<button class="lt-btn" data-act="ltLv" data-arg="${m.lv + 1}">Weiter: Stufe ${m.lv + 1}</button>` : ''}<button class="lt-btn sec" data-act="ltHub">Zum Turm</button></div></section>`;
}

/* ---------- fliegende Leuchtpunkte (nach dem Zeichnen) ---------- */
function ltAfter() {
  const m = UI.lt; if (!m || !m.fx) return;
  const fx = m.fx; m.fx = null;
  if (fx.fly) {
    const bowl = document.getElementById('ltBowl'); if (!bowl || rwCalm()) return;
    const b = bowl.getBoundingClientRect(), dots = [...document.querySelectorAll('.lt-row.mine .lt-lamp.on .lt-dot')];
    dots.forEach((d, k) => {
      const r = d.getBoundingClientRect(), f = document.createElement('i'); f.className = 'lt-fly';
      f.style.left = r.left + 'px'; f.style.top = r.top + 'px'; document.body.appendChild(f);
      const dx = b.left + b.width / 2 - r.left, dy = b.top + b.height / 2 - r.top;
      try {
        const a = f.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx * .5}px,${dy * .5 - 60}px) scale(1.3)`, opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.6)`, opacity: .2 }], { duration: 650 + k * 45, easing: 'cubic-bezier(.3,.1,.3,1)' });
        a.onfinish = () => { f.remove(); if (k % 2 === 0) ltPlay('plink'); };
      } catch (e) { f.remove(); }
    });
  }
}

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
