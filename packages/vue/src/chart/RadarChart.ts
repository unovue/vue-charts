import { defineComponent } from 'vue'
import { chartRoot, polarProps } from '@/chart/generateCategoricalChart'

export const RadarChart = defineComponent({
  ...chartRoot({
    chartName: 'RadarChart',
    defaultTooltipEventType: 'axis',
    validateTooltipEventTypes: ['axis'],
  }),
  props: polarProps({
    layout: 'centric',
    startAngle: 90,
    endAngle: -270,
  }),
})
