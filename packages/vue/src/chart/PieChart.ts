import { defineComponent } from 'vue'
import { forwardsSvgAttributes } from '@/utils/attributes'
import { chartRoot, polarProps } from '@/chart/generateCategoricalChart'

const root = chartRoot({
  chartName: 'PieChart',
  defaultTooltipEventType: 'item',
  validateTooltipEventTypes: ['item'],
})

export const PieChart = forwardsSvgAttributes(defineComponent({
  ...root,
  props: polarProps({
    layout: 'centric',
    startAngle: 0,
    endAngle: 360,
  }),
  setup: (props, context) => root.setup(props, context),
}))
