import type { LayoutType, TickItem } from '@/types/common'
import type { AxisRange, AxisType } from '@/types/axis'
import type { AxisTick } from '@/types/tick'
import type { RechartsScale } from '@/types/scale'
import { isCategoricalAxis, isNan } from '@/utils/validate'
import { mathSign } from '@/utils/data'

interface TickAxis {
  type: 'number' | 'category'
  ticks: readonly AxisTick[] | undefined
  tickCount: number | undefined
}

export function combineAxisTicks(
  layout: LayoutType,
  axis: TickAxis | undefined,
  realScaleType: string | undefined,
  scale: RechartsScale | undefined,
  niceTicks: ReadonlyArray<number> | undefined,
  axisRange: AxisRange | undefined,
  duplicateDomain: ReadonlyArray<unknown> | undefined,
  categoricalDomain: ReadonlyArray<unknown> | undefined,
  axisType: AxisType,
): ReadonlyArray<TickItem> | undefined {
  if (axis == null || scale == null) {
    return undefined
  }

  const isCategorical = isCategoricalAxis(layout, axisType)

  const { type, ticks, tickCount } = axis

  // This is testing for `scaleBand` but for band axis the type is reported as `band` so this looks like a dead code with a workaround elsewhere?
  const offsetForBand = realScaleType === 'scaleBand' ? scale.bandwidth!() / 2 : 2

  let offset = type === 'category' && scale.bandwidth ? scale.bandwidth() / offsetForBand : 0

  if (axisType === 'angleAxis' && axisRange && axisRange.length >= 2)
    offset = mathSign(axisRange[0] - axisRange[1]) * 2 * offset

  const ticksOrNiceTicks = ticks || niceTicks
  // The ticks set by user should only affect the ticks adjacent to axis line
  if (ticksOrNiceTicks) {
    const result = ticksOrNiceTicks.map((entry: AxisTick, index: number): TickItem => {
      const scaleContent = duplicateDomain ? duplicateDomain.indexOf(entry) : entry

      return {
        index,
        // If the scaleContent is not a number, the coordinate will be NaN.
        // That could be the case for example with a PointScale and a string as domain.
        coordinate: scale(scaleContent) + offset,
        value: entry,
        offset,
      }
    })
    return result.filter((row: TickItem) => !isNan(row.coordinate))
  }

  // When axis is a categorical axis, but the type of axis is number or the scale of axis is not "auto"
  if (isCategorical && categoricalDomain) {
    return categoricalDomain.map(
      (entry: unknown, index: number): TickItem => ({
        coordinate: scale(entry) + offset,
        value: entry,
        index,
        offset,
      }),
    )
  }

  if (scale.ticks) {
    return (
      scale
        .ticks(tickCount)
        .map((entry: unknown): TickItem => ({ coordinate: scale(entry) + offset, value: entry, offset }))
    )
  }

  // When axis has duplicated text, serial numbers are used to generate scale
  return scale.domain().map(
    (entry: unknown, index: number): TickItem => ({
      coordinate: scale(entry) + offset,
      value: duplicateDomain ? duplicateDomain[entry as number] : entry,
      index,
      offset,
    }),
  )
}
