import type { CSSProperties, PropType, VNodeChild } from 'vue'
import type { LayoutType } from '@/types'
import type { CartesianPosition } from '@/cartesian/getCartesianPosition'
import type { LegendType } from '@/types/legend'
import type { HorizontalAlignmentType, LegendPayload, VerticalAlignmentType } from '@/components/DefaultLegendContent'
import type { VuePropsToType } from '@/types/common'

export interface LegendSlots {
  content?: (params: LegendContentProps) => VNodeChild
}

export type LegendHidden = string[]

export const LegendVueProps = {
  hidden: Array as PropType<LegendHidden>,
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
  formatter: Function as PropType<(value: string | undefined, entry: LegendPayload) => string>,
  payloadUniqBy: [Boolean, Function] as PropType<boolean | ((item: LegendPayload) => unknown)>,
  /** Sort entries. By default they keep the order of the data (Pie) or of the series. */
  itemSorter: {
    type: [String, Function] as PropType<'value' | 'dataKey' | ((item: LegendPayload) => number | string)>,
    default: undefined,
  },
  to: [String, Object] as PropType<string | HTMLElement>,
} as const

/** Resolved Legend props inside the library; the public `LegendProps` is derived from the component. */
export type LegendInput = VuePropsToType<typeof LegendVueProps>

export interface LegendContentProps extends LegendInput {
  payload: LegendPayload[]
}
