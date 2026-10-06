import { parseTooltipIndex } from '@/core/tooltip'
import type { TooltipIndex, TooltipPayloadSearcher } from './chartTooltip'
import type { TooltipEventType } from '@/types'

/**
 * These chart options are decided internally, by Recharts,
 * and will not change during the lifetime of the chart.
 *
 * Changing these options can be done by swapping the root element
 * which will create brand-new chart-local state.
 *
 * If you want to store options that can be changed by the user,
 * use UpdatableChartOptions in chartRootProps.ts.
 */
export type ChartOptions = {
  chartName: string
  defaultTooltipEventType: TooltipEventType
  validateTooltipEventTypes?: ReadonlyArray<TooltipEventType>
  // Should this instead be a property of a graphical item? Do we want to mix items with different data types in one chart?
  tooltipPayloadSearcher: TooltipPayloadSearcher | undefined
  /**
   * We use this to identify which chart is sending events when synchronising.
   * Without it, we can't tell the difference between an action that arrived from another chart
   * and an action that was dispatched by the chart itself.
   */
  eventEmitter: symbol | undefined
}

export function arrayTooltipSearcher<T>(data: ReadonlyArray<T>, strIndex: TooltipIndex): T | undefined {
  if (!strIndex)
    return undefined
  const numIndex = parseTooltipIndex(strIndex)
  if (numIndex === null) {
    return undefined
  }
  return data?.[numIndex]
}
