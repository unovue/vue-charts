import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { Dot } from '@/shape/Dot'

describe('dot', () => {
  it('renders a circle element with cx, cy, r', () => {
    const { container } = render(() => <Dot cx={100} cy={100} r={5} fill="#ff7300" />)

    const circles = container.querySelectorAll('.v-charts-dot')
    expect(circles).toHaveLength(1)

    const circle = circles[0]
    expect(circle.tagName.toLowerCase()).toBe('circle')
    expect(circle.getAttribute('cx')).toBe('100')
    expect(circle.getAttribute('cy')).toBe('100')
    expect(circle.getAttribute('r')).toBe('5')
  })

  it('returns null when cx is missing', () => {
    const { container } = render(() => <Dot cy={100} r={5} fill="#ff7300" />)
    expect(container.querySelectorAll('.v-charts-dot')).toHaveLength(0)
  })

  it('returns null when cy is missing', () => {
    const { container } = render(() => <Dot cx={100} r={5} fill="#ff7300" />)
    expect(container.querySelectorAll('.v-charts-dot')).toHaveLength(0)
  })

  it('returns null when r is missing', () => {
    const { container } = render(() => <Dot cx={100} cy={100} fill="#ff7300" />)
    expect(container.querySelectorAll('.v-charts-dot')).toHaveLength(0)
  })

  it('applies fill and stroke via attrs fallthrough', () => {
    const { container } = render(() => <Dot cx={50} cy={60} r={8} fill="#ff7300" stroke="#333" />)

    const circle = container.querySelector('.v-charts-dot')
    expect(circle).not.toBeNull()
    expect(circle!.getAttribute('fill')).toBe('#ff7300')
    expect(circle!.getAttribute('stroke')).toBe('#333')
  })
})
