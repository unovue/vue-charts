import { type PropType, type SlotsType, computed, defineComponent } from 'vue'
import { chartEmits } from '@/events/componentEvents'
import { chartSizeProps } from '@/hooks/useResponsiveSize'
import { type CellGridSlots, cellGridEmits, cellGridSharedProps } from './CellGridLayer'
import { Heatmap, type HeatmapCell } from './Heatmap'

export const CohortChartVueProps = {
  ...cellGridSharedProps,
  /** One row per cohort, oldest first. */
  data: { type: Array as PropType<Record<string, any>[]>, required: true as const },
  /** Field naming the cohort, e.g. its signup month. */
  cohortKey: { type: String, default: 'cohort' },
  /**
   * Field with the counts per period: index 0 is the cohort's size, index n how many were
   * still active n periods later. Periods not reached yet are simply left out.
   */
  valuesKey: { type: String, default: 'values' },
  /** `percent` of the cohort size, or the raw `count`. */
  mode: { type: String as PropType<'percent' | 'count'>, default: 'percent' },
  /** Column heading per period, e.g. `i => \`Month ${i}\``. */
  periodLabel: { type: Function as PropType<(period: number) => string>, default: (period: number) => String(period) },
  color: { type: String, default: 'var(--v-charts-series, #2563eb)' },
  emptyColor: { type: String, default: 'var(--v-charts-muted, #eef2f7)' },
  /** Locale for numbers. Fixed by default so server and client render the same. */
  locale: { type: String, default: 'en-US' },
  gap: { type: Number, default: 2 },
  ariaLabel: { type: String, default: 'Cohort retention' },
}

/**
 * Cohort retention: one row per cohort, one column per period since it started, each cell the
 * share of the cohort still active. Immature periods stay blank, so the grid is a triangle.
 *
 * ```vue
 * <CohortChart :data="[{ cohort: 'Jan', values: [1200, 640, 410] }]" :period-label="i => `M${i}`" />
 * ```
 */
const _CohortChart = defineComponent({
  name: 'CohortChart',
  props: { ...CohortChartVueProps, ...chartSizeProps },
  inheritAttrs: false,
  emits: { ...chartEmits, ...cellGridEmits },
  slots: Object as SlotsType<CellGridSlots<HeatmapCell> & { default?: () => any }>,
  setup(props, { emit, slots, attrs }) {
    const numbers = computed(() => new Intl.NumberFormat(props.locale))

    const model = computed(() => {
      const rows: { cohort: string, period: number, value: number, count: number, size: number }[] = []
      const cohorts: string[] = []
      const sizes = new Map<string, number>()
      let periods = 0
      for (const row of props.data ?? []) {
        const cohort = row?.[props.cohortKey]
        const values = row?.[props.valuesKey]
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
          rows.push({ cohort: name, period, value, count, size })
        })
      }
      return { rows, cohorts, sizes, periods: Array.from({ length: periods }, (_, i) => i) }
    })

    const format = (value: number) => props.mode === 'percent' ? `${Math.round(value)}%` : numbers.value.format(value)

    return () => (
      <Heatmap
        {...attrs}
        {...{
          'onCell-click': (payload: unknown, index: number, event: MouseEvent) => emit('cell-click', payload, index, event),
          'onCell-mouseenter': (payload: unknown, index: number, event: MouseEvent) => emit('cell-mouseenter', payload, index, event),
          'onCell-mouseleave': (payload: unknown, index: number, event: MouseEvent) => emit('cell-mouseleave', payload, index, event),
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
        valueFormat={format}
        xLabelFormat={x => props.periodLabel(Number(x))}
        yLabelFormat={y => `${y} · ${numbers.value.format(model.value.sizes.get(String(y)) ?? 0)}`}
        color={props.color}
        emptyColor={props.emptyColor}
        gap={props.gap}
        radius={props.radius}
        isAnimationActive={props.isAnimationActive}
        transition={props.transition}
        ariaLabel={props.ariaLabel}
        width={props.width}
        height={props.height}
        aspect={props.aspect}
        initialDimension={props.initialDimension}
      >
        {{ cell: slots.cell, default: slots.default }}
      </Heatmap>
    )
  },
})

export const CohortChart = _CohortChart as typeof _CohortChart & {
  new (): { $slots: CellGridSlots<HeatmapCell> & { default?: () => any } }
}
