import { type PropType, type SlotsType, computed, defineComponent, reactive } from 'vue'
import { chartEmits, chartListeners } from '@/events/componentEvents'
import { provideChartContext } from '@/state/chartContext'
import { provideRenderPhase } from '@/animation/renderPhase'
import { chartSizeProps, useResponsiveSize } from '@/hooks/useResponsiveSize'
import { useTrackedData } from '@/hooks/useTrackedData'
import { Layer } from '@/container/Layer'
import Surface from '@/container/Surface'
import { ChartsWrapper } from './ChartsWrapper'
import { CellGridLayer, type CellGridSlots, boxAttrs, cellChartOptions, cellGridEmits, cellGridSharedProps, rootAttrs } from './CellGridLayer'
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

export type TrackerRow = Record<string, any>

export const TrackerVueProps = {
  ...cellGridSharedProps,
  /** One row per bar, oldest first. */
  data: { type: Array as PropType<TrackerRow[]>, required: true as const },
  /** The field holding the status (`up`, `degraded`, `down`, `maintenance` or your own). */
  dataKey: { type: String, default: 'status' },
  /** The field naming the bar, e.g. its date. It is also the bar's identity across updates. */
  nameKey: { type: String, default: 'date' },
  /** Fill per status, merged over the defaults. */
  colors: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  /** Readable text per status for tooltips and screen readers, merged over the defaults. */
  labels: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  gap: { type: Number, default: 2 },
  /** Locale for dates in tooltips. Fixed by default so server and client render the same. */
  locale: { type: String, default: 'en-US' },
  ariaLabel: { type: String, default: 'Status history' },
}

const _Tracker = defineComponent({
  name: 'Tracker',
  props: { ...TrackerVueProps, ...chartSizeProps },
  inheritAttrs: false,
  emits: { ...chartEmits, ...cellGridEmits },
  slots: Object as SlotsType<CellGridSlots<TrackerRow> & { default?: () => any }>,
  setup(props, { emit, slots, attrs }) {
    provideChartContext(cellChartOptions('Tracker'))
    provideRenderPhase()
    // A tracker is a strip: without a height or aspect it is 32px tall, not the 360px chart default.
    const size = useResponsiveSize(reactive({
      width: computed(() => props.width),
      height: computed(() => props.height ?? (props.aspect ? undefined : 32)),
      aspect: computed(() => props.aspect),
      initialDimension: computed(() => props.initialDimension),
    }))
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
      const colors = { ...trackerStatusColors, ...props.colors }
      const labels = { ...trackerStatusLabels, ...props.labels }
      const seen = new Map<string, number>()
      return data.map((row, index) => {
        const status = row?.[props.dataKey]
        const name = row?.[props.nameKey]
        const base = name == null ? `#${index}` : String(name)
        const repeat = seen.get(base) ?? 0
        seen.set(base, repeat + 1)
        return {
          key: repeat === 0 ? base : `${base}\u0000${repeat}`,
          x: index * (step + gap),
          y: 0,
          width: step,
          height,
          fill: status == null ? NO_DATA_COLOR : colors[status] ?? NO_DATA_COLOR,
          row: 0,
          column: index,
          label: labelOf(name, index),
          value: status == null ? 'No data' : labels[status] ?? String(status),
          payload: row,
        }
      })
    })

    return () => (
      <ChartsWrapper {...boxAttrs(attrs)} {...chartListeners(emit)} isResponsive={size.isResponsive.value} boxStyle={size.boxStyle.value} interactive={!size.isResponsive.value || size.measured.value} onResize={size.handleResize} width={size.effectiveWidth.value} height={size.effectiveHeight.value}>
        <Surface {...rootAttrs(attrs)} width={size.effectiveWidth.value} height={size.effectiveHeight.value} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <Layer class="v-charts-tracker">
            <CellGridLayer
              cells={cells.value}
              gap={props.gap}
              radius={props.radius}
              activeStyle="dim"
              grow="bottom"
              ariaLabel={props.ariaLabel}
              isAnimationActive={props.isAnimationActive}
              transition={props.transition}
              {...{
                'onCell-click': (payload: unknown, index: number, event: MouseEvent) => emit('cell-click', payload, index, event),
                'onCell-mouseenter': (payload: unknown, index: number, event: MouseEvent) => emit('cell-mouseenter', payload, index, event),
                'onCell-mouseleave': (payload: unknown, index: number, event: MouseEvent) => emit('cell-mouseleave', payload, index, event),
                'onAnimation-start': () => emit('animation-start'),
                'onAnimation-end': () => emit('animation-end'),
              }}
            >
              {{ cell: slots.cell }}
            </CellGridLayer>
          </Layer>
        </Surface>
        {slots.default?.()}
      </ChartsWrapper>
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
export const Tracker = _Tracker as typeof _Tracker & {
  new (): { $slots: CellGridSlots<TrackerRow> & { default?: () => any } }
}
