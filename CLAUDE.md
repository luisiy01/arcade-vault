# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault — plataforma de juegos online retro donde jugadores compiten por puntajes altos. Built with Next.js 16.4, React 19.3, TypeScript, Tailwind CSS v4, Supabase (backend/DB), Resend (email).

No test framework configured yet.

## Next.js 16 — Read Bundled Docs First

This project runs Next.js 16.4 which has breaking changes from earlier versions. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/` — do not rely on training data. The `AGENTS.md` file is auto-managed by `next dev` and should be committed as-is.

Key config flags enabled in `next.config.ts`:

- `experimental.agentFeedback` — structured error reporting for agents
- `experimental.agentUpgrade: "security"` — security upgrades for agents
- `cacheComponents` — component-level caching
- `partialPrefetching` — partial prefetching
- Turbopack with `@tailwindcss/turbopack` loader for CSS

## Skills

- `/frontend-design` — diseño de interfaz de usuario (usar siempre para UI)
- `/spec` — crea specs siguiendo método spec-driven
- `/spec-impl` — implementa spec aprobado (crea branch, implementa paso a paso)
- `/new-game` — genera spec completo para integrar juego nuevo
- `/spec-impl-game` — pipeline completo: implementa spec + skin-designer + mobile-porter

## Agents

Definiciones completas en `.claude/agents/`.

- **game-planner** — sugiere juegos, evalúa viabilidad, registra en `references/game-suggestions-todo.md`
- **game-jam** — genera 3 specs de juegos por tema en `specs/game-jam/`
- **skin-designer** — audita y aplica skins (3 paletas por juego). Ref: `references/skin-standards.md`
- **mobile-porter** — audita y corrige experiencia mobile (responsive, touch, canvas scaling)
- **game-performance-booster** — audita y corrige performance React en juegos
- **security-auditor** — audita seguridad DB (RLS, policies, advisors) y App (headers, auth, secrets, XSS)

## Architecture

- **App Router** (`app/` directory) — no Pages Router
- `app/layout.tsx` — root layout using `LayoutProps<"/">` type (Next.js 16 convention), Press Start 2P (pixel font) + JetBrains Mono
- `app/globals.css` — Tailwind v4 via `@import "tailwindcss"` with `@theme inline` for custom tokens
- Path alias: `@/*` maps to project root

### Pages / Routes

| Route             | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `/`               | Redirect to `/games`                                     |
| `/games`          | Home — catálogo de juegos con filtros por categoría      |
| `/library`        | Biblioteca de juegos del usuario                         |
| `/game/[id]`      | Detalle de juego (descripción, leaderboard, botón jugar) |
| `/game/[id]/play` | Pantalla de juego (canvas del juego activo)              |
| `/hall`           | Hall of Fame — ranking global y scores recientes         |
| `/auth`           | Login/registro (auth simple por nombre, localStorage)    |
| `/about`          | Acerca de + formulario de contacto                       |
| `/api/contact`    | API route — envía email de contacto vía Resend           |

### Games Implemented

Cada juego tiene motor en `lib/games/` y componente React en `components/games/`:

Revisa el archvivo 'references\implemented-games.md'

Pattern: game engine class en `lib/games/[name].ts` (lógica pura canvas), wrapper React en `components/games/[name].tsx` (ref canvas, lifecycle, score submit).

### Key Components

- `components/nav.tsx` — navegación principal con links activos, auth state, menú mobile
- `components/game-card.tsx` — tarjeta de juego para catálogo
- `components/mini-card.tsx` — tarjeta compacta
- `components/game-loader.tsx` — loader con instrucciones antes de iniciar juego
- `components/player-hud.tsx` — HUD del jugador durante gameplay
- `components/play-screen.tsx` — pantalla de juego (wrapper canvas + HUD + game over)
- `components/skin-selector.tsx` — selector de skin por juego
- `components/touch-gamepad.tsx` — gamepad táctil para mobile
- `components/floating-silhouettes.tsx` — decoración animada de fondo
- `components/feature-icon.tsx` — ícono de feature (home)
- `components/highlight-icon.tsx` — ícono de highlight (home)

### Shared Lib

- `lib/data.ts` — re-exports `Game`, `Score` + constante `CATS` (categorías)
- `lib/use-skin.ts` — hook para skin persistido en localStorage
- `lib/games/skins.ts` — sistema de skins: paletas, resolver, utilidades de color

### Supabase Integration

- `utils/supabase/server.ts` — server client (SSR)
- `utils/supabase/client.ts` — browser client
- `lib/supabase/games.ts` — queries: `getGames`, `getGameById`, `getGamesByCategory`, `getGameSlugs`
- `lib/supabase/scores.ts` — queries server: `getScoresByGame`, `getGlobalRanking`, `getRecentScores`
- `lib/supabase/scores-client.ts` — mutations client: `submitScore`
- `lib/supabase/types.ts` — interfaces `Game`, `Score`
- DB tables: `games` (catálogo), `scores` (puntajes). RPC: `get_global_ranking`

### Auth

Auth simple basada en localStorage (no Supabase Auth). `lib/auth-context.tsx` provee `AuthProvider`, `useAuth()` con `user`, `login`, `logout`. Nombre se normaliza uppercase en `submitScore()` (`scores-client.ts`). Límite 10 chars enforced en UI (`app/auth/page.tsx`).

### Design System

Tema retro arcade — fondo oscuro (#0a0a0f), neón colors (cyan, magenta, yellow, green), podium colors (gold, silver, bronze), pixel font + monospace. Custom CSS vars en `:root` mapeados a Tailwind v4 `@theme inline`. Categorías de juegos: `TODOS`, `ARCADE`, `PUZZLE`, `SHOOTER`, `VERSUS`.

## Design Approach

Project follows Spec Driven Design. Based on practices from `Klerith/fernando-skills`.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- `RESEND_API_KEY` — Resend API key for contact form

## Language

README and project context are in Spanish. Follow user's language preference.
