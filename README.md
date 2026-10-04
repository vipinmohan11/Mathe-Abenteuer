# 🦊 Rechenhelden · Klasse 4

*(formerly Mathe-Abenteuer – the repo name, the file name `dist/Mathe-Abenteuer_Klasse4.html` and the storage key `mathe_abenteuer_v1` stay unchanged on purpose, so saved progress keeps working.)*

A small **offline math practice app** for a 4th-grader (German school, *Klasse 4*), with a playful reward system.
One static web app, no server, no accounts, no tracking (sounds can be switched off). The UI is in **German**.

**Topics (so far)** – modular, more workbook chapters can be added:

| Module | Content |
|---|---|
| **Teilen mit Zehnern** (workbook A4 · Division durch Zehnerzahlen) | Dividing by tens – 8 exercises |
| **Rechnen mit Geld** (workbook A5 · Geld) | Euro and cent: writing amounts, adding/subtracting, rounding, offers, change, tickets – 7 exercises |
| **Extra-Training** (not from the workbook, `extra:true`) | **Einmaleins** (×, :, missing number, rows), **Kopfrechnen** (plus/minus to 1000, doubling/halving), **Schriftlich rechnen** (written addition/subtraction) |

Short, literal titles and a maths symbol per exercise (owner's choice). Upcoming workbooks (A1–A3, B1–D5) are shown locked as “Kommt bald”.

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

- **Home** answers one question: *what should I practise now?* (continue the group in progress, else the first open group of the earliest chapter, else a revision). Navigation: **Start · Meine Hefte · Meine Welt · Mein Profil**. Chapters A–D × books 1–5 (A → Herbstferien, B → Weihnachtsferien, C → Osterferien, D → Sommerferien; optional dates in the parent area), Extra-Training, locked upcoming books.
- **Economy:** 🪙 coins (earned by maths work, spent **only in the shop**), ⭐ stars (permanent proof, never spent), stamps (milestones in the Achievement Book). Flames are retired (old balances became coins, 1 flame = 3 coins; the daily streak stays as a display). Every reward says where it came from ("Neu verdient").
- **Hard-earned only:** block credits only pay improvements over the previous best. A finished group can be revised after 7+ days for a small capped reward (max 15 coins per round). The mistakes notebook pays nothing.
- **Ownership is permanent; creativity is time-boxed:** finishing a level or the daily goal opens a short *Kreativzeit* (default 5 min, max 2 per day; parent settings: after practice / always open / locked = classroom mode). It applies to avatar editing, sticker placement in the book and the music workshop (closed before the first creative session). Everything autosaves; there is a gentle notice at the end. Achievements stay viewable when locked.
- **Shop:** every unlock is a purchase here (max 5 min per day, parent-adjustable). Locked things stay visible, greyed, with price and "noch X 🪙", plus one saving goal. Few things are free (skin tone, basic hair, one drum sound).
- **Features:** Avatar (quick identity setup, earned extras; Fino can be renamed with 6 earnable names + a custom-name item) · Mein Buch (Achievement Book: one page per workbook with progress, stamps and 4 sticker spaces, printable certificate) · Insel (visual record of finished groups on fixed spots) · Wesen (hatch from stars, no care, no punishment) · Story (12 episodes as milestones, pays nothing) · Schatzkammer (one earned card per chest, 475+ cards) · Musik-Werkstatt (one drum + 8 steps at the start; sounds/bars earned) · Pokale.
- **Look (Rechenhelden):** colourful but uncluttered, the whole interface follows the chosen theme (8 themes; id `sonne` is shown as “Himmelblau” – never rename the id). No pink. Locked rewards stay colourful with a padlock and their real price/condition. Each correct answer (also a corrected one) gets a short star burst (≤ 0.9 s, no extra coins, off in calm mode / reduced motion); wrong answers show red + ✕ with encouragement. Fonts Baloo 2 + Nunito (OFL, subset, embedded). No pinch/double-tap zoom.
- **Profile:** picture, level, coins, stars, trophies, cards. `S.name` = real name (greeting + certificate), `S.avName` = optional nickname of the own avatar (profile only).

## Parents (Eltern area)

- Protected by a **4-digit PIN** (set on first use). An **8-digit recovery code** is shown once – write it down.
- Settings: child's name, **Tagesziel** (tasks per day for flame/streak/chest), optional **Tageslimit** (minutes per day; only active time counts; PIN-protected unlock for the day).
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
- **As an app icon on a tablet:** host it (GitHub Pages: *Settings → Pages → Deploy from branch → `main` / root*), open the URL in Chrome → ⋮ → **Add to Home screen**. The repo root is an installable **PWA** (`index.html`, `manifest.webmanifest`, `sw.js`, icons) and works offline after the first load.

## Develop

```bash
npm install          # only needed for the tests (jsdom)
python3 build.py     # builds dist/Mathe-Abenteuer_Klasse4.html and the PWA files in the repo root
npm test             # build + generator checks + UI flow tests
```

| File | Purpose |
|---|---|
| `src/gen.js` | question generators per topic (`MODULES` registry) – **add a new workbook chapter here** |
| `src/mascot.js` | SVG mascot skins, hats, extras, backgrounds, themes, `SHOP` catalogue and prices |
| `src/rewards.js`, `src/icons.js`, `src/boot.js` | catalogue + plugin API, SVG icon set, startup |
| `src/feat_*.js/.css` | one file pair per reward feature (avatar, buch, insel, musik, schatz, story, wesen) |
| `src/ui.css`, `src/fonts/` | Rechenhelden look (loaded last), embedded woff2 fonts + OFL licence |
| `src/story_data.js` | story episodes |
| `src/cards.js` | Schatzkammer cards (ids must never change; append new ones) |
| `src/store.js` | state, persistence, decks, rewards, trophies, answer checking, PIN, daily limit |
| `src/app.js` | exercise engine, shop, parent area, events |
| `src/shell.js` | navigation, Start, Meine Hefte (chapters A–D + extras), Meine Welt, Mein Profil, appearance, Fino name, creative-time/shop timers |
| `src/style.css` | styles and colour themes |
| `build.py` | concatenates everything into one HTML file (+ PWA files) |
| `tools/make_icons.py` | renders the app icons from the mascot |
| `tests/` | `gen_test.js` (18,000 generated questions: arithmetic, placeholders, accepted answers), `extra_test.js`, `flow_test.js` (full UI flows in jsdom: decks, resume, reset caps, review, Fehler-Heft, PIN, limit, shop, chests, v1 migration), `migrate_test.py` (old data → new build), `economy_test.py` (creative time, shop time, revision, chapters), `avatar_test.py`, `musik_test.py`, `themes_test.py` (all views × all themes), `shots4.py` (Playwright screenshots), `compare_save.py` (check a real exported save against the new build) |

### Adding a topic

1. Write a generator `g_xxx(level)` in `src/gen.js` returning either a *field question* (`{title, html with [[i]] placeholders, fields:[{a, digit?, strict?, money?, next?}], hint, explain}`) or a *choice question* (`{title, prompt, choices, correct, hint, explain}`).
2. Register it in `MODULES`: workbook ids `A1`–`D5` (chapter letter + book number 1–5); anything else needs `extra:true` and appears under Extra-Training. Never change existing ids.
3. `npm test` – the generator test validates every question.

## Notes

- Mascot “Fino” and all skins are original artwork drawn in code.
- Personal side project; not affiliated with any school or publisher.
