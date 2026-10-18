---
name: new-game
description: Generates a complete spec for integrating a new game into Arcade Vault — handles game logic adaptation, React wrapper, GameLoader registration, Supabase game record, leaderboard/score submission, and cover assets. Works with reference games from references/resources/started-games/ or games built from scratch.
disable-model-invocation: true
argument-hint: 'game name or id (e.g. tetris, arkanoid, snake)'
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*)
---

# /new-game — Game integration spec generator

## Session context

Today's date:
!`date +%F`

Existing specs:
!`ls specs/ 2>/dev/null || echo "No specs/ folder yet"`

Existing games in the platform:
!`ls lib/games/ 2>/dev/null || echo "No games yet"`

Current GameLoader registry:
!`cat components/game-loader.tsx 2>/dev/null || echo "No game-loader yet"`

Reference games available:
!`ls references/resources/started-games/ 2>/dev/null || echo "No reference games"`

Current games in Supabase types:
!`cat lib/supabase/types.ts 2>/dev/null || echo "No types yet"`

---

## Purpose

This skill generates a **complete spec** for adding a new game to the Arcade Vault platform. It knows the established integration patterns from SPEC 05 (Asteroids) and SPEC 06 (Leaderboard) and applies them consistently to every new game.

It does **not** write game code — it produces a spec file that `/spec-impl` then executes.

## Foundational dependency: the /spec skill

This skill **delegates spec authoring conventions** to the `/spec` skill. Before writing any spec file, you **must** read these two files to absorb the project's spec-driven method, structure, tone, and rules:

1. **`.claude/skills/spec/SKILL.md`** — the full `/spec` skill instructions (phases, question philosophy, writing rules, saving rules, hard rules).
2. **`.claude/skills/spec/template.md`** — the canonical spec template (header format, section order, anti-patterns, global rules).

**How to apply what you read:**

- **Spec structure and section order** — follow `template.md` exactly. The game-specific content described later in this skill fills those sections, but the shape (header blockquote, Scope with In/Out, Data model, Implementation plan, Acceptance criteria, Decisions, Risks, What is not in this spec) comes from the template.
- **Writing quality rules** — one sentence per idea, concrete names (file paths not "the module"), no TODOs, no long code blocks, boolean acceptance criteria. All from `template.md`.
- **Question philosophy** — from `SKILL.md` Phase 2: concrete questions not open-ended, blocks of 3-5, use `AskUserQuestion` when available, stop when you can answer: which files change, first/last step, how to verify.
- **Saving rules** — from `SKILL.md` Phase 4: sequential numbering, kebab-case slug, date from session context, Draft state, check dependencies exist, seed `.spec-config.yml` if missing.
- **Language** — match existing specs' language (read the most recent two specs before writing).
- **Hard rules from /spec apply here too** — never write code, never propose implementing, never assume unconfirmed decisions.

If there is a conflict between this skill's game-specific instructions and the `/spec` foundation, the `/spec` rules win for structure and process; this skill wins only for game-specific content (layers, patterns, questions).

## What the generated spec always covers

Every game integration spec must address these layers:

1. **Game logic module** — `lib/games/{game-id}.ts`
   - Exports `start{GameName}(canvas: HTMLCanvasElement, options?: {GameName}Options): () => void`
   - Options interface includes `onGameOver?: (score: number) => void`
   - All state encapsulated in closure (no window globals)
   - Keyboard listeners on window with cleanup
   - Returns cleanup function (cancels requestAnimationFrame, removes listeners)

2. **React wrapper component** — `components/games/{game-id}.tsx`
   - Client Component with `'use client'`
   - `useRef<HTMLCanvasElement>` + `useEffect` calling start function
   - `useAuth()` for user context
   - `submitScore()` integration on game over callback
   - Canvas with `tabIndex={0}` and `autoFocus`

3. **GameLoader registration** — `components/game-loader.tsx`
   - Add dynamic import: `const {GameName}Game = dynamic(() => import(...).then(m => m.{GameName}Game), { ssr: false })`
   - Add entry to `GAME_MAP`: `'{game-id}': {GameName}Game`

4. **Supabase game record** — INSERT into `games` table
   - id (slug), title, short, long, cat, cover, color, best (0), plays ('0')

5. **Cover asset** — `public/covers/cover-{game-id}.svg` or `.png`

6. **Controls legend** — game-specific keyboard controls shown in play page

7. **Canvas dimensions** — may differ from Asteroids' 800x600

## Command flow

### Phase 1 — Identify the game

The received argument is: `$ARGUMENTS`

If `$ARGUMENTS` is empty, ask:

> What game do you want to add? Give me the name or id.

Once you have the game name:

1. **Check if a reference exists.** Look in `references/resources/started-games/` for a matching folder. If found, read its `CLAUDE.md` (if present) and the first 50 lines of `game.js` to understand the game's architecture, canvas size, controls, and state model.

2. **Check if the game already exists** in `lib/games/` or `GAME_MAP`. If it does, tell the user and stop.

3. **Determine the game id** (slug). Follow the pattern: lowercase, kebab-case, recognizable. Examples: `tetris`, `arkanoid`, `snake`, `bloque-buster`.

### Phase 2 — Gather game-specific details

Ask questions in a single block using `AskUserQuestion` where possible. The questions depend on whether a reference game exists.

**If reference game exists**, you already know the architecture. Focus on:

1. **Canvas size** — confirm or change from reference (state what the reference uses).
2. **Category** — ARCADE, PUZZLE, SHOOTER, or VERSUS?
3. **Color** — cyan, magenta, yellow, or green? (for UI theming)
4. **Controls legend** — what text to show? Extract from reference or ask.
5. **Assets** — does the reference use external assets (images, sounds, sprites, levels file)? Which ones should be ported and which omitted?
6. **Score model** — how is score calculated? When does game over trigger? This determines the `onGameOver` callback integration point.
7. **Description** — short (one line for cards) and long (paragraph for detail page).

**If no reference game**, ask all of the above plus:

8. **Game mechanics** — brief description of how the game works.
9. **State model** — what variables does the game track? (lives, level, score, speed, etc.)
10. **Difficulty progression** — does it get harder? How?

**Always ask:**

11. **Anything out of scope for this game spec?** (sounds, responsive canvas, touch controls, multiplayer — these go in future specs)

### Phase 3 — Write the spec

**Before writing anything**, execute these reads in order:

1. Read `.claude/skills/spec/template.md` — absorb the canonical spec structure, section rules, and anti-patterns.
2. Read `.claude/skills/spec/SKILL.md` — absorb the writing rules (Phase 3 fast-path vs section-by-section, Phase 4 saving rules, hard rules).
3. Read the **two most recent specs** in `specs/` — match their language, heading conventions, and state labels.

Only after completing these reads, write the spec. Follow the template structure from step 1 and fill it with game-specific content. Apply the `/spec` writing quality rules throughout.

**Spec structure:**

```markdown
# SPEC NN — {Title}: integración en Arcade Vault

> **Status:** Draft
> **Depends on:** SPEC 04, SPEC 05, SPEC 06
> **Date:** {today}
> **Objective:** {one sentence}

## Scope

**In:**

- Game logic module adaptation/creation
- React wrapper component
- GameLoader registration
- Supabase game record insert
- Score submission on game over
- Cover asset
- Controls legend

**Out of scope (for future specs):**

- {items from question 11}

## Data model

{Game-specific state, interfaces, Supabase record}

## Implementation plan

1. {If reference: Adapt game.js to TypeScript module. If new: Create game logic module.}
   - Receive canvas as parameter
   - Encapsulate state in closure
   - Export start function with options and cleanup return
   - Wire onGameOver callback at the correct point

2. Create React wrapper component
   - useRef/useEffect pattern
   - useAuth + submitScore integration
   - Canvas with correct dimensions, tabIndex, autoFocus

3. Register in GameLoader
   - Dynamic import
   - GAME_MAP entry

4. {If reference has assets: Copy/adapt required assets to public/}

5. Copy/create cover asset to public/covers/

6. Insert game record in Supabase (via SQL migration or MCP tool)

7. Update controls legend in play page if game uses different controls

8. Verify: npm run dev, navigation, gameplay, score submission, leaderboard appearance

## Acceptance criteria

{Generated from the integration layers — always includes:}

- [ ] /game/{id} loads and shows the game
- [ ] Game renders in canvas with correct dimensions
- [ ] Controls work as documented in legend
- [ ] Score displays in HUD during gameplay
- [ ] Game over triggers correctly and shows final score
- [ ] Score submits to Supabase when user is logged in
- [ ] Score does NOT submit when no user is logged in (no error)
- [ ] Submitted score appears in /hall after reload
- [ ] /game/{id} detail page shows game data from Supabase
- [ ] GameLoader shows the game (not "EN DESARROLLO")
- [ ] Cover image displays correctly in library and detail page
- [ ] Mobile warning shows on small screens
- [ ] npm run dev without console errors
- [ ] No TypeScript errors

## Decisions

{Include adaptation decisions: what was kept from reference, what was changed, why}

## Risks

{Game-specific risks + standard ones:}

| Risk                                                | Mitigation                                           |
| --------------------------------------------------- | ---------------------------------------------------- |
| Event listeners interfere with Next.js navigation   | Listeners on window with cleanup in useEffect return |
| Memory leak from requestAnimationFrame              | Cleanup stores RAF id and calls cancelAnimationFrame |
| {game-specific risks from assets, complexity, etc.} | {mitigations}                                        |

## What is **not** in this spec

{Repeat out-of-scope items}
```

### Phase 4 — Save the spec

Follow the saving rules from `.claude/skills/spec/SKILL.md` Phase 4:

1. Determine next spec number from `specs/` listing (highest existing + 1, zero-padded to two digits).
2. Generate slug: `{NN}-{game-id}-game` (e.g. `07-tetris-game`).
3. Use date from session context for `**Date:**` field. Never invent a date.
4. Write to `specs/{NN}-{game-id}-game.md` with state `Draft` (or the equivalent used by existing specs).
5. Check that all specs listed in `**Depends on:**` actually exist in `specs/`. Warn if any is missing.
6. If `specs/.spec-config.yml` does not exist, create it with default content (see `/spec` SKILL.md Phase 4 step 7).
7. Confirm to user: path created, Draft state reminder, next step is `/spec-impl NN-slug`.
8. **Stop.** Do not propose implementing. Do not write code.

## Hard rules

- **Never write game code.** Only the spec file.
- **Never skip Phase 2.** Game-specific details are critical for a good spec.
- **Always check for reference game first.** The adaptation path is different from the from-scratch path.
- **Dependencies always include SPEC 04 (Supabase), SPEC 05 (Asteroids pattern), and SPEC 06 (Leaderboard).** These established the patterns.
- **One game per spec.** If the user wants multiple games, generate one spec per game.
- **Follow the language of existing specs.** Read the most recent spec to match conventions.
- **The `onGameOver` callback is mandatory.** Every game must submit scores. The spec must identify exactly where in the game logic game-over happens.
- **Canvas dimensions must be explicit.** Never assume 800x600 — check the reference or ask.
