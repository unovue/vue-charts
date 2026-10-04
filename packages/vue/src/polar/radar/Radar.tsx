import { usePointEvents, useSeriesPointEvents } from '@/events/usePointEvents'
import { radarEvents } from '@/events/itemEvents'
import { useLayerTeleport } from '@/hooks/useLayerTeleport'
import { Fragment, computed, defineComponent, h } from 'vue'
import type { ExtractPropTypes, PropType } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import type { ValueAnimationTransition } from 'motion-dom'
import { useAppSelector } from '@/state/hooks'
import { SetPolarGraphicalItem } from '@/state/SetGraphicalItem'
import { SetLegendPayload } from '@/state/SetLegendPayload'
import { SetTooltipEntrySettings } from '@/state/SetTooltipEntrySettings'
import { selectRadarPoints } from '@/state/selectors/radarSelectors'
import { useIsPanorama } from '@/context/PanoramaContextProvider'
import { Layer } from '@/container/Layer'
import { Dot } from '@/shape/Dot'
import { LabelList } from '@/components/label/LabelList'
import { useKeyedTransition } from '@/animation/useKeyedTransition'
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

function getSinglePolygonPath(points: ReadonlyArray<{ x: number, y: number }>): string {
  if (!points.length)
    return ''
  // Repeat first point at end (matching Recharts getParsedPoints behavior) to ensure
  // explicit close segment for correct SVG fill when used in range paths
  const pts = [...points, points[0]]
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join('')
  return `${path}Z`
}

function getRangePath(
  points: ReadonlyArray<{ x: number, y: number }>,
  baseLinePoints: ReadonlyArray<{ x: number, y: number }>,
): string {
  const outerPath = getSinglePolygonPath(points)
  const inner = getSinglePolygonPath([...baseLinePoints].reverse())
  // Join outer (without closing Z) with inner path
  const outerWithoutZ = outerPath.endsWith('Z') ? outerPath.slice(0, -1) : outerPath
  return `${outerWithoutZ}L${inner.slice(1)}`
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
    const isPanorama = useIsPanorama()

    const radarPoints = useAppSelector(state =>
      selectRadarPoints(state, props.radiusAxisId, props.angleAxisId, isPanorama, props.dataKey),
    )

    const teleport = useLayerTeleport()
    const graphicalLayerRef = useGraphicalLayerRef()

    const callbacks = useAnimationCallbacks(() => emit('animation-start'), () => emit('animation-end'))
    const mix = (from: RadarPoint, to: RadarPoint, t: number): RadarPoint => ({ ...to, x: interpolate(from.x, to.x, t), y: interpolate(from.y, to.y, t) })
    const centre = (point: RadarPoint): RadarPoint => ({ ...point, x: point.cx ?? 0, y: point.cy ?? 0 })
    const { items, isAnimating } = useKeyedTransition(() => radarPoints.value?.points.map((point, index) => ({ point, baseline: radarPoints.value?.baseLinePoints[index] })), {
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

    provideCartesianLabelListData(computed(() => {
      if (props.isAnimationActive && isAnimating.value)
        return undefined
      const data = radarPoints.value
      if (!data)
        return undefined
      return data.points.map(point => ({
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        value: point.value ?? '',
        payload: point.payload,
      }))
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
          />
        </Layer>
      )
      const activePoints = teleport(activePointsEl, graphicalLayerRef)

      const labelEl = !isAnimating.value && props.label
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
  setup(props, { attrs, slots, emit }) {
    radarEvents.provide(emit)
    SetPolarGraphicalItem(computed(() => ({
      type: 'radar' as const,
      data: undefined,
      dataKey: props.dataKey,
      hide: props.hide,
      angleAxisId: props.angleAxisId,
      radiusAxisId: props.radiusAxisId,
    })))

    SetLegendPayload(computed(() => [{
      dataKey: props.dataKey,
      type: props.legendType,
      color: getLegendItemColor(props.stroke, props.fill),
      value: props.name ?? String(props.dataKey ?? ''),
      payload: { ...props },
      inactive: props.hide,
    }]))

    SetTooltipEntrySettings({
      fn: v => v,
      args: computed(() => ({
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
      })),
    })

    const View = useDeferredView(RadarView)
    return () => h(View, { item: props, svgAttrs: attrs }, slots)
  },
})
