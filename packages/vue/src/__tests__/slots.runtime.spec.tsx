import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { compileScript, parse } from 'vue/compiler-sfc'
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import * as Vue from 'vue'
import { nextTick } from 'vue'
import type { Component, VNode } from 'vue'
import ts from 'typescript'
import * as Vccs from '@/index'
import { Area, Bar, Brush, CalendarHeatmap, CartesianGrid, CohortChart, ComposedChart, Customized, Funnel, FunnelChart, Heatmap, Label, LabelList, Legend, Line, Pie, PieChart, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart, ReferenceArea, ReferenceDot, ReferenceLine, Sankey, Scatter, SunburstChart, Tooltip, Tracker, Treemap, XAxis, YAxis } from '@/index'

// Compile the unchanged docs SFCs against source exports, so this check also
// works in a fresh checkout where the published dist entry does not exist yet.
function docsDemo(name: string): Component {
  const source = readFileSync(resolve(`../../docs/app/charts/guide-charts/${name}.vue`), 'utf8')
  const { descriptor } = parse(source)
  const script = compileScript(descriptor, { id: name, inlineTemplate: true })
  const code = ts.transpileModule(script.content, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const exports: { default?: Component } = {}
  const modules = { vue: Vue, vccs: Vccs }
  const load = (name: string) => {
    if (!(name in modules))
      throw new Error(`Unexpected docs dependency: ${name}`)
    return modules[name]
  }
  // Vue's compiler output imports only Vue and the chart library for these demos.
  runInNewContext(code, { require: load, exports })
  return exports.default!
}

const data = [{ name: 'A', value: 10, x: 10 }, { name: 'B', value: 20, x: 20 }]
type Slot = (props?: unknown) => VNode
interface Row {
  component: string
  slot: string
  render: (slot: Slot) => VNode
  replaced?: string
  retained?: string
  standalone?: boolean
}
const rows: Row[] = [
  { component: 'XAxis', slot: 'tick', render: slot => <XAxis dataKey="name" v-slots={{ tick: slot }} />, replaced: '.v-charts-x-axis .v-charts-cartesian-axis-tick-value', retained: '.v-charts-x-axis .v-charts-cartesian-axis-tick-line' },
  { component: 'YAxis', slot: 'tick', render: slot => <YAxis v-slots={{ tick: slot }} />, replaced: '.v-charts-y-axis .v-charts-cartesian-axis-tick-value', retained: '.v-charts-y-axis .v-charts-cartesian-axis-tick-line' },
  { component: 'CartesianGrid', slot: 'horizontal', render: slot => <CartesianGrid v-slots={{ horizontal: slot }} />, replaced: '.v-charts-cartesian-grid-horizontal line' },
  { component: 'CartesianGrid', slot: 'vertical', render: slot => <CartesianGrid v-slots={{ vertical: slot }} />, replaced: '.v-charts-cartesian-grid-vertical line' },
  ...['default', 'shape', 'dot', 'activeDot', 'label'].map(slot => ({ component: 'Line', slot, render: (marker: Slot) => <Line dataKey="value" label isAnimationActive={false} v-slots={{ [slot]: marker }} />, replaced: ({ shape: '.v-charts-line-curve', dot: '.v-charts-line-dot', activeDot: '.v-charts-active-dot circle', label: '.v-charts-label-list .v-charts-label' })[slot] })),
  ...['dot', 'activeDot', 'label'].map(slot => ({ component: 'Area', slot, render: (marker: Slot) => <Area dataKey="value" dot label isAnimationActive={false} v-slots={{ [slot]: marker }} />, replaced: ({ dot: '.v-charts-area-dot', activeDot: '.v-charts-active-dot circle', label: '.v-charts-label-list .v-charts-label' })[slot] })),
  ...['default', 'shape', 'activeBar', 'label'].map(slot => ({ component: 'Bar', slot, render: (marker: Slot) => <Bar dataKey="value" label activeIndex={0} isAnimationActive={false} v-slots={{ [slot]: marker }} />, replaced: slot === 'shape' ? '.v-charts-bar-rectangle path' : slot === 'activeBar' ? '.v-charts-bar-rectangle:first-child path' : slot === 'label' ? '.v-charts-label-list .v-charts-label' : undefined })),
  ...['default', 'shape'].map(slot => ({ component: 'Scatter', slot, render: (marker: Slot) => <Scatter data={data} dataKey="value" isAnimationActive={false} v-slots={{ [slot]: marker }} />, replaced: slot === 'shape' ? '.v-charts-scatter-symbol path' : undefined })),
  ...['default', 'shape', 'activeShape', 'label'].map(slot => ({ component: 'Pie', slot, standalone: true, render: (marker: Slot) => <PieChart width={400} height={300}><Pie data={data} dataKey="value" activeIndex={0} label isAnimationActive={false} v-slots={{ [slot]: marker }} /></PieChart>, replaced: slot === 'shape' ? '.v-charts-pie path' : slot === 'activeShape' ? '.v-charts-pie > g:first-child path' : slot === 'label' ? '.v-charts-pie text' : undefined, retained: slot === 'label' ? '.v-charts-pie line' : undefined })),
  ...['default', 'shape'].map(slot => ({ component: 'Funnel', slot, standalone: true, render: (marker: Slot) => <FunnelChart width={400} height={300}><Funnel data={data} dataKey="value" isAnimationActive={false} v-slots={{ [slot]: marker }} /></FunnelChart>, replaced: slot === 'shape' ? '.v-charts-trapezoid' : undefined })),
  { component: 'ReferenceLine', slot: 'shape', render: slot => <ReferenceLine y={15} v-slots={{ shape: slot }} />, replaced: '.v-charts-reference-line-line' },
  { component: 'ReferenceArea', slot: 'shape', render: slot => <ReferenceArea y1={5} y2={15} v-slots={{ shape: slot }} />, replaced: '.v-charts-reference-area-rect' },
  { component: 'ReferenceDot', slot: 'shape', render: slot => <ReferenceDot x="A" y={10} v-slots={{ shape: slot }} />, replaced: '.v-charts-reference-dot circle' },
  { component: 'Label', slot: 'content', render: slot => <Label value="test" v-slots={{ content: slot }} />, replaced: '.v-charts-label' },
  ...['content', 'label'].map(slot => ({ component: 'LabelList', slot, render: (marker: Slot) => <LabelList data={[{ value: 10, x: 10, y: 10, width: 20, height: 20 }]} v-slots={{ [slot]: marker }} />, replaced: '.v-charts-label-list .v-charts-label' })),
  { component: 'Tooltip', slot: 'default', render: slot => <Tooltip defaultIndex={0} v-slots={{ default: slot }} />, replaced: '.v-charts-tooltip-content' },
  { component: 'Tooltip', slot: 'content', render: slot => <Tooltip defaultIndex={0} v-slots={{ content: slot }} />, replaced: '.v-charts-tooltip-content' },
  { component: 'Tooltip', slot: 'cursor', render: slot => <Tooltip defaultIndex={0} v-slots={{ cursor: slot }} />, replaced: '.v-charts-tooltip-cursor' },
  { component: 'Legend', slot: 'content', render: slot => <Legend v-slots={{ content: slot }} />, replaced: '.v-charts-default-legend' },
  { component: 'Customized', slot: 'default', render: slot => <Customized v-slots={{ default: slot }} /> },
  { component: 'Brush', slot: 'default', render: slot => <Brush v-slots={{ default: () => <ComposedChart width={400} height={100} v-slots={{ default: slot }} /> }} /> },
  ...['PolarAngleAxis', 'PolarRadiusAxis'].map(component => ({ component, slot: 'tick', standalone: true, render: (marker: Slot) => (
    <RadarChart width={400} height={300} data={data}>
      <PolarAngleAxis dataKey="name" v-slots={component === 'PolarAngleAxis' ? { tick: marker } : {}} />
      <PolarRadiusAxis v-slots={component === 'PolarRadiusAxis' ? { tick: marker } : {}} />
      <Radar dataKey="value" isAnimationActive={false} />
    </RadarChart>
  ), replaced: component === 'PolarAngleAxis' ? '.v-charts-polar-angle-axis-tick-value' : '.v-charts-polar-radius-axis-tick-value' })),
  ...['content', 'default'].map(slot => ({ component: 'Treemap', slot, standalone: true, render: (marker: Slot) => <Treemap width={400} height={300} data={data} dataKey="value" isAnimationActive={false} v-slots={{ [slot]: marker }} />, replaced: slot === 'content' ? '.v-charts-treemap rect' : undefined })),
  ...['content', 'default'].map(slot => ({ component: 'SunburstChart', slot, standalone: true, render: (marker: Slot) => <SunburstChart width={400} height={300} data={{ name: 'root', value: 30, children: data }} isAnimationActive={false} v-slots={{ [slot]: marker }} />, replaced: slot === 'content' ? '.v-charts-sunburst path' : undefined })),
  ...['node', 'link', 'default'].map(slot => ({ component: 'Sankey', slot, standalone: true, render: (marker: Slot) => <Sankey width={400} height={300} data={{ nodes: [{ name: 'A' }, { name: 'B' }], links: [{ source: 0, target: 1, value: 10 }] }} isAnimationActive={false} v-slots={{ [slot]: marker }} />, replaced: slot === 'node' ? '.v-charts-sankey-nodes rect' : slot === 'link' ? '.v-charts-sankey-links path' : undefined })),
  ...['cell', 'default'].map(slot => ({ component: 'Tracker', slot, standalone: true, render: (marker: Slot) => <Tracker width={400} height={30} data={[{ date: 'a', status: 'up' }]} isAnimationActive={false} v-slots={{ [slot]: marker }} />, replaced: slot === 'cell' ? '.v-charts-cell-rect' : undefined })),
  ...['cell', 'default'].map(slot => ({ component: 'CalendarHeatmap', slot, standalone: true, render: (marker: Slot) => <CalendarHeatmap width={400} height={100} data={[{ date: '2026-01-01', value: 1 }]} start="2026-01-01" isAnimationActive={false} v-slots={{ [slot]: marker }} />, replaced: slot === 'cell' ? '.v-charts-cell-rect' : undefined })),
  ...['cell', 'default'].map(slot => ({ component: 'Heatmap', slot, standalone: true, render: (marker: Slot) => <Heatmap width={400} height={100} data={[{ x: 'a', y: 'b', value: 1 }]} isAnimationActive={false} v-slots={{ [slot]: marker }} />, replaced: slot === 'cell' ? '.v-charts-cell-rect' : undefined })),
  ...['cell', 'default'].map(slot => ({ component: 'CohortChart', slot, standalone: true, render: (marker: Slot) => <CohortChart width={400} height={100} data={[{ cohort: 'Jan', values: [10, 5] }]} isAnimationActive={false} v-slots={{ [slot]: marker }} />, replaced: slot === 'cell' ? '.v-charts-cell-rect' : undefined })),
]

function renderRow(row: Row, marker?: Slot) {
  return render(() => row.standalone
    ? row.render(marker)
    : (
        <ComposedChart width={400} height={300} data={data}>
          {row.component !== 'XAxis' && <XAxis dataKey="name" />}
          {row.component !== 'YAxis' && <YAxis />}
          {!['Line', 'Area', 'Bar'].includes(row.component) && <Line dataKey="value" isAnimationActive={false} />}
          {row.component !== 'Tooltip' && <Tooltip defaultIndex={0} />}
          {row.render(marker)}
        </ComposedChart>
      ))
}

describe('declared runtime slots', () => {
  // Each row catches a declared slot being discarded, ignored, or rendered beside
  // the built-in content it is meant to replace. Active slots use a real tooltip.
  it.each(rows)('$component #$slot', async (row) => {
    const className = `slot-${row.component}-${row.slot}`
    if (row.replaced) {
      const baseline = renderRow(row)
      await nextTick()
      await nextTick()
      expect(baseline.container.querySelector(row.replaced), `default content for ${row.component} #${row.slot}`).not.toBeNull()
      baseline.unmount()
    }
    const calls: unknown[] = []
    const { container } = renderRow(row, (props) => {
      calls.push(props)
      return <g class={className} />
    })
    await nextTick()
    await nextTick()
    expect(container.querySelectorAll(`.${className}`).length).toBeGreaterThan(0)
    if (row.slot === 'activeDot') {
      expect(calls[0]).toEqual(expect.objectContaining({ index: 0, dataKey: 'value', payload: data[0] }))
      if (row.component === 'Line')
        expect(calls[0]).toEqual(expect.objectContaining({ value: 10 }))
      else
        expect(calls[0]).toEqual(expect.objectContaining({ value: [0, 10] }))
    }
    if (row.replaced)
      expect(container.querySelector(row.replaced)).toBeNull()
    if (row.retained)
      expect(container.querySelector(row.retained)).not.toBeNull()
  })

  it.each([false, true])('pie #label respects labelLine=%s', async (labelLine) => {
    const { container } = render(() => <PieChart width={400} height={300}><Pie data={data} dataKey="value" labelLine={labelLine} isAnimationActive={false} v-slots={{ label: () => <g class="custom-pie-label" /> }} /></PieChart>)
    await nextTick()
    await nextTick()
    expect(container.querySelectorAll('.custom-pie-label')).toHaveLength(2)
    expect(container.querySelectorAll('.v-charts-pie line')).toHaveLength(labelLine ? 2 : 0)
    expect(container.querySelector('.v-charts-pie text')).toBeNull()
  })

  it('renders the existing docs custom tick demo with rotated slot text', async () => {
    const { container } = render(docsDemo('custom-tick-chart'))
    await nextTick()
    await nextTick()
    expect(container.querySelectorAll('.v-charts-x-axis text[transform="rotate(-35)"]').length).toBeGreaterThan(0)
    expect(container.querySelector('.v-charts-x-axis .v-charts-cartesian-axis-tick-value')).toBeNull()
  })

  it('renders the named axis ticks demo (which declares no customization slot)', async () => {
    const { container } = render(docsDemo('axis-ticks-custom-chart'), { global: { stubs: { ChartTooltipContent: true } } })
    await nextTick()
    await nextTick()
    expect(container.querySelectorAll('.v-charts-x-axis .v-charts-cartesian-axis-tick-value').length).toBeGreaterThan(0)
  })

  it('covers every explicitly declared public slot', () => {
    const configPath = resolve('tsconfig.json')
    const config = ts.readConfigFile(configPath, ts.sys.readFile)
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, resolve('.'))
    const program = ts.createProgram(parsed.fileNames, parsed.options)
    const checker = program.getTypeChecker()
    const source = program.getSourceFile(resolve('src/index.ts'))!
    const declared = checker.getExportsOfModule(checker.getSymbolAtLocation(source)!)
      .flatMap((symbol) => {
        const type = checker.getTypeOfSymbolAtLocation(symbol, source)
        const signatures = type.getConstructSignatures()
        return signatures.flatMap((signature) => {
          const instance = signature.getReturnType()
          const slots = instance.getProperty('$slots')
          if (!slots)
            return []
          const slotType = checker.getTypeOfSymbolAtLocation(slots, source)
          return slotType.getProperties().map(slot => `${symbol.name}:${slot.name}`)
        })
      })
    const covered = rows.map(row => `${row.component}:${row.slot}`)
    // Untyped Vue $slots has only an index signature. Grid predates S24 and its
    // two supported slots are included as additional regression rows.
    expect([...new Set(covered.filter(name => !name.startsWith('CartesianGrid:')))].sort())
      .toEqual([...new Set(declared)].sort())
  }, 30000)
})
