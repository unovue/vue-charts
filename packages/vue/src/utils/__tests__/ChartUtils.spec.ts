import { describe, expect, it } from 'vitest'
import {
  MAX_VALUE_REG,
  MIN_VALUE_REG,
  calculateActiveTickIndex,
  calculateTooltipPos,
  getActiveCoordinate,
  getBandSizeOfAxis,
  getBaseValueOfBar,
  getCateCoordinateOfBar,
  getCateCoordinateOfLine,
  getDomainOfStackGroups,
  getNormalizedStackId,
  getStackedData,
  getTicksOfAxis,
  getTooltipEntry,
  getTooltipNameProp,
  getValueByDataKey,
  inRange,
  isClipDot,
  truncateByDomain,
} from '@/utils/chart'
import type { TickItem } from '@/types'

describe('getValueByDataKey', () => {
  const data = { name: 'Alice', age: 30, nested: { score: 95 } }

  it('returns value by string key', () => {
    expect(getValueByDataKey(data, 'name')).toBe('Alice')
    expect(getValueByDataKey(data, 'age')).toBe(30)
  })

  it('returns value by nested dot-path string key', () => {
    expect(getValueByDataKey(data, 'nested.score')).toBe(95)
  })

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

  it('returns value by function key', () => {
    expect(getValueByDataKey(data, (d: any) => d.age * 2)).toBe(60)
  })

  it('returns defaultValue when obj is null/undefined', () => {
    expect(getValueByDataKey(null, 'name', 'fallback')).toBe('fallback')
    expect(getValueByDataKey(undefined, 'name', 'fallback')).toBe('fallback')
  })

  it('returns defaultValue when dataKey is null/undefined', () => {
    expect(getValueByDataKey(data, null as any, 'fallback')).toBe('fallback')
    expect(getValueByDataKey(data, undefined as any, 'fallback')).toBe('fallback')
  })

  it('returns defaultValue when key does not exist', () => {
    expect(getValueByDataKey(data, 'missing', 'default')).toBe('default')
  })

  it('returns value by numeric key (array index)', () => {
    const arr = ['a', 'b', 'c']
    expect(getValueByDataKey(arr, 1)).toBe('b')
  })
})

describe('truncateByDomain', () => {
  it('clamps value within domain', () => {
    const value = [-5, 200] as any
    const domain = [0, 100]
    const result = truncateByDomain(value, domain)
    expect(result).toEqual([0, 100])
  })

  it('returns value unchanged when within domain', () => {
    const value = [20, 80] as any
    const domain = [0, 100]
    const result = truncateByDomain(value, domain)
    expect(result).toEqual([20, 80])
  })

  it('returns original value when domain is invalid', () => {
    const value = [10, 90] as any
    expect(truncateByDomain(value, [])).toBe(value)
    expect(truncateByDomain(value, [1] as any)).toBe(value)
    expect(truncateByDomain(value, null as any)).toBe(value)
  })

  it('handles reversed domain', () => {
    const value = [-5, 200] as any
    const domain = [100, 0]
    const result = truncateByDomain(value, domain)
    expect(result).toEqual([0, 100])
  })

  it('clamps both values when both exceed domain', () => {
    const value = [150, 200] as any
    const domain = [0, 100]
    const result = truncateByDomain(value, domain)
    expect(result).toEqual([100, 100])
  })
})

describe('getNormalizedStackId', () => {
  it('returns undefined for null/undefined', () => {
    expect(getNormalizedStackId(undefined)).toBeUndefined()
    expect(getNormalizedStackId(null as any)).toBeUndefined()
  })

  it('converts number to string', () => {
    expect(getNormalizedStackId(1)).toBe('1')
  })

  it('keeps string as string', () => {
    expect(getNormalizedStackId('stack-a')).toBe('stack-a')
  })
})

describe('calculateTooltipPos', () => {
  const rangeObj = { x: 10, y: 20, angle: 45, radius: 100 }

  it('returns x for horizontal layout', () => {
    expect(calculateTooltipPos(rangeObj, 'horizontal')).toBe(10)
  })

  it('returns y for vertical layout', () => {
    expect(calculateTooltipPos(rangeObj, 'vertical')).toBe(20)
  })

  it('returns angle for centric layout', () => {
    expect(calculateTooltipPos(rangeObj, 'centric')).toBe(45)
  })

  it('returns radius for radial layout', () => {
    expect(calculateTooltipPos(rangeObj, 'radial')).toBe(100)
  })
})

describe('getTooltipNameProp', () => {
  it('returns stringified nameFromItem when truthy', () => {
    expect(getTooltipNameProp('Revenue', 'key')).toBe('Revenue')
    expect(getTooltipNameProp(42, 'key')).toBe('42')
  })

  it('falls back to dataKey when nameFromItem is falsy and dataKey is string', () => {
    expect(getTooltipNameProp(undefined, 'revenue')).toBe('revenue')
    expect(getTooltipNameProp('', 'revenue')).toBe('revenue')
  })

  it('returns undefined when both are unusable', () => {
    expect(getTooltipNameProp(undefined, undefined)).toBeUndefined()
    expect(getTooltipNameProp(undefined, (d: any) => d.v)).toBeUndefined()
  })
})

describe('isClipDot', () => {
  it('returns true by default (no dot config)', () => {
    expect(isClipDot(undefined)).toBe(true)
    expect(isClipDot(null)).toBe(true)
    expect(isClipDot(true)).toBe(true)
  })

  it('reads clipDot property from object', () => {
    expect(isClipDot({ clipDot: false })).toBe(false)
    expect(isClipDot({ clipDot: true })).toBe(true)
  })

  it('returns true for object without clipDot', () => {
    expect(isClipDot({ r: 5 })).toBe(true)
  })
})

describe('mIN_VALUE_REG / MAX_VALUE_REG', () => {
  it('matches dataMin - N', () => {
    const match = 'dataMin - 10'.match(MIN_VALUE_REG)
    expect(match).not.toBeNull()
    expect(match![1]).toBe('10')
  })

  it('matches dataMin - decimal', () => {
    const match = 'dataMin - 2.5'.match(MIN_VALUE_REG)
    expect(match).not.toBeNull()
    expect(match![1]).toBe('2.5')
  })

  it('matches dataMax + N', () => {
    const match = 'dataMax + 100'.match(MAX_VALUE_REG)
    expect(match).not.toBeNull()
    expect(match![1]).toBe('100')
  })

  it('does not match invalid format', () => {
    expect('dataMin + 10'.match(MIN_VALUE_REG)).toBeNull()
    expect('dataMax - 10'.match(MAX_VALUE_REG)).toBeNull()
  })
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
  it('returns bandwidth when axis has scale.bandwidth', () => {
    const axis = { scale: { bandwidth: () => 20 } } as any
    expect(getBandSizeOfAxis(axis)).toBe(20)
  })

  it('returns undefined for bar when bandwidth is 0', () => {
    const axis = { scale: { bandwidth: () => 0 } } as any
    expect(getBandSizeOfAxis(axis, [], true)).toBeUndefined()
  })

  it('returns 0 bandwidth for non-bar when bandwidth is 0', () => {
    const axis = { scale: { bandwidth: () => 0 } } as any
    expect(getBandSizeOfAxis(axis, [], false)).toBe(0)
  })

  it('computes minimum distance between ticks when no bandwidth', () => {
    const axis = { scale: {} } as any
    const ticks: TickItem[] = [
      { coordinate: 10, value: 'a', index: 0, offset: 0 },
      { coordinate: 30, value: 'b', index: 1, offset: 0 },
      { coordinate: 60, value: 'c', index: 2, offset: 0 },
    ]
    expect(getBandSizeOfAxis(axis, ticks)).toBe(20) // min(30-10, 60-30)
  })

  it('returns 0 when ticks has fewer than 2 entries and not bar', () => {
    const axis = { scale: {} } as any
    expect(getBandSizeOfAxis(axis, [{ coordinate: 10, value: 'a', index: 0, offset: 0 }])).toBe(0)
  })

  it('returns undefined when ticks has fewer than 2 entries and is bar', () => {
    const axis = { scale: {} } as any
    expect(getBandSizeOfAxis(axis, [], true)).toBeUndefined()
  })
})

describe('getTicksOfAxis', () => {
  it('returns null when axis is null', () => {
    expect(getTicksOfAxis(null)).toBeNull()
  })

  it('returns null when axis has no scale', () => {
    expect(getTicksOfAxis({ scale: undefined } as any)).toBeNull()
  })

  it('returns ticks from categoricalDomain when isCategorical', () => {
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
  })

  it('uses scale.ticks when available and not isAll', () => {
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
  })

  it('falls back to scale.domain when no ticks method', () => {
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
  })

  it('uses ticks for grid mode and filters NaN coordinates', () => {
    const scale = (v: any) => (typeof v === 'number' ? v * 10 : NaN)
    const axis = {
      scale,
      ticks: [1, 2, 'bad', 4],
      type: 'number',
    } as any
    const result = getTicksOfAxis(axis, true)!
    expect(result).toHaveLength(3) // 'bad' produces NaN, filtered out
    expect(result.map(t => t.value)).toEqual([1, 2, 4])
  })
})

describe('calculateActiveTickIndex', () => {
  const ticks: TickItem[] = [
    { coordinate: 0, value: 'a', index: 0, offset: 0 },
    { coordinate: 100, value: 'b', index: 1, offset: 0 },
    { coordinate: 200, value: 'c', index: 2, offset: 0 },
    { coordinate: 300, value: 'd', index: 3, offset: 0 },
  ]

  it('returns 0 when there is one or fewer ticks', () => {
    expect(calculateActiveTickIndex(50, [ticks[0]], [ticks[0]], undefined, undefined)).toBe(0)
    expect(calculateActiveTickIndex(50, [], [], undefined, undefined)).toBe(0)
  })

  it('finds nearest tick in linear axis', () => {
    // coordinate 40 is closest to tick at 0 (midpoint with next is 50)
    expect(calculateActiveTickIndex(40, ticks, ticks, undefined, undefined)).toBe(0)
    // coordinate 60 is past midpoint, closer to tick at 100
    expect(calculateActiveTickIndex(60, ticks, ticks, undefined, undefined)).toBe(1)
  })

  it('returns first tick index for coordinate before all ticks', () => {
    expect(calculateActiveTickIndex(-50, ticks, ticks, undefined, undefined)).toBe(0)
  })

  it('returns last tick index for coordinate after all ticks', () => {
    expect(calculateActiveTickIndex(350, ticks, ticks, undefined, undefined)).toBe(3)
  })

  it('finds middle tick correctly', () => {
    // coordinate 160 is between tick[1]=100 and tick[2]=200, midpoints at 150 and 250
    expect(calculateActiveTickIndex(160, ticks, ticks, undefined, undefined)).toBe(2)
  })
})

describe('getActiveCoordinate', () => {
  const tooltipTicks: TickItem[] = [
    { coordinate: 50, value: 'a', index: 0, offset: 0 },
    { coordinate: 150, value: 'b', index: 1, offset: 0 },
  ]

  it('returns x,y for horizontal layout', () => {
    const result = getActiveCoordinate('horizontal', tooltipTicks, 0, { y: 100 })
    expect(result).toEqual({ x: 50, y: 100 })
  })

  it('returns x,y for vertical layout', () => {
    const result = getActiveCoordinate('vertical', tooltipTicks, 1, { x: 80 })
    expect(result).toEqual({ x: 80, y: 150 })
  })

  it('returns origin when no matching tick', () => {
    const result = getActiveCoordinate('horizontal', tooltipTicks, 99, { y: 100 })
    expect(result).toEqual({ x: 0, y: 0 })
  })
})

describe('inRange', () => {
  const offset = { left: 10, top: 10, width: 100, height: 100 }

  it('returns coordinates when point is inside for horizontal layout', () => {
    const result = inRange(50, 50, 'horizontal', undefined, offset)
    expect(result).toEqual({ x: 50, y: 50 })
  })

  it('returns null when point is outside for horizontal layout', () => {
    expect(inRange(5, 50, 'horizontal', undefined, offset)).toBeNull()
    expect(inRange(50, 5, 'horizontal', undefined, offset)).toBeNull()
    expect(inRange(120, 50, 'horizontal', undefined, offset)).toBeNull()
    expect(inRange(50, 120, 'horizontal', undefined, offset)).toBeNull()
  })

  it('works the same for vertical layout', () => {
    expect(inRange(50, 50, 'vertical', undefined, offset)).toEqual({ x: 50, y: 50 })
    expect(inRange(5, 50, 'vertical', undefined, offset)).toBeNull()
  })
})

describe('getDomainOfStackGroups', () => {
  it('returns undefined for null/undefined input', () => {
    expect(getDomainOfStackGroups(undefined, 0, 2)).toBeUndefined()
    expect(getDomainOfStackGroups(null as any, 0, 2)).toBeUndefined()
  })

  it('computes domain from stacked data', () => {
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
  })

  it('handles negative values', () => {
    const stackGroups = {
      s1: {
        stackedData: [
          [[-10, 5], [0, 20]],
        ],
      },
    } as any
    const result = getDomainOfStackGroups(stackGroups, 0, 1)
    expect(result).toEqual([-10, 20])
  })

  it('replaces Infinity with 0', () => {
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
  })
})

describe('getBaseValueOfBar', () => {
  it('returns 0 when domain spans zero for number axis', () => {
    const axis = { type: 'number', scale: { domain: () => [-10, 50] } } as any
    expect(getBaseValueOfBar({ numericAxis: axis })).toBe(0)
  })

  it('returns maxValue when domain is all negative', () => {
    const axis = { type: 'number', scale: { domain: () => [-100, -10] } } as any
    expect(getBaseValueOfBar({ numericAxis: axis })).toBe(-10)
  })

  it('returns minValue when domain is all positive', () => {
    const axis = { type: 'number', scale: { domain: () => [10, 100] } } as any
    expect(getBaseValueOfBar({ numericAxis: axis })).toBe(10)
  })

  it('returns first domain value for non-number axis', () => {
    const axis = { type: 'category', scale: { domain: () => ['a', 'b'] } } as any
    expect(getBaseValueOfBar({ numericAxis: axis })).toBe('a')
  })
})

describe('getCateCoordinateOfBar', () => {
  const ticks: TickItem[] = [
    { coordinate: 10, value: 'a', index: 0, offset: 0 },
    { coordinate: 50, value: 'b', index: 1, offset: 0 },
  ]

  it('returns coordinate + offset for category axis', () => {
    const axis = { type: 'category' } as any
    expect(getCateCoordinateOfBar({ axis, ticks, offset: 5, bandSize: 20, entry: {}, index: 0 })).toBe(15)
  })

  it('returns null when tick does not exist at index for category axis', () => {
    const axis = { type: 'category' } as any
    expect(getCateCoordinateOfBar({ axis, ticks, offset: 5, bandSize: 20, entry: {}, index: 5 })).toBeNull()
  })

  it('uses scale for non-category axis', () => {
    const scale = (v: number) => v * 2
    scale.domain = () => [0, 100]
    const axis = { type: 'number', scale, dataKey: 'v' } as any
    const result = getCateCoordinateOfBar({ axis, ticks, offset: 5, bandSize: 20, entry: { v: 25 }, index: 0 })
    // scale(25) - bandSize/2 + offset = 50 - 10 + 5 = 45
    expect(result).toBe(45)
  })
})

describe('getCateCoordinateOfLine', () => {
  const ticks: TickItem[] = [
    { coordinate: 0, value: 'Mon', index: 0, offset: 0 },
    { coordinate: 100, value: 'Tue', index: 1, offset: 0 },
    { coordinate: 200, value: 'Wed', index: 2, offset: 0 },
  ]

  it('returns coordinate + bandSize/2 by index for category axis', () => {
    const axis = { type: 'category', scale: (v: number) => v } as any
    const result = getCateCoordinateOfLine({ axis, ticks: ticks as any, bandSize: 20, entry: {} as any, index: 1 })
    expect(result).toBe(110) // 100 + 20/2
  })

  it('returns null when tick at index does not exist', () => {
    const axis = { type: 'category', scale: (v: number) => v } as any
    const result = getCateCoordinateOfLine({ axis, ticks: ticks as any, bandSize: 20, entry: {} as any, index: 10 })
    expect(result).toBeNull()
  })

  it('uses scale for non-category axis', () => {
    const scale = (v: number) => v * 3
    const axis = { type: 'number', scale, dataKey: 'val' } as any
    const result = getCateCoordinateOfLine({ axis, ticks: ticks as any, bandSize: 20, entry: { val: 10 } as any, index: 0 })
    expect(result).toBe(30) // scale(10) = 30
  })

  it('uses matched tick for category axis with allowDuplicatedCategory=false', () => {
    const axis = { type: 'category', allowDuplicatedCategory: false, dataKey: 'day', scale: (v: number) => v } as any
    const entry = { day: 'Tue' }
    const result = getCateCoordinateOfLine({ axis, ticks: ticks as any, bandSize: 20, entry: entry as any, index: 0 })
    // Matches tick 'Tue' at coordinate 100, returns 100 + 10 = 110
    expect(result).toBe(110)
  })
})

describe('offsetSign', () => {
  it('separates positive and negative stacks', () => {
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
  })

  it('handles empty series', () => {
    expect(getStackedData([], ['a', 'b'], 'sign').map(series => series.length)).toEqual([0, 0])
  })
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
