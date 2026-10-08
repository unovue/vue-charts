import { type ChartTransition, motionTokens } from '@/animation/motion'
import { computed, defineComponent, onScopeDispose, reactive, ref, watch, watchEffect, watchPostEffect } from 'vue'
import type { CSSProperties, PropType, VNode } from 'vue'
import { animate, useSpring } from 'motion-v'
import type { AnimationPlaybackControls } from 'motion-v'
import { useMagicKeys, useResizeObserver } from '@vueuse/core'
import { useReducedMotion } from '@/animation/useReducedMotion'
import type {
  ChartCoordinate,
  Coordinate,
} from '@/types'
import { getTooltipTranslate } from '@/utils/tooltip/translate'

import type { AllowInDimension } from './types'
// Tooltip Bounding Box Component (simplified)
export const TooltipBoundingBox = defineComponent({
  name: 'TooltipBoundingBox',
  props: {
    allowEscapeViewBox: Object as PropType<AllowInDimension>,
    isAnimationActive: Boolean,
    transition: { type: Object as PropType<ChartTransition>, default: undefined },
    active: Boolean,
    coordinate: Object as PropType<ChartCoordinate>,
    hasPayload: Boolean,
    offset: Number,
    position: Object as PropType<Partial<Coordinate>>,
    reverseDirection: Object as PropType<AllowInDimension>,
    viewBox: Object,
    style: Object as PropType<CSSProperties>,
  },
  setup(props, { slots }) {
    const dismissed = ref(false)
    const dismissedAtCoordinate = reactive({
      x: 0,
      y: 0,
    })

    watchEffect(() => {
      if (props.coordinate?.x !== dismissedAtCoordinate.x
        || props.coordinate?.y !== dismissedAtCoordinate.y) {
        dismissed.value = false
      }
    }, {
      flush: 'post',
    })

    const { escape } = useMagicKeys()
    watch(escape, (v) => {
      if (v) {
        dismissed.value = true
        dismissedAtCoordinate.x = props.coordinate?.x ?? 0
        dismissedAtCoordinate.y = props.coordinate?.y ?? 0
      }
    })
    const el = ref<HTMLDivElement>()
    const tooltipSize = ref({ width: 0, height: 0 })
    let preTransform: CSSProperties | undefined
    const reducedMotion = useReducedMotion()
    const spring = computed(() => ({ ...motionTokens.follow, ...props.transition }))
    const x = useSpring(0, spring)
    const y = useSpring(0, spring)
    const writePosition = () => {
      if (el.value)
        el.value.style.transform = `translate(${x.get()}px, ${y.get()}px)`
    }
    const offX = x.on('change', writePosition)
    const offY = y.on('change', writePosition)
    const { isSupported } = useResizeObserver(el, ([entry]) => {
      const box = entry.borderBoxSize?.[0]
      tooltipSize.value = {
        width: box?.inlineSize ?? entry.contentRect.width,
        height: box?.blockSize ?? entry.contentRect.height,
      }
    })
    watch(el, (element) => {
      if (element && !isSupported.value) {
        const { width, height } = element.getBoundingClientRect()
        tooltipSize.value = { width, height }
      }
    }, { flush: 'post' })
    const visible = computed(() => !dismissed.value && props.active && props.hasPayload)
    const present = ref(false)
    // A tooltip glides only between positions on screen; one that appears starts where it belongs.
    let placed = false
    const content = ref<HTMLDivElement>()
    let fade: AnimationPlaybackControls | undefined
    let cachedContent: VNode[] | undefined
    watchPostEffect(() => {
      const element = content.value
      const show = visible.value
      if (!element)
        return
      fade?.stop()
      if (show)
        present.value = true
      if (!props.isAnimationActive) {
        element.style.opacity = show ? '1' : '0'
        element.style.transform = 'none'
        present.value = !!show
        return
      }
      const reduced = reducedMotion.value === 'reduce'
      fade = animate(element, {
        opacity: show ? [0, 1] : 0,
        ...(reduced ? {} : { scale: show ? [0.96, 1] : 1 }),
      }, { duration: motionTokens.feedback.duration, ease: motionTokens.feedback.ease, onComplete: () => {
        if (!show) {
          present.value = false
          placed = false
        }
      } })
    })
    onScopeDispose(() => {
      offX()
      offY()
      x.destroy()
      y.destroy()
      fade?.stop()
    })

    const currentTransform = computed(() => {
      const { allowEscapeViewBox, coordinate, position, reverseDirection, viewBox } = props
      let { cssClasses, cssProperties, transform } = getTooltipTranslate({
        allowEscapeViewBox: allowEscapeViewBox!,
        coordinate: coordinate!,
        offsetTopLeft: props.offset!,
        position: position!,
        reverseDirection: reverseDirection!,
        tooltipBox: {
          height: tooltipSize.value.height,
          width: tooltipSize.value.width,
        },
        useTranslate3d: false,
        viewBox: viewBox!,
      })
      transform = !tooltipSize.value.height && preTransform ? preTransform : transform
      preTransform = transform || preTransform
      return { cssClasses, cssProperties, transform }
    })

    // Retarget persistent spring values; their current velocity survives pointer changes.
    watchPostEffect(() => {
      const transform = currentTransform.value.transform?.transform
      if (!el.value || typeof transform !== 'string')
        return
      const match = transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/)
      if (!match)
        return
      const nextX = Number(match[1])
      const nextY = Number(match[2])
      // Until the box is measured the translate ignores its size, so it is not a position yet.
      if ((!visible.value && !placed) || !tooltipSize.value.height)
        return
      if (props.isAnimationActive && reducedMotion.value !== 'reduce' && placed) {
        x.set(nextX)
        y.set(nextY)
      }
      else {
        x.jump(nextX)
        y.jump(nextY)
        writePosition()
        placed = true
      }
    })

    return () => {
      const { style } = props
      const { cssClasses, cssProperties } = currentTransform.value
      // The tooltip grows out of the corner that faces the pointer.
      const side = cssClasses[1] as Record<string, boolean | undefined>
      const transformOrigin = `${side['v-charts-tooltip-wrapper-left'] ? 'right' : 'left'} ${side['v-charts-tooltip-wrapper-top'] ? 'bottom' : 'top'}`

      const boundingBoxStyle: CSSProperties = {
        ...cssProperties,
        pointerEvents: 'none',
        visibility: present.value || visible.value ? 'visible' : 'hidden',
        position: 'absolute',
        top: '0px',
        left: '0px',
        ...style,
      }
      return (
        <div
          data-slot="tooltip"
          role="tooltip"
          tabindex={-1}
          class={cssClasses}
          style={boundingBoxStyle}
          ref={el}
        >
          <div ref={content} style={{ transformOrigin }}>
            {visible.value ? (cachedContent = slots.default?.()) : cachedContent}
          </div>
        </div>
      )
    }
  },
})
