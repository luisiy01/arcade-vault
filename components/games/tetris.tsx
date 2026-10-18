'use client';

import { useRef, useEffect, useCallback } from 'react';
import { startTetris } from '@/lib/games/tetris';
import { useAuth } from '@/lib/auth-context';
import { submitScore } from '@/lib/supabase/scores-client';

export function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  const handleGameOver = useCallback((score: number) => {
    const currentUser = userRef.current;
    if (!currentUser || score <= 0) return;
    submitScore('tetris', currentUser.name, score).catch(() => {});
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startTetris(canvas, { onGameOver: handleGameOver });
  }, [handleGameOver]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={480}
      tabIndex={0}
      autoFocus
      className="game-canvas"
    />
  );
}
