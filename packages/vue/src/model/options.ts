import type { TooltipPayloadSearcher } from '@/types/tooltip'
import type { TooltipEventType } from '@/types'

/** Internal options remain fixed for the lifetime of a chart root. */
export type ChartOptions = {
  chartName: string
  defaultTooltipEventType: TooltipEventType
  validateTooltipEventTypes?: ReadonlyArray<TooltipEventType>
  tooltipPayloadSearcher?: TooltipPayloadSearcher
  /**
   * Identifies the sending chart when synchronising, so a chart ignores its own broadcasts.
   */
  eventEmitter: symbol | undefined
}
