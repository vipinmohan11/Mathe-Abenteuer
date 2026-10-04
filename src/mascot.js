/* =====================================================================
   MASCOT "FINO" – original inline-SVG characters, hats, extras,
   backgrounds and the SHOP catalog.
   ===================================================================== */

const INK = '#2b2233';

function eyes(m, x1, x2, y, r, col) {
  col = col || INK;
  const sw = r * .55;
  if (m === 'cheer') {
    const arc = x => `<path d="M${x - r} ${y + r * .4} Q${x} ${y - r * 1.5} ${x + r} ${y + r * .4}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`;
    return arc(x1) + arc(x2);
  }
  const dot = (x, ox, oy) => `<circle cx="${x + ox}" cy="${y + oy}" r="${r}" fill="${col}"/><circle cx="${x + ox + r * .35}" cy="${y + oy - r * .35}" r="${r * .32}" fill="#fff"/>`;
  const brow = (xa, ya, xb, yb) => `<path d="M${xa} ${ya} L${xb} ${yb}" stroke="${col}" stroke-width="${sw * .8}" stroke-linecap="round"/>`;
  if (m === 'sad') {
    return dot(x1, 0, 0) + dot(x2, 0, 0) +
      brow(x1 - r, y - r * 1.5, x1 + r, y - r * 2.2) + brow(x2 - r, y - r * 2.2, x2 + r, y - r * 1.5) +
      `<path d="M${x2 + r * 1.3} ${y + r * 1.1} q${-r * .8} ${r * 1.4} 0 ${r * 1.8} q${r * .8} ${-r * .4} 0 ${-r * 1.8}z" fill="#7cc7ff"/>`;
  }
  if (m === 'think') {
    return dot(x1, r * .3, -r * .3) + dot(x2, r * .3, -r * .3) +
      brow(x1 - r, y - r * 1.7, x1 + r, y - r * 1.7) + brow(x2 - r, y - r * 2.3, x2 + r, y - r * 1.8);
  }
  return dot(x1, 0, 0) + dot(x2, 0, 0);
}
function mouth(m, x, y, w, col) {
  col = col || INK;
  if (m === 'cheer') return `<path d="M${x - w} ${y - w * .2} Q${x} ${y + w * 1.6} ${x + w} ${y - w * .2} Z" fill="#7a2e3a"/><ellipse cx="${x}" cy="${y + w * .75}" rx="${w * .5}" ry="${w * .3}" fill="#ff8fa3"/>`;
  if (m === 'sad') return `<path d="M${x - w * .8} ${y + w * .6} Q${x} ${y - w * .4} ${x + w * .8} ${y + w * .6}" fill="none" stroke="${col}" stroke-width="3.5" stroke-linecap="round"/>`;
  if (m === 'think') return `<path d="M${x - w * .6} ${y + 2} q${w * .3} ${-w * .35} ${w * .6} 0 t${w * .6} 0" fill="none" stroke="${col}" stroke-width="3.2" stroke-linecap="round"/>`;
  return `<path d="M${x - w} ${y} Q${x} ${y + w * 1.0} ${x + w} ${y}" fill="none" stroke="${col}" stroke-width="3.5" stroke-linecap="round"/>`;
}
const blush = (x1, x2, y, c) => `<ellipse cx="${x1}" cy="${y}" rx="9" ry="5.5" fill="${c || '#ff9aa8'}" opacity=".55"/><ellipse cx="${x2}" cy="${y}" rx="9" ry="5.5" fill="${c || '#ff9aa8'}" opacity=".55"/>`;
const arms = (m, col, y) => m === 'cheer'
  ? `<ellipse cx="58" cy="${y - 28}" rx="10" ry="17" transform="rotate(30 58 ${y - 28})" fill="${col}"/><ellipse cx="142" cy="${y - 28}" rx="10" ry="17" transform="rotate(-30 142 ${y - 28})" fill="${col}"/>`
  : `<ellipse cx="62" cy="${y}" rx="10" ry="17" transform="rotate(14 62 ${y})" fill="${col}"/><ellipse cx="138" cy="${y}" rx="10" ry="17" transform="rotate(-14 138 ${y})" fill="${col}"/>`;
const feet = col => `<ellipse cx="80" cy="177" rx="15" ry="9" fill="${col}"/><ellipse cx="120" cy="177" rx="15" ry="9" fill="${col}"/>`;

const SKINS = {
  fuchs: {
    name: 'Fuchs', headTop: 44, ex: [78, 122], ey: 88, er: 6, neckY: 128,
    draw(m) {
      const o = '#F28C28', d = '#D9701A', w = '#FFF4E4';
      return `
      <path d="M132 168 C182 176 202 128 178 98 C176 130 160 146 130 150Z" fill="${o}"/>
      <path d="M178 98 C190 116 194 140 182 156 C190 140 188 118 178 98Z" fill="#fff"/>
      ${feet(d)}
      <ellipse cx="100" cy="142" rx="40" ry="36" fill="${o}"/>
      <ellipse cx="100" cy="150" rx="25" ry="25" fill="${w}"/>
      ${arms(m, o, 142)}
      <path d="M52 70 L56 18 L92 50Z" fill="${o}"/><path d="M148 70 L144 18 L108 50Z" fill="${o}"/>
      <path d="M60 58 L62 32 L82 50Z" fill="#7a3b1c"/><path d="M140 58 L138 32 L118 50Z" fill="#7a3b1c"/>
      <ellipse cx="100" cy="88" rx="53" ry="46" fill="${o}"/>
      <path d="M47 96 L70 112 L52 118Z" fill="${w}"/><path d="M153 96 L130 112 L148 118Z" fill="${w}"/>
      <ellipse cx="100" cy="106" rx="32" ry="21" fill="${w}"/>
      ${eyes(m, 78, 122, 86, 6)}
      <ellipse cx="100" cy="97" rx="7" ry="5" fill="#3a2a22"/>
      ${mouth(m, 100, 106, 10)}
      ${blush(66, 134, 102)}`;
    }
  },
  igel: {
    name: 'Igel', headTop: 46, ex: [80, 120], ey: 92, er: 5.5, neckY: 130,
    draw(m) {
      const sp = '#7b5a3c', sk = '#EBCB9E', bd = '#D9B07E';
      let spikes = '';
      for (let i = 0; i <= 14; i++) {              // spikes around the head/back
        const a = Math.PI * (1.0 + i / 14 * 1.0);
        const cx = 100 + Math.cos(a) * 56, cy = 92 + Math.sin(a) * 50;
        const ox = 100 + Math.cos(a) * 76, oy = 92 + Math.sin(a) * 70;
        const px = Math.cos(a + Math.PI / 2) * 9, py = Math.sin(a + Math.PI / 2) * 9;
        spikes += `<path d="M${cx - px} ${cy - py} L${ox} ${oy} L${cx + px} ${cy + py}Z" fill="${sp}"/>`;
      }
      return `
      ${feet('#b88f5e')}
      <ellipse cx="100" cy="140" rx="46" ry="38" fill="${sp}"/>
      ${spikes}
      <ellipse cx="100" cy="146" rx="36" ry="32" fill="${bd}"/>
      ${arms(m, sk, 142)}
      <circle cx="58" cy="62" r="11" fill="${sk}"/><circle cx="142" cy="62" r="11" fill="${sk}"/>
      <circle cx="58" cy="62" r="5.5" fill="#f4a6a6"/><circle cx="142" cy="62" r="5.5" fill="#f4a6a6"/>
      <ellipse cx="100" cy="90" rx="50" ry="44" fill="${sk}"/>
      <path d="M52 78 Q100 40 148 78 Q130 62 100 62 Q70 62 52 78Z" fill="${sp}"/>
      <ellipse cx="100" cy="104" rx="26" ry="18" fill="#fff4de"/>
      ${eyes(m, 80, 120, 90, 5.5)}
      <ellipse cx="100" cy="99" rx="7" ry="5.5" fill="#3a2a22"/>
      ${mouth(m, 100, 108, 9)}
      ${blush(68, 132, 104)}`;
    }
  },
  katze: {
    name: 'Katze', headTop: 44, ex: [78, 122], ey: 90, er: 6.5, neckY: 130,
    draw(m) {
      const c = '#8FA8C8', d = '#6F89AE', w = '#EEF3FA';
      return `
      <path d="M134 160 C180 166 196 120 172 92 C170 122 160 138 132 144Z" fill="${c}"/>
      <path d="M170 106 l14 -3 M172 120 l14 -2 M168 134 l12 0" stroke="${d}" stroke-width="5" stroke-linecap="round"/>
      ${feet(d)}
      <ellipse cx="100" cy="142" rx="40" ry="36" fill="${c}"/>
      <ellipse cx="100" cy="150" rx="24" ry="24" fill="${w}"/>
      ${arms(m, c, 142)}
      <path d="M54 72 L52 22 L94 52Z" fill="${c}"/><path d="M146 72 L148 22 L106 52Z" fill="${c}"/>
      <path d="M62 60 L62 36 L82 52Z" fill="#ffb3c1"/><path d="M138 60 L138 36 L118 52Z" fill="#ffb3c1"/>
      <ellipse cx="100" cy="90" rx="52" ry="45" fill="${c}"/>
      <path d="M100 46 v14 M86 48 l3 12 M114 48 l-3 12" stroke="${d}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="100" cy="106" rx="26" ry="17" fill="${w}"/>
      ${eyes(m, 78, 122, 88, 6.5)}
      <path d="M94 98 L106 98 L100 105Z" fill="#ff8fa3" stroke="#ff8fa3" stroke-width="2" stroke-linejoin="round"/>
      ${mouth(m, 100, 108, 8)}
      <path d="M60 100 L36 94 M60 108 L36 110 M140 100 L164 94 M140 108 L164 110" stroke="${d}" stroke-width="2.5" stroke-linecap="round"/>
      ${blush(66, 134, 104)}`;
    }
  },
  roboter: {
    name: 'Roboter', headTop: 40, ex: [78, 122], ey: 86, er: 7, neckY: 130,
    draw(m) {
      const b = '#AEBBCB', d = '#7F90A5', s = '#1c2a3a', g = m === 'sad' ? '#7ab8ff' : m === 'think' ? '#ffd166' : '#5dffc4';
      let face;
      if (m === 'cheer') face = `<path d="M70 88 Q78 72 86 88 M114 88 Q122 72 130 88" fill="none" stroke="${g}" stroke-width="5" stroke-linecap="round"/><path d="M80 102 Q100 126 120 102Z" fill="${g}"/>`;
      else if (m === 'sad') face = `<circle cx="78" cy="88" r="7" fill="${g}"/><circle cx="122" cy="88" r="7" fill="${g}"/><path d="M82 112 Q100 100 118 112" fill="none" stroke="${g}" stroke-width="5" stroke-linecap="round"/><path d="M130 98 q-4 8 0 11 q4 -3 0 -11z" fill="#7cc7ff"/>`;
      else if (m === 'think') face = `<circle cx="80" cy="84" r="7" fill="${g}"/><circle cx="124" cy="84" r="7" fill="${g}"/><path d="M84 108 h32" stroke="${g}" stroke-width="5" stroke-linecap="round"/>`;
      else face = `<circle cx="78" cy="88" r="7" fill="${g}"/><circle cx="122" cy="88" r="7" fill="${g}"/><path d="M80 104 Q100 120 120 104" fill="none" stroke="${g}" stroke-width="5" stroke-linecap="round"/>`;
      return `
      ${feet(d)}
      <rect x="62" y="116" width="76" height="58" rx="18" fill="${b}"/>
      <rect x="80" y="130" width="40" height="26" rx="8" fill="${s}"/>
      <circle cx="92" cy="143" r="5" fill="#ff6b6b"/><circle cx="108" cy="143" r="5" fill="#ffd166"/>
      ${m === 'cheer'
        ? `<rect x="40" y="96" width="16" height="42" rx="8" transform="rotate(25 48 117)" fill="${d}"/><rect x="144" y="96" width="16" height="42" rx="8" transform="rotate(-25 152 117)" fill="${d}"/>`
        : `<rect x="44" y="120" width="16" height="42" rx="8" transform="rotate(12 52 141)" fill="${d}"/><rect x="140" y="120" width="16" height="42" rx="8" transform="rotate(-12 148 141)" fill="${d}"/>`}
      <path d="M100 40 V22" stroke="${d}" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="19" r="7" fill="#ff6b6b"/>
      <rect x="44" y="60" width="112" height="76" rx="26" fill="${b}"/>
      <rect x="36" y="82" width="12" height="26" rx="6" fill="${d}"/><rect x="152" y="82" width="12" height="26" rx="6" fill="${d}"/>
      <rect x="56" y="70" width="88" height="56" rx="18" fill="${s}"/>
      ${face}
      <circle cx="62" cy="116" r="3" fill="#ff9aa8"/><circle cx="138" cy="116" r="3" fill="#ff9aa8"/>`;
    }
  },
  drache: {
    name: 'Drache', headTop: 44, ex: [78, 122], ey: 88, er: 6, neckY: 130,
    draw(m) {
      const g = '#5DBB63', d = '#3F9A4B', y = '#FFE08A';
      return `
      <path d="M70 118 C30 90 24 124 44 142 C48 126 58 124 74 132Z" fill="#8fd694"/>
      <path d="M130 118 C170 90 176 124 156 142 C152 126 142 124 126 132Z" fill="#8fd694"/>
      <path d="M134 164 C178 172 194 138 184 118 L170 134 L172 122 C168 140 156 150 132 152Z" fill="${g}"/>
      <path d="M184 118 l10 -8 l-2 14z" fill="${d}"/>
      ${feet(d)}
      <ellipse cx="100" cy="142" rx="40" ry="36" fill="${g}"/>
      <ellipse cx="100" cy="150" rx="25" ry="25" fill="${y}"/>
      <path d="M86 140 h28 M84 152 h32 M88 164 h24" stroke="#f3c75a" stroke-width="3" stroke-linecap="round"/>
      ${arms(m, g, 142)}
      <path d="M72 50 L66 22 L90 44Z" fill="#f7e3b5"/><path d="M128 50 L134 22 L110 44Z" fill="#f7e3b5"/>
      <path d="M90 44 L96 30 L102 44 L108 30 L112 44Z" fill="${d}"/>
      <ellipse cx="100" cy="88" rx="52" ry="45" fill="${g}"/>
      <ellipse cx="100" cy="108" rx="30" ry="19" fill="#8fd694"/>
      <circle cx="90" cy="104" r="3.2" fill="${d}"/><circle cx="110" cy="104" r="3.2" fill="${d}"/>
      ${eyes(m, 78, 122, 86, 6)}
      ${mouth(m, 100, 112, 10)}
      ${blush(64, 136, 100, '#ffb08a')}`;
    }
  },
  pinguin: {
    name: 'Pinguin', headTop: 44, ex: [82, 118], ey: 84, er: 5.5, neckY: 128,
    draw(m) {
      const n = '#2f4560', w = '#FFFFFF', o = '#FF9F1C';
      return `
      <ellipse cx="80" cy="177" rx="17" ry="8" fill="${o}"/><ellipse cx="120" cy="177" rx="17" ry="8" fill="${o}"/>
      <ellipse cx="100" cy="138" rx="46" ry="42" fill="${n}"/>
      <ellipse cx="100" cy="146" rx="31" ry="32" fill="${w}"/>
      ${m === 'cheer'
        ? `<ellipse cx="52" cy="112" rx="11" ry="24" transform="rotate(35 52 112)" fill="${n}"/><ellipse cx="148" cy="112" rx="11" ry="24" transform="rotate(-35 148 112)" fill="${n}"/>`
        : `<ellipse cx="55" cy="142" rx="11" ry="25" transform="rotate(14 55 142)" fill="${n}"/><ellipse cx="145" cy="142" rx="11" ry="25" transform="rotate(-14 145 142)" fill="${n}"/>`}
      <ellipse cx="100" cy="84" rx="50" ry="44" fill="${n}"/>
      <path d="M100 66 C70 60 56 84 66 104 C80 112 90 100 100 96 C110 100 120 112 134 104 C144 84 130 60 100 66Z" fill="${w}"/>
      ${eyes(m, 82, 118, 84, 5.5)}
      <path d="M90 96 Q100 90 110 96 Q100 108 90 96Z" fill="${o}"/>
      ${m === 'cheer' ? `<path d="M92 101 Q100 114 108 101Z" fill="#7a2e3a"/>` : m === 'sad' ? '' : ''}
      ${blush(70, 130, 98)}`;
    }
  },
  maus: {
    name: 'Maus', headTop: 46, ex: [80, 120], ey: 86, er: 6.5, neckY: 130,
    draw(m) {
      const g = '#B9BCCB', d = '#9498AD', p = '#FFB3C7', w = '#F6F2F9';
      return `
      <path d="M136 164 C182 178 200 142 184 110" fill="none" stroke="#E7A3B8" stroke-width="6" stroke-linecap="round"/>
      ${feet(d)}
      <ellipse cx="100" cy="142" rx="38" ry="36" fill="${g}"/>
      <ellipse cx="100" cy="150" rx="24" ry="25" fill="${w}"/>
      ${arms(m, g, 142)}
      <circle cx="54" cy="56" r="26" fill="${g}"/><circle cx="54" cy="56" r="16" fill="${p}"/>
      <circle cx="146" cy="56" r="26" fill="${g}"/><circle cx="146" cy="56" r="16" fill="${p}"/>
      <ellipse cx="100" cy="88" rx="50" ry="44" fill="${g}"/>
      <ellipse cx="100" cy="106" rx="24" ry="17" fill="${w}"/>
      <ellipse cx="100" cy="97" rx="6" ry="4.5" fill="#ff8fa9"/>
      <path d="M72 100 L46 94 M72 108 L46 110 M128 100 L154 94 M128 108 L154 110" stroke="${d}" stroke-width="2.5" stroke-linecap="round"/>
      ${m === 'sad' ? '' : '<rect x="95" y="109" width="10" height="9" rx="2.5" fill="#fff" stroke="#d3cfdc" stroke-width="1.5"/>'}
      ${eyes(m, 80, 120, 86, 6.5)}
      ${mouth(m, 100, 108, 8)}
      ${blush(68, 132, 102)}`;
    }
  },
  hase: {
    name: 'Hase', headTop: 46, ex: [78, 122], ey: 88, er: 6.5, neckY: 130,
    draw(m) {
      const c = '#D8A86C', d = '#BF8B4F', w = '#FFF0DA', p = '#FFB3C7';
      return `
      <circle cx="146" cy="162" r="14" fill="${w}"/>
      ${feet(d)}
      <ellipse cx="100" cy="142" rx="38" ry="36" fill="${c}"/>
      <ellipse cx="100" cy="150" rx="24" ry="25" fill="${w}"/>
      ${arms(m, c, 142)}
      <g transform="rotate(-9 68 40)"><ellipse cx="68" cy="38" rx="14" ry="36" fill="${c}"/><ellipse cx="68" cy="40" rx="7" ry="26" fill="${p}"/></g>
      <g transform="rotate(9 132 40)"><ellipse cx="132" cy="38" rx="14" ry="36" fill="${c}"/><ellipse cx="132" cy="40" rx="7" ry="26" fill="${p}"/></g>
      <ellipse cx="100" cy="88" rx="50" ry="44" fill="${c}"/>
      <ellipse cx="88" cy="107" rx="16" ry="12" fill="${w}"/><ellipse cx="112" cy="107" rx="16" ry="12" fill="${w}"/>
      <path d="M94 96 L106 96 L100 103Z" fill="#ff8fa9" stroke="#ff8fa9" stroke-width="2" stroke-linejoin="round"/>
      ${m === 'sad' ? '' : '<rect x="94" y="110" width="6" height="9" rx="2" fill="#fff" stroke="#d9cdbd" stroke-width="1.4"/><rect x="100" y="110" width="6" height="9" rx="2" fill="#fff" stroke="#d9cdbd" stroke-width="1.4"/>'}
      ${eyes(m, 78, 122, 86, 6.5)}
      ${mouth(m, 100, 108, 8)}
      ${blush(64, 136, 100)}`;
    }
  },
  pferd: {
    name: 'Pony', headTop: 44, ex: [76, 124], ey: 84, er: 6.5, neckY: 130,
    draw(m) {
      const c = '#B96A2E', d = '#4E2E17', b = '#D9965A', mz = '#E6B882', bl = '#FFF4E0';
      return `
      <path d="M134 150 C190 146 202 198 160 192 C178 178 152 170 132 166Z" fill="${d}"/>
      ${feet(d)}
      <ellipse cx="100" cy="142" rx="40" ry="36" fill="${c}"/>
      <ellipse cx="100" cy="152" rx="26" ry="24" fill="${b}"/>
      ${arms(m, c, 142)}
      <path d="M56 70 C36 92 40 122 58 130 L72 100Z" fill="${d}"/>
      <path d="M62 62 L64 22 L90 52Z" fill="${c}"/><path d="M138 62 L136 22 L110 52Z" fill="${c}"/>
      <path d="M68 56 L68 34 L82 50Z" fill="#8a4a1f"/><path d="M132 56 L132 34 L118 50Z" fill="#8a4a1f"/>
      <ellipse cx="100" cy="86" rx="48" ry="46" fill="${c}"/>
      <path d="M96 52 L104 52 L108 104 L92 104Z" fill="${bl}" opacity=".92"/>
      <path d="M68 58 C78 36 114 34 132 58 C120 52 110 66 100 76 C90 64 80 62 68 58Z" fill="${d}"/>
      <ellipse cx="100" cy="112" rx="28" ry="20" fill="${mz}"/>
      <circle cx="90" cy="111" r="3.2" fill="#7a4a28"/><circle cx="110" cy="111" r="3.2" fill="#7a4a28"/>
      ${eyes(m, 76, 124, 84, 6.5)}
      ${mouth(m, 100, 122, 8)}
      ${blush(64, 136, 100)}`;
    }
  }
};

/* ---------- accessories ---------- */
const HATS = {
  krone: (x, y) => `<g transform="translate(${x} ${y})"><path d="M-27 4 L-31 -22 L-14 -10 L0 -28 L14 -10 L31 -22 L27 4Z" fill="#FFC93C" stroke="#E0A100" stroke-width="2.5" stroke-linejoin="round"/><circle cx="-31" cy="-24" r="4" fill="#ff5d73"/><circle cx="0" cy="-30" r="4.5" fill="#5dc7ff"/><circle cx="31" cy="-24" r="4" fill="#ff5d73"/><rect x="-27" y="-2" width="54" height="8" rx="3" fill="#E0A100"/></g>`,
  zylinder: (x, y) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="3" rx="38" ry="8" fill="#2b2b3a"/><rect x="-24" y="-38" width="48" height="42" rx="5" fill="#33334a"/><rect x="-24" y="-12" width="48" height="9" fill="#ff5d73"/></g>`,
  zauber: (x, y) => `<g transform="translate(${x} ${y})"><path d="M-34 6 Q0 -4 34 6 L8 -52 Q4 -58 -2 -50Z" fill="#7b5cd6"/><path d="M-36 8 Q0 -4 36 8 Q0 14 -36 8Z" fill="#5a3fb0"/><path d="M-4 -22 l3 7 7 .5 -5.5 4.5 2 7 -6.5 -4 -6.5 4 2 -7 -5.5 -4.5 7 -.5z" fill="#FFE066"/><circle cx="14" cy="-4" r="2.6" fill="#FFE066"/></g>`,
  schleife: (x, y) => `<g transform="translate(${x + 30} ${y + 8}) rotate(18)"><path d="M0 0 L-24 -15 Q-30 0 -24 15Z" fill="#ff6fa5"/><path d="M0 0 L24 -15 Q30 0 24 15Z" fill="#ff6fa5"/><circle cx="0" cy="0" r="7" fill="#e84a86"/></g>`
};
const EXTRAS = {
  brille: (s) => {
    const [x1, x2] = s.ex, y = s.ey, r = s.er + 7;
    return `<g fill="rgba(255,255,255,.25)" stroke="#2b2233" stroke-width="3.5"><circle cx="${x1}" cy="${y}" r="${r}"/><circle cx="${x2}" cy="${y}" r="${r}"/><path d="M${x1 + r} ${y} Q100 ${y - 6} ${x2 - r} ${y}" fill="none"/><path d="M${x1 - r} ${y} l-10 -3 M${x2 + r} ${y} l10 -3" fill="none"/></g>`;
  },
  schal: (s) => {
    const y = s.neckY;
    return `<g><path d="M62 ${y - 4} Q100 ${y + 14} 138 ${y - 4} L140 ${y + 10} Q100 ${y + 28} 60 ${y + 10}Z" fill="#e8454f"/><path d="M118 ${y + 14} l12 36 l16 -6 l-8 -34Z" fill="#e8454f"/><path d="M70 ${y} Q100 ${y + 14} 130 ${y}" stroke="#fff" stroke-width="3" fill="none" stroke-dasharray="6 7" opacity=".8"/></g>`;
  }
};

/* ---------- scene backgrounds (inside the avatar circle) ---------- */
const BGS = {
  none: '',
  wolken: `<defs><linearGradient id="gW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#e6f7ff"/></linearGradient></defs><rect width="200" height="200" fill="url(#gW)"/>
    <g fill="#fff"><ellipse cx="46" cy="52" rx="28" ry="12"/><ellipse cx="64" cy="44" rx="18" ry="12"/><ellipse cx="150" cy="86" rx="30" ry="12"/><ellipse cx="168" cy="78" rx="16" ry="11"/><ellipse cx="120" cy="30" rx="20" ry="9"/></g>`,
  wiese: `<defs><linearGradient id="gM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8e0ff"/><stop offset="1" stop-color="#e8f9ff"/></linearGradient></defs><rect width="200" height="200" fill="url(#gM)"/>
    <circle cx="156" cy="40" r="16" fill="#ffe066"/><ellipse cx="60" cy="210" rx="150" ry="70" fill="#7ed56f"/><ellipse cx="170" cy="215" rx="110" ry="60" fill="#5cc25a"/>
    <g><circle cx="30" cy="162" r="4" fill="#ff7aa2"/><circle cx="52" cy="176" r="4" fill="#fff"/><circle cx="170" cy="168" r="4" fill="#ffd166"/><circle cx="150" cy="184" r="4" fill="#ff7aa2"/></g>`,
  meer: `<defs><linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".55" stop-color="#9fe0ff"/><stop offset="1" stop-color="#3aa0e0"/></linearGradient></defs><rect width="200" height="200" fill="url(#gS)"/>
    <circle cx="44" cy="46" r="20" fill="#ffd54a"/><path d="M0 150 Q25 138 50 150 T100 150 T150 150 T200 150 V200 H0Z" fill="#2f8fd6" opacity=".85"/><path d="M0 172 Q25 160 50 172 T100 172 T150 172 T200 172 V200 H0Z" fill="#1f78c0"/>`,
  sterne: `<defs><linearGradient id="gN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1f4b"/><stop offset="1" stop-color="#4b3b8f"/></linearGradient></defs><rect width="200" height="200" fill="url(#gN)"/>
    <g fill="#fff6b0"><circle cx="30" cy="40" r="2.5"/><circle cx="170" cy="30" r="2"/><circle cx="150" cy="70" r="3"/><circle cx="52" cy="90" r="2"/><circle cx="180" cy="120" r="2.4"/><circle cx="20" cy="140" r="2.4"/><circle cx="90" cy="24" r="2"/><circle cx="120" cy="50" r="1.6"/></g>
    <path d="M150 28 a22 22 0 1 0 22 30 a17 17 0 1 1 -22 -30z" fill="#ffe27a"/>`,
  stadt: `<defs><linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd8ff"/><stop offset="1" stop-color="#fff1c9"/></linearGradient></defs><rect width="200" height="200" fill="url(#gC)"/>
    <circle cx="164" cy="34" r="14" fill="#ffe066"/>
    ${[[8, 92, 36, 110, '#8aa0c8'], [46, 56, 32, 146, '#6f86b3'], [82, 98, 38, 104, '#9bb0d6'], [122, 70, 34, 132, '#7a92c0'], [158, 94, 36, 108, '#8aa0c8']].map(([x, y, w, h, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>` + [0, 1, 2, 3, 4, 5].map(r => [0, 1].map(k => `<rect x="${x + 6 + k * (w / 2 - 2)}" y="${y + 8 + r * 16}" width="8" height="9" fill="${(r + k + x) % 3 ? '#ffe9a0' : '#5a6b92'}"/>`).join('')).join('')).join('')}
    <rect y="170" width="200" height="30" fill="#5b6272"/><path d="M0 186 H200" stroke="#fff" stroke-width="3" stroke-dasharray="14 10"/>`,
  schule: `<rect width="200" height="200" fill="#FFF1C9"/><rect y="150" width="200" height="50" fill="#C99A62"/><path d="M0 150 H200" stroke="#a97a45" stroke-width="3"/>
    <rect x="12" y="12" width="176" height="72" rx="6" fill="#2f6b4f" stroke="#b07a3c" stroke-width="6"/>
    <g fill="#fff" font-family="'Comic Sans MS','Segoe UI',sans-serif" font-weight="700" font-size="15"><text x="46" y="42" text-anchor="middle">7 · 3 = 21</text><text x="154" y="42" text-anchor="middle">60 : 10 = 6</text><text x="46" y="68" text-anchor="middle">2,50 € + 1 €</text><text x="154" y="68" text-anchor="middle">★ ★ ★</text></g>
    <rect x="12" y="86" width="176" height="5" fill="#b07a3c"/>`,
  unterwasser: `<defs><linearGradient id="gU" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fe9ee"/><stop offset=".6" stop-color="#2d9cc9"/><stop offset="1" stop-color="#1b5fa3"/></linearGradient></defs><rect width="200" height="200" fill="url(#gU)"/>
    <g fill="none" stroke="#fff" stroke-width="2" opacity=".7"><circle cx="36" cy="40" r="6"/><circle cx="48" cy="22" r="4"/><circle cx="160" cy="50" r="7"/><circle cx="174" cy="30" r="4"/><circle cx="150" cy="22" r="3"/></g>
    <g><ellipse cx="38" cy="84" rx="14" ry="8" fill="#ff9a3c"/><path d="M50 84 L62 76 L62 92Z" fill="#ff9a3c"/><circle cx="31" cy="82" r="2" fill="#fff"/></g>
    <g transform="scale(-1 1) translate(-200 0)"><ellipse cx="38" cy="116" rx="12" ry="7" fill="#ffd23c"/><path d="M48 116 L58 109 L58 123Z" fill="#ffd23c"/><circle cx="32" cy="114" r="2" fill="#fff"/></g>
    <path d="M22 200 C10 172 34 164 22 136" stroke="#2fa86a" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M178 200 C192 170 168 162 180 130" stroke="#2fa86a" stroke-width="8" fill="none" stroke-linecap="round"/>
    <ellipse cx="100" cy="206" rx="130" ry="26" fill="#f0d9a0"/><path d="M150 188 l4 -9 4 9 -9 -5.5 10 0z" fill="#ff7a7a"/>`,
  kuchen: `<rect width="200" height="200" fill="#ffe3ee"/>
    <g>${[[34, 150], [100, 168], [166, 148], [40, 52], [164, 56], [100, 36]].map(([x, y], i) => `<g transform="translate(${x} ${y}) scale(.9)"><path d="M-14 4 L-10 24 H10 L14 4Z" fill="${i % 2 ? '#f2b27a' : '#e8a066'}"/><path d="M-16 6 Q-16 -14 0 -14 Q16 -14 16 6Q8 0 0 6Q-8 0 -16 6Z" fill="${i % 2 ? '#fff' : '#ff9ec4'}"/><circle cx="0" cy="-16" r="3.5" fill="#e8454f"/></g>`).join('')}</g>`
};

/* ---------- renderers ---------- */
function mascotSVG(o) {
  o = o || {};
  const s = SKINS[o.skin] || SKINS.fuchs, m = o.mood || 'happy';
  let hat = '', ex = '';
  if (o.hat && HATS[o.hat]) hat = HATS[o.hat](100, s.headTop + 2);
  if (o.extra && EXTRAS[o.extra]) ex = EXTRAS[o.extra](s);
  const bg = o.bg && BGS[o.bg] ? BGS[o.bg] : '';
  const shadow = o.noShadow ? '' : '<ellipse cx="100" cy="184" rx="52" ry="8" fill="rgba(0,0,0,.14)"/>';
  const thinkBubble = m === 'think' ? '<g fill="#fff" stroke="#c9c2dd" stroke-width="2"><circle cx="160" cy="46" r="3.5"/><circle cx="170" cy="32" r="5.5"/><ellipse cx="178" cy="14" rx="14" ry="10"/></g><text x="178" y="19" font-size="14" font-weight="800" text-anchor="middle" fill="#7b5cd6" font-family="sans-serif">?</text>' : '';
  const stars = m === 'cheer' ? '<g fill="#FFC93C"><path d="M30 40 l3 7 7 .6 -5.4 4.6 1.7 7 -6.3 -3.8 -6.3 3.8 1.7 -7 -5.4 -4.6 7 -.6z"/><path d="M168 56 l2.4 5.6 5.6 .5 -4.3 3.7 1.4 5.6 -5.1 -3 -5.1 3 1.4 -5.6 -4.3 -3.7 5.6 -.5z"/></g>' : '';
  return `<svg class="mascot" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${bg}${shadow}<g class="mbody">${s.draw(m)}${ex}${hat}</g>${stars}${thinkBubble}</svg>`;
}

/* ---------- SHOP catalog ----------
   cur: 'c' = Münzen, 's' = Sterne, 'f' = Flammen                         */
const CUR = { c: { ic: '🪙', n: 'Münzen' }, s: { ic: '⭐', n: 'Sterne' }, f: { ic: '🔥', n: 'Flammen' } };
const SHOP = {
  theme: {
    label: 'Farben', icon: '🎨', none: false, items: [
      { id: 'sonne', name: 'Sonnenschein', cur: 'c', price: 0, c: ['#FFF3C4', '#FFB703', '#FB8500'] },
      { id: 'ocean', name: 'Ozean', cur: 'c', price: 40, c: ['#D9F0FF', '#2D9CDB', '#1565C0'] },
      { id: 'wald', name: 'Wald', cur: 'c', price: 60, c: ['#E3F6D8', '#43A047', '#2E7D32'] },
      { id: 'sunset', name: 'Sonnenuntergang', cur: 'c', price: 90, c: ['#FFE0E6', '#F25C7A', '#8E44AD'] },
      { id: 'nacht', name: 'Sternennacht', cur: 'c', price: 120, c: ['#1E2447', '#7C83FF', '#FFD166'] },
      { id: 'regen', name: 'Regenbogen', cur: 'c', price: 160, c: ['#FFD6E8', '#8C7BFF', '#3DD6A6'] },
      { id: 'tuerkis', name: 'Türkis-Blau (Finale Farbe)', cur: 'f', price: 15, c: ['#D8FAF6', '#19B7C2', '#0E8C9A'] }
    ]
  },
  skin: {
    label: 'Figuren', icon: '🦊', none: false, items: [
      { id: 'fuchs', name: 'Fino der Fuchs', cur: 'c', price: 0 },
      { id: 'igel', name: 'Fino der Igel', cur: 'c', price: 80 },
      { id: 'maus', name: 'Fino die Maus', cur: 'c', price: 100 },
      { id: 'katze', name: 'Fino die Katze', cur: 'c', price: 120 },
      { id: 'hase', name: 'Fino der Hase', cur: 'c', price: 150 },
      { id: 'roboter', name: 'Fino der Roboter', cur: 's', price: 25 },
      { id: 'pinguin', name: 'Fino der Pinguin', cur: 's', price: 30 },
      { id: 'drache', name: 'Fino der Drache', cur: 'f', price: 8 },
      { id: 'pferd', name: 'Fino das Pony', cur: 'f', price: 10 }
    ]
  },
  hat: {
    label: 'Hüte', icon: '👑', none: true, items: [
      { id: 'schleife', name: 'Schleife', cur: 's', price: 6 }, { id: 'zylinder', name: 'Zylinder', cur: 's', price: 8 },
      { id: 'zauber', name: 'Zauberhut', cur: 's', price: 12 }, { id: 'krone', name: 'Krone', cur: 's', price: 15 }
    ]
  },
  extra: {
    label: 'Extras', icon: '🕶️', none: true, items: [
      { id: 'brille', name: 'Brille', cur: 's', price: 6 }, { id: 'schal', name: 'Schal', cur: 's', price: 8 }
    ]
  },
  bg: {
    label: 'Hintergründe', icon: '🌄', none: true, items: [
      { id: 'wolken', name: 'Wolken', cur: 'c', price: 40 }, { id: 'wiese', name: 'Blumenwiese', cur: 'c', price: 60 },
      { id: 'meer', name: 'Strand', cur: 'c', price: 80 }, { id: 'stadt', name: 'Stadt', cur: 'c', price: 90 },
      { id: 'schule', name: 'Schule', cur: 'c', price: 90 }, { id: 'kuchen', name: 'Törtchen', cur: 'c', price: 120 },
      { id: 'unterwasser', name: 'Unterwasser', cur: 's', price: 20 }, { id: 'sterne', name: 'Sternenhimmel', cur: 's', price: 25 }
    ]
  },
  frame: {
    label: 'Rahmen', icon: '🖼️', none: true, items: [
      { id: 'gold', name: 'Goldrahmen', cur: 'f', price: 3 }, { id: 'regen', name: 'Regenbogen', cur: 'f', price: 6 }, { id: 'sterne', name: 'Sternenrahmen', cur: 'f', price: 10 }
    ]
  }
};
