import { generatePolarChart } from '@/chart/generateCategoricalChart'

export const PieChart = generatePolarChart({
  chartName: 'PieChart',
  defaultProps: {
    layout: 'centric',
    startAngle: 0,
    endAngle: 360,
  },
  defaultTooltipEventType: 'item',
  validateTooltipEventTypes: ['item'],
})
