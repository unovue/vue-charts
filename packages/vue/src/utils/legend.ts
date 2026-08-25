import type { LegendSettings } from '@/state/legendSlice'
import type { ChartOffset, Size } from '@/types'
import { isOutsidePosition } from '@/cartesian/getCartesianPosition'
import { isNumber } from '@/utils/validate'

export function appendOffsetOfLegend(offset: ChartOffset, legendSettings: LegendSettings, legendSize: Size) {
  if (legendSettings && legendSize) {
    const { width: boxWidth, height: boxHeight } = legendSize
    const { align, verticalAlign, layout, position, offset: legendOffset = 0 } = legendSettings

    if (position != null) {
      // Position-based legends are absolutely placed. They only move the plot area if they are positioned outside.
      if (isOutsidePosition(position)) {
        if (position === 'top' && isNumber(offset.top)) {
          return { ...offset, top: offset.top + (boxHeight || 0) + legendOffset }
        }
        if (position === 'bottom' && isNumber(offset.bottom)) {
          return { ...offset, bottom: offset.bottom + (boxHeight || 0) + legendOffset }
        }
        if (position === 'left' && isNumber(offset.left)) {
          return { ...offset, left: offset.left + (boxWidth || 0) + legendOffset }
        }
        if (position === 'right' && isNumber(offset.right)) {
          return { ...offset, right: offset.right + (boxWidth || 0) + legendOffset }
        }
      }
      return offset
    }

    if (
      (layout === 'vertical' || (layout === 'horizontal' && verticalAlign === 'middle'))
      && align !== 'center'
      && isNumber(offset[align])
    ) {
      return { ...offset, [align]: offset[align] + (boxWidth || 0) }
    }

    if (
      (layout === 'horizontal' || (layout === 'vertical' && align === 'center'))
      && verticalAlign !== 'middle'
      && isNumber(offset[verticalAlign])
    ) {
      return { ...offset, [verticalAlign]: offset[verticalAlign] + (boxHeight || 0) }
    }
  }

  return offset
}
