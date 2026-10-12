import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, expect, it } from 'vitest'
import { type VNode, nextTick } from 'vue'
import { CalendarHeatmap, CohortChart, Heatmap, JourneySankey, Sankey, Sparkline, SunburstChart, Tooltip, Tracker, Treemap } from '@/index'
import type { TooltipPayload } from '@/types/tooltip'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

function capture(onPayload: (payload: TooltipPayload) => void) {
  return (
    <Tooltip>
      {{ content: ({ payload }: { payload: TooltipPayload }) => {
        onPayload(payload)
        return null
      } }}
    </Tooltip>
  )
}

beforeEach(() => {
  mockGetBoundingClientRect({ width: 400, height: 200 })
})

const statusRow = { date: '2026-01-01', status: 'up' }
const hit = { x: 'a', y: 'b', value: 3 }
const day = { date: '2026-01-01', value: 4 }
const cohort = { cohort: 'Jan', values: [10, 5] }
const point = { day: 'Mon', value: 3 }
const sankeyNode = { name: 'A' }
const tile = { name: 'T', value: 5 }
const ring = { name: 'R', value: 5 }

// One `#content` template must read every standalone chart the same way: the domain object as
// payload, the raw value as value.
it.each<[string, (tooltip: VNode) => VNode, string, unknown, string]>([
  ['Tracker', t => <Tracker width={400} height={20} isAnimationActive={false} data={[statusRow]}>{t}</Tracker>, '.v-charts-cell', statusRow, 'string'],
  ['Heatmap', t => <Heatmap width={400} height={100} isAnimationActive={false} data={[hit]}>{t}</Heatmap>, '.v-charts-cell', { x: 'a', y: 'b', value: 3, rows: [hit] }, 'number'],
  ['CalendarHeatmap', t => <CalendarHeatmap width={400} height={100} isAnimationActive={false} start="2026-01-01" data={[day]}>{t}</CalendarHeatmap>, '.v-charts-cell', { date: '2026-01-01', value: 4, level: 4, rows: [day] }, 'number'],
  ['CohortChart', t => <CohortChart width={400} height={100} isAnimationActive={false} data={[cohort]}>{t}</CohortChart>, '.v-charts-cell', { x: 0, y: 'Jan', value: 100, row: cohort, rows: [cohort], period: 0 }, 'number'],
  ['Sparkline bar', t => <Sparkline width={400} height={30} isAnimationActive={false} type="bar" nameKey="day" data={[point]}>{t}</Sparkline>, '.v-charts-cell', point, 'number'],
  ['Sankey', t => <Sankey width={400} height={200} isAnimationActive={false} data={{ nodes: [sankeyNode, { name: 'B' }], links: [{ source: 0, target: 1, value: 2 }] }}>{t}</Sankey>, '.v-charts-sankey-node', sankeyNode, 'number'],
  ['Treemap', t => <Treemap width={400} height={200} isAnimationActive={false} data={[tile]}>{t}</Treemap>, '.v-charts-treemap-node', tile, 'number'],
  ['SunburstChart', t => <SunburstChart width={400} height={200} isAnimationActive={false} data={{ name: 'root', children: [ring] }}>{t}</SunburstChart>, '.v-charts-sunburst-sector', ring, 'number'],
])('%s gives the tooltip its domain object and a raw value', async (_name, view, target, payload, valueType) => {
  let seen: TooltipPayload = []
  const tooltip = capture((entries) => { seen = entries })
  const { container } = render(() => view(tooltip))
  await fireEvent.mouseEnter(container.querySelector(target)!)
  await nextTick()
  await nextTick()
  expect(seen[0]?.payload).toEqual(payload)
  expect(typeof seen[0]?.value).toBe(valueType)
})

it('sparkline line and JourneySankey give the tooltip their row and node', async () => {
  let seen: TooltipPayload = []
  const tooltip = () => capture((entries) => { seen = entries })
  const line = render(() => <Sparkline width={400} height={30} isAnimationActive={false} nameKey="day" data={[point, { day: 'Tue', value: 5 }]}>{tooltip()}</Sparkline>)
  await fireEvent.mouseMove(line.container.querySelector('.v-charts-sparkline g[role="img"]')!, { clientX: 0, clientY: 10 })
  await nextTick()
  await nextTick()
  expect(seen[0]).toMatchObject({ payload: point, value: 3, name: 'Mon' })

  const journey = render(() => <JourneySankey width={400} height={200} isAnimationActive={false} data={[{ path: ['a', 'b'], count: 2 }]}>{tooltip()}</JourneySankey>)
  await fireEvent.mouseEnter(journey.container.querySelector('.v-charts-journey-node g')!)
  await nextTick()
  await nextTick()
  expect(seen[0]).toMatchObject({ payload: { name: 'a', step: 0, count: 2 }, value: 2, name: 'a' })
})

it.each([
  [undefined, '100%'],
  [(value: unknown) => `${Number(value).toFixed(1)} pts`, '100.0 pts'],
])('a Tooltip formatter replaces the chart\'s default value text', async (formatter, text) => {
  const { container } = render(() => (
    <CohortChart width={400} height={100} isAnimationActive={false} data={[cohort]}>
      <Tooltip formatter={formatter} />
    </CohortChart>
  ))
  await fireEvent.mouseEnter(container.querySelector('.v-charts-cell')!)
  await nextTick()
  await nextTick()
  expect(container.querySelector('.v-charts-tooltip-item')?.textContent).toContain(text)
})
