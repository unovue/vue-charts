import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { Bar, BarChart, Cell, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { getBarRectangles, getBarRects } from '@/test/helper'

describe('cell', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  it('renders empty dom when rendered standalone', () => {
    const { container } = render(() => <Cell />)
    // Cell renders nothing by itself (Vue renders a comment node for null)
    expect(container.querySelector('*')).toBeNull()
  })

  describe('in BarChart', () => {
    const data = [
      { name: 'Page A', uv: 400 },
      { name: 'Page B', uv: 300 },
      { name: 'Page C', uv: 200 },
      { name: 'Page D', uv: 278 },
      { name: 'Page E', uv: 189 },
    ]

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

    it('applies per-bar fill colors via Cell', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" isAnimationActive={false}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Bar>
        </BarChart>
      ))

      const rects = getBarRects(container)
      expect(rects.length).toBe(data.length)

      rects.forEach((rect, index) => {
        expect(rect.getAttribute('fill')).toBe(COLORS[index])
      })
    })

    it('applies stroke via Cell', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" isAnimationActive={false}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} stroke="#000" />
            ))}
          </Bar>
        </BarChart>
      ))

      const rects = getBarRects(container)
      expect(rects.length).toBe(data.length)

      rects.forEach((rect) => {
        expect(rect.getAttribute('stroke')).toBe('#000')
      })
    })

    it('renders correct number of bars with Cells', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" isAnimationActive={false}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Bar>
        </BarChart>
      ))

      const bars = getBarRectangles(container)
      expect(bars.length).toBe(data.length)
    })

    it('still renders bars when Cell count does not match data', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false}>
            {/* Only 2 Cells for 5 data points */}
            <Cell fill="#ff0000" />
            <Cell fill="#00ff00" />
          </Bar>
        </BarChart>
      ))

      const bars = getBarRectangles(container)
      expect(bars.length).toBe(data.length)
    })
  })
})
