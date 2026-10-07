import type { PolarViewBoxRequired } from '@/types/viewBox'
import type { ChartOffset, Coordinate } from '@/types'

export const RADIAN = Math.PI / 180

const radianToDegree = (angleInRadian: number) => (angleInRadian * 180) / Math.PI

function distanceBetweenPoints(point: Coordinate, anotherPoint: Coordinate) {
  const { x: x1, y: y1 } = point
  const { x: x2, y: y2 } = anotherPoint

  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

export function formatAngleOfSector({ startAngle, endAngle }: PolarViewBoxRequired) {
  const startCnt = Math.floor(startAngle / 360)
  const endCnt = Math.floor(endAngle / 360)
  const min = Math.min(startCnt, endCnt)

  return {
    startAngle: startAngle - min * 360,
    endAngle: endAngle - min * 360,
  }
}

export function getAngleOfPoint({ x, y }: Coordinate, { cx, cy }: PolarViewBoxRequired) {
  const radius = distanceBetweenPoints({ x, y }, { x: cx, y: cy })

  if (radius <= 0) {
    return { radius, angle: 0 }
  }

  const cos = (x - cx) / radius
  let angleInRadian = Math.acos(cos)

  if (y > cy) {
    angleInRadian = 2 * Math.PI - angleInRadian
  }

  return { radius, angle: radianToDegree(angleInRadian), angleInRadian }
}

export function reverseFormatAngleOfSector(angle: number, { startAngle, endAngle }: PolarViewBoxRequired) {
  const startCnt = Math.floor(startAngle / 360)
  const endCnt = Math.floor(endAngle / 360)
  const min = Math.min(startCnt, endCnt)

  return angle + min * 360
}

/**
 * Node and browsers may return cos/sin values that differ in the last bit. Rounding to 1e-6 px
 * makes the server and the browser print the same SVG attributes, so hydration matches.
 */
const roundCoordinate = (value: number) => Math.round(value * 1e6) / 1e6

export function polarToCartesian(cx: number, cy: number, radius: number, angle: number): Coordinate {
  return {
    x: roundCoordinate(cx + Math.cos(-RADIAN * angle) * radius),
    y: roundCoordinate(cy + Math.sin(-RADIAN * angle) * radius),
  }
}

export function getMaxRadius(width: number, height: number, offset: Partial<ChartOffset> = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
}) {
  return Math.min(
    Math.abs(width - (offset.left || 0) - (offset.right || 0)),
    Math.abs(height - (offset.top || 0) - (offset.bottom || 0)),
  ) / 2
}
