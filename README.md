[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/greydi92/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/greydi92/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Sizzle & Serve — 18 recipes, 16 ingredients, 5 stations, 3 days

A complete cooking game that runs in a desktop browser from static files, no network. Run the kitchen: grab ingredients from four crates, chop on the boards, cook on the stoves, fry, bake, plate the dish to match the order, and serve it before patience runs out — across three days of escalating lunch and dinner rush, with combo scoring and a rush hour at the end of every shift.

**Bounty:** [Make the best cooking game — best-cooking-game-20261125-0137](https://make.fun/bounty/best-cooking-game-20261125-0137) · $250 shared by the top 10 · deadline 2026-11-25 20:37 WIB.

## Play

```sh
node serve.ts
# open http://localhost:8080
```

Move with WASD or arrow keys. **E** interacts, **1–4** grab from the nearest crate (or click an ingredient), **Q** bins what you hold, **P** pauses, **H** shows how to play, **M** mutes. Sound is synthesised live with WebAudio — no audio files.

## The game

- **18 recipes** (Garden Salad to Supreme Pizza), each with its own parts, price and star rating; later days unlock harder dishes.
- **16 ingredients** across 4 crates (Produce, Meat & Fish, Bakery, Pantry), each needing the right prep: chop, cook, fry or bake.
- **5 station types**: chopping boards, stoves, fryer, oven, plating counter — plus clean plates, a serving window and a trash sink. Food left too long burns.
- **Orders with timers** on the order board; fast serves earn tips, streaks build a combo multiplier up to 3x; an expired order is a strike, and 3 strikes end the shift.
- **3 days** with bigger goals, more concurrent orders, shorter patience, and a rush hour in the last 30 seconds of every shift.
- **Screenshots** are staged frames of the real game (`?shot=cover|play|serve|end`).

## How a dish gets made

1. **Grab** — stand by a crate, press `1–4` or click an ingredient. You can carry 3 things.
2. **Prep** — chop on a board (2.2s), cook on a stove (4s), fry in the fryer (4.5s), bake in the oven (6s). A finished item flashes READY — grab it before it burns.
3. **Plate** — take a clean plate, put it on the plating counter, add the recipe's parts. A matching plate glows green.
4. **Serve** — carry the finished plate to the Serving Window and press E. Fast serves earn tips; streaks build the combo.

## Scoring

| Thing | Pays |
| --- | --- |
| Dish price | $14–$26 by recipe |
| Speed tip | Up to +50–60% of price, by patience left |
| Perfect serve (>75% patience left) | +25% bonus |
| Combo | +25% per streak step, up to 3x |
| Daily special | 1.5x |
| VIP order (gold border, day 2+) | 2x, but only 70% patience |
| Shift events | Double Tip Hour, Happy Hour, Inspector +25%, and more |

An expired order is a strike and resets the combo. Three strikes end the shift.

## The menu

| Day | Recipes |
| --- | --- |
| 1 | Garden Salad $14 · Mushroom Soup $16 · Veggie Wrap $17 · Classic Burger $22 · Tomato Pasta $19 |
| 2 | Fish & Chips $20 · Cheese Burger $24 · Chicken Sandwich $21 · Margherita Pizza $23 · Bacon & Egg Roll $18 |
| 3 | Nuggets & Fries $19 · Full Breakfast $26 |

Press **B** in game for the full recipe book with steps for every dish. **H** shows how to play; **P** pauses (with a menu); **M** mutes. Best runs are saved in your browser, and 25 achievements track everything from first serve to a clean three-day clear.

## Systems under the hood

- **Daily special** — one recipe a day pays 1.5x; announced at the start of each shift.
- **VIP orders** — from day 2, ~1 in 8 orders is a VIP: gold border, double pay, 70% patience.
- **Shift events** — one surprise per day: Double Tip Hour, Happy Hour, Health Inspector, Celebrity Chef, Food Critic, Lunch Rush, Quiet Hour, Power Cut (stations freeze), Grease Fire (a pan burns instantly), Golden Hour (+50% pay, double tips), Rainy Day (slow and patient), or a VIP table / Table of Six arriving.
- **Rush hour** — the last 30 seconds of every shift double the order rate and speed up the music.
- **Perfect serves** — serve with over 75% patience left for a +25% bonus and a diamond flash.
- **Combo** — every consecutive serve adds +25% pay, up to 3x; one expired order resets it.
- **Achievements** — 24 milestones with toast popups, from First Serve to Three Day Wonder.
- **Tutorial hints** — contextual first-time hints that never repeat in a run.
- **Local leaderboard** — your top 5 runs on this browser, shown on the title screen.
- **Sound** — all synthesised live with WebAudio: chops, sizzles, serve fanfares, a walking bass loop that speeds up in rush hour, and soft kitchen ambience. No audio files.

## Layout

- `game/index.html` + `game/style.css` — the page shell.
- `game/src/config.js` — ingredients, recipes, stations, days, customers.
- `game/src/world.js` — orders, stations, chef, scoring, day flow.
- `game/src/render.js` — all canvas drawing, including every ingredient's vector art.
- `game/src/input.js`, `game/src/audio.js`, `game/src/shots.js`, `game/src/main.js` — input, synthesised sound, screenshot scenes, game loop.
- `main.ts` — the hand-in program (Node 22): copies `game/` + `screenshots/` to `/output` and writes `dossier.json`.

## License

MIT — see [LICENSE](LICENSE).
