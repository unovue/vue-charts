import type { ChartData } from './chartData'
import type { MaybeStackedGraphicalItem } from './selectors/barSelectors'
import type { AxisId } from './chartCartesianAxis'
import type { ErrorBarDirection } from '@/types/bar'
import type { DataKey } from '@/types'
import type { MinPointSize, NormalizedStackId } from '@/shape'
import type { StackId } from '@/types/tick'

/**
 * ErrorBars have lot more settings but all the others are scoped to the component itself.
 * Only some of them required to be reported to the global store because XAxis and YAxis need to know
 * if the error bar is contributing to extending the axis domain.
 */
export type ErrorBarsSettings = {
  /**
   * The direction is only used in Scatter chart, and decided based on ChartLayout in other charts.
   */
  direction: ErrorBarDirection
  /**
   * The dataKey decides which property from the data will each individual ErrorBar use.
   * If it so happens that the ErrorBar data are bigger than the axis domain,
   * the error bar data will stretch the axis domain.
   */
  dataKey: DataKey<any>
  /*
   * ErrorBar props say that it has explicit xAxis and yAxis props,
   * but actually it always inherits the xAxis and yAxis defined on the parent graphical item.
   */
}

export type CartesianGraphicalItemType = 'area' | 'bar' | 'line' | 'scatter'
export type PolarGraphicalItemType = 'pie' | 'radar' | 'radialBar' | 'funnel'

export interface GraphicalItemSettings extends MaybeStackedGraphicalItem {
  data: ChartData | undefined
  dataKey: DataKey<any> | undefined
  /**
   * Why not just stop pushing the graphical items to state when they are hidden?
   * Well some components decide to continue showing them anyway.
   * Legend for example will keep showing a record for hidden graphical items.
   * Stacks for example will ignore them.
   */
  hide: boolean
}

export type CartesianGraphicalItemSettings = GraphicalItemSettings & {
  type: CartesianGraphicalItemType
  /**
   * Each of the graphical items explicitly says which axis it uses;
   * this property is optional for users but every graphical item must have a default,
   * and it is required here.
   */
  xAxisId: AxisId
  yAxisId: AxisId
  zAxisId: AxisId | undefined
  /**
   * ErrorBars are only rendered if they are explicitly set in the React tree, otherwise this will be an empty array.
   * One graphical item can have multiple error bars. This probably only makes sense in Scatter.
   */
  errorBars: ReadonlyArray<ErrorBarsSettings> | undefined
  stackId: NormalizedStackId | undefined
  /**
   * This property is only used in Bar and RadialBar items
   */
  barSize: number | string | undefined
  minPointSize?: MinPointSize
}

export type PolarGraphicalItemSettings = GraphicalItemSettings & {
  type: PolarGraphicalItemType
  angleAxisId: AxisId
  radiusAxisId: AxisId
  /**
   * Only used by RadialBar items
   */
  barSize: number | string | undefined
  stackId: StackId | undefined
  minPointSize?: number
  maxBarSize?: number
}

export type GraphicalItemsState = {
  /**
   * This is an array of all cartesian graphical items and their settings.
   * Graphical item is a visual representation of data on the chart.
   * Some examples are: Line, Bar.
   *
   * Setup order is stable across prop changes and keyed DOM reorders.
   */
  cartesianItems: ReadonlyArray<CartesianGraphicalItemSettings>
  /**
   * This is an array of all polar graphical items and their settings.
   * Graphical item is a visual representation of data on the chart.
   * Some examples are: Pie, Radar, RadialBar
   *
   * Setup order is stable across prop changes and keyed DOM reorders.
   */
  polarItems: ReadonlyArray<PolarGraphicalItemSettings>
}
