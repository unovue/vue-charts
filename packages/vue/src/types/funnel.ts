import type { Coordinate } from '@/types/common'
import type { ViewBox } from '@/types/viewBox'
import type { TrapezoidProps } from '@/shape'

export interface FunnelTrapezoidItem extends TrapezoidProps {
  x: number
  y: number
  upperWidth: number
  lowerWidth: number
  height: number
  value?: number | string
  name?: string | number
  fill?: string
  val?: number | string
  payload?: unknown
  isActive: boolean
  tooltipPosition: Coordinate
  parentViewBox?: ViewBox
  labelViewBox?: ViewBox
}

export interface FunnelComposedData {
  trapezoids: readonly FunnelTrapezoidItem[]
  data: unknown[]
}
