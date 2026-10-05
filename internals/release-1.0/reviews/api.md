# vccs public API review (pre-1.0)

Branch `feat/cell-grid-main` @ `72c8765`, clean tree. Method: `design-apis` review rubric
(consumer task first, evidence per finding, P0–P3 by consumer impact).

Evidence gathered:
- Export list: TypeScript compiler API over `packages/vue/src/index.ts` (227 names).
- Runtime contract: `pnpm --filter vccs build` (exit 0, 4m20s), then imported `dist/es/index.mjs`
  in Node and dumped every component's `props`, defaults, `emits` and `inheritAttrs`.
- Type experience: a consumer probe SFC compiled with `vue-tsc` against `dist/index.d.ts`
  (strict, `strictTemplates` off and on). Results are quoted where used.
- Source, docs (`docs/content`), playground, `internals/vision.md`, the 1.0 migration page.

No P0 (no security or data-loss surface: this is a rendering library).

---

## 1. Public surface inventory

`vccs` (`index.ts`) exports **227 names: 110 runtime values, 117 types.**

| Kind | Count | Names |
|---|---|---|
| Chart containers | 19 | AreaChart, BarChart, LineChart, ComposedChart, PieChart, RadarChart, RadialBarChart, ScatterChart, FunnelChart, Treemap, Sankey, SunburstChart, Tracker, Heatmap, CohortChart, CalendarHeatmap, JourneySankey, BarList, Sparkline |
| Series / items | 9 | Area, Bar, Line, Scatter, Funnel, Pie, Radar, RadialBar, ErrorBar |
| Axes, grids, references | 13 | XAxis, YAxis, ZAxis, CartesianAxis, CartesianGrid, PolarAngleAxis, PolarRadiusAxis, PolarGrid, ReferenceLine, ReferenceArea, ReferenceDot, Brush, ResponsiveContainer |
| Overlays / helpers | 7 | Tooltip, Legend, Label, LabelList, Text, Cell, Customized |
| Shapes | 8 | Cross, Curve, Dot, Polygon, Rectangle, Sector, Symbols, Trapezoid |
| **Components total** | **56** | identical to `componentNames.ts` (Nuxt module + resolver) |
| Runtime prop objects `*VueProps` | 14 | BarList, CalendarHeatmap, CohortChart, Curve, ErrorBar, Funnel, Heatmap, JourneySankey, Pie, Sankey, Sparkline, SunburstChart, Tracker, Treemap |
| Composables (intended public) | 22 | useChartWidth/Height, useMargin, useOffset, usePlotArea, useIsTooltipActive, useActiveTooltipCoordinate/Label/DataPoints, useX/YAxisDomain, useX/YAxisTicks, useX/YAxisScale, useX/YAxisInverseScale, useX/YAxisInverseDataSnapScale, useX/YAxisInverseTickSnapScale, useCartesianScale |
| Composables / context (internal leak) | 9 | **LineContextKey, provideLineContext, useLineContext, useLine, createErrorBarRegistry, provideErrorBarContext, provideErrorBarRegistry, useErrorBarContext, useErrorBarRegistry** |
| Utilities | 9 | defineChartComponents, chartThemeTokens, **Global, getPath, rectanglePath, getUniqPayload, sankeyPayloadSearcher, treemapPayloadSearcher, sunburstPayloadSearcher** |
| Types | 117 | props (partial), slot props, item/payload, model values, typed helpers |

Subpath entries: `vccs/nuxt` (default Nuxt module, options `prefix`, `components`),
`vccs/resolver` (`VccsResolver({ prefix })`). `typed.ts` is re-exported from the root; it has no own subpath.

### Exports that look internal or accidental (bold above)

| Export | Why it is internal | Source |
|---|---|---|
| `LineContextKey`, `provideLineContext`, `useLineContext`, `useLine`, type `LineContext`, `LinePropsInternal` | Line's private provide/inject plumbing; `export *` from `cartesian/line` | `cartesian/line/hooks/useLine.ts` |
| 5 ErrorBar context functions + `ErrorBarContextType`, `ErrorBarRegistryType`, `ErrorBarDataPointFormatter`, `ErrorBarDataItem` | Registry between Bar/Scatter and ErrorBar | `cartesian/error-bar/ErrorBarContext.ts` |
| `sankeyPayloadSearcher`, `treemapPayloadSearcher`, `sunburstPayloadSearcher` | Tooltip-store adapters passed to the chart factory | `chart/Sankey.tsx`, `Treemap.tsx`, `SunburstChart.tsx` |
| `getUniqPayload`, `UniqueOption`, `ContentType` | Tooltip internals; `ContentType` is `any` | `components/Tooltip.tsx:45,117,119` |
| `Global`, `GlobalConfig`, `GlobalConfigKeys` | Recharts' mutable module-level `isSsr` flag. Module state is shared across SSR requests; making it public freezes that design | `utils/Global.ts` |
| `getPath`, `rectanglePath` | Path builders for the shapes | `shape/Curve.tsx`, `shape/Rectangle.tsx` |
| 14 `*VueProps` runtime objects | Vue prop-definition objects. Only some charts export them. Consumers need prop *types*; these objects make every default part of the contract | various |
| `NormalizedStackId`, `CurvePropsWithOutSVG`, `FunnelComposedData`, `FormattedGraphicalItem` | Internal shapes | `shape/types.ts`, `shape/Curve.tsx`, `cartesian/funnel/type.ts`, `components/Customized.tsx` |
| `useOffset` vs `usePlotArea` | Same data in two shapes (`{left,top,width,height}` vs `{x,y,width,height}`) | `hooks/publicHooks.ts` |

### Missing exports (public concepts with no exported name)

- **Props types for ~35 components.** Not exported: `BarProps`, `XAxisProps`, `YAxisProps`, `TooltipProps`, `ScatterProps`, `RadarProps`, `RadialBarProps`, `ReferenceLine/Area Props`, `LabelProps`, `LabelListProps`, `CartesianGridProps`, every chart-container props type (`CategoricalChartProps`) and every standalone-chart props type (`TrackerProps`, `HeatmapProps`, …). `docs/content/2.guides/14.typescript.md` says "the props and slot props of every component" are exported. That is not true.
- `TooltipPayloadEntry` / `TooltipPayload`. These are the `#content` slot's payload types and are needed to type a reusable tooltip component. Only the `Typed*` variants are exported.

---

## 2. Consistency audit

Data comes from the runtime prop/emit dump of `dist`. ✗ = inconsistency, ✓ = consistent.

### 2a. Data, keys, formatting

| Chart | data shape | key props | key type | formatter props |
|---|---|---|---|---|
| Categorical (Bar/Line/Area/Composed/Scatter/Pie/Radar/RadialBar/Funnel) | `data: ChartData` on chart, optional on item | `dataKey` on items/axes, `nameKey` on Pie/Funnel | `string \| number \| (row)=>any` | `tickFormatter` (axes), `formatter` (Tooltip/Legend/Label) |
| Treemap / Sunburst | tree object/array | `dataKey`, `nameKey` | DataKey (fn allowed) | none |
| Sankey | `{nodes, links}` | `dataKey`, `nameKey` | DataKey | none |
| Tracker | rows | `dataKey`(status), `nameKey`(date) | **string only** ✗ | `labels` map |
| Heatmap | rows | `xKey`, `yKey`, `dataKey` | string only ✗ | `valueFormat`, `xLabelFormat`, `yLabelFormat` ✗ |
| CohortChart | rows | `cohortKey`, `valuesKey` | string only ✗ | `periodLabel` ✗ |
| CalendarHeatmap | rows | `dateKey`, `dataKey` | string only ✗ | none |
| BarList | rows | `nameKey`, `dataKey`, `hrefKey` | string only ✗ | `valueFormat` |
| Sparkline | numbers or rows | `dataKey`, `nameKey` | string only ✗ | none |
| JourneySankey | rows | `pathKey`, `dataKey` | string only ✗ | `formatSubtitle`, `nodeHref` ✗ |

✗ Formatter naming uses four patterns: `*Formatter` (Recharts), `*Format`, `*Label`, `format*`. Pick one: `*Formatter`, to match Recharts and the existing axes.
✗ Standalone charts accept only string keys. Recharts-ported items also accept accessor functions.
✓ `*Key` suffix for field names is used everywhere.

### 2b. Events

| Component | Events | Payload |
|---|---|---|
| All 19 charts | `click … touchend` (11) | `(state: ChartPointerState, event)` ✓ |
| 8 series | `click`, `mouseenter`, `mouseleave` | `(entry, index, event)` ✓ |
| Series, Treemap, Sankey, Sunburst, cell charts, BarList, Sparkline, JourneySankey | `animation-start`, `animation-end` | none ✓ (kebab everywhere) |
| Treemap | `node-click/-mouseenter/-mouseleave` | `(node, index, event)` ✓ |
| Sankey | `node-*`, `link-*` | `(entry, index, event)` ✓ |
| JourneySankey | `node-click`, `link-click` | `(node, event)`: **no index, no hover events** ✗ |
| Tracker/Heatmap/Cohort/Calendar | `cell-click/-mouseenter/-mouseleave` | `(payload: unknown, index, event)`: **untyped** ✗ |
| BarList | `row-click` | `(row, index, event)` ✓ |
| SunburstChart | **no item events** ✗ (Treemap has them) | – |
| Legend | `click`, `mouseenter`, `mouseleave`, `bbox-update`, `update:hidden` | `(entry, index, event)` ✓ |
| Brush | `change`, `drag-end`, `update:startIndex`, `update:endIndex` | `{startIndex,endIndex}` ✓ |
| ResponsiveContainer | **`onResize` callback prop, not an emit** ✗ | `container/ResponsiveContainer.vue:33` |

✓ No React-style `on*` props remain on charts or series. The 1.0 migration already covers this.
✗ `SunburstInner` declares `emits: ['animationStart','animationEnd']` (`SunburstChart.tsx:81`) while every other component uses kebab case. It works only because Vue normalizes the names.

### 2c. v-model / controlled state

| State | Where | Model | Type |
|---|---|---|---|
| Tooltip active point | Tooltip | `v-model:active-index` ✓ | `number \| null` |
| Sparkline active point | Sparkline | `v-model:active-index` ✓ | `number \| null` |
| Cell-chart active cell | Tracker/Heatmap/Cohort/Calendar | **none**: `CellGridLayer` emits `update:activeIndex` internally, but the charts drop it ✗ | – |
| Pie active sector | Pie | `active-index` one-way, **`-1` sentinel**, no update event ✗ | `number` |
| Bar active bar | Bar | `active-index` one-way, no update event ✗ | `number` |
| Line/Area | `activeIndex`, `activePoint` props leak; no model ✗ | – |
| Hidden series | Legend | `v-model:hidden` ✓ | `string[]` |
| Brush range | Brush | `v-model:start-index` + `v-model:end-index` (two models, two emits per drag) ✗ | `number` each |
| Journey pin | JourneySankey | `v-model:pinned` ✓ | `string[] \| null` |
| Tooltip `defaultIndex` | Tooltip | `number \| string` while `activeIndex` is `number` ✗ | – |

Today "active index" means 4 different things. Recommendation: one rule. Every interactive chart or item that has an active element exposes `v-model:active-index` (`number | null`, `null` = none) and works uncontrolled when not bound. Remove the `-1` sentinel and the one-way `activeIndex` props on Bar/Pie/Line/Area.

### 2d. Animation

| Component | `isAnimationActive` | `transition` type |
|---|---|---|
| Series, Treemap, Sankey, Sunburst, cell charts, BarList, Sparkline, Journey | `Boolean = true` ✓ | `ChartTransition` (= `ValueAnimationTransition<number>`) ✓ |
| Tooltip | `Boolean = true` | **`AnimationOptions`** ✗ (`components/Tooltip.tsx:572`) |
| Legacy `animationBegin/Duration/Easing` | removed everywhere ✓ | – |

✓ Legacy Recharts timing props are gone. One `transition` prop family exists.
✗ Animation is set per series. To still a whole chart you must set it on every child. A chart-level `:transition` / `:is-animation-active` default (provided down to the items) is missing.

### 2e. Sizing

| Group | Props | Notes |
|---|---|---|
| All 19 charts | `width`, `height`, `aspect`, `initialDimension` ✓ | Built-in responsive. Same `useResponsiveSize` ✓ |
| Tracker | default height 32 | sensible ✓ |
| BarList | **no size props** | height comes from `rowHeight` × rows; OK, but undocumented in the table |
| SunburstChart | `SunburstChartVueProps.width/height` are `required: true` (`SunburstChart.tsx:61`); the component overrides them to optional | exported object is wrong ✗ |
| Treemap | `aspectRatio` (tile ratio) next to `aspect` (box ratio) | name clash ✗ |
| ResponsiveContainer | `width="100%"` strings, `minWidth`, `debounce`, `onResize` | redundant with built-in responsive (docs say "new code does not need it") |
| Categorical charts | `margin` default is a shared object (`default: () => defaultMargin`) | minor mutation risk |

### 2f. Color and theming

| Item | Default fill/stroke | Token fallback |
|---|---|---|
| Line, Area, Sunburst | `var(--v-charts-series, #3182bd)` | |
| Pie, Funnel, Radar, RadialBar, Treemap | `var(--v-charts-series, #808080)` | ✗ |
| Sankey | `var(--v-charts-series, #0088fe)` | ✗ |
| Heatmap, Cohort, BarList, Sparkline, Journey | `var(--v-charts-series, #2563eb)` | ✗ |
| CalendarHeatmap | `var(--v-charts-series, #16a34a)` | ✗ |
| Bar, Scatter | **no default** (`fill: undefined`, so SVG black) | ✗ |
| Treemap tiles | hardcoded hex `DEFAULT_COLORS` (`Treemap.tsx:23`), prop `colorPanel` | ✗ not tokenized; Recharts name |
| ErrorBar stroke | `var(--v-charts-axis, black)`; other axis tokens fall back to `#666` | ✗ |

✓ All structural colors (grid, axis, text, cursor, tooltip, focus) are tokens. 16 tokens are listed in `chartThemeTokens`.
✗ **One series token for all series.** Two `<Line>`s without `stroke` look identical. shadcn's convention is `--chart-1..5`. Recommendation: `--v-charts-series-1..N`, assigned by registration order, with `--v-charts-series` as the fallback for N.
✗ Color prop names: `fill`/`stroke` (ported), `color`/`emptyColor`/`colors` (standalone), `nodeFill`/`linkFill` (Sankey), `colorPanel` (Treemap). `colors` is `Record<status,string>` on Tracker but `string[]` on Heatmap/Calendar.
✗ No `data-slot` attributes. The vision's "style by slot" is not implemented. Only `v-charts-*` classes exist (the prefix is now unified ✓). DOM still carries `data-recharts-item-index` (`utils/const.ts:6,29`).

### 2g. Accessibility

| Group | Props | Root semantics |
|---|---|---|
| Categorical charts | `accessibilityLayer=true`, `title`, `desc`, `role`, `tabIndex` | `role="application"` + live region ✓ |
| Cell charts | `ariaLabel` with default text ("Heatmap", …) | `listbox`/`option`, arrow keys ✓ |
| BarList, JourneySankey | `ariaLabel` default `undefined` | ✗ unnamed by default |
| Sparkline | `ariaLabel="Trend"` | ✓ |
| Brush | `ariaLabel` | ✓ |
| **Treemap, Sankey, SunburstChart** | **none**. `inheritAttrs:false` and `attrs` are never forwarded, so `class`, `style`, `aria-label` and `data-*` on these charts are **silently dropped** ✗ | `Treemap.tsx:484-487`, `Sankey.tsx:423-426`, `SunburstChart.tsx:258-261` |

✗ Two naming schemes: `title`/`desc` (categorical) vs `ariaLabel` (standalone).
✗ Default accessible name is `${chartName} chart`, giving **"BarChart chart"** (`generateCategoricalChart.tsx:234`).

### 2h. Slots

| Component | Slots | Slot-props notes |
|---|---|---|
| Bar | `shape`, `activeBar`, `label`, `default` | `payload: any` ✗ |
| Line | `shape`, `dot`, `activeDot`, `label`, `default` | dot props are an inline literal |
| Area | `dot`, `activeDot`, `label` | **no `shape`** ✗ |
| Scatter | `shape`, `default` | |
| Pie | `shape`, `activeShape`, `label`, `default` | `activeShape` vs Bar's `activeBar` ✗ |
| Radar | **no typed slots, none rendered** (dot/activeDot/label only as boolean/object props) ✗ | `polar/radar/Radar.tsx:311` |
| RadialBar | `default` only (no `shape`/`label` slot) ✗ | |
| Funnel | `shape`, `default` | no `index`/`isActive` in props ✗ |
| XAxis/YAxis/PolarAngle/PolarRadius | `tick` ✓ | |
| CartesianGrid | `horizontal`, `vertical`: **rendered but untyped** (no `$slots` declaration) ✗ | |
| Tooltip | `content`, `cursor`, `default` (also content) | plus a `content` *prop* ✗ |
| Legend | `content` (**declared required**, returns `VNode`) ✗ | `components/legend/type.ts:9` |
| Label | `content` (required, `VNode`) ✗ | `components/label/types.ts:119` |
| Treemap / Sunburst | `content` | Sankey uses `node`/`link`; cell charts use `cell` ✗ |
| Cell charts | `cell`, `default` | `CohortChart` reuses `CellGridSlots<HeatmapCell>` |
| BarList | `name`, `value`; **no `default`** (no Tooltip/overlay) | |
| JourneySankey | `header`, `label`, `default` | |

Return types vary between `VNodeChild`, `VNode`, `VNode[]` and `any`. Standardize on `VNodeChild`.

---

## 3. Recharts parity vs Vue idioms

**Stance:** Recharts parity for *concepts, names of concepts and math* (dataKey, XAxis, stackId, syncId, domain/ticks, `*Formatter`). Vue idioms win for *how you customize, observe and control* (slots, emits, v-model, typed generics, classes/tokens). Migration docs map Recharts props to the Vue form. Do not keep two ways to do the same thing.

| React pattern still in the API | Where | Vue form |
|---|---|---|
| Render prop `content` next to the `#content` slot | Tooltip `content` prop (`Tooltip.tsx:557`, type `any`); Tooltip also treats `default` as content | Slot only. Remove the prop |
| Children-as-config `<Cell v-for … :fill>` (reads VNodes, renders nothing) | `components/Cell.tsx` | Keep for porting. Add an item prop `:fill="(entry, i) => …"` or a `#shape` slot as the documented way |
| `Customized` escape hatch | `components/Customized.tsx` | Public composables (already present) + the chart `default` slot. Deprecate `Customized` |
| Callback prop `onResize` | `ResponsiveContainer.vue:33` | `@resize` emit, or remove the component (built-in responsive) |
| Inline style objects `contentStyle`, `itemStyle`, `labelStyle`, `wrapperStyle` | Tooltip, Legend | Keep for parity. Document `class` + tokens + `data-slot` as the main path |
| `portal: HTMLElement` | Tooltip, Legend | Vue name `to` (string selector or element), as with `<Teleport to>` |
| Config-bag props `dot`, `activeDot`, `label`, `background`, `activeBar`, `tick`, `axisLine` typed `boolean \| Record<string, any>` | all series/axes | Keep boolean toggles. Type the object form (`DotProps`, `LabelProps`, …). Custom rendering goes through slots |
| One-way `activeIndex` props, `-1` sentinel | Bar, Pie, Line, Area | `v-model:active-index` (see 2c) |
| Global mutable config | `Global.set('isSsr')` | Remove from public API. SSR is already handled by render phase / `useId` |
| `colorPanel` | Treemap | `colors` |
| Positional event args `(entry, index, event)` | all item events | Keep. It is consistent and typed; changing it would be churn |

Where Vue already wins and should be the documented default: built-in responsive charts, `v-model` on Tooltip/Legend/Brush/Sparkline/JourneySankey, typed emits, named slots, CSS-variable tokens, `vccs/nuxt` + resolver.

---

## 4. TypeScript experience

Probe: `scratchpad/probe/probe.vue`, compiled with `vue-tsc` against the rebuilt `dist`.

| Check | Result |
|---|---|
| `<Bar data-key="tablet">` with rows lacking `tablet` (plain import) | **accepted**. Typed keys need `defineChartComponents<Row>()` |
| `defineChartComponents<Row>()` coverage | 33 Recharts components. **No standalone chart** (Tracker, Heatmap, Cohort, Calendar, BarList, Sparkline, JourneySankey) and no CartesianGrid/ErrorBar/Reference* ✗ |
| Bar `@click` → `entry.payload` | **`any`** (probe error: "Argument of type 'any'…") |
| Bar `#shape="{ payload }"` | **`any`** |
| Tooltip `#content` → `payload[0].payload` | **`any`**. `payload[0].foo` is correctly rejected ✓ |
| Tracker `@cell-click="(p) => …"` | `p: unknown`, not the row type ✗ |
| Tracker `#cell` → `cell.payload` | `Record<string, any>` (`TrackerRow`) ✗ |
| `<Heatmap x-key="nope">` | accepted (`string`) ✗ |
| `<XAxis :angle="-45" :tick="false">` | **type error under `strictTemplates`**: `angle`, `tick`, `label`, `stroke`, `name`, `tickSize` are not declared on the outer XAxis/YAxis (they pass as attrs). Docs use `:tick` |
| `<XAxis orientation="sideways" type="whatever">` | accepted. `orientation`, `type`, `padding`, `scale` are typed `string`/`Record<string,any>`/`Function` (`cartesian/axis/XAxis.tsx:144-230`) ✗ |
| `<Line :points="[]" layout="vertical" :animation-id="…">`, `<Legend :chart-width>` | accepted: internal props are public (`points`, `path`, `baseLine`, `layout`, `left/top/width/height`, `animationId`, `activePoint`, `needClip` on Line/Area; `needClip`, `id` on Bar; `chartWidth/chartHeight/margin` on Legend) ✗ |
| Nullability in emitted `.d.ts` | **wrong.** `packages/vue/tsconfig.json` has `"strict": false`, so declarations drop `\| undefined`. Example: source `selectActiveTooltipCoordinate: … => Coordinate \| undefined` (`state/selectors/tooltipSelectors.ts:502`) is emitted as `useActiveTooltipCoordinate(): ComputedRef<Coordinate>` (`dist/hooks/publicHooks.d.ts`). Same for `useActiveTooltipLabel`, `useXAxisScale`, … Strict consumers skip null checks and crash at runtime ✗ |
| `any` in shipped declarations | 1,458 occurrences across `dist/**/*.d.ts`; 88 public-folder files. Public hot spots: `payload: any` on every item type (`BarRectangleItem`, `LinePointItem`, `AreaPointItem`, `ScatterPointItem`, `PieSectorDataItem`, `RadarPoint`), `DataKey<any>` on every item, `TooltipContentProps` has `[key: string]: any`, `ContentType = any`, `TrackerRow = Record<string, any>` |
| Slot typing in Volar | Works for the 20 components with a `$slots` cast and is guarded by `src/types/slots.vue` ✓. CartesianGrid, Radar, RadialBar, Cell and ErrorBar have no slot types |
| Event typing | Object-form `emits` everywhere, guarded by `src/types/events.vue` ✓ (except `unknown` cell payloads) |
| Generic components | None. `data` and `dataKey` cannot infer from each other. `defineChartComponents` is a sound workaround for children, but does not cover standalone charts, where `data` and keys live on **one** component and could be truly generic |

Note: the project `CLAUDE.md` says `TooltipIndex`/active index is `string | null`. The public `TooltipActiveIndex` is `number | null` (`state/chartTooltip.ts:36`). The doc is out of date.

---

## 5. Ranked findings

### P1: fix before 1.0

1. **Emitted types lie about nullability.** `packages/vue/tsconfig.json:29` `"strict": false`. Public composables and payload types drop `undefined`/`null` (e.g. `useActiveTooltipCoordinate` → `ComputedRef<Coordinate>`). *Fix:* build declarations with `strict: true` (or at least `strictNullChecks`). Fix the errors this surfaces in public files first. Add a strict consumer typecheck of `dist` to CI (`scripts/check-consumers.mjs` exists; make it assert on these hooks).
2. **Treemap, Sankey and SunburstChart drop all attrs** (`class`, `style`, `aria-*`, `data-*`). They have `inheritAttrs: false` and never forward `attrs` (`Treemap.tsx:484-487`, `Sankey.tsx:423-426`, `SunburstChart.tsx:258-261`). They also have no accessible name. *Fix:* forward `boxAttrs(attrs)`/`rootAttrs(attrs)` as the cell charts do, and add `title`/`ariaLabel` (see P2-3).
3. **Internal props are public contract.** Line/Area expose `points, path, baseLine, layout, left, top, width, height, animationId, activePoint, needClip, activeIndex`. Bar exposes `needClip, activeIndex, id`. Legend exposes `chartWidth, chartHeight, margin`. Label exposes `parentViewBox, index`. Each one is a 1.0 compatibility promise and a way to break rendering. *Fix:* split outer (public) and inner (view) props, as XAxis already does, and remove these from the outer `props`.
4. **XAxis/YAxis do not declare common props.** `tick`, `angle`, `label`, `name`, `stroke`, `tickSize` fail under `strictTemplates`. `orientation`/`type`/`padding`/`scale` accept any string or object (`cartesian/axis/XAxis.tsx:144-230`). `YAxis.yAxisId` has no default while `XAxis.xAxisId` defaults to `0`. *Fix:* one typed `AxisProps` shared by both axes: `orientation: 'top'|'bottom'` / `'left'|'right'`, `type: 'number'|'category'`, `padding: {left?,right?}|'gap'|'no-gap'`.
5. **Internal plumbing exported** (section 1 table): Line context (4 + 2 types), ErrorBar registry (5 + 4 types), the 3 payload searchers, `getUniqPayload`, `Global`. *Fix:* replace `export *` in `cartesian/line/index.ts`, `cartesian/error-bar/index.ts` and `components/Tooltip.tsx` with explicit export lists, and add an export snapshot test (the TS script used here, about 30 lines).

### P2: material usability

1. **Active state has four contracts** (2c). *Proposed API:* `v-model:active-index` (`number | null`) on Tooltip, Sparkline, Pie, Bar and the four cell charts (they already emit it internally, `CellGridLayer.tsx:182`). Remove `Pie.activeIndex=-1` and the one-way `activeIndex` on Bar/Line/Area. Make `Tooltip.defaultIndex` `number`.
2. **Brush uses two models.** One drag emits two separate updates. *Proposed:* `v-model:range` with `{ startIndex, endIndex }` (the `BrushStartEndIndex` type already exists, and the `change` event already carries it). Keep `start-index`/`end-index` as plain initial props, or drop them.
3. **Accessible-name props are split.** Categorical charts use `title`/`desc`; standalone charts use `ariaLabel` (undefined on BarList/JourneySankey). The default is "BarChart chart". *Proposed:* every chart takes `title` (accessible name) and `desc` (description). Defaults are human words ("Bar chart", "Status history"). Remove `ariaLabel` (or alias it for one release).
4. **One series color for every series.** *Proposed:* `--v-charts-series-1…8` assigned by item registration order; `fill`/`stroke` default to `var(--v-charts-series-N, var(--v-charts-series, <one fallback>))`. Bar and Scatter get a default. Treemap tiles read the same tokens. Rename `colorPanel` → `colors`. Unify all fallbacks to one hex.
5. **Standalone charts are not generic.** All keys are `string`, payloads are `unknown`/`Record<string, any>`, and `defineChartComponents` excludes them. Here `data` and keys sit on the same component, so `<script setup generic>`-style typing is possible. *Proposed:* make each standalone chart generic in `Row` (a `typeof X & (new <Row>() => …)` cast, the same technique as `typed.ts`). Key props become `RowKey<Row> | ((row: Row) => …)`. `cell-click`/`#cell` payloads become `Row`.
6. **Missing prop types** (section 1). *Proposed:* export `XxxProps` for every component in `componentNames`. Stop exporting `*VueProps` runtime objects (they make defaults part of the contract). Export `TooltipPayloadEntry`. Fix the TypeScript guide's claim.
7. **Dead props on every categorical chart:** `throttleDelay` and `to` are declared and never read (`generateCategoricalChart.tsx:115,121`). Every categorical chart also accepts the polar props (`cx, cy, innerRadius, outerRadius, startAngle, endAngle`) and the bar props (`barSize, barGap, barCategoryGap, maxBarSize`), whether or not they apply. *Proposed:* remove `to`; either wire `throttleDelay` or remove it; give polar charts and cartesian charts separate prop sets.
8. **Tooltip has three content paths** (`content` prop typed `any`, `#content` slot, `default` slot). *Proposed:* `#content` only.
9. **Nuxt module default prefix `''`** registers `Tooltip`, `Label`, `Legend`, `Text`, `Cell` globally. These names collide with shadcn-vue/Nuxt UI components, which is the stated target ecosystem. *Proposed:* keep `''` but warn on collision at module setup, or default to a prefix. It is documented (`2.guides/11.nuxt-and-ssr.md:18`), so this is a decision, not a bug.
10. **Slot gaps:** Radar has no slots at all, RadialBar has no `shape`/`label`, Area has no `shape`, CartesianGrid slots are untyped, Legend/Label `content` is declared required. *Proposed:* `shape`, `label`, `dot`/`activeDot` where the item draws them. Slot names: `active<Thing>` is the active variant of `<thing>` (`activeShape` everywhere, or keep `activeBar`/`activeDot` and add `activeShape` aliases).

### P3: bounded inconsistency

1. Formatter naming (2a): use `*Formatter`. `valueFormat` → `valueFormatter`, `xLabelFormat` → `xTickFormatter`, `periodLabel` → `periodFormatter`, `formatSubtitle` → `subtitleFormatter`.
2. JourneySankey `node-click`/`link-click` lack `index` and hover events. SunburstChart has no item events.
3. Sparkline uses `curve` for the curve type and `type` for the mark; Line uses `type` for the curve type. Keep Sparkline's naming. Consider a `curve` alias on Line/Area.
4. Treemap `aspectRatio` (tile shape) vs chart `aspect` (box). Rename to `tileAspectRatio`.
5. `Tooltip.transition` is `AnimationOptions`; everything else is `ChartTransition`.
6. `SunburstChartVueProps.width/height` declared `required` (wrong once exported). `SunburstInner` uses camelCase emits.
7. `data-recharts-item-index` / `data-recharts-item-data-key` DOM attributes (`utils/const.ts:6,29`). No `data-slot` attributes (the vision's styling contract).
8. `ResponsiveContainer` is redundant. Deprecate it in 1.0 docs (it is already "not needed") and convert `onResize` to an emit if it stays.
9. Tooltip lacks Recharts' `labelFormatter` (parity gap; `#content` covers it).
10. `useOffset` and `usePlotArea` duplicate each other. Keep `usePlotArea`.
11. Tracker `colors` is a map while Heatmap `colors` is an array. Rename Tracker's to `statusColors` (it pairs with `labels` → `statusLabels`).
12. Chart-level animation default missing (2d). Add `:is-animation-active` / `:transition` on charts, provided to items.

### Breaking changes to make before 1.0 (add to `docs/content/1.getting-started/3.migration.md`)

| Change | Migration note |
|---|---|
| Remove internal exports (Line context, ErrorBar registry, payload searchers, `getUniqPayload`, `Global`, `getPath`, `rectanglePath`, `*VueProps`) | "These were internal. Use `XxxProps` types; for paths use the shape components. File an issue if you used one." |
| Remove internal props from Line/Area/Bar/Legend/Label | "Remove `points`, `layout`, `animation-id`, `need-clip` … from your templates. They were set by the chart." |
| `Pie`/`Bar` `active-index` → `v-model:active-index`; `-1` → `null` | "Replace `:active-index="-1"` with nothing, and `:active-index="i"` with `v-model:active-index`." |
| Brush `v-model:start-index` + `v-model:end-index` → `v-model:range` | "`v-model:range="{ startIndex, endIndex }"`. `@change` is unchanged." |
| `ariaLabel` → `title`/`desc` on standalone charts | "Rename `aria-label` props to `title`." (can alias for one minor) |
| Tooltip `content` prop removed | "Use `<template #content>`." |
| Series colors default to `--v-charts-series-N` | "Multi-series charts without explicit colors now differ per series. Set `--v-charts-series-1..N`, or pass `fill`/`stroke` to keep one color." |
| Treemap `colorPanel` → `colors`, `aspectRatio` → `tileAspectRatio`; Tracker `colors`/`labels` → `statusColors`/`statusLabels` | Rename the prop. |
| Formatter renames (P3-1) | Rename the prop. |
| Remove `to`, `throttleDelay`; polar-only props removed from cartesian charts and vice versa | "They had no effect." |
| Axis `orientation`/`type`/`padding` narrowed to unions | "TypeScript only. Invalid values never worked." |
| Strict declarations (nullability) | "TypeScript only. Hooks now return `T \| undefined`. Add the checks the runtime already needed." |
| `data-recharts-*` → `data-v-charts-*` (and add `data-slot`) | "Update selectors." |
| Deprecate `Customized`, `ResponsiveContainer` (docs + dev warning; remove in 2.0) | "Use the chart's default slot with `usePlotArea()` etc. Size the chart directly." |

Dependents: the package is published as 0.6.0 and has an upstream (`unovue/vue-charts`). The migration page already plans one breaking 1.0, so make these changes in that same release. No compatibility layer is needed beyond the optional one-release `ariaLabel` alias.

---

## 6. Ideal API sketch

### Cartesian (BarChart)

```vue
<script setup lang="ts">
import { Bar, BarChart, Brush, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'vccs'

interface Visit { date: string, desktop: number, mobile: number }
const rows = reactive<Visit[]>(await fetchVisits())

const active = ref<number | null>(null)          // shared with a table
const hidden = ref<Array<keyof Visit>>([])
const range = ref({ startIndex: 0, endIndex: 29 })
</script>

<template>
  <!-- responsive by default; generic: Row is inferred from :data -->
  <BarChart :data="rows" :height="300" title="Visits per day" :transition="{ duration: 0.4 }">
    <CartesianGrid :vertical="false" />
    <XAxis data-key="date" orientation="bottom" :tick-formatter="d => d.slice(5)" />
    <YAxis />
    <!-- data-key autocompletes 'desktop' | 'mobile'; color from --v-charts-series-1/2 -->
    <Bar data-key="desktop" stack-id="a" @click="(entry) => open(entry.payload.date)">
      <template #shape="{ x, y, width, height, payload, active }">
        <rect :x :y :width :height :rx="4" :class="{ 'opacity-60': !active }" />
      </template>
    </Bar>
    <Bar data-key="mobile" stack-id="a" />
    <Tooltip v-model:active-index="active">
      <template #content="{ label, payload }">
        <!-- payload[0].payload is Visit -->
        <MyTooltip :label :rows="payload" />
      </template>
    </Tooltip>
    <Legend v-model:hidden="hidden" />
    <Brush v-model:range="range" />
  </BarChart>
</template>
```

### Standalone (Heatmap)

```vue
<script setup lang="ts">
import { Heatmap, Tooltip } from 'vccs'

interface Hit { weekday: string, hour: number, visits: number }
const hits = ref<Hit[]>([])
const active = ref<number | null>(null)
</script>

<template>
  <!-- generic in Hit: x-key / y-key / data-key are keyof Hit or accessors -->
  <Heatmap
    :data="hits"
    x-key="hour"
    y-key="weekday"
    data-key="visits"
    :levels="5"
    :value-formatter="v => `${v} visits`"
    title="Visits by hour and weekday"
    :aspect="3"
    v-model:active-index="active"
    @cell-click="(hit, index) => drill(hit.weekday, hit.hour)"
  >
    <template #cell="{ x, y, width, height, fill, active, cell }">
      <rect :x :y :width :height :fill rx="2" :stroke="active ? 'currentColor' : 'none'" />
    </template>
    <Tooltip />
  </Heatmap>
</template>
```

Shared rules the sketches show: `title` names every chart; `*-key` accepts `keyof Row | (row) => value`;
`*-formatter` for every text function; `v-model:active-index` for every active state; item events
are `(row-or-entry, index, event)` typed by `Row`; colors come from tokens unless a prop sets them;
`transition`/`is-animation-active` can be set once on the chart.
