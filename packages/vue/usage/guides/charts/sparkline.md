# Sparkline

Use `Sparkline` for a tiny trend inside a KPI tile, table row, or dense dashboard. Use `LineChart` when axes, multiple series, or a larger analytical view matter.

## Data shape

- `data` is an ordered array of numbers or object rows.
- Object rows use `data-key="value"` by default; choose another numeric field with `data-key`.
- Use `null` for a missing point that should remain a gap.
- Set `name-key` to a date or another stable identifier when points must keep their identity across updates.

## Minimal example

```vue
<script setup lang="ts">
import { Sparkline, Tooltip } from 'vccs'

const data = [
  { day: 'Mon', value: 820 },
  { day: 'Tue', value: 932 },
  { day: 'Wed', value: 901 },
  { day: 'Thu', value: 934 },
  { day: 'Fri', value: 1090 },
  { day: 'Sat', value: 1180 },
]
</script>

<template>
  <Sparkline
    :data="data"
    name-key="day"
    type="area"
    color="#f97316"
    :height="40"
  >
    <Tooltip :cursor="false" />
  </Sparkline>
</template>
```

## Chart-specific rules

- Use `type="line"`, `type="area"`, or `type="bar"`; `gap` and `radius` apply only to bars.
- Give multiple sparklines the same `min` and `max` when their shapes must be comparable.
- Use `name-key` for a moving time window; without it, points match by array position.
- Place `Tooltip` in the default slot, or bind `v-model:active-index` to show the hovered point in your own markup.
- The component fills its container width and defaults to 32px tall unless you set `height` or `aspect`.

## Related guides

`installation`, `vue-api`, `typed-rows`, `ssr-testing`, `line-chart`, `area-chart`.
