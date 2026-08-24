import type { ComponentPublicInstance, PropType } from 'vue'
import { defineComponent, isVNode, nextTick, ref, watch, watchEffect } from 'vue'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { addYAxis, removeYAxis, updateYAxisWidth } from '@/state/cartesianAxisSlice'
import { implicitYAxis, selectAxisScale, selectTicksOfAxis, selectYAxisPosition, selectYAxisSize } from '@/state/selectors/axisSelectors'
import { useIsPanorama } from '@/context/PanoramaContextProvider'
import { CartesianAxis } from '@/cartesian'
import type { DataKey } from '@/types'
import { selectAxisViewBox } from '@/state/selectors/selectChartOffset'
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
  setup(props, { attrs }) {
    const isPanorama = useIsPanorama()
    const axisType = 'yAxis'
    const dispatch = useAppDispatch()
    const scale = useAppSelector(state => selectAxisScale(state, axisType, props.yAxisId, isPanorama))
    const axisSize = useAppSelector(state => selectYAxisSize(state, props.yAxisId!))
    const position = useAppSelector(state => selectYAxisPosition(state, props.yAxisId!))
    const cartesianTickItems = useAppSelector(state => selectTicksOfAxis(state, axisType, props.yAxisId!, isPanorama))
    const viewBox = useAppSelector(selectAxisViewBox)
    const chartDataLengthEmpty = useAppSelector(state => !state.chartData.chartData?.length)

    const cartesianAxisRef = ref<ComponentPublicInstance | null>(null)

    const isAutoWidth = () => attrs.width === 'auto'

    const measureAxisWidth = (): number | undefined => {
      const el = cartesianAxisRef.value?.$el as Element | undefined
      if (!el) {
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
        dispatch(updateYAxisWidth({ id: props.yAxisId!, width: DEFAULT_Y_AXIS_WIDTH }))
      }
    })

    const updateAutoWidth = () => {
      // No dynamic width calculation is done when width !== 'auto'
      // or when a function/VNode is used for label
      if (!isAutoWidth() || axisSize.value == null) {
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
      // if the width has changed, dispatch an action to update the width
      if (Math.round(axisSize.value.width) !== Math.round(updatedYAxisWidth)) {
        dispatch(updateYAxisWidth({ id: props.yAxisId!, width: updatedYAxisWidth }))
      }
    }

    // Measure in a deferred nextTick: dispatching synchronously inside a watchPostEffect
    // would hit Vue's activeEffect self-trigger skip and the follow-up re-measure would never run.
    watch(
      [axisSize, cartesianTickItems, () => attrs.label],
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
          class={['v-charts-yAxis yAxis']}
          ref={cartesianAxisRef}
        />
      )
    }
  },
})

// Handles YAxis settings registration in the store
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
    tickFormatter: Function,
    domain: Array as PropType<AxisDomain>,
    dataKey: {
      type: [String, Number, Function] as PropType<DataKey<any>>,
      default: undefined,
    },
  },
  setup(props) {
    const dispatch = useAppDispatch()
    watchEffect((onCleanup) => {
      const settings = {
        ...props,
        interval: props.interval ?? 'preserveEnd',
        id: props.yAxisId,
        dataKey: props.dataKey,
        includeHidden: props.includeHidden ?? false,
        angle: props.angle ?? 0,
        minTickGap: props.minTickGap ?? 5,
        tick: props.tick ?? true,
      } as any
      dispatch(addYAxis(settings))
      onCleanup(() => {
        dispatch(removeYAxis(settings))
      })
    })
    return () => (
      <YAxisImpl {...props} />
    )
  },
})

export const YAxis = defineComponent({
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
      type: [String, Number, Function] as PropType<DataKey<any>>,
      default: undefined,
    },
    tickFormatter: {
      type: Function,
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
  setup(props, { attrs }) {
    return () => <YAxisSettingsDispatcher {...props} {...attrs} />
  },
})
