import { parseTooltipIndex } from '@/core/tooltip'
import type { TooltipIndex, TooltipPayloadSearcher } from '@/types/tooltip'
import type { TooltipEventType } from '@/types'

/** Internal options remain fixed for the lifetime of a chart root. */
export type ChartOptions = {
  chartName: string
  defaultTooltipEventType: TooltipEventType
  validateTooltipEventTypes?: ReadonlyArray<TooltipEventType>
  tooltipPayloadSearcher: TooltipPayloadSearcher | undefined
  /**
   * We use this to identify which chart is sending events when synchronising.
   * Without it, we can't tell the difference between an action that arrived from another chart
   * and an action that was dispatched by the chart itself.
   */
  eventEmitter: symbol | undefined
}

export function arrayTooltipSearcher(data: unknown, strIndex: TooltipIndex): unknown {
  if (!strIndex || !Array.isArray(data))
    return undefined
  const numIndex = parseTooltipIndex(strIndex)
  if (numIndex === null) {
    return undefined
  }
  return data?.[numIndex]
}
