import { render } from '@testing-library/vue'
import { nextTick, ref } from 'vue'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Bar, BarChart, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => mockGetBoundingClientRect({ width: 30, height: 16 }))
afterEach(() => vi.restoreAllMocks())

// Catches a supported object tick producing a Vue prop warning; checks its presentation too.
it.each(['x', 'y'] as const)('forwards %s axis labels and tick presentation', async (direction) => {
  const warnings = vi.spyOn(console, 'warn')
  const tick = ref<boolean | { fill: string }>({ fill: 'purple' })
  const { container } = render(() => (
    <BarChart width={500} height={300} data={[{ day: 'Mon', value: 20 }, { day: 'Tue', value: 40 }]}>
      {direction === 'x'
        ? <XAxis dataKey="day" tick={tick.value} angle={-45} label="Day" stroke="red" tickSize={13} />
        : <YAxis tick={tick.value} angle={-45} label="Day" stroke="red" tickSize={13} />}
      <Bar dataKey="value" isAnimationActive={false} />
    </BarChart>
  ))
  await nextTick()
  const axis = container.querySelector(`.v-charts-${direction}-axis`)!
  expect(axis.querySelector('.v-charts-label')?.textContent).toBe('Day')
  const text = axis.querySelector('.v-charts-cartesian-axis-tick-value')!
  expect(text.getAttribute('fill')).toBe('purple')
  expect(text.getAttribute('transform')).toContain('rotate(-45,')
  const line = axis.querySelector('.v-charts-cartesian-axis-tick-line')!
  expect(line.getAttribute('stroke')).toBe('red')
  const dimension = direction === 'x' ? 'y' : 'x'
  expect(Math.abs(Number(line.getAttribute(`${dimension}1`)) - Number(line.getAttribute(`${dimension}2`)))).toBe(13)
  tick.value = false
  await nextTick()
  expect(axis.querySelector('.v-charts-cartesian-axis-tick-value')).toBeNull()
  expect(axis.querySelector('.v-charts-label')?.textContent).toBe('Day')
  const tickWarnings = warnings.mock.calls.map(([message]) => String(message))
    .filter(message => message.includes('Invalid prop') && message.includes('"tick"'))
  expect(tickWarnings).toEqual([])
})
