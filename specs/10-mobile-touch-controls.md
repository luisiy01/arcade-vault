# SPEC 10 — Soporte mobile: controles táctiles y canvas responsive

> **Status:** Implementado
> **Depends on:** SPEC 05, SPEC 07, SPEC 08, SPEC 09
> **Date:** 2026-10-26
> **Objective:** Hacer que los 4 juegos existentes (Asteroids, Tetris, Arkanoid, Snake) sean jugables en dispositivos móviles con pantalla táctil, mediante un gamepad virtual que despacha eventos de teclado sintéticos y un canvas que escala al viewport.

## Por qué este spec existe

Todos los juegos de Arcade Vault usan input de teclado exclusivamente. En pantallas menores a 799px el juego se oculta completamente y se muestra el mensaje "TECLADO REQUERIDO". Esto excluye a cualquier usuario en móvil o tablet. Múltiples specs anteriores (05, 07, 08, 09) listaron "controles táctiles" como fuera de alcance, señalando que merecía su propio spec. Este es ese spec.

## Scope

**In:**

- Componente React `TouchGamepad` (`components/touch-gamepad.tsx`) con D-pad y botones de acción.
- Despacho de `KeyboardEvent` sintéticos desde el gamepad hacia `window` (mismo canal que usan los motores).
- Configuración de mapping de botones por juego (qué tecla despacha cada botón del gamepad).
- Canvas responsive: remover ocultamiento del CRT en pantallas < 799px, escalar al viewport manteniendo aspect ratio.
- Layout mobile en `PlayScreen`: HUD compacto → canvas escalado → gamepad virtual debajo.
- Botones de utilidad mobile (pausa, salir) accesibles sin teclado.
- Estilos CSS del gamepad con estética retro arcade consistente con el design system.
- `touch-action: none` en botones del gamepad para prevenir scroll accidental.
- Soporte multi-touch para presionar D-pad + botón de acción simultáneamente.

**Out of scope (para futuros specs):**

- Cambios en motores de juego (`lib/games/*.ts`) — no se modifican.
- Cambios en componentes de juego (`components/games/*.tsx`) — no se modifican.
- Gestos de swipe como alternativa al D-pad.
- Vibración / haptic feedback.
- Forzar orientación landscape.
- Soporte de gamepad físico (Bluetooth/USB).
- Rediseño del HUD para mostrar score en tiempo real desde el motor.

## Data model

No se introducen nuevas estructuras de datos persistentes. Se reutilizan `Game` y `Score` de `lib/supabase/types.ts`.

### Configuración de mapping (constante en `touch-gamepad.tsx`)

```ts
interface GamepadMapping {
  dpad: {
    up: { code: string; key: string };
    down: { code: string; key: string };
    left: { code: string; key: string };
    right: { code: string; key: string };
  };
  a?: { code: string; key: string; label: string };
  b?: { code: string; key: string; label: string };
}

const GAMEPAD_MAPPINGS: Record<string, GamepadMapping> = {
  asteroids: {
    dpad: {
      up: { code: 'ArrowUp', key: 'ArrowUp' },
      down: { code: 'ArrowDown', key: 'ArrowDown' },
      left: { code: 'ArrowLeft', key: 'ArrowLeft' },
      right: { code: 'ArrowRight', key: 'ArrowRight' },
    },
    a: { code: 'Space', key: ' ', label: 'FIRE' },
  },
  tetris: {
    dpad: {
      up: { code: 'ArrowUp', key: 'ArrowUp' },
      down: { code: 'ArrowDown', key: 'ArrowDown' },
      left: { code: 'ArrowLeft', key: 'ArrowLeft' },
      right: { code: 'ArrowRight', key: 'ArrowRight' },
    },
    a: { code: 'Space', key: ' ', label: 'DROP' },
  },
  arkanoid: {
    dpad: {
      up: { code: 'ArrowUp', key: 'ArrowUp' },
      down: { code: 'ArrowDown', key: 'ArrowDown' },
      left: { code: 'ArrowLeft', key: 'ArrowLeft' },
      right: { code: 'ArrowRight', key: 'ArrowRight' },
    },
  },
  snake: {
    dpad: {
      up: { code: 'ArrowUp', key: 'ArrowUp' },
      down: { code: 'ArrowDown', key: 'ArrowDown' },
      left: { code: 'ArrowLeft', key: 'ArrowLeft' },
      right: { code: 'ArrowRight', key: 'ArrowRight' },
    },
  },
};
```

### Mecanismo de despacho

```ts
// touchstart en botón del gamepad:
window.dispatchEvent(new KeyboardEvent('keydown', { code, key, bubbles: true }));

// touchend en botón del gamepad:
window.dispatchEvent(new KeyboardEvent('keyup', { code, key, bubbles: true }));
```

Esto aprovecha que los 4 motores ya escuchan `keydown`/`keyup` en `window`. Los juegos con input continuo (Asteroids thrust, Arkanoid paddle) ven la tecla como "held" mientras el dedo está presionado. Los juegos con input discreto (Tetris move, Snake dirección) responden al `keydown`.

## Implementation plan

1. **Crear `components/touch-gamepad.tsx`:** Client Component.
   - Props: `gameId: string`.
   - Leer mapping de `GAMEPAD_MAPPINGS[gameId]`.
   - Renderizar D-pad (4 botones direccionales) a la izquierda.
   - Renderizar botones A (y B si existe en mapping) a la derecha.
   - Cada botón: `onTouchStart` despacha `keydown`, `onTouchEnd` despacha `keyup`.
   - `touch-action: none` en cada botón para prevenir scroll.
   - `e.preventDefault()` en touch events para evitar comportamiento por defecto.
   - Botón de pausa integrado (despacha `KeyP` o `Escape`).
   - Si `GAMEPAD_MAPPINGS[gameId]` no tiene `a`, no renderizar botón A. Ídem para B.
   - Estilos inline mínimos; clases CSS para layout y apariencia.

2. **Modificar `components/play-screen.tsx`:**
   - Importar `TouchGamepad`.
   - Renderizar `<TouchGamepad gameId={game.id} />` después del CRT container.
   - El gamepad solo se muestra en mobile vía CSS (`display: none` en desktop, `display: flex` en mobile).
   - Remover o reemplazar el `div.game-mobile-warning` actual. En su lugar, el juego se muestra con gamepad.
   - Agregar botón "SALIR" visible en mobile que navega a `/game/{id}`.

3. **Modificar `app/globals.css` — Canvas responsive:**
   - Remover `display: none` del `.crt` en `@media (max-width: 799px)`.
   - Agregar reglas para que el CRT escale al ancho del viewport en mobile: `width: 100%; max-width: 100%;`.
   - Mantener `aspect-ratio: 4/3` del `.crt-screen` para que el canvas escale proporcionalmente.
   - El canvas dentro del CRT ya usa `width: 100%; height: 100%` con `position: absolute` — esto escala automáticamente.
   - Ajustar padding/margin del `.av-player` en mobile para maximizar espacio para canvas y gamepad.

4. **Modificar `app/globals.css` — Estilos del gamepad:**
   - Clase `.touch-gamepad`: `display: none` por defecto, `display: flex` en `@media (max-width: 799px)`.
   - Layout: flexbox, D-pad a la izquierda, botones acción a la derecha, `justify-content: space-between`.
   - D-pad: grid 3×3, botones en posiciones cardinales. Flechas como contenido.
   - Botones acción: circulares, con label (FIRE, DROP, etc.).
   - Colores: usar variables CSS del design system (`--cyan`, `--magenta`, `--yellow`).
   - Bordes neón, fondo semi-transparente oscuro.
   - Tamaño mínimo de botones: 48px × 48px (accesibilidad táctil).
   - `user-select: none` y `-webkit-user-select: none` en todo el gamepad.
   - `touch-action: manipulation` en el container del gamepad.

5. **Modificar `app/globals.css` — Media query mobile actualizada:**
   - En `@media (max-width: 799px)`: ya no ocultar `.crt`. Ocultar `.game-controls-legend` (leyenda de teclado no aplica en mobile).
   - Reemplazar `.game-mobile-warning` con `.touch-gamepad` visible.
   - HUD compacto: reducir font-size y padding del `.player-hud` en mobile.
   - Ocultar skin selector en mobile si no cabe (o moverlo a un menú).

6. **Verificar en device/emulador:**
   - Abrir cada juego en viewport de 390px de ancho (iPhone estándar).
   - Canvas visible y escalado correctamente.
   - Gamepad visible debajo del canvas.
   - D-pad controla dirección en todos los juegos.
   - Botón A funciona en Asteroids (disparo) y Tetris (hard drop).
   - Multi-touch: mover + disparar simultáneamente en Asteroids.
   - No hay scroll accidental al usar gamepad.
   - Pausa funciona desde gamepad.
   - Salir funciona desde botón mobile.
   - En desktop (> 799px): gamepad no visible, juego funciona normal con teclado.
   - `npm run dev` sin errores.

## Acceptance criteria

- [ ] En viewport < 799px, el canvas del juego es visible (no oculto).
- [ ] Canvas escala al ancho del viewport manteniendo aspect ratio 4:3.
- [ ] Gamepad virtual aparece debajo del canvas en mobile.
- [ ] Gamepad no aparece en desktop (> 799px).
- [ ] D-pad tiene 4 botones direccionales funcionales.
- [ ] Botón A aparece para Asteroids (label "FIRE") y Tetris (label "DROP").
- [ ] Botón A no aparece para Arkanoid y Snake.
- [ ] Presionar botón del D-pad despacha `keydown` correspondiente.
- [ ] Soltar botón del D-pad despacha `keyup` correspondiente.
- [ ] Asteroids: D-pad izq/der rota, D-pad arriba acelera, A dispara.
- [ ] Tetris: D-pad izq/der mueve, D-pad abajo soft drop, D-pad arriba rota, A hard drop.
- [ ] Arkanoid: D-pad izq/der mueve paleta.
- [ ] Snake: D-pad controla las 4 direcciones.
- [ ] Multi-touch funciona: mover y disparar simultáneamente en Asteroids.
- [ ] No hay scroll accidental al usar el gamepad.
- [ ] Botón de pausa funciona en mobile para todos los juegos.
- [ ] Botón de salir navega a `/game/{id}`.
- [ ] Botones del gamepad tienen tamaño mínimo 48×48px.
- [ ] Estilo del gamepad es consistente con design system retro arcade.
- [ ] Mensaje "TECLADO REQUERIDO" ya no aparece (reemplazado por gamepad).
- [ ] Leyenda de controles de teclado se oculta en mobile.
- [ ] HUD visible y legible en mobile.
- [ ] `npm run dev` sin errores en consola.
- [ ] No hay errores de TypeScript.
- [ ] Ningún archivo en `lib/games/` fue modificado.
- [ ] Ningún archivo en `components/games/` fue modificado.

## Decisions

- **Yes:** KeyboardEvent sintéticos desde gamepad. Los 4 motores ya escuchan `keydown`/`keyup` en `window`. Despachar eventos sintéticos evita modificar cualquier motor de juego. Cero cambios en `lib/games/*.ts`.
- **No:** Capa de abstracción de input en los motores. Requeriría refactorizar los 4 motores para usar un sistema de input abstracto en lugar de `addEventListener`. Más trabajo, más riesgo, mismo resultado.
- **No:** Touch directo en canvas (swipe/tap). Problemático para juegos con input continuo (Asteroids thrust requiere "held", no gestos). El gamepad virtual resuelve todos los tipos de input uniformemente.
- **Yes:** D-pad + botones A/B como modelo de gamepad. Estándar de consolas retro (NES/Game Boy), familiar para el público objetivo, cubre todos los patrones de input de los 4 juegos.
- **Yes:** Mapping configurable por juego. Cada juego usa las teclas de forma distinta. Asteroids necesita A=FIRE, Tetris necesita A=DROP, Arkanoid y Snake no necesitan botones de acción. El mapping es una constante, no runtime.
- **No:** Gamepad superpuesto (overlay) sobre el canvas. Oculta parte del juego. Debajo del canvas es más limpio y no interfiere con la visibilidad del gameplay.
- **Yes:** CSS media query para visibilidad del gamepad (`max-width: 799px`). Predecible. Sin detección JS de touch capabilities que puede fallar en tablets con teclado.
- **No:** Detección JS de `ontouchstart`. Tablets con teclado conectado mostrarían gamepad innecesario. Media query es más predecible para el caso de uso principal (móviles).
- **Yes:** `touch-action: none` en botones del gamepad. Previene scroll, zoom y gestos del browser al interactuar con los controles.
- **Yes:** Tamaño mínimo 48×48px para botones. Lineamiento de accesibilidad táctil (WCAG, Material Design).
- **Yes:** Botón de pausa integrado en gamepad. Sin teclado, el usuario no tiene forma de pausar. Esencial para UX mobile.
- **No:** Forzar orientación landscape. Invasivo, no todos los browsers lo soportan consistentemente. El layout vertical con canvas arriba y gamepad abajo funciona en portrait.

## Risks

| Risk                                                       | Mitigation                                                                                                                                                             |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `KeyboardEvent` sintético no tiene `isTrusted: true`       | Los motores leen `e.code`/`e.key`, no `e.isTrusted`. Verificado: ningún motor chequea `isTrusted`.                                                                     |
| `e.preventDefault()` en motores bloquea evento sintético   | Los motores llaman `preventDefault` solo después de leer el evento. El evento sintético ya fue procesado por el listener. No hay conflicto.                            |
| Multi-touch no funciona en todos los browsers              | `touchstart`/`touchend` manejan multi-touch nativamente via `changedTouches`. Cada dedo dispara su propio evento.                                                      |
| Gamepad tapa contenido en pantallas muy pequeñas (< 360px) | El canvas escala proporcionalmente. En pantallas extremadamente pequeñas, el gamepad usa tamaño mínimo y el canvas se comprime. Aceptable — estas pantallas son raras. |
| Scroll accidental al usar D-pad                            | `touch-action: none` + `e.preventDefault()` en handlers del gamepad previene scroll.                                                                                   |
| Canvas borroso al escalar con CSS                          | El canvas mantiene su buffer nativo (800×600). CSS escala con `image-rendering: pixelated` o `crisp-edges` para mantener estética pixel art.                           |
| Tetris tiene canvas 240×480 (aspect ratio diferente)       | El CRT de Tetris ya tiene manejo especial (`max-width: 420px`, `aspect-ratio: 1/1.05`). En mobile se adapta naturalmente al ser más angosto.                           |

## What is **not** in this spec

- Modificaciones a los motores de juego (`lib/games/*.ts`).
- Modificaciones a los componentes de juego (`components/games/*.tsx`).
- Gestos de swipe como input.
- Vibración / haptic feedback.
- Forzar orientación landscape.
- Soporte de gamepad físico (Bluetooth/USB).
- Rediseño del HUD con score en tiempo real.

Cada uno de esos, si se implementa, va en su propio spec.
