import { render } from '@testing-library/vue'
import { expect, it } from 'vitest'
import { nextTick } from 'vue'
import { Legend, Pie, PieChart } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

it('lists legend entries in data order unless asked to sort', async () => {
  mockGetBoundingClientRect({ width: 400, height: 300 })
  const data = ['Jan', 'Feb', 'Mar', 'Apr'].map((name, i) => ({ name, value: 10 + i }))
  const { container } = render(() => (
    <PieChart width={400} height={300}>
      <Pie data={data} dataKey="value" nameKey="name" isAnimationActive={false} />
      <Legend />
    </PieChart>
  ))
  await nextTick()
  expect([...container.querySelectorAll('.v-charts-legend-item-text')].map(el => el.textContent)).toEqual(['Jan', 'Feb', 'Mar', 'Apr'])
})
