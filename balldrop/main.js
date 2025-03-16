//----------------------
// consts
//----------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameStatusElement = document.getElementById("gameStatus");
const restartButton = document.getElementById("restartButton");
const gameInfoElement = document.getElementById("gameInfo");

const CONFIG = {
  blue_pin_chance: 0.1,
  gold_pin_chance: 0.1,
  ballRadius: 10,
  pinRadius: 5,
  gravity: 0.2,
  bounce: 0.6,
};

//----------------------
// game variables
//----------------------
let balls = [];
let pins = [];
const buckets = [];
let levelOver = false;

let totalBalls = 15;
let score = 0;
let gameActive = true;
let currentLevel = 1;

//----------------------
// util
//----------------------

function drawBackground() {
  const background = [
    `hsl(${currentLevel * 30}, 70%, 70%)`,
    `hsl(${currentLevel * 30 + 60}, 70%, 70%)`,
  ];

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, background[0]);
  gradient.addColorStop(1, background[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

//----------------------
// init
//----------------------

function initializeLevel(level) {
  levelOver = false;
  // Clear existing pins and balls
  pins = [];
  balls = [];

  // Reset balls count
  totalBalls += 5;

  // Create new pin layout
  const l = level % 20;
  if (levelLayouts[l]) {
    levelLayouts[l]();
  } else {
    // If level doesn't exist, create a random pattern
    for (let i = 0; i < 30 + level * 5; i++) {
      pins.push(
        createPin(
          100 + Math.random() * (canvas.width - 200),
          150 + Math.random() * (canvas.height - 300),
        ),
      );
    }
  }

  // Create buckets
  buckets.length = 0;
  for (let i = 0; i < 5; i++) {
    buckets.push({
      x: 25 + i * 75,
      y: canvas.height - 30,
      width: 50,
      height: 30,
      score: (i + 1) * 100,
    });
  }

  gameActive = true;
}

function initializeGame() {
  score = 0;
  currentLevel = 1;
  totalBalls = 15;
  restartButton.style.display = "none";
  gameInfoElement.style.pointerEvents = "none";
  setStatus("<h1>BallDrop</h1><br /><small>tap above to begin</small>", 5000);
  initializeLevel(currentLevel);
}

//----------------------
// UI
//----------------------
function setStatus(message, timeout = 1000) {
  gameStatusElement.innerHTML = message;
  setTimeout(() => {
    if (gameActive) gameStatusElement.textContent = "";
  }, timeout);
}

function showScorePopup(x, y, score) {
  const rect = canvas.getBoundingClientRect();
  x += rect.left;
  y += rect.top;

  if (typeof score === "string" && score.includes("Credit")) {
    y -= 100;
  }

  let elm = document.createElement("div");
  elm.className = "score-popup";
  elm.textContent = `+${score}`;
  elm.style.left = `${x}px`;
  elm.style.top = `${y}px`;
  document.body.appendChild(elm);

  setTimeout(() => {
    elm.remove();
  }, 1000);
}

//----------------------
// classes
//----------------------

class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = CONFIG.ballRadius;
    this.active = true;
  }

  update() {
    if (!this.active) return;

    this.vy += CONFIG.gravity;
    this.x += this.vx;
    this.y += this.vy;

    // Wall collisions
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx *= -CONFIG.bounce;
    }
    if (this.x > canvas.width - this.radius) {
      this.x = canvas.width - this.radius;
      this.vx *= -CONFIG.bounce;
    }

    // Pin collisions
    pins.forEach((pin) => {
      if (!pin.active) return;

      const dx = this.x - pin.x;
      const dy = this.y - pin.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.radius + pin.radius) {
        const angle = Math.atan2(dy, dx);
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

        this.vx = Math.cos(angle) * speed * CONFIG.bounce;
        this.vy = Math.sin(angle) * speed * CONFIG.bounce;

        const minDistance = this.radius + pin.radius;
        this.x = pin.x + Math.cos(angle) * minDistance;
        this.y = pin.y + Math.sin(angle) * minDistance;

        // Pin hit effects
        pin.active = false;
        const pinScore = pin.isBlue ? 100 : 50;
        score += pinScore;

        // Create particles

        createParticleEffect(pin.x, pin.y, pin.isBlue ? "bluePin" : "pin");
        showScorePopup(pin.x, pin.y, pin.isBlue ? 100 : 50);

        // Show score popup
        showScorePopup(pin.x, pin.y, pinScore);

        // Add balls for blue pins
        if (pin.isBlue) {
          totalBalls += 3;
          setStatus("+3 Balls!");
        }

        // Add credits for gold pins
        if (pin.isGold) {
          credits += 1;
          setStatus("+1 Credit");
        }
      }
    });
    // Bucket collisions

    buckets.forEach((bucket) => {
      if (
        this.x > bucket.x &&
        this.x < bucket.x + bucket.width &&
        this.y > bucket.y &&
        this.y < bucket.y + bucket.height
      ) {
        if (this.active) {
          score += bucket.score;
          this.active = false;

          // Create bucket score effect
          createParticleEffect(this.x, bucket.y, "bucket");
          showScorePopup(this.x, bucket.y, bucket.score);
        }
      }
    });

    // Check if ball is out of bounds
    if (this.y > canvas.height) {
      this.active = false;
    }
  }

  draw() {
    if (!this.active) return;

    ctx.save();

    // Create simple chrome gradient
    const gradient = ctx.createRadialGradient(
      this.x - this.radius * 0.5, // Light source x
      this.y - this.radius * 0.5, // Light source y
      0,
      this.x,
      this.y,
      this.radius,
    );

    // Simple chrome colors
    gradient.addColorStop(0, "#ffffff"); // Bright highlight
    gradient.addColorStop(0.4, "#f0f0f0"); // Light chrome
    gradient.addColorStop(1, "#404040"); // Dark chrome

    // Draw the chrome ball
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
  }
}

class Particle {
  constructor(x, y, config = {}) {
    this.x = x;
    this.y = y;
    this.color = config.color || "255, 255, 255";
    this.radius = config.radius || Math.random() * 3 + 2;
    this.speed = config.speed || Math.random() * 5 + 2;
    const angle = config.angle || Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.life = 1.0;
    this.decay = config.decay || Math.random() * 0.02 + 0.02;
    this.gravity = config.gravity || 0.1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
    ctx.fill();
    ctx.closePath();
  }
}

let particles = [];

function createParticleEffect(x, y, type) {
  const effects = {
    pin: {
      count: 10,
      config: {
        color: "0, 0, 0",
        radius: 2,
        speed: 5,
        decay: 0.02,
      },
    },
    bluePin: {
      count: 15,
      config: {
        color: "0, 0, 255",
        radius: 3,
        speed: 6,
        decay: 0.015,
      },
    },
    bucket: {
      count: 20,
      config: {
        color: "255, 215, 0", // Gold color
        radius: 4,
        speed: 8,
        decay: 0.01,
        gravity: 0.05,
      },
    },
  };

  const effect = effects[type];
  for (let i = 0; i < effect.count; i++) {
    particles.push(new Particle(x, y, effect.config));
  }
}

function createPin(x, y) {
  const isBlue = Math.random() < CONFIG.blue_pin_chance;
  const isGold = !isBlue && Math.random() < CONFIG.gold_pin_chance;
  return {
    x: x,
    y: y,
    radius: CONFIG.pinRadius,
    active: true,
    isBlue,
    isGold,
  };
}

function placePattern(pattern) {
  const spacing = 40;
  const startX = 75;
  const startY = 150;

  pattern.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell === 1) {
        pins.push(createPin(startX + j * spacing, startY + i * spacing));
      }
    });
  });
}

// Different level layouts
const levelLayouts = {
  1: function () {
    // Triangle pattern
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col <= row; col++) {
        pins.push(
          createPin(canvas.width / 2 - row * 25 + col * 50, 150 + row * 50),
        );
      }
    }
  },
  2: function () {
    // Diamond pattern
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = 40;
    for (let i = -4; i <= 4; i++) {
      for (let j = -4; j <= 4; j++) {
        if (Math.abs(i) + Math.abs(j) <= 4) {
          pins.push(createPin(centerX + i * size, centerY + j * size));
        }
      }
    }
  },
  3: function () {
    // Grid pattern
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 8; j++) {
        pins.push(createPin(100 + i * 50, 150 + j * 50));
      }
    }
  },
  4: function () {
    // Zigzag pattern
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 3; j++) {
        pins.push(createPin(75 + i * 30 + (j % 2) * 15, 150 + j * 100));
      }
    }
  },
  5: function () {
    // Circular pattern
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    for (let ring = 1; ring <= 3; ring++) {
      const radius = ring * 60;
      const pinCount = ring * 8;
      for (let i = 0; i < pinCount; i++) {
        const angle = (i / pinCount) * Math.PI * 2;
        pins.push(
          createPin(
            centerX + Math.cos(angle) * radius,
            centerY + Math.sin(angle) * radius,
          ),
        );
      }
    }
  },
  6: function () {
    placePattern([
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 1, 0, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 0, 1, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
    ]);
  },
  7: function () {
    placePattern([
      [1, 0, 0, 1, 0, 0, 1],
      [0, 1, 0, 1, 0, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 0, 1, 0, 1, 0],
      [1, 0, 0, 1, 0, 0, 1],
    ]);
  },
  8: function () {
    placePattern([
      [1, 0, 1, 1, 1, 0, 1],
      [0, 0, 1, 0, 1, 0, 0],
      [0, 0, 0, 0, 1, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 0, 1],
    ]);
  },
  9: function () {
    placePattern([
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1],
    ]);
  },

  10: function () {
    // Random Clusters
    const clusters = 5;
    for (let c = 0; c < clusters; c++) {
      const centerX = 150 + Math.random() * (canvas.width - 300);
      const centerY = 150 + Math.random() * (canvas.height - 300);
      const clusterSize = 8;

      for (let i = 0; i < clusterSize; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 50;
        pins.push(
          createPin(
            centerX + Math.cos(angle) * radius,
            centerY + Math.sin(angle) * radius,
          ),
        );
      }
    }
  },

  11: function () {
    // Double Diamond
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    // Upper diamond
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        if (Math.abs(i) + Math.abs(j) <= 3) {
          pins.push(createPin(centerX + i * 40, centerY - 100 + j * 40));
        }
      }
    }
    // Lower diamond
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        if (Math.abs(i) + Math.abs(j) <= 3) {
          pins.push(createPin(centerX + i * 40, centerY + 100 + j * 40));
        }
      }
    }
  },

  12: function () {
    // Spiral Pattern
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const spiralRadius = 150;
    const turns = 3;
    const pointsPerTurn = 15;

    for (let i = 0; i < turns * pointsPerTurn; i++) {
      const angle = (i / pointsPerTurn) * Math.PI * 2;
      const radius = (i / (turns * pointsPerTurn)) * spiralRadius;
      pins.push(
        createPin(
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius,
        ),
      );
    }
  },

  13: function () {
    // Star Pattern
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const points = 5;
    const innerRadius = 50;
    const outerRadius = 150;

    // Create star points
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Add pins along lines to center
      const steps = 5;
      for (let j = 0; j < steps; j++) {
        const pinX = centerX + (x - centerX) * (j / steps);
        const pinY = centerY + (y - centerY) * (j / steps);
        pins.push(createPin(pinX, pinY));
      }
    }
  },

  14: function () {
    // Honeycomb Pattern
    const hexRadius = 30;
    const startX = 100;
    const startY = 150;

    for (let row = 0; row < 5; row++) {
      const offsetX = row % 2 === 0 ? 0 : hexRadius * Math.cos(Math.PI / 6);
      for (let col = 0; col < 6; col++) {
        pins.push(
          createPin(
            startX + col * hexRadius * 2 * Math.cos(Math.PI / 6) + offsetX,
            startY + row * hexRadius * 1.5,
          ),
        );
      }
    }
  },

  15: function () {
    // Crosshair Pattern
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const spacing = 30;

    // Vertical line
    for (let y = -5; y <= 5; y++) {
      pins.push(createPin(centerX, centerY + y * spacing));
    }
    // Horizontal line
    for (let x = -5; x <= 5; x++) {
      if (x !== 0) {
        // Avoid double pin in center
        pins.push(createPin(centerX + x * spacing, centerY));
      }
    }
    // Diagonal lines
    for (let d = -3; d <= 3; d++) {
      if (d !== 0) {
        pins.push(createPin(centerX + d * spacing, centerY + d * spacing));
        pins.push(createPin(centerX - d * spacing, centerY + d * spacing));
      }
    }
  },

  16: function () {
    // Circular Rings
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const rings = 4;

    for (let ring = 1; ring <= rings; ring++) {
      const radius = ring * 50;
      const pinCount = ring * 8;
      for (let pin = 0; pin < pinCount; pin++) {
        const angle = (pin / pinCount) * Math.PI * 2;
        pins.push(
          createPin(
            centerX + Math.cos(angle) * radius,
            centerY + Math.sin(angle) * radius,
          ),
        );
      }
    }
  },
};

function checkGameEnd() {
  if (levelOver == true) {
    return;
  }
  // Check for win condition (no active pins)
  const remainingPins = pins.filter((pin) => pin.active).length;
  if (remainingPins === 0) {
    levelOver = true;
    currentLevel++;
    setStatus(
      `Level ${currentLevel - 1} Complete!<br />Moving to Level ${currentLevel}`,
    );
    setTimeout(() => {
      initializeLevel(currentLevel);
    }, 2000);
    return;
  }

  // Check for lose condition (no balls left and no active balls)
  const activeBalls = balls.filter((ball) => ball.active).length;
  if (totalBalls === 0 && activeBalls === 0) {
    gameActive = false;
    levelOver = true;
    setStatus(`Game Over!<br />Final Score: ${score}`);
    gameInfoElement.style.pointerEvents = "all";
    restartButton.style.display = "block";
  }
}

function drawPin(pin) {
  if (!pin.active) return;

  ctx.save();

  // Create radial gradient for the pin
  const gradient = ctx.createRadialGradient(
    pin.x - pin.radius * 0.3, // Light source x
    pin.y - pin.radius * 0.3, // Light source y
    0,
    pin.x,
    pin.y,
    pin.radius,
  );

  if (pin.isBlue) {
    // Blue pin gradient
    gradient.addColorStop(0, "#7EB6FF"); // Light blue
    gradient.addColorStop(0.5, "#4A90E2"); // Medium blue
    gradient.addColorStop(1, "#2171D6"); // Dark blue
  } else if (pin.isGold) {
    // Gold pin gradient
    gradient.addColorStop(0, "#FFD700"); // Light gold
    gradient.addColorStop(0.5, "#FFA500"); // Medium gold
    gradient.addColorStop(1, "#B8860B"); // Dark gold
  } else {
    // Regular pin gradient
    gradient.addColorStop(0, "#FFFFFF"); // Light gray
    gradient.addColorStop(0.5, "#808080"); // Medium gray
    gradient.addColorStop(1, "#404040"); // Dark gray
  }

  ctx.beginPath();
  ctx.arc(pin.x, pin.y, pin.radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.restore();
}
//---------------------
// Game Loop Functions
//---------------------

function drawHUD() {
  ctx.save();
  // Draw level info
  const levelText = `LEVEL ${currentLevel}`;
  ctx.fillStyle = "white";
  ctx.font = '16px "Press Start 2P"';
  ctx.textBaseline = "top";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.strokeText(levelText, 10, 10);
  ctx.fillText(levelText, 10, 10);

  // Draw score with pixel font
  const scoreText = `SCORE: ${score}`;
  ctx.font = '12px "Press Start 2P"';
  ctx.strokeText(scoreText, 10, 30);
  ctx.fillText(scoreText, 10, 30);

  // Draw credits with pixel font
  const creditText = `CREDITS: ${credits}`;
  ctx.font = '12px "Press Start 2P"';
  ctx.strokeText(creditText, 10, 46);
  ctx.fillText(creditText, 10, 46);

  // Draw balls remaining with pixel font
  const remainingText = `BALLS: ${totalBalls}`;
  ctx.font = '12px "Press Start 2P"';
  ctx.strokeText(remainingText, 10, 62);
  ctx.fillText(remainingText, 10, 62);

  ctx.restore();
}

function updateParticles() {
  // Update and draw particles
  particles = particles.filter((particle) => particle.life > 0);
  particles.forEach((particle) => {
    particle.update();
    particle.draw(ctx);
  });
}

function drawPins() {
  // Draw pins with colors
  pins.forEach((pin) => {
    drawPin(pin);
  });
}

function drawBuckets() {
  // Draw buckets
  buckets.forEach((bucket) => {
    const gradient = ctx.createLinearGradient(
      bucket.x,
      bucket.y,
      bucket.x,
      bucket.y + bucket.height,
    );
    gradient.addColorStop(0, "#4169E1");
    gradient.addColorStop(1, "#1E90FF");

    ctx.fillStyle = gradient;
    ctx.fillRect(bucket.x, bucket.y, bucket.width, bucket.height);

    // Score text with shadow
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 2;
    ctx.fillStyle = "white";
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText(bucket.score, bucket.x + 10, bucket.y + 20);
    ctx.restore();
  });
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();

  drawHUD();

  updateParticles();

  drawPins();
  drawBuckets();

  // Update and draw balls
  balls.forEach((ball) => {
    ball.update();
    ball.draw();
  });

  if (gameActive) {
    checkGameEnd();
  }

  requestAnimationFrame(gameLoop);
}

canvas.addEventListener("click", (event) => {
  if (!gameActive) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (y < 150 && totalBalls > 0) {
    balls.push(new Ball(x, y));
    totalBalls--;
  }
});

restartButton.addEventListener("click", () => {
  initializeGame();
});

// Shop and credits system
let credits = 0;
let shopItems = [
  {
    name: "10 Extra Balls",
    cost: 5,
    action: () => {
      totalBalls += 10;
    },
  },
  {
    name: "Big Balls",
    cost: 10,
    action: () => {
      CONFIG.ballRadius += 2;
    },
  },
  {
    name: "Less Gravity",
    cost: 10,
    action: () => {
      CONFIG.gravity *= 0.8;
    },
  },
  {
    name: "More Bounce",
    cost: 15,
    action: () => {
      CONFIG.bounce += 0.1;
    },
  },
];

// Initialize shop buttons
function initShop() {
  const shopDiv = document.createElement("div");
  shopDiv.id = "shopMenu";
  shopDiv.className = "shop-menu";
  shopDiv.style.display = "none";

  shopItems.forEach((item) => {
    const button = document.createElement("button");
    button.className = "shop-item";
    button.textContent = `${item.name} (${item.cost} credits)`;
    button.onclick = () => {
      if (credits >= item.cost) {
        credits -= item.cost;
        item.action();
        setStatus(`Purchased ${item.name}!`);
      } else {
        setStatus("Not enough credits!");
      }
    };
    shopDiv.appendChild(button);
  });

  document.getElementById("gameMenu").appendChild(shopDiv);

  // Add shop button
  const shopButton = document.getElementById("shopButton");
  shopButton.onclick = () => toggleShop();
}

function toggleShop() {
  const shopMenu = document.getElementById("shopMenu");
  shopMenu.style.display = shopMenu.style.display === "none" ? "grid" : "none";
}

// Initialize shop when page loads
document.addEventListener("DOMContentLoaded", initShop);

initializeGame();
gameLoop();
