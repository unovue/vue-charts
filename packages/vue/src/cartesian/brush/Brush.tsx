import { computed, defineComponent, h, reactive } from 'vue'
import type { CSSProperties, PropType } from 'vue'
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
import { useBrushChartSynchronisation } from '@/synchronisation/useChartSynchronisation'
import { useAppSelector } from '@/state/hooks'
import { selectBrushDimensions } from '@/state/selectors/brushSelectors'
import { useChartDataActions } from '@/state/chartContext'
import type { BrushStartEndIndex } from '@/state/chartData'
import { isNumber } from '@/utils'

const brushEmits = {
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
  },
  setup(view, { slots, emit }) {
    const props = view.item
    const attrs = view.svgAttrs

    const dataActions = useChartDataActions()
    const chartData = useAppSelector(state => state.chartData.chartData)
    const dataStartIndex = useAppSelector(state => state.chartData.dataStartIndex)
    const dataEndIndex = useAppSelector(state => state.chartData.dataEndIndex)
    const brushDimensions = useAppSelector(selectBrushDimensions)

    // --- Computed properties ---
    const x = computed(() => props.x ?? brushDimensions.value?.x)
    const y = computed(() => props.y ?? brushDimensions.value?.y)
    const width = computed(() => props.width ?? brushDimensions.value?.width)
    const startIndex = computed(() => props.startIndex ?? dataStartIndex.value ?? 0)
    const endIndex = computed(() => props.endIndex ?? dataEndIndex.value ?? 0)
    const calculatedY = computed(() => (y.value ?? 0) + (props.dy ?? 0))

    // --- onChange handler ---
    const onChange = (nextState: BrushStartEndIndex) => {
      emit('change', nextState)
      dataActions.setRange(nextState)
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

    // Reactive props object for useBrushHandlers — getters ensure values are current when accessed during event handlers
    const handlerProps = reactive({
      get x() { return x.value! },
      get width() { return width.value! },
      get travellerWidth() { return props.travellerWidth! },
      get gap() { return props.gap! },
      get startIndex() { return startIndex.value },
      get endIndex() { return endIndex.value },
      get leaveTimeOut() { return props.leaveTimeOut! },
      onDragEnd: (indexes: BrushStartEndIndex) => emit('drag-end', indexes),
      get data() { return props.data },
    })

    const handlers = useBrushHandlers(
      brushState,
      handlerProps,
      onChange,
      () => chartData.value ?? [],
    )

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
        data: data as any[],
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
            data={data as any[]}
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
            {...{ 'onTraveller-move-keyboard': (direction: 1 | -1, id: BrushTravellerId) => handlers.handleTravellerMoveKeyboard(direction, id) }}
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
            {...{ 'onTraveller-move-keyboard': (direction: 1 | -1, id: BrushTravellerId) => handlers.handleTravellerMoveKeyboard(direction, id) }}
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
              data={data as any[]}
              startX={startX}
              endX={endX}
            />
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
  setup(props, { attrs, slots, emit }) {
    useBrushSetting(props)
    useBrushChartSynchronisation()
    const View = useDeferredView(BrushView)
    return () => h(View, { 'item': props, 'svgAttrs': attrs, 'onChange': indexes => emit('change', indexes), 'onDrag-end': indexes => emit('drag-end', indexes) }, slots)
  },
})
