# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - Unreleased

1.0 rebuilds vccs on Vue: every chart keeps its state in plain computeds instead of a Redux
store, and the public API follows Vue conventions. Read the
[migration guide](docs/content/1.getting-started/3.migration.md) before you upgrade: it lists
every breaking change with a before and after example.

### Breaking changes

- Models use `v-model`: `v-model:active-index` (`number | null`) on charts and series, and one
  `v-model:range` on `Brush` instead of `start-index` and `end-index`.
- Callback props such as `:onClick` and `onAnimationEnd` are Vue events (`@click`).
- Charts are responsive by default; the `responsive` prop and the size injection of
  `ResponsiveContainer` are removed.
- All classes use the `v-charts-` prefix in kebab case (`vcharts-surface` → `v-charts-surface`).
- Explicit exports: internal contexts, `*VueProps` objects, path helpers and `useOffset` are no
  longer exported. Use `usePlotArea` instead of `useOffset`.
- Internal geometry props are gone from Line, Area, Bar, Legend and Label.
- Each chart family accepts only its own props; `to` and `throttleDelay` are removed.
- Axes share one typed `AxisProps`; invalid `orientation` or `type` values are type errors.
- Accessible names replace `ariaLabel`, and Tooltip and Legend props follow the Recharts 3 names.
- Item events receive `(item, index, event)`.
- Series without a color take the next palette color (`--v-charts-series-1` … `-8`).
- Requirements: Vue `^3.5` and `motion-v` `^2.4`.
- Every public `XxxProps` type is derived from its component and includes its events.
  `*PropsWithSVG` types are removed, `TrapezoidProps` (geometry) is now `TrapezoidItem`, and
  `TypedComponents` needs its second parameter.
- Standalone charts give the tooltip the domain object as `payload` and the raw `value`; a
  Tooltip `formatter` wins over a chart's default formatter.
- Bar `class` sits on the series layer, not on every rectangle.
- The chart `dataKey` prop is removed (it was never read).
- The Brush `data` prop is removed (it was never read; Brush uses the chart data).
- The Nuxt module requires Nuxt 4, and its `components` option is removed.
- `unplugin-vue-components` is no longer a peer dependency.
- Line and Area `dot`/`activeDot` no longer accept a function (it was ignored); use the `#dot` and
  `#activeDot` slots.

### Added

- New charts: `BarList`, `Sparkline`, `Tracker`, `Heatmap`, `CalendarHeatmap`, `CohortChart` and
  `JourneySankey`.
- Typed rows: `defineChartComponents<Row>()` checks `data-key` and types tooltip payloads.
- A Nuxt module (`vccs/nuxt`) and a component resolver (`vccs/resolver`).
- Charts are responsive by default and render on the server without layout jumps.
- Keyed enter, update and exit animations for every series, with shared motion tokens and
  support for `prefers-reduced-motion`.
- Keyboard navigation and accessible names for every chart.
- Theming through `--v-charts-*` CSS variables, including a shadcn-vue `ChartContainer` recipe.
- `Heatmap`, `CalendarHeatmap`, `CohortChart`, `Sparkline` and `BarList` share `valueFormatter` and
  `locale` for the value text in tooltips and accessible names. Without a formatter, values use the
  locale number format (`1,234`); Heatmap and CalendarHeatmap showed raw numbers before.

### Fixed

- Charts measured late, for example below the fold, no longer draw at the 640×360 fallback first.
- RadialBar tooltips open on the painted sector.
- Line `dot` options and Legend size react to later changes.
- Tooltip `shared` reacts to changes; Funnel arrow keys no longer throw.
- Edge data: non-finite values count as missing, nested and function data keys resolve,
  prototype-named stack ids work, invalid Sankey links are dropped.
- Hydration mismatches in grid lines and pie labels.
- Two Scatters without `dataKey` no longer share one tooltip and highlight; Funnel marks the
  hovered trapezoid active.
- Numeric and string axis ids (`y-axis-id="1"`, `:y-axis-id="1"`) name the same axis.
- CohortChart emits its pointer events.
- An uncontrolled Brush keeps its window when data updates instead of snapping to the last row.
- `reverseStackOrder` reverses the stack order; the chart `role` prop applies.
- Legend, tooltip, label and shape colors agree: Pie, RadialBar and Funnel tooltip swatches
  show the entry color, the Pie legend and Funnel labels use `<Cell fill>`, and
  `<Area stroke="none">` hides the outline.
- Every series layer gets its `class`; Scatter, Radar and RadialBar accept `class`.
- `allowDataOverflow` on one axis clips only that axis; Area clips too; Line and Area dots
  reference a clip path that exists.
- Labels with a partial `viewBox` no longer render at `NaN`.
- LabelList `formatter` receives the raw value, also `null` and objects; before, such values
  reached it as `undefined`. LabelList `position` accepts `{ x, y }` like Label.

### Changed

- Area `dot` and `activeDot` accept objects and functions like Line; Radar and RadialBar
  `name` accepts numbers.
- `ResponsiveContainer` and `Customized` are marked `@deprecated` (removal in 2.0).
- A chart no longer measures its scale with a forced layout read.

### Performance

- Bars render without a component per bar; chart-wide work runs once per change, not once per
  series.
- Standalone charts no longer bundle the cartesian chart engine (BarList: about 8 KB gzip).

## [0.6.0] - 2026-09-09

### Added

- feat(legend): port the `position` prop from Recharts 3.10

### Fixed

- fix: preserve axis settings during server rendering

## [0.5.0] - 2026-08-24

### Added

- feat(axis): support `width="auto"` on YAxis
- feat(chart): add the `responsive` prop and rename RechartsWrapper to ChartsWrapper

### Fixed

- fix(surface): widen the `style` prop type to `StyleValue`

## [0.4.0] - 2026-03-23

### Added

-   feat(text): support default slot as text content
-   feat(tooltip): type cursor slot props and align with Recharts

### Fixed

-   fix(axis): revert attrs forwarding in CartesianAxis
-   fix(axis): remove duplicate class and forward style in XAxis/YAxis
-   fix(axis): correct axisLine prop type to boolean | SVGAttributes
-   fix(filterProps): add kebab-case stroke attribute keys to SVGElementProps
-   fix(cartesian-axis): correct axisLine prop type from string to boolean

## [0.3.0] - 2026-03-22

### Added

-   feat: implement Treemap component with flat mode, nest mode (breadcrumb navigation), built-in tooltip, entrance animation, and arrow indicator for nest nodes
-   feat: add treemap layout utility (d3-hierarchy squarify)
-   feat: implement ReferenceDot component with `#shape` slot
-   feat: implement Customized component
-   feat: implement Polygon shape component
-   feat: export Treemap, Text, and Customized from public API
-   feat: add public hooks — tooltip (`useIsTooltipActive`, `useActiveTooltipCoordinate`, `useActiveTooltipLabel`), layout (`usePlotArea`, `useChartWidth`, `useChartHeight`), axis (`useXAxisDomain`, `useYAxisDomain`, `useXAxisTicks`, `useYAxisTicks`), and 9 scale hooks
-   feat: add `createCategoricalInverse` utility and inverse scale selectors

### Fixed

-   fix: legend is not taking into account user assign style (by @zernonia)
-   fix: tabindex typo and fixing accessibility layer (by @zernonia)
-   fix(Treemap): align event API with Recharts and fix onMouseLeave hover state
-   fix(Treemap): correct type imports and add missing positions field
-   fix: treemap nest mode drills into wrong group due to d3 sort reorder
-   fix: re-trigger slide-in animation on nest mode navigation
-   fix: align treemap animation with recharts — slide-in from left instead of center-scale
-   fix(ReferenceDot): make fill and stroke optional in ReferenceDotShapeProps
-   fix(rootProps): widen class prop type from string to VueClassValue
-   fix: align class type interfaces to VueClassValue across all components

### Changed

-   refactor: replace legacy `animationDuration`/`animationEasing`/`animationBegin` props with `transition`
-   refactor: replace `className` prop with native Vue `class` across all components
-   refactor: align Treemap with Recharts architecture — Redux store + standard Tooltip
-   refactor: extract shared `classProp` and `VueClassValue` type
-   refactor: extract duplicated scale and cell utils into shared modules

## [0.2.0] - 2025-03-15

### Added

- **FunnelChart**: New chart type with `<FunnelChart>` + `<Funnel>` + `<Trapezoid>` shape component

## [0.1.0] - 2025-03-14

Initial release of **vccs** — an unofficial Vue 3 port of [Recharts](https://recharts.org/).

### Added

- **Chart types**: AreaChart, BarChart, LineChart, ScatterChart, ComposedChart, PieChart, RadarChart, RadialBarChart
- **Cartesian components**: XAxis, YAxis, ZAxis, CartesianGrid, ReferenceLine, ReferenceArea, ErrorBar, Brush
- **Polar components**: PolarGrid, PolarAngleAxis, PolarRadiusAxis
- **General components**: Tooltip, Legend, Label, LabelList, Cell, ResponsiveContainer
- **Shape components**: Rectangle, Dot, Sector, Symbols, Cross, Curve
- **Animation**: Smooth SVG animations powered by `motion-v` with `prefers-reduced-motion` support
- **State management**: Redux Toolkit via `@reduxjs/vue-redux` (one store per chart instance)
- **Slots API**: Vue-idiomatic named slots (`#shape`, `#content`, `#cursor`, `#dot`, `#tick`, etc.) instead of React's render-prop pattern
- **Accessibility**: Legend keyboard navigation, ARIA attributes, focus-visible indicators
- **TypeScript**: Full type support with Volar-compatible slot types
- **Build**: ESM-only output (`preserveModules`) via Vite + Rolldown
- **Tooling**: Storybook stories, Vitest test suite, GitHub Actions CI, Nuxt playground, Docus documentation site
