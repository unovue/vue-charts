import { createChartCartesianAxis } from './chartCartesianAxis'
import { createChartGraphicalItems } from './chartGraphicalItems'
import type { ChartOptions } from './chartOptions'
import { createChartReferenceElements } from './chartReferenceElements'
import { createChartPolarAxis } from './chartPolarAxis'
import { createChartPolarOptions } from './chartPolarOptions'
import { createChartRootProps } from './chartRootProps'
import { createChartOptions } from './chartOptions'
import { createChartLegend } from './chartLegend'
import { createChartBrush } from './chartBrush'
import { computed, inject, provide } from 'vue'
import type { InjectionKey } from 'vue'
import type { RechartsRootState } from './chartState'
import { createChartLayout } from './chartLayout'
import { createChartData } from './chartData'
import { createChartTooltip } from './chartTooltip'

interface ChartContext {
  view: RechartsRootState
  layout: ReturnType<typeof createChartLayout>
  data: ReturnType<typeof createChartData>
  brush: ReturnType<typeof createChartBrush>
  legend: ReturnType<typeof createChartLegend>
  options: ReturnType<typeof createChartOptions>
  rootProps: ReturnType<typeof createChartRootProps>
  polarOptions: ReturnType<typeof createChartPolarOptions>
  polarAxis: ReturnType<typeof createChartPolarAxis>
  referenceElements: ReturnType<typeof createChartReferenceElements>
  cartesianAxis: ReturnType<typeof createChartCartesianAxis>
  graphicalItems: ReturnType<typeof createChartGraphicalItems>
  tooltip: ReturnType<typeof createChartTooltip>
}

const chartContextKey: InjectionKey<ChartContext> = Symbol('chart-state')

export function provideChartContext(initialOptions?: ChartOptions) {
  const layout = createChartLayout()
  const cartesianAxis = createChartCartesianAxis()
  const graphicalItems = createChartGraphicalItems()
  const brush = createChartBrush()
  const legend = createChartLegend()
  const options = createChartOptions(initialOptions)
  const rootProps = createChartRootProps()
  const polarOptions = createChartPolarOptions()
  const polarAxis = createChartPolarAxis()
  const referenceElements = createChartReferenceElements()
  const data = createChartData()
  const tooltip = createChartTooltip()
  // A stable view lets Vue track only the domains each selector reads.
  const view: RechartsRootState = Object.freeze({
    get cartesianAxis() { return cartesianAxis.state.value },
    get graphicalItems() { return graphicalItems.state.value },
    get layout() { return layout.state.value },
    get chartData() { return data.state.value },
    get brush() { return brush.state.value },
    get legend() { return legend.state.value },
    get options() { return options.state.value },
    get rootProps() { return rootProps.state.value },
    get polarOptions() { return polarOptions.state.value },
    get polarAxis() { return polarAxis.state.value },
    get referenceElements() { return referenceElements.state.value },
    get tooltip() { return tooltip.state.value },
  })
  provide(chartContextKey, { view, layout, data, brush, legend, options, rootProps, polarOptions, polarAxis, referenceElements, tooltip, cartesianAxis, graphicalItems })
}

function useChartContext() {
  const context = inject(chartContextKey)
  if (!context) {
    throw new Error('Chart state must be used inside a chart component.')
  }
  return context
}

export function useChartLayoutActions() {
  return useChartContext().layout
}

export function useChartDataActions() {
  return useChartContext().data
}

export function useAppSelector<Selected>(selector: (state: RechartsRootState) => Selected) {
  const { view } = useChartContext()
  return computed(() => selector(view))
}

export function useChartTooltip() {
  return useChartContext().tooltip
}

export function useChartBrush() {
  return useChartContext().brush
}

export function useChartLegend() {
  return useChartContext().legend
}

export function useChartOptions() {
  return useChartContext().options
}

export function useChartRootProps() {
  return useChartContext().rootProps
}

export function useChartPolarOptions() {
  return useChartContext().polarOptions
}

export function useChartPolarAxis() {
  return useChartContext().polarAxis
}

export function useChartReferenceElements() {
  return useChartContext().referenceElements
}

export function useChartCartesianAxis() {
  return useChartContext().cartesianAxis
}

export function useChartGraphicalItems() {
  return useChartContext().graphicalItems
}
