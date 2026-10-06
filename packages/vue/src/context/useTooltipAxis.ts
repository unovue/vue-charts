import { useAppSelector } from '@/state/hooks'
import { selectTooltipAxis } from '@/state/chartContext'
import { useChartPresentation } from '@/model/presentation'

export const useTooltipAxis = () => useAppSelector(selectTooltipAxis)

export function useTooltipAxisBandSize() {
  return useChartPresentation().bandSize
}
