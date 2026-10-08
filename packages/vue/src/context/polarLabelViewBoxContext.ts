import type { ComputedRef, InjectionKey } from 'vue'
import { computed, inject } from 'vue'
import type { PolarViewBox } from '@/types/viewBox'

export const POLAR_LABEL_VIEW_BOX_KEY: InjectionKey<ComputedRef<PolarViewBox | undefined>> = Symbol('polar-label-view-box')

export function usePolarLabelViewBox(): ComputedRef<PolarViewBox | undefined> {
  return inject(POLAR_LABEL_VIEW_BOX_KEY, computed(() => undefined))
}
