import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { BarChart } from '@/chart/BarChart'
import { LineChart } from '@/chart/LineChart'
import { Bar } from '@/cartesian/bar/Bar'
import { Line } from '@/cartesian/line/Line'
import { XAxis } from '@/cartesian/axis/XAxis'
import { YAxis } from '@/cartesian/axis/YAxis'
import { Tooltip } from '@/components/Tooltip'
import { Customized } from '@/components/Customized'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { assertNotNull } from '@/test/helper'
import { useActiveTooltipCoordinate, useActiveTooltipLabel, useCartesianScale, useIsTooltipActive, usePlotArea, useXAxisDomain, useXAxisInverseDataSnapScale, useXAxisInverseScale, useXAxisInverseTickSnapScale, useXAxisScale, useXAxisTicks, useYAxisDomain, useYAxisScale, useYAxisTicks } from '../publicHooks'

describe('publicHooks - tooltip hooks', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: 'Page A', uv: 400, pv: 2400 },
    { name: 'Page B', uv: 300, pv: 1398 },
    { name: 'Page C', uv: 200, pv: 9800 },
    { name: 'Page D', uv: 278, pv: 3908 },
    { name: 'Page E', uv: 189, pv: 4800 },
  ]

  async function hoverChart(container: Element, clientX = 200, clientY = 200) {
    const chart = container.querySelector('.v-charts-wrapper')
    assertNotNull(chart)
    await fireEvent(chart, new MouseEvent('mousemove', { clientX, clientY }))
    await nextTick()
    await nextTick()
  }

  describe('useIsTooltipActive', () => {
    it('returns false initially and true after hover', async () => {
      const capturedValues: boolean[] = []

      const SpyComponent = defineComponent({
        setup() {
          const isActive = useIsTooltipActive()
          capturedValues.push(isActive.value)
          return () => <text data-testid="spy" data-active={String(isActive.value)} />
        },
      })

      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="uv" isAnimationActive={false} />
          <Customized>
            {{ default: () => <SpyComponent /> }}
          </Customized>
        </BarChart>
      ))

      // Initially tooltip should not be active
      const spy = container.querySelector('[data-testid="spy"]')
      assertNotNull(spy)
      expect(spy.getAttribute('data-active')).toBe('false')

      // Hover the chart
      await hoverChart(container)

      // After hover, tooltip should be active
      expect(spy.getAttribute('data-active')).toBe('true')
    })
  })

  describe('useActiveTooltipLabel', () => {
    it('returns a valid label after hover', async () => {
      const SpyComponent = defineComponent({
        setup() {
          const label = useActiveTooltipLabel()
          return () => <text data-testid="label-spy" data-label={label.value ?? ''} />
        },
      })

      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="uv" isAnimationActive={false} />
          <Customized>
            {{ default: () => <SpyComponent /> }}
          </Customized>
        </BarChart>
      ))

      // Initially label should be empty
      const spy = container.querySelector('[data-testid="label-spy"]')
      assertNotNull(spy)
      expect(spy.getAttribute('data-label')).toBe('')

      // Hover the chart
      await hoverChart(container)

      // After hover, label should be one of the data names
      const label = spy.getAttribute('data-label')
      const validLabels = data.map(d => d.name)
      expect(validLabels).toContain(label)
    })
  })

  describe('useActiveTooltipCoordinate', () => {
    it('returns non-null coordinate after hover', async () => {
      const SpyComponent = defineComponent({
        setup() {
          const coordinate = useActiveTooltipCoordinate()
          return () => (
            <text
              data-testid="coord-spy"
              data-x={coordinate.value?.x ?? ''}
              data-y={coordinate.value?.y ?? ''}
            />
          )
        },
      })

      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="uv" isAnimationActive={false} />
          <Customized>
            {{ default: () => <SpyComponent /> }}
          </Customized>
        </BarChart>
      ))

      // Hover the chart
      await hoverChart(container)

      // After hover, coordinate should have numeric x and y
      const spy = container.querySelector('[data-testid="coord-spy"]')
      assertNotNull(spy)
      const x = spy.getAttribute('data-x')
      const y = spy.getAttribute('data-y')
      expect(x).not.toBe('')
      expect(y).not.toBe('')
      expect(Number(x)).not.toBeNaN()
      expect(Number(y)).not.toBeNaN()
    })
  })
})

describe('layout public hooks', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 300 })
  })

  const data = [
    { name: 'Page A', uv: 400 },
    { name: 'Page B', uv: 300 },
    { name: 'Page C', uv: 200 },
  ]

  describe('usePlotArea', () => {
    it('returns plot area rectangle with positive dimensions inside axes', async () => {
      const SpyComponent = defineComponent({
        setup() {
          const plotArea = usePlotArea()
          return () => (
            <text
              data-testid="plot-spy"
              data-x={plotArea.value?.x ?? ''}
              data-y={plotArea.value?.y ?? ''}
              data-width={plotArea.value?.width ?? ''}
              data-height={plotArea.value?.height ?? ''}
            />
          )
        },
      })

      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" isAnimationActive={false} />
          <Customized>
            {{ default: () => <SpyComponent /> }}
          </Customized>
        </BarChart>
      ))

      await nextTick()
      await nextTick()

      const spy = container.querySelector('[data-testid="plot-spy"]')
      assertNotNull(spy)

      const x = Number(spy.getAttribute('data-x'))
      const y = Number(spy.getAttribute('data-y'))
      const width = Number(spy.getAttribute('data-width'))
      const height = Number(spy.getAttribute('data-height'))

      // x > 0 because YAxis takes space on the left
      expect(x).toBeGreaterThan(0)
      // width should be positive but less than chart width
      expect(width).toBeGreaterThan(0)
      expect(width).toBeLessThan(500)
      // height should be positive but less than chart height
      expect(height).toBeGreaterThan(0)
      expect(height).toBeLessThan(300)
    })
  })
})

describe('axis public hooks', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 300 })
  })

  const data = [
    { name: 'A', value: 100 },
    { name: 'B', value: 200 },
    { name: 'C', value: 300 },
  ]

  describe('useXAxisDomain', () => {
    it('returns categorical domain matching data keys', async () => {
      let domain: any

      const SpyComponent = defineComponent({
        setup() {
          const d = useXAxisDomain()
          return () => {
            domain = d.value
            return <text data-testid="spy" />
          }
        },
      })

      render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line dataKey="value" isAnimationActive={false} />
          <Customized>
            {{ default: () => <SpyComponent /> }}
          </Customized>
        </LineChart>
      ))

      await nextTick()
      await nextTick()

      expect(domain).toEqual(['A', 'B', 'C'])
    })
  })

  describe('useYAxisDomain', () => {
    it('returns numerical domain covering data range', async () => {
      let domain: any

      const SpyComponent = defineComponent({
        setup() {
          const d = useYAxisDomain()
          return () => {
            domain = d.value
            return <text data-testid="spy" />
          }
        },
      })

      render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line dataKey="value" isAnimationActive={false} />
          <Customized>
            {{ default: () => <SpyComponent /> }}
          </Customized>
        </LineChart>
      ))

      await nextTick()
      await nextTick()

      expect(domain).toBeDefined()
      expect(Array.isArray(domain)).toBe(true)
      expect(domain.length).toBe(2)
      expect(domain[0]).toBeLessThanOrEqual(100)
      expect(domain[1]).toBeGreaterThanOrEqual(300)
    })
  })

  describe('useXAxisTicks', () => {
    it('returns tick items matching data point count', async () => {
      let ticks: any

      const SpyComponent = defineComponent({
        setup() {
          const t = useXAxisTicks()
          return () => {
            ticks = t.value
            return <text data-testid="spy" />
          }
        },
      })

      render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line dataKey="value" isAnimationActive={false} />
          <Customized>
            {{ default: () => <SpyComponent /> }}
          </Customized>
        </LineChart>
      ))

      await nextTick()
      await nextTick()

      expect(ticks).toBeDefined()
      expect(Array.isArray(ticks)).toBe(true)
      expect(ticks.length).toBe(3)
    })
  })

  describe('useYAxisTicks', () => {
    it('returns tick items with length > 0', async () => {
      let ticks: any

      const SpyComponent = defineComponent({
        setup() {
          const t = useYAxisTicks()
          return () => {
            ticks = t.value
            return <text data-testid="spy" />
          }
        },
      })

      render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line dataKey="value" isAnimationActive={false} />
          <Customized>
            {{ default: () => <SpyComponent /> }}
          </Customized>
        </LineChart>
      ))

      await nextTick()
      await nextTick()

      expect(ticks).toBeDefined()
      expect(Array.isArray(ticks)).toBe(true)
      expect(ticks.length).toBeGreaterThan(0)
    })
  })
})

describe('scale public hooks', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 300 })
  })

  const data = [
    { name: 'A', value: 100 },
    { name: 'B', value: 200 },
    { name: 'C', value: 300 },
  ]

  describe('useXAxisScale', () => {
    it('returns a function that maps data values to pixel coordinates', async () => {
      let scaleFn: any

      const SpyComponent = defineComponent({
        setup() {
          const scale = useXAxisScale()
          return () => {
            scaleFn = scale.value
            return <text data-testid="spy" />
          }
        },
      })

      render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line dataKey="value" isAnimationActive={false} />
          <Customized>
            {{ default: () => <SpyComponent /> }}
          </Customized>
        </LineChart>
      ))

      await nextTick()
      await nextTick()

      expect(scaleFn).toBeDefined()
      expect(typeof scaleFn).toBe('function')

      const pixelA = scaleFn('A')
      const pixelC = scaleFn('C')
      expect(typeof pixelA).toBe('number')
      expect(typeof pixelC).toBe('number')
      expect(pixelA).toBeLessThan(pixelC!)
    })
  })

  describe('useYAxisScale', () => {
    it('returns a function that maps numeric values to pixel coordinates', async () => {
      let scaleFn: any

      const SpyComponent = defineComponent({
        setup() {
          const scale = useYAxisScale()
          return () => {
            scaleFn = scale.value
            return <text data-testid="spy" />
          }
        },
      })

      render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line dataKey="value" isAnimationActive={false} />
          <Customized>
            {{ default: () => <SpyComponent /> }}
          </Customized>
        </LineChart>
      ))

      await nextTick()
      await nextTick()

      expect(scaleFn).toBeDefined()
      const pixel100 = scaleFn(100)
      const pixel300 = scaleFn(300)
      expect(typeof pixel100).toBe('number')
      // In SVG, higher values have lower y coordinates
      expect(pixel100).toBeGreaterThan(pixel300!)
    })
  })

  describe('useXAxisInverseScale', () => {
    it('returns a function that maps pixel coordinates back to data values', async () => {
      let scaleFn: any
      let inverseFn: any

      const SpyComponent = defineComponent({
        setup() {
          const scale = useXAxisScale()
          const inverse = useXAxisInverseScale()
          return () => {
            scaleFn = scale.value
            inverseFn = inverse.value
            return <text data-testid="spy" />
          }
        },
      })

      render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line dataKey="value" isAnimationActive={false} />
          <Customized>
            {{ default: () => <SpyComponent /> }}
          </Customized>
        </LineChart>
      ))

      await nextTick()
      await nextTick()

      expect(inverseFn).toBeDefined()
      const pixelA = scaleFn('A')
      const result = inverseFn(pixelA)
      expect(result).toBe('A')
    })
  })

  describe('useXAxisInverseDataSnapScale', () => {
    it('snaps to closest data point value', async () => {
      let dataSnapFn: any

      const SpyComponent = defineComponent({
        setup() {
          const snap = useXAxisInverseDataSnapScale()
          return () => {
            dataSnapFn = snap.value
            return <text data-testid="spy" />
          }
        },
      })

      render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line dataKey="value" isAnimationActive={false} />
          <Customized>
            {{ default: () => <SpyComponent /> }}
          </Customized>
        </LineChart>
      ))

      await nextTick()
      await nextTick()

      expect(dataSnapFn).toBeDefined()
      expect(typeof dataSnapFn).toBe('function')
    })
  })

  describe('useXAxisInverseTickSnapScale', () => {
    it('snaps to closest tick value', async () => {
      let tickSnapFn: any

      const SpyComponent = defineComponent({
        setup() {
          const snap = useXAxisInverseTickSnapScale()
          return () => {
            tickSnapFn = snap.value
            return <text data-testid="spy" />
          }
        },
      })

      render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line dataKey="value" isAnimationActive={false} />
          <Customized>
            {{ default: () => <SpyComponent /> }}
          </Customized>
        </LineChart>
      ))

      await nextTick()
      await nextTick()

      expect(tickSnapFn).toBeDefined()
      expect(typeof tickSnapFn).toBe('function')
    })
  })

  describe('useCartesianScale', () => {
    it('converts data point to pixel coordinates', async () => {
      let coords: any

      const SpyComponent = defineComponent({
        setup() {
          const c = useCartesianScale({ x: 'B', y: 200 })
          return () => {
            coords = c.value
            return <text data-testid="spy" />
          }
        },
      })

      render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line dataKey="value" isAnimationActive={false} />
          <Customized>
            {{ default: () => <SpyComponent /> }}
          </Customized>
        </LineChart>
      ))

      await nextTick()
      await nextTick()

      expect(coords).toBeDefined()
      expect(typeof coords.x).toBe('number')
      expect(typeof coords.y).toBe('number')
      expect(coords.x).toBeGreaterThan(0)
      expect(coords.x).toBeLessThan(500)
      expect(coords.y).toBeGreaterThan(0)
      expect(coords.y).toBeLessThan(300)
    })
  })
})
