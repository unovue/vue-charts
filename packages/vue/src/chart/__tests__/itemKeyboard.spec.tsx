import 'vitest-canvas-mock'
import { fireEvent, render } from '@testing-library/vue'
import { expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import {
  Funnel,
  FunnelChart,
  Pie,
  PieChart,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const data = [
  { name: 'A', value: 10, x: 1 },
  { name: 'B', value: 20, x: 2 },
  { name: 'C', value: 30, x: 3 },
]

// Catches item charts remaining pointer-only, stale active shapes and missing announcements.
it.each([
  ['Pie', () => (
    <PieChart width={500} height={300}>
      <Pie data={data} dataKey="value" isAnimationActive={false}>
        {{ activeShape: ({ name }) => <path data-active={name} /> }}
      </Pie>
      <Tooltip isAnimationActive={false} />
    </PieChart>
  ), 'B 20'],
  ['Scatter', () => (
    <ScatterChart width={500} height={300}>
      <XAxis dataKey="x" type="number" name="Position" />
      <YAxis dataKey="value" type="number" name="Value" />
      <Scatter data={data} dataKey="value" isAnimationActive={false}>
        {{ shape: ({ payload, isActive }) => <path data-active={isActive ? payload.name : undefined} /> }}
      </Scatter>
      <Tooltip isAnimationActive={false} />
    </ScatterChart>
  ), 'Position 2, Value 20'],
  ['Funnel', () => (
    <FunnelChart width={500} height={300}>
      <Funnel data={data} dataKey="value" isAnimationActive={false}>
        {{ shape: ({ payload, isActive }) => <path data-active={isActive ? payload.name : undefined} /> }}
      </Funnel>
      <Tooltip isAnimationActive={false} />
    </FunnelChart>
  ), 'B 20'],
])('%s navigates data and announces its tooltip', async (_, chart, announcement) => {
  mockGetBoundingClientRect({ width: 500, height: 300 })
  vi.useFakeTimers()
  try {
    const { container } = render(chart)
    await nextTick()
    const root = container.querySelector<HTMLElement>('.v-charts-wrapper')!
    root.focus()
    await nextTick()
    await fireEvent.keyDown(root, { key: 'ArrowRight' })
    expect(container.querySelector('[data-active="A"]')).not.toBeNull()
    await fireEvent.keyDown(root, { key: 'ArrowRight' })
    await vi.advanceTimersByTimeAsync(150)
    expect(container.querySelector('[data-active="B"]')).not.toBeNull()
    expect(container.querySelector('[aria-live]')?.textContent?.trim()).toBe(announcement)
    expect(container.querySelector('.v-charts-tooltip-wrapper')?.textContent).toContain('20')
    await fireEvent.keyDown(root, { key: 'End' })
    expect(container.querySelector('[data-active="C"]')).not.toBeNull()
    await fireEvent.keyDown(root, { key: 'ArrowLeft' })
    expect(container.querySelector('[data-active="B"]')).not.toBeNull()
    await fireEvent.keyDown(root, { key: 'Home' })
    await fireEvent.keyDown(root, { key: 'ArrowDown' })
    await fireEvent.keyDown(root, { key: 'ArrowUp' })
    expect(container.querySelector('[data-active="A"]')).not.toBeNull()
    await fireEvent.keyDown(root, { key: 'Escape' })
    expect(container.querySelector<HTMLElement>('.v-charts-tooltip-wrapper')?.style.visibility).toBe('hidden')
    expect(container.querySelector('[data-active]')).toBeNull()
  }
  finally {
    vi.useRealTimers()
  }
})

// Catches navigation resetting at a series boundary, including equal data keys.
it('navigates series in registration order with equal data keys', async () => {
  const first = [{ name: 'A', value: 10 }]
  const second = [{ name: 'Other', value: 70 }]
  const { container } = render(() => (
    <PieChart width={500} height={300}>
      <Pie data={first} dataKey="value" isAnimationActive={false} />
      <Pie data={second} dataKey="value" isAnimationActive={false} />
      <Tooltip isAnimationActive={false} />
    </PieChart>
  ))
  await nextTick()
  await nextTick()
  const root = container.querySelector<HTMLElement>('.v-charts-wrapper')!
  await fireEvent.keyDown(root, { key: 'ArrowRight' })
  await fireEvent.keyDown(root, { key: 'ArrowRight' })
  expect(container.querySelector('.v-charts-tooltip-wrapper')?.textContent).toContain('Other')
  expect(container.querySelector('.v-charts-tooltip-wrapper')?.textContent).toContain('70')
})
