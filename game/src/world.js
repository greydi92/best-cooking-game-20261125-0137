// Sizzle & Serve — the world: orders, stations, chef, scoring, the day.

import {
  BURN_AFTER, CARRY_MAX, CHEF_SPAWN, COOKING_TIPS, CRATES, DAYS, INGREDIENTS, MASTERY_BONUS,
  MASTERY_SERVES, MAX_STRIKES, PREP_STATIONS, RECIPES, RECIPE_BY_ID, RUSH_SECONDS, STATIONS,
  recipesForDay,
} from './config.js';
import { ANGRY_LINES, CHEF_BARKS, CUSTOMERS, SERVE_LINES } from './config.js';
import { checkDayAchievements, checkServeAchievements, createAchievementState, tickAchievements, checkBoardAchievements, checkBurnAchievements } from './achievements.js';
import { patienceDrain, spawnMultiplier, stationsFrozen, tickEvent, tipMultiplier, payMultiplier } from './events.js';
import { createRunStats, dayGrade, recordBurnt, recordFail, recordServe } from './stats.js';
import { createTutorialState, tickTutorial } from './tutorial.js';
import { spawnBurst, updateParticles } from './particles.js';
import {
  sfxBurnt, sfxChop, sfxChopDone, sfxCoin, sfxCookDone, sfxDayClear, sfxDayStart, sfxError,
  sfxGameOver, sfxGrade, sfxOrder, sfxPerfect, sfxPlace, sfxPlate, sfxRush, sfxServe,
  sfxSizzle, sfxSpecial, sfxStrike, sfxTrash, sfxPickup, sfxTick, sfxVip,
  setMusicRush,
} from './audio.js';

// ------------------------------------------------------------ seeded random
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------- world
export function createWorld(seed = 20261125) {
  const rand = mulberry32(seed);
  const world = {
    rand,
    screen: 'title',
    dayIndex: 0,
    shiftLeft: DAYS[0].shiftSeconds,
    shiftTotal: DAYS[0].shiftSeconds,
    coins: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    strikes: 0,
    served: 0,
    failed: 0,
    earnedToday: 0,
    servedToday: 0,
    dayGoalMet: false,
    orders: [],
    orderSeq: 0,
    spawnTimer: 4,
    rush: false,
    rushAnnounced: false,
    chef: { x: CHEF_SPAWN.x, y: CHEF_SPAWN.y, dir: 1, moving: false, speed: 265, interactFlash: 0 },
    moveTarget: null, // tap-to-move destination; keyboard input cancels it
    carry: [], // up to 3 ingredients in hand
    plateInHand: null, // the plate rides on its own tray slot, apart from carry
    stationState: {},
    plateOnCounter: null, // { items: [{ing, state}], recipeId }
    floaters: [],
    particles: [],
    message: null, // { text, sub, life, kind }
    messageTimer: 0,
    lastTickSecond: -1,
    stats: createRunStats(),
    runStats: null, // alias set below (same object as stats)
    achievements: createAchievementState(),
    tutorial: createTutorialState(),
    recipeCounts: {},
    stationsUsed: false,
    stationsBurnt: 0,
    dayBurnt: 0,
    dailySpecial: null,
    secondsPlayed: 0,
    dayGoal: DAYS[0].goal,
    bookOpened: false,
    activeEvent: null,
    eventMods: {},
    eventTimer: 45,
    eventDone: false,
    lastEventId: null,
    eventBanner: null,
    pendingVip: false,
    dayResults: [],
    shake: 0,
    hoverStation: null,
    hoverCrateItem: null,
    tipIndex: 0,
    tipTimer: 0,
  };
  for (const st of STATIONS) {
    world.stationState[st.id] = { slots: Array.from({ length: st.slots }, () => null) };
  }
  world.runStats = world.stats;
  return world;
}

export function dayConfig(world) {
  return DAYS[world.dayIndex];
}

export function comboMultiplier(world) {
  return Math.min(1 + world.combo * 0.25, 3);
}

// Has this recipe been served enough times in this run to count as mastered?
export function isMastered(world, recipeId) {
  return (world.recipeCounts?.[recipeId] ?? 0) >= MASTERY_SERVES;
}

// ------------------------------------------------------------------ orders
function pickRecipe(world) {
  const pool = recipesForDay(world.dayIndex + 1);
  const roll = world.rand();
  // Weight cheap early recipes a little higher so day one stays gentle.
  const sorted = [...pool].sort((a, b) => a.stars - b.stars || a.price - b.price);
  const index = Math.min(sorted.length - 1, Math.floor(Math.pow(roll, 1.4) * sorted.length));
  return sorted[index];
}

function pickCustomer(world) {
  return CUSTOMERS[Math.floor(world.rand() * CUSTOMERS.length)];
}

export function spawnOrder(world, forcedRecipeId = null) {
  const cfg = dayConfig(world);
  if (world.orders.length >= cfg.maxOrders) return null;
  const recipe = forcedRecipeId ? RECIPE_BY_ID[forcedRecipeId] : pickRecipe(world);
  // From day two, about one order in eight is a VIP: gold border, double pay,
  // but only 70% of the usual patience. They keep the board tense.
  const vip = world.pendingVip || (world.dayIndex >= 1 && world.rand() < 0.12);
  world.pendingVip = false;
  const patience = Math.round(cfg.patience * (vip ? 0.7 : 1) * (world.eventMods?.patienceMult ?? 1));
  const order = {
    id: world.orderSeq += 1,
    recipeId: recipe.id,
    customer: pickCustomer(world),
    timeLeft: patience,
    patience,
    vip,
    bornAt: world.shiftTotal - world.shiftLeft,
    wobble: world.rand() * Math.PI * 2,
  };
  world.orders.push(order);
  sfxOrder();
  checkBoardAchievements(world);
  addFloater(world, 640, 150, vip ? `VIP order: ${recipe.name}! Double pay!` : `New order: ${recipe.name}!`, vip ? '#ffd23e' : '#ffd23e', 1.6);
  return order;
}

function recipeMatchesPlate(recipe, items) {
  if (items.length !== recipe.components.length) return false;
  const want = recipe.components.map(([ing, state]) => `${ing}:${state}`).sort().join('|');
  const got = items.map((it) => `${it.ing}:${it.state}`).sort().join('|');
  return want === got;
}

export function plateRecipeId(items) {
  for (const recipe of RECIPES) {
    if (recipeMatchesPlate(recipe, items)) return recipe.id;
  }
  return null;
}

// ---------------------------------------------------------------- floaters
export function addFloater(world, x, y, text, color = '#ffffff', life = 1.4, size = 20) {
  world.floaters.push({ x, y, text, color, life, maxLife: life, size });
}

export function showMessage(world, text, sub = '', kind = 'info', life = 2.4) {
  world.message = { text, sub, kind, life, maxLife: life };
  world.messageTimer = life;
}

export function addParticles(world, x, y, kind, count = 10) {
  // Particle kinds: steam, spark, confetti, smoke, heart, star. The engine in
  // particles.js owns shapes and motion; the world only asks for bursts.
  spawnBurst(world.particles, world.rand, x, y, kind, count);
}

// -------------------------------------------------------------------- chef
const CHEF_RADIUS = 20;

function stationRects() {
  return [...CRATES, ...STATIONS].map((s) => ({ x: s.x, y: s.y, w: s.w, h: s.h, id: s.id }));
}

export function moveChef(world, dt, ix, iy) {
  const chef = world.chef;
  const len = Math.hypot(ix, iy);
  if (len < 0.01) {
    chef.moving = false;
    return;
  }
  chef.moving = true;
  if (ix !== 0) chef.dir = ix > 0 ? 1 : -1;
  const nx = chef.x + (ix / len) * chef.speed * dt;
  const ny = chef.y + (iy / len) * chef.speed * dt;
  const blocked = (x, y) => {
    if (x < 14 + CHEF_RADIUS || x > 1266 - CHEF_RADIUS) return true;
    if (y < 132 + CHEF_RADIUS || y > 786 - CHEF_RADIUS) return true;
    for (const r of stationRects()) {
      if (x + CHEF_RADIUS > r.x && x - CHEF_RADIUS < r.x + r.w && y + CHEF_RADIUS > r.y && y - CHEF_RADIUS < r.y + r.h) return true;
    }
    return false;
  };
  if (!blocked(nx, chef.y)) chef.x = nx;
  if (!blocked(chef.x, ny)) chef.y = ny;
}

export function nearestStation(world) {
  const chef = world.chef;
  let best = null;
  let bestDist = 78;
  for (const st of [...CRATES, ...STATIONS]) {
    const cx = Math.max(st.x, Math.min(chef.x, st.x + st.w));
    const cy = Math.max(st.y, Math.min(chef.y, st.y + st.h));
    const d = Math.hypot(chef.x - cx, chef.y - cy);
    if (d < bestDist) {
      bestDist = d;
      best = st;
    }
  }
  return best;
}

// -------------------------------------------------------------- interaction
// (Plates ride the tray slot, plateInHand — they never use the carry limit.)

export function grabFromCrate(world, crateId, slotIndex) {
  const crate = CRATES.find((c) => c.id === crateId);
  if (!crate) return false;
  const ingId = crate.items[slotIndex];
  if (!ingId) return false;
  if (world.carry.length >= CARRY_MAX) {
    showMessage(world, 'Hands full!', 'Your tray holds 3 items max.', 'warn', 1.4);
    sfxError();
    return false;
  }
  // Ingredients with no prep (bun, tortilla, cheese) are ready the moment
  // they leave the crate — their finished state is 'ready', never 'raw',
  // or the plating counter would refuse them as "still needs prep".
  world.carry.push({ ing: ingId, state: INGREDIENTS[ingId].prep === 'none' ? 'ready' : 'raw' });
  sfxPickup();
  addParticles(world, world.chef.x, world.chef.y - 24, 'spark', 4);
  return true;
}

function stationSlotFor(world, station, item) {
  const def = INGREDIENTS[item.ing];
  if (!def || item.state !== 'raw') return null;
  // Main prep (e.g. chicken cooks on the stove) …
  const prep = PREP_STATIONS[def.prep];
  if (prep && prep.station === station.kind) return { ...prep, resultState: def.state };
  // … or the alternate prep (chicken also fries into nuggets in the fryer).
  if (def.altPrep) {
    const alt = PREP_STATIONS[def.altPrep];
    if (alt && alt.station === station.kind) return { ...alt, resultState: def.altState };
  }
  return null;
}

export function interact(world) {
  const st = nearestStation(world);
  if (!st) return;
  const chef = world.chef;
  chef.interactFlash = 0.18;

  // Crates: E grabs the first ingredient (keys 1-4 pick a slot, click picks one).
  if (st.id && CRATES.some((c) => c.id === st.id)) {
    grabFromCrate(world, st.id, 0);
    return;
  }

  const state = world.stationState[st.id];
  if (!state) return;

  if (st.kind === 'plates') {
    if (world.plateInHand) {
      showMessage(world, 'Already holding a plate!', 'One tray at a time — plate it or bin it first.', 'warn', 1.4);
      sfxError();
      return;
    }
    world.plateInHand = { ing: 'plate', state: 'empty' };
    sfxPlate();
    addParticles(world, chef.x, chef.y - 20, 'spark', 5);
    return;
  }

  if (st.kind === 'trash') {
    if (world.carry.length === 0 && world.plateInHand) {
      world.plateInHand = null;
      sfxTrash();
      addFloater(world, chef.x, chef.y - 40, 'Plate binned', '#c9c9c9', 1.1, 16);
      return;
    }
    if (world.carry.length === 0) {
      showMessage(world, 'Nothing to toss.', '', 'info', 1.0);
      return;
    }
    const tossed = world.carry.pop();
    sfxTrash();
    addFloater(world, chef.x, chef.y - 40, tossed.ing === 'plate' ? 'Plate binned' : `${INGREDIENTS[tossed.ing].name} binned`, '#c9c9c9', 1.1, 16);
    return;
  }

  if (st.kind === 'serve') {
    serveDish(world);
    return;
  }

  if (st.kind === 'plating') {
    handlePlating(world);
    return;
  }

  // Prep stations: board / stove / fryer / oven.
  const slotIndex = state.slots.findIndex((s) => s !== null && (s.done || s.burnt));
  if (slotIndex >= 0) {
    const slot = state.slots[slotIndex];
    if (slot.burnt) {
      state.slots[slotIndex] = null;
      sfxTrash();
      addFloater(world, st.x + st.w / 2, st.y - 8, 'Burnt! Binned it.', '#ff6b6b', 1.2, 16);
      return;
    }
    if (world.carry.length >= CARRY_MAX) {
      showMessage(world, 'Hands full!', 'Make room before picking this up.', 'warn', 1.4);
      sfxError();
      return;
    }
    world.carry.push({ ing: slot.item.ing, state: slot.item.state });
    state.slots[slotIndex] = null;
    sfxPickup();
    return;
  }
  // Place a raw item that this station can prep.
  const heldIndex = world.carry.findIndex((it) => it.state === 'raw' && stationSlotFor(world, st, it));
  if (heldIndex < 0) {
    const anyRaw = world.carry.some((it) => it.state === 'raw');
    showMessage(world, anyRaw ? `This ${st.name.toLowerCase()} can't prep that.` : 'Nothing to prep here.', 'Grab a raw ingredient first.', 'info', 1.4);
    sfxError();
    return;
  }
  const emptyIndex = state.slots.findIndex((s) => s === null);
  if (emptyIndex < 0) {
    showMessage(world, `${st.name} is full!`, 'Wait for a slot to finish.', 'warn', 1.4);
    sfxError();
    return;
  }
  const item = world.carry.splice(heldIndex, 1)[0];
  const prep = stationSlotFor(world, st, item);
  world.stationsUsed = true;
  state.slots[emptyIndex] = { item: { ...item }, progress: 0, seconds: prep.seconds, done: false, burnt: false, burnLeft: 0, sizzleAt: 0, resultState: prep.resultState };
  sfxPlace();
  if (prep.sound === 'sizzle' || prep.sound === 'fry') sfxSizzle();
  if (prep.sound === 'chop') sfxChop();
}

function handlePlating(world) {
  const chef = world.chef;
  if (!world.plateOnCounter) {
    if (!world.plateInHand) {
      showMessage(world, 'Need a plate first!', 'Grab a clean plate from the plate stack.', 'info', 1.6);
      sfxError();
      return;
    }
    world.plateInHand = null;
    world.plateOnCounter = { items: [], recipeId: null };
    sfxPlate();
    return;
  }
  // Add a prepped ingredient that belongs on this plate: the first in hand
  // that keeps an ordered dish reachable, so a wrong item can never poison it.
  const plate = world.plateOnCounter;
  const fits = (it) => world.orders.some((o) => [...plate.items, it].every((x) => RECIPE_BY_ID[o.recipeId].components.some(([i, s]) => i === x.ing && s === x.state)));
  const foodIdx = world.carry.findIndex((it) => it.state !== 'raw' && fits(it));
  if (foodIdx < 0) {
    const held = world.carry.some((it) => it.state !== 'raw');
    if (held) {
      showMessage(world, 'Not for this plate!', 'That belongs on a different dish.', 'warn', 1.5);
      sfxError();
      return;
    }
    const rawIdx = world.carry.findIndex((it) => it.state === 'raw');
    if (rawIdx >= 0) {
      showMessage(world, 'That still needs prep!', 'Chop it, cook it or fry it first.', 'warn', 1.5);
      sfxError();
      return;
    }
    // Empty hands: pick the plate back up onto the tray.
    const items = world.plateOnCounter.items;
    world.plateOnCounter = null;
    world.plateInHand = { ing: 'plate', state: 'dish', items, recipeId: plateRecipeId(items) };
    sfxPickup();
    return;
  }
  if (plate.items.length >= 4) {
    showMessage(world, 'Plate is full!', 'Four parts max — serve it or bin it.', 'warn', 1.4);
    sfxError();
    return;
  }
  const item = world.carry.splice(foodIdx, 1)[0];
  plate.items.push(item);
  plate.recipeId = plateRecipeId(plate.items);
  sfxPlace();
  addParticles(world, 620, 700, 'spark', 6);
  if (plate.recipeId) {
    const recipe = RECIPE_BY_ID[plate.recipeId];
    addFloater(world, 620, 660, `${recipe.name} ready!`, '#7CFC98', 1.4, 22);
    sfxCookDone();
  }
  void chef;
}

function serveDish(world) {
  const dish = world.plateInHand;
  if (!dish || dish.state !== 'dish') {
    showMessage(world, dish ? 'Empty plate!' : 'Nothing to serve!', 'Build a dish on the plating counter first.', 'info', 1.6);
    sfxError();
    world.shake = 0.25;
    return;
  }
  const orderIndex = world.orders.findIndex((o) => o.recipeId === dish.recipeId);
  if (orderIndex < 0) {
    showMessage(world, 'No order for this dish!', dish.recipeId ? 'Nobody ordered it right now.' : 'This plate does not match any recipe.', 'warn', 1.8);
    sfxError();
    world.shake = 0.3;
    return;
  }
  const order = world.orders[orderIndex];
  const recipe = RECIPE_BY_ID[order.recipeId];
  const cfg = dayConfig(world);
  const timeFrac = Math.max(0, order.timeLeft / order.patience);
  const isPerfect = timeFrac > 0.75;
  const isSpecial = order.recipeId === world.dailySpecial;
  const isVip = order.vip === true;
  const tip = Math.round(recipe.price * cfg.tipRate * timeFrac * tipMultiplier(world));
  const mult = comboMultiplier(world);
  const specialMult = isSpecial ? 1.5 : 1;
  const vipMult = isVip ? 2 : 1;
  const perfectBonus = isPerfect ? Math.round(recipe.price * 0.25) : 0;
  // Recipe mastery: the third serve of the same dish (this one included)
  // unlocks a permanent +10% on every serve of that dish afterwards.
  const servesOfRecipe = (world.recipeCounts[recipe.id] ?? 0) + 1;
  const justMastered = servesOfRecipe === MASTERY_SERVES;
  const masteryMult = servesOfRecipe >= MASTERY_SERVES ? 1 + MASTERY_BONUS : 1;
  const earned = Math.round((recipe.price * specialMult + tip + perfectBonus) * mult * vipMult * payMultiplier(world) * masteryMult);
  world.plateInHand = null;
  world.orders.splice(orderIndex, 1);
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.coins += earned;
  world.score += earned;
  world.served += 1;
  world.servedToday += 1;
  world.earnedToday += earned;
  world.recipeCounts[recipe.id] = (world.recipeCounts[recipe.id] ?? 0) + 1;
  recordServe(world.stats, recipe.id, earned, tip, world.dayIndex + 1, isPerfect, isVip, isSpecial);
  checkServeAchievements(world, earned, tip, isPerfect, isVip, isSpecial);
  sfxServe();
  if (isPerfect) window.setTimeout(() => sfxPerfect(), 350);
  if (isVip) window.setTimeout(() => sfxVip(), 350);
  if (isSpecial) window.setTimeout(() => sfxSpecial(), 350);
  window.setTimeout(() => sfxCoin(), 250);
  addParticles(world, 950, 700, 'spark', 18);
  addParticles(world, 950, 700, 'confetti', 14);
  addFloater(world, 950, 660, `+${earned} coins`, '#ffd23e', 1.6, 26);
  if (tip > 0) addFloater(world, 950, 630, `Tip +${tip}  •  Combo x${mult.toFixed(2)}`, '#7CFC98', 1.6, 17);
  if (isPerfect) addFloater(world, 950, 600, '💎 PERFECT SERVE!', '#7CFC98', 1.8, 20);
  else if (isVip) addFloater(world, 950, 600, '🎩 VIP SERVED — double pay!', '#ffd23e', 1.8, 18);
  else if (isSpecial) addFloater(world, 950, 600, '🌶️ DAILY SPECIAL — 1.5x!', '#ff8a3d', 1.8, 18);
  if (justMastered) addFloater(world, 950, 540, `👑 MASTERED ${recipe.name} — +10% pay forever!`, '#ffd23e', 2.2, 18);
  const line = SERVE_LINES[Math.floor(world.rand() * SERVE_LINES.length)];
  addFloater(world, 950, 570, `${order.customer.name}: "${line}"`, '#ffffff', 2.0, 16);
  if (world.rand() < 0.25) {
    const bark = CHEF_BARKS[Math.floor(world.rand() * CHEF_BARKS.length)];
    addFloater(world, 640, 300, `Head Chef: ${bark}`, '#ffd23e', 1.8, 17);
  }
}

// -------------------------------------------------------------------- update
export function startDay(world, dayIndex) {
  world.dayIndex = dayIndex;
  const cfg = DAYS[dayIndex];
  world.dayGoal = cfg.goal;
  world.shiftLeft = cfg.shiftSeconds;
  world.shiftTotal = cfg.shiftSeconds;
  world.orders = [];
  world.spawnTimer = 3;
  world.rush = false;
  world.rushAnnounced = false;
  world.strikes = 0;
  world.earnedToday = 0;
  world.servedToday = 0;
  world.dayGoalMet = false;
  world.carry = [];
  world.plateInHand = null;
  world.plateOnCounter = null;
  world.floaters = [];
  world.particles = [];
  world.chef.x = CHEF_SPAWN.x;
  world.chef.y = CHEF_SPAWN.y;
  world.achievements.rushServes = 0;
  setMusicRush(false);
  world.dayBurnt = 0;
  world.activeEvent = null;
  world.eventMods = {};
  world.eventDone = false;
  world.eventTimer = 35 + world.rand() * 30;
  world.eventBanner = null;
  world.pendingVip = false;
  // The daily special: one recipe from today's menu, worth 1.5x all day.
  const pool = recipesForDay(dayIndex + 1);
  world.dailySpecial = pool[Math.floor(world.rand() * pool.length)].id;
  for (const st of STATIONS) world.stationState[st.id].slots.fill(null);
  world.screen = 'play';
  showMessage(world, cfg.name, cfg.intro, 'info', 3.2);
  sfxDayStart();
  window.setTimeout(() => {
    if (world.screen === 'play' && !world.staged) {
      showMessage(world, `🌶️ Today's special: ${RECIPE_BY_ID[world.dailySpecial].name}`, 'Worth 1.5x — prioritise it when it appears!', 'info', 3.0);
    }
  }, 3400);
  startMusicSafe();
}

function startMusicSafe() {
  // audio.js guards itself; dynamic import keeps world.js DOM-free in tests.
  import('./audio.js').then((m) => m.startMusic()).catch(() => {});
}

export function endDay(world, cleared) {
  const cfg = dayConfig(world);
  world.dayGoalMet = world.earnedToday >= cfg.goal;
  world.dayResults.push({
    day: world.dayIndex + 1,
    earned: world.earnedToday,
    served: world.servedToday,
    goal: cfg.goal,
    met: world.dayGoalMet,
  });
  checkDayAchievements(world);
  if (cleared) {
    const grade = dayGrade(world.dayResults[world.dayResults.length - 1], world.stats);
    window.setTimeout(() => sfxGrade(grade), 400);
  }
  if (cleared && world.dayIndex >= DAYS.length - 1) {
    world.screen = 'win';
    world.stats.daysCleared += 1;
    sfxDayClear();
  } else if (cleared) {
    world.screen = 'dayclear';
    world.stats.daysCleared += 1;
    sfxDayClear();
  } else {
    world.screen = 'gameover';
    sfxGameOver();
  }
}

function tickStations(world, dt) {
  const frozen = stationsFrozen(world);
  for (const st of STATIONS) {
    const state = world.stationState[st.id];
    if (!state) continue;
    for (let i = 0; i < state.slots.length; i += 1) {
      const slot = state.slots[i];
      if (!slot) continue;
      if (frozen && !slot.done) continue; // power cut: nothing cooks
      if (!slot.done) {
        slot.progress += dt / slot.seconds;
        slot.sizzleAt -= dt;
        if (slot.sizzleAt <= 0 && (st.kind === 'stove' || st.kind === 'fryer')) {
          slot.sizzleAt = 0.9;
          addParticles(world, st.x + st.w / 2, st.y + 10, 'steam', 1);
        }
        if (slot.progress >= 1) {
          slot.progress = 1;
          slot.done = true;
          // The finished state depends on which prep was used (chicken fried
          // in the fryer is 'fried'; the same chicken on the stove is 'cooked').
          slot.item.state = slot.resultState ?? INGREDIENTS[slot.item.ing].state;
          slot.burnLeft = BURN_AFTER[st.kind] ?? Infinity;
          if (st.kind === 'board') sfxChopDone();
          else sfxCookDone();
          addParticles(world, st.x + st.w / 2, st.y + 20, 'spark', 6);
        }
      } else if (!slot.burnt && Number.isFinite(slot.burnLeft)) {
        slot.burnLeft -= dt;
        if (slot.burnLeft <= 0) {
          slot.burnt = true;
          world.stationsBurnt += 1;
          world.dayBurnt += 1;
          recordBurnt(world.stats);
          checkBurnAchievements(world);
          sfxBurnt();
          addFloater(world, st.x + st.w / 2, st.y - 8, 'Burnt!', '#ff6b6b', 1.4, 18);
          addParticles(world, st.x + st.w / 2, st.y + 16, 'steam', 8);
        }
      }
    }
  }
}

function tickOrders(world, dt) {
  const drain = patienceDrain(world);
  for (let i = world.orders.length - 1; i >= 0; i -= 1) {
    const order = world.orders[i];
    order.timeLeft -= dt * drain;
    order.wobble += dt * 2;
    if (order.timeLeft <= 10 && !order.warned) {
      order.warned = true;
      addFloater(world, 640, 260, `${order.customer.name}'s ${RECIPE_BY_ID[order.recipeId].name} is about to expire!`, '#ff9a9a', 1.8, 17);
      sfxTick();
    }
    if (order.timeLeft <= 5 && order.timeLeft + dt * drain > 5) sfxTick();
    if (order.timeLeft <= 0) {
      world.orders.splice(i, 1);
      world.strikes += 1;
      world.failed += 1;
      world.stats.totalFailed += 1;
      recordFail(world.stats, world.dayIndex + 1);
      world.combo = 0;
      sfxStrike();
      world.shake = 0.4;
      const line = ANGRY_LINES[Math.floor(world.rand() * ANGRY_LINES.length)];
      addFloater(world, 640, 200, `${order.customer.name} left: "${line}"`, '#ff6b6b', 2.2, 18);
      showMessage(world, `Order expired! Strike ${world.strikes}/${MAX_STRIKES}`, 'Serve faster — patience runs out.', 'bad', 2.0);
      if (world.strikes >= MAX_STRIKES) {
        endDay(world, false);
        return;
      }
    }
  }
}

export function update(world, dt, input) {
  if (world.screen !== 'play') return;
  const cfg = dayConfig(world);
  world.secondsPlayed += dt;
  tickAchievements(world, dt);
  tickTutorial(world, dt);
  tickEvent(world, dt);
  if (world.eventBanner) {
    world.eventBanner.life -= dt;
    if (world.eventBanner.life <= 0) world.eventBanner = null;
  }

  // Shift clock.
  world.shiftLeft -= dt;
  const whole = Math.ceil(world.shiftLeft);
  if (whole !== world.lastTickSecond) {
    world.lastTickSecond = whole;
    if (whole <= 10 && whole > 0) sfxTick();
  }
  if (!world.rush && world.shiftLeft <= RUSH_SECONDS) {
    world.rush = true;
    setMusicRush(true);
    if (!world.rushAnnounced) {
      world.rushAnnounced = true;
      showMessage(world, 'RUSH HOUR!', 'Orders arrive twice as fast — hold on!', 'rush', 2.6);
      sfxRush();
    }
  }
  if (world.shiftLeft <= 0) {
    world.shiftLeft = 0;
    endDay(world, true);
    return;
  }

  // Order spawns.
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    spawnOrder(world);
    world.spawnTimer = cfg.spawnEvery * (world.rush ? 0.5 : 1) * spawnMultiplier(world) * (0.85 + world.rand() * 0.3);
  }

  tickOrders(world, dt);
  if (world.screen !== 'play') return;
  tickStations(world, dt);

  // Chef movement: keys first; otherwise walk toward a tap-to-move target.
  let ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let iy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (ix === 0 && iy === 0 && world.moveTarget) {
    const dx = world.moveTarget.x - world.chef.x;
    const dy = world.moveTarget.y - world.chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) {
      world.moveTarget = null;
    } else {
      ix = dx / dist;
      iy = dy / dist;
    }
  } else if (ix !== 0 || iy !== 0) {
    world.moveTarget = null;
  }
  moveChef(world, dt, ix, iy);
  if (world.chef.interactFlash > 0) world.chef.interactFlash -= dt;
  if (world.shake > 0) world.shake -= dt;

  // Floaters and particles.
  for (let i = world.floaters.length - 1; i >= 0; i -= 1) {
    const f = world.floaters[i];
    f.life -= dt;
    f.y -= 26 * dt;
    if (f.life <= 0) world.floaters.splice(i, 1);
  }
  updateParticles(world.particles, dt);
  if (world.messageTimer > 0) {
    world.messageTimer -= dt;
    if (world.messageTimer <= 0) world.message = null;
  }
  world.tipTimer += dt;
  if (world.tipTimer > 14) {
    world.tipTimer = 0;
    world.tipIndex = (world.tipIndex + 1) % COOKING_TIPS.length;
  }
}

// Trash the last carried item (Q key); with empty hands, bin the plate.
export function trashHeld(world) {
  if (world.carry.length === 0 && world.plateInHand) {
    world.plateInHand = null;
    sfxTrash();
    addFloater(world, world.chef.x, world.chef.y - 40, 'Plate binned', '#c9c9c9', 1.1, 16);
    return;
  }
  if (world.carry.length === 0) return;
  const tossed = world.carry.pop();
  sfxTrash();
  addFloater(world, world.chef.x, world.chef.y - 40, tossed.ing === 'plate' ? 'Plate binned' : `${INGREDIENTS[tossed.ing]?.name ?? tossed.ing} binned`, '#c9c9c9', 1.1, 16);
}
