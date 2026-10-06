import { generateCartesianChart } from '@/chart/generateCategoricalChart'
import { arrayTooltipSearcher } from '@/model/options'
import type { TooltipEventType } from '@/types'

const allowedTooltipTypes: ReadonlyArray<TooltipEventType> = ['axis']

export const ComposedChart = generateCartesianChart({
  chartName: 'ComposedChart',
  defaultTooltipEventType: 'axis',
  tooltipPayloadSearcher: arrayTooltipSearcher,
  validateTooltipEventTypes: allowedTooltipTypes,
})
