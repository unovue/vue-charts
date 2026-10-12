import { inject, provide } from 'vue'
import type { InjectionKey, Ref } from 'vue'
import type { RoundedSize } from '@/hooks/useRoundedSize'

const initialDimensionKey: InjectionKey<Ref<RoundedSize | undefined>> = Symbol('v-charts-initial-dimension')

export function provideInitialDimension(value: Ref<RoundedSize | undefined>) {
  provide(initialDimensionKey, value)
  return value
}

export function useInitialDimension(fallback?: Ref<RoundedSize | undefined>): Ref<RoundedSize | undefined>
export function useInitialDimension(fallback: Ref<RoundedSize | undefined> | null): Ref<RoundedSize | undefined> | null
export function useInitialDimension(fallback?: Ref<RoundedSize | undefined> | null) {
  const value = inject(initialDimensionKey, fallback)
  if (value === undefined)
    throw new Error('vccs: useInitialDimension requires its provider.')
  return value
}
