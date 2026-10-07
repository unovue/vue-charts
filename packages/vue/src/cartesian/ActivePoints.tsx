import type { ChartDataKey } from '@/types/base'
import { useChart } from '@/model/chart'
import { computed, defineComponent } from 'vue'
import type { PropType, SlotsType, VNodeChild } from 'vue'
import type { Point } from '@/shape/Curve'
import { Dot } from '@/shape/Dot'
import { Layer } from '@/container/Layer'
import { ActiveDot } from '@/animation/ActiveDot'

export interface ActivePointSlotProps {
  'index': number
  'dataKey': ChartDataKey
  'cx': number
  'cy': number
  'r': number
  'fill': string | undefined
  'stroke-width': number
  'stroke': string
  'payload': unknown
  'value'?: number | number[]
}

type ActivePoint = Point & { readonly value?: number | number[] }

export interface ActivePointsSlots {
  activeDot?: (props: ActivePointSlotProps) => VNodeChild
}

/** The highlighted point of Area, Line and Radar at the active tooltip index. */
export const ActivePoints = defineComponent({
  name: 'ActivePoints',
  props: {
    isAnimationActive: { type: Boolean, default: true },
    points: { type: Array as PropType<ReadonlyArray<ActivePoint>>, required: true },
    /** The series main colour (see core/color mainColor). */
    mainColor: { type: String, default: undefined },
    itemDataKey: { type: [String, Number, Function] as PropType<ChartDataKey>, required: true },
    activeDot: { type: [Object, Boolean, Function] as PropType<boolean | object | Function | undefined>, required: true },
  },
  slots: Object as SlotsType<ActivePointsSlots>,
  setup(props, { slots }) {
    const chart = useChart()
    const activeTooltipIndex = computed(() => chart.tooltip.source.active.value ? chart.tooltip.target.value?.index ?? null : null)

    return () => {
      const index = activeTooltipIndex.value
      const point = index == null ? undefined : props.points[index]
      if (index == null || point == null || props.activeDot === false)
        return null
      const dotProps: ActivePointSlotProps = {
        index,
        'dataKey': props.itemDataKey,
        'cx': point.x,
        'cy': point.y,
        'r': 4,
        'fill': props.mainColor,
        'stroke-width': 2,
        'stroke': 'var(--v-charts-background, #fff)',
        'payload': point.payload,
        'value': point.value,
        ...(typeof props.activeDot === 'object' ? props.activeDot : {}),
      }
      return (
        <Layer class="v-charts-active-dot">
          <ActiveDot isAnimationActive={props.isAnimationActive}>
            {slots.activeDot ? slots.activeDot(dotProps) : <Dot {...dotProps} />}
          </ActiveDot>
        </Layer>
      )
    }
  },
})
