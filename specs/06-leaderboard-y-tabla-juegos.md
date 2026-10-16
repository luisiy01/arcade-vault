# SPEC 06 — Leaderboard real y migración de juegos a Supabase

> **Status:** Borrador
> **Depends on:** SPEC 04, SPEC 05
> **Date:** 2026-10-16
> **Objective:** Migrar los juegos hardcodeados a una tabla `games` en Supabase, crear tabla `scores` para el leaderboard, implementar submit de scores desde el juego, y mostrar rankings reales por juego y global en la UI.

## Scope

**In:**

- Tabla `games` en Supabase con los campos actuales de la interfaz `Game` de `lib/data.ts`.
- Tabla `scores` en Supabase con campos: id, game_id (FK a games), player_name, score, created_at.
- SQL migration con seed de los 8 juegos actuales y scores de ejemplo.
- Utilidades server-side en `lib/supabase/games.ts` para queries de juegos.
- Utilidades en `lib/supabase/scores.ts` para queries de scores y submit.
- Reemplazar todos los usos de `GAMES` hardcodeado con datos de Supabase (library, game page, hall, home).
- Submit de score al terminar partida en Asteroids (game over) usando nombre del auth actual (localStorage).
- Página `/hall` con scores reales de Supabase en vez de `seededScores()`.
- Ranking por juego (tabs como actualmente) con datos reales.
- Ranking global en home page: suma del best score por juego de cada jugador.
- Sin RLS por ahora. Tablas accesibles con anon key.
- Categorías (`CATS`) se mantienen hardcodeadas por ahora (no justifica tabla propia).

**Out of scope (para futuros specs):**

- Supabase Auth real (email/password, OAuth). Se sigue usando auth localStorage.
- RLS (Row Level Security) policies. Va con Supabase Auth.
- Supabase Realtime para actividad en vivo.
- Supabase Storage para covers de juegos.
- Panel de administración para gestionar juegos.
- Anti-cheat o validación server-side de scores.
- Paginación avanzada en leaderboard (se limita a top 12 por juego).
- Submit de scores para juegos distintos a Asteroids (cada juego se conecta en su propio spec de implementación).

## Data model

### Tabla `games`

```sql
create table games (
  id text primary key,           -- 'asteroids', 'bloque-buster', etc.
  title text not null,
  short text not null,           -- descripción corta
  long text not null,            -- descripción larga
  cat text not null,             -- categoría: ARCADE, PUZZLE, SHOOTER, VERSUS
  cover text not null,           -- nombre del cover en /public/covers/
  color text not null,           -- cyan, magenta, yellow, green
  best integer not null default 0,
  plays text not null default '0',
  created_at timestamptz not null default now()
);
```

### Tabla `scores`

```sql
create table scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references games(id),
  player_name text not null,     -- nombre del usuario (del auth localStorage)
  score integer not null,
  created_at timestamptz not null default now()
);

create index idx_scores_game_id on scores(game_id);
create index idx_scores_score on scores(score desc);
create index idx_scores_player_game on scores(player_name, game_id);
```

### Interfaces TypeScript

```ts
// Se mantiene Game compatible con la interfaz actual
export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: string;
  cover: string;
  color: 'cyan' | 'magenta' | 'yellow' | 'green';
  best: number;
  plays: string;
}

export interface Score {
  id: string;
  game_id: string;
  player_name: string;
  score: number;
  created_at: string;
}
```

### Vista global ranking

El ranking global se calcula con query: para cada jugador, sumar su mejor score por juego.

```sql
select player_name, sum(best_score) as total_score
from (
  select player_name, game_id, max(score) as best_score
  from scores
  group by player_name, game_id
) sub
group by player_name
order by total_score desc
limit 10;
```

## Implementation plan

1. **Crear migration SQL en Supabase:** tabla `games`, tabla `scores` con índices, seed de los 8 juegos con datos actuales de `lib/data.ts`, seed de scores de ejemplo (20-30 filas distribuidas entre juegos).

2. **Crear `lib/supabase/games.ts`:** funciones server-side usando `createServerClient`:
   - `getGames(): Promise<Game[]>` — todos los juegos.
   - `getGameById(id: string): Promise<Game | null>` — juego por id.
   - `getGamesByCategory(cat: string): Promise<Game[]>` — juegos por categoría.

3. **Crear `lib/supabase/scores.ts`:** funciones para scores:
   - `getScoresByGame(gameId: string, limit?: number): Promise<Score[]>` — top scores por juego.
   - `getGlobalRanking(limit?: number)` — ranking global (best por juego sumado).
   - `getRecentScores(limit?: number)` — scores más recientes (para actividad en home).
   - `submitScore(gameId: string, playerName: string, score: number): Promise<Score>` — client-side, usa `createBrowserClient`.

4. **Crear `lib/supabase/types.ts`:** interfaces `Game` y `Score` compartidas. Mover interfaz `Game` desde `lib/data.ts`.

5. **Actualizar `lib/data.ts`:** eliminar array `GAMES`, `seededScores()`, `getGameById()` y `PLAYERS`. Mantener `CATS` hardcodeado y `ScoreRow` (deprecar en favor de `Score`). Si algún componente client-side necesita la lista de categorías, se mantiene aquí.

6. **Actualizar `app/library/page.tsx`:** fetch juegos desde Supabase en vez de importar `GAMES`. Convertir a Server Component si es posible, o usar client-side fetch.

7. **Actualizar `app/game/[id]/page.tsx`:** fetch juego por id desde Supabase en vez de `getGameById` local.

8. **Actualizar `app/hall/page.tsx`:** reemplazar `seededScores()` con datos reales de Supabase. Fetch top scores por juego. Mantener estructura visual (podium + tabla).

9. **Actualizar `app/games/page.tsx` (home):** reemplazar `RECENT_SCORES` y `TOP_PLAYERS` hardcodeados con datos reales de Supabase. `GAMES.slice(0, 6)` con query real.

10. **Actualizar componentes que importan desde `lib/data.ts`:** `components/game-card.tsx`, `components/mini-card.tsx`, `app/game/[id]/play/page.tsx` — asegurar que reciben `Game` como prop en vez de importar el array directamente.

11. **Implementar submit de score en Asteroids:** al llegar a game over en `lib/games/asteroids.ts`, exponer callback `onGameOver(score: number)`. En `components/games/asteroids.tsx`, conectar callback para enviar score a Supabase si hay usuario autenticado (localStorage auth).

12. **Verificar** que `npm run dev` funciona, navegación completa sin errores, leaderboard muestra datos reales, submit de score funciona con usuario logueado.

## Acceptance criteria

- [ ] Tabla `games` existe en Supabase con los 8 juegos actuales.
- [ ] Tabla `scores` existe en Supabase con índices y FK a `games`.
- [ ] Seed data incluye juegos y scores de ejemplo.
- [ ] `/library` muestra juegos desde Supabase, no desde array hardcodeado.
- [ ] `/game/asteroids` carga datos del juego desde Supabase.
- [ ] `/game/id-inexistente` sigue mostrando not found.
- [ ] `/hall` muestra scores reales de Supabase con tabs por juego.
- [ ] Podium en `/hall` refleja top 3 real del juego seleccionado.
- [ ] Home page muestra últimas puntuaciones reales.
- [ ] Home page muestra top jugadores global (suma de best score por juego).
- [ ] Al terminar partida de Asteroids con usuario logueado, score se guarda en Supabase.
- [ ] Score submitido aparece en `/hall` al recargar.
- [ ] Sin usuario logueado, score no se intenta enviar (sin error).
- [ ] `lib/data.ts` ya no contiene `GAMES` ni `seededScores()`.
- [ ] `CATS` se mantiene en `lib/data.ts`.
- [ ] `npm run dev` sin errores en consola.
- [ ] No hay errores de TypeScript.

## Decisions

- **Yes:** Un solo spec para games + scores. Están acoplados (scores referencia games). Migrar uno sin el otro deja estado inconsistente.
- **No:** Dos specs separados. Más granular pero innecesario — la tabla de scores sin la de games no tiene sentido.
- **Yes:** Auth localStorage para submit de scores. Es lo que existe. Cuando llegue Supabase Auth real, se migra el flujo.
- **No:** Bloquear submit hasta tener Supabase Auth. Demoraría la funcionalidad sin beneficio inmediato.
- **Yes:** Sin RLS por ahora. Simplifica implementación. Se agrega con Supabase Auth en spec futuro.
- **No:** RLS básico. Sin auth real de Supabase, no hay user_id confiable para policies.
- **Yes:** Ranking global = suma de best score por juego por jugador. Incentiva jugar todos los juegos, no solo farmear uno.
- **No:** Suma total de todos los scores. Premia volumen, no habilidad.
- **No:** Promedio de best scores. Castiga a quienes solo juegan un juego.
- **Yes:** `id text` como PK de `games` (slug legible). Consistente con rutas `/game/[id]` y datos actuales.
- **No:** UUID como PK de `games`. Requeriría mapeo slug-UUID innecesario.
- **Yes:** `player_name text` en scores (no FK a tabla de users). No hay tabla de usuarios en Supabase todavía.
- **No:** FK a tabla users. No existe aún. Se refactoriza cuando llegue Supabase Auth.
- **Yes:** Seed de scores de ejemplo. Leaderboard vacío se ve roto. Datos seed dan buena impresión inicial.
- **Yes:** Categorías hardcodeadas. Solo 4 valores fijos. No justifica tabla ni query.
- **Yes:** Submit solo en Asteroids. Es el único juego jugable real. Los demás se conectan en su propio spec.
- **No:** Implementar submit genérico para todos los juegos. Los demás no tienen lógica de juego implementada.

## Risks

| Risk                                                     | Mitigation                                                                                                                                |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Scores fraudulentos (submit manual vía API con anon key) | Aceptado por ahora. Anti-cheat y RLS van en spec futuro con auth real.                                                                    |
| Supabase down o lento degrada toda la plataforma         | Fallback: si query falla, mostrar mensaje "Leaderboard no disponible" en vez de romper la página. Juegos siguen funcionando sin conexión. |
| Migration SQL falla o seed duplica datos                 | Migrations son idempotentes. Seed usa `INSERT ... ON CONFLICT DO NOTHING`.                                                                |
| `player_name` inconsistente (mayúsculas, espacios)       | Normalizar a uppercase y trim al hacer submit. Consistente con estética del proyecto.                                                     |
| Latencia en queries complejas (ranking global)           | Top 10 con límite. Índices en score y player_name. Si crece, se agrega vista materializada.                                               |

## What is **not** in this spec

- Supabase Auth real (email, OAuth, magic link).
- Row Level Security.
- Realtime subscriptions para scores en vivo.
- Panel admin para gestionar juegos o moderar scores.
- Anti-cheat o validación de scores server-side.
- Submit de scores para juegos que no sean Asteroids.
- Supabase Storage para covers.

Each one of those, if it lands, goes in its own spec.
