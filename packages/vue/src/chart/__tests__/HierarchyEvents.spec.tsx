import { fireEvent, render } from '@testing-library/vue'
import { nextTick } from 'vue'
import { expect, it, vi } from 'vitest'
import { JourneySankey, SunburstChart } from '@/index'

const journeys = [{ path: ['A', 'B'], count: 10 }, { path: ['C', 'D'], count: 5 }]
const tree = {
  name: 'root',
  children: [
    { name: 'GroupA', children: [{ name: 'A', value: 10 }] },
    { name: 'GroupB', children: [{ name: 'B', value: 5 }] },
  ],
}

// Catches indexes from animation copies or the tooltip's combined node/link list.
it.each(['sunburst', 'journey-node', 'journey-link'] as const)('emits %s pointer events with layout indexes and the original event', async (chart) => {
  const click = vi.fn()
  const enter = vi.fn()
  const leave = vi.fn()
  const listeners = chart === 'journey-link'
    ? { 'onLink-click': click, 'onLink-mouseenter': enter, 'onLink-mouseleave': leave }
    : { 'onNode-click': click, 'onNode-mouseenter': enter, 'onNode-mouseleave': leave }
  const { container } = render(() => chart === 'sunburst'
    ? <SunburstChart width={500} height={300} data={tree} isAnimationActive={false} {...listeners} />
    : <JourneySankey width={500} height={300} data={journeys} isAnimationActive={false} {...listeners} />)
  const targets = chart === 'sunburst'
    ? container.querySelectorAll('.v-charts-sunburst-sector')
    : chart === 'journey-link'
      ? container.querySelectorAll('.v-charts-journey-link-hit')
      : container.querySelectorAll('.v-charts-journey-node > g:first-child')
  const target = targets[1]
  const events = ['mouseenter', 'click', 'mouseleave'].map(type => new MouseEvent(type, { bubbles: true }))
  for (const event of events)
    await fireEvent(target, event)
  for (const [handler, event] of [[enter, events[0]], [click, events[1]], [leave, events[2]]] as const) {
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0]).toEqual([expect.any(Object), 1, event])
  }
  const item = click.mock.calls[0][0]
  expect(chart === 'journey-link' ? item.target : item.name).toBe(chart === 'sunburst' ? 'GroupB' : chart === 'journey-link' ? '1\u0001D' : 'C')
})

// Catches keyboard pinning that fails to emit, or reports a fabricated mouse event.
it('emits journey keyboard activation at the focused node layout index', async () => {
  const click = vi.fn()
  const enter = vi.fn()
  const { container } = render(() => (
    <JourneySankey width={500} height={300} data={journeys} isAnimationActive={false} {...{ 'onNode-click': click, 'onNode-mouseenter': enter }} />
  ))
  const target = container.querySelector('.v-charts-journey')!
  await fireEvent.keyDown(target, { key: 'ArrowDown' })
  await fireEvent.keyDown(target, { key: 'ArrowDown' })
  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
  await fireEvent(target, event)
  expect(click.mock.calls).toEqual([[expect.objectContaining({ name: 'C' }), 1, event]])
  expect(enter).not.toHaveBeenCalled()
})

// Catches keyboard traversal positions being mistaken for canonical layout indexes.
it('emits sunburst keyboard activation with the selected node layout index', async () => {
  const click = vi.fn()
  const { container } = render(() => (
    <SunburstChart width={500} height={300} data={tree} isAnimationActive={false} {...{ 'onNode-click': click }} />
  ))
  await nextTick()
  const target = container.querySelector('.v-charts-wrapper')!
  await fireEvent.keyDown(target, { key: 'Home' })
  await fireEvent.keyDown(target, { key: 'ArrowRight' })
  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
  await fireEvent(target, event)
  expect(click.mock.calls).toEqual([[expect.objectContaining({ name: 'A' }), 2, event]])
})
