import type { ChartData } from './chartData'

export type DataKey<T> = string | number | ((obj: T) => unknown)

// Charts accept consumer-owned rows, including arrays and typed objects.
export type ChartDataKey = DataKey<ChartData[number]>

export interface Coordinate {
  x: number
  y: number
}

/** Where the tooltip points in a Cartesian chart. */
export interface CartesianChartCoordinate extends Coordinate {
  xAxis?: unknown
  yAxis?: unknown
  width?: number
  height?: number
  offset?: ChartOffset
}

/** Where the tooltip points in a polar chart: the active angle and radius inside the polar box. */
export interface PolarChartCoordinate extends Coordinate {
  cx: number
  cy: number
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  angle: number
  radius: number
}

/** Cartesian layouts point at `x`/`y`; polar layouts also carry their box, angle and radius. */
export type ChartCoordinate = CartesianChartCoordinate | PolarChartCoordinate

export function isPolarCoordinate(coordinate: ChartCoordinate): coordinate is PolarChartCoordinate {
  return 'cx' in coordinate && 'angle' in coordinate
}

export interface TickItem {
  value?: unknown
  coordinate: number
  index?: number
  offset?: number

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

export type VueClassValue = string | string[] | Record<string, boolean>
