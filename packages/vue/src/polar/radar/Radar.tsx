import { Fragment, Teleport, computed, defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { AnimationOptions } from 'motion-v'
import { useAppSelector } from '@/state/hooks'
import { SetPolarGraphicalItem } from '@/state/SetGraphicalItem'
import { SetLegendPayload } from '@/state/SetLegendPayload'
import { SetTooltipEntrySettings } from '@/state/SetTooltipEntrySettings'
import { selectRadarPoints } from '@/state/selectors/radarSelectors'
import { useIsPanorama } from '@/context/PanoramaContextProvider'
import { Layer } from '@/container/Layer'
import { Dot } from '@/shape/Dot'
import { LabelList } from '@/components/label/LabelList'
import { Animate } from '@/animation/Animate'
import { interpolate } from '@/utils/data-utils'
import { ActivePoints } from '@/cartesian/line/ActivePoints'
import { useGraphicalLayerRef } from '@/context/graphicalLayerContext'
import { provideCartesianLabelListData } from '@/context/cartesianLabelListContext'
import { useIsAnimating } from '@/hooks/useIsAnimating'
import type { DataKey } from '@/types'
import type { LegendType } from '@/types/legend'
import type { TooltipType } from '@/types/tooltip'
import type { RadarComposedData, RadarPoint } from '@/types/radar'

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

function interpolatePolarPoint(
  prevPoints: RadarPoint[] | null,
  prevPointsDiffFactor: number,
  t: number,
  entry: RadarPoint,
  index: number,
): RadarPoint {
  const prev = prevPoints && prevPoints[Math.floor(index * prevPointsDiffFactor)]
  if (prev) {
    return { ...entry, x: interpolate(prev.x, entry.x, t), y: interpolate(prev.y, entry.y, t) }
  }
  // New point: animate from center
  return { ...entry, x: interpolate(entry.cx ?? 0, entry.x, t), y: interpolate(entry.cy ?? 0, entry.y, t) }
}

export const Radar = defineComponent({
  name: 'Radar',
  inheritAttrs: false,
  props: {
    dataKey: { type: [String, Number, Function] as PropType<DataKey<any>>, required: true },
    name: { type: String, default: undefined },
    angleAxisId: { type: [String, Number] as PropType<string | number>, default: 0 },
    radiusAxisId: { type: [String, Number] as PropType<string | number>, default: 0 },
    fill: { type: String, default: '#808080' },
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
      type: Object as PropType<AnimationOptions>,
      default: () => ({ duration: 0.8, ease: 'easeOut' }),
    },
    activeDot: { type: [Object, Boolean] as PropType<object | boolean>, default: true },
  },
  setup(props) {
    const isPanorama = useIsPanorama()

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

    const radarPoints = useAppSelector(state =>
      selectRadarPoints(state, props.radiusAxisId, props.angleAxisId, isPanorama, props.dataKey),
    )

    const graphicalLayerRef = useGraphicalLayerRef()

    const isAnimating = useIsAnimating(() => props.isAnimationActive)

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

    let prevPoints: RadarPoint[] | null = null
    let prevBaseLinePoints: RadarPoint[] | null = null
    let animationId = 0
    let lastData: RadarComposedData | undefined

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
          <g class="v-charts-radar-polygon">
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
                  <Dot
                    key={`dot-${i}`}
                    cx={point.x}
                    cy={point.y}
                    r={3}
                    fill={props.fill}
                    stroke={stroke}
                    {...dotProps}
                  />
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
      if (data == null || data.points.length === 0)
        return null

      const { points, baseLinePoints, isRange } = data

      const mainColor = getLegendItemColor(props.stroke, props.fill) ?? props.fill

      const activePointsEl = (
        <ActivePoints
          points={points}
          mainColor={mainColor}
          itemDataKey={props.dataKey}
          activeDot={props.activeDot}
        />
      )
      const activePoints = graphicalLayerRef?.value
        ? <Teleport to={graphicalLayerRef.value}>{activePointsEl}</Teleport>
        : activePointsEl

      const labelEl = !isAnimating.value && props.label
        ? <LabelList {...(typeof props.label === 'object' ? props.label : {})} />
        : null

      if (!props.isAnimationActive) {
        prevPoints = points
        prevBaseLinePoints = baseLinePoints
        return (
          <Fragment>
            {renderPolygon(points, baseLinePoints, isRange)}
            {labelEl}
            {activePoints}
          </Fragment>
        )
      }

      const prevPts = prevPoints
      const prevBasePts = prevBaseLinePoints
      const prevPointsDiffFactor = prevPts ? prevPts.length / points.length : 1
      const prevBaseDiffFactor = prevBasePts ? prevBasePts.length / baseLinePoints.length : 1
      if (data !== lastData) {
        animationId++
        lastData = data
      }

      return (
        <Fragment>
          <Animate
            key={animationId}
            isActive={true}
            transition={props.transition}
            onAnimationStart={() => { isAnimating.value = true }}
            onAnimationEnd={() => { isAnimating.value = false }}
          >
            {(t: number) => {
              const stepPoints: RadarPoint[] = t === 1
                ? points
                : points.map((entry, i) => interpolatePolarPoint(prevPts, prevPointsDiffFactor, t, entry, i))

              const stepBaseLine: RadarPoint[] = t === 1
                ? baseLinePoints
                : baseLinePoints.map((entry, i) => interpolatePolarPoint(prevBasePts, prevBaseDiffFactor, t, entry, i))

              if (t > 0) {
                prevPoints = stepPoints
                prevBaseLinePoints = stepBaseLine
              }

              return renderPolygon(stepPoints, stepBaseLine, isRange)
            }}
          </Animate>
          {labelEl}
          {activePoints}
        </Fragment>
      )
    }
  },
})
