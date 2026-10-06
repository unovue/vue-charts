import { useChart } from '@/model/chart'
import { computed, watchEffect } from 'vue'
import { BRUSH_SYNC_EVENT, eventCenter } from '@/utils/events'
import type { BrushStartEndIndex } from '@/types/chartData'

export function useBrushChartSynchronisation() {
  const chart = useChart()
  const syncId = computed(() => chart.rootProps.value.syncId)
  const eventEmitterSymbol = computed(() => chart.options.value.eventEmitter)
  const brushStartIndex = computed(() => chart.dataRange.state.value.dataStartIndex)
  const brushEndIndex = computed(() => chart.dataRange.state.value.dataEndIndex)

  watchEffect(() => {
    if (syncId.value == null || brushStartIndex.value == null || brushEndIndex.value == null || eventEmitterSymbol.value == null) {
      return
    }
    const range: BrushStartEndIndex = { startIndex: brushStartIndex.value, endIndex: brushEndIndex.value }
    eventCenter.emit(BRUSH_SYNC_EVENT, syncId.value, range, eventEmitterSymbol.value)
  })
}
