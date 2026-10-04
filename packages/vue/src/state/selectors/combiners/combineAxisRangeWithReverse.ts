import type { BaseCartesianAxis } from '../../chartCartesianAxis'
import type { AxisRange } from '../axisSelectors'

export function combineAxisRangeWithReverse(axisSettings: BaseCartesianAxis | undefined, axisRange: AxisRange | undefined): AxisRange | undefined {
  if (!axisSettings || !axisRange) {
    return undefined
  }
  if (axisSettings?.reversed) {
    return [axisRange[1], axisRange[0]]
  }
  return axisRange
}
