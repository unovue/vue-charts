import { defineComponent } from 'vue'
import { chartRoot } from '@/chart/generateCategoricalChart'
import { funnelChartProps } from '@/chart/chartProps'

export const FunnelChart = defineComponent({
  ...chartRoot({
    chartName: 'FunnelChart',
    defaultTooltipEventType: 'item',
    validateTooltipEventTypes: ['item'],
  }),
  props: funnelChartProps,
})
