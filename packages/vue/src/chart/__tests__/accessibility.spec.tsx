import 'vitest-canvas-mock'
import { fireEvent, render } from '@testing-library/vue'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Bar, BarChart, Pie, PieChart, Tooltip, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const data = [{ name: 'A', value: 10, other: 5 }, { name: 'B', value: 20, other: 15 }]
function chart(props = {}) {
  return (
    <BarChart width={500} height={300} data={data} {...props}>
      <XAxis dataKey="name" />
      <YAxis />
      <Bar dataKey="value" name="Sales" isAnimationActive={false} />
      <Bar dataKey="other" name="Returns" isAnimationActive={false} />
      <Tooltip isAnimationActive={false} formatter={(value, name) => [`$${value}`, name]} />
    </BarChart>
  )
}

describe('chart accessibility', () => {
  // Catches unnamed applications, dangling summary references and focus on the wrong node.
  it.each([true, false])('names and describes charts with accessibilityLayer=%s', async (accessibilityLayer) => {
    const { container } = render(() => chart({ title: 'Revenue', desc: 'Monthly sales', accessibilityLayer }))
    const wrapper = container.querySelector('.v-charts-wrapper')!
    const svg = container.querySelector('svg')!
    const target = accessibilityLayer ? wrapper : svg
    expect(target.getAttribute('role')).toBe(accessibilityLayer ? 'application' : 'img')
    expect(target.getAttribute('aria-label')).toBe('Revenue')
    const desc = container.querySelector('desc')!
    expect(target.getAttribute('aria-describedby')).toBe(desc.id)
    expect(desc.textContent).toBe('Monthly sales')
    expect(svg.hasAttribute('tabindex')).toBe(false)
    expect(svg.getAttribute('role')).toBe(accessibilityLayer ? null : 'img')
    expect(wrapper.getAttribute('tabindex')).toBe(accessibilityLayer ? '0' : null)
  })

  // Catches a declared `role` prop that never reached the element carrying the chart role.
  it.each([true, false])('applies a user role with accessibilityLayer=%s', (accessibilityLayer) => {
    const { container } = render(() => chart({ role: 'figure', accessibilityLayer }))
    const target = accessibilityLayer ? container.querySelector('.v-charts-wrapper')! : container.querySelector('svg')!
    expect(target.getAttribute('role')).toBe('figure')
  })

  // Catches pointer announcements and stale pending announcements after a pointer takes over.
  it('debounces formatted keyboard announcements and stays silent for pointer hover', async () => {
    mockGetBoundingClientRect({ width: 500, height: 300 })
    vi.useFakeTimers()
    try {
      const { container } = render(() => chart())
      await nextTick()
      const wrapper = container.querySelector<HTMLElement>('.v-charts-wrapper')!
      const live = container.querySelector('[aria-live="polite"]')!
      expect(container.querySelectorAll('[aria-live]')).toHaveLength(1)
      expect(wrapper.getAttribute('aria-label')).toBe('Bar chart')
      await fireEvent.mouseMove(wrapper, { clientX: 150, clientY: 100 })
      await vi.advanceTimersByTimeAsync(200)
      expect(live.textContent?.trim()).toBe('')
      wrapper.focus()
      await nextTick()
      await fireEvent.keyDown(wrapper, { key: 'ArrowRight' })
      await vi.advanceTimersByTimeAsync(149)
      expect(live.textContent?.trim()).toBe('')
      await vi.advanceTimersByTimeAsync(1)
      expect(live.textContent?.trim()).toBe('B: Sales $20, Returns $15')
      await fireEvent.keyDown(wrapper, { key: 'ArrowLeft' })
      await fireEvent.mouseMove(wrapper, { clientX: 150, clientY: 100 })
      await vi.advanceTimersByTimeAsync(200)
      expect(live.textContent?.trim()).toBe('B: Sales $20, Returns $15')
    }
    finally {
      vi.useRealTimers()
    }
  })

  // Catches announcements of rejected proposals or silence after a controlled owner accepts one.
  it('announces accepted controlled keyboard changes and ignores pointer changes', async () => {
    mockGetBoundingClientRect({ width: 500, height: 300 })
    vi.useFakeTimers()
    try {
      const activeIndex = ref<number | null>(0)
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="value" name="Sales" isAnimationActive={false} />
          <Tooltip activeIndex={activeIndex.value} isAnimationActive={false} />
        </BarChart>
      ))
      const wrapper = container.querySelector<HTMLElement>('.v-charts-wrapper')!
      const live = container.querySelector('[aria-live]')!
      await fireEvent.keyDown(wrapper, { key: 'ArrowRight' })
      await vi.advanceTimersByTimeAsync(150)
      expect(live.textContent?.trim()).toBe('')
      activeIndex.value = 1
      await nextTick()
      await vi.advanceTimersByTimeAsync(150)
      expect(live.textContent?.trim()).toBe('B: Sales 20')
      await fireEvent.mouseMove(wrapper, { clientX: 150, clientY: 100 })
      activeIndex.value = 0
      await nextTick()
      await vi.advanceTimersByTimeAsync(150)
      expect(live.textContent?.trim()).toBe('B: Sales 20')
    }
    finally {
      vi.useRealTimers()
    }
  })

  // Catches an invisible keyboard focus indicator or a ring drawn after a mouse click.
  it('shows focus only for keyboard interaction', async () => {
    const { container } = render(() => chart())
    const wrapper = container.querySelector<HTMLElement>('.v-charts-wrapper')!
    await fireEvent.mouseDown(wrapper)
    wrapper.focus()
    await nextTick()
    expect(wrapper.hasAttribute('data-focus-visible')).toBe(false)
    wrapper.blur()
    wrapper.focus()
    await nextTick()
    expect(wrapper.hasAttribute('data-focus-visible')).toBe(true)
    expect(wrapper.style.outline).toBe('2px solid var(--v-charts-focus, Highlight)')
    expect(wrapper.style.outlineOffset).toBe('2px')
    await fireEvent.mouseDown(wrapper)
    expect(wrapper.hasAttribute('data-focus-visible')).toBe(false)
    await fireEvent.keyDown(wrapper, { key: 'ArrowRight' })
    expect(wrapper.hasAttribute('data-focus-visible')).toBe(true)
    wrapper.blur()
    await nextTick()
    expect(wrapper.hasAttribute('data-focus-visible')).toBe(false)
  })

  // Catches client-only live regions and unstable IDs that break SSR hydration.
  it('renders an empty live region and hydrates without warnings', async () => {
    const renderChart = () => chart({ title: 'Revenue', desc: 'Monthly sales' })
    const html = await renderToString(createSSRApp({ render: renderChart }))
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.append(container)
    expect(container.querySelector('[aria-live]')?.textContent?.trim()).toBe('')
    const warn = vi.spyOn(console, 'warn')
    const error = vi.spyOn(console, 'error')
    const app = createSSRApp({ render: renderChart })
    try {
      app.mount(container)
      await nextTick()
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
      const wrapper = container.querySelector('.v-charts-wrapper')!
      expect(wrapper.getAttribute('aria-describedby')).toBe(container.querySelector('desc')!.id)
    }
    finally {
      app.unmount()
      container.remove()
    }
  })

  // Catches accessibility violations in real rendered cartesian and polar chart markup.
  it.each([
    ['BarChart', () => chart()],
    ['PieChart', () => (
      <PieChart width={500} height={300}>
        <Pie data={data} dataKey="value" nameKey="name" isAnimationActive={false} />
        <Tooltip isAnimationActive={false} />
      </PieChart>
    )],
  ])('%s has no axe violations', async (_, renderChart) => {
    const { container } = render(renderChart)
    await nextTick()
    expect((await axe(container)).violations).toEqual([])
  })
})
