import { usePreferredReducedMotion } from '@vueuse/core'
import { computed, getCurrentInstance, onMounted, ref } from 'vue'

/** The server and the first hydration render cannot know the browser's preference. */
export function useReducedMotion() {
  const mounted = ref(getCurrentInstance() == null)
  const preference = usePreferredReducedMotion()
  if (!mounted.value)
    onMounted(() => { mounted.value = true })
  return computed(() => mounted.value ? preference.value : 'no-preference')
}
