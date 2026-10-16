# Typed chart rows

A child component cannot infer the row type from its chart root's `data`. Create row-typed component aliases once when wrong `data-key` values or untyped tooltip rows should become compile-time errors.

## Minimal example

```vue
<script setup lang="ts">
import { Area, AreaChart, Tooltip, XAxis, defineChartComponents } from 'vccs'

interface Visit {
  date: string
  desktop: number
  mobile: number
}

defineProps<{ visits: Visit[] }>()

const Chart = defineChartComponents<Visit>()({ AreaChart, Area, XAxis, Tooltip })
</script>

<template>
  <Chart.AreaChart
    :data="visits"
    :height="300"
  >
    <Chart.XAxis data-key="date" />
    <Chart.Area data-key="desktop" />
    <Chart.Area data-key="mobile" />
    <Chart.Tooltip />
  </Chart.AreaChart>
</template>
```

`Chart.Area data-key="tablet"` now fails typechecking because `tablet` is not a key of `Visit`. Tooltip content created through `Chart.Tooltip` receives payload entries whose `payload` is `Visit`.

## Rules

- Select every component used with that row type in one `defineChartComponents<Row>()({ ... })` call; use the resulting aliases in the template.
- The runtime component references are unchanged. This helper narrows declarations, not behavior.
- Only selected components are referenced by the consumer bundle.
- Standalone charts can infer rows from `data`; use their retrieved guide's generic pattern when explicit aliases are unnecessary.
- Import reusable model and payload types such as `BrushStartEndIndex`, `TooltipActiveIndex`, `TooltipPayloadEntry`, and `TooltipPayload` from `vccs`. Runtime `*VueProps` objects and internal context helpers are not public.

## Related guides

`installation`, `vue-api`, `ssr-testing`.
