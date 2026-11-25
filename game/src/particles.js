// Sizzle & Serve — the particle engine: steam over the stove, sparks on a
// serve, confetti for a perfect dish, smoke for a burnt pan, hearts for a
// happy customer. Particles are plain data; update() moves them, draw()
// paints them, and the world just asks for bursts by kind.

export const PARTICLE_KINDS = ['steam', 'spark', 'confetti', 'smoke', 'heart', 'star'];

const KIND_DEFAULTS = {
  steam: { color: '#ffffff', size: [4, 9], vy: [-90, -40], vx: [-12, 12], life: [0.7, 1.4], gravity: -8, grow: 1.6 },
  spark: { color: '#ffd23e', size: [2, 5], vy: [-110, -30], vx: [-90, 90], life: [0.4, 0.9], gravity: 60, grow: 0 },
  confetti: { color: '#ff8fa3', size: [3, 6], vy: [-120, -40], vx: [-120, 120], life: [0.8, 1.5], gravity: 140, grow: 0 },
  smoke: { color: '#5a5a5a', size: [6, 12], vy: [-70, -30], vx: [-10, 10], life: [0.9, 1.6], gravity: -14, grow: 1.8 },
  heart: { color: '#ff6b9d', size: [5, 9], vy: [-70, -30], vx: [-15, 15], life: [0.8, 1.3], gravity: -6, grow: 0 },
  star: { color: '#7CFC98', size: [3, 6], vy: [-80, -20], vx: [-60, 60], life: [0.5, 1.0], gravity: 20, grow: 0 },
};

const CONFETTI_COLORS = ['#ffd23e', '#ff8fa3', '#7bc96f', '#6a9fd8', '#ff8a3d'];

export function makeParticle(rand, x, y, kind) {
  const def = KIND_DEFAULTS[kind] ?? KIND_DEFAULTS.spark;
  const size = def.size[0] + rand() * (def.size[1] - def.size[0]);
  return {
    x, y, kind,
    vx: def.vx[0] + rand() * (def.vx[1] - def.vx[0]),
    vy: def.vy[0] + rand() * (def.vy[1] - def.vy[0]),
    life: def.life[0] + rand() * (def.life[1] - def.life[0]),
    maxLife: def.life[1],
    size,
    baseSize: size,
    color: kind === 'confetti' ? CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)] : def.color,
    gravity: def.gravity,
    grow: def.grow,
    spin: rand() * Math.PI * 2,
    spinSpeed: (rand() - 0.5) * 8,
  };
}

export function spawnBurst(particles, rand, x, y, kind, count) {
  for (let i = 0; i < count; i += 1) {
    particles.push(makeParticle(rand, x, y, kind));
  }
}

export function spawnSteamPuff(particles, rand, x, y) {
  spawnBurst(particles, rand, x, y, 'steam', 1);
}

export function spawnServeBurst(particles, rand, x, y) {
  spawnBurst(particles, rand, x, y, 'spark', 14);
  spawnBurst(particles, rand, x, y, 'confetti', 10);
  spawnBurst(particles, rand, x, y, 'heart', 3);
}

export function spawnBurntSmoke(particles, rand, x, y) {
  spawnBurst(particles, rand, x, y, 'smoke', 8);
  spawnBurst(particles, rand, x, y, 'steam', 4);
}

export function spawnPerfectBurst(particles, rand, x, y) {
  spawnBurst(particles, rand, x, y, 'star', 16);
  spawnBurst(particles, rand, x, y, 'spark', 10);
}

export function spawnPickupTwinkle(particles, rand, x, y) {
  spawnBurst(particles, rand, x, y, 'spark', 4);
}

export function updateParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.gravity * dt;
    p.spin += p.spinSpeed * dt;
    if (p.grow > 0) p.size = p.baseSize * (1 + (1 - Math.max(0, p.life) / p.maxLife) * p.grow);
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawHeart(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.9);
  ctx.bezierCurveTo(x - size * 1.2, y, x - size * 0.6, y - size, x, y - size * 0.35);
  ctx.bezierCurveTo(x + size * 0.6, y - size, x + size * 1.2, y, x, y + size * 0.9);
  ctx.closePath();
  ctx.fill();
}

function drawStar(ctx, x, y, size, rotation) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = rotation + (i / 10) * Math.PI * 2;
    const r = i % 2 === 0 ? size : size * 0.45;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    const alpha = Math.max(0, Math.min(1, p.life / (p.maxLife * 0.5)));
    ctx.globalAlpha = p.kind === 'steam' || p.kind === 'smoke' ? alpha * 0.55 : alpha * 0.9;
    ctx.fillStyle = p.color;
    if (p.kind === 'heart') {
      drawHeart(ctx, p.x, p.y, p.size);
    } else if (p.kind === 'star') {
      drawStar(ctx, p.x, p.y, p.size, p.spin);
    } else if (p.kind === 'confetti') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
