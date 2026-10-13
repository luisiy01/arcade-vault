"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function PlayerHud({ gameId }: { gameId: string }) {
  const { user } = useAuth();

  return (
    <div className="player-hud">
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div className="hud-stat">
          <div className="l">Jugador</div>
          <div className="v" style={{ color: "var(--ink)" }}>
            {user?.name ?? "INVITADO"}
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
        <Link href={`/game/${gameId}`} className="btn ghost">
          SALIR
        </Link>
      </div>
    </div>
  );
}
