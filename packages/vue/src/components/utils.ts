import type { RadialCursorPoints } from '@/components/types'
import type { ChartCoordinate, Coordinate, LayoutType, PolarChartCoordinate } from '@/types'
import { isPolarCoordinate } from '@/types/base'
import { polarToCartesian } from '@/utils/polar'
import type { ChartOffsetInternal } from '@/utils/types'

function getRadialCursorPoints({ cx, cy, radius, startAngle, endAngle }: PolarChartCoordinate): RadialCursorPoints {
  return {
    points: [polarToCartesian(cx, cy, radius, startAngle), polarToCartesian(cx, cy, radius, endAngle)],
    cx,
    cy,
    radius,
    startAngle,
    endAngle,
  }
}

export function getCursorPoints(
  layout: LayoutType,
  activeCoordinate: ChartCoordinate,
  offset: ChartOffsetInternal,
): [Coordinate, Coordinate] | RadialCursorPoints {
  if (layout === 'horizontal') {
    const { x } = activeCoordinate
    return [{ x, y: offset.top }, { x, y: offset.top + offset.height }]
  }
  if (layout === 'vertical') {
    const { y } = activeCoordinate
    return [{ x: offset.left, y }, { x: offset.left + offset.width, y }]
  }
  if (!isPolarCoordinate(activeCoordinate))
    return [activeCoordinate, activeCoordinate]
  if (layout === 'centric') {
    const { cx, cy, innerRadius, outerRadius, angle } = activeCoordinate
    return [polarToCartesian(cx, cy, innerRadius, angle), polarToCartesian(cx, cy, outerRadius, angle)]
  }
  return getRadialCursorPoints(activeCoordinate)
}
