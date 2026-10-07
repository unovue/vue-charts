import type { ChartDataKey } from '@/types/base'
import type { ValueAnimationTransition } from 'motion-v'
import type { PropType } from 'vue'
import { classProp } from '@/types'
import type { TooltipType } from '@/types'
import type { LegendType } from '@/types/legend'

export const FunnelVueProps = {
  data: { type: Array as PropType<Array<Record<string, unknown>>>, default: undefined },
  dataKey: { type: [String, Number, Function] as PropType<ChartDataKey>, required: true as const },
  nameKey: { type: [String, Number, Function] as PropType<ChartDataKey>, default: 'name' },
  /** Series name for the tooltip; defaults to a string `dataKey`. */
  name: { type: [String, Number], default: undefined },
  lastShapeType: { type: String as PropType<'triangle' | 'rectangle'>, default: 'triangle' },
  reversed: { type: Boolean, default: false },
  fill: { type: String, default: undefined },
  stroke: { type: String, default: 'var(--v-charts-background, #fff)' },
  legendType: { type: String as PropType<LegendType>, default: 'rect' },
  tooltipType: { type: String as PropType<TooltipType>, default: undefined },
  hide: { type: Boolean, default: false },
  isAnimationActive: { type: Boolean, default: undefined },
  transition: {
    type: Object as PropType<ValueAnimationTransition<number>>,
    default: undefined,
  },
  width: { type: [Number, String] as PropType<number | string>, default: undefined },
  class: classProp,
}
