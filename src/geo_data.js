/* =====================================================================
   GEO-DATEN: Länder, Hauptstädte, Flaggen (einfaches SVG), Nachbarn, sichere Fakten
   ---------------------------------------------------------------------
   Neue Kontinente: einen Eintrag in GEO.conts ergänzen und die Länder mit  cont:'asien'  an COUNTRIES anhängen.
   Quiz, Karten und Belohnungen lesen NUR diese Daten – kein Umbau der Oberfläche nötig.
   REGELN FÜR FAKTEN: nur Dinge, die 100 % sicher stimmen (Kinder sollen nichts Falsches lernen). Im Zweifel weglassen.
   Länder-Felder: id · cont · reg · name · cap (Anzeige) · alt (weitere erlaubte Schreibweisen beim Tippen) ·
                  nb (Nachbarländer mit Landgrenze, nur Ids) · tr (leicht verwechselbare Länder) · trap (große Stadt, die NICHT die Hauptstadt ist) · facts ·
                  nbx (1 = hat weitere Nachbarländer, die nicht in dieser Liste sind – z. B. die Türkei bei Bulgarien/Griechenland/Georgien; nur für die Länderkarte)
   ===================================================================== */
const GEO = {
  conts: [{ id: 'europa', name: 'Europa', ic: '🌍', ready: true }],
  coming: ['Asien', 'Amerika', 'Afrika'],            // nur Anzeige (gesperrt mit Schloss), bis Daten da sind
  regs: { nord: 'Norden', bal: 'Baltikum', west: 'Westeuropa', mitte: 'Mitteleuropa', sued: 'Südeuropa', balk: 'Balkan', ost: 'Osteuropa', kauk: 'Kaukasus' }
};
const mkC = (id, reg, name, cap, nb, facts, o) => Object.assign({ id, cont: 'europa', reg, name, cap, nb, facts, calt: [], tr: [], trap: '' }, o || {});
const COUNTRIES = [
  mkC('alb', 'balk', 'Albanien', 'Tirana', ['mne', 'kos', 'mkd', 'grc'], ['Die Flagge zeigt einen schwarzen Doppeladler.', 'Albanien hat Küste am Adriatischen und am Ionischen Meer.']),
  mkC('and', 'sued', 'Andorra', 'Andorra la Vella', ['fra', 'esp'], ['Andorra ist ein Kleinstaat in den Pyrenäen, zwischen Frankreich und Spanien.', 'Andorra la Vella gehört zu den höchstgelegenen Hauptstädten Europas.']),
  mkC('blr', 'ost', 'Belarus', 'Minsk', ['pol', 'ltu', 'lva', 'rus', 'ukr'], ['Belarus hat keine Küste und liegt nicht am Meer.'], { nalt: ['Weißrussland'] }),
  mkC('bel', 'west', 'Belgien', 'Brüssel', ['nld', 'deu', 'lux', 'fra'], ['In Belgien spricht man Niederländisch, Französisch und Deutsch.', 'In Brüssel arbeiten viele wichtige Einrichtungen der Europäischen Union.'], { tr: ['che', 'deu'] }),
  mkC('bih', 'balk', 'Bosnien und Herzegowina', 'Sarajevo', ['hrv', 'srb', 'mne'], ['Bosnien und Herzegowina hat nur einen ganz kurzen Küstenstreifen an der Adria.'], { tr: ['srb', 'mne', 'hrv', 'kos'] }),
  mkC('bgr', 'balk', 'Bulgarien', 'Sofia', ['rou', 'srb', 'mkd', 'grc'], ['In Bulgarien schreibt man mit kyrillischen Buchstaben.', 'Bulgarien liegt am Schwarzen Meer.'], { nbx: 1 }),
  mkC('dnk', 'nord', 'Dänemark', 'Kopenhagen', ['deu'], ['Dänemark besteht aus der Halbinsel Jütland und vielen Inseln.', 'LEGO kommt aus Dänemark.']),
  mkC('deu', 'mitte', 'Deutschland', 'Berlin', ['dnk', 'pol', 'cze', 'aut', 'che', 'fra', 'lux', 'bel', 'nld'], ['Berlin ist Hauptstadt und gleichzeitig ein eigenes Bundesland (Stadtstaat) – eines der kleinsten Bundesländer.', 'Deutschland hat 16 Bundesländer und 9 Nachbarländer.'], { trap: 'Hamburg' }),
  mkC('est', 'bal', 'Estland', 'Tallinn', ['lva', 'rus'], ['Estland ist eines der drei baltischen Länder.', 'Zu Estland gehören mehr als 1000 Inseln.'], { tr: ['lva', 'ltu'] }),
  mkC('fin', 'nord', 'Finnland', 'Helsinki', ['swe', 'nor', 'rus'], ['Finnland nennt man das Land der tausend Seen.']),
  mkC('fra', 'west', 'Frankreich', 'Paris', ['bel', 'lux', 'deu', 'che', 'ita', 'mco', 'esp', 'and'], ['Der Eiffelturm steht in Paris.', 'Frankreich grenzt an den Atlantik und das Mittelmeer.'], { trap: 'Marseille' }),
  mkC('geo', 'kauk', 'Georgien', 'Tiflis', ['rus'], ['Georgien liegt im Kaukasus am Schwarzen Meer.'], { calt: ['Tbilissi', 'Tbilisi'], nbx: 1 }),
  mkC('grc', 'sued', 'Griechenland', 'Athen', ['alb', 'mkd', 'bgr'], ['Auf der Akropolis in Athen stehen uralte Tempel.', 'Griechenland hat sehr viele Inseln.'], { calt: ['Athína'], nbx: 1 }),
  mkC('irl', 'west', 'Irland', 'Dublin', ['gbr'], ['Irland nennt man auch die Grüne Insel.', 'Das Kleeblatt ist ein Symbol Irlands.']),
  mkC('isl', 'nord', 'Island', 'Reykjavik', [], ['Island hat Vulkane, Geysire und heiße Quellen.', 'Reykjavik gehört zu den nördlichsten Hauptstädten der Welt.'], { calt: ['Reykjavík'] }),
  mkC('ita', 'sued', 'Italien', 'Rom', ['fra', 'che', 'aut', 'svn', 'smr', 'vat'], ['In Italien gibt es die Vulkane Vesuv und Ätna.', 'Mitten in Rom liegt der kleinste Staat der Welt: der Vatikan.'], { calt: ['Roma'], trap: 'Mailand' }),
  mkC('kos', 'balk', 'Kosovo', 'Pristina', ['alb', 'mkd', 'mne', 'srb'], ['Kosovo hat keine Küste und liegt im Südosten Europas.', 'In Kosovo bezahlt man mit Euro.', 'Auf der Flagge von Kosovo sieht man die Umrisse des Landes.'], { calt: ['Priština', 'Prishtina', 'Prishtinë'], tr: ['bih', 'alb', 'mne'] }),
  mkC('hrv', 'balk', 'Kroatien', 'Zagreb', ['svn', 'hun', 'srb', 'bih', 'mne'], ['Kroatien hat mehr als 1000 Inseln in der Adria.'], { tr: ['svn', 'srb'] }),
  mkC('lva', 'bal', 'Lettland', 'Riga', ['est', 'ltu', 'rus', 'blr'], ['Lettland ist eines der drei baltischen Länder: Estland, Lettland, Litauen.'], { tr: ['est', 'ltu'] }),
  mkC('lie', 'mitte', 'Liechtenstein', 'Vaduz', ['che', 'aut'], ['Liechtenstein ist eines der kleinsten Länder Europas.', 'Es liegt zwischen der Schweiz und Österreich.']),
  mkC('ltu', 'bal', 'Litauen', 'Vilnius', ['lva', 'blr', 'pol', 'rus'], ['Litauen ist das größte der drei baltischen Länder.'], { tr: ['lva', 'est'] }),
  mkC('lux', 'west', 'Luxemburg', 'Luxemburg', ['bel', 'deu', 'fra'], ['Land und Hauptstadt heißen gleich: Luxemburg.', 'Luxemburg ist ein kleines Land zwischen Belgien, Deutschland und Frankreich.'], { calt: ['Luxemburg-Stadt', 'Stadt Luxemburg'] }),
  mkC('mlt', 'sued', 'Malta', 'Valletta', [], ['Malta ist ein Inselstaat im Mittelmeer.', 'Malta ist das kleinste Land der EU.']),
  mkC('mda', 'ost', 'Moldau', 'Chișinău', ['rou', 'ukr'], ['Moldau liegt zwischen Rumänien und der Ukraine.'], { calt: ['Chisinau', 'Kischinau', 'Kischinew'], tr: ['rou'] }),
  mkC('mco', 'sued', 'Monaco', 'Monaco', ['fra'], ['Monaco ist nach dem Vatikan das zweitkleinste Land der Welt.', 'Monaco liegt am Mittelmeer und grenzt an Frankreich.'], { calt: ['Monaco-Ville'] }),
  mkC('mne', 'balk', 'Montenegro', 'Podgorica', ['hrv', 'bih', 'srb', 'kos', 'alb'], ['Montenegro bedeutet „Schwarze Berge“.'], { tr: ['bih'] }),
  mkC('nld', 'west', 'Niederlande', 'Amsterdam', ['bel', 'deu'], ['Hauptstadt ist Amsterdam – die Regierung sitzt aber in Den Haag.', 'Große Teile der Niederlande liegen niedriger als der Meeresspiegel.'], { trap: 'Rotterdam' }),
  mkC('mkd', 'balk', 'Nordmazedonien', 'Skopje', ['alb', 'kos', 'bgr', 'grc', 'srb'], ['Das Land heißt seit 2019 Nordmazedonien.']),
  mkC('nor', 'nord', 'Norwegen', 'Oslo', ['swe', 'fin', 'rus'], ['Norwegen hat tiefe Meeresarme zwischen Bergen, die Fjorde.']),
  mkC('aut', 'mitte', 'Österreich', 'Wien', ['deu', 'cze', 'svk', 'hun', 'svn', 'ita', 'che', 'lie'], ['Österreich liegt zu großen Teilen in den Alpen.', 'Die Hauptstadt Wien liegt an der Donau.'], { calt: ['Vienna'] }),
  mkC('pol', 'mitte', 'Polen', 'Warschau', ['deu', 'cze', 'svk', 'ukr', 'blr', 'ltu', 'rus'], ['Im Norden Polens liegt die Ostsee.', 'Polen hat 7 Nachbarländer.'], { calt: ['Warszawa'], trap: 'Krakau' }),
  mkC('prt', 'sued', 'Portugal', 'Lissabon', ['esp'], ['Portugal liegt ganz im Westen des europäischen Festlands.', 'Portugal teilt sich die Iberische Halbinsel mit Spanien.'], { calt: ['Lisboa'], trap: 'Porto' }),
  mkC('rou', 'balk', 'Rumänien', 'Bukarest', ['ukr', 'mda', 'bgr', 'srb', 'hun'], ['In Rumänien liegen die Karpaten.', 'Die Donau fließt durch Rumänien.'], { calt: ['București', 'Bucuresti'], tr: ['hun', 'srb', 'svk'] }),
  mkC('rus', 'ost', 'Russland', 'Moskau', ['nor', 'fin', 'est', 'lva', 'ltu', 'pol', 'blr', 'ukr', 'geo'], ['Russland ist das größte Land der Erde.', 'Russland liegt in Europa und in Asien.'], { calt: ['Moskva'], trap: 'Sankt Petersburg', nbx: 1 }),
  mkC('smr', 'sued', 'San Marino', 'San Marino', ['ita'], ['Die Hauptstadt heißt genauso wie das Land: die Stadt San Marino.', 'San Marino ist ganz von Italien umgeben.'], { calt: ['Stadt San Marino', 'City of San Marino'] }),
  mkC('swe', 'nord', 'Schweden', 'Stockholm', ['nor', 'fin'], ['Astrid Lindgren, die Pippi Langstrumpf erfunden hat, kam aus Schweden.'], { trap: 'Göteborg' }),
  mkC('che', 'mitte', 'Schweiz', 'Bern', ['deu', 'fra', 'ita', 'aut', 'lie'], ['Bern ist die Bundesstadt der Schweiz und gilt als Hauptstadt – nicht Zürich und nicht Genf!', 'Die Schweiz hat vier Landessprachen: Deutsch, Französisch, Italienisch und Rätoromanisch.'], { trap: 'Zürich', tr: ['bel', 'deu'] }),
  mkC('srb', 'balk', 'Serbien', 'Belgrad', ['hun', 'rou', 'bgr', 'mkd', 'kos', 'mne', 'bih', 'hrv'], ['Belgrad liegt dort, wo die Flüsse Save und Donau zusammenfließen.'], { calt: ['Beograd'], tr: ['rou', 'hun', 'svk', 'bih'] }),
  mkC('svk', 'mitte', 'Slowakei', 'Bratislava', ['cze', 'pol', 'ukr', 'hun', 'aut'], ['Bratislava liegt an der Donau, ganz nah an Österreich und Ungarn.'], { calt: ['Pressburg'], tr: ['svn', 'cze', 'hun'] }),
  mkC('svn', 'mitte', 'Slowenien', 'Ljubljana', ['ita', 'aut', 'hun', 'hrv'], ['Slowenien hat nur ein kurzes Stück Küste an der Adria.', 'Slowenien und die Slowakei klingen ähnlich – sind aber zwei verschiedene Länder!'], { calt: ['Laibach'], tr: ['svk', 'hrv'] }),
  mkC('esp', 'sued', 'Spanien', 'Madrid', ['prt', 'fra', 'and'], ['Spanien teilt sich die Iberische Halbinsel mit Portugal.'], { trap: 'Barcelona' }),
  mkC('cze', 'mitte', 'Tschechien', 'Prag', ['deu', 'pol', 'svk', 'aut'], ['Tschechien hat keine Küste.', 'Prag liegt an der Moldau.'], { calt: ['Praha'], tr: ['svk', 'pol'] }),
  mkC('ukr', 'ost', 'Ukraine', 'Kiew', ['pol', 'svk', 'hun', 'rou', 'mda', 'blr', 'rus'], ['Kiew liegt am Fluss Dnepr.', 'Die Ukraine liegt am Schwarzen Meer.'], { calt: ['Kyjiw', 'Kyiv', 'Kiev'] }),
  mkC('hun', 'mitte', 'Ungarn', 'Budapest', ['svk', 'ukr', 'rou', 'srb', 'hrv', 'svn', 'aut'], ['Budapest besteht aus den beiden Stadtteilen Buda und Pest an der Donau.'], { tr: ['rou', 'srb', 'svk'] }),
  mkC('vat', 'sued', 'Vatikanstadt', 'Vatikanstadt', ['ita'], ['Die Vatikanstadt ist das kleinste Land der Welt.', 'Sie liegt mitten in der Stadt Rom.'], { calt: ['Vatikan'] }),
  mkC('gbr', 'west', 'Vereinigtes Königreich', 'London', ['irl'], ['Das Vereinigte Königreich besteht aus England, Schottland, Wales und Nordirland.', 'London liegt an der Themse.'], { nalt: ['Großbritannien'] }),
  mkC('cyp', 'sued', 'Zypern', 'Nikosia', [], ['Zypern ist eine Insel im Mittelmeer.', 'Zypern gehört zur Europäischen Union.'], { calt: ['Lefkosia'] })
];
/* Fläche in km² (gerundet; Serbien ohne Kosovo). Für „Größer oder kleiner?“ werden nur Paare mit mindestens 1,6-fachem Unterschied gefragt – kleine Rundungsfehler spielen also keine Rolle. */
const GEO_AREA = { alb: 28748, and: 468, blr: 207600, bel: 30528, bih: 51209, bgr: 110994, dnk: 43000, deu: 357600, est: 45227, fin: 338450, fra: 551500, geo: 69700, grc: 131957, irl: 70273, isl: 103000, ita: 301340, kos: 10887, hrv: 56594, lva: 64589, lie: 160, ltu: 65300, lux: 2586, mlt: 316, mda: 33846, mco: 2, mne: 13812, nld: 41850, mkd: 25713, nor: 385000, aut: 83879, pol: 312696, prt: 92212, rou: 238397, rus: 17098246, smr: 61, swe: 450295, che: 41285, srb: 77474, svk: 49035, svn: 20273, esp: 505990, cze: 78871, ukr: 603550, hun: 93028, vat: 0.44, gbr: 243610, cyp: 9251 };
COUNTRIES.forEach(c => { c.area = GEO_AREA[c.id] || 0; });
const CBY = {}; COUNTRIES.forEach(c => { CBY[c.id] = c; });
(function checkGeo() {                               // Nachbarschaft ist gegenseitig; sonst Fehler beim Start in der Konsole
  COUNTRIES.forEach(c => c.nb.forEach(n => { if (!CBY[n] || !CBY[n].nb.includes(c.id)) console.error('GEO: Nachbarschaft nicht gegenseitig', c.id, n); }));
})();

/* ---------- Flaggen: einfache SVGs (Seitenverhältnis 3:2, viewBox 0 0 30 20) ---------- */
const fR = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const fH = cs => cs.map((c, i) => fR(0, i * 20 / cs.length, 30, 20 / cs.length + .02, c)).join('');
const fV = cs => cs.map((c, i) => fR(i * 30 / cs.length, 0, 30 / cs.length + .02, 20, c)).join('');
const fCross = (bg, c1, x, c2) => fR(0, 0, 30, 20, bg) + (c1 ? fR(0, 8 - 0, 30, 4, c1) + fR(x - 2, 0, 4, 20, c1) : '') + (c2 ? fR(0, 8.8, 30, 2.4, c2) + fR(x - 1.2, 0, 2.4, 20, c2) : '');
const fStar = (cx, cy, r, c) => { let p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .4 : r; p.push((cx + rr * Math.cos(a)).toFixed(2) + ',' + (cy + rr * Math.sin(a)).toFixed(2)); } return `<polygon points="${p.join(' ')}" fill="${c}"/>`; };
const fCirc = (cx, cy, r, c) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`;
const fMoon = (cx, cy, r, bg, c) => fCirc(cx, cy, r, c) + fCirc(cx + r * .35, cy, r * .8, bg);
const FLAGS = {
  alb: () => fR(0, 0, 30, 20, '#E41E20') + `<path d="M15 4 l2 2 -1 1 2 2 -2 1 1 3 -3 2 -3 -2 1 -3 -2 -1 2 -2 -1 -1z" fill="#000"/>` + fCirc(13.4, 4, 1.3, '#000') + fCirc(16.6, 4, 1.3, '#000'),
  and: () => fV(['#10069F', '#FEDF00', '#D52B1E']) + fR(12.5, 7, 5, 6.5, '#D52B1E') + fR(13.2, 7.8, 3.6, 4.2, '#FEDF00'),
  blr: () => fR(0, 0, 30, 13.4, '#C8313E') + fR(0, 13.4, 30, 6.6, '#4AA657') + fR(0, 0, 3.4, 20, '#fff') + [2, 6, 10, 14, 18].map(y => `<path d="M1.7 ${y - 1.4} l1.2 1.4 -1.2 1.4 -1.2 -1.4z" fill="#C8313E"/>`).join(''),
  bel: () => fV(['#000', '#FAE042', '#ED2939']),
  bih: () => fR(0, 0, 30, 20, '#002395') + `<polygon points="9,0 23,0 23,20" fill="#FECB00"/>` + [0, 1, 2, 3, 4, 5, 6].map(i => fStar(8.4 + i * 2, 1 + i * 3, 1, '#fff')).join(''),
  bgr: () => fH(['#fff', '#00966E', '#D62612']),
  dnk: () => fCross('#C8102E', '#fff', 10),
  deu: () => fH(['#000', '#DD0000', '#FFCE00']),
  est: () => fH(['#0072CE', '#000', '#fff']),
  fin: () => fCross('#fff', '#003580', 10),
  fra: () => fV(['#0055A4', '#fff', '#EF4135']),
  geo: () => fR(0, 0, 30, 20, '#fff') + fR(0, 8.2, 30, 3.6, '#F00') + fR(13.2, 0, 3.6, 20, '#F00') + [[6.5, 4], [23.5, 4], [6.5, 16], [23.5, 16]].map(([x, y]) => fR(x - 2, y - .6, 4, 1.2, '#F00') + fR(x - .6, y - 2, 1.2, 4, '#F00')).join(''),
  grc: () => fH(['#0D5EAF', '#fff', '#0D5EAF', '#fff', '#0D5EAF', '#fff', '#0D5EAF', '#fff', '#0D5EAF']) + fR(0, 0, 11.1, 11.1, '#0D5EAF') + fR(0, 4.4, 11.1, 2.3, '#fff') + fR(4.4, 0, 2.3, 11.1, '#fff'),
  irl: () => fV(['#169B62', '#fff', '#FF883E']),
  isl: () => fCross('#02529C', '#fff', 10) + fR(0, 8.8, 30, 2.4, '#DC1E35') + fR(8.8, 0, 2.4, 20, '#DC1E35'),
  ita: () => fV(['#009246', '#fff', '#CE2B37']),
  hrv: () => fH(['#FF0000', '#fff', '#171796']) + fR(12.4, 6.2, 5.2, 7.2, '#fff') + fR(12.4, 6.2, 1.73, 1.8, '#F00') + fR(15.87, 6.2, 1.73, 1.8, '#F00') + fR(14.13, 8, 1.73, 1.8, '#F00') + fR(12.4, 9.8, 1.73, 1.8, '#F00') + fR(15.87, 9.8, 1.73, 1.8, '#F00') + fR(14.13, 11.6, 1.73, 1.8, '#F00'),
  lva: () => fR(0, 0, 30, 20, '#9E3039') + fR(0, 8, 30, 4, '#fff'),
  lie: () => fH(['#002B7F', '#CE1126']) + `<path d="M4 6 l1 -2 1 1.4 1 -1.4 1 2z" fill="#FFD83D"/>`,
  ltu: () => fH(['#FDB913', '#006A44', '#C1272D']),
  lux: () => fH(['#EF3340', '#fff', '#00A1DE']),
  mlt: () => fV(['#fff', '#CF142B']) + fR(1.4, 1.4, 3.2, .8, '#9AA0A6') + fR(2.6, .6, .8, 3.2, '#9AA0A6'),
  mda: () => fV(['#0046AE', '#FFD200', '#CC092F']) + fR(12.8, 7.6, 4.4, 4.8, '#B5651D') + fR(13.6, 8.4, 2.8, 2.4, '#CC092F'),
  mco: () => fH(['#CE1126', '#fff']),
  mne: () => fR(0, 0, 30, 20, '#D4AF37') + fR(1, 1, 28, 18, '#D3273E') + fCirc(15, 10, 3.2, '#D4AF37') + fR(13.6, 8, 2.8, 4, '#D4AF37'),
  nld: () => fH(['#AE1C28', '#fff', '#21468B']),
  mkd: () => fR(0, 0, 30, 20, '#D20000') + fCirc(15, 10, 3, '#FFE600') + [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return `<polygon points="${(15 + 3.2 * Math.cos(a - .12)).toFixed(2)},${(10 + 3.2 * Math.sin(a - .12)).toFixed(2)} ${(15 + 3.2 * Math.cos(a + .12)).toFixed(2)},${(10 + 3.2 * Math.sin(a + .12)).toFixed(2)} ${(15 + 10 * Math.cos(a)).toFixed(2)},${(10 + 10 * Math.sin(a)).toFixed(2)}" fill="#FFE600"/>`; }).join(''),
  nor: () => fR(0, 0, 30, 20, '#BA0C2F') + fR(0, 7, 30, 6, '#fff') + fR(7, 0, 6, 20, '#fff') + fR(0, 8.5, 30, 3, '#00205B') + fR(8.5, 0, 3, 20, '#00205B'),
  aut: () => fH(['#ED2939', '#fff', '#ED2939']),
  pol: () => fH(['#fff', '#DC143C']),
  prt: () => fR(0, 0, 12, 20, '#006600') + fR(12, 0, 18, 20, '#FF0000') + fCirc(12, 10, 3.6, '#FFE000') + fCirc(12, 10, 2.1, '#fff') + fR(11, 8.8, 2, 2.4, '#FF0000'),
  rou: () => fV(['#002B7F', '#FCD116', '#CE1126']),
  rus: () => fH(['#fff', '#0039A6', '#D52B1E']),
  smr: () => fH(['#fff', '#5EB6E4']) + fCirc(15, 10, 2.4, '#E5C34A') + fR(14, 9, 2, 2.4, '#3E8E41'),
  swe: () => fCross('#006AA7', '#FECC00', 10),
  che: () => fR(0, 0, 30, 20, '#F2F2F2') + fR(5, 0, 20, 20, '#DA291C') + fR(13, 4, 4, 12, '#fff') + fR(9, 8, 12, 4, '#fff'),
  srb: () => fH(['#C6363C', '#0C4076', '#fff']) + fR(6.4, 6.4, 4.4, 5.6, '#C6363C') + fR(7.2, 7.2, 2.8, 3.2, '#fff'),
  svk: () => fH(['#fff', '#0B4EA2', '#EE1C25']) + fR(5.4, 5.4, 6, 8, '#fff') + fR(6.2, 6.2, 4.4, 6, '#EE1C25') + fR(7.9, 7, 1.1, 4, '#fff') + fR(7, 8.2, 2.9, .9, '#fff'),
  svn: () => fH(['#fff', '#005DA4', '#ED1C24']) + fR(5.4, 3.8, 5.4, 6.2, '#005DA4') + fR(5.4, 3.8, 5.4, .6, '#fff'),
  esp: () => fR(0, 0, 30, 20, '#AA151B') + fR(0, 5, 30, 10, '#F1BF00') + fR(6, 7.4, 3.6, 5, '#AA151B'),
  cze: () => fH(['#fff', '#D7141A']) + `<polygon points="0,0 15,10 0,20" fill="#11457E"/>`,
  ukr: () => fH(['#0057B8', '#FFD700']),
  hun: () => fH(['#CD2A3E', '#fff', '#436F4D']),
  vat: () => fV(['#FFE000', '#fff']) + fR(20.4, 7, 1.4, 6.6, '#999') + fR(18.8, 9, 4.6, 1.2, '#999') + fR(17.6, 11.6, 1.2, 1.2, '#FFE000'),
  gbr: () => fR(0, 0, 30, 20, '#012169') + `<path d="M0 0 L30 20 M30 0 L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0 L30 20 M30 0 L0 20" stroke="#C8102E" stroke-width="1.6"/>` + fR(0, 7, 30, 6, '#fff') + fR(12, 0, 6, 20, '#fff') + fR(0, 8.2, 30, 3.6, '#C8102E') + fR(13.2, 0, 3.6, 20, '#C8102E'),
  tur: () => fR(0, 0, 30, 20, '#E30A17') + fMoon(11.2, 10, 4.2, '#E30A17', '#fff') + fStar(16.4, 10, 2, '#fff'),   // nur noch für „Meine Weltreise“ (world_pack_b.js) – Türkei ist nicht (mehr) in Europa Entdecker
  kos: () => fR(0, 0, 30, 20, '#244AA5') + `<polygon points="12.7,10.5 14.3,9.0 16.8,9.9 17.6,11.6 18.6,13.3 17.2,14.9 15.6,15.8 13.9,16.8 12.7,15.5 11.4,13.0 12.1,11.9" fill="#D0A650"/>` + [[8.4, 7.2], [10.7, 5.2], [13.5, 4.1], [16.5, 4.1], [19.3, 5.2], [21.6, 7.2]].map(([x, y]) => fStar(x, y, 1.1, '#fff')).join(''),
  cyp: () => fR(0, 0, 30, 20, '#fff') + `<path d="M8 10 q3 -4 6 -2 q3 -2 8 1 q-3 1 -5 2 q-4 2 -9 -1z" fill="#D57800"/><path d="M10 14 q5 3 10 0" stroke="#4E9A3E" stroke-width="1" fill="none"/>`
};
/* Flagge als <svg>-Bild; cls = Zusatzklasse. Fehlt eine Flagge, zeigt ein grauer Platzhalter statt eines Fehlers. */
function flagSVG(id, cls) {
  const f = FLAGS[id];
  return `<svg class="geo-flag ${cls || ''}" viewBox="0 0 30 20" role="img" aria-label="Flagge von ${esc((CBY[id] || {}).name || id)}" preserveAspectRatio="xMidYMid slice">${f ? f() : fR(0, 0, 30, 20, '#C9C6D6')}</svg>`;
}
