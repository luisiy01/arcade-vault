export interface SnakeOptions {
  onGameOver?: (score: number) => void;
}

export function startSnake(canvas: HTMLCanvasElement, options?: SnakeOptions): () => void {
  const ctx = canvas.getContext('2d')!;
  const W = 800;
  const H = 600;

  // ── Constants ───────────────────────────────────────────────────────────────
  const COLS = 40;
  const ROWS = 30;
  const CELL = 20;
  const BASE_SPEED = 8;
  const SPEED_INCREMENT = 0.5;
  const POINTS_PER_FRUIT = 10;

  // ── Fruit sprite atlas ──────────────────────────────────────────────────────
  interface FruitSprite {
    x: number;
    y: number;
    w: number;
    h: number;
  }

  const FRUITS: Record<string, FruitSprite> = {
    banana: { x: 34, y: 136, w: 110, h: 160 },
    orange: { x: 186, y: 136, w: 150, h: 160 },
    grape: { x: 378, y: 136, w: 110, h: 160 },
    garlic: { x: 540, y: 136, w: 130, h: 160 },
    eggplant: { x: 712, y: 136, w: 130, h: 160 },
    strawberry: { x: 894, y: 136, w: 110, h: 160 },
    cherry: { x: 1066, y: 136, w: 110, h: 160 },
    carrot: { x: 1228, y: 136, w: 130, h: 160 },
    mushroom: { x: 1400, y: 136, w: 130, h: 160 },
    broccoli: { x: 1582, y: 136, w: 110, h: 160 },
    watermelon: { x: 1734, y: 136, w: 150, h: 160 },
    pepper: { x: 1906, y: 136, w: 150, h: 160 },
    kiwi: { x: 2068, y: 136, w: 170, h: 160 },
    lemon: { x: 2250, y: 136, w: 140, h: 160 },
    peach: { x: 2432, y: 136, w: 130, h: 160 },
    peanut: { x: 2604, y: 136, w: 130, h: 160 },
    apple: { x: 2786, y: 136, w: 110, h: 160 },
    tomato: { x: 2948, y: 136, w: 130, h: 160 },
    berries: { x: 3110, y: 136, w: 150, h: 160 },
    grapes2: { x: 3302, y: 136, w: 110, h: 160 },
    pineapple: { x: 3454, y: 136, w: 150, h: 160 },
    melon: { x: 3637, y: 136, w: 130, h: 160 },
  };

  const FRUIT_KEYS = Object.keys(FRUITS);

  // ── Spritesheet loading ─────────────────────────────────────────────────────
  let fruitImg: HTMLImageElement | null = null;
  let fruitImgLoaded = false;

  const img = new Image();
  img.onload = () => {
    fruitImg = img;
    fruitImgLoaded = true;
  };
  img.onerror = () => {
    console.error('Failed to load fruits spritesheet');
  };
  img.src = '/games/snake/fruits.png';

  // ── Types ───────────────────────────────────────────────────────────────────
  interface Point {
    x: number;
    y: number;
  }

  type Direction = 'up' | 'down' | 'left' | 'right';

  // ── Game state ──────────────────────────────────────────────────────────────
  let snake: Point[] = [];
  let direction: Direction = 'right';
  let nextDirection: Direction = 'right';
  let fruit: Point = { x: 0, y: 0 };
  let currentFruitKey = FRUIT_KEYS[0];
  let score = 0;
  let fruitsEaten = 0;
  let speed = BASE_SPEED;
  let gameState: 'playing' | 'paused' | 'gameover' = 'playing';
  let moveAccumulator = 0;
  let gameOverFired = false;

  function initGame() {
    const centerX = Math.floor(COLS / 2);
    const centerY = Math.floor(ROWS / 2);
    snake = [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY },
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    fruitsEaten = 0;
    speed = BASE_SPEED;
    gameState = 'playing';
    moveAccumulator = 0;
    gameOverFired = false;
    spawnFruit();
  }

  function spawnFruit() {
    const occupied = new Set(snake.map((s) => s.x + ',' + s.y));

    if (occupied.size >= COLS * ROWS) {
      gameState = 'gameover';
      fireGameOver();
      return;
    }

    let fx: number, fy: number;
    do {
      fx = Math.floor(Math.random() * COLS);
      fy = Math.floor(Math.random() * ROWS);
    } while (occupied.has(fx + ',' + fy));

    fruit = { x: fx, y: fy };
    currentFruitKey = FRUIT_KEYS[Math.floor(Math.random() * FRUIT_KEYS.length)];
  }

  function fireGameOver() {
    if (gameOverFired) return;
    gameOverFired = true;
    options?.onGameOver?.(score);
  }

  // ── Opposite direction check ────────────────────────────────────────────────
  const OPPOSITE: Record<Direction, Direction> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
  };

  // ── Input ───────────────────────────────────────────────────────────────────
  function onKeyDown(e: KeyboardEvent) {
    let newDir: Direction | null = null;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        newDir = 'up';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        newDir = 'down';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        newDir = 'left';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        newDir = 'right';
        break;
      case 'p':
      case 'P':
      case 'Escape':
        if (gameState === 'playing') {
          gameState = 'paused';
        } else if (gameState === 'paused') {
          gameState = 'playing';
        }
        e.preventDefault();
        return;
    }

    if (newDir) {
      e.preventDefault();
      if (newDir !== OPPOSITE[direction]) {
        nextDirection = newDir;
      }
    }
  }

  window.addEventListener('keydown', onKeyDown);

  // ── Update ──────────────────────────────────────────────────────────────────
  function update(dt: number) {
    if (gameState !== 'playing') return;

    moveAccumulator += dt * 1000;
    const interval = 1000 / speed;

    while (moveAccumulator >= interval) {
      moveAccumulator -= interval;
      moveSnake();
      if (gameState !== 'playing') break;
    }
  }

  function moveSnake() {
    direction = nextDirection;

    const head = snake[0];
    let nx = head.x;
    let ny = head.y;

    switch (direction) {
      case 'up':
        ny--;
        break;
      case 'down':
        ny++;
        break;
      case 'left':
        nx--;
        break;
      case 'right':
        nx++;
        break;
    }

    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
      gameState = 'gameover';
      fireGameOver();
      return;
    }

    for (let i = 0; i < snake.length - 1; i++) {
      if (snake[i].x === nx && snake[i].y === ny) {
        gameState = 'gameover';
        fireGameOver();
        return;
      }
    }

    const newHead: Point = { x: nx, y: ny };
    snake.unshift(newHead);

    if (nx === fruit.x && ny === fruit.y) {
      score += POINTS_PER_FRUIT;
      fruitsEaten++;
      speed = BASE_SPEED + Math.floor(fruitsEaten / 5) * SPEED_INCREMENT;
      spawnFruit();
    } else {
      snake.pop();
    }
  }

  // ── Drawing ─────────────────────────────────────────────────────────────────
  function drawBackground() {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        ctx.fillStyle = (col + row) % 2 === 0 ? '#1a3a1a' : '#1e441e';
        ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
      }
    }
  }

  function drawSnake() {
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      const isHead = i === 0;
      const px = seg.x * CELL;
      const py = seg.y * CELL;
      const radius = isHead ? 4 : 3;

      ctx.fillStyle = isHead ? '#7fff00' : '#3cb043';
      ctx.beginPath();
      ctx.roundRect(px + 1, py + 1, CELL - 2, CELL - 2, radius);
      ctx.fill();

      if (isHead) {
        ctx.fillStyle = '#1a3a1a';
        const eyeSize = 3;
        let ex1 = 0,
          ey1 = 0,
          ex2 = 0,
          ey2 = 0;
        switch (direction) {
          case 'right':
            ex1 = px + 14;
            ey1 = py + 5;
            ex2 = px + 14;
            ey2 = py + 12;
            break;
          case 'left':
            ex1 = px + 4;
            ey1 = py + 5;
            ex2 = px + 4;
            ey2 = py + 12;
            break;
          case 'up':
            ex1 = px + 5;
            ey1 = py + 4;
            ex2 = px + 12;
            ey2 = py + 4;
            break;
          case 'down':
            ex1 = px + 5;
            ey1 = py + 14;
            ex2 = px + 12;
            ey2 = py + 14;
            break;
        }
        ctx.beginPath();
        ctx.arc(ex1, ey1, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex2, ey2, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawFruit() {
    const sprite = FRUITS[currentFruitKey];
    const px = fruit.x * CELL;
    const py = fruit.y * CELL;

    if (fruitImgLoaded && fruitImg) {
      ctx.drawImage(fruitImg, sprite.x, sprite.y, sprite.w, sprite.h, px, py, CELL, CELL);
    } else {
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(px + 2, py + 2, CELL - 4, CELL - 4);
    }
  }

  function drawHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Score: ' + score, 10, 10);
  }

  function drawOverlay(title: string, subtitle?: string) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, W / 2, H / 2 - 30);

    if (subtitle) {
      ctx.font = 'bold 28px monospace';
      ctx.fillText(subtitle, W / 2, H / 2 + 30);
    }
  }

  function draw() {
    drawBackground();
    drawSnake();
    drawFruit();
    drawHUD();

    if (gameState === 'gameover') {
      drawOverlay('GAME OVER', 'Score: ' + score);
    }
    if (gameState === 'paused') {
      drawOverlay('PAUSA');
    }
  }

  // ── Game loop ───────────────────────────────────────────────────────────────
  let lastTime: number | null = null;
  let rafId = 0;
  let stopped = false;

  function loop(timestamp: number) {
    if (stopped) return;
    if (lastTime === null) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(dt);
    draw();

    rafId = requestAnimationFrame(loop);
  }

  // ── Start ───────────────────────────────────────────────────────────────────
  initGame();
  rafId = requestAnimationFrame(loop);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  return () => {
    stopped = true;
    cancelAnimationFrame(rafId);
    window.removeEventListener('keydown', onKeyDown);
  };
}
