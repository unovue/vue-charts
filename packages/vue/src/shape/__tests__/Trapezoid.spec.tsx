import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { Trapezoid } from '../Trapezoid'

describe('trapezoid', () => {
  it('renders a path with correct d attribute', () => {
    const { container } = render(() => (
      <Trapezoid x={10} y={20} upperWidth={100} lowerWidth={60} height={50} />
    ))
    const path = container.querySelector('.v-charts-trapezoid')
    expect(path).toBeTruthy()
    expect(path?.getAttribute('d')).toBeTruthy()
  })

  it('applies .v-charts-trapezoid class', () => {
    const { container } = render(() => (
      <Trapezoid x={0} y={0} upperWidth={100} lowerWidth={80} height={40} />
    ))
    expect(container.querySelector('.v-charts-trapezoid')).toBeTruthy()
  })

  it('passes SVG attrs (fill, stroke) through to path', () => {
    const { container } = render(() => (
      <Trapezoid x={0} y={0} upperWidth={100} lowerWidth={80} height={40} fill="#ff0000" stroke="#00ff00" />
    ))
    const path = container.querySelector('.v-charts-trapezoid')
    expect(path?.getAttribute('fill')).toBe('#ff0000')
    expect(path?.getAttribute('stroke')).toBe('#00ff00')
  })

  it('returns null for zero height', () => {
    const { container } = render(() => (
      <Trapezoid x={0} y={0} upperWidth={100} lowerWidth={80} height={0} />
    ))
    expect(container.querySelector('.v-charts-trapezoid')).toBeNull()
  })

  it('returns null for NaN dimensions', () => {
    const { container } = render(() => (
      <Trapezoid x={Number.NaN} y={0} upperWidth={100} lowerWidth={80} height={40} />
    ))
    expect(container.querySelector('.v-charts-trapezoid')).toBeNull()
  })

  it('renders triangle case when lowerWidth=0', () => {
    const { container } = render(() => (
      <Trapezoid x={10} y={0} upperWidth={100} lowerWidth={0} height={50} />
    ))
    const path = container.querySelector('.v-charts-trapezoid')
    expect(path).toBeTruthy()
    const d = path?.getAttribute('d')!
    // Triangle: bottom two points should converge to center
    // x + upperWidth/2 = 10 + 50 = 60
    expect(d).toContain('60')
  })

  it('renders rectangle when upperWidth === lowerWidth', () => {
    const { container } = render(() => (
      <Trapezoid x={10} y={20} upperWidth={100} lowerWidth={100} height={50} />
    ))
    const path = container.querySelector('.v-charts-trapezoid')
    expect(path).toBeTruthy()
    const d = path?.getAttribute('d')!
    // Rectangle: top-left(10,20) → top-right(110,20) → bottom-right(110,70) → bottom-left(10,70)
    expect(d).toContain('10')
    expect(d).toContain('110')
  })

  it('supports custom class', () => {
    const { container } = render(() => (
      <Trapezoid x={0} y={0} upperWidth={100} lowerWidth={80} height={40} class="custom" />
    ))
    const path = container.querySelector('.v-charts-trapezoid.custom')
    expect(path).toBeTruthy()
  })
})
