/* =====================================================================
AVATAR „Mein Avatar“ – eigenes Porträt (Memoji-Stil, Pastell, kein Pink)
---------------------------------------------------------------------
Öffentliche API (global):  meSVG(look, mood)  → '<svg class="mascot" viewBox="0 0 200 200">…'
Look (S.av.look, nur Ids/Farben):
{ skin:'#hex', hair:'hair.bob', hairC:'#hex'|'g:rainbow', eyes:'eyes.round', eyesC:'#hex'|'g:…', mouth:'mouth.smile', top:'top.tee', topC:'#hex'|'g:…',
  acc:['acc.glasses1',…], bg:'bg.mint', fx:'fx.none' }
Ablauf: 1) kurze Ersteinrichtung (nur kostenlose Grundteile, auch wenn UI.ro), solange S.av.look fehlt.
        2) Danach ist alles Weitere verdient: Shop (Münzen) oder Meilenstein. Gestalten nur wenn !UI.ro; sonst nur ansehen (Sammlung).
Katalog (rewards.js): avhair avtop aveyes avmouth avacc avbg avfx avcolor  (Gruppe 'avatar')
Alle Aktionen heißen av… ; Eintritt: ACT.avatar. Eigenes CSS: feat_avatar.css (Präfix av-).
===================================================================== */
(function () {
'use strict';
/* ---------- Farb-Helfer ---------- */
const _hx = {};
function hx(h) {
if (_hx[h]) return _hx[h];
let s = String(h || '#888').replace('#', ''); if (s.length === 3) s = s.replace(/./g, '$&$&');
const n = parseInt(s, 16) || 0; return (_hx[h] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
}
const rgb = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const _mx = {};
function mix(a, b, t) {
const k = a + b + t; if (_mx[k]) return _mx[k];
const x = hx(a), y = hx(b); return (_mx[k] = rgb(x.map((v, i) => v + (y[i] - v) * t)));
}
const dk = (c, t) => mix(c, '#1d1530', t), lt = (c, t) => mix(c, '#ffffff', t);
/* Verläufe für „besondere“ Farben: 'g:<name>' */
const GR = {
rainbow: ['#ff5a3c', '#ffb43a', '#ffe14d', '#59d97a', '#3fb0ff', '#7b5cd6'],
galaxy: ['#2b2a78', '#6a4fd8', '#2fb6d6', '#7b5cd6'],
gold: ['#ffe58a', '#e8b52c', '#fff0b0', '#d9a21f'],
silver: ['#f4f6fb', '#aab3c6', '#eef0f7', '#8f99ae']
};
const isCol = v => typeof v === 'string' && (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v) || (v.slice(0, 2) === 'g:' && !!GR[v.slice(2)]));
let DS = {};                                                   // pro Render registrierte Verlaufs-IDs
let DEFS = '';
function G(id, stops, a, rad) {                                // lineare/radiale Verlaufs-Definition (einmal pro SVG)
if (!DS[id]) {
DS[id] = 1;
const st = stops.map((c, i) => `<stop offset="${stops.length < 2 ? 0 : +(i / (stops.length - 1)).toFixed(3)}" stop-color="${c}"/>`).join('');
DEFS += rad ? `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${a[0]}" cy="${a[1]}" r="${a[2]}">${st}</radialGradient>`
: a === 'bb' ? `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${st}</linearGradient>`
: `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${a ? a[0] : 0}" y1="${a ? a[1] : 0}" x2="${a ? a[2] : 0}" y2="${a ? a[3] : 200}">${st}</linearGradient>`;
}
return `url(#${id})`;
}
/* Farbe → {f: Füllung, b: Grundton, d: dunkler, l: heller} */
function FC(v, bb) {
if (v && v.slice(0, 2) === 'g:' && GR[v.slice(2)]) {
const n = v.slice(2), st = GR[n], base = st[Math.floor(st.length / 2)];
return { f: G('avg-' + n + (bb ? 'b' : ''), st, bb ? 'bb' : [40, 30, 160, 170]), b: base, d: dk(base, .28), l: lt(base, .35), g: 1 };
}
const b = isCol(v) ? v : '#888888';
return { f: b, b, d: dk(b, .22), l: lt(b, .3) };
}
function SK(c) {
return { b: c, s: mix(c, '#6b3320', .16), s2: mix(c, '#6b3320', .34), h: mix(c, '#ffffff', .3), bl: mix(c, '#e8643c', .38), lip: mix(c, '#a8553a', .55), hi: mix(c, '#ffffff', .5) };
}
const INK = '#2a2233', MOUTHD = '#6b2a2f', TONGUE = '#e9a15a';
const f1 = n => +n.toFixed(1);
/* ---------- Teile-Tabellen ---------- */
const T = { face: [], hair: [], top: [], eyes: [], mouth: [], brow: [], nose: [], acc: [], bg: [], fx: [] };
const BY = {};
const PFX = { face: 'face', hair: 'hair', top: 'top', eyes: 'eyes', mouth: 'mouth', brow: 'brow', nose: 'nose', acc: 'acc', bg: 'bg', fx: 'fx' };
function add(kind, o) { o.id = PFX[kind] + '.' + o.k; o.kind = kind; T[kind].push(o); BY[o.id] = o; return o; }
const star5 = (cx, cy, R, r, rot) => { let d = ''; for (let i = 0; i < 10; i++) { const a = (rot || -90) * Math.PI / 180 + i * Math.PI / 5, q = i % 2 ? r : R; d += (i ? 'L' : 'M') + f1(cx + q * Math.cos(a)) + ' ' + f1(cy + q * Math.sin(a)); } return d + 'Z'; };
const spark4 = (cx, cy, R, r) => `M${cx} ${cy - R}Q${cx + r} ${cy - r} ${cx + R} ${cy}Q${cx + r} ${cy + r} ${cx} ${cy + R}Q${cx - r} ${cy + r} ${cx - R} ${cy}Q${cx - r} ${cy - r} ${cx} ${cy - R}Z`;
/* ---------- Standard-Look (nur kostenlose Teile) ---------- */
const DEFAULT_LOOK = {
skin: '#F2C7A4', hair: 'hair.bob', hairC: '#7a4e2e', eyes: 'eyes.round', eyesC: '#4a2f22', mouth: 'mouth.smile', top: 'top.tee', topC: '#3CCFA0', acc: [], bg: 'bg.mint', fx: 'fx.none'
};
const SLOT_KEY = { hair: 'hair', top: 'top', eyes: 'eyes', mouth: 'mouth', bg: 'bg', fx: 'fx' };
function norm(l) {
l = l && typeof l === 'object' ? l : {};
const o = {}, D = DEFAULT_LOOK;
['skin', 'hairC', 'eyesC', 'topC'].forEach(k => { o[k] = isCol(l[k]) ? l[k] : D[k]; });
Object.keys(SLOT_KEY).forEach(k => { const v = l[k]; o[k] = typeof v === 'string' && BY[v] && BY[v].kind === k ? v : D[k]; });
o.acc = []; const seen = {};
(Array.isArray(l.acc) ? l.acc : []).forEach(v => { const p = typeof v === 'string' && BY[v]; if (p && p.kind === 'acc' && !seen[p.slot]) { seen[p.slot] = 1; o.acc.push(v); } });
return o;
}
/* ---------- Rendern ---------- */
const FALLBACK = '<svg class="mascot" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="200" height="200" fill="#E9E4FF"/><circle cx="100" cy="90" r="42" fill="#F2C7A4"/><path d="M20 200C20 170 60 156 100 156S180 170 180 200Z" fill="#3CCFA0"/></svg>';
function paint(look, mood, o) {
o = o || {};
const L = norm(look);
mood = mood === 'cheer' || mood === 'sad' || mood === 'think' ? mood : 'happy';
DS = {}; DEFS = '';
const C = { L, mood, sk: SK(L.skin), hc: FC(L.hairC), tc: FC(L.topC), ec: FC(L.eyesC, 1), ink: INK, om: o.omit || {} };
const face = BY['face.round'], om = C.om;
let out = '';
if (o.bg !== false) out += `<g class="av-bg">${BY[L.bg].d(C)}</g>`;
const fx = BY[L.fx];
if (!om.fx && fx && fx.z === 'b') out += `<g class="av-fx">${fx.d(C)}</g>`;
const accs = om.acc ? [] : L.acc.map(id => BY[id]);
const accOf = (...slots) => [].concat(...slots.map(sl => accs.filter(a => a.slot === sl))).map(a => a.d(C)).join('');
const hair = om.hair ? null : BY[L.hair];
const hb = hair && hair.b ? hair.b(C.hc, C) : '', hm = hair && hair.m ? hair.m(C.hc, C) : '', hf = hair && hair.f ? hair.f(C.hc, C) : '';
const top = om.top ? '' : BY[L.top].d(C.tc, C.sk, C);
const sk = C.sk, ex = face.ex;
const neck = `<path d="M85 118H115V190H85Z" fill="${sk.b}"/><path d="M85 128Q100 156 115 128V150Q100 164 85 150Z" fill="${sk.s}" opacity=".7"/>`;
const head = `<g class="av-face"><ellipse cx="${100 - ex}" cy="99" rx="7.5" ry="10.5" fill="${sk.b}"/><ellipse cx="${100 - ex + .5}" cy="99" rx="3.4" ry="6" fill="${sk.s}" opacity=".5"/><ellipse cx="${100 + ex}" cy="99" rx="7.5" ry="10.5" fill="${sk.b}"/><ellipse cx="${100 + ex - .5}" cy="99" rx="3.4" ry="6" fill="${sk.s}" opacity=".5"/>` +
`<path d="${face.d}" fill="${sk.b}"/><ellipse cx="88" cy="63" rx="15" ry="7" transform="rotate(-12 88 63)" fill="${sk.h}" opacity=".22"/><ellipse cx="76" cy="113" rx="8" ry="5" fill="${sk.bl}" opacity=".2"/><ellipse cx="124" cy="113" rx="8" ry="5" fill="${sk.bl}" opacity=".2"/></g>`;
/* Gesichtsteile */
const eyeY = 95, eyeX = 20;
let eyes;
if (mood === 'cheer') eyes = [-1, 1].map(s => `<path d="M${100 + s * eyeX - 7.5} ${eyeY + 2.5}Q${100 + s * eyeX} ${eyeY - 8.5} ${100 + s * eyeX + 7.5} ${eyeY + 2.5}" stroke="${INK}" stroke-width="3.6" fill="none"/>`).join('');
else {
const E = BY[L.eyes], dx = mood === 'think' ? 2.5 : 0, dy = mood === 'think' ? -2 : mood === 'sad' ? 1.6 : 0;
eyes = `<g transform="translate(${dx} ${dy})">` + [-1, 1].map(s => `<g transform="translate(${100 + s * eyeX} ${eyeY}) scale(1.2) translate(${-100 - s * eyeX} ${-eyeY})">${E.d(100 + s * eyeX, eyeY, s, C)}</g>`).join('') + '</g>';
}
const B = BY['brow.soft'], bc = dk(C.hc.b, .5), mt = { happy: [0, 0, 0, 0], cheer: [-3, -3, 0, 0], sad: [1, 1, 13, 13], think: [-6, 0, -4, 3] }[mood];
const brows = [-1, 1].map((s, i) => { const x = 100 + s * eyeX; return `<g transform="translate(0 ${mt[i]}) rotate(${s * mt[2 + i]} ${x} 83)">${B.d(x, 83, s, bc, C)}</g>`; }).join('');
let mouth;
if (mood === 'cheer') mouth = BY['mouth.open'].d(C);
else if (mood === 'sad') mouth = `<path d="M91 126Q100 119 109 126" stroke="${sk.lip}" stroke-width="3.2" fill="none"/>`;
else if (mood === 'think') mouth = `<path d="M93 123Q101 121 108 125" stroke="${sk.lip}" stroke-width="3.2" fill="none"/>`;
else mouth = BY[L.mouth].d(C);
const mood2 = mood === 'cheer' ? `<g fill="#FFC93C"><path d="${star5(34, 50, 9, 3.8)}"/><path d="${star5(168, 60, 7, 3)}"/><path d="${spark4(150, 34, 6, 1.6)}" fill="#fff"/><path d="${spark4(48, 122, 5, 1.3)}" fill="#fff"/></g>` : mood === 'think' ? `<g fill="#fff" stroke="#b9b1d6" stroke-width="1.6"><circle cx="150" cy="52" r="3"/><circle cx="160" cy="40" r="4.5"/><ellipse cx="164" cy="22" rx="14" ry="10"/></g><text x="164" y="27" font-size="14" font-weight="800" text-anchor="middle" fill="#7b5cd6" font-family="Nunito,Arial,sans-serif">?</text>` : '';
const pc = n => `<g class="av-${n}">`;
out += `<g class="mbody"><g transform="translate(100 125) scale(1.1) translate(-100 -125)">` +
(hb ? pc('hair') + hb + '</g>' : '') +
neck + '<g transform="translate(0 -7)">' + pc('top') + top + '</g>' + (accs.some(a => a.slot === 'neck') ? pc('acc') + accOf('neck') + '</g>' : '') + '</g>' +
(hm ? pc('hair') + hm + '</g>' : '') +
head + pc('nose') + BY['nose.dot'].d(C) + '</g>' + pc('mouth') + '<g transform="translate(0 -2)">' + mouth + '</g></g>' + pc('eyes') + eyes + '</g>' + pc('brow') + brows + '</g>' +
(hf ? pc('hair') + hf + '</g>' : '') +
(accs.length ? pc('acc') + accOf('hair', 'head', 'ear', 'glass') + '</g>' : '') + '</g></g>' + mood2 +
(!om.fx && fx && fx.z !== 'b' ? `<g class="av-fx">${fx.d(C)}</g>` : '');
return `<svg class="${o.cls || 'mascot'}" viewBox="${o.vb || '0 0 200 200'}"${o.slice ? ' preserveAspectRatio="xMidYMid slice"' : ''} xmlns="http://www.w3.org/2000/svg" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round"><defs>${DEFS}</defs>${out}</svg>`;
}
function meSVG(look, mood) { try { return paint(look, mood); } catch (e) { try { console.error('meSVG', e); } catch (x) { } return FALLBACK; } }
meSVG.raw = paint;
window.meSVG = meSVG;
/* ---------- Gesichtsformen ---------- */
add('face', { k: 'round', n: 'Rund', s: '0', ex: 42, d: 'M100 45C125 45 142 65 142 93C142 120 126 137 100 137C74 137 58 120 58 93C58 65 75 45 100 45Z' });
/* ---------- Nasen (Mitte x=100, y≈108) ---------- */
add('nose', { k: 'dot', n: 'Pünktchen', s: '0', d: C => `<ellipse cx="100" cy="108" rx="2.6" ry="1.9" fill="${C.sk.s2}" opacity=".75"/>` });
/* ---------- Augen (links s=-1, rechts s=+1) ---------- */
const glint = (x, y, r) => `<circle cx="${f1(x + r * .42)}" cy="${f1(y - r * .46)}" r="${f1(r * .3)}" fill="#fff"/><circle cx="${f1(x - r * .36)}" cy="${f1(y + r * .4)}" r="${f1(r * .14)}" fill="#fff" opacity=".75"/>`;
add('eyes', { k: 'round', n: 'Rund', s: '0', d: (x, y, s, C) => `<ellipse cx="${x}" cy="${y}" rx="6.4" ry="7.3" fill="${C.ec.f}"/><ellipse cx="${x}" cy="${y + .5}" rx="3.4" ry="4" fill="${C.ink}"/>${glint(x, y, 7)}` });
add('eyes', { k: 'dot', n: 'Punkte', s: '0', d: (x, y, s, C) => `<circle cx="${x}" cy="${y}" r="4.6" fill="${C.ink}"/><circle cx="${x + 1.6}" cy="${y - 1.7}" r="1.5" fill="#fff"/>` });
add('eyes', { k: 'sclera', n: 'Natürlich', s: '0', d: (x, y, s, C) => `<ellipse cx="${x}" cy="${y}" rx="8.4" ry="6.8" fill="#fff"/><circle cx="${x}" cy="${y}" r="5.3" fill="${C.ec.f}"/><circle cx="${x}" cy="${y}" r="2.6" fill="${C.ink}"/><circle cx="${x + 1.8}" cy="${y - 1.8}" r="1.4" fill="#fff"/><path d="M${x - 9} ${y - .5}Q${x} ${y - 10.5} ${x + 9} ${y - .5}" stroke="${C.ink}" stroke-width="2.5" fill="none"/>` });
add('eyes', { k: 'big', n: 'Große Augen', s: 'c25', d: (x, y, s, C) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="9.6" fill="${C.ec.f}"/><ellipse cx="${x}" cy="${y - 4}" rx="8" ry="5.6" fill="${C.ec.d}" opacity=".35"/><ellipse cx="${x}" cy="${y + .6}" rx="4.3" ry="5.2" fill="${C.ink}"/><circle cx="${x + 3}" cy="${y - 3.4}" r="2.7" fill="#fff"/><circle cx="${x - 2.6}" cy="${y + 3.6}" r="1.3" fill="#fff"/><path d="M${x - 8.4} ${y - 3}Q${x - 6} ${y - 9.6} ${x + 1} ${y - 9.8}Q${x + 6.4} ${y - 9.6} ${x + 8.4} ${y - 3.4}" stroke="${C.ink}" stroke-width="2.4" fill="none"/>` });
add('eyes', { k: 'lash', n: 'Wimpern', s: 'c30', d: (x, y, s, C) => `<ellipse cx="${x}" cy="${y}" rx="6.2" ry="7" fill="${C.ec.f}"/><ellipse cx="${x}" cy="${y + .5}" rx="3.3" ry="3.9" fill="${C.ink}"/>${glint(x, y, 7)}<path d="M${x + s * 5.4} ${y - 4.6}l${s * 4.2} -3.2M${x + s * 6.4} ${y - 1.4}l${s * 4.8} -1.8M${x + s * 6.6} ${y + 1.6}l${s * 4.4} .4" stroke="${C.ink}" stroke-width="2"/><path d="M${x - 6.8} ${y - 3.4}Q${x} ${y - 9.6} ${x + 6.8} ${y - 3.4}" stroke="${C.ink}" stroke-width="2.2" fill="none"/>` });
add('eyes', { k: 'cat', n: 'Katzenaugen', s: 'L3', d: (x, y, s, C) => `<path d="M${x - 8.5} ${y + 1}Q${x} ${y - 9} ${x + 8.5} ${y + 1}Q${x} ${y + 8} ${x - 8.5} ${y + 1}Z" fill="${C.ec.f}"/><ellipse cx="${x}" cy="${y + .4}" rx="1.9" ry="5.6" fill="${C.ink}"/><circle cx="${x + 3}" cy="${y - 2}" r="1.5" fill="#fff"/><path d="M${x - 9} ${y + 1}Q${x} ${y - 10} ${x + 9} ${y + 1}" stroke="${C.ink}" stroke-width="2.4" fill="none"/><path d="M${x + s * 8.6} ${y}l${s * 4.6} -3.6" stroke="${C.ink}" stroke-width="2.2"/>` });
add('eyes', { k: 'star', n: 'Sternenaugen', s: 'S20', d: (x, y, s, C) => `<path d="${star5(x, y + .5, 9.4, 4.4)}" fill="${C.ec.f}" stroke="${C.ec.d}" stroke-width="1.2"/><circle cx="${x + 1.2}" cy="${y - 1.2}" r="1.5" fill="#fff"/>` });
add('eyes', { k: 'sparkle', n: 'Funkelaugen', s: 'x', d: (x, y, s, C) => `<circle cx="${x}" cy="${y}" r="8.4" fill="${C.ec.f}"/><circle cx="${x}" cy="${y - 4}" r="8" fill="${C.ec.d}" opacity=".25"/><circle cx="${x}" cy="${y + .6}" r="4.2" fill="${C.ink}"/><path d="${spark4(x + 3, y - 3, 4.6, 1)}" fill="#fff"/><circle cx="${x - 3}" cy="${y + 3.6}" r="1.4" fill="#fff"/>` });
/* ---------- Augenbrauen (x = Augenmitte, y = 83) ---------- */
add('brow', { k: 'soft', n: 'Sanft', s: '0', d: (x, y, s, c) => `<path d="M${x - 8} ${y + 1}Q${x} ${y - 5} ${x + 8} ${y + 1}" stroke="${c}" stroke-width="3.2" fill="none"/>` });
/* ---------- Münder (Mitte x=100, y≈120) ---------- */
const lipS = (C, d, w) => `<path d="${d}" stroke="${C.sk.lip}" stroke-width="${w || 3.4}" fill="none"/>`;
const mouthBase = 'M86 116Q100 119 114 116Q112 135 100 135Q88 135 86 116Z';
add('mouth', { k: 'smile', n: 'Lächeln', s: '0', d: C => lipS(C, 'M88 118Q100 130 112 118') });
add('mouth', { k: 'grin', n: 'Strahlen', s: '0', d: C => `<path d="M85 116Q100 121 115 116Q112 133 100 133Q88 133 85 116Z" fill="${MOUTHD}"/><path d="M87 117.2Q100 121.5 113 117.2Q112 121 110 123.2Q100 125.4 90 123.2Q88 121 87 117.2Z" fill="#fff"/>` });
add('mouth', { k: 'open', n: 'Lachen', s: '0', d: C => `<path d="${mouthBase}" fill="${MOUTHD}"/><path d="M88 117.4Q100 120.2 112 117.4Q111.4 120.6 110 122Q100 123.8 90 122Q88.6 120.6 88 117.4Z" fill="#fff"/><path d="M92 131.4Q100 123.4 108 131.4Q104 135 100 135Q96 135 92 131.4Z" fill="${TONGUE}"/>` });
add('mouth', { k: 'smirk', n: 'Schmunzeln', s: 'c20', d: C => lipS(C, 'M90 123Q102 126 112 116') + `<path d="M113.4 114.4l1 2.2" stroke="${C.sk.s2}" stroke-width="1.6"/>` });
add('mouth', { k: 'tongue', n: 'Zunge raus', s: 'c40', d: C => `<path d="M95 121.4V128A5 5 0 0 0 105 128V121.4Z" fill="${TONGUE}"/><path d="M100 123.4V127" stroke="#c75a44" stroke-width="1.2"/>` + lipS(C, 'M87 118Q100 129 113 118') });
/* ---------- Gesichts-Extras ---------- */
/* ---------- Haare: b = hinter dem Körper, m = über den Schultern (vor dem Hals), f = vor dem Gesicht ---------- */
const PP = (d, f, x) => `<path d="${d}" fill="${f}"${x || ''}/>`;
const MR = ' transform="matrix(-1 0 0 1 200 0)"';
const M2 = (d, f, x) => PP(d, f, x) + PP(d, f, (x || '') + MR);
const HL = (d, c, w, o) => `<path d="${d}" stroke="${c}" stroke-width="${w || 3}" fill="none" opacity="${o || .5}"/>`;
const SH = d => `<path d="${d}" transform="translate(0 3.6)" fill="#4a1f12" opacity=".17"/>`;
const TIE = '#FFC93C';
const tieAt = (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="6.4" ry="4.4" transform="rotate(${r || 0} ${x} ${y})" fill="${TIE}"/>`;
const circ = (a, f, st) => a.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="${p[2]}" fill="${f}"${st || ''}/>`).join('');
const mirC = a => a.concat(a.map(p => [200 - p[0], p[1], p[2]]));
const DOME = 'M52 104C42 56 66 30 100 30S158 56 148 104Z';
const FR_PART = 'M57 94C52 52 74 36 100 36C126 36 148 52 143 94C141 76 128 60 100 55C72 60 59 76 57 94Z';          // Mittelscheitel
const FR_BACK = 'M58 92C53 54 76 38 100 38C126 38 146 54 142 92C141 78 134 64 122 58C108 64 90 64 78 58C66 64 59 78 58 92Z';  // nach hinten gekämmt
const FR_BLUNT = 'M57 93C52 56 74 37 100 37C126 37 148 56 143 93C142 84 140 76 136 71Q100 84 64 71C60 76 58 84 57 93Z';
const partLine = c => HL('M100 37V55', c.d, 2, .4);
function braid(x0, y0, x1, y1, n, c, rx, ry) {
let s = '';
for (let i = 0; i < n; i++) {
const t = i / (n - 1), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, k = i % 2 ? 1 : -1;
s += `<ellipse cx="${f1(x + k * rx * .3)}" cy="${f1(y)}" rx="${rx}" ry="${ry}" transform="rotate(${k * -26} ${f1(x)} ${f1(y)})" fill="${c.f}" stroke="${c.d}" stroke-width="1.2"/>`;
}
return s;
}
const sideLocks = 'M56 90C52 112 52 136 58 150Q66 154 72 148C67 132 66 112 66 96Z';
add('hair', { k: 'short', n: 'Kurz', s: '0',
b: c => PP(DOME, c.f),
f: c => { const d = 'M57 93C52 58 74 38 100 38C127 38 148 58 143 93C141 82 138 73 131 67C118 74 104 72 94 64C88 74 74 78 65 84C61 87 58 90 57 93Z'; return SH(d) + PP(d, c.f) + HL('M74 54Q88 44 108 45', c.l) + HL('M112 52Q122 56 127 64', c.d, 2, .35); } });
add('hair', { k: 'buzz', n: 'Ganz kurz', s: '0',
b: c => PP('M55 100C48 58 70 38 100 38S152 58 145 100Z', c.f),
f: c => PP('M57 93C52 60 72 42 100 42C128 42 148 60 143 93C142 80 138 68 128 62C112 56 88 56 72 62C62 68 58 80 57 93Z', c.f) + HL('M74 52Q90 45 108 46', c.l, 2.6, .4) });
add('hair', { k: 'bob', n: 'Bob', s: '0',
b: c => PP('M52 104C42 56 66 30 100 30S158 56 148 104L151 140Q151 152 138 152H62Q49 152 49 140Z', c.f),
f: c => SH(FR_BLUNT) + PP(FR_BLUNT, c.f) + HL('M72 52Q88 43 108 44', c.l) + M2(sideLocks, c.f) + HL('M54 112Q54 130 58 144', c.d, 2, .3) + HL('M146 112Q146 130 142 144', c.d, 2, .3) });
add('hair', { k: 'long', n: 'Lang', s: '0',
b: c => PP('M49 100C39 52 66 30 100 30S161 52 151 100C156 130 160 160 158 192H42C40 160 44 130 49 100Z', c.f),
m: c => M2('M51 96C45 130 42 166 44 196H72C66 162 66 128 66 100Z', c.f) + HL('M52 140Q50 168 54 190', c.d, 2.2, .3) + HL('M148 140Q150 168 146 190', c.d, 2.2, .3),
f: c => SH(FR_PART) + PP(FR_PART, c.f) + partLine(c) + HL('M68 56Q84 44 100 44', c.l) + HL('M132 56Q116 44 100 44', c.l, 3, .3) });
add('hair', { k: 'curly', n: 'Locken', s: 'c35',
b: c => circ(mirC([[54, 64, 17], [44, 88, 17], [44, 112, 16], [50, 134, 15], [68, 42, 17], [88, 34, 17]]).concat([[100, 32, 17], [50, 156, 14]]), c.f, ' stroke="' + c.d + '" stroke-opacity=".28" stroke-width="1.2"'),
m: c => circ(mirC([[52, 150, 15], [50, 172, 15], [62, 186, 13]]), c.f, ' stroke="' + c.d + '" stroke-opacity=".28" stroke-width="1.2"'),
f: c => circ(mirC([[68, 64, 12], [82, 56, 12], [58, 82, 10]]).concat([[100, 54, 12]]), c.f, ' stroke="' + c.d + '" stroke-opacity=".3" stroke-width="1.2"') + HL('M84 50Q92 44 100 48', c.l, 2.4, .5) });
add('hair', { k: 'afro', n: 'Afro', s: '0',
b: c => { let s = '<ellipse cx="100" cy="74" rx="56" ry="48" fill="' + c.f + '"/>'; for (let a = -200; a <= 20; a += 22) s += `<circle cx="${f1(100 + 54 * Math.cos(a * Math.PI / 180))}" cy="${f1(80 + 52 * Math.sin(a * Math.PI / 180))}" r="17" fill="${c.f}"/>`; return s; },
f: c => PP('M58 92C54 62 76 48 100 48C124 48 146 62 142 92C138 76 126 66 100 64C74 66 62 76 58 92Z', c.f) + HL('M70 62Q84 52 100 52', c.l) });
add('hair', { k: 'pony', n: 'Pferdeschwanz', s: '0',
b: c => PP(DOME, c.f) + PP('M116 40C150 20 188 46 180 94C176 116 166 130 172 152C156 142 152 124 156 104C160 78 146 62 124 58Z', c.f) + HL('M150 70Q166 84 160 112', c.d, 2.4, .3),
f: c => SH(FR_BACK) + PP(FR_BACK, c.f) + tieAt(122, 47, -30) + HL('M72 54Q88 44 106 45', c.l) });
add('hair', { k: 'pigtails', n: 'Zöpfe', s: 'c25',
b: c => PP(DOME, c.f),
m: c => M2('M56 108C40 124 38 152 46 178C54 190 70 186 70 172C64 152 68 128 72 112Z', c.f) + HL('M52 136Q50 158 56 176', c.d, 2.2, .3) + HL('M148 136Q150 158 144 176', c.d, 2.2, .3) + tieAt(60, 112, -40) + tieAt(140, 112, 40),
f: c => SH(FR_PART) + PP(FR_PART, c.f) + partLine(c) + HL('M70 54Q86 45 100 45', c.l) });
add('hair', { k: 'braids', n: 'Geflochtene Zöpfe', s: 'x',
b: c => PP(DOME, c.f),
m: c => braid(60, 118, 48, 176, 7, c, 8.6, 6.4) + braid(140, 118, 152, 176, 7, c, 8.6, 6.4) + tieAt(47, 186, 0) + tieAt(153, 186, 0) + tieAt(61, 112, -30) + tieAt(139, 112, 30),
f: c => SH(FR_PART) + PP(FR_PART, c.f) + partLine(c) + HL('M70 54Q86 45 100 45', c.l) });
add('hair', { k: 'bun', n: 'Dutt', s: '0',
b: c => PP(DOME, c.f) + `<circle cx="100" cy="34" r="19" fill="${c.f}"/>` + HL('M88 30Q100 21 112 30M91 40Q100 33 109 40', c.d, 2.2, .35),
f: c => SH(FR_BACK) + PP(FR_BACK, c.f) + `<path d="M84 46Q100 53 116 46" stroke="${TIE}" stroke-width="4.4" fill="none"/>` + HL('M72 56Q86 47 104 48', c.l) });
add('hair', { k: 'spacebuns', n: 'Space Buns', s: 'x',
b: c => PP(DOME, c.f) + `<circle cx="66" cy="38" r="17" fill="${c.f}"/><circle cx="134" cy="38" r="17" fill="${c.f}"/>` + HL('M56 34Q66 25 76 34M124 34Q134 25 144 34', c.d, 2.2, .35),
f: c => SH(FR_PART) + PP(FR_PART, c.f) + partLine(c) + tieAt(76, 52, -40) + tieAt(124, 52, 40) });
/* ---------- Kleidung (Oberkörper, y ≥ 150) ---------- */
const NECK = { crew: 'Q100 175 124 155', scoop: 'C84 183 116 183 124 155', v: 'L100 184L124 155', v2: 'L100 170L124 155', sq: 'L81 174H119L124 155', none: 'L124 155' };
const body = n => 'M14 214V190C14 177 38 161 76 155' + NECK[n] + 'C162 161 186 177 186 190V214Z';
function CP(n) { const id = 'avcp-' + n; if (!DS[id]) { DS[id] = 1; DEFS += `<clipPath id="${id}"><path d="${body(n)}"/></clipPath>`; } return `url(#${id})`; }
const arms = c => M2('M14 200C14 177 38 161 62 157C48 172 44 188 46 200Z', c.d, ' opacity=".28"');
const neckEdge = (n, c, w) => `<path d="M76 155${NECK[n]}" stroke="${c}" stroke-width="${w || 3.6}" fill="none"/>`;
const bodyP = (n, f) => `<path d="${body(n)}" fill="${f}"/>`;
const btn = (x, y, c, r) => `<circle cx="${x}" cy="${y}" r="${r || 2.6}" fill="${c || '#fff'}"/>`;
const DENIM = '#5B86C9', WHITE = '#F5F6FB';
const tee = (c, n) => bodyP(n || 'crew', c.f) + arms(c) + neckEdge(n || 'crew', c.d, 4);
add('top', { k: 'tee', n: 'T-Shirt', s: '0', d: c => tee(c) + HL('M30 186Q34 172 44 166', c.l, 3, .45) });
add('top', { k: 'vneck', n: 'V-Shirt', s: '0', d: c => tee(c, 'v') + HL('M30 186Q34 172 44 166', c.l, 3, .45) });
add('top', { k: 'hoodie', n: 'Kapuzenpulli', s: '0', d: c =>
`<path d="M68 160C60 136 72 122 86 120L90 136Q100 147 110 136L114 120C128 122 140 136 132 160Z" fill="${c.d}"/>` + bodyP('crew', c.f) + arms(c) + neckEdge('crew', c.d, 5) +
`<path d="M62 200L68 184Q100 193 132 184L138 200Z" fill="${c.d}" opacity=".4"/><path d="M92 170V186M108 170V186" stroke="#fff" stroke-width="2.4"/>` + btn(92, 187, '#fff', 2.2) + btn(108, 187, '#fff', 2.2) });
add('top', { k: 'stripes', n: 'Ringelshirt', s: 'c20', d: c =>
tee(c) + `<g clip-path="${CP('crew')}" fill="#fff" opacity=".92"><rect x="0" y="163" width="200" height="6"/><rect x="0" y="177" width="200" height="6"/><rect x="0" y="191" width="200" height="6"/></g>` + neckEdge('crew', c.d, 4) });
add('top', { k: 'polo', n: 'Polo', s: 'c25', d: c =>
tee(c, 'v2') + `<path d="M76 155L90 168L100 160L110 168L124 155L116 150Q100 160 84 150Z" fill="${c.l}" stroke="${c.d}" stroke-width="1.2"/><path d="M100 160V186" stroke="${c.d}" stroke-width="1.6"/>` + btn(100, 172, c.d, 1.8) + btn(100, 182, c.d, 1.8) });
add('top', { k: 'knit', n: 'Strickpulli', s: 'c35', d: c =>
tee(c) + [52, 64, 136, 148].map(x => `<path d="M${x} 168q4 8 0 16t0 16" stroke="${c.d}" stroke-width="2.4" fill="none" opacity=".35"/>`).join('') + [84, 92, 100, 108, 116].map(x => `<path d="M${x} 176v24" stroke="${c.d}" stroke-width="1.6" opacity=".25"/>`).join('') + neckEdge('crew', c.d, 7) });
add('top', { k: 'dress', n: 'Kleid', s: 'c35', d: c =>
bodyP('scoop', c.f) + arms(c) + neckEdge('scoop', c.d, 3.6) + `<g fill="#fff" opacity=".8">${[[50, 180], [70, 192], [130, 192], [150, 180], [100, 196], [34, 192], [166, 192], [84, 178], [116, 178]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.8"/>`).join('')}</g>` });
add('top', { k: 'overall', n: 'Latzhose', s: 'x', d: c =>
bodyP('crew', WHITE) + arms({ d: '#9aa3bd' }) + neckEdge('crew', '#D5D9E8', 3.4) + `<path d="M76 172L64 156M124 172L136 156" stroke="${c.f}" stroke-width="9"/><path d="M70 200V178Q70 170 78 170H122Q130 170 130 178V200Z" fill="${c.f}"/><path d="M70 200V178Q70 170 78 170H122Q130 170 130 178V200" stroke="${c.d}" stroke-width="1.6" fill="none"/>` + btn(77, 174, '#FFD43B', 3) + btn(123, 174, '#FFD43B', 3) + `<rect x="90" y="182" width="20" height="14" rx="3" fill="none" stroke="${c.d}" stroke-width="1.6"/>` });
add('top', { k: 'jacket', n: 'Jeansjacke', s: 'x', d: c =>
bodyP('crew', c.f) + neckEdge('crew', c.d, 3.4) + `<path d="M14 200C14 177 38 161 76 155L92 164L86 200Z" fill="${DENIM}"/><path d="M186 200C186 177 162 161 124 155L108 164L114 200Z" fill="${DENIM}"/><path d="M76 155L92 164L86 200M124 155L108 164L114 200" stroke="#3f68a8" stroke-width="2.2" fill="none"/><path d="M76 155L94 166L84 174Z M124 155L106 166L116 174Z" fill="#6c97d8" stroke="#3f68a8" stroke-width="1.4"/><path d="M40 182H62M138 182H160" stroke="#8db3ee" stroke-width="2" stroke-dasharray="3 3"/>` + btn(88, 184, '#E8B830', 2.2) + btn(112, 184, '#E8B830', 2.2) });
add('top', { k: 'sequin', n: 'Glitzerjacke', s: 'c140', d: c =>
tee(c, 'v') + `<g fill="#fff" opacity=".85">${[[40, 184], [54, 172], [72, 190], [88, 176], [112, 176], [128, 190], [146, 172], [160, 184], [100, 196], [64, 164], [136, 164], [48, 196], [152, 196]].map((p, i) => `<path d="${spark4(p[0], p[1], 3 + i % 3, .9)}"/>`).join('')}</g><path d="M30 186Q36 170 50 164M170 186Q164 170 150 164" stroke="${c.l}" stroke-width="3" fill="none" opacity=".6"/>` });
add('top', { k: 'tux', n: 'Festlich', s: 'L4', d: c =>
bodyP('v', '#2d3046') + arms({ d: '#000' }) + `<path d="M84 154L100 196L116 154Q100 164 84 154Z" fill="#fff"/><path d="M76 155L100 192L84 200M124 155L100 192L116 200" stroke="#3d4160" stroke-width="3" fill="none"/><path d="M76 155L96 180L84 172Z M124 155L104 180L116 172Z" fill="#3d4160"/>` +
`<path d="M100 160L86 154V166Z M100 160L114 154V166Z" fill="${c.f}" stroke="${c.d}" stroke-width="1.2"/><circle cx="100" cy="160" r="3" fill="${c.d}"/>` });
add('top', { k: 'hero', n: 'Superhelden-Anzug', s: 'S40', d: c =>
bodyP('v2', c.f) + arms(c) + neckEdge('v2', c.d, 4) + `<circle cx="100" cy="186" r="13" fill="#FFD43B" stroke="${c.d}" stroke-width="2"/><path d="${star5(100, 186, 8, 3.4)}" fill="${c.f}"/>` + btn(66, 163, '#FFD43B', 4) + btn(134, 163, '#FFD43B', 4) + `<path d="M66 163Q50 182 46 200M134 163Q150 182 154 200" stroke="${c.d}" stroke-width="3" fill="none" opacity=".5"/>` });
add('top', { k: 'astro', n: 'Raumanzug', s: 'S70', d: c =>
bodyP('none', '#F2F4FA') + arms({ d: '#9aa3bd' }) + `<path d="M20 190Q40 172 70 164L66 174Q44 182 28 200H20Z M180 190Q160 172 130 164L134 174Q156 182 172 200H180Z" fill="${c.f}"/>` + `<path d="M74 157C73 141 84 134 100 134C116 134 127 141 126 157Z" fill="#E6E9F5" stroke="#B9C0D6" stroke-width="2"/><path d="M82 146Q100 154 118 146" stroke="#B9C0D6" stroke-width="2" fill="none"/>` + `<circle cx="78" cy="182" r="8" fill="#3F78C6"/><path d="${star5(78, 182, 5.2, 2.2)}" fill="#fff"/><rect x="108" y="176" width="22" height="14" rx="3" fill="#fff" stroke="#B9C0D6" stroke-width="1.4"/><circle cx="114" cy="183" r="2.2" fill="${c.f}"/><circle cx="123" cy="183" r="2.2" fill="#3F78C6"/>` });
/* ---------- Accessoires: slot = glass | head | hair | ear | neck (pro Slot nur eins) ---------- */
const ex_ = () => 42;
const gold = () => G('ava-gold', GR.gold, [0, 0, 40, 60]);
const silv = () => G('ava-silver', GR.silver, [0, 0, 40, 60]);
const MIRX = ' transform="matrix(-1 0 0 1 200 0)"';
const lensFrame = (d, col, w, fill) => `<path d="${d}" fill="${fill || 'rgba(255,255,255,.16)'}" stroke="${col}" stroke-width="${w}"/><path d="${d}" fill="${fill || 'rgba(255,255,255,.16)'}" stroke="${col}" stroke-width="${w}"${MIRX}/>`;
const temples = (col, w) => `<path d="M66 93L59 91M134 93L141 91" stroke="${col}" stroke-width="${w || 2.4}"/>`;
const bridge = (col, w) => `<path d="M93 94Q100 90 107 94" stroke="${col}" stroke-width="${w || 2.6}" fill="none"/>`;
const shine = (col, op) => `<path d="M72 90L77 86M74 95L82 87" stroke="${col || '#fff'}" stroke-width="2.4" opacity="${op || .6}"/><path d="M112 90L117 86M114 95L122 87" stroke="${col || '#fff'}" stroke-width="2.4" opacity="${op || .6}"/>`;
const circL = 'M67 96a13 13 0 1 0 26 0a13 13 0 1 0 -26 0Z';
add('acc', { k: 'glasses1', n: 'Runde Brille', s: 'c15', slot: 'glass', d: () => lensFrame(circL, '#2a2a3a', 2.6) + bridge('#2a2a3a') + temples('#2a2a3a') + shine() });
add('acc', { k: 'glasses2', n: 'Eckige Brille', s: 'c25', slot: 'glass', d: () => lensFrame('M67 87H93V103Q93 108 88 108H72Q67 108 67 103Z', '#3F78C6', 3) + bridge('#3F78C6', 3) + temples('#3F78C6', 3) + shine() });
/* Kopfbedeckungen */
const capD = (c, c2) => `<path d="M57 68C55 38 80 29 100 29C120 29 145 38 143 68Z" fill="${c}"/><path d="M100 29V67M72 38Q66 52 65 67M128 38Q134 52 135 67" stroke="${c2}" stroke-width="1.6" fill="none" opacity=".35"/><path d="M52 69Q100 86 148 69L152 76Q100 96 48 76Z" fill="${c2}"/><circle cx="100" cy="29.6" r="3.6" fill="${c2}"/><path d="M70 40Q82 33 96 32" stroke="#fff" stroke-width="3" fill="none" opacity=".35"/>`;
add('acc', { k: 'cap1', n: 'Cap', s: 'c20', slot: 'head', d: () => capD('#3F78C6', '#2a58a0') });
const beanieD = (c, c2, pom, st) => `<path d="M56 72C54 34 146 34 144 72Z" fill="${c}"/><path d="M52 60Q100 52 148 60V76Q100 84 52 76Z" fill="${c2}"/>` + [64, 76, 88, 100, 112, 124, 136].map(x => `<path d="M${x} 58V79" stroke="${c}" stroke-width="2" opacity=".5"/>`).join('') + (st ? [44, 52].map(y => `<path d="M60 ${y}Q100 ${y - 8} 140 ${y}" stroke="#fff" stroke-width="3.4" fill="none" opacity=".75"/>`).join('') : '') + `<circle cx="100" cy="31" r="10" fill="${pom}"/><circle cx="97" cy="28" r="3" fill="#fff" opacity=".4"/>`;
add('acc', { k: 'beanie1', n: 'Mütze Türkis', s: 'c30', slot: 'head', d: () => beanieD('#2EC4C9', '#1ea3a8', '#fff') });
add('acc', { k: 'crown', n: 'Goldene Krone', s: 'S120', slot: 'head', d: () => `<path d="M62 62L64 30L83 46L100 24L117 46L136 30L138 62Q100 69 62 62Z" fill="${gold()}" stroke="#C98A00" stroke-width="1.6"/><circle cx="64" cy="29" r="4" fill="#3FB0FF"/><circle cx="100" cy="23" r="4.6" fill="#E8412C"/><circle cx="136" cy="29" r="4" fill="#3CCFA0"/><path d="M70 58Q100 63 130 58" stroke="#fff" stroke-width="2.4" fill="none" opacity=".5"/>` });
add('acc', { k: 'tiara', n: 'Diadem', s: 'c320', slot: 'head', d: () => `<path d="M60 66Q100 26 140 66" stroke="${silv()}" stroke-width="5" fill="none"/><path d="M100 30l7 10l-7 12l-7 -12z" fill="#5AB8FF" stroke="#2E7FD0" stroke-width="1.4"/><circle cx="78" cy="42" r="3.2" fill="#fff"/><circle cx="122" cy="42" r="3.2" fill="#fff"/><circle cx="66" cy="57" r="2.6" fill="#B9A8FF"/><circle cx="134" cy="57" r="2.6" fill="#B9A8FF"/>` });
const phones = (c, c2) => C => { const e = ex_(C), xl = 100 - e - 5, xr = 100 + e + 5; return `<path d="M${xl} 100C${xl - 4} 30 ${xr + 4} 30 ${xr} 100" stroke="#2a2a3a" stroke-width="6.4" fill="none"/><path d="M${xl + 6} 60C${xl + 14} 38 ${xr - 14} 38 ${xr - 6} 60" stroke="#fff" stroke-width="2" fill="none" opacity=".25"/>` + [xl, xr].map(x => `<rect x="${x - 11}" y="84" width="22" height="34" rx="10" fill="${c}"/><rect x="${x - 7}" y="90" width="14" height="22" rx="7" fill="${c2}"/><path d="M${x - 8} 90q-1 -4 3 -5" stroke="#fff" stroke-width="2" fill="none" opacity=".4"/>`).join(''); };
add('acc', { k: 'phones1', n: 'Kopfhörer Schwarz', s: 'c30', slot: 'head', d: phones('#3a3a4e', '#23232e') });
add('acc', { k: 'wizard', n: 'Zauberhut', s: 'c180', slot: 'head', d: () => `<path d="M50 68Q100 86 150 68Q146 62 130 60Q122 34 104 12Q106 28 98 24Q96 44 70 60Q54 62 50 68Z" fill="#5B43C9"/><path d="M50 68Q100 86 150 68Q146 74 100 82Q54 74 50 68Z" fill="#7B5CD6"/><path d="M72 62Q100 70 128 62" stroke="#FFD43B" stroke-width="4" fill="none"/><path d="${star5(100, 48, 7, 3)}" fill="#FFD43B"/><path d="${star5(118, 36, 3.6, 1.6)}" fill="#FFD43B"/>` });
add('acc', { k: 'bunny', n: 'Hasenohren', s: 'x', slot: 'head', d: () => `<path d="M62 56Q60 22 76 18Q90 20 88 56Z" fill="#fff" stroke="#E3E6F0" stroke-width="1.6"/><path d="M68 52Q68 30 76 26Q82 30 82 52Z" fill="#DCD3F7"/><path d="M138 56Q140 22 124 18Q110 20 112 56Z" fill="#fff" stroke="#E3E6F0" stroke-width="1.6"/><path d="M132 52Q132 30 124 26Q118 30 118 52Z" fill="#DCD3F7"/><path d="M58 70Q100 40 142 70" stroke="#C9CFE0" stroke-width="5" fill="none"/>` });
add('acc', { k: 'cat', n: 'Katzenohren', s: 'x', slot: 'head', d: () => `<path d="M58 70Q100 42 142 70" stroke="#3b3b4f" stroke-width="5" fill="none"/><path d="M58 62L62 26L88 48Z" fill="#3b3b4f"/><path d="M142 62L138 26L112 48Z" fill="#3b3b4f"/><path d="M65 54L66 36L80 48Z" fill="#8a82b8"/><path d="M135 54L134 36L120 48Z" fill="#8a82b8"/>` });
add('acc', { k: 'laurel', n: 'Lorbeerkranz', s: 'S90', slot: 'head', d: () => { let s = ''; for (let i = 0; i < 9; i++) { const a = (200 + i * 17.5) * Math.PI / 180; [1, -1].forEach(k => { const x = 100 + k * 44 * Math.cos(a) * -1, y = 82 + 44 * Math.sin(a) * 1.05; s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="3.8" ry="8" transform="rotate(${f1(k * (i * 17.5 - 70))} ${f1(x)} ${f1(y)})" fill="${gold()}" stroke="#C98A00" stroke-width="1"/>`; }); } return s; } });
/* ---------- Geschenk-Zubehör: nur als Überraschung aus dem Shop (Meilensteine, siehe feat_geschenk.js) ---------- */
add('acc', { k: 'party', n: 'Partyhut', s: 'x', slot: 'head', d: () => `<path d="M78 66L100 6L122 66Q100 74 78 66Z" fill="#FFD43B" stroke="#C98A00" stroke-width="1.4"/><path d="M84 50Q100 57 116 50M89 34Q100 40 111 34" stroke="#E5504A" stroke-width="4" fill="none"/><circle cx="100" cy="7" r="6" fill="#3CCFA0"/>` });
add('acc', { k: 'pirate', n: 'Piratenhut', s: 'x', slot: 'head', d: () => `<path d="M46 72Q54 30 100 26Q146 30 154 72Q100 84 46 72Z" fill="#2B2D3A"/><path d="M50 66Q100 78 150 66" stroke="#F4F5FA" stroke-width="2.4" fill="none" opacity=".6"/><circle cx="100" cy="50" r="9" fill="#F4F5FA"/><circle cx="96.5" cy="49" r="2.2" fill="#2B2D3A"/><circle cx="103.5" cy="49" r="2.2" fill="#2B2D3A"/><path d="M90 62L110 56M90 56L110 62" stroke="#F4F5FA" stroke-width="3" stroke-linecap="round"/>` });
add('acc', { k: 'unicorn', n: 'Einhorn-Horn', s: 'x', slot: 'head', d: () => `<path d="M58 72Q100 36 142 72" stroke="#B7A8FF" stroke-width="5.4" fill="none"/><path d="M91 56L100 6L109 56Z" fill="${gold()}" stroke="#C98A00" stroke-width="1.6" stroke-linejoin="round"/><path d="M93 46l14-5M94 36l12-4M96 26l8-3" stroke="#C98A00" stroke-width="2.2"/><path d="${star5(122, 40, 6, 2.6)}" fill="#FFD43B"/>` });
add('acc', { k: 'antenna', n: 'Alien-Fühler', s: 'x', slot: 'head', d: () => `<path d="M58 72Q100 36 142 72" stroke="#2B2D3A" stroke-width="4.4" fill="none"/><path d="M82 52Q72 34 64 20M118 52Q128 34 136 20" stroke="#3CCFA0" stroke-width="3.6" fill="none" stroke-linecap="round"/><circle cx="63" cy="19" r="6.4" fill="#FFD43B" stroke="#C98A00" stroke-width="1.4"/><circle cx="137" cy="19" r="6.4" fill="#FFD43B" stroke="#C98A00" stroke-width="1.4"/>` });
add('acc', { k: 'chef', n: 'Kochmütze', s: 'x', slot: 'head', d: () => `<path d="M64 68V50Q54 32 76 30Q80 12 100 18Q120 12 124 30Q146 32 136 50V68Z" fill="#fff" stroke="#E3E6F0" stroke-width="2"/><path d="M64 60H136" stroke="#E3E6F0" stroke-width="2.4"/><path d="M86 34Q88 46 86 56M114 34Q112 46 114 56" stroke="#E3E6F0" stroke-width="2" fill="none"/>` });
add('acc', { k: 'viking', n: 'Wikingerhelm', s: 'x', slot: 'head', d: () => `<path d="M60 56Q42 52 40 26Q54 40 66 44Z" fill="#F4F5FA" stroke="#C9CFE0" stroke-width="1.6"/><path d="M140 56Q158 52 160 26Q146 40 134 44Z" fill="#F4F5FA" stroke="#C9CFE0" stroke-width="1.6"/><path d="M57 72C55 40 78 30 100 30C122 30 145 40 143 72Z" fill="#9AA3B5" stroke="#6C768C" stroke-width="1.6"/><path d="M57 64H143" stroke="#6C768C" stroke-width="5"/><path d="M100 30V64" stroke="#6C768C" stroke-width="3"/>` });
add('acc', { k: 'shades', n: 'Sonnenbrille', s: 'x', slot: 'glass', d: () => `<rect x="64" y="86" width="31" height="20" rx="8" fill="#23232e"/><rect x="105" y="86" width="31" height="20" rx="8" fill="#23232e"/><path d="M95 91H105" stroke="#23232e" stroke-width="3.4"/><path d="M64 91L56 88M136 91L144 88" stroke="#23232e" stroke-width="3" stroke-linecap="round"/><path d="M69 90l8-1M110 90l8-1" stroke="#fff" stroke-width="2.2" opacity=".4" stroke-linecap="round"/>` });
add('acc', { k: 'starglass', n: 'Sternenbrille', s: 'x', slot: 'glass', d: () => `<path d="${star5(80, 97, 17, 8)}" fill="#FFD43B" fill-opacity=".55" stroke="#C98A00" stroke-width="2.4" stroke-linejoin="round"/><path d="${star5(120, 97, 17, 8)}" fill="#FFD43B" fill-opacity=".55" stroke="#C98A00" stroke-width="2.4" stroke-linejoin="round"/><path d="M95 95H105" stroke="#C98A00" stroke-width="2.6"/>` });
add('acc', { k: 'scarf', n: 'Schal Rot', s: 'x', slot: 'neck', d: () => `<path d="M74 146Q100 162 126 146L128 160Q100 176 72 160Z" fill="#E5504A" stroke="#B93A34" stroke-width="1.4"/><path d="M110 160L122 190L106 192L100 166Z" fill="#E5504A" stroke="#B93A34" stroke-width="1.4"/><path d="M107 176H120M105 184H118" stroke="#fff" stroke-width="2.4" opacity=".7"/>` });
add('acc', { k: 'starneck', n: 'Sternenkette', s: 'x', slot: 'neck', d: () => `<path d="M80 144Q100 170 120 144" stroke="#C98A00" stroke-width="2.2" fill="none"/><path d="${star5(100, 170, 10, 4.6)}" fill="${gold()}" stroke="#C98A00" stroke-width="1.4" stroke-linejoin="round"/>` });
/* Haarschmuck */
add('acc', { k: 'hairband', n: 'Haarreif Mint', s: 'c15', slot: 'hair', d: () => `<path d="M58 72Q100 24 142 72" stroke="#3CCFA0" stroke-width="5.4" fill="none"/><path d="M70 52Q86 40 102 38" stroke="#fff" stroke-width="2" fill="none" opacity=".5"/>` });
const flowerD = (c, c2, x, y) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-7" rx="4.6" ry="6" transform="rotate(${a})" fill="${c}"/>`).join('')}<circle r="3.6" fill="${c2}"/></g>`;
add('acc', { k: 'flower1', n: 'Blume Gelb', s: 'c20', slot: 'hair', d: () => flowerD('#FFD43B', '#FF9F2E', 128, 58) });
/* Ohrschmuck (Ohr: x = 100 ± ex, y = 99; Läppchen y ≈ 107) */
const ears = (C, f) => { const e = ex_(C); return f(100 - e, -1) + f(100 + e, 1); };
add('acc', { k: 'ear1', n: 'Ohrstecker', s: 'c15', slot: 'ear', d: C => ears(C, x => `<circle cx="${x}" cy="107" r="2.8" fill="${gold()}" stroke="#C98A00" stroke-width=".8"/>`) });
/* Halsschmuck (nach dem Körper gezeichnet, y ≈ 144–190) */
add('acc', { k: 'bow', n: 'Fliege', s: 'c30', slot: 'neck', d: C => `<path d="M100 156L80 146V166Z M100 156L120 146V166Z" fill="${C.tc.f}" stroke="${C.tc.d}" stroke-width="1.4"/><circle cx="100" cy="156" r="4.4" fill="${C.tc.d}"/>` });
add('acc', { k: 'medal', n: 'Goldmedaille', s: 'D2', slot: 'neck', d: () => `<path d="M82 144L100 172L118 144L112 144L100 163L88 144Z" fill="#3F78C6"/><circle cx="100" cy="178" r="12" fill="${gold()}" stroke="#C98A00" stroke-width="1.6"/><path d="${star5(100, 178, 7, 3)}" fill="#fff" opacity=".85"/>` });
/* ---------- Hintergründe (füllen immer die ganze 200×200-Fläche) ---------- */
let _seed = 1;
const rng = s => { _seed = s || 1; return () => (_seed = (_seed * 16807) % 2147483647) / 2147483647; };
const RC = (x, y, w, h, f, o, x2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${o ? ` opacity="${o}"` : ''}${x2 || ''}/>`;
const CI = (x, y, r, f, o) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"${o ? ` opacity="${o}"` : ''}/>`;
const vg = (id, stops, y1, y2) => RC(0, 0, 200, 200, G('avb-' + id, stops, [0, y1 || 0, 0, y2 == null ? 200 : y2]));
const soft = '<circle cx="176" cy="26" r="52" fill="#fff" opacity=".28"/><circle cx="14" cy="176" r="46" fill="#fff" opacity=".2"/>';
const starsF = (seed, n, y0, y1, c, rmax) => { const r = rng(seed); let s = ''; for (let i = 0; i < n; i++) { const x = r() * 200, y = y0 + r() * (y1 - y0), q = r(); s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(.6 + q * (rmax || 1.4))}" fill="${c || '#fff'}" opacity="${f1(.4 + q * .6)}"/>`; } return s; };
const cloud = (x, y, k, o) => `<g transform="translate(${x} ${y}) scale(${k})" fill="#fff" opacity="${o || .95}"><ellipse cx="0" cy="0" rx="26" ry="11"/><circle cx="-8" cy="-9" r="11"/><circle cx="8" cy="-13" r="14"/><circle cx="20" cy="-5" r="9"/></g>`;
const pine = (x, y, h, f) => `<path d="M${x} ${y - h}L${x + h * .34} ${y - h * .45}H${x + h * .2}L${x + h * .42} ${y}H${x - h * .42}L${x - h * .2} ${y - h * .45}H${x - h * .34}Z" fill="${f}"/>`;
const hill = (d, f, o) => `<path d="${d}" fill="${f}"${o ? ` opacity="${o}"` : ''}/>`;
add('bg', { k: 'mint', n: 'Minze', s: '0', d: () => vg('mint', ['#D9F8EC', '#A8EBD0']) + soft });
add('bg', { k: 'sky', n: 'Himmel', s: '0', d: () => vg('sky', ['#E2F0FF', '#B2D6FF']) + soft });
add('bg', { k: 'sun', n: 'Sonne', s: '0', d: () => vg('sun', ['#FFF5CC', '#FFDC7E']) + soft });
add('bg', { k: 'cloud', n: 'Wolken', s: '0', d: () => vg('cloud', ['#9ED0FF', '#DDF0FF']) + cloud(40, 54, 1.1) + cloud(160, 36, .9, .85) + cloud(168, 100, 1.2, .9) + cloud(30, 150, 1.3, .9) });
add('bg', { k: 'sunset', n: 'Sonnenuntergang', s: 'c45', d: () => vg('sunset', ['#5B4BC4', '#8D7BE8', '#FFB36B', '#FFE08F'], 0, 160) + CI(100, 138, 40, '#FFF1B8', .9) + hill('M0 156Q40 138 80 152T160 146T200 150V200H0Z', '#4a3a9c') + hill('M0 176Q50 160 100 174T200 168V200H0Z', '#3a2d82') });
add('bg', { k: 'ocean', n: 'Ozean', s: 'x', d: () => { let s = vg('ocean', ['#BFE6FF', '#E8F6FF'], 0, 100) + CI(160, 40, 20, '#FFF1B8', .95); [[100, '#58B2F0'], [128, '#3F96E0'], [156, '#2F78C8']].forEach((w, i) => { s += hill(`M0 ${w[0]}Q25 ${w[0] - 12} 50 ${w[0]}T100 ${w[0]}T150 ${w[0]}T200 ${w[0]}V200H0Z`, w[1]) + `<path d="M0 ${w[0]}Q25 ${w[0] - 12} 50 ${w[0]}T100 ${w[0]}T150 ${w[0]}T200 ${w[0]}" stroke="#fff" stroke-width="2.4" fill="none" opacity=".7"/>`; }); return s; } });
add('bg', { k: 'forest', n: 'Wald', s: 'x', d: () => { let s = vg('forest', ['#D8F4E6', '#9ADDB8']); const r = rng(7); for (let i = 0; i < 6; i++) s += pine(10 + i * 36, 148, 70 + r() * 22, '#5FBF8A'); for (let i = 0; i < 7; i++) s += pine(i * 32, 186, 80 + r() * 26, '#2F9E6A'); return s + RC(0, 176, 200, 24, '#1F7E52') + `<path d="M120 0L170 90L100 90Z" fill="#fff" opacity=".18"/>`; } });
add('bg', { k: 'rainbow', n: 'Regenbogen', s: 'x', d: () => { let s = vg('rainb', ['#BFE6FF', '#F0F9FF']); ['#E8412C', '#FF9F2E', '#FFD43B', '#4CC76A', '#3F9BFF', '#7B5CD6'].forEach((c, i) => { s += `<circle cx="100" cy="176" r="${150 - i * 11}" fill="none" stroke="${c}" stroke-width="11" opacity=".9"/>`; }); return s + `<circle cx="100" cy="176" r="80" fill="#F0F9FF"/>` + cloud(36, 168, 1.2) + cloud(168, 168, 1.2); } });
add('bg', { k: 'space', n: 'Weltraum', s: 's10', d: () => vg('space', ['#0F0F3A', '#2B2A78']) + starsF(21, 60, 0, 200, '#fff', 1.6) + CI(160, 46, 18, G('avb-planet', ['#FFD27A', '#E8842C'], [150, 30, 176, 62])) + `<ellipse cx="160" cy="46" rx="30" ry="7" fill="none" stroke="#FFE9B0" stroke-width="3" transform="rotate(-18 160 46)" opacity=".9"/>` + CI(36, 150, 12, '#9AD0FF') + CI(32, 146, 12, '#0F0F3A', .25) + CI(168, 160, 6, '#DDE2F0') });
add('bg', { k: 'castle', n: 'Märchenschloss', s: 'S60', d: () => vg('castle', ['#5B4BC4', '#9A8CF0', '#FFD9A0'], 0, 170) + starsF(6, 18, 0, 70, '#fff', 1.2) + CI(40, 38, 12, '#FFF6D2') + RC(66, 96, 68, 80, '#4a3a9c') + RC(52, 70, 22, 106, '#3d2f86') + RC(126, 70, 22, 106, '#3d2f86') + RC(86, 54, 28, 122, '#4a3a9c') + `<path d="M50 70L63 40L76 70Z M124 70L137 40L150 70Z M84 54L100 20L116 54Z" fill="#2a2070"/>` + `<path d="M100 20V8L112 13L100 17" fill="#FFD43B" stroke="#FFD43B" stroke-width="1.4"/>` + `<path d="M92 176V150Q100 138 108 150V176Z" fill="#FFD27A"/>` + [[63, 90], [137, 90], [100, 78]].map(p => `<rect x="${p[0] - 3}" y="${p[1]}" width="6" height="10" rx="3" fill="#FFE27A"/>`).join('') + hill('M0 188Q60 170 120 184T200 178V200H0Z', '#2a2070') });
/* ---------- Effekte (z:'b' = hinter dem Porträt, 'f' = davor) ---------- */
const tw = (i, inner) => `<g class="av-tw" style="animation-delay:${(i * .37).toFixed(2)}s">${inner}</g>`;
add('fx', { k: 'none', n: 'Ohne', s: '0', z: 'f', d: () => '' });
add('fx', { k: 'sparkle', n: 'Glitzer', s: 'c30', z: 'f', d: () => [[30, 44, 9, '#fff'], [170, 34, 11, '#FFE27A'], [20, 112, 6, '#FFE27A'], [178, 118, 8, '#fff'], [156, 70, 5, '#fff'], [44, 80, 5, '#FFE27A'], [150, 166, 6, '#fff']].map((p, i) => tw(i, `<path d="${spark4(p[0], p[1], p[2], p[2] * .22)}" fill="${p[3]}"/>`)).join('') });
add('fx', { k: 'stars', n: 'Sterne', s: 'x', z: 'f', d: () => [[28, 40, 9], [172, 46, 8], [20, 116, 6], [180, 120, 7], [100, 12, 6], [150, 18, 5]].map((p, i) => tw(i, `<path d="${star5(p[0], p[1], p[2], p[2] * .45)}" fill="#FFC93C" stroke="#fff" stroke-width="1.4"/>`)).join('') });
add('fx', { k: 'glow', n: 'Sanftes Leuchten', s: 'c25', z: 'b', d: () => RC(0, 0, 200, 200, G('avf-glow', ['rgba(255,236,150,.95)', 'rgba(255,214,110,.55)', 'rgba(255,200,90,0)'], [100, 92, 98], 1)) });
add('fx', { k: 'halo', n: 'Heiligenschein', s: 'S50', z: 'f', d: () => `<ellipse cx="100" cy="11" rx="32" ry="8" fill="none" stroke="#FFE27A" stroke-width="7" opacity=".5"/><ellipse cx="100" cy="11" rx="32" ry="8" fill="none" stroke="${gold()}" stroke-width="4.4"/>` });
add('fx', { k: 'snow', n: 'Schneefall', s: 'c50', z: 'f', d: () => { const r = rng(61); let s = ''; for (let i = 0; i < 30; i++) { const x = r() * 200, y = r() * 200; if (Math.hypot(x - 100, y - 96) < 52) continue; s += tw(i, `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1.6 + r() * 2.2)}" fill="#fff" opacity=".92"/>`); } return s; } });
const ring = (r, w, c, o) => `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${c}" stroke-width="${w}"${o ? ` opacity="${o}"` : ''}/>`;
add('fx', { k: 'frame_gold', n: 'Goldrahmen', s: 'S100', z: 'f', d: () => ring(94, 12, gold()) + ring(88.5, 1.6, '#fff', .7) + ring(99.5, 1.4, '#C98A00', .8) + [0, 90, 180, 270].map(a => `<circle cx="${f1(100 + 94 * Math.cos(a * Math.PI / 180))}" cy="${f1(100 + 94 * Math.sin(a * Math.PI / 180))}" r="3.6" fill="#3FB0FF" stroke="#fff" stroke-width="1"/>`).join('') });
/* ---------- Farb-Paletten (Katalog-Art „avcolor“): [Schlüssel, Name, Wert] ---------- */
const PAL = {
skin: ['Haut', [['p1', 'Porzellan', '#F9DCC7'], ['p2', 'Hell', '#F2C7A4'], ['p4', 'Gold', '#D9A070'], ['p6', 'Braun', '#A06A48'], ['p8', 'Ebenholz', '#5A3424']]],
hair: ['Haar', [['black', 'Schwarz', '#1f1b24'], ['dbrown', 'Dunkelbraun', '#3b2a22'], ['brown', 'Braun', '#7a4e2e'], ['blond', 'Blond', '#dcb46b'], ['ginger', 'Ingwer', '#c2602b'],
['auburn', 'Rotbraun', '#8f3d22'], ['grey', 'Grau', '#8c8a94'], ['blue', 'Blau', '#3d7be0'], ['mint', 'Minze', '#4fd1a1'], ['violet', 'Violett', '#7b5cd6'], ['rainbow', 'Regenbogen', 'g:rainbow'], ['galaxy', 'Galaxie', 'g:galaxy'], ['gold', 'Gold', 'g:gold']]],
eyes: ['Augen', [['dbrown', 'Dunkelbraun', '#4a2f22'], ['brown', 'Braun', '#7b4b2a'], ['green', 'Grün', '#3c8a5a'], ['blue', 'Blau', '#3f78c6'],
['hazel', 'Haselnuss', '#9a7a3a'], ['violet', 'Violett', '#7b5cd6'], ['gold', 'Gold', '#e8b830'], ['galaxy', 'Galaxie', 'g:galaxy']]],
top: ['Kleidung', [['blue', 'Blau', '#4B7BEC'], ['mint', 'Minze', '#3CCFA0'], ['yellow', 'Gelb', '#FFC93C'], ['red', 'Rot', '#E5504A'],
['white', 'Weiß', '#F4F5FA'], ['black', 'Schwarz', '#2B2D3A'], ['navy', 'Marine', '#2F3E7A'], ['lav', 'Lavendel', '#B7A8FF'], ['gold', 'Gold', 'g:gold'], ['rainbow', 'Regenbogen', 'g:rainbow']]]
};
const COLID = {};                                                 // 'slot|wert' -> Katalog-Id
Object.keys(PAL).forEach(sl => PAL[sl][1].forEach(c => { c.id = 'col.' + sl + '.' + c[0]; COLID[sl + '|' + c[2]] = c.id; }));
/* ---------- Woher kommt was? ----------
   FREE: nur das Allernötigste für die Ersteinrichtung · PRICE: Shop (Münzen, günstig zuerst) · MS: Meilenstein (wird vom Lernfortschritt geschenkt) */
const FREE = ['hair.short', 'hair.bob', 'hair.long', 'hair.curly', 'hair.afro', 'eyes.round', 'eyes.sclera', 'mouth.smile', 'mouth.open', 'top.tee', 'top.hoodie', 'top.dress', 'bg.mint', 'bg.sky', 'fx.none',
'col.skin.p1', 'col.skin.p2', 'col.skin.p4', 'col.skin.p6', 'col.skin.p8', 'col.hair.black', 'col.hair.dbrown', 'col.hair.brown', 'col.hair.blond', 'col.hair.ginger',
'col.eyes.dbrown', 'col.eyes.brown', 'col.eyes.green', 'col.eyes.blue', 'col.top.blue', 'col.top.mint', 'col.top.yellow', 'col.top.red'];
const PRICE = {
'hair.buzz': 15, 'hair.pony': 20, 'hair.pigtails': 25, 'hair.bun': 40, 'hair.braids': 60, 'hair.spacebuns': 90,
'col.hair.auburn': 15, 'col.hair.grey': 20, 'col.hair.blue': 30, 'col.hair.mint': 30, 'col.hair.violet': 40, 'col.hair.rainbow': 150, 'col.hair.galaxy': 220,
'col.eyes.hazel': 15, 'col.eyes.violet': 30, 'col.eyes.gold': 40, 'col.eyes.galaxy': 120,
'col.top.white': 15, 'col.top.black': 15, 'col.top.navy': 20, 'col.top.lav': 20, 'col.top.gold': 120, 'col.top.rainbow': 160,
'eyes.dot': 15, 'eyes.lash': 25, 'eyes.big': 30, 'eyes.cat': 60, 'eyes.star': 120,
'mouth.grin': 15, 'mouth.smirk': 20, 'mouth.tongue': 35,
'top.vneck': 15, 'top.stripes': 25, 'top.polo': 30, 'top.knit': 45, 'top.jacket': 70, 'top.overall': 80, 'top.tux': 120, 'top.hero': 180, 'top.astro': 300,
'acc.glasses1': 15, 'acc.hairband': 15, 'acc.cap1': 20, 'acc.flower1': 20, 'acc.glasses2': 25, 'acc.beanie1': 25, 'acc.ear1': 25, 'acc.bow': 30, 'acc.phones1': 45, 'acc.bunny': 80, 'acc.cat': 80, 'acc.wizard': 180, 'acc.tiara': 300,
'bg.sun': 15, 'bg.cloud': 30, 'bg.forest': 60, 'bg.ocean': 70, 'bg.sunset': 80, 'bg.rainbow': 90, 'bg.space': 150, 'bg.castle': 250,
'fx.glow': 40, 'fx.stars': 60, 'fx.snow': 70, 'fx.halo': 150, 'fx.frame_gold': 220
};
const MS = {                                                       // id -> [Text, Zähler, Schwelle]
'acc.medal': ['Beende 1 Gruppe', 'decks', 1], 'fx.sparkle': ['Beende 3 Gruppen', 'decks', 3], 'top.sequin': ['Beende 5 Gruppen', 'decks', 5],
'acc.laurel': ['Beende 8 Gruppen', 'decks', 8], 'acc.crown': ['Beende 10 Gruppen', 'decks', 10],
'eyes.sparkle': ['Beende 10 Stufen', 'blocks', 10], 'col.hair.gold': ['Beende 30 Stufen', 'blocks', 30]
};
const GIFT_WHY = 'Überraschungsgeschenk aus dem Shop';
const GIFT_ACC = ['acc.party', 'acc.pirate', 'acc.unicorn', 'acc.antenna', 'acc.chef', 'acc.viking', 'acc.shades', 'acc.starglass', 'acc.scarf', 'acc.starneck'];
const SRC = id => MS[id] ? { t: 'milestone', why: MS[id][0] } : GIFT_ACC.includes(id) ? { t: 'milestone', why: GIFT_WHY } : PRICE[id] ? { t: 'shop', cur: 'c', price: PRICE[id] } : { t: 'free' };
function avCheck() {                                               // Meilensteine freischalten (leise Hinweise kommen von unlock)
let any = false;
Object.keys(MS).forEach(id => { if (!S.unl[id] && ((S.stats || {})[MS[id][1]] || 0) >= MS[id][2]) { unlock(id); any = true; } });
if (any) save();
}
/* ---------- Katalog registrieren ---------- */
const KINDS = [['hair', 'avhair', 'Haare', 'wand'], ['top', 'avtop', 'Kleidung', 'sticker'], ['eyes', 'aveyes', 'Augen', 'eye'], ['mouth', 'avmouth', 'Mund', 'heart'],
['acc', 'avacc', 'Zubehör', 'star'], ['bg', 'avbg', 'Hintergründe', 'sun'], ['fx', 'avfx', 'Effekte', 'sparkle'], ['color', 'avcolor', 'Farben', 'palette']];
const PKIND = {}; KINDS.forEach(k => { PKIND[k[1]] = k[0]; });
const AVL = { look: null };                                        // aktueller Look für die Vorschau-Bilder (wird beim Rendern gesetzt)
const baseLook = () => norm(AVL.look || (S.av && (S.av.look || (S.av.draft && S.av.draft.look))) || DEFAULT_LOOK);
/* Vorschau-Bilder (Cache pro Schlüssel) */
let TH = {}, thN = 0;
function thumbOf(kind, it) {
const B = baseLook();
let key = kind + '|' + it.id, look = Object.assign({}, B), o = { cls: 'mascot', slice: 1, omit: { acc: 1, fx: 1 }, bg: false };
switch (kind) {
case 'hair': key += '|' + B.skin + B.hairC; look.hair = it.id; look.top = 'top.tee'; o.vb = '22 8 156 156'; look.acc = []; break;
case 'eyes': key += '|' + B.skin + B.eyesC + B.hairC; look.eyes = it.id; o.vb = '54 52 92 92'; o.omit.hair = 1; break;
case 'mouth': key += '|' + B.skin; look.mouth = it.id; o.vb = '58 64 84 84'; o.omit.hair = 1; break;
case 'top': key += '|' + B.skin + B.topC; look.top = it.id; o.vb = '40 112 120 100'; o.omit.hair = 1; look.acc = []; break;
case 'acc': {
const p = BY[it.id]; look.acc = [it.id]; o.omit.acc = 0; key += '|' + B.skin + B.hair + B.hairC + B.topC;
o.vb = p.slot === 'glass' ? '44 56 112 112' : p.slot === 'neck' ? '36 100 128 110' : p.slot === 'ear' ? '30 46 140 140' : '18 0 164 164';
if (p.slot === 'neck') { o.omit.hair = 1; look.top = B.top; } break;
}
case 'bg': key += '|' + B.skin + B.hair + B.hairC + B.topC + B.top; look.bg = it.id; o.bg = true; o.vb = '0 0 200 200'; o.slice = 0; break;
case 'fx': key += '|' + B.skin + B.hair + B.hairC + B.topC + B.top + B.bg; look.fx = it.id; o.omit.fx = 0; o.bg = true; o.vb = '0 0 200 200'; o.slice = 0; break;
default: return '';
}
if (TH[key]) return TH[key];
if (++thN > 500) { TH = {}; thN = 0; }
let s; try { s = paint(look, 'happy', o); } catch (e) { s = FALLBACK; }
return (TH[key] = s);
}
function colorThumb(it) {
DS = {}; DEFS = '';
const c = FC(it.v, 1);
return `<svg class="mascot" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${DEFS}</defs><circle cx="24" cy="24" r="17" fill="${c.f}" stroke="${c.d}" stroke-width="2"/><path d="M13 20Q16 11 26 10" stroke="#fff" stroke-width="3.4" fill="none" opacity=".55"/></svg>`;
}
KINDS.forEach(k => regKind(k[1], { group: 'avatar', label: k[2], ic: k[3], thumb: k[0] === 'color' ? colorThumb : it => thumbOf(k[0], it) }));
KINDS.forEach(k => {
if (k[0] === 'color') return;
regItems(T[k[0]].filter(p => p.id in PRICE || p.id in MS || FREE.includes(p.id) || GIFT_ACC.includes(p.id)).map(p => ({ id: p.id, kind: k[1], name: p.n, src: SRC(p.id), av: 1 })));
});
regItems([].concat(...Object.keys(PAL).map(sl => PAL[sl][1].map(c => ({ id: c.id, kind: 'avcolor', name: PAL[sl][0] + ': ' + c[1], src: SRC(c.id), av: 1, slot: sl, v: c[2] })))));
/* =====================================================================
ANSICHT „Mein Avatar“: 1) Ersteinrichtung  2) Gestalten (nur !UI.ro)  3) Ansehen/Sammlung (UI.ro)
===================================================================== */
const AV = { tab: 'face', step: 0, mood: 'happy', d: null, bounce: false, busy: false };
const clone = o => JSON.parse(JSON.stringify(o));
const fn = () => typeof FN === 'function' ? FN() : 'Fino';
const MOODS = [['happy', 'Fröhlich'], ['cheer', 'Jubel'], ['think', 'Nachdenklich'], ['sad', 'Traurig']];
const LKEY = { skin: 'skin', hair: 'hairC', eyes: 'eyesC', top: 'topC' };
const COLPOP = { skin: 'face', hair: 'hair', eyes: 'eyes', top: 'top' };
const TABS = [
{ id: 'face', label: 'Gesicht', ic: 'avatar', secs: [['col', 'skin', 'Hautfarbe'], ['col', 'eyes', 'Augenfarbe'], ['avkind', 'aveyes', 'Augen'], ['avkind', 'avmouth', 'Mund']] },
{ id: 'hair', label: 'Haare', ic: 'hair', secs: [['col', 'hair', 'Haarfarbe'], ['avkind', 'avhair', 'Frisuren']] },
{ id: 'top', label: 'Kleidung', ic: 'shirt', secs: [['col', 'top', 'Farbe'], ['avkind', 'avtop', 'Oberteile']] },
{ id: 'acc', label: 'Zubehör', ic: 'glasses', secs: [['avkind', 'avacc', 'Zubehör']] },
{ id: 'bg', label: 'Hintergrund', ic: 'land', secs: [['avkind', 'avbg', 'Hintergründe']] },
{ id: 'fx', label: 'Effekte', ic: 'sparkle', secs: [['avkind', 'avfx', 'Effekte']] }
];
const STEPS = [
{ t: 'Gesicht', secs: [['col', 'skin', 'Hautfarbe'], ['col', 'eyes', 'Augenfarbe'], ['avkind', 'aveyes', 'Augen'], ['avkind', 'avmouth', 'Mund']] },
{ t: 'Haare', secs: [['col', 'hair', 'Haarfarbe'], ['avkind', 'avhair', 'Frisur']] },
{ t: 'Kleidung', secs: [['avkind', 'avtop', 'Oberteil'], ['col', 'top', 'Farbe'], ['avkind', 'avbg', 'Hintergrund']] }
];
const SLOT_NAMES = { glass: 'Brillen', head: 'Kopf', hair: 'Haarschmuck', ear: 'Ohren', neck: 'Hals' };
const AIC = {
hair: '<path d="M4 8c3-4 5 4 8 0s5 4 8 0M4 13c3-4 5 4 8 0s5 4 8 0M4 18c3-4 5 4 8 0s5 4 8 0"/>',
shirt: '<path d="M8 4L3 7l2 4 3-1v10h8V10l3 1 2-4-5-3c-1 2-2 3-4 3S9 6 8 4z" class="a"/>',
glasses: '<circle cx="7" cy="13" r="3.6" class="a"/><circle cx="17" cy="13" r="3.6" class="a"/><path d="M10.6 12.6h2.8M3.4 11L5 7.5M20.6 11L19 7.5"/>',
land: '<rect x="3.5" y="4.5" width="17" height="15" rx="3" class="a"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-5 4 4 3-3 4 4"/>'
};
const aico = (n, s) => AIC[n] ? `<svg class="ico" viewBox="0 0 24 24" width="${s || 24}" height="${s || 24}" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">${AIC[n]}</svg>` : ico(n, s);
function avEnsure() {
if (!S.av || typeof S.av !== 'object') S.av = { use: false, look: null, saved: [] };
if (!Array.isArray(S.av.saved)) S.av.saved = [];
}
const owned = id => { try { return hasItem(id); } catch (e) { return false; } };
const hasLook = () => !!(S.av && S.av.look && typeof S.av.look === 'object');
const colOwned = (sl, v) => { const id = COLID[sl + '|' + v]; return !id || owned(id); };
function sanitize(l) {                                           // nur Dinge, die sie wirklich hat
const o = norm(l), D = DEFAULT_LOOK;
Object.keys(SLOT_KEY).forEach(k => { if (!owned(o[k])) o[k] = D[k]; });
Object.keys(LKEY).forEach(sl => { if (!colOwned(sl, o[LKEY[sl]])) o[LKEY[sl]] = D[LKEY[sl]]; });
o.acc = o.acc.filter(owned);
return o;
}
/* Der Look, der gerade gezeigt/bearbeitet wird: ihr gespeicherter Look – oder bei der Ersteinrichtung der Entwurf */
function cur() {
avEnsure();
if (hasLook()) return norm(S.av.look);
if (!AV.d) AV.d = sanitize(S.av.draft && S.av.draft.look || DEFAULT_LOOK);
return AV.d;
}
const canEdit = () => hasLook() && !UI.ro;
function avRender(pop) {
if (view !== 'avatar') return;
const sc = $('.tabs'), sl = sc ? sc.scrollLeft : 0, y = window.scrollY;
render();
const n = $('.tabs'); if (n) n.scrollLeft = sl;
window.scrollTo(0, y);
if (pop) document.querySelectorAll('.av-circ .av-' + pop).forEach(e => e.classList.add('av-pop'));
if (AV.bounce) { const pv = $('.av-pv'); if (pv) { pv.classList.remove('av-bounce'); void pv.offsetWidth; pv.classList.add('av-bounce'); } AV.bounce = false; }
}
function applyPatch(id) {                                       // Id -> Änderung am Look (oder null)
const it = CATALOG[id]; if (!it) return null;
const k = PKIND[it.kind], L = cur();
if (k === 'color') return { [LKEY[it.slot]]: it.v };
if (k === 'acc') { const p = BY[id]; let a = L.acc.slice(); if (a.includes(id)) a = a.filter(x => x !== id); else { a = a.filter(x => BY[x].slot !== p.slot); a.push(id); } return { acc: a }; }
return SLOT_KEY[k] ? { [SLOT_KEY[k]]: id } : null;
}
/* Jede Änderung wird sofort gespeichert (Look bzw. Entwurf der Ersteinrichtung) */
function commit(patch, pop) {
if (!patch) return;
avEnsure();
const L = cur(), next = norm(Object.assign({}, L, patch));
if (JSON.stringify(next) === JSON.stringify(L)) return;
if (hasLook()) { if (UI.ro) return; S.av.look = next; }
else { AV.d = next; S.av.draft = { look: clone(next), ts: Date.now() }; }
save(); sfx('pop'); AV.bounce = true; avRender(pop);
}
/* ---------- Teile des Bildschirms ---------- */
const rankOf = it => owned(it.id) ? 0 : it.src.t === 'shop' ? 1000 + it.src.price : 9000;
const ordered = list => list.map((it, i) => [rankOf(it), i, it]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]);
function isSel(it) {
const k = PKIND[it.kind], L = cur();
if (k === 'acc') return L.acc.includes(it.id);
if (k === 'color') return L[LKEY[it.slot]] === it.v;
return L[SLOT_KEY[k]] === it.id;
}
/* Kachel: eigenes Ding = antippen zum Anziehen (nur wenn gestaltet werden darf), gesperrtes = grau mit Preis, Antippen führt in den Shop */
function tileHTML(it, edit) {
const h = itemTile(it, { act: edit ? 'avPick' : '', sel: isSel(it) });
return owned(it.id) && !edit ? h.replace('<button', '<div').replace('</button>', '</div>') : h;
}
const swCss = v => v && v.slice(0, 2) === 'g:' ? `linear-gradient(135deg,${GR[v.slice(2)].join(',')})` : v;
function gridHTML(kind, title, edit, setup) {
let all = itemsOf(kind); if (setup) all = all.filter(i => i.src.t === 'free'); if (!all.length) return '';
const have = all.filter(i => owned(i.id)).length;
let body;
if (kind === 'avacc') {
body = Object.keys(SLOT_NAMES).map(sl => {
const l = ordered(all.filter(i => BY[i.id].slot === sl)); if (!l.length) return '';
return `<div class="av-sub">${SLOT_NAMES[sl]}</div><div class="itiles av-grid">${l.map(i => tileHTML(i, edit)).join('')}</div>`;
}).join('');
if (edit && cur().acc.length) body = `<div class="av-clear"><button class="btn sm sec" data-act="avClearAcc">${ico('trash', 18)} Alles ablegen</button></div>` + body;
} else body = `<div class="itiles av-grid">${ordered(all).map(i => tileHTML(i, edit)).join('')}</div>`;
return `<div class="av-sh"><b>${title}</b>${setup ? '' : `<span class="mute small">${have} von ${all.length}</span>`}</div>${body}`;
}
/* Farben: eigene = runde Punkte, gesperrte = Farbfeld mit Preis bzw. Meilenstein-Text */
function swatchHTML(sl, label, edit, setup) {
const key = LKEY[sl], now = cur()[key];
let items = ordered(itemsOf('avcolor').filter(i => i.slot === sl)); if (setup) items = items.filter(i => i.src.t === 'free');
const have = items.filter(i => owned(i.id)).length;
const dots = items.filter(i => owned(i.id)).map(it => {
const nm = it.name.split(': ')[1], on = now === it.v ? ' on' : '';
return edit ? `<button class="av-sw${on}" style="--c:${swCss(it.v)}" data-act="avColor" data-arg="${it.id}" title="${esc(nm)}" aria-label="${esc(nm)}"></button>` : `<span class="av-sw${on}" style="--c:${swCss(it.v)}" title="${esc(nm)}"></span>`;
}).join('');
const locked = items.filter(i => !owned(i.id)).map(it => {
const nm = it.name.split(': ')[1], sh = it.src.t === 'shop';
const inner = `<i style="--c:${swCss(it.v)}"></i><span>${sh ? '🪙 ' + it.src.price : ico('lock', 12) + ' ' + esc(it.src.why)}</span>`;
return sh ? `<button class="av-chip" data-act="shopAt" data-arg="${it.id}" title="${esc(nm)}" aria-label="${esc(nm)}: ${it.src.price} Münzen">${inner}</button>` : `<span class="av-chip" title="${esc(nm)}">${inner}</span>`;
}).join('');
return `<div class="av-sh"><b>${label}</b>${setup ? '' : `<span class="mute small">${have} von ${items.length}</span>`}</div><div class="av-sws">${dots}</div>${locked ? `<div class="av-sws av-lks">${locked}</div>` : ''}`;
}
const secHTML = (s, edit, setup) => s[0] === 'col' ? swatchHTML(s[1], s[2], edit, setup) : gridHTML(s[1], s[2], edit, setup);
function toolsHTML(edit) {
const tab = TABS.find(t => t.id === AV.tab) || TABS[0];
const cats = TABS.map(t => `<button class="${t.id === tab.id ? 'on' : ''}" data-act="avTab" data-arg="${t.id}">${aico(t.ic, 20)} ${t.label}</button>`).join('');
return `<div class="tabs av-cats" role="tablist">${cats}</div>
<div class="av-panel card">${tab.secs.map(s => secHTML(s, edit, false)).join('')}
<p class="small mute av-tip">${edit ? 'Schloss = noch nicht deins. Antippen zeigt dir im Shop, was es kostet.' : 'Schloss = noch nicht deins. Antippen zeigt dir im Shop, was es kostet. Umziehen kannst du in der Kreativzeit.'}</p></div>`;
}
function looksHTML() {
avEnsure();
const sv = S.av.saved;
return `<div class="av-sh"><b>Meine Looks</b><span class="mute small">${sv.length} von 8</span></div><div class="av-looks">${sv.map(l => `<div class="av-look"><button class="av-lk" data-act="avLoad" data-arg="${l.id}" title="${esc(l.name)} laden"><span class="av-lc">${meSVG(l.look)}</span><i>${esc(l.name)}</i></button><button class="av-x" data-act="avDelAsk" data-arg="${l.id}" aria-label="${esc(l.name)} löschen">${ico('trash', 14)}</button></div>`).join('')}${sv.length < 8 ? `<div class="av-look"><button class="av-lk add" data-act="avSave"><span class="av-lc">${ico('plus', 26)}</span><i>Merken</i></button></div>` : ''}</div>`;
}
const useTog = () => `<div class="av-tog"><div><b>Mein Avatar als Profilbild</b><div class="small mute">${useMe() ? 'Du erscheinst auf der Startseite und beim Üben.' : esc(fn()) + ' ist gerade dein Profilbild.'}</div></div><button class="av-sw2 ${useMe() ? 'on' : ''}" role="switch" aria-checked="${useMe()}" data-act="avUse" aria-label="Meinen Avatar überall anzeigen"><i></i></button></div>`;
const ownCount = () => { const l = Object.values(CATALOG).filter(i => i.av); return [l.filter(i => owned(i.id)).length, l.length]; };
function preview(L) {
const md = MOODS.find(m => m[0] === AV.mood) || MOODS[0];
return `<button class="av-pv m-${AV.mood}" id="av-pv" data-act="avMood" aria-label="Stimmung ändern"><span class="av-circ">${meSVG(L, AV.mood)}</span><span class="av-mood">${md[1]}</span></button>`;
}
function setupHTML() {
const L = cur(), st = Math.max(0, Math.min(STEPS.length - 1, AV.step)), S0 = STEPS[st], last = st === STEPS.length - 1;
AVL.look = L;
return topBar(ico('avatar', 26) + ' Wer bist du?') + `
<div class="av-setup">
<div class="av-stage"><div class="av-card av-one">${preview(L)}<div class="av-dots" aria-label="Schritt ${st + 1} von ${STEPS.length}">${STEPS.map((x, i) => `<i class="${i === st ? 'on' : ''}"></i>`).join('')}</div></div></div>
<div class="card av-panel"><h3 class="av-st">${S0.t}</h3>${S0.secs.map(s => secHTML(s, true, true)).join('')}
<div class="av-nav">${st ? `<button class="btn sec" data-act="avBack">← Zurück</button>` : '<span></span>'}<button class="btn big" data-act="${last ? 'avDone' : 'avNext'}">${last ? ico('check', 24) + ' Fertig – das bin ich!' : 'Weiter →'}</button></div></div>
</div>`;
}
function viewAvatar() {
avEnsure();
if (!hasLook()) return setupHTML();
const L = cur(), edit = canEdit(), c = ownCount();
AVL.look = L;
const bt = (act, ic, lab) => `<button class="av-btn" data-act="${act}" title="${lab}" aria-label="${lab}">${ico(ic, 24)}<span>${lab}</span></button>`;
return topBar(ico('avatar', 26) + ' Mein Avatar') + `
<div class="av-wrap">
<div class="av-left">
<div class="av-stage"><div class="av-card">${preview(L)}
${edit ? `<div class="av-bar">${bt('avRand', 'dice', 'Zufall')}${bt('avSave', 'save', 'Merken')}${bt('avPng', 'download', 'PNG')}</div>` : `<div class="av-count"><b>${c[0]} von ${c[1]}</b><span class="small mute">Teile gesammelt</span></div>`}
</div></div>
<div class="av-side card">${edit ? looksHTML() : ''}${useTog()}</div>
</div>
<section class="av-tools">${toolsHTML(edit)}</section>
</div>`;
}
/* ---------- Aktionen ---------- */
function dl(blob, name) {
const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function avPng() {
const svg = paint(cur(), 'happy', { cls: 'mascot' }).replace('<svg ', '<svg width="512" height="512" ');
const fail = () => { try { dl(new Blob([svg], { type: 'image/svg+xml' }), 'Mein-Avatar.svg'); toast('📥', 'Als Bild (SVG) gespeichert'); } catch (e) { toast('😕', 'Speichern hat leider nicht geklappt.'); } };
try {
const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })), img = new Image();
img.onload = () => {
try {
const c = document.createElement('canvas'); c.width = c.height = 512;
c.getContext('2d').drawImage(img, 0, 0, 512, 512); URL.revokeObjectURL(url);
c.toBlob(b => { if (!b) return fail(); dl(b, 'Mein-Avatar.png'); toast('📥', 'Dein Avatar liegt als PNG-Bild bereit.'); }, 'image/png');
} catch (e) { fail(); }
};
img.onerror = () => { URL.revokeObjectURL(url); fail(); };
img.src = url;
} catch (e) { fail(); }
}
function randLook() {
const pk = kind => { const l = itemsOf(kind).filter(i => owned(i.id)); return l.length ? rnd(l).id : null; };
const col = sl => { const l = itemsOf('avcolor').filter(i => i.slot === sl && owned(i.id)); return l.length ? rnd(l).v : null; };
const o = {};
[['hair', 'avhair'], ['top', 'avtop'], ['eyes', 'aveyes'], ['mouth', 'avmouth'], ['bg', 'avbg']].forEach(p => { const v = pk(p[1]); if (v) o[p[0]] = v; });
Object.keys(LKEY).forEach(sl => { const v = col(sl); if (v) o[LKEY[sl]] = v; });
o.acc = []; const slots = Object.keys(SLOT_NAMES).sort(() => Math.random() - .5);
slots.forEach(sl => { if (o.acc.length < 3 && Math.random() < .4) { const l = itemsOf('avacc').filter(i => BY[i.id].slot === sl && owned(i.id)); if (l.length) o.acc.push(rnd(l).id); } });
o.fx = Math.random() < .4 ? (pk('avfx') || 'fx.none') : 'fx.none';
return o;
}
const A = {
avatar: () => { avEnsure(); go('avatar'); },
avTab: t => { AV.tab = t; sfx('tap'); avRender(); const c = $('.tabs .on'); if (c && c.scrollIntoView) { try { c.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (e) { } } },
avPick: id => { if (!owned(id) || (hasLook() && UI.ro)) return; const it = CATALOG[id]; if (!it) return; commit(applyPatch(id), POPK[PKIND[it.kind]]); },
avColor: id => { if (!owned(id) || (hasLook() && UI.ro)) return; const it = CATALOG[id]; if (!it) return; commit(applyPatch(id), COLPOP[it.slot]); },
avMood: () => { const i = MOODS.findIndex(m => m[0] === AV.mood); AV.mood = MOODS[(i + 1) % MOODS.length][0]; AV.bounce = true; sfx('pop'); avRender(); },
avNext: () => { AV.step = Math.min(STEPS.length - 1, AV.step + 1); sfx('tap'); avRender(); window.scrollTo(0, 0); },
avBack: () => { AV.step = Math.max(0, AV.step - 1); sfx('tap'); avRender(); window.scrollTo(0, 0); },
avRand: () => {
if (!canEdit() || AV.busy) return; AV.busy = true;
const pv = $('.av-pv'); if (pv) pv.classList.add('av-shake'); const ic = $('[data-act="avRand"] .ico'); if (ic) ic.classList.add('av-roll');
sfx('magic');
setTimeout(() => { AV.busy = false; if (canEdit()) commit(randLook()); }, 480);
},
avClearAcc: () => { if (canEdit()) commit({ acc: [] }, 'acc'); },
avSave: () => {
if (!canEdit()) return;
if (S.av.saved.length >= 8) { toast('📦', 'Du hast schon 8 Looks. Lösche zuerst einen alten.'); return; }
let n = 1; while (S.av.saved.some(l => l.name === 'Look ' + n)) n++;
modal('Look merken', `<span class="av-mp">${meSVG(cur())}</span><br>Wie soll dein Look heißen?<br><input class="txt av-name" id="av-name" maxlength="14" value="Look ${n}" aria-label="Name des Looks" autocomplete="off">`, 'Speichern', 'avSaveYes', '', 'Abbrechen');
setTimeout(() => { const i = $('#av-name'); if (i) { try { i.focus(); i.select(); } catch (e) { } } }, 60);
},
avSaveYes: () => {
const i = $('#av-name'), nm = ((i && i.value) || '').trim().slice(0, 14) || 'Look';
closeModal(); if (!canEdit() || S.av.saved.length >= 8) return;
S.av.saved.push({ id: 'l' + Date.now().toString(36) + Math.floor(Math.random() * 99), name: nm, look: clone(cur()), ts: Date.now() });
save(); sfx('ok'); toast('💾', `„${esc(nm)}“ ist gespeichert.`); avRender();
},
avLoad: id => { if (!canEdit()) return; const l = S.av.saved.find(x => x.id === id); if (!l) return; commit(sanitize(l.look)); sfx('ok'); },
avDelAsk: id => { if (!canEdit()) return; const l = S.av.saved.find(x => x.id === id); if (!l) return; modal('Look löschen?', `<span class="av-mp">${meSVG(l.look)}</span><br>„${esc(l.name)}“ wird gelöscht.`, 'Ja, löschen', 'avDelYes', id, 'Behalten'); },
avDelYes: id => { closeModal(); if (!canEdit()) return; S.av.saved = S.av.saved.filter(x => x.id !== id); save(); toast('🗑️', 'Look gelöscht.'); avRender(); },
avPng: () => { if (canEdit()) avPng(); },
avUse: () => {                                                  // ändert nur, welches Bild sie überall sieht (auch im Ansehen-Modus erlaubt)
avEnsure(); if (!hasLook()) return;
S.av.use = !S.av.use;
save(); sfx('tap'); avRender();
},
avDone: () => {                                                 // Ersteinrichtung abschließen
avEnsure(); if (hasLook()) return;
S.av.look = clone(cur()); S.av.use = true; delete S.av.draft; AV.d = null; AV.step = 0; AV.tab = 'face';
checkTrophies(); save(); sfx('ok'); toast('🙂', 'Das bist du! Mehr Sachen holst du dir im Shop.'); AV.bounce = true; avRender();
}
};
const POPK = { hair: 'hair', top: 'top', eyes: 'eyes', mouth: 'mouth', bg: 'bg', fx: 'fx', acc: 'acc' };
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'av-name') { e.preventDefault(); A.avSaveYes(); } });
/* ---------- Ziel für den Startbildschirm: das nächste Avatar-Teil ---------- */
function avGoals() {
if (!hasLook()) return [];
const l = Object.values(CATALOG).filter(i => i.av && i.src.t === 'shop' && !owned(i.id)).sort((a, b) => a.src.price - b.src.price);
if (!l.length) return [];
const it = l[0], need = it.src.price - S.coins;
return [{ ic: 'avatar', label: need > 0 ? `Noch ${need} 🪙 bis „${it.name}“ (Avatar)` : `Avatar: Du kannst dir „${it.name}“ kaufen!`, pct: Math.max(1, Math.min(99, Math.round(Math.min(S.coins, it.src.price) / it.src.price * 100))) }];
}
registerFeature({
id: 'avatar', title: 'Avatar', icon: 'avatar', tint: 'lav', group: 'world', order: 10, creative: 'view',
sub: () => hasLook() ? 'Mein Avatar' : 'Gestalte dich selbst',
view: 'avatar', views: { avatar: viewAvatar }, acts: A, goals: avGoals, check: avCheck
});
window.__av = { AV, T, BY, PAL, COLID, FREE, PRICE, MS, paint, norm, randLook, sanitize, applyPatch, cur, TH: () => TH };   // nur zum Testen
})();
