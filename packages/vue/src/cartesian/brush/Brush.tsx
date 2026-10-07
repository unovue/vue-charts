import type { CSSProperties, PropType, SlotsType, VNode } from 'vue'
import { useChart } from '@/model/chart'
import { computed, defineComponent, h, nextTick, reactive, shallowRef, watch } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import type { BrushInput, BrushTravellerId } from './type'
import { BrushVueProps } from './type'
import { Layer } from '../../container/Layer'
import { Background } from './components/Background'
import { Panorama } from './components/Panorama'
import { Slide } from './components/Slide'
import { TravellerLayer } from './components/TravellerLayer'
import { BrushText } from './components/BrushText'
import { useBrushState } from './hooks/useBrushState'
import { useBrushHandlers } from './hooks/useBrushHandlers'
import { useBrushChartSynchronisation } from '@/events/sync'
import type { BrushStartEndIndex } from '@/types/chartData'
import { isNumber } from '@/utils'
import { useChartGesture } from '@/model/runtime'
import { normalizeBrushRange } from '@/model/dataRange'

const brushEmits = {
  'update:range': (_range: BrushStartEndIndex | null) => true,
  'change': (_indexes: BrushStartEndIndex) => true,
  'drag-end': (_indexes: BrushStartEndIndex) => true,
}

const BrushView = defineComponent({
  name: 'BrushView',
  emits: brushEmits,
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<BrushInput>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
    range: { type: Object as PropType<BrushStartEndIndex | null>, default: null },
    controlled: { type: Function as PropType<() => boolean>, required: true },
  },
  setup(view, { slots, emit }) {
    const chart = useChart()
    const props = view.item
    const attrs = view.svgAttrs

    const chartData = computed(() => chart.dataRange.state.value.chartData)
    const brushDimensions = computed(() => chart.brushDimensions.value)

    // --- Computed properties ---
    const x = computed(() => props.x ?? brushDimensions.value?.x)
    const y = computed(() => props.y ?? brushDimensions.value?.y)
    const width = computed(() => props.width ?? brushDimensions.value?.width)
    const startIndex = computed(() => view.range?.startIndex ?? 0)
    const endIndex = computed(() => view.range?.endIndex ?? Math.max(0, (chartData.value?.length ?? 0) - 1))
    const calculatedY = computed(() => (y.value ?? 0) + (props.dy ?? 0))

    function onChange(nextState: BrushStartEndIndex) {
      if (sameRange(nextState, view.range))
        return
      emit('update:range', nextState)
      emit('change', nextState)
      nextTick(restoreControlledPositions)
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
    function restoreControlledPositions() {
      if (!view.controlled())
        return
      brushState.value.startX = brushState.value.scale?.(startIndex.value)
      brushState.value.endX = brushState.value.scale?.(endIndex.value)
    }
    watch(() => view.range, restoreControlledPositions)

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
          data-slot="brush"
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

          {view.range != null && (
            <>
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
            </>
          )}
        </Layer>
      )
    }
  },
})

export const Brush = defineComponent({
  name: 'Brush',
  emits: brushEmits,
  props: BrushVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots, emit }) {
    const chart = useChart()
    const View = useDeferredView(BrushView)
    const controlled = () => props.range !== undefined
    const length = computed(() => chart.dataRange.state.value.chartData?.length ?? 0)
    // Uncontrolled window; `null` selects all rows and keeps following new rows.
    const local = shallowRef<BrushStartEndIndex | null>(null)
    const fullRange = (rows: number) => ({ startIndex: 0, endIndex: rows - 1 })
    /** What the Brush shows: `null` hides the travellers (controlled `null` or empty data). */
    const range = computed(() => normalizeBrushRange(
      controlled() ? props.range! : local.value ?? fullRange(length.value),
      length.value,
    ))

    chart.brush.register(computed(() => ({
      x: props.x,
      y: props.y,
      width: props.width,
      height: props.height!,
      padding: props.padding!,
      range: controlled() ? props.range! : local.value,
      onRangeChange: updateRange,
    })))
    useBrushChartSynchronisation(chart)

    // D-16: reconcile the uncontrolled window by index when the row count changes.
    watch(length, (rows, previous) => {
      if (controlled())
        return
      const shown = normalizeBrushRange(local.value ?? fullRange(previous), previous)
      const window = local.value
      if (window && rows === 0)
        local.value = null
      else if (window && rows > previous && window.endIndex === previous - 1)
        local.value = { startIndex: window.startIndex + rows - previous, endIndex: rows - 1 }
      else if (window && rows < previous)
        local.value = normalizeBrushRange(window, rows)
      // A full window grows silently; a shifted or clamped one is announced.
      if ((rows < previous || local.value !== window) && !sameRange(shown, range.value))
        emit('update:range', range.value)
    }, { flush: 'sync' })
    // Ask the parent once per distinct (input, row count) to accept a normalized controlled range.
    watch(
      () => [props.range === null, props.range?.startIndex, props.range?.endIndex, length.value],
      () => {
        if (controlled() && !sameRange(props.range!, range.value))
          emit('update:range', range.value)
      },
      { immediate: true },
    )

    function updateRange(value: BrushStartEndIndex | null) {
      const next = normalizeBrushRange(value, length.value)
      if (sameRange(next, range.value))
        return
      if (!controlled())
        local.value = next == null || sameRange(next, fullRange(length.value)) ? null : next
      emit('update:range', next)
    }
    return () => h(View, {
      'item': props,
      'svgAttrs': attrs,
      'range': range.value,
      controlled,
      'onChange': indexes => emit('change', indexes),
      'onDrag-end': indexes => emit('drag-end', indexes),
      'onUpdate:range': updateRange,
    }, slots)
  },
})

function sameRange(left: BrushStartEndIndex | null, right: BrushStartEndIndex | null) {
  return left === right || (left != null && right != null
    && left.startIndex === right.startIndex && left.endIndex === right.endIndex)
}
