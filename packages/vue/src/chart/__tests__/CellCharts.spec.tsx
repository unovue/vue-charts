import { clock, frame } from '@/test/motionClock'
import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { BarList, CalendarHeatmap, CohortChart, Heatmap, Tooltip, Tracker } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { motionTokens } from '@/animation/motion'
import { levelOf, toDayNumber } from '../cellGridUtils'

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
        statusColors={{ down: 'red', paused: 'gray' }}
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

  it('keeps the tooltip on the active bar when the window moves', async () => {
    const days = ref([{ date: '2026-08-01', status: 'up' }, { date: '2026-08-02', status: 'down' }, { date: '2026-08-03', status: 'up' }])
    const { container, findByText, queryByText } = render(() => (
      <Tracker width={300} height={20} isAnimationActive={false} data={days.value}>
        <Tooltip />
      </Tracker>
    ))
    await fireEvent.mouseEnter(container.querySelectorAll('.v-charts-cell')[1])
    await fireEvent(container.querySelector('.v-charts-wrapper')!, new MouseEvent('mousemove', { bubbles: true, clientX: 150, clientY: 10 }))
    expect(await findByText('Aug 2, 2026')).toBeTruthy()
    days.value = [...days.value.slice(1), { date: '2026-08-04', status: 'up' }]
    await nextTick()
    await nextTick()
    expect(await findByText('Aug 2, 2026')).toBeTruthy()
    expect(queryByText('Aug 3, 2026')).toBeNull()
  })

  it('starts keyboard focus on the latest bar, moves with the arrow keys and clears with Escape', async () => {
    const { container } = render(() => (
      <Tracker width={300} height={20} isAnimationActive={false} data={[{ date: 'a', status: 'up' }, { date: 'b', status: 'up' }, { date: 'c', status: 'down' }]} />
    ))
    const grid = container.querySelector<SVGGElement>('.v-charts-cell-grid')!
    const active = () => container.querySelector('[aria-selected="true"]')?.getAttribute('aria-label')
    grid.focus()
    await nextTick()
    expect(active()).toBe('c: Down')
    await fireEvent.keyDown(grid, { key: 'ArrowLeft' })
    expect(active()).toBe('b: Operational')
    expect(grid.getAttribute('aria-activedescendant')).toBe(container.querySelector('[aria-selected="true"]')!.id)
    await fireEvent.keyDown(grid, { key: 'Escape' })
    expect(active()).toBeUndefined()
  })
})

describe('<CalendarHeatmap />', () => {
  it('keeps date, month and weekday formats separate when the locale changes', async () => {
    const locale = ref('en-US')
    const { container } = render(() => (
      <CalendarHeatmap
        width={400}
        height={120}
        locale={locale.value}
        start="2026-01-01"
        end="2026-01-31"
        data={[{ date: '2026-01-01', value: 5 }]}
        isAnimationActive={false}
      />
    ))
    for (const [language, date, month, weekdays] of [
      ['en-US', 'Thu, Jan 1, 2026: 5', 'Jan', ['Mon', 'Wed', 'Fri']],
      ['fr-FR', 'jeu. 1 janv. 2026: 5', 'janv.', ['lun.', 'mer.', 'ven.']],
    ] as const) {
      locale.value = language
      await nextTick()
      expect(container.querySelector('.v-charts-cell')?.getAttribute('aria-label')).toBe(date)
      expect(container.querySelector('.v-charts-calendar-months text')?.textContent).toBe(month)
      expect(Array.from(container.querySelectorAll('.v-charts-calendar-weekdays text'), item => item.textContent))
        .toEqual(weekdays)
    }
  })

  it('exposes contributing rows on summed days and none on missing days', async () => {
    const data = [
      { activity: { date: '2026-01-01', value: 2 }, author: 'A' },
      { activity: { date: '2026-01-01', value: 3 }, author: 'B' },
    ]
    const click = vi.fn()
    const { container } = render(() => (
      <CalendarHeatmap
        width={300}
        height={100}
        data={data}
        dateKey="activity.date"
        dataKey={row => row.activity.value}
        start="2026-01-01"
        end="2026-01-02"
        isAnimationActive={false}
        {...{ 'onCell-click': click }}
      />
    ))
    const cells = container.querySelectorAll('.v-charts-cell')
    await fireEvent.click(cells[0])
    await fireEvent.click(cells[1])
    expect(click.mock.calls.map(([day]) => day)).toEqual([
      { date: '2026-01-01', value: 5, level: 4, rows: data },
      { date: '2026-01-02', value: null, level: 0, rows: [] },
    ])
  })

  // Position-based keys remounted months on every window shift.
  it('keeps each month label mounted while the window moves one week', async () => {
    const start = ref('2026-01-01')
    const end = ref('2026-06-30')
    const { container } = render(() => (
      <CalendarHeatmap width={600} height={140} start={start.value} end={end.value} data={[]} />
    ))
    await frame()
    const before = Array.from(container.querySelectorAll('.v-charts-calendar-months text'))
    expect(before.map(node => node.textContent)).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'])
    start.value = '2026-01-08'
    end.value = '2026-07-07'
    await nextTick()
    await frame(0.25)
    for (const node of before)
      expect(Array.from(container.querySelectorAll('.v-charts-calendar-months text'))).toContain(node)
    await frame()
    for (const node of before)
      expect(Array.from(container.querySelectorAll('.v-charts-calendar-months text'))).toContain(node)
  })

  it('ends at the latest valid date even when its value is missing', () => {
    const { container } = render(() => (
      <CalendarHeatmap
        width={400}
        height={150}
        data={[
          { date: '2026-01-01', value: 5 },
          { date: '2026-01-02', value: undefined },
          { date: '2026-02-30', value: 10 },
        ]}
        isAnimationActive={false}
      />
    ))
    const labels = Array.from(container.querySelectorAll('.v-charts-cell'), cell => cell.getAttribute('aria-label'))
    expect(labels.at(-1)).toBe('Fri, Jan 2, 2026')
    expect(labels.at(-2)).toBe('Thu, Jan 1, 2026: 5')
  })

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

  it.each([
    { change: 'the year', next: { start: '2027-01-01', end: '2027-03-31', weekStart: 0 as const } },
    { change: 'the week start', next: { start: '2026-01-01', end: '2026-03-31', weekStart: 1 as const } },
  ])('changes $change without cells crossing each other', async ({ next }) => {
    const range = ref<{ start: string, end: string, weekStart: 0 | 1 }>({ start: '2026-01-01', end: '2026-03-31', weekStart: 0 })
    const { container } = render(() => <CalendarHeatmap width={400} height={120} monthLabels={false} weekdayLabels={false} data={[]} {...range.value} />)
    await frame()
    range.value = next
    await nextTick()
    for (const progress of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      await frame(progress)
      const rects = Array.from(container.querySelectorAll<SVGRectElement>('.v-charts-cell-rect'), rect => ['x', 'y', 'width', 'height'].map(name => Number(rect.getAttribute(name))))
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const [ax, ay, aw, ah] = rects[i]
          const [bx, by, bw, bh] = rects[j]
          const area = Math.max(0, Math.min(ax + aw, bx + bw) - Math.max(ax, bx)) * Math.max(0, Math.min(ay + ah, by + bh) - Math.max(ay, by))
          expect(area).toBeLessThan(0.01)
        }
      }
    }
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

describe('<Heatmap />', () => {
  it('exposes aggregate and missing-cell provenance through events, slots and formatting', async () => {
    const data = [
      { position: { x: 'A', y: 'B' }, amount: 2, author: 'first' },
      { position: { x: 'A', y: 'B' }, amount: 3, author: 'second' },
    ]
    const click = vi.fn()
    const formatter = vi.fn((value: number) => String(value))
    const slot = vi.fn((_props: { cell: { payload: unknown } }) => undefined)
    const { container } = render(() => (
      <Heatmap
        width={300}
        height={100}
        data={data}
        xKey="position.x"
        yKey={row => row.position.y}
        dataKey="amount"
        xDomain={['A', 'missing']}
        valueFormatter={formatter}
        isAnimationActive={false}
        {...{ 'onCell-click': click }}
      >
        {{ cell: slot }}
      </Heatmap>
    ))
    const cells = container.querySelectorAll('.v-charts-cell')
    await fireEvent.click(cells[0])
    await fireEvent.click(cells[1])
    const expected = [
      { x: 'A', y: 'B', value: 5, rows: data },
      { x: 'missing', y: 'B', value: null, rows: [] },
    ]
    expect(click.mock.calls.map(([cell]) => cell)).toEqual(expected)
    expect(formatter).toHaveBeenCalledWith(5, expected[0])
    expect(slot.mock.calls.map(([props]) => props.cell.payload)).toEqual(expect.arrayContaining(expected))
  })

  // A staying row label used to snap ahead of its moving cells.
  it('moves the next row label with its cells when a row is dropped', async () => {
    const data = ref([
      { x: 'X', y: 'A', value: 1 },
      { x: 'X', y: 'B', value: 2 },
      { x: 'X', y: 'C', value: 3 },
    ])
    const { container } = render(() => (
      <Heatmap
        width={300}
        height={318}
        gap={0}
        data={data.value}
        transition={{ duration: motionTokens.update.duration, ease: 'linear' }}
      />
    ))
    await frame()
    const label = Array.from(container.querySelectorAll('.v-charts-heatmap-y-labels text'))
      .find(node => node.textContent === 'C')!
    expect(Number(label.getAttribute('y'))).toBe(250)
    data.value = data.value.slice(1)
    await nextTick()
    await frame(0.5)
    expect(Number(label.getAttribute('y'))).toBeGreaterThan(225)
    expect(Number(label.getAttribute('y'))).toBeLessThan(250)
    await frame()
    expect(Number(label.getAttribute('y'))).toBe(225)
  })

  const cellsOf = (container: Element) => Array.from(container.querySelectorAll<SVGGElement>('.v-charts-cell'), cell => [cell.getAttribute('aria-label'), cell.querySelector('rect')!.style.fill])

  it('orders rows and columns by domain, sums duplicates and mixes colors by value', () => {
    const { container } = render(() => (
      <Heatmap
        width={300}
        height={100}
        isAnimationActive={false}
        color="blue"
        emptyColor="white"
        yDomain={['Tue', 'Mon']}
        data={[{ x: 'am', y: 'Mon', value: 2 }, { x: 'pm', y: 'Mon', value: 1 }, { x: 'am', y: 'Tue', value: 1 }, { x: 'am', y: 'Tue', value: 1 }]}
      />
    ))
    expect(cellsOf(container)).toEqual([
      ['Tue, am: 2', 'blue'],
      ['Tue, pm', 'white'],
      ['Mon, am: 2', 'blue'],
      ['Mon, pm: 1', 'color-mix(in oklab, blue 50%, white)'],
    ])
  })

  it('slides the rows below a removed row up instead of shrinking and regrowing them', async () => {
    const days = ref(['Mon', 'Tue', 'Wed', 'Thu'])
    const { container } = render(() => <Heatmap width={200} height={100} xLabels={false} yLabels={false} gap={0} data={days.value.map(y => ({ x: 'a', y, value: 1 }))} />)
    await frame()
    days.value = ['Mon', 'Wed', 'Thu']
    await nextTick()
    await frame(0.1)
    const heights = Array.from(container.querySelectorAll('.v-charts-cell-rect'), rect => Number(rect.getAttribute('height')))
    // Staying rows grow from 25 to 33.3 px; none collapses on the way.
    expect(Math.min(...heights.slice(0, 1), ...heights.slice(-2))).toBeGreaterThan(25)
  })

  it.each([
    { change: 'a removed middle row', next: { days: ['Mon', 'Wed', 'Thu'], hours: ['a', 'b', 'c'] } },
    { change: 'an added middle row', next: { days: ['Mon', 'Tue', 'Extra', 'Wed', 'Thu'], hours: ['a', 'b', 'c'] } },
    { change: 'reversed columns', next: { days: ['Mon', 'Tue', 'Wed', 'Thu'], hours: ['c', 'b', 'a'] } },
  ])('keeps cells apart through $change', async ({ next }) => {
    const grid = ref({ days: ['Mon', 'Tue', 'Wed', 'Thu'], hours: ['a', 'b', 'c'] })
    const { container } = render(() => (
      <Heatmap width={300} height={200} xLabels={false} yLabels={false} gap={0} xDomain={grid.value.hours} data={grid.value.days.flatMap(y => grid.value.hours.map(x => ({ x, y, value: 1 })))} />
    ))
    await frame()
    grid.value = next
    await nextTick()
    for (const progress of [0.05, 0.1, 0.25, 0.5, 0.9]) {
      await frame(progress)
      const rects = Array.from(container.querySelectorAll<SVGRectElement>('.v-charts-cell-rect'), rect => ['x', 'y', 'width', 'height'].map(name => Number(rect.getAttribute(name))))
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const [ax, ay, aw, ah] = rects[i]
          const [bx, by, bw, bh] = rects[j]
          expect(Math.max(0, Math.min(ax + aw, bx + bw) - Math.max(ax, bx)) * Math.max(0, Math.min(ay + ah, by + bh) - Math.max(ay, by))).toBeLessThan(0.01)
        }
      }
    }
  })

  it('thins column labels so they never overlap', () => {
    const data = Array.from({ length: 24 }, (_, hour) => ({ x: `${hour}:00`, y: 'Mon', value: hour }))
    const { container } = render(() => <Heatmap width={300} height={60} isAnimationActive={false} data={data} />)
    const xs = Array.from(container.querySelectorAll('.v-charts-heatmap-x-labels text'), text => Number(text.getAttribute('x')))
    expect(xs.length).toBeGreaterThan(1)
    expect(xs.length).toBeLessThan(24)
    for (let i = 1; i < xs.length; i++)
      expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual('23:00'.length * 6)
  })
})

describe('first appearance', () => {
  const fade = (rect: SVGRectElement) => Number(rect.getAttribute('fill-opacity') ?? 1)
  it.each([
    { name: 'Tracker', slides: true, chart: () => <Tracker width={300} height={20} data={[{ date: 'a', status: 'up' }, { date: 'b', status: 'down' }, { date: 'c', status: 'up' }]} /> },
    { name: 'Heatmap', slides: false, chart: () => <Heatmap width={300} height={200} data={[{ x: 'a', y: 'r', value: 1 }, { x: 'b', y: 's', value: 2 }]} /> },
    { name: 'CohortChart', slides: false, chart: () => <CohortChart width={300} height={120} data={[{ cohort: 'Jan', values: [10, 5] }, { cohort: 'Feb', values: [8, 4] }]} /> },
    { name: 'CalendarHeatmap', slides: false, chart: () => <CalendarHeatmap width={400} height={200} start="2026-02-01" end="2026-02-28" data={[]} /> },
  ])('$name fades its cells in one after another from the top-left', async ({ slides, chart }) => {
    const { container } = render(chart)
    await nextTick()
    const cells = bars(container)
    const start = geometry(cells[0]!)
    expect(cells.every(rect => fade(rect) === 0)).toBe(true)
    await frame(0.4)
    expect(fade(cells[0]!)).toBeGreaterThan(fade(cells.at(-1)!))
    await frame()
    expect(cells.every(rect => fade(rect) === 1)).toBe(true)
    // A tracker slides each bar in from the left; a grid settles each cell from a smaller size.
    if (slides)
      expect(geometry(cells[0]!).x).toBeCloseTo(start.x + 8)
    else
      expect(geometry(cells[0]!).width).toBeGreaterThan(start.width)
  })
})

describe('<CohortChart />', () => {
  it('exposes source rows and periods while duplicate cohort labels keep all provenance', async () => {
    const data = [
      { group: { name: 'Jan', counts: [100, 50] }, owner: 'first' },
      { group: { name: 'Jan', counts: [80, 20] }, owner: 'second' },
    ]
    const click = vi.fn()
    const slot = vi.fn((_props: { cell: { payload: unknown } }) => undefined)
    const { container } = render(() => (
      <CohortChart
        width={400}
        height={120}
        data={data}
        cohortKey="group.name"
        valuesKey={row => row.group.counts}
        isAnimationActive={false}
        {...{ 'onCell-click': click }}
      >
        {{ cell: slot }}
      </CohortChart>
    ))
    await fireEvent.click(container.querySelectorAll('.v-charts-cell')[1])
    const expected = {
      x: 1,
      y: 'Jan',
      value: 75,
      row: data[0],
      rows: data,
      period: 1,
    }
    expect(click.mock.calls[0][0]).toEqual(expected)
    expect(slot.mock.calls.map(([props]) => props.cell.payload)).toContainEqual(expected)
  })

  it.each([
    [null, ['Jan · 100, 0: 100%', 'Jan · 100, 2: 25%']],
    [undefined, ['Jan · 100, 0: 100%', 'Jan · 100, 2: 25%']],
    [0, ['Jan · 100, 0: 100%', 'Jan · 100, 1: 0%', 'Jan · 100, 2: 25%']],
  ])('leaves missing period %s blank and preserves measured zero', (value, expected) => {
    const { container } = render(() => (
      <CohortChart
        width={400}
        height={150}
        data={[{ cohort: 'Jan', values: [100, value, 25] }]}
        isAnimationActive={false}
      />
    ))
    const labels = Array.from(container.querySelectorAll('.v-charts-cell'), cell => cell.getAttribute('aria-label'))
    expect(labels).toEqual(expected)
  })

  it('shows each period as a share of the cohort size and leaves immature periods blank', () => {
    const { container } = render(() => (
      <CohortChart
        width={400}
        height={120}
        isAnimationActive={false}
        periodFormatter={i => `M${i}`}
        data={[{ cohort: 'Jan', values: [1200, 600, 300] }, { cohort: 'Feb', values: [800, 200] }]}
      />
    ))
    const cells = Array.from(container.querySelectorAll('.v-charts-cell'), cell => cell.getAttribute('aria-label'))
    expect(cells).toEqual(['Jan · 1,200, M0: 100%', 'Jan · 1,200, M1: 50%', 'Jan · 1,200, M2: 25%', 'Feb · 800, M0: 100%', 'Feb · 800, M1: 25%'])
    expect(Array.from(container.querySelectorAll('.v-charts-cell-text'), text => text.textContent)).toEqual(['100%', '50%', '25%', '100%', '25%'])
  })
})

describe('cell grid utils', () => {
  it.each([
    ['2026-01-01', toDayNumber(new Date(2026, 0, 1))],
    ['2026-01-01', toDayNumber(new Date(2026, 0, 1, 23, 59))],
    ['2026-02-30', undefined],
    ['2026-13-01', undefined],
    ['2026-00-01', undefined],
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

// Catches text choosing the theme background rather than contrast against its opaque cell.
it.each([
  ['#ffffff', 'var(--v-charts-label-foreground, #0a0a0a)'],
  ['#0a0a0a', 'var(--v-charts-label-foreground, #ffffff)'],
])('uses contrasting text on a %s Heatmap cell', (fill, expected) => {
  const { container } = render(() => (
    <Heatmap
      width={400}
      height={300}
      showValues
      colors={[fill]}
      data={[{ x: 'A', y: 'B', value: 10 }]}
      isAnimationActive={false}
    />
  ))
  expect(container.querySelector<SVGElement>('.v-charts-cell text')!.style.fill).toBe(expected)
})

// Catches page content jumping while removed rows are still drawn above it.
it('moves BarList height with entering and leaving row presence', async () => {
  const rows = ref([
    { name: 'A', value: 6 },
    { name: 'B', value: 5 },
    { name: 'C', value: 4 },
    { name: 'D', value: 3 },
    { name: 'E', value: 2 },
    { name: 'F', value: 1 },
  ])
  const click = vi.fn()
  const { container } = render(() => (
    <BarList
      data={rows.value}
      sort="none"
      transition={{ duration: 1, ease: 'linear' }}
      {...{ 'onRow-click': click }}
    />
  ))
  await frame()
  const list = container.querySelector<HTMLElement>('.v-charts-bar-list')!
  expect(list.style.height).toBe('212px')
  rows.value = rows.value.slice(0, 5)
  await nextTick()
  await frame(0.5)
  expect(Number.parseFloat(list.style.height)).toBeGreaterThan(176)
  expect(Number.parseFloat(list.style.height)).toBeLessThan(212)
  expect(list.style.height).toBe('194px')
  await fireEvent.click(container.querySelector('[aria-hidden="true"]')!)
  expect(click).not.toHaveBeenCalled()
  rows.value = [...rows.value, { name: 'F', value: 1 }]
  await nextTick()
  expect(list.style.height).toBe('194px')
  await frame(0.5)
  expect(list.style.height).toBe('203px')
  await frame()
  expect(list.style.height).toBe('212px')

  rows.value = rows.value.slice(0, 5)
  await nextTick()
  await frame()
  expect(list.style.height).toBe('176px')

  rows.value = []
  await nextTick()
  await frame(0.5)
  expect(list.style.height).toBe('86px')
  await frame()
  expect(list.style.height).toBe('0px')

  rows.value = [{ name: 'A', value: 2 }, { name: 'B', value: 1 }]
  await nextTick()
  await frame(0.5)
  expect(list.style.height).toBe('32px')
  await frame()
  expect(list.style.height).toBe('68px')
})

vi.mock('motion-v', async original => (await import('@/test/motionClock')).mockMotion(await original<typeof import('motion-v')>()))
vi.mock('@vueuse/core', async original => (await import('@/test/motionClock')).mockVueUse(await original<typeof import('@vueuse/core')>()))
