import type { AngleAxisSettings, AxisId, RadiusAxisSettings } from '@/types/axisSettings'

export type { AngleAxisSettings, RadiusAxisSettings } from '@/types/axisSettings'

export type PolarAxisState = {
  radiusAxis: Record<AxisId, RadiusAxisSettings>
  angleAxis: Record<AxisId, AngleAxisSettings>
}
