import { type PropType, type StyleValue, defineComponent, ref, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { mouseLeaveChart } from '../state/tooltipSlice'
import { useAppDispatch } from '../state/hooks'
import { useChartInteractions } from '@/events/useChartInteractions'
import { useSynchronisedEventsFromOtherCharts } from '@/events/useChartSynchronisation'
import { useChartCallbacks } from '@/events/useChartCallbacks'
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
    const callHandler = useChartCallbacks()
    const interactions = useChartInteractions()

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
      const chartPointer = getChartPointer(e)
      if (chartPointer) {
        interactions.click(chartPointer)
      }
      callHandler(props.onClick, e)
    }

    const myOnMouseEnter = (e: MouseEvent) => {
      const chartPointer = getChartPointer(e)
      if (chartPointer) {
        interactions.move(chartPointer)
      }
      callHandler(props.onMouseEnter, e)
    }

    const myOnMouseLeave = (e: MouseEvent) => {
      dispatch(mouseLeaveChart())
      callHandler(props.onMouseLeave, e)
    }

    const myOnMouseMove = (e: MouseEvent) => {
      const chartPointer = getChartPointer(e)
      if (chartPointer) {
        interactions.move(chartPointer)
      }
      callHandler(props.onMouseMove, e)
    }

    const onFocus = () => {
      interactions.focus()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      interactions.keyDown(e.key)
    }

    const myOnContextMenu = (e: MouseEvent) => {
      callHandler(props.onContextMenu, e)
    }

    const myOnDoubleClick = (e: MouseEvent) => {
      callHandler(props.onDoubleClick, e)
    }

    const myOnMouseDown = (e: MouseEvent) => {
      callHandler(props.onMouseDown, e)
    }

    const myOnMouseUp = (e: MouseEvent) => {
      callHandler(props.onMouseUp, e)
    }

    const myOnTouchStart = (e: TouchEvent) => {
      callHandler(props.onTouchStart, e)
    }

    const myOnTouchMove = (e: TouchEvent) => {
      interactions.touchMove(e)
      callHandler(props.onTouchMove, e)
    }

    const myOnTouchEnd = (e: TouchEvent) => {
      callHandler(props.onTouchEnd, e)
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
