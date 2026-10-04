import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Line, LineChart } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { MockResizeObserver } from '@/test/MockResizeObserver'

const data = [
  { name: 'A', uv: 400 },
  { name: 'B', uv: 300 },
  { name: 'C', uv: 200 },
]

describe('default responsive sizing', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 300 })
    MockResizeObserver.instances = []
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
  })

  it('renders the wrapper div with 100% CSS sizing in responsive mode', async () => {
    const { container } = render(() => (
      <LineChart data={data}>
        <Line dataKey="uv" isAnimationActive={false} />
      </LineChart>
    ))
    await nextTick()

    const wrapper = container.querySelector('.v-charts-wrapper') as HTMLElement
    expect(wrapper).toBeTruthy()
    expect(wrapper.style.width).toBe('100%')
    expect(wrapper.style.height).toBe('100%')
  })

  it('preserves initial geometry until a nonzero box is measured', () => {
    // A zero-sized box retains the initial server geometry.
    mockGetBoundingClientRect({ width: 0, height: 0 })

    const { container } = render(() => (
      <LineChart data={data}>
        <Line dataKey="uv" isAnimationActive={false} />
      </LineChart>
    ))

    expect(container.querySelector('.v-charts-wrapper')).toBeTruthy()
    expect(container.querySelector('.v-charts-surface')?.getAttribute('viewBox')).toBe('0 0 640 360')
  })

  it('renders the chart at the measured size once mounted', async () => {
    const { container } = render(() => (
      <LineChart data={data}>
        <Line dataKey="uv" isAnimationActive={false} />
      </LineChart>
    ))
    await nextTick()

    const svg = container.querySelector('.v-charts-surface') as SVGElement
    expect(svg).toBeTruthy()
    expect(svg.getAttribute('width')).toBe('500')
    expect(svg.getAttribute('height')).toBe('300')
  })

  it('updates the chart size when the ResizeObserver reports a new size', async () => {
    const { container } = render(() => (
      <LineChart data={data}>
        <Line dataKey="uv" isAnimationActive={false} />
      </LineChart>
    ))
    await nextTick()

    expect(MockResizeObserver.instances.length).toBeGreaterThanOrEqual(1)
    // The latest instance is the one actively observing the wrapper.
    MockResizeObserver.instances.at(-1)!.trigger(640, 480)
    await nextTick()

    const svg = container.querySelector('.v-charts-surface') as SVGElement
    expect(svg.getAttribute('width')).toBe('640')
    expect(svg.getAttribute('height')).toBe('480')
  })

  it('renders at fixed px size and creates no ResizeObserver when both numeric dimensions are set', async () => {
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

  it('starts observing and measures when fixed dimensions are removed at runtime', async () => {
    const fixed = ref(true)
    const { container } = render(() => (
      <LineChart width={fixed.value ? 400 : undefined} height={fixed.value ? 320 : undefined} data={data}>
        <Line dataKey="uv" isAnimationActive={false} />
      </LineChart>
    ))
    await nextTick()

    expect(MockResizeObserver.instances.length).toBe(0)
    expect((container.querySelector('.v-charts-surface') as SVGElement).getAttribute('width')).toBe('400')

    fixed.value = false
    await nextTick()
    await nextTick()

    expect(MockResizeObserver.instances.length).toBeGreaterThanOrEqual(1)
    // The observer's initial callback picks up the mocked 500x300 bounding rect.
    const svg = container.querySelector('.v-charts-surface') as SVGElement
    expect(svg.getAttribute('width')).toBe('500')
    expect(svg.getAttribute('height')).toBe('300')
  })

  it('stops observing and falls back to props size when fixed dimensions are added at runtime', async () => {
    const disconnectSpy = vi.spyOn(MockResizeObserver.prototype, 'disconnect')
    const fixed = ref(false)
    const { container } = render(() => (
      <LineChart width={fixed.value ? 400 : undefined} height={fixed.value ? 320 : undefined} data={data}>
        <Line dataKey="uv" isAnimationActive={false} />
      </LineChart>
    ))
    await nextTick()

    expect(MockResizeObserver.instances.length).toBeGreaterThanOrEqual(1)
    expect((container.querySelector('.v-charts-surface') as SVGElement).getAttribute('width')).toBe('500')

    // Only switching to fixed dimensions should disconnect the active observer.
    disconnectSpy.mockClear()
    fixed.value = true
    await nextTick()
    await nextTick()

    expect(disconnectSpy).toHaveBeenCalled()
    const svg = container.querySelector('.v-charts-surface') as SVGElement
    expect(svg.getAttribute('width')).toBe('400')
    expect(svg.getAttribute('height')).toBe('320')
    disconnectSpy.mockRestore()
  })
})
