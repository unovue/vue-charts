# ScatterChart

Use `ScatterChart` to show relationships or distributions across numeric variables, optionally with bubble size. Use `LineChart` for an ordered trend and `BarChart` for category comparisons.

## Data shape

- Give each `Scatter` its own `data` array when the series contain different points.
- `XAxis data-key` and `YAxis data-key` select the numeric coordinates from each flat row.
- Set `type="number"` on both axes for numeric positioning.
- Add `ZAxis data-key` only when a third numeric field should control point size.

## Minimal example

```vue
<script setup lang="ts">
import { CartesianGrid, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'vccs'

const data = [
  { hours: 2, score: 62, students: 12 },
  { hours: 4, score: 70, students: 18 },
  { hours: 6, score: 79, students: 16 },
  { hours: 8, score: 85, students: 22 },
]
</script>

<template>
  <ScatterChart :height="300">
    <CartesianGrid />
    <XAxis
      data-key="hours"
      type="number"
    />
    <YAxis
      data-key="score"
      type="number"
    />
    <ZAxis
      data-key="students"
      :range="[60, 400]"
    />
    <Tooltip :cursor="false" />
    <Scatter
      name="Classes"
      :data="data"
      fill="#f97316"
    />
  </ScatterChart>
</template>
```

Animation is enabled by default; retrieve `ssr-testing` before taking screenshots or asserting exact geometry.

## Chart-specific rules

- Put `data` on each `Scatter` for multiple series; set `name` and add `Legend` to distinguish them.
- `ZAxis range` sets the minimum and maximum dot size; omit `ZAxis` for uniform points.
- The tooltip shows one point at a time rather than all series at a category.
- Retrieve `composed-chart` when scatter points must share axes with bars, areas, or lines.

## Related guides

`installation`, `vue-api`, `typed-rows`, `ssr-testing`, `line-chart`, `composed-chart`.
