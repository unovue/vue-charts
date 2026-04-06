import { describe, expect, it } from 'vitest'
import { computeSankeyLayout } from '../sankeyUtils'

const sample = {
  nodes: [
    { name: 'A' },
    { name: 'B' },
    { name: 'C' },
  ],
  links: [
    { source: 0, target: 1, value: 10 },
    { source: 1, target: 2, value: 6 },
  ],
}

describe('computeSankeyLayout', () => {
  it('returns nodes with x0/x1/y0/y1 coordinates within bounds', () => {
    const { nodes } = computeSankeyLayout({
      data: sample,
      width: 600,
      height: 400,
      nodePadding: 10,
      nodeWidth: 10,
      iterations: 32,
      margin: { top: 5, right: 5, bottom: 5, left: 5 },
    })

    expect(nodes).toHaveLength(3)
    for (const n of nodes) {
      expect(n.x0).toBeGreaterThanOrEqual(5)
      expect(n.x1).toBeLessThanOrEqual(595)
      expect(n.y0).toBeGreaterThanOrEqual(5)
      expect(n.y1).toBeLessThanOrEqual(395)
      expect(n.x1 - n.x0).toBeCloseTo(10, 5)
    }
  })

  it('returns links with width and bezier control coordinates', () => {
    const { links } = computeSankeyLayout({
      data: sample,
      width: 600,
      height: 400,
      nodePadding: 10,
      nodeWidth: 10,
      iterations: 32,
      margin: { top: 5, right: 5, bottom: 5, left: 5 },
    })

    expect(links).toHaveLength(2)
    expect(links[0].width).toBeGreaterThan(0)
    expect(links[0].source).toBeTypeOf('object')
    expect(links[0].target).toBeTypeOf('object')
  })

  it('does not mutate the input data', () => {
    const data = {
      nodes: [{ name: 'A' }, { name: 'B' }],
      links: [{ source: 0, target: 1, value: 5 }],
    }
    const snapshot = JSON.stringify(data)
    computeSankeyLayout({
      data,
      width: 600,
      height: 400,
      nodePadding: 10,
      nodeWidth: 10,
      iterations: 32,
      margin: { top: 5, right: 5, bottom: 5, left: 5 },
    })
    expect(JSON.stringify(data)).toBe(snapshot)
  })
})
