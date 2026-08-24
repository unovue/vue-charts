import { fireEvent, render } from '@testing-library/vue'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import { computeTreemapLayout } from '../treemapUtils'
import { Treemap } from '../Treemap'

const flatData = [
  { name: 'A', value: 100 },
  { name: 'B', value: 200 },
  { name: 'C', value: 300 },
]

const nestedData = [
  {
    name: 'Group1',
    children: [
      { name: 'A', value: 100 },
      { name: 'B', value: 200 },
    ],
  },
  {
    name: 'Group2',
    children: [
      { name: 'C', value: 300 },
    ],
  },
]

describe('computeTreemapLayout', () => {
  it('computes layout for flat data', () => {
    const nodes = computeTreemapLayout({
      data: flatData,
      width: 600,
      height: 400,
      dataKey: 'value',
    })

    expect(nodes).toHaveLength(3)
    for (const node of nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0)
      expect(node.y).toBeGreaterThanOrEqual(0)
      expect(node.width).toBeGreaterThan(0)
      expect(node.height).toBeGreaterThan(0)
      expect(node.x + node.width).toBeLessThanOrEqual(600)
      expect(node.y + node.height).toBeLessThanOrEqual(400)
    }

    const totalArea = nodes.reduce((sum, n) => sum + n.width * n.height, 0)
    expect(totalArea).toBeCloseTo(600 * 400, -1)
  })

  it('computes layout for nested data and returns leaf nodes', () => {
    const nodes = computeTreemapLayout({
      data: nestedData,
      width: 600,
      height: 400,
      dataKey: 'value',
    })

    expect(nodes).toHaveLength(3)
    const names = nodes.map(n => n.name).sort()
    expect(names).toEqual(['A', 'B', 'C'])
  })

  it('assigns depth >= 1 to all nodes', () => {
    const nodes = computeTreemapLayout({
      data: nestedData,
      width: 600,
      height: 400,
      dataKey: 'value',
    })

    for (const node of nodes) {
      expect(node.depth).toBeGreaterThanOrEqual(1)
    }
  })

  it('returns empty array for empty data', () => {
    expect(computeTreemapLayout({ data: [], width: 600, height: 400, dataKey: 'value' })).toEqual([])
    expect(computeTreemapLayout({ data: flatData, width: 0, height: 400, dataKey: 'value' })).toEqual([])
    expect(computeTreemapLayout({ data: flatData, width: 600, height: 0, dataKey: 'value' })).toEqual([])
  })

  it('produces proportional areas matching values', () => {
    const nodes = computeTreemapLayout({
      data: flatData,
      width: 600,
      height: 400,
      dataKey: 'value',
    })

    const areaByName: Record<string, number> = {}
    for (const node of nodes) {
      areaByName[node.name] = node.width * node.height
    }

    // C (300) should be ~3x A (100)
    const ratio = areaByName.C / areaByName.A
    expect(ratio).toBeCloseTo(3, 0)
  })
})

describe('Treemap component', () => {
  it('renders rect elements for each leaf node', () => {
    const { container } = render(() => (
      <Treemap data={flatData} dataKey="value" width={600} height={400} isAnimationActive={false} />
    ))

    const nodes = container.querySelectorAll('.v-charts-treemap-node')
    expect(nodes).toHaveLength(3)
  })

  it('renders nothing with empty data', () => {
    const { container } = render(() => (
      <Treemap data={[]} dataKey="value" width={600} height={400} isAnimationActive={false} />
    ))

    const treemap = container.querySelector('.v-charts-treemap')
    expect(treemap).toBeNull()
  })

  it('renders nested data as leaf rects', () => {
    const { container } = render(() => (
      <Treemap data={nestedData} dataKey="value" width={600} height={400} isAnimationActive={false} />
    ))

    const nodes = container.querySelectorAll('.v-charts-treemap-node')
    expect(nodes).toHaveLength(3)
  })

  it('applies fill and stroke props', () => {
    const { container } = render(() => (
      <Treemap
        data={[{ name: 'X', value: 100 }]}
        dataKey="value"
        width={600}
        height={400}
        fill="#ff0000"
        stroke="#00ff00"
        colorPanel={undefined as any}
        isAnimationActive={false}
      />
    ))

    const rect = container.querySelector('.v-charts-treemap-node rect')
    expect(rect).not.toBeNull()
    expect(rect!.getAttribute('stroke')).toBe('#00ff00')
  })

  it('applies colorPanel to nodes by group', () => {
    const colors = ['#aaa', '#bbb']
    const { container } = render(() => (
      <Treemap
        data={nestedData}
        dataKey="value"
        width={600}
        height={400}
        colorPanel={colors}
        isAnimationActive={false}
      />
    ))

    const rects = container.querySelectorAll('.v-charts-treemap-node rect')
    expect(rects.length).toBe(3)

    const fills = Array.from(rects).map(r => r.getAttribute('fill'))
    // Group1 (A,B) should get colors[0], Group2 (C) should get colors[1]
    for (const fill of fills) {
      expect(colors).toContain(fill)
    }
  })

  it('renders custom content via #content slot', () => {
    const { container } = render(() => (
      <Treemap data={flatData} dataKey="value" width={600} height={400} isAnimationActive={false}>
        {{
          content: (props: any) => (
            <circle cx={props.x} cy={props.y} r={10} fill={props.fill} class="custom-node" />
          ),
        }}
      </Treemap>
    ))

    const customNodes = container.querySelectorAll('.custom-node')
    expect(customNodes).toHaveLength(3)

    const wrappers = container.querySelectorAll('.v-charts-treemap-node')
    expect(wrappers).toHaveLength(3)
  })
})

describe('tooltip integration', () => {
  it('supports Tooltip as child component', async () => {
    const { Tooltip } = await import('@/components/Tooltip')

    const { container } = render(() => (
      <Treemap data={flatData} dataKey="value" width={600} height={400} isAnimationActive={false}>
        <Tooltip />
      </Treemap>
    ))

    // ChartsWrapper should be rendered
    const wrapper = container.querySelector('.v-charts-wrapper')
    expect(wrapper).toBeTruthy()

    // Tooltip wrapper renders into portal (document.body or wrapper)
    await nextTick()
    await nextTick()
    const tooltipWrapper = document.body.querySelector('.v-charts-tooltip-wrapper')
      ?? container.querySelector('.v-charts-tooltip-wrapper')
    expect(tooltipWrapper).toBeTruthy()
  })
})

describe('nest mode', () => {
  const nestData = [
    {
      name: 'Group 1',
      children: [
        { name: 'A', value: 100 },
        { name: 'B', value: 200 },
      ],
    },
    {
      name: 'Group 2',
      children: [
        { name: 'C', value: 300 },
      ],
    },
  ]

  it('renders top-level groups initially', () => {
    const { container } = render(() => (
      <Treemap width={600} height={400} data={nestData} dataKey="value"
        type="nest" isAnimationActive={false} />
    ))
    const rects = container.querySelectorAll('.v-charts-treemap-node')
    expect(rects.length).toBe(2) // 2 top-level groups
  })

  it('drills down on click and shows breadcrumb', async () => {
    const { container } = render(() => (
      <Treemap width={600} height={400} data={nestData} dataKey="value"
        type="nest" isAnimationActive={false} />
    ))
    const firstGroup = container.querySelector('.v-charts-treemap-node')!
    await fireEvent.click(firstGroup)
    await nextTick()

    const rects = container.querySelectorAll('.v-charts-treemap-node')
    expect(rects.length).toBe(2) // A and B

    const breadcrumb = container.querySelector('.v-charts-treemap-breadcrumb')
    expect(breadcrumb).toBeTruthy()
  })

  it('navigates back via breadcrumb click', async () => {
    const { container } = render(() => (
      <Treemap width={600} height={400} data={nestData} dataKey="value"
        type="nest" isAnimationActive={false} />
    ))
    // Drill down
    const firstGroup = container.querySelector('.v-charts-treemap-node')!
    await fireEvent.click(firstGroup)
    await nextTick()

    // Click root breadcrumb
    const breadcrumbRoot = container.querySelector('.v-charts-treemap-breadcrumb-item')!
    await fireEvent.click(breadcrumbRoot)
    await nextTick()

    const rects = container.querySelectorAll('.v-charts-treemap-node')
    expect(rects.length).toBe(2) // back to 2 groups
  })
})
