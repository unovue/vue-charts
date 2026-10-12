import { fireEvent, render } from '@testing-library/vue'
import { nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { PolarGrid, RadialBar, RadialBarChart, Tooltip } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const data = [
  { name: '18-24', uv: 31.47, pv: 2400, fill: '#8884d8' },
  { name: '25-29', uv: 26.69, pv: 4567, fill: '#83a6ed' },
  { name: '30-34', uv: 15.69, pv: 1398, fill: '#8dd1e1' },
  { name: '35-39', uv: 8.22, pv: 9800, fill: '#82ca9d' },
  { name: '40-49', uv: 8.63, pv: 3908, fill: '#a4de6c' },
  { name: '50+', uv: 2.63, pv: 4800, fill: '#d0ed57' },
  { name: 'unknown', uv: 6.67, pv: 4800, fill: '#ffc658' },
]

describe('radialBar', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  describe('basic rendering', () => {
    it('positions item tooltips on the selected sector for hover and click', async () => {
      const trigger = ref<'hover' | 'click'>('hover')
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
          <Tooltip shared={false} trigger={trigger.value} isAnimationActive={false}>
            {{ content: ({ coordinate, payload }) => (
              <div data-testid="radial-tooltip">
                {`${coordinate ? 'positioned' : 'unpositioned'}:${payload[0]?.value}`}
              </div>
            ) }}
          </Tooltip>
        </RadialBarChart>
      ))
      await nextTick()
      const sectors = container.querySelectorAll('.v-charts-radial-bar .v-charts-sector')
      for (const scenario of [
        { trigger: 'hover' as const, index: 0, value: 'positioned:31.47' },
        { trigger: 'click' as const, index: 1, value: 'positioned:26.69' },
      ]) {
        trigger.value = scenario.trigger
        await nextTick()
        if (scenario.trigger === 'hover')
          await fireEvent.mouseEnter(sectors[scenario.index])
        else
          await fireEvent.click(sectors[scenario.index])
        expect(container.querySelector('[data-testid="radial-tooltip"]')?.textContent)
          .toBe(scenario.value)
      }
    })

    // Wrong behaviour: a touched sector opens no item tooltip, because its series is looked up
    // by a data-key attribute that no element carries.
    it('opens the item tooltip of a touched sector', async () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
          <Tooltip shared={false} isAnimationActive={false}>
            {{ content: ({ payload }) => <div data-testid="radial-tooltip">{payload[0]?.value}</div> }}
          </Tooltip>
        </RadialBarChart>
      ))
      await nextTick()
      const sector = container.querySelectorAll('.v-charts-radial-bar [data-v-charts-item-index]')[1]!
      const elementFromPoint = document.elementFromPoint
      document.elementFromPoint = () => sector
      try {
        const event = new TouchEvent('touchmove', { bubbles: true })
        Object.defineProperty(event, 'touches', { value: [{ clientX: 250, clientY: 150, target: sector }] })
        container.querySelector('.v-charts-wrapper')!.dispatchEvent(event)
        await nextTick()
        await nextTick()
      }
      finally {
        document.elementFromPoint = elementFromPoint
      }
      expect(container.querySelector('[data-testid="radial-tooltip"]')?.textContent).toBe('26.69')
    })

    it('shows axis tooltips on painted sectors at the polar viewport edge', async () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} innerRadius={30} outerRadius={110} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
          <Tooltip isAnimationActive={false}>
            {{ content: ({ active, coordinate, payload }) => (
              <div data-testid="radial-axis-tooltip" data-y={coordinate?.y}>
                {`${active}:${payload[0]?.value}`}
              </div>
            ) }}
          </Tooltip>
        </RadialBarChart>
      ))
      await nextTick()
      const sector = container.querySelector('.v-charts-radial-bar .v-charts-sector')!
      for (const clientX of [285, 277]) {
        await fireEvent.mouseMove(sector, { clientX, clientY: 150 })
        const content = container.querySelector('[data-testid="radial-axis-tooltip"]')
        expect(content?.textContent).toBe('true:31.47')
        expect(content?.getAttribute('data-y')).toBe('150')
        expect(container.querySelector<HTMLElement>('.v-charts-tooltip-wrapper')?.style.visibility).toBe('visible')
      }
      await fireEvent.mouseMove(container.querySelector('.v-charts-wrapper')!, { clientX: 277, clientY: 150 })
      expect(container.querySelector<HTMLElement>('.v-charts-tooltip-wrapper')?.style.visibility).toBe('hidden')
    })

    // A setup-time size snapshot would leave the sectors at their original thickness.
    it('renders sectors and updates their thickness with the chart bar size', async () => {
      const barSize = ref(4)
      const clicked: { thickness: number, value: unknown, index: number }[] = []
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={barSize.value} data={data}>
          <RadialBar
            dataKey="uv"
            isAnimationActive={false}
            onClick={(sector, index) => clicked.push({
              thickness: sector.outerRadius! - sector.innerRadius!,
              value: sector.value,
              index,
            })}
          />
        </RadialBarChart>
      ))
      await nextTick()
      expect(container.querySelectorAll('.v-charts-sector')).toHaveLength(7)
      await fireEvent.click(container.querySelector('.v-charts-sector')!)
      barSize.value = 8
      await nextTick()
      await nextTick()
      expect(container.querySelectorAll('.v-charts-sector')).toHaveLength(7)
      await fireEvent.click(container.querySelector('.v-charts-sector')!)
      expect(clicked).toEqual([
        { thickness: 4, value: 31.47, index: 0 },
        { thickness: 8.000000000000002, value: 31.47, index: 0 },
      ])
    })

    it('accepts custom transition prop', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} transition={{ duration: 0.2, ease: 'linear' }} />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-sector').length).toBe(7)
    })

    it('renders no sectors when no RadialBar is added', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data} />
      ))
      expect(container.querySelectorAll('.v-charts-sector').length).toBe(0)
    })

    it('renders no sectors when width is 0', () => {
      const { container } = render(() => (
        <RadialBarChart width={0} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-sector').length).toBe(0)
    })

    it('renders no sectors when height is 0', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={0} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-sector').length).toBe(0)
    })

    it('renders sectors when barSize is not specified', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-sector').length).toBe(7)
    })

    it('renders sectors with valid arc paths', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      const sectorPaths = container.querySelectorAll('.v-charts-sector path')
      sectorPaths.forEach((sector) => {
        const d = sector.getAttribute('d')
        expect(d).toBeTruthy()
        expect(d).toContain('A')
      })
    })
  })

  describe('background prop', () => {
    it('renders background arcs when background is true', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar background dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      const backgroundSectors = container.querySelectorAll('.v-charts-sector[fill="var(--v-charts-muted, #eee)"]')
      expect(backgroundSectors.length).toBe(7)
    })

    it('renders background with custom class', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar background={{ class: 'test-custom-background' }} dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.test-custom-background').length).toBe(7)
    })
  })

  describe('hide prop', () => {
    it('renders no sectors when hide is true', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar dataKey="uv" hide isAnimationActive={false} />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-radial-bar').length).toBe(0)
    })
  })

  describe('cornerRadius', () => {
    it('renders sectors with cornerRadius applied', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar dataKey="uv" cornerRadius={5} isAnimationActive={false} />
        </RadialBarChart>
      ))
      const sectors = container.querySelectorAll('.v-charts-sector')
      expect(sectors.length).toBe(7)
    })
  })

  describe('stacking', () => {
    const stackData = [
      { name: 'A', desktop: 1260, mobile: 570 },
    ]

    it('renders stacked sectors with stackId', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={80} outerRadius={130} data={stackData} endAngle={180}>
          <RadialBar dataKey="desktop" stackId="a" isAnimationActive={false} />
          <RadialBar dataKey="mobile" stackId="a" isAnimationActive={false} />
        </RadialBarChart>
      ))
      const radialBarLayers = container.querySelectorAll('.v-charts-radial-bar')
      expect(radialBarLayers.length).toBe(2)
    })
  })

  describe('empty data', () => {
    it('renders empty when data is empty', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={[]}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-sector').length).toBe(0)
    })
  })

  describe('with PolarGrid', () => {
    it('renders sectors alongside PolarGrid', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
          <PolarGrid gridType="circle" />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-sector').length).toBe(7)
      expect(container.querySelectorAll('.v-charts-polar-grid').length).toBe(1)
    })
  })

  describe('innerRadius and outerRadius', () => {
    it('renders with different innerRadius and outerRadius', () => {
      const { container } = render(() => (
        <RadialBarChart width={500} height={300} cx={150} cy={150} innerRadius={30} outerRadius={110} data={data}>
          <RadialBar dataKey="uv" isAnimationActive={false} />
        </RadialBarChart>
      ))
      expect(container.querySelectorAll('.v-charts-sector').length).toBe(7)
    })
  })
})
