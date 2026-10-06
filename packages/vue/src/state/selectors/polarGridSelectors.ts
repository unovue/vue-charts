import { createSelector } from '../createSelector'
import type { RechartsRootState } from '../chartState'
import type { AxisId } from '../chartCartesianAxis'
import { selectPolarAxisTicks } from '@/state/chartContext'
import type { CartesianTickItem } from '@/types/tick'

export type PolarAngles = Array<number>

export type PolarRadius = Array<number>

function selectAngleAxisTicks(state: RechartsRootState, anglexisId: AxisId) {
  return selectPolarAxisTicks(state, 'angleAxis', anglexisId)
}

export const selectPolarGridAngles = createSelector(
  [selectAngleAxisTicks],
  (ticks: ReadonlyArray<CartesianTickItem> | undefined): PolarAngles | undefined => {
    if (!ticks) {
      return undefined
    }

    return ticks.map(tick => tick.coordinate)
  },
)

function selectRadiusAxisTicks(state: RechartsRootState, radiusAxisId: AxisId) {
  return selectPolarAxisTicks(state, 'radiusAxis', radiusAxisId)
}

export const selectPolarGridRadii = createSelector([selectRadiusAxisTicks], (ticks: ReadonlyArray<CartesianTickItem> | undefined): PolarRadius | undefined => {
  if (!ticks) {
    return undefined
  }

  return ticks.map(tick => tick.coordinate)
})
