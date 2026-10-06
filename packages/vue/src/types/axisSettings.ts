import type { SVGAttributes } from 'vue'
import type {
  AxisId,
  BaseCartesianAxis,
  CartesianAxisSettings as PublicCartesianAxisSettings,
  XAxisSettings as PublicXAxisSettings,
  YAxisSettings as PublicYAxisSettings,
  ZAxisSettings,
} from './axis'
import type { TicksSettings as PublicTicksSettings } from './tick'

export type {
  AxisId,
  BaseCartesianAxis,
  XAxisOrientation,
  YAxisOrientation,
  XAxisPadding,
  YAxisPadding,
  ZAxisSettings,
} from './axis'

// Registrations contain resolved defaults; tick render functions stay in slots.
export type TicksSettings = Omit<PublicTicksSettings, 'tick' | 'tickCount'> & {
  tickCount: number | undefined
  tick: SVGAttributes | boolean
}

export type CartesianAxisSettings =
  Omit<PublicCartesianAxisSettings, 'tick' | 'tickCount'> & TicksSettings

export type XAxisSettings = CartesianAxisSettings &
  Pick<PublicXAxisSettings, 'padding' | 'height' | 'orientation'>

export type YAxisSettings = CartesianAxisSettings &
  Pick<PublicYAxisSettings, 'padding' | 'width' | 'orientation'>

export type CartesianAxisState = {
  xAxis: Record<AxisId, XAxisSettings>
  yAxis: Record<AxisId, YAxisSettings>
  zAxis: Record<AxisId, ZAxisSettings>
}

export type AngleAxisSettings = BaseCartesianAxis & TicksSettings
export type RadiusAxisSettings = BaseCartesianAxis & TicksSettings
export type AxisWithTicksSettings = XAxisSettings | YAxisSettings | AngleAxisSettings | RadiusAxisSettings
export type BaseAxisWithScale = BaseCartesianAxis & { scale: import('./scale').RechartsScale }
export type ZAxisWithScale = ZAxisSettings & { scale: import('./scale').RechartsScale }
