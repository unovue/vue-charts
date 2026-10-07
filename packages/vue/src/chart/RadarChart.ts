import { defineComponent } from 'vue'
import { forwardsSvgAttributes } from '@/utils/attributes'
import { chartRoot, polarProps } from '@/chart/generateCategoricalChart'

const root = chartRoot({
  chartName: 'RadarChart',
  defaultTooltipEventType: 'axis',
  validateTooltipEventTypes: ['axis'],
})

export const RadarChart = forwardsSvgAttributes(defineComponent({
  ...root,
  props: polarProps({
    layout: 'centric',
    startAngle: 90,
    endAngle: -270,
  }),
  setup: (props, context) => root.setup(props, context),
}))
