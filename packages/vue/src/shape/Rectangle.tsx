/**
 * @fileOverview Rectangle
 */
import type { PropType } from 'vue'
import { defineComponent } from 'vue'
import type { WithSVGProps } from '@/types'
import type { RectRadius } from '@/types/bar'
import { svgAttrs } from '@/utils/VueUtils'

const RectangleVueProps = {
  x: { type: Number as PropType<number | null>, default: 0 },
  y: { type: Number as PropType<number | null>, default: 0 },
  width: { type: Number as PropType<number>, default: 0 },
  height: { type: Number as PropType<number>, default: 0 },
  radius: { type: [Number, Array] as PropType<number | RectRadius>, default: undefined },
}

type RectangleInput = WithSVGProps<typeof RectangleVueProps>

function getRectanglePath(x: number, y: number, width: number, height: number, radius: number | RectRadius | undefined): string {
  const maxRadius = Math.min(Math.abs(width) / 2, Math.abs(height) / 2)
  const ySign = height >= 0 ? 1 : -1
  const xSign = width >= 0 ? 1 : -1
  const clockWise = (height >= 0 && width >= 0) || (height < 0 && width < 0) ? 1 : 0

  if (maxRadius > 0 && Array.isArray(radius)) {
    const newRadius: [number, number, number, number] = [0, 0, 0, 0]
    for (let i = 0; i < 4; i++) {
      const r = radius[i] ?? 0
      newRadius[i] = r > maxRadius ? maxRadius : r
    }

    let path = `M${x},${y + ySign * newRadius[0]}`
    if (newRadius[0] > 0) {
      path += `A ${newRadius[0]},${newRadius[0]},0,0,${clockWise},${x + xSign * newRadius[0]},${y}`
    }
    path += `L ${x + width - xSign * newRadius[1]},${y}`
    if (newRadius[1] > 0) {
      path += `A ${newRadius[1]},${newRadius[1]},0,0,${clockWise},${x + width},${y + ySign * newRadius[1]}`
    }
    path += `L ${x + width},${y + height - ySign * newRadius[2]}`
    if (newRadius[2] > 0) {
      path += `A ${newRadius[2]},${newRadius[2]},0,0,${clockWise},${x + width - xSign * newRadius[2]},${y + height}`
    }
    path += `L ${x + xSign * newRadius[3]},${y + height}`
    if (newRadius[3] > 0) {
      path += `A ${newRadius[3]},${newRadius[3]},0,0,${clockWise},${x},${y + height - ySign * newRadius[3]}`
    }
    path += 'Z'
    return path
  }

  if (maxRadius > 0 && typeof radius === 'number' && radius > 0) {
    const r = Math.min(maxRadius, radius)
    return `M ${x},${y + ySign * r}`
      + `A ${r},${r},0,0,${clockWise},${x + xSign * r},${y}`
      + `L ${x + width - xSign * r},${y}`
      + `A ${r},${r},0,0,${clockWise},${x + width},${y + ySign * r}`
      + `L ${x + width},${y + height - ySign * r}`
      + `A ${r},${r},0,0,${clockWise},${x + width - xSign * r},${y + height}`
      + `L ${x + xSign * r},${y + height}`
      + `A ${r},${r},0,0,${clockWise},${x},${y + height - ySign * r} Z`
  }

  return `M ${x},${y} h ${width} v ${height} h ${-width} Z`
}

/** The rectangle as a plain element; `attrs` must already be SVG attributes (see svgAttrs). */
export function rectanglePath(attrs: Record<string, unknown>, x: number, y: number, width: number, height: number, radius?: number | RectRadius) {
  if (x !== +x || y !== +y || width !== +width || height !== +height || width === 0 || height === 0)
    return null
  return <path {...attrs} x={x} y={y} width={width} height={height} d={getRectanglePath(x, y, width, height, radius)} />
}

export const Rectangle = defineComponent<RectangleInput>({
  name: 'Rectangle',
  props: RectangleVueProps,
  inheritAttrs: false,
  setup(props, { attrs }) {
    return () => {
      const { x, y, width, height } = props
      if (x == null || y == null || width == null || height == null)
        return null
      return rectanglePath(svgAttrs(attrs), x, y, width, height, props.radius)
    }
  },
})
