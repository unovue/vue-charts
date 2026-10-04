import { useAppSelector } from '@/state/hooks'
import { selectActiveTooltipIndex } from '@/state/selectors/tooltipSelectors'
import { useChartTooltip } from '@/state/chartContext'
import type { DataKey } from '@/types'

export function usePointEvents<Entry extends { x: number, y: number }>(
  emit: (event: 'click' | 'mouseenter' | 'mouseleave', entry: Entry, index: number, nativeEvent: MouseEvent) => void,
  dataKey: () => DataKey<unknown>,
) {
  const tooltip = useChartTooltip()
  return (entry: Entry, index: number) => {
    const payload = () => ({ activeIndex: String(index), activeDataKey: dataKey(), activeCoordinate: { x: entry.x, y: entry.y } })
    return {
      onClick: (event: MouseEvent) => {
        tooltip.setActiveClickItemIndex(payload())
        emit('click', entry, index, event)
      },
      onMouseenter: (event: MouseEvent) => {
        tooltip.setActiveMouseOverItemIndex(payload())
        emit('mouseenter', entry, index, event)
      },
      onMouseleave: (event: MouseEvent) => {
        tooltip.mouseLeaveItem()
        emit('mouseleave', entry, index, event)
      },
    }
  }
}

export function useSeriesPointEvents<Entry extends { x: number, y: number }>(
  emit: (event: 'click' | 'mouseenter' | 'mouseleave', entry: Entry, index: number, nativeEvent: MouseEvent) => void,
  dataKey: () => DataKey<unknown>,
  points: () => readonly Entry[],
) {
  const activeIndex = useAppSelector(selectActiveTooltipIndex)
  const listeners = usePointEvents(emit, dataKey)
  const dispatch = (name: 'onClick' | 'onMouseenter' | 'onMouseleave', event: MouseEvent) => {
    const index = activeIndex.value == null ? 0 : Number(activeIndex.value)
    const entry = points()[index]
    if (entry)
      listeners(entry, index)[name](event)
  }
  return {
    onClick: (event: MouseEvent) => dispatch('onClick', event),
    onMouseenter: (event: MouseEvent) => dispatch('onMouseenter', event),
    onMouseleave: (event: MouseEvent) => dispatch('onMouseleave', event),
  }
}
