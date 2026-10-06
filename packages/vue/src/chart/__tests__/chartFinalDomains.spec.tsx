import { render } from '@testing-library/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Bar, BarChart, Legend, XAxis, YAxis } from '@/index'
import { getMockDomRect, mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => mockGetBoundingClientRect({ width: 500, height: 300 }))

it('settles auto axis width when tick measurements alternate by one pixel', async () => {
  let measurements = 0
  let width = 30
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.classList.contains('v-charts-cartesian-axis-tick-value')) {
      if (this.textContent === '0')
        width = measurements++ % 2 === 0 ? 30 : 31
      return getMockDomRect({ width, height: 16 })
    }
    return getMockDomRect({ width: 500, height: 300 })
  })
  const { container } = render(() => (
    <BarChart width={500} height={300} data={[{ name: 'A', value: 100 }]}>
      <XAxis dataKey="name" />
      <YAxis width="auto" ticks={[0, 50, 100]} interval={0} />
      <Bar dataKey="value" isAnimationActive={false} />
    </BarChart>
  ))
  for (let tick = 0; tick < 12; tick++)
    await nextTick()
  const axisLine = container.querySelector('.v-charts-y-axis .v-charts-cartesian-axis-line')!
  expect(measurements).toBeGreaterThanOrEqual(4)
  const position = axisLine.getAttribute('x1')
  expect(position).toBe('43')
  for (let tick = 0; tick < 12; tick++) {
    await nextTick()
    expect(axisLine.getAttribute('x1')).toBe(position)
  }
})

it('renders legend entries in registration and paint order', async () => {
  const { container } = render(() => (
    <BarChart width={500} height={300} data={[{ first: 10, second: 20 }]}>
      <Bar dataKey="first" name="First" fill="red" isAnimationActive={false} />
      <Bar dataKey="second" name="Second" fill="blue" isAnimationActive={false} />
      <Legend />
    </BarChart>
  ))
  await nextTick()
  await nextTick()
  const legend = () => [...container.querySelectorAll('.v-charts-legend-item-text')].map(item => item.textContent)
  const colors = () => [...container.querySelectorAll('.v-charts-bar-rectangle path')].map(path => path.getAttribute('fill'))
  expect(legend()).toEqual(['First', 'Second'])
  expect(colors()).toEqual(['red', 'blue'])
})
