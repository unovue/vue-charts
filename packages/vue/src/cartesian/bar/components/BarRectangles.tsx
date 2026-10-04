import { barEvents } from '@/events/itemEvents'
import { defineComponent, watch } from 'vue'
import { useChartTooltip } from '@/state/chartContext'
import { useAppSelector } from '@/state/hooks'
import {
  selectActiveTooltipDataKey,
  selectActiveTooltipIndex,
} from '@/state/selectors/tooltipSelectors'
import { selectAxisSettings } from '@/state/selectors/axisSelectors'
import { filterProps } from '@/utils/VueUtils'
import { getValueByDataKey } from '@/utils/chart'
import { interpolate } from '@/utils'
import { Layer } from '@/container/Layer'
import { Rectangle } from '@/shape/Rectangle'
import { type Neighbors, useKeyedTransition } from '@/animation/useKeyedTransition'
import type { BarRectangleItem } from '@/types/bar'
import { useBarContext } from '../hooks/useBar'

/** A bar plus its position in the data, which tooltips and cells address. */
interface IndexedBar {
  bar: BarRectangleItem
  index: number
}

export const BarRectangles = defineComponent({
  name: 'BarRectangles',
  inheritAttrs: false,

  setup() {
    const emit = barEvents.use()
    const tooltip = useChartTooltip()
    const activeIndex = useAppSelector(selectActiveTooltipIndex)
    const activeDataKey = useAppSelector(selectActiveTooltipDataKey)
    const { props, data: barData, layout, isAnimating, shapeSlot, activeBarSlot, cellProps } = useBarContext()

    // Bars are matched across data changes by their category, so a shifted or extended
    // series slides instead of every bar morphing into its neighbour.
    const categoryAxis = useAppSelector(state => layout.value === 'vertical'
      ? selectAxisSettings(state, 'yAxis', props.yAxisId)
      : selectAxisSettings(state, 'xAxis', props.xAxisId))

    const atBaseline = (bar: BarRectangleItem): BarRectangleItem => layout.value === 'vertical'
      ? { ...bar, x: bar.stackedBarStart, width: 0 }
      : { ...bar, y: bar.stackedBarStart, height: 0 }

    // How far the neighbouring bars travel along the category axis. Entering and leaving bars
    // travel with them, so a shifted window slides in and out instead of growing in place.
    const travel = ({ previousMove, nextMove }: Neighbors<IndexedBar>) => {
      const axis = layout.value === 'vertical' ? 'y' : 'x'
      const moves = [previousMove, nextMove].filter(move => move != null)
      if (!moves.length)
        return 0
      return moves.reduce((sum, { from, to }) => sum + (to.bar[axis] ?? 0) - (from.bar[axis] ?? 0), 0) / moves.length
    }
    const shifted = (bar: BarRectangleItem, by: number): BarRectangleItem => layout.value === 'vertical'
      ? { ...bar, y: (bar.y ?? 0) + by }
      : { ...bar, x: (bar.x ?? 0) + by }

    const { items, isAnimating: transitioning } = useKeyedTransition<IndexedBar>(
      // A series hidden from the legend lets its bars leave instead of vanishing.
      () => props.hide ? [] : barData.value?.map((bar, index) => ({ bar, index })),
      {
        key: ({ bar, index }) => {
          const dataKey = categoryAxis.value?.dataKey
          const category = dataKey == null ? undefined : getValueByDataKey(bar.payload, dataKey)
          return category == null ? index : String(category)
        },
        interpolate: ({ bar: from }, { bar: to, index }, t) => ({
          index,
          bar: {
            ...to,
            x: interpolate(from.x ?? 0, to.x ?? 0, t),
            y: interpolate(from.y ?? 0, to.y ?? 0, t),
            width: interpolate(from.width ?? 0, to.width ?? 0, t),
            height: interpolate(from.height ?? 0, to.height ?? 0, t),
          },
        }),
        enterFrom: ({ bar, index }, neighbors) => ({ index, bar: shifted(atBaseline(bar), -travel(neighbors)) }),
        exitTo: ({ bar, index }, neighbors) => ({ index, bar: shifted(atBaseline(bar), travel(neighbors)) }),
        // Leaving bars travel with their neighbours, so they share their timing.
        connected: true,
        isActive: () => props.isAnimationActive !== false,
        transition: () => props.transition,
        onStart: () => emit('animation-start'),
        onEnd: () => emit('animation-end'),
      },
    )
    watch(transitioning, (value) => {
      isAnimating.value = value
    }, { immediate: true })

    const activate = (kind: 'hover' | 'click', bar: BarRectangleItem, index: number) => {
      const payload = {
        activeDataKey: props.dataKey,
        activeIndex: String(index),
        activeCoordinate: { x: bar.tooltipPosition.x, y: bar.tooltipPosition.y },
      }
      if (kind === 'hover')
        tooltip.setActiveMouseOverItemIndex(payload)
      else
        tooltip.setActiveClickItemIndex(payload)
    }

    return () => {
      const baseProps = filterProps(props, false)
      const activeEnabled = props.activeBar !== false || props.activeIndex != null || !!activeBarSlot

      return (
        <g>
          {items.value.map(({ key, value: { bar, index }, phase }) => {
            // The activeIndex prop takes priority over tooltip interaction.
            const isActive = phase !== 'exit' && activeEnabled && (props.activeIndex != null
              ? index === props.activeIndex
              : String(index) === activeIndex.value && (activeDataKey.value == null || props.dataKey === activeDataKey.value))
            const activeBarProps = isActive && typeof props.activeBar === 'object' ? props.activeBar : {}
            // A per-row `fill` in the data and Cell props apply without a #shape slot, as in Recharts.
            const entryFill = bar.payload?.fill
            const barRectangleProps = {
              ...baseProps,
              ...(entryFill ? { fill: entryFill } : {}),
              ...bar,
              ...(cellProps.value?.[index] ?? {}),
              ...activeBarProps,
              isActive,
              index,
              dataKey: props.dataKey,
            }

            const shape = isActive && activeBarSlot
              ? activeBarSlot(barRectangleProps)
              : shapeSlot
                ? shapeSlot(barRectangleProps)
                : <Rectangle {...barRectangleProps} />

            return (
              <Layer
                key={key}
                class="v-charts-bar-rectangle"
                onMouseenter={(event: MouseEvent) => { activate('hover', bar, index); emit('mouseenter', bar, index, event) }}
                onMouseleave={(event: MouseEvent) => { tooltip.mouseLeaveItem(); emit('mouseleave', bar, index, event) }}
                onClick={(event: MouseEvent) => { activate('click', bar, index); emit('click', bar, index, event) }}
              >
                {shape}
              </Layer>
            )
          })}
        </g>
      )
    }
  },
})
