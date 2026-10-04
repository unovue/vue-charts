import type { RechartsRootState } from '@/state/store'
import type { TooltipSyncState } from '@/state/chartTooltip'

export function selectSynchronisedTooltipState(state: RechartsRootState): TooltipSyncState {
  return state.tooltip.syncInteraction
}
