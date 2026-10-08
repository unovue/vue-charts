import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { Rectangle } from '@/shape/Rectangle'
import type { RectRadius } from '@/types/bar'

describe('rectangle', () => {
  const rectangleRadiusCases: { radius: RectRadius }[] = [{ radius: [5, 10, 8, 15] }, { radius: 5 }]

  it.each(rectangleRadiusCases)(
    'should render 1 rectangle path when radius is $radius',
    ({ radius }) => {
      const { container } = render(() => (
        <svg width={400} height={400}>
          <Rectangle x={50} y={50} width={80} height={100} radius={radius} fill="#ff7300" />
        </svg>
      ))

      const paths = container.querySelectorAll('path')
      expect(paths).toHaveLength(1)
      expect(paths[0].getAttribute('d')).toBeTruthy()
      expect(paths[0].getAttribute('fill')).toBe('#ff7300')
    },
  )

  it('should render 4 arcs when height < 0', () => {
    const { container } = render(() => (
      <svg width={400} height={400}>
        <Rectangle x={50} y={200} width={80} height={-100} radius={5} fill="#ff7300" />
      </svg>
    ))

    const paths = container.querySelectorAll('path')
    expect(paths).toHaveLength(1)
    expect(paths[0].getAttribute('d')).toBeTruthy()
    const d = paths[0].getAttribute('d') || ''
    // With a single number radius and negative height, all 4 corners get arcs
    expect(d.split('A').length - 1).toBe(4)
  })

  it('shouldn\'t render anything when height === 0 || width === 0', () => {
    const { container } = render(() => (
      <svg width={400} height={400}>
        <Rectangle x={50} y={200} width={80} height={0} radius={5} fill="#ff7300" />
        <Rectangle x={50} y={200} width={0} height={30} radius={5} fill="#ff7300" />
      </svg>
    ))

    expect(container.querySelectorAll('path')).toHaveLength(0)
  })

  it('shouldn\'t render any path when x, y, width or height is not a number', () => {
    const { container } = render(() => (
      <svg width={400} height={400}>
        <Rectangle x={'a' as any} y={50} width={80} height={100} fill="#ff7300" />
        <Rectangle x={50} y={'b' as any} width={80} height={100} fill="#ff7300" />
        <Rectangle x={50} y={50} width={'c' as any} height={100} fill="#ff7300" />
        <Rectangle x={50} y={50} width={80} height={'d' as any} fill="#ff7300" />
      </svg>
    ))

    expect(container.querySelectorAll('path')).toHaveLength(0)
  })

  it('should render a simple path without arcs when no radius is provided', () => {
    const { container } = render(() => (
      <svg width={400} height={400}>
        <Rectangle x={10} y={20} width={100} height={50} fill="#00ff00" />
      </svg>
    ))

    const path = container.querySelector('path')
    expect(path).not.toBeNull()
    const d = path!.getAttribute('d')!
    // Simple rectangle path uses M, h, v, h, Z — no A commands
    expect(d).toContain('M')
    expect(d).toContain('Z')
    expect(d).not.toContain('A')
  })

  it('should render with array radius and generate 4 arcs for different corner radii', () => {
    const { container } = render(() => (
      <svg width={400} height={400}>
        <Rectangle x={50} y={50} width={80} height={100} radius={[5, 10, 8, 15]} fill="#ff7300" />
      </svg>
    ))

    const path = container.querySelector('path')
    expect(path).not.toBeNull()
    const d = path!.getAttribute('d')!
    expect(d.split('A').length - 1).toBe(4)
  })

  it('should pass through SVG attributes via attrs', () => {
    const { container } = render(() => (
      <svg width={400} height={400}>
        <Rectangle x={10} y={10} width={50} height={50} fill="#333" stroke="#999" stroke-width="2" />
      </svg>
    ))

    const path = container.querySelector('path')
    expect(path).not.toBeNull()
    expect(path!.getAttribute('fill')).toBe('#333')
    expect(path!.getAttribute('stroke')).toBe('#999')
    expect(path!.getAttribute('stroke-width')).toBe('2')
  })

  it('should set x, y, width, height attributes on the path element', () => {
    const { container } = render(() => (
      <svg width={400} height={400}>
        <Rectangle x={25} y={35} width={60} height={80} />
      </svg>
    ))

    const path = container.querySelector('path')
    expect(path).not.toBeNull()
    expect(path!.getAttribute('x')).toBe('25')
    expect(path!.getAttribute('y')).toBe('35')
    expect(path!.getAttribute('width')).toBe('60')
    expect(path!.getAttribute('height')).toBe('80')
  })

  it('should clamp radius to maxRadius when radius exceeds half of width or height', () => {
    const { container } = render(() => (
      <svg width={400} height={400}>
        <Rectangle x={0} y={0} width={20} height={40} radius={50} fill="#000" />
      </svg>
    ))

    const path = container.querySelector('path')
    expect(path).not.toBeNull()
    const d = path!.getAttribute('d')!
    // radius=50 gets clamped to min(20/2, 40/2) = 10
    expect(d.split('A').length - 1).toBe(4)
    // The arc radius values in the path should be 10, not 50
    expect(d).toContain('10,10')
    expect(d).not.toContain('50,50')
  })
})
