import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Bar, BarChart, XAxis, YAxis } from '@/index'
import { Brush } from '@/cartesian/brush'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { getBarRects } from '@/test/helper'
import { Panorama } from '@/cartesian/brush/components/Panorama'

beforeEach(() => {
  mockGetBoundingClientRect({ width: 500, height: 300 })
})

const data = [
  { name: 'A', value: 10 },
  { name: 'B', value: 20 },
  { name: 'C', value: 30 },
  { name: 'D', value: 40 },
]

describe('brush data ownership', () => {
  it('sizes a chart inside an isolated fixed-size panorama', async () => {
    const { container } = render(() => (
      <Panorama x={10} y={20} width={400} height={60} data={data}>
        {{ default: () => <BarChart><Bar dataKey="value" isAnimationActive={false} /></BarChart> }}
      </Panorama>
    ))
    await nextTick()
    await nextTick()
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('400')
    expect(svg.getAttribute('height')).toBe('60')
    const rectangles = getBarRects(svg)
    expect(rectangles).toHaveLength(4)
    for (const rectangle of rectangles) {
      const x = Number(rectangle.getAttribute('x'))
      const y = Number(rectangle.getAttribute('y'))
      const width = Number(rectangle.getAttribute('width'))
      const height = Number(rectangle.getAttribute('height'))
      expect(x).toBeGreaterThanOrEqual(1)
      expect(y).toBeGreaterThanOrEqual(1)
      expect(width).toBeGreaterThan(0)
      expect(height).toBeGreaterThan(0)
      expect(x + width).toBeLessThanOrEqual(399)
      expect(y + height).toBeLessThanOrEqual(59)
    }
  })

  it('renders all panorama bars while the main chart uses the selected range', async () => {
    const width = ref(500)
    const values = ref(data)
    const { container } = render(() => (
      <BarChart width={width.value} height={300} data={values.value}>
        <XAxis dataKey="name" />
        <YAxis />
        <Bar dataKey="value" isAnimationActive={false} />
        <Brush range={{ startIndex: 1, endIndex: 2 }}>
          <BarChart>
            <Bar dataKey="value" isAnimationActive={false} />
          </BarChart>
        </Brush>
      </BarChart>
    ))
    await nextTick()
    await nextTick()
    const panorama = container.querySelector('.v-charts-brush svg')!
    expect(panorama.getAttribute('width')).toBe('430')
    expect(panorama.getAttribute('height')).toBe('40')
    const panoramaBars = getBarRects(panorama)
    expect(panoramaBars).toHaveLength(4)
    for (const bar of panoramaBars) {
      expect(Number(bar.getAttribute('width'))).toBeGreaterThan(0)
      expect(Number(bar.getAttribute('height'))).toBeGreaterThan(0)
    }
    expect([...container.querySelectorAll('.v-charts-bar-rectangle')]
      .filter(element => !element.closest('.v-charts-brush'))).toHaveLength(2)
    width.value = 600
    values.value = [...data, { name: 'E', value: 50 }]
    await nextTick()
    await nextTick()
    expect(panorama.getAttribute('width')).toBe('530')
    expect(getBarRects(panorama)).toHaveLength(5)
    for (const bar of getBarRects(panorama)) {
      expect(Number(bar.getAttribute('width'))).toBeGreaterThan(0)
      expect(Number(bar.getAttribute('height'))).toBeGreaterThan(0)
    }
  })

  it('updates the main chart range without narrowing a sibling chart', async () => {
    const startIndex = ref(1)
    const endIndex = ref(2)
    const { container } = render(() => (
      <div>
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="value" isAnimationActive={false} />
          <Brush range={{ startIndex: startIndex.value, endIndex: endIndex.value }} />
        </BarChart>
        <BarChart width={500} height={300} data={data}>
          <Bar dataKey="value" isAnimationActive={false} />
        </BarChart>
      </div>
    ))
    await nextTick()
    await nextTick()
    const wrappers = container.querySelectorAll('.v-charts-wrapper')
    const main = wrappers[0]
    const bars = () => [...main.querySelectorAll('.v-charts-bar-rectangle')]
      .filter(element => !element.closest('.v-charts-brush'))
    expect(bars()).toHaveLength(2)
    expect(wrappers[wrappers.length - 1].querySelectorAll('.v-charts-bar-rectangle')).toHaveLength(4)
    startIndex.value = 0
    endIndex.value = 0
    await nextTick()
    await nextTick()
    expect(bars()).toHaveLength(1)
    expect(wrappers[wrappers.length - 1].querySelectorAll('.v-charts-bar-rectangle')).toHaveLength(4)
  })
})

// Catch data invalidation resetting the start or failing to extend the uncontrolled end.
it('reconciles the Brush range when root data changes', async () => {
  const rows = ref(data)
  const { container } = render(() => (
    <BarChart width={500} height={300} data={rows.value}>
      <Bar dataKey="value" isAnimationActive={false} />
      <Brush />
    </BarChart>
  ))
  await nextTick()
  await nextTick()
  expect(getBarRects(container)).toHaveLength(4)
  rows.value = [...data, { name: 'E', value: 50 }]
  await nextTick()
  await nextTick()
  expect(getBarRects(container)).toHaveLength(5)
  rows.value = []
  await nextTick()
  await nextTick()
  expect(getBarRects(container)).toHaveLength(0)
})

const rowsOf = (length: number, offset = 0) => Array.from({ length }, (_, index) => ({ name: `R${index}`, value: index + 1 + offset }))

// D-16: an uncontrolled window survives live data by index; a controlled range is never rewritten.
it.each([
  { name: '(a) same row count, new values', start: 1, end: 1, next: [rowsOf(5, 10)], expected: [['1', '3']] },
  { name: '(b) rows added, window at the end', start: 1, end: 0, next: [rowsOf(6)], expected: [['2', '5']] },
  { name: '(c) rows added, window elsewhere', start: 1, end: 1, next: [rowsOf(6)], expected: [['1', '3']] },
  { name: '(d) rows removed, clamp then reset', start: 1, end: 0, next: [rowsOf(3), [], rowsOf(5)], expected: [['1', '2'], [], ['0', '4']] },
  { name: 'full window keeps following', start: 0, end: 0, next: [rowsOf(7)], expected: [['0', '6']] },
])('reconciles an uncontrolled Brush window: $name', async ({ start, end, next, expected }) => {
  const rows = ref(rowsOf(5))
  const { container } = render(() => (
    <BarChart width={500} height={300} data={rows.value}>
      <Bar dataKey="value" isAnimationActive={false} />
      <Brush />
    </BarChart>
  ))
  await nextTick()
  const sliders = () => [...container.querySelectorAll('[role="slider"]')]
  for (let step = 0; step < start; step++) {
    await fireEvent.focus(sliders()[0])
    await fireEvent.keyDown(sliders()[0], { key: 'ArrowRight' })
  }
  for (let step = 0; step < end; step++) {
    await fireEvent.focus(sliders()[1])
    await fireEvent.keyDown(sliders()[1], { key: 'ArrowLeft' })
  }
  await nextTick()
  for (const [index, value] of next.entries()) {
    rows.value = value
    await nextTick()
    await nextTick()
    const shown = sliders().map(slider => slider.getAttribute('aria-valuenow'))
    expect(shown).toEqual(expected[index])
    const bars = shown.length ? Number(shown[1]) - Number(shown[0]) + 1 : 0
    expect(getBarRects(container)).toHaveLength(value.length ? bars : 0)
  }
})

it.each([
  { range: { startIndex: 1, endIndex: 3 }, sliders: ['1', '3'], bars: 3 },
  { range: null, sliders: [], bars: 6 },
])('leaves a controlled range $range alone when rows are added', async ({ range, sliders, bars }) => {
  const rows = ref(rowsOf(5))
  const update = vi.fn()
  const { container } = render(() => (
    <BarChart width={500} height={300} data={rows.value}>
      <Bar dataKey="value" isAnimationActive={false} />
      <Brush range={range} {...{ 'onUpdate:range': update }} />
    </BarChart>
  ))
  await nextTick()
  rows.value = rowsOf(6)
  await nextTick()
  await nextTick()
  expect([...container.querySelectorAll('[role="slider"]')].map(slider => slider.getAttribute('aria-valuenow'))).toEqual(sliders)
  expect(getBarRects(container)).toHaveLength(bars)
  expect(update).not.toHaveBeenCalled()
})
