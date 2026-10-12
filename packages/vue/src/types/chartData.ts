export type ChartData = unknown[]

export interface BrushStartEndIndex {
  startIndex: number
  endIndex: number
}

export type AppliedChartData = ReadonlyArray<{ value: unknown }>

export type ChartDataWindow = {
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
