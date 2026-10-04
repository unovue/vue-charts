import type { AnimationOptions } from 'motion-v'
import type { PropType } from 'vue'
import { classProp } from '@/types'
import type { ViewBox } from '@/cartesian/type'
import type { TrapezoidProps } from '@/shape'
import type { Coordinate, DataKey, TooltipType, WithSVGProps } from '@/types'
import type { LegendType } from '@/types/legend'

export interface FunnelTrapezoidItem extends TrapezoidProps {
  value?: number | string
  payload?: any
  isActive: boolean
  tooltipPosition: Coordinate
  parentViewBox?: ViewBox
  labelViewBox?: ViewBox
}

export interface FunnelProps {
  // activeShape?: ActiveShape<FunnelTrapezoidItem, SVGPathElement>
  data?: any[]
  dataKey: DataKey<any>
  hide?: boolean
  id?: string
  isAnimationActive?: boolean
  transition?: AnimationOptions
  // label?: ImplicitLabelListType<any>
  lastShapeType?: 'triangle' | 'rectangle'
  legendType?: LegendType
  nameKey?: DataKey<any>
  onAnimationEnd?: () => void
  onAnimationStart?: () => void
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
    type: Object as PropType<AnimationOptions>,
    default: () => ({
      duration: 0.8,
      ease: 'easeOut',
    }),
  },
  onAnimationStart: { type: Function as PropType<() => void>, default: undefined },
  onAnimationEnd: { type: Function as PropType<() => void>, default: undefined },
  width: { type: [Number, String] as PropType<number | string>, default: undefined },
  class: classProp,
}

export type FunnelPropsWithSVG = WithSVGProps<typeof FunnelVueProps>

type RealFunnelData = any

export type FunnelComposedData = {
  trapezoids: ReadonlyArray<FunnelTrapezoidItem>
  data: RealFunnelData[]
}
