import { nextTick, onScopeDispose } from 'vue'

/** Ignore the inline instance replaced by the chart's mount-time layer teleport. */
export function useAnimationCallbacks(onStart: () => void, onEnd: () => void) {
  let alive = true
  onScopeDispose(() => { alive = false })
  return {
    onStart: () => {
      void nextTick(() => {
        if (alive)
          onStart()
      })
    },
    onEnd: () => {
      void nextTick(() => {
        if (alive)
          onEnd()
      })
    },
  }
}
