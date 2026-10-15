---
name: vccs-usage
description: Build charts with vccs, the Vue 3 port of Recharts — chart selection, installation (plain Vite, auto-import resolver, Nuxt module), and the Vue-specific API rules (slots instead of render props, kebab-case SVG attributes, v-model:active-index). Use when writing or fixing chart code that imports from 'vccs', when asked for a chart, graph, plot or dashboard in a Vue/Nuxt app, or when migrating Recharts usage to Vue. Triggers on: vccs, vccs/nuxt, VccsResolver, LineChart, BarChart, PieChart, AreaChart, Vue charts, Recharts in Vue, chart tooltip slot.
---

# Using vccs

vccs is Recharts' API on Vue 3: same component names and props, but customization is **slots, not render props**, and the reactivity idioms are Vue. Import only from the top level — `import { LineChart } from 'vccs'`; deep imports (`vccs/src/...`, `*VueProps`) are not exported and fail the build.

## Pick the chart

```text
What does the data say?
├── Categories compared → BarChart (+ Bar); horizontal ranking → BarList (plain HTML, no SVG)
├── Trend over an ordered axis → LineChart (bare) / AreaChart (filled) / ScatterChart (points)
├── Part-to-whole → PieChart (+ Pie); more than ~6 slices → BarChart instead
├── Stage drop-off → FunnelChart (+ Funnel)
├── Progress toward a goal → RadialBarChart
├── Multivariate profile → RadarChart
├── Hierarchy → Treemap (rectangles) / SunburstChart (radial) / Sankey, JourneySankey (flows)
├── Density over two categories → Heatmap / CalendarHeatmap (days); retention grid → CohortChart
├── Tiny inline trend → Sparkline; activity dots → Tracker
└── Mixed series types → ComposedChart
```

## Install and wire up

```text
Nuxt 4?
├── Yes → modules: ['vccs/nuxt'] — all components auto-registered, SSR works.
│         Set vccs: { prefix: 'V' } when shadcn-vue / Nuxt UI also defines Tooltip, Legend or Label.
│         Nuxt 3 is unsupported: the build fails. Types and defineChartComponents still come from 'vccs'.
└── No (Vite)
    ├── Auto-import wanted → dev-depend unplugin-vue-components, add VccsResolver() from 'vccs/resolver'
    │                        to Components({ resolvers: [...] }).
    └── Otherwise → import components from 'vccs' by name.
```

Always install the peer: `pnpm add vccs motion-v`. motion-v drives every animation; yarn 1 does not auto-install peers. Requires Vue ^3.5.

## Rules that differ from Recharts

1. **Slots replace render props.** `<Line :dot="renderDot">` is silently ignored and the default dot renders. Write `<template #dot="p">…</template>`. Slot names: `shape`, `activeBar`, `dot`, `activeDot`, `label`, `content`, `cursor`, `tick`. why: in Vue, a function prop is data, not a render contract — only slots render custom content.
2. **Custom tooltip content** goes in `<template #content="{ active, payload, label }">`. Never `v-bind="tooltipProps"` (the ESLint auto-fix strips `v-bind` spreads and the tooltip goes blank), never `:content="fn"`.
3. **`class`, not `className`; SVG attributes kebab-case**: `stroke-dasharray`, `stroke-width`. why: templates compile to real DOM attributes, not React props.
4. **Events, not callback props**: `@click`, not `:on-click`. Payload is `(item, index, event)`.
5. **`active-index` is `number | null`**: `v-model:active-index` bound to `ref<number | null>(null)`. There is no `-1` convention.
6. **Brush has one model**: `v-model:range` (`ref<BrushStartEndIndex | null>`, `null` = all rows) replaces `start-index` / `end-index` / `on-change`.
7. **Never wrap in ResponsiveContainer** — it is deprecated, dev-warns once, and is removed in 2.0. Charts are responsive by default: set `:height="300"` and the chart fills its container's width. Pass `width` / `height` / `aspect` straight to the chart root.
8. **Data keys**: `data-key="uv"` (field name), a numeric index, or an accessor function. A function key never displays its source as the series name — set `name` or `name-key`. `NaN` and `Infinity` count as missing values.
9. **Theme through CSS variables**: a series without an explicit color takes `--v-charts-series-1` … `--v-charts-series-8`. Override those to theme every chart at once instead of passing colors per series.
10. **Library CSS classes are prefixed `v-charts-`** (kebab-case); item marks carry `data-v-charts-item-index`. Use these in tests and CSS, not Recharts class names.

## Minimal working chart

```vue
<script setup lang="ts">
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Jan', desktop: 186 },
  { name: 'Feb', desktop: 305 },
]
</script>

<template>
  <LineChart :data="data" :height="300">
    <CartesianGrid stroke-dasharray="3 3" />
    <XAxis data-key="name" />
    <YAxis />
    <Tooltip :cursor="false" />
    <Line type="monotone" data-key="desktop" stroke="#f97316" />
  </LineChart>
</template>
```

Height alone gives a responsive-width chart — no wrapper element. Animation is on by default; pass `:is-animation-active="false"` for deterministic tests and pixel-exact SSR.

## Slot prop shapes

- **Tooltip `#content`**: `{ active, payload, label, coordinate, accessibilityLayer }`. Each payload entry carries `name`, `value`, `color`, `unit`, `dataKey`, and `payload` — the last is the original data row.
- **`#dot` / `#activeDot`** (Line/Area/Scatter): `{ cx, cy, index, value, payload }` plus the series' own attrs (`stroke`, `fill`). Render your own `<circle>`/`<rect>` at `cx`/`cy`.

## Typed rows (optional)

```ts
const Chart = defineChartComponents<Visit>()({ AreaChart, Area, XAxis, Tooltip })
```

Then `<Chart.Area data-key="desktop" />`: a wrong `data-key` is a compile error and tooltip payloads carry the row type. Only the selected components end up in the bundle.

## SSR

A chart with fixed `width`/`height` and `:is-animation-active="false"` renders complete SVG on the server — no client-only wrapper needed. Under Nuxt the module handles registration.
