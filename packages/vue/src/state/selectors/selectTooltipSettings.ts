import type { RechartsRootState } from '../chartState'
import type { TooltipSettingsState } from '../chartTooltip'

export const selectTooltipSettings = (state: RechartsRootState): TooltipSettingsState => state.tooltip.settings
