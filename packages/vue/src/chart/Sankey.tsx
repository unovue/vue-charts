import { provideChartContext, useChartTooltip } from '@/state/chartContext'
import { provideRenderPhase } from '@/animation/renderPhase'
import { chartSizeProps, useResponsiveSize } from '@/hooks/useResponsiveSize'
import { useTrackedData } from '@/hooks/useTrackedData'
import { type PropType, type SlotsType, computed, defineComponent, watch } from 'vue'
import { get } from 'es-toolkit/compat'
import type { ValueAnimationTransition } from 'motion-dom'
import { useKeyedTransition } from '@/animation/useKeyedTransition'
import { useAnimationCallbacks } from '@/animation/useAnimationCallbacks'
import { Layer } from '@/container/Layer'
import Surface from '@/container/Surface'
import { ChartsWrapper } from './ChartsWrapper'
import type { ChartOptions } from '@/state/chartOptions'
import type {
  TooltipIndex,
  TooltipPayloadConfiguration,
  TooltipPayloadSearcher,
} from '@/state/chartTooltip'
import type { Coordinate } from '@/types'
import {
  type SankeyInputLink,
  type SankeyInputNode,
  type SankeyLayoutLink,
  type SankeyLayoutNode,
  computeSankeyLayout,
  linkPathGenerator,
} from './sankeyUtils'

export interface SankeyNodeSlotProps {
  payload: SankeyLayoutNode
  index: number
  x: number
  y: number
  width: number
  height: number
  fill: string
}

export interface SankeyLinkSlotProps {
  payload: SankeyLayoutLink
  index: number
  d: string
  linkWidth: number
  fill: string
}

export interface SankeySlots {
  node?: (props: SankeyNodeSlotProps) => any
  link?: (props: SankeyLinkSlotProps) => any
  default?: () => any
}

export const sankeyPayloadSearcher: TooltipPayloadSearcher = (
  data: unknown,
  activeIndex: TooltipIndex,
) => {
  if (!data || activeIndex == null)
    return undefined
  return get(data, activeIndex as string)
}

const sankeyOptions: ChartOptions = {
  chartName: 'Sankey',
  defaultTooltipEventType: 'item',
  validateTooltipEventTypes: ['item'],
  tooltipPayloadSearcher: sankeyPayloadSearcher,
  eventEmitter: undefined,
}

export const SankeyVueProps = {
  data: {
    type: Object as PropType<{ nodes: SankeyInputNode[], links: SankeyInputLink[] }>,
    required: true as const,
  },
  width: { type: Number, required: true as const },
  height: { type: Number, required: true as const },
  nameKey: { type: String, default: 'name' },
  dataKey: { type: String, default: 'value' },
  nodePadding: { type: Number, default: 10 },
  nodeWidth: { type: Number, default: 10 },
  iterations: { type: Number, default: 32 },
  margin: {
    type: Object as PropType<{ top?: number, right?: number, bottom?: number, left?: number }>,
    default: () => ({ top: 5, right: 5, bottom: 5, left: 5 }),
  },
  nodeFill: { type: String, default: 'var(--v-charts-series, #0088fe)' },
  nodeStroke: { type: String, default: 'var(--v-charts-background, #fff)' },
  linkFill: { type: String, default: 'var(--v-charts-series, #0088fe)' },
  linkStroke: { type: String, default: 'none' },
  onAnimationStart: { type: Function as PropType<() => void>, default: undefined },
  onAnimationEnd: { type: Function as PropType<() => void>, default: undefined },
  isAnimationActive: { type: Boolean, default: true },
  transition: {
    type: Object as PropType<ValueAnimationTransition<number>>,
    default: undefined,
  },
  onClick: {
    type: Function as PropType<(item: any, type: 'node' | 'link', e: MouseEvent) => void>,
    default: undefined,
  },
  onMouseEnter: {
    type: Function as PropType<(item: any, type: 'node' | 'link', e: MouseEvent) => void>,
    default: undefined,
  },
  onMouseLeave: {
    type: Function as PropType<(item: any, type: 'node' | 'link', e: MouseEvent) => void>,
    default: undefined,
  },
}

const SankeyInner = defineComponent({
  name: 'SankeyInner',
  props: SankeyVueProps,
  slots: Object as SlotsType<SankeySlots>,
  setup(props, { slots }) {
    const nodes = useTrackedData(() => props.data.nodes)
    const links = useTrackedData(() => props.data.links)
    const tooltip = useChartTooltip()

    const layout = computed(() => {
      const m = props.margin
      return computeSankeyLayout({
        data: { nodes: nodes.value ?? [], links: links.value ?? [] },
        width: props.width,
        height: props.height,
        nodePadding: props.nodePadding,
        nodeWidth: props.nodeWidth,
        iterations: props.iterations,
        margin: {
          top: m.top ?? 5,
          right: m.right ?? 5,
          bottom: m.bottom ?? 5,
          left: m.left ?? 5,
        },
      })
    })

    const nodeKey = (node: SankeyLayoutNode) => node.name ?? node.index ?? 0
    const linkKey = (link: SankeyLayoutLink) => `${nodeKey(link.source as SankeyLayoutNode)}→${nodeKey(link.target as SankeyLayoutNode)}`
    type Geometry = { kind: 'node', node: SankeyLayoutNode } | { kind: 'link', link: SankeyLayoutLink, sourceFraction: number, targetFraction: number }
    const collapse = (item: Geometry): Geometry => item.kind === 'node'
      ? { ...item, node: { ...item.node, y1: item.node.y0 } }
      : { ...item, link: { ...item.link, width: 0 } }
    const callbacks = useAnimationCallbacks(() => props.onAnimationStart?.(), () => props.onAnimationEnd?.())
    const { items } = useKeyedTransition<Geometry>(() => [
      ...layout.value.nodes.map(node => ({ kind: 'node' as const, node })),
      ...layout.value.links.map((link) => {
        const source = link.source as SankeyLayoutNode
        const target = link.target as SankeyLayoutNode
        const fraction = (y: number | undefined, node: SankeyLayoutNode) => ((y ?? 0) - (node.y0 ?? 0)) / ((node.y1 ?? 0) - (node.y0 ?? 0) || 1)
        return { kind: 'link' as const, link, sourceFraction: fraction(link.y0, source), targetFraction: fraction(link.y1, target) }
      }),
    ], {
      key: item => item.kind === 'node' ? `node:${nodeKey(item.node)}` : `link:${linkKey(item.link)}`,
      interpolate: (from, to, t) => {
        const mix = (a: number | undefined, b: number | undefined) => (a ?? 0) + ((b ?? 0) - (a ?? 0)) * t
        if (from.kind === 'node' && to.kind === 'node')
          return { ...to, node: { ...to.node, x0: mix(from.node.x0, to.node.x0), x1: mix(from.node.x1, to.node.x1), y0: mix(from.node.y0, to.node.y0), y1: mix(from.node.y1, to.node.y1) } }
        if (from.kind === 'link' && to.kind === 'link')
          return { ...to, sourceFraction: mix(from.sourceFraction, to.sourceFraction), targetFraction: mix(from.targetFraction, to.targetFraction), link: { ...to.link, width: mix(from.link.width, to.link.width) } }
        return to
      },
      enterFrom: collapse,
      exitTo: collapse,
      connected: true,
      isActive: () => props.isAnimationActive,
      transition: () => props.transition,
      onEnd: callbacks.onEnd,
      onStart: callbacks.onStart,

    })
    const displayNodes = computed(() => items.value.flatMap(({ key, value }) => value.kind === 'node' ? [{ key, node: value.node }] : []))
    const displayLinks = computed(() => {
      const byKey = new Map(displayNodes.value.map(({ node }) => [nodeKey(node), node]))
      return items.value.flatMap(({ key, value }) => {
        if (value.kind !== 'link')
          return []
        const link = value.link
        const source = byKey.get(nodeKey(link.source as SankeyLayoutNode))
        const target = byKey.get(nodeKey(link.target as SankeyLayoutNode))
        if (!source || !target)
          return []
        return [{ key, link: Object.assign({}, link, { source, target, y0: (source.y0 ?? 0) + value.sourceFraction * ((source.y1 ?? 0) - (source.y0 ?? 0)), y1: (target.y0 ?? 0) + value.targetFraction * ((target.y1 ?? 0) - (target.y0 ?? 0)) }) }]
      })
    })

    const payloadTree = computed(() => {
      // Strip circular source/target node refs — Immer can't handle them.
      const nodes = layout.value.nodes.map((n, i) => ({
        tooltipIndex: `nodes[${i}]`,
        name: (n as any)[props.nameKey] ?? (n as any).name,
        value: n.value,
        x0: n.x0,
        x1: n.x1,
        y0: n.y0,
        y1: n.y1,
      }))
      const links = layout.value.links.map((l, i) => {
        const src = l.source as SankeyLayoutNode
        const tgt = l.target as SankeyLayoutNode
        return {
          tooltipIndex: `links[${i}]`,
          name: `${(src as any)[props.nameKey] ?? (src as any).name} - ${(tgt as any)[props.nameKey] ?? (tgt as any).name}`,
          value: l.value,
        }
      })
      return { nodes, links }
    })

    watch(computed(() => {
      const settings: TooltipPayloadConfiguration = {
        dataDefinedOnItem: payloadTree.value,
        positions: undefined,
        settings: {
          stroke: props.nodeStroke,
          strokeWidth: undefined,
          fill: props.nodeFill,
          dataKey: props.dataKey,
          nameKey: props.nameKey,
          name: undefined,
          hide: false,
          type: undefined,
          color: props.nodeFill,
          unit: '',
        },
      }
      return settings
    }), (settings, _previous, onCleanup) => {
      tooltip.addTooltipEntrySettings(settings)
      onCleanup(() => {
        tooltip.removeTooltipEntrySettings(settings)
      })
    }, { immediate: true })

    function handleNodeMouseEnter(node: SankeyLayoutNode, index: number, e: MouseEvent) {
      const coord: Coordinate = {
        x: ((node.x0 ?? 0) + (node.x1 ?? 0)) / 2,
        y: ((node.y0 ?? 0) + (node.y1 ?? 0)) / 2,
      }
      tooltip.setActiveMouseOverItemIndex({
        activeIndex: `nodes[${index}]`,
        activeDataKey: props.dataKey,
        activeCoordinate: coord,
      })
      props.onMouseEnter?.(node, 'node', e)
    }

    function handleLinkMouseEnter(link: SankeyLayoutLink, index: number, e: MouseEvent) {
      const sx = (link.source as SankeyLayoutNode).x1 ?? 0
      const tx = (link.target as SankeyLayoutNode).x0 ?? 0
      const sy = link.y0 ?? 0
      const ty = link.y1 ?? 0
      const coord: Coordinate = { x: (sx + tx) / 2, y: (sy + ty) / 2 }
      tooltip.setActiveMouseOverItemIndex({
        activeIndex: `links[${index}]`,
        activeDataKey: props.dataKey,
        activeCoordinate: coord,
      })
      props.onMouseEnter?.(link, 'link', e)
    }

    function handleMouseLeave(item: any, type: 'node' | 'link', e: MouseEvent) {
      tooltip.mouseLeaveItem()
      props.onMouseLeave?.(item, type, e)
    }

    function handleNodeClick(node: SankeyLayoutNode, index: number, e: MouseEvent) {
      const coord: Coordinate = {
        x: ((node.x0 ?? 0) + (node.x1 ?? 0)) / 2,
        y: ((node.y0 ?? 0) + (node.y1 ?? 0)) / 2,
      }
      tooltip.setActiveClickItemIndex({
        activeIndex: `nodes[${index}]`,
        activeDataKey: props.dataKey,
        activeCoordinate: coord,
      })
      props.onClick?.(node, 'node', e)
    }

    function handleLinkClick(link: SankeyLayoutLink, index: number, e: MouseEvent) {
      const sx = (link.source as SankeyLayoutNode).x1 ?? 0
      const tx = (link.target as SankeyLayoutNode).x0 ?? 0
      const coord: Coordinate = {
        x: (sx + tx) / 2,
        y: ((link.y0 ?? 0) + (link.y1 ?? 0)) / 2,
      }
      tooltip.setActiveClickItemIndex({
        activeIndex: `links[${index}]`,
        activeDataKey: props.dataKey,
        activeCoordinate: coord,
      })
      props.onClick?.(link, 'link', e)
    }

    function renderNode(node: SankeyLayoutNode, index: number, opacity: number, key: PropertyKey) {
      const x = node.x0 ?? 0
      const y = node.y0 ?? 0
      const width = (node.x1 ?? 0) - x
      const height = (node.y1 ?? 0) - y

      if (slots.node) {
        const slotProps: SankeyNodeSlotProps = {
          payload: node,
          index,
          x,
          y,
          width,
          height,
          fill: props.nodeFill,
        }
        return (
          <g
            key={key}
            class="v-charts-sankey-node"
            style={{ opacity }}
            onClick={(e: MouseEvent) => handleNodeClick(node, index, e)}
            onMouseenter={(e: MouseEvent) => handleNodeMouseEnter(node, index, e)}
            onMouseleave={(e: MouseEvent) => handleMouseLeave(node, 'node', e)}
          >
            {slots.node(slotProps)}
          </g>
        )
      }

      return (
        <g
          key={key}
          class="v-charts-sankey-node"
          style={{ opacity }}
          onClick={(e: MouseEvent) => handleNodeClick(node, index, e)}
          onMouseenter={(e: MouseEvent) => handleNodeMouseEnter(node, index, e)}
          onMouseleave={(e: MouseEvent) => handleMouseLeave(node, 'node', e)}
        >
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={props.nodeFill}
            stroke={props.nodeStroke}
          />
        </g>
      )
    }

    function renderLink(link: SankeyLayoutLink, index: number, opacity: number, key: PropertyKey) {
      const d = linkPathGenerator(link) ?? ''
      const linkWidth = link.width ?? 0

      if (slots.link) {
        const slotProps: SankeyLinkSlotProps = {
          payload: link,
          index,
          d,
          linkWidth,
          fill: props.linkFill,
        }
        return (
          <g
            key={key}
            style={{ opacity }}
            onClick={(e: MouseEvent) => handleLinkClick(link, index, e)}
            onMouseenter={(e: MouseEvent) => handleLinkMouseEnter(link, index, e)}
            onMouseleave={(e: MouseEvent) => handleMouseLeave(link, 'link', e)}
          >
            {slots.link(slotProps)}
          </g>
        )
      }

      return (
        <path
          key={key}
          class="v-charts-sankey-link"
          d={d}
          fill="none"
          stroke={props.linkStroke === 'none' ? props.linkFill : props.linkStroke}
          stroke-width={linkWidth}
          stroke-opacity={0.2}
          style={{ opacity }}
          onClick={(e: MouseEvent) => handleLinkClick(link, index, e)}
          onMouseenter={(e: MouseEvent) => handleLinkMouseEnter(link, index, e)}
          onMouseleave={(e: MouseEvent) => handleMouseLeave(link, 'link', e)}
        />
      )
    }

    return () => (
      <Surface width={props.width} height={props.height} style={{ width: '100%', height: '100%' }}>
        <Layer class="v-charts-sankey">
          <g class="v-charts-sankey-links">
            {displayLinks.value.map(({ key, link }, i) => renderLink(link, link.index ?? i, 1, key))}
          </g>
          <g class="v-charts-sankey-nodes">
            {displayNodes.value.map(({ key, node }, i) => renderNode(node, node.index ?? i, 1, key))}
          </g>
        </Layer>
      </Surface>
    )
  },
})

/**
 * Sankey diagram — visualizes flows between nodes.
 *
 * Supports `<Tooltip>` as a child component for hover info on both nodes and links.
 */
const _Sankey = defineComponent({
  name: 'Sankey',
  props: { ...SankeyVueProps, ...chartSizeProps },
  slots: Object as SlotsType<SankeySlots>,
  setup(props, { slots }) {
    provideChartContext(sankeyOptions)
    provideRenderPhase()
    const { effectiveWidth, effectiveHeight, isResponsive, measured, handleResize } = useResponsiveSize(props)

    return () => {
      const { aspect, initialDimension, ...innerProps } = props
      if (!props.data || !props.data.nodes || props.data.nodes.length === 0)
        return null

      return (
        <ChartsWrapper isResponsive={isResponsive.value} aspect={props.aspect} interactive={!isResponsive.value || measured.value} onResize={handleResize} width={effectiveWidth.value} height={effectiveHeight.value}>
          <SankeyInner {...innerProps} width={effectiveWidth.value} height={effectiveHeight.value}>
            {{ node: slots.node, link: slots.link }}
          </SankeyInner>
          {slots.default?.()}
        </ChartsWrapper>
      )
    }
  },
})

export const Sankey = _Sankey as typeof _Sankey & {
  new (): { $slots: SankeySlots }
}
