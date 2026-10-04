import type { ShallowRef } from 'vue'
import { shallowRef, toRaw, watch } from 'vue'

/** Give identity-memoized calculations a fresh, raw array on every data change. */
export function useTrackedData<T>(source: () => T[] | undefined): ShallowRef<T[] | undefined> {
  const data = shallowRef<T[]>()
  watch(source, (arr) => {
    data.value = arr === undefined ? undefined : toRaw(arr).map(item => toRaw(item))
  }, { deep: true, immediate: true })
  return data
}
