import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

function getHorizontalLines(container: Element): NodeListOf<Element> {
  return container.querySelectorAll('.v-charts-cartesian-grid-horizontal line')
}

function getVerticalLines(container: Element): NodeListOf<Element> {
  return container.querySelectorAll('.v-charts-cartesian-grid-vertical line')
}

describe('cartesianGrid', () => {
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

  describe('rendering inside BarChart', () => {
    it('renders horizontal and vertical grid lines', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const grid = container.querySelector('.v-charts-cartesian-grid')
      expect(grid).toBeTruthy()

      const hLines = getHorizontalLines(container)
      expect(hLines.length).toBeGreaterThan(0)

      const vLines = getVerticalLines(container)
      expect(vLines.length).toBeGreaterThan(0)
    })

    it('horizontal lines have matching y1 and y2', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const hLines = getHorizontalLines(container)
      hLines.forEach((line) => {
        expect(line.getAttribute('y1')).toEqual(line.getAttribute('y2'))
      })
    })

    it('vertical lines have matching x1 and x2', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const vLines = getVerticalLines(container)
      vLines.forEach((line) => {
        expect(line.getAttribute('x1')).toEqual(line.getAttribute('x2'))
      })
    })
  })

  describe('horizontal prop', () => {
    it('hides horizontal lines when horizontal is false', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid horizontal={false} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const hLines = getHorizontalLines(container)
      expect(hLines.length).toBe(0)

      // vertical lines should still exist
      const vLines = getVerticalLines(container)
      expect(vLines.length).toBeGreaterThan(0)
    })
  })

  describe('vertical prop', () => {
    it('hides vertical lines when vertical is false', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid vertical={false} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const vLines = getVerticalLines(container)
      expect(vLines.length).toBe(0)

      // horizontal lines should still exist
      const hLines = getHorizontalLines(container)
      expect(hLines.length).toBeGreaterThan(0)
    })
  })

  describe('stroke and strokeDasharray', () => {
    it('applies stroke prop to grid lines', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid stroke="#ff0000" />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const hLines = getHorizontalLines(container)
      expect(hLines.length).toBeGreaterThan(0)
      hLines.forEach((line) => {
        expect(line.getAttribute('stroke')).toBe('#ff0000')
      })

      const vLines = getVerticalLines(container)
      vLines.forEach((line) => {
        expect(line.getAttribute('stroke')).toBe('#ff0000')
      })
    })

    it('applies stroke-dasharray prop to grid lines', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid stroke-dasharray="3 3" />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const hLines = getHorizontalLines(container)
      expect(hLines.length).toBeGreaterThan(0)
      hLines.forEach((line) => {
        expect(line.getAttribute('stroke-dasharray')).toBe('3 3')
      })

      const vLines = getVerticalLines(container)
      vLines.forEach((line) => {
        expect(line.getAttribute('stroke-dasharray')).toBe('3 3')
      })
    })
  })

  describe('rendering inside LineChart', () => {
    it('keeps grid geometry off lines while preserving user stroke attributes', () => {
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid stroke="#123456" stroke-dasharray="3 3" stroke-opacity={0.5} />
          <Line dataKey="uv" isAnimationActive={false} />
        </LineChart>
      ))

      expect(getHorizontalLines(container).length).toBeGreaterThan(0)
      expect(getVerticalLines(container).length).toBeGreaterThan(0)
      container.querySelectorAll('.v-charts-cartesian-grid line').forEach((line) => {
        for (const attribute of ['x', 'y', 'width', 'height', 'offset']) {
          expect(line.hasAttribute(attribute), attribute).toBe(false)
        }
        expect(line.getAttribute('stroke')).toBe('#123456')
        expect(line.getAttribute('stroke-dasharray')).toBe('3 3')
        expect(line.getAttribute('stroke-opacity')).toBe('0.5')
      })
    })

    it('renders grid lines inside a LineChart', () => {
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid />
          <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      const grid = container.querySelector('.v-charts-cartesian-grid')
      expect(grid).toBeTruthy()

      const hLines = getHorizontalLines(container)
      expect(hLines.length).toBeGreaterThan(0)

      const vLines = getVerticalLines(container)
      expect(vLines.length).toBeGreaterThan(0)
    })
  })

  describe('rendering inside AreaChart', () => {
    it('renders grid lines inside an AreaChart', () => {
      const { container } = render(() => (
        <AreaChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid />
          <Area type="monotone" dataKey="uv" stroke="#ff7300" fill="#ff7300" isAnimationActive={false} />
        </AreaChart>
      ))

      const grid = container.querySelector('.v-charts-cartesian-grid')
      expect(grid).toBeTruthy()

      const hLines = getHorizontalLines(container)
      expect(hLines.length).toBeGreaterThan(0)

      const vLines = getVerticalLines(container)
      expect(vLines.length).toBeGreaterThan(0)
    })
  })

  describe('both horizontal and vertical false', () => {
    it('renders no grid lines when both are false', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid horizontal={false} vertical={false} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const hLines = getHorizontalLines(container)
      expect(hLines.length).toBe(0)

      const vLines = getVerticalLines(container)
      expect(vLines.length).toBe(0)
    })
  })

  describe('with explicit horizontalPoints and verticalPoints', () => {
    it('renders the exact number of lines matching the points arrays', () => {
      const horizontalPoints = [10, 50, 100, 200]
      const verticalPoints = [20, 80, 160]

      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <CartesianGrid
            horizontalPoints={horizontalPoints}
            verticalPoints={verticalPoints}
          />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const hLines = getHorizontalLines(container)
      expect(hLines.length).toBe(horizontalPoints.length)

      const vLines = getVerticalLines(container)
      expect(vLines.length).toBe(verticalPoints.length)

      // verify y coordinates of horizontal lines
      horizontalPoints.forEach((point, i) => {
        expect(hLines[i].getAttribute('y1')).toBe(String(point))
        expect(hLines[i].getAttribute('y2')).toBe(String(point))
      })

      // verify x coordinates of vertical lines
      verticalPoints.forEach((point, i) => {
        expect(vLines[i].getAttribute('x1')).toBe(String(point))
        expect(vLines[i].getAttribute('x2')).toBe(String(point))
      })
    })
  })
})
