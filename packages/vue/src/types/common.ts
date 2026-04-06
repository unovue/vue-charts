import type { TooltipPayload, TooltipPayloadSearcher } from '@/state/tooltipSlice'
import type { TooltipEventType, TooltipIndex } from './tooltip'
import type { PropType, SVGAttributes } from 'vue'

export type DataKey<T> = string | number | ((obj: T) => any)

export interface Coordinate {
  x: number
  y: number
}

export interface ChartCoordinate extends Coordinate {
  xAxis?: any
  yAxis?: any
  width?: any
  height?: any
  offset?: ChartOffset
  angle?: number
  radius?: number
  cx?: number
  cy?: number
  startAngle?: number
  endAngle?: number
  innerRadius?: number
  outerRadius?: number
}

export type LayoutType = 'horizontal' | 'vertical' | 'centric' | 'radial'

export interface Margin {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

export type StackOffsetType = 'sign' | 'expand' | 'none' | 'wiggle' | 'silhouette' | 'positive'

export interface TickItem {
  value?: any
  coordinate: number
  index?: number
  offset?: number

}

export type SyncMethod = 'index' | 'value' | ((ticks: ReadonlyArray<TickItem>, data: MouseHandlerDataParam) => number)

export type MouseHandlerDataParam = {
  /**
   * Index of the active tick in the current chart. Only works with number-indexed one-dimensional data charts,
   * like Line, Area, Bar, Pie, etc.
   *
   * Doesn't work with two-dimensional data charts like Treemap, Sankey. But one day it will which is why the TooltipIndex type is here.
   */
  activeTooltipIndex: number | TooltipIndex | undefined
  isTooltipActive: boolean
  /**
   * Exactly the same as activeTooltipIndex - this was also duplicated in recharts@2 so let's keep both properties for better backwards compatibility.
   */
  activeIndex: number | TooltipIndex | undefined
  activeLabel: string | number | undefined
  activeDataKey: DataKey<any> | undefined
  activeCoordinate: Coordinate | undefined
}

export interface Padding {
  top?: number
  bottom?: number
  left?: number
  right?: number
}

export interface ChartOffset {
  top: number
  bottom: number
  left: number
  right: number
  height: number
  width: number
  brushBottom: number
}

export type ChartOffsetRequired = Required<ChartOffset>

export interface Size {
  width: number
  height: number
}

/**
 * Coordinates relative to the top-left corner of the chart.
 * Also include scale which means that a chart that's scaled will return the same coordinates as a chart that's not scaled.
 */
export interface ChartPointer {
  chartX: number
  chartY: number
}

export type IfOverflow = 'hidden' | 'visible' | 'discard' | 'extendDomain'

export interface ScatterPointNode {
  x?: number | string
  y?: number | string
  z?: number | string
}

export interface ScatterPointItem {
  cx: number | undefined
  cy: number | undefined
  x: number | undefined
  y: number | undefined
  size: number
  width: number
  height: number
  node: ScatterPointNode
  payload?: any
  tooltipPayload?: TooltipPayload
  tooltipPosition: Coordinate
}

export interface CategoricalChartOptions {
  chartName: string
  defaultTooltipEventType?: TooltipEventType
  validateTooltipEventTypes?: ReadonlyArray<TooltipEventType>
  defaultProps?: any
  tooltipPayloadSearcher: TooltipPayloadSearcher
}

type UnwrapPropType<T> =
  T extends PropType<infer C> ? C : T
type VuePropField<P> =
  P extends { type: infer T }
    ? UnwrapPropType<T>
    : UnwrapPropType<P>

export type VuePropsToType<Props> = {
  [K in keyof Props as Props[K] extends { required: boolean } ? K : never]: VuePropField<Props[K]>
} & {
  [K in keyof Props as Props[K] extends { required: boolean } ? never : K]?: VuePropField<Props[K]>
}

export type WithSVGProps<T> = VuePropsToType<T> & Omit<SVGAttributes, keyof T>

export type AllowInDimension = {
  x?: boolean
  y?: boolean
}

/** Vue class binding type: string, string[], or { [className]: boolean } */
export type VueClassValue = string | string[] | Record<string, boolean>

/** Shared Vue prop definition for `class` — use in VueProps objects to avoid repetition */
export const classProp = {
  type: [String, Array, Object] as PropType<VueClassValue>,
  default: undefined,
}
