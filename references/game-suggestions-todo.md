# Registro de Sugerencias de Juegos — Arcade Vault

> Este archivo es mantenido por el agente `game-planner`.
> No editarlo manualmente salvo para cambiar el estado de una sugerencia.

## Estado de categorías

| Categoría | Implementados | Pendientes | Sugeridos |
| --------- | ------------- | ---------- | --------- |
| ARCADE    | 3             | 3          | 3         |
| PUZZLE    | 0             | 1          | 6         |
| SHOOTER   | 1             | 1          | 5         |
| VERSUS    | 0             | 1          | 5         |

## Sugerencias

<!-- Formato por entrada:
### <Nombre>
- **Fecha:** YYYY-MM-DD
- **ID:** `slug`
- **Categoría:** X
- **Color:** X
- **Estado:** Sugerido | Aprobado | Rechazado | Implementado
- **Descripción:** Una línea
- **Score:** Mecanismo de puntuación
- **Controles:** Teclas
- **Complejidad:** Simple | Media | Compleja
- **Notas:** Justificación o razón de rechazo
-->

### BURBUJA POP

- **Fecha:** 2026-10-19
- **ID:** `burbuja-pop`
- **Categoria:** PUZZLE
- **Color:** yellow
- **Estado:** Sugerido
- **Descripcion:** Dispara burbujas y revienta grupos de colores neon
- **Score:** Puntos por grupo reventado (base x cantidad), bonus por burbujas huerfanas que caen, multiplicador por combos consecutivos
- **Controles:** Flechas izquierda/derecha para apuntar, Espacio o flecha arriba para disparar
- **Complejidad:** Media
- **Notas:** Inspirado en Puzzle Bobble (Taito, 1994). La categoria PUZZLE solo tiene 1 juego pendiente (caida), y este es mecanicamente muy diferente (disparar vs apilar). Visualmente espectacular con circulos neon sobre fondo oscuro. Grid hexagonal de burbujas, linea de mira, y fisica de rebote contra paredes. Todo factible en canvas puro a 800x600.

### NEURO GRID

- **Fecha:** 2026-10-19
- **ID:** `neuro-grid`
- **Categoria:** PUZZLE
- **Color:** green
- **Estado:** Sugerido
- **Descripcion:** Memoriza patrones neon y reproducilos en orden inverso
- **Score:** Puntos base por tile correcta (10 pts), multiplicador por combo (x2 a x5), bonus por nivel perfecto (nivel x 100), bonus por tiempo restante
- **Controles:** Flechas para mover cursor, Espacio para seleccionar tile, R para reiniciar nivel
- **Complejidad:** Media
- **Notas:** Cuadricula de 5x5 destella secuencias de tiles neon que el jugador reproduce en orden inverso. Cada nivel agrega mas tiles y reduce tiempo de visualizacion. 3 vidas. Combos activan multiplicadores. Twist de "orden inverso" lo diferencia de Simon Says generico. Factible en canvas: grid de tiles con colores solidos, animaciones de destello.

### RICOCHET

- **Fecha:** 2026-10-19
- **ID:** `ricochet`
- **Categoria:** SHOOTER
- **Color:** cyan
- **Estado:** Sugerido
- **Descripcion:** Rebota tus disparos neon contra las paredes para eliminar enemigos
- **Score:** 100 pts por enemigo, bonus por rebotes (x1.5 por rebote adicional), bonus de precision, bonus por municion sobrante
- **Controles:** Flechas para mover, WASD para apuntar, Espacio para disparar
- **Complejidad:** Media
- **Notas:** Shooter top-down con balas que rebotan en paredes. Enemigos detras de barreras indestructibles, solo alcanzables por rebote. Municion limitada: precision es clave. Introduce tiro indirecto/estrategico a SHOOTER. Fisica de rebote straightforward con vectores de reflexion en canvas.

### SIGNAL CLASH

- **Fecha:** 2026-10-19
- **ID:** `signal-clash`
- **Categoria:** VERSUS
- **Color:** magenta
- **Estado:** Sugerido
- **Descripcion:** Descifra senales enemigas y contraataca con el patron correcto
- **Score:** 50 pts por defensa correcta, 100 pts por ronda ganada, bonus por defensa perfecta, multiplicador por contraataques consecutivos
- **Controles:** J1: WASD (cada tecla = un color), J2: Flechas (cada flecha = un color)
- **Complejidad:** Media
- **Notas:** Duelo donde cada jugador envia secuencias de 2-4 simbolos de color. Receptor presiona teclas del patron antes de que llegue. Defensa exitosa contraataca. Fallo reduce HP. Senales doradas requieren patron invertido. Combina reflejos con memoria a corto plazo. Factible en canvas.

### PIXEL TAG

- **Fecha:** 2026-10-19
- **ID:** `pixel-tag`
- **Categoria:** VERSUS
- **Color:** yellow
- **Estado:** Sugerido
- **Descripcion:** Persigue o escapa en una arena neon llena de obstaculos
- **Score:** 10 pts/seg como presa, 50 pts por atrapar como cazador, bonus por power-ups y ronda ganada
- **Controles:** J1: WASD + Q (power-up), J2: Flechas + Shift (power-up)
- **Complejidad:** Simple
- **Notas:** Arena donde uno es cazador y otro presa. Tocar intercambia roles. Obstaculos dinamicos. Power-ups: velocidad, teletransporte, escudo 3s, trampa. Rondas de 60 seg. Mecanica de tag intuitiva, tension competitiva inmediata. Canvas: sprites simples, colision AABB, particulas.

### GRAVITY SURGE

- **Fecha:** 2026-10-19
- **ID:** `gravity-surge`
- **Categoria:** ARCADE
- **Color:** green
- **Estado:** Sugerido
- **Descripcion:** Invierte la gravedad para esquivar obstaculos a velocidad neon
- **Score:** 1 pt/frame sobrevivido, 25 pts por cristal, 100 pts por zona invertida, multiplicador por distancia
- **Controles:** Espacio/flecha arriba para invertir gravedad, flecha abajo para dash
- **Complejidad:** Simple
- **Notas:** Runner horizontal con esfera neon. Una tecla invierte gravedad entre piso y techo. Medidor de surge limita inversiones. Cristales recargan energia. Velocidad aumenta gradualmente. Gameplay un-boton accesible pero dificil de dominar. Canvas: scroll horizontal con parallax, geometrias neon.

### LABERINTO NEON

- **Fecha:** 2026-10-19
- **ID:** `laberinto-neon`
- **Categoria:** PUZZLE
- **Color:** green
- **Estado:** Sugerido
- **Descripcion:** Escapa del laberinto procedural antes de que el tiempo se agote
- **Score:** Puntos base por laberinto completado (escala con nivel), bonus por tiempo restante, multiplicador por consecutivos sin morir
- **Controles:** Flechas o WASD
- **Complejidad:** Media
- **Notas:** Inspirado en Maze Craze (Atari, 1978). Laberintos generados proceduralmente con backtracking. Cada nivel mas grande, menos tiempo. Paredes trampa, niebla de guerra opcional, trail luminoso. Mecanica unica de navegacion espacial. Grid de celdas ideal para canvas.

### SALTADOR NEON

- **Fecha:** 2026-10-19
- **ID:** `saltador-neon`
- **Categoria:** ARCADE
- **Color:** cyan
- **Estado:** Sugerido
- **Descripcion:** Salta entre plataformas neon y escala lo mas alto posible
- **Score:** 1 pt por pixel de altura, 50 pts por estrella, 100 pts por plataforma especial, combo por saltos perfectos
- **Controles:** Flechas izquierda/derecha, salto automatico al aterrizar, Espacio para power-up
- **Complejidad:** Media
- **Notas:** Inspirado en Ice Climber (NES, 1985). Plataformas verticales infinitas procedurales. Tipos: solidas, moviles, desvanecientes, resorte. Camara sigue al jugador, caer fuera = game over. Canvas: rectangulos neon, sprite simple, parallax de estrellas.

### SOKOBAN NEON

- **Fecha:** 2026-10-19
- **ID:** `sokoban-neon`
- **Categoria:** PUZZLE
- **Color:** magenta
- **Estado:** Sugerido
- **Descripcion:** Empuja las cajas neon a sus destinos con el minimo de movimientos
- **Score:** 1000 pts base por nivel, bonus por movimientos minimos, bonus por tiempo rapido, multiplicador por niveles consecutivos sin reiniciar
- **Controles:** Flechas/WASD para mover, R reiniciar, N siguiente nivel
- **Complejidad:** Media
- **Notas:** Inspirado en Sokoban (Thinking Rabbit, 1982). Puzzle de logica pura sin presion de tiempo. Solo empujar (no jalar), una caja a la vez. 50+ niveles progresivos. Diversifica PUZZLE respecto a juegos de ritmo rapido. Grid de tiles extremadamente simple en canvas.

### RITMO BINARIO

- **Fecha:** 2026-10-19
- **ID:** `ritmo-binario`
- **Categoria:** ARCADE
- **Color:** yellow
- **Estado:** Sugerido
- **Descripcion:** Golpea las notas neon al ritmo perfecto y encadena combos
- **Score:** Perfect 100, Good 50, Miss 0. Multiplicador por combo (x2-x4). Bonus 500 por cancion sin fallos
- **Controles:** D, F, J, K para 4 carriles. Espacio para pausar
- **Complejidad:** Compleja
- **Notas:** Inspirado en DDR (Konami, 1998) y Guitar Hero. 4 carriles verticales con notas cayendo. Ventanas de timing: Perfect +-30ms, Good +-80ms. Web Audio API para beats sintetizados. Genero ritmo completamente nuevo en la plataforma. Canvas maneja bien 4 carriles a 800x600.

### TUBERIAS NEON

- **Fecha:** 2026-10-19
- **ID:** `tuberias-neon`
- **Categoria:** PUZZLE
- **Color:** cyan
- **Estado:** Sugerido
- **Descripcion:** Conecta las tuberias antes de que el flujo neon te alcance
- **Score:** 10 pts por segmento atravesado, 5 pts por extras colocados antes del flujo, bonus por piezas especiales, multiplicador por nivel
- **Controles:** Flechas mover cursor, Espacio colocar pieza, R rotar, Tab ver siguiente
- **Complejidad:** Media
- **Notas:** Inspirado en Pipe Dream (Lucasfilm Games, 1989). Colocar piezas de tuberia en grid para crear camino continuo. Flujo neon avanza despues de delay. Piezas: rectas, codos, cruces, especiales. Mecanica unica de construccion bajo presion temporal. Canvas: grid de celdas, trazos neon, flujo animado.

### CICLO NEON

- **Fecha:** 2026-10-19
- **ID:** `ciclo-neon`
- **Categoria:** VERSUS
- **Color:** magenta
- **Estado:** Sugerido
- **Descripcion:** Dos pilotos de luz, una arena, el ultimo en pie gana
- **Score:** 100 pts por ronda ganada, +10 por segundo de supervivencia, multiplicador por rachas. Mejor de 5 rondas
- **Controles:** J1: WASD, J2: Flechas. Espacio para iniciar ronda
- **Complejidad:** Simple
- **Notas:** Inspirado en Tron Light Cycles (1982). Cada jugador deja estela de luz permanente, chocar con cualquier estela o pared elimina. Grid de celdas, deteccion por lookup en array 2D. Renderizado simple, estetica neon perfecta. Mecanicamente distinto a duelo-pixel (pong).

### COMANDO MISIL

- **Fecha:** 2026-10-19
- **ID:** `comando-misil`
- **Categoria:** SHOOTER
- **Color:** cyan
- **Estado:** Sugerido
- **Descripcion:** Defiende tus ciudades de la lluvia de misiles enemigos
- **Score:** 25 pts por misil destruido, 100 bonus por ciudad sobreviviente por oleada, multiplicador creciente, bonus masivo por oleada perfecta
- **Controles:** Flechas para mover mira, Espacio para disparar, 1-3 para seleccionar base
- **Complejidad:** Media
- **Notas:** Inspirado en Missile Command (Atari, 1980). Controlas mira, no nave. Explosiones circulares expandibles crean cadenas. Mecanica de defensa de posicion distinta a shooters de nave. Trayectorias lineales, colision circular. Visualmente espectacular con trazos neon. Canvas puro viable.

### TANQUE ARENA

- **Fecha:** 2026-10-19
- **ID:** `tanque-arena`
- **Categoria:** VERSUS
- **Color:** yellow
- **Estado:** Sugerido
- **Descripcion:** Dos tanques, paredes destructibles, un solo ganador
- **Score:** 200 pts por impacto, 10 por destruir pared, multiplicador por rachas sin dano, bonus por victoria rapida. Mejor de 5 rondas
- **Controles:** J1: WASD + Q disparar, J2: Flechas + Espacio disparar. Enter para iniciar
- **Complejidad:** Media
- **Notas:** Inspirado en Tank (Atari, 1974) y Combat. Combate directo con proyectiles en arena con paredes destructibles. Jugadores crean nuevas lineas de tiro destruyendo paredes. Movimiento con rotacion, colision rectangular, proyectiles lineales. Canvas viable.

### CENTIPEDO

- **Fecha:** 2026-10-19
- **ID:** `centipedo`
- **Categoria:** SHOOTER
- **Color:** magenta
- **Estado:** Sugerido
- **Descripcion:** Dispara al ciempies mientras esquivas hongos y aranas
- **Score:** 10 por segmento, 100 por cabeza, 1 por hongo, 300-900 por arana, 200 por pulga. Multiplicador por nivel
- **Controles:** Flechas para mover en zona inferior, Espacio para disparar (automatico si se mantiene)
- **Complejidad:** Media
- **Notas:** Inspirado en Centipede (Atari, 1981). Enemigo serpentea entre hongos y se divide al ser golpeado. Campo de hongos emergente cambia cada partida. Patron unico diferente a asteroids (360) e invasores (filas). Colision basada en grid de hongos. Canvas 800x600 sin limitaciones.

### GALAGA NEON

- **Fecha:** 2026-10-19
- **ID:** `galaga-neon`
- **Categoria:** SHOOTER
- **Color:** magenta
- **Estado:** Sugerido
- **Descripcion:** Oleadas de naves enemigas con patrones de ataque kamikaze
- **Score:** 10-50 pts por enemigo segun tipo, x2 por acertar en picada kamikaze, 1000 pts ronda bonus perfecta, multiplicador por nivel sin perder vida
- **Controles:** Flechas izquierda/derecha para mover, Espacio para disparar, Z disparo automatico
- **Complejidad:** Media
- **Notas:** Inspirado en Galaga (Namco, 1981). Enemigos con patrones de vuelo curvos, picadas kamikaze, ataques en formacion. Etapas bonus (challenging stages). Requiere sistema de patrones bezier. Sprites simples con glow neon, campo de estrellas de fondo. Canvas factible.

### CAZA ESTELAR

- **Fecha:** 2026-10-19
- **ID:** `caza-estelar`
- **Categoria:** SHOOTER
- **Color:** yellow
- **Estado:** Sugerido
- **Descripcion:** Pilota tu caza espacial a traves de oleadas interminables
- **Score:** 10-100 pts por enemigo, 50 por power-up, 200 por formacion completa, 500-2000 por jefes. Multiplicador por kills sin dano (x1-x5)
- **Controles:** Flechas para mover, Espacio disparo principal, Z bomba especial, P pausa
- **Complejidad:** Compleja
- **Notas:** Inspirado en 1942 (Capcom, 1984) y Raiden (Seibu, 1990). Vertical scroller con nave libre en area inferior. Oleadas, spawner de enemigos, power-ups (doble disparo, escudo, bomba), mini-bosses. Mayor complejidad pero muy rejugable. Parallax de estrellas clasico en canvas.
