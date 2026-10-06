import type { RechartsRootState } from '../chartState'

export const selectChartOffset = (state: RechartsRootState) => state.offset
export const selectChartViewBox = (state: RechartsRootState) => state.viewBox
export const selectAxisViewBox = (state: RechartsRootState) => state.axisViewBox
