import type { LegendSettings } from '@/state/chartLegend'
import { selectChartHeight, selectChartWidth, selectMargin } from '@/state/selectors/containerSelectors'
import { selectLegendSettings, selectLegendSize } from '@/state/selectors/legendSelectors'
import { selectAllXAxes, selectAllYAxes } from '@/state/selectors/selectAllAxes'
import { selectBrushHeight } from '@/state/selectors/selectChartOffset'
import type { ChartOffset, Margin, Size } from '@/types'
import type { XAxisSettings, YAxisSettings } from '@/types/axis'
import type { OffsetHorizontal, OffsetVertical } from '@/types/offset'
import { DEFAULT_Y_AXIS_WIDTH } from '@/utils/const'
import { appendOffsetOfLegend } from '@/utils/legend'
import type { ChartOffsetInternal } from '@/utils/types'
import type { RechartsRootState } from '@/state/chartState'
import { createSelector } from '../createSelector'
import { get } from 'es-toolkit/compat'

/**
 * For internal use only.
 *
 * @param root state
 * @return ChartOffsetInternal
 */
export const selectChartOffsetInternal: (state: RechartsRootState) => ChartOffsetInternal = createSelector(
  [
    selectChartWidth,
    selectChartHeight,
    selectMargin,
    selectBrushHeight,
    selectAllXAxes,
    selectAllYAxes,
    selectLegendSettings,
    selectLegendSize,
  ],
  (
    chartWidth: number,
    chartHeight: number,
    margin: Margin,
    brushHeight: number,
    xAxes: readonly XAxisSettings[],
    yAxes: readonly YAxisSettings[],
    legendSettings: LegendSettings,
    legendSize: Size,
  ): ChartOffsetInternal => {
    const offsetH: OffsetHorizontal = yAxes.reduce(
      (result: OffsetHorizontal, entry: YAxisSettings): OffsetHorizontal => {
        const { orientation } = entry

        if (!entry.mirror && !entry.hide) {
          const width = typeof entry.width === 'number' ? entry.width : DEFAULT_Y_AXIS_WIDTH
          return { ...result, [orientation]: result[orientation] + width }
        }

        return result
      },
      { left: margin.left || 0, right: margin.right || 0 },
    )

    const offsetV: OffsetVertical = xAxes.reduce(
      (result: OffsetVertical, entry: XAxisSettings): OffsetVertical => {
        const { orientation } = entry

        if (!entry.mirror && !entry.hide) {
          return { ...result, [orientation]: get(result, `${orientation}`) + entry.height }
        }

        return result
      },
      { top: margin.top || 0, bottom: margin.bottom || 0 },
    )

    let offset = { ...offsetV, ...offsetH }

    const brushBottom = offset.bottom

    offset.bottom! += brushHeight

    offset = appendOffsetOfLegend(offset as ChartOffset, legendSettings, legendSize)

    const offsetWidth = chartWidth - offset.left! - offset.right!
    const offsetHeight = chartHeight - offset.top! - offset.bottom!

    return {
      brushBottom,
      ...offset,
      // never return negative values for height and width
      width: Math.max(offsetWidth, 0),
      height: Math.max(offsetHeight, 0),
    }
  },
)
