import type { StandaloneChartProps } from './directChartTypes'
import type { ChartRenderContext, ChartVNode, RowDataKey } from '@/types/typed'
import type { DataKey } from '@/types/common'
import { getValueByDataKey } from '@/utils/chart'
import { toFiniteNumber } from '@/utils/validate'
import { seriesColor } from '@/utils/theme'
import { type PropType, type SlotsType, type VNode, computed, defineComponent, reactive } from 'vue'
import { type MovingLabel, MovingLabels } from '@/animation/MovingLabels'
import { type CellEvents, cellGridEmits, cellGridListeners, chartEmits, chartListeners } from '@/events/componentEvents'
import { chartSizeProps } from '@/hooks/useResponsiveSize'
import { useTrackedData } from '@/hooks/useTrackedData'
import { Layer } from '@/container/Layer'
import { ChartShell, useChartShell } from './ChartShell'
import { standaloneChartOptions } from './shell'
import { CellGridLayer, type CellGridSlots } from './CellGridLayer'
import { cellGridSharedProps, useValueText, valueFormatProps } from './cellGridProps'
import { type GridCell, cellColorScale } from './cellGridUtils'
import type { SvgTemplateAttributes } from '@/utils/attributes'

export type HeatmapKey = string | number

export interface HeatmapCell<Row = unknown> {
  x: HeatmapKey
  y: HeatmapKey
  /** Sum of the rows for this x and y; `null` when there are none. */
  value: number | null
  /** The rows behind this cell. */
  rows: readonly Row[]
}

const LABEL_GAP = 6
const BOTTOM_BAND = 18
/** Row height used when neither `height` nor `aspect` is given. */
const DEFAULT_ROW = 28
/** Rough width of one label character at 10 px, to size the label column without measuring. */
const CHAR_WIDTH = 6

const HeatmapVueProps = {
  ...cellGridSharedProps,
  data: { type: Array as PropType<readonly unknown[]>, required: true as const },
  /** Field for the column. */
  xKey: { type: [String, Number, Function] as PropType<DataKey<unknown>>, default: 'x' },
  /** Field for the row. */
  yKey: { type: [String, Number, Function] as PropType<DataKey<unknown>>, default: 'y' },
  /** Field with the number to color by. Rows with the same x and y are summed. */
  dataKey: { type: [String, Number, Function] as PropType<DataKey<unknown>>, default: 'value' },
  /** Column order. Defaults to the order of first appearance in `data`. */
  xDomain: { type: Array as PropType<HeatmapKey[]>, default: undefined },
  /** Row order, top to bottom. Defaults to the order of first appearance in `data`. */
  yDomain: { type: Array as PropType<HeatmapKey[]>, default: undefined },
  /** Full-intensity color; lower values mix it with `emptyColor`. */
  color: { type: String, default: seriesColor(0) },
  emptyColor: { type: String, default: 'var(--v-charts-muted, #eef2f7)' },
  /** Steps above empty; `0` mixes continuously. */
  levels: { type: Number, default: 0 },
  /** Explicit fill per level, from empty to full; overrides `color`, `emptyColor` and `levels`. */
  colors: { type: Array as PropType<string[]>, default: undefined },
  /** Value that reaches full color. Defaults to the largest value. */
  max: { type: Number, default: undefined },
  /** Draw x and y pairs without data as empty cells; `false` leaves holes (cohort triangles). */
  fillMissing: { type: Boolean, default: true },
  /** Draw each value on its cell when it fits. */
  showValues: { type: Boolean, default: false },
  ...valueFormatProps,
  xTickFormatter: { type: Function as PropType<(x: HeatmapKey) => string>, default: undefined },
  yTickFormatter: { type: Function as PropType<(y: HeatmapKey) => string>, default: undefined },
  xLabels: { type: Boolean, default: true },
  yLabels: { type: Boolean, default: true },
  gap: { type: Number, default: 2 },
  desc: String,
  title: { type: String, default: 'Heatmap' },
  /** Internal: the domain object a derived chart exposes per cell, e.g. CohortChart's `CohortCell`. */
  cellPayload: { type: Function as PropType<(cell: HeatmapCell) => unknown>, default: undefined },
}

const _Heatmap = defineComponent({
  name: 'Heatmap',
  props: { ...HeatmapVueProps, ...chartSizeProps },
  inheritAttrs: false,
  emits: { ...chartEmits, ...cellGridEmits },
  slots: Object as SlotsType<CellGridSlots<HeatmapCell> & { default?: () => VNode[] }>,
  setup(props, { emit, slots, attrs }) {
    const valueText = useValueText<HeatmapCell>(props)
    const rows = useTrackedData(() => props.data)

    const matrix = computed(() => {
      const xs: HeatmapKey[] = []
      const ys: HeatmapKey[] = []
      const seenX = new Set<HeatmapKey>()
      const seenY = new Set<HeatmapKey>()
      const cells = new Map<string, HeatmapCell & { rows: unknown[] }>()
      for (const row of rows.value ?? []) {
        const x = getValueByDataKey(row, props.xKey) as HeatmapKey | undefined
        const y = getValueByDataKey(row, props.yKey) as HeatmapKey | undefined
        if (x == null || y == null)
          continue
        if (!seenX.has(x)) {
          seenX.add(x)
          xs.push(x)
        }
        if (!seenY.has(y)) {
          seenY.add(y)
          ys.push(y)
        }
        const key = cellKey(x, y)
        const cell = cells.get(key) ?? { x, y, value: null, rows: [] }
        const value = toFiniteNumber(getValueByDataKey(row, props.dataKey))
        if (value !== undefined)
          cell.value = (cell.value ?? 0) + value
        cell.rows.push(row)
        cells.set(key, cell)
      }
      return { xs: props.xDomain ?? xs, ys: props.yDomain ?? ys, cells }
    })

    const xText = (x: HeatmapKey) => props.xTickFormatter ? props.xTickFormatter(x) : String(x)
    const yText = (y: HeatmapKey) => props.yTickFormatter ? props.yTickFormatter(y) : String(y)
    const left = computed(() => props.yLabels && matrix.value.ys.length
      ? Math.min(160, Math.max(...matrix.value.ys.map(y => yText(y).length)) * CHAR_WIDTH + LABEL_GAP * 2)
      : 0)
    const bottom = computed(() => props.xLabels ? BOTTOM_BAND : 0)

    // Without a height or aspect, rows get a comfortable fixed height.
    const size = useChartShell(reactive({
      width: computed(() => props.width),
      height: computed(() => props.height ?? (props.aspect ? undefined : Math.max(1, matrix.value.ys.length) * DEFAULT_ROW + bottom.value)),
      aspect: computed(() => props.aspect),
      initialDimension: computed(() => props.initialDimension),
    }), standaloneChartOptions('Heatmap'))

    const layout = computed(() => {
      const { xs, ys, cells: byKey } = matrix.value
      const width = size.effectiveWidth.value
      const height = size.effectiveHeight.value
      if (xs.length === 0 || ys.length === 0 || !(width > 0) || !(height > 0)) {
        return {
          cells: [] as GridCell[],
          xLabels: [] as MovingLabel[],
          yLabels: [] as MovingLabel[],
          gap: 0,
        }
      }
      const stepX = Math.max(0, (width - left.value) / xs.length)
      const stepY = Math.max(0, (height - bottom.value) / ys.length)
      const gap = Math.min(props.gap, stepX / 3, stepY / 3)
      let max = props.max
      if (max === undefined) {
        max = 0
        for (const cell of byKey.values()) {
          if ((cell.value ?? 0) > max)
            max = cell.value!
        }
      }
      const scale = cellColorScale({ color: props.color, empty: props.emptyColor, levels: props.levels, colors: props.colors, max })

      const cells: GridCell[] = []
      ys.forEach((y, row) => {
        xs.forEach((x, column) => {
          const cell = byKey.get(cellKey(x, y))
          if (!cell && !props.fillMissing)
            return
          const data = cell ?? { x, y, value: null, rows: [] }
          const fill = scale.fill(data.value)
          const text = data.value === null ? undefined : valueText(data.value, data)
          cells.push({
            key: cellKey(x, y),
            x: left.value + column * stepX,
            y: row * stepY,
            width: Math.max(0, stepX - gap),
            height: Math.max(0, stepY - gap),
            fill,
            row,
            column,
            label: `${yText(y)}, ${xText(x)}`,
            value: data.value,
            valueText: text,
            text: props.showValues ? text : undefined,
            payload: props.cellPayload ? props.cellPayload(data) : data,
          })
        })
      })

      // Thin out column labels so they never collide: one label per `every` columns.
      const widest = Math.max(...xs.map(x => xText(x).length)) * CHAR_WIDTH + LABEL_GAP
      const every = Math.max(1, Math.ceil(widest / Math.max(stepX, 1)))
      return {
        cells,
        xLabels: props.xLabels
          ? xs.flatMap((x, column) => column % every === 0
              ? [{
                  key: `${typeof x}:${x}`,
                  x: left.value + column * stepX + (stepX - gap) / 2,
                  y: height - 4,
                  text: xText(x),
                }]
              : [])
          : [],
        yLabels: props.yLabels
          ? ys.map((y, row) => ({
              key: `${typeof y}:${y}`,
              x: left.value - LABEL_GAP,
              y: row * stepY + (stepY - gap) / 2,
              text: yText(y),
            }))
          : [],
        gap,
      }
    })

    return () => (
      <ChartShell {...attrs} {...chartListeners(emit)} size={size} title={props.title} desc={props.desc} overflow="visible">
        {{ svg: () => (
          <Layer class="v-charts-heatmap">
            <MovingLabels
              class="v-charts-heatmap-y-labels"
              labels={layout.value.yLabels}
              isAnimationActive={props.isAnimationActive}
              transition={props.transition}
              textAnchor="end"
              centered
            />
            <MovingLabels
              class="v-charts-heatmap-x-labels"
              labels={layout.value.xLabels}
              isAnimationActive={props.isAnimationActive}
              transition={props.transition}
              textAnchor="middle"
            />
            <CellGridLayer
              cells={layout.value.cells}
              gap={layout.value.gap}
              activeIndex={props.activeIndex}
              radius={props.radius}
              activeStyle="ring"
              grow="center"
              title={props.title}
              isAnimationActive={props.isAnimationActive}
              transition={props.transition}
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

function cellKey(x: HeatmapKey, y: HeatmapKey) {
  return `${typeof x}:${x}\u0001${typeof y}:${y}`
}

/**
 * Matrix heatmap: rows and columns from two fields, color from a third, e.g. visits by
 * weekday and hour.
 *
 * ```vue
 * <Heatmap :data="visits" x-key="hour" y-key="day" data-key="count"><Tooltip /></Heatmap>
 * ```
 */
export type HeatmapSlots<Row = unknown> = CellGridSlots<HeatmapCell<Row>> & { default?: () => VNode[] }

export type HeatmapProps<Row = unknown> = StandaloneChartProps<Omit<InstanceType<typeof _Heatmap>['$props'], 'cellPayload'>, CellEvents<HeatmapCell<NoInfer<Row>>> & {
  data: readonly Row[]
  xKey?: RowDataKey<NoInfer<Row>>
  yKey?: RowDataKey<NoInfer<Row>>
  dataKey?: RowDataKey<NoInfer<Row>>
  valueFormatter?: (value: number, cell: HeatmapCell<NoInfer<Row>>) => string
}>

/** The untyped component, for charts derived from a heatmap that expose their own cell payload. */
export const HeatmapView = _Heatmap

export const Heatmap = _Heatmap as unknown as <Row>(
  props: HeatmapProps<Row> & Omit<SvgTemplateAttributes, keyof HeatmapProps<Row>>,
  context?: ChartRenderContext<HeatmapSlots<Row>>,
) => ChartVNode<HeatmapProps<Row>, HeatmapSlots<Row>>
