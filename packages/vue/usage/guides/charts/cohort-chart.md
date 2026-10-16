# CohortChart

Use `CohortChart` for retention or another count by acquisition cohort and elapsed period. Use `Heatmap` for an arbitrary matrix and `LineChart` for one overall trend without cohort breakdown.

## Data shape

- `data` contains one row per cohort, ordered oldest first.
- `cohort-key` selects the cohort name and defaults to `cohort`.
- `values-key` selects a numeric array and defaults to `values`.
- `values[0]` is the initial cohort size; `values[n]` is the count still active at period `n`.
- Supply raw counts even in the default percentage mode. Omit periods a cohort has not reached instead of padding them with zero.

## Minimal example

```vue
<script setup lang="ts">
import { CohortChart, Tooltip } from 'vccs'

const data = [
  { cohort: 'Jan', values: [1200, 610, 480, 410] },
  { cohort: 'Feb', values: [940, 470, 370] },
  { cohort: 'Mar', values: [1180, 650] },
  { cohort: 'Apr', values: [860] },
]
</script>

<template>
  <CohortChart
    :data="data"
    color="#f97316"
  >
    <Tooltip :cursor="false" />
  </CohortChart>
</template>
```

## Chart-specific rules

- The default `mode="percent"` calculates each cell from the raw count divided by `values[0]`; use `mode="count"` for raw counts.
- Keep `values[0]` positive. A non-positive or invalid initial size cannot produce percentage cells.
- Different cohorts may have different array lengths; shorter arrays leave unelapsed periods blank and form the expected triangle.
- Use `period-formatter` for column headings. `value-formatter` receives the calculated percentage or the raw count according to `mode`.
- Tooltip and cell-event payloads include the cohort source `row`, contributing `rows`, and elapsed `period`.

## Related guides

`installation`, `vue-api`, `typed-rows`, `ssr-testing`, `heatmap`, `line-chart`.
