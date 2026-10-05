import { chartEmits } from '@/events/componentEvents'
import { useChartTooltip } from '@/state/chartContext'
import { type CSSProperties, type PropType, type StyleValue, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useChartInteractions } from '@/events/useChartInteractions'
import { useSynchronisedEventsFromOtherCharts } from '@/events/useChartSynchronisation'
import { useChartCallbacks } from '@/events/useChartCallbacks'
import { classProp } from '@/types'
import { useReportScale } from '@/state/utils/useReportScale'
import { providePortalRaw } from '@/chart/TooltipPortalContext'
import { provideLegendPortalRaw } from '@/chart/LegendPortalContext'
import { getChartPointer } from '@/utils/chart'
import { provideChartInView } from '@/animation/renderPhase'

export const ChartsWrapper = defineComponent({
  name: 'ChartsWrapper',
  props: {
    accessibilityLayer: { type: Boolean, default: false },
    title: String,
    descriptionId: String,
    tabIndex: Number,
    class: classProp,
    height: { type: Number, required: true },
    isResponsive: { type: Boolean, default: false },
    /** Box style from useResponsiveSize. */
    boxStyle: { type: Object as PropType<CSSProperties>, required: true },
    interactive: { type: Boolean, default: true },
    style: { type: [String, Object, Array] as PropType<StyleValue> },
    width: { type: Number, required: true },
  },
  inheritAttrs: false,
  emits: { ...chartEmits, resize: (_width: number, _height: number) => true },
  setup(props, { slots, emit }) {
    const tooltip = useChartTooltip()
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

    provideChartInView(wrapperEl)

    let observer: ResizeObserver | undefined
    onMounted(() => {
      watch(() => props.isResponsive, (responsive, _, onCleanup) => {
        if (!responsive || !wrapperEl.value || typeof ResizeObserver === 'undefined')
          return
        observer = new ResizeObserver((entries) => {
          const { width, height } = entries[0].contentRect
          emit('resize', width, height)
        })
        observer.observe(wrapperEl.value)
        onCleanup(() => observer?.disconnect())
      }, { immediate: true })
    })
    onUnmounted(() => observer?.disconnect())

    const myOnClick = (e: MouseEvent) => {
      const chartPointer = getChartPointer(e)
      if (chartPointer) {
        interactions.click(chartPointer)
      }
      callHandler((state, event) => emit('click', state, event), e)
    }

    const myOnMouseEnter = (e: MouseEvent) => {
      const chartPointer = getChartPointer(e)
      if (chartPointer) {
        interactions.move(chartPointer)
      }
      callHandler((state, event) => emit('mouseenter', state, event), e)
    }

    const myOnMouseLeave = (e: MouseEvent) => {
      tooltip.mouseLeaveChart()
      callHandler((state, event) => emit('mouseleave', state, event), e)
    }

    const myOnMouseMove = (e: MouseEvent) => {
      const chartPointer = getChartPointer(e)
      if (chartPointer) {
        interactions.move(chartPointer)
      }
      callHandler((state, event) => emit('mousemove', state, event), e)
    }

    const focusVisible = ref(false)
    let pointerFocus = false
    const onFocus = (e: FocusEvent) => {
      if (e.target !== wrapperEl.value || !props.accessibilityLayer)
        return
      focusVisible.value = !pointerFocus && wrapperEl.value!.matches(':focus-visible')
      if (focusVisible.value)
        interactions.focus()
    }
    const onBlur = () => {
      focusVisible.value = false
      pointerFocus = false
    }
    const onPointerDown = () => {
      pointerFocus = true
      focusVisible.value = false
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target !== wrapperEl.value || !props.accessibilityLayer)
        return
      pointerFocus = false
      focusVisible.value = true
      if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End', 'Escape', 'Enter'].includes(e.key))
        e.preventDefault()
      interactions.keyDown(e.key)
    }

    const myOnContextMenu = (e: MouseEvent) => {
      callHandler((state, event) => emit('contextmenu', state, event), e)
    }

    const myOnDoubleClick = (e: MouseEvent) => {
      callHandler((state, event) => emit('dblclick', state, event), e)
    }

    const myOnMouseDown = (e: MouseEvent) => {
      onPointerDown()
      callHandler((state, event) => emit('mousedown', state, event), e)
    }

    const myOnMouseUp = (e: MouseEvent) => {
      callHandler((state, event) => emit('mouseup', state, event), e)
    }

    const myOnTouchStart = (e: TouchEvent) => {
      callHandler((state, event) => emit('touchstart', state, event), e)
    }

    const myOnTouchMove = (e: TouchEvent) => {
      interactions.touchMove(e)
      callHandler((state, event) => emit('touchmove', state, event), e)
    }

    const myOnTouchEnd = (e: TouchEvent) => {
      callHandler((state, event) => emit('touchend', state, event), e)
    }

    return () => (
      <div
        class={['v-charts-wrapper', props.class]}
        style={[
          props.boxStyle,
          props.style,
          // Before the first measurement the SVG is scaled by its viewBox, so pointer
          // coordinates would not match chart coordinates.
          !props.interactive && { pointerEvents: 'none' },
          focusVisible.value && { outline: '2px solid var(--v-charts-focus, Highlight)', outlineOffset: '2px' },
        ]}
        role={props.accessibilityLayer ? 'application' : undefined}
        tabindex={props.accessibilityLayer ? props.tabIndex ?? 0 : undefined}
        aria-label={props.accessibilityLayer ? props.title : undefined}
        aria-describedby={props.accessibilityLayer ? props.descriptionId : undefined}
        data-focus-visible={focusVisible.value ? '' : undefined}
        onBlur={onBlur}
        onPointerdown={onPointerDown}
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
        {props.accessibilityLayer && (
          <div aria-live="polite" aria-atomic="true" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0 }}>
            {tooltip.announcement.value}
          </div>
        )}
      </div>
    )
  },
})
