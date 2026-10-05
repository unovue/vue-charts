import type { InjectionKey, Ref } from 'vue'
import { Global } from '@/utils/Global'
import { computed, getCurrentInstance, hasInjectionContext, inject, onMounted, onScopeDispose, provide, ref, ssrContextKey } from 'vue'

const renderPhaseKey: InjectionKey<Readonly<Ref<boolean>>> = Symbol('v-charts-render-phase')
const chartSizeKey: InjectionKey<() => string | null | undefined> = Symbol('v-charts-size')
const seriesMotionKey: InjectionKey<Set<() => boolean>> = Symbol('v-charts-series-motion')
const gestureKey: InjectionKey<Ref<boolean>> = Symbol('v-charts-gesture')
const inViewKey: InjectionKey<Readonly<Ref<boolean>>> = Symbol('v-charts-in-view')

/**
 * Called by the chart's root: watches `el` and tells entrances once the chart is on screen, so a
 * chart further down the page plays its entrance when the reader gets there, not unseen at load.
 * On screen means half the chart is visible, or half the viewport for a chart taller than that: a
 * chart peeking in at the bottom edge would play its entrance mostly unseen. Without
 * IntersectionObserver (tests, old browsers) the chart counts as seen.
 */
export function provideChartInView(el: Readonly<Ref<Element | null | undefined>>) {
  const inView = ref(typeof IntersectionObserver === 'undefined')
  provide(inViewKey, inView)
  let observer: IntersectionObserver | undefined
  onMounted(() => {
    if (inView.value || !el.value) {
      inView.value = true
      return
    }
    observer = new IntersectionObserver((entries) => {
      const entry = entries.at(-1)!
      const viewport = entry.rootBounds?.height ?? window.innerHeight
      if (entry.isIntersecting && (entry.intersectionRatio >= 0.5 || entry.intersectionRect.height >= viewport / 2)) {
        inView.value = true
        observer?.disconnect()
      }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] })
    observer.observe(el.value)
  })
  onScopeDispose(() => observer?.disconnect())
}

/** Whether the chart has been on screen; always true outside a chart. */
export function useChartInView(): Readonly<Ref<boolean>> {
  return (hasInjectionContext() ? inject(inViewKey, null) : null) ?? ref(true)
}

/**
 * True while the user drags something that changes the chart continuously (a brush). Like a
 * resize, the chart then follows the pointer directly instead of trailing it.
 */
export function useChartGesture(): Ref<boolean> {
  return (hasInjectionContext() ? inject(gestureKey, null) : null) ?? ref(false)
}

/**
 * Whether the chart's series animate. Each animated series registers its `isActive`; axes and
 * grids move only when at least one series does, so turning animation off on the series keeps
 * the whole chart still.
 */
export function useSeriesMotion() {
  const registry = hasInjectionContext() ? inject(seriesMotionKey, null) : null
  return {
    register(isActive: () => boolean) {
      registry?.add(isActive)
      if (registry && getCurrentInstance())
        onScopeDispose(() => registry.delete(isActive))
    },
    anyActive: () => registry != null && [...registry].some(isActive => isActive()),
  }
}

/**
 * Called by the chart root with its settled size (undefined until a responsive chart has measured
 * its box). Motion uses it to tell a resize from a data change.
 */
/** `null` while a responsive chart has not measured itself yet. */
export function provideChartSize(size: () => string | null) {
  provide(chartSizeKey, size)
}

/**
 * The chart's settled size, as an opaque string; changes only when the chart is resized.
 * `null` while a responsive chart has not measured itself, `undefined` outside a chart.
 */
export function useChartSize(): () => string | null | undefined {
  return hasInjectionContext() ? inject(chartSizeKey, () => undefined) : () => undefined
}

/** Vue's server renderer provides an SSR context to the app; a client app has none. */
export function isServerRender(): boolean {
  return inject(ssrContextKey, null) != null
}

/**
 * Called by every chart root. The server sends the entrance start; hydration preserves that
 * geometry. The entrance plays after hydration when the chart is measured and on screen.
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
  provide(seriesMotionKey, new Set())
  provide(gestureKey, ref(false))
}

/** True during server rendering or the first hydration frame. Call during setup. */
export function shouldSkipEntrance(): boolean {
  return isServerRender() || (inject(renderPhaseKey, null)?.value ?? false)
}

/** Reactive permission for DOM text measurement. Call during setup. */
export function useCanMeasureText() {
  const phase = inject(renderPhaseKey, null)
  return computed(() => phase ? !phase.value : !Global.isSsr)
}
