# Treemap

Use `Treemap` to compare hierarchical part-to-whole values as rectangles, especially when there are many leaves. Use `PieChart` for a short flat list of proportions and `SunburstChart` when radial rings communicate the hierarchy better.

## Data shape

- `data` is an array of top-level nodes, not a single root object.
- Each node has a `name` by default and may have a `children` array.
- Leaves need a positive numeric `value`; `data-key` and `name-key` select different fields.
- Parent values are derived by summing their descendants, so do not add totals to parent rows.

## Minimal example

```vue
<script setup lang="ts">
import { Tooltip, Treemap } from 'vccs'

const data = [
  {
    name: 'Search',
    children: [
      { name: 'Google', value: 420 },
      { name: 'Bing', value: 90 },
    ],
  },
  {
    name: 'Social',
    children: [
      { name: 'LinkedIn', value: 150 },
      { name: 'Mastodon', value: 80 },
    ],
  },
  {
    name: 'Direct',
    children: [
      { name: 'Bookmarks', value: 160 },
      { name: 'Newsletter', value: 110 },
    ],
  },
]

const colors = ['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']
</script>

<template>
  <Treemap
    :data="data"
    :height="320"
    data-key="value"
    :colors="colors"
  >
    <Tooltip :cursor="false" />
  </Treemap>
</template>
```

Animation is enabled by default; retrieve `ssr-testing` before taking screenshots or asserting exact geometry.

## Chart-specific rules

- The default `type="flat"` displays leaves. Their `colors` entry comes from their top-level group.
- Set `type="nest"` for drill-down. Clicking a group shows its children and a breadcrumb trail for going back.
- Use `stroke` to change the rectangle border color.
- Customize rectangles and labels with the `#content` slot, not a function-valued `content` prop.

## Related guides

`installation`, `vue-api`, `ssr-testing`, `sunburst-chart`, `pie-chart`.
