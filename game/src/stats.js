// Sizzle & Serve — run statistics. Every serve, burn and expiry is recorded
// here so the day-clear screen can show a real breakdown (best dish, busiest
// recipe, accuracy) instead of a single number.

export function createRunStats() {
  return {
    totalServed: 0,
    totalEarned: 0,
    totalFailed: 0,
    totalBurnt: 0,
    totalTips: 0,
    perfectServes: 0,
    vipServes: 0,
    specialServes: 0,
    bestCombo: 0,
    daysCleared: 0,
    // recipeId -> dishes served
    byRecipe: {},
    // day number -> { earned, served, failed }
    byDay: {},
  };
}

export function recordServe(stats, recipeId, earned, tip, day, perfect, vip, special) {
  stats.totalServed += 1;
  stats.totalEarned += earned;
  stats.totalTips += tip;
  stats.byRecipe[recipeId] = (stats.byRecipe[recipeId] ?? 0) + 1;
  stats.byDay[day] = stats.byDay[day] ?? { earned: 0, served: 0, failed: 0 };
  stats.byDay[day].earned += earned;
  stats.byDay[day].served += 1;
  if (perfect) stats.perfectServes += 1;
  if (vip) stats.vipServes += 1;
  if (special) stats.specialServes += 1;
}

export function recordFail(stats, day) {
  stats.totalFailed += 1;
  stats.byDay[day] = stats.byDay[day] ?? { earned: 0, served: 0, failed: 0 };
  stats.byDay[day].failed += 1;
}

export function recordBurnt(stats) {
  stats.totalBurnt += 1;
}

export function favouriteRecipe(stats) {
  let best = null;
  let bestCount = 0;
  for (const [id, count] of Object.entries(stats.byRecipe)) {
    if (count > bestCount) {
      bestCount = count;
      best = id;
    }
  }
  return best === null ? null : { recipeId: best, count: bestCount };
}

export function serveAccuracy(stats) {
  const total = stats.totalServed + stats.totalFailed;
  if (total === 0) return 100;
  return Math.round((stats.totalServed / total) * 100);
}

export function coinsPerMinute(stats, secondsPlayed) {
  if (secondsPlayed <= 0) return 0;
  return Math.round((stats.totalEarned / secondsPlayed) * 60);
}

export function dayBreakdown(stats, day) {
  const d = stats.byDay[day];
  if (!d) return { earned: 0, served: 0, failed: 0 };
  return d;
}

// A one-line verdict for the end screen, picked from how the run actually went.
export function runVerdict(stats) {
  if (stats.totalServed >= 30) return 'A true kitchen legend — the whole town is talking.';
  if (stats.totalServed >= 20) return 'Head chef material. The pass never stood a chance.';
  if (stats.totalServed >= 12) return 'Solid service. The regulars are coming back.';
  if (stats.totalServed >= 6) return 'A promising first service — the stove believes in you.';
  if (stats.totalServed >= 1) return 'You served real food to real people. That counts.';
  return 'The kitchen is patient. The customers… less so. Try again.';
}

// A letter grade for one day: earnings vs goal, accuracy, and burnt pans.
export function dayGrade(dayResult, stats) {
  if (!dayResult) return '—';
  let points = 0;
  if (dayResult.met) points += 2;
  if (dayResult.earned >= dayResult.goal * 1.5) points += 1;
  if (dayResult.served >= 8) points += 1;
  if (serveAccuracy(stats) >= 90) points += 1;
  if (stats.totalBurnt === 0) points += 1;
  if (points >= 5) return 'S';
  if (points >= 4) return 'A';
  if (points >= 3) return 'B';
  if (points >= 2) return 'C';
  return 'D';
}

export function gradeBlurb(grade) {
  const blurbs = {
    S: 'Flawless. The critic is writing poetry about your kitchen.',
    A: 'Excellent service — barely a pan out of place.',
    B: 'Good cooking with room to grow. Watch the timers.',
    C: 'The food was fine. The pace needs work.',
    D: 'A rough shift. Chop faster, serve faster, breathe.',
  };
  return blurbs[grade] ?? '';
}

// One structured summary of a whole run, for the end screens and the debug
// hook: every number the day-clear and finale screens show, in one place.
export function shiftReport(world) {
  const stats = world.stats;
  const fav = favouriteRecipe(stats);
  return {
    day: world.dayIndex + 1,
    coins: world.coins,
    earnedToday: world.earnedToday,
    servedToday: world.servedToday,
    totalServed: stats.totalServed,
    totalEarned: stats.totalEarned,
    totalFailed: stats.totalFailed,
    totalBurnt: stats.totalBurnt,
    totalTips: stats.totalTips,
    perfectServes: stats.perfectServes,
    vipServes: stats.vipServes,
    specialServes: stats.specialServes,
    bestCombo: world.bestCombo,
    accuracy: serveAccuracy(stats),
    coinsPerMinute: coinsPerMinute(stats, world.secondsPlayed),
    favourite: fav,
    grade: world.dayResults.length > 0 ? dayGrade(world.dayResults[world.dayResults.length - 1], stats) : '—',
    achievements: world.achievements.unlocked.length,
  };
}
