import { render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, beforeEach } from 'vitest'
import { PieChart } from '@/chart/PieChart'
import { Pie } from '@/polar/pie/Pie'
import { Animate } from '@/animation/Animate'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('Pie', () => {
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

  it('passes transition prop through to Animate', () => {
    const customTransition = { duration: 0.5, ease: 'linear' as const }
    const wrapper = mount(() => (
      <PieChart width={500} height={500}>
        <Pie dataKey="value" data={data} outerRadius={200} transition={customTransition} />
      </PieChart>
    ))
    const animate = wrapper.findComponent(Animate)
    expect(animate.exists()).toBe(true)
    expect(animate.props('transition')).toEqual(customTransition)
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
})
