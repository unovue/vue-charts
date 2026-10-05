import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Bar, BarChart, CalendarHeatmap, Heatmap, JourneySankey, Line, LineChart, Sparkline, Tooltip, Tracker, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => mockGetBoundingClientRect({ width: 500, height: 300 }))

it('Sparkline renders a constant large finite value at mid-height', () => {
  const { container } = render(() => <Sparkline width={100} height={40} data={[1e20]} isAnimationActive={false} />)
  const path = container.querySelector('.v-charts-sparkline-line')?.getAttribute('d')
  console.log('large constant sparkline', path)
  expect(path).toBe('M50,20Z')
})

it('JourneySankey ignores infinite counts instead of corrupting valid paths', () => {
  const { container } = render(() => <JourneySankey width={500} height={300} data={[{ path: ['a', 'b'], count: 10 }, { path: ['x', 'y'], count: Infinity }]} isAnimationActive={false} />)
  const attrs = [...container.querySelectorAll('rect,path')].flatMap(el => [...el.attributes].map(a => `${a.name}=${a.value}`))
  console.log('journey bad attrs', attrs.filter(a => /NaN|Infinity/.test(a)))
  expect(attrs.filter(a => /NaN|Infinity/.test(a))).toEqual([])
  expect(container.querySelectorAll('.v-charts-journey-node-continue')).toHaveLength(2)
})

it('controlled Sparkline activeIndex shows the corresponding tooltip on mount', async () => {
  const active = ref(1)
  const { container } = render(() => <Sparkline width={500} height={100} data={[10, 20, 30]} activeIndex={active.value} isAnimationActive={false}><Tooltip /></Sparkline>)
  await nextTick(); await nextTick()
  console.log('controlled sparkline tooltip', container.querySelector('.v-charts-tooltip-wrapper')?.outerHTML)
  expect(container.querySelector('.v-charts-sparkline-active circle')).toBeTruthy()
  const initial = container.querySelector('.v-charts-tooltip-wrapper')?.textContent
  active.value = 0
  await nextTick(); await nextTick()
  expect(container.querySelector('.v-charts-tooltip-wrapper')?.textContent).toContain('10')
  active.value = 1
  await nextTick(); await nextTick()
  expect(container.querySelector('.v-charts-tooltip-wrapper')?.textContent).toContain('20')
  expect(initial).toContain('20')
})

it('CalendarHeatmap treats local Date and ISO string as the same day across DST', () => {
  const { container } = render(() => <CalendarHeatmap width={400} height={150} start="2026-03-08" end="2026-03-10" data={[{ date: new Date(2026, 2, 8, 23, 59), value: 2 }, { date: '2026-03-08', value: 3 }, { date: new Date(2026, 2, 10), value: 4 }]} isAnimationActive={false} />)
  expect([...container.querySelectorAll('.v-charts-cell')].map(el => el.getAttribute('aria-label'))).toEqual(['Sun, Mar 8, 2026: 5', 'Mon, Mar 9, 2026', 'Tue, Mar 10, 2026: 4'])
})

it.each(['line', 'bar', 'tracker', 'heatmap'] as const)('%s survives empty and zero-width updates', async kind => {
  const width = ref(500)
  const empty = ref(false)
  const { container } = render(() => kind === 'line' ? <LineChart width={width.value} height={300} data={empty.value ? [] : [{ name: 'a', value: 1 }]}><XAxis dataKey="name"/><YAxis/><Line dataKey="value" isAnimationActive={false}/></LineChart> : kind === 'bar' ? <BarChart width={width.value} height={300} data={empty.value ? [] : [{ name: 'a', value: -1 }]}><XAxis dataKey="name"/><YAxis/><Bar dataKey="value" isAnimationActive={false}/></BarChart> : kind === 'tracker' ? <Tracker width={width.value} height={30} data={empty.value ? [] : [{ date: '2026-01-01', status: 'up' }]} isAnimationActive={false}/> : <Heatmap width={width.value} height={300} data={empty.value ? [] : [{ x:'a',y:'b',value:0 }]} isAnimationActive={false}/>)
  await nextTick(); await nextTick()
  width.value = 0
  await nextTick(); await nextTick()
  expect(container.innerHTML).not.toMatch(/NaN|Infinity/)
  empty.value = true
  width.value = 500
  await nextTick(); await nextTick()
  expect(container.innerHTML).not.toMatch(/NaN|Infinity/)
  expect(container.querySelectorAll('.v-charts-cell, .v-charts-bar-rectangle, .v-charts-line-dot')).toHaveLength(0)
})

it.each(['index', 'value'] as const)('syncMethod=%s selects the correct value in a reordered receiver', async syncMethod => {
  const { container } = render(() => <div>{[0,1].map(i => <BarChart width={500} height={300} syncId="repro" syncMethod={i === 0 ? 'index' : syncMethod} data={i === 0 ? [{ name:'A', value:10 },{ name:'B', value:20 }] : [{ name:'B', value:200 },{ name:'A', value:100 }]}><XAxis dataKey="name"/><YAxis/><Bar dataKey="value" isAnimationActive={false}/><Tooltip isAnimationActive={false}/></BarChart>)}</div>)
  await nextTick(); await nextTick()
  await fireEvent.mouseMove(container.querySelectorAll('.v-charts-wrapper')[0], { clientX:400,clientY:150 })
  await nextTick(); await nextTick()
  const tooltip = container.querySelectorAll('.v-charts-tooltip-wrapper')[1]
  console.log('sync receiver', syncMethod, tooltip.textContent)
  expect((tooltip as HTMLElement).style.visibility).toBe('visible')
  expect(tooltip.querySelector('.v-charts-tooltip-item-value')?.textContent).toBe(syncMethod === 'value' ? '200' : '100')
})

it('reversed numeric axis mirrors bar positions around the same zero baseline', async () => {
  const ys: number[][] = []
  for (const reversed of [false, true]) {
    const view = render(() => <BarChart width={500} height={300} data={[{ name: 'a', value: 10 }, { name: 'b', value: -10 }]}><XAxis dataKey="name"/><YAxis reversed={reversed} domain={[-10,10]}/><Bar dataKey="value" isAnimationActive={false}/></BarChart>)
    await nextTick(); await nextTick()
    ys.push([...view.container.querySelectorAll('.v-charts-bar-rectangle path, .v-charts-bar-rectangle rect')].map(el => Number(el.getAttribute('y'))))
    view.unmount()
  }
  console.log('reversed bar y',ys)
  expect(ys).toEqual([[5,265],[265,5]])
})

it('Heatmap survives rapid sparse-to-dense updates', async () => {
  const data = ref([{ x:'a',y:'one',value:1 }])
  const { container } = render(() => <Heatmap width={500} height={300} data={data.value} isAnimationActive={false}/>)
  data.value = [{ x:'b',y:'two',value:0 }]
  data.value = []
  data.value = [{ x:'a',y:'one',value:2 },{ x:'b',y:'two',value:3 }]
  await nextTick(); await nextTick()
  expect([...container.querySelectorAll('.v-charts-cell')].map(el => el.getAttribute('aria-label'))).toEqual(['one, a: 2','one, b','two, a','two, b: 3'])
})

it('unmount cancels a running Sparkline animation without subsequent errors', async () => {
  const errors: unknown[][] = []
  const original = console.error
  const started = vi.fn()
  const ended = vi.fn()
  const { container, unmount } = render(() => <Sparkline width={500} height={100} data={[1,2,3]} {...{ 'onAnimation-start': started, 'onAnimation-end': ended }}/>)
  await nextTick()
  expect(container.querySelector('svg')).toBeTruthy()
  expect(started).toHaveBeenCalled()
  expect(ended).not.toHaveBeenCalled()
  console.error = (...args) => { errors.push(args); original(...args) }
  try {
    unmount()
    await new Promise(resolve => setTimeout(resolve, 1000))
    expect(errors).toEqual([])
  } finally { console.error = original }
})
