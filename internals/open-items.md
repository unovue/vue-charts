# Open items after 1.0

Things we saw and did not fix in 1.0, checked against the code at the time of writing. Each item
has a priority, the place in the code, and one line of reason. Remove an item in the commit that
fixes it; git history keeps the record. Done items from the 1.0 run are in git history
(`internals/release-1.0/LATER.md` at commit 070c752).

Priority: **P1** user-visible bug, **P2** visible polish or reliability, **P3** code or tooling health.

## Product

- **P2 Bar drops undeclared attrs.** `BarRectangles` does not read `BarContext.attrs`, so
  `data-*` and `aria-*` on `<Bar>` never reach the DOM. Forward them to the series layer, as
  Radar and RadialBar do.
- **P2 Item-mode active dots.** The shared `ActivePoints` uses `tooltip.target.index` for every
  series. With `shared=false`, every Line and Area shows an active dot at the hovered index.
  Use `activeIndexFor(entry)`.
- **P2 Standalone charts report 0×0 geometry.** `usePlotArea`, `useChartWidth` and
  `useChartHeight` return 0 inside `ChartShell` charts, because `ChartPresentation` repeats
  `Chart` fields. One source per field, and a narrower presentation for shell charts.
- **P2 Page startup blocks the first frames on the docs site.** Docs Shiki WASM and Nuxt
  hydration cause 55–95 ms long tasks, so `check:seen` marks some rows unreliable. No library
  cause was found.
- **P3 Function `dot`/`activeDot` on Line and Area** is accepted at runtime but never called
  (slots are the render path). Document that slots replace it, or narrow the runtime type.
- **P3 Pie and Funnel tooltip names use `String(dataKey)`** (`polar/pie/Pie.tsx`,
  `cartesian/funnel/Funnel.tsx`). Confirm against Recharts 3.
- **P3 Symbols repeats a custom class token** on its root element.

## Code

- **P2 Behavior keyed on chart-name strings** (`core/axis/scale.ts`,
  `components/tooltip/Cursor.tsx`, `cartesian/line/hooks/useLine.ts`,
  `cartesian/area/hooks/useArea.ts`). A wrapped or renamed chart changes its scale and cursor.
  Put typed capabilities (`categoryScale`, `cursor`) in the chart definition.
- **P2 Tooltip hover is O(N) per pointer event** (`model/tooltip.ts`): every mousemove copies
  and scans all targets. Use one computed `Map` keyed by entry and index.
- **P3 Hydration detection reads `vnode.el`, a Vue internal** (`model/runtime.ts`,
  `hooks/deferredView.ts`). The standard "open one frame after mount" pattern changed entrance
  geometry, so the internal read stays, guarded by a public hydration test. Fold the two copies
  into one `useRenderPhase()`, and switch when Vue makes a hydration hook public.
- **P3 Two Surface components** (`chart/ChartSurface.vue` and `container/Surface.tsx`). Merge
  them into one.
- **P3 Polar registration is written by hand four times** (Pie, Radar, RadialBar, Funnel).
  Extract `useSetupPolarItem` with a narrow legend payload.
- **P3 `ChartWrapper` starts `useResizeObserver` inside a watcher.** Use
  `useResizeObserver(() => responsive ? el : null)`.
- **P3 Axis model exposes grid internals** (`model/axisLayout.ts`). Retype `gridAxis` and
  `CartesianGrid` so the axis model owns a finished grid value.
- **P3 `chartRoot` lives in `chart/generateCategoricalChart.tsx`.** Rename the file to
  `chart/chartRoot.tsx`.
- **P3 Sparkline gaps use `null as unknown as number`** (`chart/Sparkline.tsx`). `Point.y` and
  `usePointTransition` must accept `null` without changing the gap animation.
- **P3 Name-based Tooltip and Legend case in `typed.ts`.** Map only nested `payload` keys, or
  mark slot payload arrays explicitly.
- **P3 `TooltipTargetRequest.configuration` is optional** (`types/tooltip.ts`). Make it
  required once Sankey, JourneySankey, Treemap and SunburstChart pass it, then delete the
  "no configuration" branch in `model/tooltip.ts`.
- **P3 Raw axis-id comparisons** in `polar/radial-bar/RadialBar.tsx` and
  `cartesian/axis/YAxis.tsx`. Use `sameAxis`.
- **P3 Treemap `getTooltipIndex` searches the whole tree** for each node (O(n²)). Build a path
  map once next to `totalsByPath`.
- **P3 `cartesian/line/type.ts` re-exports `LinePointItem`.** Import it from `@/types/line`.

## Checks and tooling

- **P2 The workspace pins Vue to 3.5.18** (`pnpm.overrides` in the root `package.json`), so unit
  tests do not run on the Vue that consumers get (3.5.43 in the consumer fixtures). Without the
  pin, `pnpm typecheck` fails with 4 errors where JSX spreads props into `Trapezoid`
  (`cartesian/funnel/Funnel.tsx`), `Symbols` (`cartesian/scatter/Scatter.tsx`), `Text`
  (`components/label/LabelView.tsx`) and `Sector` (`polar/pie/Pie.tsx`). Fix the prop types,
  then remove the override.
- **P2 Playground recorder times out on `/line-charts`** in some full sweeps; an isolated
  retry passes. Find whether the capture stalls or the page never settles.
- **P3 Firefox does not launch on the maintainer's Mac** (timeout after 30 s, also outside the
  checker). `check:docs` covers Chromium and WebKit.
- **P3 The docs build logs a landing-query POST 404** but exits 0. Cause unknown.
- **P3 Motion timing noise.** Raw captures differ between runs, and throttled intervals
  sometimes run faster than unthrottled ones. Settled geometry is exact; the cause is unproven.
- **P3 The library is built several times in one `pnpm verify`** (`check-package`,
  `check-a11y`, `check-play`, `check-seen`, `check-consumers`), and the docs and seen checkers
  repeat static serving code. Build once in the orchestrator; share one static-site helper.
- **P3 Resolver not proven by `check-consumers`.** vue-tsc checks the checked-in
  `components.d.ts`, not `VccsResolver`. Regenerate the d.ts before the typecheck.
- **P3 Brittle checker tests** depend on demo positions and generated ids
  (`scripts/check-play.test.mjs`, `scripts/check-seen.test.mjs`).

## Roadmap

From the 1.0 vision (in git history: `internals/vision.md` at commit 070c752). The goal is the
best Vue engine for product dashboards, not the longest chart list.

- **Next chart types, when the current ones are stable:** histogram, waterfall, bullet, status
  timeline, box plot.
- **On a real request only:** slope, bump, stream, icicle, circle packing, candlestick, violin,
  map.
- **Not planned (high cost, no named user):** Marimekko, chord, force network, parallel
  coordinates, full Gantt.
- **Upstream:** propose vccs as the chart engine behind the shadcn-vue chart registry.
