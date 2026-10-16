# Vue API rules

vccs keeps Recharts component names but uses Vue rendering and reactivity contracts. Apply these rules only after retrieving the chart guide; supported slots and models are component-specific.

## Slots replace render props

Use named slots for custom shapes, dots, labels, ticks, tooltip content, and cursors. A function passed to a prop such as `dot` or `content` is not a Vue render contract.

```vue
<Tooltip>
  <template #content="{ active, payload, label }">
    <div v-if="active">
      <strong>{{ label }}</strong>
      <div>{{ payload?.[0]?.name }}: {{ payload?.[0]?.value }}</div>
    </div>
  </template>
</Tooltip>
```

Do not spread tooltip slot props with `v-bind="tooltipProps"`; the project's ESLint auto-fix removes that spread. Destructure the slot instead. Each tooltip payload entry exposes the original row as `payload`.

Common slot payloads:

- Tooltip `content`: `{ active, payload, label, coordinate, accessibilityLayer }`. Payload entries carry `name`, `value`, `color`, `unit`, `dataKey`, and the original row as `payload`.
- Line, Area, and Scatter `dot` / `activeDot`: `{ cx, cy, index, value, payload }` plus the series' presentation attributes. Render SVG at `cx` and `cy`.

## Templates and events

- Write `class`, not `className`.
- Write SVG attributes in kebab-case, such as `stroke-width` and `stroke-dasharray`.
- Use Vue events such as `@click`, not callback props such as `:on-click`.
- Item event callbacks receive `(item, index, event)`.

## Models

- `v-model:active-index` is `number | null`; `null` means no active item. Never substitute `-1`.
- `v-model:range` on `Brush` is `BrushStartEndIndex | null`; `null` selects all rows and replaces separate start/end models.
- `v-model:hidden` on `Legend` controls hidden series keys.
- A supplied model value is controlled state. An omitted model lets the component keep local state.

Only bind a model documented by the retrieved chart guide. Do not infer that every chart root supports every model.

## Responsive size

Charts are responsive by default. Set a numeric `height` and let the chart fill its container's width; pass numeric `width` and `height` for a fixed box.

```vue
<LineChart
  :data="rows"
  :height="300"
>
  <!-- axes and series -->
</LineChart>
```

Do not add `ResponsiveContainer`; it is deprecated and scheduled for removal in 2.0.

## Data keys and missing values

`data-key` accepts a field name, numeric index, or accessor function. Set `name` or `name-key` when an accessor function's series needs a readable label. `NaN` and `Infinity` are missing values, not finite coordinates.

Retrieve `typed-rows` when wrong keys should become compile-time errors.

## Theme and selectors

A series without an explicit color uses `--v-charts-series-1` through `--v-charts-series-8`. Override those variables to theme a dashboard instead of repeating colors on every series.

Library classes use the `v-charts-` prefix. Item marks expose `data-v-charts-item-index`; use these hooks for CSS and tests rather than Recharts class names.

## Related guides

`installation`, `typed-rows`, `ssr-testing`.
