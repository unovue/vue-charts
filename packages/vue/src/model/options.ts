import type { TooltipPayloadSearcher } from '@/types/tooltip'
import type { TooltipEventType } from '@/types'

/**
 * What a chart root draws, declared by the chart instead of read from its name, so a chart
 * defined with another name behaves the same.
 */
export interface ChartCapabilities {
  /**
   * Scale of a category axis with `scale="auto"`: `point` (Line, Area), `band` (Bar), or `auto`,
   * which is point unless the chart holds a Bar.
   */
  categoryScale: 'point' | 'band' | 'auto'
  /** Axis tooltip cursor: a line (a sector in radial layout), a band rectangle, or a cross. */
  cursor: 'line' | 'rect' | 'cross'
  /** Connected series the chart draws; Line and Area render only where listed. */
  series: ReadonlyArray<'line' | 'area'>
}

export const defaultChartCapabilities: ChartCapabilities = { categoryScale: 'band', cursor: 'line', series: [] }

/** Internal options remain fixed for the lifetime of a chart root. */
export type ChartOptions = {
  chartName: string
  capabilities: ChartCapabilities
  defaultTooltipEventType: TooltipEventType
  validateTooltipEventTypes?: ReadonlyArray<TooltipEventType>
  tooltipPayloadSearcher?: TooltipPayloadSearcher
  /**
   * Identifies the sending chart when synchronising, so a chart ignores its own broadcasts.
   */
  eventEmitter: symbol | undefined
}
