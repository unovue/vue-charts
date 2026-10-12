import type { PropType, SVGAttributes } from 'vue'
import type { ChartDataKey } from '@/types/base'
import type { AxisDomain, AxisInterval } from '@/types/axis'
import type { AxisScale } from '@/types/scale'
import type { AxisTick, TickFormatter } from '@/types/tick'
import type { LabelProps } from '@/components/label/types'
import type { VuePropsToType } from '@/types/common'

/** Settings and presentation shared by the public cartesian axes. */
export const AxisVueProps = {
  type: { type: String as PropType<'number' | 'category'> },
  allowDataOverflow: { type: Boolean, default: false },
  allowDecimals: { type: Boolean, default: true },
  allowDuplicatedCategory: { type: Boolean, default: true },
  includeHidden: { type: Boolean, default: false },
  hide: { type: Boolean, default: false },
  mirror: { type: Boolean, default: false },
  reversed: { type: Boolean, default: false },
  scale: { type: [String, Function] as PropType<AxisScale>, default: 'auto' },
  tickCount: { type: Number, default: 5 },
  dataKey: { type: [String, Number, Function] as PropType<ChartDataKey> },
  domain: { type: [Array, Function] as PropType<AxisDomain> },
  axisLine: { type: [Boolean, Object] as PropType<boolean | SVGAttributes>, default: true },
  tickLine: { type: [Boolean, Object] as PropType<boolean | SVGAttributes>, default: true },
  tick: { type: [Boolean, Object] as PropType<boolean | SVGAttributes>, default: true },
  ticks: { type: Array as PropType<ReadonlyArray<AxisTick>> },
  interval: { type: [String, Number] as PropType<AxisInterval>, default: 'preserveEnd' },
  unit: String,
  name: String,
  angle: { type: Number, default: 0 },
  label: { type: [String, Number, Object] as PropType<string | number | LabelProps> },
  stroke: { type: String, default: 'var(--v-charts-axis, #666)' },
  tickSize: { type: Number, default: 6 },
  tickMargin: { type: Number, default: 2 },
  minTickGap: { type: Number, default: 5 },
  tickFormatter: Function as PropType<TickFormatter>,
}

export type AxisProps = VuePropsToType<typeof AxisVueProps>
