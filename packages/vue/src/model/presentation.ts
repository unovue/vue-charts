import type { ComputedRef, InjectionKey } from 'vue'
import { inject, provide } from 'vue'
import type { CartesianViewBoxRequired } from '@/types/viewBox'
import type { ChartOffsetRequired, LayoutType, Margin } from '@/types'

export interface ChartPresentation {
  name: ComputedRef<string>
  layout: ComputedRef<LayoutType>
  width: ComputedRef<number>
  height: ComputedRef<number>
  margin: ComputedRef<Margin>
  viewBox: ComputedRef<CartesianViewBoxRequired>
  offset: ComputedRef<ChartOffsetRequired>
  accessibility: ComputedRef<boolean>
  bandSize: ComputedRef<number | undefined>
  syncId: ComputedRef<string | number | undefined>
  emitter: ComputedRef<symbol | undefined>
}

const presentationKey: InjectionKey<ChartPresentation> = Symbol('vccs-chart-presentation')

export function provideChartPresentation(presentation: ChartPresentation) {
  provide(presentationKey, presentation)
}

export function useChartPresentation() {
  const presentation = inject(presentationKey)
  if (!presentation)
    throw new Error('vccs: presentation requires a chart.')
  return presentation
}
