import { useChartPresentation } from '@/model/presentation'

export function useAccessibilityLayer() {
  return useChartPresentation().accessibility
}
