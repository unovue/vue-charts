import { render } from '@testing-library/vue'
import { expect, it } from 'vitest'
import { Bar, BarChart, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

it('a valid string stackId does not crash the chart', () => {
  mockGetBoundingClientRect({ width: 500, height: 300 })
  expect(() => render(() => <BarChart width={500} height={300} data={[{ name: 'A', a: 10, b: 20 }]}><XAxis dataKey="name"/><YAxis/><Bar dataKey="a" stackId="constructor" isAnimationActive={false}/><Bar dataKey="b" stackId="constructor" isAnimationActive={false}/></BarChart>)).not.toThrow()
})
