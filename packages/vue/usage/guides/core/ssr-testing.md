# SSR and deterministic testing

Server-rendered charts normally preserve their entrance start, then animate after hydration when they enter the viewport. Do not mistake that intended entrance state for missing SVG or a hydration failure.

## Complete server HTML

For a complete chart without client JavaScript, provide numeric `width` and `height` and disable animation on the chart root:

```vue
<AreaChart
  :data="data"
  :width="900"
  :height="250"
  :is-animation-active="false"
>
  <Area data-key="desktop" />
</AreaChart>
```

Disabling animation alone does not reveal an unmeasured responsive chart. With only `height`, the server reserves a box using an initial width and the browser measures the real width later.

Do not add `ClientOnly` to solve chart SSR. Use it only when the data itself exists exclusively in the browser.

## Nuxt

Retrieve `installation` and register `vccs/nuxt` under Nuxt 4. The module handles component and composable registration; fixed-size SSR needs no client-only wrapper.

## Deterministic tests and screenshots

Set `is-animation-active` to `false` on the chart root, or on an individual series when only that series must be still:

```vue
<BarChart
  :data="rows"
  :height="300"
  :is-animation-active="false"
>
  <Bar data-key="desktop" />
</BarChart>
```

The chart value supplies defaults to its items; an explicit series value overrides it. Disable animation before exact geometry assertions, screenshots, or pixel-exact SSR comparisons.

In component tests, measure the container deliberately and assert library behavior through public classes such as `.v-charts-surface` and item attributes such as `data-v-charts-item-index`. Do not depend on generated SVG ids.

Charts follow the operating system's reduced-motion setting, but tests must not depend on the host setting: disable animation explicitly.

## Related guides

`installation`, `vue-api`, `typed-rows`.
