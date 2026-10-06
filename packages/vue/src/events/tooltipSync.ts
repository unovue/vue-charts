import type { TooltipSource } from '@/model/tooltip'
import { useTooltipController } from '@/model/tooltip'
import { useChartPresentation } from '@/model/presentation'
import { computed, watchEffect } from 'vue'
import type { TooltipSyncMessage } from '@/utils/events'
import { TOOLTIP_SYNC_EVENT, eventCenter } from '@/utils/events'

export function useTooltipChartSynchronisation(source: TooltipSource, enabled: () => boolean) {
  // selectors as computed for reactivity
  const tooltip = useTooltipController()
  const presentation = useChartPresentation()
  const activeDataKey = computed(() => tooltip.target.value?.entry?.value?.settings.dataKey)
  const eventEmitterSymbol = presentation.emitter
  const syncId = presentation.syncId
  const tooltipState = computed(() => tooltip.syncInteraction.value)
  const isReceivingSynchronisation = computed(() => tooltipState.value?.active)

  watchEffect(() => {
    if (!enabled())
      return
    if (isReceivingSynchronisation.value)
    /*
       * This chart currently has active tooltip, synchronised from another chart.
       * Let's not send any outgoing synchronisation events while that's happening
       * to avoid infinite loops.
       */
      return
    if (syncId.value == null)
      return
    if (eventEmitterSymbol.value == null)
      return

    const message: TooltipSyncMessage = {
      kind: 'tooltip',
      active: source.active.value,
      coordinate: source.coordinate.value,
      dataKey: activeDataKey.value,
      index: source.index.value === null ? null : String(source.index.value),
      label: source.label.value,
    }
    eventCenter.emit(TOOLTIP_SYNC_EVENT, syncId.value, message, eventEmitterSymbol.value)
  })
}
