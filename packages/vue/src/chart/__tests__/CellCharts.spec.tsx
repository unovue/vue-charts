import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { CalendarHeatmap, Tooltip, Tracker } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { levelOf, toDayNumber } from '../cellGridUtils'

const clock = vi.hoisted(() => ({ runs: [] as Array<{ to: number, update: (v: number) => void, complete: () => void, stopped: boolean }> }))
vi.mock('motion-v', async original => ({
  ...await original<typeof import('motion-v')>(),
  animate: (from: number, to: number, options: { onUpdate: (v: number) => void, onComplete?: () => void }) => {
    if (typeof from !== 'number')
      return { stop() {} }
    const run = { to, update: options.onUpdate, complete: () => options.onComplete?.(), stopped: false }
    clock.runs.push(run)
    return { stop: () => { run.stopped = true } }
  },
}))

/** Moves every running animation to `progress`, or finishes it when omitted. */
async function frame(progress?: number) {
  for (const run of clock.runs.filter(run => !run.stopped)) {
    run.update(progress ?? run.to)
    if (progress == null) {
      run.stopped = true
      run.complete()
    }
  }
  await nextTick()
}

beforeEach(() => {
  clock.runs = []
  mockGetBoundingClientRect({ width: 400, height: 300 })
})

const bars = (container: Element) => Array.from(container.querySelectorAll<SVGRectElement>('.v-charts-cell-rect'))
const geometry = (rect: SVGRectElement) => ({ x: Number(rect.getAttribute('x')), width: Number(rect.getAttribute('width')) })

describe('<Tracker />', () => {
  it('colors each bar by status, with custom colors and a no-data color', () => {
    const { container } = render(() => (
      <Tracker
        width={100}
        height={20}
        gap={0}
        isAnimationActive={false}
        colors={{ down: 'red', paused: 'gray' }}
        data={[{ date: '2026-01-01', status: 'up' }, { date: '2026-01-02', status: 'down' }, { date: '2026-01-03', status: 'paused' }, { date: '2026-01-04' }, { date: '2026-01-05', status: 'typo' }]}
      />
    ))
    expect(bars(container).map(rect => rect.style.fill)).toEqual([
      'var(--v-charts-status-up, #22c55e)',
      'red',
      'gray',
      'var(--v-charts-muted, #e5e5e5)',
      'var(--v-charts-muted, #e5e5e5)',
    ])
    expect(bars(container).map(geometry)).toEqual([0, 20, 40, 60, 80].map(x => ({ x, width: 20 })))
  })

  it('slides the window without overlapping bars and keeps the DOM node of every staying day', async () => {
    const days = ref([{ date: 'a', status: 'up' }, { date: 'b', status: 'down' }, { date: 'c', status: 'up' }, { date: 'd', status: 'up' }])
    const { container } = render(() => <Tracker width={400} height={20} gap={0} data={days.value} />)
    await frame()
    const nodeOfB = container.querySelector('[aria-label^="b"]')
    days.value = [...days.value.slice(1), { date: 'e', status: 'degraded' }]
    await nextTick()

    for (const progress of [0.25, 0.5, 0.75]) {
      await frame(progress)
      const rects = bars(container).map(geometry).sort((a, b) => a.x - b.x)
      for (let i = 1; i < rects.length; i++)
        expect(rects[i].x).toBeGreaterThanOrEqual(rects[i - 1].x + rects[i - 1].width - 1e-6)
    }
    await frame()
    expect(bars(container).map(geometry)).toEqual([0, 100, 200, 300].map(x => ({ x, width: 100 })))
    expect(container.querySelector('[aria-label^="b"]')).toBe(nodeOfB)
  })

  it('shows the readable date and status in the tooltip and dims the other bars', async () => {
    const { container, findByText } = render(() => (
      <Tracker width={200} height={20} isAnimationActive={false} data={[{ date: '2026-08-21', status: 'down' }, { date: '2026-08-22', status: 'up' }]}>
        <Tooltip />
      </Tracker>
    ))
    const cells = container.querySelectorAll<SVGGElement>('.v-charts-cell')
    await fireEvent.mouseEnter(cells[0])
    await fireEvent(container.querySelector('.v-charts-wrapper')!, new MouseEvent('mousemove', { bubbles: true, clientX: 10, clientY: 10 }))
    await nextTick()
    expect(await findByText('Aug 21, 2026')).toBeTruthy()
    expect(await findByText('Down')).toBeTruthy()
    expect(cells[1].style.opacity).toBe('0.45')
  })

  it('moves the active bar with the arrow keys and clears it with Escape', async () => {
    const { container } = render(() => (
      <Tracker width={300} height={20} isAnimationActive={false} data={[{ date: 'a', status: 'up' }, { date: 'b', status: 'up' }, { date: 'c', status: 'down' }]} />
    ))
    const grid = container.querySelector('.v-charts-cell-grid')!
    const active = () => container.querySelector('[aria-selected="true"]')?.getAttribute('aria-label')
    await fireEvent.keyDown(grid, { key: 'ArrowLeft' })
    expect(active()).toBe('c: Down')
    await fireEvent.keyDown(grid, { key: 'ArrowLeft' })
    expect(active()).toBe('b: Operational')
    expect(grid.getAttribute('aria-activedescendant')).toBe(container.querySelector('[aria-selected="true"]')!.id)
    await fireEvent.keyDown(grid, { key: 'Escape' })
    expect(active()).toBeUndefined()
  })
})

describe('<CalendarHeatmap />', () => {
  const cellsOf = (container: Element) => Array.from(container.querySelectorAll<SVGGElement>('.v-charts-cell'), cell => ({
    label: cell.getAttribute('aria-label'),
    x: Number(cell.querySelector('rect')!.getAttribute('x')),
    y: Number(cell.querySelector('rect')!.getAttribute('y')),
    fill: cell.querySelector('rect')!.style.fill,
  }))

  it.each([
    { weekStart: 0 as const, firstRow: 0, columns: 4 },
    { weekStart: 1 as const, firstRow: 6, columns: 5 },
  ])('places days in week columns and weekday rows (weekStart $weekStart)', ({ weekStart, firstRow, columns }) => {
    // 2026-02-01 is a Sunday.
    const { container } = render(() => (
      <CalendarHeatmap width={400} height={200} weekStart={weekStart} start="2026-02-01" end="2026-02-28" monthLabels={false} weekdayLabels={false} isAnimationActive={false} data={[]} />
    ))
    const cells = cellsOf(container)
    expect(cells).toHaveLength(28)
    const rowOf = (cell: { y: number }) => Math.round(cell.y / (200 / 7))
    expect(rowOf(cells[0])).toBe(firstRow)
    expect(new Set(cells.map(cell => cell.x)).size).toBe(columns)
  })

  it('sums rows of the same day, scales to the largest value and keeps missing days empty', () => {
    const { container } = render(() => (
      <CalendarHeatmap
        width={400}
        height={200}
        isAnimationActive={false}
        levels={2}
        color="green"
        emptyColor="white"
        start="2026-03-01"
        end="2026-03-04"
        data={[{ date: '2026-03-01', value: 2 }, { date: '2026-03-01', value: 2 }, { date: '2026-03-02', value: 1 }, { date: '2026-03-03', value: 0 }, { date: '2026-02-30', value: 99 }]}
      />
    ))
    expect(cellsOf(container).map(cell => [cell.label, cell.fill])).toEqual([
      ['Sun, Mar 1, 2026: 4', 'green'],
      ['Mon, Mar 2, 2026: 1', 'color-mix(in oklab, green 50%, white)'],
      ['Tue, Mar 3, 2026: 0', 'white'],
      ['Wed, Mar 4, 2026', 'white'],
    ])
  })

  it('ends the default range at the latest day in the data, not today', () => {
    const { container } = render(() => (
      <CalendarHeatmap width={800} height={200} isAnimationActive={false} data={[{ date: '2020-06-10', value: 1 }]} />
    ))
    const labels = cellsOf(container).map(cell => cell.label)
    expect(labels.at(-1)).toBe('Wed, Jun 10, 2020: 1')
    expect(labels).toHaveLength(52 * 7 + 4)
  })

  it('never draws two month labels on top of each other', () => {
    const { container } = render(() => (
      <CalendarHeatmap width={800} height={200} isAnimationActive={false} start="2025-01-30" end="2025-12-31" data={[]} />
    ))
    const xs = Array.from(container.querySelectorAll('.v-charts-calendar-months text'), text => Number(text.getAttribute('x')))
    const step = (800 - 28) / 53
    for (let i = 1; i < xs.length; i++)
      expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(step * 2.9)
    expect(container.querySelector('.v-charts-calendar-months text')!.textContent).toBe('Feb')
  })
})

describe('cell grid utils', () => {
  it.each([
    ['2026-01-01', toDayNumber(new Date(2026, 0, 1))],
    ['2026-01-01', toDayNumber(new Date(2026, 0, 1, 23, 59))],
    ['2026-02-30', undefined],
    ['2026-1-1', undefined],
  ])('reads %s as the same calendar day as a local Date', (input, expected) => {
    expect(toDayNumber(input)).toBe(expected)
  })

  it.each([
    [0, 10, 4, 0],
    [-3, 10, 4, 0],
    [0.1, 10, 4, 1],
    [5, 10, 4, 2],
    [10, 10, 4, 4],
    [50, 10, 4, 4],
    [5, 0, 4, 0],
  ])('levelOf(%d, max %d, %d levels) is %d', (value, max, levels, expected) => {
    expect(levelOf(value, max, levels)).toBe(expected)
  })
})
