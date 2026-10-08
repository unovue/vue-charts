import { app } from './fixture.mjs'

globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true

globalThis.rowClicks = []
globalThis.nodeClicks = []
globalThis.hydrate = () => {
  const instance = app(globalThis.chartName, globalThis.variant)
  instance.mount('#host')
  globalThis.ready = true
}
