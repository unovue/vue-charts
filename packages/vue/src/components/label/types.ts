import type { PropType, VNode, VNodeChild } from 'vue'
import type { CartesianViewBox, PolarViewBox, ViewBox } from '@/types/viewBox'
import { classProp } from '@/types'
import type { DataKey, VuePropsToType } from '@/types'
import { last } from 'es-toolkit/compat'

export type { ViewBox }

export interface Data extends
  Omit<CartesianViewBox, 'x' | 'y'>,
  Omit<PolarViewBox, 'innerRadius' | 'startAngle'> {
  x?: number | null
  y?: number | null
  innerRadius?: number | null
  startAngle?: number | null
  value?: unknown
  payload?: unknown
  parentViewBox?: ViewBox
  fill?: string
  /** Set by a series while the shape behind the label fades in or out. */
  opacity?: number
  /** Identity of the shape behind the label across data changes; defaults to the index. */
  key?: PropertyKey
}

export type LabelPosition =
  | 'top'
  | 'left'
  | 'right'
  | 'bottom'
  | 'inside'
  | 'outside'
  | 'insideLeft'
  | 'insideRight'
  | 'insideTop'
  | 'insideBottom'
  | 'insideTopLeft'
  | 'insideBottomLeft'
  | 'insideTopRight'
  | 'insideBottomRight'
  | 'insideStart'
  | 'insideEnd'
  | 'end'
  | 'center'
  | 'centerTop'
  | 'centerBottom'
  | 'middle'
  | {
    x?: number
    y?: number
  }

const defaultAccessor = (entry: Data) => (Array.isArray(entry.value) ? last(entry.value) : entry.value)
export const LabelListVueProps = {
  id: {
    type: String,
  },
  data: {
    type: Array as PropType<ReadonlyArray<Data>>,
  },
  valueAccessor: {
    type: Function as PropType<(entry: Data, index: number) => string | number>,
    default: defaultAccessor,
  },
  clockWise: {
    type: Boolean,
  },
  dataKey: {
    type: [String, Function] as PropType<DataKey<Record<string, unknown>>>,
  },
  textBreakAll: {
    type: Boolean,
  },
  position: {
    type: String as PropType<LabelPosition>,
  },
  offset: {
    type: Number,
  },
  angle: {
    type: Number,
  },
}

export type LabelFormatter = (label: string | number | undefined) => string | number | undefined

export const LabelVueProps = {
  id: {
    type: String,
  },
  class: { ...classProp, default: '' },
  viewBox: {
    type: Object as PropType<ViewBox>,
  },
  parentViewBox: {
    type: Object as PropType<ViewBox>,
  },
  value: {
    type: [Number, String],
  },
  formatter: {
    type: Function as PropType<LabelFormatter>,
  },
  offset: {
    type: Number,
    default: 5,
  },
  position: {
    type: [String, Object] as PropType<LabelPosition>,
  },
  textBreakAll: {
    type: Boolean,
  },
  angle: {
    type: Number,
  },
  index: {
    type: Number,
  },
}

export type LabelProps = VuePropsToType<typeof LabelVueProps>

export interface LabelSlots {
  content: (props: LabelProps & { viewBox: ViewBox }) => VNode
}

export type LabelListSlotProps = Omit<LabelProps, 'viewBox'> & ViewBox & {
  value?: string | number
  index: number
  key: string
}

export interface LabelListSlots {
  content?: (props: LabelListSlotProps) => VNodeChild
  label?: (props: LabelListSlotProps) => VNodeChild
}
