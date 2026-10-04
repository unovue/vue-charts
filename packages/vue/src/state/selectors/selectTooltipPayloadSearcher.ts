import type { RechartsRootState } from '../chartState'
import type { TooltipPayloadSearcher } from '../chartTooltip'

export function selectTooltipPayloadSearcher(state: RechartsRootState): TooltipPayloadSearcher | undefined {
  return state.options.tooltipPayloadSearcher
}
