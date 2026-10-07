import type { StandaloneChartProps } from './directChartTypes'
import type { ChartRenderContext, ChartVNode, RowDataKey } from '@/types/typed'
import { getValueByDataKey } from '@/utils/chart'
import { type PropType, type SlotsType, type VNode, computed, defineComponent, reactive } from 'vue'
import { type CellEvents, cellGridEmits, cellGridListeners, chartEmits, chartListeners } from '@/events/componentEvents'
import { chartSizeProps } from '@/hooks/useResponsiveSize'
import { useTrackedData } from '@/hooks/useTrackedData'
import { Layer } from '@/container/Layer'
import { ChartShell, useChartShell } from './ChartShell'
import { standaloneChartOptions } from './shell'
import { CellGridLayer, type CellGridSlots, cellGridSharedProps } from './CellGridLayer'
import { type GridCell, formatDay, toDayNumber } from './cellGridUtils'

/** Default fill per status. Every color reads a CSS variable first, so themes can restyle it. */
const trackerStatusColors: Record<string, string> = {
  up: 'var(--v-charts-status-up, #22c55e)',
  degraded: 'var(--v-charts-status-degraded, #f59e0b)',
  down: 'var(--v-charts-status-down, #ef4444)',
  maintenance: 'var(--v-charts-status-maintenance, #3b82f6)',
}

const trackerStatusLabels: Record<string, string> = {
  up: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
  maintenance: 'Maintenance',
}

const NO_DATA_COLOR = 'var(--v-charts-muted, #e5e5e5)'

export type TrackerRow = Record<string, unknown>

const TrackerVueProps = {
  ...cellGridSharedProps,
  /** One row per bar, oldest first. */
  data: { type: Array as PropType<TrackerRow[]>, required: true as const },
  /** The field holding the status (`up`, `degraded`, `down`, `maintenance` or your own). */
  dataKey: { type: [String, Number, Function] as PropType<RowDataKey<TrackerRow>>, default: 'status' },
  /** The field naming the bar, e.g. its date. It is also the bar's identity across updates. */
  nameKey: { type: [String, Number, Function] as PropType<RowDataKey<TrackerRow>>, default: 'date' },
  /** Fill per status, merged over the defaults. */
  statusColors: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  /** Readable text per status for tooltips and screen readers, merged over the defaults. */
  statusLabels: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  gap: { type: Number, default: 2 },
  /** Locale for dates in tooltips. Fixed by default so server and client render the same. */
  locale: { type: String, default: 'en-US' },
  desc: String,
  title: { type: String, default: 'Status history' },
}

export type TrackerSlots<Row = unknown> = CellGridSlots<Row> & { default?: () => VNode[] }
export type TrackerProps<Row = unknown> = StandaloneChartProps<InstanceType<typeof _Tracker>['$props'], CellEvents<NoInfer<Row>> & {
  data: readonly Row[]
  dataKey?: RowDataKey<NoInfer<Row>>
  nameKey?: RowDataKey<NoInfer<Row>>
}>

const _Tracker = defineComponent({
  name: 'Tracker',
  props: { ...TrackerVueProps, ...chartSizeProps },
  inheritAttrs: false,
  emits: { ...chartEmits, ...cellGridEmits },
  slots: Object as SlotsType<CellGridSlots<TrackerRow> & { default?: () => VNode[] }>,
  setup(props, { emit, slots, attrs }) {
    // A tracker is a strip: without a height or aspect it is 32px tall, not the 360px chart default.
    const size = useChartShell(reactive({
      width: computed(() => props.width),
      height: computed(() => props.height ?? (props.aspect ? undefined : 32)),
      aspect: computed(() => props.aspect),
      initialDimension: computed(() => props.initialDimension),
    }), standaloneChartOptions('Tracker'))
    const rows = useTrackedData(() => props.data)

    // `YYYY-MM-DD` and `Date` names read as dates ("Aug 21, 2026"); anything else as written.
    function labelOf(name: unknown, index: number) {
      if (name == null)
        return `#${index + 1}`
      const day = typeof name === 'string' || name instanceof Date ? toDayNumber(name) : undefined
      return day === undefined ? String(name) : formatDay(day, props.locale, { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const cells = computed<GridCell<TrackerRow>[]>(() => {
      const data = rows.value ?? []
      const width = size.effectiveWidth.value
      const height = size.effectiveHeight.value
      const count = data.length
      if (count === 0 || !(width > 0) || !(height > 0))
        return []
      // Bars narrower than 3px read better touching than with a gap.
      const gap = (width - props.gap * (count - 1)) / count >= 3 ? props.gap : 0
      const step = (width - gap * (count - 1)) / count
      const colors = { ...trackerStatusColors, ...props.statusColors }
      const labels = { ...trackerStatusLabels, ...props.statusLabels }
      const seen = new Map<string, number>()
      return data.map((row, index) => {
        const status = getValueByDataKey(row, props.dataKey)
        const name = getValueByDataKey(row, props.nameKey)
        const base = name == null ? `#${index}` : String(name)
        const repeat = seen.get(base) ?? 0
        seen.set(base, repeat + 1)
        return {
          key: repeat === 0 ? base : `${base}\u0000${repeat}`,
          x: index * (step + gap),
          y: 0,
          width: step,
          height,
          fill: status == null ? NO_DATA_COLOR : colors[status as string] ?? NO_DATA_COLOR,
          row: 0,
          column: index,
          label: labelOf(name, index),
          value: status == null ? 'No data' : labels[status as string] ?? String(status),
          payload: row,
        }
      })
    })

    return () => (
      <ChartShell {...attrs} {...chartListeners(emit)} size={size} title={props.title} desc={props.desc} overflow="visible">
        {{ svg: () => (
          <Layer class="v-charts-tracker">
            <CellGridLayer
              cells={cells.value}
              gap={props.gap}
              activeIndex={props.activeIndex}
              radius={props.radius}
              activeStyle="dim"
              grow="bottom"
              title={props.title}
              isAnimationActive={props.isAnimationActive}
              transition={props.transition}
              entrance="slide"
              {...cellGridListeners(emit)}
            >
              {{ cell: slots.cell }}
            </CellGridLayer>
          </Layer>
        ), default: slots.default }}
      </ChartShell>
    )
  },
})

/**
 * Uptime and status history: one bar per period, colored by status.
 *
 * ```vue
 * <Tracker :data="days" data-key="status" name-key="date"><Tooltip /></Tracker>
 * ```
 */
export const Tracker = _Tracker as unknown as <Row>(
  props: TrackerProps<Row>,
  context?: ChartRenderContext<TrackerSlots<Row>>,
) => ChartVNode<TrackerProps<Row>, TrackerSlots<Row>>
