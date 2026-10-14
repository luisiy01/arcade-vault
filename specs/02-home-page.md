# SPEC 02 — Home page (landing) y reorganización de rutas

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-10-14
> **Objective:** Implementar la home page (landing) de Arcade Vault en `/games` con hero, features, preview de juegos, stats, actividad en vivo mock y CTA final, moviendo la Library actual a `/library` y actualizando el Nav.

## Scope

**In:**

- Mover la pantalla Library actual de `/` a `/library` (mismo componente, nueva ruta).
- Redirect de `/` a `/games`.
- Pantalla **Home** (`/games`): hero con siluetas pixel flotantes, sección "¿Por qué Arcade Vault?" con 4 feature cards, preview de 6 juegos (mini-cards), stats decorativas, actividad en vivo con datos mock (últimas puntuaciones + top jugadores), y CTA final.
- Componente `FloatingSilhouettes` con 8 SVGs pixel art animados flotando en hero.
- Componente `FeatureIcon` con 4 iconos SVG pixel (GAMEPAD, FREE, TROPHY, ROCKET).
- Componente `MiniCard` para preview compacto de juegos en rail.
- Hook `useReveal` para animación de entrada con IntersectionObserver.
- Portar CSS del home page desde `references/resources/templates/home-about/styles.css` a `app/globals.css`.
- Actualizar Nav para incluir link "Inicio" (`/games`), cambiar link "Biblioteca" a `/library`, y actualizar lógica de `isActive`.

**Out of scope (para futuros specs):**

- Página About y formulario de contacto (otro spec).
- Sección de precios/FAQ (omitida por decisión).
- Datos de actividad en vivo reales (API, WebSocket, etc.).
- Lógica de autenticación en botones del hero.

## Data model

No se introducen nuevas estructuras de datos. Se reutiliza `GAMES` de `lib/data.ts` (SPEC 01) para la sección de preview. Los datos de actividad en vivo (últimas puntuaciones y top jugadores) están hardcodeados directamente en el componente, no en `lib/data.ts`.

## Implementation plan

1. Mover `app/page.tsx` a `app/library/page.tsx`. Actualizar imports si es necesario. Verificar que `/library` muestra la Library correctamente.
2. Crear `app/page.tsx` con redirect de `/` a `/games` usando `redirect()` de `next/navigation`.
3. Crear `components/floating-silhouettes.tsx` (client component) con los 8 SVGs pixel art del template.
4. Crear `components/feature-icon.tsx` con los 4 iconos SVG (GAMEPAD, FREE, TROPHY, ROCKET).
5. Crear `components/mini-card.tsx` (client component) con card compacta de juego para rail de preview.
6. Crear `app/games/page.tsx` (client component) con todas las secciones del home: hero con `FloatingSilhouettes`, sección features, mini-rail con 6 juegos de `GAMES`, stats, actividad en vivo con datos hardcodeados, y CTA final. Incluir hook `useReveal` para animaciones de scroll.
7. Portar estilos CSS del home page desde `references/resources/templates/home-about/styles.css` (líneas 930–1067 y estilos relacionados como `.reveal`, `.activity-grid`, `.ticker`, `.top-list`, `.pricing-grid` menos pricing) a `app/globals.css`.
8. Actualizar `components/nav.tsx`: agregar link "Inicio" apuntando a `/games`, cambiar link "Biblioteca" a `/library`, actualizar función `isActive` para nuevas rutas, actualizar menú móvil con mismos cambios.

## Acceptance criteria

- [ ] `/games` muestra home page con hero completo, siluetas pixel flotantes animadas.
- [ ] Sección "¿Por qué Arcade Vault?" muestra 4 feature cards con iconos SVG pixel y efecto hover.
- [ ] Rail de preview muestra 6 juegos de `GAMES` con mini-cards clickeables que navegan a `/game/[id]`.
- [ ] Sección stats muestra 3 bloques (12+ juegos, Miles de partidas, Global ranking).
- [ ] Sección actividad en vivo muestra últimas puntuaciones (7 rows) y top jugadores del día (5 rows).
- [ ] Link "VER SALÓN →" en top jugadores navega a `/hall`.
- [ ] CTA final "INSERTAR MONEDA →" navega a `/library`.
- [ ] Botón hero "EXPLORAR JUEGOS" navega a `/library`.
- [ ] Botón hero "CREAR CUENTA" navega a `/auth`.
- [ ] Secciones con clase `.reveal` aparecen con animación al hacer scroll (IntersectionObserver).
- [ ] `/library` muestra la Library (misma funcionalidad que antes en `/`).
- [ ] `/` redirige a `/games`.
- [ ] Nav muestra links: Inicio (`/games`), Biblioteca (`/library`), Salón de la Fama (`/hall`), y link activo resaltado correctamente.
- [ ] Menú móvil incluye link "Inicio".
- [ ] `npm run dev` sin errores en consola.
- [ ] No hay errores de TypeScript.

## Decisions

- **Yes:** Home en `/games`, Library en `/library`. Separación clara entre landing y catálogo.
- **No:** Home en `/`. El usuario decidió usar `/games` como ruta para home page.
- **Yes:** Redirect de `/` a `/games`. Evita ruta raíz sin contenido.
- **Yes:** Datos de actividad hardcodeados en componente. Son mock decorativos, no justifican estructura en `lib/data.ts`.
- **No:** Sección de precios. Omitida por decisión del usuario para simplificar home page.
- **Yes:** Componentes separados para `FloatingSilhouettes`, `FeatureIcon` y `MiniCard`. Mantiene home page legible.
- **No:** Un solo archivo monolítico para todo el home. Demasiado largo y difícil de mantener.
- **Yes:** About page en spec separado. Mantiene alcance acotado.

## What is **not** in this spec

- Página About y formulario de contacto.
- Sección de precios/FAQ.
- Datos de actividad en tiempo real.
- Lógica de autenticación.

Each one of those, if it lands, goes in its own spec.
