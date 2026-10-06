import { createRegistries } from '@/model/registries'
import type { ChartRegistries } from '@/model/registries'
import type { Registry } from '@/model/registry'
import type { AxisId } from './chartCartesianAxis'
import type { ChartOptions } from './chartOptions'
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
  polarAxis: ChartRegistries['axes']
  referenceElements: ChartRegistries['references']
  cartesianAxis: ChartRegistries['axes']
  graphicalItems: ChartRegistries['items']
  tooltip: ReturnType<typeof createChartTooltip>
}

const chartContextKey: InjectionKey<ChartContext> = Symbol('chart-state')

export function provideChartContext(initialOptions?: ChartOptions, chart?: Chart) {
  const root = chart ?? createStandaloneInputs(initialOptions)
  const registries = chart ?? createRegistries()
  const { axes, items, references } = registries
  const xAxis = axisSettings(axes.xAxis)
  const yAxis = axisSettings(axes.yAxis)
  const zAxis = axisSettings(axes.zAxis)
  const angleAxis = axisSettings(axes.angleAxis)
  const radiusAxis = axisSettings(axes.radiusAxis)
  const brush = createChartBrush()
  const legend = createChartLegend(registries.legendEntries)
  const data = createChartData(() => chart?.data.value)
  const tooltip = createChartTooltip(registries.tooltipEntries)
  // A stable view lets Vue track only the domains each selector reads.
  const view: RechartsRootState = Object.freeze({
    cartesianAxis: {
      get xAxis() { return xAxis.value },
      get yAxis() { return yAxis.value },
      get zAxis() { return zAxis.value },
    },
    graphicalItems: {
      get cartesianItems() { return items.cartesian.entries.value },
      get polarItems() { return items.polar.entries.value },
    },
    get layout() { return root.layout.value },
    get chartData() { return data.state.value },
    get brush() { return brush.state.value },
    legend: {
      get settings() { return legend.state.value.settings },
      get size() { return legend.state.value.size },
      get hidden() { return legend.state.value.hidden },
      get payload() { return legend.entries.entries.value },
    },
    get options() { return root.options.value },
    get rootProps() { return root.rootProps.value },
    get polarOptions() { return root.polarOptions.value },
    polarAxis: {
      get angleAxis() { return angleAxis.value },
      get radiusAxis() { return radiusAxis.value },
    },
    referenceElements: {
      get dots() { return references.dots.entries.value },
      get areas() { return references.areas.entries.value },
      get lines() { return references.lines.entries.value },
    },
    get tooltip() { return tooltip.state.value },
  })
  provide(chartContextKey, {
    view,
    layout: root,
    data,
    brush,
    legend,
    polarAxis: axes,
    referenceElements: references,
    tooltip,
    cartesianAxis: axes,
    graphicalItems: items,
  })
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

function axisSettings<T extends { id?: AxisId }>(registry: Registry<T>) {
  return computed(() => Object.fromEntries(registry.entries.value.map(axis => [axis.id, axis])))
}
