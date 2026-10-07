import { fireEvent, render } from '@testing-library/vue'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Funnel, FunnelChart } from '@/index'
import { Tooltip } from '@/components/tooltip/Tooltip'
import Legend from '@/components/legend/Legend'
import { Cell } from '@/components/Cell'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('funnelChart', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { value: 100, name: 'Visit', fill: '#8884d8' },
    { value: 80, name: 'Cart', fill: '#83a6ed' },
    { value: 50, name: 'Checkout', fill: '#8dd1e1' },
    { value: 30, name: 'Purchase', fill: '#82ca9d' },
  ]

  it('handles navigation keys without axis ticks or console errors', async () => {
    const error = vi.spyOn(console, 'error')
    const errors: unknown[] = []
    function onError(event: ErrorEvent) {
      errors.push(event.error)
    }
    window.addEventListener('error', onError)
    try {
      const { container } = render(() => (
        <FunnelChart width={500} height={300}>
          <Funnel dataKey="value" data={data} isAnimationActive={false} />
          <Tooltip />
        </FunnelChart>
      ))
      const root = container.querySelector<HTMLElement>('.v-charts-wrapper')!
      root.focus()
      await nextTick()
      expect(document.activeElement).toBe(root)
      for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End'])
        await fireEvent.keyDown(root, { key })
      expect(errors).toEqual([])
      expect(error).not.toHaveBeenCalled()
    }
    finally {
      window.removeEventListener('error', onError)
    }
  })

  describe('basic rendering', () => {
    it('renders 4 trapezoid elements', () => {
      const { container } = render(() => (
        <FunnelChart width={500} height={300}>
          <Funnel dataKey="value" data={data} isAnimationActive={false} />
        </FunnelChart>
      ))
      const trapezoids = container.querySelectorAll('.v-charts-trapezoid')
      expect(trapezoids.length).toBe(4)
    })

    it('renders nothing with empty data', () => {
      const { container } = render(() => (
        <FunnelChart width={500} height={300}>
          <Funnel dataKey="value" data={[]} isAnimationActive={false} />
        </FunnelChart>
      ))
      const trapezoids = container.querySelectorAll('.v-charts-trapezoid')
      expect(trapezoids.length).toBe(0)
    })

    it('renders 1 trapezoid for single entry', () => {
      const { container } = render(() => (
        <FunnelChart width={500} height={300}>
          <Funnel dataKey="value" data={[data[0]]} isAnimationActive={false} />
        </FunnelChart>
      ))
      const trapezoids = container.querySelectorAll('.v-charts-trapezoid')
      expect(trapezoids.length).toBe(1)
    })

    it('renders no trapezoids when hide is true', () => {
      const { container } = render(() => (
        <FunnelChart width={500} height={300}>
          <Funnel dataKey="value" data={data} isAnimationActive={false} hide={true} />
        </FunnelChart>
      ))
      const funnel = container.querySelector('.v-charts-funnel')
      expect(funnel).toBeNull()
    })
  })

  it('keeps computed geometry when payload fields collide', () => {
    const control = render(() => (
      <FunnelChart width={500} height={300}>
        <Funnel dataKey="value" data={data} isAnimationActive={false} />
      </FunnelChart>
    ))
    const expected = [...control.container.querySelectorAll('.v-charts-trapezoid')].map(el => el.getAttribute('d'))
    control.unmount()
    const collided = data.map(entry => ({ ...entry, x: -999, y: Infinity, width: -99, height: -99, upperWidth: -99, lowerWidth: -99 }))
    const shape = vi.fn((props: { x: number, y: number, upperWidth: number, height: number, payload: unknown }) => (
      <rect x={props.x} y={props.y} width={props.upperWidth} height={props.height} />
    ))
    const view = render(() => (
      <FunnelChart width={500} height={300}>
        <Funnel dataKey="value" data={collided} isAnimationActive={false} />
        <Funnel dataKey="value" data={collided} isAnimationActive={false}>{{ shape }}</Funnel>
      </FunnelChart>
    ))
    expect([...view.container.querySelectorAll('.v-charts-trapezoid')].map(el => el.getAttribute('d'))).toEqual(expected)
    expect(shape.mock.calls[0][0].payload).toMatchObject(collided[0])
    expect(shape.mock.calls[0][0].y).toBe(5)
  })

  describe('lastShapeType', () => {
    it('last trapezoid narrows to triangle by default', () => {
      const { container } = render(() => <FunnelChart width={500} height={300}><Funnel dataKey="value" data={data} isAnimationActive={false} /></FunnelChart>)
      expect([...container.querySelectorAll('.v-charts-trapezoid')].at(-1)?.getAttribute('d')).toBe('M 173,215 L 317,215 L 245,285 L 245,285 Z')
    })

    it('lastShapeType=rectangle makes last trapezoid a rectangle', () => {
      const { container } = render(() => (
        <FunnelChart width={500} height={300}>
          <Funnel dataKey="value" data={data} isAnimationActive={false} lastShapeType="rectangle" />
        </FunnelChart>
      ))
      const trapezoids = container.querySelectorAll('.v-charts-trapezoid')
      expect(trapezoids.length).toBe(4)
    })
  })

  describe('reversed', () => {
    it('renders trapezoids in reversed order', () => {
      const { container } = render(() => (
        <FunnelChart width={500} height={300}>
          <Funnel dataKey="value" data={data} isAnimationActive={false} reversed={true} />
        </FunnelChart>
      ))
      const trapezoids = container.querySelectorAll('.v-charts-trapezoid')
      expect(trapezoids.length).toBe(4)
    })
  })

  describe('cell overrides', () => {
    it('cell v-for overrides per-trapezoid fill', () => {
      const COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00']
      const { container } = render(() => (
        <FunnelChart width={500} height={300}>
          <Funnel dataKey="value" data={data} isAnimationActive={false}>
            {COLORS.map((color, i) => (
              <Cell key={i} fill={color} />
            ))}
          </Funnel>
        </FunnelChart>
      ))
      const trapezoids = container.querySelectorAll('.v-charts-trapezoid')
      expect(trapezoids.length).toBe(4)
      expect(trapezoids[0]?.getAttribute('fill')).toBe('#ff0000')
      expect(trapezoids[1]?.getAttribute('fill')).toBe('#00ff00')
      expect(trapezoids[2]?.getAttribute('fill')).toBe('#0000ff')
      expect(trapezoids[3]?.getAttribute('fill')).toBe('#ffff00')
    })
  })

  describe('tooltip', () => {
    it('renders tooltip on mouseover', async () => {
      const { container } = render(() => (
        <FunnelChart width={500} height={300}>
          <Funnel dataKey="value" data={data} isAnimationActive={false} />
          <Tooltip />
        </FunnelChart>
      ))
      const trapezoids = container.querySelectorAll('.v-charts-trapezoid')
      expect(trapezoids.length).toBe(4)

      await fireEvent.mouseEnter(trapezoids[0])
      await nextTick()
      await nextTick()

      const tooltipWrapper = container.querySelector('.v-charts-tooltip-wrapper')
      expect(tooltipWrapper).toBeTruthy()
    })
  })

  describe('legend', () => {
    it('renders funnel alongside Legend without errors', async () => {
      const { container } = render(() => (
        <FunnelChart width={500} height={300}>
          <Funnel dataKey="value" data={data} isAnimationActive={false} />
          <Legend />
        </FunnelChart>
      ))
      await nextTick()
      const trapezoids = container.querySelectorAll('.v-charts-trapezoid')
      expect(trapezoids.length).toBe(4)
      const legendWrapper = container.querySelector('.v-charts-legend-wrapper')
      expect(legendWrapper).toBeTruthy()
    })
  })

  describe('shape slot', () => {
    it('#shape slot receives trapezoid props', () => {
      const shapeFn = vi.fn((props: any) => (
        <rect x={props.x} y={props.y} width={props.upperWidth} height={props.height} fill={props.fill} />
      ))

      const { container } = render(() => (
        <FunnelChart width={500} height={300}>
          <Funnel dataKey="value" data={data} isAnimationActive={false}>
            {{ shape: shapeFn }}
          </Funnel>
        </FunnelChart>
      ))

      expect(shapeFn).toHaveBeenCalled()
      expect(shapeFn.mock.calls[0][0]).toHaveProperty('upperWidth')
      expect(shapeFn.mock.calls[0][0]).toHaveProperty('height')
    })
  })
})
