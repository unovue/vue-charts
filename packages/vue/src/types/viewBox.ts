export type Unit = string | number

export type Orientation = 'top' | 'bottom' | 'left' | 'right'

export interface PolarViewBox {
  cx?: number
  cy?: number
  innerRadius?: number
  outerRadius?: number
  startAngle?: number
  endAngle?: number
  clockWise?: boolean
}
export type PolarViewBoxRequired = Required<PolarViewBox>

export interface CartesianViewBox {
  x?: number
  y?: number
  width?: number
  height?: number
}

export type ViewBox = CartesianViewBox | PolarViewBox

export type CartesianViewBoxRequired = Required<CartesianViewBox>

export interface TrapezoidViewBox {
  x: number
  y: number
  upperWidth: number
  lowerWidth: number
  width: number
  height: number
}

export type Sign = 0 | 1 | -1
