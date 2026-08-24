# ADR-0001: ResponsiveContainer is planned for removal; share only the size-state core

- Status: Accepted
- Date: 2026-08-24

## Context

The `handleResize` logic (round + dedupe) in `generateCategoricalChart.tsx` and `setContainerSize` in `container/ResponsiveContainer.vue` were word-for-word identical. ResponsiveContainer is a legacy component and may be removed.

An architecture review initially shelved the idea of extracting a shared core: with ResponsiveContainer deprecated, the seam would eventually have a single adapter, making it hypothetical. This was reconsidered — the seam has **two adapters today**, the extraction cost is a few lines, and the eventual removal of ResponsiveContainer costs nothing but deleting one import. Maintaining two verbatim copies of live logic is a drift risk for as long as the component lives.

## Decision

- Extract `useRoundedSize` (`hooks/useRoundedSize.ts`): a size ref plus a setter that rounds to integers and ignores no-change updates. Used by both `useResponsiveSize` and `ResponsiveContainer`.
- ResponsiveContainer-specific concerns (throttle, aspect ratio, `initialDimension`, the `onResize` callback) stay in ResponsiveContainer — they are not part of the seam.
- Neither adapter's interface is shaped for the other. ResponsiveContainer adapts to the shared core, not vice versa.
- When ResponsiveContainer is removed, `useRoundedSize` stays behind as the chart's size-state implementation with a single adapter — no teardown beyond deleting the import.

## Consequences

- The round + dedupe behavior has one implementation; fixes apply to both adapters.
- Future architecture reviews should not re-propose merging the *full* sizing logic of the two components — only the size-state core is shared.
