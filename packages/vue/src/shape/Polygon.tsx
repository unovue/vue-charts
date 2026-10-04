import type { SVGAttributes } from 'vue'
import { isNumber } from '@/utils'
import { svgAttrs } from '@/utils/VueUtils'

export interface PolygonPoint {
  x: number
  y: number
}

export interface PolygonProps {
  points?: PolygonPoint[]
}

function getPolygonPath(points: PolygonPoint[]): string {
  return points.reduce((path, point, i) => {
    return `${path}${i === 0 ? 'M' : 'L'}${point.x},${point.y}`
  }, '') + 'Z'
}

export function Polygon(props: PolygonProps & SVGAttributes) {
  const { points = [], ...rest } = props

  if (!points || !points.length) {
    return null
  }

  const isValid = points.every(p => isNumber(p.x) && isNumber(p.y))
  if (!isValid) {
    return null
  }

  return (
    <path
      {...svgAttrs(rest)}
      class="v-charts-polygon"
      d={getPolygonPath(points)}
    />
  )
}
