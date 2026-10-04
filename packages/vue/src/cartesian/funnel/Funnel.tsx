import { useLegendHiddenProps } from '@/hooks/useLegendHiddenProps'
import { funnelEvents } from '@/events/itemEvents'
import type { ComputedRef, ExtractPropTypes, PropType, ShallowRef, SlotsType } from 'vue'
import { computed, defineComponent, h, shallowRef } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { useChartTooltip } from '@/state/chartContext'
import { useTrackedData } from '@/hooks/useTrackedData'
import { useAppSelector } from '@/state/hooks'
import { Layer } from '@/container/Layer'
import { Trapezoid } from '@/shape/Trapezoid'
import { getValueByDataKey } from '@/utils/chart'
import { type Neighbors, useKeyedTransition } from '@/animation/useKeyedTransition'
import { FadeIn } from '@/animation/FadeIn'
import { SetPolarGraphicalItem } from '@/state/SetGraphicalItem'
import { SetLegendPayload } from '@/state/SetLegendPayload'
import { SetTooltipEntrySettings } from '@/state/SetTooltipEntrySettings'
import { type ResolvedFunnelSettings, selectFunnelTrapezoids } from '@/state/selectors/funnelSelectors'
import { provideCartesianLabelListData } from '@/context/cartesianLabelListContext'
import { assignCells, extractCellProps, filterOutCells } from '@/utils/cell'
import type { FunnelTrapezoidItem } from './type'
import { FunnelVueProps } from './type'

export interface FunnelSlots {
  shape?: (props: FunnelTrapezoidItem) => import('vue').VNodeChild
  default?: () => import('vue').VNodeChild
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
    shape?: (props: FunnelTrapezoidItem) => any
    default?: () => any
  }>,
  setup(view, { slots }) {
    const emit = funnelEvents.use()
    const props = view.item
    const attrs = view.svgAttrs
    const data = view.data
    const trapezoids = view.trapezoids
    const cellPropsRef = view.cellPropsRef
    const tooltip = useChartTooltip()
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
      isActive: () => props.isAnimationActive,
      transition: () => props.transition,
      onStart: () => emit('animation-start'),
      onEnd: () => emit('animation-end'),
    })

    SetTooltipEntrySettings({
      fn: v => v,
      args: computed(() => ({
        dataDefinedOnItem: data.value ?? [],
        positions: trapezoids.value.map((t: any) => t.tooltipPosition),
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
      })),
    })

    // Provide label list data for LabelList children — defer during animation
    provideCartesianLabelListData(computed(() => {
      if (props.isAnimationActive && isAnimating.value)
        return undefined
      const trapList = trapezoids.value
      if (trapList.length === 0)
        return undefined
      return trapList.map((trap: any) => ({
        x: trap.x,
        y: trap.y,
        width: Math.max(trap.upperWidth, trap.lowerWidth),
        height: trap.height,
        value: trap.value ?? trap.val ?? '',
        payload: trap.payload,
        dataKey: props.dataKey,
        inactive: props.hide,
        parentViewBox: trap.parentViewBox,
        fill: trap.fill ?? props.fill,
      }))
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
        <Layer class={['v-charts-funnel', props.class]}>
          {items.value.map(({ key, value: trap }) => {
            const cellProps = cells[trap.index] ?? {}
            const trapFill = cellProps.fill ?? trap.payload?.fill ?? props.fill
            const trapStroke = cellProps.stroke ?? stroke

            const trapezoidProps = {
              ...trap,
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
                    stroke={trapStroke}
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
          <FadeIn isActive={props.isAnimationActive && !isAnimating.value}>{nonCellContent}</FadeIn>
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
    shape?: (props: FunnelTrapezoidItem) => any
    default?: () => any
  }>,
  setup(inputProps, { attrs, slots, emit }) {
    const props = useLegendHiddenProps(inputProps)
    funnelEvents.provide(emit)
    const data = useTrackedData(() => props.data)
    const cellPropsRef = shallowRef<Record<string, any>[]>([])
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

    SetPolarGraphicalItem(computed(() => ({
      type: 'funnel' as const,
      data: data.value ?? [],
      dataKey: props.dataKey,
      hide: props.hide,
      angleAxisId: 0,
      radiusAxisId: 0,
    })))

    const composedData = useAppSelector(state => selectFunnelTrapezoids(state, funnelSettings.value))

    const trapezoids = computed(() => composedData.value?.trapezoids ?? [])
    // Legend payload: built from trapezoids, with Cell fill overrides applied
    const legendPayload = computed(() => {
      const trapList = trapezoids.value
      if (!trapList || trapList.length === 0)
        return []
      const cells = cellPropsRef.value
      return trapList.map((trap: any, i: number) => ({
        type: props.legendType,
        value: String(trap.name ?? ''),
        color: cells[i]?.fill ?? trap.fill ?? props.fill,
        payload: trap.payload,
        dataKey: props.dataKey,
        inactive: props.hide,
      }))
    })
    SetLegendPayload(computed(() => legendPayload.value))

    const View = useDeferredView(FunnelView)
    return () => h(View, { item: props, svgAttrs: attrs, data, trapezoids, cellPropsRef }, slots)
  },
})

// Preserve template slot inference in published declarations.
export const Funnel: typeof _Funnel & { new (): { $slots: FunnelSlots } } = _Funnel
