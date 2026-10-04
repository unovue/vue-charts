import type { InjectionKey, Ref } from 'vue'
import { Global } from '@/utils/Global'
import { computed, getCurrentInstance, hasInjectionContext, inject, onMounted, provide, ref, ssrContextKey } from 'vue'

const renderPhaseKey: InjectionKey<Readonly<Ref<boolean>>> = Symbol('v-charts-render-phase')
const chartSizeKey: InjectionKey<() => string | undefined> = Symbol('v-charts-size')

/**
 * Called by the chart root with its settled size (undefined until a responsive chart has measured
 * its box). Motion uses it to tell a resize from a data change.
 */
export function provideChartSize(size: () => string | undefined) {
  provide(chartSizeKey, size)
}

/** The chart's settled size, as an opaque string; changes only when the chart is resized. */
export function useChartSize(): () => string | undefined {
  return hasInjectionContext() ? inject(chartSizeKey, () => undefined) : () => undefined
}

/** Vue's server renderer provides an SSR context to the app; a client app has none. */
function isServerRender(): boolean {
  return inject(ssrContextKey, null) != null
}

/**
 * Called by every chart root. Entrance animations must not run when the chart's content is
 * already visible: on the server (the HTML must show the final chart) and while hydrating
 * server HTML (replaying the entrance would make the chart vanish and regrow).
 *
 * Text measurement also waits so hydration reproduces the server layout before relayout.
 * The gate stays closed until the first frame after mount, because series move into their
 * teleported layers right after mount and re-create their animated children.
 */
export function provideRenderPhase() {
  const server = isServerRender()
  // During hydration Vue assigns the existing DOM node to the vnode before setup runs.
  const skip = ref(server || getCurrentInstance()?.vnode.el != null)
  if (skip.value && !server) {
    onMounted(() => requestAnimationFrame(() => {
      skip.value = false
    }))
  }
  provide(renderPhaseKey, skip)
}

/** True when an element created now must appear in its final state. Call during setup. */
export function shouldSkipEntrance(): boolean {
  return isServerRender() || (inject(renderPhaseKey, null)?.value ?? false)
}

/** Reactive permission for DOM text measurement. Call during setup. */
export function useCanMeasureText() {
  const phase = inject(renderPhaseKey, null)
  return computed(() => phase ? !phase.value : !Global.isSsr)
}
