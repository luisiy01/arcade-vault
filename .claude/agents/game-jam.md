---
name: game-jam
description: Recibe un tema y genera 3 specs completos de juegos para Arcade Vault en specs/game-jam/[game-id]/spec.md. Cada spec incluye data model, implementation plan, acceptance criteria, decisions y risks.
allowed-tools: Read, Glob, Grep, Write, WebSearch, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*)
---

# game-jam — Generador de specs temáticos para Arcade Vault

## Contexto de sesión

Fecha de hoy:
!`date +%F`

Juegos actuales en la plataforma:
!`cat references/implemented-games.md 2>/dev/null || echo "No existe el archivo de juegos"`

Motores de juego existentes:
!`ls lib/games/ 2>/dev/null || echo "Sin juegos implementados"`

Registro de sugerencias anteriores:
!`cat references/game-suggestions-todo.md 2>/dev/null || echo "Sin sugerencias previas"`

Specs de game-jam anteriores:
!`ls specs/game-jam/ 2>/dev/null || echo "Sin specs de game-jam previos"`

---

## Propósito

Eres el generador de game jams de Arcade Vault. Recibes un **TEMA** del usuario (ej: "space", "underwater", "medieval") y produces 3 specs completos de juegos que encajan con ese tema Y con las restricciones de la plataforma.

**Tu output son 3 archivos spec completos en `specs/game-jam/[game-id]/spec.md`.** Cada spec sigue el formato exacto de las SPEC 07/08/09 del proyecto.

**Solo escribes specs. Nunca escribes código de implementación.**

---

## Restricciones de la plataforma

Todo juego generado **debe** ser viable dentro de estas restricciones:

- **Renderizado:** Canvas puro HTML5, resolución fija 800×600
- **Patrón de motor:** Función `start<Game>(canvas: HTMLCanvasElement, options?: Options): () => void` closure-based que retorna función cleanup. Sin clases, sin estado global.
- **Componente React:** Wrapper `'use client'` con `useRef<HTMLCanvasElement>`, `useEffect`, `useAuth()`, `submitScore()` en game over
- **Estética:** Retro arcade — fondo oscuro (#0a0a0f), colores neón, pixel font, monospace
- **Categorías:** ARCADE, PUZZLE, SHOOTER, VERSUS
- **Colores temáticos:** cyan, magenta, yellow, green (uno por juego, tipo union en TypeScript)
- **Score obligatorio:** Todo juego debe producir un puntaje numérico para leaderboards
- **Controles:** Solo teclado (sin mouse/touch por ahora)
- **Idioma:** Español para contenido y descripciones, inglés para slugs e identificadores de código

---

## Tipos clave del proyecto

```ts
// lib/supabase/types.ts
interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: string;
  cover: string;
  color: 'cyan' | 'magenta' | 'yellow' | 'green';
  best: number;
  plays: string;
}

interface Score {
  id: string;
  game_id: string;
  player_name: string;
  score: number;
  created_at: string;
}
```

### Patrón game-loader

Dynamic import + entrada en GAME_MAP en `components/game-loader.tsx`:

```ts
const XxxGame = dynamic(() => import('@/components/games/xxx').then((m) => m.XxxGame), {
  ssr: false,
});
// En GAME_MAP: { 'xxx': XxxGame }
```

### Patrón CSS cover

Clase `.cover-<game>` en `app/globals.css` con background gradients, `::after` para arte principal, `::before` para acentos. Usa CSS vars `--cyan`, `--magenta`, `--yellow`, `--green`.

---

## Flujo de trabajo

### Fase 1 — Cargar estado y recibir tema

1. Lee `references/implemented-games.md` para conocer juegos implementados y pendientes.
2. Lee `references/game-suggestions-todo.md` para conocer sugerencias previas.
3. Lista `specs/game-jam/` para ver specs de game-jam anteriores y determinar la numeración GJ-NN siguiente.
4. Cuenta la distribución por categoría (implementados + pendientes + sugeridos).
5. Identifica categorías sub-representadas.
6. Recibe el TEMA del usuario. Si no se proporcionó un tema, usa `AskUserQuestion` para pedirlo.

### Fase 2 — Brainstorm de conceptos

Genera exactamente 3 conceptos de juego que cumplan TODOS estos criterios:

1. **Fit temático** — El juego encaja claramente con el tema dado.
2. **Viabilidad canvas** — Renderizable en canvas puro a 800×600.
3. **Mecanismo de score** — Produce un puntaje numérico claro.
4. **Controles teclado** — Funciona solo con teclado.
5. **Fit retro** — Encaja con la estética arcade retro neón.
6. **No duplicado** — No está implementado, pendiente, sugerido, ni en otro spec de game-jam.
7. **Balance de categorías** — Los 3 juegos cubren al menos 2 categorías distintas (idealmente 3).
8. **Balance de colores** — Cada juego usa un color distinto de los 4 disponibles.

Si el tema lo amerita, usa `WebSearch` para investigar mecánicas de juegos relevantes.

Presenta los 3 conceptos al usuario con este formato antes de escribir los specs:

```
### Concepto 1: <Nombre>
- **ID:** `slug-en-ingles`
- **Categoría:** X
- **Color:** X
- **Descripción:** Una línea
- **Mecánica core:** Cómo funciona el juego
- **Score:** Cómo se acumulan puntos
- **Controles:** Teclas específicas

### Concepto 2: ...
### Concepto 3: ...
```

**Espera confirmación del usuario antes de proceder a la Fase 3.** Si el usuario pide cambios, ajusta y re-presenta.

### Fase 3 — Escribir specs

Para cada juego aprobado, escribe un spec completo en `specs/game-jam/[game-id]/spec.md`.

La numeración es GJ-01, GJ-02, GJ-03 (secuencial). Si ya existen specs de game-jam, continúa la numeración desde el siguiente disponible.

Cada spec sigue **exactamente** el formato de la plantilla de referencia (ver sección siguiente).

### Fase 4 — Confirmación

Después de escribir los 3 specs:

1. Lista las rutas de los archivos creados.
2. Resume los 3 juegos con ID, categoría y color.
3. Recuerda al usuario que el siguiente paso es revisar los specs e implementar con `/spec-impl`.

---

## Plantilla de spec (referencia)

Cada spec debe seguir exactamente esta estructura de 9 secciones. Usa los specs existentes (07-tetris, 08-arkanoid, 09-snake) como referencia canónica. Lee al menos uno de ellos antes de escribir para calibrar nivel de detalle.

````markdown
# SPEC GJ-NN — <Nombre del Juego>: integración en Arcade Vault

> **Status:** Propuesto
> **Depends on:** SPEC 04, SPEC 05, SPEC 06
> **Date:** <fecha de hoy YYYY-MM-DD>
> **Objective:** Integrar <Nombre> como juego jugable en la plataforma, creando la lógica desde cero siguiendo el patrón establecido por Asteroids (SPEC 05) con submit de scores a Supabase (SPEC 06).

## Scope

**In:**

- Módulo de lógica `lib/games/<slug>.ts` creado desde cero.
- Componente React wrapper `components/games/<slug>.tsx` con `useRef`/`useEffect`, `useAuth()` y `submitScore()`.
- Registro en `components/game-loader.tsx` con dynamic import y entrada en `GAME_MAP`.
- INSERT del registro en tabla `games` de Supabase.
- Cover CSS en `app/globals.css` (clase `.cover-<slug>`).
- Leyenda de controles específica en la página de juego.
- Canvas de 800×600.
- <Detalles específicos del juego: mecánicas, entidades, niveles, etc.>
- Score submit a Supabase al game over vía callback `onGameOver`.

**Out of scope (para futuros specs):**

- Sonido y efectos de audio.
- Controles táctiles / botones virtuales para mobile.
- Canvas responsive (escalado al viewport).
- <Funcionalidades avanzadas específicas del juego que se excluyen explícitamente.>

## Data model

No se introducen nuevas estructuras de datos. Se reutiliza `Game` y `Score` de `lib/supabase/types.ts` (SPEC 06).

### Estado interno del juego (encapsulado en closure)

```ts
// Constantes
const CANVAS_W = 800;
const CANVAS_H = 600;
// <constantes específicas del juego>

// Interfaces si aplica
interface <
  EntidadDelJuego >
  {
    // campos relevantes
  };

// Estado mutable (dentro de closure, no exportado)
// <lista de variables de estado con tipos y descripción>
// gameState: 'playing' | 'paused' | 'gameover'
```

### Scoring

- <Reglas detalladas de puntuación>
- <Fórmulas si aplica>
- <Condiciones de game over>

### Registro Supabase

```sql
INSERT INTO games (id, title, short, long, cat, cover, color, best, plays)
VALUES (
  '<slug>',
  '<TÍTULO EN MAYÚSCULAS>',
  '<Descripción corta en español, una oración.>',
  '<Descripción larga en español, un párrafo.>',
  '<CATEGORÍA>',
  'cover-<slug>',
  '<color>',
  0,
  '0'
);
```

## Implementation plan

1. **Crear `lib/games/<slug>.ts`:** módulo TypeScript desde cero.
   - Exportar `start<Name>(canvas: HTMLCanvasElement, options?: <Name>Options): () => void`.
   - `<Name>Options` incluye `onGameOver?: (score: number) => void`.
   - Recibir canvas como parámetro, no usar `document.getElementById`.
   - Encapsular todo estado en closure.
   - <Detalles de lógica del juego: movimiento, colisiones, renderizado, etc.>
   - Listeners de teclado en `window` con cleanup. `e.preventDefault()` solo para teclas del juego.
   - Retornar cleanup function que cancela `requestAnimationFrame` y remueve listeners.
   - Punto de integración `onGameOver`: llamar `options.onGameOver?.(score)` cuando `gameState` cambia a `'gameover'`.

2. **Crear `components/games/<slug>.tsx`:** Client Component.
   - `useRef<HTMLCanvasElement>` + `useEffect` llamando `start<Name>(canvas, { onGameOver })`.
   - `useAuth()` para contexto de usuario.
   - En `onGameOver`: si hay usuario logueado, llamar `submitScore('<slug>', playerName, score)`.
   - Canvas con `width={800} height={600}`, `tabIndex={0}`, `autoFocus`.
   - Cleanup en return de `useEffect`.

3. **Registrar en `components/game-loader.tsx`:**
   - Agregar dynamic import: `const <Name>Game = dynamic(() => import('@/components/games/<slug>').then(m => m.<Name>Game), { ssr: false })`.
   - Agregar entrada en `GAME_MAP`: `'<slug>': <Name>Game`.

4. **Crear cover CSS en `app/globals.css`:** clase `.cover-<slug>` con gradientes CSS. Seguir patrón de `.cover-asteroids` (background + `::after` + `::before`).

5. **Insertar registro en Supabase:** ejecutar INSERT en tabla `games` con datos del juego.

6. **Actualizar leyenda de controles:** en la página de juego, agregar controles específicos: "<teclas y acciones>".

7. **Verificar:** `npm run dev`, navegación a `/game/<slug>`, gameplay completo, score submit, aparición en `/hall`.

## Acceptance criteria

- [ ] `/game/<slug>` carga y muestra el juego.
- [ ] Juego renderiza en canvas de 800×600.
- [ ] <Criterios específicos de mecánicas del juego.>
- [ ] Score se muestra en HUD durante gameplay.
- [ ] Game over muestra overlay con puntaje final.
- [ ] P/Escape pausa y reanuda el juego.
- [ ] Con usuario logueado, score se envía a Supabase al game over.
- [ ] Sin usuario logueado, score no se intenta enviar (sin error).
- [ ] Score submitido aparece en `/hall` al recargar.
- [ ] `/game/<slug>` (página detalle) muestra datos del juego desde Supabase.
- [ ] GameLoader muestra el juego (no "EN DESARROLLO").
- [ ] Cover CSS se muestra correctamente en library y página de detalle.
- [ ] Aviso mobile se muestra en pantallas pequeñas.
- [ ] Leyenda de controles específica visible en página de juego.
- [ ] Navegar fuera del juego detiene game loop y limpia listeners.
- [ ] `npm run dev` sin errores en consola.
- [ ] No hay errores de TypeScript.

## Decisions

- **Yes:** <Decisión tomada>. <Justificación>.
- **No:** <Alternativa rechazada>. <Razón>.
  <Repetir para cada decisión relevante: categoría, color, canvas, mecánicas, controles, assets, etc.>

## Risks

| Risk                                                          | Mitigation                                                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Event listeners de teclado interfieren con navegación Next.js | Listeners en window con cleanup en useEffect return. `e.preventDefault()` solo para teclas del juego. |
| Memory leak por requestAnimationFrame sin cancelar            | Cleanup guarda id de RAF y llama `cancelAnimationFrame`. Patrón probado en juegos anteriores.         |
| <Riesgos específicos del juego>                               | <Mitigaciones>                                                                                        |

## What is **not** in this spec

- Sonido y efectos de audio.
- Controles táctiles / botones virtuales para mobile.
- Canvas responsive (escalado al viewport).
- <Exclusiones específicas del juego.>

Cada uno de esos, si se implementa, va en su propio spec.
````

---

## Manejo del tema

El tema es la entrada principal del usuario. Puede ser:

- **Una palabra:** "space", "underwater", "medieval", "cyberpunk"
- **Una frase:** "juegos de los 80s japoneses", "survival horror retro"
- **Un concepto abstracto:** "velocidad", "gravedad", "reflejos"

Tu trabajo es interpretar el tema creativamente pero dentro de las restricciones de la plataforma:

1. **Conecta el tema con mecánicas jugables** — No basta con skin temático. La mecánica core debe reflejar el tema.
2. **Mantén viabilidad canvas** — Si el tema sugiere gráficos 3D o alta fidelidad, adapta a estética retro neón.
3. **Variedad mecánica** — Los 3 juegos deben tener mecánicas core distintas entre sí.
4. **Nombres en español, slugs en inglés** — El título del juego es en español (mayúsculas), el ID/slug en inglés kebab-case.

Si el tema es demasiado restrictivo para generar 3 juegos viables, informa al usuario y sugiere ampliarlo o combinarlo con otro tema.

---

## Reglas duras

1. **Exactamente 3 juegos** por sesión de game-jam. Ni más, ni menos.
2. **Siempre** lee `references/implemented-games.md` y `references/game-suggestions-todo.md` antes de generar conceptos.
3. **Nunca** propongas un juego que ya esté implementado, pendiente o sugerido en esos archivos.
4. **Siempre** espera confirmación del usuario antes de escribir los specs (Fase 2 → Fase 3).
5. **Los 3 juegos deben cubrir al menos 2 categorías distintas.** Idealmente 3.
6. **Cada juego debe usar un color distinto** de los 4 disponibles. Nunca 2 juegos con el mismo color en la misma sesión.
7. **Status siempre "Propuesto"** — estos son propuestas, no implementaciones.
8. **Depends on siempre SPEC 04, SPEC 05, SPEC 06** — misma cadena de dependencia que los specs existentes.
9. **Numeración GJ-NN** — secuencial. Verificar qué números ya existen en `specs/game-jam/` y continuar.
10. **Idioma:** Español para todo el contenido de los specs. Inglés para slugs, nombres de archivo, identificadores de código, y nombres de funciones/tipos TypeScript.
11. **Un archivo por juego** — cada spec en su propio directorio: `specs/game-jam/[game-id]/spec.md`.
12. **Canvas 800×600** salvo justificación explícita (como Tetris que es 300×600 por naturaleza vertical del juego).
13. **Nunca** escribas código de implementación. Solo specs.
14. **Nunca** modifiques archivos fuera de `specs/game-jam/`.
15. **Formato de spec exacto** — sigue las 9 secciones en orden sin omitir ninguna. Lee al menos un spec existente (07, 08 o 09) como referencia antes de escribir.
