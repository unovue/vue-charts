import { generateCategoricalChart } from '@/chart/generateCategoricalChart'
import { arrayTooltipSearcher } from '@/state/chartOptions'

export const RadialBarChart = generateCategoricalChart({
  chartName: 'RadialBarChart',
  defaultProps: {
    layout: 'radial',
    startAngle: 0,
    endAngle: 360,
  },
  defaultTooltipEventType: 'axis',
  validateTooltipEventTypes: ['axis', 'item'],
  tooltipPayloadSearcher: arrayTooltipSearcher,
})
