/**
 * @fileOverview X Axis
 */
import type { PropType } from 'vue'
import { defineComponent, onUnmounted, watchEffect } from 'vue'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import type { XAxisSettings } from '@/state/cartesianAxisSlice'
import { addXAxis, removeXAxis } from '@/state/cartesianAxisSlice'
import { implicitXAxis, selectAxisScale, selectTicksOfAxis, selectXAxisPosition, selectXAxisSize } from '@/state/selectors/axisSelectors'
import { useIsPanorama } from '@/context/PanoramaContextProvider'
import { CartesianAxis } from '@/cartesian/cartesian-axis/CartesianAxis'
import type { DataKey } from '@/types'
import { selectAxisViewBox } from '@/state/selectors/selectChartOffset'
import type { AxisDomain, AxisInterval } from '@/types/axis'
import type { AxisTick, TickFormatter } from '@/types/tick'

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
    const isPanorama = useIsPanorama()
    const axisType = 'xAxis'
    const scale = useAppSelector(state => selectAxisScale(state, axisType, props.xAxisId, isPanorama))
    const axisSize = useAppSelector(state => selectXAxisSize(state, props.xAxisId!))
    const position = useAppSelector(state => selectXAxisPosition(state, props.xAxisId!))
    const cartesianTickItems = useAppSelector(state => selectTicksOfAxis(state, axisType, props.xAxisId!, isPanorama))
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
          class={['v-charts-xAxis xAxis']}
        >
          {slots.tick ? { tick: slots.tick } : undefined}
        </CartesianAxis>
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
    const dispatch = useAppDispatch()
    let registeredSettings: XAxisSettings | undefined
    watchEffect(() => {
      const settings = {
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
      if (registeredSettings && registeredSettings.id !== settings.id) {
        dispatch(removeXAxis(registeredSettings))
      }
      dispatch(addXAxis(settings))
      registeredSettings = settings
    })
    // SSR stops watchEffect immediately; its cleanup would remove settings before rendering.
    onUnmounted(() => {
      if (registeredSettings) {
        dispatch(removeXAxis(registeredSettings))
        registeredSettings = undefined
      }
    })
    return () => (
      <XAxisImpl {...props}>
        {dispatcherSlots.tick ? { tick: dispatcherSlots.tick } : undefined}
      </XAxisImpl>
    )
  },
})

export const XAxis = defineComponent({
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
      <XAxisSettingsDispatcher {...props} {...attrs}>
        {slots.tick ? { tick: slots.tick } : undefined}
      </XAxisSettingsDispatcher>
    )
  },
})
