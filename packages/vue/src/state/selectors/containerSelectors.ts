import type { Margin } from '@/types'
import type { RechartsRootState } from '../chartState'

export const selectChartWidth = (state: RechartsRootState): number => state.layout.width

export const selectChartHeight = (state: RechartsRootState): number => state.layout.height

export const selectContainerScale: (state: RechartsRootState) => number = state => state.layout.scale

export const selectMargin = (state: RechartsRootState): Margin | undefined => state.layout.margin
