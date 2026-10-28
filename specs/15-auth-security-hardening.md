# SPEC 15 — Hardening de seguridad en autenticación

> **Status:** Aprobado
> **Depends on:** SPEC 13 (Auth con Supabase Auth), SPEC 14 (Seguridad básica)
> **Date:** 2026-10-28
> **Objective:** Corregir vulnerabilidades de seguridad en el flujo de autenticación: crear middleware de Supabase para refresh de tokens, implementar página `/auth/reset`, reemplazar `getSession()` por `getUser()`, mover instancia de Supabase client dentro del componente, y eliminar race condition en verificación de display_name.

## Por qué este spec existe

Una auditoría de seguridad sobre el código de autenticación (implementado en SPEC 13) reveló 5 hallazgos que comprometen la integridad de las sesiones y la experiencia de recuperación de contraseña. El más crítico: no existe `middleware.ts`, lo que significa que los tokens JWT nunca se refrescan server-side — sesiones expiradas devuelven datos stale en SSR. Además, la página `/auth/reset` referenciada en el flujo de recuperación no existe (404), y `getSession()` se usa donde debería usarse `getUser()` para verificar identidad auténtica.

## Scope

**In:**

- Crear `middleware.ts` en raíz del proyecto para refresh de tokens JWT en cada request (solo refresh, sin protección de rutas).
- Crear `app/auth/reset/page.tsx` — página para ingresar nueva contraseña tras recibir link de recuperación por email.
- Reemplazar `supabase.auth.getSession()` por `supabase.auth.getUser()` en `lib/auth-context.tsx` para verificación inicial de sesión.
- Mover instancia singleton de `createClient()` (línea 43 de `auth-context.tsx`) dentro de `AuthProvider` para evitar instanciación a nivel de módulo.
- Eliminar SELECT previo de display_name en `signUp` y manejar error de unique violation del INSERT directamente.

**Out of scope (para futuros specs):**

- Content-Security-Policy (CSP) header — requiere auditoría de inline scripts/styles (Tailwind, canvas). Mantiene decisión de SPEC 14.
- Protección de rutas con middleware (redirección a `/auth` si no hay sesión). Filosofía actual: acceso libre, RLS protege scores.
- Campo de confirmar contraseña en página de reset. Consistente con decisión de SPEC 14.
- Rate limiting custom en middleware.
- PKCE flow explícito (Supabase SSR lo maneja internamente).
- Middleware de protección CSRF adicional.

## Data model

No se crean tablas ni columnas nuevas. La tabla `profiles` ya tiene constraint UNIQUE en `display_name` (SPEC 13). Este spec solo modifica código de aplicación.

## Implementation plan

1. **Crear `middleware.ts` — refresh de tokens Supabase:**
   - Crear archivo `middleware.ts` en la raíz del proyecto.
   - Usar `createServerClient` de `@supabase/ssr` con acceso a cookies del request/response.
   - En la función middleware: llamar `supabase.auth.getUser()` para forzar refresh del token si está expirado.
   - Configurar `matcher` para excluir assets estáticos: `['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']`.
   - Verificación: `npm run dev`, navegar entre páginas — cookies de sesión se actualizan en cada request (visible en DevTools → Application → Cookies).

2. **Actualizar `utils/supabase/server.ts` — pasar cookies correctamente:**
   - Verificar que `createClient()` server-side maneja `setAll` correctamente para que middleware pueda escribir cookies actualizadas.
   - Si ya está correcto (lo está según el código actual), no modificar.
   - Verificación: no hay errores de "cookies can't be set" en consola del servidor.

3. **Crear `app/auth/reset/page.tsx` — página de nueva contraseña:**
   - Componente client (`'use client'`).
   - Un campo de nueva contraseña con botón mostrar/ocultar.
   - Validación con `PASSWORD_REGEX` de SPEC 14 (`/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/`).
   - Llamar `supabase.auth.updateUser({ password })` al enviar.
   - Estados: formulario → submitting → éxito (redirigir a `/games`) / error (mostrar mensaje).
   - Estilo consistente con `app/auth/page.tsx` (mismas clases `auth-card`, `field`, `btn`).
   - Verificación: solicitar reset password, clickear link en email, ingresar nueva contraseña — funciona sin errores.

4. **Refactorizar `lib/auth-context.tsx` — mover Supabase client dentro de AuthProvider:**
   - Eliminar `const supabase = createClient()` de línea 43 (nivel de módulo).
   - Crear instancia dentro de `AuthProvider` con `useMemo`: `const supabase = useMemo(() => createClient(), [])`.
   - Actualizar `fetchDisplayName` para recibir `supabase` como parámetro en vez de usar variable de módulo.
   - Verificación: importar `auth-context` en un test SSR no causa error. Login/logout siguen funcionando.

5. **Reemplazar `getSession()` por `getUser()` en verificación inicial:**
   - En `AuthProvider` useEffect (línea 75): cambiar `supabase.auth.getSession()` por `supabase.auth.getUser()`.
   - `getUser()` hace roundtrip al servidor de Supabase Auth para verificar que el JWT es válido, no solo lee del storage local.
   - Mantener `onAuthStateChange` como está (listener de cambios, no verificación inicial).
   - Verificación: abrir app con token expirado en localStorage — no muestra usuario fantasma, redirige correctamente.

6. **Eliminar race condition en signUp — quitar SELECT previo:**
   - En `signUp` callback (línea 112-133): eliminar el bloque que hace `supabase.from('profiles').select('id').eq('display_name', formatted).single()`.
   - Dejar que `supabase.auth.signUp()` ejecute el trigger `handle_new_user` que intenta INSERT en `profiles`.
   - Si el INSERT falla por unique violation en `display_name`, el signup de Supabase Auth puede completarse pero el profile no se crea.
   - Manejar esto: después de `signUp`, verificar que el profile existe. Si no (por conflicto), mostrar error "Ese nombre ya está en uso" y opcionalmente llamar `supabase.auth.admin.deleteUser()` o dejar que el usuario intente con otro nombre en el próximo login.
   - Alternativa más simple: capturar el error del trigger en el response de signUp (Supabase retorna error si el trigger falla) y mostrar mensaje apropiado.
   - Verificación: dos usuarios intentan registrar mismo nombre simultáneamente — uno tiene éxito, otro ve error claro.

## Acceptance criteria

- [ ] `middleware.ts` existe en raíz del proyecto y se ejecuta en cada request de página.
- [ ] Middleware refresca tokens JWT expirados automáticamente (cookie `sb-*-auth-token` se actualiza).
- [ ] Middleware no bloquea ninguna ruta — todas las páginas siguen accesibles sin sesión.
- [ ] Matcher del middleware excluye correctamente assets estáticos (`_next/static`, imágenes, favicon).
- [ ] `/auth/reset` renderiza página con campo de nueva contraseña.
- [ ] `/auth/reset` valida contraseña con misma regex de SPEC 14 (8+ chars, mayúsculas, minúsculas, dígitos, símbolos).
- [ ] `/auth/reset` llama `updateUser({ password })` y redirige a `/games` en éxito.
- [ ] `/auth/reset` muestra error claro si `updateUser` falla.
- [ ] Flujo completo de reset funciona: solicitar en `/auth` → email recibido → click link → `/auth/reset` → nueva contraseña → login con nueva contraseña.
- [ ] `getSession()` reemplazado por `getUser()` en verificación inicial de `AuthProvider`.
- [ ] No hay instanciación de `createClient()` a nivel de módulo en `auth-context.tsx`.
- [ ] `signUp` no hace SELECT previo a `profiles` para verificar display_name.
- [ ] Nombre duplicado en registro muestra error "nombre ya en uso" sin race condition.
- [ ] Login, logout, OAuth siguen funcionando sin regresiones.
- [ ] Todos los juegos siguen funcionando sin regresiones.
- [ ] `npm run dev` sin errores.
- [ ] No hay errores de TypeScript.

## Decisions

| Decisión                         | Elegido                                                   | Descartado                                 | Razón                                                                                                                                                              |
| -------------------------------- | --------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Middleware: proteger rutas       | Solo refresh de tokens, sin protección de rutas           | Redirigir a `/auth` en rutas protegidas    | Filosofía de SPEC 13: acceso libre a todo, RLS protege datos. Middleware solo mantiene sesiones frescas.                                                           |
| Middleware: implementación       | `createServerClient` de `@supabase/ssr` + `getUser()`     | Middleware custom con JWT decode manual    | `@supabase/ssr` es la implementación oficial, maneja refresh automáticamente.                                                                                      |
| Reset page: confirmar contraseña | Un solo campo + botón mostrar/ocultar                     | Dos campos (contraseña + confirmar)        | SPEC 14 descartó confirm password. Menos fricción para un arcade. Botón de mostrar/ocultar previene typos.                                                         |
| getSession vs getUser            | `getUser()` para verificación inicial                     | Mantener `getSession()`                    | `getSession()` lee del storage local sin verificar con el servidor. `getUser()` hace roundtrip y confirma que el JWT es válido. Recomendación oficial de Supabase. |
| Supabase client: ubicación       | `useMemo` dentro de `AuthProvider`                        | Singleton a nivel de módulo                | Nivel de módulo se ejecuta en import — si se importa en contexto SSR accidentalmente, falla. Dentro del componente es seguro.                                      |
| Race condition display_name      | Eliminar SELECT previo, manejar error de unique violation | Mantener SELECT como hint + error handling | SELECT previo es redundante: el unique constraint en DB ya lo protege. Eliminarlo cierra la ventana de race condition y simplifica el código.                      |
| CSP header                       | Fuera de scope                                            | Incluir CSP básico                         | SPEC 14 lo dejó fuera explícitamente. Requiere auditoría completa de scripts/styles inline (Tailwind, canvas de juegos). Merece su propio spec.                    |

## Risks

| Riesgo                                                                                        | Mitigación                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getUser()` agrega latencia en carga inicial (roundtrip a Supabase Auth)                      | El middleware ya refresca el token en cada request, así que `getUser()` normalmente valida un token fresco — roundtrip es rápido (~50-100ms). Si es perceptible, se puede cachear con `onAuthStateChange` como complemento.     |
| Middleware intercepta requests a API routes innecesariamente                                  | Matcher configurado para excluir `_next/static`, imágenes y favicon. API routes (`/api/*`) pasan por middleware pero el overhead es mínimo (solo lee/escribe cookie).                                                           |
| Trigger `handle_new_user` falla por display_name duplicado y deja usuario en auth sin profile | Capturar error en response de signUp. Si el trigger falla, Supabase retorna el error. Mostrar mensaje claro al usuario. El usuario puede reintentar con otro nombre — Supabase no crea usuario duplicado si el email ya existe. |
| Página `/auth/reset` accesible sin token de reset en URL (usuario navega directo)             | `updateUser()` falla si no hay sesión activa de reset. Mostrar error "Link inválido o expirado" y link para solicitar nuevo reset.                                                                                              |

## What is **not** in this spec

- Content-Security-Policy (CSP) header.
- Protección de rutas con middleware (redirigir a `/auth`).
- Campo de confirmar contraseña.
- Rate limiting custom en middleware.
- PKCE flow explícito.
- Protección CSRF adicional.
- Password strength meter visual.
- Migración a middleware de protección de rutas protegidas.

Cada uno de esos, si se implementa, va en su propio spec.
