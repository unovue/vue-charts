# JourneySankey

Use `JourneySankey` for whole journeys through ordered steps, including path highlighting and drop-off. Use `Sankey` instead for an arbitrary flow graph; use `FunnelChart` when only stage totals matter and individual paths do not.

## Data shape

- `data` is an array with one row per observed journey.
- `path` is an ordered array of page or event names; `count` is the number of sessions that took that path.
- `path-key` and `data-key` select different row fields when your names differ.
- The same name at different steps represents different nodes.

## Minimal example

```vue
<script setup lang="ts">
import { JourneySankey, Tooltip } from 'vccs'

const journeys = [
  { path: ['/', '/pricing'], count: 6 },
  { path: ['/', '/pricing', '/signup'], count: 4 },
  { path: ['/', '/docs'], count: 3 },
  { path: ['/blog/launch', '/pricing', '/signup'], count: 2 },
]
</script>

<template>
  <JourneySankey
    :data="journeys"
    :height="320"
    color="#f97316"
  >
    <Tooltip :cursor="false" />
  </JourneySankey>
</template>
```

Animation is enabled by default; retrieve `ssr-testing` before taking screenshots or asserting exact geometry.

## Chart-specific rules

- Keep complete paths as input. Do not pre-convert them into Sankey `nodes` and `links`; whole paths are what preserve drop-off and exact-journey pinning.
- Set `steps` to limit the displayed columns. Longer journeys are cut to that many steps.
- Set `:exits-known="false"` when journeys were truncated before you received them, so their endpoints are not presented as session exits.
- Click a node or band to pin the largest journey through it. Use `v-model:pinned` with a `string[] | null` ref to read or control the pinned path.
- Set `:headers="false"` to hide step headers; use `color` and `exit-color` to distinguish continuing sessions from exits.

## Related guides

`installation`, `vue-api`, `typed-rows`, `ssr-testing`, `sankey`, `funnel-chart`.
