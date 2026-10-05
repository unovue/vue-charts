import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { PieChart } from '@/chart/PieChart'
import { Pie } from '@/polar/pie/Pie'
import { Cell } from '@/components/Cell'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('pie', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: 'Email', value: 90, fill: '#8884d8' },
    { name: 'Social Media', value: 90, fill: '#a683ed' },
    { name: 'Phone', value: 90, fill: '#e18dd1' },
    { name: 'Web chat', value: 90, fill: '#82ca9d' },
  ]

  it('renders pie sectors in a PieChart', () => {
    const { container } = render({
      components: { PieChart, Pie },
      template: `
        <PieChart :width="500" :height="500">
          <Pie dataKey="value" :data="data" :outerRadius="200" :isAnimationActive="false" />
        </PieChart>
      `,
      setup() { return { data } },
    })
    const sectors = container.querySelectorAll('.v-charts-sector')
    expect(sectors.length).toBe(4)
  })

  it('applies fill from data items', () => {
    const { container } = render({
      components: { PieChart, Pie },
      template: `
        <PieChart :width="500" :height="500">
          <Pie dataKey="value" :data="data" :outerRadius="200" :isAnimationActive="false" />
        </PieChart>
      `,
      setup() { return { data } },
    })
    const paths = container.querySelectorAll('.v-charts-sector')
    expect(paths[0].getAttribute('fill')).toBe('#8884d8')
    expect(paths[1].getAttribute('fill')).toBe('#a683ed')
  })

  it('cell fill overrides data item and Pie fill', () => {
    const cellColors = ['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']
    const { container } = render({
      components: { PieChart, Pie, Cell },
      template: `
        <PieChart :width="500" :height="500">
          <Pie dataKey="value" :data="data" :outerRadius="200" fill="#000000" :isAnimationActive="false">
            <Cell v-for="(c, i) in cellColors" :key="i" :fill="c" />
          </Pie>
        </PieChart>
      `,
      setup() { return { data, cellColors } },
    })
    const paths = container.querySelectorAll('.v-charts-sector')
    expect(paths.length).toBe(4)
    cellColors.forEach((c, i) => {
      expect(paths[i].getAttribute('fill')).toBe(c)
    })
  })

  it('accepts custom transition prop', () => {
    const customTransition = { duration: 0.3, ease: 'linear' as const }
    const { container } = render({
      components: { PieChart, Pie },
      template: `
        <PieChart :width="500" :height="500">
          <Pie dataKey="value" :data="data" :outerRadius="200" :isAnimationActive="false" :transition="transition" />
        </PieChart>
      `,
      setup() { return { data, transition: customTransition } },
    })
    expect(container.querySelectorAll('.v-charts-sector').length).toBe(4)
  })

  it('renders nothing when data is empty', () => {
    const { container } = render({
      components: { PieChart, Pie },
      template: `
        <PieChart :width="500" :height="500">
          <Pie dataKey="value" :data="[]" :outerRadius="200" :isAnimationActive="false" />
        </PieChart>
      `,
    })
    expect(container.querySelectorAll('.v-charts-sector').length).toBe(0)
  })

  it.each([
    // A label's anchor slides by a share of its width near the vertical instead of jumping.
    { endAngle: 182, anchor: 'start', transform: 'translateX(-74%)' },
    { endAngle: 180, anchor: 'middle', transform: '' },
    { endAngle: 60, anchor: 'start', transform: '' },
    { endAngle: 300, anchor: 'end', transform: '' },
  ])('anchors a label ending at $endAngle° as $anchor $transform', ({ endAngle, anchor, transform }) => {
    const { container } = render(() => (
      <PieChart width={500} height={500}>
        <Pie dataKey="value" data={[{ value: 1 }]} startAngle={0} endAngle={endAngle} outerRadius={200} label isAnimationActive={false} />
      </PieChart>
    ))
    const text = container.querySelector('.v-charts-pie text') as SVGTextElement
    expect(text.getAttribute('text-anchor')).toBe(anchor)
    expect(text.style.transform).toBe(transform)
  })
})
