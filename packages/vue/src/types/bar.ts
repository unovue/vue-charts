import type { Coordinate, DataKey, VueClassValue } from '@/types/common'
import type { ChartData } from '@/types/chartData'
import type { MinPointSize } from '@/types/shape'
import type { CartesianViewBox } from '@/types/viewBox'

export type BarPositionPosition = {
  /**
   * Offset is returned always from zero position.
   * So in a way it's "absolute".
   *
   * NOT inbetween bars, but always from zero.
   */
  offset: number
  /**
   * Size of the bar.
   * This will be usually a number.
   * But if the input data is not well-formed, undefined or NaN will be on the output too.
   */
  size: number | undefined | typeof NaN
}

export type RectRadius = [number, number, number, number]

interface RectangleProps {
  class?: VueClassValue
  x?: number | null
  y?: number | null
  width?: number
  height?: number
  radius?: number | RectRadius
  isAnimationActive?: boolean
  isUpdateAnimationActive?: boolean
}

export interface BarRectangleItem extends RectangleProps {
  value?: number | [number, number]
  /** the original data entry */
  payload?: unknown
  /** the coordinate of background rectangle */
  background?: {
    x?: number | null
    y?: number | null
    width?: number
    height?: number
  }
  /** Chart range coordinate of the baseValue of the first bar in a stack. */
  stackedBarStart: number
  tooltipPosition: Coordinate
  /** The chart's full plotting area viewBox, used by LabelList for text wrapping calculations */
  parentViewBox?: CartesianViewBox
}

export type ErrorBarDirection = 'x' | 'y'

export interface BarSettings {
  barSize?: string | number
  data?: ChartData
  dataKey: DataKey<unknown>
  maxBarSize?: number
  minPointSize: MinPointSize
  stackId?: string | number
}
