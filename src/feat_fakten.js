/* =====================================================================
   LUSTIGE FAKTEN: kleine Staun-Häppchen zum Durchblättern. Keine Belohnung, kein Druck, keine Punkte.
   Nur Aussagen, die sicher stimmen. Neue Fakten: einfach unten in FACTS eintragen { c: Kategorie, t: Text }.
   Kategorien (Bild): Tiere · Natur · Weltraum · Körper · Zahlen · Welt
   ===================================================================== */
const FACT_ART = { Tiere: 'paw', Natur: 'natur', Weltraum: 'planet', 'Körper': 'herz', Zahlen: 'zahlen', Welt: 'europa' };
const FACTS = [
  { c: 'Tiere', t: 'Ein Oktopus hat drei Herzen und blaues Blut.' },
  { c: 'Tiere', t: 'Giraffen haben genau so viele Halswirbel wie du: sieben.' },
  { c: 'Tiere', t: 'Schmetterlinge schmecken mit den Füßen.' },
  { c: 'Tiere', t: 'Kolibris können sogar rückwärts fliegen.' },
  { c: 'Tiere', t: 'Eine Schnecke hat viele Tausend winzige Zähne.' },
  { c: 'Tiere', t: 'Jedes Zebra hat sein eigenes Streifenmuster, ganz ähnlich wie ein Fingerabdruck.' },
  { c: 'Tiere', t: 'Spinnen sind keine Insekten: Insekten haben sechs Beine, Spinnen haben acht.' },
  { c: 'Tiere', t: 'Honigbienen erzählen sich mit einem Tanz, wo es Blüten gibt.' },
  { c: 'Tiere', t: 'Der Blauwal ist das größte Tier, das heute auf der Erde lebt.' },
  { c: 'Tiere', t: 'Bei den Kaiserpinguinen balancieren die Väter das Ei auf ihren Füßen und wärmen es dort.' },
  { c: 'Natur', t: 'Haie gibt es schon länger als Bäume.' },
  { c: 'Natur', t: 'Die Luft in einem Blitz wird heißer als die Oberfläche der Sonne.' },
  { c: 'Natur', t: 'Eis schwimmt auf dem Wasser, weil sich Wasser beim Gefrieren ausdehnt.' },
  { c: 'Natur', t: 'Bananen sind botanisch gesehen Beeren. Erdbeeren dagegen nicht.' },
  { c: 'Natur', t: 'Im Wasser breitet sich Schall viel schneller aus als in der Luft.' },
  { c: 'Weltraum', t: 'Das Licht der Sonne braucht etwa 8 Minuten bis zur Erde.' },
  { c: 'Weltraum', t: 'Der Mond entfernt sich jedes Jahr ein paar Zentimeter von der Erde.' },
  { c: 'Weltraum', t: 'Auf der Venus dauert ein Tag länger als ein Jahr.' },
  { c: 'Weltraum', t: 'Die Erde braucht für eine Runde um die Sonne gut 365 Tage. Darum gibt es alle vier Jahre einen Schalttag.' },
  { c: 'Körper', t: 'Erwachsene haben 206 Knochen. Babys werden mit viel mehr Knochen geboren, die später zusammenwachsen.' },
  { c: 'Körper', t: 'Dein Herz schlägt an einem Tag ungefähr 100 000 Mal.' },
  { c: 'Zahlen', t: 'Ein Tag hat 86 400 Sekunden.' },
  { c: 'Zahlen', t: 'Eine Million Sekunden sind ungefähr 11 ½ Tage.' },
  { c: 'Zahlen', t: 'Die Zahl 2 ist die einzige gerade Primzahl.' },
  { c: 'Zahlen', t: '1 + 2 + 3 + … + 100 geht blitzschnell: 50 Paare mit der Summe 101 ergeben 5050.' },
  { c: 'Zahlen', t: 'Eine Zahl ist durch 3 teilbar, wenn ihre Quersumme durch 3 teilbar ist.' },
  { c: 'Welt', t: 'Der Pazifik ist der größte Ozean der Erde.' },
  { c: 'Welt', t: 'Der Eiffelturm wird im Sommer ein paar Zentimeter höher, weil sich das Eisen in der Wärme ausdehnt.' },
  { c: 'Welt', t: 'Der Mount Everest ist der höchste Berg der Erde: knapp 8 850 Meter über dem Meer.' }
];
Object.assign(DZ_ART, {
  paw: '<ellipse cx="32" cy="35" rx="13" ry="10" fill="#e9d9da"/><ellipse cx="17" cy="23" rx="5" ry="6.5" fill="#e9d9da" transform="rotate(-18 17 23)"/><ellipse cx="27" cy="14" rx="5" ry="7" fill="#e9d9da" transform="rotate(-6 27 14)"/><ellipse cx="38" cy="14" rx="5" ry="7" fill="#e9d9da" transform="rotate(6 38 14)"/><ellipse cx="48" cy="23" rx="5" ry="6.5" fill="#e9d9da" transform="rotate(18 48 23)"/><path d="M25 36q7 6 14 0" fill="none" stroke="#9c6668" stroke-width="2.4" stroke-linecap="round"/>',
  natur: '<circle cx="46" cy="13" r="7" fill="#f0dfbd"/><path d="M4 44q14-14 28-2t28-2v12H4Z" fill="#bed1c6"/><path d="M20 44V28" stroke="#a88c75" stroke-width="4" stroke-linecap="round"/><path d="M20 10 31 30H9Z" fill="#8aa58e"/><path d="M42 44V32" stroke="#a88c75" stroke-width="3" stroke-linecap="round"/><circle cx="42" cy="26" r="8" fill="#9db8a4"/>',
  planet: '<circle cx="32" cy="26" r="14" fill="#e7edeb" stroke="#52676c" stroke-width="2.2"/><path d="M22 20q10 6 20 0M20 30q12 6 24 0" fill="none" stroke="#bed1c6" stroke-width="3"/><ellipse cx="32" cy="26" rx="26" ry="7" fill="none" stroke="#9c6668" stroke-width="2.6" transform="rotate(-18 32 26)"/><circle cx="53" cy="10" r="2.4" fill="#d5ad72"/><circle cx="9" cy="42" r="1.8" fill="#d5ad72"/>',
  herz: '<path d="M32 46C14 34 10 24 15 16c5-7 13-4 17 2 4-6 12-9 17-2 5 8 1 18-17 30Z" fill="#e9d9da" stroke="#9c6668" stroke-width="2.4" stroke-linejoin="round"/><path d="M16 27h9l3-6 5 11 3-5h9" fill="none" stroke="#8e5962" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  zahlen: '<rect x="6" y="14" width="16" height="22" rx="5" fill="#bed1c6"/><rect x="24" y="8" width="16" height="22" rx="5" fill="#e9d9da"/><rect x="42" y="18" width="16" height="22" rx="5" fill="#f1e4b6"/><text x="14" y="31" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="15" font-weight="800" fill="#52676c">1</text><text x="32" y="25" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="15" font-weight="800" fill="#8e5962">2</text><text x="50" y="35" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="15" font-weight="800" fill="#52676c">3</text>'
});
const factsSeen = () => Object.keys((S.facts && S.facts.seen) || {}).length;
function factsSub() { const n = factsSeen(); return n ? `${Math.min(n, FACTS.length)} von ${FACTS.length}` : `${FACTS.length} Fakten`; }
function factMark() { const f = S.facts || (S.facts = { i: 0, seen: {} }); f.i = ((f.i || 0) % FACTS.length + FACTS.length) % FACTS.length; f.seen[f.i] = 1; save(); }

VIEWS.fakten = () => {
  const f = S.facts, i = ((f.i || 0) % FACTS.length + FACTS.length) % FACTS.length, it = FACTS[i];
  return topBar('Lustige Fakten', 'rewards') + `<section class="dz-panel dz-fact" aria-live="polite"><div class="dz-fact-art">${dzArt(FACT_ART[it.c] || 'fakten')}</div><h2>${esc(it.c)}</h2><p class="dz-fact-t">${esc(it.t)}</p>
    <p class="small mute" style="margin-top:14px">Fakt ${i + 1} von ${FACTS.length}</p>
    <div class="row wrap" style="justify-content:center;margin-top:8px"><button class="btn sec big" data-act="faktStep" data-arg="-1">${ico('back', 20)} Vorheriger</button><button class="btn big" data-act="faktStep" data-arg="1">Nächster Fakt</button></div></section>`;
};
registerFeature({
  id: 'fakten', title: 'Lustige Fakten', icon: 'sparkle', tint: 'butter', group: 'world', order: 5, view: 'fakten', sub: factsSub,
  acts: {
    fakten: () => { factMark(); go('fakten'); },
    faktStep: d => { const f = S.facts; f.i = (((f.i || 0) + (+d)) % FACTS.length + FACTS.length) % FACTS.length; factMark(); sfx('tap'); render(); }
  }
});
