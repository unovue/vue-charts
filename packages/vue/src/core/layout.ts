import type { ChartOffset, Margin, Size } from '@/types/common'
import type { AxisId, XAxisSettings, YAxisSettings } from '@/types/axis'
import { DEFAULT_Y_AXIS_WIDTH } from '@/utils/const'
import { isNumber } from '@/utils/validate'

interface LayoutLegendSettings {
  layout: string
  align: 'left' | 'center' | 'right'
  verticalAlign: 'top' | 'middle' | 'bottom'
  position?: string | { x: number | string, y: number | string }
  offset?: number
}

interface BrushSettings {
  x: number | undefined
  y: number | undefined
  width: number | undefined
  height: number
}

// Match axis-map semantics: the last registration wins; numeric IDs sort first.
export function combineRegisteredAxes<T extends { id?: AxisId }>(axes: readonly T[]): T[] {
  return Object.values(Object.fromEntries(axes.map(axis => [axis.id, axis])))
}

export function combineChartOffset(
  size: Size,
  margin: Margin | undefined,
  brushHeight: number,
  xAxes: readonly XAxisSettings[],
  yAxes: readonly YAxisSettings[],
  legendSettings: LayoutLegendSettings,
  legendSize: Size,
): ChartOffset {
  const sides = {
    left: margin?.left || 0,
    right: margin?.right || 0,
    top: margin?.top || 0,
    bottom: margin?.bottom || 0,
  }
  for (const axis of yAxes) {
    if (!axis.mirror && !axis.hide)
      sides[axis.orientation] += typeof axis.width === 'number' ? axis.width : DEFAULT_Y_AXIS_WIDTH
  }
  for (const axis of xAxes) {
    if (!axis.mirror && !axis.hide)
      sides[axis.orientation] += axis.height
  }
  const brushBottom = sides.bottom
  sides.bottom += brushHeight
  const offset = appendOffsetOfLegend({ ...sides, brushBottom, width: 0, height: 0 }, legendSettings, legendSize)
  return {
    ...offset,
    width: Math.max(size.width - offset.left - offset.right, 0),
    height: Math.max(size.height - offset.top - offset.bottom, 0),
  }
}

export function combineChartViewBox(offset: ChartOffset) {
  return { x: offset.left, y: offset.top, width: offset.width, height: offset.height }
}

export function combineBrushDimensions(brush: BrushSettings, offset: ChartOffset, margin: Margin | undefined) {
  return {
    height: brush.height,
    x: isNumber(brush.x) ? brush.x : offset.left,
    y: isNumber(brush.y)
      ? brush.y
      : offset.top + offset.height + offset.brushBottom - (margin?.bottom || 0),
    width: isNumber(brush.width) ? brush.width : offset.width,
  }
}

export function appendOffsetOfLegend(offset: ChartOffset, legendSettings: LayoutLegendSettings, legendSize: Size) {
  if (legendSettings && legendSize) {
    const { width: boxWidth, height: boxHeight } = legendSize
    const { align, verticalAlign, layout, position, offset: legendOffset = 0 } = legendSettings

    if (position != null) {
      // Position-based legends are absolutely placed. They only move the plot area if they are positioned outside.
      if (position === 'top' || position === 'bottom' || position === 'left' || position === 'right') {
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
