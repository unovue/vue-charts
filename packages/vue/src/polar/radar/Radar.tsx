import { useLegendHiddenProps } from '@/hooks/useLegendHiddenProps'
import { usePointEvents, useSeriesPointEvents } from '@/events/usePointEvents'
import { radarEvents } from '@/events/itemEvents'
import { useLayerTeleport } from '@/hooks/useLayerTeleport'
import { Fragment, computed, defineComponent, h } from 'vue'
import type { ExtractPropTypes, PropType } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import type { ValueAnimationTransition } from 'motion-dom'
import { useChart } from '@/model/chart'
import { computeRadarPoints, getRangePath, getSinglePolygonPath } from '@/core/radar'
import { getBandSizeOfAxis } from '@/core/axis/scale'
import { isCategoricalAxis } from '@/utils/validate'
import { Layer } from '@/container/Layer'
import { Dot } from '@/shape/Dot'
import { LabelList } from '@/components/label/LabelList'
import { useKeyedTransition } from '@/animation/useKeyedTransition'
import { labelOpacity } from '@/animation/ridingLabels'
import { useAnimationCallbacks } from '@/animation/useAnimationCallbacks'
import { interpolate } from '@/utils/data-utils'
import { ActivePoints } from '@/cartesian/line/ActivePoints'
import { useGraphicalLayerRef } from '@/context/graphicalLayerContext'
import { provideCartesianLabelListData } from '@/context/cartesianLabelListContext'
import type { DataKey } from '@/types'
import type { LegendType } from '@/types/legend'
import type { TooltipType } from '@/types/tooltip'
import type { RadarPoint } from '@/types/radar'

function getLegendItemColor(stroke: string | undefined, fill: string | undefined): string | undefined {
  return stroke && stroke !== 'none' ? stroke : fill
}

const RadarViewProps = {
  dataKey: { type: [String, Number, Function] as PropType<DataKey<any>>, required: true as const },
  name: { type: String, default: undefined },
  angleAxisId: { type: [String, Number] as PropType<string | number>, default: 0 },
  radiusAxisId: { type: [String, Number] as PropType<string | number>, default: 0 },
  fill: { type: String, default: 'var(--v-charts-series, #808080)' },
  stroke: { type: String, default: undefined },
  fillOpacity: { type: Number, default: 0.6 },
  strokeWidth: { type: Number, default: undefined },
  strokeDasharray: { type: String, default: undefined },
  dot: { type: [Boolean, Object] as PropType<boolean | Record<string, any>>, default: false },
  hide: { type: Boolean, default: false },
  legendType: { type: String as PropType<LegendType>, default: 'rect' },
  tooltipType: { type: String as PropType<TooltipType>, default: undefined },
  connectNulls: { type: Boolean, default: false },
  label: { type: [Boolean, Object] as PropType<boolean | Record<string, any>>, default: false },
  isAnimationActive: { type: Boolean, default: true },
  transition: {
    type: Object as PropType<ValueAnimationTransition<number>>,
    default: undefined,
  },
  activeDot: { type: [Object, Boolean] as PropType<object | boolean>, default: true },
}

const RadarView = defineComponent({
  name: 'RadarView',
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<ExtractPropTypes<typeof RadarViewProps>>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  setup(view, { slots }) {
    const emit = radarEvents.use()
    const props = view.item
    const listeners = usePointEvents<RadarPoint>(emit, () => props.dataKey)
    const attrs = view.svgAttrs

    const chart = useChart()
    const radiusAxis = computed(() => chart.axis('radiusAxis', props.radiusAxisId))
    const angleAxis = computed(() => chart.axis('angleAxis', props.angleAxisId))
    const bandSize = computed(() => {
      const axis = isCategoricalAxis(chart.inputs.layout(), 'radiusAxis') ? radiusAxis.value : angleAxis.value
      return getBandSizeOfAxis(axis.withScale.value, axis.ticks.value ?? undefined)
    })
    const radarPoints = computed(() => {
      const radiusScale = radiusAxis.value.scale.value
      const angleScale = angleAxis.value.scale.value
      const viewport = chart.polarLayout.viewBox.value
      const displayedData = chart.data.value
      const band = bandSize.value
      if (!radiusScale || !angleScale || !viewport || !displayedData || band == null || props.dataKey == null)
        return undefined
      const settings = angleAxis.value.settings.value
      return computeRadarPoints({
        radiusAxis: { scale: radiusScale },
        angleAxis: {
          scale: angleScale,
          type: settings.type,
          dataKey: settings.dataKey,
          cx: viewport.cx,
          cy: viewport.cy,
        },
        displayedData,
        dataKey: props.dataKey,
        bandSize: band,
      })
    })

    const teleport = useLayerTeleport()
    const graphicalLayerRef = useGraphicalLayerRef()

    const callbacks = useAnimationCallbacks(() => emit('animation-start'), () => emit('animation-end'))
    const mix = (from: RadarPoint, to: RadarPoint, t: number): RadarPoint => ({ ...to, x: interpolate(from.x, to.x, t), y: interpolate(from.y, to.y, t) })
    const centre = (point: RadarPoint): RadarPoint => ({ ...point, x: point.cx ?? 0, y: point.cy ?? 0 })
    const { items } = useKeyedTransition(() => radarPoints.value?.points.map((point, index) => ({ point, baseline: radarPoints.value?.baseLinePoints[index] })), {
      key: ({ point }, index) => point.name ?? index,
      interpolate: (from, to, t) => ({ point: mix(from.point, to.point, t), baseline: from.baseline && to.baseline ? mix(from.baseline, to.baseline, t) : to.baseline }),
      enterFrom: to => ({ point: centre(to.point), baseline: to.baseline && centre(to.baseline) }),
      exitTo: from => ({ point: centre(from.point), baseline: from.baseline && centre(from.baseline) }),
      connected: true,
      isActive: () => props.isAnimationActive,
      transition: () => props.transition,
      onEnd: callbacks.onEnd,
      onStart: callbacks.onStart,

    })

    // Labels ride along with the points as drawn, show the new values at once and fade with
    // points that enter or leave.
    provideCartesianLabelListData(computed(() => {
      if (items.value.length === 0)
        return undefined
      return items.value.map((item) => {
        const point = item.value.point
        const opacity = labelOpacity(item)
        return {
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
          value: point.value ?? '',
          payload: point.payload,
          key: item.key,
          ...(opacity != null ? { opacity } : {}),
        }
      })
    }))

    const seriesListeners = useSeriesPointEvents<RadarPoint>(emit, () => props.dataKey, () => radarPoints.value?.points ?? [])

    const renderPolygon = (
      points: RadarPoint[],
      baseLinePoints: RadarPoint[],
      isRange: boolean,
    ) => {
      const stroke = props.stroke ?? props.fill
      const hasStroke = stroke && stroke !== 'none'

      let pathD: string
      if (isRange && baseLinePoints.length > 0) {
        pathD = getRangePath(points, baseLinePoints)
      }
      else {
        pathD = getSinglePolygonPath(points)
      }

      const isClosed = pathD.endsWith('Z')

      return (
        <Layer class="v-charts-radar">
          <g class="v-charts-radar-polygon" {...seriesListeners}>
            {isRange && baseLinePoints.length > 0
              ? (
                  <g>
                    <path
                      d={pathD}
                      fill={isClosed ? props.fill : 'none'}
                      fill-opacity={props.fillOpacity}
                      stroke="none"
                      stroke-dasharray={props.strokeDasharray}
                    />
                    {hasStroke && (
                      <path
                        d={getSinglePolygonPath(points)}
                        fill="none"
                        stroke={stroke}
                        stroke-width={props.strokeWidth}
                        stroke-dasharray={props.strokeDasharray}
                      />
                    )}
                    {hasStroke && (
                      <path
                        d={getSinglePolygonPath(baseLinePoints)}
                        fill="none"
                        stroke={stroke}
                        stroke-width={props.strokeWidth}
                        stroke-dasharray={props.strokeDasharray}
                      />
                    )}
                  </g>
                )
              : (
                  <path
                    d={pathD}
                    fill={isClosed ? props.fill : 'none'}
                    fill-opacity={props.fillOpacity}
                    stroke={stroke}
                    stroke-width={props.strokeWidth}
                    stroke-dasharray={props.strokeDasharray}
                  />
                )}
          </g>
          {props.dot && (
            <g class="v-charts-radar-dots">
              {points.map((point, i) => {
                const dotProps = typeof props.dot === 'object' ? props.dot : {}
                return (
                  <g key={items.value[i].key} {...listeners(point, i)}>
                    <Dot
                      cx={point.x}
                      cy={point.y}
                      r={3}
                      fill={props.fill}
                      stroke={stroke}
                      {...dotProps}
                    />
                  </g>
                )
              })}
            </g>
          )}
        </Layer>
      )
    }

    return () => {
      if (props.hide)
        return null

      const data = radarPoints.value
      if (items.value.length === 0)
        return null

      const points = data?.points ?? []
      const isRange = data?.isRange ?? false

      const mainColor = getLegendItemColor(props.stroke, props.fill) ?? props.fill

      const activePointsEl = (
        <Layer {...seriesListeners}>
          <ActivePoints
            points={points}
            mainColor={mainColor}
            itemDataKey={props.dataKey}
            activeDot={props.activeDot}
            isAnimationActive={props.isAnimationActive}
          />
        </Layer>
      )
      const activePoints = teleport(activePointsEl, graphicalLayerRef)

      const labelEl = props.label
        ? <LabelList {...(typeof props.label === 'object' ? props.label : {})} />
        : null

      return (
        <Fragment>
          {renderPolygon(items.value.map(item => item.value.point), items.value.flatMap(item => item.value.baseline ? [item.value.baseline] : []), isRange)}
          {labelEl}
          {activePoints}
        </Fragment>
      )
    }
  },
})

export const Radar = defineComponent({
  name: 'Radar',
  emits: radarEvents.emits,
  inheritAttrs: false,
  props: RadarViewProps,
  setup(inputProps, { attrs, slots, emit }) {
    const props = useLegendHiddenProps(inputProps)
    radarEvents.provide(emit)
    useChart().items.polar.register(computed(() => ({
      stackId: undefined,
      barSize: undefined,
      type: 'radar' as const,
      data: undefined,
      dataKey: props.dataKey,
      hide: props.hide,
      angleAxisId: props.angleAxisId,
      radiusAxisId: props.radiusAxisId,
    })))

    useChart().legend.entries.register(computed(() => [{
      dataKey: props.dataKey,
      type: props.legendType,
      color: getLegendItemColor(props.stroke, props.fill),
      value: props.name ?? String(props.dataKey ?? ''),
      payload: { ...props },
      inactive: props.hide,
    }]))

    useChart().tooltip.entries.register(computed(() => ({
      dataDefinedOnItem: undefined,
      positions: undefined,
      settings: {
        dataKey: props.dataKey,
        nameKey: undefined,
        name: props.name ?? String(props.dataKey ?? ''),
        hide: props.hide,
        type: props.tooltipType,
        color: getLegendItemColor(props.stroke, props.fill),
        fill: props.fill,
        stroke: props.stroke,
        unit: '',
      },
    })))

    const View = useDeferredView(RadarView)
    return () => h(View, { item: props, svgAttrs: attrs }, slots)
  },
})
