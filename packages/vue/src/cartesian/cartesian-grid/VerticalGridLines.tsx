import { renderLineItem } from '@/cartesian/cartesian-grid/utils'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'

const VerticalGridLines = defineComponent({
  name: 'VerticalGridLines',
  inheritAttrs: false,
  props: {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    verticalPoints: Array,
    /** Per-line opacity while lines fade in or out with their ticks. */
    pointOpacity: Array as PropType<number[]>,
    xAxisId: [String, Number],
    yAxisId: [String, Number],
    offset: Object,
    xAxis: Object,
    yAxis: Object,
    vertical: [Boolean, Object],
  },
  setup(props, { attrs, slots }) {
    return () => {
      const { y, height, vertical = true, verticalPoints } = props

      if (!vertical || !verticalPoints || !verticalPoints.length) {
        return null
      }

      const { xAxisId, yAxisId, ...otherLineItemProps } = { ...props, ...attrs }

      const items = verticalPoints.map((entry, i) => {
        const lineItemProps = {
          ...otherLineItemProps,
          x1: entry,
          y1: y,
          x2: entry,
          y2: y! + height!,
          key: `line-${i}`,
          index: i,
          ...(props.pointOpacity?.[i] != null && props.pointOpacity[i] < 1 ? { opacity: props.pointOpacity[i] } : {}),
        }

        return renderLineItem(slots.vertical, vertical, lineItemProps)
      })
      return <g class="v-charts-cartesian-grid-vertical">{items}</g>
    }
  },
})

export default VerticalGridLines
