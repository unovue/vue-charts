import { usePreferredReducedMotion } from '@vueuse/core'
import { animate } from 'motion-v'
import { defineComponent, onScopeDispose, ref, watch } from 'vue'
import type { AnimationPlaybackControls } from 'motion-dom'
import { shouldSkipEntrance } from './renderPhase'

/** Labels appear after geometry settles; animation-disabled charts show them immediately. */
export const FadeIn = defineComponent({
  props: { isActive: { type: Boolean, default: true } },
  setup(props, { slots }) {
    const element = ref<SVGGElement>()
    const reduced = usePreferredReducedMotion()
    const skip = shouldSkipEntrance()
    let controls: AnimationPlaybackControls | undefined
    watch([element, () => props.isActive], ([el, active]) => {
      controls?.stop()
      if (el && active && !skip && reduced.value !== 'reduce')
        controls = animate(el, { opacity: [0, 1] }, { duration: 0.2 })
      else if (el)
        el.style.opacity = '1'
    }, { flush: 'post' })
    onScopeDispose(() => controls?.stop())
    return () => <g ref={element}>{slots.default?.()}</g>
  },
})
