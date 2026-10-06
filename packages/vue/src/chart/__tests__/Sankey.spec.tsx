import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, shallowRef } from 'vue'
import { Tooltip } from '@/components/tooltip/Tooltip'
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

  it('attaches links to distinct indexed nodes with identical names', () => {
    const { container } = render(() => (
      <Sankey
        width={600}
        height={400}
        isAnimationActive={false}
        data={{ nodes: [{ name: 'A' }, { name: 'A' }, { name: 'sink' }], links: [{ source: 0, target: 2, value: 10 }, { source: 1, target: 2, value: 20 }] }}
        v-slots={{ link: ({ payload }) => <path data-source={(payload.source as { index: number }).index} data-target={(payload.target as { index: number }).index} /> }}
      />
    ))
    expect(Array.from(container.querySelectorAll('[data-source]'), node => node.getAttribute('data-source'))).toEqual(['0', '1'])
    expect(Array.from(container.querySelectorAll('[data-target]'), node => node.getAttribute('data-target'))).toEqual(['2', '2'])
    expect(container.querySelectorAll('.v-charts-sankey-node')).toHaveLength(3)
  })

  it('drops invalid graph links and recovers through good, invalid, and good updates', async () => {
    const data = shallowRef(sampleData)
    const errors: unknown[] = []
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const { container } = render(() => (
        <Sankey data={data.value} width={600} height={400} isAnimationActive={false} />
      ), { global: { config: { errorHandler: error => errors.push(error) } } })
      const paths = () => Array.from(container.querySelectorAll('.v-charts-sankey-link'), path => path.getAttribute('d'))
      const goodPaths = paths()
      expect(goodPaths).toHaveLength(4)

      data.value = {
        nodes: sampleData.nodes,
        links: [
          ...sampleData.links,
          { source: 99, target: 1, value: 5 },
          { source: 0, target: 99, value: 5 },
          { source: 0, target: 1, value: 0 },
          { source: 0, target: 1, value: -1 },
          { source: 0, target: 1, value: Number.POSITIVE_INFINITY },
          { source: 0, target: 1, value: Number.NEGATIVE_INFINITY },
          { source: 0, target: 1, value: Number.NaN },
          { source: 1, target: 1, value: 5 },
          { source: 3, target: 0, value: 5 },
        ],
      }
      await nextTick()
      expect(errors).toEqual([])
      expect(paths()).toEqual(goodPaths)
      expect(container.innerHTML).not.toMatch(/NaN|Infinity/)
      expect(warning).toHaveBeenCalledTimes(1)
      expect(warning).toHaveBeenCalledWith('Sankey dropped 9 invalid or cyclic links.')

      data.value = sampleData
      await nextTick()
      expect(errors).toEqual([])
      expect(paths()).toEqual(goodPaths)
    }
    finally {
      warning.mockRestore()
    }
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
      <Sankey data={sampleData} width={600} height={400} isAnimationActive={false} onNodeClick={onClick} />
    ))
    const node = container.querySelector('.v-charts-sankey-node')!
    await fireEvent.click(node)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][0]).toMatchObject({ name: 'A' })
    expect(onClick.mock.calls[0][1]).toBe(0)
    expect(onClick.mock.calls[0][2]).toBeInstanceOf(MouseEvent)
  })

  it('fires onClick with type "link" when a link is clicked', async () => {
    const onClick = vi.fn()
    const { container } = render(() => (
      <Sankey data={sampleData} width={600} height={400} isAnimationActive={false} onLinkClick={onClick} />
    ))
    const link = container.querySelector('.v-charts-sankey-link')!
    await fireEvent.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][0]).toMatchObject({ value: 10 })
    expect(onClick.mock.calls[0][1]).toBe(0)
    expect(onClick.mock.calls[0][2]).toBeInstanceOf(MouseEvent)
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
