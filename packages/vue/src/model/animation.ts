import type { InjectionKey } from 'vue'
import { inject, provide } from 'vue'
import type { ChartTransition } from '@/animation/motion'

export interface ChartAnimation {
  isAnimationActive?: boolean
  transition?: ChartTransition
}

const chartAnimationKey: InjectionKey<ChartAnimation> = Symbol('vccs-chart-animation')

export function provideChartAnimation(props: ChartAnimation) {
  provide(chartAnimationKey, props)
}

export function useChartAnimation() {
  return inject(chartAnimationKey, {})
}
