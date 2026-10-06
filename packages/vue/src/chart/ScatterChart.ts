import { generateCartesianChart } from '@/chart/generateCategoricalChart'
import { arrayTooltipSearcher } from '@/model/options'
import type { TooltipEventType } from '@/types'

const allowedTooltipTypes: ReadonlyArray<TooltipEventType> = ['axis', 'item']

export const ScatterChart = generateCartesianChart({
  chartName: 'ScatterChart',
  defaultTooltipEventType: 'item',
  tooltipPayloadSearcher: arrayTooltipSearcher,
  validateTooltipEventTypes: allowedTooltipTypes,
})
