import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Tooltip } from '@/components/Tooltip'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
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
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 600, height: 400 })
  })

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

  it('fires onClick with type "node" when a node is clicked', async () => {
    const onClick = vi.fn()
    const { container } = render(() => (
      <Sankey data={sampleData} width={600} height={400} isAnimationActive={false} onClick={onClick} />
    ))
    const node = container.querySelector('.v-charts-sankey-node')!
    await fireEvent.click(node)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][1]).toBe('node')
  })

  it('fires onClick with type "link" when a link is clicked', async () => {
    const onClick = vi.fn()
    const { container } = render(() => (
      <Sankey data={sampleData} width={600} height={400} isAnimationActive={false} onClick={onClick} />
    ))
    const link = container.querySelector('.v-charts-sankey-link')!
    await fireEvent.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][1]).toBe('link')
  })

  it('shows tooltip with node payload on node hover', async () => {
    const { container, getByText } = render(() => (
      <Sankey data={sampleData} width={600} height={400} isAnimationActive={false}>
        <Tooltip />
      </Sankey>
    ))

    const wrapper = container.querySelector('.v-charts-wrapper')!
    const firstNode = container.querySelector('.v-charts-sankey-node')!
    await fireEvent(firstNode, new MouseEvent('mouseenter', { bubbles: true }))
    await fireEvent(wrapper, new MouseEvent('mousemove', { bubbles: true, clientX: 50, clientY: 50 }))
    await nextTick()
    await nextTick()

    expect(getByText('A')).toBeTruthy()
  })

  it('shows tooltip with link payload on link hover', async () => {
    const { container, getByText } = render(() => (
      <Sankey data={sampleData} width={600} height={400} isAnimationActive={false}>
        <Tooltip />
      </Sankey>
    ))

    const wrapper = container.querySelector('.v-charts-wrapper')!
    const firstLink = container.querySelector('.v-charts-sankey-link')!
    await fireEvent(firstLink, new MouseEvent('mouseenter', { bubbles: true }))
    await fireEvent(wrapper, new MouseEvent('mousemove', { bubbles: true, clientX: 200, clientY: 200 }))
    await nextTick()
    await nextTick()

    expect(getByText('A - B')).toBeTruthy()
  })
})
