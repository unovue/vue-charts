import type { ChartDataKey } from '@/types/base'
import { last } from 'es-toolkit/compat'
import type { AngleAxisForRadar, RadarComposedData, RadiusAxisForRadar } from '@/types/radar'
import { getValueByDataKey } from '@/core/data'
import { polarToCartesian } from '@/utils/polar'
import { toFiniteNumber } from '@/utils/validate'

export function computeRadarPoints({
  radiusAxis,
  angleAxis,
  displayedData,
  dataKey,
  bandSize,
}: {
  radiusAxis: RadiusAxisForRadar
  angleAxis: AngleAxisForRadar
  displayedData: unknown[]
  dataKey: ChartDataKey
  bandSize: number
}): RadarComposedData {
  const { cx, cy } = angleAxis
  let isRange = false
  const points: RadarComposedData['points'] = []
  const angleBandSize = angleAxis.type !== 'number' ? (bandSize ?? 0) : 0

  displayedData.forEach((entry, i) => {
    const name = getValueByDataKey(entry, angleAxis.dataKey, i)
    const value = getValueByDataKey(entry, dataKey)
    const angle: number = (angleAxis.scale(name) ?? 0) + angleBandSize
    const pointValue = toFiniteNumber(Array.isArray(value) ? last(value) : value)
    const radius: number = pointValue == null ? 0 : (radiusAxis.scale(pointValue) ?? 0)

    if (Array.isArray(value) && value.length >= 2) {
      isRange = true
    }

    points.push({
      ...polarToCartesian(cx, cy, radius, angle),
      name,
      value,
      cx,
      cy,
      radius,
      angle,
      payload: entry,
    })
  })

  const baseLinePoints: RadarComposedData['baseLinePoints'] = []

  if (isRange) {
    points.forEach((point) => {
      if (Array.isArray(point.value)) {
        const baseValue = toFiniteNumber(point.value[0])
        const radius: number = baseValue == null ? 0 : (radiusAxis.scale(baseValue) ?? 0)
        baseLinePoints.push({
          ...point,
          radius,
          ...polarToCartesian(cx, cy, radius, point.angle!),
        })
      }
      else {
        baseLinePoints.push(point)
      }
    })
  }

  return { points, isRange, baseLinePoints }
}

export function getSinglePolygonPath(points: ReadonlyArray<{ x: number, y: number }>): string {
  if (!points.length)
    return ''
  // Repeat first point at end (matching Recharts getParsedPoints behavior) to ensure
  // explicit close segment for correct SVG fill when used in range paths
  const pts = [...points, points[0]]
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join('')
  return `${path}Z`
}

export function getRangePath(
  points: ReadonlyArray<{ x: number, y: number }>,
  baseLinePoints: ReadonlyArray<{ x: number, y: number }>,
): string {
  const outerPath = getSinglePolygonPath(points)
  const inner = getSinglePolygonPath([...baseLinePoints].reverse())
  // Join outer (without closing Z) with inner path
  const outerWithoutZ = outerPath.endsWith('Z') ? outerPath.slice(0, -1) : outerPath
  return `${outerWithoutZ}L${inner.slice(1)}`
}
