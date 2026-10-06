import type { AxisId, BaseCartesianAxis, TicksSettings } from './chartCartesianAxis'

export type RadiusAxisSettings = BaseCartesianAxis & TicksSettings

export type AngleAxisSettings = BaseCartesianAxis & TicksSettings

export type PolarAxisState = {
  radiusAxis: Record<AxisId, RadiusAxisSettings>
  angleAxis: Record<AxisId, AngleAxisSettings>
}
