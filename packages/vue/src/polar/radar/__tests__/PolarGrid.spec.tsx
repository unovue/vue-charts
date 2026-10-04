import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { RadarChart } from '@/chart/RadarChart'
import { Radar } from '@/polar/radar/Radar'
import { PolarGrid } from '@/polar/radar/PolarGrid'
import { PolarAngleAxis } from '@/polar/radar/PolarAngleAxis'
import { RadialBarChart } from '@/chart/RadialBarChart'
import { RadialBar } from '@/polar/radial-bar/RadialBar'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const exampleRadarData = [
  { name: 'iPhone 3GS', value: 420, half: 210 },
  { name: 'iPhone 4', value: 460, half: 230 },
  { name: 'iPhone 4s', value: 999, half: 500 },
  { name: 'iPhone 5', value: 500, half: 250 },
  { name: 'iPhone 5s', value: 864, half: 432 },
  { name: 'iPhone 6', value: 650, half: 325 },
  { name: 'iPhone 6s', value: 765, half: 383 },
  { name: 'iPhone 5se', value: 365, half: 183 },
]

describe('polarGrid', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  describe('in RadarChart', () => {
    it('renders the polar grid element', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarGrid />
        </RadarChart>
      ))
      expect(container.querySelectorAll('.v-charts-polar-grid').length).toBe(1)
    })

    it('renders concentric polygon shapes by default', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarGrid />
        </RadarChart>
      ))
      const concentricGroup = container.querySelector('.v-charts-polar-grid-concentric')
      expect(concentricGroup).toBeTruthy()
      // Should have concentric path elements (polygons)
      const paths = concentricGroup!.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })

    it('renders radial angle lines for each data point', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarGrid />
          <PolarAngleAxis />
        </RadarChart>
      ))
      const lines = container.querySelectorAll('.v-charts-polar-grid-angle line')
      expect(lines.length).toBe(8)
    })

    it('renders circles when gridType is "circle"', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarGrid gridType="circle" />
        </RadarChart>
      ))
      const circles = container.querySelectorAll('.v-charts-polar-grid-concentric circle')
      expect(circles.length).toBeGreaterThan(0)
      // No polygon paths when gridType is circle
      const paths = container.querySelectorAll('.v-charts-polar-grid-concentric path')
      expect(paths.length).toBe(0)
    })

    it('hides radial lines when radialLines is false', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarGrid radialLines={false} />
          <PolarAngleAxis />
        </RadarChart>
      ))
      const angleLines = container.querySelectorAll('.v-charts-polar-grid-angle line')
      expect(angleLines.length).toBe(0)
    })

    it('renders fill background when fill is provided', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarGrid fill="red" />
        </RadarChart>
      ))
      // With fill, there should be a background shape plus the concentric grid shapes
      const concentricGroup = container.querySelector('.v-charts-polar-grid-concentric')
      expect(concentricGroup).toBeTruthy()
      const allShapes = concentricGroup!.querySelectorAll('path, circle')
      // Background + concentric shapes
      expect(allShapes.length).toBeGreaterThan(0)
    })

    it('renders circle fill background when fill is provided with circle gridType', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarGrid gridType="circle" fill="blue" />
        </RadarChart>
      ))
      const concentricGroup = container.querySelector('.v-charts-polar-grid-concentric')
      expect(concentricGroup).toBeTruthy()
      const circles = concentricGroup!.querySelectorAll('circle')
      // Background circle + concentric circles
      expect(circles.length).toBeGreaterThan(0)
    })

    it('renders with custom stroke color', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarGrid stroke="#ff0000" />
        </RadarChart>
      ))
      expect(container.querySelectorAll('.v-charts-polar-grid').length).toBe(1)
    })
  })

  describe('in RadialBarChart', () => {
    const radialData = [
      { name: 'A', uv: 31.47, fill: '#8884d8' },
      { name: 'B', uv: 26.69, fill: '#83a6ed' },
      { name: 'C', uv: 15.69, fill: '#8dd1e1' },
    ]

    it('renders polar grid in RadialBarChart', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} data={radialData}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
          <PolarGrid gridType="circle" />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-polar-grid').length).toBe(1)
    })
  })
})
