import type { LayoutType, Margin } from '@/types'
import type { UpdatableChartOptions } from '@/types/chartOptions'
import type { PolarChartOptions } from '@/types/polarOptions'

export const chartDefaults: UpdatableChartOptions & PolarChartOptions & {
  layout: LayoutType
  margin: Margin
} = {
  accessibilityLayer: true,
  barCategoryGap: '10%',
  barGap: 4,
  barSize: undefined,
  class: undefined,
  maxBarSize: undefined,
  reverseStackOrder: false,
  stackOffset: 'none',
  syncId: undefined,
  syncMethod: 'index',
  layout: 'horizontal',
  margin: { top: 5, right: 5, bottom: 5, left: 5 },
  cx: '50%',
  cy: '50%',
  startAngle: 90,
  endAngle: -270,
  innerRadius: 0,
  outerRadius: '80%',
}
