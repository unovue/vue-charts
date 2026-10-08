/**
 * @fileOverview Surface component for SVG rendering
 */
import type { PropType, SVGAttributes, StyleValue } from 'vue'
import { defineComponent, ref } from 'vue'
import { classProp } from '@/types'
import type { VueClassValue } from '@/types'
import { provideChartLayers } from '@/model/runtime'

interface ViewBox {
  x?: number
  y?: number
  width?: number
  height?: number
}

/**
 * The SVG root of every chart and of legend icons. With `layers`, it also renders the cursor,
 * graphical and label layers that chart parts teleport into, painted in that order.
 */
const Surface = defineComponent<Omit<SVGAttributes, 'viewBox'>
  & {
    width: number
    height: number
    viewBox?: ViewBox
    class?: VueClassValue
    style?: StyleValue
    title?: string
    desc?: string
    descriptionId?: string
    layers?: boolean
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
    /** Id of the `<desc>` element, for `aria-describedby`. */
    descriptionId: {
      type: String,
      default: undefined,
    },
    /** Adds the chart layers; fixed for the component's lifetime. */
    layers: {
      type: Boolean,
      default: false,
    },
  },
  inheritAttrs: false,
  setup(props, { slots, attrs }) {
    const cursor = ref<SVGGElement | null>(null)
    const graphical = ref<SVGGElement | null>(null)
    const label = ref<SVGGElement | null>(null)
    if (props.layers)
      provideChartLayers({ cursor, graphical, label })

    return () => {
      const { width, height, viewBox, class: className, style, title, desc } = props
      const svgView = viewBox || { width, height, x: 0, y: 0 }
      return (
        <svg
          {...attrs}
          {...(props.layers ? { 'data-slot': 'surface' } : {})}
          class={['v-charts-surface', className]}
          width={width}
          height={height}
          style={style}
          viewBox={`${svgView.x} ${svgView.y} ${svgView.width} ${svgView.height}`}
        >
          {title && <title>{title}</title>}
          {desc && <desc id={props.descriptionId}>{desc}</desc>}
          {slots.default?.()}
          {props.layers && [
            <g ref={cursor} class="v-charts-cursor-layer" />,
            <g ref={graphical} data-slot="plot" class="v-charts-graphical-layer" />,
            <g ref={label} class="v-charts-label-layer" />,
          ]}
        </svg>
      )
    }
  },
})

export default Surface
