import { render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, beforeEach } from 'vitest'
import { RadarChart } from '@/chart/RadarChart'
import { Radar } from '@/polar/radar/Radar'
import { PolarAngleAxis } from '@/polar/radar/PolarAngleAxis'
import { PolarGrid } from '@/polar/radar/PolarGrid'
import { Animate } from '@/animation/Animate'
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

function getRadarPolygonPaths(container: Element): Element[] {
  return Array.from(container.querySelectorAll('.v-charts-radar-polygon path'))
}

describe('Radar', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  describe('basic rendering', () => {
    it('renders a polygon with data', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
        </RadarChart>
      ))
      const polygons = getRadarPolygonPaths(container)
      expect(polygons.length).toBe(1)
      const d = polygons[0].getAttribute('d')
      expect(d).toBeTruthy()
      expect(d).toContain('M')
      expect(d).toContain('Z')
    })

    it('accepts custom transition prop without errors', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar
            dataKey="value"
            isAnimationActive={false}
            transition={{ duration: 0.2, ease: 'linear' }}
          />
        </RadarChart>
      ))
      expect(getRadarPolygonPaths(container).length).toBe(1)
    })

    it('passes transition prop through to Animate', () => {
      const customTransition = { duration: 0.25, ease: 'linear' as const }
      const wrapper = mount(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" transition={customTransition} />
        </RadarChart>
      ))
      const animate = wrapper.findComponent(Animate)
      expect(animate.exists()).toBe(true)
      expect(animate.props('transition')).toEqual(customTransition)
    })

    it('renders empty when data is empty', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={[]}>
          <Radar dataKey="value" isAnimationActive={false} />
        </RadarChart>
      ))
      expect(getRadarPolygonPaths(container).length).toBe(0)
    })

    it('renders nothing when no Radar is added', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData} />
      ))
      expect(container.querySelectorAll('.v-charts-radar-polygon').length).toBe(0)
    })
  })

  describe('fill and stroke', () => {
    it('applies fill and fillOpacity', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" fill="green" fillOpacity={0.3} isAnimationActive={false} />
        </RadarChart>
      ))
      const polygons = getRadarPolygonPaths(container)
      expect(polygons.length).toBe(1)
      expect(polygons[0].getAttribute('fill')).toBe('green')
      expect(polygons[0].getAttribute('fill-opacity')).toBe('0.3')
    })

    it('applies stroke and strokeWidth', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" stroke="#8889DD" strokeWidth={3} isAnimationActive={false} />
        </RadarChart>
      ))
      const polygons = getRadarPolygonPaths(container)
      expect(polygons[0].getAttribute('stroke')).toBe('#8889DD')
      expect(polygons[0].getAttribute('stroke-width')).toBe('3')
    })
  })

  describe('multiple Radar series', () => {
    it('renders multiple polygons with different dataKeys', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" fill="green" fillOpacity={0.3} isAnimationActive={false} />
          <Radar dataKey="half" fill="blue" fillOpacity={0.6} isAnimationActive={false} />
        </RadarChart>
      ))
      const polygons = getRadarPolygonPaths(container)
      expect(polygons.length).toBe(2)
      expect(polygons[0].getAttribute('fill')).toBe('green')
      expect(polygons[0].getAttribute('fill-opacity')).toBe('0.3')
      expect(polygons[1].getAttribute('fill')).toBe('blue')
      expect(polygons[1].getAttribute('fill-opacity')).toBe('0.6')
    })
  })

  describe('dot prop', () => {
    it('renders dots when dot is true', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" dot isAnimationActive={false} />
        </RadarChart>
      ))
      const dots = container.querySelectorAll('.v-charts-radar-dots .v-charts-dot')
      expect(dots.length).toBe(8)
    })

    it('does not render dots by default', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
        </RadarChart>
      ))
      expect(container.querySelectorAll('.v-charts-radar-dots').length).toBe(0)
    })

    it('renders dots with custom props when dot is an object', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" dot={{ r: 6, fillOpacity: 1 }} isAnimationActive={false} />
        </RadarChart>
      ))
      const dots = container.querySelectorAll('.v-charts-radar-dots .v-charts-dot')
      expect(dots.length).toBe(8)
    })
  })

  describe('label prop', () => {
    it('renders labels when label is true', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" label isAnimationActive={false} />
        </RadarChart>
      ))
      expect(container.querySelectorAll('.v-charts-label').length).toBe(8)
    })
  })

  describe('hide prop', () => {
    it('renders nothing when hide is true', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" hide isAnimationActive={false} />
        </RadarChart>
      ))
      expect(container.querySelectorAll('.v-charts-radar-polygon').length).toBe(0)
    })
  })

  describe('connectNulls', () => {
    const dataWithNulls = [
      { name: 'A', value: 100 },
      { name: 'B', value: null },
      { name: 'C', value: 300 },
      { name: 'D', value: 400 },
      { name: 'E', value: 200 },
    ]

    it('renders polygon even with null values when connectNulls is true', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={dataWithNulls}>
          <Radar dataKey="value" connectNulls isAnimationActive={false} />
        </RadarChart>
      ))
      const polygons = getRadarPolygonPaths(container)
      expect(polygons.length).toBe(1)
      const d = polygons[0].getAttribute('d')
      expect(d).toBeTruthy()
      expect(d).toContain('M')
    })
  })

  describe('with PolarAngleAxis and PolarGrid', () => {
    it('renders radar with angle axis and grid', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarAngleAxis dataKey="name" />
          <PolarGrid />
        </RadarChart>
      ))
      expect(container.querySelectorAll('.v-charts-polar-grid').length).toBe(1)
      expect(container.querySelectorAll('.v-charts-polar-angle-axis').length).toBe(1)
      expect(getRadarPolygonPaths(container).length).toBe(1)
    })
  })
})
