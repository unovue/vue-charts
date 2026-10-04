import type { RechartsRootState } from '../chartState'
import type { AxisId } from '../chartCartesianAxis'

export const pickAxisId = (_state: RechartsRootState, _axisType: unknown, axisId: AxisId): AxisId => axisId
