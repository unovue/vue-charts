import type { ChartDataKey } from '@/types/base'
import type { ChartOffset, Coordinate, TickItem, VueClassValue } from './base'

export type { DataKey, Coordinate, ChartCoordinate, PolarChartCoordinate, ChartOffset, TickItem, VueClassValue } from './base'
import type { TooltipPayload } from '@/types/tooltip'
import type { PropType, SVGAttributes } from 'vue'
import type { SvgTemplateAttributes } from '@/utils/attributes'

export type LayoutType = 'horizontal' | 'vertical' | 'centric' | 'radial'

export interface Margin {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

export type StackOffsetType = 'sign' | 'expand' | 'none' | 'wiggle' | 'silhouette' | 'positive'

export type SyncMethod = 'index' | 'value' | ((ticks: ReadonlyArray<TickItem>, data: MouseHandlerDataParam) => number)

export type MouseHandlerDataParam = {
  /**
   * Index of the active tick in the current chart. Only works with number-indexed one-dimensional data charts,
   * like Line, Area, Bar, Pie, etc.
   *
   * Callbacks retain legacy string indexes; hierarchy targets use their payload path.
   */
  activeTooltipIndex: number | string | null | undefined
  isTooltipActive: boolean
  /**
   * Exactly the same as activeTooltipIndex - this was also duplicated in recharts@2 so let's keep both properties for better backwards compatibility.
   */
  activeIndex: number | string | null | undefined
  activeLabel: string | number | undefined
  activeDataKey: ChartDataKey | undefined
  activeCoordinate: Coordinate | undefined
}

export interface Padding {
  top?: number
  bottom?: number
  left?: number
  right?: number
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
  payload?: unknown
  tooltipPayload?: TooltipPayload
  tooltipPosition: Coordinate | undefined
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

/**
 * Declared props plus SVG attributes, in both spellings: kebab-case as in `SVGAttributes` and
 * camelized as strict templates check them (see `SvgTemplateAttributes`).
 */
export type WithSVGProps<T> = VuePropsToType<T> & Omit<SVGAttributes, keyof T> & Omit<SvgTemplateAttributes, keyof T>

export type AllowInDimension = {
  x?: boolean
  y?: boolean
}

/** Shared Vue prop definition for `class` — use in VueProps objects to avoid repetition */
export const classProp = {
  type: [String, Array, Object] as PropType<VueClassValue>,
  default: undefined,
}
