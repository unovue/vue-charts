import { createSelector } from '@reduxjs/toolkit'
import { get } from 'lodash-es'
import { selectLegendSettings, selectLegendSize } from './legendSelectors'
import type { XAxisSettings, YAxisSettings } from '../cartesianAxisSlice'
import type { LegendSettings } from '../legendSlice'
import { selectChartHeight, selectChartWidth, selectMargin } from './containerSelectors'
import { selectAllXAxes, selectAllYAxes } from './selectAllAxes'
import type { RechartsRootState } from '../store'
import type { ChartOffsetRequired, Margin, Size } from '@/types'
import type { OffsetHorizontal, OffsetVertical } from '@/types/offset'
import { appendOffsetOfLegend } from '@/utils/legend'
import { DEFAULT_Y_AXIS_WIDTH } from '@/utils/const'
import type { CartesianViewBoxRequired } from '@/cartesian/type'

export const selectBrushHeight = (state: RechartsRootState) => state.brush.height

export const selectChartOffset: (state: RechartsRootState) => ChartOffsetRequired = createSelector(
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
    xAxes: XAxisSettings[],
    yAxes: YAxisSettings[],
    legendSettings: LegendSettings,
    legendSize: Size,
  ): ChartOffsetRequired => {
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

    offset = appendOffsetOfLegend(offset as any, legendSettings, legendSize) as ChartOffsetRequired

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

export const selectChartViewBox = createSelector(
  selectChartOffset,
  (offset: ChartOffsetRequired): CartesianViewBoxRequired => ({
    x: offset.left,
    y: offset.top,
    width: offset.width,
    height: offset.height,
  }),
)

export const selectAxisViewBox = createSelector(
  selectChartWidth,
  selectChartHeight,
  (width: number, height: number): CartesianViewBoxRequired => ({
    x: 0,
    y: 0,
    width,
    height,
  }),
)
