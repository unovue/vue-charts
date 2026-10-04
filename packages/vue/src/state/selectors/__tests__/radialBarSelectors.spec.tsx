import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { RadialBarChart } from '@/chart/RadialBarChart'
import { RadialBar } from '@/polar/radial-bar/RadialBar'

describe('radialBarSelectors', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: '18-24', uv: 31.47, fill: '#8884d8' },
    { name: '25-29', uv: 26.69, fill: '#83a6ed' },
    { name: '30-34', uv: 15.69, fill: '#8dd1e1' },
    { name: '35-39', uv: 8.22, fill: '#82ca9d' },
  ]

  function getSectors(container: Element): NodeListOf<Element> {
    return container.querySelectorAll('.v-charts-sector')
  }

  function getSectorPaths(container: Element): Element[] {
    return Array.from(getSectors(container)).map((s) => {
      const path = s.querySelector('path')
      return path ?? s
    })
  }

  it('computes radial bar sectors correctly for data', () => {
    const { container } = render(() => (
      <RadialBarChart
        width={500}
        height={500}
        cx={250}
        cy={250}
        innerRadius={40}
        outerRadius={200}
        barSize={20}
        data={data}
      >
        <RadialBar dataKey="uv" isAnimationActive={false} />
      </RadialBarChart>
    ))

    const sectors = getSectors(container)
    // One sector per data entry
    expect(sectors.length).toBe(4)

    // Each sector should have a valid arc path
    const paths = getSectorPaths(container)
    paths.forEach((path) => {
      const d = path.getAttribute('d')
      expect(d).toBeTruthy()
      // Arc command 'A' should appear in sector paths
      expect(d).toContain('A')
    })
  })

  it('renders background sectors when background prop is set', () => {
    const { container } = render(() => (
      <RadialBarChart
        width={500}
        height={500}
        cx={250}
        cy={250}
        innerRadius={40}
        outerRadius={200}
        barSize={20}
        data={data}
      >
        <RadialBar background dataKey="uv" isAnimationActive={false} />
      </RadialBarChart>
    ))

    // Background sectors rendered with fill="var(--v-charts-muted, #eee)"
    const bgSectors = container.querySelectorAll('.v-charts-sector[fill="var(--v-charts-muted, #eee)"]')
    expect(bgSectors.length).toBe(4)

    // Foreground sectors should also exist
    const allSectors = container.querySelectorAll('.v-charts-sector')
    // 4 foreground + 4 background = 8 total
    expect(allSectors.length).toBe(8)
  })

  it('creates concentric rings for multiple data entries', () => {
    const { container } = render(() => (
      <RadialBarChart
        width={500}
        height={500}
        cx={250}
        cy={250}
        innerRadius={40}
        outerRadius={200}
        barSize={20}
        data={data}
      >
        <RadialBar dataKey="uv" isAnimationActive={false} />
      </RadialBarChart>
    ))

    const sectors = getSectors(container)
    expect(sectors.length).toBe(4)

    // Each sector should have its own arc path (different angular extents based on uv values)
    const paths = Array.from(sectors).map((s) => {
      const p = s.querySelector('path')
      return (p ?? s).getAttribute('d')
    })

    // Data values [31.47, 26.69, 15.69, 8.22] are all different, so arcs differ
    const unique = new Set(paths.filter(Boolean))
    expect(unique.size).toBeGreaterThanOrEqual(2)
  })

  it('respects custom startAngle and endAngle', () => {
    const { container: container1 } = render(() => (
      <RadialBarChart
        width={500}
        height={500}
        cx={250}
        cy={250}
        innerRadius={40}
        outerRadius={200}
        barSize={20}
        data={data}
        startAngle={180}
        endAngle={0}
      >
        <RadialBar dataKey="uv" isAnimationActive={false} />
      </RadialBarChart>
    ))

    const { container: container2 } = render(() => (
      <RadialBarChart
        width={500}
        height={500}
        cx={250}
        cy={250}
        innerRadius={40}
        outerRadius={200}
        barSize={20}
        data={data}
        startAngle={0}
        endAngle={360}
      >
        <RadialBar dataKey="uv" isAnimationActive={false} />
      </RadialBarChart>
    ))

    const paths1 = getSectorPaths(container1)
    const paths2 = getSectorPaths(container2)

    expect(paths1.length).toBe(4)
    expect(paths2.length).toBe(4)

    // Different angle ranges should produce different arc paths
    const d1 = paths1[0].getAttribute('d')
    const d2 = paths2[0].getAttribute('d')
    expect(d1).not.toBe(d2)
  })

  it('renders fewer sectors with fewer data entries', () => {
    const smallData = data.slice(0, 2) // only 2 entries
    const { container } = render(() => (
      <RadialBarChart
        width={500}
        height={500}
        cx={250}
        cy={250}
        innerRadius={40}
        outerRadius={200}
        barSize={20}
        data={smallData}
      >
        <RadialBar dataKey="uv" isAnimationActive={false} />
      </RadialBarChart>
    ))

    const sectors = getSectors(container)
    expect(sectors.length).toBe(2)
  })
})
