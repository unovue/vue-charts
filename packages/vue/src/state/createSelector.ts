import { createSelectorCreator, weakMapMemoize } from 'reselect'

// The state view has stable identity. Always evaluate inputs so Vue records their
// domain reads and changed snapshots cannot be hidden by an argument cache.
const withoutArgumentCache = <Fn extends (...args: never[]) => unknown>(fn: Fn): Fn => fn

export const createSelector = createSelectorCreator({
  memoize: weakMapMemoize,
  argsMemoize: withoutArgumentCache,
  devModeChecks: { inputStabilityCheck: 'never', identityFunctionCheck: 'never' },
})
