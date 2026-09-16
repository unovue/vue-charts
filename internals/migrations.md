# Active migration compatibility

## Chart-local Vue state context

- Introduced: 2026-09-16.
- Purpose: replace Vue-Redux bindings now while retaining existing calculations
  and interaction reducers until their behavior has migration coverage.
- Dependents: categorical charts, Sankey, Treemap, Sunburst, and internal chart hooks.
- Temporary code: `ChartStore` input and its subscription in
  `packages/vue/src/state/chartContext.ts` bridge the current Redux store to Vue.
- Lifecycle: the subscription is owned by a synchronous Vue effect, whose
  cleanup runs on client unmount and successful SSR render completion. Scope
  disposal alone does not run when `renderToString` completes.
- Removal condition: every chart family, registration, synchronization, and
  interaction action uses chart-local Vue state; shared public-behavior, SSR,
  browser, and consumer tests pass without Redux. Remove the subscription bridge,
  Redux/Immer reducers and dependencies, and this entry together.
- Rollback: revert this context change and restore the Vue-Redux provider and
  selector bindings. No persisted-data migration or public API change is involved.
- Tracking: local `tasks/todo.md`, Stage 3; no external issue created.
