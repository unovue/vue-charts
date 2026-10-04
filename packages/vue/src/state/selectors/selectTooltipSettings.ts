import type { RechartsRootState } from '../store'
import type { TooltipSettingsState } from '../chartTooltip'

export const selectTooltipSettings = (state: RechartsRootState): TooltipSettingsState => state.tooltip.settings
