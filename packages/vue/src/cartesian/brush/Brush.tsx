import type { CSSProperties, PropType, VNode } from 'vue'
import { useChart } from '@/model/chart'
import { computed, defineComponent, getCurrentInstance, h, nextTick, reactive, shallowRef, watch } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import type { BrushProps, BrushTravellerId } from './type'
import { BrushVueProps } from './type'
import { Layer } from '../../container/Layer'
import { Background } from './components/Background'
import { Panorama } from './components/Panorama'
import { Slide } from './components/Slide'
import { TravellerLayer } from './components/TravellerLayer'
import { BrushText } from './components/BrushText'
import { useBrushState } from './hooks/useBrushState'
import { useBrushHandlers } from './hooks/useBrushHandlers'
import { useBrushSetting } from '@/cartesian/brush/hooks/useBrushSetting'
import { useBrushChartSynchronisation } from '@/events/sync'
import type { BrushStartEndIndex } from '@/types/chartData'
import { isNumber } from '@/utils'
import { useChartGesture } from '@/model/runtime'

const brushEmits = {
  'update:startIndex': (_index: number) => true,
  'update:endIndex': (_index: number) => true,
  'change': (_indexes: BrushStartEndIndex) => true,
  'drag-end': (_indexes: BrushStartEndIndex) => true,
}

const BrushView = defineComponent({
  name: 'BrushView',
  emits: brushEmits,
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<BrushProps>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
    /** Which indexes the parent owns through v-model; the others are starting values. */
    controlled: { type: Function as PropType<() => { start: boolean, end: boolean }>, required: true },
  },
  setup(view, { slots, emit }) {
    const chart = useChart()
    const props = view.item
    const attrs = view.svgAttrs

    const dataActions = useChart().dataRange
    const chartData = computed(() => chart.dataRange.state.value.chartData)
    const dataStartIndex = computed(() => chart.dataRange.state.value.dataStartIndex)
    const dataEndIndex = computed(() => chart.dataRange.state.value.dataEndIndex)
    const brushDimensions = computed(() => chart.brushDimensions.value)

    // --- Computed properties ---
    const x = computed(() => props.x ?? brushDimensions.value?.x)
    const y = computed(() => props.y ?? brushDimensions.value?.y)
    const width = computed(() => props.width ?? brushDimensions.value?.width)
    // As with Vue's defineModel: an index bound with v-model is owned by the parent; a plain
    // :start-index is where the brush starts, and dragging moves it.
    const localStart = shallowRef<number>()
    const localEnd = shallowRef<number>()
    watch(() => props.startIndex, () => { localStart.value = undefined })
    watch(() => props.endIndex, () => { localEnd.value = undefined })
    const startIndex = computed(() => (view.controlled().start ? props.startIndex : localStart.value ?? props.startIndex) ?? dataStartIndex.value ?? 0)
    const endIndex = computed(() => (view.controlled().end ? props.endIndex : localEnd.value ?? props.endIndex) ?? dataEndIndex.value ?? 0)
    const calculatedY = computed(() => (y.value ?? 0) + (props.dy ?? 0))

    // --- onChange handler ---
    const onChange = (nextState: BrushStartEndIndex) => {
      if (nextState.startIndex !== startIndex.value)
        emit('update:startIndex', nextState.startIndex)
      if (nextState.endIndex !== endIndex.value)
        emit('update:endIndex', nextState.endIndex)
      emit('change', nextState)
      const { start, end } = view.controlled()
      if (!start)
        localStart.value = nextState.startIndex
      if (!end)
        localEnd.value = nextState.endIndex
      dataActions.setRange({
        startIndex: start && props.startIndex !== undefined ? props.startIndex : nextState.startIndex,
        endIndex: end && props.endIndex !== undefined ? props.endIndex : nextState.endIndex,
      })
    }

    // --- Hook wiring ---
    const { brushState } = useBrushState(
      () => x.value,
      () => width.value,
      () => props.travellerWidth!,
      () => chartData.value,
      () => startIndex.value,
      () => endIndex.value,
    )

    // While a traveller or the slide is dragged, the chart follows the brush directly.
    const gesture = useChartGesture()
    watch(() => brushState.value.isSlideMoving || brushState.value.isTravellerMoving, (moving) => {
      gesture.value = moving
    })

    // Wait for the parent to accept the proposal before restoring controlled travellers.
    const restoreControlledPositions = () => {
      const { start, end } = view.controlled()
      if (start && props.startIndex !== undefined)
        brushState.value.startX = brushState.value.scale?.(props.startIndex)
      if (end && props.endIndex !== undefined)
        brushState.value.endX = brushState.value.scale?.(props.endIndex)
    }
    watch([() => props.startIndex, () => props.endIndex], restoreControlledPositions)

    // Reactive props object for useBrushHandlers — getters ensure values are current when accessed during event handlers
    const handlerProps = reactive({
      get x() { return x.value! },
      get width() { return width.value! },
      get travellerWidth() { return props.travellerWidth! },
      get gap() { return props.gap! },
      get startIndex() { return startIndex.value },
      get endIndex() { return endIndex.value },
      get leaveTimeOut() { return props.leaveTimeOut! },
      onDragEnd: (indexes: BrushStartEndIndex) => {
        emit('drag-end', indexes)
        nextTick(restoreControlledPositions)
      },
      get data() { return props.data },
    })

    const handlers = useBrushHandlers(
      brushState,
      handlerProps,
      onChange,
      () => chartData.value ?? [],
    )

    const moveKeyboard = (direction: 1 | -1, id: BrushTravellerId) => {
      handlers.handleTravellerMoveKeyboard(direction, id)
      nextTick(restoreControlledPositions)
    }

    // --- Bound traveller drag start handlers ---
    const startXDragStart = (e: MouseEvent | TouchEvent) => handlers.handleTravellerDragStart('startX', e)
    const endXDragStart = (e: MouseEvent | TouchEvent) => handlers.handleTravellerDragStart('endX', e)

    return () => {
      const data = chartData.value
      const xVal = x.value
      const yVal = calculatedY.value
      const wVal = width.value
      const hVal = props.height

      // Guard: return null if no data or dimensions are not valid
      if (
        !data
        || !data.length
        || !isNumber(xVal)
        || !isNumber(yVal)
        || !isNumber(wVal)
        || !isNumber(hVal)
        || wVal <= 0
        || hVal <= 0
      ) {
        return null
      }

      const { startX, endX, isTextActive, isSlideMoving, isTravellerMoving, isTravellerFocused } = brushState.value

      const showText = isTextActive || isSlideMoving || isTravellerMoving || isTravellerFocused || props.alwaysShowText

      const travellerOtherProps = {
        ...props,
        x: xVal,
        y: yVal,
        width: wVal,
        data: data as unknown[],
        startIndex: startIndex.value,
        endIndex: endIndex.value,
      }

      return (
        <Layer
          class={['v-charts-brush', props.class]}
          style={{ userSelect: 'none', ...attrs.style as CSSProperties }}
          onMouseleave={handlers.handleLeaveWrapper}
          onTouchmove={handlers.handleTouchMove}
        >
          <Background
            x={xVal}
            y={yVal}
            width={wVal}
            height={hVal}
            fill={props.fill}
            stroke={props.stroke}
          />

          <Panorama
            x={xVal}
            y={yVal}
            width={wVal}
            height={hVal}
            data={data as unknown[]}
            padding={props.padding}
          >
            {{ default: slots.default }}
          </Panorama>

          <Slide
            y={yVal}
            height={hVal}
            stroke={props.stroke}
            travellerWidth={props.travellerWidth}
            startX={startX}
            endX={endX}
            onMouseenter={handlers.handleEnterSlideOrTraveller}
            onMouseleave={handlers.handleLeaveSlideOrTraveller}
            onMousedown={handlers.handleSlideDragStart}
            onTouchstart={handlers.handleSlideDragStart}
          />

          <TravellerLayer
            travellerX={startX}
            id="startX"
            otherProps={travellerOtherProps}
            onMouseenter={handlers.handleEnterSlideOrTraveller}
            onMouseleave={handlers.handleLeaveSlideOrTraveller}
            onMousedown={startXDragStart}
            onTouchstart={startXDragStart}
            {...{ 'onTraveller-move-keyboard': (direction: 1 | -1, id: BrushTravellerId) => moveKeyboard(direction, id) }}
            onFocus={() => { brushState.value.isTravellerFocused = true }}
            onBlur={() => { brushState.value.isTravellerFocused = false }}
          />

          <TravellerLayer
            travellerX={endX}
            id="endX"
            otherProps={travellerOtherProps}
            onMouseenter={handlers.handleEnterSlideOrTraveller}
            onMouseleave={handlers.handleLeaveSlideOrTraveller}
            onMousedown={endXDragStart}
            onTouchstart={endXDragStart}
            {...{ 'onTraveller-move-keyboard': (direction: 1 | -1, id: BrushTravellerId) => moveKeyboard(direction, id) }}
            onFocus={() => { brushState.value.isTravellerFocused = true }}
            onBlur={() => { brushState.value.isTravellerFocused = false }}
          />

          {showText && (
            <BrushText
              startIndex={startIndex.value}
              endIndex={endIndex.value}
              y={yVal}
              height={hVal}
              travellerWidth={props.travellerWidth}
              stroke={props.stroke}
              tickFormatter={props.tickFormatter}
              dataKey={props.dataKey}
              data={data as unknown[]}
              startX={startX}
              endX={endX}
            />
          )}
        </Layer>
      )
    }
  },
})

const _Brush = defineComponent({
  name: 'Brush',
  emits: brushEmits,
  props: BrushVueProps,
  inheritAttrs: false,
  setup(props, { attrs, slots, emit }) {
    useBrushSetting(props)
    useBrushChartSynchronisation(useChart())
    const View = useDeferredView(BrushView)
    const instance = getCurrentInstance()!
    const listens = (name: string) => {
      const vnodeProps = instance.vnode.props ?? {}
      return `onUpdate:${name}` in vnodeProps || `onUpdate:${name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}` in vnodeProps
    }
    const controlled = () => ({
      start: props.startIndex !== undefined && listens('startIndex'),
      end: props.endIndex !== undefined && listens('endIndex'),
    })
    return () => h(View, { 'item': props, 'svgAttrs': attrs, controlled, 'onChange': indexes => emit('change', indexes), 'onDrag-end': indexes => emit('drag-end', indexes), 'onUpdate:startIndex': index => emit('update:startIndex', index), 'onUpdate:endIndex': index => emit('update:endIndex', index) }, slots)
  },
})

// Preserve template slot inference in published declarations.
export const Brush: typeof _Brush & { new (): { $slots: { default?: () => VNode[] } } } = _Brush
