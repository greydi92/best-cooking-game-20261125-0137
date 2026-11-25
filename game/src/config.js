// Sizzle & Serve — game data: ingredients, recipes, stations, days, customers.
// Every number here is a design decision: prices, patience and spawn rates were tuned so a
// first-day shift feels busy but winnable and day three feels like a real rush.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;
export const HUD_HEIGHT = 118;
export const FLOOR_TOP = 132;
export const FLOOR_BOTTOM = 786;
export const FLOOR_LEFT = 14;
export const FLOOR_RIGHT = 1266;

// ---------------------------------------------------------------- ingredients
// prep: none = ready to plate as-is, chop = chopping board, cook = stove,
// fry = fryer, bake = oven.  state is what a finished ingredient is called
// on a plate: raw ingredients are never served, only their prepped form.
export const INGREDIENTS = {
  tomato:   { id: 'tomato',   name: 'Tomato',    short: 'Tomato',  prep: 'chop', state: 'chopped', color: '#e5484d', dark: '#a92c31', emoji: '🍅', blurb: 'Chop it fresh on the board.' },
  onion:    { id: 'onion',    name: 'Onion',     short: 'Onion',   prep: 'chop', state: 'chopped', color: '#f3e2c7', dark: '#c9a86a', emoji: '🧅', blurb: 'Chop it — try not to cry.' },
  lettuce:  { id: 'lettuce',  name: 'Lettuce',   short: 'Lettuce', prep: 'chop', state: 'chopped', color: '#7bc96f', dark: '#4a9e4a', emoji: '🥬', blurb: 'Crisp leaves, chopped fine.' },
  mushroom: { id: 'mushroom', name: 'Mushroom', short: 'Shroom',  prep: 'chop', state: 'chopped', color: '#d9c7a7', dark: '#9c8464', emoji: '🍄', blurb: 'Slice it thin for soup.' },
  beef:     { id: 'beef',     name: 'Beef Patty', short: 'Beef',   prep: 'cook', state: 'cooked',  color: '#8a4b2d', dark: '#5e3018', emoji: '🥩', blurb: 'Sear it on the stove.' },
  chicken:  { id: 'chicken',  name: 'Chicken',   short: 'Chicken', prep: 'cook', state: 'cooked',  color: '#e8a34c', dark: '#b57a2e', emoji: '🍗', blurb: 'Cook through, golden outside.', altPrep: 'fry', altState: 'fried' },
  fish:     { id: 'fish',     name: 'Fish Fillet', short: 'Fish',  prep: 'cook', state: 'cooked',  color: '#f2c9a0', dark: '#d99a5b', emoji: '🐟', blurb: 'Pan-fry until it flakes.' },
  bacon:    { id: 'bacon',    name: 'Bacon',     short: 'Bacon',   prep: 'cook', state: 'cooked',  color: '#c65b4e', dark: '#8f352c', emoji: '🥓', blurb: 'Crisp it on the stove.' },
  bun:      { id: 'bun',      name: 'Brioche Bun', short: 'Bun',  prep: 'none', state: 'ready',   color: '#e8b06a', dark: '#b57e3a', emoji: '🍞', blurb: 'Soft bun, ready to hold it all.' },
  dough:    { id: 'dough',    name: 'Pizza Dough', short: 'Dough', prep: 'bake', state: 'baked',   color: '#f2ddb0', dark: '#c9a86a', emoji: '🍕', blurb: 'Bake it into a crust.' },
  tortilla: { id: 'tortilla', name: 'Tortilla',  short: 'Wrap',    prep: 'none', state: 'ready',   color: '#f5e3b3', dark: '#cbb27a', emoji: '🌯', blurb: 'Warm wrap, ready to fill.' },
  cheese:   { id: 'cheese',   name: 'Cheese',    short: 'Cheese',  prep: 'none', state: 'ready',   color: '#ffd23e', dark: '#d9a400', emoji: '🧀', blurb: 'Melty cheddar, no prep needed.' },
  pasta:    { id: 'pasta',    name: 'Pasta',     short: 'Pasta',   prep: 'cook', state: 'cooked',  color: '#f2c14e', dark: '#c99327', emoji: '🍝', blurb: 'Boil it on the stove.' },
  egg:      { id: 'egg',      name: 'Egg',       short: 'Egg',     prep: 'cook', state: 'cooked',  color: '#fff3c4', dark: '#e8c96a', emoji: '🍳', blurb: 'Fry it sunny side up.' },
  potato:   { id: 'potato',   name: 'Potato',    short: 'Potato',  prep: 'fry',  state: 'fried',   color: '#f6c453', dark: '#c99327', emoji: '🍟', blurb: 'Fry it golden and crisp.' },
  carrot:   { id: 'carrot',   name: 'Carrot',    short: 'Carrot',  prep: 'chop', state: 'chopped', color: '#f08a24', dark: '#c25e10', emoji: '🥕', blurb: 'Chop it for crunch.' },
};

export const INGREDIENT_LIST = Object.values(INGREDIENTS);

// Which prep station a prep type needs, and how long one unit takes (seconds).
export const PREP_STATIONS = {
  chop: { station: 'board',  seconds: 2.2, verb: 'Chopping',  sound: 'chop' },
  cook: { station: 'stove',  seconds: 4.0, verb: 'Cooking',   sound: 'sizzle' },
  fry:  { station: 'fryer',  seconds: 4.5, verb: 'Frying',    sound: 'fry' },
  bake: { station: 'oven',   seconds: 6.0, verb: 'Baking',    sound: 'bake' },
};

// How long a finished item may sit on its station before it burns (seconds).
export const BURN_AFTER = { stove: 7, fryer: 8, oven: 10, board: Infinity };

// ------------------------------------------------------------------- recipes
// components: [ingredientId, requiredState]. A plate matches a recipe when its
// set of (id, state) pairs equals the recipe's set, no more and no less.
export const RECIPES = [
  { id: 'salad',   name: 'Garden Salad',      price: 14, stars: 1, day: 1, color: '#7bc96f', components: [['tomato', 'chopped'], ['lettuce', 'chopped'], ['carrot', 'chopped']], tagline: 'Crisp, fresh, gone in seconds.' },
  { id: 'soup',    name: 'Mushroom Soup',     price: 16, stars: 1, day: 1, color: '#c9a86a', components: [['mushroom', 'chopped'], ['onion', 'chopped'], ['carrot', 'chopped']], tagline: 'Earthy, warm, comfort in a bowl.' },
  { id: 'wrap',    name: 'Veggie Wrap',       price: 17, stars: 1, day: 1, color: '#a8d08d', components: [['tortilla', 'ready'], ['lettuce', 'chopped'], ['tomato', 'chopped'], ['mushroom', 'chopped']], tagline: 'Rolled tight, eaten faster.' },
  { id: 'burger',  name: 'Classic Burger',    price: 22, stars: 2, day: 1, color: '#e8a34c', components: [['bun', 'ready'], ['beef', 'cooked'], ['tomato', 'chopped'], ['lettuce', 'chopped']], tagline: 'The one that built this kitchen.' },
  { id: 'pasta',   name: 'Tomato Pasta',      price: 19, stars: 2, day: 1, color: '#f2c14e', components: [['pasta', 'cooked'], ['tomato', 'chopped'], ['cheese', 'ready']], tagline: 'Twirl it, sauce it, serve it.' },
  { id: 'fishchips', name: 'Fish & Chips',    price: 20, stars: 2, day: 2, color: '#f2c9a0', components: [['fish', 'cooked'], ['potato', 'fried']], tagline: 'Golden fish, golden chips.' },
  { id: 'cheeseburger', name: 'Cheese Burger', price: 24, stars: 2, day: 2, color: '#ffd23e', components: [['bun', 'ready'], ['beef', 'cooked'], ['cheese', 'ready'], ['onion', 'chopped']], tagline: 'Double cheese, zero patience.' },
  { id: 'sandwich', name: 'Chicken Sandwich', price: 21, stars: 2, day: 2, color: '#e8a34c', components: [['bun', 'ready'], ['chicken', 'cooked'], ['lettuce', 'chopped'], ['cheese', 'ready']], tagline: 'Crispy chicken, soft bun.' },
  { id: 'pizza',   name: 'Margherita Pizza',  price: 23, stars: 3, day: 2, color: '#e5484d', components: [['dough', 'baked'], ['tomato', 'chopped'], ['cheese', 'ready']], tagline: 'Wood-fired soul, oven-baked here.' },
  { id: 'baconroll', name: 'Bacon & Egg Roll', price: 18, stars: 2, day: 2, color: '#c65b4e', components: [['bun', 'ready'], ['bacon', 'cooked'], ['egg', 'cooked']], tagline: 'Breakfast, all day, every day.' },
  { id: 'nuggets', name: 'Nuggets & Fries',   price: 19, stars: 2, day: 3, color: '#f6c453', components: [['chicken', 'fried'], ['potato', 'fried']], tagline: 'Dip it. Devour it. Repeat.' },
  { id: 'breakfast', name: 'Full Breakfast',  price: 26, stars: 3, day: 3, color: '#f2c14e', components: [['bun', 'ready'], ['bacon', 'cooked'], ['egg', 'cooked'], ['potato', 'fried']], tagline: 'Four parts, one very full plate.' },
  { id: 'loadedfries', name: 'Loaded Fries',  price: 21, stars: 2, day: 2, color: '#ffd23e', components: [['potato', 'fried'], ['cheese', 'ready'], ['bacon', 'cooked']], tagline: 'Fries, drowned in cheese and bacon.' },
  { id: 'chickenwrap', name: 'Chicken Wrap',  price: 22, stars: 2, day: 2, color: '#a8d08d', components: [['tortilla', 'ready'], ['chicken', 'cooked'], ['lettuce', 'chopped'], ['tomato', 'chopped']], tagline: 'Grilled chicken, rolled to go.' },
  { id: 'shroompizza', name: 'Mushroom Pizza', price: 25, stars: 3, day: 3, color: '#d9c7a7', components: [['dough', 'baked'], ['mushroom', 'chopped'], ['cheese', 'ready'], ['tomato', 'chopped']], tagline: 'Earthy, cheesy, straight from the oven.' },
  { id: 'fishsandwich', name: 'Fish Sandwich',  price: 21, stars: 2, day: 2, color: '#f2c9a0', components: [['bun', 'ready'], ['fish', 'cooked'], ['lettuce', 'chopped']], tagline: 'Flaky fish, soft bun, zero fuss.' },
  { id: 'eggsandwich', name: 'Egg Sandwich',   price: 20, stars: 2, day: 2, color: '#fff3c4', components: [['bun', 'ready'], ['egg', 'cooked'], ['cheese', 'ready'], ['tomato', 'chopped']], tagline: 'Breakfast’s quiet little brother.' },
  { id: 'supremepizza', name: 'Supreme Pizza', price: 27, stars: 3, day: 3, color: '#e5484d', components: [['dough', 'baked'], ['beef', 'cooked'], ['mushroom', 'chopped'], ['cheese', 'ready']], tagline: 'Everything the kitchen has, on one crust.' },
];

// Recipe mastery: serve the same dish this many times in one run and it pays
// a permanent bonus — the book shows which dishes you have mastered.
export const MASTERY_SERVES = 3;
export const MASTERY_BONUS = 0.10;

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// Recipes unlocked on a given day (cumulative).
export function recipesForDay(day) {
  return RECIPES.filter((r) => r.day <= day);
}

// ---------------------------------------------------------------------- days
// One shift per day: more orders, faster spawns, shorter patience, rush hour.
export const DAYS = [
  { day: 1, name: 'Day 1 — Opening Lunch',  shiftSeconds: 150, maxOrders: 2, spawnEvery: 13, patience: 78, tipRate: 0.5, goal: 120, intro: 'Your first lunch service. Two orders at a time — learn the kitchen, keep the board clear.' },
  { day: 2, name: 'Day 2 — Dinner Rush',    shiftSeconds: 170, maxOrders: 3, spawnEvery: 10, patience: 72, tipRate: 0.5, goal: 220, intro: 'Word got out. Three orders at once, pizzas and burgers flying. The stove never rests now.' },
  { day: 3, name: 'Day 3 — Grand Finale',   shiftSeconds: 190, maxOrders: 4, spawnEvery: 12, patience: 80, tipRate: 0.6, goal: 340, intro: 'The food critic is in town. Four orders at once and the shortest tempers yet. Cook like a legend.' },
];

export const RUSH_SECONDS = 30; // last N seconds of a shift: spawns double up
export const MAX_STRIKES = 3;
export const CARRY_MAX = 3;

// ------------------------------------------------------------------- crates
// Four ingredient crates, each holding four ingredients. Number keys 1-4 grab
// from the nearest crate; clicking an ingredient icon grabs it too.
export const CRATES = [
  { id: 'produce', name: 'Produce',  items: ['tomato', 'onion', 'lettuce', 'mushroom'], color: '#5da24a', x: 24,  y: 150, w: 150, h: 118 },
  { id: 'meat',    name: 'Meat & Fish', items: ['beef', 'chicken', 'fish', 'bacon'],    color: '#b0523c', x: 24,  y: 282, w: 150, h: 118 },
  { id: 'bakery',  name: 'Bakery',   items: ['bun', 'dough', 'tortilla', 'cheese'],      color: '#c99327', x: 24,  y: 414, w: 150, h: 118 },
  { id: 'pantry',  name: 'Pantry',   items: ['pasta', 'egg', 'potato', 'carrot'],        color: '#7a6a9e', x: 24,  y: 546, w: 150, h: 118 },
];

// ------------------------------------------------------------ prep stations
// Boards chop, stoves cook, fryer fries, oven bakes. Each station has slots;
// a slot holds one item and a progress bar. Plating and serving live below.
export const STATIONS = [
  { id: 'board1', kind: 'board', name: 'Chopping Board',  slots: 1, x: 300, y: 252, w: 150, h: 96 },
  { id: 'board2', kind: 'board', name: 'Chopping Board',  slots: 1, x: 470, y: 252, w: 150, h: 96 },
  { id: 'stove1', kind: 'stove', name: 'Stove',           slots: 2, x: 700, y: 252, w: 190, h: 96 },
  { id: 'stove2', kind: 'stove', name: 'Stove',           slots: 2, x: 910, y: 252, w: 190, h: 96 },
  { id: 'fryer',  kind: 'fryer', name: 'Fryer',           slots: 2, x: 1120, y: 252, w: 130, h: 96 },
  { id: 'oven',   kind: 'oven',  name: 'Oven',            slots: 2, x: 1120, y: 382, w: 130, h: 118 },
  { id: 'plates', kind: 'plates', name: 'Clean Plates',   slots: 0, x: 300, y: 640, w: 130, h: 118 },
  { id: 'plating', kind: 'plating', name: 'Plating Counter', slots: 1, x: 470, y: 640, w: 300, h: 118 },
  { id: 'serve',  kind: 'serve', name: 'Serving Window',  slots: 0, x: 800, y: 640, w: 300, h: 118 },
  { id: 'trash',  kind: 'trash', name: 'Trash & Sink',    slots: 0, x: 1120, y: 640, w: 130, h: 118 },
];

// Chef spawn point (centre of the open floor).
export const CHEF_SPAWN = { x: 640, y: 470 };

// ------------------------------------------------------------------ customers
// Customers are drawn as coloured faces with a name; their patience colour is
// the order timer. Names and lines rotate so repeat orders feel alive.
export const CUSTOMERS = [
  { name: 'Maya',   color: '#e88ca0', skin: '#f2c9a0', line: 'Make it snappy, chef!' },
  { name: 'Rudi',   color: '#6a9fd8', skin: '#c98d5f', line: 'I skipped breakfast for this.' },
  { name: 'Sinta',  color: '#9b7ed9', skin: '#f2c9a0', line: 'Extra cheese, please!' },
  { name: 'Budi',   color: '#5da24a', skin: '#8a5a3b', line: 'My usual. You know it.' },
  { name: 'Lina',   color: '#e8a34c', skin: '#f2c9a0', line: 'I am SO hungry right now.' },
  { name: 'Dedi',   color: '#d95f4b', skin: '#c98d5f', line: 'Quick! My break ends soon.' },
  { name: 'Ayu',    color: '#4ecdc4', skin: '#f2c9a0', line: 'Surprise me, chef.' },
  { name: 'Tono',   color: '#8a6d3b', skin: '#8a5a3b', line: 'Big appetite, big tip.' },
  { name: 'Nina',   color: '#e5484d', skin: '#f2c9a0', line: 'This better be worth it.' },
  { name: 'Fajar',  color: '#3f7d5d', skin: '#c98d5f', line: 'Cooking is an art, right?' },
  { name: 'Wulan',  color: '#c96aa0', skin: '#f2c9a0', line: 'I brought my appetite and my camera.' },
  { name: 'Agus',   color: '#7a6a9e', skin: '#8a5a3b', line: 'One of everything. I am not joking.' },
  { name: 'Rina',   color: '#d9a400', skin: '#f2c9a0', line: 'My kids are waiting in the car!' },
  { name: 'Joko',   color: '#4a7a5d', skin: '#c98d5f', line: 'Make it spicy, chef. I dare you.' },
  { name: 'Dewi',   color: '#e88ca0', skin: '#f2c9a0', line: 'Something light, please. With fries.' },
  { name: 'Putri',  color: '#6a9fd8', skin: '#f2c9a0', line: 'I review restaurants. No pressure.' },
  { name: 'Sari',   color: '#3f7d5d', skin: '#c98d5f', line: 'The smell from outside dragged me in.' },
  { name: 'Bambang', color: '#8a6d3b', skin: '#8a5a3b', line: 'My stomach has been growling since morning.' },
  { name: 'Intan',  color: '#c96aa0', skin: '#f2c9a0', line: 'I will post this. Make it photogenic!' },
  { name: 'Eko',    color: '#4a7a5d', skin: '#c98d5f', line: 'Feed me before my meeting starts.' },
  { name: 'Ratna',  color: '#d9a400', skin: '#f2c9a0', line: 'I heard the burgers here are legendary.' },
  { name: 'Hendra', color: '#6a9fd8', skin: '#8a5a3b', line: 'Just something quick, chef. And tasty.' },
  { name: 'Lestari', color: '#9b7ed9', skin: '#f2c9a0', line: 'My kids say your fries are the best.' },
  { name: 'Yusuf',  color: '#d95f4b', skin: '#c98d5f', line: 'I have tried every stall in town. Impress me.' },
  { name: 'Dian',   color: '#4ecdc4', skin: '#f2c9a0', line: 'Something spicy, chef. Surprise my taste buds.' },
  { name: 'Rizky',  color: '#e8a34c', skin: '#8a5a3b', line: 'My friends dared me to finish the Full Breakfast.' },
];

// The head chef's barks: short shouts that pop up when a dish goes out.
// One in four serves gets one, so the kitchen feels alive without spamming.
export const CHEF_BARKS = [
  '“Service!”',
  '“Beautiful plate!”',
  '“That’s how we do it!”',
  '“One down — keep the line moving!”',
  '“The pass is clear!”',
  '“Textbook, chef!”',
  '“Another happy table!”',
  '“Fire the next one!”',
  '“That’s a menu favourite!”',
  '“Clean, fast, delicious!”',
  '“The critic is smiling!”',
  '“You make it look easy!”',
  '“That plate deserves a photo!”',
  '“Service with a smile — and speed!”',
  '“The whole dining room smells amazing!”',
  '“Keep this pace and we will need a bigger kitchen!”',
  '“I have run kitchens for twenty years — this is good.”',
  '“One more service like this and we are famous!”',
  '“The orders keep coming and you keep delivering!”',
  '“That is how you run a pass, chef!”',
];
export const HEAD_CHEF_LINES = [
  '“First service, chef. Sharp knives, sharper timing. The board is your bible.”',
  '“Dinner service. They are hungrier, louder, and they tip better. Earn it.”',
  '“The critic is in the building. Cook like your name is on the door — it is.”',
];

// Every control, in one place, so the help screen and the footer never drift.
export const KEYBINDS = [
  { keys: 'W A S D / ← ↑ ↓ →', action: 'Move the chef around the kitchen' },
  { keys: 'E / Space', action: 'Interact: grab, place, pick up, serve' },
  { keys: '1 – 4', action: 'Grab an ingredient from the nearest crate' },
  { keys: 'Click', action: 'Grab a crate ingredient, or use a nearby station' },
  { keys: 'Q', action: 'Bin the last thing you are holding' },
  { keys: 'B', action: 'Open the recipe book (pauses the shift)' },
  { keys: 'H / Esc', action: 'How to play' },
  { keys: 'P', action: 'Pause / resume' },
  { keys: 'M', action: 'Mute / unmute the music and effects' },
  { keys: 'Enter', action: 'Start the day / continue after a shift' },
];

export const SERVE_LINES = [
  'Perfect! Just what I wanted.',
  'Mmm! Worth every coin.',
  'Finally! You are a star, chef.',
  'Delicious! I will be back.',
  'That was fast AND tasty!',
  'You cook like my grandmother. Better, even.',
  'Five stars. I am telling everyone.',
  'Hot, fresh, perfect. Thank you!',
  'This is why I skip breakfast.',
  'Worth the wait — barely. Still delicious!',
  'I can taste the love in this. And the butter.',
  'My compliments to the chef — all of them.',
  'I am ordering this again tomorrow. And the day after.',
  'Hot, fresh, perfect. Thank you!',
  'You have a customer for life now, chef.',
  'I came hungry and I am leaving happy. That is the job.',
  'This beats the place across the street by miles.',
  'Tell the chef this was the best thing I ate all week.',
];

export const VIP_LINES = [
  'Exquisite. The critic will hear of this.',
  'I dine everywhere. This is genuinely good.',
  'Double pay for double delight. Well done.',
  'You cook like the chefs back home. Better, even.',
  'I will send my driver for takeaway tomorrow.',
];

export const ANGRY_LINES = [
  'Too slow! I am leaving.',
  'My food! Where is my food?!',
  'Unbelievable. I am out.',
  'I waited HOW long? Goodbye.',
  'My lunch break is over. Thanks for nothing.',
  'I will be eating somewhere else from now on.',
  'This is the last time I queue here.',
];

// How to cook each dish, step by step — shown in the recipe book (B) so a
// new cook never has to guess which station does what.
export const RECIPE_STEPS = {
  salad: ['Chop tomato, lettuce, carrot', 'Plate all three', 'Serve fresh'],
  soup: ['Chop mushroom, onion, carrot', 'Plate all three', 'Serve warm'],
  wrap: ['Chop lettuce, tomato, mushroom', 'Add tortilla on the plate', 'Roll and serve'],
  burger: ['Cook the beef patty', 'Chop tomato + lettuce', 'Bun + patty + veg on a plate'],
  pasta: ['Boil the pasta', 'Chop the tomato', 'Pasta + tomato + cheese'],
  fishchips: ['Cook the fish fillet', 'Fry the potato', 'Plate fish + chips'],
  cheeseburger: ['Cook the beef patty', 'Chop the onion', 'Bun + patty + cheese + onion'],
  sandwich: ['Cook the chicken', 'Chop the lettuce', 'Bun + chicken + lettuce + cheese'],
  pizza: ['Bake the dough', 'Chop the tomato', 'Crust + tomato + cheese'],
  baconroll: ['Cook bacon + egg', 'Take a fresh bun', 'Bun + bacon + egg'],
  nuggets: ['Fry chicken + potato', 'Plate both golden', 'Serve with a smile'],
  breakfast: ['Cook bacon + egg', 'Fry the potato', 'Bun + bacon + egg + fries'],
  loadedfries: ['Fry the potato', 'Cook the bacon', 'Fries + cheese + bacon'],
  chickenwrap: ['Cook the chicken', 'Chop lettuce + tomato', 'Wrap + chicken + veg'],
  shroompizza: ['Bake the dough', 'Chop mushroom + tomato', 'Crust + mushroom + tomato + cheese'],
  fishsandwich: ['Cook the fish fillet', 'Chop the lettuce', 'Bun + fish + lettuce'],
  eggsandwich: ['Fry the egg', 'Chop the tomato', 'Bun + egg + cheese + tomato'],
  supremepizza: ['Bake the dough', 'Cook the beef', 'Crust + beef + mushroom + cheese'],
};
export const RECIPE_LORE = {
  salad: 'Invented by accident when the chef dropped a tomato into the lettuce.',
  soup: 'Simmers while you work — the smell alone sells three more bowls.',
  wrap: 'Rolled tight enough to eat one-handed, messy enough to love.',
  burger: 'The house signature. The patty is seared, never steamed.',
  pasta: 'Grandma’s recipe, minus grandma. She would approve anyway.',
  fishchips: 'Friday’s favourite, served every day because the town demanded it.',
  cheeseburger: 'Two kinds of melt: the cheese, and the customer’s heart.',
  sandwich: 'Crispy outside, juicy inside — the crunch is the point.',
  pizza: 'A crust that survived three oven fires and one very picky critic.',
  baconroll: 'Breakfast’s greatest hits, stacked into one heroic bun.',
  nuggets: 'The dip is secret. The crunch is not — you can hear it outside.',
  breakfast: 'Everything the kitchen can fry, on one plate, before noon.',
  loadedfries: 'The fryer’s loudest fan favourite — cheese pulls for days.',
  chickenwrap: 'Lunch you can eat with one hand while running a kitchen with the other.',
  shroompizza: 'The vegetarian that even the meat crowd orders twice.',
  fishsandwich: 'The catch of the day, between bread, like it always wanted.',
  eggsandwich: 'Soft egg, melted cheese — the quiet achiever of the menu.',
  supremepizza: 'Four toppings, one crust, zero regrets.',
};

// Floating-tip flavour text for the recipe book panel.
export const COOKING_TIPS = [
  'Tip: chop while the stove cooks — never stand still.',
  'Tip: a burnt pan is a trashed pan. Watch the bar turn red.',
  'Tip: serve fast for a fat tip — patience pays.',
  'Tip: three serves in a row builds your combo multiplier.',
  'Tip: plates stack on the plating counter — build, then serve.',
  'Tip: the fryer does fries AND nuggets. Two birds, one oil.',
  'Tip: during RUSH HOUR orders arrive twice as fast.',
  'Tip: press 1-4 near a crate to grab ingredients fast.',
  'Tip: the daily special pays 1.5x — check the recipe book (B).',
  'Tip: VIP orders pay double but their patience is short.',
  'Tip: a perfect serve (over 75% patience left) earns a bonus.',
  'Tip: keep one patty cooking while you chop — the stove is free labour.',
  'Tip: two boards means two chops at once. Parallel is profit.',
  'Tip: an expired order costs a strike AND resets your combo.',
  'Tip: click an ingredient in a crate to grab it without keys.',
  'Tip: the oven holds two doughs — pizzas queue up nicely.',
  'Tip: buns, tortillas and cheese need no prep — plate them straight from the crate.',
  'Tip: chicken fries into nuggets in the fryer — the stove is not its only home.',
  'Tip: serve the same dish 3 times to master it — mastered dishes pay +10% forever.',
  'Tip: the daily special is random every day — check the book (B) at shift start.',
  'Tip: a burnt pan costs you the ingredient AND the time — bin it fast and move on.',
  'Tip: VIPs arrive from day 2 — gold border, double pay, short fuse.',
  'Tip: two stoves with two burners each means four things can cook at once.',
  'Tip: during an event, read the banner — the rules change while it lasts.',
  'Tip: the book (B) shows steps for every dish — check it before a new day unlocks.',
  'Tip: burnt food on a station blocks the slot until you bin it — clear it fast.',
  'Tip: rush hour is the last 30 seconds — pre-cook before it starts.',
  'Tip: an order about to expire flashes — serve it first, even without a combo.',
];

// One-line help per station kind, shown as a tooltip when the chef stands by.
export const STATION_HELP = {
  board: 'Chopping Board — press E with a raw chop item in hand, wait for READY.',
  stove: 'Stove — cooks beef, chicken, fish, bacon, egg and pasta. Two burners.',
  fryer: 'Fryer — fries potato and chicken. Golden in 4.5 seconds, burnt soon after.',
  oven: 'Oven — bakes dough into pizza crust. Slow but worth it.',
  plates: 'Clean Plates — press E to take one. Every dish needs a plate.',
  plating: 'Plating Counter — put a plate down, add the recipe parts, pick it up.',
  serve: 'Serving Window — carry a finished plate here and press E to serve.',
  trash: 'Trash & Sink — press E to bin what you are holding. Burnt food goes here.',
  produce: 'Produce Crate — tomato, onion, lettuce, mushroom. Keys 1-4 or click.',
  meat: 'Meat & Fish Crate — beef, chicken, fish, bacon. Keys 1-4 or click.',
  bakery: 'Bakery Crate — bun, dough, tortilla, cheese. Keys 1-4 or click.',
  pantry: 'Pantry Crate — pasta, egg, potato, carrot. Keys 1-4 or click.',
};

// A chef's note on every ingredient — shown in the recipe book's ingredient
// list so new cooks learn what goes where without memorising the menu.
export const INGREDIENT_NOTES = {
  tomato: 'The workhorse. Chopped for salads, burgers, pasta and pizza.',
  onion: 'Chop it for soup, burgers and wraps. It makes everything taste cooked.',
  lettuce: 'Crunch and colour. Goes in salads, burgers, sandwiches and wraps.',
  mushroom: 'Earthy and quick to chop. Soup and wraps love it.',
  beef: 'Sear it into a patty. The heart of both burgers.',
  chicken: 'Cook it for sandwiches, fry it for nuggets. Two dishes, one bird.',
  fish: 'Pan-fry until it flakes. Half of Fish & Chips.',
  bacon: 'Crisp it fast. Breakfast rolls and full breakfasts need it.',
  bun: 'No prep, all purpose. Burgers, sandwiches and breakfast rolls.',
  dough: 'Bake it into a crust. Pizza starts here.',
  tortilla: 'No prep. The wrap is a salad you can hold.',
  cheese: 'No prep, instant melt. Pasta, burgers, pizza, sandwiches.',
  pasta: 'Boil it on the stove. Tomato Pasta is the day-one classic.',
  egg: 'Fry it sunny side up. Breakfast would be lost without it.',
  potato: 'Fry it golden. Chips for fish, fries for breakfast and nuggets.',
  carrot: 'Chop for crunch. Salads and soup both want it.',
};
