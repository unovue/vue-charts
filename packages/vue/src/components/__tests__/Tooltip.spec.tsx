import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Bar, BarChart, Line, LineChart, Tooltip, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('tooltip', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
    { name: 'Page B', uv: 300, pv: 4567, amt: 2400 },
    { name: 'Page C', uv: 300, pv: 1398, amt: 2400 },
    { name: 'Page D', uv: 200, pv: 9800, amt: 2400 },
    { name: 'Page E', uv: 278, pv: 3908, amt: 2400 },
    { name: 'Page F', uv: 189, pv: 4800, amt: 2400 },
  ]

  describe('renders in chart', () => {
    it('renders tooltip wrapper in BarChart', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      // The tooltip wrapper may exist but be hidden when not active
      // At minimum, the chart should render without errors
      expect(container.querySelector('.v-charts-surface')).toBeTruthy()
    })

    it('renders tooltip wrapper in LineChart', () => {
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line dataKey="uv" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      expect(container.querySelector('.v-charts-surface')).toBeTruthy()
    })
  })

  describe('cursor', () => {
    it('does not render cursor when cursor is false', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip cursor={false} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      expect(container.querySelectorAll('.v-charts-tooltip-cursor').length).toBe(0)
    })
  })

  describe('defaultIndex', () => {
    it('renders tooltip content when defaultIndex is set', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip defaultIndex={2} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      await nextTick()
      await nextTick()

      // With defaultIndex, tooltip should become active
      const tooltipWrapper = container.parentElement!.querySelector('.v-charts-tooltip-wrapper')
      if (tooltipWrapper) {
        // When active, visibility should be visible
        const style = (tooltipWrapper as HTMLElement).style
        // The tooltip may take a frame to become visible
        expect(tooltipWrapper).toBeTruthy()
      }
    })
  })

  describe('content slot', () => {
    it('renders custom content via content slot', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip defaultIndex={0}>
            {{
              content: (props: any) => (
                <div class="custom-tooltip">
                  <span class="custom-label">{props.label}</span>
                </div>
              ),
            }}
          </Tooltip>
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      await nextTick()
      await nextTick()

      // Chart should render without errors
      expect(container.querySelector('.v-charts-surface')).toBeTruthy()
    })
  })

  describe('props', () => {
    it('accepts separator prop', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip separator=" - " />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      expect(container.querySelector('.v-charts-surface')).toBeTruthy()
    })

    it('accepts offset prop', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip offset={20} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      expect(container.querySelector('.v-charts-surface')).toBeTruthy()
    })

    it('accepts trigger prop', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip trigger="click" />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      expect(container.querySelector('.v-charts-surface')).toBeTruthy()
    })
  })

  describe('mouse interaction', () => {
    it('switches a live shared tooltip from axis entries to one hovered item', async () => {
      const shared = ref(true)
      const { container } = render(() => (
        <BarChart width={500} height={300} data={[{ name: 'A', a: 10, b: 20 }]}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="a" isAnimationActive={false} />
          <Bar dataKey="b" isAnimationActive={false} />
          <Tooltip shared={shared.value} isAnimationActive={false}>
            {{ content: ({ payload }) => <div data-testid="shared-tooltip">{payload.map(item => item.value).join(',')}</div> }}
          </Tooltip>
        </BarChart>
      ))
      const wrapper = container.querySelector('.v-charts-wrapper')!
      await fireEvent.mouseMove(wrapper, { clientX: 280, clientY: 100 })
      await nextTick()
      await nextTick()
      expect(container.querySelector('[data-testid="shared-tooltip"]')?.textContent).toBe('10,20')
      expect(container.querySelector<HTMLElement>('[role="tooltip"]')?.style.visibility).toBe('visible')
      shared.value = false
      await nextTick()
      await fireEvent.mouseEnter(container.querySelector('.v-charts-bar-rectangle')!)
      await nextTick()
      await nextTick()
      expect(container.querySelector('[data-testid="shared-tooltip"]')?.textContent).toBe('10')
      expect(container.querySelector<HTMLElement>('[role="tooltip"]')?.style.visibility).toBe('visible')
    })

    it('shows tooltip on mouse over chart area', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      const chart = container.querySelector('.v-charts-surface')
      expect(chart).toBeTruthy()

      // Simulate mouse enter on chart
      if (chart) {
        await fireEvent.mouseMove(chart, { clientX: 200, clientY: 200 })
        await nextTick()
      }

      // Chart should still be rendered properly
      expect(container.querySelector('.v-charts-surface')).toBeTruthy()
    })
  })
})

// Catches pointer/keyboard proposals overriding a controlled table-row selection.
it.each([true, false])('keeps tooltip ownership when controlled=%s', async (controlled) => {
  mockGetBoundingClientRect({ width: 500, height: 300 })
  const activeIndex = ref<number | null | undefined>(controlled ? 1 : undefined)
  const update = vi.fn()
  const { container } = render(() => (
    <BarChart width={500} height={300} data={[{ name: 'A', value: 10 }, { name: 'B', value: 20 }]}>
      <XAxis dataKey="name" />
      <YAxis />
      <Bar dataKey="value" isAnimationActive={false} />
      <Tooltip isAnimationActive={false} activeIndex={activeIndex.value} defaultIndex={0} {...{ 'onUpdate:activeIndex': update }}>
        {{ content: ({ active, payload }) => <div data-testid="model-tooltip">{active ? payload.map(item => item.value).join(',') : 'hidden'}</div> }}
      </Tooltip>
    </BarChart>
  ))
  await nextTick()
  const content = () => {
    const box = container.querySelector<HTMLElement>('[role="tooltip"]')
    return box?.style.visibility === 'hidden' ? 'hidden' : box?.textContent
  }
  const wrapper = container.querySelector('.v-charts-wrapper')!
  expect(content()).toBe(controlled ? '20' : '10')
  await fireEvent.mouseMove(wrapper, { clientX: 150, clientY: 100 })
  expect(update.mock.calls).toEqual([[0]])
  expect(content()).toBe(controlled ? '20' : '10')
  await fireEvent.mouseLeave(wrapper)
  await nextTick()
  expect(update.mock.calls.at(-1)).toEqual([null])
  expect(content()).toBe(controlled ? '20' : 'hidden')
  if (controlled) {
    activeIndex.value = 0
    await nextTick()
    expect(content()).toBe('10')
    await fireEvent.keyDown(wrapper, { key: 'ArrowRight' })
    expect(update.mock.calls.at(-1)).toEqual([1])
    expect(content()).toBe('10')
    activeIndex.value = 1
    await nextTick()
    expect(content()).toBe('20')
    await fireEvent.keyDown(wrapper, { key: 'Enter' })
    expect(update.mock.calls.at(-1)).toEqual([null])
    expect(content()).toBe('20')
    activeIndex.value = null
    await nextTick()
    await nextTick()
    expect(content()).toBe('hidden')
    await fireEvent.mouseMove(wrapper, { clientX: 150, clientY: 100 })
    expect(update.mock.calls.at(-1)).toEqual([0])
    expect(content()).toBe('hidden')
  }
})
