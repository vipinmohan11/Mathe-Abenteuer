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
  { c: 'Welt', t: 'Der Mount Everest ist der höchste Berg der Erde: knapp 8 850 Meter über dem Meer.' },
  /* ---- Ab hier werden die Fakten nach und nach freigeschaltet (jede Woche ein Päckchen, oder früher, wenn alle gelesen sind) ---- */
  { c: 'Tiere', t: 'Pinguine können nicht fliegen, aber sehr gut schwimmen und tauchen.' },
  { c: 'Tiere', t: 'Elefanten sind die größten Tiere, die an Land leben.' },
  { c: 'Tiere', t: 'Ein Chamäleon kann seine beiden Augen unabhängig voneinander bewegen.' },
  { c: 'Tiere', t: 'Wenn Delfine schlafen, ruht immer nur eine Gehirnhälfte. Die andere bleibt wach.' },
  { c: 'Tiere', t: 'Ein Seestern hat kein Gehirn.' },
  { c: 'Tiere', t: 'Das Leuchten von Katzenaugen im Dunkeln entsteht, weil eine Schicht im Auge das Licht zurückwirft.' },
  { c: 'Tiere', t: 'Der Gepard ist das schnellste Landtier der Erde.' },
  { c: 'Tiere', t: 'Das Schnabeltier ist ein Säugetier, das trotzdem Eier legt.' },
  { c: 'Tiere', t: 'Fledermäuse sind Säugetiere, die richtig fliegen können.' },
  { c: 'Tiere', t: 'Beim Seepferdchen trägt das Männchen die Eier aus.' },
  { c: 'Tiere', t: 'Eisbären haben schwarze Haut unter dem weißen Fell.' },
  { c: 'Tiere', t: 'Faultiere bewegen sich sehr langsam und schlafen viel.' },
  { c: 'Tiere', t: 'Eine Biene hat fünf Augen: zwei große und drei ganz kleine.' },
  { c: 'Tiere', t: 'Haie bekommen im Laufe ihres Lebens immer wieder neue Zähne.' },
  { c: 'Natur', t: 'Ein Regenbogen entsteht, wenn Sonnenlicht in Regentropfen in seine Farben zerlegt wird.' },
  { c: 'Natur', t: 'Pflanzen nehmen Kohlendioxid auf und geben Sauerstoff ab.' },
  { c: 'Natur', t: 'Die Sahara ist die größte heiße Wüste der Erde.' },
  { c: 'Natur', t: 'Wasser kann fest, flüssig und gasförmig sein: als Eis, als Wasser und als Dampf.' },
  { c: 'Natur', t: 'Wenn flüssiges Gestein aus einem Vulkan fließt, nennt man es Lava.' },
  { c: 'Natur', t: 'Schneekristalle haben meistens sechs Arme oder Ecken.' },
  { c: 'Natur', t: 'Etwa 70 von 100 Teilen der Erdoberfläche sind mit Wasser bedeckt.' },
  { c: 'Natur', t: 'Bambus ist ein Gras und kann sehr schnell wachsen.' },
  { c: 'Natur', t: 'Du siehst einen Blitz früher, als du den Donner hörst, weil Licht schneller ist als Schall.' },
  { c: 'Natur', t: 'An den Jahresringen eines Baumstamms kann man sein Alter zählen.' },
  { c: 'Natur', t: 'Die Antarktis ist der kälteste Kontinent der Erde.' },
  { c: 'Natur', t: 'Pilze sind weder Pflanzen noch Tiere. Sie bilden eine eigene Gruppe.' },
  { c: 'Weltraum', t: 'Jupiter ist der größte Planet in unserem Sonnensystem.' },
  { c: 'Weltraum', t: 'Auf dem Mond gibt es keine Luft zum Atmen.' },
  { c: 'Weltraum', t: 'Die Ringe des Saturn bestehen aus Eis- und Gesteinsbrocken.' },
  { c: 'Weltraum', t: 'Die Sonne ist ein Stern. Sie sieht nur so groß aus, weil sie uns so nah ist.' },
  { c: 'Weltraum', t: 'Merkur ist der kleinste Planet und der Sonne am nächsten.' },
  { c: 'Weltraum', t: 'Weil sich die Erde um sich selbst dreht, gibt es Tag und Nacht.' },
  { c: 'Weltraum', t: 'Juri Gagarin war 1961 der erste Mensch im Weltraum.' },
  { c: 'Weltraum', t: 'Neil Armstrong war 1969 der erste Mensch auf dem Mond.' },
  { c: 'Weltraum', t: 'Unser Sonnensystem hat acht Planeten.' },
  { c: 'Weltraum', t: 'Der Mars heißt auch „der rote Planet“, weil sein Staub rötlich aussieht.' },
  { c: 'Körper', t: 'Die Haut ist das größte Organ deines Körpers.' },
  { c: 'Körper', t: 'Deine Zunge ist ein Muskel.' },
  { c: 'Körper', t: 'Dein Körper besteht zu einem großen Teil aus Wasser.' },
  { c: 'Körper', t: 'Der kleinste Knochen deines Körpers liegt im Ohr: der Steigbügel.' },
  { c: 'Körper', t: 'Der Oberschenkelknochen ist der längste Knochen im Körper.' },
  { c: 'Körper', t: 'Fingernägel wachsen schneller als Fußnägel.' },
  { c: 'Körper', t: 'Erwachsene haben bis zu 32 Zähne.' },
  { c: 'Zahlen', t: 'Die drei Winkel in jedem Dreieck ergeben zusammen immer 180 Grad.' },
  { c: 'Zahlen', t: 'Ein Würfel hat 6 Flächen, 12 Kanten und 8 Ecken.' },
  { c: 'Zahlen', t: 'Ein Jahr hat 52 Wochen und noch einen Tag (oder zwei) dazu.' },
  { c: 'Zahlen', t: 'Eine Milliarde hat neun Nullen.' },
  { c: 'Zahlen', t: 'Ein Schachbrett hat 64 Felder.' },
  { c: 'Zahlen', t: 'Es gibt unendlich viele Primzahlen. Man wird nie fertig, sie alle aufzuzählen.' },
  { c: 'Zahlen', t: 'Mit nur zehn Ziffern, 0 bis 9, kannst du jede Zahl schreiben.' },
  { c: 'Zahlen', t: 'Die Quersumme jedes Vielfachen von 9 ist wieder durch 9 teilbar.' },
  { c: 'Welt', t: 'Russland ist das größte Land der Erde.' },
  { c: 'Welt', t: 'Der Vatikan ist der kleinste Staat der Welt.' },
  { c: 'Welt', t: 'Das Great Barrier Reef vor Australien ist das größte Korallenriff der Erde.' },
  { c: 'Welt', t: 'Der Baikalsee in Russland ist der tiefste See der Erde.' },
  { c: 'Welt', t: 'Island heißt „Eisland“, hat aber viele Vulkane und heiße Quellen.' },
  { c: 'Welt', t: 'Der Äquator teilt die Erde in die Nord- und die Südhalbkugel.' },
  { c: 'Welt', t: 'Venedig besteht aus vielen kleinen Inseln und hat Kanäle statt vieler Straßen.' },
  { c: 'Welt', t: 'Der Kilimandscharo in Tansania ist der höchste Berg Afrikas.' },
  { c: 'Welt', t: 'Die Niagarafälle liegen an der Grenze zwischen den USA und Kanada.' },
  { c: 'Welt', t: 'Rund um den Nordpol gibt es kein Land, nur Meer mit Eis.' }
];
Object.assign(DZ_ART, {
  paw: '<ellipse cx="32" cy="35" rx="13" ry="10" fill="#e9d9da"/><ellipse cx="17" cy="23" rx="5" ry="6.5" fill="#e9d9da" transform="rotate(-18 17 23)"/><ellipse cx="27" cy="14" rx="5" ry="7" fill="#e9d9da" transform="rotate(-6 27 14)"/><ellipse cx="38" cy="14" rx="5" ry="7" fill="#e9d9da" transform="rotate(6 38 14)"/><ellipse cx="48" cy="23" rx="5" ry="6.5" fill="#e9d9da" transform="rotate(18 48 23)"/><path d="M25 36q7 6 14 0" fill="none" stroke="#9c6668" stroke-width="2.4" stroke-linecap="round"/>',
  natur: '<circle cx="46" cy="13" r="7" fill="#f0dfbd"/><path d="M4 44q14-14 28-2t28-2v12H4Z" fill="#bed1c6"/><path d="M20 44V28" stroke="#a88c75" stroke-width="4" stroke-linecap="round"/><path d="M20 10 31 30H9Z" fill="#8aa58e"/><path d="M42 44V32" stroke="#a88c75" stroke-width="3" stroke-linecap="round"/><circle cx="42" cy="26" r="8" fill="#9db8a4"/>',
  planet: '<circle cx="32" cy="26" r="14" fill="#e7edeb" stroke="#52676c" stroke-width="2.2"/><path d="M22 20q10 6 20 0M20 30q12 6 24 0" fill="none" stroke="#bed1c6" stroke-width="3"/><ellipse cx="32" cy="26" rx="26" ry="7" fill="none" stroke="#9c6668" stroke-width="2.6" transform="rotate(-18 32 26)"/><circle cx="53" cy="10" r="2.4" fill="#d5ad72"/><circle cx="9" cy="42" r="1.8" fill="#d5ad72"/>',
  herz: '<path d="M32 46C14 34 10 24 15 16c5-7 13-4 17 2 4-6 12-9 17-2 5 8 1 18-17 30Z" fill="#e9d9da" stroke="#9c6668" stroke-width="2.4" stroke-linejoin="round"/><path d="M16 27h9l3-6 5 11 3-5h9" fill="none" stroke="#8e5962" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  zahlen: '<rect x="6" y="14" width="16" height="22" rx="5" fill="#bed1c6"/><rect x="24" y="8" width="16" height="22" rx="5" fill="#e9d9da"/><rect x="42" y="18" width="16" height="22" rx="5" fill="#f1e4b6"/><text x="14" y="31" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="15" font-weight="800" fill="#52676c">1</text><text x="32" y="25" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="15" font-weight="800" fill="#8e5962">2</text><text x="50" y="35" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="15" font-weight="800" fill="#52676c">3</text>'
});
/* Freischaltung: am Anfang die ersten F_BASE Fakten (so viele gab es schon); danach jede Woche ein Päckchen von F_BATCH.
   Hat das Kind alles Freigeschaltete gelesen, kommt ein Päckchen früher (höchstens eines pro Tag). Es werden keine Zahlen gezeigt. */
const F_BASE = 29, F_BATCH = 7;
const fSt = () => { const f = S.facts || (S.facts = { i: 0, seen: {} }); if (!f.seen) f.seen = {}; if (!f.start) f.start = ymd(); if (typeof f.early !== 'number') f.early = 0; return f; };
const fDays = (a, b) => Math.max(0, Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5));
function factsOpen() { const f = fSt(); return Math.min(FACTS.length, F_BASE + F_BATCH * (Math.floor(fDays(f.start, ymd()) / 7) + f.early)); }
const factsUnseen = () => { const n = factsOpen(), f = fSt(); let c = 0; for (let i = 0; i < n; i++) if (!f.seen[i]) c++; return c; };
function factsTryEarly() {                                         // alles gelesen → früher ein neues Päckchen (einmal pro Tag)
  const f = fSt();
  if (factsUnseen() === 0 && factsOpen() < FACTS.length && f.earlyDay !== ymd()) { f.early++; f.earlyDay = ymd(); f.fresh = true; save(); return true; }
  return false;
}
function factsFirstNew() { const n = factsOpen(), f = fSt(); for (let i = 0; i < n; i++) if (!f.seen[i]) return i; return -1; }
function factsSub() { return factsUnseen() ? 'Neue Fakten warten' : 'Staunen und wissen'; }
function factMark() { const f = fSt(), n = factsOpen(); f.i = ((f.i || 0) % n + n) % n; f.seen[f.i] = 1; save(); }

VIEWS.fakten = () => {
  const f = fSt(), n = factsOpen(), i = ((f.i || 0) % n + n) % n, it = FACTS[i], fresh = f.fresh; f.fresh = false;
  const all = factsUnseen() === 0 && factsOpen() >= FACTS.length;
  return topBar('Lustige Fakten', 'rewards') + `<section class="dz-panel dz-fact" aria-live="polite"><div class="dz-fact-art">${dzArt(FACT_ART[it.c] || 'fakten')}</div><h2>${esc(it.c)}</h2><p class="dz-fact-t">${esc(it.t)}</p>
    ${fresh ? '<p class="dz-fact-new">Neue Fakten sind da!</p>' : ''}
    ${factsUnseen() === 0 && !all ? '<p class="small mute" style="margin-top:14px">Du hast alles gelesen, was es bis jetzt gibt. Schau bald wieder rein, es kommen neue Fakten dazu.</p>' : ''}
    <div class="row wrap" style="justify-content:center;margin-top:14px"><button class="btn sec big" data-act="faktStep" data-arg="-1">${ico('back', 20)} Vorheriger</button><button class="btn big" data-act="faktStep" data-arg="1">Nächster Fakt</button></div></section>`;
};
registerFeature({
  id: 'fakten', title: 'Lustige Fakten', icon: 'sparkle', tint: 'butter', group: 'world', order: 5, view: 'fakten', sub: factsSub,
  acts: {
    fakten: () => { const f = fSt(); factsTryEarly(); const nw = factsFirstNew(); if (nw >= 0) f.i = nw; factMark(); go('fakten'); },
    faktStep: d => {
      const f = fSt(); let n = factsOpen(), nx = (f.i || 0) + (+d);
      if (+d > 0 && nx >= n && factsTryEarly()) { n = factsOpen(); nx = factsFirstNew(); }        // am Ende angekommen: neues Päckchen, falls möglich
      f.i = ((nx % n) + n) % n; factMark(); sfx('tap'); render();
    }
  }
});
