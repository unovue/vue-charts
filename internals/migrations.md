# Active migration compatibility

## Chart-local Vue state context

- Introduced: 2026-09-16.
- Purpose: replace Vue-Redux bindings now while retaining existing calculations
  and interaction reducers until their behavior has migration coverage.
- Dependents: categorical charts, Sankey, Treemap, Sunburst, and internal chart hooks.
- Event handling now runs through chart-local Vue composables. Native callbacks
  no longer dispatch transport actions; pointer, keyboard, and touch handlers
  call the existing calculations directly. Their final state transitions still
  use the temporary Redux reducers.
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

### Ownership cutover constraints

- Current state has 12 reducer-owned domains. Existing identity-memoized
  selectors require structural replacement of every changed ancestor; mutating
  Vue state in place under those selectors would return stale calculations.
- Move state types/defaults and typed operations together into one chart-local
  owner. Do not mirror layout or tooltip state between Redux and Vue, or replace
  Redux with a permanent generic dispatcher implementation.
- Preserve user data identity, registration order, atomic interaction changes,
  no-op update suppression, and fresh per-chart interaction defaults.
- Reporter effects must not subscribe to their own writes. Derived geometry
  must remain stable for pointer-only changes. Bind parameterized calculations
  to reactive inputs and test alternate axes/charts and panorama separately.
- Final calculation ownership is chart-local Vue computed state calling pure
  geometry helpers. Remove the subscription bridge and identity-cache adapters
  with their last dependents, rather than implementing compatibility cache APIs.
