import { defineComponent } from 'vue'
import { forwardsSvgAttributes } from '@/utils/attributes'
import { chartRoot, polarProps } from '@/chart/chartRoot'
import { radialChartProps } from '@/chart/chartProps'

const root = chartRoot({
  chartName: 'RadialBarChart',
  defaultTooltipEventType: 'axis',
  validateTooltipEventTypes: ['axis', 'item'],
})

export const RadialBarChart = forwardsSvgAttributes(defineComponent({
  ...root,
  props: { ...radialChartProps, ...polarProps({
    layout: 'radial',
    startAngle: 0,
    endAngle: 360,
  }) },
  setup: (props, context) => root.setup(props, context),
}))
