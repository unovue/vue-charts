import { chartEmits, chartListeners } from '@/events/componentEvents'
import { provideChartContext, useChartTooltip } from '@/state/chartContext'
import { provideRenderPhase } from '@/animation/renderPhase'
import { chartSizeProps, useResponsiveSize } from '@/hooks/useResponsiveSize'
import { useTrackedData } from '@/hooks/useTrackedData'
import { type PropType, type SlotsType, computed, defineComponent, watch } from 'vue'
import { get } from 'es-toolkit/compat'
import { Layer } from '@/container/Layer'
import Surface from '@/container/Surface'
import { Sector } from '@/shape/Sector'
import { polarToCartesian } from '@/utils/polar'
import { ChartsWrapper } from './ChartsWrapper'
import type { ChartOptions } from '@/state/chartOptions'
import type {
  TooltipIndex,
  TooltipPayloadConfiguration,
  TooltipPayloadSearcher,
} from '@/state/chartTooltip'
import type { Coordinate } from '@/types'
import {
  type SunburstData,
  type SunburstLayoutNode,
  computeSunburstLayout,
} from './sunburstUtils'

export type { SunburstData }

export interface SunburstContentSlotProps extends SunburstLayoutNode {
  index: number
}

export interface SunburstSlots {
  content?: (props: SunburstContentSlotProps) => any
  default?: () => any
}

export const sunburstPayloadSearcher: TooltipPayloadSearcher = (
  data: unknown,
  activeIndex: TooltipIndex,
) => {
  if (!data || !activeIndex)
    return undefined
  return get(data, activeIndex)
}

const sunburstOptions: ChartOptions = {
  chartName: 'SunburstChart',
  defaultTooltipEventType: 'item',
  validateTooltipEventTypes: ['item'],
  tooltipPayloadSearcher: sunburstPayloadSearcher,
  eventEmitter: undefined,
}

export const SunburstChartVueProps = {
  data: { type: Object as PropType<SunburstData>, required: true as const },
  dataKey: { type: String, default: 'value' },
  nameKey: { type: String, default: 'name' },
  width: { type: Number, required: true as const },
  height: { type: Number, required: true as const },
  cx: { type: Number, default: undefined },
  cy: { type: Number, default: undefined },
  innerRadius: { type: Number, default: 50 },
  outerRadius: { type: Number, default: undefined },
  startAngle: { type: Number, default: 0 },
  endAngle: { type: Number, default: 360 },
  ringPadding: { type: Number, default: 2 },
  padding: { type: Number, default: 2 },
  fill: { type: String, default: 'var(--v-charts-text, #333)' },
  stroke: { type: String, default: 'var(--v-charts-background, #fff)' },
}

const SunburstInner = defineComponent({
  name: 'SunburstInner',
  props: SunburstChartVueProps,
  slots: Object as SlotsType<SunburstSlots>,
  setup(props, { slots }) {
    const trackedData = useTrackedData(() => [props.data])
    const data = computed(() => ({ ...trackedData.value![0] }))
    const tooltip = useChartTooltip()

    const resolvedCx = computed(() => props.cx ?? props.width / 2)
    const resolvedCy = computed(() => props.cy ?? props.height / 2)
    const resolvedOuterRadius = computed(() =>
      props.outerRadius ?? Math.min(props.width, props.height) / 2,
    )

    const nodes = computed(() =>
      computeSunburstLayout({
        data: data.value,
        cx: resolvedCx.value,
        cy: resolvedCy.value,
        innerRadius: props.innerRadius,
        outerRadius: resolvedOuterRadius.value,
        startAngle: props.startAngle,
        endAngle: props.endAngle,
        dataKey: props.dataKey,
        ringPadding: props.ringPadding,
        padding: props.padding,
      }),
    )

    // Register tooltip entry settings
    watch(computed(() => {
      const tooltipEntrySettings: TooltipPayloadConfiguration = {
        dataDefinedOnItem: data.value,
        positions: undefined,
        settings: {
          stroke: props.stroke,
          strokeWidth: undefined,
          fill: props.fill,
          dataKey: props.dataKey,
          nameKey: props.nameKey,
          name: undefined,
          hide: false,
          type: undefined,
          color: props.fill,
          unit: '',
        },
      }
      return tooltipEntrySettings
    }), (tooltipEntrySettings, _previous, onCleanup) => {
      tooltip.addTooltipEntrySettings(tooltipEntrySettings)
      onCleanup(() => {
        tooltip.removeTooltipEntrySettings(tooltipEntrySettings)
      })
    }, { immediate: true })

    function getNodeFill(node: SunburstLayoutNode): string {
      if (node.fill)
        return node.fill
      return props.fill
    }

    function getTooltipCoordinate(node: SunburstLayoutNode): Coordinate {
      const midAngle = (node.startAngle + node.endAngle) / 2
      const midRadius = (node.innerRadius + node.outerRadius) / 2
      return polarToCartesian(node.cx, node.cy, midRadius, midAngle)
    }

    function handleMouseEnter(node: SunburstLayoutNode, e: MouseEvent) {
      tooltip.setActiveMouseOverItemIndex({
        activeIndex: node.tooltipIndex,
        activeDataKey: props.dataKey,
        activeCoordinate: getTooltipCoordinate(node),
      })
    }

    function handleMouseLeave(node: SunburstLayoutNode, e: MouseEvent) {
      tooltip.mouseLeaveItem()
    }

    function handleClick(node: SunburstLayoutNode, e: MouseEvent) {
      tooltip.setActiveClickItemIndex({
        activeIndex: node.tooltipIndex,
        activeDataKey: props.dataKey,
        activeCoordinate: getTooltipCoordinate(node),
      })
    }

    function renderSector(node: SunburstLayoutNode, index: number) {
      const nodeFill = getNodeFill(node)

      const slotProps: SunburstContentSlotProps = { ...node, index }

      if (slots.content) {
        return (
          <g
            key={`sector-${index}`}
            class="v-charts-sunburst-sector"
            onClick={(e: MouseEvent) => handleClick(node, e)}
            onMouseenter={(e: MouseEvent) => handleMouseEnter(node, e)}
            onMouseleave={(e: MouseEvent) => handleMouseLeave(node, e)}
          >
            {slots.content(slotProps)}
          </g>
        )
      }

      return (
        <g
          key={`sector-${index}`}
          class="v-charts-sunburst-sector"
          onClick={(e: MouseEvent) => handleClick(node, e)}
          onMouseenter={(e: MouseEvent) => handleMouseEnter(node, e)}
          onMouseleave={(e: MouseEvent) => handleMouseLeave(node, e)}
        >
          <Sector
            cx={node.cx}
            cy={node.cy}
            innerRadius={node.innerRadius}
            outerRadius={node.outerRadius}
            startAngle={node.startAngle}
            endAngle={node.endAngle}
            fill={nodeFill}
            stroke={props.stroke}
          />
        </g>
      )
    }

    return () => (
      <Surface width={props.width} height={props.height} style={{ width: '100%', height: '100%' }}>
        <Layer class="v-charts-sunburst">
          {nodes.value.map((node, index) => renderSector(node, index))}
        </Layer>
      </Surface>
    )
  },
})

export const SunburstChart = defineComponent({
  name: 'SunburstChart',
  props: { ...SunburstChartVueProps, ...chartSizeProps },
  inheritAttrs: false,
  emits: { ...chartEmits },
  slots: Object as SlotsType<SunburstSlots>,
  setup(props, { slots, emit }) {
    provideChartContext(sunburstOptions)
    provideRenderPhase()
    const { effectiveWidth, effectiveHeight, isResponsive, measured, handleResize, boxStyle } = useResponsiveSize(props)

    return () => {
      const { aspect, initialDimension, ...innerProps } = props
      if (!props.data?.children || props.data.children.length === 0)
        return null

      return (
        <ChartsWrapper
          {...chartListeners(emit)}
          isResponsive={isResponsive.value}
          boxStyle={boxStyle.value}
          interactive={!isResponsive.value || measured.value}
          onResize={handleResize}
          width={effectiveWidth.value}
          height={effectiveHeight.value}
        >
          <SunburstInner {...innerProps} width={effectiveWidth.value} height={effectiveHeight.value}>
            {{ content: slots.content }}
          </SunburstInner>
          {slots.default?.()}
        </ChartsWrapper>
      )
    }
  },
})
