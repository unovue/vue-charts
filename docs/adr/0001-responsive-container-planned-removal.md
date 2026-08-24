# ADR-0001: ResponsiveContainer is planned for removal and is not an adapter for a shared seam

- Status: Accepted
- Date: 2026-08-24

## Context

The `handleResize` logic (round + dedupe) in `generateCategoricalChart.tsx` and `setContainerSize` in `container/ResponsiveContainer.vue` are word-for-word identical. An architecture review proposed extracting a shared size-state core used by both.

## Decision

ResponsiveContainer is a legacy component and may be removed. Do not abstract any shared module or seam for it:

- With only one remaining adapter, the seam is hypothetical — don't extract.
- New code (e.g. `useResponsiveSize`) shapes its interface for its own caller's needs, with no generality reserved for "future sharing with ResponsiveContainer".
- The duplicated round + dedupe logic inside ResponsiveContainer stays as-is and retires with the component.

## Consequences

- If ResponsiveContainer is kept rather than removed, revisit this ADR; the shared-core proposal can be reopened.
- Future architecture reviews should not re-propose merging the sizing logic of `generateCategoricalChart` and `ResponsiveContainer`.
