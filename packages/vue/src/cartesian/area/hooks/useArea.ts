import type { ComputedRef, InjectionKey, Ref, SVGAttributes, ShallowRef, VNodeChild } from 'vue'
import { useChartId } from '@/hooks/useChartId'
import { useChartPresentation } from '@/model/presentation'
import type { AreaDotSlotProps, ResolvedAreaProps } from '@/cartesian/area/type'
import { computed, inject, provide } from 'vue'
import { useChart } from '@/model/chart'
import { computeArea } from '@/core/area'
import { getNormalizedStackId } from '@/core/coordinates'
import { useNeedsClip } from '@/cartesian/useNeedsClip'
import type { AreaPointItem, ComputedArea } from '@/core/area'

export interface AreaContext {
  clipPathId: Ref<string>
  layout: Ref<'horizontal' | 'vertical' | 'centric' | 'radial'>
  points: Ref<ReadonlyArray<AreaPointItem> | undefined>
  props: ResolvedAreaProps
  attrs: SVGAttributes
  /** True when an axis has allowDataOverflow, so the series is clipped to the plot. */
  needClip: ComputedRef<boolean>
  dotSlot?: (props: AreaDotSlotProps) => VNodeChild
  areaData: Readonly<ShallowRef<ComputedArea | undefined>>
}

const AreaContextKey: InjectionKey<AreaContext> = Symbol('AreaContext')

function provideAreaContext(context: AreaContext) {
  provide(AreaContextKey, context)
}

export function useAreaContext() {
  const context = inject(AreaContextKey)
  if (!context) {
    throw new Error('useAreaContext must be used within Area component')
  }
  return context
}

export function useArea(props: ResolvedAreaProps, attrs: SVGAttributes = {}, dotSlot?: (props: AreaDotSlotProps) => VNodeChild) {
  const chart = useChart()
  const layout = useChartPresentation().layout
  const capabilities = useChartPresentation().capabilities
  const localId = useChartId('v-charts-area')
  const clipPathId = computed(() => props.id || localId)

  const { needClip } = useNeedsClip(() => props.xAxisId, () => props.yAxisId)
  // Areas draw only in cartesian layouts of charts that list them (AreaChart, ComposedChart).
  const shouldRender = computed(() =>
    (layout.value === 'horizontal' || layout.value === 'vertical')
    && capabilities.value.series.includes('area'),
  )

  const areaSettings = computed(
    () => ({
      baseValue: props.baseValue,
      stackId: props.stackId,
      connectNulls: props.connectNulls,
      data: props.data,
      dataKey: props.dataKey,
    }),
  )
  const xAxis = computed(() => chart.axis('xAxis', props.xAxisId))
  const yAxis = computed(() => chart.axis('yAxis', props.yAxisId))
  const stackedData = computed(() => {
    const numericAxis = layout.value === 'horizontal' ? yAxis.value : xAxis.value
    const stackId = getNormalizedStackId(props.stackId)
    return stackId == null
      ? undefined
      : numericAxis.stackGroups.value[stackId]?.stackedData
        .find(stack => stack.key === props.dataKey)
  })
  const areaData = computed(() => {
    const x = xAxis.value.withScale.value
    const y = yAxis.value.withScale.value
    const xTicks = xAxis.value.graphicalTicks.value
    const yTicks = yAxis.value.graphicalTicks.value
    const { dataStartIndex } = chart.dataRange.state.value
    const displayedData = chart.dataRange.displayedData(props)
    const type = layout.value
    if (!x || !y || !xTicks?.length || !yTicks?.length || !displayedData
      || (type !== 'horizontal' && type !== 'vertical')) {
      return undefined
    }
    return computeArea({
      layout: type,
      xAxis: x,
      yAxis: y,
      xAxisTicks: xTicks,
      yAxisTicks: yTicks,
      dataStartIndex,
      areaSettings: areaSettings.value,
      stackedData: stackedData.value,
      displayedData,
      chartBaseValue: undefined,
      bandSize: (type === 'horizontal' ? xAxis.value : yAxis.value).bandSize.value!,
    })
  })
  const areaContext: AreaContext = {
    clipPathId,
    layout,
    points: computed(() => areaData.value?.points),
    props,
    attrs,
    needClip,
    dotSlot,
    areaData,
  }

  provideAreaContext(areaContext)

  return {
    shouldRender,
    areaData,
    points: areaContext.points,
    clipPathId,
    needClip,
  }
}
