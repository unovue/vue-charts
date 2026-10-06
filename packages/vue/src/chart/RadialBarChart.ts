import { generateRadialChart } from '@/chart/generateCategoricalChart'

export const RadialBarChart = generateRadialChart({
  chartName: 'RadialBarChart',
  defaultProps: {
    layout: 'radial',
    startAngle: 0,
    endAngle: 360,
  },
  defaultTooltipEventType: 'axis',
  validateTooltipEventTypes: ['axis', 'item'],
})
