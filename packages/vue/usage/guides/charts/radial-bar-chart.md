# RadialBarChart

Use `RadialBarChart` for circular progress or category values on concentric tracks. Use `BarChart` for precise comparisons across many categories; use `PieChart` when part-to-whole angle is more important than individual tracks.

## Data shape

- Put a flat array on the chart root's `data`; with one `RadialBar`, each row produces one bar.
- `RadialBar data-key` selects the numeric value from each row.
- A row can carry a `fill` color for its bar, as in the example.
- Set the chart's `inner-radius` and `outer-radius` to bound the tracks.

## Minimal example

```vue
<script setup lang="ts">
import { RadialBar, RadialBarChart, Tooltip } from 'vccs'

const data = [
  { name: 'Chrome', visitors: 275, fill: '#f97316' },
  { name: 'Safari', visitors: 200, fill: '#14b8a6' },
  { name: 'Firefox', visitors: 187, fill: '#f59e0b' },
  { name: 'Edge', visitors: 173, fill: '#06b6d4' },
]
</script>

<template>
  <RadialBarChart
    :data="data"
    :inner-radius="30"
    :outer-radius="120"
    :height="300"
  >
    <RadialBar
      data-key="visitors"
      :background="true"
    />
    <Tooltip :cursor="false" />
  </RadialBarChart>
</template>
```

Animation is enabled by default; retrieve `ssr-testing` before taking screenshots or asserting exact geometry.

## Chart-specific rules

- Set `:background="true"` for default background arcs, or pass a presentation object to customize them.
- Use the chart's `start-angle` and `end-angle` to control the sweep of every bar.
- Give multiple `RadialBar` components the same `stack-id` to stack their values; each one still needs its own `data-key`.
- Use `bar-size` for bar thickness and `corner-radius` for rounded arc ends.
- Place `LabelList` inside `RadialBar` for default labels, or use `RadialBar`'s `#label` slot for custom content.

## Related guides

`installation`, `vue-api`, `typed-rows`, `ssr-testing`, `bar-chart`, `pie-chart`, `radar-chart`.
