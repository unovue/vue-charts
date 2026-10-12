import type { PropType } from 'vue'
import { defineComponent } from 'vue'

const VerticalStripes = defineComponent({
  name: 'VerticalStripes',
  inheritAttrs: false,
  props: {
    verticalFill: Array as PropType<string[]>,
    fillOpacity: Number,
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    verticalPoints: Array as PropType<number[]>,
    vertical: [Boolean, Object],
  },
  setup(props) {
    return () => {
      const { verticalFill, fillOpacity, x, y, width, height, verticalPoints, vertical = true } = props
      if (!vertical || !verticalFill || !verticalFill.length) {
        return null
      }

      const roundedSortedVerticalPoints = verticalPoints?.map(e => Math.round(e + x! - x!)).sort((a, b) => a - b)
      if (x !== roundedSortedVerticalPoints?.[0]) {
        roundedSortedVerticalPoints?.unshift(0)
      }

      const items = roundedSortedVerticalPoints?.map((entry, i) => {
        const lastStripe = !roundedSortedVerticalPoints[i + 1]
        const lineWidth = lastStripe ? x! + width! - entry : roundedSortedVerticalPoints[i + 1] - entry
        if (lineWidth <= 0) {
          return null
        }
        const colorIndex = i % verticalFill.length
        return (
          <rect
            key={`react-${i}`}
            x={entry}
            y={y}
            width={lineWidth}
            height={height}
            stroke="none"
            fill={verticalFill[colorIndex] as string}
            fill-opacity={fillOpacity}
            class="v-charts-cartesian-grid-bg"
          />
        )
      })

      return <g class="v-charts-cartesian-gridstripes-vertical">{items}</g>
    }
  },
})

export default VerticalStripes
