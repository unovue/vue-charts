import { useIntersectionObserver } from '@vueuse/core'
import { useChartId } from '@/hooks/useChartId'
import type { CategoricalChartProps } from '@/types'
import type { InjectionKey, Ref } from 'vue'
import { isServer } from '@/utils/env'
import { computed, getCurrentInstance, hasInjectionContext, inject, onMounted, onScopeDispose, provide, ref, ssrContextKey } from 'vue'

interface ChartRuntime {
  readonly renderPhase: Readonly<Ref<boolean>>
  readonly seriesMotion: Set<() => boolean>
  readonly gesture: Ref<boolean>
}

const runtimeKey: InjectionKey<ChartRuntime> = Symbol('v-charts-runtime')
// Size, visibility, portals and layers retain their contributing component scopes.
const chartSizeKey: InjectionKey<() => string | null | undefined> = Symbol('v-charts-size')
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
  const { resume, stop } = useIntersectionObserver(() => {
    const element = el.value
    return element && (element instanceof HTMLElement || element instanceof SVGElement) ? element : null
  }, (entries) => {
    const entry = entries.at(-1)!
    const viewport = entry.rootBounds?.height ?? window.innerHeight
    if (entry.isIntersecting && (entry.intersectionRatio >= 0.5 || entry.intersectionRect.height >= viewport / 2)) {
      inView.value = true
      stop()
    }
  }, { immediate: false, threshold: [0, 0.25, 0.5, 0.75, 1] })
  onMounted(() => {
    if (inView.value || !el.value) {
      inView.value = true
      return
    }
    resume()
  })
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
  return (hasInjectionContext() ? inject(runtimeKey, null)?.gesture : null) ?? ref(false)
}

/**
 * Whether the chart's series animate. Each animated series registers its `isActive`; axes and
 * grids move only when at least one series does, so turning animation off on the series keeps
 * the whole chart still.
 */
export function useSeriesMotion() {
  const registry = hasInjectionContext() ? inject(runtimeKey, null)?.seriesMotion : null
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
 * `null` while a responsive chart has not measured itself yet.
 */
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
  provide(runtimeKey, { renderPhase: skip, seriesMotion: new Set<() => boolean>(), gesture: ref(false) })
}

/** True during server rendering or the first hydration frame. Call during setup. */
export function shouldSkipEntrance(): boolean {
  return isServerRender() || (inject(runtimeKey, null)?.renderPhase.value ?? false)
}

/** Reactive permission for DOM text measurement. Call during setup. */
export function useCanMeasureText() {
  const phase = inject(runtimeKey, null)?.renderPhase
  return computed(() => phase ? !phase.value : !isServer())
}

const clipPathKey: InjectionKey<string> = Symbol('v-charts-clip-path')

export function useClipPathId() {
  const value = inject(clipPathKey)
  if (value === undefined)
    throw new Error('vccs: clip paths require a chart runtime.')
  return value
}

const tooltipPortalKey: InjectionKey<Ref<HTMLElement | null>> = Symbol('v-charts-tooltip-portal')

export function providePortalRaw(value: Ref<HTMLElement | null>) {
  provide(tooltipPortalKey, value)
  return value
}

export function usePortal(fallback?: Ref<HTMLElement | null>): Ref<HTMLElement | null>
export function usePortal(fallback: Ref<HTMLElement | null> | null): Ref<HTMLElement | null> | null
export function usePortal(fallback?: Ref<HTMLElement | null> | null) {
  const value = inject(tooltipPortalKey, fallback)
  if (value === undefined)
    throw new Error('vccs: tooltip-portal requires a chart runtime.')
  return value
}

const legendPortalKey: InjectionKey<Ref<HTMLElement | null>> = Symbol('v-charts-legend-portal')

export function provideLegendPortalRaw(value: Ref<HTMLElement | null>) {
  provide(legendPortalKey, value)
  return value
}

export function useLegendPortal(fallback?: Ref<HTMLElement | null>): Ref<HTMLElement | null>
export function useLegendPortal(fallback: Ref<HTMLElement | null> | null): Ref<HTMLElement | null> | null
export function useLegendPortal(fallback?: Ref<HTMLElement | null> | null) {
  const value = inject(legendPortalKey, fallback)
  if (value === undefined)
    throw new Error('vccs: legend-portal requires a chart runtime.')
  return value
}

const cursorLayerKey: InjectionKey<Ref<SVGGElement | null>> = Symbol('v-charts-cursor-layer')

export function provideCursorLayerRef(value: Ref<SVGGElement | null>) {
  provide(cursorLayerKey, value)
  return value
}

export function useCursorLayerRef(fallback?: Ref<SVGGElement | null>): Ref<SVGGElement | null>
export function useCursorLayerRef(fallback: Ref<SVGGElement | null> | null): Ref<SVGGElement | null> | null
export function useCursorLayerRef(fallback?: Ref<SVGGElement | null> | null) {
  const value = inject(cursorLayerKey, fallback)
  if (value === undefined)
    throw new Error('vccs: cursor-layer requires a chart runtime.')
  return value
}

const graphicalLayerKey: InjectionKey<Ref<SVGGElement | null>> = Symbol('v-charts-graphical-layer')

export function provideGraphicalLayerRef(value: Ref<SVGGElement | null>) {
  provide(graphicalLayerKey, value)
  return value
}

export function useGraphicalLayerRef(fallback?: Ref<SVGGElement | null>): Ref<SVGGElement | null>
export function useGraphicalLayerRef(fallback: Ref<SVGGElement | null> | null): Ref<SVGGElement | null> | null
export function useGraphicalLayerRef(fallback?: Ref<SVGGElement | null> | null) {
  const value = inject(graphicalLayerKey, fallback)
  if (value === undefined)
    throw new Error('vccs: graphical-layer requires a chart runtime.')
  return value
}

const labelLayerKey: InjectionKey<Ref<SVGGElement | null>> = Symbol('v-charts-label-layer')

export function provideLabelLayerRef(value: Ref<SVGGElement | null>) {
  provide(labelLayerKey, value)
  return value
}

export function useLabelLayerRef(fallback?: Ref<SVGGElement | null>): Ref<SVGGElement | null>
export function useLabelLayerRef(fallback: Ref<SVGGElement | null> | null): Ref<SVGGElement | null> | null
export function useLabelLayerRef(fallback?: Ref<SVGGElement | null> | null) {
  const value = inject(labelLayerKey, fallback)
  if (value === undefined)
    throw new Error('vccs: label-layer requires a chart runtime.')
  return value
}

/** Create the chart's SSR-stable clip-path id. */
export function provideClipPathId(props: CategoricalChartProps) {
  const generatedId = useChartId('v-charts')
  const clipPathId = `${props.id ?? generatedId}-clip`
  provide(clipPathKey, clipPathId)
  return clipPathId
}
