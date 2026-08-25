import type { CSSProperties, PropType, VNode } from 'vue'
import type { LayoutType, Margin } from '@/types'
import type { CartesianPosition } from '@/cartesian/getCartesianPosition'
import type { LegendType } from '@/types/legend'
import type { HorizontalAlignmentType, LegendPayload, VerticalAlignmentType } from '@/components/DefaultLegendContent'
import type { VuePropsToType, WithSVGProps } from '@/types/common'

export interface LegendSlots {
  content: (params: LegendContentProps) => VNode
}

export const LegendVueProps = {
  layout: {
    type: String as PropType<LayoutType | 'auto'>,
    default: 'auto',
  },
  align: {
    type: String as PropType<HorizontalAlignmentType>,
    default: 'center',
  },
  verticalAlign: {
    type: String as PropType<VerticalAlignmentType>,
    default: 'bottom',
  },
  /**
   * The position of the legend relative to the chart.
   * If this is defined, it overrides `align` and `verticalAlign`.
   */
  position: {
    type: [String, Object] as PropType<CartesianPosition>,
    default: undefined,
  },
  /**
   * The offset to the specified `position`. Direction of the offset depends on the position.
   */
  offset: {
    type: Number,
    default: 0,
  },
  width: Number,
  height: Number,
  iconSize: {
    type: Number,
    default: 14,
  },
  iconType: String as PropType<LegendType>,
  wrapperStyle: Object as PropType<CSSProperties>,
  contentStyle: Object as PropType<CSSProperties>,
  itemStyle: Object as PropType<CSSProperties>,
  formatter: Function as PropType<(value: string, entry: LegendPayload) => string>,
  onClick: Function as PropType<(data: LegendPayload, index: number) => void>,
  onMouseEnter: Function as PropType<(data: LegendPayload, index: number) => void>,
  onMouseLeave: Function as PropType<(data: LegendPayload, index: number) => void>,
  margin: Object as PropType<Margin>,
  chartWidth: Number,
  chartHeight: Number,
  payloadUniqBy: [Boolean, Function] as PropType<boolean | ((item: LegendPayload) => any)>,
  itemSorter: {
    type: [String, Function] as PropType<'value' | 'dataKey' | ((item: LegendPayload) => number | string)>,
    default: 'value',
  },
  portal: Object as PropType<HTMLElement | null>,
  onBBoxUpdate: Function as PropType<(box: { width: number, height: number } | null) => void>,
} as const

export type LegendProps = VuePropsToType<typeof LegendVueProps>
export type LegendPropsWithSVG = WithSVGProps<typeof LegendVueProps>

export interface LegendContentProps extends LegendProps {
  payload: LegendPayload[]
}
