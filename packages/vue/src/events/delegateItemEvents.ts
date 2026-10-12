type ItemEvents<Item> = {
  click: (item: Item, index: number, event: MouseEvent) => void
  mouseenter: (item: Item, index: number, event: MouseEvent) => void
  mouseleave: (item: Item, index: number, event: MouseEvent) => void
}

export function itemEventIndex(event: MouseEvent, boundary = false): number | undefined {
  const root = event.currentTarget
  const target = event.target
  if (!(root instanceof Element) || !(target instanceof Element))
    return undefined
  const item = target.closest('[data-v-charts-item-index]')
  if (!item || !root.contains(item) || (boundary && target !== item))
    return undefined
  const index = Number(item.getAttribute('data-v-charts-item-index'))
  return Number.isInteger(index) && index >= 0 ? index : undefined
}

export function delegateItemEvents<Item>(
  itemAt: (index: number) => Item | undefined,
  events: ItemEvents<Item>,
) {
  function dispatch(name: keyof ItemEvents<Item>, event: MouseEvent) {
    // Native enter/leave fire for descendants too. Only the marked item's boundary emits.
    const index = itemEventIndex(event, name !== 'click')
    const item = index == null ? undefined : itemAt(index)
    if (item !== undefined && index !== undefined)
      events[name](item, index, event)
  }
  return {
    onClick: (event: MouseEvent) => dispatch('click', event),
    onMouseenterCapture: (event: MouseEvent) => dispatch('mouseenter', event),
    onMouseleaveCapture: (event: MouseEvent) => dispatch('mouseleave', event),
  }
}
