// Sizzle & Serve — all sound is synthesised live with WebAudio: no audio files,
// no network, just oscillators and filtered noise. Created lazily on the first
// user gesture so browsers never block it.

let ctx = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;
let ambienceSrc = null;
let ambienceGain = null;

// A bouncy little kitchen loop: C major pentatonic walking bass + plucked lead.
const BASS_LINE = [130.81, 130.81, 174.61, 196.0, 130.81, 146.83, 196.0, 220.0];
const LEAD_LINE = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 0, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 523.25, 0];
const MUSIC_STEP_MS = 210;

export function audioMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (muted) stopMusic();
  else startMusic();
  if (ambienceGain) ambienceGain.gain.value = muted ? 0 : 0.035;
  return muted;
}

export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }
  try {
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, filterFreq, when = 0) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start(t0);
}

// ------------------------------------------------------------- game effects
export function sfxPickup() { tone(520, 0.07, 'sine', 0.12); tone(780, 0.06, 'sine', 0.08, 0.04); }
export function sfxPlace() { tone(340, 0.08, 'triangle', 0.14); noiseBurst(0.05, 0.06, 1200); }
export function sfxChop() { noiseBurst(0.09, 0.22, 2600); tone(180, 0.06, 'square', 0.05); }
export function sfxChopDone() { tone(660, 0.09, 'sine', 0.14); tone(880, 0.12, 'sine', 0.14, 0.07); }
export function sfxSizzle() { noiseBurst(0.35, 0.10, 4200); }
export function sfxCookDone() { tone(587, 0.1, 'sine', 0.14); tone(740, 0.1, 'sine', 0.12, 0.08); }
export function sfxBurnt() { tone(220, 0.25, 'sawtooth', 0.12, 0, 110); }
export function sfxTrash() { noiseBurst(0.16, 0.16, 900); tone(140, 0.12, 'triangle', 0.1, 0, 70); }
export function sfxPlate() { tone(980, 0.06, 'sine', 0.1); tone(1240, 0.08, 'sine', 0.1, 0.05); }
export function sfxServe() {
  tone(523, 0.1, 'triangle', 0.16);
  tone(659, 0.1, 'triangle', 0.16, 0.09);
  tone(784, 0.16, 'triangle', 0.18, 0.18);
  tone(1047, 0.22, 'triangle', 0.14, 0.27);
}
export function sfxCoin() { tone(1320, 0.07, 'sine', 0.12); tone(1760, 0.14, 'sine', 0.12, 0.06); }
export function sfxError() { tone(160, 0.16, 'square', 0.1, 0, 120); }
export function sfxOrder() { tone(880, 0.09, 'sine', 0.12); tone(1175, 0.12, 'sine', 0.12, 0.08); }
export function sfxTick() { tone(1050, 0.04, 'sine', 0.07); }
export function sfxStrike() { tone(196, 0.3, 'sawtooth', 0.14, 0, 98); tone(147, 0.4, 'sawtooth', 0.12, 0.12, 73); }
export function sfxDayClear() {
  [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.16, 'triangle', 0.16, i * 0.11));
}
export function sfxGameOver() {
  [392, 370, 349, 311].forEach((f, i) => tone(f, 0.3, 'triangle', 0.14, i * 0.22));
}
export function sfxClick() { tone(700, 0.05, 'sine', 0.1); }
export function sfxRush() {
  tone(440, 0.1, 'square', 0.1);
  tone(440, 0.1, 'square', 0.1, 0.14);
  tone(587, 0.18, 'square', 0.1, 0.28);
}
export function sfxPerfect() {
  tone(1047, 0.1, 'sine', 0.14);
  tone(1319, 0.1, 'sine', 0.14, 0.08);
  tone(1568, 0.2, 'sine', 0.14, 0.16);
}
export function sfxVip() {
  tone(784, 0.09, 'triangle', 0.14);
  tone(988, 0.09, 'triangle', 0.14, 0.08);
  tone(1175, 0.16, 'triangle', 0.14, 0.16);
}
export function sfxSpecial() {
  tone(659, 0.1, 'triangle', 0.14);
  tone(880, 0.14, 'triangle', 0.14, 0.09);
}
export function sfxAchievement() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'sine', 0.13, i * 0.07));
  tone(1319, 0.22, 'sine', 0.13, 0.3);
}
export function sfxEvent() {
  tone(392, 0.1, 'triangle', 0.14);
  tone(523, 0.1, 'triangle', 0.14, 0.09);
  tone(392, 0.1, 'triangle', 0.14, 0.18);
  tone(659, 0.2, 'triangle', 0.14, 0.27);
}
export function sfxDayStart() {
  [262, 330, 392, 523].forEach((f, i) => tone(f, 0.14, 'triangle', 0.13, i * 0.09));
}
// A little arpeggio per day grade: S gets the full run, D gets two sad notes.
export function sfxGrade(grade) {
  const runs = {
    S: [523, 659, 784, 1047, 1319],
    A: [523, 659, 784, 1047],
    B: [523, 659, 784],
    C: [523, 659],
    D: [330, 262],
  };
  (runs[grade] ?? runs.B).forEach((f, i) => tone(f, 0.16, 'triangle', 0.14, i * 0.1));
}

// ------------------------------------------------------------------- music
function musicTick() {
  if (muted || !ctx) return;
  const bar = Math.floor(musicStep / 8) % 2;
  const bass = BASS_LINE[musicStep % BASS_LINE.length];
  const lead = LEAD_LINE[musicStep % LEAD_LINE.length];
  tone(bass / 2, 0.2, 'triangle', 0.055);
  if (lead > 0) tone(lead, 0.16, 'sine', bar === 0 ? 0.045 : 0.03);
  if (musicStep % 4 === 0) noiseBurst(0.03, 0.02, 6000);
  musicStep += 1;
}

export function startMusic() {
  ensureAudio();
  if (musicTimer || muted) return;
  musicTimer = window.setInterval(musicTick, MUSIC_STEP_MS);
  startAmbience();
}

// Kitchen ambience: a soft looped room tone (brown-ish noise through a low
// filter) that sits under the music. Started with the music, same gesture.
export function startAmbience() {
  const ac = ensureAudio();
  if (!ac || ambienceSrc || muted) return;
  const len = ac.sampleRate * 2;
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.2;
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  ambienceGain = ac.createGain();
  ambienceGain.gain.value = 0.035;
  src.connect(filter);
  filter.connect(ambienceGain);
  ambienceGain.connect(ac.destination);
  src.start();
  ambienceSrc = src;
}

export function stopAmbience() {
  if (ambienceSrc) {
    try { ambienceSrc.stop(); } catch { /* already stopped */ }
    ambienceSrc = null;
    ambienceGain = null;
  }
}

// Rush hour speeds the loop up: same melody, 30% faster, for the last stretch.
export function setMusicRush(on) {
  if (!musicTimer) return;
  window.clearInterval(musicTimer);
  musicTimer = window.setInterval(musicTick, on ? Math.round(MUSIC_STEP_MS * 0.7) : MUSIC_STEP_MS);
}

export function stopMusic() {
  if (musicTimer) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  stopAmbience();
}
