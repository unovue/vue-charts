# Open items after 1.0

Things we saw and did not fix in 1.0, checked against the code at the time of writing. Each item
has a priority, the place in the code, and one line of reason. Remove an item in the commit that
fixes it; git history keeps the record. Done items from the 1.0 run are in git history
(`internals/release-1.0/LATER.md` at commit 070c752).

Priority: **P1** user-visible bug, **P2** visible polish or reliability, **P3** code or tooling health.

## Product

- **P2 Standalone charts report 0×0 geometry.** `usePlotArea`, `useChartWidth` and
  `useChartHeight` return 0 inside `ChartShell` charts, because `ChartPresentation` repeats
  `Chart` fields. One source per field, and a narrower presentation for shell charts.
- **P2 Page startup blocks the first frames on the docs site.** Docs Shiki WASM and Nuxt
  hydration cause 55–95 ms long tasks, so `pnpm lab seen` marks some rows unreliable. No library
  cause was found.
- **P3 Symbols repeats a custom class token** on its root element.

## Code

- **P3 Hydration detection reads `vnode.el`, a Vue internal** (`isHydrating` in
  `model/runtime.ts`, the only reader). The standard "open one frame after mount" pattern
  changed entrance geometry, so the read stays, guarded by the auto-width hydration test.
  Switch when Vue makes a hydration hook public.
- **P3 Axis model exposes grid internals** (`model/axisLayout.ts`). Retype `gridAxis` and
  `CartesianGrid` so the axis model owns a finished grid value.

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
- **P3 The motion geometry gate skips arc shapes** (pie and donut sectors, radial bars, sunburst
  rings): `curves()` in `packages/vue/test/lab/report-metrics.mjs` drops paths with arc commands,
  because their endpoints move along circles. Jumps, reversals and stalls in arcs are seen only in
  `pnpm lab film`. Follow-up: measure angle progress (start and end angle, radius) along each arc.
- **P3 The library is built several times in one `pnpm verify`** (`check-package`,
  `check-a11y`, `check-play`, `check-consumers`), and the docs checker and `scripts/seen.mjs`
  repeat static serving code. Build once in the orchestrator; share one static-site helper.
- **P3 Resolver not proven by `check-consumers`.** vue-tsc checks the checked-in
  `components.d.ts`, not `VccsResolver`. Regenerate the d.ts before the typecheck.
- **P3 Brittle checker tests** depend on demo positions and generated ids
  (`scripts/check-play.test.mjs`, `scripts/seen.test.mjs`).

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
