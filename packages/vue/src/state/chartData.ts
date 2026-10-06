import { computed, shallowRef } from 'vue'

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

export function createChartData() {
  const state = shallowRef<ChartDataState>({
    chartData: undefined,
    dataStartIndex: 0,
    dataEndIndex: 0,
  })

  function setData(chartData: ChartData | undefined) {
    const current = state.value
    const dataStartIndex = chartData == null ? 0 : current.dataStartIndex
    const dataEndIndex = chartData == null ? 0 : chartData.length > 0 ? chartData.length - 1 : current.dataEndIndex
    if (current.chartData === chartData && current.dataStartIndex === dataStartIndex && current.dataEndIndex === dataEndIndex)
      return
    state.value = { ...current, chartData, dataStartIndex, dataEndIndex }
  }

  function setRange(range: Partial<BrushStartEndIndex>) {
    const current = state.value
    const dataStartIndex = range.startIndex ?? current.dataStartIndex
    const dataEndIndex = range.endIndex ?? current.dataEndIndex
    if (current.dataStartIndex === dataStartIndex && current.dataEndIndex === dataEndIndex)
      return
    state.value = { ...current, dataStartIndex, dataEndIndex }
  }

  return { state: computed(() => state.value), setData, setRange }
}
