import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { Bar, BarChart, Customized, Tooltip, XAxis, YAxis, useActiveTooltipLabel, useIsTooltipActive } from '@/index'
import type { CategoricalChartFunc } from '@/types'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => {
  mockGetBoundingClientRect({ width: 500, height: 300 })
})

const data = [{ name: 'A', value: 10 }, { name: 'B', value: 20 }]

const InteractionProbe = defineComponent({
  setup() {
    const label = useActiveTooltipLabel()
    const active = useIsTooltipActive()
    return () => <text data-testid="interaction" data-label={label.value} data-active={String(active.value)} />
  },
})

describe('public chart callbacks', () => {
  it('resolves bubbled touch coordinates against the chart wrapper', async () => {
    const onTouchMove = vi.fn<CategoricalChartFunc>()
    const { container } = render(() => (
      <BarChart width={500} height={300} data={data} onTouchmove={onTouchMove}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" isAnimationActive={false} />
      </BarChart>
    ))
    await nextTick()
    const target = container.querySelector('.v-charts-bar-rectangle')!
    expect(target).not.toBeNull()
    const event = new TouchEvent('touchmove', { bubbles: true })
    Object.defineProperty(event, 'touches', { value: [{ clientX: 200, clientY: 100, target }] })
    target.dispatchEvent(event)
    expect(onTouchMove.mock.calls[0][0]).toMatchObject({ activeLabel: 'A', isTooltipActive: true })
    const emptyTouch = new TouchEvent('touchmove', { bubbles: true })
    target.dispatchEvent(emptyTouch)
    expect(onTouchMove).toHaveBeenCalledTimes(2)
  })

  it.each([true, false])('preserves keyboard behavior with accessibilityLayer=%s', async (accessible) => {
    const { container } = render(() => (
      <BarChart width={500} height={300} data={data} accessibilityLayer={accessible}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" isAnimationActive={false} />
        <Customized>{{ default: () => <InteractionProbe /> }}</Customized>
      </BarChart>
    ))
    const wrapper = container.querySelector('.v-charts-wrapper')!
    const probe = container.querySelector('[data-testid="interaction"]')!
    wrapper.dispatchEvent(new FocusEvent('focus'))
    await nextTick()
    expect(probe.getAttribute('data-active')).toBe(String(accessible))
    if (accessible)
      expect(probe.getAttribute('data-label')).toBe('A')
    wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await nextTick()
    if (accessible)
      expect(probe.getAttribute('data-label')).toBe('B')
    wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await nextTick()
    if (accessible)
      expect(probe.getAttribute('data-label')).toBe('B')
    wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    await nextTick()
    expect(probe.getAttribute('data-active')).toBe('false')
  })

  it.each([
    ['click', 'onClick'],
    ['mouseenter', 'onMouseenter'],
    ['mouseleave', 'onMouseleave'],
    ['mousemove', 'onMousemove'],
    ['mousedown', 'onMousedown'],
    ['mouseup', 'onMouseup'],
    ['contextmenu', 'onContextmenu'],
    ['dblclick', 'onDblclick'],
    ['touchstart', 'onTouchstart'],
    ['touchmove', 'onTouchmove'],
    ['touchend', 'onTouchend'],
  ] as const)('delivers %s synchronously with the native currentTarget', async (eventName, propName) => {
    let currentTarget: EventTarget | null = null
    const callback = vi.fn<CategoricalChartFunc>((_state, event) => {
      currentTarget = event.currentTarget
    })
    const { container } = render(() => (
      <BarChart width={500} height={300} data={data} {...{ [propName]: callback }}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" isAnimationActive={false} />
      </BarChart>
    ))
    await nextTick()
    const wrapper = container.querySelector('.v-charts-wrapper')!
    const event = eventName.startsWith('touch')
      ? new TouchEvent(eventName, { bubbles: true })
      : new MouseEvent(eventName, { clientX: 200, clientY: 100, bubbles: true })
    if (event instanceof TouchEvent) {
      Object.defineProperty(event, 'touches', { value: [{ clientX: 200, clientY: 100, target: wrapper }] })
    }
    wrapper.dispatchEvent(event)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback.mock.calls[0][1]).toBe(event)
    expect(currentTarget).toBe(wrapper)
    expect(event.currentTarget).toBeNull()
  })

  it('reports current interaction state and keeps callback snapshots separate', async () => {
    const onMouseMove = vi.fn<CategoricalChartFunc>()
    const onMouseLeave = vi.fn<CategoricalChartFunc>()
    const { container } = render(() => (
      <BarChart width={500} height={300} data={data} onMousemove={onMouseMove} onMouseleave={onMouseLeave}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" isAnimationActive={false} />
      </BarChart>
    ))
    await nextTick()
    const wrapper = container.querySelector('.v-charts-wrapper')!
    wrapper.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 100 }))
    expect(onMouseMove.mock.calls[0][0]).toMatchObject({
      activeLabel: 'A',
      activeIndex: '0',
      activeTooltipIndex: '0',
      isTooltipActive: true,
    })
    const firstState = onMouseMove.mock.calls[0][0]
    wrapper.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 100 }))
    expect(onMouseMove.mock.calls[1][0]).not.toBe(firstState)
    wrapper.dispatchEvent(new MouseEvent('mouseleave'))
    expect(onMouseLeave.mock.calls[0][0].isTooltipActive).toBe(false)
    expect(firstState.isTooltipActive).toBe(true)
  })

  it('reads callback state from the chart that received the event', async () => {
    const firstCallback = vi.fn<CategoricalChartFunc>()
    const secondCallback = vi.fn<CategoricalChartFunc>()
    const { container } = render(() => (
      <div>
        <BarChart width={500} height={300} data={data} onMousemove={firstCallback}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" isAnimationActive={false} />
        </BarChart>
        <BarChart width={500} height={300} data={[{ name: 'Other', value: 30 }]} onMousemove={secondCallback}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" isAnimationActive={false} />
        </BarChart>
      </div>
    ))
    await nextTick()
    const wrappers = container.querySelectorAll('.v-charts-wrapper')
    wrappers[0].dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 100 }))
    expect(firstCallback.mock.calls[0][0].activeLabel).toBe('A')
    expect(secondCallback).not.toHaveBeenCalled()
    wrappers[1].dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 100 }))
    expect(secondCallback.mock.calls[0][0].activeLabel).toBe('Other')
    expect(firstCallback).toHaveBeenCalledTimes(1)
  })
})
