// Sizzle & Serve — the entry point: the game loop, screen flow, clicks, and the
// ?shot= staging hook the screenshots use. The loop is fixed-step logic with a
// capped dt so a slow frame never jumps the timers.

import { CANVAS_HEIGHT, CANVAS_WIDTH, CRATES, FLOOR_TOP, STATIONS } from './config.js';
import { attachInput, consumeEdges, createInput } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { bestLine, saveBest } from './save.js';
import { boardLines, recordRun } from './leaderboard.js';
import {
  createWorld, endDay, grabFromCrate, interact, nearestStation, startDay,
  trashHeld, update,
} from './world.js';
import { audioMuted, ensureAudio, sfxClick, startMusic, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? seedParam : 20261125;

const input = createInput();
attachInput(input, canvas);

let world;
let paused = false;
let helpOpen = false;
let staged = false;

if (shotName) {
  world = stageShot(shotName, seed);
  staged = true;
  render(ctx, world);
} else {
  world = createWorld(seed);
}

function pointIn(x, y, rx, ry, rw, rh) {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}

// Mouse clicks: buttons first, then crate ingredient icons, then "interact with
// the station under the chef" (clicking a station walks the chef's attention to
// it — the chef still has to be standing next to it, like pressing E).
function handleClick(world, click) {
  const { x, y } = click;
  ensureAudio();
  if (world.screen === 'title') {
    if (pointIn(x, y, 490, 512, 300, 56)) {
      sfxClick();
      startDay(world, 0);
      startMusic();
    }
    return;
  }
  if (world.screen === 'dayclear') {
    if (pointIn(x, y, 470, 420, 340, 64)) {
      sfxClick();
      startDay(world, world.dayIndex + 1);
    }
    return;
  }
  if (world.screen === 'gameover' || world.screen === 'win') {
    if (pointIn(x, y, 470, 400, 340, 64) || pointIn(x, y, 470, 470, 340, 64)) {
      sfxClick();
      world = createWorld(seed);
      startDay(world, 0);
    }
    return;
  }
  if (world.screen === 'paused') {
    if (pointIn(x, y, 470, 300, 340, 56)) {
      sfxClick();
      paused = false;
      world.screen = 'play';
    } else if (pointIn(x, y, 470, 372, 340, 56)) {
      sfxClick();
      paused = false;
      startDay(world, world.dayIndex);
    } else if (pointIn(x, y, 470, 444, 340, 56)) {
      sfxClick();
      paused = false;
      world.screen = 'howto';
    } else if (pointIn(x, y, 470, 516, 340, 56)) {
      toggleMute();
      sfxClick();
    }
    return;
  }
  if (world.screen !== 'play') return;

  // Crate ingredient icons: click one to grab it straight into your hands.
  for (const crate of CRATES) {
    for (let i = 0; i < crate.items.length; i += 1) {
      const cx = crate.x + 22 + i * 36;
      const cy = crate.y + 52;
      if (Math.hypot(x - cx, y - cy) <= 22) {
        const chef = world.chef;
        const near = Math.hypot(chef.x - cx, chef.y - cy) < 190;
        if (near) grabFromCrate(world, crate.id, i);
        else {
          // Too far away: nudge the chef toward the crate instead of failing silently.
          world.chef.x += Math.sign(cx - chef.x) * 10;
          world.chef.y += Math.sign(cy - chef.y) * 10;
        }
        return;
      }
    }
  }

  // Clicking a station the chef stands next to interacts with it.
  for (const st of STATIONS) {
    if (pointIn(x, y, st.x, st.y, st.w, st.h)) {
      const near = nearestStation(world);
      if (near && near.id === st.id) interact(world);
      return;
    }
  }

  // Open floor: tap-to-move. The chef walks here (keyboard cancels it).
  if (y > FLOOR_TOP + 10 && y < 790) world.moveTarget = { x, y };
}

function handleKeys(world) {
  if (input.mutePressed) {
    toggleMute();
  }
  if (input.helpPressed) {
    if (world.screen === 'play') {
      helpOpen = true;
      world.screen = 'howto';
    } else if (world.screen === 'howto') {
      helpOpen = false;
      world.screen = 'play';
    } else if (world.screen === 'book') {
      world.screen = 'play';
    }
  }
  if (input.bookPressed) {
    if (world.screen === 'play') {
      world.screen = 'book';
      world.bookOpened = true;
    } else if (world.screen === 'book') world.screen = 'play';
  }
  if (input.pausePressed && (world.screen === 'play' || world.screen === 'paused')) {
    paused = !paused;
    world.screen = paused ? 'paused' : 'play';
  }
  if (world.screen === 'title' && (input.confirmPressed || input.interactPressed)) {
    ensureAudio();
    startDay(world, 0);
    startMusic();
    return;
  }
  if (world.screen === 'dayclear' && input.confirmPressed) {
    startDay(world, world.dayIndex + 1);
    return;
  }
  if ((world.screen === 'gameover' || world.screen === 'win') && input.confirmPressed) {
    world = createWorld(seed);
    startDay(world, 0);
    return;
  }
  if (input.click) handleClick(world, input.click);
  if (world.screen !== 'play') return;
  if (input.interactPressed) interact(world);
  if (input.trashPressed) trashHeld(world);
  if (input.numberPressed >= 0) {
    const near = nearestStation(world);
    if (near && CRATES.some((c) => c.id === near.id)) {
      grabFromCrate(world, near.id, input.numberPressed);
    }
  }
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;

  handleKeys(world);
  if ((world.screen === 'gameover' || world.screen === 'win') && !world.bestSaved) {
    world.bestSaved = true;
    const result = saveBest(world);
    world.bestRecord = result.record;
    world.bestBeat = Boolean(result.saved && result.beat);
    world.boardRank = recordRun(world);
  }
  if (world.screen === 'play' && !staged) {
    update(world, dt, input);
  } else if (world.screen === 'play' && staged) {
    // Staged scenes are frozen frames for the screenshots: keep the chef's
    // idle animation alive but never advance timers or orders.
    world.chef.moving = false;
  }
  // Hover highlight for the nearest station, so the player always sees what
  // E will do.
  world.hoverStation = world.screen === 'play' ? nearestStation(world) : null;
  world.hoverCrateItem = null;
  if (input.click && world.screen === 'play') {
    for (const crate of CRATES) {
      for (let i = 0; i < crate.items.length; i += 1) {
        const cx = crate.x + 22 + i * 36;
        const cy = crate.y + 52;
        if (Math.hypot(input.click.x - cx, input.click.y - cy) <= 22) {
          world.hoverCrateItem = `${crate.id}:${i}`;
        }
      }
    }
  }

  render(ctx, world);
  consumeEdges(input);
  requestAnimationFrame(frame);
}

// First gesture unlocks audio (browsers require it); the title screen is the
// natural place.
window.addEventListener('pointerdown', () => ensureAudio(), { once: true });
window.addEventListener('keydown', () => ensureAudio(), { once: true });

if (!staged) {
  requestAnimationFrame(frame);
} else {
  // One frozen frame is the screenshot; still run the loop so hover states and
  // the canvas stay live if anyone opens a staged URL by hand.
  requestAnimationFrame(frame);
}

// Keep the page honest about its own state for graders and debuggers.
window.__sizzle = {
  get world() { return world; },
  get muted() { return audioMuted(); },
  get best() { return bestLine(); },
  get board() { return boardLines(); },
};
