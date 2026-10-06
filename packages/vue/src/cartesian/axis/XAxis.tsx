import type { AxisSlots, AxisTick, TickFormatter } from '@/types/tick'
import { useDeferredView } from '@/hooks/deferredView'
import { selectAxisScale, selectTicksOfAxis, selectXAxisPosition, selectXAxisSize, useChartCartesianAxis } from '@/state/chartContext'
/**
 * @fileOverview X Axis
 */
import type { PropType } from 'vue'
import { computed, defineComponent } from 'vue'
import { useAppSelector } from '@/state/hooks'
import type { XAxisSettings } from '@/state/chartCartesianAxis'
import { implicitXAxis } from '@/core/axis/settings'
import { CartesianAxis } from '@/cartesian/cartesian-axis/CartesianAxis'
import type { DataKey } from '@/types'
import { selectAxisViewBox } from '@/state/selectors/selectChartOffset'
import type { AxisDomain, AxisInterval } from '@/types/axis'

const XAxisImpl = defineComponent({
  props: {
    xAxisId: {
      type: [String, Number],
      default: 0,
    },
    ticks: Array,
  },
  inheritAttrs: false,
  setup(props, { attrs, slots }) {
    const axisType = 'xAxis'
    const scale = useAppSelector(state => selectAxisScale(state, axisType, props.xAxisId))
    const axisSize = useAppSelector(state => selectXAxisSize(state, props.xAxisId!))
    const position = useAppSelector(state => selectXAxisPosition(state, props.xAxisId!))
    const cartesianTickItems = useAppSelector(state => selectTicksOfAxis(state, axisType, props.xAxisId!))
    const viewBox = useAppSelector(selectAxisViewBox)

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

const XAxisSettingsDispatcher = defineComponent({
  props: {
    interval: [String, Number],
    xAxisId: [String, Number],
    scale: [String, Function],
    type: String,
    padding: Object,
    allowDataOverflow: Boolean,
    domain: {
      type: Array as PropType<AxisDomain>,
    },
    dataKey: {
      type: [String, Number, Function] as PropType<DataKey<any>>,
    },
    allowDuplicatedCategory: Boolean,
    allowDecimals: Boolean,
    tickCount: Number,
    includeHidden: Boolean,
    reversed: Boolean,
    ticks: Array,
    height: Number,
    orientation: String,
    mirror: Boolean,
    hide: Boolean,
    unit: String,
    name: String,
    angle: Number,
    minTickGap: Number,
    tick: { type: [Boolean, Object], default: true },
    tickFormatter: Function as PropType<TickFormatter>,
  },
  setup(props, { slots: dispatcherSlots }) {
    const { xAxis } = useChartCartesianAxis()
    const settings = computed<XAxisSettings>(() => {
      return {
        interval: props.interval ?? 'preserveEnd',
        id: props.xAxisId,
        scale: props.scale,
        type: props.type,
        padding: props.padding,
        allowDataOverflow: props.allowDataOverflow,
        domain: props.domain,
        dataKey: props.dataKey,
        allowDuplicatedCategory: props.allowDuplicatedCategory,
        allowDecimals: props.allowDecimals,
        tickCount: props.tickCount,
        includeHidden: props.includeHidden ?? false,
        reversed: props.reversed,
        ticks: props.ticks,
        height: props.height,
        orientation: props.orientation,
        mirror: props.mirror,
        hide: props.hide,
        unit: props.unit,
        name: props.name,
        angle: props.angle ?? 0,
        minTickGap: props.minTickGap ?? 5,
        tick: props.tick ?? true,
        tickFormatter: props.tickFormatter,
      } as XAxisSettings
    })
    xAxis.register(settings)

    const View = useDeferredView(XAxisImpl)
    return () => (
      <View
        {...props}
        v-slots={dispatcherSlots.tick ? { tick: dispatcherSlots.tick } : undefined}
      />
    )
  },
})

const _XAxis = defineComponent({
  name: 'XAxis',
  props: {
    allowDataOverflow: {
      type: Boolean,
      default: implicitXAxis.allowDataOverflow,
    },
    allowDecimals: {
      type: Boolean,
      default: implicitXAxis.allowDecimals,
    },
    allowDuplicatedCategory: {
      type: Boolean,
      default: implicitXAxis.allowDuplicatedCategory,
    },
    height: {
      type: Number,
      default: implicitXAxis.height,
    },
    hide: {
      type: Boolean,
      default: false,
    },
    mirror: {
      type: Boolean,
      default: implicitXAxis.mirror,
    },
    orientation: {
      type: String,
      default: implicitXAxis.orientation,
    },
    padding: {
      type: Object,
      default: implicitXAxis.padding,
    },
    reversed: {
      type: Boolean,
      default: implicitXAxis.reversed,
    },
    scale: {
      type: [String, Function],
      default: implicitXAxis.scale,
    },
    tickCount: {
      type: Number,
      default: implicitXAxis.tickCount,
    },
    type: {
      type: String,
      default: implicitXAxis.type,
    },
    xAxisId: {
      type: [String, Number],
      default: 0,
    },
    dataKey: {
      type: [String, Number, Function] as PropType<DataKey<any>>,
      default: undefined,
    },
    domain: {
      type: Array as PropType<AxisDomain>,
    },
    axisLine: {
      type: [Boolean, Object],
      default: true,
    },
    ticks: {
      type: Array as PropType<AxisTick[]>,
    },
    interval: {
      type: [String, Number] as PropType<AxisInterval>,
    },
    unit: {
      type: String,
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
    tickFormatter: Function as PropType<TickFormatter>,
  },
  setup(props, { attrs, slots }) {
    return () => (
      <XAxisSettingsDispatcher
        {...props}
        {...attrs}
        v-slots={slots.tick ? { tick: slots.tick } : undefined}
      />
    )
  },
})

// Preserve template slot inference in published declarations.
export const XAxis: typeof _XAxis & { new (): { $slots: AxisSlots } } = _XAxis
