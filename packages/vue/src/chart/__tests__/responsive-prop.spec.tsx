import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Line, LineChart } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

class MockResizeObserver {
  callback: ResizeObserverCallback
  static instances: MockResizeObserver[] = []

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    MockResizeObserver.instances.push(this)
  }

  observe() {}
  unobserve() {}
  disconnect() {}

  trigger(width: number, height: number) {
    this.callback(
      [{ contentRect: { width, height } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    )
  }
}

const data = [
  { name: 'A', uv: 400 },
  { name: 'B', uv: 300 },
  { name: 'C', uv: 200 },
]

describe('responsive prop', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 300 })
    MockResizeObserver.instances = []
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
  })

  it('renders the wrapper div with 100% CSS sizing in responsive mode', async () => {
    const { container } = render(() => (
      <LineChart responsive data={data}>
        <Line dataKey="uv" isAnimationActive={false} />
      </LineChart>
    ))
    await nextTick()

    const wrapper = container.querySelector('.v-charts-wrapper') as HTMLElement
    expect(wrapper).toBeTruthy()
    expect(wrapper.style.width).toBe('100%')
    expect(wrapper.style.height).toBe('100%')
  })

  it('does not render the chart surface until the wrapper is measured', () => {
    // Initial measurement of 0x0 keeps the chart gated out.
    mockGetBoundingClientRect({ width: 0, height: 0 })

    const { container } = render(() => (
      <LineChart responsive data={data}>
        <Line dataKey="uv" isAnimationActive={false} />
      </LineChart>
    ))

    expect(container.querySelector('.v-charts-wrapper')).toBeTruthy()
    expect(container.querySelector('.vcharts-surface')).toBeNull()
  })

  it('renders the chart at the measured size once mounted', async () => {
    const { container } = render(() => (
      <LineChart responsive data={data}>
        <Line dataKey="uv" isAnimationActive={false} />
      </LineChart>
    ))
    await nextTick()

    const svg = container.querySelector('.vcharts-surface') as SVGElement
    expect(svg).toBeTruthy()
    expect(svg.getAttribute('width')).toBe('500')
    expect(svg.getAttribute('height')).toBe('300')
  })

  it('updates the chart size when the ResizeObserver reports a new size', async () => {
    const { container } = render(() => (
      <LineChart responsive data={data}>
        <Line dataKey="uv" isAnimationActive={false} />
      </LineChart>
    ))
    await nextTick()

    expect(MockResizeObserver.instances.length).toBe(1)
    MockResizeObserver.instances[0].trigger(640, 480)
    await nextTick()

    const svg = container.querySelector('.vcharts-surface') as SVGElement
    expect(svg.getAttribute('width')).toBe('640')
    expect(svg.getAttribute('height')).toBe('480')
  })

  it('renders at fixed px size and creates no ResizeObserver when responsive is not set', async () => {
    const { container } = render(() => (
      <LineChart width={400} height={320} data={data}>
        <Line dataKey="uv" isAnimationActive={false} />
      </LineChart>
    ))
    await nextTick()

    const wrapper = container.querySelector('.v-charts-wrapper') as HTMLElement
    expect(wrapper.style.width).toBe('400px')
    expect(wrapper.style.height).toBe('320px')
    expect(MockResizeObserver.instances.length).toBe(0)
  })
})
