# CLAUDE.md

## Overview

**vccs** is a Vue 3 port of [Recharts](https://recharts.org/): composable chart components written
with `defineComponent` and JSX. When you port behavior, compare with the Recharts source. pnpm
workspace: `packages/vue` (the library, published as `vccs`), `docs` (Nuxt 4 + Docus),
`playground/nuxt` (Nuxt 4 + shadcn-vue, installs the library through `vccs/nuxt`), and the Nuxt
SSR fixture in `packages/vue/test/fixtures/nuxt-app`.

## Commands

```bash
pnpm build                # build the library (most checks need dist/)
pnpm dev                  # rebuild the library on change
pnpm test                 # unit tests (vitest); pnpm test <file> runs one file
pnpm test:coverage        # unit tests with coverage
pnpm lint                 # ESLint, zero warnings
pnpm typecheck            # vue-tsc for the library, including the type probes
pnpm docs                 # docs site (Nuxt dev server)
pnpm play                 # playground (Nuxt dev server)
pnpm verify               # the gates and a verdict table (~15 min); --quick skips browsers,
                          # --release adds motion geometry and the playground sweep
pnpm lab <command>        # motion instruments: film, timing, seen, dev (never a gate)
pnpm compare:upstream     # bundle, dependency and line comparison with vccs 0.6.0
```

`VERIFY.md` lists every gate (what it proves, its tier and latest result) and every instrument.
To debug an animation, see "Debug a motion bug" in `packages/vue/test/lab/README.md`. Browser checks use
`scripts/lib/browser.mjs`; `VCCS_PORTS=4620-4629` moves all check servers into one port range.

**CI** (`test.yml`, PRs to `main`, Node 22) runs the fast checks in five jobs: `test`, `consumers`,
`motion`, `package` and `docs`. `release-check.yml` (manual) runs the slow browser gates (the `--release`
tier) and the benchmark against vccs 0.6.0.

## Architecture

```
packages/vue/src/           # Library source (published as vccs)
├── model/                  # One Vue model per chart: createChart/useChart, registries, axis, polar, tooltip, legend, brush
├── core/                   # Pure math (layout, scales, series geometry, tooltip payloads); no Vue imports
├── chart/                  # Chart roots (chartRoot in generateCategoricalChart.tsx), ChartShell, ChartSurface.vue, standalone charts
├── cartesian/              # Area, Bar, Line, Scatter, axes, Brush, CartesianGrid, ErrorBar, Reference*; funnel/
├── polar/                  # Pie, Radar, RadialBar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
├── components/             # Legend, Tooltip, Text, Label, LabelList, Cell, Customized (deprecated)
├── container/              # Surface, Layer, ResponsiveContainer (deprecated, D-21)
├── shape/                  # Rectangle, Symbols, Dot, Sector, Cross, Curve, Polygon, Trapezoid
├── animation/              # Keyed transitions, motion tokens, reduced motion, moving labels
├── events/                 # Pointer, keyboard, touch and sync handlers
├── context/ hooks/         # Shared provide/inject keys and composables (publicHooks.ts is public)
├── types/ utils/ test/     # Shared types, helpers, test helpers and vue-tsc type probes (test/types)
├── index.ts                # Public API: explicit export list
├── publicProps.ts          # Public XxxProps types, derived from the components
├── componentNames.ts       # Component list for vccs/nuxt, vccs/resolver and the docs coverage check
├── nuxt.ts                 # Nuxt module (vccs/nuxt)
└── resolver.ts             # unplugin-vue-components resolver (vccs/resolver)

scripts/                    # Release checks (see VERIFY.md) and their helpers in scripts/lib/
internals/                  # decisions.md (library; docs-site design is in docs/adr/), open-items.md, migrations.md
```

### Key decisions (full list with reasons: `internals/decisions.md`)

1. **Components**: `defineComponent` + JSX, not SFC (the only SFC is `chart/ChartSurface.vue`).
2. **State**: one chart model per chart, created once in the chart's `EffectScope` (`createChart`,
   read with `useChart()`). Plain functions that return computeds and getters: no store, no
   classes, no event bus, no props copied into state by watchers. One owner per concept.
3. **Registration**: series, axes, tooltip entries and legend entries register through
   `createRegistry()` and unregister when their scope ends.
4. **Math**: `core/` holds pure functions with no Vue imports; the model calls them in computeds.
5. **Chart roots**: cartesian and polar charts and `FunnelChart` are
   `defineComponent({ ...chartRoot(options), props })`. The standalone charts (BarList, Sparkline,
   Tracker, Heatmap, CalendarHeatmap, CohortChart, JourneySankey, Sankey, Treemap, SunburstChart)
   do not use the cartesian engine; all but BarList (plain HTML) render through `ChartShell`.
6. **Animation and events**: keyed `motion-v` transitions with shared tokens; typed Vue emits.
7. **Build output**: ESM only (`preserveModules: true`); `minify: false` because Rolldown's
   minifier renames variables that collide with Vue's `h`.

## Code conventions

Components PascalCase, directories kebab-case, composables `use…`, prop types `…Props`; props in
`type.ts`, tests in `__tests__/*.spec.tsx`. `@/` is `packages/vue/src/`; use `import type`.

```typescript
// type.ts: runtime props, typed with ChartDataKey; no `any`.
export const LineVueProps = {
  dataKey: { type: [String, Number, Function] as PropType<ChartDataKey>, required: true as const },
}
export type LineInput = VuePropsToType<typeof LineVueProps>

// Line.tsx: export the component directly.
export const Line = defineComponent({
  name: 'Line',
  emits: lineEvents.emits,
  props: LineVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<LineSlots>,
  setup(inputProps, { attrs, slots, emit }) {
    const props = useSeriesProps(inputProps, ['stroke'])
    lineEvents.provide(emit)
    const { data } = useSetupGraphicalItem(props, 'line')
    return () => null // render the series here
  },
})
```

`slots: Object as SlotsType<…>` types template slots in source and in the emitted `.d.ts`; do not
add a constructor cast for `$slots`. Public prop types are derived in `publicProps.ts`
(`export type LineProps = InstanceType<typeof Line>['$props']`), never written by hand.

## Key patterns

- **Porting**: React state and effects become `ref`/`computed`/`watch`; context becomes
  `provide`/`inject`; JSX uses `class` and kebab-case SVG attributes.
- **Slots, not VNode props**: customization uses named slots (`shape`, `activeBar`, `dot`,
  `activeDot`, `label`, `content`, `cursor`, `tick`, `horizontal`, `vertical`).
- **D3**: call `toRaw()` on rows before you pass them to D3 functions (Vue proxies break D3).
- **SVG layers**: cursor → graphical → label tiers, provided by `chart/ChartSurface.vue`; series
  teleport into their tier.
- **Animation**: `useKeyedTransition` matches data keys, keeps exiting items until they finish, and
  starts an interrupted transition from the displayed geometry. `animation/motion.ts` holds the
  tokens; `transition` overrides them. No animation, reduced motion and SSR show the final geometry.
- **Funnel**: `Funnel` registers in `useChart().items.polar` like Pie. Its `x` uses the `left`
  offset and `y` the `top` offset; do not swap them (a ported bug fix).
- **Tooltip**: custom content uses the `#content` slot with destructured props, not
  `v-bind="tooltipProps"` (the ESLint auto-fix strips `v-bind` spreads). Active indexes are
  `number | null` (`TooltipActiveIndex`), also in `v-model:active-index`.

## Testing

- Name the realistic wrong behavior a test catches before you write it. A bug fix gets one
  regression test, proved with a temporary reverse patch (never `git stash`).
- Render with `render(() => <Chart …/>)` and import from `@/index`. Use `isAnimationActive={false}`
  for exact geometry and `mockGetBoundingClientRect` in `beforeEach`.
- Tooltip hover: `fireEvent(wrapper, new MouseEvent('mousemove', …))` on `.v-charts-wrapper`,
  then 2× `nextTick()`; a default active index needs 3× `nextTick()`.
- Library classes use the `v-charts-` prefix (`.v-charts-line-curve`, `.v-charts-surface`); item
  marks carry `data-v-charts-item-index`.
- Type contracts: vue-tsc probes in `src/test/types/` (`@ts-expect-error` / `@vue-expect-error`
  for what must fail). The packed consumer check reuses them.

## Docs

Demos use the palette `#f97316`, `#14b8a6`, `#f59e0b`, `#06b6d4`, add `:cursor="false"` to
`<Tooltip>`, and embed with `::chart-demo{src="…"}::`. Style with Tailwind v4 utilities
(`border-(--color-border)`); buttons use `DsButton`. Every public component needs a page title,
heading or table entry (`node scripts/check-docs-coverage.mjs`).

## Dependencies

Peers: `vue` ^3.5, `motion-v` ^2.4 (animation) and `@nuxt/kit` ^4 (only for `vccs/nuxt`). Runtime:
`d3-scale`, `d3-shape`, `d3-hierarchy`, `d3-sankey`, `d3-time`, `d3-color` (scales, shapes,
layouts), `es-toolkit`, `@vueuse/core` and `decimal.js-light` (exact tick arithmetic).
