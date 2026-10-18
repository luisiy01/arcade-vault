# SPEC 08 — Arkanoid: integración en Arcade Vault

> **Status:** Implementado
> **Depends on:** SPEC 04, SPEC 05, SPEC 06
> **Date:** 2026-10-18
> **Objective:** Integrar Arkanoid como tercer juego jugable en la plataforma, adaptando la referencia `04-arkanoid/game.js` al patrón establecido por Asteroids (SPEC 05) con submit de scores a Supabase (SPEC 06).

## Scope

**In:**

- Módulo de lógica `lib/games/arkanoid.ts` adaptado de `references/resources/started-games/04-arkanoid/game.js`, `levels.js` y `spritesheet.js`.
- Componente React wrapper `components/games/arkanoid.tsx` con `useRef`/`useEffect`, `useAuth()` y `submitScore()`.
- Registro en `components/game-loader.tsx` con dynamic import y entrada en `GAME_MAP`.
- INSERT del registro de Arkanoid en tabla `games` de Supabase.
- Assets: copiar spritesheet (`spritesheet-breakout.png`) y sonidos (`ball-bounce.mp3`, `break-sound.mp3`) a `public/games/arkanoid/`.
- Cover asset en `public/covers/cover-arkanoid.svg` o CSS-only en `app/globals.css`.
- Leyenda de controles específica de Arkanoid en la página de juego.
- Canvas de 800×600.
- 5 niveles con patrones de bloques distintos y velocidad progresiva (1.0× a 1.46×).
- 3 vidas. Score +10 por bloque destruido.
- Sprites para paleta, pelota, bloques y explosiones desde spritesheet.
- Sonidos de rebote y destrucción de bloque.
- Score submit a Supabase al game over y al ganar (completar nivel 5) vía callback `onGameOver`.

**Out of scope (para futuros specs):**

- Controles táctiles / botones virtuales para mobile.
- Canvas responsive (escalado al viewport).
- Powerups (paleta ancha, multi-ball, laser, etc.).
- Niveles adicionales más allá de los 5 de la referencia.
- Editor de niveles.
- Control por mouse (solo teclado para consistencia con otros juegos de la plataforma).

## Data model

No se introducen nuevas estructuras de datos. Se reutiliza `Game` y `Score` de `lib/supabase/types.ts` (SPEC 06).

### Estado interno del juego (encapsulado en closure)

```ts
// Constantes
const PADDLE_SPEED = 400; // px/s
const BLOCK_COLS = 10;
const BLOCK_ROWS = 6;
const BLOCK_W = 64;
const BLOCK_H = 24;
const BASE_BALL_VX = 200;
const BASE_BALL_VY = -300;

interface ArkanoidBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string; // 'red' | 'yellow' | 'cyan' | 'magenta' | 'hotpink' | 'green' | 'gray'
  alive: boolean;
}

interface Explosion {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  elapsed: number;
}

// Estado mutable (dentro de closure, no exportado)
// paddle: { x, y, w: 81, h: 14 }
// ball: { x, y, w: 16, h: 16, vx, vy }
// blocks: ArkanoidBlock[]
// explosions: Explosion[]
// lives: number (inicia en 3)
// score: number
// currentLevel: number (1-5)
// gameState: 'playing' | 'paused' | 'gameover' | 'win'
```

### Scoring

- +10 puntos por bloque destruido.
- Score acumulativo entre niveles (no se resetea al avanzar de nivel).
- Game over: vidas llegan a 0.
- Win: completar nivel 5 (todos los bloques destruidos en el último nivel).

### Niveles

5 niveles definidos en closure (adaptados de `levels.js`):

| Nivel | Velocidad | Patrón                              |
| ----- | --------- | ----------------------------------- |
| 1     | 1.0×      | Grilla completa 10×6                |
| 2     | 1.1×      | Pirámide                            |
| 3     | 1.21×     | Tablero de ajedrez                  |
| 4     | 1.33×     | Grilla con huecos pseudo-aleatorios |
| 5     | 1.46×     | Marco + cruz central                |

### Registro Supabase

```sql
INSERT INTO games (id, title, short, long, cat, cover, color, best, plays)
VALUES (
  'arkanoid',
  'ARKANOID',
  'Destruye bloques con la pelota y sobrevive 5 niveles.',
  'El clásico rompebloques: controla la paleta para rebotar la pelota y destruir todos los bloques. Cada nivel trae nuevos patrones y mayor velocidad. 3 vidas, 5 niveles — ¿puedes completarlos todos?',
  'ARCADE',
  'cover-arkanoid',
  'magenta',
  0,
  '0'
);
```

## Implementation plan

1. **Copiar assets a `public/games/arkanoid/`:** `spritesheet-breakout.png`, `ball-bounce.mp3`, `break-sound.mp3`. Los assets se cargan desde esta ruta en el módulo del juego.

2. **Crear `lib/games/arkanoid.ts`:** adaptar `game.js`, `levels.js` y `spritesheet.js` como módulo TypeScript unificado.
   - Exportar `startArkanoid(canvas: HTMLCanvasElement, options?: ArkanoidOptions): () => void`.
   - `ArkanoidOptions` incluye `onGameOver?: (score: number) => void`.
   - Recibir canvas como parámetro, no usar `document.getElementById`.
   - Integrar lógica de `spritesheet.js` (carga de imagen, drawSprite, drawFrame, SPRITES, EXPLOSION_FRAMES) dentro del módulo.
   - Integrar definiciones de `levels.js` (LEVELS array) dentro del módulo.
   - Encapsular todo estado en closure (paddle, ball, blocks, explosions, lives, score, currentLevel, gameState).
   - Listeners de teclado en `window` con cleanup. Solo arrow keys para mover paleta, P/Escape para pausa.
   - Eliminar control por mouse (canvas.mousemove) — solo teclado.
   - Eliminar pause overlay con botones de salto de nivel — pausa simple.
   - Retornar cleanup function que cancela `requestAnimationFrame`, remueve listeners, y detiene audio.
   - Punto de integración `onGameOver`: llamar `options.onGameOver?.(score)` cuando `gameState` cambia a `'gameover'` o `'win'`.
   - Cargar spritesheet desde `/games/arkanoid/spritesheet-breakout.png`.
   - Cargar sonidos desde `/games/arkanoid/ball-bounce.mp3` y `/games/arkanoid/break-sound.mp3`.

3. **Crear `components/games/arkanoid.tsx`:** Client Component.
   - `useRef<HTMLCanvasElement>` + `useEffect` llamando `startArkanoid(canvas, { onGameOver })`.
   - `useAuth()` para contexto de usuario.
   - En `onGameOver`: si hay usuario logueado, llamar `submitScore('arkanoid', playerName, score)`.
   - Canvas con `width={800} height={600}`, `tabIndex={0}`, `autoFocus`.
   - Cleanup en return de `useEffect`.

4. **Registrar en `components/game-loader.tsx`:**
   - Agregar dynamic import: `const ArkanoidGame = dynamic(() => import('@/components/games/arkanoid').then(m => m.ArkanoidGame), { ssr: false })`.
   - Agregar entrada en `GAME_MAP`: `'arkanoid': ArkanoidGame`.

5. **Crear cover en `app/globals.css`:** clase `.cover-arkanoid` con gradientes CSS que representen bloques siendo destruidos por una pelota. Seguir patrón de `.cover-asteroids`.

6. **Insertar registro en Supabase:** ejecutar INSERT en tabla `games` con datos de Arkanoid.

7. **Actualizar leyenda de controles:** en la página de juego, agregar controles de Arkanoid: "← → MOVER PALETA · P PAUSA".

8. **Verificar:** `npm run dev`, navegación a `/game/arkanoid`, gameplay completo (5 niveles), sprites y sonidos, score submit, aparición en `/hall`.

## Acceptance criteria

- [ x] `/game/arkanoid` carga y muestra el juego.
- [ x] Juego renderiza en canvas de 800×600.
- [ x] Sprites del spritesheet se muestran correctamente (paleta, pelota, bloques, explosiones).
- [ x] Sonidos de rebote y destrucción de bloque se reproducen.
- [ x] Controles funcionan: ← → mover paleta, P/Escape pausar.
- [ x] 5 niveles cargan con patrones de bloques distintos.
- [ x] Velocidad de pelota aumenta con cada nivel.
- [ x] Score suma +10 por bloque y se acumula entre niveles.
- [ x] Score se muestra en HUD durante gameplay.
- [ x] Vidas se muestran en HUD (sprites de pelota).
- [ x] Perder pelota resta una vida y reposiciona pelota sobre paleta.
- [ x] Game over se dispara cuando vidas llegan a 0.
- [ x] Win se dispara al completar nivel 5.
- [ x] Game over y win muestran overlay con mensaje.
- [ x] Con usuario logueado, score se envía a Supabase al game over o win.
- [ x] Sin usuario logueado, score no se intenta enviar (sin error).
- [ x] Score submitido aparece en `/hall` al recargar.
- [ x] `/game/arkanoid` (página detalle) muestra datos del juego desde Supabase.
- [ x] GameLoader muestra el juego (no "EN DESARROLLO").
- [ x] Cover se muestra correctamente en library y página de detalle.
- [ x] Aviso mobile se muestra en pantallas pequeñas.
- [ x] Leyenda de controles específica de Arkanoid visible en página de juego.
- [ x] Explosiones animadas al destruir bloques.
- [ x] Navegar fuera del juego detiene game loop, limpia listeners y detiene audio.
- [ x] `npm run dev` sin errores en consola.
- [ x] No hay errores de TypeScript.

## Decisions

- **Yes:** Canvas 800×600. Mismo tamaño que Asteroids y referencia original. Consistencia en la plataforma.
- **No:** Canvas más pequeño (640×480). Sin beneficio, rompería consistencia visual con Asteroids.
- **Yes:** Portar spritesheet completo. Da identidad visual única al juego vs rectángulos planos.
- **Yes:** Portar sonidos. Feedback auditivo mejora experiencia. Assets ya existen, costo de integración bajo.
- **Yes:** Eliminar control por mouse. Consistencia con otros juegos de la plataforma que usan solo teclado. Simplifica listeners.
- **No:** Mantener mouse + teclado. Dos sistemas de input para un juego simple agrega complejidad en cleanup y puede interferir con scroll de página.
- **Yes:** Eliminar pause overlay con salto de nivel. Feature de debug, no de gameplay. Pausa simple (P/Escape) es suficiente.
- **No:** Mantener level skip. Rompe progresión de score y no tiene sentido en plataforma competitiva.
- **Yes:** Score submit en game over Y win. Ambos son fin de partida. Un jugador que completa los 5 niveles merece que su score se registre.
- **No:** Score submit solo en game over. Castigaría al mejor jugador (el que gana) sin registrar su puntaje.
- **Yes:** Categoría ARCADE. Consistente con Asteroids y Tetris. Tono de la plataforma.
- **Yes:** Color magenta. Libre (cyan=Tetris, no asignado=Asteroids), da variedad visual al catálogo.
- **Yes:** Assets en `public/games/arkanoid/`. Organización por juego, evita polucionar `public/` raíz.
- **Yes:** Unificar `game.js`, `levels.js` y `spritesheet.js` en un solo módulo TypeScript. Simplifica imports y encapsulación.
- **No:** Mantener archivos separados. Sin beneficio en contexto de módulo TypeScript con closure.

## Risks

| Risk                                                    | Mitigation                                                                                               |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Event listeners de teclado interfieren con navegación   | Listeners en window con cleanup en useEffect return. `e.preventDefault()` solo para teclas del juego.    |
| Memory leak por requestAnimationFrame sin cancelar      | Cleanup guarda id de RAF y llama `cancelAnimationFrame`. Patrón probado en Asteroids y Tetris.           |
| Spritesheet no carga (ruta incorrecta o asset missing)  | Verificar ruta en build. Fallback: si imagen no carga, renderizar rectángulos de color como degradación. |
| Audio bloqueado por políticas de autoplay del browser   | Audio se dispara solo tras interacción de usuario (keydown). Fallo silencioso si audio no puede sonar.   |
| Colisiones imprecisas con bloques a velocidad alta      | Un solo bloque por frame (como la referencia). A 1.46× la velocidad base, aún funciona con AABB.         |
| Pelota atraviesa paleta en frames largos (tab inactivo) | `dt` clamped a máximo razonable. RAF no corre en tab inactivo, se pausa naturalmente.                    |

## What is **not** in this spec

- Controles táctiles / botones virtuales para mobile.
- Canvas responsive (escalado al viewport).
- Powerups (paleta ancha, multi-ball, laser, sticky, etc.).
- Niveles adicionales más allá de los 5 de la referencia.
- Editor de niveles.
- Control por mouse.

Cada uno de esos, si se implementa, va en su propio spec.
