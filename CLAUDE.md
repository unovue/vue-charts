# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow

- Enter plan mode for non-trivial tasks (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan — don't keep pushing
- Use subagents to keep main context clean; one task per subagent
- After corrections: update `tasks/lessons.md` with the pattern
- Never mark a task complete without proving it works (run tests, check logs)
- Autonomous bug fixing: just fix it, don't ask for hand-holding

## Task Management

1. Write plan to `tasks/todo.md` with checkable items
2. Check in before starting implementation
3. Mark items complete as you go; capture lessons in `tasks/lessons.md`

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Minimal code impact.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Only touch what's necessary. Avoid introducing bugs.

## Overview

**Vue Charts (vccs)** — An unofficial Vue 3 port of [Recharts](https://recharts.org/). Composable charting components built with Vue 3 Composition API + JSX/TSX.

- When porting, refer to React source for behavior parity
- Monorepo: `vccs` (library) + `play` (Nuxt playground) + `docs` (Nuxt docs site), managed by pnpm workspaces

## Build & Development Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Watch mode
pnpm build                # Build library (alias for --filter vccs build)
pnpm test                 # Run tests
pnpm test:coverage        # Tests with coverage
pnpm storybook            # Storybook
pnpm play                 # Playground
pnpm docs                 # Docs site (Nuxt 3, port 3001)
pnpm pub:release          # Publish

# Run specific test
pnpm test packages/vue/src/chart/__tests__/AreaChart.spec.tsx
```

**CI** (`.github/workflows/test.yml`): triggers on PRs to `main`; runs `pnpm install --frozen-lockfile` → `pnpm --filter vccs build` → `pnpm test` on Node 20 / ubuntu-latest.

## Architecture

```
packages/vue/src/           # Library source (published as vccs)
├── model/                  # One Vue model per chart: createChart/useChart, registries, axis, polar, tooltip, legend, brush
├── core/                   # Pure math (layout, scales, series geometry, tooltip payloads); no Vue imports
├── chart/                  # Chart containers: generateCartesianChart/PolarChart/RadialChart/FunnelChart; ChartShell for standalone charts
├── cartesian/              # Area, Bar, Line, Scatter, Axis, Brush, CartesianGrid, ZAxis, ErrorBar; funnel/
├── polar/                  # Pie, Radar, RadialBar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
├── components/             # Legend, Tooltip, Text, Label, LabelList, Cell
├── container/              # Surface, Layer, ResponsiveContainer (deprecated, D-21)
├── shape/                  # Rectangle, Symbols, Dot, Sector, Cross, Curve, Trapezoid
├── animation/              # Keyed transitions, motion tokens, reduced motion, moving labels
├── events/                 # Pointer, keyboard, touch and sync handlers
├── context/ hooks/         # Shared provide/inject keys and composables
├── types/ utils/           # Shared types and helpers
├── test/                   # Test helpers and vue-tsc type probes (test/types)
├── index.ts                # Public API: explicit export list
├── nuxt.ts                 # Nuxt module (vccs/nuxt)
└── resolver.ts             # unplugin-vue-components resolver (vccs/resolver)

docs/                       # Documentation site (Nuxt, Docus)
playground/nuxt/            # Nuxt playground (Tailwind v4, shadcn-nuxt)
scripts/                    # Release checks: verify, motion lab, check:play, check:docs, check:seen, bench, bundle, code
internals/release-1.0/      # 1.0 run: PLAN, DECISIONS, PROGRESS, LATER, reviews
```

### Key Decisions

1. **Components**: `defineComponent` + JSX (not SFC).
2. **State**: one chart model per chart, created once in the chart's `EffectScope` (`createChart`,
   read with `useChart()`). It is plain functions returning computeds and getters: no store, no
   classes, no event bus, no props copied into state by watchers. One owner per concept.
3. **Registration**: series, axes, tooltip entries and legend entries register through
   `createRegistry()` (`useChart().items.polar.register(…)`, `tooltip.entries.register(…)`) and
   unregister on unmount.
4. **Math**: `core/` holds pure functions with no Vue imports; models call them inside computeds.
5. **Standalone charts** (BarList, Sparkline, Tracker, Heatmap, CalendarHeatmap, CohortChart,
   JourneySankey) render through `ChartShell` and a `TooltipSource`, without the cartesian engine.
6. **Animation**: keyed transitions on `motion-v` with shared motion tokens (see Animation).
7. **Events**: pointer, keyboard, touch and sync handlers call typed chart operations directly.
8. **Build output**: ESM only (`preserveModules: true`); `minify: false` because Rolldown's
   minifier renames variables that collide with Vue's `h`.

## Code Conventions

### Naming
- Components: PascalCase; Directories: kebab-case; Hooks: `use` prefix; Types: `Props` suffix
- Type files: `type.ts`; Tests: `__tests__/*.spec.tsx`; Stories: `__stories__/*.stories.tsx`

### Component Pattern
```typescript
export const Component = defineComponent({
  name: 'Component',
  props: ComponentVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<Slots>,
  setup(props, { attrs, slots }) {
    useSetupGraphicalItem(props, 'itemType')
    const { ...data } = useComponentHook(props, attrs)
    return () => null // Return the component's JSX here.
  },
})
```

Export the component directly. `slots: Object as SlotsType<Slots>` types template slots in
source and in the emitted `.d.ts`; do not add a constructor cast for `$slots`. A component that
forwards undeclared attributes to its root SVG element is wrapped once:
`export const Component = forwardsSvgAttributes(defineComponent({ ... }))` (`utils/attributes.ts`),
so strict templates accept `stroke-dasharray`, `data-*` and `aria-*`. Public `XxxProps` types use
`DeclaredProps<typeof Component>` and stay limited to the declared props and events.

### Props Pattern
```typescript
export const ComponentVueProps = {
  dataKey: { type: [String, Number, Function] as PropType<DataKey<any>>, required: true },
  fill: { type: String, default: undefined },
}
export type ComponentPropsWithSVG = WithSVGProps<VuePropsToType<typeof ComponentVueProps>>
```

### Imports
- `@/` → `packages/vue/src/`
- Prefer `import type` for type-only imports

## Key Patterns

### Porting from Recharts
- React `useState`/`useEffect` → Vue `ref`/`watch`; Context → `provide`/`inject`
- React `useMemo`/`useCallback` → Vue `computed` / plain functions
- React JSX → Vue JSX (`class` not `className`, kebab-case SVG attrs)

### Slots (not VNode props)
Customization uses **named slots**: `shape`, `activeBar`, `dot`, `activeDot`, `label`, `content`, `cursor`, `tick`, `horizontal`, `vertical`.

### Vue + D3
- Always `toRaw(entry)` before passing to D3 scale functions (Vue Proxy breaks D3)

### SVG Layers (Teleport)
Three-tier z-ordering: cursor → graphical → label (via `Surface.tsx`).

### Animation
- `useKeyedTransition` matches data keys and keeps exiting items mounted until they finish.
- Interrupted transitions start from the displayed geometry; connected shapes share one clock.
- `motion.ts` holds the entrance, update and exit tokens; the `transition` prop overrides timing.
- Charts pass animation defaults to their series; an item's own `is-animation-active` wins.
- Disabled animation, reduced motion, SSR and hydration show the final geometry at once.
- The motion lab (`pnpm motion:report --prod --check`) compares frames exactly; only the entries
  in `packages/vue/test/lab/accepted-flags.json` may remain, each with its reason.

### Funnel
- `FunnelChart` comes from `generateFunnelChart`; `Funnel` registers in `useChart().items.polar` like Pie.
- **Coordinate calculation**: `x` uses the `left` offset, `y` the `top` offset. Do not swap
  them (a ported bug fix).
- Animation uses the `transition` prop, not the legacy Recharts `animationBegin`/`animationDuration`.

### Tooltip
- **`#content` slot**: `<Tooltip><template #content="{ active, payload, label }">...</template></Tooltip>`
- Use destructured props, NOT `v-bind="tooltipProps"`: the `@antfu/eslint-config` auto-fix strips
  `v-bind` spreads.
- Active indexes are `number | null` (`TooltipActiveIndex`), also in `v-model:active-index`.
- Two Tooltips that both control one chart warn once; the first one wins.

### Testing
- Follow the global test rules: name the wrong behavior a test catches, test the public API,
  one regression test per bug, proven with a reverse patch (never `git stash`).
- `isAnimationActive={false}` for deterministic rendering; motion specs use the shared motion
  clock helper in `src/test/`.
- `mockGetBoundingClientRect({ width, height })` in `beforeEach`; `MockResizeObserver` has
  `trigger(width, height)`.
- Tests as render functions: `render(() => <Component />)`. Public API imports come from
  `@/index`; internal imports use direct paths.
- All library classes use the `v-charts-` prefix in kebab case (`.v-charts-line-curve`,
  `.v-charts-responsive-container`, `.v-charts-surface`). Item marks carry
  `data-v-charts-item-index`.
- Tooltip hover: `fireEvent(chart, new MouseEvent('mousemove', {...}))` on `.v-charts-wrapper`,
  then 2× `nextTick()`; a default active index needs 3× `nextTick()`.
- Type contracts: vue-tsc probes in `src/test/types/` (with `// @ts-expect-error` for what must fail).
- Release checks: `pnpm verify` (or `--quick` without browsers); `VERIFY.md` lists each check.

### Storybook
- Story titles must match Recharts conventions
- Clone array data in `render`: `data={[...data1]}` (Vue proxy errors)

### Docs Demos
- Color palette: `#f97316` orange, `#14b8a6` teal, `#f59e0b` amber, `#06b6d4` cyan
- Always add `:cursor="false"` to `<Tooltip>` in docs demos
- MDC syntax: `::chart-demo{src="..."}::` to embed live demos
- Tailwind v4 syntax: `border-(--color-border)` (NOT v3 `border-[--color-border]`)

### Docs Styling (fixed rule)
- **Tailwind utilities wherever possible** — no scoped CSS unless the style truly can't be expressed as a utility (e.g. `@keyframes`, third-party `:deep` overrides)
- Design tokens via v4 paren syntax: `bg-(--ds-surface)`, `duration-(--ds-t-colour)`, `ease-(--ds-ease)`
- Buttons use the `DsButton` component (`variant="solid" | "ghost"`), never raw classes

## Dependencies

| Library | Purpose |
|---------|---------|
| `motion-v` | Animation engine (peer dependency) |
| `d3-scale`, `d3-shape`, `d3-hierarchy`, `d3-sankey`, `d3-time`, `d3-color` | Scales, shapes and layouts |
| `es-toolkit` | Small utilities |
| `@vueuse/core` | Vue composition utilities |
| `decimal.js-light` | Exact tick arithmetic |

## Custom Notes

Add project-specific notes here. This section is never auto-modified.
