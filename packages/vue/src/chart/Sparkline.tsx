import { type PropType, type SlotsType, computed, defineComponent, reactive, ref, useId, watch } from 'vue'
import { curveLinear, curveMonotoneX, area as d3Area, line as d3Line } from 'd3-shape'
import { chartEmits, chartListeners } from '@/events/componentEvents'
import { provideChartContext, useChartTooltip } from '@/state/chartContext'
import type { TooltipPayloadConfiguration } from '@/state/chartTooltip'
import { provideRenderPhase } from '@/animation/renderPhase'
import { usePointTransition } from '@/animation/usePointTransition'
import { SweepClip } from '@/animation/SweepClip'
import { chartSizeProps, useResponsiveSize } from '@/hooks/useResponsiveSize'
import { useTrackedData } from '@/hooks/useTrackedData'
import { Layer } from '@/container/Layer'
import Surface from '@/container/Surface'
import { ChartsWrapper } from './ChartsWrapper'
import { CellGridLayer, boxAttrs, cellChartOptions, cellGridSharedProps, isFocusVisible, rootAttrs } from './CellGridLayer'
import type { GridCell } from './cellGridUtils'

type SparkValue = number | null | undefined
type SparkRow = SparkValue | Record<string, any>

interface SparkPoint {
  x: number
  y: number
  value: number | null
  index: number
  payload: SparkRow
}

/** Room for the end dot and the stroke at the edges. */
const PAD = 3

export const SparklineVueProps = {
  isAnimationActive: cellGridSharedProps.isAnimationActive,
  transition: cellGridSharedProps.transition,
  /** Numbers, or rows with `data-key`. `null` leaves a gap. */
  data: { type: Array as PropType<SparkRow[]>, required: true as const },
  dataKey: { type: String, default: 'value' },
  /** Identity of a point across updates, e.g. its date, so a moving window slides. Defaults to the position. */
  nameKey: { type: String, default: undefined },
  type: { type: String as PropType<'line' | 'area' | 'bar'>, default: 'line' },
  color: { type: String, default: 'var(--v-charts-series, #2563eb)' },
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
  ariaLabel: { type: String, default: 'Trend' },
}

const sparklineEmits = {
  'update:activeIndex': (_index: number | null) => true,
  'animation-start': () => true,
  'animation-end': () => true,
}

const SparklineInner = defineComponent({
  name: 'SparklineInner',
  props: { ...SparklineVueProps, width: { type: Number, required: true as const }, height: { type: Number, required: true as const } },
  emits: sparklineEmits,
  setup(props, { emit }) {
    const tooltip = useChartTooltip()
    const id = useId()
    const size = { effectiveWidth: computed(() => props.width), effectiveHeight: computed(() => props.height) }
    const rows = useTrackedData(() => props.data)

    const values = computed(() => (rows.value ?? []).map((row) => {
      const raw = row !== null && typeof row === 'object' ? row[props.dataKey] : row
      const value = Number(raw)
      return raw == null || !Number.isFinite(value) ? null : value
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
      if (hi === lo) {
        hi += 1
        lo -= props.type === 'bar' ? 0 : 1
      }
      return { lo, hi }
    })

    const points = computed<SparkPoint[]>(() => {
      const width = size.effectiveWidth.value
      const height = size.effectiveHeight.value
      const n = values.value.length
      const { lo, hi } = domain.value
      const yOf = (value: number) => PAD + (1 - (value - lo) / (hi - lo)) * (height - PAD * 2)
      return values.value.map((value, index) => ({
        x: n === 1 ? width / 2 : PAD + index * (width - PAD * 2) / (n - 1),
        // A gap stays a gap; the transition never interpolates through it.
        y: value === null ? (null as unknown as number) : yOf(value),
        value,
        index,
        payload: rows.value?.[index],
      }))
    })
    const keyOf = (point: SparkPoint) => {
      const row = point.payload
      const name = props.nameKey && row !== null && typeof row === 'object' ? row[props.nameKey] : undefined
      return name == null ? point.index : String(name)
    }
    const baselineY = computed(() => size.effectiveHeight.value - PAD)
    const display = usePointTransition(() => props.type === 'bar' ? [] : points.value, {
      key: keyOf,
      baseline: () => baselineY.value,
      isActive: () => props.isAnimationActive,
      transition: () => props.transition,
      onStart: () => emit('animation-start'),
      onEnd: () => emit('animation-end'),
    })

    const curve = computed(() => props.curve === 'linear' ? curveLinear : curveMonotoneX)
    const defined = (p: { y: number | null }) => p.y != null && Number.isFinite(p.y)
    const linePath = computed(() => d3Line<SparkPoint>().defined(defined).x(p => p.x).y(p => p.y).curve(curve.value)(display.points.value as SparkPoint[]) ?? '')
    const areaPath = computed(() => d3Area<SparkPoint>().defined(defined).x(p => p.x).y0(baselineY.value).y1(p => p.y).curve(curve.value)(display.points.value as SparkPoint[]) ?? '')

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
        label: String(point.index + 1),
        value: point.value,
        payload: point.payload,
      }))
    })

    // Active point: controlled through v-model:active-index, otherwise local.
    const localActive = ref<number | null>(null)
    const active = computed(() => props.activeIndex !== undefined ? props.activeIndex : localActive.value)
    function setActive(index: number | null) {
      if (index === active.value)
        return
      localActive.value = index
      emit('update:activeIndex', index)
    }
    watch(active, (index) => {
      if (props.type === 'bar')
        return
      const point = index == null ? undefined : points.value[index]
      if (!point || point.value === null) {
        tooltip.mouseLeaveItem()
        return
      }
      tooltip.setActiveMouseOverItemIndex({ activeIndex: String(index), activeDataKey: 'value', activeCoordinate: { x: point.x, y: point.y } })
    })

    // Line and area register their own tooltip entries; bars get theirs from the cell grid.
    watch(computed(() => {
      if (props.type === 'bar')
        return undefined
      const settings: TooltipPayloadConfiguration = {
        dataDefinedOnItem: points.value.map(point => ({ name: props.nameKey && point.payload !== null && typeof point.payload === 'object' ? String(point.payload[props.nameKey]) : String(point.index + 1), value: point.value, payload: point.payload, color: props.color })),
        positions: undefined,
        settings: { stroke: props.color, strokeWidth: undefined, fill: props.color, dataKey: 'value', nameKey: 'name', name: undefined, hide: false, type: undefined, color: props.color, unit: '' },
      }
      return settings
    }), (settings, _previous, onCleanup) => {
      if (!settings)
        return
      tooltip.addTooltipEntrySettings(settings)
      onCleanup(() => tooltip.removeTooltipEntrySettings(settings))
    }, { immediate: true })

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

    function onKeydown(event: KeyboardEvent) {
      const n = points.value.length
      if (!n)
        return
      const current = active.value ?? n
      const next = event.key === 'ArrowLeft' ? Math.max(0, current - 1) : event.key === 'ArrowRight' ? Math.min(n - 1, current + 1) : event.key === 'Home' ? 0 : event.key === 'End' ? n - 1 : undefined
      if (event.key === 'Escape')
        setActive(null)
      if (next === undefined)
        return
      event.preventDefault()
      setActive(next)
    }

    const lastPoint = computed(() => {
      const shown = display.points.value as SparkPoint[]
      for (let i = shown.length - 1; i >= 0; i--) {
        if (defined(shown[i]))
          return shown[i]
      }
      return undefined
    })
    const activePoint = computed(() => active.value == null ? undefined : points.value[active.value])
    const summary = computed(() => {
      const finite = values.value.filter((value): value is number => value !== null)
      return finite.length ? `${props.ariaLabel}: ${finite.length} values from ${finite[0]} to ${finite.at(-1)}` : props.ariaLabel
    })

    return () => {
      const width = props.width
      const height = props.height
      return (
        <Surface width={width} height={height} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <Layer class="v-charts-sparkline" data-type={props.type}>
            {props.type === 'bar'
              ? (
                  <CellGridLayer
                    cells={bars.value}
                    gap={props.gap}
                    radius={props.radius}
                    activeStyle="dim"
                    grow="bottom"
                    ariaLabel={summary.value}
                    isAnimationActive={props.isAnimationActive}
                    transition={props.transition}
                    activeIndex={active.value}
                    {...{
                      'onUpdate:activeIndex': (index: number | null) => setActive(index),
                      'onAnimation-start': () => emit('animation-start'),
                      'onAnimation-end': () => emit('animation-end'),
                    }}
                  />
                )
              : (
                  <g
                    role="img"
                    tabindex={0}
                    aria-label={activePoint.value ? `${summary.value}. Point ${activePoint.value.index + 1}: ${activePoint.value.value ?? 'no value'}` : summary.value}
                    style={{ outline: 'none' }}
                    onMousemove={onPointer}
                    onMouseleave={() => setActive(null)}
                    onKeydown={onKeydown}
                    onFocus={(event: FocusEvent) => {
                      if (active.value == null && points.value.length && isFocusVisible(event.target as Element))
                        setActive(points.value.length - 1)
                    }}
                    onBlur={() => setActive(null)}
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
        </Surface>
      )
    }
  },
})

const _Sparkline = defineComponent({
  name: 'Sparkline',
  props: { ...SparklineVueProps, ...chartSizeProps },
  inheritAttrs: false,
  emits: { ...chartEmits, ...sparklineEmits },
  slots: Object as SlotsType<{ default?: () => any }>,
  setup(props, { emit, slots, attrs }) {
    provideChartContext(cellChartOptions('Sparkline'))
    provideRenderPhase()
    const size = useResponsiveSize(reactive({
      width: computed(() => props.width),
      height: computed(() => props.height ?? (props.aspect ? undefined : 32)),
      aspect: computed(() => props.aspect),
      initialDimension: computed(() => props.initialDimension),
    }))
    return () => {
      const { width: _w, height: _h, aspect: _a, initialDimension: _i, ...inner } = props
      return (
        <ChartsWrapper {...boxAttrs(attrs)} {...chartListeners(emit)} isResponsive={size.isResponsive.value} boxStyle={size.boxStyle.value} interactive={!size.isResponsive.value || size.measured.value} onResize={size.handleResize} width={size.effectiveWidth.value} height={size.effectiveHeight.value}>
          <SparklineInner
            {...rootAttrs(attrs)}
            {...inner}
            width={size.effectiveWidth.value}
            height={size.effectiveHeight.value}
            {...{
              'onUpdate:activeIndex': (index: number | null) => emit('update:activeIndex', index),
              'onAnimation-start': () => emit('animation-start'),
              'onAnimation-end': () => emit('animation-end'),
            }}
          />
          {slots.default?.()}
        </ChartsWrapper>
      )
    }
  },
})

/**
 * A word-sized trend without axes, for stat cards and tables.
 *
 * ```vue
 * <Sparkline :data="[4, 6, 5, 9, 12]" type="area" v-model:active-index="hovered" />
 * ```
 */
export const Sparkline = _Sparkline as typeof _Sparkline & {
  new (): { $slots: { default?: () => any } }
}
