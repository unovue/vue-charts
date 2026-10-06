import type { ChartDataKey } from '@/types/base'
import { useChart } from '@/model/chart'
import type { AxisSlots, TickFormatter } from '@/types/tick'
import { useCanMeasureText } from '@/model/runtime'
import { useDeferredView } from '@/hooks/deferredView'
import type { ComponentPublicInstance, PropType } from 'vue'
import { computed, defineComponent, isVNode, nextTick, ref, shallowRef, watch } from 'vue'
import type { YAxisSettings } from '@/types/axisSettings'
import { implicitYAxis } from '@/core/axis/settings'
import { CartesianAxis } from '@/cartesian/cartesian-axis/CartesianAxis'
import type { AxisDomain, AxisInterval } from '@/types/axis'
import { getCalculatedYAxisWidth } from '@/utils/YAxisUtils'
import { DEFAULT_Y_AXIS_WIDTH } from '@/utils/const'

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
          class="v-charts-y-axis"
          ref={cartesianAxisRef}
          v-slots={{ tick: slots.tick }}
        />
      )
    }
  },
})

// Register before deferred geometry renders.
const YAxisSettingsDispatcher = defineComponent({
  props: {
    interval: [String, Number],
    yAxisId: {
      type: [String, Number],
      default: 0,
    },
    scale: [String, Function],
    type: String,
    padding: Object,
    allowDataOverflow: Boolean,
    allowDuplicatedCategory: Boolean,
    allowDecimals: Boolean,
    tickCount: Number,
    includeHidden: Boolean,
    reversed: Boolean,
    ticks: Array,
    width: [Number, String] as PropType<number | 'auto'>,
    orientation: String,
    mirror: Boolean,
    hide: Boolean,
    unit: String,
    name: String,
    angle: Number,
    minTickGap: Number,
    tick: { type: [Boolean, Object], default: true },
    tickFormatter: Function as PropType<TickFormatter>,
    domain: Array as PropType<AxisDomain>,
    dataKey: {
      type: [String, Number, Function] as PropType<ChartDataKey>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const { yAxis } = useChart().axes
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
    const settings = computed<YAxisSettings>(() => {
      return {
        ...props,
        interval: props.interval ?? 'preserveEnd',
        id: props.yAxisId,
        width: props.width === 'auto' && measured.value?.id === props.yAxisId
          ? measured.value.width
          : props.width,
        dataKey: props.dataKey,
        includeHidden: props.includeHidden ?? false,
        angle: props.angle ?? 0,
        minTickGap: props.minTickGap ?? 5,
        tick: props.tick ?? true,
      } as YAxisSettings
    })
    yAxis.register(settings)

    const View = useDeferredView(YAxisImpl)
    return () => (
      <View {...props} onMeasure-width={updateWidth} v-slots={slots} />
    )
  },
})

const _YAxis = defineComponent({
  name: 'YAxis',
  props: {
    allowDataOverflow: {
      type: Boolean,
      default: implicitYAxis.allowDataOverflow,
    },
    allowDecimals: {
      type: Boolean,
      default: implicitYAxis.allowDecimals,
    },
    allowDuplicatedCategory: {
      type: Boolean,
      default: implicitYAxis.allowDuplicatedCategory,
    },
    width: {
      type: [Number, String] as PropType<number | 'auto'>,
      default: implicitYAxis.width,
    },
    hide: {
      type: Boolean,
      default: false,
    },
    mirror: {
      type: Boolean,
      default: implicitYAxis.mirror,
    },
    orientation: {
      type: String,
      default: implicitYAxis.orientation,
    },
    padding: {
      type: Object,
      default: implicitYAxis.padding,
    },
    reversed: {
      type: Boolean,
      default: implicitYAxis.reversed,
    },
    scale: {
      type: [String, Function],
      default: implicitYAxis.scale,
    },
    tickCount: {
      type: Number,
      default: implicitYAxis.tickCount,
    },
    type: {
      type: String,
      default: implicitYAxis.type,
    },
    yAxisId: {
      type: [String, Number],
    },
    dataKey: {
      type: [String, Number, Function] as PropType<ChartDataKey>,
      default: undefined,
    },
    tickFormatter: {
      type: Function as PropType<TickFormatter>,
      default: undefined,
    },
    unit: {
      type: String,
      default: undefined,
    },
    interval: {
      type: [String, Number] as PropType<AxisInterval>,
    },
    domain: {
      type: Array as PropType<AxisDomain>,
      default: undefined,
    },
    axisLine: {
      type: [Boolean, Object],
      default: true,
    },
    tickLine: {
      type: [Boolean, Object],
      default: true,
    },
    tickMargin: Number,
    minTickGap: {
      type: Number,
      default: 5,
    },
  },
  setup(props, { attrs, slots }) {
    return () => <YAxisSettingsDispatcher {...props} {...attrs} v-slots={slots} />
  },
})

// Preserve template slot inference in published declarations.
export const YAxis: typeof _YAxis & { new (): { $slots: AxisSlots } } = _YAxis
