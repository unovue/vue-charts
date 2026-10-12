import { render } from '@testing-library/vue'
import { expect, it } from 'vitest'
import { nextTick } from 'vue'
import { Legend, RadialBar, RadialBarChart } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

it('draws legend icons in the series colour for rows without their own fill', async () => {
  mockGetBoundingClientRect({ width: 400, height: 300 })
  const { container } = render(() => (
    <RadialBarChart width={400} height={300} data={[{ name: 'A', value: 12 }, { name: 'B', value: 24 }]}>
      <RadialBar dataKey="value" fill="#123456" isAnimationActive={false} />
      <Legend />
    </RadialBarChart>
  ))
  await nextTick()
  const icons = [...container.querySelectorAll('.v-charts-legend-item path')]
  expect(icons.map(icon => icon.getAttribute('fill'))).toEqual(['#123456', '#123456'])
})
