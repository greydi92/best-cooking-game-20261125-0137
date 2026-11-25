// Sizzle & Serve — the local leaderboard: the five best runs on this browser,
// kept in localStorage when the browser allows it. It is the "beat your own
// best" loop between shifts: every game over or finale records the run, and
// the title screen shows the board to chase. All storage access is guarded
// so a browser without storage still plays fine.

const BOARD_KEY = 'sizzle-and-serve-board-v1';
const BOARD_MAX = 5;

export function loadBoard() {
  try {
    const raw = window.localStorage.getItem(BOARD_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter((r) => r && typeof r.coins === 'number')
      .slice(0, BOARD_MAX)
      .map((r) => ({
        coins: Math.max(0, Math.floor(r.coins)),
        served: Math.max(0, Math.floor(r.served ?? 0)),
        bestCombo: Math.max(0, Math.floor(r.bestCombo ?? 0)),
        daysCleared: Math.max(0, Math.floor(r.daysCleared ?? 0)),
        achievements: Math.max(0, Math.floor(r.achievements ?? 0)),
        date: typeof r.date === 'string' ? r.date : '',
      }));
  } catch {
    return [];
  }
}

function sortBoard(board) {
  return [...board].sort((a, b) => {
    if (b.coins !== a.coins) return b.coins - a.coins;
    if (b.served !== a.served) return b.served - a.served;
    return b.bestCombo - a.bestCombo;
  });
}

// Record a finished run. Returns its 1-based rank on the board, or 0 when it
// did not make the top five (or storage is unavailable).
export function recordRun(world) {
  const entry = {
    coins: world.coins,
    served: world.stats.totalServed,
    bestCombo: world.bestCombo,
    daysCleared: world.stats.daysCleared,
    achievements: world.achievements.unlocked.length,
    date: new Date().toISOString().slice(0, 10),
  };
  if (entry.coins <= 0 && entry.served <= 0) return 0;
  const board = sortBoard([...loadBoard(), entry]).slice(0, BOARD_MAX);
  const rank = board.indexOf(entry) + 1;
  if (rank === 0) return 0;
  try {
    window.localStorage.setItem(BOARD_KEY, JSON.stringify(board));
  } catch {
    return 0;
  }
  return rank;
}

// Short lines for the title screen: the top three, with medals.
export function boardLines() {
  const board = loadBoard();
  if (board.length === 0) return ['No runs on the board yet — be the first name up there.'];
  const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
  return board.slice(0, 3).map((r, i) => {
    const days = r.daysCleared > 0 ? ` • ${r.daysCleared} day${r.daysCleared > 1 ? 's' : ''} cleared` : '';
    return `${medals[i]} ${r.coins} coins • ${r.served} dishes • combo x${r.bestCombo}${days} (${r.date})`;
  });
}

export function clearBoard() {
  try {
    window.localStorage.removeItem(BOARD_KEY);
  } catch {
    // Nothing to clear.
  }
}
