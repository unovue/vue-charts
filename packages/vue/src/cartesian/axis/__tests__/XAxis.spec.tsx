import { render } from '@testing-library/vue'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

function getXAxisTicks(container: Element): NodeListOf<Element> {
  return container.querySelectorAll('.v-charts-x-axis .v-charts-cartesian-axis-tick')
}

function getXAxisTickTexts(container: Element): string[] {
  const ticks = getXAxisTicks(container)
  return Array.from(ticks).map(tick => tick.textContent ?? '')
}

describe('xAxis', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 30, height: 16 })
  })

  const data = [
    { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
    { name: 'Page B', uv: 300, pv: 4567, amt: 2400 },
    { name: 'Page C', uv: 300, pv: 1398, amt: 2400 },
    { name: 'Page D', uv: 200, pv: 9800, amt: 2400 },
    { name: 'Page E', uv: 278, pv: 3908, amt: 2400 },
    { name: 'Page F', uv: 189, pv: 4800, amt: 2400 },
  ]

  describe('rendering tick labels', () => {
    it('renders tick labels from data when dataKey is specified', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      await nextTick()
      await nextTick()
      const ticks = getXAxisTicks(container)
      expect(ticks.length).toBe(6)

      const tickTexts = getXAxisTickTexts(container)
      expect(tickTexts).toEqual(['Page A', 'Page B', 'Page C', 'Page D', 'Page E', 'Page F'])
    })

    it('renders numeric index ticks when no dataKey is specified', async () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data}>
          <XAxis />
          <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      await nextTick()
      await nextTick()
      const ticks = getXAxisTicks(container)
      expect(ticks.length).toBeGreaterThan(0)

      const tickTexts = getXAxisTickTexts(container)
      // When no dataKey, ticks should be numeric indices
      tickTexts.forEach((text) => {
        expect(Number(text)).not.toBeNaN()
      })
    })

    it('renders no ticks when data is empty', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={[]}>
          <XAxis dataKey="name" />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const ticks = getXAxisTicks(container)
      expect(ticks.length).toBe(0)
    })
  })

  describe('hide prop', () => {
    it('does not render x-axis when hide is true', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data}>
          <XAxis dataKey="name" hide />
          <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      const xAxisElements = container.querySelectorAll('.v-charts-x-axis')
      expect(xAxisElements.length).toBe(0)
    })

    it('renders x-axis when hide is false (default)', () => {
      const { container } = render(() => (
        <LineChart width={400} height={400} data={data}>
          <XAxis dataKey="name" />
          <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      const xAxisElements = container.querySelectorAll('.v-charts-x-axis')
      expect(xAxisElements.length).toBe(1)
    })
  })

  describe('dataKey prop', () => {
    it('uses dataKey to determine tick labels', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      await nextTick()
      await nextTick()
      const tickTexts = getXAxisTickTexts(container)
      expect(tickTexts).toContain('Page A')
      expect(tickTexts).toContain('Page F')
    })
  })

  describe('tickLine and axisLine', () => {
    it('renders tick lines by default', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      await nextTick()
      await nextTick()
      const tickLines = container.querySelectorAll('.v-charts-x-axis .v-charts-cartesian-axis-tick-line')
      expect(tickLines.length).toBeGreaterThan(0)
    })

    it('hides tick lines when tickLine is false', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" tickLine={false} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const tickLines = container.querySelectorAll('.v-charts-x-axis .v-charts-cartesian-axis-tick-line')
      expect(tickLines.length).toBe(0)
    })

    it('renders axis line by default', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const axisLine = container.querySelector('.v-charts-x-axis .v-charts-cartesian-axis-line')
      expect(axisLine).toBeTruthy()
    })

    it('hides axis line when axisLine is false', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" axisLine={false} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const axisLine = container.querySelector('.v-charts-x-axis .v-charts-cartesian-axis-line')
      expect(axisLine).toBeFalsy()
    })

    it('applies kebab-case SVG attributes from axisLine object to the line element', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" axisLine={{ 'stroke': 'blue', 'stroke-width': '3' }} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const axisLine = container.querySelector('.v-charts-x-axis .v-charts-cartesian-axis-line')
      expect(axisLine).toBeTruthy()
      expect(axisLine?.getAttribute('stroke')).toBe('blue')
      expect(axisLine?.getAttribute('stroke-width')).toBe('3')
    })
  })

  describe('orientation prop', () => {
    it('renders at the bottom by default', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const xAxis = container.querySelector('.v-charts-x-axis')
      expect(xAxis).toBeTruthy()
      const transform = xAxis?.getAttribute('transform')
      if (transform) {
        const match = transform.match(/translate\([\d.]+,\s*([\d.]+)\)/)
        if (match) {
          const yTranslate = Number.parseFloat(match[1])
          expect(yTranslate).toBeGreaterThan(100)
        }
      }
    })

    it('renders at the top when orientation is top', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" orientation="top" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const xAxis = container.querySelector('.v-charts-x-axis')
      expect(xAxis).toBeTruthy()
      const transform = xAxis?.getAttribute('transform')
      if (transform) {
        const match = transform.match(/translate\([\d.]+,\s*([\d.]+)\)/)
        if (match) {
          const yTranslate = Number.parseFloat(match[1])
          expect(yTranslate).toBeLessThan(100)
        }
      }
    })
  })

  describe('with LineChart', () => {
    it('renders tick labels in a LineChart', async () => {
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" interval={0} />
          <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      await nextTick()
      await nextTick()
      const tickTexts = getXAxisTickTexts(container)
      expect(tickTexts.length).toBe(6)
      expect(tickTexts).toEqual(['Page A', 'Page B', 'Page C', 'Page D', 'Page E', 'Page F'])
    })
  })

  describe('style prop', () => {
    it('applies custom style to xAxis element', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" style={{ opacity: '0.5' }} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const xAxis = container.querySelector('.v-charts-x-axis') as HTMLElement | null
      expect(xAxis).toBeTruthy()
      expect(xAxis!.style.opacity).toBe('0.5')
    })
  })
})
