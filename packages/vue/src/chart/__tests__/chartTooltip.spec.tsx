import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { Bar, BarChart, Tooltip, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => mockGetBoundingClientRect({ width: 500, height: 300 }))

it('keeps a click tooltip visible after leaving the item and chart', async () => {
  const { container } = render(() => (
    <BarChart width={500} height={300} data={[{ name: 'A', value: 10 }, { name: 'B', value: 20 }]}>
      <XAxis dataKey="name" />
      <YAxis />
      <Bar dataKey="value" isAnimationActive={false} />
      <Tooltip trigger="click" isAnimationActive={false} />
    </BarChart>
  ))
  await nextTick()
  await nextTick()
  const chart = container.querySelector('.v-charts-wrapper')!
  const item = container.querySelectorAll('.v-charts-bar-rectangle')[1]
  await fireEvent.click(item, { clientX: 400, clientY: 150 })
  await nextTick()
  await nextTick()
  const tooltip = container.parentElement!.querySelector<HTMLElement>('.v-charts-tooltip-wrapper')!
  expect(tooltip.style.visibility).toBe('visible')
  expect(tooltip.querySelector('.v-charts-tooltip-label')?.textContent).toBe('B')
  expect(tooltip.querySelector('.v-charts-tooltip-item-value')?.textContent).toBe('20')
  await fireEvent.mouseLeave(item)
  await fireEvent.mouseLeave(chart)
  await nextTick()
  await nextTick()
  expect(tooltip.style.visibility).toBe('visible')
  expect(tooltip.querySelector('.v-charts-tooltip-item-value')?.textContent).toBe('20')
})

it('preserves duplicate tooltip entries and disposes only the removed series', async () => {
  const first = ref(true)
  const { container } = render(() => (
    <BarChart width={500} height={300} data={[{ name: 'A', value: 10 }]}>
      <XAxis dataKey="name" />
      <YAxis />
      {first.value && <Bar key="first" dataKey="value" fill="red" isAnimationActive={false} />}
      <Bar key="second" dataKey="value" fill="blue" isAnimationActive={false} />
      <Bar key="third" dataKey="value" fill="red" isAnimationActive={false} />
      <Tooltip defaultIndex={0} payloadUniqBy={false} isAnimationActive={false} />
    </BarChart>
  ))
  await nextTick()
  await nextTick()
  await nextTick()
  const entries = () => [...container.parentElement!.querySelectorAll<HTMLElement>('.v-charts-tooltip-item')]
    .map(item => ({ value: item.querySelector('.v-charts-tooltip-item-value')?.textContent, color: item.querySelector<HTMLElement>('.v-charts-tooltip-swatch')?.style.background }))
  expect(entries()).toEqual([{ value: '10', color: 'red' }, { value: '10', color: 'blue' }, { value: '10', color: 'red' }])
  first.value = false
  await nextTick()
  await nextTick()
  expect(entries()).toEqual([{ value: '10', color: 'blue' }, { value: '10', color: 'red' }])
})
