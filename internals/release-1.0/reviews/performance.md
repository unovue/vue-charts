# vccs performance audit

Audited 2026-10-05, commit 72c87650c63c2b23738c2148b159e3d35de92643, package vccs 0.6.0. No tracked files were edited, no commits were made, and no optimization was attempted. All audit files are git-ignored under this directory.

Chart containers cost about 46.9 kB gzip; a rendered LineChart with series and axes costs 71.6 kB and a rendered BarChart 68.5 kB. At 10,000 points, static median mount/update costs are 510.1/196.4 ms for LineChart, with animations considerably exceeding a 16.7 ms frame interval. Redux Toolkit/immer are absent in this checkout. Runtime budgets below are provisional because machine load was exceptionally high.

## Method and environment

- Build: `pnpm --filter vccs build` passed, Vite 8.0.0, 297 transformed modules, 4m 21s; plugin time warning: dts 69%, vue-jsx 25%. Build log is `build.log`.
- esbuild 0.28.2: browser ESM, ES2022 target, production minification, retained named exports as live consumer imports. Only vue and motion-v (including subpaths) are external. No Vue/motion-v peer bytes are included in the size table. Runtime fixtures bundle these peers, so their runtime costs are included. gzip level 9; Node zlib Brotli default settings; bytes are raw bytes, kB = 1,000 bytes. No sourcemaps or HTTP headers counted.
- A concurrent rebuild removed `dist/es` during the first consumer pass. Measurements use a stable copy in `library/dist/es`, with the original package.json including sideEffects. Failed passes are preserved in `bundles-before-build.log` and `bundles-dist-race.log`. The runtime bundle built before copying and the snapshot rebuild have identical SHA-256 (`runtime-consistency.json`).
- Browser: Chromium 153.0.8010.12, supplied headless shell, Playwright 1.58.2. Native browser bootstrap was denied in the sandbox; authorized unsandboxed launch succeeded. No jsdom fallback was necessary. Local servers used 4600/4601 only and were closed in finally blocks.
- Machine: Apple M1 Pro, 10 logical CPUs, arm64, darwin, 16 GiB RAM. No CPU throttle.
- Static start uptime: 18:34  up 48 mins, 1 user, load averages: 76.05 65.97 55.94. End: 18:35  up 49 mins, 1 user, load averages: 102.11 73.66 59.25. Animated start: 18:36  up 50 mins, 1 user, load averages: 105.91 79.91 62.57. End: 18:37  up 50 mins, 1 user, load averages: 111.68 84.37 64.98. These loads greatly exceed 10 CPUs; unrelated processes were left alone.
- Static fixture: production Vue; fixed 900×400 charts in a 1100×700 viewport; LineChart + Line with dots, BarChart + Bar, XAxis(name) and YAxis. Single series; no Tooltip/Legend. Animation disabled on series and cell charts. Category labels are unchanged. Data values are deterministic 1–97; all values change on every replacement. Data-array preparation is outside static timers; Vue deep traversal, setup, DOM work and forced layout are included.
- One warm-up per chart, seven measured rounds with rotating case order. Warm text cache/JIT: not cold page-start or module-import timing. Mount timer includes app.mount plus two nextTicks and forced layout. Update timer includes array replacement plus the same flush/layout. Update-to-rAF measures latency to the next callback, not GPU paint completion. Counts/geometry checks are outside timers.
- Calendar: explicit 2025-01-01 through 2025-12-31, 365 days. Heatmap: seven rows × 24 columns, 168 cells. Static update observations are provided for these too.

## 1. Consumer bundle sizes

Importing only a chart container does not import its series. The two “rendered” rows show the concrete runtime fixture’s imports. “All charts” is the 18 charts requested in the brief; “Import everything” retains every public runtime export, including SunburstChart, shapes, series, axes, tooltips, and hooks.

| Import | Minified B | gzip B | Brotli B |
| --- | --- | --- | --- |
| BarChart | 136372 | 46913 | 41304 |
| LineChart | 136374 | 46910 | 41274 |
| AreaChart | 136301 | 46894 | 41285 |
| ComposedChart | 136375 | 46905 | 41253 |
| PieChart | 136423 | 46924 | 41272 |
| RadarChart | 136429 | 46921 | 41232 |
| RadialBarChart | 136441 | 46929 | 41264 |
| ScatterChart | 136380 | 46915 | 41287 |
| FunnelChart | 136371 | 46911 | 41300 |
| Treemap | 160588 | 56022 | 49451 |
| Sankey | 163665 | 56669 | 49889 |
| Tracker | 158462 | 55361 | 48858 |
| Heatmap | 160411 | 55920 | 49397 |
| CohortChart | 162507 | 56468 | 49920 |
| CalendarHeatmap | 160388 | 56047 | 49543 |
| JourneySankey | 162575 | 56605 | 50128 |
| BarList | 22070 | 8947 | 8130 |
| Sparkline | 172481 | 59421 | 52605 |
| Line+Bar | 136522 | 46919 | 41266 |
| All charts | 246744 | 81719 | 71459 |
| Import everything | 447585 | 142232 | 119958 |
| Line rendered | 212694 | 71562 | 62865 |
| Bar rendered | 199728 | 68477 | 60169 |

Existing package size budgets, measured with their exact configured import sets (esbuild substitute; size-limit itself was not run):

| Preset/imports | gzip B | Existing limit B | Within limit |
| --- | --- | --- | --- |
| Area chart: { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } | 82200 | 80240 | false |
| Bar chart: { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } | 84638 | 83450 | false |
| Pie chart: { PieChart, Pie, Tooltip } | 68322 | 67850 | false |

## 2. Size contributors and tree-shaking

Attribution is esbuild metafile bytesInOutput after minification. Compression mixes modules, so per-dependency gzip/Brotli shares are not additive and are not claimed. Small output overhead (exports, syntax glue) is outside input attribution.

| Contributor | LineChart | Line rendered | Bar rendered | Heatmap | BarList | Import everything |
| --- | --- | --- | --- | --- | --- | --- |
| Redux Toolkit | 0 | 0 | 0 | 0 | 0 | 0 |
| immer | 0 | 0 | 0 | 0 | 0 | 0 |
| reselect | 2777 | 2777 | 2777 | 2777 | 0 | 2777 |
| victory-vendor/d3 | 49258 | 61722 | 49277 | 49257 | 0 | 77024 |
| lodash-es/es-toolkit | 3893 | 4025 | 4126 | 3893 | 0 | 10021 |
| internal modules | 65930 | 125863 | 125243 | 86233 | 18289 | 333795 |
| other dependencies | 13713 | 17469 | 17469 | 17450 | 3758 | 21011 |

Redux Toolkit, immer, victory-vendor and lodash-es each contribute **0 B**. The combined victory-vendor/d3 row is entirely direct d3 packages; the lodash-es/es-toolkit row is entirely es-toolkit. Reselect contributes 2,777 B to conventional charts. Full-import internal modules account for 74.6% of minified bytes.

Largest full-import modules:

| Module | Minified contribution B |
| --- | --- |
| node_modules/.pnpm/decimal.js-light@2.5.1/node_modules/decimal.js-light/decimal.js | 13071 |
| internal/state/selectors/axisSelectors.mjs | 12884 |
| internal/chart/JourneySankey.mjs | 12191 |
| internal/components/Tooltip.mjs | 10307 |
| internal/chart/CellGridLayer.mjs | 8826 |
| node_modules/.pnpm/d3-time-format@4.1.0/node_modules/d3-time-format/src/locale.js | 8528 |
| internal/chart/Sparkline.mjs | 7492 |
| internal/chart/Treemap.mjs | 7379 |
| internal/chart/Sankey.mjs | 7271 |
| node_modules/.pnpm/d3-color@3.1.0/node_modules/d3-color/src/color.js | 7120 |
| internal/utils/chart.mjs | 5887 |
| node_modules/.pnpm/@vueuse+core@13.1.0_vue@3.5.18_typescript@6.0.3_/node_modules/@vueuse/core/index.mjs | 5211 |

Tree-shaking **works**, but sharing determines the floor. Package sideEffects=false is honored: unused LineChart import leaves only console.log(42) (17 B); bare import emits 0 B and a “marked as having no side effects” warning. Of 1,112 parsed modules, LineChart emits 197, Heatmap 194, and the entire API 460. Details and emitted chart module lists are in tree-shaking.json. PreserveModules enables consumer elimination but does not guarantee small imports.

ChartsWrapper and chart interaction/tooltip selectors pull the common axis/domain path into conventional and cell charts: LineChart retains axisSelectors (12,490 B), decimal.js-light (13,080 B), d3-time-format locale (8,498 B), and d3-color (7,120 B). Heatmap retains that same roughly 49 kB minified d3 path even without visible numeric axes. BarList avoids it (8,947 B gzip). These are graph measurements, not proposed optimizations.

Side-effect audit: import-time factories include defineComponent, createSelector, generateCategoricalChart, cubicBezier, default maps/sets and symbol keys; Global.ts:8/13 reads the environment. No mandatory CSS/polyfill/global listener installation was found in the vccs main entry. Real DOM effects occur at use time: utils/attrs.ts:62–80 appends a shared measurement span, renderPhase.ts:27–38 installs an IntersectionObserver on mount with cleanup, and event synchronisation installs scoped listeners. sideEffects=false is reasonable for this entry: dropping an unused import should not install chart behavior. This is source inspection plus an unused-import probe, not a proof covering optional nuxt/resolver entry points or every dependency.

## 3. Runtime

Static medians, seven runs per row. Work ms includes JS/DOM plus forced style/layout; frame latency is update-to-next-rAF. Raw samples are runtime-results.json and runtime.log.

| Chart | Points/cells | Runs | Mount ms | Update work ms | Update-to-rAF ms | Mount range ms | Update range ms | Mounted DOM elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LineChart | 100 | 7 | 15.6 | 4.1 | 12.2 | 13.6–18.5 | 3.7–5.9 | 386 |
| LineChart | 1000 | 7 | 50.8 | 21.3 | 22.5 | 42.9–84.5 | 17.3–30.1 | 2166 |
| LineChart | 10000 | 7 | 510.1 | 196.4 | 232.2 | 403.7–1853.8 | 170.9–1980.5 | 20142 |
| BarChart | 100 | 7 | 12.9 | 3.6 | 15.3 | 11.0–92.2 | 3.4–4.9 | 380 |
| BarChart | 1000 | 7 | 34.4 | 14.5 | 15.5 | 32.1–60.9 | 12.8–25.1 | 2160 |
| BarChart | 10000 | 7 | 297.7 | 145.8 | 155.4 | 258.6–319.8 | 133.1–266.0 | 20136 |
| Heatmap | 168 | 7 | 9.8 | 4.7 | 15.0 | 8.9–18.4 | 4.1–5.9 | 545 |
| CalendarHeatmap | 365 | 7 | 28.3 | 23.1 | 24.3 | 26.1–46.0 | 21.5–24.0 | 1120 |

All 56 measured mounts rendered exactly the requested number of dots/bars/cells; all Line/Bar updates changed geometry. Static and animated page-error lists are empty. Four 100-point/full-grid screenshots were visually inspected: LineChart.png, BarChart.png, Heatmap.png, CalendarHeatmap.png.

Animated all-values update frame cost, five updates per case after a settled mount: series animation enabled, default 0.5 s update timing; axes follow the series. Values change on each replacement; no entrance is included. Use the standard median, averaging the middle pair for even-sized frame lists. Record rAF timestamps over a nominal 700 ms observation window (which extends under load). CPU/frame = Chromium Performance TaskDuration delta ×1,000 divided by observed rAF callbacks; this is mean main-thread work per observed callback including initial dispatch, microtasks, layout and idle-tail callbacks, then the median of five runs. It is **not** exclusive animation-callback CPU or GPU time. Frame interval and maximum interval are each summarized per run, then across five runs; initial update includes array generation in this animated fixture, unlike static timers. Raw samples: animated-results.json / animated.log.

| Chart | Points | Runs | Initial update ms | CPU/observed frame ms | Median interval ms | Median worst interval ms | Intervals >25ms % | Callbacks/window |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LineChart | 100 | 5 | 3.6 | 2.3 | 16.7 | 16.8 | 0.0 | 43 |
| LineChart | 1000 | 5 | 10.1 | 9.2 | 16.7 | 16.8 | 0.0 | 43 |
| LineChart | 10000 | 5 | 90.0 | 81.9 | 116.6 | 133.4 | 66.7 | 10 |
| BarChart | 100 | 5 | 4.5 | 2.4 | 16.7 | 16.8 | 0.0 | 43 |
| BarChart | 1000 | 5 | 12.3 | 6.5 | 16.7 | 16.8 | 0.0 | 43 |
| BarChart | 10000 | 5 | 94.5 | 41.5 | 41.6 | 100.0 | 50.0 | 17 |

A 16.7 ms frame interval corresponds to 60 fps. At 10,000 points the observed animation intervals greatly exceed it; do not infer a supported 60 fps 10,000-point budget from this run.

### Mount/unmount retention check

Warm five cycles, force Chromium GC twice, record baseline; mount/unmount 50 times, force GC twice; repeat another 50 cycles. Fixed-size charts, animation disabled; each unmount waits for nextTick and a frame. Heap below is Runtime.getHeapUsage.usedSize (JS bytes); backing storage/embedder/totalSize are in raw JSON. DOM/listeners use Memory.getDOMCounters after GC and cover the whole fixture document. Line/Bar use 1,000 points.

| Chart | JS heap before B | After 50 B | Δ50 B | After 100 B | Δ100 B | DOM nodes before/50/100 | Listeners before/50/100 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| LineChart | 21878712 | 21997536 | 118824 | 22034380 | 155668 | 14/14/14 | 13/13/13 |
| BarChart | 19144140 | 19149848 | 5708 | 19174872 | 30732 | 14/14/14 | 13/13/13 |
| Heatmap | 19184188 | 19176908 | -7280 | 19182080 | -2108 | 14/14/14 | 13/13/13 |
| CalendarHeatmap | 19206712 | 19209276 | 2564 | 19217704 | 10992 | 14/14/14 | 13/13/13 |

All snapshots show one document, 14 DOM nodes and 13 event listeners; no growth was observed. Small positive/negative heap movement does not establish a leak or its absence. Global text caches, JIT and GC bookkeeping plausibly account for residual changes; attribution was not heap-profiled. The shared measurement span and a bounded 20,000-entry text-size cache intentionally survive unmount (utils/attrs.ts:8/62). This check does not cover responsive sizing, animation-active teardown, hover/synchronised interactions, or prolonged sessions.

## 4. Ten likely source hotspots

These are ranked source-based hypotheses supported by bundle graphs and workload behavior, not exclusive CPU-profiler attribution. No source was changed.

| Rank | Source file:line | Reason |
| --- | --- | --- |
| 1 | packages/vue/src/hooks/useTrackedData.ts:7 | Deep immediate watch traverses the reactive data graph on mount/replacement and then maps a new raw array. Cost scales with point count and row depth; identity memoization must recompute for every value update. |
| 2 | packages/vue/src/state/selectors/axisSelectors.ts:358 | Applied-values selector maps/flatMaps data per axis/series; downstream domains/ticks/scales and geometry consume these allocations. Shared axis selectors are also the largest conventional internal bundle contributor. |
| 3 | packages/vue/src/utils/attrs.ts:80 | Cold label measurement writes span text then reads getBoundingClientRect, forcing layout. Warm cache masks this in median runs; new labels and cache churn can cost more. get-ticks.ts:162 calls this while selecting ticks. |
| 4 | packages/vue/src/cartesian/line/StaticLine.tsx:60 | Each dot creates a g/Dot subtree and event-handler set from usePointEvents.ts:12. Default dots keep O(n) VNodes, component work and DOM listeners even when a curve is one path. |
| 5 | packages/vue/src/cartesian/bar/components/BarRectangles.tsx:146 | Each frame/update maps every bar, builds its path/attrs and three event closures. Plain-path rendering reduces component overhead but still creates/patches O(n) DOM groups. |
| 6 | packages/vue/src/animation/useKeyedTransition.ts:337 | Animation render maps all plan steps to a new items array on every clock update; downstream series renderers react to every array. Plan construction also allocates maps/sets (166–220). No Redux dispatch is involved. |
| 7 | packages/vue/src/animation/usePointTransition.ts:74 | Wraps every point in transition state; further computed arrays and stable identity comparisons (22–29) scan point arrays repeatedly. StaticLine.tsx:105 also remaps label data even without visible labels. |
| 8 | packages/vue/src/cartesian/bar/utils.ts:107 | Geometry map allocates each bar, value pair, tooltip/background coordinates and invokes per-row minPointSize callback factory (124). All values changed means all geometry is recalculated. |
| 9 | packages/vue/src/chart/CalendarHeatmap.tsx:151 | Formats every day label again when layout invalidates. cellGridUtils.ts:58 creates a new Intl.DateTimeFormat for each formatDay call; 365 full locale-format constructions help explain the calendar cost versus 168 heatmap cells. |
| 10 | packages/vue/src/chart/Heatmap.tsx:154 | Builds the full x×y product, keys, values and labels. CellGridLayer.tsx:477 maps them to SVG groups with per-cell closures; sparse input with fillMissing=true can still create a large dense grid. |

## 5. Proposed release budgets

Seed regression budgets from this snapshot, not a claim that these costs are ideal. Per-entry byte caps below add 10% and round upward to the next 1,000 B. Keep both minified and gzip gates so compression accidents cannot hide retained code growth; peers stay external and gzip settings fixed. Use exact import contracts from this audit. Require explicit review for a higher cap.

| Import contract | Current minified B | Proposed cap B | Current gzip B | Proposed gzip cap B |
| --- | --- | --- | --- | --- |
| BarChart | 136372 | 151000 | 46913 | 52000 |
| LineChart | 136374 | 151000 | 46910 | 52000 |
| AreaChart | 136301 | 150000 | 46894 | 52000 |
| ComposedChart | 136375 | 151000 | 46905 | 52000 |
| PieChart | 136423 | 151000 | 46924 | 52000 |
| RadarChart | 136429 | 151000 | 46921 | 52000 |
| RadialBarChart | 136441 | 151000 | 46929 | 52000 |
| ScatterChart | 136380 | 151000 | 46915 | 52000 |
| FunnelChart | 136371 | 151000 | 46911 | 52000 |
| Treemap | 160588 | 177000 | 56022 | 62000 |
| Sankey | 163665 | 181000 | 56669 | 63000 |
| Tracker | 158462 | 175000 | 55361 | 61000 |
| Heatmap | 160411 | 177000 | 55920 | 62000 |
| CohortChart | 162507 | 179000 | 56468 | 63000 |
| CalendarHeatmap | 160388 | 177000 | 56047 | 62000 |
| JourneySankey | 162575 | 179000 | 56605 | 63000 |
| BarList | 22070 | 25000 | 8947 | 10000 |
| Sparkline | 172481 | 190000 | 59421 | 66000 |
| All charts | 246744 | 272000 | 81719 | 90000 |
| Import everything | 447585 | 493000 | 142232 | 157000 |
| Line rendered | 212694 | 234000 | 71562 | 79000 |
| Bar rendered | 199728 | 220000 | 68477 | 76000 |

Provisional median static work gates: seven runs, same fixture/environment, +25% from the current median rounded upward to 5 ms. Before adopting hard CI gates, repeat on an idle fixed machine; current load makes a reproducible wall-time baseline uncertain. Do not gate individual noisy samples.

| Chart | Points/cells | Proposed median mount cap ms | Proposed median update cap ms |
| --- | --- | --- | --- |
| LineChart | 100 | 20 | 10 |
| LineChart | 1000 | 65 | 30 |
| LineChart | 10000 | 640 | 250 |
| BarChart | 100 | 20 | 5 |
| BarChart | 1000 | 45 | 20 |
| BarChart | 10000 | 375 | 185 |
| Heatmap | 168 | 15 | 10 |
| CalendarHeatmap | 365 | 40 | 30 |

For animation, use a separate regression guard (+25% median CPU/observed frame, round up 1 ms) and a visible-performance target of <=16.7 ms typical frame intervals / <=25 ms worst intervals for 100–1,000 points. The 10,000-point runs already miss that target; use their observed intervals as evidence for product limits, not as a 60 fps promise.

| Chart | Points | Provisional CPU/observed frame cap ms | Current median interval ms |
| --- | --- | --- | --- |
| LineChart | 100 | 3 | 16.7 |
| LineChart | 1000 | 12 | 16.7 |
| LineChart | 10000 | 103 | 116.6 |
| BarChart | 100 | 3 | 16.7 |
| BarChart | 1000 | 9 | 16.7 |
| BarChart | 10000 | 52 | 41.6 |

## Anomalies

1. **Observed:** Redux Toolkit and immer contribute 0 bytes in every measured entry; neither appears in the package dependencies or built graph. **Expected:** Brief says Redux Toolkit is still used internally. **Explanation:** The audited checkout uses Vue reactive chart state (state/chartContext.ts) and reselect. High confidence; the brief predates this migration.

2. **Observed:** BarChart mountMs, round 6: 100 points 92.2 ms → 1000 points 33.8 ms. **Expected:** Brief: more points are never faster. **Explanation:** Single-run load/scheduling noise; frame-callback latency also depends on refresh alignment. Likely, not proven. All static mount/update medians increase with point count; no conclusion drawn from the inversion.

3. **Observed:** BarChart updateToRafMs, round 0: 100 points 16.8 ms → 1000 points 14.6 ms. **Expected:** Brief: more points are never faster. **Explanation:** Single-run load/scheduling noise; frame-callback latency also depends on refresh alignment. Likely, not proven. All static mount/update medians increase with point count; no conclusion drawn from the inversion.

4. **Observed:** Line+Bar Brotli 41266 B is below LineChart 41274 B. **Expected:** Brief: sizes grow with more charts imported. **Explanation:** Compression is not monotonic: additional repeated text and changed minifier names can improve encoding. High confidence in measured values; no conclusion drawn from this difference. Minified and gzip bytes both increase for this subset comparison.

5. **Observed:** Line+Bar Brotli 41266 B is below BarChart 41304 B. **Expected:** Brief: sizes grow with more charts imported. **Explanation:** Compression is not monotonic: additional repeated text and changed minifier names can improve encoding. High confidence in measured values; no conclusion drawn from this difference. Minified and gzip bytes both increase for this subset comparison.

6. **Observed:** Equal-work LineChart/10,000 update runs range 170.9–1980.5 ms; median 196.4 ms. **Expected:** Audit sanity rule: equal work costs about the same. **Explanation:** Heavy concurrent machine load and GC/JIT variation are plausible; attribution is not measured. Report all samples and use provisional medians, without interpreting the anomalous run.

7. **Observed:** The interim BarChart/10,000 animated median interval was reported as 66.5 ms; the final standard median is 41.6 ms. **Expected:** Earlier commentary reported 66.5 ms from the same samples. **Explanation:** The interim helper selected the upper middle value in even frame lists; the final report averages the middle pair. Corrected calculation, no new runtime sample. Idle-tail and active-animation intervals mix within the 700 ms window; the median worst interval remains 100.0 ms.

8. **Observed:** Area chart gzip 82200 B exceeds existing 80240 B limit. **Expected:** packages/vue/package.json size-limit 80.24 kB **Explanation:** Same import set measured with esbuild/gzip level 9; tool differences from size-limit may matter. This is an audit measurement, not an executed size-limit gate.

9. **Observed:** Bar chart gzip 84638 B exceeds existing 83450 B limit. **Expected:** packages/vue/package.json size-limit 83.45 kB **Explanation:** Same import set measured with esbuild/gzip level 9; tool differences from size-limit may matter. This is an audit measurement, not an executed size-limit gate.

10. **Observed:** Pie chart gzip 68322 B exceeds existing 67850 B limit. **Expected:** packages/vue/package.json size-limit 67.85 kB **Explanation:** Same import set measured with esbuild/gzip level 9; tool differences from size-limit may matter. This is an audit measurement, not an executed size-limit gate.

## Assumptions, limits and verification

- Chose ES2022/esbuild, gzip level 9 and Brotli defaults; all named exports are retained to prevent a dead consumer from measuring zero bytes.
- Chose one series with visible dots/bars and axes, fixed dimensions, warm-cache static runs; use these fixture contracts when comparing budgets. No prior runtime baseline existed in the brief; exact existing size presets were measured separately.
- Chose 2025 as a non-leap full calendar year. Leak checks use 1,000 points for Line/Bar and both complete grids; checking 10,000-point leaks was not required and was not done.
- Copied the build into this ignored folder to avoid concurrent dist cleanup. The folder was already git-ignored; no exclude change was needed.
- Runtime measurements are local desktop results under heavy load, not mobile/user-perceived paint timings. Browser text caches are warm and data allocation differs between static and animated timers as documented. No CPU profile or detached-object retaining-path analysis was performed.
- Optional Nuxt/resolver entry points, peer bundle costs, SSR/hydration, tooltip interaction, responsive resize and animation-enabled leaks were not benchmarked. No source/library test changes were made; package build, render assertions and geometry updates are the relevant audit checks.
- Commands: pnpm --filter vccs build; node .evidence/review/performance/bundles.mjs; node .evidence/review/performance/runtime.mjs; node .evidence/review/performance/animated.mjs; node .evidence/review/performance/tree-shaking.mjs; node .evidence/review/performance/baseline-budgets.mjs; node .evidence/review/performance/runtime-consistency.mjs; node .evidence/review/performance/verify.mjs. Exact outputs reside in corresponding .log/.json files.
- Build and all successful scripts returned exit 0. The two premature/raced bundle passes, sandbox browser probe and sandbox localhost port probe failed as recorded; final measurements and unsandboxed port checks succeeded. Screenshots were inspected through view_image. Final audit assertions, ignored-path check, git status and closed-port checks are recorded in verification.log.
