import type { ChartRenderContext, ChartVNode, RowDataKey } from '@/types/typed'
import type { DataKey } from '@/types/common'
import { getValueByDataKey } from '@/utils/chart'
import { toFiniteNumber } from '@/utils/validate'
import { seriesColor } from '@/utils/theme'
import { type PropType, type SlotsType, type VNode, computed, defineComponent } from 'vue'
import { type CellEvents, cellGridEmits, cellGridListeners, chartEmits, chartListeners } from '@/events/componentEvents'
import { chartSizeProps } from '@/hooks/useResponsiveSize'
import type { StandaloneChartProps } from './directChartTypes'
import type { CellGridSlots } from './CellGridLayer'
import { cellGridSharedProps, valueFormatProps } from './cellGridProps'
import { type HeatmapCell, type HeatmapKey, HeatmapView } from './Heatmap'
import type { SvgTemplateAttributes } from '@/utils/attributes'

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
  /** Without `valueFormatter`, values show as a rounded percent (`mode: 'percent'`) or a count. */
  ...valueFormatProps,
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
      const sizes = new Map<string, number | null>()
      let periods = 0
      for (const row of props.data ?? []) {
        const cohort = getValueByDataKey(row, props.cohortKey)
        const values = getValueByDataKey(row, props.valuesKey)
        if (cohort == null || !Array.isArray(values) || values.length === 0)
          continue
        const name = String(cohort)
        const size = toFiniteNumber(values[0]) ?? null
        cohorts.push(name)
        sizes.set(name, size)
        periods = Math.max(periods, values.length)
        values.forEach((raw: unknown, period: number) => {
          const count = toFiniteNumber(raw)
          if (count === undefined)
            return
          if (props.mode !== 'percent')
            rows.push({ cohort: name, period, value: count, row })
          // A percentage needs a positive cohort size; without one the cell stays blank.
          else if (size !== null && size > 0)
            rows.push({ cohort: name, period, value: count / size * 100, row })
        })
      }
      return { rows, cohorts, sizes, periods: Array.from({ length: periods }, (_, i) => i) }
    })

    const format = (value: number) => props.mode === 'percent' ? `${Math.round(value)}%` : numbers.value.format(value)

    return () => (
      <HeatmapView
        {...attrs}
        {...chartListeners(emit)}
        {...cellGridListeners(emit)}
        cellPayload={cell => cohortCell(cell as HeatmapCell<CohortPeriod>)}
        data={model.value.rows}
        xKey="period"
        yKey="cohort"
        dataKey="value"
        xDomain={model.value.periods}
        yDomain={model.value.cohorts}
        max={props.mode === 'percent' ? 100 : undefined}
        fillMissing={false}
        showValues
        valueFormatter={(value, cell) => props.valueFormatter ? props.valueFormatter(value, cohortCell(cell as HeatmapCell<CohortPeriod>)) : format(value)}
        xTickFormatter={x => props.periodFormatter(Number(x))}
        yTickFormatter={(y) => {
          const size = model.value.sizes.get(String(y))
          return size == null ? String(y) : `${y} · ${numbers.value.format(size)}`
        }}
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
        {{ cell: slots.cell, default: slots.default }}
      </HeatmapView>
    )
  },
})

export type CohortChartSlots<Row = unknown> = CellGridSlots<CohortCell<Row>> & { default?: () => VNode[] }

export type CohortChartProps<Row = unknown> = StandaloneChartProps<InstanceType<typeof _CohortChart>['$props'], CellEvents<CohortCell<NoInfer<Row>>> & {
  data: readonly Row[]
  cohortKey?: RowDataKey<NoInfer<Row>>
  valuesKey?: RowDataKey<NoInfer<Row>>
  valueFormatter?: (value: number, cell: CohortCell<NoInfer<Row>>) => string
}>

export const CohortChart = _CohortChart as unknown as <Row>(
  props: CohortChartProps<Row> & Omit<SvgTemplateAttributes, keyof CohortChartProps<Row>>,
  context?: ChartRenderContext<CohortChartSlots<Row>>,
) => ChartVNode<CohortChartProps<Row>, CohortChartSlots<Row>>
