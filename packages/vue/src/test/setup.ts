import { cleanup } from '@testing-library/vue'
import { afterEach, vi } from 'vitest'
import { restoreHTMLElementProperties } from './mockHTMLElementProperty'

afterEach(() => {
  cleanup()
  restoreHTMLElementProperties()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})
