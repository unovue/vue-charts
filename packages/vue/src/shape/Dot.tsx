/**
 * @fileOverview Dot
 */
import { defineComponent } from 'vue'
import type { WithSVGProps } from '@/types'
import { svgAttrs } from '@/utils/VueUtils'

const DotVueProps = {
  cx: { type: [Number, String] },
  cy: { type: [Number, String] },
  r: { type: [Number, String] },
  clipDot: { type: Boolean },
}

type DotInput = WithSVGProps<typeof DotVueProps>

export const Dot = defineComponent<DotInput>({
  name: 'Dot',
  props: DotVueProps,
  inheritAttrs: false,
  setup(props, { attrs }) {
    return () => {
      const { cx, cy, r } = props

      if (cx === +cx! && cy === +cy! && r === +r!) {
        return (
          <circle
            {...svgAttrs(attrs)}
            class={['v-charts-dot', props.class]}
            cx={cx}
            cy={cy}
            r={r}
          />
        )
      }

      return null
    }
  },
})
