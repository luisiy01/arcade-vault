# SPEC 09 — Snake: integración en Arcade Vault

> **Status:** Aprobado
> **Depends on:** SPEC 04, SPEC 05, SPEC 06
> **Date:** 2026-10-18
> **Objective:** Integrar Snake como cuarto juego jugable en la plataforma, creando la lógica desde cero con sprites de frutas del spritesheet provisto, siguiendo el patrón establecido por Asteroids (SPEC 05) con submit de scores a Supabase (SPEC 06).

## Scope

**In:**

- Módulo de lógica `lib/games/snake.ts` creado desde cero.
- Componente React wrapper `components/games/snake.tsx` con `useRef`/`useEffect`, `useAuth()` y `submitScore()`.
- Registro en `components/game-loader.tsx` con dynamic import y entrada en `GAME_MAP`.
- INSERT del registro de Snake en tabla `games` de Supabase.
- Assets: copiar `fruits.png` a `public/games/snake/fruits.png`.
- Cover asset en `app/globals.css` (clase `.cover-snake`).
- Leyenda de controles específica de Snake en la página de juego.
- Canvas de 800×600.
- Grilla lógica de 40×30 celdas (20px por celda en canvas de 800×600).
- Sprites de frutas del spritesheet (22 tipos), selección aleatoria al aparecer cada fruta.
- Score +10 por fruta consumida.
- Velocidad inicial: 8 movimientos/segundo. Incremento cada 5 frutas.
- Muerte al chocar con pared o con el propio cuerpo.
- Score submit a Supabase al game over vía callback `onGameOver`.

**Out of scope (para futuros specs):**

- Sonido y efectos de audio (no hay assets de audio disponibles).
- Controles táctiles / botones virtuales para mobile.
- Canvas responsive (escalado al viewport).
- Modos de juego extra (wrap-around, versus AI, niveles con obstáculos).
- Animaciones de partículas al comer fruta.

## Data model

No se introducen nuevas estructuras de datos. Se reutiliza `Game` y `Score` de `lib/supabase/types.ts` (SPEC 06).

### Atlas de sprites

El spritesheet `fruits.png` (3790×442px) contiene 22 frutas. Las coordenadas de recorte se definen como constante dentro del módulo:

```ts
interface FruitSprite {
  x: number;
  y: number;
  w: number;
  h: number;
}

const FRUITS: Record<string, FruitSprite> = {
  banana: { x: 34, y: 136, w: 110, h: 160 },
  orange: { x: 186, y: 136, w: 150, h: 160 },
  grape: { x: 378, y: 136, w: 110, h: 160 },
  // ... 22 entradas totales (ver sprites.js de referencia)
  melon: { x: 3637, y: 136, w: 130, h: 160 },
};

const FRUIT_KEYS = Object.keys(FRUITS);
```

### Estado interno del juego (encapsulado en closure)

```ts
// Constantes
const COLS = 40;
const ROWS = 30;
const CELL = 20; // px
const BASE_SPEED = 8; // movimientos por segundo
const SPEED_INCREMENT = 0.5; // por cada 5 frutas
const POINTS_PER_FRUIT = 10;

interface Point {
  x: number; // columna (0-39)
  y: number; // fila (0-29)
}

// Estado mutable (dentro de closure, no exportado)
// snake: Point[] — cabeza en índice 0
// direction: 'up' | 'down' | 'left' | 'right'
// nextDirection: 'up' | 'down' | 'left' | 'right' — buffer de input
// fruit: Point — posición de la fruta actual
// currentFruitKey: string — clave del sprite actual (aleatoria)
// score: number
// fruitsEaten: number — para calcular velocidad
// speed: number — movimientos por segundo actual
// gameState: 'playing' | 'paused' | 'gameover'
// lastMoveTime: number — timestamp del último movimiento
```

### Scoring

- +10 puntos por fruta consumida.
- Velocidad inicial: 8 mov/s. Cada 5 frutas: +0.5 mov/s.
- Game over: cabeza colisiona con pared o con segmento del cuerpo.

### Registro Supabase

```sql
INSERT INTO games (id, title, short, long, cat, cover, color, best, plays)
VALUES (
  'snake',
  'SNAKE',
  'Come frutas, crece y no choques contigo mismo.',
  'El clásico juego de la serpiente: guía la serpiente por el tablero recogiendo frutas para crecer y sumar puntos. Cada 5 frutas la velocidad aumenta. No choques con las paredes ni contigo mismo — ¿cuánto puedes crecer?',
  'ARCADE',
  'cover-snake',
  'green',
  0,
  '0'
);
```

## Implementation plan

1. **Copiar assets a `public/games/snake/`:** copiar `references/source-assets/snake-assets/snake-assets/fruits.png` a `public/games/snake/fruits.png`.

2. **Crear `lib/games/snake.ts`:** módulo TypeScript desde cero.
   - Exportar `startSnake(canvas: HTMLCanvasElement, options?: SnakeOptions): () => void`.
   - `SnakeOptions` incluye `onGameOver?: (score: number) => void`.
   - Recibir canvas como parámetro, no usar `document.getElementById`.
   - Definir atlas de sprites de frutas como constante (coordenadas de `sprites.js`).
   - Cargar imagen del spritesheet desde `/games/snake/fruits.png`.
   - Encapsular todo estado en closure (snake, direction, fruit, score, speed, gameState).
   - Grilla de 40×30 celdas, cada celda 20px.
   - Serpiente inicia en centro de la grilla con longitud 3, dirección derecha.
   - Fruta aparece en celda aleatoria libre (no ocupada por serpiente).
   - Cada fruta nueva selecciona sprite aleatorio del atlas.
   - Movimiento basado en tiempo: acumular deltaTime, mover cuando supere intervalo (1000/speed ms).
   - Input buffering: guardar dirección en `nextDirection`, aplicar al siguiente tick de movimiento. Prevenir reversa (no permitir izquierda si va a derecha).
   - Dibujar fondo como grilla sutil (dos tonos de verde oscuro, patrón tablero).
   - Dibujar serpiente como segmentos redondeados de color verde brillante. Cabeza ligeramente diferente (más clara o más grande).
   - Dibujar fruta usando `ctx.drawImage` con coordenadas del atlas, escalada a tamaño de celda.
   - HUD: score en esquina superior.
   - Pantalla de game over con score final.
   - Listeners de teclado en `window` con cleanup. Arrow keys y WASD para dirección, P/Escape para pausa.
   - Retornar cleanup function que cancela `requestAnimationFrame` y remueve listeners.
   - Punto de integración `onGameOver`: llamar `options.onGameOver?.(score)` cuando `gameState` cambia a `'gameover'`.

3. **Crear `components/games/snake.tsx`:** Client Component.
   - `useRef<HTMLCanvasElement>` + `useEffect` llamando `startSnake(canvas, { onGameOver })`.
   - `useAuth()` para contexto de usuario.
   - En `onGameOver`: si hay usuario logueado, llamar `submitScore('snake', playerName, score)`.
   - Canvas con `width={800} height={600}`, `tabIndex={0}`, `autoFocus`.
   - Cleanup en return de `useEffect`.

4. **Registrar en `components/game-loader.tsx`:**
   - Agregar dynamic import: `const SnakeGame = dynamic(() => import('@/components/games/snake').then(m => m.SnakeGame), { ssr: false })`.
   - Agregar entrada en `GAME_MAP`: `'snake': SnakeGame`.

5. **Crear cover CSS en `app/globals.css`:** clase `.cover-snake` con gradientes CSS que representen una serpiente serpenteando con una fruta. Seguir patrón de `.cover-asteroids`.

6. **Insertar registro en Supabase:** ejecutar INSERT en tabla `games` con datos de Snake.

7. **Actualizar leyenda de controles:** en la página de juego, agregar controles de Snake: "← → ↑ ↓ / WASD DIRECCIÓN · P PAUSA".

8. **Verificar:** `npm run dev`, navegación a `/game/snake`, gameplay completo, sprites de frutas, score submit, aparición en `/hall`.

## Acceptance criteria

- [ ] `/game/snake` carga y muestra el juego.
- [ ] Juego renderiza en canvas de 800×600.
- [ ] Grilla de 40×30 visible con patrón de fondo sutil.
- [ ] Serpiente se mueve en las 4 direcciones con arrow keys y WASD.
- [ ] No se permite revertir dirección (izquierda si va a derecha, etc.).
- [ ] Fruta aparece como sprite del spritesheet, cambia aleatoriamente con cada nueva fruta.
- [ ] Al comer fruta, serpiente crece y score suma +10.
- [ ] Velocidad aumenta cada 5 frutas comidas.
- [ ] Colisión con pared dispara game over.
- [ ] Colisión con cuerpo propio dispara game over.
- [ ] Score se muestra en HUD durante gameplay.
- [ ] Game over muestra overlay con puntaje final.
- [ ] P/Escape pausa y reanuda el juego.
- [ ] Con usuario logueado, score se envía a Supabase al game over.
- [ ] Sin usuario logueado, score no se intenta enviar (sin error).
- [ ] Score submitido aparece en `/hall` al recargar.
- [ ] `/game/snake` (página detalle) muestra datos del juego desde Supabase.
- [ ] GameLoader muestra el juego (no "EN DESARROLLO").
- [ ] Cover CSS se muestra correctamente en library y página de detalle.
- [ ] Aviso mobile se muestra en pantallas pequeñas.
- [ ] Leyenda de controles específica de Snake visible en página de juego.
- [ ] Navegar fuera del juego detiene game loop y limpia listeners.
- [ ] `npm run dev` sin errores en consola.
- [ ] No hay errores de TypeScript.

## Decisions

- **Yes:** Canvas 800×600 con grilla 40×30 (celda 20px). Usuario eligió 800×600 por consistencia con Asteroids y Arkanoid. 20px por celda da tablero amplio para gameplay variado.
- **No:** Canvas 600×600 cuadrado. Descartado por el usuario a favor de consistencia con otros juegos.
- **Yes:** Frutas aleatorias del spritesheet. Variedad visual estilo Google Snake. Los 22 sprites se aprovechan. Cada fruta nueva elige tipo al azar.
- **No:** Frutas por nivel o por puntaje. Complejidad innecesaria para primera versión.
- **No:** Solo apple. Desperdicia los 22 sprites disponibles.
- **Yes:** Color green. Icónico de Snake, libre en la paleta de la plataforma (cyan=Tetris, magenta=Arkanoid).
- **Yes:** Muerte al chocar con pared. Más desafiante, Snake clásico. Sin wrap-around.
- **No:** Wrap-around. Reduce dificultad, se consideró pero el usuario eligió muerte en bordes.
- **Yes:** +10 por fruta, velocidad sube cada 5 frutas. Simple y clásico. Score lineal, dificultad progresiva.
- **No:** Puntos variables por tipo de fruta. Agrega complejidad de balanceo sin beneficio claro en primera versión.
- **Yes:** Arrow keys + WASD. Ambos esquemas son estándar para Snake. Inclusivo para distintas preferencias.
- **Yes:** Input buffering con `nextDirection`. Previene giros imposibles (reversa) y suaviza input a alta velocidad.
- **Yes:** Game logic desde cero (no adaptación de referencia). No hay juego de referencia disponible. Snake es suficientemente simple para escribir desde cero.
- **Yes:** Categoría ARCADE. Consistente con tono de la plataforma.
- **Yes:** Spritesheet en `public/games/snake/`. Organización por juego, consistente con Arkanoid.

## Risks

| Risk                                                        | Mitigation                                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Event listeners de teclado interfieren con navegación       | Listeners en window con cleanup en useEffect return. `e.preventDefault()` solo para teclas del juego.         |
| Memory leak por requestAnimationFrame sin cancelar          | Cleanup guarda id de RAF y llama `cancelAnimationFrame`. Patrón probado en Asteroids, Tetris y Arkanoid.      |
| Spritesheet no carga (ruta incorrecta o asset missing)      | Verificar ruta en build. Fallback: si imagen no carga, dibujar cuadrado rojo como fruta.                      |
| Fruta aparece dentro de la serpiente                        | Función de spawn verifica que celda no esté ocupada. Si serpiente ocupa todo el tablero, game over (win).     |
| Input rápido causa giro en U (serpiente se come a sí misma) | Buffer de input aplica dirección solo en tick de movimiento. Validar contra dirección actual, no la buffered. |
| Serpiente larga causa lag en renderizado                    | 40×30 = 1200 celdas máximo. Dibujar solo segmentos visibles. Rendimiento no es problema a esta escala.        |

## What is **not** in this spec

- Sonido y efectos de audio.
- Controles táctiles / botones virtuales para mobile.
- Canvas responsive (escalado al viewport).
- Modos de juego extra (wrap-around, versus AI, niveles con obstáculos).
- Animaciones de partículas al comer fruta.

Cada uno de esos, si se implementa, va en su propio spec.
