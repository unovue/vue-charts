import type { SvgTemplateAttributes } from '@/utils/attributes'
import { isNumber } from '@/utils'
import { svgAttrs } from '@/utils/VueUtils'

export interface CrossProps {
  x?: number
  y?: number
  width?: number
  height?: number
  top?: number
  left?: number
}

function getCrossPath(x: number, y: number, width: number, height: number, top: number, left: number): string {
  return `M${x},${top}v${height}M${left},${y}h${width}`
}

export function Cross(props: CrossProps & Omit<SvgTemplateAttributes, keyof CrossProps>) {
  const { x = 0, y = 0, top = 0, left = 0, width = 0, height = 0, ...rest } = props

  if (!isNumber(x) || !isNumber(y) || !isNumber(width) || !isNumber(height) || !isNumber(top) || !isNumber(left)) {
    return null
  }

  return (
    <path
      {...svgAttrs(rest)}
      class="v-charts-cross"
      d={getCrossPath(x, y, width, height, top, left)}
    />
  )
}
