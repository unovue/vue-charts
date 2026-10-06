import type { TooltipPayloadSearcher } from '@/types/tooltip'
import type { TooltipEventType } from '@/types'

/** Internal options remain fixed for the lifetime of a chart root. */
export type ChartOptions = {
  chartName: string
  defaultTooltipEventType: TooltipEventType
  validateTooltipEventTypes?: ReadonlyArray<TooltipEventType>
  tooltipPayloadSearcher?: TooltipPayloadSearcher
  /**
   * We use this to identify which chart is sending events when synchronising.
   * Without it, we can't tell the difference between an action that arrived from another chart
   * and an action that was dispatched by the chart itself.
   */
  eventEmitter: symbol | undefined
}
