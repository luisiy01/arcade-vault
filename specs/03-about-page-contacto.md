# SPEC 03 — About page y formulario de contacto con Resend

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-10-14
> **Objective:** Implementar la página About (`/about`) con sección acerca de, highlights, divider decorativo y formulario de contacto que envía correos vía Resend API.

## Scope

**In:**

- Página **About** (`/about`): hero con misión de Arcade Vault, 3 highlight cards (HEART/magenta, BROWSER/cyan, PLANT/green) con iconos SVG pixel art, divider animado con píxeles, y sección de contacto.
- Componente `HighlightIcon` con 3 iconos SVG pixel (HEART, BROWSER, PLANT).
- Formulario de contacto con campos: nombre, correo electrónico, mensaje. Validación client-side (campos requeridos). Animación shake en envío con campos vacíos.
- Estado de éxito estilo terminal retro (`VAULT-OS // TERMINAL`) con líneas de progreso y mensaje personalizado con nombre del usuario. Botón "ENVIAR OTRO MENSAJE" para reiniciar formulario.
- API Route `app/api/contact/route.ts` que recibe datos del formulario y envía email vía Resend a `luisnunez91@gmail.com`.
- Email en texto plano con nombre, correo del remitente y mensaje.
- Manejo de errores: si Resend falla, mostrar mensaje de error visible al usuario en el formulario.
- Hook `useReveal` reutilizado de SPEC 02 (ya existe en `app/games/page.tsx`) para animar secciones `.reveal`.
- Portar estilos CSS del about page desde `references/resources/templates/home-about/styles.css` (líneas 1071–1146: `.about`, `.about-hero`, `.highlight-row`, `.about-divider`, `.about-contact`, `.contact-grid`, `.contact-form`, `.terminal-success`) a `app/globals.css`.
- Actualizar Nav para incluir link "Acerca de" (`/about`) después de "Salón de la Fama", en desktop y menú móvil.
- Instalar dependencia `resend`.
- Variable de entorno `RESEND_API_KEY` en `.env.local`.

**Out of scope (para futuros specs):**

- Rate limiting en API Route de contacto.
- CAPTCHA o protección anti-spam.
- Email HTML estilizado con branding Arcade Vault.
- Guardar mensajes de contacto en base de datos.
- Página de confirmación separada post-envío.

## Data model

No se introducen nuevas estructuras de datos persistentes. El formulario de contacto usa estado local del componente:

```ts
interface ContactForm {
  name: string;
  email: string;
  msg: string;
}
```

La API Route recibe un JSON con estos mismos campos y responde con `{ success: true }` o `{ error: string }`.

## Implementation plan

1. Instalar dependencia `resend` con `npm install resend`. Crear `.env.local` con `RESEND_API_KEY=` (vacío, el usuario agrega su clave).
2. Crear `app/api/contact/route.ts` con handler POST que valida campos, instancia `Resend` con `RESEND_API_KEY`, y envía email en texto plano a `luisnunez91@gmail.com`. Devuelve JSON con `success` o `error`.
3. Crear `components/highlight-icon.tsx` con los 3 iconos SVG pixel (HEART, BROWSER, PLANT) portados del template `about.jsx`.
4. Crear `app/about/page.tsx` (client component) con todas las secciones del about: hero con misión y 3 highlights, divider animado con 24 píxeles, y sección contacto con grid (intro + formulario). Incluir estados: formulario, shake en error de validación, loading durante envío, éxito con terminal retro, y error de API con mensaje visible. Reutilizar patrón `useReveal` de SPEC 02.
5. Portar estilos CSS del about page desde template (`styles.css` líneas 1071–1146) a `app/globals.css`. Verificar que no haya conflicto con estilos existentes.
6. Actualizar `components/nav.tsx`: agregar link "Acerca de" apuntando a `/about` después de "Salón de la Fama", actualizar `isActive` para ruta `/about`, actualizar menú móvil con mismo link.

## Acceptance criteria

- [ ] `/about` muestra hero con título "ACERCA DE ARCADE VAULT", kicker "▸ ACERCA DE", y párrafo de misión.
- [ ] 3 highlight cards visibles con iconos SVG pixel (HEART/magenta, BROWSER/cyan, PLANT/green) y efecto hover.
- [ ] Divider animado con barra magenta y 24 píxeles parpadeantes (cyan, magenta, yellow).
- [ ] Sección contacto muestra grid con intro (kicker, título "CONTÁCTANOS", subtítulo, 3 tips con LED) y formulario.
- [ ] Formulario tiene campos: nombre, correo electrónico, mensaje con placeholders del template.
- [ ] Enviar con campos vacíos dispara animación shake y no envía.
- [ ] Enviar con campos completos llama a `POST /api/contact` y muestra estado loading.
- [ ] Si email se envía correctamente, formulario se reemplaza por terminal retro con líneas de progreso y mensaje personalizado "GRACIAS, {NOMBRE}."
- [ ] Botón "ENVIAR OTRO MENSAJE" reinicia formulario a estado inicial.
- [ ] Si Resend falla, se muestra mensaje de error visible al usuario en el formulario.
- [ ] `POST /api/contact` con campos válidos envía email en texto plano a `luisnunez91@gmail.com` vía Resend.
- [ ] `POST /api/contact` con campos faltantes devuelve error 400.
- [ ] Nav muestra links: Inicio, Biblioteca, Salón de la Fama, Acerca de. Link activo resaltado correctamente en `/about`.
- [ ] Menú móvil incluye link "Acerca de".
- [ ] Secciones con clase `.reveal` aparecen con animación al hacer scroll.
- [ ] `npm run dev` sin errores en consola.
- [ ] No hay errores de TypeScript.

## Decisions

- **Yes:** Ruta `/about`. Consistente con convención de rutas en inglés del proyecto (SPEC 01).
- **No:** Ruta `/acerca-de`. Rompería convención establecida.
- **Yes:** Resend para envío de correos. SDK oficial para Node.js, API simple, buen free tier.
- **No:** Nodemailer + SMTP. Más configuración, credenciales SMTP más complejas de gestionar.
- **No:** SendGrid / Mailgun. Más pesados para un formulario de contacto simple.
- **Yes:** Email en texto plano. Simple, rápido, no se rompe en ningún cliente de correo.
- **No:** Email HTML estilizado. Más trabajo, riesgo de renderizado inconsistente entre clientes.
- **Yes:** Mostrar error al usuario cuando Resend falla. Transparencia, el usuario puede reintentar.
- **No:** Simular éxito siempre. El usuario no sabría si su mensaje llegó.
- **Yes:** `RESEND_API_KEY` en `.env.local`. Convención estándar de Next.js para secrets.
- **Yes:** Link "Acerca de" después de "Salón de la Fama" en Nav. Igual que template de referencia.
- **Yes:** Componente `HighlightIcon` separado. Reutilizable y mantiene About limpio.

## Risks

| Risk | Mitigation |
| --- | --- |
| `RESEND_API_KEY` no configurada en `.env.local` | Validar presencia al arrancar y devolver error descriptivo en API Route. |
| Resend free tier con límite de envíos | Suficiente para formulario de contacto. Rate limiting queda fuera de scope. |
| Spam en formulario de contacto | CAPTCHA queda para futuro spec. Por ahora aceptable dado bajo tráfico esperado. |

## What is **not** in this spec

- Rate limiting en API de contacto.
- CAPTCHA o protección anti-spam.
- Email con diseño HTML/branding.
- Persistencia de mensajes de contacto en DB.
- Página de confirmación post-envío separada.

Each one of those, if it lands, goes in its own spec.
