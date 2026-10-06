/* eslint no-console: 0 */
import type { App } from 'vue'
import { getCurrentInstance } from 'vue'

const isDev = process.env.NODE_ENV !== 'production'

export function warn(condition: boolean, format: string, ...args: unknown[]) {
  if (isDev && typeof console !== 'undefined' && console.warn) {
    if (format === undefined) {
      console.warn('LogUtils requires an error message argument')
    }

    if (!condition) {
      if (format === undefined) {
        console.warn(
          'Minified exception occurred; use the non-minified dev environment '
          + 'for the full error message and additional helpful warnings.',
        )
      }
      else {
        let argIndex = 0

        console.warn(format.replace(/%s/g, () => String(args[argIndex++])))
      }
    }
  }
}

const appWarnings = new WeakMap<App, Set<string>>()

export function warnOnce(message: string) {
  if (!isDev)
    return
  const app = getCurrentInstance()?.appContext.app
  if (!app)
    return
  let messages = appWarnings.get(app)
  if (!messages) {
    messages = new Set()
    appWarnings.set(app, messages)
  }
  if (!messages.has(message)) {
    messages.add(message)
    warn(false, message)
  }
}
