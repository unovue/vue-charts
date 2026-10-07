# Active migration compatibility

## `ResponsiveContainer` (deprecated, D-21)

- Why: charts are responsive by default since 1.0; the wrapper only keeps 0.x templates working.
- Introduced: 2026-10 (vccs 1.0 run, phase 3).
- Dependents: user templates written for 0.x, and in this repo the docs demos in
  `docs/app/charts/**` (59 files wrap their chart in it) plus the guides
  `docs/content/2.guides/05.chart-size.md` and `16.shadcn-vue.md`. No library code depends on it.
- Code: `packages/vue/src/container/ResponsiveContainer.vue` (logs the D-21 warning once per app).
- Remove when: vccs 2.0. Delete the component, its export, docs mentions and the migration row.

## `Customized` (deprecated, D-21)

- Why: the chart's default slot with `usePlotArea()` and the chart composables replaces it.
- Introduced: 2026-10 (vccs 1.0 run, phase 3).
- Dependents: user templates written for 0.x, and in this repo the docs page
  `docs/content/4.components/7.customized.md` with its demos in `docs/app/charts/customized-charts/`.
  No library code or playground page depends on it.
- Code: `packages/vue/src/components/Customized.tsx` (logs the D-21 warning once per app).
- Remove when: vccs 2.0. Delete the component, its export, docs mentions and the migration row.
