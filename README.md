# 🦊 Denkzauber · Klasse 4

*(formerly Mathe-Abenteuer – the repo name, the file name `dist/Mathe-Abenteuer_Klasse4.html` and the storage key `mathe_abenteuer_v1` stay unchanged on purpose, so saved progress keeps working.)*

A small **offline math practice app** for a 4th-grader (German school, *Klasse 4*), with a playful reward system.
One static web app, no server, no accounts, no tracking (sounds can be switched off). The UI is in **German**.

**Topics (so far)** – modular, more workbook chapters can be added:

| Module | Content |
|---|---|
| **Teilen mit Zehnern** (workbook A4 · Division durch Zehnerzahlen) | Dividing by tens – 8 exercises |
| **Rechnen mit Geld** (workbook A5 · Geld) | Euro and cent: writing amounts, adding/subtracting, rounding, offers, change, tickets – 7 exercises |
| **Extra Spaß** (not from the workbook, `extra:true`; formerly “Extra-Training”) | **Einmaleins** (×, :, missing number, rows), **Kopfrechnen** (plus/minus to 1000, doubling/halving), **Schriftlich rechnen** (written addition/subtraction) |

Besides maths there are two **learning worlds** (see below): **Europa Entdecker** (geography quiz and discovery) and **Meine Weltreise** (a calm, star-paid travel reward with a passport).

Short, literal titles and a maths symbol per exercise (owner's choice). Upcoming workbooks (A1–A3, B1–D5) are shown locked as “bald”.

All questions are **generated** by code (`src/gen.js`); no workbook content is copied. Every answer has a hint and a worked explanation.

## How practice works

- Each **group** has **30 fixed questions** in 3 *Stufen* (10 each), harder from Stufe to Stufe, easy and hard questions alternating. Leave any time and continue where you stopped.
- Every question is worth **1–4 points**, shown only as a symbol: 🟢 = 1, 🔵 = 2, 🔥 = 3, 👑 = 4 (no words like “easy/hard” – a legend is on the group screen). Fixed mix per Stufe: **15 / 25 / 35 = 75 points per group**, so skipping the hard ones never pays.
- First try = full points, second try or hint = half (rounded down, so a 1-point question gives 0), solution shown = 0. Coins = points; they are credited only above the best result of that Stufe.
- Groups that were already started (or finished) with the old 2-points-per-question scoring are **never rebuilt**: they keep their questions, results and the old 60-point scale. Only completely untouched old groups get the new, harder questions.
- **Neue Runde** (🔁): once all 30 questions of a group are done, the child can start a new round with fresh questions and earn coins/stars again. Medal, trophies and wallet stay; the best round is remembered.
- **Reset** of a group needs the parent PIN and creates a new question set. Rewards are capped per group, so resetting can't be used to farm coins or stars.
- **Fehler ansehen:** after every Stufe (and for the whole group) the wrong questions can be reviewed with the child's answer, the right answer and the explanation.
- **Fehler-Heft:** collects every question not solved on the first try; solving it on the first try removes it (no coins).
- **Mini-Test:** 15 random questions, 12 minutes, no hints. Per day the **best** result counts: a better later test pays only the difference (7–9 → 3 🪙 + 1 ⭐, 10–11 → 6 + 2, 12 → 6 + 2 + card, 13–15 → 10 + 3 + card; max per day unchanged). A weak first test no longer uses up the day's reward. „Alle Hefte gemischt“ uses workbook modules only.

## The loop: practise → see what you learned → earn something → enjoy it briefly

- **Start is the hub** (no bottom tabs). Top left the profile, next to it the wallet chips (coins → Shop, stars → Profil, cards → Schatzkammer, trophies → Pokale). A greeting card shows a **seed-to-tree** picture of today's goal (seed at 0 %, full tree with fruits at 100 %). Below, four square cards: **Meine Hefte · Europa Entdecker · Extra Spaß · Meine Welt**.
- **Navigation:** every section opens from Start and the *Zurück* button always returns to the page you really came from (it shows that page's name). Android's back button follows the same history. Practice, test and result screens are never part of the history.
- **Meine Hefte:** compact cards *Los geht's* (continue exactly where you stopped), *Fehler-Heft*, *Mini-Test* and a reserved hidden slot; below, the chapters **A–D** as an accordion (only one open at a time), five books per row so A1–A5 always stay visible (A → Herbstferien, B → Weihnachtsferien, C → Osterferien, D → Sommerferien; optional dates in the parent area).
- **Extra Spaß:** Einmaleins, Kopfrechnen, Schriftlich rechnen (+ one reserved hidden slot).
- **Meine Welt:** Lustige Fakten · Meine Musik · Shop · *<Fino's name>s Geschichte* · Meine Weltreise. Meine Wesen, Mein Buch and Meine Insel are **hidden by default** and can be switched on by a parent (Eltern → Zusatzfunktionen); what was collected in them is always kept.
- **Profil** (tap the profile on Start): level, name, big tiles for stars / coins / cards / trophies, saving goal, *Das bin ich*, *Meine Pokale*, *Farben & Töne*. Once the child's name is saved the field disappears (parents can change it in the Eltern area).
- **Fino's name:** renaming and the Fino-Namen shop items were removed (round 3). A name saved earlier is kept and still replaced everywhere in the UI, including possessives (“Finos Geschichte” → “Mias Geschichte”).
- **Greeting:** Start greets by the device's local time and the child's name (Guten Morgen 5–10, Guten Tag 11–13, Schönen Nachmittag 14–17, Guten Abend 18–21, Hallo Nachteule otherwise).
- **Home symbol:** two or more steps away from Start, a house button appears in the middle of the top bar (Reader/Story, Europa Entdecker, Weltreise, Shop, …). It never resets or changes any data.
- **Shop → Fino → Extras:** Brille, Schal, Sonnenbrille, Fliege, Kopfhörer, Blume im Ohr, Goldmedaille, Glitzersterne, Heldencape (all drawn for every figure). The Fino-Insel category is gone; *Meine Insel* (learning record) is separate and unchanged.
- **Economy:** 🪙 coins (earned by maths work, spent **only in the shop**), ⭐ stars (permanent proof, never spent), stamps (milestones in the Achievement Book). Flames are retired (old balances became coins, 1 flame = 3 coins; the daily streak stays as a display). Every reward says where it came from ("Neu verdient").
- **Hard-earned only:** block credits only pay improvements over the previous best. A finished group can be revised after 7+ days for a small capped reward (max 15 coins per round). The mistakes notebook pays nothing.
- **Ownership is permanent; creativity is time-boxed:** finishing a level or the daily goal opens a short *Kreativzeit* (default 5 min, max 2 per day; parent settings: after practice / always open / locked = classroom mode). It applies to avatar editing, sticker placement in the book and the music workshop (closed before the first creative session). Everything autosaves; there is a gentle notice at the end. Achievements stay viewable when locked.
- **Shop:** every unlock is a purchase here (max 5 min per day, parent-adjustable). Locked things stay visible, greyed, with price and "noch X 🪙", plus one saving goal. Few things are free (skin tone, basic hair, one drum sound).
- **Features (Meine Welt):** Lustige Fakten (29 safe facts about animals, nature, space, body, numbers, world – no rewards) · Avatar (quick identity setup, earned extras; Fino's old name, if one was saved earlier, is kept; renaming and the Fino-Insel shop category were removed) · Mein Buch (Achievement Book: one page per workbook with progress, stamps and 4 sticker spaces, printable certificate) · Insel (visual record of finished groups on fixed spots) · Wesen (hatch from stars, no care, no punishment) · Story (12 episodes as milestones, pays nothing) · Schatzkammer (one earned card per chest, 475+ cards) · Musik-Werkstatt (one drum + 8 steps at the start; sounds/bars earned) · Pokale.
- **Look (design system “Meine Weltreise”):** calm, rounded and uncluttered. All colours, radii, shadows and motion are **tokens** (`--dz-*` in `src/dz.css`); the 8 themes (id `sonne` is shown as “Nebelblau” – never rename the id) only change tokens. Every card, tile and panel has a thin border in the theme's accent tone. Shared components (square tile, grid, accordion, hero, chips, tree, passport art) live in `src/dz.js`. No pink. Locked things stay visible with a padlock and their real price/condition. Each correct answer gets a short star burst (≤ 0.9 s, off in calm mode / reduced motion). Fonts: system rounded stack with embedded Nunito as fallback. No pinch/double-tap zoom.
- **Names:** `S.name` = real name (greeting + certificate), `S.avName` = optional nickname of the own avatar (profile only), `S.finoName` = the mascot's name.

## Europa Entdecker (geography)

50 European countries, only facts that are 100 % certain (`src/geo_data.js`, simple SVG flags). **Spielen:** Quiz (capital choose/type/reverse, flags), Flaggen, Größer? (area), Reiseroute (which country borders both A and B), Memory. **Entdecken:** Länderkarten, Wusstest du?, Meine Stempel (one per known country, milestone ladder), Land des Tages. Rounds have 10 or 15 questions; feedback comes at the end, answers can be changed until submit, and leaving a round asks first. Rewards share the normal coin bucket with a daily cap (best result of the day counts), plus one-time milestones at 10/25/50 known countries and 8 trophies. Existing coins, cards and trophies are never changed.

## Meine Weltreise and Mein Reisepass (reward, no coins)

A calm reward in *Meine Welt*. **Stars pay for it, nothing is lost:** free Stars = lifetime Stars − Stars already spent on countries. Opening a country spends Stars **once** and it stays open forever; lifetime Stars, Wesen, trophies, coins and cards are never touched, and the Weltreise itself pays **no coins and no cards**. Deutschland is free, Japan and Indien cost 10 ⭐ each; more countries (20 planned) can be added as data in `src/world_data.js`.

- Each country has six free-order stations: **Ankunft, Orte, Alltag, Sprache** (with spoken words where the device has a voice), **Essen, Rätsel** (4 questions, a souvenir from 3 right, unlimited tries).
- **Mein Reisepass** looks like a real passport: a data page (photo, signature, passport number, name, nationality “Weltentdecker/in”, birth date/place and residence, grade, companion, title, issue/expiry, authority, machine-readable lines) and an entry page with trip data (visited countries, entry stamps, souvenirs, last entry) and **airport-style entry stamps with the date** (after 4 of 6 stations). Parents can fill in optional birth date, birth place and residence behind the PIN; everything stays on the device.

## Parents (Eltern area)

- Protected by a **4-digit PIN** (set on first use). An **8-digit recovery code** is shown once – write it down.
- Settings: child's name, avatar name, **Tagesziel** (tasks per day for flame/streak/chest), optional **Tageslimit** (minutes per day; only active time counts; PIN-protected unlock for the day), creative time, **Zusatzfunktionen** (show/hide Meine Wesen, Mein Buch, Meine Insel), Weltreise passport details.
- Overview per group, “needs practice” hint, printable report, **backup export/import** (JSON). Import shows a before/after table (coins, stars, solved tasks, finished exercises, cards, trophies, items, beats) and checks it after loading; the previous state is kept under `mathe_abenteuer_preimport`.

## Data safety

- The app never deletes progress – there is **no “delete all”**.
- Saved in `localStorage` + a second copy in `IndexedDB` + two rolling snapshots (every 30 min); persistent storage is requested.
- Data is lost **only** if the browser's site data / cookies are cleared. Don't use private windows. Use *Eltern → Export* for a backup file.
- Storage is **per web address / file location**. A new address (e.g. moving from the local file to the hosted app) starts empty → export on the old one, import on the new one.
- Old v1 progress is migrated automatically (`mergeState` in `src/store.js`).
- **Before switching the child to a new version:** export her save in the old app, then run `python3 tests/compare_save.py dist/Mathe-Abenteuer_Klasse4.html <export>.json` (loads it into a fresh browser, compares field by field, never touches her browser).

## Use it

- **Local file:** open `dist/Mathe-Abenteuer_Klasse4.html` (single self-contained file, works offline).
- **Hosted:** <https://vipinmohan11.github.io/Mathe-Abenteuer/> (GitHub Pages, installable PWA).
- **As an app icon on a tablet:** host it (GitHub Pages: *Settings → Pages → Deploy from branch → `main` / root*), open the URL in Chrome → ⋮ → **Add to Home screen**. The repo root is an installable **PWA** (`index.html`, `manifest.webmanifest`, `sw.js`, icons) and works offline after the first load.

## Develop

```bash
npm install          # only needed for the tests (jsdom)
python3 build.py     # builds dist/Mathe-Abenteuer_Klasse4.html and the PWA files in the repo root
npm test             # build + generator checks + UI flow tests (jsdom)
npm run test:all     # additionally all Playwright suites (needs python3 + playwright + Chromium)
```

| File | Purpose |
|---|---|
| `src/gen.js` | question generators per topic (`MODULES` registry) – **add a new workbook chapter here** |
| `src/mascot.js` | SVG mascot skins, hats, extras, backgrounds, themes, `SHOP` catalogue and prices |
| `src/rewards.js`, `src/icons.js`, `src/boot.js` | catalogue + plugin API, SVG icon set, startup |
| `src/feat_*.js/.css` | one file (pair) per feature (avatar, buch, insel, musik, schatz, story, wesen, fakten, geo = Europa Entdecker, welt = Weltreise/Reisepass) |
| `src/geo_data.js`, `src/world_data.js` | data for Europa Entdecker (50 countries) and Meine Weltreise (country packs, stations, scenes) |
| `src/dz.css`, `src/dz.js` | Design tokens, shared components, navigation (back stack); `dz.css` loads last |
| `src/ui.css`, `src/fonts/` | Remaining inner-page styles, embedded woff2 fonts + OFL licence |
| `src/story_data.js` | story episodes |
| `src/cards.js` | Schatzkammer cards (ids must never change; append new ones) |
| `src/store.js` | state, persistence, decks, rewards, trophies, answer checking, PIN, daily limit |
| `src/app.js` | exercise engine, shop, parent area, events |
| `src/shell.js` | Start, Meine Hefte (chapters A–D), Extra Spaß, Meine Welt, Profil, appearance, Fino name, creative-time/shop timers |
| `src/style.css` | base styles |
| `build.py` | concatenates everything into one HTML file (+ PWA files) |
| `tools/make_icons.py` | renders the app icons from the mascot |
| `tests/` | `gen_test.js` (48,000 generated questions: arithmetic, placeholders, accepted answers), `extra_test.js`, `flow_test.js` (full UI flows in jsdom: decks, resume, reset caps, review, Fehler-Heft, PIN, limit, shop, chests, v1 migration), `migrate_test.py` (old data → new build), `economy_test.py` (creative time, shop time, revision, chapters), `avatar_test.py`, `musik_test.py`, `geo_test.py` (Europa Entdecker), `world_test.py` (Weltreise: Stars spent once, nothing lost, stamps, parent area), `dz_test.py` (navigation and back stack, Fino rename, hidden features, borders, passport, overflow at 360/820/1280 px), `themes_test.py` (all views × all themes), `shots4.py`/`shots.py` (Playwright screenshots), `compare_save.py` (check a real exported save against the new build) |

### Adding a topic

1. Write a generator `g_xxx(level)` in `src/gen.js` returning either a *field question* (`{title, html with [[i]] placeholders, fields:[{a, digit?, strict?, money?, next?}], hint, explain}`) or a *choice question* (`{title, prompt, choices, correct, hint, explain}`).
2. Register it in `MODULES`: workbook ids `A1`–`D5` (chapter letter + book number 1–5); anything else needs `extra:true` and appears under Extra Spaß. Never change existing ids.
3. `npm test` – the generator test validates every question.

## Notes

- Mascot “Fino” and all skins are original artwork drawn in code.
- Personal side project; not affiliated with any school or publisher.

### Running the Playwright suites

```bash
cd tests && H=$(realpath ../dist/Mathe-Abenteuer_Klasse4.html)
for t in migrate economy avatar musik themes geo world dz; do python3 ${t}_test.py $H; done
```
