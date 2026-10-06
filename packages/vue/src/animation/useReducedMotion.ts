import { useMounted, usePreferredReducedMotion } from '@vueuse/core'
import { computed, getCurrentInstance } from 'vue'

/** The server and the first hydration render cannot know the browser's preference. */
export function useReducedMotion() {
  const outsideComponent = getCurrentInstance() == null
  const mounted = useMounted()
  const preference = usePreferredReducedMotion()
  return computed(() => outsideComponent || mounted.value ? preference.value : 'no-preference')
}
