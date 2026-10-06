import { createLayout } from './layout'
import type { ChartGeometry } from './layout'
import { createChartBrush } from '@/state/chartBrush'
import { createChartLegend } from '@/state/chartLegend'
import type { ChartRegistries } from './registries'
import { createRegistries } from './registries'
import type { ComputedRef, EffectScope, InjectionKey } from 'vue'
import { computed, getCurrentScope, inject, provide, shallowRef } from 'vue'
import type { LayoutType, Margin, Size } from '@/types'
import type { ChartData } from '@/state/chartData'
import type { ChartLayoutState } from '@/state/chartLayout'
import type { ChartOptions } from '@/state/chartOptions'
import type { PolarChartOptions } from '@/state/chartPolarOptions'
import type { UpdatableChartOptions } from '@/state/chartRootProps'
import { useTrackedData } from '@/hooks/useTrackedData'

export interface ChartInputs {
  data: () => ChartData | undefined
  layout: () => LayoutType
  size: () => Size
  margin: () => Margin
  options: () => UpdatableChartOptions
  polar: () => PolarChartOptions | null
  tooltip: Omit<ChartOptions, 'eventEmitter'>
}

export interface Chart extends ChartRegistries, ChartGeometry {
  readonly inputs: ChartInputs
  readonly scope: EffectScope
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
  const options = computed(() => ({ ...inputs.tooltip, eventEmitter }))

  function setScale(value: number) {
    scale.value = value
  }

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
  return {
    inputs,
    scope,
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
}

export function useChart(): Chart {
  const chart = inject(chartKey, null)
  if (!chart)
    throw new Error('vccs: this component must be used inside a chart.')
  return chart
}
