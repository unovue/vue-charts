import { describe, expect, it } from 'vitest'
import { computeSunburstLayout } from '../sunburstUtils'

const simpleData = {
  name: 'root',
  children: [
    { name: 'A', value: 100 },
    { name: 'B', value: 200 },
    { name: 'C', value: 300 },
  ],
}

const nestedData = {
  name: 'root',
  children: [
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
  ],
}

describe('computeSunburstLayout', () => {
  it('computes layout for simple data (1 level of children)', () => {
    const nodes = computeSunburstLayout({
      data: simpleData,
      cx: 300,
      cy: 200,
      innerRadius: 50,
      outerRadius: 200,
      startAngle: 0,
      endAngle: 360,
      dataKey: 'value',
    })

    // Root is excluded; only A, B, C rendered
    expect(nodes).toHaveLength(3)
    for (const node of nodes) {
      expect(node.innerRadius).toBeGreaterThanOrEqual(50)
      expect(node.outerRadius).toBeLessThanOrEqual(200)
      expect(node.startAngle).toBeGreaterThanOrEqual(0)
      expect(node.endAngle).toBeLessThanOrEqual(360)
      expect(node.depth).toBe(1)
    }
  })

  it('computes layout for nested data (2 levels)', () => {
    const nodes = computeSunburstLayout({
      data: nestedData,
      cx: 300,
      cy: 200,
      innerRadius: 50,
      outerRadius: 200,
      startAngle: 0,
      endAngle: 360,
      dataKey: 'value',
    })

    // Group1, Group2 (depth 1) + A, B, C (depth 2) = 5 nodes
    expect(nodes).toHaveLength(5)
    const depth1 = nodes.filter(n => n.depth === 1)
    const depth2 = nodes.filter(n => n.depth === 2)
    expect(depth1).toHaveLength(2)
    expect(depth2).toHaveLength(3)
  })

  it('assigns angular proportions based on value', () => {
    const nodes = computeSunburstLayout({
      data: simpleData,
      cx: 300,
      cy: 200,
      innerRadius: 50,
      outerRadius: 200,
      startAngle: 0,
      endAngle: 360,
      dataKey: 'value',
    })

    // C (300) should span 3x the angle of A (100)
    const nodeA = nodes.find(n => n.name === 'A')!
    const nodeC = nodes.find(n => n.name === 'C')!
    const angleA = nodeA.endAngle - nodeA.startAngle
    const angleC = nodeC.endAngle - nodeC.startAngle
    expect(angleC / angleA).toBeCloseTo(3, 0)
  })

  it('supports partial sunburst (startAngle/endAngle)', () => {
    const nodes = computeSunburstLayout({
      data: simpleData,
      cx: 300,
      cy: 200,
      innerRadius: 50,
      outerRadius: 200,
      startAngle: 0,
      endAngle: 180,
      dataKey: 'value',
    })

    for (const node of nodes) {
      expect(node.startAngle).toBeGreaterThanOrEqual(0)
      expect(node.endAngle).toBeLessThanOrEqual(180)
    }
  })

  it('returns empty array for data with no children', () => {
    const nodes = computeSunburstLayout({
      data: { name: 'empty' },
      cx: 300,
      cy: 200,
      innerRadius: 50,
      outerRadius: 200,
      startAngle: 0,
      endAngle: 360,
      dataKey: 'value',
    })
    expect(nodes).toEqual([])
  })

  it('includes fill from data nodes', () => {
    const colorData = {
      name: 'root',
      children: [
        { name: 'A', value: 100, fill: '#ff0000' },
        { name: 'B', value: 200 },
      ],
    }
    const nodes = computeSunburstLayout({
      data: colorData,
      cx: 300,
      cy: 200,
      innerRadius: 50,
      outerRadius: 200,
      startAngle: 0,
      endAngle: 360,
      dataKey: 'value',
    })

    const nodeA = nodes.find(n => n.name === 'A')!
    expect(nodeA.fill).toBe('#ff0000')
    const nodeB = nodes.find(n => n.name === 'B')!
    expect(nodeB.fill).toBeUndefined()
  })

  it('includes tooltipIndex path for each node', () => {
    const nodes = computeSunburstLayout({
      data: nestedData,
      cx: 300,
      cy: 200,
      innerRadius: 50,
      outerRadius: 200,
      startAngle: 0,
      endAngle: 360,
      dataKey: 'value',
    })

    // Each node should have a tooltipIndex like 'children[0]' or 'children[0].children[1]'
    for (const node of nodes) {
      expect(node.tooltipIndex).toMatch(/^children\[\d+\]/)
    }
  })

  it('tooltipIndex uses original data order, not sorted order', () => {
    // Values are NOT in sorted order — sort will reorder them
    const unsortedData = {
      name: 'root',
      children: [
        { name: 'Small', value: 10 },
        { name: 'Large', value: 300 },
        { name: 'Medium', value: 100 },
      ],
    }
    const nodes = computeSunburstLayout({
      data: unsortedData,
      cx: 200,
      cy: 200,
      innerRadius: 50,
      outerRadius: 200,
      startAngle: 0,
      endAngle: 360,
      dataKey: 'value',
    })

    // tooltipIndex must match original data order for get(data, path) to work
    const small = nodes.find(n => n.name === 'Small')!
    const large = nodes.find(n => n.name === 'Large')!
    const medium = nodes.find(n => n.name === 'Medium')!
    expect(small.tooltipIndex).toBe('children[0]') // original index 0
    expect(large.tooltipIndex).toBe('children[1]') // original index 1
    expect(medium.tooltipIndex).toBe('children[2]') // original index 2
  })
})
