import type { ChartDataKey } from '@/types/base'
import type { RechartsScale } from '@/types/scale'

export type RadiusAxisForRadar = { scale: RechartsScale }

export type AngleAxisForRadar = {
  scale: RechartsScale
  type: 'number' | 'category'
  dataKey: ChartDataKey | undefined
  cx: number
  cy: number
}

export interface RadarPoint {
  x: number
  y: number
  cx?: number
  cy?: number
  angle?: number
  radius?: number
  value?: number
  payload?: unknown
  name?: string
}
export type RadarComposedData = {
  points: RadarPoint[]
  baseLinePoints: RadarPoint[]
  isRange: boolean
}
