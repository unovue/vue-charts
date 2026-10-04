import { createSelector } from '@reduxjs/toolkit'
import type { RechartsRootState } from '../store'
import type { XAxisSettings, YAxisSettings } from '../chartCartesianAxis'

export const selectAllXAxes: (state: RechartsRootState) => ReadonlyArray<XAxisSettings> = createSelector(
  (state: RechartsRootState) => state.cartesianAxis.xAxis,
  (xAxisMap): ReadonlyArray<XAxisSettings> => {
    return Object.values(xAxisMap)
  },
)

export const selectAllYAxes: (state: RechartsRootState) => ReadonlyArray<YAxisSettings> = createSelector(
  (state: RechartsRootState) => state.cartesianAxis.yAxis,
  (yAxisMap): ReadonlyArray<YAxisSettings> => {
    return Object.values(yAxisMap)
  },
)
