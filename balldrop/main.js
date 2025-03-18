//----------------------
// consts
//----------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameStatusElement = document.getElementById("gameStatus");
const gameInfoElement = document.getElementById("gameInfo");

const CONFIG = {
  blue_pin_chance: 0.2,
  gold_pin_chance: 0.2,
  ballRadius: 10,
  pinRadius: 5,
  gravity: 0.2,
  bounce: 0.6,
  totalBalls: 15,
};

//----------------------
// game variables
//----------------------
let balls = [];
let pins = [];
const buckets = [];
let levelOver = false;

let score = 0;
let gameActive = true;
let currentLevel = 1;

let isPaused = false;
let showShop = false;

let particles = [];

let totalBalls = CONFIG.totalBalls;
let ballRadius = CONFIG.ballRadius;
let gravity = CONFIG.gravity;
let bounce = CONFIG.bounce;

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
      ballRadius += 2;
    },
  },
  {
    name: "Less Gravity",
    cost: 10,
    action: () => {
      gravity *= 0.8;
    },
  },
  {
    name: "More Bounce",
    cost: 15,
    action: () => {
      bounce += 0.1;
    },
  },
];

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
  generateLevel(level);

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
  credits = 0;
  currentLevel = 1;
  totalBalls = CONFIG.totalBalls;
  ballRadius = CONFIG.ballRadius;
  gravity = CONFIG.gravity;
  bounce = CONFIG.bounce;

  ui.restartButton.visible = false;
  showWelcomePopup();
  initializeLevel(currentLevel);
}

//----------------------
// UI
//----------------------
function setStatus(messages, timeout = 3000) {
  messages.forEach((message, i) => {
    ui.children.push(new MessageIndicator(message, i * 20, timeout));
  });
}

function showScorePopup(x, y, score) {
  ui.children.push(new ScorePopupIndicator(x, y, score));
}
function showCreditPopup(x, y, credits) {
  ui.children.push(new CreditPopupIndicator(x, y, credits));
}
function showBallPopup(x, y, balls) {
  ui.children.push(new BallPopupIndicator(x, y, balls));
}
function showHighScorePopup(score) {
  ui.children.push(new HighScorePupupIndicator(score));
}
function showWelcomePopup() {
  ui.children.push(new WelcomePopupIndicator());
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
    this.radius = ballRadius;
    this.active = true;
  }

  update() {
    if (!this.active) return;

    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;

    // Wall collisions
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx *= -bounce;
    }
    if (this.x > canvas.width - this.radius) {
      this.x = canvas.width - this.radius;
      this.vx *= -bounce;
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

        this.vx = Math.cos(angle) * speed * bounce;
        this.vy = Math.sin(angle) * speed * bounce;

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

          showBallPopup(pin.x, pin.y, 3);
        }

        // Add credits for gold pins
        if (pin.isGold) {
          credits += 1;
          showCreditPopup(pin.x, pin.y, 1);
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
  if (x < 0.02) x = 0.02;
  if (x > 0.98) x = 0.98;
  if (y < 0.02) y = 0.02;
  if (y > 0.98) y = 0.98;
  x = x * canvas.width;
  y = y * canvas.width + 150;
  const isBlue = Math.random() < CONFIG.blue_pin_chance;
  const isGold = !isBlue && Math.random() < CONFIG.gold_pin_chance;
  return {
    x,
    y,
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
const levelLayouts = [
  function () {
    // Diamond pattern
    const centerX = 0.5;
    const centerY = 0.5;
    const size = 0.125;
    for (let i = -4; i <= 4; i++) {
      for (let j = -4; j <= 4; j++) {
        if (Math.abs(i) + Math.abs(j) <= 4) {
          pins.push(createPin(centerX + i * size, centerY + j * size));
        }
      }
    }
  },
  function () {
    // Grid pattern
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 8; j++) {
        pins.push(createPin(i / 5, j / 7));
      }
    }
  },
  function () {
    // Zigzag pattern
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 3; j++) {
        pins.push(createPin(0.1 + i * 0.08 + (j % 2) * 0.15, 0.15 + j / 3));
      }
    }
  },
  function () {
    // Circular pattern
    const centerX = 0.5;
    const centerY = 0.5;
    for (let ring = 1; ring <= 3; ring++) {
      const radius = ring * 0.15;
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

  function () {
    // Random Clusters
    const clusters = 5;
    for (let c = 0; c < clusters; c++) {
      const centerX = Math.random() * 0.5 + 0.25;
      const centerY = Math.random() * 0.5 + 0.25;
      const clusterSize = 8;

      for (let i = 0; i < clusterSize; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.15 + 0.15;
        pins.push(
          createPin(
            centerX + Math.cos(angle) * radius,
            centerY + Math.sin(angle) * radius,
          ),
        );
      }
    }
  },

  function () {
    // Double Diamond
    const centerX = 0.5;
    const centerY = 0.5;
    // Upper diamond
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        if (Math.abs(i) + Math.abs(j) <= 3) {
          pins.push(createPin(centerX + i * 0.1, centerY - 0.12 + j * 0.1));
        }
      }
    }
    // Lower diamond
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        if (Math.abs(i) + Math.abs(j) <= 3) {
          pins.push(createPin(centerX + i * 0.1, centerY + 0.13 + j * 0.1));
        }
      }
    }
  },

  function () {
    // Spiral Pattern
    const centerX = 0.5;
    const centerY = 0.5;
    const spiralRadius = 0.4;
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

  function () {
    // Star Pattern
    const centerX = 0.5;
    const centerY = 0.5;
    const points = 5;
    const innerRadius = 0.1;
    const outerRadius = 0.45;

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

  function () {
    // Honeycomb Pattern
    const hexRadius = 0.09;
    const startX = 0.1;
    const startY = 0.15;

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

  function () {
    // Crosshair Pattern
    const centerX = 0.5;
    const centerY = 0.5;
    const spacing = 0.1;

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

  function () {
    // Radial Grid Pattern
    const centerX = 0.5;
    const centerY = 0.5;
    const rings = 4;

    for (let ring = 0; ring < rings; ring++) {
      const radius = 0.05 + ring * 0.07;
      const squareSize = 6;
      const halfSize = squareSize / 2;

      for (let i = -halfSize; i <= halfSize; i++) {
        for (let j = -halfSize; j <= halfSize; j++) {
          if (Math.abs(i) + Math.abs(j) === halfSize) {
            pins.push(createPin(centerX + i * radius, centerY + j * radius));
          }
        }
      }
    }
  },

  function () {
    // Checkerboard Pattern
    const gridSize = 10;
    const spacing = 1 / (gridSize * 2);

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if ((row + col) % 2 === 0) {
          pins.push(createPin(0.3 + col * spacing, 0.1 + row * spacing));
        }
      }
    }
  },

  function () {
    // Curl Pattern
    const centerX = 0.5;
    const centerY = 0.5;
    const curls = 2;

    for (let c = 0; c < curls; c++) {
      const radius = 0.2 + c * 0.1;
      const amplitude = 15;
      const wavelength = (Math.PI * 2) / (radius / 4);

      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        const x = centerX + radius * Math.cos(angle);
        const y =
          centerY +
          radius * Math.sin(angle) +
          Math.sin(angle * wavelength) * amplitude;
        pins.push(createPin(x, y));
      }
    }
  },
  function () {
    const numPoints = 40; // Varies between 36-48
    const frequencyRatio = 2.5;

    for (let t = 0; t < numPoints; t++) {
      const theta = (Math.PI * 2 * t) / numPoints;
      const x = Math.sin(theta);
      const y = Math.sin(theta * frequencyRatio);

      // Scale and normalize to [0,1]
      const scaledX = (x + 1) / 2;
      const scaledY = (y + 1) / 2;

      pins.push(createPin(scaledX, scaledY));
    }
  },
];

function checkGameEnd() {
  if (levelOver == true) {
    return;
  }
  // Check for win condition (no active pins)
  const remainingPins = pins.filter((pin) => pin.active).length;
  if (remainingPins === 0) {
    levelOver = true;
    currentLevel++;
    setStatus([`${currentLevel - 1} Complete!`, `Moving to ${currentLevel}`]);
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
    setStatus([`Game Over!`, `Final Score: ${score}`]);
    ui.restartButton.visible = true;
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
// Level Generation
//---------------------

function generateLevel(level) {
  const l = level % levelLayouts.length;
  levelLayouts[l]();
}

//---------------------
// UI
//---------------------

class UIComponent {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.visible = true;
    this.children = [];
    this.width = 0;
    this.height = 0;
  }

  add(child) {
    this.children.push(child);
  }
  remove(child) {
    let i = this.children.findIndex((a) => a == child);
    if (i >= 0) {
      this.children.splice(i, 1);
    }
  }

  update() {
    if (!this.visible) return;

    // Update children
    this.children.forEach((child) => {
      child.update();
    });
  }

  draw(ctx) {
    if (!this.visible) return;

    // Draw children first
    this.children.forEach((child) => child.draw(ctx));

    // Default implementation (override in subclasses)
  }

  handleClick(x, y) {
    if (!this.visible) return;
    // Handle click events for the component and its children
    if (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    )
      this.onClick();

    // Recurse to child components
    this.children.forEach((child) => {
      child.handleClick(x, y);
    });
  }

  onClick() {
    // Override in subclasses
  }
}

// Create a class for the HUD container
class HUDContainer extends UIComponent {
  constructor() {
    super(0, 0);

    this.width = canvas.width;
    this.height = canvas.height;

    this.restartButton = new Button(
      { x: 10, y: canvas.height / 2 + 50 },
      "RESTART",
      () => {
        initializeGame();
      },
    );
    this.restartButton.width = canvas.width - 20;
    this.restartButton.visible = false;

    this.add(
      new Indicator("HIGH SC:", 10, 10, (i) => {
        const storedHighScore = localStorage.getItem("ballDropHighScore") || 0;
        i.text = `HIGH SC: ${storedHighScore}`;
      }),
    );

    this.add(
      new Indicator("SCORE  :", 10, 30, (i) => {
        i.text = `SCORE  : ${score}`;
      }),
    );
    this.add(
      new Indicator("LEVEL  : 0", 10, 50, (i) => {
        i.text = `LEVEL  : ${currentLevel}`;
      }),
    );
    this.add(
      new Indicator("CREDITS:", 10, 70, (i) => {
        i.text = `CREDITS: ${credits}`;
      }),
    );
    this.add(
      new Indicator(
        "BALLS  : 0",
        10,
        90,
        (i) => (i.text = `BALLS  : ${totalBalls}`),
      ),
    );
    this.add(new ShopMenu());
    this.add(new TitleIndicator());
    this.add(this.restartButton);

    this.add(
      new Button({ x: canvas.width - 100, y: 16 }, "PAUSE", () => {
        isPaused = !isPaused;
        showShop = true;
      }),
    );
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

// Create specific UI components for HUD elements
class Indicator extends UIComponent {
  constructor(text, x, y, update = () => {}) {
    super(x, y);

    this.text = text;
    this.textColor = "white";
    this.strokeColor = "#404040";
    this.font = '12px "Press Start 2P"';
    this._onUpdate = update;
  }

  draw(ctx) {
    if (!this.visible || !gameActive) return;

    ctx.fillStyle = this.textColor;
    ctx.font = this.font;
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = 4;
    ctx.strokeText(this.text, this.x + 10, this.y + 20);
    ctx.fillText(this.text, this.x + 10, this.y + 20);
  }

  update() {
    super.update();
    this._onUpdate(this);
  }
}

class MessageIndicator extends Indicator {
  constructor(message, y = 0, timeout = 1200) {
    super(message, canvas.width / 2 - 120, canvas.height / 2.2 + y);
    this.font = '16px "Press Start 2P"';
    const item = this;
    setTimeout(() => ui.remove(item), timeout);
  }

  update() {
    super.update();
    this.y -= 0.5;
  }
}

class ScorePopupIndicator extends Indicator {
  constructor(x, y, score) {
    super(`+${score}`, x - 2, y);
    const item = this;
    setTimeout(() => ui.remove(item), 1000);
  }
  update() {
    super.update();
    this.y -= 1;
  }
}

class CreditPopupIndicator extends Indicator {
  constructor(x, y, credits) {
    super(`+${credits} CREDIT` + (credits > 1 ? "S" : ""), x - 5, y + 1);
    const item = this;
    item.textColor = "orange";
    setTimeout(() => ui.remove(item), 1000);
  }
}

class BallPopupIndicator extends Indicator {
  constructor(x, y, balls) {
    super(`+${balls} BALL` + (balls > 1 ? "S" : ""), x - 2, y + 1);
    const item = this;
    item.textColor = "#4A90E2";
    setTimeout(() => ui.remove(item), 1000);
  }
}
class HighScorePupupIndicator extends Indicator {
  constructor(score) {
    const halfW = (canvas.clientWidth - 100) / 2;
    const x = halfW - halfW + Math.random() * halfW;
    super("New High Score!", x, (canvas.clientHeight / 3) * 2);
    const item = this;
    this.font = '16px "Press Start 2P"';
    setTimeout(() => ui.remove(item), 2000);
  }
  update() {
    super.update();
    this.y -= 1.5;
  }
}

class WelcomePopupIndicator extends Indicator {
  constructor() {
    super("Tap Along Here To Play", 10, 100);
    const item = this;
    this.font = '16px "Press Start 2P"';
    this.textColor = "orange";
    setTimeout(() => ui.remove(item), 6000);
  }
}

class TitleIndicator extends Indicator {
  constructor(message) {
    super("BallDrop", 5, canvas.height / 2);
    this.font = '48px "Press Start 2P"';
    const item = this;
    setTimeout(() => ui.remove(item), 3000);
  }

  update() {
    super.update();
    this.y -= 0.15;
  }
}

// Create a Button class for interactive UI elements
class Button extends UIComponent {
  constructor(position, label, onClick) {
    super(position.x, position.y);

    this.label = label;
    this._onClick = onClick;
    this.backgroundColor = "#ff4d4d";
    this.textColor = "white";
    this.clickColor = "#cc0000";
    this.font = '12px "Press Start 2P"';
    this.clicked = false;

    // Set initial dimensions
    const textWidth = ctx.measureText(label).width * 2 + 16;
    super.width = textWidth;
    super.height = 30;
  }

  draw(ctx) {
    if (!this.visible) return;

    const yOffset = this.clicked ? 3 : 0;

    ctx.fillStyle = this.clicked ? this.clickColor : this.backgroundColor;
    ctx.fillRect(this.x, this.y + yOffset, this.width, this.height);

    ctx.fillStyle = this.textColor;
    ctx.font = this.font;

    // Add text with shadow for better visibility
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 2;
    ctx.fillText(this.label, this.x + 10, this.y + 20 + yOffset);
  }

  onClick() {
    const btn = this;
    if (btn._onClick) {
      btn.clicked = true;
      setTimeout(() => (btn.clicked = false), 200);
      btn._onClick();
    }
  }
}

function unpause() {
  isPaused = false;
  showShop = false;
}

class ShopMenu extends UIComponent {
  constructor() {
    super((canvas.width - 300) / 2, 150);

    const itemsPerRow = 1;
    shopItems.forEach((item, index) => {
      // Calculate position based on grid layout
      const col = index % itemsPerRow;
      const row = Math.floor(index / itemsPerRow);
      const x = this.x + col * (300 / itemsPerRow) + 10;
      const y = this.y + row * 40 + 10;
      const btn = new Button(
        { x, y },
        `${item.name} (${item.cost})`,
        this.purchase(item),
      );
      btn.width = 280;
      this.children.push(btn);
    });
  }

  purchase(item) {
    return () => {
      if (credits < item.cost) {
        setStatus(["Not Enough", " Credits"]);
      } else {
        credits -= item.cost;
        setStatus([`${item.name}`, "purchased"]);
        item.action();
      }
    };
  }

  draw(ctx) {
    this.visible = isPaused && showShop;
    if (!this.visible) return;

    ctx.save();

    // Draw shop window background
    const gradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x + 300,
      this.y,
    );

    gradient.addColorStop(0, "#222222");
    gradient.addColorStop(1, "#666666");

    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, 300, 250);

    // Draw shop items
    const itemsPerRow = 1;
    const startY = this.y + 20;

    ctx.restore();
    super.draw(ctx);
  }
}

// Create click handlers for the canvas

function checkUIClick(x, y) {
  let wasPaused = isPaused;
  ui.handleClick(x, y);
  // If no UI component handled the click, propagate to game logic
  if (!gameActive || isPaused || wasPaused) return;

  if (y < 150 && totalBalls > 0) {
    balls.push(new Ball(x, y));
    totalBalls--;
  }
}

//---------------------
// High Score Functions
//---------------------
function checkHighScore() {
  const storedHighScore = localStorage.getItem("ballDropHighScore");
  let currentHighScore = parseInt(storedHighScore) || 0;

  if (score > currentHighScore) {
    currentHighScore = score;
    localStorage.setItem("ballDropHighScore", currentHighScore);

    // Show popup for new high score
    showHighScorePopup(currentHighScore);
  }
}

//---------------------
// Game Loop Functions
//---------------------

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

// Initialize the UI system
const ui = new HUDContainer();

// Modify gameLoop to use the new UI system
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();

  // Draw HUD and update UI components
  if (gameActive) {
    ui.update();
  }

  // Only render active UI elements
  ui.draw(ctx);

  // Update and draw balls
  if (gameActive && !isPaused) {
    updateParticles();

    drawPins();
    drawBuckets();

    balls.forEach((ball) => {
      ball.update();
      ball.draw();
    });

    checkGameEnd();
    checkHighScore();
  }

  requestAnimationFrame(gameLoop);
}

initializeGame();
gameLoop();

canvas.addEventListener("click", (event) => {
  // Get click position relative to canvas
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  checkUIClick(x, y);
});
