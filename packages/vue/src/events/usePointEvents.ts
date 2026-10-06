import { useChart } from '@/model/chart'
import { computed } from 'vue'
import { useTooltipEntry } from '@/model/tooltip'
import { parseTooltipIndex } from '@/core/tooltip'
import type { DataKey } from '@/types'
import type { EmitFn } from 'vue'

type PointEmitter<Entry> = EmitFn<{
  click: (entry: Entry, index: number, event: MouseEvent) => void
  mouseenter: (entry: Entry, index: number, event: MouseEvent) => void
  mouseleave: (entry: Entry, index: number, event: MouseEvent) => void
}>

export function usePointEvents<Entry extends { x: number, y: number }>(
  emit: PointEmitter<Entry>,
  dataKey: () => DataKey<unknown>,
) {
  const tooltip = useChart().tooltip
  const configuration = useTooltipEntry()
  return (entry: Entry, index: number) => {
    const payload = () => ({ configuration: configuration?.value, activeIndex: String(index), activeDataKey: dataKey(), activeCoordinate: { x: entry.x, y: entry.y } })
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
  emit: PointEmitter<Entry>,
  dataKey: () => DataKey<unknown>,
  points: () => readonly Entry[],
) {
  const chart = useChart()
  const activeIndex = computed(() => chart.tooltip.source.active.value ? chart.tooltip.target.value?.index ?? null : null)
  const listeners = usePointEvents(emit, dataKey)
  const dispatch = (name: 'onClick' | 'onMouseenter' | 'onMouseleave', event: MouseEvent) => {
    const index = parseTooltipIndex(activeIndex.value) ?? 0
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
