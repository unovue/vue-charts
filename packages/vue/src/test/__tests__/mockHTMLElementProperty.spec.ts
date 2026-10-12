import { describe, expect, it } from 'vitest'
import { mockHTMLElementProperty, restoreHTMLElementProperties } from '../mockHTMLElementProperty'

describe('measurement cleanup', () => {
  it('restores the original descriptor after repeated overrides', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
    mockHTMLElementProperty('offsetWidth', 100)
    mockHTMLElementProperty('offsetWidth', 200)
    expect(document.createElement('div').offsetWidth).toBe(200)

    restoreHTMLElementProperties()

    expect(Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')).toEqual(originalDescriptor)
    restoreHTMLElementProperties()
    expect(Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')).toEqual(originalDescriptor)
  })
})
