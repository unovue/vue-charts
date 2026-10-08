import { getValueByDataKey } from '@/core/data'
import type { BaseAxisWithScale } from '@/types/axisSettings'
import type { TickItem } from '@/types'
import type { DataKey, LayoutType } from '@/types/common'

import type { LinePointItem } from '@/types/line'
import { toFiniteNumber } from '@/utils/validate'
import { getCateCoordinateOfLine } from '@/core/coordinates'

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
  layout: LayoutType | undefined
  xAxis: BaseAxisWithScale
  yAxis: BaseAxisWithScale
  xAxisTicks: TickItem[]
  yAxisTicks: TickItem[]
  dataKey: DataKey<unknown> | undefined
  bandSize: number
  displayedData: readonly unknown[]
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
