# Plan to vccs 1.0

Five phases, 52 steps. Do them in order. Each step lists:
- **Finding**: the review finding it closes.
- **Change**: what to do.
- **Test**: the test to add or change (rules in README.md).
- **Done when**: the checks that must pass, in addition to the step gate in README.md.

Paths are relative to the repository root; `src/` means `packages/vue/src/`. Review files are in
[reviews/](reviews/). Decisions (`D-n`) are in [DECISIONS.md](DECISIONS.md).

**Dependencies.** Phase 0 → all later steps. Run in listed order, except migrate standalone
charts (2.11) before deleting the last state facade (2.10). Step 2.0 precedes every model slice;
2.2–2.9 are sequential, then 2.11 → 2.10 → 2.12 → 2.13 → 2.14. Phase 3 requires the completed
phase 2 model. Record additional dependencies in PROGRESS.md; a deferred prerequisite also
defers its dependents, rather than silently running them against a different architecture.
Independent fixes, documentation and measurements can continue. Record an unavailable phase
gate as deferred with its missing prerequisites, never as passed. README.md's deferral and
final-acceptance rules remain unchanged.

---

## Phase 0: setup and baseline

### 0.1 Environment and baseline verdict
**Change:** environment setup from README.md. Run `pnpm verify` on the untouched branch.
Then make packed-consumer setup reproducible: save locked Vite/Nuxt consumer fixtures, prefetch
their dependency graphs during network-enabled setup, and make the runner install them with
`--offline --frozen-lockfile`. Use a stable local tarball path for the library under test so
repacking does not trigger unrelated dependency resolution. Document and validate that update
mechanism; do not hand-edit integrity hashes. Until this exists, keep network access available
for the consumer checks. Verify a fresh consumer install/build with network disabled and record
the command, source commit, lockfile hashes and result in PROGRESS.md.
**Done when:** the verdict table and the test count are recorded in PROGRESS.md as the baseline.
Expected: every check passes except the motion lab, which fails on the D-25 journey flags (and
may fail on real-clock slow frames under load, D-25a) until step 1.13. Record environment-limited
browser engines, if any.

### 0.2 Baseline build, benchmark and bundle scripts
**Change:**
1. `pnpm --filter vccs build`; copy `packages/vue/dist` to `.evidence/baseline/dist`. Keep it for
   the whole run (A/B comparisons).
2. Add `scripts/bench.mjs` (root script `bench`), adapted from
   `reviews/performance/runtime.mjs`, `runtime-fixture.mjs`, `runtime-static-fixture.mjs` and
   `animated.mjs`:
   - Options: `--dist=<dir>` (default `packages/vue/dist`), `--compare=<dir>`, `--rounds=<n>`
     (default 7), `--self-test`.
   - Cases: LineChart and BarChart with 100, 1,000 and 10,000 points (mount, update with all
     values changed); Heatmap 7 × 24 and CalendarHeatmap 365 days (mount, update); animated update
     of LineChart and BarChart with 1,000 points (CPU per frame). Animation off for static cases.
   - With `--compare`, runs A and B interleaved in the same browser, reports medians per case,
     and exits 1 when any case's B median is more than 10 % slower than A (D-4).
   - `--self-test` adds a 30 % busy-wait to side B; the run must exit 1.
   - Writes JSON to `.evidence/bench/` and prints a table.
3. Add `scripts/check-bundle.mjs` (root script `check:bundle`), adapted from
   `reviews/performance/bundles.mjs` and `tree-shaking.mjs`:
   - esbuild (root dev dependency) bundles one entry per chart (`export { X } from dist`), `vue` and
     `motion-v` external; prints minified and gzip bytes per chart.
   - `--assert-standalone` fails when the bundle of any of Tracker, Heatmap, CohortChart,
     CalendarHeatmap, BarList, Sparkline, JourneySankey, Treemap, Sankey, SunburstChart contains a
     module whose path matches `/(core|state\/selectors)\/axis|decimal\.js-light|d3-time-format|reselect/`.
**Done when:**
- `pnpm bench --compare=.evidence/baseline/dist` against the unchanged build exits 0 (A/A: noise
  below 10 %). If it does not, raise `--rounds` until it does (at most 21) and make that the
  default. Warm up both builds equally. If A/A still exceeds 10 % at 21 rounds, report
  inconclusive and diagnose the environment; do not enlarge the threshold or record a pass.
- `pnpm bench --compare=.evidence/baseline/dist --self-test` exits 1.
- `pnpm check:bundle` prints sizes; record them and the bench medians in PROGRESS.md, tied to
  the baseline commit and tool versions. Preserve a compact size table for final comparison.
- `pnpm check:bundle --assert-standalone` fails today (record the offending modules). It must
  pass after 2.11.

### 0.3 Coverage that runs
**Finding:** tests.md §0.4.
**Change:** add `'**/__tests__/**'` to `coverage.exclude` in `packages/vue/vitest.config.ts`;
root script `test:coverage` → `pnpm --filter vccs exec vitest run --coverage`.
**Done when:** `pnpm test:coverage` writes a report; statements, branches and lines are recorded
in PROGRESS.md as the coverage baseline.

**Phase 0 gate:** 0.1–0.3 done, baselines recorded.

---

## Phase 1: release blockers

### 1.1 License notice
**Finding:** package.md P1. **Change:** D-29 in the root `LICENSE`. If the packed tarball does not
take the root file, add `packages/vue/LICENSE` with identical content.
**Done when:**
```bash
pnpm --filter vccs pack --pack-destination .evidence/pack
tar -xOf .evidence/pack/vccs-*.tgz package/LICENSE | grep -c "2015-present recharts"   # 1
tar -xOf .evidence/pack/vccs-*.tgz package/LICENSE | grep -c "Rick-hup"                # 1
```

### 1.2 Stack ids that match Object members
**Finding:** bugs.md B1 (also in Recharts). **Change:** stack grouping uses a `Map` (or a
null-prototype object) — `combineStackGroups` area of `src/state/selectors/axisSelectors.ts`.
**Test:** `reviews/bugs/stack-id.spec.tsx` as a table over `stackId` `'constructor'`,
`'__proto__'`, `'toString'`, `'a'`: two stacked bars render with literal heights.
**Done when:** the test fails before the fix and passes after.

### 1.3 Tooltip `shared` reacts to changes
**Finding:** architecture.md P1-1 (confirmed). **Change:** `useTooltipEventType` takes a getter
(`() => props.shared`). **Test:** a chart with two Bars; hovering shows 2 entries with
`shared=true`, 1 entry after switching to `shared=false` at runtime.

### 1.4 Funnel arrow keys never throw
**Finding:** ssr-a11y.md P1 row 2 (`src/events/useChartInteractions.ts:67,83`). **Change:** guard
the missing tick list; charts without axis ticks take the item path of 1.6.
**Test:** focus a FunnelChart, press ArrowRight, ArrowLeft, Home, End: no exception, no console
error. (Extended with item navigation in 1.6.)

### 1.5 Edge-data bugs
**Findings:** bugs.md B3, B4, B5, B6, S1; policies D-27. One commit per bug.
**Change and test** (start from `reviews/bugs/cell-output.spec.tsx` and `edge-output.spec.tsx`;
put each test in the existing spec file of that chart):
- B3 CalendarHeatmap: default `end` = latest valid date even without a value. Last cell is
  `Fri, Jan 2, 2026` with no value.
- B4 Sparkline: `[1e20]` and `[5, 5, 5]` draw a flat line at mid-height (`M50,20…` for 100 × 40).
- B5 JourneySankey: a row with `count: Infinity` (and `NaN`, `-1`) is ignored; no `NaN` in any
  attribute; the valid path keeps its geometry.
- B6 Sparkline: an initial `active-index` shows the tooltip with the point's value on mount.
- S1 CohortChart: `[100, null, 25]` renders cells for 100 % and 25 % only; `[100, 0, 25]` renders
  three cells including 0 %.
**Done when:** each test fails before its fix and passes after.

### 1.6 Keyboard for item charts
**Finding:** ssr-a11y.md P1 row 3. **Change:** D-14 for Pie, Scatter and Funnel.
**Test:** table over PieChart, ScatterChart, FunnelChart: focus the root; ArrowRight twice → the
tooltip shows the second item's name and value and the live region announces the same text;
End → last item; ArrowLeft → previous; Escape → tooltip hidden.

### 1.7 Treemap, Sankey, SunburstChart: attributes, names, keyboard
**Findings:** api.md P1-2; ssr-a11y.md P1 row 3. **Change:** forward `class`, `style`, `aria-*`,
`data-*` like the cell charts (`boxAttrs`/`rootAttrs`); add `title`/`desc` (D-15 defaults);
focusable root and keyboard per D-14.
**Test:** table over the three charts: attributes land on the root; accessible name is the
default title; ArrowRight moves to the first then the second item in D-14 order (tooltip text);
Enter emits `node-click` with that node.

### 1.8 Reduced motion hydrates cleanly
**Finding:** ssr-a11y.md P1 row 1. **Change:** D-11 (`useReducedMotion()`), used everywhere
`usePreferredReducedMotion` decides render output.
**Test:** table over Tracker, Heatmap, CohortChart, CalendarHeatmap: with `matchMedia` reporting
`reduce`, `renderToString` then hydrate; no console warning contains `Hydration`; after mount no
`transition` style remains on cells. Must fail before the fix.

### 1.9 Contrast, Legend and Brush semantics, and an a11y check
**Findings:** ssr-a11y.md P2 rows 1–3 and the contrast table. **Change:**
- D-20 (tooltip text and swatch, text on fills, BarList, Legend `li > button[aria-pressed]`).
- Any text drawn on the page background (axis ticks, Sankey and Journey labels, Treemap headers)
  uses `--v-charts-text`.
- Brush traveller semantics from D-16 (labels and `aria-value*`; the range model itself changes
  in 3.6).
- Add `scripts/check-a11y.mjs` (root script `check:a11y`, add it to `scripts/verify.mjs`),
  adapted from `reviews/ssr-a11y/*.mjs`. Use `axe-core` (already a root dev dependency). It renders all 19 charts plus
  Tooltip, Legend and Brush in a fixture page (light and dark theme with the docs' token values),
  server-renders and hydrates them, and checks:
  1. axe: 0 violations of impact `serious` or `critical`;
  2. text in supported theme fixtures: contrast ≥ 4.5:1 (≥ 3:1 for text ≥ 24 px, or ≥ 18.66 px
     bold), using resolved colors and the known composited background. Reuse the audit's cases,
     not its alpha-discarding/nearest-rectangle heuristic. Include overridden/nested CSS
     variables and translucent fills with an explicit D-20 foreground;
  3. keyboard: chart-navigation widgets follow their family's D-14 behavior; existing cell and
     journey interactions remain accessible. BarList stays a list with native actionable rows,
     with keyboard activation equivalent to `row-click`; it does not need a tooltip;
  4. 0 Vue hydration warnings, with and without `prefers-reduced-motion: reduce`;
  5. no server render throws.
**Test:** unit tests for the text-color rule through rendered output (Heatmap cell text fill for
a light and a dark fill; custom Treemap fill with the D-20 foreground override); Legend `aria-pressed`
toggles on click.
**Done when:** `pnpm check:a11y` passes. Prove it can fail: revert the tooltip text-color change
locally and see check 2 fail.

### 1.10 BarList: height, index and per-frame cost
**Findings:** motion.md P1-1, bugs.md B2, motion.md P3-7. **Change:** D-26 BarList height; keep
each row's occurrence index through the transition state (no `findIndex` by name; O(n) per frame).
**Test:** with the motion clock: six rows, remove one, at `frame(0.5)` the list height is strictly
between the old and the new height; after `frame()` it equals the new height. Two rows named `A`:
clicking the second emits index 1, and the `#name` slot gets index 1.

### 1.11 Engine: equal data, cascades, springs, events, one clock
**Finding:** motion.md P2-1, P2-2, P3-3, P3-5. **Change:** D-26 bullets 1–5 in
`src/animation/useKeyedTransition.ts`.
**Test** (`useKeyedTransition.spec.ts`, one test per behavior):
- replacing data with an equal copy starts no animation and calls neither `onStart` nor `onEnd`;
- a change at 0.3 s of a cascade keeps an order-1 item at progress 0;
- a user spring whose progress reaches 1.1 gives an interpolated value beyond the target;
- a snap (inactive animation, resize) calls neither `onStart` nor `onEnd`;
- with `performance.now` jumping 10 s ahead during the entrance, a data change still continues
  the entrance (time comes from the animation).

### 1.12 Motion tokens, shared cascade, moving labels
**Finding:** motion.md P3-1, P3-2, P3-7, consistency notes. **Change:** D-26 tokens
(`feedback`, `color`, `follow`) in the five places (`Tooltip.tsx`, `ActiveDot.tsx`,
`CellGridLayer.tsx`, `JourneySankey.tsx`); one cascade reveal helper for Treemap and the cell
charts; Tooltip `transition` typed `ChartTransition`; Heatmap/CohortChart/CalendarHeatmap labels
on keyed transitions (month labels keyed by month).
**Test:** Heatmap: drop a row; at `frame(0.5)` the label of the row below is strictly between its
old and new `y`. CalendarHeatmap: moving the window by one week keeps the DOM node of each month
label.

### 1.13 Lab: current curve, list height, accepted flags
**Finding:** motion.md P3-6; D-25. **Change:**
- `packages/vue/test/lab/report.mjs`: the ideal entrance curve comes from `motionTokens`.
- The lab's HTML geometry includes the BarList container height and flags a height jump.
- Add `packages/vue/test/lab/accepted-flags.json` with exactly the D-25 flags (scenario, kind,
  element). `--check` exits 1 on any flag not in the file, and also when an accepted flag no
  longer occurs (so the file cannot go stale).
- Extend `report-metrics.test.mjs`: an unlisted flag fails `--check`; a listed one passes.
- D-25a: slow real-clock frames gate only with `--strict-timing`.
**Done when:** `pnpm motion:report --prod --check` exits 0. Prove the height check fires: revert
1.10's height change locally, run the barList scenarios, see the flag, restore.

### 1.14 Docs facts from phase 1
**Findings:** motion.md P2-3, ssr-a11y.md P3. **Change:**
- `docs/content/2.guides/12.animation.md`: timing table generated from `motionTokens` values
  (entrance 1 s ease-out cubic, cascade 1.2 s, line/area draw 1.2–2 s at a steady pace, update
  0.5 s, exit 0.3 s, feedback 0.15 s, color 0.3 s); labels ride with their shapes; composed charts:
  lines keep drawing after bars land (D-26).
- `docs/content/2.guides/11.nuxt-and-ssr.md`: D-1 exactly; D-30 prefix note.
- Fix `src/animation/renderPhase.ts:93-99` comment to match.
- Writing rules: D-28.
**Done when:** `pnpm check:docs` passes; no guide claims a 0.6 s entrance or "complete visible
SVG from the server".

**Phase 1 gate:**
```bash
pnpm verify                                        # every check PASS (now includes check:a11y)
pnpm bench --compare=.evidence/baseline/dist       # exit 0
```
Record the verdict table in PROGRESS.md.

---

## Phase 2: one Vue chart model

Background: [reviews/architecture.md](reviews/architecture.md) §1–3 (read fully before 2.0).
Target names and places: D-5 to D-10. A single temporary adapter may bridge old readers to the
new canonical model while slices migrate. Track its introduction date, remaining dependents,
removal condition and issue when available in `internals/migrations.md`. It must not mirror
state or create another owner. Remove it and its migration entry together in 2.10.

### 2.0 Strict typing and tests that survive the refactor
**Change first:** enable `strict: true` in `packages/vue/tsconfig.json` and repair errors by
narrowing real types. Add the packed nullability probe described in 3.1 before the model rewrite.
**Finding:** tests.md §2 (class B) and action 3. **Change:** rewrite the state-coupled tests
through rendered output, exactly as tests.md §2's table says (fineGrainedHover as a render-count
probe on public `#shape`/`#dot` slots during 5 hovers, retaining a separate narrow pure-combiner
execution guard so unchanged output cannot hide repeated geometry work; synchronizationLifecycle tail;
AreaChart `:180`; axisRegistration 2; chartContext 2; chartContextSsr 1; chartFinalDomains 3;
chartTooltip 2; pieSelectors as one PieChart table).
Add the critical existing-behavior gap cases from 4.1 now: Brush slide/touch/keyboard and sync,
tooltip sync with mismatched data, resize, dynamic axis IDs, removal of the first axis consumer
while another survives, registration disposal and repeated mount/unmount. Preserve existing
nested-data and hierarchy mutation tests. Reproduce the in-place margin defect, fix its current
reporting path, and keep the public regression through 2.2; do not carry a deliberately red suite.
Controlled rejection and empty ranges get their new-contract cases in 2.7/3.6.
**Done when:** strict typecheck, packed nullability probe and the regression suite pass before
2.1 starts. List remaining `@/state` test imports for migration/deletion in 2.10.

### 2.1 Slice 0: delete dead paths
**Finding:** architecture.md P1-2, P2-10. **Change:** slice 0 of architecture.md §3 (Tooltip
`shared` is done in 1.3): `isPanorama` parameter and panorama context, `ReportBar` and
`countOfBars`, `computedData`, `container/RootSurface.tsx`, `cartesian-axis/use-axis-line.tsx`,
`utils/context.ts`, the dead exports listed in P2-10.
**Done when:** `grep -rn "isPanorama\|useIsPanorama" packages/vue/src` → 0.

### 2.2 Slice 1: root inputs as getters
**Change:** slice 1 of architecture.md §3. Create `src/model/` with `createChart(inputs)` and
`useChart()` (D-5). Delete `ReportMainChartProps`, `ReportChartProps`, `ReportPolarOptions`,
`ChartDataContextProvider`. Root defaults in one place. Data tracking per D-7 (replace
`useTrackedData`'s duplicate tracking across its callers without narrowing behavior).
**Test:** `barGap="20%"` renders without a Vue warning. Data contract table (D-7): replacing the
array, push/splice, nested path/function accessor edits, array-valued rows and hierarchy edits
update their charts. In-place `margin.left` changes move the bars without replacing the object.
**Done when:** obsolete prop reporters/providers are gone, except for the explicitly tracked
adapter; each data owner has one tracking boundary. Deep watchers are allowed when D-7 needs
them. Prove raw same-identity updates still invalidate calculations.

### 2.3 Slice 2: registries
**Change:** slice 2 of architecture.md §3: `createRegistry` for graphical items (cartesian and
polar), cartesian axes, polar axes, reference elements, legend payloads, tooltip entries. Delete
`SetGraphicalItem.ts`, `SetLegendPayload.ts`, `SetTooltipEntrySettings.tsx`, the add/remove/
replace functions and the five shallow-equal copies. Register only domain fields (D-6). Keep the
YAxis auto-width oscillation guard.
**Test:** changing a Bar's `fill` re-renders no axis tick (count calls of an XAxis `#tick` slot:
0 extra) and keeps every bar's DOM node.
Also cover conditional registration, keyed series reorder, unmount disposal and stable series
colors in registration order. DOM reorder must not silently change an existing series' identity.
**Done when:** the files above are gone; the motion lab passes (`pnpm motion:report --prod --check`).

### 2.4 Slice 3a: layout math
**Change:** container, offset, viewBox, legend area and brush dimensions become `chart.offset` and
`chart.viewBox` (`computed`, created once). Public hooks read them.

### 2.5 Slice 3b: axis model part 1
**Change:** `chart.axis(type, id)` keyed model (created in the chart's `EffectScope`): settings,
data with indexes, domain (reference elements, error bars, stack groups). Math moves to
`src/core/axis/` as `combine*` functions.
**Done when:** chart specs with domain edge cases pass (`dataMin - 10`, `allowDataOverflow`,
`allowDuplicatedCategory`, reference lines that extend the domain). Switching a live series'
axis ID selects the new scale; removing its first consumer leaves other consumers working.
Sibling series reuse shared domain/axis calculations, and chart teardown disposes their effects.

### 2.6 Slice 3c: axis model part 2
**Change:** scale, nice ticks, ticks, band size, polar axes. `axisSelectors.ts` is gone afterwards.

### 2.7 Slice 3d: tooltip model
**Change:** `chart.tooltip` implements the private read-only `TooltipSource` (D-8). One controller
owns interaction state; payload, label, coordinate and public numeric index are computed from
its internal target identity. Implement D-13 ownership and order mappings; remove the single
listener slot (architecture.md P3-3) and unvalidated `Number(index)` conversions.
**Test:** two `<Tooltip>`s in one chart both receive `update:activeIndex`; Treemap active index is
a number. Cover two item series, controlled parent rejection, chart/series precedence, target
removal/hiding, reorder/resize, keyboard selection, and multiple Tooltip presentation settings.

### 2.8 Slice 3e: cartesian series
**Change:** Bar, Line, Area, Scatter, Funnel, ErrorBar geometry as `computed` in their item
composables, reading the axis models. Math in `src/core/`.

### 2.9 Slice 3f: polar series
**Change:** Pie, Radar, RadialBar. RadialBar shares the bar sizing combiners with Bar
(architecture.md god-file table).

### 2.10 Slice 4: delete the store shell
**Prerequisite:** 2.11 is complete; standalone charts no longer read the old facade.
**Change:** delete `reselect`, `state/createSelector.ts`, `RechartsRootState`, `chartState.ts`,
the view facade, `useAppSelector`, `state/hooks.ts`, the slice files and `src/state/`. Delete the
store-internal tests from tests.md action 4, only after their meaningful behavior is covered.
Remove the tracked adapter and its migration entry. Add D-5's core import-direction rules.
**Done when:**
```bash
test ! -d packages/vue/src/state
grep -rn "reselect\|useAppSelector\|RechartsRootState\|createSelector" packages/vue/src packages/vue/package.json   # 0
```
and `pnpm check:bundle` shows 0 bytes of reselect.

### 2.11 Slice 5: standalone charts on TooltipSource and ChartShell
**Run after 2.9 and before 2.10**, while the tracked adapter still supports any remaining readers.
**Change:** Tracker, Heatmap, CohortChart, CalendarHeatmap, Sparkline, JourneySankey, Treemap,
Sankey, SunburstChart provide a `TooltipSource` (D-8) and render through `ChartShell` (D-5). They do
not create the cartesian model. Remove the Inner/Outer event-forwarding split in Treemap and
Sankey. The copy-pasted size block and emit forwarders go (architecture.md P2-7).
**Done when:** `pnpm check:bundle --assert-standalone` passes; record each standalone chart's new
gzip size.

### 2.12 Slice 6: context ownership
**Change:** D-9. `motion-dom` types come from `motion-v`; remove `motion-dom` from dependencies if
nothing imports it at runtime.
**Done when:** `grep -rn "createContext" packages/vue/src | grep -v __tests__` → 0;
`grep -rn "from 'motion-dom'" packages/vue/src` → 0 or type-only with `motion-dom` as a dev
dependency. Runtime and tooltip capabilities stay lightweight; no standalone chart imports a
cartesian model solely for context reuse. Separate typed keys are allowed under D-9.

### 2.13 Remaining architecture findings
**Findings:** architecture.md P2-9, P2-12 (rest), P2-13, P3-1, P3-4, P3-5, P3-6, god-file table.
**Change:**
- Cycles: hooks out of selector modules, `YAxis` imports `CartesianAxis` directly,
  `utils/cartesian.ts` ↔ `utils/tick.ts`.
- SVG attribute key tables → `src/utils/svg.ts`; rename the misnamed grid defaults.
- `synchronisation/` merged into `src/events/sync.ts`; emitter identity is a `Symbol()` created
  in setup.
- Internal `chart/Surface.vue` renamed `ChartSurface`.
- D-10 `isServer`; remove `Global`.
- Type tests from `src/types/*.vue` → `src/test/types/`.
- Split `components/Tooltip.tsx` into `components/tooltip/` (`Tooltip.tsx`,
  `DefaultTooltipContent.tsx`, `TooltipBoundingBox.tsx`, `Cursor.tsx`); split what remains of
  `utils/chart.ts` by topic into `src/core/`.

### 2.14 Code health gates
**Change:** D-12 (`strict` is already enforced from 2.0): `madge` and `knip` (already root dev
dependencies; `knip.json`: entries `src/index.ts`, `src/nuxt.ts`, `src/resolver.ts`; ignore tests, stories,
storybook, fixtures); `scripts/check-code.mjs` (root script `check:code`, add it to
`scripts/verify.mjs`) runs: madge cycles = 0, knip unused files and exports = 0, longest
production file ≤ 600 lines, `ts/no-explicit-any` disables ≤ 40, `@ts-ignore` = 0, every
`@ts-expect-error` has a reason. Turn on `ts/no-explicit-any: error` for `packages/vue/src/**`
(not tests or stories) and fix the occurrences.
**Done when:** `pnpm check:code` passes. Prove it can fail: add a temporary cycle, see it fail,
remove it.
Add `check:code` and `check:bundle --assert-standalone` to the PR workflow when their gates pass;
preserve existing checks and upload compact failure evidence.

**Phase 2 gate:**
```bash
pnpm verify                                        # every check PASS (now includes check:code)
pnpm bench --compare=.evidence/baseline/dist       # exit 0
pnpm check:bundle --assert-standalone              # exit 0
```
Record in PROGRESS.md the verdict table and these numbers before/after: production lines in
`packages/vue/src`, number of files, `watch(` count, `any` count, test count.

---

## Phase 3: the 1.0 API

Every observable breaking change, in any phase, adds its row to
`docs/content/1.getting-started/3.migration.md` (D-3). Each API step updates
docs demos, playground pages and stories that use a changed API, in the same step.

### 3.1 Recheck strict public declarations
**Finding:** api.md P1-1. **Change:** strict typing and this probe land in 2.0. Recheck them after
the model migration using packed declarations: `useActiveTooltipCoordinate().value.x` must be a type error
(`// @ts-expect-error` in the probe) and `?.x` must compile.
**Done when:** typecheck, build and `node scripts/check-consumers.mjs` pass.

### 3.2 Export surface
**Finding:** api.md P1-5, P2-6. **Change:** D-12a. Explicit export lists in `index.ts` and the
barrels it reads. Fix `docs/content/2.guides/14.typescript.md`'s claim to match.
**Test:** update the snapshot in `src/__tests__/exports.spec.ts`; a type probe imports every
`XxxProps` type and `TooltipPayloadEntry`.

### 3.3 Internal props out of the public API
**Finding:** api.md P1-3. **Change:** D-17 rows for Line, Area, Bar, Legend, Label: outer
(public) and inner (view) components, as XAxis already does.
**Test:** the runtime `props` of each outer component contains none of the removed names (one
table test).

### 3.4 Chart prop sets and chart-level animation
**Finding:** api.md P2-7, P3-12. **Change:** D-17 chart rows (remove `to`, `throttleDelay`; split
cartesian, polar and funnel prop sets) and D-24.
**Test:** a chart with `:is-animation-active="false"` renders its bars at final geometry on the
first frame; an item's own `is-animation-active` overrides the chart's.

### 3.5 Axis props
**Finding:** api.md P1-4. **Change:** D-17 axis rows: one shared typed `AxisProps`.
**Test:** a `vue-tsc` type probe (`src/test/types/`) with `strictTemplates`: `<XAxis :tick="false"
:angle="-45" label="Day">` compiles; `orientation="sideways"` is an error.

### 3.6 Active state and Brush range
**Finding:** api.md P2-1, P2-2; bugs.md S2. **Change:** D-13 and D-16 (including clamping and its
`update:range` emit).
**Test:** table over Tooltip, Sparkline, Pie, Bar, Tracker, Heatmap, CohortChart,
CalendarHeatmap: `v-model:active-index` set from outside activates the element; a hover emits the
new index; `null` clears. Brush: `v-model:range` round trip; data shrinking from 5 rows to 1 with
range `[3,4]` renders one bar and emits `{ startIndex: 0, endIndex: 0 }`.
Extend the table with parent rejection, negative/fractional/reversed/non-finite/out-of-bounds
ranges, and empty → populated → empty. Check D-16's normalized value, one update request per
distinct invalid state, and absence of invalid slider attributes or repeated emit loops.

### 3.7 Accessible names and the markup contract
**Finding:** api.md P2-3, P3-7. **Change:** D-15 for all charts (removes `ariaLabel`), D-22.
**Test:** table over all 19 charts: default accessible name per D-15; `title` overrides it.
`data-slot` table for one cartesian chart and one cell chart.

### 3.8 Series colors
**Finding:** api.md P2-4. **Change:** D-19, including `chartThemeTokens` and the docs theming
guide (token table with the palette).
**Test:** two Lines without `stroke` get `var(--v-charts-series-1, …)` and
`var(--v-charts-series-2, …)`; a Pie's sectors cycle through the palette; Bar has a default fill.
**Done when:** `pnpm check:a11y` still passes (contrast with the new defaults).

### 3.9 Typed rows
**Finding:** api.md P2-5, §4; package.md P2 rows 2–3. **Change:** D-18.
**Test:** `vue-tsc` type probes in `src/test/types/`: `<Heatmap :data="hits" x-key="nope">` is
an error; `@cell-click="cell => cell.rows[0]?.hour"` compiles with `cell: HeatmapCell<Hit>` and
`cell.hour` is rejected. Runtime aggregation/missing-cell tests must match those declarations.
Add equivalent derived-payload probes for calendar, cohort and journey charts; preserve nested
accessor support. Compile the exact SFC examples in reviews/api.md against packed declarations,
including the typed-helper namespace and invalid-key/payload probes. Bundle: a consumer using
`const Chart = defineChartComponents<Row>()({ LineChart, Line })` bundles no Treemap/Sankey/Sunburst code
(`scripts/check-consumers.mjs` or `check:bundle`).

### 3.10 Renames, slots, events, deprecations
**Finding:** api.md P2-8, P2-10, P3-1 to P3-11. **Change:** the remaining D-17 rows (Tooltip
`content`, `portal` → `to`, `labelFormatter`, Treemap, Tracker, formatters,
ResponsiveContainer `@resize`), D-21, D-23. Remove `useOffset` (keep `usePlotArea`).
**Test:** Tooltip `labelFormatter` formats the label; Radar `#dot` and RadialBar `#shape` slots
render; Sunburst and JourneySankey hover emits carry `(item, index, event)`; each deprecated
component warns once (spy on the exact D-21 text).

### 3.11 Docs, playground and stories on the 1.0 API
**Change:** every demo, page and story uses only the 1.0 API; the migration page has one row per
breaking change of phase 3 (D-3) with a before/after snippet.
**Done when:** `pnpm check:docs` and `pnpm check:play` pass; this prints nothing:
```bash
grep -rnE "colorPanel|aspectRatio=|valueFormat=|xLabelFormat|yLabelFormat|periodLabel|formatSubtitle|aria-label=|ariaLabel|:portal|start-index|end-index|throttle-delay|activeIndex=\"-1\"|:active-index=\"-1\"" docs playground packages/vue/src --include=*.vue --include=*.tsx --include=*.ts --include=*.md | grep -v "3.migration.md"
```
(Adjust only if a match is a different, unrelated API; record each exception in PROGRESS.md.)

**Phase 3 gate:** same commands as the phase 2 gate. Record the verdict table.

---

## Phase 4: tests, performance, size, docs, release readiness

### 4.1 Test surgery
**Finding:** tests.md §3–§7, actions 2 and 5–9. **Change:**
- Action 2: rewrite the 9 weak tests with literal values. Prove each with tests.md §3's
  mutations M1–M3 (apply locally, test fails, revert).
- Action 5: collapse duplicates (layout-context tests → one table over chart types through public
  hooks; legend/tooltip duplicates; class-name tests into `cssClasses.spec.tsx`;
  ResponsiveContainer id/class → one table; existence-only smoke tests that `fuzz.spec.tsx`
  covers).
- Action 6: the critical Brush, sync and resize gaps were covered in 2.0; retain those tests.
  Add remaining cases: reduced motion for Bar, cell
  charts, JourneySankey, axes; one edge-data table per chart family: single point, all null,
  mixed-sign stack, 1e9 values with literal ticks, duplicate categories.
- Action 7: one `src/test/motionClock.ts` used by every motion spec; no `vi.mock` inside exported
  functions; remove redundant teardown and manual `.mockRestore()`; resolve the docs path from
  `__dirname`.
- Action 8: SunburstChart 10k → layout assertion at 10k, render 1k; move `events-types` into
  the typecheck step.
- Action 9: `ChartUtils.spec.ts` (or its successor in `core/`) as tables.
**Done when:** the suite passes; coverage lines ≥ baseline − 1 percentage point and branches ≥
baseline; record test count and repeated same-environment suite timings, investigating regressions
without treating a single machine-load fluctuation as a behavior failure.

### 4.2 Performance fixes
**Finding:** performance.md §4. **Change:** cache `Intl.DateTimeFormat` per locale and options
(`cellGridUtils.ts`); `interpolate` returns `to` when `from` and `to` are equal; item events
delegated to one listener set per series group (using `data-v-charts-item-index`) instead of
three closures per bar or dot; `StaticLine` does not remap label data when no labels are shown.
**Test:** item events still emit `(entry, index, event)` for Bar, Line dots, Scatter, Pie (one
table).
**Done when:** `pnpm bench --compare=.evidence/baseline/dist` exits 0; record the before/after
medians in PROGRESS.md.

### 4.3 Size budgets
**Finding:** performance.md §5; D-4. **Change:** `size-limit` in `packages/vue/package.json`: one
entry per chart (import only the chart) for all 19 charts, plus the existing three presets. Set
each limit to the final measured size + 5 %, rounded up to 0.1 kB.
**Done when:** `pnpm --filter vccs size` passes and a per-chart table compares final gzip bytes
with 0.2's baseline. Explain every increase and its requirement; setting a new limit is not
evidence that size improved.

### 4.4 READMEs
**Finding:** package.md P2 row 1, P3 rows 2–3. **Change:** `packages/vue/README.md` and the root
`README.md`: requirements (Vue `^3.5`, `motion-v ^2.4` peer, ESM only), install, Nuxt module,
resolver, typed helper, all 19 charts, link to the docs. No logo in the npm README. D-28 voice.

### 4.5 Changelog
**Change:** `CHANGELOG.md`: a "1.0.0 (unreleased)" section (breaking changes summary linking the
migration page, features, fixes). Add the missing 0.5.0 and 0.6.0 sections from `git log`
between the release commits (use tags if they exist).

### 4.6 Release mechanics
**Change:** `.github/workflows/release.yaml` Node 18 → 22; `packages/vue/package.json`
`"prepublishOnly": "pnpm run build"`. No publish job, no version change.
Wire the new stable code-health, standalone-bundle and accessibility fixtures into PR CI as
they become available (1.9/2.14); retain current consumer/SSR/motion checks. Put the full motion
lab and browser sweeps in an explicit release-check workflow, with downloadable failure
artifacts. `check:motion` and `motion:report` exercise different checks; one does not replace the
other. Document the real-clock benchmark as a separate same-environment release check and keep
inconclusive results distinct from passes.

### 4.7 Agent and maintainer docs
**Change:**
- Repository `CLAUDE.md`: architecture, state, animation, testing and convention sections
  describe the new model (`model/`, `core/`, registries, TooltipSource, ChartShell, motion
  tokens, `motionClock`), and remove Redux, `Animate`, `useIsAnimating`, `vcharts-` and
  `TooltipIndex string` statements.
- `VERIFY.md`: one row per check in the final `pnpm verify` with its final baseline.
- `internals/vision.md`: a status line for 1.0.
- `internals/migrations.md`: entries for the D-21 deprecations (removal condition: 2.0).

### 4.8 Final verification list
**Change:** `scripts/verify.mjs` runs, in this order: unit tests, lint, typecheck, library build,
size, package exports and types (`check:package`), packed consumers (`check-consumers.mjs`), code
health (`check:code`), standalone bundles (`check:bundle --assert-standalone`), Nuxt SSR fixture
(`test:nuxt`), accessibility (`check:a11y`), motion lab (`motion:report --prod --check`),
playground (`check:play`), docs (`check:docs`), visitor-seen (`check:seen`). `--quick` skips the
browser checks. Reconfirm the prepared consumer fixtures work offline as specified in 0.1.
**Done when:** `pnpm verify` passes every check, and the separate baseline benchmark result is
recorded. Perform and record a visual/keyboard pass and a representative screen-reader pass;
where the environment cannot provide one, state that verification limit instead of claiming it.

### 4.9 Final report
**Change:** `internals/release-1.0/REPORT.md` with:
1. One paragraph: what 1.0 is now, and anything deferred.
2. Steps table: id, status, commits, dependencies, release impact and verification evidence.
3. Findings map: every P1 and P2 of every review file → commit or decision.
4. Final `pnpm verify` table.
5. Before/after numbers: tests, coverage, gzip per chart, bench medians, production lines, files,
   `watch(` count, `any` count.
6. Deferred steps with reasons; assumptions made.
7. "Please look at": every visual change (new colors, contrast changes, label motion, BarList
   height, keyboard focus rings) with the page or story where it shows, so the maintainer can
   review it in a browser.
