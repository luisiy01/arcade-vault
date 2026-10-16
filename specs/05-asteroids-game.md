# SPEC 05 — Primer juego jugable: Asteroids

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-10-16
> **Objective:** Integrar el juego de Asteroids (canvas vanilla JS) como primer juego jugable en la plataforma, con ruta dinámica genérica `/game/[id]` reutilizable para futuros juegos.

## Scope

**In:**

- Ruta dinámica `app/game/[id]/page.tsx` — layout genérico para juegos con header (botón volver, título del juego, leyenda de controles).
- Componente `components/games/asteroids.tsx` — Client Component que renderiza canvas y ejecuta lógica del juego vía `useRef`/`useEffect`.
- Módulo `lib/games/asteroids.ts` — lógica del juego adaptada de `references/resources/started-games/02-asteroids/game.js`. Exporta función `startAsteroid(canvas: HTMLCanvasElement): () => void` que inicia game loop y retorna cleanup.
- Actualizar `lib/data.ts`: cambiar id `rocas` a `asteroids` y ajustar metadata del juego si es necesario.
- Canvas fijo 800×600, centrado en la página.
- Aviso visible en pantallas táctiles/mobile indicando que el juego requiere teclado.
- Favicon del juego (`favicon.svg` de referencia) copiado a `public/covers/` para uso como cover del juego.
- Score se muestra solo en pantalla (HUD in-game y pantalla game over). Sin persistencia.

**Out of scope (para futuros specs):**

- Controles táctiles / botones virtuales para mobile.
- Persistencia de score (localStorage o Supabase).
- Leaderboard online para Asteroids.
- Sonido / efectos de audio.
- Canvas responsive (escalado al viewport).
- Integración de otros juegos en la ruta `/game/[id]` (cada juego va en su propio spec).

## Data model

No se introducen nuevas estructuras de datos. Se reutiliza la interfaz `Game` de `lib/data.ts` con el id cambiado de `rocas` a `asteroids`.

El juego internamente mantiene su estado existente (clases `Ship`, `Asteroid`, `Bullet`, `PowerUp`, `Particle` y globales `score`, `lives`, `level`, `state`) encapsulado dentro del módulo `lib/games/asteroids.ts`.

## Implementation plan

1. **Actualizar `lib/data.ts`:** cambiar `id: 'rocas'` a `id: 'asteroids'`. Revisar `title`, `short`, `long` y `cover` para que sean coherentes con el nombre.

2. **Crear `lib/games/asteroids.ts`:** adaptar `game.js` de referencia como módulo TypeScript. Cambios clave:
   - Recibir `canvas` como parámetro en vez de `document.getElementById`.
   - Encapsular todo estado en closure (no globales de ventana).
   - Mover listeners de `keydown`/`keyup` al canvas o a window con cleanup.
   - Exportar `function startAsteroids(canvas: HTMLCanvasElement): () => void` que retorna función de limpieza (cancela `requestAnimationFrame`, remueve event listeners).

3. **Crear `components/games/asteroids.tsx`:** Client Component con:
   - `useRef<HTMLCanvasElement>` para referencia al canvas.
   - `useEffect` que llama `startAsteroids(canvas)` y retorna cleanup.
   - Canvas con `width={800} height={600}`.
   - Foco automático para capturar input de teclado.

4. **Crear `app/game/[id]/page.tsx`:** ruta dinámica que:
   - Lee `id` de params.
   - Busca juego en `GAMES` via `getGameById(id)`.
   - Si no existe, muestra 404 / not found.
   - Renderiza header: botón "← VOLVER" (link a `/library`), título del juego, leyenda de controles ("FLECHAS: MOVER · ESPACIO: DISPARAR").
   - Carga componente del juego según id (por ahora solo `asteroids` con import dinámico o mapeo directo).
   - Aviso en mobile: detectar pantalla < 800px y mostrar mensaje "Este juego requiere teclado. Juega desde una computadora."

5. **Copiar `favicon.svg`** de referencia a `public/covers/cover-asteroids.svg` (o adaptar sistema de covers existente). Actualizar `cover` en data si es necesario.

6. **Agregar estilos** en `app/globals.css` para la página de juego: contenedor centrado, header del juego, aviso mobile. Mantener estética retro/neón del proyecto.

7. **Verificar** que `npm run dev` funciona, navegación desde biblioteca llega al juego, juego se ejecuta sin errores en consola, y cleanup funciona al navegar fuera.

## Acceptance criteria

- [ ] Ruta `/game/asteroids` carga y muestra el juego.
- [ ] Header visible con botón "VOLVER" que lleva a `/library`, título "ASTEROIDS" y leyenda de controles.
- [ ] Canvas de 800×600 centrado en la página.
- [ ] Nave se controla con flechas (izquierda, derecha, arriba) y dispara con espacio.
- [ ] Asteroides aparecen, se dividen al recibir impacto, y dan puntos.
- [ ] PowerUp (triple shot) aparece y funciona correctamente.
- [ ] HUD muestra score, nivel y vidas.
- [ ] Game over muestra puntaje final y permite reiniciar con espacio.
- [ ] Navegar fuera del juego (botón volver o browser back) detiene el game loop y limpia event listeners.
- [ ] En pantallas < 800px se muestra aviso de que requiere teclado.
- [ ] Ruta `/game/id-inexistente` muestra página de not found.
- [ ] `lib/data.ts` tiene id `asteroids` en vez de `rocas`.
- [ ] GameCard en biblioteca enlaza a `/game/asteroids` correctamente.
- [ ] `npm run dev` sin errores en consola.
- [ ] No hay errores de TypeScript.

## Decisions

- **Yes:** Ruta genérica `/game/[id]`. Primer juego establece patrón. Futuros juegos solo agregan componente + entrada en mapeo.
- **No:** Ruta específica `/game/asteroids`. Duplicaría estructura para cada juego nuevo.
- **Yes:** Adapter pattern (useRef/useEffect) para integrar game.js. Mínima reescritura, mantiene lógica del juego probada.
- **No:** Reescritura completa a React/TS idiomático. Más trabajo sin beneficio funcional para este spec.
- **No:** Iframe con HTML estático. Sin comunicación con plataforma, no permite score integration futura.
- **Yes:** Canvas fijo 800×600. Juego diseñado para esas dimensiones. Escalado responsive va en spec aparte si se necesita.
- **No:** Canvas responsive. Requiere recalcular posiciones/colisiones. Complejidad innecesaria ahora.
- **Yes:** Solo teclado, aviso en mobile. Controles táctiles son feature completa que merece spec propio.
- **No:** Botones virtuales mobile. Demasiado scope para este spec.
- **Yes:** Score solo en pantalla. Persistencia y leaderboard van con integración Supabase en otro spec.
- **No:** localStorage para scores. Inconsistente con integración Supabase planeada.
- **Yes:** Id `asteroids` en vez de `rocas`. Nombre reconocible internacionalmente, coherente con el juego.
- **Yes:** `startAsteroids()` retorna cleanup function. Patrón estándar React para efectos con recursos externos.

## Risks

| Risk                                                          | Mitigation                                                                                             |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Event listeners de teclado interfieren con navegación Next.js | Listeners en window con cleanup en useEffect return. `e.preventDefault()` solo para teclas del juego.  |
| Memory leak si cleanup no cancela requestAnimationFrame       | Cleanup guarda id de `requestAnimationFrame` y llama `cancelAnimationFrame`.                           |
| Focus del canvas se pierde al hacer click fuera               | `tabIndex={0}` en canvas + `autoFocus`. Instrucción visual "Click en el juego para activar controles". |

## What is **not** in this spec

- Controles táctiles para mobile.
- Persistencia de scores (localStorage ni Supabase).
- Leaderboard online.
- Sonido y efectos de audio.
- Canvas responsive/escalable.
- Integración de otros juegos (cada juego en su propio spec).

Each one of those, if it lands, goes in its own spec.
