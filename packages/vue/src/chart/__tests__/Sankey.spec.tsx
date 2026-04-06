import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { Sankey } from '../Sankey'

const sampleData = {
  nodes: [
    { name: 'A' },
    { name: 'B' },
    { name: 'C' },
    { name: 'D' },
  ],
  links: [
    { source: 0, target: 1, value: 10 },
    { source: 0, target: 2, value: 5 },
    { source: 1, target: 3, value: 6 },
    { source: 2, target: 3, value: 4 },
  ],
}

describe('<Sankey />', () => {
  it('renders one rect per node', () => {
    const { container } = render(() => (
      <Sankey data={sampleData} width={600} height={400} isAnimationActive={false} />
    ))
    const rects = container.querySelectorAll('.v-charts-sankey-node rect')
    expect(rects).toHaveLength(4)
  })

  it('renders one path per link', () => {
    const { container } = render(() => (
      <Sankey data={sampleData} width={600} height={400} isAnimationActive={false} />
    ))
    const paths = container.querySelectorAll('.v-charts-sankey-link')
    expect(paths).toHaveLength(4)
  })

  it('returns null when nodes are empty', () => {
    const { container } = render(() => (
      <Sankey data={{ nodes: [], links: [] }} width={600} height={400} />
    ))
    expect(container.querySelector('.v-charts-sankey')).toBeNull()
  })
})
