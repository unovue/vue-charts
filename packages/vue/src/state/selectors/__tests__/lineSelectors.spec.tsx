import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { LineChart } from '@/chart/LineChart'
import { Line } from '@/cartesian/line/Line'
import { XAxis } from '@/cartesian/axis/XAxis'
import { YAxis } from '@/cartesian/axis/YAxis'
import { assertNotNull } from '@/test/helper'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('lineSelectors', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: 'A', uv: 400, pv: 2400 },
    { name: 'B', uv: 300, pv: 4567 },
    { name: 'C', uv: 300, pv: 1398 },
    { name: 'D', uv: 200, pv: 9800 },
    { name: 'E', uv: 278, pv: 3908 },
    { name: 'F', uv: 189, pv: 4800 },
  ]

  function getLineCurves(container: Element): NodeListOf<Element> {
    return container.querySelectorAll('.v-charts-line .v-charts-line-curve')
  }

  function parseCurvePoints(d: string): Array<{ x: number, y: number }> {
    // Extract all coordinate pairs from path M/L commands
    const points: Array<{ x: number, y: number }> = []
    const moveAndLine = d.match(/[ML]\s*([\d.eE+-]+)[,\s]+([\d.eE+-]+)/g)
    if (moveAndLine) {
      for (const cmd of moveAndLine) {
        const nums = cmd.match(/([\d.e+-]+)/gi)
        if (nums && nums.length >= 2) {
          points.push({ x: Number.parseFloat(nums[0]), y: Number.parseFloat(nums[1]) })
        }
      }
    }
    return points
  }

  it('computes line points correctly for simple data', () => {
    const { container } = render(() => (
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis dataKey="name" />
        <YAxis />
        <Line type="linear" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
      </LineChart>
    ))

    const curves = getLineCurves(container)
    expect(curves).toHaveLength(1)

    const d = curves[0].getAttribute('d')
    assertNotNull(d)
    // Linear type produces M and L commands with no C (cubic bezier)
    expect(d).toContain('M')
    expect(d).toContain('L')
    expect(d).not.toContain('C')

    // With 6 data points we should have 6 coordinate pairs (1 M + 5 L)
    const points = parseCurvePoints(d)
    expect(points).toHaveLength(6)

    // Points should be ordered left-to-right (increasing x)
    for (let i = 1; i < points.length; i++) {
      expect(points[i].x).toBeGreaterThan(points[i - 1].x)
    }
  })

  it('uses item-level data when Line has its own data prop', () => {
    const customData = [
      { name: 'X', uv: 100 },
      { name: 'Y', uv: 200 },
      { name: 'Z', uv: 150 },
    ]
    const { container } = render(() => (
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis dataKey="name" />
        <YAxis />
        <Line type="linear" dataKey="uv" data={customData} stroke="#ff7300" isAnimationActive={false} />
      </LineChart>
    ))

    const curves = getLineCurves(container)
    expect(curves).toHaveLength(1)

    const d = curves[0].getAttribute('d')
    assertNotNull(d)
    // With 3 custom data points we should see 3 coordinate pairs, not 6
    const points = parseCurvePoints(d)
    expect(points).toHaveLength(3)
  })

  it('renders multiple lines with different dataKeys independently', () => {
    const { container } = render(() => (
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis dataKey="name" />
        <YAxis />
        <Line type="linear" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        <Line type="linear" dataKey="pv" stroke="#387908" isAnimationActive={false} />
      </LineChart>
    ))

    const curves = getLineCurves(container)
    expect(curves).toHaveLength(2)

    const d1 = curves[0].getAttribute('d')
    const d2 = curves[1].getAttribute('d')
    assertNotNull(d1)
    assertNotNull(d2)

    // Both curves should have 6 points
    const points1 = parseCurvePoints(d1)
    const points2 = parseCurvePoints(d2)
    expect(points1).toHaveLength(6)
    expect(points2).toHaveLength(6)

    // X coordinates should be the same (same category axis), but Y should differ
    for (let i = 0; i < 6; i++) {
      expect(points1[i].x).toBeCloseTo(points2[i].x, 0)
    }

    // uv and pv have different values so at least some Y coordinates must differ
    const yDiffers = points1.some((p, i) => Math.abs(p.y - points2[i].y) > 1)
    expect(yDiffers).toBe(true)
  })

  it('responds to data slice by rendering fewer points', () => {
    const slicedData = data.slice(1, 4) // 3 entries: B, C, D
    const { container } = render(() => (
      <LineChart width={400} height={400} data={slicedData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis dataKey="name" />
        <YAxis />
        <Line type="linear" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
      </LineChart>
    ))

    const curves = getLineCurves(container)
    expect(curves).toHaveLength(1)

    const d = curves[0].getAttribute('d')
    assertNotNull(d)
    const points = parseCurvePoints(d)
    expect(points).toHaveLength(3)
  })

  it('renders no curve when dataKey yields only null/undefined values', () => {
    const nullData = [
      { name: 'A', uv: null },
      { name: 'B', uv: undefined },
      { name: 'C', uv: null },
    ]
    const { container } = render(() => (
      <LineChart width={400} height={400} data={nullData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis dataKey="name" />
        <YAxis />
        <Line type="linear" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
      </LineChart>
    ))

    const curves = getLineCurves(container)
    // No valid points means no rendered curve
    expect(curves).toHaveLength(0)
  })
})
