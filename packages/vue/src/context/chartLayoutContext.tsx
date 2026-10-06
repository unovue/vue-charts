import { useAppSelector } from '@/state/hooks'
import { selectChartLayout } from '@/state/selectors/common'
import { selectChartHeight, selectChartWidth } from '@/state/selectors/containerSelectors'
import { selectChartOffset, selectChartViewBox } from '@/state/selectors/selectChartOffset'
import { selectChartOffsetInternal } from '@/state/selectors/selectChartOffsetInternal'
import type { Margin } from '@/types'

export function useOffset() {
  return useAppSelector(selectChartOffset)
}

export const useChartLayout = () => useAppSelector(selectChartLayout)

export function useViewBox() {
  return useAppSelector(selectChartViewBox)
}

export function useChartWidth() {
  return useAppSelector(selectChartWidth)
}

export function useChartHeight() {
  return useAppSelector(selectChartHeight)
}

export function useOffsetInternal() {
  return useAppSelector(selectChartOffsetInternal)
}

const manyComponentsThrowErrorsIfMarginIsUndefined: Margin = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
}
export function useMargin() {
  return useAppSelector(state => state.layout.margin ?? manyComponentsThrowErrorsIfMarginIsUndefined)
}
