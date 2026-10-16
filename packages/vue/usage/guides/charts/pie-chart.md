# PieChart

Use `PieChart` for a small number of part-to-whole proportions. Use `BarChart` instead when precise comparison matters or there are many categories; use `Treemap` or `SunburstChart` for hierarchical parts.

## Data shape

- Pass an array of flat rows to `Pie data`; the chart root's `data` is the fallback when it is omitted.
- `data-key` selects the numeric value for each sector.
- `name-key` selects the sector label and defaults to `name`.
- Render one `Cell` per row when each sector needs an explicit color.

## Minimal example

```vue
<script setup lang="ts">
import { Cell, Pie, PieChart, Tooltip } from 'vccs'

const data = [
  { source: 'Organic search', visitors: 420 },
  { source: 'Direct', visitors: 280 },
  { source: 'Referral', visitors: 190 },
  { source: 'Social', visitors: 110 },
]

const colors = ['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']
</script>

<template>
  <PieChart :height="300">
    <Tooltip :cursor="false" />
    <Pie
      :data="data"
      data-key="visitors"
      name-key="source"
      :outer-radius="100"
    >
      <Cell
        v-for="(entry, index) in data"
        :key="entry.source"
        :fill="colors[index]"
      />
    </Pie>
  </PieChart>
</template>
```

Animation is enabled by default; retrieve `ssr-testing` before taking screenshots or asserting exact geometry.

## Chart-specific rules

- Set `inner-radius` above `0` for a donut; keep `outer-radius` larger than the inner radius.
- Use `start-angle` and `end-angle` for partial pies such as semicircles.
- Set `:label="true"` for default sector labels and `label-line` to control their connectors.
- `PieChart` uses item tooltips, so hovering a sector shows that sector rather than an axis-wide payload.
- Use `v-model:active-index` with a `number | null` when the active sector is controlled externally.

## Related guides

`installation`, `vue-api`, `typed-rows`, `ssr-testing`, `bar-chart`, `funnel-chart`, `treemap`, `sunburst-chart`.
