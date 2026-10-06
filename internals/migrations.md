# Active migration compatibility

## Chart selector adapter

- Introduced: 2026-10-06, release 1.0 step 2.2.
- Why: migrate root inputs before registries and geometry, preserving existing chart behavior.
- Adapter: `packages/vue/src/state/chartContext.ts`; its getter view reads the canonical chart model and the remaining domain owners. It keeps no copy of root props or data.
- Dependents: `useAppSelector` consumers in polar grid/axes, remaining cartesian axes/references/Brush, axis public hooks, Legend, events and synchronization; Cartesian and polar series geometry now reads axis models directly; standalone roots now provide lightweight tooltip/runtime capabilities through ChartShell (step 2.11); the adapter has no standalone construction fallback.
- Caller inventory: `rg -l 'state/(chartContext|hooks)|./chartContext' packages/vue/src --glob '!**/__tests__/**'`; [step 2.2 snapshot](../.evidence/release-1.0/step-2.2/adapter-callers.txt).
- Remove when: steps 2.3–2.9 migrate all selector consumers and step 2.11 supplies standalone TooltipSource; delete the adapter and this entry with the state shell in step 2.10.
- Tracking: `internals/release-1.0/PLAN.md`, steps 2.2–2.11; no external issue.
