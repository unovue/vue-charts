# vccs 1.0: report for review

This report is for the vccs maintainer. It says what this branch changes compared with upstream
`main` (vccs 0.6.0, commit `f8c27e7`), why, what the checks prove, and what is still open.
Every number comes from a command you can run again; the command is named next to it. All were
measured on 2026-10-07 at `38abb40` on one Mac (Node 24), with other jobs running (load
average about 30).

## In one paragraph

vccs 1.0 keeps the Recharts port and its math, and replaces the Redux store with Vue
reactivity. The public API follows Vue conventions (`v-model`, events, named slots, typed
rows). Charts render on the server without hydration warnings, a Nuxt 4 module and a resolver
register the components, and seven new charts cover common dashboard needs. It is one breaking
release with a migration guide. A single chart is 27 % smaller than in 0.6.0 (gzip), six
runtime dependencies are gone, and the production code grew 5 % while it gained seven charts,
the Nuxt module and the resolver.

## What changed, and why

| Change | Why |
| --- | --- |
| **Redux removed.** Each chart builds one model with `createChart()` (`src/model/`). Chart props are read through getters, children register `computed` settings into registries, and every derived value is a `computed`. `src/state/`, `reselect`, `@reduxjs/*`, `immer` and `eventemitter3` are gone. | A store copy of the props was a second source of truth: it caused update bugs and extra watchers. Vue already tracks dependencies. Decisions D-5, D-6. |
| **`core/` and `model/` split.** The ported Recharts math (domains, scales, ticks, stacking, geometry) is plain functions in `src/core/`. `core/` must not import `vue`, the model, components or browser APIs; lint enforces it. | The math stays close to Recharts for parity and is testable without Vue. Each `createSelector([a, b], combine)` became `computed(() => combine(a.value, b.value))`. |
| **`ChartShell`** (`src/chart/ChartShell.tsx`): responsive size, wrapper, surface and pointer events for the standalone charts, which read a small `TooltipSource` instead of the cartesian model. | A Sparkline should not ship the cartesian engine. `pnpm check:bundle --assert-standalone` fails if it does. |
| **Typed rows.** `defineChartComponents<Row>()` returns components whose `data-key` must be a key of `Row`, with typed tooltip payloads. | Wrong keys were runtime surprises. A vue-tsc probe in this run reported all 33 wrong-key and wrong-row cases as type errors. |
| **Vue API.** `v-model:active-index` on Tooltip, Bar, Pie and the standalone charts; `v-model:range` on Brush; `v-model:hidden` on Legend. Callback props are events; item events receive `(item, index, event)`. Customization uses named slots. | Controlled and uncontrolled state the way Vue users expect it. D-13, D-16, D-23. |
| **Nuxt module** (`vccs/nuxt`, Nuxt 4) registers components and composables. **Resolver** (`vccs/resolver`) for `unplugin-vue-components`. On Nuxt 3 the module stops with a clear error. | Auto-imports with correct types, and SSR that works by default. |
| **New standalone charts:** `BarList`, `Sparkline`, `Tracker`, `Heatmap`, `CalendarHeatmap`, `CohortChart`, `JourneySankey`. | Common product-dashboard needs, 8–30 kB gzip each. |
| **Accessibility.** Every chart takes `title` and `desc` and has a generated accessible name. Treemap, Sankey, SunburstChart and the new charts work with the keyboard. Text contrast is checked per fixture. | Charts were invisible to screen readers. D-14, D-15, D-20. |
| **Motion.** Keyed enter, update and exit animations for every series, shared timing tokens, `prefers-reduced-motion`. | Data changes animated inconsistently, and some elements were recreated instead of moved. D-26. |
| **Theming with CSS variables** (`--v-charts-*`, listed in `chartThemeTokens`). Series without a color take the next palette color. Classes use the `v-charts-` prefix; parts carry `data-slot`. | Dark mode and design systems (a shadcn-vue recipe is in the docs) without a color prop on every series. D-19, D-22. |
| **Lean repo.** Storybook removed (31 files). The planning notes went from 38 files to 3 (`internals/decisions.md`, `open-items.md`, `migrations.md`). One `pnpm verify` runs every gate. | Less to maintain. The repo still has more files than 0.6.0 (876 against 685): the growth is tests, docs pages and check scripts. |

## What improved, measured

Bundle size, from `pnpm compare:upstream` (0.6.0 from npm against HEAD; esbuild, minified,
gzip, `vue` and `motion-v` external):

| Import | 0.6.0 | 1.0 | Change |
| --- | ---: | ---: | ---: |
| One cartesian or polar chart (`BarChart`, `PieChart`, …) | 63.1 kB | 46.1–46.2 kB | −27 % |
| Bar chart with axes, grid, tooltip and legend | 96.7 kB | 83.9 kB | −13 % |
| `Treemap` / `Sankey` / `SunburstChart` | 68.7 / 68.7 / 66.9 kB | 25.9 / 23.1 / 22.0 kB | −62 to −67 % |
| New charts | – | 8.1 kB (`BarList`) to 29.7 kB (`Sparkline`) | – |
| Everything (`export *`) | 130.8 kB | 142.2 kB | +8.7 % (seven more charts) |

Speed, from `pnpm bench --compare=<0.6.0 dist> --charts=LineChart,BarChart --modes=static`
(headless Chromium, 900 × 400 px, animation off, median of 21 paired rounds; every row PASS,
that is, the 95 % interval of the ratio is below 1):

| Chart | 0.6.0 mount / update | 1.0 mount / update |
| --- | ---: | ---: |
| LineChart, 1,000 points | 57.2 / 17.1 ms | 41.1 / 16.7 ms |
| LineChart, 10,000 points | 529.6 / 223.4 ms | 382.5 / 177.2 ms |
| BarChart, 1,000 bars | 95.0 / 43.9 ms | 29.7 / 14.1 ms |
| BarChart, 10,000 bars | 967.1 / 507.6 ms | 241.3 / 115.5 ms |

Bars render without a component per bar, which explains most of the BarChart gain. The machine
was loaded, so read the ratios, not the absolute times.

Code and dependencies:

| Measure | 0.6.0 | 1.0 | Source |
| --- | ---: | ---: | --- |
| Production lines (files) | 27,562 (284) | 28,944 (280) | `pnpm compare:upstream` |
| Test lines (files) | 13,963 (69) | 23,604 (164) | `pnpm compare:upstream` |
| Unit tests | – | 1,506 in 146 files | `pnpm --filter vccs exec vitest run` |
| Import cycles / unused files and exports / `any` / `ts-ignore` | not measured | 0 / 0 / 0 / 0; longest file 584 lines | `pnpm check:code` |
| Runtime dependencies | 11 | 10 | `packages/vue/package.json` |

Removed: `@reduxjs/toolkit`, `@reduxjs/vue-redux`, `immer`, `eventemitter3`, `lodash-es`,
`victory-vendor`. Added: the D3 modules that `victory-vendor` wrapped (`d3-scale`, `d3-shape`,
`d3-color`) and two `@types` packages that the public `.d.ts` files reference. Peers are now
`vue ^3.5`, `motion-v ^2.4` and an optional `@nuxt/kit ^4`.

`git diff --shortstat f8c27e7..HEAD -- packages/vue/src`: 598 files changed, 31,304
insertions, 26,635 deletions.

## What is proven

All gates ran in one `VCCS_PORTS=4700-4709 pnpm verify --release --docs-browser=chromium,webkit`
at `38abb40` (44 min under load): 22 of 23 PASS. [VERIFY.md](VERIFY.md) says how each gate can
fail: each has a self-test or a recorded deliberate defect that made it exit 1.

| Claim | Gate | Latest result |
| --- | --- | --- |
| Behavior and public API stay intact; fixed bugs stay fixed | `vitest run` | PASS, 1,506 tests |
| Lint and types are clean, including the type probes | `pnpm lint`, `pnpm typecheck` | PASS, 0 errors, 0 warnings |
| A user's bundle stays within budget | `pnpm --filter vccs size` | PASS, single chart 45.7 kB of 48.2 kB |
| The packed package resolves (publint, attw) | `pnpm check:package` | PASS |
| Strict Vite and Nuxt consumers typecheck and build the packed package; `nuxi dev` renders without errors | `node scripts/check-consumers.mjs` | PASS |
| Production code has no cycles, dead code or untyped escapes | `pnpm check:code` | PASS |
| The docs cover every public component | `check-docs-coverage.mjs` | PASS, 56 of 56 |
| Standalone charts leave the cartesian engine out | `pnpm check:bundle --assert-standalone` | PASS |
| Nuxt renders the charts on the server | `pnpm --filter vccs test:nuxt` | PASS |
| SSR, hydration, keyboard, contrast and axe pass for every chart | `pnpm check:a11y` | PASS |
| Production charts animate with no recreated elements and no long frames | `pnpm check:motion` | PASS, 12 scenarios, 0 recreated elements |
| Every transition is smooth frame by frame (no jumps, reversals, stalls, unsettled shapes) | `report.mjs --prod --check` | PASS, 285 of 285 transitions |
| Docs pages and demos render without errors | `pnpm check:docs` | PASS, 144 visits in Chromium and WebKit, 0 failed |
| Playground pages settle, hover and react to controls | `pnpm check:play` | **FAIL** in the full sweep: 21 of 22 page runs clean; `/area` had 4 "unsettled" flags (the entrance clip still widening at 2.5 s on the real clock). The route alone passed right after, and the previous release run passed. Load-sensitive, tracked as an open item. |

Other checks in this review, outside `pnpm verify`:

- **Fresh consumer apps** (Nuxt 4 and Vite, installed from the packed package): strict
  `nuxi typecheck` and `vue-tsc` pass and catch a wrong prop. The SSR HTML contains the charts;
  6 parallel SSR requests give identical HTML; 921 SVG ids, none duplicate, no broken
  `url(#id)`; 5 navigation loops leave no listeners or observers behind. This found a
  `nuxi dev` crash (`decimal.js-light`), now fixed and part of `check-consumers`.
- **Edge data:** data swaps during an animation (add, remove, reorder, empty, one row, all
  negative) in 18 chart families settle to exactly the static geometry, with no `NaN`.
- **Screenshots** of the playground against release/1.0 before this run: 72 page pairs (18
  routes, 1280 and 390 px, light and dark), 66 identical, the rest intended. Two hover
  differences were found and fixed.
- **Docs code:** 110 code blocks and 87 demo components pass strict vue-tsc; the one wrong API
  it found (`corner-radius` on Pie) is now a real prop.

## What is reviewed by eye

No script judges taste. These need a person:

- **Motion feel** (timing, easing, choreography). The geometry gate proves there are no jumps,
  reversals, stalls or unsettled shapes, not that the motion feels right. Instrument:
  `pnpm lab film <scenario> --steps=<step>` writes a video, a contact sheet, a filmstrip and
  `frames.json` per step. In this review the bar `values` sheet (69 frames, no flags) was read
  by eye: smooth growth, settled end frames.
- **Arc shapes** (pie, radial bar, sunburst): the geometry gate skips them; use `pnpm lab film`.
- **Real-clock timing**, also with the CPU slowed 4×: `pnpm lab timing`. It depends on load,
  so it is an instrument, not a gate (D-25a).
- **What a visitor sees** when scrolling or switching tabs: `pnpm lab seen`.
- **Visual design** of docs and playground: the screenshot comparison above and preview
  deploys.

## Breaking changes

One breaking release with no compatibility aliases (D-3). The
[migration guide](docs/content/1.getting-started/3.migration.md) shows every change with a
before and after example; [CHANGELOG.md](CHANGELOG.md) has the full list. In short:

- Callback props become events (`:onClick` → `@click`).
- `v-model:active-index` and Brush `v-model:range` replace `activeIndex`, `startIndex` and
  `endIndex`.
- Charts are responsive by default; `responsive` is removed. `ResponsiveContainer` and
  `Customized` still work, warn once in development, and are removed in 2.0.
- Each chart family accepts only its own props. Props that were never read or were internal
  geometry are removed; some are renamed (Tooltip `content` → `#content` slot, `portal` → `to`,
  Treemap `colorPanel` → `colors`).
- Classes use the `v-charts-` prefix; default colors are CSS variables.
- Only public components, composables and types are exported (`useOffset` → `usePlotArea`).
- Peers: Vue `^3.5` and `motion-v` `^2.4`. The Nuxt module needs Nuxt 4.

## How to review

1. [README.md](README.md): what a user sees.
2. This report.
3. [internals/decisions.md](internals/decisions.md): each decision with its reason (D-1 to
   D-30). D-5 is the architecture.
4. The [migration guide](docs/content/1.getting-started/3.migration.md).
5. The code, in this order:
   - `packages/vue/src/model/`: the chart model (`chart.ts`, `registry.ts`, `axis.ts`,
     `tooltip.ts`).
   - `packages/vue/src/core/`: the Recharts math, no Vue.
   - `packages/vue/src/chart/`: `chartRoot.tsx` (the 9 categorical charts), `ChartShell.tsx`
     and the standalone charts.
   - One series end to end, for example `packages/vue/src/cartesian/bar/`.
   - `packages/vue/src/nuxt.ts`, `resolver.ts`, `typed.ts`.
6. [VERIFY.md](VERIFY.md), then `pnpm verify` yourself (about 12 min on a quiet Mac).

The commits are atomic Conventional Commits with the reason in the body.

## Open items and known limits

From [internals/open-items.md](internals/open-items.md) and this review:

- **`check:play` is load-sensitive** (see the table above): its settle limit uses the real
  clock. Rerun on a quiet machine.
- **Standalone charts report 0 × 0** to `usePlotArea`, `useChartWidth` and `useChartHeight`.
- **The workspace pins Vue 3.5.18** for its tests; without the pin, `pnpm typecheck` has 4
  errors in prop spreads. Consumers on Vue 3.5.43 pass.
- **`v-model:active-index` is not yet on** Scatter, Funnel, RadialBar, Treemap, Sankey,
  SunburstChart, BarList and JourneySankey. They keep hover and events.
- **Touch tooltips with several RadialBars at one index** pick the first series, as in 0.6.0.
- **Recharts parity gaps:** Cell in RadialBar and Scatter, ErrorBar in Line.
- **Docs prop tables are written by hand.** A comparison with the built library's props found
  only mismatches that are now fixed; generating the tables is a follow-up.
- **Tooling:** the library builds several times in one `pnpm verify`; the browser harnesses and
  the two Nuxt fixtures could merge; some checker tests depend on demo positions.
- **Not run here:** Firefox (it does not launch on this Mac, so `check:docs` covers Chromium and
  WebKit), real devices (touch, iOS Safari), and the GitHub Actions workflows on the fork
  (every command they call ran locally).
- **Release and docs hosting are yours.** Nothing here publishes. `package.json` name, version,
  homepage and repository are unchanged. vue-charts.com still serves the 0.6 docs until the
  1.0 docs are deployed.
