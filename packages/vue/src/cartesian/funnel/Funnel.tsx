import { seriesColor } from '@/utils/theme'
import type { ComputedRef, ExtractPropTypes, PropType, SVGAttributes, ShallowRef, SlotsType, VNode, VNodeChild } from 'vue'
import { useSeriesProps } from '@/hooks/useSeriesProps'
import { funnelEvents } from '@/events/itemEvents'
import { computed, defineComponent, h, shallowRef } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { useTrackedData } from '@/hooks/useTrackedData'
import { useChart } from '@/model/chart'
import { Layer } from '@/container/Layer'
import { Trapezoid } from '@/shape/Trapezoid'
import { getValueByDataKey } from '@/utils/chart'
import { type Neighbors, useKeyedTransition } from '@/animation/useKeyedTransition'
import { labelOpacity } from '@/animation/ridingLabels'
import { type ResolvedFunnelSettings, funnelTrapezoids } from '@/core/funnel'
import { provideCartesianLabelListData } from '@/context/cartesianLabelListContext'
import { assignCells, extractCellProps, filterOutCells } from '@/utils/cell'
import type { FunnelTrapezoidItem } from './type'
import { FunnelVueProps } from './type'

export interface FunnelSlots {
  shape?: (props: FunnelTrapezoidItem) => VNodeChild
  default?: () => VNode[]
}

const FunnelView = defineComponent({
  name: 'FunnelView',
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<ExtractPropTypes<typeof FunnelVueProps>>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
    data: { type: Object as PropType<ShallowRef<unknown[] | undefined>>, required: true },
    trapezoids: { type: Object as PropType<ComputedRef<readonly FunnelTrapezoidItem[]>>, required: true },
    cellPropsRef: { type: Object as PropType<ShallowRef<ReturnType<typeof extractCellProps>>>, required: true },
  },
  slots: Object as SlotsType<{
    shape?: (props: FunnelTrapezoidItem) => VNodeChild
    default?: () => VNode[]
  }>,
  setup(view, { slots }) {
    const emit = funnelEvents.use()
    const props = view.item
    const attrs = view.svgAttrs
    const data = view.data
    const trapezoids = view.trapezoids
    const cellPropsRef = view.cellPropsRef
    const tooltip = useChart().tooltip
    // A trapezoid enters from and leaves into the seam between its neighbours, so the stack
    // stays closed while it opens or shrinks.
    type Trap = (typeof trapezoids.value)[number] & { index: number }
    const seam = (trap: Trap, { previous, next }: Neighbors<Trap>): Trap => {
      if (next)
        return { ...trap, x: next.x, y: next.y, upperWidth: next.upperWidth, lowerWidth: next.upperWidth, height: 0 }
      if (previous) {
        const x = previous.x + (previous.upperWidth - previous.lowerWidth) / 2
        return { ...trap, x, y: previous.y + previous.height, upperWidth: previous.lowerWidth, lowerWidth: previous.lowerWidth, height: 0 }
      }
      return { ...trap, height: 0 }
    }
    const { items, isAnimating } = useKeyedTransition(() => trapezoids.value.map((trap, index) => ({ ...trap, index })), {
      key: (trap, index) => getValueByDataKey(trap.payload, props.nameKey, index),
      interpolate: (from, to, t) => ({ ...to, x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, upperWidth: from.upperWidth + (to.upperWidth - from.upperWidth) * t, lowerWidth: from.lowerWidth + (to.lowerWidth - from.lowerWidth) * t, height: from.height + (to.height - from.height) * t }),
      enterFrom: (to, neighbors) => seam(to, neighbors),
      exitTo: (from, neighbors) => seam(from, neighbors),
      connected: true,
      isActive: () => props.isAnimationActive !== false,
      transition: () => props.transition,
      onStart: () => emit('animation-start'),
      onEnd: () => emit('animation-end'),
    })

    const tooltipConfiguration = computed(() => ({
      dataDefinedOnItem: data.value ?? [],
      positions: trapezoids.value.map(t => t.tooltipPosition),
      settings: {
        dataKey: props.dataKey,
        nameKey: props.nameKey,
        name: String(props.dataKey ?? ''),
        hide: props.hide,
        type: props.tooltipType,
        color: props.fill,
        fill: props.fill,
        stroke: props.stroke,
        unit: '',
      },
    }))
    useChart().tooltip.entries.register(tooltipConfiguration)

    // LabelList children ride along with the trapezoids as drawn, show the new values at once
    // and fade with trapezoids that enter or leave.
    provideCartesianLabelListData(computed(() => {
      if (items.value.length === 0)
        return undefined
      return items.value.map((item) => {
        const trap = item.value
        const opacity = labelOpacity(item)
        return {
          x: trap.x,
          y: trap.y,
          width: Math.max(trap.upperWidth, trap.lowerWidth),
          height: trap.height,
          value: trap.value ?? trap.val ?? '',
          payload: trap.payload,
          dataKey: props.dataKey,
          inactive: props.hide,
          parentViewBox: trap.parentViewBox,
          fill: trap.fill ?? props.fill ?? seriesColor(trap.index),
          key: item.key,
          ...(opacity != null ? { opacity } : {}),
        }
      })
    }))

    function handleTrapezoidEnter(trap: FunnelTrapezoidItem, index: number) {
      tooltip.setActiveMouseOverItemIndex({
        activeIndex: String(index),
        activeDataKey: props.dataKey,
        activeCoordinate: trap.tooltipPosition,
      })
    }

    function handleTrapezoidLeave() {
      tooltip.mouseLeaveItem()
    }

    return () => {
      if (props.hide) {
        return null
      }

      const trapList = items.value
      if (trapList.length === 0) {
        return null
      }

      // Extract Cell props and non-Cell children (e.g. LabelList) from default slot
      const defaultContent = slots.default?.() ?? []
      const cells = extractCellProps(defaultContent)
      assignCells(cellPropsRef, cells)
      const nonCellContent = cells.length > 0 ? filterOutCells(defaultContent) : defaultContent
      const stroke = (attrs.stroke as string) ?? props.stroke

      return (
        <Layer data-slot="series" class={['v-charts-funnel', props.class]}>
          {items.value.map(({ key, value: trap }) => {
            const cellProps = cells[trap.index] ?? {}
            const trapFill = cellProps.fill ?? getValueByDataKey(trap.payload, 'fill') ?? props.fill ?? seriesColor(trap.index)
            const trapStroke = cellProps.stroke ?? stroke

            const trapezoidProps = {
              ...trap,
              isActive: tooltip.keyboardInteraction.value.active
                && tooltip.keyboardInteraction.value.configuration === tooltipConfiguration.value
                && tooltip.keyboardInteraction.value.index === String(trap.index),
              fill: trapFill,
              stroke: trapStroke,
              animationProgress: isAnimating.value ? 0 : 1,
            }

            const content = slots.shape
              ? slots.shape(trapezoidProps)
              : (
                  <Trapezoid
                    {...attrs}
                    x={trapezoidProps.x}
                    y={trapezoidProps.y}
                    upperWidth={trapezoidProps.upperWidth}
                    lowerWidth={trapezoidProps.lowerWidth}
                    height={trapezoidProps.height}
                    fill={trapFill}
                    stroke={trapezoidProps.isActive ? 'var(--v-charts-focus, Highlight)' : trapStroke}
                    stroke-width={trapezoidProps.isActive ? 2 : undefined}
                  />
                )

            return (
              <g
                key={key}
                onMouseenter={(event: MouseEvent) => { handleTrapezoidEnter(trap, trap.index); emit('mouseenter', trap, trap.index, event) }}
                onMouseleave={(event: MouseEvent) => { handleTrapezoidLeave(); emit('mouseleave', trap, trap.index, event) }}
                onClick={(event: MouseEvent) => { tooltip.setActiveClickItemIndex({ activeIndex: String(trap.index), activeDataKey: props.dataKey, activeCoordinate: trap.tooltipPosition }); emit('click', trap, trap.index, event) }}
              >
                {content}
              </g>
            )
          })}
          {nonCellContent}
        </Layer>
      )
    }
  },
})

const _Funnel = defineComponent({
  name: 'Funnel',
  emits: funnelEvents.emits,
  props: FunnelVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<{
    shape?: (props: FunnelTrapezoidItem) => VNodeChild
    default?: () => VNode[]
  }>,
  setup(inputProps, { attrs, slots, emit }) {
    const props = useSeriesProps(inputProps)
    funnelEvents.provide(emit)
    const data = useTrackedData(() => props.data)
    const cellPropsRef = shallowRef<Array<SVGAttributes & Record<string, unknown>>>([])
    const funnelSettings = computed<ResolvedFunnelSettings>(() => ({
      data: data.value,
      dataKey: props.dataKey,
      nameKey: props.nameKey,
      tooltipType: props.tooltipType,
      lastShapeType: props.lastShapeType,
      reversed: props.reversed,
      customWidth: props.width,
      presentationProps: {
        fill: props.fill,
        stroke: props.stroke,
      },
    }))

    useChart().items.polar.register(computed(() => ({
      stackId: undefined,
      barSize: undefined,
      type: 'funnel' as const,
      data: data.value ?? [],
      dataKey: props.dataKey,
      hide: props.hide,
      angleAxisId: 0,
      radiusAxisId: 0,
    })))

    const chart = useChart()
    const composedData = computed(() => funnelTrapezoids(
      chart.offset.value,
      funnelSettings.value,
      chart.data.value,
    ))

    const trapezoids = computed(() => composedData.value?.trapezoids ?? [])
    // Legend payload: built from trapezoids, with Cell fill overrides applied
    const legendPayload = computed(() => {
      const trapList = trapezoids.value
      if (!trapList || trapList.length === 0)
        return []
      const cells = cellPropsRef.value
      return trapList.map((trap, i: number) => ({
        type: props.legendType,
        value: String(trap.name ?? ''),
        color: cells[i]?.fill ?? trap.fill ?? props.fill ?? seriesColor(i),
        payload: trap.payload as import('@/types/legend').LegendPayload['payload'],
        dataKey: props.dataKey,
        inactive: props.hide,
      }))
    })
    useChart().legend.entries.register(computed(() => legendPayload.value))

    const View = useDeferredView(FunnelView)
    return () => h(View, { item: props, svgAttrs: attrs, data, trapezoids, cellPropsRef }, slots)
  },
})

// Preserve template slot inference in published declarations.
export const Funnel: typeof _Funnel & { new (): { $slots: FunnelSlots } } = _Funnel
