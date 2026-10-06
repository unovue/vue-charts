import type { ComputedRef } from 'vue'
import { computed, shallowRef, toRaw, watch } from 'vue'

/** Track each data owner once, including values consumed only by raw calculations. */
export function useTrackedData<T>(source: () => T[] | undefined): ComputedRef<T[] | undefined> {
  const revision = shallowRef(0)
  // Invalidate before synchronous consumers read a replacement, avoiding a second calculation.
  watch(source, () => revision.value++, { deep: true, flush: 'sync' })
  return computed(() => {
    // Raw rows retain caller identity; the fresh array invalidates identity-memoized math.
    revision.value
    const data = source()
    return data === undefined ? undefined : toRaw(data).map(item => toRaw(item))
  })
}
