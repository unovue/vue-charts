import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { Sector } from '@/shape/Sector'

describe('sector', () => {
  it('renders a path element', () => {
    const { container } = render(Sector, {
      props: {
        cx: 100,
        cy: 100,
        innerRadius: 0,
        outerRadius: 80,
        startAngle: 0,
        endAngle: 90,
        fill: '#8884d8',
      },
    })
    const path = container.querySelector('path')
    expect(path).not.toBeNull()
    expect(path!.getAttribute('d')).toBeTruthy()
    expect(path!.getAttribute('fill')).toBe('#8884d8')
  })

  it('returns null for invalid geometry', () => {
    const { container } = render(Sector, {
      props: {
        cx: 100,
        cy: 100,
        innerRadius: 0,
        outerRadius: 0,
        startAngle: 0,
        endAngle: 90,
      },
    })
    expect(container.querySelector('path')).toBeNull()
  })

  it('renders donut sector (innerRadius > 0)', () => {
    const { container } = render(Sector, {
      props: {
        cx: 100,
        cy: 100,
        innerRadius: 40,
        outerRadius: 80,
        startAngle: 0,
        endAngle: 180,
        fill: '#82ca9d',
      },
    })
    const path = container.querySelector('path')
    expect(path).not.toBeNull()
    // Donut path includes inner arc: has 2 A commands
    expect(path!.getAttribute('d')!.match(/A/g)?.length).toBe(2)
  })

  it('returns null when innerRadius exceeds outerRadius', () => {
    const { container } = render(Sector, {
      props: { cx: 100, cy: 100, innerRadius: 90, outerRadius: 80, startAngle: 0, endAngle: 90 },
    })
    expect(container.querySelector('path')).toBeNull()
  })

  it('applies CSS class v-charts-sector', () => {
    const { container } = render(Sector, {
      props: {
        cx: 100,
        cy: 100,
        innerRadius: 0,
        outerRadius: 80,
        startAngle: 0,
        endAngle: 90,
      },
    })
    expect(container.querySelector('.v-charts-sector')).not.toBeNull()
  })
})
