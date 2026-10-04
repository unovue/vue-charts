import { defineComponent, h, onUnmounted, watch } from 'vue'
import type { ExtractPropTypes, PropType, SlotsType } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { useAppSelector } from '@/state/hooks'
import { useChartPolarAxis } from '@/state/chartContext'
import type { AngleAxisSettings } from '@/state/chartPolarAxis'
import { selectPolarAxisTicks } from '@/state/selectors/polarScaleSelectors'
import { selectPolarViewBox } from '@/state/selectors/polarAxisSelectors'
import { RADIAN, polarToCartesian } from '@/utils/polar'
import type { DataKey } from '@/types'
import type { AxisDomain } from '@/types/axis'
import type { AxisTick } from '@/types/tick'
import Text from '@/components/Text.vue'

const eps = 1e-5
const COS_45 = Math.cos(45 * RADIAN)

function getTickTextAnchor(coordinate: number, orientation: 'inner' | 'outer'): string {
  const cos = Math.cos(-coordinate * RADIAN)
  if (cos > eps)
    return orientation === 'outer' ? 'start' : 'end'
  if (cos < -eps)
    return orientation === 'outer' ? 'end' : 'start'
  return 'middle'
}

function getTickVerticalAnchor(coordinate: number): string {
  const cos = Math.cos(-coordinate * RADIAN)
  const sin = Math.sin(-coordinate * RADIAN)
  if (Math.abs(cos) <= COS_45) {
    return sin > 0 ? 'start' : 'end'
  }
  return 'middle'
}

export interface PolarAngleAxisSlots {
  tick?: (props: import('@/types/tick').AxisTickSlotProps & { cx: number, cy: number }) => import('vue').VNodeChild
}

const PolarAngleAxisViewProps = {
  angleAxisId: { type: [String, Number] as PropType<string | number>, default: 0 },
  dataKey: { type: [String, Number, Function] as PropType<DataKey<any>>, default: undefined },
  tick: { type: Boolean, default: true },
  tickLine: { type: Boolean, default: true },
  tickSize: { type: Number, default: 8 },
  axisLine: { type: Boolean, default: true },
  axisLineType: { type: String as PropType<'polygon' | 'circle'>, default: 'polygon' },
  orientation: { type: String as PropType<'inner' | 'outer'>, default: 'outer' },
  tickFormatter: { type: Function as PropType<(value: any, index: number) => string>, default: undefined },
  ticks: { type: Array as PropType<ReadonlyArray<AxisTick>>, default: undefined },
  stroke: { type: String, default: undefined },
  type: { type: String as PropType<'category' | 'number'>, default: 'category' },
  domain: { type: Array as PropType<AxisDomain>, default: undefined },
  tickCount: { type: Number, default: undefined },
}

const PolarAngleAxisView = defineComponent({
  name: 'PolarAngleAxisView',
  inheritAttrs: true,
  props: {
    item: { type: Object as PropType<ExtractPropTypes<typeof PolarAngleAxisViewProps>>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  slots: Object as SlotsType<{
    tick?: (props: { x: number, y: number, value: any, index: number, textAnchor: string, payload: any, cx: number, cy: number }) => any
  }>,
  setup(view, { slots }) {
    const props = view.item
    const attrs = view.svgAttrs
    const polarViewBox = useAppSelector(state => selectPolarViewBox(state))
    const ticks = useAppSelector(state => selectPolarAxisTicks(state, 'angleAxis', props.angleAxisId, false))

    return () => {
      const viewBox = polarViewBox.value
      const tickItems = ticks.value

      if (viewBox == null || tickItems == null || tickItems.length === 0) {
        return null
      }

      const { cx, cy, outerRadius: radius, startAngle: vbStart, endAngle: vbEnd } = viewBox
      const { orientation, tickSize, axisLine, axisLineType, tickLine, tick, tickFormatter, stroke } = props

      // On a full-circle axis, the last tick overlaps the first (e.g. 360° = 0°). Remove it.
      const isFullCircle = Math.abs((vbEnd ?? 0) - (vbStart ?? 0)) === 360
      const filteredTicks = isFullCircle && tickItems.length > 1
        && Math.abs(tickItems[tickItems.length - 1].coordinate - tickItems[0].coordinate) % 360 === 0
        ? tickItems.slice(0, -1)
        : tickItems

      return (
        <g class="v-charts-polar-angle-axis">
          {/* Axis line */}
          {axisLine && (
            axisLineType === 'circle'
              ? <circle cx={cx} cy={cy} r={radius} fill="none" stroke={stroke} />
              : (
                  <polygon
                    points={filteredTicks.map((t) => {
                      const p = polarToCartesian(cx, cy, radius, t.coordinate)
                      return `${p.x},${p.y}`
                    }).join(' ')}
                    fill="none"
                    stroke={stroke}
                  />
                )
          )}
          {/* Ticks */}
          <g class="v-charts-polar-angle-axis-ticks">
            {filteredTicks.map((entry, i) => {
              const p1 = polarToCartesian(cx, cy, radius, entry.coordinate)
              const p2 = polarToCartesian(cx, cy, radius + (orientation === 'inner' ? -1 : 1) * tickSize, entry.coordinate)
              const textAnchor = getTickTextAnchor(entry.coordinate, orientation)
              const verticalAnchor = getTickVerticalAnchor(entry.coordinate)
              const value = tickFormatter ? tickFormatter(entry.value, i) : entry.value

              return (
                <g key={`tick-${entry.coordinate}`} class="v-charts-polar-angle-axis-tick">
                  {tickLine && (
                    <line
                      class="v-charts-polar-angle-axis-tick-line"
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={stroke}
                      fill="none"
                    />
                  )}
                  {tick && (
                    slots.tick
                      ? slots.tick({ x: p2.x, y: p2.y, value, index: i, textAnchor, payload: entry, cx, cy })
                      : (
                          <Text
                            class="v-charts-polar-angle-axis-tick-value"
                            x={p2.x}
                            y={p2.y}
                            textAnchor={textAnchor}
                            verticalAnchor={verticalAnchor}
                            fill={stroke}
                            value={String(value)}
                          />
                        )
                  )}
                </g>
              )
            })}
          </g>
        </g>
      )
    }
  },
})

const _PolarAngleAxis = defineComponent({
  name: 'PolarAngleAxis',
  props: PolarAngleAxisViewProps,
  slots: Object as SlotsType<{
    tick?: (props: { x: number, y: number, value: any, index: number, textAnchor: string, payload: any, cx: number, cy: number }) => any
  }>,
  setup(props, { attrs, slots }) {
    const { addAngleAxis, removeAngleAxis } = useChartPolarAxis()

    let prevSettings: AngleAxisSettings | null = null
    watch(() => ({
      id: props.angleAxisId,
      type: props.type,
      dataKey: props.dataKey,
      scale: 'auto' as const,
      allowDuplicatedCategory: true,
      allowDataOverflow: false,
      reversed: false,
      includeHidden: false,
      domain: props.domain,
      unit: undefined,
      name: undefined,
      allowDecimals: false,
      tickCount: props.tickCount,
      ticks: props.ticks,
      tick: props.tick,
    }), (settings) => {
      addAngleAxis(settings)
      prevSettings = settings
    }, { immediate: true })

    onUnmounted(() => {
      if (prevSettings) {
        removeAngleAxis(prevSettings)
        prevSettings = null
      }
    })

    const View = useDeferredView(PolarAngleAxisView)
    return () => h(View, { item: props, svgAttrs: attrs }, slots)
  },
})

// Preserve template slot inference in published declarations.
export const PolarAngleAxis: typeof _PolarAngleAxis & { new (): { $slots: PolarAngleAxisSlots } } = _PolarAngleAxis
