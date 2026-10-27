'use client';

import { useRef, useEffect, useCallback, memo } from 'react';
import { startTetris } from '@/lib/games/tetris';
import { useAuth } from '@/lib/auth-context';
import { submitScore } from '@/lib/supabase/scores-client';
import type { SkinId } from '@/lib/games/skins';
import { getGamePalette } from '@/lib/games/skins';

export const TetrisGame = memo(function TetrisGame({ skinId }: { skinId?: SkinId }) {
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
    const palette = getGamePalette(skinId ?? 'clasico', 'tetris');
    void palette; // Ready for engine skin support
    return startTetris(canvas, { onGameOver: handleGameOver });
  }, [handleGameOver, skinId]);

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
});
