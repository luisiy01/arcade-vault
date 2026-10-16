'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { Game, Score } from '@/lib/supabase/types';
import { FloatingSilhouettes } from '@/components/floating-silhouettes';
import { FeatureIcon } from '@/components/feature-icon';
import { MiniCard } from '@/components/mini-card';

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const FEATURES = [
  {
    icon: 'GAMEPAD',
    title: 'JUEGOS CLÁSICOS',
    desc: 'Arkanoid, Tetris, Snake y muchos más. Los mejores arcades de todos los tiempos en un solo lugar.',
    color: 'cyan',
  },
  {
    icon: 'FREE',
    title: '100% GRATIS',
    desc: 'Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.',
    color: 'yellow',
  },
  {
    icon: 'TROPHY',
    title: 'LADDER BOARDS',
    desc: 'Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.',
    color: 'magenta',
  },
  {
    icon: 'ROCKET',
    title: 'SIEMPRE CRECIENDO',
    desc: 'Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.',
    color: 'green',
  },
];

const GAME_COLORS: Record<string, string> = {
  'bloque-buster': 'cyan',
  caida: 'magenta',
  serpentina: 'green',
  gloton: 'yellow',
  invasores: 'green',
  asteroids: 'yellow',
  ranaria: 'green',
  'duelo-pixel': 'cyan',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

interface Props {
  games: Game[];
  recentScores: Score[];
  topPlayers: { player_name: string; total_score: number }[];
}

export function HomeClient({ games, recentScores, topPlayers }: Props) {
  useReveal();

  const gamesMap = new Map(games.map((g) => [g.id, g]));

  return (
    <div className="home fade-in">
      {/* HERO */}
      <section className="home-hero">
        <FloatingSilhouettes />
        <div className="home-hero-inner">
          <div className="hero-eyebrow pixel neon-yellow">
            ▸ INSERTA UNA MONEDA<span className="blink">_</span>
          </div>
          <h1 className="home-title">
            <span className="line-1">EL ARCADE</span>
            <span className="line-2">CLÁSICO ESTÁ</span>
            <span className="line-3">DE VUELTA</span>
          </h1>
          <p className="home-sub">
            Juega los mejores clásicos directamente en tu navegador.
            <br />
            Sin descargas. Sin costo. Solo diversión.
          </p>
          <div className="home-ctas">
            <Link href="/library" className="btn xl pulse">
              ▶ EXPLORAR JUEGOS
            </Link>
            <Link href="/auth" className="btn xl magenta">
              ✦ CREAR CUENTA
            </Link>
          </div>
          <div className="hero-scroll" aria-hidden="true">
            <span>DESLIZA</span>
            <span className="arrow">▼</span>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-magenta">// 01</div>
          <h2 className="section-title">¿POR QUÉ ARCADE VAULT?</h2>
          <div className="section-rule" />
        </div>
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`feature-card ${f.color}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <FeatureIcon kind={f.icon} />
              <div className="ft-title pixel">{f.title}</div>
              <div className="ft-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* GAMES PREVIEW */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-cyan">// 02</div>
          <h2 className="section-title">JUEGOS DISPONIBLES AHORA</h2>
          <div className="section-rule" />
        </div>
        <div className="mini-rail">
          {games.slice(0, 6).map((g) => (
            <MiniCard key={g.id} game={g} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link href="/library" className="btn lg">
            VER TODOS LOS JUEGOS →
          </Link>
        </div>
      </section>

      {/* STATS */}
      <section className="home-stats reveal">
        <div className="stats-inner">
          {[
            { n: '12+', u: 'JUEGOS', s: 'Y CONTANDO' },
            { n: 'MILES', u: 'DE PARTIDAS', s: 'JUGADAS CADA DÍA' },
            { n: 'GLOBAL', u: 'RANKING', s: 'COMPITE CON EL MUNDO' },
          ].map((st, i) => (
            <div key={i} className="stat-block" style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="stat-n neon-yellow">{st.n}</div>
              <div className="stat-u pixel">{st.u}</div>
              <div className="stat-s">{st.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT ACTIVITY / LEADERBOARD */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-yellow">// 03</div>
          <h2 className="section-title">ACTIVIDAD EN VIVO</h2>
          <div className="section-rule" />
        </div>
        <div className="activity-grid">
          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel">▸ ÚLTIMAS PUNTUACIONES</div>
            </div>
            <div className="ticker">
              {recentScores.map((r, i) => {
                const g = gamesMap.get(r.game_id);
                const color = GAME_COLORS[r.game_id] ?? 'cyan';
                return (
                  <div key={r.id} className="tick-row" style={{ animationDelay: `${i * 60}ms` }}>
                    <span className={`tk-p neon-${color}`}>{r.player_name}</span>
                    <span className="tk-mid">▸ {g?.title ?? r.game_id}</span>
                    <span className="tk-s">+{r.score.toLocaleString('es-ES')}</span>
                    <span className="tk-t">{timeAgo(r.created_at)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel neon-magenta">▸ TOP JUGADORES · GLOBAL</div>
              <Link href="/hall" className="lb-link">
                VER SALÓN →
              </Link>
            </div>
            <div className="top-list">
              {topPlayers.map((r, i) => (
                <div
                  key={r.player_name}
                  className={`top-row${i === 0 ? ' top1' : i === 1 ? ' top2' : i === 2 ? ' top3' : ''}`}
                >
                  <span className="tp-rk">#{String(i + 1).padStart(2, '0')}</span>
                  <span className="tp-bar">
                    <span className="tp-fill" style={{ width: `${100 - i * 16}%` }} />
                  </span>
                  <span className="tp-p">{r.player_name}</span>
                  <span className="tp-s">{r.total_score.toLocaleString('es-ES')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="home-final reveal">
        <h2 className="final-title pixel">¿LISTO PARA JUGAR?</h2>
        <Link href="/library" className="btn xl pulse final-cta">
          INSERTAR MONEDA →
        </Link>
        <div className="final-tag">Gratis. Sin registro obligatorio. Empieza en segundos.</div>
      </section>
    </div>
  );
}
