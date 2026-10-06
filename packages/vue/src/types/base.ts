export type DataKey<T> = string | number | ((obj: T) => unknown)

// Charts accept consumer-owned rows, including arrays and typed objects.
// eslint-disable-next-line ts/no-explicit-any -- Consumer-owned chart rows may be objects, arrays, or other accessor inputs.
export type ChartDataKey = DataKey<any>

export interface Coordinate {
  x: number
  y: number
}

export interface ChartCoordinate extends Coordinate {
  xAxis?: unknown
  yAxis?: unknown
  width?: number
  height?: number
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
