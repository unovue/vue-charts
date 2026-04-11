import { fireEvent, render } from '@testing-library/vue'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { SunburstChart } from '../SunburstChart'
import { Tooltip } from '@/components'

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

describe('SunburstChart', () => {
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
    expect(onClick.mock.calls[0][0]).toHaveProperty('name')
  })

  it('fires onMouseEnter and onMouseLeave', async () => {
    const onMouseEnter = vi.fn()
    const onMouseLeave = vi.fn()
    const { container } = render(() => (
      <SunburstChart
        data={simpleData}
        width={500}
        height={500}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    ))

    const sector = container.querySelector('.v-charts-sunburst-sector')!
    await fireEvent.mouseEnter(sector)
    expect(onMouseEnter).toHaveBeenCalledTimes(1)

    await fireEvent.mouseLeave(sector)
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
