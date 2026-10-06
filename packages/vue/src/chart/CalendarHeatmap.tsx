import { type PropType, type SlotsType, type VNode, computed, defineComponent, reactive } from 'vue'
import { type MovingLabel, MovingLabels } from '@/animation/MovingLabels'
import { chartEmits, chartListeners } from '@/events/componentEvents'
import { chartSizeProps } from '@/hooks/useResponsiveSize'
import { useTrackedData } from '@/hooks/useTrackedData'
import { Layer } from '@/container/Layer'
import { ChartShell, useChartShell } from './ChartShell'
import { CellGridLayer, type CellGridSlots, cellChartOptions, cellGridEmits, cellGridSharedProps } from './CellGridLayer'
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

const CalendarHeatmapVueProps = {
  ...cellGridSharedProps,
  data: { type: Array as PropType<Record<string, unknown>[]>, required: true as const },
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
  slots: Object as SlotsType<CellGridSlots<CalendarDay> & { default?: () => VNode[] }>,
  setup(props, { emit, slots, attrs }) {
    const rows = useTrackedData(() => props.data)

    const days = computed(() => {
      const values = new Map<number, number>()
      let latest: number | undefined
      for (const row of rows.value ?? []) {
        const day = toDayNumber(row?.[props.dateKey] as string | Date | null | undefined)
        if (day !== undefined && (latest === undefined || day > latest))
          latest = day
        const value = Number(row?.[props.dataKey])
        if (day === undefined || !Number.isFinite(value))
          continue
        values.set(day, (values.get(day) ?? 0) + value)
      }
      return { values, latest }
    })

    const range = computed(() => {
      const end = toDayNumber(props.end) ?? days.value.latest
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
    const size = useChartShell(reactive({
      width: computed(() => props.width),
      height: computed(() => props.height),
      aspect: computed(() => props.aspect ?? (props.height === undefined ? (left.value + Math.max(columns.value, 1) * NOMINAL_STEP) / (top.value + 7 * NOMINAL_STEP) : undefined)),
      initialDimension: computed(() => props.initialDimension),
    }), cellChartOptions('CalendarHeatmap'))

    const layout = computed(() => {
      const r = range.value
      const width = size.effectiveWidth.value
      const height = size.effectiveHeight.value
      if (!r || !(width > 0) || !(height > 0)) {
        return {
          cells: [] as GridCell<CalendarDay>[],
          months: [] as MovingLabel[],
          weekdays: [] as MovingLabel[],
          step: 0,
        }
      }
      const step = Math.max(0, Math.min((width - left.value) / columns.value, (height - top.value) / 7))
      const gap = Math.min(props.gap, step / 3)
      const cellSize = step - gap
      const firstColumn = r.start - weekdayOffset(r.start)
      const values = days.value.values
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
      const months: { key: string, column: number, text: string }[] = []
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
          if (labelColumn < columns.value) {
            months.push({
              key: iso.slice(0, 7),
              column: labelColumn,
              text: formatDay(day, props.locale, { month: 'short' }),
            })
          }
        }
      }
      // Drop a label that would collide with the next one (usually a partial first month).
      const visibleMonths = months.filter((month, i) => i === months.length - 1 || months[i + 1].column - month.column >= 3)
      const weekdays = props.weekdayLabels
        // Monday, Wednesday and Friday, wherever the week start puts them. 1970-01-04 (day 3) was a Sunday.
        ? [1, 3, 5].map(weekday => ({
            key: weekday,
            x: 0,
            y: top.value + ((weekday - props.weekStart + 7) % 7) * step + cellSize / 2,
            text: formatDay(3 + weekday, props.locale, { weekday: 'short' }),
          }))
        : []
      return {
        cells,
        months: props.monthLabels
          ? visibleMonths.map(month => ({
              key: month.key,
              x: left.value + month.column * step,
              y: MONTH_BAND - 6,
              text: month.text,
            }))
          : [],
        weekdays,
        step,
      }
    })

    return () => (
      <ChartShell {...attrs} {...chartListeners(emit)} size={size} overflow="visible">
        {{ svg: () => (
          <Layer class="v-charts-calendar">
            <MovingLabels
              class="v-charts-calendar-months"
              labels={layout.value.months}
              isAnimationActive={props.isAnimationActive}
              transition={props.transition}
            />
            <MovingLabels
              class="v-charts-calendar-weekdays"
              labels={layout.value.weekdays}
              isAnimationActive={props.isAnimationActive}
              transition={props.transition}
              centered
            />
            <CellGridLayer
              cells={layout.value.cells}
              gap={Math.min(props.gap, layout.value.step / 3)}
              activeIndex={props.activeIndex}
              radius={props.radius}
              activeStyle="ring"
              grow="center"
              ariaLabel={props.ariaLabel}
              isAnimationActive={props.isAnimationActive}
              transition={props.transition}
              {...{
                'onUpdate:activeIndex': (index: number | null) => emit('update:activeIndex', index),
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
        ), default: slots.default }}
      </ChartShell>
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
  new (): { $slots: CellGridSlots<CalendarDay> & { default?: () => VNode[] } }
}
