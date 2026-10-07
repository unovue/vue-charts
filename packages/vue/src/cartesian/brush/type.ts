import type { ChartDataKey } from '@/types/base'
import type { BrushStartEndIndex } from '@/types/chartData'
import { classProp } from '../../types/common'
import type { Padding, VuePropsToType } from '../../types/common'
import type { PropType } from 'vue'

export type { BrushStartEndIndex }
export type BrushIndex = number

export const BrushVueProps = {
  height: {
    type: Number,
    default: 40,
  },
  travellerWidth: {
    type: Number,
    default: 5,
  },
  gap: {
    type: Number,
    default: 1,
  },
  fill: {
    type: String,
    default: 'var(--v-charts-background, #fff)',
  },
  stroke: {
    type: String,
    default: 'var(--v-charts-axis, #666)',
  },
  padding: {
    type: Object as PropType<Padding>,
    default: () => ({ top: 1, right: 1, bottom: 1, left: 1 }),
  },
  leaveTimeOut: {
    type: Number,
    default: 1000,
  },
  alwaysShowText: {
    type: Boolean,
    default: false,
  },
  x: {
    type: Number,
  },
  y: {
    type: Number,
  },
  dy: {
    type: Number,
  },
  width: {
    type: Number,
  },
  ariaLabel: {
    type: String,
  },
  class: classProp,
  data: {
    type: Array as PropType<unknown[]>,
  },
  dataKey: [String, Function] as PropType<ChartDataKey>,
  range: {
    type: Object as PropType<BrushStartEndIndex | null>,
    default: undefined,
  },
  tickFormatter: {
    type: Function as PropType<(value: unknown, index: number) => string>,
  },
}
/** Resolved Brush props inside the library; the public `BrushProps` is derived from the component. */
export type BrushInput = VuePropsToType<typeof BrushVueProps>

export type BrushTravellerId = 'startX' | 'endX'

export interface BrushState {
  isTravellerMoving: boolean
  isTravellerFocused: boolean
  isSlideMoving: boolean
  startX?: number
  endX?: number
  slideMoveStartX?: number
  movingTravellerId?: BrushTravellerId
  isTextActive: boolean
  brushMoveStartX?: number
  scale?: (index: number) => number | undefined
  scaleValues?: number[]
}
