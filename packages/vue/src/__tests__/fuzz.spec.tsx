import type { VNode } from 'vue'
import { fireEvent } from '@testing-library/vue'
import fc from 'fast-check'
import { describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, shallowRef } from 'vue'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ComposedChart,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  Sankey,
  Scatter,
  ScatterChart,
  SunburstChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const name = fc.oneof(
  fc.string({ unit: 'binary', maxLength: 24 }),
  fc.constantFrom('', '🌱😀', 'مرحبا', '重复', 'duplicate', '__proto__'),
)
const value = fc.oneof(
  fc.double({ min: -1e12, max: 1e12, noNaN: true, noDefaultInfinity: true }),
  fc.constantFrom(0, -1, 1e12, 1e-6, null, undefined, Number.NaN, Infinity, -Infinity),
  fc.integer().map(String),
  fc.constantFrom('', 'nope', 'NaN', 'Infinity', '1e-6'),
  fc.boolean(),
  fc.record({ nested: fc.integer() }),
)
const seriesKeys = fc.integer({ min: 1, max: 4 }).map(count => Array.from({ length: count }, (_, i) => `v${i}`))
const dataset = seriesKeys.chain(keys => fc.array(
  fc.tuple(name, fc.array(fc.tuple(fc.boolean(), value), { minLength: keys.length, maxLength: keys.length }))
    .map(([rowName, entries]) => ({
      name: rowName,
      ...Object.fromEntries(entries.flatMap(([present, entry], i) => present ? [[keys[i], entry]] : [])),
    })),
  { maxLength: 40 },
).map(rows => ({ keys, rows })))

// A bounded recursive arbitrary keeps even shrinking cheap; the root has depth zero.
function tree(depth: number): fc.Arbitrary<Tree> {
  return fc.record({
    name,
    weight: value,
    children: depth === 5 ? fc.constant([]) : fc.array(tree(depth + 1), { maxLength: 2 }),
  })
}
interface Tree {
  name: string
  weight: fc.ArbitraryValue<typeof value>
  children: Tree[]
}
const sankeyData = fc.record({
  nodes: fc.array(fc.record({ name }), { maxLength: 12 }),
  links: fc.array(fc.record({
    source: fc.integer({ min: -2, max: 14 }),
    target: fc.integer({ min: -2, max: 14 }),
    value: fc.oneof(fc.integer({ min: -10, max: 100 }), fc.constantFrom(0, Number.NaN, Infinity, -Infinity)),
  }), { maxLength: 20 }),
})

const leakedAttributes = new Set([
  'payload',
  'datakey',
  'namekey',
  'stackid',
  'isanimationactive',
  'animationid',
  'coordinate',
  'tooltipposition',
  'tooltippayload',
  'parentviewbox',
  'value',
  'data',
  'nodes',
  'links',
  'index',
])
const mixedCaseAttributes = new Set(['viewBox', 'preserveAspectRatio'])
const pathToken = /[MZLHVCSQTA]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi
const pathArity: Record<string, number> = { m: 2, z: 0, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7 }

function checkDOM(container: HTMLElement) {
  const bad: string[] = []
  for (const element of container.querySelectorAll('*')) {
    for (const attribute of element.attributes) {
      if (/NaN|Infinity|\[object |^undefined$/.test(attribute.value)
        || (/[A-Z]/.test(attribute.name) && !mixedCaseAttributes.has(attribute.name))
        || leakedAttributes.has(attribute.name.toLowerCase())) {
        bad.push(`${element.tagName} ${attribute.name}=${attribute.value}`)
      }
    }
  }
  expect(bad, 'invalid or leaked DOM attributes').toEqual([])
  for (const path of container.querySelectorAll('path[d]')) {
    const d = path.getAttribute('d')!
    expect(d.replace(pathToken, '').replace(/[\s,]/g, ''), `unparsed path: ${d}`).toBe('')
    const tokens = d.match(pathToken) ?? []
    let command = ''
    let coordinates = 0
    const checkGroup = () => {
      const arity = pathArity[command]
      expect(arity === 0 ? coordinates === 0 : coordinates >= arity && coordinates % arity === 0, `invalid path: ${d}`).toBe(true)
    }
    for (const token of tokens) {
      if (/^[a-z]$/i.test(token)) {
        if (command)
          checkGroup()
        command = token.toLowerCase()
        coordinates = 0
      }
      else {
        expect(command, `missing path command: ${d}`).not.toBe('')
        expect(Number.isFinite(Number(token)), `non-finite path number: ${d}`).toBe(true)
        coordinates++
      }
    }
    if (command)
      checkGroup()
  }
}

async function checkCase<T>(first: T, second: T, chart: (data: T) => VNode) {
  const warnings: string[] = []
  const errors: unknown[] = []
  const recordWarning = (...args: unknown[]) => {
    const message = args.map(arg => typeof arg === 'string' ? arg : fc.stringify(arg)).join(' ')
    // Sankey tells developers when it drops invalid or cyclic links; that warning is intended.
    if (!/^Sankey dropped \d+ invalid or cyclic links\.$/.test(message))
      warnings.push(message)
  }
  const warn = vi.spyOn(console, 'warn').mockImplementation(recordWarning)
  const error = vi.spyOn(console, 'error').mockImplementation(recordWarning)
  const data = shallowRef(first)
  const container = document.body.appendChild(document.createElement('div'))
  // Own the Vue app so a crashed partial render cannot poison testing-library's
  // global cleanup registry and turn all later shrinks into unrelated failures.
  const app = createApp({ render: () => chart(data.value) })
  app.config.errorHandler = (err) => { errors.push(err) }
  const check = () => {
    expect(errors, errors.map(err => String(err)).join('\n')).toEqual([])
    expect(warnings, warnings.join('\n')).toEqual([])
    checkDOM(container)
  }
  try {
    app.mount(container)
    await nextTick()
    await nextTick()
    check()
    data.value = second
    await nextTick()
    await nextTick()
    check()
    // Empty standalone charts return null, so there is no wrapper to hover.
    await fireEvent(container.querySelector('.v-charts-wrapper') ?? container, new MouseEvent('mousemove', { bubbles: true, clientX: 150, clientY: 100 }))
    await nextTick()
    await nextTick()
    check()
  }
  finally {
    try {
      app.unmount()
    }
    catch (err) {
      errors.push(err)
    }
    container.remove()
    warn.mockRestore()
    error.mockRestore()
  }
  expect(errors, errors.map(err => String(err)).join('\n')).toEqual([])
  expect(warnings, warnings.join('\n')).toEqual([])
}

// Local runs explore a new random seed each time; CI replays a fixed one so a newly found
// case cannot fail an unrelated change. FUZZ_SEED replays a reported failure.
const seed = process.env.FUZZ_SEED ?? (process.env.CI ? '20261004' : undefined)
const parameters = {
  numRuns: 25,
  ...(seed === undefined ? {} : { seed: Number(seed) }),
}

function fuzz<T>(chartName: string, arbitrary: fc.Arbitrary<T>, chart: (data: T) => VNode) {
  it(chartName, async () => {
    mockGetBoundingClientRect({ width: 400, height: 300 })
    await fc.assert(fc.asyncProperty(arbitrary, arbitrary, (first, second) => checkCase(first, second, chart)), parameters)
  }, 60_000)
}

function axes(vertical = false) {
  return (
    <>
      <XAxis dataKey={vertical ? undefined : 'name'} type={vertical ? 'number' : 'category'} />
      <YAxis dataKey={vertical ? 'name' : undefined} type={vertical ? 'category' : 'number'} />
      <Tooltip />
    </>
  )
}

describe('messy chart data never crashes or leaks into the DOM', () => {
  for (const stacked of [false, true]) {
    fuzz(`Area ${stacked ? 'stacked' : 'unstacked'}`, dataset, ({ rows, keys }) => (
      <AreaChart width={400} height={300} data={rows}>
        {axes()}
        {keys.map(key => <Area key={key} dataKey={key} stackId={stacked ? 'stack' : undefined} isAnimationActive={false} />)}
      </AreaChart>
    ))
  }
  for (const variant of ['grouped', 'stacked', 'vertical']) {
    fuzz(`Bar ${variant}`, dataset, ({ rows, keys }) => (
      <BarChart width={400} height={300} data={rows} layout={variant === 'vertical' ? 'vertical' : 'horizontal'}>
        {axes(variant === 'vertical')}
        {keys.map(key => <Bar key={key} dataKey={key} stackId={variant === 'stacked' ? 'stack' : undefined} strokeWidth={2} isAnimationActive={false}><LabelList /></Bar>)}
      </BarChart>
    ))
  }
  fuzz('Line', dataset, ({ rows, keys }) => (
    <LineChart width={400} height={300} data={rows}>
      {axes()}
      {keys.map(key => <Line key={key} dataKey={key} isAnimationActive={false} />)}
    </LineChart>
  ))
  fuzz('Composed', dataset, ({ rows, keys }) => (
    <ComposedChart width={400} height={300} data={rows}>
      {axes()}
      <Area dataKey={keys[0]} isAnimationActive={false} />
      <Bar dataKey={keys[1] ?? keys[0]} isAnimationActive={false} />
      <Line dataKey={keys[2] ?? keys[0]} isAnimationActive={false} />
    </ComposedChart>
  ))
  fuzz('Scatter', dataset, ({ rows, keys }) => (
    <ScatterChart width={400} height={300}>
      <XAxis dataKey={keys[0]} type="number" />
      <YAxis dataKey={keys[1] ?? keys[0]} type="number" />
      <Tooltip />
      <Scatter data={rows} isAnimationActive={false} />
    </ScatterChart>
  ))
  fuzz('Pie with Cells and LabelList', dataset, ({ rows, keys }) => (
    <PieChart width={400} height={300}>
      <Pie data={rows} dataKey={keys[0]} nameKey="name" strokeWidth={2} isAnimationActive={false}>
        {rows.map((_, i) => <Cell key={i} fill={i % 2 ? '#f97316' : '#14b8a6'} />)}
        <LabelList />
      </Pie>
      <Tooltip />
    </PieChart>
  ))
  fuzz('Radar', dataset, ({ rows, keys }) => (
    <RadarChart width={400} height={300} data={rows}>
      <PolarAngleAxis dataKey="name" />
      <PolarRadiusAxis />
      {keys.map(key => <Radar key={key} dataKey={key} isAnimationActive={false} />)}
      <Tooltip />
    </RadarChart>
  ))
  fuzz('RadialBar', dataset, ({ rows, keys }) => (
    <RadialBarChart width={400} height={300} data={rows}>
      {keys.map(key => <RadialBar key={key} dataKey={key} isAnimationActive={false} />)}
      <Tooltip />
    </RadialBarChart>
  ))
  fuzz('Funnel', dataset, ({ rows, keys }) => (
    <FunnelChart width={400} height={300}>
      <Funnel data={rows} dataKey={keys[0]} nameKey="name" isAnimationActive={false} />
      <Tooltip />
    </FunnelChart>
  ))
  fuzz('Treemap', dataset, ({ rows, keys }) => <Treemap width={400} height={300} data={rows} dataKey={keys[0]} isAnimationActive={false}><Tooltip /></Treemap>)
  fuzz('Sankey', sankeyData, data => <Sankey width={400} height={300} data={data} isAnimationActive={false}><Tooltip /></Sankey>)
  fuzz('Sunburst', tree(0), data => <SunburstChart width={400} height={300} data={data} dataKey="weight" isAnimationActive={false}><Tooltip /></SunburstChart>)
})

// Counterexamples the fuzz found, shrunk; each crashed or wrote NaN/Infinity before its fix.
describe('values the fuzz found', () => {
  const bars = (keys: string[]) => (rows: Record<string, unknown>[]) => (
    <BarChart width={400} height={300} data={rows}>
      {axes()}
      {keys.map(key => <Bar key={key} dataKey={key} isAnimationActive={false}><LabelList /></Bar>)}
    </BarChart>
  )
  it.each([
    ['an object without a prototype', bars(['v0']), [], [{ name: '', v0: Object.assign(Object.create(null), { nested: 0 }) }]],
    ['a subnormal number', bars(['v0', 'v1', 'v2', 'v3']), [], [{ name: '', v2: -5e-324, v3: '' }]],
    ['a number near the smallest normal one', bars(['v0', 'v1']), [{ name: '', v1: -9.999999999999347e-309 }, { name: '', v1: true }], []],
    ['a funnel step near the smallest normal number', (rows: Record<string, unknown>[]) => (
      <FunnelChart width={400} height={300}>
        <Funnel data={rows} dataKey="v0" nameKey="name" isAnimationActive={false} />
        <Tooltip />
      </FunnelChart>
    ), [{ name: '', v0: '-1' }, { name: '', v0: 2.2250738585072014e-308 }], []],
  ] as const)('renders, updates and hovers with %s', async (_, chart, first, second) => {
    mockGetBoundingClientRect({ width: 400, height: 300 })
    await checkCase<Record<string, unknown>[]>([...first], [...second], chart)
  })
})
