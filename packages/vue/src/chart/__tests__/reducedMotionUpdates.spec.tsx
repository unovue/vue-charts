import { render } from '@testing-library/vue'
import { expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import {
  Bar,
  BarChart,
  BarList,
  CalendarHeatmap,
  CohortChart,
  Heatmap,
  JourneySankey,
  Tracker,
  XAxis,
  YAxis,
} from '@/index'
import { clock } from '@/test/motionClock'

const cases = [
  {
    name: 'Bar and axes',
    chart: (value: number) => (
      <BarChart width={200} height={100} data={[{ name: 'A', value }]}>
        <XAxis dataKey="name" />
        <YAxis domain={[0, 10]} ticks={[0, 5, 10]} />
        <Bar dataKey="value" />
      </BarChart>
    ),
    selector: '.v-charts-bar-rectangle path',
    before: ['M 78,35 h 104 v 30 h -104 Z'],
    after: ['M 78,5 h 104 v 60 h -104 Z'],
    attribute: 'd',
  },
  {
    name: 'Tracker',
    chart: (value: number) => <Tracker width={100} height={20} gap={0} data={[{ date: 'a', status: value === 5 ? 'up' : 'down' }]} />,
    selector: '.v-charts-cell',
    attribute: 'aria-label',
    before: ['a: Operational'],
    after: ['a: Down'],
  },
  {
    name: 'Heatmap',
    chart: (value: number) => <Heatmap width={100} height={40} xLabels={false} yLabels={false} data={[{ x: 'A', y: 'B', value }]} />,
    selector: '.v-charts-cell',
    attribute: 'aria-label',
    before: ['B, A: 5'],
    after: ['B, A: 10'],
  },
  {
    name: 'CohortChart',
    chart: (value: number) => <CohortChart width={100} height={40} data={[{ cohort: 'A', values: [10, value] }]} />,
    selector: '.v-charts-cell',
    attribute: 'aria-label',
    before: ['A · 10, 0: 100%', 'A · 10, 1: 50%'],
    after: ['A · 10, 0: 100%', 'A · 10, 1: 100%'],
  },
  {
    name: 'CalendarHeatmap',
    chart: (value: number) => <CalendarHeatmap width={100} height={40} start="2026-01-01" end="2026-01-01" data={[{ date: '2026-01-01', value }]} />,
    selector: '.v-charts-cell',
    attribute: 'aria-label',
    before: ['Thu, Jan 1, 2026: 5'],
    after: ['Thu, Jan 1, 2026: 10'],
  },
  {
    name: 'BarList',
    chart: (value: number) => <BarList width={100} data={[{ name: 'A', value }]} />,
    selector: '.v-charts-bar-list-value',
    attribute: null,
    before: ['5'],
    after: ['10'],
  },
  {
    name: 'JourneySankey',
    chart: (value: number) => <JourneySankey width={500} height={300} data={[{ path: ['A', 'B'], count: value }]} />,
    selector: '.v-charts-journey-node-continue',
    attribute: 'height',
    before: ['272', '272'],
    after: ['272', '272'],
  },
]

// Catches reduced-motion updates starting a clock or retaining the previous data.
it.each(cases)('$name snaps to updated data under reduced motion', async (test) => {
  clock.reduced = true
  const value = ref(5)
  const { container } = render(() => test.chart(value.value))
  await nextTick()
  await nextTick()
  const read = () => Array.from(container.querySelectorAll(test.selector), element =>
    test.attribute === 'height'
      ? String(Math.round(Number(element.getAttribute('height'))))
      : test.attribute ? element.getAttribute(test.attribute) : element.textContent)
  expect(read()).toEqual(test.before)
  value.value = 10
  await nextTick()
  await nextTick()
  expect(read()).toEqual(test.after)
  expect(clock.runs).toEqual([])
  if (test.name === 'Bar and axes') {
    expect(Array.from(container.querySelectorAll('.v-charts-y-axis text'), item => item.textContent))
      .toEqual(['0', '5', '10'])
  }
  if (test.name === 'JourneySankey')
    expect(container.textContent).toContain('10 sessions')
})

vi.mock('motion-v', async original =>
  (await import('@/test/motionClock')).mockMotion(await original<typeof import('motion-v')>()))
vi.mock('@vueuse/core', async original =>
  (await import('@/test/motionClock')).mockVueUse(await original<typeof import('@vueuse/core')>()))
