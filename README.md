# Money Makes Money

You start with $30 million and it grows on its own. Below you is a town where every dollar changes hands: wages,
rent, the café, the barber. Every dollar you lock away is one that stops moving down there.

Hoard, and the town stalls: rents climb, shops shut, protest signs go up, and in the end it revolts. Spend, and it
comes alive, and you may find you're still getting richer. The game is built on the ideas in "Inequality in America
#4: Billionaires": money makes money, the velocity of money, buy-borrow-die and the upward vacuum of rent.

This is the first playable version: the billionaire's life, from 40 to 80.

## What's in it

- **Your fortune** earns 8% a year with no input. A game year lasts about 2 minutes at 1×.
- **The town**: 20 figures (each 100 households), a mill that sells outside town, four shops, a landlord and the
  out-of-town megastore. Every payment flies across the map as a green bill.
- **Moves**: buy homes (rent comes to you and rises fast), buy a shop (its owner is out, its staff cut), build a
  workshop (hires locals).
- **Gifts**: end poverty, house everyone, housing vouchers, childcare, wipe medical debt. Each costs what it takes in
  the town, shown with last year's cost.
- **Tax votes** every 8 years: pay, lobby or move your money out of state, with the time you'd take to earn it back.
- **Unrest** from calm to revolt, shown on the map as signs, evictions, tents and strikes.
- **Three endings**: Lex Luthor, revolt or hero (give at least 35% of your gains, keep unrest low, still finish
  richer than $30M).

## Building and checking

- `npm run build` joins `src/shell.html` and the numbered files in `src/game/` into `dist/index.html`. It fails,
  naming the file and line, on a slip, and rejects `Math.random()` in anything that changes the game (use `rnd()`).
- `npm run bot` plays whole lives headless on seeds 1–3 with three strategies and checks each reaches its ending:
  invest only → Lex Luthor, hoarder → revolt, hero → hero and still richer.
- `npm run shots` takes screenshots at 320 px, phone, phone landscape, tablet and desktop into `build/shots/`.
- `npm run check` runs all three.

Files `src/game/00-` to `09-` are the simulation: no DOM, so `tools/sim.mjs` can load them in Node. `10-` onwards
draw the map and the panels. `G` is the saved state (each field with its default in `FIELDS`, `02-state.js`) and
`R` is runtime only. The save stays on the device.

Every push to `main` publishes the page to GitHub Pages.
