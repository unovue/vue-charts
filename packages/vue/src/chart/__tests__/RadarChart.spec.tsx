import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { RadarChart } from '@/chart/RadarChart'
import { Radar } from '@/polar/radar/Radar'
import { PolarGrid } from '@/polar/radar/PolarGrid'
import { PolarAngleAxis } from '@/polar/radar/PolarAngleAxis'
import { PolarRadiusAxis } from '@/polar/radar/PolarRadiusAxis'
import { useChartHeight, useChartWidth, useViewBox } from '@/context/chartLayoutContext'
import { useClipPathId } from '@/model/runtime'

type ExpectedRadarPolygon = {
  d: string
  fill: string | null
  fillOpacity: string | null
}

function expectRadarPolygons(container: Element, expected: ReadonlyArray<ExpectedRadarPolygon>) {
  const polygons = container.querySelectorAll('.v-charts-radar-polygon path')
  const actual = Array.from(polygons).map(p => ({
    d: p.getAttribute('d'),
    fill: p.getAttribute('fill'),
    fillOpacity: p.getAttribute('fill-opacity'),
  }))
  expect(actual).toEqual(expected)
}

function getRadarPolygonPaths(container: Element): Element[] {
  return Array.from(container.querySelectorAll('.v-charts-radar-polygon path'))
}

describe('radarChart', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

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

  describe('basic rendering', () => {
    it('renders radar polygon with data', () => {
      const { container } = render(() => (
        <RadarChart width={600} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
        </RadarChart>
      ))
      const polygons = getRadarPolygonPaths(container)
      expect(polygons.length).toBe(1)
      // Should have a valid path with M and L commands
      const d = polygons[0].getAttribute('d')
      expect(d).toBeTruthy()
      expect(d).toContain('M')
      expect(d).toContain('Z')
    })

    it('renders empty when data is empty', () => {
      const { container } = render(() => (
        <RadarChart width={600} height={500} data={[]}>
          <Radar dataKey="value" isAnimationActive={false} />
        </RadarChart>
      ))
      const polygons = getRadarPolygonPaths(container)
      expect(polygons.length).toBe(0)
    })

    it('renders nothing when no Radar is added', () => {
      const { container } = render(() => (
        <RadarChart width={600} height={500} data={exampleRadarData} />
      ))
      expect(container.querySelectorAll('.v-charts-radar-polygon').length).toBe(0)
    })
  })

  describe('multiple Radar series', () => {
    it('renders multiple polygons with different dataKeys', () => {
      const { container } = render(() => (
        <RadarChart width={600} height={500} data={exampleRadarData}>
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

  describe('polarGrid, PolarAngleAxis, PolarRadiusAxis rendering', () => {
    it('renders 1 PolarGrid, 1 PolarAngleAxis and 1 PolarRadiusAxis', () => {
      const { container } = render(() => (
        <RadarChart
          cx={300}
          cy={250}
          outerRadius={150}
          width={600}
          height={500}
          data={exampleRadarData}
        >
          <Radar dataKey="value" fill="#9597E4" fillOpacity={0.6} stroke="#8889DD" strokeWidth={3} isAnimationActive={false} />
          <PolarGrid />
          <PolarAngleAxis />
          <PolarRadiusAxis orientation="middle" angle={67.5} />
        </RadarChart>
      ))
      expect(container.querySelectorAll('.v-charts-polar-grid').length).toBe(1)
      expect(container.querySelectorAll('.v-charts-polar-angle-axis').length).toBe(1)
      expect(container.querySelectorAll('.v-charts-polar-radius-axis').length).toBe(1)
    })

    it('renders 8 angle axis ticks for 8 data points', () => {
      const { container } = render(() => (
        <RadarChart
          cx={300}
          cy={250}
          outerRadius={150}
          width={600}
          height={500}
          data={exampleRadarData}
        >
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarGrid />
          <PolarAngleAxis />
          <PolarRadiusAxis orientation="middle" angle={67.5} />
        </RadarChart>
      ))
      expect(
        container.querySelectorAll('.v-charts-polar-angle-axis .v-charts-polar-angle-axis-tick').length,
      ).toBe(8)
    })

    it('renders angle grid lines for 8 data points', () => {
      const { container } = render(() => (
        <RadarChart
          cx={300}
          cy={250}
          outerRadius={150}
          width={600}
          height={500}
          data={exampleRadarData}
        >
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarGrid />
          <PolarAngleAxis />
        </RadarChart>
      ))
      expect(
        container.querySelectorAll('.v-charts-polar-grid .v-charts-polar-grid-angle line').length,
      ).toBe(8)
    })
  })

  describe('dot prop', () => {
    it('renders 8 dots when dot is true', () => {
      const { container } = render(() => (
        <RadarChart cx={300} cy={250} outerRadius={150} width={600} height={500} data={exampleRadarData}>
          <Radar isAnimationActive={false} dot dataKey="value" />
        </RadarChart>
      ))
      const dots = container.querySelectorAll('.v-charts-radar-dots .v-charts-dot')
      expect(dots.length).toBe(8)
    })

    it('does not render dots by default', () => {
      const { container } = render(() => (
        <RadarChart cx={300} cy={250} outerRadius={150} width={600} height={500} data={exampleRadarData}>
          <Radar isAnimationActive={false} dataKey="value" />
        </RadarChart>
      ))
      expect(container.querySelectorAll('.v-charts-radar-dots').length).toBe(0)
    })
  })

  describe('label prop', () => {
    it('renders 8 labels when label is true', () => {
      const { container } = render(() => (
        <RadarChart cx={300} cy={250} outerRadius={150} width={600} height={500} data={exampleRadarData}>
          <Radar isAnimationActive={false} label dataKey="value" />
        </RadarChart>
      ))
      expect(container.querySelectorAll('.v-charts-label').length).toBe(8)
    })
  })

  describe('hide prop', () => {
    it('renders nothing when hide is true', () => {
      const { container } = render(() => (
        <RadarChart width={600} height={500} data={exampleRadarData}>
          <Radar dataKey="value" hide isAnimationActive={false} />
        </RadarChart>
      ))
      expect(container.querySelectorAll('.v-charts-radar-polygon').length).toBe(0)
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
        components: { RadarChart, Comp },
        template: `
          <RadarChart :width="100" :height="50">
            <Comp />
          </RadarChart>
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
        components: { RadarChart, Comp },
        template: `
          <RadarChart :width="100" :height="50">
            <Comp />
          </RadarChart>
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
        components: { RadarChart, Comp },
        template: `
          <RadarChart :width="100" :height="50">
            <Comp />
          </RadarChart>
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
        components: { RadarChart, Comp },
        template: `
          <RadarChart :width="100" :height="50">
            <Comp />
          </RadarChart>
        `,
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(50)
    })
  })
})
