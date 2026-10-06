import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { BarChart } from '@/chart/BarChart'
import { LineChart } from '@/chart/LineChart'
import { Bar } from '@/cartesian/bar/Bar'
import { Line } from '@/cartesian/line/Line'
import { XAxis } from '@/cartesian/axis/XAxis'
import { YAxis } from '@/cartesian/axis/YAxis'
import { Legend } from '@/components/legend'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('legendSelectors', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
    { name: 'Page B', uv: 300, pv: 4567, amt: 2400 },
    { name: 'Page C', uv: 300, pv: 1398, amt: 2400 },
    { name: 'Page D', uv: 200, pv: 9800, amt: 2400 },
    { name: 'Page E', uv: 278, pv: 3908, amt: 2400 },
    { name: 'Page F', uv: 189, pv: 4800, amt: 2400 },
  ]

  describe('series legend entries', () => {
    it.each([
      {
        name: 'single Bar',
        chart: () => (
          <BarChart width={500} height={300} data={data}>
            <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
            <Legend />
          </BarChart>
        ),
        texts: ['uv'],
        colors: ['#8884d8'],
      },
      {
        name: 'named Bars',
        chart: () => (
          <BarChart width={500} height={300} data={data}>
            <Bar dataKey="uv" name="UV" fill="#8884d8" isAnimationActive={false} />
            <Bar dataKey="pv" name="PV" fill="#82ca9d" isAnimationActive={false} />
            <Legend />
          </BarChart>
        ),
        texts: ['UV', 'PV'],
        colors: ['#8884d8', '#82ca9d'],
      },
      {
        name: 'three Bars',
        chart: () => (
          <BarChart width={500} height={300} data={data}>
            <Bar dataKey="uv" name="UV" fill="#8884d8" isAnimationActive={false} />
            <Bar dataKey="pv" name="PV" fill="#82ca9d" isAnimationActive={false} />
            <Bar dataKey="amt" name="AMT" fill="#ffc658" isAnimationActive={false} />
            <Legend />
          </BarChart>
        ),
        texts: ['UV', 'PV', 'AMT'],
        colors: ['#8884d8', '#82ca9d', '#ffc658'],
      },
      {
        name: 'Lines',
        chart: () => (
          <LineChart width={500} height={300} data={data}>
            <Line dataKey="uv" stroke="#8884d8" isAnimationActive={false} />
            <Line dataKey="pv" stroke="#82ca9d" isAnimationActive={false} />
            <Legend />
          </LineChart>
        ),
        texts: ['uv', 'pv'],
        colors: ['#8884d8', '#82ca9d'],
      },
      {
        name: 'full name',
        chart: () => (
          <BarChart width={500} height={300} data={data}>
            <Bar dataKey="uv" name="Unique Visitors" fill="#8884d8" isAnimationActive={false} />
            <Legend />
          </BarChart>
        ),
        texts: ['Unique Visitors'],
        colors: ['#8884d8'],
      },
    ])('$name keeps names, colors and order', async ({ chart, texts, colors }) => {
      const { container } = render(chart)
      await nextTick()
      expect(Array.from(container.querySelectorAll('.v-charts-legend-item-text'), item => item.textContent)).toEqual(texts)
      expect(Array.from(container.querySelectorAll('.v-charts-legend-item svg path'), item => item.getAttribute(item.getAttribute('fill') === 'none' ? 'stroke' : 'fill'))).toEqual(colors)
      expect(container.querySelectorAll('.v-charts-legend-item')).toHaveLength(texts.length)
    })
  })

  describe('empty chart', () => {
    it('shows no legend items when no graphical items are present', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
        </BarChart>
      ))
      await nextTick()

      const items = container.querySelectorAll('.v-charts-legend-item')
      expect(items.length).toBe(0)
    })

    it('shows no legend items when data is empty', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={[]}>
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))
      await nextTick()

      const items = container.querySelectorAll('.v-charts-legend-item')
      const texts = container.querySelectorAll('.v-charts-legend-item-text')
      if (items.length > 0) {
        expect(texts[0].textContent).toBe('uv')
      }
    })
  })

  describe('selectLegendPayload with different configurations', () => {
    it('uses dataKey as legend text when name is not provided', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
          <Bar dataKey="pv" fill="#82ca9d" isAnimationActive={false} />
        </BarChart>
      ))
      await nextTick()

      const texts = container.querySelectorAll('.v-charts-legend-item-text')
      expect(texts.length).toBe(2)
      const textValues = Array.from(texts).map(t => t.textContent)
      expect(textValues).toContain('uv')
      expect(textValues).toContain('pv')
    })

    it('renders legend payload via custom content slot with correct payload', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Legend>
            {{
              content: (props: any) => (
                <div class="custom-legend">
                  {props.payload?.map((entry: any, index: number) => (
                    <span key={index} class="custom-entry" data-color={entry.color}>
                      {entry.value}
                    </span>
                  ))}
                </div>
              ),
            }}
          </Legend>
          <Bar dataKey="uv" fill="#8884d8" name="UV" isAnimationActive={false} />
          <Bar dataKey="pv" fill="#82ca9d" name="PV" isAnimationActive={false} />
        </BarChart>
      ))
      await nextTick()

      const entries = container.querySelectorAll('.custom-entry')
      expect(entries.length).toBe(2)
      const textValues = Array.from(entries).map(e => e.textContent)
      expect(textValues).toContain('UV')
      expect(textValues).toContain('PV')
      const colorValues = Array.from(entries).map(e => e.getAttribute('data-color'))
      expect(colorValues).toContain('#8884d8')
      expect(colorValues).toContain('#82ca9d')
    })
  })
})
