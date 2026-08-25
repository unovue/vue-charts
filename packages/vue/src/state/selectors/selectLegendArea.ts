import { createSelector } from '@reduxjs/toolkit'
import type { CartesianViewBoxRequired } from '@/cartesian/type'
import type { Margin } from '@/types'
import { selectChartHeight, selectChartWidth, selectMargin } from '@/state/selectors/containerSelectors'
import type { RechartsRootState } from '@/state/store'

/**
 * The margin-inset chart area. Outside-positioned legends are placed here,
 * beyond any axes.
 */
export const selectLegendArea: (state: RechartsRootState) => CartesianViewBoxRequired = createSelector(
  [selectChartWidth, selectChartHeight, selectMargin],
  (chartWidth: number, chartHeight: number, margin: Margin | undefined): CartesianViewBoxRequired => ({
    x: margin?.left || 0,
    y: margin?.top || 0,
    width: Math.max(chartWidth - (margin?.left || 0) - (margin?.right || 0), 0),
    height: Math.max(chartHeight - (margin?.top || 0) - (margin?.bottom || 0), 0),
  }),
)
