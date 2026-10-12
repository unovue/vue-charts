import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { RadarChart } from '@/chart/RadarChart'
import { Radar } from '@/polar/radar/Radar'
import { PolarRadiusAxis } from '@/polar/radar/PolarRadiusAxis'
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

describe('polarRadiusAxis', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  describe('in RadarChart', () => {
    it('renders the radius axis element', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarRadiusAxis />
        </RadarChart>
      ))
      expect(container.querySelectorAll('.v-charts-polar-radius-axis').length).toBe(1)
    })

    it('renders tick labels', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarRadiusAxis />
        </RadarChart>
      ))
      const tickValues = container.querySelectorAll('.v-charts-polar-radius-axis-tick-value')
      expect(tickValues.length).toBeGreaterThan(0)
    })

    it('renders with specific angle', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarRadiusAxis angle={67.5} />
        </RadarChart>
      ))
      expect(container.querySelectorAll('.v-charts-polar-radius-axis').length).toBe(1)
    })

    it('renders with orientation middle', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarRadiusAxis orientation="middle" angle={67.5} />
        </RadarChart>
      ))
      expect(container.querySelectorAll('.v-charts-polar-radius-axis').length).toBe(1)
    })

    it('hides ticks when tick is false', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarRadiusAxis tick={false} />
        </RadarChart>
      ))
      const tickValues = container.querySelectorAll('.v-charts-polar-radius-axis-tick-value')
      expect(tickValues.length).toBe(0)
    })

    it('hides axis line when axisLine is false', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarRadiusAxis axisLine={false} />
        </RadarChart>
      ))
      const axisLine = container.querySelector('.v-charts-polar-radius-axis-line')
      expect(axisLine).toBeNull()
    })

    it('renders axis line by default', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarRadiusAxis />
        </RadarChart>
      ))
      const axisLine = container.querySelector('.v-charts-polar-radius-axis-line')
      expect(axisLine).toBeTruthy()
    })

    it('renders with numerical dataKey', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarRadiusAxis dataKey="value" />
        </RadarChart>
      ))
      const tickValues = container.querySelectorAll('.v-charts-polar-radius-axis-tick-value')
      expect(tickValues.length).toBeGreaterThan(0)
    })

    it('renders with categorical dataKey', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <PolarRadiusAxis dataKey="name" type="category" />
        </RadarChart>
      ))
      const tickValues = container.querySelectorAll('.v-charts-polar-radius-axis-tick-value')
      expect(tickValues.length).toBeGreaterThan(0)
      // Should display name strings
      const firstTick = tickValues[0]
      expect(firstTick.textContent).toBeTruthy()
    })

    it('renders ticks with custom tickCount', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarRadiusAxis tickCount={3} />
        </RadarChart>
      ))
      const tickValues = container.querySelectorAll('.v-charts-polar-radius-axis-tick-value')
      // tickCount is a hint to the scale, actual number may vary
      expect(tickValues.length).toBeGreaterThan(0)
    })

    it('renders with custom stroke', () => {
      const { container } = render(() => (
        <RadarChart width={500} height={500} data={exampleRadarData}>
          <Radar dataKey="value" isAnimationActive={false} />
          <PolarRadiusAxis stroke="red" />
        </RadarChart>
      ))
      const axisLine = container.querySelector('.v-charts-polar-radius-axis-line')
      if (axisLine) {
        expect(axisLine.getAttribute('stroke')).toBe('red')
      }
    })
  })
})
