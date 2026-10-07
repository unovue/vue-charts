import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import type { BrushStartEndIndex } from '@/index'
import { Bar, BarChart, Brush, LineChart } from '@/index'
import { Line } from '@/cartesian/line/Line'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('<Brush />', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { date: '2023-01-01', value: 10, name: 'A' },
    { date: '2023-01-02', value: 20, name: 'B' },
    { date: '2023-01-03', value: 10, name: 'C' },
    { date: '2023-01-04', value: 30, name: 'D' },
    { date: '2023-01-05', value: 50, name: 'E' },
    { date: '2023-01-06', value: 10, name: 'F' },
    { date: '2023-01-07', value: 30, name: 'G' },
    { date: '2023-01-08', value: 20, name: 'H' },
    { date: '2023-01-09', value: 10, name: 'I' },
    { date: '2023-01-10', value: 70, name: 'J' },
    { date: '2023-01-11', value: 40, name: 'K' },
    { date: '2023-01-12', value: 20, name: 'L' },
    { date: '2023-01-13', value: 10, name: 'M' },
    { date: '2023-01-14', value: 10, name: 'N' },
  ]

  describe('basic rendering', () => {
    it('announces category indexes and distinct labels for both travellers', () => {
      const { container } = render(() => (
        <BarChart width={400} height={300} data={data}>
          <Brush dataKey="name" />
        </BarChart>
      ))

      const brush = container.querySelector('.v-charts-brush')
      expect(brush).not.toBeNull()
      const travellers = [...brush!.querySelectorAll('[role="slider"]')]
      expect(travellers.map(slider => ({
        label: slider.getAttribute('aria-label'),
        min: slider.getAttribute('aria-valuemin'),
        max: slider.getAttribute('aria-valuemax'),
        value: slider.getAttribute('aria-valuenow'),
        text: slider.getAttribute('aria-valuetext'),
      }))).toEqual([
        { label: 'Range start', min: '0', max: '13', value: '0', text: 'A' },
        { label: 'Range end', min: '0', max: '13', value: '13', text: 'N' },
      ])
    })

    it('renders 2 travellers and 1 slide in simple Brush', () => {
      const { container } = render(() => (
        <BarChart width={400} height={100} data={data}>
          <Brush dataKey="value" x={100} y={50} width={400} height={40} />
        </BarChart>
      ))

      const travellers = container.querySelectorAll('.v-charts-brush-traveller')
      expect(travellers).toHaveLength(2)
      expect(container.querySelectorAll('.v-charts-brush-slide')).toHaveLength(1)
    })

    it('renders the brush container with correct dimensions', () => {
      const { container } = render(() => (
        <BarChart width={400} height={100} data={data}>
          <Brush dataKey="value" x={100} y={50} width={400} height={40} />
        </BarChart>
      ))

      const brushLayer = container.querySelector('.v-charts-brush')
      expect(brushLayer).toBeTruthy()
    })
  })

  describe('empty data', () => {
    it('does not render travellers or slide when data is empty', () => {
      const { container } = render(() => (
        <BarChart width={400} height={100} data={[]}>
          <Brush x={100} y={50} width={400} height={40} />
        </BarChart>
      ))

      expect(container.querySelectorAll('.v-charts-brush-traveller')).toHaveLength(0)
      expect(container.querySelectorAll('.v-charts-brush-slide')).toHaveLength(0)
    })
  })

  describe('height prop', () => {
    it('respects custom height', () => {
      const { container } = render(() => (
        <BarChart width={500} height={200} data={data}>
          <Brush dataKey="value" height={80} />
        </BarChart>
      ))

      // Brush should render with travellers when data is available
      const travellers = container.querySelectorAll('.v-charts-brush-traveller')
      expect(travellers).toHaveLength(2)
    })
  })

  describe('stroke and fill props', () => {
    it('applies custom stroke and fill to brush background', () => {
      const { container } = render(() => (
        <BarChart width={500} height={200} data={data}>
          <Brush dataKey="value" stroke="#8884d8" fill="#eee" />
        </BarChart>
      ))

      const brushLayer = container.querySelector('.v-charts-brush')
      expect(brushLayer).toBeTruthy()
      // The brush renders with the specified stroke/fill on its background rect
      const backgroundRect = brushLayer?.querySelector('rect')
      expect(backgroundRect).toBeTruthy()
    })
  })

  describe('with panorama (LineChart child)', () => {
    it('renders brush with a LineChart panorama child without errors', () => {
      const { container } = render(() => (
        <BarChart width={400} height={100} data={data}>
          <Brush x={90} y={40} width={300} height={50}>
            {{
              default: () => (
                <LineChart>
                  <Line dataKey="value" isAnimationActive={false} />
                </LineChart>
              ),
            }}
          </Brush>
        </BarChart>
      ))

      // Brush renders with travellers and slide
      expect(container.querySelectorAll('.v-charts-brush-traveller')).toHaveLength(2)
      expect(container.querySelectorAll('.v-charts-brush-slide')).toHaveLength(1)
    })
  })

  describe('alwaysShowText', () => {
    it('renders brush text when alwaysShowText is true', () => {
      const { container } = render(() => (
        <BarChart width={500} height={100} data={data}>
          <Brush x={100} y={50} width={400} height={40} alwaysShowText />
        </BarChart>
      ))

      expect(container.querySelectorAll('.v-charts-brush-texts')).toHaveLength(1)
    })

    it('does not render brush text by default', () => {
      const { container } = render(() => (
        <BarChart width={500} height={100} data={data}>
          <Brush x={100} y={50} width={400} height={40} />
        </BarChart>
      ))

      expect(container.querySelectorAll('.v-charts-brush-texts')).toHaveLength(0)
    })
  })

  describe('range', () => {
    it('accepts the range prop', () => {
      const { container } = render(() => (
        <BarChart width={400} height={100} data={data}>
          <Brush dataKey="value" range={{ startIndex: 2, endIndex: 8 }} />
        </BarChart>
      ))

      // Should render the brush with specified range
      const travellers = container.querySelectorAll('.v-charts-brush-traveller')
      expect(travellers).toHaveLength(2)
    })
  })
})

// Catches missing/duplicate Vue callbacks and a stale drag-end range.
it('emits the changed range and final drag range', async () => {
  const change = vi.fn()
  const end = vi.fn()
  const { container } = render(() => (
    <BarChart width={400} height={200} data={[{ value: 10 }, { value: 20 }, { value: 30 }]}>
      <Brush x={0} y={0} width={100} height={40} onChange={change} {...{ 'onDrag-end': end }} />
    </BarChart>
  ))
  const traveller = container.querySelector('.v-charts-brush-traveller')!
  await fireEvent.mouseDown(traveller, { clientX: 0 })
  await fireEvent.mouseMove(window, { clientX: 50 })
  expect(change.mock.calls).toEqual([[{ startIndex: 1, endIndex: 2 }]])
  await fireEvent.mouseUp(window)
  expect(end.mock.calls).toEqual([[{ startIndex: 1, endIndex: 2 }]])
})

// Catches an old leave timer ending a later drag or emitting a duplicate drag-end.
it('cancels pending leave timers when a drag ends', async () => {
  vi.useFakeTimers()
  try {
    const end = vi.fn()
    const { container } = render(() => (
      <BarChart width={400} height={200} data={[{ value: 10 }, { value: 20 }, { value: 30 }]}>
        <Brush x={0} y={0} width={100} height={40} leaveTimeOut={100} {...{ 'onDrag-end': end }} />
      </BarChart>
    ))
    const traveller = container.querySelector('.v-charts-brush-traveller')!
    const brush = container.querySelector('.v-charts-brush')!
    await fireEvent.mouseDown(traveller, { clientX: 0 })
    await fireEvent.mouseLeave(brush)
    await vi.advanceTimersByTimeAsync(50)
    await fireEvent.mouseLeave(brush)
    await fireEvent.mouseUp(window)
    await fireEvent.mouseDown(traveller, { clientX: 0 })
    await vi.advanceTimersByTimeAsync(100)
    expect(end.mock.calls).toEqual([[{ startIndex: 0, endIndex: 2 }]])
    await fireEvent.mouseMove(window, { clientX: 50 })
    await fireEvent.mouseUp(window)
    expect(end.mock.calls).toEqual([
      [{ startIndex: 0, endIndex: 2 }],
      [{ startIndex: 1, endIndex: 2 }],
    ])
  }
  finally {
    vi.useRealTimers()
  }
})

// Catches a rejected controlled proposal leaking into the chart range or traveller position.
it.each([true, false])('keeps brush ownership when controlled=%s', async (controlled) => {
  const range = ref<BrushStartEndIndex | undefined>(controlled ? { startIndex: 0, endIndex: 2 } : undefined)
  const update = vi.fn()
  const change = vi.fn()
  const { container } = render(() => (
    <BarChart width={400} height={200} data={[{ value: 10 }, { value: 20 }, { value: 30 }]}>
      <Bar dataKey="value" isAnimationActive={false} />
      <Brush
        x={0}
        y={0}
        width={100}
        height={40}
        range={range.value}
        onChange={change}
        {...{ 'onUpdate:range': update }}
      />
    </BarChart>
  ))
  await nextTick()
  const travellers = container.querySelectorAll('.v-charts-brush-traveller')
  const bars = () => container.querySelectorAll('.v-charts-bar-rectangle').length
  expect(bars()).toBe(3)
  await fireEvent.focus(travellers[0])
  await fireEvent.keyDown(travellers[0], { key: 'ArrowRight' })
  expect(update.mock.calls).toEqual([[{ startIndex: 1, endIndex: 2 }]])
  expect(change.mock.calls).toEqual([[{ startIndex: 1, endIndex: 2 }]])
  await nextTick()
  expect(travellers[0].getAttribute('aria-valuenow')).toBe(controlled ? '0' : '1')
  expect(bars()).toBe(controlled ? 3 : 2)
  if (controlled) {
    range.value = { startIndex: 1, endIndex: 1 }
    await nextTick()
    expect(bars()).toBe(1)
    expect(travellers[0].getAttribute('aria-valuenow')).toBe('1')
    expect(travellers[1].getAttribute('aria-valuenow')).toBe('1')
    range.value = { startIndex: 1, endIndex: 2 }
    await nextTick()
    await fireEvent.mouseDown(travellers[0], { clientX: 47.5 })
    await fireEvent.mouseMove(window, { clientX: 0 })
    await nextTick()
    expect(travellers[0].querySelector('rect')!.getAttribute('x')).toBe('47.5')
    await fireEvent.mouseUp(window)
    await nextTick()
    expect(update.mock.calls).toEqual([[{ startIndex: 1, endIndex: 2 }], [{ startIndex: 0, endIndex: 2 }]])
    expect(travellers[0].getAttribute('aria-valuenow')).toBe('1')
    expect(bars()).toBe(2)
  }
})

it('round trips the range model', async () => {
  const range = ref<BrushStartEndIndex | null>({ startIndex: 0, endIndex: 2 })
  mockGetBoundingClientRect({ width: 100, height: 100 })
  const { container } = render(() => (
    <BarChart width={100} height={100} data={[{ value: 1 }, { value: 2 }, { value: 3 }]}>
      <Bar dataKey="value" isAnimationActive={false} />
      <Brush x={0} y={0} width={100} height={40} range={range.value} {...{ 'onUpdate:range': value => range.value = value }} />
    </BarChart>
  ))
  await nextTick()
  const traveller = container.querySelectorAll('.v-charts-brush-traveller')[0]
  await fireEvent.focus(traveller)
  await fireEvent.keyDown(traveller, { key: 'ArrowRight' })
  await nextTick()
  expect(container.querySelectorAll('.v-charts-bar-rectangle')).toHaveLength(2)
  expect(traveller.getAttribute('aria-valuenow')).toBe('1')
})

it.each(['mouse slide', 'touch traveller', 'keyboard traveller'] as const)(
  'updates the selected bars through a %s interaction',
  async (interaction) => {
    mockGetBoundingClientRect({ width: 400, height: 200 })
    const change = vi.fn()
    const end = vi.fn()
    const rangeModel = ref<BrushStartEndIndex | null>({ startIndex: 1, endIndex: 3 })
    const { container } = render(() => (
      <BarChart
        width={400}
        height={200}
        data={[
          { value: 10 },
          { value: 20 },
          { value: 30 },
          { value: 40 },
          { value: 50 },
        ]}
      >
        <Bar dataKey="value" isAnimationActive={false} />
        <Brush
          x={0}
          y={0}
          width={405}
          height={40}
          range={rangeModel.value}
          {...{ 'onUpdate:range': value => rangeModel.value = value }}
          onChange={change}
          {...{ 'onDrag-end': end }}
        />
      </BarChart>
    ))
    await nextTick()
    await nextTick()
    const brush = container.querySelector('.v-charts-brush')!
    const travellers = brush.querySelectorAll('[role="slider"]')
    expect(container.querySelectorAll('.v-charts-bar-rectangle')).toHaveLength(3)
    if (interaction === 'mouse slide') {
      await fireEvent.mouseDown(brush.querySelector('.v-charts-brush-slide')!, { clientX: 200 })
      await fireEvent.mouseMove(window, { clientX: 300 })
      await fireEvent.mouseUp(window)
    }
    else if (interaction === 'touch traveller') {
      await fireEvent.touchStart(travellers[0], { changedTouches: [{ pageX: 100 }] })
      await fireEvent.touchMove(brush, { changedTouches: [{ pageX: 200 }] })
      await fireEvent.touchEnd(window)
    }
    else {
      await fireEvent.focus(travellers[0])
      await fireEvent.keyDown(travellers[0], { key: 'ArrowRight' })
    }
    await nextTick()
    await nextTick()
    const range = interaction === 'mouse slide'
      ? { startIndex: 2, endIndex: 4 }
      : { startIndex: 2, endIndex: 3 }
    expect(change.mock.calls).toEqual([[range]])
    expect([...travellers].map(slider => slider.getAttribute('aria-valuenow')))
      .toEqual(interaction === 'mouse slide' ? ['2', '4'] : ['2', '3'])
    expect(container.querySelectorAll('.v-charts-bar-rectangle'))
      .toHaveLength(interaction === 'mouse slide' ? 3 : 2)
    if (interaction !== 'keyboard traveller') {
      expect(end.mock.calls).toEqual([[range]])
      await fireEvent.mouseMove(window, { clientX: 0 })
      expect(change).toHaveBeenCalledTimes(1)
    }
  },
)

// Invalid parent ranges must select safe rows and request normalization only once.
it.each([
  { input: { startIndex: -2.8, endIndex: 3.9 }, expected: { startIndex: 0, endIndex: 3 }, values: ['0', '3'], bars: 4 },
  { input: { startIndex: 4, endIndex: 1 }, expected: { startIndex: 1, endIndex: 4 }, values: ['1', '4'], bars: 4 },
  { input: { startIndex: 8, endIndex: 12 }, expected: { startIndex: 4, endIndex: 4 }, values: ['4', '4'], bars: 1 },
  { input: { startIndex: Number.NaN, endIndex: 2 }, expected: null, values: [], bars: 5 },
  { input: { startIndex: 1, endIndex: Number.POSITIVE_INFINITY }, expected: null, values: [], bars: 5 },
  { input: { startIndex: Number.NEGATIVE_INFINITY, endIndex: 2 }, expected: null, values: [], bars: 5 },
])('normalizes $input to $expected', async ({ input, expected, values, bars }) => {
  const update = vi.fn()
  const rows = Array.from({ length: 5 }, (_, index) => ({ name: `Row ${index}`, value: index + 1 }))
  const { container } = render(() => (
    <BarChart width={400} height={200} data={rows}>
      <Bar dataKey="value" isAnimationActive={false} />
      <Brush range={input} dataKey="name" {...{ 'onUpdate:range': update }} />
    </BarChart>
  ))
  await nextTick()
  await nextTick()
  expect(update.mock.calls).toEqual([[expected]])
  expect(container.querySelectorAll('.v-charts-bar-rectangle')).toHaveLength(bars)
  const sliders = [...container.querySelectorAll('[role="slider"]')]
  expect(sliders.map(slider => slider.getAttribute('aria-valuenow'))).toEqual(values)
  expect(sliders.map(slider => slider.getAttribute('aria-valuemax'))).toEqual(values.map(() => '4'))
  expect(sliders.map(slider => slider.getAttribute('aria-valuetext'))).toEqual(values.map(value => `Row ${value}`))
  await nextTick()
  expect(update.mock.calls).toEqual([[expected]])
})

it('normalizes a rejected parent range once for each shrinking data state', async () => {
  const rows = ref(Array.from({ length: 5 }, (_, index) => ({ value: index + 1 })))
  const range = { startIndex: 3, endIndex: 4 }
  const update = vi.fn()
  const { container } = render(() => (
    <BarChart width={400} height={200} data={rows.value}>
      <Bar dataKey="value" isAnimationActive={false} />
      <Brush range={range} {...{ 'onUpdate:range': update }} />
    </BarChart>
  ))
  await nextTick()
  expect(container.querySelectorAll('.v-charts-bar-rectangle')).toHaveLength(2)
  rows.value = [{ value: 1 }]
  await nextTick()
  await nextTick()
  expect(container.querySelectorAll('.v-charts-bar-rectangle')).toHaveLength(1)
  expect([...container.querySelectorAll('[role="slider"]')].map(slider => [
    slider.getAttribute('aria-valuenow'),
    slider.getAttribute('aria-valuemax'),
  ])).toEqual([['0', '0'], ['0', '0']])
  expect(update.mock.calls).toEqual([[{ startIndex: 0, endIndex: 0 }]])
  rows.value = []
  await nextTick()
  await nextTick()
  expect(container.querySelectorAll('[role="slider"]')).toHaveLength(0)
  expect(update.mock.calls).toEqual([[{ startIndex: 0, endIndex: 0 }], [null]])
  expect(range).toEqual({ startIndex: 3, endIndex: 4 })
})

it.each([undefined, null])('restores empty data without replacing the parent choice %s', async (range) => {
  const rows = ref<{ value: number }[]>([])
  const update = vi.fn()
  const { container } = render(() => (
    <BarChart width={400} height={200} data={rows.value}>
      <Bar dataKey="value" isAnimationActive={false} />
      <Brush range={range} {...{ 'onUpdate:range': update }} />
    </BarChart>
  ))
  await nextTick()
  expect(container.querySelectorAll('[role="slider"]')).toHaveLength(0)
  rows.value = [{ value: 1 }, { value: 2 }, { value: 3 }]
  await nextTick()
  expect(container.querySelectorAll('.v-charts-bar-rectangle')).toHaveLength(3)
  expect([...container.querySelectorAll('[role="slider"]')].map(slider => slider.getAttribute('aria-valuenow')))
    .toEqual(range === null ? [] : ['0', '2'])
  rows.value = []
  await nextTick()
  await nextTick()
  expect(container.querySelectorAll('[role="slider"]')).toHaveLength(0)
  expect(update.mock.calls).toEqual(range === null ? [] : [[null]])
  rows.value = [{ value: 4 }, { value: 5 }]
  await nextTick()
  expect(container.querySelectorAll('.v-charts-bar-rectangle')).toHaveLength(2)
  expect([...container.querySelectorAll('[role="slider"]')].map(slider => slider.getAttribute('aria-valuenow')))
    .toEqual(range === null ? [] : ['0', '1'])
})

// Synchronized requests must respect a peer's parent-owned range without rebroadcast loops.
it.each([
  { accept: true, peerRows: 5, initial: { startIndex: 0, endIndex: 4 }, expected: { startIndex: 3, endIndex: 4 }, bars: [2, 2], sliders: ['3', '4'] },
  { accept: false, peerRows: 5, initial: { startIndex: 0, endIndex: 4 }, expected: { startIndex: 3, endIndex: 4 }, bars: [2, 5], sliders: ['0', '4'] },
  { accept: true, peerRows: 1, initial: null, expected: { startIndex: 0, endIndex: 0 }, bars: [2, 1], sliders: ['0', '0'] },
  { accept: false, peerRows: 1, initial: null, expected: { startIndex: 0, endIndex: 0 }, bars: [2, 1], sliders: [] },
  { accept: true, peerRows: 2, initial: null, expected: { startIndex: 1, endIndex: 1 }, bars: [2, 1], sliders: ['1', '1'] },
])('requests a safe synchronized peer range with $peerRows rows and acceptance=$accept', async ({ accept, peerRows, initial, expected, bars, sliders }) => {
  const rows = [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }]
  const peerRange = ref<BrushStartEndIndex | null>(initial)
  const update = vi.fn((range: BrushStartEndIndex | null) => {
    if (accept)
      peerRange.value = range
  })
  const { container } = render(() => (
    <div>
      <BarChart width={400} height={200} data={rows} syncId="brush-model">
        <Bar dataKey="value" isAnimationActive={false} />
        <Brush x={0} y={0} width={405} height={40} />
      </BarChart>
      <BarChart width={400} height={200} data={rows.slice(0, peerRows)} syncId="brush-model">
        <Bar dataKey="value" isAnimationActive={false} />
        <Brush range={peerRange.value} {...{ 'onUpdate:range': update }} />
      </BarChart>
    </div>
  ))
  await nextTick()
  const charts = [...container.querySelectorAll('.v-charts-wrapper')]
  await fireEvent.mouseDown(charts[0].querySelector('[role="slider"]')!, { clientX: 0 })
  await fireEvent.mouseMove(window, { clientX: 300 })
  await fireEvent.mouseUp(window)
  await nextTick()
  await nextTick()
  expect(update.mock.calls).toEqual([[expected]])
  expect(charts.map(chart => chart.querySelectorAll('.v-charts-bar-rectangle').length)).toEqual(bars)
  expect([...charts[0].querySelectorAll('[role="slider"]')].map(slider => slider.getAttribute('aria-valuenow'))).toEqual(['3', '4'])
  const peerSliders = [...charts[1].querySelectorAll('[role="slider"]')]
  expect(peerSliders.map(slider => slider.getAttribute('aria-valuenow'))).toEqual(sliders)
  expect(peerSliders.map(slider => slider.getAttribute('aria-valuemax'))).toEqual(sliders.map(() => String(peerRows - 1)))
})
