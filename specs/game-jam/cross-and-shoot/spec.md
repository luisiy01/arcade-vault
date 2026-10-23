# SPEC GJ-02 — Cruza y Dispara: integración en Arcade Vault

> **Status:** Propuesto
> **Depends on:** SPEC 04, SPEC 05, SPEC 06
> **Date:** 2026-10-23
> **Objective:** Integrar Cruza y Dispara como juego jugable en la plataforma, creando la lógica desde cero siguiendo el patrón establecido por Asteroids (SPEC 05) con submit de scores a Supabase (SPEC 06). Es un híbrido Frogger + shooter donde la rana tiene un blaster neón para abrirse camino.

## Scope

**In:**

- Módulo de lógica `lib/games/cross-and-shoot.ts` creado desde cero.
- Componente React wrapper `components/games/cross-and-shoot.tsx` con `useRef`/`useEffect`, `useAuth()` y `submitScore()`.
- Registro en `components/game-loader.tsx` con dynamic import y entrada en `GAME_MAP`.
- INSERT del registro en tabla `games` de Supabase.
- Cover CSS en `app/globals.css` (clase `.cover-cross-and-shoot`).
- Leyenda de controles específica en la página de juego.
- Canvas de 800×600.
- Tablero estilo Frogger clásico: zona de carretera con vehículos, zona mediana segura, zona de río con troncos y tortugas.
- Mecánica de disparo: la rana tiene un blaster neón que dispara hacia adelante (arriba). Puede destruir vehículos temporalmente para crear huecos en el tráfico.
- Munición limitada (15 disparos iniciales). Pickups de munición en la carretera.
- Vehículos blindados que requieren 2 impactos. Vehículos que disparan de vuelta.
- 5 casillas seguras en la parte superior.
- 3 vidas. Timer de 45 segundos por intento de cruce.
- Score submit a Supabase al game over vía callback `onGameOver`.

**Out of scope (para futuros specs):**

- Sonido y efectos de audio.
- Controles táctiles / botones virtuales para mobile.
- Canvas responsive (escalado al viewport).
- Armas alternativas o sistema de upgrades.
- Modo cooperativo o multijugador.
- Boss fights al final de niveles.

## Data model

No se introducen nuevas estructuras de datos. Se reutiliza `Game` y `Score` de `lib/supabase/types.ts` (SPEC 06).

### Estado interno del juego (encapsulado en closure)

```ts
// Constantes
const CANVAS_W = 800;
const CANVAS_H = 600;
const ROWS = 14; // inicio + 5 carretera + segura + 5 río + casillas
const ROW_H = Math.floor(CANVAS_H / ROWS); // ~42px por fila
const FROG_SIZE = 28;
const BULLET_SPEED = 8; // px/frame
const BULLET_SIZE = 4;
const MAX_AMMO = 15;
const ENEMY_BULLET_SPEED = 3;
const VEHICLE_RESPAWN_TIME = 3000; // ms antes de que un vehículo destruido reaparezca
const TIMER_SECONDS = 45;

// Tipos de vehículo
type VehicleType = 'car' | 'truck' | 'armored' | 'shooter';

interface Vehicle {
  x: number;
  y: number;
  w: number; // car=60, truck=120, armored=80, shooter=70
  h: number;
  speed: number;
  type: VehicleType;
  hp: number; // car=1, truck=1, armored=2, shooter=1
  destroyed: boolean;
  respawnTimer: number; // countdown para reaparecer
  shootCooldown: number; // solo para shooter
}

// Proyectil del jugador
interface Bullet {
  x: number;
  y: number;
  active: boolean;
}

// Proyectil enemigo
interface EnemyBullet {
  x: number;
  y: number;
  vy: number; // siempre positivo (hacia abajo, hacia la rana)
  active: boolean;
}

// Pickup de munición
interface AmmoPickup {
  x: number;
  y: number;
  row: number;
  collected: boolean;
  amount: number; // 3-5 balas
}

// Troncos y tortugas (zona de río)
type LogType = 'log' | 'turtle' | 'sinking-turtle';

interface Log {
  x: number;
  y: number;
  w: number;
  speed: number;
  type: LogType;
  sinkTimer: number;
  isSunk: boolean;
}

// Rana
interface Frog {
  x: number;
  y: number;
  row: number;
  onLog: Log | null;
  facing: 'up' | 'down' | 'left' | 'right'; // dirección de disparo (siempre up)
}

// Estado mutable (dentro de closure, no exportado)
// frog: Frog
// lives: number (inicia en 3)
// score: number
// ammo: number (inicia en MAX_AMMO)
// timer: number (45 seg countdown)
// homes: boolean[] — 5 casillas, true si ocupada
// homedCount: number
// vehicles: Vehicle[][] — vehículos por fila de carretera
// logs: Log[][] — troncos/tortugas por fila de río
// bullets: Bullet[] — proyectiles del jugador activos
// enemyBullets: EnemyBullet[] — proyectiles enemigos activos
// ammoPickups: AmmoPickup[] — pickups activos
// gameState: 'playing' | 'paused' | 'gameover'
// level: number
```

### Scoring

- **+50 puntos** por vehículo destruido (cualquier tipo).
- **+25 puntos bonus** por vehículo blindado destruido (adicional a los 50).
- **+200 puntos** por rana que llega a casilla segura.
- **+tiempo restante x 2** en puntos al llegar a casilla.
- **+10 puntos** por cada fila avanzada (primera vez en ese intento).
- **Bonus de precisión:** al llegar a casilla, si precisión > 75%, +100 pts extra.
- **+500 puntos** al llenar las 5 casillas (nivel completo).
- Al completar nivel: más vehículos, más blindados, más shooters, menos munición inicial, troncos más rápidos.
- **Game over:** 0 vidas restantes. Se pierde vida al: ser atropellado, caer al agua, recibir disparo enemigo, timer a 0, salir del canvas.
- **Multiplicador de nivel:** score base x nivel actual.

### Registro Supabase

```sql
INSERT INTO games (id, title, short, long, cat, cover, color, best, plays)
VALUES (
  'cross-and-shoot',
  'CRUZA Y DISPARA',
  'Frogger con blaster: dispara vehículos para abrirte camino.',
  'Híbrido de Frogger y shooter donde la rana tiene un blaster neón. Cruza la carretera disparando a los vehículos para crear huecos temporales, pero la munición es limitada. Cuidado con los blindados que necesitan dos impactos y los vehículos que disparan de vuelta. Recoge munición en el campo y navega los troncos del río para llegar a las casillas seguras. Precisión y timing son la clave — ¿cuánto score puedes acumular?',
  'SHOOTER',
  'cover-cross-and-shoot',
  'magenta',
  0,
  '0'
);
```

## Implementation plan

1. **Crear `lib/games/cross-and-shoot.ts`:** módulo TypeScript desde cero.
   - Exportar `startCrossAndShoot(canvas: HTMLCanvasElement, options?: CrossAndShootOptions): () => void`.
   - `CrossAndShootOptions` incluye `onGameOver?: (score: number) => void`.
   - Recibir canvas como parámetro, no usar `document.getElementById`.
   - Encapsular todo estado en closure.
   - **Configuración de filas:** 14 filas de abajo a arriba: fila 0 (inicio), filas 1-5 (carretera), fila 6 (mediana segura), filas 7-11 (río con troncos), fila 12-13 (casillas seguras, 5 slots).
   - **Vehículos:** 4 tipos.
     - `car`: ancho 60px, hp 1, velocidad media. Color: contorno magenta.
     - `truck`: ancho 120px, hp 1, velocidad lenta. Color: contorno magenta oscuro.
     - `armored`: ancho 80px, hp 2, velocidad media. Color: contorno amarillo (indica resistencia). Primer impacto lo daña visualmente, segundo lo destruye.
     - `shooter`: ancho 70px, hp 1, velocidad media. Color: contorno rojo. Dispara un proyectil hacia abajo cada 2-3 segundos.
   - **Vehículos destruidos:** al recibir suficientes impactos, el vehículo se marca como `destroyed`, deja de renderizarse y colisionar, y reaparece tras `VEHICLE_RESPAWN_TIME` (3 seg). Esto crea un hueco temporal en el tráfico.
   - **Disparo del jugador:** al presionar Espacio, si `ammo > 0`, se crea un `Bullet` en la posición de la rana moviéndose hacia arriba a `BULLET_SPEED`. Un solo proyectil activo a la vez (debe impactar o salir del canvas para disparar otro). Resta 1 de ammo.
   - **Proyectiles enemigos:** vehículos tipo `shooter` crean `EnemyBullet` que se mueve hacia abajo. Colisión con rana = muerte.
   - **Pickups de munición:** aparecen aleatoriamente en filas de carretera (1-3 por nivel). Al caminar sobre ellos: +3-5 balas. Visual: pequeño rectángulo parpadeante color magenta.
   - **Troncos y tortugas:** zona de río funciona como Frogger clásico. Troncos de ancho variable. Tortugas normales y tortugas que se hunden. La rana NO puede disparar mientras está en zona de río (justificación: necesita ambas manos para agarrarse).
   - **Colisiones:**
     - Bullet vs Vehicle: AABB. Reduce hp, destruye si hp <= 0.
     - Frog vs Vehicle (no destruido): AABB = muerte.
     - EnemyBullet vs Frog: AABB = muerte.
     - Frog vs Log: AABB. Si está en zona río y no sobre tronco/tortuga = cae al agua (muerte).
     - Frog vs AmmoPickup: AABB = recoge.
   - **Rendering:**
     - Fondo: #0a0a0f base.
     - Carretera: filas con líneas discontinuas entre carriles (patrón Frogger), tonos gris oscuro.
     - Mediana: franja verde neón con arbustos estilizados.
     - Río: filas azul oscuro con ondas sutiles.
     - Vehículos: rectángulos con contorno neón según tipo, relleno semi-transparente. Blindados con escudo visible. Shooters con cañón.
     - Vehículos destruidos: efecto de explosión breve (círculo expandiéndose + fade), luego desaparecen.
     - Troncos: rectángulos marrones con borde neón.
     - Tortugas: círculos verdes. Sinking: parpadean antes de hundirse.
     - Rana: sprite cuadrado con blaster visible (línea magenta en la cabeza). Color base: magenta brillante con contorno blanco.
     - Bullets del jugador: línea vertical magenta brillante con glow.
     - Bullets enemigos: línea vertical roja con glow.
     - Pickups: rectángulo pequeño magenta parpadeante con icono de bala.
     - Casillas: 5 arcos en la parte superior. Ocupadas se llenan con color.
   - **HUD:** Score arriba-izquierda, vidas arriba-centro, timer arriba-derecha, munición (icono bala x cantidad) abajo-izquierda, precisión (%) abajo-derecha.
   - **Pantalla de game over:** overlay con score final, vehículos destruidos, precisión total.
   - Listeners de teclado en `window` con cleanup. Flechas para mover (salto discreto por fila/columna como Frogger clásico), Espacio para disparar, P/Escape para pausa.
   - `e.preventDefault()` solo para teclas del juego.
   - Retornar cleanup function que cancela `requestAnimationFrame` y remueve listeners.
   - Punto de integración `onGameOver`: llamar `options.onGameOver?.(score)` cuando `gameState` cambia a `'gameover'`.

2. **Crear `components/games/cross-and-shoot.tsx`:** Client Component.
   - `useRef<HTMLCanvasElement>` + `useEffect` llamando `startCrossAndShoot(canvas, { onGameOver })`.
   - `useAuth()` para contexto de usuario.
   - En `onGameOver`: si hay usuario logueado, llamar `submitScore('cross-and-shoot', playerName, score)`.
   - Canvas con `width={800} height={600}`, `tabIndex={0}`, `autoFocus`.
   - Cleanup en return de `useEffect`.

3. **Registrar en `components/game-loader.tsx`:**
   - Agregar dynamic import: `const CrossAndShootGame = dynamic(() => import('@/components/games/cross-and-shoot').then(m => m.CrossAndShootGame), { ssr: false })`.
   - Agregar entrada en `GAME_MAP`: `'cross-and-shoot': CrossAndShootGame`.

4. **Crear cover CSS en `app/globals.css`:** clase `.cover-cross-and-shoot` con gradientes CSS. Fondo oscuro con carretera diagonal, destellos de disparos magenta. `::after` para silueta de rana con blaster. `::before` para explosiones de vehículos. Seguir patrón de `.cover-asteroids`.

5. **Insertar registro en Supabase:** ejecutar INSERT en tabla `games` con datos del juego.

6. **Actualizar leyenda de controles:** en la página de juego, agregar controles específicos: "← → ↑ ↓ MOVER · ESPACIO DISPARAR · P PAUSA".

7. **Verificar:** `npm run dev`, navegación a `/game/cross-and-shoot`, gameplay completo, disparo y destrucción de vehículos, munición limitada, score submit, aparición en `/hall`.

## Acceptance criteria

- [ ] `/game/cross-and-shoot` carga y muestra el juego.
- [ ] Juego renderiza en canvas de 800×600.
- [ ] Tablero muestra filas de carretera, mediana, río y casillas.
- [ ] Vehículos se mueven horizontalmente con wrap-around.
- [ ] 4 tipos de vehículos visualmente distintos (car, truck, armored, shooter).
- [ ] Espacio dispara proyectil hacia arriba (consume munición).
- [ ] Proyectil destruye vehículos normales en 1 impacto.
- [ ] Vehículos blindados requieren 2 impactos (feedback visual en primer impacto).
- [ ] Vehículos destruidos desaparecen temporalmente (crean hueco) y reaparecen tras 3 seg.
- [ ] Vehículos shooter disparan proyectiles hacia abajo periódicamente.
- [ ] Proyectil enemigo mata a la rana al impactar.
- [ ] Munición limitada, se muestra en HUD.
- [ ] Pickups de munición aparecen en la carretera y recargan al recogerlos.
- [ ] No se puede disparar en zona de río.
- [ ] Troncos y tortugas funcionan como Frogger clásico.
- [ ] Tortugas sinking se hunden periódicamente.
- [ ] Al llegar a casilla: +200 pts + bonus tiempo + bonus precisión.
- [ ] Al llenar 5 casillas: +500 bonus, nivel incrementa.
- [ ] Timer de 45 seg por intento.
- [ ] 3 vidas, game over al perder todas.
- [ ] Score y precisión se muestran en HUD.
- [ ] Game over muestra overlay con score final y estadísticas.
- [ ] P/Escape pausa y reanuda el juego.
- [ ] Con usuario logueado, score se envía a Supabase al game over.
- [ ] Sin usuario logueado, score no se intenta enviar (sin error).
- [ ] Score submitido aparece en `/hall` al recargar.
- [ ] `/game/cross-and-shoot` (página detalle) muestra datos del juego desde Supabase.
- [ ] GameLoader muestra el juego (no "EN DESARROLLO").
- [ ] Cover CSS se muestra correctamente en library y página de detalle.
- [ ] Aviso mobile se muestra en pantallas pequeñas.
- [ ] Leyenda de controles específica visible en página de juego.
- [ ] Navegar fuera del juego detiene game loop y limpia listeners.
- [ ] `npm run dev` sin errores en consola.
- [ ] No hay errores de TypeScript.

## Decisions

- **Yes:** Categoría SHOOTER. La mecánica de disparo es central al gameplay. Sin el blaster, sería un Frogger genérico. El disparo transforma la experiencia de pasiva a activa.
- **Yes:** Color magenta. Diferencia del cyan de Rana Espacial y del yellow del Duelo Anfibio. Magenta combina bien con estética de disparos y explosiones.
- **Yes:** Movimiento discreto (salto por celda) en vez de continuo. Frogger clásico usa movimiento discreto. Combinar movimiento continuo + disparo haría el juego demasiado parecido a un shooter genérico. El salto discreto mantiene la identidad Frogger.
- **No:** Movimiento continuo. Perdería la esencia de Frogger (timing de saltos).
- **Yes:** Un solo proyectil activo a la vez. Evita spam de disparos. Fuerza al jugador a ser preciso y estratégico con la munición limitada.
- **No:** Múltiples proyectiles simultáneos. Trivializaría la zona de carretera. Sin tensión de munición.
- **Yes:** No disparar en zona de río. Justificación narrativa (rana se agarra al tronco). Gameplay: la zona de río mantiene su desafío clásico de plataformas. Disparar en río haría esa sección trivial.
- **No:** Disparar en todas las zonas. Eliminaría la dualidad shooter/platformer que hace único al juego.
- **Yes:** Vehículos reaparecen tras 3 seg. Los huecos son temporales, no permanentes. El jugador debe aprovechar la ventana de tiempo. Mantiene presión constante.
- **No:** Vehículos eliminados permanentemente. Sin respawn, niveles se vaciarían rápidamente. Sin desafío.
- **Yes:** 4 tipos de vehículos con comportamientos distintos. Variedad táctica. Blindados requieren planificación (gastar 2 balas). Shooters añaden urgencia.
- **Yes:** Canvas 800×600. Consistente con plataforma.
- **Yes:** Timer 45 seg (vs 60 en Rana Espacial). Más corto porque el disparo facilita el cruce. Compensa la ventaja del blaster.

## Risks

| Risk                                                          | Mitigation                                                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Event listeners de teclado interfieren con navegación Next.js | Listeners en window con cleanup en useEffect return. `e.preventDefault()` solo para teclas del juego. |
| Memory leak por requestAnimationFrame sin cancelar            | Cleanup guarda id de RAF y llama `cancelAnimationFrame`. Patrón probado en juegos anteriores.         |
| Munición se agota, jugador atascado sin disparos              | Pickups frecuentes. Nivel 1 generoso en munición. Sin munición, el juego sigue jugable como Frogger.  |
| Proyectiles enemigos hacen el juego demasiado difícil         | Shooters aparecen a partir de nivel 2. Proyectiles enemigos lentos (3 px/frame). Máximo 2 shooters.   |
| Muchas entidades en pantalla causan lag                       | Pool de objetos reutilizable. Máximo 30 vehículos + 20 troncos + 5 bullets. Colisiones AABB simples.  |
| Balance disparo vs cruce: jugador solo dispara y no cruza     | Timer corto (45 seg) obliga a avanzar. Disparar no da tantos puntos como llegar a casilla (+200).     |

## What is **not** in this spec

- Sonido y efectos de audio.
- Controles táctiles / botones virtuales para mobile.
- Canvas responsive (escalado al viewport).
- Armas alternativas o sistema de upgrades.
- Modo cooperativo o multijugador.
- Boss fights al final de niveles.
- Disparo en zona de río.

Cada uno de esos, si se implementa, va en su propio spec.
