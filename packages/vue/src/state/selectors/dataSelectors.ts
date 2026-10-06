import { createSelector } from '../createSelector'
import type { RechartsRootState } from '../chartState'
import type { ChartDataState } from '../chartData'

/** Data and the range owned by this chart's Brush. */
export const selectChartDataWithIndexes = (state: RechartsRootState): ChartDataState => state.chartData

/**
 * This selector will always return the full range of data, ignoring the indexes set by a Brush.
 * Useful for when you want to render the full range of data, even if a Brush is active.
 * For example: in the Brush panorama, in Legend, in Tooltip.
 */
export const selectChartDataAndAlwaysIgnoreIndexes: (state: RechartsRootState) => ChartDataState = createSelector(
  [selectChartDataWithIndexes],
  (dataState: ChartDataState) => {
    const dataEndIndex = dataState.chartData != null ? dataState.chartData.length - 1 : 0
    return {
      chartData: dataState.chartData,
      dataEndIndex,
      dataStartIndex: 0,
    }
  },
)
