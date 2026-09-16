import { useAppSelector } from '@/state/hooks'
import {
  selectActiveLabel,
  selectActiveTooltipCoordinate,
  selectActiveTooltipDataKey,
  selectActiveTooltipIndex,
  selectIsTooltipActive,
} from '@/state/selectors/tooltipSelectors'
import type { CategoricalChartFunc, MouseHandlerDataParam } from '@/types'

export function useChartCallbacks() {
  const callbackState = useAppSelector((state): MouseHandlerDataParam => ({
    activeCoordinate: selectActiveTooltipCoordinate(state),
    activeDataKey: selectActiveTooltipDataKey(state),
    activeIndex: selectActiveTooltipIndex(state),
    activeLabel: selectActiveLabel(state),
    activeTooltipIndex: selectActiveTooltipIndex(state),
    isTooltipActive: selectIsTooltipActive(state),
  }))

  return (handler: CategoricalChartFunc | undefined, event: Event) => {
    if (handler) {
      handler({ ...callbackState.value }, event)
    }
  }
}
