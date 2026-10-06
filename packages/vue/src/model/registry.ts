import type { ComputedRef, Ref } from 'vue'
import { computed, onScopeDispose, shallowReactive } from 'vue'

export interface Registry<T> {
  readonly entries: ComputedRef<readonly T[]>
  register: (entry: Readonly<Ref<T | undefined>>) => void
}

export function createRegistry<T>(): Registry<T> {
  const registrations = shallowReactive(new Set<Readonly<Ref<T | undefined>>>())
  const entries = computed(() => [...registrations].flatMap((entry) => {
    const value = entry.value
    return value === undefined ? [] : [value]
  }))

  function register(entry: Readonly<Ref<T | undefined>>) {
    registrations.add(entry)
    onScopeDispose(() => registrations.delete(entry))
  }

  return { entries, register }
}
