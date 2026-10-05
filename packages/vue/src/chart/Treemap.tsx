import type { Coordinate, DataKey } from '@/types'
import { getValueByDataKey } from '@/utils/chart'
import { toFiniteNumber } from '@/utils/validate'
import { chartEmits, chartListeners } from '@/events/componentEvents'
import { provideChartContext, useChartTooltip } from '@/state/chartContext'
import { provideRenderPhase, useCanMeasureText } from '@/animation/renderPhase'
import { chartSizeProps, useResponsiveSize } from '@/hooks/useResponsiveSize'
import { useTrackedData } from '@/hooks/useTrackedData'
import { type PropType, type SlotsType, computed, defineComponent, ref, toRaw, watch } from 'vue'
import { get } from 'es-toolkit/compat'
import type { ValueAnimationTransition } from 'motion-dom'
import { labelOpacity } from '@/animation/ridingLabels'
import { useKeyedTransition } from '@/animation/useKeyedTransition'
import { useAnimationCallbacks } from '@/animation/useAnimationCallbacks'
import { Layer } from '@/container/Layer'
import Surface from '@/container/Surface'
import { getStringSize } from '@/utils/attrs'
import { ChartsWrapper } from './ChartsWrapper'
import type { ChartOptions } from '@/state/chartOptions'
import type { TooltipIndex, TooltipPayloadConfiguration, TooltipPayloadSearcher } from '@/state/chartTooltip'
import { type TreemapLayoutNode, computeTreemapLayout } from './treemapUtils'

const DEFAULT_COLORS = [
  '#8889DD',
  '#9597E4',
  '#8DC77B',
  '#A5D297',
  '#E2CF45',
  '#F8C12D',
  '#F89C24',
  '#F56E1A',
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
function sumValues(item: Record<string, any>, dataKey: DataKey<Record<string, any>>): number {
  if (item.children && item.children.length > 0) {
    return item.children.reduce((sum: number, child: Record<string, any>) => sum + sumValues(child, dataKey), 0)
  }
  const val = toFiniteNumber(getValueByDataKey(item, dataKey))
  return val != null && val > 0 ? val : 0
}

/**
 * Tooltip payload searcher for Treemap — navigates nested node structure
 * using a path string like 'children[0].children[1]'.
 */
export const treemapPayloadSearcher: TooltipPayloadSearcher = (
  data: unknown,
  activeIndex: TooltipIndex,
) => {
  if (!data || !activeIndex)
    return undefined
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
  dataKey: DataKey<Record<string, any>>,
  nameKey: DataKey<Record<string, any>>,
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
  dataKey: { type: [String, Number, Function] as PropType<DataKey<Record<string, any>>>, default: 'value' },
  nameKey: { type: [String, Number, Function] as PropType<DataKey<Record<string, any>>>, default: 'name' },
  width: { type: Number, required: true as const },
  height: { type: Number, required: true as const },
  aspectRatio: { type: Number, default: 4 / 3 },
  fill: { type: String, default: 'var(--v-charts-series, #808080)' },
  stroke: { type: String, default: 'var(--v-charts-background, #fff)' },
  type: { type: String as PropType<'flat' | 'nest'>, default: 'flat' },
  colorPanel: { type: Array as PropType<string[]>, default: undefined },
  isAnimationActive: { type: Boolean, default: true },
  transition: { type: Object as PropType<ValueAnimationTransition<number>>, default: undefined },
}

/**
 * Inner component that has access to chart-local Vue state (provided by Treemap wrapper).
 */
const treemapEmits = {
  'node-click': (_node: TreemapLayoutNode, _index: number, _event: MouseEvent) => true,
  'node-mouseenter': (_node: TreemapLayoutNode, _index: number, _event: MouseEvent) => true,
  'node-mouseleave': (_node: TreemapLayoutNode, _index: number, _event: MouseEvent) => true,
  'animation-start': () => true,
  'animation-end': () => true,
}

const TreemapInner = defineComponent({
  name: 'TreemapInner',
  props: TreemapVueProps,
  emits: treemapEmits,
  slots: Object as SlotsType<TreemapSlots>,
  setup(props, { slots, emit }) {
    const canMeasureText = useCanMeasureText()
    const tooltip = useChartTooltip()
    const colors = computed(() => props.colorPanel ?? DEFAULT_COLORS)

    // Nest mode state
    const breadcrumbTrail = ref<BreadcrumbEntry[]>([])
    const currentData = ref<Record<string, any>[] | null>(null)
    const trackedData = useTrackedData(() => props.type === 'nest' ? currentData.value ?? props.data : props.data)

    const isNestMode = computed(() => props.type === 'nest')

    const nestCurrentData = computed(() => {
      if (!isNestMode.value)
        return null
      return trackedData.value ?? []
    })

    function computeNestLevelData(data: Record<string, any>[]): Record<string, any>[] {
      return data.map((item) => {
        const aggregatedValue = sumValues(item, props.dataKey)
        const { children: _, ...rest } = item
        return { ...rest, value: aggregatedValue }
      })
    }

    const nodes = computed(() => {
      const dataToLayout = isNestMode.value
        ? computeNestLevelData(nestCurrentData.value ?? [])
        : (trackedData.value ?? [])

      return computeTreemapLayout({
        data: dataToLayout,
        width: props.width,
        height: props.height,
        dataKey: isNestMode.value ? 'value' : props.dataKey,
        nameKey: props.nameKey,
        aspectRatio: props.aspectRatio,
        colorPanel: colors.value,
      })
    })

    const nodePaths = computed(() => {
      const paths = new Map<object, string>()
      const visit = (data: Record<string, unknown>[], parent: string) => {
        data.forEach((item, index) => {
          const path = `${parent}/${String(getValueByDataKey(item, props.nameKey) ?? index)}`
          paths.set(toRaw(item), path)
          if (Array.isArray(item.children))
            visit(item.children, path)
        })
      }
      visit(props.data, 'root')
      return paths
    })
    const callbacks = useAnimationCallbacks(() => emit('animation-start'), () => emit('animation-end'))
    const { items } = useKeyedTransition(() => nodes.value.map(node => ({ ...node, path: nodePaths.value.get(toRaw(node.payload)) ?? nodePaths.value.get(toRaw((trackedData.value ?? []).find(item => getValueByDataKey(item, props.nameKey) === node.name) ?? {})) ?? node.name })), {
      key: (node, index) => node.path || index,
      interpolate: (from, to, t) => ({ ...to, x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, width: from.width + (to.width - from.width) * t, height: from.height + (to.height - from.height) * t }),
      enterFrom: to => ({ ...to, x: to.x + to.width / 2, y: to.y + to.height / 2, width: 0, height: 0 }),
      exitTo: from => ({ ...from, x: from.x + from.width / 2, y: from.y + from.height / 2, width: 0, height: 0 }),
      isActive: () => props.isAnimationActive,
      transition: () => props.transition,
      onEnd: callbacks.onEnd,
      onStart: callbacks.onStart,

    })

    // Build node tree for tooltip payload lookup
    const nodeTree = computed(() => {
      const data = isNestMode.value ? (nestCurrentData.value ?? []) : (trackedData.value ?? [])
      return buildNodeTree(data, props.dataKey, props.nameKey)
    })

    // Register tooltip entry settings (like Funnel/Scatter do)
    watch(computed(() => {
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
      return tooltipEntrySettings
    }), (tooltipEntrySettings, _previous, onCleanup) => {
      tooltip.addTooltipEntrySettings(tooltipEntrySettings)
      onCleanup(() => {
        tooltip.removeTooltipEntrySettings(tooltipEntrySettings)
      })
    }, { immediate: true })

    // Map layout node name → tooltipIndex from nodeTree
    function getTooltipIndex(node: TreemapLayoutNode): TooltipIndex {
      const data = isNestMode.value ? (nestCurrentData.value ?? []) : (trackedData.value ?? [])
      const idx = data.findIndex(item => getValueByDataKey(item, props.nameKey) === node.name)
      if (idx >= 0)
        return `children[${idx}]`
      // For flat mode with nested data, search leaves
      for (let i = 0; i < data.length; i++) {
        if (data[i].children) {
          const childIdx = data[i].children.findIndex((c: any) => getValueByDataKey(c, props.nameKey) === node.name)
          if (childIdx >= 0)
            return `children[${i}].children[${childIdx}]`
        }
      }
      return `children[0]`
    }

    function handleNestClick(node: TreemapLayoutNode, index: number, e: MouseEvent) {
      const sourceData = nestCurrentData.value ?? []
      const clickedItem = sourceData.find(item => getValueByDataKey(item, props.nameKey) === node.name)

      if (clickedItem?.children && clickedItem.children.length > 0) {
        breadcrumbTrail.value = [
          ...breadcrumbTrail.value,
          { name: getValueByDataKey(clickedItem, props.nameKey) ?? clickedItem.name, data: sourceData },
        ]
        currentData.value = clickedItem.children
      }

      emit('node-click', node, index, e)
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
    }

    function getNodeFill(node: TreemapLayoutNode) {
      return node.color ?? props.fill
    }

    function handleNodeMouseEnter(node: TreemapLayoutNode, index: number, e: MouseEvent) {
      const tooltipIndex = getTooltipIndex(node)
      const activeCoordinate: Coordinate = {
        x: node.x + node.width / 2,
        y: node.y + node.height / 2,
      }
      tooltip.setActiveMouseOverItemIndex({
        activeIndex: tooltipIndex,
        activeDataKey: props.dataKey,
        activeCoordinate,
      })
      emit('node-mouseenter', node, index, e)
    }

    function handleNodeMouseLeave(node: TreemapLayoutNode, index: number, e: MouseEvent) {
      tooltip.mouseLeaveItem()
      emit('node-mouseleave', node, index, e)
    }

    function handleNodeClick(node: TreemapLayoutNode, index: number, e: MouseEvent) {
      if (isNestMode.value) {
        handleNestClick(node, index, e)
      }
      else {
        const tooltipIndex = getTooltipIndex(node)
        const activeCoordinate: Coordinate = {
          x: node.x + node.width / 2,
          y: node.y + node.height / 2,
        }
        tooltip.setActiveClickItemIndex({
          activeIndex: tooltipIndex,
          activeDataKey: props.dataKey,
          activeCoordinate,
        })
        emit('node-click', node, index, e)
      }
    }

    function renderNode(node: TreemapLayoutNode, index: number, key: PropertyKey, labelFade?: number) {
      const nodeFill = getNodeFill(node)

      const nodeProps: TreemapContentSlotProps = {
        ...node,
        index,
        fill: nodeFill,
        stroke: props.stroke,
      }

      if (slots.content) {
        return (
          <g
            key={key}
            class="v-charts-treemap-node"
            style={{ transformOrigin: `${node.x}px ${node.y}px` }}
            onClick={(e: MouseEvent) => handleNodeClick(node, index, e)}
            onMouseenter={(e: MouseEvent) => handleNodeMouseEnter(node, index, e)}
            onMouseleave={(e: MouseEvent) => handleNodeMouseLeave(node, index, e)}
          >
            {slots.content(nodeProps)}
          </g>
        )
      }

      // Check if this node has children in the original source data (for nest mode arrow)
      const hasChildren = isNestMode.value && (() => {
        const sourceData = nestCurrentData.value ?? []
        const item = sourceData.find(d => getValueByDataKey(d, props.nameKey) === node.name)
        return item?.children && item.children.length > 0
      })()

      // Arrow indicator for nest mode nodes with children
      const arrow = hasChildren && node.width > 10 && node.height > 10
        ? (
            <polygon
              points={`${node.x + 2},${node.y + node.height / 2} ${node.x + 6},${node.y + node.height / 2 + 3} ${node.x + 2},${node.y + node.height / 2 + 6}`}
              fill="var(--v-charts-background, #fff)"
            />
          )
        : null

      // Text label — only render if text fits within node bounds
      const nameSize = node.width > 20 && node.height > 20
        ? getStringSize(node.name, { fontSize: '14px' }, canMeasureText.value)
        : { width: Infinity, height: Infinity }
      const text = node.width > 20 && node.height > 20 && nameSize.width < node.width && nameSize.height < node.height
        ? (
            <text
              x={node.x + 8}
              y={node.y + node.height / 2 + 7}
              fill="var(--v-charts-background, #fff)"
              font-size={14}
              opacity={labelFade}
            >
              {node.name}
            </text>
          )
        : null

      return (
        <g
          key={key}
          class="v-charts-treemap-node"
          style={{ transformOrigin: `${node.x}px ${node.y}px` }}
          onClick={(e: MouseEvent) => handleNodeClick(node, index, e)}
          onMouseenter={(e: MouseEvent) => handleNodeMouseEnter(node, index, e)}
          onMouseleave={(e: MouseEvent) => handleNodeMouseLeave(node, index, e)}
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
      if (!isNestMode.value || breadcrumbTrail.value.length === 0)
        return null

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
        <Surface width={props.width} height={props.height} style={{ width: '100%', height: '100%' }}>
          <Layer class="v-charts-treemap">
            {items.value.map((item, index) => renderNode(item.value, index, item.key, labelOpacity(item)))}
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
const _Treemap = defineComponent({
  name: 'Treemap',
  props: { ...TreemapVueProps, ...chartSizeProps },
  inheritAttrs: false,
  emits: { ...chartEmits, ...treemapEmits },
  slots: Object as SlotsType<TreemapSlots>,
  setup(props, { slots, emit }) {
    provideChartContext(treemapOptions)
    provideRenderPhase()
    const { effectiveWidth, effectiveHeight, isResponsive, measured, handleResize, boxStyle } = useResponsiveSize(props)

    return () => {
      const { aspect, initialDimension, ...innerProps } = props
      if (!props.data || props.data.length === 0)
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
          <TreemapInner {...{ 'onNode-click': (entry, index, event) => emit('node-click', entry, index, event) }} {...{ 'onNode-mouseenter': (entry, index, event) => emit('node-mouseenter', entry, index, event) }} {...{ 'onNode-mouseleave': (entry, index, event) => emit('node-mouseleave', entry, index, event) }} {...{ 'onAnimation-start': () => emit('animation-start') }} {...{ 'onAnimation-end': () => emit('animation-end') }} {...innerProps} width={effectiveWidth.value} height={effectiveHeight.value}>
            {{ content: slots.content }}
          </TreemapInner>
          {slots.default?.()}
        </ChartsWrapper>
      )
    }
  },
})

// Preserve template slot inference in published declarations.
export const Treemap: typeof _Treemap & { new (): { $slots: TreemapSlots } } = _Treemap
