import { render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, beforeEach } from 'vitest'
import { RadialBarChart } from '@/chart/RadialBarChart'
import { RadialBar } from '@/polar/radial-bar/RadialBar'
import { PolarGrid } from '@/polar/radar/PolarGrid'
import { Animate } from '@/animation/Animate'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const data = [
  { name: '18-24', uv: 31.47, pv: 2400, fill: '#8884d8' },
  { name: '25-29', uv: 26.69, pv: 4567, fill: '#83a6ed' },
  { name: '30-34', uv: 15.69, pv: 1398, fill: '#8dd1e1' },
  { name: '35-39', uv: 8.22, pv: 9800, fill: '#82ca9d' },
  { name: '40-49', uv: 8.63, pv: 3908, fill: '#a4de6c' },
  { name: '50+', uv: 2.63, pv: 4800, fill: '#d0ed57' },
  { name: 'unknown', uv: 6.67, pv: 4800, fill: '#ffc658' },
]

describe('RadialBar', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  describe('basic rendering', () => {
    it('renders sectors in a RadialBarChart', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(7)
    })

    it('passes transition prop through to Animate', () => {
      const customTransition = { duration: 0.3, ease: 'linear' as const }
      const wrapper = mount(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar dataKey="uv" transition={customTransition} />
        </RadialBarChart>
      ))
      const animate = wrapper.findComponent(Animate)
      expect(animate.exists()).toBe(true)
      expect(animate.props('transition')).toEqual(customTransition)
    })

    it('accepts custom transition prop', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} transition={{ duration: 0.2, ease: 'linear' }} />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-sector').length).toBe(7)
    })

    it('renders no sectors when no RadialBar is added', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data} />
      ))
      expect(container.querySelectorAll('.v-charts-sector').length).toBe(0)
    })

    it('renders no sectors when width is 0', () => {
      const { container } = render(() => (
        <RadialBarChart width={0} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-sector').length).toBe(0)
    })

    it('renders no sectors when height is 0', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={0} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-sector').length).toBe(0)
    })

    it('renders sectors when barSize is not specified', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-sector').length).toBe(7)
    })

    it('renders sectors with valid arc paths', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      const sectorPaths = container.querySelectorAll('.v-charts-sector path')
      sectorPaths.forEach((sector) => {
        const d = sector.getAttribute('d')
        expect(d).toBeTruthy()
        expect(d).toContain('A')
      })
    })
  })

  describe('background prop', () => {
    it('renders background arcs when background is true', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar background dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      const backgroundSectors = container.querySelectorAll('.v-charts-sector[fill="#eee"]')
      expect(backgroundSectors.length).toBe(7)
    })

    it('renders background with custom class', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar background={{ class: 'test-custom-background' }} dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.test-custom-background').length).toBe(7)
    })
  })

  describe('hide prop', () => {
    it('renders no sectors when hide is true', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar dataKey="uv" hide isAnimationActive={false} />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-radial-bar').length).toBe(0)
    })
  })

  describe('cornerRadius', () => {
    it('renders sectors with cornerRadius applied', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar dataKey="uv" cornerRadius={5} isAnimationActive={false} />
        </RadialBarChart>
      ))
      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(7)
    })
  })

  describe('stacking', () => {
    const stackData = [
      { name: 'A', desktop: 1260, mobile: 570 },
    ]

    it('renders stacked sectors with stackId', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={80} outerRadius={130} data={stackData} endAngle={180}>
          <RadialBar dataKey="desktop" stackId="a" isAnimationActive={false} />
          <RadialBar dataKey="mobile" stackId="a" isAnimationActive={false} />
        </RadialBarChart>
      ))
      const radialBarLayers = container.querySelectorAll('.v-charts-radial-bar')
      expect(radialBarLayers.length).toBe(2)
    })
  })

  describe('empty data', () => {
    it('renders empty when data is empty', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={[]}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-sector').length).toBe(0)
    })
  })

  describe('with PolarGrid', () => {
    it('renders sectors alongside PolarGrid', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
          <PolarGrid gridType="circle" />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-sector').length).toBe(7)
      expect(container.querySelectorAll('.v-charts-polar-grid').length).toBe(1)
    })
  })

  describe('innerRadius and outerRadius', () => {
    it('renders with different innerRadius and outerRadius', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={30} outerRadius={110} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-sector').length).toBe(7)
    })
  })
})
