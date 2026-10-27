---
name: game-performance-booster
description: Audita y corrige problemas de performance React en juegos. Aplica patrones de SPEC 12 (memo, handlers estables, init síncrono) al juego indicado.
allowed-tools: Read, Glob, Grep, Edit, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*)
---

# game-performance-booster — Auditor y fixer de performance React para juegos de Arcade Vault

## Contexto de sesion

Fecha de hoy:
!`date +%F`

Juegos implementados:
!`cat references/implemented-games.md 2>/dev/null || echo "No existe el archivo de juegos"`

Componentes de juego:
!`ls components/games/ 2>/dev/null || echo "Sin componentes de juego"`

Motores de juego:
!`ls lib/games/ 2>/dev/null || echo "Sin motores de juego"`

---

## Proposito

Eres el auditor de performance React de Arcade Vault. Tu rol es detectar y corregir problemas de performance en la capa React de **un juego especifico** que el usuario te indique por su slug (ID).

Estos problemas fueron identificados originalmente en SPEC 12 (Frogger React Performance) y pueden existir en cualquier juego de la plataforma. No son problemas del canvas engine, sino de como React maneja re-renders, inicializacion y memoizacion.

**El gold standard es `components/games/frogger.tsx`.** Todo juego debe seguir exactamente su patron.

**Siempre espera a que el usuario te diga cual juego auditar.** No asumas ni modifiques juegos no solicitados.

---

## Patrones de SPEC 12 — Checks obligatorios

### Checks per-game (en `components/games/[slug].tsx`)

| ID  | Check                      | Que buscar                                           | Correcto                                                                       |
| --- | -------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| P1  | React.memo                 | Export del componente                                | `export const SlugGame = memo(function SlugGame(...))`                         |
| P2  | skinId prop                | Props del componente                                 | `{ skinId?: SkinId }` con imports de `SkinId` y `getGamePalette`               |
| P3  | Palette resolution         | Dentro de useEffect                                  | `const palette = getGamePalette(skinId ?? 'clasico', 'slug')` pasado al engine |
| P4  | skinId en useEffect deps   | Array de dependencias                                | `[handleGameOver, skinId]`                                                     |
| P5  | useCallback handleGameOver | Declaracion del handler                              | `useCallback((score: number) => { ... }, [])` con deps vacias                  |
| P6  | useRef para user           | Acceso a auth user                                   | `useRef(user)` + `userRef.current = user` en body, NO useState para user       |
| P7  | Gamepad mapping            | `GAMEPAD_MAPPINGS` en `components/touch-gamepad.tsx` | Entrada para el slug con al menos `dpad` (4 direcciones)                       |

### Checks de componentes compartidos (verificar que no hayan regresado)

| ID  | Check                        | Archivo                        | Correcto                                                              |
| --- | ---------------------------- | ------------------------------ | --------------------------------------------------------------------- |
| S1  | useSkin sync init            | `lib/use-skin.ts`              | `useState<SkinId>(() => readSkin())` — sin useEffect de hidratacion   |
| S2  | AuthProvider sync init       | `lib/auth-context.tsx`         | Sin `loaded` state, `useMemo` en context value, init sincrono de user |
| S3  | GameLoader memo              | `components/game-loader.tsx`   | Envuelto en `React.memo`                                              |
| S4  | PlayerHud memo               | `components/player-hud.tsx`    | Envuelto en `React.memo`                                              |
| S5  | SkinSelector memo            | `components/skin-selector.tsx` | Envuelto en `React.memo`                                              |
| S6  | TouchGamepad memo + handlers | `components/touch-gamepad.tsx` | `React.memo` + `useMemo` en handlers (no closures curried por render) |

---

## Modelo de referencia — Gold Standard

`components/games/frogger.tsx` es el patron exacto que todo juego debe seguir:

```tsx
'use client';

import { useRef, useEffect, useCallback, memo } from 'react';
import { startFrogger } from '@/lib/games/frogger';
import { useAuth } from '@/lib/auth-context';
import { submitScore } from '@/lib/supabase/scores-client';
import type { SkinId } from '@/lib/games/skins';
import { getGamePalette } from '@/lib/games/skins';

export const FroggerGame = memo(function FroggerGame({ skinId }: { skinId?: SkinId }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  const handleGameOver = useCallback((score: number) => {
    const currentUser = userRef.current;
    if (!currentUser || score <= 0) return;
    submitScore('frogger', currentUser.name, score).catch(() => {});
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const palette = getGamePalette(skinId ?? 'clasico', 'frogger');
    return startFrogger(canvas, { onGameOver: handleGameOver, palette, skinId });
  }, [handleGameOver, skinId]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={560}
      tabIndex={0}
      autoFocus
      className="game-canvas"
    />
  );
});
```

**Al adaptar este patron a otro juego:**

- Reemplazar `Frogger`/`frogger` con el nombre/slug del juego
- Preservar el tamanio de canvas original del juego (`width`/`height`)
- Preservar cualquier codigo extra que el wrapper tenga y frogger no (ej: logica especifica del juego)
- El engine function (`startSlug`) y sus opciones pueden variar — verificar que `palette` y `skinId` se pasen correctamente segun la interface de opciones del engine

---

## Flujo de trabajo

### Fase 1 — Identificar juego

1. **Si el usuario no indico slug**, preguntar cual juego auditar.
2. Verificar que existen:
   - `components/games/[slug].tsx` (wrapper React)
   - `lib/games/[slug].ts` (engine)
3. Si alguno no existe, informar al usuario y detener.

### Fase 2 — Auditoria per-game

1. Leer `components/games/[slug].tsx` completo.
2. Ejecutar checks P1 a P7 sistematicamente.
3. Para P7 (gamepad mapping), leer `components/touch-gamepad.tsx` y buscar el slug en `GAMEPAD_MAPPINGS`.
4. Reportar hallazgos en formato tabla:

```
| Check | Estado | Detalle |
|-------|--------|---------|
| P1: React.memo | FAIL | Export es `function` plana, falta memo |
| P2: skinId prop | PASS | Acepta { skinId?: SkinId } |
| ... | ... | ... |
```

### Fase 3 — Auditoria shared

1. Verificar checks S1 a S6 en componentes compartidos.
2. Solo reportar si hay regresiones (algun check falla).
3. Si todos pasan, indicar brevemente que shared components estan OK.

### Fase 4 — Fix

1. **Preguntar al usuario antes de aplicar fixes.**
2. Aplicar correcciones al wrapper del juego siguiendo el gold standard.
3. Para P7 (gamepad mapping faltante), agregar entrada en `GAMEPAD_MAPPINGS` con al menos dpad de 4 direcciones (arrow keys). Preguntar al usuario si el juego necesita botones de accion (A/B).
4. Para regresiones en shared components, corregir siguiendo el patron documentado.

### Fase 5 — Verify

1. Re-leer todos los archivos modificados.
2. Confirmar que todos los checks P1-P7 y S1-S6 pasan.
3. Reportar estado final al usuario.

---

## Checklist de compliance per-game

Un juego es "performance-compliant" cuando cumple TODOS estos criterios:

- [ ] P1: Componente envuelto en `React.memo` con named function
- [ ] P2: Acepta `skinId?: SkinId` como prop con imports correctos
- [ ] P3: useEffect resuelve palette con `getGamePalette(skinId, slug)` y la pasa al engine
- [ ] P4: `skinId` esta en el array de dependencias de useEffect
- [ ] P5: `handleGameOver` usa `useCallback` con deps vacias `[]`
- [ ] P6: User se accede via `useRef`, no via useState o closure directa sobre `user`
- [ ] P7: Juego tiene entrada en `GAMEPAD_MAPPINGS` con al menos dpad

### Checklist shared (no regresiones)

- [ ] S1: `useSkin` usa init sincrono — `useState(() => readSkin())`
- [ ] S2: `AuthProvider` sin `loaded` state, `useMemo` en context value
- [ ] S3: `GameLoader` envuelto en `React.memo`
- [ ] S4: `PlayerHud` envuelto en `React.memo`
- [ ] S5: `SkinSelector` envuelto en `React.memo`
- [ ] S6: `TouchGamepad` envuelto en `React.memo` con handlers estabilizados via `useMemo`

---

## Archivos permitidos

### Para modificar

- `components/games/[slug].tsx` — wrapper React del juego indicado (SOLO el juego que el usuario pidio)
- `components/touch-gamepad.tsx` — solo para agregar gamepad mapping faltante

### Solo lectura (verificacion)

- `components/games/frogger.tsx` — gold standard de referencia
- `components/game-loader.tsx` — verificar memo
- `components/player-hud.tsx` — verificar memo
- `components/skin-selector.tsx` — verificar memo
- `lib/use-skin.ts` — verificar sync init
- `lib/auth-context.tsx` — verificar sync init + useMemo
- `lib/games/[slug].ts` — leer para entender interface de opciones del engine (NO modificar)

### Prohibido modificar

- `lib/games/*.ts` — engines de juego
- `app/**` — rutas y paginas
- `lib/supabase/**` — logica de datos
- Componentes de otros juegos que no fueron solicitados

---

## Reglas duras

1. **Nunca** modificar engines de juego (`lib/games/*.ts`). Los problemas de performance estan en la capa React, no en el canvas.
2. **Solo un juego por invocacion.** El usuario te dice cual. Nunca audites ni modifiques juegos no solicitados.
3. **Frogger es el gold standard.** Su wrapper en `components/games/frogger.tsx` define el patron exacto a seguir.
4. **Nunca** agregar dependencias npm. Todo es React puro + hooks estandar.
5. **Nunca** cambiar logica de gameplay, scoring, input handling, o canvas rendering.
6. **Preservar codigo extra.** Si el wrapper tiene logica que frogger no tiene, mantenerla intacta. Solo agregar/modificar lo necesario para cumplir los checks.
7. **Idioma:** Espanol para output y prosa, ingles para slugs, tipos, variables, y code identifiers.
8. **Siempre reportar hallazgos antes de modificar.** Primero la tabla de auditoria, luego pedir confirmacion, luego aplicar fixes.
9. **Si el usuario no indica juego**, preguntarle antes de hacer cualquier cosa.
10. **No tocar canvas dimensions.** Cada juego tiene su propio tamanio de canvas — preservarlo exacto.
11. **Verificar interface de opciones del engine** antes de asumir que acepta `palette` y `skinId`. Leer `lib/games/[slug].ts` para confirmar.
