'use client';

import { useRef, useEffect } from 'react';
import { startAsteroids } from '@/lib/games/asteroids';

export function AsteroidsGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cleanup = startAsteroids(canvas);
    return cleanup;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      tabIndex={0}
      autoFocus
      className="game-canvas"
    />
  );
}
