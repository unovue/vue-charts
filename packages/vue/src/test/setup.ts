import { afterEach, vi } from 'vitest'
import { restoreHTMLElementProperties } from './mockHTMLElementProperty'
import { clearStringSizeCache } from '@/utils/attrs'

afterEach(() => {
  restoreHTMLElementProperties()
  vi.useRealTimers()
  // Text measurements stubbed in one test must not leak into the next through the size cache.
  clearStringSizeCache()
})
