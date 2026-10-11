/* =====================================================================
   STICKER-ALBUM (Reiter „Sticker“ im Shop): vier Welten mit je 6 eigenen Figuren + einer geheimen Legende.
   Figuren gibt es nur als Überraschungsgeschenk (nie zu kaufen). Wer alle 6 eines Sets hat, bekommt die Legende,
   ein seltenes Avatar-Zubehör (feat_avatar.js, SET_ACC) und 50 Münzen. Die Figuren sind eigene Erfindungen – als SVG im Code, offline.
   Zustand: S.album = { mig: 1, from: n, got: [ids], done: { setId: Zeit } }.
   Die alten Tier-Sticker (OLD) gibt es nicht mehr: wer k davon hatte, bekommt einmalig k zufällige neue Figuren.
   ===================================================================== */
const ALB_OLD = ['fuchs', 'panda', 'katze', 'hase', 'eule', 'pinguin', 'einhorn', 'schildkr', 'krake', 'delfin', 'falter', 'trex', 'drache', 'loewe', 'elefant', 'hai', 'papagei', 'frosch', 'wal', 'krabbe'];
const ALB_WHY = 'Überraschungsgeschenk aus dem Shop';
const ALB_BONUS = 50;
regKind('figur', { group: 'album', label: 'Figuren', ic: 'sticker' });
Object.assign(SHOP_GROUPS, { album: { label: 'Sticker', ic: 'sticker' } });

/* ---------- Zeichenhelfer (Koordinaten -55…55) ---------- */
const AK = '#2a2038';
const aE = (x, y, r = 3.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${AK}"/><circle cx="${(x + r * .35).toFixed(1)}" cy="${(y - r * .35).toFixed(1)}" r="${(r * .35).toFixed(1)}" fill="#fff"/>`;
const aSm = (y, w = 6) => `<path d="M${-w} ${y} Q0 ${y + w * .95} ${w} ${y}" fill="none" stroke="${AK}" stroke-width="2" stroke-linecap="round"/>`;
const aBl = y => `<circle cx="-12" cy="${y}" r="3.4" fill="#ff8fa3" opacity=".55"/><circle cx="12" cy="${y}" r="3.4" fill="#ff8fa3" opacity=".55"/>`;
const aSh = rx => `<ellipse cx="0" cy="47" rx="${rx}" ry="4" fill="#000" opacity=".12"/>`;
const aStar = (x, y, r, f) => `<polygon fill="${f}" points="${[...Array(10)].map((_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .45 : r; return (x + q * Math.cos(a)).toFixed(1) + ',' + (y + q * Math.sin(a)).toFixed(1); }).join(' ')}"/>`;
const aCrown = (x, y, f = '#ffd54a') => `<path d="M${x - 10} ${y} L${x - 12} ${y - 14} L${x - 5} ${y - 7} L${x} ${y - 16} L${x + 5} ${y - 7} L${x + 12} ${y - 14} L${x + 10} ${y}Z" fill="${f}" stroke="#c79100" stroke-width="1.4" stroke-linejoin="round"/>`;

/* Pilzdorf: Dorfbewohner mit Pilzhut und einem Beruf */
const aPilz = (cap, dot, prop, o = {}) => `<g transform="translate(0 7) scale(.88)">${aSh(22)}<ellipse cx="-9" cy="44" rx="6.5" ry="3.6" fill="#6b4a34"/><ellipse cx="9" cy="44" rx="6.5" ry="3.6" fill="#6b4a34"/><ellipse cx="0" cy="25" rx="19" ry="21" fill="${o.skin || '#ffe0c2'}"/>${o.beard || ''}${aE(-7, 16)}${aE(7, 16)}${aBl(22)}${aSm(22, 4.5)}<path d="M-35 -1 Q-38 -47 0 -47 Q38 -47 35 -1 Q0 8 -35 -1Z" fill="${cap}"/><circle cx="-19" cy="-19" r="5.2" fill="${dot}"/><circle cx="2" cy="-33" r="6.2" fill="${dot}"/><circle cx="19" cy="-16" r="5" fill="${dot}"/><circle cx="-4" cy="-10" r="3" fill="${dot}"/>${prop}</g>`;
/* Werkelinge: winzige Tüftler mit Brillen-Augen */
const aWerk = (c, tool, o = {}) => `${aSh(23)}<rect x="-15" y="30" width="10" height="13" rx="3" fill="#455a64"/><rect x="5" y="30" width="10" height="13" rx="3" fill="#455a64"/><rect x="-23" y="-14" width="46" height="46" rx="16" fill="${c}"/><circle cx="-9.5" cy="3" r="9.8" fill="#fff" stroke="#455a64" stroke-width="2.4"/><circle cx="9.5" cy="3" r="9.8" fill="#fff" stroke="#455a64" stroke-width="2.4"/>${aE(-9, 4, 4.2)}${aE(10, 4, 4.2)}<path d="M-6 20 Q0 26 6 20" fill="none" stroke="${AK}" stroke-width="2.2" stroke-linecap="round"/>${o.belt || ''}${tool}`;
/* Brummel: runde, tollpatschige Kerle in ungewöhnlichen Farben */
const aBrum = (c, b, prop, o = {}) => `<g transform="translate(0 6) scale(.9)">${aSh(34)}<circle cx="-25" cy="-17" r="10.5" fill="${c}"/><circle cx="25" cy="-17" r="10.5" fill="${c}"/><circle cx="-25" cy="-17" r="5" fill="${b}"/><circle cx="25" cy="-17" r="5" fill="${b}"/><ellipse cx="-18" cy="42" rx="11" ry="6" fill="${c}"/><ellipse cx="18" cy="42" rx="11" ry="6" fill="${c}"/><ellipse cx="0" cy="12" rx="37" ry="33" fill="${c}"/><ellipse cx="0" cy="23" rx="23" ry="19" fill="${b}"/>${aE(-12, 1, 3)}${aE(12, 1, 3)}<ellipse cx="0" cy="11" rx="8" ry="6" fill="${b}" stroke="${c}" stroke-width="1"/><ellipse cx="0" cy="9" rx="4" ry="3" fill="${AK}"/>${o.mouth || '<path d="M-5 15 Q0 20 5 15" fill="none" stroke="' + AK + '" stroke-width="2" stroke-linecap="round"/>'}${prop}`;
/* Hüpfelinge: kleine Bohnen mit Schal und Fühlern */
const aHup = (c, s, prop, o = {}) => `${aSh(19)}<ellipse cx="-8" cy="43" rx="7.5" ry="4" fill="#37474f"/><ellipse cx="8" cy="43" rx="7.5" ry="4" fill="#37474f"/><path d="M-6 -18 Q-10 -33 -17 -35 M6 -18 Q10 -33 17 -35" fill="none" stroke="${o.dk || '#455a64'}" stroke-width="2.4" stroke-linecap="round"/><circle cx="-17" cy="-35" r="3.6" fill="${s}"/><circle cx="17" cy="-35" r="3.6" fill="${s}"/><path d="M-19 42 Q-25 8 -15 -10 Q0 -27 15 -10 Q25 8 19 42Z" fill="${c}"/>${o.spots || ''}${aE(-6.5, -2, 3.6)}${aE(6.5, -2, 3.6)}${aSm(7, 4.5)}<path d="M-17 15 Q0 24 17 15 L16 24 Q0 32 -16 24Z" fill="${s}"/>${o.tail || `<path d="M10 22 l9 15 l-7 2 l-6 -13Z" fill="${s}"/>`}${prop}`;

const ALB_SETS = [
  { id: 'pilz', reward: 'acc.pilzhut', rname: 'Pilzhut', name: 'Pilzdorf', sub: 'Kleine Dorfleute mit Pilzhut', story: 'Im Pilzdorf hat jeder eine Aufgabe. Wer hilft, wird Freund.', legend: { id: 'urpilz', name: 'Ur-Pilz Tüpfelbart', svg: aPilz('#ffd54a', '#fff8e1', aCrown(0, -45) + aStar(24, 34, 7, '#ffd54a'), { beard: '<path d="M-15 26 Q0 58 15 26Z" fill="#fff"/>' }) }, ch: [
    { id: 'broeckel', name: 'Bröckel', q: 20, svg: aPilz('#ef5350', '#fff', '<ellipse cx="22" cy="33" rx="13" ry="7.5" fill="#d9a05b"/><path d="M14 31 l4 -3 M22 30 l4 -3 M29 32 l3 -2" stroke="#a96d2e" stroke-width="1.7" stroke-linecap="round"/>') },
    { id: 'flitz', name: 'Flitz', q: 25, svg: aPilz('#42a5f5', '#e3f2fd', '<path d="M-15 12 L13 41" stroke="#1e5e9c" stroke-width="3"/><rect x="12" y="27" width="19" height="14" rx="2" fill="#fff" stroke="#1e5e9c" stroke-width="2"/><path d="M12 28 L21.5 35 L31 28" fill="none" stroke="#1e5e9c" stroke-width="2"/>') },
    { id: 'funkel', name: 'Funkel', q: 30, svg: aPilz('#7e57c2', '#ffe082', '<rect x="9" y="26" width="28" height="7" rx="3" fill="#5e3fa3" transform="rotate(-28 9 30)"/>' + aStar(38, 8, 6, '#ffd54a') + aStar(-30, -40, 4, '#ffe082')) },
    { id: 'giesserich', name: 'Gießerich', q: 35, svg: aPilz('#26a69a', '#e0f7f4', '<rect x="12" y="29" width="15" height="12" rx="3" fill="#00796b"/><path d="M27 32 L37 26" stroke="#00796b" stroke-width="3.2" stroke-linecap="round"/><path d="M40 29 l1 4 M43 28 l1 4 M37 31 l1 4" stroke="#7fd4ff" stroke-width="1.8" stroke-linecap="round"/>') },
    { id: 'klimpi', name: 'Klimpi', q: 'G', svg: aPilz('#ec7fb0', '#fff', `<path d="M17 40 V23 L31 20 V36" fill="none" stroke="${AK}" stroke-width="2.4"/><circle cx="14.5" cy="40" r="4.2" fill="${AK}"/><circle cx="28.5" cy="37" r="4.2" fill="${AK}"/>`) },
    { id: 'glimmer', name: 'Glimmer', q: 'G', svg: aPilz('#ff8a50', '#fff3e0', '<path d="M21 24 V30" stroke="#6b4a34" stroke-width="2"/><circle cx="21" cy="37" r="11" fill="#ffd54a" opacity=".35"/><rect x="14.5" y="30" width="13" height="14" rx="3" fill="#ffd54a" stroke="#6b4a34" stroke-width="2"/>') }] },
  { id: 'werk', reward: 'acc.tueftler', rname: 'Tüftler-Helm', name: 'Werkelinge', sub: 'Winzige Tüftler mit Werkzeug', story: 'Die Werkelinge reparieren alles, was klemmt, quietscht oder wackelt.', legend: { id: 'wuppdich', name: 'Meister Wuppdich', svg: aWerk('#3f51b5', '<circle cx="0" cy="-32" r="10" fill="none" stroke="#ffb300" stroke-width="6" stroke-dasharray="3.49 3.49"/><circle cx="0" cy="-32" r="8" fill="#ffd54a"/><circle cx="0" cy="-32" r="3" fill="#fff8e1"/>' + aStar(-30, 28, 6, '#fff') + aStar(30, 22, 5, '#fff'), { belt: '<rect x="-23" y="24" width="46" height="6" fill="#8d6e63"/>' }) }, ch: [
    { id: 'schraubi', name: 'Schraubi', q: 20, svg: aWerk('#ff8a65', '<rect x="-3.5" y="-33" width="7" height="19" rx="2.5" fill="#ffca28"/><rect x="-1.5" y="-48" width="3" height="16" fill="#b0bec5"/><path d="M-4.5 -48 h9" stroke="#b0bec5" stroke-width="2.4"/>') },
    { id: 'zahni', name: 'Zahni', q: 25, svg: aWerk('#4dd0e1', '<circle cx="0" cy="-28" r="10" fill="none" stroke="#ffb300" stroke-width="6" stroke-dasharray="3.49 3.49"/><circle cx="0" cy="-28" r="8" fill="#ffca28"/><circle cx="0" cy="-28" r="3" fill="#fff8e1"/>') },
    { id: 'zwirbel', name: 'Zwirbel', q: 30, svg: aWerk('#aed581', '<path d="M-7 -14 Q-18 -30 -5 -34 Q7 -38 0 -26 M5 -14 Q15 -28 9 -37 Q18 -41 20 -30" fill="none" stroke="#e53935" stroke-width="2.8" stroke-linecap="round"/><circle cx="-5" cy="-34" r="3" fill="#ffd54a"/><circle cx="20" cy="-30" r="3" fill="#ffd54a"/>') },
    { id: 'haemmerle', name: 'Hämmerle', q: 35, svg: aWerk('#9575cd', '<rect x="22" y="10" width="4.5" height="28" rx="2" fill="#8d6e63" transform="rotate(22 24 24)"/><rect x="15" y="2" width="20" height="10" rx="2.5" fill="#78909c" transform="rotate(22 25 7)"/>') },
    { id: 'tropfi', name: 'Tropfi', q: 'G', svg: aWerk('#f48fb1', '<path d="M0 -46 Q-10 -31 0 -22 Q10 -31 0 -46Z" fill="#29b6f6"/><path d="M-3 -34 Q-6 -29 -2 -27" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>') },
    { id: 'brutzel', name: 'Brutzel', q: 'G', svg: aWerk('#ffd180', '<path d="M8 -14 Q15 -30 6 -36" fill="none" stroke="#546e7a" stroke-width="3.2" stroke-linecap="round"/><circle cx="6" cy="-39" r="10" fill="#ffab40" opacity=".35"/><circle cx="6" cy="-39" r="5" fill="#ff7043"/>') }] },
  { id: 'brum', reward: 'acc.brummelohren', rname: 'Brummel-Ohren', name: 'Brummel', sub: 'Große, tollpatschige Kuschelkerle', story: 'Brummel sind riesig, gutmütig und ein bisschen ungeschickt.', legend: { id: 'goldbrummel', name: 'Goldbrummel', svg: aBrum('#ffca28', '#fff3c4', aCrown(0, -42) + `<circle cx="14" cy="1" r="7" fill="none" stroke="#c79100" stroke-width="2"/>`) }, ch: [
    { id: 'schmatz', name: 'Schmatz', q: 20, svg: aBrum('#c9a227', '#f5e6a8', '<rect x="-15" y="27" width="30" height="13" rx="4" fill="#e0a85e"/><path d="M-11 27 Q-7 35 -3 27 Q1 38 5 27 Q9 34 12 27Z" fill="#ffb300"/>') },
    { id: 'bibbel', name: 'Bibbel', q: 25, svg: aBrum('#8e6bbf', '#d9c8f0', '<ellipse cx="36" cy="-30" rx="7" ry="5" fill="#ffd54a"/><path d="M32 -35 v9 M36 -35 v9 M40 -34 v8" stroke="#2a2038" stroke-width="1.6"/><ellipse cx="32" cy="-38" rx="4.5" ry="3" fill="#e1f5fe" opacity=".85"/><path d="M-30 -4 q-4 6 0 9 q4 -3 0 -9" fill="#4fc3f7"/>', { mouth: '<path d="M-6 17 Q0 14 6 17" fill="none" stroke="#2a2038" stroke-width="2" stroke-linecap="round"/>' }) },
    { id: 'gaehn', name: 'Gähn', q: 30, svg: aBrum('#4fa8a0', '#c8ece8', '<path d="M-24 -24 Q0 -50 24 -24 Q9 -29 -24 -24Z" fill="#7986cb"/><circle cx="25" cy="-28" r="4.5" fill="#fff"/><text x="33" y="-30" font-size="13" font-weight="700" fill="#5c6bc0" font-family="sans-serif">z</text>', { mouth: '<ellipse cx="0" cy="18" rx="4" ry="5" fill="#7b2d3b"/>' }) },
    { id: 'plumps', name: 'Plumps', q: 35, svg: aBrum('#e57373', '#ffd9d9', aStar(-26, -34, 6, '#ffd54a') + aStar(0, -42, 5, '#ffe082') + aStar(26, -34, 6, '#ffd54a') + '<rect x="7" y="-9" width="15" height="5.5" rx="2.5" fill="#ffcc80" transform="rotate(-20 14 -6)"/>') },
    { id: 'mampf', name: 'Mampf', q: 'G', svg: aBrum('#7cb342', '#dcedc8', '<ellipse cx="0" cy="38" rx="17" ry="4.5" fill="#c68a3c"/><ellipse cx="0" cy="33" rx="16" ry="4.5" fill="#e0a85e"/><ellipse cx="0" cy="28" rx="15" ry="4.5" fill="#c68a3c"/><rect x="-4" y="22" width="8" height="5" rx="1.5" fill="#fff59d"/>') },
    { id: 'pitsch', name: 'Pitsch', q: 'G', svg: aBrum('#5c9ce6', '#d3e6fb', '<path d="M-28 -22 Q0 -55 28 -22 Q14 -28 0 -22 Q-14 -28 -28 -22Z" fill="#ef5350"/><path d="M0 -22 V-8" stroke="#6b4a34" stroke-width="2.6"/><path d="M-34 -2 l-2 6 M32 -6 l-2 6 M38 6 l-2 6" stroke="#4fc3f7" stroke-width="2" stroke-linecap="round"/>') }] },
  { id: 'huepf', reward: 'acc.huepffuehler', rname: 'Hüpf-Fühler', name: 'Hüpfelinge', sub: 'Eine Herde, die immer dem Anführer folgt', story: 'Die Hüpfelinge hüpfen im Gänsemarsch. Aber einer ist immer verschwunden.', legend: { id: 'springmeister', name: 'Springmeister', svg: aHup('#ffd54a', '#ef5350', aCrown(0, -35) + aStar(-26, 20, 6, '#fff') + aStar(27, 26, 5, '#fff'), { dk: '#c79100' }) }, ch: [
    { id: 'hopp', name: 'Hopp', q: 20, svg: aHup('#66bb6a', '#ef5350', '<path d="M-26 36 V-30" stroke="#6b4a34" stroke-width="2.8"/><path d="M-26 -30 L-8 -24 L-26 -16Z" fill="#ffd54a"/>') },
    { id: 'zipfel', name: 'Zipfel', q: 25, svg: aHup('#4dd0e1', '#ff7043', '', { tail: '<path d="M10 20 Q30 14 36 30 Q40 40 30 44 Q36 36 28 30 Q20 26 12 28Z" fill="#ff7043"/>' }) },
    { id: 'tuepfel', name: 'Tüpfel', q: 30, svg: aHup('#f48fb1', '#7e57c2', '', { spots: '<circle cx="-11" cy="18" r="3" fill="#fff" opacity=".8"/><circle cx="10" cy="28" r="3.4" fill="#fff" opacity=".8"/><circle cx="-9" cy="34" r="2.6" fill="#fff" opacity=".8"/><circle cx="-12" cy="-8" r="2.6" fill="#fff" opacity=".8"/><circle cx="12" cy="-10" r="2.2" fill="#fff" opacity=".8"/>' }) },
    { id: 'wuschel', name: 'Wuschel', q: 35, svg: aHup('#ffb74d', '#26a69a', '<path d="M-14 -16 Q-16 -30 -8 -26 Q-6 -36 2 -28 Q10 -36 12 -24 Q20 -26 16 -14 Q0 -20 -14 -16Z" fill="#ff9100"/>') },
    { id: 'flummi', name: 'Flummi', q: 'G', svg: aHup('#9fa8da', '#ffca28', '<path d="M-24 52 Q0 40 24 52" fill="none" stroke="#9fa8da" stroke-width="3" stroke-linecap="round"/><path d="M-30 30 l-8 0 M-28 20 l-9 0 M30 30 l8 0 M28 20 l9 0" stroke="#9fa8da" stroke-width="2.4" stroke-linecap="round"/>') },
    { id: 'hoppla', name: 'Hoppla', q: 'G', svg: aHup('#81d4fa', '#8d6e63', '<circle cx="27" cy="-22" r="11" fill="#fff" stroke="#455a64" stroke-width="2"/><text x="27" y="-16" font-size="16" text-anchor="middle" font-weight="700" fill="#455a64" font-family="sans-serif">?</text><circle cx="19" cy="-12" r="2" fill="#fff" stroke="#455a64"/>') }] }
];
const ALB_CH = [];
ALB_SETS.forEach(s => {
  s.ch.forEach(c => { c.set = s.id; ALB_CH.push(c); });
  s.legend.set = s.id; s.legend.leg = true;
  regItems([...s.ch.map(c => ({ id: 'fg.' + c.id, kind: 'figur', name: c.name, svg: c.svg, set: s.id, src: { t: 'milestone', why: ALB_WHY } })),
    { id: 'fg.' + s.legend.id, kind: 'figur', name: s.legend.name, svg: s.legend.svg, set: s.id, leg: true, src: { t: 'milestone', why: 'Sammle alle 6 Figuren von ' + s.name } }]);
});
const albS = () => { const A = S.album || (S.album = {}); if (!A.done) A.done = {}; if (!Array.isArray(A.got)) A.got = []; return A; };
const albHave = set => set.ch.filter(c => hasItem('fg.' + c.id)).length;

/* ---------- Einmalig: alte Tier-Sticker werden zu gleich vielen zufälligen neuen Figuren ---------- */
function albumMig() {
  const A = albS(); if (A.mig) return; A.mig = 1;
  let n = 0;
  ALB_OLD.forEach(k => { if (S.unl && S.unl['bs.' + k]) { n++; delete S.unl['bs.' + k]; } });
  if (S.goal && /^bs\./.test(S.goal) && !CATALOG[S.goal]) S.goal = null;
  A.from = n; if (!n) return;
  const pool = shuffle(ALB_CH.filter(c => !hasItem('fg.' + c.id))), take = pool.slice(0, n);
  take.forEach(c => { unlock('fg.' + c.id, true); A.got.push('fg.' + c.id); });
  if (n > take.length) giveCoins((n - take.length) * 15);
  save();
}
/* ---------- Set komplett? Dann Legende + Münzen ---------- */
function albumCheck(silent) {
  albumMig(); const A = albS(); let fresh = null;
  ALB_SETS.forEach(s => {
    if (!A.done[s.id] && albHave(s) === s.ch.length) {
      A.done[s.id] = Date.now(); unlock('fg.' + s.legend.id, true); unlock(s.reward, true); S.coins += ALB_BONUS; S.life = (S.life || 0) + ALB_BONUS; fresh = s;
    }
  });
  if (fresh) {
    save(); sfx('magic'); try { if (!rwCalm()) confetti(80); } catch (e) { }
    if (!silent && !(typeof UI !== 'undefined' && UI && UI.wQuiet)) modal('Set komplett!', `<div class="gift-reveal"><div class="gift-th"><svg viewBox="-55 -55 110 110">${fresh.legend.svg}</svg></div><p><b>${esc(fresh.legend.name)}</b><br><span class="small mute">Die geheime Legende von ${esc(fresh.name)} ist da – dazu das Avatar-Zubehör <b>${esc(fresh.rname)}</b> und ${ALB_BONUS} 🪙!</span></p></div>`, null, '', '', 'Toll!');
  }
  return fresh;
}
/* eine zufällige noch fehlende Figur (für Geschenke) */
function albumGiftPick() {
  const pool = ALB_CH.filter(c => !hasItem('fg.' + c.id)); if (!pool.length) return null;
  return CATALOG['fg.' + pool[Math.floor(Math.random() * pool.length)].id];
}

/* ---------- Ansicht: eine Reihe je Serie, alles auf einer Seite ---------- */
const albSvg = (svg, lock, cls) => `<span class="alf-i ${lock ? 'alsil' : ''} ${cls || ''}"><svg viewBox="-55 -55 110 110">${svg}</svg></span>`;
function albumView() {
  albumMig(); const A = albS(), done = Object.keys(A.done).length;
  return `<p class="mute small" style="margin:6px 4px">Sticker gibt es als Überraschungsgeschenk. Hast du alle 6 einer Serie, wartet eine geheime Belohnung. ${done} von ${ALB_SETS.length} Serien komplett.</p><div class="alb-list">${ALB_SETS.map(s => {
    const h = albHave(s), ok = !!A.done[s.id], near = h >= s.ch.length - 2, rw = CATALOG[s.reward], rwTh = rw ? KIND[rw.kind].thumb(rw) : '';
    const figs = s.ch.map(c => { const on = hasItem('fg.' + c.id); return `<div class="alf ${on ? 'on' : ''}">${albSvg(c.svg, !on)}<b>${esc(c.name)}</b></div>`; }).join('');
    const leg = ok ? `<div class="alf on leg">${albSvg(s.legend.svg, false)}<b>${esc(s.legend.name)}</b></div>` : `<div class="alf leg">${albSvg(near ? s.legend.svg : '<text x="0" y="16" font-size="56" text-anchor="middle" font-weight="700" fill="#777" font-family="sans-serif">?</text>', true)}<b>${near ? '???' : 'Geheim'}</b></div>`;
    const rew = `<div class="alf rew ${ok ? 'on' : ''}"><span class="alf-i ${ok ? '' : 'alsil'}">${ok ? rwTh : '<svg viewBox="-55 -55 110 110"><text x="0" y="16" font-size="56" text-anchor="middle" font-weight="700" fill="#777" font-family="sans-serif">?</text></svg>'}</span><b>${ok ? esc(s.rname) : 'Bonus'}</b></div>`;
    return `<section class="alb-ser ${ok ? 'ok' : ''}"><div class="alb-hd"><h3>${esc(s.name)}</h3><span class="small mute">${h} / ${s.ch.length}${ok ? ' ✔' : ''}</span></div><p class="small mute" style="margin:0 0 8px">${esc(s.sub)}</p><div class="alb-figs">${figs}${leg}${rew}</div></section>`;
  }).join('')}</div>`;
}
registerFeature({ id: 'album', group: 'hidden', title: 'Sticker', boot: albumMig, check: albumCheck });
