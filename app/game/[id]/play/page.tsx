import { notFound } from 'next/navigation';
import { getGameSlugs, getGameById } from '@/lib/supabase/games';
import { PlayerHud } from '@/components/player-hud';
import { GameLoader } from '@/components/game-loader';

export async function generateStaticParams() {
  const slugs = await getGameSlugs();
  return slugs.map((g) => ({ id: g.id }));
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) notFound();

  return (
    <div className="av-player fade-in" data-game={game.id}>
      <PlayerHud gameId={game.id} />

      <div className="game-controls-legend">
        {game.id === 'tetris' ? (
          <>
            <span>← → MOVER</span>
            <span>↑ ROTAR</span>
            <span>↓ BAJAR</span>
            <span>ESPACIO: CAÍDA</span>
            <span>P: PAUSA</span>
          </>
        ) : game.id === 'arkanoid' ? (
          <>
            <span>← → MOVER PALETA</span>
            <span>P: PAUSA</span>
          </>
        ) : game.id === 'snake' ? (
          <>
            <span>← → ↑ ↓ / WASD DIRECCIÓN</span>
            <span>P: PAUSA</span>
          </>
        ) : (
          <>
            <span>FLECHAS: MOVER</span>
            <span>ESPACIO: DISPARAR</span>
          </>
        )}
      </div>

      <div className="crt">
        <div className="crt-screen">
          <GameLoader gameId={game.id} />
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      <div className="game-mobile-warning">
        <div className="pixel neon-yellow">TECLADO REQUERIDO</div>
        <div>Este juego requiere teclado. Juega desde una computadora.</div>
      </div>
    </div>
  );
}
