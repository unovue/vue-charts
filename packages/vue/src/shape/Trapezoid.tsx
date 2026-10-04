import { defineComponent } from 'vue'
import { classProp } from '@/types'
import type { WithSVGProps } from '@/types'
import { svgAttrs } from '@/utils/VueUtils'

const TrapezoidVueProps = {
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  upperWidth: { type: Number, default: 0 },
  lowerWidth: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  class: classProp,
}

export type TrapezoidComponentProps = WithSVGProps<typeof TrapezoidVueProps>

function getTrapezoidPath(x: number, y: number, upperWidth: number, lowerWidth: number, height: number): string {
  const upperLeft = x
  const upperRight = x + upperWidth
  const lowerLeft = x + (upperWidth - lowerWidth) / 2
  const lowerRight = x + (upperWidth + lowerWidth) / 2
  const bottom = y + height

  return `M ${upperLeft},${y} L ${upperRight},${y} L ${lowerRight},${bottom} L ${lowerLeft},${bottom} Z`
}

export const Trapezoid = defineComponent<TrapezoidComponentProps>({
  name: 'Trapezoid',
  props: TrapezoidVueProps,
  inheritAttrs: false,
  setup(props, { attrs }) {
    return () => {
      const { x, y, upperWidth, lowerWidth, height } = props

      if (x !== +x! || y !== +y! || upperWidth !== +upperWidth! || lowerWidth !== +lowerWidth! || height !== +height! || height === 0) {
        return null
      }

      return (
        <path
          {...svgAttrs(attrs)}
          class={['v-charts-trapezoid', props.class]}
          d={getTrapezoidPath(x, y, upperWidth, lowerWidth, height)}
        />
      )
    }
  },
})
