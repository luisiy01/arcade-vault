'use client';

import dynamic from 'next/dynamic';
import type { SkinId } from '@/lib/games/skins';

const AsteroidsGame = dynamic(
  () => import('@/components/games/asteroids').then((m) => m.AsteroidsGame),
  { ssr: false },
);

const TetrisGame = dynamic(() => import('@/components/games/tetris').then((m) => m.TetrisGame), {
  ssr: false,
});

const ArkanoidGame = dynamic(
  () => import('@/components/games/arkanoid').then((m) => m.ArkanoidGame),
  { ssr: false },
);

const SnakeGame = dynamic(() => import('@/components/games/snake').then((m) => m.SnakeGame), {
  ssr: false,
});

const FroggerGame = dynamic(() => import('@/components/games/frogger').then((m) => m.FroggerGame), {
  ssr: false,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GAME_MAP: Record<string, React.ComponentType<any>> = {
  asteroids: AsteroidsGame,
  tetris: TetrisGame,
  arkanoid: ArkanoidGame,
  snake: SnakeGame,
  frogger: FroggerGame,
};

export function GameLoader({ gameId, skinId }: { gameId: string; skinId?: SkinId }) {
  const Game = GAME_MAP[gameId];

  if (!Game) {
    return (
      <div className="crt-content" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 5 }}>
        <div>
          <div className="pixel neon-cyan" style={{ fontSize: 18 }}>
            EN DESARROLLO
          </div>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: 'var(--ink-dim)',
              marginTop: 10,
              letterSpacing: '0.16em',
            }}
          >
            ESTE JUEGO AÚN NO ESTÁ DISPONIBLE
          </div>
        </div>
      </div>
    );
  }

  return <Game skinId={skinId} />;
}
