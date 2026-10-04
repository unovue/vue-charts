import type { InjectionKey, Ref } from 'vue'
import { getCurrentInstance, inject, onMounted, provide, ref, ssrContextKey } from 'vue'

const entranceGateKey: InjectionKey<Readonly<Ref<boolean>>> = Symbol('v-charts-entrance-gate')

/** Vue's server renderer provides an SSR context to the app; a client app has none. */
function isServerRender(): boolean {
  return inject(ssrContextKey, null) != null
}

/**
 * Called by every chart root. Entrance animations must not run when the chart's content is
 * already visible: on the server (the HTML must show the final chart) and while hydrating
 * server HTML (replaying the entrance would make the chart vanish and regrow).
 *
 * The gate stays closed until the first frame after mount, because series move into their
 * teleported layers right after mount and re-create their animated children.
 */
export function provideEntranceGate() {
  const server = isServerRender()
  // During hydration Vue assigns the existing DOM node to the vnode before setup runs.
  const skip = ref(server || getCurrentInstance()?.vnode.el != null)
  if (skip.value && !server) {
    onMounted(() => requestAnimationFrame(() => {
      skip.value = false
    }))
  }
  provide(entranceGateKey, skip)
}

/** True when an element created now must appear in its final state. Call during setup. */
export function shouldSkipEntrance(): boolean {
  return isServerRender() || (inject(entranceGateKey, null)?.value ?? false)
}
