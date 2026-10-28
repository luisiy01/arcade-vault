'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Game, Score } from '@/lib/supabase/types';
import { useAuth } from '@/lib/auth-context';

interface Props {
  games: Game[];
  scoresByGame: Record<string, Score[]>;
}

export function HallClient({ games, scoresByGame }: Props) {
  const [tab, setTab] = useState(games[0]?.id ?? '');
  const rows = scoresByGame[tab] ?? [];
  const game = games.find((g) => g.id === tab);
  const { user } = useAuth();

  const userBest = user ? rows.find((r) => r.user_id === user.id) : null;
  const userRank = userBest ? rows.indexOf(userBest) + 1 : null;

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <div className="hall-tabs">
        {games.map((g) => (
          <button
            key={g.id}
            className={`chip${tab === g.id ? ' active' : ''}`}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {rows.length >= 3 && (
        <div className="podium">
          <div className="podium-slot silver">
            <div className="rank-num">02</div>
            <div className="name">{rows[1].player_name}</div>
            <div className="score">{rows[1].score.toLocaleString('es-ES')}</div>
            <div className="date">{new Date(rows[1].created_at).toLocaleDateString('es-ES')}</div>
          </div>
          <div className="podium-slot gold">
            <div
              className="pixel"
              style={{
                fontSize: 9,
                color: 'var(--gold)',
                letterSpacing: '0.18em',
              }}
            >
              CAMPEÓN
            </div>
            <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>
              01
            </div>
            <div className="name">{rows[0].player_name}</div>
            <div className="score" style={{ fontSize: 20 }}>
              {rows[0].score.toLocaleString('es-ES')}
            </div>
            <div className="date">{new Date(rows[0].created_at).toLocaleDateString('es-ES')}</div>
          </div>
          <div className="podium-slot bronze">
            <div className="rank-num">03</div>
            <div className="name">{rows[2].player_name}</div>
            <div className="score">{rows[2].score.toLocaleString('es-ES')}</div>
            <div className="date">{new Date(rows[2].created_at).toLocaleDateString('es-ES')}</div>
          </div>
        </div>
      )}

      <div className="hall-table">
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.id}
            className={`tr${i === 0 ? ' top1' : i === 1 ? ' top2' : i === 2 ? ' top3' : ''}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="rk">#{String(i + 1).padStart(2, '0')}</div>
            <div className="pl">{r.player_name}</div>
            <div className="sc">{r.score.toLocaleString('es-ES')}</div>
            <div className="dt">{new Date(r.created_at).toLocaleDateString('es-ES')}</div>
          </div>
        ))}
        {user && game && userBest && userRank && (
          <>
            <div className="tr you-label">▸ TU MEJOR MARCA EN {game.title}</div>
            <div className="tr you" style={{ animationDelay: `${rows.length * 50 + 50}ms` }}>
              <div className="rk" style={{ color: 'var(--yellow)' }}>
                #{String(userRank).padStart(2, '0')}
              </div>
              <div className="pl" style={{ color: 'var(--yellow)' }}>
                {user.displayName}
              </div>
              <div
                className="sc"
                style={{
                  color: 'var(--yellow)',
                  textShadow: '0 0 6px rgba(245,255,0,0.5)',
                }}
              >
                {userBest.score.toLocaleString('es-ES')}
              </div>
              <div className="dt">{new Date(userBest.created_at).toLocaleDateString('es-ES')}</div>
            </div>
          </>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Link href="/" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
