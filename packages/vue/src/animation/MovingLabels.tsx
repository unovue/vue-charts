import { type PropType, defineComponent } from 'vue'
import type { ChartTransition } from './motion'
import { labelOpacity } from './ridingLabels'
import { useKeyedTransition } from './useKeyedTransition'

export interface MovingLabel {
  key: PropertyKey
  text: string
  x: number
  y: number
}

/** A child shares the chart's resize and hydration context with its cells. */
export const MovingLabels = defineComponent({
  name: 'MovingLabels',
  inheritAttrs: false,
  props: {
    labels: { type: Array as PropType<readonly MovingLabel[]>, required: true },
    isAnimationActive: { type: Boolean, default: true },
    transition: { type: Object as PropType<ChartTransition>, default: undefined },
    textAnchor: { type: String as PropType<'start' | 'middle' | 'end'>, default: undefined },
    centered: { type: Boolean, default: false },
  },
  setup(props, { attrs }) {
    const { items } = useKeyedTransition(() => props.labels, {
      key: label => label.key,
      interpolate: (from, to, t) => ({
        ...to,
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
      }),
      enterFrom: to => to,
      exitTo: from => from,
      isActive: () => props.isAnimationActive,
      transition: () => props.transition,
      followsSeries: true,
    })
    return () => (
      <g {...attrs} aria-hidden="true">
        {items.value.map(item => (
          <text
            key={String(item.key)}
            x={item.value.x}
            y={item.value.y}
            opacity={item.phase === 'exit' ? labelOpacity(item) : undefined}
            text-anchor={props.textAnchor}
            dominant-baseline={props.centered ? 'central' : undefined}
            style={{ fill: 'var(--v-charts-text, #666)', fontSize: '10px' }}
          >
            {item.value.text}
          </text>
        ))}
      </g>
    )
  },
})
