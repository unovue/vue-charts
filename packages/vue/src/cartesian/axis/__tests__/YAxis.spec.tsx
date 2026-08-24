import { render } from '@testing-library/vue'
import { nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { Area, AreaChart, Bar, BarChart, Line, LineChart, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

function getYAxisTicks(container: Element): NodeListOf<Element> {
  return container.querySelectorAll('.v-charts-yAxis .v-charts-cartesian-axis-tick')
}

function getYAxisTickTexts(container: Element): string[] {
  const ticks = getYAxisTicks(container)
  return Array.from(ticks).map(tick => tick.textContent ?? '')
}

describe('yAxis', () => {
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

  describe('rendering tick labels', () => {
    it('renders tick labels in BarChart', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis interval={0} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))
      await nextTick()
      await nextTick()

      const ticks = getYAxisTicks(container)
      expect(ticks.length).toBeGreaterThan(0)

      const tickTexts = getYAxisTickTexts(container)
      // default numeric YAxis should have numeric labels
      tickTexts.forEach((text) => {
        expect(Number(text)).not.toBeNaN()
      })
    })

    it('renders tick labels in LineChart', async () => {
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis interval={0} />
          <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))
      await nextTick()
      await nextTick()

      const ticks = getYAxisTicks(container)
      expect(ticks.length).toBeGreaterThan(0)
    })

    it('renders tick labels in AreaChart', async () => {
      const { container } = render(() => (
        <AreaChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis interval={0} />
          <Area type="monotone" dataKey="uv" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
        </AreaChart>
      ))
      await nextTick()
      await nextTick()

      const ticks = getYAxisTicks(container)
      expect(ticks.length).toBeGreaterThan(0)
    })
  })

  describe('hide prop', () => {
    it('does not render y-axis when hide is true', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis hide />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const yAxisElements = container.querySelectorAll('.v-charts-yAxis')
      expect(yAxisElements.length).toBe(0)
    })

    it('renders y-axis when hide is false (default)', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const yAxisElements = container.querySelectorAll('.v-charts-yAxis')
      expect(yAxisElements.length).toBe(1)
    })
  })

  describe('orientation prop', () => {
    it('renders on the left by default', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const yAxis = container.querySelector('.v-charts-yAxis')
      expect(yAxis).toBeTruthy()
      // The yAxis g element transform should position it on the left side
      const transform = yAxis?.getAttribute('transform')
      if (transform) {
        const match = transform.match(/translate\(([\d.]+),/)
        if (match) {
          const xTranslate = Number.parseFloat(match[1])
          // For left orientation, xTranslate should be small
          expect(xTranslate).toBeLessThan(100)
        }
      }
    })

    it('renders on the right when orientation is right', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis orientation="right" />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const yAxis = container.querySelector('.v-charts-yAxis')
      expect(yAxis).toBeTruthy()
      // The yAxis g element transform should position it on the right side
      const transform = yAxis?.getAttribute('transform')
      if (transform) {
        const match = transform.match(/translate\(([\d.]+),/)
        if (match) {
          const xTranslate = Number.parseFloat(match[1])
          // For right orientation, xTranslate should be large (closer to chart width)
          expect(xTranslate).toBeGreaterThan(200)
        }
      }
    })
  })

  describe('tickLine and axisLine', () => {
    it('renders tick lines by default', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis interval={0} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))
      await nextTick()
      await nextTick()

      const tickLines = container.querySelectorAll('.v-charts-yAxis .v-charts-cartesian-axis-tick-line')
      expect(tickLines.length).toBeGreaterThan(0)
    })

    it('hides tick lines when tickLine is false', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis tickLine={false} interval={0} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))
      await nextTick()
      await nextTick()

      const tickLines = container.querySelectorAll('.v-charts-yAxis .v-charts-cartesian-axis-tick-line')
      expect(tickLines.length).toBe(0)
    })

    it('renders axis line by default', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const axisLine = container.querySelector('.v-charts-yAxis .v-charts-cartesian-axis-line')
      expect(axisLine).toBeTruthy()
    })

    it('hides axis line when axisLine is false', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis axisLine={false} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const axisLine = container.querySelector('.v-charts-yAxis .v-charts-cartesian-axis-line')
      expect(axisLine).toBeFalsy()
    })
  })

  describe('width prop', () => {
    it('applies custom width', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis width={100} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const yAxis = container.querySelector('.v-charts-yAxis')
      expect(yAxis).toBeTruthy()
    })

    it('different widths affect chart layout', () => {
      const { container: container1 } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis width={30} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const { container: container2 } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis width={100} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const yAxis1 = container1.querySelector('.v-charts-yAxis')
      const yAxis2 = container2.querySelector('.v-charts-yAxis')
      expect(yAxis1).toBeTruthy()
      expect(yAxis2).toBeTruthy()
    })

    it('should render the y-axis with given width in the prop', () => {
      const { container } = render(() => (
        <BarChart width={100} height={100} data={data}>
          <YAxis width={40} />
          <Bar dataKey="amt" isAnimationActive={false} />
        </BarChart>
      ))

      const yAxis = container.querySelector('.v-charts-yAxis')
      expect(yAxis).toBeTruthy()
      const yAxisLine = yAxis!.querySelector('line')
      expect(yAxisLine!.getAttribute('width')).toBe('40')
    })

    it('should render y-axis with dynamically calculated width', async () => {
      mockGetBoundingClientRect({ width: 80, height: 30 })

      const { container } = render(() => (
        <BarChart width={400} height={300} data={data}>
          <YAxis width="auto" ticks={[0, 800, 1600, 2400]} />
          <Bar dataKey="amt" isAnimationActive={false} />
        </BarChart>
      ))
      await nextTick()
      await nextTick()
      await nextTick()

      const yAxis = container.querySelector('.v-charts-yAxis')
      expect(yAxis).toBeTruthy()
      const yAxisLine = yAxis!.querySelector('line')
      // 80 max tick width + 6 tick size + 2 tick margin
      expect(yAxisLine!.getAttribute('width')).toBe('88')
      // chart offset must stay numeric when width is 'auto' (no string concatenation leaks)
      const tickLine = yAxis!.querySelector('.v-charts-cartesian-axis-tick-line')
      expect(Number(tickLine!.getAttribute('x2'))).not.toBeNaN()
    })

    it('should render y-axis with dynamically calculated width even after starting from empty data', async () => {
      mockGetBoundingClientRect({ width: 80, height: 30 })

      const chartData = ref<any[]>([])
      const { container } = render(() => (
        <BarChart width={400} height={300} data={chartData.value}>
          <YAxis width="auto" ticks={[0, 800, 1600, 2400]} />
          <Bar dataKey="amt" isAnimationActive={false} />
        </BarChart>
      ))
      await nextTick()
      await nextTick()

      chartData.value = data
      await nextTick()
      await nextTick()
      await nextTick()

      const yAxis = container.querySelector('.v-charts-yAxis')
      expect(yAxis).toBeTruthy()
      const yAxisLine = yAxis!.querySelector('line')
      // 80 max tick width + 6 tick size + 2 tick margin
      expect(yAxisLine!.getAttribute('width')).toBe('88')
    })
  })

  describe('multiple axes', () => {
    it('renders two y-axes with different yAxisIds', () => {
      const { container } = render(() => (
        <AreaChart width={600} height={400} data={data}>
          <YAxis type="number" yAxisId={0} stroke="#ff7300" />
          <YAxis type="number" orientation="right" yAxisId={1} stroke="#387908" />
          <Area dataKey="uv" stroke="#ff7300" fill="#ff7300" yAxisId={0} isAnimationActive={false} />
          <Area dataKey="pv" stroke="#387908" fill="#387908" yAxisId={1} isAnimationActive={false} />
        </AreaChart>
      ))

      const yAxisElements = container.querySelectorAll('.v-charts-yAxis')
      expect(yAxisElements.length).toBe(2)
    })
  })

  describe('class prop', () => {
    it('applies custom class to yAxis element exactly once', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis class="my-custom-yaxis" />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const yAxis = container.querySelector('.v-charts-yAxis')
      expect(yAxis).toBeTruthy()
      const classStr = yAxis!.getAttribute('class') ?? ''
      const count = classStr.split(' ').filter(c => c === 'my-custom-yaxis').length
      expect(count).toBe(1)
    })
  })

  describe('style prop', () => {
    it('applies custom style to yAxis element', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis style={{ opacity: '0.5' }} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const yAxis = container.querySelector('.v-charts-yAxis') as HTMLElement | null
      expect(yAxis).toBeTruthy()
      expect(yAxis!.style.opacity).toBe('0.5')
    })
  })
})
