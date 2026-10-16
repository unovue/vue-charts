# RadarChart

Use `RadarChart` to compare multivariate profiles across a shared set of dimensions. Use `LineChart` for ordered trends and `BarChart` when dimensions have incompatible units or precise magnitude comparison is the main task.

## Data shape

- Put a flat array on the chart root's `data`, with one row per dimension.
- `PolarAngleAxis data-key` selects the dimension label.
- Each `Radar data-key` selects one numeric profile from those same rows.
- Use one `Radar` per profile and set `name` when its legend or tooltip label should differ from the key.

## Minimal example

```vue
<script setup lang="ts">
import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip } from 'vccs'

const data = [
  { dimension: 'Ease of use', current: 82, previous: 74 },
  { dimension: 'Performance', current: 88, previous: 80 },
  { dimension: 'Support', current: 76, previous: 72 },
  { dimension: 'Reliability', current: 91, previous: 85 },
  { dimension: 'Value', current: 79, previous: 75 },
]
</script>

<template>
  <RadarChart
    :data="data"
    cx="50%"
    cy="50%"
    :outer-radius="100"
    :height="300"
  >
    <PolarGrid />
    <PolarAngleAxis data-key="dimension" />
    <Tooltip :cursor="false" />
    <Legend />
    <Radar
      data-key="current"
      name="Current"
      stroke="#f97316"
      fill="#f97316"
      :fill-opacity="0.3"
    />
    <Radar
      data-key="previous"
      name="Previous"
      stroke="#14b8a6"
      fill="#14b8a6"
      :fill-opacity="0.3"
    />
  </RadarChart>
</template>
```

Animation is enabled by default; retrieve `ssr-testing` before taking screenshots or asserting exact geometry.

## Chart-specific rules

- Keep every profile on the same scale across all dimensions; the example uses scores from 0 to 100.
- Set `grid-type="circle"` on `PolarGrid` for circular rings instead of the default polygon grid.
- Set `:dot="true"` for default vertex dots; use the `dot` or `activeDot` slot for custom content.
- Use `connect-nulls` only when missing vertices should be bridged.
- The `dot`, `active-dot`, and `label` props accept booleans or presentation objects, not render functions.

## Related guides

`installation`, `vue-api`, `typed-rows`, `ssr-testing`, `line-chart`, `bar-chart`, `radial-bar-chart`.
