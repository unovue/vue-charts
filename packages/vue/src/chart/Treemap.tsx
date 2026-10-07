import type { ChartDataKey } from '@/types/base'
import { seriesColor, seriesForeground } from '@/utils/theme'
import { type EmitFn, type ExtractPropTypes, type PropType, type SlotsType, type VNode, type VNodeChild, computed, defineComponent, reactive, ref, toRaw, toRefs } from 'vue'
import { useCanMeasureText } from '@/model/runtime'
import { labelColor } from '@/utils/labelColor'
import type { Coordinate, DataKey } from '@/types'
import { getValueByDataKey } from '@/utils/chart'
import { toFiniteNumber } from '@/utils/validate'
import { chartEmits, chartListeners } from '@/events/componentEvents'
import { useTooltipController } from '@/model/tooltip'
import { chartSizeProps } from '@/hooks/useResponsiveSize'
import { useTrackedData } from '@/hooks/useTrackedData'
import type { ValueAnimationTransition } from 'motion-v'
import { labelOpacity } from '@/animation/ridingLabels'
import { cascadeReveal } from '@/animation/motion'
import { useKeyedTransition } from '@/animation/useKeyedTransition'
import { useAnimationCallbacks } from '@/animation/useAnimationCallbacks'
import { Layer } from '@/container/Layer'
import { getStringSize } from '@/utils/attrs'
import { ChartShell, useChartShell } from './ChartShell'
import { standaloneChartOptions } from './shell'
import type { TooltipPayloadConfiguration } from '@/types/tooltip'
import { type TreemapLayoutNode, computeTreemapLayout } from './treemapUtils'

interface TreemapData extends Record<string, unknown> {
  children?: TreemapData[]
}

export interface TreemapContentSlotProps extends TreemapLayoutNode {
  index: number
  fill: string
  stroke: string
}

export interface TreemapSlots {
  content?: (props: TreemapContentSlotProps) => VNodeChild
  default?: () => VNode[]
}

interface BreadcrumbEntry {
  name: string
  data: TreemapData[]
}

/**
 * Recursively sum all descendant values for a given dataKey.
 */
function sumValues(item: TreemapData, dataKey: DataKey<TreemapData>): number {
  if (item.children && item.children.length > 0) {
    return item.children.reduce((sum: number, child: TreemapData) => sum + sumValues(child, dataKey), 0)
  }
  const val = toFiniteNumber(getValueByDataKey(item, dataKey))
  return val != null && val > 0 ? val : 0
}

/** Each node's total by its tooltip path (`children[0].children[1]`); parents sum their leaves. */
function totalsByPath(items: readonly TreemapData[], dataKey: DataKey<TreemapData>, parent = '', totals: Record<string, number> = {}) {
  items.forEach((item, i) => {
    const path = `${parent}children[${i}]`
    totals[path] = sumValues(item, dataKey)
    if (item.children?.length)
      totalsByPath(item.children, dataKey, `${path}.`, totals)
  })
  return totals
}

const TreemapVueProps = {
  title: { type: String, default: 'Treemap' },
  desc: String,
  data: { type: Array as PropType<TreemapData[]>, required: true as const },
  dataKey: { type: [String, Number, Function] as PropType<ChartDataKey>, default: 'value' },
  nameKey: { type: [String, Number, Function] as PropType<ChartDataKey>, default: 'name' },
  tileAspectRatio: { type: Number, default: 4 / 3 },
  fill: { type: String, default: seriesColor(0) },
  stroke: { type: String, default: 'var(--v-charts-background, #fff)' },
  type: { type: String as PropType<'flat' | 'nest'>, default: 'flat' },
  colors: { type: Array as PropType<string[]>, default: undefined },
  isAnimationActive: { type: Boolean, default: true },
  transition: { type: Object as PropType<ValueAnimationTransition<number>>, default: undefined },
}

const treemapEmits = {
  'node-click': (_node: TreemapLayoutNode, _index: number, _event: MouseEvent | KeyboardEvent) => true,
  'node-mouseenter': (_node: TreemapLayoutNode, _index: number, _event: MouseEvent) => true,
  'node-mouseleave': (_node: TreemapLayoutNode, _index: number, _event: MouseEvent) => true,
  'animation-start': () => true,
  'animation-end': () => true,
}

function useTreemap(
  props: ExtractPropTypes<typeof TreemapVueProps> & { width: number, height: number },
  slots: TreemapSlots,
  emit: EmitFn<typeof treemapEmits>,
) {
  const tooltip = useTooltipController()
  const canMeasureText = useCanMeasureText()

  // Nest mode state
  const breadcrumbTrail = ref<BreadcrumbEntry[]>([])
  const currentData = ref<TreemapData[] | null>(null)
  const trackedData = useTrackedData(() => props.type === 'nest' ? currentData.value ?? props.data : props.data)

  const isNestMode = computed(() => props.type === 'nest')

  const nestCurrentData = computed(() => {
    if (!isNestMode.value)
      return null
    return trackedData.value ?? []
  })

  function computeNestLevelData(data: TreemapData[]): TreemapData[] {
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
      tileAspectRatio: props.tileAspectRatio,
      colors: props.colors,
    })
  })

  const nodePaths = computed(() => {
    const paths = new Map<object, string>()
    const visit = (data: TreemapData[], parent: string) => {
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
  const { items } = useKeyedTransition(() => nodes.value.map(node => ({ ...node, path: nodePaths.value.get(toRaw(node.payload)) ?? nodePaths.value.get(toRaw((trackedData.value ?? []).find(item => getValueByDataKey(item, props.nameKey) === node.name) ?? {})) ?? node.name, opacity: 1 })), {
    key: (node, index) => node.path || index,
    interpolate: (from, to, t) => ({
      ...to,
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      width: from.width + (to.width - from.width) * t,
      height: from.height + (to.height - from.height) * t,
      opacity: Math.min(1, Math.max(0, (from.opacity ?? 1) + ((to.opacity ?? 1) - (from.opacity ?? 1)) * t)),
    }),
    enterFrom: to => ({ ...to, x: to.x + to.width / 2, y: to.y + to.height / 2, width: 0, height: 0 }),
    exitTo: from => ({ ...from, x: from.x + from.width / 2, y: from.y + from.height / 2, width: 0, height: 0 }),
    reveal: () => cascadeReveal(nodes.value),
    isActive: () => props.isAnimationActive,
    transition: () => props.transition,
    onEnd: callbacks.onEnd,
    onStart: callbacks.onStart,
  })

  // Tooltip payloads are the caller's own nodes, addressed by path; totals come from layout.
  const tooltipTree = computed(() => {
    const data = isNestMode.value ? (nestCurrentData.value ?? []) : (trackedData.value ?? [])
    return { data: { children: data }, values: totalsByPath(data, props.dataKey) }
  })

  // Register tooltip entry settings (like Funnel/Scatter do)
  tooltip.entries.register(computed(() => {
    const tooltipEntrySettings: TooltipPayloadConfiguration = {
      dataDefinedOnItem: tooltipTree.value.data,
      values: tooltipTree.value.values,
      positions: undefined,
      keyboardItems: [...nodes.value].sort((a, b) =>
        a.y + a.height / 2 - b.y - b.height / 2
        || a.x + a.width / 2 - b.x - b.width / 2,
      ).map(node => ({
        identity: node.payload,
        index: nodes.value.indexOf(node),
        payloadKey: getTooltipIndex(node) ?? undefined,
        coordinate: { x: node.x + node.width / 2, y: node.y + node.height / 2 },
        onClick: event => handleNodeClick(node, nodes.value.indexOf(node), event),
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

  // The tooltip path of a layout node in the current data.
  function getTooltipIndex(node: TreemapLayoutNode): string | null {
    const data = isNestMode.value ? (nestCurrentData.value ?? []) : (trackedData.value ?? [])
    function findPath(items: TreemapData[], parent: string): string | null {
      for (const [index, item] of items.entries()) {
        const path = `${parent}children[${index}]`
        if (toRaw(item) === toRaw(node.payload)
          || (isNestMode.value && getValueByDataKey(item, props.nameKey) === node.name)) {
          return path
        }
        if (Array.isArray(item.children)) {
          const nested = findPath(item.children, `${path}.`)
          if (nested)
            return nested
        }
      }
      return null
    }
    return findPath(data, '')
  }

  function handleNestClick(node: TreemapLayoutNode, index: number, e: MouseEvent | KeyboardEvent) {
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
    return node.color ?? seriesColor(node.entryIndex)
  }

  function handleNodeMouseEnter(node: TreemapLayoutNode, index: number, e: MouseEvent) {
    const coordinate: Coordinate = {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2,
    }
    tooltip.activate('hover', {
      type: 'item',
      index: nodes.value.findIndex(candidate => toRaw(candidate.payload) === toRaw(node.payload)),
      dataKey: props.dataKey,
      coordinate,
    })
    emit('node-mouseenter', node, index, e)
  }

  function handleNodeMouseLeave(node: TreemapLayoutNode, index: number, e: MouseEvent) {
    tooltip.clear('hover')
    emit('node-mouseleave', node, index, e)
  }

  function handleNodeClick(node: TreemapLayoutNode, index: number, e: MouseEvent | KeyboardEvent) {
    if (isNestMode.value) {
      handleNestClick(node, index, e)
    }
    else {
      const coordinate: Coordinate = {
        x: node.x + node.width / 2,
        y: node.y + node.height / 2,
      }
      tooltip.activate('click', {
        type: 'item',
        index: nodes.value.findIndex(candidate => toRaw(candidate.payload) === toRaw(node.payload)),
        dataKey: props.dataKey,
        coordinate,
      })
      emit('node-click', node, index, e)
    }
  }

  // `opacity` is the entrance's fade, not part of the layout a custom content slot receives.
  function renderNode({ opacity, ...node }: TreemapLayoutNode & { opacity?: number }, index: number, key: PropertyKey, labelFade?: number) {
    const nodeFill = getNodeFill(node)
    const labelFill = node.color == null ? seriesForeground(node.entryIndex) : labelColor(nodeFill)
    const fade = opacity != null && opacity < 1 ? opacity : undefined

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
          opacity={fade}
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
            fill={labelFill}
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
            fill={labelFill}
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
        opacity={fade}
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
      <div class="v-charts-treemap-breadcrumb" style={{ color: 'var(--v-charts-text, #666)' }}>
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

  const renderChart = () => (
    <Layer data-slot="series" class="v-charts-treemap">
      {items.value.map((item, index) => renderNode(item.value, index, item.key, labelOpacity(item)))}
    </Layer>
  )
  return { renderChart, renderBreadcrumb }
}

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
  props: { ...TreemapVueProps, ...chartSizeProps },
  inheritAttrs: false,
  emits: { ...chartEmits, ...treemapEmits },
  slots: Object as SlotsType<TreemapSlots>,
  setup(props, { slots, emit, attrs }) {
    const size = useChartShell(props, standaloneChartOptions('Treemap'))
    function setupContent() {
      const { renderChart, renderBreadcrumb } = useTreemap(reactive({
        ...toRefs(props),
        width: size.effectiveWidth,
        height: size.effectiveHeight,
      }), slots, emit)
      return { svg: renderChart, before: renderBreadcrumb }
    }

    return () => {
      if (!props.data || props.data.length === 0)
        return null

      return (
        <ChartShell {...attrs} {...chartListeners(emit)} size={size} root="wrapper" setupContent={setupContent} accessibilityLayer title={props.title} desc={props.desc}>
          {{ default: slots.default }}
        </ChartShell>
      )
    }
  },
})
