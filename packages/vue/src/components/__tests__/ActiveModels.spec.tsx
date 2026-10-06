import 'vitest-canvas-mock'
import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Bar, BarChart, CalendarHeatmap, CohortChart, Heatmap, Pie, PieChart, Sparkline, Tooltip, Tracker, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const rows = [{ name: 'A', value: 10 }, { name: 'B', value: 20 }]
const kinds = ['Tooltip', 'Sparkline', 'Pie', 'Bar', 'Tracker', 'Heatmap', 'CohortChart', 'CalendarHeatmap', 'Sparkline area', 'Sparkline bar'] as const
type Kind = typeof kinds[number]
beforeEach(() => mockGetBoundingClientRect({ width: 500, height: 300 }))

function chart(kind: Kind, index: number | null | undefined, update: (index: number | null) => void) {
  const model = { 'activeIndex': index, 'onUpdate:activeIndex': update }
  const tooltip = <Tooltip activeIndex={0} isAnimationActive={false} />
  switch (kind) {
    case 'Tooltip':
    case 'Bar':
      return (
        <BarChart width={500} height={300} data={rows}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="value" isAnimationActive={false} {...kind === 'Bar' ? model : {}}>
            {{ activeBar: ({ index }) => <path data-active={index} /> }}
          </Bar>
          {kind === 'Tooltip' && <Tooltip shared={false} isAnimationActive={false} {...model} />}
        </BarChart>
      )
    case 'Pie':
      return (
        <PieChart width={500} height={300}>
          <Pie data={rows} dataKey="value" isAnimationActive={false} {...model}>
            {{ activeShape: ({ index }) => <path data-active={index} /> }}
          </Pie>
        </PieChart>
      )
    case 'Sparkline':
    case 'Sparkline area':
    case 'Sparkline bar':
      return <Sparkline width={500} height={300} data={rows} nameKey="name" type={kind === 'Sparkline bar' ? 'bar' : kind === 'Sparkline area' ? 'area' : 'line'} isAnimationActive={false} {...model}>{tooltip}</Sparkline>
    case 'Tracker':
      return <Tracker width={500} height={300} data={[{ date: 'A', status: 'up' }, { date: 'B', status: 'down' }]} isAnimationActive={false} {...model}>{tooltip}</Tracker>
    case 'Heatmap':
      return <Heatmap width={500} height={300} data={[{ x: 'A', y: 'row', value: 10 }, { x: 'B', y: 'row', value: 20 }]} isAnimationActive={false} {...model}>{tooltip}</Heatmap>
    case 'CohortChart':
      return <CohortChart width={500} height={300} data={[{ cohort: 'A', values: [10, 5] }]} isAnimationActive={false} {...model}>{tooltip}</CohortChart>
    case 'CalendarHeatmap':
      return <CalendarHeatmap width={500} height={300} start="2026-08-21" end="2026-08-22" data={[{ date: '2026-08-21', value: 10 }, { date: '2026-08-22', value: 20 }]} isAnimationActive={false} {...model}>{tooltip}</CalendarHeatmap>
  }
}

function activeIndex(container: Element) {
  const marker = container.querySelector('[data-active]')
  if (marker)
    return Number(marker.getAttribute('data-active'))
  const circle = container.querySelector('.v-charts-sparkline-active circle')
  if (circle)
    return circle.getAttribute('cx') === '3' ? 0 : 1
  const cells = [...container.querySelectorAll('.v-charts-cell')]
  const index = cells.findIndex(cell => cell.getAttribute('aria-selected') === 'true')
  return index < 0 ? null : index
}

async function hoverFirst(container: Element, kind: Kind) {
  if (kind === 'Sparkline' || kind === 'Sparkline area') {
    await fireEvent.mouseMove(container.querySelector('.v-charts-sparkline g[role="img"]')!, { clientX: 3, clientY: 10 })
    return
  }
  const selector = kind === 'Tooltip' || kind === 'Bar' ? '.v-charts-bar-rectangle' : kind === 'Pie' ? '.v-charts-pie > g' : '.v-charts-cell'
  await fireEvent.mouseEnter(container.querySelector(selector)!)
}

// Catches missing root forwarding, rejected hover changing display, and Tooltip defeating root control.
it.each(kinds)('%s accepts external selection, requests hover once, respects rejection and clears with null', async (kind) => {
  const index = ref<number | null>(1)
  const update = vi.fn()
  const { container } = render(() => chart(kind, index.value, update))
  await nextTick()
  expect(activeIndex(container)).toBe(1)
  expect(update).not.toHaveBeenCalled()
  await hoverFirst(container, kind)
  await hoverFirst(container, kind)
  expect(update.mock.calls).toEqual([[0]])
  expect(activeIndex(container)).toBe(1)
  index.value = 0
  await nextTick()
  expect(activeIndex(container)).toBe(0)
  expect(update.mock.calls).toEqual([[0]])
  index.value = null
  await nextTick()
  expect(activeIndex(container)).toBeNull()
  expect(update.mock.calls).toEqual([[0]])
})

// Catches an invalid standalone model remaining selected or echoing on presentation updates.
it.each(kinds.filter(kind => kind !== 'Tooltip' && kind !== 'Bar' && kind !== 'Pie'))('%s requests null once for each invalid input state', async (kind) => {
  const index = ref<number | null>(-1)
  const update = vi.fn()
  const { container } = render(() => chart(kind, index.value, update))
  await nextTick()
  expect(activeIndex(container)).toBeNull()
  expect(update.mock.calls).toEqual([[null]])
  await nextTick()
  expect(update.mock.calls).toEqual([[null]])
  index.value = 0.5
  await nextTick()
  expect(update.mock.calls).toEqual([[null], [null]])
  index.value = Number.NaN
  await nextTick()
  expect(update.mock.calls).toEqual([[null], [null], [null]])
})

// Catches conflicting controllers throwing while rendering or changing ownership after a request.
it('warns once for conflicting controlled Tooltips, uses the first and notifies every renderer', async () => {
  const warning = vi.spyOn(console, 'warn')
  try {
    const index = ref<number | null>(1)
    const updates = [vi.fn(), vi.fn()]
    const { container } = render(() => (
      <BarChart width={500} height={300} data={rows}>
        <XAxis dataKey="name" />
        <YAxis />
        <Bar dataKey="value" isAnimationActive={false} />
        <Tooltip shared={false} activeIndex={index.value} isAnimationActive={false} {...{ 'onUpdate:activeIndex': updates[0] }} />
        <Tooltip activeIndex={0} isAnimationActive={false} {...{ 'onUpdate:activeIndex': updates[1] }} />
      </BarChart>
    ))
    await nextTick()
    expect(warning.mock.calls).toEqual([['vccs: only one Tooltip per chart may control activeIndex; the first controlled Tooltip wins.']])
    expect([...container.querySelectorAll('.v-charts-tooltip-item-value')].map(node => node.textContent)).toEqual(['20', '20'])
    await fireEvent.mouseEnter(container.querySelector('.v-charts-bar-rectangle')!)
    expect(updates.map(update => update.mock.calls)).toEqual([[[0]], [[0]]])
    expect([...container.querySelectorAll('.v-charts-tooltip-item-value')].map(node => node.textContent)).toEqual(['20', '20'])
    index.value = 0
    await nextTick()
    expect(warning).toHaveBeenCalledTimes(1)
    expect([...container.querySelectorAll('.v-charts-tooltip-item-value')].map(node => node.textContent)).toEqual(['10', '10'])
  }
  finally {
    warning.mockRestore()
  }
})

// Catches keyboard clearing routed through a hover channel that a click-trigger Tooltip rejects.
it.each(['Sparkline', 'Tracker'])('%s clears keyboard requests with a click-trigger Tooltip', async (kind) => {
  const index = ref<number | null>(1)
  const update = vi.fn((next: number | null) => { index.value = next })
  const model = () => ({ 'activeIndex': index.value, 'onUpdate:activeIndex': update })
  const { container } = render(() => kind === 'Sparkline'
    ? <Sparkline width={500} height={300} data={rows} isAnimationActive={false} {...model()}><Tooltip trigger="click" /></Sparkline>
    : <Tracker width={500} height={300} data={[{ date: 'A', status: 'up' }, { date: 'B', status: 'down' }]} isAnimationActive={false} {...model()}><Tooltip trigger="click" /></Tracker>)
  await nextTick()
  const target = container.querySelector(kind === 'Sparkline' ? '.v-charts-sparkline g[role="img"]' : '.v-charts-cell-grid')!
  await fireEvent.keyDown(target, { key: 'Escape' })
  expect(update.mock.calls).toEqual([[null]])
  expect(activeIndex(container)).toBeNull()
  await fireEvent.keyDown(target, { key: 'Home' })
  expect(activeIndex(container)).toBe(0)
  await fireEvent.blur(target)
  expect(activeIndex(container)).toBeNull()
  expect(update.mock.calls).toEqual([[null], [0], [null]])
})

// Catches local indexes drifting after reorder, stale coordinates on resize, and lost clear requests.
it.each(['Sparkline', 'Tracker'])('%s follows uncontrolled identity and clears a removed item', async (kind) => {
  const data = ref(rows)
  const width = ref(500)
  const update = vi.fn()
  const { container } = render(() => kind === 'Sparkline'
    ? <Sparkline width={width.value} height={300} data={data.value} nameKey="name" isAnimationActive={false} {...{ 'onUpdate:activeIndex': update }}><Tooltip isAnimationActive={false}>{{ content: ({ payload, coordinate }) => <span data-coordinate={coordinate?.x}>{payload.map(entry => entry.value).join(',')}</span> }}</Tooltip></Sparkline>
    : <Tracker width={width.value} height={300} data={data.value} nameKey="name" dataKey="value" isAnimationActive={false} {...{ 'onUpdate:activeIndex': update }}><Tooltip isAnimationActive={false}>{{ content: ({ payload, coordinate }) => <span data-coordinate={coordinate?.x}>{payload.map(entry => entry.value).join(',')}</span> }}</Tooltip></Tracker>)
  await nextTick()
  await hoverFirst(container, kind)
  expect(activeIndex(container)).toBe(0)
  const coordinate = container.querySelector('[data-coordinate]')?.getAttribute('data-coordinate')
  data.value = [rows[1]!, rows[0]!]
  width.value = 350
  await nextTick()
  expect(activeIndex(container)).toBe(1)
  expect(container.querySelector('[data-coordinate]')?.textContent).toBe('10')
  expect(container.querySelector('[data-coordinate]')?.getAttribute('data-coordinate')).not.toBe(coordinate)
  expect(update.mock.calls).toEqual([[0]])
  data.value = [rows[1]!]
  await nextTick()
  expect(activeIndex(container)).toBeNull()
  expect(update.mock.calls).toEqual([[0], [null]])
  expect(container.querySelector<HTMLElement>('[role="tooltip"]')?.style.visibility).toBe('hidden')
})

// Catches duplicate primitive or named identities resolving the second point to the first.
it.each([
  [5, 5],
  [{ name: 'same', value: 5 }, { name: 'same', value: 5 }],
])('keeps duplicate Sparkline points distinct: %j', async (...data) => {
  const update = vi.fn()
  const values = ref(data)
  const { container } = render(() => <Sparkline width={500} height={300} data={values.value} nameKey="name" isAnimationActive={false} {...{ 'onUpdate:activeIndex': update }} />)
  await nextTick()
  await fireEvent.mouseMove(container.querySelector('.v-charts-sparkline g[role="img"]')!, { clientX: 499, clientY: 10 })
  expect(activeIndex(container)).toBe(1)
  expect(update.mock.calls).toEqual([[1]])
  if (typeof data[0] === 'number') {
    values.value = [7, 8]
    await nextTick()
    expect(activeIndex(container)).toBe(1)
    expect(update.mock.calls).toEqual([[1]])
  }
  else {
    values.value = [data[1]!, data[0]!]
    await nextTick()
    expect(activeIndex(container)).toBe(0)
    expect(update.mock.calls).toEqual([[1]])
  }
})
