import { createPolarLayout } from '@/model/polar'
import { createAxes } from '@/model/axis'
import { computed, getCurrentScope, inject, provide, shallowRef } from 'vue'
import { createLayout } from '@/model/layout'
import type { ChartGeometry } from '@/model/layout'
import { createRegistries } from '@/model/registries'
import type { ChartRegistries } from '@/model/registries'
import type { Registry } from '@/model/registry'
import type { AxisId } from './chartCartesianAxis'
import type { ChartOptions } from './chartOptions'
import { createChartLegend } from './chartLegend'
import { createChartBrush } from './chartBrush'
import type { Chart } from '@/model/chart'
import { chartDefaults } from '@/model/defaults'
import type { InjectionKey } from 'vue'
import type { RechartsRootState } from './chartState'
import { createChartData } from './chartData'
import { createChartTooltip } from './chartTooltip'

interface ChartContext {
  geometry: ChartGeometry
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
  const brush = chart?.brush ?? createChartBrush()
  const legend = chart?.legend ?? createChartLegend(registries.legendEntries)
  const data = chart?.dataRange ?? createChartData(() => undefined)
  const tooltip = createChartTooltip(registries.tooltipEntries)
  const geometry = chart ?? createLayout({
    layout: () => root.layout.value,
    brush: () => brush.state.value,
    legendSettings: () => legend.state.value.settings,
    legendSize: () => legend.state.value.size,
    axes,
  })
  const scope = getCurrentScope()
  if (!scope)
    throw new Error('vccs: chart context requires an active scope.')
  const polarLayout = chart?.polarLayout ?? createPolarLayout({
    layout: () => root.layout.value.layoutType,
    size: () => root.layout.value,
    offset: () => geometry.offset.value,
    polar: () => root.polarOptions.value,
  })
  const axis = chart?.axis ?? createAxes(scope, {
    polarLayout,
    size: () => root.layout.value,
    offset: () => geometry.offset.value,
    name: () => root.options.value.chartName,
    hasBar: () => items.cartesian.entries.value.some(item => item.type === 'bar')
      || items.polar.entries.value.some(item => item.type === 'radialBar'),
    barCategoryGap: () => root.rootProps.value.barCategoryGap,
    ...registries,
    dataWithIndexes: data.state,
    layout: () => root.layout.value.layoutType,
    stackOffset: () => root.rootProps.value.stackOffset,
  })
  // A stable view lets Vue track only the domains each selector reads.
  const view: RechartsRootState = Object.freeze({
    axis,
    polarLayout,
    get offset() { return geometry.offset.value },
    get viewBox() { return geometry.viewBox.value },
    get axisViewBox() { return geometry.axisViewBox.value },
    get brushDimensions() { return geometry.brushDimensions.value },
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
    geometry,
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

export function useChartAxes() {
  return useChartContext().view.axis
}

export function useChartGeometry() {
  return useChartContext().geometry
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

import type { AxisType } from '@/types/axis'

export function selectXAxisSettings(state: RechartsRootState, id: AxisId) {
  return state.axis('xAxis', id).settings.value
}

export function selectYAxisSettings(state: RechartsRootState, id: AxisId) {
  return state.axis('yAxis', id).settings.value
}

export function selectAngleAxis(state: RechartsRootState, id: AxisId) {
  return state.axis('angleAxis', id).settings.value
}

export function selectRadiusAxis(state: RechartsRootState, id: AxisId) {
  return state.axis('radiusAxis', id).settings.value
}

export function selectAxisSettings(state: RechartsRootState, type: Exclude<AxisType, 'zAxis'>, id: AxisId = 0) {
  return state.axis(type, id).settings.value
}

export function selectAxisScale(state: RechartsRootState, type: AxisType, id: AxisId = 0) {
  return state.axis(type, id).scale.value
}

export function selectTicksOfAxis(state: RechartsRootState, type: Exclude<AxisType, 'zAxis'>, id: AxisId = 0) {
  return state.axis(type, id).ticks.value
}

export function selectTicksOfGraphicalItem(state: RechartsRootState, type: AxisType, id: AxisId = 0) {
  return state.axis(type, id).graphicalTicks.value
}

export function selectAxisWithScale(state: RechartsRootState, type: Exclude<AxisType, 'zAxis'>, id: AxisId = 0) {
  return state.axis(type, id).withScale.value
}

export function selectZAxisWithScale(state: RechartsRootState, type: 'zAxis', id: AxisId = 0) {
  return state.axis(type, id).withScale.value
}

export function selectAxisInverseScale(state: RechartsRootState, type: AxisType, id: AxisId = 0) {
  return state.axis(type, id).inverseScale.value
}

export function selectAxisInverseDataSnapScale(state: RechartsRootState, type: AxisType, id: AxisId = 0) {
  return state.axis(type, id).inverseDataScale.value
}

export function selectAxisInverseTickSnapScale(state: RechartsRootState, type: AxisType, id: AxisId = 0) {
  return state.axis(type, id).inverseTickScale.value
}

export function selectDisplayedData(state: RechartsRootState, type: AxisType, id: AxisId = 0) {
  return state.axis(type, id).displayedData.value
}

export function selectStackGroups(state: RechartsRootState, type: AxisType, id: AxisId = 0) {
  return state.axis(type, id).stackGroups.value
}

export function selectPolarAxisScale(state: RechartsRootState, type: 'angleAxis' | 'radiusAxis', id: AxisId = 0) {
  return state.axis(type, id).scale.value
}

export function selectPolarAxisTicks(state: RechartsRootState, type: 'angleAxis' | 'radiusAxis', id: AxisId = 0) {
  return state.axis(type, id).ticks.value
}

export function selectPolarGraphicalItemAxisTicks(state: RechartsRootState, type: 'angleAxis' | 'radiusAxis', id: AxisId = 0) {
  return state.axis(type, id).graphicalTicks.value
}

export function selectPolarItemsSettings(state: RechartsRootState, type: 'angleAxis' | 'radiusAxis', id: AxisId = 0) {
  return state.axis(type, id).items.value
}

export function selectPolarDisplayedData(state: RechartsRootState, type: 'angleAxis' | 'radiusAxis', id: AxisId = 0) {
  return state.axis(type, id).displayedData.value
}

export function selectUnfilteredCartesianItems(state: RechartsRootState) { return state.graphicalItems.cartesianItems }
export function selectUnfilteredPolarItems(state: RechartsRootState) { return state.graphicalItems.polarItems }
export function selectPolarViewBox(state: RechartsRootState) { return state.polarLayout.viewBox.value }
export function selectChartDirection(state: RechartsRootState) {
  const layout = state.layout.layoutType
  if (layout === 'horizontal')
    return Object.values(state.cartesianAxis.xAxis).some(axis => axis.reversed) ? 'right-to-left' : 'left-to-right'
  if (layout === 'vertical')
    return Object.values(state.cartesianAxis.yAxis).some(axis => axis.reversed) ? 'bottom-to-top' : 'top-to-bottom'
}
export function selectXAxisSize(state: RechartsRootState, id: AxisId) { return state.axis('xAxis', id).size.value }
export function selectYAxisSize(state: RechartsRootState, id: AxisId) { return state.axis('yAxis', id).size.value }
export function selectXAxisPosition(state: RechartsRootState, id: AxisId) { return state.axis('xAxis', id).position.value }
export function selectYAxisPosition(state: RechartsRootState, id: AxisId) { return state.axis('yAxis', id).position.value }
export function selectAxisPropsNeededForCartesianGridTicksGenerator(state: RechartsRootState, type: 'xAxis' | 'yAxis', id: AxisId) {
  return state.axis(type, id).grid.value
}

export type XorYType = Exclude<AxisType, 'zAxis'>
export type PolarAxisType = 'angleAxis' | 'radiusAxis'
export function selectAxisRange(state: RechartsRootState, type: AxisType, id: AxisId) {
  return state.axis(type, id).range.value
}
export function selectHasBar(state: RechartsRootState) {
  return state.graphicalItems.cartesianItems.some(item => item.type === 'bar')
    || state.graphicalItems.polarItems.some(item => item.type === 'radialBar')
}
export function selectReferenceAreas(state: RechartsRootState) { return state.referenceElements.areas }
export function selectReferenceDots(state: RechartsRootState) { return state.referenceElements.dots }
export function selectReferenceLines(state: RechartsRootState) { return state.referenceElements.lines }
export function selectCartesianAxisSize(state: RechartsRootState, type: XorYType, id: AxisId) {
  if (type === 'xAxis')
    return selectXAxisSize(state, id).width
  if (type === 'yAxis')
    return selectYAxisSize(state, id).height
}
