import { useReducedMotion } from '@/animation/useReducedMotion'
import { animate } from 'motion-v'
import type { AnimationPlaybackControls } from 'motion-dom'
import { defineComponent, nextTick, onMounted, onScopeDispose, ref } from 'vue'
import { shouldSkipEntrance } from './renderPhase'

/** Radius and opacity appear together; pointer retargeting keeps the mounted dot. */
export const ActiveDot = defineComponent({
  props: { isAnimationActive: { type: Boolean, default: true } },
  setup(props, { slots }) {
    const element = ref<SVGGElement>()
    const reduced = useReducedMotion()
    const skip = shouldSkipEntrance()
    let controls: AnimationPlaybackControls | undefined
    onMounted(() => nextTick(() => {
      const el = element.value
      if (!el || !props.isAnimationActive || skip || reduced.value === 'reduce')
        return
      const circle = el.querySelector('circle')
      const radius = circle?.getAttribute('r')
      controls = animate(0, 1, {
        duration: 0.15,
        ease: 'easeOut',
        onUpdate: (t) => {
          el.style.opacity = String(t)
          if (circle && radius)
            circle.setAttribute('r', String(Number(radius) * t))
        },
      })
      el.style.opacity = '0'
      if (circle)
        circle.setAttribute('r', '0')
    }))
    onScopeDispose(() => controls?.stop())
    return () => <g ref={element}>{slots.default?.()}</g>
  },
})
