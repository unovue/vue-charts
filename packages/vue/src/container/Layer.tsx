import type { SVGAttributes } from 'vue'
import { defineComponent } from 'vue'
import { svgAttrs } from '@/utils/VueUtils'

export const Layer = defineComponent<SVGAttributes>({
  name: 'VChartsLayer',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => {
      return (
        <g
          {...svgAttrs(attrs)}
          class="v-charts-layer"
        >
          {slots.default?.()}
        </g>
      )
    }
  },
})
