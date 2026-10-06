import { useChart } from '@/model/chart'
import type { AxisSlots, AxisTick } from '@/types/tick'
import { useDeferredView } from '@/hooks/deferredView'
/**
 * @fileOverview X Axis
 */
import type { PropType } from 'vue'
import { computed, defineComponent } from 'vue'
import type { XAxisSettings } from '@/types/axisSettings'
import { implicitXAxis } from '@/core/axis/settings'
import { CartesianAxis } from '@/cartesian/cartesian-axis/CartesianAxis'
import type { XAxisOrientation, XAxisPadding } from '@/types/axis'
import { AxisVueProps } from './AxisProps'

const XAxisImpl = defineComponent({
  props: {
    xAxisId: {
      type: [String, Number],
      default: 0,
    },
    ticks: Array as PropType<ReadonlyArray<AxisTick>>,
  },
  inheritAttrs: false,
  setup(props, { attrs, slots }) {
    const chart = useChart()
    const axisType = 'xAxis'
    const scale = computed(() => chart.axis(axisType, props.xAxisId).scale.value)
    const axisSize = computed(() => chart.axis('xAxis', props.xAxisId!).size.value)
    const position = computed(() => chart.axis('xAxis', props.xAxisId!).position.value)
    const cartesianTickItems = computed(() => chart.axis(axisType, props.xAxisId!).ticks.value)
    const viewBox = computed(() => chart.axisViewBox.value)

    return () => {
      const { ticks, ...allOtherProps } = props
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
          class="v-charts-x-axis"
          v-slots={slots.tick ? { tick: slots.tick } : undefined}
        />
      )
    }
  },
})

const _XAxis = defineComponent({
  name: 'XAxis',
  props: {
    ...AxisVueProps,
    xAxisId: { type: [String, Number], default: 0 },
    height: { type: Number, default: implicitXAxis.height },
    orientation: { type: String as PropType<XAxisOrientation>, default: implicitXAxis.orientation },
    padding: { type: [String, Object] as PropType<XAxisPadding>, default: () => ({ left: 0, right: 0 }) },
    type: { ...AxisVueProps.type, default: implicitXAxis.type },
  },
  inheritAttrs: false,
  setup(props, { attrs, slots }) {
    const settings = computed<XAxisSettings>(() => ({ ...props, id: props.xAxisId }))
    useChart().axes.xAxis.register(settings)
    const View = useDeferredView(XAxisImpl)
    return () => <View {...props} {...attrs} v-slots={slots} />
  },
})

// Preserve template slot inference in published declarations.
export const XAxis: typeof _XAxis & { new (): { $slots: AxisSlots } } = _XAxis
