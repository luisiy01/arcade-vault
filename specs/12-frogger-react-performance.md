# SPEC 12 — Performance: re-renders excesivos en Frogger

> **Status:** Aprobado
> **Depends on:** SPEC 01 (Frogger core)
> **Date:** 2026-10-26
> **Objective:** Eliminar re-renders innecesarios de React en la cadena PlayScreen → GameLoader → FroggerGame que causan frame drops en gameplay y doble inicialización del engine en mount.

## Por qué este spec existe

El juego de Frogger (y potencialmente los demás) sufre problemas de performance causados por la capa React, no por el canvas engine. El componente `PlayScreen` no tiene ningún `React.memo` en su árbol, `useSkin` dispara un re-render extra al hidratar desde localStorage, y el context de `AuthProvider` crea un objeto nuevo en cada render. Estos problemas causan:

- **En mount:** el engine se inicia, se destruye, y se reinicia cuando `useSkin` lee localStorage y dispara un segundo render con el skin correcto.
- **En gameplay:** re-renders innecesarios del árbol completo de componentes cuando cualquier estado cambia en PlayScreen o en sus ancestros.

## Scope

**In:**

- Fix de `useSkin` para evitar doble render por hidratación de localStorage.
- Eliminación de `useState(loaded)` en `AuthProvider` — init síncrono de `user` desde localStorage, igual que el fix de `useSkin`.
- `React.memo` en `FroggerGame`, `GameLoader`, `PlayerHud`, `SkinSelector`, `TouchGamepad`.
- Memoización del `value` de `AuthContext.Provider` con `useMemo`.
- Estabilización de handlers en `TouchGamepad` (curried handlers crean closures nuevas cada render).
- Agregar mapping de Frogger en `GAMEPAD_MAPPINGS` de `TouchGamepad` (descubierto durante análisis: falta el mapping, gamepad no aparece para Frogger en mobile).
- Principio general: minimizar `useState`, preferir `useRef` cuando el valor no necesita disparar re-render. Auditoría de todos los `useState` en la cadena de gameplay.

**Out of scope (para futuros specs):**

- Optimizaciones del canvas engine (offscreen canvas, batch paths, font caching) — eso es un spec separado si se necesita.
- Aplicar `React.memo` a componentes de otros juegos (`AsteroidsGame`, `TetrisGame`, etc.) — las fixes en `GameLoader`, `PlayerHud`, `SkinSelector` y `TouchGamepad` ya benefician a todos los juegos; los game components individuales se memoizan en su propio spec si muestran problemas.
- FPS counter o instrumentación de performance.
- Refactor del game loop o estructura del engine.
- Migración a `useSyncExternalStore` para skin state.

## Data model

No se introducen nuevas estructuras de datos.

## Implementation plan

1. **Fix `lib/use-skin.ts` — inicialización síncrona, eliminar useEffect:**
   - Cambiar `useState<SkinId>(DEFAULT_SKIN)` a `useState<SkinId>(() => readSkin())` para que el valor inicial ya sea el correcto en el cliente.
   - Eliminar el `useEffect` que lee localStorage y llama `setSkinState` (ya no necesario).
   - Eliminar `useEffect` del import.
   - Resultado: `PlayScreen` renderiza una sola vez con el skin correcto, sin re-render extra. En SSR, `readSkin()` retorna `DEFAULT_SKIN` porque localStorage no existe (try/catch existente lo maneja).

2. **Fix `lib/auth-context.tsx` — eliminar `loaded` useState, init síncrono de `user`:**
   - Cambiar `useState<User | null>(null)` a `useState<User | null>(() => { try { const s = localStorage.getItem('av_user'); return s ? JSON.parse(s) : null; } catch { return null; } })`.
   - Eliminar `useState(false)` para `loaded`.
   - Eliminar el `useEffect` que lee localStorage y setea `user` + `loaded`.
   - Eliminar el guard `if (!loaded) return null`.
   - Resultado: un `useState` menos, un `useEffect` menos, AuthProvider renderiza children inmediatamente con el `user` correcto. En SSR, localStorage no existe → `user` inicia como `null` (mismo output visual que antes).

3. **Memoizar context value de `AuthProvider` en `lib/auth-context.tsx`:**
   - Envolver `{ user, login, logout }` en `useMemo` con deps `[user, login, logout]`.
   - `login` y `logout` ya son estables (useCallback con deps vacías), así que el context value solo cambia cuando `user` cambia.
   - Resultado: componentes que consumen `useAuth()` solo re-renderizan cuando `user` realmente cambia.

4. **Memoizar `components/games/frogger.tsx` con `React.memo`:**
   - Envolver `FroggerGame` en `React.memo` para evitar re-renders cuando props (`skinId`) no cambian.
   - `handleGameOver` ya es estable (useCallback con deps vacías), `skinId` es primitivo — comparación shallow funciona bien.

5. **Memoizar `components/game-loader.tsx` — `React.memo` en `GameLoader`:**
   - Envolver `GameLoader` con `React.memo`. Props son `gameId` (string) y `skinId` (string) — shallow comparison suficiente.

6. **Memoizar `components/player-hud.tsx` — `React.memo` en `PlayerHud`:**
   - Envolver `PlayerHud` con `React.memo`. Prop es `gameId` (string).
   - `PlayerHud` usa `useAuth()` internamente, así que solo re-renderiza cuando el context value cambia O cuando `gameId` cambia.

7. **Memoizar y estabilizar `components/touch-gamepad.tsx`:**
   - Envolver `TouchGamepad` con `React.memo`.
   - Reemplazar handlers curried `handleTouchStart(keyDef)` (que crean closures nuevas cada render) con `useMemo` que pre-computa los handlers para cada botón del mapping actual.
   - Agregar Frogger al `GAMEPAD_MAPPINGS`:
     ```ts
     frogger: {
       dpad: {
         up: { code: 'ArrowUp', key: 'ArrowUp' },
         down: { code: 'ArrowDown', key: 'ArrowDown' },
         left: { code: 'ArrowLeft', key: 'ArrowLeft' },
         right: { code: 'ArrowRight', key: 'ArrowRight' },
       },
     },
     ```

8. **Memoizar `components/skin-selector.tsx` — `React.memo` en `SkinSelector`:**
   - Envolver `SkinSelector` con `React.memo`. Props son `skin` (string) y `onSkinChange` (callback estable de useSkin).

### Auditoría de useState — resultado

| Hook/Componente           | useState                 | Veredicto                                                                                                                       |
| ------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `useSkin` → `skin`        | `useState<SkinId>`       | **Necesario** — cambio de skin debe re-renderizar game component con nuevo `skinId`. Fix: init síncrono (step 1).               |
| `AuthProvider` → `user`   | `useState<User \| null>` | **Necesario** — context consumers necesitan re-render cuando user cambia. Fix: init síncrono (step 2).                          |
| `AuthProvider` → `loaded` | `useState(false)`        | **Eliminable** — solo sirve para bloquear render hasta leer localStorage. Con init síncrono de `user`, no se necesita (step 2). |
| `Nav` → `open`            | `useState(false)`        | **Necesario** — toggle de menú mobile controla clases CSS visibles.                                                             |
| Game components           | ninguno                  | Ya usan `useRef` correctamente (`canvasRef`, `userRef`).                                                                        |

## Acceptance criteria

- [ ] `FroggerGame` engine se inicia exactamente 1 vez al montar la página (no doble init por hidratación de skin).
- [ ] Cambiar skin desde `SkinSelector` destruye el engine actual y crea uno nuevo exactamente 1 vez.
- [ ] Re-renders de `PlayScreen` (por cualquier causa que no sea cambio de `skinId` o `gameId`) no propagan al componente `FroggerGame`.
- [ ] `PlayerHud` no re-renderiza durante gameplay normal (solo cuando `user` cambia).
- [ ] `TouchGamepad` no re-renderiza cuando `PlayScreen` re-renderiza sin cambio de `gameId`.
- [ ] `AuthProvider` no tiene `loaded` state — `user` se inicializa síncronamente desde localStorage.
- [ ] `AuthProvider` renderiza children inmediatamente (no retorna `null` en ningún momento).
- [ ] No hay warnings de hidratación en consola relacionados a skin o auth state.
- [ ] Frogger tiene gamepad funcional en mobile (mapping agregado).
- [ ] Todos los juegos existentes siguen funcionando sin regresiones (las fixes en componentes compartidos no rompen nada).
- [ ] Total de `useState` en cadena de gameplay: 3 (skin, user, nav open) — no más.

## Decisions taken and discarded

| Decisión                     | Elegido                                                             | Descartado                                             | Razón                                                                                                                                                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fix doble render de skin     | `useState(() => readSkin())` síncrono                               | `useSyncExternalStore`                                 | Más simple, el try/catch existente ya maneja SSR. `useSyncExternalStore` sería over-engineering para un valor que solo cambia por acción del usuario.                                                                                                                                |
| Fix AuthProvider mount       | Eliminar `loaded` useState, init síncrono de `user`                 | Mantener `loaded` + useEffect                          | Un useState y un useEffect menos. Elimina render de `null` en mount. Mismo pattern que el fix de `useSkin`.                                                                                                                                                                          |
| Principio useState vs useRef | Minimizar `useState` — solo cuando el valor DEBE disparar re-render | useState por defecto para todo estado                  | Valores que no afectan UI visual van en `useRef`. Game components ya siguen esto (`canvasRef`, `userRef`). Extender principio a toda la cadena.                                                                                                                                      |
| Prevenir re-renders          | `React.memo` en componentes individuales                            | Reestructurar árbol de componentes / Context splitting | Mínimo invasivo. No cambia la arquitectura ni la API de los componentes.                                                                                                                                                                                                             |
| Scope                        | Solo Frogger + componentes compartidos                              | Todos los juegos                                       | Frogger como piloto. Las fixes en componentes compartidos (`GameLoader`, `PlayerHud`, `TouchGamepad`, `SkinSelector`, `AuthProvider`) benefician automáticamente a todos los juegos. Solo falta `React.memo` en cada game component individual, que se agrega si muestran problemas. |
| Métricas                     | Confiar en DevTools del browser                                     | FPS counter overlay                                    | No agregar código de instrumentación. React DevTools Profiler muestra re-renders; Chrome DevTools muestra frame timing.                                                                                                                                                              |

## Identified risks

- **Hydration mismatch:** Si el valor de `readSkin()` en SSR (DEFAULT_SKIN) difiere del valor en el cliente (skin guardado), React puede mostrar un warning de hidratación. Mitigación: `useSkin` ya maneja esto con try/catch que retorna DEFAULT_SKIN en SSR, y el flash visual es mínimo porque el componente de juego usa `dynamic({ ssr: false })`. Si se detectan warnings, migrar a `useSyncExternalStore` como fallback.
- **React.memo comparison miss:** Si alguna prop futura es un objeto no estable, `React.memo` no prevendrá el re-render. Mitigación: todas las props actuales son primitivos (strings) o callbacks estabilizados con `useCallback`. Documentar en código que las props deben ser estables.
