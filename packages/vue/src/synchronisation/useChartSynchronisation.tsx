import { watchEffect } from 'vue'
import { useAppSelector } from '@/state/hooks'
import { selectEventEmitter, selectSyncId } from '@/state/selectors/rootPropsSelectors'
import { BRUSH_SYNC_EVENT, eventCenter } from '@/utils/events'
import type { BrushStartEndIndex } from '@/state/chartData'

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
