import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { Symbols } from '@/shape/Symbols'

describe('<Symbols />', () => {
  it('render 1 symbol', () => {
    const { container } = render(() => (
      <Symbols type="circle" cx={100} cy={100} />
    ))

    expect(container.querySelectorAll('.v-charts-symbols')).toHaveLength(1)
  })

  it('render 1 symbol when type is undefined (falls back to circle)', () => {
    const { container } = render(() => (
      // @ts-expect-error testing invalid type
      <Symbols cx={100} cy={100} type={undefined} />
    ))

    expect(container.querySelectorAll('.v-charts-symbols')).toHaveLength(1)
  })

  it('don\'t render any symbol when cx is invalid', () => {
    const { container } = render(() => (
      <Symbols cy={100} type="circle" />
    ))

    expect(container.querySelectorAll('.v-charts-symbols')).toHaveLength(0)
  })

  it('don\'t render any symbol when cy is invalid', () => {
    const { container } = render(() => (
      <Symbols cx={100} type="circle" />
    ))

    expect(container.querySelectorAll('.v-charts-symbols')).toHaveLength(0)
  })

  it('applies transform with cx and cy', () => {
    const { container } = render(() => (
      <Symbols type="circle" cx={150} cy={200} />
    ))

    const path = container.querySelector('.v-charts-symbols')
    expect(path).not.toBeNull()
    expect(path!.getAttribute('transform')).toBe('translate(150, 200)')
  })

  it('generates a valid d attribute', () => {
    const { container } = render(() => (
      <Symbols type="circle" cx={100} cy={100} size={64} />
    ))

    const path = container.querySelector('.v-charts-symbols')
    expect(path).not.toBeNull()
    expect(path!.getAttribute('d')).toBeTruthy()
  })

  it('renders different symbol types', () => {
    const types = ['circle', 'cross', 'diamond', 'square', 'star', 'triangle', 'wye'] as const

    for (const type of types) {
      const { container } = render(() => (
        <Symbols type={type} cx={100} cy={100} />
      ))

      expect(container.querySelectorAll('.v-charts-symbols')).toHaveLength(1)
    }
  })

  it('merges custom class', () => {
    const { container } = render(() => (
      <Symbols type="circle" cx={100} cy={100} class="custom-symbol" />
    ))

    const path = container.querySelector('.v-charts-symbols.custom-symbol')
    expect(path).not.toBeNull()
  })

  it('passes through SVG attributes', () => {
    const { container } = render(() => (
      <Symbols type="circle" cx={100} cy={100} fill="#ff7300" stroke="#333" />
    ))

    const path = container.querySelector('.v-charts-symbols')
    expect(path).not.toBeNull()
    expect(path!.getAttribute('fill')).toBe('#ff7300')
    expect(path!.getAttribute('stroke')).toBe('#333')
  })
})
