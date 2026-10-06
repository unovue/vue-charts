import type { DataKey } from '@/types'
import type { RechartsScale } from '@/types/scale'

export type RadiusAxisForRadar = { scale: RechartsScale }

export type AngleAxisForRadar = {
  scale: RechartsScale
  type: 'number' | 'category'
  dataKey: DataKey<any> | undefined
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
  payload?: any
  name?: string
}
export type RadarComposedData = {
  points: RadarPoint[]
  baseLinePoints: RadarPoint[]
  isRange: boolean
}
