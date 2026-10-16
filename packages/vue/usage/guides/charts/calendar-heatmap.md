# CalendarHeatmap

Use `CalendarHeatmap` for daily activity arranged into weekdays and weeks, such as contributions or practice minutes. Use `Heatmap` for arbitrary categories and `Sparkline` when only the overall trend matters.

## Data shape

- `data` is a flat array of daily rows.
- `date-key` defaults to `date` and accepts a valid `YYYY-MM-DD` string or a `Date` object.
- `data-key` defaults to `value` and selects the numeric intensity.
- Rows for the same day are summed; invalid dates are skipped.
- Days without a source row are empty cells; do not pad the range with zero rows.
- Set `start` and `end` for an explicit range. Otherwise the range ends on the latest data date and covers about 52 weeks.

## Minimal example

```vue
<script setup lang="ts">
import { CalendarHeatmap, Tooltip } from 'vccs'

const data = [
  { date: '2025-01-02', value: 3 },
  { date: '2025-01-04', value: 5 },
  { date: '2025-01-07', value: 2 },
  { date: '2025-01-10', value: 8 },
  { date: '2025-01-13', value: 4 },
  { date: '2025-01-16', value: 1 },
  { date: '2025-01-20', value: 9 },
  { date: '2025-01-24', value: 6 },
]
</script>

<template>
  <CalendarHeatmap
    :data="data"
    start="2025-01-01"
    end="2025-01-31"
    :week-start="1"
    color="#14b8a6"
  >
    <Tooltip :cursor="false" />
  </CalendarHeatmap>
</template>
```

## Chart-specific rules

- Prefer `YYYY-MM-DD` strings for unambiguous calendar days; a `Date` uses its local calendar date.
- Explicit `start` and `end` keep a fixed example or server-rendered range independent of the current day.
- `colors` is the complete scale from empty to full, so include the empty color as its first entry.
- Use `:week-start="0"` for Sunday or `:week-start="1"` for Monday; `max` controls the value at full intensity.
- Tooltip and cell-event payloads are `CalendarDay` objects with `date`, `value`, `level`, and source `rows`.

## Related guides

`installation`, `vue-api`, `typed-rows`, `ssr-testing`, `heatmap`, `tracker`, `sparkline`.
