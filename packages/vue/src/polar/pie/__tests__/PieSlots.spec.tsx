import { render } from '@testing-library/vue'
import { expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Cell, LabelList, Pie, PieChart } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

it('reads Cell and LabelList children during render, without slot warnings', async () => {
  mockGetBoundingClientRect({ width: 400, height: 300 })
  const warn = vi.spyOn(console, 'warn')
  const { container } = render(() => (
    <PieChart width={400} height={300}>
      <Pie data={[{ name: 'A', value: 12 }, { name: 'B', value: 24 }]} dataKey="value" isAnimationActive={false}>
        <Cell fill="#f00" />
        <Cell fill="#0f0" />
        <LabelList dataKey="value" />
      </Pie>
    </PieChart>
  ))
  await nextTick()
  expect(warn.mock.calls.map(call => String(call[0])).filter(message => message.includes('outside of the render function'))).toEqual([])
  expect([...container.querySelectorAll('.v-charts-sector')].map(sector => sector.getAttribute('fill'))).toEqual(['#f00', '#0f0'])
})
