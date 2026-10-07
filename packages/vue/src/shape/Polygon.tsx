import type { SvgTemplateAttributes } from '@/utils/attributes'
import { isNumber } from '@/utils'
import { svgAttrs } from '@/utils/VueUtils'
import { polygonPath } from '@/core/polygon'

export interface PolygonPoint {
  x: number
  y: number
}

export interface PolygonProps {
  points?: PolygonPoint[]
}

export function Polygon(props: PolygonProps & Omit<SvgTemplateAttributes, keyof PolygonProps>) {
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
      d={polygonPath(points)}
    />
  )
}
