# SPEC 01 — MVP visual de todas las pantallas

> **Status:** Implementado
> **Depends on:** —
> **Date:** 2026-10-13
> **Objective:** Implementar todas las pantallas visuales de Arcade Vault como componentes Next.js App Router, sin lógica de juego ni manejo de estado.

## Scope

**In:**

- Navbar global con logo, links (Library, Hall of Fame), contador de créditos decorativo, botón auth decorativo y menú móvil.
- Fondo animado global (grid perspectiva, scanlines, ruido).
- Footer global con texto `© 2026 ARCADE VAULT`.
- Pantalla **Library** (`/`): hero con título, barra de búsqueda y filtro por categoría (client-side), grid de cards con cover CSS, tilt 3D en hover.
- Pantalla **Game Detail** (`/game/[id]`): cover ampliado, tags, descripción, estadísticas, leaderboard con scores mock, botones "Jugar" y "Volver".
- Pantalla **Player** (`/game/[id]/play`): HUD estático (jugador, puntuación, vidas, nivel con valores fijos), monitor CRT con arena decorativa y mensaje "juego en desarrollo", sin interacción.
- Pantalla **Auth** (`/auth`): card con tabs login/registro, campos de formulario, botones sociales. Solo visual, sin lógica de autenticación.
- Pantalla **Hall of Fame** (`/hall`): título, tabs por juego, podio top 3, tabla de rankings con scores mock.
- Archivo de datos mock (`lib/data.ts`) con GAMES, CATS, PLAYERS y función seededScores.
- Todas las animaciones CSS del template: flicker, pulse, fade-in, slide-in, rise, gridscroll, blink, bob, drift.

**Out of scope (para futuros specs):**

- Lógica de juegos (ningún juego jugable).
- Autenticación real (login, registro, sesión).
- Persistencia de estado (localStorage, Context, base de datos).
- Guardar puntuaciones.
- Simulación de puntuación en reproductor (auto-incremento, pausa, game over, modal de fin).
- Responsive avanzado más allá de lo que ya cubren las media queries del template.

## Data model

```ts
// lib/data.ts

interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: string;
  cover: string; // clase CSS para cover art (cover-bricks, cover-tetro, etc.)
  color: string; // cyan | magenta | yellow | green
  best: number;
  plays: string;
}

const GAMES: Game[] = [/* 8 juegos del template */];
const CATS: string[] = ['TODOS', 'ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS'];
const PLAYERS: string[] = [/* 18 nombres */];

function seededScores(seed: number, count?: number): ScoreRow[];
```

No se introduce persistencia. Todos los datos son constantes exportadas.

## Implementation plan

1. Crear `lib/data.ts` con tipos, array GAMES, CATS, PLAYERS y función seededScores portados del template JSX a TypeScript.
2. Crear componente `components/nav.tsx` (client component) con navbar, logo, links con `next/link`, contador decorativo, botón auth decorativo, menú móvil con estado local para open/close.
3. Actualizar `app/layout.tsx` para incluir fondo animado (`av-bg`, `av-noise`), Nav y footer dentro del body.
4. Crear `app/page.tsx` — pantalla Library con hero, búsqueda, filtros por categoría y grid de GameCards. Client component para estado local de búsqueda y filtro. Cards linkeadas a `/game/[id]`.
5. Crear `components/game-card.tsx` (client component) con tilt 3D en hover y link a detalle.
6. Crear `app/game/[id]/page.tsx` — pantalla Game Detail con cover, tags, stats, leaderboard mock, botones "Jugar" (`/game/[id]/play`) y "Volver" (`/`).
7. Crear `app/game/[id]/play/page.tsx` — pantalla Player con HUD estático (valores fijos) y CRT con arena decorativa + mensaje "EN DESARROLLO". Sin interacción de juego.
8. Crear `app/auth/page.tsx` — pantalla Auth con tabs login/registro, campos de formulario, botones sociales. Client component para toggle de tab. Sin lógica de submit.
9. Crear `app/hall/page.tsx` — pantalla Hall of Fame con tabs por juego, podio y tabla. Client component para selección de juego activo.

## Acceptance criteria

- [ ] `npm run dev` inicia sin errores en consola.
- [ ] `/` muestra hero, barra de búsqueda, chips de categoría y grid de 8 cards con covers CSS.
- [ ] Escribir en barra de búsqueda filtra cards por nombre.
- [ ] Clickear chip de categoría filtra cards por categoría.
- [ ] Card muestra tilt 3D al pasar mouse.
- [ ] Clickear card navega a `/game/[id]` con detalle completo.
- [ ] `/game/bloque-buster` muestra cover, tags, stats, leaderboard con 10 scores mock, botón "Jugar Ahora" y "Volver al Vault".
- [ ] Botón "Jugar Ahora" navega a `/game/bloque-buster/play`.
- [ ] `/game/bloque-buster/play` muestra HUD con valores estáticos y CRT con arena decorativa y mensaje de desarrollo.
- [ ] `/auth` muestra card con tabs login/registro, campos y botones sociales.
- [ ] Toggle entre tabs login/registro muestra/oculta campo de email con animación slide-in.
- [ ] `/hall` muestra podio con top 3 y tabla de rankings.
- [ ] Tabs de juego en Hall of Fame cambian scores mostrados.
- [ ] Navbar visible en todas las rutas con links funcionales.
- [ ] Fondo animado (grid perspectiva + scanlines + ruido) visible en todas las rutas.
- [ ] Footer visible en todas las rutas.
- [ ] Menú móvil se abre/cierra en viewport < 840px.
- [ ] No hay errores de TypeScript (`npx tsc --noEmit` pasa).

## Decisions

- **Yes:** Rutas en inglés (`/game`, `/hall`, `/auth`). Contenido visual en español pero URLs en inglés para consistencia técnica.
- **No:** Rutas en español. Evita problemas con caracteres especiales y sigue convención estándar.
- **Yes:** CRT estático con mensaje "en desarrollo" en pantalla Player. Muestra la UI completa sin simular juego.
- **No:** Simulación fake de puntuación. Añade complejidad innecesaria para MVP visual.
- **Yes:** Sin manejo de estado global. Cada componente usa solo estado local para UI (tabs, filtros, menú móvil).
- **No:** React Context ni localStorage. Se implementarán en spec separado.
- **Yes:** Mantener todas las clases CSS existentes en `globals.css`. No convertir a utilidades Tailwind.
- **No:** Reescribir estilos con Tailwind utilities. El CSS del template ya está portado y funciona.
- **Yes:** Datos mock en `lib/data.ts` como constantes exportadas.
- **No:** Fetch a API ni datos dinámicos. Solo visual.

## What is **not** in this spec

- Juegos jugables (cada juego irá en su propio spec).
- Autenticación y sesiones de usuario.
- Persistencia de datos (puntuaciones, preferencias).
- Estado global compartido entre pantallas.
- API routes.

Each one of those, if it lands, goes in its own spec.
