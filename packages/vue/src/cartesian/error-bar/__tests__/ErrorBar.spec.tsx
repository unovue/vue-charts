import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { Bar, BarChart, ErrorBar, Scatter, ScatterChart, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

type ExpectedErrorBarLine = {
  x1: string
  x2: string
  y1: string
  y2: string
}

function getErrorBarLines(container: HTMLElement): ExpectedErrorBarLine[] {
  const lines = container.querySelectorAll('.v-charts-error-bar line')
  return Array.from(lines).map(line => ({
    x1: line.getAttribute('x1') ?? '',
    x2: line.getAttribute('x2') ?? '',
    y1: line.getAttribute('y1') ?? '',
    y2: line.getAttribute('y2') ?? '',
  }))
}

describe('<ErrorBar />', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const dataWithError = [
    { name: 'food', uv: 2000, pv: 2013, time: 1, uvError: [100, 50], pvError: [110, 20] },
    { name: 'cosmetic', uv: 3300, pv: 2000, time: 2, uvError: [120, 140], pvError: 50 },
    { name: 'storage', uv: 3200, pv: 1398, time: 3, uvError: [120, 80], pvError: [200, 100] },
    { name: 'digital', uv: 2800, pv: 2800, time: 4, uvError: [100, 200], pvError: 30 },
  ]

  describe('in BarChart', () => {
    it('renders error bar lines in a simple Bar', () => {
      const { container } = render(() => (
        <BarChart data={dataWithError} width={500} height={500}>
          <Bar isAnimationActive={false} dataKey="uv">
            {{
              default: () => <ErrorBar dataKey="uvError" />,
            }}
          </Bar>
        </BarChart>
      ))

      const errorBarsContainer = container.querySelectorAll('.v-charts-error-bars')
      expect(errorBarsContainer.length).toBeGreaterThanOrEqual(1)

      const errorBarGroups = container.querySelectorAll('.v-charts-error-bar')
      // 4 data points => 4 error bar groups
      expect(errorBarGroups).toHaveLength(4)

      // Each error bar group has 3 lines (top cap, main bar, bottom cap)
      const allLines = container.querySelectorAll('.v-charts-error-bar line')
      expect(allLines).toHaveLength(12)
    })

    it('renders error bars with correct stroke and strokeWidth', () => {
      const { container } = render(() => (
        <BarChart data={dataWithError} width={500} height={500}>
          <Bar isAnimationActive={false} dataKey="uv">
            {{
              default: () => <ErrorBar dataKey="uvError" stroke="red" strokeWidth={2} />,
            }}
          </Bar>
        </BarChart>
      ))

      const lines = container.querySelectorAll('.v-charts-error-bar line')
      expect(lines.length).toBeGreaterThan(0)
      lines.forEach((line) => {
        expect(line.getAttribute('stroke')).toBe('red')
        expect(line.getAttribute('stroke-width')).toBe('2')
      })
    })

    it('renders error bars with custom cap width', () => {
      const capWidth = 10
      const { container } = render(() => (
        <BarChart data={dataWithError} width={500} height={500}>
          <Bar isAnimationActive={false} dataKey="uv">
            {{
              default: () => <ErrorBar dataKey="uvError" width={capWidth} />,
            }}
          </Bar>
        </BarChart>
      ))

      const lines = getErrorBarLines(container)
      expect(lines.length).toBe(12)

      // For y-direction error bars, cap lines have x2 - x1 = 2 * width
      // Cap lines are the 1st and 3rd lines in each group of 3
      for (let i = 0; i < lines.length; i += 3) {
        const capLine = lines[i]
        const capWidth_actual = Math.abs(Number.parseFloat(capLine.x2) - Number.parseFloat(capLine.x1))
        expect(capWidth_actual).toBeCloseTo(capWidth * 2, 0)
      }
    })

    it('handles asymmetric errors (array [low, high])', () => {
      const { container } = render(() => (
        <BarChart data={dataWithError} width={500} height={500}>
          <Bar isAnimationActive={false} dataKey="uv">
            {{
              default: () => <ErrorBar dataKey="uvError" />,
            }}
          </Bar>
        </BarChart>
      ))

      // uvError for first item is [100, 50] (asymmetric)
      const lines = getErrorBarLines(container)
      expect(lines).toHaveLength(12)

      // The main bar (2nd line in each group) should have different distances for low/high
      // For asymmetric errors, the y1 and y2 of the main bar line are different distances from center
      const mainBar = lines[1]
      expect(mainBar.x1).toBe(mainBar.x2) // vertical line for y-direction
    })

    it('handles symmetric errors (number value)', () => {
      const symmetricData = [
        { name: 'A', uv: 100, uvError: 20 },
        { name: 'B', uv: 200, uvError: 30 },
      ]

      const { container } = render(() => (
        <BarChart data={symmetricData} width={500} height={500}>
          <Bar isAnimationActive={false} dataKey="uv">
            {{
              default: () => <ErrorBar dataKey="uvError" />,
            }}
          </Bar>
        </BarChart>
      ))

      const errorBarGroups = container.querySelectorAll('.v-charts-error-bar')
      expect(errorBarGroups).toHaveLength(2)

      // For symmetric errors, the main bar should be centered
      const lines = getErrorBarLines(container)
      expect(lines).toHaveLength(6)
    })
  })

  describe('multiple error bars', () => {
    it('renders multiple error bars on the same Bar', () => {
      const { container } = render(() => (
        <BarChart data={dataWithError} width={500} height={500}>
          <Bar isAnimationActive={false} dataKey="uv">
            {{
              default: () => (
                <>
                  <ErrorBar dataKey="uvError" />
                  <ErrorBar dataKey="pvError" />
                </>
              ),
            }}
          </Bar>
        </BarChart>
      ))

      // Two ErrorBar containers (one per ErrorBar component)
      const errorBarsContainers = container.querySelectorAll('.v-charts-error-bars')
      expect(errorBarsContainers).toHaveLength(2)

      // Each should have 4 data points worth of error bar groups
      const errorBarGroups = container.querySelectorAll('.v-charts-error-bar')
      expect(errorBarGroups).toHaveLength(8)
    })
  })

  describe('in ScatterChart', () => {
    const scatterData = [
      { x: 100, y: 200, errorY: 30 },
      { x: 120, y: 100, errorY: 20 },
      { x: 170, y: 300, errorY: 40 },
    ]

    it('renders error bars in Scatter', () => {
      const { container } = render(() => (
        <ScatterChart width={500} height={500}>
          <XAxis dataKey="x" type="number" />
          <YAxis dataKey="y" type="number" />
          <Scatter data={scatterData} fill="#ff7300" isAnimationActive={false}>
            {{
              default: () => <ErrorBar dataKey="errorY" direction="y" />,
            }}
          </Scatter>
        </ScatterChart>
      ))

      const errorBarGroups = container.querySelectorAll('.v-charts-error-bar')
      expect(errorBarGroups).toHaveLength(3)

      const lines = container.querySelectorAll('.v-charts-error-bar line')
      expect(lines).toHaveLength(9)
    })
  })
})
