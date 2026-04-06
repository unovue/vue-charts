import type { PropType } from 'vue'
import type { AnimationOptions } from 'motion-v'
import { classProp } from '@/types'
import type { DataKey, VuePropsToType, WithSVGProps } from '@/types'
import type { LegendType } from '@/types/legend'
import type { TooltipType } from '@/types/tooltip'

export const PieVueProps = {
  data: { type: Array as PropType<Array<Record<string, unknown>>>, default: undefined },
  dataKey: { type: [String, Number, Function] as PropType<DataKey<any>>, required: true as const },
  nameKey: { type: [String, Number, Function] as PropType<DataKey<any>>, default: 'name' },
  cx: { type: [Number, String], default: '50%' },
  cy: { type: [Number, String], default: '50%' },
  innerRadius: { type: [Number, String], default: 0 },
  outerRadius: { type: [Number, String, Function] as PropType<number | string | ((element: any) => number)>, default: '80%' },
  startAngle: { type: Number, default: 0 },
  endAngle: { type: Number, default: 360 },
  paddingAngle: { type: Number, default: 0 },
  minAngle: { type: Number, default: 0 },
  fill: { type: String, default: '#808080' },
  stroke: { type: String, default: '#fff' },
  legendType: { type: String as PropType<LegendType>, default: 'rect' },
  tooltipType: { type: String as PropType<TooltipType>, default: undefined },
  hide: { type: Boolean, default: false },
  activeIndex: { type: Number, default: -1 },
  isAnimationActive: { type: Boolean, default: true },
  transition: {
    type: Object as PropType<AnimationOptions>,
    default: () => ({ duration: 1.2, ease: 'easeOut' }),
  },
  label: { type: Boolean, default: false },
  class: classProp,
}

export type PieProps = VuePropsToType<typeof PieVueProps>
export type PiePropsWithSVG = WithSVGProps<typeof PieVueProps>
