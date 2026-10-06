import { generateCartesianChart } from '@/chart/generateCategoricalChart'
import type { TooltipEventType } from '@/types'

const allowedTooltipTypes: ReadonlyArray<TooltipEventType> = ['axis', 'item']

export const ScatterChart = generateCartesianChart({
  chartName: 'ScatterChart',
  defaultTooltipEventType: 'item',
  validateTooltipEventTypes: allowedTooltipTypes,
})
