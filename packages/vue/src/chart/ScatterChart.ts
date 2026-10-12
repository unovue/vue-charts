import { defineComponent } from 'vue'
import { forwardsSvgAttributes } from '@/utils/attributes'
import { chartRoot } from '@/chart/chartRoot'
import { cartesianChartProps } from '@/chart/chartProps'
import type { TooltipEventType } from '@/types'

const allowedTooltipTypes: ReadonlyArray<TooltipEventType> = ['axis', 'item']

const root = chartRoot({
  chartName: 'ScatterChart',
  cursor: 'cross',
  defaultTooltipEventType: 'item',
  validateTooltipEventTypes: allowedTooltipTypes,
})

export const ScatterChart = forwardsSvgAttributes(defineComponent({
  ...root,
  props: cartesianChartProps,
  setup: (props, context) => root.setup(props, context),
}))
