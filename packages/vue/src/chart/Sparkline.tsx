import type { StandaloneChartProps } from './directChartTypes'
import type { ChartRenderContext, ChartVNode, RowDataKey } from '@/types/typed'
import { getValueByDataKey } from '@/utils/chart'
import { toFiniteNumber } from '@/utils/validate'
import { seriesColor } from '@/utils/theme'
import { type EmitFn, type ExtractPropTypes, type PropType, type SlotsType, type VNode, computed, defineComponent, reactive, toRefs, useId } from 'vue'
import { curveLinear, curveMonotoneX, area as d3Area, line as d3Line } from 'd3-shape'
import { chartEmits, chartListeners } from '@/events/componentEvents'
import { useTooltipController } from '@/model/tooltip'
import type { TooltipPayloadConfiguration } from '@/types/tooltip'
import { usePointTransition } from '@/animation/usePointTransition'
import { SweepClip } from '@/animation/SweepClip'
import { drawTiming } from '@/animation/motion'
import { polylineLength } from '@/animation/ridingLabels'
import { chartSizeProps } from '@/hooks/useResponsiveSize'
import { useTrackedData } from '@/hooks/useTrackedData'
import { Layer } from '@/container/Layer'
import { ChartShell, useChartShell } from './ChartShell'
import { CellGridLayer } from './CellGridLayer'
import { cellGridSharedProps, useValueText, valueFormatProps } from './cellGridProps'
import { standaloneChartOptions } from './shell'
import { useItemKeyboard } from '@/events/useItemKeyboard'
import type { GridCell } from './cellGridUtils'
import type { SvgTemplateAttributes } from '@/utils/attributes'

type SparkValue = number | null | undefined
type SparkRow = SparkValue | Record<string, unknown>

interface SparkPoint {
  x: number
  /** `null` is a gap. */
  y: number | null
  value: number | null
  index: number
  payload: SparkRow
}

/** Room for the end dot and the stroke at the edges. */
const PAD = 3

const SparklineVueProps = {
  isAnimationActive: cellGridSharedProps.isAnimationActive,
  transition: cellGridSharedProps.transition,
  /** Numbers, or rows with `data-key`. `null` leaves a gap. */
  data: { type: Array as PropType<SparkRow[]>, required: true as const },
  dataKey: { type: [String, Number, Function] as PropType<RowDataKey<SparkRow>>, default: 'value' },
  /** Identity of a point across updates, e.g. its date, so a moving window slides. Defaults to the position. */
  nameKey: { type: [String, Number, Function] as PropType<RowDataKey<SparkRow>>, default: undefined },
  type: { type: String as PropType<'line' | 'area' | 'bar'>, default: 'line' },
  color: { type: String, default: seriesColor(0) },
  strokeWidth: { type: Number, default: 1.5 },
  curve: { type: String as PropType<'monotone' | 'linear'>, default: 'monotone' },
  /** Lowest value on the scale. Set `min` and `max` on several sparklines to compare them. */
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  /** Mark the latest value with a dot (line and area). */
  endDot: { type: Boolean, default: true },
  /** Hovered or focused point; bind with `v-model:active-index` to show its value elsewhere. */
  activeIndex: { type: Number as PropType<number | null>, default: undefined },
  gap: { type: Number, default: 1 },
  radius: { type: Number, default: 1 },
  ...valueFormatProps,
  desc: String,
  title: { type: String, default: undefined },
}

const sparklineEmits = {
  'update:activeIndex': (_index: number | null) => true,
  'animation-start': () => true,
  'animation-end': () => true,
}

type SparklineInput = ExtractPropTypes<typeof SparklineVueProps> & { width: number, height: number }

/** The drawing, set up inside the measured surface so its scope follows the surface's. */
function useSparkline(props: SparklineInput, emit: EmitFn<typeof sparklineEmits>) {
  // The item is the row (or number) behind the value.
  const valueText = useValueText<unknown>(props)
  const tooltip = useTooltipController()
  const id = useId()
  const size = { effectiveWidth: computed(() => props.width), effectiveHeight: computed(() => props.height) }
  const rows = useTrackedData(() => props.data)

  const values = computed(() => (rows.value ?? []).map((row) => {
    const raw = row !== null && typeof row === 'object' ? getValueByDataKey(row, props.dataKey) : row
    return toFiniteNumber(raw) ?? null
  }))

  const domain = computed(() => {
    const finite = values.value.filter((value): value is number => value !== null)
    // Loops, not Math.min(...values): spreading very long series overflows the call stack.
    let dataLo = Infinity
    let dataHi = -Infinity
    for (const value of finite) {
      dataLo = Math.min(dataLo, value)
      dataHi = Math.max(dataHi, value)
    }
    let lo = props.min ?? (finite.length ? dataLo : 0)
    let hi = props.max ?? (finite.length ? dataHi : 1)
    // Bars grow from zero; lines use the data's own range.
    if (props.type === 'bar') {
      lo = props.min ?? Math.min(0, lo)
      hi = props.max ?? Math.max(0, hi)
    }
    if (hi === lo && props.type === 'bar')
      hi += 1
    return { lo, hi }
  })

  const points = computed<SparkPoint[]>(() => {
    const width = size.effectiveWidth.value
    const height = size.effectiveHeight.value
    const n = values.value.length
    const { lo, hi } = domain.value
    function yOf(value: number) {
      return hi === lo ? height / 2 : PAD + (1 - (value - lo) / (hi - lo)) * (height - PAD * 2)
    }
    return values.value.map((value, index) => ({
      x: n === 1 ? width / 2 : PAD + index * (width - PAD * 2) / (n - 1),
      // A gap stays a gap; the transition never interpolates through it.
      y: value === null ? null : yOf(value),
      value,
      index,
      payload: rows.value?.[index],
    }))
  })
  const nameValueOf = (point: SparkPoint) => {
    const row = point.payload
    return props.nameKey && row !== null && typeof row === 'object' ? getValueByDataKey(row, props.nameKey) : undefined
  }
  const keyOf = (point: SparkPoint) => {
    const name = nameValueOf(point)
    return name == null ? point.index : String(name)
  }
  /** The point's name in the tooltip and for screen readers, in line and bar mode alike. */
  const nameOf = (point: SparkPoint) => {
    const name = nameValueOf(point)
    return name == null ? String(point.index + 1) : String(name)
  }
  const baselineY = computed(() => size.effectiveHeight.value - PAD)
  const display = usePointTransition(() => props.type === 'bar' ? [] : points.value, {
    key: keyOf,
    baseline: () => baselineY.value,
    isActive: () => props.isAnimationActive,
    transition: () => props.transition,
    // Drawn like Line and Area: longer lines take longer, so the pen moves at a steady pace.
    entrance: () => drawTiming(polylineLength(points.value)),
    onStart: () => emit('animation-start'),
    onEnd: () => emit('animation-end'),
  })

  const curve = computed(() => props.curve === 'linear' ? curveLinear : curveMonotoneX)
  const defined = (p: SparkPoint): p is SparkPoint & { y: number } => p.y != null && Number.isFinite(p.y)
  // `defined` skips gaps, so `y` is only read for drawn points.
  const linePath = computed(() => d3Line<SparkPoint>().defined(defined).x(p => p.x).y(p => p.y ?? 0).curve(curve.value)(display.points.value) ?? '')
  const areaPath = computed(() => d3Area<SparkPoint>().defined(defined).x(p => p.x).y0(baselineY.value).y1(p => p.y ?? 0).curve(curve.value)(display.points.value) ?? '')

  const bars = computed<GridCell<SparkRow>[]>(() => {
    if (props.type !== 'bar')
      return []
    const width = size.effectiveWidth.value
    const height = size.effectiveHeight.value
    const n = values.value.length
    if (!n)
      return []
    const gap = (width - props.gap * (n - 1)) / n >= 2 ? props.gap : 0
    const step = (width - gap * (n - 1)) / n
    const { lo, hi } = domain.value
    const yOf = (value: number) => (1 - (value - lo) / (hi - lo)) * height
    const zero = yOf(Math.min(hi, Math.max(lo, 0)))
    return points.value.map(point => ({
      key: String(keyOf(point)),
      x: point.index * (step + gap),
      y: point.value === null ? zero : Math.min(zero, yOf(point.value)),
      width: step,
      height: point.value === null ? 0 : Math.abs(yOf(point.value) - zero),
      fill: props.color,
      row: 0,
      column: point.index,
      label: nameOf(point),
      value: point.value,
      valueText: point.value === null ? undefined : valueText(point.value, point.payload),
      payload: point.payload,
    }))
  })

  // Line and area register their own tooltip entries; bars get theirs from the cell grid.
  const positionalIdentities: symbol[] = []
  const configuration = computed<TooltipPayloadConfiguration | undefined>(() => {
    if (props.type === 'bar')
      return undefined
    const identities = points.value.map(point => props.nameKey && point.payload !== null && typeof point.payload === 'object'
      ? getValueByDataKey(point.payload, props.nameKey) ?? point.payload
      : point.payload)
    const counts = new Map<unknown, number>()
    for (const identity of identities)
      counts.set(identity, (counts.get(identity) ?? 0) + 1)
    return {
      model: {
        root: true,
        index: () => props.activeIndex,
        request: index => emit('update:activeIndex', index),
      },
      keyboardItems: points.value.map(point => ({
        index: point.index,
        identity: point.payload !== null && typeof point.payload === 'object'
          ? counts.get(identities[point.index]) === 1 ? identities[point.index] : point.payload
          : positionalIdentities[point.index] ??= Symbol(),
        // A gap has no value; its keyboard tooltip sits at the top edge.
        coordinate: { x: point.x, y: point.y ?? 0 },
      })),
      // The payload is the caller's row; value and name come per point.
      dataDefinedOnItem: points.value.map(point => point.payload),
      values: Object.fromEntries(points.value.map(point => [point.index, point.value])),
      names: Object.fromEntries(points.value.map(point => [point.index, nameOf(point)])),
      positions: undefined,
      settings: {
        stroke: props.color,
        strokeWidth: undefined,
        fill: props.color,
        dataKey: 'value',
        nameKey: 'name',
        name: undefined,
        hide: false,
        type: undefined,
        color: props.color,
        unit: '',
        formatter: (value, _name, entry) => typeof value === 'number' ? valueText(value, entry.payload) : value,
      },
    }
  })
  tooltip.entries.register(configuration)
  const active = tooltip.activeIndexFor(configuration)
  function setActive(index: number | null, keyboard = false) {
    const point = index === null ? undefined : points.value[index]
    if (!point && !keyboard) {
      tooltip.clear('hover')
      return
    }
    const action = {
      index: point ? point.index : null,
      configuration: configuration.value,
      coordinate: point && defined(point) ? { x: point.x, y: point.y } : undefined,
    }
    if (keyboard)
      tooltip.activate('keyboard', { ...action, active: !!point })
    else
      tooltip.activate('hover', { ...action, type: 'item' })
  }

  function onPointer(event: MouseEvent) {
    const svg = (event.currentTarget as SVGGElement).ownerSVGElement
    if (!svg || points.value.length === 0)
      return
    const box = svg.getBoundingClientRect()
    const x = (event.clientX - box.left) * (size.effectiveWidth.value / (box.width || size.effectiveWidth.value))
    let nearest = 0
    for (const point of points.value) {
      if (Math.abs(point.x - x) < Math.abs(points.value[nearest].x - x))
        nearest = point.index
    }
    setActive(nearest)
  }

  // Keyboard focus must show where it is: start on the latest point.
  const { onFocus, onKeydown } = useItemKeyboard<number>({
    empty: () => points.value.length === 0,
    start: () => active.value == null ? points.value.length - 1 : undefined,
    neighbour: (key) => {
      const n = points.value.length
      const current = active.value ?? n
      return key === 'ArrowLeft' ? Math.max(0, current - 1) : key === 'ArrowRight' ? Math.min(n - 1, current + 1) : key === 'Home' ? 0 : key === 'End' ? n - 1 : undefined
    },
    activate: index => setActive(index, true),
    clear: () => setActive(null, true),
  })

  const lastPoint = computed(() => {
    const shown = display.points.value
    for (let i = shown.length - 1; i >= 0; i--) {
      const point = shown[i]
      if (point && defined(point))
        return point
    }
    return undefined
  })
  const activePoint = computed(() => {
    const point = active.value == null ? undefined : points.value[active.value]
    return point && defined(point) ? point : undefined
  })
  const summary = computed(() => {
    const shown = points.value.filter(point => point.value !== null)
    const text = (point: SparkPoint | undefined) => point?.value == null ? '' : valueText(point.value, point.payload)
    return props.title ?? (shown.length ? `Trend: ${shown.length} ${shown.length === 1 ? 'value' : 'values'} from ${text(shown[0])} to ${text(shown.at(-1))}` : 'Trend')
  })

  return () => {
    const width = props.width
    const height = props.height
    return (
      <Layer data-slot="series" class="v-charts-sparkline" data-type={props.type}>
        {props.type === 'bar'
          ? (
              <CellGridLayer
                cells={bars.value}
                gap={props.gap}
                radius={props.radius}
                activeStyle="dim"
                grow="bottom"
                title={summary.value}
                isAnimationActive={props.isAnimationActive}
                transition={props.transition}
                activeIndex={props.activeIndex}
                {...{
                  'onUpdate:activeIndex': (index: number | null) => emit('update:activeIndex', index),
                  'onAnimation-start': () => emit('animation-start'),
                  'onAnimation-end': () => emit('animation-end'),
                }}
              />
            )
          : (
              <g
                role="img"
                tabindex={0}
                aria-label={activePoint.value ? `${summary.value}. Point ${activePoint.value.index + 1}: ${activePoint.value.value === null ? 'no value' : valueText(activePoint.value.value, activePoint.value.payload)}` : summary.value}
                style={{ outline: 'none' }}
                onMousemove={onPointer}
                onMouseleave={() => setActive(null)}
                onKeydown={onKeydown}
                onFocus={onFocus}
                onBlur={() => setActive(null, true)}
              >
                <defs>
                  <SweepClip id={`${id}-sweep`} progress={display.reveal.value} x={-PAD} y={-PAD} width={width + PAD * 2} height={height + PAD * 2} />
                  {props.type === 'area' && (
                    <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" style={{ stopColor: props.color, stopOpacity: 0.28 }} />
                      <stop offset="100%" style={{ stopColor: props.color, stopOpacity: 0 }} />
                    </linearGradient>
                  )}
                </defs>
                <rect x={0} y={0} width={width} height={height} fill="transparent" />
                <g clip-path={`url(#${id}-sweep)`}>
                  {props.type === 'area' && <path class="v-charts-sparkline-area" d={areaPath.value} style={{ fill: `url(#${id}-fill)` }} />}
                  <path class="v-charts-sparkline-line" d={linePath.value} fill="none" stroke-width={props.strokeWidth} stroke-linejoin="round" stroke-linecap="round" style={{ stroke: props.color }} />
                </g>
                {props.endDot && !activePoint.value && lastPoint.value && display.reveal.value >= 1 && (
                  <circle class="v-charts-sparkline-end" cx={lastPoint.value.x} cy={lastPoint.value.y} r={2.5} stroke-width={1.5} style={{ fill: props.color, stroke: 'var(--v-charts-background, #fff)' }} />
                )}
                {activePoint.value && activePoint.value.value !== null && (
                  <g class="v-charts-sparkline-active" style={{ pointerEvents: 'none' }}>
                    <line x1={activePoint.value.x} x2={activePoint.value.x} y1={0} y2={height} stroke-width={1} style={{ stroke: 'var(--v-charts-cursor, #ccc)' }} />
                    <circle cx={activePoint.value.x} cy={activePoint.value.y} r={3} stroke-width={1.5} style={{ fill: props.color, stroke: 'var(--v-charts-background, #fff)' }} />
                  </g>
                )}
              </g>
            )}
      </Layer>
    )
  }
}

export type SparklineSlots<_Row = unknown> = { default?: () => VNode[] }
export type SparklineProps<Row = unknown> = StandaloneChartProps<InstanceType<typeof _Sparkline>['$props'], {
  data: readonly Row[]
  dataKey?: RowDataKey<NoInfer<Row>>
  nameKey?: RowDataKey<NoInfer<Row>>
  valueFormatter?: (value: number, row: NoInfer<Row>) => string
}>

const _Sparkline = defineComponent({
  name: 'Sparkline',
  props: { ...SparklineVueProps, ...chartSizeProps },
  inheritAttrs: false,
  emits: { ...chartEmits, ...sparklineEmits },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { emit, slots, attrs }) {
    const size = useChartShell(reactive({
      width: computed(() => props.width),
      height: computed(() => props.height ?? (props.aspect ? undefined : 32)),
      aspect: computed(() => props.aspect),
      initialDimension: computed(() => props.initialDimension),
    }), standaloneChartOptions('Sparkline'))
    const setupContent = () => ({
      svg: useSparkline(reactive({ ...toRefs(props), width: size.effectiveWidth, height: size.effectiveHeight }), emit),
    })
    return () => (
      <ChartShell {...attrs} {...chartListeners(emit)} size={size} desc={props.desc} overflow="visible" setupContent={setupContent}>
        {{ default: slots.default }}
      </ChartShell>
    )
  },
})

/**
 * A word-sized trend without axes, for stat cards and tables.
 *
 * ```vue
 * <Sparkline :data="[4, 6, 5, 9, 12]" type="area" v-model:active-index="hovered" />
 * ```
 */
export const Sparkline = _Sparkline as unknown as <Row>(
  props: SparklineProps<Row> & Omit<SvgTemplateAttributes, keyof SparklineProps<Row>>,
  context?: ChartRenderContext<SparklineSlots<Row>>,
) => ChartVNode<SparklineProps<Row>, SparklineSlots<Row>>
