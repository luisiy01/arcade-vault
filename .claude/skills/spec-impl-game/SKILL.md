---
name: spec-impl-game
description: Full game pipeline — implements an approved spec via /spec-impl, then runs skin-designer for skin compliance, then mobile-porter for mobile audit. Sequential, not parallel.
disable-model-invocation: true
argument-hint: <NN-spec-name>
allowed-tools: Read, Glob, Grep, Edit, Write, AskUserQuestion, Agent, Skill, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git log:*), Bash(git diff:*), Bash(git stash:*), Bash(cat:*), Bash(ls:*)
---

# /spec-impl-game — Full game implementation pipeline

Orchestrates three sequential stages for a game spec: implementation, skin compliance, and mobile audit. Never runs stages in parallel — each must complete before the next starts.

## Session context

Current repository state:
!`git status --short`

Current branch:
!`git branch --show-current`

Specs available:
!`ls specs/ 2>/dev/null || echo "The specs/ folder does not exist"`

Implemented games:
!`ls lib/games/ 2>/dev/null || echo "No games yet"`

---

## Instructions

Follow these three stages in strict order. **Do not advance to the next stage if the previous one did not complete successfully.**

---

### Stage 1 — Implement the spec (via /spec-impl)

The received argument is: `$ARGUMENTS`

Invoke the `/spec-impl` skill using the Skill tool, passing `$ARGUMENTS` as the argument:

```
Skill({ skill: "spec-impl", args: "$ARGUMENTS" })
```

This executes the full `/spec-impl` workflow:

- Phase 1: Identify the spec
- Phase 2: Validate the spec state is "Approved"
- Phase 3: Create git branch and switch to it
- Phase 4: Implement step by step with pauses

**Follow every rule and pause defined by /spec-impl.** Do not skip any step or confirmation.

**Before moving to Stage 2**, all of the following must be true:

- All implementation steps from the spec are completed
- The user has confirmed the implementation is satisfactory
- The game-id has been identified from the spec (the slug used in file paths like `lib/games/{game-id}.ts`)

Store the **game-id** — you will pass it to the next two stages.

When /spec-impl shows its final message ("All steps of the plan are implemented"), show:

```
✅ Stage 1 complete — implementation done.

Next: Stage 2 — skin-designer will apply the 3 skins (clasico/neon/retro) to {game-id}.
Launching skin-designer agent now...
```

---

### Stage 2 — Apply skins (via skin-designer agent)

After Stage 1 is fully complete, invoke the `skin-designer` agent using the Agent tool:

```
Agent({
  subagent_type: "skin-designer",
  name: "skin-designer-{game-id}",
  description: "Apply skins to {game-id}",
  prompt: "Apply the 3 skins (clasico, neon, retro) to the game: {game-id}. The game was just implemented — its engine is at lib/games/{game-id}.ts and its React wrapper is at components/games/{game-id}.tsx. Follow your full audit and fix workflow."
})
```

**Wait for the agent to complete.** Do not proceed to Stage 3 until skin-designer finishes.

When skin-designer completes, show:

```
✅ Stage 2 complete — skins applied to {game-id}.

Next: Stage 3 — mobile-porter will audit mobile experience.
Launching mobile-porter agent now...
```

---

### Stage 3 — Mobile audit (via mobile-porter agent)

After Stage 2 is fully complete, invoke the `mobile-porter` agent using the Agent tool:

```
Agent({
  subagent_type: "mobile-porter",
  name: "mobile-porter-{game-id}",
  description: "Mobile audit for {game-id}",
  prompt: "Audit and fix mobile experience for the newly implemented game: {game-id}. Check the play screen (canvas scaling, touch gamepad, HUD) and any platform pages affected. Follow your full audit and fix workflow."
})
```

**Wait for the agent to complete.** Do not proceed until mobile-porter finishes.

When mobile-porter completes, show:

```
✅ Stage 3 complete — mobile audit done for {game-id}.
```

---

### Final summary

After all three stages complete, show:

```
🎮 Pipeline complete for {game-id}!

  ✅ Stage 1: Spec implemented (all steps done)
  ✅ Stage 2: Skins applied (clasico/neon/retro)
  ✅ Stage 3: Mobile audit passed

Remaining tasks:
  - Verify acceptance criteria from the spec
  - Update spec state to "Implemented"
  - Commit and create PR when ready
```

---

## Hard rules

- **Sequential only.** Never run skin-designer and mobile-porter in parallel. Skin changes may affect what mobile-porter needs to audit.
- **Do not skip /spec-impl.** Stage 1 must use the actual /spec-impl skill, not a reimplementation.
- **Do not start Stage 2 until the user confirms implementation is done.** The user's confirmation at the end of /spec-impl Phase 4 gates entry to Stage 2.
- **Pass game-id explicitly to agents.** Both agents need to know which game to target.
- **If any stage fails, stop and report.** Do not skip a failed stage to continue with the next one.
- **Never commit automatically.** Same rule as /spec-impl — committing is the user's decision.
