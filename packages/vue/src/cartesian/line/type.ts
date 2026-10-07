import type { LinePointItem } from '@/types/line'
import type { LabelListSlotProps } from '@/components/label/types'
import type { ExtractPropTypes, PropType, VNode, VNodeChild } from 'vue'
import type { ChartDataKey } from '@/types/base'
import type { TooltipType } from '@/types'
import type { AxisId } from '@/types/axis'
import type { ValueAnimationTransition } from 'motion-v'
import type { LegendType } from '@/types/legend'
import type { CurveFactory } from 'd3-shape'
import type { CurveType } from '@/shape/Curve'
import { classProp } from '@/types'

export type { LinePointItem } from '@/types/line'

export const LineVueProps = {
  activeDot: { type: [Boolean, Object] as PropType<boolean | Record<string, unknown>>, default: true },
  isAnimationActive: { type: Boolean, default: undefined },
  connectNulls: { type: Boolean, default: false },
  data: { type: Array, default: undefined },
  dataKey: {
    type: [String, Number, Function] as PropType<ChartDataKey>,
    required: true as const,
  },
  dot: { type: [Boolean, Object] as PropType<boolean | Record<string, unknown>>, default: true },
  hide: { type: Boolean, default: false },
  label: { type: [Boolean, Object] },
  legendType: { type: String as PropType<LegendType>, default: 'line' },
  stroke: { type: String, default: undefined },
  strokeWidth: { type: Number, default: 1 },
  tooltipType: { type: String as PropType<TooltipType> },
  transition: {
    type: Object as PropType<ValueAnimationTransition<number>>,
    default: undefined,
  },
  type: { type: [String, Function] as PropType<CurveType | CurveFactory> },
  unit: { type: [String, Number] },
  xAxisId: { type: [String, Number] as PropType<AxisId>, default: 0 },
  yAxisId: { type: [String, Number] as PropType<AxisId>, default: 0 },
  id: { type: String },
  name: { type: [String, Number] },
  class: classProp,
}

export type LineInput = ExtractPropTypes<typeof LineVueProps>
type ActivePointSlotProps = {
  'index': number
  'dataKey': ChartDataKey
  'cx': number
  'cy': number
  'r': number
  'fill': string
  'stroke-width': number
  'stroke': string
  'payload': LinePointItem['payload']
  'value'?: number
}

type ActivePointsSlots = {
  activeDot?: (props: ActivePointSlotProps) => VNodeChild
}

export type LineSlots = ActivePointsSlots & {
  default?: () => VNode[]
  shape?: (props: import('@/shape/Curve').CurveInput) => VNodeChild
  dot?: (props: { cx: number, cy: number, index: number, value?: number, payload?: unknown }) => VNodeChild
  label?: (props: LabelListSlotProps) => VNodeChild
}
