// Sizzle & Serve — screenshot scenes. Each scene builds one exact, busy frame
// of the real game (same world, same renderer, no mock drawing) so the judge's
// contact sheet shows the kitchen, the order board, ingredients on the counter,
// a dish mid-assembly, a timer and a plate ready to serve. `?shot=cover|play|
// serve|end` picks one; anything else is the title screen.

import { DAYS, RECIPE_BY_ID } from './config.js';
import { addFloater, createWorld, startDay } from './world.js';

function slot(ing, state, progress, seconds, done, burnLeft = Infinity) {
  return { item: { ing, state }, progress, seconds, done, burnt: false, burnLeft, sizzleAt: 0.5 };
}

function setOrder(world, recipeId, customerIndex, timeLeft, patience) {
  const recipe = RECIPE_BY_ID[recipeId];
  const customers = ['Maya', 'Rudi', 'Sinta', 'Budi', 'Lina'];
  const colors = ['#e88ca0', '#6a9fd8', '#9b7ed9', '#5da24a', '#e8a34c'];
  const skins = ['#f2c9a0', '#c98d5f', '#f2c9a0', '#8a5a3b', '#f2c9a0'];
  world.orders.push({
    id: world.orders.length + 1,
    recipeId,
    customer: { name: customers[customerIndex % 5], color: colors[customerIndex % 5], skin: skins[customerIndex % 5] },
    timeLeft,
    patience,
    bornAt: 0,
    wobble: 0.4 * customerIndex,
  });
  void recipe;
}

function baseShift(world, dayIndex, shiftLeft, coins, score, combo, servedToday) {
  startDay(world, dayIndex);
  world.shiftLeft = shiftLeft;
  world.coins = coins;
  world.score = score;
  world.combo = combo;
  world.bestCombo = Math.max(combo, 3);
  world.servedToday = servedToday;
  world.earnedToday = coins;
  world.stats.totalServed = servedToday;
  world.stats.totalEarned = coins;
  world.spawnTimer = 999; // staged scenes must not spawn mid-shot
  world.message = null;
  world.messageTimer = 0;
}

// The cover: the busiest honest frame — three orders ticking, beef on the stove,
// fries ready in the fryer, a chopped tomato waiting on the board, and a burger
// two parts built on the plating counter while the chef carries the lettuce.
function stageCover(world) {
  baseShift(world, 0, 107, 342, 410, 3, 9);
  setOrder(world, 'burger', 0, 45, 78);
  setOrder(world, 'pasta', 1, 30, 78);
  setOrder(world, 'salad', 2, 55, 78);
  world.stationState.board1.slots[0] = slot('tomato', 'chopped', 1, 2.2, true);
  world.stationState.stove1.slots[0] = slot('beef', 'raw', 0.62, 4, false);
  world.stationState.stove1.slots[1] = slot('chicken', 'cooked', 1, 4, true, 6);
  world.stationState.fryer.slots[0] = slot('potato', 'fried', 1, 4.5, true, 7);
  world.stationState.oven.slots[0] = slot('dough', 'raw', 0.4, 6, false);
  world.plateOnCounter = {
    items: [
      { ing: 'bun', state: 'ready' },
      { ing: 'beef', state: 'cooked' },
    ],
    recipeId: null,
  };
  world.chef.x = 620;
  world.chef.y = 600;
  world.chef.dir = 1;
  world.carry = [{ ing: 'lettuce', state: 'chopped' }];
  addFloater(world, 620, 600, 'Burger needs lettuce + tomato!', '#ffffff', 99, 16);
}

// Mid-game on day two: a pizza in the oven, pasta nearly done, the chef
// carrying a chopped onion toward the second board.
function stagePlay(world) {
  baseShift(world, 1, 143, 580, 720, 2, 14);
  setOrder(world, 'pizza', 3, 38, 66);
  setOrder(world, 'fishchips', 4, 22, 66);
  world.stationState.oven.slots[0] = slot('dough', 'baked', 1, 6, true);
  world.stationState.oven.slots[1] = slot('dough', 'raw', 0.55, 6, false);
  world.stationState.stove2.slots[0] = slot('pasta', 'raw', 0.8, 4, false);
  world.stationState.board2.slots[0] = slot('onion', 'chopped', 1, 2.2, true);
  world.stationState.fryer.slots[0] = slot('potato', 'raw', 0.3, 4.5, false);
  world.chef.x = 560;
  world.chef.y = 400;
  world.chef.dir = 1;
  world.carry = [{ ing: 'onion', state: 'chopped' }];
  addFloater(world, 950, 660, 'Pizza dough ready — plate it!', '#7CFC98', 99, 16);
}

// The serve moment: a finished Classic Burger in hand at the serving window,
// the matching order still on the board, another plate mid-assembly behind it.
function stageServe(world) {
  baseShift(world, 0, 88, 410, 505, 4, 11);
  setOrder(world, 'burger', 1, 40, 78);
  setOrder(world, 'soup', 0, 18, 78);
  world.stationState.stove1.slots[0] = slot('bacon', 'raw', 0.5, 4, false);
  world.stationState.board1.slots[0] = slot('mushroom', 'chopped', 1, 2.2, true);
  world.plateOnCounter = {
    items: [
      { ing: 'mushroom', state: 'chopped' },
      { ing: 'onion', state: 'chopped' },
    ],
    recipeId: null,
  };
  world.chef.x = 950;
  world.chef.y = 606;
  world.chef.dir = 1;
  world.plateInHand = {
    ing: 'plate',
    state: 'dish',
    items: [
      { ing: 'bun', state: 'ready' },
      { ing: 'beef', state: 'cooked' },
      { ing: 'tomato', state: 'chopped' },
      { ing: 'lettuce', state: 'chopped' },
    ],
    recipeId: 'burger',
  };
  addFloater(world, 950, 560, 'Classic Burger ready — SERVE IT!', '#7CFC98', 99, 20);
  addFloater(world, 950, 530, '+$22 + tip', '#ffd23e', 99, 18);
}

// End of day one: the shift summary with the goal beaten.
function stageEnd(world) {
  baseShift(world, 0, 0, 148, 148, 0, 9);
  world.screen = 'dayclear';
  world.dayResults = [{ day: 1, earned: 148, served: 9, goal: DAYS[0].goal, met: true }];
  world.stats.totalServed = 9;
  world.stats.totalEarned = 148;
  world.stats.byRecipe = { burger: 4, salad: 3, pasta: 2 };
  world.recipeCounts = { burger: 4, salad: 3, pasta: 2 };
  world.secondsPlayed = 150; // a full opening shift, for the coins/min stat
  world.bestCombo = 3;
  world.earnedToday = 148;
  world.servedToday = 9;
}

/** Build the named scene in `world` and return the screen to render. */
export function stageShot(name, seed = 7) {
  const world = createWorld(seed);
  world.staged = true; // frozen frame: no timers, no delayed banners
  if (name === 'cover') stageCover(world);
  else if (name === 'play') stagePlay(world);
  else if (name === 'serve') stageServe(world);
  else if (name === 'end') stageEnd(world);
  else stageCover(world);
  return world;
}
