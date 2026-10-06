import type { BrushStartEndIndex, ChartData } from '@/types/chartData'

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

  function displayedData<T extends readonly unknown[]>(
    item: { data?: T },
    range: 'brush' | 'all' = 'brush',
  ) {
    if (item.data?.length)
      return item.data
    const { chartData, dataStartIndex, dataEndIndex } = state.value
    return range === 'all' ? chartData : chartData?.slice(dataStartIndex, dataEndIndex + 1)
  }

  // React tooltip payloads keep empty item arrays and slice item-owned data too.
  function tooltipData(itemData: unknown): unknown {
    const { chartData, dataStartIndex, dataEndIndex } = state.value
    const data = itemData ?? chartData
    return Array.isArray(data) && dataStartIndex + dataEndIndex !== 0
      ? data.slice(dataStartIndex, dataEndIndex + 1)
      : data
  }

  return { state, setRange, displayedData, tooltipData }
}
