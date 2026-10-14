"use client";

import { useEffect } from "react";
import Link from "next/link";
import { GAMES } from "@/lib/data";
import { FloatingSilhouettes } from "@/components/floating-silhouettes";
import { FeatureIcon } from "@/components/feature-icon";
import { MiniCard } from "@/components/mini-card";

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
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
    icon: "GAMEPAD",
    title: "JUEGOS CLÁSICOS",
    desc: "Arkanoid, Tetris, Snake y muchos más. Los mejores arcades de todos los tiempos en un solo lugar.",
    color: "cyan",
  },
  {
    icon: "FREE",
    title: "100% GRATIS",
    desc: "Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.",
    color: "yellow",
  },
  {
    icon: "TROPHY",
    title: "LADDER BOARDS",
    desc: "Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.",
    color: "magenta",
  },
  {
    icon: "ROCKET",
    title: "SIEMPRE CRECIENDO",
    desc: "Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.",
    color: "green",
  },
];

const RECENT_SCORES = [
  { player: "NEONFOX", game: "Caída", score: 184220, time: "hace 2 min", color: "magenta" },
  { player: "PX_KAI", game: "Glotón", score: 96400, time: "hace 5 min", color: "yellow" },
  { player: "Z3R0COOL", game: "Invasores", score: 54190, time: "hace 8 min", color: "green" },
  { player: "VAULT_07", game: "Rocas", score: 41200, time: "hace 12 min", color: "cyan" },
  { player: "GLITCHA", game: "Bloque Buster", score: 28450, time: "hace 18 min", color: "cyan" },
  { player: "ARKADYA", game: "Serpentina", score: 7820, time: "hace 24 min", color: "green" },
  { player: "CYBER_LU", game: "Ranaria", score: 18900, time: "hace 31 min", color: "yellow" },
];

const TOP_PLAYERS = [
  { rank: 1, player: "NEONFOX", score: 312840 },
  { rank: 2, player: "PX_KAI", score: 248110 },
  { rank: 3, player: "M00NRYU", score: 196720 },
  { rank: 4, player: "VAULT_07", score: 154300 },
  { rank: 5, player: "GLITCHA", score: 138900 },
];

export default function HomePage() {
  useReveal();

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
          {GAMES.slice(0, 6).map((g) => (
            <MiniCard key={g.id} game={g} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/library" className="btn lg">
            VER TODOS LOS JUEGOS →
          </Link>
        </div>
      </section>

      {/* STATS */}
      <section className="home-stats reveal">
        <div className="stats-inner">
          {[
            { n: "12+", u: "JUEGOS", s: "Y CONTANDO" },
            { n: "MILES", u: "DE PARTIDAS", s: "JUGADAS CADA DÍA" },
            { n: "GLOBAL", u: "RANKING", s: "COMPITE CON EL MUNDO" },
          ].map((st, i) => (
            <div
              key={i}
              className="stat-block"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
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
              {RECENT_SCORES.map((r, i) => (
                <div
                  key={i}
                  className="tick-row"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className={`tk-p neon-${r.color}`}>{r.player}</span>
                  <span className="tk-mid">▸ {r.game}</span>
                  <span className="tk-s">
                    +{r.score.toLocaleString("es-ES")}
                  </span>
                  <span className="tk-t">{r.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel neon-magenta">
                ▸ TOP JUGADORES · HOY
              </div>
              <Link href="/hall" className="lb-link">
                VER SALÓN →
              </Link>
            </div>
            <div className="top-list">
              {TOP_PLAYERS.map((r, i) => (
                <div
                  key={i}
                  className={`top-row${i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : ""}`}
                >
                  <span className="tp-rk">
                    #{String(r.rank).padStart(2, "0")}
                  </span>
                  <span className="tp-bar">
                    <span
                      className="tp-fill"
                      style={{ width: `${100 - i * 16}%` }}
                    />
                  </span>
                  <span className="tp-p">{r.player}</span>
                  <span className="tp-s">
                    {r.score.toLocaleString("es-ES")}
                  </span>
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
        <div className="final-tag">
          Gratis. Sin registro obligatorio. Empieza en segundos.
        </div>
      </section>
    </div>
  );
}
