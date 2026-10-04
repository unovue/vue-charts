# vccs: the dream version

Status: proposal, 2026-10-04. Based on a full review of `refactor/vue-chart-context`
(an Opus read plus an independent Codex review), the running Nuxt playground, shadcn-vue
(`external/shadcn-vue`, v2.7.4), and the Vue/Nuxt reference repos in `~/Git/alignment`.

## Status (2026-10-04)

Accomplished on branch `feat/vision` (local, not pushed). All done-checks in the run's GOAL.md pass:
1,089 tests in shuffled order, typecheck, build, size budgets, strict packed Vite and Nuxt consumers,
Nuxt SSR fixture, browser motion check (12 scenarios, 0 recreated elements, ~60 fps), docs prerender,
playground build. Redux and Immer are gone. Follow-ups: teleported series move into their z-order
layer by remounting once after mount (a disabled-Teleport approach fails Vue's SSR hydration);
the docs prerender logs a 404 for the landing content query; repository-wide lint has pre-existing errors.

## One sentence

The chart library a Vue developer would design if Recharts did not exist: Vue reactivity and
`v-model` instead of callbacks, real SVG from the server, shadcn theming through CSS variables
with no overrides, and motion that never jumps.

## Where we stand (evidence, not opinion)

Keep this foundation. Do not restart.

| Area | State | Evidence |
|---|---|---|
| Chart coverage | Near parity with Recharts 3: Area, Bar, Line, Scatter, Composed, Pie, Radar, RadialBar, Funnel, Treemap, Sankey, Sunburst, plus Brush, Reference*, ErrorBar, Legend, Tooltip, syncId | 27.7k source lines |
| Tests | 791/791 pass, 75 files | `pnpm --filter vccs exec vitest run` |
| Build | Clean, no TS diagnostics in the build | `pnpm build` |
| Template API | Already reads like Vue: SFC, kebab-case props, named slots (`#content`, `#tick`, `#shape`) | docs demos, playground |
| Branch work | Correct direction: lodash, eventemitter3, victory-vendor and vue-redux removed; events are composables; layout and data are Vue-owned | Codex: "continue, a restart is not justified" |

Rewriting would cost months to re-learn the edge cases that the ported Recharts calculations
already encode (domains, ticks, stacking, nice numbers, brush ranges). The dream version is
reached by changing the layers around that math, not the math.

### Confirmed defects (fix first)

1. **Brush is not exported.** `src/index.ts` → `cartesian/index.ts` never exports it; the build
   emits no Brush module. Users cannot import it. It is also not in the docs.
2. **Vue-style data updates are ignored.** With `reactive([...])` data, `data[0].uv = 100` and
   `data.push(...)` do not update the chart (verified: bar count stays 2 after a push). Only a new
   array works. On `main`, Immer froze the data and threw; now it fails silently.
   `getValueByDataKey` also calls `toRaw()`, which blocks dependency tracking.
3. **Dotted `dataKey` lookup changed** with the es-toolkit swap (`utils/chart.ts:108`): for
   `{ 'metrics.total': undefined, metrics: { total: 42 } }` lodash returned the default, es-toolkit
   returns 42 (Codex, confirmed by running both).
4. **Three CSS class prefixes**: `v-charts-*`, `vcharts-*` (`vcharts-surface`,
   `vcharts-responsive-container`) and leftover `recharts-*` (brush, area dot). The playground's
   `ChartContainer` targets `.v-charts-surface`, which does not exist, so its outline rule is dead.
5. **No server rendering of charts.** In Nuxt the SSR HTML contains only an empty
   `vcharts-responsive-container`; the chart appears after hydration (layout shift, blank box).
6. **IDs are a module counter** (`utils/data-utils.ts` `uniqueId`). On the server the counter is
   shared across requests, and server and client IDs differ. This will cause hydration mismatches
   as soon as charts render on the server. Vue 3.5 `useId()` is the fix.
7. **Bars remount on every data change.** `BarRectangles` keys each bar by its animated `x`, `y`
   and value, so every frame creates new keys. Measured: one Desktop→Mobile toggle removed and
   re-added all 91 bar nodes.
8. **Seven vacuous assertions** (`toBeGreaterThanOrEqual(0)` on lengths) in `Bar.test.tsx`,
   `Treemap.spec.tsx`, `sunburstUtils.spec.ts`. They cannot fail.
9. **Packaging:** peers say `vue >=3.0.0` and `motion-v >=2.0.0`, but the library is only built and
   tested on Vue 3.5 (pinned override 3.5.18); size-limit is set to 3.4 kB, which measures nothing.
   A strict consumer typecheck of `dist/index.d.ts` still shows 5 errors (motion-v/Vue
   `HTMLAttributes`, VueUse Bluetooth types).

Low severity: `BarRectangles` destructures `props` once in `setup` (`dataKey`, `isAnimationActive`,
`activeBar`), so those values go stale. I tested a dynamic `data-key` switch and saw no visible
effect, but it is a trap. There are also 68 Chinese comment lines, 418 `any`, and 44 `@ts-ignore`.

### The structural problem with the branch

The branch is sound but half-finished, and a half-finished state is the worst state:
two state systems (Redux + Vue `shallowRef`s) joined by a `computed` that spreads the whole root
on every change. Every `useAppSelector` reruns on every pointer move. Ten Redux domains remain.
The branch also spends all its effort on plumbing users cannot see, while the visible gaps
above stay open. The dream plan below reorders the work.

## Ecosystem alignment

| Reference | What they do | vccs today | Dream |
|---|---|---|---|
| shadcn-vue v2.7 (`registry/bases/reka/ui/chart`) | Charts on **Unovis**. `ChartContainer` still carries `.recharts-*` selectors copied from React shadcn (dead for Unovis). Tooltips are Vue components rendered to HTML strings (`componentToString`) | Not used by shadcn-vue yet | The chart engine behind shadcn-vue's chart registry. `#content` slot replaces the string hack; `ChartConfig` → CSS vars works unchanged |
| shadcn v4 conventions | `data-slot="chart"`, theme via CSS variables (`--chart-1..5`, `--border`, `--muted-foreground`) | Hardcoded `#ccc`, `#666`, `#fff`; shadcn must override them with `[stroke='#ccc']` attribute selectors | Every default color is a CSS variable with a fallback; `data-slot` on every part |
| Nuxt UI | Nuxt module + `./vite`/`./unplugin` entry for plain Vue, `motion-v`, `reka-ui`, `tailwind-variants` | Plain ESM package only; already uses motion-v (good, shared dependency) | `vccs/nuxt` module (auto-import, SSR defaults) and `vccs/resolver` for unplugin-vue-components |
| Vue core 3.5 | `useId`, `useTemplateRef`, `defineModel`, generic components, `watch` with `deep: number` | No `useId`, no `v-model`, no generics, only 2 components declare `emits` (34 React-style `on*` props) | All of these, as described below |
| Toolchain (Nuxt UI catalog) | TypeScript 6, vue-tsc 3, Vitest 4, ESLint 10 | TS 5.5 (overridden to 5.9), vue-tsc 2, Vitest 2, `@antfu/eslint-config` 2 | Same versions as the ecosystem; vue-tsc 3 matters for slot and generic typing |
| Upstream `unovue/vue-charts` | Active (last push 2026-10-02), owned by the shadcn-vue org | Our `main` is 8 commits behind (docs + a Pie Cell fill fix) | Work lands upstream in small PRs, not in a diverging fork |

## The dream, by principle

### 1. It feels like Vue, not React translated to Vue

```vue
<script setup lang="ts">
const rows = reactive<Visit[]>(await fetchVisits())
const range = ref({ start: 0, end: 30 })
const active = ref<number | null>(null)
const hidden = ref<string[]>([])
</script>

<template>
  <BarChart :data="rows">
    <!-- generic: data-key is typed as keyof Visit -->
    <XAxis data-key="date" />
    <Bar
      data-key="desktop"
      @click="openDay"
    />  <!-- typed emits, not on* props -->
    <Tooltip v-model:active-index="active" />    <!-- controlled or uncontrolled -->
    <Legend v-model:hidden="hidden" />           <!-- click to toggle series -->
    <Brush v-model:range="range" />
  </BarChart>
</template>
```

- **Reactive data just works.** `rows.push(x)` and `rows[0].desktop = 5` update the chart.
  Implementation: track the array and the fields that `dataKey`s read (`watch(..., { deep: 2 })`
  or a version counter), and remove `toRaw()` from the read path. Immutable replacement keeps working.
- **`v-model` for every piece of interactive state**: brush range, active index, hidden series,
  selected sector. Uncontrolled by default, controlled when bound.
- **Typed emits** (`@click`, `@hover`, `@animation-end`) with payload types; no `on*` props.
- **Generic components**: `data-key` autocompletes from the row type; slot props are typed.
- **Public composables** for custom parts: `useChart()`, `useXAxisScale()`, `useTooltip()`,
  `useActiveIndex()`, so custom shapes and overlays need no internal imports.

### 2. shadcn-native theming with zero overrides

- No hex defaults. Grid, axis, cursor, tooltip and dot colors read CSS variables with fallbacks,
  for example `stroke: var(--vc-grid, var(--border, #e5e7eb))`. Text uses `currentColor`.
- Series colors default to `var(--chart-1..5)`. With shadcn's `ChartConfig`, `var(--color-desktop)`
  works as it does today.
- Every part has a `data-slot` (`data-slot="chart-grid"`, `"chart-bar"`, `"chart-tooltip"`)
  and one class prefix. Styling is by slot, never by `[stroke='#ccc']`.
- Dark mode works with no extra code. The shadcn `ChartContainer` shrinks to the CSS-variable
  bridge and an aspect ratio, about 20 lines.

### 3. Nuxt first: real SVG from the server

- Charts render on the server from `width`/`height`, an `aspect` ratio, or an `initial-size`,
  then resize on the client with no layout shift. Responsive is the default, not a wrapper.
- `useId()` for every ID; no module-level state; every chart's state is created in `setup`.
- `vccs/nuxt` module: auto-imports with an optional prefix, SSR defaults, and a devtools tab
  that shows the chart's computed domains and ticks.
- Tested in a real Nuxt fixture: SSR HTML contains the SVG, hydration has no warnings, and
  two concurrent requests do not share state.

### 4. Motion that never jumps

Recharts animates by array index and restarts on each change. The dream does better:

- **Keyed transitions**: points match by category (the x value), not by index. Inserting a
  month at the front slides the bars instead of morphing every bar into its neighbour.
- **Enter, update, exit**: new bars grow from the baseline, removed bars shrink away, lines
  extend instead of jumping in length.
- **Interruptible**: a new change starts from the current on-screen value (Area already does
  this; Bar, Line, Pie and Radar should share one implementation).
- **Stable DOM**: keys never contain animated values; nodes are created once.
- **One API**: `:transition` (motion-v options, springs included) on every element, and
  `prefers-reduced-motion` respected everywhere (already true for `Animate`).
- **Tooltip and cursor glide** with a spring and never lag behind the pointer.
- **Frame budget as a test**: a 365-point area chart animates in a real browser with no
  frame above 16 ms on a mid-range laptop.

### 5. A clean architecture you can explain in three lines

1. **Core (no Vue):** pure TypeScript functions for scales, domains, ticks, stacking and
   layout, ported from the Recharts combiners. Unit-tested on their own.
2. **Chart state (Vue):** `createChart()` per chart builds a graph of `computed`s over
   registered items (`provide`/`inject`). No Redux, Immer or reselect. A pointer move changes
   only tooltip and cursor state; geometry does not recompute.
3. **Components (thin):** read computed geometry, render SVG, expose slots.

This is where the current branch is heading (`internals/migrations.md`). Finishing it is
what enables `v-model` for tooltip and brush, because these states must be Vue-owned first.

### 6. Accessible by default

The keyboard navigation and `accessibilityLayer` exist. Add: an accessible name and summary
(`role="img"` or `application` with `aria-describedby`), announcements of the active point,
a visible focus ring through a CSS variable, and an optional data-table slot for screen readers.

### 7. A package you can trust

- Peers: `vue ^3.5`, `motion-v ^2.4` (match Nuxt UI). Exports: `.`, `./nuxt`, `./resolver`.
- Consumer CI job: pack, install into a clean Vue and a clean Nuxt app, run `vue-tsc --strict`
  and a production build. Zero declaration errors.
- Real size budgets: measure today's tree-shaken AreaChart + axes + grid + tooltip
  (80.7 kB gzip without Vue and motion-v; Redux, Immer and es-toolkit are about 27 kB minified
  of it) and keep a budget per chart type in size-limit.
- Toolchain on the ecosystem versions; English comments; no `@ts-ignore` in `src`.

### 8. Docs and tests that prove it

- Every docs example is a copyable SFC; API tables generated from the prop types
  (`vue-component-meta`); the shadcn examples use the exact registry components.
- Tests through the public API, plus Vitest browser mode for interaction, animation frames
  and resize; Nuxt SSR/hydration fixture; screenshot tests for the shadcn examples.
- Remove assertions that cannot fail.

## Better than Recharts, concretely

| Recharts 3 | vccs dream |
|---|---|
| Animation by index; insert at front morphs every bar | Keyed enter/update/exit |
| Bars remount when values change (key contains coordinates) | Stable nodes |
| Callback props and controlled state by hand | `v-model` and typed emits |
| `dataKey` is a string | `data-key` typed from the row type |
| Blank until measured; needs `ResponsiveContainer` | SVG from the server, responsive by default |
| Hardcoded colors; shadcn overrides them with attribute selectors | CSS variables and `data-slot` |
| Redux store per chart | Fine-grained Vue `computed` graph |

## Roadmap

Order by user value. Each phase is a series of small upstream-ready PRs.

**Phase 0: make what exists correct (days)**
Export Brush and document it; one class prefix plus `data-slot`; restore lodash dotted-key
semantics; decide and implement reactive data (support mutation); `useId()`; stable bar keys;
remove vacuous tests; fix peer ranges and size-limit; merge upstream `main`.

**Phase 1: shadcn and Nuxt fit (1–2 weeks)**
CSS-variable theming; rewrite the shadcn `ChartContainer`/`ChartTooltipContent`/
`ChartLegendContent` on vccs; server rendering with initial size; `vccs/nuxt`; Nuxt SSR fixture
and packed-consumer CI.

**Phase 2: finish the state migration (2–3 weeks, timeboxed per domain)**
Tooltip first (unblocks `v-model:active-index`), then brush, legend, graphical items, axes,
polar. Remove the bridge, Redux, Immer and reselect together. Measure recomputation and size
before and after.

**Phase 3: motion (1–2 weeks)**
One shared keyed-transition primitive for Bar, Line, Area, Pie, Radar and RadialBar;
enter/exit; tooltip spring; browser frame-budget tests.

**Phase 4: Vue API polish (1–2 weeks)**
Generic components, typed emits, `v-model` everywhere, public composables, generated API
docs, accessibility additions. Then propose the shadcn-vue chart registry on vccs upstream.

## Decisions for Matthias

1. **Upstream or fork?** Recommendation: upstream (`unovue/vue-charts`). The shadcn-vue org owns
   it, and becoming the shadcn-vue chart engine only works there. Talk to the maintainers about
   this roadmap before Phase 1.
2. **Breaking changes before 1.0?** Recommendation: yes, once. A single release renames the
   class prefix, adds `data-slot`, moves `on*` props to emits (templates using `@event` keep
   working), and raises the Vue peer to ^3.5.
3. **Data mutation:** Recommendation: support deep mutation (Vue users expect it) and keep
   immutable replacement fast.
