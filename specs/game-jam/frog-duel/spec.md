# SPEC GJ-03 — Duelo Anfibio: integración en Arcade Vault

> **Status:** Propuesto
> **Depends on:** SPEC 04, SPEC 05, SPEC 06
> **Date:** 2026-10-23
> **Objective:** Integrar Duelo Anfibio como juego jugable en la plataforma, creando la lógica desde cero siguiendo el patrón establecido por Asteroids (SPEC 05) con submit de scores a Supabase (SPEC 06). Es un Frogger competitivo para 2 jugadores en el mismo teclado.

## Scope

**In:**

- Módulo de lógica `lib/games/frog-duel.ts` creado desde cero.
- Componente React wrapper `components/games/frog-duel.tsx` con `useRef`/`useEffect`, `useAuth()` y `submitScore()`.
- Registro en `components/game-loader.tsx` con dynamic import y entrada en `GAME_MAP`.
- INSERT del registro en tabla `games` de Supabase.
- Cover CSS en `app/globals.css` (clase `.cover-frog-duel`).
- Leyenda de controles específica en la página de juego.
- Canvas de 800×600.
- Tablero Frogger compartido por 2 jugadores. Mismo tráfico, mismos troncos, mismas reglas.
- Cada jugador controla una rana con controles distintos (J1: WASD, J2: Flechas).
- 5 casillas meta divididas: 3 impares para J1 (cyan), 2 pares para J2 (yellow), o viceversa basado en quién llega primero (casillas neutrales que se reclaman).
- Mecánica de empujón: si ambas ranas están en el mismo tronco y una salta hacia la otra, la empuja fuera del tronco.
- Troncos con capacidad limitada: algunos troncos cortos solo soportan 1 rana.
- Power-ups en el campo: velocidad (siguiente salto más rápido), escudo (sobrevive 1 impacto), congelar rival (rival no puede moverse 2 seg).
- Rondas: mejor de 3. Gana la ronda quien llena sus casillas primero o tiene más al acabar el timer.
- Score individual para cada jugador. Al final, ganador puede submitear su score.
- Score submit a Supabase al game over vía callback `onGameOver`.

**Out of scope (para futuros specs):**

- Sonido y efectos de audio.
- Controles táctiles / botones virtuales para mobile.
- Canvas responsive (escalado al viewport).
- Modo online (networking/WebSocket).
- Modo contra IA.
- Más de 2 jugadores.

## Data model

No se introducen nuevas estructuras de datos. Se reutiliza `Game` y `Score` de `lib/supabase/types.ts` (SPEC 06).

### Estado interno del juego (encapsulado en closure)

```ts
// Constantes
const CANVAS_W = 800;
const CANVAS_H = 600;
const ROWS = 14; // inicio + 5 carretera + segura + 5 río + casillas
const ROW_H = Math.floor(CANVAS_H / ROWS); // ~42px por fila
const FROG_SIZE = 26; // ligeramente más pequeño para que quepan 2 en un tronco
const HOMES = 5;
const ROUND_TIMER = 90; // segundos por ronda
const TOTAL_ROUNDS = 3; // mejor de 3
const FREEZE_DURATION = 2000; // ms de congelamiento
const SPEED_BOOST_MULT = 1.5;
const SHIELD_HITS = 1;

// Jugador
type PlayerId = 1 | 2;

interface PlayerFrog {
  id: PlayerId;
  x: number;
  y: number;
  row: number;
  onLog: LogPlatform | null;
  alive: boolean;
  respawnTimer: number; // ms hasta respawn tras muerte
  score: number; // score acumulado total (todas las rondas)
  roundScore: number; // score de la ronda actual
  homesThisRound: number; // casillas llenadas esta ronda
  // Power-ups activos
  hasShield: boolean;
  isFrozen: boolean;
  frozenTimer: number;
  speedBoost: boolean;
  speedBoostTimer: number;
  // Controles asignados
  keys: { up: string; down: string; left: string; right: string };
}

// Vehículo
interface Vehicle {
  x: number;
  y: number;
  w: number;
  speed: number;
  type: 'car' | 'truck' | 'bus';
}

// Tronco/tortuga
interface LogPlatform {
  x: number;
  y: number;
  w: number;
  speed: number;
  type: 'log' | 'turtle' | 'sinking-turtle';
  capacity: number; // 1 o 2 ranas
  sinkTimer: number;
  isSunk: boolean;
}

// Casilla meta
interface HomeSlot {
  x: number;
  y: number;
  owner: PlayerId | null; // null = libre, 1 o 2 = reclamada
}

// Power-up
type PowerUpType = 'speed' | 'shield' | 'freeze';

interface PowerUp {
  x: number;
  y: number;
  row: number;
  type: PowerUpType;
  collected: boolean;
  spawnTimer: number; // tiempo visible antes de desaparecer
}

// Estado de ronda
interface RoundState {
  roundNumber: number; // 1, 2, o 3
  timer: number; // countdown en segundos
  winner: PlayerId | null; // null si no ha terminado
}

// Estado mutable (dentro de closure, no exportado)
// player1: PlayerFrog
// player2: PlayerFrog
// vehicles: Vehicle[][] — por fila de carretera
// logs: LogPlatform[][] — por fila de río
// homes: HomeSlot[] — 5 casillas
// powerUps: PowerUp[] — power-ups activos en el campo
// round: RoundState
// roundsWon: [number, number] — [J1 wins, J2 wins]
// gameState: 'waiting' | 'playing' | 'roundEnd' | 'matchEnd'
// level: number — incrementa cada ronda para aumentar dificultad
```

### Scoring

- **+100 puntos** por casilla reclamada.
- **+10 puntos** por cada fila avanzada (primera vez por intento de cruce).
- **+50 puntos** por empujar al rival fuera de un tronco.
- **+25 puntos** por recoger power-up.
- **+200 puntos bonus** por ganar ronda.
- **+500 puntos bonus** por ganar el match (mejor de 3).
- **+tiempo restante** en puntos al reclamar casilla (1 pt/seg restante).
- **Se pierde vida (respawn 2 seg) al:** ser atropellado, caer al agua, salir del canvas. No se pierden puntos.
- **Ganar ronda:** quien tiene más casillas al acabar timer, o quien llena todas sus casillas primero.
- **Ganar match:** mejor de 3 rondas. El score total del ganador se submitea a leaderboard.
- **Modo singleplayer fallback:** si solo hay 1 jugador activo (solo presiona WASD o solo flechas en los primeros 5 seg), J2 no aparece y se juega como Frogger clásico competitivo contra reloj con las 5 casillas.

### Registro Supabase

```sql
INSERT INTO games (id, title, short, long, cat, cover, color, best, plays)
VALUES (
  'frog-duel',
  'DUELO ANFIBIO',
  'Frogger competitivo: dos ranas, un tablero, una victoria.',
  'Frogger para dos jugadores en el mismo teclado. Ambas ranas comparten el mismo tráfico y los mismos troncos, pero compiten por reclamar las casillas meta. Empuja a tu rival de los troncos, roba power-ups y llena tus casillas antes que el oponente. Mejor de 3 rondas. ¿Quién es la rana más rápida?',
  'VERSUS',
  'cover-frog-duel',
  'yellow',
  0,
  '0'
);
```

## Implementation plan

1. **Crear `lib/games/frog-duel.ts`:** módulo TypeScript desde cero.
   - Exportar `startFrogDuel(canvas: HTMLCanvasElement, options?: FrogDuelOptions): () => void`.
   - `FrogDuelOptions` incluye `onGameOver?: (score: number) => void`.
   - Recibir canvas como parámetro, no usar `document.getElementById`.
   - Encapsular todo estado en closure.
   - **Configuración de filas:** 14 filas, idéntica estructura a Frogger clásico. Fila 0: zona de inicio (ambas ranas spawn aquí). Filas 1-5: carretera con vehículos. Fila 6: mediana segura. Filas 7-11: río con troncos. Fila 12-13: casillas meta (5 slots).
   - **Dos jugadores:**
     - J1: WASD. Rana color cyan. Spawn en lado izquierdo de fila 0.
     - J2: Flechas. Rana color yellow. Spawn en lado derecho de fila 0.
     - Ambos se mueven simultáneamente con movimiento discreto (salto por celda como Frogger).
     - Cada jugador tiene respawn independiente (2 seg tras muerte, reaparece en fila 0).
   - **Casillas meta (5 slots):** neutrales al inicio. Cuando una rana llega a un slot vacío, lo reclama para su jugador (se pinta de su color). Un slot reclamado no puede ser robado. Si una rana llega a un slot ya ocupado, rebota (no cuenta).
   - **Mecánica de empujón:** si ambas ranas están en la misma fila de río y una salta lateralmente hacia la posición de la otra mientras ambas están en un tronco, la rana empujada cae al agua (muerte + respawn). Solo funciona en zona de río. No aplica en carretera ni mediana.
   - **Troncos con capacidad:** troncos largos (w >= 120px) soportan 2 ranas. Troncos cortos (w < 120px) soportan solo 1. Si una rana intenta subir a un tronco corto ocupado, la rana existente es empujada al agua.
   - **Power-ups:** aparecen aleatoriamente (1-2 activos a la vez) en filas de carretera y río. Desaparecen tras 8 segundos si no se recogen. Tipos:
     - `speed`: siguiente movimiento se ejecuta más rápido (reduce cooldown de salto). Dura 5 seg.
     - `shield`: protege de 1 muerte (atropello o caída al agua). Se consume al usarse.
     - `freeze`: congela al rival por 2 seg (no puede moverse). Se activa al recogerlo instantáneamente.
   - **Rondas:** mejor de 3. Timer de 90 seg por ronda. Ganar: más casillas al acabar timer, o todas las casillas antes. Entre rondas: pantalla de 5 seg mostrando resultado. Al ganar match: pantalla final con score del ganador.
   - **Modo singleplayer fallback:** si en los primeros 5 seg de la ronda 1 solo se detectan inputs de un set de teclas (WASD o flechas), el juego pasa a modo 1P. Solo aparece 1 rana. Las 5 casillas son para ese jugador. Sin rival. Timer 60 seg. El score se submitea normalmente.
   - **Vehículos y troncos:** misma mecánica que Frogger clásico. Vehículos con wrap-around. Troncos con wrap-around. Tortugas sinking. Densidad y velocidad aumentan cada ronda.
   - **Rendering:**
     - Fondo: #0a0a0f base.
     - Carretera: filas gris oscuro con líneas de carril.
     - Mediana: franja con vegetación estilizada.
     - Río: filas azul profundo.
     - Vehículos: rectángulos con contorno neón (blanco/gris).
     - Troncos: rectángulos marrones con borde. Cortos: borde rojo (indica capacidad 1).
     - Tortugas: círculos verdes. Sinking parpadean.
     - J1 rana: cuadrado redondeado color cyan brillante con ojos. Label "1" o "P1".
     - J2 rana: cuadrado redondeado color yellow brillante con ojos. Label "2" o "P2".
     - Rana muerta: animación breve de splash/explosión de color, luego desaparece. Cuenta regresiva de respawn visible.
     - Casillas: 5 arcos. Vacías: contorno gris. Cyan: reclamada por J1. Yellow: reclamada por J2.
     - Power-ups: iconos neón parpadeantes. Speed: rayo. Shield: escudo. Freeze: copo de nieve. Color blanco neutral.
     - Efectos activos: shield = aura circular brillante sobre rana. Frozen = rana con tinte azul y cristales.
   - **HUD:**
     - Arriba-izquierda: "P1: [score]" en cyan.
     - Arriba-derecha: "P2: [score]" en yellow.
     - Arriba-centro: timer de ronda. Debajo: "RONDA X/3" y marcador de rondas ganadas (ej: "●○ vs ○○").
     - Abajo-centro: casillas ocupadas por cada jugador (ej: "P1: 2/5 | P2: 1/5").
   - **Pantallas intermedias:**
     - Pre-ronda: "RONDA X" + "P1: WASD / P2: FLECHAS" + countdown 3-2-1.
     - Fin de ronda: "P1 GANA RONDA" o "P2 GANA RONDA" o "EMPATE" + scores. 5 seg.
     - Fin de match: "P1 GANA EL DUELO" o "P2 GANA" + score final de ambos. Instrucción de reinicio.
   - Listeners de teclado en `window` con cleanup. WASD para J1, Flechas para J2, P/Escape para pausa, R para reiniciar tras match end.
   - `e.preventDefault()` solo para teclas del juego.
   - Retornar cleanup function que cancela `requestAnimationFrame` y remueve listeners.
   - Punto de integración `onGameOver`: llamar `options.onGameOver?.(winnerScore)` cuando `gameState` cambia a `'matchEnd'`. El score submitido es el del ganador (mayor score).

2. **Crear `components/games/frog-duel.tsx`:** Client Component.
   - `useRef<HTMLCanvasElement>` + `useEffect` llamando `startFrogDuel(canvas, { onGameOver })`.
   - `useAuth()` para contexto de usuario.
   - En `onGameOver`: si hay usuario logueado, llamar `submitScore('frog-duel', playerName, score)`.
   - Canvas con `width={800} height={600}`, `tabIndex={0}`, `autoFocus`.
   - Cleanup en return de `useEffect`.

3. **Registrar en `components/game-loader.tsx`:**
   - Agregar dynamic import: `const FrogDuelGame = dynamic(() => import('@/components/games/frog-duel').then(m => m.FrogDuelGame), { ssr: false })`.
   - Agregar entrada en `GAME_MAP`: `'frog-duel': FrogDuelGame`.

4. **Crear cover CSS en `app/globals.css`:** clase `.cover-frog-duel` con gradientes CSS. Dos ranas enfrentadas (siluetas cyan y yellow). Fondo dividido diagonalmente. `::after` para rana cyan. `::before` para rana yellow. Seguir patrón de `.cover-asteroids`.

5. **Insertar registro en Supabase:** ejecutar INSERT en tabla `games` con datos del juego.

6. **Actualizar leyenda de controles:** en la página de juego, agregar controles específicos: "J1: W A S D MOVER · J2: ← → ↑ ↓ MOVER · P PAUSA".

7. **Verificar:** `npm run dev`, navegación a `/game/frog-duel`, gameplay completo 2P, empujones, power-ups, rondas, score submit, aparición en `/hall`.

## Acceptance criteria

- [ ] `/game/frog-duel` carga y muestra el juego.
- [ ] Juego renderiza en canvas de 800×600.
- [ ] J1 se mueve con WASD, J2 con flechas. Ambos simultáneamente.
- [ ] J1 rana cyan, J2 rana yellow, visualmente distintas.
- [ ] Tablero Frogger completo: carretera, mediana, río, casillas.
- [ ] Vehículos se mueven con wrap-around.
- [ ] Troncos y tortugas funcionan como Frogger clásico.
- [ ] Tortugas sinking se hunden periódicamente.
- [ ] 5 casillas neutrales se reclaman al llegar (se pintan del color del jugador).
- [ ] Casilla ya reclamada no se puede robar.
- [ ] Empujón funciona en zona de río: saltar hacia rival en mismo tronco lo empuja al agua.
- [ ] Troncos cortos solo soportan 1 rana.
- [ ] Power-ups aparecen y desaparecen tras 8 seg.
- [ ] Speed boost acelera movimiento por 5 seg.
- [ ] Shield protege de 1 muerte.
- [ ] Freeze congela al rival por 2 seg.
- [ ] Timer de 90 seg por ronda.
- [ ] Ronda termina al acabar timer o cuando alguien llena todas sus casillas.
- [ ] Mejor de 3 rondas. Match termina cuando alguien gana 2 rondas.
- [ ] Pantallas intermedias entre rondas (resultado, countdown).
- [ ] Modo singleplayer fallback si solo 1 set de teclas se usa en primeros 5 seg.
- [ ] Score se muestra en HUD para ambos jugadores.
- [ ] Marcador de rondas visible.
- [ ] P/Escape pausa y reanuda el juego.
- [ ] Al fin de match, score del ganador se puede submitear a Supabase.
- [ ] Con usuario logueado, score se envía al game over.
- [ ] Sin usuario logueado, score no se intenta enviar (sin error).
- [ ] Score submitido aparece en `/hall` al recargar.
- [ ] `/game/frog-duel` (página detalle) muestra datos del juego desde Supabase.
- [ ] GameLoader muestra el juego (no "EN DESARROLLO").
- [ ] Cover CSS se muestra correctamente en library y página de detalle.
- [ ] Aviso mobile se muestra en pantallas pequeñas.
- [ ] Leyenda de controles específica visible en página de juego.
- [ ] Navegar fuera del juego detiene game loop y limpia listeners.
- [ ] `npm run dev` sin errores en consola.
- [ ] No hay errores de TypeScript.

## Decisions

- **Yes:** Categoría VERSUS. El juego es fundamentalmente competitivo: 2 jugadores compitiendo en el mismo tablero. Encaja perfectamente en VERSUS, categoría sub-representada en la plataforma (0 implementados, 1 pendiente).
- **Yes:** Color yellow. Complementa cyan (J1 rana) y es uno de los colores neón de la plataforma. Diferente de cyan (Rana Espacial) y magenta (Cruza y Dispara).
- **Yes:** Casillas neutrales reclamables (vs casillas fijas por jugador). Crea competencia directa: ambos quieren las mismas casillas. Decisión estratégica sobre cuál casilla ir primero. Más dinámico que asignar casillas fijas.
- **No:** Casillas fijas (3 para J1, 2 para J2). Menos interesante. Un jugador tendría ventaja numérica.
- **Yes:** Mecánica de empujón solo en zona de río. Zona de río tiene plataformas compartidas (troncos), creando proximidad forzada. Empujón en carretera sería confuso y difícil de ejecutar con movimiento discreto.
- **No:** Empujón en cualquier zona. En carretera, ambas ranas rara vez coinciden en misma celda. Sería inconsistente.
- **Yes:** Troncos con capacidad (cortos = 1 rana). Crea momentos de tensión: si el único tronco es corto y ambos lo necesitan, hay conflicto directo. Incentiva empujón natural.
- **Yes:** Power-ups neutrales (cualquiera los recoge). Agrega carrera por recursos. El freeze es agresivo pero temporal (2 seg). No rompe el juego.
- **No:** Power-ups específicos por jugador. Más complejo de implementar y comunicar. Neutral es más justo.
- **Yes:** Mejor de 3 rondas. Partidas más largas y dramáticas. Permite remontada. Estándar en juegos VERSUS.
- **No:** Una sola ronda. Demasiado corto para VERSUS. Sin tensión de serie.
- **Yes:** Modo singleplayer fallback. Un solo jugador puede disfrutar el juego sin necesitar a alguien más. El score se submitea normalmente. Inclusivo.
- **Yes:** Score del ganador se submitea. En leaderboard, solo importa el mejor score. Submitir el del ganador es consistente con el sistema existente (1 score por partida).
- **Yes:** Canvas 800×600. Consistente con plataforma. 2 ranas de 26px caben bien.
- **Yes:** Timer 90 seg (más largo que variantes single-player). Dos jugadores necesitan más tiempo para maniobrar, empujar y reclamar casillas. 90 seg da espacio para estrategia.

## Risks

| Risk                                                          | Mitigation                                                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Event listeners de teclado interfieren con navegación Next.js | Listeners en window con cleanup en useEffect return. `e.preventDefault()` solo para teclas del juego. |
| Memory leak por requestAnimationFrame sin cancelar            | Cleanup guarda id de RAF y llama `cancelAnimationFrame`. Patrón probado en juegos anteriores.         |
| Ghosting de teclado: teclas WASD + flechas simultáneamente    | Tested en teclados comunes. WASD y flechas están en zonas separadas, ghosting es raro. Disclaimer.    |
| Empujón se siente injusto o confuso                           | Animación clara de empujón. Solo en zona de río (contexto predecible). Sonido visual al empujar.      |
| Modo singleplayer se activa por error (J2 tarda en empezar)   | Ventana de detección de 5 seg es generosa. Pantalla pre-ronda indica controles de ambos jugadores.    |
| Power-up freeze es demasiado poderoso                         | Duración corta (2 seg). Solo 1 freeze activo a la vez en el campo. Jugador congelado no muere.        |
| Balance de casillas: un jugador puede dominar                 | Casillas neutrales equilibran naturalmente: si J1 tiene 3, J2 tiene acceso a las 2 restantes.         |

## What is **not** in this spec

- Sonido y efectos de audio.
- Controles táctiles / botones virtuales para mobile.
- Canvas responsive (escalado al viewport).
- Modo online (networking/WebSocket).
- Modo contra IA.
- Más de 2 jugadores.
- Power-ups adicionales (teletransporte, invisibilidad, etc.).
- Personalización visual de ranas.

Cada uno de esos, si se implementa, va en su propio spec.
