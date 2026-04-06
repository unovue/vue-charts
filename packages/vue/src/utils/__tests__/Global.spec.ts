import { describe, expect, it } from 'vitest'
import { Global } from '@/utils/Global'

describe('global', () => {
  it('exposes isSsr with a boolean default', () => {
    expect(typeof Global.isSsr).toBe('boolean')
  })

  it('get returns the current value', () => {
    const before = Global.isSsr
    expect(Global.get('isSsr')).toBe(before)
  })

  it('set accepts a (key, value) pair', () => {
    const before = Global.isSsr
    Global.set('isSsr', true)
    expect(Global.isSsr).toBe(true)
    Global.set('isSsr', false)
    expect(Global.isSsr).toBe(false)
    Global.set('isSsr', before)
  })

  it('set accepts a GlobalConfig object and merges keys', () => {
    const before = Global.isSsr
    Global.set({ isSsr: true })
    expect(Global.isSsr).toBe(true)
    Global.set({ isSsr: false })
    expect(Global.isSsr).toBe(false)
    Global.set({ isSsr: before })
  })
})
