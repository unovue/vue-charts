import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { BarList, CalendarHeatmap, CohortChart, Heatmap, Sparkline, Tooltip } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => mockGetBoundingClientRect({ width: 400, height: 200 }))

it('missing cohort periods stay blank rather than displaying zero retention', () => {
  const { container } = render(() => <CohortChart width={400} height={150} data={[{ cohort: 'Jan', values: [100, null, 25] }]} isAnimationActive={false} />)
  const labels = [...container.querySelectorAll('.v-charts-cell')].map(el => el.getAttribute('aria-label'))
  console.log('cohort labels', labels)
  expect(labels).toEqual(['Jan · 100, 0: 100%', 'Jan · 100, 2: 25%'])
})

it('duplicate BarList names report the clicked row index', async () => {
  const clicked = vi.fn()
  const view = render(() => <BarList {...{ 'onRow-click': clicked }} data={[{ name: 'A', value: 10 }, { name: 'A', value: 5 }]} isAnimationActive={false} />)
  await fireEvent.click(view.container.querySelectorAll('.v-charts-bar-list-row')[1])
  console.log('row-click', clicked.mock.calls)
  expect(clicked.mock.calls[0].slice(0, 2)).toEqual([{ name: 'A', value: 5 }, 1])
})

it('CalendarHeatmap ends at latest dated row even when its value is missing', () => {
  const { container } = render(() => <CalendarHeatmap width={400} height={150} data={[{ date: '2026-01-01', value: 5 }, { date: '2026-01-02', value: undefined }]} isAnimationActive={false} />)
  const labels = [...container.querySelectorAll('.v-charts-cell')].map(el => el.getAttribute('aria-label'))
  console.log('calendar last', labels.at(-1))
  expect(labels.at(-1)).toBe('Fri, Jan 2, 2026')
})

it('Sparkline tooltip follows replacement data at the same active index', async () => {
  const data = ref([1, 2, 3])
  const { container } = render(() => <Sparkline width={400} height={150} data={data.value} isAnimationActive={false}><Tooltip /></Sparkline>)
  await nextTick()
  console.log('spark controlled', container.textContent)
  // Start with hover to ensure there is an active entry.
  await fireEvent.mouseMove(container.querySelector('.v-charts-sparkline > g[role="img"]')!, { clientX: 200, clientY: 100 })
  await nextTick()
  expect(container.querySelector('.v-charts-tooltip-wrapper')?.textContent).toContain('2')
  data.value = [10, 20, 30]
  await nextTick()
  await nextTick()
  console.log('spark updated', container.textContent)
  expect(container.querySelector('.v-charts-tooltip-wrapper')?.textContent).toContain('20')
})

it('Heatmap distinguishes string/number keys and leaves absent coordinates blank', () => {
  const { container } = render(() => <Heatmap width={400} height={150} data={[{ x: 1, y: 'a', value: 3 }, { x: '1', y: 'b', value: 5 }]} isAnimationActive={false} />)
  expect([...container.querySelectorAll('.v-charts-cell')].map(el => el.getAttribute('aria-label'))).toEqual(['a, 1: 3', 'a, 1', 'b, 1', 'b, 1: 5'])
})
