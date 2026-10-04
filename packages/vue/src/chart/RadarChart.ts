import { generateCategoricalChart } from '@/chart/generateCategoricalChart'
import { arrayTooltipSearcher } from '@/state/chartOptions'

export const RadarChart = generateCategoricalChart({
  chartName: 'RadarChart',
  defaultProps: {
    layout: 'centric',
    startAngle: 90,
    endAngle: -270,
  },
  defaultTooltipEventType: 'axis',
  validateTooltipEventTypes: ['axis'],
  tooltipPayloadSearcher: arrayTooltipSearcher,
})
