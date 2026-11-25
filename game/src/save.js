// Sizzle & Serve — best-run records, kept in localStorage when the browser
// allows it. Everything is guarded: the hosted version of the game may run in
// a context without storage, and the game must never break over a record.

const KEY = 'sizzle-and-serve-best-v1';

export function loadBest() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    return {
      coins: Number(data.coins) || 0,
      served: Number(data.served) || 0,
      bestCombo: Number(data.bestCombo) || 0,
      daysCleared: Number(data.daysCleared) || 0,
      achievements: Number(data.achievements) || 0,
      date: typeof data.date === 'string' ? data.date : '',
    };
  } catch {
    return null;
  }
}

export function saveBest(world) {
  const record = {
    coins: world.coins,
    served: world.stats.totalServed,
    bestCombo: world.bestCombo,
    daysCleared: world.stats.daysCleared,
    achievements: world.achievements.unlocked.length,
    date: new Date().toISOString().slice(0, 10),
  };
  const prev = loadBest();
  const better = !prev
    || record.coins > prev.coins
    || (record.coins === prev.coins && record.served > prev.served);
  if (!better) return { saved: false, record: prev };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    // Storage unavailable (private mode, hosted sandbox): the run still counts.
    return { saved: false, record };
  }
  return { saved: true, record, beat: prev };
}

export function clearBest() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

// A short line for the title screen: either the record to beat or an invite.
export function bestLine() {
  const best = loadBest();
  if (!best || best.coins <= 0) return 'No best run yet — this kitchen is waiting for its first legend.';
  const days = best.daysCleared > 0 ? ` • cleared ${best.daysCleared} day${best.daysCleared > 1 ? 's' : ''}` : '';
  return `Best run: ${best.coins} coins • ${best.served} dishes • combo x${best.bestCombo}${days} (${best.date})`;
}
