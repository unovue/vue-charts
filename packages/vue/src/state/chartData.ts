import type { BrushStartEndIndex, ChartData } from '@/types/chartData'

export type {
  ChartData,
  BrushStartEndIndex,
  AppliedChartData,
  ChartDataState,
} from '@/types/chartData'
import { computed, shallowRef, watch } from 'vue'

export function createChartData(source: () => ChartData | undefined) {
  const range = shallowRef<BrushStartEndIndex>({ startIndex: 0, endIndex: 0 })
  // Data changes reconcile the uncontrolled Brush range; data itself stays with its owner.
  watch(source, (data) => {
    setRange({
      startIndex: data == null ? 0 : range.value.startIndex,
      endIndex: data == null ? 0 : data.length > 0 ? data.length - 1 : range.value.endIndex,
    })
  }, { immediate: true, flush: 'sync' })

  const state = computed(() => ({
    chartData: source(),
    dataStartIndex: range.value.startIndex,
    dataEndIndex: range.value.endIndex,
  }))

  function setRange(value: Partial<BrushStartEndIndex>) {
    const current = range.value
    const startIndex = value.startIndex ?? current.startIndex
    const endIndex = value.endIndex ?? current.endIndex
    if (current.startIndex !== startIndex || current.endIndex !== endIndex)
      range.value = { startIndex, endIndex }
  }

  return { state, setRange }
}
