import { defineComponent } from 'vue'
import { chartRoot } from '@/chart/generateCategoricalChart'
import { cartesianChartProps } from '@/chart/chartProps'
import type { TooltipEventType } from '@/types'

const allowedTooltipTypes: ReadonlyArray<TooltipEventType> = ['axis', 'item']

export const ScatterChart = defineComponent({
  ...chartRoot({
    chartName: 'ScatterChart',
    defaultTooltipEventType: 'item',
    validateTooltipEventTypes: allowedTooltipTypes,
  }),
  props: cartesianChartProps,
})
