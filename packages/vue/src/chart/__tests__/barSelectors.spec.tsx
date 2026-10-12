import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { BarChart } from '@/chart/BarChart'
import { Bar } from '@/cartesian/bar/Bar'
import { XAxis } from '@/cartesian/axis/XAxis'
import { YAxis } from '@/cartesian/axis/YAxis'
import { getBarRects } from '@/test/helper'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

/**
 * Extract numeric attributes from a bar rect path element.
 * Rectangle renders <path x={x} y={y} width={w} height={h} d="...">.
 */
function getBarDimensions(rect: Element) {
  return {
    x: Number.parseFloat(rect.getAttribute('x') ?? '0'),
    y: Number.parseFloat(rect.getAttribute('y') ?? '0'),
    width: Number.parseFloat(rect.getAttribute('width') ?? '0'),
    height: Number.parseFloat(rect.getAttribute('height') ?? '0'),
  }
}

describe('barSelectors integration', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: 'A', uv: 400, pv: 2400 },
    { name: 'B', uv: 300, pv: 4567 },
    { name: 'C', uv: 300, pv: 1398 },
    { name: 'D', uv: 200, pv: 9800 },
  ]

  describe('bar positioning for simple data', () => {
    it('renders bars with increasing x positions and equal widths', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const rects = getBarRects(container)
      expect(rects).toHaveLength(4)

      const dims = rects.map(getBarDimensions)

      // Bars should be distributed left to right with increasing x
      for (let i = 1; i < dims.length; i++) {
        expect(dims[i].x).toBeGreaterThan(dims[i - 1].x)
      }

      // All bars in a single series should have the same width
      const firstWidth = dims[0].width
      expect(firstWidth).toBeGreaterThan(0)
      dims.forEach(d => expect(d.width).toBeCloseTo(firstWidth, 1))
    })

    it('renders taller bars for larger values', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const rects = getBarRects(container)
      const dims = rects.map(getBarDimensions)

      // data[0].uv=400 (max), data[3].uv=200 (min) — larger value = taller bar (larger abs height)
      expect(Math.abs(dims[0].height)).toBeGreaterThan(Math.abs(dims[3].height))

      // data[1].uv=300 and data[2].uv=300 — same value, same height
      expect(Math.abs(dims[1].height)).toBeCloseTo(Math.abs(dims[2].height), 1)
    })
  })

  describe('stacked bars', () => {
    it('stacked bars share the same x position and width at each data index', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" stackId="a" fill="#8884d8" isAnimationActive={false} />
          <Bar dataKey="pv" stackId="a" fill="#82ca9d" isAnimationActive={false} />
        </BarChart>
      ))

      const rects = getBarRects(container)
      expect(rects).toHaveLength(8)

      // First 4 = uv (bottom of stack), next 4 = pv (top of stack)
      for (let i = 0; i < 4; i++) {
        const uvDims = getBarDimensions(rects[i])
        const pvDims = getBarDimensions(rects[i + 4])

        // Stacked bars at the same index share the same x position and width
        expect(pvDims.x).toBeCloseTo(uvDims.x, 1)
        expect(pvDims.width).toBeCloseTo(uvDims.width, 1)
      }
    })

    it('stacked pv bar is shorter than the full-height uv bar in the stack', () => {
      const stackedData = [
        { name: 'A', uv: 200, pv: 200 },
      ]

      const { container } = render(() => (
        <BarChart width={500} height={300} data={stackedData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" stackId="a" fill="#8884d8" isAnimationActive={false} />
          <Bar dataKey="pv" stackId="a" fill="#82ca9d" isAnimationActive={false} />
        </BarChart>
      ))

      const rects = getBarRects(container)
      expect(rects).toHaveLength(2)

      const uvDims = getBarDimensions(rects[0])
      const pvDims = getBarDimensions(rects[1])

      // Both stacked bars have positive absolute height
      expect(Math.abs(uvDims.height)).toBeGreaterThan(0)
      expect(Math.abs(pvDims.height)).toBeGreaterThan(0)

      // The pv bar (top of stack) should start at the same y as the uv bar
      expect(pvDims.y).toBeCloseTo(uvDims.y, 1)

      // The uv bar (bottom of stack) extends to the baseline, so it is taller.
      // The pv bar only covers the upper portion of the stack.
      // With equal values (uv=pv=200), pv height should be roughly half of uv height.
      expect(Math.abs(pvDims.height)).toBeCloseTo(Math.abs(uvDims.height) / 2, 0)
    })
  })

  describe('multiple bars side by side', () => {
    it('bars without stackId render at different x positions within each category', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
          <Bar dataKey="pv" fill="#82ca9d" isAnimationActive={false} />
        </BarChart>
      ))

      const rects = getBarRects(container)
      expect(rects).toHaveLength(8)

      // For each data point, the two bars should be at different x positions (side by side)
      for (let i = 0; i < 4; i++) {
        const uvDims = getBarDimensions(rects[i])
        const pvDims = getBarDimensions(rects[i + 4])

        // Side-by-side bars must have different x positions
        expect(uvDims.x).not.toBeCloseTo(pvDims.x, 0)
        // Both should have positive width
        expect(uvDims.width).toBeGreaterThan(0)
        expect(pvDims.width).toBeGreaterThan(0)
      }
    })
  })

  describe('custom barSize', () => {
    it('renders bars with specified barSize width', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" barSize={20} isAnimationActive={false} />
        </BarChart>
      ))

      const rects = getBarRects(container)
      expect(rects).toHaveLength(4)

      rects.forEach((rect) => {
        const dims = getBarDimensions(rect)
        expect(dims.width).toBeCloseTo(20, 0)
      })
    })
  })

  describe('maxBarSize', () => {
    it('limits bar width to maxBarSize', () => {
      const singleData = [{ name: 'A', uv: 400 }]
      const maxSize = 40

      const { container: limitedContainer } = render(() => (
        <BarChart width={500} height={300} data={singleData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" maxBarSize={maxSize} isAnimationActive={false} />
        </BarChart>
      ))

      const { container: unlimitedContainer } = render(() => (
        <BarChart width={500} height={300} data={singleData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const limitedWidth = getBarDimensions(getBarRects(limitedContainer)[0]).width
      const unlimitedWidth = getBarDimensions(getBarRects(unlimitedContainer)[0]).width

      // maxBarSize should constrain the bar to be narrower than default
      expect(limitedWidth).toBeLessThanOrEqual(maxSize)
      expect(limitedWidth).toBeLessThan(unlimitedWidth)
    })
  })

  describe('negative values', () => {
    it('renders bars below baseline for negative values', () => {
      const negData = [
        { name: 'A', uv: 400 },
        { name: 'B', uv: -300 },
        { name: 'C', uv: 200 },
        { name: 'D', uv: -100 },
      ]

      const { container } = render(() => (
        <BarChart width={500} height={300} data={negData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const rects = getBarRects(container)
      expect(rects).toHaveLength(4)

      const dims = rects.map(getBarDimensions)

      // Positive bars have positive height, negative bars have negative height
      expect(dims[0].height).toBeGreaterThan(0) // uv=400, positive
      expect(dims[1].height).toBeLessThan(0) // uv=-300, negative

      // All bars share the same zero baseline: y + height converges to the same value
      // For positive bars: y is at the top, y+height is at the baseline
      // For negative bars: y is below the baseline, y+height is at the baseline
      const baseline0 = dims[0].y + dims[0].height
      const baseline1 = dims[1].y + dims[1].height
      const baseline2 = dims[2].y + dims[2].height
      const baseline3 = dims[3].y + dims[3].height
      expect(baseline0).toBeCloseTo(baseline1, 1)
      expect(baseline1).toBeCloseTo(baseline2, 1)
      expect(baseline2).toBeCloseTo(baseline3, 1)
    })
  })

  describe('custom fill colors', () => {
    it('applies different fill colors to different Bar series', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#ff0000" isAnimationActive={false} />
          <Bar dataKey="pv" fill="#00ff00" isAnimationActive={false} />
        </BarChart>
      ))

      const rects = getBarRects(container)
      expect(rects).toHaveLength(8)

      // First 4 bars (uv series) should have red fill
      for (let i = 0; i < 4; i++) {
        expect(rects[i].getAttribute('fill')).toBe('#ff0000')
      }
      // Next 4 bars (pv series) should have green fill
      for (let i = 4; i < 8; i++) {
        expect(rects[i].getAttribute('fill')).toBe('#00ff00')
      }
    })
  })

  describe('bar-level barSize with different values', () => {
    it('different barSize values produce different bar widths', () => {
      const { container: narrow } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" barSize={10} isAnimationActive={false} />
        </BarChart>
      ))

      const { container: wide } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" barSize={50} isAnimationActive={false} />
        </BarChart>
      ))

      const narrowWidth = getBarDimensions(getBarRects(narrow)[0]).width
      const wideWidth = getBarDimensions(getBarRects(wide)[0]).width

      expect(narrowWidth).toBeCloseTo(10, 0)
      expect(wideWidth).toBeCloseTo(50, 0)
      expect(narrowWidth).toBeLessThan(wideWidth)
    })
  })
})
