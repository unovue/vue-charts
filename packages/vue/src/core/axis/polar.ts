import type { LayoutType, Size } from '@/types/common'
import type { PolarChartOptions } from '@/types/polarOptions'
import { getPercentValue } from '@/utils/data'

export function polarViewBox(
  layout: LayoutType,
  options: PolarChartOptions | null,
  innerRadius: number | undefined,
  outerRadius: number | undefined,
  size: Size,
) {
  if ((layout !== 'centric' && layout !== 'radial') || !options
    || innerRadius == null || outerRadius == null) {
    return undefined
  }
  return {
    cx: getPercentValue(options.cx, size.width, size.width / 2),
    cy: getPercentValue(options.cy, size.height, size.height / 2),
    innerRadius,
    outerRadius,
    startAngle: options.startAngle,
    endAngle: options.endAngle,
    clockWise: false,
  }
}
