# SPEC 13 — Autenticación real con Supabase Auth

> **Status:** Aprobado
> **Depends on:** SPEC 04 (Supabase integración)
> **Date:** 2026-10-28
> **Objective:** Reemplazar la autenticación falsa de localStorage con Supabase Auth real: registro con email+password, login con email+password y OAuth (Google/GitHub), recuperación de contraseña, y protección de scores con RLS.

## Por qué este spec existe

La autenticación actual es cosmética: `lib/auth-context.tsx` guarda solo un nombre en localStorage, los campos de email y password en la UI son decorativos (los valores se descartan), los botones de Google y GitHub son stubs sin event handlers, y los scores se insertan sin ninguna verificación de identidad — cualquier persona puede enviar scores bajo cualquier nombre. Esto impide tener leaderboards confiables y no provee identidad real de usuarios.

## Scope

**In:**

- Registro con email + password + display name (max 10 chars, uppercase, único).
- Login con email + password.
- Login con Google OAuth.
- Login con GitHub OAuth.
- Recuperación de contraseña (envío de email + página para confirmar nueva contraseña).
- Tabla `profiles` en Supabase con `display_name` unique para enforcement de nombres únicos.
- Trigger en DB que auto-crea profile al registrarse.
- Columna `user_id` (nullable) en tabla `scores` con FK a `auth.users`.
- RLS básico en `scores`: solo usuarios autenticados pueden insertar, lectura pública.
- Reescritura de `auth-context.tsx` para usar Supabase Auth (sesiones reales, tokens, listener de auth state).
- Reescritura de `app/auth/page.tsx` con formularios funcionales.
- Ruta de callback OAuth (`app/auth/callback/route.ts`).
- Página de confirmación de reset password (`app/auth/reset/page.tsx`).
- Actualización de `nav.tsx`, `player-hud.tsx`, `scores-client.ts`, los 5 game components, y `hall-client.tsx`.
- Usuarios no autenticados pueden jugar pero no guardan scores.

**Out of scope (para futuros specs):**

- Migración de scores existentes (quedan con `user_id = NULL`, visibles en leaderboard).
- Verificación de email obligatoria (acceso inmediato sin confirmar email).
- Avatares o perfil extendido del usuario.
- Página de perfil de usuario.
- Edición de display name post-registro.
- Supabase Auth con magic links o OTP.
- Rate limiting en registro/login.
- Protección anti-bot (captcha).
- Dashboard de administración de usuarios.

## Data model

```sql
-- Tabla profiles (nueva)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null unique,
  created_at timestamptz not null default now()
);

-- Constraint: display_name max 10 chars, uppercase
alter table public.profiles
  add constraint display_name_format
  check (display_name = upper(display_name) and char_length(display_name) between 1 and 10);

-- RLS en profiles
alter table public.profiles enable row level security;
-- Lectura pública (para leaderboards)
create policy "profiles_select" on public.profiles for select using (true);
-- Cada usuario solo puede insertar/actualizar su propio profile
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);
```

```sql
-- Trigger: auto-crear profile al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, upper(substring(new.raw_user_meta_data->>'display_name' from 1 for 10)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

```sql
-- Columna user_id en scores (nullable para scores históricos)
alter table public.scores add column user_id uuid references auth.users(id) on delete set null;

-- RLS en scores
alter table public.scores enable row level security;
-- Lectura pública
create policy "scores_select" on public.scores for select using (true);
-- Insert solo autenticados, user_id debe coincidir con sesión
create policy "scores_insert" on public.scores for insert
  with check (auth.uid() is not null and user_id = auth.uid());
```

```ts
// Tipo User actualizado en auth-context.tsx
interface User {
  id: string;
  email: string;
  displayName: string;
}
```

## Implementation plan

1. **Migraciones Supabase — tabla `profiles`:**
   - Crear tabla `profiles` con columns `id`, `display_name`, `created_at`.
   - Agregar constraint `display_name_format` (uppercase, 1-10 chars).
   - Habilitar RLS: select público, insert/update solo owner.
   - Crear función `handle_new_user()` y trigger `on_auth_user_created`.
   - Verificación: tabla existe en Supabase dashboard, trigger visible.

2. **Migraciones Supabase — columna `user_id` en `scores` + RLS:**
   - Agregar columna `user_id` (uuid, nullable, FK a auth.users).
   - Habilitar RLS en `scores`.
   - Policies: select público, insert requiere `auth.uid()` y `user_id = auth.uid()`.
   - Verificación: columna visible en Supabase dashboard, insert anónimo falla.

3. **Crear `app/auth/callback/route.ts` — OAuth callback handler:**
   - Route handler GET que recibe `code` del query string.
   - Llama `supabase.auth.exchangeCodeForSession(code)`.
   - Redirige a `/games` en éxito, a `/auth?error=oauth` en fallo.
   - Verificación: ruta responde a GET requests sin error.

4. **Reescribir `lib/auth-context.tsx` — Supabase Auth:**
   - Nuevo tipo `User { id, email, displayName }`.
   - `AuthProvider` inicializa sesión con `supabase.auth.getSession()`.
   - Listener `supabase.auth.onAuthStateChange()` actualiza estado.
   - Para obtener `displayName`: query a `profiles` tabla por `auth.uid()`.
   - Exportar funciones: `signIn(email, password)`, `signUp(email, password, displayName)`, `signInWithOAuth(provider)`, `signOut()`, `resetPassword(email)`.
   - Cleanup del listener en unmount.
   - Verificación: `useAuth()` retorna user correcto después de login.

5. **Reescribir `app/auth/page.tsx` — UI de autenticación funcional:**
   - Tab "INICIAR SESIÓN": campos email + password, botón submit, link "¿Olvidaste tu contraseña?".
   - Tab "CREAR CUENTA": campos display name + email + password, botón submit. Validación: display name max 10 chars, uppercase preview, check uniqueness antes de submit.
   - Ambos tabs: botones Google y GitHub funcionales (llaman `signInWithOAuth`).
   - Estados de error: email inválido, password corto, display name tomado, credenciales incorrectas.
   - Redirect a `/games` después de login/registro exitoso.
   - Si usuario ya está autenticado y visita `/auth`, redirigir a `/games`.
   - Verificación: formulario envía a Supabase Auth, errores se muestran.

6. **Crear `app/auth/reset/page.tsx` — confirmación de nueva contraseña:**
   - Página con campo de nueva contraseña + confirmación.
   - Llama `supabase.auth.updateUser({ password })`.
   - Redirige a `/games` en éxito, muestra error si falla.
   - Verificación: accesible desde link en email de reset.

7. **Actualizar `components/nav.tsx`:**
   - `user.displayName` en vez de `user.name` para mostrar nombre.
   - `signOut()` en vez de `logout()` para cerrar sesión.
   - Verificación: nombre aparece en nav, logout cierra sesión real.

8. **Actualizar `lib/supabase/scores-client.ts`:**
   - `submitScore` ya no recibe `playerName` como parámetro.
   - Obtiene sesión actual con `supabase.auth.getUser()`.
   - Si no hay sesión, no envía score (retorna null o throw).
   - Insert incluye `user_id` del usuario autenticado.
   - `player_name` se obtiene del profile del usuario (query o del context).
   - Verificación: score se inserta con `user_id` correcto, falla sin sesión.

9. **Actualizar game components (5 archivos) y `player-hud.tsx` / `hall-client.tsx`:**
   - `components/games/asteroids.tsx`, `tetris.tsx`, `snake.tsx`, `frogger.tsx`, `arkanoid.tsx`: `handleGameOver` usa nuevo `submitScore` sin `playerName` explícito. Si `user` es null (no autenticado), no envía score.
   - `components/player-hud.tsx`: `user.displayName` en vez de `user.name`.
   - `app/hall/hall-client.tsx`: highlight por `user_id` en vez de `player_name`.
   - Verificación: juegos funcionan, scores se guardan solo si autenticado.

10. **Configurar proveedores OAuth en Supabase dashboard:**
    - Habilitar Google OAuth provider con client ID + secret.
    - Habilitar GitHub OAuth provider con client ID + secret.
    - Configurar redirect URL: `{SITE_URL}/auth/callback`.
    - Configurar Site URL en Supabase dashboard.
    - Nota: este paso es manual en el dashboard, no es código.

## Acceptance criteria

- [ ] Registro con email+password crea usuario en Supabase Auth y profile en tabla `profiles`.
- [ ] Display name se almacena uppercase, max 10 chars, es único (registrar duplicado muestra error).
- [ ] Login con email+password autentica y redirige a `/games`.
- [ ] Login con Google OAuth redirige a Google, regresa autenticado a `/games`.
- [ ] Login con GitHub OAuth redirige a GitHub, regresa autenticado a `/games`.
- [ ] Navbar muestra display name cuando autenticado, "Iniciar Sesión" cuando no.
- [ ] Logout cierra sesión real de Supabase y limpia estado del cliente.
- [ ] "¿Olvidaste tu contraseña?" envía email con link de recuperación.
- [ ] Página de reset permite ingresar nueva contraseña y funciona.
- [ ] Usuarios no autenticados pueden navegar y jugar libremente.
- [ ] Usuarios no autenticados NO pueden guardar scores (insert falla por RLS).
- [ ] Usuarios autenticados guardan scores con `user_id` correcto.
- [ ] Scores históricos (sin `user_id`) siguen visibles en leaderboard.
- [ ] Player HUD muestra display name del usuario autenticado (o "INVITADO" si no hay sesión).
- [ ] Hall of Fame resalta scores del usuario autenticado actual.
- [ ] Visitar `/auth` estando autenticado redirige a `/games`.
- [ ] Error de credenciales incorrectas muestra mensaje claro en la UI.
- [ ] Middleware existente (`middleware.ts`) sigue refrescando sesiones correctamente.
- [ ] `npm run dev` sin errores.
- [ ] No hay errores de TypeScript.
- [ ] Todos los juegos existentes siguen funcionando sin regresiones.

## Decisions

- **Sí:** Supabase Auth. Ya tenemos Supabase integrado, evita dependencia extra, maneja sesiones/tokens/OAuth out of the box.
- **No:** Auth.js (NextAuth). Agrega dependencia, duplica infraestructura ya existente con Supabase.
- **No:** Auth custom con bcrypt. Riesgo de seguridad, mucho código, reinventar lo que Supabase Auth ya resuelve.
- **Sí:** Tabla `profiles` para display name único. user_metadata de Supabase no soporta constraints de unicidad. Tabla permite queries eficientes y constraint a nivel DB.
- **No:** Solo user_metadata sin tabla profiles. No se puede enforcar unicidad sin tabla.
- **Sí:** Acceso inmediato sin verificación de email. Es un arcade, la fricción de verificar email no justifica la seguridad extra.
- **No:** Verificación de email obligatoria. Barrera de entrada innecesaria para un juego.
- **Sí:** Scores históricos quedan con `user_id = NULL`. Migración de scores existentes es compleja (¿a quién pertenecen?) y de bajo valor.
- **No:** Vincular scores viejos por nombre al registrarse. Alguien podría reclamar scores ajenos.
- **Sí:** RLS básico (insert solo autenticados, select público). Mínimo viable para proteger integridad de scores.
- **No:** RLS completo (update/delete propios scores). Fuera de scope, no hay UI para editar/borrar scores.
- **Sí:** Jugar sin cuenta permitido (sin guardar scores). Baja fricción para explorar el sitio.
- **No:** Cuenta obligatoria para jugar. Barrera innecesaria para un arcade casual.

## Risks

| Risk                                                                                                | Mitigation                                                                                                                                      |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| OAuth providers requieren configuración manual en dashboard de Supabase + consolas de Google/GitHub | Documentar paso a paso en step 10. Si no se configuran, botones OAuth muestran error graceful en UI.                                            |
| Trigger `handle_new_user` falla si display_name no viene en metadata (OAuth sin display name)       | Para OAuth, generar display name temporal del email (parte antes del @, uppercase, truncado a 10). Dejar que usuario lo cambie es scope futuro. |
| Display name duplicado en OAuth (nombre generado ya existe)                                         | Agregar sufijo numérico incremental en el trigger si insert falla por unique constraint.                                                        |
| Scores antiguos sin `user_id` no se pueden vincular a usuarios nuevos                               | Aceptado: scores viejos son legacy. Nuevos scores siempre tienen `user_id`. Leaderboard muestra ambos.                                          |
| `player_name` en scores se vuelve redundante con profiles                                           | Mantener `player_name` en scores como campo desnormalizado para queries rápidas de leaderboard sin JOIN.                                        |

## What is **not** in this spec

- Migración de scores existentes a user_ids.
- Verificación de email.
- Página de perfil de usuario.
- Edición de display name post-registro.
- Magic links o OTP.
- Rate limiting o protección anti-bot.
- Dashboard de administración.
- Avatares.

Cada uno de esos, si se implementa, va en su propio spec.
