import { useChartLayoutActions } from '@/state/chartContext'
import type { LayoutType, Margin } from '@/types'
import type { PropType } from 'vue'
import { defineComponent, watch } from 'vue'

export const ReportMainChartProps = defineComponent({
  name: 'ReportMainChartProps',
  props: {
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    layout: {
      type: String as PropType<LayoutType>,
      required: true,
    },
    margin: {
      type: Object as PropType<Margin>,
      required: true,
    },
  },
  setup(props) {
    const layout = useChartLayoutActions()

    watch([
      () => props.width,
      () => props.height,
      () => props.layout,
      () => props.margin.top,
      () => props.margin.right,
      () => props.margin.bottom,
      () => props.margin.left,
    ], () => {
      layout.setProps(props.layout, { width: props.width, height: props.height }, props.margin)
    }, {
      immediate: true,
    })

    return () => {
      return null
    }
  },
})
