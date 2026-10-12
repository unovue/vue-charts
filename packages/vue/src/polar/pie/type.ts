import type { ChartDataKey } from '@/types/base'
import type { PropType } from 'vue'
import type { ValueAnimationTransition } from 'motion-v'
import { classProp } from '@/types'
import type { VuePropsToType } from '@/types'
import type { LegendType } from '@/types/legend'
import type { TooltipType } from '@/types/tooltip'

export const PieVueProps = {
  data: { type: Array as PropType<Array<Record<string, unknown>>>, default: undefined },
  dataKey: { type: [String, Number, Function] as PropType<ChartDataKey>, required: true as const },
  nameKey: { type: [String, Number, Function] as PropType<ChartDataKey>, default: 'name' },
  /** Series name for the tooltip and the legend fallback; defaults to a string `dataKey`. */
  name: { type: [String, Number], default: undefined },
  cx: { type: [Number, String], default: '50%' },
  cy: { type: [Number, String], default: '50%' },
  innerRadius: { type: [Number, String], default: 0 },
  outerRadius: { type: [Number, String, Function] as PropType<number | string | ((element: unknown) => number)>, default: '80%' },
  startAngle: { type: Number, default: 0 },
  endAngle: { type: Number, default: 360 },
  paddingAngle: { type: Number, default: 0 },
  /** Rounds the corners of every sector, in px. */
  cornerRadius: { type: [Number, String] as PropType<number | string>, default: undefined },
  minAngle: { type: Number, default: 0 },
  fill: { type: String, default: undefined },
  stroke: { type: String, default: 'var(--v-charts-background, #fff)' },
  legendType: { type: String as PropType<LegendType>, default: 'rect' },
  tooltipType: { type: String as PropType<TooltipType>, default: undefined },
  hide: { type: Boolean, default: false },
  activeIndex: { type: Number as PropType<number | null>, default: undefined },
  isAnimationActive: { type: Boolean, default: undefined },
  transition: {
    type: Object as PropType<ValueAnimationTransition<number>>,
    default: undefined,
  },
  label: { type: Boolean, default: false },
  labelLine: { type: Boolean, default: true },
  class: classProp,
}

/** Resolved Pie props inside the library; the public `PieProps` is derived from the component. */
export type PieInput = VuePropsToType<typeof PieVueProps>
