import { inject, provide } from 'vue'
import type { InjectionKey, Ref } from 'vue'
import type { Data } from '@/components/label/types'

type LabelListData = Ref<readonly Data[] | undefined>

const cartesianLabelListKey: InjectionKey<LabelListData> = Symbol('v-charts-cartesian-label-list')

export function provideCartesianLabelListData(value: LabelListData) {
  provide(cartesianLabelListKey, value)
  return value
}

export function useCartesianLabelListData(fallback?: LabelListData): LabelListData
export function useCartesianLabelListData(fallback: LabelListData | null): LabelListData | null
export function useCartesianLabelListData(fallback?: LabelListData | null) {
  const value = inject(cartesianLabelListKey, fallback)
  if (value === undefined)
    throw new Error('vccs: useCartesianLabelListData requires its provider.')
  return value
}
