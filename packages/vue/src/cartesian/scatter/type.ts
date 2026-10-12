import type { PropType, VNode, VNodeChild } from 'vue'
import type { ValueAnimationTransition } from 'motion-v'
import type { ChartDataKey } from '@/types/base'
import type { SymbolType } from '@/shape/Symbols'
import type { CurveType } from '@/shape/Curve'
import type { TooltipType } from '@/types/tooltip'
import type { LegendType } from '@/types/legend'
import type { ScatterPointItem } from '@/types/common'
import { classProp } from '@/types'

export const ScatterVueProps = {
  xAxisId: { type: [String, Number] as PropType<string | number>, default: 0 },
  yAxisId: { type: [String, Number] as PropType<string | number>, default: 0 },
  zAxisId: { type: [String, Number] as PropType<string | number>, default: 0 },
  dataKey: { type: [String, Number, Function] as PropType<ChartDataKey>, default: undefined },
  data: { type: Array as PropType<ReadonlyArray<Record<string, unknown>>>, default: undefined },
  name: { type: [String, Number] as PropType<string | number>, default: undefined },
  hide: { type: Boolean, default: false },
  fill: { type: String, default: undefined },
  shape: { type: String as PropType<SymbolType>, default: 'circle' },
  isAnimationActive: { type: Boolean, default: undefined },
  line: { type: [Boolean, Object], default: false },
  lineType: { type: String as PropType<'fitting' | 'joint'>, default: 'joint' },
  lineJointType: { type: [String, Function] as PropType<CurveType>, default: 'linear' },
  label: { type: [Boolean, Object], default: false },
  legendType: { type: String as PropType<LegendType>, default: 'circle' },
  tooltipType: { type: String as PropType<TooltipType>, default: undefined },
  transition: { type: Object as PropType<ValueAnimationTransition<number>>, default: undefined },
  class: classProp,
}

export interface ScatterSlots {
  shape?: (props: ScatterPointItem & { index: number, isActive: boolean }) => VNodeChild
  default?: () => VNode[]
}
