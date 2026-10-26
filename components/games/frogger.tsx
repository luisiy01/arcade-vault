'use client';

import { useRef, useEffect, useCallback } from 'react';
import { startFrogger } from '@/lib/games/frogger';
import { useAuth } from '@/lib/auth-context';
import { submitScore } from '@/lib/supabase/scores-client';
import type { SkinId } from '@/lib/games/skins';
import { getGamePalette } from '@/lib/games/skins';

export function FroggerGame({ skinId }: { skinId?: SkinId }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  const handleGameOver = useCallback((score: number) => {
    const currentUser = userRef.current;
    if (!currentUser || score <= 0) return;
    submitScore('frogger', currentUser.name, score).catch(() => {});
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const palette = getGamePalette(skinId ?? 'clasico', 'frogger');
    return startFrogger(canvas, { onGameOver: handleGameOver, palette, skinId });
  }, [handleGameOver, skinId]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={560}
      tabIndex={0}
      autoFocus
      className="game-canvas"
    />
  );
}
