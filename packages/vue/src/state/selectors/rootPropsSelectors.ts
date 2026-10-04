import type { StackOffsetType, SyncMethod } from '@/types'
import type { RechartsRootState } from '../chartState'

export const selectRootMaxBarSize = (state: RechartsRootState) => state.rootProps.maxBarSize!
export const selectBarGap = (state: RechartsRootState) => state.rootProps.barGap
export function selectBarCategoryGap(state: RechartsRootState) {
  return state.rootProps.barCategoryGap
}
export const selectRootBarSize = (state: RechartsRootState) => state.rootProps.barSize
export const selectStackOffsetType = (state: RechartsRootState): StackOffsetType => state.rootProps.stackOffset
export const selectChartName = (state: RechartsRootState) => state.options.chartName

export const selectSyncId = (state: RechartsRootState) => state.rootProps.syncId
export const selectSyncMethod = (state: RechartsRootState): SyncMethod => state.rootProps.syncMethod
export const selectEventEmitter = (state: RechartsRootState) => state.options.eventEmitter
