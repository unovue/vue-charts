import type { ComputedRef, PropType, ShallowRef, SlotsType } from 'vue'
import { computed, defineComponent, h, shallowRef } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { useChartTooltip } from '@/state/chartContext'
import { useTrackedData } from '@/hooks/useTrackedData'
import { useAppSelector } from '@/state/hooks'
import { Layer } from '@/container/Layer'
import { Trapezoid } from '@/shape/Trapezoid'
import { Animate } from '@/animation/Animate'
import { SetPolarGraphicalItem } from '@/state/SetGraphicalItem'
import { SetLegendPayload } from '@/state/SetLegendPayload'
import { SetTooltipEntrySettings } from '@/state/SetTooltipEntrySettings'
import { type ResolvedFunnelSettings, selectFunnelTrapezoids } from '@/state/selectors/funnelSelectors'
import { provideCartesianLabelListData } from '@/context/cartesianLabelListContext'
import { useIsAnimating } from '@/hooks/useIsAnimating'
import { extractCellProps, filterOutCells } from '@/utils/cell'
import type { FunnelPropsWithSVG, FunnelTrapezoidItem } from './type'
import { FunnelVueProps } from './type'

const FunnelView = defineComponent({
  name: 'FunnelView',
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<FunnelPropsWithSVG>, required: true },
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
    const props = view.item
    const attrs = view.svgAttrs
    const data = view.data
    const trapezoids = view.trapezoids
    const cellPropsRef = view.cellPropsRef
    const tooltip = useChartTooltip()
    const isAnimating = useIsAnimating(() => props.isAnimationActive)

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
      if (!trapList || trapList.length === 0)
        return undefined
      return trapList.map((trap: any) => ({
        x: trap.x,
        y: trap.y,
        width: Math.max(trap.upperWidth, trap.lowerWidth),
        height: trap.height,
        value: trap.value ?? trap.val ?? '',
        payload: trap.payload,
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

      const trapList = trapezoids.value
      if (!trapList || trapList.length === 0) {
        return null
      }

      // Extract Cell props and non-Cell children (e.g. LabelList) from default slot
      const defaultContent = slots.default?.() ?? []
      const cells = extractCellProps(defaultContent)
      cellPropsRef.value = cells
      const nonCellContent = cells.length > 0 ? filterOutCells(defaultContent) : defaultContent
      const stroke = (attrs.stroke as string) ?? props.stroke

      return (
        <Layer class={['v-charts-funnel', props.class]}>
          <Animate
            isActive={props.isAnimationActive}
            from={0}
            to={1}
            transition={props.transition}
            onAnimationStart={props.onAnimationStart}
            onAnimationEnd={() => { isAnimating.value = false; props.onAnimationEnd?.() }}
          >
            {(progress: number) => {
              return trapList.map((trap: any, i: number) => {
                // Scale height + widths from center
                const animatedHeight = trap.height * progress
                const yOffset = trap.height * (1 - progress)
                const animatedUpperWidth = trap.upperWidth * progress
                const animatedLowerWidth = trap.lowerWidth * progress
                const centerX = trap.x + trap.upperWidth / 2
                const animatedX = centerX - animatedUpperWidth / 2

                const cellProps = cells[i] ?? {}
                const trapFill = cellProps.fill ?? trap.fill ?? props.fill
                const trapStroke = cellProps.stroke ?? stroke

                const trapezoidProps = {
                  ...trap,
                  x: animatedX,
                  y: trap.y + yOffset / 2,
                  height: animatedHeight,
                  upperWidth: animatedUpperWidth,
                  lowerWidth: animatedLowerWidth,
                  fill: trapFill,
                  stroke: trapStroke,
                  animationProgress: progress,
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
                    key={`trapezoid-${i}`}
                    onMouseenter={() => handleTrapezoidEnter(trap, i)}
                    onMouseleave={handleTrapezoidLeave}
                  >
                    {content}
                  </g>
                )
              })
            }}
          </Animate>
          {nonCellContent}
        </Layer>
      )
    }
  },
})

export const Funnel = defineComponent<FunnelPropsWithSVG>({
  name: 'Funnel',
  props: FunnelVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<{
    shape?: (props: FunnelTrapezoidItem) => any
    default?: () => any
  }>,
  setup(props, { attrs, slots }) {
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
      }))
    })
    SetLegendPayload(computed(() => legendPayload.value))

    const View = useDeferredView(FunnelView)
    return () => h(View, { item: props, svgAttrs: attrs, data, trapezoids, cellPropsRef }, slots)
  },
})
