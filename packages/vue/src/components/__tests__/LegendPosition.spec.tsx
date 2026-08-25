import { render } from '@testing-library/vue'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { Bar, BarChart, Legend, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { appendOffsetOfLegend } from '@/utils/legend'
import { isOutsidePosition } from '@/cartesian/getCartesianPosition'
import { cartesianPositionToCSSTranslate } from '@/cartesian/cartesianPositionToCSSTranslate'
import type { LegendSettings } from '@/state/legendSlice'

const data = [
  { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 300, pv: 4567, amt: 2400 },
  { name: 'Page C', uv: 300, pv: 1398, amt: 2400 },
]

const baseSettings: LegendSettings = {
  layout: 'horizontal',
  align: 'center',
  verticalAlign: 'bottom',
}

const baseOffset = { top: 10, right: 20, bottom: 30, left: 40 }

describe('appendOffsetOfLegend with position', () => {
  const size = { width: 100, height: 50 }

  it('pushes plot area for outside top position including legend offset', () => {
    const settings: LegendSettings = { ...baseSettings, position: 'top', offset: 5 }
    expect(appendOffsetOfLegend(baseOffset, settings, size)).toEqual({ ...baseOffset, top: 10 + 50 + 5 })
  })

  it('pushes plot area for outside bottom position', () => {
    const settings: LegendSettings = { ...baseSettings, position: 'bottom', offset: 0 }
    expect(appendOffsetOfLegend(baseOffset, settings, size)).toEqual({ ...baseOffset, bottom: 30 + 50 })
  })

  it('pushes plot area for outside left position', () => {
    const settings: LegendSettings = { ...baseSettings, position: 'left', offset: 8 }
    expect(appendOffsetOfLegend(baseOffset, settings, size)).toEqual({ ...baseOffset, left: 40 + 100 + 8 })
  })

  it('pushes plot area for outside right position', () => {
    const settings: LegendSettings = { ...baseSettings, position: 'right', offset: 0 }
    expect(appendOffsetOfLegend(baseOffset, settings, size)).toEqual({ ...baseOffset, right: 20 + 100 })
  })

  it('does not push plot area for inside positions', () => {
    const insidePositions = [
      'insideLeft',
      'insideRight',
      'insideTop',
      'insideBottom',
      'insideTopLeft',
      'insideTopRight',
      'insideBottomLeft',
      'insideBottomRight',
      'center',
    ] as const
    for (const position of insidePositions) {
      const settings: LegendSettings = { ...baseSettings, position, offset: 5 }
      expect(appendOffsetOfLegend(baseOffset, settings, size)).toEqual(baseOffset)
    }
  })

  it('treats object position as outside but does not push any side', () => {
    const settings: LegendSettings = { ...baseSettings, position: { x: 10, y: 10 } }
    expect(appendOffsetOfLegend(baseOffset, settings, size)).toEqual(baseOffset)
  })

  it('falls back to legacy align/verticalAlign behavior when position is undefined', () => {
    expect(appendOffsetOfLegend(baseOffset, baseSettings, size)).toEqual({ ...baseOffset, bottom: 30 + 50 })
  })
})

describe('isOutsidePosition', () => {
  it('classifies positions', () => {
    expect(isOutsidePosition('top')).toBe(true)
    expect(isOutsidePosition('bottom')).toBe(true)
    expect(isOutsidePosition('left')).toBe(true)
    expect(isOutsidePosition('right')).toBe(true)
    expect(isOutsidePosition({ x: 1, y: 2 })).toBe(true)
    expect(isOutsidePosition('insideBottomRight')).toBe(false)
    expect(isOutsidePosition('center')).toBe(false)
    expect(isOutsidePosition(undefined)).toBe(false)
  })
})

describe('cartesianPositionToCSSTranslate', () => {
  it('returns empty string for start/start', () => {
    expect(cartesianPositionToCSSTranslate('start', 'start')).toBe('')
  })

  it('translates anchors to percentages', () => {
    expect(cartesianPositionToCSSTranslate('end', 'end')).toBe('translate(-100%, -100%)')
    expect(cartesianPositionToCSSTranslate('middle', 'middle')).toBe('translate(-50%, -50%)')
    expect(cartesianPositionToCSSTranslate('start', 'end')).toBe('translate(0, -100%)')
  })
})

describe('Legend position prop', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  it('positions legend inside bottom right of the plot area without shrinking it', async () => {
    const { container } = render(() => (
      <BarChart width={500} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Legend position="insideBottomRight" />
        <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
      </BarChart>
    ))

    await nextTick()
    await nextTick()
    const wrapper = container.querySelector<HTMLElement>('.v-charts-legend-wrapper')
    expect(wrapper).toBeTruthy()
    const style = wrapper!.getAttribute('style') ?? ''
    expect(style).toContain('transform: translate(-100%, -100%)')
    // position mode caps the wrapper at the plot area size (cross-axis halved)
    expect(style).toContain('max-width')
    expect(style).toContain('max-height')
  })

  it('positions legend outside top with offset using transform anchor', async () => {
    const { container } = render(() => (
      <BarChart width={500} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Legend position="top" offset={10} />
        <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
      </BarChart>
    ))

    await nextTick()
    await nextTick()
    const wrapper = container.querySelector<HTMLElement>('.v-charts-legend-wrapper')
    expect(wrapper).toBeTruthy()
    const style = wrapper!.getAttribute('style') ?? ''
    expect(style).toContain('transform: translate(-50%, -100%)')
  })

  it('resolves auto layout to vertical for insideLeft position', async () => {
    const { container } = render(() => (
      <BarChart width={500} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Legend position="insideLeft" />
        <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
      </BarChart>
    ))

    await nextTick()
    await nextTick()
    const list = container.querySelector<HTMLElement>('.v-charts-default-legend')
    expect(list).toBeTruthy()
    // vertical layout renders items left-aligned instead of centered
    expect(list!.getAttribute('style')).toContain('text-align: left')
  })

  it('keeps horizontal layout for bottom position', async () => {
    const { container } = render(() => (
      <BarChart width={500} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Legend position="bottom" />
        <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
      </BarChart>
    ))

    await nextTick()
    await nextTick()
    const list = container.querySelector<HTMLElement>('.v-charts-default-legend')
    expect(list).toBeTruthy()
    expect(list!.getAttribute('style')).toContain('text-align: center')
  })
})
