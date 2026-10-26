'use client';

import { PlayerHud } from '@/components/player-hud';
import { GameLoader } from '@/components/game-loader';
import { SkinSelector } from '@/components/skin-selector';
import { TouchGamepad } from '@/components/touch-gamepad';
import { useSkin } from '@/lib/use-skin';
import Link from 'next/link';

interface PlayScreenProps {
  game: { id: string; title: string };
}

export function PlayScreen({ game }: PlayScreenProps) {
  const [skin, setSkin] = useSkin();

  return (
    <div className="av-player fade-in" data-game={game.id}>
      <PlayerHud gameId={game.id} />

      <div className="game-controls-legend">
        {game.id === 'tetris' ? (
          <>
            <span>{'← → MOVER'}</span>
            <span>{'↑ ROTAR'}</span>
            <span>{'↓ BAJAR'}</span>
            <span>{'ESPACIO: CAÍDA'}</span>
            <span>P: PAUSA</span>
          </>
        ) : game.id === 'arkanoid' ? (
          <>
            <span>{'← → MOVER PALETA'}</span>
            <span>P: PAUSA</span>
          </>
        ) : game.id === 'snake' ? (
          <>
            <span>{'← → ↑ ↓ / WASD DIRECCIÓN'}</span>
            <span>P: PAUSA</span>
          </>
        ) : (
          <>
            <span>FLECHAS: MOVER</span>
            <span>ESPACIO: DISPARAR</span>
          </>
        )}
      </div>

      <SkinSelector skin={skin} onSkinChange={setSkin} />

      <div className="crt">
        <div className="crt-screen">
          <GameLoader gameId={game.id} skinId={skin} />
        </div>
        <div className="crt-bottom">
          <span className="led">{'SEÑAL OK'}</span>
          <span>
            {game.title} {'·'} CRT-83 {'·'} 60 HZ
          </span>
          <span>{'CARGA · 1MB'}</span>
        </div>
      </div>

      <TouchGamepad gameId={game.id} />

      <Link href={`/game/${game.id}`} className="mobile-exit-btn">
        SALIR
      </Link>
    </div>
  );
}
