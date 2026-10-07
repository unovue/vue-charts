# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - Unreleased

1.0 rebuilds vccs on Vue. Each chart keeps its state in Vue computeds instead of a Redux store,
and the public API follows Vue conventions: `v-model`, events, slots and responsive charts by
default. Read the [migration guide](docs/content/1.getting-started/3.migration.md) before you
upgrade from 0.6: it shows every breaking change with a before and after example.

### Breaking changes

Update your templates:

- Callback props are Vue events: `:onClick` becomes `@click`, `:onAnimationEnd` becomes
  `@animation-end`.
- `v-model:active-index` (`number | null`) works on `Tooltip`, `Bar`, `Pie` and the standalone
  charts. `Brush` uses one `v-model:range` instead of `start-index` and `end-index`.
- Charts are responsive by default. The `responsive` prop is removed, and `ResponsiveContainer`
  no longer passes `width` and `height` to its child.
- Line and Area `dot` and `activeDot` accept `boolean` or an options object. A function was
  ignored before; use the `#dot` and `#activeDot` slots.
- Each chart family accepts only its own props. `to`, `throttleDelay` and the chart `dataKey`
  (never read) are removed.
- Internal geometry props are removed from Line, Area, Bar, Legend and Label.
- Renamed props: Tooltip `content` and `portal` become the `#content` slot and `to`; Legend
  `portal` becomes `to`; Treemap `colorPanel` and `aspectRatio` become `colors` and
  `tileAspectRatio`.

Update your styles:

- All classes use the `v-charts-` prefix in kebab case (`vcharts-surface` becomes
  `v-charts-surface`). Chart parts also carry `data-slot` attributes.
- Default colors are CSS variables. Series without a color take the next palette color
  (`--v-charts-series-1` to `-8`).
- Bar `class` is set once on the series layer, not on every rectangle.

Update your imports and types:

- Only public components, composables and types are exported. `useOffset` becomes `usePlotArea`.
- Every public `XxxProps` type comes from its component's props. `*PropsWithSVG` types are
  removed, and `TrapezoidProps` (geometry) is renamed `TrapezoidItem`.
- XAxis and YAxis share one typed `AxisProps`; an invalid `orientation` or `type` is a type error.
- Tooltip payloads of Treemap and Sankey carry your node or link as `payload`
  and the raw `value`. A Tooltip `formatter` wins over a chart's default formatter.

Update your dependencies:

- Vue `^3.5` and `motion-v` `^2.4` are required peer dependencies.

### Added

- New charts: `BarList`, `Sparkline`, `Tracker`, `Heatmap`, `CalendarHeatmap`, `CohortChart` and
  `JourneySankey`. Standalone charts share `value-formatter` and `locale`.
- Typed rows: `defineChartComponents<Row>()` checks `data-key` and types tooltip payloads.
- A Nuxt 4 module (`vccs/nuxt`) that registers the components and composables, and a resolver
  for `unplugin-vue-components` (`vccs/resolver`).
- Server rendering: responsive charts reserve their box and appear at their measured size,
  without layout jumps or hydration mismatches.
- Keyed enter, update and exit animations for every series, with shared timings and
  `prefers-reduced-motion` support.
- Accessible names (`title`, `desc`) for every chart, and keyboard navigation for Treemap,
  Sankey, SunburstChart and the new charts.
- Theming through `--v-charts-*` CSS variables (`chartThemeTokens` lists them), and a
  shadcn-vue `ChartContainer` recipe.
- Slots: Radar `#shape`, `#dot`, `#activeDot` and `#label`; RadialBar `#shape` and `#label`;
  CartesianGrid `#horizontal` and `#vertical`. Tooltip `labelFormatter`. Pie and Funnel `name`.

### Fixed

- RadialBar tooltips open on the painted sector. Funnel marks the hovered trapezoid active, and
  its arrow keys no longer throw.
- Line `dot` options, Legend size and Tooltip `shared` follow later changes.
- Edge data: non-finite values count as missing, nested and function data keys resolve,
  prototype-named stack ids work, and invalid Sankey links are dropped.
- A function `data-key` no longer shows its source code as a series or sector name.
- Hydration mismatches in grid lines and pie labels.
- Two Scatters without `dataKey` no longer share one tooltip and highlight.
- Numeric and string axis ids (`y-axis-id="1"`, `:y-axis-id="1"`) name the same axis.
- An uncontrolled Brush keeps its window when data updates instead of snapping to the last row.
- `reverseStackOrder` reverses the stack order, and the chart `role` prop applies.
- Legend, tooltip, label and shape colors agree: Pie, RadialBar and Funnel tooltip swatches
  show the entry color, the Pie legend and Funnel labels use `<Cell fill>`, and
  `<Area stroke="none">` hides the outline.
- Every series layer gets its `class`, and Bar passes `data-*` and `aria-*` attributes to it.
  Scatter, Radar and RadialBar accept `class`. Brush passes `aria-label` to its group.
- `allowDataOverflow` on one axis clips only that axis, Area clips like Line, and Line and Area
  dots reference a clip path that exists.
- Labels with a partial `viewBox` no longer render at `NaN`.

### Changed

- Area `dot` and `activeDot` accept options objects, like Line. Radar and RadialBar `name`
  accept numbers.
- `ResponsiveContainer` and `Customized` are deprecated and are removed in 2.0. They warn once
  in development.
- A chart no longer forces a layout read to measure its scale.

### Dependencies

- Removed runtime dependencies: `@reduxjs/toolkit`, `@reduxjs/vue-redux`, `immer`,
  `eventemitter3`, `lodash-es` and `victory-vendor`. The D3 modules are used directly
  (`d3-scale`, `d3-shape`, `d3-color`, `d3-hierarchy`, `d3-sankey`).

### Performance

Compared with vccs 0.6.0 from npm (esbuild, minified, gzip level 9, `vue` and `motion-v`
external):

| Import | 0.6.0 | 1.0 |
| --- | ---: | ---: |
| One cartesian or polar chart (for example `BarChart`) | 63.1 kB | 46.2 kB |
| `Treemap` | 68.7 kB | 25.6 kB |
| `Sankey` | 68.7 kB | 22.9 kB |
| `SunburstChart` | 66.9 kB | 21.7 kB |

Standalone charts no longer bundle the cartesian chart engine.

Median time in headless Chromium over 21 paired rounds (900 × 400 px, animation off):

| Chart | 0.6.0 mount / update | 1.0 mount / update |
| --- | ---: | ---: |
| LineChart, 1,000 points | 54.8 / 17.1 ms | 42.4 / 16.1 ms |
| LineChart, 10,000 points | 516.5 / 226.3 ms | 378.6 / 168.6 ms |
| BarChart, 1,000 bars | 89.8 / 42.9 ms | 29.1 / 12.9 ms |
| BarChart, 10,000 bars | 925.2 / 477.8 ms | 236.6 / 113.3 ms |

Bars render without a component per bar, which explains most of the BarChart gain. The
LineChart update at 1,000 points is within measurement noise.

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

## [0.4.1] - 2026-08-14

### Added

- feat(sankey): add the Sankey chart
- feat(sunburst): add SunburstChart
- feat(polar): expose the `transition` prop on Radar, Pie and RadialBar
- feat(utils): add the `Global` config with a runtime `isSsr` override

### Fixed

- fix(container): stop remounting chart children on every render
- fix(tooltip): measure the tooltip without a ResizeObserver
- fix(sankey): use the `linkStroke` prop for the link stroke color
- fix(sunburst): wire `ringPadding` and `padding` into the layout
- fix(sunburst): use the original data indices for the tooltip index

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
