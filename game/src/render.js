// Sizzle & Serve — every pixel is drawn here on one canvas: the kitchen floor,
// the order board, the stations, the chef and the food. No image assets at all;
// each ingredient is a little vector drawing so the game stays self-contained.

import {
  CANVAS_HEIGHT, CANVAS_WIDTH, CRATES, DAYS, FLOOR_BOTTOM, FLOOR_LEFT,
  FLOOR_RIGHT, FLOOR_TOP, INGREDIENTS, MAX_STRIKES, RECIPES, RECIPE_BY_ID,
  RUSH_SECONDS, STATIONS,
} from './config.js';
import { COOKING_TIPS, HEAD_CHEF_LINES, KEYBINDS, MASTERY_SERVES, RECIPE_STEPS, STATION_HELP } from './config.js';
import { comboMultiplier, isMastered, plateRecipeId } from './world.js';

// ------------------------------------------------------------------- helpers
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = '700', font = 'system-ui, sans-serif') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function bar(ctx, x, y, w, h, frac, fill, back = 'rgba(0,0,0,0.35)') {
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = back;
  ctx.fill();
  if (frac > 0) {
    roundRect(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

function shadow(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ------------------------------------------------------- ingredient drawing
// Each ingredient is drawn from shapes so it reads at 28px on a crate and at
// 64px on a plate. `state` changes the look: raw beef is pink, cooked is brown.
export function drawIngredient(ctx, ingId, x, y, size, state = 'raw') {
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  switch (ingId) {
    case 'tomato': {
      ctx.fillStyle = state === 'chopped' ? '#f26d6d' : '#e5484d';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7bc96f';
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * s * 0.45, -s * 0.55 + Math.sin(a) * s * 0.2, s * 0.28, s * 0.16, a, 0, Math.PI * 2);
        ctx.fill();
      }
      if (state === 'chopped') {
        ctx.strokeStyle = '#ffd9d9'; ctx.lineWidth = s * 0.12;
        ctx.beginPath(); ctx.moveTo(-s * 0.6, 0); ctx.lineTo(s * 0.6, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -s * 0.6); ctx.lineTo(0, s * 0.6); ctx.stroke();
      }
      break;
    }
    case 'onion': {
      ctx.fillStyle = '#f3e2c7';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d9b98a'; ctx.lineWidth = s * 0.1;
      ctx.beginPath(); ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#7bc96f';
      ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.lineTo(-s * 0.25, -s * 1.15); ctx.lineTo(s * 0.25, -s * 1.15); ctx.closePath(); ctx.fill();
      break;
    }
    case 'lettuce': {
      ctx.fillStyle = '#7bc96f';
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.ellipse(-s * 0.4 + i * s * 0.4, (i % 2 ? -s * 0.15 : s * 0.1), s * 0.5, s * 0.62, (i - 1) * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#4a9e4a'; ctx.lineWidth = s * 0.08;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.5); ctx.lineTo(0, s * 0.55); ctx.stroke();
      break;
    }
    case 'mushroom': {
      ctx.fillStyle = '#d9c7a7';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.95, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f2e6cf';
      ctx.fillRect(-s * 0.28, -s * 0.1, s * 0.56, s * 0.95);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-s * 0.35, -s * 0.45, s * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.3, -s * 0.6, s * 0.12, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'beef': {
      ctx.fillStyle = state === 'cooked' ? '#6b3a1f' : '#c96a5e';
      roundRect(ctx, -s * 0.95, -s * 0.5, s * 1.9, s, s * 0.5);
      ctx.fill();
      ctx.fillStyle = state === 'cooked' ? '#8a4b2d' : '#e08a7a';
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.7, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      if (state === 'cooked') {
        ctx.strokeStyle = '#3d2110'; ctx.lineWidth = s * 0.1;
        ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.2); ctx.lineTo(s * 0.5, s * 0.15); ctx.stroke();
      }
      break;
    }
    case 'chicken': {
      ctx.fillStyle = state === 'cooked' ? '#d98f3e' : state === 'fried' ? '#e8a34c' : '#f2c9a0';
      ctx.beginPath(); ctx.ellipse(-s * 0.15, s * 0.05, s * 0.7, s * 0.55, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff3e0';
      ctx.beginPath(); ctx.ellipse(s * 0.55, -s * 0.45, s * 0.42, s * 0.2, 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff3e0'; ctx.lineWidth = s * 0.18; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s * 0.5, -s * 0.4); ctx.lineTo(s * 0.85, -s * 0.75); ctx.stroke();
      if (state !== 'raw') {
        ctx.fillStyle = '#b57a2e';
        ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.15, s * 0.12, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(s * 0.1, s * 0.2, s * 0.1, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'fish': {
      ctx.fillStyle = state === 'cooked' ? '#e8b06a' : '#a8c8e8';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.95, s * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 0.8, 0); ctx.lineTo(s * 1.25, -s * 0.5); ctx.lineTo(s * 1.25, s * 0.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2b2b2b';
      ctx.beginPath(); ctx.arc(-s * 0.55, -s * 0.08, s * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = s * 0.08;
      ctx.beginPath(); ctx.arc(0.1 * s, 0, s * 0.4, -1.1, 1.1); ctx.stroke();
      break;
    }
    case 'bacon': {
      ctx.fillStyle = state === 'cooked' ? '#a83c2e' : '#d96a5e';
      for (let i = -1; i <= 1; i += 1) {
        roundRect(ctx, -s, i * s * 0.55 - s * 0.22, s * 2, s * 0.36, s * 0.18);
        ctx.fill();
      }
      ctx.fillStyle = '#f2c9a0';
      for (let i = -1; i <= 1; i += 1) ctx.fillRect(-s * 0.85, i * s * 0.55 - s * 0.07, s * 1.7, s * 0.14);
      break;
    }
    case 'bun': {
      ctx.fillStyle = '#e8b06a';
      ctx.beginPath(); ctx.arc(0, s * 0.15, s * 0.95, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f2d09a';
      ctx.fillRect(-s * 0.95, s * 0.15, s * 1.9, s * 0.45);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-s * 0.4, -s * 0.45, s * 0.09, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.2, -s * 0.6, s * 0.09, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.55, -s * 0.35, s * 0.09, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'dough': {
      ctx.fillStyle = state === 'baked' ? '#e8b06a' : '#f2ddb0';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.95, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = state === 'baked' ? '#b57e3a' : '#d9b98a'; ctx.lineWidth = s * 0.16;
      ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2); ctx.stroke();
      if (state === 'baked') {
        ctx.fillStyle = '#e5484d';
        ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.2, s * 0.14, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(s * 0.35, s * 0.25, s * 0.14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd23e';
        ctx.beginPath(); ctx.arc(s * 0.3, -s * 0.35, s * 0.12, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'tortilla': {
      ctx.fillStyle = '#f5e3b3';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.95, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d9b98a'; ctx.lineWidth = s * 0.08;
      ctx.beginPath(); ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#c9a86a';
      ctx.beginPath(); ctx.arc(-s * 0.4, s * 0.3, s * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.35, -s * 0.4, s * 0.08, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'cheese': {
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath(); ctx.moveTo(-s * 0.9, s * 0.5); ctx.lineTo(s * 0.9, s * 0.5); ctx.lineTo(s * 0.9, -s * 0.2); ctx.lineTo(-s * 0.9, -s * 0.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d9a400';
      ctx.beginPath(); ctx.arc(-s * 0.2, s * 0.15, s * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.4, s * 0.25, s * 0.11, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'pasta': {
      ctx.strokeStyle = state === 'cooked' ? '#f2c14e' : '#e8d9a0';
      ctx.lineWidth = s * 0.22; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(0, (i - 1) * s * 0.42, s * (0.75 - i * 0.12), 0.4, Math.PI * 2 - 0.6);
        ctx.stroke();
      }
      if (state === 'cooked') {
        ctx.fillStyle = '#e5484d';
        ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.5, s * 0.13, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(s * 0.4, s * 0.4, s * 0.13, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'egg': {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.95, s * 0.75, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = state === 'cooked' ? '#ffb62e' : '#ffd23e';
      ctx.beginPath(); ctx.arc(s * 0.1, -s * 0.05, s * 0.42, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'potato': {
      if (state === 'fried') {
        ctx.fillStyle = '#f6c453';
        for (let i = -2; i <= 2; i += 1) {
          roundRect(ctx, i * s * 0.34 - s * 0.13, -s * 0.9 + Math.abs(i) * s * 0.12, s * 0.26, s * 1.7, s * 0.1);
          ctx.fill();
        }
        ctx.fillStyle = '#e5484d';
        ctx.fillRect(-s * 0.8, s * 0.55, s * 1.6, s * 0.4);
      } else {
        ctx.fillStyle = '#d9b98a';
        ctx.beginPath(); ctx.ellipse(0, 0, s * 0.8, s * 0.65, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b59a6a';
        ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.2, s * 0.09, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(s * 0.35, s * 0.25, s * 0.09, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'carrot': {
      ctx.fillStyle = '#f08a24';
      ctx.beginPath(); ctx.moveTo(-s * 0.35, -s * 0.7); ctx.lineTo(s * 0.35, -s * 0.7); ctx.lineTo(0, s * 0.95); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5da24a';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath(); ctx.ellipse(i * s * 0.3, -s * 0.85, s * 0.22, s * 0.4, i * 0.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#c25e10'; ctx.lineWidth = s * 0.08;
      ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.2); ctx.lineTo(s * 0.2, -s * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.14, s * 0.2); ctx.lineTo(s * 0.14, s * 0.2); ctx.stroke();
      break;
    }
    default: {
      ctx.fillStyle = '#cccccc';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

// A white plate with the dish's items stacked on it, readable at a glance.
export function drawPlate(ctx, x, y, radius, items, highlight = false) {
  ctx.save();
  ctx.translate(x, y);
  if (highlight) {
    ctx.strokeStyle = '#7CFC98';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, radius + 8, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = '#f7f4ee';
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d9d2c4'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2); ctx.stroke();
  const n = items.length;
  items.forEach((item, i) => {
    const spread = n <= 1 ? 0 : radius * 0.42;
    const angle = -Math.PI / 2 + (n > 1 ? (i / (n - 1) - 0.5) * 1.7 : 0);
    drawIngredient(ctx, item.ing, Math.cos(angle) * spread, Math.sin(angle) * spread * 0.6, radius * 0.62, item.state);
  });
  ctx.restore();
}

function drawCustomerFace(ctx, customer, x, y, r, mood = 'happy') {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = customer.skin;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = customer.color;
  ctx.beginPath(); ctx.arc(0, -r * 0.55, r * 0.95, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2b2b2b';
  if (mood === 'angry') {
    // Angry brows slant down toward the nose.
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-r * 0.55, -r * 0.35); ctx.lineTo(-r * 0.15, -r * 0.15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 0.55, -r * 0.35); ctx.lineTo(r * 0.15, -r * 0.15); ctx.stroke();
  } else if (mood === 'worried') {
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * 0.55, -r * 0.15); ctx.lineTo(-r * 0.15, -r * 0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 0.55, -r * 0.15); ctx.lineTo(r * 0.15, -r * 0.3); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.05, r * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.05, r * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 2;
  if (mood === 'happy') {
    ctx.beginPath(); ctx.arc(0, r * 0.25, r * 0.35, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  } else if (mood === 'worried') {
    ctx.beginPath(); ctx.arc(0, r * 0.55, r * 0.22, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-r * 0.3, r * 0.45); ctx.lineTo(r * 0.3, r * 0.45); ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------- HUD
function drawHUD(ctx, world) {
  const cfg = DAYS[world.dayIndex];
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 112);
  ctx.fillStyle = '#3a2d1f';
  ctx.fillRect(0, 108, CANVAS_WIDTH, 6);

  text(ctx, '🍳 SIZZLE & SERVE', 20, 30, 26, '#ffd23e', 'left', '800');
  text(ctx, cfg.name, 20, 62, 15, '#f2e6cf', 'left', '600');
  text(ctx, `${RECIPES.filter((r) => r.day <= world.dayIndex + 1).length} recipes  •  16 ingredients  •  5 stations  •  3 days`, 20, 88, 13, '#c9b18a', 'left', '500');

  // Shift timer.
  const shiftFrac = world.shiftLeft / world.shiftTotal;
  const shiftX = 470;
  text(ctx, world.rush ? '⏰ RUSH HOUR' : '⏰ SHIFT', shiftX, 26, 14, world.rush ? '#ff6b6b' : '#c9b18a', 'left', '700');
  const mins = Math.floor(Math.max(0, world.shiftLeft) / 60);
  const secs = Math.floor(Math.max(0, world.shiftLeft) % 60);
  text(ctx, `${mins}:${String(secs).padStart(2, '0')}`, shiftX + 210, 26, 18, world.shiftLeft <= RUSH_SECONDS ? '#ff6b6b' : '#ffffff', 'left', '800');
  bar(ctx, shiftX, 44, 210, 12, shiftFrac, world.shiftLeft <= RUSH_SECONDS ? '#ff6b6b' : '#7bc96f');
  text(ctx, `Goal ${cfg.goal} coins today`, shiftX, 74, 13, '#c9b18a', 'left', '500');
  text(ctx, `Earned ${world.earnedToday}`, shiftX, 94, 13, '#ffd23e', 'left', '700');

  // Coins / score / combo.
  text(ctx, '🪙', 730, 34, 22, '#ffd23e', 'left');
  text(ctx, `${world.coins}`, 760, 34, 26, '#ffd23e', 'left', '800');
  text(ctx, 'SCORE', 730, 62, 12, '#c9b18a', 'left', '700');
  text(ctx, `${world.score}`, 730, 84, 18, '#ffffff', 'left', '800');
  if (world.combo >= 2) {
    const mult = comboMultiplier(world);
    ctx.fillStyle = '#ff8a3d';
    roundRect(ctx, 880, 14, 120, 66, 10);
    ctx.fill();
    text(ctx, '🔥 COMBO', 940, 34, 14, '#fff', 'center', '800');
    text(ctx, `x${world.combo}  •  ${mult.toFixed(2)}x pay`, 940, 60, 16, '#fff', 'center', '800');
  }

  // Strikes (burnt plates).
  text(ctx, 'STRIKES', 1030, 26, 12, '#c9b18a', 'left', '700');
  for (let i = 0; i < MAX_STRIKES; i += 1) {
    ctx.font = '22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(i < world.strikes ? '💔' : '🍽️', 1030 + i * 30, 52);
  }
  text(ctx, `Served ${world.servedToday}`, 1030, 84, 14, '#7CFC98', 'left', '700');
  text(ctx, `Best combo x${world.bestCombo}`, 1140, 84, 14, '#c9b18a', 'left', '600');
}

// --------------------------------------------------------------- order board
function drawOrderBoard(ctx, world) {
  const cfg = DAYS[world.dayIndex];
  const boardX = 190;
  const boardW = CANVAS_WIDTH - boardX - 14;
  ctx.fillStyle = '#4a3220';
  roundRect(ctx, boardX, 122, boardW, 16, 6);
  ctx.fill();
  text(ctx, '— ORDER BOARD —', boardX + boardW / 2, 130, 11, '#e8c98a', 'center', '700');

  if (world.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, boardX, 142, boardW, 96, 10);
    ctx.fill();
    text(ctx, 'No orders right now — the next customer is on their way…', boardX + boardW / 2, 190, 16, '#e8dcc8', 'center', '600');
    return;
  }
  const cardW = Math.min(255, (boardW - 12 * (cfg.maxOrders - 1)) / cfg.maxOrders);
  world.orders.forEach((order, i) => {
    const recipe = RECIPE_BY_ID[order.recipeId];
    const x = boardX + i * (cardW + 12);
    const y = 142;
    const frac = order.timeLeft / order.patience;
    const urgent = frac < 0.35;
    const isVip = order.vip === true;
    const isSpecial = order.recipeId === world.dailySpecial;
    const bob = Math.sin(order.wobble) * (urgent ? 2 : 0.6);
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = isVip ? '#3d2f10' : urgent ? '#5d2a24' : '#fff8ec';
    roundRect(ctx, x, y, cardW, 96, 10);
    ctx.fill();
    ctx.strokeStyle = isVip ? '#ffd23e' : urgent ? '#ff6b6b' : '#d9c7a7';
    ctx.lineWidth = isVip ? 3 : 2;
    ctx.stroke();
    drawCustomerFace(ctx, order.customer, x + 26, y + 26, 18, frac < 0.35 ? 'angry' : frac < 0.6 ? 'worried' : 'happy');
    text(ctx, order.customer.name, x + 26, y + 56, 11, urgent || isVip ? '#ffd9d9' : '#6a5a44', 'center', '700');
    text(ctx, recipe.name, x + 52, y + 24, 16, urgent || isVip ? '#ffffff' : '#2b2118', 'left', '800');
    text(ctx, `$${recipe.price}  •  ${'★'.repeat(recipe.stars)}`, x + 52, y + 46, 12, urgent || isVip ? '#ffd23e' : '#8a6d3b', 'left', '700');
    if (isVip) text(ctx, '🎩 VIP 2x', x + cardW - 14, y + 46, 12, '#ffd23e', 'right', '800');
    else if (isSpecial) text(ctx, '🌶️ SPECIAL 1.5x', x + cardW - 14, y + 46, 12, '#ff8a3d', 'right', '800');
    // Needed ingredients as icons.
    recipe.components.forEach((comp, ci) => {
      drawIngredient(ctx, comp[0], x + 62 + ci * 34, y + 70, 26, comp[1]);
    });
    bar(ctx, x + 12, y + 88, cardW - 24, 6, frac, frac < 0.35 ? '#ff6b6b' : frac < 0.6 ? '#ffb62e' : '#7bc96f');
    text(ctx, `${Math.ceil(order.timeLeft)}s`, x + cardW - 14, y + 24, 13, urgent ? '#ff9a9a' : '#8a6d3b', 'right', '800');
    ctx.restore();
  });
}

// ------------------------------------------------------------------ kitchen
function drawKitchenFloor(ctx, world) {
  ctx.fillStyle = '#8a6a45';
  ctx.fillRect(0, 118, CANVAS_WIDTH, CANVAS_HEIGHT - 118);
  // Warm checkerboard tiles.
  const tile = 64;
  for (let y = 0; y < (CANVAS_HEIGHT - 118) / tile; y += 1) {
    for (let x = 0; x < CANVAS_WIDTH / tile; x += 1) {
      if ((x + y) % 2 === 0) continue;
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(x * tile, 118 + y * tile, tile, tile);
    }
  }
  // Rug in the middle of the floor, clear of the counters.
  ctx.fillStyle = '#a34d3f';
  roundRect(ctx, 420, 372, 440, 228, 16);
  ctx.fill();
  ctx.strokeStyle = '#e8c98a';
  ctx.lineWidth = 3;
  roundRect(ctx, 434, 386, 412, 200, 12);
  ctx.stroke();
  text(ctx, '★ SIZZLE & SERVE KITCHEN ★', 640, 486, 20, 'rgba(255,255,255,0.35)', 'center', '800');
  void world;
}

function drawCrates(ctx, world) {
  for (const crate of CRATES) {
    const near = world.hoverStation && world.hoverStation.id === crate.id;
    ctx.fillStyle = near ? '#6a5a3a' : '#5d4a33';
    roundRect(ctx, crate.x, crate.y, crate.w, crate.h, 10);
    ctx.fill();
    ctx.strokeStyle = crate.color;
    ctx.lineWidth = 3;
    ctx.stroke();
    text(ctx, crate.name.toUpperCase(), crate.x + crate.w / 2, crate.y + 14, 12, '#f2e6cf', 'center', '800');
    crate.items.forEach((ingId, i) => {
      const ing = INGREDIENTS[ingId];
      const cx = crate.x + 22 + i * 36;
      const cy = crate.y + 52;
      const hovered = world.hoverCrateItem === `${crate.id}:${i}`;
      if (hovered) {
        ctx.fillStyle = 'rgba(255,210,62,0.35)';
        ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
      }
      drawIngredient(ctx, ingId, cx, cy, 30, 'raw');
      text(ctx, ing.short, cx, crate.y + 82, 10, '#e8dcc8', 'center', '600');
      text(ctx, `${i + 1}`, cx, crate.y + 100, 10, '#ffd23e', 'center', '800');
    });
  }
}

function drawStationSlots(ctx, st, state) {
  const slotW = st.slots > 1 ? (st.w - 24) / st.slots : st.w - 24;
  state.slots.forEach((slot, i) => {
    const sx = st.x + 12 + i * slotW;
    const sy = st.y + 30;
    const sw = slotW - 8;
    const sh = st.h - 44;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    roundRect(ctx, sx, sy, sw, sh, 8);
    ctx.fill();
    if (!slot) {
      text(ctx, '—', sx + sw / 2, sy + sh / 2, 18, 'rgba(255,255,255,0.35)', 'center', '700');
      return;
    }
    if (slot.burnt) {
      drawIngredient(ctx, slot.item.ing, sx + sw / 2, sy + sh / 2 - 8, 34, slot.item.state);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(ctx, sx, sy, sw, sh, 8);
      ctx.fill();
      text(ctx, 'BURNT!', sx + sw / 2, sy + sh / 2 - 6, 13, '#ff6b6b', 'center', '800');
      text(ctx, 'Press E to bin', sx + sw / 2, sy + sh / 2 + 12, 10, '#ffffff', 'center', '600');
      return;
    }
    drawIngredient(ctx, slot.item.ing, sx + sw / 2, sy + sh / 2 - 4, 30, slot.done ? slot.item.state : 'raw');
    if (!slot.done) {
      const frac = slot.progress;
      bar(ctx, sx + 6, sy + sh - 14, sw - 12, 8, frac, '#ffb62e');
      if (sh >= 70) text(ctx, `${Math.ceil((1 - frac) * slot.seconds)}s`, sx + sw / 2, sy + 12, 11, '#ffffff', 'center', '700');
    } else {
      bar(ctx, sx + 6, sy + sh - 14, sw - 12, 8, Number.isFinite(slot.burnLeft) ? slot.burnLeft / 8 : 1, Number.isFinite(slot.burnLeft) && slot.burnLeft < 3 ? '#ff6b6b' : '#7CFC98');
      if (sh >= 70) {
        text(ctx, 'READY ✓', sx + sw / 2, sy + 12, 11, '#7CFC98', 'center', '800');
      } else {
        // Small slots get a green check badge in the corner instead of text.
        ctx.fillStyle = '#7CFC98';
        ctx.beginPath(); ctx.arc(sx + sw - 10, sy + 10, 8, 0, Math.PI * 2); ctx.fill();
        text(ctx, '✓', sx + sw - 10, sy + 11, 11, '#1d4a24', 'center', '800');
      }
    }
  });
}

function drawStations(ctx, world) {
  for (const st of STATIONS) {
    const near = world.hoverStation && world.hoverStation.id === st.id;
    const isTop = st.y < 300;
    // Counter body.
    ctx.fillStyle = near ? '#7a6a4d' : '#6a5a44';
    roundRect(ctx, st.x, st.y, st.w, st.h, 10);
    ctx.fill();
    ctx.fillStyle = '#8a7a5e';
    ctx.fillRect(st.x, st.y, st.w, 12);
    ctx.strokeStyle = near ? '#ffd23e' : '#4a3a28';
    ctx.lineWidth = near ? 3 : 2;
    roundRect(ctx, st.x, st.y, st.w, st.h, 10);
    ctx.stroke();
    text(ctx, st.name.toUpperCase(), st.x + st.w / 2, st.y + (isTop ? 20 : 16), 11, '#f2e6cf', 'center', '800');

    if (st.kind === 'board' || st.kind === 'stove' || st.kind === 'fryer' || st.kind === 'oven') {
      drawStationSlots(ctx, st, world.stationState[st.id]);
      const flicker = Date.now() / 120;
      if (st.kind === 'stove') {
        // Gas flames flicker under each burner that is cooking.
        const cooking = world.stationState[st.id].slots.some((s) => s !== null && !s.done);
        for (const bx of [st.x + st.w / 2 - 34, st.x + st.w / 2 + 34]) {
          const h = cooking ? 7 + Math.sin(flicker + bx) * 2.5 : 3;
          ctx.fillStyle = cooking ? '#ff8a3d' : '#5a4632';
          ctx.beginPath();
          ctx.ellipse(bx, st.y + st.h - 10, 6, h, 0, 0, Math.PI * 2);
          ctx.fill();
          if (cooking) {
            ctx.fillStyle = '#ffd23e';
            ctx.beginPath();
            ctx.ellipse(bx, st.y + st.h - 9, 3, h * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      if (st.kind === 'fryer') {
        // Oil bubbles rise while something fries.
        const frying = world.stationState[st.id].slots.some((s) => s !== null && !s.done);
        if (frying) {
          ctx.fillStyle = 'rgba(255,220,120,0.8)';
          for (let b = 0; b < 4; b += 1) {
            const bx = st.x + 24 + ((b * 29 + Math.sin(flicker + b) * 4) % (st.w - 48));
            const by = st.y + st.h - 16 - ((flicker * 9 + b * 17) % 26);
            ctx.beginPath(); ctx.arc(bx, by, 2.5, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
      if (st.kind === 'oven') {
        // Warm glow while the oven bakes.
        const baking = world.stationState[st.id].slots.some((s) => s !== null && !s.done);
        if (baking) {
          ctx.fillStyle = `rgba(255,138,61,${0.16 + 0.07 * Math.sin(flicker)})`;
          roundRect(ctx, st.x + 8, st.y + 26, st.w - 16, st.h - 36, 8);
          ctx.fill();
        }
      }
    } else if (st.kind === 'plates') {
      for (let i = 0; i < 4; i += 1) {
        ctx.fillStyle = i === 0 ? '#ffffff' : '#e8e2d4';
        ctx.beginPath(); ctx.ellipse(st.x + st.w / 2, st.y + 44 + i * 14, 42, 9, 0, 0, Math.PI * 2); ctx.fill();
      }
      text(ctx, 'Press E to take', st.x + st.w / 2, st.y + st.h - 14, 11, '#e8dcc8', 'center', '600');
    } else if (st.kind === 'plating') {
      if (world.plateOnCounter) {
        const plate = world.plateOnCounter;
        drawPlate(ctx, st.x + st.w / 2, st.y + 56, 40, plate.items, plate.recipeId !== null);
        if (plate.recipeId) {
          text(ctx, `${RECIPE_BY_ID[plate.recipeId].name} ✓ READY`, st.x + st.w / 2, st.y + st.h - 12, 13, '#7CFC98', 'center', '800');
        } else {
          text(ctx, `${plate.items.length}/4 parts — add more`, st.x + st.w / 2, st.y + st.h - 12, 12, '#e8dcc8', 'center', '600');
        }
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath(); ctx.ellipse(st.x + st.w / 2, st.y + 56, 40, 40, 0, 0, Math.PI * 2); ctx.fill();
        text(ctx, 'Place a plate, then add food', st.x + st.w / 2, st.y + 56, 12, '#e8dcc8', 'center', '600');
      }
    } else if (st.kind === 'serve') {
      ctx.fillStyle = '#3a2d1f';
      roundRect(ctx, st.x + 14, st.y + 30, st.w - 28, 54, 8);
      ctx.fill();
      text(ctx, '🔔 SERVE HERE', st.x + st.w / 2, st.y + 48, 16, '#ffd23e', 'center', '800');
      text(ctx, 'Match the order, ring the bell', st.x + st.w / 2, st.y + 70, 12, '#e8dcc8', 'center', '600');
      const ready = world.plateInHand && world.plateInHand.state === 'dish';
      if (ready) {
        text(ctx, '▼ DISH READY — PRESS E ▼', st.x + st.w / 2, st.y + st.h - 12, 13, '#7CFC98', 'center', '800');
      }
    } else if (st.kind === 'trash') {
      ctx.fillStyle = '#3a3a3a';
      roundRect(ctx, st.x + 30, st.y + 34, st.w - 60, 58, 8);
      ctx.fill();
      text(ctx, '🗑️', st.x + st.w / 2, st.y + 56, 28, '#ffffff', 'center');
      text(ctx, 'Bin burnt food', st.x + st.w / 2, st.y + st.h - 14, 11, '#e8dcc8', 'center', '600');
    }
  }
}

// -------------------------------------------------------------------- chef
function drawChef(ctx, world) {
  const chef = world.chef;
  const bob = chef.moving ? Math.sin(Date.now() / 90) * 2 : 0;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob);
  if (world.shake > 0) ctx.translate((Math.random() - 0.5) * 4, 0);
  shadow(ctx, 0, 26, 22, 7);
  // Body + apron.
  ctx.fillStyle = '#f2f2f2';
  roundRect(ctx, -18, -6, 36, 34, 10);
  ctx.fill();
  ctx.fillStyle = '#e5484d';
  roundRect(ctx, -18, 8, 36, 20, 8);
  ctx.fill();
  // Arms.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath(); ctx.arc(-20, 6, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(20, 6, 6, 0, Math.PI * 2); ctx.fill();
  // Head + toque.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath(); ctx.arc(0, -18, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(0, -30, 13, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.fillRect(-13, -32, 26, 6);
  // Face.
  ctx.fillStyle = '#2b2b2b';
  ctx.beginPath(); ctx.arc(-5 * chef.dir, -18, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5 * chef.dir, -18, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(chef.dir * 2, -13, 5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.restore();

  // Carried items float above the chef's head; the plate rides its own tray.
  const held = [...world.carry];
  if (world.plateInHand) held.push(world.plateInHand);
  held.forEach((item, i) => {
    const cx = chef.x - (held.length - 1) * 18 + i * 36;
    const cy = chef.y - 58 + bob;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(cx, cy, 17, 0, Math.PI * 2); ctx.fill();
    if (item.ing === 'plate') {
      drawPlate(ctx, cx, cy, 14, item.items ?? [], item.recipeId !== null);
    } else {
      drawIngredient(ctx, item.ing, cx, cy, 26, item.state);
    }
  });

  if (chef.interactFlash > 0) {
    ctx.fillStyle = 'rgba(255,210,62,0.5)';
    ctx.beginPath(); ctx.arc(chef.x, chef.y, 30, 0, Math.PI * 2); ctx.fill();
  }
}

// ------------------------------------------------------- floaters / banner
function drawFloaters(ctx, world) {
  for (const f of world.floaters) {
    const alpha = Math.max(0, Math.min(1, f.life / (f.maxLife * 0.5)));
    ctx.globalAlpha = alpha;
    ctx.font = `800 ${f.size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  }
  drawParticles(ctx, world.particles);
}

function drawEventBanner(ctx, world) {
  const banner = world.eventBanner;
  if (banner) {
    const alpha = Math.min(1, banner.life / 0.5);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#3d2f10';
    roundRect(ctx, 340, 330, 600, 76, 12);
    ctx.fill();
    ctx.strokeStyle = '#ffd23e';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, `${banner.icon}  ${banner.name}`, 640, 356, 22, '#ffd23e', 'center', '800');
    text(ctx, banner.blurb, 640, 384, 14, '#ffffff', 'center', '600');
    ctx.globalAlpha = 1;
    return;
  }
  const active = world.activeEvent;
  if (active) {
    ctx.fillStyle = 'rgba(61,47,16,0.9)';
    roundRect(ctx, 470, 246, 340, 30, 15);
    ctx.fill();
    ctx.strokeStyle = '#ffd23e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, `${active.def.icon} ${active.def.name} — ${Math.ceil(active.timeLeft)}s`, 640, 262, 14, '#ffd23e', 'center', '800');
  }
}

function drawMessage(ctx, world) {
  if (!world.message) return;
  const m = world.message;
  const alpha = Math.min(1, m.life / 0.4);
  ctx.globalAlpha = alpha;
  const colors = { info: '#2b2118', warn: '#7a4a12', bad: '#6b1f1f', rush: '#6b1f1f' };
  ctx.fillStyle = colors[m.kind] ?? colors.info;
  roundRect(ctx, 340, 240, 600, m.sub ? 84 : 62, 12);
  ctx.fill();
  ctx.strokeStyle = m.kind === 'rush' ? '#ff6b6b' : '#ffd23e';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, m.text, 640, 240 + (m.sub ? 28 : 32), 24, '#ffffff', 'center', '800');
  if (m.sub) text(ctx, m.sub, 640, 240 + 60, 15, '#e8dcc8', 'center', '600');
  ctx.globalAlpha = 1;
}

// ------------------------------------------------------------------ screens
function drawTitleScreen(ctx, world) {
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Warm kitchen backdrop.
  ctx.fillStyle = '#8a6a45';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 460);
  ctx.fillStyle = '#6a4a2a';
  for (let x = 0; x < CANVAS_WIDTH; x += 120) ctx.fillRect(x, 300, 120, 160);
  text(ctx, '🍳', 640, 130, 90, '#ffd23e', 'center');
  text(ctx, 'SIZZLE & SERVE', 640, 220, 64, '#ffd23e', 'center', '800');
  text(ctx, '18 recipes  •  16 ingredients  •  5 stations  •  3 days  •  combo rush', 640, 272, 20, '#f2e6cf', 'center', '700');
  text(ctx, 'Run the kitchen. Chop, cook, plate, serve — before patience runs out.', 640, 308, 18, '#e8dcc8', 'center', '600');

  // Recipe book strip.
  RECIPES.slice(0, 6).forEach((r, i) => {
    const x = 200 + i * 160;
    ctx.fillStyle = '#fff8ec';
    roundRect(ctx, x, 340, 140, 84, 10);
    ctx.fill();
    text(ctx, r.name, x + 70, 360, 13, '#2b2118', 'center', '800');
    r.components.forEach((c, ci) => drawIngredient(ctx, c[0], x + 28 + ci * 28, 390, 24, c[1]));
    text(ctx, `$${r.price}`, x + 70, 412, 14, '#8a6d3b', 'center', '800');
  });

  // How it works: four steps, one glance.
  const steps = [
    ['1️⃣', 'GRAB', 'Crates, keys 1-4'],
    ['2️⃣', 'PREP', 'Chop, cook, fry, bake'],
    ['3️⃣', 'PLATE', 'Match the recipe'],
    ['4️⃣', 'SERVE', 'Beat the timer'],
  ];
  steps.forEach(([icon, head, body], i) => {
    const x = 290 + i * 180;
    text(ctx, icon, x + 70, 448, 24, '#ffffff', 'center');
    text(ctx, head, x + 70, 472, 14, '#ffd23e', 'center', '800');
    text(ctx, body, x + 70, 490, 12, '#e8dcc8', 'center', '600');
    if (i < steps.length - 1) text(ctx, '›', x + 155, 472, 24, '#c9b18a', 'center', '800');
  });

  // Controls.
  ctx.fillStyle = '#ffd23e';
  roundRect(ctx, 490, 512, 300, 56, 12);
  ctx.fill();
  text(ctx, '▶  START DAY 1', 640, 540, 24, '#2b2118', 'center', '800');
  text(ctx, 'WASD / arrows to move  •  E to interact  •  1-4 to grab from crates', 640, 588, 15, '#f2e6cf', 'center', '600');
  text(ctx, 'Click a crate ingredient to grab it  •  Q to bin what you hold  •  P pause  •  M mute', 640, 610, 15, '#f2e6cf', 'center', '600');
  text(ctx, COOKING_TIPS[world.tipIndex], 640, 638, 14, '#ffd23e', 'center', '600');
  text(ctx, bestLine(), 640, 660, 13, '#7CFC98', 'center', '600');
  boardLines().forEach((line, i) => {
    text(ctx, line, 640, 680 + i * 17, 12, '#c9b18a', 'center', '500');
  });
  text(ctx, `Achievements unlocked this run: ${world.achievements.unlocked.length}/${ACHIEVEMENTS.length}  •  Press B any time for the recipe book`, 640, 742, 12, '#c9b18a', 'center', '500');
  text(ctx, 'Best played with keyboard + mouse. Sound on for the full sizzle.', 640, 766, 13, '#c9b18a', 'center', '500');
}

function drawDayClear(ctx, world) {
  ctx.fillStyle = 'rgba(20,14,8,0.82)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const last = world.dayResults[world.dayResults.length - 1];
  const grade = dayGrade(last, world.stats);
  text(ctx, last.met ? '🎉 DAY COMPLETE!' : '✅ SHIFT OVER', 640, 180, 48, '#ffd23e', 'center', '800');
  text(ctx, `Day grade: ${grade} — ${gradeBlurb(grade)}`, 640, 214, 17, '#7CFC98', 'center', '700');
  text(ctx, `Day ${last.day}: served ${last.served} dishes, earned ${last.earned} coins`, 640, 240, 22, '#ffffff', 'center', '700');
  text(ctx, last.met ? `Goal smashed! (${last.goal} coins needed)` : `Goal was ${last.goal} coins — close! Keep the combo alive next time.`, 640, 276, 18, last.met ? '#7CFC98' : '#ffd23e', 'center', '600');
  text(ctx, `Total coins: ${world.coins}   •   Total served: ${world.stats.totalServed}   •   Best combo: x${world.bestCombo}`, 640, 330, 18, '#e8dcc8', 'center', '600');
  const fav = favouriteRecipe(world.stats);
  text(ctx, `Accuracy ${serveAccuracy(world.stats)}%  •  ${coinsPerMinute(world.stats, world.secondsPlayed)} coins/min  •  ${fav ? `Favourite: ${RECIPE_BY_ID[fav.recipeId].name} x${fav.count}` : 'No favourite yet'}  •  Burnt pans: ${world.stats.totalBurnt}`, 640, 358, 15, '#c9b18a', 'center', '600');
  text(ctx, `Achievements unlocked: ${world.achievements.unlocked.length}/${ACHIEVEMENTS.length}`, 640, 382, 15, '#ffd23e', 'center', '700');
  if (world.dayIndex + 1 < DAYS.length) {
    text(ctx, HEAD_CHEF_LINES[world.dayIndex + 1], 640, 402, 14, '#c9b18a', 'center', '500');
  }
  ctx.fillStyle = '#ffd23e';
  roundRect(ctx, 470, 420, 340, 64, 12);
  ctx.fill();
  text(ctx, world.dayIndex + 1 < DAYS.length ? `▶  START DAY ${world.dayIndex + 2}` : '▶  SEE THE FINALE', 640, 452, 24, '#2b2118', 'center', '800');
  text(ctx, 'Press Enter or click to continue', 640, 510, 15, '#c9b18a', 'center', '600');
}

function drawGameOver(ctx, world) {
  ctx.fillStyle = 'rgba(20,10,8,0.85)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  text(ctx, '💔 SHIFT OVER', 640, 200, 52, '#ff6b6b', 'center', '800');
  text(ctx, 'Three customers walked out hungry.', 640, 260, 22, '#ffffff', 'center', '700');
  if (world.bestBeat) text(ctx, '🏆 NEW BEST RUN!', 640, 292, 20, '#ffd23e', 'center', '800');
  if (world.boardRank > 0) text(ctx, `Ranked #${world.boardRank} on your local leaderboard!`, 640, 318, 16, '#7CFC98', 'center', '700');
  text(ctx, `You served ${world.stats.totalServed} dishes and earned ${world.coins} coins across ${world.dayIndex + 1} day(s).`, 640, 344, 18, '#e8dcc8', 'center', '600');
  text(ctx, 'The kitchen never closes for long. Chop faster, watch the timers, keep the combo alive.', 640, 372, 16, '#c9b18a', 'center', '600');
  ctx.fillStyle = '#ffd23e';
  roundRect(ctx, 470, 400, 340, 64, 12);
  ctx.fill();
  text(ctx, '↻  TRY AGAIN', 640, 432, 24, '#2b2118', 'center', '800');
  text(ctx, 'Press Enter or click to restart from Day 1', 640, 490, 15, '#c9b18a', 'center', '600');
}

function drawWin(ctx, world) {
  ctx.fillStyle = 'rgba(20,14,8,0.85)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  text(ctx, '👑 GRAND FINALE!', 640, 180, 52, '#ffd23e', 'center', '800');
  text(ctx, 'Three days, three services — the critic is applauding.', 640, 240, 22, '#ffffff', 'center', '700');
  if (world.bestBeat) text(ctx, '🏆 NEW BEST RUN!', 640, 270, 20, '#ffd23e', 'center', '800');
  if (world.boardRank > 0) text(ctx, `Ranked #${world.boardRank} on your local leaderboard!`, 640, 296, 16, '#7CFC98', 'center', '700');
  world.dayResults.forEach((r, i) => {
    text(ctx, `Day ${r.day}: ${r.served} dishes  •  ${r.earned} coins  ${r.met ? '✓ goal met' : ''}`, 640, 300 + i * 32, 18, '#e8dcc8', 'center', '600');
  });
  text(ctx, `TOTAL: ${world.coins} coins  •  ${world.stats.totalServed} dishes served  •  best combo x${world.bestCombo}`, 640, 420, 20, '#ffd23e', 'center', '800');
  text(ctx, runVerdict(world.stats), 640, 452, 17, '#e8dcc8', 'center', '600');
  ctx.fillStyle = '#ffd23e';
  roundRect(ctx, 470, 470, 340, 64, 12);
  ctx.fill();
  text(ctx, '↻  PLAY AGAIN', 640, 502, 24, '#2b2118', 'center', '800');
  text(ctx, 'Press Enter or click to start a new run', 640, 550, 15, '#c9b18a', 'center', '600');
}

function drawHowTo(ctx) {
  ctx.fillStyle = 'rgba(20,14,8,0.85)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  text(ctx, 'HOW TO PLAY', 640, 120, 40, '#ffd23e', 'center', '800');
  const lines = [
    ['1', 'Grab ingredients', 'Stand by a crate, press 1-4 or click an ingredient. You can carry 3.'],
    ['2', 'Prep them', 'Chop on a board, cook on a stove, fry in the fryer, bake in the oven. Watch for READY — then grab it before it burns.'],
    ['3', 'Plate the dish', 'Take a clean plate, put it on the plating counter, add the recipe\'s parts. A matching plate glows green.'],
    ['4', 'Serve it', 'Carry the finished plate to the Serving Window and press E. Fast serves earn tips and build your combo.'],
    ['⏰', 'Mind the board', 'Every order has a timer. Let one expire and you take a strike — three strikes end the shift.'],
    ['🔥', 'Rush hour', 'The last 30 seconds of every shift double the order rate. Hold on tight.'],
    ['🌶️', 'Daily special', 'One recipe a day pays 1.5x. VIP orders (gold, day 2+) pay double but wait less. Serve any dish 3 times to master it for +10% pay.'],
    ['🎲', 'Shift events', 'Once a day something happens: Double Tip Hour, a power cut, a grease fire, a VIP table…'],
  ];
  lines.forEach(([num, head, body], i) => {
    const y = 168 + i * 62;
    ctx.fillStyle = '#fff8ec';
    roundRect(ctx, 240, y, 800, 54, 10);
    ctx.fill();
    text(ctx, num, 275, y + 27, 24, '#2b2118', 'center', '800');
    text(ctx, head, 310, y + 16, 17, '#2b2118', 'left', '800');
    text(ctx, body, 310, y + 38, 13, '#6a5a44', 'left', '500');
  });
  text(ctx, 'Press H or Esc to close  •  P pauses  •  M mutes  •  B opens the recipe book', 640, 700, 16, '#f2e6cf', 'center', '600');
  text(ctx, KEYBINDS.map((k) => `${k.keys}: ${k.action}`).slice(0, 4).join('   •   '), 640, 730, 13, '#c9b18a', 'center', '500');
}

import { coinsPerMinute, dayGrade, favouriteRecipe, gradeBlurb, runVerdict, serveAccuracy } from './stats.js';
import { bestLine } from './save.js';
import { boardLines } from './leaderboard.js';
import { drawParticles } from './particles.js';
import { ACHIEVEMENTS } from './achievements.js';
import { audioMuted } from './audio.js';

// ------------------------------------------------------- toasts and hints
function drawAchievementToasts(ctx, world) {
  const toasts = world.achievements?.toasts ?? [];
  toasts.forEach((toast, i) => {
    const alpha = Math.min(1, toast.life / 0.5);
    const y = 250 + i * 64;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#2b2118';
    roundRect(ctx, 940, y, 320, 54, 10);
    ctx.fill();
    ctx.strokeStyle = '#ffd23e';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, toast.achievement.icon, 966, y + 28, 26, '#ffffff', 'center');
    text(ctx, `Achievement: ${toast.achievement.name}`, 986, y + 18, 15, '#ffd23e', 'left', '800');
    text(ctx, toast.achievement.desc, 986, y + 38, 12, '#e8dcc8', 'left', '500');
    ctx.globalAlpha = 1;
  });
}

function drawTutorialHint(ctx, world) {
  const hint = world.tutorial?.current;
  if (!hint) return;
  ctx.fillStyle = 'rgba(43,33,24,0.92)';
  roundRect(ctx, 300, 246, 680, 34, 17);
  ctx.fill();
  ctx.strokeStyle = '#7bc96f';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, `💡 ${hint.text}`, 640, 264, 14, '#ffffff', 'center', '600');
}

function drawStationTooltip(ctx, world) {
  const st = world.hoverStation;
  if (!st || world.screen !== 'play') return;
  const help = STATION_HELP[st.kind ?? st.id];
  if (!help) return;
  ctx.font = '600 13px system-ui, sans-serif';
  const w = Math.min(560, ctx.measureText(help).width + 28);
  const x = Math.max(14, Math.min(CANVAS_WIDTH - w - 14, world.chef.x - w / 2));
  const y = Math.min(700, st.y + st.h + 8);
  ctx.fillStyle = 'rgba(43,33,24,0.92)';
  roundRect(ctx, x, y, w, 30, 8);
  ctx.fill();
  ctx.strokeStyle = '#ffd23e';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, help, x + w / 2, y + 16, 13, '#ffffff', 'center', '600');
}

function drawMoveTarget(ctx, world) {
  const target = world.moveTarget;
  if (!target) return;
  const pulse = 6 + Math.sin(Date.now() / 150) * 2;
  ctx.strokeStyle = 'rgba(255,210,62,0.85)';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(target.x, target.y, pulse + 6, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(target.x, target.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = '#ffd23e'; ctx.fill();
}

function drawRecipeBook(ctx, world) {
  ctx.fillStyle = 'rgba(20,14,8,0.88)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  text(ctx, '📖 RECIPE BOOK', 640, 60, 36, '#ffd23e', 'center', '800');
  text(ctx, 'Every dish on the menu — what it needs, what it pays, when it unlocks. Serve a dish 3 times to master it (+10% pay).', 640, 96, 15, '#e8dcc8', 'center', '600');
  // Six slim columns, three rows: all 18 dishes visible at once. (The old
  // 3-column layout clipped the bottom row off the 800px canvas.)
  const cols = 6;
  const cw = 200;
  const ch = 170;
  const gapX = 10;
  const gapY = 12;
  const x0 = (CANVAS_WIDTH - (cols * cw + (cols - 1) * gapX)) / 2;
  const y0 = 124;
  RECIPES.forEach((recipe, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = x0 + col * (cw + gapX);
    const y = y0 + row * (ch + gapY);
    const locked = recipe.day > world.dayIndex + 1;
    const isSpecial = recipe.id === world.dailySpecial;
    const served = world.recipeCounts?.[recipe.id] ?? 0;
    const mastered = isMastered(world, recipe.id);
    ctx.fillStyle = locked ? '#4a4038' : '#fff8ec';
    roundRect(ctx, x, y, cw, ch, 12);
    ctx.fill();
    ctx.strokeStyle = mastered ? '#ffd23e' : isSpecial ? '#ff8a3d' : '#d9c7a7';
    ctx.lineWidth = mastered || isSpecial ? 3 : 2;
    ctx.stroke();
    text(ctx, recipe.name, x + 12, y + 22, 14, locked ? '#c9c9c9' : '#2b2118', 'left', '800');
    text(ctx, `$${recipe.price}  •  ${'★'.repeat(recipe.stars)}  •  Day ${recipe.day}`, x + 12, y + 42, 11, locked ? '#a8a8a8' : '#8a6d3b', 'left', '700');
    recipe.components.forEach((comp, ci) => {
      drawIngredient(ctx, comp[0], x + 28 + ci * 44, y + 72, 30, comp[1]);
      text(ctx, INGREDIENTS[comp[0]].short, x + 28 + ci * 44, y + 94, 8, locked ? '#a8a8a8' : '#6a5a44', 'center', '600');
    });
    (RECIPE_STEPS[recipe.id] ?? []).forEach((step, si) => {
      text(ctx, `• ${step}`, x + 12, y + 114 + si * 13, 9, locked ? '#a8a8a8' : '#4a6a3a', 'left', '600');
    });
    if (isSpecial) text(ctx, '🌶️ SPECIAL 1.5x', x + cw - 12, y + ch - 10, 10, '#ff8a3d', 'right', '800');
    else if (mastered) text(ctx, '👑 MASTERED +10%', x + cw - 12, y + ch - 10, 10, '#b57e00', 'right', '800');
    else if (served > 0) text(ctx, `Served ${served}x — ${MASTERY_SERVES - served} to master`, x + cw - 12, y + ch - 10, 9, '#4a9e4a', 'right', '700');
  });
  text(ctx, 'Press B or Esc to close  •  The daily special pays 1.5x  •  VIP orders pay 2x  •  Mastered dishes pay +10%', 640, 766, 14, '#f2e6cf', 'center', '600');
}

// -------------------------------------------------------------------- main
export function render(ctx, world) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (world.screen === 'title') {
    drawTitleScreen(ctx, world);
    return;
  }
  drawKitchenFloor(ctx, world);
  drawCrates(ctx, world);
  drawStations(ctx, world);
  drawOrderBoard(ctx, world);
  drawHUD(ctx, world);
  if (world.screen === 'play') {
    drawChef(ctx, world);
    drawMoveTarget(ctx, world);
    drawStationTooltip(ctx, world);
    drawFloaters(ctx, world);
    drawMessage(ctx, world);
    drawEventBanner(ctx, world);
    drawAchievementToasts(ctx, world);
    drawTutorialHint(ctx, world);
    if (world.eventMods?.freezeStations) {
      // Power cut: dim the kitchen so the freeze reads at a glance.
      ctx.fillStyle = 'rgba(10,10,30,0.28)';
      ctx.fillRect(0, 118, CANVAS_WIDTH, CANVAS_HEIGHT - 118);
      text(ctx, '💡 POWER CUT — stations frozen!', 640, 300, 20, '#ffd23e', 'center', '800');
    }
    // Carry tray readout (bottom-left).
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, 14, 742, 220, 34, 8);
    ctx.fill();
    const heldNames = world.carry.map((it) => INGREDIENTS[it.ing].short);
    if (world.plateInHand) heldNames.push(world.plateInHand.state === 'dish' ? 'plate (ready)' : 'plate');
    text(ctx, heldNames.length === 0 ? 'Hands empty' : `Carrying: ${heldNames.join(' • ')}`, 24, 759, 13, '#ffffff', 'left', '600');
    text(ctx, 'H help  •  B recipes', 1240, 759, 13, '#e8dcc8', 'right', '600');
  }
  if (world.screen === 'howto') drawHowTo(ctx);
  if (world.screen === 'book') drawRecipeBook(ctx, world);
  if (world.screen === 'dayclear') drawDayClear(ctx, world);
  if (world.screen === 'gameover') drawGameOver(ctx, world);
  if (world.screen === 'win') drawWin(ctx, world);
  if (world.screen === 'paused') {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    text(ctx, '⏸ PAUSED', 640, 200, 48, '#ffffff', 'center', '800');
    text(ctx, `Day ${world.dayIndex + 1} — ${world.coins} coins so far, ${world.servedToday} dishes served`, 640, 244, 17, '#e8dcc8', 'center', '600');
    const buttons = [
      { label: '▶  Resume', y: 300 },
      { label: '↻  Restart this day', y: 372 },
      { label: '?  How to play', y: 444 },
      { label: audioMuted() ? '🔇  Sound: off — click to unmute' : '🔊  Sound: on — click to mute', y: 516 },
    ];
    for (const b of buttons) {
      ctx.fillStyle = '#ffd23e';
      roundRect(ctx, 470, b.y, 340, 56, 12);
      ctx.fill();
      text(ctx, b.label, 640, b.y + 28, 20, '#2b2118', 'center', '800');
    }
    text(ctx, 'Press P to resume  •  Click a button or press Enter', 640, 610, 15, '#c9b18a', 'center', '600');
  }
}
