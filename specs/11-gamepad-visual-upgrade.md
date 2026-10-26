# SPEC 11 — Gamepad visual upgrade: apariencia MK-II neón

> **Status:** Draft
> **Depends on:** SPEC 10
> **Date:** 2026-10-26
> **Objective:** Reemplazar la apariencia actual del gamepad virtual (`TouchGamepad`) con el diseño neón MK-II de la referencia (`references/gamepad-assets/`), manteniendo la funcionalidad existente intacta.

## Scope

**In:**

- Reemplazo de estructura HTML del componente `TouchGamepad`: D-pad con flechas SVG + hub central con diamante pulsante, botones A/B circulares con glow.
- Botones A y B siempre visibles (A = magenta, B = cyan) con letras como la referencia. Label del mapping (FIRE, DROP) como subtexto debajo de la letra.
- Juegos sin acción mapeada: botones A/B visibles pero en estado decorativo (sin despachar eventos, opacidad reducida).
- Reemplazo completo de CSS del gamepad en `globals.css` con estilos de la referencia: body con gradiente oscuro, borde cyan, dot pattern, inner border, sombras y glow.
- Estados visuales: idle, hover (borde cyan en D-pad), active/pressed (translateY + glow intensificado + ring en A/B).
- Hub central del D-pad con diamante cyan pulsante (`pulse-led` animation).
- Dashed ring animado en botones A/B al presionar.
- Media query mobile existente (`max-width: 799px`) conservada.
- Mover botón PAUSE fuera del componente gamepad a `play-screen.tsx`.

**Out of scope (para futuros specs):**

- Cambios en event handling (sigue usando `onTouchStart`/`onTouchEnd`).
- Migración a pointer events.
- Cambios en mappings de teclas.
- Cambios en motores de juego o componentes de juego.
- Nuevo botón B funcional para juegos que no lo tienen definido.
- Soporte teclado/mouse en el gamepad (eso es funcionalidad de la referencia standalone, no del componente mobile).

## Data model

No se introducen nuevas estructuras de datos. Se reutiliza `GamepadMapping` existente en `touch-gamepad.tsx`.

## Implementation plan

1. **Modificar `components/touch-gamepad.tsx` — Estructura HTML:**
   - Reemplazar estructura del D-pad: de grid con Unicode arrows a layout absoluto con botones `<button>` conteniendo SVG arrows (paths de la referencia: triángulos `<path d="M12 4 L20 16 L4 16 Z" .../>` etc.).
   - Agregar hub central con diamante pulsante (`<div className="dp-hub"><span className="dp-hub-gem" /></div>`).
   - Reemplazar botones de acción: de rectángulos con texto a círculos con letra (A/B) + ring animado + subtexto con label del mapping.
   - Botones A y B siempre renderizados. Si `mapping.a` no existe, botón A tiene `aria-disabled="true"` y clase `disabled`. Ídem para B.
   - Remover botón PAUSE del componente (se mueve a play-screen).
   - Estructura objetivo del JSX:
     ```
     .gp (container)
       .gp-body (grid 2 columnas)
         .gp-col.gp-col-left
           .gp-dpad (contenedor relativo)
             button.dp.dp-up (SVG arrow)
             button.dp.dp-right (SVG arrow)
             button.dp.dp-down (SVG arrow)
             button.dp.dp-left (SVG arrow)
             .dp-hub > .dp-hub-gem
         .gp-col.gp-col-right
           .gp-actions (grid 2 cols)
             button.ab.b > .ab-ring + .ab-letter "B" + .ab-label
             button.ab.a > .ab-ring + .ab-letter "A" + .ab-label
     ```

2. **Modificar `app/globals.css` — Reemplazar estilos del gamepad:**
   - Eliminar bloque CSS actual del gamepad (`.touch-gamepad` hasta `.action-btn:active`).
   - Agregar estilos de la referencia adaptados:
     - `.gp` — container con gradiente oscuro, borde cyan translúcido, border-radius 22px, box-shadow con glow cyan, pseudo-element `::before` para inner border, `::after` para dot pattern. `display: none` por defecto.
     - `.gp-body` — grid de 2 columnas con gap.
     - `.gp-dpad` — contenedor relativo 156×156px.
     - `.dp` — botones 50×50px con gradiente oscuro, border-radius 10px, box-shadow con depth. Posiciones absolutas.
     - `.dp:active` / `.dp.on` — translateY(3px), borde cyan, glow inset, filter drop-shadow en arrow.
     - `.dp-hub` — centro con gradiente radial, borde cyan, diamante.
     - `.dp-hub-gem` — diamante cyan 12×12px con clip-path polygon, animación `pulse-led`.
     - `.ab` — botones circulares 74×74px con gradiente radial, borde de color, box-shadow con glow.
     - `.ab.a` — color magenta (variables `--ab-mid`, `--ab-deep`, `--ab-glow`).
     - `.ab.b` — color cyan.
     - `.ab .ab-letter` — font pixel 22px, text-shadow con glow.
     - `.ab .ab-ring` — borde dashed circular, animado en hover/active.
     - `.ab .ab-label` — font mono 8px, color dim, debajo de la letra.
     - `.ab.disabled` — opacity 0.3, pointer-events none.
     - Media query `@media (max-width: 799px)`: `.gp { display: flex; }` (o display según layout).
     - Media query `@media (max-width: 620px)`: tamaños reducidos como en la referencia (D-pad 144px, botones 46px/64px).
   - Mantener `touch-action: none` y `user-select: none` en botones.
   - Agregar `@keyframes pulse-led { 50% { opacity: 0.35; transform: scale(0.85); } }`.

3. **Modificar `components/play-screen.tsx` — Botón PAUSE:**
   - Agregar botón PAUSE fuera del `TouchGamepad`, visible solo en mobile.
   - Posicionar entre HUD y canvas, o entre canvas y gamepad.
   - Estilo consistente: fondo semi-transparente, borde neón, font pixel.

4. **Verificar paridad visual:**
   - Comparar gamepad renderizado con `gamepad-neon.png`.
   - Verificar estados: idle, hover (borde cyan en D-pad), active (translateY + glow).
   - Verificar en viewport 390px y 620px.
   - Verificar botones A/B: magenta y cyan con glow correcto.
   - Hub central con diamante pulsante visible.
   - Dot pattern visible sobre el body del gamepad.
   - Inner border cyan visible.
   - Juegos sin acción (Arkanoid, Snake): botones A/B visibles pero dimmed.
   - Juegos con acción (Asteroids, Tetris): botón A activo con subtexto (FIRE/DROP).
   - Botón PAUSE fuera del gamepad, funcional.
   - Funcionalidad intacta: D-pad despacha teclas, A/B despachan teclas donde aplica.
   - `npm run dev` sin errores.

## Acceptance criteria

- [ ] D-pad usa flechas SVG (triángulos) en lugar de caracteres Unicode.
- [ ] Hub central del D-pad visible con diamante cyan pulsante.
- [ ] Botones A (magenta) y B (cyan) siempre visibles como círculos con glow.
- [ ] Letra "A" y "B" renderizada en pixel font con text-shadow neón.
- [ ] Subtexto con label del mapping visible debajo de la letra (FIRE, DROP) cuando aplica.
- [ ] Botones A/B sin mapping aparecen dimmed (opacity reducida, sin eventos).
- [ ] Body del gamepad tiene gradiente oscuro, borde cyan translúcido y border-radius 22px.
- [ ] Inner border (pseudo-element) visible dentro del gamepad.
- [ ] Dot pattern overlay visible sobre el body del gamepad.
- [ ] Box-shadow con glow cyan en el container.
- [ ] Estado pressed del D-pad: translateY(3px), borde cyan sólido, glow inset, filter drop-shadow en arrow.
- [ ] Estado pressed de A/B: translateY(4px) + scale(0.97), dashed ring visible y expandido.
- [ ] Animación `pulse-led` del diamante central funciona (pulso de 2s).
- [ ] Dashed ring en A/B se muestra en hover (opacity 0.45) y en pressed (opacity 1, scale 1.08).
- [ ] Gamepad no visible en desktop (> 799px).
- [ ] Gamepad visible en mobile (< 799px).
- [ ] Tamaños reducidos en pantallas < 620px (D-pad 144px, botones 46/64px).
- [ ] Botón PAUSE fuera del gamepad, visible solo en mobile, funcional.
- [ ] Funcionalidad de despacho de teclas intacta (mismos eventos que antes).
- [ ] Multi-touch sigue funcionando.
- [ ] `touch-action: none` y `user-select: none` preservados.
- [ ] Apariencia visualmente consistente con `references/gamepad-assets/gamepad-neon.png`.
- [ ] `npm run dev` sin errores.
- [ ] No hay errores de TypeScript.
- [ ] Ningún archivo en `lib/games/` fue modificado.
- [ ] Ningún archivo en `components/games/` fue modificado.

## Decisions

- **Yes:** Solo cambio visual, no funcional. El gamepad ya funciona correctamente (SPEC 10). Este spec solo mejora la apariencia para que coincida con el diseño MK-II de referencia.
- **Yes:** Botones A/B siempre visibles. La referencia los muestra siempre. Juegos sin mapping los muestran dimmed — estética de "gamepad completo" como control NES.
- **Yes:** Subtexto con label debajo de la letra. Mantiene información contextual (FIRE/DROP) sin romper la estética de la referencia que usa letras A/B.
- **No:** Botones A/B condicionales (como estaba). Rompe la simetría visual del gamepad. El diseño MK-II siempre muestra ambos botones.
- **Yes:** Mover PAUSE fuera del gamepad. La referencia no incluye botón de pausa en el gamepad. Separarlo mantiene fidelidad visual y el botón sigue accesible.
- **No:** Migrar a pointer events. Funcionalidad fuera de scope. Touch events funcionan correctamente para el caso mobile. Pointer events serían mejora funcional, no visual.
- **Yes:** Adoptar class names de la referencia (.gp, .dp, .ab). CSS de la referencia ya está probado y es semánticamente claro. Reusar las clases facilita mantener paridad visual.
- **No:** Mantener class names actuales (.touch-gamepad, .dpad-btn, .action-btn). Renombrar alinea con la referencia y evita conflictos de especificidad con CSS residual.

## Risks

| Risk                                                                               | Mitigation                                                                                                                                                      |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Class names nuevos (.gp, .dp, .ab) colisionan con otros estilos                    | Nombres cortos pero específicos del gamepad. Grep del codebase confirma que no hay conflictos. Alternativamente, prefijar con namespace si se detecta colisión. |
| Transiciones CSS del estado pressed no se sienten en touch (no hay hover en móvil) | `:active` funciona en touch. Clase `.on` se agrega programáticamente si `:active` no basta. La referencia ya maneja esto con clase `.on`.                       |
| SVG arrows no se ven nítidos en pantallas de baja densidad                         | SVGs escalan sin pérdida. `currentColor` hereda del botón. Sin riesgo real.                                                                                     |
| Dot pattern overlay (`::after`) interfiere con touch events                        | `pointer-events: none` en el pseudo-element (ya presente en la referencia).                                                                                     |
| Subtexto debajo de A/B agrega altura no contemplada en la referencia               | Font-size 8px con position absolute o margin mínimo. Impacto visual negligible.                                                                                 |

## What is **not** in this spec

- Migración de touch events a pointer events.
- Nuevo mapping de botón B para juegos existentes.
- Soporte de teclado/mouse en el gamepad virtual.
- Haptic feedback o vibración.
- Cambios en motores de juego o componentes de juego.

Cada uno de esos, si se implementa, va en su propio spec.
