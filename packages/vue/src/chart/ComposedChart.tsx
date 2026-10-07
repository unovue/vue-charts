import { defineComponent } from 'vue'
import { chartRoot } from '@/chart/generateCategoricalChart'
import { cartesianChartProps } from '@/chart/chartProps'
import type { TooltipEventType } from '@/types'

const allowedTooltipTypes: ReadonlyArray<TooltipEventType> = ['axis']

export const ComposedChart = defineComponent({
  ...chartRoot({
    chartName: 'ComposedChart',
    defaultTooltipEventType: 'axis',
    validateTooltipEventTypes: allowedTooltipTypes,
  }),
  props: cartesianChartProps,
})
