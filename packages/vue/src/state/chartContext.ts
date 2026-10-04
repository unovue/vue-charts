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
import { computed, inject, provide, shallowRef, watchSyncEffect } from 'vue'
import type { InjectionKey, ShallowRef } from 'vue'
import type { AppDispatch, LegacyChartState, RechartsRootState } from './store'
import { createChartLayout } from './chartLayout'
import { createChartData } from './chartData'
import { createChartTooltip } from './chartTooltip'

interface ChartStore {
  getState: () => LegacyChartState
  dispatch: AppDispatch
  subscribe: (listener: () => void) => () => void
}

interface ChartContext {
  state: Readonly<ShallowRef<RechartsRootState>>
  dispatch: AppDispatch
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

export function provideChartContext(store: ChartStore, layout = createChartLayout(), initialOptions?: ChartOptions) {
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
  const legacyState = shallowRef(store.getState())
  watchSyncEffect((onCleanup) => {
    onCleanup(store.subscribe(() => {
      legacyState.value = store.getState()
    }))
  })
  const state = computed(() => ({
    ...legacyState.value,
    cartesianAxis: cartesianAxis.state.value,
    graphicalItems: graphicalItems.state.value,
    layout: layout.state.value,
    chartData: data.state.value,
    brush: brush.state.value,
    legend: legend.state.value,
    options: options.state.value,
    rootProps: rootProps.state.value,
    polarOptions: polarOptions.state.value,
    polarAxis: polarAxis.state.value,
    referenceElements: referenceElements.state.value,
    tooltip: tooltip.state.value,
  }))
  provide(chartContextKey, { state, dispatch: store.dispatch, layout, data, brush, legend, options, rootProps, polarOptions, polarAxis, referenceElements, tooltip, cartesianAxis, graphicalItems })
}

function useChartContext() {
  const context = inject(chartContextKey)
  if (!context) {
    throw new Error('Chart state must be used inside a chart component.')
  }
  return context
}

export function useAppDispatch() {
  return useChartContext().dispatch
}

export function useChartLayoutActions() {
  return useChartContext().layout
}

export function useChartDataActions() {
  return useChartContext().data
}

export function useAppSelector<Selected>(selector: (state: RechartsRootState) => Selected) {
  const { state } = useChartContext()
  return computed(() => selector(state.value))
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
