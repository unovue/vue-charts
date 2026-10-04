import { describe, expect, it } from 'vitest'
import { interpolate } from '@/utils/data-utils'

describe('interpolate', () => {
  it('interpolates between two numbers', () => {
    expect(interpolate(0, 10, 0.5)).toBe(5)
    expect(interpolate(10, 20, 0.25)).toBe(12.5)
  })

  it('returns start when t=0', () => {
    expect(interpolate(0, 100, 0)).toBe(0)
    expect(interpolate(50, 200, 0)).toBe(50)
  })

  it('returns end when t=1', () => {
    expect(interpolate(0, 100, 1)).toBe(100)
    expect(interpolate(50, 200, 1)).toBe(200)
  })

  it('returns end when start is not a number', () => {
    expect(interpolate('foo', 10, 0.5)).toBe(10)
    expect(interpolate(null, 20, 0.5)).toBe(20)
    expect(interpolate(undefined, 30, 0.5)).toBe(30)
  })

  it('returns null when end is null', () => {
    expect(interpolate(0, null, 0.5)).toBeNull()
    expect(interpolate('foo', null, 0.5)).toBeNull()
  })
})
