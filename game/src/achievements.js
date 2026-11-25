// Sizzle & Serve — achievements: eighteen little milestones that pop as toasts
// while you cook. They are pure recognition (no score effect) and they persist
// across days inside one run, so a good run keeps unlocking things.

import { sfxAchievement } from './audio.js';

export const ACHIEVEMENTS = [
  { id: 'first-serve',   name: 'First Serve',      desc: 'Serve your very first dish.',                       icon: '🍽️' },
  { id: 'five-served',   name: 'Five Star Service', desc: 'Serve 5 dishes in one run.',                    icon: '⭐' },
  { id: 'ten-served',    name: 'Double Figures',   desc: 'Serve 10 dishes in one run.',                   icon: '🌟' },
  { id: 'twenty-served', name: 'Kitchen Machine',  desc: 'Serve 20 dishes in one run.',                   icon: '🏭' },
  { id: 'combo-3',       name: 'On A Roll',        desc: 'Reach a 3-dish combo streak.',                  icon: '🔥' },
  { id: 'combo-5',       name: 'Unstoppable',      desc: 'Reach a 5-dish combo streak.',                  icon: '🚀' },
  { id: 'combo-8',       name: 'Legendary Chef',   desc: 'Reach an 8-dish combo streak.',                 icon: '👑' },
  { id: 'perfect-serve', name: 'Perfect Serve',    desc: 'Serve a dish with over 75% patience left.',     icon: '💎' },
  { id: 'tip-20',        name: 'Big Tipper',       desc: 'Earn a tip of 10 coins or more on one dish.',   icon: '💰' },
  { id: 'rich-100',      name: 'Triple Figures',   desc: 'Hold 100 coins at once.',                       icon: '🪙' },
  { id: 'rich-300',      name: 'Money Bags',       desc: 'Hold 300 coins at once.',                       icon: '💵' },
  { id: 'rich-600',      name: 'Restaurant Tycoon', desc: 'Hold 600 coins at once.',                      icon: '🏆' },
  { id: 'all-recipes',   name: 'Full Menu',        desc: 'Serve every one of the 18 recipes.',            icon: '📖' },
  { id: 'vip-serve',     name: 'VIP Treatment',    desc: 'Serve a VIP customer.',                         icon: '🎩' },
  { id: 'special-serve', name: 'Special Of The Day', desc: 'Serve the daily special.',                   icon: '🌶️' },
  { id: 'no-strike-day', name: 'Clean Shift',      desc: 'Finish a day with zero strikes.',              icon: '✨' },
  { id: 'rush-survivor', name: 'Rush Survivor',    desc: 'Serve 3 dishes during one rush hour.',         icon: '⏰' },
  { id: 'three-days',    name: 'Three Day Wonder', desc: 'Clear all three days.',                         icon: '🎉' },
  { id: 'smoke-alarm',   name: 'Smoke Alarm',      desc: 'Burn 3 pans in one run. The kitchen forgives.', icon: '🔥' },
  { id: 'speedy-8',      name: 'Speedy Service',   desc: 'Serve 8 dishes in a single day.',               icon: '💨' },
  { id: 'full-house',    name: 'Full House',       desc: 'Have 4 orders on the board at once.',           icon: '🏠' },
  { id: 'menu-master',   name: 'Menu Master',      desc: 'Serve 6 different recipes in one run.',         icon: '🎖️' },
  { id: 'master-chef',   name: 'Master Chef',      desc: 'Master a recipe by serving it 3 times in one run.', icon: '👑' },
  { id: 'no-burn-day',   name: 'No Burnt Pans',    desc: 'Finish a day without burning anything.',        icon: '🧯' },
  { id: 'early-bird',    name: 'Early Bird',       desc: 'Serve a dish in the first 30 seconds of a day.', icon: '🐦' },
];

// The runtime state lives on the world object (world.achievements) so a fresh
// run starts clean and the renderer can read the toast queue directly.
export function createAchievementState() {
  return {
    unlocked: [],
    toasts: [], // { achievement, life }
    rushServes: 0,
  };
}

export function unlockAchievement(world, id) {
  const state = world.achievements;
  if (!state || state.unlocked.includes(id)) return null;
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (!def) return null;
  state.unlocked.push(id);
  state.toasts.push({ achievement: def, life: 3.2, maxLife: 3.2 });
  if (state.toasts.length > 3) state.toasts.shift();
  sfxAchievement();
  return def;
}

export function tickAchievements(world, dt) {
  const state = world.achievements;
  if (!state) return;
  for (let i = state.toasts.length - 1; i >= 0; i -= 1) {
    state.toasts[i].life -= dt;
    if (state.toasts[i].life <= 0) state.toasts.splice(i, 1);
  }
}

// Called after every serve: streaks, tips, totals and menu coverage.
export function checkServeAchievements(world, earned, tip, wasPerfect, wasVip, wasSpecial) {
  if (world.served >= 1) unlockAchievement(world, 'first-serve');
  if (world.served >= 5) unlockAchievement(world, 'five-served');
  if (world.served >= 10) unlockAchievement(world, 'ten-served');
  if (world.served >= 20) unlockAchievement(world, 'twenty-served');
  if (world.combo >= 3) unlockAchievement(world, 'combo-3');
  if (world.combo >= 5) unlockAchievement(world, 'combo-5');
  if (world.combo >= 8) unlockAchievement(world, 'combo-8');
  if (wasPerfect) unlockAchievement(world, 'perfect-serve');
  if (tip >= 10) unlockAchievement(world, 'tip-20');
  if (world.coins >= 100) unlockAchievement(world, 'rich-100');
  if (world.coins >= 300) unlockAchievement(world, 'rich-300');
  if (world.coins >= 600) unlockAchievement(world, 'rich-600');
  if (wasVip) unlockAchievement(world, 'vip-serve');
  if (wasSpecial) unlockAchievement(world, 'special-serve');
  if (world.rush) {
    world.achievements.rushServes += 1;
    if (world.achievements.rushServes >= 3) unlockAchievement(world, 'rush-survivor');
  }
  const servedRecipes = new Set(Object.keys(world.recipeCounts ?? {}).filter((k) => (world.recipeCounts[k] ?? 0) > 0));
  if (servedRecipes.size >= 18) unlockAchievement(world, 'all-recipes');
  if (servedRecipes.size >= 6) unlockAchievement(world, 'menu-master');
  if (Object.values(world.recipeCounts ?? {}).some((c) => c >= 3)) unlockAchievement(world, 'master-chef');
  if (world.servedToday >= 8) unlockAchievement(world, 'speedy-8');
  if (world.shiftTotal - world.shiftLeft <= 30) unlockAchievement(world, 'early-bird');
}

// Called when a new order lands: a full board is its own milestone.
export function checkBoardAchievements(world) {
  if (world.orders.length >= 4) unlockAchievement(world, 'full-house');
}

// Called when a pan burns: three burnt pans is a (dubious) honour.
export function checkBurnAchievements(world) {
  if (world.stationsBurnt >= 3) unlockAchievement(world, 'smoke-alarm');
}

// Called when a day ends cleanly.
export function checkDayAchievements(world) {
  if (world.strikes === 0) unlockAchievement(world, 'no-strike-day');
  if (world.stats.totalBurnt === 0 || world.dayBurnt === 0) unlockAchievement(world, 'no-burn-day');
  if (world.dayIndex >= 2 && world.screen === 'win') unlockAchievement(world, 'three-days');
}
