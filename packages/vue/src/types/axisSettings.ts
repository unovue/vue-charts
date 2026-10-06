import type { SVGAttributes } from 'vue'
import type {
  BaseCartesianAxis,
  CartesianAxisSettings as PublicCartesianAxisSettings,
  XAxisSettings as PublicXAxisSettings,
  YAxisSettings as PublicYAxisSettings,
  ZAxisSettings,
} from './axis'
import type { TicksSettings as PublicTicksSettings } from './tick'

export type { AxisId, ZAxisSettings } from './axis'

// Registrations contain resolved defaults; tick render functions stay in slots.
export type TicksSettings = Omit<PublicTicksSettings, 'tick' | 'tickCount'> & {
  tickCount: number | undefined
  tick: SVGAttributes | boolean
}

type CartesianAxisSettings =
  Omit<PublicCartesianAxisSettings, 'tick' | 'tickCount'> & TicksSettings

export type XAxisSettings = CartesianAxisSettings &
  Pick<PublicXAxisSettings, 'padding' | 'height' | 'orientation'>

export type YAxisSettings = CartesianAxisSettings &
  Pick<PublicYAxisSettings, 'padding' | 'width' | 'orientation'>

export type AngleAxisSettings = BaseCartesianAxis & TicksSettings
export type RadiusAxisSettings = BaseCartesianAxis & TicksSettings
export type AxisWithTicksSettings = XAxisSettings | YAxisSettings | AngleAxisSettings | RadiusAxisSettings
export type BaseAxisWithScale = Omit<BaseCartesianAxis, 'scale'> & { scale: import('./scale').RechartsScale }
export type ZAxisWithScale = ZAxisSettings & { scale: import('./scale').RechartsScale }
