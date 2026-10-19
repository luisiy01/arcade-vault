'use client';

import { useRef, useEffect, useCallback } from 'react';
import { startSnake } from '@/lib/games/snake';
import { useAuth } from '@/lib/auth-context';
import { submitScore } from '@/lib/supabase/scores-client';

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  const handleGameOver = useCallback((score: number) => {
    const currentUser = userRef.current;
    if (!currentUser || score <= 0) return;
    submitScore('snake', currentUser.name, score).catch(() => {});
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startSnake(canvas, { onGameOver: handleGameOver });
  }, [handleGameOver]);

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
