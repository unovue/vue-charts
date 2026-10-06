import { parseTooltipIndex } from '@/core/tooltip'
import { defineComponent } from 'vue'
import type { PropType, SlotsType, VNode } from 'vue'
import type { DataKey, VuePropsToType } from '@/types'
import { useAppSelector } from '@/state/hooks'
import { selectActiveTooltipIndex } from '@/state/chartContext'
import type { LinePointItem } from './type'
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
  isAnimationActive: { type: Boolean, default: true },
  points: { type: Array as PropType<ReadonlyArray<Point>>, required: true },
  mainColor: { type: String, required: true },
  itemDataKey: { type: [String, Number, Function] as PropType<DataKey<any>>, required: true },
  activeDot: { type: [Object, Boolean, Function] as PropType<any>, required: true },
}

export type ActivePointsProps = VuePropsToType<typeof ActivePointsVueProps>

export type ActivePointSlotProps = {
  'index': number
  'dataKey': DataKey<unknown>
  'cx': number
  'cy': number
  'r': number
  'fill': string
  'stroke-width': number
  'stroke': string
  'payload': LinePointItem['payload']
  'value'?: LinePointItem['value']
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

      const activePoint = points[parseTooltipIndex(activeTooltipIndex.value) ?? -1]
      if (isNullish(activePoint)) {
        return null
      }

      return renderActivePoint({
        point: activePoint!,
        childIndex: parseTooltipIndex(activeTooltipIndex.value) ?? -1,
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
  activeDot: any
  isAnimationActive: boolean
  childIndex: number
  dataKey: DataKey<any>
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
