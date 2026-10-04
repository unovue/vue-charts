import { usePreferredReducedMotion } from '@vueuse/core'
import { animate } from 'motion-v'
import { defineComponent, onScopeDispose, ref, watch } from 'vue'
import type { AnimationPlaybackControls } from 'motion-dom'
import { shouldSkipEntrance } from './renderPhase'

/** Opt-in label fade; unrelated chart families keep their existing behavior. */
export const FadeIn = defineComponent({
  setup(_, { slots }) {
    const element = ref<SVGGElement>()
    const reduced = usePreferredReducedMotion()
    const skip = shouldSkipEntrance()
    let controls: AnimationPlaybackControls | undefined
    watch(element, (el) => {
      controls?.stop()
      if (el && !skip && reduced.value !== 'reduce')
        controls = animate(el, { opacity: [0, 1] }, { duration: 0.2 })
    }, { flush: 'post' })
    onScopeDispose(() => controls?.stop())
    return () => <g ref={element}>{slots.default?.()}</g>
  },
})
