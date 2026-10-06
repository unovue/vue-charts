import type { CartesianAxisProps } from '@/cartesian/cartesian-axis/CartesianAxis'
import type { ViewBox } from '@/types/viewBox'
import type { ChartOffset } from '@/types'
import type { AxisId, AxisInterval, XAxisOrientation, YAxisOrientation } from '@/types/axis'
import type { AxisPropsNeededForTicksGenerator, GetTicksInput } from '@/types/tick'
import type { SVGAttributes, VNode } from 'vue'

type AxisPropsForCartesianGridTicksGeneration = AxisPropsNeededForTicksGenerator &
  Omit<GetTicksInput, 'ticks' | 'viewBox'>
export type HorizontalCoordinatesGenerator = (
  props: {
    yAxis: AxisPropsForCartesianGridTicksGeneration
    width: number
    height: number
    offset: ChartOffset
  },
  syncWithTicks: boolean,
) => number[]

export type VerticalCoordinatesGenerator = (
  props: {
    xAxis: AxisPropsForCartesianGridTicksGeneration
    width: number
    height: number
    offset: ChartOffset
  },
  syncWithTicks: boolean,
) => number[]

interface InternalCartesianGridProps {
  width?: number
  height?: number
  horizontalCoordinatesGenerator?: HorizontalCoordinatesGenerator
  verticalCoordinatesGenerator?: VerticalCoordinatesGenerator
}

type LineItemProps = CartesianGridProps & {
  offset: ChartOffset
  xAxis: null | AxisPropsForCartesianGridTicksGeneration
  yAxis: null | AxisPropsForCartesianGridTicksGeneration
  x1: number
  y1: number
  x2: number
  y2: number
  key: string
  index: number
}
type GridLineTypeFunctionProps = Omit<LineItemProps, 'key'> & {
  // React does not pass the key through when calling cloneElement - so it might be undefined when cloning
  key: LineItemProps['key'] | undefined
  // offset is not present in LineItemProps but it is read from context and then passed to the GridLineType function and element
  offset: ChartOffset
}

type GridLineType =
  | SVGAttributes
  | VNode
  | ((props: GridLineTypeFunctionProps) => VNode)
  | boolean

export interface CartesianGridProps extends InternalCartesianGridProps {
  ticks?: CartesianAxisProps['ticks']
  orientation?: XAxisOrientation | YAxisOrientation
  viewBox?: ViewBox
  ry?: SVGAttributes['ry']
  stroke?: SVGAttributes['stroke']
  fill?: SVGAttributes['fill']
  fillOpacity?: SVGAttributes['fill-opacity']
  /**
   * The x-coordinate of grid.
   * If left undefined, it will be computed from the chart's offset and margins.
   */
  x?: number
  /**
   * The y-coordinate of grid.
   * If left undefined, it will be computed from the chart's offset and margins.
   */
  y?: number
  horizontal?: GridLineType
  vertical?: GridLineType
  /**
   * Array of coordinates in pixels where to draw horizontal grid lines.
   * Has priority over syncWithTicks and horizontalValues.
   */
  horizontalPoints?: number[]
  /**
   * Array of coordinates in pixels where to draw vertical grid lines.
   * Has priority over syncWithTicks and horizontalValues.
   */
  verticalPoints?: number[]
  /**
   * Defines background color of stripes.
   *
   * The values from this array will be passed in as the `fill` property in a `rect` SVG element.
   * For possible values see: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill#rect
   *
   * In case there are more stripes than colors, the colors will start from beginning.
   * So for example: verticalFill['yellow', 'black'] produces a pattern of yellow|black|yellow|black
   *
   * If this is undefined, or an empty array, then there is no background fill.
   * Note: Grid lines will be rendered above these background stripes.
   */
  verticalFill?: string[]
  /**
   * Defines background color of stripes.
   *
   * The values from this array will be passed in as the `fill` property in a `rect` SVG element.
   * For possible values see: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill#rect
   *
   * In case there are more stripes than colors, the colors will start from beginning.
   * So for example: horizontalFill['yellow', 'black'] produces a pattern of yellow|black|yellow|black
   *
   * If this is undefined, or an empty array, then there is no background fill.
   * Note: Grid lines will be rendered above these background stripes.
   */
  horizontalFill?: string[]
  /**
   * If true, only the lines that correspond to the axes ticks values will be drawn.
   * If false, extra lines could be added for each axis (at min and max coordinates), if there will not such ticks.
   * horizontalPoints, verticalPoints, horizontalValues, verticalValues have priority over syncWithTicks.
   */
  syncWithTicks?: boolean
  /**
   * Array of values, where horizontal lines will be drawn. Numbers or strings, in dependence on axis type.
   * Has priority over syncWithTicks but not over horizontalValues.
   */
  horizontalValues?: number[] | string[]
  /**
   * Array of values, where vertical lines will be drawn. Numbers or strings, in dependence on axis type.
   * Has priority over syncWithTicks but not over verticalValues.
   */
  verticalValues?: number[] | string[]
  xAxisId?: AxisId
  yAxisId?: AxisId

  axisLine?: boolean | SVGAttributes
  tickLine?: boolean | SVGAttributes
  mirror?: boolean
  minTickGap?: number
  tickSize?: number
  tickMargin?: number
  interval?: AxisInterval

}
