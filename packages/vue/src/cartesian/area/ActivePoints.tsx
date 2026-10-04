import { defineComponent } from 'vue'
import type { PropType, SlotsType, VNode } from 'vue'
import type { DataKey, VuePropsToType } from '@/types'
import { useAppSelector } from '@/state/hooks'
import { selectActiveTooltipIndex } from '@/state/selectors/tooltipSelectors'
import type { Point } from '@/shape/Curve'
import { isNullish } from '@/utils'
import { Dot } from '@/shape/Dot'
import { Layer } from '@/container/Layer'
import { ActiveDot } from '@/animation/ActiveDot'

export interface PointType {
  readonly x: number
  readonly y: number
  readonly value?: any
  readonly payload?: any
}

const ActivePointsVueProps = {
  points: { type: Array as PropType<ReadonlyArray<Point>>, required: true },
  mainColor: { type: String, required: true },
  itemDataKey: { type: [String, Number, Function] as PropType<DataKey<any>>, required: true },
  activeDot: { type: [Object, Boolean, Function] as PropType<any>, required: true },
}

export type ActivePointsProps = VuePropsToType<typeof ActivePointsVueProps>

export type ActivePointSlotProps = ActivePointsProps & {
  'cx': number
  'cy': number
  'r': 4
  'fill': string
  'stroke-width': number
  'stroke': string
  'payload': any
  'value': PointType
}

export type ActivePointsSlots = {
  activeDot?: (props: ActivePointSlotProps) => VNode
}

export const ActivePoints = defineComponent({
  name: 'ActivePoints',
  props: ActivePointsVueProps,
  slots: Object as SlotsType<ActivePointsSlots>,
  setup(props, { slots }) {
    const activeTooltipIndex = useAppSelector(selectActiveTooltipIndex)

    return () => {
      const { points } = props
      if (!points?.length || isNullish(activeTooltipIndex.value))
        return null

      const activePoint: PointType | undefined = points[Number(activeTooltipIndex.value)]
      if (isNullish(activePoint)) {
        return null
      }

      return renderActivePoint({
        point: activePoint!,
        childIndex: Number(activeTooltipIndex.value),
        mainColor: props.mainColor!,
        dataKey: props.itemDataKey!,
        activeDot: props.activeDot,
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
  dataKey,
  slots,
}: {
  point: PointType
  activeDot: any
  childIndex: number
  dataKey: DataKey<any>
  /**
   * Different graphical elements have different opinion on what is their main color.
   * Sometimes stroke, sometimes fill, sometimes combination.
   */
  mainColor: string
  slots: ActivePointsSlots
}) {
  if (activeDot === false) {
    return null
  }
  const dotProps: any = {
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
      <ActiveDot>{dot}</ActiveDot>
    </Layer>
  )
}
