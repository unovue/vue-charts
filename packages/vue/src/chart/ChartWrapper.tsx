import type { CSSProperties, ComponentPublicInstance, PropType, StyleValue } from 'vue'
import { defineComponent, ref, useId, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { chartEmits } from '@/events/componentEvents'
import { useTooltipController } from '@/model/tooltip'
import type { ChartPointer } from '@/types'
import { useChartCallbacks } from '@/events/useChartCallbacks'
import { classProp } from '@/types'
import { provideChartInView, provideChartLayers } from '@/model/runtime'
import { getChartPointer } from '@/utils/pointer'

export interface WrapperInteractions {
  click: (pointer: ChartPointer, target?: EventTarget | null) => void
  move: (pointer: ChartPointer, target?: EventTarget | null) => void
  focus: () => void
  keyDown: (event: KeyboardEvent) => void
  touchMove: (event: TouchEvent) => void
}

export const chartWrapperProps = {
  accessibilityLayer: { type: Boolean, default: false },
  title: String,
  desc: String,
  descriptionId: String,
  /** Overrides the default `application` role of an accessible chart. */
  role: String,
  tabIndex: Number,
  class: classProp,
  height: { type: Number, required: true },
  isResponsive: { type: Boolean, default: false },
  /** Box style from useResponsiveSize. */
  boxStyle: { type: Object as PropType<CSSProperties>, required: true },
  interactive: { type: Boolean, default: true },
  style: { type: [String, Object, Array] as PropType<StyleValue> },
  width: { type: Number, required: true },
}

export const ChartWrapper = defineComponent({
  name: 'ChartWrapper',
  props: {
    ...chartWrapperProps,
    interactions: { type: Object as PropType<WrapperInteractions>, required: true },
  },
  inheritAttrs: false,
  emits: { ...chartEmits, resize: (_width: number, _height: number) => true },
  setup(props, { slots, emit, attrs }) {
    const descriptionId = useId()
    const tooltip = useTooltipController()
    const callHandler = useChartCallbacks()
    const interactions = props.interactions

    // The wrapper hosts the tooltip and the legend.
    const wrapperEl = ref<HTMLElement | null>(null)
    provideChartLayers({ portal: wrapperEl })
    const innerRef = (value: Element | ComponentPublicInstance | null) => {
      wrapperEl.value = value instanceof HTMLDivElement ? value : null
    }

    provideChartInView(wrapperEl)

    // Only responsive charts observe their box; toggling `responsive` starts or stops it. A
    // fixed-size chart creates no observer (useResizeObserver with a null target still would).
    watch(() => props.isResponsive ? wrapperEl.value : null, (element, _, onCleanup) => {
      if (!element)
        return
      onCleanup(useResizeObserver(element, (entries) => {
        const box = entries[0]?.contentRect
        if (box)
          emit('resize', box.width, box.height)
      }).stop)
    }, { immediate: true, flush: 'post' })

    const myOnClick = (e: MouseEvent) => {
      const chartPointer = getChartPointer(e)
      if (chartPointer) {
        interactions.click(chartPointer, e.target)
      }
      callHandler((state, event) => emit('click', state, event), e)
    }

    const myOnMouseEnter = (e: MouseEvent) => {
      const chartPointer = getChartPointer(e)
      if (chartPointer) {
        interactions.move(chartPointer, e.target)
      }
      callHandler((state, event) => emit('mouseenter', state, event), e)
    }

    const myOnMouseLeave = (e: MouseEvent) => {
      tooltip.clear('hover')
      callHandler((state, event) => emit('mouseleave', state, event), e)
    }

    const myOnMouseMove = (e: MouseEvent) => {
      const chartPointer = getChartPointer(e)
      if (chartPointer) {
        interactions.move(chartPointer, e.target)
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
      interactions.keyDown(e)
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
        {...attrs}
        data-slot="chart"
        class={['v-charts-wrapper', props.class]}
        style={[
          props.boxStyle,
          props.style,
          // Before the first measurement the SVG is scaled by its viewBox, so pointer
          // coordinates would not match chart coordinates.
          !props.interactive && { pointerEvents: 'none' },
          focusVisible.value && { outline: '2px solid var(--v-charts-focus, Highlight)', outlineOffset: '2px' },
        ]}
        role={props.accessibilityLayer ? props.role ?? 'application' : undefined}
        tabindex={props.accessibilityLayer ? props.tabIndex ?? 0 : undefined}
        aria-label={props.accessibilityLayer ? props.title : undefined}
        aria-describedby={props.accessibilityLayer ? props.descriptionId ?? (props.desc ? descriptionId : undefined) : undefined}
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
        ref={innerRef}
      >
        {props.desc && <span id={descriptionId} hidden>{props.desc}</span>}
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
