import type { LinePointItem, LineSlots, ResolvedLineProps } from '../type'
import { useChartId } from '@/hooks/useChartId'
import { useChartLayout } from '@/context/chartLayoutContext'
import { useChartPresentation } from '@/model/presentation'
import type { ComputedRef, InjectionKey, Ref, SVGAttributes, ShallowRef } from 'vue'
import { computed, inject, provide, shallowRef } from 'vue'
import { useChart } from '@/model/chart'
import { computeLinePoints } from '@/core/line'
import { isClipDot } from '@/core/coordinates'
import { useNeedsClip } from '@/cartesian/useNeedsClip'

export interface LineContext {
  clipPathId: Ref<string>
  layout: Readonly<Ref<string>>
  points: Ref<ReadonlyArray<LinePointItem> | undefined>
  props: ResolvedLineProps
  attrs: SVGAttributes
  lineData: Readonly<ShallowRef<ReadonlyArray<LinePointItem> | undefined>>
  needClip: ComputedRef<boolean>
  clipDot: ComputedRef<boolean>
  shapeSlot?: LineSlots['shape']
  dotSlot?: LineSlots['dot']
  labelSlot?: LineSlots['label']
  /** The labels as drawn on this frame; LabelList children read them. */
  labelData: ShallowRef<ComputedRef<readonly import('@/components/label/types').Data[]> | undefined>
}

const LineContextKey: InjectionKey<LineContext> = Symbol('LineContext')

function provideLineContext(context: LineContext) {
  provide(LineContextKey, context)
}

export function useLineContext() {
  const context = inject(LineContextKey)
  if (!context) {
    throw new Error('useLineContext must be used within Line component')
  }
  return context
}

export function useLine(
  props: ResolvedLineProps,
  attrs: SVGAttributes = {},
  shapeSlot?: LineSlots['shape'],
  dotSlot?: LineSlots['dot'],
  labelSlot?: LineSlots['label'],
) {
  const chart = useChart()
  const layout = useChartLayout()
  const chartName = useChartPresentation().name
  const localId = useChartId('v-charts-line')
  const clipPathId = computed(() => props.id || localId)

  const { needClip } = useNeedsClip(() => props.xAxisId, () => props.yAxisId)

  const shouldRender = computed(() =>
    (layout.value === 'horizontal' || layout.value === 'vertical')
    && (chartName.value === 'LineChart' || chartName.value === 'ComposedChart'),
  )

  const xAxis = computed(() => chart.axis('xAxis', props.xAxisId))
  const yAxis = computed(() => chart.axis('yAxis', props.yAxisId))
  const lineData = computed(() => {
    const x = xAxis.value.withScale.value
    const y = yAxis.value.withScale.value
    const xTicks = xAxis.value.graphicalTicks.value
    const yTicks = yAxis.value.graphicalTicks.value
    const displayedData = chart.dataRange.displayedData(props)
    if (!x || !y || !xTicks?.length || !yTicks?.length || !displayedData)
      return undefined
    return computeLinePoints({
      layout: layout.value,
      xAxis: x,
      yAxis: y,
      xAxisTicks: xTicks,
      yAxisTicks: yTicks,
      dataKey: props.dataKey,
      bandSize: (layout.value === 'horizontal' ? xAxis.value : yAxis.value).bandSize.value!,
      displayedData,
    })
  })

  const clipDot = computed(() => isClipDot(props.dot))

  const lineContext: LineContext = {
    clipPathId,
    layout,
    points: computed(() => lineData.value),
    props,
    attrs,
    lineData,
    needClip,
    clipDot,
    shapeSlot,
    dotSlot,
    labelSlot,
    labelData: shallowRef(undefined),
  }

  provideLineContext(lineContext)

  return {
    shouldRender,
    needClip,
    lineData,
    points: lineContext.points,
    clipPathId,
    labelData: computed(() => lineContext.labelData.value?.value),
  }
}
