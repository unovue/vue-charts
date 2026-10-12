import { expect, it, vi } from 'vitest'
import { getStringSize } from '../attrs'

// A category axis with thousands of labels re-measured every label on every update, because the
// cache was cleared whenever it exceeded 2,000 entries.
it('keeps measurements of thousands of labels instead of clearing them', () => {
  const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 10, 10))
  const style = { fontSize: 12 }
  for (let i = 0; i < 5000; i++)
    getStringSize(`label-${i}`, style, true)
  rect.mockClear()
  for (let i = 0; i < 5000; i++)
    getStringSize(`label-${i}`, style, true)
  expect(rect).not.toHaveBeenCalled()
})
