import { useChart } from '@/model/chart'
import type { AxisSlots } from '@/types/tick'
import { useCanMeasureText } from '@/model/runtime'
import { useDeferredView } from '@/hooks/deferredView'
import type { ComponentPublicInstance, PropType, SlotsType } from 'vue'
import { computed, defineComponent, isVNode, nextTick, ref, shallowRef, watch } from 'vue'
import type { YAxisSettings } from '@/types/axisSettings'
import { implicitYAxis } from '@/core/axis/settings'
import { CartesianAxis } from '@/cartesian/cartesian-axis/CartesianAxis'
import type { YAxisOrientation, YAxisPadding } from '@/types/axis'
import { AxisVueProps } from './AxisProps'
import { getCalculatedYAxisWidth } from '@/utils/YAxisUtils'
import { DEFAULT_Y_AXIS_WIDTH } from '@/utils/const'
import { forwardsSvgAttributes } from '@/utils/attributes'

// Implementation of the YAxis rendering logic
const YAxisImpl = defineComponent({
  props: {
    yAxisId: {
      type: [String, Number],
      default: 0,
    },
  },
  inheritAttrs: false,
  emits: ['measure-width'],
  setup(props, { attrs, slots, emit }) {
    const chart = useChart()
    const canMeasureText = useCanMeasureText()

    const axisType = 'yAxis'
    const scale = computed(() => chart.axis(axisType, props.yAxisId).scale.value)
    const axisSize = computed(() => chart.axis('yAxis', props.yAxisId!).size.value)
    const position = computed(() => chart.axis('yAxis', props.yAxisId!).position.value)
    const cartesianTickItems = computed(() => chart.axis(axisType, props.yAxisId!).ticks.value)
    const viewBox = computed(() => chart.axisViewBox.value)
    const chartDataLengthEmpty = computed(() => !chart.dataRange.state.value.chartData?.length)

    const cartesianAxisRef = ref<ComponentPublicInstance | null>(null)

    const isAutoWidth = () => attrs.width === 'auto'

    const measureAxisWidth = (): number | undefined => {
      // An axis with no room renders nothing, so its root is a comment node.
      const el: unknown = cartesianAxisRef.value?.$el
      if (!(el instanceof Element)) {
        return undefined
      }
      const ticks = el.getElementsByClassName('v-charts-cartesian-axis-tick-value')
      const label = el.getElementsByClassName('v-charts-label')[0]
      const tickSize = typeof attrs.tickSize === 'number' ? attrs.tickSize : 6
      const tickMargin = typeof attrs.tickMargin === 'number' ? attrs.tickMargin : 2
      return getCalculatedYAxisWidth({ ticks, label, labelGapWithTick: 5, tickSize, tickMargin })
    }

    // Reset to the default width when data becomes available so the axis can shrink back (Recharts 3.x parity)
    watch(chartDataLengthEmpty, (empty) => {
      if (empty === false && isAutoWidth()) {
        emit('measure-width', DEFAULT_Y_AXIS_WIDTH)
      }
    })

    const updateAutoWidth = () => {
      // No dynamic width calculation is done when width !== 'auto'
      // or when a function/VNode is used for label
      if (!canMeasureText.value || !isAutoWidth() || axisSize.value == null) {
        return
      }
      const label = attrs.label
      if (typeof label === 'function' || isVNode(label)) {
        return
      }
      const updatedYAxisWidth = measureAxisWidth()
      if (updatedYAxisWidth == null) {
        return
      }
      // Update the stored measurement only when its rounded width changes
      if (Math.round(axisSize.value.width) !== Math.round(updatedYAxisWidth)) {
        emit('measure-width', updatedYAxisWidth)
      }
    }

    // Measure in a deferred nextTick: updating state synchronously inside a watchPostEffect
    // would hit Vue's activeEffect self-trigger skip and the follow-up re-measure would never run.
    watch(
      [canMeasureText, axisSize, cartesianTickItems, () => attrs.label],
      () => {
        nextTick(updateAutoWidth)
      },
      { flush: 'post', immediate: true },
    )

    return () => {
      const { ...allOtherProps } = props
      if (axisSize.value == null || position.value == null) {
        return null
      }
      return (
        <CartesianAxis
          {...allOtherProps}
          {...attrs}
          viewBox={viewBox.value}
          scale={scale.value!}
          x={position.value?.x}
          y={position.value?.y}
          width={axisSize.value?.width}
          height={axisSize.value?.height}
          ticks={cartesianTickItems.value!}
          tickTextProps={isAutoWidth() ? { width: undefined } : { width: axisSize.value?.width }}
          data-slot="y-axis"
          class="v-charts-y-axis"
          ref={cartesianAxisRef}
          v-slots={{ tick: slots.tick }}
        />
      )
    }
  },
})

export const YAxis = forwardsSvgAttributes(defineComponent({
  name: 'YAxis',
  props: {
    ...AxisVueProps,
    yAxisId: { type: [String, Number], default: 0 },
    width: { type: [Number, String] as PropType<number | 'auto'>, default: implicitYAxis.width },
    orientation: { type: String as PropType<YAxisOrientation>, default: implicitYAxis.orientation },
    padding: { type: [String, Object] as PropType<YAxisPadding>, default: () => ({ top: 0, bottom: 0 }) },
    type: { ...AxisVueProps.type, default: implicitYAxis.type },
  },
  inheritAttrs: false,
  slots: Object as SlotsType<AxisSlots>,
  setup(props, { attrs, slots }) {
    const measured = shallowRef<{ id: string | number, width: number, history: number[] }>()

    function updateWidth(width: number) {
      const previous = measured.value?.id === props.yAxisId ? measured.value : undefined
      if (previous?.width === width)
        return
      const history = previous?.history ?? []
      // Suppress subpixel A → B → A oscillation, preserving the existing guard.
      if (history.length === 3 && history[0] === history[2] && width === history[1]
        && Math.abs(width - history[0]!) <= 1) {
        return
      }
      measured.value = { id: props.yAxisId, width, history: [...history, width].slice(-3) }
    }
    const settings = computed<YAxisSettings>(() => ({
      ...props,
      id: props.yAxisId,
      width: props.width === 'auto' && measured.value?.id === props.yAxisId
        ? measured.value.width
        : props.width,
    }))
    useChart().axes.yAxis.register(settings)
    const View = useDeferredView(YAxisImpl)
    return () => <View {...props} {...attrs} onMeasure-width={updateWidth} v-slots={slots} />
  },
}))
