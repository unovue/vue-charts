import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { Cross } from '@/shape/Cross'

describe('<Cross />', () => {
  it('render 1 path in Cross', () => {
    const { container } = render(() => (
      <Cross top={50} left={50} x={150} y={180} width={200} height={200} stroke="#000" fill="none" />
    ))

    expect(container.querySelectorAll('.v-charts-cross')).toHaveLength(1)
  })

  it('don\'t render any path when props is invalid', () => {
    const { container } = render(() => (
      <Cross top={50} left={50} x={'x' as any} y={180} width={200} height={200} stroke="#000" fill="none" />
    ))

    expect(container.querySelectorAll('.v-charts-cross')).toHaveLength(0)
  })

  it('renders path with default values when no props are provided', () => {
    const { container } = render(() => <Cross />)

    const path = container.querySelector('.v-charts-cross')
    expect(path).not.toBeNull()
    expect(path!.getAttribute('d')).toBe('M0,0v0M0,0h0')
  })

  it('generates correct path from props', () => {
    const { container } = render(() => (
      <Cross top={50} left={50} x={150} y={180} width={200} height={200} />
    ))

    const path = container.querySelector('.v-charts-cross')
    expect(path).not.toBeNull()
    expect(path!.getAttribute('d')).toBe('M150,50v200M50,180h200')
  })

  it('passes through SVG attributes', () => {
    const { container } = render(() => (
      <Cross top={0} left={0} x={10} y={10} width={100} height={100} stroke="#000" fill="none" />
    ))

    const path = container.querySelector('.v-charts-cross')
    expect(path).not.toBeNull()
    expect(path!.getAttribute('stroke')).toBe('#000')
    expect(path!.getAttribute('fill')).toBe('none')
  })
})
