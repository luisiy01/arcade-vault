import type { SkinId, GamePalette } from '@/lib/games/skins';
import { getGamePalette } from '@/lib/games/skins';

export interface FroggerOptions {
  onGameOver?: (score: number) => void;
  palette?: GamePalette;
  skinId?: SkinId;
}

export function startFrogger(canvas: HTMLCanvasElement, options?: FroggerOptions): () => void {
  const ctx = canvas.getContext('2d')!;
  const p: GamePalette =
    options?.palette ?? getGamePalette(options?.skinId ?? 'clasico', 'frogger');

  // ── Constants ───────────────────────────────────────────────────────────────
  const COLS = 16;
  const ROWS = 14;
  const CELL = 40;
  const W = COLS * CELL; // 640
  const H = ROWS * CELL; // 560

  const ROW_GOALS = 0;
  const ROW_RIVER_TOP = 1;
  const ROW_RIVER_BOT = 6;
  const ROW_SAFE_MID = 7;
  const ROW_ROAD_TOP = 8;
  const ROW_ROAD_BOT = 12;
  const ROW_START = 13;

  const JUMP_DURATION = 120;
  const BASE_ROUND_TIME = 15;
  const GOAL_COUNT = 5;
  const GOAL_POSITIONS = [1, 4, 7, 10, 13];

  // ── Types ───────────────────────────────────────────────────────────────────
  type Direction = 'up' | 'down' | 'left' | 'right';

  interface Entity {
    col: number;
    width: number;
    type: 'car' | 'truck' | 'log' | 'turtle';
    submerged: boolean;
    submergeTimer: number;
    submergePhase: 'visible' | 'sinking' | 'underwater' | 'rising';
  }

  interface Lane {
    row: number;
    speed: number;
    dir: 1 | -1;
    entities: Entity[];
  }

  interface Frog {
    col: number;
    row: number;
    animating: boolean;
    animT: number;
    fromCol: number;
    fromRow: number;
    targetCol: number;
    targetRow: number;
  }

  // ── Game state ──────────────────────────────────────────────────────────────
  let lanes: Lane[] = [];
  let frog: Frog = makeFrog();
  let score = 0;
  let lives = 3;
  let level = 1;
  let roundTime = BASE_ROUND_TIME;
  let goalsOccupied: boolean[] = [false, false, false, false, false];
  let pendingDir: Direction | null = null;
  let gameState: 'playing' | 'paused' | 'gameover' = 'playing';
  let gameOverFired = false;
  let highestRowThisLife = ROW_START;

  function makeFrog(): Frog {
    return {
      col: Math.floor(COLS / 2),
      row: ROW_START,
      animating: false,
      animT: 0,
      fromCol: Math.floor(COLS / 2),
      fromRow: ROW_START,
      targetCol: Math.floor(COLS / 2),
      targetRow: ROW_START,
    };
  }

  // ── Lane generation ─────────────────────────────────────────────────────────
  function buildLanes(lvl: number): Lane[] {
    const speedScale = 1 + (lvl - 1) * 0.15;
    const result: Lane[] = [];

    const roadConfigs = [
      { row: 12, speed: 1.5, dir: -1 as const, type: 'car' as const, widths: [1, 1, 1], gap: 4 },
      { row: 11, speed: 2.0, dir: 1 as const, type: 'truck' as const, widths: [2, 2], gap: 5 },
      { row: 10, speed: 2.5, dir: -1 as const, type: 'car' as const, widths: [1, 1, 1], gap: 3 },
      { row: 9, speed: 1.8, dir: 1 as const, type: 'car' as const, widths: [1, 1, 1, 1], gap: 3 },
      { row: 8, speed: 3.0, dir: -1 as const, type: 'truck' as const, widths: [3, 2], gap: 5 },
    ];

    for (const cfg of roadConfigs) {
      const entities: Entity[] = [];
      let col = 0;
      for (const w of cfg.widths) {
        entities.push({
          col,
          width: w,
          type: cfg.type,
          submerged: false,
          submergeTimer: 0,
          submergePhase: 'visible',
        });
        col += w + cfg.gap;
      }
      result.push({ row: cfg.row, speed: cfg.speed * speedScale, dir: cfg.dir, entities });
    }

    const riverConfigs = [
      { row: 6, speed: 1.2, dir: 1 as const, type: 'log' as const, widths: [3, 3, 3], gap: 3 },
      {
        row: 5,
        speed: 1.5,
        dir: -1 as const,
        type: 'turtle' as const,
        widths: [2, 2, 2],
        gap: 3,
      },
      { row: 4, speed: 1.8, dir: 1 as const, type: 'log' as const, widths: [4, 2, 3], gap: 3 },
      {
        row: 3,
        speed: 1.0,
        dir: -1 as const,
        type: 'turtle' as const,
        widths: [3, 3, 3],
        gap: 2,
      },
      { row: 2, speed: 2.0, dir: 1 as const, type: 'log' as const, widths: [2, 2, 2], gap: 4 },
      {
        row: 1,
        speed: 1.3,
        dir: -1 as const,
        type: 'turtle' as const,
        widths: [2, 2, 2],
        gap: 4,
      },
    ];

    for (const cfg of riverConfigs) {
      const entities: Entity[] = [];
      let col = 0;
      for (const w of cfg.widths) {
        const isTurtle = cfg.type === 'turtle';
        entities.push({
          col,
          width: w,
          type: cfg.type,
          submerged: false,
          submergeTimer: isTurtle ? Math.random() * 3000 : 0,
          submergePhase: 'visible',
        });
        col += w + cfg.gap;
      }
      result.push({ row: cfg.row, speed: cfg.speed * speedScale, dir: cfg.dir, entities });
    }

    return result;
  }

  // ── Collision / support ─────────────────────────────────────────────────────
  function checkRoadCollision(fr: Frog, allLanes: Lane[]): boolean {
    for (const lane of allLanes) {
      if (lane.row < ROW_ROAD_TOP || lane.row > ROW_ROAD_BOT) continue;
      if (fr.row !== lane.row) continue;
      for (const e of lane.entities) {
        if (fr.col >= e.col && fr.col < e.col + e.width) return true;
      }
    }
    return false;
  }

  function getSupport(fr: Frog, allLanes: Lane[]): Entity | null {
    for (const lane of allLanes) {
      if (lane.row < ROW_RIVER_TOP || lane.row > ROW_RIVER_BOT) continue;
      if (fr.row !== lane.row) continue;
      for (const e of lane.entities) {
        if (fr.col >= e.col && fr.col < e.col + e.width) {
          if (e.type === 'turtle' && e.submerged) return null;
          return e;
        }
      }
    }
    return null;
  }

  function checkGoal(fr: Frog): boolean {
    if (fr.row !== ROW_GOALS) return false;
    for (let i = 0; i < GOAL_COUNT; i++) {
      const goalCol = GOAL_POSITIONS[i];
      if (fr.col >= goalCol && fr.col <= goalCol + 1) {
        if (goalsOccupied[i]) return false;
        goalsOccupied[i] = true;
        const timeBonus = Math.floor(roundTime * 10);
        score += 50 + timeBonus;
        resetFrogPosition();
        if (goalsOccupied.every(Boolean)) {
          completeRound();
        }
        return true;
      }
    }
    return false;
  }

  // ── Round / death management ────────────────────────────────────────────────
  function completeRound() {
    score += 200;
    level++;
    goalsOccupied = [false, false, false, false, false];
    lanes = buildLanes(level);
    roundTime = Math.max(5, BASE_ROUND_TIME - (level - 1));
    resetFrogPosition();
  }

  function resetFrogPosition() {
    frog = makeFrog();
    pendingDir = null;
    highestRowThisLife = ROW_START;
  }

  function killFrog() {
    lives--;
    if (lives <= 0) {
      lives = 0;
      gameState = 'gameover';
      fireGameOver();
    } else {
      roundTime = Math.max(5, BASE_ROUND_TIME - (level - 1));
      resetFrogPosition();
    }
  }

  function fireGameOver() {
    if (gameOverFired) return;
    gameOverFired = true;
    options?.onGameOver?.(score);
  }

  // ── Input ───────────────────────────────────────────────────────────────────
  function onKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        pendingDir = 'up';
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        pendingDir = 'down';
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        pendingDir = 'left';
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        pendingDir = 'right';
        e.preventDefault();
        break;
      case 'p':
      case 'P':
      case 'Escape':
        if (gameState === 'playing') gameState = 'paused';
        else if (gameState === 'paused') gameState = 'playing';
        e.preventDefault();
        break;
    }
  }

  window.addEventListener('keydown', onKeyDown);

  // ── Update ──────────────────────────────────────────────────────────────────
  function update(dt: number) {
    if (gameState !== 'playing') return;

    const ms = dt * 1000;

    for (const lane of lanes) {
      for (const e of lane.entities) {
        e.col += (lane.speed * lane.dir * dt * 60) / CELL;
        if (lane.dir === 1 && e.col > COLS) e.col = -e.width;
        if (lane.dir === -1 && e.col + e.width < 0) e.col = COLS;

        if (e.type === 'turtle') {
          e.submergeTimer += ms;
          if (e.submergePhase === 'visible' && e.submergeTimer > 3000) {
            e.submergePhase = 'sinking';
            e.submergeTimer = 0;
          } else if (e.submergePhase === 'sinking' && e.submergeTimer > 500) {
            e.submergePhase = 'underwater';
            e.submerged = true;
            e.submergeTimer = 0;
          } else if (e.submergePhase === 'underwater' && e.submergeTimer > 1500) {
            e.submergePhase = 'rising';
            e.submerged = false;
            e.submergeTimer = 0;
          } else if (e.submergePhase === 'rising' && e.submergeTimer > 500) {
            e.submergePhase = 'visible';
            e.submergeTimer = 0;
          }
        }
      }
    }

    if (!frog.animating) {
      if (pendingDir) {
        let tc = frog.col;
        let tr = frog.row;
        if (pendingDir === 'up') tr--;
        else if (pendingDir === 'down') tr++;
        else if (pendingDir === 'left') tc--;
        else if (pendingDir === 'right') tc++;

        if (tc >= 0 && tc < COLS && tr >= 0 && tr <= ROW_START) {
          frog.animating = true;
          frog.animT = 0;
          frog.fromCol = frog.col;
          frog.fromRow = frog.row;
          frog.targetCol = tc;
          frog.targetRow = tr;
        }
        pendingDir = null;
      }

      if (!frog.animating && frog.row >= ROW_RIVER_TOP && frog.row <= ROW_RIVER_BOT) {
        const support = getSupport(frog, lanes);
        if (support) {
          const lane = lanes.find((l) => l.row === frog.row)!;
          frog.col += (lane.speed * lane.dir * dt * 60) / CELL;
          if (frog.col < 0 || frog.col >= COLS) {
            killFrog();
            return;
          }
        } else {
          killFrog();
          return;
        }
      }
    }

    if (frog.animating) {
      frog.animT += ms;
      if (frog.animT >= JUMP_DURATION) {
        frog.col = frog.targetCol;
        frog.row = frog.targetRow;
        frog.animating = false;

        if (frog.row === ROW_GOALS) {
          if (!checkGoal(frog)) {
            killFrog();
            return;
          }
          return;
        }

        if (frog.row >= ROW_ROAD_TOP && frog.row <= ROW_ROAD_BOT) {
          if (checkRoadCollision(frog, lanes)) {
            killFrog();
            return;
          }
        }

        if (frog.row >= ROW_RIVER_TOP && frog.row <= ROW_RIVER_BOT) {
          const support = getSupport(frog, lanes);
          if (!support) {
            killFrog();
            return;
          }
        }

        if (frog.row < highestRowThisLife) {
          score += (highestRowThisLife - frog.row) * 10;
          highestRowThisLife = frog.row;
        }
      }
    }

    if (!frog.animating && frog.row >= ROW_ROAD_TOP && frog.row <= ROW_ROAD_BOT) {
      if (checkRoadCollision(frog, lanes)) {
        killFrog();
        return;
      }
    }

    roundTime -= dt;
    if (roundTime <= 0) {
      roundTime = 0;
      killFrog();
    }
  }

  // ── Drawing ─────────────────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (let row = 0; row < ROWS; row++) {
      let color: string;
      if (row === ROW_GOALS) color = '#1a3a1a';
      else if (row >= ROW_RIVER_TOP && row <= ROW_RIVER_BOT) color = '#0a1a3a';
      else if (row === ROW_SAFE_MID || row === ROW_START) color = '#1a3a1a';
      else color = '#1a1a1a';
      ctx.fillStyle = color;
      ctx.fillRect(0, row * CELL, W, CELL);
    }

    for (let i = 0; i < GOAL_COUNT; i++) {
      const gx = GOAL_POSITIONS[i] * CELL;
      ctx.fillStyle = goalsOccupied[i] ? '#2a5a2a' : '#0a2a0a';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.fillRect(gx, 0, 2 * CELL, CELL);
      ctx.strokeRect(gx, 0, 2 * CELL, CELL);
      if (goalsOccupied[i]) {
        drawFrogShape(gx + CELL * 0.5 + 6, 8, 0.6, p.secondary);
      }
    }

    for (const lane of lanes) {
      for (const e of lane.entities) {
        const ex = e.col * CELL;
        const ey = lane.row * CELL;
        const ew = e.width * CELL;

        if (e.type === 'car') {
          ctx.fillStyle = p.danger;
          ctx.fillRect(ex + 2, ey + 6, ew - 4, CELL - 12);
          ctx.fillStyle = '#333';
          ctx.beginPath();
          ctx.arc(ex + 8, ey + CELL - 4, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ex + ew - 8, ey + CELL - 4, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'truck') {
          ctx.fillStyle = '#888';
          ctx.fillRect(ex + 2, ey + 4, ew - 4, CELL - 8);
          ctx.fillStyle = '#555';
          ctx.fillRect(ex + 2, ey + 4, CELL * 0.6, CELL - 8);
          ctx.fillStyle = '#333';
          ctx.beginPath();
          ctx.arc(ex + 8, ey + CELL - 3, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ex + ew - 8, ey + CELL - 3, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'log') {
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(ex + 1, ey + 6, ew - 2, CELL - 12);
          ctx.strokeStyle = '#5C3317';
          ctx.lineWidth = 1;
          for (let lx = ex + 10; lx < ex + ew - 5; lx += 14) {
            ctx.beginPath();
            ctx.moveTo(lx, ey + 8);
            ctx.lineTo(lx, ey + CELL - 8);
            ctx.stroke();
          }
        } else if (e.type === 'turtle') {
          if (e.submerged) {
            ctx.strokeStyle = 'rgba(0,180,0,0.3)';
            ctx.lineWidth = 1;
            for (let ti = 0; ti < e.width; ti++) {
              ctx.beginPath();
              ctx.arc(ex + ti * CELL + CELL / 2, ey + CELL / 2, 12, 0, Math.PI * 2);
              ctx.stroke();
            }
          } else {
            const alpha =
              e.submergePhase === 'sinking' ? 0.6 : e.submergePhase === 'rising' ? 0.7 : 1;
            ctx.fillStyle = `rgba(0,180,0,${alpha})`;
            for (let ti = 0; ti < e.width; ti++) {
              ctx.beginPath();
              ctx.arc(ex + ti * CELL + CELL / 2, ey + CELL / 2, 14, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = `rgba(0,120,0,${alpha * 0.7})`;
              ctx.beginPath();
              ctx.arc(ex + ti * CELL + CELL / 2 - 4, ey + CELL / 2 - 4, 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(ex + ti * CELL + CELL / 2 + 4, ey + CELL / 2 - 4, 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = `rgba(0,180,0,${alpha})`;
            }
          }
        }
      }
    }

    drawFrogAnimated();

    ctx.fillStyle = p.text;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`SCORE: ${score}`, 8, 4);

    ctx.textAlign = 'center';
    ctx.fillText(`LVL ${level}`, W / 2, 4);

    ctx.textAlign = 'right';
    for (let i = 0; i < lives; i++) {
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(W - 20 - i * 22, 12, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    const maxTime = Math.max(5, BASE_ROUND_TIME - (level - 1));
    const timeFrac = Math.max(0, roundTime / maxTime);
    const barW = (W - 20) * timeFrac;
    const barColor = timeFrac > 0.5 ? '#00ff00' : timeFrac > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillStyle = barColor;
    ctx.fillRect(10, H - 8, barW, 6);
    ctx.strokeStyle = p.textDim;
    ctx.lineWidth = 1;
    ctx.strokeRect(10, H - 8, W - 20, 6);

    if (gameState === 'gameover') {
      drawOverlay('GAME OVER', `Score: ${score}`);
    }
    if (gameState === 'paused') {
      drawOverlay('PAUSA');
    }
  }

  function drawFrogAnimated() {
    let fx: number, fy: number;
    if (frog.animating) {
      const t = Math.min(frog.animT / JUMP_DURATION, 1);
      fx = (frog.fromCol + (frog.targetCol - frog.fromCol) * t) * CELL;
      fy = (frog.fromRow + (frog.targetRow - frog.fromRow) * t) * CELL;
    } else {
      fx = frog.col * CELL;
      fy = frog.row * CELL;
    }
    drawFrogShape(fx + 6, fy + 8, 1, p.primary);
  }

  function drawFrogShape(x: number, y: number, scale: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x + 14 * scale, y + 12 * scale, 14 * scale, 12 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + 6 * scale, y + 4 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 22 * scale, y + 4 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + 6 * scale, y + 4 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 22 * scale, y + 4 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawOverlay(title: string, subtitle?: string) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = p.text;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, W / 2, H / 2 - 20);
    if (subtitle) {
      ctx.font = 'bold 24px monospace';
      ctx.fillText(subtitle, W / 2, H / 2 + 25);
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
  lanes = buildLanes(level);
  rafId = requestAnimationFrame(loop);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  return () => {
    stopped = true;
    cancelAnimationFrame(rafId);
    window.removeEventListener('keydown', onKeyDown);
  };
}
