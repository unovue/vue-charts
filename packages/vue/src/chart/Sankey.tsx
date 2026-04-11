import { computed, defineComponent, type PropType, type SlotsType, watchEffect } from 'vue'
import { get } from 'lodash-es'
import type { AnimationOptions } from 'motion-v'
import { provideStore } from '@reduxjs/vue-redux'
import { Animate } from '@/animation/Animate'
import { Layer } from '@/container/Layer'
import Surface from '@/container/Surface'
import { RechartsWrapper } from './RechartsWrapper'
import { createRechartsStore } from '@/state/store'
import { useAppDispatch } from '@/state/hooks'
import {
  addTooltipEntrySettings,
  mouseLeaveItem,
  removeTooltipEntrySettings,
  setActiveClickItemIndex,
  setActiveMouseOverItemIndex,
} from '@/state/tooltipSlice'
import type { ChartOptions } from '@/state/optionsSlice'
import type {
  TooltipIndex,
  TooltipPayloadConfiguration,
  TooltipPayloadSearcher,
} from '@/state/tooltipSlice'
import type { Coordinate } from '@/types'
import {
  computeSankeyLayout,
  linkPathGenerator,
  type SankeyInputLink,
  type SankeyInputNode,
  type SankeyLayoutLink,
  type SankeyLayoutNode,
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
  nodeFill: { type: String, default: '#0088fe' },
  nodeStroke: { type: String, default: '#fff' },
  linkFill: { type: String, default: '#0088fe' },
  linkStroke: { type: String, default: 'none' },
  isAnimationActive: { type: Boolean, default: true },
  transition: {
    type: Object as PropType<AnimationOptions>,
    default: () => ({ duration: 0.8, ease: 'easeOut' as const }),
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
    const dispatch = useAppDispatch()

    const layout = computed(() => {
      const m = props.margin
      return computeSankeyLayout({
        data: props.data,
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

    watchEffect((onCleanup) => {
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
      dispatch(addTooltipEntrySettings(settings))
      onCleanup(() => {
        dispatch(removeTooltipEntrySettings(settings))
      })
    })

    function handleNodeMouseEnter(node: SankeyLayoutNode, index: number, e: MouseEvent) {
      const coord: Coordinate = {
        x: ((node.x0 ?? 0) + (node.x1 ?? 0)) / 2,
        y: ((node.y0 ?? 0) + (node.y1 ?? 0)) / 2,
      }
      dispatch(setActiveMouseOverItemIndex({
        activeIndex: `nodes[${index}]`,
        activeDataKey: props.dataKey,
        activeCoordinate: coord,
      }))
      props.onMouseEnter?.(node, 'node', e)
    }

    function handleLinkMouseEnter(link: SankeyLayoutLink, index: number, e: MouseEvent) {
      const sx = (link.source as SankeyLayoutNode).x1 ?? 0
      const tx = (link.target as SankeyLayoutNode).x0 ?? 0
      const sy = link.y0 ?? 0
      const ty = link.y1 ?? 0
      const coord: Coordinate = { x: (sx + tx) / 2, y: (sy + ty) / 2 }
      dispatch(setActiveMouseOverItemIndex({
        activeIndex: `links[${index}]`,
        activeDataKey: props.dataKey,
        activeCoordinate: coord,
      }))
      props.onMouseEnter?.(link, 'link', e)
    }

    function handleMouseLeave(item: any, type: 'node' | 'link', e: MouseEvent) {
      dispatch(mouseLeaveItem())
      props.onMouseLeave?.(item, type, e)
    }

    function handleNodeClick(node: SankeyLayoutNode, index: number, e: MouseEvent) {
      const coord: Coordinate = {
        x: ((node.x0 ?? 0) + (node.x1 ?? 0)) / 2,
        y: ((node.y0 ?? 0) + (node.y1 ?? 0)) / 2,
      }
      dispatch(setActiveClickItemIndex({
        activeIndex: `nodes[${index}]`,
        activeDataKey: props.dataKey,
        activeCoordinate: coord,
      }))
      props.onClick?.(node, 'node', e)
    }

    function handleLinkClick(link: SankeyLayoutLink, index: number, e: MouseEvent) {
      const sx = (link.source as SankeyLayoutNode).x1 ?? 0
      const tx = (link.target as SankeyLayoutNode).x0 ?? 0
      const coord: Coordinate = {
        x: (sx + tx) / 2,
        y: ((link.y0 ?? 0) + (link.y1 ?? 0)) / 2,
      }
      dispatch(setActiveClickItemIndex({
        activeIndex: `links[${index}]`,
        activeDataKey: props.dataKey,
        activeCoordinate: coord,
      }))
      props.onClick?.(link, 'link', e)
    }

    function renderNode(node: SankeyLayoutNode, index: number, opacity: number) {
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
            key={`node-${index}`}
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
          key={`node-${index}`}
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

    function renderLink(link: SankeyLayoutLink, index: number, opacity: number) {
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
            key={`link-${index}`}
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
          key={`link-${index}`}
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
      <Surface width={props.width} height={props.height}>
        <Layer class="v-charts-sankey">
          <Animate
            isActive={props.isAnimationActive}
            from={0}
            to={1}
            transition={props.transition}
          >
            {(progress: number) => (
              <>
                <g class="v-charts-sankey-links">
                  {layout.value.links.map((link, i) => renderLink(link, i, progress))}
                </g>
                <g class="v-charts-sankey-nodes">
                  {layout.value.nodes.map((node, i) => renderNode(node, i, progress))}
                </g>
              </>
            )}
          </Animate>
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
  props: SankeyVueProps,
  slots: Object as SlotsType<SankeySlots>,
  setup(props, { slots }) {
    const store = createRechartsStore({ options: sankeyOptions }, 'Sankey')
    provideStore({ store })

    return () => {
      if (!props.data || !props.data.nodes || props.data.nodes.length === 0)
        return null

      return (
        <RechartsWrapper width={props.width} height={props.height}>
          <SankeyInner {...props}>
            {{ node: slots.node, link: slots.link }}
          </SankeyInner>
          {slots.default?.()}
        </RechartsWrapper>
      )
    }
  },
})

export const Sankey = _Sankey as typeof _Sankey & {
  new (): { $slots: SankeySlots }
}
