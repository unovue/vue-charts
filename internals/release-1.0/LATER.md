# After 1.0: improvements we saw and froze

The 1.0 run keeps geometry and motion identical to the baseline and accepts flags that predate
it. This list collects what we saw along the way and deliberately did not fix inside a step.
Each item gets its own pass on top of the finished refactor. Evidence paths are under
`.evidence/release-1.0/` (git-ignored, local only).

Priority: **P1** user-visible bug · **P2** visible polish or reliability · **P3** code or tooling health.

## Product

- ~~P1 Unmeasured charts draw at the server fallback, then jump or overflow~~ done in 8da11ee.
  An unseen hydration entrance reused its earlier fallback geometry after measurement; refresh
  that plan and contain the hidden fallback. D-1 stays intact. Public hydration regression and
  reverse proofs: `product-fix/checks.md`.
- ~~P2 Journey fold overlaps~~ done in 7d15465. Root cause corrected: the fold already split
  on shared eased progress; fixed slot anchors collided with moving neighbours. Folding,
  unfolding, entering and leaving nodes now follow their neighbours' gaps on that same curve.
  Backwards/jump flags are accepted by design with reasons (D-25e); only overlap entries were
  removed. Public regression is reverse-proved. Matching before/after frames and analysis:
  `product-fix/journey-question.md`; full gate: `product-fix/motion-comparison.json`.
- **P2 Page startup blocks the first frames.** Visitor timing stays unreliable even run alone:
  BarList desktop shows a 120.8 ms gap with 55–95 ms startup long tasks. This is page startup
  cost, not only machine load (correcting the phase 1 note). Evidence: `seen-unreliable.md`,
  `seen-profile-findings.json`.
  Profiled in the product slice: docs Shiki WASM and mixed Vue/Nuxt hydration dominate, with
  recorder work also contributing. No small library cause was established, so no code fix.
  Equal-work profiles and attribution: `product-fix/startup-profile-report.md`.
- ~~P1 RadialBar item tooltips fail on hover~~ done in eb19d45. Registered sector positions,
  kept Cartesian pointer coordinates, and selected painted sector hits outside the configured
  polar viewport. Public hover/click regressions; `product-fix/item2-play` has no flags.
- ~~P3 Playground demos~~ done on `release/1.0-tooling` (`e390f1a`): display legends are
  non-interactive; the Pie total sits outside the series group.

## Checks and tooling

- ~~P2 `check:play` exits 1 at baseline~~ done in 8da11ee and eb19d45. The full product sweep
  exits zero with no real flags; detector fixture remains verified. D-25d's temporary baseline
  allowance is no longer needed. Evidence: `product-fix/play-final/results.json`.
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

- ~~P3 CalendarHeatmap parses dates twice~~ done in c21885f: values and range share one pass.
- ~~P3 Strict-mode non-null assertions (`pos.size!`, `cx!`/`cy!`, `dataKey!`)~~ done in c21885f:
  narrow available geometry instead; missing Scatter tooltip positions are documented.
- ~~P3 `Reveal` type cycle~~ done in 4b885d0 before this slice: the type lives beside motion tokens.
- **P3 Run hygiene:** the `vue` commit scope in `a6ab90a` is outside the README's scope list.

## Review of phases 0–2 (2026-10-06)

Read-only review of 72c8765..4b885d0: a Codex audit of tooling, tests and leftovers, and an
Opus review of architecture and API. Items PLAN phases 3–4 already schedule are left out; where a
step covers only part of an item, the step is named. Items marked ✓ were checked against the code.

### Model and API (do in the product slice or with the phase 3 step named)

- ~~P2 One rule for the rows a series shows~~ done in 37eded7: model `displayedData` serves
  marks and axes; adjacent `tooltipData` preserves React's distinct empty-array/brush rule.
  Source parity and numeric comparison: `product-fix/displayed-rows-investigation.md`.
- ~~P2 `isAnimating` mirrored by watchers~~ done in c21885f: deleted unused mirrors and
  `useIsAnimating`; remaining consumers read the motion engine directly.
- **P2 Behavior keyed on chart-name strings** (`core/axis/scale.ts:33`, `Cursor.tsx:41`,
  `useLine.ts:69`, `useArea.ts:72`). A renamed or wrapped chart changes scale and cursor. Fix:
  typed capabilities in the chart definition (`categoryScale`, `cursor`); extend 3.4. M.
- ~~P2 Line `dot` options read once at setup~~ done in 785b079: reactive clipping and removal
  of unused setup size fields; public option-change regression reverse-proved.
- ~~P2 Legend size pushed by a watcher, never reset~~ done in 24e471c: reproduced portal
  reservation and moved size into the registration. Public portal/unmount/inside regression.
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
