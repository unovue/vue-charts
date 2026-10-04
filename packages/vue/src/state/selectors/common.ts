import type { RechartsRootState } from '@/state/chartState'

export const selectChartLayout = (state: RechartsRootState) => state.layout.layoutType
