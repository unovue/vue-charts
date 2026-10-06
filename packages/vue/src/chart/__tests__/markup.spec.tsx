import { render } from '@testing-library/vue'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import { Bar, BarChart, Brush, CartesianGrid, Heatmap, Label, Legend, Tooltip, XAxis, YAxis } from '@/index'

const data = [{ name: 'A', value: 12 }, { name: 'B', value: 18 }]

describe('chart markup contract', () => {
  it('marks the public parts of a cartesian chart', async () => {
    const { container } = render(() => (
      <BarChart width={400} height={300} data={data}>
        <CartesianGrid />
        <XAxis dataKey="name" />
        <YAxis />
        <Bar dataKey="value" isAnimationActive={false} />
        <Tooltip />
        <Legend />
        <Brush />
        <Label value="Values" />
      </BarChart>
    ))
    await nextTick()
    await nextTick()
    for (const slot of ['chart', 'surface', 'plot', 'grid', 'x-axis', 'y-axis', 'series', 'tooltip', 'legend', 'brush', 'label']) {
      expect(container.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull()
    }
    expect(container.querySelector('[data-recharts-item-index], [data-recharts-item-data-key]')).toBeNull()
  })

  it('marks the public parts of a cell chart', async () => {
    const { container } = render(() => (
      <Heatmap width={400} height={200} isAnimationActive={false} data={[{ x: 'A', y: 'B', value: 12 }]}>
        <Tooltip />
      </Heatmap>
    ))
    await nextTick()
    for (const slot of ['chart', 'surface', 'plot', 'series', 'cell', 'label', 'tooltip']) {
      expect(container.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull()
    }
    expect(container.querySelectorAll('[data-slot="cell"]')).toHaveLength(1)
  })
})
