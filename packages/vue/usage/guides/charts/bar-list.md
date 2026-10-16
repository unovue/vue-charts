# BarList

Use `BarList` for a compact ranked list with labels and inline magnitude bars. It is plain HTML, not an SVG chart; use `BarChart` when you need axes, stacked values, or multiple series.

## Data shape

- `data` contains one row per item.
- `name-key` selects the label and row identity; it defaults to `name`.
- `data-key` selects the numeric value; it defaults to `value`.
- Add `href-key` when a row field should turn its label into a link.
- Bar length is the value divided by the largest value, not the share of the total.

## Minimal example

```vue
<script setup lang="ts">
import { BarList } from 'vccs'

const data = [
  { name: '/', value: 1240, url: '/' },
  { name: '/pricing', value: 820, url: '/pricing' },
  { name: '/docs', value: 610, url: '/docs' },
  { name: '/blog', value: 330, url: '/blog' },
]
</script>

<template>
  <BarList
    :data="data"
    href-key="url"
    color="#f97316"
  />
</template>
```

## Chart-specific rules

- Rows sort by descending value by default; use `sort="none"` to preserve input order.
- Keep `name-key` stable across updates so a row keeps its identity when its rank changes.
- Use `value-formatter` for display text and `locale` for the default number format.
- Customize labels or values with the `#name` and `#value` slots, not function-valued render props.
- Adjust the HTML rows with `row-height` and `gap`; do not add Cartesian axes or series children.

## Related guides

`installation`, `vue-api`, `typed-rows`, `ssr-testing`, `bar-chart`, `tracker`.
