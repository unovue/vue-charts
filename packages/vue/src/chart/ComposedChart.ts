import { defineComponent } from 'vue'
import { forwardsSvgAttributes } from '@/utils/attributes'
import { chartRoot } from '@/chart/chartRoot'
import { cartesianChartProps } from '@/chart/chartProps'
import type { TooltipEventType } from '@/types'

const allowedTooltipTypes: ReadonlyArray<TooltipEventType> = ['axis']

const root = chartRoot({
  chartName: 'ComposedChart',
  defaultTooltipEventType: 'axis',
  validateTooltipEventTypes: allowedTooltipTypes,
})

export const ComposedChart = forwardsSvgAttributes(defineComponent({
  ...root,
  props: cartesianChartProps,
  setup: (props, context) => root.setup(props, context),
}))
