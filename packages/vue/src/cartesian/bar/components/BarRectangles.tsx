import { barEvents } from '@/events/itemEvents'
import { defineComponent, watch } from 'vue'
import { useChartTooltip } from '@/state/chartContext'
import { useAppSelector } from '@/state/hooks'
import {
  selectActiveTooltipDataKey,
  selectActiveTooltipIndex,
} from '@/state/selectors/tooltipSelectors'
import { selectAxisSettings } from '@/state/selectors/axisSelectors'
import { filterProps, svgAttrs } from '@/utils/VueUtils'
import { getValueByDataKey } from '@/utils/chart'
import { interpolate } from '@/utils'
import { Rectangle, rectanglePath } from '@/shape/Rectangle'
import { type Neighbors, useKeyedTransition } from '@/animation/useKeyedTransition'
import type { BarRectangleItem } from '@/types/bar'
import { useBarContext } from '../hooks/useBar'

/** A bar, its position in the data (which tooltips and cells address) and its category band. */
interface IndexedBar {
  bar: BarRectangleItem
  index: number
  /** The category band along the category axis: start and size in pixels. */
  band?: { start: number, size: number }
  /** Below 1 while the bar fades in or out. */
  opacity?: number
}

export const BarRectangles = defineComponent({
  name: 'BarRectangles',
  inheritAttrs: false,

  setup() {
    const emit = barEvents.use()
    const tooltip = useChartTooltip()
    const activeIndex = useAppSelector(selectActiveTooltipIndex)
    const activeDataKey = useAppSelector(selectActiveTooltipDataKey)
    const { props, data: barData, layout, isAnimating, shapeSlot, activeBarSlot, cellProps, band } = useBarContext()

    // Bars are matched across data changes by their category, so a shifted or extended
    // series slides instead of every bar morphing into its neighbour.
    const categoryAxis = useAppSelector(state => layout.value === 'vertical'
      ? selectAxisSettings(state, 'yAxis', props.yAxisId)
      : selectAxisSettings(state, 'xAxis', props.xAxisId))

    const bandOf = (bar: BarRectangleItem): IndexedBar['band'] => {
      const position = layout.value === 'vertical' ? bar.y : bar.x
      return band.value && position != null ? { start: position - band.value.offset, size: band.value.size } : undefined
    }
    const atBaseline = (bar: BarRectangleItem): BarRectangleItem => layout.value === 'vertical'
      ? { ...bar, x: bar.stackedBarStart, width: 0 }
      : { ...bar, y: bar.stackedBarStart, height: 0 }

    // Entering and leaving bars open or close at the boundary between their neighbouring
    // categories. Every edge then moves linearly on one shared curve between two layouts
    // without overlap, so no bar ever covers another, in any series of a group.
    const seam = ({ previous, next }: Neighbors<IndexedBar>) => {
      const end = previous?.band && previous.band.start + previous.band.size
      const start = next?.band?.start
      return end == null ? start : start == null ? end : (end + start) / 2
    }
    // A series shown or hidden from the legend has no neighbours of its own: its bars open or
    // close at the nearer edge of their band while the other series of the group make room.
    // Stacked series share the whole band, so theirs grow from and sink to the baseline, like
    // the first appearance.
    let shown = false
    const nearerEdge = ({ bar, band }: IndexedBar) => {
      if (!shown || !band || props.stackId != null)
        return undefined
      const [position, size] = layout.value === 'vertical' ? [bar.y ?? 0, bar.height ?? 0] : [bar.x ?? 0, bar.width ?? 0]
      return position + size / 2 < band.start + band.size / 2 ? band.start : band.start + band.size
    }
    // Bars keep their value and are pushed aside: they narrow to nothing at the seam and fade.
    const collapsed = (item: IndexedBar, neighbors: Neighbors<IndexedBar>): IndexedBar => {
      const { bar, index } = item
      const at = seam(neighbors) ?? nearerEdge(item)
      if (at == null)
        return { index, bar: atBaseline(bar) }
      return {
        index,
        bar: layout.value === 'vertical' ? { ...bar, y: at, height: 0 } : { ...bar, x: at, width: 0 },
        band: { start: at, size: 0 },
        opacity: 0,
      }
    }

    const { items, isAnimating: transitioning } = useKeyedTransition<IndexedBar>(
      // A series hidden from the legend lets its bars leave instead of vanishing.
      () => props.hide ? [] : barData.value?.map((bar, index) => ({ bar, index, band: bandOf(bar) })),
      {
        key: ({ bar, index }) => {
          const dataKey = categoryAxis.value?.dataKey
          const category = dataKey == null ? undefined : getValueByDataKey(bar.payload, dataKey)
          return category == null ? index : String(category)
        },
        interpolate: ({ bar: from, band: fromBand, opacity: fromOpacity = 1 }, { bar: to, index, band: toBand, opacity: toOpacity = 1 }, t) => ({
          index,
          opacity: interpolate(fromOpacity, toOpacity, t),
          band: fromBand && toBand && {
            start: interpolate(fromBand.start, toBand.start, t),
            size: interpolate(fromBand.size, toBand.size, t),
          },
          bar: {
            ...to,
            x: interpolate(from.x ?? 0, to.x ?? 0, t),
            y: interpolate(from.y ?? 0, to.y ?? 0, t),
            width: interpolate(from.width ?? 0, to.width ?? 0, t),
            height: interpolate(from.height ?? 0, to.height ?? 0, t),
          },
        }),
        enterFrom: collapsed,
        exitTo: collapsed,
        // Entering and leaving bars move with their neighbours, so they share their timing.
        connected: true,
        isActive: () => props.isAnimationActive !== false,
        transition: () => props.transition,
        onStart: () => emit('animation-start'),
        onEnd: () => emit('animation-end'),
      },
    )
    watch(() => items.value.length > 0, (value) => {
      shown ||= value
    }, { immediate: true })
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
      // Without custom shapes every bar is a plain path: the series attributes are sanitised once
      // per frame instead of once per bar, and no component updates per bar per frame.
      const baseAttrs = shapeSlot || activeBarSlot ? undefined : svgAttrs(baseProps)
      const activeEnabled = props.activeBar !== false || props.activeIndex != null || !!activeBarSlot

      return (
        <g>
          {items.value.map(({ key, value: { bar, index, opacity }, phase }) => {
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
                : baseAttrs
                  ? rectanglePath({ ...baseAttrs, ...(entryFill ? { fill: entryFill } : {}), ...svgAttrs(cellProps.value?.[index]), ...svgAttrs(activeBarProps) }, bar.x!, bar.y!, bar.width!, bar.height!, (activeBarProps as { radius?: number }).radius ?? props.radius)
                  : <Rectangle {...barRectangleProps} />

            return (
              <g
                key={key}
                class="v-charts-layer v-charts-bar-rectangle"
                opacity={opacity != null && opacity < 1 ? opacity : undefined}
                onMouseenter={(event: MouseEvent) => { activate('hover', bar, index); emit('mouseenter', bar, index, event) }}
                onMouseleave={(event: MouseEvent) => { tooltip.mouseLeaveItem(); emit('mouseleave', bar, index, event) }}
                onClick={(event: MouseEvent) => { activate('click', bar, index); emit('click', bar, index, event) }}
              >
                {shape}
              </g>
            )
          })}
        </g>
      )
    }
  },
})
