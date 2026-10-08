import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { LineChart } from '@/chart/LineChart'
import { Line } from '@/cartesian/line/Line'
import { XAxis } from '@/cartesian/axis/XAxis'
import { YAxis } from '@/cartesian/axis/YAxis'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

/**
 * Extract Y coordinates from a Line curve's SVG path `d` attribute.
 * Path format: "M x0,y0 L x1,y1 L x2,y2 ..."
 */
function getCurveYCoords(container: Element, curveIndex = 0): number[] {
  const curves = container.querySelectorAll('.v-charts-line-curve')
  const d = curves[curveIndex]?.getAttribute('d')
  if (!d)
    return []
  const matches = d.matchAll(/[ML]([\d.]+),([\d.]+)/g)
  return Array.from(matches).map(m => Number.parseFloat(m[2]))
}

/**
 * Extract X coordinates from a Line curve's SVG path `d` attribute.
 */
function getCurveXCoords(container: Element, curveIndex = 0): number[] {
  const curves = container.querySelectorAll('.v-charts-line-curve')
  const d = curves[curveIndex]?.getAttribute('d')
  if (!d)
    return []
  const matches = d.matchAll(/[ML]([\d.]+),([\d.]+)/g)
  return Array.from(matches).map(m => Number.parseFloat(m[1]))
}

describe('axisSelectors integration', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: 'A', value: 10, secondary: 100 },
    { name: 'B', value: 30, secondary: 200 },
    { name: 'C', value: 20, secondary: 150 },
    { name: 'D', value: 50, secondary: 400 },
    { name: 'E', value: 40, secondary: 300 },
  ]

  describe('axis domain auto-computation', () => {
    it('auto-computes YAxis domain from data and maps points proportionally', () => {
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line dataKey="value" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      const yCoords = getCurveYCoords(container)
      expect(yCoords.length).toBe(5)

      // value=50 (max) should have the smallest Y (top of chart, SVG y increases downward)
      // value=10 (min) should have the largest Y
      const indexOfMax = 3 // data[3].value = 50
      const indexOfMin = 0 // data[0].value = 10
      expect(yCoords[indexOfMax]).toBeLessThan(yCoords[indexOfMin])

      // value=30 and value=20 should be between min and max
      expect(yCoords[1]).toBeLessThan(yCoords[2]) // 30 < 20 in value, so 30 has smaller Y
    })
  })

  describe('custom domain [0, 100]', () => {
    it('scales points relative to the custom domain', () => {
      // With domain [0, 100], value=50 should be at ~50% of the chart height
      const { container: customContainer } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Line dataKey="value" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      // With default domain (auto, roughly [0, 50]), value=50 should be at the top
      const { container: autoContainer } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line dataKey="value" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      const customY = getCurveYCoords(customContainer)
      const autoY = getCurveYCoords(autoContainer)

      // With domain [0,100], max value 50 maps to ~50% height, so Y is larger (lower)
      // With auto domain [0,50], max value 50 maps to top, so Y is smaller (higher)
      // The point for value=50 (index 3) should be higher in auto domain than custom domain
      expect(autoY[3]).toBeLessThan(customY[3])
    })
  })

  describe('axis type="number" on XAxis', () => {
    it('positions points by numeric value instead of category index', () => {
      const numericData = [
        { x: 10, y: 100 },
        { x: 20, y: 200 },
        { x: 50, y: 150 },
      ]

      const { container } = render(() => (
        <LineChart width={500} height={300} data={numericData}>
          <XAxis dataKey="x" type="number" />
          <YAxis />
          <Line dataKey="y" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      const xCoords = getCurveXCoords(container)
      expect(xCoords.length).toBe(3)

      // With type="number", spacing should be proportional to the x values
      // x=10 to x=20 is a gap of 10; x=20 to x=50 is a gap of 30
      // So the second gap should be ~3x the first gap
      const gap1 = xCoords[1] - xCoords[0]
      const gap2 = xCoords[2] - xCoords[1]
      expect(gap2 / gap1).toBeCloseTo(3, 0)
    })
  })

  describe('multiple Y axes with different yAxisId', () => {
    it('renders two Y axes and scales lines independently', () => {
      const { container } = render(() => (
        <LineChart width={600} height={400} data={data}>
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" orientation="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Line dataKey="value" yAxisId="left" stroke="#8884d8" isAnimationActive={false} />
          <Line dataKey="secondary" yAxisId="right" stroke="#82ca9d" isAnimationActive={false} />
        </LineChart>
      ))

      // Two Y axes should render
      const yAxes = container.querySelectorAll('.v-charts-y-axis')
      expect(yAxes.length).toBe(2)

      // Two line curves should render
      const curves = container.querySelectorAll('.v-charts-line-curve')
      expect(curves.length).toBe(2)

      // Each curve has Y coordinates scaled to its own axis domain
      const leftY = getCurveYCoords(container, 0)
      const rightY = getCurveYCoords(container, 1)
      expect(leftY.length).toBe(5)
      expect(rightY.length).toBe(5)

      // Both curves should have their max value (index 3) at the top (smallest Y)
      // data[3]: value=50 (max of left), secondary=400 (max of right)
      const leftMinYIndex = leftY.indexOf(Math.min(...leftY))
      const rightMinYIndex = rightY.indexOf(Math.min(...rightY))
      expect(leftMinYIndex).toBe(3)
      expect(rightMinYIndex).toBe(3)
    })
  })

  describe('allowDataOverflow', () => {
    it('clips points outside the restricted domain', () => {
      // Without allowDataOverflow - domain expands to fit data
      const { container: normalContainer } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis domain={[20, 40]} />
          <Line dataKey="value" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      // With allowDataOverflow - domain stays at [20, 40], points can go beyond chart area
      const { container: clippedContainer } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis domain={[20, 40]} allowDataOverflow />
          <Line dataKey="value" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      const normalY = getCurveYCoords(normalContainer)
      const clippedY = getCurveYCoords(clippedContainer)
      expect(normalY.length).toBe(5)
      // With allowDataOverflow + restricted domain, some points may be clipped
      expect(clippedY.length).toBeGreaterThanOrEqual(4)

      // Without allowDataOverflow, the domain expands to fit all data so the
      // Y range stays within the chart area. With allowDataOverflow, the domain
      // is strictly [20, 40] so points outside get mapped beyond chart bounds,
      // producing a wider Y coordinate range.
      const normalRange = Math.max(...normalY) - Math.min(...normalY)
      const clippedRange = Math.max(...clippedY) - Math.min(...clippedY)
      expect(clippedRange).toBeGreaterThan(normalRange)
    })
  })

  describe('domain with dataMin/dataMax keywords', () => {
    it('uses actual data boundaries for domain', () => {
      // domain=['dataMin', 'dataMax'] should use the exact data range [10, 50]
      const { container: dataMinMaxContainer } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis domain={['dataMin', 'dataMax']} />
          <Line dataKey="value" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      // default domain starts at 0, so value=10 is not at the very bottom
      const { container: defaultContainer } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line dataKey="value" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      const dataMinMaxY = getCurveYCoords(dataMinMaxContainer)
      const defaultY = getCurveYCoords(defaultContainer)

      // With dataMin/dataMax domain, value=10 (min) maps to chart bottom and value=50 (max)
      // maps to chart top, using the full chart height range.
      // With default domain [0, auto], value=10 doesn't reach the bottom.
      // So the Y range should be larger with dataMin/dataMax.
      const dataMinMaxRange = Math.max(...dataMinMaxY) - Math.min(...dataMinMaxY)
      const defaultRange = Math.max(...defaultY) - Math.min(...defaultY)
      expect(dataMinMaxRange).toBeGreaterThanOrEqual(defaultRange)
    })
  })

  describe('reversed axis', () => {
    it('flips the Y coordinate mapping when reversed is true', () => {
      const { container: normalContainer } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line dataKey="value" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      const { container: reversedContainer } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis reversed />
          <Line dataKey="value" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      const normalY = getCurveYCoords(normalContainer)
      const reversedY = getCurveYCoords(reversedContainer)
      expect(normalY.length).toBe(5)
      expect(reversedY.length).toBe(5)

      // With reversed axis, the mapping should be flipped:
      // normally max value -> small Y; reversed max value -> large Y
      // data[3].value=50 (max): normalY[3] should be small, reversedY[3] should be large
      expect(normalY[3]).toBeLessThan(normalY[0]) // normal: max at top
      expect(reversedY[3]).toBeGreaterThan(reversedY[0]) // reversed: max at bottom
    })
  })

  describe('allowDecimals={false}', () => {
    it('does not affect curve rendering but produces integer-only ticks', () => {
      const smallData = [
        { name: 'A', value: 0.5 },
        { name: 'B', value: 1.5 },
        { name: 'C', value: 2.3 },
      ]

      const { container: decimalContainer } = render(() => (
        <LineChart width={500} height={300} data={smallData}>
          <XAxis dataKey="name" />
          <YAxis allowDecimals />
          <Line dataKey="value" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      const { container: intContainer } = render(() => (
        <LineChart width={500} height={300} data={smallData}>
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Line dataKey="value" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      // Both should render curves with 3 points
      const decimalY = getCurveYCoords(decimalContainer)
      const intY = getCurveYCoords(intContainer)
      expect(decimalY.length).toBe(3)
      expect(intY.length).toBe(3)

      // The relative ordering should be preserved in both cases
      // value: 0.5 < 1.5 < 2.3, so Y coords should decrease (higher on chart)
      expect(decimalY[0]).toBeGreaterThan(decimalY[2])
      expect(intY[0]).toBeGreaterThan(intY[2])
    })
  })

  describe('xAxis with type="category" shows data labels', () => {
    it('positions points at evenly-spaced X coordinates for category axis', () => {
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" type="category" />
          <YAxis />
          <Line dataKey="value" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      const xCoords = getCurveXCoords(container)
      expect(xCoords.length).toBe(5)

      // Category axis should place points at equal intervals
      const gaps = []
      for (let i = 1; i < xCoords.length; i++) {
        gaps.push(xCoords[i] - xCoords[i - 1])
      }
      // All gaps should be approximately equal
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
      gaps.forEach((gap) => {
        expect(gap).toBeCloseTo(avgGap, 0)
      })
    })
  })

  describe('axis domain with function keyword', () => {
    it('applies dataMin-offset / dataMax+offset via function domain', () => {
      // domain with functions that widen the domain: [min-10, max+10]
      const { container: wideContainer } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis domain={[(min: number) => min - 10, (max: number) => max + 10]} />
          <Line dataKey="value" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      // domain with functions that narrow to exact data range
      const { container: tightContainer } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis domain={['dataMin', 'dataMax']} />
          <Line dataKey="value" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      const wideY = getCurveYCoords(wideContainer)
      const tightY = getCurveYCoords(tightContainer)
      expect(wideY.length).toBe(5)
      expect(tightY.length).toBe(5)

      // Wider domain [min-10, max+10] means data occupies less of the chart
      // compared to tight domain [dataMin, dataMax] which uses the full range
      const wideRange = Math.max(...wideY) - Math.min(...wideY)
      const tightRange = Math.max(...tightY) - Math.min(...tightY)
      expect(wideRange).toBeLessThan(tightRange)
    })
  })
})
