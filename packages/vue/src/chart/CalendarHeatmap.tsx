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
import { type GridCell, dayNumberToIso, formatDay, levelColors, levelOf, toDayNumber, weekdayOf } from './cellGridUtils'

export interface CalendarDay {
  /** `YYYY-MM-DD`. */
  date: string
  /** Sum of the values on this day; `null` when no row has this date. */
  value: number | null
  level: number
}

type DateInput = string | Date

const MONTH_BAND = 16
const WEEKDAY_BAND = 28
/** Nominal cell step, only used to pick the default aspect ratio. */
const NOMINAL_STEP = 14

export const CalendarHeatmapVueProps = {
  ...cellGridSharedProps,
  data: { type: Array as PropType<Record<string, any>[]>, required: true as const },
  /** The field holding the day: a `YYYY-MM-DD` string or a `Date` (its local calendar date). */
  dateKey: { type: String, default: 'date' },
  /** The field holding the number to color by. Rows with the same day are summed. */
  dataKey: { type: String, default: 'value' },
  /** First day shown. Defaults to 52 weeks before `end`. */
  start: { type: [String, Date] as PropType<DateInput>, default: undefined },
  /** Last day shown. Defaults to the latest day in `data`, so server and client agree. */
  end: { type: [String, Date] as PropType<DateInput>, default: undefined },
  /** 0 = Sunday (GitHub), 1 = Monday (ISO). */
  weekStart: { type: Number as PropType<0 | 1 | 2 | 3 | 4 | 5 | 6>, default: 0 },
  /** Full-intensity color; lower levels mix it with `emptyColor`. */
  color: { type: String, default: 'var(--v-charts-series, #16a34a)' },
  emptyColor: { type: String, default: 'var(--v-charts-muted, #ebedf0)' },
  /** Number of intensity steps above empty. */
  levels: { type: Number, default: 4 },
  /** Explicit fill per level, from empty to full; overrides `color`, `emptyColor` and `levels`. */
  colors: { type: Array as PropType<string[]>, default: undefined },
  /** Value that reaches the top level. Defaults to the largest value in range. */
  max: { type: Number, default: undefined },
  gap: { type: Number, default: 3 },
  /** Locale for month, weekday and date text. Fixed by default so server and client render the same. */
  locale: { type: String, default: 'en-US' },
  monthLabels: { type: Boolean, default: true },
  weekdayLabels: { type: Boolean, default: true },
  ariaLabel: { type: String, default: 'Activity calendar' },
}

const _CalendarHeatmap = defineComponent({
  name: 'CalendarHeatmap',
  props: { ...CalendarHeatmapVueProps, ...chartSizeProps },
  inheritAttrs: false,
  emits: { ...chartEmits, ...cellGridEmits },
  slots: Object as SlotsType<CellGridSlots<CalendarDay> & { default?: () => any }>,
  setup(props, { emit, slots, attrs }) {
    provideChartContext(cellChartOptions('CalendarHeatmap'))
    provideRenderPhase()
    const rows = useTrackedData(() => props.data)

    const valuesByDay = computed(() => {
      const values = new Map<number, number>()
      for (const row of rows.value ?? []) {
        const day = toDayNumber(row?.[props.dateKey])
        const value = Number(row?.[props.dataKey])
        if (day === undefined || !Number.isFinite(value))
          continue
        values.set(day, (values.get(day) ?? 0) + value)
      }
      return values
    })

    const range = computed(() => {
      let latest: number | undefined
      for (const day of valuesByDay.value.keys())
        latest = latest === undefined || day > latest ? day : latest
      const end = toDayNumber(props.end) ?? latest
      if (end === undefined)
        return undefined
      const start = toDayNumber(props.start) ?? end - 52 * 7 - weekdayOffset(end)
      return start <= end ? { start, end } : undefined
    })

    function weekdayOffset(day: number) {
      return (weekdayOf(day) - props.weekStart + 7) % 7
    }

    const columns = computed(() => {
      const r = range.value
      return r ? Math.floor((r.end - (r.start - weekdayOffset(r.start))) / 7) + 1 : 0
    })
    const left = computed(() => props.weekdayLabels ? WEEKDAY_BAND : 0)
    const top = computed(() => props.monthLabels ? MONTH_BAND : 0)

    // Without a height or aspect, keep cells roughly square at any width.
    const size = useResponsiveSize(reactive({
      width: computed(() => props.width),
      height: computed(() => props.height),
      aspect: computed(() => props.aspect ?? (props.height === undefined ? (left.value + Math.max(columns.value, 1) * NOMINAL_STEP) / (top.value + 7 * NOMINAL_STEP) : undefined)),
      initialDimension: computed(() => props.initialDimension),
    }))

    const layout = computed(() => {
      const r = range.value
      const width = size.effectiveWidth.value
      const height = size.effectiveHeight.value
      if (!r || !(width > 0) || !(height > 0))
        return { cells: [] as GridCell<CalendarDay>[], months: [] as { x: number, text: string }[], weekdays: [] as { y: number, text: string }[], step: 0 }
      const step = Math.max(0, Math.min((width - left.value) / columns.value, (height - top.value) / 7))
      const gap = Math.min(props.gap, step / 3)
      const cellSize = step - gap
      const firstColumn = r.start - weekdayOffset(r.start)
      const values = valuesByDay.value
      let max = props.max
      if (max === undefined) {
        max = 0
        for (const [day, value] of values) {
          if (day >= r.start && day <= r.end && value > max)
            max = value
        }
      }
      const levels = props.colors?.length ? props.colors.length - 1 : Math.max(1, Math.floor(props.levels))
      const fills = props.colors?.length ? props.colors : levelColors(props.color, props.emptyColor, levels)
      const dateFormat = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' } as const

      const cells: GridCell<CalendarDay>[] = []
      const months: { column: number, text: string }[] = []
      for (let day = r.start; day <= r.end; day++) {
        const column = Math.floor((day - firstColumn) / 7)
        const row = weekdayOffset(day)
        const value = values.get(day) ?? null
        const level = value === null ? 0 : levelOf(value, max, levels)
        const iso = dayNumberToIso(day)
        cells.push({
          key: iso,
          x: left.value + column * step,
          y: top.value + row * step,
          width: cellSize,
          height: cellSize,
          fill: fills[level],
          row,
          column,
          label: formatDay(day, props.locale, dateFormat),
          value,
          payload: { date: iso, value, level },
        })
        // A month is labelled at the first column whose top cell belongs to it.
        if (iso.endsWith('-01') || day === r.start) {
          const labelColumn = row === 0 ? column : column + 1
          if (labelColumn < columns.value)
            months.push({ column: labelColumn, text: formatDay(day, props.locale, { month: 'short' }) })
        }
      }
      // Drop a label that would collide with the next one (usually a partial first month).
      const visibleMonths = months.filter((month, i) => i === months.length - 1 || months[i + 1].column - month.column >= 3)
      const weekdays = props.weekdayLabels
        // Monday, Wednesday and Friday, wherever the week start puts them. 1970-01-04 (day 3) was a Sunday.
        ? [1, 3, 5].map(weekday => ({
            y: top.value + ((weekday - props.weekStart + 7) % 7) * step + cellSize / 2,
            text: formatDay(3 + weekday, props.locale, { weekday: 'short' }),
          }))
        : []
      return {
        cells,
        months: props.monthLabels ? visibleMonths.map(month => ({ x: left.value + month.column * step, text: month.text })) : [],
        weekdays,
        step,
      }
    })

    const textStyle = { fill: 'var(--v-charts-text, #666)', fontSize: '10px' }

    return () => (
      <ChartsWrapper {...boxAttrs(attrs)} {...chartListeners(emit)} isResponsive={size.isResponsive.value} boxStyle={size.boxStyle.value} interactive={!size.isResponsive.value || size.measured.value} onResize={size.handleResize} width={size.effectiveWidth.value} height={size.effectiveHeight.value}>
        <Surface {...rootAttrs(attrs)} width={size.effectiveWidth.value} height={size.effectiveHeight.value} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <Layer class="v-charts-calendar">
            <g class="v-charts-calendar-months" aria-hidden="true">
              {layout.value.months.map(month => (
                <text key={`${month.text}-${month.x}`} x={month.x} y={MONTH_BAND - 6} style={textStyle}>{month.text}</text>
              ))}
            </g>
            <g class="v-charts-calendar-weekdays" aria-hidden="true">
              {layout.value.weekdays.map(weekday => (
                <text key={weekday.text} x={0} y={weekday.y} dominant-baseline="central" style={textStyle}>{weekday.text}</text>
              ))}
            </g>
            <CellGridLayer
              cells={layout.value.cells}
              gap={Math.min(props.gap, layout.value.step / 3)}
              radius={props.radius}
              activeStyle="ring"
              grow="center"
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
 * Contribution calendar: one square per day, columns are weeks, color is the day's value.
 *
 * ```vue
 * <CalendarHeatmap :data="commits" date-key="day" data-key="count"><Tooltip /></CalendarHeatmap>
 * ```
 */
export const CalendarHeatmap = _CalendarHeatmap as typeof _CalendarHeatmap & {
  new (): { $slots: CellGridSlots<CalendarDay> & { default?: () => any } }
}
