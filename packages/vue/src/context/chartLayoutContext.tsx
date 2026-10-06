import { useChartGeometry } from '@/state/chartContext'
import { useAppSelector } from '@/state/hooks'
import { selectChartLayout } from '@/state/selectors/common'

export function useOffset() {
  return useChartGeometry().offset
}

export const useChartLayout = () => useAppSelector(selectChartLayout)

export function useViewBox() {
  return useChartGeometry().viewBox
}

export function useChartWidth() {
  return useChartGeometry().width
}

export function useChartHeight() {
  return useChartGeometry().height
}

export const useOffsetInternal = useOffset

export function useMargin() {
  return useChartGeometry().margin
}
