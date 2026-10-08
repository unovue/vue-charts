import { useTooltipController } from '@/model/tooltip'
import { DATA_ITEM_INDEX_ATTRIBUTE_NAME } from '@/utils/const'

export function useItemInteractions() {
  const tooltip = useTooltipController()
  function keyDown(event: KeyboardEvent) {
    const { key } = event
    const targets = tooltip.targets.value
    if (key === 'Escape') {
      tooltip.clear('keyboard')
      return
    }
    const position = tooltip.source.index.value ?? -1
    if (key === 'Enter') {
      targets[position]?.onClick?.(event)
      return
    }
    let next: number
    if (key === 'Home')
      next = 0
    else if (key === 'End')
      next = targets.length - 1
    else if (key === 'ArrowRight' || key === 'ArrowDown')
      next = Math.min(position + 1, targets.length - 1)
    else if (key === 'ArrowLeft' || key === 'ArrowUp')
      next = Math.max(position - 1, 0)
    else
      return
    const target = targets[next]
    if (!target)
      return
    tooltip.activate('keyboard', {
      active: true,
      index: target.index,
      coordinate: target.coordinate,
      configuration: target.entry?.value,
    })
  }

  function touchMove(event: TouchEvent) {
    const touch = event.touches[0]
    if (!touch)
      return
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    if (!element)
      return
    const attribute = element.getAttribute(DATA_ITEM_INDEX_ATTRIBUTE_NAME)
    const index = attribute === null ? null : Number(attribute)
    // The element carries only its item index; the first series with a target there answers.
    const target = index === null ? undefined : tooltip.targets.value.find(item => item.index === index)
    tooltip.activate('hover', {
      type: 'item',
      index,
      coordinate: target?.coordinate,
      configuration: target?.entry?.value,
    })
  }

  function ignorePointer() {}
  return { click: ignorePointer, move: ignorePointer, focus: ignorePointer, keyDown, touchMove }
}
