import { render } from '@testing-library/vue'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { Bar, ComposedChart, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('<Scatter />', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data01 = [
    { x: 100, y: 200, z: 200 },
    { x: 120, y: 100, z: 260 },
    { x: 170, y: 300, z: 400 },
    { x: 140, y: 250, z: 280 },
    { x: 150, y: 400, z: 500 },
    { x: 110, y: 280, z: 200 },
  ]

  describe('basic rendering', () => {
    it('renders scatter symbols with data', () => {
      const { container } = render(() => (
        <ScatterChart width={500} height={500}>
          <XAxis dataKey="x" />
          <YAxis dataKey="y" />
          <Scatter data={data01} fill="#ff7300" isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter')).toHaveLength(1)
      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(data01.length)
    })

    it('renders no symbols when data is empty', () => {
      const { container } = render(() => (
        <ScatterChart width={500} height={500}>
          <XAxis dataKey="x" />
          <YAxis dataKey="y" />
          <Scatter data={[]} fill="#ff7300" isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(0)
    })

    it('does not render when hide is true', () => {
      const { container } = render(() => (
        <ScatterChart width={500} height={500}>
          <XAxis dataKey="x" />
          <YAxis dataKey="y" />
          <Scatter data={data01} fill="#ff7300" hide isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(0)
    })
  })

  describe('fill and stroke props', () => {
    it('applies fill prop to scatter symbols', () => {
      const { container } = render(() => (
        <ScatterChart width={500} height={500}>
          <XAxis dataKey="x" />
          <YAxis dataKey="y" />
          <Scatter data={data01} fill="#ff0000" isAnimationActive={false} />
        </ScatterChart>
      ))

      const symbols = container.querySelectorAll('.v-charts-scatter-symbol')
      expect(symbols).toHaveLength(data01.length)
      // Check that the first symbol's path has the fill attribute
      const path = symbols[0].querySelector('path')
      expect(path).toBeTruthy()
      expect(path?.getAttribute('fill')).toBe('#ff0000')
    })
  })

  describe('custom shape', () => {
    it('renders scatter with cross shape', () => {
      const { container } = render(() => (
        <ScatterChart width={500} height={500}>
          <XAxis type="number" dataKey="x" />
          <YAxis type="number" dataKey="y" />
          <Scatter data={data01} fill="#8884d8" shape="cross" isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter')).toHaveLength(1)
      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(data01.length)
    })

    it('renders scatter with diamond shape', () => {
      const { container } = render(() => (
        <ScatterChart width={500} height={500}>
          <XAxis type="number" dataKey="x" />
          <YAxis type="number" dataKey="y" />
          <Scatter data={data01} fill="#8884d8" shape="diamond" isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter')).toHaveLength(1)
      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(data01.length)
    })

    it('renders scatter with star shape', () => {
      const { container } = render(() => (
        <ScatterChart width={500} height={500}>
          <XAxis type="number" dataKey="x" />
          <YAxis type="number" dataKey="y" />
          <Scatter data={data01} fill="#8884d8" shape="star" isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter')).toHaveLength(1)
      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(data01.length)
    })
  })

  describe('line prop', () => {
    it('renders a connecting line when line is true', () => {
      const { container } = render(() => (
        <ScatterChart width={500} height={500}>
          <XAxis type="number" dataKey="x" />
          <YAxis type="number" dataKey="y" />
          <Scatter data={data01} fill="#8884d8" line isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter')).toHaveLength(1)
      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(data01.length)
      expect(container.querySelectorAll('.v-charts-scatter-line')).toHaveLength(1)
    })

    it('does not render a line when line is false (default)', () => {
      const { container } = render(() => (
        <ScatterChart width={500} height={500}>
          <XAxis type="number" dataKey="x" />
          <YAxis type="number" dataKey="y" />
          <Scatter data={data01} fill="#8884d8" isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter-line')).toHaveLength(0)
    })
  })

  describe('with ZAxis', () => {
    it('renders scatter symbols with ZAxis for sizing', () => {
      const { container } = render(() => (
        <ScatterChart width={500} height={500}>
          <XAxis dataKey="x" />
          <YAxis dataKey="y" />
          <ZAxis dataKey="z" range={[4, 20]} />
          <Scatter data={data01} fill="#ff7300" isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(data01.length)
    })
  })

  describe('multiple scatter series', () => {
    const data02 = [
      { x: 200, y: 260, z: 240 },
      { x: 240, y: 290, z: 220 },
      { x: 190, y: 290, z: 250 },
    ]

    it('renders 2 Scatter series', () => {
      const { container } = render(() => (
        <ScatterChart width={500} height={500}>
          <XAxis dataKey="x" />
          <YAxis dataKey="y" />
          <Scatter name="A" data={data01} fill="#ff7300" isAnimationActive={false} />
          <Scatter name="B" data={data02} fill="#347300" isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter')).toHaveLength(2)
      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(data01.length + data02.length)
    })
  })
})

it('keeps non-Scatter series out of the ZAxis sizing domain', () => {
  const scatter = [{ x: 1, y: 1, z: 1 }, { x: 2, y: 2, z: 2 }]
  const bars = [{ x: 1, y: 1, z: 100 }, { x: 2, y: 2, z: 200 }]
  const { container } = render(() => (
    <ComposedChart width={500} height={500}>
      <XAxis type="number" dataKey="x" />
      <YAxis dataKey="y" />
      <ZAxis dataKey="z" domain={['dataMin', 'dataMax']} range={[100, 400]} />
      <Bar data={bars} dataKey="y" isAnimationActive={false} />
      <Scatter
        data={scatter}
        isAnimationActive={false}
        v-slots={{
          shape: point => <circle data-size={point.size} cx={point.cx} cy={point.cy} r={point.radius} />,
        }}
      />
    </ComposedChart>
  ))
  expect([...container.querySelectorAll('circle[data-size]')].map(point => point.getAttribute('data-size')))
    .toEqual(['100', '400'])
})

// Two Scatters without dataKey once resolved to the first series by dataKey.
it('identifies the hovered Scatter by its series, not by dataKey', async () => {
  const { container } = render(() => (
    <ScatterChart width={500} height={500}>
      <XAxis type="number" dataKey="x" />
      <YAxis type="number" dataKey="y" />
      <Tooltip />
      <Scatter name="A" data={[{ x: 1, y: 10 }, { x: 2, y: 20 }]} isAnimationActive={false} />
      <Scatter name="B" data={[{ x: 3, y: 30 }, { x: 4, y: 40 }]} isAnimationActive={false} />
    </ScatterChart>
  ))
  await nextTick()
  const [seriesA, seriesB] = container.querySelectorAll('.v-charts-scatter')
  seriesB.querySelectorAll('.v-charts-scatter-symbol')[0].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
  await nextTick()
  await nextTick()
  const values = [...container.querySelectorAll('.v-charts-tooltip-item-value')].map(item => item.textContent)
  expect(values).toEqual(['3', '30'])
  const size = (symbol: Element) => symbol.querySelector('path')?.getAttribute('stroke-width')
  expect([...seriesA.querySelectorAll('.v-charts-scatter-symbol')].map(size)).toEqual([null, null])
  expect([...seriesB.querySelectorAll('.v-charts-scatter-symbol')].map(size)).toEqual(['2', null])
})
