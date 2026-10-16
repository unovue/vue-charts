# Sankey

Use `Sankey` for weighted flows between arbitrary nodes, such as energy distribution or budget transfers. Use `JourneySankey` instead for ordered session paths and drop-off; use `Treemap` for a part-to-whole hierarchy.

## Data shape

- `data` is one object containing `nodes` and `links` arrays.
- Each node normally has a `name`; `name-key` selects another field for tooltip names.
- Each link has numeric `source` and `target` indices into `nodes`, plus a numeric `value`.
- Link width comes from `value`. Keep values positive and the graph acyclic.

## Minimal example

```vue
<script setup lang="ts">
import { Sankey, Tooltip } from 'vccs'

const data = {
  nodes: [
    { name: 'Coal' },
    { name: 'Gas' },
    { name: 'Electricity' },
    { name: 'Industry' },
    { name: 'Homes' },
  ],
  links: [
    { source: 0, target: 2, value: 30 },
    { source: 1, target: 2, value: 20 },
    { source: 2, target: 3, value: 28 },
    { source: 2, target: 4, value: 22 },
  ],
}
</script>

<template>
  <Sankey
    :data="data"
    :height="320"
    node-fill="#f97316"
    link-fill="#14b8a6"
  >
    <Tooltip :cursor="false" />
  </Sankey>
</template>
```

Animation is enabled by default; retrieve `ssr-testing` before taking screenshots or asserting exact geometry.

## Chart-specific rules

- Use numeric indices for `source` and `target`, not node names or object references.
- Link widths always use `value`; `data-key` changes the tooltip data key, not the layout.
- Invalid endpoints, non-positive values, and cyclic links are not rendered.
- Customize nodes and links with the `#node` and `#link` slots, not function-valued props.
- Adjust spacing with `node-width` and `node-padding`; use `margin` when labels need more room.

## Related guides

`installation`, `vue-api`, `ssr-testing`, `journey-sankey`, `treemap`.
