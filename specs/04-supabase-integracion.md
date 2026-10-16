# SPEC 04 — Integración base de Supabase con Next.js

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-10-16
> **Objective:** Configurar la integración base de Supabase en el proyecto Next.js con clientes para browser, server y middleware, listos para uso futuro de auth, base de datos y demás features.

## Scope

**In:**

- Instalar paquetes `@supabase/supabase-js` y `@supabase/ssr`.
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.template` y `.env.local`.
- Utilidad `utils/supabase/client.ts` — `createBrowserClient` para Client Components.
- Utilidad `utils/supabase/server.ts` — `createServerClient` para Server Components y API Routes.
- `middleware.ts` en raíz del proyecto — refresh de sesión de Supabase en cada request (necesario para auth futura).
- Verificar que `npm run dev` funciona sin errores con la integración configurada.

**Out of scope (para futuros specs):**

- Autenticación (login, registro, OAuth, magic link).
- Migración de datos hardcodeados a Supabase DB (games, scores).
- Supabase Storage para assets/covers.
- Supabase Realtime para actividad en vivo.
- Row Level Security (RLS) policies.
- Reemplazo de `lib/auth-context.tsx` (auth con localStorage actual se mantiene).

## Data model

Este spec no introduce nuevas estructuras de datos. Solo configura la conexión entre Next.js y Supabase.

## Implementation plan

1. Instalar dependencias con `npm install @supabase/supabase-js @supabase/ssr`.
2. Agregar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` a `.env.template` (valores vacíos). Crear o actualizar `.env.local` con los valores reales del proyecto Supabase (`acubwjcjguihbwgchzen`).
3. Crear `utils/supabase/client.ts` con función que retorna un cliente de Supabase para browser usando `createBrowserClient` de `@supabase/ssr`.
4. Crear `utils/supabase/server.ts` con función que retorna un cliente de Supabase para Server Components usando `createServerClient` de `@supabase/ssr` con manejo de cookies.
5. Crear `middleware.ts` en raíz del proyecto con `createServerClient` que refresca la sesión de Supabase. Configurar `matcher` para excluir archivos estáticos (`_next/static`, `_next/image`, `favicon.ico`).
6. Verificar que `npm run dev` corre sin errores y que las rutas existentes siguen funcionando.

## Acceptance criteria

- [ x] `@supabase/supabase-js` y `@supabase/ssr` están en `package.json` dependencies.
- [ x] `.env.template` contiene `NEXT_PUBLIC_SUPABASE_URL=` y `NEXT_PUBLIC_SUPABASE_ANON_KEY=`.
- [ x] `utils/supabase/client.ts` exporta función para crear cliente browser de Supabase.
- [ x] `utils/supabase/server.ts` exporta función para crear cliente server de Supabase con cookies.
- [ x] `middleware.ts` existe en raíz, refresca sesión y tiene matcher configurado.
- [ x] `npm run dev` sin errores en consola.
- [x ] No hay errores de TypeScript.
- [ x] Rutas existentes (`/games`, `/library`, `/about`, `/hall`) siguen funcionando sin regresiones.

## Decisions

- **Yes:** `@supabase/ssr` además de `@supabase/supabase-js`. Necesario para Server Components y middleware en Next.js App Router.
- **No:** Solo `@supabase/supabase-js`. Sin `@supabase/ssr` habría que implementar manejo de cookies manualmente.
- **Yes:** 3 clientes (browser, server, middleware). Setup completo estándar de Supabase para Next.js. Evita reconfiguración cuando se agregue auth.
- **No:** Solo cliente browser. Limitaría Server Components y obligaría a agregar server client después.
- **Yes:** `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` como env vars. Convención estándar de Supabase. Seguro porque anon key opera bajo RLS.
- **No:** `SUPABASE_SERVICE_ROLE_KEY`. No se necesita en este spec. Se agrega cuando haya operaciones admin server-side.
- **Yes:** Archivos en `utils/supabase/`. Convención oficial de la documentación de Supabase para Next.js.
- **No:** Archivos en `lib/supabase/`. Consistencia con docs oficiales pesa más que consistencia interna con `lib/`.

## What is **not** in this spec

- Autenticación de usuarios.
- Migración de datos a base de datos Supabase.
- Storage para archivos/imágenes.
- Realtime para datos en vivo.
- RLS policies.

Each one of those, if it lands, goes in its own spec.
