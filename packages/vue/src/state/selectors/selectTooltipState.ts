import type { RechartsRootState } from '../chartState'
import type { TooltipState } from '../chartTooltip'

export const selectTooltipState = (state: RechartsRootState): TooltipState => state.tooltip
