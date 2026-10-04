import { fireEvent, render } from '@testing-library/vue'
import { renderToString } from 'vue/server-renderer'
import { createSSRApp, nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Bar, BarChart, Legend, Line, LineChart, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('legend', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
    { name: 'Page B', uv: 300, pv: 4567, amt: 2400 },
    { name: 'Page C', uv: 300, pv: 1398, amt: 2400 },
    { name: 'Page D', uv: 200, pv: 9800, amt: 2400 },
    { name: 'Page E', uv: 278, pv: 3908, amt: 2400 },
    { name: 'Page F', uv: 189, pv: 4800, amt: 2400 },
  ]

  // Catches dimensions silently discarded by the browser as unitless CSS lengths.
  it.each([
    { props: {}, width: '490px', height: 'auto' },
    { props: { width: 200, height: 40 }, width: '200px', height: '40px' },
    { props: { layout: 'vertical' as const, height: 70 }, width: 'auto', height: '70px' },
  ])('emits CSS units in server and client wrapper styles: $props', async ({ props, width, height }) => {
    const chart = () => (
      <LineChart width={500} height={300} data={data}>
        <Line dataKey="uv" isAnimationActive={false} />
        <Legend {...props} />
      </LineChart>
    )
    const server = document.createElement('div')
    server.innerHTML = await renderToString(createSSRApp({ render: chart }))
    const { container } = render(chart)
    await nextTick()
    for (const root of [server, container]) {
      const wrapper = root.querySelector<HTMLElement>('.v-charts-legend-wrapper')!
      expect(wrapper.style.width).toBe(width)
      expect(wrapper.style.height).toBe(height)
    }
  })

  describe('renders in BarChart', () => {
    it('renders legend wrapper', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      await nextTick()
      expect(container.querySelector('.v-charts-legend-wrapper')).toBeTruthy()
    })

    it('renders legend items for each Bar', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
          <Bar dataKey="uv" fill="#8884d8" name="UV" isAnimationActive={false} />
          <Bar dataKey="pv" fill="#82ca9d" name="PV" isAnimationActive={false} />
        </BarChart>
      ))

      await nextTick()
      expect(container.querySelectorAll('.v-charts-legend-item').length).toBe(2)
    })

    it('renders default legend list', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      await nextTick()
      expect(container.querySelector('.v-charts-default-legend')).toBeTruthy()
    })
  })

  describe('renders in LineChart', () => {
    it('renders legend items for each Line', async () => {
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
          <Line dataKey="uv" stroke="#8884d8" isAnimationActive={false} />
          <Line dataKey="pv" stroke="#82ca9d" isAnimationActive={false} />
        </LineChart>
      ))

      await nextTick()
      expect(container.querySelectorAll('.v-charts-legend-item').length).toBe(2)
    })
  })

  describe('props', () => {
    it('renders with verticalAlign top', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Legend verticalAlign="top" />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      await nextTick()
      expect(container.querySelector('.v-charts-legend-wrapper')).toBeTruthy()
    })

    it('renders with layout vertical', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Legend layout="vertical" />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      await nextTick()
      expect(container.querySelector('.v-charts-legend-wrapper')).toBeTruthy()
    })

    it('renders with custom iconSize', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Legend iconSize={20} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      await nextTick()
      expect(container.querySelectorAll('.v-charts-legend-item').length).toBe(1)
    })
  })

  describe('content slot', () => {
    it('renders custom content via content slot', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Legend>
            {{
              content: (props: any) => (
                <div class="custom-legend">
                  {props.payload?.map((entry: any, index: number) => (
                    <span key={index} class="custom-legend-item">{entry.value}</span>
                  ))}
                </div>
              ),
            }}
          </Legend>
          <Bar dataKey="uv" fill="#8884d8" name="UV" isAnimationActive={false} />
        </BarChart>
      ))

      await nextTick()
      expect(container.querySelector('.custom-legend')).toBeTruthy()
      expect(container.querySelectorAll('.custom-legend-item').length).toBe(1)
    })
  })

  describe('legend text', () => {
    it('displays data key as legend text when name is not provided', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
        </BarChart>
      ))

      await nextTick()
      const legendText = container.querySelector('.v-charts-legend-item-text')
      expect(legendText).toBeTruthy()
      expect(legendText!.textContent).toBe('uv')
    })

    it('displays name prop as legend text when provided', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
          <Bar dataKey="uv" fill="#8884d8" name="Unique Visitors" isAnimationActive={false} />
        </BarChart>
      ))

      await nextTick()
      const legendText = container.querySelector('.v-charts-legend-item-text')
      expect(legendText).toBeTruthy()
      expect(legendText!.textContent).toBe('Unique Visitors')
    })
  })
})

// Catches DOM fallthrough and missing event arguments on legend items.
it('emits legend entry, index, and the original mouse or keyboard event once', async () => {
  const click = vi.fn()
  const enter = vi.fn()
  const leave = vi.fn()
  const bbox = vi.fn()
  const { container } = render(() => (
    <BarChart width={500} height={300} data={[{ value: 10 }]}>
      <Bar dataKey="value" name="Value" isAnimationActive={false} />
      <Legend onClick={click} onMouseenter={enter} onMouseleave={leave} {...{ 'onBbox-update': bbox }} />
    </BarChart>
  ))
  await nextTick()
  const item = container.querySelector('.v-charts-legend-item')!
  for (const [name, listener] of [['click', click], ['mouseenter', enter], ['mouseleave', leave]] as const) {
    const event = new MouseEvent(name, { bubbles: true })
    await fireEvent(item, event)
    expect(listener.mock.calls).toEqual([[expect.objectContaining({ value: 'Value', dataKey: 'value' }), 0, event]])
  }
  const key = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
  await fireEvent(item, key)
  expect(click.mock.calls[1]).toEqual([expect.objectContaining({ value: 'Value' }), 0, key])
  expect(click).toHaveBeenCalledTimes(2)
  expect(bbox).toHaveBeenCalledWith({ width: expect.any(Number), height: expect.any(Number) })
})

// Catches legend proposals mutating hidden state without the parent's acceptance.
it.each([true, false])('keeps legend ownership when controlled=%s', async (controlled) => {
  const hidden = ref<string[] | undefined>(controlled ? ['uv'] : undefined)
  const update = vi.fn()
  const { container } = render(() => (
    <div>
      <BarChart width={500} height={300} data={[{ uv: 10, pv: 20 }]}>
        <Bar dataKey="uv" isAnimationActive={false} />
        <Bar dataKey="pv" hide isAnimationActive={false} />
        <Legend hidden={hidden.value} {...{ 'onUpdate:hidden': update }} />
      </BarChart>
      <BarChart width={500} height={300} data={[{ uv: 10 }]}>
        <Bar dataKey="uv" isAnimationActive={false} />
      </BarChart>
    </div>
  ))
  await nextTick()
  const charts = container.querySelectorAll('.v-charts-wrapper')
  const bars = () => charts[0].querySelectorAll('.v-charts-bar-rectangle').length
  const item = [...charts[0].querySelectorAll('.v-charts-legend-item')].find(item => item.textContent === 'uv')!
  const inactive = () => item.querySelector<HTMLElement>('.v-charts-legend-item-text')!.style.color
  expect(bars()).toBe(controlled ? 0 : 1)
  expect(charts[1].querySelectorAll('.v-charts-bar-rectangle')).toHaveLength(1)
  if (controlled)
    expect(inactive()).toBe('var(--v-charts-inactive, #a3a3a3)')
  await fireEvent.click(item)
  expect(update.mock.calls).toEqual(controlled ? [[[]]] : [])
  expect(bars()).toBe(controlled ? 0 : 1)
  if (controlled) {
    hidden.value = []
    await nextTick()
    expect(bars()).toBe(1)
    expect(inactive()).not.toBe('var(--v-charts-inactive, #a3a3a3)')
    await fireEvent.keyDown(item, { key: 'Enter' })
    expect(update.mock.calls.at(-1)).toEqual([['uv']])
    expect(bars()).toBe(1)
    hidden.value.push('uv')
    await nextTick()
    expect(bars()).toBe(0)
    expect(inactive()).toBe('var(--v-charts-inactive, #a3a3a3)')
    hidden.value = undefined
    await nextTick()
    expect(bars()).toBe(1)
  }
})
