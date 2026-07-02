import { computed, defineComponent, type PropType, ref, type SlotsType, watchEffect } from 'vue'
import { get } from 'lodash-es'
import type { AnimationOptions } from 'motion-v'
import { provideStore } from '@reduxjs/vue-redux'
import { Animate } from '@/animation/Animate'
import { Layer } from '@/container/Layer'
import Surface from '@/container/Surface'
import { getStringSize } from '@/utils/attrs'
import { ChartsWrapper } from './ChartsWrapper'
import { createRechartsStore } from '@/state/store'
import { useAppDispatch } from '@/state/hooks'
import { setActiveMouseOverItemIndex, setActiveClickItemIndex, mouseLeaveItem, addTooltipEntrySettings, removeTooltipEntrySettings } from '@/state/tooltipSlice'
import type { ChartOptions } from '@/state/optionsSlice'
import type { TooltipPayloadSearcher } from '@/state/tooltipSlice'
import type { TooltipIndex, TooltipPayloadConfiguration } from '@/state/tooltipSlice'
import type { Coordinate } from '@/types'
import { computeTreemapLayout, type TreemapLayoutNode } from './treemapUtils'

const DEFAULT_COLORS = [
  '#8889DD', '#9597E4', '#8DC77B', '#A5D297',
  '#E2CF45', '#F8C12D', '#F89C24', '#F56E1A',
]

export interface TreemapContentSlotProps extends TreemapLayoutNode {
  index: number
  fill: string
  stroke: string
}

export interface TreemapSlots {
  content?: (props: TreemapContentSlotProps) => any
  default?: () => any
}

interface BreadcrumbEntry {
  name: string
  data: Record<string, any>[]
}

/**
 * Recursively sum all descendant values for a given dataKey.
 */
function sumValues(item: Record<string, any>, dataKey: string): number {
  if (item.children && item.children.length > 0) {
    return item.children.reduce((sum: number, child: Record<string, any>) => sum + sumValues(child, dataKey), 0)
  }
  const val = item[dataKey]
  return typeof val === 'number' && val > 0 ? val : 0
}

/**
 * Tooltip payload searcher for Treemap — navigates nested node structure
 * using a path string like 'children[0].children[1]'.
 */
export const treemapPayloadSearcher: TooltipPayloadSearcher = (
  data: unknown,
  activeIndex: TooltipIndex,
) => {
  if (!data || !activeIndex) return undefined
  return get(data, activeIndex)
}

const treemapOptions: ChartOptions = {
  chartName: 'Treemap',
  defaultTooltipEventType: 'item',
  validateTooltipEventTypes: ['item'],
  tooltipPayloadSearcher: treemapPayloadSearcher,
  eventEmitter: undefined,
}

/**
 * Build a hierarchical node structure with tooltipIndex paths for tooltip lookup.
 */
function buildNodeTree(
  data: Record<string, any>[],
  dataKey: string,
  nameKey: string,
  parentIndex: string = '',
): Record<string, any> {
  const children = data.map((item, i) => {
    const tooltipIndex = `${parentIndex}children[${i}]`
    if (item.children && item.children.length > 0) {
      const childTree = buildNodeTree(item.children, dataKey, nameKey, `${tooltipIndex}.`)
      return {
        ...item,
        tooltipIndex,
        ...childTree,
      }
    }
    return {
      ...item,
      tooltipIndex,
      value: sumValues(item, dataKey),
    }
  })
  return { children, name: 'root', tooltipIndex: parentIndex }
}

export const TreemapVueProps = {
  data: { type: Array as PropType<Record<string, any>[]>, required: true as const },
  dataKey: { type: String, default: 'value' },
  nameKey: { type: String, default: 'name' },
  width: { type: Number, required: true as const },
  height: { type: Number, required: true as const },
  aspectRatio: { type: Number, default: 4 / 3 },
  fill: { type: String, default: '#808080' },
  stroke: { type: String, default: '#fff' },
  type: { type: String as PropType<'flat' | 'nest'>, default: 'flat' },
  colorPanel: { type: Array as PropType<string[]>, default: undefined },
  isAnimationActive: { type: Boolean, default: true },
  transition: { type: Object as PropType<AnimationOptions>, default: () => ({ duration: 0.8, ease: 'easeOut' as const }) },
  onClick: { type: Function as PropType<(node: any, e: MouseEvent) => void>, default: undefined },
  onMouseEnter: { type: Function as PropType<(node: any, e: MouseEvent) => void>, default: undefined },
  onMouseLeave: { type: Function as PropType<(node: any, e: MouseEvent) => void>, default: undefined },
}

/**
 * Inner component that has access to the Redux store (provided by Treemap wrapper).
 */
const TreemapInner = defineComponent({
  name: 'TreemapInner',
  props: TreemapVueProps,
  slots: Object as SlotsType<TreemapSlots>,
  setup(props, { slots }) {
    const dispatch = useAppDispatch()
    const colors = computed(() => props.colorPanel ?? DEFAULT_COLORS)

    // Nest mode state
    const breadcrumbTrail = ref<BreadcrumbEntry[]>([])
    const currentData = ref<Record<string, any>[] | null>(null)
    // Increment to re-trigger entrance animation on nest navigation
    const animationKey = ref(0)

    const isNestMode = computed(() => props.type === 'nest')

    const nestCurrentData = computed(() => {
      if (!isNestMode.value) return null
      return currentData.value ?? props.data
    })

    function computeNestLevelData(data: Record<string, any>[]): Record<string, any>[] {
      return data.map((item) => {
        const aggregatedValue = sumValues(item, props.dataKey)
        const { children: _, ...rest } = item
        return { ...rest, [props.dataKey]: aggregatedValue }
      })
    }

    const nodes = computed(() => {
      const dataToLayout = isNestMode.value
        ? computeNestLevelData(nestCurrentData.value ?? props.data)
        : props.data

      return computeTreemapLayout({
        data: dataToLayout,
        width: props.width,
        height: props.height,
        dataKey: props.dataKey,
        nameKey: props.nameKey,
        aspectRatio: props.aspectRatio,
        colorPanel: colors.value,
      })
    })

    // Build node tree for tooltip payload lookup
    const nodeTree = computed(() => {
      const data = isNestMode.value ? (nestCurrentData.value ?? props.data) : props.data
      return buildNodeTree(data, props.dataKey, props.nameKey)
    })

    // Register tooltip entry settings (like Funnel/Scatter do)
    watchEffect((onCleanup) => {
      const tooltipEntrySettings: TooltipPayloadConfiguration = {
        dataDefinedOnItem: nodeTree.value,
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
      dispatch(addTooltipEntrySettings(tooltipEntrySettings))
      onCleanup(() => {
        dispatch(removeTooltipEntrySettings(tooltipEntrySettings))
      })
    })

    // Map layout node name → tooltipIndex from nodeTree
    function getTooltipIndex(node: TreemapLayoutNode): TooltipIndex {
      const data = isNestMode.value ? (nestCurrentData.value ?? props.data) : props.data
      const idx = data.findIndex(item => item[props.nameKey] === node.name)
      if (idx >= 0) return `children[${idx}]`
      // For flat mode with nested data, search leaves
      for (let i = 0; i < data.length; i++) {
        if (data[i].children) {
          const childIdx = data[i].children.findIndex((c: any) => c[props.nameKey] === node.name)
          if (childIdx >= 0) return `children[${i}].children[${childIdx}]`
        }
      }
      return `children[0]`
    }

    function handleNestClick(node: TreemapLayoutNode, e: MouseEvent) {
      const sourceData = nestCurrentData.value ?? props.data
      const clickedItem = sourceData.find(item => item[props.nameKey] === node.name)

      if (clickedItem?.children && clickedItem.children.length > 0) {
        breadcrumbTrail.value = [
          ...breadcrumbTrail.value,
          { name: clickedItem[props.nameKey] ?? clickedItem.name, data: sourceData },
        ]
        currentData.value = clickedItem.children
        animationKey.value++
      }

      props.onClick?.(node, e)
    }

    function navigateToBreadcrumb(index: number) {
      if (index < 0) {
        currentData.value = null
        breadcrumbTrail.value = []
      }
      else {
        const entry = breadcrumbTrail.value[index]
        currentData.value = entry.data
        breadcrumbTrail.value = breadcrumbTrail.value.slice(0, index)
      }
      animationKey.value++
    }

    function getNodeFill(node: TreemapLayoutNode) {
      return node.color ?? props.fill
    }

    function handleNodeMouseEnter(node: TreemapLayoutNode, e: MouseEvent) {
      const tooltipIndex = getTooltipIndex(node)
      const activeCoordinate: Coordinate = {
        x: node.x + node.width / 2,
        y: node.y + node.height / 2,
      }
      dispatch(setActiveMouseOverItemIndex({
        activeIndex: tooltipIndex,
        activeDataKey: props.dataKey,
        activeCoordinate,
      }))
      props.onMouseEnter?.(node, e)
    }

    function handleNodeMouseLeave(node: TreemapLayoutNode, e: MouseEvent) {
      dispatch(mouseLeaveItem())
      props.onMouseLeave?.(node, e)
    }

    function handleNodeClick(node: TreemapLayoutNode, e: MouseEvent) {
      if (isNestMode.value) {
        handleNestClick(node, e)
      }
      else {
        const tooltipIndex = getTooltipIndex(node)
        const activeCoordinate: Coordinate = {
          x: node.x + node.width / 2,
          y: node.y + node.height / 2,
        }
        dispatch(setActiveClickItemIndex({
          activeIndex: tooltipIndex,
          activeDataKey: props.dataKey,
          activeCoordinate,
        }))
        props.onClick?.(node, e)
      }
    }

    function renderNodeAtProgress(node: TreemapLayoutNode, index: number, progress: number) {
      const nodeFill = getNodeFill(node)

      // Slide-in from left (matching Recharts): translate from (-x - width, 0) to (0, 0)
      const translateX = (-node.x - node.width) * (1 - progress)
      const transform = progress < 1 ? `translate(${translateX}, 0)` : undefined

      const nodeProps: TreemapContentSlotProps = {
        ...node,
        index,
        fill: nodeFill,
        stroke: props.stroke,
      }

      if (slots.content) {
        return (
          <g
            key={`node-${index}`}
            class="v-charts-treemap-node"
            style={{ transformOrigin: `${node.x}px ${node.y}px` }}
            transform={transform}
            onClick={(e: MouseEvent) => handleNodeClick(node, e)}
            onMouseenter={(e: MouseEvent) => handleNodeMouseEnter(node, e)}
            onMouseleave={(e: MouseEvent) => handleNodeMouseLeave(node, e)}
          >
            {slots.content(nodeProps)}
          </g>
        )
      }

      // Check if this node has children in the original source data (for nest mode arrow)
      const hasChildren = isNestMode.value && (() => {
        const sourceData = nestCurrentData.value ?? props.data
        const item = sourceData.find(d => d[props.nameKey] === node.name)
        return item?.children && item.children.length > 0
      })()

      // Arrow indicator for nest mode nodes with children
      const arrow = hasChildren && node.width > 10 && node.height > 10
        ? (
            <polygon
              points={`${node.x + 2},${node.y + node.height / 2} ${node.x + 6},${node.y + node.height / 2 + 3} ${node.x + 2},${node.y + node.height / 2 + 6}`}
              fill="#fff"
            />
          )
        : null

      // Text label — only render if text fits within node bounds
      const nameSize = node.width > 20 && node.height > 20
        ? getStringSize(node.name, { fontSize: '14px' })
        : { width: Infinity, height: Infinity }
      const text = node.width > 20 && node.height > 20 && nameSize.width < node.width && nameSize.height < node.height
        ? (
            <text
              x={node.x + 8}
              y={node.y + node.height / 2 + 7}
              fill="#fff"
              font-size={14}
            >
              {node.name}
            </text>
          )
        : null

      return (
        <g
          key={`node-${index}`}
          class="v-charts-treemap-node"
          style={{ transformOrigin: `${node.x}px ${node.y}px` }}
          transform={transform}
          onClick={(e: MouseEvent) => handleNodeClick(node, e)}
          onMouseenter={(e: MouseEvent) => handleNodeMouseEnter(node, e)}
          onMouseleave={(e: MouseEvent) => handleNodeMouseLeave(node, e)}
        >
          <rect
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            fill={nodeFill}
            stroke={props.stroke}
          />
          {arrow}
          {text}
        </g>
      )
    }

    function renderBreadcrumb() {
      if (!isNestMode.value || breadcrumbTrail.value.length === 0) return null

      return (
        <div class="v-charts-treemap-breadcrumb">
          <span
            class="v-charts-treemap-breadcrumb-item"
            style={{ cursor: 'pointer' }}
            onClick={() => navigateToBreadcrumb(-1)}
          >
            Root
          </span>
          {breadcrumbTrail.value.map((entry, i) => (
            <span key={i}>
              <span style={{ margin: '0 4px' }}>/</span>
              <span
                class="v-charts-treemap-breadcrumb-item"
                style={{ cursor: 'pointer' }}
                onClick={() => navigateToBreadcrumb(i)}
              >
                {entry.name}
              </span>
            </span>
          ))}
        </div>
      )
    }

    return () => (
      <>
        {renderBreadcrumb()}
        <Surface width={props.width} height={props.height}>
          <Layer class="v-charts-treemap">
            <Animate
              key={animationKey.value}
              isActive={props.isAnimationActive}
              from={0}
              to={1}
              transition={props.transition}
            >
              {(progress: number) =>
                nodes.value.map((node, index) =>
                  renderNodeAtProgress(node, index, progress),
                )}
            </Animate>
          </Layer>
        </Surface>
      </>
    )
  },
})

/**
 * Treemap chart — hierarchical data visualization using nested rectangles.
 *
 * Supports `<Tooltip>` as a child component (same pattern as BarChart, LineChart, etc.).
 *
 * Usage:
 * ```vue
 * <Treemap :data="data" data-key="value" :width="600" :height="400">
 *   <Tooltip />
 * </Treemap>
 * ```
 */
export const Treemap = defineComponent({
  name: 'Treemap',
  props: TreemapVueProps,
  slots: Object as SlotsType<TreemapSlots>,
  setup(props, { slots }) {
    const store = createRechartsStore({ options: treemapOptions }, 'Treemap')
    provideStore({ store })

    return () => {
      if (!props.data || props.data.length === 0) return null

      return (
        <ChartsWrapper
          width={props.width}
          height={props.height}
        >
          <TreemapInner {...props}>
            {{ content: slots.content }}
          </TreemapInner>
          {slots.default?.()}
        </ChartsWrapper>
      )
    }
  },
})
