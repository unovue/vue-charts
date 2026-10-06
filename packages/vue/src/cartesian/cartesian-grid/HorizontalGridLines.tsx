import type { PropType, SlotsType } from 'vue'
import type { CartesianGridSlots } from './type'
import type { ChartOffset } from '@/types'
import { defineComponent } from 'vue'
import { renderLineItem } from '@/cartesian/cartesian-grid/utils'

const HorizontalGridLines = defineComponent({
  name: 'HorizontalGridLines',
  slots: Object as SlotsType<CartesianGridSlots>,
  inheritAttrs: false,
  props: {
    x: Number,
    width: Number,
    horizontal: [Boolean, Object],
    horizontalPoints: Array as PropType<number[]>,
    /** Per-line opacity while lines fade in or out with their ticks. */
    pointOpacity: Array as PropType<number[]>,
    xAxisId: {
      type: [String, Number],
      default: 0,
    },
    yAxisId: {
      type: [String, Number],
      default: 0,
    },
    offset: Object as PropType<ChartOffset>,
    xAxis: Object,
    yAxis: Object,
  },
  setup(props, { attrs, slots }) {
    return () => {
      const { x, width, horizontal = true, horizontalPoints } = props

      if (!horizontal || !horizontalPoints || !horizontalPoints.length) {
        return null
      }

      const { xAxisId, yAxisId, ...otherLineItemProps } = {
        ...props,
        ...attrs,
      }

      const items = horizontalPoints.map((entry, i) => {
        const lineItemProps = {
          ...otherLineItemProps,
          ...attrs,
          x1: x,
          y1: entry,
          x2: x! + width!,
          y2: entry,
          key: `line-${i}`,
          index: i,
          ...(props.pointOpacity?.[i] != null && props.pointOpacity[i] < 1 ? { opacity: props.pointOpacity[i] } : {}),
        }
        return renderLineItem(slots.horizontal, horizontal, lineItemProps)
      })
      return <g class="v-charts-cartesian-grid-horizontal">{items}</g>
    }
  },
})

export default HorizontalGridLines
