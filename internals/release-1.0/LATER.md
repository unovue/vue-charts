# After 1.0: improvements we saw and froze

The 1.0 run keeps geometry and motion identical to the baseline and accepts flags that predate
it. This list collects what we saw along the way and deliberately did not fix inside a step.
Each item gets its own pass on top of the finished refactor. Evidence paths are under
`.evidence/release-1.0/` (git-ignored, local only).

Priority: **P1** user-visible bug · **P2** visible polish or reliability · **P3** code or tooling health.

## Product

- **P1 Unmeasured charts draw at the 640×360 server fallback, then jump.** 46 playground flags:
  when an unvisited chart scrolls into view, Line paths change width (616 → 315 px), Radar
  centres shift by exactly (640−250)/2 and (360−250)/2, Pie labels move 171–222 px. D-1 says
  responsive charts stay hidden until measured, so either the hiding fails for charts measured
  late or the recorder sees them through it. Six more flags: the same fallback shapes overflow
  their host on load (232–290 px). Evidence: `play-flags.md`, "SSR fallback" sections.
- **P2 Journey fold flags (9 accepted, D-25 / D-25c).** A re-ranked node folds backwards and
  briefly overlaps (top8: 7 px jump, 78 px² overlap; top15: two jumps, 83 px² overlap). The fold
  should split on the eased curve that neighbours use, not on time.
- **P2 Page startup blocks the first frames.** Visitor timing stays unreliable even run alone:
  BarList desktop shows a 120.8 ms gap with 55–95 ms startup long tasks. This is page startup
  cost, not only machine load (correcting the phase 1 note). Evidence: `seen-unreliable.md`,
  `seen-profile-findings.json`.
- **P1 RadialBar item tooltips fail on hover (new).** With hover probes on real data marks,
  6 RadialBar sectors show no correct item tooltip. Did not show before because the old probe
  hovered the SVG centre. Evidence: tooling worktree `.evidence/tooling/remaining-flags.md`.
- ~~P3 Playground demos~~ done on `release/1.0-tooling` (`e390f1a`): display legends are
  non-interactive; the Pie total sits outside the series group.

## Checks and tooling

- **P2 `check:play` exits 1 at baseline.** Down to 58 flags after the probe fixes and in-view
  entrance detection (`e862af6`); all 58 are the two P1 product bugs (46 + 6 fallback, 6
  RadialBar). D-25d gates on "no new flags" until they are fixed; then return to plain pass/fail.
- **P2 `check:seen` cannot pass on this machine** (see the startup item above).
- ~~P3 Motion lab rate comparison~~ done: state reset (`e78ed41`) and a discarded warm-up
  replay before timed rates (`9c807fa`) remove the 1×/4× inversion.
- ~~P3 Hover probes on SVG centres~~ done (`5bb3b5b`, `e58fa1a`): 130 → 86 flags; the rest are
  the P1 fallback (46 + 6), below-viewport entrances (28, by design) and the RadialBar P1.
- **P3 Firefox does not launch here:** launch times out after 30 s outside the checker too, so
  it is the machine, not the repo. Diagnostics now surface the error (`23a96ea`).
- ~~P3 Docs OG image~~ done (`d22163e`): Unhead is bundled into the snapshot; Nuxt resolves
  2.1.9, not the 2.1.12 override. The override itself looks ineffective — check or remove it.
- **P3 Docs build logs a landing-query POST 404** but exits 0; cause unknown.

## Code

- **P3 CalendarHeatmap parses dates twice** (`range` re-reads rows that `valuesByDay` already
  parsed, fix B3). Fold into one pass.
- **P3 Non-null assertions added for strict mode** (`pos.size!`, `cx!`/`cy!`, `dataKey!`) in
  code the model rewrite should replace; check that none survive 2.14.
- **P3 `motion.ts` imports the `Reveal` type from `useKeyedTransition.ts`**, which imports
  `motion.ts`. Type-only, but move `Reveal` next to the tokens.
- **P3 Run hygiene:** the `vue` commit scope in `a6ab90a` is outside the README's scope list.

## Status

The tooling items run on branch `release/1.0-tooling` (worktree `fork_vue-charts-release-tooling`)
and are cherry-picked onto `release/1.0` between phase 2 slices. Product items wait for one slice
right after phase 2, on the new model.
