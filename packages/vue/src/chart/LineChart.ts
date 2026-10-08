import { defineComponent } from 'vue'
import { forwardsSvgAttributes } from '@/utils/attributes'
import { chartRoot } from '@/chart/chartRoot'
import { cartesianChartProps } from '@/chart/chartProps'
import type { TooltipEventType } from '@/types'

const allowedTooltipTypes: ReadonlyArray<TooltipEventType> = ['axis', 'item']

const root = chartRoot({
  chartName: 'LineChart',
  categoryScale: 'point',
  series: ['line'],
  defaultTooltipEventType: 'axis',
  validateTooltipEventTypes: allowedTooltipTypes,
})

export const LineChart = forwardsSvgAttributes(defineComponent({
  ...root,
  props: cartesianChartProps,
  setup: (props, context) => root.setup(props, context),
}))
