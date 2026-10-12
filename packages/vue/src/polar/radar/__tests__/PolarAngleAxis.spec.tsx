import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { RadarChart } from '@/chart/RadarChart'
import { Radar } from '@/polar/radar/Radar'
import { PolarAngleAxis } from '@/polar/radar/PolarAngleAxis'
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

describe('polarAngleAxis', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  describe('in RadarChart', () => {
    it('renders the angle axis element', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarAngleAxis />
        </RadarChart>
      ))
      expect(container.querySelectorAll('.v-charts-polar-angle-axis').length).toBe(1)
    })

    it('renders 8 ticks for 8 data points', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarAngleAxis />
        </RadarChart>
      ))
      const ticks = container.querySelectorAll('.v-charts-polar-angle-axis-tick')
      expect(ticks.length).toBe(8)
    })

    it('renders tick lines by default', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarAngleAxis />
        </RadarChart>
      ))
      const tickLines = container.querySelectorAll('.v-charts-polar-angle-axis-tick-line')
      expect(tickLines.length).toBe(8)
    })

    it('hides tick lines when tickLine is false', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarAngleAxis tickLine={false} />
        </RadarChart>
      ))
      const tickLines = container.querySelectorAll('.v-charts-polar-angle-axis-tick-line')
      expect(tickLines.length).toBe(0)
    })

    it('renders tick labels with dataKey', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarAngleAxis dataKey="name" />
        </RadarChart>
      ))
      const tickValues = container.querySelectorAll('.v-charts-polar-angle-axis-tick-value')
      expect(tickValues.length).toBe(8)
      // First tick should show the name from data
      expect(tickValues[0].textContent).toBe('iPhone 3GS')
    })

    it('renders axis line by default', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarAngleAxis />
        </RadarChart>
      ))
      // Polygon axis line (default axisLineType is 'polygon')
      const axisLine = container.querySelector('.v-charts-polar-angle-axis polygon, .v-charts-polar-angle-axis circle')
      expect(axisLine).toBeTruthy()
    })

    it('renders circle axis line when axisLineType is circle', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarAngleAxis axisLineType="circle" />
        </RadarChart>
      ))
      const circle = container.querySelector('.v-charts-polar-angle-axis circle')
      expect(circle).toBeTruthy()
    })

    it('hides axis line when axisLine is false', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarAngleAxis axisLine={false} />
        </RadarChart>
      ))
      const axisLine = container.querySelector('.v-charts-polar-angle-axis polygon, .v-charts-polar-angle-axis circle')
      expect(axisLine).toBeNull()
    })

    it('hides ticks when tick is false', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarAngleAxis tick={false} />
        </RadarChart>
      ))
      const tickValues = container.querySelectorAll('.v-charts-polar-angle-axis-tick-value')
      expect(tickValues.length).toBe(0)
    })

    it('applies custom tickFormatter', () => {
      const formatter = (value: any) => `${value}!`
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarAngleAxis dataKey="name" tickFormatter={formatter} />
        </RadarChart>
      ))
      const tickValues = container.querySelectorAll('.v-charts-polar-angle-axis-tick-value')
      expect(tickValues[0].textContent).toBe('iPhone 3GS!')
    })

    it('renders custom tick via slot', () => {
      const { container } = render({
        components: { RadarChart, Radar, PolarAngleAxis },
        template: `
          <RadarChart :width="500" :height="500" :data="data">
            <Radar dataKey="value" :isAnimationActive="false" />
            <PolarAngleAxis dataKey="name">
              <template #tick="{ x, y, value }">
                <text :x="x" :y="y" class="custom-tick">{{ value }}</text>
              </template>
            </PolarAngleAxis>
          </RadarChart>
        `,
        setup() {
          return { data: exampleRadarData }
        },
      })
      const customTicks = container.querySelectorAll('.custom-tick')
      expect(customTicks.length).toBe(8)
      expect(customTicks[0].textContent).toBe('iPhone 3GS')
    })
  })
})
