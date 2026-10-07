import { defineComponent } from 'vue'
import { chartRoot, polarProps } from '@/chart/generateCategoricalChart'

export const PieChart = defineComponent({
  ...chartRoot({
    chartName: 'PieChart',
    defaultTooltipEventType: 'item',
    validateTooltipEventTypes: ['item'],
  }),
  props: polarProps({
    layout: 'centric',
    startAngle: 0,
    endAngle: 360,
  }),
})
