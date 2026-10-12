import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick, reactive, ref } from 'vue'
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Sankey, Scatter, ScatterChart, SunburstChart, Treemap, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => {
  mockGetBoundingClientRect({ width: 500, height: 300 })
})

for (const kind of ['bar', 'line'] as const) {
  describe(`${kind} reactive data`, () => {
    for (const mutation of ['push', 'splice', 'field', 'replace'] as const) {
      it(`updates geometry after ${mutation}`, async () => {
        const rows = ref(reactive([{ name: 'A', metrics: { uv: 20 } }, { name: 'B', metrics: { uv: 40 } }]))
        const { container } = render(() => kind === 'bar'
          ? (
              <BarChart width={500} height={300} data={rows.value}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Bar dataKey="metrics.uv" isAnimationActive={false} />
              </BarChart>
            )
          : (
              <LineChart width={500} height={300}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Line data={rows.value} dataKey="metrics.uv" dot isAnimationActive={false} />
              </LineChart>
            ))
        await nextTick()
        const selector = kind === 'bar' ? '.v-charts-bar-rectangle path' : '.v-charts-line-dot'
        const shapes = () => container.querySelectorAll(selector)
        expect(shapes()).toHaveLength(2)
        const before = shapes()[0].getAttribute(kind === 'bar' ? 'height' : 'cy')
        if (mutation === 'push')
          rows.value.push({ name: 'C', metrics: { uv: 60 } })
        if (mutation === 'splice')
          rows.value.splice(0, 1)
        if (mutation === 'field')
          rows.value[0].metrics.uv = 80
        if (mutation === 'replace')
          rows.value = [{ name: 'D', metrics: { uv: 70 } }]
        await nextTick()
        expect(shapes()).toHaveLength(mutation === 'push' ? 3 : mutation === 'field' ? 2 : 1)
        if (mutation === 'field') {
          const after = shapes()[0].getAttribute(kind === 'bar' ? 'height' : 'cy')
          expect(after).not.toBe(before)
          if (kind === 'bar')
            expect(Number(after)).toBeGreaterThan(Number(before))
          else expect(Number(after)).toBeLessThan(Number(before))
        }
      })
    }
  })
}

it('adds a Pie sector after pushing reactive item data', async () => {
  const rows = reactive([{ name: 'A', value: 20 }, { name: 'B', value: 40 }])
  const { container } = render(() => (
    <PieChart width={500} height={300}>
      <Pie data={rows} dataKey="value" isAnimationActive={false} />
    </PieChart>
  ))
  expect(container.querySelectorAll('.v-charts-sector')).toHaveLength(2)
  rows.push({ name: 'C', value: 60 })
  await nextTick()
  expect(container.querySelectorAll('.v-charts-sector')).toHaveLength(3)
})

it('adds a Treemap node after pushing reactive data', async () => {
  const rows = reactive([{ name: 'A', value: 20 }, { name: 'B', value: 40 }])
  const { container } = render(() => <Treemap width={500} height={300} data={rows} dataKey="value" isAnimationActive={false} />)
  expect(container.querySelectorAll('.v-charts-treemap-node')).toHaveLength(2)
  rows.push({ name: 'C', value: 60 })
  await nextTick()
  expect(container.querySelectorAll('.v-charts-treemap-node')).toHaveLength(3)
})

for (const kind of ['pie', 'treemap'] as const) {
  for (const mutation of ['splice', 'field', 'replace'] as const) {
    it(`updates ${kind} after ${mutation}`, async () => {
      const rows = ref(reactive([{ name: 'A', value: 20 }, { name: 'B', value: 40 }]))
      const { container } = render(() => kind === 'pie'
        ? <PieChart width={500} height={300}><Pie data={rows.value} dataKey="value" isAnimationActive={false} /></PieChart>
        : <Treemap width={500} height={300} data={rows.value} dataKey="value" isAnimationActive={false} />)
      const selector = kind === 'pie' ? '.v-charts-sector' : '.v-charts-treemap-node rect'
      const shapes = () => container.querySelectorAll(selector)
      expect(shapes()).toHaveLength(2)
      const before = shapes()[0].getAttribute(kind === 'pie' ? 'd' : 'width')
      if (mutation === 'splice')
        rows.value.splice(0, 1)
      if (mutation === 'field')
        rows.value[0].value = 100
      if (mutation === 'replace')
        rows.value = [{ name: 'C', value: 60 }]
      await nextTick()
      expect(shapes()).toHaveLength(mutation === 'field' ? 2 : 1)
      if (mutation === 'field')
        expect(shapes()[0].getAttribute(kind === 'pie' ? 'd' : 'width')).not.toBe(before)
    })
  }
}

it('updates Sunburst hierarchy after field edits, push and replacement', async () => {
  const data = ref(reactive({ name: 'root', children: [{ name: 'A', value: 20 }, { name: 'B', value: 40 }] }))
  const { container } = render(() => <SunburstChart width={500} height={300} data={data.value} isAnimationActive={false} />)
  const sectors = () => container.querySelectorAll('.v-charts-sunburst-sector path')
  expect(sectors()).toHaveLength(2)
  const before = sectors()[0].getAttribute('d')
  data.value.children[0].value = 100
  await nextTick()
  expect(sectors()[0].getAttribute('d')).not.toBe(before)
  data.value.children.push({ name: 'C', value: 60 })
  await nextTick()
  expect(sectors()).toHaveLength(3)
  data.value = { name: 'new root', children: [{ name: 'D', value: 40 }] }
  await nextTick()
  expect(sectors()).toHaveLength(1)
})

it('updates Sankey nodes and links after reactive edits', async () => {
  const data = reactive({
    nodes: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
    links: [{ source: 0, target: 1, value: 20 }, { source: 0, target: 2, value: 40 }],
  })
  const { container } = render(() => <Sankey width={500} height={300} data={data} isAnimationActive={false} />)
  const links = () => container.querySelectorAll('.v-charts-sankey-link')
  expect(links()).toHaveLength(2)
  const before = links()[0].getAttribute('stroke-width')
  data.links[0].value = 100
  await nextTick()
  expect(links()[0].getAttribute('stroke-width')).not.toBe(before)
  data.nodes.push({ name: 'D' })
  data.links.push({ source: 0, target: 3, value: 60 })
  await nextTick()
  expect(container.querySelectorAll('.v-charts-sankey-node')).toHaveLength(4)
  expect(links()).toHaveLength(3)
})

it('updates Scatter item data without freezing caller-owned rows', async () => {
  const rows = reactive([{ x: 20, y: 40 }, { x: 40, y: 60 }])
  const { container } = render(() => (
    <ScatterChart width={500} height={300}>
      <XAxis type="number" dataKey="x" domain={[0, 100]} />
      <YAxis type="number" dataKey="y" domain={[0, 100]} />
      <Scatter data={rows} isAnimationActive={false} />
    </ScatterChart>
  ))
  const symbols = () => container.querySelectorAll('.v-charts-scatter-symbol path')
  expect(symbols()).toHaveLength(2)
  const before = symbols()[0].getAttribute('transform')
  rows[0].y = 80
  await nextTick()
  expect(symbols()[0].getAttribute('transform')).not.toBe(before)
  rows.push({ x: 60, y: 80 })
  await nextTick()
  expect(symbols()).toHaveLength(3)
})

// Catch raw, same-identity data staying cached after an accessor's input changes.
it.each([
  ['root', 'path'],
  ['root', 'function'],
  ['root', 'array'],
  ['series', 'path'],
  ['series', 'function'],
  ['series', 'array'],
] as const)('updates %s data after a nested %s edit', async (owner, accessor) => {
  const objects = reactive([{ metrics: { nested: { value: 20 } } }, { metrics: { nested: { value: 40 } } }])
  const arrays = reactive([[20], [40]])
  const rows = accessor === 'array' ? arrays : objects
  const dataKey = accessor === 'array'
    ? '0'
    : accessor === 'path'
      ? 'metrics.nested.value'
      : (row: typeof objects[number]) => row.metrics.nested.value
  const { container } = render(() => (
    <BarChart width={400} height={200} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} data={owner === 'root' ? rows : undefined}>
      <YAxis hide domain={[0, 100]} />
      <Bar data={owner === 'series' ? rows : undefined} dataKey={dataKey} isAnimationActive={false} />
    </BarChart>
  ))
  await nextTick()
  expect([...container.querySelectorAll('.v-charts-bar-rectangle path')].map(rect => rect.getAttribute('height')))
    .toEqual(['40', '80'])
  if (accessor === 'array')
    arrays[0][0] = 80
  else
    objects[0].metrics.nested.value = 80
  await nextTick()
  expect([...container.querySelectorAll('.v-charts-bar-rectangle path')].map(rect => rect.getAttribute('height')))
    .toEqual(['160', '80'])
})
