// Sizzle & Serve — shift events: one surprise per day that shakes the service
// up. An event is announced with a banner, runs for a fixed time, then ends.
// Modifiers live on the world (world.eventMods) so the rest of the game just
// reads them: spawn rates, tip multipliers, patience drain, station freezing.

import { spawnOrder } from './world.js';
import { sfxEvent } from './audio.js';

export const EVENTS = [
  {
    id: 'double-tip',
    name: 'Double Tip Hour',
    icon: '💰',
    duration: 45,
    blurb: 'Generous crowd tonight — every tip is doubled!',
    mods: { tipMult: 2 },
  },
  {
    id: 'inspector',
    name: 'Health Inspector Visit',
    icon: '🔍',
    duration: 30,
    blurb: 'The inspector is watching. Orders pay +25% but patience drains faster.',
    mods: { payMult: 1.25, patienceDrain: 1.3 },
  },
  {
    id: 'happy-hour',
    name: 'Happy Hour',
    icon: '🎉',
    duration: 40,
    blurb: 'The dining room is packed — orders arrive faster but customers are patient.',
    mods: { spawnMult: 0.65, patienceMult: 1.25 },
  },
  {
    id: 'vip-rush',
    name: 'VIP Table Arrives',
    icon: '🎩',
    duration: 0,
    blurb: 'A VIP table just sat down — a gold order is on the board now!',
    mods: {},
    instant: true,
  },
  {
    id: 'power-cut',
    name: 'Power Cut!',
    icon: '💡',
    duration: 15,
    blurb: 'The lights flicker — stoves and fryers freeze until power returns.',
    mods: { freezeStations: true },
  },
  {
    id: 'celebrity-chef',
    name: 'Celebrity Chef Visit',
    icon: '🌟',
    duration: 30,
    blurb: 'A famous chef is watching — every dish pays +50% while they are here!',
    mods: { payMult: 1.5 },
  },
  {
    id: 'lunch-rush',
    name: 'Lunch Rush',
    icon: '🏃',
    duration: 35,
    blurb: 'The office crowd just arrived — orders flood in, patience holds steady.',
    mods: { spawnMult: 0.55, patienceMult: 1.1 },
  },
  {
    id: 'grease-fire',
    name: 'Grease Fire!',
    icon: '🔥',
    duration: 0,
    blurb: 'A pan caught fire! One item on the stove just burnt — bin it fast.',
    mods: {},
    instant: true,
  },
  {
    id: 'quiet-hour',
    name: 'Quiet Hour',
    icon: '🌙',
    duration: 35,
    blurb: 'A lull in the dining room — orders slow down and customers relax, but tips shrink.',
    mods: { spawnMult: 1.6, patienceMult: 1.4, tipMult: 0.75 },
  },
  {
    id: 'food-critic',
    name: 'Food Critic Visit',
    icon: '📰',
    duration: 30,
    blurb: 'The critic is tasting everything — double pay, but patience is 30% shorter!',
    mods: { payMult: 2, patienceDrain: 1.3 },
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    icon: '🌅',
    duration: 30,
    blurb: 'The evening crowd is feeling generous — every dish pays +50% and tips are doubled!',
    mods: { payMult: 1.5, tipMult: 2 },
  },
  {
    id: 'table-six',
    name: 'Table of Six!',
    icon: '👨‍👩‍👧‍👦',
    duration: 0,
    blurb: 'A big table just sat down — two extra orders land on the board at once!',
    mods: {},
    instant: true,
  },
  {
    id: 'rainy-day',
    name: 'Rainy Day',
    icon: '🌧️',
    duration: 35,
    blurb: 'Rain outside, slow trickle inside — orders arrive slower and customers relax, with slightly better tips.',
    mods: { spawnMult: 1.4, patienceMult: 1.3, tipMult: 1.1 },
  },
];

export function pickEvent(world) {
  // One event per day, never the same twice in a row, never in the first 25s.
  const pool = EVENTS.filter((e) => e.id !== world.lastEventId);
  return pool[Math.floor(world.rand() * pool.length)];
}

export function startEvent(world, def) {
  world.activeEvent = { def, timeLeft: def.duration };
  world.lastEventId = def.id;
  world.eventMods = { ...def.mods };
  if (def.id === 'vip-rush') {
    // The VIP table is an instant event: force a VIP order onto the board.
    const order = spawnVipOrder(world);
    if (!order) {
      // Board was full: the VIP waits for the next free slot.
      world.pendingVip = true;
    }
    world.activeEvent = null;
    world.eventMods = {};
  }
  if (def.id === 'table-six') {
    // A big table orders twice at once: two fresh orders, board cap permitting.
    spawnOrder(world);
    spawnOrder(world);
    world.activeEvent = null;
    world.eventMods = {};
  }
  if (def.id === 'grease-fire') {
    // A random item currently cooking on a stove or in the fryer burns at once.
    const hot = [];
    for (const st of ['stove1', 'stove2', 'fryer']) {
      const state = world.stationState[st];
      if (!state) continue;
      state.slots.forEach((slot, i) => {
        if (slot && !slot.done) hot.push({ st, i });
      });
    }
    if (hot.length > 0) {
      const pick = hot[Math.floor(world.rand() * hot.length)];
      const slot = world.stationState[pick.st].slots[pick.i];
      slot.burnt = true;
      slot.done = true;
      slot.progress = 1;
      world.stationsBurnt += 1;
      world.dayBurnt += 1;
    }
    world.activeEvent = null;
    world.eventMods = {};
  }
  return def;
}

// Spawn a VIP order even when the board is at its normal cap (one over).
function spawnVipOrder(world) {
  if (world.orders.length >= 6) return null;
  const order = spawnOrder(world);
  if (order) {
    order.vip = true;
    order.patience = Math.round(order.patience * 0.7);
    order.timeLeft = Math.min(order.timeLeft, order.patience);
  }
  return order;
}

export function tickEvent(world, dt) {
  // Schedule the day's single event between 25s and 70s into the shift.
  if (!world.activeEvent && !world.eventDone && world.shiftTotal - world.shiftLeft > 25) {
    world.eventTimer -= dt;
    if (world.eventTimer <= 0) {
      const def = pickEvent(world);
      startEvent(world, def);
      world.eventDone = true;
      sfxEvent();
      showEventBanner(world, def);
    }
  }
  if (world.activeEvent) {
    world.activeEvent.timeLeft -= dt;
    if (world.activeEvent.timeLeft <= 0) {
      const name = world.activeEvent.def.name;
      world.activeEvent = null;
      world.eventMods = {};
      endEventBanner(world, name);
    }
  }
}

function showEventBanner(world, def) {
  world.eventBanner = { icon: def.icon, name: def.name, blurb: def.blurb, life: 3.4, maxLife: 3.4 };
}

function endEventBanner(world, name) {
  world.eventBanner = { icon: '✅', name: `${name} — over`, blurb: 'Back to the normal rush.', life: 2.0, maxLife: 2.0 };
}

// Modifier readers: the rest of the game asks these instead of reading mods.
export function tipMultiplier(world) {
  return world.eventMods?.tipMult ?? 1;
}

export function payMultiplier(world) {
  return world.eventMods?.payMult ?? 1;
}

export function patienceMultiplier(world) {
  return world.eventMods?.patienceMult ?? 1;
}

export function patienceDrain(world) {
  return world.eventMods?.patienceDrain ?? 1;
}

export function spawnMultiplier(world) {
  return world.eventMods?.spawnMult ?? 1;
}

export function stationsFrozen(world) {
  return world.eventMods?.freezeStations === true;
}
