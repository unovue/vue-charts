# vccs test suite review (audit only)

Branch `feat/cell-grid-main` at `72c8765`. Method: `test-surgery` skill, steps 1–2 and 5 (baseline, waste map, mutation spot-check). No repo files changed. Raw evidence in `.evidence/review/tests/` (`vitest.json`, `coverage/lcov.info`, `coverage/coverage-summary.json`, `mutations.diff`, `mut/` throwaway copy, run logs).

## 0. Headline findings

1. **Redux Toolkit is already gone on this branch.** No file imports `@reduxjs/*`; `package.json` keeps only `reselect` (packages/vue/package.json:98). State is a Vue `provide/inject` context of 12 domain modules (`src/state/chartContext.ts:35-61`) read through reselect selectors (`src/state/createSelector.ts`). So the risk named in the brief now applies to the *next* refactor (selectors → computed, domain modules merged): **50 tests in 10 files + ~10 tests in 4 mixed files** reach into that internal layer.
2. **The suite is mostly behavior-through-render already.** ~1,040 of 1,240 tests render public components and assert DOM. The `state/selectors/__tests__/*` files (54 of 58 tests) are misnamed: they render charts and do not import selectors.
3. **Mutation spot-check: 3 of 3 mutations survived the full suite** (details §3). The weak spots are tooltip props/colors and the funnel's last shape.
4. **`pnpm test:coverage` is broken.** Coverage instruments the shared motion-case modules (`src/animation/__tests__/cartesianMotionCases.tsx`, `remainingMotionCases.tsx`), which hold `vi.mock`/`vi.hoisted` inside an exported function. Rolldown then fails to parse them (`Unhandled Error … RolldownError: Parse failure`, first run log), and no report is written. Fix: add `'**/__tests__/**'` to `coverage.exclude` in `packages/vue/vitest.config.ts:27-30`. With that exclude: statements 87.1 %, branches 75.7 %, lines 86.7 %.
5. **One test is 25 % of the suite's CPU time.** `SunburstChart.spec.tsx:37` (10,000 sectors rendered in JSDOM) takes 42.5 s against a 120 s limit. It timed out in my concurrent mutation run, so it is a load-sensitive failure source (VERIFY.md already notes load timeouts).

## 1. Inventory

Baseline: 126 files, 1,240 tests, all pass. Wall time 57 s (vitest JSON run, about 4 parallel workers); 164 s with istanbul coverage. Sum of per-file times is 167 s. About 19,900 test lines, plus 190 harness lines in `src/test/`.

| Area | Files | Tests | File time |
|---|---:|---:|---:|
| chart (containers, specialty charts, SSR, a11y) | 38 | 393 | 81.7 s |
| cartesian | 20 | 221 | 16.2 s |
| components (Legend, Tooltip, Label, Text…) | 11 | 112 | 7.7 s |
| utils | 7 | 96 | 3.7 s |
| polar | 11 | 93 | 3.8 s |
| `src/__tests__` (exports, fuzz, slots, resolver) | 5 | 88 | 42.6 s |
| state/selectors (render-based, misnamed) | 8 | 58 | 5.7 s |
| shape | 7 | 49 | 0.6 s |
| state (domain modules) | 8 | 41 | 0.6 s |
| animation | 5 | 31 | 1.3 s |
| hooks | 3 | 22 | 0.8 s |
| events | 1 | 19 | 1.9 s |
| container | 1 | 16 | 0.1 s |
| test (harness self-test) | 1 | 1 | 0.0 s |

Separate: `test/nuxt.spec.ts` (`pnpm test:nuxt`, node env), `test/lab/report-metrics.test.mjs` (`node --test`, 4 tests), the Playwright lab, and `scripts/check-*.mjs`.

Slowest 15 files: SunburstChart 42.7 s (one test: 42.5 s) · fuzz 27.5 s · slots.runtime 15.0 s (one test: 9.3 s) · manySeries 8.3 s · NonFiniteData 4.7 s · ssrDeclarationOrder 4.6 s · events-types 3.6 s (a whole TypeScript program) · itemEvents 1.9 s · CellCharts 1.9 s · Legend 1.9 s · chartCallbacks 1.8 s · ReferenceLine 1.5 s · ReferenceArea 1.4 s · LineChart 1.4 s · XAxis 1.3 s.

## 2. Classification

| Class | Files | Tests | Survives a state refactor? |
|---|---:|---:|---|
| A. Render through public components, DOM assertions | ~96 | ~1,040 | yes |
| B. Internal state layer (domain modules, `provideChartContext`, `useAppSelector`, selectors, `vi.mock` of selectors) | 10 + 4 mixed | 50 + ~10 | **no** |
| C. Private pure functions or composables (utils, layout utils, animation composables) | 16 | 144 | yes, unless those functions are rewritten |
| D. Snapshot | 1 | 1 | yes |

**B in detail** (each one breaks when selectors or domain modules change shape):

| File | Tests | What it protects | Verdict |
|---|---:|---|---|
| `state/__tests__/chartSmallDomains.spec.ts` | 10 | object identity, no-op suppression and reset in brush/legend/options/rootProps/polar/reference stores | **delete** with the refactor. Two behaviors are worth keeping: sibling charts do not share state, and the per-chart emitter is unique. Both are covered by rendered tests (`synchronizationLifecycle`, `brushRangeOwnership.spec.tsx:89`). |
| `state/__tests__/chartTooltip.spec.ts` | 8 | tooltip store transitions | **rewrite 2** through render: click state is kept on mouseleave (`:44`); duplicate registration (`:63`). Delete the identity checks. |
| `state/__tests__/chartFinalDomains.spec.tsx` | 7 | axis/item registration order, width oscillation guard (`:93`), panorama isolation (`:156`) | **rewrite 3**: YAxis auto-width does not oscillate (assert a stable rendered width after N ticks); registration order equals legend and paint order; panorama is isolated (already in `brushRangeOwnership.spec.tsx:22`). Delete the rest. |
| `state/__tests__/chartContext.spec.tsx` | 6 | sync updates, nearest provider, per-domain tracking, no proxies on data | **rewrite 2** (two sibling charts stay isolated; data identity reaches slots without a Vue proxy, through a `#shape` slot payload). Delete the 4 tracking tests. |
| `cartesian/axis/__tests__/axisRegistration.spec.tsx` | 5 | axis settings registered during SSR, updated, removed | **rewrite 2**: SSR HTML shows the custom `tickCount`; changing `xAxisId` re-renders the ticks. |
| `state/__tests__/chartData.spec.ts`, `chartLayout.spec.ts` | 4 + 3 | atomic data and range updates; layout identity | **delete**. Atomic range behavior is covered by `brushRangeOwnership` and `Brush.spec.tsx:187`. |
| `state/selectors/__tests__/pieSelectors.spec.ts` | 4 | `computePieSectors` math | **rewrite** as one PieChart table that asserts sector `d`/angles (empty data, equal data, `fill` from data, percent cx/cy). |
| `state/__tests__/chartContextSsr.spec.tsx` | 2 | concurrent SSR requests do not share state | **rewrite 1**: render two different real charts concurrently with `renderToString` and compare each with its solo render. Valuable; keep the intent. |
| `state/__tests__/fineGrainedHover.spec.tsx` | 1 | hover does not recompute geometry (perf); uses `vi.mock` on 4 selector modules | **rewrite**: count calls of a `<Bar>` `#shape` slot and a `<Line>` `#dot` slot during 5 hovers. Expect 0 extra geometry renders. Same guarantee, public surface. |
| mixed: `chart/__tests__/AreaChart.spec.tsx:180` | 1 | stacked % chart, asserted through `selectArea`/`selectTicksOfAxis` spies | **rewrite**: tick text `0%…100%` plus the existing `expectAreaCurve`. The spy part duplicates `:259`. |
| mixed: `chart/__tests__/synchronizationLifecycle.spec.tsx:34` | 3 (`it.each`) | sync group: index/value/function | **rewrite** the tail (`:66-73`): keep the DOM tooltip assertions; replace the `state.tooltip` and `selectBarRectangles` identity checks with the render-count probe described for fineGrainedHover. |
| mixed: 9 `*Chart.spec.tsx` "layout context" blocks | 27 | `useViewBox` (internal), `useChartWidth/Height` (public) | **merge into 1 table** over chart types through public `useChartWidth`, `useChartHeight`, `usePlotArea`. Delete 24 (example: `LineChart.spec.tsx:358-430`, `BarChart.spec.tsx:222-310`). |
| type-only imports: `LegendPosition.spec.tsx:9`, `utils/__tests__/events.spec.ts:3` | — | — | change the import only |

**C**: worth keeping where the math is real and hard to reach through render: `sankeyUtils`, `sunburstUtils`, `useKeyedTransition` (16), `drawTiming`, `getDomainOfStackGroups`/offsets in `ChartUtils.spec.ts`. `ChartUtils.spec.ts` (77 tests, 573 lines) is a port of Recharts' one-test-per-case style. Turn it into tables (about 20 tests). Drop trivia such as `getNormalizedStackId` "keeps string as string" (`:120`) and `isClipDot` (`:162-178`). `utils/__tests__/events-types.spec.ts` builds a full TypeScript program (3.6 s) to type-check `src/test/events-contract.ts`. That job belongs in a `vue-tsc`/`tsc --noEmit` step, not in vitest.

**D**: `src/__tests__/exports.spec.ts` snapshots the export names of the 3 entry points (124 lines). This is a deliberate public-API lock. **Keep.** There are no markup snapshots.

## 3. Weak tests

**Mutation proof** (throwaway copy `.evidence/review/tests/mut/vue`, diff in `mutations.diff`). I ran the full suite against all three mutations at once. All 1,240 tests ran. 3 failed, and none of the 3 failures was caused by a mutation: 2 `slots.runtime` docs demos (ENOENT, because the docs path is relative to cwd) and the 10k Sunburst test (timeout under load).

| Mutation | Should be caught by | Survived |
|---|---|---|
| M1 `cartesian/funnel/utils.ts:77` `nextVal = 0` → `nextVal = val` (last funnel shape becomes a rectangle, not a triangle) | `FunnelChart.spec.tsx:90` "last trapezoid narrows to triangle" (asserts `d` is truthy only) | yes |
| M2 `components/Tooltip.tsx:221` ignore `props.separator` | `Tooltip.spec.tsx:119` "accepts separator prop" (asserts `.v-charts-surface` exists) | yes |
| M3 `components/Tooltip.tsx:218` item color hard-coded `#123456` | `tooltipSelectors.spec.tsx:264` "includes correct color" (`expect(color).toBeTruthy()`) | yes |

Same pattern, by reasoning: `Tooltip.spec.tsx:132` (offset) and `:145` (trigger) assert only that the chart surface exists. `ScatterChart.spec.tsx:157` has **no assertion** (a comment says the items "may need async propagation"). `Symbols.spec.tsx:49` and `Trapezoid.spec.tsx:6` assert only that `d` is truthy. `publicHooks.spec.tsx:111,329` ("non-null coordinate", "length > 0") are also weak. A static scan finds **47 tests whose only assertions are existence checks** (`toBeTruthy`/`not.toBeNull`/`toBeDefined`). Examples: `Area.spec.tsx:301`, `Line.spec.tsx:344`, `LineChart.spec.tsx:236` ("renders with Tooltip"); `Legend.spec.tsx:46,75,108,122`; `Tooltip.spec.tsx:22,37`; `ResponsiveContainer.spec.tsx:16,154`. About half are smoke tests that `fuzz.spec.tsx` already covers better (no crash, no invalid DOM, for every chart type). The rest need a literal expected value.

**Duplicates:**
- `state/selectors/__tests__/legendSelectors.spec.tsx` overlaps `components/__tests__/Legend.spec.tsx` (dataKey as text: `:170` vs `:179`; items per Bar: `:46` vs `:60`).
- `tooltipSelectors.spec.tsx` (defaultIndex, hover, custom content) overlaps `Tooltip.spec.tsx:67,92,160`.
- The class-name tests in `Sector.spec.tsx:63`, `Trapezoid.spec.tsx:15,69`, `Symbols.spec.tsx:71` and `Text.spec.tsx:40` duplicate the table in `chart/__tests__/cssClasses.spec.tsx:8`.
- The 27 layout-context tests (§2).
- 4 ResponsiveContainer id/class tests (`:117-165`) can become 1 table.

**Over-mocking:** `fineGrainedHover.spec.tsx:13-28` mocks 4 internal selector modules (§2). The motion-v fake (`animate` replaced by a manual clock) is a legitimate clock mock, but it is copy-pasted in 14 files (§5). `ActiveDot.spec.tsx:15`, `TooltipMotion.spec.tsx:19` and the case factories mock `@vueuse/core`'s `usePreferredReducedMotion`. That is acceptable; stubbing `matchMedia` would be closer to reality.

**Console handling is good.** No blanket silencing. Every `spyOn(console)` either asserts the expected message (`Sankey.spec.tsx:74-75`) or asserts no hydration or recursion warnings (`SparklineBarList.spec.tsx:134-139`, `manySeries.spec.tsx:15`). `fuzz.spec.tsx:151` uses a narrow allowlist (one intended Sankey warning). The 13 manual `.mockRestore()` calls are redundant with `restoreMocks: true`.

**Timing:**
- `SunburstChart.spec.tsx:37`: 42 s; failed under load in my run.
- `chartCallbacks.spec.tsx:207`: real `setTimeout(5)`. Justified by Vue's invoker timestamps and commented.
- `ssrDeclarationOrder.spec.tsx:34,198,208` and `ssrEntrance.spec.tsx:104`: `setTimeout(0)` macrotask flushes. Fine.
- `accessibility.spec.tsx:43-97` correctly uses fake timers.
- `fuzz.spec.tsx:137` uses a random seed locally and a fixed seed on CI. That is intentional, and fast-check prints the seed on failure.

## 4. Gaps

| Behavior | Status | Evidence |
|---|---|---|
| SSR / hydration | **well covered** (11 files: `ssrDeclarationOrder`, `ssrEntrance`, `responsive-ssr`, `idsSsr`, `accessibility:129`, `SparklineBarList:124`, `test/nuxt.spec.ts`) | — |
| Keyboard / a11y | **good for charts** (`accessibility.spec.tsx`: axe on charts, debounced announcements, keyboard-only focus; `chartCallbacks.spec.tsx:45`; `Legend.spec.tsx:214`). **Missing: Brush keyboard.** `handleTravellerMoveKeyboard` (`useBrushHandlers.ts:208-245`) is uncovered. | lcov |
| Brush | **partial.** Only one traveller mouse drag (`Brush.spec.tsx:170`) and controlled ownership. Uncovered: slide drag, touch drag, keyboard, leave-wrapper end. `useBrushHandlers.ts` has 58 % line coverage (uncovered lines 44-107, 147-245). | lcov |
| Tooltip sync between charts | **covered**: index/value/function and group isolation (`synchronizationLifecycle.spec.tsx:34`), listener lifecycle (`:77-107`). **Missing:** sync between charts with different data lengths or categories (`syncMethod="value"` where the label is absent), and **Brush sync** (`BRUSH_SYNC_EVENT`; no spec combines `syncId` and `<Brush>`). | grep |
| Resize | ResponsiveContainer `onResize` and observer lifecycle (`ResponsiveContainer.spec.tsx:167,185`), `responsive-prop`, `clientEntranceSize`. **Missing:** a chart inside ResponsiveContainer re-lays out its geometry after `trigger(w,h)`. Container dir is at 46 % line coverage, but most of that is dead `container/RootSurface.tsx` (0 %, not imported anywhere). | lcov, grep |
| Reduced motion | covered for keyed series: line/area/scatter (`cartesianMotionCases.tsx:146`), pie/radar/radial/funnel/sankey/treemap (`remainingMotionCases.tsx:140`), ActiveDot, Tooltip. **Missing:** Bar (`BarMotion.spec.tsx`), cell charts (`CellGridLayer.tsx` reads `usePreferredReducedMotion`), JourneySankey, axis motion. | grep |
| Empty data | covered in 20 files | — |
| Single point | Line (`LineChart.spec.tsx:90`), Bar (`:79`), Funnel. **Missing:** Area, Scatter, Radar, Pie, and a single category on a band axis. | — |
| NaN / null / Infinity | `NonFiniteData.spec.tsx` and `fuzz.spec.tsx`. Fuzz checks only "no crash, finite path numbers", not correct geometry. | — |
| Huge values | fuzz only (±1e12, no-crash). No literal check of tick formatting or domains at 1e9+. | — |
| Negative values | bars (`barSelectors.spec.tsx:219`), `getDomainOfStackGroups`. **Missing:** stacked area or bar with mixed signs (`stackOffset="sign"`) through render. | — |
| Duplicate category keys | **missing through render.** `allowDuplicatedCategory` appears only in `ChartUtils.spec.ts:522` and the store test. Duplicate row names are fuzzed for no-crash only. | grep |

## 5. Harness

`src/test/` is small (190 lines) and none of it re-implements product logic.
- `mockGetBoundingClientRect.ts` (75 users): patches the prototype. Fine.
- `MockResizeObserver.ts` (6 users): fires synchronously in `observe()`. The spec delivers asynchronously before paint, so ordering bugs between the first layout and the first measurement can hide here. The file documents this.
- `helper.ts`: 3 small DOM readers. Fine.
- Redundant teardown: `setup.ts:7-13` calls `vi.restoreAllMocks/unstubAllGlobals/unstubAllEnvs` although `vitest.config.ts:21-23` already sets `restoreMocks`, `unstubGlobals` and `unstubEnvs`. 2 files repeat `afterEach(cleanup)` (`fineGrainedHover.spec.tsx:30`, `chartFinalDomains.spec.tsx`).
- The **motion-v fake clock is copy-pasted in 14 files** (`BarMotion`, `AxisMotion`, `FunnelMotion`, `CellCharts`, `clientEntranceSize`, `JourneySankey`, `DotIndices`, `ActiveDot`, `TooltipMotion`, `itemEvents`, `usePointTransition`, `useKeyedTransition`, and the 2 case factories), each with small variations. Make it one `src/test/motionClock.ts` module (`runs`, `frame(seconds?)`, `reduced`), used as `vi.mock('motion-v', () => import('@/test/motionClock'))`.
- The case factories put `vi.hoisted`/`vi.mock` inside an exported function. Vitest warns that this "will become an error in a future version", and it breaks coverage (§0.4).
- `slots.runtime.spec.tsx` resolves the docs demos relative to the current working directory (`resolve('../../docs/…')`), unlike `events-types.spec.ts:6`, which resolves from `__dirname`.
- Root `package.json` `"test:coverage": "vitest run --coverage"` runs without the package config. Use `pnpm --filter vccs exec vitest run --coverage`.
- Note: during this audit another job created an untracked `packages/vue/src/__repro__/*.spec.tsx` (4 files, 18:46). The include glob `./**/*.spec.*` will pick those up in `pnpm test`.

## 6. Target architecture after the state refactor

| Level | Proves | Tools | Owns |
|---|---|---|---|
| L0 types and exports | public types, slot types, event contracts, export surface | `vue-tsc --noEmit` over `src/test/*-contract.ts`; `exports.spec.ts` snapshot; `check:package` (publint + attw) | API stability |
| L1 pure layout math | sankey/sunburst/treemap/journey/cell-grid layouts, stack offsets, domain and tick math | vitest, tables, literal values, no DOM | algorithms that are hard to reach through render |
| L2 component behavior (the bulk) | one chart rendered from `@/index` → DOM geometry (`d`, `x/y/width`), text, ARIA, events, emitted values, slots. Interactions through `fireEvent` on `.v-charts-wrapper`. Perf invariants through render-count probes in public slots. Edge-data tables per chart family. | vitest + JSDOM + `mockGetBoundingClientRect` + `MockResizeObserver` + one shared `motionClock` | everything users see; no `@/state` imports (enforce with an eslint `no-restricted-imports` rule on `**/__tests__/**`) |
| L3 SSR/hydration | `renderToString` then hydrate: no mismatch warnings, entrance start state, ids, concurrency isolation | vitest node + JSDOM; `test/nuxt.spec.ts` | SSR contract |
| L4 property fuzz | no crash, finite paths, no attribute leaks for every chart type | `fuzz.spec.tsx` (fixed seed on CI) | robustness |
| L5 motion in a real browser | frame-exact smoothness: jumps, reversals, stalls, overlaps, settle | `motion:report --check` (Playwright fake clock); the metric itself is guarded by `report-metrics.test.mjs` | motion quality that JSDOM cannot see |
| L6 visitor-visible | entrances seen on scroll and tab switch; docs/play pages load without hydration warnings | `check:seen`, `check:play`, `check:docs` with their fixtures of deliberate defects | integration in real sites |

Rule of thumb: an L2 test asserts what L5/L6 cannot measure cheaply (exact values, events, a11y). L5/L6 never re-check a value that L2 already pins. Motion timing stays in L2 via `motionClock` (start/end values, callbacks, reduced motion). Smoothness stays in L5.

## 7. Ranked actions

| # | Action | Count | Files |
|---|---|---:|---|
| 1 | **Fix coverage harness**: exclude `**/__tests__/**`; fix the root `test:coverage` script | 2 lines | `packages/vue/vitest.config.ts:27`, `package.json:16` |
| 2 | **Strengthen the tests the mutations proved weak** (rewrite with literal values): separator text, offset position, `trigger="click"`, item color `#ff7300`, last funnel `d` closes at one point, Symbols/Trapezoid literal `d`, Scatter legend items | rewrite 9 | `Tooltip.spec.tsx:119-158`, `tooltipSelectors.spec.tsx:264`, `FunnelChart.spec.tsx:90`, `Symbols.spec.tsx:49`, `Trapezoid.spec.tsx:6`, `ScatterChart.spec.tsx:157`, `publicHooks.spec.tsx:111,329` |
| 3 | **Rewrite state-coupled behavior through render** before the selector refactor | rewrite ~15 | fineGrainedHover (1), synchronizationLifecycle tail (3), AreaChart `:180` (1), axisRegistration (2), chartContext (2), chartContextSsr (1), chartFinalDomains (3), chartTooltip (2), pieSelectors (1 table) |
| 4 | **Delete store-internal tests** once (3) is in | delete ~41 | chartSmallDomains (10), chartData (4), chartLayout (3), chartTooltip (6), chartFinalDomains (4), chartContext (4), axisRegistration (3), pieSelectors (4), chartContextSsr (1), fineGrainedHover selector mocks |
| 5 | **Collapse duplicates** | delete ~45 | 27 layout-context tests → 1 table; legend/tooltip "selectors" duplicates (~8); class-name tests → `cssClasses.spec.tsx` (5); ResponsiveContainer id/class → 1 table (3); existence-only smoke tests covered by fuzz (~10) |
| 6 | **Add missing behavior tests** | add ~10 | Brush: slide drag, touch drag, keyboard traveller (3, `Brush.spec.tsx`); Brush sync between charts (1); tooltip sync with mismatched data (1, `synchronizationLifecycle.spec.tsx`); chart re-layout after a resize (1, `ResponsiveContainer.spec.tsx`); reduced motion for Bar, cell charts, journey, axis (1 table); edge-data table per family: single point, all null, mixed-sign stack, 1e9 values with literal ticks, duplicate categories (2–3, new `chart/__tests__/edgeData.spec.tsx`) |
| 7 | **Harness**: one shared `motionClock`; move `vi.mock` out of the case factories; remove the redundant teardown in `setup.ts:9-11` and the 13 `.mockRestore()` calls; resolve the docs path from `__dirname` | ~ −300 lines | `src/test/`, 14 motion specs, `slots.runtime.spec.tsx:18` |
| 8 | **Speed**: Sunburst 10k → keep the layout assertion at 10k, render 1k (or move the render to `motion:lab ?s=stress`); `events-types` → typecheck step | −45 s CPU | `SunburstChart.spec.tsx:37`, `events-types.spec.ts` |
| 9 | **Tables**: `ChartUtils.spec.ts` 77 → ~20 tests, keep all cases | rewrite | `utils/__tests__/ChartUtils.spec.ts` |
| 10 | Follow-up (production code): delete dead `container/RootSurface.tsx` (0 % coverage, not imported anywhere) | — | `src/container/RootSurface.tsx` |

Net estimate: about −86 tests and −2,500 test lines (≈13 % of lines, below the skill's typical 15–30 % because the suite is already render-based), +10 tests for gaps. The coverage diff (`coverage_diff.py`) must be run after each area cut. The baseline lcov is `.evidence/review/tests/coverage/lcov.info`.
