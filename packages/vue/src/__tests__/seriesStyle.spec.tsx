import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import type { Component } from 'vue'
import { Area, AreaChart, Bar, BarChart, Cell, Funnel, FunnelChart, Legend, Line, LineChart, Pie, PieChart, PolarAngleAxis, Radar, RadarChart, RadialBar, RadialBarChart, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const data = [{ name: 'A', x: 1, value: 10 }, { name: 'B', x: 2, value: 20 }, { name: 'C', x: 3, value: 30 }]
const cellFills = ['orange', 'green', 'purple']

beforeEach(() => mockGetBoundingClientRect({ width: 500, height: 300 }))

function hoverAxis(container: Element) {
  container.querySelector('.v-charts-wrapper')!.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 100 }))
}
function hoverItem(selector: string) {
  return (container: Element) => container.querySelectorAll(selector)[1]!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
}

async function colours(container: Element, hover: (container: Element) => void) {
  await nextTick()
  hover(container)
  await nextTick()
  await nextTick()
  return {
    legend: [...container.querySelectorAll('.v-charts-legend-item path')].map(icon => icon.getAttribute('fill')),
    swatch: (container.querySelector('.v-charts-tooltip-swatch') as HTMLElement | null)?.style.background,
    dot: container.querySelector('.v-charts-active-dot circle')?.getAttribute('fill') ?? undefined,
  }
}

describe('series colour', () => {
  // A series is one colour everywhere: its legend icon, tooltip swatch and active dot.
  it.each([
    { name: 'Area', Chart: AreaChart, item: <Area dataKey="value" stroke="red" fill="blue" isAnimationActive={false} />, dot: true },
    { name: 'Area without stroke', Chart: AreaChart, item: <Area dataKey="value" stroke="none" fill="blue" isAnimationActive={false} />, dot: true },
    { name: 'Line', Chart: LineChart, item: <Line dataKey="value" stroke="red" isAnimationActive={false} />, dot: true },
    { name: 'Bar', Chart: BarChart, item: <Bar dataKey="value" stroke="blue" fill="red" isAnimationActive={false} />, dot: false },
    { name: 'Radar', Chart: RadarChart, item: <Radar dataKey="value" stroke="red" fill="blue" isAnimationActive={false} />, dot: true },
  ])('$name', async ({ Chart, item, dot, name }) => {
    const { container } = render(() => (
      <Chart width={500} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <PolarAngleAxis dataKey="name" />
        <Legend iconType="rect" />
        <Tooltip />
        {item}
      </Chart>
    ))
    const main = name === 'Area without stroke' ? 'blue' : 'red'
    expect(await colours(container, hoverAxis)).toEqual({ legend: [main], swatch: main, dot: dot ? main : undefined })
  })

  it('scatter', async () => {
    const { container } = render(() => (
      <ScatterChart width={500} height={300}>
        <XAxis dataKey="x" type="number" />
        <YAxis dataKey="value" />
        <Legend iconType="rect" />
        <Tooltip />
        <Scatter data={data} fill="red" isAnimationActive={false} />
      </ScatterChart>
    ))
    expect(await colours(container, hoverItem('.v-charts-scatter-symbol'))).toEqual({ legend: ['red'], swatch: 'red', dot: undefined })
  })

  // An entry is one colour everywhere: Cell fill, then row fill, then series fill, then palette.
  it.each<{ name: string, Chart: Component, Item: Component, selector: string, cells: boolean, props?: Record<string, unknown> }>([
    { name: 'Pie', Chart: PieChart, Item: Pie, selector: '.v-charts-pie > g', cells: false, props: { data: data.map((row, i) => ({ ...row, fill: cellFills[i] })) } },
    { name: 'Pie with Cell', Chart: PieChart, Item: Pie, selector: '.v-charts-pie > g', cells: true, props: { data } },
    { name: 'Funnel', Chart: FunnelChart, Item: Funnel, selector: '.v-charts-funnel > g', cells: false, props: { data: data.map((row, i) => ({ ...row, fill: cellFills[i] })) } },
    { name: 'Funnel with Cell', Chart: FunnelChart, Item: Funnel, selector: '.v-charts-funnel > g', cells: true, props: { data } },
  ])('$name', async ({ Chart, Item, selector, cells, props }) => {
    const { container } = render(() => (
      <Chart width={500} height={300}>
        <Legend iconType="rect" />
        <Tooltip />
        <Item dataKey="value" nameKey="name" isAnimationActive={false} {...props}>
          {cells ? cellFills.map(fill => <Cell fill={fill} />) : null}
        </Item>
      </Chart>
    ))
    expect(await colours(container, hoverItem(selector))).toEqual({ legend: cellFills, swatch: 'green', dot: undefined })
  })

  it('radialBar', async () => {
    const { container } = render(() => (
      <RadialBarChart width={500} height={300} data={data.map((row, i) => ({ ...row, fill: cellFills[i] }))}>
        <Legend iconType="rect" />
        <Tooltip />
        <RadialBar dataKey="value" isAnimationActive={false} />
      </RadialBarChart>
    ))
    expect(await colours(container, hoverItem('.v-charts-radial-bar > .v-charts-sector'))).toEqual({ legend: cellFills, swatch: 'green', dot: undefined })
  })
})

describe('series class and attributes', () => {
  // `class` styles the series layer once, whatever the series type.
  it.each([
    { name: 'Area', Chart: AreaChart, Item: Area },
    { name: 'Line', Chart: LineChart, Item: Line },
    { name: 'Bar', Chart: BarChart, Item: Bar },
    { name: 'Scatter', Chart: ScatterChart, Item: Scatter },
    { name: 'Pie', Chart: PieChart, Item: Pie },
    { name: 'Radar', Chart: RadarChart, Item: Radar },
    { name: 'RadialBar', Chart: RadialBarChart, Item: RadialBar },
    { name: 'Funnel', Chart: FunnelChart, Item: Funnel },
  ])('$name puts class on its series layer only', async ({ Chart, Item }) => {
    const { container } = render(() => (
      <Chart width={500} height={300} data={data}>
        <XAxis dataKey="x" type="number" />
        <YAxis dataKey="value" />
        <PolarAngleAxis dataKey="name" />
        <Item data={data} dataKey="value" class="custom-series" isAnimationActive={false} />
      </Chart>
    ))
    await nextTick()
    const styled = container.querySelectorAll('.custom-series')
    expect(styled).toHaveLength(1)
    expect(styled[0].getAttribute('data-slot')).toBe('series')
  })

  it('area stroke="none" hides the outline', async () => {
    const { container } = render(() => (
      <AreaChart width={500} height={300} data={data}>
        <Area dataKey="value" stroke="none" isAnimationActive={false} />
      </AreaChart>
    ))
    await nextTick()
    expect(container.querySelector('.v-charts-area-area')).not.toBeNull()
    expect(container.querySelector('.v-charts-area-curve')).toBeNull()
  })

  // Undeclared attributes such as data-* and aria-* reach the series layer.
  it.each([
    { name: 'Bar', Chart: BarChart, Item: Bar },
    { name: 'Radar', Chart: RadarChart, Item: Radar },
    { name: 'RadialBar', Chart: RadialBarChart, Item: RadialBar },
  ])('$name forwards attributes to its series layer', async ({ Chart, Item }) => {
    const { container } = render(() => (
      <Chart width={500} height={300} data={data}>
        <XAxis dataKey="name" />
        <PolarAngleAxis dataKey="name" />
        <Item dataKey="value" data-testid="series" aria-label="Revenue" isAnimationActive={false} />
      </Chart>
    ))
    await nextTick()
    const series = container.querySelector('[data-testid="series"]')
    expect(series?.getAttribute('data-slot')).toBe('series')
    expect(series?.getAttribute('aria-label')).toBe('Revenue')
  })
})
