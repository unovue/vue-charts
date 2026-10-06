import { combineLegendArea, combineRegisteredAxes } from '@/core/layout'
import { getBandSizeOfAxis } from '@/core/axis/scale'
import { provideChartPresentation } from './presentation'
import { createTooltip, provideTooltipController } from './tooltip'
import { createPolarLayout } from '@/model/polar'
import { createAxes } from './axis'
import type { AxisLookup } from './axis'
import { createChartData } from '@/model/dataRange'
import { createLayout } from './layout'
import type { ChartGeometry } from './layout'
import { createChartBrush } from '@/model/brush'
import { createChartLegend } from '@/model/legend'
import type { ChartRegistries } from './registries'
import { createRegistries } from './registries'
import type { ComputedRef, InjectionKey } from 'vue'
import { computed, getCurrentScope, inject, provide, shallowRef } from 'vue'
import type { LayoutType, Margin, Size } from '@/types'
import type { CartesianViewBoxRequired } from '@/types/viewBox'
import type { ChartData } from '@/types/chartData'
import type { ChartLayoutState } from '@/types/chartLayout'
import type { ChartOptions } from '@/model/options'
import type { PolarChartOptions } from '@/types/polarOptions'
import type { UpdatableChartOptions } from '@/types/chartOptions'
import { useTrackedData } from '@/hooks/useTrackedData'

export interface ChartInputs {
  data: () => ChartData | undefined
  layout: () => LayoutType
  size: () => Size
  margin: () => Margin
  options: () => UpdatableChartOptions
  polar: () => PolarChartOptions | null
  tooltip: () => Omit<ChartOptions, 'eventEmitter'>
}

export interface Chart extends ChartRegistries, ChartGeometry {
  readonly legendArea: ComputedRef<CartesianViewBoxRequired>
  readonly direction: ComputedRef<string | undefined>
  readonly tooltip: ReturnType<typeof createTooltip>
  readonly polarLayout: ReturnType<typeof createPolarLayout>
  readonly axis: AxisLookup
  readonly dataRange: ReturnType<typeof createChartData>
  readonly inputs: ChartInputs
  readonly data: ComputedRef<ChartData | undefined>
  readonly layout: ComputedRef<ChartLayoutState>
  readonly rootProps: ComputedRef<UpdatableChartOptions>
  readonly polarOptions: ComputedRef<PolarChartOptions | null>
  readonly options: ComputedRef<ChartOptions>
  readonly brush: ReturnType<typeof createChartBrush>
  readonly legend: ReturnType<typeof createChartLegend>
  setScale: (scale: number) => void
}

const chartKey: InjectionKey<Chart> = Symbol('vccs-chart')

export function createChart(inputs: ChartInputs): Chart {
  const scope = getCurrentScope()
  if (!scope)
    throw new Error('vccs: createChart must run inside a chart scope.')

  const scale = shallowRef(1)
  const eventEmitter = Symbol('vccs-chart-emitter')
  const data = useTrackedData(inputs.data)
  const layout = computed(() => ({
    layoutType: inputs.layout(),
    ...inputs.size(),
    margin: { ...inputs.margin() },
    scale: scale.value,
  }))
  const rootProps = computed(inputs.options)
  const polarOptions = computed(inputs.polar)
  const options = computed(() => ({ ...inputs.tooltip(), eventEmitter }))

  function setScale(value: number) {
    scale.value = value
  }

  const dataRange = createChartData(() => data.value)
  const registries = createRegistries()
  const brush = createChartBrush()
  const legend = createChartLegend(registries.legendEntries)
  const geometry = createLayout({
    layout: () => layout.value,
    brush: () => brush.state.value,
    legendSettings: () => legend.state.value.settings,
    legendSize: () => legend.state.value.size,
    axes: registries.axes,
  })
  const polarLayout = createPolarLayout({ layout: inputs.layout, size: inputs.size, offset: () => geometry.offset.value, polar: inputs.polar })
  const axis = createAxes(scope, {
    polarLayout,
    size: inputs.size,
    offset: () => geometry.offset.value,
    name: () => options.value.chartName,
    hasBar: () => registries.items.cartesian.entries.value.some(item => item.type === 'bar')
      || registries.items.polar.entries.value.some(item => item.type === 'radialBar'),
    barCategoryGap: () => rootProps.value.barCategoryGap,
    ...registries,
    dataWithIndexes: dataRange.state,
    layout: inputs.layout,
    stackOffset: () => rootProps.value.stackOffset,
  })
  const tooltip = createTooltip({
    axis,
    entries: registries.tooltipEntries,
    data: dataRange.state,
    layout: inputs.layout,
    size: inputs.size,
    offset: () => geometry.offset.value,
    options: () => options.value,
  })
  const legendArea = computed(() => combineLegendArea(inputs.size(), inputs.margin()))
  const direction = computed(() => {
    if (inputs.layout() === 'horizontal')
      return combineRegisteredAxes(registries.axes.xAxis.entries.value).some(axis => axis.reversed) ? 'right-to-left' : 'left-to-right'
    if (inputs.layout() === 'vertical')
      return combineRegisteredAxes(registries.axes.yAxis.entries.value).some(axis => axis.reversed) ? 'bottom-to-top' : 'top-to-bottom'
  })
  return {
    legendArea,
    direction,
    tooltip,
    polarLayout,
    axis,
    dataRange,
    inputs,
    data,
    layout,
    rootProps,
    polarOptions,
    options,
    setScale,
    brush,
    legend,
    ...registries,
    ...geometry,
  }
}

export function provideChart(chart: Chart) {
  provide(chartKey, chart)
  provideTooltipController(chart.tooltip)
  provideChartPresentation({
    name: computed(() => chart.options.value.chartName),
    layout: computed(() => chart.layout.value.layoutType),
    width: chart.width,
    height: chart.height,
    margin: chart.margin,
    viewBox: chart.viewBox,
    offset: chart.offset,
    accessibility: computed(() => chart.rootProps.value.accessibilityLayer !== false),
    bandSize: computed(() => {
      const axis = chart.tooltip.axis.value
      return axis ? getBandSizeOfAxis({ ...axis.settings.value, scale: axis.scale.value! }, chart.tooltip.ticks.value ?? undefined) : undefined
    }),
    syncId: computed(() => chart.rootProps.value.syncId),
    emitter: computed(() => chart.options.value.eventEmitter),
  })
}

export function useChart(): Chart {
  const chart = inject(chartKey, null)
  if (!chart)
    throw new Error('vccs: this component must be used inside a chart.')
  return chart
}
