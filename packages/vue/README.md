# vccs

Composable charts for Vue 3. vccs is an unofficial Vue port of [Recharts](https://recharts.org):
you build a chart from components, and each component owns one part of it.

```vue
<script setup lang="ts">
import { Bar, BarChart, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { month: 'Jan', visits: 4000, signups: 240 },
  { month: 'Feb', visits: 3000, signups: 139 },
  { month: 'Mar', visits: 2000, signups: 980 },
]
</script>

<template>
  <BarChart
    :data="data"
    :height="300"
  >
    <XAxis data-key="month" />
    <YAxis />
    <Tooltip :cursor="false" />
    <Bar data-key="visits" />
    <Bar data-key="signups" />
  </BarChart>
</template>
```

The chart fills its container's width. Series without a color take the next color from the
palette, which you can change with CSS variables.

## Requirements

- Vue `^3.5`
- [`motion-v`](https://motion.dev/docs/vue) `^2.4` (peer dependency, drives all animation)
- An ESM build setup (Vite, Nuxt, or another bundler). vccs ships ES modules only.
- For the Nuxt module: Nuxt `^4`.

## Install

```bash
pnpm add vccs motion-v
```

npm and yarn work the same way: `npm install vccs motion-v`.

### Nuxt

Add the module. It registers every component, so you can use them without imports.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['vccs/nuxt'],
})
```

Set `vccs: { prefix: 'V' }` to register `<VBarChart>` and so on.

### Vite with auto-imports

With [`unplugin-vue-components`](https://github.com/unplugin/unplugin-vue-components), the
resolver imports components on use:

```ts
// vite.config.ts
import Components from 'unplugin-vue-components/vite'
import { VccsResolver } from 'vccs/resolver'

export default defineConfig({
  plugins: [vue(), Components({ resolvers: [VccsResolver()] })],
})
```

## Typed rows

`defineChartComponents` binds your row type to the components you pick. A wrong `data-key` is
then a type error, and tooltip payloads carry your row type. Only the components you pick end up
in your bundle.

```vue
<script setup lang="ts">
import { Area, AreaChart, Tooltip, XAxis, defineChartComponents } from 'vccs'

interface Visit { date: string, desktop: number, mobile: number }
defineProps<{ visits: Visit[] }>()

const Chart = defineChartComponents<Visit>()({ AreaChart, Area, XAxis, Tooltip })
</script>

<template>
  <Chart.AreaChart
    :data="visits"
    :height="300"
  >
    <Chart.XAxis data-key="date" />
    <Chart.Area data-key="desktop" />
    <Chart.Tooltip />
  </Chart.AreaChart>
</template>
```

Standalone charts such as `Heatmap` and `BarList` infer the row type from `data`.

## Charts

| From Recharts | Component |
| --- | --- |
| Area, Bar, Line, Scatter | `AreaChart`, `BarChart`, `LineChart`, `ScatterChart` |
| Mixed series | `ComposedChart` |
| Pie, Radar, Radial bar | `PieChart`, `RadarChart`, `RadialBarChart` |
| Funnel | `FunnelChart` |
| Hierarchy and flow | `Treemap`, `SunburstChart`, `Sankey` |

| Added by vccs | Use it for |
| --- | --- |
| `BarList` | Ranked lists with inline bars |
| `Sparkline` | Small trend lines inside text or tables |
| `Tracker` | Status over time, one block per period |
| `Heatmap` | Values on a grid of two categories |
| `CalendarHeatmap` | Daily values over a year |
| `CohortChart` | Retention by cohort and period |
| `JourneySankey` | Paths that users take, step by step |

Building blocks:

- Series: `Area`, `Bar`, `Line`, `Scatter`, `Pie`, `Radar`, `RadialBar`, `Funnel`
- Axes and grids: `XAxis`, `YAxis`, `ZAxis`, `CartesianAxis`, `CartesianGrid`, `PolarGrid`,
  `PolarAngleAxis`, `PolarRadiusAxis`
- Annotations: `ReferenceLine`, `ReferenceArea`, `ReferenceDot`, `ErrorBar`, `Brush`
- Tooltip, legend and text: `Tooltip`, `Legend`, `Label`, `LabelList`, `Text`, `Cell`
- Shapes: `Rectangle`, `Dot`, `Sector`, `Curve`, `Symbols`, `Cross`, `Polygon`, `Trapezoid`

`ResponsiveContainer` and `Customized` still work but are deprecated and are removed in 2.0.
Charts are responsive without a wrapper, and custom SVG goes in the chart's default slot (see
the migration guide).

## What works the Vue way

- **Models:** `v-model:active-index` on `Tooltip`, `Bar`, `Pie` and the standalone charts
  (`Sparkline`, `Tracker`, `Heatmap`, `CohortChart`, `CalendarHeatmap`); `v-model:range` on
  `Brush`; `v-model:hidden` on `Legend`.
- **Slots:** custom shapes, dots, ticks, labels and tooltip content are named slots.
- **Events:** item events receive `(item, index, event)`.
- **Server rendering:** charts render on the server and hydrate without layout jumps.
- **Motion:** enter, update and exit animations follow `prefers-reduced-motion`.
- **Accessibility:** every chart has an accessible name, and item charts support the keyboard.

## Upgrading from 0.x

1.0 changes some props, events and exports. The
[migration guide](https://github.com/unovue/vue-charts/blob/main/docs/content/1.getting-started/3.migration.md)
lists every change with a before and after example.

## Links

- [Documentation](https://vue-charts.com) ([source](https://github.com/unovue/vue-charts/tree/main/docs/content))
- [Changelog](https://github.com/unovue/vue-charts/blob/main/CHANGELOG.md)
- [Issues](https://github.com/unovue/vue-charts/issues)

## Contribute

The repository holds the library (`packages/vue`), the docs site (`docs`) and a Nuxt playground
(`playground/nuxt`). `pnpm install`, then `pnpm test` for the tests and `pnpm verify` for every
release check (`--quick` skips the browser checks). `VERIFY.md` lists what each check proves.

## License

MIT. vccs is an unofficial port and is not affiliated with the Recharts team. It builds on
[Recharts](https://recharts.org), the [D3](https://d3js.org) modules `d3-scale`, `d3-shape`,
`d3-hierarchy` and `d3-sankey`, [Motion for Vue](https://motion.dev/docs/vue) and
[VueUse](https://vueuse.org).
