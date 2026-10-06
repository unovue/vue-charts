import 'vitest-canvas-mock'
import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Bar, BarChart, Pie, PieChart, Tooltip, Treemap, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const rows = [{ name: 'A', a: 10, b: 30 }, { name: 'B', a: 20, b: 40 }]
beforeEach(() => mockGetBoundingClientRect({ width: 500, height: 300 }))

// Catches last-renderer listener/settings ownership and disposal dropping another listener.
it('shares selection and requests while each Tooltip formats its own presentation', async () => {
  const first = ref(true)
  const updates = [vi.fn(), vi.fn()]
  const { container } = render(() => (
    <BarChart width={500} height={300} data={rows}>
      <XAxis dataKey="name" />
      <YAxis />
      <Bar dataKey="a" isAnimationActive={false} />
      <Bar dataKey="b" isAnimationActive={false} />
      {first.value && <Tooltip shared={false} isAnimationActive={false} formatter={value => Number(value) * 2} {...{ 'onUpdate:activeIndex': updates[0] }} />}
      <Tooltip shared isAnimationActive={false} formatter={value => Number(value) + 1} {...{ 'onUpdate:activeIndex': updates[1] }} />
    </BarChart>
  ))
  await nextTick()
  await fireEvent.mouseEnter(container.querySelectorAll('.v-charts-bar-rectangle')[1]!)
  expect(updates.map(update => update.mock.calls)).toEqual([[[1]], [[1]]])
  expect([...container.querySelectorAll('.v-charts-tooltip-item-value')].map(node => node.textContent)).toEqual(['40', '21'])
  await fireEvent.mouseEnter(container.querySelectorAll('.v-charts-bar-rectangle')[1]!)
  expect(updates.map(update => update.mock.calls.length)).toEqual([1, 1])
  first.value = false
  await nextTick()
  expect(updates.map(update => update.mock.calls)).toEqual([[[1]], [[1]]])
  await fireEvent.mouseMove(container.querySelector('.v-charts-wrapper')!, { clientX: 150, clientY: 100 })
  expect(updates[1].mock.calls.at(-1)).toEqual([0])
  expect([...container.querySelectorAll('.v-charts-tooltip-item-value')].map(node => node.textContent)).toEqual(['11', '31'])
})

// Catches flattened item indexes resolving the first series and series controls defeating chart controls.
it.each(['Bar', 'Pie'])('maps two %s series and gives chart control precedence over a rejecting series', async (kind) => {
  const chartIndex = ref<number | null | undefined>()
  const seriesIndex = ref<number | null>(0)
  const chartRequest = vi.fn()
  const seriesRequest = vi.fn()
  const Chart = kind === 'Bar' ? BarChart : PieChart
  const itemClass = kind === 'Bar' ? '.v-charts-bar-rectangle' : '.v-charts-pie > g'
  const { container } = render(() => (
    <Chart width={500} height={300} data={rows}>
      <XAxis dataKey="name" />
      <YAxis />
      {kind === 'Bar'
        ? (
            <>
              <Bar dataKey="a" isAnimationActive={false}>
                {{ activeBar: ({ index }) => <path data-active={`a${index}`} /> }}
              </Bar>
              <Bar dataKey="b" activeIndex={seriesIndex.value} isAnimationActive={false} {...{ 'onUpdate:activeIndex': seriesRequest }}>
                {{ activeBar: ({ index }) => <path data-active={`b${index}`} /> }}
              </Bar>
            </>
          )
        : (
            <>
              <Pie data={rows} dataKey="a" isAnimationActive={false}>
                {{ activeShape: ({ index }) => <path data-active={`a${index}`} /> }}
              </Pie>
              <Pie data={rows} dataKey="b" activeIndex={seriesIndex.value} isAnimationActive={false} {...{ 'onUpdate:activeIndex': seriesRequest }}>
                {{ activeShape: ({ index }) => <path data-active={`b${index}`} /> }}
              </Pie>
            </>
          )}
      <Tooltip shared={false} activeIndex={chartIndex.value} isAnimationActive={false} {...{ 'onUpdate:activeIndex': chartRequest }} />
    </Chart>
  ))
  await nextTick()
  await fireEvent.mouseEnter(container.querySelectorAll(itemClass)[3]!)
  expect(chartRequest.mock.calls).toEqual([[3]])
  expect(seriesRequest.mock.calls).toEqual([[1]])
  await fireEvent.mouseEnter(container.querySelectorAll(itemClass)[3]!)
  expect(seriesRequest.mock.calls).toEqual([[1]])
  expect(container.querySelector('.v-charts-tooltip-item-value')?.textContent).toBe('30')
  expect(container.querySelector('[data-active="b0"]')).not.toBeNull()
  await fireEvent.keyDown(container.querySelector('.v-charts-wrapper')!, { key: 'Home' })
  expect(container.querySelector('[data-active="a0"]')).not.toBeNull()
  expect(container.querySelector('[data-active="b0"]')).not.toBeNull()
  seriesIndex.value = null
  await nextTick()
  expect(container.querySelector('[data-active="b0"]')).toBeNull()
  seriesIndex.value = 99
  await nextTick()
  expect(seriesRequest.mock.calls.at(-1)).toEqual([null])
  seriesIndex.value = 0
  await nextTick()
  chartIndex.value = 3
  await nextTick()
  expect(container.querySelector('.v-charts-tooltip-item-value')?.textContent).toBe('40')
  expect(container.querySelector('[data-active="b1"]')).not.toBeNull()
  expect(container.querySelector('[data-active="b0"]')).toBeNull()
  await fireEvent.keyDown(container.querySelector('.v-charts-wrapper')!, { key: 'Home' })
  expect(chartRequest.mock.calls.at(-1)).toEqual([0])
  expect(container.querySelector('.v-charts-tooltip-item-value')?.textContent).toBe('40')
  chartIndex.value = null
  await nextTick()
  expect(container.querySelector<HTMLElement>('[role="tooltip"]')?.style.visibility).toBe('hidden')
  expect(container.querySelector('[data-active]')).toBeNull()
})

// Catches a saved position selecting a new row or keeping stale coordinates after a resize.
it.each([true, false])('follows identity through reorder/resize and clears a removed or hidden item; shared=%s', async (shared) => {
  const data = ref(rows)
  const width = ref(500)
  const hidden = ref(false)
  const update = vi.fn()
  const { container } = render(() => (
    <BarChart width={width.value} height={300} data={data.value}>
      <XAxis dataKey="name" />
      <YAxis />
      <Bar dataKey="a" hide={hidden.value} isAnimationActive={false} />
      <Tooltip shared={shared} isAnimationActive={false} {...{ 'onUpdate:activeIndex': update }}>
        {{ content: ({ payload, coordinate }) => <span data-coordinate={coordinate?.x}>{payload.map(entry => entry.value).join(',')}</span> }}
      </Tooltip>
    </BarChart>
  ))
  await nextTick()
  if (shared)
    await fireEvent.mouseMove(container.querySelector('.v-charts-wrapper')!, { clientX: 150, clientY: 100 })
  else
    await fireEvent.mouseEnter(container.querySelector('.v-charts-bar-rectangle')!)
  const oldX = container.querySelector('[data-coordinate]')?.getAttribute('data-coordinate')
  expect(container.querySelector('[data-coordinate]')?.textContent).toBe('10')
  data.value = [rows[1]!, rows[0]!]
  width.value = 350
  await nextTick()
  expect(container.querySelector('[data-coordinate]')?.textContent).toBe('10')
  expect(container.querySelector('[data-coordinate]')?.getAttribute('data-coordinate')).not.toBe(oldX)
  expect(update.mock.calls).toEqual([[0]])
  if (shared)
    await fireEvent.mouseMove(container.querySelector('.v-charts-wrapper')!, { clientX: 150, clientY: 100 })
  else
    await fireEvent.mouseEnter(container.querySelectorAll('.v-charts-bar-rectangle')[0]!)
  expect(update.mock.calls).toEqual([[0], [0]])
  expect(container.querySelector('[data-coordinate]')?.textContent).toBe('20')
  if (shared)
    await fireEvent.mouseMove(container.querySelector('.v-charts-wrapper')!, { clientX: 250, clientY: 100 })
  else
    await fireEvent.mouseEnter(container.querySelectorAll('.v-charts-bar-rectangle')[1]!)
  expect(container.querySelector('[data-coordinate]')?.textContent).toBe('10')
  data.value = [rows[1]!]
  await nextTick()
  expect(update.mock.calls.at(-1)).toEqual([null])
  expect(container.querySelector<HTMLElement>('[role="tooltip"]')?.style.visibility).toBe('hidden')
  if (shared)
    await fireEvent.mouseMove(container.querySelector('.v-charts-wrapper')!, { clientX: 150, clientY: 100 })
  else
    await fireEvent.mouseEnter(container.querySelector('.v-charts-bar-rectangle')!)
  hidden.value = true
  await nextTick()
  expect(update.mock.calls.at(-1)).toEqual([null])
  expect(container.querySelector<HTMLElement>('[role="tooltip"]')?.style.visibility).toBe('hidden')
})

// Catches clamping invalid controlled values and repeated requests caused by presentation updates.
it.each([99, -1, 0.5, Number.NaN])('keeps controlled indexes positional and requests null once for invalid input/order: %s', async (invalid) => {
  const data = ref(rows)
  const index = ref<number | null>(3)
  const style = ref('red')
  const width = ref(500)
  const update = vi.fn()
  const { container } = render(() => (
    <BarChart width={width.value} height={300} data={data.value}>
      <XAxis dataKey="name" />
      <YAxis />
      <Bar dataKey="a" isAnimationActive={false} />
      <Bar dataKey="b" isAnimationActive={false} />
      <Tooltip shared={false} activeIndex={index.value} contentStyle={{ color: style.value }} isAnimationActive={false} {...{ 'onUpdate:activeIndex': update }} />
    </BarChart>
  ))
  await nextTick()
  expect(container.querySelector('.v-charts-tooltip-item-value')?.textContent).toBe('40')
  data.value = [rows[1]!, rows[0]!]
  await nextTick()
  expect(container.querySelector('.v-charts-tooltip-item-value')?.textContent).toBe('30')
  expect(update).not.toHaveBeenCalled()
  index.value = invalid
  await nextTick()
  expect(container.querySelector<HTMLElement>('[role="tooltip"]')?.style.visibility).toBe('hidden')
  expect(update.mock.calls).toEqual([[null]])
  style.value = 'blue'
  width.value = 350
  await nextTick()
  expect(update.mock.calls).toEqual([[null]])
  data.value = [rows[0]!]
  await nextTick()
  expect(update.mock.calls).toEqual([[null], [null]])
  index.value = 98
  await nextTick()
  expect(update.mock.calls).toEqual([[null], [null], [null]])
})

// Catches sync bypassing update requests or overriding a rejecting controlled owner.
it('requests synced indexes without changing a controlled receiver or echoing its accepted prop', async () => {
  const index = ref<number | null>(1)
  const update = vi.fn()
  const { container } = render(() => (
    <>
      <BarChart width={500} height={300} data={rows} syncId="model-tooltip">
        <XAxis dataKey="name" />
        <Bar dataKey="a" isAnimationActive={false} />
        <Tooltip isAnimationActive={false} />
      </BarChart>
      <BarChart width={500} height={300} data={rows} syncId="model-tooltip">
        <XAxis dataKey="name" />
        <Bar dataKey="a" isAnimationActive={false} />
        <Tooltip activeIndex={index.value} isAnimationActive={false} {...{ 'onUpdate:activeIndex': update }} />
      </BarChart>
    </>
  ))
  await nextTick()
  const charts = container.querySelectorAll('.v-charts-wrapper')
  const value = () => charts[1]!.querySelector('.v-charts-tooltip-item-value')?.textContent
  expect(value()).toBe('20')
  expect(update).not.toHaveBeenCalled()
  await fireEvent.mouseMove(charts[0]!, { clientX: 150, clientY: 100 })
  expect(update.mock.calls).toEqual([[0]])
  expect(value()).toBe('20')
  await fireEvent.mouseMove(charts[0]!, { clientX: 150, clientY: 100 })
  expect(update.mock.calls).toEqual([[0]])
  index.value = 0
  await nextTick()
  expect(value()).toBe('10')
  expect(update.mock.calls).toEqual([[0]])
  await fireEvent.mouseLeave(charts[0]!)
  expect(update.mock.calls).toEqual([[0], [null]])
  expect(value()).toBe('10')
})

// Catches comparing an accepted public node position with its private hierarchy path.
it('announces accepted Treemap indexes and keeps the announcement when the parent rejects a request', async () => {
  vi.useFakeTimers()
  try {
    const index = ref<number | null | undefined>()
    let accept = true
    const requests: (number | null)[] = []
    const { container } = render(() => (
      <Treemap width={500} height={300} data={[{ name: 'Oak', value: 40 }, { name: 'Beech', value: 30 }]} isAnimationActive={false}>
        <Tooltip
          activeIndex={index.value}
          isAnimationActive={false}
          {...{ 'onUpdate:activeIndex': (next: number | null) => {
            requests.push(next)
            if (accept)
              index.value = next
          } }}
        />
      </Treemap>
    ))
    await nextTick()
    const root = container.querySelector<HTMLElement>('[role="application"]')!
    root.focus()
    await fireEvent.keyDown(root, { key: 'ArrowRight' })
    await vi.advanceTimersByTimeAsync(150)
    expect(container.querySelector('[aria-live]')?.textContent).toBe('Oak 40')
    await fireEvent.keyDown(root, { key: 'ArrowRight' })
    await vi.advanceTimersByTimeAsync(150)
    expect(container.querySelector('[aria-live]')?.textContent).toBe('Beech 30')
    accept = false
    await fireEvent.keyDown(root, { key: 'Home' })
    await vi.advanceTimersByTimeAsync(150)
    expect(requests).toEqual([0, 1, 0])
    expect(container.querySelector('[aria-live]')?.textContent).toBe('Beech 30')
    expect(container.querySelector('.v-charts-tooltip-item-value')?.textContent).toBe('30')
  }
  finally {
    vi.useRealTimers()
  }
})
