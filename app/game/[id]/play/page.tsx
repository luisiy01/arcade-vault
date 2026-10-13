import { notFound } from "next/navigation";
import Link from "next/link";
import { GAMES, getGameById } from "@/lib/data";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = getGameById(id);
  if (!game) notFound();

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              INVITADO
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">0</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">♥ ♥ ♥</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">01</div>
          </div>
        </div>
        <div className="hud-actions">
          <Link href={`/game/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor" />
            <div className="enemy e1" />
            <div className="enemy e2" />
            <div className="enemy e3" />
            <div className="player-ship" />
          </div>
          <div
            className="crt-content"
            style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}
          >
            <div>
              <div className="pixel neon-cyan" style={{ fontSize: 18 }}>
                EN DESARROLLO
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--ink-dim)",
                  marginTop: 10,
                  letterSpacing: "0.16em",
                }}
              >
                ESTE JUEGO AÚN NO ESTÁ DISPONIBLE
              </div>
            </div>
          </div>
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>
    </div>
  );
}
