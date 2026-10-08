import { describe, expect, it } from 'vitest'
import { VccsResolver } from '../resolver'
import { componentNames } from '../componentNames'

describe('vccsResolver', () => {
  it.each(['', 'Vc'])('resolves every public component with prefix "%s"', (prefix) => {
    const resolver = VccsResolver({ prefix })
    if (typeof resolver === 'function')
      throw new TypeError('Expected a component resolver object')
    for (const name of componentNames) {
      expect(resolver.resolve(prefix + name)).toEqual({ name, from: 'vccs' })
    }
    expect(resolver.resolve(`${prefix}NotAChart`)).toBeUndefined()
    expect(resolver.resolve(`${prefix}useChartWidth`)).toBeUndefined()
    if (prefix)
      expect(resolver.resolve('BarChart')).toBeUndefined()
  })

  it('uses unprefixed names by default', () => {
    const resolver = VccsResolver()
    if (typeof resolver === 'function')
      throw new TypeError('Expected a component resolver object')
    expect(resolver.resolve('BarChart')).toEqual({ name: 'BarChart', from: 'vccs' })
  })
})
