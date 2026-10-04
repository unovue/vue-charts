import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { RadarChart } from '@/chart/RadarChart'
import { Radar } from '@/polar/radar/Radar'
import { PolarAngleAxis } from '@/polar/radar/PolarAngleAxis'
import { PolarRadiusAxis } from '@/polar/radar/PolarRadiusAxis'

describe('radarSelectors', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { subject: 'Math', A: 120, B: 80 },
    { subject: 'Chinese', A: 98, B: 130 },
    { subject: 'English', A: 86, B: 130 },
    { subject: 'Geography', A: 99, B: 100 },
    { subject: 'Physics', A: 85, B: 90 },
    { subject: 'History', A: 65, B: 85 },
  ]

  function getRadarPolygonPaths(container: Element): Element[] {
    return Array.from(container.querySelectorAll('.v-charts-radar-polygon path'))
  }

  function extractPathPoints(d: string): Array<{ x: number, y: number }> {
    const points: Array<{ x: number, y: number }> = []
    const matches = d.match(/[ML]\s*([\d.eE+-]+)[,\s]+([\d.eE+-]+)/g)
    if (matches) {
      for (const cmd of matches) {
        const nums = cmd.match(/([\d.e+-]+)/gi)
        if (nums && nums.length >= 2) {
          points.push({ x: Number.parseFloat(nums[0]), y: Number.parseFloat(nums[1]) })
        }
      }
    }
    return points
  }

  it('computes radar polygon points for data', () => {
    const { container } = render(() => (
      <RadarChart width={500} height={500} data={data}>
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis />
        <Radar dataKey="A" isAnimationActive={false} />
      </RadarChart>
    ))

    const polygons = getRadarPolygonPaths(container)
    expect(polygons).toHaveLength(1)

    const d = polygons[0].getAttribute('d')
    expect(d).toBeTruthy()

    // 6 data points produce 7 vertices (6 + closing point back to start)
    const points = extractPathPoints(d!)
    expect(points).toHaveLength(7)

    // Points should form a closed polygon (path ends with Z)
    expect(d).toContain('Z')
  })

  it('renders multiple radar series independently', () => {
    const { container } = render(() => (
      <RadarChart width={500} height={500} data={data}>
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis />
        <Radar dataKey="A" fill="#8884d8" isAnimationActive={false} />
        <Radar dataKey="B" fill="#82ca9d" isAnimationActive={false} />
      </RadarChart>
    ))

    const polygons = getRadarPolygonPaths(container)
    expect(polygons).toHaveLength(2)

    const d1 = polygons[0].getAttribute('d')
    const d2 = polygons[1].getAttribute('d')
    expect(d1).toBeTruthy()
    expect(d2).toBeTruthy()

    // Both should have 7 points (6 data + closing)
    const points1 = extractPathPoints(d1!)
    const points2 = extractPathPoints(d2!)
    expect(points1).toHaveLength(7)
    expect(points2).toHaveLength(7)

    // Different dataKeys with different values should produce different polygon shapes
    const shapeDiffers = points1.some((p, i) => {
      const dx = Math.abs(p.x - points2[i].x)
      const dy = Math.abs(p.y - points2[i].y)
      return dx > 1 || dy > 1
    })
    expect(shapeDiffers).toBe(true)
  })

  it('extracts correct values with custom dataKey', () => {
    const { container } = render(() => (
      <RadarChart width={500} height={500} data={data}>
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis />
        <Radar dataKey="B" fill="#82ca9d" isAnimationActive={false} />
      </RadarChart>
    ))

    const polygons = getRadarPolygonPaths(container)
    expect(polygons).toHaveLength(1)

    const d = polygons[0].getAttribute('d')
    expect(d).toBeTruthy()

    // 6 data points + closing point
    const points = extractPathPoints(d!)
    expect(points).toHaveLength(7)
  })

  it('handles missing data points gracefully', () => {
    const sparseData = [
      { subject: 'Math', A: 120 },
      { subject: 'Chinese', A: 98 },
      { subject: 'English' }, // missing A
      { subject: 'Geography', A: 99 },
      { subject: 'Physics', A: null }, // null
      { subject: 'History', A: 65 },
    ]
    const { container } = render(() => (
      <RadarChart width={500} height={500} data={sparseData}>
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis />
        <Radar dataKey="A" isAnimationActive={false} />
      </RadarChart>
    ))

    // Should still render a polygon (missing values treated as 0 radius)
    const polygons = getRadarPolygonPaths(container)
    expect(polygons).toHaveLength(1)

    const d = polygons[0].getAttribute('d')
    expect(d).toBeTruthy()
    expect(d).toContain('Z')
  })

  it('renders dots at computed polygon vertices when dot is true', () => {
    const { container } = render(() => (
      <RadarChart width={500} height={500} data={data}>
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis />
        <Radar dataKey="A" dot isAnimationActive={false} />
      </RadarChart>
    ))

    const dots = container.querySelectorAll('.v-charts-radar-dots .v-charts-dot')
    // One dot per data point
    expect(dots).toHaveLength(6)
  })
})
