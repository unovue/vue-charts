import { generatePolarChart } from '@/chart/generateCategoricalChart'

export const RadarChart = generatePolarChart({
  chartName: 'RadarChart',
  defaultProps: {
    layout: 'centric',
    startAngle: 90,
    endAngle: -270,
  },
  defaultTooltipEventType: 'axis',
  validateTooltipEventTypes: ['axis'],
})
