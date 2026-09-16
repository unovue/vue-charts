import type { CartesianAxisProps } from '@/cartesian/cartesian-axis/CartesianAxis'
import { type SVGAttributes, useAttrs } from 'vue'
import { get } from 'es-toolkit/compat'

/**
 *  render axis line
 */
export function useAxisLine(props: CartesianAxisProps) {
  const attrs = useAttrs() as SVGAttributes
  const renderAxisLine = () => {
    const { x, y, width, height, orientation, mirror, axisLine } = props
    let p: SVGAttributes = {
      ...props as any,
      ...attrs,
      fill: 'none',
    }
    if (orientation === 'top' || orientation === 'bottom') {
      const needHeight = +((orientation === 'top' && !mirror) || (orientation === 'bottom' && mirror)!)
      p = {
        ...p,
        x1: x!,
        y1: y! + needHeight * height!,
        x2: x! + width!,
        y2: y! + needHeight * height!,
      }
    }
    else {
      const needWidth = +((orientation === 'left' && !mirror) || (orientation === 'right' && mirror)!)
      p = {
        ...p,
        x1: x! + needWidth * width!,
        y1: y!,
        x2: x! + needWidth * width!,
        y2: y! + height!,
      }
    }
    return <line {...p} class={['v-charts-cartesian-axis-line', get(axisLine, 'class')]} />
  }

  return {
    renderAxisLine,
  }
}
