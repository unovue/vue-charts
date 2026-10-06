import type { BaseAxisWithScale } from '@/state/selectors/axisSelectors'
import type { TickItem } from '@/types'
import type { LinePointItem, LineProps } from './type'
import { toFiniteNumber } from '@/utils'
import { getCateCoordinateOfLine, getValueByDataKey } from '@/utils/chart'

export function computeLinePoints({
  layout,
  xAxis,
  yAxis,
  xAxisTicks,
  yAxisTicks,
  dataKey,
  bandSize,
  displayedData,
}: {
  layout: LineProps['layout']
  xAxis: BaseAxisWithScale
  yAxis: BaseAxisWithScale
  xAxisTicks: TickItem[]
  yAxisTicks: TickItem[]
  dataKey: LineProps['dataKey'] | undefined
  bandSize: number
  displayedData: any[]
}): ReadonlyArray<LinePointItem> {
  return displayedData.map((entry, index): LinePointItem => {
    const value = toFiniteNumber(getValueByDataKey(entry, dataKey))

    if (layout === 'horizontal') {
      return {
        x: getCateCoordinateOfLine({ axis: xAxis, ticks: xAxisTicks, bandSize, entry, index })!,
        y: (value == null ? null : yAxis.scale(value))!,
        value,
        payload: entry,
      }
    }

    return {
      x: (value == null ? null : xAxis.scale(value))!,
      y: getCateCoordinateOfLine({ axis: yAxis, ticks: yAxisTicks, bandSize, entry, index })!,
      value,
      payload: entry,
    }
  })
}
