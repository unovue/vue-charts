<p align="center">
  <img src="docs/public/logo.svg" alt="vccs logo" width="120" />
</p>

<h1 align="center">Vue Charts (vccs)</h1>

<p align="center">
  <strong>Composable charting components for Vue 3</strong>
</p>

<p align="center">
  An unofficial Vue.js port of <a href="https://recharts.org">Recharts</a>, bringing React's most popular charting library to the Vue ecosystem.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/vccs"><img src="https://img.shields.io/npm/v/vccs.svg" alt="npm version"></a>
</p>

---

> **Work in Progress**: This library is under active development. APIs may change.

## Install

```bash
# pnpm
pnpm add vccs

# npm
npm install vccs

# yarn
yarn add vccs
```

**Peer dependency**: `vue >= 3.0.0`

## Quick Start

```vue
<script setup>
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Page A', uv: 4000, pv: 2400 },
  { name: 'Page B', uv: 3000, pv: 1398 },
  { name: 'Page C', uv: 2000, pv: 9800 },
  { name: 'Page D', uv: 2780, pv: 3908 },
  { name: 'Page E', uv: 1890, pv: 4800 },
  { name: 'Page F', uv: 2390, pv: 3800 },
]
</script>

<template>
  <ResponsiveContainer
    width="100%"
    :height="300"
  >
    <BarChart :data="data">
      <CartesianGrid stroke-dasharray="3 3" />
      <XAxis data-key="name" />
      <YAxis />
      <Tooltip />
      <Bar
        data-key="pv"
        fill="#8884d8"
      />
      <Bar
        data-key="uv"
        fill="#82ca9d"
      />
    </BarChart>
  </ResponsiveContainer>
</template>
```

## Chart Types

| Chart | Component | Description |
|-------|-----------|-------------|
| Area | `<AreaChart>` + `<Area>` | Filled area charts with stacking & gradients |
| Bar | `<BarChart>` + `<Bar>` | Vertical/horizontal bar charts |
| Line | `<LineChart>` + `<Line>` | Line charts with multiple curve types |
| Scatter | `<ScatterChart>` + `<Scatter>` | X-Y scatter plots |
| Composed | `<ComposedChart>` | Mix Area, Bar, Line in one chart |
| Pie | `<PieChart>` + `<Pie>` | Pie and donut charts |
| Radar | `<RadarChart>` + `<Radar>` | Radar/spider charts |
| Radial Bar | `<RadialBarChart>` + `<RadialBar>` | Circular bar charts |
| Funnel | `<FunnelChart>` + `<Funnel>` | Funnel/pipeline charts |
| Treemap | `<Treemap>` | Not yet supported |
| Sankey | `<Sankey>` | Not yet supported |
| Sunburst | `<SunburstChart>` | Not yet supported |

## Components

**Cartesian**: `XAxis`, `YAxis`, `ZAxis`, `CartesianGrid`, `ReferenceLine`, `ReferenceArea`, `ErrorBar`, `Brush`

**Polar**: `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`

**General**: `Tooltip`, `Legend`, `Label`, `LabelList`, `Cell`, `ResponsiveContainer`

**Shapes**: `Rectangle`, `Dot`, `Sector`, `Symbols`

## Features

- **Vue 3 Native** — Composition API + JSX, full TypeScript support
- **Recharts API** — Same intuitive composable component design
- **Animated** — Smooth transitions powered by [Motion for Vue](https://motion.dev/docs/vue)
- **Interactive** — Tooltip, legend, brush, and click/hover events
- **Responsive** — `<ResponsiveContainer>` adapts to parent width
- **Customizable** — Named slots for shapes, ticks, tooltip content, legend, and more

## Architecture

- **State**: Redux Toolkit via [@reduxjs/vue-redux](https://github.com/nicepkg/reduxjs-vue-redux) — one store per chart
- **Math**: D3 scales and shapes via [victory-vendor](https://github.com/FormidableLabs/victory)
- **Animation**: [Motion for Vue](https://motion.dev/docs/vue)

## Project Structure

```
packages/vue/src/     # Library source (published as vccs)
playground/nuxt/      # Nuxt 3 playground for manual testing
docs/                 # Documentation site (Nuxt 3 + Docus)
```

## Development

```bash
pnpm install          # Install dependencies
pnpm dev              # Watch mode (library)
pnpm test             # Run tests
pnpm test:coverage    # Tests with coverage
pnpm storybook        # Storybook
pnpm play             # Nuxt playground
pnpm docs             # Documentation site
```

## License

[MIT](LICENSE)

## Credits

- **[Recharts](https://recharts.org)** — Original React charting library this project ports from
- **[Victory Vendor](https://github.com/FormidableLabs/victory)** — D3 math utilities
- **[Motion for Vue](https://motion.dev/docs/vue)** — Animation engine
- **[Redux Toolkit](https://redux-toolkit.js.org/)** — State management
- **[VueUse](https://vueuse.org/)** — Vue composition utilities

---

<p align="center">
  <em>This is an unofficial port and is not affiliated with the original Recharts team.</em>
</p>
