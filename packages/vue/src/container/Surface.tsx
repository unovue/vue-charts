/**
 * @fileOverview Surface component for SVG rendering
 */
import type { PropType, SVGAttributes, StyleValue } from 'vue'
import { defineComponent } from 'vue'
import { classProp } from '@/types'
import type { VueClassValue } from '@/types'

interface ViewBox {
  x?: number
  y?: number
  width?: number
  height?: number
}

const Surface = defineComponent<Omit<SVGAttributes, 'viewBox'>
  & {
    width: number
    height: number
    viewBox?: ViewBox
    class?: VueClassValue
    style?: StyleValue
    title?: string
    desc?: string
  }>({
  name: 'Surface',
  props: {
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    viewBox: {
      type: Object as PropType<ViewBox>,
      default: undefined,
    },
    class: classProp,
    style: {
      type: [String, Object, Array] as PropType<StyleValue>,
      default: undefined,
    },
    title: {
      type: String,
      default: undefined,
    },
    desc: {
      type: String,
      default: undefined,
    },
  },
  setup(props, { slots, attrs }) {
    return () => {
      const { width, height, viewBox, class: className, style, title, desc, ...rest } = props
      const svgView = viewBox || { width, height, x: 0, y: 0 }
      return (
        <svg
          class={['vcharts-surface', className]}
          width={width}
          height={height}
          style={style}
          viewBox={`${svgView.x} ${svgView.y} ${svgView.width} ${svgView.height}`}
          {...rest}
          {...attrs}
        >
          {title && <title>{title}</title>}
          {desc && <desc>{desc}</desc>}
          {slots.default?.()}
        </svg>
      )
    }
  },
})

export default Surface
