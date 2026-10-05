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
import { type GridCell, levelColors, levelOf, mixColor } from './cellGridUtils'

export type HeatmapKey = string | number

export interface HeatmapCell {
  x: HeatmapKey
  y: HeatmapKey
  /** Sum of the rows for this x and y; `null` when there are none. */
  value: number | null
  /** The rows behind this cell. */
  rows: Record<string, any>[]
}

const LABEL_GAP = 6
const BOTTOM_BAND = 18
/** Row height used when neither `height` nor `aspect` is given. */
const DEFAULT_ROW = 28
/** Rough width of one label character at 10 px, to size the label column without measuring. */
const CHAR_WIDTH = 6

export const HeatmapVueProps = {
  ...cellGridSharedProps,
  data: { type: Array as PropType<Record<string, any>[]>, required: true as const },
  /** Field for the column. */
  xKey: { type: String, default: 'x' },
  /** Field for the row. */
  yKey: { type: String, default: 'y' },
  /** Field with the number to color by. Rows with the same x and y are summed. */
  dataKey: { type: String, default: 'value' },
  /** Column order. Defaults to the order of first appearance in `data`. */
  xDomain: { type: Array as PropType<HeatmapKey[]>, default: undefined },
  /** Row order, top to bottom. Defaults to the order of first appearance in `data`. */
  yDomain: { type: Array as PropType<HeatmapKey[]>, default: undefined },
  /** Full-intensity color; lower values mix it with `emptyColor`. */
  color: { type: String, default: 'var(--v-charts-series, #2563eb)' },
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
  /** Text for a value, on the cell and in the tooltip. */
  valueFormat: { type: Function as PropType<(value: number, cell: HeatmapCell) => string>, default: undefined },
  xLabelFormat: { type: Function as PropType<(x: HeatmapKey) => string>, default: undefined },
  yLabelFormat: { type: Function as PropType<(y: HeatmapKey) => string>, default: undefined },
  xLabels: { type: Boolean, default: true },
  yLabels: { type: Boolean, default: true },
  gap: { type: Number, default: 2 },
  ariaLabel: { type: String, default: 'Heatmap' },
}

const _Heatmap = defineComponent({
  name: 'Heatmap',
  props: { ...HeatmapVueProps, ...chartSizeProps },
  inheritAttrs: false,
  emits: { ...chartEmits, ...cellGridEmits },
  slots: Object as SlotsType<CellGridSlots<HeatmapCell> & { default?: () => any }>,
  setup(props, { emit, slots, attrs }) {
    provideChartContext(cellChartOptions('Heatmap'))
    provideRenderPhase()
    const rows = useTrackedData(() => props.data)

    const matrix = computed(() => {
      const xs: HeatmapKey[] = []
      const ys: HeatmapKey[] = []
      const seenX = new Set<HeatmapKey>()
      const seenY = new Set<HeatmapKey>()
      const cells = new Map<string, HeatmapCell>()
      for (const row of rows.value ?? []) {
        const x = row?.[props.xKey] as HeatmapKey | undefined
        const y = row?.[props.yKey] as HeatmapKey | undefined
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
        const value = Number(row[props.dataKey])
        if (Number.isFinite(value))
          cell.value = (cell.value ?? 0) + value
        cell.rows.push(row)
        cells.set(key, cell)
      }
      return { xs: props.xDomain ?? xs, ys: props.yDomain ?? ys, cells }
    })

    const xText = (x: HeatmapKey) => props.xLabelFormat ? props.xLabelFormat(x) : String(x)
    const yText = (y: HeatmapKey) => props.yLabelFormat ? props.yLabelFormat(y) : String(y)
    const left = computed(() => props.yLabels && matrix.value.ys.length
      ? Math.min(160, Math.max(...matrix.value.ys.map(y => yText(y).length)) * CHAR_WIDTH + LABEL_GAP * 2)
      : 0)
    const bottom = computed(() => props.xLabels ? BOTTOM_BAND : 0)

    // Without a height or aspect, rows get a comfortable fixed height.
    const size = useResponsiveSize(reactive({
      width: computed(() => props.width),
      height: computed(() => props.height ?? (props.aspect ? undefined : Math.max(1, matrix.value.ys.length) * DEFAULT_ROW + bottom.value)),
      aspect: computed(() => props.aspect),
      initialDimension: computed(() => props.initialDimension),
    }))

    const layout = computed(() => {
      const { xs, ys, cells: byKey } = matrix.value
      const width = size.effectiveWidth.value
      const height = size.effectiveHeight.value
      if (xs.length === 0 || ys.length === 0 || !(width > 0) || !(height > 0))
        return { cells: [] as GridCell<HeatmapCell>[], xLabels: [] as { x: number, text: string }[], yLabels: [] as { y: number, text: string }[], gap: 0 }
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
      const levels = props.colors?.length ? props.colors.length - 1 : Math.max(0, Math.floor(props.levels))
      const fills = props.colors?.length ? props.colors : levels > 0 ? levelColors(props.color, props.emptyColor, levels) : undefined
      const fillOf = (value: number | null) => {
        if (value === null || !(max! > 0))
          return { fill: fills?.[0] ?? props.emptyColor, ratio: 0 }
        if (fills) {
          const level = levelOf(value, max!, levels)
          return { fill: fills[level], ratio: level / levels }
        }
        const ratio = Math.min(1, Math.max(0, value / max!))
        return { fill: mixColor(props.color, props.emptyColor, ratio), ratio }
      }

      const cells: GridCell<HeatmapCell>[] = []
      ys.forEach((y, row) => {
        xs.forEach((x, column) => {
          const cell = byKey.get(cellKey(x, y))
          if (!cell && !props.fillMissing)
            return
          const data = cell ?? { x, y, value: null, rows: [] }
          const { fill, ratio } = fillOf(data.value)
          const text = data.value === null ? undefined : props.valueFormat ? props.valueFormat(data.value, data) : String(data.value)
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
            value: text ?? null,
            amount: data.value,
            text: props.showValues ? text : undefined,
            strong: ratio > 0.55,
            payload: data,
          })
        })
      })

      // Thin out column labels so they never collide: one label per `every` columns.
      const widest = Math.max(...xs.map(x => xText(x).length)) * CHAR_WIDTH + LABEL_GAP
      const every = Math.max(1, Math.ceil(widest / Math.max(stepX, 1)))
      return {
        cells,
        xLabels: props.xLabels ? xs.flatMap((x, column) => column % every === 0 ? [{ x: left.value + column * stepX + (stepX - gap) / 2, text: xText(x) }] : []) : [],
        yLabels: props.yLabels ? ys.map((y, row) => ({ y: row * stepY + (stepY - gap) / 2, text: yText(y) })) : [],
        gap,
      }
    })

    const textStyle = { fill: 'var(--v-charts-text, #666)', fontSize: '10px' }

    return () => (
      <ChartsWrapper {...boxAttrs(attrs)} {...chartListeners(emit)} isResponsive={size.isResponsive.value} boxStyle={size.boxStyle.value} interactive={!size.isResponsive.value || size.measured.value} onResize={size.handleResize} width={size.effectiveWidth.value} height={size.effectiveHeight.value}>
        <Surface {...rootAttrs(attrs)} width={size.effectiveWidth.value} height={size.effectiveHeight.value} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <Layer class="v-charts-heatmap">
            <g class="v-charts-heatmap-y-labels" aria-hidden="true">
              {layout.value.yLabels.map(label => (
                <text key={label.text} x={left.value - LABEL_GAP} y={label.y} text-anchor="end" dominant-baseline="central" style={textStyle}>{label.text}</text>
              ))}
            </g>
            <g class="v-charts-heatmap-x-labels" aria-hidden="true">
              {layout.value.xLabels.map(label => (
                <text key={label.text} x={label.x} y={size.effectiveHeight.value - 4} text-anchor="middle" style={textStyle}>{label.text}</text>
              ))}
            </g>
            <CellGridLayer
              cells={layout.value.cells}
              gap={layout.value.gap}
              radius={props.radius}
              activeStyle="ring"
              grow="center"
              ariaLabel={props.ariaLabel}
              isAnimationActive={props.isAnimationActive}
              transition={props.transition}
              entrance={props.entrance}
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
export const Heatmap = _Heatmap as typeof _Heatmap & {
  new (): { $slots: CellGridSlots<HeatmapCell> & { default?: () => any } }
}
