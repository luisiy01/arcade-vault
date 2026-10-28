# SPEC 14 — Medidas de seguridad básicas

> **Status:** Aprobado
> **Depends on:** SPEC 13 (Auth con Supabase Auth)
> **Date:** 2026-10-28
> **Objective:** Implementar las medidas de seguridad pendientes del checklist: RLS en tabla `games`, headers HTTP de seguridad en Next.js, validación client-side de contraseña con regex, y configuración de seguridad en Supabase Auth dashboard.

## Por qué este spec existe

El checklist de seguridad (`references/security/security-checklist.md`) tiene 5 items sin completar. La tabla `games` no tiene RLS habilitado — cualquier cliente con anon key podría potencialmente insertar/modificar juegos. No hay headers de seguridad HTTP en ninguna respuesta del servidor. La validación de contraseña es mínima (`minLength={6}`, sin requisitos de complejidad) — contraseñas débiles pasan al servidor. Las configuraciones de seguridad de Supabase Auth (longitud mínima, leaked password protection, rate limiting) no están verificadas.

## Scope

**In:**

- Habilitar RLS en tabla `games` con policy de solo lectura pública.
- Verificar que RLS en `scores` y `profiles` esté activo (implementado en SPEC 13).
- Agregar headers de seguridad HTTP en `next.config.ts`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- Validación client-side de contraseña con regex en `app/auth/page.tsx`: mínimo 8 caracteres, debe contener minúsculas, mayúsculas, dígitos y símbolos. Mensaje de error en UI cuando no cumple requisitos. No enviar a Supabase si falla regex.
- Configurar en Supabase dashboard: mínimo 8 caracteres para password (server-side), leaked password protection, rate limiting nativo de signups.
- Revisar panel de warnings/errores de Supabase y resolver hallazgos.
- Proteccion de rutas con Proxy Next.js: Informacion sobre proxy aqui:
  https://nextjs.org/docs/app/getting-started/proxy

  Ejemplo: app/proxy.ts

  ```ts
  import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url))
}

// Alternatively, you can use a default export:
// export default function proxy(request: NextRequest) { ... }

export const config = {
  matcher: '/about/:path*',
}
  ```

**Out of scope (para futuros specs):**

- Middleware custom de rate limiting (solo config nativa de Supabase).
- Content-Security-Policy header (requiere evaluación separada por scripts/estilos inline de Tailwind).
- Strict-Transport-Security (HSTS) — Vercel lo maneja a nivel de plataforma.
- Infraestructura de migration files (`supabase/migrations/`).
- Policies adicionales en `games` más allá de lectura pública.
- Password strength meter visual (indicador de fuerza de contraseña).

## Data model

```sql
-- RLS en tabla games (nueva policy)
alter table public.games enable row level security;

-- Solo lectura pública — nadie puede insertar/modificar desde el cliente
create policy "games_select" on public.games
  for select using (true);
```

No se crean tablas ni columnas nuevas. Solo se habilita RLS y se agrega una policy.

## Implementation plan

1. **Verificar RLS activo en `scores` y `profiles`:**
   - Ejecutar SQL en Supabase para confirmar que RLS está habilitado:
     ```sql
     select tablename, rowsecurity from pg_tables
     where schemaname = 'public' and tablename in ('scores', 'profiles');
     ```
   - Si `rowsecurity = true` en ambas, continuar. Si no, habilitar RLS y crear policies de SPEC 13.
   - Verificación: query retorna `rowsecurity = true` para ambas tablas.

2. **Habilitar RLS en `games` + policy `games_select`:**
   - Ejecutar SQL en Supabase:
     ```sql
     alter table public.games enable row level security;
     create policy "games_select" on public.games for select using (true);
     ```
   - Verificación: `select * from games` funciona con anon key. `insert into games (...)` falla con anon key.

3. **Agregar headers de seguridad en `next.config.ts`:**
   - Agregar función `headers()` al objeto de configuración:
     ```ts
     async headers() {
       return [
         {
           source: '/(.*)',
           headers: [
             { key: 'X-Content-Type-Options', value: 'nosniff' },
             { key: 'X-Frame-Options', value: 'DENY' },
             { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
           ],
         },
       ];
     },
     ```
   - Verificación: `npm run dev`, abrir DevTools → Network → cualquier request → Response Headers muestra los 3 headers.

4. **Validación client-side de contraseña en `app/auth/page.tsx`:**
   - Agregar regex de validación:
     ```ts
     const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
     ```
   - En `handleSignUp`, reemplazar check actual (`password.length < 6`) por validación con regex:
     ```ts
     if (!PASSWORD_REGEX.test(password)) {
       setError(
         'Contraseña debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos.',
       );
       return;
     }
     ```
   - Actualizar atributo `minLength` del input de password de `6` a `8`.
   - No se modifica `handleSignIn` — login envía directo a Supabase (la validación de complejidad solo aplica a registro).
   - Verificación: intentar registrar con "abc123" muestra error. Registrar con "Abc123!@" pasa validación.

5. **Proteccion de rutas con Proxy Next.js**

6. **Configurar Supabase Auth — mínimo 8 caracteres (dashboard):**
   - Ir a Supabase Dashboard → Authentication → Auth Providers → Email.
   - Cambiar "Min password length" de 6 (default) a 8.
   - Esto agrega validación server-side que complementa la client-side.
   - Verificación: intentar signup vía API directa con password de 7 chars retorna error.

7. **Habilitar leaked password protection (dashboard):**
   - Ir a Supabase Dashboard → Authentication → Auth Providers → Email.
   - Activar "Leaked password protection" (corresponde a warning 4 del panel de advisors).
   - Verificación: setting activado en dashboard. Intentar registrar con password conocido como filtrado (ej: "Password1!") muestra error.

8. **Configurar rate limiting de signups (dashboard):**
   - Ir a Supabase Dashboard → Authentication → Rate Limits.
   - Configurar límites para: email signups por hora, email OTP por hora, token refresh por hora.
   - Valores recomendados: 5 signups/hora por IP, 10 token refresh/hora.
   - Verificación: settings configurados en dashboard.

9. **Revisar panel de warnings/errores de Supabase:**
   - Ir a Supabase Dashboard → Advisors (o Security tab).
   - Revisar cada warning pendiente.
   - Resolver los que apliquen a este proyecto.
   - Documentar en PR description qué warnings se encontraron y cuáles se resolvieron.
   - Verificación: panel revisado, warnings críticos resueltos.

## Acceptance criteria

- [ ] RLS habilitado en tabla `games` con policy `games_select` (select público).
- [ ] RLS verificado activo en tablas `scores` y `profiles`.
- [ ] `insert into games` desde cliente anónimo falla (blocked por RLS).
- [ ] `select * from games` desde cliente anónimo funciona.
- [ ] Response headers incluyen `X-Content-Type-Options: nosniff`.
- [ ] Response headers incluyen `X-Frame-Options: DENY`.
- [ ] Response headers incluyen `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] Registro con contraseña sin mayúsculas muestra error en UI, no llama a Supabase.
- [ ] Registro con contraseña sin minúsculas muestra error en UI, no llama a Supabase.
- [ ] Registro con contraseña sin dígitos muestra error en UI, no llama a Supabase.
- [ ] Registro con contraseña sin símbolos muestra error en UI, no llama a Supabase.
- [ ] Registro con contraseña menor a 8 caracteres muestra error en UI, no llama a Supabase.
- [ ] Registro con contraseña que cumple todos los requisitos pasa validación client-side.
- [ ] Login no aplica validación de complejidad (solo registro).
- [ ] Supabase Auth configurado con min password length = 8.
- [ ] Leaked password protection activado en Supabase dashboard.
- [ ] Rate limiting de signups configurado en Supabase dashboard.
- [ ] Panel de warnings/errores de Supabase revisado.
- [ ] `npm run dev` sin errores.
- [ ] Todos los juegos existentes siguen funcionando sin regresiones.

## Decisions

| Decisión                    | Elegido                                                                         | Descartado                      | Razón                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dónde validar password      | Client-side en `page.tsx` + server-side en Supabase config                      | Solo server-side                | UX: feedback inmediato sin roundtrip. Seguridad: server-side como fallback si alguien bypassa el cliente.                                                                   |
| Regex de complejidad        | `(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])` (4 grupos + min 8)            | zxcvbn o librería de strength   | Requisitos claros y verificables. zxcvbn agrega dependencia de ~800KB para un arcade casual.                                                                                |
| Validación en login         | No aplicar                                                                      | Aplicar misma regex en login    | Login debe poder enviar cualquier password — la validación de complejidad es solo para nuevas contraseñas. Si password se creó antes de esta regla, debe poder hacer login. |
| Headers de seguridad        | 3 headers esenciales (X-Content-Type-Options, X-Frame-Options, Referrer-Policy) | Incluir CSP y HSTS              | CSP requiere auditoría de scripts/estilos inline (Tailwind, canvas). HSTS lo maneja Vercel. Los 3 elegidos son seguros de agregar sin side effects.                         |
| RLS en `games`              | Solo select público                                                             | Select + insert para admin role | No hay panel admin. Juegos se insertan vía Supabase dashboard o service role key. Policy de insert innecesaria.                                                             |
| Rate limiting               | Config nativa de Supabase Auth                                                  | Middleware custom en Next.js    | Supabase ya ofrece rate limiting por IP para Auth endpoints. Middleware custom es over-engineering para este caso.                                                          |
| Scope de Supabase dashboard | Documentar pasos como steps de implementación                                   | Solo código                     | Items 2-4 del checklist son configuraciones de dashboard. Documentarlos garantiza que se ejecutan y se pueden verificar.                                                    |

## Identified risks

| Riesgo                                                                  | Mitigación                                                                                                 |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Regex demasiado estricto para usuarios casuales de un arcade            | Mensaje de error claro lista exactamente qué falta. No se pide confirm password (mantener fricción baja).  |
| Passwords existentes (creados con min 6 chars) no cumplen nueva regex   | Validación de complejidad solo en registro, no en login. Usuarios existentes pueden seguir autenticándose. |
| Leaked password protection puede rechazar passwords válidos del usuario | Es un false positive aceptable — el usuario elige otra contraseña. Mejor seguridad que conveniencia.       |
| Headers de seguridad podrían romper embeds si alguien embebe la app     | `X-Frame-Options: DENY` es intencional — no hay caso de uso para embeber Arcade Vault en iframe.           |
| Rate limiting muy agresivo podría bloquear usuarios legítimos           | Valores conservadores (5 signups/hora por IP). Un arcade no espera más de eso por IP individual.           |

## What is **not** in this spec

- Content-Security-Policy (CSP) header.
- Strict-Transport-Security (HSTS) header.
- Password strength meter visual.
- Middleware custom de rate limiting.
- Infraestructura de migration files.
- Confirm password field en registro.
- Forzar cambio de contraseña a usuarios existentes.
- Políticas de expiración de contraseña.

Cada uno de esos, si se implementa, va en su propio spec.
