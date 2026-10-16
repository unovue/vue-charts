# Heatmap

Use `Heatmap` to compare magnitude across two categorical dimensions, such as visits by weekday and hour. Use `CalendarHeatmap` for calendar dates and `CohortChart` for retention by elapsed cohort period.

## Data shape

- `data` is a flat array with one column key, one row key, and one numeric value per row.
- The default fields are `x`, `y`, and `value`; override them with `x-key`, `y-key`, and `data-key`.
- Rows with the same x/y pair are summed into one cell.
- Columns and rows follow first appearance by default; use `x-domain` and `y-domain` for explicit order or empty categories.

## Minimal example

```vue
<script setup lang="ts">
import { Heatmap, Tooltip } from 'vccs'

const data = [
  { x: '09:00', y: 'Mon', value: 42 },
  { x: '12:00', y: 'Mon', value: 68 },
  { x: '18:00', y: 'Mon', value: 51 },
  { x: '09:00', y: 'Tue', value: 38 },
  { x: '12:00', y: 'Tue', value: 74 },
  { x: '18:00', y: 'Tue', value: 49 },
  { x: '09:00', y: 'Wed', value: 45 },
  { x: '12:00', y: 'Wed', value: 79 },
  { x: '18:00', y: 'Wed', value: 56 },
]
</script>

<template>
  <Heatmap
    :data="data"
    color="#14b8a6"
  >
    <Tooltip :cursor="false" />
  </Heatmap>
</template>
```

## Chart-specific rules

- Use `color` for the full-intensity color and `empty-color` for empty cells; `max` sets the value that reaches full intensity.
- Use `colors` only as a complete scale from empty to full; it overrides `color`, `empty-color`, and `levels`.
- Keep `fill-missing` enabled for a complete matrix, or disable it when absent x/y pairs should remain holes.
- Tooltip and cell-event payloads are aggregated cells with `{ x, y, value, rows }`; read source rows from `rows`.
- `active-index` identifies a rendered cell position, not an input row index.

## Related guides

`installation`, `vue-api`, `typed-rows`, `ssr-testing`, `calendar-heatmap`, `cohort-chart`, `tracker`.
