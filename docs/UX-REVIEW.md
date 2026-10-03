# The UI and UX review

A regular look at how the game looks and works, from a player's side. Each review picks a few improvements, ships them
the usual way (branch, bot, screenshots, PR, green `check`, squash merge), and leaves a short note in `docs/ux/`.

## 1. Look

1. `npm run build`, then `node tools/shots.mjs` and look at every screenshot in `build/shots/`. They cover every size:
   phone at 320 px, phone portrait and landscape, tablet, and desktop.
2. Play a few minutes in a browser too (a small Playwright script in `build/`). Do it at least on a phone in
   portrait: start a life, answer a card, change speed, open each tab, reach an ending.
3. Read the last two notes in `docs/ux/`, so a review builds on the last one instead of repeating it.

## 2. Judge

Go through these questions in order, and write down what you see before deciding what to change:

- **First minute.** Does a new player know what to do, and why it matters, without reading much?
- **The decision.** Is each card's choice clear at a glance (who gains, who pays), with nothing cut off at 320 px?
- **The stage.** Do the impacts show on the stage and the town, not as text? Is each caption short?
- **Panels.** Is anything crowded, repeated or hard to find? Does each tab lead with what matters most this year?
- **Feedback.** Does every tap answer at once? Is anything flickering, jumping or refreshing under the finger?
- **Reach.** Can thumbs reach the controls? Is there room for the phone camera? Is every target at least 40 px?
- **Text.** Is it concise, in UK English, and free of jargon? Do the glossary chips explain it where needed?
- **Access.** Is the contrast good? Does colour-blind mode work? Is the stage calm under reduced motion? Can you play
  with the keys alone?
- **Consistency.** Do buttons, chips, cards and spacing behave the same way on every rung?

Respect the owner's preferences in `CLAUDE.md`. In particular, hide locked items instead of greying them out, and
make sure every size works.

## 3. Change

- Pick one to three improvements, the ones a player would feel most for the least risk. Each is a small PR of its own
  (or one PR if they're tiny), with before and after screenshots described in the PR.
- Anything bigger (a new layout, a new tab, a change of flow) goes in `docs/ROADMAP.md` as a proposal for the owner
  instead of being built.
- Never change the economy in a UI review. The bot must pass with pacing unchanged.

## 4. Note

Add `docs/ux/<yyyy-mm-dd>.md`. Keep it to five to fifteen lines:

- what you looked at;
- what worked;
- what you changed (with the PR numbers);
- what you proposed;
- what to look at next time.
