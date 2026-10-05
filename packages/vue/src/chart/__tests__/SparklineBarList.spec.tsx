import { fireEvent, render } from '@testing-library/vue'
import { renderToString } from 'vue/server-renderer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, nextTick, ref } from 'vue'
import { BarList, Sparkline, Tooltip } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => {
  mockGetBoundingClientRect({ width: 100, height: 30 })
})

const linePath = (container: Element) => container.querySelector('.v-charts-sparkline-line')!.getAttribute('d')!

describe('<Sparkline />', () => {
  it.each([
    [[1e20], 'M50,20Z'],
    [[5, 5, 5], 'M3,20L50,20L97,20'],
  ])('draws constant values %j at mid-height', (data, expected) => {
    const { container } = render(() => (
      <Sparkline width={100} height={40} data={data} curve="linear" isAnimationActive={false} />
    ))
    expect(linePath(container)).toBe(expected)
  })

  it('breaks the line at missing values instead of bridging them', () => {
    const { container } = render(() => <Sparkline width={100} height={30} curve="linear" isAnimationActive={false} data={[1, 2, null, 4, 5]} />)
    expect(linePath(container).match(/M/g)).toHaveLength(2)
  })

  it('puts equal values at the same height when sparklines share min and max', () => {
    const { container } = render(() => (
      <div>
        <Sparkline width={100} height={30} min={0} max={10} curve="linear" endDot={false} isAnimationActive={false} data={[5, 5]} />
        <Sparkline width={100} height={30} min={0} max={10} curve="linear" endDot={false} isAnimationActive={false} data={[5, 9, 5]} />
      </div>
    ))
    const [a, b] = Array.from(container.querySelectorAll('.v-charts-sparkline-line'), path => path.getAttribute('d')!)
    const firstY = (d: string) => Number(d.split(',')[1].split(/[LZ]/)[0])
    expect(firstY(a)).toBe(firstY(b))
  })

  it('reports the hovered point through v-model and follows a controlled index', async () => {
    const active = ref<number | null>(null)
    const { container } = render(() => (
      <Sparkline width={100} height={30} isAnimationActive={false} data={[3, 8, 4]} activeIndex={active.value} {...{ 'onUpdate:activeIndex': (index: number | null) => { active.value = index } }} />
    ))
    const target = container.querySelector('.v-charts-sparkline g[role="img"]')!
    await fireEvent.mouseMove(target, { clientX: 99, clientY: 10 })
    expect(active.value).toBe(2)
    await fireEvent.keyDown(target, { key: 'ArrowLeft' })
    expect(active.value).toBe(1)
    active.value = 0
    await nextTick()
    expect(Number(container.querySelector('.v-charts-sparkline-active circle')!.getAttribute('cx'))).toBe(3)
    await fireEvent.mouseLeave(target)
    expect(active.value).toBeNull()
  })

  it('shows the hovered value in a Tooltip', async () => {
    const { container, findByText } = render(() => (
      <Sparkline width={100} height={30} isAnimationActive={false} nameKey="day" data={[{ day: 'Mon', value: 3 }, { day: 'Tue', value: 42 }]}>
        <Tooltip />
      </Sparkline>
    ))
    await fireEvent.mouseMove(container.querySelector('.v-charts-sparkline g[role="img"]')!, { clientX: 99, clientY: 10 })
    await fireEvent(container.querySelector('.v-charts-wrapper')!, new MouseEvent('mousemove', { bubbles: true, clientX: 99, clientY: 10 }))
    await nextTick()
    expect(await findByText('Tue')).toBeTruthy()
    expect(await findByText('42')).toBeTruthy()
  })

  it('reports keyboard selection of bar sparklines through v-model and follows a controlled index', async () => {
    const active = ref<number | null>(null)
    const { container } = render(() => (
      <Sparkline type="bar" width={100} height={30} isAnimationActive={false} data={[3, 8, 4]} activeIndex={active.value} {...{ 'onUpdate:activeIndex': (index: number | null) => { active.value = index } }} />
    ))
    const grid = container.querySelector('.v-charts-cell-grid')!
    await fireEvent.keyDown(grid, { key: 'ArrowLeft' })
    expect(active.value).toBe(2)
    active.value = 0
    await nextTick()
    expect(container.querySelector('[aria-selected="true"]')).toBe(container.querySelectorAll('.v-charts-cell')[0])
  })

  it('marks the latest point when it receives keyboard focus', async () => {
    const active = ref<number | null>(null)
    const { container } = render(() => (
      <Sparkline width={100} height={30} isAnimationActive={false} data={[3, 8, 4]} {...{ 'onUpdate:activeIndex': (index: number | null) => { active.value = index } }} />
    ))
    container.querySelector<SVGGElement>('.v-charts-sparkline g[role="img"]')!.focus()
    await nextTick()
    expect(active.value).toBe(2)
  })

  it('grows bars from zero, also below it', () => {
    const { container } = render(() => <Sparkline type="bar" width={100} height={40} gap={0} isAnimationActive={false} data={[10, -10]} />)
    const bars = Array.from(container.querySelectorAll('.v-charts-cell-rect'), rect => ({ y: Number(rect.getAttribute('y')), height: Number(rect.getAttribute('height')) }))
    expect(bars).toEqual([{ y: 0, height: 20 }, { y: 20, height: 20 }])
  })
})

describe('<BarList />', () => {
  const data = [{ name: '/docs', value: 50 }, { name: '/', value: 100, url: '/home' }, { name: '/blog', value: 25 }]
  const rows = (container: Element) => Array.from(container.querySelectorAll<HTMLElement>('.v-charts-bar-list-row'), row => ({
    name: row.querySelector('.v-charts-bar-list-name')!.textContent,
    value: row.querySelector('.v-charts-bar-list-value')!.textContent,
    width: row.querySelector<HTMLElement>('.v-charts-bar-list-bar')!.style.width,
    y: row.style.transform,
  }))

  it('ranks rows by value with bars relative to the largest and formatted values', () => {
    const { container } = render(() => <BarList data={data} href-key="url" isAnimationActive={false} valueFormat={v => `${v} visits`} />)
    expect(rows(container).sort((a, b) => a.y.localeCompare(b.y, undefined, { numeric: true }))).toEqual([
      { name: '/', value: '100 visits', width: '100%', y: 'translateY(0px)' },
      { name: '/docs', value: '50 visits', width: '50%', y: 'translateY(36px)' },
      { name: '/blog', value: '25 visits', width: '25%', y: 'translateY(72px)' },
    ])
    expect(container.querySelector('a')!.getAttribute('href')).toBe('/home')
  })

  it('keeps each row\'s element when ranks change', async () => {
    const list = ref(data)
    const { container } = render(() => <BarList data={list.value} isAnimationActive={false} />)
    const blog = Array.from(container.querySelectorAll('.v-charts-bar-list-row')).find(row => row.textContent?.includes('/blog'))
    list.value = data.map(row => row.name === '/blog' ? { ...row, value: 500 } : row)
    await nextTick()
    const blogAfter = Array.from(container.querySelectorAll<HTMLElement>('.v-charts-bar-list-row')).find(row => row.textContent?.includes('/blog'))!
    expect(blogAfter).toBe(blog)
    expect(blogAfter.style.transform).toBe('translateY(0px)')
  })
})

describe('server rendering', () => {
  it.each([
    // Like every chart, the server sends the entrance's start and the client plays it once the
    // list is on screen.
    ['BarList', () => <BarList data={[{ name: 'a', value: 2 }, { name: 'b', value: 1 }]} />, '.v-charts-bar-list-bar', (el: Element) => (el as HTMLElement).style.width, '0%'],
    ['Sparkline', () => <Sparkline width={100} height={30} data={[1, 3, 2]} />, '.v-charts-sparkline-line', (el: Element) => el.getAttribute('d')!.length > 0 ? 'drawn' : 'empty', 'drawn'],
  ])('%s hydrates the server state without a mismatch', async (_name, view, selector, read, expected) => {
    const html = await renderToString(createSSRApp({ render: view }))
    const container = document.createElement('div')
    container.innerHTML = html
    expect(read(container.querySelector(selector)!)).toBe(expected)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const app = createSSRApp({ render: view })
    app.mount(container)
    await nextTick()
    expect(read(container.querySelector(selector)!)).toBe(expected)
    expect(warn.mock.calls.filter(call => String(call[0]).includes('Hydration'))).toEqual([])
    warn.mockRestore()
    app.unmount()
  })
})
