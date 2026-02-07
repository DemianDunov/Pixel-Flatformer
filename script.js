// ================= CANVAS =================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = Math.min(window.innerWidth - 20, 480);
canvas.height = 270;

// ================= CONFIG =================
const TILE = 40;
const WORLD_WIDTH = 999999;
const GRAVITY = 0.8;
const JUMP = -10;
const SPEED = 4;

// ================= STATE =================
let cameraX = 0;
let keys = {};
let score = 0;
let gameOver = false;

// ================= UI =================
const scoreEl = document.getElementById("score");
const highEl = document.getElementById("high");
let highScore = localStorage.getItem("marioHigh") || 0;
highEl.textContent = highScore;

// ================= PLAYER =================
const player = {
  x: 120,
  y: 0,
  w: 18,
  h: 18,
  vy: 0,
  onGround: false
};

// ================= INPUT =================
document.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  keys[k] = true;

  if ((k === "w" || k === " " || k === "arrowup") && player.onGround) {
    player.vy = JUMP;
    player.onGround = false;
  }
});

document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

left.onmousedown = left.ontouchstart = () => keys["a"] = true;
left.onmouseup = left.ontouchend = () => keys["a"] = false;
right.onmousedown = right.ontouchstart = () => keys["d"] = true;
right.onmouseup = right.ontouchend = () => keys["d"] = false;

jump.onclick = () => {
  if (player.onGround) {
    player.vy = JUMP;
    player.onGround = false;
  }
};

reset.onclick = () => location.reload();

// ================= PLATFORM =================
let platforms = [];
let gapCount = 0;
const MAX_GAP = 2;
const SAFE_TILES = 10;

// generate platform world
for (let x = 0; x < WORLD_WIDTH; x += TILE) {
  const isSafeZone = x < SAFE_TILES * TILE;

  let makeGap = false;
  if (!isSafeZone) {
    makeGap = Math.random() < 0.18;
  }

  if (makeGap && gapCount < MAX_GAP) {
    gapCount++;
    continue;
  }

  gapCount = 0;

  platforms.push({
    x: x,
    y: canvas.height - 30,
    w: TILE,
    h: 30,
    move: isSafeZone ? false : Math.random() < 0.08,
    dir: Math.random() < 0.5 ? -1 : 1
  });
}

// ================= PLAYER SAFE SPAWN =================
function placePlayerOnStartPlatform() {
  const p = platforms.find(pl =>
    pl.x <= player.x && pl.x + pl.w > player.x
  );

  if (p) {
    player.y = p.y - player.h;
    player.vy = 0;
    player.onGround = true;
  }
}

placePlayerOnStartPlatform();

// ================= ENEMIES =================
let enemies = [];

function safeSpawnX() {
  let x;
  do {
    x = Math.random() * (WORLD_WIDTH - 40);
  } while (Math.abs(x - player.x) < 250);
  return x;
}

function canSpawn(minScore, chance) {
  return score > minScore && Math.random() < chance;
}

// musuh jalan
setInterval(() => {
  if (!canSpawn(40, 0.5) || gameOver) return;

  enemies.push({
    x: safeSpawnX(),
    y: canvas.height - 48,
    w: 18,
    h: 18,
    vx: Math.random() < 0.5 ? -1.2 : 1.2,
    vy: 0
  });
}, 3200);

// musuh jatuh
setInterval(() => {
  if (!canSpawn(70, 0.5) || gameOver) return;

  enemies.push({
    x: safeSpawnX(),
    y: -20,
    w: 16,
    h: 16,
    vx: 0,
    vy: 3
  });
}, 2600);

// musuh naik
setInterval(() => {
  if (!canSpawn(100, 0.45) || gameOver) return;

  enemies.push({
    x: safeSpawnX(),
    y: canvas.height + 20,
    w: 16,
    h: 16,
    vx: 0,
    vy: -3
  });
}, 3000);

// ================= UPDATE =================
function update() {
  if (gameOver) return;

  if (keys["a"] || keys["arrowleft"]) player.x -= SPEED;
  if (keys["d"] || keys["arrowright"]) player.x += SPEED;

  player.vy += GRAVITY;
  player.y += player.vy;
  player.onGround = false;

  platforms.forEach(p => {
    if (p.move) {
      p.x += p.dir;
      if (p.x < 0 || p.x + p.w > WORLD_WIDTH) p.dir *= -1;
    }

    if (
      player.x < p.x + p.w &&
      player.x + player.w > p.x &&
      player.y + player.h <= p.y + 10 &&
      player.y + player.h + player.vy >= p.y
    ) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  });

  enemies.forEach(e => {
    e.x += e.vx || 0;
    e.y += e.vy || 0;

    if (
      player.x < e.x + e.w &&
      player.x + player.w > e.x &&
      player.y < e.y + e.h &&
      player.y + player.h > e.y
    ) {
      endGame();
    }
  });

  enemies = enemies.filter(e =>
    e.x > -60 &&
    e.x < WORLD_WIDTH + 60 &&
    e.y > -60 &&
    e.y < canvas.height + 60
  );

  if (player.y > canvas.height) endGame();

  score++;
  scoreEl.textContent = score;
}

// ================= CAMERA =================
function updateCamera() {
  cameraX = player.x - canvas.width / 2;
  if (cameraX < 0) cameraX = 0;
  if (cameraX > WORLD_WIDTH - canvas.width) {
    cameraX = WORLD_WIDTH - canvas.width;
  }
}

// ================= DRAW =================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0f0";
  ctx.fillRect(player.x - cameraX, player.y, player.w, player.h);

  ctx.fillStyle = "#666";
  platforms.forEach(p =>
    ctx.fillRect(p.x - cameraX, p.y, p.w, p.h)
  );

  ctx.fillStyle = "red";
  enemies.forEach(e =>
    ctx.fillRect(e.x - cameraX, e.y, e.w, e.h)
  );
}

// ================= GAME OVER =================
function endGame() {
  gameOver = true;
  if (score > highScore) {
    localStorage.setItem("marioHigh", score);
  }
  alert("GAME OVER. SALAH LANGKAH.");
}

// ================= LOOP =================
function loop() {
  update();
  updateCamera();
  draw();
  requestAnimationFrame(loop);
}

loop();
