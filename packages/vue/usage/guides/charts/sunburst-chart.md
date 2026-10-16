# SunburstChart

Use `SunburstChart` for two or three levels of a part-to-whole hierarchy as concentric rings. Use `PieChart` for one flat level and `Treemap` when many leaves need more readable areas and labels.

## Data shape

- `data` is one root object, not an array. The root is not drawn; its `children` form the inner ring.
- Each node has a `name` by default and may have nested `children`.
- Leaves need a numeric `value`; `data-key` and `name-key` select different fields.
- Parent values are the sum of their children. A node may also provide `fill`.

## Minimal example

```vue
<script setup lang="ts">
import { SunburstChart, Tooltip } from 'vccs'

const data = {
  name: 'Traffic',
  children: [
    {
      name: 'Search',
      fill: '#f97316',
      children: [
        { name: 'Google', value: 420 },
        { name: 'Bing', value: 90 },
      ],
    },
    {
      name: 'Social',
      fill: '#14b8a6',
      children: [
        { name: 'LinkedIn', value: 150 },
        { name: 'Mastodon', value: 80 },
      ],
    },
    { name: 'Direct', value: 160, fill: '#f59e0b' },
  ],
}
</script>

<template>
  <SunburstChart
    :data="data"
    :height="320"
    :inner-radius="40"
    title="Traffic by source"
  >
    <Tooltip :cursor="false" />
  </SunburstChart>
</template>
```

Animation is enabled by default; retrieve `ssr-testing` before taking screenshots or asserting exact geometry.

## Chart-specific rules

- Give the root at least one child; a root without `children` renders no sectors.
- Set `fill` on a top-level group to color its branch. A child's own `fill` overrides its branch color.
- Use `inner-radius` for the center hole and `outer-radius` when the automatic radius does not fit your layout.
- Use `ring-padding` to separate rings and `padding` to separate sectors by angle.
- Customize sectors with the `#content` slot, not a function-valued `content` prop.

## Related guides

`installation`, `vue-api`, `ssr-testing`, `treemap`, `pie-chart`.
