# AreaChart

Use `AreaChart` for a filled trend or a stacked total over an ordered axis. Use `LineChart` when the fill would overemphasize magnitude; use `BarChart` for discrete category comparisons.

## Data shape

- `data` is an array of flat rows on the chart root.
- `XAxis data-key` names the ordered category or time value.
- Each `Area data-key` selects one numeric series from the same row.
- Use one `Area` per series and set `name` when the legend or tooltip needs a different label.

## Minimal example

```vue
<script setup lang="ts">
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { month: 'Jan', visitors: 186 },
  { month: 'Feb', visitors: 305 },
  { month: 'Mar', visitors: 237 },
]
</script>

<template>
  <AreaChart
    :data="data"
    :height="300"
  >
    <CartesianGrid />
    <XAxis data-key="month" />
    <YAxis />
    <Tooltip :cursor="false" />
    <Area
      type="monotone"
      data-key="visitors"
      stroke="#f97316"
      fill="#f97316"
      :fill-opacity="0.3"
    />
  </AreaChart>
</template>
```

Animation is enabled by default; retrieve `ssr-testing` before taking screenshots or asserting exact geometry.

## Chart-specific rules

- Keep all series on the shared root `data` array; do not put a separate array on each `Area`.
- Give areas the same `stack-id` to stack them; omit it when the areas should remain independent.
- Use `connect-nulls` only when a gap should be bridged; otherwise missing values stay visible as gaps.
- Retrieve `composed-chart` when bars, lines, or scatter points must share the same axes.

## Related guides

`installation`, `vue-api`, `typed-rows`, `ssr-testing`, `line-chart`, `bar-chart`, `composed-chart`.
