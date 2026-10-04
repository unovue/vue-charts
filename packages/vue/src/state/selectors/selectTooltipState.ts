import type { RechartsRootState } from '../store'
import type { TooltipState } from '../chartTooltip'

export const selectTooltipState = (state: RechartsRootState): TooltipState => state.tooltip
