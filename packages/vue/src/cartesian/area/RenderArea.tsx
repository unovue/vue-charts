import { usePointEvents, useSeriesPointEvents } from '@/events/usePointEvents'
import { areaEvents } from '@/events/itemEvents'
import type { PropType } from 'vue'
import { Fragment, computed, defineComponent } from 'vue'
import { Layer } from '@/container/Layer'
import type { Point } from '@/types/shape'
import { Curve } from '@/shape/Curve'
import type { AreaPointItem } from '@/core/area'
import { getValueByDataKey } from '@/utils/chart'
import { isClipDot, shouldRenderDots } from '@/core/coordinates'
import { Dot } from '@/shape/Dot'
import { usePointTransition } from '@/animation/usePointTransition'
import { SweepClip } from '@/animation/SweepClip'
import { labelOpacity, polylineLength, sweepShare, sweptLabels } from '@/animation/ridingLabels'
import { drawTiming } from '@/animation/motion'
import { useChart } from '@/model/chart'
import { useAreaContext } from './hooks/useArea'
import { useChartPresentation } from '@/model/presentation'
import { LabelList } from '@/components/label/LabelList'

// The area's dots; series props and slots come from the Area context.
const Dots = defineComponent({
  name: 'Dots',
  props: {
    keys: { type: Array as PropType<PropertyKey[]>, default: () => [] },
    indices: { type: Array as PropType<number[]>, default: () => [] },
    exiting: { type: Array as PropType<boolean[]>, default: () => [] },
    points: {
      type: Array as PropType<ReadonlyArray<Point>>,
      default: () => [],
    },
  },
  setup(_props) {
    const emit = areaEvents.use()
    const { props, attrs, dotSlot, needClip, clipPathId } = useAreaContext()
    const listeners = usePointEvents<AreaPointItem>(emit)

    return () => {
      const { points } = _props
      if (!shouldRenderDots(points, props.dot)) {
        return null
      }
      const clipDot = isClipDot(props.dot)
      const dotObjProps = typeof props.dot === 'object' && props.dot !== null ? props.dot : {}
      const dotsProps = {
        'fill': props.fill,
        'fill-opacity': props.fillOpacity,
        'stroke-width': props.strokeWidth,
        'stroke': props.stroke as string,
      }
      return (
        <Layer
          class="v-charts-area-dots"
          clip-path={needClip.value ? `url(#clipPath-${clipDot ? '' : 'dots-'}${clipPathId.value})` : undefined}
        >
          {
            points?.map((point, position) => {
              const index = _props.indices[position] ?? position
              const exiting = _props.exiting[position]
              const handlers = exiting ? {} : listeners(point as AreaPointItem, index)
              const dotProps = { ...dotsProps, ...attrs, r: 3, ...dotObjProps, cx: point.x, cy: point.y, class: 'v-charts-area-dot', clipDot }
              if (dotSlot) {
                return <g key={_props.keys[position]} pointer-events={exiting ? 'none' : undefined} {...handlers}>{dotSlot(dotProps)}</g>
              }
              return <g key={_props.keys[position]} pointer-events={exiting ? 'none' : undefined} {...handlers}><Dot {...dotProps} /></g>
            })
          }
        </Layer>
      )
    }
  },
})

// The area shape, its outline and dots, revealed by a sweep on entrance.
export const StaticArea = defineComponent({
  name: 'StaticArea',
  setup(_, { slots }) {
    const emit = areaEvents.use()
    const { points, clipPathId, layout, attrs, areaData, props, needClip } = useAreaContext()
    const seriesListeners = useSeriesPointEvents<AreaPointItem>(emit, () => points.value ?? [])
    const offset = useChartPresentation().offset
    const chart = useChart()
    const categoryAxis = computed(() => layout.value === 'vertical'
      ? chart.axis('yAxis', props.yAxisId).settings.value
      : chart.axis('xAxis', props.xAxisId).settings.value)
    const display = usePointTransition(() => points.value, {
      key: (point, index) => {
        const dataKey = categoryAxis.value?.dataKey
        const category = dataKey == null ? undefined : getValueByDataKey(point.payload, dataKey)
        return category == null ? index : String(category)
      },
      baseline: () => areaData.value?.baseLine,
      // A series hidden from the legend folds onto its baseline; a stack closes over it.
      hidden: () => !!props.hide,
      valueAxis: () => layout.value === 'vertical' ? 'x' : 'y',
      isActive: () => props.isAnimationActive !== false,
      transition: () => props.transition,
      // The area sweeps open at the pace a line of the same outline draws, so both move together.
      entrance: () => drawTiming(polylineLength(points.value ?? [])),
      onStart: () => emit('animation-start'),
      onEnd: () => emit('animation-end'),
    })
    const currentPoints = display.points
    const currentBaseLine = display.baseline
    const sweep = computed(() => layout.value === 'vertical'
      ? { start: offset.value.top - 8, size: offset.value.height + 16, vertical: true }
      : { start: offset.value.left - 8, size: offset.value.width + 16, vertical: false })
    // Labels ride along with the points as drawn and fade with points that enter or leave; a
    // series hidden from the legend fades its labels while it folds onto its baseline.
    const labels = computed(() => sweptLabels(display.items.value.map((item) => {
      const opacity = props.hide ? 1 - (item.progress ?? 1) : labelOpacity(item)
      return { ...item.value.point, key: item.key, ...(opacity != null ? { opacity } : {}) }
    }), display.reveal.value, point => sweepShare(sweep.value.vertical ? point.y : point.x, sweep.value.start, sweep.value.size)))

    return () => {
      // Folded flat, a hidden area would still draw its stroke along the baseline.
      if (props.hide && !display.isAnimating.value)
        return null
      const curveAttrs = {
        ...attrs,
        'fill': props.fill,
        'fill-opacity': props.fillOpacity,
        'height': offset.value.height,
        'width': offset.value.width,
        'stroke-width': props.strokeWidth,
      }
      const sweepId = `animationClipPath-${clipPathId.value}`
      const isRange = areaData.value?.isRange
      const showLabels = props.label || slots.label
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
          <g clip-path={display.reveal.value < 1 ? `url(#${sweepId})` : undefined}>
            {currentPoints.value && currentPoints.value.length > 1 && (
              <Layer {...seriesListeners} clip-path={needClip.value ? `url(#clipPath-${clipPathId.value})` : undefined}>
                <Curve
                  {...curveAttrs}
                  points={currentPoints.value}
                  connectNulls={props.connectNulls}
                  type={props.type}
                  layout={layout.value}
                  baseLine={currentBaseLine.value}
                  stroke="none"
                  class="v-charts-area-area"
                />
                {props.stroke !== 'none' && (
                  <Curve
                    {...curveAttrs}
                    layout={layout.value}
                    type={props.type}
                    connectNulls={props.connectNulls}
                    fill="none"
                    points={currentPoints.value}
                    stroke={props.stroke}
                    class="v-charts-area-curve"
                  />
                )}
                {props.stroke !== 'none' && isRange && (
                  <Curve
                    {...curveAttrs}
                    class="v-charts-area-curve"
                    layout={layout.value}
                    type={props.type}
                    connectNulls={props.connectNulls}
                    fill="none"
                    points={typeof currentBaseLine.value === 'number' ? [] : currentBaseLine.value}
                    stroke={props.stroke}
                  />
                )}
              </Layer>
            )}
            <Dots points={currentPoints.value} keys={display.items.value.map(item => item.key)} indices={display.items.value.map(item => item.value.index)} exiting={display.items.value.map(item => item.phase === 'exit')} />
          </g>
          {
            showLabels && (
              <LabelList {...labelProps} data={labels.value} dataKey={props.dataKey} v-slots={{ label: slots.label }} />
            )
          }
        </Fragment>
      )
    }
  },
})
