/* =====================================================================
   WELT: Inhalte für „Meine Weltreise“ (nur Daten + kleine SVG-Bausteine, keine Logik, kein Zustand)
   ---------------------------------------------------------------------
   Ein Land = ein Eintrag in WP (siehe unten). Neues Land: Eintrag ergänzen, Flagge in FLAGS (geo_data.js) ergänzen – fertig.
   Regeln für Inhalte: nur Dinge, die 100 % sicher stimmen · Beispiele als Beispiele formulieren („viele Familien …“) ·
   kein Pink · Sprachwörter vor dem Veröffentlichen von Muttersprachlern prüfen lassen.
   Stationen (feste Reihenfolge der Route, aber jederzeit frei wählbar): arrival · places · life · language · food · quiz
   ===================================================================== */
const WSTAT = [['arrival', 'Ankunft'], ['places', 'Orte'], ['life', 'Alltag'], ['language', 'Sprache'], ['food', 'Essen'], ['quiz', 'Rätsel']];
const W_STAMP_AT = 4;                                       // so viele Stationen bis zum Pass-Stempel (von 6)
const W_QUIZ_OK = 3;                                        // so viele von 4 Rätselfragen für das letzte Souvenir

/* Flaggen: gleiche kleine SVG-Technik wie in geo_data.js (fR = Rechteck, fH = waagerechte Streifen) */
FLAGS.jpn = () => fR(0, 0, 30, 20, '#fff') + '<circle cx="15" cy="10" r="6" fill="#BC002D"/>';
FLAGS.ind = () => fH(['#FF9933', '#fff', '#138808']) + '<circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" stroke-width=".6"/><path d="M15 7.4V12.6M12.4 10H17.6M13.2 8.2L16.8 11.8M16.8 8.2L13.2 11.8" stroke="#000080" stroke-width=".35"/>';
const wFlag = (id, cls) => `<svg class="geo-flag w-flag ${cls || ''}" viewBox="0 0 30 20" role="img" aria-label="Flagge: ${esc((WP[id] || {}).name || id)}" preserveAspectRatio="xMidYMid slice">${FLAGS[id] ? FLAGS[id]() : fR(0, 0, 30, 20, '#C9C6D6')}</svg>`;

/* ---------- kleine Linien-Symbole (32×32) für Stationen und Kurzinfos ---------- */
const W_ST_ICO = {
  arrival: '<path d="M5 24h22M8 21l5-5 4 3 7-8"/><circle cx="24" cy="11" r="2"/>', places: '<path d="M5 26h22M7 26V13l9-7 9 7v13M12 26v-7h8v7"/>',
  life: '<path d="M16 27C8 22 5 16 8 11c3-5 8-2 8 1 0-3 5-6 8-1 3 5 0 11-8 16Z"/>', language: '<path d="M6 8h13v10H12l-5 4v-4H6ZM20 12h6v9h-3l-4 3v-3"/>',
  food: '<path d="M6 17h20c0 6-4 10-10 10S6 23 6 17ZM9 13c0-3 2-5 4-7M16 13c0-3 2-5 4-7M22 13c0-2 1-3 2-5"/>',
  quiz: '<circle cx="16" cy="16" r="11"/><path d="M12.5 13a3.5 3.5 0 1 1 5 3c-1.2.8-1.5 1.5-1.5 3M16 23h.01"/>'
};
const W_INFO = {
  capital: '<circle cx="16" cy="9" r="4"/><path d="M6 27h20M9 24V14h14v10M13 24v-6h6v6"/>', money: '<circle cx="16" cy="16" r="11"/><path d="M20 11c-5-3-9 0-9 5s4 8 9 5M8 15h10M8 19h10"/>',
  island: '<path d="M5 23c5-5 8-3 11-8 3 5 7 3 11 8M7 26h18M16 15V7M12 10l4-3 4 3"/>', time: '<circle cx="16" cy="16" r="11"/><path d="M16 9v8l5 3"/>',
  people: '<circle cx="12" cy="11" r="4"/><circle cx="22" cy="12" r="3"/><path d="M5 26c0-7 14-7 14 0M18 26c0-5 9-5 9 0"/>', train: '<rect x="7" y="5" width="18" height="21" rx="5"/><path d="M10 15h12M11 9h10M11 26l-3 3M21 26l3 3"/>',
  language: '<path d="M5 7h14v11H12l-6 5v-5H5ZM20 12h7v9h-4l-4 3"/>', weather: '<circle cx="11" cy="11" r="5"/><path d="M16 23h10c0-7-9-8-11-3-7-2-9 7-3 7h12"/>',
  region: '<path d="M5 7l8-3 7 3 7-3v21l-7 3-7-3-8 3Z"/><path d="M13 4v21M20 7v21"/>', map: '<path d="M5 7l8-3 7 3 7-3v21l-7 3-7-3-8 3Z"/>',
  bow: '<circle cx="15" cy="7" r="3"/><path d="M15 10v9l-6 8M15 14l9 5M15 19l7 8"/>', flower: '<circle cx="16" cy="16" r="3"/><path d="M16 13c-7-8-10 2-3 3-8 5 1 11 3 3 2 8 11 2 3-3 8-1 4-11-3-3Z"/>',
  paper: '<path d="M6 24 16 5l10 19-10-6Z"/><path d="m6 24 10-6 10 6M16 5v13"/>', school: '<path d="M4 13 16 5l12 8-12 7Z"/><path d="M8 17v8h16v-8M16 20v7"/>',
  home: '<path d="m5 15 11-9 11 9v12H5Z"/><path d="M13 27v-7h6v7"/>', sport: '<circle cx="16" cy="16" r="11"/><path d="m16 5 4 7-4 5-7-2 1-7M16 17l5 4-2 5M9 15l-4 5"/>',
  light: '<path d="M9 23h14M11 23c0-7 2-11 5-16 3 5 5 9 5 16M8 27h16"/>', art: '<path d="M7 25c12 3 20-4 18-12-2-8-15-9-18-2-2 5 5 5 4 9-1 3-6 1-6 3 0 1 1 2 2 2Z"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="10" r="1"/><circle cx="22" cy="15" r="1"/>',
  bike: '<circle cx="8" cy="23" r="5"/><circle cx="24" cy="23" r="5"/><path d="m8 23 6-10 5 10H8l4-7h8M14 13h5"/>', music: '<path d="M12 24V8l13-3v16M12 12l13-3"/><circle cx="8" cy="25" r="4"/><circle cx="21" cy="22" r="4"/>',
  festival: '<path d="M6 27V8h20v19M6 12h20M11 8V5M21 8V5M11 17h4M18 17h4M11 22h4M18 22h4"/>', default: '<circle cx="16" cy="16" r="10"/><path d="M16 10v7M16 22h.01"/>'
};
const wInfoIco = t => `<svg class="w-info-ico" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${W_INFO[t] || W_INFO.default}</svg>`;
const wStIco = (id, s) => `<svg viewBox="0 0 32 32" width="${s || 26}" height="${s || 26}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${W_ST_ICO[id]}</svg>`;

/* ---------- Bildchen für Orte und Essen (140×95), ohne Pink ---------- */
const W_ART = {
  fuji: '<path d="M12 78 70 12l58 66Z" fill="#b7cbcc"/><path d="m70 12-15 18 10-3 7 9 8-8 10 5Z" fill="#faf8f4"/><path d="M5 79q35-23 70 0t60 0" fill="#c4d5cb"/>',
  castle: '<path d="M26 72h88M34 72V43h72v29M24 43h92L99 29H41ZM39 29h62L88 17H52ZM49 17h42L80 8H60Z" fill="#f3f0eb" stroke="#697a78" stroke-width="3"/><path d="M58 72V55h24v17M44 51h12M86 51h12" stroke="#697a78" stroke-width="3"/>',
  torii: '<path d="M18 21h104M29 33h82M38 32v50M102 32v50" stroke="#a2573f" stroke-width="8" stroke-linecap="round"/>',
  city: '<path d="M12 78h116M20 78V34h25v44M49 78V20h30v58M83 78V42h30v36M28 45h9M28 56h9M58 33h12M58 45h12M92 53h12" fill="none" stroke="#74898c" stroke-width="4"/>',
  mountain: '<path d="M5 80 48 20l27 36 19-25 41 49Z" fill="#bdc9c4"/><path d="m48 20-11 16 10-3 6 8 7-7 8 8Z" fill="#faf8f4"/>',
  taj: '<path d="M18 79h104M34 79V39h72v40M48 39q0-28 22-28t22 28M63 79V57h14v22M27 39h86" fill="#f6f1e8" stroke="#9b806d" stroke-width="3"/>',
  palm: '<path d="M69 83q-7-35 1-56M69 31Q45 9 38 29M69 31q22-24 35-5M69 31Q56 4 68 5M69 31Q87 7 91 12" fill="none" stroke="#66826a" stroke-width="5"/><path d="M8 82q35-19 63 0t63 0" fill="#d9c99f"/>',
  sea: '<path d="M5 52q18-12 36 0t36 0 36 0M5 67q18-12 36 0t36 0 36 0" fill="none" stroke="#7da0aa" stroke-width="5"/><circle cx="102" cy="24" r="13" fill="#ead9a3"/>',
  forest: '<path d="m28 76 20-34 20 34ZM59 76l24-47 24 47ZM93 76l17-31 17 31Z" fill="#76927b"/><path d="M48 76v10M83 76v10M110 76v10" stroke="#6e6255" stroke-width="5"/>',
  bread: '<ellipse cx="70" cy="50" rx="48" ry="28" fill="#d5ad72"/><path d="M43 40q8 8 16 0M63 35q8 8 16 0M83 40q8 8 16 0" fill="none" stroke="#f2d49c" stroke-width="4"/>',
  rice: '<path d="M25 66q45 30 90 0Z" fill="#d8b7a1"/><path d="M37 58q33-43 66 0" fill="#f6f1e8"/><path d="M56 39q14-13 28 0" stroke="#435b48" stroke-width="6"/>',
  soup: '<path d="M22 51h96q-7 35-48 35T22 51Z" fill="#b98064"/><path d="M42 45q0-18 12-28M69 45q0-18 12-28M93 45q0-15 9-24" fill="none" stroke="#9ca99e" stroke-width="4"/>',
  box: '<rect x="23" y="22" width="94" height="62" rx="10" fill="#a5654a"/><path d="M70 22v62M23 53h94" stroke="#f0d8c5" stroke-width="4"/><circle cx="47" cy="38" r="10" fill="#f5eee2"/><circle cx="92" cy="38" r="10" fill="#d8a376"/>',
  noodle: '<path d="M21 53h98q-8 34-49 34T21 53Z" fill="#c38a68"/><path d="M43 46q5-22 11 0M58 46q5-22 11 0M73 46q5-22 11 0M88 46q5-22 11 0" fill="none" stroke="#e5c683" stroke-width="4"/>',
  pretzel: '<path d="M70 62C38 95 20 50 40 37c18-11 30 19 30 31 0-12 12-42 30-31 20 13 2 58-30 25ZM43 74h54" fill="none" stroke="#b58550" stroke-width="9" stroke-linecap="round"/>',
  potato: '<ellipse cx="70" cy="51" rx="46" ry="29" fill="#c5a56f"/><circle cx="50" cy="46" r="3" fill="#9b805a"/><circle cx="78" cy="38" r="3" fill="#9b805a"/><circle cx="91" cy="58" r="3" fill="#9b805a"/>',
  apple: '<circle cx="70" cy="53" r="31" fill="#b5583f"/><path d="M70 24q0-14 11-18M72 19q13-8 22 1-13 8-22-1Z" fill="#718b70"/>',
  mango: '<path d="M42 65q0-45 34-47 33-2 26 34-8 40-40 37-20-2-20-24Z" fill="#dfb05e"/><path d="M75 19q9-14 23-11" stroke="#718b70" stroke-width="5" fill="none"/>',
  bowl: '<path d="M20 49h100q-9 36-50 36T20 49Z" fill="#bd8a68"/><circle cx="52" cy="47" r="8" fill="#d6b379"/><circle cx="76" cy="43" r="8" fill="#c69f69"/><circle cx="97" cy="48" r="8" fill="#dac28e"/>',
  default: '<circle cx="70" cy="48" r="34" fill="#c7d3cf"/>'
};
const wArt = t => `<svg class="w-art" viewBox="0 0 140 95" aria-hidden="true">${W_ART[t] || W_ART.default}</svg>`;

/* ---------- Souvenirs: kleine runde Sticker (64×64) ---------- */
const W_SV = {
  card: c => `<rect x="12" y="18" width="40" height="28" rx="3" fill="#fbfaf7" stroke="#6b7476" stroke-width="2"/><path d="M16 42l10-12 7 8 5-5 10 9z" fill="${c[1]}"/><circle cx="43" cy="26" r="3.5" fill="${c[2]}"/>`,
  torii: () => '<path d="M13 20h38M17 27h30M21 27v22M43 27v22" stroke="#a2573f" stroke-width="4.5" stroke-linecap="round" fill="none"/>',
  crane: () => '<path d="M10 38l22-8 22 8-22 4zM32 30l-6-14 10 12zM54 38l-8-10" fill="#fbfaf7" stroke="#6b7476" stroke-width="2" stroke-linejoin="round"/>',
  bubble: () => '<path d="M12 16h40v24H30l-10 8v-8h-8z" fill="#fbfaf7" stroke="#6b7476" stroke-width="2" stroke-linejoin="round"/><path d="M20 25h24M20 31h15" stroke="#6b7476" stroke-width="2.4" stroke-linecap="round"/>',
  chop: () => '<ellipse cx="32" cy="46" rx="16" ry="6" fill="#fbfaf7" stroke="#6b7476" stroke-width="2"/><path d="M18 14l24 28M26 12l22 30" stroke="#a2573f" stroke-width="3.6" stroke-linecap="round"/>',
  fan: () => '<path d="M32 50L10 26q22-18 44 0z" fill="#fbfaf7" stroke="#6b7476" stroke-width="2" stroke-linejoin="round"/><path d="M32 50L20 22M32 50V18M32 50L44 22" stroke="#a2573f" stroke-width="1.8"/><circle cx="32" cy="50" r="3" fill="#6b7476"/>',
  dome: () => '<path d="M14 48V34h36v14M20 34q0-18 12-18t12 18M32 12v4M10 48h44" fill="#fbfaf7" stroke="#6b7476" stroke-width="2.2" stroke-linejoin="round"/>',
  rangoli: () => '<g fill="#d9a441"><circle cx="32" cy="17" r="5"/><circle cx="32" cy="47" r="5"/><circle cx="17" cy="32" r="5"/><circle cx="47" cy="32" r="5"/></g><g fill="#526c65"><circle cx="22" cy="22" r="4"/><circle cx="42" cy="22" r="4"/><circle cx="22" cy="42" r="4"/><circle cx="42" cy="42" r="4"/></g><circle cx="32" cy="32" r="5" fill="#a2573f"/>',
  mango: () => '<path d="M17 38q0-20 16-22 14-1 11 15-4 19-20 17-7-1-7-10z" fill="#dfb05e"/><path d="M34 17q4-7 11-5" stroke="#718b70" stroke-width="3" fill="none" stroke-linecap="round"/>',
  lamp: () => '<path d="M12 38h40q-4 14-20 14T12 38z" fill="#b8693d"/><path d="M32 36q-7-8 0-19 7 11 0 19z" fill="#f2b84b"/>',
  sign: () => '<path d="M30 12h4v40h-4z" fill="#8a6a4a"/><path d="M34 16h16l4 5-4 5H34zM30 30H14l-4 5 4 5h16z" fill="#fbfaf7" stroke="#6b7476" stroke-width="2" stroke-linejoin="round"/>',
  bike: () => '<g fill="none" stroke="#526c65" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="42" r="9"/><circle cx="46" cy="42" r="9"/><path d="M18 42l9-16h14l5 16M27 26l8 16H18M24 21h8"/></g>',
  pretzel: () => '<path d="M32 44C20 56 12 38 20 30c7-6 12 8 12 14 0-6 5-20 12-14 8 8 0 26-12 14zM22 48h20" fill="none" stroke="#b58550" stroke-width="5" stroke-linecap="round"/>',
  medal: () => '<path d="M24 10l8 14 8-14" fill="none" stroke="#526c65" stroke-width="4"/><circle cx="32" cy="36" r="14" fill="#e6c462" stroke="#a98a2f" stroke-width="2.5"/><path d="M32 29l2.2 4.6 5 .6-3.7 3.4 1 5-4.5-2.5-4.5 2.5 1-5-3.7-3.4 5-.6z" fill="#fbfaf7"/>'
};
const wSouvSVG = (s, big) => `<svg class="w-souv${big ? ' big' : ''}" viewBox="0 0 64 64" role="img" aria-label="Souvenir: ${esc(s.n)}"><circle cx="32" cy="32" r="30" fill="${s.bg}" stroke="rgba(0,0,0,.14)" stroke-width="1.5"/>${W_SV[s.k](s.c || [])}</svg>`;

/* ---------- Begleit-Kinder (neutrale Namen; ein Kind von vielen) ---------- */
const wGuide = (label, skin, hair, shirt, extra) => `<svg class="w-guide-pic" viewBox="0 0 90 105" role="img" aria-label="${label}"><ellipse cx="45" cy="91" rx="31" ry="10" fill="#d9d4cf"/><path d="M23 55q22-16 44 0v40H23Z" fill="${shirt}"/><circle cx="45" cy="34" r="23" fill="${skin}"/><path d="M21 34Q22 6 45 7q25 0 24 31c-9-13-17-18-29-16-7 9-13 12-19 12Z" fill="${hair}"/><circle cx="36" cy="38" r="2.200" fill="#2f2b2d"/><circle cx="54" cy="38" r="2.200" fill="#2f2b2d"/><path d="M39 48q6 5 12 0" fill="none" stroke="#7a4a40" stroke-width="2" stroke-linecap="round"/>${extra || ''}</svg>`;

/* ---------- Länder (WP) ----------
   cost = Einmal-Preis in freien Sternen (0 = von Anfang an offen). scene = Hintergrundfarbe, g1/g2 = weiche Lichtflecken (nie Pink).
   st.<station>: title, lead, guide (Satz des Kindes), items [[icon,Name,Text]], rich [[Titel,Text]], cards [[Bild,Name,Text]], words [[Schrift,Aussprache,Bedeutung,Lesehilfe]]
   quiz: 4 Fragen {q, ok, bad:[…2 falsche…]} · souv: je Station ein Souvenir. */
const WP = {
  deu: {
    id: 'deu', name: 'Deutschland', cont: 'Europa', cost: 0, sub: 'Nordsee, Schwarzwald und Alpen', speech: 'de-DE', scene: '#e0e7df', g1: '#d8e3e4', g2: '#e8dec9',
    guide: { name: 'Robin', svg: wGuide('Robin', '#efc3a2', '#b17b4d', '#5f7b78') },
    hero: '<svg class="w-scene-svg" viewBox="0 0 320 240" role="img" aria-label="Haus unter Hügeln"><circle cx="252" cy="53" r="28" fill="#eadba9"/><path d="M0 196q80-44 160 0t160 0v44H0Z" fill="#bad0b8"/><path d="M72 202h178M100 202v-82h120v82M85 122h150l-76-61Z" fill="#e4ddd0" stroke="#7d8b86" stroke-width="7" stroke-linejoin="round"/><path d="M145 202v-45h30v45M116 146h20v22h-20M184 146h20v22h-20" fill="#aebfba"/><path d="M31 199q19-55 40 0M250 199q18-52 39 0" fill="#76947a"/></svg>',
    welcome: 'Ein Land mit Küste, Wald, Städten und Bergen.',
    story: 'Hallo, ich bin Robin und wohne in Hamburg. Du kennst Deutschland schon, aber es hat viele Seiten. Schau mit mir, was du hier noch entdecken kannst. Andere Kinder erzählen dir vielleicht etwas ganz anderes.',
    st: {
      arrival: { title: 'Ankunft in Deutschland', lead: 'Deutschland liegt in Mitteleuropa und besteht aus 16 Bundesländern.', guide: 'Auch ein vertrautes Land hat viele Unterschiede zwischen Regionen.',
        items: [['capital', 'Hauptstadt', 'Berlin'], ['money', 'Währung', 'Euro'], ['map', 'Nachbarn', 'Neun Nachbarländer'], ['region', 'Bundesländer', '16 Bundesländer'], ['people', 'Sprachen', 'Deutsch und viele weitere Familiensprachen'], ['train', 'Unterwegs', 'Zu Fuß, Rad, Bahn, Bus und Auto']],
        rich: [['Föderal', 'Bundesländer haben eigene Parlamente und Regierungen.'], ['Europa', 'Deutschland ist Mitglied der Europäischen Union.'], ['Vielfalt', 'Stadt- und Landleben können sehr verschieden sein.']] },
      places: { title: 'Landschaften auf deiner Route', lead: 'Küsten, Wälder, Städte und Alpen liegen im selben Land.', guide: 'Von der Nordsee bis zu den Alpen verändert sich die Landschaft stark.',
        cards: [['sea', 'Nordsee', 'Küste, Inseln und das Wattenmeer.'], ['forest', 'Schwarzwald', 'Eine bewaldete Region im Südwesten.'], ['mountain', 'Alpen', 'Deutschlands höchster Berg, die Zugspitze, liegt im Süden.'], ['city', 'Berlin', 'Eine große Stadt mit vielen verschiedenen Vierteln.']],
        rich: [['Naturschutz', 'Das Wattenmeer ist ein geschütztes Naturgebiet.'], ['Entfernung', 'Nord und Süd liegen viele Zugstunden auseinander.']] },
      life: { title: 'Regionen und Lebenswelten', lead: 'Alltag und Bräuche unterscheiden sich zwischen Orten und Familien.', guide: 'Fußball ist bekannt, aber nicht das Hobby aller Kinder.',
        items: [['bike', 'Unterwegs', 'Viele Wege werden mit dem Rad oder zu Fuß zurückgelegt.'], ['music', 'Musik', 'Von Klassik bis Hip-Hop gibt es viele Stile.'], ['sport', 'Sport', 'Menschen mögen sehr verschiedene Sportarten.'], ['school', 'Schule', 'Schulsysteme unterscheiden sich nach Bundesland.'], ['home', 'Wohnen', 'Großstadt, Dorf und Vorort fühlen sich verschieden an.'], ['festival', 'Feste', 'Regionale und familiäre Feste sind vielfältig.']] },
      language: { title: 'Deutsch und seine Varianten', lead: 'Deutsch klingt je nach Region und Familie unterschiedlich.', guide: 'Viele Menschen in Deutschland sprechen zuhause mehrere Sprachen.',
        words: [['Hallo', '', 'Grüßen, überall üblich', 'Hallo'], ['Guten Morgen', '', 'Gruß am Morgen', 'Guten Morgen'], ['Moin', '', 'Gruß, vor allem im Norden', 'Moin'], ['Grüß Gott', '', 'Gruß, vor allem im Süden', 'Grüß Gott'], ['Servus', '', 'Gruß, vor allem im Süden', 'Servus'], ['Danke', '', 'Um sich zu bedanken', 'Danke'], ['Bitte', '', 'Als Bitte und als Antwort auf „Danke“', 'Bitte'], ['Entschuldigung', '', 'Wenn dir etwas leid tut', 'Entschuldigung'], ['Tschüss', '', 'Zum Verabschieden', 'Tschüss'], ['Auf Wiedersehen', '', 'Höflich verabschieden', 'Auf Wiedersehen']] },
      food: { title: 'Essen ist regional', lead: 'Es gibt kein einzelnes Gericht, das für alle Menschen steht.', guide: 'Familien kochen regional, international und ganz nach ihrem Geschmack.',
        cards: [['pretzel', 'Brezel', 'Ein Laugengebäck, besonders im Süden bekannt.'], ['bread', 'Brot', 'Es gibt sehr viele Brotsorten.'], ['potato', 'Kartoffelgerichte', 'Kartoffeln werden sehr verschieden zubereitet.'], ['apple', 'Obst und Gemüse', 'Sorten und Saison unterscheiden sich regional.']] }
    },
    quiz: [{ q: 'Wie heißt die Hauptstadt von Deutschland?', ok: 'Berlin', bad: ['Hamburg', 'München'] }, { q: 'Wie viele Bundesländer hat Deutschland?', ok: '16', bad: ['12', '20'] },
      { q: 'Wo sagt man vor allem „Moin“?', ok: 'Im Norden', bad: ['Im Süden', 'In den Alpen'] }, { q: 'Wie heißt Deutschlands höchster Berg?', ok: 'Zugspitze', bad: ['Brocken', 'Feldberg'] }],
    souv: {
      arrival: { n: 'Postkarte', k: 'card', bg: '#e0e7df', c: ['', '#76927b', '#eadba9'] }, places: { n: 'Wegweiser', k: 'sign', bg: '#e8dec9' }, life: { n: 'Fahrrad', k: 'bike', bg: '#d8e3e4' },
      language: { n: 'Sprechblase', k: 'bubble', bg: '#e0e7df' }, food: { n: 'Brezel', k: 'pretzel', bg: '#e8dec9' }, quiz: { n: 'Goldmedaille', k: 'medal', bg: '#e9e2c9' } }
  },
  jpn: {
    id: 'jpn', name: 'Japan', cont: 'Asien', cost: 0, sub: 'Fuji, Tokio und Kyoto', speech: 'ja-JP', scene: '#dce8e7', g1: '#e8dcc9', g2: '#d6e3da',
    guide: { name: 'Haru', svg: wGuide('Haru', '#efc7aa', '#3f3638', '#7d6f82') },
    hero: '<svg class="w-scene-svg" viewBox="0 0 320 240" role="img" aria-label="Berg und rotes Tor"><circle cx="248" cy="50" r="27" fill="#f0dfbd"/><path d="M26 206 155 43l139 163Z" fill="#b7cbcc"/><path d="m155 43-34 44 22-8 13 18 16-15 22 8Z" fill="#f7f4ef"/><path d="M0 199q80-54 166 0T340 198v42H0Z" fill="#bed1c6"/><path d="M215 217h65v8h-65zM227 165h9v58h-9zM260 165h9v58h-9zM217 166h60v8h-60zM224 179h46v7h-46z" fill="#a2573f"/></svg>',
    welcome: 'Eine Inselkette im Pazifik mit Bergen, großen Städten und alten Traditionen.',
    story: 'Hallo, ich bin Haru und wohne in Osaka. Heute zeige ich dir ein paar Dinge aus meinem Alltag. Andere Kinder in Japan erzählen dir vielleicht etwas ganz anderes.',
    st: {
      arrival: { title: 'Ankunft in Japan', lead: 'Japan ist ein Inselstaat in Ostasien. Viele Menschen leben in Städten nahe der Küste.', guide: 'Wir starten mit einem schnellen Überblick. Danach kannst du jede Station frei öffnen.',
        items: [['capital', 'Hauptstadt', 'Tokio'], ['money', 'Währung', 'Yen'], ['island', 'Geografie', 'Vier große Hauptinseln und viele kleinere'], ['time', 'Zeit', 'Japan ist Deutschland 7 oder 8 Stunden voraus'], ['people', 'Alltag', 'Stadt und Land können sehr verschieden sein'], ['train', 'Unterwegs', 'Züge verbinden viele Städte sehr zuverlässig']],
        rich: [['Größe', 'Japan erstreckt sich über eine lange Inselkette.'], ['Natur', 'Erdbeben und Vulkane prägen das Land.'], ['Heute', 'Tradition und moderne Technik stehen oft nebeneinander.']] },
      places: { title: 'Orte auf deiner Route', lead: 'Vier Orte zeigen unterschiedliche Seiten Japans.', guide: 'Ein Ort ist nicht nur ein Fotomotiv. Frag immer, welche Geschichte dort erzählt wird.',
        cards: [['fuji', 'Fuji', 'Japans höchster Berg ist ein aktiver Vulkan.'], ['castle', 'Burg Himeji', 'Eine gut erhaltene Burg mit heller Fassade.'], ['torii', 'Fushimi Inari', 'Wege führen durch viele rote Tore.'], ['city', 'Tokio', 'Eine große Stadt mit sehr unterschiedlichen Vierteln.']],
        rich: [['Respektvoll reisen', 'Schreine und Burgen sind wichtige kulturelle Orte.'], ['Genau hinsehen', 'Auch bekannte Orte verändern sich mit Jahreszeit und Wetter.']] },
      life: { title: 'Alltag und Kultur', lead: 'Beispiele helfen beim Verstehen, sind aber keine Regeln für alle.', guide: 'Meine Familie hat eigene Gewohnheiten. Andere Familien machen manches anders.',
        items: [['bow', 'Begrüßung', 'Eine Verbeugung kann Respekt zeigen.'], ['flower', 'Hanami', 'Manche Menschen genießen gemeinsam die Blütenzeit.'], ['paper', 'Origami', 'Papierfalten kann Kunst, Spiel oder Geschenk sein.'], ['school', 'Schule', 'Schulalltag unterscheidet sich je nach Schule und Alter.'], ['home', 'Zuhause', 'Wohnungen und Häuser sehen sehr verschieden aus.'], ['sport', 'Freizeit', 'Sport, Musik, Spiele und Vereine sind beliebt.']] },
      language: { title: 'Japanische Wörter hören', lead: 'Tippe auf den Lautsprecher. Höre zuerst zu und sprich dann langsam nach.', guide: 'Japanisch verwendet Hiragana, Katakana und Kanji. Du musst sie heute nicht lernen.',
        words: [['こんにちは', 'Konnichiwa', 'Hallo', 'Ko-nni-tschi-wa'], ['ありがとう', 'Arigatō', 'Danke', 'A-ri-ga-toh'], ['はい', 'Hai', 'Ja', 'Hai'], ['いいえ', 'Iie', 'Nein', 'I-i-e'], ['おはよう', 'Ohayō', 'Guten Morgen', 'O-ha-joh'], ['すみません', 'Sumimasen', 'Entschuldigung', 'Su-mi-ma-sen'], ['おいしい', 'Oishii', 'Lecker', 'Oi-schii'], ['またね', 'Mata ne', 'Bis bald', 'Ma-ta ne'], ['さようなら', 'Sayōnara', 'Auf Wiedersehen', 'Sa-joh-na-ra'], ['いただきます', 'Itadakimasu', 'Wird vor dem Essen gesagt', 'I-ta-da-ki-mas']] },
      food: { title: 'Essen unterwegs', lead: 'Gerichte unterscheiden sich nach Familie, Region, Jahreszeit und Anlass.', guide: '„Ungewohnt“ ist freundlicher und genauer als „seltsam“.',
        cards: [['rice', 'Onigiri', 'Geformter Reis, oft mit einer Füllung.'], ['soup', 'Miso-Suppe', 'Eine würzige Suppe mit verschiedenen Zutaten.'], ['box', 'Bento', 'Eine Mahlzeit mit mehreren Speisen in einer Box.'], ['noodle', 'Nudeln', 'Ramen, Udon und Soba sind unterschiedliche Nudelarten.']] }
    },
    quiz: [{ q: 'Wie heißt die Hauptstadt von Japan?', ok: 'Tokio', bad: ['Osaka', 'Kyoto'] }, { q: 'Wie heißt Japans höchster Berg?', ok: 'Fuji', bad: ['Zugspitze', 'Mont Blanc'] },
      { q: 'Was bedeutet „Arigatō“?', ok: 'Danke', bad: ['Hallo', 'Tschüss'] }, { q: 'Was ist Origami?', ok: 'Papierfalten', bad: ['Reis kochen', 'Tee trinken'] }],
    souv: {
      arrival: { n: 'Fuji-Postkarte', k: 'card', bg: '#dce8e7', c: ['', '#b7cbcc', '#f0dfbd'] }, places: { n: 'Torii-Anhänger', k: 'torii', bg: '#e8dcc9' }, life: { n: 'Origami-Kranich', k: 'crane', bg: '#d6e3da' },
      language: { n: 'Hallo-Sticker', k: 'bubble', bg: '#dce8e7' }, food: { n: 'Essstäbchen', k: 'chop', bg: '#e8dcc9' }, quiz: { n: 'Goldener Fächer', k: 'fan', bg: '#e9e2c9' } }
  },
  ind: {
    id: 'ind', name: 'Indien', cont: 'Asien', cost: 0, sub: 'Delhi, Himalaya und Kerala', speech: 'hi-IN', scene: '#e9e2d6', g1: '#ead9c4', g2: '#dce6d8',
    guide: { name: 'Kiran', svg: wGuide('Kiran', '#b97852', '#363033', '#a66d4b') },
    hero: '<svg class="w-scene-svg" viewBox="0 0 320 240" role="img" aria-label="Weißes Bauwerk mit Kuppel"><circle cx="250" cy="54" r="28" fill="#efd69d"/><path d="M0 195q80-42 160 0t160 0v45H0Z" fill="#d0c8a9"/><path d="M92 201h138M112 201v-61h98v61M126 140q0-47 35-47t35 47M145 94q16-34 32 0M104 141h114" fill="none" stroke="#ad8065" stroke-width="9" stroke-linecap="round"/><circle cx="161" cy="87" r="6" fill="#ad8065"/><path d="M38 198q22-56 47 0M240 197q20-48 43 0" fill="#98ae88"/></svg>',
    welcome: 'Ein sehr großes Land in Südasien mit vielen Sprachen, Regionen und Lebensweisen.',
    story: 'Hallo, ich bin Kiran und komme aus Kochi in Kerala. Indien ist riesig, deshalb kann ich dir nur ein paar Beispiele zeigen. In anderen Regionen ist vieles anders.',
    st: {
      arrival: { title: 'Ankunft in Indien', lead: 'Indien ist ein sehr großes und vielfältiges Land in Südasien.', guide: 'Ein Beispiel aus einer Region gilt nicht automatisch für das ganze Land.',
        items: [['capital', 'Hauptstadt', 'Neu-Delhi'], ['money', 'Währung', 'Indische Rupie'], ['language', 'Sprachen', '22 Sprachen stehen in der Verfassung'], ['people', 'Bevölkerung', 'Mehr als eine Milliarde Menschen'], ['weather', 'Klima', 'Von Hochgebirge bis tropische Küste'], ['train', 'Unterwegs', 'Bahn, Bus, Auto, Fahrrad und mehr']],
        rich: [['Vielfalt', 'Religionen, Sprachen und Lebensweisen sind sehr verschieden.'], ['Entfernung', 'Delhi und Kerala liegen weit voneinander entfernt.'], ['Heute', 'Große Städte und ländliche Regionen entwickeln sich unterschiedlich.']] },
      places: { title: 'Orte auf deiner Route', lead: 'Landschaften und Städte verändern sich über große Entfernungen.', guide: 'Wir besuchen nur wenige Beispiele aus einem sehr großen Land.',
        cards: [['mountain', 'Himalaya', 'Im Norden liegen sehr hohe Berge.'], ['taj', 'Taj Mahal', 'Ein Bauwerk aus weißem Marmor in Agra.'], ['palm', 'Kerala', 'Eine südliche Region mit Küsten und viel Grün.'], ['city', 'Delhi', 'Eine große Metropolregion mit langer Geschichte.']],
        rich: [['Reisezeit', 'Zwischen manchen Orten liegen viele Stunden Reisezeit.'], ['Geschichte', 'Bauwerke erzählen von verschiedenen Epochen.']] },
      life: { title: 'Alltag und Feste', lead: 'Feste und Gewohnheiten unterscheiden sich zwischen Familien und Regionen.', guide: 'Nicht jede Familie feiert dieselben Feste auf dieselbe Weise.',
        items: [['light', 'Diwali', 'Viele Familien feiern mit Lichtern.'], ['art', 'Rangoli', 'Farbige Muster schmücken manchmal Eingänge.'], ['sport', 'Cricket', 'Ein beliebter Sport in vielen Regionen.'], ['school', 'Schule', 'Sprachen und Schulwege können sehr verschieden sein.'], ['music', 'Musik', 'Klassische, regionale und moderne Musikstile.'], ['home', 'Familie', 'Familienformen und Tagesabläufe sind vielfältig.']] },
      language: { title: 'Wörter auf Hindi', lead: 'Hindi ist eine wichtige Sprache, aber nur eine von vielen.', guide: 'Hindi wird in Devanagari geschrieben. Höre die Wörter langsam an.',
        words: [['नमस्ते', 'Namaste', 'Hallo', 'Na-ma-ste'], ['धन्यवाद', 'Dhanyavaad', 'Danke', 'Dhan-ja-waad'], ['हाँ', 'Haan', 'Ja', 'Haan'], ['नहीं', 'Nahin', 'Nein', 'Na-hin'], ['सुप्रभात', 'Suprabhaat', 'Guten Morgen', 'Su-pra-bhaat'], ['माफ़ कीजिए', 'Maaf kijiye', 'Entschuldigung', 'Maaf ki-dschi-je'], ['अच्छा', 'Acchha', 'Gut', 'A-tscha'], ['फिर मिलेंगे', 'Phir milenge', 'Bis bald', 'Fir mi-len-ge'], ['पानी', 'Paani', 'Wasser', 'Paa-ni'], ['दोस्त', 'Dost', 'Freund oder Freundin', 'Dost']] },
      food: { title: 'Essen in verschiedenen Regionen', lead: 'Zutaten, Gewürze und Essgewohnheiten unterscheiden sich stark.', guide: 'Nord- und Südindien haben zum Beispiel unterschiedliche Küchen.',
        cards: [['mango', 'Mango', 'In Indien wachsen viele Mangosorten.'], ['bread', 'Roti', 'Ein flaches Brot aus Teig.'], ['bowl', 'Dal', 'Gerichte aus Hülsenfrüchten.'], ['rice', 'Reisgerichte', 'Es gibt viele regionale Zubereitungen.']] }
    },
    quiz: [{ q: 'Wie heißt die Hauptstadt von Indien?', ok: 'Neu-Delhi', bad: ['Mumbai', 'Kalkutta'] }, { q: 'In welcher Stadt steht das Taj Mahal?', ok: 'Agra', bad: ['Delhi', 'Mumbai'] },
      { q: 'Was bedeutet „Namaste“?', ok: 'Hallo', bad: ['Danke', 'Lecker'] }, { q: 'Wie heißt das hohe Gebirge im Norden Indiens?', ok: 'Himalaya', bad: ['Alpen', 'Anden'] }],
    souv: {
      arrival: { n: 'Postkarte', k: 'card', bg: '#e9e2d6', c: ['', '#bdc9c4', '#efd69d'] }, places: { n: 'Marmor-Kuppel', k: 'dome', bg: '#dce6d8' }, life: { n: 'Rangoli-Muster', k: 'rangoli', bg: '#ead9c4' },
      language: { n: 'Namaste-Sticker', k: 'bubble', bg: '#e9e2d6' }, food: { n: 'Mango', k: 'mango', bg: '#dce6d8' }, quiz: { n: 'Goldene Lampe', k: 'lamp', bg: '#e9e2c9' } }
  }
};
/* Länder-Pakete aus world_pack_*.js ergänzen WP, WORDER, WX (Codes) und FLAGS. */
const WX = { iso: {}, ap: {} };                                 // WX.iso[id] = Länder-Code (3 Buchstaben), WX.ap[id] = großer Flughafen-Code (IATA) – nur sichere Angaben
const WORDER = ['deu', 'jpn', 'ind'];                          // Reihenfolge in der Abflughalle (später: weitere Länder anhängen)
const wList = () => WORDER.map(id => WP[id]).filter(Boolean);
