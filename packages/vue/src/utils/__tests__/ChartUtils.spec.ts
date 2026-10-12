import { describe, expect, it } from 'vitest'
import { MAX_VALUE_REG, MIN_VALUE_REG } from '@/core/axis/userDomain'
import { calculateActiveTickIndex, calculateTooltipPos, getActiveCoordinate, inRange } from '@/core/interaction'
import { getBandSizeOfAxis } from '@/core/axis/scale'
import { getBaseValueOfBar, getCateCoordinateOfBar, getCateCoordinateOfLine, getNormalizedStackId, isClipDot, truncateByDomain } from '@/core/coordinates'
import { getDomainOfStackGroups, getStackedData } from '@/core/axis/stacks'
import { getTicksOfAxis } from '@/core/axis/ticks'
import { getTooltipEntry, getTooltipNameProp } from '@/core/tooltip'
import { getValueByDataKey } from '@/utils/chart'
import type { TickItem } from '@/types'

describe('getValueByDataKey', () => {
  const data = { name: 'Alice', age: 30, nested: { score: 95 } }

  it.each([
    { name: 'returns value by string key', check: () => {
      expect(getValueByDataKey(data, 'name')).toBe('Alice')
      expect(getValueByDataKey(data, 'age')).toBe(30)
    } },
    { name: 'returns value by nested dot-path string key', check: () => {
      expect(getValueByDataKey(data, 'nested.score')).toBe(95)
    } },
    { name: 'returns value by function key', check: () => {
      expect(getValueByDataKey(data, (d: any) => d.age * 2)).toBe(60)
    } },
    { name: 'returns defaultValue when obj is null/undefined', check: () => {
      expect(getValueByDataKey(null, 'name', 'fallback')).toBe('fallback')
      expect(getValueByDataKey(undefined, 'name', 'fallback')).toBe('fallback')
    } },
    { name: 'returns defaultValue when dataKey is null/undefined', check: () => {
      expect(getValueByDataKey(data, null as any, 'fallback')).toBe('fallback')
      expect(getValueByDataKey(data, undefined as any, 'fallback')).toBe('fallback')
    } },
    { name: 'returns defaultValue when key does not exist', check: () => {
      expect(getValueByDataKey(data, 'missing', 'default')).toBe('default')
    } },
    { name: 'returns value by numeric key (array index)', check: () => {
      const arr = ['a', 'b', 'c']
      expect(getValueByDataKey(arr, 1)).toBe('b')
    } },
  ])('$name', ({ check }) => check())

  it.each([
    { obj: { 'metrics.total': undefined, 'metrics': { total: 42 } }, key: 'metrics.total', expected: 'fallback' },
    { obj: { metrics: { total: 42 } }, key: 'metrics.total', expected: 42 },
    { obj: { 'a.b': 1, 'a': { b: 2 } }, key: 'a.b', expected: 1 },
    { obj: ['a', 'b', 'c'], key: 1, expected: 'b' },
    { obj: {}, key: 'missing', expected: 'fallback' },
    { obj: { metrics: [{ total: 42 }] }, key: 'metrics[0].total', expected: 42 },
  ])('prefers an own key over a path: $key → $expected', ({ obj, key, expected }) => {
    expect(getValueByDataKey(obj, key, 'fallback')).toBe(expected)
  })
})

describe('truncateByDomain', () => {
  it.each([
    { name: 'clamps value within domain', check: () => {
      const value = [-5, 200] as any
      const domain = [0, 100]
      const result = truncateByDomain(value, domain)
      expect(result).toEqual([0, 100])
    } },
    { name: 'returns value unchanged when within domain', check: () => {
      const value = [20, 80] as any
      const domain = [0, 100]
      const result = truncateByDomain(value, domain)
      expect(result).toEqual([20, 80])
    } },
    { name: 'returns original value when domain is invalid', check: () => {
      const value = [10, 90] as any
      expect(truncateByDomain(value, [])).toBe(value)
      expect(truncateByDomain(value, [1] as any)).toBe(value)
      expect(truncateByDomain(value, null as any)).toBe(value)
    } },
    { name: 'handles reversed domain', check: () => {
      const value = [-5, 200] as any
      const domain = [100, 0]
      const result = truncateByDomain(value, domain)
      expect(result).toEqual([0, 100])
    } },
    { name: 'clamps both values when both exceed domain', check: () => {
      const value = [150, 200] as any
      const domain = [0, 100]
      const result = truncateByDomain(value, domain)
      expect(result).toEqual([100, 100])
    } },
  ])('$name', ({ check }) => check())
})

describe('getNormalizedStackId', () => {
  it.each([
    { name: 'returns undefined for null/undefined', check: () => {
      expect(getNormalizedStackId(undefined)).toBeUndefined()
      expect(getNormalizedStackId(null as any)).toBeUndefined()
    } },
    { name: 'converts number to string', check: () => {
      expect(getNormalizedStackId(1)).toBe('1')
    } },
    { name: 'keeps string as string', check: () => {
      expect(getNormalizedStackId('stack-a')).toBe('stack-a')
    } },
  ])('$name', ({ check }) => check())
})

it.each([
  ['horizontal', 10],
  ['vertical', 20],
  ['centric', 45],
  ['radial', 100],
] as const)('calculateTooltipPos uses %s coordinates', (layout, expected) => {
  expect(calculateTooltipPos({ x: 10, y: 20, angle: 45, radius: 100 }, layout)).toBe(expected)
})

describe('getTooltipNameProp', () => {
  it.each([
    { name: 'returns stringified nameFromItem when truthy', check: () => {
      expect(getTooltipNameProp('Revenue', 'key')).toBe('Revenue')
      expect(getTooltipNameProp(42, 'key')).toBe('42')
    } },
    { name: 'falls back to dataKey when nameFromItem is falsy and dataKey is string', check: () => {
      expect(getTooltipNameProp(undefined, 'revenue')).toBe('revenue')
      expect(getTooltipNameProp('', 'revenue')).toBe('revenue')
    } },
    { name: 'returns undefined when both are unusable', check: () => {
      expect(getTooltipNameProp(undefined, undefined)).toBeUndefined()
      expect(getTooltipNameProp(undefined, (d: any) => d.v)).toBeUndefined()
    } },
  ])('$name', ({ check }) => check())
})

describe('isClipDot', () => {
  it.each([
    { name: 'returns true by default (no dot config)', check: () => {
      expect(isClipDot(undefined)).toBe(true)
      expect(isClipDot(null)).toBe(true)
      expect(isClipDot(true)).toBe(true)
    } },
    { name: 'reads clipDot property from object', check: () => {
      expect(isClipDot({ clipDot: false })).toBe(false)
      expect(isClipDot({ clipDot: true })).toBe(true)
    } },
    { name: 'returns true for object without clipDot', check: () => {
      expect(isClipDot({ r: 5 })).toBe(true)
    } },
  ])('$name', ({ check }) => check())
})

describe('mIN_VALUE_REG / MAX_VALUE_REG', () => {
  it.each([
    { name: 'matches dataMin - N', check: () => {
      const match = 'dataMin - 10'.match(MIN_VALUE_REG)
      expect(match).not.toBeNull()
      expect(match![1]).toBe('10')
    } },
    { name: 'matches dataMin - decimal', check: () => {
      const match = 'dataMin - 2.5'.match(MIN_VALUE_REG)
      expect(match).not.toBeNull()
      expect(match![1]).toBe('2.5')
    } },
    { name: 'matches dataMax + N', check: () => {
      const match = 'dataMax + 100'.match(MAX_VALUE_REG)
      expect(match).not.toBeNull()
      expect(match![1]).toBe('100')
    } },
    { name: 'does not match invalid format', check: () => {
      expect('dataMin + 10'.match(MIN_VALUE_REG)).toBeNull()
      expect('dataMax - 10'.match(MAX_VALUE_REG)).toBeNull()
    } },
  ])('$name', ({ check }) => check())
})

describe('getTooltipEntry', () => {
  it('merges settings with entry data', () => {
    const settings = { stroke: '#ff0000', fill: '#00ff00', strokeWidth: 2 } as any
    const result = getTooltipEntry({
      tooltipEntrySettings: settings,
      dataKey: 'revenue',
      payload: { revenue: 100 },
      value: 100,
      name: 'Revenue',
    })
    expect(result).toEqual({
      stroke: '#ff0000',
      fill: '#00ff00',
      strokeWidth: 2,
      dataKey: 'revenue',
      payload: { revenue: 100 },
      value: 100,
      name: 'Revenue',
    })
  })
})

describe('getBandSizeOfAxis', () => {
  it.each([
    { name: 'returns bandwidth when axis has scale.bandwidth', check: () => {
      const axis = { scale: { bandwidth: () => 20 } } as any
      expect(getBandSizeOfAxis(axis)).toBe(20)
    } },
    { name: 'returns undefined for bar when bandwidth is 0', check: () => {
      const axis = { scale: { bandwidth: () => 0 } } as any
      expect(getBandSizeOfAxis(axis, [], true)).toBeUndefined()
    } },
    { name: 'returns 0 bandwidth for non-bar when bandwidth is 0', check: () => {
      const axis = { scale: { bandwidth: () => 0 } } as any
      expect(getBandSizeOfAxis(axis, [], false)).toBe(0)
    } },
    { name: 'computes minimum distance between ticks when no bandwidth', check: () => {
      const axis = { scale: {} } as any
      const ticks: TickItem[] = [
        { coordinate: 10, value: 'a', index: 0, offset: 0 },
        { coordinate: 30, value: 'b', index: 1, offset: 0 },
        { coordinate: 60, value: 'c', index: 2, offset: 0 },
      ]
      expect(getBandSizeOfAxis(axis, ticks)).toBe(20) // min(30-10, 60-30)
    } },
    { name: 'returns 0 when ticks has fewer than 2 entries and not bar', check: () => {
      const axis = { scale: {} } as any
      expect(getBandSizeOfAxis(axis, [{ coordinate: 10, value: 'a', index: 0, offset: 0 }])).toBe(0)
    } },
    { name: 'returns undefined when ticks has fewer than 2 entries and is bar', check: () => {
      const axis = { scale: {} } as any
      expect(getBandSizeOfAxis(axis, [], true)).toBeUndefined()
    } },
  ])('$name', ({ check }) => check())
})

describe('getTicksOfAxis', () => {
  it.each([
    { name: 'returns null when axis is null', check: () => {
      expect(getTicksOfAxis(null)).toBeNull()
    } },
    { name: 'returns null when axis has no scale', check: () => {
      expect(getTicksOfAxis({ scale: undefined } as any)).toBeNull()
    } },
    { name: 'returns ticks from categoricalDomain when isCategorical', check: () => {
      const scale = (v: number) => v * 10
      const axis = {
        scale,
        isCategorical: true,
        categoricalDomain: [1, 2, 3],
        type: 'category',
      } as any
      const result = getTicksOfAxis(axis)!
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ coordinate: 10, value: 1, index: 0, offset: 0 })
      expect(result[2]).toEqual({ coordinate: 30, value: 3, index: 2, offset: 0 })
    } },
    { name: 'uses scale.ticks when available and not isAll', check: () => {
      const scale = (v: number) => v * 5
      scale.ticks = (count: number) => [0, 25, 50, 75, 100]
      const axis = {
        scale,
        tickCount: 5,
        type: 'number',
      } as any
      const result = getTicksOfAxis(axis)!
      expect(result).toHaveLength(5)
      expect(result[0].coordinate).toBe(0)
      expect(result[4].coordinate).toBe(500)
    } },
    { name: 'falls back to scale.domain when no ticks method', check: () => {
      const domainValues = ['Mon', 'Tue', 'Wed']
      const scale = (v: string) => domainValues.indexOf(v) * 10
      scale.domain = () => domainValues
      const axis = {
        scale,
        type: 'category',
      } as any
      const result = getTicksOfAxis(axis, false, true)!
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ coordinate: 0, value: 'Mon', index: 0, offset: 0 })
    } },
    { name: 'uses ticks for grid mode and filters NaN coordinates', check: () => {
      const scale = (v: any) => (typeof v === 'number' ? v * 10 : NaN)
      const axis = {
        scale,
        ticks: [1, 2, 'bad', 4],
        type: 'number',
      } as any
      const result = getTicksOfAxis(axis, true)!
      expect(result).toHaveLength(3) // 'bad' produces NaN, filtered out
      expect(result.map(t => t.value)).toEqual([1, 2, 4])
    } },
  ])('$name', ({ check }) => check())
})

describe('calculateActiveTickIndex', () => {
  const ticks: TickItem[] = [
    { coordinate: 0, value: 'a', index: 0, offset: 0 },
    { coordinate: 100, value: 'b', index: 1, offset: 0 },
    { coordinate: 200, value: 'c', index: 2, offset: 0 },
    { coordinate: 300, value: 'd', index: 3, offset: 0 },
  ]
  it.each([
    { coordinate: 50, input: [], expected: 0 },
    { coordinate: 50, input: [ticks[0]], expected: 0 },
    { coordinate: 40, input: ticks, expected: 0 },
    { coordinate: 60, input: ticks, expected: 1 },
    { coordinate: -50, input: ticks, expected: 0 },
    { coordinate: 350, input: ticks, expected: 3 },
    { coordinate: 160, input: ticks, expected: 2 },
  ])('selects $expected at $coordinate', ({ coordinate, input, expected }) => {
    expect(calculateActiveTickIndex(coordinate, input, input, undefined, undefined)).toBe(expected)
  })
})

describe('getActiveCoordinate', () => {
  const tooltipTicks: TickItem[] = [
    { coordinate: 50, value: 'a', index: 0, offset: 0 },
    { coordinate: 150, value: 'b', index: 1, offset: 0 },
  ]

  it.each([
    { name: 'returns x,y for horizontal layout', check: () => {
      const result = getActiveCoordinate('horizontal', tooltipTicks, 0, { y: 100 })
      expect(result).toEqual({ x: 50, y: 100 })
    } },
    { name: 'returns x,y for vertical layout', check: () => {
      const result = getActiveCoordinate('vertical', tooltipTicks, 1, { x: 80 })
      expect(result).toEqual({ x: 80, y: 150 })
    } },
    { name: 'returns origin when no matching tick', check: () => {
      const result = getActiveCoordinate('horizontal', tooltipTicks, 99, { y: 100 })
      expect(result).toEqual({ x: 0, y: 0 })
    } },
  ])('$name', ({ check }) => check())
})

it.each([
  { x: 50, y: 50, expected: { x: 50, y: 50 } },
  { x: 5, y: 50, expected: null },
  { x: 50, y: 5, expected: null },
  { x: 120, y: 50, expected: null },
  { x: 50, y: 120, expected: null },
])('inRange clips $x,$y to the plot', ({ x, y, expected }) => {
  for (const layout of ['horizontal', 'vertical'] as const)
    expect(inRange(x, y, layout, undefined, { left: 10, top: 10, width: 100, height: 100 })).toEqual(expected)
})

describe('getDomainOfStackGroups', () => {
  it.each([
    { name: 'returns undefined for null/undefined input', check: () => {
      expect(getDomainOfStackGroups(undefined, 0, 2)).toBeUndefined()
      expect(getDomainOfStackGroups(null as any, 0, 2)).toBeUndefined()
    } },
    { name: 'computes domain from stacked data', check: () => {
      const stackGroups = {
        stack1: {
          stackedData: [
            [[0, 10], [0, 20], [0, 30]],
            [[10, 15], [20, 40], [30, 35]],
          ],
        },
      } as any
      const result = getDomainOfStackGroups(stackGroups, 0, 2)
      expect(result).toEqual([0, 40])
    } },
    { name: 'handles negative values', check: () => {
      const stackGroups = {
        s1: {
          stackedData: [
            [[-10, 5], [0, 20]],
          ],
        },
      } as any
      const result = getDomainOfStackGroups(stackGroups, 0, 1)
      expect(result).toEqual([-10, 20])
    } },
    { name: 'replaces Infinity with 0', check: () => {
      const stackGroups = {
        s1: {
          stackedData: [
            [['not a number']],
          ],
        },
      } as any
      const result = getDomainOfStackGroups(stackGroups, 0, 0)
      // No valid numbers → Infinity/-Infinity → clamped to [0, 0]
      expect(result).toEqual([0, 0])
    } },
  ])('$name', ({ check }) => check())
})

describe('getBaseValueOfBar', () => {
  it.each([
    { name: 'returns 0 when domain spans zero for number axis', check: () => {
      const axis = { type: 'number', scale: { domain: () => [-10, 50] } } as any
      expect(getBaseValueOfBar({ numericAxis: axis })).toBe(0)
    } },
    { name: 'returns maxValue when domain is all negative', check: () => {
      const axis = { type: 'number', scale: { domain: () => [-100, -10] } } as any
      expect(getBaseValueOfBar({ numericAxis: axis })).toBe(-10)
    } },
    { name: 'returns minValue when domain is all positive', check: () => {
      const axis = { type: 'number', scale: { domain: () => [10, 100] } } as any
      expect(getBaseValueOfBar({ numericAxis: axis })).toBe(10)
    } },
    { name: 'returns first domain value for non-number axis', check: () => {
      const axis = { type: 'category', scale: { domain: () => ['a', 'b'] } } as any
      expect(getBaseValueOfBar({ numericAxis: axis })).toBe('a')
    } },
  ])('$name', ({ check }) => check())
})

describe('getCateCoordinateOfBar', () => {
  const ticks: TickItem[] = [
    { coordinate: 10, value: 'a', index: 0, offset: 0 },
    { coordinate: 50, value: 'b', index: 1, offset: 0 },
  ]

  it.each([
    { name: 'returns coordinate + offset for category axis', check: () => {
      const axis = { type: 'category' } as any
      expect(getCateCoordinateOfBar({ axis, ticks, offset: 5, bandSize: 20, entry: {}, index: 0 })).toBe(15)
    } },
    { name: 'returns null when tick does not exist at index for category axis', check: () => {
      const axis = { type: 'category' } as any
      expect(getCateCoordinateOfBar({ axis, ticks, offset: 5, bandSize: 20, entry: {}, index: 5 })).toBeNull()
    } },
    { name: 'uses scale for non-category axis', check: () => {
      const scale = (v: number) => v * 2
      scale.domain = () => [0, 100]
      const axis = { type: 'number', scale, dataKey: 'v' } as any
      const result = getCateCoordinateOfBar({ axis, ticks, offset: 5, bandSize: 20, entry: { v: 25 }, index: 0 })
      // scale(25) - bandSize/2 + offset = 50 - 10 + 5 = 45
      expect(result).toBe(45)
    } },
  ])('$name', ({ check }) => check())
})

describe('getCateCoordinateOfLine', () => {
  const ticks: TickItem[] = [
    { coordinate: 0, value: 'Mon', index: 0, offset: 0 },
    { coordinate: 100, value: 'Tue', index: 1, offset: 0 },
    { coordinate: 200, value: 'Wed', index: 2, offset: 0 },
  ]

  it.each([
    { name: 'returns coordinate + bandSize/2 by index for category axis', check: () => {
      const axis = { type: 'category', scale: (v: number) => v } as any
      const result = getCateCoordinateOfLine({ axis, ticks: ticks as any, bandSize: 20, entry: {} as any, index: 1 })
      expect(result).toBe(110) // 100 + 20/2
    } },
    { name: 'returns null when tick at index does not exist', check: () => {
      const axis = { type: 'category', scale: (v: number) => v } as any
      const result = getCateCoordinateOfLine({ axis, ticks: ticks as any, bandSize: 20, entry: {} as any, index: 10 })
      expect(result).toBeNull()
    } },
    { name: 'uses scale for non-category axis', check: () => {
      const scale = (v: number) => v * 3
      const axis = { type: 'number', scale, dataKey: 'val' } as any
      const result = getCateCoordinateOfLine({ axis, ticks: ticks as any, bandSize: 20, entry: { val: 10 } as any, index: 0 })
      expect(result).toBe(30) // scale(10) = 30
    } },
    { name: 'uses matched tick for category axis with allowDuplicatedCategory=false', check: () => {
      const axis = { type: 'category', allowDuplicatedCategory: false, dataKey: 'day', scale: (v: number) => v } as any
      const entry = { day: 'Tue' }
      const result = getCateCoordinateOfLine({ axis, ticks: ticks as any, bandSize: 20, entry: entry as any, index: 0 })
      // Matches tick 'Tue' at coordinate 100, returns 100 + 10 = 110
      expect(result).toBe(110)
    } },
  ])('$name', ({ check }) => check())
})

describe('offsetSign', () => {
  it.each([
    { name: 'separates positive and negative stacks', check: () => {
      const series = getStackedData([
        { a: 10, b: 20 },
        { a: -5, b: -3 },
      ], ['a', 'b'], 'sign')

      // First data point: series[0] = [0, 10], series[1] = [10, 30]
      expect(series[0][0].slice()).toEqual([0, 10])
      expect(series[1][0].slice()).toEqual([10, 30])

      // Second data point: series[0] = [0, -5], series[1] = [-5, -8]
      expect(series[0][1].slice()).toEqual([0, -5])
      expect(series[1][1].slice()).toEqual([-5, -8])
    } },
    { name: 'handles empty series', check: () => {
      expect(getStackedData([], ['a', 'b'], 'sign').map(series => series.length)).toEqual([0, 0])
    } },
  ])('$name', ({ check }) => check())
})

describe('offsetPositive', () => {
  it('replaces negative values with zero', () => {
    const series = getStackedData([
      { a: 10, b: 20 },
      { a: -5, b: -3 },
    ], ['a', 'b'], 'positive')

    // First data point: positive values stack normally
    expect(series[0][0].slice()).toEqual([0, 10])
    expect(series[1][0].slice()).toEqual([10, 30])

    // Second data point: negative values become [0, 0]
    expect(series[0][1].slice()).toEqual([0, 0])
    expect(series[1][1].slice()).toEqual([0, 0])
  })
})
