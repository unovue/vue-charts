# BarChart

Use `BarChart` to compare or rank values across categories. Use `BarList` for a compact HTML ranking without axes; use `LineChart` when the main point is a continuous trend.

## Data shape

- `data` is an array of flat rows on the chart root.
- `XAxis data-key` names the category for vertical bars.
- Each `Bar data-key` selects one numeric series from the same row.
- Use one `Bar` per series and set `name` when the legend or tooltip needs a different label.

## Minimal example

```vue
<script setup lang="ts">
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { month: 'Jan', desktop: 186, mobile: 80 },
  { month: 'Feb', desktop: 305, mobile: 120 },
  { month: 'Mar', desktop: 237, mobile: 160 },
]
</script>

<template>
  <BarChart
    :data="data"
    :height="300"
  >
    <CartesianGrid />
    <XAxis data-key="month" />
    <YAxis />
    <Tooltip :cursor="false" />
    <Legend />
    <Bar
      data-key="desktop"
      name="Desktop"
      fill="#f97316"
    />
    <Bar
      data-key="mobile"
      name="Mobile"
      fill="#14b8a6"
    />
  </BarChart>
</template>
```

Animation is enabled by default; retrieve `ssr-testing` before taking screenshots or asserting exact geometry.

## Chart-specific rules

- Keep grouped or stacked series on the shared root `data` array, with one `Bar` per numeric field.
- Give bars the same `stack-id` to stack them; for stacks containing negative values, set `stack-offset="sign"` on `BarChart`.
- Use `layout="vertical"` for horizontal bars, with a numeric `XAxis` and a categorical `YAxis` carrying the category `data-key`.
- Use `bar-size` for a fixed bar width or `max-bar-size` for an upper limit.

## Related guides

`installation`, `vue-api`, `typed-rows`, `ssr-testing`, `bar-list`, `line-chart`, `composed-chart`.
