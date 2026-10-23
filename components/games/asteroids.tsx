'use client';

import { useRef, useEffect, useCallback } from 'react';
import { startAsteroids } from '@/lib/games/asteroids';
import { useAuth } from '@/lib/auth-context';
import { submitScore } from '@/lib/supabase/scores-client';
import type { SkinId } from '@/lib/games/skins';
import { getGamePalette } from '@/lib/games/skins';

export function AsteroidsGame({ skinId }: { skinId?: SkinId }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  const handleGameOver = useCallback((score: number) => {
    const currentUser = userRef.current;
    if (!currentUser || score <= 0) return;
    submitScore('asteroids', currentUser.name, score).catch(() => {});
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const palette = getGamePalette(skinId ?? 'clasico', 'asteroids');
    return startAsteroids(canvas, { onGameOver: handleGameOver, palette, skinId });
  }, [handleGameOver, skinId]);

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
