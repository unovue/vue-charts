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

- **Platform reuse (research done, `.evidence/release-1.0/platform-report.md`, checked against
  vue-core 3.5.0, VueUse 13.1, Nuxt 3.15 sources).** Verdict: the code already uses Vue and
  VueUse for most things; the remaining wins are modest. Scheduled in the run:
  native prop defaults instead of `resolveDefaultProps` (~216 lines, step 3.4); `createContext`
  → provide/inject (2.12); remove `Global` (2.13); VueUse observer, listener, timeout and
  mounted helpers (~50 lines, 2.13). Rejected with evidence: Teleport `defer` (does not order
  series, so D-22a needs our own fix), lazy hydration (Nuxt 3.16+, and it delays interactivity),
  useElementVisibility (wrong predicate), numeric `watch` deep (misses nested edits D-7 needs).
- **P3 Hydration detection reads `vnode.el`, a Vue internal** (`animation/renderPhase.ts`).
  2.13 tried the standard pattern (open the gate one frame after mount): it changed entrance
  geometry (barMany curves 0 → 182, off-screen shapes 0 → 2), so the fallback applies: kept, with
  a public auto-width hydration test that fails without it (53eed3f). Revisit with Vue's own
  hydration hook if one becomes public.

- **Done in 2.13 (005aa28 … 8874d7c), kept for the record. Elegance pass:** model surfaces expose
  only what consumers read (5 of 10 AxisModel computeds have no outside reader); domain names
  instead of store names (`rootProps`, `layoutType`, `polarOptions`, 30 `combine*` functions);
  no `@/state` imports in `model/` or `core/` (18 today); every `ChartInputs` field a getter;
  axis settings looked up by id instead of a reverse scan with `String(id)`.

- **P3 CalendarHeatmap parses dates twice** (`range` re-reads rows that `valuesByDay` already
  parsed, fix B3). Fold into one pass.
- **P3 Non-null assertions added for strict mode** (`pos.size!`, `cx!`/`cy!`, `dataKey!`) in
  code the model rewrite should replace; check that none survive 2.14.
- **P3 `motion.ts` imports the `Reveal` type from `useKeyedTransition.ts`**, which imports
  `motion.ts`. Type-only, but move `Reveal` next to the tokens.
- **P3 Run hygiene:** the `vue` commit scope in `a6ab90a` is outside the README's scope list.

## Review of phases 0–2 (2026-10-06)

Read-only review of 72c8765..4b885d0: a Codex audit of tooling, tests and leftovers, and an
Opus review of architecture and API. Items PLAN phases 3–4 already schedule are left out; where a
step covers only part of an item, the step is named. Items marked ✓ were checked against the code.

### Model and API (do in the product slice or with the phase 3 step named)

- **P2 One rule for the rows a series shows** ✓ (code read): written 7 times (`useLine.ts:79`,
  `useArea.ts:99`, `useBar.ts:108`, `useScatter.ts:39`, `RadialBar.tsx:87`, `core/axis/data.ts:57`,
  `core/tooltip.ts:40`). Series test `props.data?.length`, axes test "any item has data", so
  domains and marks can disagree. Fix: one `displayedData(item)` on the model. M.
- **P2 `isAnimating` mirrored by watchers** (`StaticLine.tsx:100`, `RenderArea.tsx:104`,
  `BarRectangles.tsx:119`, `useIsAnimating.ts`). The motion engine owns it; pass
  `display.isAnimating` down and delete `useIsAnimating` (4.7 removes only the docs). S.
- **P2 Behavior keyed on chart-name strings** (`core/axis/scale.ts:33`, `Cursor.tsx:41`,
  `useLine.ts:69`, `useArea.ts:72`). A renamed or wrapped chart changes scale and cursor. Fix:
  typed capabilities in the chart definition (`categoryScale`, `cursor`); extend 3.4. M.
- **P2 Line `dot` options read once at setup** ✓ (`useLine.ts:96`): changing `:dot` later does not
  update `clipDot`/dot size. Fix: `computed`. Bug: needs a regression test. S.
- **P2 Legend size pushed by a watcher, never reset** ✓ (`useLegend.ts:153`): switching a bottom
  Legend to `portal` likely keeps the old reserved space (traced, not run). Fix: size belongs to the
  Legend registration. S.
- **P2 Standalone charts report 0×0 geometry** (`ChartShell.tsx:28`, `chart.ts:140`):
  `ChartPresentation` repeats `Chart` fields; `usePlotArea`/`useChartWidth` return 0 there. Fix:
  one source per field, a narrower presentation for shell charts. M.
- **P2 Tooltip hover is O(N) per pointer event** (`model/tooltip.ts:308`, `:358`, `:367`): copy and
  scan of all targets on every mousemove. Fix: one computed Map by `(entry, index)`. Not in 4.2. M.
- **P3 Tooltip API still Redux-shaped** (`tooltip.ts:428`, 49 `parseTooltipIndex`/`String(index)`
  conversions, `tooltipPayloadSearcher`): `activate(channel, target)`/`clear(channel)` with numeric
  indices. Fits 3.6/3.10; 4.7 changes only docs. M.
- **P3 Two controlled Tooltips throw inside a computed** (`tooltip.ts:116`): warn in dev, first wins. S.
- **P3 Plumbing to fold:** 11 chart events relayed through 3 layers (`ChartWrapper.tsx:78`,
  `componentEvents.ts`) → one handler table; 5 context key pairs (`runtime.ts:141`) → one `layers`
  object; two Surface components (`ChartSurface.vue`, the only SFC, and `Surface.tsx`) → one;
  polar registration hand-written 4× (`Pie`, `Radar`, `RadialBar`, `Funnel`) → `useSetupPolarItem`
  with a narrow legend payload. S–M each.
- **P3 Three "server/hydrating" checks** (`deferredView.ts:15` has a second `vnode.el` copy,
  `utils/env.ts`, `runtime.ts:97`): one `useRenderPhase()`. Extends the hydration item above. S.
- **P3 Built-ins:** watcher in `onMounted` around `useResizeObserver` (`ChartWrapper.tsx:66`) →
  `useResizeObserver(() => responsive ? el : null)`; per-chart emitter in computeds (`sync.ts:33`)
  → a plain const or VueUse `useEventBus`; `useReportScale` measures only on mount. S.
- **P3 Types:** Sparkline stores `null` gaps through a double cast into a numeric type
  (`Sparkline.tsx:22`, `:109`); `core/tooltip.ts:13` generic erased by `| unknown`. S.
- **P3 Bundle:** BarList grew 7,414 → 7,652 B gzip in 2.13 (still under 8,947). Find the 238 B in 4.3.

### Checks and tooling

- **P2 Motion "unsettled" check can never fire** ✓ (`test/lab/report-metrics.mjs:35`, `:70`):
  progress is normalized to the last sample, which is always 100 %. Frame-exact comparison hides
  most of this, but a cut-off transition in a new scenario passes. Fix: compare with the target
  geometry; add a positive control that must fail.
- **P2 Checkers that pass on empty input:** `check:seen` with recordings but no chart rows
  (`check-seen.mjs:285`); `check:docs` accepts a sized but empty chart surface (`check-docs.mjs:132`);
  an unknown motion step filter gives an empty report that passes (`report.mjs:275`). Fix: require
  expected coverage.
- **P2 `pnpm verify` cannot express "known flags"**: the phase 2 gate wants every check PASS, but
  `check:play` (58 P1 flags) and `check:seen` fail for known reasons. Fix: an accepted-flags file
  like the motion lab's, so verify is green and new flags still fail.
- **P2 Process hygiene in checkers:** `report.mjs` cleans up server/browser only on success
  (`:376`) and `rm -rf`s a path built from arguments (`:265`); `check-play`/`check-seen` wait
  forever after SIGTERM (`check-play.mjs:595`) and start with a fixed delay instead of polling
  (`:396`). Fix: `try/finally`, contained output dir, bounded shutdown, readiness polling. S each.
- **P2 Not wired:** motion-metrics regressions are outside vitest config and `verify.mjs`;
  `update-motion-docs.mjs --check` is not in verify/CI. S.
- **P2 Consumer CI on a cold store:** `test.yml:66` runs the offline consumer check without
  prefetching fixture dependencies (`check-consumers.mjs:52`). Validate a cold-cache run (4.6). M.
- **P3 Motion timing noise:** raw captures differ (2.13: 22 captures / 983 frames), resize/narrow curves flip (6 → 0 in 2.12, 0 → 6 in 2.14), and throttled
  intervals sometimes run faster than unthrottled; settled geometry is exact, cause unproven.
- **P3 Flaky timeout:** `slots.runtime.spec.tsx` passes 30 s under concurrent browser load (36.8 s).
- **P3 Repeated builds and duplicated helpers:** verify builds the library several times
  (`verify.mjs:16`, `check-package`, `check-a11y`, `check-play`, `check-seen`, `check-consumers`);
  docs and seen checkers duplicate static serving, MIME tables and port handling. One build in the
  orchestrator, one small static-site helper. M.
- **P3 Brittle tests:** checker tests depend on demo positions and generated ids
  (`check-play.test.mjs:84`, `check-seen.test.mjs:63`); a string-limit stress test runs in every
  verify (`check-seen.test.mjs:24`) → move to an explicit stress check; `axisModel.spec.tsx:79`
  couples to a private positional signature.

## Status

The tooling items run on branch `release/1.0-tooling` (worktree `fork_vue-charts-release-tooling`)
and are cherry-picked onto `release/1.0` between phase 2 slices. Product items wait for one slice
right after phase 2, on the new model.
