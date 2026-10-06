import type { ActiveTooltipProps } from '@/state/chartTooltip'
import type { AxisRange, AxisType } from '@/types/axis'
import type { ChartOffsetRequired, ChartPointer, LayoutType, TickItem } from '@/types'
import type { PolarViewBoxRequired } from '@/cartesian/type'
import { calculateActiveTickIndex, calculateTooltipPos, getActiveCoordinate, inRange } from '@/utils/chart'

export function combineActiveProps(chartEvent: ChartPointer | undefined, layout: LayoutType | undefined, polarViewBox: PolarViewBoxRequired | undefined, tooltipAxisType: AxisType | undefined, tooltipAxisRange: AxisRange | undefined, tooltipTicks: ReadonlyArray<TickItem> | undefined | null, orderedTooltipTicks: ReadonlyArray<TickItem> | undefined, offset: ChartOffsetRequired): ActiveTooltipProps | undefined {
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
