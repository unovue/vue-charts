import type { TooltipSource } from '@/model/tooltip'
/**
 * Emits tooltip sync events to other charts (Vue version).
 * No events if syncId is undefined.
 * Ignores syncMethod (handled on receiver).
 *
 * @param tooltipParams computed object containing tooltip parameters
 * @returns void
 */
import { computed, watchEffect } from 'vue'
import { useAppSelector } from '@/state/hooks'
import { selectTooltipDataKey } from '@/state/chartContext'
import type { TooltipSyncMessage } from '@/utils/events'
import { selectSynchronisedTooltipState } from '@/synchronisation/syncSelectors'
import { selectEventEmitter, selectSyncId } from '@/state/selectors/rootPropsSelectors'
import { BRUSH_SYNC_EVENT, TOOLTIP_SYNC_EVENT, eventCenter } from '@/utils/events'
import type { BrushStartEndIndex } from '@/state/chartData'

export function useTooltipChartSynchronisation(source: TooltipSource, enabled: () => boolean) {
  // selectors as computed for reactivity
  const activeDataKey = useAppSelector(state => selectTooltipDataKey(state))
  const eventEmitterSymbol = useAppSelector(selectEventEmitter)
  const syncId = useAppSelector(selectSyncId)
  // const syncMethod = useAppSelector(selectSyncMethod)
  const tooltipState = useAppSelector(selectSynchronisedTooltipState)
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

export function useBrushChartSynchronisation() {
  const syncId = useAppSelector(selectSyncId)
  const eventEmitterSymbol = useAppSelector(selectEventEmitter)
  const brushStartIndex = useAppSelector(state => state.chartData.dataStartIndex)
  const brushEndIndex = useAppSelector(state => state.chartData.dataEndIndex)

  watchEffect(() => {
    if (syncId.value == null || brushStartIndex.value == null || brushEndIndex.value == null || eventEmitterSymbol.value == null) {
      return
    }
    const range: BrushStartEndIndex = { startIndex: brushStartIndex.value, endIndex: brushEndIndex.value }
    eventCenter.emit(BRUSH_SYNC_EVENT, syncId.value, range, eventEmitterSymbol.value)
  })
}
