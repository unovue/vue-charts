import { fireEvent, render } from '@testing-library/vue'
import { nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { SunburstChart } from '../SunburstChart'
import { computeSunburstLayout } from '../sunburstUtils'
import { Tooltip } from '@/components/tooltip/Tooltip'

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

describe('sunburstChart', () => {
  it('keeps all 10,000 positive sectors with default padding and at least half their angle', () => {
    const data = {
      name: 'root',
      children: Array.from({ length: 10_000 }, (_, index) => ({ name: `N${index}`, value: 1 })),
    }
    const nodes = computeSunburstLayout({ data, cx: 250, cy: 250, innerRadius: 50, outerRadius: 250, startAngle: 0, endAngle: 360, dataKey: 'value', padding: 2 })
    expect(nodes).toHaveLength(10_000)
    for (const node of nodes)
      expect(node.endAngle - node.startAngle).toBeCloseTo(0.018, 10)

    const rendered = { ...data, children: data.children.slice(0, 1000) }
    const { container } = render(() => <SunburstChart data={rendered} width={500} height={500} isAnimationActive={false} />)
    expect(container.querySelectorAll('.v-charts-sunburst-sector')).toHaveLength(1000)
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/)
  }, 120_000)

  it('keeps each sector element by name when the value order changes', async () => {
    const data = ref(simpleData)
    const { container } = render(() => <SunburstChart data={data.value} width={500} height={500} isAnimationActive={false} />)
    const sectors = () => [...container.querySelectorAll('.v-charts-sunburst-sector')]
    // Sorted by value: C, B, A.
    const [c, b, a] = sectors()
    data.value = { name: 'root', children: [{ name: 'A', value: 600 }, { name: 'B', value: 200 }, { name: 'C', value: 100 }] }
    await nextTick()
    expect(sectors()).toEqual([a, b, c])
  })

  it('renders sectors for simple data', () => {
    const { container } = render(() => (
      <SunburstChart data={simpleData} width={500} height={500} />
    ))

    const sectors = container.querySelectorAll('.v-charts-sunburst-sector')
    expect(sectors).toHaveLength(3)
  })

  it('renders sectors for nested data (all levels)', () => {
    const { container } = render(() => (
      <SunburstChart data={nestedData} width={500} height={500} />
    ))

    // Group1 + Group2 (depth 1) + A + B + C (depth 2)
    const sectors = container.querySelectorAll('.v-charts-sunburst-sector')
    expect(sectors).toHaveLength(5)
  })

  it('renders nothing with empty data', () => {
    const { container } = render(() => (
      <SunburstChart data={{ name: 'empty' }} width={500} height={500} />
    ))

    const sunburst = container.querySelector('.v-charts-sunburst')
    expect(sunburst).toBeNull()
  })

  it('fires onClick with node data', async () => {
    const onClick = vi.fn()
    const { container } = render(() => (
      <SunburstChart data={simpleData} width={500} height={500} onClick={onClick} />
    ))

    const sector = container.querySelector('.v-charts-sunburst-sector')!
    await fireEvent.click(sector)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][0]).toHaveProperty('activeIndex')
    expect(onClick.mock.calls[0][1]).toBeInstanceOf(MouseEvent)
  })

  it('fires onMouseEnter and onMouseLeave', async () => {
    const onMouseEnter = vi.fn()
    const onMouseLeave = vi.fn()
    const { container } = render(() => (
      <SunburstChart
        data={simpleData}
        width={500}
        height={500}
        onMouseenter={onMouseEnter}
        onMouseleave={onMouseLeave}
      />
    ))

    const sector = container.querySelector('.v-charts-sunburst-sector')!
    await fireEvent.mouseEnter(container.querySelector('.v-charts-wrapper')!)
    expect(onMouseEnter).toHaveBeenCalledTimes(1)

    await fireEvent.mouseLeave(container.querySelector('.v-charts-wrapper')!)
    expect(onMouseLeave).toHaveBeenCalledTimes(1)
  })

  it('renders custom content via #content slot', () => {
    const { container } = render(() => (
      <SunburstChart data={simpleData} width={500} height={500}>
        {{
          content: (props: any) => (
            <circle cx={props.cx} cy={props.cy} r={5} class="custom-sector" />
          ),
        }}
      </SunburstChart>
    ))

    const custom = container.querySelectorAll('.custom-sector')
    expect(custom).toHaveLength(3)
  })

  it('respects innerRadius and outerRadius', () => {
    const { container } = render(() => (
      <SunburstChart
        data={simpleData}
        width={500}
        height={500}
        innerRadius={100}
        outerRadius={200}
      />
    ))

    const sectors = container.querySelectorAll('.v-charts-sunburst-sector')
    expect(sectors).toHaveLength(3)
  })

  it('renders with tooltip as child', async () => {
    const { container } = render(() => (
      <SunburstChart data={simpleData} width={500} height={500}>
        <Tooltip />
      </SunburstChart>
    ))

    const sectors = container.querySelectorAll('.v-charts-sunburst-sector')
    expect(sectors).toHaveLength(3)

    // Hover a sector to trigger tooltip
    await fireEvent.mouseEnter(sectors[0])
    await nextTick()
    await nextTick()
  })
})
