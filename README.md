# 🦊 Mathe-Abenteuer · Klasse 4

A small **offline math practice app** for a 4th-grader (German school, *Klasse 4*), with a playful reward system.
One static web app, no server, no accounts, no sound, no tracking. The UI is in **German**.

**Topics (so far)** – modular, more workbook chapters can be added:

| Module | Content |
|---|---|
| **A4 · Division** | Dividing by tens (Division durch Zehnerzahlen) – 8 groups |
| **A5 · Geld** | Euro and cent: counting, writing amounts, adding/subtracting, multiplying, change – 7 groups |

All questions are **generated** by code (`src/gen.js`); no workbook content is copied. Every answer has a hint and a worked explanation.

## How practice works

- Each **group** has **30 fixed questions** in 3 *Stufen* (levels 1–3, 10 questions each). Leave any time and continue where you stopped.
- Points per question: **2** (first try), **1** (second try or after hint), **0** (solution shown). Max **20 per Stufe, 60 per group**.
- **Reset** of a group needs the parent PIN and creates a new question set. Rewards are capped per group, so resetting can't be used to farm coins or stars.
- **Fehler ansehen:** after every Stufe (and for the whole group) the wrong questions can be reviewed with the child's answer, the right answer and the explanation.
- **Fehler-Heft:** collects every question not solved on the first try; solving it on the first try removes it (no coins).
- **Mini-Test:** 15 random questions, 12 minutes, no hints. Rewarded once per day.

## Rewards (meant to be earned, not handed out)

| | |
|---|---|
| 🪙 Coins | for points; also drive the player level |
| ⭐ Stars | for well-solved Stufen (≥ 10 / 14 / 18 of 20 points = 1 / 2 / 3 stars) and Mini-Tests |
| 🔥 Flames | for reaching the daily goal; bonuses for streaks |
| 📦 Treasure chests | for good Stufen, finished groups, daily goal, good tests → open to **collect cards** |
| 📚 Collection album | 67 funny facts, jokes and riddles (`src/cards.js`) |
| 🏆 Trophies | ~45, incl. 6 secret ones; medals 🥉🥈🥇💎 per group |
| 🛍️ Shop | characters, hats, extras, backgrounds, colour themes, frames – priced in coins, stars **or** flames. Purchases ask “Are you sure?” and **cannot be undone**. |

**Characters** (all original, one name “Fino”): fox, hedgehog, mouse, cat, rabbit, robot, penguin, dragon, pony.
Backgrounds incl. city, school, underwater. Final colour theme: **Türkis-Blau**.

## Parents (Eltern area)

- Protected by a **4-digit PIN** (set on first use). An **8-digit recovery code** is shown once – write it down.
- Settings: child's name, **Tagesziel** (tasks per day for flame/streak/chest), optional **Tageslimit** (minutes per day; only active time counts; PIN-protected unlock for the day).
- Overview per group, “needs practice” hint, printable report, **backup export/import** (JSON).

## Data safety

- The app never deletes progress – there is **no “delete all”**.
- Saved in `localStorage` + a second copy in `IndexedDB` + two rolling snapshots (every 30 min); persistent storage is requested.
- Data is lost **only** if the browser's site data / cookies are cleared. Don't use private windows. Use *Eltern → Export* for a backup file.
- Storage is **per web address / file location**. A new address (e.g. moving from the local file to the hosted app) starts empty → export on the old one, import on the new one.
- Old v1 progress is migrated automatically (`mergeState` in `src/store.js`).

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
| `src/cards.js` | collection-album cards (ids must never change; append new ones) |
| `src/store.js` | state, persistence, decks, rewards, trophies, answer checking, PIN, daily limit |
| `src/app.js` | views, engine, events, boot |
| `src/style.css` | styles and colour themes |
| `build.py` | concatenates everything into one HTML file (+ PWA files) |
| `tools/make_icons.py` | renders the app icons from the mascot |
| `tests/` | `gen_test.js` (18,000 generated questions: arithmetic, placeholders, accepted answers), `extra_test.js`, `flow_test.js` (full UI flows in jsdom: decks, resume, reset caps, review, Fehler-Heft, PIN, limit, shop, chests, v1 migration), `shots.py` (Playwright screenshots) |

### Adding a topic

1. Write a generator `g_xxx(level)` in `src/gen.js` returning either a *field question* (`{title, html with [[i]] placeholders, fields:[{a, digit?, strict?, money?, next?}], hint, explain}`) or a *choice question* (`{title, prompt, choices, correct, hint, explain}`).
2. Register it in `MODULES` (new module = new book chapter, e.g. A1/A6).
3. `npm test` – the generator test validates every question.

## Notes

- Mascot “Fino” and all skins are original artwork drawn in code.
- Personal side project; not affiliated with any school or publisher.
