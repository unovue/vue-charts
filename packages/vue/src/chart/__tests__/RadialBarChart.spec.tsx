import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { RadialBarChart } from '@/chart/RadialBarChart'
import { RadialBar } from '@/polar/radial-bar/RadialBar'
import { useChartHeight, useChartWidth, useViewBox } from '@/context/chartLayoutContext'
import { useClipPathId } from '@/chart/provideClipPathId'

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

      // Background sectors have fill="#eee"
      const backgroundSectors = container.querySelectorAll('.v-charts-sector[fill="#eee"]')
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

  describe('class prop', () => {
    it('adds class when set on RadialBar', () => {
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
            class="test-radial-bar"
            dataKey="uv"
            isAnimationActive={false}
          />
        </RadialBarChart>
      ))

      // The v-charts-radial-bar layer should exist
      expect(container.querySelectorAll('.v-charts-radial-bar').length).toBe(1)
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

  describe('layout context', () => {
    it('provides viewBox', () => {
      const spy = vi.fn()
      const Comp = defineComponent({
        setup() {
          spy(useViewBox().value)
          return () => null
        },
      })

      render({
        components: { RadialBarChart, Comp },
        template: `
          <RadialBarChart :width="100" :height="50">
            <Comp />
          </RadialBarChart>
        `,
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenLastCalledWith({ x: 5, y: 5, width: 90, height: 40 })
    })

    it('provides clipPathId', () => {
      const spy = vi.fn()
      const Comp = defineComponent({
        setup() {
          spy(useClipPathId())
          return () => null
        },
      })

      render({
        components: { RadialBarChart, Comp },
        template: `
          <RadialBarChart :width="100" :height="50">
            <Comp />
          </RadialBarChart>
        `,
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(expect.stringMatching(/^v-charts[\w-]+-clip$/))
    })

    it('provides width', () => {
      const spy = vi.fn()
      const Comp = defineComponent({
        setup() {
          spy(useChartWidth().value)
          return () => null
        },
      })

      render({
        components: { RadialBarChart, Comp },
        template: `
          <RadialBarChart :width="100" :height="50">
            <Comp />
          </RadialBarChart>
        `,
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(100)
    })

    it('provides height', () => {
      const spy = vi.fn()
      const Comp = defineComponent({
        setup() {
          spy(useChartHeight().value)
          return () => null
        },
      })

      render({
        components: { RadialBarChart, Comp },
        template: `
          <RadialBarChart :width="100" :height="50">
            <Comp />
          </RadialBarChart>
        `,
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(50)
    })
  })
})
