import type { ActiveTooltipProps } from '@/types/tooltip'
import type { AxisRange, AxisType } from '@/types/axis'
import type { ChartOffsetRequired, ChartPointer, LayoutType, TickItem } from '@/types'
import type { PolarViewBoxRequired } from '@/types/viewBox'
import { mathSign } from '@/utils/data'
import { formatAngleOfSector, getAngleOfPoint, polarToCartesian, reverseFormatAngleOfSector } from '@/utils/polar'
import type { ChartCoordinate, Coordinate } from '@/types/common'

export function activeProps(chartEvent: ChartPointer | undefined, layout: LayoutType | undefined, polarViewBox: PolarViewBoxRequired | undefined, tooltipAxisType: AxisType | undefined, tooltipAxisRange: AxisRange | undefined, tooltipTicks: ReadonlyArray<TickItem> | undefined | null, orderedTooltipTicks: ReadonlyArray<TickItem> | undefined, offset: ChartOffsetRequired): ActiveTooltipProps | undefined {
  if (!chartEvent || !layout || !tooltipAxisType || !tooltipAxisRange || !tooltipTicks) {
    return undefined
  }
  const rangeObj = inRange(chartEvent.chartX, chartEvent.chartY, layout, polarViewBox, offset)
  if (!rangeObj) {
    return undefined
  }
  const pos = calculateTooltipPos(rangeObj, layout)
  if (pos == null) {
    return undefined
  }

  const activeIndex = calculateActiveTickIndex(
    pos,
    orderedTooltipTicks!,
    tooltipTicks,
    tooltipAxisType,
    tooltipAxisRange,
  )

  const activeCoordinate = getActiveCoordinate(layout, tooltipTicks, activeIndex, rangeObj)

  return { activeIndex: String(activeIndex), activeCoordinate }
}

export type RangeObj = {
  x?: number
  y?: number
  cx?: number
  cy?: number
  angle?: number
  radius?: number
}

export function calculateTooltipPos(rangeObj: RangeObj, layout: LayoutType): number | undefined {
  if (layout === 'horizontal') {
    return rangeObj.x
  }
  if (layout === 'vertical') {
    return rangeObj.y
  }
  if (layout === 'centric') {
    return rangeObj.angle
  }

  return rangeObj.radius
}

function inRangeOfSector(
  { x, y }: Coordinate,
  viewBox: PolarViewBoxRequired,
): RangeObj | null {
  const { radius, angle } = getAngleOfPoint({ x, y }, viewBox)
  const { innerRadius, outerRadius } = viewBox

  if (radius < innerRadius || radius > outerRadius) {
    return null
  }

  if (radius === 0) {
    return null
  }

  const { startAngle, endAngle } = formatAngleOfSector(viewBox)
  let formatAngle = angle
  let inRange

  if (startAngle <= endAngle) {
    while (formatAngle > endAngle) {
      formatAngle -= 360
    }
    while (formatAngle < startAngle) {
      formatAngle += 360
    }
    inRange = formatAngle >= startAngle && formatAngle <= endAngle
  }
  else {
    while (formatAngle > startAngle) {
      formatAngle -= 360
    }
    while (formatAngle < endAngle) {
      formatAngle += 360
    }
    inRange = formatAngle >= endAngle && formatAngle <= startAngle
  }

  if (inRange) {
    return { ...viewBox, radius, angle: reverseFormatAngleOfSector(formatAngle, viewBox) }
  }

  return null
}

export function inRange(
  x: number,
  y: number,
  layout: LayoutType,
  polarViewBox: PolarViewBoxRequired | undefined,
  offset: ChartOffsetRequired,
): RangeObj | null {
  if (layout === 'horizontal' || layout === 'vertical') {
    const isInRange
      = x >= offset.left && x <= offset.left + offset.width && y >= offset.top && y <= offset.top + offset.height

    return isInRange ? { x, y } : null
  }

  if (polarViewBox) {
    return inRangeOfSector({ x, y }, polarViewBox)
  }

  return null
}

export function calculateActiveTickIndex(
  coordinate: number,
  ticks: ReadonlyArray<TickItem>,
  unsortedTicks: ReadonlyArray<TickItem>,
  axisType: AxisType | undefined,
  range: AxisRange | undefined,
): number {
  let index = -1
  const len = ticks?.length ?? 0

  // if there are 1 or fewer ticks then the active tick is at index 0
  if (len <= 1) {
    return 0
  }

  if (axisType === 'angleAxis' && range != null && Math.abs(Math.abs(range[1] - range[0]) - 360) <= 1e-6) {
    // ticks are distributed in a circle
    for (let i = 0; i < len; i++) {
      const before = i > 0 ? unsortedTicks[i - 1].coordinate : unsortedTicks[len - 1].coordinate
      const cur = unsortedTicks[i].coordinate
      const after = i >= len - 1 ? unsortedTicks[0].coordinate : unsortedTicks[i + 1].coordinate
      let sameDirectionCoord

      if (mathSign(cur - before) !== mathSign(after - cur)) {
        const diffInterval = []
        if (mathSign(after - cur) === mathSign(range[1] - range[0])) {
          sameDirectionCoord = after

          const curInRange = cur + range[1] - range[0]
          diffInterval[0] = Math.min(curInRange, (curInRange + before) / 2)
          diffInterval[1] = Math.max(curInRange, (curInRange + before) / 2)
        }
        else {
          sameDirectionCoord = before

          const afterInRange = after + range[1] - range[0]
          diffInterval[0] = Math.min(cur, (afterInRange + cur) / 2)
          diffInterval[1] = Math.max(cur, (afterInRange + cur) / 2)
        }
        const sameInterval = [
          Math.min(cur, (sameDirectionCoord + cur) / 2),
          Math.max(cur, (sameDirectionCoord + cur) / 2),
        ]

        if (
          (coordinate > sameInterval[0] && coordinate <= sameInterval[1])
          || (coordinate >= diffInterval[0] && coordinate <= diffInterval[1])
        ) {
          (index = unsortedTicks[i].index!)
          break
        }
      }
      else {
        const minValue = Math.min(before, after)
        const maxValue = Math.max(before, after)

        if (coordinate > (minValue + cur) / 2 && coordinate <= (maxValue + cur) / 2) {
          index = unsortedTicks[i].index!
          break
        }
      }
    }
  }
  else {
    // ticks are distributed in a single direction
    for (let i = 0; i < len; i++) {
      if (
        (i === 0 && coordinate <= (ticks[i].coordinate + ticks[i + 1].coordinate) / 2)
        || (i > 0
          && i < len - 1
          && coordinate > (ticks[i].coordinate + ticks[i - 1].coordinate) / 2
          && coordinate <= (ticks[i].coordinate + ticks[i + 1].coordinate) / 2)
        || (i === len - 1 && coordinate > (ticks[i].coordinate + ticks[i - 1].coordinate) / 2)
      ) {
        index = ticks[i].index!
        break
      }
    }
  }

  return index
}

export function getActiveCoordinate(
  layout: LayoutType,
  tooltipTicks: readonly TickItem[],
  activeIndex: number,
  rangeObj: RangeObj,
): ChartCoordinate {
  const entry = tooltipTicks.find(tick => tick && tick.index === activeIndex)

  if (entry) {
    if (layout === 'horizontal') {
      return rangeObj.y == null ? { x: 0, y: 0 } : { x: entry.coordinate, y: rangeObj.y }
    }
    if (layout === 'vertical') {
      return rangeObj.x == null ? { x: 0, y: 0 } : { x: rangeObj.x, y: entry.coordinate }
    }
    if (layout === 'centric') {
      const angle = entry.coordinate
      const { cx, cy, radius } = rangeObj
      if (cx == null || cy == null || radius == null)
        return { x: 0, y: 0 }

      return {
        ...rangeObj,
        ...polarToCartesian(cx, cy, radius, angle),
        angle,
        radius,
      }
    }

    const radius = entry.coordinate
    const { cx, cy, angle } = rangeObj
    if (cx == null || cy == null || angle == null)
      return { x: 0, y: 0 }

    return {
      ...rangeObj,
      ...polarToCartesian(cx, cy, radius, angle),
      angle,
      radius,
    }
  }

  return { x: 0, y: 0 }
}
