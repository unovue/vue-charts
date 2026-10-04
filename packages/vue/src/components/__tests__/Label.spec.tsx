import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { Bar, BarChart } from '@/index'
import { Label } from '@/components/label/Label'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('label', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: 'Page A', uv: 400 },
    { name: 'Page B', uv: 300 },
    { name: 'Page C', uv: 200 },
  ]

  const polarViewBox = {
    cx: 50,
    cy: 50,
    innerRadius: 20,
    outerRadius: 80,
    startAngle: 0,
    endAngle: 90,
    clockWise: false,
  }

  const cartesianViewBox = {
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  }

  // Helper: render Label inside BarChart (provides chart-local Vue state)
  function renderLabelInChart(labelProps: Record<string, any>, labelSlots?: any) {
    return render(() => (
      <BarChart width={500} height={300} data={data}>
        <Bar dataKey="uv" isAnimationActive={false} />
        <Label {...labelProps}>
          {labelSlots}
        </Label>
      </BarChart>
    ))
  }

  describe('with explicit viewBox', () => {
    it('renders a label with value prop', () => {
      const { container } = renderLabelInChart({
        viewBox: cartesianViewBox,
        value: 'test label',
        position: 'center',
      })

      const labels = container.querySelectorAll('.v-charts-label')
      expect(labels.length).toBeGreaterThanOrEqual(1)
      const found = Array.from(labels).some(l => l.textContent?.includes('test label'))
      expect(found).toBe(true)
    })

    it('renders label with string value', () => {
      const { container } = renderLabelInChart({
        viewBox: cartesianViewBox,
        value: 'hello',
        position: 'center',
      })

      const labels = container.querySelectorAll('.v-charts-label')
      const found = Array.from(labels).some(l => l.textContent?.includes('hello'))
      expect(found).toBe(true)
    })

    it('renders label with numeric value', () => {
      const { container } = renderLabelInChart({
        viewBox: cartesianViewBox,
        value: 42,
        position: 'center',
      })

      const labels = container.querySelectorAll('.v-charts-label')
      const found = Array.from(labels).some(l => l.textContent?.includes('42'))
      expect(found).toBe(true)
    })
  })

  describe('position prop', () => {
    it('renders label at center position', () => {
      const { container } = renderLabelInChart({
        viewBox: cartesianViewBox,
        value: 'center',
        position: 'center',
      })

      const labels = container.querySelectorAll('.v-charts-label')
      const label = Array.from(labels).find(l => l.textContent?.includes('center'))
      expect(label).toBeTruthy()
      expect(label!.getAttribute('x')).toBe(`${cartesianViewBox.x + cartesianViewBox.width / 2}`)
      expect(label!.getAttribute('y')).toBe(`${cartesianViewBox.y + cartesianViewBox.height / 2}`)
    })

    it('renders label at top position', () => {
      const { container } = renderLabelInChart({
        viewBox: cartesianViewBox,
        value: 'top-label',
        position: 'top',
      })

      const labels = container.querySelectorAll('.v-charts-label')
      const found = Array.from(labels).some(l => l.textContent?.includes('top-label'))
      expect(found).toBe(true)
    })

    it('renders label at inside position', () => {
      const { container } = renderLabelInChart({
        viewBox: cartesianViewBox,
        value: 'inside-label',
        position: 'inside',
      })

      const labels = container.querySelectorAll('.v-charts-label')
      const found = Array.from(labels).some(l => l.textContent?.includes('inside-label'))
      expect(found).toBe(true)
    })

    it('renders label at bottom position', () => {
      const { container } = renderLabelInChart({
        viewBox: cartesianViewBox,
        value: 'bottom-label',
        position: 'bottom',
      })

      const labels = container.querySelectorAll('.v-charts-label')
      const found = Array.from(labels).some(l => l.textContent?.includes('bottom-label'))
      expect(found).toBe(true)
    })

    it('renders label at left position', () => {
      const { container } = renderLabelInChart({
        viewBox: cartesianViewBox,
        value: 'left-label',
        position: 'left',
      })

      const labels = container.querySelectorAll('.v-charts-label')
      const found = Array.from(labels).some(l => l.textContent?.includes('left-label'))
      expect(found).toBe(true)
    })

    it('renders label at right position', () => {
      const { container } = renderLabelInChart({
        viewBox: cartesianViewBox,
        value: 'right-label',
        position: 'right',
      })

      const labels = container.querySelectorAll('.v-charts-label')
      const found = Array.from(labels).some(l => l.textContent?.includes('right-label'))
      expect(found).toBe(true)
    })
  })

  describe('polar viewBox', () => {
    it('renders polar label at center position', () => {
      const { container } = renderLabelInChart({
        viewBox: polarViewBox,
        value: 'polar-center',
        position: 'center',
      })

      const labels = container.querySelectorAll('.v-charts-label')
      const label = Array.from(labels).find(l => l.textContent?.includes('polar-center'))
      expect(label).toBeTruthy()
      expect(label!.getAttribute('x')).toBe(`${polarViewBox.cx}`)
      expect(label!.getAttribute('y')).toBe(`${polarViewBox.cy}`)
    })

    it('renders polar label at outside position', () => {
      const { container } = renderLabelInChart({
        viewBox: polarViewBox,
        value: 'polar-outside',
        position: 'outside',
      })

      const labels = container.querySelectorAll('.v-charts-label')
      const found = Array.from(labels).some(l => l.textContent?.includes('polar-outside'))
      expect(found).toBe(true)
    })

    it('renders radial label at insideStart position', () => {
      const { container } = renderLabelInChart({
        viewBox: polarViewBox,
        value: 'radial',
        position: 'insideStart',
      })

      const radialLabels = container.querySelectorAll('.v-charts-radial-bar-label')
      expect(radialLabels.length).toBe(1)
    })

    it('renders radial label at insideEnd position', () => {
      const { container } = renderLabelInChart({
        viewBox: polarViewBox,
        value: 'radial',
        position: 'insideEnd',
      })

      const radialLabels = container.querySelectorAll('.v-charts-radial-bar-label')
      expect(radialLabels.length).toBe(1)
    })

    it('renders radial label at end position', () => {
      const { container } = renderLabelInChart({
        viewBox: polarViewBox,
        value: 'radial',
        position: 'end',
      })

      const radialLabels = container.querySelectorAll('.v-charts-radial-bar-label')
      expect(radialLabels.length).toBe(1)
    })
  })

  describe('content slot', () => {
    it('renders custom content via content slot', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <Bar dataKey="uv" isAnimationActive={false} />
          <Label viewBox={cartesianViewBox} position="center">
            {{
              content: (slotProps: any) => (
                <text class="custom-label">custom content</text>
              ),
            }}
          </Label>
        </BarChart>
      ))

      const customLabel = container.querySelector('.custom-label')
      expect(customLabel).toBeTruthy()
      expect(customLabel!.textContent).toBe('custom content')
    })

    it('passes viewBox to content slot', () => {
      let receivedViewBox: any = null
      render(() => (
        <BarChart width={500} height={300} data={data}>
          <Bar dataKey="uv" isAnimationActive={false} />
          <Label viewBox={cartesianViewBox} value="test" position="center">
            {{
              content: (slotProps: any) => {
                receivedViewBox = slotProps.viewBox
                return <text class="custom-label">content</text>
              },
            }}
          </Label>
        </BarChart>
      ))

      expect(receivedViewBox).toEqual(cartesianViewBox)
    })

    it('renders content slot even without value prop', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <Bar dataKey="uv" isAnimationActive={false} />
          <Label viewBox={cartesianViewBox} position="center">
            {{
              content: () => <text class="custom-label">no value needed</text>,
            }}
          </Label>
        </BarChart>
      ))

      const customLabel = container.querySelector('.custom-label')
      expect(customLabel).toBeTruthy()
    })
  })

  describe('formatter', () => {
    it('applies formatter to value', () => {
      const { container } = renderLabelInChart({
        viewBox: cartesianViewBox,
        value: 100,
        position: 'center',
        formatter: (val: any) => `$${val}`,
      })

      const labels = container.querySelectorAll('.v-charts-label')
      const found = Array.from(labels).some(l => l.textContent?.includes('$100'))
      expect(found).toBe(true)
    })
  })
})
