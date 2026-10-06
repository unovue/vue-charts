import { generateCategoricalChart } from '@/chart/generateCategoricalChart'
import { arrayTooltipSearcher } from '@/model/options'

export const PieChart = generateCategoricalChart({
  chartName: 'PieChart',
  defaultProps: {
    layout: 'centric',
    startAngle: 0,
    endAngle: 360,
  },
  defaultTooltipEventType: 'item',
  validateTooltipEventTypes: ['item'],
  tooltipPayloadSearcher: arrayTooltipSearcher,
})
