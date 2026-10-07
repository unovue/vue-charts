# Decisions for vccs 1.0

Library and public API decisions, with reasons. Docs-site design decisions are in
`docs/adr/`. Each decision says what to do and, where it is not obvious, why. To change a
decision, amend it here in the same commit as the code.

"PLAN x.y" names a step of the 1.0 run plan, and "Review" names a review file of that run. Both
are in git history: [PLAN.md](https://github.com/Mat4m0/fork_vue-charts/blob/070c752/internals/release-1.0/PLAN.md) and [reviews/](https://github.com/Mat4m0/fork_vue-charts/tree/070c752/internals/release-1.0/reviews) at commit 070c752.

## Product

**D-1 Server rendering sends the entrance start.** The server sends each chart in the state its
entrance starts from (collapsed bars, undrawn lines, transparent cells). The entrance plays after
hydration when the chart is on screen. This keeps the entrances; a chart that must be complete
without JavaScript uses fixed width and height with `:is-animation-active="false"`, and then the
server sends the final chart. Disabling animation alone does not reveal an unmeasured chart.
Responsive charts keep reserving their box on the server and stay hidden until measured: the
audit measured 0 px box shift, and showing them before measurement would draw them at a wrong
width and then snap. The docs must say exactly this (PLAN 1.14). Review: [ssr-a11y.md](https://github.com/Mat4m0/fork_vue-charts/blob/070c752/internals/release-1.0/reviews/ssr-a11y.md), P1 row 4.

**D-2 Order of work.** Release blockers first (phase 1), then the core model (phase 2), then the
1.0 API batch (phase 3), then remaining test cleanup, performance, size and docs (phase 4).
Strict typing and critical behavior regressions land in 2.0, before the core rewrite. The API changes touch
the same files as the registries, so they land on the new model.

**D-3 One breaking release.** All breaking changes go into 1.0. No compatibility aliases, no
deprecation period for renamed props. Every change gets a row in the migration page
(`docs/content/1.getting-started/3.migration.md`). Exceptions with a deprecation warning instead
of removal: `ResponsiveContainer` and `Customized` (D-21).

**D-4 Budgets.** Compare every final bundle with the starting build from 0.2 and explain any
increase against the feature that requires it. Future size budgets (PLAN 4.3) use the final
measured size plus 5 %, rounded up to 0.1 kB; passing them alone does not prove no regression.
Performance is guarded A/B against the 0.6.0
baseline built in this run (PLAN 0.2): no case may be slower than the baseline by more than 10 %
(median of interleaved runs). An unstable A/A baseline is inconclusive; do not increase the
regression threshold to make it pass.

## Architecture

**D-5 Target design.** One `createChart()` per chart builds a typed model. Inputs are getters
over the chart props (no copies). Children register `computed` settings into registries (no
watch, no replace logic). Derived values are `computed`s, created once per chart inside the
chart's effect scope and cached by key when they take a parameter (`chart.axis('xAxis', 0)`).
The ported Recharts math stays as pure `combine*` functions: each former
`createSelector([a, b], combine)` becomes `computed(() => combine(a.value, b.value))`. Item
geometry is a `computed` in the item composable that reads the shared axis models. Interaction
state (tooltip, brush range, legend hidden) has explicit local or controlled ownership with
request operations; `v-model` does not give renderers write access to the owner. Standalone
charts use a read-only `TooltipSource` instead of the cartesian model. Two constraints: keyed
models live in the chart's `EffectScope`, not in the first child that asks; and children still
register during setup, so server rendering sees them. Full text: section 3 of
[reviews/architecture.md](https://github.com/Mat4m0/fork_vue-charts/blob/070c752/internals/release-1.0/reviews/architecture.md). Names and places:

| Concept | Name | Place |
| --- | --- | --- |
| Pure math ported from Recharts (domains, scales, ticks, stacking, geometry, layout) | `combine*` and plain functions, no `vue` import | `src/core/` (sub-folders `axis/`, `polar/`, and one file per series type) |
| The chart model | `interface Chart`, `createChart(inputs)`, `useChart()` | `src/model/` |
| Registries | `interface Registry<T>`, `createRegistry<T>()` | `src/model/registry.ts` |
| Axis model | `interface AxisModel`, `chart.axis(type, id)` (cached per key, created in the chart's `EffectScope`) | `src/model/axis.ts` |
| Tooltip | `interface TooltipSource` (D-8), `chart.tooltip` implements it | `src/model/tooltip.ts` |
| Standalone chart shell | `ChartShell` component (responsive size, wrapper, surface, pointer emits) | `src/chart/ChartShell.tsx` |
| Synchronisation | one module | `src/events/sync.ts` (merge `synchronisation/` into it) |

`src/state/` and `reselect` are deleted at the end of phase 2. `src/core/**` must not import
`vue`, model/state modules, components or browser APIs. Enforce import direction in lint.
Axis models are shared per chart, axis type and ID; reactive IDs use a computed lookup, not a
setup-time snapshot. A model outlives the first child that requests it and stops with its chart.

**D-6 Chart inputs are read, not copied.** Chart props reach the model as getters. No `watch`
that copies a prop into state. Children register `computed` settings into registries; a
registration is removed with `onScopeDispose`. A series registers only the fields that domains
and stacking read (dataKey, data, stackId, hide, axis ids, type, barSize, minPointSize,
errorBars, and the equivalents per series type), so changing `fill` or `stroke` recomputes no
domain.

**D-7 Data reactivity contract.** Preserve current behavior: array replacement, push/splice,
row-field edits, nested path/function accessor values, array-valued rows and hierarchy edits
update the chart. Do not replace this contract with a fixed traversal-depth limit.
The chart or series that owns `data` supplies one tracking boundary; remove duplicate deep
traversals. Prefer reactive reads of the values calculations consume; retain one deep watcher
where needed to preserve behavior. Use `toRaw` only at a boundary that requires raw objects,
after collecting dependencies. It does not copy data or invalidate same-identity refs: a raw
calculation path needs an explicit tracked revision or equivalent notification. Never mutate or
freeze caller data, and keep animation snapshots independent of later caller mutations.
Document the observable contract, not a required watcher implementation.

**D-8 TooltipSource.** One internal read-only view for every chart that shows a tooltip:

```ts
interface TooltipSource {
  active: ComputedRef<boolean>
  index: ComputedRef<number | null> // derived from the selection controller
  label: ComputedRef<string | undefined>
  payload: ComputedRef<readonly TooltipPayloadEntry[]>
  coordinate: ComputedRef<Coordinate | undefined>
}
```

`<Tooltip>` renders any `TooltipSource` from one injection key. Standalone charts provide a
`TooltipSource` and do not create the cartesian model. Keep this interface private; public
composables expose consumer concepts. Pointer, keyboard and sync handlers request selection
through one controller; renderers do not mutate the view.
Public indexes are `number | null`. Internally retain the series identity and item/node
identity needed to distinguish targets; do not replace hierarchical identity with a keyboard
position. For Treemap, Sankey and Sunburst the public index maps to the D-14 keyboard order.

**D-9 Clear context ownership.** Render phase, series motion, gesture, in-view, clip-path id,
portals and layer refs belong to a lightweight `ChartRuntime`; model and tooltip capabilities
may have separate injection keys. Consolidate duplicate ownership, not unrelated capabilities.
Standalone charts must not construct or import cartesian models merely to share a runtime or
tooltip. Replace the three `createContext` helpers with typed `InjectionKey` + `provide`/`inject`;
do not use motion-v for dependency injection. Key count is not an acceptance criterion.

**D-10 SSR detection** is one helper `isServer` in `src/utils/env.ts`
(`typeof document === 'undefined'`). `Global` is removed (also from the public API, D-17).

**D-11 Reduced motion and hydration.** One helper `useReducedMotion()` in `src/animation/`
returns `'no-preference'` until the component is mounted and the real preference afterwards.
Everything that renders output from the preference uses it, so server and client render the same
markup and the preference applies right after hydration. Fixes the cell-chart hydration
mismatch (ssr-a11y.md P1 row 1).

**D-12 Code health gates** (added in PLAN 2.14, enforced from then on):
- 0 import cycles (`madge --circular`; `madge` is already a root dev dependency).
- 0 unused files and unused exports outside the public entry points (`knip`, already a root dev
  dependency; config in `knip.json`).
- No production file in `packages/vue/src` longer than 600 lines.
- `ts/no-explicit-any: error` for `packages/vue/src/**` except tests and stories; at most 40
  `eslint-disable-next-line ts/no-explicit-any -- <reason>` lines, each at an untyped external
  boundary.
- 0 `@ts-ignore`; every `@ts-expect-error` has a reason in the same comment.
- `strict: true` in `packages/vue/tsconfig.json` (from PLAN 2.0; rechecked in 3.1).

## Public API (1.0)

Stance: Recharts concepts, names of concepts and math. Vue patterns for customizing (slots),
listening (typed emits), controlling (`v-model`) and typing (generics). One way per job.
Full background: [reviews/api.md](https://github.com/Mat4m0/fork_vue-charts/blob/070c752/internals/release-1.0/reviews/api.md).

**D-12a Exports.** `index.ts` uses explicit export lists (no `export *` from internal modules).
Removed: `LineContextKey`, `provideLineContext`, `useLineContext`, `useLine`, `LineContext`,
`LinePropsInternal`, the five ErrorBar context functions and their four types,
`sankeyPayloadSearcher`, `treemapPayloadSearcher`, `sunburstPayloadSearcher`, `getUniqPayload`,
`UniqueOption`, `ContentType`, `Global`, `GlobalConfig`, `GlobalConfigKeys`, `getPath`,
`rectanglePath`, all 14 `*VueProps` objects, `NormalizedStackId`, `CurvePropsWithOutSVG`,
`FunnelComposedData`, `FormattedGraphicalItem`, `useOffset`. Added: an `XxxProps` type for every
component in `componentNames.ts`, `TooltipPayloadEntry`, `TooltipPayload`, and the generic
derived payload types in D-18. `TooltipSource` stays internal.

**D-13 Active state.** Every chart or item with an active element supports
`v-model:active-index` (`number | null`, `null` = none) and works uncontrolled when not bound:
Tooltip, Sparkline, Pie, Bar, Tracker, Heatmap, CohortChart, CalendarHeatmap. Removed: the `-1`
sentinel and the one-way `activeIndex` props on Bar, Pie, Line and Area. `Tooltip.defaultIndex`
is `number`.

- An omitted model uses local state; a supplied value, including `null`, is authoritative.
  Pointer, keyboard and sync emit a request. If the parent declines it, the controlled display
  stays unchanged. Do not echo unchanged values or emit repeatedly on render.
- Tooltip indexes address axis data positions in axis mode, or the flattened D-14 item order
  in item mode. Bar/Pie indexes address that series' data; standalone indexes address their
  rendered item order. Convert through the internal target identity in D-8.
- A controlled chart-level Tooltip (or standalone root) takes precedence over per-series
  controls for that chart selection. Without it, controlled series determine their own active
  item; other series remain uncontrolled. Document this precedence in the model guide.
- Multiple Tooltip renderers observe the same selection and receive update requests. The first
  registered Tooltip owns shared interaction settings; later Tooltips customize presentation.
  At most one Tooltip may supply a controlled index; document this constraint rather than
  allowing mount order to silently choose between conflicting controlled values.
- Uncontrolled selection follows stable item identity across reorder/resize and clears when
  that item is removed or hidden. Controlled indexes remain positional: resolve them against
  the current order. An invalid index renders no active target and requests `null` once per
  distinct invalid input/data state, without mutating the supplied value.

**D-14 Keyboard model.**
- Axis charts (Bar, Line, Area, Composed, Radar, RadialBar): unchanged.
- Item charts (Pie, Scatter, Funnel): the focused chart root moves an active item with
  ArrowRight/ArrowDown (next), ArrowLeft/ArrowUp (previous), Home, End; Escape clears. Order:
  series in registration order, then data order. The tooltip shows the item, the item is drawn in
  its active state, the live region announces the tooltip text.
- Treemap, Sankey, SunburstChart: the root becomes focusable (`tabindex="0"`,
  `role="application"`, `aria-label` = title) with the same keys. Order: Treemap leaves by row
  (top to bottom, then left to right, by node center); Sankey nodes by column, then top to
  bottom; Sunburst sectors in depth-first pre-order. Enter emits the same event as a click on the
  node. Focus ring: the same 2 px `--v-charts-focus` outline as the axis charts.
- Funnel arrow keys must never throw (ssr-a11y.md P1 row 2).
- BarList remains a semantic list. Links retain native link behavior; actionable rows use
  native button/link activation, including the keyboard. Do not add a tooltip or an application
  role merely to satisfy a chart-wide test.

**D-15 Accessible names.** Every chart takes `title` (accessible name) and `desc` (description).
`ariaLabel` props are removed. Defaults:

| Chart | Default title |
| --- | --- |
| AreaChart | Area chart |
| BarChart | Bar chart |
| LineChart | Line chart |
| ComposedChart | Chart |
| ScatterChart | Scatter chart |
| PieChart | Pie chart |
| RadarChart | Radar chart |
| RadialBarChart | Radial bar chart |
| FunnelChart | Funnel chart |
| Treemap | Treemap |
| Sankey | Sankey diagram |
| SunburstChart | Sunburst chart |
| Tracker | Status history |
| Heatmap | Heatmap |
| CohortChart | Cohort retention |
| CalendarHeatmap | Activity calendar |
| BarList | Bar list |
| JourneySankey | keeps its computed name ("Journeys of N sessions over M steps") |
| Sparkline | keeps its computed name ("Trend: …") |

**D-16 Brush.** One model: `v-model:range` of `BrushStartEndIndex | null`, where the non-null
value is `{ startIndex, endIndex }`. `start-index`/`end-index` models are removed. `null` means
no selected window (show all available rows); empty data always has effective range `null`.
An uncontrolled Brush initially selects the full range when data exists and restores that
default when empty data becomes populated. When rows change it reconciles its window by index
(user-approved 2026-10): (a) values change with the same row count → window unchanged; (b) rows
added and the window ended at the last row → it shifts forward keeping its width, following the
newest rows (a full window stays full); (c) rows added, window elsewhere → same positions; (d) rows
removed → clamp to the new length, reset to full only when nothing remains. A controlled
`v-model:range` bypasses all of this, and setting the range to `null` selects the full range.
This differs from Recharts, which resets on a new data array; vccs has no row identity, so the
rule is index-based. The Brush is the only owner of the range (it registers it into
`chart.brush`); a chart without a Brush follows only a synchronised peer's range. A controlled `null` remains null until the parent
changes it; repopulation must not overwrite that explicit choice.
For nonempty data, floor finite indexes, clamp them to `[0, length - 1]`, then order start/end.
Non-finite indexes normalize to `null`. Emit `update:range` once per distinct input/data state
that needs normalization, including shrink-to-empty. Derive the safe effective range without
mutating a controlled prop; a rejected user drag keeps the parent's effective range.
Hide travellers for a null range. Otherwise each traveller has `aria-label` "Range start" /
"Range end", `aria-valuemin` 0, `aria-valuemax` data length − 1, `aria-valuenow` the index,
and `aria-valuetext` the category label. Never render a slider with a negative maximum.

**D-17 Removed or renamed props** (all without aliases):

| Component | Old | New |
| --- | --- | --- |
| All categorical charts | `to`, `throttleDelay` | removed (never read) |
| Cartesian charts (Area, Bar, Line, Composed, Scatter) | polar props `cx`, `cy`, `innerRadius`, `outerRadius`, `startAngle`, `endAngle` | removed |
| Polar charts (Pie, Radar) | bar props `barSize`, `barGap`, `barCategoryGap`, `maxBarSize` | removed (RadialBarChart keeps them) |
| FunnelChart | polar and bar props | removed |
| Line, Area | `points`, `path`, `baseLine`, `layout`, `left`, `top`, `width`, `height`, `animationId`, `activePoint`, `needClip`, `activeIndex` | removed from public props (internal view props only) |
| Bar | `needClip`, `id`, `activeIndex` (see D-13) | removed from public props |
| Legend | `chartWidth`, `chartHeight`, `margin` | removed from public props |
| Label | `parentViewBox`, `index` | removed from public props |
| Tooltip | `content` prop; default slot as content | removed; use `#content` |
| Tooltip, Legend | `portal` | `to` (`string \| HTMLElement`, like `<Teleport to>`) |
| Tooltip | `transition: AnimationOptions` | `transition: ChartTransition` |
| Tooltip | — | add `labelFormatter` (Recharts parity) |
| Treemap | `colorPanel` | `colors` |
| Treemap | `aspectRatio` | `tileAspectRatio` |
| Tracker | `colors`, `labels` | `statusColors`, `statusLabels` |
| Heatmap, BarList | `valueFormat` | `valueFormatter` |
| Heatmap | `xLabelFormat`, `yLabelFormat` | `xTickFormatter`, `yTickFormatter` |
| CohortChart | `periodLabel` | `periodFormatter` |
| JourneySankey | `formatSubtitle` | `subtitleFormatter` |
| Standalone charts | `ariaLabel` | `title` (D-15) |
| ResponsiveContainer | `onResize` callback prop | `@resize` emit |
| XAxis, YAxis | `orientation: string`, `type: string`, `padding: object` | `'top' \| 'bottom'` / `'left' \| 'right'`, `'number' \| 'category'`, `{ left?, right? } \| 'gap' \| 'no-gap'` (Y: `top`/`bottom`) |
| XAxis, YAxis | undeclared `tick`, `angle`, `label`, `name`, `stroke`, `tickSize` | declared and typed in one shared `AxisProps` |
| YAxis | `yAxisId` without default | default `0` (like `xAxisId`) |

**D-18 Typed rows.**
- Standalone charts (Tracker, Heatmap, CohortChart, CalendarHeatmap, BarList, Sparkline,
  JourneySankey) are generic in `Row`, inferred from `data`. Key props accept
  typed row keys or accessors without dropping supported nested-key behavior. Preserve the
  domain object actually emitted: direct-row charts carry `Row`; aggregate charts carry a
  derived payload with typed provenance, not a cast to `Row`.
- Heatmap uses `HeatmapCell<Row>` with `{ x, y, value, rows: readonly Row[] }`; a missing cell
  has zero rows. Calendar days carry their date/value/level and contributing rows (possibly
  none). Cohort cells carry the source row and period. Journey nodes/links retain their
  derived layout fields and typed contributing rows. Runtime events, slots and formatters
  expose the same domain object.
- `defineChartComponents` becomes curried and tree-shakeable:
  import `BarChart`, `Bar`, `Tooltip`, then use
  `const Chart = defineChartComponents<Row>()({ BarChart, Bar, Tooltip })` and `<Chart.Bar>`.
  At runtime it returns its argument; only the passed components are bundled. It covers every
  component that takes a `dataKey`, plus the standalone charts.
- Item payload types (`BarRectangleItem`, `LinePointItem`, … ) carry `payload: Row` through the
  typed helper and `unknown` without it (not `any`).

**D-19 Colors.**
- Tokens `--v-charts-series-1` … `--v-charts-series-8` join `chartThemeTokens`. Fallback chain:
  `var(--v-charts-series-N, var(--v-charts-series, <palette N>))`.
- Palette (fallbacks): 1 `#2563eb`, 2 `#f97316`, 3 `#14b8a6`, 4 `#a855f7`, 5 `#f59e0b`,
  6 `#ec4899`, 7 `#06b6d4`, 8 `#84cc16`. Index N cycles after 8.
- Series charts (Area, Bar, Line, Scatter, Radar): N = position of the item among the chart's
  series in registration order (an item with an explicit color still takes its position).
  Bar and Scatter get a default fill (they have none today).
- Per-entry charts (Pie, Funnel, RadialBar, Treemap top-level groups, Sunburst top-level
  branches with children inheriting their branch): N = entry index.
- Single-color charts (Heatmap, CohortChart, CalendarHeatmap, BarList, Sparkline, JourneySankey,
  Sankey nodes): series 1. CalendarHeatmap's green default becomes series 1; the docs demo sets
  `color="#16a34a"` to keep its look.
- One fallback for `--v-charts-series`: `#2563eb`. Remove the other fallback hexes (`#3182bd`,
  `#808080`, `#0088fe`, `#16a34a`).

**D-20 Text contrast** (ssr-a11y.md contrast table).
- Tooltip item text uses `--v-charts-tooltip-foreground`. The series color appears only as an
  8 × 8 px swatch (2 px radius) before the item name.
- For known opaque fills, text on shapes picks `#ffffff` or `#0a0a0a`, whichever has higher
  contrast; parse supported colors with `d3-color`. A CSS variable's fallback is not evidence
  of its resolved color. Support `--v-charts-label-foreground` as an explicit override for
  arbitrary fills, including variables and transparency; keep server/client markup consistent.
  Test resolved colors and composited backgrounds for supported default light/dark themes,
  overridden and nested variables, and translucent fills. Do not claim automatic contrast
  for arbitrary user themes or use the nearest rectangle as a universal background estimate.
- BarList: label and value text inherit `currentColor`; the bar tint uses at most 20 % opacity
  of its color, so text on the tint reaches 4.5:1 on the docs' light and dark themes.
- Legend: each item is an `li` that contains a `button` with `aria-pressed` = the series is
  shown (`true` when visible).

**D-21 Deprecations (kept in 1.0, removed in 2.0).** `ResponsiveContainer` and `Customized` log
one development warning per app (through `src/utils/log.ts`), exactly:
- `[vccs] ResponsiveContainer is deprecated and will be removed in 2.0. Charts are responsive by default: remove the wrapper and set width, height or aspect on the chart.`
- `[vccs] Customized is deprecated and will be removed in 2.0. Use the chart's default slot with usePlotArea() and the other chart composables.`

**D-22 Markup contract.**
- `data-recharts-item-index` → `data-v-charts-item-index`; `data-recharts-item-data-key` →
  `data-v-charts-item-data-key`.
- Add `data-slot` attributes: `chart` (root wrapper), `surface` (root svg), `plot` (plot-area
  group), `grid`, `x-axis`, `y-axis`, `series` (each graphical item's root group), `tooltip`,
  `legend`, `brush`, `cell` (each cell in cell charts), `label`.

**D-23 Slots and events to add.**
- Radar: slots `shape`, `dot`, `activeDot`, `label` (the boolean/object props stay as toggles).
- RadialBar: slots `shape`, `label`.
- CartesianGrid: typed `horizontal` and `vertical` slots.
- Legend and Label: `content` slots are optional; every slot returns `VNodeChild`.
- SunburstChart: `node-click`, `node-mouseenter`, `node-mouseleave` with `(node, index, event)`.
- JourneySankey: `node-click`, `node-mouseenter`, `node-mouseleave`, `link-click`,
  `link-mouseenter`, `link-mouseleave` with `(item, index, event)`; index is the position in the
  layout's node or link list.
- Emits use kebab case everywhere (`SunburstInner`'s camelCase emits go).
- Area gets no `shape` slot (Recharts' Area has none).

**D-24 Chart-level animation defaults.** Every chart accepts `isAnimationActive` and
`transition`. Items read their own prop first, then the chart's. Item props default to
`undefined` so the chart value applies.

## Motion

**D-25 Accepted lab flags.** The only accepted flags in `pnpm motion:report --prod --check` are
the JourneySankey fold of a re-ranked node in scenarios `journey top8` (backwards on
`rect.v-charts-journey-node-continue#n:1/features/web-analytics@1`) and `journey top15` (jumps on
the same element and one overlap of about 83 px² near 112 ms). They are the price of not sliding
nodes through each other. Any other flag fails the gate.

**D-25a Real-clock timing is reported, not gated by default.** `report.mjs --check` today also
fails a transition with more than 2 slow frames measured on the real clock (`timing['1x'].slow`).
That number depends on machine load, so a cloud machine cannot gate on it reliably. From step
1.13: `--check` gates on the frame-exact flags (fake clock) and page errors; the slow-frame count
stays in the report and gates only with `--strict-timing`. This reduces default timing coverage;
the frame-exact checks remain unchanged. Keep the separate real-clock benchmark and report
inconclusive timing evidence explicitly; deterministic geometry does not prove runtime speed.

**D-26 Motion fixes** ([reviews/motion.md](https://github.com/Mat4m0/fork_vue-charts/blob/070c752/internals/release-1.0/reviews/motion.md)):
- A data change that changes nothing on screen (equal content) runs no animation, renders no
  frames and emits no `animation-start`/`animation-end`.
- A change during a cascade entrance keeps each item's turn: items that had not started keep
  their delay.
- Spring transitions may overshoot: user-transition progress is passed to `interpolate`
  unclamped; only opacity-like values are clamped to [0, 1].
- `animation-start`/`animation-end` fire only around real animation runs, never on snaps.
- One clock: the entrance continuation reads elapsed time from the running animation, not from
  `performance.now()`.
- BarList's height follows the drawn rows on the same clock (`Σ (rowHeight + gap) × presence −
  gap`, presence = progress for entering rows, 1 − progress for leaving rows).
- Heatmap, CohortChart and CalendarHeatmap row and column labels move with their cells
  (keyed transitions with the same tokens; month labels keyed by month, not by x).
- New tokens in `motion.ts`: `feedback` (0.15 s, ease-out: hover dim, active dot, journey
  highlight, tooltip fade), `color` (0.3 s, ease-out: color cross-fades), `follow` (the tooltip
  spring, stiffness 500, damping 40, mass 1). The five hard-coded timings use them.
- Treemap and the cell charts share one cascade reveal helper in `motion.ts`.
- Lines and areas keep drawing at their steady pace in composed charts; bars land first. This is
  intended; document it.
- The lab's ideal entrance curve reads `motionTokens` (today it assumes a 600 ms quint).

## Content decisions

**D-27 Edge-data policies.**
- CohortChart: `null` or `undefined` in `values` means "no measurement": the cell is left out
  (blank), like an immature period. A numeric `0` is a measured 0 %.
- CalendarHeatmap: the default `end` is the latest valid date in `data`, whether or not that
  row has a numeric value.
- JourneySankey ignores rows whose count is not a finite positive number.
- Sparkline draws a constant series (all values equal, any magnitude) as a flat line at
  mid-height.
- `stackId` may be any string, including names of `Object.prototype` members.

**D-28 Docs voice.** Plain, direct English: short sentences, active voice, present tense, one
idea per sentence. Say what the reader can do and why it matters. No marketing words
("powerful", "seamless", "blazing", "effortless"). Code examples use the 1.0 API and the docs
palette (`#f97316`, `#14b8a6`, `#f59e0b`, `#06b6d4`), and every demo `Tooltip` has
`:cursor="false"` (repository `CLAUDE.md`).

**D-29 License.** The root `LICENSE` keeps the current notice and adds, below it:

```
This project is a Vue port of Recharts. Portions are derived from Recharts,
which is licensed under the MIT License:

The MIT License (MIT)

Copyright (c) 2015-present recharts

Permission is hereby granted, free of charge, … (the full MIT permission and warranty text)
```

The packed tarball's `LICENSE` must contain both notices.

**D-30 Nuxt module prefix** stays `''` (no prefix). The Nuxt guide documents the name collision
with shadcn-vue / Nuxt UI components (`Tooltip`, `Legend`, `Label`, …) and shows
`vccs: { prefix: 'V' }` as the fix. No code change.

## Amendments

- **D-22a (2.0/2.3):** preserve registration paint order through hydration, reduced motion and updates; keep cursor → graphical → label tiers and geometry. Reproduction (local run evidence, not in git) shows hydrated Bar→Area→Line versus static Area→Bar→Line.
- **D-17 (3.3/3.6):** remove Bar's internal `needClip`/`id`; replace its old one-way `activeIndex` with D-13's model prop and update emit. The model prop remains public. Conflicting baseline contracts (local run evidence, not in git).
- **D-25b (1.9):** motion checks require visible fill or stroke, including resolved alpha/opacity and stroke width; retain thresholds and positive opaque/stroke-only controls. 121 zero-alpha cell flags (local run evidence, not in git) are checker artifacts; unexplained overflow/entrance still fails.
- **D-27a (1.2):** prototype-safe grouping must cover axis stack groups and bar sizing. The one-path fix reproduction (local run evidence, not in git) still crashes all three prototype-named IDs in `combineBarSizeList`; preserve literal bar heights and ordinary/numeric grouping.
- **D-25c (1.13 true baseline):** build `31da149` and HEAD reproduce the same Journey fold flags.
  `top8`: four backwards samples, a 7 px jump and a 78 px² overlap; `top15`: two jumps (15/14 px) and an 83 px² overlap.
  These predate this run and are accepted under D-25, by scenario, kind and element.
  Baseline and HEAD comparison (local run evidence, not in git); baseline report (local run evidence, not in git).
- **D-25d (Phase 1 playground gate):** 0.1 and freshly built `31da149` both exit 1 for inherited playground flags.
  Gate on zero new scenario/kind/element flags against the same corrected recorder at baseline; retain raw failures and thresholds.
  130 matching flags and baseline causes (local run evidence, not in git).
- **D-25e (Product slice, Opus):** preserve Journey's geometric fold; backwards/jump flags are
  intended height shrink-and-grow, accepted with reasons. Only overlaps are defects: folding
  slots follow neighbours on shared eased progress. No recorder change. Analysis and frames (local run evidence, not in git).
