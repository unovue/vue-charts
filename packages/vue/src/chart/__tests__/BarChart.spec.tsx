import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from '@/index'
import { Tooltip } from '@/components/tooltip/Tooltip'
import { getBarRectangles, getBarRects } from '@/test/helper'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { nextTick } from 'vue'

describe('barChart', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
    { name: 'Page B', uv: 300, pv: 4567, amt: 2400 },
    { name: 'Page C', uv: 300, pv: 1398, amt: 2400 },
    { name: 'Page D', uv: 200, pv: 9800, amt: 2400 },
    { name: 'Page E', uv: 278, pv: 3908, amt: 2400 },
    { name: 'Page F', uv: 189, pv: 4800, amt: 2400 },
  ]

  describe('basic rendering', () => {
    it('renders the correct number of bars', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const bars = getBarRectangles(container)
      expect(bars.length).toBe(6)
    })

    it('renders multiple Bar components with correct number of rectangles each', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
          <Bar dataKey="pv" fill="#82ca9d" isAnimationActive={false} />
        </BarChart>
      ))

      const bars = getBarRectangles(container)
      expect(bars.length).toBe(12)
    })

    it('renders empty when data is empty', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={[]}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const bars = getBarRectangles(container)
      expect(bars.length).toBe(0)
    })

    it('renders no bars when dataKey does not match the source data', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="nonexistent" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const bars = getBarRectangles(container)
      expect(bars.length).toBe(0)
    })

    it('renders correctly with a single data point', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data.slice(0, 1)}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const bars = getBarRectangles(container)
      expect(bars.length).toBe(1)
    })
  })

  describe('props', () => {
    it('applies custom fill color', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#ff0000" isAnimationActive={false} />
        </BarChart>
      ))

      const rects = getBarRects(container)
      expect(rects.length).toBe(6)
      rects.forEach((rect) => {
        expect(rect.getAttribute('fill')).toBe('#ff0000')
      })
    })

    it('renders background bars when background prop is true', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" background isAnimationActive={false} />
        </BarChart>
      ))

      const backgroundBars = container.querySelectorAll('path[fill="var(--v-charts-muted, #eee)"]')
      expect(backgroundBars.length).toBe(6)
    })

    it('hides bar when hide prop is true', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" hide isAnimationActive={false} />
        </BarChart>
      ))

      const bars = getBarRectangles(container)
      expect(bars.length).toBe(0)
    })

    it('renders bars with radius (rounded corners)', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" radius={5} isAnimationActive={false} />
        </BarChart>
      ))

      const rects = getBarRects(container)
      expect(rects.length).toBe(6)
      rects.forEach((rect) => {
        const d = rect.getAttribute('d')
        expect(d).toBeTruthy()
        // Rounded corners produce arc commands in the path
        expect(d).toContain('A ')
      })
    })

    it('renders bars with array radius', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" radius={[10, 10, 0, 0]} isAnimationActive={false} />
        </BarChart>
      ))

      const rects = getBarRects(container)
      expect(rects.length).toBe(6)
      rects.forEach((rect) => {
        const d = rect.getAttribute('d')
        expect(d).toBeTruthy()
        // Array radius with [10,10,0,0] produces arc commands for first two corners
        expect(d).toContain('A ')
      })
    })
  })

  describe('stacked bars', () => {
    it.each(['constructor', '__proto__', 'toString', 'a'])(
      'stacks stackId "%s" without prototype collisions',
      (stackId) => {
        const { container } = render(() => (
          <BarChart width={500} height={340} data={[{ name: 'A', a: 10, b: 20 }]}>
            <XAxis dataKey="name" />
            <YAxis domain={[0, 30]} />
            <Bar dataKey="a" stackId={stackId} isAnimationActive={false} />
            <Bar dataKey="b" stackId={stackId} isAnimationActive={false} />
          </BarChart>
        ))
        expect(getBarRects(container).map(rect => rect.getAttribute('height'))).toEqual(['100', '200'])
      },
    )

    // The first stacked item sits at the base unless reverseStackOrder flips the order.
    it.each([
      { reverse: false, y: ['205,100', '5,200'] },
      { reverse: true, y: ['5,100', '105,200'] },
    ])('stacks in item order with reverseStackOrder=$reverse', async ({ reverse, y }) => {
      const { container } = render(() => (
        <BarChart width={500} height={340} data={[{ name: 'A', a: 10, b: 20 }]} reverseStackOrder={reverse}>
          <XAxis dataKey="name" />
          <YAxis domain={[0, 30]} />
          <Bar dataKey="a" stackId="s" isAnimationActive={false} />
          <Bar dataKey="b" stackId="s" isAnimationActive={false} />
        </BarChart>
      ))
      await nextTick()
      expect(getBarRects(container).map(rect => [rect.getAttribute('y'), rect.getAttribute('height')].join())).toEqual(y)
    })

    it('renders stacked bars with stackId', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" stackId="a" fill="#8884d8" isAnimationActive={false} />
          <Bar dataKey="pv" stackId="a" fill="#82ca9d" isAnimationActive={false} />
        </BarChart>
      ))

      const bars = getBarRectangles(container)
      expect(bars.length).toBe(12)
    })

    it('renders stacked and unstacked bars together', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" stackId="a" fill="#8884d8" isAnimationActive={false} />
          <Bar dataKey="pv" stackId="a" fill="#82ca9d" isAnimationActive={false} />
          <Bar dataKey="amt" fill="#ffc658" isAnimationActive={false} />
        </BarChart>
      ))

      const bars = getBarRectangles(container)
      expect(bars.length).toBe(18)
    })
  })

  describe('vertical layout', () => {
    it('renders bars in vertical layout', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data} layout="vertical">
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const bars = getBarRectangles(container)
      expect(bars.length).toBe(6)
    })
  })

  describe('tooltip interaction', () => {
    it('shows tooltip on mouse enter on a bar', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
          <Tooltip />
        </BarChart>
      ))

      // Tooltip activation is driven by mousemove on the chart wrapper
      const chart = container.querySelector('.v-charts-wrapper')!
      await fireEvent(chart, new MouseEvent('mousemove', { clientX: 200, clientY: 150, bubbles: true }))
      await nextTick()
      await nextTick()

      const tooltipWrapper = document.body.querySelector('.v-charts-tooltip-wrapper')
      expect(tooltipWrapper).toBeTruthy()
    })
  })

  describe('with other components', () => {
    it('renders with CartesianGrid', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const bars = getBarRectangles(container)
      expect(bars.length).toBe(6)
      expect(container.querySelector('.v-charts-cartesian-grid')).toBeTruthy()
    })
  })
})
