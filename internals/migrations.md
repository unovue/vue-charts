# Active migration compatibility

## `ResponsiveContainer` (deprecated, D-21)

- Why: charts are responsive by default since 1.0; the wrapper only keeps 0.x templates working.
- Introduced: 2026-10 (vccs 1.0 run, phase 3).
- Dependents: user templates written for 0.x, and about 20 Storybook stories that still wrap charts in it. No library code and no docs demo depends on it.
- Code: `packages/vue/src/container/ResponsiveContainer.vue` (logs the D-21 warning once per app).
- Remove when: vccs 2.0. Delete the component, its export, docs mentions and the migration row.

## `Customized` (deprecated, D-21)

- Why: the chart's default slot with `usePlotArea()` and the chart composables replaces it.
- Introduced: 2026-10 (vccs 1.0 run, phase 3).
- Dependents: user templates written for 0.x; no library code depends on it.
- Code: `packages/vue/src/components/Customized.tsx` (logs the D-21 warning once per app).
- Remove when: vccs 2.0. Delete the component, its export, docs mentions and the migration row.
