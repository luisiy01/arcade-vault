export interface TetrisOptions {
  onGameOver?: (score: number) => void;
}

export function startTetris(canvas: HTMLCanvasElement, options?: TetrisOptions): () => void {
  const ctx = canvas.getContext('2d')!;

  const COLS = 10;
  const ROWS = 20;
  const BLOCK = 24;

  const COLORS = [
    null,
    '#4dd0e1', // I - cyan
    '#ffd54f', // O - yellow
    '#ba68c8', // T - purple
    '#81c784', // S - green
    '#e57373', // Z - red
    '#90caf9', // J - pale blue
    '#ffb74d', // L - orange
    '#9e9e9e', // N - tuerca (gris metálico)
  ];

  const PIECES: (number[][] | null)[] = [
    null,
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ], // I
    [
      [2, 2],
      [2, 2],
    ], // O
    [
      [0, 3, 0],
      [3, 3, 3],
      [0, 0, 0],
    ], // T
    [
      [0, 4, 4],
      [4, 4, 0],
      [0, 0, 0],
    ], // S
    [
      [5, 5, 0],
      [0, 5, 5],
      [0, 0, 0],
    ], // Z
    [
      [6, 0, 0],
      [6, 6, 6],
      [0, 0, 0],
    ], // J
    [
      [0, 0, 7],
      [7, 7, 7],
      [0, 0, 0],
    ], // L
    [
      [8, 8, 8],
      [8, 0, 8],
      [8, 8, 8],
    ], // N (tuerca)
  ];

  const LINE_SCORES = [0, 100, 300, 500, 800];

  interface TetrisPiece {
    type: number;
    shape: number[][];
    x: number;
    y: number;
  }

  let board: number[][];
  let current: TetrisPiece;
  let next: TetrisPiece;
  let score: number;
  let lines: number;
  let level: number;
  let paused: boolean;
  let gameOver: boolean;
  let dropAccum: number;
  let dropInterval: number;
  let lastTime: number;
  let rafId: number;
  let stopped = false;

  function createBoard(): number[][] {
    return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  }

  function randomPiece(): TetrisPiece {
    const type = Math.floor(Math.random() * 8) + 1;
    const shape = PIECES[type]!.map((row) => [...row]);
    return {
      type,
      shape,
      x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    };
  }

  function collide(shape: number[][], ox: number, oy: number): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = ox + c;
        const ny = oy + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }

  function rotateCW(shape: number[][]): number[][] {
    const rows = shape.length;
    const cols = shape[0].length;
    const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
    return result;
  }

  function tryRotate(): void {
    const rotated = rotateCW(current.shape);
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!collide(rotated, current.x + kick, current.y)) {
        current.shape = rotated;
        current.x += kick;
        return;
      }
    }
  }

  function merge(): void {
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c]) board[current.y + r][current.x + c] = current.shape[r][c];
  }

  function clearLines(): void {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((v) => v !== 0)) {
        board.splice(r, 1);
        board.unshift(new Array(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      lines += cleared;
      score += (LINE_SCORES[cleared] || 0) * level;
      level = Math.floor(lines / 10) + 1;
      dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    }
  }

  function ghostY(): number {
    let gy = current.y;
    while (!collide(current.shape, current.x, gy + 1)) gy++;
    return gy;
  }

  function hardDrop(): void {
    const gy = ghostY();
    score += (gy - current.y) * 2;
    current.y = gy;
    lockPiece();
  }

  function softDrop(): void {
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
      score += 1;
    } else {
      lockPiece();
    }
  }

  function lockPiece(): void {
    merge();
    clearLines();
    spawn();
  }

  function spawn(): void {
    current = next;
    next = randomPiece();
    if (collide(current.shape, current.x, current.y)) {
      endGame();
    }
  }

  function endGame(): void {
    gameOver = true;
    cancelAnimationFrame(rafId);
    options?.onGameOver?.(score);
  }

  function togglePause(): void {
    if (gameOver) return;
    paused = !paused;
    if (!paused) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(rafId);
    }
  }

  // ── Drawing ─────────────────────────────────────────────────────────────────

  function drawBlock(x: number, y: number, colorIndex: number, alpha?: number): void {
    if (!colorIndex) return;
    const color = COLORS[colorIndex]!;
    ctx.globalAlpha = alpha ?? 1;
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, 4);
    ctx.globalAlpha = 1;
  }

  function drawBlockAt(px: number, py: number, size: number, colorIndex: number): void {
    if (!colorIndex) return;
    ctx.fillStyle = COLORS[colorIndex]!;
    ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(px + 1, py + 1, size - 2, 3);
  }

  function drawGrid(): void {
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK, 0);
      ctx.lineTo(c * BLOCK, ROWS * BLOCK);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK);
      ctx.lineTo(COLS * BLOCK, r * BLOCK);
      ctx.stroke();
    }
  }

  function drawBoard(): void {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) drawBlock(c, r, board[r][c]);
  }

  function drawGhost(): void {
    const gy = ghostY();
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c]) drawBlock(current.x + c, gy + r, current.shape[r][c], 0.2);
  }

  function drawCurrentPiece(): void {
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        drawBlock(current.x + c, current.y + r, current.shape[r][c]);
  }

  function drawNextPreview(): void {
    const previewSize = 16;
    const padding = 6;
    const boxW = previewSize * 4 + padding * 2;
    const boxH = previewSize * 4 + padding * 2;
    const bx = COLS * BLOCK - boxW - 4;
    const by = 4;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, boxW, boxH);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('NEXT', bx + 4, by + 10);

    const shape = next.shape;
    const offX = Math.floor((4 - shape[0].length) / 2);
    const offY = Math.floor((4 - shape.length) / 2);
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c])
          drawBlockAt(
            bx + padding + (offX + c) * previewSize,
            by + padding + (offY + r) * previewSize,
            previewSize,
            shape[r][c],
          );
  }

  function drawHUD(): void {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 110, 52);

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${score.toLocaleString()}`, 6, 14);
    ctx.fillText(`LINES ${lines}`, 6, 30);
    ctx.fillText(`LEVEL ${level}`, 6, 46);
  }

  function drawPauseOverlay(): void {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSA', (COLS * BLOCK) / 2, (ROWS * BLOCK) / 2);
    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('P PARA CONTINUAR', (COLS * BLOCK) / 2, (ROWS * BLOCK) / 2 + 30);
  }

  function drawGameOverOverlay(): void {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', (COLS * BLOCK) / 2, (ROWS * BLOCK) / 2 - 10);
    ctx.font = '16px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`PUNTAJE: ${score.toLocaleString()}`, (COLS * BLOCK) / 2, (ROWS * BLOCK) / 2 + 24);
  }

  function draw(): void {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawBoard();

    if (!gameOver) {
      drawGhost();
      drawCurrentPiece();
    }

    drawHUD();
    drawNextPreview();

    if (paused) drawPauseOverlay();
    if (gameOver) drawGameOverOverlay();
  }

  // ── Game loop ───────────────────────────────────────────────────────────────

  function loop(ts: number): void {
    if (stopped) return;
    const dt = ts - lastTime;
    lastTime = ts;

    if (!paused && !gameOver) {
      dropAccum += dt;
      if (dropAccum >= dropInterval) {
        dropAccum = 0;
        if (!collide(current.shape, current.x, current.y + 1)) {
          current.y++;
        } else {
          lockPiece();
        }
      }
    }

    if (gameOver) return;

    draw();
    rafId = requestAnimationFrame(loop);
  }

  // ── Input ───────────────────────────────────────────────────────────────────

  function onKeyDown(e: KeyboardEvent): void {
    if (e.code === 'KeyP') {
      togglePause();
      if (paused) draw();
      return;
    }
    if (paused || gameOver) return;

    switch (e.code) {
      case 'ArrowLeft':
        e.preventDefault();
        if (!collide(current.shape, current.x - 1, current.y)) current.x--;
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (!collide(current.shape, current.x + 1, current.y)) current.x++;
        break;
      case 'ArrowDown':
        e.preventDefault();
        softDrop();
        break;
      case 'ArrowUp':
        e.preventDefault();
        tryRotate();
        break;
      case 'Space':
        e.preventDefault();
        hardDrop();
        break;
    }
  }

  window.addEventListener('keydown', onKeyDown);

  // ── Init ────────────────────────────────────────────────────────────────────

  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  paused = false;
  gameOver = false;
  dropInterval = 1000;
  dropAccum = 0;
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  draw();
  rafId = requestAnimationFrame(loop);

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  return () => {
    stopped = true;
    cancelAnimationFrame(rafId);
    window.removeEventListener('keydown', onKeyDown);
  };
}
