import type { BrushStartEndIndex, ChartData } from '@/types/chartData'

import { computed, shallowRef, watch } from 'vue'

export function createChartData(source: () => ChartData | undefined) {
  const range = shallowRef<BrushStartEndIndex>({ startIndex: 0, endIndex: 0 })
  watch([source, () => source()?.length], ([data]) => {
    setRange({ startIndex: range.value.startIndex, endIndex: (data?.length ?? 1) - 1 })
  }, { immediate: true, flush: 'sync' })

  const state = computed(() => ({
    chartData: source(),
    dataStartIndex: range.value.startIndex,
    dataEndIndex: range.value.endIndex,
  }))

  function setRange(value: Partial<BrushStartEndIndex>) {
    const current = range.value
    const next = normalizeBrushRange({
      startIndex: value.startIndex ?? current.startIndex,
      endIndex: value.endIndex ?? current.endIndex,
    }, source()?.length ?? 0) ?? { startIndex: 0, endIndex: 0 }
    if (current.startIndex !== next.startIndex || current.endIndex !== next.endIndex)
      range.value = next
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

export function normalizeBrushRange(value: BrushStartEndIndex | null, length: number): BrushStartEndIndex | null {
  if (value == null || length === 0
    || !Number.isFinite(value.startIndex) || !Number.isFinite(value.endIndex)) {
    return null
  }
  const start = Math.max(0, Math.min(length - 1, Math.floor(value.startIndex)))
  const end = Math.max(0, Math.min(length - 1, Math.floor(value.endIndex)))
  return { startIndex: Math.min(start, end), endIndex: Math.max(start, end) }
}
