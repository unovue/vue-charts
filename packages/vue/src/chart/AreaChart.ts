import { defineComponent } from 'vue'
import { forwardsSvgAttributes } from '@/utils/attributes'
import { chartRoot } from '@/chart/generateCategoricalChart'
import { cartesianChartProps } from '@/chart/chartProps'

const root = chartRoot({
  chartName: 'AreaChart',
})

export const AreaChart = forwardsSvgAttributes(defineComponent({
  ...root,
  props: cartesianChartProps,
  setup: (props, context) => root.setup(props, context),
}))
