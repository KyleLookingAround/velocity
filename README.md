# Money Makes Money

You start with $30 million and it grows on its own. Below you is a town where every dollar changes hands: wages,
rent, the café, the barber. Every dollar you lock away is one that stops moving down there.

Hoard, and the town stalls: rents climb, shops shut, protest signs go up, and in the end it revolts. Spend, and it
comes alive, and you may find you're still getting richer. The game is built on the ideas in "Inequality in America
#4: Billionaires": money makes money, the velocity of money, buy-borrow-die and the upward vacuum of rent.


## How it plays

Time runs on its own: your fortune compounds and the town's economy steps forward a week at a time, at the speed you
choose. Every few months a **decision card** arrives and the game waits for you: a developer offering a street of
homes, a shop owner who'll sell, the council asking for a workshop, your accountant suggesting you borrow against your
shares, a senator who can kill the next tax vote, a charity asking you to fund shelters. Each option says what it does
for you and what it does to the town, and one is **your accountant's pick**: whatever makes the most money. (Turn on
"Let your accountant decide" on the Story tab and the game plays itself that way.)

The screen is a **stage** of two scenes, drawn like the video: on the left, **you** (at your desk with the vault
filling, signing a deed, shaking a senator's hand, loading the moving truck); on the right, **the town**: the
spending chain from shopper to cashier to barber to café, or the consequences of what you've done (families evicted,
tents in the park, shutters coming down, strikes and marches, kids at the nursery your money pays for). Each scene
slides into the next like a camera panning across the map, and half the time someone walks up to the edge of the
scene and the camera follows them: the figure on the right of one scene is the figure on the left of the next.

## The ladder

The game is a ladder of roles, one per rung: down by money, back up by votes. Four rungs are built; each starts in
the town the last one left.

- **The billionaire** (40 years): $30M at 8% a year. Gifts you've been asked for can be started or stopped on the
  **Commitments** tab. Endings: **Lex Luthor**, **revolt**, or **hero** (give at least 35% of your gains, keep unrest
  low, still finish richer than $30M). Giving from the start costs you; growing first and giving later pays.
- **The landlord** (20 years): you play Agnes in the town the billionaire left. Its homes and shops pass to its
  estate, which raises rents 7% a year; a hero's gifts carry on as a foundation. You decide the yearly rent, what to
  do about each tenant who falls six weeks behind, repairs, buying homes from the estate, and the tenants' union. Home
  prices follow rents and the town's mood, and the bank calls the loan if it outgrows the homes. Endings: **fair**,
  **rentier**, or **bankrupt**.
- **The law firm partner** (20 years): you play Theo, on $2,400 an hour, the top of the video's pay table (a billion
  takes about 200 years). Agnes runs the homes the way you did. Each year you set your hours, and burnout follows
  them. The rich pay best: loopholes for the estate (which starve the town's public works), Agnes's evictions, the
  mill against its union. The town can't pay: a tenant facing eviction, the union itself. Endings: **hired gun**,
  **counsel for the town**, or **burnt out**.
- **The shop owner** (20 years): you play Bea, who runs the café. Its customers spend the town's wages, including the
  ones you pay; rent on the premises goes to Agnes. You set prices (every rise sends customers to the megastore),
  pay, and where supplies come from (the megastore is cheaper, but that money leaves town). The estate may offer to
  buy you out; late on, investors may offer to make you a **founder**: the shortcut straight back to a billionaire
  life, which changes nothing. Endings: **pillar of the high street**, **kept the lights on**, **closed**, **sold**,
  or **founder**.

## Building and checking

- `npm run build` joins `src/shell.html` and the numbered files in `src/game/` into `dist/index.html`. It fails,
  naming the file and line, on a slip, and rejects `Math.random()` in anything that changes the game (use `rnd()`).
- `npm run bot` plays whole lives headless on seeds 1–3, answering every card by a strategy, and checks each reaches
  its ending: takes nothing → Lex Luthor, always the accountant → revolt, generous within its means → hero and still
  richer, patient (generous after 15 years) → hero and at least four times richer. Then a fair and a gouging landlord
  in the town each billionaire leaves: fair → fair (or at least solvent after a revolt), gouger → never fair. Then
  three partners in the towns those landlords leave: always the accountant → hired gun, always the town → counsel,
  75-hour weeks → burnt out. Then three shop owners: generous → pillar, the accountant → sold, the accountant's
  prices, pay and supplies without selling → closed.
- `npm run shots` takes screenshots at 320 px, phone, phone landscape, tablet and desktop into `build/shots/`, each
  from a save made headless: a card waiting, a hoarder's town, a giver's commitments, an ending, and the landlord.
- `npm run check` runs all three.

Files `src/game/00-` to `09-` are the simulation (economy, fortune, landlord, cards): no DOM, so `tools/sim.mjs` can
load them in Node. `10-` onwards draw the stage and the panels. A new card is one entry in `CARDS` (`07-cards.js`); a
new scene is one entry in `SCENES` (`10-stage.js`). `G` is the saved state (each field with its default in `FIELDS`, `02-state.js`) and
`R` is runtime only. The save stays on the device.

Every push to `main` publishes the page to GitHub Pages.
