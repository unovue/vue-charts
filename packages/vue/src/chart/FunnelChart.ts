import { defineComponent } from 'vue'
import { forwardsSvgAttributes } from '@/utils/attributes'
import { chartRoot } from '@/chart/chartRoot'
import { funnelChartProps } from '@/chart/chartProps'

const root = chartRoot({
  chartName: 'FunnelChart',
  defaultTooltipEventType: 'item',
  validateTooltipEventTypes: ['item'],
})

export const FunnelChart = forwardsSvgAttributes(defineComponent({
  ...root,
  props: funnelChartProps,
  setup: (props, context) => root.setup(props, context),
}))
