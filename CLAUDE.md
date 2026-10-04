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
packages/vue/src/           # Main library source (vccs)
├── cartesian/              # Area, Bar, Line, Scatter, Axis, Brush, CartesianGrid, ZAxis; funnel/ subdirectory
├── polar/                  # Pie, Radar, RadialBar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
├── chart/                  # Chart containers (AreaChart, BarChart, LineChart, ComposedChart, FunnelChart, etc.)
├── components/             # Legend, Tooltip, Text, Label, Cell
├── container/              # ResponsiveContainer, Surface, Layer
├── shape/                  # Rectangle, Symbols, Dot, Sector, Cross, Curve, Trapezoid
├── state/                  # Chart-local Vue domains, stable state view, selectors
├── animation/              # Animate component, motion-v utilities
├── context/                # provide/inject context providers
├── hooks/                  # Shared composition hooks
├── storybook/              # Stories
├── types/                  # Shared type definitions
├── utils/                  # Utility functions
└── index.ts                # Public API

docs/                       # Documentation site (Nuxt 3, Docus framework)
playground/nuxt/            # Nuxt 3 playground (Tailwind v4, shadcn-nuxt)
```

### Key Decisions

1. **Components**: `defineComponent` + JSX (not SFC)
2. **State**: Chart-local Vue factories expose immutable shallow snapshots through a stable read-only getter view; selector computeds track only domains they read.
3. **Context**: `provide/inject` for parent-child communication
4. **Chart Factory**: `generateCategoricalChart()` creates chart containers
5. **Animation**: `motion-v` with `Animate` wrapper
6. **Events**: Pointer, keyboard, touch, and synchronization handlers call chart-local typed operations directly.
7. **Build output**: ESM-only (`preserveModules: true`); `minify: false` — Rolldown's minifier renames variables colliding with Vue's `h`

## Code Conventions

### Naming
- Components: PascalCase; Directories: kebab-case; Hooks: `use` prefix; Types: `Props` suffix
- Type files: `type.ts`; Tests: `__tests__/*.spec.tsx`; Stories: `__stories__/*.stories.tsx`

### Component Pattern
```typescript
export const Component = defineComponent<PropsWithSVG>({
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

**Volar slot type preservation** (for compiled `.d.ts`):
```typescript
const _Component = defineComponent<PropsWithSVG>({ /* ... */ })
export const Component = _Component as typeof _Component & {
  new (): { $slots: ComponentSlots }
}
```

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
Three-tier z-ordering: cursor → graphical → label (via `Surface.vue`).

### Animation
- `useKeyedTransition` matches data keys and keeps exiting items mounted until completion.
- Interrupted transitions start from displayed geometry; connected shapes share one clock.
- `motion.ts` supplies entrance, update, and exit tokens; `transition` overrides their timing.
- Disabled animation, reduced motion, SSR, and hydration show final geometry immediately.
- Pie sweeps on entrance, labels fade after settling, and tooltip position uses persistent springs.

### Funnel
- Created via `generateCategoricalChart({ defaultTooltipEventType: 'item' })`
- Registers via `SetPolarGraphicalItem` (NOT `useSetupGraphicalItem`)
- **Coordinate calculation**: `x` uses `left` offset, `y` uses `top` offset — do NOT swap (was a ported bug fix)
- Animation: motion-v `transition: AnimationOptions` — NOT legacy Recharts `animationBegin`/`animationDuration`/`animationEasing`

### Tooltip
- **`#content` slot**: `<Tooltip><template #content="{ active, payload, label }">...</template></Tooltip>`
- Use destructured props, NOT `v-bind="tooltipProps"` — `@antfu/eslint-config` auto-fix strips `v-bind` spread
- `TooltipIndex` type is `string | null` (NOT a number)

### Testing
- `isAnimationActive={false}` for deterministic rendering
- `mockGetBoundingClientRect({ width, height })` in `beforeEach`
- Tests as render functions: `render(() => <Component />)`
- Public API imports from `@/index`; internal imports use direct paths
- CSS class selectors: `.v-charts-{component}` pattern (e.g. `.v-charts-line-curve`, `.v-charts-bar-rectangle`, `.v-charts-funnel`, `.v-charts-trapezoid`)
- All library CSS classes use the `v-charts-` prefix with kebab-case suffixes, including `.v-charts-responsive-container` and `.v-charts-surface`. User-provided classes and data attributes are preserved.
- Tooltip hover: `fireEvent(chart, new MouseEvent('mousemove', {...}))` on `.v-charts-wrapper` + 2x `nextTick()`; `defaultIndex` requires 3x `nextTick()`
- ResizeObserver: `MockResizeObserver` with `trigger(width, height)` method
- Animation in JSDOM: `motion-v` uses RAF — value stays at `from` when `isActive=true`; snaps to `to` when `isActive=false`

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
| `reselect` | Pure selector result memoization; argument caching disabled for the stable Vue state view |
| `motion-v` | SVG animations (external peer dep) |
| `victory-vendor` | D3 math/scale utilities |
| `lodash-es` / `es-toolkit` | Utility functions |
| `@vueuse/core` | Vue composition utilities |

## Custom Notes

Add project-specific notes here. This section is never auto-modified.
