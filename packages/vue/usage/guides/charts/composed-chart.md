# ComposedChart

Use `ComposedChart` when different series need different marks on shared Cartesian axes. Use a specific chart root when every series has the same mark; do not combine incomparable units on one value axis.

## Data shape

- `data` is an array of flat rows on the chart root.
- `XAxis data-key` names the shared ordered category or time value.
- Each `Area`, `Bar`, or `Line` uses `data-key` to select a numeric field from the same row.
- Set `name` on each series when the legend or tooltip needs a label different from the key.

## Minimal example

```vue
<script setup lang="ts">
import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { month: 'Jan', desktop: 186, mobile: 80, total: 266 },
  { month: 'Feb', desktop: 305, mobile: 120, total: 425 },
  { month: 'Mar', desktop: 237, mobile: 160, total: 397 },
]
</script>

<template>
  <ComposedChart
    :data="data"
    :height="300"
  >
    <CartesianGrid />
    <XAxis data-key="month" />
    <YAxis />
    <Tooltip :cursor="false" />
    <Legend />
    <Area
      type="monotone"
      data-key="total"
      name="Total"
      stroke="#f97316"
      fill="#f97316"
      :fill-opacity="0.3"
    />
    <Bar
      data-key="desktop"
      name="Desktop"
      fill="#14b8a6"
      :bar-size="20"
    />
    <Line
      type="monotone"
      data-key="mobile"
      name="Mobile"
      stroke="#f59e0b"
    />
  </ComposedChart>
</template>
```

Animation is enabled by default; retrieve `ssr-testing` before taking screenshots or asserting exact geometry.

## Chart-specific rules

- Combine `Area`, `Bar`, `Line`, and `Scatter` children; retrieve their chart guides for series-specific props.
- Keep `Area`, `Bar`, and `Line` series on the shared root `data` array; retrieve `scatter-chart` for scatter data and numeric axes.
- Series paint in template order, so a later series can cover an earlier one.
- The tooltip follows the category axis; add `Legend` when multiple series need visible labels.

## Related guides

`installation`, `vue-api`, `typed-rows`, `ssr-testing`, `area-chart`, `bar-chart`, `line-chart`, `scatter-chart`.
