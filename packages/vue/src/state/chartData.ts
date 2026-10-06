import { computed, shallowRef, watch } from 'vue'

/**
 * This is the data that's coming through main chart `data` prop
 * Recharts is very flexible in what it accepts so the type is very flexible too.
 * This will typically be an object, and various components will provide various `dataKey`
 * that dictates how to pull data from that object.
 *
 * TL;DR: before dataKey
 */
export type ChartData = unknown[]

export interface BrushStartEndIndex {
  startIndex: number
  endIndex: number
}

/**
 * So this is the same unknown type as ChartData but this is after the dataKey has been applied.
 * We still don't know what the type is - that depends on what exactly it was before the dataKey application,
 * and the dataKey can return whatever anyway - but let's keep it separate as a form of documentation.
 *
 * TL;DR: ChartData after dataKey.
 */
export type AppliedChartData = ReadonlyArray<{ value: unknown }>

export type ChartDataState = {
  chartData: ChartData | undefined
  /**
   * Using Brush, users can choose where they want to zoom in.
   * This is zero-based index of the starting data point.
   */
  dataStartIndex: number
  /**
   * Using Brush, users can choose where they want to zoom in.
   * This is zero-based index of the last data point.
   */
  dataEndIndex: number
}

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
