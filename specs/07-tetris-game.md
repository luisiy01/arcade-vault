# SPEC 07 — Tetris: integración en Arcade Vault

> **Status:** Implementado
> **Depends on:** SPEC 04, SPEC 05, SPEC 06
> **Date:** 2026-10-18
> **Objective:** Integrar Tetris como segundo juego jugable en la plataforma, adaptando la referencia `03-tetris/game.js` al patrón establecido por Asteroids (SPEC 05) con submit de scores a Supabase (SPEC 06).

## Scope

**In:**

- Módulo de lógica `lib/games/tetris.ts` adaptado de `references/resources/started-games/03-tetris/game.js`.
- Componente React wrapper `components/games/tetris.tsx` con `useRef`/`useEffect`, `useAuth()` y `submitScore()`.
- Registro en `components/game-loader.tsx` con dynamic import y entrada en `GAME_MAP`.
- INSERT del registro de Tetris en tabla `games` de Supabase.
- Cover CSS-only en `app/globals.css` (clase `.cover-tetris`).
- Leyenda de controles específica de Tetris en la página de juego.
- Canvas de 300×600 (10 columnas × 20 filas × 30px por bloque).
- 8 piezas: 7 estándar (I, O, T, S, Z, J, L) + 1 especial "tuerca" (N).
- Ghost piece (pieza fantasma proyectada).
- Preview de pieza siguiente en HUD.
- Score submit a Supabase al game over vía callback `onGameOver`.

**Out of scope (para futuros specs):**

- Sonido y efectos de audio.
- Controles táctiles / botones virtuales para mobile.
- Canvas responsive (escalado al viewport).
- Hold piece (guardar pieza).
- Bag randomizer (7-bag system). Se mantiene random puro de la referencia.
- Animación de líneas al limpiar.
- Tema claro/oscuro propio del juego (usa tema de la plataforma).

## Data model

No se introducen nuevas estructuras de datos. Se reutiliza `Game` y `Score` de `lib/supabase/types.ts` (SPEC 06).

### Estado interno del juego (encapsulado en closure)

```ts
// Constantes
const COLS = 10;
const ROWS = 20;
const BLOCK = 30; // px

// Pieza
interface TetrisPiece {
  type: number; // 1-8 (índice de color y forma)
  shape: number[][]; // matriz 2D rotable
  x: number; // columna
  y: number; // fila
}

// Estado mutable (dentro de closure, no exportado)
// board: number[][] — ROWS×COLS, 0=vacío, 1-8=color
// current: TetrisPiece
// next: TetrisPiece
// score, lines, level: number
// dropInterval: number — ms entre caídas automáticas
// paused, gameOver: boolean
```

### Scoring

- Líneas completadas: `[0, 100, 300, 500, 800][líneas] × nivel`.
- Hard drop: +2 puntos por celda recorrida.
- Soft drop: +1 punto por fila.
- Nivel: `floor(líneas / 10) + 1`.
- Velocidad: `max(100, 1000 − (nivel − 1) × 90)` ms.

### Registro Supabase

```sql
INSERT INTO games (id, title, short, long, cat, cover, color, best, plays)
VALUES (
  'tetris',
  'TETRIS',
  'Apila bloques, completa líneas y sobrevive la gravedad.',
  'El clásico juego de puzzles donde debes rotar y colocar piezas que caen para completar líneas horizontales. Cada línea completada suma puntos multiplicados por tu nivel. La velocidad aumenta con cada nivel — ¿cuántas líneas puedes limpiar?',
  'ARCADE',
  'cover-tetris',
  'cyan',
  0,
  '0'
);
```

## Implementation plan

1. **Crear `lib/games/tetris.ts`:** adaptar `game.js` de referencia como módulo TypeScript.
   - Exportar `startTetris(canvas: HTMLCanvasElement, options?: TetrisOptions): () => void`.
   - `TetrisOptions` incluye `onGameOver?: (score: number) => void`.
   - Recibir canvas como parámetro, no usar `document.getElementById`.
   - Encapsular todo estado en closure (board, current, next, score, lines, level, flags).
   - Listeners de teclado en `window` con cleanup.
   - Retornar cleanup function que cancela `requestAnimationFrame` y remueve listeners.
   - El canvas del juego es 300×600. No incluir canvas de "next piece" — dibujar preview de pieza siguiente dentro del mismo canvas principal o como overlay.
   - Eliminar lógica de tema claro/oscuro, botón restart, y referencias DOM del HTML original.
   - Punto de integración `onGameOver`: en `endGame()`, llamar `options.onGameOver?.(score)` con el score final.

2. **Crear `components/games/tetris.tsx`:** Client Component.
   - `useRef<HTMLCanvasElement>` + `useEffect` llamando `startTetris(canvas, { onGameOver })`.
   - `useAuth()` para contexto de usuario.
   - En `onGameOver`: si hay usuario logueado, llamar `submitScore('tetris', playerName, score)`.
   - Canvas con `width={300} height={600}`, `tabIndex={0}`, `autoFocus`.
   - Cleanup en return de `useEffect`.

3. **Registrar en `components/game-loader.tsx`:**
   - Agregar dynamic import: `const TetrisGame = dynamic(() => import('@/components/games/tetris').then(m => m.TetrisGame), { ssr: false })`.
   - Agregar entrada en `GAME_MAP`: `'tetris': TetrisGame`.

4. **Crear cover CSS en `app/globals.css`:** clase `.cover-tetris` con gradientes CSS que representen bloques de Tetris apilados. Seguir patrón de `.cover-asteroids` (background + `::after` + `::before`).

5. **Insertar registro en Supabase:** ejecutar INSERT en tabla `games` con datos de Tetris (id, title, short, long, cat, cover, color, best, plays).

6. **Actualizar leyenda de controles:** en `app/game/[id]/play/page.tsx` (o donde se renderice la leyenda), agregar controles de Tetris: "← → MOVER · ↑ ROTAR · ↓ BAJAR · ESPACIO CAÍDA · P PAUSA".

7. **Verificar:** `npm run dev`, navegación a `/game/tetris`, gameplay completo, score submit, aparición en `/hall`.

## Acceptance criteria

- [x ] `/game/tetris` carga y muestra el juego.
- [ x] Juego renderiza en canvas de 300×600.
- [ x] Controles funcionan: ← → mover, ↑ rotar, ↓ bajar, Espacio caída rápida, P pausa.
- [ x] 8 piezas aparecen (7 estándar + tuerca N).
- [ x] Ghost piece visible debajo de la pieza actual.
- [ x] Preview de pieza siguiente visible durante el juego.
- [ x] Score se muestra en HUD durante gameplay.
- [ x] Líneas completadas se limpian y suman puntos según fórmula (líneas × nivel).
- [ x] Nivel sube cada 10 líneas y velocidad aumenta.
- [ x] Game over se dispara cuando nueva pieza colisiona inmediatamente al spawn.
- [ x] Game over muestra puntaje final.
- [ x] Con usuario logueado, score se envía a Supabase al game over.
- [ x] Sin usuario logueado, score no se intenta enviar (sin error).
- [ x] Score submitido aparece en `/hall` al recargar.
- [ x] `/game/tetris` (página detalle) muestra datos del juego desde Supabase.
- [ x] GameLoader muestra el juego (no "EN DESARROLLO").
- [ x] Cover CSS se muestra correctamente en library y página de detalle.
- [ x] Aviso mobile se muestra en pantallas pequeñas.
- [ x] Leyenda de controles específica de Tetris visible en página de juego.
- [ x] `npm run dev` sin errores en consola.
- [ x] No hay errores de TypeScript.
- [ x] Navegar fuera del juego detiene game loop y limpia listeners.

## Decisions

- **Yes:** Mantener las 8 piezas (7 estándar + tuerca). Diferencia del Tetris clásico y ya está implementado en la referencia.
- **No:** Solo 7 piezas estándar. Pierde el toque único de la referencia sin beneficio.
- **Yes:** Canvas 300×600 (30px blocks). Dimensiones originales de la referencia, Tetris funciona bien en formato vertical estrecho.
- **No:** Canvas más grande (360×720). Sin necesidad, 300×600 es legible.
- **Yes:** Categoría ARCADE. Decisión del usuario.
- **No:** Categoría PUZZLE. Tetris puede ser ambos, usuario eligió ARCADE para consistencia con el tono de la plataforma.
- **Yes:** Color cyan. Icónico de Tetris (pieza I), no colisiona con color de Asteroids.
- **Yes:** Preview de next piece integrado en el canvas o como overlay, no como canvas separado. Simplifica la integración React (un solo canvas ref).
- **No:** Segundo canvas para next piece. Más complejidad en el wrapper React sin beneficio funcional suficiente.
- **Yes:** Random puro para piezas (como la referencia). Simplicidad. Bag randomizer es mejora de gameplay que puede ir en spec futuro.
- **No:** Implementar 7-bag system. Cambio de mecánica que excede scope de integración.
- **Yes:** Eliminar toggle de tema. La plataforma ya tiene su estética retro/neón. El juego hereda los CSS variables del proyecto.
- **Yes:** Seguir patrón exacto de SPEC 05 para adapter (startFunction + cleanup + useRef/useEffect). Consistencia entre juegos.

## Risks

| Risk                                                                 | Mitigation                                                                                                      |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Event listeners de teclado interfieren con navegación Next.js        | Listeners en window con cleanup en useEffect return. `e.preventDefault()` solo para teclas del juego.           |
| Memory leak por requestAnimationFrame sin cancelar                   | Cleanup guarda id de RAF y llama `cancelAnimationFrame`. Patrón probado en Asteroids.                           |
| Canvas 300×600 se ve pequeño comparado con Asteroids 800×600         | Centrar canvas con padding adecuado. El formato vertical de Tetris es intencionalmente estrecho.                |
| Pieza tuerca (N) dificulta gameplay por ser 3×3 llena con hueco      | Mantener tal como está en la referencia. Si genera quejas, se puede remover en iteración futura.                |
| `dropInterval` baja hasta 100ms en niveles altos — posible input lag | Valor probado en la referencia. RAF a 60fps es suficiente para 100ms ticks.                                     |
| Colores de piezas no contrastan con tema oscuro de la plataforma     | Los colores de la referencia (#4dd0e1, #ffd54f, etc.) son brillantes sobre fondo oscuro. Verificar visualmente. |

## What is **not** in this spec

- Sonido y efectos de audio.
- Controles táctiles / botones virtuales para mobile.
- Canvas responsive (escalado al viewport).
- Hold piece.
- Bag randomizer (7-bag system).
- Animación de líneas al limpiar.
- Tema claro/oscuro propio del juego.

Each one of those, if it lands, goes in its own spec.
