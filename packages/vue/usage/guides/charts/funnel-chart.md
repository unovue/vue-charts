# FunnelChart

Use `FunnelChart` for values and drop-off across ordered conversion stages. Use `BarChart` for unordered categories; use `JourneySankey` when users can take branching paths instead of one shared sequence.

## Data shape

- Pass an array of flat rows to `Funnel data`; the chart root's `data` is the fallback when it is omitted.
- Keep rows in process order, with one row per stage.
- `data-key` selects the numeric stage value.
- `name-key` selects the stage label and defaults to `name`.

## Minimal example

```vue
<script setup lang="ts">
import { Cell, Funnel, FunnelChart, Tooltip } from 'vccs'

const data = [
  { stage: 'Visited', users: 1000 },
  { stage: 'Added to cart', users: 680 },
  { stage: 'Reached checkout', users: 420 },
  { stage: 'Purchased', users: 260 },
]

const colors = ['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']
</script>

<template>
  <FunnelChart :height="300">
    <Tooltip :cursor="false" />
    <Funnel
      :data="data"
      data-key="users"
      name-key="stage"
    >
      <Cell
        v-for="(entry, index) in data"
        :key="entry.stage"
        :fill="colors[index]"
      />
    </Funnel>
  </FunnelChart>
</template>
```

Animation is enabled by default; retrieve `ssr-testing` before taking screenshots or asserting exact geometry.

## Chart-specific rules

- Use one `Cell` per row for explicit segment colors; otherwise `fill` supplies the series color.
- Place `LabelList` inside `Funnel` for stage values or custom labels.
- Set `last-shape-type="rectangle"` to keep the final segment's width instead of narrowing to a point.
- Set `:reversed="true"` to flip the funnel vertically; keep the source rows in process order.
- Use `width` and the chart's `margin` for sizing. `Funnel` has no public `x` or `y` props; custom `#shape` geometry already applies the left offset to `x` and the top offset to `y`, so do not swap or re-add them.

## Related guides

`installation`, `vue-api`, `typed-rows`, `ssr-testing`, `pie-chart`, `bar-chart`, `journey-sankey`.
