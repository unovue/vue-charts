# Tracker

Use `Tracker` for an ordered sequence of discrete statuses, such as daily service health or build results. Use `Sparkline` for a numeric trend and `Heatmap` for a two-dimensional value matrix.

## Data shape

- `data` contains one row per bar, ordered oldest first.
- `data-key` selects the status and defaults to `status`.
- `name-key` selects the label and bar identity; it defaults to `date`.
- Built-in statuses are `up`, `degraded`, `down`, and `maintenance`; custom status strings need their own colors and labels.

## Minimal example

```vue
<script setup lang="ts">
import { Tooltip, Tracker } from 'vccs'

const data = [
  { date: '2026-08-01', status: 'up' },
  { date: '2026-08-02', status: 'up' },
  { date: '2026-08-03', status: 'degraded' },
  { date: '2026-08-04', status: 'up' },
  { date: '2026-08-05', status: 'down' },
  { date: '2026-08-06', status: 'up' },
  { date: '2026-08-07', status: 'maintenance' },
]
</script>

<template>
  <Tracker
    :data="data"
    :height="32"
  >
    <Tooltip :cursor="false" />
  </Tracker>
</template>
```

## Chart-specific rules

- Keep input rows oldest first; the component does not sort them into time order.
- Use a stable `name-key` so bars keep their identity when a moving window drops one row and appends another.
- For custom statuses, set both `status-colors` and `status-labels`; unknown statuses otherwise use the muted color and their raw text.
- Place `Tooltip` in the default slot. Cell events receive the original input row.
- Use the `#cell` slot to replace a bar; its slot cell wraps the domain row rather than being the row itself.

## Related guides

`installation`, `vue-api`, `typed-rows`, `ssr-testing`, `sparkline`, `heatmap`, `calendar-heatmap`.
