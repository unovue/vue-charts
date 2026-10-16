# LineChart

Use `LineChart` for one or more trends over an ordered axis. Use `Sparkline` instead when the chart must be tiny and axes would add noise; use `AreaChart` when filled magnitude matters.

## Data shape

- `data` is an array of flat rows on the chart root.
- `XAxis data-key` names the ordered category or time value.
- Each `Line data-key` selects one numeric series from the same row.
- Use one `Line` per series and set `name` when the legend or tooltip needs a label different from the key.

## Minimal example

```vue
<script setup lang="ts">
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { month: 'Jan', desktop: 186, mobile: 80 },
  { month: 'Feb', desktop: 305, mobile: 120 },
  { month: 'Mar', desktop: 237, mobile: 160 },
]
</script>

<template>
  <LineChart
    :data="data"
    :height="300"
  >
    <CartesianGrid stroke-dasharray="3 3" />
    <XAxis data-key="month" />
    <YAxis />
    <Tooltip :cursor="false" />
    <Legend />
    <Line
      type="monotone"
      data-key="desktop"
      stroke="#f97316"
    />
    <Line
      type="monotone"
      data-key="mobile"
      stroke="#14b8a6"
    />
  </LineChart>
</template>
```

Animation is enabled by default; retrieve `ssr-testing` before taking screenshots or asserting exact geometry.

## Chart-specific rules

- Keep all series on the shared root `data` array; do not put a separate array on each `Line`.
- Customize points with the `dot` or `activeDot` slot on `Line`, not a function-valued `dot` prop.
- Use `connect-nulls` only when a gap should be bridged; otherwise missing values stay visible as gaps.
- Retrieve `composed-chart` when bars, areas, or scatter points must share the same axes.

## Related guides

`installation`, `vue-api`, `typed-rows`, `ssr-testing`, `area-chart`, `sparkline`, `composed-chart`.
