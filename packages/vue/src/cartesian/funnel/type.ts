import type { ValueAnimationTransition } from 'motion-v'
import type { PropType } from 'vue'
import { classProp } from '@/types'
import type { DataKey, TooltipType, WithSVGProps } from '@/types'
import type { LegendType } from '@/types/legend'

export type { FunnelTrapezoidItem, FunnelComposedData } from '@/types/funnel'

export interface FunnelProps {
  // activeShape?: ActiveShape<FunnelTrapezoidItem, SVGPathElement>
  data?: any[]
  dataKey: DataKey<any>
  hide?: boolean
  id?: string
  isAnimationActive?: boolean
  transition?: ValueAnimationTransition<number>
  // label?: ImplicitLabelListType<any>
  lastShapeType?: 'triangle' | 'rectangle'
  legendType?: LegendType
  nameKey?: DataKey<any>
  reversed?: boolean
  // shape?: ActiveShape<FunnelTrapezoidItem, SVGPathElement>
  tooltipType?: TooltipType
}

export const FunnelVueProps = {
  data: { type: Array as PropType<Array<Record<string, unknown>>>, default: undefined },
  dataKey: { type: [String, Number, Function] as PropType<DataKey<any>>, required: true as const },
  nameKey: { type: [String, Number, Function] as PropType<DataKey<any>>, default: 'name' },
  lastShapeType: { type: String as PropType<'triangle' | 'rectangle'>, default: 'triangle' },
  reversed: { type: Boolean, default: false },
  fill: { type: String, default: 'var(--v-charts-series, #808080)' },
  stroke: { type: String, default: 'var(--v-charts-background, #fff)' },
  legendType: { type: String as PropType<LegendType>, default: 'rect' },
  tooltipType: { type: String as PropType<TooltipType>, default: undefined },
  hide: { type: Boolean, default: false },
  isAnimationActive: { type: Boolean, default: true },
  transition: {
    type: Object as PropType<ValueAnimationTransition<number>>,
    default: undefined,
  },
  width: { type: [Number, String] as PropType<number | string>, default: undefined },
  class: classProp,
}

export type FunnelPropsWithSVG = WithSVGProps<typeof FunnelVueProps>
