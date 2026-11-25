// Sizzle & Serve — the tutorial hint engine. First-time players get one short
// contextual hint at a time, driven by what they have (and have not) done yet,
// shown in a slim bar above the floor. Nothing blocks play; hints fade on
// their own and never repeat inside a run.

const HINTS = [
  {
    id: 'grab',
    when: (w) => w.carry.length === 0 && w.served === 0 && w.plateOnCounter === null && w.orders.length > 0,
    text: 'Start here: stand by a crate and press 1-4 (or click) to grab an ingredient.',
  },
  {
    id: 'prep',
    when: (w) => w.carry.some((i) => i.state === 'raw') && !w.stationsUsed,
    text: 'Raw food needs prep: chop on a board, cook on a stove, fry in the fryer, bake in the oven.',
  },
  {
    id: 'plate',
    when: (w) => w.carry.some((i) => i.state !== 'raw' && i.ing !== 'plate') && w.plateOnCounter === null,
    text: 'Prepped food in hand? Grab a clean plate, put it on the plating counter, then add the food.',
  },
  {
    id: 'serve',
    when: (w) => w.plateOnCounter && w.plateOnCounter.recipeId !== null,
    text: 'That plate matches a recipe! Pick it up and carry it to the Serving Window.',
  },
  {
    id: 'burn',
    when: (w) => w.stationsBurnt > 0,
    text: 'Food burns if it sits too long after READY. Grab it fast — or bin it with E.',
  },
  {
    id: 'combo',
    when: (w) => w.combo >= 2,
    text: 'Combo rising! Every serve in a row pays more — do not let an order expire.',
  },
  {
    id: 'rush',
    when: (w) => w.rush,
    text: 'RUSH HOUR: orders arrive twice as fast. Cook ahead — keep a patty on the stove.',
  },
  {
    id: 'special',
    when: (w) => w.orders.some((o) => o.recipeId === w.dailySpecial),
    text: 'The daily special is on the board — it pays 1.5x. Prioritise it!',
  },
  {
    id: 'vip',
    when: (w) => w.orders.some((o) => o.vip),
    text: 'A VIP customer is waiting — gold border, double pay, but very little patience.',
  },
  {
    id: 'event',
    when: (w) => w.activeEvent !== null,
    text: 'A shift event is running! Read the gold banner — it changes the maths.',
  },
  {
    id: 'twoboards',
    when: (w) => w.served >= 3 && w.stationsUsed && w.combo === 0,
    text: 'Lost your combo? Two boards and two burners at once keep the line moving.',
  },
  {
    id: 'book',
    when: (w) => w.served >= 2 && !w.bookOpened,
    text: 'Press B any time to open the recipe book — every dish, step by step.',
  },
  {
    id: 'goal',
    when: (w) => w.earnedToday >= w.dayGoal * 0.7 && !w.dayGoalMet,
    text: 'Nearly at today\'s goal! One or two more serves and the day is yours.',
  },
  {
    id: 'burnt-twice',
    when: (w) => w.dayBurnt >= 2,
    text: 'Two burnt pans today! Grab READY food the moment it flashes green.',
  },
  {
    id: 'plate-stack',
    when: (w) => w.served >= 4 && w.combo === 0,
    text: 'Pro move: chop two items, plate one while the other cooks. Overlap everything.',
  },
  {
    id: 'fryer-double',
    when: (w) => w.served >= 5,
    text: 'The fryer has two baskets — fries and nuggets can share the oil.',
  },
  {
    id: 'mastery-near',
    when: (w) => Object.values(w.recipeCounts ?? {}).some((c) => c === 2),
    text: 'One dish is one serve from mastery! Serve it once more for +10% pay forever.',
  },
  {
    id: 'mastery-done',
    when: (w) => Object.values(w.recipeCounts ?? {}).some((c) => c >= 3),
    text: 'You mastered a dish — it now pays +10% every time. Check the book (B) for the gold badge.',
  },
  {
    id: 'strikes',
    when: (w) => w.strikes === 2,
    text: 'Two strikes! One more expired order ends the day — serve the fastest dish first.',
  },
];

export function createTutorialState() {
  return { shown: [], current: null, timer: 0 };
}

export function tickTutorial(world, dt) {
  const t = world.tutorial;
  if (!t) return;
  if (t.current) {
    t.timer -= dt;
    if (t.timer <= 0) t.current = null;
    return;
  }
  if (world.screen !== 'play') return;
  for (const hint of HINTS) {
    if (t.shown.includes(hint.id)) continue;
    let ok = false;
    try {
      ok = hint.when(world);
    } catch {
      ok = false;
    }
    if (ok) {
      t.shown.push(hint.id);
      t.current = hint;
      t.timer = 6;
      return;
    }
  }
}
