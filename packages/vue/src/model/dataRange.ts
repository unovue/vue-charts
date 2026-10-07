import type { BrushStartEndIndex, ChartData } from '@/types/chartData'

import { computed, shallowRef } from 'vue'

/**
 * The displayed row window. A registered Brush owns it (`null` = all rows); without a Brush the
 * chart follows the last range received from a synchronised peer. `undefined` from `brushRange`
 * means no Brush is registered.
 */
export function createChartData(
  source: () => ChartData | undefined,
  brushRange: () => BrushStartEndIndex | null | undefined = () => undefined,
) {
  const synced = shallowRef<BrushStartEndIndex | null>(null)
  const range = computed(() => {
    const length = source()?.length ?? 0
    const owned = brushRange()
    return normalizeBrushRange(owned === undefined ? synced.value : owned, length)
      ?? { startIndex: 0, endIndex: Math.max(0, length - 1) }
  })

  const state = computed(() => ({
    chartData: source(),
    dataStartIndex: range.value.startIndex,
    dataEndIndex: range.value.endIndex,
  }))

  /** Follow a synchronised peer's range; used only when this chart has no Brush. */
  function receiveSyncedRange(value: BrushStartEndIndex) {
    synced.value = value
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

  // Recharts parity: tooltip payloads keep empty item arrays and slice item-owned data too.
  function tooltipData(itemData: unknown): unknown {
    const { chartData, dataStartIndex, dataEndIndex } = state.value
    const data = itemData ?? chartData
    return Array.isArray(data) && dataStartIndex + dataEndIndex !== 0
      ? data.slice(dataStartIndex, dataEndIndex + 1)
      : data
  }

  return { state, receiveSyncedRange, displayedData, tooltipData }
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
