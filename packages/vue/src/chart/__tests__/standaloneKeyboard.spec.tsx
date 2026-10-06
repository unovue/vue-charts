import 'vitest-canvas-mock'
import { fireEvent, render } from '@testing-library/vue'
import { expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Sankey, SunburstChart, Tooltip, Treemap } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const leaves = [{ name: 'A', value: 10 }, { name: 'B', value: 10 }, { name: 'C', value: 10 }]
const tree = [{ name: 'Group', children: [{ name: 'Inner', children: leaves }] }]
const flow = {
  nodes: [{ name: 'C' }, { name: 'A' }, { name: 'B' }],
  links: [{ source: 1, target: 2, value: 10 }, { source: 2, target: 0, value: 10 }],
}
const radial = {
  name: 'root',
  children: [
    { name: 'A', children: [{ name: 'B', value: 10 }] },
    { name: 'C', value: 10 },
  ],
}

// Catches discarded attributes/names, wrong spatial or hierarchy order, and pointer-only clicks.
it.each([
  ['Treemap', Treemap, 'Treemap', 'A', 'C', 'B'],
  ['Sankey', Sankey, 'Sankey diagram', 'A', 'B', 'C'],
  ['Sunburst', SunburstChart, 'Sunburst chart', 'A', 'B', 'C'],
])('%s exposes its root and navigates nodes', async (_, Chart, title, first, second, last) => {
  mockGetBoundingClientRect({ width: 500, height: 300 })
  const click = vi.fn()
  const update = vi.fn()
  const customTitle = ref<string>()
  const attrs = { 'class': 'custom-chart', 'style': { backgroundColor: 'red' }, 'data-owner': 'caller', 'aria-details': 'details', 'onNode-click': click }
  // The table contains three distinct public data types; select each chart without casting them.
  const { container } = render(() => Chart === Treemap
    ? <Treemap data={tree} width={500} height={300} title={customTitle.value} desc="Chart details" isAnimationActive={false} {...attrs}><Tooltip isAnimationActive={false} {...{ 'onUpdate:activeIndex': update }} /></Treemap>
    : Chart === Sankey
      ? <Sankey data={flow} width={500} height={300} title={customTitle.value} desc="Chart details" isAnimationActive={false} {...attrs}><Tooltip isAnimationActive={false} {...{ 'onUpdate:activeIndex': update }} /></Sankey>
      : <SunburstChart data={radial} width={500} height={300} title={customTitle.value} desc="Chart details" isAnimationActive={false} {...attrs}><Tooltip isAnimationActive={false} {...{ 'onUpdate:activeIndex': update }} /></SunburstChart>)
  await nextTick()
  const root = container.querySelector<HTMLElement>('.v-charts-wrapper')!
  expect(root.classList.contains('custom-chart')).toBe(true)
  expect(root.style.backgroundColor).toBe('red')
  expect(root.getAttribute('data-owner')).toBe('caller')
  expect(root.getAttribute('aria-details')).toBe('details')
  expect(root.getAttribute('role')).toBe('application')
  expect(root.getAttribute('aria-label')).toBe(title)
  expect(root.getAttribute('tabindex')).toBe('0')
  expect(container.querySelector(`[id="${root.getAttribute('aria-describedby')}"]`)?.textContent).toBe('Chart details')
  root.focus()
  await fireEvent.keyDown(root, { key: 'ArrowRight' })
  expect(container.querySelector('.v-charts-tooltip-wrapper')?.textContent).toContain(`${first} : 10`)
  await fireEvent.keyDown(root, { key: 'ArrowRight' })
  expect(container.querySelector('.v-charts-tooltip-wrapper')?.textContent).toContain(`${second} : 10`)
  expect(update.mock.calls).toEqual([[0], [1]])
  expect(update.mock.calls.every(([index]) => typeof index === 'number' && Number.isFinite(index))).toBe(true)
  expect(root.style.outline).toBe('2px solid var(--v-charts-focus, Highlight)')
  await fireEvent.keyDown(root, { key: 'Enter' })
  expect(click).toHaveBeenCalledTimes(1)
  expect(click.mock.calls[0][0].name).toBe(second)
  expect(click.mock.calls[0][2]).toBeInstanceOf(KeyboardEvent)
  await fireEvent.keyDown(root, { key: 'End' })
  expect(container.querySelector('.v-charts-tooltip-wrapper')?.textContent).toContain(`${last} : 10`)
  await fireEvent.keyDown(root, { key: 'Home' })
  await fireEvent.keyDown(root, { key: 'ArrowDown' })
  await fireEvent.keyDown(root, { key: 'ArrowUp' })
  expect(container.querySelector('.v-charts-tooltip-wrapper')?.textContent).toContain(`${first} : 10`)
  await fireEvent.keyDown(root, { key: 'Escape' })
  expect(container.querySelector<HTMLElement>('.v-charts-tooltip-wrapper')?.style.visibility).toBe('hidden')
  customTitle.value = 'Revenue'
  await nextTick()
  expect(root.getAttribute('aria-label')).toBe('Revenue')
})
