import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { RadialBarChart } from '@/chart/RadialBarChart'
import { RadialBar } from '@/polar/radial-bar/RadialBar'

describe('radialBarChart', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: '18-24', uv: 31.47, pv: 2400, fill: '#8884d8' },
    { name: '25-29', uv: 26.69, pv: 4567, fill: '#83a6ed' },
    { name: '30-34', uv: 15.69, pv: 1398, fill: '#8dd1e1' },
    { name: '35-39', uv: 8.22, pv: 9800, fill: '#82ca9d' },
    { name: '40-49', uv: 8.63, pv: 3908, fill: '#a4de6c' },
    { name: '50+', uv: 2.63, pv: 4800, fill: '#d0ed57' },
    { name: 'unknown', uv: 6.67, pv: 4800, fill: '#ffc658' },
  ]

  describe('basic rendering', () => {
    it('renders sectors in simple RadialBarChart', () => {
      const { container } = render(() => (
        <RadialBarChart
          width={500}
          height={300}
          cx={150}
          cy={150}
          innerRadius={20}
          outerRadius={140}
          barSize={10}
          data={data}
        >
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(7)
    })

    it('renders no sectors when no RadialBar is added', () => {
      const { container } = render(() => (
        <RadialBarChart
          width={500}
          height={300}
          cx={150}
          cy={150}
          innerRadius={20}
          outerRadius={140}
          barSize={10}
          data={data}
        />
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(0)
    })

    it('renders no sectors when width is 0', () => {
      const { container } = render(() => (
        <RadialBarChart
          width={0}
          height={300}
          cx={150}
          cy={150}
          innerRadius={20}
          outerRadius={140}
          barSize={10}
          data={data}
        >
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(0)
    })

    it('renders no sectors when height is 0', () => {
      const { container } = render(() => (
        <RadialBarChart
          width={500}
          height={0}
          cx={150}
          cy={150}
          innerRadius={20}
          outerRadius={140}
          barSize={10}
          data={data}
        >
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(0)
    })

    it('renders sectors when barSize is not specified', () => {
      const { container } = render(() => (
        <RadialBarChart
          width={500}
          height={300}
          cx={150}
          cy={150}
          innerRadius={20}
          outerRadius={140}
          data={data}
        >
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(7)
    })

    it('renders sectors with valid path data', () => {
      const { container } = render(() => (
        <RadialBarChart
          width={500}
          height={300}
          cx={150}
          cy={150}
          innerRadius={20}
          outerRadius={140}
          barSize={10}
          data={data}
        >
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector path')
      sectors.forEach((sector) => {
        const d = sector.getAttribute('d')
        expect(d).toBeTruthy()
        // Sector paths should contain arc commands
        expect(d).toContain('A')
      })
    })
  })

  describe('background prop', () => {
    it('renders background arcs when background is true', () => {
      const { container } = render(() => (
        <RadialBarChart
          width={500}
          height={300}
          cx={150}
          cy={150}
          innerRadius={20}
          outerRadius={140}
          barSize={10}
          data={data}
        >
          <RadialBar background dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))

      // Background sectors have fill="var(--v-charts-muted, #eee)"
      const backgroundSectors = container.querySelectorAll('.v-charts-sector[fill="var(--v-charts-muted, #eee)"]')
      expect(backgroundSectors.length).toBe(7)
    })

    it('renders background with custom class', () => {
      const { container } = render(() => (
        <RadialBarChart
          width={500}
          height={300}
          cx={150}
          cy={150}
          innerRadius={20}
          outerRadius={140}
          barSize={10}
          data={data}
        >
          <RadialBar
            background={{ class: 'test-custom-background' }}
            dataKey="uv"
            isAnimationActive={false}
          />
        </RadialBarChart>
      ))

      expect(container.querySelectorAll('.test-custom-background').length).toBe(7)
    })
  })

  describe('hide prop', () => {
    it('renders no sectors when hide is true', () => {
      const { container } = render(() => (
        <RadialBarChart
          width={500}
          height={300}
          cx={150}
          cy={150}
          innerRadius={20}
          outerRadius={140}
          barSize={10}
          data={data}
        >
          <RadialBar dataKey="uv" hide isAnimationActive={false} />
        </RadialBarChart>
      ))

      expect(container.querySelectorAll('.v-charts-radial-bar').length).toBe(0)
    })
  })

  describe('stacked radial bars', () => {
    it('renders stacked sectors with stackId', () => {
      const stackData = [
        { name: 'A', desktop: 1260, mobile: 570 },
      ]
      const { container } = render(() => (
        <RadialBarChart
          width={500}
          height={300}
          cx={150}
          cy={150}
          innerRadius={80}
          outerRadius={130}
          data={stackData}
          endAngle={180}
        >
          <RadialBar dataKey="desktop" stackId="a" isAnimationActive={false} />
          <RadialBar dataKey="mobile" stackId="a" isAnimationActive={false} />
        </RadialBarChart>
      ))

      // Should have sectors from both RadialBar components
      const radialBarLayers = container.querySelectorAll('.v-charts-radial-bar')
      expect(radialBarLayers.length).toBe(2)
    })
  })

  describe('innerRadius and outerRadius', () => {
    it('renders with different innerRadius and outerRadius', () => {
      const { container } = render(() => (
        <RadialBarChart
          width={500}
          height={300}
          cx={150}
          cy={150}
          innerRadius={30}
          outerRadius={110}
          data={data}
        >
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))

      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(7)
    })
  })

  describe('empty data', () => {
    it('renders empty when data is empty', () => {
      const { container } = render(() => (
        <RadialBarChart
          width={500}
          height={300}
          cx={150}
          cy={150}
          innerRadius={20}
          outerRadius={140}
          barSize={10}
          data={[]}
        >
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))

      expect(container.querySelectorAll('.v-charts-sector').length).toBe(0)
    })
  })
})
