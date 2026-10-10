/* =====================================================================
   WELT: Länder-Paket E – Island
   Gleiche Struktur wie world_pack_b.js. Nur sichere Fakten, Beispiele als Beispiele, kein Pink.
   Sprachwörter vor dem Veröffentlichen von Muttersprachlern prüfen lassen. Bildchen tragen das Präfix isl_.
   Die Flagge FLAGS.isl kommt aus geo_data.js.
   ===================================================================== */
(function () {
  Object.assign(W_ART, {
    isl_reykjavik: '<path d="M0 74h140v21H0z" fill="#9fbac3"/><g stroke="#7d8b86" stroke-width="2.2" stroke-linejoin="round"><path d="M10 74V56h22v18z" fill="#c9a678"/><path d="M8 56l13-11 13 11z" fill="#a95040"/><path d="M104 74V54h24v20z" fill="#8fae95"/><path d="M102 54l14-11 14 11z" fill="#b4493d"/><path d="M52 74V30h8V16l6-8 6 8v14h8v44z" fill="#ece8dc"/><path d="M42 74V48h10M80 74V48h10" fill="#ece8dc"/></g><path d="M66 8V2" stroke="#7d8b86" stroke-width="2" stroke-linecap="round"/>',
    isl_geysir: '<path d="M0 78q40-8 70-4t70-2v23H0z" fill="#b9c9b0"/><ellipse cx="70" cy="76" rx="26" ry="7" fill="#9fc3cc" stroke="#7d9aa3" stroke-width="2"/><path d="M70 74V30M60 74q-8-30 2-52M80 74q8-30-2-52" stroke="#eaf3f5" stroke-width="9" stroke-linecap="round" fill="none"/><g fill="#eaf3f5"><circle cx="70" cy="22" r="9"/><circle cx="56" cy="30" r="6"/><circle cx="84" cy="30" r="6"/><circle cx="62" cy="14" r="5"/><circle cx="80" cy="12" r="5"/></g>',
    isl_volcano: '<path d="M0 80h140v15H0z" fill="#7d8b86"/><path d="M14 80 56 34h28l42 46z" fill="#6f7c78" stroke="#55615d" stroke-width="2.4" stroke-linejoin="round"/><path d="M56 34q14 8 28 0l-4-6H60z" fill="#c9784a"/><path d="M70 30q-6 20 2 40M70 34q10 14 10 36" stroke="#d98b4a" stroke-width="3.2" fill="none" stroke-linecap="round"/><g fill="#a9b3b0" opacity=".85"><circle cx="72" cy="18" r="8"/><circle cx="84" cy="10" r="6"/><circle cx="62" cy="10" r="5"/></g>',
    isl_pony: '<path d="M0 82h140v13H0z" fill="#b9c9b0"/><g stroke="#6b5240" stroke-width="2.4" stroke-linejoin="round"><path d="M30 60Q30 44 46 44H78Q90 44 92 34L94 22Q96 14 104 16L110 20Q112 28 106 32L102 38Q102 52 98 60V80H88V64H54V80H44V64Q30 68 30 60Z" fill="#a4764f"/><path d="M92 22q-8 6-6 20" fill="none" stroke="#e8dcc3" stroke-width="5" stroke-linecap="round"/><path d="M30 56q-12 4-14 18" fill="none" stroke="#e8dcc3" stroke-width="5" stroke-linecap="round"/></g>',
    isl_skyr: '<ellipse cx="70" cy="76" rx="44" ry="8" fill="#e5e8e4"/><path d="M26 44h88q-4 32-44 32T26 44Z" fill="#fbfaf7" stroke="#b9b3a6" stroke-width="2.5"/><ellipse cx="70" cy="44" rx="44" ry="9" fill="#f3f0e6" stroke="#b9b3a6" stroke-width="2.5"/><g fill="#4e6a8a"><circle cx="58" cy="41" r="4.5"/><circle cx="72" cy="44" r="4.5"/><circle cx="84" cy="40" r="4.5"/><circle cx="66" cy="38" r="4"/></g>',
    isl_soup: '<ellipse cx="70" cy="76" rx="46" ry="8" fill="#e5e8e4"/><path d="M20 46h100q-6 32-50 32T20 46Z" fill="#8c7765"/><ellipse cx="70" cy="46" rx="50" ry="11" fill="#d1b27a"/><g fill="#c9784a"><circle cx="52" cy="46" r="5"/><circle cx="70" cy="49" r="5"/><circle cx="88" cy="45" r="5"/></g><g fill="#7a9a6c"><circle cx="62" cy="43" r="3"/><circle cx="80" cy="50" r="3"/></g>',
    isl_ice: '<path d="M0 80h140v15H0z" fill="#9fbac3"/><path d="M10 80 46 36l22 22 20-30 42 52z" fill="#eaf3f5" stroke="#9fb3bd" stroke-width="2.4" stroke-linejoin="round"/><path d="M46 36 40 80M68 58l-6 22M88 28l10 52" stroke="#bcd4dc" stroke-width="2.4" fill="none"/>',
    isl_fish: '<ellipse cx="70" cy="70" rx="56" ry="12" fill="#f3efe6" stroke="#b9b3a6" stroke-width="2.5"/><path d="M26 50q30-24 62 0 10-8 26-10-4 10-4 20 4 10 4 20-16-2-26-10-32 24-62 0 8-10 0-20z" fill="#9fb3bd" stroke="#6b7f89" stroke-width="2.4" stroke-linejoin="round"/><circle cx="40" cy="48" r="3" fill="#2f3b40"/>'
  });
  W_INFO.isl_ice = '<path d="M16 3 28 14 24 29H8L4 14z"/><path d="M4 14h24M16 3v26"/>';
  Object.assign(W_SV, {
    isl_geysir: () => '<ellipse cx="32" cy="52" rx="18" ry="5" fill="#9fc3cc" stroke="#7d9aa3" stroke-width="2"/><path d="M32 50V22M26 50q-4-18 2-30M38 50q4-18-2-30" stroke="#eaf3f5" stroke-width="6" stroke-linecap="round" fill="none"/><g fill="#eaf3f5" stroke="#9fb3bd" stroke-width="1.4"><circle cx="32" cy="16" r="7"/><circle cx="22" cy="22" r="4.5"/><circle cx="42" cy="22" r="4.5"/></g>',
    isl_skyr: () => '<path d="M12 28h40q-2 22-20 22T12 28Z" fill="#fbfaf7" stroke="#b9b3a6" stroke-width="2.2"/><ellipse cx="32" cy="28" rx="20" ry="6" fill="#f3f0e6" stroke="#b9b3a6" stroke-width="2.2"/><g fill="#4e6a8a"><circle cx="26" cy="26" r="3"/><circle cx="35" cy="28" r="3"/><circle cx="40" cy="25" r="2.6"/></g>'
  });

  Object.assign(WP, {
    isl: {
      id: 'isl', name: 'Island', cont: 'Europa', cost: 6, sub: 'Vulkane, Geysire und Gletscher', speech: 'is-IS', scene: '#dce8ea', g1: '#d6e6ec', g2: '#e4e3d6',
      guide: { name: 'Katla', svg: wGuide('Katla', '#f3d3b8', '#c98f4e', '#52737c') },
      hero: '<svg class="w-scene-svg" viewBox="0 0 320 240" role="img" aria-label="Vulkan und Gletscher an der Küste"><circle cx="248" cy="58" r="22" fill="#f0e6c4"/><path d="M0 196q80-22 160 0t160 0v44H0Z" fill="#b9c9b0"/><path d="M0 218q80-16 160 0t160 0v22H0Z" fill="#9fbac3"/><path d="M20 196 96 84h40l76 112z" fill="#7a8783" stroke="#55615d" stroke-width="4" stroke-linejoin="round"/><path d="M96 84q20 12 40 0l-6-10h-28z" fill="#c9784a"/><path d="M116 80q-6 30 4 70" stroke="#d98b4a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M196 196 232 128l30 24 40 44z" fill="#eaf3f5" stroke="#9fb3bd" stroke-width="4" stroke-linejoin="round"/><g fill="#a9b3b0" opacity=".85"><circle cx="118" cy="56" r="14"/><circle cx="142" cy="42" r="10"/></g></svg>',
      welcome: 'Eine große Insel im Nordatlantik mit Vulkanen, heißen Quellen und Gletschern.',
      story: 'Hallo, ich bin Katla und wohne in Reykjavik. Heute zeige ich dir ein paar Dinge aus meinem Alltag. Andere Kinder auf Island erzählen dir vielleicht etwas ganz anderes.',
      st: {
        arrival: { title: 'Ankunft auf Island', lead: 'Island ist eine Insel im Nordatlantik, weit im Norden Europas.', guide: 'Wir starten mit einem schnellen Überblick. Danach kannst du jede Station frei öffnen.',
          items: [['capital', 'Hauptstadt', 'Reykjavik'], ['coin_b', 'Währung', 'Isländische Krone'], ['map', 'Lage', 'Eine Insel im Nordatlantik'], ['time', 'Zeit', 'Island stellt die Uhr nicht um (keine Sommerzeit)'], ['language', 'Sprache', 'Isländisch'], ['island', 'Insel', 'Island ist rundherum von Meer umgeben']],
          rich: [['Feuer und Eis', 'Auf Island gibt es Vulkane und große Gletscher.'], ['Heiße Quellen', 'Viele Häuser werden mit heißem Wasser aus der Erde geheizt.'], ['Natur', 'Es gibt Wasserfälle, Lavafelder und Küsten.']] },
        places: { title: 'Orte auf deiner Route', lead: 'Vier Orte zeigen unterschiedliche Seiten von Island.', guide: 'Das Wetter kann sich schnell ändern. Warme Kleidung ist wichtig.',
          cards: [['isl_reykjavik', 'Reykjavik', 'Die Hauptstadt am Meer hat bunte Häuser und eine hohe Kirche.'], ['isl_geysir', 'Geysir', 'Ein Geysir schleudert heißes Wasser hoch in die Luft.'], ['isl_volcano', 'Vulkane', 'Auf Island gibt es viele Vulkane, manche sind heute ruhig.'], ['isl_ice', 'Gletscher', 'Gletscher sind riesige Flächen aus Eis.']],
          rich: [['Natur erleben', 'Viele Menschen wandern oder baden in warmen Quellen.'], ['Entfernung', 'Zwischen den Orten liegen oft weite Strecken ohne Dorf.']] },
        life: { title: 'Alltag und Feste', lead: 'Beispiele helfen beim Verstehen, sind aber keine Regeln für alle.', guide: 'Meine Familie hat eigene Gewohnheiten. Andere Familien machen manches anders.',
          items: [['home', 'Schwimmbad', 'Viele Menschen gehen gern in warme Schwimmbäder, auch im Winter.'], ['light', 'Nordlichter', 'Im Winter sieht man manchmal grüne Lichter am Himmel.'], ['time', 'Licht', 'Im Sommer wird es kaum dunkel, im Winter sehr früh.'], ['festival', 'Weihnachten', 'In der Weihnachtszeit gibt es viele Lichter und Bücher als Geschenk.'], ['flower', 'Natur', 'Viele Familien sind am Wochenende draußen unterwegs.'], ['isl_ice', 'Winter', 'Im Winter liegt oft Schnee und es ist windig.']] },
        language: { title: 'Isländische Wörter hören', lead: 'Tippe auf den Lautsprecher. Höre zuerst zu und sprich dann langsam nach.', guide: 'Isländisch hat besondere Buchstaben wie ð und þ.',
          words: [['Halló', '', 'Hallo', 'Hal-loh'], ['Góðan daginn', '', 'Guten Tag', 'Goh-than dai-in'], ['Takk', '', 'Danke', 'Tak'], ['Já', '', 'Ja', 'Jau'], ['Nei', '', 'Nein', 'Nei'], ['Bless', '', 'Tschüss', 'Bless'], ['Vatn', '', 'Wasser', 'Wat-n'], ['Vinur', '', 'Freund', 'Wi-nur'], ['Fyrirgefðu', '', 'Entschuldigung', 'Fi-rir-gev-thu'], ['Góða nótt', '', 'Gute Nacht', 'Goh-tha noht']] },
        food: { title: 'Essen auf Island', lead: 'Gerichte unterscheiden sich nach Familie, Region, Jahreszeit und Anlass.', guide: '„Ungewohnt“ ist freundlicher und genauer als „seltsam“.',
          cards: [['isl_skyr', 'Skyr', 'Ein cremiges Milchprodukt, oft mit Beeren gegessen.'], ['isl_soup', 'Lammsuppe', 'Eine warme Suppe mit Fleisch und Gemüse.'], ['isl_fish', 'Fisch', 'Fisch aus dem Meer ist auf Island sehr wichtig.'], ['isl_pony', 'Islandpferd', 'Ein kleines, kräftiges Pferd, das es seit langer Zeit auf Island gibt.']] }
      },
      quiz: [{ q: 'Wie heißt die Hauptstadt von Island?', ok: 'Reykjavik', bad: ['Oslo', 'Helsinki'] }, { q: 'Was ist ein Geysir?', ok: 'Eine heiße Quelle, die Wasser hochspritzt', bad: ['Ein Berg aus Eis', 'Ein Fisch'] },
        { q: 'Was bedeutet „Takk“?', ok: 'Danke', bad: ['Hallo', 'Wasser'] }, { q: 'Was ist Skyr?', ok: 'Ein cremiges Milchprodukt', bad: ['Ein Vulkan', 'Ein Pferd'] }],
      souv: {
        arrival: { n: 'Postkarte', k: 'card', bg: '#dce8ea', c: ['', '#9fb3bd', '#f0e6c4'] }, places: { n: 'Geysir', k: 'isl_geysir', bg: '#e4e3d6' }, life: { n: 'Nordlicht-Lampe', k: 'lamp', bg: '#d6e6ec' },
        language: { n: 'Halló-Sticker', k: 'bubble', bg: '#dce8ea' }, food: { n: 'Skyr', k: 'isl_skyr', bg: '#e4e3d6' }, quiz: { n: 'Goldmedaille', k: 'medal', bg: '#e9e2c9' } }
    }
  });
  WORDER.push('isl');
  Object.assign(WX.iso, { isl: 'ISL' });
  Object.assign(WX.ap, { isl: 'KEF' });
})();
