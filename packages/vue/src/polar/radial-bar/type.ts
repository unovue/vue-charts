import type { PropType } from 'vue'
import type { AnimationOptions } from 'motion-v'
import type { DataKey, VuePropsToType, WithSVGProps } from '@/types'
import type { LegendType } from '@/types/legend'
import type { TooltipType } from '@/types/tooltip'
import type { StackId } from '@/types/tick'

export const RadialBarVueProps = {
  dataKey: { type: [String, Number, Function] as PropType<DataKey<any>>, required: true as const },
  name: { type: String, default: undefined },
  angleAxisId: { type: [String, Number] as PropType<string | number>, default: 0 },
  radiusAxisId: { type: [String, Number] as PropType<string | number>, default: 0 },
  fill: { type: String, default: undefined },
  stroke: { type: String, default: undefined },
  fillOpacity: { type: Number, default: undefined },
  strokeWidth: { type: Number, default: undefined },
  strokeDasharray: { type: String, default: undefined },
  hide: { type: Boolean, default: false },
  legendType: { type: String as PropType<LegendType>, default: 'rect' },
  tooltipType: { type: String as PropType<TooltipType>, default: undefined },
  background: { type: [Boolean, Object] as PropType<boolean | Record<string, any>>, default: false },
  label: { type: [Boolean, Object] as PropType<boolean | Record<string, any>>, default: false },
  isAnimationActive: { type: Boolean, default: true },
  transition: {
    type: Object as PropType<AnimationOptions>,
    default: () => ({ duration: 0.4, ease: 'easeOut' }),
  },
  minPointSize: { type: Number, default: 0 },
  maxBarSize: { type: Number, default: undefined },
  barSize: { type: [Number, String] as PropType<number | string>, default: undefined },
  stackId: { type: [String, Number] as PropType<StackId>, default: undefined },
  cornerRadius: { type: [Number, String] as PropType<number | string>, default: 0 },
  forceCornerRadius: { type: Boolean, default: false },
  cornerIsExternal: { type: Boolean, default: false },
}

export type RadialBarPropsWithSVG = WithSVGProps<VuePropsToType<typeof RadialBarVueProps>>
