import { fireEvent, render } from '@testing-library/vue'
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

  it('renders custom #node slot', () => {
    const { container } = render(() => (
      <Sankey data={sampleData} width={600} height={400} isAnimationActive={false}>
        {{
          node: ({ x, y, width, height, index }: any) => (
            <rect
              data-testid={`custom-node-${index}`}
              x={x}
              y={y}
              width={width}
              height={height}
              fill="red"
            />
          ),
        }}
      </Sankey>
    ))
    expect(container.querySelectorAll('[data-testid^="custom-node-"]')).toHaveLength(4)
  })

  it('renders custom #link slot', () => {
    const { container } = render(() => (
      <Sankey data={sampleData} width={600} height={400} isAnimationActive={false}>
        {{
          link: ({ d, index }: any) => (
            <path data-testid={`custom-link-${index}`} d={d} stroke="green" fill="none" />
          ),
        }}
      </Sankey>
    ))
    expect(container.querySelectorAll('[data-testid^="custom-link-"]')).toHaveLength(4)
  })

  it('respects nodeWidth prop', () => {
    const { container } = render(() => (
      <Sankey data={sampleData} width={600} height={400} nodeWidth={25} isAnimationActive={false} />
    ))
    const firstRect = container.querySelector('.v-charts-sankey-node rect')!
    expect(Number(firstRect.getAttribute('width'))).toBeCloseTo(25, 5)
  })
})
