import type { AxisRange, BaseCartesianAxis } from '@/types/axis'
import type { AppliedChartData } from '@/types/chartData'
import type { ChartOffsetRequired, LayoutType } from '@/types/common'
import { onlyAllowNumbers } from './data'
import { getPercentValue } from '@/utils/data'
import { isWellBehavedNumber } from '@/utils/validate'

export function combineSmallestDistance(data: AppliedChartData, axis: BaseCartesianAxis) {
  if (axis.type !== 'number')
    return undefined
  const values = [...onlyAllowNumbers(data.map(d => d.value))].sort((a, b) => a - b)
  const span = values[values.length - 1] - values[0]
  if (values.length < 2 || span === 0)
    return Infinity
  let distance = Infinity
  for (let i = 0; i < values.length - 1; i++)
    distance = Math.min(distance, values[i + 1] - values[i])
  return distance / span
}

export function combineCalculatedPadding(
  distance: number | undefined,
  layout: LayoutType,
  gap: number | string,
  offset: ChartOffsetRequired,
  padding: unknown,
) {
  if (!isWellBehavedNumber(distance))
    return 0
  const width = layout === 'vertical' ? offset.height : offset.width
  const halfBand = distance * width / 2
  if (padding === 'gap')
    return halfBand
  if (padding === 'no-gap') {
    const space = getPercentValue(gap, distance * width)
    return halfBand - space - ((halfBand - space) / width) * space
  }
  return 0
}

export function combineAxisRangeWithReverse(
  axis: BaseCartesianAxis | undefined,
  range: AxisRange | undefined,
): AxisRange | undefined {
  if (!axis || !range)
    return undefined
  return axis.reversed ? [range[1], range[0]] : range
}

export function combineXAxisRange(
  offset: ChartOffsetRequired,
  padding: import('@/types/axis').XAxisPadding,
  calculated: number,
): AxisRange {
  const sides = typeof padding === 'string' ? { left: calculated, right: calculated } : padding
  return [offset.left + (sides.left ?? 0), offset.left + offset.width - (sides.right ?? 0)]
}

export function combineYAxisRange(
  offset: ChartOffsetRequired,
  layout: LayoutType,
  padding: import('@/types/axis').YAxisPadding,
  calculated: number,
): AxisRange {
  const sides = typeof padding === 'string' ? { top: calculated, bottom: calculated } : padding
  const top = offset.top + (sides.top ?? 0)
  const bottom = offset.top + offset.height - (sides.bottom ?? 0)
  return layout === 'horizontal' ? [bottom, top] : [top, bottom]
}
