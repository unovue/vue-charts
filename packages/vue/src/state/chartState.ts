import type { ChartGeometry } from '@/model/layout'
import type { ReferenceElementState } from './chartReferenceElements'
import type { PolarAxisState } from './chartPolarAxis'
import type { PolarChartOptions } from './chartPolarOptions'
import type { UpdatableChartOptions } from './chartRootProps'
import type { ChartOptions } from './chartOptions'
import type { LegendState } from './chartLegend'
import type { BrushSettings } from './chartBrush'
import type { TooltipState } from './chartTooltip'
import type { ChartDataState } from './chartData'
import type { ChartLayoutState } from './chartLayout'
import type { CartesianAxisState } from './chartCartesianAxis'
import type { GraphicalItemsState } from './chartGraphicalItems'

export type RechartsRootState = Readonly<{
  offset: ChartGeometry['offset']['value']
  viewBox: ChartGeometry['viewBox']['value']
  axisViewBox: ChartGeometry['axisViewBox']['value']
  brushDimensions: ChartGeometry['brushDimensions']['value']
  cartesianAxis: CartesianAxisState
  graphicalItems: GraphicalItemsState
  layout: ChartLayoutState
  chartData: ChartDataState
  tooltip: TooltipState
  brush: BrushSettings
  legend: LegendState
  options: ChartOptions
  rootProps: UpdatableChartOptions
  polarOptions: PolarChartOptions | null
  polarAxis: PolarAxisState
  referenceElements: ReferenceElementState
}>
