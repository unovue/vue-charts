import type { ActivePointsSlots } from './type'
import type { ChartDataKey } from '@/types/base'
import { useChart } from '@/model/chart'
import { computed, defineComponent } from 'vue'
import type { PropType, SlotsType } from 'vue'
import type { Point } from '@/types/shape'
import { isNullish } from '@/utils'
import { Dot } from '@/shape/Dot'
import { Layer } from '@/container/Layer'
import { ActiveDot } from '@/animation/ActiveDot'

export interface PointType {
  readonly x: number
  readonly y: number
  readonly value?: number
  readonly payload?: unknown
}

const ActivePointsVueProps = {
  isAnimationActive: { type: Boolean, default: true },
  points: { type: Array as PropType<ReadonlyArray<Point>>, required: true },
  mainColor: { type: String, required: true },
  itemDataKey: { type: [String, Number, Function] as PropType<ChartDataKey>, required: true },
  activeDot: { type: [Object, Boolean, Function] as PropType<boolean | object | Function | undefined>, required: true },
}

export const ActivePoints = defineComponent({
  name: 'ActivePoints',
  props: ActivePointsVueProps,
  slots: Object as SlotsType<ActivePointsSlots>,
  setup(props, { slots }) {
    const chart = useChart()
    const activeTooltipIndex = computed(() => chart.tooltip.source.active.value ? chart.tooltip.target.value?.index ?? null : null)

    return () => {
      const { points } = props
      if (!points?.length || isNullish(activeTooltipIndex.value))
        return null

      const activePoint = points[activeTooltipIndex.value ?? -1]
      if (isNullish(activePoint)) {
        return null
      }

      return renderActivePoint({
        point: activePoint!,
        childIndex: activeTooltipIndex.value ?? -1,
        mainColor: props.mainColor!,
        dataKey: props.itemDataKey!,
        activeDot: props.activeDot,
        isAnimationActive: props.isAnimationActive,
        slots,
      })
    }
  },
})

function renderActivePoint({
  point,
  childIndex,
  mainColor,
  activeDot,
  isAnimationActive,
  dataKey,
  slots,
}: {
  point: PointType
  activeDot: boolean | object | Function | undefined
  isAnimationActive: boolean
  childIndex: number
  dataKey: ChartDataKey
  mainColor: string
  slots: ActivePointsSlots
}) {
  if (activeDot === false) {
    return null
  }
  const dotProps = {
    'index': childIndex,
    dataKey,
    'cx': point.x,
    'cy': point.y,
    'r': 4,
    'fill': mainColor,
    'stroke-width': 2,
    'stroke': 'var(--v-charts-background, #fff)',
    'payload': point.payload,
    'value': point.value,
    ...(typeof activeDot === 'object' ? activeDot : {}),
  }

  let dot
  if (slots.activeDot) {
    dot = slots.activeDot(dotProps)
  }
  else {
    dot = <Dot {...dotProps} />
  }

  return (
    <Layer class="v-charts-active-dot">
      <ActiveDot isAnimationActive={isAnimationActive}>{dot}</ActiveDot>
    </Layer>
  )
}
