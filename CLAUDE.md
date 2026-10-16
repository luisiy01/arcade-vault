# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault — online gaming platform where players compete for high scores. Built with Next.js 16.4, React 19, TypeScript, Tailwind CSS v4.

No test framework configured yet.

## Next.js 16 — Read Bundled Docs First

This project runs Next.js 16.4 which has breaking changes from earlier versions. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/` — do not rely on training data. The `AGENTS.md` file is auto-managed by `next dev` and should be committed as-is.

Key config flags enabled in `next.config.ts`:

- `experimental.agentFeedback` — structured error reporting for agents
- `cacheComponents` — component-level caching
- `partialPrefetching` — partial prefetching
- Turbopack with `@tailwindcss/turbopack` loader for CSS

## Skills

Usa siempre /frontend-design para diseñar la interfaz de usuario.

## Architecture

- **App Router** (`app/` directory) — no Pages Router
- `app/layout.tsx` — root layout using `LayoutProps<"/">` type (Next.js 16 convention), Geist font family
- `app/globals.css` — Tailwind v4 via `@import "tailwindcss"` with `@theme inline` for custom tokens
- Path alias: `@/*` maps to project root

## Design Approach

Project follows Spec Driven Design with `/spec` and `/spec-impl` directories (not yet created). Based on practices from `Klerith/fernando-skills`.

## Language

README and project context are in Spanish. Follow user's language preference.
