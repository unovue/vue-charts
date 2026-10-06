import { useChartPresentation } from '@/model/presentation'

export function useOffset() {
  return useChartPresentation().offset
}

export function useChartLayout() {
  return useChartPresentation().layout
}

export function useViewBox() {
  return useChartPresentation().viewBox
}

export function useChartWidth() {
  return useChartPresentation().width
}

export function useChartHeight() {
  return useChartPresentation().height
}

export function useMargin() {
  return useChartPresentation().margin
}
