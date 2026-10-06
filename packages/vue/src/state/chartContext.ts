import { createChartCartesianAxis } from './chartCartesianAxis'
import { createChartGraphicalItems } from './chartGraphicalItems'
import type { ChartOptions } from './chartOptions'
import { createChartReferenceElements } from './chartReferenceElements'
import { createChartPolarAxis } from './chartPolarAxis'
import { createChartLegend } from './chartLegend'
import { createChartBrush } from './chartBrush'
import { computed, inject, provide, shallowRef } from 'vue'
import type { Chart } from '@/model/chart'
import { chartDefaults } from '@/model/defaults'
import type { InjectionKey } from 'vue'
import type { RechartsRootState } from './chartState'
import { createChartData } from './chartData'
import { createChartTooltip } from './chartTooltip'

interface ChartContext {
  view: RechartsRootState
  layout: { setScale: (scale: number) => void }
  data: ReturnType<typeof createChartData>
  brush: ReturnType<typeof createChartBrush>
  legend: ReturnType<typeof createChartLegend>
  polarAxis: ReturnType<typeof createChartPolarAxis>
  referenceElements: ReturnType<typeof createChartReferenceElements>
  cartesianAxis: ReturnType<typeof createChartCartesianAxis>
  graphicalItems: ReturnType<typeof createChartGraphicalItems>
  tooltip: ReturnType<typeof createChartTooltip>
}

const chartContextKey: InjectionKey<ChartContext> = Symbol('chart-state')

export function provideChartContext(initialOptions?: ChartOptions, chart?: Chart) {
  const root = chart ?? createStandaloneInputs(initialOptions)
  const cartesianAxis = createChartCartesianAxis()
  const graphicalItems = createChartGraphicalItems()
  const brush = createChartBrush()
  const legend = createChartLegend()
  const polarAxis = createChartPolarAxis()
  const referenceElements = createChartReferenceElements()
  const data = createChartData(() => chart?.data.value)
  const tooltip = createChartTooltip()
  // A stable view lets Vue track only the domains each selector reads.
  const view: RechartsRootState = Object.freeze({
    get cartesianAxis() { return cartesianAxis.state.value },
    get graphicalItems() { return graphicalItems.state.value },
    get layout() { return root.layout.value },
    get chartData() { return data.state.value },
    get brush() { return brush.state.value },
    get legend() { return legend.state.value },
    get options() { return root.options.value },
    get rootProps() { return root.rootProps.value },
    get polarOptions() { return root.polarOptions.value },
    get polarAxis() { return polarAxis.state.value },
    get referenceElements() { return referenceElements.state.value },
    get tooltip() { return tooltip.state.value },
  })
  provide(chartContextKey, { view, layout: root, data, brush, legend, polarAxis, referenceElements, tooltip, cartesianAxis, graphicalItems })
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

function createStandaloneInputs(initialOptions?: ChartOptions) {
  const scale = shallowRef(1)
  const options: ChartOptions = {
    chartName: '',
    defaultTooltipEventType: 'axis',
    tooltipPayloadSearcher: undefined,
    ...initialOptions,
    eventEmitter: Symbol('vccs-chart-emitter'),
  }
  return {
    layout: computed(() => ({
      layoutType: chartDefaults.layout,
      width: 0,
      height: 0,
      margin: chartDefaults.margin,
      scale: scale.value,
    })),
    rootProps: computed(() => chartDefaults),
    polarOptions: computed(() => null),
    options: computed(() => options),
    setScale(value: number) { scale.value = value },
  }
}
