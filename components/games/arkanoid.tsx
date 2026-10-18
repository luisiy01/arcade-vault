'use client';

import { useRef, useEffect, useCallback } from 'react';
import { startArkanoid } from '@/lib/games/arkanoid';
import { useAuth } from '@/lib/auth-context';
import { submitScore } from '@/lib/supabase/scores-client';

export function ArkanoidGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  const handleGameOver = useCallback((score: number) => {
    const currentUser = userRef.current;
    if (!currentUser || score <= 0) return;
    submitScore('arkanoid', currentUser.name, score).catch(() => {});
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startArkanoid(canvas, { onGameOver: handleGameOver });
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
