import { usePointEvents, useSeriesPointEvents } from '@/events/usePointEvents'
import { lineEvents } from '@/events/itemEvents'
import type { PropType } from 'vue'
import { Fragment, computed, defineComponent, watch } from 'vue'
import { useOffset } from '@/context/chartLayoutContext'
import { Layer } from '@/container/Layer'
import type { Point } from '@/shape/Curve'
import { Curve } from '@/shape/Curve'
import type { LinePointItem } from './type'
import { useLineContext } from './hooks/useLine'
import { Dot } from '@/shape/Dot'
import { LabelList } from '@/components/label/LabelList'
import { usePointTransition } from '@/animation/usePointTransition'
import { labelOpacity, lengthShares, polylineLength, sweptLabels } from '@/animation/ridingLabels'
import { drawTiming } from '@/animation/motion'
import { SweepClip } from '@/animation/SweepClip'
import { useChart } from '@/model/chart'
import { getValueByDataKey } from '@/utils/chart'
// Dots component
const Dots = defineComponent({
  name: 'LineDots',
  props: {
    keys: { type: Array as PropType<PropertyKey[]>, default: () => [] },
    indices: { type: Array as PropType<number[]>, default: () => [] },
    exiting: { type: Array as PropType<boolean[]>, default: () => [] },
    /** Below 1 while a dot appears behind the tip of a line drawing itself. */
    opacities: { type: Array as PropType<(number | undefined)[]>, default: () => [] },
    points: {
      type: Array as PropType<ReadonlyArray<Point>>,
      default: () => [],
    },
  },
  setup(_props) {
    const emit = lineEvents.use()
    const { clipPathId, clipDot, props, attrs, needClip, dotSlot } = useLineContext()
    const listeners = usePointEvents<LinePointItem>(emit, () => props.dataKey)

    return () => {
      const { points } = _props
      if (!shouldRenderDots(points!, props.dot!)) {
        return null
      }
      const dotObjProps = typeof props.dot === 'object' && props.dot !== null ? props.dot : {}
      const dotsProps = {
        'fill': 'var(--v-charts-background, #fff)',
        'stroke': props.stroke,
        'stroke-width': props.strokeWidth,
        ...dotObjProps,
      }
      return (
        <Layer
          class="v-charts-line-dots"
          clip-path={needClip.value ? `url(#clipPath-${clipDot ? '' : 'dots-'}${clipPathId.value})` : undefined}
        >
          {
            points?.map((point, position) => {
              const index = _props.indices[position] ?? position
              const exiting = _props.exiting[position]
              const handlers = exiting ? {} : listeners(point as LinePointItem, index)
              const pointAsLine = point as LinePointItem
              if (dotSlot) {
                return <g key={_props.keys[position]} opacity={_props.opacities[position]} pointer-events={exiting ? 'none' : undefined} {...handlers}>{dotSlot({ ...dotsProps, ...attrs, cx: point.x, cy: point.y, index, value: pointAsLine.value, payload: pointAsLine.payload })}</g>
              }
              return <g key={_props.keys[position]} opacity={_props.opacities[position]} pointer-events={exiting ? 'none' : undefined} {...handlers}><Dot r={3} {...dotsProps} {...attrs} cx={point.x} cy={point.y} class="v-charts-line-dot" clipDot={clipDot} /></g>
            })
          }
        </Layer>
      )
    }
  },
})

export const StaticLine = defineComponent({
  name: 'StaticLine',
  setup() {
    const emit = lineEvents.use()
    const { points, clipPathId, layout, attrs, props, isAnimating, needClip, shapeSlot, labelSlot, labelData } = useLineContext()
    const seriesListeners = useSeriesPointEvents<LinePointItem>(emit, () => props.dataKey, () => points.value ?? [])
    const offset = useOffset()
    const chart = useChart()
    const categoryAxis = computed(() => layout.value === 'vertical'
      ? chart.axis('yAxis', props.yAxisId).settings.value
      : chart.axis('xAxis', props.xAxisId).settings.value)
    // A series hidden from the legend sweeps out instead of vanishing.
    const display = usePointTransition(() => props.hide ? [] : points.value, {
      key: (point, index) => {
        const dataKey = categoryAxis.value?.dataKey
        const category = dataKey == null ? undefined : getValueByDataKey(point.payload, dataKey)
        return category == null ? index : String(category)
      },
      isActive: () => props.isAnimationActive !== false,
      transition: () => props.transition,
      // The line draws itself along its length, also after hydration (the server sends it
      // undrawn), like Recharts.
      entrance: () => drawTiming(polylineLength(points.value ?? [])),
      entranceAfterHydration: true,
      onStart: () => emit('animation-start'),
      onEnd: () => emit('animation-end'),
    })
    watch(display.isAnimating, (value) => { isAnimating.value = value }, { immediate: true })
    // Where the tip of the drawing line reaches each point, as a share of the line's length.
    const reached = computed(() => lengthShares(display.points.value))
    // Labels ride along with the points as drawn, appear as the tip reaches them and fade
    // with points that enter or leave.
    watch(() => sweptLabels(display.items.value.map((item) => {
      const opacity = labelOpacity(item)
      return { ...item.value.point, key: item.key, ...(opacity != null ? { opacity } : {}) }
    }), display.reveal.value, (_, index) => reached.value[index]), (value) => {
      labelData.value = value
    }, { immediate: true, flush: 'sync' })
    /** Dots pop in just behind the tip while the line draws itself. */
    const dotOpacities = computed(() => {
      const reveal = display.reveal.value
      if (reveal >= 1)
        return []
      return reached.value.map(at => at == null ? 0 : Math.min(1, Math.max(0, (reveal - at) / 0.04)))
    })
    return () => {
      const curveProps = {
        ...attrs,
        'fill': 'none',
        'stroke': props.stroke,
        'stroke-width': props.strokeWidth,
        'points': display.points.value,
        'connectNulls': props.connectNulls,
        'type': props.type,
        'layout': layout.value === 'vertical' ? 'vertical' as const : 'horizontal' as const,
        'class': 'v-charts-line-curve',
      }
      const reveal = display.reveal.value
      // A drawn line: the stroke grows along the normalised path length, so its tip travels the
      // curve. A custom shape may not pass dash attributes on, so it keeps the sweep clip.
      const drawing = reveal < 1 && !shapeSlot
      const drawnCurveProps = drawing ? { ...curveProps, 'pathLength': 1, 'stroke-dasharray': `${reveal} 1` } : curveProps
      const sweepId = `line-anim-${clipPathId.value}`
      const labelProps = typeof props.label === 'object' ? props.label : {}
      return (
        <Fragment>
          <defs>
            <SweepClip
              id={sweepId}
              progress={display.reveal.value}
              vertical={layout.value === 'vertical'}
              x={offset.value.left - 8}
              y={offset.value.top - 8}
              width={offset.value.width + 16}
              height={offset.value.height + 16}
            />
          </defs>
          <g clip-path={reveal < 1 && shapeSlot ? `url(#${sweepId})` : undefined}>
            <Layer {...seriesListeners} clip-path={needClip.value ? `url(#clipPath-${clipPathId.value})` : undefined}>
              {display.points.value.length > 1 && (shapeSlot ? shapeSlot(curveProps) : <Curve {...drawnCurveProps} />)}
            </Layer>
            <Dots points={display.points.value} keys={display.items.value.map(item => item.key)} indices={display.items.value.map(item => item.value.index)} exiting={display.items.value.map(item => item.phase === 'exit')} opacities={dotOpacities.value} />
          </g>
          {(props.label || labelSlot) && (
            <LabelList
              {...labelProps}
              data={labelData.value ?? []}
              dataKey={props.dataKey}

              v-slots={labelSlot ? { label: labelSlot } : undefined}
            />
          )}
        </Fragment>
      )
    }
  },
})

function shouldRenderDots(points: ReadonlyArray<LinePointItem>, dot: unknown): boolean {
  return points != null && points.length > 0 && (!!dot || points.length === 1)
}
