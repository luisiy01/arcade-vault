# SPEC GJ-01 — Rana Espacial: integración en Arcade Vault

> **Status:** Propuesto
> **Depends on:** SPEC 04, SPEC 05, SPEC 06
> **Date:** 2026-10-23
> **Objective:** Integrar Rana Espacial como juego jugable en la plataforma, creando la lógica desde cero siguiendo el patrón establecido por Asteroids (SPEC 05) con submit de scores a Supabase (SPEC 06). Es una variante de Frogger ambientada en el espacio con mecánica de inercia en gravedad cero.

## Scope

**In:**

- Módulo de lógica `lib/games/space-frog.ts` creado desde cero.
- Componente React wrapper `components/games/space-frog.tsx` con `useRef`/`useEffect`, `useAuth()` y `submitScore()`.
- Registro en `components/game-loader.tsx` con dynamic import y entrada en `GAME_MAP`.
- INSERT del registro en tabla `games` de Supabase.
- Cover CSS en `app/globals.css` (clase `.cover-space-frog`).
- Leyenda de controles específica en la página de juego.
- Canvas de 800×600.
- Tablero estilo Frogger con temática espacial: cinturones de asteroides (zona de tráfico), ríos de plasma (zona de plataformas flotantes), estaciones de acoplamiento (casillas meta).
- Mecánica de inercia: la rana se desliza tras cada salto en gravedad cero, el jugador debe frenar manualmente en zonas seguras.
- 12 filas jugables: zona de inicio, 5 filas de cinturones de asteroides, 1 fila de estación intermedia segura, 5 filas de ríos de plasma con plataformas flotantes, 1 fila con 5 bahías de acoplamiento.
- Medidor de energía: frenar consume energía, cristales en el campo la recargan.
- 3 vidas. Timer de 60 segundos por intento de cruce.
- Score submit a Supabase al game over vía callback `onGameOver`.

**Out of scope (para futuros specs):**

- Sonido y efectos de audio.
- Controles táctiles / botones virtuales para mobile.
- Canvas responsive (escalado al viewport).
- Modos de juego extra (modo historia, jefes, power-ups adicionales).
- Animaciones de partículas complejas (explosiones multi-capa, nebulosas animadas).

## Data model

No se introducen nuevas estructuras de datos. Se reutiliza `Game` y `Score` de `lib/supabase/types.ts` (SPEC 06).

### Estado interno del juego (encapsulado en closure)

```ts
// Constantes
const CANVAS_W = 800;
const CANVAS_H = 600;
const ROWS = 14; // inicio + 5 asteroides + segura + 5 plasma + bahías (top)
const ROW_H = Math.floor(CANVAS_H / ROWS); // ~42px por fila
const COLS = 5; // bahías de acoplamiento
const FROG_SIZE = 30;
const MAX_ENERGY = 100;
const BRAKE_COST = 2; // energía por frame frenando
const DRIFT_DECEL = 0.02; // desaceleración natural (muy lenta)
const BRAKE_DECEL = 0.3; // desaceleración al frenar
const JUMP_SPEED = 5; // velocidad inicial del salto (px/frame)
const TIMER_SECONDS = 60;

// Tipos de fila
type RowType = 'start' | 'asteroid' | 'safe' | 'plasma' | 'dock';

interface RowConfig {
  type: RowType;
  y: number; // posición Y superior de la fila
}

// Obstáculos (asteroides en zona de tráfico)
interface Asteroid {
  x: number;
  y: number;
  w: number; // ancho variable (40-120px)
  h: number;
  speed: number; // px/frame, positivo=derecha, negativo=izquierda
  variant: number; // 0-3, forma visual
}

// Plataformas flotantes (zona de plasma)
interface Platform {
  x: number;
  y: number;
  w: number; // ancho variable (60-160px)
  speed: number; // px/frame
  type: 'debris' | 'satellite' | 'sinking';
  // sinking: se hunde periódicamente (como tortugas en Frogger)
  sinkTimer: number;
  isSunk: boolean;
}

// Cristal de energía (recarga)
interface Crystal {
  x: number;
  y: number;
  row: number;
  collected: boolean;
}

// Rana espacial
interface SpaceFrog {
  x: number;
  y: number;
  vx: number; // velocidad horizontal (inercia)
  vy: number; // velocidad vertical (inercia)
  onPlatform: Platform | null; // referencia a plataforma actual
  row: number; // fila actual (0=inicio, 13=bahías)
}

// Estado mutable (dentro de closure, no exportado)
// frog: SpaceFrog
// lives: number (inicia en 3)
// score: number
// energy: number (0-100)
// timer: number (60 seg countdown)
// docks: boolean[] — 5 bahías, true si ya ocupada
// dockedCount: number — cuántas bahías llenadas
// rows: RowConfig[] — configuración de filas
// asteroids: Asteroid[][] — asteroides por fila
// platforms: Platform[][] — plataformas por fila
// crystals: Crystal[] — cristales activos en el campo
// isBraking: boolean — si el jugador está frenando
// gameState: 'playing' | 'paused' | 'gameover'
// level: number — nivel actual (incrementa velocidades)
```

### Scoring

- **+100 puntos** por rana acoplada en bahía.
- **+tiempo restante** en puntos (1 pt por segundo restante) al acoplar.
- **+10 puntos** por cada fila avanzada (primera vez en ese intento).
- **+25 puntos** por cristal de energía recogido.
- **+500 puntos bonus** al llenar las 5 bahías (completa el nivel).
- Al completar nivel, se incrementa dificultad (más asteroides, plataformas más rápidas, menos cristales) y se reinician bahías.
- **Game over:** 0 vidas restantes. Se pierde vida al: colisionar con asteroide, caer al plasma (no estar en plataforma), timer llega a 0, salir del canvas.
- **Multiplicador de nivel:** score base x nivel actual.

### Registro Supabase

```sql
INSERT INTO games (id, title, short, long, cat, cover, color, best, plays)
VALUES (
  'space-frog',
  'RANA ESPACIAL',
  'Cruza cinturones de asteroides y ríos de plasma en gravedad cero.',
  'Variante espacial de Frogger con mecánica de inercia: en gravedad cero, cada salto te desliza y debes frenar manualmente para aterrizar en zonas seguras. Cruza cinturones de asteroides letales y navega plataformas flotantes sobre ríos de plasma para acoplar tu rana en las estaciones espaciales. La energía es limitada — recoge cristales para recargar. ¿Cuántas bahías puedes llenar antes de quedarte sin vidas?',
  'ARCADE',
  'cover-space-frog',
  'cyan',
  0,
  '0'
);
```

## Implementation plan

1. **Crear `lib/games/space-frog.ts`:** módulo TypeScript desde cero.
   - Exportar `startSpaceFrog(canvas: HTMLCanvasElement, options?: SpaceFrogOptions): () => void`.
   - `SpaceFrogOptions` incluye `onGameOver?: (score: number) => void`.
   - Recibir canvas como parámetro, no usar `document.getElementById`.
   - Encapsular todo estado en closure (frog, asteroids, platforms, score, lives, energy, docks, gameState).
   - **Configuración de filas:** 14 filas de abajo a arriba: fila 0 (inicio/spawn), filas 1-5 (cinturones de asteroides), fila 6 (estación intermedia segura), filas 7-11 (ríos de plasma con plataformas), fila 12-13 (bahías de acoplamiento, 5 slots).
   - **Asteroides:** cada fila de asteroides tiene 3-6 asteroides moviéndose horizontalmente. Filas alternas van en dirección opuesta. Velocidad y densidad incrementan con nivel. Asteroides que salen por un lado reaparecen por el otro (wrap-around horizontal).
   - **Plataformas flotantes:** cada fila de plasma tiene 2-4 plataformas. Tipos: debris (estable), satellite (ancho, lento), sinking (se hunde cada 3-4 segundos como las tortugas de Frogger). Plataformas wrap-around horizontal.
   - **Rana — Movimiento con inercia:** al presionar dirección, se aplica velocidad instantánea (`JUMP_SPEED`) en esa dirección. La rana se desliza con desaceleración mínima (`DRIFT_DECEL`). Al presionar Espacio (freno), desaceleración rápida (`BRAKE_DECEL`) consume energía. Sin freno, la rana se desliza indefinidamente.
   - **Rana sobre plataforma:** cuando la rana está sobre una plataforma en zona de plasma, se mueve con ella. Si la plataforma es sinking y se hunde, la rana cae al plasma (muerte).
   - **Energía:** inicia en 100. Frenar cuesta 2/frame. Cristales de energía aparecen aleatoriamente en filas de asteroides y plasma (3-5 por nivel). Recoger cristal: +25 energía (cap 100).
   - **Bahías de acoplamiento:** 5 slots en la parte superior. Al llegar la rana a un slot vacío: +100 pts + tiempo restante, rana reaparece en inicio. Al llenar los 5: +500 bonus, nivel sube, bahías se reinician.
   - **Colisiones:** AABB simplificado. Rana vs asteroide = muerte. Rana fuera de plataforma en zona plasma = muerte. Rana fuera del canvas = muerte. Timer a 0 = muerte.
   - **Rendering:**
     - Fondo: campo de estrellas estático (puntos blancos aleatorios sobre #0a0a0f).
     - Zona de asteroides: fondo ligeramente más claro (#0d0d15). Asteroides como polígonos irregulares con contorno cyan.
     - Estación intermedia: línea horizontal cyan con puntos de amarre.
     - Zona de plasma: fondo con efecto de flujo horizontal (gradiente animado magenta/cyan). Plataformas como rectángulos con borde brillante.
     - Bahías: 5 arcos/slots en la parte superior con borde cyan. Bahías ocupadas se llenan con color sólido.
     - Rana: sprite simple tipo astronauta-rana (cuadrado redondeado con ojos, casco circular, color cyan brillante).
     - Estela de inercia: rastro de partículas detrás de la rana mientras se desliza.
   - **HUD:** Score arriba-izquierda, vidas (iconos de rana) arriba-centro, timer arriba-derecha, barra de energía abajo-centro.
   - **Pantalla de game over:** overlay semitransparente con "GAME OVER", score final, instrucciones para reiniciar.
   - Listeners de teclado en `window` con cleanup. Flechas para saltar, Espacio para frenar, P/Escape para pausa, R para reiniciar tras game over.
   - `e.preventDefault()` solo para teclas del juego.
   - Retornar cleanup function que cancela `requestAnimationFrame` y remueve listeners.
   - Punto de integración `onGameOver`: llamar `options.onGameOver?.(score)` cuando `gameState` cambia a `'gameover'`.

2. **Crear `components/games/space-frog.tsx`:** Client Component.
   - `useRef<HTMLCanvasElement>` + `useEffect` llamando `startSpaceFrog(canvas, { onGameOver })`.
   - `useAuth()` para contexto de usuario.
   - En `onGameOver`: si hay usuario logueado, llamar `submitScore('space-frog', playerName, score)`.
   - Canvas con `width={800} height={600}`, `tabIndex={0}`, `autoFocus`.
   - Cleanup en return de `useEffect`.

3. **Registrar en `components/game-loader.tsx`:**
   - Agregar dynamic import: `const SpaceFrogGame = dynamic(() => import('@/components/games/space-frog').then(m => m.SpaceFrogGame), { ssr: false })`.
   - Agregar entrada en `GAME_MAP`: `'space-frog': SpaceFrogGame`.

4. **Crear cover CSS en `app/globals.css`:** clase `.cover-space-frog` con gradientes CSS que representen un campo de estrellas con asteroides y plasma. Background radial oscuro con destellos cyan. `::after` para silueta de rana astronauta. `::before` para asteroides decorativos. Seguir patrón de `.cover-asteroids`.

5. **Insertar registro en Supabase:** ejecutar INSERT en tabla `games` con datos del juego.

6. **Actualizar leyenda de controles:** en la página de juego, agregar controles específicos: "← → ↑ ↓ SALTAR · ESPACIO FRENAR · P PAUSA · R REINICIAR".

7. **Verificar:** `npm run dev`, navegación a `/game/space-frog`, gameplay completo, mecánica de inercia funcional, score submit, aparición en `/hall`.

## Acceptance criteria

- [ ] `/game/space-frog` carga y muestra el juego.
- [ ] Juego renderiza en canvas de 800×600.
- [ ] Tablero muestra 14 filas: inicio, 5 asteroides, segura, 5 plasma, bahías.
- [ ] Asteroides se mueven horizontalmente en cinturones, con wrap-around.
- [ ] Plataformas flotantes se mueven sobre ríos de plasma.
- [ ] Plataformas tipo sinking se hunden periódicamente.
- [ ] Rana se desliza con inercia tras cada salto (no se detiene instantáneamente).
- [ ] Espacio frena la rana y consume energía del medidor.
- [ ] Cristales de energía aparecen y recargan el medidor al recogerlos.
- [ ] Colisión con asteroide mata a la rana.
- [ ] Caer al plasma (fuera de plataforma) mata a la rana.
- [ ] Rana sobre plataforma se mueve con ella.
- [ ] Al llegar a bahía vacía: +100 pts + tiempo restante, rana reaparece.
- [ ] Al llenar 5 bahías: +500 bonus, nivel incrementa, bahías se reinician.
- [ ] Timer de 60 segundos cuenta regresiva por intento.
- [ ] 3 vidas, game over al perder todas.
- [ ] Score se muestra en HUD durante gameplay.
- [ ] Barra de energía visible en HUD.
- [ ] Vidas y timer visibles en HUD.
- [ ] Game over muestra overlay con puntaje final.
- [ ] P/Escape pausa y reanuda el juego.
- [ ] Con usuario logueado, score se envía a Supabase al game over.
- [ ] Sin usuario logueado, score no se intenta enviar (sin error).
- [ ] Score submitido aparece en `/hall` al recargar.
- [ ] `/game/space-frog` (página detalle) muestra datos del juego desde Supabase.
- [ ] GameLoader muestra el juego (no "EN DESARROLLO").
- [ ] Cover CSS se muestra correctamente en library y página de detalle.
- [ ] Aviso mobile se muestra en pantallas pequeñas.
- [ ] Leyenda de controles específica visible en página de juego.
- [ ] Navegar fuera del juego detiene game loop y limpia listeners.
- [ ] `npm run dev` sin errores en consola.
- [ ] No hay errores de TypeScript.

## Decisions

- **Yes:** Categoría ARCADE. Frogger con inercia sigue siendo fundamentalmente un juego de habilidad/timing de cruce. La mecánica de inercia agrega profundidad pero no cambia el género.
- **Yes:** Color cyan. Encaja con la estética espacial (azul cósmico). Cyan está disponible (Tetris lo usa pero no hay conflicto en game-jam).
- **Yes:** Mecánica de inercia como twist principal. Diferencia claramente este juego de `ranaria` (Frogger clásico pendiente). La gravedad cero justifica narrativamente el deslizamiento y agrega una capa estratégica: gestión de energía para frenar.
- **No:** Frogger clásico sin twist. Ya existe como `ranaria` en pendientes. Duplicar sería redundante.
- **Yes:** Canvas 800×600. Consistente con todos los juegos de la plataforma. 14 filas caben bien con ~42px por fila.
- **Yes:** 14 filas (vs 13 del Frogger original). La fila adicional permite bahías de acoplamiento más amplias y espaciado visual cómodo.
- **Yes:** Medidor de energía para frenar. Sin límite de freno, la inercia sería trivial. La gestión de energía crea tensión estratégica.
- **No:** Inercia solo vertical. Inercia en ambos ejes (X e Y) da más control y emergencia de gameplay. Solo vertical sería demasiado restrictivo.
- **Yes:** Cristales de energía recargables. Sin recarga, partidas largas serían imposibles. Los cristales incentivan rutas arriesgadas.
- **Yes:** Wrap-around para asteroides y plataformas. Estándar en Frogger. Simplifica spawning y mantiene densidad constante.
- **No:** Asteroides que rebotan en bordes. Comportamiento confuso y difícil de predecir para el jugador.

## Risks

| Risk                                                          | Mitigation                                                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Event listeners de teclado interfieren con navegación Next.js | Listeners en window con cleanup en useEffect return. `e.preventDefault()` solo para teclas del juego. |
| Memory leak por requestAnimationFrame sin cancelar            | Cleanup guarda id de RAF y llama `cancelAnimationFrame`. Patrón probado en juegos anteriores.         |
| Mecánica de inercia frustrante para jugadores casuales        | Desaceleración natural lenta pero presente. Tutorial visual en primer intento. Frenar es generoso.    |
| Energía se agota muy rápido, juego injusto                    | Cristales frecuentes en niveles iniciales. Costo de freno balanceado para permitir 20+ frenadas.      |
| Colisiones imprecisas con inercia (rana se desliza a obst.)   | Hitbox de rana ligeramente menor que sprite visual. Detección de colisión cada frame, no por tick.    |
| Plataformas sinking no dan feedback visual claro              | Animación de hundimiento gradual (2 seg). Parpadeo de advertencia 1 seg antes de hundirse.            |

## What is **not** in this spec

- Sonido y efectos de audio.
- Controles táctiles / botones virtuales para mobile.
- Canvas responsive (escalado al viewport).
- Modos de juego extra (modo historia, jefes, power-ups adicionales).
- Animaciones de partículas complejas (explosiones multi-capa, nebulosas animadas).
- Diferentes tipos de rana/astronauta seleccionables.

Cada uno de esos, si se implementa, va en su propio spec.
