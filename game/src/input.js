// Sizzle & Serve — keyboard + mouse input. The game reads a single `input`
// object each frame: held movement keys, edge-triggered action keys, and the
// last mouse click (converted to canvas coordinates).

export function createInput() {
  return {
    up: false, down: false, left: false, right: false,
    interactPressed: false, // E or Space, edge-triggered (consumed by main)
    trashPressed: false,   // Q, edge-triggered
    pausePressed: false,   // P, edge-triggered
    mutePressed: false,    // M, edge-triggered
    helpPressed: false,    // H, edge-triggered
    bookPressed: false,    // B (recipe book), edge-triggered
    confirmPressed: false, // Enter, edge-triggered
    numberPressed: -1,     // 1-4, edge-triggered (-1 = none)
    click: null,           // { x, y } canvas coords, consumed by main
    floorTap: null,        // { x, y } tap on open floor = walk there
    anyKey: false,
  };
}

const KEY_MAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

export function attachInput(input, canvas) {
  window.addEventListener('keydown', (event) => {
    const held = KEY_MAP[event.code];
    if (held) {
      input[held] = true;
      event.preventDefault();
      return;
    }
    if (event.repeat) return;
    input.anyKey = true;
    switch (event.code) {
      case 'KeyE':
      case 'Space':
        input.interactPressed = true;
        event.preventDefault();
        break;
      case 'KeyQ': input.trashPressed = true; break;
      case 'KeyP': input.pausePressed = true; break;
      case 'KeyM': input.mutePressed = true; break;
      case 'KeyH':
      case 'Escape': input.helpPressed = true; break;
      case 'KeyB': input.bookPressed = true; break;
      case 'Enter': input.confirmPressed = true; break;
      case 'Digit1': input.numberPressed = 0; break;
      case 'Digit2': input.numberPressed = 1; break;
      case 'Digit3': input.numberPressed = 2; break;
      case 'Digit4': input.numberPressed = 3; break;
      default: break;
    }
  });
  window.addEventListener('keyup', (event) => {
    const held = KEY_MAP[event.code];
    if (held) input[held] = false;
  });
  window.addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = false;
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    input.click = { x, y };
    input.floorTap = { x, y };
    input.anyKey = true;
  });
  // Touch: same as a mouse click (tap to grab, tap a station, tap the floor
  // to walk there). The game is built for desktop, but taps still work.
  canvas.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((touch.clientY - rect.top) / rect.height) * canvas.height;
    input.click = { x, y };
    input.floorTap = { x, y };
    input.anyKey = true;
    event.preventDefault();
  }, { passive: false });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
}

// Clear every edge-triggered flag after the frame consumed it.
export function consumeEdges(input) {
  input.interactPressed = false;
  input.trashPressed = false;
  input.pausePressed = false;
  input.mutePressed = false;
  input.helpPressed = false;
  input.bookPressed = false;
  input.confirmPressed = false;
  input.numberPressed = -1;
  input.click = null;
  input.floorTap = null;
  input.anyKey = false;
}
