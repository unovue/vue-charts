import { type PropType, type StyleValue, defineComponent, ref, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { mouseLeaveChart } from '../state/tooltipSlice'
import { useAppDispatch } from '../state/hooks'
import { mouseClickAction, mouseMoveAction } from '../state/mouseEventsMiddleware'
import { useSynchronisedEventsFromOtherCharts } from '@/events/useChartSynchronisation'
import { focusAction, keyDownAction } from '../state/keyboardEventsMiddleware'
import { externalEventAction } from '../state/externalEventsMiddleware'
import { touchEventAction } from '../state/touchEventsMiddleware'
import { classProp } from '@/types'
import type { CategoricalChartFunc } from '@/types'
import { useReportScale } from '@/state/utils/useReportScale'
import { providePortalRaw } from '@/chart/TooltipPortalContext'
import { provideLegendPortalRaw } from '@/chart/LegendPortalContext'
import { getChartPointer } from '@/utils/chart'

export const ChartsWrapper = defineComponent({
  name: 'ChartsWrapper',
  props: {
    class: classProp,
    height: { type: Number, required: true },
    onClick: { type: Function as PropType<CategoricalChartFunc> },
    onContextMenu: { type: Function as PropType<CategoricalChartFunc> },
    onDoubleClick: { type: Function as PropType<CategoricalChartFunc> },
    onMouseDown: { type: Function as PropType<CategoricalChartFunc> },
    onMouseEnter: { type: Function as PropType<CategoricalChartFunc> },
    onMouseLeave: { type: Function as PropType<CategoricalChartFunc> },
    onMouseMove: { type: Function as PropType<CategoricalChartFunc> },
    onMouseUp: { type: Function as PropType<CategoricalChartFunc> },
    onResize: { type: Function as PropType<(width: number, height: number) => void> },
    onTouchEnd: { type: Function as PropType<CategoricalChartFunc> },
    onTouchMove: { type: Function as PropType<CategoricalChartFunc> },
    onTouchStart: { type: Function as PropType<CategoricalChartFunc> },
    responsive: { type: Boolean, default: false },
    style: { type: [String, Object, Array] as PropType<StyleValue> },
    width: { type: Number, required: true },
  },
  setup(props, { slots }) {
    const dispatch = useAppDispatch()

    useSynchronisedEventsFromOtherCharts()
    const scaleRef = useReportScale()

    const tooltipPortal = ref<HTMLElement | null>(null)
    const legendPortal = ref<HTMLElement | null>(null)
    providePortalRaw(tooltipPortal)
    provideLegendPortalRaw(legendPortal)
    const wrapperEl = ref<HTMLDivElement | null>(null)
    const innerRef = (node: HTMLDivElement | null) => {
      scaleRef.value = node
      tooltipPortal.value = node
      legendPortal.value = node
      wrapperEl.value = node
    }

    watch(() => props.responsive, (responsive, _, onCleanup) => {
      if (!responsive) {
        return
      }
      const stop = useResizeObserver(wrapperEl, (entries) => {
        const { width, height } = entries[0].contentRect
        props.onResize?.(width, height)
      })
      onCleanup(stop.stop)
    }, { immediate: true })

    const myOnClick = (e: MouseEvent) => {
      // Capture chart pointer synchronously before dispatching to middleware,
      // because createListenerMiddleware defers to microtask and e.currentTarget will be null by then
      const chartPointer = getChartPointer(e)
      if (chartPointer) {
        dispatch(mouseClickAction(chartPointer))
      }
      dispatch(externalEventAction({ handler: props.onClick!, event: e }))
    }

    const myOnMouseEnter = (e: MouseEvent) => {
      const chartPointer = getChartPointer(e)
      if (chartPointer) {
        dispatch(mouseMoveAction(chartPointer))
      }
      dispatch(externalEventAction({ handler: props.onMouseEnter!, event: e }))
    }

    const myOnMouseLeave = (e: MouseEvent) => {
      dispatch(mouseLeaveChart())
      dispatch(externalEventAction({ handler: props.onMouseLeave!, event: e }))
    }

    const myOnMouseMove = (e: MouseEvent) => {
      const chartPointer = getChartPointer(e)
      if (chartPointer) {
        dispatch(mouseMoveAction(chartPointer))
      }
      dispatch(externalEventAction({ handler: props.onMouseMove!, event: e }))
    }

    const onFocus = () => {
      dispatch(focusAction())
    }

    const onKeyDown = (e: KeyboardEvent) => {
      dispatch(keyDownAction(e.key))
    }

    const myOnContextMenu = (e: MouseEvent) => {
      dispatch(externalEventAction({ handler: props.onContextMenu!, event: e }))
    }

    const myOnDoubleClick = (e: MouseEvent) => {
      dispatch(externalEventAction({ handler: props.onDoubleClick!, event: e }))
    }

    const myOnMouseDown = (e: MouseEvent) => {
      dispatch(externalEventAction({ handler: props.onMouseDown!, event: e }))
    }

    const myOnMouseUp = (e: MouseEvent) => {
      dispatch(externalEventAction({ handler: props.onMouseUp!, event: e }))
    }

    const myOnTouchStart = (e: TouchEvent) => {
      dispatch(externalEventAction({ handler: props.onTouchStart!, event: e }))
    }

    const myOnTouchMove = (e: TouchEvent) => {
      dispatch(touchEventAction(e))
      dispatch(externalEventAction({ handler: props.onTouchMove!, event: e }))
    }

    const myOnTouchEnd = (e: TouchEvent) => {
      dispatch(externalEventAction({ handler: props.onTouchEnd!, event: e }))
    }

    return () => (
      <div
        class={['v-charts-wrapper', props.class]}
        style={[
          props.responsive
            ? { position: 'relative', cursor: 'default', width: '100%', height: '100%' }
            : { position: 'relative', cursor: 'default', width: `${props.width}px`, height: `${props.height}px` },
          props.style,
        ]}
        role="application"
        onClick={myOnClick}
        onContextmenu={myOnContextMenu}
        onDblclick={myOnDoubleClick}
        onFocus={onFocus}
        onKeydown={onKeyDown}
        onMousedown={myOnMouseDown}
        onMouseenter={myOnMouseEnter}
        onMouseleave={myOnMouseLeave}
        onMousemove={myOnMouseMove}
        onMouseup={myOnMouseUp}
        onTouchend={myOnTouchEnd}
        onTouchmove={myOnTouchMove}
        onTouchstart={myOnTouchStart}
        ref={innerRef as any}
      >
        {slots.default?.()}
      </div>
    )
  },
})
