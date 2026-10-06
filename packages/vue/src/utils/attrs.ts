import type { Size } from '@/types'
import { isServer } from '@/utils/env'
import type { CSSProperties } from 'vue'

// Measured sizes by style and text. Category axes with thousands of labels measure every label,
// so the cache must hold them all, and a full cache drops its oldest quarter instead of
// everything (which made every update re-measure every label).
const MAX_CACHE_NUM = 20000
const sizeCache = new Map<string, Size>()
const styleKeys = new WeakMap<object, string>()
let appliedStyleKey: string | undefined

const SPAN_STYLE = {
  position: 'absolute',
  top: '-20000px',
  left: '0px',
  padding: '0px',
  margin: '0px',
  border: 'none',
  whiteSpace: 'pre',
}
const MEASUREMENT_SPAN_ID = 'v-charts_measurement_span'

function removeInvalidKeys(obj: Record<string, any>) {
  const copyObj = { ...obj }
  Object.keys(copyObj).forEach((key) => {
    if (!copyObj[key]) {
      delete copyObj[key]
    }
  })
  return copyObj
}

function styleKeyOf(style: CSSProperties): string {
  let key = styleKeys.get(style)
  if (key === undefined) {
    key = JSON.stringify(removeInvalidKeys(style))
    styleKeys.set(style, key)
  }
  return key
}

/** Test isolation only: measurements stubbed in one test must not leak into the next. */
export function clearStringSizeCache() {
  sizeCache.clear()
  appliedStyleKey = undefined
}

export function getStringSize(text: string | number, style: CSSProperties = {}, canMeasure = !isServer()): Size {
  if (text === undefined || text === null || !canMeasure) {
    return { width: 0, height: 0 }
  }

  const styleKey = styleKeyOf(style)
  const cacheKey = `${styleKey}\u0000${text}`
  const cached = sizeCache.get(cacheKey)
  if (cached) {
    return cached
  }

  try {
    let measurementSpan = document.getElementById(MEASUREMENT_SPAN_ID)
    if (!measurementSpan) {
      measurementSpan = document.createElement('span')
      measurementSpan.setAttribute('id', MEASUREMENT_SPAN_ID)
      measurementSpan.setAttribute('aria-hidden', 'true')
      document.body.appendChild(measurementSpan)
      appliedStyleKey = undefined
    }
    // Need to use CSS Object Model (CSSOM) to be able to comply with Content Security Policy (CSP)
    // https://en.wikipedia.org/wiki/Content_Security_Policy
    if (appliedStyleKey !== styleKey) {
      measurementSpan.removeAttribute('style')
      Object.assign(measurementSpan.style, { ...SPAN_STYLE, ...removeInvalidKeys(style) })
      appliedStyleKey = styleKey
    }

    measurementSpan.textContent = `${text}`

    const rect = measurementSpan.getBoundingClientRect()
    const result = { width: rect.width, height: rect.height }

    if (sizeCache.size >= MAX_CACHE_NUM) {
      let drop = MAX_CACHE_NUM / 4
      for (const key of sizeCache.keys()) {
        sizeCache.delete(key)
        if (--drop <= 0)
          break
      }
    }
    sizeCache.set(cacheKey, result)

    return result
  }
  catch {
    return { width: 0, height: 0 }
  }
}
