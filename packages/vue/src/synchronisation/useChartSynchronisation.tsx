/**
 * Emits tooltip sync events to other charts (Vue version).
 * No events if syncId is undefined.
 * Ignores syncMethod (handled on receiver).
 *
 * @param tooltipParams computed object containing tooltip parameters
 * @returns void
 */
import type { Ref } from 'vue'
import { computed, watchEffect } from 'vue'
import { useAppSelector } from '@/state/hooks'
import { selectTooltipDataKey } from '@/state/selectors/selectors'
import type { TooltipSyncMessage } from '@/utils/events'
import { selectSynchronisedTooltipState } from '@/synchronisation/syncSelectors'
import { selectEventEmitter, selectSyncId } from '@/state/selectors/rootPropsSelectors'
import type { ChartCoordinate, TooltipEventType, TooltipIndex, TooltipTrigger } from '@/types'
import { BRUSH_SYNC_EVENT, TOOLTIP_SYNC_EVENT, eventCenter } from '@/utils/events'
import type { BrushStartEndIndex } from '@/state/chartData'

export function useTooltipChartSynchronisation(
  {
    tooltipEventType,
    trigger,
    activeCoordinate,
    activeLabel,
    activeIndex,
    isTooltipActive,
  }: {
    tooltipEventType: Ref<TooltipEventType | undefined>
    trigger: TooltipTrigger
    activeCoordinate: Ref<ChartCoordinate | undefined>
    activeLabel: Ref<string | number | undefined>
    activeIndex: Ref<TooltipIndex | undefined>
    isTooltipActive: Ref<boolean>
  },
) {
  // selectors as computed for reactivity
  const activeDataKey = useAppSelector(state => selectTooltipDataKey(state, tooltipEventType.value!, trigger))
  const eventEmitterSymbol = useAppSelector(selectEventEmitter)
  const syncId = useAppSelector(selectSyncId)
  // const syncMethod = useAppSelector(selectSyncMethod)
  const tooltipState = useAppSelector(selectSynchronisedTooltipState)
  const isReceivingSynchronisation = computed(() => tooltipState.value?.active)

  watchEffect(() => {
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
      active: isTooltipActive.value,
      coordinate: activeCoordinate.value,
      dataKey: activeDataKey.value,
      index: activeIndex.value!,
      label: typeof activeLabel.value === 'number' ? String(activeLabel.value) : activeLabel.value,
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
