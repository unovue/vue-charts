import { defineComponent } from 'vue'
import { chartRoot, polarProps } from '@/chart/generateCategoricalChart'
import { radialChartProps } from '@/chart/chartProps'

export const RadialBarChart = defineComponent({
  ...chartRoot({
    chartName: 'RadialBarChart',
    defaultTooltipEventType: 'axis',
    validateTooltipEventTypes: ['axis', 'item'],
  }),
  props: { ...radialChartProps, ...polarProps({
    layout: 'radial',
    startAngle: 0,
    endAngle: 360,
  }) },
})
