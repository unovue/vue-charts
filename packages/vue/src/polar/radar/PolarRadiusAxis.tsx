import { computed, defineComponent, h, provide } from 'vue'
import type { ExtractPropTypes, PropType } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { useAppSelector } from '@/state/hooks'
import { selectPolarAxisTicks, selectPolarViewBox, useChartPolarAxis } from '@/state/chartContext'
import type { RadiusAxisSettings } from '@/state/chartPolarAxis'
import { polarToCartesian } from '@/utils/polar'
import type { AxisDomain } from '@/types/axis'
import type { AxisTick } from '@/types/tick'
import type { DataKey, LayoutType } from '@/types'
import { isCategoricalAxis } from '@/utils'
import { useChartLayout } from '@/context/chartLayoutContext'
import { POLAR_LABEL_VIEW_BOX_KEY } from '@/context/polarLabelViewBoxContext'
import Text from '@/components/Text.vue'

/**
 * Resolve 'auto' type based on chart layout, matching Recharts behavior.
 * In a radial layout, radiusAxis is categorical; in centric, it's numerical.
 */
function resolveAxisType(type: 'number' | 'category' | 'auto', layout: LayoutType, axisType: 'radiusAxis' | 'angleAxis'): 'number' | 'category' {
  if (type !== 'auto') {
    return type
  }
  return isCategoricalAxis(layout, axisType) ? 'category' : 'number'
}

const PolarRadiusAxisViewProps = {
  radiusAxisId: { type: [String, Number] as PropType<string | number>, default: 0 },
  dataKey: { type: [String, Number, Function] as PropType<DataKey<any>>, default: undefined },
  angle: { type: Number, default: 0 },
  tick: { type: Boolean, default: true },
  axisLine: { type: Boolean, default: true },
  orientation: { type: String as PropType<'left' | 'right' | 'middle'>, default: 'right' },
  tickFormatter: { type: Function as PropType<(value: any, index: number) => string>, default: undefined },
  ticks: { type: Array as PropType<ReadonlyArray<AxisTick>>, default: undefined },
  tickCount: { type: Number, default: 5 },
  domain: { type: Array as PropType<AxisDomain>, default: undefined },
  type: { type: String as PropType<'number' | 'category' | 'auto'>, default: 'auto' },
  stroke: { type: String, default: undefined },
  allowDecimals: { type: Boolean, default: false },
}

const PolarRadiusAxisView = defineComponent({
  name: 'PolarRadiusAxisView',
  inheritAttrs: true,
  props: {
    item: { type: Object as PropType<ExtractPropTypes<typeof PolarRadiusAxisViewProps>>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  setup(view, { slots }) {
    const props = view.item
    const attrs = view.svgAttrs
    const polarViewBox = useAppSelector(state => selectPolarViewBox(state))
    const ticks = useAppSelector(state => selectPolarAxisTicks(state, 'radiusAxis', props.radiusAxisId))

    // Provide polar viewBox for child Label components
    provide(POLAR_LABEL_VIEW_BOX_KEY, computed(() => polarViewBox.value))

    return () => {
      const viewBox = polarViewBox.value
      const tickItems = ticks.value
      const hasChildren = !!slots.default
      const showTicks = props.tick && tickItems != null && tickItems.length > 0

      // Always render if there are slot children (e.g. Label), even when tick/axisLine are disabled
      if (viewBox == null || (!showTicks && !props.axisLine && !hasChildren)) {
        return null
      }

      const { cx, cy } = viewBox
      const { angle, orientation, axisLine, tickFormatter, stroke } = props

      const textAnchor = orientation === 'left' ? 'end' : orientation === 'right' ? 'start' : 'middle'

      return (
        <g class="v-charts-polar-radius-axis">
          {axisLine && showTicks && (
            (() => {
              const coords = tickItems!.map(t => t.coordinate)
              const minR = Math.min(...coords)
              const maxR = Math.max(...coords)
              const p0 = polarToCartesian(cx, cy, minR, angle)
              const p1 = polarToCartesian(cx, cy, maxR, angle)
              return (
                <line
                  class="v-charts-polar-radius-axis-line"
                  x1={p0.x}
                  y1={p0.y}
                  x2={p1.x}
                  y2={p1.y}
                  stroke={stroke ?? 'var(--v-charts-grid, #ccc)'}
                  fill="none"
                />
              )
            })()
          )}
          {showTicks && (
            <g class="v-charts-polar-radius-axis-ticks">
              {tickItems!.map((entry, i) => {
                const coord = polarToCartesian(cx, cy, entry.coordinate, angle)
                const value = tickFormatter ? tickFormatter(entry.value, i) : entry.value
                return slots.tick
                  ? slots.tick({ x: coord.x, y: coord.y, value, index: i, payload: entry, textAnchor })
                  : (
                      <Text
                        key={`tick-${entry.coordinate}`}
                        class="v-charts-polar-radius-axis-tick-value"
                        x={coord.x}
                        y={coord.y}
                        textAnchor={textAnchor}
                        verticalAnchor="middle"
                        fill={stroke ?? 'var(--v-charts-text, #ccc)'}
                        angle={90 - angle}
                        value={String(value)}
                      />
                    )
              })}
            </g>
          )}
          {slots.default?.()}
        </g>
      )
    }
  },
})

const _PolarRadiusAxis = defineComponent({
  name: 'PolarRadiusAxis',
  props: PolarRadiusAxisViewProps,
  setup(props, { attrs, slots }) {
    const { radiusAxis } = useChartPolarAxis()
    const layout = useChartLayout()

    const settings = computed<RadiusAxisSettings>(() => ({
      id: props.radiusAxisId,
      type: resolveAxisType(props.type, layout.value, 'radiusAxis'),
      dataKey: props.dataKey,
      scale: 'auto' as const,
      allowDuplicatedCategory: true,
      allowDataOverflow: props.domain != null,
      reversed: false,
      includeHidden: false,
      // Recharts v2 defaults domain=[0,'auto'], which creates extra band entries
      // via parseSpecifiedDomain, making bars thinner. Preserve that behavior.
      domain: props.domain ?? [0, 'auto'],
      unit: undefined,
      name: undefined,
      allowDecimals: props.allowDecimals,
      tickCount: props.tickCount,
      ticks: props.ticks,
      tick: props.tick,
    }))
    radiusAxis.register(settings)

    const View = useDeferredView(PolarRadiusAxisView)
    return () => h(View, { item: props, svgAttrs: attrs }, slots)
  },
})

// Preserve template slot inference in published declarations.
export const PolarRadiusAxis: typeof _PolarRadiusAxis & { new (): { $slots: import('@/types/tick').AxisSlots } } = _PolarRadiusAxis
