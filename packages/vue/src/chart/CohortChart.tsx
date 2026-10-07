import type { ChartRenderContext, ChartVNode, RowDataKey } from '@/types/typed'
import type { DataKey } from '@/types/common'
import { getValueByDataKey } from '@/utils/chart'
import { seriesColor } from '@/utils/theme'
import { type PropType, type SlotsType, type VNode, computed, defineComponent } from 'vue'
import { chartEmits, chartListeners } from '@/events/componentEvents'
import { chartSizeProps } from '@/hooks/useResponsiveSize'
import { type CellGridSlots, type CellSlotProps, cellGridEmits, cellGridSharedProps } from './CellGridLayer'
import { Heatmap, type HeatmapCell, type HeatmapKey } from './Heatmap'

export interface CohortCell<Row = unknown> {
  x: HeatmapKey
  y: HeatmapKey
  value: number | null
  /** First contributing row; rows retains all sources when cohort names repeat. */
  row: Row
  rows: readonly Row[]
  period: number
}

interface CohortPeriod {
  cohort: string
  period: number
  value: number
  row: unknown
}

function cohortCell(cell: HeatmapCell<CohortPeriod>): CohortCell | undefined {
  const first = cell.rows[0]
  return first && {
    x: cell.x,
    y: cell.y,
    value: cell.value,
    row: first.row,
    rows: cell.rows.map(source => source.row),
    period: first.period,
  }
}

const CohortChartVueProps = {
  ...cellGridSharedProps,
  /** One row per cohort, oldest first. */
  data: { type: Array as PropType<readonly unknown[]>, required: true as const },
  /** Field naming the cohort, e.g. its signup month. */
  cohortKey: { type: [String, Number, Function] as PropType<DataKey<unknown>>, default: 'cohort' },
  /**
   * Field with the counts per period: index 0 is the cohort's size, index n how many were
   * still active n periods later. Periods not reached yet are simply left out.
   */
  valuesKey: { type: [String, Number, Function] as PropType<DataKey<unknown>>, default: 'values' },
  /** `percent` of the cohort size, or the raw `count`. */
  mode: { type: String as PropType<'percent' | 'count'>, default: 'percent' },
  /** Column heading per period, e.g. `i => \`Month ${i}\``. */
  periodFormatter: { type: Function as PropType<(period: number) => string>, default: (period: number) => String(period) },
  color: { type: String, default: seriesColor(0) },
  emptyColor: { type: String, default: 'var(--v-charts-muted, #eef2f7)' },
  /** Locale for numbers. Fixed by default so server and client render the same. */
  locale: { type: String, default: 'en-US' },
  gap: { type: Number, default: 2 },
  desc: String,
  title: { type: String, default: 'Cohort retention' },
}

/**
 * Cohort retention: one row per cohort, one column per period since it started, each cell the
 * share of the cohort still active. Immature periods stay blank, so the grid is a triangle.
 *
 * ```vue
 * <CohortChart :data="[{ cohort: 'Jan', values: [1200, 640, 410] }]" :period-formatter="i => `M${i}`" />
 * ```
 */
const _CohortChart = defineComponent({
  name: 'CohortChart',
  props: { ...CohortChartVueProps, ...chartSizeProps },
  inheritAttrs: false,
  emits: { ...chartEmits, ...cellGridEmits },
  slots: Object as SlotsType<CellGridSlots<CohortCell> & { default?: () => VNode[] }>,
  setup(props, { emit, slots, attrs }) {
    const numbers = computed(() => new Intl.NumberFormat(props.locale))

    const model = computed(() => {
      const rows: CohortPeriod[] = []
      const cohorts: string[] = []
      const sizes = new Map<string, number>()
      let periods = 0
      for (const row of props.data ?? []) {
        const cohort = getValueByDataKey(row, props.cohortKey)
        const values = getValueByDataKey(row, props.valuesKey)
        if (cohort == null || !Array.isArray(values) || values.length === 0)
          continue
        const name = String(cohort)
        const size = Number(values[0])
        cohorts.push(name)
        sizes.set(name, size)
        periods = Math.max(periods, values.length)
        values.forEach((raw: unknown, period: number) => {
          if (raw == null)
            return
          const count = Number(raw)
          if (!Number.isFinite(count))
            return
          const value = props.mode === 'percent' ? (size > 0 ? count / size * 100 : 0) : count
          rows.push({ cohort: name, period, value, row })
        })
      }
      return { rows, cohorts, sizes, periods: Array.from({ length: periods }, (_, i) => i) }
    })

    const format = (value: number) => props.mode === 'percent' ? `${Math.round(value)}%` : numbers.value.format(value)

    return () => (
      <Heatmap
        {...attrs}
        {...chartListeners(emit)}
        {...{
          'onUpdate:activeIndex': (index: number | null) => emit('update:activeIndex', index),
          'onCell-click': (payload: HeatmapCell<CohortPeriod>, index: number, event: MouseEvent) => {
            const cell = cohortCell(payload)
            if (cell)
              emit('cell-click', cell, index, event)
          },
          'onCell-mouseenter': (payload: HeatmapCell<CohortPeriod>, index: number, event: MouseEvent) => {
            const cell = cohortCell(payload)
            if (cell)
              emit('cell-mouseenter', cell, index, event)
          },
          'onCell-mouseleave': (payload: HeatmapCell<CohortPeriod>, index: number, event: MouseEvent) => {
            const cell = cohortCell(payload)
            if (cell)
              emit('cell-mouseleave', cell, index, event)
          },
          'onAnimation-start': () => emit('animation-start'),
          'onAnimation-end': () => emit('animation-end'),
        }}
        data={model.value.rows}
        xKey="period"
        yKey="cohort"
        dataKey="value"
        xDomain={model.value.periods}
        yDomain={model.value.cohorts}
        max={props.mode === 'percent' ? 100 : undefined}
        fillMissing={false}
        showValues
        valueFormatter={format}
        xTickFormatter={x => props.periodFormatter(Number(x))}
        yTickFormatter={y => `${y} · ${numbers.value.format(model.value.sizes.get(String(y)) ?? 0)}`}
        color={props.color}
        emptyColor={props.emptyColor}
        gap={props.gap}
        activeIndex={props.activeIndex}
        radius={props.radius}
        isAnimationActive={props.isAnimationActive}
        transition={props.transition}
        title={props.title}
        desc={props.desc}
        width={props.width}
        height={props.height}
        aspect={props.aspect}
        initialDimension={props.initialDimension}
      >
        {{ cell: slots.cell
          ? (slot: CellSlotProps<HeatmapCell<CohortPeriod>>) => {
              const payload = cohortCell(slot.cell.payload)
              return payload && slots.cell?.({ ...slot, cell: { ...slot.cell, payload } })
            }
          : undefined, default: slots.default }}
      </Heatmap>
    )
  },
})

export type CohortChartSlots<Row = unknown> = CellGridSlots<CohortCell<Row>> & { default?: () => VNode[] }

export type CohortChartProps<Row = unknown> = Omit<InstanceType<typeof _CohortChart>['$props'], 'data' | 'cohortKey' | 'valuesKey' | 'onCell-click' | 'onCell-mouseenter' | 'onCell-mouseleave'> & {
  'data': readonly Row[]
  'cohortKey'?: RowDataKey<NoInfer<Row>>
  'valuesKey'?: RowDataKey<NoInfer<Row>>
  'onCellClick'?: (cell: CohortCell<NoInfer<Row>>, index: number, event: MouseEvent) => void
  'onCell-click'?: (cell: CohortCell<NoInfer<Row>>, index: number, event: MouseEvent) => void
  'onCellMouseenter'?: (cell: CohortCell<NoInfer<Row>>, index: number, event: MouseEvent) => void
  'onCell-mouseenter'?: (cell: CohortCell<NoInfer<Row>>, index: number, event: MouseEvent) => void
  'onCellMouseleave'?: (cell: CohortCell<NoInfer<Row>>, index: number, event: MouseEvent) => void
  'onCell-mouseleave'?: (cell: CohortCell<NoInfer<Row>>, index: number, event: MouseEvent) => void
}

export const CohortChart = _CohortChart as unknown as <Row>(
  props: CohortChartProps<Row>,
  context?: ChartRenderContext<CohortChartSlots<Row>>,
) => ChartVNode<CohortChartProps<Row>, CohortChartSlots<Row>>
