import type { ChartDataKey } from '@/types/base'
import { seriesColor } from '@/utils/theme'
import { type PropType, type SlotsType, type VNode, type VNodeChild, computed, defineComponent } from 'vue'
import type { Coordinate } from '@/types'
import { chartEmits, chartListeners } from '@/events/componentEvents'
import { useTooltipController } from '@/model/tooltip'
import { chartSizeProps } from '@/hooks/useResponsiveSize'
import { useTrackedData } from '@/hooks/useTrackedData'
import { useKeyedTransition } from '@/animation/useKeyedTransition'
import { useAnimationCallbacks } from '@/animation/useAnimationCallbacks'
import type { ChartTransition } from '@/animation/motion'
import { get } from 'es-toolkit/compat'
import { Layer } from '@/container/Layer'
import { Sector } from '@/shape/Sector'
import { polarToCartesian } from '@/utils/polar'
import { ChartShell, useChartShell } from './ChartShell'
import type { ChartOptions } from '@/model/options'
import type {
  TooltipPayloadConfiguration,
  TooltipPayloadSearcher,
} from '@/types/tooltip'
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
  content?: (props: SunburstContentSlotProps) => VNodeChild
  default?: () => VNode[]
}

const sunburstPayloadSearcher: TooltipPayloadSearcher = (
  data: unknown,
  payloadKey: string,
) => {
  if (!data || !payloadKey)
    return undefined
  return get(data, payloadKey)
}

const sunburstOptions: ChartOptions = {
  chartName: 'SunburstChart',
  defaultTooltipEventType: 'item',
  validateTooltipEventTypes: ['item'],
  tooltipPayloadSearcher: sunburstPayloadSearcher,
  eventEmitter: undefined,
}

const SunburstChartVueProps = {
  title: { type: String, default: 'Sunburst chart' },
  desc: String,
  data: { type: Object as PropType<SunburstData>, required: true as const },
  dataKey: { type: [String, Number, Function] as PropType<ChartDataKey>, default: 'value' },
  nameKey: { type: [String, Number, Function] as PropType<ChartDataKey>, default: 'name' },
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
  fill: { type: String, default: undefined },
  stroke: { type: String, default: 'var(--v-charts-background, #fff)' },
  isAnimationActive: { type: Boolean, default: true },
  transition: { type: Object as PropType<ChartTransition>, default: undefined },
}

const sunburstItemEmits = {
  'node-click': (_node: SunburstLayoutNode, _index: number, _event: MouseEvent | KeyboardEvent) => true,
  'node-mouseenter': (_node: SunburstLayoutNode, _index: number, _event: MouseEvent) => true,
  'node-mouseleave': (_node: SunburstLayoutNode, _index: number, _event: MouseEvent) => true,
  'animation-start': () => true,
  'animation-end': () => true,
}

const SunburstInner = defineComponent({
  name: 'SunburstInner',
  props: SunburstChartVueProps,
  slots: Object as SlotsType<SunburstSlots>,
  emits: sunburstItemEmits,
  setup(props, { slots, emit }) {
    const trackedData = useTrackedData(() => [props.data])
    const data = computed(() => ({ ...trackedData.value![0] }))
    const tooltip = useTooltipController()

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
        nameKey: props.nameKey,
        ringPadding: props.ringPadding,
        padding: props.padding,
      }),
    )

    // Sectors match by their name path. The first appearance sweeps open from the start angle;
    // later, new sectors grow out of the edge of their neighbour and removed ones fold into it.
    const callbacks = useAnimationCallbacks(() => emit('animation-start'), () => emit('animation-end'))
    let appeared = false
    const mix = (a: number, b: number, t: number) => a + (b - a) * t
    const collapsed = (node: SunburstLayoutNode, angle: number) => ({ ...node, startAngle: angle, endAngle: angle })
    const { items } = useKeyedTransition(() => nodes.value, {
      key: node => node.path,
      connected: true,
      interpolate: (from, to, t) => ({
        ...to,
        startAngle: mix(from.startAngle, to.startAngle, t),
        endAngle: mix(from.endAngle, to.endAngle, t),
        innerRadius: mix(from.innerRadius, to.innerRadius, t),
        outerRadius: mix(from.outerRadius, to.outerRadius, t),
      }),
      enterFrom: (to, { previous, next }) => collapsed(to, !appeared
        ? props.startAngle
        : previous?.depth === to.depth ? previous.endAngle : next?.depth === to.depth ? next.startAngle : to.startAngle),
      exitTo: (from, { previous, next }) => collapsed(from, previous?.depth === from.depth
        ? previous.endAngle
        : next?.depth === from.depth ? next.startAngle : from.startAngle),
      isActive: () => props.isAnimationActive,
      transition: () => props.transition,
      onStart: () => {
        callbacks.onStart()
        if (nodes.value.length)
          appeared = true
      },
      onEnd: callbacks.onEnd,
    })

    // Register tooltip entry settings
    tooltip.entries.register(computed(() => {
      const tooltipEntrySettings: TooltipPayloadConfiguration = {
        dataDefinedOnItem: data.value,
        values: Object.fromEntries(nodes.value.map(node => [node.tooltipIndex, node.value])),
        positions: undefined,
        keyboardItems: [...nodes.value].sort((a, b) => {
          if (a.tooltipIndex.startsWith(`${b.tooltipIndex}.`))
            return 1
          if (b.tooltipIndex.startsWith(`${a.tooltipIndex}.`))
            return -1
          return a.startAngle - b.startAngle || a.depth - b.depth
        }).map(node => ({
          identity: node.payload,
          index: nodes.value.indexOf(node),
          payloadKey: node.tooltipIndex,
          coordinate: getTooltipCoordinate(node),
          onClick: event => handleClick(node, event),
        })),
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
    }))

    function getNodeFill(node: SunburstLayoutNode): string {
      if (node.fill)
        return node.fill
      const branchIndex = Number(node.tooltipIndex.match(/^children\[(\d+)\]/)?.[1] ?? 0)
      const branch = props.data.children?.[branchIndex]
      return props.fill ?? branch?.fill ?? seriesColor(branchIndex)
    }

    function getTooltipCoordinate(node: SunburstLayoutNode): Coordinate {
      const midAngle = (node.startAngle + node.endAngle) / 2
      const midRadius = (node.innerRadius + node.outerRadius) / 2
      return polarToCartesian(node.cx, node.cy, midRadius, midAngle)
    }

    const indexOf = (node: SunburstLayoutNode) => nodes.value.findIndex(candidate => candidate.path === node.path)

    function handleMouseEnter(node: SunburstLayoutNode, e: MouseEvent) {
      emit('node-mouseenter', node, indexOf(node), e)
      tooltip.activate('hover', {
        type: 'item',
        index: indexOf(node),
        dataKey: props.dataKey,
        coordinate: getTooltipCoordinate(node),
      })
    }

    function handleMouseLeave(node: SunburstLayoutNode, e: MouseEvent) {
      tooltip.clear('hover')
      emit('node-mouseleave', node, indexOf(node), e)
    }

    function handleClick(node: SunburstLayoutNode, e: MouseEvent | KeyboardEvent) {
      tooltip.activate('click', {
        type: 'item',
        index: indexOf(node),
        dataKey: props.dataKey,
        coordinate: getTooltipCoordinate(node),
      })
      emit('node-click', node, indexOf(node), e)
    }

    // Leaving sectors are not interactive; their data is gone.
    const listeners = (node: SunburstLayoutNode, exiting: boolean) => exiting
      ? { style: { pointerEvents: 'none' as const } }
      : {
          onClick: (e: MouseEvent) => handleClick(node, e),
          onMouseenter: (e: MouseEvent) => handleMouseEnter(node, e),
          onMouseleave: (e: MouseEvent) => handleMouseLeave(node, e),
        }

    function renderSector(node: SunburstLayoutNode, index: number, key: PropertyKey, exiting: boolean) {
      const nodeFill = getNodeFill(node)

      const slotProps: SunburstContentSlotProps = { ...node, index }

      if (slots.content) {
        return (
          <g
            key={key}
            class="v-charts-sunburst-sector"
            {...listeners(node, exiting)}
          >
            {slots.content(slotProps)}
          </g>
        )
      }

      return (
        <g
          key={key}
          class="v-charts-sunburst-sector"
          {...listeners(node, exiting)}
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
      <Layer data-slot="series" class="v-charts-sunburst">
        {items.value.map(({ key, value, phase }, index) => renderSector(value, index, key, phase === 'exit'))}
      </Layer>
    )
  },
})

const _SunburstChart = defineComponent({
  name: 'SunburstChart',
  props: { ...SunburstChartVueProps, ...chartSizeProps },
  inheritAttrs: false,
  emits: { ...chartEmits, ...sunburstItemEmits },
  slots: Object as SlotsType<SunburstSlots>,
  setup(props, { slots, emit, attrs }) {
    const size = useChartShell(props, sunburstOptions)

    return () => {
      const { aspect, initialDimension, ...innerProps } = props
      if (!props.data?.children || props.data.children.length === 0)
        return null

      return (
        <ChartShell {...attrs} {...chartListeners(emit)} size={size} root="wrapper" accessibilityLayer title={props.title} desc={props.desc}>
          {{ svg: () => (
            <SunburstInner
              {...innerProps}
              width={size.effectiveWidth.value}
              height={size.effectiveHeight.value}
              {...{
                'onNode-click': (node, index, event) => emit('node-click', node, index, event),
                'onNode-mouseenter': (node, index, event) => emit('node-mouseenter', node, index, event),
                'onNode-mouseleave': (node, index, event) => emit('node-mouseleave', node, index, event),
                'onAnimation-start': () => emit('animation-start'),
                'onAnimation-end': () => emit('animation-end'),
              }}
            >
              {{ content: slots.content }}
            </SunburstInner>
          ), default: slots.default }}
        </ChartShell>
      )
    }
  },
})

// Preserve template slot inference in published declarations.
export const SunburstChart: typeof _SunburstChart & { new (): { $slots: SunburstSlots } } = _SunburstChart
