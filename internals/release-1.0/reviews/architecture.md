# vccs internal architecture review

Date: 2026-10-05. Branch `feat/cell-grid-main` @ `72c8765`. Scope: `packages/vue/src`
(318 production files, 33,059 lines; 128 test files). Read-only review, medium depth.

## 0. Correction to the brief: Redux is already gone

The brief says "~45 files still use Redux Toolkit via @reduxjs/vue-redux". That is not true on
this branch. Commits `4417358`, `584ad67`, `3ec7d0f`, `95b797e` ("refactor(state): remove Redux
and isolate chart calculations") and `fc3df71` removed Redux Toolkit, vue-redux, Immer and the
store. `packages/vue/package.json` has no Redux dependency. `internals/vision.md:12` agrees.

What remains is **Redux-shaped Vue**: the architecture still has the shape of the Recharts store,
only the engine changed.

| Residue | Evidence | Size |
|---|---|---|
| 12 "slice" factories: `shallowRef` + reducer-like setters that copy immutable snapshots | `state/chart*.ts` | 1,534 lines in `state/*.ts` |
| One root-state facade with getters, typed `RechartsRootState` | `state/chartContext.ts:50-63`, `state/chartState.ts:15` | 36 files reference the type |
| `useAppSelector(selector)` = `computed(() => selector(view))` | `state/chartContext.ts:83-86` | 189 calls in 44 files |
| reselect (`createSelectorCreator(weakMapMemoize)`) | `state/createSelector.ts:1-11`, `package.json` `reselect ^5.1.1` | 181 `createSelector(` calls, ~1,200 lines of wiring |
| Selector modules | `state/selectors/**` | 5,810 lines, 25 `@ts-ignore`/`@ts-expect-error` around reselect overloads |
| "Report*" / "Set*" render-null components and watch-to-store copies (React `useEffect(dispatch)` pattern) | `state/Report*.ts(x)`, `state/Set*.ts`, `context/ChartDataContextProvider.ts` | 7 files |

So the real remaining task is: **remove reselect, the root-state facade and the slice factories,
and replace them with one chart model made of `computed`s and registries.** Sections 2 and 3
are written for that task.

Test baseline: `npx vitest run` in `packages/vue`: run 1 (while other processes loaded the
machine) 1,237/1,240 passed, 3 failed; run 2 showed no FAIL lines. Treat the 3 as load-dependent
flakes until someone reruns them alone; I did not identify them.

---

## 1. Architecture map

```
Chart root (generateCategoricalChart / standalone chart setup)
 ├─ provideChartContext()         state/chartContext.ts       12 slice factories + `view` facade
 ├─ provideRenderPhase()          animation/renderPhase.ts    5 more chart-scoped keys (phase, size, series motion, gesture, in-view)
 ├─ provideIndependentChart()     context/PanoramaContextProvider.ts
 ├─ provideClipPathId()           chart/provideClipPathId.ts
 ├─ render-null "reporters"       ChartDataContextProvider, ReportMainChartProps, ReportChartProps, ReportPolarOptions
 │      props --watch--> slice setters
 ├─ ChartsWrapper                 events: useChartInteractions / useChartSynchronisation (receive) / useReportScale
 └─ Surface.vue                   provides cursor/graphical/label layer refs (teleport z-order)
      └─ children (Bar, Line, XAxis, Tooltip, Legend, Brush, Reference*)
           ├─ register:  SetCartesianGraphicalItem / SetPolarGraphicalItem / SetLegendPayload /
           │             SetTooltipEntrySettings / axis add/remove      (watch -> slice setter)
           ├─ derive:    useAppSelector(selectX(state, xAxisId, yAxisId, isPanorama, settings))
           ├─ defer:     useDeferredView (SSR/hydration: render geometry after all siblings registered)
           └─ animate:   useKeyedTransition | usePointTransition | useTickMotion  (motion-v `animate`)

Selector layer (state/selectors, pure + reselect):  combine* functions ported from Recharts
utils/ (chart.ts, scale/, tick.ts, ...): pure math, d3-scale/d3-shape
```

### Layers

| Layer | Files | Notes |
|---|---|---|
| Chart factory | `chart/generateCategoricalChart.tsx` (274) + 9 thin wrappers (`AreaChart.ts`, ...) | One factory for all Recharts-ported charts. Props, size, a11y wrapper, reporters. |
| Standalone charts | `Tracker`, `Heatmap`, `CalendarHeatmap`, `CohortChart`, `Sparkline`, `BarList`, `JourneySankey`, `Treemap`, `Sankey`, `SunburstChart`, shared `CellGridLayer.tsx` (536) | Own setup each; most call `provideChartContext(...)` only to reuse the tooltip machinery (`Tracker.tsx:57`, `Heatmap.tsx:74`, `CalendarHeatmap.tsx:65`, `Sparkline.tsx:325`, `JourneySankey.tsx:476`, `Treemap.tsx:488`, `Sankey.tsx:427`, `SunburstChart.tsx:262`). `BarList` and `CohortChart` provide none. |
| Chart state | `state/chart*.ts` | 12 slices: layout, data, brush, legend, options, rootProps, polarOptions, polarAxis, referenceElements, cartesianAxis, graphicalItems, tooltip. |
| Derivation | `state/selectors/**` (5,810), `utils/chart.ts` (685), `utils/scale/**` | Pure math is good and worth keeping. Wiring is reselect. |
| Context (DI) | `context/*` (10 files), `utils/createContext.ts`, `animation/renderPhase.ts` | ~25 `provide` sites, three `createContext` helpers (see P2-6). |
| Events | `events/*`, `synchronisation/*` | Pointer, keyboard, touch, sync. Sync split over two folders. |
| Animation | `animation/useKeyedTransition.ts` (397), `usePointTransition.ts`, `useTickMotion.ts`, `motion.ts`, `renderPhase.ts`, `SweepClip.tsx`, `ActiveDot.tsx` | Consistent: keyed transitions used by 12 items/charts, point transitions by Area/Line/Sparkline. This layer is in good shape. |
| Items | `cartesian/*`, `polar/*`, `components/*` | Recharts-ported; read selectors via `useAppSelector`. |

### Source of truth per concept

| Concept | Source of truth today | Duplicate authority? |
|---|---|---|
| Data | Chart `data` prop -> `useTrackedData` deep watch copy -> `ChartDataContextProvider` watch -> `chartData` slice (`context/ChartDataContextProvider.ts:22-25`) | **Yes.** Prop, tracked copy and slice copy. Each series with its own `data` prop deep-tracks again (`hooks/useSetupGraphicalItem.ts:27`). `chartData.computedData` is never written (`state/chartData.ts:33`). |
| Layout / size / margin | Chart props -> `ReportMainChartProps` watch -> `layout` slice (`state/ReportMainChartProps.ts:35-41`) | **Yes.** Props are the truth; the slice is a copy one tick behind a `watch`. Root option defaults are written three times: `generateCategoricalChart.tsx:28-124`, `ReportChartProps.tsx:9-43`, `chartRootProps.ts:27-37`, and they disagree (`barGap` is `[Number, String]` in the factory, `Number` in `ReportChartProps.tsx:18`). |
| Offset / viewBox | Selectors `selectChartOffsetInternal` / `selectChartOffset` over layout + axes + legend + brush | No, but each `useOffset()` call creates its own `computed` (`context/chartLayoutContext.tsx:11-13`). |
| Scales / axes | Axis components register settings into `cartesianAxis` / `polarAxis` slices; scale/domain/ticks are parameterized selectors `(state, axisType, axisId, isPanorama)` | No duplicate, but the parameter `isPanorama` is always `false` (P1-2). |
| Tooltip / active index | `tooltip` slice (`state/chartTooltip.ts:229-389`) + controlled `activeIndex` prop on `<Tooltip>`, bridged by a single listener slot (`chartTooltip.ts:258-266`) | **Partly.** Controlled `activeIndex` is copied into `settings.activeIndex` and also read from props (`Tooltip.tsx:657-671`, `701`). Internal index is `string`, public index is `number` (`chartTooltip.ts:35-36`). |
| Legend | `legend` slice: settings, size, payloads, hidden; `Legend` watches props into it (`components/legend/Legend.tsx:186-194`) | Copy of props (`hidden` with a deep watch). |
| Brush | Range lives in `chartData.dataStartIndex/EndIndex`; settings in `brush` slice; `useBrushSetting.ts:12,25` watches props into both | Range has one home (good, from `6119789`). |
| Synchronisation | Module-level channel `utils/events.ts:37-52`; send in `synchronisation/useChartSynchronisation.tsx`, receive in `events/useChartSynchronisation.tsx`; chart identity is a lazily created `Symbol` in `chartOptions` (`state/chartOptions.ts:50-53`) | No duplicate, but split across folders and identity is needless state. |
| Animation | Per item, `useKeyedTransition` / `usePointTransition`; chart-wide phase in `renderPhase.ts` | No. Chart-scoped animation state lives in a second set of injection keys, separate from the chart context. |

---

## 2. "Redux" (store-shaped) inventory

All writers below are Vue functions now; readers go through `useAppSelector` or `use<Slice>()`.

| Slice | File (lines) | Writers | Readers | What it holds |
|---|---|---|---|---|
| layout | `state/chartLayout.ts` (42) | `ReportMainChartProps` (watch), `useReportScale` | offset, container, axis selectors | layoutType, width, height, margin, CSS scale |
| chartData | `state/chartData.ts` (73) | `ChartDataContextProvider` (watch), Brush (`setRange`), brush sync receive | data/axis/tooltip selectors | data, brush start/end, dead `computedData` |
| brush | `state/chartBrush.ts` (31) | `useBrushSetting` (watch) | offset, brush, viewBox | x, y, width, height, padding |
| legend | `state/chartLegend.ts` (73) | `Legend` (watch x2), `SetLegendPayload` | offset, legend selectors | settings, size, payloads, hidden |
| options | `state/chartOptions.ts` (56) | chart setup, `createEventEmitter` on mount | tooltip, sync | chartName, tooltip event types, payload searcher, emitter symbol |
| rootProps | `state/chartRootProps.ts` (55) | `ReportChartProps` (watch) | bar, sync, a11y | barGap, barCategoryGap, barSize, stackOffset, syncId, syncMethod, a11y |
| polarOptions | `state/chartPolarOptions.ts` (25) | `ReportPolarOptions` (watch) | polar selectors | cx, cy, angles, radii |
| polarAxis | `state/chartPolarAxis.ts` (53) | PolarAngleAxis / PolarRadiusAxis | polar selectors | axis settings by id |
| referenceElements | `state/chartReferenceElements.ts` (72) | ReferenceLine/Area/Dot | axis domain selectors (`ifOverflow: extendDomain`) | settings by kind |
| cartesianAxis | `state/chartCartesianAxis.ts` (168) | X/Y/ZAxis, YAxis auto width | axis selectors | axis settings by id, width history |
| graphicalItems | `state/chartGraphicalItems.ts` (177) | `SetCartesianGraphicalItem` (sync watch), `SetPolarGraphicalItem`, dead `ReportBar` | every domain/stack/bar/legend selector | item settings arrays, dead `countOfBars` |
| tooltip | `state/chartTooltip.ts` (389, mostly types/docs) | events, `Tooltip` (watch settings), items (`SetTooltipEntrySettings`), CellGridLayer, standalone charts | tooltip selectors | settings, item/axis/keyboard/sync interaction, item payloads |

Glue:

- Facade and hook: `state/chartContext.ts` (126), `state/hooks.ts` (24), `state/chartState.ts` (27), `state/createSelector.ts` (11).
- Reporters and setters: `ReportMainChartProps.ts` (47), `ReportChartProps.tsx` (61), `ReportPolarOptions.tsx` (35), `ReportBar.tsx` (13, dead), `SetGraphicalItem.ts` (58), `SetLegendPayload.ts` (27), `SetTooltipEntrySettings.tsx` (24), `context/ChartDataContextProvider.ts` (34).
- Selectors: 34 files, 5,810 lines, 181 `createSelector`; largest `axisSelectors.ts` 1,784 (50 selectors, 22 combiners), `radialBarSelectors.ts` 581, `tooltipSelectors.ts` 533, `barSelectors.ts` 473. About 1,200 lines are `createSelector([...], fn)` wiring; the rest is pure math (partly inline in result functions).
- No middleware or listeners remain (events call slice operations directly; `events/useChartInteractions.ts`).
- Consumers: `useAppSelector` 189 calls in 44 files; slice hooks: `useChartTooltip` 21, `useChartLayoutActions` 10, `useChartCartesianAxis` 8, `useChartLegend` 7, `useChartDataActions` 7, `useChartGraphicalItems` 6, `useChartReferenceElements` 5, others 3-4.
- Tests that import selectors directly: only 7 spec files (`fineGrainedHover`, `chartFinalDomains`, `AreaChart`, `synchronizationLifecycle`, `usePointTransition`, `pieSelectors`, `tooltipSelectors`). The other ~120 test files use the public API, so they are parity tests for free.

How it behaves (good to know before changing it): the `view` facade is a frozen object with one
getter per slice, so a `computed(() => selector(view))` tracks only the slices it reads.
`fineGrainedHover.spec.tsx` proves that a pointer move runs zero bar/line/tick selectors. The
argument cache of reselect is turned off on purpose (`createSelector.ts:5`) so Vue sees every
read. In effect, reselect now only adds result memoization that `computed` already gives.

---

## 3. Removal plan: from store shape to one chart model

### Target design

One `createChart()` per chart builds a typed model: inputs are getters over the chart props (no
copies), children register `computed` settings into registries (no watch, no replace logic),
and derived values are `computed`s created once per chart, inside the chart's effect scope, and
cached by key for parameterized ones (`chart.axis('xAxis', 0)`). The ported Recharts math stays
as pure `combine*` functions; each `createSelector([a, b], combine)` becomes
`computed(() => combine(a.value, b.value))`. Item geometry (`bar rectangles`, `line points`) is
a `computed` in the item composable that reads shared axis models. Interaction state (tooltip,
brush range, legend hidden) is plain `ref`s that `v-model` can bind to. Standalone charts use a
small `TooltipSource` contract instead of the whole cartesian model.

```ts
// state/chart.ts
import type { ComputedRef, EffectScope, InjectionKey, Ref, ShallowRef } from 'vue'

export interface ChartInputs {
  name: string
  data: () => readonly unknown[] | undefined
  layout: () => LayoutType
  size: () => Size
  margin: () => Margin
  options: () => RootOptions // barGap, barCategoryGap, stackOffset, syncId, syncMethod, accessibilityLayer
  polar: () => PolarOptions | undefined
  tooltip: TooltipDefaults // default/valid event types, payload searcher
}

export interface Registry<T> {
  readonly entries: ComputedRef<readonly T[]>
  /** Adds a reactive entry; removes it when the caller's scope is disposed. */
  register: (entry: Readonly<Ref<T | undefined>>) => void
}

export interface AxisModel {
  settings: ComputedRef<AxisSettings | undefined>
  domain: ComputedRef<NumberDomain | CategoricalDomain | undefined>
  scale: ComputedRef<RechartsScale | undefined>
  ticks: ComputedRef<readonly TickItem[] | undefined>
  bandSize: ComputedRef<number | undefined>
}

export interface Chart {
  readonly inputs: ChartInputs
  readonly items: Registry<GraphicalItemSettings>
  readonly axes: Registry<AxisSettings>
  readonly references: Registry<ReferenceSettings>
  readonly legend: { entries: Registry<LegendPayload>, settings: ShallowRef<LegendSettings | undefined>, hidden: Ref<LegendHidden> }
  readonly brush: { range: Ref<BrushStartEndIndex>, settings: ShallowRef<BrushSettings | undefined> }
  readonly tooltip: TooltipModel // interaction refs + computed active payload/label/coordinate
  readonly offset: ComputedRef<ChartOffset>
  readonly viewBox: ComputedRef<CartesianViewBox>
  axis: (type: AxisType, id: AxisId) => AxisModel
}

const chartKey: InjectionKey<Chart> = Symbol('vccs-chart')

export function useChart(): Chart {
  const chart = inject(chartKey, null)
  if (!chart)
    throw new Error('vccs: this component must be used inside a chart.')
  return chart
}

function createRegistry<T>(): Registry<T> {
  const set = shallowReactive(new Set<Readonly<Ref<T | undefined>>>())
  return {
    entries: computed(() => [...set].flatMap(e => (e.value === undefined ? [] : [e.value]))),
    register(entry) {
      set.add(entry)
      onScopeDispose(() => set.delete(entry))
    },
  }
}

/** Builds each keyed model once, inside the chart's scope, so it outlives the child that asked first. */
function keyed<V>(scope: EffectScope, build: (key: string) => V) {
  const cache = new Map<string, V>()
  return (key: string) => {
    let value = cache.get(key)
    if (value === undefined) {
      value = scope.run(() => build(key))!
      cache.set(key, value)
    }
    return value
  }
}

// In an item:
const chart = useChart()
const settings = computed(() => pickBarSettings(props)) // only domain-relevant fields
chart.items.register(settings)
const x = chart.axis('xAxis', props.xAxisId)
const rects = computed(() => combineBarRectangles(x.scale.value, y.scale.value, stacks.value, settings.value, chart.offset.value))
```

Why this is better: one injection key instead of ~15 chart-scoped ones; no root-state type;
no `@ts-ignore` for reselect overloads; a child's prop change reaches geometry through one
`computed` chain instead of watch -> setter -> snapshot -> selector; and `registry` keeps the
registration order stable (a `Set` keeps insertion order, and an entry's position does not
change when its settings change).

Two constraints to keep:

1. **Scope ownership.** Keyed models must be created in the chart's `EffectScope`
   (`getCurrentScope()` captured in the chart's setup), not in the scope of the first child that
   asks. Otherwise an unmounting child can stop a model that others still use.
2. **SSR order.** Children still register during setup, and geometry still renders through
   `useDeferredView` (`hooks/deferredView.ts:14-21`). The registry design does not change that
   contract; it removes the `flush: 'sync'` watch workaround (`state/SetGraphicalItem.ts:16-30`).

### Can the selector math stay?

Yes. The `combine*` functions (22 in `axisSelectors.ts`, 6 in `selectors/combiners/`, more inline)
are pure and independent of state shape. Keep them as plain functions in a `core/` folder with no
Vue import. The mechanical work per selector: name the inline result function `combineX`, delete
the `createSelector` wrapper, and wire the inputs as `computed`s. Delete `RechartsRootState` from
their signatures. Vue `computed` already memoizes on dependencies and, since Vue 3.4, does not
notify dependents when the new value is `Object.is` equal, which matches the reselect behavior
used today.

### Ordered slices (each ≤ 1 day, each lands and is verified on its own)

Before slice 1, make the recompute guard independent of selector names: change
`state/__tests__/fineGrainedHover.spec.tsx` to spy on the pure combiners (`combineBarRectangles`,
line points, ticks) instead of `selectBarRectangles` etc. Then the same test guards every slice.

| # | Slice | Moves to | Risk | Parity proof |
|---|---|---|---|---|
| 0 | **Delete dead paths.** `isPanorama` parameter (always `false`, P1-2), `ReportBar` + `countOfBars`, `computedData`, `RootSurface.tsx`, `use-axis-line.tsx`, `utils/context.ts`, dead exports (P2-10); fix `useTooltipEventType(props.shared)` (P1-1) with one regression test. | Deletions | Low. Panorama is a separate compact chart with its own context (`generateCategoricalChart.tsx:158-160`, `Panorama.tsx:24-38`). | Full suite; `brushRangeOwnership.spec.tsx`; Brush stories in playground. |
| 1 | **Root inputs without reporters.** Delete `ReportMainChartProps`, `ReportChartProps`, `ReportPolarOptions`, `ChartDataContextProvider`; `createChart(inputs)` takes getters over chart props. `layout`, `rootProps`, `polarOptions`, `options` slices become `computed`s on `chart.inputs`. Emitter symbol becomes a `const` created in setup. One place for root defaults. | getters + `computed` | Medium: the slices run one watch tick behind props today; some tests may rely on that delay. Watch for `compact` (panorama) charts and the `hasValidSize` gate (`generateCategoricalChart.tsx:228-230`). | `chartLayout.spec`, `chartContext.spec`, `chartContextSsr.spec`, `brushRangeOwnership.spec`, Nuxt SSR fixture (`pnpm verify`). |
| 2 | **Registries.** `createRegistry` for graphical items (cartesian + polar), cartesian axes, polar axes, reference elements, legend payloads, tooltip entries. Delete `SetGraphicalItem.ts`, `SetLegendPayload.ts`, `SetTooltipEntrySettings.tsx`, add/remove/replace functions and the 5 copies of the shallow-equal check. Register only domain-relevant item fields (P2-2). | `shallowReactive(Set<Ref>)` + `computed` | Medium-high: registration order and SSR. `YAxis` auto width (`chartCartesianAxis.ts:149-165`, A-B-A oscillation guard) must keep its history. | `chartFinalDomains.spec`, `chartSmallDomains.spec`, all chart specs, SSR fixture, motion lab `check:seen` (no recreated elements). |
| 3a | **Layout math.** container, offset (`selectChartOffsetInternal`), viewBox, legend area, brush dimensions -> `chart.offset`, `chart.viewBox`. Public `useOffset`, `usePlotArea`, `useChartWidth` read them. | chart-level `computed` | Low | `chartLayout.spec`, public hooks specs. |
| 3b | **Axis model, part 1:** settings, data-with-indexes, domain (incl. reference elements and error bars, stack groups). `chart.axis(type, id)` keyed model. | keyed `computed` in chart scope | High: biggest file, most Recharts edge cases (domains, `dataMin - n`, `allowDataOverflow`). | `axisSelectors`-dependent chart specs, `chartFinalDomains.spec`, docs prerender snapshots. |
| 3c | **Axis model, part 2:** scale, nice ticks, ticks, band size, polar axes. | same | High | Axis/tick specs, `CartesianAxis` / `PolarAngleAxis` specs, fineGrainedHover. |
| 3d | **Tooltip model.** Active index, payload, label, coordinate as `computed` on `chart.tooltip`; interaction state as refs; `v-model:active-index` binds a ref (remove the single listener slot, P3-3). | refs + `computed` | Medium: keyboard, sync, controlled index, `defaultIndex` (3 ticks). | `tooltipSelectors.spec`, Tooltip specs, `synchronizationLifecycle.spec`, `events-contract`. |
| 3e | **Cartesian series:** bar, line, area, scatter, funnel, error bar -> item-level `computed` in `useBar` etc. | item `computed` | Medium | Each item spec, fineGrainedHover, motion lab. |
| 3f | **Polar series:** pie, radar, radial bar. | item `computed` | Medium | `pieSelectors.spec`, polar specs. |
| 4 | **Delete the shell:** `reselect`, `state/createSelector.ts`, `RechartsRootState`, `chartState.ts`, the `view` facade, `useAppSelector`, `state/hooks.ts`, the 12 slice files. Move pure math to `core/`. Measure bundle size and recompute counts before/after (vision Phase 2 asks for it). | — | Low once 1-3 landed | `pnpm verify` (typecheck, build, size budgets, packed consumers, SSR fixture). |
| 5 | **Standalone charts:** replace `provideChartContext(cellChartOptions(...))` with a `TooltipSource` (`{ active, index, label, payload, coordinate }`) that `CellGridLayer`, Treemap, Sankey, Sunburst, Sparkline, Journey provide; `Tooltip` renders any `TooltipSource`. Extract the shared shell (P2-7). | small composable | Medium: Tooltip currently reads selectors that assume the cartesian model. | Cell chart specs, motion lab cell-chart scenarios. |
| 6 | **One chart-scoped key.** Fold render phase, series motion, gesture, in-view, clip-path id, portals and layer refs into `Chart` (or one `ChartRuntime` beside it). | fields on `Chart` | Low | Animation specs, `check:seen`. |

Order rationale: 0-2 remove the copies and give every later slice a stable model to build on;
3a-3f follow the dependency graph bottom-up (offset -> axis -> tooltip -> series), so each slice
only replaces selectors whose inputs are already `computed`s. Keep a temporary adapter
`selectX(state, ...)` only inside one slice, never across slices.

---

## 4. Code-quality findings

### P0

None found. Nothing blocks a release that the tests do not already cover.

### P1

1. **`Tooltip` ignores changes to `shared`.** `components/Tooltip.tsx:676` calls
   `useTooltipEventType(props.shared)`; `state/selectors/selectTooltipEventType.ts:34-35` closes
   over the primitive value, so the computed never sees a new `shared`. Fix: pass a getter
   (`() => props.shared`) or compute inline. Add one test that toggles `shared` and expects the
   tooltip to switch between axis and item mode. (Found by reading; not runtime-verified.)
2. **`isPanorama` is dead plumbing through the whole derivation layer.** Panorama renders a
   cloned *compact chart* (`cartesian/brush/components/Panorama.tsx:24-38`) whose setup provides
   its own context and resets panorama to `false` (`chart/generateCategoricalChart.tsx:158-160`,
   `context/PanoramaContextProvider.ts:6-8`). Every graphical item therefore sees `false`, yet
   the flag is threaded through 109 selector references and 17 `useIsPanorama()` calls, plus
   `selectChartDataWithIndexesIfNotInPanorama` (`state/selectors/dataSelectors.ts:38-43`),
   `useViewBox` (`context/chartLayoutContext.tsx:17-34`) and `SetLegendPayload.ts:13`.
   `PanoramaContextProvider` ignores its own `isPanorama` prop (`PanoramaContextProvider.ts:30-31`).
   Fix: delete the parameter and the panorama context (slice 0). It also removes one argument
   from most selector signatures before the bigger migration.
3. **The remaining store shape is the main maintainability cost** (section 2): 1,534 lines of
   slices + 5,810 lines of selectors + 189 `useAppSelector` calls + 25 reselect-related
   `@ts-ignore`s (`axisSelectors.ts:957,1196,1495,1737,1745`, `radarSelectors.ts:64,82,220`,
   `polarSelectors.ts:49,74,84,165`, `polarScaleSelectors.ts:61,81,97,103`,
   `tooltipSelectors.ts:508,514`, `pieSelectors.ts:268`, `radialBarSelectors.ts:485`, ...).
   Fix: section 3.

### P2

1. **Props are copied into state with `watch` instead of being read.** `ReportMainChartProps.ts:35-41`,
   `ReportChartProps.tsx:47-57`, `ReportPolarOptions.tsx:18-31`,
   `ChartDataContextProvider.ts:22-25`, `Legend.tsx:186-194`, `Tooltip.tsx:664-671`,
   `useBrushSetting.ts:12,25`. Each creates a second authority one tick behind the props. Also
   `ReportMainChartProps.ts:34` keeps a dead `const isPanorama = false`. Fix: slice 1 and 2.
2. **Every prop change of a series invalidates every axis domain.** `useSetupGraphicalItem.ts:45-53`
   spreads all props (`fill`, `stroke`, animation options, slots) into the registered settings.
   `replaceCartesianGraphicalItem` (`chartGraphicalItems.ts:140-151`) then sees a change and
   replaces the item, which recomputes domains, stacks and ticks for a color change. Fix:
   register only the fields that domains and stacking read (dataKey, data, stackId, hide, axis
   ids, type, barSize, minPointSize, errorBars). Also `props: AreaProps | any` (line 26) and
   `fn: getTooltipEntrySettings as any` (line 57) remove all type checking from this hot path.
3. **Deep watch of user data in several places.** `hooks/useTrackedData.ts:7-9` uses
   `{ deep: true }` and copies the array; it runs for the chart root and for each of 12 other
   callers (Pie, Funnel, every standalone chart, every series via `useSetupGraphicalItem.ts:27`).
   Cost is O(rows × fields) per change per subscriber. The vision lists "decide and implement
   reactive data" as open. Fix: decide once. Recommendation: track mutation at one place (the
   chart root, or the item that owns `data`), and document that row objects are compared by
   identity.
4. **Five copies of the same shallow-equal check.** `chartGraphicalItems.ts:142-145,166-169`,
   `chartCartesianAxis.ts:101-104,119-122,137-140`. Fix: removed by registries (slice 2).
5. **Root option defaults in three places that disagree.** `generateCategoricalChart.tsx:33-40`
   (`barGap: [Number, String]`), `ReportChartProps.tsx:18-21` (`barGap: Number`, so a string gap
   triggers a Vue prop warning), `chartRootProps.ts:27-37`. Fix: slice 1 (one source).
6. **Three `createContext` helpers.** `utils/createContext.ts:10` (used by 9 contexts; its JSDoc
   documents a `providerComponentName` parameter that no longer exists, lines 3-8),
   `utils/context.ts` (unused copy), and motion-v's `createContext` used for unrelated DI in
   `cartesian/bar/hooks/useBar.ts:4` and `cartesian/error-bar/ErrorBarContext.ts:3`. Fix: delete
   `utils/context.ts`; use one helper (or plain `InjectionKey` + `inject`); do not depend on the
   animation library for DI.
7. **Standalone chart shells are copy-pasted.** The same `ChartsWrapper` line and the same five
   emit forwarders appear in `Tracker.tsx:112-131`, `Heatmap.tsx:194-221`,
   `CalendarHeatmap.tsx:182-209`, `Sparkline.tsx:336-345`, `JourneySankey.tsx:505-516`; the same
   `useResponsiveSize(reactive({...}))` block in five files (`Tracker.tsx:60`, `Heatmap.tsx:116`,
   `CalendarHeatmap.tsx:104`, `Sparkline.tsx:327`, `JourneySankey.tsx:495`). `Sankey.tsx:438` and
   `Treemap.tsx:507` forward 8 and 5 events one by one through an Inner/Outer split. Fix: one
   `CellChartShell` component (or `useStandaloneChart()` returning size + wrapper props) and
   forward events with a single `emit` passed via context or `v-bind="$attrs"`.
8. **Standalone charts create the full cartesian state for a tooltip.** Each of the 8 calls to
   `provideChartContext(...)` in `chart/*.tsx` builds 12 slices, then uses only `tooltip` and
   `options`. `CellGridLayer.tsx:300-320` builds a Recharts `TooltipPayloadConfiguration` with
   ten `undefined` fields to describe "the active cell". Fix: slice 5 (`TooltipSource`).
9. **Layer violations and cycles.** Three runtime import cycles (own Tarjan scan, type-only
   imports excluded):
   `state/hooks.ts` ↔ `state/selectors/tooltipSelectors.ts` ↔ `selectTooltipEventType.ts`
   (Vue hooks inside selector modules: `selectTooltipEventType.ts:34`, `selectors.ts:31`);
   `cartesian/axis/YAxis.tsx:11` imports from the barrel `@/cartesian`;
   `utils/cartesian.ts:4` ↔ `utils/tick.ts:4`. Also `utils/VueUtils.ts:1-2` and `utils/grid.ts:1`
   import SVG attribute tables from `cartesian/cartesian-grid/const.ts`, whose
   `CartesianAxisDefaultProps` is typed `Partial<CartesianGridProps>` (misnamed). Fix: move hooks
   out of `state/selectors`, import `CartesianAxis` directly, move SVG key tables to `utils/svg.ts`,
   rename the grid defaults.
10. **Dead code** (verified with a repo-wide grep; public exports through `export *` excluded):
    files `container/RootSurface.tsx` (110), `cartesian/cartesian-axis/use-axis-line.tsx` (43),
    `state/ReportBar.tsx` (13), `utils/context.ts` (56); exports
    `computeLegendPayloadFromBarData` (`cartesian/bar/utils.ts:17`), `fromMainValueToError`
    (`axisSelectors.ts:427`), `selectErrorBarsSettings` (`axisSelectors.ts:1243`),
    `selectPieSectors` (`pieSelectors.ts:265`), `mergePropAttrs` (`utils/attrs.ts:195`),
    `calculateHorizontalPoints` / `calculateVerticalPoints` (`utils/grid.ts:97,142`),
    `createPropsWithDefaults` (`utils/props.ts:36`); state `countOfBars`
    (`chartGraphicalItems.ts:100,122-128`), `computedData` (`chartData.ts:33`); test-only exports
    `selectAllVisibleBars`, `selectActiveTooltipPayload`, `selectCartesianItemsSettings`,
    `offsetSign`, `offsetPositive`. 178 exports are used only in their own file (drop `export`
    when touched, not as a separate pass).
11. **`motion-dom` is a runtime dependency but only types are imported.** All imports from
    `motion-dom` are `import type`; runtime code imports `motion-v`. `package.json` pins
    `motion-dom ^13.3.0` while the peer range is `motion-v ^2.4.0`; a consumer on an older
    motion-v can get a second motion-dom copy. Fix: import the types from `motion-v` (or make
    `motion-dom` a dev dependency) and align the peer range with the motion-v version tested.
12. **`any` and casts.** 362 `any` occurrences in production code, 38 `as any`. Hot spots:
    `utils/scale/utils/utils.ts` (14), `utils/chart.ts` (13), `chart/Treemap.tsx` (13),
    `radialBarSelectors.ts`, `radarSelectors.ts`, `pieSelectors.ts` (11 each).
    `generateCategoricalChart.tsx:135` (`tooltipPayloadSearcher?: any`), `:216-217`
    (`Record<string, any>`), `:268` (`{...props as any}`). Most selector `any`s disappear with
    reselect; fix the rest when touching the file.
13. **Internal tooltip index is a string, public index a number.** `chartTooltip.ts:35-36`.
    Conversions in `Tooltip.tsx:657-661`, `chartTooltip.ts:264-266` (`Number(index)`, which is
    `NaN` for path indexes like Treemap's), `chartOptions.ts:30-37`, `CellGridLayer.tsx:339-343`.
    The string exists for lodash-path lookups in Treemap/Sankey/Sunburst
    (`Treemap.tsx:71`, `Sankey.tsx:60`). Fix in slice 3d: numeric index for cartesian/polar, an
    explicit key type for hierarchical charts.

### P3

1. **Synchronisation lives in two folders.** Send: `synchronisation/useChartSynchronisation.tsx`;
   receive: `events/useChartSynchronisation.tsx`; plus a 6-line `synchronisation/syncSelectors.ts`.
   Merge into one `sync/` module. The emitter identity (`chartOptions.ts:50-53`, created on
   mount) can be a `Symbol()` created in setup.
2. **`useChartInteractions` reads the whole state view** (`events/useChartInteractions.ts:15`,
   `useAppSelector(state => state)`) and calls selectors imperatively. Fine for handlers, but
   after slice 3 read `chart.tooltip` and `chart.axis(...)` directly.
3. **Single listener slot for `update:activeIndex`** (`chartTooltip.ts:258-262`): a second
   `<Tooltip>` replaces the first one's listener. Removed by binding a ref (slice 3d).
4. **Two Surface components.** `chart/Surface.vue` (named `ChartsSurface`, provides layer refs)
   and `container/Surface.tsx` (public). Rename the internal one (`ChartSurface`) or merge.
5. **`Global.isSsr` is a mutable public singleton** (`utils/Global.ts:11-29`) used as a default
   parameter (`utils/attrs.ts:49`, `cartesian/utils/get-ticks.ts:141`). Other code already reads
   `ssrContextKey` (`hooks/deferredView.ts:15`, `animation/renderPhase.ts`). Prefer one way.
6. **Type tests inside `src/types`** (`types/events.vue`, `slots.vue`, `typed.vue`). They are
   not imported by the build, but they read as library code. Move them to `src/test/types/`.
7. **Stale docs for agents.** `CLAUDE.md:63,81` still describe an `Animate` wrapper; the
   global copy in `fork_vue-charts/CLAUDE.md` still describes Redux, `createListenerMiddleware`,
   `useIsAnimating` chase pattern and the `vcharts-` prefix. Update after slice 4.

### God files: 15 largest production files

| Lines | File | Justified? |
|---|---|---|
| 1,784 | `state/selectors/axisSelectors.ts` | No. 50 selectors + 22 combiners, cartesian and polar. Split during slices 3b/3c: `core/axis/{settings,domain,scale,ticks}.ts`. |
| 844 | `components/Tooltip.tsx` | No. Four components (`DefaultTooltipContent` :150, `TooltipBoundingBox` :237, `Cursor` :422, `Tooltip` :642) and slot types. Split into files. |
| 685 | `utils/chart.ts` | Partly. Recharts `ChartUtils` parity; 24 unrelated exports (ticks, stacking, tooltip position, polar range). Split by topic when moved to `core/`. |
| 581 | `state/selectors/radialBarSelectors.ts` | No. Repeats bar sizing logic from `barSelectors.ts` (bar size list, positions) for polar. Share the combiners. |
| 539 | `chart/JourneySankey.tsx` | Mostly. Feature component; layout already in `journeyUtils.ts`. Shell duplication (P2-7). |
| 536 | `chart/CellGridLayer.tsx` | Mostly. Shared cell renderer + keyboard; the exported helpers (`cellChartOptions`, `boxAttrs`, `rootAttrs`, emits, props) belong in a shell module. |
| 533 | `state/selectors/tooltipSelectors.ts` | No. 40 selectors; becomes `chart.tooltip` in slice 3d. |
| 518 | `chart/Treemap.tsx` | Partly. Inner/Outer split exists only to forward events (P2-7). |
| 473 | `state/selectors/barSelectors.ts` | Yes for the math; wiring goes away. |
| 450 | `chart/Sankey.tsx` | Partly, same as Treemap. |
| 397 | `animation/useKeyedTransition.ts` | Yes. One shared primitive used by 12 consumers. |
| 391 | `components/label/utils.tsx` | Yes (label positioning math, ported). |
| 389 | `state/chartTooltip.ts` | Yes for now: 60% types and docs; operations shrink in slice 3d. |
| 364 | `chart/Sparkline.tsx` | Mostly; shell duplication. |
| 356 | `cartesian/cartesian-grid/const.ts` | No. Not grid constants: SVG attribute key tables used by `utils/VueUtils.ts`. Move to `utils/svg.ts`. |

---

## 5. Vue-native and Nuxt gaps

| Topic | State | Gap / fix |
|---|---|---|
| SSR safety | Chart state is created per chart in `setup` (`provideChartContext`), IDs use `useId()` (`hooks/useChartId.ts`), geometry is deferred so all siblings register first (`hooks/deferredView.ts`). Module-level state is limited to caches (`utils/attrs.ts:9` text size, bounded at 20,000; `shape/Symbols.tsx:79` path cache) and the sync channel (`utils/events.ts:37`), which only fires from client handlers. | Good. Keep the `useDeferredView` contract when introducing registries. The registry design removes the comment-level workaround "Sync watches stay active during SSR" (`SetGraphicalItem.ts:16-17`). |
| Effect scopes | Watchers and computeds live in component scopes. | Keyed chart models (slice 3b) must be created with the chart's `EffectScope` (`scope.run`), not the first child's. Use `onScopeDispose` in `register` instead of `onUnmounted` (`SetLegendPayload.ts:22`, `SetGraphicalItem.ts:31`) so composables also work outside components. |
| provide/inject typing | `InjectionKey` used everywhere (`chartContext.ts:34`, `renderPhase.ts:5-9`, `createContext.ts:15`). | ~15 chart-scoped keys; fold into one `Chart` (slice 6). `useChartContext` throws a clear error; keep that. |
| `defineComponent` + TSX | 189 `defineComponent`s; runtime props objects plus `VuePropsToType`; slot typing via `SlotsType` (25 files) and the `$slots` cast (30 files). | Consistent with `CLAUDE.md`. Gap: render-null components used as effects (`ReportMainChartProps`, `ReportChartProps`, `ReportPolarOptions`, `ChartDataContextProvider`) are React idioms; in Vue these are composable calls in `setup` (slice 1). |
| Watch vs computed | 63 watchers in production code. Many copy props into state (P2-1). | After slices 1-2 most remaining watchers should be DOM/animation side effects only. |
| Deep reactivity | `useTrackedData` deep watch (P2-3); `Legend.tsx:186` deep watch on `hidden`. | Decide the data-mutation contract once. `hidden` is an array of keys; a shallow watch plus `v-model` replacement semantics is enough. |
| toRaw / markRaw | 9 `toRaw` calls, all before D3 or identity-memoized math (`useTrackedData.ts:8`, `scatterSelectors.ts:106`, `sankeyUtils.ts`, `Treemap.tsx`). No `markRaw`. | Fine. Once data is stored in `shallowRef`s only, most `toRaw` calls can go. |
| Nuxt module | `src/nuxt.ts`, `src/resolver.ts`, peer `@nuxt/kit`. | Not reviewed in depth. `@nuxt/kit` and `unplugin-vue-components` are non-optional peers; consider `peerDependenciesMeta.optional` for plain Vue users. |

---

## Method and limits

- Read: `internals/vision.md`, `CLAUDE.md`, `state/**`, `chart/generateCategoricalChart.tsx`,
  `chart/Tracker.tsx`, `chart/CellGridLayer.tsx` (parts), `components/Tooltip.tsx` (parts),
  `hooks/*`, `events/*`, `synchronisation/*`, `context/*`, `animation/renderPhase.ts`,
  `cartesian/bar/hooks/useBar.ts`, `cartesian/brush/components/Panorama.tsx`; skimmed others.
- Measured with scripts in the session scratchpad: import-cycle scan (Tarjan over runtime
  imports; madge was not installed and needed network), unused-export scan (name-based grep,
  so false negatives are possible for names reused elsewhere), line and pattern counts.
- Tests: `npx vitest run` twice (results in section 0). No dev servers started. No repository
  files changed; this report is in the git-ignored `.evidence/` folder.
